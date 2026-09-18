import { supabase } from '../config/supabase.js';

/**
 * GET CUSTOMER WISHLIST
 * GET /api/wishlist
 */
export const getWishlist = async (req, res) => {
  try {
    const userId = req.user ? (req.user.id || req.user._id) : null;

    if (!userId) {
      return res.json({ productIds: [], products: [] });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('wishlist')
      .eq('id', userId)
      .maybeSingle();

    if (error || !user) {
      return res.json({ productIds: [], products: [] });
    }

    const rawWishlist = Array.isArray(user.wishlist) ? user.wishlist : [];
    const productIds = Array.from(new Set(rawWishlist.map(id => String(id)).filter(Boolean)));

    let products = [];
    if (productIds.length > 0) {
      try {
        const { data: dbProducts } = await supabase
          .from('products')
          .select('*, product_variants(*)')
          .in('id', productIds);

        if (dbProducts) {
          products = dbProducts.map((p) => ({
            ...p,
            _id: p.id,
            image: p.image_url || p.image || p.primary_image || (Array.isArray(p.images) ? p.images[0] : null) || '/images/image1.jpeg',
            image_url: p.image_url || p.image || '/images/image1.jpeg',
            variants: p.product_variants || [],
          }));
        }
      } catch (e) {
        console.warn('Notice fetching wishlist product details:', e.message);
      }
    }

    res.json({
      success: true,
      productIds,
      products,
    });
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    res.status(500).json({ success: false, message: 'Error fetching wishlist', error: error.message });
  }
};

/**
 * TOGGLE ITEM IN WISHLIST
 * POST /api/wishlist/toggle
 */
export const toggleWishlist = async (req, res) => {
  try {
    const userId = req.user ? (req.user.id || req.user._id) : null;
    const { productId } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID is required' });
    }

    const targetProductId = String(productId).trim();

    // Fetch user wishlist from Supabase
    const { data: user, error: fetchErr } = await supabase
      .from('users')
      .select('wishlist')
      .eq('id', userId)
      .maybeSingle();

    if (fetchErr || !user) {
      return res.status(404).json({ success: false, message: 'User profile not found' });
    }

    let wishlist = Array.isArray(user.wishlist) ? user.wishlist.map(id => String(id)) : [];
    let added = false;

    // Toggle operation with unique constraint logic
    if (wishlist.includes(targetProductId)) {
      wishlist = wishlist.filter((id) => id !== targetProductId);
      added = false;
    } else {
      wishlist = Array.from(new Set([...wishlist, targetProductId]));
      added = true;
    }

    // Save updated wishlist to Supabase users table
    const { error: updateErr } = await supabase
      .from('users')
      .update({ wishlist, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (updateErr) {
      console.error('Error updating wishlist in database:', updateErr.message);
      return res.status(500).json({ success: false, message: 'Could not update wishlist in database' });
    }

    // Fetch populated product list for response
    let products = [];
    if (wishlist.length > 0) {
      try {
        const { data: dbProducts } = await supabase
          .from('products')
          .select('*, product_variants(*)')
          .in('id', wishlist);

        if (dbProducts) {
          products = dbProducts.map((p) => ({
            ...p,
            _id: p.id,
            image: p.image_url || p.image || p.primary_image || (Array.isArray(p.images) ? p.images[0] : null) || '/images/image1.jpeg',
            image_url: p.image_url || p.image || '/images/image1.jpeg',
            variants: p.product_variants || [],
          }));
        }
      } catch (e) {}
    }

    console.log(`[WISHLIST TOGGLE] User ${userId} ${added ? 'added' : 'removed'} product ${targetProductId}`);

    return res.json({
      success: true,
      added,
      productId: targetProductId,
      productIds: wishlist,
      products,
    });
  } catch (error) {
    console.error('Error toggling wishlist item:', error);
    res.status(500).json({ success: false, message: 'Error updating wishlist', error: error.message });
  }
};
