import express from 'express';
import {
  getPublicPrebookings,
  getAllAdminPrebookings,
  createPrebooking,
  updatePrebooking,
  deletePrebooking,
} from '../controllers/prebookingController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// PUBLIC PRE-BOOKING PRODUCTS
router.get('/active', getPublicPrebookings);
router.get('/', getPublicPrebookings);

// ADMIN PRE-BOOKING MANAGEMENT
router.get('/admin/all', protect, adminOnly, getAllAdminPrebookings);
router.post('/', protect, adminOnly, createPrebooking);
router.put('/:id', protect, adminOnly, updatePrebooking);
router.delete('/:id', protect, adminOnly, deletePrebooking);

export default router;
