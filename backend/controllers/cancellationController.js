import Razorpay from 'razorpay';
import { supabase } from '../config/supabase.js';
import { canAccessOrder } from './shipratController.js';
import { safeUpdateOrder } from '../utils/safeOrderUpdate.js';
import { withRecipient } from '../utils/orderRecipient.js';

/**
 * Order cancellations, refund tracking and Shiprath shipment cancellation.
 * Schema + atomic cancel function: scripts/19, 23 and 26 (26 is the current request_order_cancellation).
 *
 * Policy (the SQL function request_order_cancellation is authoritative; quoteCancellation mirrors it
 * for the customer preview):
 *   elapsed <= 3h → cancellable; > 3h → blocked
 *   paid Razorpay orders: 10% charge on the product amount (grand total − delivery fee), the rest is
 *   refunded; COD / unpaid orders: nothing charged, nothing refunded. Amounts are in paise.
 *
 * Refunds go out only when an admin starts one (Razorpay Refund API) or records one made in the
 * Razorpay Dashboard. A refund is "successful" only once Razorpay reports it processed.
 */

const SHIPRATH_BASE_URL = 'https://backend.shiprath.com/vendor/v1';
const HOUR = 3600;
export const CANCELLATION_WINDOW_S = 3 * HOUR;
export const CANCELLATION_CHARGE_PERCENTAGE = 10;
export const REFUND_PERCENTAGE = 90;

const REFUND_TRANSITIONS = {
  pending: ['processing', 'failed'],
  processing: ['pending', 'failed'],
  failed: ['pending', 'processing'],
  needs_review: ['processing', 'failed'],
};
const OPEN_REFUND_STATUSES = ['pending', 'processing', 'failed', 'needs_review'];
const OPEN_SHIPMENT_STATUSES = ['pending', 'failed', 'manual_required'];

const isUuid = (v) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(v || ''));
const paiseToRupees = (p) => Math.round(Number(p || 0)) / 100;

// ─── Pure policy helpers (unit-tested; keep in sync with the SQL function) ──────────────────────

/** Refund percentage for an elapsed time in whole seconds, or null when cancellation is closed. */
export function refundPercentageFor(elapsedSeconds) {
  if (elapsedSeconds <= CANCELLATION_WINDOW_S) return REFUND_PERCENTAGE;
  return null;
}

/** Customer-facing preview. `nowMs` comes from the server, never the browser. */
export function quoteCancellation(order, nowMs = Date.now()) {
  const status = String(order.order_status || '').toLowerCase();
  const shipStatus = String(order.shipment_status || '').toLowerCase();
  const orderCreatedMs = new Date(order.created_at).getTime();
  const elapsedSeconds = Math.max(0, Math.floor((nowMs - orderCreatedMs) / 1000));
  const base = { elapsedSeconds, orderCreatedAt: order.created_at };

  if (status === 'cancelled') return { ...base, eligible: false, code: 'ALREADY_CANCELLED', message: 'This order is already cancelled.' };
  if (status === 'delivered' || shipStatus === 'delivered') {
    return { ...base, eligible: false, code: 'ALREADY_DELIVERED', message: 'Delivered orders cannot be cancelled.' };
  }
  const pct = refundPercentageFor(elapsedSeconds);
  if (pct === null) {
    return {
      ...base,
      eligible: false,
      code: 'WINDOW_CLOSED',
      message: 'You can no longer cancel this order because the 3-hour cancellation window has expired. Please contact customer support if you need assistance.',
    };
  }

  const prepaid = String(order.payment_method || '').toLowerCase() === 'razorpay' && String(order.payment_status || '').toLowerCase() === 'paid';
  const deliveryCharge = Number(order.delivery_fee || order.delivery_charge || order.shipping_fee || 0);
  const totalPaid = Number(order.grand_total || 0);
  const productAmount = Math.max(0, totalPaid - deliveryCharge);

  const productAmountPaise = prepaid ? Math.round(productAmount * 100) : 0;
  const amountPaidPaise = prepaid ? Math.round(totalPaid * 100) : 0;
  // 10% cancellation charge applies to product amount only:
  const cancellationChargePaise = prepaid ? Math.round((productAmountPaise * CANCELLATION_CHARGE_PERCENTAGE) / 100) : 0;
  // Delivery charges are excluded from cancellation charge and refunded where applicable:
  const refundAmountPaise = prepaid ? (amountPaidPaise - cancellationChargePaise) : 0;
  const windowEnd = new Date(orderCreatedMs + CANCELLATION_WINDOW_S * 1000);

  return {
    ...base,
    eligible: true,
    prepaid,
    refundPercentage: prepaid ? REFUND_PERCENTAGE : 0,
    cancellationChargePercentage: prepaid ? CANCELLATION_CHARGE_PERCENTAGE : 0,
    amountPaid: paiseToRupees(amountPaidPaise),
    cancellationCharge: paiseToRupees(cancellationChargePaise),
    refundAmount: paiseToRupees(refundAmountPaise),
    nonRefundable: paiseToRupees(cancellationChargePaise),
    windowEndsAt: windowEnd.toISOString(),
    currentTierEndsAt: windowEnd.toISOString(),
    shipmentInTransit: ['picked_up', 'in_transit', 'out_for_delivery'].includes(shipStatus),
  };
}

/** Shiprath answers status: "unsuccess" (a truthy string) — truthiness alone is never success. */
export function isShiprathSuccess(httpOk, body) {
  if (!httpOk || !body || typeof body !== 'object') return false;
  return body.status === true || body.success === true || /^(true|success|1)$/i.test(String(body.status ?? ''));
}

// ─── Shared helpers ─────────────────────────────────────────────────────────────────────────────

async function findOrder(identifier) {
  let query = supabase.from('orders').select('*');
  query = isUuid(identifier) ? query.eq('id', identifier) : query.eq('order_number', identifier);
  const { data, error } = await query.maybeSingle();
  return error ? null : data;
}

async function logEvent(c, eventType, { from = null, to = null, actor = null, details = null } = {}) {
  const { error } = await supabase.from('order_cancellation_events').insert({
    cancellation_id: c.id,
    order_id: c.order_id,
    event_type: eventType,
    from_status: from,
    to_status: to,
    actor_id: isUuid(actor?.id) ? actor.id : null,
    actor_role: actor?.role || 'system',
    actor_email: actor?.email || null,
    details,
  });
  if (error) console.error('[CANCELLATION AUDIT] Could not write event', eventType, error.message);
}

export function customerCancellationView(c) {
  if (!c) return null;
  const amountPaidPaise = Number(c.amount_paid_paise || 0);
  const refundAmountPaise = Number(c.refund_amount_paise || 0);
  const chargePaise = Number(c.cancellation_charge_paise ?? c.non_refundable_paise ?? (amountPaidPaise - refundAmountPaise));
  return {
    requestedAt: c.requested_at,
    orderCreatedAt: c.order_created_at,
    reason: c.reason,
    refundPercentage: c.refund_percentage,
    cancellationChargePercentage: c.refund_percentage === 90 ? 10 : (100 - (c.refund_percentage || 0)),
    amountPaid: paiseToRupees(amountPaidPaise),
    cancellationCharge: paiseToRupees(chargePaise),
    refundAmount: paiseToRupees(refundAmountPaise),
    nonRefundable: paiseToRupees(chargePaise),
    refundStatus: c.refund_status,
    refundReference: c.refund_status === 'successful' ? c.refund_reference : null,
    refundProcessedAt: c.refund_status === 'successful' ? c.refund_processed_at : null,
  };
}

/** Attach to the customer order-details payload. Returns null if none / table missing. */
export async function getCustomerCancellation(orderId) {
  if (!isUuid(orderId)) return null;
  const { data, error } = await supabase.from('order_cancellations').select('*').eq('order_id', orderId).maybeSingle();
  return error ? null : customerCancellationView(data);
}

/**
 * The cancellation record is the source of truth that an order was cancelled. Make the order row agree
 * with it: order_status 'cancelled', and an order that was never booked gets shipment_status 'cancelled'
 * so the courier booking can't pick it up. Safe to call repeatedly.
 *
 * Earlier releases wrote orders.updated_at (a column production doesn't have), which failed silently and
 * left cancelled orders showing as Confirmed/Processing — this also repairs those.
 *
 * @returns {Promise<boolean>} true when the order row is (now) cancelled
 */
export async function syncOrderWithCancellation(c, order = null) {
  if (!c?.order_id) return false;
  const current = order || (await supabase.from('orders').select('id, order_status, shipment_status').eq('id', c.order_id).maybeSingle()).data;
  if (!current) return false;

  const patch = {};
  if (String(current.order_status || '').toLowerCase() !== 'cancelled') patch.order_status = 'cancelled';
  const ship = String(current.shipment_status || '').toLowerCase();
  if (c.shipment_cancel_status === 'not_required' && ['', 'not_created', 'pending', 'failed'].includes(ship)) {
    patch.shipment_status = 'cancelled';
  }
  if (Object.keys(patch).length === 0) return true;

  const { error } = await safeUpdateOrder(c.order_id, patch);
  if (error) {
    console.error(`[CANCELLATION] ❌ Could not mark order ${c.order_number || c.order_id} cancelled:`, error.message);
    await logEvent(c, 'order_status_sync_failed', { to: 'cancelled', details: { error: error.message, patch } });
    return false;
  }
  if (patch.order_status) {
    console.warn(`[CANCELLATION] Order ${c.order_number || c.order_id} was "${current.order_status}" despite its cancellation record — set to cancelled.`);
    await logEvent(c, 'order_status_synced', { from: current.order_status, to: 'cancelled', details: patch });
  }
  Object.assign(current, patch);
  return true;
}

function getRazorpay() {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) return null;
  return new Razorpay({ key_id, key_secret });
}

// ─── Shipment cancellation ──────────────────────────────────────────────────────────────────────

/**
 * Cancel the Shiprath shipment for a cancellation. Duplicate-safe: the row is atomically claimed
 * (pending/failed → in_progress) so concurrent callers can't both hit the provider.
 * Never marks a shipment cancelled unless Shiprath confirms it.
 */
export async function cancelShipmentForCancellation(cancellationId, actor = null) {
  const { data: claimedRows, error: claimErr } = await supabase
    .from('order_cancellations')
    .update({ shipment_cancel_status: 'in_progress', shipment_cancel_last_attempt_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', cancellationId)
    .in('shipment_cancel_status', ['pending', 'failed'])
    .select('*');
  if (claimErr) return { ok: false, message: claimErr.message };
  const c = claimedRows?.[0];
  if (!c) return { ok: false, skipped: true, message: 'Shipment cancellation is not pending or is already in progress.' };

  const finish = async (status, patch, eventDetails) => {
    await supabase.from('order_cancellations').update({
      shipment_cancel_status: status,
      shipment_cancel_attempts: (c.shipment_cancel_attempts || 0) + 1,
      updated_at: new Date().toISOString(),
      ...patch,
    }).eq('id', c.id);
    await logEvent(c, 'shipment_cancel_attempt', { from: c.shipment_cancel_status, to: status, actor, details: eventDetails });
    return { ok: status === 'cancelled', status, message: patch.shipment_cancel_error || null };
  };

  const order = await findOrder(c.order_id);
  const awb = order ? (order.awb_number || order.awb || null) : null;
  const orderShip = String(order?.shipment_status || '').toLowerCase();

  if (['picked_up', 'in_transit', 'out_for_delivery', 'delivered'].includes(orderShip)) {
    return finish('manual_required', { shipment_cancel_error: `Parcel is already ${orderShip.replace(/_/g, ' ')} — arrange return-to-origin with Shiprath/courier.` }, { orderShip });
  }
  if (!awb) {
    // Booking may still be running ('creating'); leave it pending so admin can retry once an AWB exists.
    return finish(orderShip === 'creating' ? 'pending' : 'failed', {
      shipment_cancel_error: orderShip === 'creating'
        ? 'Shipment booking was in progress at cancellation time. Retry once an AWB is assigned.'
        : 'No AWB on this order — nothing to cancel with Shiprath. Mark as resolved if no parcel exists.',
    }, { orderShip });
  }

  const secretKey = (process.env.SHIPRATH_SECRET_KEY || '').trim();
  const customerId = (process.env.SHIPRATH_CUSTOMER_ID || '').trim();
  if (!secretKey || !customerId) {
    return finish('failed', { shipment_cancel_error: 'Shiprath credentials are not configured on the server.' }, { awb });
  }

  const shiprathReason = `Order cancelled by ${c.requested_by_role || 'customer'}: ${c.reason || 'Customer requested cancellation'}`.slice(0, 200);

  try {
    const res = await fetch(`${SHIPRATH_BASE_URL}/shipment/shipment_cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', secretkey: secretKey, customerid: customerId },
      // Shiprath rejects a cancel without a reason (HTTP 400 "Fill Cancel Reason"). The exact field name
      // isn't documented, so the customer's reason is sent under the common names.
      body: JSON.stringify({
        awb_number: awb,
        awb,
        shipment_id: order.shipment_id || undefined,
        cancel_reason: shiprathReason,
        reason: shiprathReason,
        remark: shiprathReason,
      }),
      signal: AbortSignal.timeout(20000),
    });
    const text = await res.text();
    let body;
    try { body = JSON.parse(text); } catch { body = { raw: text.slice(0, 500) }; }

    console.log(`[SHIPRATH CANCEL] ${order.order_number} AWB ${awb} → HTTP ${res.status} status=${body?.status} message=${body?.message || ''}`);

    if (isShiprathSuccess(res.ok, body)) {
      await supabase.from('orders').update({ shipment_status: 'cancelled' }).eq('id', order.id);
      return finish('cancelled', { shipment_cancel_response: body, shipment_cancel_error: null }, { awb, http: res.status, response: body });
    }
    return finish('failed', {
      shipment_cancel_response: body,
      shipment_cancel_error: `Shiprath did not confirm cancellation (HTTP ${res.status}): ${body?.message || 'no message'}`,
    }, { awb, http: res.status, response: body });
  } catch (err) {
    return finish('failed', { shipment_cancel_error: `Shiprath unreachable: ${err.message}` }, { awb, error: err.message });
  }
}

// ─── Customer endpoints ─────────────────────────────────────────────────────────────────────────

/** GET /api/orders/:id/cancellation-quote */
export const getCancellationQuote = async (req, res) => {
  try {
    const order = await findOrder(req.params.id);
    if (!order || !canAccessOrder(req.user, order)) return res.status(404).json({ success: false, message: 'Order not found.' });

    const existing = await getCustomerCancellation(order.id);
    if (existing) return res.json({ success: true, eligible: false, code: 'ALREADY_CANCELLED', cancellation: existing });

    return res.json({ success: true, ...quoteCancellation(order) });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Could not check cancellation eligibility.' });
  }
};

const RPC_ERRORS = {
  ORDER_NOT_FOUND: [404, 'Order not found.'],
  ALREADY_CANCELLED: [409, 'This order is already cancelled.'],
  ALREADY_DELIVERED: [409, 'Delivered orders cannot be cancelled.'],
  WINDOW_CLOSED: [409, 'You can no longer cancel this order because the 3-hour cancellation window has expired. Please contact customer support if you need assistance.'],
  REASON_REQUIRED: [400, 'Please tell us why you are cancelling (at least 3 characters).'],
};

/**
 * PUT /api/orders/:id/cancel  (also POST /api/shiprat/order/:id/cancel)
 * Body: { reason }. The refund amount is calculated in the database/server — never taken from client.
 */
export const requestCancellation = async (req, res) => {
  try {
    const reason = String(req.body?.reason || '').trim().slice(0, 500);
    const order = await findOrder(req.params.id);
    if (!order || !canAccessOrder(req.user, order)) return res.status(404).json({ success: false, message: 'Order not found.' });

    // Server-side strict check of order creation timestamp
    const orderCreatedMs = new Date(order.created_at).getTime();
    const elapsedSeconds = Math.max(0, Math.floor((Date.now() - orderCreatedMs) / 1000));
    if (elapsedSeconds > CANCELLATION_WINDOW_S) {
      return res.status(409).json({
        success: false,
        code: 'WINDOW_CLOSED',
        message: 'You can no longer cancel this order because the 3-hour cancellation window has expired. Please contact customer support if you need assistance.'
      });
    }

    const orderStatusLower = String(order.order_status || '').toLowerCase();
    if (orderStatusLower === 'cancelled') {
      return res.status(409).json({ success: false, code: 'ALREADY_CANCELLED', message: 'This order is already cancelled.' });
    }
    if (orderStatusLower === 'delivered' || String(order.shipment_status || '').toLowerCase() === 'delivered') {
      return res.status(409).json({ success: false, code: 'ALREADY_DELIVERED', message: 'Delivered orders cannot be cancelled.' });
    }
    if (reason.length < 3) {
      return res.status(400).json({ success: false, code: 'REASON_REQUIRED', message: 'Please tell us why you are cancelling (at least 3 characters).' });
    }

    const actorRole = req.user?.role === 'admin' ? 'admin' : 'customer';
    let data = null;
    let rpcFailed = false;

    try {
      const resRpc = await supabase.rpc('request_order_cancellation', {
        p_order_id: order.id,
        p_reason: reason,
        p_actor_id: isUuid(req.user?.id) ? req.user.id : null,
        p_actor_role: actorRole,
        p_actor_email: req.user?.email || null,
      });
      if (resRpc.error) {
        const code = Object.keys(RPC_ERRORS).find((k) => String(resRpc.error.message || '').includes(k));
        if (code) {
          const [status, message] = RPC_ERRORS[code];
          return res.status(status).json({ success: false, code, message });
        }
        console.warn('[CANCELLATION] RPC error (will attempt server-side fallback):', resRpc.error.message);
        rpcFailed = true;
      } else {
        data = resRpc.data;
      }
    } catch (rpcErr) {
      console.warn('[CANCELLATION] RPC exception (will attempt server-side fallback):', rpcErr.message);
      rpcFailed = true;
    }

    // Server-side atomic fallback if Postgres RPC is missing / outdated in Supabase
    if (rpcFailed || !data) {
      // Check for duplicate in order_cancellations
      const { data: existingCancel } = await supabase.from('order_cancellations').select('*').eq('order_id', order.id).maybeSingle();
      if (existingCancel) {
        return res.json({
          success: true,
          duplicate: true,
          message: 'This order was already cancelled.',
          cancellation: customerCancellationView(existingCancel),
          order: { id: order.id, order_number: order.order_number, order_status: 'cancelled' },
        });
      }

      const prepaid = String(order.payment_method || '').toLowerCase() === 'razorpay' && String(order.payment_status || '').toLowerCase() === 'paid';
      const deliveryCharge = Number(order.delivery_fee || order.delivery_charge || order.shipping_fee || 0);
      const totalPaid = Number(order.grand_total || 0);
      const productAmount = Math.max(0, totalPaid - deliveryCharge);

      const productAmountPaise = prepaid ? Math.round(productAmount * 100) : 0;
      const amountPaidPaise = prepaid ? Math.round(totalPaid * 100) : 0;
      const cancellationChargePaise = prepaid ? Math.round((productAmountPaise * CANCELLATION_CHARGE_PERCENTAGE) / 100) : 0;
      const refundAmountPaise = prepaid ? (amountPaidPaise - cancellationChargePaise) : 0;
      const refundStatus = prepaid
        ? (!order.payment_id || !String(order.payment_id).startsWith('pay_') ? 'needs_review' : 'pending')
        : 'not_applicable';

      const awb = order.awb_number || order.awb || null;
      const orderShip = String(order.shipment_status || '').toLowerCase();
      let shipCancelStatus = 'not_required';
      if (['picked_up', 'in_transit', 'out_for_delivery'].includes(orderShip)) {
        shipCancelStatus = 'manual_required';
      } else if (awb || orderShip === 'creating') {
        shipCancelStatus = 'pending';
      }

      const now = new Date().toISOString();
      const insertPayload = {
        order_id: order.id,
        order_number: order.order_number,
        user_id: isUuid(order.user_id) ? order.user_id : null,
        requested_by_role: actorRole,
        reason,
        order_created_at: order.created_at,
        requested_at: now,
        elapsed_seconds: elapsedSeconds,
        payment_method: order.payment_method,
        razorpay_payment_id: (order.payment_id && String(order.payment_id).startsWith('pay_')) ? order.payment_id : null,
        amount_paid_paise: amountPaidPaise,
        refund_percentage: prepaid ? REFUND_PERCENTAGE : 0,
        refund_amount_paise: refundAmountPaise,
        cancellation_charge_paise: cancellationChargePaise,
        refund_status: refundStatus,
        shipment_cancel_status: shipCancelStatus,
        shipment_status_at_request: order.shipment_status || null,
        awb_at_request: awb,
        created_at: now,
        updated_at: now,
      };

      // order_id is UNIQUE: if a simultaneous request won the race, this insert fails with 23505
      const { data: createdRows, error: insertErr } = await supabase
        .from('order_cancellations')
        .insert([insertPayload])
        .select('*');

      if (insertErr?.code === '23505') {
        const { data: winner } = await supabase.from('order_cancellations').select('*').eq('order_id', order.id).maybeSingle();
        data = { duplicate: true, cancellation: winner };
      } else if (insertErr || !createdRows?.length) {
        console.error('[CANCELLATION] Fallback insert error:', insertErr?.message);
        return res.status(500).json({ success: false, message: 'Could not complete cancellation in database. Please contact support.' });
      } else {
        const created = createdRows[0];
        await logEvent(created, 'cancellation_requested', {
          from: order.order_status,
          to: 'cancelled',
          actor: req.user,
          details: { via: 'server_fallback', elapsed_seconds: elapsedSeconds, refund_percentage: prepaid ? REFUND_PERCENTAGE : 0, amount_paid_paise: amountPaidPaise, refund_amount_paise: refundAmountPaise, cancellation_charge_paise: cancellationChargePaise, refund_status: refundStatus, shipment_cancel_status: shipCancelStatus },
        });
        data = { duplicate: false, cancellation: created };
      }
    }

    const c = data?.cancellation;
    // The order row must say "cancelled" before we tell the customer it is — verify, don't assume
    const orderSynced = await syncOrderWithCancellation(c);
    if (!orderSynced) {
      console.error(`[CANCELLATION] ⚠️ ${order.order_number}: cancellation recorded but order row not updated — it will be repaired on the next read.`);
    }
    if (!data?.duplicate && c) {
      console.log(`[CANCELLATION] ${c.order_number} cancelled by ${actorRole} after ${c.elapsed_seconds}s → 90% refund (₹${paiseToRupees(c.refund_amount_paise)}), 10% charge (₹${paiseToRupees(c.cancellation_charge_paise || (c.amount_paid_paise - c.refund_amount_paise))}), refund=${c.refund_status}, shipment=${c.shipment_cancel_status}`);
      if (c.shipment_cancel_status === 'pending') {
        setImmediate(() => cancelShipmentForCancellation(c.id).catch((e) => console.error('[SHIPRATH CANCEL] exception', e.message)));
      }
    }

    return res.json({
      success: true,
      duplicate: Boolean(data?.duplicate),
      message: data?.duplicate ? 'This order was already cancelled.' : 'Your order has been cancelled.',
      cancellation: customerCancellationView(c),
      order: { id: order.id, order_number: order.order_number, order_status: 'cancelled' },
    });
  } catch (error) {
    console.error('[CANCELLATION] error:', error.message);
    return res.status(500).json({ success: false, message: 'Could not cancel the order. Please try again.' });
  }
};

// ─── Admin endpoints ────────────────────────────────────────────────────────────────────────────

// orders (*) rather than a column list, so the recipient columns are included once migration 26 adds
// them without breaking this query before it runs. account = the customer account that owns the order.
const ADMIN_SELECT = '*, orders:order_id (*), account:user_id (id, name, email, phone)';

const FILTERS = {
  all: (q) => q,
  eligible_90: (q) => q.eq('refund_percentage', 90),
  full: (q) => q.eq('refund_percentage', 100),
  partial: (q) => q.or('refund_percentage.eq.50,refund_percentage.eq.90'),
  review: (q) => q.or('refund_status.eq.needs_review,shipment_cancel_status.eq.manual_required'),
  pending_refund: (q) => q.in('refund_status', ['pending', 'processing']),
  refund_successful: (q) => q.eq('refund_status', 'successful'),
  refund_failed: (q) => q.eq('refund_status', 'failed'),
  shipment_failed: (q) => q.in('shipment_cancel_status', ['failed', 'pending']),
};

const adminRow = (c) => {
  const amountPaidPaise = Number(c.amount_paid_paise || 0);
  const refundAmountPaise = Number(c.refund_amount_paise || 0);
  const chargePaise = Number(c.cancellation_charge_paise ?? c.non_refundable_paise ?? (amountPaidPaise - refundAmountPaise));
  return {
    ...c,
    orders: c.orders ? withRecipient(c.orders) : c.orders,
    amount_paid: paiseToRupees(amountPaidPaise),
    cancellation_charge: paiseToRupees(chargePaise),
    cancellation_charge_paise: chargePaise,
    refund_amount: paiseToRupees(refundAmountPaise),
    non_refundable: paiseToRupees(chargePaise),
  };
};

/** GET /api/admin/cancellations?filter=&search= */
export const listCancellations = async (req, res) => {
  try {
    const filter = FILTERS[req.query.filter] ? req.query.filter : 'all';
    let query = supabase.from('order_cancellations').select(ADMIN_SELECT).order('requested_at', { ascending: false }).limit(500);
    query = FILTERS[filter](query);
    const { data, error } = await query;
    if (error) return res.status(500).json({ success: false, message: error.message });

    // Repair orders whose row never got the cancelled status (see syncOrderWithCancellation)
    await Promise.all((data || [])
      .filter((c) => c.orders && String(c.orders.order_status || '').toLowerCase() !== 'cancelled')
      .map((c) => syncOrderWithCancellation(c, c.orders)));

    const term = String(req.query.search || '').trim().toLowerCase();
    const rows = (data || []).filter((c) => !term || [
      c.order_number, c.orders?.order_number, c.orders?.customer_name, c.orders?.customer_email, c.orders?.customer_phone, c.razorpay_payment_id,
    ].some((v) => String(v || '').toLowerCase().includes(term)));

    return res.json({ success: true, cancellations: rows.map(adminRow) });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error loading cancellations.' });
  }
};

/** GET /api/admin/cancellations/summary — sidebar badge + bell notifications */
export const getCancellationSummary = async (req, res) => {
  try {
    const [actionable, unseen] = await Promise.all([
      supabase.from('order_cancellations').select('id', { count: 'exact', head: true })
        .or(`refund_status.in.(${OPEN_REFUND_STATUSES.join(',')}),shipment_cancel_status.in.(${OPEN_SHIPMENT_STATUSES.join(',')})`),
      supabase.from('order_cancellations').select(ADMIN_SELECT).is('admin_seen_at', null).order('requested_at', { ascending: false }).limit(10),
    ]);
    if (actionable.error || unseen.error) {
      return res.status(500).json({ success: false, message: (actionable.error || unseen.error).message });
    }
    return res.json({ success: true, actionableCount: actionable.count || 0, unseen: (unseen.data || []).map(adminRow) });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error loading cancellation summary.' });
  }
};

async function loadCancellation(id) {
  if (!isUuid(id)) return null;
  const { data } = await supabase.from('order_cancellations').select(ADMIN_SELECT).eq('id', id).maybeSingle();
  return data || null;
}

/** GET /api/admin/cancellations/:id — full history; marks it seen */
export const getCancellationDetail = async (req, res) => {
  try {
    const c = await loadCancellation(req.params.id);
    if (!c) return res.status(404).json({ success: false, message: 'Cancellation not found.' });

    const [{ data: items }, { data: events }] = await Promise.all([
      supabase.from('order_items').select('*').eq('order_id', c.order_id),
      supabase.from('order_cancellation_events').select('*').eq('cancellation_id', c.id).order('created_at', { ascending: true }),
    ]);
    if (!c.admin_seen_at) {
      await supabase.from('order_cancellations').update({ admin_seen_at: new Date().toISOString() }).eq('id', c.id).is('admin_seen_at', null);
    }
    return res.json({ success: true, cancellation: adminRow(c), items: items || [], events: events || [] });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error loading cancellation.' });
  }
};

/** POST /api/admin/cancellations/mark-seen  { ids?: [] } — clears bell notifications */
export const markCancellationsSeen = async (req, res) => {
  let query = supabase.from('order_cancellations').update({ admin_seen_at: new Date().toISOString() }).is('admin_seen_at', null);
  const ids = Array.isArray(req.body?.ids) ? req.body.ids.filter(isUuid) : null;
  if (ids?.length) query = query.in('id', ids);
  const { error } = await query;
  return error ? res.status(500).json({ success: false, message: error.message }) : res.json({ success: true });
};

/** POST /api/admin/cancellations/:id/refund-status  { status: pending|processing|failed, notes } */
export const updateRefundStatus = async (req, res) => {
  try {
    const next = String(req.body?.status || '');
    const notes = String(req.body?.notes || '').trim().slice(0, 1000);
    const c = await loadCancellation(req.params.id);
    if (!c) return res.status(404).json({ success: false, message: 'Cancellation not found.' });

    const allowed = REFUND_TRANSITIONS[c.refund_status] || [];
    if (!allowed.includes(next)) {
      return res.status(409).json({ success: false, message: `Refund status cannot change from "${c.refund_status}" to "${next}".` });
    }
    if (next === 'failed' && !notes) return res.status(400).json({ success: false, message: 'Add a note explaining why the refund failed.' });

    const { data: updated, error } = await supabase.from('order_cancellations')
      .update({ refund_status: next, refund_notes: notes || c.refund_notes, updated_at: new Date().toISOString() })
      .eq('id', c.id).eq('refund_status', c.refund_status) // optimistic lock
      .select('id');
    if (error) return res.status(500).json({ success: false, message: error.message });
    if (!updated?.length) return res.status(409).json({ success: false, message: 'Refund status changed in the meantime. Reload and try again.' });

    await logEvent(c, 'refund_status_changed', { from: c.refund_status, to: next, actor: req.user, details: { notes } });
    return res.json({ success: true, cancellation: adminRow(await loadCancellation(c.id)) });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error updating refund status.' });
  }
};

/**
 * POST /api/admin/cancellations/:id/mark-refunded  { refundId, notes, manualConfirm? }
 * Verifies the refund through the Razorpay API (belongs to this payment, processed, exact amount).
 * Only if Razorpay is unreachable may the admin confirm manually (manualConfirm: true), and that is
 * recorded as refund_verified_via = 'manual_admin'.
 */
export const markRefundSuccessful = async (req, res) => {
  try {
    const refundId = String(req.body?.refundId || '').trim();
    const notes = String(req.body?.notes || '').trim().slice(0, 1000);
    const manualConfirm = req.body?.manualConfirm === true;

    const c = await loadCancellation(req.params.id);
    if (!c) return res.status(404).json({ success: false, message: 'Cancellation not found.' });
    if (c.refund_status === 'successful') return res.status(409).json({ success: false, message: `Refund already recorded (${c.refund_reference}).` });
    if (!OPEN_REFUND_STATUSES.includes(c.refund_status)) {
      return res.status(409).json({ success: false, message: `No refund is due for this cancellation (status: ${c.refund_status}).` });
    }
    if (!/^rfnd_[A-Za-z0-9]{6,}$/.test(refundId)) {
      return res.status(400).json({ success: false, message: 'Enter the Razorpay refund ID exactly as shown in the Razorpay Dashboard (starts with "rfnd_").' });
    }

    let verifiedVia = null;
    let verification = null;
    const rzp = c.razorpay_payment_id ? getRazorpay() : null;

    if (rzp) {
      try {
        const refund = await rzp.payments.fetchRefund(c.razorpay_payment_id, refundId);
        verification = { id: refund.id, payment_id: refund.payment_id, amount: refund.amount, status: refund.status };
        if (refund.payment_id !== c.razorpay_payment_id) {
          return res.status(400).json({ success: false, message: 'This refund belongs to a different payment.', verification });
        }
        if (refund.status !== 'processed') {
          return res.status(409).json({ success: false, message: `Razorpay shows this refund as "${refund.status}". Mark it Processing and confirm once Razorpay shows it processed.`, verification });
        }
        if (Number(refund.amount) !== Number(c.refund_amount_paise)) {
          return res.status(400).json({
            success: false,
            message: `Refund amount in Razorpay (₹${paiseToRupees(refund.amount)}) does not match the eligible refund (₹${paiseToRupees(c.refund_amount_paise)}).`,
            verification,
          });
        }
        verifiedVia = 'razorpay_api';
      } catch (err) {
        const status = err?.statusCode;
        if (status && status >= 400 && status < 500 && status !== 401) {
          // Razorpay answered: the refund id doesn't exist for this payment
          return res.status(400).json({ success: false, message: `Razorpay could not find refund ${refundId} on payment ${c.razorpay_payment_id}: ${err?.error?.description || 'not found'}.` });
        }
        console.warn('[REFUND VERIFY] Razorpay API unavailable:', status || err.message);
      }
    }

    if (!verifiedVia) {
      if (!manualConfirm) {
        return res.status(409).json({
          success: false,
          code: 'VERIFICATION_UNAVAILABLE',
          message: c.razorpay_payment_id
            ? 'The refund could not be verified with Razorpay right now. Confirm manually only if the Razorpay Dashboard shows this refund as processed for the exact amount.'
            : 'This order has no Razorpay payment ID, so the refund cannot be verified automatically. Confirm manually only after checking the Razorpay Dashboard.',
        });
      }
      verifiedVia = 'manual_admin';
    }

    const now = new Date().toISOString();
    const { data: updated, error } = await supabase.from('order_cancellations')
      .update({
        refund_status: 'successful',
        refund_reference: refundId,
        refund_verified_via: verifiedVia,
        refund_processed_by: isUuid(req.user?.id) ? req.user.id : null,
        refund_processed_by_email: req.user?.email || null,
        refund_processed_at: now,
        refund_notes: notes || c.refund_notes,
        updated_at: now,
      })
      .eq('id', c.id)
      .in('refund_status', OPEN_REFUND_STATUSES)
      .select('id');

    if (error) {
      if (error.code === '23505') return res.status(409).json({ success: false, message: `Refund ${refundId} is already recorded against another cancellation.` });
      return res.status(500).json({ success: false, message: error.message });
    }
    if (!updated?.length) return res.status(409).json({ success: false, message: 'Refund status changed in the meantime. Reload and try again.' });

    await markOrderRefunded(c);
    await logEvent(c, 'refund_marked_successful', {
      from: c.refund_status, to: 'successful', actor: req.user,
      details: { refund_id: refundId, amount_paise: c.refund_amount_paise, verified_via: verifiedVia, verification, notes },
    });
    return res.json({ success: true, verifiedVia, cancellation: adminRow(await loadCancellation(c.id)) });
  } catch (error) {
    console.error('[REFUND] mark successful error:', error.message);
    return res.status(500).json({ success: false, message: 'Error recording refund.' });
  }
};

/** POST /api/admin/cancellations/:id/retry-shipment-cancel */
export const retryShipmentCancel = async (req, res) => {
  const c = await loadCancellation(req.params.id);
  if (!c) return res.status(404).json({ success: false, message: 'Cancellation not found.' });
  if (!['pending', 'failed'].includes(c.shipment_cancel_status)) {
    return res.status(409).json({ success: false, message: `Shipment cancellation is "${c.shipment_cancel_status}" — nothing to retry.` });
  }
  const result = await cancelShipmentForCancellation(c.id, req.user);
  return res.status(result.skipped ? 409 : 200).json({ success: result.ok, ...result, cancellation: adminRow(await loadCancellation(c.id)) });
};

/** POST /api/admin/cancellations/:id/resolve-shipment  { notes } — admin handled RTO / confirmed no parcel */
export const resolveShipmentManually = async (req, res) => {
  const notes = String(req.body?.notes || '').trim().slice(0, 1000);
  if (notes.length < 5) return res.status(400).json({ success: false, message: 'Describe how the shipment was resolved (e.g. RTO reference).' });
  const c = await loadCancellation(req.params.id);
  if (!c) return res.status(404).json({ success: false, message: 'Cancellation not found.' });
  if (!['failed', 'manual_required', 'pending'].includes(c.shipment_cancel_status)) {
    return res.status(409).json({ success: false, message: `Shipment cancellation is "${c.shipment_cancel_status}".` });
  }
  const { data: updated } = await supabase.from('order_cancellations')
    .update({ shipment_cancel_status: 'manually_resolved', updated_at: new Date().toISOString() })
    .eq('id', c.id).eq('shipment_cancel_status', c.shipment_cancel_status).select('id');
  if (!updated?.length) return res.status(409).json({ success: false, message: 'Shipment status changed in the meantime. Reload and try again.' });
  await logEvent(c, 'shipment_manually_resolved', { from: c.shipment_cancel_status, to: 'manually_resolved', actor: req.user, details: { notes } });
  return res.json({ success: true, cancellation: adminRow(await loadCancellation(c.id)) });
};


/** Once a refund is confirmed, the order's payment status says so too (customer + admin order views). */
async function markOrderRefunded(c) {
  const { error } = await safeUpdateOrder(c.order_id, { payment_status: 'refunded' });
  if (error) console.error(`[REFUND] Could not set payment_status=refunded on ${c.order_number}:`, error.message);
}

/** Apply Razorpay's view of a refund to the cancellation. Only "processed" becomes successful. */
async function applyRazorpayRefund(c, refund, actor, eventType) {
  const rzpStatus = String(refund.status || '').toLowerCase();
  const next = rzpStatus === 'processed' ? 'successful' : rzpStatus === 'failed' ? 'failed' : 'processing';
  const nowIso = new Date().toISOString();
  const { data: updated, error } = await supabase.from('order_cancellations')
    .update({
      refund_status: next,
      refund_reference: refund.id,
      refund_verified_via: 'razorpay_api',
      refund_processed_by: isUuid(actor?.id) ? actor.id : null,
      refund_processed_by_email: actor?.email || null,
      refund_processed_at: next === 'successful' ? nowIso : null,
      refund_notes: `Razorpay refund ${refund.id}: ${rzpStatus || 'unknown'}${next === 'failed' ? ' — retry or refund manually' : ''}`,
      updated_at: nowIso,
    })
    .eq('id', c.id)
    .neq('refund_status', 'successful')
    .select('id');
  if (error) return { error };
  if (next === 'successful') await markOrderRefunded(c);
  if (updated?.length) {
    await logEvent(c, next === 'successful' ? 'refund_marked_successful' : eventType, {
      from: c.refund_status, to: next, actor,
      details: { refund_id: refund.id, amount_paise: refund.amount, razorpay_status: rzpStatus, verified_via: 'razorpay_api' },
    });
  }
  return { status: next, rzpStatus };
}

/** A refund Razorpay already holds for this cancellation (e.g. an earlier attempt whose response was lost). */
async function findExistingRazorpayRefund(rzp, paymentId, cancellationId) {
  const list = await rzp.payments.fetchMultipleRefund(paymentId, { count: 100 });
  return (list?.items || []).find((r) => r?.notes?.cancellation_id === cancellationId && r.status !== 'failed') || null;
}

/**
 * POST /api/admin/cancellations/:id/initiate-refund
 * Calls the Razorpay Refund API for the eligible refund amount (calculated at cancellation time).
 *   - Admin only (router); COD / no Razorpay payment → refused, use manual settlement
 *   - Duplicate-safe: the row is atomically claimed (open status → processing) so only one request can
 *     reach Razorpay, and a refund Razorpay already has for this cancellation is adopted, never repeated
 *   - Marked successful only when Razorpay reports the refund "processed"; otherwise it stays processing
 *     until "Sync with Razorpay" (or the admin confirming it) records the outcome
 */
export const initiateRazorpayRefund = async (req, res) => {
  try {
    const c = await loadCancellation(req.params.id);
    if (!c) return res.status(404).json({ success: false, message: 'Cancellation not found.' });

    if (c.refund_status === 'successful') {
      return res.status(409).json({ success: false, message: `Refund already recorded with ID (${c.refund_reference}).` });
    }
    // 'processing' means a refund may already be on its way (this endpoint sets it before calling
    // Razorpay), so never start another from it: sync with Razorpay, or move it back to Pending first.
    if (c.refund_status === 'processing') {
      return res.status(409).json({
        success: false,
        message: c.refund_reference
          ? `Refund ${c.refund_reference} is already in progress at Razorpay. Use "Sync with Razorpay" to check its status.`
          : 'A refund is already being processed for this cancellation. Use "Sync with Razorpay" to check it, or set it back to Pending if no refund was made.',
      });
    }
    const claimable = ['pending', 'failed', 'needs_review'];
    if (!claimable.includes(c.refund_status)) {
      return res.status(409).json({ success: false, message: `No refund is due for this cancellation (status: ${c.refund_status}).` });
    }

    const payMethod = String(c.payment_method || '').toLowerCase();
    if (payMethod === 'cod') {
      return res.status(400).json({
        success: false,
        message: 'This is a Cash on Delivery order. Razorpay refunds cannot be created for COD orders. Use manual settlement if cash was accepted.',
      });
    }

    const paymentId = c.razorpay_payment_id || c.orders?.payment_id;
    if (!paymentId || !String(paymentId).startsWith('pay_')) {
      return res.status(400).json({
        success: false,
        message: 'No valid Razorpay payment ID (pay_...) found for this order. Check payment status or record manually.',
      });
    }

    const amountPaise = Number(c.refund_amount_paise || 0);
    const amountPaidPaise = Number(c.amount_paid_paise || 0);
    if (amountPaise <= 0) {
      return res.status(400).json({ success: false, message: 'Eligible refund amount is ₹0.' });
    }
    if (amountPaise > amountPaidPaise) {
      return res.status(400).json({
        success: false,
        message: `Refund amount (₹${paiseToRupees(amountPaise)}) cannot exceed total amount paid (₹${paiseToRupees(amountPaidPaise)}).`,
      });
    }

    const rzp = getRazorpay();
    if (!rzp) {
      return res.status(500).json({ success: false, message: 'Razorpay credentials not configured on the server. Please check environment variables.' });
    }

    // Atomic claim: only the request that moves the row out of its current status may call Razorpay.
    // A second click (or a second admin) finds the status already changed and stops here.
    const claimNote = `Refund requested via Razorpay API by ${req.user?.email || 'admin'} at ${new Date().toISOString()}`;
    const { data: claimed, error: claimErr } = await supabase.from('order_cancellations')
      .update({ refund_status: 'processing', refund_notes: claimNote, updated_at: new Date().toISOString() })
      .eq('id', c.id)
      .eq('refund_status', c.refund_status)
      .select('id');
    if (claimErr) return res.status(500).json({ success: false, message: claimErr.message });
    if (!claimed?.length) {
      return res.status(409).json({ success: false, message: 'This refund is already being processed. Reload to see its current status.' });
    }
    const claimedRow = { ...c, refund_status: 'processing' };

    // An earlier attempt may have reached Razorpay even though we never saw the answer — adopt it
    try {
      const existing = await findExistingRazorpayRefund(rzp, paymentId, c.id);
      if (existing) {
        const applied = await applyRazorpayRefund(claimedRow, existing, req.user, 'refund_adopted_from_razorpay');
        if (applied.error) return res.status(500).json({ success: false, message: `Razorpay already has refund ${existing.id} but saving it failed: ${applied.error.message}` });
        return res.json({ success: true, refundId: existing.id, refundStatus: applied.status, adopted: true, cancellation: adminRow(await loadCancellation(c.id)) });
      }
    } catch (lookupErr) {
      // Can't confirm there is no earlier refund — don't risk refunding twice
      await supabase.from('order_cancellations')
        .update({ refund_status: c.refund_status, refund_notes: `Could not check Razorpay for earlier refunds: ${lookupErr?.error?.description || lookupErr.message}`, updated_at: new Date().toISOString() })
        .eq('id', c.id).eq('refund_status', 'processing');
      return res.status(502).json({ success: false, message: 'Could not reach Razorpay to check for an earlier refund. Nothing was refunded — please try again.' });
    }

    let refundResponse;
    try {
      refundResponse = await rzp.payments.refund(paymentId, {
        amount: amountPaise,
        speed: 'optimum',
        notes: {
          order_id: c.order_id,
          order_number: c.order_number || c.orders?.order_number,
          cancellation_id: c.id,
          deduction: '10% cancellation charge on product amount',
          initiated_by: req.user?.email || 'admin',
        },
        receipt: `REF-${c.order_number || String(c.id).slice(0, 8)}`,
      });
    } catch (apiErr) {
      console.error('[RAZORPAY REFUND API ERROR]', apiErr?.error || apiErr?.message || apiErr);
      const errMsg = apiErr?.error?.description || apiErr?.message || 'Razorpay refund API call failed';
      // No answer at all (network / timeout): the refund may exist — keep it processing so it's synced, not retried blind
      const noAnswer = !apiErr?.statusCode;
      await supabase.from('order_cancellations')
        .update({
          refund_status: noAnswer ? 'processing' : 'failed',
          refund_notes: noAnswer
            ? `No response from Razorpay (${errMsg}). Use "Sync with Razorpay" before retrying.`
            : `Razorpay rejected the refund: ${errMsg}`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', c.id);
      await logEvent(c, 'refund_attempt_failed', {
        from: c.refund_status, to: noAnswer ? 'processing' : 'failed', actor: req.user,
        details: { payment_id: paymentId, amount_paise: amountPaise, error: errMsg, http: apiErr?.statusCode || null },
      });
      return res.status(noAnswer ? 502 : 400).json({
        success: false,
        message: noAnswer
          ? 'Razorpay did not respond. The refund may or may not have been created — use "Sync with Razorpay" to check before trying again.'
          : `Razorpay rejected the refund: ${errMsg}`,
      });
    }

    if (!refundResponse?.id) {
      await supabase.from('order_cancellations')
        .update({ refund_notes: 'Razorpay returned no refund ID — check the Razorpay Dashboard, then use "Sync with Razorpay".', updated_at: new Date().toISOString() })
        .eq('id', c.id);
      return res.status(502).json({ success: false, message: 'Invalid response from Razorpay. Please check the Razorpay Dashboard.' });
    }

    const applied = await applyRazorpayRefund(claimedRow, refundResponse, req.user, 'refund_initiated');
    if (applied.error) {
      console.error('[REFUND UPDATE DB ERROR]', applied.error);
      return res.status(500).json({ success: false, message: `Refund created in Razorpay (${refundResponse.id}) but saving it failed: ${applied.error.message}. Use "Sync with Razorpay".` });
    }

    console.log(`[RAZORPAY REFUND] Cancellation ${c.id} on ${c.order_number}: refund ${refundResponse.id} ${applied.rzpStatus} → ${applied.status} for ₹${paiseToRupees(amountPaise)}`);
    return res.json({ success: true, refundId: refundResponse.id, refundStatus: applied.status, cancellation: adminRow(await loadCancellation(c.id)) });
  } catch (error) {
    console.error('[INITIATE REFUND ERROR]', error);
    return res.status(500).json({ success: false, message: error.message || 'Error initiating Razorpay refund.' });
  }
};

/**
 * POST /api/admin/cancellations/:id/sync-refund
 * Reads the refund's real state from Razorpay (by its refund id, or by looking for one tagged with this
 * cancellation) and records it: processed → successful, failed → failed, otherwise still processing.
 */
export const syncRefundWithRazorpay = async (req, res) => {
  try {
    const c = await loadCancellation(req.params.id);
    if (!c) return res.status(404).json({ success: false, message: 'Cancellation not found.' });
    if (c.refund_status === 'successful') {
      return res.json({ success: true, refundStatus: 'successful', cancellation: adminRow(c) });
    }
    const paymentId = c.razorpay_payment_id || c.orders?.payment_id;
    if (!paymentId || !String(paymentId).startsWith('pay_')) {
      return res.status(400).json({ success: false, message: 'This order has no Razorpay payment to check.' });
    }
    const rzp = getRazorpay();
    if (!rzp) return res.status(500).json({ success: false, message: 'Razorpay credentials not configured on the server.' });

    let refund = null;
    try {
      refund = c.refund_reference
        ? await rzp.payments.fetchRefund(paymentId, c.refund_reference)
        : await findExistingRazorpayRefund(rzp, paymentId, c.id);
    } catch (err) {
      return res.status(502).json({ success: false, message: `Could not reach Razorpay: ${err?.error?.description || err.message}` });
    }
    if (!refund) {
      return res.json({ success: true, refundStatus: c.refund_status, message: 'Razorpay has no refund for this cancellation yet.', cancellation: adminRow(c) });
    }

    const applied = await applyRazorpayRefund(c, refund, req.user, 'refund_synced');
    if (applied.error) return res.status(500).json({ success: false, message: applied.error.message });
    return res.json({ success: true, refundStatus: applied.status, refundId: refund.id, cancellation: adminRow(await loadCancellation(c.id)) });
  } catch (error) {
    console.error('[SYNC REFUND ERROR]', error);
    return res.status(500).json({ success: false, message: 'Error syncing refund with Razorpay.' });
  }
};
