import express from 'express';
import {
  getConnectionStatus,
  getQRCode,
  reconnect,
  disconnect,
  clearSession,
  sendTestMessage,
  getNotificationHistory,
  getNotificationStats,
  retryNotificationHandler,
  getSettingsHandler,
  updateSettingsHandler,
  getRecipientsHandler,
  addRecipientHandler,
  updateRecipientHandler,
  deleteRecipientHandler,
} from '../controllers/adminWhatsAppController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// Strict security: all endpoints require admin authentication
router.use(protect, adminOnly);

// Connection & Diagnostics
router.get('/status', getConnectionStatus);
router.get('/qr', getQRCode);
router.post('/reconnect', reconnect);
router.post('/disconnect', disconnect);
router.post('/clear-session', clearSession);
router.post('/test-message', sendTestMessage);

// Delivery History, Stats & Retry
router.get('/history', getNotificationHistory);
router.get('/stats', getNotificationStats);
router.post('/retry/:id', retryNotificationHandler);

// Notification Matrix Settings
router.get('/settings', getSettingsHandler);
router.put('/settings', updateSettingsHandler);

// Admin Personal Recipients Management
router.get('/recipients', getRecipientsHandler);
router.post('/recipients', addRecipientHandler);
router.put('/recipients/:id', updateRecipientHandler);
router.delete('/recipients/:id', deleteRecipientHandler);

export default router;
