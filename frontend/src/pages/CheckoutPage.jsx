import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, CreditCard, Truck, CheckCircle2, XCircle, Lock, ShoppingBag, MapPin, Plus, Edit3, Check, X, AlertTriangle, ArrowLeft, ArrowRight, Tag, ChevronDown, ChevronUp, Leaf, Sparkles, HelpCircle, Phone, Mail } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useDelivery } from '../context/DeliveryContext';
import api from '../api/axios';
import ModalPortal from '../components/ModalPortal';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { cartItems, subtotal, deliveryFee: defaultDeliveryFee, grandTotal: defaultGrandTotal, appliedCoupon, couponDiscountAmount, clearCart, applyCoupon, removeCoupon } = useCart();
  const { user, addAddress, updateAddress } = useAuth();
  const { deliveryInfo, checkPincode } = useDelivery();

  const savedAddresses = user?.addresses || [];

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

  // Determine initial selected address ID (default address first, or first row)
  const getInitialSelectedId = () => {
    if (!savedAddresses || savedAddresses.length === 0) return null;
    const def = savedAddresses.find(a => a.isDefault);
    return def ? (def._id || def.id) : (savedAddresses[0]._id || savedAddresses[0].id);
  };

  const [selectedAddressId, setSelectedAddressId] = useState(getInitialSelectedId);
  const [showAddressSelectModal, setShowAddressSelectModal] = useState(false);
  const [showAddEditAddressModal, setShowAddEditAddressModal] = useState(false);
  const [editingAddrTarget, setEditingAddrTarget] = useState(null);

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState(null);

  // Coupon input state on checkout page
  const [checkoutCouponCode, setCheckoutCouponCode] = useState('');
  const [checkoutCouponLoading, setCheckoutCouponLoading] = useState(false);
  const [checkoutCouponError, setCheckoutCouponError] = useState('');

  // Derive current selected address object
  const selectedAddress = savedAddresses.find(
    a => (a._id === selectedAddressId || a.id === selectedAddressId)
  ) || (savedAddresses.length > 0 ? savedAddresses[0] : null);

  const [formData, setFormData] = useState({
    customerName: user?.name || selectedAddress?.fullName || '',
    email: user?.email || '',
    phone: selectedAddress?.phone || user?.phone || '',
    building: selectedAddress?.building || '',
    addressLine: selectedAddress?.addressLine || '',
    city: selectedAddress?.city || deliveryInfo?.city || '',
    state: selectedAddress?.state || deliveryInfo?.state || '',
    pincode: selectedAddress?.pincode || deliveryInfo?.pincode || '',
  });

  // Inline Add / Edit Address Form State
  const [addressModalForm, setAddressModalForm] = useState({
    fullName: '',
    phone: '',
    building: '',
    addressLine: '',
    city: '',
    state: '',
    pincode: '',
    addressType: 'Home',
  });
  const [savingAddress, setSavingAddress] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState('Razorpay'); // 'Razorpay' or 'COD'
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [showSimulatedPaymentModal, setShowSimulatedPaymentModal] = useState(false);
  const [simulatePaymentData, setSimulatePaymentData] = useState(null);

  // Sync formData when selectedAddressId or user addresses change
  useEffect(() => {
    if (savedAddresses.length > 0) {
      let target = savedAddresses.find(a => (a._id === selectedAddressId || a.id === selectedAddressId));
      if (!target) {
        target = savedAddresses.find(a => a.isDefault) || savedAddresses[0];
        if (target) {
          setSelectedAddressId(target._id || target.id);
        }
      }
      if (target) {
        setFormData(prev => ({
          ...prev,
          customerName: prev.customerName || target.fullName || user?.name || '',
          email: prev.email || user?.email || '',
          phone: target.phone || prev.phone || user?.phone || '',
          building: target.building || '',
          addressLine: target.addressLine || '',
          city: target.city || '',
          state: target.state || '',
          pincode: target.pincode || '',
        }));
        if (target.pincode && target.pincode.length === 6) {
          checkPincode(target.pincode.trim());
        }
      }
    }
  }, [selectedAddressId, user?.addresses]);

  // Auto check pincode on initial load if pincode present
  useEffect(() => {
    if (formData.pincode && formData.pincode.length === 6) {
      checkPincode(formData.pincode.trim());
    }
  }, []);

  // Handle switching selected address
  const handleSelectAddress = (addr) => {
    const addrId = addr._id || addr.id;
    setSelectedAddressId(addrId);
    setFormData(prev => ({
      ...prev,
      customerName: addr.fullName || prev.customerName,
      phone: addr.phone || prev.phone,
      building: addr.building || '',
      addressLine: addr.addressLine || '',
      city: addr.city || '',
      state: addr.state || '',
      pincode: addr.pincode || '',
    }));
    setShowAddressSelectModal(false);
    setErrorMessage('');
    if (addr.pincode && addr.pincode.length === 6) {
      checkPincode(addr.pincode.trim());
    }
  };

  // Open modal for adding a new address inline
  const handleOpenAddAddressInline = () => {
    setEditingAddrTarget(null);
    setAddressModalForm({
      fullName: user?.name || '',
      phone: user?.phone || '',
      building: '',
      addressLine: '',
      city: '',
      state: '',
      pincode: '',
      addressType: 'Home',
    });
    setShowAddressSelectModal(false);
    setShowAddEditAddressModal(true);
  };

  // Open modal for editing an address inline
  const handleOpenEditAddressInline = (addr) => {
    setEditingAddrTarget(addr);
    setAddressModalForm({
      fullName: addr.fullName || '',
      phone: addr.phone || '',
      building: addr.building || '',
      addressLine: addr.addressLine || '',
      city: addr.city || '',
      state: addr.state || '',
      pincode: addr.pincode || '',
      addressType: addr.addressType || 'Home',
    });
    setShowAddressSelectModal(false);
    setShowAddEditAddressModal(true);
  };

  // Save new / edited address inline
  const handleSaveAddressInline = async (e) => {
    e.preventDefault();
    const cleanPin = (addressModalForm.pincode || '').trim();
    if (!cleanPin || !/^\d{6}$/.test(cleanPin)) {
      setErrorMessage('Please enter a valid 6-digit Indian PIN code.');
      return;
    }

    setSavingAddress(true);
    try {
      let updatedList;
      if (editingAddrTarget) {
        const targetId = editingAddrTarget._id || editingAddrTarget.id;
        updatedList = await updateAddress(targetId, addressModalForm);
        setSelectedAddressId(targetId);
      } else {
        updatedList = await addAddress(addressModalForm);
        if (updatedList && updatedList.length > 0) {
          const newlyAdded = updatedList[updatedList.length - 1];
          setSelectedAddressId(newlyAdded._id || newlyAdded.id);
        }
      }
      setShowAddEditAddressModal(false);
      checkPincode(cleanPin);
    } catch (err) {
      setErrorMessage('Failed to save address. Please try again.');
    } finally {
      setSavingAddress(false);
    }
  };

  // Calculate dynamic delivery fee based on verified deliveryInfo for selected PIN
  const cleanPin = (formData.pincode || '').trim();
  const isDeliverable = deliveryInfo && (deliveryInfo.available ?? deliveryInfo.isDeliverable);
  const isCurrentPinChecked = deliveryInfo && deliveryInfo.pincode === cleanPin;
  
  const effectiveDeliveryFee = (isCurrentPinChecked && isDeliverable)
    ? Number(deliveryInfo.deliveryCharge || 0)
    : (subtotal >= 499 || subtotal === 0 ? 0 : 49);

  const effectiveGrandTotal = Math.max(0, subtotal - couponDiscountAmount + effectiveDeliveryFee);
  const totalItemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  if (cartItems.length === 0) {
    return (
      <div 
        style={{ 
          padding: '6rem 0', 
          textAlign: 'center', 
          backgroundImage: 'url(/images/ritiual_background_image.jpeg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundColor: '#1E0E06',
          minHeight: '80vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative'
        }}
      >
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(20, 10, 5, 0.7) 0%, rgba(35, 18, 11, 0.6) 100%)', zIndex: 0 }} />
        <div style={{ maxWidth: '440px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', position: 'relative', zIndex: 1, backgroundColor: 'rgba(55, 31, 17, 0.85)', padding: '2.5rem', borderRadius: '24px', border: '1px solid rgba(235, 215, 175, 0.2)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)' }}>
          <div style={{ width: '72px', height: '72px', borderRadius: '50%', backgroundColor: 'rgba(185, 205, 148, 0.12)', border: '1px solid rgba(185, 205, 148, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShoppingBag size={36} color="#b9cd94" />
          </div>
          <h2 style={{ fontFamily: 'var(--font-serif)', color: '#FFFDF9', fontSize: '1.8rem', fontWeight: '800', margin: 0 }}>Your cart is empty</h2>
          <p style={{ color: 'rgba(245, 235, 221, 0.75)', fontSize: '0.92rem', margin: 0, lineHeight: '1.5' }}>Add some premium millet bakes to your basket to proceed with checkout.</p>
          <button onClick={() => navigate('/shop')} style={{ padding: '0.85rem 2rem', backgroundColor: '#244f21', color: '#FFFDF9', border: '1.5px solid #b9cd94', borderRadius: '999px', cursor: 'pointer', fontWeight: '800', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 8px 24px rgba(36, 79, 33, 0.4)' }}>
            <span>Back to Shop</span>
            <ArrowRight size={16} color="#b9cd94" />
          </button>
        </div>
      </div>
    );
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrorMessage('');
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }

    if (name === 'pincode') {
      const pin = value.trim();
      if (pin.length === 6 && /^\d{6}$/.test(pin)) {
        checkPincode(pin).then(res => {
          if (res && (res.available || res.isDeliverable) && res.city && res.state) {
            setFormData(prev => ({
              ...prev,
              city: prev.city || res.city,
              state: prev.state || res.state
            }));
          }
        });
      }
    }
  };

  const handleApplyCheckoutCoupon = async (e) => {
    e.preventDefault();
    if (!checkoutCouponCode.trim()) {
      setCheckoutCouponError('Please enter a coupon code.');
      return;
    }
    setCheckoutCouponLoading(true);
    setCheckoutCouponError('');
    try {
      const res = await applyCoupon(checkoutCouponCode.trim().toUpperCase());
      if (res && res.success) {
        setCheckoutCouponCode('');
        setCheckoutCouponError('');
      } else if (res && res.message) {
        setCheckoutCouponError(res.message);
      }
    } catch (err) {
      setCheckoutCouponError('Error applying coupon.');
    } finally {
      setCheckoutCouponLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.customerName.trim()) errors.customerName = 'Full name is required';
    
    // Phone validation
    const phoneVal = formData.phone.trim();
    if (!phoneVal) {
      errors.phone = 'Mobile number is required';
    } else if (!/^\d{10}$/.test(phoneVal.replace(/[\s-+]/g, '').slice(-10))) {
      errors.phone = 'Please enter a valid 10-digit mobile number';
    }

    if (!formData.addressLine.trim()) errors.addressLine = 'Street address is required';
    if (!formData.city.trim()) errors.city = 'City is required';
    if (!formData.state.trim()) errors.state = 'State is required';
    
    // Pincode validation
    const pinVal = formData.pincode.trim();
    if (!pinVal) {
      errors.pincode = 'Pincode is required';
    } else if (!/^\d{6}$/.test(pinVal)) {
      errors.pincode = 'Please enter a valid 6-digit pincode';
    } else if (isCurrentPinChecked && !isDeliverable) {
      errors.pincode = `Delivery currently unavailable to PIN code ${pinVal}`;
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

    if (isCurrentPinChecked && !isDeliverable) {
      setErrorMessage(`We do not deliver to PIN code ${cleanPin}. Please select or add a serviceable delivery address.`);
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const checkoutPayload = {
        userId: user?.id || user?._id || null,
        customerName: formData.customerName,
        email: formData.email,
        phone: formData.phone,
        shippingAddress: {
          building: formData.building,
          addressLine: formData.addressLine,
          city: formData.city,
          state: formData.state,
          country: 'India',
          pincode: formData.pincode,
        },
        pincode: formData.pincode,
        items: cartItems,
        couponCode: appliedCoupon ? appliedCoupon.code : null,
        paymentMethod,
        selectedAddressId: selectedAddressId || null,
      };

      // COD FLOW: Immediately create confirmed COD order
      if (paymentMethod === 'COD') {
        const orderRes = await api.post('/orders', checkoutPayload);
        const order = orderRes.data.order;
        const orderId = order.id || order.orderId;

        clearCart();
        navigate(`/order-success/${orderId}`);
        return;
      }

      // ONLINE RAZORPAY FLOW: Create payment session (No order in DB yet!)
      const sessionRes = await api.post('/payments/create-session', checkoutPayload);
      const { keyId, razorpayOrderId, amount, currency, grandTotal, deliveryFee } = sessionRes.data;

      const options = {
        key: keyId,
        amount, // In Paise (exact subtotal - discount + delivery_fee)
        currency,
        name: 'MILASTY Foods',
        description: 'Artisan Millet Bakes Purchase',
        image: '/images/image3.jpeg',
        order_id: razorpayOrderId,
        handler: async function (response) {
          try {
            // Verify payment signature & amount server-side
            const verifyRes = await api.post('/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (verifyRes.data.success) {
              clearCart();
              navigate(`/order-success/${verifyRes.data.orderId}`);
            } else {
              setErrorMessage('Payment verification failed. Please contact Milasty support.');
              setLoading(false);
            }
          } catch (err) {
            setErrorMessage('Error verifying payment signature. If amount was debited, contact our helpline.');
            setLoading(false);
          }
        },
        prefill: {
          name: formData.customerName,
          email: formData.email,
          contact: formData.phone,
        },
        theme: {
          color: '#24130D',
        },
        modal: {
          ondismiss: function () {
            api.post('/payments/cancel', { razorpay_order_id: razorpayOrderId }).catch(() => {});
            setErrorMessage('Payment was cancelled. Your order has not been placed. You can try again whenever you\'re ready.');
            setLoading(false);
          }
        }
      };

      const isDummyKey = keyId.startsWith('rzp_test_MILASTY');
      if (window.Razorpay && !isDummyKey) {
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        // Show sandbox payment simulator modal if dummy key
        setSimulatePaymentData({
          razorpayOrderId,
          amount,
          currency,
          grandTotal,
          customerName: formData.customerName,
          email: formData.email,
          phone: formData.phone,
          options
        });
        setShowSimulatedPaymentModal(true);
      }
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Error processing your order. Please try again.');
      setLoading(false);
    }
  };

  const cardStyle = {
    backgroundColor: 'rgba(55, 31, 17, 0.75)',
    border: '1px solid rgba(235, 215, 175, 0.18)',
    borderRadius: '20px',
    padding: '2rem',
    backdropFilter: 'blur(12px)',
    boxShadow: '0 12px 35px rgba(0, 0, 0, 0.25)',
  };

  const inputStyle = {
    width: '100%',
    padding: '0.75rem 0.95rem',
    borderRadius: '10px',
    border: '1px solid rgba(235, 215, 175, 0.2)',
    fontSize: '0.9rem',
    outline: 'none',
    fontFamily: 'inherit',
    backgroundColor: 'rgba(25, 13, 7, 0.65)',
    color: '#FFFDF9',
    transition: 'all 0.2s ease',
  };

  return (
    <div 
      className="checkout-page" 
      style={{ 
        backgroundImage: 'url(/images/ritiual_background_image.jpeg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        backgroundRepeat: 'no-repeat',
        backgroundColor: '#1E0E06',
        minHeight: '100vh',
        position: 'relative',
        color: '#FFFDF9',
      }}
    >
      {/* Dark warm overlay matching MILASTY Shop theme */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(20, 10, 5, 0.65) 0%, rgba(35, 18, 11, 0.55) 100%)', zIndex: 0, pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* Top Announcement Bar */}
        <div style={{ backgroundColor: 'rgba(18, 9, 5, 0.85)', borderBottom: '1px solid rgba(235, 215, 175, 0.12)', padding: '0.5rem 1rem', textAlign: 'center', fontSize: '0.78rem', color: '#E8DCCB', fontWeight: '600', backdropFilter: 'blur(8px)' }}>
          🌿 Handcrafted Millet Bakes • Pure Desi Ghee • Organic Jaggery • Use code <strong style={{ color: '#b9cd94' }}>MILASTY100</strong> for 10% OFF on orders above ₹300 | <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: '#b9cd94' }}>Wholesome Bakes Happier Days ♥</span>
        </div>

        {/* Header Bar */}
        <div style={{ borderBottom: '1px solid rgba(235, 215, 175, 0.15)', backgroundColor: 'rgba(25, 12, 6, 0.75)', backdropFilter: 'blur(12px)' }}>
          <div className="container" style={{ maxWidth: '1240px', margin: '0 auto', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Link to="/shop" style={{ color: '#FFFDF9', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.88rem', fontWeight: '700' }}>
              <ArrowLeft size={16} color="#b9cd94" />
              <span>Back to Shop</span>
            </Link>

            <Link to="/" style={{ textDecoration: 'none' }}>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', fontWeight: '900', color: '#FFFDF9', letterSpacing: '0.12em', textAlign: 'center' }}>
                MILASTY
              </div>
            </Link>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'rgba(245, 235, 221, 0.85)', fontSize: '0.78rem', fontWeight: '700' }}>
              <Lock size={14} color="#b9cd94" />
              <span style={{ display: 'none', smDisplay: 'inline' }}>Secure Checkout / Your information is safe with us</span>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="container" style={{ maxWidth: '1240px', margin: '0 auto', padding: '2.5rem 1.5rem 5rem' }}>
          
          {/* Page Title & Step Progress Bar */}
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <span style={{ fontSize: '0.78rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#b9cd94', fontWeight: '800', display: 'block', marginBottom: '0.4rem' }}>
              FINAL STEP TO INDULGENCE
            </span>
            <h1 style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', fontFamily: 'var(--font-serif, Georgia, serif)', color: '#FFFDF9', fontWeight: '800', margin: '0 0 0.5rem', lineHeight: '1.2' }}>
              Complete Your Order
            </h1>
            <p style={{ color: 'rgba(245, 235, 221, 0.8)', fontSize: '1rem', margin: '0 0 1.5rem', fontWeight: '500' }}>
              Good food finds its way to good people. <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: '#b9cd94' }}>Wholesome Bakes Happier Days ♥</span>
            </p>

            {/* Step Pills Indicator */}
            <div 
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '1rem', 
                fontSize: '0.8rem', 
                fontWeight: '800', 
                textTransform: 'uppercase', 
                letterSpacing: '0.08em',
                backgroundColor: 'rgba(38, 20, 12, 0.75)',
                padding: '0.6rem 1.5rem',
                borderRadius: '999px',
                border: '1px solid rgba(235, 215, 175, 0.2)',
                backdropFilter: 'blur(8px)',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
              }}
            >
              <span style={{ color: '#b9cd94', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#244f21', border: '1px solid #b9cd94', color: '#FFFDF9', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem' }}>1</span>
                Information
              </span>
              <span style={{ color: 'rgba(245, 235, 221, 0.3)' }}>------------</span>
              <span style={{ color: paymentMethod ? '#b9cd94' : 'rgba(245, 235, 221, 0.7)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(235, 215, 175, 0.3)', color: '#FFFDF9', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem' }}>2</span>
                Payment
              </span>
              <span style={{ color: 'rgba(245, 235, 221, 0.3)' }}>------------</span>
              <span style={{ color: 'rgba(245, 235, 221, 0.5)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'rgba(245, 235, 221, 0.5)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem' }}>3</span>
                Confirmation
              </span>
            </div>
          </div>

          {/* Checkout Main Form */}
          <form onSubmit={handlePlaceOrder} className="checkout-form" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '2rem', alignItems: 'start' }}>
            
            {/* LEFT COLUMN: Contact, Address & Payment Forms */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
              
              {/* Card 1: Contact Information */}
              <div style={cardStyle}>
                <h2 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-serif)', color: '#FFFDF9', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 0.3rem 0' }}>
                  <Mail size={18} color="#b9cd94" />
                  <span>Contact Information</span>
                </h2>
                <p style={{ fontSize: '0.8rem', color: 'rgba(245, 235, 221, 0.7)', margin: '0 0 1.25rem 0' }}>
                  We'll send your order confirmation and tracking updates here.
                </p>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: '800', color: '#FFFDF9', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Email Address</label>
                  <input 
                    type="email" 
                    name="email" 
                    value={formData.email} 
                    onChange={handleInputChange} 
                    placeholder="yourname@example.com" 
                    style={inputStyle} 
                  />
                </div>
              </div>

              {/* Card 2: Delivery Address */}
              <div style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <h2 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-serif)', color: '#FFFDF9', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                    <MapPin size={18} color="#b9cd94" />
                    <span>Delivery Address</span>
                  </h2>

                  {savedAddresses.length > 0 && (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => setShowAddressSelectModal(true)}
                        style={{
                          padding: '0.4rem 0.85rem',
                          fontSize: '0.76rem',
                          fontWeight: '800',
                          borderRadius: '999px',
                          border: '1px solid #b9cd94',
                          backgroundColor: 'rgba(36, 79, 33, 0.3)',
                          color: '#b9cd94',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                        }}
                      >
                        <MapPin size={12} />
                        <span>Change Address ({savedAddresses.length})</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleOpenAddAddressInline}
                        style={{
                          padding: '0.4rem 0.85rem',
                          fontSize: '0.76rem',
                          fontWeight: '800',
                          borderRadius: '999px',
                          border: '1px solid rgba(235, 215, 175, 0.25)',
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          color: '#FFFDF9',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                        }}
                      >
                        <Plus size={12} />
                        <span>Add New</span>
                      </button>
                    </div>
                  )}
                </div>
                <p style={{ fontSize: '0.8rem', color: 'rgba(245, 235, 221, 0.7)', margin: '0 0 1.25rem 0' }}>
                  Where should we deliver your freshly baked millet treats?
                </p>

                {/* SAVED ADDRESS SELECTOR CARD */}
                {savedAddresses.length > 0 && selectedAddress ? (
                  <div 
                    style={{ 
                      backgroundColor: 'rgba(20, 10, 5, 0.45)', 
                      borderRadius: '14px', 
                      padding: '1.25rem', 
                      border: (isCurrentPinChecked && !isDeliverable) 
                        ? '1.5px solid #ef5350' 
                        : '1.5px solid #b9cd94', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: '0.85rem',
                      marginBottom: '1.5rem',
                      transition: 'border-color 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.68rem', fontWeight: '800', textTransform: 'uppercase', backgroundColor: 'rgba(185, 205, 148, 0.2)', color: '#b9cd94', padding: '0.2rem 0.6rem', borderRadius: '6px' }}>
                          {selectedAddress.addressType || 'Home'}
                        </span>
                        {selectedAddress.isDefault && (
                          <span style={{ fontSize: '0.65rem', fontWeight: '800', textTransform: 'uppercase', backgroundColor: 'rgba(36, 79, 33, 0.4)', color: '#81c784', padding: '0.15rem 0.5rem', borderRadius: '999px', border: '1px solid rgba(129, 199, 132, 0.3)' }}>
                            Default Address
                          </span>
                        )}
                        <span style={{ fontSize: '0.72rem', fontWeight: '800', color: '#81c784', display: 'inline-flex', alignItems: 'center', gap: '0.2rem', marginLeft: '0.25rem' }}>
                          <CheckCircle2 size={13} /> Selected
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: '0.6rem' }}>
                        <button 
                          type="button" 
                          onClick={() => handleOpenEditAddressInline(selectedAddress)} 
                          style={{ background: 'none', border: 'none', color: '#b9cd94', fontSize: '0.78rem', fontWeight: '800', cursor: 'pointer', padding: 0 }}
                        >
                          Edit
                        </button>
                        <button 
                          type="button" 
                          onClick={() => setShowAddressSelectModal(true)} 
                          style={{ background: 'none', border: 'none', color: '#b9cd94', fontSize: '0.78rem', fontWeight: '800', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                        >
                          Change
                        </button>
                      </div>
                    </div>

                    <div>
                      <div style={{ fontWeight: '850', color: '#FFFDF9', fontSize: '0.98rem' }}>
                        {selectedAddress.fullName || formData.customerName}
                      </div>
                      <div style={{ fontSize: '0.88rem', color: 'rgba(245, 235, 221, 0.75)', lineHeight: '1.5', marginTop: '0.25rem' }}>
                        {selectedAddress.building && `${selectedAddress.building}, `}{selectedAddress.addressLine}, {selectedAddress.city}, {selectedAddress.state} - <strong style={{ color: '#FFFDF9', fontFamily: 'monospace' }}>{selectedAddress.pincode}</strong>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'rgba(245, 235, 221, 0.75)', marginTop: '0.3rem', fontWeight: '600' }}>
                        Phone: {selectedAddress.phone || formData.phone}
                      </div>
                    </div>

                    {/* Delivery Serviceability Status Badge for Selected Address */}
                    {isCurrentPinChecked && (
                      <div style={{
                        padding: '0.65rem 0.85rem',
                        borderRadius: '10px',
                        fontSize: '0.8rem',
                        fontWeight: '700',
                        backgroundColor: isDeliverable ? 'rgba(36, 79, 33, 0.3)' : 'rgba(239, 83, 80, 0.15)',
                        color: isDeliverable ? '#81c784' : '#ef5350',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.45rem',
                        border: isDeliverable ? '1px solid rgba(185, 205, 148, 0.4)' : '1px solid rgba(239, 83, 80, 0.4)'
                      }}>
                        {isDeliverable ? (
                          <>
                            <CheckCircle2 size={16} />
                            <span>Delivery available to {deliveryInfo.city || selectedAddress.city} (Delivery Charge: {effectiveDeliveryFee === 0 ? 'FREE' : `₹${effectiveDeliveryFee}`})</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle size={16} />
                            <span>⚠ Delivery unavailable to PIN code {selectedAddress.pincode}. Please select another address.</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ) : null}

                {/* Form Input Fields */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  
                  {/* Full name input */}
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: '800', color: '#FFFDF9', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Full Name *</label>
                    <input 
                      type="text" 
                      required 
                      name="customerName" 
                      value={formData.customerName} 
                      onChange={handleInputChange} 
                      placeholder="Enter your full name" 
                      style={{ ...inputStyle, border: fieldErrors.customerName ? '1.5px solid #ef5350' : inputStyle.border }} 
                    />
                    {fieldErrors.customerName && <span style={{ fontSize: '0.75rem', color: '#ef5350', fontWeight: '600', marginTop: '0.25rem', display: 'block' }}>{fieldErrors.customerName}</span>}
                  </div>

                  {/* Phone input with +91 indicator */}
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: '800', color: '#FFFDF9', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Phone Number *</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <div style={{ padding: '0.75rem 0.85rem', borderRadius: '10px', backgroundColor: 'rgba(20, 10, 5, 0.7)', border: '1px solid rgba(235, 215, 175, 0.2)', color: '#FFFDF9', fontSize: '0.88rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <span>🇮🇳</span>
                        <span>+91</span>
                      </div>
                      <input 
                        type="tel" 
                        required 
                        name="phone" 
                        value={formData.phone} 
                        onChange={handleInputChange} 
                        placeholder="Enter 10-digit phone number" 
                        style={{ ...inputStyle, flexGrow: 1, border: fieldErrors.phone ? '1.5px solid #ef5350' : inputStyle.border }} 
                      />
                    </div>
                    {fieldErrors.phone && <span style={{ fontSize: '0.75rem', color: '#ef5350', fontWeight: '600', marginTop: '0.25rem', display: 'block' }}>{fieldErrors.phone}</span>}
                  </div>

                  {/* Building / House Details */}
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: '800', color: '#FFFDF9', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Flat / House / Building Details</label>
                    <input 
                      type="text" 
                      name="building" 
                      value={formData.building} 
                      onChange={handleInputChange} 
                      placeholder="House no., Building, Street, Area" 
                      style={inputStyle} 
                    />
                  </div>

                  {/* Street address details textarea */}
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: '800', color: '#FFFDF9', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Street Address *</label>
                    <textarea 
                      rows={2} 
                      required 
                      name="addressLine" 
                      value={formData.addressLine} 
                      onChange={handleInputChange} 
                      placeholder="Street name, Landmark, Colony" 
                      style={{ ...inputStyle, border: fieldErrors.addressLine ? '1.5px solid #ef5350' : inputStyle.border, resize: 'none' }} 
                    />
                    {fieldErrors.addressLine && <span style={{ fontSize: '0.75rem', color: '#ef5350', fontWeight: '600', marginTop: '0.25rem', display: 'block' }}>{fieldErrors.addressLine}</span>}
                  </div>

                  {/* City, State, Pincode grid */}
                  <div className="checkout-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: '800', color: '#FFFDF9', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>City *</label>
                      <input 
                        type="text" 
                        required 
                        name="city" 
                        value={formData.city} 
                        onChange={handleInputChange} 
                        placeholder="Enter city" 
                        style={{ ...inputStyle, border: fieldErrors.city ? '1.5px solid #ef5350' : inputStyle.border }} 
                      />
                      {fieldErrors.city && <span style={{ fontSize: '0.72rem', color: '#ef5350', fontWeight: '600', marginTop: '0.25rem', display: 'block' }}>{fieldErrors.city}</span>}
                    </div>
                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: '800', color: '#FFFDF9', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>State *</label>
                      <input 
                        type="text" 
                        required 
                        name="state" 
                        value={formData.state} 
                        onChange={handleInputChange} 
                        placeholder="Select state" 
                        style={{ ...inputStyle, border: fieldErrors.state ? '1.5px solid #ef5350' : inputStyle.border }} 
                      />
                      {fieldErrors.state && <span style={{ fontSize: '0.72rem', color: '#ef5350', fontWeight: '600', marginTop: '0.25rem', display: 'block' }}>{fieldErrors.state}</span>}
                    </div>
                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: '800', color: '#FFFDF9', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Pincode *</label>
                      <input 
                        type="text" 
                        required 
                        maxLength={6}
                        name="pincode" 
                        value={formData.pincode} 
                        onChange={handleInputChange} 
                        placeholder="Enter pincode" 
                        style={{ ...inputStyle, border: fieldErrors.pincode ? '1.5px solid #ef5350' : inputStyle.border, fontFamily: 'monospace', fontWeight: '700' }} 
                      />
                      {fieldErrors.pincode && <span style={{ fontSize: '0.72rem', color: '#ef5350', fontWeight: '600', marginTop: '0.25rem', display: 'block' }}>{fieldErrors.pincode}</span>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3: Delivery Option */}
              <div style={cardStyle}>
                <h2 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-serif)', color: '#FFFDF9', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 0.3rem 0' }}>
                  <Truck size={18} color="#b9cd94" />
                  <span>Delivery Option</span>
                </h2>
                <p style={{ fontSize: '0.8rem', color: 'rgba(245, 235, 221, 0.7)', margin: '0 0 1rem 0' }}>
                  Freshly packed and delivered with care.
                </p>

                <div style={{ backgroundColor: 'rgba(20, 10, 5, 0.45)', border: '1.5px solid #b9cd94', borderRadius: '14px', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', backgroundColor: '#244f21', border: '2px solid #b9cd94', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#FFFDF9' }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: '800', color: '#FFFDF9', fontSize: '0.92rem' }}>Standard Delivery</div>
                      <div style={{ fontSize: '0.78rem', color: 'rgba(245, 235, 221, 0.7)', marginTop: '0.15rem' }}>Typically delivers in 3-6 business days</div>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.85rem', fontWeight: '800', color: effectiveDeliveryFee === 0 ? '#81c784' : '#FFFDF9' }}>
                    {effectiveDeliveryFee === 0 ? 'FREE' : `₹${effectiveDeliveryFee}`}
                  </span>
                </div>
              </div>

              {/* Card 4: Payment Option */}
              <div style={cardStyle}>
                <h2 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-serif)', color: '#FFFDF9', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 0.3rem 0' }}>
                  <CreditCard size={18} color="#b9cd94" />
                  <span>Payment Method</span>
                </h2>
                <p style={{ fontSize: '0.8rem', color: 'rgba(245, 235, 221, 0.7)', margin: '0 0 1.25rem 0' }}>
                  Choose a secure payment method to place your order.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  
                  {/* Razorpay Online */}
                  <label 
                    onClick={() => setPaymentMethod('Razorpay')} 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      padding: '1.1rem 1.25rem', 
                      borderRadius: '14px', 
                      border: paymentMethod === 'Razorpay' ? '2px solid #b9cd94' : '1px solid rgba(235, 215, 175, 0.15)', 
                      backgroundColor: paymentMethod === 'Razorpay' ? 'rgba(36, 79, 33, 0.25)' : 'rgba(20, 10, 5, 0.45)', 
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <input 
                        type="radio" 
                        name="payment" 
                        value="Razorpay" 
                        checked={paymentMethod === 'Razorpay'} 
                        onChange={() => setPaymentMethod('Razorpay')} 
                        style={{ accentColor: '#b9cd94', width: '18px', height: '18px' }}
                      />
                      <div>
                        <div style={{ fontWeight: '800', color: '#FFFDF9', fontSize: '0.95rem' }}>UPI (Google Pay, PhonePe, Paytm, etc.)</div>
                        <div style={{ fontSize: '0.78rem', color: 'rgba(245, 235, 221, 0.7)', marginTop: '0.15rem' }}>Pay instantly using UPI, Cards, or Netbanking</div>
                      </div>
                    </div>
                    <span style={{ fontSize: '0.78rem', fontWeight: '800', color: '#b9cd94', letterSpacing: '0.06em', fontFamily: 'monospace' }}>UPI / CARD</span>
                  </label>

                  {/* Cash on Delivery */}
                  <label 
                    onClick={() => setPaymentMethod('COD')} 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      padding: '1.1rem 1.25rem', 
                      borderRadius: '14px', 
                      border: paymentMethod === 'COD' ? '2px solid #b9cd94' : '1px solid rgba(235, 215, 175, 0.15)', 
                      backgroundColor: paymentMethod === 'COD' ? 'rgba(36, 79, 33, 0.25)' : 'rgba(20, 10, 5, 0.45)', 
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <input 
                        type="radio" 
                        name="payment" 
                        value="COD" 
                        checked={paymentMethod === 'COD'} 
                        onChange={() => setPaymentMethod('COD')} 
                        style={{ accentColor: '#b9cd94', width: '18px', height: '18px' }}
                      />
                      <div>
                        <div style={{ fontWeight: '800', color: '#FFFDF9', fontSize: '0.95rem' }}>Cash on Delivery (COD)</div>
                        <div style={{ fontSize: '0.78rem', color: 'rgba(245, 235, 221, 0.7)', marginTop: '0.15rem' }}>Pay cash upon delivery</div>
                      </div>
                    </div>
                    <span style={{ fontSize: '0.78rem', fontWeight: '800', color: 'rgba(245, 235, 221, 0.7)', letterSpacing: '0.06em' }}>COD</span>
                  </label>
                </div>

                {errorMessage && (
                  <div style={{ backgroundColor: 'rgba(239, 83, 80, 0.15)', border: '1px solid #ef5350', color: '#FF7B7B', padding: '0.85rem 1rem', borderRadius: '12px', fontSize: '0.85rem', marginTop: '1.25rem', fontWeight: '600', lineHeight: '1.4' }}>
                    {errorMessage}
                  </div>
                )}

                {/* Primary Action Button */}
                <button
                  type="submit"
                  disabled={loading || (isCurrentPinChecked && !isDeliverable)}
                  className="btn-primary"
                  style={{ 
                    width: '100%', 
                    marginTop: '1.5rem',
                    padding: '1.1rem', 
                    fontSize: '1rem', 
                    backgroundColor: (isCurrentPinChecked && !isDeliverable) ? 'rgba(255, 255, 255, 0.15)' : '#244f21', 
                    border: '1.5px solid #b9cd94',
                    borderRadius: '999px',
                    fontWeight: '800',
                    color: (isCurrentPinChecked && !isDeliverable) ? 'rgba(245, 235, 221, 0.5)' : '#FFFDF9',
                    cursor: (isCurrentPinChecked && !isDeliverable) ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.6rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    boxShadow: '0 8px 24px rgba(36, 79, 33, 0.4)',
                    transition: 'all 0.25s ease',
                    opacity: loading ? 0.7 : 1
                  }}
                >
                  {loading ? (
                    <span>{paymentMethod === 'COD' ? 'Placing Order...' : 'Initiating Secure Checkout...'}</span>
                  ) : (isCurrentPinChecked && !isDeliverable) ? (
                    <span>Delivery Unavailable to {cleanPin}</span>
                  ) : paymentMethod === 'COD' ? (
                    <>
                      <span>Place Order Securely →</span>
                    </>
                  ) : (
                    <>
                      <Lock size={16} color="#b9cd94" />
                      <span>Place Order Securely →</span>
                    </>
                  )}
                </button>

                <div style={{ textAlign: 'center', marginTop: '0.75rem', fontSize: '0.75rem', color: 'rgba(245, 235, 221, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
                  <Lock size={13} color="#b9cd94" />
                  <span>Your payment information is encrypted and secure.</span>
                </div>

              </div>

            </div>

            {/* RIGHT COLUMN: Order Summary, Coupon & FAQs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'sticky', top: '20px' }}>
              
              {/* Order Summary Card */}
              <div style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <h3 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-serif)', color: '#FFFDF9', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ShoppingBag size={18} color="#b9cd94" />
                    <span>Order Summary</span>
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: 'rgba(245, 235, 221, 0.7)', fontWeight: '600' }}>
                    {totalItemCount} {totalItemCount === 1 ? 'item' : 'items'}
                  </span>
                </div>

                {/* Items listing */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingBottom: '1.25rem', borderBottom: '1px solid rgba(235, 215, 175, 0.15)' }}>
                  {cartItems.map((item) => (
                    <div key={item.key || item._id} style={{ display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
                      <img 
                        src={item.image} 
                        alt={item.title} 
                        style={{ width: '56px', height: '56px', objectFit: 'cover', borderRadius: '10px', border: '1px solid rgba(235, 215, 175, 0.15)', flexShrink: 0 }} 
                      />
                      <div style={{ flexGrow: 1, minWidth: 0 }}>
                        <h4 style={{ fontSize: '0.88rem', fontFamily: 'var(--font-serif)', fontWeight: '700', color: '#FFFDF9', margin: '0 0 0.15rem 0', lineHeight: '1.25', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</h4>
                        <span style={{ fontSize: '0.75rem', color: 'rgba(245, 235, 221, 0.65)', display: 'block' }}>
                          {item.variantName && item.variantName !== 'Standard Pack' ? item.variantName : item.weight || 'Standard'} • Qty: {item.quantity}
                        </span>
                      </div>
                      <span style={{ fontWeight: '800', fontFamily: 'var(--font-serif)', color: '#FFFDF9', fontSize: '0.95rem', flexShrink: 0 }}>
                        ₹{item.totalPrice}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Cost Summary calculations */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', padding: '1.25rem 0', borderBottom: '1px solid rgba(235, 215, 175, 0.15)', fontSize: '0.88rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(245, 235, 221, 0.75)' }}>
                    <span>Subtotal</span>
                    <span style={{ fontWeight: '700', color: '#FFFDF9' }}>₹{subtotal}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(245, 235, 221, 0.75)' }}>
                    <span>Delivery Charges</span>
                    <span style={{ fontWeight: '700', color: effectiveDeliveryFee === 0 ? '#81c784' : '#FFFDF9' }}>
                      {effectiveDeliveryFee === 0 ? 'FREE' : `Calculated later`}
                    </span>
                  </div>
                  {couponDiscountAmount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#b9cd94', fontWeight: '700' }}>
                      <span>Discount ({appliedCoupon?.code})</span>
                      <span>-₹{couponDiscountAmount}</span>
                    </div>
                  )}
                </div>

                {/* Total Amount */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1.25rem' }}>
                  <span style={{ fontSize: '1.1rem', fontFamily: 'var(--font-serif)', fontWeight: '800', color: '#FFFDF9' }}>Total Amount</span>
                  <span style={{ fontSize: '1.5rem', fontFamily: 'var(--font-serif)', fontWeight: '900', color: '#FFFDF9' }}>₹{effectiveGrandTotal}</span>
                </div>

              </div>

              {/* Card 2: Have a Coupon Code? */}
              <div style={cardStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.85rem' }}>
                  <Tag size={16} color="#b9cd94" />
                  <span style={{ fontSize: '0.92rem', fontFamily: 'var(--font-serif)', color: '#FFFDF9', fontWeight: '800' }}>Have a Coupon Code?</span>
                </div>

                {appliedCoupon ? (
                  <div style={{ padding: '0.75rem 0.95rem', borderRadius: '10px', backgroundColor: 'rgba(36, 79, 33, 0.35)', border: '1px solid rgba(185, 205, 148, 0.45)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: '0.82rem', color: '#b9cd94', fontWeight: '800' }}>
                      ✓ {appliedCoupon.code} (Saved ₹{couponDiscountAmount})
                    </div>
                    <button onClick={removeCoupon} style={{ background: 'none', border: 'none', color: '#ef5350', fontSize: '0.75rem', fontWeight: '800', cursor: 'pointer', textDecoration: 'underline' }}>
                      Remove
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCheckoutCoupon} style={{ display: 'flex', gap: '0.5rem' }}>
                    <input 
                      type="text" 
                      placeholder="Enter coupon code (e.g. MILASTY100)" 
                      value={checkoutCouponCode} 
                      onChange={(e) => {
                        setCheckoutCouponCode(e.target.value.toUpperCase());
                        setCheckoutCouponError('');
                      }} 
                      style={{ ...inputStyle, textTransform: 'uppercase', flexGrow: 1 }} 
                    />
                    <button 
                      type="submit" 
                      disabled={checkoutCouponLoading || !checkoutCouponCode.trim()} 
                      style={{ padding: '0.65rem 1.1rem', borderRadius: '10px', backgroundColor: '#244f21', color: '#FFFDF9', border: '1px solid #b9cd94', fontSize: '0.85rem', fontWeight: '800', cursor: 'pointer', flexShrink: 0, opacity: checkoutCouponLoading || !checkoutCouponCode.trim() ? 0.6 : 1 }}
                    >
                      {checkoutCouponLoading ? 'Applying...' : 'Apply'}
                    </button>
                  </form>
                )}
                {checkoutCouponError && (
                  <div style={{ color: '#ef5350', fontSize: '0.75rem', marginTop: '0.4rem', fontWeight: '600' }}>
                    {checkoutCouponError}
                  </div>
                )}
              </div>

              {/* Card 3: Trust Badges */}
              <div style={{ ...cardStyle, padding: '1.25rem 1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', textAlign: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>
                  <Leaf size={20} color="#b9cd94" />
                  <span style={{ fontSize: '0.72rem', color: '#FFFDF9', fontWeight: '700', lineHeight: '1.2' }}>100% Natural Ingredients</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>
                  <ShieldCheck size={20} color="#b9cd94" />
                  <span style={{ fontSize: '0.72rem', color: '#FFFDF9', fontWeight: '700', lineHeight: '1.2' }}>Secure Payments</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>
                  <Truck size={20} color="#b9cd94" />
                  <span style={{ fontSize: '0.72rem', color: '#FFFDF9', fontWeight: '700', lineHeight: '1.2' }}>Freshly Packed With Care</span>
                </div>
              </div>

              {/* Card 4: Promo Banner */}
              <div 
                style={{ 
                  borderRadius: '20px', 
                  backgroundImage: 'url(/images/bajra.jpeg)', 
                  backgroundSize: 'cover', 
                  backgroundPosition: 'center', 
                  padding: '2.5rem 1.5rem', 
                  position: 'relative', 
                  overflow: 'hidden',
                  border: '1px solid rgba(235, 215, 175, 0.2)',
                  boxShadow: '0 12px 35px rgba(0, 0, 0, 0.3)',
                  minHeight: '160px',
                  display: 'flex',
                  alignItems: 'flex-end'
                }}
              >
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(20, 10, 5, 0.3) 0%, rgba(20, 10, 5, 0.88) 100%)', zIndex: 0 }} />
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', fontWeight: '800', color: '#FFFDF9', margin: '0 0 0.3rem 0', lineHeight: '1.25' }}>
                    Wholesome Goodness,<br />Delivered to You.
                  </h3>
                  <p style={{ fontSize: '0.78rem', color: '#b9cd94', margin: 0, fontWeight: '700' }}>
                    Handcrafted in small batches with pure Desi Ghee ♥
                  </p>
                </div>
              </div>

              {/* Card 5: Need Help FAQ Section */}
              <div style={cardStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1rem' }}>
                  <HelpCircle size={18} color="#b9cd94" />
                  <h3 style={{ fontSize: '1.05rem', fontFamily: 'var(--font-serif)', color: '#FFFDF9', fontWeight: '800', margin: 0 }}>
                    Need Help?
                  </h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {[
                    { q: 'What are the delivery timelines?', a: 'Standard delivery typically takes 3 to 6 business days across all major Indian PIN codes.' },
                    { q: 'Do you offer Cash on Delivery?', a: 'Yes! Cash on Delivery is available for eligible PIN codes across India.' },
                    { q: 'Can I change my address after placing the order?', a: 'Please contact our helpline within 2 hours of order placement to update your address.' },
                    { q: 'What if I receive a damaged product?', a: 'We offer instant replacements or full refunds for damaged shipments. Just share a photo with support!' },
                  ].map((faq, idx) => {
                    const isOpen = openFaq === idx;
                    return (
                      <div key={idx} style={{ borderBottom: '1px solid rgba(235, 215, 175, 0.1)', pb: '0.5rem' }}>
                        <button
                          type="button"
                          onClick={() => setOpenFaq(isOpen ? null : idx)}
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: 'none',
                            border: 'none',
                            color: '#FFFDF9',
                            fontSize: '0.82rem',
                            fontWeight: '700',
                            textAlign: 'left',
                            padding: '0.5rem 0',
                            cursor: 'pointer',
                          }}
                        >
                          <span>{faq.q}</span>
                          {isOpen ? <ChevronUp size={16} color="#b9cd94" /> : <ChevronDown size={16} color="rgba(245, 235, 221, 0.5)" />}
                        </button>
                        {isOpen && (
                          <div style={{ fontSize: '0.78rem', color: 'rgba(245, 235, 221, 0.75)', lineHeight: '1.5', padding: '0.25rem 0 0.5rem 0' }}>
                            {faq.a}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

          </form>
        </div>

      </div>

      {/* ==================================================
          MODAL 1: SELECT ADDRESS MODAL
         ================================================== */}
      <ModalPortal isOpen={showAddressSelectModal} onClose={() => setShowAddressSelectModal(false)}>
        <div 
          className="glass-card" 
          style={{ 
            backgroundColor: 'rgba(28, 14, 8, 0.98)', 
            borderRadius: '24px', 
            border: '1px solid rgba(235, 215, 175, 0.25)', 
            width: '100%', 
            maxWidth: '560px', 
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 24px 50px rgba(0, 0, 0, 0.6)',
            overflow: 'hidden'
          }}
        >
          {/* Modal Header */}
          <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(235, 215, 175, 0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontFamily: 'var(--font-serif)', color: '#FFFDF9', fontWeight: '800', margin: 0 }}>
                Select Delivery Address
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'rgba(245, 235, 221, 0.7)', margin: '0.2rem 0 0 0' }}>
                Choose which address to deliver this order to
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowAddressSelectModal(false)}
              style={{ background: 'none', border: 'none', color: 'rgba(245, 235, 221, 0.7)', cursor: 'pointer', padding: '0.25rem' }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Address Cards Scrollable Area */}
          <div style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', flexGrow: 1 }}>
            {savedAddresses.map((addr) => {
              const addrId = addr._id || addr.id;
              const isSelected = addrId === selectedAddressId;

              return (
                <div
                  key={addrId}
                  onClick={() => handleSelectAddress(addr)}
                  style={{
                    backgroundColor: isSelected ? 'rgba(36, 79, 33, 0.25)' : 'rgba(20, 10, 5, 0.4)',
                    borderRadius: '16px',
                    border: isSelected ? '2px solid #b9cd94' : '1px solid rgba(235, 215, 175, 0.15)',
                    padding: '1.15rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                    position: 'relative',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.68rem', fontWeight: '800', textTransform: 'uppercase', backgroundColor: 'rgba(185, 205, 148, 0.2)', color: '#b9cd94', padding: '0.2rem 0.6rem', borderRadius: '6px' }}>
                        {addr.addressType || 'Home'}
                      </span>
                      {addr.isDefault && (
                        <span style={{ fontSize: '0.65rem', fontWeight: '800', textTransform: 'uppercase', backgroundColor: 'rgba(36, 79, 33, 0.4)', color: '#81c784', padding: '0.15rem 0.5rem', borderRadius: '999px', border: '1px solid rgba(129, 199, 132, 0.3)' }}>
                          Default
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditAddressInline(addr);
                        }}
                        style={{ background: 'none', border: 'none', color: '#b9cd94', fontSize: '0.78rem', fontWeight: '800', cursor: 'pointer', padding: 0 }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectAddress(addr);
                        }}
                        style={{
                          padding: '0.35rem 0.85rem',
                          fontSize: '0.75rem',
                          fontWeight: '800',
                          borderRadius: '999px',
                          backgroundColor: isSelected ? '#244f21' : 'transparent',
                          color: '#FFFDF9',
                          border: isSelected ? '1px solid #b9cd94' : '1px solid rgba(235, 215, 175, 0.25)',
                          cursor: 'pointer',
                        }}
                      >
                        {isSelected ? 'Selected ✓' : 'Deliver Here'}
                      </button>
                    </div>
                  </div>

                  <div>
                    <div style={{ fontWeight: '850', color: '#FFFDF9', fontSize: '0.95rem' }}>
                      {addr.fullName}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'rgba(245, 235, 221, 0.75)', lineHeight: '1.5', marginTop: '0.2rem' }}>
                      {addr.building && `${addr.building}, `}{addr.addressLine}, {addr.city}, {addr.state} - <strong style={{ color: '#FFFDF9', fontFamily: 'monospace' }}>{addr.pincode}</strong>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'rgba(245, 235, 221, 0.75)', marginTop: '0.25rem' }}>
                      Phone: {addr.phone}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Modal Footer */}
          <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid rgba(235, 215, 175, 0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(15, 8, 4, 0.6)' }}>
            <button
              type="button"
              onClick={handleOpenAddAddressInline}
              style={{
                padding: '0.65rem 1.25rem',
                fontSize: '0.82rem',
                fontWeight: '800',
                borderRadius: '999px',
                backgroundColor: '#244f21',
                color: '#FFFDF9',
                border: '1px solid #b9cd94',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <Plus size={15} />
              <span>Add New Address</span>
            </button>

            <button
              type="button"
              onClick={() => setShowAddressSelectModal(false)}
              style={{
                padding: '0.65rem 1.25rem',
                fontSize: '0.82rem',
                fontWeight: '800',
                borderRadius: '999px',
                backgroundColor: 'transparent',
                color: 'rgba(245, 235, 221, 0.75)',
                border: '1px solid rgba(235, 215, 175, 0.2)',
                cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>
        </div>
      </ModalPortal>

      {/* ==================================================
          MODAL 2: INLINE ADD / EDIT ADDRESS MODAL
         ================================================== */}
      <ModalPortal isOpen={showAddEditAddressModal} onClose={() => setShowAddEditAddressModal(false)}>
        <div 
          className="glass-card" 
          style={{ 
            backgroundColor: 'rgba(28, 14, 8, 0.98)', 
            borderRadius: '24px', 
            border: '1px solid rgba(235, 215, 175, 0.25)', 
            width: '100%', 
            maxWidth: '520px', 
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 24px 50px rgba(0, 0, 0, 0.6)',
            overflow: 'hidden'
          }}
        >
          {/* Modal Header */}
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(235, 215, 175, 0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.1rem', fontFamily: 'var(--font-serif)', color: '#FFFDF9', fontWeight: '800', margin: 0 }}>
              {editingAddrTarget ? 'Edit Delivery Address' : 'Add New Delivery Address'}
            </h3>
            <button
              type="button"
              onClick={() => setShowAddEditAddressModal(false)}
              style={{ background: 'none', border: 'none', color: 'rgba(245, 235, 221, 0.7)', cursor: 'pointer', padding: '0.25rem' }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Modal Form Content */}
          <form onSubmit={handleSaveAddressInline} style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', flexGrow: 1 }}>
            
            {/* Address Type Selector */}
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: '800', color: '#FFFDF9', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Address Label</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {['Home', 'Work', 'Other'].map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setAddressModalForm(prev => ({ ...prev, addressType: type }))}
                    style={{
                      padding: '0.45rem 1rem',
                      fontSize: '0.8rem',
                      fontWeight: '800',
                      borderRadius: '8px',
                      border: addressModalForm.addressType === type ? '1.5px solid #b9cd94' : '1px solid rgba(235, 215, 175, 0.15)',
                      backgroundColor: addressModalForm.addressType === type ? 'rgba(36, 79, 33, 0.3)' : 'transparent',
                      color: addressModalForm.addressType === type ? '#b9cd94' : 'rgba(245, 235, 221, 0.7)',
                      cursor: 'pointer',
                    }}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: '800', color: '#FFFDF9', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Recipient Name *</label>
              <input
                type="text"
                required
                value={addressModalForm.fullName}
                onChange={(e) => setAddressModalForm(prev => ({ ...prev, fullName: e.target.value }))}
                placeholder="Enter recipient name"
                style={inputStyle}
              />
            </div>

            {/* Phone */}
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: '800', color: '#FFFDF9', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Mobile Phone *</label>
              <input
                type="tel"
                required
                value={addressModalForm.phone}
                onChange={(e) => setAddressModalForm(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="10-digit mobile number"
                style={inputStyle}
              />
            </div>

            {/* Building / Flat */}
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: '800', color: '#FFFDF9', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>House / Flat / Building</label>
              <input
                type="text"
                value={addressModalForm.building}
                onChange={(e) => setAddressModalForm(prev => ({ ...prev, building: e.target.value }))}
                placeholder="Flat / Building details"
                style={inputStyle}
              />
            </div>

            {/* Street Address */}
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: '800', color: '#FFFDF9', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Street Address *</label>
              <textarea
                rows={2}
                required
                value={addressModalForm.addressLine}
                onChange={(e) => setAddressModalForm(prev => ({ ...prev, addressLine: e.target.value }))}
                placeholder="Street address, Landmark"
                style={{ ...inputStyle, resize: 'none' }}
              />
            </div>

            {/* City, State, Pincode */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: '800', color: '#FFFDF9', display: 'block', marginBottom: '0.4rem', textTransform: 'uppercase' }}>City *</label>
                <input
                  type="text"
                  required
                  value={addressModalForm.city}
                  onChange={(e) => setAddressModalForm(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="City"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: '800', color: '#FFFDF9', display: 'block', marginBottom: '0.4rem', textTransform: 'uppercase' }}>State *</label>
                <input
                  type="text"
                  required
                  value={addressModalForm.state}
                  onChange={(e) => setAddressModalForm(prev => ({ ...prev, state: e.target.value }))}
                  placeholder="State"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: '800', color: '#FFFDF9', display: 'block', marginBottom: '0.4rem', textTransform: 'uppercase' }}>Pincode *</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={addressModalForm.pincode}
                  onChange={(e) => setAddressModalForm(prev => ({ ...prev, pincode: e.target.value }))}
                  placeholder="Pincode"
                  style={{ ...inputStyle, fontFamily: 'monospace', fontWeight: '700' }}
                />
              </div>
            </div>

            {/* Modal Submit Buttons */}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
              <button
                type="submit"
                disabled={savingAddress}
                style={{
                  flexGrow: 1,
                  padding: '0.85rem',
                  fontSize: '0.88rem',
                  fontWeight: '800',
                  borderRadius: '999px',
                  backgroundColor: '#244f21',
                  color: '#FFFDF9',
                  border: '1px solid #b9cd94',
                  cursor: 'pointer',
                }}
              >
                {savingAddress ? 'Saving Address...' : (editingAddrTarget ? 'Save & Select Address' : 'Add & Select Address')}
              </button>
              <button
                type="button"
                onClick={() => setShowAddEditAddressModal(false)}
                style={{
                  padding: '0.85rem 1.25rem',
                  fontSize: '0.88rem',
                  fontWeight: '800',
                  borderRadius: '999px',
                  backgroundColor: 'transparent',
                  color: 'rgba(245, 235, 221, 0.75)',
                  border: '1px solid rgba(235, 215, 175, 0.2)',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>

          </form>
        </div>
      </ModalPortal>

      {/* Simulated Payment Modal */}
      <ModalPortal 
        isOpen={showSimulatedPaymentModal && !!simulatePaymentData} 
        onClose={() => {
          setShowSimulatedPaymentModal(false);
          if (simulatePaymentData?.options?.modal?.ondismiss) {
            simulatePaymentData.options.modal.ondismiss();
          }
        }}
      >
        <div 
          className="glass-card" 
          style={{ 
            backgroundColor: 'rgba(28, 14, 8, 0.98)', 
            borderRadius: '24px', 
            border: '1px solid rgba(235, 215, 175, 0.25)', 
            width: '100%', 
            maxWidth: '460px', 
            padding: '2.5rem',
            boxShadow: '0 24px 50px rgba(0, 0, 0, 0.6)',
            position: 'relative'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Lock size={18} color="#b9cd94" />
            <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#b9cd94', fontWeight: '800' }}>MILASTY SECURE PAYMENT</span>
          </div>
          <h3 style={{ fontSize: '1.4rem', fontFamily: 'var(--font-serif)', color: '#FFFDF9', fontWeight: '800', marginBottom: '1.25rem', margin: 0 }}>
            Razorpay Sandbox Simulator
          </h3>
          
          <div style={{ backgroundColor: 'rgba(20, 10, 5, 0.5)', border: '1px solid rgba(235, 215, 175, 0.15)', borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'rgba(245, 235, 221, 0.7)' }}>Customer Name</span>
              <span style={{ fontWeight: '700', color: '#FFFDF9' }}>{simulatePaymentData?.customerName}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'rgba(245, 235, 221, 0.7)' }}>Razorpay Order ID</span>
              <span style={{ fontWeight: '700', color: '#FFFDF9', fontFamily: 'monospace' }}>{simulatePaymentData?.razorpayOrderId}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'rgba(245, 235, 221, 0.7)' }}>Exact Amount to Pay</span>
              <span style={{ fontWeight: '850', color: '#b9cd94', fontSize: '1.1rem', fontFamily: 'var(--font-serif)' }}>₹{simulatePaymentData?.grandTotal}</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button 
              type="button"
              onClick={async () => {
                setShowSimulatedPaymentModal(false);
                const response = {
                  razorpay_order_id: simulatePaymentData.razorpayOrderId,
                  razorpay_payment_id: 'pay_simulated_' + Math.random().toString(36).substring(2, 10),
                  razorpay_signature: 'test_signature'
                };
                await simulatePaymentData.options.handler(response);
              }}
              style={{ width: '100%', height: '48px', borderRadius: '999px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#244f21', border: '1px solid #b9cd94', color: '#FFFDF9', fontWeight: '850', cursor: 'pointer', fontSize: '0.88rem' }}
            >
              Simulate Successful Payment
            </button>
            <button 
              type="button"
              onClick={async () => {
                setShowSimulatedPaymentModal(false);
                await api.post('/payments/fail', { razorpay_order_id: simulatePaymentData.razorpayOrderId }).catch(() => {});
                setErrorMessage('Payment failed. Your order has not been placed.');
                setLoading(false);
              }}
              style={{ width: '100%', height: '48px', borderRadius: '999px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(239, 83, 80, 0.2)', border: '1px solid #ef5350', color: '#ef5350', fontWeight: '850', cursor: 'pointer', fontSize: '0.88rem' }}
            >
              Simulate Failed Payment
            </button>
            <button 
              type="button"
              onClick={() => {
                setShowSimulatedPaymentModal(false);
                if (simulatePaymentData?.options?.modal?.ondismiss) {
                  simulatePaymentData.options.modal.ondismiss();
                }
              }}
              style={{ width: '100%', height: '44px', borderRadius: '999px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderColor: 'rgba(235, 215, 175, 0.25)', color: 'rgba(245, 235, 221, 0.75)', backgroundColor: 'transparent', cursor: 'pointer', fontSize: '0.82rem', fontWeight: '800' }}
            >
              Cancel / Close (No Order Created)
            </button>
          </div>
        </div>
      </ModalPortal>
    </div>
  );
}
