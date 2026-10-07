import { supabase } from '../config/supabase.js';

export const getCart = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    console.log(`[CART GET] userId=${userId}`);

    const { data: user, error } = await supabase
      .from('users')
      .select('cart')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('[CART GET] Supabase error:', JSON.stringify(error));
      return res.json({ items: [] });
    }
    if (!user) {
      console.warn('[CART GET] No user found for id:', userId);
      return res.json({ items: [] });
    }

    const items = Array.isArray(user.cart) ? user.cart : [];
    console.log(`[CART GET] Returning ${items.length} item(s) for userId=${userId}`);
    res.json({ items });
  } catch (error) {
    console.error('[CART GET] Exception:', error.message);
    res.status(500).json({ message: 'Error fetching cart', error: error.message });
  }
};

export const updateCart = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { items } = req.body;
    const itemsToSave = Array.isArray(items) ? items : [];

    console.log(`[CART PUT] userId=${userId} saving ${itemsToSave.length} item(s)`);

    const { data, error } = await supabase
      .from('users')
      .update({ cart: itemsToSave, updated_at: new Date() })
      .eq('id', userId)
      .select('cart')
      .maybeSingle();

    if (error) {
      console.error('[CART PUT] Update error:', JSON.stringify(error));
      throw error;
    }

    const savedItems = Array.isArray(data?.cart) ? data.cart : itemsToSave;
    console.log(`[CART PUT] Successfully saved ${savedItems.length} item(s) for userId=${userId}`);
    res.json({ items: savedItems });
  } catch (error) {
    console.error('[CART PUT] Exception:', error.message);
    res.status(500).json({ message: 'Error updating cart', error: error.message });
  }
};

export const clearCart = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    console.log(`[CART DELETE] Clearing cart for userId=${userId}`);

    const { error } = await supabase
      .from('users')
      .update({ cart: [], updated_at: new Date() })
      .eq('id', userId);

    if (error) {
      console.error('[CART DELETE] Error:', JSON.stringify(error));
      throw error;
    }

    console.log(`[CART DELETE] Cart cleared for userId=${userId}`);
    res.json({ message: 'Cart cleared' });
  } catch (error) {
    console.error('[CART DELETE] Exception:', error.message);
    res.status(500).json({ message: 'Error clearing cart', error: error.message });
  }
};

// Diagnostic endpoint — public, no auth required
// Call GET /api/cart/diagnostic?userId=<id>  to see raw Supabase data
export const cartDiagnostic = async (req, res) => {
  try {
    const { userId } = req.query;

    // First check if the cart column exists by querying 1 row
    const { data: sample, error: colError } = await supabase
      .from('users')
      .select('id, cart')
      .limit(1);

    const columnCheck = {
      columnExists: !colError,
      columnError: colError ? colError.message : null,
      sampleCartType: sample?.[0] ? typeof sample[0].cart : 'no_rows',
      sampleCartValue: sample?.[0]?.cart ?? 'undefined',
    };

    if (!userId) {
      return res.json({
        diagnostic: 'provide ?userId=<supabase_user_id> for full check',
        columnCheck,
      });
    }

    // Fetch specific user cart
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, cart')
      .eq('id', userId)
      .maybeSingle();

    res.json({
      columnCheck,
      userId,
      userFound: !!user,
      userError: userError?.message ?? null,
      cartItemCount: Array.isArray(user?.cart) ? user.cart.length : 'cart_not_array',
      cartRawType: typeof user?.cart,
      cartItems: user?.cart ?? null,
    });
  } catch (e) {
    res.status(500).json({ diagnostic: 'exception', error: e.message });
  }
};
