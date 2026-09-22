import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, CreditCard, Truck, CheckCircle2, XCircle, Lock, ShoppingBag, MapPin, Plus, Edit3, Check, X, AlertTriangle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useDelivery } from '../context/DeliveryContext';
import api from '../api/axios';
import ModalPortal from '../components/ModalPortal';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { cartItems, subtotal, deliveryFee: defaultDeliveryFee, grandTotal: defaultGrandTotal, appliedCoupon, couponDiscountAmount, clearCart } = useCart();
  const { user, addAddress, updateAddress } = useAuth();
  const { deliveryInfo, checkPincode } = useDelivery();

  const savedAddresses = user?.addresses || [];

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

  if (cartItems.length === 0) {
    return (
      <div style={{ padding: '6rem 0', textAlign: 'center', backgroundColor: 'var(--bg-main)', minHeight: '80vh' }}>
        <div style={{ maxWidth: '400px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
          <ShoppingBag size={48} color="var(--accent-gold)" />
          <h2 style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-light)', fontSize: '1.8rem', fontWeight: '800' }}>Your cart is empty</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Add some premium millet bakes to your basket to proceed.</p>
          <button onClick={() => navigate('/shop')} className="btn-primary" style={{ padding: '0.85rem 2rem', backgroundColor: 'var(--accent-gold)', color: '#24130D', border: 'none', borderRadius: '999px', cursor: 'pointer', fontWeight: '700' }}>
            Back to Shop
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
      console.log('Initiating payment session on server...');
      const sessionRes = await api.post('/payments/create-session', checkoutPayload);
      const { keyId, razorpayOrderId, amount, currency, grandTotal, deliveryFee } = sessionRes.data;

      console.log('Razorpay payment session created on backend', {
        razorpayOrderId,
        amountPaise: amount,
        grandTotalRupees: grandTotal,
        deliveryFee,
      });

      const options = {
        key: keyId,
        amount, // In Paise (exact subtotal - discount + delivery_fee)
        currency,
        name: 'MILASTY Foods',
        description: 'Artisan Millet Bakes Purchase',
        image: '/images/image3.jpeg',
        order_id: razorpayOrderId,
        handler: async function (response) {
          console.log('Razorpay payment response captured:', response);
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
            console.error('Razorpay payment verification failed on backend:', err);
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
          color: '#381423', // Deep Plum
        },
        modal: {
          ondismiss: function () {
            console.warn('Razorpay checkout dismissed/cancelled by user');
            api.post('/payments/cancel', { razorpay_order_id: razorpayOrderId }).catch(() => { });
            setErrorMessage('Payment was cancelled. Your order has not been placed. You can try again whenever you\'re ready.');
            setLoading(false);
          }
        }
      };

      const isDummyKey = keyId.startsWith('rzp_test_MILASTY');
      if (window.Razorpay && !isDummyKey) {
        console.log('Opening Razorpay Checkout Popup...');
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        // Show sandbox payment simulator modal if dummy key
        console.warn('Opening Sandbox Payment Simulator...');
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
      console.error('Razorpay payment session failed:', error);
      setErrorMessage(error.response?.data?.message || 'Error processing your order. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: 'var(--bg-main)', minHeight: '100vh', padding: '2.5rem 0 5rem' }}>
      <div className="container" style={{ maxWidth: '1200px' }}>

        {/* Step Indicator Header */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1 style={{ fontSize: '2rem', fontFamily: 'var(--font-serif)', color: 'var(--text-light)', fontWeight: '800', marginBottom: '1.25rem' }}>
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
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              padding: '0.5rem 1.25rem',
              borderRadius: '999px',
              border: '1px solid rgba(245, 235, 221, 0.15)'
            }}
          >
            <span style={{ color: 'var(--accent-gold)' }}>✓ Cart</span>
            <span style={{ color: 'var(--text-muted)' }}>•</span>
            <span style={{ color: 'var(--text-light)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--accent-gold)' }} />
              Delivery & Payment
            </span>
            <span style={{ color: 'var(--text-muted)' }}>•</span>
            <span style={{ color: 'var(--text-muted)' }}>Confirmation</span>
          </div>
        </div>

        {/* Checkout Form */}
        <form onSubmit={handlePlaceOrder} className="checkout-form" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '2.5rem', alignItems: 'start' }}>

          {/* LEFT: Shipping Details & Payments */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

            {/* Delivery address details card */}
            <div className="glass-card" style={{ padding: '2rem', backgroundColor: 'transparent', borderRadius: '16px', border: '1px solid rgba(245, 235, 221, 0.25)', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-serif)', color: 'var(--text-light)', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                  <Truck size={20} color="var(--accent-gold)" />
                  <span>1. Delivery Address</span>
                </h2>

                {savedAddresses.length > 0 && (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => setShowAddressSelectModal(true)}
                      style={{
                        padding: '0.45rem 0.95rem',
                        fontSize: '0.78rem',
                        fontWeight: '800',
                        borderRadius: '999px',
                        border: '1px solid var(--accent-gold)',
                        backgroundColor: 'rgba(197, 160, 89, 0.12)',
                        color: 'var(--accent-gold)',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      <MapPin size={13} />
                      <span>Change Address ({savedAddresses.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleOpenAddAddressInline}
                      style={{
                        padding: '0.45rem 0.85rem',
                        fontSize: '0.78rem',
                        fontWeight: '800',
                        borderRadius: '999px',
                        border: '1px solid rgba(245, 235, 221, 0.2)',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        color: 'var(--text-light)',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      <Plus size={13} />
                      <span>Add New</span>
                    </button>
                  </div>
                )}
              </div>

              {/* SAVED ADDRESS SELECTOR CARD */}
              {savedAddresses.length > 0 && selectedAddress ? (
                <div
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '14px',
                    padding: '1.25rem',
                    border: (isCurrentPinChecked && !isDeliverable)
                      ? '1.5px solid var(--accent-terracotta)'
                      : '1.5px solid var(--accent-gold)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.85rem',
                    marginBottom: '1.5rem',
                    transition: 'border-color 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.68rem', fontWeight: '800', textTransform: 'uppercase', backgroundColor: 'rgba(197, 160, 89, 0.2)', color: 'var(--accent-gold)', padding: '0.2rem 0.6rem', borderRadius: '6px' }}>
                        {selectedAddress.addressType || 'Home'}
                      </span>
                      {selectedAddress.isDefault && (
                        <span style={{ fontSize: '0.65rem', fontWeight: '800', textTransform: 'uppercase', backgroundColor: 'rgba(39, 76, 55, 0.4)', color: '#85B870', padding: '0.15rem 0.5rem', borderRadius: '999px', border: '1px solid rgba(133, 184, 112, 0.3)' }}>
                          Default Address
                        </span>
                      )}
                      <span style={{ fontSize: '0.7rem', fontWeight: '800', color: '#22c55e', display: 'inline-flex', alignItems: 'center', gap: '0.2rem', marginLeft: '0.25rem' }}>
                        <CheckCircle2 size={13} /> Selected
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '0.6rem' }}>
                      <button
                        type="button"
                        onClick={() => handleOpenEditAddressInline(selectedAddress)}
                        style={{ background: 'none', border: 'none', color: '#B99A5B', fontSize: '0.78rem', fontWeight: '800', cursor: 'pointer', padding: 0 }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddressSelectModal(true)}
                        style={{ background: 'none', border: 'none', color: 'var(--accent-gold)', fontSize: '0.78rem', fontWeight: '800', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                      >
                        Change
                      </button>
                    </div>
                  </div>

                  <div>
                    <div style={{ fontWeight: '850', color: 'var(--text-light)', fontSize: '0.98rem' }}>
                      {selectedAddress.fullName || formData.customerName}
                    </div>
                    <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: '1.5', marginTop: '0.25rem' }}>
                      {selectedAddress.building && `${selectedAddress.building}, `}{selectedAddress.addressLine}, {selectedAddress.city}, {selectedAddress.state} - <strong style={{ color: 'var(--text-light)', fontFamily: 'monospace' }}>{selectedAddress.pincode}</strong>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.3rem', fontWeight: '600' }}>
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
                      backgroundColor: isDeliverable ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.15)',
                      color: isDeliverable ? '#22c55e' : '#ef4444',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      border: isDeliverable ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)'
                    }}>
                      {isDeliverable ? (
                        <>
                          <CheckCircle2 size={16} />
                          <span>Delivery available to {deliveryInfo.city || selectedAddress.city} (Delivery Fee: {effectiveDeliveryFee === 0 ? 'FREE' : `₹${effectiveDeliveryFee}`})</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle size={16} />
                          <span>⚠ Delivery unavailable to PIN code {selectedAddress.pincode}. Please select another saved address or add a new address.</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ) : savedAddresses.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1.5rem', backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: '14px', border: '1px dashed rgba(245, 235, 221, 0.2)', marginBottom: '1.5rem' }}>
                  <MapPin size={32} color="var(--accent-gold)" style={{ margin: '0 auto 0.5rem' }} />
                  <div style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--text-light)', marginBottom: '0.25rem' }}>No saved delivery addresses found</div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 1rem 0' }}>Add a delivery address below to proceed with your order.</p>
                  <button
                    type="button"
                    onClick={handleOpenAddAddressInline}
                    style={{
                      padding: '0.65rem 1.35rem',
                      fontSize: '0.82rem',
                      fontWeight: '800',
                      borderRadius: '10px',
                      backgroundColor: 'var(--accent-gold)',
                      color: '#24130D',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}
                  >
                    <Plus size={15} />
                    <span>Add New Address</span>
                  </button>
                </div>
              ) : null}

              {/* Form Input Fields */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                {/* Full name input */}
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-light)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Full Name *</label>
                  <input
                    type="text"
                    required
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleInputChange}
                    placeholder="Ananya Sharma"
                    style={{ width: '100%', padding: '0.75rem 0.95rem', borderRadius: '10px', border: fieldErrors.customerName ? '1.5px solid var(--accent-terracotta)' : '1px solid rgba(245, 235, 221, 0.2)', fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-light)' }}
                  />
                  {fieldErrors.customerName && <span style={{ fontSize: '0.75rem', color: 'var(--accent-terracotta)', fontWeight: '600', marginTop: '0.25rem', display: 'block' }}>{fieldErrors.customerName}</span>}
                </div>

                {/* Email and Phone grid */}
                <div className="checkout-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-light)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Email Address</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="ananya@gmail.com"
                      style={{ width: '100%', padding: '0.75rem 0.95rem', borderRadius: '10px', border: '1px solid rgba(245, 235, 221, 0.2)', fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-light)' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-light)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Phone Number *</label>
                    <input
                      type="tel"
                      required
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="9876543210"
                      style={{ width: '100%', padding: '0.75rem 0.95rem', borderRadius: '10px', border: fieldErrors.phone ? '1.5px solid var(--accent-terracotta)' : '1px solid rgba(245, 235, 221, 0.2)', fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-light)' }}
                    />
                    {fieldErrors.phone && <span style={{ fontSize: '0.75rem', color: 'var(--accent-terracotta)', fontWeight: '600', marginTop: '0.25rem', display: 'block' }}>{fieldErrors.phone}</span>}
                  </div>
                </div>

                {/* Building / House Details */}
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-light)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Flat / House / Building Details</label>
                  <input
                    type="text"
                    name="building"
                    value={formData.building}
                    onChange={handleInputChange}
                    placeholder="Flat 402, B Block, Royal Palm Apartments"
                    style={{ width: '100%', padding: '0.75rem 0.95rem', borderRadius: '10px', border: '1px solid rgba(245, 235, 221, 0.2)', fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-light)' }}
                  />
                </div>

                {/* Street address details textarea */}
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-light)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Street Address *</label>
                  <textarea
                    rows={2}
                    required
                    name="addressLine"
                    value={formData.addressLine}
                    onChange={handleInputChange}
                    placeholder="Main Street, Sector 62, Near Landmark Park"
                    style={{ width: '100%', padding: '0.75rem 0.95rem', borderRadius: '10px', border: fieldErrors.addressLine ? '1.5px solid var(--accent-terracotta)' : '1px solid rgba(245, 235, 221, 0.2)', fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-light)', resize: 'none' }}
                  />
                  {fieldErrors.addressLine && <span style={{ fontSize: '0.75rem', color: 'var(--accent-terracotta)', fontWeight: '600', marginTop: '0.25rem', display: 'block' }}>{fieldErrors.addressLine}</span>}
                </div>

                {/* City, State, Pincode grid */}
                <div className="checkout-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: '800', color: 'var(--text-light)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>City *</label>
                    <input
                      type="text"
                      required
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="City"
                      style={{ width: '100%', padding: '0.75rem 0.75rem', borderRadius: '10px', border: fieldErrors.city ? '1.5px solid var(--accent-terracotta)' : '1px solid rgba(245, 235, 221, 0.2)', fontSize: '0.88rem', outline: 'none', fontFamily: 'inherit', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-light)' }}
                    />
                    {fieldErrors.city && <span style={{ fontSize: '0.72rem', color: 'var(--accent-terracotta)', fontWeight: '600', marginTop: '0.25rem', display: 'block' }}>{fieldErrors.city}</span>}
                  </div>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: '800', color: 'var(--text-light)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>State *</label>
                    <input
                      type="text"
                      required
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      placeholder="State"
                      style={{ width: '100%', padding: '0.75rem 0.75rem', borderRadius: '10px', border: fieldErrors.state ? '1.5px solid var(--accent-terracotta)' : '1px solid rgba(245, 235, 221, 0.2)', fontSize: '0.88rem', outline: 'none', fontFamily: 'inherit', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-light)' }}
                    />
                    {fieldErrors.state && <span style={{ fontSize: '0.72rem', color: 'var(--accent-terracotta)', fontWeight: '600', marginTop: '0.25rem', display: 'block' }}>{fieldErrors.state}</span>}
                  </div>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: '800', color: 'var(--text-light)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Pincode *</label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleInputChange}
                      placeholder="263153"
                      style={{ width: '100%', padding: '0.75rem 0.75rem', borderRadius: '10px', border: fieldErrors.pincode ? '1.5px solid var(--accent-terracotta)' : '1px solid rgba(245, 235, 221, 0.2)', fontSize: '0.88rem', outline: 'none', fontFamily: 'monospace', fontWeight: '700', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-light)' }}
                    />
                    {fieldErrors.pincode && <span style={{ fontSize: '0.72rem', color: 'var(--accent-terracotta)', fontWeight: '600', marginTop: '0.25rem', display: 'block' }}>{fieldErrors.pincode}</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Payment method selection card */}
            <div className="glass-card" style={{ padding: '2rem', backgroundColor: 'transparent', borderRadius: '16px', border: '1px solid rgba(245, 235, 221, 0.25)', boxShadow: 'var(--shadow-sm)' }}>
              <h2 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-serif)', color: 'var(--text-light)', fontWeight: '800', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
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
                    border: paymentMethod === 'Razorpay' ? '2.5px solid var(--accent-gold)' : '1px solid rgba(245, 235, 221, 0.15)',
                    backgroundColor: paymentMethod === 'Razorpay' ? 'rgba(197, 160, 89, 0.08)' : 'transparent',
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
                    style={{ accentColor: 'var(--accent-gold)', width: '17px', height: '17px' }}
                  />
                  <div>
                    <div style={{ fontWeight: '800', color: 'var(--text-light)', fontSize: '0.95rem' }}>Secure Online Checkout (Razorpay)</div>
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
                    border: paymentMethod === 'COD' ? '2.5px solid var(--accent-gold)' : '1px solid rgba(245, 235, 221, 0.15)',
                    backgroundColor: paymentMethod === 'COD' ? 'rgba(197, 160, 89, 0.08)' : 'transparent',
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
                    style={{ accentColor: 'var(--accent-gold)', width: '17px', height: '17px' }}
                  />
                  <div>
                    <div style={{ fontWeight: '800', color: 'var(--text-light)', fontSize: '0.95rem' }}>Cash / Pay on Delivery (COD)</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>Pay cash or UPI upon delivery</div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* RIGHT: Order Summary details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'sticky', top: '100px' }}>
            <div className="glass-card" style={{ padding: '2rem', backgroundColor: 'transparent', borderRadius: '16px', border: '1px solid rgba(245, 235, 221, 0.25)', boxShadow: 'var(--shadow-sm)' }}>
              <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-serif)', color: 'var(--text-light)', fontWeight: '800', marginBottom: '1.5rem', margin: 0 }}>
                Order Summary
              </h3>

              {/* Items listing */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingBottom: '1.5rem', borderBottom: '1px solid rgba(245, 235, 221, 0.15)', marginTop: '1.25rem' }}>
                {cartItems.map((item) => (
                  <div key={item.key} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <img
                      src={item.image}
                      alt={item.title}
                      style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px', border: '1px solid rgba(245, 235, 221, 0.15)' }}
                    />
                    <div style={{ flexGrow: 1 }}>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--text-light)', margin: '0 0 0.15rem 0', lineHeight: '1.25' }}>{item.title}</h4>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block' }}>
                        Qty: {item.quantity} • {item.variantName} ({item.weight})
                      </span>
                    </div>
                    <span style={{ fontWeight: '800', color: 'var(--text-light)', fontSize: '0.95rem' }}>
                      ₹{item.totalPrice}
                    </span>
                  </div>
                ))}
              </div>

              {/* Cost Summary calculations */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', padding: '1.5rem 0', borderBottom: '1px solid rgba(245, 235, 221, 0.15)', fontSize: '0.88rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                  <span>Subtotal</span>
                  <span style={{ fontWeight: '700', color: 'var(--text-light)' }}>₹{subtotal}</span>
                </div>
                {couponDiscountAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--accent-gold)', fontWeight: '700' }}>
                    <span>Coupon Discount</span>
                    <span>-₹{couponDiscountAmount}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                  <span>Delivery Charge</span>
                  <span style={{ fontWeight: '700', color: effectiveDeliveryFee === 0 ? 'var(--accent-gold)' : 'var(--text-light)' }}>
                    {effectiveDeliveryFee === 0 ? 'FREE' : `₹${effectiveDeliveryFee}`}
                  </span>
                </div>
              </div>

              {/* Grand Total */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 0 1rem', marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '1.05rem', fontWeight: '850', color: 'var(--text-light)' }}>Total to Pay</span>
                <span style={{ fontSize: '1.4rem', fontWeight: '900', color: 'var(--text-light)' }}>₹{effectiveGrandTotal}</span>
              </div>

              {errorMessage && (
                <div style={{ backgroundColor: 'rgba(217, 83, 79, 0.12)', border: '1px solid var(--accent-terracotta)', color: '#FF7B7B', padding: '0.85rem 1rem', borderRadius: '10px', fontSize: '0.85rem', marginBottom: '1.5rem', fontWeight: '600', lineHeight: '1.4' }}>
                  {errorMessage}
                </div>
              )}

              {/* Submit Checkout Button */}
              <button
                type="submit"
                disabled={loading || (isCurrentPinChecked && !isDeliverable)}
                className="btn-primary"
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  padding: '1rem',
                  fontSize: '0.95rem',
                  backgroundColor: (isCurrentPinChecked && !isDeliverable) ? 'rgba(255, 255, 255, 0.15)' : 'var(--accent-gold)',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: '800',
                  color: (isCurrentPinChecked && !isDeliverable) ? 'var(--text-muted)' : '#24130D',
                  cursor: (isCurrentPinChecked && !isDeliverable) ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'all 0.2s',
                  opacity: loading ? 0.7 : 1
                }}
              >
                {loading ? (
                  <span>{paymentMethod === 'COD' ? 'Placing Order...' : 'Initiating Secure Checkout...'}</span>
                ) : (isCurrentPinChecked && !isDeliverable) ? (
                  <span>Delivery Unavailable to {cleanPin}</span>
                ) : paymentMethod === 'COD' ? (
                  <>
                    <CheckCircle2 size={15} />
                    <span>Place Order (₹{effectiveGrandTotal})</span>
                  </>
                ) : (
                  <>
                    <Lock size={15} />
                    <span>Pay ₹{effectiveGrandTotal} Securely</span>
                  </>
                )}
              </button>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: '600', marginTop: '1rem' }}>
                <ShieldCheck size={14} color="var(--accent-gold)" />
                <span>Encrypted 256-bit SSL secure checkout payment</span>
              </div>

            </div>
          </div>

        </form>
      </div>

      {/* ==================================================
          MODAL 1: SELECT ADDRESS MODAL
         ================================================== */}
      <ModalPortal isOpen={showAddressSelectModal} onClose={() => setShowAddressSelectModal(false)}>
        <div
          className="glass-card"
          style={{
            backgroundColor: 'rgba(32, 17, 10, 0.98)',
            borderRadius: '24px',
            border: '1px solid rgba(245, 235, 221, 0.25)',
            width: '100%',
            maxWidth: '560px',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: 'var(--shadow-lg)',
            overflow: 'hidden'
          }}
        >
          {/* Modal Header */}
          <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(245, 235, 221, 0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontFamily: 'var(--font-serif)', color: 'var(--text-light)', fontWeight: '800', margin: 0 }}>
                Select Delivery Address
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
                Choose which address to deliver this order to
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowAddressSelectModal(false)}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem' }}
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
                    backgroundColor: isSelected ? 'rgba(197, 160, 89, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '16px',
                    border: isSelected ? '2px solid var(--accent-gold)' : '1px solid rgba(245, 235, 221, 0.15)',
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
                      <span style={{ fontSize: '0.68rem', fontWeight: '800', textTransform: 'uppercase', backgroundColor: 'rgba(197, 160, 89, 0.2)', color: 'var(--accent-gold)', padding: '0.2rem 0.6rem', borderRadius: '6px' }}>
                        {addr.addressType || 'Home'}
                      </span>
                      {addr.isDefault && (
                        <span style={{ fontSize: '0.65rem', fontWeight: '800', textTransform: 'uppercase', backgroundColor: 'rgba(39, 76, 55, 0.4)', color: '#85B870', padding: '0.15rem 0.5rem', borderRadius: '999px', border: '1px solid rgba(133, 184, 112, 0.3)' }}>
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
                        style={{ background: 'none', border: 'none', color: '#B99A5B', fontSize: '0.78rem', fontWeight: '800', cursor: 'pointer', padding: 0 }}
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
                          backgroundColor: isSelected ? 'var(--accent-gold)' : 'transparent',
                          color: isSelected ? '#24130D' : 'var(--text-light)',
                          border: isSelected ? 'none' : '1px solid rgba(245, 235, 221, 0.25)',
                          cursor: 'pointer',
                        }}
                      >
                        {isSelected ? 'Selected ✓' : 'Deliver Here'}
                      </button>
                    </div>
                  </div>

                  <div>
                    <div style={{ fontWeight: '850', color: 'var(--text-light)', fontSize: '0.95rem' }}>
                      {addr.fullName}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5', marginTop: '0.2rem' }}>
                      {addr.building && `${addr.building}, `}{addr.addressLine}, {addr.city}, {addr.state} - <strong style={{ color: 'var(--text-light)', fontFamily: 'monospace' }}>{addr.pincode}</strong>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      Phone: {addr.phone}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Modal Footer */}
          <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid rgba(245, 235, 221, 0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.15)' }}>
            <button
              type="button"
              onClick={handleOpenAddAddressInline}
              style={{
                padding: '0.6rem 1.2rem',
                fontSize: '0.82rem',
                fontWeight: '800',
                borderRadius: '10px',
                backgroundColor: 'var(--accent-gold)',
                color: '#24130D',
                border: 'none',
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
                padding: '0.6rem 1.2rem',
                fontSize: '0.82rem',
                fontWeight: '800',
                borderRadius: '10px',
                backgroundColor: 'transparent',
                color: 'var(--text-muted)',
                border: '1px solid rgba(245, 235, 221, 0.2)',
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
            backgroundColor: 'rgba(32, 17, 10, 0.98)',
            borderRadius: '24px',
            border: '1px solid rgba(245, 235, 221, 0.25)',
            width: '100%',
            maxWidth: '520px',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: 'var(--shadow-lg)',
            overflow: 'hidden'
          }}
        >
          {/* Modal Header */}
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(245, 235, 221, 0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.1rem', fontFamily: 'var(--font-serif)', color: 'var(--text-light)', fontWeight: '800', margin: 0 }}>
              {editingAddrTarget ? 'Edit Delivery Address' : 'Add New Delivery Address'}
            </h3>
            <button
              type="button"
              onClick={() => setShowAddEditAddressModal(false)}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem' }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Modal Form Content */}
          <form onSubmit={handleSaveAddressInline} style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', flexGrow: 1 }}>

            {/* Address Type Selector */}
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: '800', color: 'var(--text-light)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Address Label</label>
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
                      border: addressModalForm.addressType === type ? '1.5px solid var(--accent-gold)' : '1px solid rgba(245, 235, 221, 0.15)',
                      backgroundColor: addressModalForm.addressType === type ? 'rgba(197, 160, 89, 0.15)' : 'transparent',
                      color: addressModalForm.addressType === type ? 'var(--accent-gold)' : 'var(--text-muted)',
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
              <label style={{ fontSize: '0.78rem', fontWeight: '800', color: 'var(--text-light)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Recipient Name *</label>
              <input
                type="text"
                required
                value={addressModalForm.fullName}
                onChange={(e) => setAddressModalForm(prev => ({ ...prev, fullName: e.target.value }))}
                placeholder="Yash Mittal"
                style={{ width: '100%', padding: '0.7rem 0.85rem', borderRadius: '10px', border: '1px solid rgba(245, 235, 221, 0.2)', fontSize: '0.88rem', outline: 'none', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-light)' }}
              />
            </div>

            {/* Phone */}
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: '800', color: 'var(--text-light)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Mobile Phone *</label>
              <input
                type="tel"
                required
                value={addressModalForm.phone}
                onChange={(e) => setAddressModalForm(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="9876543210"
                style={{ width: '100%', padding: '0.7rem 0.85rem', borderRadius: '10px', border: '1px solid rgba(245, 235, 221, 0.2)', fontSize: '0.88rem', outline: 'none', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-light)' }}
              />
            </div>

            {/* Building / Flat */}
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: '800', color: 'var(--text-light)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>House / Flat / Building</label>
              <input
                type="text"
                value={addressModalForm.building}
                onChange={(e) => setAddressModalForm(prev => ({ ...prev, building: e.target.value }))}
                placeholder="Sikandrabad / Kaziwara"
                style={{ width: '100%', padding: '0.7rem 0.85rem', borderRadius: '10px', border: '1px solid rgba(245, 235, 221, 0.2)', fontSize: '0.88rem', outline: 'none', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-light)' }}
              />
            </div>

            {/* Street Address */}
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: '800', color: 'var(--text-light)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Street Address *</label>
              <textarea
                rows={2}
                required
                value={addressModalForm.addressLine}
                onChange={(e) => setAddressModalForm(prev => ({ ...prev, addressLine: e.target.value }))}
                placeholder="Main Road, Near Landmark"
                style={{ width: '100%', padding: '0.7rem 0.85rem', borderRadius: '10px', border: '1px solid rgba(245, 235, 221, 0.2)', fontSize: '0.88rem', outline: 'none', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-light)', resize: 'none' }}
              />
            </div>

            {/* City, State, Pincode */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-light)', display: 'block', marginBottom: '0.4rem', textTransform: 'uppercase' }}>City *</label>
                <input
                  type="text"
                  required
                  value={addressModalForm.city}
                  onChange={(e) => setAddressModalForm(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="Bulandshahr"
                  style={{ width: '100%', padding: '0.65rem 0.65rem', borderRadius: '8px', border: '1px solid rgba(245, 235, 221, 0.2)', fontSize: '0.85rem', outline: 'none', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-light)' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-light)', display: 'block', marginBottom: '0.4rem', textTransform: 'uppercase' }}>State *</label>
                <input
                  type="text"
                  required
                  value={addressModalForm.state}
                  onChange={(e) => setAddressModalForm(prev => ({ ...prev, state: e.target.value }))}
                  placeholder="Uttar Pradesh"
                  style={{ width: '100%', padding: '0.65rem 0.65rem', borderRadius: '8px', border: '1px solid rgba(245, 235, 221, 0.2)', fontSize: '0.85rem', outline: 'none', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-light)' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-light)', display: 'block', marginBottom: '0.4rem', textTransform: 'uppercase' }}>Pincode *</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={addressModalForm.pincode}
                  onChange={(e) => setAddressModalForm(prev => ({ ...prev, pincode: e.target.value }))}
                  placeholder="203205"
                  style={{ width: '100%', padding: '0.65rem 0.65rem', borderRadius: '8px', border: '1px solid rgba(245, 235, 221, 0.2)', fontSize: '0.85rem', outline: 'none', fontFamily: 'monospace', fontWeight: '700', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-light)' }}
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
                  borderRadius: '10px',
                  backgroundColor: 'var(--accent-gold)',
                  color: '#24130D',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                {savingAddress ? 'Saving Address...' : (editingAddrTarget ? 'Save & Select Address' : 'Add & Select Address')}
              </button>
              <button
                type="button"
                onClick={() => setShowAddEditAddressModal(false)}
                style={{
                  padding: '0.85rem 1.2rem',
                  fontSize: '0.88rem',
                  fontWeight: '800',
                  borderRadius: '10px',
                  backgroundColor: 'transparent',
                  color: 'var(--text-muted)',
                  border: '1px solid rgba(245, 235, 221, 0.2)',
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
            backgroundColor: 'rgba(42, 21, 14, 0.98)',
            borderRadius: '24px',
            border: '1px solid rgba(245, 235, 221, 0.25)',
            width: '100%',
            maxWidth: '460px',
            padding: '2.5rem',
            boxShadow: 'var(--shadow-lg)',
            position: 'relative'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Lock size={18} color="var(--accent-gold)" />
            <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent-gold)', fontWeight: '800' }}>MILASTY SECURE PAYMENT</span>
          </div>
          <h3 style={{ fontSize: '1.4rem', fontFamily: 'var(--font-serif)', color: 'var(--text-light)', fontWeight: '800', marginBottom: '1.25rem', margin: 0 }}>
            Razorpay Sandbox Simulator
          </h3>

          <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(245, 235, 221, 0.15)', borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Customer Name</span>
              <span style={{ fontWeight: '700', color: 'var(--text-light)' }}>{simulatePaymentData?.customerName}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Razorpay Order ID</span>
              <span style={{ fontWeight: '700', color: 'var(--text-light)', fontFamily: 'monospace' }}>{simulatePaymentData?.razorpayOrderId}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Exact Amount to Pay</span>
              <span style={{ fontWeight: '850', color: 'var(--accent-gold)', fontSize: '1.1rem' }}>₹{simulatePaymentData?.grandTotal}</span>
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
              className="btn-primary"
              style={{ width: '100%', height: '48px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--accent-gold)', border: 'none', color: '#24130D', fontWeight: '850', cursor: 'pointer', fontSize: '0.88rem' }}
            >
              Simulate Successful Payment
            </button>
            <button
              type="button"
              onClick={async () => {
                setShowSimulatedPaymentModal(false);
                await api.post('/payments/fail', { razorpay_order_id: simulatePaymentData.razorpayOrderId }).catch(() => { });
                setErrorMessage('Payment failed. Your order has not been placed.');
                setLoading(false);
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
                if (simulatePaymentData?.options?.modal?.ondismiss) {
                  simulatePaymentData.options.modal.ondismiss();
                }
              }}
              className="btn-secondary"
              style={{ width: '100%', height: '44px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderColor: 'rgba(245, 235, 221, 0.25)', color: 'var(--accent-gold)', backgroundColor: 'transparent', cursor: 'pointer', fontSize: '0.82rem', fontWeight: '800' }}
            >
              Cancel / Close (No Order Created)
            </button>
          </div>
        </div>
      </ModalPortal>
    </div>
  );
}
