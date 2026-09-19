import express from 'express';
import {
  createCustomerReview,
  getMyCustomerReviews,
  getProductReviews,
  getAllAdminReviews,
  createAdminProductReview,
  updateReviewStatus,
  updateReview,
  deleteReview,
  getPublicTestimonials,
  getAllAdminTestimonials,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
  getFaqs,
} from '../controllers/reviewController.js';
import { protect, adminOnly, optionalProtect } from '../middleware/authMiddleware.js';

const router = express.Router();

// CUSTOMER & PUBLIC PRODUCT REVIEWS
router.post('/reviews', protect, createCustomerReview);
router.get('/reviews/my-reviews', protect, getMyCustomerReviews);
router.get('/reviews/product/:productId', getProductReviews);

// ADMIN PRODUCT REVIEWS MODERATION
router.get('/reviews/admin/all', protect, adminOnly, getAllAdminReviews);
router.post('/reviews/admin/create', protect, adminOnly, createAdminProductReview);
router.put('/reviews/:id/status', protect, adminOnly, updateReviewStatus);
router.put('/reviews/:id', protect, adminOnly, updateReview);
router.delete('/reviews/:id', protect, adminOnly, deleteReview);

// PUBLIC & ADMIN TESTIMONIALS (HOMEPAGE BRAND TESTIMONIALS)
router.get('/testimonials', getPublicTestimonials);
router.get('/testimonials/admin/all', protect, adminOnly, getAllAdminTestimonials);
router.post('/testimonials', protect, adminOnly, createTestimonial);
router.put('/testimonials/:id', protect, adminOnly, updateTestimonial);
router.delete('/testimonials/:id', protect, adminOnly, deleteTestimonial);

// LEGACY & FAQ ROUTES
router.get('/reviews', getAllAdminReviews);
router.get('/faqs', getFaqs);

export default router;
