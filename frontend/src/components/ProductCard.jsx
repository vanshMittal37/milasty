import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Star, Heart, Minus, Plus } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import PriceDisplay from './PriceDisplay';

export default function ProductCard({ product }) {
  const { cartItems, addToCart, updateQuantity, removeFromCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const defaultVariantIndex = (() => {
    if (!product?.variants || product.variants.length === 0) return 0;
    const inStock = product.variants
      .map((v, idx) => ({ ...v, idx }))
      .filter((v) => (v.stock !== undefined ? v.stock : 50) > 0 && Number(v.price) > 0);
    const pool = inStock.length > 0 ? inStock : product.variants.map((v, idx) => ({ ...v, idx }));
    if (pool.length === 0) return 0;
    const lowest = pool.reduce((min, curr) => (Number(curr.price) < Number(min.price) ? curr : min), pool[0]);
    return lowest.idx;
  })();

  const [selectedVariantIndex, setSelectedVariantIndex] = useState(defaultVariantIndex);
  const [selectedQty, setSelectedQty] = useState(1);
  const [btnText, setBtnText] = useState('Add');

  if (!product) return null;

  const selectedVariant = product?.variants?.[selectedVariantIndex] || product?.variants?.[0] || {};
  const wishlisted = isInWishlist(product?._id || product?.id || product?.slug);

  const maxStock = selectedVariant?.stock !== undefined && selectedVariant?.stock !== null
    ? Number(selectedVariant.stock)
    : (product?.stock !== undefined && product?.stock !== null ? Number(product.stock) : 50);
  const isOutOfStock = maxStock <= 0 || selectedVariant?.inStock === false || product?.inStock === false;

  // Real-time synchronization with cart state
  const pId = product?._id || product?.id || product?.slug;
  const vName = selectedVariant?.name || selectedVariant?.variantName || 'Standard Pack';
  const vId = selectedVariant?.id || selectedVariant?._id;

  const cartItem = (cartItems || []).find((item) => {
    const itemPId = item.productId || item.product_id || item.id || item._id;
    const matchesProduct = itemPId === pId || item.title === product?.title;
    if (!matchesProduct) return false;

    const itemVName = item.variantName || item.variant_name;
    const itemVId = item.variantId || item.variant_id;
    if (vId && itemVId) {
      return itemVId === vId;
    }
    if (vName && itemVName) {
      return itemVName.toLowerCase() === vName.toLowerCase();
    }
    return true;
  });

  const cartQuantity = cartItem ? Number(cartItem.quantity || 0) : 0;

  // Handlers for cart and local quantity adjustments
  const handleCartDecrement = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (!cartItem) return;
    const targetId = cartItem.cartItemId || cartItem.id || cartItem._id;
    if (cartQuantity <= 1) {
      removeFromCart(targetId);
    } else {
      updateQuantity(targetId, cartQuantity - 1);
    }
  };

  const handleCartIncrement = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (!cartItem) return;
    if (cartQuantity >= maxStock) return;
    const targetId = cartItem.cartItemId || cartItem.id || cartItem._id;
    updateQuantity(targetId, cartQuantity + 1);
  };

  const handleLocalDecrement = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedQty((prev) => Math.max(1, prev - 1));
  };

  const handleLocalIncrement = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedQty((prev) => Math.min(maxStock, prev + 1));
  };

  const handleAddToCart = async (e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (isOutOfStock) return;
    setBtnText('Adding...');
    try {
      await addToCart(product, selectedVariant, selectedQty);
      setBtnText('✓ Added');
      setTimeout(() => setBtnText('Add'), 1500);
    } catch (err) {
      setBtnText('Unable to add');
      setTimeout(() => setBtnText('Add'), 2000);
    }
  };
  const formatMinimalBadge = (text) => {
    if (!text) return '';
    const lower = text.toLowerCase();
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
      {/* Size comes from .card-image-wrap aspect-ratio in index.css (4:3 desktop, 1:0.9 mobile) */}
      <div style={{ position: 'relative', overflow: 'hidden', backgroundColor: 'var(--card-inner-bg)' }} className="card-image-wrap">
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

        {/* Dynamic Badges — first badge the admin selected (no Bestseller badge: that is the dropdown's job) */}
        {(() => {
          const badges = Array.isArray(product.badges) ? product.badges.filter((b) => b && !/best\s*seller/i.test(String(b))) : [];
          const shown = badges[0];
          if (!shown) return null;
          return (
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
                {formatMinimalBadge(shown)}
              </span>
            </div>
          );
        })()}
      </div>

      {/* Card Details */}
      <div
        className="card-body"
        style={{
          padding: '1.1rem 1rem 1rem',
          display: 'flex',
          flexDirection: 'column',
          flexGrow: 1,
          minWidth: 0,
          backgroundColor: 'transparent',
        }}
      >
        {/* Info grows to fill the card so every footer in a row sits at the same height */}
        <div className="card-info" style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
          {/* Rating stars */}
          {/* Rating row only when the product has at least one review */}
          {(product.show_rating !== false && product.showRating !== false) && product.rating > 0 && (product.reviewCount > 0 || product.reviews_count > 0 || product.totalReviews > 0) && (
            <div className="card-rating-row" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.35rem' }}>
              <div style={{ display: 'flex', color: '#2F6B3A' }}>
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={11} fill={i < Math.round(product.rating) ? '#2F6B3A' : 'none'} color="#2F6B3A" />
                ))}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '750' }}>
                {Number(product.rating).toFixed(1)} ({product.reviewCount || product.reviews_count || product.totalReviews})
              </span>
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

          {/* Metric / Variant Label Badge & Selectors */}
          {product?.variants && product.variants.length > 1 ? (
            <div className="card-variants" style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '0.55rem', alignItems: 'center' }}>
              {product.variants.map((v, vIdx) => {
                const variantLabel = `${v.name || 'Pack'} — ₹${v.price}`;
                const isSelected = selectedVariantIndex === vIdx;
                const vStock = v.stock !== undefined && v.stock !== null ? Number(v.stock) : 50;
                const isOutOfStock = vStock <= 0 || v.inStock === false;

                return (
                  <button
                    key={v.id || vIdx}
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
                      lineHeight: '1.2',
                      opacity: isOutOfStock ? 0.6 : 1,
                    }}
                    title={isOutOfStock ? `${v.name || 'Pack'} (Out of Stock)` : variantLabel}
                  >
                    {variantLabel}
                  </button>
                );
              })}
            </div>
          ) : (
            (selectedVariant?.name || product?.title) && (
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
                  {selectedVariant?.name || 'Standard Pack'}
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

          const cardDiscountType = selectedVariant?.discountType || product?.discountType || product?.discount_type;
          const cardDiscountValue = selectedVariant?.discountValue !== undefined && selectedVariant?.discountValue !== null
            ? selectedVariant.discountValue
            : (product?.discountValue !== undefined ? product.discountValue : product?.discount_value);

          return (
            <div className="card-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid var(--card-border-color)', gap: '0.5rem', width: '100%', minWidth: 0, boxSizing: 'border-box', marginTop: 'auto' }}>
              <PriceDisplay
                className="card-price-block"
                style={{ minWidth: 0 }}
                prefix=""
                price={cardPrice}
                originalPrice={cardOriginalPrice}
                discountType={cardDiscountType}
                discountValue={cardDiscountValue}
                size="small"
              />

              <div className="card-cta-wrap" style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', flexShrink: 0, marginLeft: 'auto' }}>
                {isOutOfStock ? (
                  <span
                    style={{
                      padding: '0.35rem 0.65rem',
                      fontSize: '0.74rem',
                      borderRadius: '999px',
                      backgroundColor: 'var(--card-inner-bg)',
                      color: 'var(--text-muted)',
                      border: '1px solid var(--card-border-color)',
                      fontWeight: '750',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Out of Stock
                  </span>
                ) : cartQuantity > 0 ? (
                  /* In-Cart Two-Way Synchronized Stepper */
                  <div
                    className="card-in-cart-stepper"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      backgroundColor: '#2F6B3A',
                      borderRadius: '999px',
                      padding: '2px',
                      boxShadow: '0 2px 8px rgba(47, 107, 58, 0.25)',
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                    }}
                  >
                    <button
                      type="button"
                      onClick={handleCartDecrement}
                      aria-label="Decrease quantity"
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        border: 'none',
                        backgroundColor: 'rgba(255, 255, 255, 0.15)',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        padding: 0,
                        transition: 'background-color 0.15s',
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)')}
                      onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)')}
                    >
                      <Minus size={13} strokeWidth={3} />
                    </button>

                    <span
                      style={{
                        minWidth: '22px',
                        textAlign: 'center',
                        color: '#FFFFFF',
                        fontWeight: '800',
                        fontSize: '0.82rem',
                        padding: '0 4px',
                        userSelect: 'none',
                      }}
                    >
                      {cartQuantity}
                    </span>

                    <button
                      type="button"
                      onClick={handleCartIncrement}
                      disabled={cartQuantity >= maxStock}
                      aria-label="Increase quantity"
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        border: 'none',
                        backgroundColor: cartQuantity >= maxStock ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.15)',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: cartQuantity >= maxStock ? 'not-allowed' : 'pointer',
                        opacity: cartQuantity >= maxStock ? 0.5 : 1,
                        padding: 0,
                        transition: 'background-color 0.15s',
                      }}
                      onMouseOver={(e) => {
                        if (cartQuantity < maxStock) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
                      }}
                      onMouseOut={(e) => {
                        if (cartQuantity < maxStock) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                      }}
                    >
                      <Plus size={13} strokeWidth={3} />
                    </button>
                  </div>
                ) : (
                  /* Pre-Add Quantity Selector with Add Button */
                  <div
                    className="card-pre-add-group"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                    }}
                  >
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        backgroundColor: 'var(--card-inner-bg)',
                        border: '1px solid var(--card-border-color)',
                        borderRadius: '999px',
                        padding: '2px',
                      }}
                    >
                      <button
                        type="button"
                        onClick={handleLocalDecrement}
                        disabled={selectedQty <= 1}
                        aria-label="Decrease quantity"
                        style={{
                          width: '22px',
                          height: '22px',
                          borderRadius: '50%',
                          border: 'none',
                          backgroundColor: 'transparent',
                          color: selectedQty <= 1 ? 'var(--text-muted)' : 'var(--text-heading)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: selectedQty <= 1 ? 'not-allowed' : 'pointer',
                          opacity: selectedQty <= 1 ? 0.4 : 1,
                          padding: 0,
                        }}
                      >
                        <Minus size={11} strokeWidth={2.5} />
                      </button>

                      <span
                        style={{
                          minWidth: '16px',
                          textAlign: 'center',
                          fontSize: '0.76rem',
                          fontWeight: '800',
                          color: 'var(--text-heading)',
                          userSelect: 'none',
                          padding: '0 2px',
                        }}
                      >
                        {selectedQty}
                      </span>

                      <button
                        type="button"
                        onClick={handleLocalIncrement}
                        disabled={selectedQty >= maxStock}
                        aria-label="Increase quantity"
                        style={{
                          width: '22px',
                          height: '22px',
                          borderRadius: '50%',
                          border: 'none',
                          backgroundColor: 'transparent',
                          color: selectedQty >= maxStock ? 'var(--text-muted)' : 'var(--text-heading)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: selectedQty >= maxStock ? 'not-allowed' : 'pointer',
                          opacity: selectedQty >= maxStock ? 0.4 : 1,
                          padding: 0,
                        }}
                      >
                        <Plus size={11} strokeWidth={2.5} />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddToCart}
                      className="btn-primary add-cart-btn"
                      style={{
                        padding: '0.42rem 0.72rem',
                        fontSize: '0.78rem',
                        borderRadius: '999px',
                        backgroundColor: '#2F6B3A',
                        color: '#FFFFFF',
                        border: 'none',
                        fontWeight: '800',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.28rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: '0 2px 8px rgba(47, 107, 58, 0.25)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <ShoppingBag size={13} color="#FFFFFF" />
                      <span>{btnText}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

