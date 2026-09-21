import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight, CheckCircle2, XCircle, Lock, Tag, Check, Calendar, ShieldCheck, Heart, Sparkles, Leaf } from 'lucide-react';
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
    addToCart,
  } = useCart();

  const {
    deliveryInfo,
    checkPincode,
    loading: checkingDelivery,
  } = useDelivery();
  const [pincodeInput, setPincodeInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [isEditingPin, setIsEditingPin] = useState(false);
  const touchStartRef = useRef(null);

  // Recommended products list for "You Might Also Like"
  const [recommendedProducts, setRecommendedProducts] = useState([]);

  // Synchronize pincode input when deliveryInfo changes
  useEffect(() => {
    if (deliveryInfo && deliveryInfo.pincode) {
      setPincodeInput(deliveryInfo.pincode);
    }
  }, [deliveryInfo]);

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

      // Fetch products for "You Might Also Like" section
      const fetchRecommendations = async () => {
        try {
          const res = await api.get('/products?limit=6');
          if (res.data?.products && res.data.products.length > 0) {
            setRecommendedProducts(res.data.products.slice(0, 4));
          }
        } catch (e) {}
      };
      fetchRecommendations();
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

  const handleRemoveItem = (itemKey, title) => {
    if (!itemKey) return;
    removeFromCart(itemKey);
    if (showToast) {
      showToast(`${title || 'Item'} removed from cart.`);
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
        backgroundColor: 'rgba(12, 6, 3, 0.78)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        zIndex: 99990,
      }}
      onClick={() => setIsCartOpen(false)}
    >
      <div
        className="cart-drawer-panel"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          maxWidth: '440px',
          backgroundImage: 'url(/images/ritiual_background_image.jpeg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
          backgroundColor: '#1E0E06',
          boxShadow: '-16px 0 45px rgba(0, 0, 0, 0.65)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 99991,
          boxSizing: 'border-box',
          borderTopLeftRadius: '24px',
          borderBottomLeftRadius: '24px',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
      >
        {/* Dark warm overlay matching MILASTY Shop theme */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(28, 14, 8, 0.94) 0%, rgba(18, 9, 5, 0.97) 100%)',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
          
          {/* Header */}
          <div
            style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid rgba(235, 215, 175, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: 'rgba(18, 9, 5, 0.6)',
              backdropFilter: 'blur(12px)',
              flexShrink: 0,
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: '1.3rem',
                  fontFamily: 'var(--font-serif, Georgia, serif)',
                  color: '#FFFDF9',
                  fontWeight: '800',
                  margin: 0,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}
              >
                YOUR CART
              </h2>
              <div
                style={{
                  fontSize: '0.78rem',
                  color: 'rgba(245, 235, 221, 0.75)',
                  fontWeight: '600',
                  marginTop: '0.15rem',
                }}
              >
                {totalItemCount} {totalItemCount === 1 ? 'item' : 'items'}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-serif)', color: '#E8DCCB', fontStyle: 'italic', display: 'none', smDisplay: 'inline' }}>
                Good Food Brings People Closer ♥
              </span>
              <button
                onClick={() => setIsCartOpen(false)}
                aria-label="Close Cart"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(245, 235, 221, 0.2)',
                  color: '#FFFDF9',
                  width: '36px',
                  height: '36px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(185, 205, 148, 0.25)';
                  e.currentTarget.style.borderColor = '#b9cd94';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.borderColor = 'rgba(245, 235, 221, 0.2)';
                }}
              >
                <X size={18} />
              </button>
            </div>
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
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(185, 205, 148, 0.12)',
                    border: '1px solid rgba(185, 205, 148, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ShoppingBag size={38} color="#b9cd94" />
                </div>
                <div>
                  <h3
                    style={{
                      fontSize: '1.35rem',
                      fontFamily: 'var(--font-serif, Georgia, serif)',
                      color: '#FFFDF9',
                      fontWeight: '800',
                      margin: '0 0 0.4rem 0',
                    }}
                  >
                    Your Cart is Empty
                  </h3>
                  <p style={{ fontSize: '0.88rem', lineHeight: '1.5', margin: 0, maxWidth: '260px', color: 'rgba(245, 235, 221, 0.75)' }}>
                    Looks like you haven't added any handcrafted millet bakes yet.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    navigate('/shop');
                  }}
                  style={{
                    marginTop: '0.5rem',
                    padding: '0.85rem 1.85rem',
                    backgroundColor: '#244f21',
                    color: '#FFFDF9',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    border: '1.5px solid #b9cd94',
                    borderRadius: '999px',
                    cursor: 'pointer',
                    fontWeight: '800',
                    fontSize: '0.9rem',
                    boxShadow: '0 8px 24px rgba(36, 79, 33, 0.35)',
                    transition: 'all 0.25s ease',
                  }}
                >
                  <span>Explore Our Bakes</span>
                  <ArrowRight size={16} color="#b9cd94" />
                </button>
              </div>
            ) : (
              <>
                {/* Cart Items List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                  {cartItems.map((item, idx) => {
                    const itemKey = item.cartItemId || item.key || item._id || item.id || `cart_item_${idx}`;
                    const unitPrice = item.unitPrice !== undefined ? item.unitPrice : (item.price || 0);

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
                        key={itemKey}
                        style={{
                          display: 'flex',
                          gap: '1rem',
                          padding: '1rem',
                          borderRadius: '16px',
                          backgroundColor: 'rgba(55, 31, 17, 0.75)',
                          border: '1px solid rgba(235, 215, 175, 0.18)',
                          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
                          alignItems: 'center',
                          backdropFilter: 'blur(8px)',
                        }}
                      >
                        {/* Item Image */}
                        <img
                          src={item.image}
                          alt={item.title}
                          style={{
                            width: '76px',
                            height: '76px',
                            objectFit: 'cover',
                            borderRadius: '12px',
                            border: '1px solid rgba(235, 215, 175, 0.15)',
                            flexShrink: 0,
                          }}
                        />

                        {/* Item Info */}
                        <div style={{ flexGrow: 1, minWidth: 0 }}>
                          <h4
                            style={{
                              fontSize: '1rem',
                              fontFamily: 'var(--font-serif, Georgia, serif)',
                              fontWeight: '700',
                              color: '#FFFDF9',
                              margin: '0 0 0.2rem 0',
                              lineHeight: '1.3',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {item.title}
                          </h4>
                          {(item.is_preorder || item.isPreorder) && (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.68rem', backgroundColor: 'rgba(212, 175, 55, 0.2)', color: '#D4AF37', border: '1px solid rgba(212, 175, 55, 0.4)', padding: '0.15rem 0.45rem', borderRadius: '4px', fontWeight: '700', marginBottom: '0.35rem' }}>
                              <Calendar size={10} color="#D4AF37" />
                              <span>Pre-order</span>
                            </div>
                          )}
                          {displayVariant && (
                            <div
                              style={{
                                fontSize: '0.78rem',
                                color: 'rgba(245, 235, 221, 0.65)',
                                marginBottom: '0.45rem',
                              }}
                            >
                              {displayVariant}
                            </div>
                          )}
                          <div
                            style={{
                              fontSize: '0.95rem',
                              fontFamily: 'var(--font-serif, Georgia, serif)',
                              color: '#FFFDF9',
                              fontWeight: '700',
                              marginBottom: '0.5rem',
                            }}
                          >
                            ₹{unitPrice}
                          </div>

                          {/* Controls Row */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                border: '1px solid rgba(255, 255, 255, 0.15)',
                                borderRadius: '8px',
                                backgroundColor: 'rgba(20, 10, 5, 0.5)',
                                overflow: 'hidden',
                              }}
                            >
                              <button
                                onClick={() => updateQuantity(itemKey, item.quantity - 1)}
                                aria-label="Decrease Quantity"
                                style={{
                                  padding: '0.3rem 0.6rem',
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
                                  padding: '0 0.5rem',
                                  fontSize: '0.85rem',
                                  fontWeight: '800',
                                  color: '#FFFDF9',
                                }}
                              >
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(itemKey, item.quantity + 1)}
                                disabled={isMaxStockReached}
                                aria-label="Increase Quantity"
                                style={{
                                  padding: '0.3rem 0.6rem',
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
                              onClick={() => handleRemoveItem(itemKey, item.title)}
                              aria-label="Remove Item"
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#ef5350',
                                padding: '0.25rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                borderRadius: '4px',
                              }}
                              title="Remove item"
                            >
                              <Trash2 size={16} />
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
                            fontFamily: 'var(--font-serif, Georgia, serif)',
                            fontWeight: '800',
                            color: '#FFFDF9',
                            fontSize: '1.05rem',
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
                    padding: '1.15rem 1.25rem',
                    borderRadius: '16px',
                    backgroundColor: 'rgba(38, 20, 12, 0.7)',
                    border: '1px solid rgba(235, 215, 175, 0.15)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#FFFDF9', letterSpacing: '0.04em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.4rem', fontFamily: 'var(--font-serif)' }}>
                      <Tag size={15} color="#b9cd94" />
                      <span>COUPONS & OFFERS</span>
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'rgba(245, 235, 221, 0.65)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                      <Leaf size={12} color="#b9cd94" />
                      <span>Save more on wholesome treats!</span>
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
                          color: '#ef5350',
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
                            padding: '0.65rem 0.85rem',
                            borderRadius: '10px',
                            border: '1px solid rgba(235, 215, 175, 0.2)',
                            backgroundColor: 'rgba(15, 8, 4, 0.65)',
                            color: '#FFFDF9',
                            fontSize: '0.85rem',
                            fontWeight: '700',
                            outline: 'none',
                            textTransform: 'uppercase',
                          }}
                        />
                        <button
                          type="submit"
                          disabled={couponLoading || !couponInputCode.trim()}
                          style={{
                            padding: '0.65rem 1.1rem',
                            borderRadius: '10px',
                            backgroundColor: '#244f21',
                            color: '#FFFDF9',
                            border: '1px solid #b9cd94',
                            fontSize: '0.85rem',
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
                        <div style={{ color: '#ef5350', fontSize: '0.75rem', marginTop: '0.4rem', fontWeight: '600' }}>
                          {couponError}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Available Promotional Offers Listing */}
                  {!appliedCoupon && availableCoupons && availableCoupons.length > 0 && (
                    <div style={{ borderTop: '1px solid rgba(235, 215, 175, 0.12)', paddingTop: '0.65rem', marginTop: '0.2rem' }}>
                      <div style={{ fontSize: '0.74rem', fontWeight: '850', color: '#b9cd94', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
                        AVAILABLE OFFERS
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
                                borderRadius: '10px',
                                backgroundColor: 'rgba(20, 10, 5, 0.4)',
                                border: '1px dashed rgba(185, 205, 148, 0.35)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '0.5rem',
                              }}
                            >
                              <div>
                                <div style={{ fontSize: '0.82rem', fontWeight: '850', color: '#FFFDF9', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                  <span>{coupon.code}</span>
                                  <span style={{ fontSize: '0.68rem', padding: '0.1rem 0.35rem', borderRadius: '4px', backgroundColor: 'rgba(185, 205, 148, 0.2)', color: '#b9cd94' }}>
                                    {coupon.discountText}
                                  </span>
                                </div>
                                <div style={{ fontSize: '0.72rem', color: isEligible ? '#81c784' : 'rgba(245, 235, 221, 0.65)', marginTop: '0.15rem', fontWeight: '600' }}>
                                  {isEligible ? '✓ Eligible' : `🔒 Add ₹${diff} more to use`}
                                </div>
                              </div>
                              <button
                                onClick={() => handleApplyCouponSubmit(null, coupon.code)}
                                disabled={!isEligible || couponLoading}
                                style={{
                                  padding: '0.35rem 0.85rem',
                                  borderRadius: '8px',
                                  backgroundColor: isEligible ? '#244f21' : 'rgba(255, 255, 255, 0.1)',
                                  color: isEligible ? '#FFFDF9' : 'rgba(255, 255, 255, 0.4)',
                                  border: isEligible ? '1px solid #b9cd94' : 'none',
                                  fontSize: '0.78rem',
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
                    padding: '1.15rem 1.25rem',
                    borderRadius: '16px',
                    backgroundColor: 'rgba(38, 20, 12, 0.7)',
                    border: '1px solid rgba(235, 215, 175, 0.15)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.65rem',
                    backdropFilter: 'blur(8px)',
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
                        fontFamily: 'var(--font-serif)',
                      }}
                    >
                      DELIVERY CHECK
                    </span>
                  </div>

                  {!isDeliveryChecked || isEditingPin ? (
                    /* Form to enter PIN */
                    <div>
                      <div
                        style={{
                          fontSize: '0.78rem',
                          color: 'rgba(245, 235, 221, 0.7)',
                          marginBottom: '0.5rem',
                        }}
                      >
                        Check delivery availability to your location
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
                            padding: '0.6rem 0.85rem',
                            borderRadius: '10px',
                            border: '1px solid rgba(235, 215, 175, 0.2)',
                            backgroundColor: 'rgba(15, 8, 4, 0.65)',
                            color: '#FFFDF9',
                            fontSize: '0.85rem',
                            outline: 'none',
                          }}
                        />
                        <button
                          type="submit"
                          disabled={checkingDelivery}
                          style={{
                            padding: '0.6rem 1rem',
                            borderRadius: '10px',
                            backgroundColor: '#244f21',
                            color: '#FFFDF9',
                            border: '1px solid #b9cd94',
                            fontSize: '0.82rem',
                            fontWeight: '800',
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
                            fontSize: '0.75rem',
                            marginTop: '0.4rem',
                            fontWeight: '600',
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
                          color: 'rgba(245, 235, 221, 0.65)',
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
                          color: 'rgba(245, 235, 221, 0.65)',
                          paddingLeft: '1.35rem',
                        }}
                      >
                        We currently don't deliver to PIN code {deliveryInfo.pincode}.
                      </div>
                    </div>
                  )}
                </div>

                {/* You Might Also Like Section */}
                {recommendedProducts.length > 0 && (
                  <div
                    style={{
                      padding: '1.15rem 1.25rem',
                      borderRadius: '16px',
                      backgroundColor: 'rgba(38, 20, 12, 0.7)',
                      border: '1px solid rgba(235, 215, 175, 0.15)',
                      backdropFilter: 'blur(8px)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                      <span style={{ fontSize: '0.9rem', fontFamily: 'var(--font-serif)', color: '#FFFDF9', fontWeight: '800' }}>
                        You Might Also Like
                      </span>
                      <button
                        onClick={() => {
                          setIsCartOpen(false);
                          navigate('/shop');
                        }}
                        style={{ background: 'none', border: 'none', color: '#b9cd94', fontSize: '0.78rem', fontWeight: '700', cursor: 'pointer' }}
                      >
                        See All &gt;
                      </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      {recommendedProducts.map((recProd) => (
                        <div
                          key={recProd.id || recProd._id || recProd.slug}
                          style={{
                            padding: '0.65rem',
                            borderRadius: '12px',
                            backgroundColor: 'rgba(20, 10, 5, 0.5)',
                            border: '1px solid rgba(235, 215, 175, 0.12)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.4rem',
                          }}
                        >
                          <img
                            src={recProd.image || recProd.image_url}
                            alt={recProd.title}
                            style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '8px' }}
                          />
                          <div style={{ fontSize: '0.78rem', fontWeight: '700', color: '#FFFDF9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {recProd.title}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.2rem' }}>
                            <span style={{ fontSize: '0.82rem', fontWeight: '800', color: '#b9cd94' }}>
                              ₹{recProd.price || recProd.variants?.[0]?.price || 99}
                            </span>
                            <button
                              onClick={() => {
                                addToCart(recProd);
                                if (showToast) showToast(`${recProd.title} added to cart!`);
                              }}
                              style={{
                                padding: '0.2rem 0.55rem',
                                borderRadius: '6px',
                                backgroundColor: '#244f21',
                                color: '#FFFDF9',
                                border: '1px solid #b9cd94',
                                fontSize: '0.72rem',
                                fontWeight: '800',
                                cursor: 'pointer',
                              }}
                            >
                              + Add
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Sticky Summary / Footer */}
          {cartItems.length > 0 && (
            <div
              style={{
                borderTop: '1px solid rgba(235, 215, 175, 0.15)',
                padding: '1.25rem 1.5rem',
                backgroundColor: 'rgba(18, 9, 5, 0.96)',
                backdropFilter: 'blur(16px)',
                boxShadow: '0 -10px 30px rgba(0, 0, 0, 0.5)',
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
                    color: 'rgba(245, 235, 221, 0.7)',
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
                    color: 'rgba(245, 235, 221, 0.7)',
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
                        : 'rgba(245, 235, 221, 0.5)',
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
                    fontSize: '1.2rem',
                    fontFamily: 'var(--font-serif, Georgia, serif)',
                    color: '#FFFDF9',
                    paddingTop: '0.55rem',
                    marginTop: '0.2rem',
                    borderTop: '1px solid rgba(235, 215, 175, 0.15)',
                  }}
                >
                  <span>Total Amount</span>
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
                  padding: '1rem',
                  fontSize: '0.92rem',
                  backgroundColor: '#244f21',
                  color: '#FFFDF9',
                  border: '1.5px solid #b9cd94',
                  borderRadius: '999px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  boxShadow: '0 8px 24px rgba(36, 79, 33, 0.4)',
                  transition: 'all 0.25s ease',
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#2e652a')}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#244f21')}
              >
                <span>PROCEED TO CHECKOUT</span>
                <ArrowRight size={18} color="#b9cd94" />
              </button>

              {/* Clean Security Message */}
              <div
                style={{
                  textAlign: 'center',
                  marginTop: '0.75rem',
                  fontSize: '0.75rem',
                  color: 'rgba(245, 235, 221, 0.7)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.35rem',
                }}
              >
                <Lock size={13} color="#b9cd94" />
                <span>Secure checkout | 100% Safe & Encrypted</span>
              </div>

              {/* Trust Badges Bar */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: '0.5rem',
                  marginTop: '1rem',
                  paddingTop: '0.85rem',
                  borderTop: '1px solid rgba(235, 215, 175, 0.1)',
                  textAlign: 'center',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}>
                  <Leaf size={14} color="#b9cd94" />
                  <span style={{ fontSize: '0.65rem', color: 'rgba(245, 235, 221, 0.8)', fontWeight: '700' }}>100% Natural</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}>
                  <ShieldCheck size={14} color="#b9cd94" />
                  <span style={{ fontSize: '0.65rem', color: 'rgba(245, 235, 221, 0.8)', fontWeight: '700' }}>Secure Payment</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}>
                  <Sparkles size={14} color="#b9cd94" />
                  <span style={{ fontSize: '0.65rem', color: 'rgba(245, 235, 221, 0.8)', fontWeight: '700' }}>Freshly Packed</span>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
