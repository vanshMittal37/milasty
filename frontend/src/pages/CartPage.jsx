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
    <div style={{ padding: '3rem 0 5rem' }}>
      <div className="container">
        {/* Banner */}
        <div
          className="glass-card"
          style={{
            padding: '2.5rem 2rem',
            textAlign: 'center',
            backgroundColor: '#F5EFE6',
            marginBottom: '3rem',
            border: '1px solid #E2D7C7',
          }}
        >
          <h1 style={{ fontSize: '2.2rem', color: '#4A3525', marginBottom: '0.5rem' }}>Your Shopping Cart</h1>
          <p style={{ color: '#6B5B52', fontSize: '0.95rem' }}>Review your selected millet bakery items, apply discount coupons, and proceed to checkout.</p>
        </div>

        {cartItems.length === 0 ? (
          <div className="glass-card" style={{ padding: '4rem 2rem', textAlign: 'center', color: '#6B5B52' }}>
            <ShoppingBag size={56} color="#D9CBB7" style={{ margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.4rem', color: '#5C4028', marginBottom: '0.5rem' }}>Your cart is currently empty</h3>
            <p style={{ fontSize: '0.95rem', marginBottom: '1.5rem' }}>Discover our healthy millet cookies baked in pure Desi Ghee & Jaggery.</p>
            <Link to="/shop" className="btn-primary">
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="checkout-form" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2.5rem', alignItems: 'flex-start' }}>
            {/* Left: Items List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Free Ship Banner */}
              <div style={{ backgroundColor: '#E8DEC8', padding: '0.85rem 1.25rem', borderRadius: '12px', color: '#4A3525', fontSize: '0.88rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '700', marginBottom: '0.35rem' }}>
                  <Truck size={18} color="#274C37" />
                  <span>
                    {amountNeededForFreeShip === 0
                      ? '🎉 Complimentary Free Pan-India Shipping Unlocked!'
                      : `Add ₹${amountNeededForFreeShip} more to qualify for FREE Shipping!`}
                  </span>
                </div>
                <div style={{ height: '6px', backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min(100, (subtotal / 499) * 100)}%`, backgroundColor: '#274C37' }}></div>
                </div>
              </div>

              {/* Items Cards */}
              {cartItems.map((item) => (
                <div
                  key={item.key}
                  className="glass-card"
                  style={{
                    padding: '1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1.25rem',
                    backgroundColor: '#FFFFFF',
                  }}
                >
                  <img src={item.image} alt={item.title} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '10px' }} />

                  <div style={{ flexGrow: 1 }}>
                    <h4 style={{ fontSize: '1.05rem', color: '#4A3525', marginBottom: '0.2rem' }}>
                      <Link to={`/shop/product/${item.slug}`} style={{ color: 'inherit' }}>{item.title}</Link>
                    </h4>
                    <div style={{ fontSize: '0.82rem', color: '#6B5B52', marginBottom: '0.5rem' }}>
                      Pack: <strong>{item.variantName} ({item.weight})</strong>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', border: '1px solid #E2D7C7', borderRadius: '8px', backgroundColor: '#F5EFE6' }}>
                        <button onClick={() => updateQuantity(item.key, -1)} style={{ padding: '0.25rem 0.5rem', background: 'none', color: '#4A3525', fontWeight: '700' }}>
                          <Minus size={13} />
                        </button>
                        <span style={{ padding: '0 0.6rem', fontSize: '0.88rem', fontWeight: '800' }}>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.key, 1)} style={{ padding: '0.25rem 0.5rem', background: 'none', color: '#4A3525', fontWeight: '700' }}>
                          <Plus size={13} />
                        </button>
                      </div>

                      <button onClick={() => removeFromCart(item.key)} style={{ background: 'none', color: '#99887A', padding: '0.25rem' }} title="Remove item">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', fontWeight: '800', fontSize: '1.15rem', color: '#4A3525' }}>
                    ₹{item.totalPrice}
                  </div>
                </div>
              ))}

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                <button onClick={clearCart} style={{ background: 'none', color: '#D9534F', fontSize: '0.88rem', fontWeight: '600' }}>
                  Clear Cart
                </button>
                <Link to="/shop" style={{ color: '#5C4028', fontWeight: '600', fontSize: '0.88rem' }}>
                  ← Continue Shopping
                </Link>
              </div>
            </div>

            {/* Right: Coupon & Summary Box */}
            <div className="glass-card" style={{ padding: '2rem', backgroundColor: '#F5EFE6' }}>
              <h3 style={{ fontSize: '1.25rem', color: '#4A3525', marginBottom: '1.25rem' }}>Order Summary</h3>

              {/* Coupon Input */}
              <form onSubmit={handleApplyCoupon} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <div style={{ position: 'relative', flexGrow: 1 }}>
                  <Tag size={16} color="#6B5B52" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    placeholder="Coupon Code (e.g. WELCOME10)"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.75rem 0.65rem 2.2rem',
                      borderRadius: '8px',
                      border: '1px solid #E2D7C7',
                      fontSize: '0.85rem',
                      fontFamily: 'inherit',
                      textTransform: 'uppercase',
                    }}
                  />
                </div>
                <button type="submit" className="btn-secondary" style={{ padding: '0.65rem 1rem', fontSize: '0.85rem' }}>
                  Apply
                </button>
              </form>

              {appliedCoupon && (
                <div style={{ backgroundColor: 'rgba(39, 76, 55, 0.12)', padding: '0.65rem 0.85rem', borderRadius: '8px', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', color: '#274C37', fontWeight: '700' }}>
                  <span>Code '{appliedCoupon.code}' Applied!</span>
                  <button onClick={removeCoupon} style={{ background: 'none', color: '#D9534F', fontWeight: '700' }}>Remove</button>
                </div>
              )}

              {/* Price Calculation Table */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.92rem', color: '#6B5B52', borderBottom: '1px solid #E2D7C7', paddingBottom: '1rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Subtotal</span>
                  <span>₹{subtotal}</span>
                </div>
                {couponDiscountAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#274C37', fontWeight: '600' }}>
                    <span>Coupon Discount</span>
                    <span>-₹{couponDiscountAmount}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Estimated Shipping</span>
                  <span>{deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '900', fontSize: '1.3rem', color: '#4A3525', marginBottom: '1.75rem' }}>
                <span>Grand Total</span>
                <span>₹{grandTotal}</span>
              </div>

              <button
                onClick={() => navigate('/checkout')}
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '0.9rem', fontSize: '1.05rem' }}
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
