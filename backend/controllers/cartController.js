import { supabase } from '../config/supabase.js';

export const getCart = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { data: user, error } = await supabase
      .from('users')
      .select('cart')
      .eq('id', userId)
      .single();

    if (error || !user) {
      return res.json({ items: [] });
    }
    res.json({ items: user.cart || [] });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching cart', error: error.message });
  }
};

export const updateCart = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { items } = req.body;

    const { data, error } = await supabase
      .from('users')
      .update({ cart: items || [], updated_at: new Date() })
      .eq('id', userId)
      .select('cart')
      .single();

    if (error) throw error;
    res.json({ items: data?.cart || [] });
  } catch (error) {
    res.status(500).json({ message: 'Error updating cart', error: error.message });
  }
};

export const clearCart = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    await supabase
      .from('users')
      .update({ cart: [], updated_at: new Date() })
      .eq('id', userId);

    res.json({ message: 'Cart cleared' });
  } catch (error) {
    res.status(500).json({ message: 'Error clearing cart', error: error.message });
  }
};
