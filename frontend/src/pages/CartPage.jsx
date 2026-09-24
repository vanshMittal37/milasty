import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Trash2, Plus, Minus, Tag, ArrowRight, Truck, ShieldCheck, MapPin, CheckCircle2, Calendar } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useDelivery } from '../context/DeliveryContext';
import CustomizeItemModal from '../components/CustomizeItemModal';

export default function CartPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    cartItems,
    updateQuantity,
    removeFromCart,
    updateCartItemCustomization,
    removeCartItemCustomization,
    clearCart,
    subtotal,
    deliveryFee: defaultDeliveryFee,
    grandTotal: defaultGrandTotal,
    appliedCoupon,
    couponDiscountAmount,
    applyCoupon,
    removeCoupon,
  } = useCart();
  const { deliveryInfo } = useDelivery();

  const [couponInput, setCouponInput] = useState('');
  const [couponStatus, setCouponStatus] = useState(null);
  const [editingCustomizationItem, setEditingCustomizationItem] = useState(null);

  const isDeliverable = deliveryInfo && (deliveryInfo.available ?? deliveryInfo.isDeliverable);
  const effectiveDeliveryFee = isDeliverable ? Number(deliveryInfo.deliveryCharge || 0) : 0;

  const effectiveGrandTotal = Math.max(0, subtotal - couponDiscountAmount + effectiveDeliveryFee);

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    const res = await applyCoupon(couponInput.trim());
    setCouponStatus(res);
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#F5EBDD',
      backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.6) 0%, rgba(245,235,221,0) 70%)',
      padding: '3rem 0 5rem',
      color: '#2B140B'
    }}>
      <div className="container" style={{ maxWidth: '1100px' }}>

        {/* Page Banner */}
        <div style={{
          padding: '2.75rem 2rem',
          textAlign: 'center',
          backgroundColor: '#FBF6ED',
          marginBottom: '2.5rem',
          borderRadius: '24px',
          border: '1px solid #E4D1B7',
          boxShadow: '0 4px 20px rgba(43, 20, 11, 0.05)',
        }}>
          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.14em', color: '#2F6B3A', fontWeight: '800', display: 'block', marginBottom: '0.4rem' }}>
            Your Ritual Basket
          </span>
          <h1 style={{ fontSize: '2.4rem', fontFamily: 'var(--font-serif)', color: '#2B140B', marginBottom: '0.5rem', fontWeight: '800', margin: '0 0 0.5rem' }}>
            Shopping Cart
          </h1>
          <p style={{ color: '#6B584C', fontSize: '0.95rem', margin: 0, fontWeight: '500' }}>
            Review your handcrafted millet bakery items, apply discount coupons, and proceed to checkout.
          </p>
        </div>

        {cartItems.length === 0 ? (
          /* Empty State */
          <div style={{
            padding: '4.5rem 2rem',
            textAlign: 'center',
            backgroundColor: '#FBF6ED',
            borderRadius: '24px',
            border: '1px solid #E4D1B7',
            boxShadow: '0 4px 20px rgba(43, 20, 11, 0.05)',
          }}>
            <div style={{ width: '72px', height: '72px', borderRadius: '50%', backgroundColor: '#EAEFE5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <ShoppingBag size={30} color="#2F6B3A" />
            </div>
            <h3 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-serif)', color: '#2B140B', marginBottom: '0.5rem', fontWeight: '800' }}>
              Your cart is currently empty
            </h3>
            <p style={{ fontSize: '0.96rem', color: '#6B584C', marginBottom: '2rem', lineHeight: '1.6' }}>
              Discover our healthy millet cookies baked in pure Desi Ghee &amp; Jaggery.
            </p>
            <Link to="/shop" style={{ backgroundColor: '#2F6B3A', color: '#FFFFFF', padding: '0.9rem 2.25rem', borderRadius: '999px', fontWeight: '800', textDecoration: 'none', display: 'inline-block', fontSize: '0.95rem' }}>
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="checkout-form" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2.5rem', alignItems: 'flex-start' }}>

            {/* ── Left: Items List ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              {/* Item Cards */}
              {cartItems.map((item) => (
                <div
                  key={item.key || item.cartItemId || item.id}
                  style={{
                    padding: '1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1.25rem',
                    backgroundColor: '#FBF6ED',
                    borderRadius: '18px',
                    border: '1px solid #E4D1B7',
                    boxShadow: '0 4px 16px rgba(43, 20, 11, 0.04)',
                  }}
                >
                  <img src={item.image} alt={item.title} style={{ width: '84px', height: '84px', objectFit: 'cover', borderRadius: '12px', flexShrink: 0, border: '1px solid #E4D1B7' }} />

                  <div style={{ flexGrow: 1 }}>
                    <h4 style={{ fontSize: '1.05rem', fontFamily: 'var(--font-serif)', color: '#2B140B', marginBottom: '0.2rem', fontWeight: '700' }}>
                      <Link to={`/shop/product/${item.slug || item.productId}`} style={{ color: 'inherit', textDecoration: 'none' }}>{item.title}</Link>
                    </h4>
                    {(item.is_preorder || item.isPreorder) && (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', backgroundColor: '#EAEFE5', color: '#2F6B3A', border: '1px solid #2F6B3A', padding: '0.2rem 0.5rem', borderRadius: '6px', fontWeight: '700', marginBottom: '0.4rem' }}>
                        <Calendar size={12} color="#2F6B3A" />
                        <span>Pre-order {item.expected_ship_date || item.expectedShipDate || item.launchDate ? `• Ships from: ${item.expected_ship_date || item.expectedShipDate || item.launchDate}` : ''}</span>
                      </div>
                    )}
                    <div style={{ fontSize: '0.82rem', color: '#6B584C', marginBottom: '0.55rem', fontWeight: '500' }}>
                      Pack: <strong style={{ color: '#2B140B' }}>{item.variantName} {item.weight ? `(${item.weight})` : ''}</strong>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', border: '1.5px solid #E4D1B7', borderRadius: '10px', backgroundColor: '#FFFFFF' }}>
                        <button onClick={() => updateQuantity(item.key, -1)} style={{ padding: '0.3rem 0.55rem', background: 'none', color: '#2B140B', fontWeight: '700', cursor: 'pointer', border: 'none' }}>
                          <Minus size={13} />
                        </button>
                        <span style={{ padding: '0 0.6rem', fontSize: '0.9rem', fontWeight: '800', color: '#2B140B' }}>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.key, 1)} style={{ padding: '0.3rem 0.55rem', background: 'none', color: '#2B140B', fontWeight: '700', cursor: 'pointer', border: 'none' }}>
                          <Plus size={13} />
                        </button>
                      </div>

                      <button onClick={() => removeFromCart(item.key)} style={{ background: 'none', color: '#C0392B', padding: '0.3rem', cursor: 'pointer', border: 'none' }} title="Remove item">
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {/* Per-Item Customization Display & Actions */}
                    {item.customization_note ? (
                      <div style={{
                        marginTop: '0.75rem',
                        padding: '0.65rem 0.85rem',
                        backgroundColor: '#FBF6EE',
                        border: '1px solid rgba(47, 125, 50, 0.25)',
                        borderRadius: '10px',
                        fontSize: '0.8rem',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                          <span style={{ fontWeight: '800', color: '#2F7D32', fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            ✦ Special Instruction
                          </span>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              type="button"
                              onClick={() => setEditingCustomizationItem(item)}
                              style={{ background: 'none', border: 'none', color: '#2F7D32', fontWeight: '800', cursor: 'pointer', padding: 0, fontSize: '0.75rem', textDecoration: 'underline' }}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => removeCartItemCustomization(item.cartItemId || item.key)}
                              style={{ background: 'none', border: 'none', color: '#DC2626', fontWeight: '700', cursor: 'pointer', padding: 0, fontSize: '0.75rem' }}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                        <p style={{ margin: 0, color: '#3A1F14', fontStyle: 'italic', wordBreak: 'break-word', lineHeight: '1.4' }}>
                          "{item.customization_note}"
                        </p>
                      </div>
                    ) : (
                      <div style={{ marginTop: '0.5rem' }}>
                        <button
                          type="button"
                          onClick={() => setEditingCustomizationItem(item)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#2F7D32',
                            fontWeight: '700',
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            padding: 0,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                          }}
                        >
                          <span>+ Add Special Instruction</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <div style={{ textAlign: 'right', fontWeight: '900', fontSize: '1.2rem', color: '#2B140B', flexShrink: 0 }}>
                    ₹{item.totalPrice}
                  </div>
                </div>
              ))}

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}>
                <button onClick={clearCart} style={{ background: 'none', color: '#C0392B', fontSize: '0.88rem', fontWeight: '700', cursor: 'pointer', border: 'none' }}>
                  Clear Cart
                </button>
                <Link to="/shop" style={{ color: '#2F6B3A', fontWeight: '700', fontSize: '0.88rem', textDecoration: 'none' }}>
                  ← Continue Shopping
                </Link>
              </div>
            </div>

            {/* ── Right: Order Summary ── */}
            <div style={{
              padding: '2rem',
              backgroundColor: '#FBF6ED',
              borderRadius: '22px',
              border: '1px solid #E4D1B7',
              boxShadow: '0 4px 20px rgba(43, 20, 11, 0.05)',
            }}>
              <h3 style={{ fontSize: '1.3rem', fontFamily: 'var(--font-serif)', color: '#2B140B', marginBottom: '1.25rem', fontWeight: '800' }}>
                Order Summary
              </h3>

              {/* Coupon */}
              <form onSubmit={handleApplyCoupon} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <div style={{ position: 'relative', flexGrow: 1 }}>
                  <Tag size={16} color="#6B584C" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    placeholder="Coupon Code (e.g. WELCOME10)"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.75rem 0.65rem 2.25rem',
                      borderRadius: '10px',
                      border: '1.5px solid #E4D1B7',
                      fontSize: '0.85rem',
                      fontFamily: 'inherit',
                      textTransform: 'uppercase',
                      backgroundColor: '#FFFFFF',
                      color: '#2B140B',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <button type="submit" style={{ padding: '0.65rem 1.1rem', fontSize: '0.85rem', backgroundColor: '#2F6B3A', color: '#FFFFFF', border: 'none', borderRadius: '10px', fontWeight: '800', cursor: 'pointer', flexShrink: 0 }}>
                  Apply
                </button>
              </form>

              {appliedCoupon && (
                <div style={{ backgroundColor: '#EAEFE5', padding: '0.65rem 0.9rem', borderRadius: '10px', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', color: '#2F6B3A', fontWeight: '700', border: '1px solid #2F6B3A' }}>
                  <span>Code '{appliedCoupon.code}' Applied!</span>
                  <button onClick={removeCoupon} style={{ background: 'none', color: '#C0392B', fontWeight: '700', border: 'none', cursor: 'pointer' }}>Remove</button>
                </div>
              )}

              {/* Delivery Location Indicator */}
              {deliveryInfo && isDeliverable && (
                <div style={{ backgroundColor: '#EAEFE5', border: '1px solid #2F6B3A', borderRadius: '10px', padding: '0.65rem 0.85rem', marginBottom: '1rem', fontSize: '0.8rem', color: '#2F6B3A' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: '800', color: '#2F6B3A' }}>
                    <MapPin size={14} /> Delivering to PIN {deliveryInfo.pincode}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#6B584C', marginTop: '0.15rem' }}>
                    {deliveryInfo.city}, {deliveryInfo.state} ({deliveryInfo.deliveryCharge === 0 ? 'FREE Delivery' : `₹${deliveryInfo.deliveryCharge} Shipping`})
                  </div>
                </div>
              )}

              {/* Price Rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.93rem', color: '#6B584C', borderBottom: '1.5px solid #E4D1B7', paddingBottom: '1rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Subtotal</span>
                  <span style={{ fontWeight: '700', color: '#2B140B' }}>₹{subtotal}</span>
                </div>
                {couponDiscountAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#2F6B3A', fontWeight: '700' }}>
                    <span>Coupon Discount</span>
                    <span>-₹{couponDiscountAmount}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Shipping Fee</span>
                  <span style={{ fontWeight: '700', color: effectiveDeliveryFee === 0 ? '#2F6B3A' : '#2B140B' }}>
                    {effectiveDeliveryFee === 0 ? 'FREE' : `₹${effectiveDeliveryFee}`}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '900', fontSize: '1.35rem', color: '#2B140B', marginBottom: '1.5rem' }}>
                <span>Grand Total</span>
                <span>₹{effectiveGrandTotal}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#EAEFE5', padding: '0.65rem 0.9rem', borderRadius: '10px', marginBottom: '1.25rem', fontSize: '0.82rem', color: '#2F6B3A', fontWeight: '600' }}>
                <ShieldCheck size={16} color="#2F6B3A" />
                <span>100% Secure Checkout • SSL Encrypted</span>
              </div>

              <button
                onClick={() => {
                  if (cartItems.length === 0) return;
                  if (!user) {
                    navigate('/login', { state: { from: '/checkout' } });
                  } else {
                    navigate('/checkout');
                  }
                }}
                style={{ width: '100%', justifyContent: 'center', padding: '0.95rem', fontSize: '1.05rem', backgroundColor: '#2F6B3A', color: '#FFFFFF', border: 'none', borderRadius: '999px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s ease', boxShadow: '0 4px 16px rgba(47, 107, 58, 0.25)' }}
              >
                <span>Proceed to Checkout</span>
                <ArrowRight size={18} />
              </button>
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
