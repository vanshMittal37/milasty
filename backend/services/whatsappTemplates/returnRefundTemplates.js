import { formatINR, getCustomerOrderUrl } from './orderTemplates.js';

const getFrontendBaseUrl = () => {
  return process.env.FRONTEND_URL || process.env.APP_URL || 'https://milasty.com';
};

/**
 * ─── CUSTOMER RETURN & REFUND NOTIFICATIONS ─────────────────────────────────
 */
export const customerReturnRequested = ({ customerName = 'Valued Customer', orderId = '', orderNumber = '' }) => {
  const displayId = orderNumber || orderId;
  const orderUrl = getCustomerOrderUrl(orderId, orderNumber);

  const lines = [
    `🌿 Namaste ${customerName},`,
    '',
    `We've received your return request for order *#${displayId}*.`,
    '',
    'Our team will review your request and update you shortly.',
  ];

  if (orderUrl) {
    lines.push('');
    lines.push(`👉 View Order: ${orderUrl}`);
  }

  lines.push('');
  lines.push('Warm regards,');
  lines.push('Team MILASTY 🌿');

  return lines.join('\n');
};

export const customerCancellationRequested = ({ customerName = 'Valued Customer', orderId = '', orderNumber = '' }) => {
  const displayId = orderNumber || orderId;
  const orderUrl = getCustomerOrderUrl(orderId, orderNumber);

  const lines = [
    `🌿 Namaste ${customerName},`,
    '',
    `Your cancellation request for order *#${displayId}* has been received.`,
    '',
    'Our team will review it and share an update shortly.',
  ];

  if (orderUrl) {
    lines.push('');
    lines.push(`👉 View Order: ${orderUrl}`);
  }

  lines.push('');
  lines.push('Warm regards,');
  lines.push('Team MILASTY 🌿');

  return lines.join('\n');
};

export const customerRefundCompleted = ({
  customerName = 'Valued Customer',
  orderId = '',
  orderNumber = '',
  refundAmount = 0,
}) => {
  const displayId = orderNumber || orderId;
  const orderUrl = getCustomerOrderUrl(orderId, orderNumber);

  const lines = [
    '💛 Your refund is complete!',
    '',
    `Hello ${customerName},`,
    `A refund of ${formatINR(refundAmount)} for order *#${displayId}* has been successfully processed.`,
    '',
    'Depending on your payment method or bank, it will reflect in your account within 5-7 business days.',
    '',
    'Thank you for your patience and understanding.',
  ];

  if (orderUrl) {
    lines.push('');
    lines.push(`👉 View Order: ${orderUrl}`);
  }

  lines.push('');
  lines.push('With love,');
  lines.push('Team MILASTY 🌿');

  return lines.join('\n');
};

/**
 * ─── ADMIN RETURN & REFUND NOTIFICATIONS ────────────────────────────────────
 */
export const adminReturnRequest = ({
  customerName = 'Customer',
  orderNumber = '',
  productName = '',
  returnReason = 'Not specified',
  requestTime = '',
}) => {
  const timeStr = requestTime || new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  const adminUrl = `${getFrontendBaseUrl()}/admin/cancellations`;

  return [
    '🔔 NEW RETURN REQUEST!',
    '',
    `Customer: ${customerName}`,
    `Order ID: #${orderNumber}`,
    productName ? `Product: ${productName}` : '',
    `Reason: ${returnReason}`,
    `Request Time: ${timeStr}`,
    '',
    'Please review the customer’s return request.',
    '',
    `👉 View Return Request: ${adminUrl}`,
  ].filter(Boolean).join('\n');
};

export const adminCancellationRequest = ({
  customerName = 'Customer',
  orderNumber = '',
  orderTotal = 0,
  cancellationReason = 'Customer requested cancellation',
}) => {
  const adminUrl = `${getFrontendBaseUrl()}/admin/cancellations`;

  return [
    '⚠️ ORDER CANCELLATION REQUEST',
    '',
    `Customer: ${customerName}`,
    `Order ID: #${orderNumber}`,
    `Amount: ${formatINR(orderTotal)}`,
    `Reason: ${cancellationReason}`,
    '',
    'Please review this request in the Cancellations & Refunds dashboard.',
    '',
    `👉 Review Request: ${adminUrl}`,
  ].join('\n');
};

export const adminRefundRequested = ({
  customerName = 'Customer',
  orderNumber = '',
  refundAmount = 0,
  refundReason = 'Order Cancelled',
}) => {
  const adminUrl = `${getFrontendBaseUrl()}/admin/cancellations`;

  return [
    '💸 REFUND REQUEST RECEIVED',
    '',
    `Customer: ${customerName}`,
    `Order ID: #${orderNumber}`,
    `Refund Amount: ${formatINR(refundAmount)}`,
    `Reason: ${refundReason}`,
    '',
    `👉 Review Refund: ${adminUrl}`,
  ].join('\n');
};

export const adminRefundCompleted = ({
  customerName = 'Customer',
  orderNumber = '',
  refundAmount = 0,
  refundReference = '',
}) => {
  const adminUrl = `${getFrontendBaseUrl()}/admin/cancellations`;

  return [
    '✅ REFUND COMPLETED',
    '',
    `Order ID: #${orderNumber}`,
    `Customer: ${customerName}`,
    `Refund Amount: ${formatINR(refundAmount)}`,
    refundReference ? `Reference: ${refundReference}` : '',
    '',
    `👉 View in Admin Panel: ${adminUrl}`,
  ].filter(Boolean).join('\n');
};
