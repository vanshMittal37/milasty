import { enqueueNotification } from './notificationQueue.js';
import { normalizeIndianMobile } from '../utils/phone.js';
import { supabase } from '../config/supabase.js';
import { resolveRecipient } from '../utils/orderRecipient.js';
import { triggerEvent, triggerEventAsync } from './whatsappEventService.js';
import {
  formatINR,
  formatItemsSummary,
  customerOrderConfirmed,
  customerOrderProcessing,
  customerOrderPacked,
  customerOrderShipped,
  customerOrderOutForDelivery,
  customerOrderDelivered,
  customerOrderCancelled,
  customerRefundCompleted,
  customerPaymentSuccess,
} from './whatsappTemplates/index.js';

export { formatINR, formatItemsSummary };

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
  if (typeof resolveRecipient === 'function') {
    const recipient = resolveRecipient(order);
    if (recipient?.phone) {
      normalized = normalizeIndianMobile(recipient.phone);
      if (normalized) return normalized;
    }
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
    } catch (e) {}
  }

  return null;
}

/**
 * Reusable WhatsApp Message Templates (Preserved for backward compatibility)
 */
export const ORDER_TEMPLATES = {
  order_confirmed: ({ customerName, orderNumber, orderId, itemsSummary, grandTotal, paymentMethod }) =>
    customerOrderConfirmed({ customerName, orderNumber, orderId, itemsSummary, orderTotal: grandTotal, paymentMethod }),

  payment_successful: ({ customerName, orderNumber, orderId, grandTotal }) =>
    customerPaymentSuccess({ customerName, orderNumber, orderId, amount: grandTotal }),

  order_processing: ({ customerName, orderNumber, orderId }) =>
    customerOrderProcessing({ customerName, orderNumber, orderId }),

  order_packed: ({ customerName, orderNumber, orderId }) =>
    customerOrderPacked({ customerName, orderNumber, orderId }),

  order_shipped: ({ customerName, orderNumber, orderId, courierName, awb, trackingUrl }) =>
    customerOrderShipped({ customerName, orderNumber, orderId, courierName, trackingNumber: awb, trackingUrl }),

  order_out_for_delivery: ({ customerName, orderNumber, orderId, courierName }) =>
    customerOrderOutForDelivery({ customerName, orderNumber, orderId, courierName }),

  order_delivered: ({ customerName, orderNumber, orderId }) =>
    customerOrderDelivered({ customerName, orderNumber, orderId }),

  order_cancelled: ({ customerName, orderNumber, orderId, reason, refundNote }) =>
    customerOrderCancelled({ customerName, orderNumber, orderId, cancellationReason: reason, refundNote }),

  refund_processed: ({ customerName, orderNumber, orderId, refundAmount }) =>
    customerRefundCompleted({ customerName, orderNumber, orderId, refundAmount }),
};

// Map legacy event types to uppercase Central Event Service types
const LEGACY_EVENT_MAP = {
  order_placed: 'ORDER_PLACED',
  order_confirmed: 'ORDER_CONFIRMED',
  payment_successful: 'PAYMENT_SUCCESS',
  order_processing: 'ORDER_PROCESSING',
  order_packed: 'ORDER_PACKED',
  order_shipped: 'ORDER_SHIPPED',
  order_out_for_delivery: 'ORDER_OUT_FOR_DELIVERY',
  order_delivered: 'ORDER_DELIVERED',
  order_cancelled: 'ORDER_CANCELLED',
  refund_processed: 'REFUND_COMPLETED',
};

/**
 * Unified, non-blocking order notification dispatcher
 * Routes directly through Central Two-Way WhatsApp Event Service.
 *
 * @param {object} params
 * @param {object} params.order - The order row from database
 * @param {string} params.eventType - e.g. 'order_confirmed', 'order_shipped'
 * @param {object} [params.extraData] - Optional details
 * @returns {Promise<{ enqueued: boolean, result?: object }>}
 */
export async function sendOrderNotification({ order, eventType, extraData = {} }) {
  try {
    if (!order || !order.id) {
      console.warn('[ORDER NOTIFICATION] Cannot send notification: missing order');
      return { enqueued: false, reason: 'missing_order' };
    }

    const standardEvent = LEGACY_EVENT_MAP[eventType] || eventType.toUpperCase();
    const result = await triggerEvent(standardEvent, {
      order,
      ...extraData,
    });

    return { enqueued: Boolean(result?.success), result };
  } catch (err) {
    console.error(`[ORDER NOTIFICATION] Error dispatching ${eventType}:`, err.message);
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
