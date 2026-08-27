import { supabase } from '../config/supabase.js';
import { initialReviews, initialFaqs } from '../data/seedData.js';

export const getReviews = async (req, res) => {
  try {
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && reviews && reviews.length > 0) {
      return res.json(reviews);
    }
    res.json(initialReviews);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching reviews', error: error.message });
  }
};

export const getFaqs = async (req, res) => {
  try {
    res.json(initialFaqs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching FAQs', error: error.message });
  }
};
