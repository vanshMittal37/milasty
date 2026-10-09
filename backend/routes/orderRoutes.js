import express from 'express';
import {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  getAllOrders,
  updateOrderStatus,
  getAdminAnalytics,
} from '../controllers/orderController.js';
import { bookShipmentForOrder, getShipmentPreview } from '../controllers/shipratController.js';
import { getCancellationQuote } from '../controllers/cancellationController.js';
import { protect, adminOnly, optionalProtect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public & Customer Routes
router.post('/', optionalProtect, createOrder);
router.get('/my-orders', protect, getMyOrders);
router.get('/detail/:identifier', protect, getOrderById);
router.get('/:id/cancellation-quote', protect, getCancellationQuote);
router.put('/:id/cancel', protect, cancelOrder);

// Admin Protected Routes
router.get('/admin/analytics', protect, adminOnly, getAdminAnalytics);
router.get('/admin/all', protect, adminOnly, getAllOrders);
router.put('/admin/:id/status', protect, adminOnly, updateOrderStatus);
// Admin: Create Shipment (shipments are never created automatically at checkout)
router.get('/admin/:id/shipment-preview', protect, adminOnly, getShipmentPreview);
router.post('/admin/:id/book-shipment', protect, adminOnly, bookShipmentForOrder);
router.post('/admin/:id/retry-shipment', protect, adminOnly, bookShipmentForOrder);

export default router;

