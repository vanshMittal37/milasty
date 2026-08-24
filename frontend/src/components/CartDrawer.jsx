import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Plus, Minus, Trash2, ShoppingBag, Truck, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function CartDrawer() {
  const navigate = useNavigate();
  const {
    cartItems,
    isCartOpen,
    setIsCartOpen,
    updateQuantity,
    removeFromCart,
    subtotal,
    deliveryFee,
    grandTotal,
  } = useCart();

  // Prevent scroll when drawer is open
  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isCartOpen]);

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

  if (!isCartOpen) return null;

  const amountNeededForFreeShip = Math.max(0, 499 - subtotal);
  const totalItemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(20, 10, 5, 0.65)', // Deep chocolate backdrop tint
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 200,
        display: 'flex',
        justifyContent: 'flex-end',
      }}
      onClick={() => setIsCartOpen(false)}
      className="animate-fade-in"
    >
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          height: '100%',
          backgroundColor: 'var(--bg-main)', // Dark chocolate background
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-8px 0 35px rgba(0, 0, 0, 0.5)',
          borderLeft: '1px solid rgba(245, 235, 221, 0.15)',
        }}
        onClick={(e) => e.stopPropagation()}
        className="animate-slide-right"
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid rgba(245, 235, 221, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg-main)',
          }}
        >
          <div>
            <h2 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-serif)', color: 'var(--text-light)', fontWeight: '800', margin: 0, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Your Cart
            </h2>
            <div style={{ fontSize: '0.78rem', color: 'var(--accent-gold)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.15rem' }}>
              {totalItemCount} {totalItemCount === 1 ? 'Item' : 'Items'}
            </div>
          </div>
          <button
            onClick={() => setIsCartOpen(false)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-light)',
              padding: '0.4rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'}
          >
            <X size={20} />
          </button>
        </div>

        {/* Free Shipping Progress Indicator */}
        <div style={{ backgroundColor: 'rgba(197, 160, 89, 0.05)', padding: '1rem 1.5rem', borderBottom: '1px solid rgba(245, 235, 221, 0.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Truck size={17} color="var(--accent-gold)" />
            <span style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-light)' }}>
              {amountNeededForFreeShip === 0
                ? "✓ You've unlocked FREE Pan-India Delivery"
                : `🚚 Add ₹${amountNeededForFreeShip} more for FREE Pan-India Delivery`}
            </span>
          </div>
          <div style={{ height: '6px', backgroundColor: 'rgba(255, 255, 255, 0.06)', borderRadius: '999px', overflow: 'hidden', position: 'relative' }}>
            <div
              style={{
                height: '100%',
                width: `${Math.min(100, (subtotal / 499) * 100)}%`,
                backgroundColor: 'var(--accent-gold)',
                transition: 'width 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            ></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '600', marginTop: '0.35rem' }}>
            <span>₹{subtotal}</span>
            <span>Threshold: ₹499</span>
          </div>
          {amountNeededForFreeShip > 0 && (
            <div
              style={{
                marginTop: '0.65rem',
                padding: '0.55rem 0.75rem',
                borderRadius: '8px',
                backgroundColor: 'rgba(36, 79, 33, 0.25)',
                border: '1px solid rgba(185, 205, 148, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.5rem'
              }}
            >
              <div style={{ fontSize: '0.74rem', color: '#FFFDF9', fontWeight: '600' }}>
                <span style={{ color: 'var(--accent-gold)', fontWeight: '800' }}>Trial Snack Box</span> — ₹99
              </div>
              <button
                onClick={() => {
                  addToCart({
                    _id: 'trial-pack-99',
                    title: 'Trial Snack Box (100g)',
                    slug: 'trial-snack-box',
                    image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500&auto=format&fit=crop&q=80',
                    variants: [{ weight: '100g', price: 99, originalPrice: 120 }]
                  }, { weight: '100g', price: 99 });
                }}
                style={{
                  padding: '0.25rem 0.65rem',
                  fontSize: '0.7rem',
                  backgroundColor: '#244f21',
                  color: '#FFFFFF',
                  border: '1px solid #b9cd94',
                  borderRadius: '999px',
                  fontWeight: '800',
                  cursor: 'pointer'
                }}
              >
                + Add (₹99)
              </button>
            </div>
          )}
        </div>

        {/* Cart Items List */}
        <div
          style={{
            flexGrow: 1,
            overflowY: 'auto',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          {cartItems.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '4rem 1rem',
                color: 'var(--text-muted)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1.25rem',
              }}
            >
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'rgba(255, 255, 255, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShoppingBag size={38} color="var(--accent-gold)" />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-serif)', color: 'var(--text-light)', fontWeight: '700', margin: 0 }}>Your Cart is Empty</h3>
              <p style={{ fontSize: '0.88rem', lineHeight: '1.5', maxWidth: '280px', margin: 0 }}>Your next wholesome snack is waiting. Begin your MILASTY ritual.</p>
              <button
                onClick={() => {
                  setIsCartOpen(false);
                  navigate('/shop');
                }}
                className="btn-primary"
                style={{
                  marginTop: '0.5rem',
                  padding: '0.8rem 1.75rem',
                  backgroundColor: 'var(--accent-gold)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  border: 'none',
                  borderRadius: '999px',
                  color: '#24130D',
                  cursor: 'pointer',
                  fontWeight: '700',
                  fontSize: '0.9rem'
                }}
              >
                <span>Explore Fresh Bakes</span>
                <ArrowRight size={16} />
              </button>
            </div>
          ) : (
            cartItems.map((item) => (
              <div
                key={item.key}
                style={{
                  display: 'flex',
                  gap: '1rem',
                  padding: '1rem',
                  borderRadius: '16px',
                  backgroundColor: 'rgba(50, 26, 18, 0.60)',
                  border: '1px solid rgba(245, 235, 221, 0.25)',
                  boxShadow: 'var(--shadow-sm)',
                  alignItems: 'center',
                }}
              >
                {/* Product Image */}
                <img
                  src={item.image}
                  alt={item.title}
                  style={{
                    width: '84px',
                    height: '84px',
                    objectFit: 'cover',
                    borderRadius: '12px',
                    border: '1px solid rgba(245, 235, 221, 0.15)'
                  }}
                />

                {/* Info & Quantity controls */}
                <div style={{ flexGrow: 1 }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-light)', margin: '0 0 0.15rem 0', lineHeight: '1.25' }}>{item.title}</h4>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                    {item.variantName} ({item.weight})
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {/* Quantity selectors */}
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        border: '1px solid rgba(245, 235, 221, 0.2)',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        overflow: 'hidden'
                      }}
                    >
                      <button
                        onClick={() => updateQuantity(item.key, -1)}
                        style={{ padding: '0.3rem 0.5rem', background: 'none', border: 'none', color: 'var(--text-light)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      >
                        <Minus size={11} />
                      </button>
                      <span style={{ padding: '0 0.4rem', fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-light)' }}>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.key, 1)}
                        style={{ padding: '0.3rem 0.5rem', background: 'none', border: 'none', color: 'var(--text-light)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      >
                        <Plus size={11} />
                      </button>
                    </div>

                    {/* Trash Button */}
                    <button
                      onClick={() => removeFromCart(item.key)}
                      style={{ background: 'none', border: 'none', color: 'var(--accent-terracotta)', padding: '0.3rem', cursor: 'pointer', display: 'flex', alignItems: 'center', borderRadius: '50%', backgroundColor: 'rgba(217, 83, 79, 0.05)' }}
                      title="Remove item"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Subtotal Item Price */}
                <div style={{ textAlign: 'right', fontWeight: '800', color: 'var(--text-light)', fontSize: '1.05rem', minWidth: '60px' }}>
                  ₹{item.totalPrice}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Sticky Footer */}
        {cartItems.length > 0 && (
          <div
            style={{
              borderTop: '1px solid rgba(245, 235, 221, 0.15)',
              padding: '1.5rem',
              backgroundColor: 'var(--bg-main)',
              boxShadow: '0 -8px 24px rgba(0, 0, 0, 0.3)'
            }}
          >
            {/* Calculation summary */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginBottom: '1.25rem', fontSize: '0.88rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span>Subtotal</span>
                <span style={{ fontWeight: '700', color: 'var(--text-light)' }}>₹{subtotal}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span>Pan-India Delivery</span>
                <span style={{ fontWeight: '700', color: deliveryFee === 0 ? 'var(--accent-gold)' : 'var(--text-light)' }}>
                  {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontWeight: '900',
                  fontSize: '1.2rem',
                  color: 'var(--text-light)',
                  paddingTop: '0.65rem',
                  marginTop: '0.25rem',
                  borderTop: '1px solid rgba(245, 235, 221, 0.15)',
                }}
              >
                <span>Total</span>
                <span>₹{grandTotal}</span>
              </div>
            </div>

            {/* Main Proceed CTA */}
            <button
              onClick={() => {
                setIsCartOpen(false);
                navigate('/checkout');
              }}
              style={{
                width: '100%',
                justifyContent: 'center',
                padding: '0.95rem',
                fontSize: '0.9rem',
                backgroundColor: 'var(--accent-gold)',
                color: '#24130D',
                border: 'none',
                borderRadius: '12px',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                boxShadow: 'var(--shadow-sm)',
                transition: 'transform 0.2s, background-color 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'none'}
            >
              <span>Proceed to Checkout</span>
              <ArrowRight size={16} />
            </button>
            <div style={{ textAlign: 'center', marginTop: '0.65rem', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '600', letterSpacing: '0.02em', display: 'flex', flexDirection: 'column', gap: '0.35rem', alignItems: 'center' }}>
              <span>🔒 100% Encrypted & Safe Checkout</span>
              <div style={{ display: 'flex', gap: '0.4rem', fontSize: '0.68rem', color: 'var(--accent-gold)', fontWeight: '700', letterSpacing: '0.05em' }}>
                <span>UPI</span> • <span>GPay</span> • <span>PhonePe</span> • <span>Cards</span> • <span>NetBanking</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
