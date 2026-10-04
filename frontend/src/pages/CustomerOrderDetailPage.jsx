import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  CheckCircle2, Clock, MapPin, ShieldAlert, ArrowLeft, PackageCheck, AlertCircle,
  Copy, Check, MessageCircle, ChevronRight, Package, Truck, ShoppingBag, RefreshCw,
  ClipboardList, Archive, Send, Star, XCircle, Navigation, ExternalLink, Loader2
} from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

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
  const [copyToast, setCopyToast] = useState(false);
  const [shipTracking, setShipTracking] = useState(null);
  const [trackLoading, setTrackLoading] = useState(false);

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
      // Auto-fetch tracking if order is shipped or beyond
      const st = String(fetchedOrder?.orderStatus || fetchedOrder?.status || '').toLowerCase();
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

  const handleCancelOrder = async (e) => {
    e.preventDefault();
    setCancelLoading(true);
    setCancelError('');
    try {
      await api.put(`/orders/${id}/cancel`, { reason: cancelReason });
      fetchOrderDetail();
    } catch (err) {
      setCancelError(err.response?.data?.message || 'Error cancelling order');
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

  const currentStatus = order.orderStatus || order.status || 'Confirmed';
  const normStatus = normaliseStatus(currentStatus);
  const isCancelled = normStatus.toLowerCase() === 'cancelled';
  const isDelivered = normStatus.toLowerCase() === 'delivered';
  const isPaid = String(order.paymentStatus).toLowerCase() === 'paid';

  const orderTime = order.createdAt ? new Date(order.createdAt).getTime() : Date.now();
  const hoursPassed = (Date.now() - orderTime) / (1000 * 60 * 60);
  const canCancel = !isCancelled && !isDelivered && hoursPassed <= 6;

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
  const placedDate = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })
    : '—';

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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
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
              <div style={{ fontSize: '0.82rem', color: T.textMuted, marginTop: '0.3rem', fontWeight: '500' }}>
                Placed on {placedDate}
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
        </div>

        {/* ── ORDER PROGRESS TRACKER ── */}
        <OrderProgressTracker currentStatus={currentStatus} />

        {/* ── SHIPRATH LIVE TRACKING CARD ── */}
        {(order.awb_number || order.awb || shipTracking || trackLoading) && (
          <div style={{
            ...cardStyle,
            padding: '1.5rem',
            marginBottom: '1.25rem',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(245,237,229,0.85) 100%)',
            border: '1px solid rgba(198,138,58,0.25)',
          }}>
            <h3 style={{
              fontSize: '0.78rem', fontWeight: '900', color: T.textPrimary,
              margin: '0 0 1rem 0', textTransform: 'uppercase', letterSpacing: '0.1em',
              display: 'flex', alignItems: 'center', gap: '0.5rem',
            }}>
              <span style={{ width: '3px', height: '14px', borderRadius: '2px', backgroundColor: T.accent, display: 'inline-block' }} />
              <Navigation size={14} color={T.accent} />
              Live Shipment Tracking
            </h3>

            {trackLoading && !shipTracking && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: T.textMuted, fontSize: '0.87rem' }}>
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                Fetching live tracking data...
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {/* AWB & Courier Row */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                {(order.awb_number || order.awb || shipTracking?.awb) && (
                  <div style={{
                    flex: 1, minWidth: '160px',
                    padding: '0.85rem 1rem',
                    backgroundColor: 'rgba(245,237,229,0.6)',
                    borderRadius: '10px',
                    border: `1px solid rgba(198,138,58,0.2)`,
                  }}>
                    <div style={{ fontSize: '0.62rem', fontWeight: '800', color: T.accent, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.2rem' }}>AWB Number</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: '800', color: T.textPrimary, fontFamily: 'monospace', letterSpacing: '0.05em' }}>{order.awb_number || order.awb || shipTracking?.awb}</div>
                  </div>
                )}
                {(order.courier_name || shipTracking?.courier_name) && (
                  <div style={{
                    flex: 1, minWidth: '160px',
                    padding: '0.85rem 1rem',
                    backgroundColor: 'rgba(245,237,229,0.6)',
                    borderRadius: '10px',
                    border: `1px solid rgba(198,138,58,0.2)`,
                  }}>
                    <div style={{ fontSize: '0.62rem', fontWeight: '800', color: T.accent, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.2rem' }}>Courier Partner</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: '800', color: T.textPrimary }}>{order.courier_name || shipTracking?.courier_name}</div>
                  </div>
                )}
                {shipTracking?.tracking?.estimated_delivery && (
                  <div style={{
                    flex: 1, minWidth: '160px',
                    padding: '0.85rem 1rem',
                    backgroundColor: 'rgba(237,247,238,0.7)',
                    borderRadius: '10px',
                    border: `1px solid rgba(46,125,50,0.2)`,
                  }}>
                    <div style={{ fontSize: '0.62rem', fontWeight: '800', color: T.success, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.2rem' }}>Est. Delivery</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: '800', color: T.success }}>{shipTracking.tracking.estimated_delivery}</div>
                  </div>
                )}
              </div>

              {/* Latest tracking event */}
              {shipTracking?.tracking?.shipment_track?.[0] && (
                <div style={{
                  padding: '0.85rem 1rem',
                  backgroundColor: T.infoBg,
                  borderRadius: '10px',
                  border: `1px solid rgba(21,101,192,0.15)`,
                  display: 'flex', alignItems: 'flex-start', gap: '0.7rem',
                }}>
                  <Truck size={16} color={T.info} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: '700', color: T.info }}>
                      {shipTracking.tracking.shipment_track[0].activity || 'In transit'}
                    </div>
                    {shipTracking.tracking.shipment_track[0].location && (
                      <div style={{ fontSize: '0.75rem', color: T.textMuted, marginTop: '0.15rem' }}>
                        📍 {shipTracking.tracking.shipment_track[0].location}
                      </div>
                    )}
                    {shipTracking.tracking.shipment_track[0].date && (
                      <div style={{ fontSize: '0.72rem', color: T.textMuted, marginTop: '0.1rem' }}>
                        {new Date(shipTracking.tracking.shipment_track[0].date).toLocaleString('en-IN')}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Full tracking link */}
              {shipTracking?.tracking_url && (
                <a
                  href={shipTracking?.tracking_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                    padding: '0.6rem 1.2rem',
                    background: T.brandGrad,
                    color: '#FFFFFF',
                    borderRadius: '999px',
                    textDecoration: 'none',
                    fontSize: '0.8rem', fontWeight: '700',
                    alignSelf: 'flex-start',
                    boxShadow: '0 4px 12px rgba(90,46,22,0.18)',
                  }}
                >
                  <ExternalLink size={13} /> Track Full Journey
                </a>
              )}
            </div>

            {!shipTracking && !trackLoading && (order.awb_number || order.awb) && (
              <div style={{ fontSize: '0.84rem', color: T.textMuted, fontWeight: '500', marginTop: '0.5rem' }}>
                Shipment is being arranged. Tracking details will update shortly.
              </div>
            )}

            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
          </div>
        )}
        {isCancelled && (
          <div style={{ ...cardStyle, padding: '1.25rem 1.5rem', marginBottom: '1.25rem', backgroundColor: T.dangerBg, border: `1px solid ${T.dangerBorder}` }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
              <XCircle size={20} color={T.danger} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
              <div>
                <div style={{ fontSize: '0.92rem', fontWeight: '800', color: T.danger }}>Order Cancelled</div>
                {order.cancelReason && (
                  <div style={{ fontSize: '0.82rem', color: T.danger, marginTop: '0.2rem', opacity: 0.85 }}>
                    Reason: {order.cancelReason}
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
                  const itemImage = item.image || item.product_image;
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
                      {itemImage && (
                        <img src={itemImage} alt={itemTitle} style={{ width: '64px', height: '64px', borderRadius: '12px', objectFit: 'cover', border: `1px solid ${T.border}`, flexShrink: 0 }} />
                      )}
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

            {/* Cancel */}
            {canCancel && (
              <div style={{ ...cardStyle, padding: '1.5rem', border: `1px solid ${T.dangerBorder}`, backgroundColor: 'rgba(254,236,236,0.4)' }}>
                <h3 style={{ fontSize: '0.78rem', fontWeight: '900', color: T.danger, margin: '0 0 0.85rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  <AlertCircle size={14} /> Request Cancellation
                </h3>
                <form onSubmit={handleCancelOrder} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
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
                  {cancelError && <p style={{ fontSize: '0.8rem', color: T.danger, margin: 0 }}>{cancelError}</p>}
                  <button
                    type="submit"
                    disabled={cancelLoading || !cancelReason}
                    style={{ padding: '0.65rem 1.5rem', backgroundColor: T.danger, color: '#FFFFFF', border: 'none', borderRadius: '10px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', opacity: (cancelLoading || !cancelReason) ? 0.65 : 1, alignSelf: 'flex-end', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    {cancelLoading ? <><RefreshCw size={14} /> Processing...</> : 'Cancel Order'}
                  </button>
                </form>
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
