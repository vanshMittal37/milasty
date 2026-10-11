import { supabase } from '../config/supabase.js';
import { initialProducts } from '../data/seedData.js';

/*
 * Pre-bookings live ONLY in Supabase (prebook_products — scripts/22_prebooking_quiz_discovery_tables.sql).
 * No in-memory / JSON-file store and no built-in seed items: those made deleted items come back and
 * edits fail on Railway (its disk is wiped on every deploy). Write errors are returned to the admin.
 */
const dbError = (res, action, error) => {
  console.error(`[PREBOOKINGS] ${action} failed:`, error?.message || error);
  return res.status(500).json({
    message: `Could not ${action}: ${error?.message || 'database error'}. If a table/column is missing, run scripts/22_prebooking_quiz_discovery_tables.sql in Supabase.`,
  });
};

// Product lookup (database products first; seed products only to label legacy rows)
const getProductsMap = async () => {
  const map = new Map();
  initialProducts.forEach((p) => {
    if (p.id) map.set(String(p.id), p);
    if (p._id) map.set(String(p._id), p);
    if (p.slug) map.set(String(p.slug), p);
  });

  const { data: dbProducts, error } = await supabase.from('products').select('*, product_variants(*)');
  if (error) console.warn('Prebooking products fetch notice:', error.message);
  (dbProducts || []).forEach((p) => {
    const item = {
      _id: p.id,
      id: p.id,
      title: p.title,
      slug: p.slug,
      subtitle: p.subtitle,
      description: p.description,
      category: p.category,
      price: Number(p.product_variants?.[0]?.price || p.price || 0),
      originalPrice: Number(p.product_variants?.[0]?.original_price || p.original_price || p.price || 0),
      image: p.image_url,
      badges: p.badges || [],
    };
    if (p.id) map.set(String(p.id), item);
    if (p.slug) map.set(String(p.slug), item);
  });
  return map;
};

/**
 * 1. PUBLIC: GET ACTIVE PRE-BOOKING PRODUCTS
 * GET /api/prebookings/active
 */
export const getPublicPrebookings = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('prebook_products')
      .select('*')
      .eq('enabled', true)
      .order('display_order', { ascending: true })
      .order('launch_date', { ascending: true });
    if (error) {
      console.warn('[PREBOOKINGS] public fetch notice:', error.message);
      return res.json({ success: true, prebookings: [] });
    }

    const productsMap = await getProductsMap();
    const currentDate = new Date();

    const formatted = (data || [])
      .map((pb) => {
        const pidStr = String(pb.product_id || '').trim();
        const product = productsMap.get(pidStr) || productsMap.get(pidStr.toLowerCase()) || {};

        const title = pb.custom_heading || product.title || pb.title;
        if (!title) return null; // linked product deleted

        const launchDateObj = pb.launch_date ? new Date(pb.launch_date) : null;
        const isFuture = launchDateObj ? launchDateObj > currentDate : true;
        if (!isFuture) return null; // only upcoming items for "What's Next"

        return {
          id: pb.id,
          productId: product.id || product._id || pidStr,
          title,
          description: pb.custom_description || product.subtitle || product.description || '',
          image: pb.product_image || product.image || product.image_url || '/images/image1.jpeg',
          price: Number(pb.price || product.price || 0),
          originalPrice: Number(pb.original_price || product.originalPrice || product.price || 0),
          launchDate: pb.launch_date,
          preorderEnabled: Boolean(pb.preorder_enabled ?? true),
          displayOrder: pb.display_order || 0,
          isUpcoming: isFuture,
          productSlug: product.slug || pidStr,
        };
      })
      .filter(Boolean);

    formatted.sort((a, b) => (a.displayOrder - b.displayOrder) || (new Date(a.launchDate || 0) - new Date(b.launchDate || 0)));
    return res.json({ success: true, prebookings: formatted });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching prebooking products', error: error.message });
  }
};

/**
 * 2. ADMIN: GET ALL PRE-BOOKING PRODUCTS
 * GET /api/prebookings/admin/all
 */
export const getAllAdminPrebookings = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('prebook_products')
      .select('*')
      .order('display_order', { ascending: true });
    if (error) return dbError(res, 'load pre-bookings', error);

    const productsMap = await getProductsMap();
    const formatted = (data || []).map((pb) => {
      const pidStr = String(pb.product_id || '').trim();
      const product = productsMap.get(pidStr) || productsMap.get(pidStr.toLowerCase()) || {};
      return {
        id: pb.id,
        _id: pb.id,
        productId: pb.product_id,
        productTitle: pb.custom_heading || product.title || pb.title || `Product #${pb.product_id}`,
        productImage: pb.product_image || product.image || product.image_url || '',
        productPrice: pb.price !== undefined && pb.price !== null ? Number(pb.price) : (product.price || 0),
        originalPrice: pb.original_price !== undefined && pb.original_price !== null ? Number(pb.original_price) : (product.originalPrice || 0),
        description: pb.custom_description || product.description || '',
        category: pb.category || product.category || 'cookies',
        enabled: Boolean(pb.enabled ?? true),
        preorderEnabled: Boolean(pb.preorder_enabled ?? true),
        launchDate: pb.launch_date,
        preorderStartDate: pb.preorder_start_date || null,
        preorderEndDate: pb.preorder_end_date || null,
        displayOrder: pb.display_order || 0,
        customHeading: pb.custom_heading || '',
        customDescription: pb.custom_description || '',
        createdAt: pb.created_at,
      };
    });
    return res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching admin prebooking list', error: error.message });
  }
};

/**
 * 3. ADMIN: ADD PRODUCT TO PRE-BOOKING
 * POST /api/prebookings
 */
export const createPrebooking = async (req, res) => {
  try {
    const {
      isNewProduct = false,
      productId,
      title,
      description = '',
      price = 0,
      originalPrice = 0,
      category = 'cookies',
      image = '',
      launchDate,
      enabled = true,
      preorderEnabled = true,
      displayOrder = 0,
      customHeading = '',
      customDescription = '',
    } = req.body;

    if (!launchDate || Number.isNaN(new Date(launchDate).getTime())) {
      return res.status(400).json({ message: 'A valid launch date is required' });
    }

    let finalProductId = productId;

    // Brand-new product created from Pre-Bookings: let the database assign its UUID
    if (isNewProduct || !productId) {
      const cleanTitle = String(title || customHeading || '').trim();
      if (!cleanTitle) return res.status(400).json({ message: 'Product title is required' });

      const baseSlug = cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'prebook';
      const { data: clash } = await supabase.from('products').select('id').eq('slug', baseSlug).maybeSingle();
      const slug = clash ? `${baseSlug}-${Date.now().toString().slice(-5)}` : baseSlug;

      const { data: newProduct, error: prodErr } = await supabase
        .from('products')
        .insert([{
          title: cleanTitle,
          slug,
          subtitle: String(description || customDescription).slice(0, 120),
          description: description || customDescription,
          category,
          price: Number(price || 0),
          original_price: Number(originalPrice || price || 0),
          image_url: image || '/images/image1.jpeg',
          is_active: true,
          launch_date: new Date(launchDate).toISOString(),
        }])
        .select('id')
        .single();
      if (prodErr || !newProduct) return dbError(res, 'create the pre-book product', prodErr);
      finalProductId = newProduct.id;
    }

    const newRecord = {
      product_id: String(finalProductId).trim(),
      title: title || customHeading || '',
      price: Number(price || 0),
      original_price: Number(originalPrice || price || 0),
      category,
      product_image: image,
      enabled: Boolean(enabled),
      preorder_enabled: Boolean(preorderEnabled),
      launch_date: new Date(launchDate).toISOString(),
      display_order: Number(displayOrder || 0),
      custom_heading: String(customHeading || title || '').trim(),
      custom_description: String(customDescription || description || '').trim(),
    };

    const { data: inserted, error } = await supabase.from('prebook_products').insert([newRecord]).select().single();
    if (error || !inserted) return dbError(res, 'add the pre-booking', error);

    return res.status(201).json({
      success: true,
      message: 'Product added to Pre-Bookings successfully',
      prebooking: inserted,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating prebooking product', error: error.message });
  }
};

/**
 * 4. ADMIN: UPDATE PRE-BOOKING CONFIG
 * PUT /api/prebookings/:id
 */
export const updatePrebooking = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      productId, title, price, originalPrice, category, image, launchDate,
      enabled, preorderEnabled, displayOrder, customHeading, customDescription,
    } = req.body;

    if (launchDate !== undefined && launchDate !== null && launchDate !== '' && Number.isNaN(new Date(launchDate).getTime())) {
      return res.status(400).json({ message: 'Launch date is not a valid date' });
    }

    const updates = { updated_at: new Date().toISOString() };
    if (productId !== undefined && productId !== null && productId !== '') updates.product_id = String(productId).trim();
    if (title !== undefined) updates.title = String(title).trim();
    if (price !== undefined && price !== '') updates.price = Number(price);
    if (originalPrice !== undefined && originalPrice !== '') updates.original_price = Number(originalPrice);
    if (category !== undefined) updates.category = String(category);
    if (image !== undefined) updates.product_image = String(image || '');
    if (launchDate) updates.launch_date = new Date(launchDate).toISOString();
    if (enabled !== undefined) updates.enabled = Boolean(enabled);
    if (preorderEnabled !== undefined) updates.preorder_enabled = Boolean(preorderEnabled);
    if (displayOrder !== undefined && displayOrder !== '') updates.display_order = Number(displayOrder);
    if (customHeading !== undefined) updates.custom_heading = String(customHeading).trim();
    if (customDescription !== undefined) updates.custom_description = String(customDescription).trim();

    const { data: updated, error } = await supabase
      .from('prebook_products')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle();
    if (error) return dbError(res, 'update the pre-booking', error);
    if (!updated) return res.status(404).json({ message: 'Pre-booking not found. Reload the page and try again.' });

    // Keep the linked product's launch date / basics in sync (best effort — the pre-booking itself is saved)
    if (updated.product_id && launchDate) {
      const productSync = { launch_date: new Date(launchDate).toISOString() };
      if (title || customHeading) productSync.title = title || customHeading;
      if (price) productSync.price = Number(price);
      if (originalPrice) productSync.original_price = Number(originalPrice);
      if (category) productSync.category = category;
      if (image) productSync.image_url = image;
      const { error: syncErr } = await supabase.from('products').update(productSync).eq('id', updated.product_id);
      if (syncErr) console.warn('[PREBOOKINGS] product sync notice:', syncErr.message);
    }

    return res.json({ success: true, message: 'Pre-booking updated successfully', prebooking: updated });
  } catch (error) {
    res.status(500).json({ message: 'Error updating prebooking', error: error.message });
  }
};

/**
 * 5. ADMIN: REMOVE PRODUCT FROM PRE-BOOKING
 * DELETE /api/prebookings/:id
 */
export const deletePrebooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { data: removed, error } = await supabase.from('prebook_products').delete().eq('id', id).select('id');
    if (error) return dbError(res, 'remove the pre-booking', error);
    if (!removed || removed.length === 0) return res.status(404).json({ message: 'Pre-booking not found (it may already be removed).' });
    return res.json({ success: true, message: 'Removed from pre-booking successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting prebooking record', error: error.message });
  }
};
