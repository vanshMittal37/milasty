import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  CheckCircle2, Clock, MapPin, ShieldAlert, ArrowLeft, PackageCheck, AlertCircle,
  Copy, Check, MessageCircle, ChevronRight, Package, Truck, ShoppingBag, RefreshCw
} from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const STATUS_STAGES = ['Pending', 'Confirmed', 'Processing', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'];

// Design tokens
const T = {
  bg:            '#FCFAF7',
  surface:       '#FFFFFF',
  surfaceAlt:    '#F7F2EC',
  brand:         '#5A2E16',
  brandLight:    '#F5EDE5',
  accent:        '#C58A35',
  accentLight:   '#FEF9EC',
  border:        '#E7DED5',
  textPrimary:   '#171717',
  textSecondary: '#4A3B2E',
  textMuted:     '#888888',
  success:       '#2E7D32',
  successBg:     '#EDF7EE',
  warning:       '#B7791F',
  warningBg:     '#FEF9EC',
  danger:        '#C62828',
  dangerBg:      '#FEECEC',
  info:          '#1565C0',
  infoBg:        '#EAF2FF',
  shadow:        '0 2px 10px rgba(90, 46, 22, 0.07)',
  shadowMd:      '0 4px 20px rgba(90, 46, 22, 0.10)',
};

const cardStyle = {
  backgroundColor: T.surface,
  border: `1px solid ${T.border}`,
  borderRadius: '16px',
  boxShadow: T.shadow,
};

function StatusBadge({ status }) {
  const s = String(status || 'Confirmed');
  const map = {
    Pending:             { bg: T.warningBg, color: T.warning },
    Confirmed:           { bg: T.infoBg, color: T.info },
    Processing:          { bg: '#F3E8FF', color: '#6B21A8' },
    Packed:              { bg: '#F3E8FF', color: '#6B21A8' },
    Shipped:             { bg: T.accentLight, color: T.accent },
    'Out for Delivery':  { bg: T.accentLight, color: T.accent },
    Delivered:           { bg: T.successBg, color: T.success },
    Cancelled:           { bg: T.dangerBg, color: T.danger },
  };
  const style = map[s] || { bg: '#F3F4F6', color: '#6B7280' };
  return (
    <span style={{
      padding: '0.3rem 0.85rem', borderRadius: '999px',
      fontSize: '0.78rem', fontWeight: '700',
      backgroundColor: style.bg, color: style.color,
      display: 'inline-block', whiteSpace: 'nowrap',
    }}>
      {s}
    </span>
  );
}

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

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); }
    else { fetchOrderDetail(); }
  }, [id, isAuthenticated]);

  const fetchOrderDetail = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/orders/detail/${id}`);
      setOrder(res.data);
    } catch (e) { console.error('Error fetching order', e); }
    finally { setLoading(false); }
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

  if (loading) {
    return (
      <div style={{ padding: '4rem 0', textAlign: 'center', backgroundColor: T.bg, minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: T.brandLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Package size={24} color={T.brand} />
          </div>
          <p style={{ color: T.textMuted, fontSize: '0.95rem', fontWeight: '600' }}>Retrieving your order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div style={{ padding: '4rem 0', textAlign: 'center', backgroundColor: T.bg, minHeight: '60vh' }}>
        <div style={{ maxWidth: '400px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
          <ShieldAlert size={48} color={T.danger} />
          <h2 style={{ color: T.textPrimary, fontSize: '1.5rem', fontWeight: '800' }}>Order Not Found</h2>
          <p style={{ color: T.textMuted, fontSize: '0.95rem' }}>We couldn't retrieve this order. Please check the link.</p>
          <Link to="/account/orders" style={{ padding: '0.75rem 1.75rem', backgroundColor: T.brand, color: '#FFFFFF', borderRadius: '999px', textDecoration: 'none', fontWeight: '700' }}>
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  const currentStatus = order.orderStatus || order.status || 'Confirmed';
  const isCancelled = String(currentStatus).toLowerCase() === 'cancelled';
  const isDelivered = String(currentStatus).toLowerCase() === 'delivered';
  const isPaid = String(order.paymentStatus).toLowerCase() === 'paid';
  const canCancel = !isCancelled && !isDelivered;

  const currentStageIndex = STATUS_STAGES.indexOf(currentStatus);

  const orderItems = order.order_items || order.items || [];
  const subtotal = orderItems.reduce((s, i) => s + (i.price * i.quantity), 0);
  const deliveryAddr = order.deliveryAddress || order.shippingAddress || {};
  const placedDate = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })
    : '—';

  return (
    <div className="account-dashboard-page" style={{ backgroundColor: T.bg, minHeight: '100vh', paddingBottom: '4rem' }}>
      <div className="container" style={{ maxWidth: '900px' }}>

        {/* Back Navigation */}
        <div style={{ marginBottom: '1.5rem' }}>
          <Link to="/account/orders" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', fontWeight: '700', color: T.brand, textDecoration: 'none' }}>
            <ArrowLeft size={15} /> Back to All Orders
          </Link>
        </div>

        {/* ── ORDER HEADER ── */}
        <div style={{ ...cardStyle, padding: '1.75rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.14em', color: T.textMuted, fontWeight: '800', marginBottom: '0.25rem' }}>
                ORDER DETAILS
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '1.35rem', fontWeight: '900', color: T.textPrimary, margin: 0 }}>
                  #{order.orderNumber || order.orderId}
                </h1>
                <button
                  type="button"
                  onClick={handleCopyOrderNumber}
                  style={{ background: 'none', border: `1px solid ${T.border}`, borderRadius: '8px', padding: '0.25rem 0.65rem', cursor: 'pointer', color: T.textMuted, display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', fontWeight: '700' }}
                >
                  {copyToast ? <><Check size={12} color={T.success} /> Copied</> : <><Copy size={12} /> Copy</>}
                </button>
              </div>
              <div style={{ fontSize: '0.82rem', color: T.textMuted, marginTop: '0.3rem' }}>
                Placed on {placedDate}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
              <StatusBadge status={currentStatus} />
              <span style={{
                fontSize: '0.76rem', fontWeight: '600',
                color: isPaid ? T.success : T.warning,
                backgroundColor: isPaid ? T.successBg : T.warningBg,
                padding: '0.2rem 0.65rem', borderRadius: '6px',
              }}>
                {order.paymentMethod} · {isPaid ? 'Paid' : 'Pending'}
              </span>
            </div>
          </div>
        </div>

        {/* ── ORDER PROGRESS TRACKER ── */}
        {!isCancelled && (
          <div style={{ ...cardStyle, padding: '1.75rem', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '0.88rem', fontWeight: '800', color: T.textPrimary, margin: '0 0 1.5rem 0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Order Progress
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', overflowX: 'auto', gap: 0, paddingBottom: '0.5rem' }}>
              {STATUS_STAGES.map((stage, i) => {
                const isCompleted = i <= currentStageIndex;
                const isCurrent = i === currentStageIndex;
                const isLast = i === STATUS_STAGES.length - 1;
                return (
                  <React.Fragment key={stage}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', minWidth: '72px' }}>
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '50%',
                        backgroundColor: isCompleted ? T.brand : T.surfaceAlt,
                        border: `2px solid ${isCompleted ? T.brand : T.border}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                        boxShadow: isCurrent ? `0 0 0 4px rgba(90, 46, 22, 0.15)` : 'none',
                        transition: 'all 0.3s ease',
                      }}>
                        {isCompleted
                          ? <Check size={14} color="#FFFFFF" strokeWidth={3} />
                          : <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: T.border }} />
                        }
                      </div>
                      <span style={{
                        fontSize: '0.62rem', textAlign: 'center', lineHeight: '1.2', fontWeight: isCurrent ? '800' : '600',
                        color: isCompleted ? T.brand : T.textMuted, whiteSpace: 'nowrap',
                      }}>
                        {stage}
                      </span>
                    </div>
                    {!isLast && (
                      <div style={{ flex: 1, height: '2px', backgroundColor: i < currentStageIndex ? T.brand : T.border, minWidth: '16px', transition: 'background-color 0.3s ease', marginBottom: '1.2rem' }} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}

        {/* ── CANCELLED BANNER ── */}
        {isCancelled && (
          <div style={{ ...cardStyle, padding: '1.25rem 1.5rem', marginBottom: '1.25rem', backgroundColor: T.dangerBg, border: `1px solid #EF9A9A` }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
              <AlertCircle size={20} color={T.danger} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
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

        {/* ── MAIN GRID: ITEMS + SUMMARY ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 280px', gap: '1.25rem', alignItems: 'start' }}>

          {/* LEFT: ORDER ITEMS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* Items list */}
            <div style={{ ...cardStyle, padding: '1.5rem' }}>
              <h3 style={{ fontSize: '0.88rem', fontWeight: '800', color: T.textPrimary, margin: '0 0 1.25rem 0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
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
                    <div key={idx} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', paddingBottom: idx < orderItems.length - 1 ? '1rem' : 0, borderBottom: idx < orderItems.length - 1 ? `1px solid ${T.border}` : 'none' }}>
                      {itemImage && (
                        <img src={itemImage} alt={itemTitle} style={{ width: '62px', height: '62px', borderRadius: '10px', objectFit: 'cover', border: `1px solid ${T.border}`, flexShrink: 0 }} />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: '700', color: T.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {itemTitle}
                        </div>
                        {itemVariant && itemVariant !== 'default' && (
                          <div style={{ fontSize: '0.76rem', color: T.accent, fontWeight: '600', marginTop: '0.1rem' }}>{itemVariant}</div>
                        )}
                        <div style={{ fontSize: '0.8rem', color: T.textMuted, marginTop: '0.25rem' }}>
                          Qty: {itemQty} × ₹{itemPrice} = <strong style={{ color: T.textPrimary }}>₹{itemTotal}</strong>
                        </div>
                        {customNote && (
                          <div style={{ fontSize: '0.76rem', color: T.textMuted, marginTop: '0.3rem', padding: '0.35rem 0.65rem', backgroundColor: T.surfaceAlt, borderRadius: '6px', borderLeft: `3px solid ${T.accent}` }}>
                            ✦ Customization: {customNote}
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
                <h3 style={{ fontSize: '0.88rem', fontWeight: '800', color: T.textPrimary, margin: '0 0 1rem 0', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <MapPin size={15} color={T.accent} /> Delivery Address
                </h3>
                <div style={{ fontSize: '0.88rem', color: T.textSecondary, lineHeight: '1.7', fontWeight: '500' }}>
                  {deliveryAddr.fullName && <div style={{ fontWeight: '700', color: T.textPrimary }}>{deliveryAddr.fullName}</div>}
                  {deliveryAddr.building && <div>{deliveryAddr.building}</div>}
                  {deliveryAddr.addressLine && <div>{deliveryAddr.addressLine}</div>}
                  <div>{[deliveryAddr.city, deliveryAddr.state, deliveryAddr.pincode].filter(Boolean).join(', ')}</div>
                  {deliveryAddr.phone && <div style={{ color: T.textMuted, marginTop: '0.25rem' }}>📞 {deliveryAddr.phone}</div>}
                </div>
              </div>
            )}

            {/* Cancel Order */}
            {canCancel && (
              <div style={{ ...cardStyle, padding: '1.5rem', border: `1px solid #EF9A9A` }}>
                <h3 style={{ fontSize: '0.88rem', fontWeight: '800', color: T.danger, margin: '0 0 0.85rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertCircle size={15} /> Request Cancellation
                </h3>
                <form onSubmit={handleCancelOrder} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <select
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    required
                    style={{ width: '100%', height: '44px', padding: '0 1rem', borderRadius: '10px', border: `1px solid ${T.border}`, fontSize: '0.88rem', color: T.textPrimary, backgroundColor: T.surface, outline: 'none', boxSizing: 'border-box' }}
                  >
                    <option value="">Select a reason...</option>
                    {['Changed my mind', 'Ordered by mistake', 'Found a better price', 'Delivery time too long', 'Other'].map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                  {cancelError && <p style={{ fontSize: '0.8rem', color: T.danger, margin: 0 }}>{cancelError}</p>}
                  <button type="submit" disabled={cancelLoading || !cancelReason} style={{ padding: '0.65rem 1.5rem', backgroundColor: T.danger, color: '#FFFFFF', border: 'none', borderRadius: '10px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', opacity: (cancelLoading || !cancelReason) ? 0.65 : 1, alignSelf: 'flex-end', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    {cancelLoading ? <><RefreshCw size={14} /> Processing...</> : 'Cancel Order'}
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* RIGHT: ORDER SUMMARY */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* Price Breakdown */}
            <div style={{ ...cardStyle, padding: '1.35rem' }}>
              <h3 style={{ fontSize: '0.88rem', fontWeight: '800', color: T.textPrimary, margin: '0 0 1rem 0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Order Summary</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.87rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: T.textSecondary }}>
                  <span>Subtotal</span>
                  <span style={{ fontWeight: '700', color: T.textPrimary }}>₹{subtotal}</span>
                </div>
                {order.deliveryCharge !== undefined && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: T.textSecondary }}>
                    <span>Delivery</span>
                    <span style={{ fontWeight: '700', color: order.deliveryCharge === 0 ? T.success : T.textPrimary }}>
                      {order.deliveryCharge === 0 ? 'FREE' : `₹${order.deliveryCharge}`}
                    </span>
                  </div>
                )}
                {order.discount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: T.success }}>
                    <span>Discount</span>
                    <span style={{ fontWeight: '700' }}>−₹{order.discount}</span>
                  </div>
                )}
                <div style={{ height: '1px', backgroundColor: T.border, margin: '0.25rem 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '900', fontSize: '1rem' }}>
                  <span style={{ color: T.textPrimary }}>Total Paid</span>
                  <span style={{ color: T.textPrimary }}>₹{order.totalAmount || order.grandTotal || subtotal}</span>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div style={{ ...cardStyle, padding: '1.35rem' }}>
              <h3 style={{ fontSize: '0.88rem', fontWeight: '800', color: T.textPrimary, margin: '0 0 0.85rem 0' }}>Need Help?</h3>
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
                      color: T.brand, fontWeight: '600', fontSize: '0.83rem',
                      backgroundColor: T.surface, transition: 'all 0.18s ease',
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

        {/* Mobile: Summary below items on small screens */}
        <style>{`
          @media (max-width: 700px) {
            .order-detail-grid { grid-template-columns: 1fr !important; }
          }
        `}</style>
      </div>
    </div>
  );
}
