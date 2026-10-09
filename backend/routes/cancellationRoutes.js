import express from 'express';
import {
  listCancellations,
  getCancellationSummary,
  getCancellationDetail,
  markCancellationsSeen,
  updateRefundStatus,
  markRefundSuccessful,
  retryShipmentCancel,
  resolveShipmentManually,
} from '../controllers/cancellationController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

// Admin: Cancellations & Refunds — mounted at /api/admin/cancellations
const router = express.Router();
router.use(protect, adminOnly);

router.get('/', listCancellations);
router.get('/summary', getCancellationSummary);
router.post('/mark-seen', markCancellationsSeen);
router.get('/:id', getCancellationDetail);
router.post('/:id/refund-status', updateRefundStatus);
router.post('/:id/mark-refunded', markRefundSuccessful);
router.post('/:id/retry-shipment-cancel', retryShipmentCancel);
router.post('/:id/resolve-shipment', resolveShipmentManually);

export default router;
