import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  CheckCircle2, Clock, MapPin, ShieldAlert, ArrowLeft, PackageCheck, AlertCircle,
  Copy, Check, MessageCircle, ChevronRight, Package, Truck, ShoppingBag, RefreshCw,
  ClipboardList, Archive, Send, Star, XCircle, Navigation, ExternalLink, Loader2
} from 'lucide-react';
import api from '../api/axios';
import OrderItemImage from '../components/OrderItemImage';
import { useAuth } from '../context/AuthContext';
import { formatDateTime, calculateEstimatedDeliveryDate, formatInr } from '../utils/orderDateTime';

// ─── Status stages (canonical order) ───────────────────────────────────────
const STATUS_STAGES = [
  'Pending', 'Confirmed', 'Processing', 'Packed',
  'Shipped', 'Out for Delivery', 'Delivered',
];

// Icon for each stage
const STAGE_ICONS = [Clock, CheckCircle2, Archive, Package, Truck, Send, Star];

// Normalise incoming status string to canonical form
function normaliseStatus(raw) {
  const s = String(raw || '').trim().toLowerCase();
  const found = STATUS_STAGES.find(
    (st) => st.toLowerCase() === s || st.toLowerCase().replace(/\s+/g, '') === s.replace(/\s+/g, '')
  );
  return found || raw || 'Pending';
}

// Customer-facing shipment status labels (the server never sends internal failure states)
const SHIPMENT_LABELS = {
  processing: 'Processing',
  booked: 'Booked',
  picked_up: 'Picked Up',
  in_transit: 'In Transit',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
};

// ─── Design tokens ──────────────────────────────────────────────────────────
const T = {
  surface:       'rgba(255, 255, 255, 0.82)',
  surfaceAlt:    'rgba(245, 237, 229, 0.70)',
  brand:         '#5A2E16',
  brandGrad:     'linear-gradient(135deg, #5A2E16, #7C3D20)',
  accent:        '#C68A3A',
  border:        'rgba(231, 222, 213, 0.65)',
  textPrimary:   '#21150F',
  textSecondary: '#4A3B2E',
  textMuted:     '#665A52',
  success:       '#2E7D32',
  successBg:     '#EDF7EE',
  successBorder: '#A5D6A7',
  warning:       '#B7791F',
  warningBg:     '#FEF9EC',
  danger:        '#C62828',
  dangerBg:      '#FEECEC',
  dangerBorder:  '#EF9A9A',
  info:          '#1565C0',
  infoBg:        '#EAF2FF',
  shadow:        '0 4px 24px rgba(90, 46, 22, 0.07)',
  shadowMd:      '0 8px 32px rgba(90, 46, 22, 0.10)',
};

const cardStyle = {
  backgroundColor: T.surface,
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: `1px solid ${T.border}`,
  borderRadius: '18px',
  boxShadow: T.shadow,
};

// ─── Status badge ───────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const s = String(status || 'Confirmed');
  const map = {
    Pending:             { bg: T.warningBg,  color: T.warning,  dot: '#F59E0B' },
    Confirmed:           { bg: T.infoBg,     color: T.info,     dot: '#3B82F6' },
    Processing:          { bg: '#F3E8FF',    color: '#6B21A8',  dot: '#A855F7' },
    Packed:              { bg: '#F3E8FF',    color: '#6B21A8',  dot: '#A855F7' },
    Shipped:             { bg: '#FEF9EC',    color: T.accent,   dot: T.accent  },
    'Out for Delivery':  { bg: '#FEF9EC',    color: T.accent,   dot: T.accent  },
    Delivered:           { bg: T.successBg,  color: T.success,  dot: '#22C55E' },
    Cancelled:           { bg: T.dangerBg,   color: T.danger,   dot: '#EF4444' },
  };
  const st = map[s] || { bg: '#F3F4F6', color: '#665A52', dot: '#D1D5DB' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
      padding: '0.3rem 0.85rem', borderRadius: '999px',
      fontSize: '0.78rem', fontWeight: '700',
      backgroundColor: st.bg, color: st.color,
      whiteSpace: 'nowrap',
    }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: st.dot, flexShrink: 0 }} />
      {s}
    </span>
  );
}

// ─── Order Progress Tracker ─────────────────────────────────────────────────
function OrderProgressTracker({ currentStatus }) {
  const normStatus = normaliseStatus(currentStatus);
  const currentIdx = STATUS_STAGES.indexOf(normStatus);
  // fallback: if still -1 treat as index 0
  const activeIdx = currentIdx === -1 ? 0 : currentIdx;
  const isCancelled = String(currentStatus).toLowerCase() === 'cancelled';

  if (isCancelled) return null;

  return (
    <div style={{ ...cardStyle, padding: '1.75rem 2rem', marginBottom: '1.25rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h3 style={{
          fontSize: '0.78rem', fontWeight: '900', color: T.textPrimary,
          margin: 0, textTransform: 'uppercase', letterSpacing: '0.1em',
          display: 'flex', alignItems: 'center', gap: '0.5rem',
        }}>
          <span style={{ display: 'inline-block', width: '3px', height: '14px', borderRadius: '2px', backgroundColor: T.accent }} />
          Order Progress
        </h3>
        <StatusBadge status={normStatus} />
      </div>

      {/* Steps */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', overflowX: 'auto', paddingBottom: '0.5rem' }}>

        {STATUS_STAGES.map((stage, i) => {
          const StageIcon = STAGE_ICONS[i];
          const isCompleted = i < activeIdx;
          const isCurrent = i === activeIdx;
          const isUpcoming = i > activeIdx;
          const isLast = i === STATUS_STAGES.length - 1;

          // Connector line fills
          const connectorFilled = i < activeIdx;
          const connectorPartial = i === activeIdx;

          return (
            <React.Fragment key={stage}>
              {/* Step */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '72px', position: 'relative', zIndex: 1 }}>

                {/* Circle */}
                <div style={{
                  width: '40px', height: '40px', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                  background: isCompleted
                    ? T.brandGrad
                    : isCurrent
                    ? 'rgba(255,255,255,0.95)'
                    : 'rgba(245, 237, 229, 0.6)',
                  border: isCompleted
                    ? '2.5px solid #5A2E16'
                    : isCurrent
                    ? `2.5px solid ${T.accent}`
                    : `2px solid rgba(231, 222, 213, 0.8)`,
                  boxShadow: isCurrent
                    ? `0 0 0 5px rgba(198, 138, 58, 0.18), 0 4px 16px rgba(198,138,58,0.2)`
                    : isCompleted
                    ? '0 4px 12px rgba(90, 46, 22, 0.2)'
                    : 'none',
                  transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                  animation: isCurrent ? 'progress-pulse 2s ease-in-out infinite' : 'none',
                }}>
                  {isCompleted ? (
                    <Check size={16} color="#FFFFFF" strokeWidth={3} />
                  ) : (
                    <StageIcon
                      size={16}
                      color={isCurrent ? T.accent : 'rgba(176, 160, 154, 0.7)'}
                      strokeWidth={isCurrent ? 2.5 : 1.8}
                    />
                  )}
                </div>

                {/* Label */}
                <span style={{
                  fontSize: '0.6rem',
                  textAlign: 'center',
                  lineHeight: '1.25',
                  fontWeight: isCurrent ? '800' : isCompleted ? '700' : '500',
                  color: isCompleted ? T.brand : isCurrent ? T.accent : 'rgba(176,160,154,0.8)',
                  whiteSpace: 'nowrap',
                  marginTop: '0.6rem',
                  transition: 'color 0.3s ease',
                }}>
                  {stage}
                </span>
              </div>

              {/* Connector line between steps */}
              {!isLast && (
                <div style={{
                  flex: 1, height: '3px', alignSelf: 'flex-start', marginTop: '18.5px',
                  position: 'relative', minWidth: '20px', overflow: 'hidden',
                  borderRadius: '2px',
                  backgroundColor: 'rgba(231, 222, 213, 0.6)',
                }}>
                  {/* Filled portion */}
                  <div style={{
                    position: 'absolute', top: 0, left: 0, height: '100%',
                    width: connectorFilled ? '100%' : connectorPartial ? '50%' : '0%',
                    background: connectorFilled
                      ? T.brandGrad
                      : connectorPartial
                      ? `linear-gradient(to right, #5A2E16, ${T.accent})`
                      : 'transparent',
                    borderRadius: '2px',
                    transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                  }} />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Step count helper text */}
      <div style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{
          fontSize: '0.72rem', fontWeight: '700', color: T.textMuted,
          backgroundColor: T.surfaceAlt, padding: '0.3rem 0.85rem',
          borderRadius: '999px', border: `1px solid ${T.border}`,
          display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
        }}>
          <span style={{ color: T.accent, fontWeight: '900' }}>
            Step {activeIdx + 1}
          </span>
          of {STATUS_STAGES.length} ·&nbsp;
          <span style={{ color: T.brand, fontWeight: '800' }}>{normStatus}</span>
        </div>
      </div>

      {/* CSS animation */}
      <style>{`
        @keyframes progress-pulse {
          0%, 100% { box-shadow: 0 0 0 5px rgba(198, 138, 58, 0.18), 0 4px 16px rgba(198,138,58,0.2); }
          50%       { box-shadow: 0 0 0 9px rgba(198, 138, 58, 0.10), 0 4px 20px rgba(198,138,58,0.3); }
        }
      `}</style>
    </div>
  );
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
  const [cancelStep, setCancelStep] = useState('form');   // 'form' → 'confirm'
  const [copyToast, setCopyToast] = useState(false);
  const [awbCopyToast, setAwbCopyToast] = useState(false);
  const [shipTracking, setShipTracking] = useState(null);
  const [trackLoading, setTrackLoading] = useState(false);

  const handleCopyAwb = (awbCode) => {
    if (!awbCode) return;
    navigator.clipboard.writeText(awbCode);
    setAwbCopyToast(true);
    setTimeout(() => setAwbCopyToast(false), 2000);
  };

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
      const st0 = String(fetchedOrder?.orderStatus || fetchedOrder?.status || '').toLowerCase();
      if (st0 !== 'cancelled' && st0 !== 'delivered') fetchCancelQuote();
      // Auto-fetch tracking once a shipment exists (this also refreshes the shipment status server-side)
      const st = String(fetchedOrder?.orderStatus || fetchedOrder?.status || '').toLowerCase();
      if (fetchedOrder?.awb_number || fetchedOrder?.awb || ['shipped', 'out_for_delivery', 'out for delivery', 'delivered'].includes(st)) {
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
    const fresh = await fetchCancelQuote(); // refresh — the refund tier depends on the exact time
    if (fresh?.eligible) setCancelStep('confirm');
    else setCancelError(fresh?.message || 'This order can no longer be cancelled.');
  };

  const handleCancelOrder = async () => {
    if (cancelLoading) return; // guard against double clicks; the server is idempotent as well
    setCancelLoading(true);
    setCancelError('');
    try {
      await api.put(`/orders/${id}/cancel`, { reason: finalCancelReason });
      setCancelStep('form');
      await fetchOrderDetail();
    } catch (err) {
      setCancelError(err.response?.data?.message || 'Error cancelling order');
      setCancelStep('form');
      fetchCancelQuote();
    } finally { setCancelLoading(false); }
  };

  const handleCopyOrderNumber = () => {
    if (order) {
      navigator.clipboard.writeText(order.orderId || order.orderNumber || order._id);
      setCopyToast(true);
      setTimeout(() => setCopyToast(false), 2000);
    }
  };

  // ── Loading state ──
  if (loading) {
    return (
      <div style={{ padding: '5rem 0', textAlign: 'center', minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '52px', height: '52px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #5A2E16, #7C3D20)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(90,46,22,0.2)',
          }}>
            <Package size={24} color="#FFFFFF" />
          </div>
          <p style={{ color: T.textMuted, fontSize: '0.92rem', fontWeight: '600' }}>Retrieving your order details...</p>
        </div>
      </div>
    );
  }

  // ── Not found ──
  if (!order) {
    return (
      <div style={{ padding: '4rem 0', textAlign: 'center', minHeight: '60vh' }}>
        <div style={{ maxWidth: '400px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
          <ShieldAlert size={48} color={T.danger} />
          <h2 style={{ color: T.textPrimary, fontSize: '1.5rem', fontWeight: '800' }}>Order Not Found</h2>
          <p style={{ color: T.textMuted, fontSize: '0.92rem' }}>We couldn't retrieve this order. Please check the link.</p>
          <Link to="/account/orders" style={{ padding: '0.75rem 1.75rem', background: T.brandGrad, color: '#FFFFFF', borderRadius: '999px', textDecoration: 'none', fontWeight: '700' }}>
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  const createdAtMs = new Date(order.createdAt || order.created_at).getTime();
  const isOlderThan3Hours = !isNaN(createdAtMs) && (Date.now() - createdAtMs >= 3 * 3600 * 1000);

  // Automatically show status as Processing after 3 hours if still marked Confirmed
  let rawStatus = order.orderStatus || order.status || order.order_status || 'Confirmed';
  if (isOlderThan3Hours && String(rawStatus).toLowerCase() === 'confirmed') {
    rawStatus = 'Processing';
  }
  const currentStatus = rawStatus;
  const normStatus = normaliseStatus(currentStatus);
  const isCancelled = normStatus.toLowerCase() === 'cancelled';
  const isDelivered = normStatus.toLowerCase() === 'delivered';
  const isPaid = String(order.paymentStatus).toLowerCase() === 'paid';

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
  const subtotal = calculatedSubtotal > 0 ? calculatedSubtotal : Number(order.subtotal || order.sub_total || 0);

  const deliveryFee = Number(
    order.deliveryFee !== undefined ? order.deliveryFee :
    (order.delivery_fee !== undefined ? order.delivery_fee :
    (order.deliveryCharge !== undefined ? order.deliveryCharge :
    (order.delivery_charge !== undefined ? order.delivery_charge :
    (order.shippingFee !== undefined ? order.shippingFee :
    (order.shipping_fee !== undefined ? order.shipping_fee : 0)))))
  );

  const discountAmount = Number(
    order.discountAmount || order.discount_amount || order.couponDiscount || order.coupon_discount || order.discount || 0
  );

  const couponCode = order.couponCode || order.coupon_code || order.appliedCoupon || order.coupon || '';

  const grandTotal = Number(
    order.totalAmount || order.grandTotal || order.grand_total || order.total || (subtotal - discountAmount + deliveryFee)
  );

  const deliveryAddr = order.deliveryAddress || order.shippingAddress || {};
  const orderPlacementFormatted = formatDateTime(order.createdAt);
  const paidAtTimestamp = order.paidAt || order.paid_at;
  const isCod = String(order.paymentMethod || order.payment_method || '').toLowerCase().includes('cod') ||
                String(order.paymentMethod || order.payment_method || '').toLowerCase().includes('cash');
  const paymentTransactionFormatted = isCod
    ? 'Not applicable (Cash on Delivery — collected on delivery)'
    : paidAtTimestamp
      ? formatDateTime(paidAtTimestamp)
      : (isPaid ? 'Completed at checkout (verification confirmed)' : 'Pending verification');
  const estimatedDeliveryDate = calculateEstimatedDeliveryDate(order.createdAt, 9);

  return (
    <div style={{ paddingBottom: '4rem' }}>
      <div style={{ maxWidth: '920px', margin: '0 auto' }}>

        {/* Back */}
        <div style={{ marginBottom: '1.5rem' }}>
          <Link to="/account/orders" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', fontWeight: '700', color: T.brand, textDecoration: 'none' }}>
            <ArrowLeft size={15} /> Back to All Orders
          </Link>
        </div>

        {/* ── ORDER HEADER ── */}
        <div style={{ ...cardStyle, padding: '1.75rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', borderBottom: `1px solid ${T.border}`, paddingBottom: '1.25rem' }}>
            <div>
              <div style={{ fontSize: '0.58rem', textTransform: 'uppercase', letterSpacing: '0.14em', color: T.accent, fontWeight: '800', marginBottom: '0.25rem' }}>
                ORDER DETAILS
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '1.35rem', fontWeight: '900', color: T.textPrimary, margin: 0 }}>
                  #{order.orderNumber || order.orderId}
                </h1>
                <button
                  type="button"
                  onClick={handleCopyOrderNumber}
                  style={{
                    background: 'rgba(245,237,229,0.7)', border: `1px solid ${T.border}`,
                    borderRadius: '8px', padding: '0.25rem 0.65rem', cursor: 'pointer',
                    color: T.textMuted, display: 'flex', alignItems: 'center', gap: '0.3rem',
                    fontSize: '0.73rem', fontWeight: '700', backdropFilter: 'blur(8px)',
                  }}
                >
                  {copyToast ? <><Check size={12} color={T.success} /> Copied!</> : <><Copy size={12} /> Copy</>}
                </button>
              </div>
              <div style={{ fontSize: '0.84rem', color: T.textSecondary, marginTop: '0.4rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Clock size={14} color={T.accent} />
                <span>Order Placed: <strong>{orderPlacementFormatted}</strong></span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
              <StatusBadge status={normStatus} />
              <span style={{
                fontSize: '0.74rem', fontWeight: '700',
                color: isPaid ? T.success : T.warning,
                backgroundColor: isPaid ? T.successBg : T.warningBg,
                padding: '0.22rem 0.7rem', borderRadius: '6px',
              }}>
                {order.paymentMethod} · {isPaid ? 'Paid ✓' : 'Pending'}
              </span>
            </div>
          </div>

          {/* Key Timestamps & Delivery Window Banner */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginTop: '1.25rem' }}>
            <div style={{ padding: '0.85rem 1rem', backgroundColor: T.surfaceAlt, borderRadius: '12px', border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: '0.62rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', color: T.accent, marginBottom: '0.25rem' }}>
                ORDER PLACEMENT
              </div>
              <div style={{ fontSize: '0.88rem', fontWeight: '800', color: T.textPrimary }}>
                {orderPlacementFormatted}
              </div>
            </div>

            <div style={{ padding: '0.85rem 1rem', backgroundColor: T.surfaceAlt, borderRadius: '12px', border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: '0.62rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', color: T.accent, marginBottom: '0.25rem' }}>
                PAYMENT TRANSACTION
              </div>
              <div style={{ fontSize: '0.88rem', fontWeight: '800', color: isPaid ? T.success : T.textPrimary }}>
                {paymentTransactionFormatted}
              </div>
            </div>

            <div style={{ padding: '0.85rem 1rem', backgroundColor: 'rgba(237,247,238,0.7)', borderRadius: '12px', border: `1px solid ${T.successBorder}` }}>
              <div style={{ fontSize: '0.62rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', color: T.success, marginBottom: '0.25rem' }}>
                ESTIMATED DELIVERY
              </div>
              <div style={{ fontSize: '0.88rem', fontWeight: '800', color: T.success }}>
                Estimated delivery by {estimatedDeliveryDate}
              </div>
            </div>
          </div>
        </div>

        {/* ── ORDER PROGRESS TRACKER ── */}
        <OrderProgressTracker currentStatus={currentStatus} />

        {/* ── SHIPMENT TRACKING CARD (Shiprath Courier Tracking like in Admin Order Log) ── */}
        {!isCancelled && (
          <div style={{
            ...cardStyle,
            padding: '1.75rem',
            marginBottom: '1.5rem',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgba(247,242,236,0.92) 100%)',
            border: '1.5px solid rgba(198,138,58,0.3)',
            boxShadow: '0 8px 30px rgba(90, 46, 22, 0.08)',
          }}>
            {/* Header with Title, Shiprath portal link and Track Shipment Button */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.85rem', marginBottom: '1.25rem', borderBottom: '1px solid rgba(231, 222, 213, 0.65)', paddingBottom: '0.85rem' }}>
              <div>
                <div style={{ fontSize: '0.68rem', color: '#665A52', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                  <Truck size={15} color="#C68A3A" />
                  <span>Shiprath B2C Courier Tracking</span>
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: '900', color: '#21150F', fontFamily: 'var(--font-serif)' }}>
                  Live Package Journey
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                {(order.awb_number || order.awb || shipTracking?.awb) && (
                  <a
                    href="https://shiprath.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: '0.45rem 0.85rem',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(198,138,58,0.12)',
                      color: '#5A2E16',
                      border: '1px solid rgba(198,138,58,0.3)',
                      fontSize: '0.78rem',
                      fontWeight: '700',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}
                  >
                    <span>Shiprath Portal</span>
                    <ExternalLink size={12} />
                  </a>
                )}

                <button
                  type="button"
                  onClick={() => fetchShipTracking(order.id || order._id || order.orderId || id)}
                  disabled={trackLoading}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    backgroundColor: '#381423',
                    color: '#FFF',
                    border: 'none',
                    fontSize: '0.8rem',
                    fontWeight: '800',
                    cursor: trackLoading ? 'wait' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    boxShadow: '0 2px 8px rgba(56, 20, 35, 0.25)',
                    transition: 'all 0.2s',
                  }}
                >
                  <RefreshCw size={13} style={{ animation: trackLoading ? 'spin 1s linear infinite' : 'none' }} />
                  <span>{trackLoading ? 'Tracking...' : 'Track Shipment'}</span>
                </button>
              </div>
            </div>

            {/* Courier, AWB & Status Info Banner */}
            <div style={{
              background: 'rgba(252, 250, 247, 0.85)',
              border: '1px solid rgba(231, 222, 213, 0.8)',
              borderRadius: '12px',
              padding: '1.1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  {(order.awb_number || order.awb || shipTracking?.awb) ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#665A52', textTransform: 'uppercase' }}>AWB:</span>
                      <code style={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E7DED5',
                        padding: '0.2rem 0.55rem',
                        borderRadius: '6px',
                        color: '#381423',
                        fontWeight: '800',
                        fontSize: '0.88rem',
                        letterSpacing: '0.04em',
                      }}>
                        {order.awb_number || order.awb || shipTracking?.awb}
                      </code>
                      <button
                        type="button"
                        onClick={() => handleCopyAwb(order.awb_number || order.awb || shipTracking?.awb)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#C68A3A',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          fontSize: '0.74rem',
                          fontWeight: '700',
                          padding: '0.2rem 0.4rem',
                        }}
                      >
                        {awbCopyToast ? <><Check size={12} color="#2E7D32" /> Copied</> : <><Copy size={12} /> Copy</>}
                      </button>
                      {(order.courier_name || shipTracking?.courier_name) && (
                        <span style={{ color: '#4A3B2E', fontSize: '0.82rem', fontWeight: '700' }}>
                          • {order.courier_name || shipTracking?.courier_name}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.85rem', color: '#B7791F', fontWeight: '700' }}>
                      Order is being freshly baked and packed — courier tracking code will be generated upon dispatch.
                    </div>
                  )}
                </div>

                {/* Status Pill & Estimated Delivery */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{
                    padding: '0.3rem 0.85rem',
                    borderRadius: '999px',
                    fontSize: '0.78rem',
                    fontWeight: '850',
                    letterSpacing: '0.04em',
                    backgroundColor: String(shipTracking?.shipment_status || order.shipment_status).toLowerCase() === 'delivered' ? '#EDF7EE' : '#FEF9EC',
                    color: String(shipTracking?.shipment_status || order.shipment_status).toLowerCase() === 'delivered' ? '#2E7D32' : '#B7791F',
                    border: `1px solid ${String(shipTracking?.shipment_status || order.shipment_status).toLowerCase() === 'delivered' ? '#A5D6A7' : '#E7DED5'}`,
                    textTransform: 'uppercase',
                  }}>
                    {String(shipTracking?.shipment_status || order.shipment_status || 'Processing').replace(/_/g, ' ')}
                  </span>
                  {(shipTracking?.estimated_delivery || shipTracking?.tracking?.estimated_delivery) && (
                    <span style={{ fontSize: '0.78rem', color: '#4A3B2E', fontWeight: '700', backgroundColor: '#EDF7EE', padding: '0.3rem 0.75rem', borderRadius: '999px', border: '1px solid #A5D6A7' }}>
                      📅 EDD: {shipTracking?.estimated_delivery || shipTracking?.tracking?.estimated_delivery}
                    </span>
                  )}
                </div>
              </div>

              {/* Live Tracking Scan Events (Matches Admin Order Log) */}
              {(order.awb_number || order.awb || shipTracking?.awb) && (
                <div style={{ borderTop: '1px solid rgba(231, 222, 213, 0.65)', paddingTop: '0.85rem', marginTop: '0.35rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#4A3B2E', textTransform: 'uppercase', marginBottom: '0.65rem' }}>
                    Shipment Updates &amp; Scan History
                  </div>

                  {trackLoading && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#665A52', fontSize: '0.82rem', padding: '0.5rem 0' }}>
                      <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
                      <span>Contacting Shiprath courier network for live status...</span>
                    </div>
                  )}

                  {!trackLoading && (shipTracking?.events || shipTracking?.tracking?.shipment_track || []).length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                      {(shipTracking?.events || shipTracking?.tracking?.shipment_track || []).map((ev, i) => (
                        <div
                          key={i}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '0.65rem',
                            padding: '0.65rem 0.85rem',
                            backgroundColor: i === 0 ? '#FFFFFF' : 'rgba(255,255,255,0.5)',
                            borderRadius: '8px',
                            border: `1px solid ${i === 0 ? 'rgba(198,138,58,0.3)' : 'rgba(231,222,213,0.5)'}`,
                          }}
                        >
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: i === 0 ? '#2E7D32' : '#C68A3A', marginTop: '0.35rem', flexShrink: 0 }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: i === 0 ? '800' : '700', color: '#21150F' }}>
                              {ev.activity || ev.status || 'Courier Scan Update'}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#665A52', marginTop: '0.1rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                              {ev.location && <span>📍 {ev.location}</span>}
                              {ev.date && <span>· 🕒 {new Date(ev.date).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : !trackLoading && (order.awb_number || order.awb) ? (
                    <div style={{ fontSize: '0.82rem', color: '#665A52', padding: '0.35rem 0' }}>
                      Shipment booked with courier ({order.courier_name || 'Shiprath Partner'}). Awaiting first transit scan.
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
          </div>
        )}
        {isCancelled && (
          <div style={{ ...cardStyle, padding: '1.5rem', marginBottom: '1.25rem', backgroundColor: T.dangerBg, border: `1px solid ${T.dangerBorder}` }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
              <XCircle size={22} color={T.danger} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <div style={{ fontSize: '1rem', fontWeight: '900', color: T.danger }}>Order Cancelled</div>
                    <div style={{ fontSize: '0.78rem', color: T.textMuted, marginTop: '0.2rem' }}>
                      Cancelled at: <strong>{cancellation?.requestedAt ? formatDateTime(cancellation.requestedAt) : (order.cancelledAt ? formatDateTime(order.cancelledAt) : 'Recorded')}</strong>
                    </div>
                  </div>
                  <span className="admin-badge admin-badge-danger" style={{ fontSize: '0.72rem', fontWeight: '800' }}>
                    Status: Cancelled
                  </span>
                </div>

                {(cancellation?.reason || order.cancelReason) && (
                  <div style={{ fontSize: '0.84rem', color: T.textSecondary, marginTop: '0.5rem', backgroundColor: 'rgba(255,255,255,0.7)', padding: '0.4rem 0.75rem', borderRadius: '6px', borderLeft: `3px solid ${T.danger}` }}>
                    <strong>Reason:</strong> {cancellation?.reason || order.cancelReason}
                  </div>
                )}

                {cancellation && (
                  <div style={{ marginTop: '0.85rem', fontSize: '0.84rem', color: T.textPrimary, lineHeight: '1.6' }}>
                    {cancellation.refundStatus !== 'not_applicable' ? (
                      <div style={{ background: '#FFFFFF', padding: '0.85rem 1rem', borderRadius: '10px', border: `1px solid ${T.border}`, marginBottom: '0.65rem' }}>
                        <div style={{ fontWeight: '800', color: T.brand, marginBottom: '0.4rem', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Refund &amp; Cancellation Charge Breakdown
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.5rem 1rem', fontSize: '0.82rem' }}>
                          <div>Original Amount Paid: <strong>{inr(cancellation.amountPaid)}</strong></div>
                          <div style={{ color: T.danger }}>10% Cancellation Charge: <strong>−{inr(cancellation.cancellationCharge ?? (cancellation.amountPaid * 0.1))}</strong></div>
                          <div style={{ color: T.success, fontWeight: '800' }}>Eligible Refund: <strong>{inr(cancellation.refundAmount)}</strong></div>
                        </div>
                      </div>
                    ) : (
                      <div style={{ background: '#FFFFFF', padding: '0.65rem 0.85rem', borderRadius: '8px', border: `1px solid ${T.border}`, marginBottom: '0.5rem', fontSize: '0.8rem', color: T.textMuted }}>
                        Cash on Delivery order — No upfront payment was collected, so no cancellation charge or refund applies.
                      </div>
                    )}

                    <div style={{ fontWeight: '700', marginTop: '0.35rem', color: T.textPrimary }}>
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

        {/* ── MAIN GRID ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 280px', gap: '1.25rem', alignItems: 'start' }} className="order-detail-grid">

          {/* LEFT */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* Items */}
            <div style={{ ...cardStyle, padding: '1.5rem' }}>
              <h3 style={{ fontSize: '0.78rem', fontWeight: '900', color: T.textPrimary, margin: '0 0 1.25rem 0', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ width: '3px', height: '14px', borderRadius: '2px', backgroundColor: T.accent, display: 'inline-block' }} />
                Order Items ({orderItems.length})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {orderItems.map((item, idx) => {
                  const itemTitle = item.title || item.product_title || 'Millet Product';
                  const itemVariant = item.variantName || item.variant_name;
                  const itemQty = item.quantity || 1;
                  const itemPrice = item.price || 0;
                  const itemTotal = itemPrice * itemQty;
                  const customNote = item.customization_note || item.customizationNote;

                  return (
                    <div key={idx} style={{
                      display: 'flex', gap: '1rem', alignItems: 'flex-start',
                      paddingBottom: idx < orderItems.length - 1 ? '1rem' : 0,
                      borderBottom: idx < orderItems.length - 1 ? `1px solid ${T.border}` : 'none',
                    }}>
                      <OrderItemImage item={item} size={64} radius={12} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: '700', color: T.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {itemTitle}
                        </div>
                        {itemVariant && itemVariant !== 'default' && (
                          <div style={{ fontSize: '0.74rem', color: T.accent, fontWeight: '600', marginTop: '0.1rem' }}>{itemVariant}</div>
                        )}
                        <div style={{ fontSize: '0.8rem', color: T.textMuted, marginTop: '0.25rem' }}>
                          Qty: {itemQty} × ₹{itemPrice} = <strong style={{ color: T.textPrimary }}>₹{itemTotal}</strong>
                        </div>
                        {customNote && (
                          <div style={{ fontSize: '0.74rem', color: T.textMuted, marginTop: '0.3rem', padding: '0.35rem 0.65rem', backgroundColor: T.surfaceAlt, borderRadius: '6px', borderLeft: `3px solid ${T.accent}` }}>
                            ✦ Note: {customNote}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Delivery Address */}
            {(deliveryAddr.fullName || deliveryAddr.addressLine) && (
              <div style={{ ...cardStyle, padding: '1.5rem' }}>
                <h3 style={{ fontSize: '0.78rem', fontWeight: '900', color: T.textPrimary, margin: '0 0 1rem 0', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ width: '3px', height: '14px', borderRadius: '2px', backgroundColor: T.accent, display: 'inline-block' }} />
                  <MapPin size={14} color={T.accent} /> Delivery Address
                </h3>
                <div style={{ fontSize: '0.88rem', color: T.textSecondary, lineHeight: '1.75', fontWeight: '500' }}>
                  {deliveryAddr.fullName && <div style={{ fontWeight: '700', color: T.textPrimary }}>{deliveryAddr.fullName}</div>}
                  {deliveryAddr.building && <div>{deliveryAddr.building}</div>}
                  {deliveryAddr.addressLine && <div>{deliveryAddr.addressLine}</div>}
                  <div>{[deliveryAddr.city, deliveryAddr.state, deliveryAddr.pincode].filter(Boolean).join(', ')}</div>
                  {deliveryAddr.phone && <div style={{ color: T.textMuted, marginTop: '0.25rem' }}>📞 {deliveryAddr.phone}</div>}
                </div>
              </div>
            )}

            {/* Cancel — eligibility, refund % and amount are calculated by the server */}
            {/* Expired Cancellation Window (> 3 hours) */}
            {cancelWindowClosed && (
              <div style={{ ...cardStyle, padding: '1.25rem 1.5rem', backgroundColor: '#FFFDF9', border: `1px solid ${T.border}` }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <AlertCircle size={20} color={T.warning} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: '800', color: T.textPrimary, marginBottom: '0.35rem' }}>
                      Cancellation Window Expired
                    </div>
                    <p style={{ margin: 0, fontSize: '0.84rem', color: T.textSecondary, lineHeight: '1.6' }}>
                      You can no longer cancel this order because the 3-hour cancellation window has expired. Please contact customer support if you need assistance.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Eligible for Cancellation (within 3 hours) */}
            {canCancel && (
              <div style={{ ...cardStyle, padding: '1.5rem', border: `1px solid ${T.dangerBorder}`, backgroundColor: 'rgba(254,236,236,0.35)' }}>
                <h3 style={{ fontSize: '0.78rem', fontWeight: '900', color: T.danger, margin: '0 0 0.85rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  <AlertCircle size={15} /> Cancel Order
                </h3>

                {/* Policy Summary */}
                <div style={{ fontSize: '0.82rem', color: T.textSecondary, lineHeight: '1.6', marginBottom: '0.85rem' }}>
                  <div style={{ fontWeight: '800', color: T.textPrimary, marginBottom: '0.2rem' }}>Cancellation &amp; Refund Policy:</div>
                  <div>• Orders can be cancelled only within <strong>3 hours</strong> of order placement.</div>
                  <div>• A <strong>10% cancellation charge</strong> applies to the product amount only.</div>
                  <div>• Delivery charges are excluded from the cancellation charge and refunded where applicable.</div>
                </div>

                {/* Live Server Quote */}
                <div style={{ padding: '0.85rem 1rem', borderRadius: '10px', backgroundColor: '#FFFFFF', border: `1px solid ${T.border}`, fontSize: '0.84rem', color: T.textPrimary, marginBottom: '0.95rem', lineHeight: '1.6' }}>
                  {cancelQuote.prepaid ? (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <span style={{ color: T.textMuted }}>Original Amount Paid:</span>
                        <strong>{inr(cancelQuote.amountPaid)}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: T.danger, marginBottom: '0.25rem' }}>
                        <span>10% Cancellation Charge (Product Only):</span>
                        <strong>−{inr(cancelQuote.cancellationCharge)}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: T.success, fontWeight: '800', borderTop: `1px solid ${T.border}`, paddingTop: '0.35rem', marginTop: '0.35rem' }}>
                        <span>Eligible Refund:</span>
                        <strong style={{ fontSize: '0.95rem' }}>{inr(cancelQuote.refundAmount)}</strong>
                      </div>
                    </div>
                  ) : (
                    <div style={{ color: T.textSecondary }}>
                      This is a <strong>Cash on Delivery</strong> order. No payment was collected, so no refund or cancellation charge applies.
                    </div>
                  )}
                  {cancelQuote.expiresAt && (
                    <div style={{ fontSize: '0.74rem', color: T.textMuted, marginTop: '0.45rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Clock size={12} />
                      <span>3-hour cancellation window expires at: <strong>{formatDateTime(cancelQuote.expiresAt)}</strong></span>
                    </div>
                  )}
                </div>

                {cancelStep === 'form' ? (
                  <form onSubmit={handleReviewCancellation} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: '700', color: T.textPrimary }}>
                      Please select a cancellation reason:
                    </label>
                    <select
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      required
                      style={{ width: '100%', height: '44px', padding: '0 1rem', borderRadius: '10px', border: `1px solid rgba(231,222,213,0.8)`, fontSize: '0.88rem', color: T.textPrimary, backgroundColor: 'rgba(255,255,255,0.9)', outline: 'none', boxSizing: 'border-box' }}
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
                        style={{ width: '100%', padding: '0.65rem 1rem', borderRadius: '10px', border: `1px solid rgba(231,222,213,0.8)`, fontSize: '0.88rem', color: T.textPrimary, backgroundColor: 'rgba(255,255,255,0.9)', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical' }}
                      />
                    )}
                    {cancelError && <p style={{ fontSize: '0.8rem', color: T.danger, margin: 0 }}>{cancelError}</p>}
                    <button
                      type="submit"
                      disabled={!cancelReason || (cancelReason === 'Other' && cancelOther.trim().length < 3)}
                      style={{ padding: '0.65rem 1.5rem', backgroundColor: T.danger, color: '#FFFFFF', border: 'none', borderRadius: '10px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', opacity: !cancelReason ? 0.65 : 1, alignSelf: 'flex-end' }}
                    >
                      Review Cancellation
                    </button>
                  </form>
                ) : (
                  /* Confirmation Dialog */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', background: '#FFFFFF', padding: '1.25rem', borderRadius: '12px', border: `1px solid ${T.dangerBorder}` }}>
                    <div style={{ fontSize: '1.05rem', fontWeight: '900', color: T.danger, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <AlertCircle size={18} /> Cancel this order?
                    </div>

                    <p style={{ margin: 0, fontSize: '0.88rem', color: T.textPrimary, lineHeight: '1.6', fontWeight: '500' }}>
                      "A 10% cancellation charge will be deducted from the product amount only. Delivery charges are excluded from the cancellation charge and refunded where applicable."
                    </p>

                    {cancelQuote.prepaid && (
                      <div style={{ background: T.surfaceAlt, padding: '0.85rem 1rem', borderRadius: '10px', border: `1px solid ${T.border}`, fontSize: '0.84rem', lineHeight: '1.6' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                          <span style={{ color: T.textSecondary }}>Original Order Amount:</span>
                          <strong>{inr(cancelQuote.amountPaid)}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: T.danger, marginBottom: '0.25rem' }}>
                          <span>10% Cancellation Charge (Product Only):</span>
                          <strong>−{inr(cancelQuote.cancellationCharge)}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: T.success, fontWeight: '900', borderTop: `1px dashed ${T.border}`, paddingTop: '0.35rem', marginTop: '0.35rem', fontSize: '0.92rem' }}>
                          <span>Eligible Refund:</span>
                          <span>{inr(cancelQuote.refundAmount)}</span>
                        </div>
                        <div style={{ fontSize: '0.74rem', color: T.textMuted, marginTop: '0.5rem' }}>
                          Refund will be processed to your original payment method within 4–5 business days after payment verification.
                        </div>
                      </div>
                    )}

                    {cancelError && <p style={{ fontSize: '0.82rem', color: T.danger, margin: 0 }}>{cancelError}</p>}

                    <div style={{ display: 'flex', gap: '0.65rem', justifyContent: 'flex-end', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => setCancelStep('form')}
                        disabled={cancelLoading}
                        style={{ padding: '0.65rem 1.25rem', backgroundColor: 'transparent', color: T.textPrimary, border: `1px solid ${T.border}`, borderRadius: '10px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer' }}
                      >
                        Keep Order
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelOrder}
                        disabled={cancelLoading}
                        style={{ padding: '0.65rem 1.5rem', backgroundColor: T.danger, color: '#FFFFFF', border: 'none', borderRadius: '10px', fontWeight: '700', fontSize: '0.85rem', cursor: cancelLoading ? 'wait' : 'pointer', opacity: cancelLoading ? 0.65 : 1, display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                      >
                        {cancelLoading ? <><RefreshCw size={14} className="animate-spin" /> Cancelling...</> : 'Confirm & Cancel Order'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* RIGHT */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* Price Breakdown */}
            <div style={{ ...cardStyle, padding: '1.35rem' }}>
              <h3 style={{ fontSize: '0.78rem', fontWeight: '900', color: T.textPrimary, margin: '0 0 1rem 0', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ width: '3px', height: '14px', borderRadius: '2px', backgroundColor: T.accent, display: 'inline-block' }} />
                Order Summary
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.87rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: T.textSecondary }}>
                  <span>Subtotal</span>
                  <span style={{ fontWeight: '700', color: T.textPrimary }}>₹{subtotal.toLocaleString('en-IN')}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', color: T.textSecondary }}>
                  <span>Delivery Fee</span>
                  <span style={{ fontWeight: '700', color: deliveryFee === 0 ? T.success : T.textPrimary }}>
                    {deliveryFee === 0 ? 'FREE 🎉' : `₹${deliveryFee.toLocaleString('en-IN')}`}
                  </span>
                </div>

                {discountAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: T.success }}>
                    <span>Coupon Discount {couponCode ? `(${couponCode})` : ''}</span>
                    <span style={{ fontWeight: '700' }}>−₹{discountAmount.toLocaleString('en-IN')}</span>
                  </div>
                )}

                <div style={{ height: '1px', backgroundColor: T.border, margin: '0.35rem 0' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '900', fontSize: '1.05rem' }}>
                  <span style={{ color: T.textPrimary }}>Total Paid</span>
                  <span style={{ color: T.brand }}>₹{grandTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div style={{ ...cardStyle, padding: '1.35rem' }}>
              <h3 style={{ fontSize: '0.78rem', fontWeight: '900', color: T.textPrimary, margin: '0 0 0.85rem 0', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Need Help?</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {[
                  { label: 'Contact Support', icon: MessageCircle, path: '/contact' },
                  { label: 'All My Orders', icon: ShoppingBag, path: '/account/orders' },
                  { label: 'My Dashboard', icon: PackageCheck, path: '/account' },
                ].map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link key={link.label} to={link.path} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '0.65rem 0.85rem', borderRadius: '10px',
                      border: `1px solid ${T.border}`, textDecoration: 'none',
                      color: T.brand, fontWeight: '600', fontSize: '0.82rem',
                      backgroundColor: 'rgba(245, 237, 229, 0.4)', transition: 'all 0.18s ease',
                      backdropFilter: 'blur(8px)',
                    }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Icon size={14} /> {link.label}
                      </span>
                      <ChevronRight size={13} />
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <style>{`
          @media (max-width: 700px) {
            .order-detail-grid { grid-template-columns: 1fr !important; }
          }
        `}</style>
      </div>
    </div>
  );
}
