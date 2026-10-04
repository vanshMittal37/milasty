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
import { bookShipmentForOrder } from '../controllers/shipratController.js';
import { protect, adminOnly, optionalProtect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public & Customer Routes
router.post('/', optionalProtect, createOrder);
router.get('/my-orders', protect, getMyOrders);
router.get('/detail/:identifier', getOrderById);
router.put('/:id/cancel', protect, cancelOrder);

// Admin Protected Routes
router.get('/admin/analytics', protect, adminOnly, getAdminAnalytics);
router.get('/admin/all', protect, adminOnly, getAllOrders);
router.put('/admin/:id/status', protect, adminOnly, updateOrderStatus);
// Admin: manually retrigger Shiprath booking for an unshipped confirmed order
router.post('/admin/:id/book-shipment', protect, adminOnly, bookShipmentForOrder);

export default router;

