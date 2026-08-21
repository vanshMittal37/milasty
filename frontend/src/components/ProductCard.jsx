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

  return (    <div
      className="glass-card home-product-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        position: 'relative'
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 12px 32px rgba(0, 0, 0, 0.4)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
      }}
    >
      {/* Image Area with Badge & Wishlist Button */}
      <div style={{ position: 'relative', overflow: 'hidden', paddingTop: '75%', backgroundColor: 'transparent' }} className="card-image-wrap">
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
            onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.04)')}
            onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          />
        </Link>

        {/* Wishlist Heart Icon overlay */}
        <button
          onClick={() => toggleWishlist(product)}
          aria-label="Toggle Wishlist"
          className="card-wishlist-btn"
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            backgroundColor: 'rgba(20, 10, 5, 0.65)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            color: wishlisted ? '#b9cd94' : '#FFFDF9',
            transition: 'all 0.2s',
            zIndex: 10
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(36, 79, 33, 0.85)';
            e.currentTarget.style.transform = 'scale(1.08)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(20, 10, 5, 0.65)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <Heart size={15} fill={wishlisted ? '#b9cd94' : 'none'} color={wishlisted ? '#b9cd94' : '#FFFDF9'} />
        </button>

        {/* Dynamic Badges (Informational Labels, non-clickable) */}
        {product.badges && product.badges.length > 0 && (
          <div
            className="card-badge-wrap"
            style={{
              position: 'absolute',
              top: '8px',
              left: '8px',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '4px',
              zIndex: 10,
              pointerEvents: 'none'
            }}
          >
            {product.badges.slice(0, 1).map((badge, idx) => (
              <span 
                key={idx} 
                className="card-badge-span"
                style={{
                  fontSize: '0.58rem',
                  fontWeight: '850',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  color: '#b9cd94',
                  backgroundColor: 'rgba(36, 79, 33, 0.88)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  border: '1px solid rgba(185, 205, 148, 0.4)',
                  padding: '0.2rem 0.45rem',
                  borderRadius: '999px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
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
        className="card-body"
        style={{
          padding: '0.85rem 0.75rem',
          display: 'flex',
          flexDirection: 'column',
          flexGrow: 1,
          justifyContent: 'space-between',
        }}
      >
        <div>
          {/* Rating stars */}
          <div className="card-rating-row" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.35rem' }}>
            <div style={{ display: 'flex', color: '#b9cd94' }}>
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={11} fill="#b9cd94" color="#b9cd94" />
              ))}
            </div>
            <span style={{ fontSize: '0.72rem', color: '#F5EBDD', fontWeight: '750' }}>
              {product.rating} ({product.reviewCount || 12})
            </span>
          </div>

          {/* Title */}
          <h3
            className="card-title"
            style={{
              fontSize: '0.95rem',
              fontFamily: 'var(--font-serif)',
              fontWeight: '850',
              lineHeight: '1.25',
              marginBottom: '0.25rem',
              color: '#FFFDF9',
            }}
          >
            <Link to={`/product/${product.slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>
              {product.title}
            </Link>
          </h3>

          {/* Subtitle / Description */}
          <p
            className="card-subtitle"
            style={{
              fontSize: '0.78rem',
              color: '#F5EBDD',
              lineHeight: '1.35',
              marginBottom: '0.75rem',
              fontWeight: '500',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
          >
            {product.subtitle || product.description}
          </p>
        </div>

        {/* Pricing & Actions Bottom Divider */}
        <div className="card-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.55rem', borderTop: '1px solid rgba(255, 255, 255, 0.15)', gap: '0.35rem', flexWrap: 'wrap' }}>
          <div className="card-price" style={{ fontSize: '0.98rem', fontWeight: '900', color: '#b9cd94', display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: '0.25rem', minWidth: 0 }}>
            <span>₹{selectedVariant.price}</span>
            {selectedVariant.originalPrice && (
              <span
                className="original-price"
                style={{
                  fontSize: '0.7rem',
                  color: 'rgba(245, 235, 221, 0.65)',
                  textDecoration: 'line-through',
                  fontWeight: '500',
                }}
              >
                ₹{selectedVariant.originalPrice}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
            <Link
              to={`/product/${product.slug}`}
              className="btn-secondary view-details-btn"
              style={{
                padding: '0.35rem 0.5rem',
                fontSize: '0.7rem',
                borderRadius: '999px',
                fontWeight: '850',
                textAlign: 'center',
                borderColor: '#b9cd94',
                color: '#b9cd94',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(36, 79, 33, 0.25)',
                transition: 'all 0.2s',
              }}
            >
              View Details
            </Link>

            <button
              onClick={handleAddToCart}
              className="btn-primary add-cart-btn"
              style={{
                padding: '0.4rem 0.65rem',
                fontSize: '0.75rem',
                borderRadius: '999px',
                backgroundColor: '#244f21',
                color: '#FFFFFF',
                border: 'none',
                fontWeight: '850',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.2rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
            >
              <ShoppingBag size={12} />
              <span>{btnText === 'Add to Cart' ? 'Add' : btnText}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

