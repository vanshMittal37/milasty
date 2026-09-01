import { supabase } from '../config/supabase.js';
import { initialReviews, initialFaqs } from '../data/seedData.js';

export const getReviews = async (req, res) => {
  try {
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && reviews) {
      return res.json(reviews);
    }
    // Return seed reviews as fallback if table is empty or error occurs
    res.json(initialReviews);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching reviews', error: error.message });
  }
};

export const createReview = async (req, res) => {
  try {
    const { productId, name, email, rating, comment, isVerified = false, status = 'approved' } = req.body;
    const userId = req.user ? (req.user.id || req.user._id) : null;

    const { data: review, error } = await supabase
      .from('reviews')
      .insert([
        {
          product_id: productId || null,
          user_id: userId,
          name: name || 'Customer',
          email: email || '',
          rating: Number(rating || 5),
          comment: comment || '',
          is_verified: isVerified,
          status,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ message: 'Error creating review', error: error.message });
  }
};

export const updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment, status, isVerified } = req.body;

    const updates = { updated_at: new Date() };
    if (rating !== undefined) updates.rating = Number(rating);
    if (comment !== undefined) updates.comment = comment;
    if (status !== undefined) updates.status = status;
    if (isVerified !== undefined) updates.is_verified = isVerified;

    const { data: review, error } = await supabase
      .from('reviews')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(review);
  } catch (error) {
    res.status(500).json({ message: 'Error updating review', error: error.message });
  }
};

export const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting review', error: error.message });
  }
};

export const getFaqs = async (req, res) => {
  try {
    res.json(initialFaqs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching FAQs', error: error.message });
  }
};
