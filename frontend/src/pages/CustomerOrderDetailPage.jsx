import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, Clock, MapPin, ShieldAlert, ArrowLeft, PackageCheck, AlertCircle, Copy, Check, MessageCircle, HelpCircle, ArrowRight } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const STATUS_STAGES = ['Pending', 'Confirmed', 'Processing', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'];

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
    if (!isAuthenticated) {
      navigate('/login');
    } else {
      fetchOrderDetail();
    }
  }, [id, isAuthenticated]);

  const fetchOrderDetail = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/orders/detail/${id}`);
      setOrder(res.data);
    } catch (e) {
      console.error('Error fetching order', e);
    } finally {
      setLoading(false);
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
    } finally {
      setCancelLoading(false);
    }
  };

  const handleCopyOrderNumber = () => {
    if (order) {
      navigator.clipboard.writeText(order.orderId);
      setCopyToast(true);
      setTimeout(() => setCopyToast(false), 2000);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '6rem 0', textAlign: 'center', backgroundColor: '#FBF8F2', minHeight: '80vh' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <Clock size={36} color="var(--accent-gold)" className="animate-float" />
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: '600' }}>Retrieving your order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div style={{ padding: '6rem 0', textAlign: 'center', backgroundColor: '#FBF8F2', minHeight: '80vh' }}>
        <div style={{ maxWidth: '400px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
          <ShieldAlert size={48} color="var(--accent-terracotta)" />
          <h2 style={{ fontFamily: 'var(--font-serif)', color: 'var(--primary-dark)', fontSize: '1.8rem', fontWeight: '800' }}>Order Not Found</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>We couldn't retrieve this order. Please verify the URL or link.</p>
          <Link to="/account/orders" className="btn-primary" style={{ padding: '0.85rem 2rem', backgroundColor: 'var(--primary-dark)', border: 'none', borderRadius: '999px', color: '#FFFFFF', textDecoration: 'none', fontWeight: '700' }}>
            Back to My Orders
          </Link>
        </div>
      </div>
    );
  }

  const currentStageIndex = STATUS_STAGES.indexOf(order.orderStatus);
  const isCancelled = order.orderStatus === 'Cancelled';

  // Get dynamic current status subtext message
  const getStatusDescriptionMessage = (status) => {
    switch (status) {
      case 'Pending':
        return 'Waiting for payment confirmation to initiate baking.';
      case 'Confirmed':
        return 'Your order has been confirmed and is being prepared by the MILASTY team.';
      case 'Processing':
        return 'Our team is carefully preparing your fresh small-batch millet bakes.';
      case 'Packed':
        return 'Your order is securely packed in eco-friendly wraps and ready to ship.';
      case 'Shipped':
        return 'Your MILASTY package has left our facility and is on the way.';
      case 'Out for Delivery':
        return 'Our delivery agent is nearby and will reach you shortly today.';
      case 'Delivered':
        return 'Order was successfully delivered. Thank you for choosing MILASTY!';
      default:
        return 'Your order updates will progress dynamically.';
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="account-dashboard-page" style={{ backgroundColor: 'var(--bg-main)', minHeight: '100vh', padding: '2.5rem 0 5rem' }}>
      <div className="container" style={{ maxWidth: '1150px' }}>
        
        {/* Breadcrumb navigation */}
        <div style={{ fontSize: '0.78rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>Home</Link>
          <span style={{ margin: '0 0.5rem' }}>/</span>
          <Link to="/account" style={{ color: 'inherit', textDecoration: 'none' }}>My Account</Link>
          <span style={{ margin: '0 0.5rem' }}>/</span>
          <Link to="/account/orders" style={{ color: 'inherit', textDecoration: 'none' }}>Orders</Link>
          <span style={{ margin: '0 0.5rem' }}>/</span>
          <span style={{ color: 'var(--accent-gold)' }}>Order #{order.orderId}</span>
        </div>

        {/* Back Link */}
        <Link 
          to="/account/orders" 
          style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '0.4rem', 
            color: 'var(--accent-gold)', 
            fontWeight: '800', 
            marginBottom: '2rem', 
            fontSize: '0.85rem',
            textDecoration: 'none'
          }}
        >
          <ArrowLeft size={16} />
          <span>Back to My Orders</span>
        </Link>

        {/* Order Details Header Card */}
        <div 
          className="glass-card" 
          style={{ 
            padding: '2.25rem 2.5rem', 
            backgroundColor: 'transparent', 
            marginBottom: '2.5rem', 
            borderRadius: '24px', 
            border: '1px solid rgba(245, 235, 221, 0.25)',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.2)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
            <div>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent-gold)', fontWeight: '800', display: 'block', marginBottom: '0.35rem' }}>Order Details</span>
              <h1 style={{ fontSize: '1.8rem', fontFamily: 'var(--font-serif)', color: 'var(--text-light)', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                #{order.orderId}
                <button 
                  onClick={handleCopyOrderNumber} 
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.2rem', display: 'flex', alignItems: 'center', transition: 'color 0.2s' }}
                  title="Copy Order ID"
                  onMouseOver={(e) => e.currentTarget.style.color = 'var(--accent-gold)'}
                  onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                >
                  <Copy size={16} />
                </button>
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '0.45rem 0 0 0', fontWeight: '500' }}>
                Placed on {new Date(order.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
              </p>
            </div>
            
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>Grand Total</span>
              <div style={{ fontSize: '1.8rem', fontWeight: '900', color: 'var(--text-light)', lineHeight: 1 }}>₹{order.totalAmount}</div>
              <span 
                className="badge-pill" 
                style={{ 
                  marginTop: '0.65rem',
                  display: 'inline-block',
                  backgroundColor: isCancelled ? 'rgba(217, 83, 79, 0.08)' : 'rgba(197, 160, 89, 0.08)', 
                  color: isCancelled ? 'var(--accent-terracotta)' : 'var(--accent-gold)',
                  border: isCancelled ? '1px solid rgba(217, 83, 79, 0.15)' : '1px solid rgba(245, 235, 221, 0.25)',
                  fontSize: '0.78rem',
                  fontWeight: '800',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}
              >
                {order.orderStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Visual Order Tracking Progress Timeline */}
        {!isCancelled && (
          <div 
            className="glass-card" 
            style={{ 
              padding: '2.5rem', 
              backgroundColor: 'transparent', 
              marginBottom: '2.5rem',
              borderRadius: '24px',
              border: '1px solid rgba(245, 235, 221, 0.25)',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.2)'
            }}
          >
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-serif)', color: 'var(--text-light)', fontWeight: '800', margin: '0 0 0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <PackageCheck size={20} color="var(--accent-gold)" />
                <span>Your Order Journey</span>
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, fontWeight: '500' }}>
                Track your MILASTY order from kitchen baking to your doorstep.
              </p>
            </div>

            {/* Desktop Horizontal Progress Line */}
            <div className="desktop-links" style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', overflowX: 'auto', padding: '1rem 0' }}>
              {/* Progress Line Connector */}
              <div 
                style={{ 
                  position: 'absolute', 
                  top: '25px', 
                  left: '60px', 
                  right: '60px', 
                  height: '3px', 
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  zIndex: 1 
                }} 
              />
              {/* Completed Active Connector Highlight */}
              {currentStageIndex > 0 && (
                <div 
                  style={{ 
                    position: 'absolute', 
                    top: '25px', 
                    left: '60px', 
                    width: `${(currentStageIndex / (STATUS_STAGES.length - 1)) * 88}%`,
                    height: '3px', 
                    backgroundColor: 'var(--accent-gold)',
                    zIndex: 1,
                    transition: 'width 0.5s ease-out'
                  }} 
                />
              )}

              {STATUS_STAGES.map((stage, idx) => {
                const isPassed = idx <= currentStageIndex;
                const isCurrent = idx === currentStageIndex;
                return (
                  <div key={stage} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: '85px', textAlign: 'center', position: 'relative', zIndex: 2 }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: isPassed ? 'var(--accent-gold)' : 'rgba(255, 255, 255, 0.05)',
                        color: isPassed ? '#24130D' : 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.85rem',
                        fontWeight: '800',
                        marginBottom: '0.75rem',
                        boxShadow: isCurrent ? '0 0 0 4px rgba(201, 154, 50, 0.15), 0 4px 10px rgba(201, 154, 50, 0.2)' : 'none',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      {isPassed ? <Check size={15} strokeWidth={3} /> : idx + 1}
                    </div>
                    <span style={{ fontSize: '0.76rem', fontWeight: isPassed ? '800' : '650', color: isPassed ? 'var(--text-light)' : 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {stage}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Mobile Vertical Timeline */}
            <div className="mobile-toggle" style={{ display: 'none', flexDirection: 'column', gap: '1.25rem', position: 'relative', paddingLeft: '1.5rem', borderLeft: '2px solid rgba(255, 255, 255, 0.05)' }}>
              {STATUS_STAGES.map((stage, idx) => {
                const isPassed = idx <= currentStageIndex;
                const isCurrent = idx === currentStageIndex;
                return (
                  <div key={stage} style={{ display: 'flex', alignItems: 'center', gap: '1rem', position: 'relative' }}>
                    {/* Circle */}
                    <div
                      style={{
                        position: 'absolute',
                        left: '-33px',
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: isPassed ? 'var(--accent-gold)' : 'rgba(255, 255, 255, 0.05)',
                        color: isPassed ? '#24130D' : 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.7rem',
                        fontWeight: '800',
                        boxShadow: isCurrent ? '0 0 0 3px rgba(201, 154, 50, 0.15)' : 'none',
                      }}
                    >
                      {isPassed ? <Check size={11} strokeWidth={3} /> : idx + 1}
                    </div>
                    <span style={{ fontSize: '0.88rem', fontWeight: isPassed ? '800' : '660', color: isPassed ? 'var(--text-light)' : 'var(--text-muted)' }}>
                      {stage}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Current Status Message Box */}
            <div 
              style={{ 
                marginTop: '2rem', 
                padding: '1.1rem 1.5rem', 
                backgroundColor: 'rgba(255, 255, 255, 0.03)', 
                borderRadius: '14px', 
                borderLeft: '4.5px solid var(--accent-gold)', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.75rem' 
              }}
            >
              <CheckCircle2 size={20} color="var(--accent-gold)" />
              <div style={{ fontSize: '0.86rem', color: 'var(--text-light)', fontWeight: '650' }}>
                <span style={{ textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: '800', marginRight: '0.4rem', color: 'var(--accent-gold)' }}>
                  {order.orderStatus}:
                </span>
                {getStatusDescriptionMessage(order.orderStatus)}
              </div>
            </div>

          </div>
        )}

        {/* Cancelled Warning Alert */}
        {isCancelled && (
          <div style={{ backgroundColor: 'rgba(217, 83, 79, 0.06)', color: 'var(--accent-terracotta)', padding: '1.25rem 1.75rem', borderRadius: '18px', marginBottom: '2.5rem', display: 'flex', alignItems: 'center', gap: '1rem', border: '1px solid rgba(217, 83, 79, 0.15)' }}>
            <AlertCircle size={24} />
            <div>
              <strong style={{ fontSize: '1rem', display: 'block', fontFamily: 'var(--font-serif)', fontWeight: '800' }}>Order Cancelled</strong>
              <span style={{ fontSize: '0.85rem', fontWeight: '500', opacity: 0.9 }}>Reason: {order.cancellationReason || 'Cancelled by customer'}</span>
            </div>
          </div>
        )}

        {/* 2-Column Details Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1.6fr))', gap: '2rem', alignItems: 'start' }}>
          
          {/* LEFT: Items, Summary, and Payment */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Items Ordered Card */}
            <div className="glass-card" style={{ padding: '2rem', backgroundColor: 'transparent', borderRadius: '24px', border: '1px solid rgba(245, 235, 221, 0.25)', boxShadow: '0 8px 30px rgba(0, 0, 0, 0.2)' }}>
              <h3 style={{ fontSize: '1.15rem', fontFamily: 'var(--font-serif)', color: 'var(--text-light)', fontWeight: '800', marginBottom: '1.5rem', margin: 0 }}>
                Items in Your Order
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1.25rem' }}>
                {order.items?.map((item, idx) => {
                  const imageSrc = item.productId?.image || item.image || 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=250&q=80';
                  return (
                    <div key={idx} style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', paddingBottom: '1rem', borderBottom: '1px solid rgba(245, 235, 221, 0.15)' }}>
                      <img 
                        src={imageSrc} 
                        alt={item.title} 
                        style={{ width: '76px', height: '76px', objectFit: 'cover', borderRadius: '12px', border: '1px solid rgba(245, 235, 221, 0.15)' }} 
                      />
                      <div style={{ flexGrow: 1 }}>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-light)', margin: '0 0 0.2rem 0', lineHeight: '1.25' }}>{item.title}</h4>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                          {item.variantName} ({item.weight}) • Qty {item.quantity}
                        </span>
                      </div>
                      <div style={{ fontWeight: '850', color: 'var(--text-light)', fontSize: '1.05rem' }}>
                        ₹{item.totalPrice}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pricing Summary Card */}
            <div className="glass-card" style={{ padding: '2rem', backgroundColor: 'transparent', borderRadius: '24px', border: '1px solid rgba(245, 235, 221, 0.25)', boxShadow: '0 8px 30px rgba(0, 0, 0, 0.2)' }}>
              <h3 style={{ fontSize: '1.15rem', fontFamily: 'var(--font-serif)', color: 'var(--text-light)', fontWeight: '800', marginBottom: '1.25rem', margin: 0 }}>
                Order Summary
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', padding: '1rem 0', borderBottom: '1px solid rgba(245, 235, 221, 0.15)', fontSize: '0.88rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                  <span>Subtotal</span>
                  <span style={{ fontWeight: '700', color: 'var(--text-light)' }}>₹{order.subtotal}</span>
                </div>
                {order.couponDiscount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--accent-gold)', fontWeight: '700' }}>
                    <span>Coupon Discount</span>
                    <span>-₹{order.couponDiscount}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                  <span>Pan-India Delivery</span>
                  <span style={{ fontWeight: '700', color: order.deliveryFee === 0 ? 'var(--accent-gold)' : 'var(--text-light)' }}>
                    {order.deliveryFee === 0 ? 'FREE' : `₹${order.deliveryFee}`}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1.25rem', fontSize: '1.1rem', fontWeight: '850', color: 'var(--text-light)' }}>
                <span>Total Paid</span>
                <span style={{ fontSize: '1.45rem', fontWeight: '900' }}>₹{order.totalAmount}</span>
              </div>
            </div>
          </div>

          {/* RIGHT: Address, Payment, Help, and Cancel options */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Delivery Details Home Card */}
            <div className="glass-card" style={{ padding: '2rem', backgroundColor: 'transparent', borderRadius: '24px', border: '1px solid rgba(245, 235, 221, 0.25)', boxShadow: '0 8px 30px rgba(0, 0, 0, 0.2)' }}>
              <h3 style={{ fontSize: '1.15rem', fontFamily: 'var(--font-serif)', color: 'var(--text-light)', fontWeight: '800', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                <MapPin size={18} color="var(--accent-gold)" />
                <span>Delivering To</span>
              </h3>
              
              <div style={{ fontSize: '0.9rem', color: 'var(--text-light)', lineHeight: '1.6', marginTop: '1.25rem' }}>
                <strong style={{ fontSize: '1rem', color: 'var(--text-light)', display: 'block', marginBottom: '0.45rem' }}>{order.customerName}</strong>
                <span style={{ color: 'var(--text-muted)', fontWeight: '500' }}>
                  {order.shippingAddress?.building && `${order.shippingAddress.building}, `}
                  {order.shippingAddress?.addressLine}<br />
                  {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}
                </span>
                
                <div style={{ marginTop: '1.1rem', paddingTop: '1rem', borderTop: '1px solid rgba(245, 235, 221, 0.15)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Mobile / WhatsApp: <strong style={{ color: 'var(--text-light)' }}>+91 {order.phone}</strong>
                </div>
              </div>
            </div>

            {/* Payment Details Card */}
            <div className="glass-card" style={{ padding: '2rem', backgroundColor: 'transparent', borderRadius: '24px', border: '1px solid rgba(245, 235, 221, 0.25)', boxShadow: '0 8px 30px rgba(0, 0, 0, 0.2)' }}>
              <h3 style={{ fontSize: '1.15rem', fontFamily: 'var(--font-serif)', color: 'var(--text-light)', fontWeight: '800', marginBottom: '1.25rem', margin: 0 }}>
                Payment
              </h3>

              <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.88rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                  <span>Method</span>
                  <span style={{ fontWeight: '750', color: 'var(--text-light)' }}>{order.paymentMethod}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Status</span>
                  <span 
                    className="badge-pill" 
                    style={{ 
                      backgroundColor: order.paymentStatus === 'Paid' ? 'rgba(39, 76, 55, 0.08)' : 'rgba(197, 160, 89, 0.08)',
                      color: order.paymentStatus === 'Paid' ? 'var(--accent-gold)' : 'var(--accent-gold)',
                      border: order.paymentStatus === 'Paid' ? '1px solid rgba(245, 235, 221, 0.25)' : '1px solid rgba(245, 235, 221, 0.25)',
                      fontSize: '0.72rem',
                      fontWeight: '800',
                      textTransform: 'uppercase',
                      padding: '0.2rem 0.55rem'
                    }}
                  >
                    {order.paymentStatus === 'Paid' ? '✓ Paid' : order.paymentStatus}
                  </span>
                </div>
              </div>
            </div>

            {/* Need Help Card */}
            <div className="glass-card" style={{ padding: '2rem', backgroundColor: 'transparent', borderRadius: '24px', border: '1px solid rgba(245, 235, 221, 0.25)', boxShadow: '0 8px 30px rgba(0, 0, 0, 0.2)' }}>
              <h3 style={{ fontSize: '1.15rem', fontFamily: 'var(--font-serif)', color: 'var(--text-light)', fontWeight: '800', marginBottom: '0.5rem', margin: 0 }}>
                Need Help?
              </h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: '0 0 1.25rem 0', fontWeight: '500' }}>
                Have a question about order delivery or ingredients?
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                <a 
                  href="https://api.whatsapp.com/send/?phone=918927142056&text=Hi%20Milasty%20Support"
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary" 
                  style={{ justifyContent: 'center', padding: '0.75rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem', borderRadius: '12px', border: '1px solid rgba(245, 235, 221, 0.25)', color: 'var(--accent-gold)', textDecoration: 'none', fontWeight: '800' }}
                >
                  <MessageCircle size={15} />
                  <span>WhatsApp Support</span>
                </a>
                <Link 
                  to="/contact" 
                  className="btn-secondary" 
                  style={{ justifyContent: 'center', padding: '0.75rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem', borderRadius: '12px', border: '1px solid rgba(245, 235, 221, 0.25)', color: 'var(--accent-gold)', textDecoration: 'none', fontWeight: '800' }}
                >
                  <HelpCircle size={15} />
                  <span>Contact Page</span>
                </Link>
              </div>
            </div>

            {/* Cancel order box */}
            {(order.orderStatus === 'Pending' || order.orderStatus === 'Confirmed') && (
              <div 
                className="glass-card animate-slide-up" 
                style={{ 
                  padding: '1.5rem 1.75rem', 
                  backgroundColor: 'rgba(217, 83, 79, 0.04)', 
                  borderRadius: '20px', 
                  border: '1px solid rgba(217, 83, 79, 0.25)' 
                }}
              >
                <h4 style={{ color: 'var(--accent-terracotta)', marginBottom: '0.35rem', fontSize: '0.98rem', fontWeight: '800', margin: 0 }}>Cancel Order</h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1rem', marginTop: '0.25rem', fontWeight: '500' }}>
                  Orders can be cancelled before they enter the processing/baking stage.
                </p>
                {cancelError && <div style={{ color: 'var(--accent-terracotta)', fontSize: '0.78rem', marginBottom: '0.5rem', fontWeight: '600' }}>{cancelError}</div>}
                <form onSubmit={handleCancelOrder} style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    required
                    placeholder="Reason for cancelling"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    style={{ flexGrow: 1, padding: '0.6rem 0.85rem', borderRadius: '10px', border: '1px solid rgba(245, 235, 221, 0.25)', fontSize: '0.82rem', outline: 'none', fontFamily: 'inherit', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-light)' }}
                  />
                  <button 
                    type="submit" 
                    disabled={cancelLoading} 
                    className="btn-secondary" 
                    style={{ 
                      color: 'var(--accent-terracotta)', 
                      borderColor: 'var(--accent-terracotta)', 
                      padding: '0.6rem 1.1rem', 
                      fontSize: '0.82rem',
                      fontWeight: '800',
                      borderRadius: '10px',
                      cursor: 'pointer'
                    }}
                  >
                    {cancelLoading ? 'Cancelling...' : 'Cancel'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* Global Copied Clipboard Toast Notification */}
        {copyToast && (
          <div 
            style={{ 
              position: 'fixed', 
              bottom: '24px', 
              left: '50%', 
              transform: 'translateX(-50%)', 
              backgroundColor: 'var(--accent-gold)', 
              color: '#24130D', 
              padding: '0.65rem 1.25rem', 
              borderRadius: '999px', 
              fontSize: '0.82rem', 
              fontWeight: '800', 
              zIndex: 300,
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
            className="animate-slide-up"
          >
            <Check size={14} color="#24130D" />
            <span>Order ID copied to clipboard</span>
          </div>
        )}

        {/* Bottom CTA Block */}
        <div style={{ textAlign: 'center', marginTop: '3.5rem' }}>
          <Link 
            to="/shop" 
            className="btn-primary" 
            style={{ 
              padding: '0.95rem 2.25rem', 
              backgroundColor: 'var(--accent-gold)', 
              color: '#24130D', 
              borderRadius: '999px',
              fontWeight: '800',
              textDecoration: 'none',
              fontSize: '0.9rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <span>Continue Shopping</span>
            <ArrowRight size={16} />
          </Link>
        </div>

      </div>
    </div>
  );
}
