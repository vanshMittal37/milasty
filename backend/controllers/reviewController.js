import Review from '../models/Review.js';
import Faq from '../models/Faq.js';
import { initialReviews, initialFaqs } from '../data/seedData.js';

let memoryReviews = [...initialReviews];
let memoryFaqs = [...initialFaqs];

export const getReviews = async (req, res) => {
  try {
    try {
      const reviews = await Review.find().sort({ createdAt: -1 });
      if (reviews && reviews.length > 0) return res.json(reviews);
    } catch (e) {
      // Fallback
    }
    res.json(memoryReviews);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching reviews', error: error.message });
  }
};

export const getFaqs = async (req, res) => {
  try {
    try {
      const faqs = await Faq.find().sort({ order: 1 });
      if (faqs && faqs.length > 0) return res.json(faqs);
    } catch (e) {
      // Fallback
    }
    res.json(memoryFaqs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching FAQs', error: error.message });
  }
};
