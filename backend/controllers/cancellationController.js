import Razorpay from 'razorpay';
import { supabase } from '../config/supabase.js';
import { canAccessOrder } from './shipratController.js';

/**
 * Order cancellations, manual refund tracking and Shiprath shipment cancellation.
 * Schema + atomic cancel function: scripts/19_order_cancellations_and_refunds.sql
 *
 * Policy (the SQL function request_order_cancellation is authoritative; quoteCancellation mirrors it
 * for the customer preview):
 *   elapsed <= 3h → 100%   ·   3h < elapsed <= 5h → 50%   ·   > 5h → blocked
 *   base = amount paid (grand total) for paid Razorpay orders, 0 for COD; refund rounded down to the paisa.
 *
 * Refunds are made MANUALLY by an admin in the Razorpay Dashboard. Nothing here moves money.
 */

const SHIPRATH_BASE_URL = 'https://backend.shiprath.com/vendor/v1';
const HOUR = 3600;
export const FULL_REFUND_WINDOW_S = 3 * HOUR;
export const PARTIAL_REFUND_WINDOW_S = 5 * HOUR;

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
  if (elapsedSeconds <= FULL_REFUND_WINDOW_S) return 100;
  if (elapsedSeconds <= PARTIAL_REFUND_WINDOW_S) return 50;
  return null;
}

/** Customer-facing preview. `nowMs` comes from the server, never the browser. */
export function quoteCancellation(order, nowMs = Date.now()) {
  const status = String(order.order_status || '').toLowerCase();
  const shipStatus = String(order.shipment_status || '').toLowerCase();
  const elapsedSeconds = Math.max(0, Math.floor((nowMs - new Date(order.created_at).getTime()) / 1000));
  const base = { elapsedSeconds, orderCreatedAt: order.created_at };

  if (status === 'cancelled') return { ...base, eligible: false, code: 'ALREADY_CANCELLED', message: 'This order is already cancelled.' };
  if (status === 'delivered' || shipStatus === 'delivered') {
    return { ...base, eligible: false, code: 'ALREADY_DELIVERED', message: 'Delivered orders cannot be cancelled.' };
  }
  const pct = refundPercentageFor(elapsedSeconds);
  if (pct === null) {
    return { ...base, eligible: false, code: 'WINDOW_CLOSED', message: 'Orders can only be cancelled within 5 hours of placing them. Please contact MILASTY support.' };
  }

  const prepaid = String(order.payment_method || '').toLowerCase() === 'razorpay' && String(order.payment_status || '').toLowerCase() === 'paid';
  const amountPaidPaise = prepaid ? Math.round(Number(order.grand_total || 0) * 100) : 0;
  const refundAmountPaise = Math.floor((amountPaidPaise * pct) / 100);
  const windowEnd = new Date(new Date(order.created_at).getTime() + (pct === 100 ? FULL_REFUND_WINDOW_S : PARTIAL_REFUND_WINDOW_S) * 1000);

  return {
    ...base,
    eligible: true,
    prepaid,
    refundPercentage: pct,
    amountPaid: paiseToRupees(amountPaidPaise),
    refundAmount: paiseToRupees(refundAmountPaise),
    nonRefundable: paiseToRupees(amountPaidPaise - refundAmountPaise),
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

function customerCancellationView(c) {
  if (!c) return null;
  return {
    requestedAt: c.requested_at,
    reason: c.reason,
    refundPercentage: c.refund_percentage,
    amountPaid: paiseToRupees(c.amount_paid_paise),
    refundAmount: paiseToRupees(c.refund_amount_paise),
    nonRefundable: paiseToRupees(c.non_refundable_paise),
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

  try {
    const res = await fetch(`${SHIPRATH_BASE_URL}/shipment/shipment_cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', secretkey: secretKey, customerid: customerId },
      body: JSON.stringify({ awb_number: awb, awb, shipment_id: order.shipment_id || undefined }),
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
  WINDOW_CLOSED: [409, 'Orders can only be cancelled within 5 hours of placing them. Please contact MILASTY support.'],
  REASON_REQUIRED: [400, 'Please tell us why you are cancelling (at least 3 characters).'],
};

/**
 * PUT /api/orders/:id/cancel  (also POST /api/shiprat/order/:id/cancel)
 * Body: { reason }. The refund amount is calculated in the database — never taken from the client.
 */
export const requestCancellation = async (req, res) => {
  try {
    const reason = String(req.body?.reason || '').trim().slice(0, 500);
    const order = await findOrder(req.params.id);
    if (!order || !canAccessOrder(req.user, order)) return res.status(404).json({ success: false, message: 'Order not found.' });

    const actorRole = req.user?.role === 'admin' ? 'admin' : 'customer';
    const { data, error } = await supabase.rpc('request_order_cancellation', {
      p_order_id: order.id,
      p_reason: reason,
      p_actor_id: isUuid(req.user?.id) ? req.user.id : null,
      p_actor_role: actorRole,
      p_actor_email: req.user?.email || null,
    });

    if (error) {
      const code = Object.keys(RPC_ERRORS).find((k) => String(error.message || '').includes(k));
      if (code) {
        const [status, message] = RPC_ERRORS[code];
        return res.status(status).json({ success: false, code, message });
      }
      console.error('[CANCELLATION] RPC failed:', error.message);
      const missing = /request_order_cancellation|order_cancellations/.test(error.message || '');
      return res.status(500).json({ success: false, message: missing ? 'Cancellation is temporarily unavailable. Please contact support.' : 'Could not cancel the order. Please try again.' });
    }

    const c = data?.cancellation;
    if (!data?.duplicate && c) {
      console.log(`[CANCELLATION] ${c.order_number} cancelled by ${actorRole} after ${c.elapsed_seconds}s → ${c.refund_percentage}% (₹${paiseToRupees(c.refund_amount_paise)}), refund=${c.refund_status}, shipment=${c.shipment_cancel_status}`);
      if (c.shipment_cancel_status === 'pending') {
        // Fire-and-forget; outcome is recorded on the cancellation and shown to admin
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

const ADMIN_SELECT = '*, orders:order_id (id, order_number, customer_name, customer_email, customer_phone, grand_total, subtotal, delivery_fee, discount_amount, coupon_code, created_at, order_status, payment_status, payment_method, payment_id, shipment_status, awb_number, courier_name)';

const FILTERS = {
  all: (q) => q,
  full: (q) => q.eq('refund_percentage', 100),
  partial: (q) => q.eq('refund_percentage', 50),
  review: (q) => q.or('refund_status.eq.needs_review,shipment_cancel_status.eq.manual_required'),
  pending_refund: (q) => q.in('refund_status', ['pending', 'processing']),
  refund_successful: (q) => q.eq('refund_status', 'successful'),
  refund_failed: (q) => q.eq('refund_status', 'failed'),
  shipment_failed: (q) => q.in('shipment_cancel_status', ['failed', 'pending']),
};

const adminRow = (c) => ({
  ...c,
  amount_paid: paiseToRupees(c.amount_paid_paise),
  refund_amount: paiseToRupees(c.refund_amount_paise),
  non_refundable: paiseToRupees(c.non_refundable_paise),
});

/** GET /api/admin/cancellations?filter=&search= */
export const listCancellations = async (req, res) => {
  try {
    const filter = FILTERS[req.query.filter] ? req.query.filter : 'all';
    let query = supabase.from('order_cancellations').select(ADMIN_SELECT).order('requested_at', { ascending: false }).limit(500);
    query = FILTERS[filter](query);
    const { data, error } = await query;
    if (error) return res.status(500).json({ success: false, message: error.message });

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
