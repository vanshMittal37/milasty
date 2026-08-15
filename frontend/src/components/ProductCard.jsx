import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Star, Heart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [btnText, setBtnText] = useState('Add to Cart');

  const selectedVariant = product.variants[selectedVariantIndex] || product.variants[0];
  const wishlisted = isInWishlist(product._id || product.slug);

  const handleAddToCart = async () => {
    setBtnText('Adding...');
    try {
      await addToCart(product, selectedVariant);
      setBtnText('✓ Added');
      setTimeout(() => setBtnText('Add to Cart'), 1500);
    } catch (e) {
      setBtnText('Unable to add');
      setTimeout(() => setBtnText('Add to Cart'), 2000);
    }
  };

  return (
    <div
      className="glass-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        backgroundColor: '#FFFFFF',
        borderRadius: '24px',
        border: '1.5px solid var(--border-color)',
        boxShadow: '0 8px 30px rgba(56, 20, 35, 0.01)',
        position: 'relative'
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 12px 35px rgba(56, 20, 35, 0.04)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = '0 8px 30px rgba(56, 20, 35, 0.01)';
      }}
    >
      {/* Image Area with Badge & Wishlist Button */}
      <div style={{ position: 'relative', overflow: 'hidden', paddingTop: '80%', backgroundColor: '#FCFAF6' }}>
        <Link to={`/product/${product.slug}`}>
          <img
            src={product.image}
            alt={product.title}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.03)')}
            onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          />
        </Link>

        {/* Wishlist Heart Icon overlay */}
        <button
          onClick={() => toggleWishlist(product)}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: '#FFFFFF',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)',
            color: wishlisted ? 'var(--accent-terracotta)' : 'var(--text-muted)',
            transition: 'all 0.2s',
            zIndex: 10
          }}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#FCFAF6')}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#FFFFFF')}
        >
          <Heart size={16} fill={wishlisted ? 'var(--accent-terracotta)' : 'none'} />
        </button>

        {/* Dynamic Badges */}
        {product.badges && product.badges.length > 0 && (
          <div
            style={{
              position: 'absolute',
              top: '16px',
              left: '16px',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '6px',
              zIndex: 10
            }}
          >
            {product.badges.slice(0, 2).map((badge, idx) => (
              <span 
                key={idx} 
                style={{
                  fontSize: '0.65rem',
                  fontWeight: '800',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'var(--primary-dark)',
                  backgroundColor: 'var(--accent-gold)',
                  padding: '0.3rem 0.65rem',
                  borderRadius: '999px',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                {badge}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Card Details */}
      <div
        style={{
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          flexGrow: 1,
          justifyContent: 'space-between',
        }}
      >
        <div>
          {/* Rating stars */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.6rem' }}>
            <div style={{ display: 'flex', color: 'var(--accent-gold)' }}>
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={12} fill="var(--accent-gold)" color="var(--accent-gold)" />
              ))}
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '700' }}>
              {product.rating} ({product.reviewCount || 12})
            </span>
          </div>

          {/* Title */}
          <h3
            style={{
              fontSize: '1.15rem',
              fontFamily: 'var(--font-serif)',
              fontWeight: '800',
              lineHeight: '1.3',
              marginBottom: '0.45rem',
              color: 'var(--primary-dark)',
            }}
          >
            <Link to={`/product/${product.slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>
              {product.title}
            </Link>
          </h3>

          {/* Subtitle / Description */}
          <p
            style={{
              fontSize: '0.85rem',
              color: 'var(--text-muted)',
              lineHeight: '1.5',
              marginBottom: '1.25rem',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              fontWeight: '500'
            }}
          >
            {product.subtitle || product.description}
          </p>

          {/* Pack Size Selector */}
          {product.variants && product.variants.length > 1 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <div
                style={{
                  fontSize: '0.7rem',
                  fontWeight: '800',
                  color: 'var(--primary-dark)',
                  marginBottom: '0.5rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                Select Pack Size
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {product.variants.map((variant, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedVariantIndex(idx)}
                    style={{
                      padding: '0.35rem 0.75rem',
                      fontSize: '0.76rem',
                      fontWeight: '800',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      backgroundColor: selectedVariantIndex === idx ? 'var(--primary-dark)' : '#FCFAF6',
                      color: selectedVariantIndex === idx ? '#FFFFFF' : 'var(--primary-dark)',
                      border: selectedVariantIndex === idx ? '1px solid var(--primary-dark)' : '1px solid var(--border-color)',
                    }}
                  >
                    {variant.weight}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Pricing & Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: '700' }}>Price</span>
            <div style={{ fontSize: '1.25rem', fontWeight: '900', color: 'var(--primary-dark)' }}>
              ₹{selectedVariant.price}
              {selectedVariant.originalPrice && (
                <span
                  style={{
                    fontSize: '0.8rem',
                    color: 'var(--text-muted)',
                    textDecoration: 'line-through',
                    marginLeft: '0.45rem',
                    fontWeight: '500',
                  }}
                >
                  ₹{selectedVariant.originalPrice}
                </span>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
            <Link
              to={`/product/${product.slug}`}
              className="btn-secondary"
              style={{
                padding: '0.75rem 0.5rem',
                fontSize: '0.78rem',
                borderRadius: '12px',
                fontWeight: '800',
                textAlign: 'center',
                borderColor: 'var(--border-color)',
                color: 'var(--primary-dark)',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#FCFAF6',
                transition: 'all 0.2s',
                minHeight: '40px'
              }}
            >
              View Details
            </Link>

            <button
              onClick={handleAddToCart}
              className="btn-primary"
              style={{
                padding: '0.75rem 0.5rem',
                fontSize: '0.78rem',
                borderRadius: '12px',
                backgroundColor: 'var(--primary-dark)',
                color: 'var(--bg-main)',
                border: 'none',
                fontWeight: '800',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.25rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                minHeight: '40px'
              }}
            >
              <ShoppingBag size={13} />
              <span>{btnText}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
