const getFrontendBaseUrl = () => {
  return process.env.FRONTEND_URL || process.env.APP_URL || 'https://milasty.com';
};

/**
 * ─── ADMIN SYSTEM & RELIABILITY NOTIFICATIONS ───────────────────────────────
 */
export const adminWhatsAppDisconnected = ({ reason = 'Session closed' }) => {
  const adminUrl = `${getFrontendBaseUrl()}/admin/whatsapp`;

  return [
    '⚠️ MILASTY WHATSAPP ALERT',
    '',
    'Your WhatsApp connection has been disconnected.',
    `Reason: ${reason}`,
    '',
    'Please scan the QR code on the admin panel to reconnect and resume automated notifications.',
    '',
    `👉 Reconnect: ${adminUrl}`,
  ].join('\n');
};

export const adminNotificationFailed = ({
  eventType = '',
  recipientPhone = '',
  recipientType = 'customer',
  error = 'Max retries exceeded',
}) => {
  const adminUrl = `${getFrontendBaseUrl()}/admin/whatsapp`;

  return [
    '🚨 WHATSAPP NOTIFICATION DELIVERY FAILED',
    '',
    `Event: ${eventType}`,
    `Recipient Type: ${recipientType}`,
    `Recipient Phone: +91 ${recipientPhone}`,
    `Error: ${error}`,
    '',
    'Action Required: Please check the delivery history log to retry or verify recipient details.',
    '',
    `👉 View Notification Log: ${adminUrl}`,
  ].join('\n');
};
