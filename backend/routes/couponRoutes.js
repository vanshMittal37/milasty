import express from 'express';
import {
  validateCoupon,
  getFeaturedPromoCoupon,
  getActiveCoupons,
  getFreeDeliveryOffer,
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} from '../controllers/couponController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/validate', validateCoupon);
router.get('/featured', getFeaturedPromoCoupon);
router.get('/active', getActiveCoupons);
router.get('/free-delivery', getFreeDeliveryOffer);
router.get('/', protect, adminOnly, getCoupons);
router.post('/', protect, adminOnly, createCoupon);
router.put('/:id', protect, adminOnly, updateCoupon);
router.delete('/:id', protect, adminOnly, deleteCoupon);

export default router;

