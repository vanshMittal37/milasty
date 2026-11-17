import { formatINR, getCustomerOrderUrl } from './orderTemplates.js';

const getFrontendBaseUrl = () => {
  return process.env.FRONTEND_URL || process.env.APP_URL || 'https://milasty.com';
};

/**
 * ─── CUSTOMER PAYMENT NOTIFICATIONS ─────────────────────────────────────────
 */
export const customerPaymentSuccess = ({
  customerName = 'Valued Customer',
  orderId = '',
  orderNumber = '',
  amount = 0,
}) => {
  const displayId = orderNumber || orderId || 'MILASTY';
  const orderUrl = getCustomerOrderUrl(orderId, orderNumber);

  return [
    '💳 Payment Successful!',
    '',
    `Hello ${customerName},`,
    '',
    `Your payment of ₹${amount} for MILASTY order #${displayId} has been received successfully.`,
    '',
    'Our bakers are crafting your order with fresh, organic ingredients.',
    '',
    `👉 View Order: ${orderUrl}`,
    '',
    'Thank you for choosing MILASTY! 🌿',
  ].join('\n');
};

export const customerPaymentFailed = ({
  customerName = 'Valued Customer',
  orderId = '',
  orderNumber = '',
  amount = 0,
}) => {
  const displayId = orderNumber || orderId || 'MILASTY';
  const orderUrl = getCustomerOrderUrl(orderId, orderNumber);

  return [
    '⚠️ Payment Update',
    '',
    `Hello ${customerName},`,
    '',
    `We couldn't confirm your payment of ₹${amount} for order #${displayId}.`,
    '',
    'If your amount was deducted, please allow your bank or payment provider a few moments to update the status before trying again.',
    '',
    `👉 Retry or View Order: ${orderUrl}`,
    '',
    'Need help? Reply to this message for assistance.',
    '',
    'Team MILASTY 🌿',
  ].join('\n');
};

/**
 * ─── ADMIN PAYMENT NOTIFICATIONS ────────────────────────────────────────────
 */
export const adminPaymentReceived = ({
  orderNumber = '',
  orderId = '',
  customerName = 'Customer',
  amount = 0,
  paymentMethod = 'Razorpay',
  transactionId = '',
  paymentTime = '',
}) => {
  const displayId = orderNumber || orderId;
  const timeStr = paymentTime || new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  const adminUrl = `${getFrontendBaseUrl()}/admin/orders?search=${displayId}`;

  return [
    '💰 PAYMENT RECEIVED!',
    '',
    `Order ID: #${displayId}`,
    `Customer: ${customerName}`,
    `Amount: ${formatINR(amount)}`,
    `Payment Method: ${paymentMethod}`,
    transactionId ? `Transaction ID: ${transactionId}` : '',
    `Payment Time: ${timeStr}`,
    '',
    `👉 View Order: ${adminUrl}`,
  ].filter(Boolean).join('\n');
};

export const adminPaymentFailed = ({
  orderNumber = '',
  orderId = '',
  customerName = 'Customer',
  amount = 0,
  paymentReference = '',
}) => {
  const displayId = orderNumber || orderId;
  const adminUrl = `${getFrontendBaseUrl()}/admin/orders?search=${displayId}`;

  return [
    '⚠️ PAYMENT FAILED!',
    '',
    `Order ID: #${displayId}`,
    `Customer: ${customerName}`,
    `Amount: ${formatINR(amount)}`,
    paymentReference ? `Payment Reference: ${paymentReference}` : '',
    '',
    'Please check the payment gateway logs and customer checkout status.',
    '',
    `👉 View in Admin Panel: ${adminUrl}`,
  ].filter(Boolean).join('\n');
};
