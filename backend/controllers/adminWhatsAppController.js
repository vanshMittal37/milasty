import {
  getWhatsAppStatus,
  reconnectWhatsApp,
  disconnectWhatsApp,
  sendWhatsAppMessage,
} from '../services/whatsappService.js';
import { getQueueMemoryState } from '../services/notificationQueue.js';
import { supabase } from '../config/supabase.js';
import { normalizeIndianMobile } from '../utils/phone.js';

// In-memory rate limiting for admin test messages: adminId/ip -> { count, windowStart }
const testMessageRateLimits = new Map();
const TEST_MSG_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_TEST_MESSAGES_PER_WINDOW = 15;

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
    const status = getWhatsAppStatus();

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
 * Body: { clearAuth: boolean } (clearAuth = true clears session credentials to link a new number)
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
    res.status(500).json({ success: false, message: 'Failed to disconnect WhatsApp', error: error.message });
  }
};

/**
 * 5. SEND TEST WHATSAPP MESSAGE
 * POST /api/admin/whatsapp/test-message
 * Body: { phone, message }
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
 * 6. GET NOTIFICATION HISTORY (FILTERABLE)
 * GET /api/admin/whatsapp/history?status=all|sent|pending|failed&limit=50&offset=0
 */
export const getNotificationHistory = async (req, res) => {
  try {
    const statusFilter = req.query.status ? String(req.query.status).toLowerCase().trim() : 'all';
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const offset = Math.max(0, parseInt(req.query.offset, 10) || 0);

    // 1. Try querying Supabase public.whatsapp_notifications table
    try {
      let query = supabase
        .from('whatsapp_notifications')
        .select('*', { count: 'exact' });

      if (['sent', 'pending', 'failed'].includes(statusFilter)) {
        query = query.eq('status', statusFilter);
      }

      query = query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      const { data, count, error } = await query;

      if (!error && Array.isArray(data)) {
        const notifications = data.map((n) => ({
          id: n.id,
          recipient_phone: n.recipient_phone,
          masked_phone: maskPhoneNumber(n.recipient_phone),
          event_type: n.event_type,
          reference_id: n.reference_id,
          message_body: n.message_body,
          status: n.status,
          attempts: n.attempts,
          last_error: n.last_error,
          sent_via: n.sent_via,
          sent_at: n.sent_at,
          created_at: n.created_at,
          metadata: n.metadata,
        }));

        return res.json({
          success: true,
          source: 'database',
          total: count ?? notifications.length,
          limit,
          offset,
          notifications,
        });
      }
    } catch (dbErr) {
      // Table may not exist before migration 28 — fall back smoothly to memory
    }

    // 2. Fallback to in-memory queue history
    const { history } = getQueueMemoryState();
    let filtered = history;

    if (['sent', 'pending', 'failed'].includes(statusFilter)) {
      filtered = history.filter((item) => String(item.status || '').toLowerCase() === statusFilter);
    }

    const paginated = filtered.slice(offset, offset + limit).map((n) => ({
      id: n.id,
      recipient_phone: n.recipient_phone,
      masked_phone: maskPhoneNumber(n.recipient_phone),
      event_type: n.event_type,
      reference_id: n.reference_id,
      message_body: n.message_body,
      status: n.status || 'pending',
      attempts: n.attempts || 0,
      last_error: n.last_error || null,
      sent_via: n.sent_via || 'whatsapp',
      sent_at: n.sent_at || null,
      created_at: n.created_at || new Date().toISOString(),
      metadata: n.metadata || {},
    }));

    return res.json({
      success: true,
      source: 'memory',
      total: filtered.length,
      limit,
      offset,
      notifications: paginated,
    });
  } catch (error) {
    console.error('[ADMIN WHATSAPP] Error fetching history:', error);
    res.status(500).json({ success: false, message: 'Error retrieving notification history', error: error.message });
  }
};

/**
 * 7. GET MESSAGE STATISTICS
 * GET /api/admin/whatsapp/stats
 */
export const getNotificationStats = async (req, res) => {
  try {
    // 1. Try querying Supabase
    try {
      const [allRes, sentRes, pendingRes, failedRes] = await Promise.all([
        supabase.from('whatsapp_notifications').select('id', { count: 'exact', head: true }),
        supabase.from('whatsapp_notifications').select('id', { count: 'exact', head: true }).eq('status', 'sent'),
        supabase.from('whatsapp_notifications').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('whatsapp_notifications').select('id', { count: 'exact', head: true }).eq('status', 'failed'),
      ]);

      if (!allRes.error) {
        const total = allRes.count || 0;
        const sent = sentRes.count || 0;
        const pending = pendingRes.count || 0;
        const failed = failedRes.count || 0;
        const finished = sent + failed;
        const successRate = finished > 0 ? `${((sent / finished) * 100).toFixed(1)}%` : '100.0%';

        return res.json({
          success: true,
          source: 'database',
          stats: {
            total,
            sent,
            pending,
            failed,
            successRate,
          },
        });
      }
    } catch (e) {
      // Fall through to memory
    }

    // 2. Fallback to in-memory history
    const { history, pendingQueue } = getQueueMemoryState();
    const sent = history.filter((i) => i.status === 'sent').length;
    const failed = history.filter((i) => i.status === 'failed').length;
    const pending = pendingQueue.length + history.filter((i) => i.status === 'pending').length;
    const total = history.length;
    const finished = sent + failed;
    const successRate = finished > 0 ? `${((sent / finished) * 100).toFixed(1)}%` : '100.0%';

    return res.json({
      success: true,
      source: 'memory',
      stats: {
        total,
        sent,
        pending,
        failed,
        successRate,
      },
    });
  } catch (error) {
    console.error('[ADMIN WHATSAPP] Error fetching stats:', error);
    res.status(500).json({ success: false, message: 'Error retrieving statistics', error: error.message });
  }
};
