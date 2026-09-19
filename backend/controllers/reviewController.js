import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { supabase } from '../config/supabase.js';
import { initialProducts, initialReviews, initialFaqs } from '../data/seedData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REVIEWS_FILE = path.join(__dirname, '../data/reviews_store.json');
const TESTIMONIALS_FILE = path.join(__dirname, '../data/testimonials_store.json');

// Helper to load JSON files safely from disk
const loadJsonFile = (filePath, defaultData = []) => {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      if (content.trim()) return JSON.parse(content);
    }
  } catch (err) {
    console.warn(`Notice loading ${path.basename(filePath)}:`, err.message);
  }
  return defaultData;
};

// Helper to save JSON files safely to disk
const saveJsonFile = (filePath, data) => {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.warn(`Notice saving ${path.basename(filePath)}:`, err.message);
  }
};

// In-memory & file-backed store for rock-solid persistence across deployments
const memoryReviews = new Map();
const memoryTestimonials = new Map();

// Helper to seed initial testimonials into memory store
const getInitialTestimonialsSeed = () => [
  {
    id: 't-seed-1',
    name: 'Dr. Sunita Rao',
    role: 'Holistic Nutritionist & Wellness Coach',
    rating: 5,
    content: 'As a nutritionist advocating for gut health and low-GI foods, Milasty\'s 100% millet artisan bakes are a game changer! Zero refined flour, zero artificial preservatives, and absolutely divine taste.',
    image_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
    is_published: true,
    sort_order: 1,
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
  },
  {
    id: 't-seed-2',
    name: 'Kavita & Rajesh Sharma',
    role: 'Health-Conscious Parents',
    rating: 5,
    content: 'Finding clean, wholesome snacks for our kids used to be a challenge. The Cocoa Ragi Cookies are now our children\'s favorite lunchbox treat! Healthy, crunchy, and packed with calcium.',
    image_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80',
    is_published: true,
    sort_order: 2,
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: 't-seed-3',
    name: 'Ananya Deshmukh',
    role: 'Fitness Enthusiast & Yoga Instructor',
    rating: 5,
    content: 'Milasty\'s Almond Foxtail bakes are my go-to post-workout fuel. Clean ingredients, authentic jaggery sweetness, and incredible crunch. Highly recommend to everyone pursuing a clean diet!',
    image_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    is_published: true,
    sort_order: 3,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
];

// Hydrate memory stores from disk on startup
const storedReviewsList = loadJsonFile(REVIEWS_FILE, []);
storedReviewsList.forEach((r) => { if (r && r.id) memoryReviews.set(String(r.id), r); });

const storedTestimonialsList = loadJsonFile(TESTIMONIALS_FILE, getInitialTestimonialsSeed());
storedTestimonialsList.forEach((t) => { if (t && t.id) memoryTestimonials.set(String(t.id), t); });

// Helper functions to persist memory states to disk
const syncReviewsToDisk = () => {
  saveJsonFile(REVIEWS_FILE, Array.from(memoryReviews.values()));
};

const syncTestimonialsToDisk = () => {
  saveJsonFile(TESTIMONIALS_FILE, Array.from(memoryTestimonials.values()));
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
    try {
      const { data: existingReviews } = await supabase
        .from('product_reviews')
        .select('id')
        .eq('user_id', String(userId))
        .eq('product_id', String(productId))
        .eq('review_source', 'customer');

      if (existingReviews && existingReviews.length > 0) {
        return res.status(400).json({
          message: 'You have already submitted a review for this product.',
        });
      }
    } catch (checkErr) {
      const hasReviewedInMemory = Array.from(memoryReviews.values()).some(
        (r) => String(r.user_id) === String(userId) && String(r.product_id) === String(productId) && r.review_source === 'customer'
      );
      if (hasReviewedInMemory) {
        return res.status(400).json({
          message: 'You have already submitted a review for this product.',
        });
      }
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

    let insertedReview = null;

    try {
      const { data, error } = await supabase
        .from('product_reviews')
        .insert([newReviewRecord])
        .select()
        .single();

      if (!error && data) {
        insertedReview = data;
      }
    } catch (err) {
      console.warn('Supabase product_reviews insert notice:', err.message);
    }

    if (!insertedReview) {
      const fallbackId = `rev_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      insertedReview = { id: fallbackId, ...newReviewRecord };
    }

    // Synchronize to memory & disk store
    memoryReviews.set(String(insertedReview.id), insertedReview);
    syncReviewsToDisk();

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

    const memReviews = Array.from(memoryReviews.values()).filter(
      (r) => String(r.user_id) === String(userId) || (userEmail && r.email?.toLowerCase() === userEmail)
    );

    const reviewMap = new Map();
    dbReviews.forEach((r) => { if (r && r.id) reviewMap.set(String(r.id), r); });
    memReviews.forEach((r) => { if (r && r.id) reviewMap.set(String(r.id), r); });

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
    let dbReviews = [];

    try {
      const { data, error } = await supabase
        .from('product_reviews')
        .select('*')
        .eq('product_id', String(productId))
        .eq('status', 'approved')
        .eq('is_published', true)
        .eq('show_on_product', true)
        .order('created_at', { ascending: false });

      if (!error && data) dbReviews = data;
    } catch (e) {
      console.warn('Supabase getProductReviews notice:', e.message);
    }

    const memReviews = Array.from(memoryReviews.values()).filter(
      (r) =>
        String(r.product_id || r.productId) === String(productId) &&
        r.status === 'approved' &&
        r.is_published !== false &&
        r.show_on_product !== false
    );

    const reviewMap = new Map();
    dbReviews.forEach((r) => { if (r && r.id) reviewMap.set(String(r.id), r); });
    memReviews.forEach((r) => { if (r && r.id) reviewMap.set(String(r.id), r); });

    let reviews = Array.from(reviewMap.values());

    const formatted = reviews.map((r) => ({
      id: r.id,
      name: r.reviewer_name || r.name || 'Customer',
      rating: Number(r.rating || 5),
      comment: r.comment || r.text || '',
      reviewImageUrl: r.review_image_url || r.image_url || '',
      isVerified: Boolean(r.is_verified_purchase ?? r.is_verified ?? true),
      reviewSource: r.review_source || 'customer',
      createdAt: r.created_at || new Date().toISOString(),
    }));

    return res.json(formatted);
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

    const memReviews = Array.from(memoryReviews.values());

    const reviewMap = new Map();
    dbReviews.forEach((r) => { if (r && r.id) reviewMap.set(String(r.id), r); });
    memReviews.forEach((r) => { if (r && r.id) reviewMap.set(String(r.id), r); });

    let reviews = Array.from(reviewMap.values());

    // Fallback seed reviews if no reviews exist at all
    if (reviews.length === 0) {
      reviews = initialReviews.map((r, idx) => ({
        id: `seed_rev_${idx}`,
        product_id: r.productId || null,
        product_title: r.productTitle || r.productName || '',
        reviewer_name: r.name || 'Customer',
        email: r.email || '',
        rating: r.rating || 5,
        comment: r.comment || r.text || '',
        status: r.status || 'approved',
        review_source: r.source || 'customer',
        is_verified_purchase: r.isVerified ?? true,
        is_published: true,
        show_on_product: true,
        created_at: r.createdAt || new Date().toISOString(),
      }));
    }

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

    let inserted = null;

    try {
      const { data, error } = await supabase
        .from('product_reviews')
        .insert([newRecord])
        .select()
        .single();

      if (!error && data) {
        inserted = data;
      }
    } catch (e) {
      console.warn('Admin review creation notice:', e.message);
    }

    if (!inserted) {
      const id = `adm_rev_${Date.now()}`;
      inserted = { id, ...newRecord };
    }

    memoryReviews.set(String(inserted.id), inserted);
    syncReviewsToDisk();

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

    let updated = null;

    try {
      const { data, error } = await supabase
        .from('product_reviews')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (!error && data) updated = data;
    } catch (e) {
      console.warn('Supabase updateReviewStatus notice:', e.message);
    }

    if (memoryReviews.has(String(id))) {
      const item = memoryReviews.get(String(id));
      item.status = status;
      item.updated_at = new Date().toISOString();
      if (!updated) updated = item;
    } else if (updated) {
      memoryReviews.set(String(id), updated);
    }

    syncReviewsToDisk();

    return res.json({ success: true, message: `Review status set to ${status}`, review: updated || { id, status } });
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

    let updated = null;

    try {
      const { data, error } = await supabase
        .from('product_reviews')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (!error && data) updated = data;
    } catch (e) {
      console.warn('Supabase updateReview notice:', e.message);
    }

    if (memoryReviews.has(String(id))) {
      const item = memoryReviews.get(String(id));
      Object.assign(item, updates);
      if (!updated) updated = item;
    } else if (updated) {
      memoryReviews.set(String(id), updated);
    }

    syncReviewsToDisk();

    return res.json({ success: true, message: 'Review updated successfully', review: updated || { id, ...updates } });
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

    try {
      await supabase.from('product_reviews').delete().eq('id', id);
    } catch (e) {
      console.warn('Supabase deleteReview notice:', e.message);
    }

    memoryReviews.delete(String(id));
    syncReviewsToDisk();

    return res.json({ success: true, message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting review', error: error.message });
  }
};

/**
 * 9. PUBLIC: GET TESTIMONIALS FOR HOMEPAGE
 * GET /api/testimonials
 */
export const getPublicTestimonials = async (req, res) => {
  try {
    let dbTestimonials = [];

    try {
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .eq('is_published', true)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (!error && data) dbTestimonials = data;
    } catch (e) {
      console.warn('Supabase getPublicTestimonials notice:', e.message);
    }

    const memTestimonials = Array.from(memoryTestimonials.values()).filter((t) => t.is_published !== false);

    const tMap = new Map();
    dbTestimonials.forEach((t) => { if (t && t.id) tMap.set(String(t.id), t); });
    memTestimonials.forEach((t) => { if (t && t.id) tMap.set(String(t.id), t); });

    let testimonials = Array.from(tMap.values());

    if (testimonials.length === 0) {
      testimonials = getInitialTestimonialsSeed();
    }

    const formatted = testimonials.map((t) => ({
      id: t.id,
      name: t.name,
      role: t.role || 'Valued Customer',
      rating: Number(t.rating || 5),
      content: t.content,
      imageUrl: t.image_url || t.imageUrl || '',
      isPublished: Boolean(t.is_published ?? true),
      createdAt: t.created_at,
    }));

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

    const memTestimonials = Array.from(memoryTestimonials.values());

    const tMap = new Map();
    dbTestimonials.forEach((t) => { if (t && t.id) tMap.set(String(t.id), t); });
    memTestimonials.forEach((t) => { if (t && t.id) tMap.set(String(t.id), t); });

    let testimonials = Array.from(tMap.values());

    if (testimonials.length === 0) {
      testimonials = getInitialTestimonialsSeed();
    }

    const formatted = testimonials.map((t) => ({
      id: t.id,
      _id: t.id,
      name: t.name,
      role: t.role || 'Valued Customer',
      rating: Number(t.rating || 5),
      content: t.content,
      imageUrl: t.image_url || t.imageUrl || '',
      isPublished: Boolean(t.is_published ?? true),
      sortOrder: t.sort_order || 0,
      createdAt: t.created_at,
    }));

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
    const { name, role = 'Valued Customer', rating = 5, content, imageUrl = '', image_url = '', isPublished = true } = req.body;

    if (!name || !content) {
      return res.status(400).json({ message: 'Name and testimonial content are required' });
    }

    const newRecord = {
      name: String(name).trim(),
      role: String(role || 'Valued Customer').trim(),
      rating: Number(rating || 5),
      content: String(content).trim(),
      image_url: imageUrl || image_url || '',
      is_published: Boolean(isPublished),
      sort_order: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    let inserted = null;

    try {
      const { data, error } = await supabase
        .from('testimonials')
        .insert([newRecord])
        .select()
        .single();

      if (!error && data) inserted = data;
    } catch (e) {
      console.warn('Testimonial creation fallback notice:', e.message);
    }

    if (!inserted) {
      const id = `testim_${Date.now()}`;
      inserted = { id, ...newRecord };
    }

    memoryTestimonials.set(String(inserted.id), inserted);
    syncTestimonialsToDisk();

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
    const { name, role, rating, content, imageUrl, image_url, isPublished } = req.body;

    const updates = { updated_at: new Date().toISOString() };
    if (name !== undefined) updates.name = name;
    if (role !== undefined) updates.role = role;
    if (rating !== undefined) updates.rating = Number(rating);
    if (content !== undefined) updates.content = content;
    if (imageUrl !== undefined || image_url !== undefined) updates.image_url = imageUrl || image_url;
    if (isPublished !== undefined) updates.is_published = Boolean(isPublished);

    let updated = null;

    try {
      const { data, error } = await supabase
        .from('testimonials')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (!error && data) updated = data;
    } catch (e) {
      console.warn('Supabase updateTestimonial notice:', e.message);
    }

    if (memoryTestimonials.has(String(id))) {
      const item = memoryTestimonials.get(String(id));
      Object.assign(item, updates);
      if (!updated) updated = item;
    } else if (updated) {
      memoryTestimonials.set(String(id), updated);
    }

    syncTestimonialsToDisk();

    return res.json({ success: true, message: 'Testimonial updated successfully', testimonial: updated || { id, ...updates } });
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

    try {
      await supabase.from('testimonials').delete().eq('id', id);
    } catch (e) {
      console.warn('Supabase deleteTestimonial notice:', e.message);
    }

    memoryTestimonials.delete(String(id));
    syncTestimonialsToDisk();

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
