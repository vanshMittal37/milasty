import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight, CheckCircle2, XCircle, Lock, MapPin, Tag, Percent, Gift, Check } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useDelivery } from '../context/DeliveryContext';
import api from '../api/axios';

export default function CartDrawer() {
  const navigate = useNavigate();
  const {
    cartItems,
    isCartOpen,
    setIsCartOpen,
    setMobileNavOpen,
    updateQuantity,
    removeFromCart,
    subtotal,
    showToast,
    appliedCoupon,
    couponDiscountAmount,
    applyCoupon,
    removeCoupon,
    grandTotal,
  } = useCart();

  const {
    deliveryInfo,
    checkPincode,
    loading: checkingDelivery,
  } = useDelivery();

  // Coupon State
  const [couponInputCode, setCouponInputCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [availableCoupons, setAvailableCoupons] = useState([]);

  useEffect(() => {
    if (isCartOpen) {
      const fetchActiveCoupons = async () => {
        try {
          const res = await api.get('/coupons/active');
          if (res.data?.success && res.data?.coupons) {
            setAvailableCoupons(res.data.coupons);
          }
        } catch (e) {}
      };
      fetchActiveCoupons();
    }
  }, [isCartOpen]);

  const handleApplyCouponSubmit = async (e, codeOverride) => {
    if (e) e.preventDefault();
    const targetCode = (codeOverride || couponInputCode).trim().toUpperCase();
    if (!targetCode) {
      setCouponError('Please enter a coupon code.');
      return;
    }

    setCouponLoading(true);
    setCouponError('');
    try {
      const res = await applyCoupon(targetCode);
      if (res && res.success) {
        setCouponInputCode('');
        setCouponError('');
      } else if (res && res.message) {
        setCouponError(res.message);
      }
    } catch (err) {
      setCouponError('Error applying coupon. Please try again.');
    } finally {
      setCouponLoading(false);
    }
  };

  // Close drawer on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsCartOpen(false);
      }
    };
    if (isCartOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isCartOpen, setIsCartOpen]);

  // Touch gesture handler for swiping right to close on mobile
  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    if (touch) {
      touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    }
  };

  const handleTouchMove = (e) => {
    if (!touchStartRef.current) return;
    const touch = e.touches[0];
    if (!touch) return;
    const diffX = touch.clientX - touchStartRef.current.x;
    const diffY = Math.abs(touch.clientY - touchStartRef.current.y);
    if (diffX > 10 && diffX > diffY) {
      if (e.cancelable) e.preventDefault();
    }
  };

  const handleTouchEnd = (e) => {
    if (!touchStartRef.current) return;
    const touch = e.changedTouches[0];
    if (touch) {
      const diffX = touch.clientX - touchStartRef.current.x;
      const diffY = Math.abs(touch.clientY - touchStartRef.current.y);
      if (diffX > 45 && diffX > diffY) {
        setIsCartOpen(false);
      }
    }
    touchStartRef.current = null;
  };

  if (!isCartOpen) return null;

  const totalItemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const isDeliveryChecked = deliveryInfo && deliveryInfo.checked;
  const isDeliverable = isDeliveryChecked && (deliveryInfo.available ?? deliveryInfo.isDeliverable);
  const deliveryCharge = isDeliverable ? Number(deliveryInfo.deliveryCharge || 0) : 0;
  const totalAmount = subtotal + (isDeliverable ? deliveryCharge : 0);

  const handleCheckPinSubmit = async (e) => {
    if (e) e.preventDefault();
    setPinError('');
    const cleanPin = pincodeInput.trim();
    if (!cleanPin || !/^\d{6}$/.test(cleanPin)) {
      setPinError('Enter a valid 6-digit Indian PIN code.');
      return;
    }
    const res = await checkPincode(cleanPin);
    if (res) {
      setIsEditingPin(false);
      if (!res.available && !res.isDeliverable) {
        setPinError("We currently don't deliver to this PIN code.");
      }
    }
  };

  const handleRemoveItem = (item) => {
    removeFromCart(item.key);
    if (showToast) {
      showToast(`${item.title} removed from cart.`);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(14, 7, 4, 0.75)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 99990,
        display: 'flex',
        justifyContent: 'flex-end',
      }}
      onClick={() => setIsCartOpen(false)}
      className="animate-fade-in cart-drawer-backdrop"
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          height: '100dvh',
          backgroundColor: '#140A05',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-8px 0 35px rgba(0, 0, 0, 0.6)',
          borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
          touchAction: 'pan-y',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="animate-slide-right cart-drawer-panel"
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#140A05',
            flexShrink: 0,
          }}
        >
          <div>
            <h2
              style={{
                fontSize: '1.15rem',
                fontFamily: 'var(--font-serif, Georgia, serif)',
                color: '#FFFDF9',
                fontWeight: '800',
                margin: 0,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              Your Cart
            </h2>
            <div
              style={{
                fontSize: '0.78rem',
                color: '#b9cd94',
                fontWeight: '600',
                marginTop: '0.2rem',
              }}
            >
              {totalItemCount} {totalItemCount === 1 ? 'item' : 'items'}
            </div>
          </div>
          <button
            onClick={() => setIsCartOpen(false)}
            aria-label="Close Cart"
            style={{
              background: 'none',
              border: 'none',
              color: '#FFFDF9',
              width: '36px',
              height: '36px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              transition: 'background-color 0.2s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.12)')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)')}
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div
          style={{
            flexGrow: 1,
            overflowY: 'auto',
            padding: '1.25rem 1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
          }}
        >
          {cartItems.length === 0 ? (
            /* Empty Cart View */
            <div
              style={{
                textAlign: 'center',
                padding: '4rem 1rem',
                color: 'rgba(255, 253, 249, 0.65)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1.25rem',
                margin: 'auto 0',
              }}
            >
              <div
                style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(185, 205, 148, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ShoppingBag size={34} color="#b9cd94" />
              </div>
              <div>
                <h3
                  style={{
                    fontSize: '1.25rem',
                    fontFamily: 'var(--font-serif, Georgia, serif)',
                    color: '#FFFDF9',
                    fontWeight: '700',
                    margin: '0 0 0.4rem 0',
                  }}
                >
                  Your Cart is Empty
                </h3>
                <p style={{ fontSize: '0.88rem', lineHeight: '1.5', margin: 0, maxWidth: '260px' }}>
                  Looks like you haven't added anything yet.
                </p>
              </div>
              <button
                onClick={() => {
                  setIsCartOpen(false);
                  navigate('/shop');
                }}
                style={{
                  marginTop: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#244f21',
                  color: '#FFFDF9',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  border: '1px solid #b9cd94',
                  borderRadius: '999px',
                  cursor: 'pointer',
                  fontWeight: '700',
                  fontSize: '0.88rem',
                  transition: 'background-color 0.2s',
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#2e652a')}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#244f21')}
              >
                <span>Explore the Collection</span>
                <ArrowRight size={16} />
              </button>
            </div>
          ) : (
            <>
              {/* Cart Items List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {cartItems.map((item) => {
                  const displayVariant =
                    item.variantName &&
                    item.variantName !== 'default' &&
                    item.variantName !== 'Standard Pack'
                      ? item.variantName
                      : item.weight
                      ? item.weight
                      : item.variantName === 'Standard Pack'
                      ? 'Standard Pack'
                      : null;

                  const isMaxStockReached =
                    item.availableStock !== undefined && item.quantity >= item.availableStock;

                  return (
                    <div
                      key={item.key}
                      style={{
                        display: 'flex',
                        gap: '0.9rem',
                        padding: '0.9rem',
                        borderRadius: '14px',
                        backgroundColor: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        alignItems: 'center',
                      }}
                    >
                      {/* Item Image */}
                      <img
                        src={item.image}
                        alt={item.title}
                        style={{
                          width: '72px',
                          height: '72px',
                          objectFit: 'cover',
                          borderRadius: '10px',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          flexShrink: 0,
                        }}
                      />

                      {/* Item Info */}
                      <div style={{ flexGrow: 1, minWidth: 0 }}>
                        <h4
                          style={{
                            fontSize: '0.92rem',
                            fontWeight: '700',
                            color: '#FFFDF9',
                            margin: '0 0 0.15rem 0',
                            lineHeight: '1.3',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {item.title}
                        </h4>
                        {displayVariant && (
                          <div
                            style={{
                              fontSize: '0.75rem',
                              color: 'rgba(255, 253, 249, 0.6)',
                              marginBottom: '0.4rem',
                            }}
                          >
                            {displayVariant}
                          </div>
                        )}
                        <div
                          style={{
                            fontSize: '0.88rem',
                            color: '#b9cd94',
                            fontWeight: '700',
                            marginBottom: '0.45rem',
                          }}
                        >
                          ₹{item.price}
                        </div>

                        {/* Controls Row */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <div
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              border: '1px solid rgba(255, 255, 255, 0.12)',
                              borderRadius: '6px',
                              backgroundColor: 'rgba(255, 255, 255, 0.04)',
                              overflow: 'hidden',
                            }}
                          >
                            <button
                              onClick={() => updateQuantity(item.key, -1)}
                              aria-label="Decrease Quantity"
                              style={{
                                padding: '0.25rem 0.45rem',
                                background: 'none',
                                border: 'none',
                                color: '#FFFDF9',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                              }}
                            >
                              <Minus size={12} />
                            </button>
                            <span
                              style={{
                                padding: '0 0.4rem',
                                fontSize: '0.82rem',
                                fontWeight: '700',
                                color: '#FFFDF9',
                              }}
                            >
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.key, 1)}
                              disabled={isMaxStockReached}
                              aria-label="Increase Quantity"
                              style={{
                                padding: '0.25rem 0.45rem',
                                background: 'none',
                                border: 'none',
                                color: isMaxStockReached ? 'rgba(255, 255, 255, 0.25)' : '#FFFDF9',
                                cursor: isMaxStockReached ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                              }}
                            >
                              <Plus size={12} />
                            </button>
                          </div>

                          <button
                            onClick={() => handleRemoveItem(item)}
                            aria-label="Remove Item"
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'rgba(239, 83, 80, 0.85)',
                              padding: '0.25rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              borderRadius: '4px',
                            }}
                            title="Remove item"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                        {isMaxStockReached && (
                          <div
                            style={{
                              fontSize: '0.68rem',
                              color: '#e5c158',
                              marginTop: '0.25rem',
                              fontWeight: '600',
                            }}
                          >
                            Max available quantity reached
                          </div>
                        )}
                      </div>

                      {/* Item Total Price */}
                      <div
                        style={{
                          textAlign: 'right',
                          fontWeight: '800',
                          color: '#FFFDF9',
                          fontSize: '0.98rem',
                          flexShrink: 0,
                        }}
                      >
                        ₹{item.totalPrice}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Promo Coupon Section */}
              <div
                style={{
                  padding: '1rem 1.15rem',
                  borderRadius: '14px',
                  backgroundColor: 'rgba(255, 255, 255, 0.025)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#FFFDF9', letterSpacing: '0.04em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Tag size={14} color="#b9cd94" />
                    <span>Coupons & Offers</span>
                  </span>
                </div>

                {appliedCoupon ? (
                  /* Applied Coupon State */
                  <div
                    style={{
                      padding: '0.85rem 1rem',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(36, 79, 33, 0.35)',
                      border: '1px solid rgba(185, 205, 148, 0.45)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#b9cd94', fontWeight: '850', fontSize: '0.85rem' }}>
                        <Check size={14} />
                        <span>{appliedCoupon.code} APPLIED</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#FFFDF9', marginTop: '0.2rem', fontWeight: '600' }}>
                        You saved ₹{couponDiscountAmount}
                      </div>
                    </div>
                    <button
                      onClick={removeCoupon}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'rgba(239, 83, 80, 0.9)',
                        fontSize: '0.78rem',
                        fontWeight: '800',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  /* Coupon Input Form */
                  <div>
                    <form onSubmit={(e) => handleApplyCouponSubmit(e)} style={{ display: 'flex', gap: '0.5rem' }}>
                      <input
                        type="text"
                        placeholder="Enter coupon code (e.g. WELCOME10)"
                        value={couponInputCode}
                        onChange={(e) => {
                          setCouponInputCode(e.target.value.toUpperCase());
                          setCouponError('');
                        }}
                        style={{
                          flexGrow: 1,
                          padding: '0.5rem 0.75rem',
                          borderRadius: '8px',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          backgroundColor: 'rgba(0, 0, 0, 0.35)',
                          color: '#FFFDF9',
                          fontSize: '0.82rem',
                          fontWeight: '700',
                          outline: 'none',
                          textTransform: 'uppercase',
                        }}
                      />
                      <button
                        type="submit"
                        disabled={couponLoading || !couponInputCode.trim()}
                        style={{
                          padding: '0.5rem 0.9rem',
                          borderRadius: '8px',
                          backgroundColor: '#244f21',
                          color: '#FFFDF9',
                          border: '1px solid #b9cd94',
                          fontSize: '0.8rem',
                          fontWeight: '800',
                          cursor: 'pointer',
                          flexShrink: 0,
                          opacity: couponLoading || !couponInputCode.trim() ? 0.6 : 1,
                        }}
                      >
                        {couponLoading ? 'Applying...' : 'Apply'}
                      </button>
                    </form>
                    {couponError && (
                      <div style={{ color: '#ef5350', fontSize: '0.74rem', marginTop: '0.4rem', fontWeight: '600' }}>
                        {couponError}
                      </div>
                    )}
                  </div>
                )}

                {/* Available Promotional Offers Listing */}
                {!appliedCoupon && availableCoupons && availableCoupons.length > 0 && (
                  <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '0.65rem', marginTop: '0.2rem' }}>
                    <div style={{ fontSize: '0.74rem', fontWeight: '850', color: '#b9cd94', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
                      Available Offers
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {availableCoupons.map((coupon) => {
                        const isEligible = subtotal >= (coupon.minOrderAmount || 0);
                        const diff = (coupon.minOrderAmount || 0) - subtotal;
                        return (
                          <div
                            key={coupon.id || coupon.code}
                            style={{
                              padding: '0.65rem 0.75rem',
                              borderRadius: '8px',
                              backgroundColor: 'rgba(255, 255, 255, 0.03)',
                              border: '1px dashed rgba(185, 205, 148, 0.3)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '0.5rem',
                            }}
                          >
                            <div>
                              <div style={{ fontSize: '0.8rem', fontWeight: '850', color: '#FFFDF9', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                <span>{coupon.code}</span>
                                <span style={{ fontSize: '0.68rem', padding: '0.1rem 0.35rem', borderRadius: '4px', backgroundColor: 'rgba(185, 205, 148, 0.2)', color: '#b9cd94' }}>
                                  {coupon.discountText}
                                </span>
                              </div>
                              <div style={{ fontSize: '0.72rem', color: isEligible ? '#81c784' : 'rgba(255, 253, 249, 0.6)', marginTop: '0.15rem', fontWeight: '600' }}>
                                {isEligible ? '✓ Eligible' : `🔒 Add ₹${diff} more to use`}
                              </div>
                            </div>
                            <button
                              onClick={() => handleApplyCouponSubmit(null, coupon.code)}
                              disabled={!isEligible || couponLoading}
                              style={{
                                padding: '0.35rem 0.75rem',
                                borderRadius: '6px',
                                backgroundColor: isEligible ? '#244f21' : 'rgba(255, 255, 255, 0.1)',
                                color: isEligible ? '#FFFDF9' : 'rgba(255, 255, 255, 0.4)',
                                border: isEligible ? '1px solid #b9cd94' : 'none',
                                fontSize: '0.74rem',
                                fontWeight: '800',
                                cursor: isEligible ? 'pointer' : 'not-allowed',
                                flexShrink: 0,
                              }}
                            >
                              Apply
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Delivery Section */}
              <div
                style={{
                  padding: '1rem 1.15rem',
                  borderRadius: '14px',
                  backgroundColor: 'rgba(255, 255, 255, 0.025)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.65rem',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.82rem',
                      fontWeight: '700',
                      color: '#FFFDF9',
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                    }}
                  >
                    Delivery
                  </span>
                </div>

                {!isDeliveryChecked || isEditingPin ? (
                  /* Form to enter PIN */
                  <div>
                    <div
                      style={{
                        fontSize: '0.78rem',
                        color: 'rgba(255, 253, 249, 0.7)',
                        marginBottom: '0.5rem',
                      }}
                    >
                      Check delivery availability
                    </div>
                    <form
                      onSubmit={handleCheckPinSubmit}
                      style={{ display: 'flex', gap: '0.5rem' }}
                    >
                      <input
                        type="text"
                        placeholder="Enter PIN code"
                        maxLength={6}
                        value={pincodeInput}
                        onChange={(e) => {
                          setPincodeInput(e.target.value.replace(/\D/g, ''));
                          setPinError('');
                        }}
                        style={{
                          flexGrow: 1,
                          padding: '0.5rem 0.75rem',
                          borderRadius: '8px',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          backgroundColor: 'rgba(0, 0, 0, 0.35)',
                          color: '#FFFDF9',
                          fontSize: '0.82rem',
                          outline: 'none',
                        }}
                      />
                      <button
                        type="submit"
                        disabled={checkingDelivery}
                        style={{
                          padding: '0.5rem 0.9rem',
                          borderRadius: '8px',
                          backgroundColor: '#244f21',
                          color: '#FFFDF9',
                          border: '1px solid #b9cd94',
                          fontSize: '0.8rem',
                          fontWeight: '700',
                          cursor: 'pointer',
                          flexShrink: 0,
                        }}
                      >
                        {checkingDelivery ? 'Checking...' : 'Check'}
                      </button>
                    </form>
                    {pinError && (
                      <div
                        style={{
                          color: '#ef5350',
                          fontSize: '0.74rem',
                          marginTop: '0.4rem',
                          fontWeight: '500',
                        }}
                      >
                        {pinError}
                      </div>
                    )}
                  </div>
                ) : isDeliverable ? (
                  /* Verified & Available State */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          color: '#81c784',
                          fontSize: '0.82rem',
                          fontWeight: '700',
                        }}
                      >
                        <CheckCircle2 size={15} />
                        <span>Delivery available</span>
                      </div>
                      <button
                        onClick={() => setIsEditingPin(true)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#b9cd94',
                          fontSize: '0.78rem',
                          fontWeight: '700',
                          cursor: 'pointer',
                          textDecoration: 'underline',
                          padding: 0,
                        }}
                      >
                        Change
                      </button>
                    </div>
                    <div
                      style={{
                        fontSize: '0.82rem',
                        color: '#FFFDF9',
                        fontWeight: '600',
                        paddingLeft: '1.35rem',
                      }}
                    >
                      {deliveryInfo.pincode}
                      {(deliveryInfo.city || deliveryInfo.state) && (
                        <span>
                          {' · '}
                          {deliveryInfo.city}
                          {deliveryInfo.state ? `, ${deliveryInfo.state}` : ''}
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: '0.78rem',
                        color: 'rgba(255, 253, 249, 0.65)',
                        paddingLeft: '1.35rem',
                      }}
                    >
                      Delivery charge:{' '}
                      <strong style={{ color: deliveryCharge === 0 ? '#81c784' : '#FFFDF9' }}>
                        {deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge}`}
                      </strong>
                    </div>
                  </div>
                ) : (
                  /* Checked & Unavailable State */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          color: '#ef5350',
                          fontSize: '0.82rem',
                          fontWeight: '700',
                        }}
                      >
                        <XCircle size={15} />
                        <span>Delivery unavailable</span>
                      </div>
                      <button
                        onClick={() => setIsEditingPin(true)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#b9cd94',
                          fontSize: '0.78rem',
                          fontWeight: '700',
                          cursor: 'pointer',
                          textDecoration: 'underline',
                          padding: 0,
                        }}
                      >
                        Change
                      </button>
                    </div>
                    <div
                      style={{
                        fontSize: '0.78rem',
                        color: 'rgba(255, 253, 249, 0.65)',
                        paddingLeft: '1.35rem',
                      }}
                    >
                      We currently don't deliver to PIN code {deliveryInfo.pincode}.
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Sticky Summary / Footer */}
        {cartItems.length > 0 && (
          <div
            style={{
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '1.25rem 1.5rem',
              backgroundColor: '#140A05',
              boxShadow: '0 -8px 24px rgba(0, 0, 0, 0.4)',
              flexShrink: 0,
            }}
          >
            {/* Calculation summary */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.45rem',
                marginBottom: '1rem',
                fontSize: '0.88rem',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  color: 'rgba(255, 253, 249, 0.65)',
                }}
              >
                <span>Subtotal</span>
                <span style={{ fontWeight: '700', color: '#FFFDF9' }}>₹{subtotal}</span>
              </div>
              {appliedCoupon && couponDiscountAmount > 0 && (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    color: '#b9cd94',
                    fontWeight: '700',
                  }}
                >
                  <span>Coupon ({appliedCoupon.code})</span>
                  <span>-₹{couponDiscountAmount}</span>
                </div>
              )}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  color: 'rgba(255, 253, 249, 0.65)',
                }}
              >
                <span>Delivery</span>
                <span
                  style={{
                    fontWeight: '700',
                    color: isDeliverable
                      ? deliveryCharge === 0
                        ? '#81c784'
                        : '#FFFDF9'
                      : 'rgba(255, 253, 249, 0.5)',
                  }}
                >
                  {!isDeliverable
                    ? '—'
                    : deliveryCharge === 0
                    ? 'FREE'
                    : `₹${deliveryCharge}`}
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontWeight: '800',
                  fontSize: '1.15rem',
                  color: '#FFFDF9',
                  paddingTop: '0.55rem',
                  marginTop: '0.2rem',
                  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <span>Total</span>
                <span>₹{Math.max(0, subtotal - couponDiscountAmount + (isDeliverable ? deliveryCharge : 0))}</span>
              </div>
            </div>

            {/* Main Proceed to Checkout CTA */}
            <button
              onClick={() => {
                setIsCartOpen(false);
                navigate('/checkout');
              }}
              style={{
                width: '100%',
                padding: '0.9rem',
                fontSize: '0.9rem',
                backgroundColor: '#244f21',
                color: '#FFFDF9',
                border: '1px solid #b9cd94',
                borderRadius: '12px',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
                transition: 'background-color 0.2s',
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#2e652a')}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#244f21')}
            >
              <span>Proceed to Checkout</span>
              <ArrowRight size={16} />
            </button>

            {/* Clean Single Line Security Message */}
            <div
              style={{
                textAlign: 'center',
                marginTop: '0.75rem',
                fontSize: '0.75rem',
                color: 'rgba(255, 253, 249, 0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.35rem',
              }}
            >
              <Lock size={13} color="#b9cd94" />
              <span>Secure checkout</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

