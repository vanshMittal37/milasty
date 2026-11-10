import { enqueueNotification } from './notificationQueue.js';
import { normalizeIndianMobile } from '../utils/phone.js';
import { supabase } from '../config/supabase.js';
import { resolveRecipient } from '../utils/orderRecipient.js';
import { isEventEnabled, getActiveAdminRecipientsForCategory, DEFAULT_NOTIFICATION_MATRIX } from './whatsappSettingsService.js';
import * as templates from './whatsappTemplates/index.js';

/**
 * Format items summary for order notifications
 */
function extractItemsSummary(order) {
  const items = order.items || order.order_items || [];
  return templates.formatItemsSummary(items);
}

/**
 * Resolve customer phone number safely following the 4-tier priority:
 * 1. Valid WhatsApp/contact number saved specifically for the order (order.customer_phone / order.phone)
 * 2. Valid recipient phone for gift orders, if applicable (order.recipient_phone / resolveRecipient)
 * 3. Valid customer account phone number from DB user profile
 * 4. If no valid number exists, skip WhatsApp notification and record a clear reason
 */
export async function resolveCustomerMobile(orderOrPayload) {
  if (!orderOrPayload) return null;

  const orderRef = orderOrPayload.id || orderOrPayload.order_id || orderOrPayload.order_number || orderOrPayload.orderNumber || 'N/A';

  // 1. Order-specific WhatsApp / contact number (saved specifically for this order)
  const orderPhone = orderOrPayload.customer_phone ||
    orderOrPayload.customerPhone ||
    orderOrPayload.phone;
  let normalizedOrderPhone = normalizeIndianMobile(orderPhone);
  if (normalizedOrderPhone) {
    return normalizedOrderPhone;
  }

  // 2. Valid recipient phone for gift orders, if applicable
  const recipientPhone = orderOrPayload.recipient_phone ||
    orderOrPayload.recipientPhone;
  let normalizedRecipient = normalizeIndianMobile(recipientPhone);
  if (normalizedRecipient) {
    return normalizedRecipient;
  }

  if (typeof resolveRecipient === 'function') {
    try {
      const recipient = resolveRecipient(orderOrPayload);
      if (recipient?.phone) {
        const normalized = normalizeIndianMobile(recipient.phone);
        if (normalized) return normalized;
      }
    } catch (e) {}
  }

  // 3. Customer account phone number from attached user object or Supabase user profile
  const inlineUserPhone = orderOrPayload.user?.phone || orderOrPayload.user_phone || orderOrPayload.userPhone;
  if (inlineUserPhone) {
    const normalizedInline = normalizeIndianMobile(inlineUserPhone);
    if (normalizedInline) return normalizedInline;
  }

  const userId = orderOrPayload.user_id || orderOrPayload.userId;
  if (userId) {
    try {
      const { data: user } = await supabase
        .from('users')
        .select('phone')
        .eq('id', userId)
        .maybeSingle();

      if (user?.phone) {
        const normalizedUserPhone = normalizeIndianMobile(user.phone);
        if (normalizedUserPhone) return normalizedUserPhone;
      }
    } catch (e) {}
  }

  // 4. If no valid number exists, skip WhatsApp notification and record clear reason
  console.log(`[WHATSAPP PHONE RESOLUTION] Skipped notification for order #${orderRef}: No valid mobile phone found on order, gift recipient, or customer profile.`);
  return null;
}

/**
 * Map eventName to category
 */
function getEventCategory(eventName) {
  return DEFAULT_NOTIFICATION_MATRIX[eventName]?.category || 'order';
}

export const DEFAULT_CUSTOMER_PREFERENCES = {
  whatsapp: true,
  whatsapp_promotional: false,
};

/**
 * Simplified Customer Order Notification Policy:
 * Customers receive ONLY three important order updates:
 * 1. Order Confirmed (ORDER_CONFIRMED)
 * 2. Order Shipped (ORDER_SHIPPED / ORDER_DISPATCHED)
 * 3. Order Delivered (ORDER_DELIVERED)
 * All other customer order status events (e.g. ORDER_PLACED, ORDER_PROCESSING,
 * ORDER_PACKED, ORDER_REACHED_CITY, ORDER_OUT_FOR_DELIVERY) are suppressed
 * centrally at this backend routing level.
 */
export const ALLOWED_CUSTOMER_ORDER_EVENTS = new Set([
  'ORDER_CONFIRMED',
  'ORDER_SHIPPED',
  'ORDER_DISPATCHED',
  'ORDER_DELIVERED',
]);

/**
 * Classify event into communication channel tier: 'security' | 'promotional' | 'transactional'
 * - 'security': Essential account security alerts and OTPs. NEVER suppressible.
 * - 'promotional': Campaigns, marketing, discounts, promotional offers. Requires opt-in (default false).
 * - 'transactional': Orders, fulfillment, shipping, delivery, cancellations, refunds, inquiries. Enabled by default (opt-out).
 */
export function classifyEventChannel(eventName) {
  const norm = String(eventName || '').toUpperCase();
  if (
    norm === 'PASSWORD_CHANGED' ||
    norm === 'PASSWORD_RESET_COMPLETED' ||
    norm.startsWith('OTP_') ||
    norm.startsWith('AUTH_') ||
    norm.includes('SECURITY')
  ) {
    return 'security';
  }

  if (
    norm.includes('PROMOTIONAL') ||
    norm.includes('CAMPAIGN') ||
    norm.includes('MARKETING') ||
    norm.includes('DISCOUNT') ||
    norm.includes('OFFER')
  ) {
    return 'promotional';
  }

  return 'transactional';
}

/**
 * Resolve customer notification preferences from user ID, phone, email, or order object
 */
export async function getCustomerNotificationPreferences(identifier = {}) {
  try {
    const userId = identifier.userId || identifier.user_id || identifier.user?.id || identifier.order?.user_id;
    const phone = identifier.phone || identifier.order?.customer_phone;
    const email = identifier.email || identifier.order?.customer_email;

    let userRow = null;

    if (userId) {
      const { data, error } = await supabase
        .from('users')
        .select('id, notification_preferences')
        .eq('id', userId)
        .maybeSingle();
      if (!error && data) userRow = data;
    }

    if (!userRow && phone) {
      const normalized = normalizeIndianMobile(phone);
      if (normalized) {
        const { data, error } = await supabase
          .from('users')
          .select('id, notification_preferences')
          .like('phone', `%${normalized}`)
          .limit(1);
        if (!error && data?.[0]) userRow = data[0];
      }
    }

    if (!userRow && email && !email.endsWith('@customer.milasty.com')) {
      const { data, error } = await supabase
        .from('users')
        .select('id, notification_preferences')
        .eq('email', email.toLowerCase().trim())
        .maybeSingle();
      if (!error && data) userRow = data;
    }

    const rawPrefs = userRow?.notification_preferences;
    return {
      whatsapp: typeof rawPrefs?.whatsapp === 'boolean' ? rawPrefs.whatsapp : DEFAULT_CUSTOMER_PREFERENCES.whatsapp,
      whatsapp_promotional: typeof rawPrefs?.whatsapp_promotional === 'boolean' ? rawPrefs.whatsapp_promotional : DEFAULT_CUSTOMER_PREFERENCES.whatsapp_promotional,
    };
  } catch (err) {
    console.warn('[WHATSAPP PREFERENCE LOOKUP WARNING]', err.message);
    return { ...DEFAULT_CUSTOMER_PREFERENCES };
  }
}

/**
 * Main Central Event Dispatcher
 *
 * @param {string} eventName - e.g. 'ORDER_PLACED', 'CUSTOMER_ENQUIRY_CREATED'
 * @param {object} payload - Relevant event data (order, inquiry, customer, extraData, etc.)
 * @returns {Promise<{ success: boolean, customerNotified: boolean, adminCount: number }>}
 */
export async function triggerEvent(eventName, payload = {}) {
  try {
    const { customer: customerEnabled, admin: adminEnabled } = await isEventEnabled(eventName);
    const category = getEventCategory(eventName);

    let customerNotified = false;
    let adminCount = 0;

    // ──────────────────────────────────────────────────────────────────────────
    // 1. CUSTOMER NOTIFICATION ROUTE
    // ──────────────────────────────────────────────────────────────────────────
    if (customerEnabled) {
      const channelTier = classifyEventChannel(eventName);
      const targetUser = {
        userId: payload.userId || payload.user?.id || payload.order?.user_id,
        phone: payload.phone || payload.order?.customer_phone,
        email: payload.email || payload.order?.customer_email,
        order: payload.order,
      };

      const prefs = await getCustomerNotificationPreferences(targetUser);

      let suppressed = false;
      let suppressReason = '';

      // Central Suppression for Customer Order Updates:
      // Customers ONLY receive Order Confirmed, Order Shipped, and Order Delivered.
      const isOrderEvent = category === 'order' || String(eventName).toUpperCase().startsWith('ORDER_');
      if (isOrderEvent && !ALLOWED_CUSTOMER_ORDER_EVENTS.has(String(eventName).toUpperCase())) {
        suppressed = true;
        suppressReason = `Suppressed customer event ${eventName} per simplified 3-update policy (only Confirmed, Shipped, Delivered sent to customers)`;
      } else if (channelTier === 'security') {
        // Essential security and OTP messages are NEVER suppressed
        suppressed = false;
      } else if (channelTier === 'promotional') {
        if (prefs.whatsapp_promotional !== true) {
          suppressed = true;
          suppressReason = 'customer opted out of promotional WhatsApp messages';
        }
      } else {
        // Transactional
        if (prefs.whatsapp === false) {
          suppressed = true;
          suppressReason = 'customer opted out of transactional WhatsApp messages';
        }
      }

      if (suppressed) {
        console.log(`[WHATSAPP PREFERENCE] Suppressed ${eventName} notification: ${suppressReason}`);
      } else {
        const customerJob = await buildCustomerNotification(eventName, payload);
        if (customerJob && customerJob.phone && customerJob.message) {
          const enqResult = await enqueueNotification({
            recipientPhone: customerJob.phone,
            eventType: eventName.toLowerCase(),
            recipientType: 'customer',
            referenceId: customerJob.referenceId,
            orderId: customerJob.orderId,
            enquiryId: customerJob.enquiryId,
            templateName: customerJob.templateName,
            idempotencyKey: customerJob.idempotencyKey,
            messageBody: customerJob.message,
            metadata: {
              eventName,
              category,
              channelTier,
              recipientType: 'customer',
              ...payload,
            },
          });
          if (enqResult?.queued) customerNotified = true;
        }
      }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 2. ADMIN PERSONAL WHATSAPP NOTIFICATION ROUTE
    // ──────────────────────────────────────────────────────────────────────────
    if (adminEnabled) {
      const adminRecipients = await getActiveAdminRecipientsForCategory(category);
      if (adminRecipients && adminRecipients.length > 0) {
        const adminMessage = buildAdminMessage(eventName, payload);
        if (adminMessage) {
          for (const recipient of adminRecipients) {
            const adminPhone = recipient.phone;
            const refId = getReferenceId(eventName, payload);
            const idempotencyKey = `admin:${adminPhone}:${eventName}:${refId || Date.now()}`;

            const enqResult = await enqueueNotification({
              recipientPhone: adminPhone,
              eventType: eventName.toLowerCase(),
              recipientType: 'admin',
              recipientId: recipient.id,
              referenceId: refId,
              orderId: payload.order?.id || payload.orderId || null,
              enquiryId: payload.inquiry?.id || payload.inquiry_number || payload.enquiryId || null,
              templateName: `admin_${eventName.toLowerCase()}`,
              idempotencyKey,
              messageBody: adminMessage,
              metadata: {
                eventName,
                category,
                recipientType: 'admin',
                adminName: recipient.name,
                ...payload,
              },
            });
            if (enqResult?.queued) adminCount++;
          }
        }
      }
    }

    return { success: true, customerNotified, adminCount };
  } catch (error) {
    console.error(`[WHATSAPP EVENT SERVICE] ❌ Failed to process event ${eventName}:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Non-blocking wrapper for triggerEvent (never halts API responses)
 */
export function triggerEventAsync(eventName, payload = {}) {
  setImmediate(() => {
    triggerEvent(eventName, payload).catch((err) => {
      console.error(`[WHATSAPP EVENT ASYNC] Uncaught error in ${eventName}:`, err.message);
    });
  });
}

/**
 * ─── HELPER: Reference ID ───────────────────────────────────────────────────
 */
function getReferenceId(eventName, payload) {
  if (payload.order?.order_number || payload.order?.id) {
    return payload.order.order_number || payload.order.id;
  }
  if (payload.orderNumber || payload.orderId) {
    return payload.orderNumber || payload.orderId;
  }
  if (payload.inquiry?.inquiry_number || payload.inquiry?.id) {
    return payload.inquiry.inquiry_number || payload.inquiry.id;
  }
  if (payload.enquiryId) return payload.enquiryId;
  if (payload.userId || payload.user?.id) return payload.userId || payload.user?.id;
  return null;
}

/**
 * ─── BUILD CUSTOMER NOTIFICATION ────────────────────────────────────────────
 */
async function buildCustomerNotification(eventName, payload) {
  const order = payload.order || (payload.orderId ? payload : null);

  switch (eventName) {
    case 'ORDER_PLACED': {
      if (!order) return null;
      const phone = await resolveCustomerMobile(order);
      if (!phone) return null;
      const displayId = order.order_number || order.orderNumber || order.id?.slice(0, 8);
      const message = templates.customerOrderPlaced({
        customerName: order.customer_name || order.customerName || 'Valued Customer',
        orderId: order.id,
        orderNumber: displayId,
        orderTotal: order.grand_total || order.grandTotal || 0,
        paymentStatus: order.payment_status || (order.payment_method === 'cod' ? 'Cash on Delivery' : 'Pending'),
        itemsSummary: extractItemsSummary(order),
        trackingUrl: payload.trackingUrl,
      });
      return {
        phone,
        message,
        orderId: order.id,
        referenceId: displayId,
        templateName: 'customerOrderPlaced',
        idempotencyKey: `order:${order.id}:customer:ORDER_PLACED`,
      };
    }

    case 'ORDER_CONFIRMED': {
      if (!order) return null;
      const phone = await resolveCustomerMobile(order);
      if (!phone) return null;
      const displayId = order.order_number || order.orderNumber || order.id?.slice(0, 8);
      const message = templates.customerOrderConfirmed({
        customerName: order.customer_name || order.customerName || 'Valued Customer',
        orderId: order.id,
        orderNumber: displayId,
        orderTotal: order.grand_total || order.grandTotal || 0,
        paymentMethod: order.payment_method || order.paymentMethod || 'Prepaid',
        itemsSummary: extractItemsSummary(order),
      });
      return {
        phone,
        message,
        orderId: order.id,
        referenceId: displayId,
        templateName: 'customerOrderConfirmed',
        idempotencyKey: `order:${order.id}:customer:ORDER_CONFIRMED`,
      };
    }

    case 'ORDER_PROCESSING': {
      if (!order) return null;
      const phone = await resolveCustomerMobile(order);
      if (!phone) return null;
      const displayId = order.order_number || order.orderNumber || order.id?.slice(0, 8);
      const message = templates.customerOrderProcessing({
        customerName: order.customer_name || order.customerName || 'Valued Customer',
        orderId: order.id,
        orderNumber: displayId,
      });
      return {
        phone,
        message,
        orderId: order.id,
        referenceId: displayId,
        templateName: 'customerOrderProcessing',
        idempotencyKey: `order:${order.id}:customer:ORDER_PROCESSING`,
      };
    }

    case 'ORDER_PACKED': {
      if (!order) return null;
      const phone = await resolveCustomerMobile(order);
      if (!phone) return null;
      const displayId = order.order_number || order.orderNumber || order.id?.slice(0, 8);
      const message = templates.customerOrderPacked({
        customerName: order.customer_name || order.customerName || 'Valued Customer',
        orderId: order.id,
        orderNumber: displayId,
      });
      return {
        phone,
        message,
        orderId: order.id,
        referenceId: displayId,
        templateName: 'customerOrderPacked',
        idempotencyKey: `order:${order.id}:customer:ORDER_PACKED`,
      };
    }

    case 'ORDER_DISPATCHED':
    case 'ORDER_SHIPPED': {
      if (!order) return null;
      const phone = await resolveCustomerMobile(order);
      if (!phone) return null;
      const displayId = order.order_number || order.orderNumber || order.id?.slice(0, 8);
      const awb = payload.awb || payload.trackingNumber || order.awb_number || order.awb;
      const courier = payload.courierName || order.booked_service_name || order.selected_service_name;
      const message = templates.customerOrderShipped({
        customerName: order.customer_name || order.customerName || 'Valued Customer',
        orderId: order.id,
        orderNumber: displayId,
        courierName: courier,
        trackingNumber: awb,
        trackingUrl: payload.trackingUrl || order.tracking_url,
      });
      return {
        phone,
        message,
        orderId: order.id,
        referenceId: displayId,
        templateName: 'customerOrderShipped',
        idempotencyKey: `order:${order.id}:customer:ORDER_SHIPPED`,
      };
    }

    case 'ORDER_REACHED_CITY': {
      if (!order) return null;
      const phone = await resolveCustomerMobile(order);
      if (!phone) return null;
      const displayId = order.order_number || order.orderNumber || order.id?.slice(0, 8);
      const message = templates.customerOrderReachedCity({
        customerName: order.customer_name || order.customerName || 'Valued Customer',
        orderId: order.id,
        orderNumber: displayId,
        city: payload.city || order.shipping_city || 'your city',
      });
      return {
        phone,
        message,
        orderId: order.id,
        referenceId: displayId,
        templateName: 'customerOrderReachedCity',
        idempotencyKey: `order:${order.id}:customer:ORDER_REACHED_CITY`,
      };
    }

    case 'ORDER_OUT_FOR_DELIVERY': {
      if (!order) return null;
      const phone = await resolveCustomerMobile(order);
      if (!phone) return null;
      const displayId = order.order_number || order.orderNumber || order.id?.slice(0, 8);
      const message = templates.customerOrderOutForDelivery({
        customerName: order.customer_name || order.customerName || 'Valued Customer',
        orderId: order.id,
        orderNumber: displayId,
        courierName: payload.courierName || order.booked_service_name,
      });
      return {
        phone,
        message,
        orderId: order.id,
        referenceId: displayId,
        templateName: 'customerOrderOutForDelivery',
        idempotencyKey: `order:${order.id}:customer:ORDER_OUT_FOR_DELIVERY`,
      };
    }

    case 'ORDER_DELIVERED': {
      if (!order) return null;
      const phone = await resolveCustomerMobile(order);
      if (!phone) return null;
      const displayId = order.order_number || order.orderNumber || order.id?.slice(0, 8);
      const reviewUrl = payload.reviewUrl || templates.GOOGLE_REVIEW_URL || templates.getCustomerOrderReviewUrl(order.id, displayId);
      const message = templates.customerOrderDelivered({
        customerName: order.customer_name || order.customerName || 'Valued Customer',
        orderId: order.id,
        orderNumber: displayId,
        reviewUrl,
      });
      return {
        phone,
        message,
        orderId: order.id,
        referenceId: displayId,
        templateName: 'customerOrderDelivered',
        idempotencyKey: `order:${order.id}:customer:ORDER_DELIVERED`,
      };
    }

    case 'ORDER_CANCELLED': {
      if (!order) return null;
      const phone = await resolveCustomerMobile(order);
      if (!phone) return null;
      const displayId = order.order_number || order.orderNumber || order.id?.slice(0, 8);
      const message = templates.customerOrderCancelled({
        customerName: order.customer_name || order.customerName || 'Valued Customer',
        orderId: order.id,
        orderNumber: displayId,
        cancellationReason: payload.cancellationReason || payload.reason || order.cancellation_reason,
        refundNote: payload.refundNote,
      });
      return {
        phone,
        message,
        orderId: order.id,
        referenceId: displayId,
        templateName: 'customerOrderCancelled',
        idempotencyKey: `order:${order.id}:customer:ORDER_CANCELLED`,
      };
    }

    case 'CANCELLATION_REQUESTED': {
      if (!order) return null;
      const phone = await resolveCustomerMobile(order);
      if (!phone) return null;
      const displayId = order.order_number || order.orderNumber || order.id?.slice(0, 8);
      const message = templates.customerCancellationRequested({
        customerName: order.customer_name || order.customerName || 'Valued Customer',
        orderId: order.id,
        orderNumber: displayId,
      });
      return {
        phone,
        message,
        orderId: order.id,
        referenceId: displayId,
        templateName: 'customerCancellationRequested',
        idempotencyKey: `order:${order.id}:customer:CANCELLATION_REQUESTED`,
      };
    }

    case 'RETURN_REQUESTED': {
      if (!order) return null;
      const phone = await resolveCustomerMobile(order);
      if (!phone) return null;
      const displayId = order.order_number || order.orderNumber || order.id?.slice(0, 8);
      const message = templates.customerReturnRequested({
        customerName: order.customer_name || order.customerName || 'Valued Customer',
        orderId: order.id,
        orderNumber: displayId,
      });
      return {
        phone,
        message,
        orderId: order.id,
        referenceId: displayId,
        templateName: 'customerReturnRequested',
        idempotencyKey: `order:${order.id}:customer:RETURN_REQUESTED`,
      };
    }

    case 'REFUND_COMPLETED': {
      if (!order) return null;
      const phone = await resolveCustomerMobile(order);
      if (!phone) return null;
      const displayId = order.order_number || order.orderNumber || order.id?.slice(0, 8);
      const message = templates.customerRefundCompleted({
        customerName: order.customer_name || order.customerName || 'Valued Customer',
        orderId: order.id,
        orderNumber: displayId,
        refundAmount: payload.refundAmount || order.refund_amount || 0,
      });
      return {
        phone,
        message,
        orderId: order.id,
        referenceId: displayId,
        templateName: 'customerRefundCompleted',
        idempotencyKey: `order:${order.id}:customer:REFUND_COMPLETED:${payload.refundReference || 'ref'}`,
      };
    }

    case 'PAYMENT_SUCCESS': {
      if (!order) return null;
      const phone = await resolveCustomerMobile(order);
      if (!phone) return null;
      const displayId = order.order_number || order.orderNumber || order.id?.slice(0, 8);
      const message = templates.customerPaymentSuccess({
        customerName: order.customer_name || order.customerName || 'Valued Customer',
        orderId: order.id,
        orderNumber: displayId,
        amount: payload.amount || order.grand_total || order.grandTotal || 0,
      });
      return {
        phone,
        message,
        orderId: order.id,
        referenceId: displayId,
        templateName: 'customerPaymentSuccess',
        idempotencyKey: `order:${order.id}:customer:PAYMENT_SUCCESS:${payload.paymentId || 'paid'}`,
      };
    }

    case 'PAYMENT_FAILED': {
      if (!order) return null;
      const phone = await resolveCustomerMobile(order);
      if (!phone) return null;
      const displayId = order.order_number || order.orderNumber || order.id?.slice(0, 8);
      const message = templates.customerPaymentFailed({
        customerName: order.customer_name || order.customerName || 'Valued Customer',
        orderId: order.id,
        orderNumber: displayId,
        amount: payload.amount || order.grand_total || 0,
      });
      return {
        phone,
        message,
        orderId: order.id,
        referenceId: displayId,
        templateName: 'customerPaymentFailed',
        idempotencyKey: `order:${order.id}:customer:PAYMENT_FAILED:${Date.now()}`,
      };
    }

    case 'CUSTOMER_REGISTERED': {
      const phone = normalizeIndianMobile(payload.phone || payload.user?.phone);
      if (!phone) return null;
      const message = templates.customerWelcome({
        customerName: payload.name || payload.user?.name || 'Friend',
      });
      return {
        phone,
        message,
        referenceId: payload.user?.id || phone,
        templateName: 'customerWelcome',
        idempotencyKey: `user:${payload.user?.id || phone}:customer:CUSTOMER_REGISTERED`,
      };
    }

    case 'PASSWORD_CHANGED': {
      const phone = normalizeIndianMobile(payload.phone || payload.user?.phone);
      if (!phone) return null;
      const message = templates.customerPasswordChanged({
        customerName: payload.name || payload.user?.name || 'Valued Customer',
      });
      return {
        phone,
        message,
        referenceId: payload.userId || phone,
        templateName: 'customerPasswordChanged',
        idempotencyKey: `user:${payload.userId || phone}:customer:PASSWORD_CHANGED:${Date.now()}`,
      };
    }

    case 'PASSWORD_RESET_COMPLETED': {
      const phone = normalizeIndianMobile(payload.phone || payload.user?.phone);
      if (!phone) return null;
      const message = templates.customerPasswordResetCompleted({
        customerName: payload.name || payload.user?.name || 'Valued Customer',
      });
      return {
        phone,
        message,
        referenceId: payload.userId || phone,
        templateName: 'customerPasswordResetCompleted',
        idempotencyKey: `user:${payload.userId || phone}:customer:PASSWORD_RESET_COMPLETED:${Date.now()}`,
      };
    }

    case 'CUSTOMER_ENQUIRY_CREATED': {
      const inquiry = payload.inquiry || payload;
      const phone = normalizeIndianMobile(inquiry.phone);
      if (!phone) return null;
      const message = templates.customerEnquiryAck({
        customerName: inquiry.name || 'Valued Customer',
        enquiryId: inquiry.inquiry_number || inquiry.id,
        enquirySubject: inquiry.subject || 'Customer Enquiry',
      });
      return {
        phone,
        message,
        enquiryId: inquiry.id,
        referenceId: inquiry.inquiry_number || inquiry.id,
        templateName: 'customerEnquiryAck',
        idempotencyKey: `enquiry:${inquiry.id || inquiry.inquiry_number}:customer:ACKNOWLEDGEMENT`,
      };
    }

    default:
      return null;
  }
}

/**
 * ─── BUILD ADMIN MESSAGE ────────────────────────────────────────────────────
 */
function buildAdminMessage(eventName, payload) {
  const order = payload.order || (payload.orderId ? payload : null);

  switch (eventName) {
    case 'ORDER_PLACED': {
      if (!order) return null;
      const displayId = order.order_number || order.orderNumber || order.id?.slice(0, 8);
      return templates.adminNewOrder({
        orderId: order.id,
        orderNumber: displayId,
        customerName: order.customer_name || order.customerName || 'Customer',
        customerPhone: order.customer_phone || order.phone || 'N/A',
        customerEmail: order.customer_email || order.email || 'N/A',
        orderTotal: order.grand_total || order.grandTotal || 0,
        paymentMethod: order.payment_method || order.paymentMethod || 'Prepaid',
        paymentStatus: order.payment_status || 'Pending',
        itemsSummary: extractItemsSummary(order),
        orderTime: order.created_at ? new Date(order.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : '',
      });
    }

    case 'PAYMENT_SUCCESS': {
      if (!order) return null;
      const displayId = order.order_number || order.orderNumber || order.id?.slice(0, 8);
      return templates.adminPaymentReceived({
        orderNumber: displayId,
        orderId: order.id,
        customerName: order.customer_name || order.customerName || 'Customer',
        amount: payload.amount || order.grand_total || 0,
        paymentMethod: order.payment_method || 'Razorpay',
        transactionId: payload.paymentId || order.payment_id,
        paymentTime: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      });
    }

    case 'PAYMENT_FAILED': {
      if (!order) return null;
      const displayId = order.order_number || order.orderNumber || order.id?.slice(0, 8);
      return templates.adminPaymentFailed({
        orderNumber: displayId,
        orderId: order.id,
        customerName: order.customer_name || order.customerName || 'Customer',
        amount: payload.amount || order.grand_total || 0,
        paymentReference: payload.paymentReference || payload.error,
      });
    }

    case 'CUSTOMER_ENQUIRY_CREATED': {
      const inquiry = payload.inquiry || payload;
      return templates.adminNewEnquiry({
        customerName: inquiry.name || 'Customer',
        customerPhone: inquiry.phone || 'N/A',
        customerEmail: inquiry.email || 'N/A',
        enquiryId: inquiry.inquiry_number || inquiry.id || 'N/A',
        enquirySubject: inquiry.subject || 'General Inquiry',
        productName: inquiry.product_name || '',
        enquiryMessage: inquiry.message || '',
        enquiryTime: inquiry.created_at ? new Date(inquiry.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : '',
      });
    }

    case 'CUSTOMER_REGISTERED': {
      return templates.adminNewCustomer({
        customerName: payload.name || payload.user?.name || 'New Customer',
        customerPhone: payload.phone || payload.user?.phone || 'N/A',
        customerEmail: payload.email || payload.user?.email || 'N/A',
        registrationTime: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      });
    }

    case 'CANCELLATION_REQUESTED': {
      if (!order) return null;
      const displayId = order.order_number || order.orderNumber || order.id?.slice(0, 8);
      return templates.adminCancellationRequest({
        customerName: order.customer_name || order.customerName || 'Customer',
        orderNumber: displayId,
        orderTotal: order.grand_total || 0,
        cancellationReason: payload.cancellationReason || payload.reason,
      });
    }

    case 'RETURN_REQUESTED': {
      if (!order) return null;
      const displayId = order.order_number || order.orderNumber || order.id?.slice(0, 8);
      return templates.adminReturnRequest({
        customerName: order.customer_name || order.customerName || 'Customer',
        orderNumber: displayId,
        productName: payload.productName || '',
        returnReason: payload.returnReason || payload.reason,
        requestTime: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      });
    }

    case 'REFUND_REQUESTED': {
      if (!order) return null;
      const displayId = order.order_number || order.orderNumber || order.id?.slice(0, 8);
      return templates.adminRefundRequested({
        customerName: order.customer_name || order.customerName || 'Customer',
        orderNumber: displayId,
        refundAmount: payload.refundAmount || 0,
        refundReason: payload.refundReason || payload.reason,
      });
    }

    case 'REFUND_COMPLETED': {
      if (!order) return null;
      const displayId = order.order_number || order.orderNumber || order.id?.slice(0, 8);
      return templates.adminRefundCompleted({
        customerName: order.customer_name || order.customerName || 'Customer',
        orderNumber: displayId,
        refundAmount: payload.refundAmount || 0,
        refundReference: payload.refundReference,
      });
    }

    case 'WHATSAPP_DISCONNECTED': {
      return templates.adminWhatsAppDisconnected({
        reason: payload.reason || 'Session closed',
      });
    }

    case 'WHATSAPP_NOTIFICATION_FAILED': {
      return templates.adminNotificationFailed({
        eventType: payload.failedEvent || 'Unknown',
        recipientPhone: payload.failedPhone || 'N/A',
        recipientType: payload.failedRecipientType || 'customer',
        error: payload.error || 'Max retries reached',
      });
    }

    // Optional admin status updates (e.g. dispatched, delivered)
    case 'ORDER_CONFIRMED':
    case 'ORDER_SHIPPED':
    case 'ORDER_DELIVERED':
    case 'ORDER_CANCELLED': {
      if (!order) return null;
      const displayId = order.order_number || order.orderNumber || order.id?.slice(0, 8);
      return templates.adminOrderStatusAlert({
        orderNumber: displayId,
        customerName: order.customer_name || order.customerName || 'Customer',
        status: eventName.replace('ORDER_', '').toLowerCase(),
        extraInfo: payload.extraInfo || '',
      });
    }

    default:
      return null;
  }
}
