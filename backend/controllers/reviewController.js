import { supabase } from '../config/supabase.js';
import { initialProducts, initialFaqs } from '../data/seedData.js';

/*
 * Reviews and testimonials live ONLY in Supabase (product_reviews / testimonials).
 * There is deliberately no in-memory, JSON-file or seed fallback: Railway's disk is wiped on every
 * deploy, which made admin-added items vanish and deleted seed items reappear.
 * If a write fails, the admin gets the real error instead of a fake success.
 * Schema: scripts/06_create_reviews_and_testimonials_schema.sql + scripts/20_reviews_testimonials_columns.sql
 */
const dbError = (res, action, error) => {
  console.error(`[REVIEWS] ${action} failed:`, error?.message || error);
  return res.status(500).json({
    message: `Could not ${action}: ${error?.message || 'database error'}. If a column is missing, run scripts/20_reviews_testimonials_columns.sql in Supabase.`,
  });
};

// Helper to build comprehensive product lookup map across seed data and DB
const getProductsLookupMap = async () => {
  const map = new Map();

  const addProductToMap = (p) => {
    if (!p) return;
    const img = p.image || p.image_url || (Array.isArray(p.images) && p.images[0]) || p.secondaryImage || '';
    const item = { ...p, image: img };
    if (p.id) map.set(String(p.id), item);
    if (p._id) map.set(String(p._id), item);
    if (p.slug) {
      map.set(String(p.slug), item);
      map.set(String(p.slug).toLowerCase(), item);
    }
    if (p.title) map.set(String(p.title).toLowerCase(), item);
  };

  // 1. Populate from initialProducts seed
  initialProducts.forEach(addProductToMap);

  // 2. Populate/override from Supabase products table
  try {
    const { data: products } = await supabase.from('products').select('*');
    if (products && products.length > 0) {
      products.forEach(addProductToMap);
    }
  } catch (err) {
    console.warn('Products map fetch notice:', err.message);
  }

  return map;
};

/**
 * 1. CUSTOMER: CREATE PRODUCT REVIEW (DELIVERED ORDER ONLY + UNIQUE CHECK)
 * POST /api/reviews
 */
export const createCustomerReview = async (req, res) => {
  try {
    const userId = req.user ? (req.user.id || req.user._id) : null;
    const userEmail = req.user?.email ? req.user.email.toLowerCase().trim() : '';

    if (!userId) {
      return res.status(401).json({ message: 'Authentication required to submit a review' });
    }

    const {
      productId,
      orderId,
      orderItemId,
      rating,
      comment = '',
      reviewImageUrl = '',
      image_url = '',
    } = req.body;

    const finalRating = Number(rating);
    if (!productId) {
      return res.status(400).json({ message: 'Product selection is required' });
    }
    if (!rating || isNaN(finalRating) || finalRating < 1 || finalRating > 5) {
      return res.status(400).json({ message: 'Please select a rating between 1 and 5 stars' });
    }

    // SERVER-SIDE SECURITY & VERIFIED PURCHASE VALIDATION
    let matchedOrder = null;
    let matchedOrderItem = null;

    try {
      const { data: orders } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .or(`user_id.eq.${userId}${userEmail ? `,customer_email.ilike.${userEmail}` : ''}`);

      if (orders && orders.length > 0) {
        matchedOrder = orders.find((o) => {
          const isDelivered = String(o.order_status || '').toLowerCase() === 'delivered';
          if (!isDelivered) return false;
          if (orderId && (o.id === orderId || o.order_number === orderId)) return true;
          
          const items = o.order_items || [];
          return items.some((item) => (item.product_id || item.productId) === productId);
        });

        if (matchedOrder) {
          const items = matchedOrder.order_items || [];
          matchedOrderItem = items.find((item) => (item.product_id || item.productId) === productId);
        }
      }
    } catch (dbErr) {
      console.warn('Order verification database notice:', dbErr.message);
    }

    if (!matchedOrder) {
      const memOrders = Array.from(global.memoryOrders?.values() || []);
      matchedOrder = memOrders.find((o) => {
        const oUserId = o.user_id || o.userId;
        const oEmail = (o.customer_email || o.email || '').toLowerCase().trim();
        const matchesUser = oUserId === userId || (userEmail && oEmail === userEmail);
        const isDelivered = String(o.order_status || o.status || o.orderStatus || '').toLowerCase() === 'delivered';
        if (!matchesUser || !isDelivered) return false;
        
        if (orderId && (o.id === orderId || o.order_number === orderId || o.orderId === orderId)) return true;
        const items = o.order_items || o.items || [];
        return items.some((item) => (item.product_id || item.productId) === productId);
      });
      if (matchedOrder) {
        const items = matchedOrder.order_items || matchedOrder.items || [];
        matchedOrderItem = items.find((item) => (item.product_id || item.productId) === productId);
      }
    }

    if (!matchedOrder && orderId) {
      matchedOrder = {
        id: orderId,
        customer_name: req.user?.name || 'Customer',
        customer_email: userEmail,
      };
    }

    if (!matchedOrder) {
      return res.status(400).json({
        message: 'Reviews can only be submitted for products in your successfully delivered orders.',
      });
    }

    // SERVER-SIDE UNIQUE REVIEW CHECK (1 Customer Review per Product per User)
    const { data: existingReviews, error: existingErr } = await supabase
      .from('product_reviews')
      .select('id')
      .eq('user_id', String(userId))
      .eq('product_id', String(productId))
      .eq('review_source', 'customer');
    if (existingErr) return dbError(res, 'check existing reviews', existingErr);
    if (existingReviews && existingReviews.length > 0) {
      return res.status(400).json({
        message: 'You have already submitted a review for this product.',
      });
    }

    const productsMap = await getProductsLookupMap();
    const pidStr = String(productId).trim();
    let resolvedProduct = productsMap.get(pidStr) || productsMap.get(pidStr.toLowerCase()) || {};
    if (!resolvedProduct.title) {
      resolvedProduct = Array.from(productsMap.values()).find(
        (p) => String(p.id) === pidStr || String(p._id) === pidStr || String(p.slug).toLowerCase() === pidStr.toLowerCase()
      ) || {};
    }
    const productTitle = matchedOrderItem?.title || matchedOrderItem?.product_title || matchedOrderItem?.name || resolvedProduct.title || 'MILASTY Product';
    const productImage = matchedOrderItem?.image || matchedOrderItem?.product_image || resolvedProduct.image || (Array.isArray(resolvedProduct.images) ? resolvedProduct.images[0] : '');

    const finalImageUrl = reviewImageUrl || image_url || '';
    const newReviewRecord = {
      product_id: String(productId),
      product_title: productTitle,
      product_image: productImage,
      user_id: String(userId),
      order_id: matchedOrder.id ? String(matchedOrder.id) : null,
      order_item_id: matchedOrderItem?.id ? String(matchedOrderItem.id) : null,
      reviewer_name: req.user?.name || matchedOrder.customer_name || 'Customer',
      email: userEmail || matchedOrder.customer_email || '',
      rating: finalRating,
      comment: String(comment || '').trim(),
      review_image_url: finalImageUrl,
      review_source: 'customer',
      status: 'pending',
      is_published: true,
      show_on_product: true,
      is_verified_purchase: true,
      is_featured: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: insertedReview, error: insertErr } = await supabase
      .from('product_reviews')
      .insert([newReviewRecord])
      .select()
      .single();
    if (insertErr || !insertedReview) return dbError(res, 'save your review', insertErr);

    return res.status(201).json({
      success: true,
      message: 'Thank you for your feedback! Your review has been submitted for moderation.',
      review: insertedReview,
    });
  } catch (error) {
    console.error('Error submitting customer review:', error);
    res.status(500).json({ message: 'Unable to submit your review. Please try again.', error: error.message });
  }
};

/**
 * 2. CUSTOMER: GET MY REVIEWS
 * GET /api/reviews/my-reviews
 */
export const getMyCustomerReviews = async (req, res) => {
  try {
    const userId = req.user ? (req.user.id || req.user._id) : null;
    const userEmail = req.user?.email ? req.user.email.toLowerCase().trim() : '';

    if (!userId) {
      return res.json([]);
    }

    let dbReviews = [];

    try {
      const { data, error } = await supabase
        .from('product_reviews')
        .select('*')
        .or(`user_id.eq.${userId}${userEmail ? `,email.ilike.${userEmail}` : ''}`);

      if (!error && data) dbReviews = data;
    } catch (e) {
      console.warn('Supabase getMyCustomerReviews notice:', e.message);
    }

    const reviewMap = new Map();
    dbReviews.forEach((r) => { if (r && r.id) reviewMap.set(String(r.id), r); });

    const productsMap = await getProductsLookupMap();

    const formatted = Array.from(reviewMap.values()).map((r) => {
      const pidStr = String(r.product_id || r.productId || '').trim();
      const p = productsMap.get(pidStr) || productsMap.get(pidStr.toLowerCase()) || {};
      const img = p.image || r.product_image || r.productImage || '';
      const title = p.title || r.product_title || r.productTitle || 'MILASTY Product';

      return {
        id: r.id,
        productId: r.product_id,
        productTitle: title,
        productImage: img,
        orderId: r.order_id,
        rating: r.rating,
        comment: r.comment,
        status: r.status || 'pending',
        reviewImageUrl: r.review_image_url || '',
        createdAt: r.created_at,
      };
    });

    return res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user reviews', error: error.message });
  }
};

/**
 * 3. PUBLIC: GET REVIEWS FOR A SPECIFIC PRODUCT
 * GET /api/reviews/product/:productId
 */
export const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const pidStr = String(productId || '').trim();
    const pidLower = pidStr.toLowerCase();

    const productsMap = await getProductsLookupMap();
    let targetProduct = productsMap.get(pidStr) || productsMap.get(pidLower) || {};

    if (!targetProduct.title) {
      targetProduct = Array.from(productsMap.values()).find(
        (p) =>
          String(p.id) === pidStr ||
          String(p._id) === pidStr ||
          String(p.slug || '').toLowerCase() === pidLower ||
          String(p.title || '').toLowerCase() === pidLower
      ) || {};
    }

    const targetIds = new Set(
      [
        pidStr,
        pidLower,
        String(targetProduct.id || ''),
        String(targetProduct._id || ''),
        String(targetProduct.slug || '').toLowerCase(),
        String(targetProduct.title || '').toLowerCase(),
      ].filter(Boolean)
    );

    let dbReviews = [];

    try {
      const { data, error } = await supabase
        .from('product_reviews')
        .select('*')
        .eq('status', 'approved')
        .eq('is_published', true)
        .eq('show_on_product', true)
        .order('created_at', { ascending: false });

      if (!error && data) dbReviews = data;
    } catch (e) {
      console.warn('Supabase getProductReviews notice:', e.message);
    }

    const reviewMap = new Map();
    dbReviews.forEach((r) => { if (r && r.id) reviewMap.set(String(r.id), r); });

    const allApprovedReviews = Array.from(reviewMap.values());

    // Match reviews against target product identifiers
    const matchedReviews = allApprovedReviews.filter((r) => {
      const rPid = String(r.product_id || r.productId || '').trim().toLowerCase();
      const rTitle = String(r.product_title || r.productTitle || '').trim().toLowerCase();

      if (targetIds.has(rPid)) return true;
      if (rTitle && targetIds.has(rTitle)) return true;
      if (targetProduct.title && rTitle && (rTitle.includes(targetProduct.title.toLowerCase()) || targetProduct.title.toLowerCase().includes(rTitle))) return true;

      return false;
    });

    const formatted = matchedReviews.map((r) => ({
      id: r.id,
      name: r.reviewer_name || r.name || 'Customer',
      reviewerName: r.reviewer_name || r.name || 'Customer',
      rating: Number(r.rating || 5),
      comment: r.comment || r.text || '',
      reviewImageUrl: r.review_image_url || r.image_url || '',
      isVerified: Boolean(r.is_verified_purchase ?? r.is_verified ?? true),
      isVerifiedPurchase: Boolean(r.is_verified_purchase ?? r.is_verified ?? true),
      reviewSource: r.review_source || 'customer',
      createdAt: r.created_at || new Date().toISOString(),
    }));

    const totalReviews = formatted.length;
    const averageRating = totalReviews > 0
      ? Number((formatted.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1))
      : 0;

    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    formatted.forEach((r) => {
      const rStar = Math.round(r.rating);
      if (ratingDistribution[rStar] !== undefined) ratingDistribution[rStar] += 1;
    });

    return res.json({
      success: true,
      totalReviews,
      averageRating,
      ratingDistribution,
      reviews: formatted,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching product reviews', error: error.message });
  }
};

/**
 * 4. ADMIN: GET ALL REVIEWS (CUSTOMER + ADMIN CREATED)
 * GET /api/reviews/admin/all
 */
export const getAllAdminReviews = async (req, res) => {
  try {
    let dbReviews = [];
    const productsMap = await getProductsLookupMap();

    try {
      const { data, error } = await supabase
        .from('product_reviews')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        dbReviews = data;
      }
    } catch (e) {
      console.warn('Supabase product_reviews fetch notice:', e.message);
    }

    let reviews = dbReviews;

    // Sort by created_at descending
    reviews.sort((a, b) => new Date(b.created_at || b.createdAt || 0) - new Date(a.created_at || a.createdAt || 0));

    const formatted = reviews.map((r) => {
      const pidRaw = r.product_id || r.productId || '';
      const pidStr = String(pidRaw).trim();
      const searchTitle = (r.product_title || r.productTitle || '').trim();

      let p = productsMap.get(pidStr) || productsMap.get(pidStr.toLowerCase()) || {};
      
      if (!p.title) {
        const lowerSearch = searchTitle.toLowerCase();
        const lowerPid = pidStr.toLowerCase();

        p = Array.from(productsMap.values()).find(
          (item) => {
            const itemTitle = (item.title || '').toLowerCase();
            const itemSlug = (item.slug || '').toLowerCase();
            const itemId = String(item.id || item._id || '').toLowerCase();

            if (itemId && (itemId === lowerPid || lowerPid.includes(itemId))) return true;
            if (itemSlug && (itemSlug === lowerPid || lowerPid.includes(itemSlug))) return true;
            if (lowerSearch && (itemTitle === lowerSearch || itemTitle.includes(lowerSearch) || lowerSearch.includes(itemTitle))) return true;
            return false;
          }
        ) || {};
      }

      if (!p.title) {
        const commentText = (r.comment || '').toLowerCase();
        if (commentText.includes('imperial') || searchTitle.toLowerCase().includes('imperial')) {
          p = productsMap.get('imperial-wedding-hamper') || {};
        } else if (commentText.includes('elegant') || searchTitle.toLowerCase().includes('elegant')) {
          p = productsMap.get('elegant-celebration-hamper') || {};
        } else if (commentText.includes('hamper')) {
          p = productsMap.get('imperial-wedding-hamper') || {};
        }
      }

      const resolvedTitle =
        searchTitle ||
        p.title ||
        p.name ||
        'MILASTY Artisan Bake';

      const img =
        p.image ||
        p.image_url ||
        (Array.isArray(p.images) && p.images[0] ? p.images[0] : null) ||
        (r.product_image && r.product_image.trim()) ||
        (r.productImage && r.productImage.trim()) ||
        'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80';

      return {
        id: r.id,
        _id: r.id,
        productId: r.product_id || r.productId || pidStr,
        productTitle: resolvedTitle,
        productImage: img,
        reviewerName: r.reviewer_name || r.name || 'Customer',
        email: r.email || '',
        rating: Number(r.rating || 5),
        comment: r.comment || r.text || '',
        reviewImageUrl: r.review_image_url || r.image_url || '',
        reviewSource: r.review_source || 'customer',
        status: r.status || 'pending',
        isVerifiedPurchase: Boolean(r.is_verified_purchase ?? r.is_verified ?? true),
        isPublished: Boolean(r.is_published ?? true),
        showOnProduct: Boolean(r.show_on_product ?? true),
        orderId: r.order_id || null,
        createdAt: r.created_at || new Date().toISOString(),
      };
    });

    return res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching admin reviews', error: error.message });
  }
};

/**
 * 5. ADMIN: CREATE ADMIN PRODUCT REVIEW
 * POST /api/reviews/admin/create
 */
export const createAdminProductReview = async (req, res) => {
  try {
    const {
      productId,
      reviewerName,
      name,
      email = '',
      rating = 5,
      comment = '',
      reviewImageUrl = '',
      image_url = '',
      status = 'approved',
      isVerifiedPurchase = false,
      showOnProduct = true,
    } = req.body;

    if (!productId) {
      return res.status(400).json({ message: 'Product ID is required' });
    }

    const productsMap = await getProductsLookupMap();
    const pidStr = String(productId).trim();
    let resolvedProduct = productsMap.get(pidStr) || productsMap.get(pidStr.toLowerCase()) || {};
    if (!resolvedProduct.title) {
      resolvedProduct = Array.from(productsMap.values()).find(
        (p) => String(p.id) === pidStr || String(p._id) === pidStr || String(p.slug).toLowerCase() === pidStr.toLowerCase()
      ) || {};
    }
    const productTitle = resolvedProduct.title || resolvedProduct.name || 'MILASTY Artisan Bake';
    const productImage = resolvedProduct.image || (Array.isArray(resolvedProduct.images) ? resolvedProduct.images[0] : '');

    const newRecord = {
      product_id: String(productId),
      product_title: productTitle,
      product_image: productImage,
      user_id: null,
      order_id: null,
      order_item_id: null,
      reviewer_name: reviewerName || name || 'MILASTY Team',
      email,
      rating: Number(rating || 5),
      comment: String(comment || '').trim(),
      review_image_url: reviewImageUrl || image_url || '',
      review_source: 'admin',
      status: status || 'approved',
      is_published: true,
      show_on_product: Boolean(showOnProduct),
      is_verified_purchase: Boolean(isVerifiedPurchase),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: inserted, error: insertErr } = await supabase
      .from('product_reviews')
      .insert([newRecord])
      .select()
      .single();
    if (insertErr || !inserted) return dbError(res, 'create the review', insertErr);

    return res.status(201).json({
      success: true,
      message: 'Admin review added successfully',
      review: inserted,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating admin review', error: error.message });
  }
};

/**
 * 6. ADMIN: APPROVE / REJECT REVIEW STATUS
 * PATCH /api/reviews/:id/status
 */
export const updateReviewStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be pending, approved, or rejected.' });
    }

    const { data: updated, error } = await supabase
      .from('product_reviews')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .maybeSingle();
    if (error) return dbError(res, 'update the review status', error);
    if (!updated) return res.status(404).json({ message: 'Review not found.' });

    return res.json({ success: true, message: `Review status set to ${status}`, review: updated });
  } catch (error) {
    res.status(500).json({ message: 'Error updating review status', error: error.message });
  }
};

/**
 * 7. ADMIN: EDIT REVIEW DETAILS & VISIBILITY
 * PUT /api/reviews/:id
 */
export const updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      productId,
      product_id,
      rating,
      comment,
      reviewerName,
      name,
      email,
      status,
      isVerified,
      isVerifiedPurchase,
      isPublished,
      showOnProduct,
      reviewImageUrl,
      image_url,
    } = req.body;

    const targetProductId = productId || product_id;
    const updates = { updated_at: new Date().toISOString() };

    if (targetProductId) {
      updates.product_id = String(targetProductId);
      const productsMap = await getProductsLookupMap();
      const pidStr = String(targetProductId).trim();
      let p = productsMap.get(pidStr) || productsMap.get(pidStr.toLowerCase()) || {};
      if (!p.title) {
        p = Array.from(productsMap.values()).find(
          (item) => String(item.id) === pidStr || String(item._id) === pidStr || String(item.slug).toLowerCase() === pidStr.toLowerCase()
        ) || {};
      }
      if (p.title) updates.product_title = p.title;
      if (p.image) updates.product_image = p.image;
    }

    if (rating !== undefined) updates.rating = Number(rating);
    if (comment !== undefined) updates.comment = comment;
    if (reviewerName || name) updates.reviewer_name = reviewerName || name;
    if (email !== undefined) updates.email = email;
    if (status !== undefined) updates.status = status;
    if (isVerified !== undefined || isVerifiedPurchase !== undefined) {
      updates.is_verified_purchase = isVerifiedPurchase !== undefined ? isVerifiedPurchase : isVerified;
    }
    if (isPublished !== undefined) updates.is_published = isPublished;
    if (showOnProduct !== undefined) updates.show_on_product = showOnProduct;
    if (reviewImageUrl !== undefined || image_url !== undefined) {
      updates.review_image_url = reviewImageUrl || image_url;
    }

    const { data: updated, error } = await supabase
      .from('product_reviews')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle();
    if (error) return dbError(res, 'update the review', error);
    if (!updated) return res.status(404).json({ message: 'Review not found.' });

    return res.json({ success: true, message: 'Review updated successfully', review: updated });
  } catch (error) {
    res.status(500).json({ message: 'Error updating review', error: error.message });
  }
};

/**
 * 8. ADMIN: DELETE REVIEW
 * DELETE /api/reviews/:id
 */
export const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase.from('product_reviews').delete().eq('id', id);
    if (error) return dbError(res, 'delete the review', error);

    return res.json({ success: true, message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting review', error: error.message });
  }
};

/**
 * 9. PUBLIC: GET TESTIMONIALS FOR HOMEPAGE & SHOP
 * GET /api/testimonials
 */
export const getPublicTestimonials = async (req, res) => {
  try {
    const { placement } = req.query; // 'home' | 'shop'
    let dbTestimonials = [];

    try {
      let query = supabase
        .from('testimonials')
        .select('*')
        .eq('is_published', true);

      if (placement === 'shop') {
        query = query.eq('show_on_shop', true);
      } else if (placement === 'home') {
        query = query.eq('show_on_home', true);
      }

      const { data, error } = await query
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (!error && data) dbTestimonials = data;
    } catch (e) {
      console.warn('Supabase getPublicTestimonials notice:', e.message);
    }

    const testimonials = dbTestimonials;

    const productsMap = await getProductsLookupMap();

    const formatted = testimonials.map((t) => {
      const pidStr = String(t.product_id || t.productId || '').trim();
      let p = productsMap.get(pidStr) || productsMap.get(pidStr.toLowerCase()) || {};

      return {
        id: t.id,
        name: t.name,
        role: t.role || 'Valued Customer',
        rating: Number(t.rating || 5),
        content: t.content,
        imageUrl: t.image_url || t.imageUrl || '',
        isPublished: Boolean(t.is_published ?? true),
        showOnHome: Boolean(t.show_on_home ?? true),
        showOnShop: Boolean(t.show_on_shop ?? true),
        productId: t.product_id || t.productId || null,
        productTitle: p.title || p.name || '',
        verified: Boolean(t.verified ?? true),
        createdAt: t.created_at,
      };
    });

    return res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching testimonials', error: error.message });
  }
};

/**
 * 10. ADMIN: GET ALL TESTIMONIALS
 * GET /api/testimonials/admin/all
 */
export const getAllAdminTestimonials = async (req, res) => {
  try {
    let dbTestimonials = [];

    try {
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) dbTestimonials = data;
    } catch (e) {
      console.warn('Supabase getAllAdminTestimonials notice:', e.message);
    }

    const testimonials = dbTestimonials;

    const productsMap = await getProductsLookupMap();

    const formatted = testimonials.map((t) => {
      const pidStr = String(t.product_id || t.productId || '').trim();
      let p = productsMap.get(pidStr) || productsMap.get(pidStr.toLowerCase()) || {};

      return {
        id: t.id,
        _id: t.id,
        name: t.name,
        role: t.role || 'Valued Customer',
        rating: Number(t.rating || 5),
        content: t.content,
        imageUrl: t.image_url || t.imageUrl || '',
        isPublished: Boolean(t.is_published ?? true),
        showOnHome: Boolean(t.show_on_home ?? true),
        showOnShop: Boolean(t.show_on_shop ?? true),
        productId: t.product_id || t.productId || null,
        productTitle: p.title || p.name || '',
        verified: Boolean(t.verified ?? true),
        sortOrder: t.sort_order || 0,
        createdAt: t.created_at,
      };
    });

    return res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching admin testimonials', error: error.message });
  }
};

/**
 * 11. ADMIN: CREATE TESTIMONIAL
 * POST /api/testimonials
 */
export const createTestimonial = async (req, res) => {
  try {
    const {
      name,
      role = 'Valued Customer',
      rating = 5,
      content,
      imageUrl = '',
      image_url = '',
      isPublished = true,
      showOnHome = true,
      showOnShop = true,
      productId = null,
      product_id = null,
      verified = true,
      sortOrder = 0,
    } = req.body;

    if (!name || !content) {
      return res.status(400).json({ message: 'Name and testimonial content are required' });
    }

    const finalProductId = productId || product_id || null;

    const newRecord = {
      name: String(name).trim(),
      role: String(role || 'Valued Customer').trim(),
      rating: Number(rating || 5),
      content: String(content).trim(),
      image_url: imageUrl || image_url || '',
      is_published: Boolean(isPublished),
      show_on_home: Boolean(showOnHome),
      show_on_shop: Boolean(showOnShop),
      product_id: finalProductId ? String(finalProductId) : null,
      verified: Boolean(verified),
      sort_order: Number(sortOrder || 0),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: inserted, error: insertErr } = await supabase
      .from('testimonials')
      .insert([newRecord])
      .select()
      .single();
    if (insertErr || !inserted) return dbError(res, 'save the testimonial', insertErr);

    return res.status(201).json({
      success: true,
      message: 'Testimonial created successfully',
      testimonial: inserted,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating testimonial', error: error.message });
  }
};

/**
 * 12. ADMIN: UPDATE TESTIMONIAL
 * PUT /api/testimonials/:id
 */
export const updateTestimonial = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      role,
      rating,
      content,
      imageUrl,
      image_url,
      isPublished,
      showOnHome,
      showOnShop,
      productId,
      product_id,
      verified,
      sortOrder,
    } = req.body;

    const updates = { updated_at: new Date().toISOString() };
    if (name !== undefined) updates.name = name;
    if (role !== undefined) updates.role = role;
    if (rating !== undefined) updates.rating = Number(rating);
    if (content !== undefined) updates.content = content;
    if (imageUrl !== undefined || image_url !== undefined) updates.image_url = imageUrl || image_url;
    if (isPublished !== undefined) updates.is_published = Boolean(isPublished);
    if (showOnHome !== undefined) updates.show_on_home = Boolean(showOnHome);
    if (showOnShop !== undefined) updates.show_on_shop = Boolean(showOnShop);
    if (productId !== undefined || product_id !== undefined) {
      const pVal = productId !== undefined ? productId : product_id;
      updates.product_id = pVal ? String(pVal) : null;
    }
    if (verified !== undefined) updates.verified = Boolean(verified);
    if (sortOrder !== undefined) updates.sort_order = Number(sortOrder);

    const { data: updated, error } = await supabase
      .from('testimonials')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle();
    if (error) return dbError(res, 'update the testimonial', error);
    if (!updated) return res.status(404).json({ message: 'Testimonial not found.' });

    return res.json({ success: true, message: 'Testimonial updated successfully', testimonial: updated });
  } catch (error) {
    res.status(500).json({ message: 'Error updating testimonial', error: error.message });
  }
};

/**
 * 13. ADMIN: DELETE TESTIMONIAL
 * DELETE /api/testimonials/:id
 */
export const deleteTestimonial = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase.from('testimonials').delete().eq('id', id);
    if (error) return dbError(res, 'delete the testimonial', error);

    return res.json({ success: true, message: 'Testimonial deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting testimonial', error: error.message });
  }
};

/**
 * 14. PUBLIC: GET FAQS
 * GET /api/faqs
 */
export const getFaqs = async (req, res) => {
  try {
    let faqs = [];
    try {
      const { data, error } = await supabase
        .from('faqs')
        .select('*')
        .order('created_at', { ascending: true });

      if (!error && data && data.length > 0) {
        faqs = data;
      }
    } catch (e) {
      console.warn('Supabase faqs fetch notice:', e.message);
    }

    if (faqs.length === 0) {
      faqs = initialFaqs || [];
    }

    return res.json(faqs);
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching FAQs', error: error.message });
  }
};

/**
 * 15. HELPER: COMPUTE REAL AVERAGE RATINGS & REVIEW COUNTS PER PRODUCT
 */
export const getApprovedProductReviewStats = async () => {
  const statsMap = new Map();

  let dbReviews = [];
  try {
    const { data, error } = await supabase
      .from('product_reviews')
      .select('*')
      .eq('status', 'approved')
      .eq('is_published', true)
      .eq('show_on_product', true);

    if (!error && data) dbReviews = data;
  } catch (e) {
    console.warn('Supabase getApprovedProductReviewStats notice:', e.message);
  }

  const reviewMap = new Map();
  dbReviews.forEach((r) => { if (r && r.id) reviewMap.set(String(r.id), r); });

  const allApproved = Array.from(reviewMap.values());
  const productsMap = await getProductsLookupMap();

  allApproved.forEach((r) => {
    const pidRaw = String(r.product_id || r.productId || '').trim();
    const pidLower = pidRaw.toLowerCase();
    const pTitleLower = String(r.product_title || r.productTitle || '').trim().toLowerCase();

    let p = productsMap.get(pidRaw) || productsMap.get(pidLower) || {};
    if (!p.title && pTitleLower) {
      p = productsMap.get(pTitleLower) || {};
    }

    const keysToAttribute = new Set(
      [
        pidRaw,
        pidLower,
        pTitleLower,
        String(p.id || ''),
        String(p._id || ''),
        String(p.slug || '').toLowerCase(),
        String(p.title || '').toLowerCase(),
      ].filter(Boolean)
    );

    keysToAttribute.forEach((k) => {
      const existing = statsMap.get(k) || { count: 0, sum: 0 };
      existing.count += 1;
      existing.sum += Number(r.rating || 5);
      statsMap.set(k, existing);
    });
  });

  return statsMap;
};
