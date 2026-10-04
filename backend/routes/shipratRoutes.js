import express from 'express';
import {
  getShiprathRates,
  checkShiprathConnection,
  adminTestRate,
  bookShipmentForOrder,
  trackShipment,
  trackOrderShipment,
  cancelOrderWithShipment,
  diagnoseCredentials,
} from '../controllers/shipratController.js';
import { protect, adminOnly, optionalProtect } from '../middleware/authMiddleware.js';

const router = express.Router();

// ─── Public / Checkout Endpoints ─────────────────────────────────────────────

// Dynamic live rate calculation (used by Checkout & Cart)
router.post('/rates', optionalProtect, getShiprathRates);

// Live track by AWB
router.get('/track/:awb', optionalProtect, trackShipment);

// Track by order ID or order number
router.get('/order/:orderId/tracking', optionalProtect, trackOrderShipment);

// Order cancellation with MILASTY business rules (0-3h 100%, 3-6h 50%, >6h disabled)
router.post('/order/:id/cancel', protect, cancelOrderWithShipment);

// ─── Admin Endpoints ─────────────────────────────────────────────────────────

// Connection status & warehouse settings check
router.get('/connection-status', protect, adminOnly, checkShiprathConnection);

// Admin-only rate calculation test (without creating shipment)
router.post('/test-rate', protect, adminOnly, adminTestRate);

// Manual shipment creation trigger
router.post('/book', protect, adminOnly, bookShipmentForOrder);

// ─── Diagnostic (PUBLIC — NO AUTH) ───────────────────────────────────────────
// Safe: does NOT expose secrets, does NOT create shipments
// Used to diagnose Railway env var issues
router.get('/diagnose-credentials', diagnoseCredentials);

export default router;

