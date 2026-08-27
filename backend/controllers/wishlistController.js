import { supabase } from '../config/supabase.js';

export const getWishlist = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { data: user, error } = await supabase
      .from('users')
      .select('wishlist')
      .eq('id', userId)
      .single();

    if (error || !user) {
      return res.json([]);
    }
    res.json(user.wishlist || []);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching wishlist', error: error.message });
  }
};

export const toggleWishlist = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { productId } = req.body;

    const { data: user, error: fetchErr } = await supabase
      .from('users')
      .select('wishlist')
      .eq('id', userId)
      .single();

    if (fetchErr || !user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let wishlist = user.wishlist || [];
    let added = false;

    if (wishlist.includes(productId)) {
      wishlist = wishlist.filter((id) => id !== productId);
    } else {
      wishlist.push(productId);
      added = true;
    }

    const { error: updateErr } = await supabase
      .from('users')
      .update({ wishlist, updated_at: new Date() })
      .eq('id', userId);

    if (updateErr) throw updateErr;

    res.json({ added, wishlist });
  } catch (error) {
    res.status(500).json({ message: 'Error toggling wishlist item', error: error.message });
  }
};
