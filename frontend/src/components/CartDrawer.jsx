import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight, CheckCircle2, XCircle, Lock, MapPin, Tag, Percent, Gift, Check, Calendar } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useDelivery } from '../context/DeliveryContext';
import api from '../api/axios';
import CustomizeItemModal from './CustomizeItemModal';

export default function CartDrawer() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    cartItems,
    isCartOpen,
    setIsCartOpen,
    setMobileNavOpen,
    updateQuantity,
    removeFromCart,
    updateCartItemCustomization,
    removeCartItemCustomization,
    subtotal,
    showToast,
    appliedCoupon,
    couponDiscountAmount,
    applyCoupon,
    removeCoupon,
    grandTotal,
  } = useCart();

  const [editingCustomizationItem, setEditingCustomizationItem] = useState(null);

  const {
    deliveryInfo,
    checkPincode,
    loading: checkingDelivery,
  } = useDelivery();
  const [pincodeInput, setPincodeInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [isEditingPin, setIsEditingPin] = useState(false);
  const touchStartRef = useRef(null);

  // Coupon State — MUST be before any useEffect (Rules of Hooks)
  const [couponInputCode, setCouponInputCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [availableCoupons, setAvailableCoupons] = useState([]);

  // Synchronize pincode input when deliveryInfo changes
  useEffect(() => {
    if (deliveryInfo && deliveryInfo.pincode) {
      setPincodeInput(deliveryInfo.pincode);
    }
  }, [deliveryInfo]);

  useEffect(() => {
    if (isCartOpen) {
      const fetchActiveCoupons = async () => {
        try {
          const res = await api.get('/coupons/active');
          if (res.data?.success && res.data?.coupons) {
            setAvailableCoupons(res.data.coupons);
          }
        } catch (e) { }
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

  const handleRemoveItem = (itemKey, title) => {
    if (!itemKey) return;
    removeFromCart(itemKey);
    if (showToast) {
      showToast(`${title || 'Item'} removed from cart.`);
    }
  };

  // ── MILASTY PREMIUM CART DRAWER ──────────────────────────────────────────────
  return (
    <div
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(20, 10, 5, 0.65)',
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
          top: 0, right: 0, bottom: 0,
          width: 'min(500px, 100vw)',
          background: '#F5EBDD',
          backgroundImage: 'linear-gradient(180deg, #FBF6ED 0%, #F5EBDD 50%, #EFE1CF 100%)',
          boxShadow: '-20px 0 60px rgba(42, 23, 15, 0.22)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 99991,
          boxSizing: 'border-box',
          borderLeft: '1px solid rgba(120, 75, 40, 0.15)',
        }}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* ── PREMIUM HEADER ── */}
        <div style={{
          padding: '1.75rem 1.5rem 1.25rem',
          borderBottom: '1px solid rgba(120, 75, 40, 0.14)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(251, 246, 237, 0.85)',
          flexShrink: 0,
        }}>
          <div>
            <h2 style={{
              fontSize: '2.2rem', fontFamily: 'var(--font-serif, Georgia, serif)',
              color: '#2A170F', fontWeight: '800', margin: 0, lineHeight: '1', letterSpacing: '-0.01em',
            }}>
              Your Cart
            </h2>
            <div style={{ fontSize: '0.85rem', color: '#2F6B3A', fontWeight: '700', marginTop: '0.4rem' }}>
              {totalItemCount} {totalItemCount === 1 ? 'item' : 'items'}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: '#634B3B', fontSize: '0.95rem' }}>
              Good Food Stays ♡
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              aria-label="Close Cart"
              style={{
                background: 'rgba(120, 75, 40, 0.08)', border: '1px solid rgba(120, 75, 40, 0.18)',
                color: '#2A170F', width: '40px', height: '40px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: '50%', transition: 'all 0.2s ease', flexShrink: 0,
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── SCROLLABLE CONTENT ── */}
        <div style={{
          flexGrow: 1, overflowY: 'auto',
          padding: '1.1rem 1.25rem',
          display: 'flex', flexDirection: 'column', gap: '0.85rem',
        }}>
          {cartItems.length === 0 ? (
            /* ── EMPTY STATE ── */
            <div style={{
              textAlign: 'center', padding: '4rem 1rem',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', margin: 'auto 0',
            }}>
              <div style={{
                width: '80px', height: '80px', borderRadius: '50%',
                background: 'rgba(47, 107, 58, 0.08)', border: '1px solid rgba(47, 107, 58, 0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <ShoppingBag size={34} color="#2F6B3A" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-serif, Georgia, serif)', color: '#2A170F', fontWeight: '800', margin: '0 0 0.4rem' }}>
                  Your Cart is Empty
                </h3>
                <p style={{ fontSize: '0.86rem', color: '#634B3B', margin: 0, lineHeight: '1.5' }}>
                  Discover our handcrafted millet bakes.
                </p>
              </div>
              <button
                onClick={() => { setIsCartOpen(false); navigate('/shop'); }}
                style={{
                  padding: '0.85rem 1.85rem',
                  background: '#2F6B3A',
                  color: '#FFFFFF', display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                  border: 'none', borderRadius: '999px',
                  cursor: 'pointer', fontWeight: '800', fontSize: '0.85rem',
                  letterSpacing: '0.06em', textTransform: 'uppercase',
                  boxShadow: '0 4px 16px rgba(47, 107, 58, 0.25)', transition: 'all 0.2s ease',
                }}
              >
                <span>Explore the Collection</span>
                <ArrowRight size={15} />
              </button>
            </div>
          ) : (
            <>
              {/* ── CART ITEMS ── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {cartItems.map((item, idx) => {
                  const itemKey = item.cartItemId || item.key || item._id || item.id || `cart_item_${idx}`;
                  const unitPrice = item.unitPrice !== undefined ? item.unitPrice : (item.price || 0);
                  const displayVariant =
                    item.variantName && item.variantName !== 'default' && item.variantName !== 'Standard Pack'
                      ? item.variantName
                      : item.weight ? item.weight
                        : item.variantName === 'Standard Pack' ? 'Standard Pack' : null;
                  const isMaxStockReached = item.availableStock !== undefined && item.quantity >= item.availableStock;
                  return (
                    <div key={itemKey} style={{
                      display: 'flex', gap: '0.9rem', padding: '1rem',
                      borderRadius: '18px',
                      background: '#FFFFFF',
                      border: '1px solid rgba(120, 75, 40, 0.14)',
                      boxShadow: '0 4px 16px rgba(42, 23, 15, 0.05)',
                      alignItems: 'flex-start',
                    }}>
                      {/* Item Image */}
                      <img src={item.image} alt={item.title} style={{
                        width: '76px', height: '76px', objectFit: 'cover',
                        borderRadius: '12px', border: '1px solid rgba(120, 75, 40, 0.15)', flexShrink: 0,
                      }} />
                      {/* Item Info */}
                      <div style={{ flexGrow: 1, minWidth: 0 }}>
                        <h4 style={{
                          fontSize: '0.92rem', fontWeight: '800',
                          fontFamily: 'var(--font-serif, Georgia, serif)',
                          color: '#2A170F', margin: '0 0 0.18rem', lineHeight: '1.3',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>{item.title}</h4>
                        {(item.is_preorder || item.isPreorder) && (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.65rem', backgroundColor: 'rgba(47, 107, 58, 0.1)', color: '#2F6B3A', border: '1px solid rgba(47, 107, 58, 0.25)', padding: '0.12rem 0.4rem', borderRadius: '4px', fontWeight: '700', marginBottom: '0.28rem' }}>
                            <Calendar size={9} color="#2F6B3A" />
                            <span>Pre-order {item.expected_ship_date || item.expectedShipDate || item.launchDate ? `• Ships: ${item.expected_ship_date || item.expectedShipDate || item.launchDate}` : ''}</span>
                          </div>
                        )}
                        {displayVariant && (
                          <div style={{ fontSize: '0.75rem', color: '#634B3B', marginBottom: '0.3rem', fontWeight: '500' }}>
                            {displayVariant}
                          </div>
                        )}
                        <div style={{ fontSize: '0.9rem', color: '#2A170F', fontWeight: '800', marginBottom: '0.5rem' }}>₹{unitPrice}</div>
                        {/* Controls Row */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{
                            display: 'inline-flex', alignItems: 'center',
                            border: '1px solid rgba(120, 75, 40, 0.2)', borderRadius: '8px',
                            backgroundColor: '#FBF6ED', overflow: 'hidden',
                          }}>
                            <button onClick={() => updateQuantity(itemKey, item.quantity - 1)} aria-label="Decrease Quantity"
                              style={{ padding: '0.3rem 0.55rem', background: 'none', border: 'none', color: '#2A170F', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                              <Minus size={12} />
                            </button>
                            <span style={{ padding: '0 0.45rem', fontSize: '0.86rem', fontWeight: '800', color: '#2A170F', minWidth: '18px', textAlign: 'center' }}>
                              {item.quantity}
                            </span>
                            <button onClick={() => updateQuantity(itemKey, item.quantity + 1)} disabled={isMaxStockReached} aria-label="Increase Quantity"
                              style={{ padding: '0.3rem 0.55rem', background: 'none', border: 'none', color: isMaxStockReached ? 'rgba(120, 75, 40, 0.3)' : '#2A170F', cursor: isMaxStockReached ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center' }}>
                              <Plus size={12} />
                            </button>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <div style={{ fontWeight: '800', color: '#2A170F', fontSize: '1.02rem' }}>₹{item.totalPrice}</div>
                            <button onClick={() => handleRemoveItem(itemKey, item.title)} aria-label="Remove Item" title="Remove item"
                              style={{ background: 'rgba(239, 83, 80, 0.08)', border: '1px solid rgba(239, 83, 80, 0.2)', color: '#d32f2f', padding: '0.28rem', cursor: 'pointer', display: 'flex', alignItems: 'center', borderRadius: '7px', transition: 'all 0.18s' }}>
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                        {isMaxStockReached && (
                          <div style={{ fontSize: '0.67rem', color: '#b78103', marginTop: '0.28rem', fontWeight: '600' }}>Max available quantity reached</div>
                        )}

                        {/* Per-Item Customization Display & Actions */}
                        {item.customization_note ? (
                          <div style={{
                            marginTop: '0.6rem',
                            padding: '0.5rem 0.65rem',
                            backgroundColor: '#FBF6EE',
                            border: '1px solid rgba(47, 125, 50, 0.25)',
                            borderRadius: '8px',
                            fontSize: '0.76rem',
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.15rem' }}>
                              <span style={{ fontWeight: '800', color: '#2F7D32', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                ✦ Special Instruction
                              </span>
                              <div style={{ display: 'flex', gap: '0.45rem' }}>
                                <button
                                  type="button"
                                  onClick={() => setEditingCustomizationItem(item)}
                                  style={{ background: 'none', border: 'none', color: '#2F7D32', fontWeight: '800', cursor: 'pointer', padding: 0, fontSize: '0.72rem', textDecoration: 'underline' }}
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeCartItemCustomization(itemKey)}
                                  style={{ background: 'none', border: 'none', color: '#DC2626', fontWeight: '700', cursor: 'pointer', padding: 0, fontSize: '0.72rem' }}
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                            <p style={{ margin: 0, color: '#3A1F14', fontStyle: 'italic', wordBreak: 'break-word', lineHeight: '1.35' }}>
                              "{item.customization_note}"
                            </p>
                          </div>
                        ) : (
                          <div style={{ marginTop: '0.4rem' }}>
                            <button
                              type="button"
                              onClick={() => setEditingCustomizationItem(item)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#2F7D32',
                                fontWeight: '700',
                                fontSize: '0.75rem',
                                cursor: 'pointer',
                                padding: 0,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.2rem',
                              }}
                            >
                              <span>+ Add Special Instruction</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ── COUPONS & OFFERS ── */}
              <div style={{
                padding: '1rem 1.15rem', borderRadius: '18px',
                background: '#FBF6ED', border: '1px solid rgba(120, 75, 40, 0.14)',
                display: 'flex', flexDirection: 'column', gap: '0.75rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Tag size={14} color="#2F6B3A" />
                  <span style={{ fontSize: '0.78rem', fontWeight: '800', color: '#2A170F', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Coupons & Offers</span>
                </div>

                {appliedCoupon ? (
                  <div style={{
                    padding: '0.85rem 1rem', borderRadius: '12px',
                    background: 'rgba(47, 107, 58, 0.1)', border: '1px solid rgba(47, 107, 58, 0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#2F6B3A', fontWeight: '800', fontSize: '0.85rem' }}>
                        <Check size={14} />
                        <span>{appliedCoupon.code} APPLIED</span>
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#634B3B', marginTop: '0.2rem', fontWeight: '600' }}>You saved ₹{couponDiscountAmount}</div>
                    </div>
                    <button onClick={removeCoupon} style={{ background: 'none', border: 'none', color: '#d32f2f', fontSize: '0.76rem', fontWeight: '800', cursor: 'pointer' }}>Remove</button>
                  </div>
                ) : (
                  <div>
                    <form onSubmit={(e) => handleApplyCouponSubmit(e)} style={{ display: 'flex', gap: '0.5rem' }}>
                      <input
                        type="text"
                        placeholder="Enter coupon code (e.g. WELCOME10)"
                        value={couponInputCode}
                        onChange={(e) => { setCouponInputCode(e.target.value.toUpperCase()); setCouponError(''); }}
                        style={{
                          flexGrow: 1, padding: '0.6rem 0.85rem', borderRadius: '10px',
                          border: '1px solid rgba(120, 75, 40, 0.2)', background: '#FFFFFF',
                          color: '#2A170F', fontSize: '0.82rem', fontWeight: '600', outline: 'none', textTransform: 'uppercase',
                        }}
                      />
                      <button type="submit" disabled={couponLoading || !couponInputCode.trim()}
                        style={{
                          padding: '0.6rem 1.1rem', borderRadius: '10px',
                          background: '#2F6B3A',
                          color: '#FFFFFF', border: 'none',
                          fontSize: '0.78rem', fontWeight: '800',
                          cursor: couponLoading || !couponInputCode.trim() ? 'not-allowed' : 'pointer',
                          flexShrink: 0, opacity: couponLoading || !couponInputCode.trim() ? 0.55 : 1,
                        }}>
                        {couponLoading ? '...' : 'Apply'}
                      </button>
                    </form>
                    {couponError && <div style={{ color: '#d32f2f', fontSize: '0.73rem', marginTop: '0.4rem', fontWeight: '600' }}>{couponError}</div>}
                  </div>
                )}

                {!appliedCoupon && availableCoupons && availableCoupons.length > 0 && (
                  <div style={{ borderTop: '1px solid rgba(120, 75, 40, 0.12)', paddingTop: '0.65rem', marginTop: '0.1rem' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: '800', color: '#2F6B3A', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>Available Offers</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                      {availableCoupons.map((coupon) => {
                        const isEligible = subtotal >= (coupon.minOrderAmount || 0);
                        const diff = (coupon.minOrderAmount || 0) - subtotal;
                        return (
                          <div key={coupon.id || coupon.code} style={{
                            padding: '0.6rem 0.75rem', borderRadius: '10px',
                            background: '#FFFFFF', border: '1px dashed rgba(47, 107, 58, 0.3)',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem',
                          }}>
                            <div>
                              <div style={{ fontSize: '0.78rem', fontWeight: '800', color: '#2A170F', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                <Percent size={11} color="#2F6B3A" />
                                <span>{coupon.code}</span>
                                <span style={{ fontSize: '0.66rem', padding: '0.08rem 0.35rem', borderRadius: '4px', background: 'rgba(47, 107, 58, 0.1)', color: '#2F6B3A' }}>{coupon.discountText}</span>
                              </div>
                              <div style={{ fontSize: '0.7rem', color: isEligible ? '#2F6B3A' : '#806B59', marginTop: '0.1rem', fontWeight: '600' }}>
                                {isEligible ? '✓ Eligible' : `Add ₹${diff} more to use`}
                              </div>
                            </div>
                            <button onClick={() => handleApplyCouponSubmit(null, coupon.code)} disabled={!isEligible || couponLoading}
                              style={{
                                padding: '0.3rem 0.75rem', borderRadius: '8px',
                                background: isEligible ? '#2F6B3A' : 'rgba(120, 75, 40, 0.08)',
                                color: isEligible ? '#FFFFFF' : '#806B59',
                                border: 'none',
                                fontSize: '0.72rem', fontWeight: '800',
                                cursor: isEligible ? 'pointer' : 'not-allowed', flexShrink: 0,
                              }}>Apply</button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* ── DELIVERY ── */}
              <div style={{
                padding: '1rem 1.15rem', borderRadius: '18px',
                background: '#FBF6ED', border: '1px solid rgba(120, 75, 40, 0.14)',
                display: 'flex', flexDirection: 'column', gap: '0.65rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <MapPin size={14} color="#2F6B3A" />
                  <span style={{ fontSize: '0.78rem', fontWeight: '800', color: '#2A170F', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Delivery</span>
                </div>

                {!isDeliveryChecked || isEditingPin ? (
                  <div>
                    <div style={{ fontSize: '0.76rem', color: '#634B3B', marginBottom: '0.5rem' }}>Check delivery availability</div>
                    <form onSubmit={handleCheckPinSubmit} style={{ display: 'flex', gap: '0.5rem' }}>
                      <input type="text" placeholder="Enter PIN code" maxLength={6} value={pincodeInput}
                        onChange={(e) => { setPincodeInput(e.target.value.replace(/\D/g, '')); setPinError(''); }}
                        style={{
                          flexGrow: 1, padding: '0.55rem 0.85rem', borderRadius: '10px',
                          border: '1px solid rgba(120, 75, 40, 0.2)', background: '#FFFFFF',
                          color: '#2A170F', fontSize: '0.82rem', outline: 'none',
                        }}
                      />
                      <button type="submit" disabled={checkingDelivery}
                        style={{
                          padding: '0.55rem 0.9rem', borderRadius: '10px',
                          background: '#2F6B3A',
                          color: '#FFFFFF', border: 'none',
                          fontSize: '0.78rem', fontWeight: '700', cursor: 'pointer', flexShrink: 0,
                        }}>{checkingDelivery ? '...' : 'Check'}</button>
                    </form>
                    {pinError && <div style={{ color: '#d32f2f', fontSize: '0.72rem', marginTop: '0.4rem', fontWeight: '500' }}>{pinError}</div>}
                  </div>
                ) : isDeliverable ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#2F6B3A', fontSize: '0.8rem', fontWeight: '700' }}>
                        <CheckCircle2 size={14} /><span>Delivery available</span>
                      </div>
                      <button onClick={() => setIsEditingPin(true)} style={{ background: 'none', border: 'none', color: '#2F6B3A', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', padding: 0 }}>Change</button>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#2A170F', fontWeight: '600', paddingLeft: '1.3rem' }}>
                      {deliveryInfo.pincode}
                      {(deliveryInfo.city || deliveryInfo.state) && <span> · {deliveryInfo.city}{deliveryInfo.state ? `, ${deliveryInfo.state}` : ''}</span>}
                    </div>
                    <div style={{ fontSize: '0.76rem', color: '#634B3B', paddingLeft: '1.3rem' }}>
                      Delivery charge: <strong style={{ color: deliveryCharge === 0 ? '#2F6B3A' : '#2A170F' }}>{deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge}`}</strong>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#d32f2f', fontSize: '0.8rem', fontWeight: '700' }}>
                        <XCircle size={14} /><span>Delivery unavailable</span>
                      </div>
                      <button onClick={() => setIsEditingPin(true)} style={{ background: 'none', border: 'none', color: '#2F6B3A', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', padding: 0 }}>Change</button>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#634B3B', paddingLeft: '1.3rem' }}>We don't deliver to PIN code {deliveryInfo.pincode}.</div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* ── STICKY FOOTER SUMMARY ── */}
        {cartItems.length > 0 && (
          <div style={{
            borderTop: '1px solid rgba(120, 75, 40, 0.14)',
            padding: '1.35rem 1.5rem',
            backgroundColor: '#FBF6ED',
            boxShadow: '0 -10px 30px rgba(42, 23, 15, 0.08)',
            flexShrink: 0,
          }}>
            {/* Summary rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginBottom: '1.1rem', fontSize: '0.88rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#634B3B' }}>
                <span>Subtotal</span>
                <span style={{ fontWeight: '800', color: '#2A170F' }}>₹{subtotal}</span>
              </div>
              {appliedCoupon && couponDiscountAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#2F6B3A', fontWeight: '700' }}>
                  <span>Coupon ({appliedCoupon.code})</span>
                  <span>-₹{couponDiscountAmount}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#634B3B' }}>
                <span>Delivery</span>
                <span style={{ fontWeight: '700', color: isDeliverable ? (deliveryCharge === 0 ? '#2F6B3A' : '#2A170F') : '#806B59' }}>
                  {!isDeliverable ? '—' : deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge}`}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '900', fontSize: '1.25rem', color: '#2A170F', paddingTop: '0.65rem', marginTop: '0.15rem', borderTop: '1px solid rgba(120, 75, 40, 0.14)' }}>
                <span>Total</span>
                <span>₹{Math.max(0, subtotal - couponDiscountAmount + (isDeliverable ? deliveryCharge : 0))}</span>
              </div>
            </div>

            {/* Proceed to Checkout CTA */}
            <button
              onClick={() => {
                if (cartItems.length === 0) {
                  showToast('Your cart is empty.');
                  return;
                }
                setIsCartOpen(false);
                if (!user) {
                  navigate('/login', { state: { from: '/checkout' } });
                } else {
                  navigate('/checkout');
                }
              }}
              style={{
                width: '100%', padding: '1.05rem', fontSize: '0.9rem',
                backgroundColor: '#2F6B3A',
                color: '#FFFFFF', border: 'none',
                borderRadius: '999px', fontWeight: '800', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
                textTransform: 'uppercase', letterSpacing: '0.1em',
                boxShadow: '0 6px 20px rgba(47, 107, 58, 0.35)', transition: 'all 0.25s ease',
              }}
            >
              <span>Proceed to Checkout</span>
              <ArrowRight size={16} />
            </button>

            <div style={{ textAlign: 'center', marginTop: '0.8rem', fontSize: '0.78rem', color: '#634B3B', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
              <Lock size={13} color="#2F6B3A" />
              <span>Secure checkout</span>
            </div>

            <div style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.78rem', fontStyle: 'italic', fontFamily: 'var(--font-serif)', color: '#806B59' }}>
              Millets for a better tomorrow ♡
            </div>
          </div>
        )}
      </div>

      <CustomizeItemModal
        isOpen={Boolean(editingCustomizationItem)}
        onClose={() => setEditingCustomizationItem(null)}
        item={editingCustomizationItem}
        onSave={(targetId, newNote) => updateCartItemCustomization(targetId, newNote)}
        onRemove={(targetId) => removeCartItemCustomization(targetId)}
      />
    </div>
  );
}

