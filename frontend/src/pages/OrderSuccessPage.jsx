import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, Truck, ArrowRight, ShoppingBag, ShieldCheck } from 'lucide-react';
import api from '../api/axios';

export default function OrderSuccessPage() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const res = await api.get(`/orders/detail/${orderId}`);
      setOrder(res.data);
    } catch (e) {
      console.error('Error fetching order', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: 'var(--bg-main)', minHeight: '90vh', padding: '5rem 0 6rem', display: 'flex', alignItems: 'center' }}>
      <div className="container" style={{ maxWidth: '640px' }}>
        
        {/* Step Indicator Header */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div 
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '0.75rem', 
              fontSize: '0.8rem', 
              fontWeight: '700', 
              textTransform: 'uppercase', 
              letterSpacing: '0.08em',
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              padding: '0.5rem 1.25rem',
              borderRadius: '999px',
              border: '1px solid rgba(245, 235, 221, 0.15)'
            }}
          >
            <span style={{ color: 'var(--accent-gold)' }}>✓ Cart</span>
            <span style={{ color: 'var(--text-muted)' }}>•</span>
            <span style={{ color: 'var(--accent-gold)' }}>✓ Delivery & Payment</span>
            <span style={{ color: 'var(--text-muted)' }}>•</span>
            <span style={{ color: 'var(--text-light)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--accent-gold)' }} />
              Confirmation
            </span>
          </div>
        </div>

        {/* Main Success Card */}
        <div 
          className="glass-card animate-slide-up" 
          style={{ 
            padding: '3.5rem 2.5rem', 
            textAlign: 'center', 
            backgroundColor: 'rgba(50, 26, 18, 0.60)',
            borderRadius: '24px',
            border: '1px solid rgba(245, 235, 221, 0.25)',
            boxShadow: 'var(--shadow-md)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Animated decorative sparks */}
          <div style={{ position: 'absolute', top: '1rem', left: '1rem', color: 'var(--accent-gold)', opacity: 0.3 }}>✦</div>
          <div style={{ position: 'absolute', bottom: '1.5rem', right: '1.5rem', color: 'var(--accent-gold)', opacity: 0.3 }}>✦</div>

          {/* Animated Checkmark Badge */}
          <div 
            style={{ 
              width: '80px', 
              height: '80px', 
              borderRadius: '50%', 
              backgroundColor: 'rgba(197, 160, 89, 0.08)', 
              color: 'var(--accent-gold)', 
              display: 'inline-flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              marginBottom: '1.75rem',
              border: '2px solid rgba(197, 160, 89, 0.15)',
              boxShadow: '0 4px 12px rgba(197, 160, 89, 0.05)'
            }}
          >
            <CheckCircle2 size={44} strokeWidth={1.5} />
          </div>

          <h1 style={{ fontSize: '2.1rem', fontFamily: 'var(--font-serif)', color: 'var(--text-light)', fontWeight: '800', marginBottom: '0.75rem', letterSpacing: '-0.01em' }}>
            Order Confirmed
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.98rem', lineHeight: '1.6', marginBottom: '2.25rem', maxWidth: '480px', margin: '0 auto 2.25rem' }}>
            Thank you for choosing MILASTY. Your payment was verified successfully and your order has been queued for fresh small-batch baking.
          </p>

          {/* Details summary block */}
          {loading ? (
            <div style={{ padding: '2rem 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading order details...</div>
          ) : (
            order && (
              <div 
                style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.03)', 
                  padding: '1.5rem', 
                  borderRadius: '16px', 
                  textAlign: 'left', 
                  marginBottom: '2.5rem', 
                  border: '1px solid rgba(245, 235, 221, 0.15)' 
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(245, 235, 221, 0.15)', paddingBottom: '0.85rem', marginBottom: '0.85rem', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Order ID:</span>
                  <span style={{ fontWeight: '800', color: 'var(--text-light)' }}>#{order.orderId}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(245, 235, 221, 0.15)', paddingBottom: '0.85rem', marginBottom: '0.85rem', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Payment Status:</span>
                  <span style={{ fontWeight: '800', color: 'var(--accent-gold)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                    <ShieldCheck size={14} />
                    {order.paymentStatus === 'Paid' ? 'PAID SUCCESSFULLY' : order.paymentStatus.toUpperCase()}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(245, 235, 221, 0.15)', paddingBottom: '0.85rem', marginBottom: '0.85rem', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Delivery Address:</span>
                  <span style={{ fontWeight: '700', color: 'var(--text-light)', textAlign: 'right', maxWidth: '280px', fontSize: '0.85rem' }}>
                    {order.shippingAddress.addressLine}, {order.shippingAddress.city}, {order.shippingAddress.pincode}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.4rem', fontSize: '1.1rem', fontWeight: '900', color: 'var(--text-light)' }}>
                  <span>Total Amount Paid:</span>
                  <span>₹{order.totalAmount}</span>
                </div>
              </div>
            )
          )}

          {/* Action CTAs */}
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link 
              to={order ? `/account/orders/${orderId || order._id}` : '/account/orders'} 
              className="btn-primary" 
              style={{ 
                padding: '0.85rem 1.75rem', 
                backgroundColor: 'var(--accent-gold)', 
                color: '#24130D',
                border: 'none',
                borderRadius: '12px',
                fontWeight: '800',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.88rem'
              }}
            >
              <Truck size={16} />
              <span>Track My Order</span>
            </Link>
            <Link 
              to="/shop" 
              className="btn-secondary" 
              style={{ 
                padding: '0.85rem 1.75rem',
                borderColor: 'rgba(245, 235, 221, 0.25)',
                color: 'var(--accent-gold)',
                borderRadius: '12px',
                fontWeight: '800',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.88rem',
                backgroundColor: 'transparent'
              }}
            >
              <span>Continue Shopping</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
