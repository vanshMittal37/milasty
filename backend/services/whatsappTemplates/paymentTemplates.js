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
  const displayId = orderNumber || orderId;
  const orderUrl = getCustomerOrderUrl(orderId, orderNumber);

  const lines = [
    '💳 Payment Successful!',
    '',
    `Hello ${customerName},`,
    `Your payment of ${formatINR(amount)} for MILASTY order *#${displayId}* has been received successfully.`,
    '',
    'Our bakers are crafting your order with fresh, organic ingredients.',
  ];

  if (orderUrl) {
    lines.push('');
    lines.push(`👉 View Order: ${orderUrl}`);
  }

  lines.push('');
  lines.push('Thank you for choosing MILASTY! 🌿');

  return lines.join('\n');
};

export const customerPaymentFailed = ({
  customerName = 'Valued Customer',
  orderId = '',
  orderNumber = '',
  amount = 0,
}) => {
  const displayId = orderNumber || orderId;
  const orderUrl = getCustomerOrderUrl(orderId, orderNumber);

  const lines = [
    '⚠️ Payment Update',
    '',
    `Hello ${customerName},`,
    `We couldn't confirm your payment${amount ? ` of ${formatINR(amount)}` : ''} for order *#${displayId}*.`,
    '',
    'If your amount was deducted, please allow your bank or payment provider a few moments to update the status before trying again.',
  ];

  if (orderUrl) {
    lines.push('');
    lines.push(`👉 Retry or View Order: ${orderUrl}`);
  }

  lines.push('');
  lines.push('Need help? Reply to this message for assistance.');
  lines.push('Team MILASTY 🌿');

  return lines.join('\n');
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
