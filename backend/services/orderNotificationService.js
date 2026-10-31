import { enqueueNotification } from './notificationQueue.js';
import { normalizeIndianMobile } from '../utils/phone.js';
import { supabase } from '../config/supabase.js';
import { resolveRecipient } from '../utils/orderRecipient.js';

/**
 * Format amounts into INR currency (e.g. ₹1,299)
 */
export const formatINR = (amount) => {
  const num = Number(amount || 0);
  return `₹${num.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
};

/**
 * Formats a concise items summary for WhatsApp notifications (max 3 items + overflow count)
 */
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

/**
 * Resolve customer phone number from order object or database
 */
export async function resolveCustomerPhone(order) {
  if (!order) return null;

  // 1. Direct order phone fields
  let rawPhone = order.customer_phone || order.customerPhone || order.phone;
  let normalized = normalizeIndianMobile(rawPhone);
  if (normalized) return normalized;

  // 2. Check recipient phone if ordered for someone else
  const recipient = resolveRecipient(order);
  if (recipient?.phone) {
    normalized = normalizeIndianMobile(recipient.phone);
    if (normalized) return normalized;
  }

  // 3. Fallback to user profile in Supabase
  const userId = order.user_id || order.userId;
  if (userId) {
    try {
      const { data: user } = await supabase
        .from('users')
        .select('phone')
        .eq('id', userId)
        .maybeSingle();
      if (user?.phone) {
        normalized = normalizeIndianMobile(user.phone);
        if (normalized) return normalized;
      }
    } catch (e) {
      // ignore
    }
  }

  return null;
}

/**
 * Reusable WhatsApp Message Templates
 */
export const ORDER_TEMPLATES = {
  /**
   * 1. Order Confirmation (Prepaid & COD)
   */
  order_confirmed: ({ customerName, orderNumber, itemsSummary, grandTotal, paymentMethod }) => {
    const isCod = String(paymentMethod || '').toLowerCase() === 'cod';
    const paymentLabel = isCod ? 'Cash on Delivery (COD)' : 'Prepaid (Verified)';

    return [
      '*MILASTY* 🌾',
      '',
      `Hello *${customerName}*,`,
      `Thank you for ordering with us! Your order *#${orderNumber}* has been confirmed.`,
      '',
      `📦 *Items:* ${itemsSummary}`,
      `💰 *Total Amount:* ${formatINR(grandTotal)}`,
      `💳 *Payment Mode:* ${paymentLabel}`,
      '',
      'Our team is now getting your wholesome, preservative-free millet treats ready.',
      '',
      'You can track your order anytime on our website.',
      '',
      'Warm regards,',
      '*Team MILASTY*',
    ].join('\n');
  },

  /**
   * 2. Payment Successful (Razorpay verified payments)
   */
  payment_successful: ({ customerName, orderNumber, grandTotal, paymentId }) => {
    return [
      '*MILASTY* 🌾',
      '',
      `Hello *${customerName}*,`,
      `Payment received successfully for your order *#${orderNumber}*!`,
      '',
      `💰 *Amount Paid:* ${formatINR(grandTotal)}`,
      paymentId ? `🔖 *Transaction Ref:* ${paymentId}` : '',
      '',
      'Your order has moved into production and our bakers are crafting your items with care.',
      '',
      'Thank you for choosing health and purity with MILASTY!',
    ].filter(Boolean).join('\n');
  },

  /**
   * 3. Order Processing
   */
  order_processing: ({ customerName, orderNumber }) => {
    return [
      '*MILASTY* 🌾',
      '',
      `Hello *${customerName}*,`,
      `Great news! Your order *#${orderNumber}* is now *Processing*.`,
      '',
      'Our bakers are freshly preparing your handcrafted millet goods using natural, premium ingredients.',
      '',
      'We will notify you as soon as your package is baked and packed!',
    ].join('\n');
  },

  /**
   * 4. Order Packed
   */
  order_packed: ({ customerName, orderNumber }) => {
    return [
      '*MILASTY* 🌾',
      '',
      `Hello *${customerName}*,`,
      `Your order *#${orderNumber}* is freshly *Packed* and ready!`,
      '',
      'It has been carefully inspected and sealed for maximum freshness, awaiting courier pickup.',
      '',
      'You will receive tracking details once the courier partner receives the package.',
    ].join('\n');
  },

  /**
   * 5. Order Shipped (Courier & Tracking details)
   */
  order_shipped: ({ customerName, orderNumber, courierName, awb, trackingUrl }) => {
    return [
      '*MILASTY* 🌾',
      '',
      `Hello *${customerName}*,`,
      `Your order *#${orderNumber}* has been *Shipped*! 🚚`,
      '',
      courierName ? `📦 *Courier:* ${courierName}` : '📦 *Courier:* Express Delivery Partner',
      awb ? `🔢 *Tracking/AWB:* ${awb}` : '',
      trackingUrl ? `🔗 *Track Shipment:* ${trackingUrl}` : '',
      '',
      'Your fresh millet treats are on their way to you.',
      'Thank you for your patience!',
    ].filter(Boolean).join('\n');
  },

  /**
   * 6. Out for Delivery
   */
  order_out_for_delivery: ({ customerName, orderNumber, courierName, awb }) => {
    return [
      '*MILASTY* 🌾',
      '',
      `Hello *${customerName}*,`,
      `Your MILASTY package for order *#${orderNumber}* is *Out for Delivery* today! 🛵`,
      '',
      courierName ? `📦 *Delivering via:* ${courierName}` : '',
      awb ? `🔢 *AWB Number:* ${awb}` : '',
      '',
      'Please ensure someone is available at your delivery address to receive the parcel.',
      'Enjoy your nutritious millet treats!',
    ].filter(Boolean).join('\n');
  },

  /**
   * 7. Order Delivered
   */
  order_delivered: ({ customerName, orderNumber }) => {
    return [
      '*MILASTY* 🌾',
      '',
      `Hello *${customerName}*,`,
      `Your order *#${orderNumber}* has been *Delivered*! 🎉`,
      '',
      'We hope you enjoy the wholesome goodness and authentic taste of our millet bakery creations.',
      '',
      'Have feedback or need assistance? Reply directly to this WhatsApp number or visit us at milasty.com.',
      '',
      'Have a wonderful day!',
      '*Team MILASTY*',
    ].join('\n');
  },

  /**
   * 8. Order Cancelled
   */
  order_cancelled: ({ customerName, orderNumber, reason, refundNote }) => {
    return [
      '*MILASTY* 🌾',
      '',
      `Hello *${customerName}*,`,
      `Your order *#${orderNumber}* has been *Cancelled*.`,
      '',
      reason ? `📝 *Reason:* ${reason}` : '',
      refundNote ? `ℹ️ *Refund Details:* ${refundNote}` : '',
      '',
      'If you have any questions or cancelled by mistake, please contact our support team.',
      '',
      'Thank you,',
      '*Team MILASTY*',
    ].filter(Boolean).join('\n');
  },

  /**
   * 9. Refund Processed
   */
  refund_processed: ({ customerName, orderNumber, refundAmount, refundReference }) => {
    return [
      '*MILASTY* 🌾',
      '',
      `Hello *${customerName}*,`,
      `Your refund for order *#${orderNumber}* has been *Processed Successfully*! 💳`,
      '',
      `💰 *Refund Amount:* ${formatINR(refundAmount)}`,
      refundReference ? `🔖 *Refund Reference:* ${refundReference}` : '',
      '',
      'The amount will reflect in your original payment method within 5-7 business days per banking timelines.',
      '',
      'Thank you for your patience and understanding.',
      '*Team MILASTY*',
    ].filter(Boolean).join('\n');
  },
};

/**
 * Unified, non-blocking order notification dispatcher
 *
 * @param {object} params
 * @param {object} params.order - The order row from database
 * @param {'order_confirmed' | 'payment_successful' | 'order_processing' | 'order_packed' | 'order_shipped' | 'order_out_for_delivery' | 'order_delivered' | 'order_cancelled' | 'refund_processed'} params.eventType
 * @param {object} [params.extraData] - Optional details (courierName, awb, trackingUrl, refundAmount, refundReference, etc.)
 * @returns {Promise<{ enqueued: boolean, reason?: string, jobId?: string }>}
 */
export async function sendOrderNotification({ order, eventType, extraData = {} }) {
  // Run asynchronously without blocking caller
  try {
    if (!order || !order.id) {
      console.warn('[ORDER NOTIFICATION] Cannot send notification: missing order');
      return { enqueued: false, reason: 'missing_order' };
    }

    const templateFn = ORDER_TEMPLATES[eventType];
    if (!templateFn) {
      console.warn(`[ORDER NOTIFICATION] Unknown event type: ${eventType}`);
      return { enqueued: false, reason: 'unknown_event_type' };
    }

    const customerPhone = await resolveCustomerPhone(order);
    if (!customerPhone) {
      console.log(`[ORDER NOTIFICATION] No valid mobile number for order ${order.order_number || order.id}. Skipping WhatsApp.`);
      return { enqueued: false, reason: 'no_valid_phone' };
    }

    const customerName = order.customer_name || order.customerName || 'Valued Customer';
    const orderNumber = order.order_number || order.orderNumber || order.id.slice(0, 8);
    const grandTotal = Number(order.grand_total || order.grandTotal || 0);
    const paymentMethod = order.payment_method || order.paymentMethod || 'prepaid';
    const items = order.items || order.order_items || [];
    const itemsSummary = formatItemsSummary(items);

    // Build message
    const messageBody = templateFn({
      customerName,
      orderNumber,
      itemsSummary,
      grandTotal,
      paymentMethod,
      ...extraData,
    });

    // Idempotency key construction: strictly prevents duplicate deliveries for the same event
    let subKey = 'default';
    if (eventType === 'order_shipped') {
      subKey = extraData.awb || 'booked';
    } else if (eventType === 'refund_processed') {
      subKey = extraData.refundReference || extraData.refundId || 'processed';
    } else if (eventType === 'payment_successful') {
      subKey = extraData.paymentId || 'paid';
    } else if (eventType === 'order_cancelled') {
      subKey = 'cancelled';
    } else if (eventType.startsWith('order_')) {
      subKey = eventType.replace('order_', '');
    }

    const idempotencyKey = `notif:${order.id}:${eventType}:${subKey}`;

    // Dispatch into resilient notification queue (non-blocking)
    const result = await enqueueNotification({
      recipientPhone: customerPhone,
      eventType,
      referenceId: order.id,
      idempotencyKey,
      messageBody,
      metadata: {
        orderId: order.id,
        orderNumber,
        customerName,
        eventType,
        ...extraData,
      },
    });

    const jobId = result.id || result.jobId;
    console.log(`[ORDER NOTIFICATION] 📬 Enqueued ${eventType} for order #${orderNumber} to ${customerPhone} (Job ID: ${jobId})`);
    return { enqueued: true, jobId };
  } catch (err) {
    console.error(`[ORDER NOTIFICATION] Error dispatching ${eventType} for order ${order?.id}:`, err.message);
    return { enqueued: false, reason: err.message };
  }
}

/**
 * Asynchronously trigger notification without awaiting (completely non-blocking for checkout/webhooks)
 */
export function triggerOrderNotificationAsync(params) {
  setImmediate(() => {
    sendOrderNotification(params).catch((err) => {
      console.error('[ORDER NOTIFICATION ASYNC] Uncaught error:', err.message);
    });
  });
}
