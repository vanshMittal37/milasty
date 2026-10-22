import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  CheckCircle2, Clock, MapPin, ShieldAlert, ArrowLeft, PackageCheck, AlertCircle,
  Copy, Check, MessageCircle, ChevronRight, Package, Truck, ShoppingBag, RefreshCw,
  Archive, Send, Star, XCircle, Navigation, Loader2, CalendarDays, Heart,
} from 'lucide-react';
import api from '../api/axios';
import OrderItemImage from '../components/OrderItemImage';
import { useAuth } from '../context/AuthContext';
import { formatDateTime, formatDateOnly, formatTimeOnly } from '../utils/orderDateTime';

// Note: text below uses divs with explicit sizes (not h1–h3/p) because global heading/paragraph
// font-size rules in index.css (some !important) would otherwise override them.

// ─── Order journey ──────────────────────────────────────────────────────────
const JOURNEY = [
  { title: 'Order Confirmed', icon: CheckCircle2, text: "We've received your order and confirmed your payment. Thank you for placing your trust in MILASTY." },
  { title: 'Preparing Your Order', icon: Archive, text: "We're preparing your order with care and getting everything ready for packing." },
  { title: 'Packed & Ready', icon: Package, text: 'Your order has been packed and is getting ready for dispatch.' },
  { title: 'Shipped', icon: Truck, text: 'Your parcel has been handed over to the courier. Your tracking details are available below.' },
  { title: 'In Transit', icon: Navigation, text: 'Your parcel is on its way. Follow the available courier updates to see its progress.' },
  { title: 'Out for Delivery', icon: Send, text: 'Your parcel is on its final stretch to you. Keep an eye out for your delivery.' },
  { title: 'Delivered', icon: Star, text: 'Your MILASTY order has arrived. We hope it brings a little joy to your day!' },
];
const SHIPPED_STEP = 3;

const normKey = (v) => String(v || '').trim().toLowerCase().replace(/\s+/g, '_');

/**
 * Journey step from the order status (set by admin / auto-transition) and the shipment status
 * (from the courier). Courier states can skip ahead or arrive out of order, so take the furthest
 * stage either source has reached rather than forcing a fixed sequence.
 */
function journeyIndex(orderStatus, shipmentStatus) {
  const o = normKey(orderStatus);
  const s = normKey(shipmentStatus);
  let idx = 0;
  if (o === 'processing') idx = 1;
  if (o === 'packed' || s === 'booked') idx = Math.max(idx, 2);
  if (o === 'shipped' || s === 'picked_up') idx = Math.max(idx, 3);
  if (s === 'in_transit') idx = Math.max(idx, 4);
  if (o === 'out_for_delivery' || s === 'out_for_delivery') idx = Math.max(idx, 5);
  if (o === 'delivered' || s === 'delivered') idx = 6;
  return idx;
}

// ─── Design tokens ──────────────────────────────────────────────────────────
const T = {
  surface: 'rgba(255, 255, 255, 0.82)',
  surfaceAlt: 'rgba(245, 237, 229, 0.70)',
  brand: '#5A2E16',
  brandGrad: 'linear-gradient(135deg, #5A2E16, #7C3D20)',
  accent: '#C68A3A',
  border: 'rgba(231, 222, 213, 0.65)',
  textPrimary: '#21150F',
  textSecondary: '#4A3B2E',
  textMuted: '#665A52',
  success: '#2E7D32',
  successBg: '#EDF7EE',
  successBorder: '#A5D6A7',
  warning: '#B7791F',
  warningBg: '#FEF9EC',
  danger: '#C62828',
  dangerBg: '#FEECEC',
  dangerBorder: '#EF9A9A',
  shadow: '0 4px 24px rgba(90, 46, 22, 0.07)',
};

const cardStyle = {
  backgroundColor: T.surface,
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: `1px solid ${T.border}`,
  borderRadius: '18px',
  boxShadow: T.shadow,
};

const eyebrowStyle = {
  fontSize: '0.66rem', textTransform: 'uppercase', letterSpacing: '0.14em', color: T.accent, fontWeight: 800,
};

const sectionHeadingStyle = {
  fontSize: '1.05rem', fontWeight: 900, color: T.textPrimary, fontFamily: 'var(--font-serif)', lineHeight: 1.3,
};

const bodyTextStyle = { fontSize: '0.86rem', color: T.textSecondary, lineHeight: 1.6 };

const primaryButtonStyle = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem',
  padding: '0.65rem 1.25rem', borderRadius: '999px', border: 'none', cursor: 'pointer',
  background: T.brandGrad, color: '#FFFFFF', fontSize: '0.84rem', fontWeight: 800, textDecoration: 'none',
};

const secondaryButtonStyle = {
  ...primaryButtonStyle,
  background: '#FFFFFF', color: T.brand, border: `1px solid ${T.border}`,
};

function SectionHeading({ children, icon: Icon }) {
  return (
    <div role="heading" aria-level={2} style={{ ...sectionHeadingStyle, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
      {Icon && <Icon size={17} color={T.accent} />}
      {children}
    </div>
  );
}

function Pill({ children, tone = 'neutral' }) {
  const tones = {
    neutral: { bg: '#F3EDE6', color: T.textSecondary },
    success: { bg: T.successBg, color: T.success },
    warning: { bg: T.warningBg, color: T.warning },
    danger: { bg: T.dangerBg, color: T.danger },
  };
  const t = tones[tone] || tones.neutral;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.28rem 0.8rem',
      borderRadius: '999px', fontSize: '0.76rem', fontWeight: 800, whiteSpace: 'nowrap',
      backgroundColor: t.bg, color: t.color,
    }}>
      {children}
    </span>
  );
}

// ─── Order journey (vertical timeline) ──────────────────────────────────────
function OrderJourney({ activeIdx }) {
  return (
    <div style={{ ...cardStyle, padding: '1.6rem 1.75rem', marginBottom: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.6rem', marginBottom: '1.25rem' }}>
        <div role="heading" aria-level={2} style={sectionHeadingStyle}>Your Order Journey</div>
        <Pill tone={activeIdx === JOURNEY.length - 1 ? 'success' : 'warning'}>
          You're here · {JOURNEY[activeIdx].title}
        </Pill>
      </div>

      <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {JOURNEY.map((step, i) => {
          const Icon = step.icon;
          const done = i < activeIdx;
          const current = i === activeIdx;
          const isLast = i === JOURNEY.length - 1;
          return (
            <li key={step.title} style={{ display: 'flex', gap: '0.9rem' }} aria-current={current ? 'step' : undefined}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: done ? T.brandGrad : current ? '#FFFFFF' : 'rgba(245, 237, 229, 0.6)',
                  border: done ? '2px solid #5A2E16' : current ? `2px solid ${T.accent}` : '2px solid rgba(231, 222, 213, 0.9)',
                  boxShadow: current ? '0 0 0 4px rgba(198, 138, 58, 0.16)' : 'none',
                }}>
                  {done
                    ? <Check size={15} color="#FFFFFF" strokeWidth={3} />
                    : <Icon size={15} color={current ? T.accent : 'rgba(150, 132, 120, 0.7)'} />}
                </div>
                {!isLast && (
                  <div style={{ width: '2px', flex: 1, minHeight: '18px', backgroundColor: done ? T.brand : 'rgba(231, 222, 213, 0.9)' }} />
                )}
              </div>
              <div style={{ paddingBottom: isLast ? 0 : '1rem', paddingTop: '0.3rem', minWidth: 0 }}>
                <div style={{
                  fontSize: '0.9rem', lineHeight: 1.3,
                  fontWeight: current ? 900 : done ? 800 : 600,
                  color: current ? T.accent : done ? T.textPrimary : 'rgba(120, 104, 94, 0.75)',
                }}>
                  {step.title}
                </div>
                {(done || current) && (
                  <div style={{ fontSize: '0.8rem', color: T.textMuted, lineHeight: 1.5, marginTop: '0.15rem' }}>{step.text}</div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// "Expected by" date — the courier's estimate once shipped, otherwise the order's own estimate
function formatEstimate(val) {
  if (!val) return null;
  const d = new Date(val);
  if (isNaN(d.getTime())) return String(val);
  return d.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function CustomerOrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState('');
  const [cancelOther, setCancelOther] = useState('');
  const [cancelQuote, setCancelQuote] = useState(null);   // server-calculated eligibility + refund preview
  const [cancelStep, setCancelStep] = useState('closed'); // 'closed' → 'form' → 'confirm'
  const [copyToast, setCopyToast] = useState(false);
  const [awbCopyToast, setAwbCopyToast] = useState(false);
  const [shipTracking, setShipTracking] = useState(null);
  const [trackLoading, setTrackLoading] = useState(false);
  const [showUpdates, setShowUpdates] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); }
    else { fetchOrderDetail(); }
  }, [id, isAuthenticated]);

  const fetchOrderDetail = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/orders/detail/${id}`);
      const fetchedOrder = res.data;
      setOrder(fetchedOrder);
      const st = String(fetchedOrder?.orderStatus || fetchedOrder?.status || '').toLowerCase();
      if (st !== 'cancelled' && st !== 'delivered') fetchCancelQuote();
      // Once dispatched, fetch courier tracking (this also refreshes the shipment status server-side)
      if (['shipped', 'out_for_delivery', 'out for delivery', 'delivered'].includes(st)) {
        fetchShipTracking(fetchedOrder?.id || fetchedOrder?._id || id);
      }
    } catch (e) { console.error('Error fetching order', e); }
    finally { setLoading(false); }
  };

  const fetchShipTracking = async (orderId) => {
    setTrackLoading(true);
    try {
      const res = await api.get(`/shiprat/order/${orderId}/tracking`);
      if (res.data?.success) setShipTracking(res.data);
    } catch (e) {
      console.warn('Tracking fetch notice:', e.message);
    } finally {
      setTrackLoading(false);
    }
  };

  // Eligibility and refund amount always come from the server (server clock, server prices)
  const fetchCancelQuote = async () => {
    try {
      const res = await api.get(`/orders/${id}/cancellation-quote`);
      setCancelQuote(res.data);
      return res.data;
    } catch {
      setCancelQuote(null);
      return null;
    }
  };

  const finalCancelReason = cancelReason === 'Other' ? cancelOther.trim() : cancelReason;

  const handleReviewCancellation = async (e) => {
    e.preventDefault();
    setCancelError('');
    if (finalCancelReason.length < 3) { setCancelError('Please tell us why you are cancelling.'); return; }
    const fresh = await fetchCancelQuote(); // refresh — the refund depends on the exact time
    if (fresh?.eligible) setCancelStep('confirm');
    else setCancelError(fresh?.message || 'This order can no longer be cancelled.');
  };

  const handleCancelOrder = async () => {
    if (cancelLoading) return; // guard against double clicks; the server is idempotent as well
    setCancelLoading(true);
    setCancelError('');
    try {
      await api.put(`/orders/${id}/cancel`, { reason: finalCancelReason });
      setCancelStep('closed');
      await fetchOrderDetail();
    } catch (err) {
      setCancelError(err.response?.data?.message || 'Error cancelling order');
      setCancelStep('form');
      fetchCancelQuote();
    } finally { setCancelLoading(false); }
  };

  const copyText = (text, setToast) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setToast(true);
    setTimeout(() => setToast(false), 2000);
  };

  // ── Loading state ──
  if (loading) {
    return (
      <div style={{ padding: '5rem 0', minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: T.brandGrad, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Package size={24} color="#FFFFFF" />
          </div>
          <div style={{ color: T.textMuted, fontSize: '0.92rem', fontWeight: 600 }}>Retrieving your order details...</div>
        </div>
      </div>
    );
  }

  // ── Not found ──
  if (!order) {
    return (
      <div style={{ padding: '4rem 0', textAlign: 'center', minHeight: '60vh' }}>
        <div style={{ maxWidth: '400px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.1rem' }}>
          <ShieldAlert size={48} color={T.danger} />
          <div style={{ color: T.textPrimary, fontSize: '1.4rem', fontWeight: 800 }}>Order Not Found</div>
          <div style={{ color: T.textMuted, fontSize: '0.92rem' }}>We couldn't retrieve this order. Please check the link.</div>
          <Link to="/account/orders" style={primaryButtonStyle}>Back to My Orders</Link>
        </div>
      </div>
    );
  }

  // ── Derived order state ──
  const createdAtMs = new Date(order.createdAt || order.created_at).getTime();
  const isOlderThan3Hours = !isNaN(createdAtMs) && (Date.now() - createdAtMs >= 3 * 3600 * 1000);

  // Show "Preparing" after 3 hours if the order is still marked Confirmed
  let orderStatus = order.orderStatus || order.status || order.order_status || 'Confirmed';
  if (isOlderThan3Hours && String(orderStatus).toLowerCase() === 'confirmed') orderStatus = 'Processing';

  const isCancelled = String(orderStatus).toLowerCase() === 'cancelled';
  const shipmentStatus = shipTracking?.shipment_status || order.shipment_status;
  const stepIdx = journeyIndex(orderStatus, shipmentStatus);
  const isDelivered = stepIdx === JOURNEY.length - 1;
  const isDispatched = stepIdx >= SHIPPED_STEP;
  const statusLabel = isCancelled ? 'Cancelled' : JOURNEY[stepIdx].title;

  const paymentStatus = String(order.paymentStatus || order.payment_status || '').toLowerCase();
  const isPaid = paymentStatus === 'paid';
  const isPaymentFailed = paymentStatus === 'failed';
  const paymentMethodRaw = String(order.paymentMethod || order.payment_method || '').toLowerCase();
  const isCod = paymentMethodRaw.includes('cod') || paymentMethodRaw.includes('cash');

  const orderRef = order.orderNumber || order.orderId;
  const supportLink = `/contact?order=${encodeURIComponent(orderRef || '')}`;

  const canCancel = !isCancelled && !isDelivered && !isOlderThan3Hours && Boolean(cancelQuote?.eligible);
  const cancelWindowClosed = !isCancelled && !isDelivered && (isOlderThan3Hours || cancelQuote?.code === 'WINDOW_CLOSED');
  const cancellation = order.cancellation || null;
  const inr = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: Number(v) % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;
  const REFUND_STATUS_TEXT = {
    pending: 'Refund initiated — it will be credited to your original payment method within 4–5 working days.',
    processing: 'Refund in progress — it should reach your original payment method within 4–5 working days.',
    successful: 'Refund completed.',
    failed: 'There was a problem with your refund. Our team will contact you.',
    needs_review: 'Your refund is being reviewed by our team.',
    not_applicable: 'No payment was collected for this order, so no refund is needed.',
  };

  const orderItems = order.order_items || order.items || [];
  const calculatedSubtotal = orderItems.reduce((s, i) => s + (Number(i.price || 0) * Number(i.quantity || 1)), 0);
  const subtotal = calculatedSubtotal > 0 ? calculatedSubtotal : Number(order.subtotal || 0);
  const deliveryFee = Number(order.deliveryFee ?? order.delivery_fee ?? 0);
  const discountAmount = Number(order.discountAmount || order.discount_amount || 0);
  const couponCode = order.couponCode || order.coupon_code || '';
  const grandTotal = Number(order.totalAmount || order.grandTotal || order.grand_total || (subtotal - discountAmount + deliveryFee));
  const transactionRef = !isCod ? (order.paymentId || order.payment_id || null) : null;

  const awb = order.awb_number || order.awb || shipTracking?.awb || null;
  const courierName = order.courier_name || shipTracking?.courier_name || null;
  const trackingEvents = shipTracking?.events || shipTracking?.tracking?.shipment_track || [];
  const estimateRaw = shipTracking?.estimated_delivery || shipTracking?.tracking?.estimated_delivery || order.estimatedDeliveryDate || order.estimated_delivery_date;
  const estimate = formatEstimate(estimateRaw);

  const deliveryAddr = order.deliveryAddress || order.shippingAddress || {};
  const hasAddress = typeof deliveryAddr === 'string' ? Boolean(deliveryAddr) : Boolean(deliveryAddr.fullName || deliveryAddr.addressLine);

  return (
    <div style={{ paddingBottom: '4rem' }}>
      <div style={{ maxWidth: '920px', margin: '0 auto' }}>

        {/* ── 1. PAGE HEADING ── */}
        <div style={{ marginBottom: '1.5rem' }}>
          <Link to="/account/orders" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', fontWeight: 700, color: T.brand, textDecoration: 'none', marginBottom: '1.1rem' }}>
            <ArrowLeft size={15} /> Back to My Orders
          </Link>
          <div style={eyebrowStyle}>Your MILASTY Order</div>
          <div role="heading" aria-level={1} style={{ fontSize: 'clamp(1.6rem, 4vw, 2.1rem)', fontWeight: 900, color: T.textPrimary, fontFamily: 'var(--font-serif)', lineHeight: 1.2, margin: '0.3rem 0 0.5rem' }}>
            Your order, made with care.
          </div>
          <div style={{ ...bodyTextStyle, maxWidth: '620px' }}>
            Every order is a little moment of joy. Find your order details, follow its journey, and see what's next—all in one place.
          </div>
        </div>

        {/* ── 2. ORDER CONFIRMATION CARD ── */}
        <div style={{ ...cardStyle, padding: '1.6rem 1.75rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={eyebrowStyle}>Order Details</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                <div style={{ fontSize: '1.35rem', fontWeight: 900, color: T.textPrimary }}>#{orderRef}</div>
                <button
                  type="button"
                  onClick={() => copyText(orderRef, setCopyToast)}
                  style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: '8px', padding: '0.25rem 0.6rem', cursor: 'pointer', color: T.textMuted, display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.73rem', fontWeight: 700 }}
                >
                  {copyToast ? <><Check size={12} color={T.success} /> Copied!</> : <><Copy size={12} /> Copy</>}
                </button>
              </div>
              <div style={{ fontSize: '0.84rem', color: T.textSecondary, marginTop: '0.4rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Clock size={14} color={T.accent} />
                Order placed: {formatDateOnly(order.createdAt)} · {formatTimeOnly(order.createdAt)}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.45rem' }}>
              <Pill tone={isCancelled ? 'danger' : isDelivered ? 'success' : 'warning'}>Status: {statusLabel}</Pill>
              {isPaid ? (
                <Pill tone="success">Payment successful ✓</Pill>
              ) : isPaymentFailed ? (
                <Pill tone="danger">Payment failed ✕</Pill>
              ) : isCod ? (
                <Pill>Pay on delivery</Pill>
              ) : (
                <Pill tone="warning">Payment pending</Pill>
              )}
            </div>
          </div>

          {/* Shown only once the order exists and payment is verified (or a confirmed COD order) */}
          {!isCancelled && (isPaid || isCod) && (
            <div style={{ marginTop: '1.15rem', padding: '0.9rem 1.1rem', borderRadius: '12px', backgroundColor: 'rgba(237, 247, 238, 0.7)', border: `1px solid ${T.successBorder}`, display: 'flex', gap: '0.65rem', alignItems: 'flex-start' }}>
              <Heart size={17} color={T.success} style={{ flexShrink: 0, marginTop: '0.15rem' }} />
              <div style={{ fontSize: '0.86rem', color: T.textPrimary, lineHeight: 1.55, fontWeight: 600 }}>
                Thank you for choosing MILASTY. Your order is confirmed, and we're looking forward to bringing a little more goodness to your day.
              </div>
            </div>
          )}
        </div>

        {/* ── CANCELLED ORDER ── */}
        {isCancelled && (
          <div style={{ ...cardStyle, padding: '1.5rem', marginBottom: '1.25rem', backgroundColor: T.dangerBg, border: `1px solid ${T.dangerBorder}` }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
              <XCircle size={22} color={T.danger} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '1rem', fontWeight: 900, color: T.danger }}>Order Cancelled</div>
                <div style={{ fontSize: '0.78rem', color: T.textMuted, marginTop: '0.2rem' }}>
                  Cancelled at: <strong>{cancellation?.requestedAt ? formatDateTime(cancellation.requestedAt) : (order.cancelledAt ? formatDateTime(order.cancelledAt) : 'Recorded')}</strong>
                </div>

                {(cancellation?.reason || order.cancelReason) && (
                  <div style={{ fontSize: '0.84rem', color: T.textSecondary, marginTop: '0.5rem', backgroundColor: 'rgba(255,255,255,0.7)', padding: '0.4rem 0.75rem', borderRadius: '6px', borderLeft: `3px solid ${T.danger}` }}>
                    <strong>Reason:</strong> {cancellation?.reason || order.cancelReason}
                  </div>
                )}

                {cancellation && (
                  <div style={{ marginTop: '0.85rem', fontSize: '0.84rem', color: T.textPrimary, lineHeight: 1.6 }}>
                    {cancellation.refundStatus !== 'not_applicable' ? (
                      <div style={{ background: '#FFFFFF', padding: '0.85rem 1rem', borderRadius: '10px', border: `1px solid ${T.border}`, marginBottom: '0.65rem' }}>
                        <div style={{ fontWeight: 800, color: T.brand, marginBottom: '0.4rem', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Refund &amp; Cancellation Charge Breakdown
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.5rem 1rem', fontSize: '0.82rem' }}>
                          <div>Original Amount Paid: <strong>{inr(cancellation.amountPaid)}</strong></div>
                          <div style={{ color: T.danger }}>10% Cancellation Charge: <strong>−{inr(cancellation.cancellationCharge ?? (cancellation.amountPaid * 0.1))}</strong></div>
                          <div style={{ color: T.success, fontWeight: 800 }}>Eligible Refund: <strong>{inr(cancellation.refundAmount)}</strong></div>
                        </div>
                      </div>
                    ) : (
                      <div style={{ background: '#FFFFFF', padding: '0.65rem 0.85rem', borderRadius: '8px', border: `1px solid ${T.border}`, marginBottom: '0.5rem', fontSize: '0.8rem', color: T.textMuted }}>
                        Cash on Delivery order — no upfront payment was collected, so no cancellation charge or refund applies.
                      </div>
                    )}
                    <div style={{ fontWeight: 700, marginTop: '0.35rem' }}>
                      {REFUND_STATUS_TEXT[cancellation.refundStatus] || 'Refund status is being updated.'}
                    </div>
                    {cancellation.refundStatus === 'successful' && (
                      <div style={{ color: T.textMuted, fontSize: '0.78rem', marginTop: '0.25rem' }}>
                        {cancellation.refundProcessedAt && <>Processed on <strong>{formatDateTime(cancellation.refundProcessedAt)}</strong> · </>}
                        Refund Reference ID: <code>{cancellation.refundReference}</code>. Banks typically reflect credits within 5–7 working days.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── 3. ORDER JOURNEY ── */}
        {!isCancelled && <OrderJourney activeIdx={stepIdx} />}

        {/* ── 4. SHIPMENT CARD ── */}
        {!isCancelled && (
          <div style={{ ...cardStyle, padding: '1.6rem 1.75rem', marginBottom: '1.25rem', border: '1.5px solid rgba(198,138,58,0.3)' }}>
            {!isDispatched ? (
              <>
                <div style={eyebrowStyle}>Shipment Updates</div>
                <div role="heading" aria-level={2} style={{ ...sectionHeadingStyle, margin: '0.3rem 0 0.5rem' }}>Your order is being prepared.</div>
                <div style={bodyTextStyle}>
                  We're getting your MILASTY order ready for its journey to you. Tracking details will appear here once your parcel has been dispatched and the courier information is available.
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                  <Pill tone="warning"><Clock size={12} /> Awaiting dispatch</Pill>
                  <div style={{ fontSize: '0.78rem', color: T.textMuted }}>We'll keep your order details updated as it moves to the next stage.</div>
                </div>
              </>
            ) : (
              <>
                <div style={eyebrowStyle}>Your Shipment</div>
                <div role="heading" aria-level={2} style={{ ...sectionHeadingStyle, margin: '0.3rem 0 0.5rem' }}>
                  {isDelivered ? 'Your order has been delivered!' : 'Your order is on its way!'}
                </div>
                <div style={bodyTextStyle}>
                  {isDelivered
                    ? 'Your parcel has reached you. You can still view the courier updates for this order below.'
                    : 'Your parcel has been dispatched and is on its journey to you. Use the tracking link below to check the latest available courier updates.'}
                </div>

                {(courierName || awb) && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginTop: '1rem' }}>
                    {courierName && (
                      <div style={{ padding: '0.75rem 0.95rem', borderRadius: '12px', backgroundColor: T.surfaceAlt, border: `1px solid ${T.border}` }}>
                        <div style={{ ...eyebrowStyle, fontSize: '0.6rem' }}>Courier</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 800, color: T.textPrimary, marginTop: '0.15rem' }}>{courierName}</div>
                      </div>
                    )}
                    {awb && (
                      <div style={{ padding: '0.75rem 0.95rem', borderRadius: '12px', backgroundColor: T.surfaceAlt, border: `1px solid ${T.border}` }}>
                        <div style={{ ...eyebrowStyle, fontSize: '0.6rem' }}>Tracking ID</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.15rem' }}>
                          <code style={{ fontSize: '0.9rem', fontWeight: 800, color: T.textPrimary, letterSpacing: '0.03em' }}>{awb}</code>
                          <button
                            type="button"
                            onClick={() => copyText(awb, setAwbCopyToast)}
                            aria-label="Copy tracking ID"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.accent, display: 'inline-flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.72rem', fontWeight: 700, padding: 0 }}
                          >
                            {awbCopyToast ? <><Check size={12} color={T.success} /> Copied</> : <><Copy size={12} /> Copy</>}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Tracking is only offered once a courier tracking ID exists */}
                {awb && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowUpdates(true);
                      fetchShipTracking(order.id || order._id || id);
                    }}
                    disabled={trackLoading}
                    style={{ ...primaryButtonStyle, marginTop: '1.1rem', cursor: trackLoading ? 'wait' : 'pointer' }}
                  >
                    {trackLoading ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Truck size={15} />}
                    {trackLoading ? 'Checking latest updates…' : 'Track My Order'}
                  </button>
                )}

                {awb && showUpdates && !trackLoading && (
                  <div style={{ marginTop: '1.1rem', borderTop: `1px solid ${T.border}`, paddingTop: '1rem' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 800, color: T.textSecondary, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.6rem' }}>
                      Latest courier updates
                    </div>
                    {trackingEvents.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {trackingEvents.map((ev, i) => (
                          <div key={i} style={{
                            display: 'flex', gap: '0.65rem', padding: '0.65rem 0.85rem', borderRadius: '10px',
                            backgroundColor: i === 0 ? '#FFFFFF' : 'rgba(255,255,255,0.5)',
                            border: `1px solid ${i === 0 ? 'rgba(198,138,58,0.3)' : 'rgba(231,222,213,0.5)'}`,
                          }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: i === 0 ? T.success : T.accent, marginTop: '0.4rem', flexShrink: 0 }} />
                            <div>
                              <div style={{ fontSize: '0.85rem', fontWeight: i === 0 ? 800 : 700, color: T.textPrimary }}>{ev.activity || ev.status || 'Courier update'}</div>
                              <div style={{ fontSize: '0.75rem', color: T.textMuted, marginTop: '0.1rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                {ev.location && <span style={{ fontSize: '0.75rem' }}>📍 {ev.location}</span>}
                                {ev.date && <span style={{ fontSize: '0.75rem' }}>🕒 {new Date(ev.date).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.82rem', color: T.textMuted }}>
                        Your parcel is with the courier. The first scan update will appear here shortly.
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* ── MAIN GRID ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 290px', gap: '1.25rem', alignItems: 'start' }} className="order-detail-grid">

          {/* LEFT */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* ── 5. ORDER ITEMS ── */}
            <div style={{ ...cardStyle, padding: '1.5rem' }}>
              <SectionHeading icon={ShoppingBag}>What's in Your Order</SectionHeading>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {orderItems.map((item, idx) => {
                  const itemTitle = item.title || item.product_title || 'Millet Product';
                  const packSize = item.variantName || item.variant_name;
                  const qty = item.quantity || 1;
                  const unitPrice = Number(item.price || 0);
                  const customNote = item.customization_note || item.customizationNote;
                  return (
                    <div key={idx} style={{
                      display: 'flex', gap: '1rem', alignItems: 'flex-start',
                      paddingBottom: idx < orderItems.length - 1 ? '1rem' : 0,
                      borderBottom: idx < orderItems.length - 1 ? `1px solid ${T.border}` : 'none',
                    }}>
                      <OrderItemImage item={item} size={64} radius={12} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.92rem', fontWeight: 800, color: T.textPrimary }}>{itemTitle}</div>
                        {packSize && packSize !== 'default' && (
                          <div style={{ fontSize: '0.76rem', color: T.accent, fontWeight: 700, marginTop: '0.1rem' }}>{packSize}</div>
                        )}
                        <div style={{ fontSize: '0.8rem', color: T.textMuted, marginTop: '0.25rem' }}>Quantity: {qty}</div>
                        <div style={{ fontSize: '0.82rem', color: T.textSecondary, marginTop: '0.1rem' }}>
                          {inr(unitPrice)} × {qty} = <strong style={{ color: T.textPrimary }}>{inr(unitPrice * qty)}</strong>
                        </div>
                        {customNote && (
                          <div style={{ fontSize: '0.75rem', color: T.textMuted, marginTop: '0.35rem', padding: '0.35rem 0.65rem', backgroundColor: T.surfaceAlt, borderRadius: '6px', borderLeft: `3px solid ${T.accent}` }}>
                            ✦ Note: {customNote}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ marginTop: '1.1rem', paddingTop: '0.9rem', borderTop: `1px dashed ${T.border}`, fontSize: '0.82rem', color: T.textMuted, fontStyle: 'italic', textAlign: 'center' }}>
                A little something chosen by you, prepared with care by MILASTY.
              </div>
            </div>

            {/* Delivery address (API sends shipping_address as a string; older data may be an object) */}
            {hasAddress && (
              <div style={{ ...cardStyle, padding: '1.5rem' }}>
                <SectionHeading icon={MapPin}>Delivery Address</SectionHeading>
                {order.recipient_name && (
                  <div style={{ display: 'inline-block', fontSize: '0.72rem', fontWeight: 800, color: '#2F6B3A', backgroundColor: '#EAEFE5', padding: '0.2rem 0.6rem', borderRadius: '6px', marginBottom: '0.6rem' }}>
                    🎁 Delivering to someone else
                  </div>
                )}
                <div style={{ fontSize: '0.88rem', color: T.textSecondary, lineHeight: 1.7, fontWeight: 500 }}>
                  <div style={{ fontWeight: 700, color: T.textPrimary }}>{order.recipient_name || deliveryAddr.fullName || order.customerName}</div>
                  {typeof deliveryAddr === 'string' ? (
                    <div>{deliveryAddr}{order.pincode ? ` - ${order.pincode}` : ''}</div>
                  ) : (
                    <>
                      {deliveryAddr.building && <div>{deliveryAddr.building}</div>}
                      {deliveryAddr.addressLine && <div>{deliveryAddr.addressLine}</div>}
                      <div>{[deliveryAddr.city, deliveryAddr.state, deliveryAddr.pincode].filter(Boolean).join(', ')}</div>
                    </>
                  )}
                  {(order.recipient_phone || deliveryAddr.phone || order.customerPhone) && (
                    <div style={{ color: T.textMuted, marginTop: '0.25rem' }}>📞 {order.recipient_phone || deliveryAddr.phone || order.customerPhone}</div>
                  )}
                </div>
              </div>
            )}

            {/* ── 6. CANCELLATION ── */}
            {cancelWindowClosed && (
              <div style={{ ...cardStyle, padding: '1.5rem', backgroundColor: '#FFFDF9' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <AlertCircle size={20} color={T.warning} style={{ flexShrink: 0, marginTop: '0.15rem' }} />
                  <div>
                    <div role="heading" aria-level={2} style={{ ...sectionHeadingStyle, fontSize: '0.98rem', marginBottom: '0.4rem' }}>Your cancellation window has closed.</div>
                    <div style={bodyTextStyle}>
                      The 3-hour cancellation period for this order has passed, so online cancellation is no longer available.
                    </div>
                    <div style={{ ...bodyTextStyle, marginTop: '0.4rem' }}>
                      Need assistance? Please reach out to our support team. We'll help you understand the options available for your order.
                    </div>
                    <Link to={supportLink} style={{ ...secondaryButtonStyle, marginTop: '0.9rem' }}>
                      <MessageCircle size={15} /> Contact Support
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {canCancel && (
              <div style={{ ...cardStyle, padding: '1.5rem' }}>
                <div role="heading" aria-level={2} style={{ ...sectionHeadingStyle, fontSize: '0.98rem', marginBottom: '0.4rem' }}>Need to make a change?</div>
                <div style={bodyTextStyle}>
                  You can request cancellation within the applicable cancellation window. Please review your order details before proceeding.
                </div>

                {cancelStep === 'closed' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => { setCancelStep('form'); setCancelError(''); }}
                      style={{ ...secondaryButtonStyle, marginTop: '0.9rem', color: T.danger, borderColor: T.dangerBorder }}
                    >
                      Cancel Order
                    </button>
                    <div style={{ fontSize: '0.78rem', color: T.textMuted, marginTop: '0.75rem' }}>
                      Changed your mind or need help? <Link to={supportLink} style={{ color: T.brand, fontWeight: 700 }}>Contact our support team.</Link>
                    </div>
                  </>
                ) : (
                  <div style={{ marginTop: '1rem', padding: '1.1rem', borderRadius: '12px', border: `1px solid ${T.dangerBorder}`, backgroundColor: 'rgba(254,236,236,0.35)' }}>
                    {/* Applicable policy */}
                    <div style={{ fontSize: '0.82rem', color: T.textSecondary, lineHeight: 1.6, marginBottom: '0.85rem' }}>
                      <div style={{ fontWeight: 800, color: T.textPrimary, marginBottom: '0.2rem' }}>Cancellation &amp; Refund Policy</div>
                      <div>• Orders can be cancelled only within <strong>3 hours</strong> of order placement.</div>
                      <div>• A <strong>10% cancellation charge</strong> applies to the product amount only.</div>
                      <div>• Delivery charges are excluded from the cancellation charge and refunded where applicable.</div>
                    </div>

                    {/* Live server quote */}
                    <div style={{ padding: '0.85rem 1rem', borderRadius: '10px', backgroundColor: '#FFFFFF', border: `1px solid ${T.border}`, fontSize: '0.84rem', color: T.textPrimary, marginBottom: '0.95rem', lineHeight: 1.6 }}>
                      {cancelQuote.prepaid ? (
                        <>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: T.textMuted, fontSize: '0.84rem' }}>Amount Paid</span><strong>{inr(cancelQuote.amountPaid)}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: T.danger }}>
                            <span style={{ fontSize: '0.84rem' }}>10% Cancellation Charge (products only)</span><strong>−{inr(cancelQuote.cancellationCharge)}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: T.success, fontWeight: 800, borderTop: `1px solid ${T.border}`, paddingTop: '0.35rem', marginTop: '0.35rem' }}>
                            <span style={{ fontSize: '0.84rem' }}>Eligible Refund</span><strong>{inr(cancelQuote.refundAmount)}</strong>
                          </div>
                        </>
                      ) : (
                        <div style={{ color: T.textSecondary }}>
                          This is a <strong>Cash on Delivery</strong> order. No payment was collected, so no refund or cancellation charge applies.
                        </div>
                      )}
                      {cancelQuote.expiresAt && (
                        <div style={{ fontSize: '0.74rem', color: T.textMuted, marginTop: '0.45rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Clock size={12} /> Cancellation window closes at <strong>{formatDateTime(cancelQuote.expiresAt)}</strong>
                        </div>
                      )}
                    </div>

                    {cancelStep === 'form' ? (
                      <form onSubmit={handleReviewCancellation} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 700, color: T.textPrimary }}>Please select a cancellation reason:</label>
                        <select
                          value={cancelReason}
                          onChange={(e) => setCancelReason(e.target.value)}
                          required
                          style={{ width: '100%', height: '44px', padding: '0 1rem', borderRadius: '10px', border: '1px solid rgba(231,222,213,0.8)', fontSize: '0.88rem', color: T.textPrimary, backgroundColor: '#FFFFFF', outline: 'none', boxSizing: 'border-box' }}
                        >
                          <option value="">Select a reason...</option>
                          {['Changed my mind', 'Ordered by mistake', 'Found a better price', 'Delivery time too long', 'Other'].map((r) => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                        {cancelReason === 'Other' && (
                          <textarea
                            value={cancelOther}
                            onChange={(e) => setCancelOther(e.target.value)}
                            maxLength={500}
                            rows={3}
                            placeholder="Tell us why you are cancelling..."
                            style={{ width: '100%', padding: '0.65rem 1rem', borderRadius: '10px', border: '1px solid rgba(231,222,213,0.8)', fontSize: '0.88rem', color: T.textPrimary, backgroundColor: '#FFFFFF', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical' }}
                          />
                        )}
                        {cancelError && <div style={{ fontSize: '0.8rem', color: T.danger }}>{cancelError}</div>}
                        <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                          <button type="button" onClick={() => setCancelStep('closed')} style={secondaryButtonStyle}>Keep Order</button>
                          <button
                            type="submit"
                            disabled={!cancelReason || (cancelReason === 'Other' && cancelOther.trim().length < 3)}
                            style={{ ...primaryButtonStyle, background: T.danger, opacity: !cancelReason ? 0.6 : 1 }}
                          >
                            Review Cancellation
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div style={{ fontSize: '1rem', fontWeight: 900, color: T.danger, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <AlertCircle size={18} /> Cancel this order?
                        </div>
                        <div style={{ fontSize: '0.86rem', color: T.textPrimary, lineHeight: 1.6 }}>
                          {cancelQuote.prepaid
                            ? `You'll receive ${inr(cancelQuote.refundAmount)} back to your original payment method within 4–5 working days.`
                            : 'Your order will be cancelled. No payment was collected, so nothing needs to be refunded.'}
                        </div>
                        {cancelError && <div style={{ fontSize: '0.82rem', color: T.danger }}>{cancelError}</div>}
                        <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                          <button type="button" onClick={() => setCancelStep('form')} disabled={cancelLoading} style={secondaryButtonStyle}>Keep Order</button>
                          <button
                            type="button"
                            onClick={handleCancelOrder}
                            disabled={cancelLoading}
                            style={{ ...primaryButtonStyle, background: T.danger, cursor: cancelLoading ? 'wait' : 'pointer', opacity: cancelLoading ? 0.65 : 1 }}
                          >
                            {cancelLoading ? <><RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> Cancelling...</> : 'Confirm & Cancel Order'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* RIGHT */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* ── 7. PAYMENT SUMMARY ── */}
            <div style={{ ...cardStyle, padding: '1.4rem' }}>
              <SectionHeading>Payment Summary</SectionHeading>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.86rem', color: T.textSecondary }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.86rem' }}>Items subtotal</span>
                  <span style={{ fontSize: '0.86rem', fontWeight: 700, color: T.textPrimary }}>{inr(subtotal)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.86rem' }}>Delivery fee</span>
                  <span style={{ fontSize: '0.86rem', fontWeight: 700, color: deliveryFee === 0 ? T.success : T.textPrimary }}>
                    {deliveryFee === 0 ? 'FREE' : inr(deliveryFee)}
                  </span>
                </div>
                {discountAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: T.success }}>
                    <span style={{ fontSize: '0.86rem' }}>Discount{couponCode ? ` (${couponCode})` : ''}</span>
                    <span style={{ fontSize: '0.86rem', fontWeight: 700 }}>−{inr(discountAmount)}</span>
                  </div>
                )}
                <div style={{ height: '1px', backgroundColor: T.border, margin: '0.25rem 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900 }}>
                  <span style={{ fontSize: '1rem', color: T.textPrimary }}>{isPaid ? 'Total Paid' : 'Order Total'}</span>
                  <span style={{ fontSize: '1.05rem', color: T.brand }}>{inr(grandTotal)}</span>
                </div>
                <div style={{ fontSize: '0.72rem', color: T.textMuted }}>Prices include all applicable taxes.</div>

                <div style={{ marginTop: '0.4rem', padding: '0.75rem 0.85rem', borderRadius: '10px', backgroundColor: T.surfaceAlt, display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.8rem', color: T.textMuted }}>Payment status</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: isPaid ? T.success : isPaymentFailed ? T.danger : T.warning }}>
                      {isPaid ? 'Payment successful' : isPaymentFailed ? 'Payment failed' : isCod ? 'Pay on delivery' : 'Payment pending'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.8rem', color: T.textMuted }}>Payment method</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: T.textPrimary }}>{order.paymentMethod || '—'}</span>
                  </div>
                  {transactionRef && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.8rem', color: T.textMuted, flexShrink: 0 }}>Transaction ref.</span>
                      <code style={{ fontSize: '0.74rem', color: T.textPrimary, overflowWrap: 'anywhere', textAlign: 'right' }}>{transactionRef}</code>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── 8. DELIVERY ESTIMATE ── */}
            {!isCancelled && !isDelivered && (
              <div style={{ ...cardStyle, padding: '1.4rem', backgroundColor: 'rgba(237,247,238,0.6)', border: `1px solid ${T.successBorder}` }}>
                <div style={{ ...eyebrowStyle, color: T.success, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <CalendarDays size={13} /> Your Delivery Estimate
                </div>
                <div role="heading" aria-level={2} style={{ ...sectionHeadingStyle, margin: '0.35rem 0 0.4rem', color: T.success }}>
                  {estimate ? `Expected by ${estimate}` : 'Delivery estimate coming soon'}
                </div>
                <div style={{ fontSize: '0.8rem', color: T.textSecondary, lineHeight: 1.55 }}>
                  {estimate
                    ? "Your order is expected to arrive by this date. We'll update your shipment details when tracking becomes available."
                    : "We're confirming the delivery timeline for your order. Please check back here for updates, or contact us if you need assistance."}
                </div>
              </div>
            )}

            {/* ── 9. NEED HELP ── */}
            <div style={{ ...cardStyle, padding: '1.4rem' }}>
              <div role="heading" aria-level={2} style={{ ...sectionHeadingStyle, marginBottom: '0.3rem' }}>We're Here for You.</div>
              <div style={{ fontSize: '0.8rem', color: T.textMuted, lineHeight: 1.5, marginBottom: '0.9rem' }}>
                Questions about your order, payment, or delivery? We're happy to help.
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                {[
                  { label: 'Contact Support', desc: 'Get assistance with your order. Share your order number so we can help you faster.', icon: MessageCircle, path: supportLink },
                  { label: 'All My Orders', desc: 'View your previous purchases and check the status of your other orders.', icon: ShoppingBag, path: '/account/orders' },
                  { label: 'My Account', desc: 'Manage your account details and saved information.', icon: PackageCheck, path: '/account' },
                ].map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link key={link.label} to={link.path} style={{
                      display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.7rem 0.8rem', borderRadius: '12px',
                      border: `1px solid ${T.border}`, textDecoration: 'none', backgroundColor: 'rgba(245, 237, 229, 0.4)',
                    }}>
                      <Icon size={16} color={T.brand} style={{ flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.84rem', fontWeight: 800, color: T.brand }}>{link.label}</div>
                        <div style={{ fontSize: '0.72rem', color: T.textMuted, lineHeight: 1.4 }}>{link.desc}</div>
                      </div>
                      <ChevronRight size={14} color={T.brand} style={{ flexShrink: 0 }} />
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── 10. BRAND SIGN-OFF ── */}
        <div style={{ textAlign: 'center', marginTop: '2.5rem', padding: '2rem 1rem', borderTop: `1px solid ${T.border}` }}>
          <div style={{ fontSize: '1.15rem', fontWeight: 900, color: T.textPrimary, fontFamily: 'var(--font-serif)' }}>Thank you for choosing MILASTY.</div>
          <div style={{ fontSize: '0.86rem', color: T.textMuted, lineHeight: 1.6, maxWidth: '520px', margin: '0.45rem auto 0' }}>
            We believe everyday treats should feel a little more special. Thank you for letting us be part of your day.
          </div>
          <div style={{ marginTop: '1.25rem', fontSize: '1rem', fontWeight: 900, letterSpacing: '0.2em', color: T.brand }}>MILASTY</div>
          <div style={{ fontSize: '0.78rem', color: T.accent, fontStyle: 'italic', marginTop: '0.2rem' }}>Where millets meet great taste.</div>
        </div>

        <style>{`
          @media (max-width: 760px) {
            .order-detail-grid { grid-template-columns: 1fr !important; }
          }
        `}</style>
      </div>
    </div>
  );
}
