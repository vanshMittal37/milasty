import express from 'express';
import {
  getConnectionStatus,
  getQRCode,
  reconnect,
  disconnect,
  sendTestMessage,
  getNotificationHistory,
  getNotificationStats,
} from '../controllers/adminWhatsAppController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// Strict security: all endpoints require admin authentication
router.use(protect, adminOnly);

router.get('/status', getConnectionStatus);
router.get('/qr', getQRCode);
router.post('/reconnect', reconnect);
router.post('/disconnect', disconnect);
router.post('/test-message', sendTestMessage);
router.get('/history', getNotificationHistory);
router.get('/stats', getNotificationStats);

export default router;
