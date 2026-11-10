import { normalizeIndianMobile } from '../../utils/phone.js';

export const formatINR = (amount) => {
  const num = Number(amount || 0);
  return `₹${num.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
};

export const formatItemsSummary = (items = []) => {
  if (!Array.isArray(items) || items.length === 0) return 'Wholesome Millet Bakery Items';
  const displayItems = items.slice(0, 3).map((item) => {
    const qty = item.quantity || 1;
    const title = item.product_title || item.title || item.name || 'Bakery Item';
    const variant = item.variant_name || item.variant || '';
    return `${qty}x ${title}${variant && variant !== 'Standard Pack' ? ` (${variant})` : ''}`;
  });
  const overflow = items.length - 3;
  return displayItems.join(', ') + (overflow > 0 ? ` +${overflow} more item${overflow > 1 ? 's' : ''}` : '');
};

const getFrontendBaseUrl = () => {
  return process.env.FRONTEND_URL || process.env.APP_URL || 'https://milasty.com';
};

/**
 * Safely generate a customer order URL using the canonical /account/orders/:id route.
 * Never outputs null, undefined, or empty path segments.
 */
export const getCustomerOrderUrl = (orderId = '', orderNumber = '') => {
  const targetId = orderId || orderNumber;
  if (!targetId || targetId === 'undefined' || targetId === 'null' || !String(targetId).trim()) {
    return '';
  }
  return `${getFrontendBaseUrl()}/account/orders/${encodeURIComponent(String(targetId).trim())}`;
};

export const GOOGLE_REVIEW_URL = process.env.GOOGLE_REVIEW_URL || 'https://g.page/r/CSRCs2TeTXKyEBM/review';

/**
 * Safely generate a customer direct order review URL: /account/orders/:id/review
 */
export const getCustomerOrderReviewUrl = (orderId = '', orderNumber = '') => {
  const targetId = orderId || orderNumber;
  if (!targetId || targetId === 'undefined' || targetId === 'null' || !String(targetId).trim()) {
    return '';
  }
  return `${getFrontendBaseUrl()}/account/orders/${encodeURIComponent(String(targetId).trim())}/review`;
};

/**
 * Generate courier tracking URL. If a valid courier tracking number/AWB exists, use the
 * Shiprath tracking URL: https://shiprath.com/track/:awb. Otherwise fall back to the customer order URL.
 */
export const getCourierTrackingUrl = (trackingNumber = '', trackingUrl = '', fallbackOrderUrl = '') => {
  const cleanAwb = trackingNumber && String(trackingNumber).trim();
  const hasValidAwb = Boolean(cleanAwb && cleanAwb !== 'undefined' && cleanAwb !== 'null');

  if (hasValidAwb) {
    return `https://shiprath.com/track/${encodeURIComponent(cleanAwb)}`;
  }
  if (trackingUrl && typeof trackingUrl === 'string' && trackingUrl.trim() && !/backend\.shiprath\.com\/tracking\//i.test(trackingUrl)) {
    return trackingUrl.trim();
  }
  return fallbackOrderUrl || '';
};

/**
 * ─── CUSTOMER ORDER TEMPLATES ───────────────────────────────────────────────
 */

export const customerOrderPlaced = ({
  customerName = 'Valued Customer',
  orderId = '',
  orderNumber = '',
  orderTotal = 0,
  paymentStatus = 'Pending',
  itemsSummary = '',
  trackingUrl = '',
}) => {
  const displayId = orderNumber || orderId;
  const orderUrl = getCustomerOrderUrl(orderId, orderNumber);
  const viewOrderUrl = trackingUrl || orderUrl;

  const lines = [
    `🌿 Namaste ${customerName}!`,
    '',
    'Thank you for choosing MILASTY. ✨',
    '',
    'Your order has been successfully placed!',
    '',
    '━━━━━━━━━━━━━━━━━━',
    'YOUR ORDER DETAILS',
    '',
    `Order ID: #${displayId || 'MILASTY'}`,
    `Order Total: ${formatINR(orderTotal)}`,
    `Payment: ${paymentStatus}`,
    `Items: ${itemsSummary || 'Handcrafted Millet Bakes'}`,
    '━━━━━━━━━━━━━━━━━━',
    '',
    "We're preparing your order with care in pure Desi Ghee & Organic Jaggery.",
    '',
    "You'll receive updates as your order moves towards your doorstep.",
  ];

  if (viewOrderUrl) {
    lines.push('');
    lines.push(`👉 View Your Order: ${viewOrderUrl}`);
  }

  lines.push('');
  lines.push('With love,');
  lines.push('Team MILASTY 🌿');

  return lines.join('\n');
};

export const customerOrderConfirmed = ({
  customerName = 'Valued Customer',
  orderId = '',
  orderNumber = '',
  orderTotal = 0,
  paymentMethod = 'Prepaid',
  itemsSummary = '',
}) => {
  const displayId = orderNumber || orderId || 'MILASTY';
  const orderUrl = getCustomerOrderUrl(orderId, orderNumber);

  const lines = [
    `🌿 Namaste ${customerName},`,
    '',
    'Good news! Your MILASTY order has been confirmed 💛',
    '',
    `Order ID: #${displayId}`,
    '',
    'We are preparing your items with love and care.',
  ];

  if (orderUrl) {
    lines.push('');
    lines.push(`👉 View Your Order: ${orderUrl}`);
  }

  lines.push('');
  lines.push('With love,');
  lines.push('Team MILASTY 🌿');

  return lines.join('\n');
};

export const customerOrderProcessing = ({ customerName = 'Valued Customer', orderId = '', orderNumber = '' }) => {
  const displayId = orderNumber || orderId;
  const orderUrl = getCustomerOrderUrl(orderId, orderNumber);

  const lines = [
    `🌿 Namaste ${customerName}!`,
    '',
    `Great news! Your order *#${displayId}* is now *Processing*. 🥣`,
    '',
    'Our bakers are freshly preparing your handcrafted millet goods using natural, premium ingredients.',
    '',
    'We will notify you as soon as your package is baked and packed with love!',
  ];

  if (orderUrl) {
    lines.push('');
    lines.push(`👉 Track Order: ${orderUrl}`);
  }

  lines.push('');
  lines.push('Warm regards,');
  lines.push('Team MILASTY 🌿');

  return lines.join('\n');
};

export const customerOrderPacked = ({ customerName = 'Valued Customer', orderId = '', orderNumber = '' }) => {
  const displayId = orderNumber || orderId;
  const orderUrl = getCustomerOrderUrl(orderId, orderNumber);

  const lines = [
    `🌿 Namaste ${customerName}!`,
    '',
    `Your order *#${displayId}* is freshly *Packed* and ready! 🎁`,
    '',
    'It has been carefully inspected and sealed for maximum freshness, awaiting courier dispatch.',
    '',
    'You will receive tracking details once our delivery partner picks up the package.',
  ];

  if (orderUrl) {
    lines.push('');
    lines.push(`👉 Track Order: ${orderUrl}`);
  }

  lines.push('');
  lines.push('With love,');
  lines.push('Team MILASTY 🌿');

  return lines.join('\n');
};

export const customerOrderShipped = ({
  customerName = 'Valued Customer',
  orderId = '',
  orderNumber = '',
  estimatedDelivery = '',
  courierName = '',
  trackingNumber = '',
  trackingUrl = '',
  timelineStep = 'shipped',
}) => {
  const displayId = orderNumber || orderId || 'MILASTY';
  const orderUrl = getCustomerOrderUrl(orderId, orderNumber);

  const lines = [
    `🌿 Namaste ${customerName},`,
    '',
    `Your MILASTY order #${displayId} is on its way! 💛`,
    '',
  ];

  if (estimatedDelivery && String(estimatedDelivery).trim()) {
    lines.push(`Expected Delivery: ${String(estimatedDelivery).trim()}`);
  } else {
    lines.push('Your package is on its way. We will keep you updated.');
  }

  if (orderUrl) {
    lines.push('');
    lines.push(`👉 View Your Order: ${orderUrl}`);
  }

  lines.push('');
  lines.push('With love,');
  lines.push('Team MILASTY 🌿');

  return lines.join('\n');
};

export const customerOrderReachedCity = ({ customerName = 'Valued Customer', orderId = '', orderNumber = '', city = 'Your City' }) => {
  const displayId = orderNumber || orderId;
  const orderUrl = getCustomerOrderUrl(orderId, orderNumber);

  const timeline = [
    '✅ Order Placed / ऑर्डर किया गया',
    '|',
    '✅ Dispatch / डिस्पैच',
    '|',
    '✅ Reached Your City / आपके शहर में पहुंचा',
    '|',
    '⚪ Out for Delivery / डिलीवरी के लिए निकला',
    '|',
    '⚪ Delivered / डिलीवर हुआ',
  ].join('\n');

  const lines = [
    `🌿 Namaste ${customerName}!`,
    '',
    `Your MILASTY order *#${displayId}* has arrived in *${city}*! 🏙️`,
    '',
    'It is being sorted at the local delivery hub and will be out for delivery shortly.',
    '',
    '━━━━━━━━━━━━━━━━━━',
    '📦 YOUR ORDER JOURNEY',
    '',
    timeline,
    '━━━━━━━━━━━━━━━━━━',
  ];

  if (orderUrl) {
    lines.push('');
    lines.push(`👉 Track Order: ${orderUrl}`);
  }

  lines.push('');
  lines.push('With love,');
  lines.push('Team MILASTY 🌿');

  return lines.join('\n');
};

export const customerOrderOutForDelivery = ({ customerName = 'Valued Customer', orderId = '', orderNumber = '', courierName = '' }) => {
  const displayId = orderNumber || orderId;
  const orderUrl = getCustomerOrderUrl(orderId, orderNumber);

  const timeline = [
    '✅ Order Placed / ऑर्डर किया गया',
    '|',
    '✅ Dispatch / डिस्पैच',
    '|',
    '✅ Reached Your City / आपके शहर में पहुंचा',
    '|',
    '✅ Out for Delivery / डिलीवरी के लिए निकला',
    '|',
    '⚪ Delivered / डिलीवर हुआ',
  ].join('\n');

  const lines = [
    `🌿 Namaste ${customerName}!`,
    '',
    `Your MILASTY order *#${displayId}* is *Out for Delivery* today! 🛵`,
    '',
    courierName ? `Delivering via: ${courierName}\n` : '',
    'Please ensure someone is available at your delivery address to receive your fresh millet treats.',
    '',
    '━━━━━━━━━━━━━━━━━━',
    '📦 YOUR ORDER JOURNEY',
    '',
    timeline,
    '━━━━━━━━━━━━━━━━━━',
  ];

  if (orderUrl) {
    lines.push('');
    lines.push(`👉 Track Delivery: ${orderUrl}`);
  }

  lines.push('');
  lines.push('With love,');
  lines.push('Team MILASTY 🌿');

  return lines.join('\n');
};

export const customerOrderDelivered = ({
  customerName = 'Valued Customer',
  orderId = '',
  orderNumber = '',
  reviewUrl = '',
}) => {
  const displayId = orderNumber || orderId || 'MILASTY';
  const targetReviewUrl = reviewUrl || GOOGLE_REVIEW_URL || getCustomerOrderReviewUrl(orderId, orderNumber);
  const orderUrl = getCustomerOrderUrl(orderId, orderNumber);
  const finalReviewLink = targetReviewUrl || orderUrl;

  const lines = [
    `🌿 Namaste ${customerName}!`,
    '',
    `Your MILASTY order #${displayId} has been successfully delivered! 💛`,
    '',
    'We hope you love your purchase.',
    '',
    "Your experience means a lot to us. We'd love to hear what you think!",
    '',
    '⭐ Share your experience:',
    finalReviewLink,
    '',
    'Thank you for choosing MILASTY.',
    '',
    'With love,',
    'Team MILASTY 🌿',
  ];

  return lines.join('\n');
};

export const customerOrderCancelled = ({
  customerName = 'Valued Customer',
  orderId = '',
  orderNumber = '',
  cancellationReason = '',
  refundNote = '',
}) => {
  const displayId = orderNumber || orderId;
  const orderUrl = getCustomerOrderUrl(orderId, orderNumber);

  const lines = [
    `🌿 Namaste ${customerName},`,
    '',
    `Your cancellation request for order *#${displayId}* has been received and processed.`,
    '',
  ];

  if (cancellationReason) {
    lines.push(`📝 Reason: ${cancellationReason}`);
  }
  if (refundNote) {
    lines.push(`ℹ️ Refund: ${refundNote}`);
  }

  lines.push('');
  lines.push('If you cancelled by mistake or have any questions, our support team is always here to help.');

  if (orderUrl) {
    lines.push('');
    lines.push(`👉 View Order: ${orderUrl}`);
  }

  lines.push('');
  lines.push('Warm regards,');
  lines.push('Team MILASTY 🌿');

  return lines.join('\n');
};

/**
 * ─── ADMIN ORDER TEMPLATES ──────────────────────────────────────────────────
 */

export const adminNewOrder = ({
  orderId = '',
  orderNumber = '',
  customerName = 'Customer',
  customerPhone = 'N/A',
  customerEmail = 'N/A',
  orderTotal = 0,
  paymentMethod = 'Prepaid',
  paymentStatus = 'Pending',
  itemsSummary = '',
  orderTime = '',
}) => {
  const displayId = orderNumber || orderId;
  const timeStr = orderTime || new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  const adminUrl = `${getFrontendBaseUrl()}/admin/orders?search=${displayId}`;

  return [
    '🔔 NEW ORDER RECEIVED!',
    '',
    'Namaste Admin! 🌿',
    '',
    'A new order has just been placed on MILASTY.',
    '',
    '━━━━━━━━━━━━━━━━━━',
    '📦 ORDER DETAILS',
    '',
    `Order ID: #${displayId}`,
    `Customer: ${customerName}`,
    `Phone: +91 ${normalizeIndianMobile(customerPhone) || customerPhone}`,
    `Email: ${customerEmail || 'N/A'}`,
    `Order Amount: ${formatINR(orderTotal)}`,
    `Payment Method: ${paymentMethod}`,
    `Payment Status: ${paymentStatus}`,
    `Items: ${itemsSummary || 'Bakery Items'}`,
    `Order Time: ${timeStr}`,
    '━━━━━━━━━━━━━━━━━━',
    '',
    '🚀 A new order is waiting for your attention.',
    '',
    `👉 View Order in Admin Panel: ${adminUrl}`,
  ].join('\n');
};

export const adminOrderStatusAlert = ({
  orderNumber = '',
  customerName = '',
  status = '',
  extraInfo = '',
}) => {
  const adminUrl = `${getFrontendBaseUrl()}/admin/orders?search=${orderNumber}`;

  return [
    `📦 ORDER STATUS UPDATE: #${orderNumber}`,
    '',
    `Customer: ${customerName}`,
    `New Status: *${status.toUpperCase()}*`,
    extraInfo ? `Details: ${extraInfo}\n` : '',
    `👉 View in Admin Panel: ${adminUrl}`,
  ].filter(Boolean).join('\n');
};
