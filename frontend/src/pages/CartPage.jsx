import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Trash2, Plus, Minus, Tag, ArrowRight, Truck, ShieldCheck } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function CartPage() {
  const navigate = useNavigate();
  const {
    cartItems,
    updateQuantity,
    removeFromCart,
    clearCart,
    subtotal,
    deliveryFee,
    grandTotal,
    appliedCoupon,
    couponDiscountAmount,
    applyCoupon,
    removeCoupon,
  } = useCart();

  const [couponInput, setCouponInput] = useState('');
  const [couponStatus, setCouponStatus] = useState(null);

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    const res = await applyCoupon(couponInput.trim());
    setCouponStatus(res);
  };

  const amountNeededForFreeShip = Math.max(0, 499 - subtotal);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundImage: 'url(/images/cart_background_image.jpeg)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      padding: '3rem 0 5rem',
    }}>
      <div className="container" style={{ maxWidth: '1100px' }}>

        {/* Page Banner */}
        <div style={{
          padding: '2.75rem 2rem',
          textAlign: 'center',
          backgroundColor: 'rgba(255, 250, 242, 0.78)',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
          marginBottom: '2.5rem',
          borderRadius: '24px',
          border: '1px solid rgba(100, 65, 35, 0.15)',
          boxShadow: '0 8px 32px rgba(80, 45, 15, 0.12)',
        }}>
          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.14em', color: '#244f21', fontWeight: '800', display: 'block', marginBottom: '0.4rem' }}>
            Your Ritual Basket
          </span>
          <h1 style={{ fontSize: '2.4rem', fontFamily: 'var(--font-serif)', color: '#24130D', marginBottom: '0.5rem', fontWeight: '800', margin: '0 0 0.5rem' }}>
            Shopping Cart
          </h1>
          <p style={{ color: '#5C3D20', fontSize: '0.95rem', margin: 0, fontWeight: '500' }}>
            Review your handcrafted millet bakery items, apply discount coupons, and proceed to checkout.
          </p>
        </div>

        {cartItems.length === 0 ? (
          /* Empty State */
          <div style={{
            padding: '4.5rem 2rem',
            textAlign: 'center',
            backgroundColor: 'rgba(255, 250, 242, 0.80)',
            backdropFilter: 'blur(18px)',
            WebkitBackdropFilter: 'blur(18px)',
            borderRadius: '24px',
            border: '1px solid rgba(100, 65, 35, 0.15)',
            boxShadow: '0 8px 32px rgba(80, 45, 15, 0.10)',
          }}>
            <div style={{ width: '72px', height: '72px', borderRadius: '50%', backgroundColor: 'rgba(36, 79, 33, 0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <ShoppingBag size={30} color="#244f21" />
            </div>
            <h3 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-serif)', color: '#24130D', marginBottom: '0.5rem', fontWeight: '800' }}>
              Your cart is currently empty
            </h3>
            <p style={{ fontSize: '0.96rem', color: '#5C3D20', marginBottom: '2rem', lineHeight: '1.6' }}>
              Discover our healthy millet cookies baked in pure Desi Ghee &amp; Jaggery.
            </p>
            <Link to="/shop" style={{ backgroundColor: '#244f21', color: '#FFFFFF', padding: '0.9rem 2.25rem', borderRadius: '999px', fontWeight: '800', textDecoration: 'none', display: 'inline-block', fontSize: '0.95rem' }}>
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="checkout-form" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2.5rem', alignItems: 'flex-start' }}>

            {/* ── Left: Items List ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              {/* Free Shipping Progress Banner */}
              <div style={{
                backgroundColor: 'rgba(36, 79, 33, 0.09)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                padding: '0.9rem 1.25rem',
                borderRadius: '14px',
                border: '1px solid rgba(36, 79, 33, 0.20)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '700', marginBottom: '0.4rem', color: '#1a3d18', fontSize: '0.88rem' }}>
                  <Truck size={18} color="#244f21" />
                  <span>
                    {amountNeededForFreeShip === 0
                      ? '🎉 Complimentary Free Pan-India Shipping Unlocked!'
                      : `Add ₹${amountNeededForFreeShip} more to qualify for FREE Shipping!`}
                  </span>
                </div>
                <div style={{ height: '6px', backgroundColor: 'rgba(36,79,33,0.15)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min(100, (subtotal / 499) * 100)}%`, backgroundColor: '#244f21', borderRadius: '3px', transition: 'width 0.4s ease' }}></div>
                </div>
              </div>

              {/* Item Cards */}
              {cartItems.map((item) => (
                <div
                  key={item.key}
                  style={{
                    padding: '1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1.25rem',
                    backgroundColor: 'rgba(255, 250, 242, 0.80)',
                    backdropFilter: 'blur(14px)',
                    WebkitBackdropFilter: 'blur(14px)',
                    borderRadius: '18px',
                    border: '1px solid rgba(100, 65, 35, 0.14)',
                    boxShadow: '0 4px 16px rgba(80, 45, 15, 0.08)',
                  }}
                >
                  <img src={item.image} alt={item.title} style={{ width: '84px', height: '84px', objectFit: 'cover', borderRadius: '12px', flexShrink: 0 }} />

                  <div style={{ flexGrow: 1 }}>
                    <h4 style={{ fontSize: '1.05rem', fontFamily: 'var(--font-serif)', color: '#24130D', marginBottom: '0.2rem', fontWeight: '700' }}>
                      <Link to={`/shop/product/${item.slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>{item.title}</Link>
                    </h4>
                    <div style={{ fontSize: '0.82rem', color: '#7A5535', marginBottom: '0.55rem', fontWeight: '500' }}>
                      Pack: <strong style={{ color: '#4A2C10' }}>{item.variantName} ({item.weight})</strong>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', border: '1.5px solid rgba(100, 65, 35, 0.25)', borderRadius: '10px', backgroundColor: 'rgba(245, 235, 220, 0.55)' }}>
                        <button onClick={() => updateQuantity(item.key, -1)} style={{ padding: '0.3rem 0.55rem', background: 'none', color: '#4A2C10', fontWeight: '700', cursor: 'pointer', border: 'none' }}>
                          <Minus size={13} />
                        </button>
                        <span style={{ padding: '0 0.6rem', fontSize: '0.9rem', fontWeight: '800', color: '#24130D' }}>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.key, 1)} style={{ padding: '0.3rem 0.55rem', background: 'none', color: '#4A2C10', fontWeight: '700', cursor: 'pointer', border: 'none' }}>
                          <Plus size={13} />
                        </button>
                      </div>

                      <button onClick={() => removeFromCart(item.key)} style={{ background: 'none', color: '#b85c3a', padding: '0.3rem', cursor: 'pointer', border: 'none' }} title="Remove item">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', fontWeight: '900', fontSize: '1.2rem', color: '#24130D', flexShrink: 0 }}>
                    ₹{item.totalPrice}
                  </div>
                </div>
              ))}

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}>
                <button onClick={clearCart} style={{ background: 'none', color: '#b85c3a', fontSize: '0.88rem', fontWeight: '700', cursor: 'pointer', border: 'none' }}>
                  Clear Cart
                </button>
                <Link to="/shop" style={{ color: '#244f21', fontWeight: '700', fontSize: '0.88rem', textDecoration: 'none' }}>
                  ← Continue Shopping
                </Link>
              </div>
            </div>

            {/* ── Right: Order Summary ── */}
            <div style={{
              padding: '2rem',
              backgroundColor: 'rgba(255, 250, 242, 0.84)',
              backdropFilter: 'blur(18px)',
              WebkitBackdropFilter: 'blur(18px)',
              borderRadius: '22px',
              border: '1px solid rgba(100, 65, 35, 0.15)',
              boxShadow: '0 8px 32px rgba(80, 45, 15, 0.10)',
            }}>
              <h3 style={{ fontSize: '1.3rem', fontFamily: 'var(--font-serif)', color: '#24130D', marginBottom: '1.25rem', fontWeight: '800' }}>
                Order Summary
              </h3>

              {/* Coupon */}
              <form onSubmit={handleApplyCoupon} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <div style={{ position: 'relative', flexGrow: 1 }}>
                  <Tag size={16} color="#7A5535" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    placeholder="Coupon Code (e.g. WELCOME10)"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.75rem 0.65rem 2.25rem',
                      borderRadius: '10px',
                      border: '1.5px solid rgba(100, 65, 35, 0.22)',
                      fontSize: '0.85rem',
                      fontFamily: 'inherit',
                      textTransform: 'uppercase',
                      backgroundColor: 'rgba(245, 235, 220, 0.55)',
                      color: '#24130D',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <button type="submit" style={{ padding: '0.65rem 1.1rem', fontSize: '0.85rem', backgroundColor: '#244f21', color: '#FFFFFF', border: 'none', borderRadius: '10px', fontWeight: '800', cursor: 'pointer', flexShrink: 0 }}>
                  Apply
                </button>
              </form>

              {appliedCoupon && (
                <div style={{ backgroundColor: 'rgba(36, 79, 33, 0.10)', padding: '0.65rem 0.9rem', borderRadius: '10px', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', color: '#1a3d18', fontWeight: '700', border: '1px solid rgba(36,79,33,0.18)' }}>
                  <span>Code '{appliedCoupon.code}' Applied!</span>
                  <button onClick={removeCoupon} style={{ background: 'none', color: '#b85c3a', fontWeight: '700', border: 'none', cursor: 'pointer' }}>Remove</button>
                </div>
              )}

              {/* Price Rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.93rem', color: '#5C3D20', borderBottom: '1.5px solid rgba(100, 65, 35, 0.15)', paddingBottom: '1rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Subtotal</span>
                  <span style={{ fontWeight: '700', color: '#24130D' }}>₹{subtotal}</span>
                </div>
                {couponDiscountAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#244f21', fontWeight: '700' }}>
                    <span>Coupon Discount</span>
                    <span>-₹{couponDiscountAmount}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Estimated Shipping</span>
                  <span style={{ fontWeight: '700', color: deliveryFee === 0 ? '#244f21' : '#24130D' }}>{deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '900', fontSize: '1.35rem', color: '#24130D', marginBottom: '1.5rem' }}>
                <span>Grand Total</span>
                <span>₹{grandTotal}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'rgba(36, 79, 33, 0.07)', padding: '0.65rem 0.9rem', borderRadius: '10px', marginBottom: '1.25rem', fontSize: '0.82rem', color: '#1a3d18', fontWeight: '600' }}>
                <ShieldCheck size={16} color="#244f21" />
                <span>100% Secure Checkout • SSL Encrypted</span>
              </div>

              <button
                onClick={() => navigate('/checkout')}
                style={{ width: '100%', justifyContent: 'center', padding: '0.95rem', fontSize: '1.05rem', backgroundColor: '#244f21', color: '#FFFFFF', border: 'none', borderRadius: '14px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s ease' }}
              >
                <span>Proceed to Checkout</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
