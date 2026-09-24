import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, ArrowRight, Truck, ShieldCheck } from 'lucide-react';
import api from '../api/axios';

export default function OrderSuccessPage() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      const res = await api.get(`/orders/detail/${orderId}`);
      setOrder(res.data);
    } catch (err) {
      console.error('Error fetching order details:', err);
    } finally {
      setLoading(false);
    }
  };

  const formattedAddressString = typeof order?.shippingAddress === 'object' && order?.shippingAddress !== null
    ? [order.shippingAddress.building, order.shippingAddress.addressLine, order.shippingAddress.city, order.shippingAddress.state, order.shippingAddress.pincode].filter(Boolean).join(', ')
    : String(order?.shippingAddress || 'Delivery Address Provided');

  const isPaid = String(order?.paymentStatus || '').toLowerCase() === 'paid';
  const displayPaymentStatus = isPaid ? '✓ PAID SUCCESSFULLY' : String(order?.paymentStatus || 'Pending').toUpperCase();

  return (
    <div style={{
      backgroundColor: '#F5EBDD',
      backgroundImage: 'linear-gradient(rgba(245, 235, 221, 0.88), rgba(245, 235, 221, 0.88)), url(/images/about_background_image.jpeg)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      minHeight: '90vh',
      padding: '5rem 0 6rem',
      display: 'flex',
      alignItems: 'center'
    }}>
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
              backgroundColor: '#FBF6ED',
              padding: '0.5rem 1.25rem',
              borderRadius: '999px',
              border: '1px solid #E4D1B7'
            }}
          >
            <span style={{ color: '#2F6B3A' }}>✓ Cart</span>
            <span style={{ color: '#E4D1B7' }}>•</span>
            <span style={{ color: '#2F6B3A' }}>✓ Delivery & Payment</span>
            <span style={{ color: '#E4D1B7' }}>•</span>
            <span style={{ color: '#2B140B', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#2F6B3A' }} />
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
            backgroundColor: '#FBF6ED',
            borderRadius: '24px',
            border: '1px solid #E4D1B7',
            boxShadow: '0 4px 20px rgba(43, 20, 11, 0.06)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Animated decorative sparks */}
          <div style={{ position: 'absolute', top: '1rem', left: '1rem', color: '#2F6B3A', opacity: 0.3 }}>✦</div>
          <div style={{ position: 'absolute', bottom: '1.5rem', right: '1.5rem', color: '#2F6B3A', opacity: 0.3 }}>✦</div>

          {/* Checkmark Badge */}
          <div 
            style={{ 
              width: '80px', 
              height: '80px', 
              borderRadius: '50%', 
              backgroundColor: '#EAEFE5', 
              color: '#2F6B3A', 
              display: 'inline-flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              marginBottom: '1.75rem',
              border: '2px solid #2F6B3A',
              boxShadow: '0 4px 12px rgba(47, 107, 58, 0.15)'
            }}
          >
            <CheckCircle2 size={44} strokeWidth={1.5} />
          </div>

          <h1 style={{ fontSize: '2.1rem', fontFamily: 'var(--font-serif)', color: '#2B140B', fontWeight: '800', marginBottom: '0.75rem', letterSpacing: '-0.01em' }}>
            Order Confirmed
          </h1>
          <p style={{ color: '#6B584C', fontSize: '0.98rem', lineHeight: '1.6', marginBottom: '2.25rem', maxWidth: '480px', margin: '0 auto 2.25rem' }}>
            Thank you for choosing MILASTY. Your order has been placed successfully and queued for fresh artisan baking.
          </p>

          {/* Details summary block */}
          {loading ? (
            <div style={{ padding: '2rem 0', color: '#6B584C', fontSize: '0.9rem' }}>Loading order details...</div>
          ) : (
            order && (
              <div 
                style={{ 
                  backgroundColor: '#FFFFFF', 
                  padding: '1.5rem', 
                  borderRadius: '16px', 
                  textAlign: 'left', 
                  marginBottom: '2.5rem', 
                  border: '1px solid #E4D1B7',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.85rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #E4D1B7', paddingBottom: '0.65rem', fontSize: '0.9rem' }}>
                  <span style={{ color: '#6B584C', fontWeight: '600' }}>Order ID:</span>
                  <span style={{ fontWeight: '800', color: '#2B140B' }}>#{order.orderNumber || order.orderId}</span>
                </div>
                {order.customerName && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #E4D1B7', paddingBottom: '0.65rem', fontSize: '0.9rem' }}>
                    <span style={{ color: '#6B584C', fontWeight: '600' }}>Customer:</span>
                    <span style={{ fontWeight: '700', color: '#2B140B' }}>{order.customerName}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #E4D1B7', paddingBottom: '0.65rem', fontSize: '0.9rem' }}>
                  <span style={{ color: '#6B584C', fontWeight: '600' }}>Payment Method:</span>
                  <span style={{ fontWeight: '800', color: '#2F6B3A' }}>{order.paymentMethod}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #E4D1B7', paddingBottom: '0.65rem', fontSize: '0.9rem' }}>
                  <span style={{ color: '#6B584C', fontWeight: '600' }}>Payment Status:</span>
                  <span style={{ fontWeight: '800', color: isPaid ? '#2F6B3A' : '#D4AC0D', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                    <ShieldCheck size={14} />
                    {displayPaymentStatus}
                  </span>
                </div>
                {order.paymentId && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #E4D1B7', paddingBottom: '0.65rem', fontSize: '0.85rem' }}>
                    <span style={{ color: '#6B584C', fontWeight: '600' }}>Payment ID:</span>
                    <span style={{ fontWeight: '700', color: '#2B140B' }}>{order.paymentId}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #E4D1B7', paddingBottom: '0.65rem', fontSize: '0.9rem' }}>
                  <span style={{ color: '#6B584C', fontWeight: '600' }}>Delivery To:</span>
                  <span style={{ fontWeight: '700', color: '#2B140B', textAlign: 'right', maxWidth: '300px', fontSize: '0.85rem' }}>
                    {formattedAddressString}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.4rem', fontSize: '1.1rem', fontWeight: '900', color: '#2B140B' }}>
                  <span>Total Amount:</span>
                  <span>₹{order.totalAmount || order.grandTotal || 0}</span>
                </div>
              </div>
            )
          )}

          {/* Action CTAs */}
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link 
              to="/account/orders" 
              className="btn-primary" 
              style={{ 
                padding: '0.85rem 1.75rem', 
                backgroundColor: '#2F6B3A', 
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '999px',
                fontWeight: '800',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.88rem',
                boxShadow: '0 4px 16px rgba(47, 107, 58, 0.25)'
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
                border: '1px solid #E4D1B7',
                color: '#2B140B',
                borderRadius: '999px',
                fontWeight: '800',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.88rem',
                backgroundColor: '#FFFFFF'
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
