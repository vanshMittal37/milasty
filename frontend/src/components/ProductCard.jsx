import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Star, Heart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import PriceDisplay from './PriceDisplay';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [btnText, setBtnText] = useState('Add to Cart');

  if (!product) return null;

  const selectedVariant = product?.variants?.[selectedVariantIndex] || product?.variants?.[0] || {};
  const wishlisted = isInWishlist(product?._id || product?.id || product?.slug);

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
  const formatMinimalBadge = (text) => {
    if (!text) return '';
    const lower = text.toLowerCase();
    if (lower.includes('bestseller') || lower.includes('best seller')) return '🔥 BESTSELLER';
    if (lower.includes('gluten')) return '🛡️ GLUTEN-FREE';
    if (lower.includes('fiber')) return '🌾 HIGH FIBER';
    if (lower.includes('calcium')) return '💪 CALCIUM+';
    if (lower.includes('starter')) return '✨ STARTER';
    return text.toUpperCase();
  };

  return (
    <div
      className="milasty-product-card card-warm-beige"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        backgroundColor: 'var(--card-bg)',
        borderRadius: '20px',
        border: 'var(--card-border)',
        boxShadow: 'var(--card-shadow)',
        transition: 'all 0.25s ease',
        position: 'relative'
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.backgroundColor = 'var(--card-bg-hover)';
        e.currentTarget.style.boxShadow = 'var(--card-shadow-hover)';
        e.currentTarget.style.borderColor = 'var(--card-border-color)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.backgroundColor = 'var(--card-bg)';
        e.currentTarget.style.boxShadow = 'var(--card-shadow)';
        e.currentTarget.style.borderColor = 'var(--card-border-color)';
      }}
    >
      {/* Image Area with Badge & Wishlist Button */}
      <div style={{ position: 'relative', overflow: 'hidden', paddingTop: '75%', backgroundColor: 'var(--card-inner-bg)' }} className="card-image-wrap">
        <Link to={`/product/${product.slug || product._id || product.id}`}>
          <img
            src={product.image || product.image_url || product.primary_image || '/images/image1.jpeg'}
            alt={product.title || 'MILASTY Bake'}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.04)')}
            onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          />
        </Link>

        {/* Wishlist Heart Icon overlay */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            toggleWishlist(product);
          }}
          aria-label="Toggle Wishlist"
          className="card-wishlist-btn"
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            backgroundColor: 'var(--card-inner-bg)',
            border: '1px solid var(--card-border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(70, 40, 20, 0.08)',
            color: wishlisted ? '#2F6B3A' : 'var(--text-heading)',
            transition: 'all 0.2s',
            zIndex: 10
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#E3EEDC';
            e.currentTarget.style.color = '#2F6B3A';
            e.currentTarget.style.transform = 'scale(1.08)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--card-inner-bg)';
            e.currentTarget.style.color = wishlisted ? '#2F6B3A' : 'var(--text-heading)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <Heart size={15} fill={wishlisted ? '#2F6B3A' : 'none'} color={wishlisted ? '#2F6B3A' : 'var(--text-heading)'} />
        </button>

        {/* Dynamic Badges */}
        {(product.isBestseller || product.is_bestseller || (product.badges && product.badges.length > 0)) && (
          <div
            className="card-badge-wrap"
            style={{
              position: 'absolute',
              top: '10px',
              left: '10px',
              display: 'flex',
              alignItems: 'center',
              zIndex: 10,
              pointerEvents: 'none'
            }}
          >
            {(product.isBestseller || product.is_bestseller) ? (
              <span 
                className="card-badge-span"
                style={{
                  fontSize: '0.62rem',
                  fontWeight: '800',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  color: '#2F6B3A',
                  backgroundColor: '#E3EEDC',
                  border: '1px solid rgba(47, 107, 58, 0.3)',
                  padding: '0.25rem 0.6rem',
                  borderRadius: '999px',
                  boxShadow: '0 2px 6px rgba(70, 40, 20, 0.06)',
                  lineHeight: '1.1',
                  whiteSpace: 'nowrap',
                  display: 'inline-block'
                }}
              >
                🔥 BESTSELLER
              </span>
            ) : (
              product.badges.slice(0, 1).map((badge, idx) => (
                <span 
                  key={idx} 
                  className="card-badge-span"
                  style={{
                    fontSize: '0.62rem',
                    fontWeight: '800',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    color: '#2F6B3A',
                    backgroundColor: '#E3EEDC',
                    border: '1px solid rgba(47, 107, 58, 0.3)',
                    padding: '0.25rem 0.6rem',
                    borderRadius: '999px',
                    lineHeight: '1.1',
                    whiteSpace: 'nowrap',
                    display: 'inline-block'
                  }}
                >
                  {formatMinimalBadge(badge)}
                </span>
              ))
            )}
          </div>
        )}
      </div>

      {/* Card Details */}
      <div
        className="card-body"
        style={{
          padding: '1.1rem 1rem 1rem',
          display: 'flex',
          flexDirection: 'column',
          flexGrow: 1,
          justifyContent: 'space-between',
          backgroundColor: 'transparent',
        }}
      >
        <div>
          {/* Rating stars */}
          {(product.show_rating !== false && product.showRating !== false) && (
            <div className="card-rating-row" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.35rem' }}>
              {product.rating > 0 && (product.reviewCount > 0 || product.reviews_count > 0 || product.totalReviews > 0) ? (
                <>
                  <div style={{ display: 'flex', color: '#2F6B3A' }}>
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={11} fill={i < Math.round(product.rating) ? '#2F6B3A' : 'none'} color="#2F6B3A" />
                    ))}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '750' }}>
                    {Number(product.rating).toFixed(1)} ({product.reviewCount || product.reviews_count || product.totalReviews})
                  </span>
                </>
              ) : (
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                  No reviews yet
                </span>
              )}
            </div>
          )}

          {/* Title */}
          <h3
            className="card-title"
            style={{
              fontSize: '1.02rem',
              fontFamily: 'var(--font-serif)',
              fontWeight: '800',
              lineHeight: '1.3',
              marginBottom: '0.35rem',
              color: 'var(--text-heading)',
            }}
          >
            <Link to={`/product/${product.slug || product._id || product.id}`} style={{ color: 'var(--text-heading)', textDecoration: 'none' }}>
              {product.title}
            </Link>
          </h3>

          {/* Metric / Weight / Variant Label Badge & Selectors */}
          {product?.variants && product.variants.length > 1 ? (
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '0.55rem', alignItems: 'center' }}>
              {product.variants.map((v, vIdx) => {
                const metricText = v.label || v.weight || v.name || `${v.unit || ''}`;
                const isSelected = selectedVariantIndex === vIdx;
                return (
                  <button
                    key={vIdx}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setSelectedVariantIndex(vIdx);
                    }}
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: '800',
                      padding: '0.2rem 0.55rem',
                      borderRadius: '6px',
                      border: isSelected ? '1.5px solid #2F6B3A' : '1px solid var(--card-border-color)',
                      backgroundColor: isSelected ? '#2F6B3A' : 'var(--card-inner-bg)',
                      color: isSelected ? '#FFFFFF' : 'var(--text-heading)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      lineHeight: '1.2'
                    }}
                  >
                    {metricText}
                  </button>
                );
              })}
            </div>
          ) : (
            (selectedVariant?.label || selectedVariant?.weight || selectedVariant?.name || product?.weight || product?.unit) && (
              <div style={{ marginBottom: '0.55rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span
                  className="card-metric-badge"
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: '800',
                    color: 'var(--text-heading)',
                    backgroundColor: 'var(--card-inner-bg)',
                    border: '1px solid var(--card-border-color)',
                    padding: '0.18rem 0.6rem',
                    borderRadius: '6px',
                    display: 'inline-block',
                    letterSpacing: '0.02em',
                    lineHeight: '1.2'
                  }}
                >
                  {selectedVariant?.label || selectedVariant?.weight || selectedVariant?.name || `${product?.weight || ''} ${product?.unit || ''}`.trim()}
                </span>
              </div>
            )
          )}

          {/* Subtitle / Description */}
          <p
            className="card-subtitle"
            style={{
              fontSize: '0.82rem',
              color: 'var(--text-body)',
              lineHeight: '1.4',
              marginBottom: '0.85rem',
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
        {(() => {
          const cardPrice = (selectedVariant && selectedVariant.price !== undefined && selectedVariant.price !== null && Number(selectedVariant.price) > 0)
            ? Number(selectedVariant.price)
            : Number(product?.price || product?.resolvedPrice || product?.originalPrice || 0);

          const cardOriginalPrice = (selectedVariant && selectedVariant.originalPrice !== undefined && selectedVariant.originalPrice !== null && Number(selectedVariant.originalPrice) > 0)
            ? Number(selectedVariant.originalPrice)
            : Number(product?.originalPrice || product?.original_price || cardPrice);

          return (
            <div className="card-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid var(--card-border-color)', gap: '0.35rem', flexWrap: 'nowrap', width: '100%', marginTop: 'auto' }}>
              <PriceDisplay 
                prefix={product?.variants && product.variants.length > 1 ? 'From ' : ''}
                price={cardPrice} 
                originalPrice={cardOriginalPrice} 
                discountType={product?.discountType || product?.discount_type}
                discountValue={product?.discountValue !== undefined ? product?.discountValue : product?.discount_value}
                size="small" 
              />

              <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center', flexShrink: 0, marginLeft: 'auto' }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    handleAddToCart();
                  }}
                  className="btn-primary add-cart-btn"
                  style={{
                    padding: '0.45rem 0.85rem',
                    fontSize: '0.78rem',
                    borderRadius: '999px',
                    backgroundColor: '#2F6B3A',
                    color: '#FFFFFF',
                    border: 'none',
                    fontWeight: '800',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.3rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: '0 2px 8px rgba(47, 107, 58, 0.25)',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <ShoppingBag size={13} color="#FFFFFF" />
                  <span>{btnText === 'Add to Cart' ? 'Add' : btnText}</span>
                </button>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

