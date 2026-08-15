import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, CreditCard, Truck, CheckCircle2, Lock, ArrowRight, ArrowLeft, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { cartItems, subtotal, deliveryFee, grandTotal, appliedCoupon, couponDiscountAmount, clearCart } = useCart();
  const { user } = useAuth();

  // Load Razorpay script dynamically
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const [formData, setFormData] = useState({
    customerName: user ? user.name : '',
    email: user ? user.email : '',
    phone: user ? user.phone || '' : '',
    building: user?.addresses?.[0]?.building || '',
    addressLine: user?.addresses?.[0]?.addressLine || '',
    city: user?.addresses?.[0]?.city || '',
    state: user?.addresses?.[0]?.state || '',
    pincode: user?.addresses?.[0]?.pincode || '',
  });

  const [paymentMethod, setPaymentMethod] = useState('Razorpay'); // 'Razorpay' or 'COD'
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [showSimulatedPaymentModal, setShowSimulatedPaymentModal] = useState(false);
  const [simulatePaymentData, setSimulatePaymentData] = useState(null);

  if (cartItems.length === 0) {
    return (
      <div style={{ padding: '6rem 0', textAlign: 'center', backgroundColor: '#FCFAF6', minHeight: '80vh' }}>
        <div style={{ maxWidth: '400px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
          <ShoppingBag size={48} color="var(--accent-gold)" />
          <h2 style={{ fontFamily: 'var(--font-serif)', color: 'var(--primary-dark)', fontSize: '1.8rem', fontWeight: '800' }}>Your cart is empty</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Add some premium millet bakes to your basket to proceed.</p>
          <button onClick={() => navigate('/shop')} className="btn-primary" style={{ padding: '0.85rem 2rem', backgroundColor: 'var(--primary-dark)', border: 'none', borderRadius: '999px', cursor: 'pointer' }}>
            Back to Shop
          </button>
        </div>
      </div>
    );
  }

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrorMessage('');
    if (fieldErrors[e.target.name]) {
      setFieldErrors({ ...fieldErrors, [e.target.name]: '' });
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.customerName.trim()) errors.customerName = 'Full name is required';
    
    // Phone validation (exactly 10 digits)
    const cleanPhone = formData.phone.trim();
    if (!cleanPhone) {
      errors.phone = 'Mobile number is required';
    } else if (!/^\d{10}$/.test(cleanPhone.replace(/[\s-+]/g, '').slice(-10))) {
      errors.phone = 'Please enter a valid 10-digit mobile number';
    }

    if (!formData.addressLine.trim()) errors.addressLine = 'Street address is required';
    if (!formData.city.trim()) errors.city = 'City is required';
    if (!formData.state.trim()) errors.state = 'State is required';
    
    // Pincode validation (6 digits)
    const cleanPin = formData.pincode.trim();
    if (!cleanPin) {
      errors.pincode = 'Pincode is required';
    } else if (!/^\d{6}$/.test(cleanPin)) {
      errors.pincode = 'Please enter a valid 6-digit pincode';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      setErrorMessage('Please correct the validation errors in delivery details.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const orderPayload = {
        customerName: formData.customerName,
        email: formData.email,
        phone: formData.phone,
        shippingAddress: {
          addressLine: formData.addressLine,
          building: formData.building,
          city: formData.city,
          state: formData.state,
          country: 'India',
          pincode: formData.pincode,
        },
        items: cartItems,
        couponCode: appliedCoupon ? appliedCoupon.code : null,
        paymentMethod,
      };

      // 1. Create Order on Backend (Set to Pending Payment for Razorpay)
      const orderRes = await api.post('/orders', orderPayload);
      const order = orderRes.data.order;
      const orderId = order.orderId;

      if (paymentMethod === 'COD') {
        clearCart();
        navigate(`/order-success/${orderId}`);
        return;
      }

      // 2. Initiate Online Payment via Razorpay
      console.log("Creating Razorpay order on backend", {
        amount: grandTotal,
        orderId
      });
      const payRes = await api.post('/payments/create', { amount: grandTotal, orderId });
      const { keyId, razorpayOrderId, amount, currency } = payRes.data;

      console.log("Razorpay order created", {
        orderId: razorpayOrderId,
        amount,
        currency
      });

      const options = {
        key: keyId,
        amount,
        currency,
        name: 'MILASTY Foods',
        description: `Order #${orderId}`,
        image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=200&q=80',
        order_id: razorpayOrderId,
        handler: async function (response) {
          console.log("Razorpay payment response captured", response);
          try {
            // Verify payment signature
            const verifyRes = await api.post('/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId,
            });

            if (verifyRes.data.success) {
              clearCart();
              navigate(`/order-success/${orderId}`);
            } else {
              setErrorMessage('Payment verification failed. Please contact Milasty support.');
            }
          } catch (err) {
            console.error("Razorpay payment verification failed on backend", err);
            setErrorMessage('Error verifying payment. If amount was debited, contact our helpline.');
          }
        },
        prefill: {
          name: formData.customerName,
          email: formData.email,
          contact: formData.phone,
        },
        theme: {
          color: '#381423', // Deep Plum
        },
        modal: {
          ondismiss: function () {
            console.error("Razorpay payment cancelled by user");
            setErrorMessage('Payment was cancelled. You can retry below.');
            setLoading(false);
          }
        }
      };

      const isDummyKey = keyId.startsWith('rzp_test_MILASTY');
      if (window.Razorpay && !isDummyKey) {
        console.log("Opening Razorpay Checkout", {
          keyId,
          orderId: razorpayOrderId,
          amount,
          currency
        });
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        // Show our beautiful custom simulation payment modal!
        console.warn("Using simulated sandbox payment since Key ID is dummy/mock.", {
          keyId,
          orderId: razorpayOrderId,
          amount,
          currency
        });
        setSimulatePaymentData({
          orderId,
          razorpayOrderId,
          amount,
          currency,
          customerName: formData.customerName,
          email: formData.email,
          phone: formData.phone,
          options
        });
        setShowSimulatedPaymentModal(true);
      }
    } catch (error) {
      console.error("Razorpay payment failed", error);
      setErrorMessage(error.response?.data?.message || 'Error processing your order. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#FCFAF6', minHeight: '100vh', padding: '2.5rem 0 5rem' }}>
      <div className="container" style={{ maxWidth: '1200px' }}>
        
        {/* Step Indicator Header */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1 style={{ fontSize: '2rem', fontFamily: 'var(--font-serif)', color: 'var(--primary-dark)', fontWeight: '800', marginBottom: '1.25rem' }}>
            Checkout
          </h1>
          <div 
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '0.75rem', 
              fontSize: '0.8rem', 
              fontWeight: '700', 
              textTransform: 'uppercase', 
              letterSpacing: '0.08em',
              backgroundColor: 'rgba(56, 20, 35, 0.03)',
              padding: '0.5rem 1.25rem',
              borderRadius: '999px',
              border: '1px solid var(--border-color)'
            }}
          >
            <span style={{ color: 'var(--accent-olive)' }}>✓ Cart</span>
            <span style={{ color: 'var(--text-muted)' }}>•</span>
            <span style={{ color: 'var(--primary-dark)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--accent-gold)' }} />
              Delivery & Payment
            </span>
            <span style={{ color: 'var(--text-muted)' }}>•</span>
            <span style={{ color: 'var(--text-muted)' }}>Confirmation</span>
          </div>
        </div>

        {/* Checkout Columns */}
        <form onSubmit={handlePlaceOrder} className="checkout-form" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '2.5rem', alignItems: 'start' }}>
          
          {/* LEFT: Shipping Form & Payments */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Delivery address details card */}
            <div className="glass-card" style={{ padding: '2rem', backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1.5px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
              <h2 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-serif)', color: 'var(--primary-dark)', fontWeight: '800', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                <Truck size={20} color="var(--accent-gold)" />
                <span>1. Shipping Details</span>
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
                
                {/* Full name input */}
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--primary-dark)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Full Name *</label>
                  <input 
                    type="text" 
                    required 
                    name="customerName" 
                    value={formData.customerName} 
                    onChange={handleInputChange} 
                    placeholder="Ananya Sharma" 
                    style={{ width: '100%', padding: '0.75rem 0.95rem', borderRadius: '10px', border: fieldErrors.customerName ? '1.5px solid var(--accent-terracotta)' : '1.5px solid var(--border-color)', fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit', backgroundColor: 'var(--bg-subtle)' }} 
                  />
                  {fieldErrors.customerName && <span style={{ fontSize: '0.75rem', color: 'var(--accent-terracotta)', fontWeight: '600', marginTop: '0.25rem', display: 'block' }}>{fieldErrors.customerName}</span>}
                </div>

                {/* Email and Phone grid */}
                <div className="checkout-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--primary-dark)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Email Address</label>
                    <input 
                      type="email" 
                      name="email" 
                      value={formData.email} 
                      onChange={handleInputChange} 
                      placeholder="ananya@gmail.com" 
                      style={{ width: '100%', padding: '0.75rem 0.95rem', borderRadius: '10px', border: '1.5px solid var(--border-color)', fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit', backgroundColor: 'var(--bg-subtle)' }} 
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--primary-dark)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Phone Number *</label>
                    <input 
                      type="tel" 
                      required 
                      name="phone" 
                      value={formData.phone} 
                      onChange={handleInputChange} 
                      placeholder="9876543210" 
                      style={{ width: '100%', padding: '0.75rem 0.95rem', borderRadius: '10px', border: fieldErrors.phone ? '1.5px solid var(--accent-terracotta)' : '1.5px solid var(--border-color)', fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit', backgroundColor: 'var(--bg-subtle)' }} 
                    />
                    {fieldErrors.phone && <span style={{ fontSize: '0.75rem', color: 'var(--accent-terracotta)', fontWeight: '600', marginTop: '0.25rem', display: 'block' }}>{fieldErrors.phone}</span>}
                  </div>
                </div>

                {/* Building / House Details */}
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--primary-dark)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Flat / House / Building Details</label>
                  <input 
                    type="text" 
                    name="building" 
                    value={formData.building} 
                    onChange={handleInputChange} 
                    placeholder="Flat 402, B Block, Royal Palm Apartments" 
                    style={{ width: '100%', padding: '0.75rem 0.95rem', borderRadius: '10px', border: '1.5px solid var(--border-color)', fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit', backgroundColor: 'var(--bg-subtle)' }} 
                  />
                </div>

                {/* Street address details textarea */}
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--primary-dark)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Street Address *</label>
                  <textarea 
                    rows={2} 
                    required 
                    name="addressLine" 
                    value={formData.addressLine} 
                    onChange={handleInputChange} 
                    placeholder="Main Street, Sector 62, Near Landmark Park" 
                    style={{ width: '100%', padding: '0.75rem 0.95rem', borderRadius: '10px', border: fieldErrors.addressLine ? '1.5px solid var(--accent-terracotta)' : '1.5px solid var(--border-color)', fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit', backgroundColor: 'var(--bg-subtle)', resize: 'none' }} 
                  />
                  {fieldErrors.addressLine && <span style={{ fontSize: '0.75rem', color: 'var(--accent-terracotta)', fontWeight: '600', marginTop: '0.25rem', display: 'block' }}>{fieldErrors.addressLine}</span>}
                </div>

                {/* City, State, Pincode grid */}
                <div className="checkout-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: '800', color: 'var(--primary-dark)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>City *</label>
                    <input 
                      type="text" 
                      required 
                      name="city" 
                      value={formData.city} 
                      onChange={handleInputChange} 
                      placeholder="City" 
                      style={{ width: '100%', padding: '0.75rem 0.75rem', borderRadius: '10px', border: fieldErrors.city ? '1.5px solid var(--accent-terracotta)' : '1.5px solid var(--border-color)', fontSize: '0.88rem', outline: 'none', fontFamily: 'inherit', backgroundColor: 'var(--bg-subtle)' }} 
                    />
                    {fieldErrors.city && <span style={{ fontSize: '0.72rem', color: 'var(--accent-terracotta)', fontWeight: '600', marginTop: '0.25rem', display: 'block' }}>{fieldErrors.city}</span>}
                  </div>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: '800', color: 'var(--primary-dark)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>State *</label>
                    <input 
                      type="text" 
                      required 
                      name="state" 
                      value={formData.state} 
                      onChange={handleInputChange} 
                      placeholder="State" 
                      style={{ width: '100%', padding: '0.75rem 0.75rem', borderRadius: '10px', border: fieldErrors.state ? '1.5px solid var(--accent-terracotta)' : '1.5px solid var(--border-color)', fontSize: '0.88rem', outline: 'none', fontFamily: 'inherit', backgroundColor: 'var(--bg-subtle)' }} 
                    />
                    {fieldErrors.state && <span style={{ fontSize: '0.72rem', color: 'var(--accent-terracotta)', fontWeight: '600', marginTop: '0.25rem', display: 'block' }}>{fieldErrors.state}</span>}
                  </div>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: '800', color: 'var(--primary-dark)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Pincode *</label>
                    <input 
                      type="text" 
                      required 
                      name="pincode" 
                      value={formData.pincode} 
                      onChange={handleInputChange} 
                      placeholder="201306" 
                      style={{ width: '100%', padding: '0.75rem 0.75rem', borderRadius: '10px', border: fieldErrors.pincode ? '1.5px solid var(--accent-terracotta)' : '1.5px solid var(--border-color)', fontSize: '0.88rem', outline: 'none', fontFamily: 'inherit', backgroundColor: 'var(--bg-subtle)' }} 
                    />
                    {fieldErrors.pincode && <span style={{ fontSize: '0.72rem', color: 'var(--accent-terracotta)', fontWeight: '600', marginTop: '0.25rem', display: 'block' }}>{fieldErrors.pincode}</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Payment method selection card */}
            <div className="glass-card" style={{ padding: '2rem', backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1.5px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
              <h2 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-serif)', color: 'var(--primary-dark)', fontWeight: '800', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                <CreditCard size={20} color="var(--accent-gold)" />
                <span>2. Payment Option</span>
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
                
                {/* Razorpay Online */}
                <label 
                  onClick={() => setPaymentMethod('Razorpay')} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.75rem', 
                    padding: '1.1rem', 
                    borderRadius: '14px', 
                    border: paymentMethod === 'Razorpay' ? '2.5px solid var(--primary-dark)' : '1.5px solid var(--border-color)', 
                    backgroundColor: paymentMethod === 'Razorpay' ? 'rgba(56, 20, 35, 0.02)' : '#FFFFFF', 
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <input 
                    type="radio" 
                    name="payment" 
                    value="Razorpay" 
                    checked={paymentMethod === 'Razorpay'} 
                    onChange={() => setPaymentMethod('Razorpay')} 
                    style={{ accentColor: 'var(--primary-dark)', width: '17px', height: '17px' }}
                  />
                  <div>
                    <div style={{ fontWeight: '800', color: 'var(--primary-dark)', fontSize: '0.95rem' }}>Secure Online Checkout (Razorpay)</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>Pay instantly using UPI, Cards, Netbanking, or Wallets</div>
                  </div>
                </label>

                {/* Cash on Delivery */}
                <label 
                  onClick={() => setPaymentMethod('COD')} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.75rem', 
                    padding: '1.1rem', 
                    borderRadius: '14px', 
                    border: paymentMethod === 'COD' ? '2.5px solid var(--primary-dark)' : '1.5px solid var(--border-color)', 
                    backgroundColor: paymentMethod === 'COD' ? 'rgba(56, 20, 35, 0.02)' : '#FFFFFF', 
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <input 
                    type="radio" 
                    name="payment" 
                    value="COD" 
                    checked={paymentMethod === 'COD'} 
                    onChange={() => setPaymentMethod('COD')} 
                    style={{ accentColor: 'var(--primary-dark)', width: '17px', height: '17px' }}
                  />
                  <div>
                    <div style={{ fontWeight: '800', color: 'var(--primary-dark)', fontSize: '0.95rem' }}>Cash on Delivery (COD)</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>Pay in cash at your doorstep when products arrive</div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* RIGHT: Order Summary details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'sticky', top: '100px' }}>
            <div className="glass-card" style={{ padding: '2rem', backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1.5px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
              <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-serif)', color: 'var(--primary-dark)', fontWeight: '800', marginBottom: '1.5rem', margin: 0 }}>
                Order Summary
              </h3>

              {/* Items listing */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingBottom: '1.5rem', borderBottom: '1.5px solid var(--border-color)', marginTop: '1.25rem' }}>
                {cartItems.map((item) => (
                  <div key={item.key} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <img 
                      src={item.image} 
                      alt={item.title} 
                      style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px', border: '1px solid rgba(56,20,35,0.06)' }} 
                    />
                    <div style={{ flexGrow: 1 }}>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--primary-dark)', margin: '0 0 0.15rem 0', lineHeight: '1.25' }}>{item.title}</h4>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block' }}>
                        Qty: {item.quantity} • {item.variantName} ({item.weight})
                      </span>
                    </div>
                    <span style={{ fontWeight: '800', color: 'var(--primary-dark)', fontSize: '0.95rem' }}>
                      ₹{item.totalPrice}
                    </span>
                  </div>
                ))}
              </div>

              {/* Cost Summary calculations */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', padding: '1.5rem 0', borderBottom: '1.5px solid var(--border-color)', fontSize: '0.88rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                  <span>Subtotal</span>
                  <span style={{ fontWeight: '700', color: 'var(--primary-dark)' }}>₹{subtotal}</span>
                </div>
                {couponDiscountAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--accent-olive)', fontWeight: '700' }}>
                    <span>Coupon Discount</span>
                    <span>-₹{couponDiscountAmount}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                  <span>Pan-India Delivery</span>
                  <span style={{ fontWeight: '700', color: deliveryFee === 0 ? 'var(--accent-olive)' : 'var(--primary-dark)' }}>
                    {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
                  </span>
                </div>
              </div>

              {/* Grand Total */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 0 1rem', marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '1.05rem', fontWeight: '850', color: 'var(--primary-dark)' }}>Total to Pay</span>
                <span style={{ fontSize: '1.4rem', fontWeight: '900', color: 'var(--primary-dark)' }}>₹{grandTotal}</span>
              </div>

              {errorMessage && (
                <div style={{ backgroundColor: 'rgba(217, 83, 79, 0.08)', border: '1px solid var(--accent-terracotta)', color: 'var(--accent-terracotta)', padding: '0.85rem 1rem', borderRadius: '10px', fontSize: '0.82rem', marginBottom: '1.5rem', fontWeight: '600' }}>
                  {errorMessage}
                </div>
              )}

              {/* Submit Checkout Button */}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{ 
                  width: '100%', 
                  justifyContent: 'center', 
                  padding: '1rem', 
                  fontSize: '0.95rem', 
                  backgroundColor: 'var(--primary-dark)', 
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: '800',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'opacity 0.2s'
                }}
              >
                {loading ? (
                  <span>{paymentMethod === 'COD' ? 'Placing Order...' : 'Initiating Secure Checkout...'}</span>
                ) : paymentMethod === 'COD' ? (
                  <>
                    <CheckCircle2 size={15} />
                    <span>Place Order (₹{grandTotal})</span>
                  </>
                ) : (
                  <>
                    <Lock size={15} />
                    <span>Pay ₹{grandTotal} Securely</span>
                  </>
                )}
              </button>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: '600', marginTop: '1rem' }}>
                <ShieldCheck size={14} color="var(--accent-olive)" />
                <span>Encrypted 256-bit SSL secure checkout payment</span>
              </div>

            </div>
          </div>

        </form>
      </div>

      {/* Simulated Payment Modal */}
      {showSimulatedPaymentModal && simulatePaymentData && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(56, 20, 35, 0.4)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div 
            className="glass-card" 
            style={{ 
              backgroundColor: '#FFFFFF', 
              borderRadius: '24px', 
              border: '1.5px solid var(--border-color)', 
              width: '100%', 
              maxWidth: '460px', 
              padding: '2.5rem',
              boxShadow: 'var(--shadow-lg)',
              position: 'relative'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Lock size={18} color="var(--primary-dark)" />
              <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent-gold)', fontWeight: '800' }}>MILASTY SECURE PAYMENT</span>
            </div>
            <h3 style={{ fontSize: '1.4rem', fontFamily: 'var(--font-serif)', color: 'var(--primary-dark)', fontWeight: '800', marginBottom: '1.25rem', margin: 0 }}>
              Razorpay Sandbox Simulator
            </h3>
            
            <div style={{ backgroundColor: '#FCFAF6', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Customer Name</span>
                <span style={{ fontWeight: '700', color: 'var(--primary-dark)' }}>{simulatePaymentData.customerName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Order ID</span>
                <span style={{ fontWeight: '700', color: 'var(--primary-dark)' }}>{simulatePaymentData.orderId}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Amount to Pay</span>
                <span style={{ fontWeight: '850', color: 'var(--primary-dark)', fontSize: '1.05rem' }}>₹{simulatePaymentData.amount / 100}</span>
              </div>
            </div>

            {/* Simulated Payment Card Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.75rem' }}>
              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--primary-dark)', display: 'block', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Card Number</label>
                <input type="text" readOnly value="4111 1111 1111 1111" style={{ width: '100%', height: '42px', padding: '0 0.75rem', borderRadius: '8px', border: '1.5px solid var(--border-color)', fontSize: '0.88rem', outline: 'none', backgroundColor: '#FCFAF6', color: 'var(--primary-dark)', letterSpacing: '0.05em' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--primary-dark)', display: 'block', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Expiry</label>
                  <input type="text" readOnly value="12/29" style={{ width: '100%', height: '42px', padding: '0 0.75rem', borderRadius: '8px', border: '1.5px solid var(--border-color)', fontSize: '0.88rem', outline: 'none', backgroundColor: '#FCFAF6', color: 'var(--primary-dark)' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--primary-dark)', display: 'block', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>CVV</label>
                  <input type="password" readOnly value="•••" style={{ width: '100%', height: '42px', padding: '0 0.75rem', borderRadius: '8px', border: '1.5px solid var(--border-color)', fontSize: '0.88rem', outline: 'none', backgroundColor: '#FCFAF6', color: 'var(--primary-dark)' }} />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button 
                type="button"
                onClick={async () => {
                  setShowSimulatedPaymentModal(false);
                  const response = {
                    razorpay_order_id: simulatePaymentData.razorpayOrderId,
                    razorpay_payment_id: 'pay_test_' + Math.random().toString(36).substring(2, 10),
                    razorpay_signature: 'test_signature'
                  };
                  await simulatePaymentData.options.handler(response);
                }}
                className="btn-primary"
                style={{ width: '100%', height: '48px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--accent-olive)', border: 'none', color: '#FFFFFF', fontWeight: '850', cursor: 'pointer', fontSize: '0.88rem' }}
              >
                Simulate Success Payment
              </button>
              <button 
                type="button"
                onClick={async () => {
                  setShowSimulatedPaymentModal(false);
                  const response = {
                    razorpay_order_id: simulatePaymentData.razorpayOrderId,
                    razorpay_payment_id: 'pay_failed',
                    razorpay_signature: 'invalid_signature'
                  };
                  await simulatePaymentData.options.handler(response);
                }}
                className="btn-primary"
                style={{ width: '100%', height: '48px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--accent-terracotta)', border: 'none', color: '#FFFFFF', fontWeight: '850', cursor: 'pointer', fontSize: '0.88rem' }}
              >
                Simulate Failed Payment
              </button>
              <button 
                type="button"
                onClick={() => {
                  setShowSimulatedPaymentModal(false);
                  simulatePaymentData.options.modal.ondismiss();
                }}
                className="btn-secondary"
                style={{ width: '100%', height: '44px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderColor: 'var(--border-color)', color: 'var(--primary-dark)', cursor: 'pointer', fontSize: '0.82rem', fontWeight: '800' }}
              >
                Cancel / Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
