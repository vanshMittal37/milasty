import {
  getWhatsAppStatus,
  reconnectWhatsApp,
  disconnectWhatsApp,
  sendWhatsAppMessage,
  clearSessionAndRestart,
  initializeWhatsApp,
} from '../services/whatsappService.js';
import {
  getNotificationHistory as fetchNotificationHistory,
  getQueueStats,
  retryNotification,
  getQueueMemoryState,
} from '../services/notificationQueue.js';
import {
  getNotificationSettings,
  updateNotificationSettings,
  getAdminRecipients,
  addAdminRecipient,
  updateAdminRecipient,
  deleteAdminRecipient,
} from '../services/whatsappSettingsService.js';
import { normalizeIndianMobile } from '../utils/phone.js';

// In-memory rate limiting for admin test messages: adminId/ip -> { count, windowStart }
const testMessageRateLimits = new Map();
const TEST_MSG_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_TEST_MESSAGES_PER_WINDOW = 20;

function checkTestMessageRateLimit(key) {
  if (!key) return true;
  const now = Date.now();
  const entry = testMessageRateLimits.get(key);

  if (!entry || now - entry.windowStart > TEST_MSG_WINDOW_MS) {
    testMessageRateLimits.set(key, { count: 1, windowStart: now });
    return true;
  }

  if (entry.count >= MAX_TEST_MESSAGES_PER_WINDOW) {
    return false;
  }

  entry.count += 1;
  return true;
}

/**
 * Mask mobile number for sensitive display (e.g. 9876543210 -> 98****3210)
 */
export function maskPhoneNumber(phone) {
  if (!phone) return 'N/A';
  const clean = String(phone).replace(/\D/g, '');
  if (clean.length < 10) return phone;
  const last10 = clean.slice(-10);
  return `${last10.slice(0, 2)}****${last10.slice(-4)}`;
}

/**
 * 1. GET WHATSAPP CONNECTION STATUS
 * GET /api/admin/whatsapp/status
 */
export const getConnectionStatus = async (req, res) => {
  try {
    const status = getWhatsAppStatus();
    res.json({
      success: true,
      isConnected: status.isConnected,
      status: status.status,
      connectedPhone: status.connectedPhone,
      connectedUser: status.connectedUser,
      lastConnectedAt: status.lastConnectedAt,
      lastMessageAt: status.lastMessageAt,
      reconnectAttempts: status.reconnectAttempts,
      hasSessionAuth: status.hasSessionAuth,
      hasQrCode: Boolean(status.qrDataUrl || status.qr),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[ADMIN WHATSAPP] Error fetching status:', error);
    res.status(500).json({ success: false, message: 'Error retrieving connection status', error: error.message });
  }
};

/**
 * 2. GET WHATSAPP QR CODE
 * GET /api/admin/whatsapp/qr
 */
export const getQRCode = async (req, res) => {
  try {
    let status = getWhatsAppStatus();

    if (status.isConnected) {
      return res.json({
        success: true,
        connected: true,
        status: status.status,
        message: 'WhatsApp is already connected.',
        qr: null,
        qrDataUrl: null,
      });
    }

    // If socket is disconnected and has no active QR, trigger initialization to generate QR
    if (!status.qr && status.status === 'disconnected') {
      try {
        await initializeWhatsApp();
        status = getWhatsAppStatus();
      } catch (initErr) {
        console.warn('[ADMIN WHATSAPP] QR on-demand initialization notice:', initErr.message);
      }
    }

    return res.json({
      success: true,
      connected: false,
      status: status.status,
      qr: status.qr,
      qrDataUrl: status.qrDataUrl,
      timestamp: status.qrTimestamp,
    });
  } catch (error) {
    console.error('[ADMIN WHATSAPP] Error retrieving QR code:', error);
    res.status(500).json({ success: false, message: 'Error retrieving QR code', error: error.message });
  }
};

/**
 * 3. RECONNECT WHATSAPP
 * POST /api/admin/whatsapp/reconnect
 */
export const reconnect = async (req, res) => {
  try {
    console.log(`[ADMIN WHATSAPP] Reconnection requested by admin: ${req.user?.email || req.user?.id}`);
    await reconnectWhatsApp();
    res.json({
      success: true,
      message: 'WhatsApp reconnection initiated. Checking credentials and establishing socket...',
    });
  } catch (error) {
    console.error('[ADMIN WHATSAPP] Error during reconnection:', error);
    res.status(500).json({ success: false, message: 'Failed to initiate reconnection', error: error.message });
  }
};

/**
 * 4. DISCONNECT WHATSAPP
 * POST /api/admin/whatsapp/disconnect
 */
export const disconnect = async (req, res) => {
  try {
    const clearAuth = req.body?.clearAuth === true;
    console.log(`[ADMIN WHATSAPP] Disconnection requested by admin: ${req.user?.email || req.user?.id} (clearAuth: ${clearAuth})`);

    await disconnectWhatsApp(clearAuth);

    res.json({
      success: true,
      message: clearAuth
        ? 'WhatsApp session cleared. Scan the new QR code to connect a different number.'
        : 'WhatsApp disconnected. Credentials preserved for future reconnection.',
      clearAuth,
    });
  } catch (error) {
    console.error('[ADMIN WHATSAPP] Error during disconnection:', error);
    res.status(500).json({
      success: false,
      message: `Failed to disconnect WhatsApp: ${error.message || 'credential clearance failed'}`,
      error: error.message,
    });
  }
};

/**
 * 4b. CLEAR WHATSAPP SESSION & RESTART
 * POST /api/admin/whatsapp/clear-session
 */
export const clearSession = async (req, res) => {
  try {
    console.log(`[ADMIN WHATSAPP] Clear session requested by admin: ${req.user?.email || req.user?.id}`);
    await clearSessionAndRestart();
    res.json({
      success: true,
      message: 'WhatsApp session cleared. Generating fresh pairing QR code...',
    });
  } catch (error) {
    console.error('[ADMIN WHATSAPP] Error clearing session:', error);
    res.status(500).json({
      success: false,
      message: `Failed to clear WhatsApp session: ${error.message || 'credential deletion failed'}`,
      error: error.message,
    });
  }
};

/**
 * 5. SEND TEST WHATSAPP MESSAGE
 * POST /api/admin/whatsapp/test-message
 */
export const sendTestMessage = async (req, res) => {
  try {
    const { phone: rawPhone, message: rawMessage } = req.body;

    // Rate limit check
    const rateKey = req.user?.id || req.ip;
    if (!checkTestMessageRateLimit(rateKey)) {
      return res.status(429).json({
        success: false,
        message: 'Too many test messages sent. Please wait 15 minutes before sending another test.',
      });
    }

    const phone = normalizeIndianMobile(rawPhone);
    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid 10-digit Indian mobile number (e.g. 9876543210).',
      });
    }

    const message = String(rawMessage || '').trim();
    if (!message || message.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a message to send (at least 2 characters).',
      });
    }

    if (message.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Test message cannot exceed 1000 characters.',
      });
    }

    const status = getWhatsAppStatus();
    if (!status.isConnected) {
      return res.status(503).json({
        success: false,
        message: 'Cannot send test message: WhatsApp is currently disconnected. Please connect or scan the QR code first.',
      });
    }

    console.log(`[ADMIN WHATSAPP] Sending test message to ${phone} by admin ${req.user?.email || req.user?.id}...`);
    const result = await sendWhatsAppMessage(phone, message);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: `Failed to deliver WhatsApp message: ${result.error}`,
        error: result.error,
      });
    }

    res.json({
      success: true,
      message: `Test message successfully delivered to +91 ${phone}!`,
      messageId: result.messageId,
      recipient: phone,
      timestamp: result.timestamp || new Date().toISOString(),
    });
  } catch (error) {
    console.error('[ADMIN WHATSAPP] Error sending test message:', error);
    res.status(500).json({ success: false, message: 'Error sending test message', error: error.message });
  }
};

/**
 * 6. GET NOTIFICATION HISTORY (FILTERABLE BY RECIPIENT TYPE, EVENT, STATUS, SEARCH)
 * GET /api/admin/whatsapp/history
 */
export const getNotificationHistory = async (req, res) => {
  try {
    const status = req.query.status ? String(req.query.status).toLowerCase().trim() : 'all';
    const recipientType = req.query.recipientType ? String(req.query.recipientType).toLowerCase().trim() : 'all';
    const eventType = req.query.eventType ? String(req.query.eventType).toLowerCase().trim() : 'all';
    const search = req.query.search ? String(req.query.search).trim() : null;
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const offset = Math.max(0, parseInt(req.query.offset, 10) || 0);

    const { total, notifications } = await fetchNotificationHistory({
      limit,
      offset,
      status,
      eventType,
      recipientType,
      search,
    });

    const masked = notifications.map((n) => ({
      ...n,
      recipient_type: n.recipient_type || 'customer',
      masked_phone: maskPhoneNumber(n.recipient_phone),
    }));

    return res.json({
      success: true,
      total,
      limit,
      offset,
      notifications: masked,
    });
  } catch (error) {
    console.error('[ADMIN WHATSAPP] Error fetching history:', error);
    res.status(500).json({ success: false, message: 'Error retrieving notification history', error: error.message });
  }
};

/**
 * 7. GET MESSAGE STATISTICS WITH CUSTOMER & ADMIN BREAKDOWN
 * GET /api/admin/whatsapp/stats
 */
export const getNotificationStats = async (req, res) => {
  try {
    const queueData = await getQueueStats();
    return res.json({
      success: true,
      stats: queueData.stats,
      queueLength: queueData.queueLength,
      isProcessing: queueData.isProcessing,
      dbTableAvailable: queueData.dbTableAvailable,
    });
  } catch (error) {
    console.error('[ADMIN WHATSAPP] Error fetching stats:', error);
    res.status(500).json({ success: false, message: 'Error retrieving statistics', error: error.message });
  }
};

/**
 * 8. RETRY FAILED NOTIFICATION
 * POST /api/admin/whatsapp/retry/:id
 */
export const retryNotificationHandler = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: 'Notification ID is required.' });
    }

    const result = await retryNotification(id);
    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json({ success: true, message: result.message });
  } catch (error) {
    console.error('[ADMIN WHATSAPP] Error retrying notification:', error);
    res.status(500).json({ success: false, message: 'Failed to retry notification', error: error.message });
  }
};

/**
 * 9. GET NOTIFICATION MATRIX SETTINGS
 * GET /api/admin/whatsapp/settings
 */
export const getSettingsHandler = async (req, res) => {
  try {
    const settings = await getNotificationSettings();
    res.json({ success: true, settings });
  } catch (error) {
    console.error('[ADMIN WHATSAPP] Error fetching settings:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve notification settings', error: error.message });
  }
};

/**
 * 10. UPDATE NOTIFICATION MATRIX SETTINGS
 * PUT /api/admin/whatsapp/settings
 */
export const updateSettingsHandler = async (req, res) => {
  try {
    const { settings } = req.body;
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ success: false, message: 'Invalid settings payload.' });
    }

    const updated = await updateNotificationSettings(settings);
    res.json({ success: true, message: 'Notification settings updated successfully', settings: updated });
  } catch (error) {
    console.error('[ADMIN WHATSAPP] Error updating settings:', error);
    res.status(500).json({ success: false, message: 'Failed to update notification settings', error: error.message });
  }
};

/**
 * 11. GET ADMIN RECIPIENTS
 * GET /api/admin/whatsapp/recipients
 */
export const getRecipientsHandler = async (req, res) => {
  try {
    const recipients = await getAdminRecipients();
    res.json({ success: true, recipients });
  } catch (error) {
    console.error('[ADMIN WHATSAPP] Error fetching recipients:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve admin recipients', error: error.message });
  }
};

/**
 * 12. ADD ADMIN RECIPIENT
 * POST /api/admin/whatsapp/recipients
 */
export const addRecipientHandler = async (req, res) => {
  try {
    const { name, phone, is_primary, categories } = req.body;
    const recipient = await addAdminRecipient({ name, phone, is_primary, categories });
    res.status(201).json({ success: true, message: 'Admin recipient added successfully', recipient });
  } catch (error) {
    console.error('[ADMIN WHATSAPP] Error adding recipient:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * 13. UPDATE ADMIN RECIPIENT
 * PUT /api/admin/whatsapp/recipients/:id
 */
export const updateRecipientHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const updated = await updateAdminRecipient(id, updates);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Admin recipient not found.' });
    }
    res.json({ success: true, message: 'Admin recipient updated successfully', recipient: updated });
  } catch (error) {
    console.error('[ADMIN WHATSAPP] Error updating recipient:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * 14. DELETE ADMIN RECIPIENT
 * DELETE /api/admin/whatsapp/recipients/:id
 */
export const deleteRecipientHandler = async (req, res) => {
  try {
    const { id } = req.params;
    await deleteAdminRecipient(id);
    res.json({ success: true, message: 'Admin recipient removed successfully' });
  } catch (error) {
    console.error('[ADMIN WHATSAPP] Error deleting recipient:', error);
    res.status(500).json({ success: false, message: 'Failed to delete admin recipient', error: error.message });
  }
};
