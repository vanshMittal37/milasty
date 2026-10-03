import express from 'express';
import {
  getShiprathRates,
  bookShipmentForOrder,
  trackShipment,
  trackOrderShipment,
} from '../controllers/shipratController.js';
import { protect, adminOnly, optionalProtect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public rate check (used by checkout flow to display estimated shipping)
router.post('/rates', optionalProtect, getShiprathRates);

// Live track by AWB (authenticated customer or admin)
router.get('/track/:awb', protect, trackShipment);

// Track by order ID or order number (customer-facing)
router.get('/order/:orderId/tracking', optionalProtect, trackOrderShipment);

// Admin: manually trigger Shiprath booking for an order
router.post('/book', protect, adminOnly, bookShipmentForOrder);

export default router;
