import express from 'express';
import { getReviews, createReview, updateReview, deleteReview, getFaqs } from '../controllers/reviewController.js';
import { protect, adminOnly, optionalProtect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/reviews', getReviews);
router.post('/reviews', optionalProtect, createReview);
router.put('/reviews/:id', protect, adminOnly, updateReview);
router.delete('/reviews/:id', protect, adminOnly, deleteReview);

router.get('/faqs', getFaqs);

export default router;
