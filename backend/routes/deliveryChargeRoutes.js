import express from 'express';
import {
  calculateDeliveryPublic,
  getDeliveryRules,
  createDeliveryRule,
  updateDeliveryRule,
  deleteDeliveryRule,
} from '../controllers/deliveryChargeController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public Endpoint: Calculate delivery charge by order subtotal
router.get('/calculate', calculateDeliveryPublic);

// Public Endpoint: Fetch active rules for storefront display
router.get('/public-rules', getDeliveryRules);

// Admin Endpoints (CRUD)
router.get('/', protect, adminOnly, getDeliveryRules);
router.post('/', protect, adminOnly, createDeliveryRule);
router.put('/:id', protect, adminOnly, updateDeliveryRule);
router.delete('/:id', protect, adminOnly, deleteDeliveryRule);

export default router;
