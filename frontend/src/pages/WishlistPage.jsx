import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Trash2, ArrowRight, Star, ChevronRight, Eye, Sparkles, ChevronLeft } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { initialProducts } from '../data/seedData';

// Encapsulated Sub-Component for individual Wishlist Cards
function WishlistProductCard({ product }) {
  const { addToCart, showToast } = useCart();
  const { wishlistItems, toggleWishlist } = useWishlist();
  const [selectedVariantIdx, setSelectedVariantIdx] = useState(0);
  const [btnText, setBtnText] = useState('Add to Cart');

  const selectedVariant = product.variants?.[selectedVariantIdx] || product.variants?.[0] || product;
  const unitPrice = selectedVariant.price || product.price;

  // Determine if this item is currently in the wishlist
  const isAdded = wishlistItems.some(item => item._id === product._id || item.slug === product.slug);

  const handleAddToCart = async () => {
    setBtnText('Adding...');
    try {
      await addToCart(product, selectedVariant, 1);
      setBtnText('✓ Added');
      setTimeout(() => setBtnText('Add to Cart'), 1500);
    } catch (e) {
      setBtnText('Error');
      setTimeout(() => setBtnText('Add to Cart'), 1500);
    }
  };

  const handleHeartClick = () => {
    toggleWishlist(product);
    if (showToast) {
      showToast(
        isAdded ? '✓ Removed from wishlist' : '✓ Saved to wishlist',
        'success'
      );
    }
  };

  return (
    <div 
      className="glass-card" 
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        overflow: 'hidden', 
        position: 'relative',
        transition: 'transform 0.2s',
        height: '100%'
      }}
      onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
      onMouseOut={(e) => e.currentTarget.style.transform = 'none'}
    >
      {/* Top Image area */}
      <div style={{ position: 'relative', paddingTop: '80%', overflow: 'hidden', backgroundColor: 'transparent' }}>
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
              transition: 'transform 0.3s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          />
        </Link>

        {/* Badge */}
        {product.badges && product.badges.length > 0 && (
          <span 
            style={{
              position: 'absolute',
              top: '16px',
              left: '16px',
              fontSize: '0.65rem',
              fontWeight: '800',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: '#24130D',
              backgroundColor: 'var(--accent-gold)',
              padding: '0.3rem 0.65rem',
              borderRadius: '999px',
              zIndex: 5
            }}
          >
            {product.badges[0]}
          </span>
        )}

        {/* Heart Quick Add/Remove */}
        <button
          onClick={handleHeartClick}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: 'var(--bg-subtle)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)',
            color: isAdded ? 'var(--accent-gold)' : 'var(--text-muted)',
            zIndex: 5
          }}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-sand)')}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
          title={isAdded ? "Remove from Wishlist" : "Add to Wishlist"}
        >
          <Heart size={16} fill={isAdded ? "var(--accent-gold)" : "none"} color={isAdded ? "var(--accent-gold)" : "currentColor"} />
        </button>
      </div>

      {/* Details Area */}
      <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'space-between' }}>
        <div>
          {/* Rating */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.5rem' }}>
            <div style={{ display: 'flex', color: 'var(--accent-gold)' }}>
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={11} fill={i < Math.floor(product.rating || 5) ? 'var(--accent-gold)' : 'none'} color="var(--accent-gold)" />
              ))}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700' }}>
              {product.rating} ({product.reviewCount || 10})
            </span>
          </div>

          {/* Title */}
          <h3 style={{ fontSize: '1.1rem', fontFamily: 'var(--font-serif)', color: 'var(--text-light)', fontWeight: '800', margin: '0 0 0.35rem 0' }}>
            <Link to={`/product/${product.slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>
              {product.title}
            </Link>
          </h3>

          {/* Description */}
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.5', margin: '0 0 1.25rem 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', fontWeight: '500' }}>
            {product.subtitle || product.description}
          </p>

          {/* Variant Selectors Removed */}
        </div>

        {/* Pricing & Actions bottom container */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: '700' }}>Price</span>
            <div style={{ fontSize: '1.2rem', fontWeight: '900', color: 'var(--accent-gold)' }}>
              ₹{unitPrice}
              {selectedVariant.originalPrice && (
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textDecoration: 'line-through', marginLeft: '0.4rem', fontWeight: '500' }}>
                  ₹{selectedVariant.originalPrice}
                </span>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', width: '100%', alignItems: 'center' }}>
            <Link
              to={`/product/${product.slug}`}
              className="btn-secondary"
              title="View Details"
              style={{
                flex: 1,
                padding: '0.7rem',
                borderRadius: '12px',
                fontWeight: '800',
                textAlign: 'center',
                borderColor: 'var(--accent-gold)',
                color: 'var(--accent-gold)',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'transparent',
                minHeight: '40px',
                gap: '0.35rem'
              }}
            >
              <Eye size={16} />
              <span style={{ fontSize: '0.76rem' }}>Details</span>
            </Link>

            <button
              onClick={handleAddToCart}
              className="btn-primary"
              title="Add to Cart"
              style={{
                padding: '0.7rem 1rem',
                borderRadius: '12px',
                backgroundColor: 'var(--accent-gold)',
                color: '#24130D',
                border: 'none',
                fontWeight: '800',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.35rem',
                cursor: 'pointer',
                minHeight: '40px',
                flex: 1
              }}
            >
              <ShoppingBag size={15} />
              <span style={{ fontSize: '0.76rem' }}>Cart</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WishlistPage() {
  const { wishlistItems, toggleWishlist } = useWishlist();
  const { addToCart, showToast } = useCart();
  const [sortBy, setSortBy] = useState('recent');
  const recRef = useRef(null);

  const scrollLeft = (ref) => {
    if (ref.current) {
      ref.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
  };

  const scrollRight = (ref) => {
    if (ref.current) {
      ref.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
  };

  const handleQuickRemove = (product) => {
    toggleWishlist(product);
    if (showToast) {
      showToast(`✓ Removed from wishlist`, 'info');
    }
  };

  const handleAddAllToCart = async () => {
    if (wishlistItems.length === 0) return;
    try {
      for (const item of wishlistItems) {
        const variant = item.variants?.[0] || item;
        await addToCart(item, variant, 1);
      }
      if (showToast) {
        showToast(`✓ Added all saved bakes to your cart`, 'success');
      }
    } catch (e) {
      // Continue
    }
  };

  // Sort function
  const getSortedItems = () => {
    let sorted = [...wishlistItems];
    if (sortBy === 'price_low_high') {
      sorted.sort((a, b) => {
        const priceA = a.variants?.[0]?.price || a.price || 0;
        const priceB = b.variants?.[0]?.price || b.price || 0;
        return priceA - priceB;
      });
    } else if (sortBy === 'price_high_low') {
      sorted.sort((a, b) => {
        const priceA = a.variants?.[0]?.price || a.price || 0;
        const priceB = b.variants?.[0]?.price || b.price || 0;
        return priceB - priceA;
      });
    } else if (sortBy === 'alpha') {
      sorted.sort((a, b) => a.title.localeCompare(b.title));
    }
    return sorted;
  };

  const sortedWishlistItems = getSortedItems();
  const recommendations = initialProducts.slice(0, 4);

  return (
    <div className="wishlist-page" style={{ backgroundColor: 'var(--bg-main)', minHeight: '100vh', padding: '0 0 6.5rem' }}>
      
      {/* 1. HERO SECTION */}
      <section 
        style={{ 
          padding: '5rem 0 3.5rem', 
          textAlign: 'center', 
          maxWidth: '800px', 
          margin: '0 auto',
          paddingLeft: '1.5rem',
          paddingRight: '1.5rem'
        }}
      >
        <span 
          style={{ 
            fontSize: '0.74rem', 
            textTransform: 'uppercase', 
            letterSpacing: '0.12em', 
            color: 'var(--accent-gold)', 
            fontWeight: '800',
            backgroundColor: 'rgba(197, 160, 89, 0.08)',
            padding: '0.35rem 0.85rem',
            borderRadius: '999px',
            border: '1px solid rgba(197, 160, 89, 0.15)',
            display: 'inline-block',
            marginBottom: '1rem'
          }}
        >
          Saved For Later
        </span>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <Heart size={24} color="var(--primary-dark)" fill="var(--primary-dark)" />
          <h1 
            style={{ 
              fontSize: '2.5rem', 
              fontFamily: 'var(--font-serif)', 
              color: 'var(--primary-dark)', 
              fontWeight: '800',
              margin: 0,
              letterSpacing: '-0.01em'
            }}
          >
            My Wishlist
          </h1>
        </div>
        <p style={{ fontSize: '1rem', color: 'var(--text-muted)', lineHeight: '1.6', margin: '0 0 0.5rem 0', fontWeight: '500' }}>
          Keep your favourite MILASTY bakes close and discover them whenever you're ready.
        </p>
        <span style={{ fontSize: '0.8rem', color: 'var(--accent-gold)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'} saved
        </span>
      </section>

      {/* Main container */}
      <div className="container" style={{ maxWidth: '1200px' }}>
        
        {wishlistItems.length === 0 ? (
          /* 7. EMPTY WISHLIST STATE */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5rem' }}>
            <div 
              className="glass-card" 
              style={{ 
                padding: '4rem 2rem', 
                textAlign: 'center', 
                backgroundColor: 'transparent', 
                borderRadius: '24px', 
                border: '1.5px solid var(--border-color)',
                maxWidth: '620px',
                margin: '0 auto',
                boxShadow: '0 8px 30px rgba(56, 20, 35, 0.02)'
              }}
            >
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'rgba(56, 20, 35, 0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-gold)', margin: '0 auto 1.5rem' }}>
                <Heart size={28} />
              </div>
              <h3 style={{ fontSize: '1.35rem', fontFamily: 'var(--font-serif)', color: 'var(--primary-dark)', fontWeight: '800', marginBottom: '0.5rem', margin: 0 }}>Nothing saved yet.</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: '1.6', marginBottom: '2rem', marginTop: '0.5rem', fontWeight: '500' }}>
                Your favourite MILASTY bakes will appear here when you tap the heart icon.
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', alignItems: 'center' }}>
                <Link 
                  to="/shop" 
                  className="btn-primary" 
                  style={{ 
                    padding: '0.9rem 2.25rem', 
                    fontSize: '0.9rem', 
                    backgroundColor: 'var(--primary-dark)', 
                    color: '#FFFFFF', 
                    border: 'none', 
                    borderRadius: '999px', 
                    fontWeight: '800',
                    textDecoration: 'none'
                  }}
                >
                  Explore Our Bakes
                </Link>
                <Link 
                  to="/products" 
                  style={{ 
                    fontSize: '0.84rem', 
                    color: 'var(--accent-gold)', 
                    fontWeight: '800', 
                    textDecoration: 'none',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em'
                  }}
                >
                  Discover Your Daily Ritual →
                </Link>
              </div>
            </div>

            {/* 8. RECOMMENDED PRODUCTS */}
            <section style={{ borderTop: '1px solid rgba(245, 235, 221, 0.15)', paddingTop: '5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3.5rem' }}>
                <div>
                  <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent-gold)', fontWeight: '800', display: 'block', marginBottom: '0.35rem' }}>Recommendations</span>
                  <h2 style={{ fontSize: '2.1rem', fontFamily: 'var(--font-serif)', color: 'var(--text-light)', fontWeight: '800', margin: 0 }}>
                    You May Also Love
                  </h2>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    onClick={() => scrollLeft(recRef)} 
                    style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(245,235,221,0.2)', color: 'var(--text-light)', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button 
                    onClick={() => scrollRight(recRef)} 
                    style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(245,235,221,0.2)', color: 'var(--text-light)', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
              
              <div 
                ref={recRef}
                className="horizontal-scroll-container"
                style={{ 
                  display: 'flex', 
                  gap: '1.5rem', 
                  overflowX: 'auto', 
                  scrollBehavior: 'smooth',
                  paddingBottom: '1rem'
                }}
              >
                {recommendations.map((p) => (
                  <div key={`rec-${p._id || p.slug}`} style={{ flexShrink: 0, width: '280px' }}>
                    <WishlistProductCard 
                      product={p} 
                    />
                  </div>
                ))}
              </div>
            </section>
          </div>
        ) : (
          /* WISHLIST HAS PRODUCTS */
          <div>
            {/* 6. WISHLIST TOOLBAR */}
            <div 
              style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                gap: '1.25rem', 
                marginBottom: '2.5rem', 
                flexWrap: 'wrap',
                backgroundColor: 'transparent',
                backdropFilter: 'blur(14px)',
                WebkitBackdropFilter: 'blur(14px)',
                padding: '1.1rem 1.75rem',
                borderRadius: '20px',
                border: '1px solid rgba(245, 235, 221, 0.25)',
                boxShadow: 'var(--shadow-md)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.98rem', fontWeight: '850', color: 'var(--text-light)' }}>Your Saved Bakes</span>
                <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)', fontWeight: '700' }}>({wishlistItems.length} items)</span>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                
                {/* Sort selector */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{
                    padding: '0.65rem 1rem',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.8rem',
                    color: 'var(--text-light)',
                    fontWeight: '800',
                    backgroundColor: 'var(--bg-subtle)',
                    outline: 'none',
                    cursor: 'pointer',
                    minHeight: '38px'
                  }}
                >
                  <option value="recent">Recently Added</option>
                  <option value="price_low_high">Price: Low to High</option>
                  <option value="price_high_low">Price: High to Low</option>
                  <option value="alpha">Name: A–Z</option>
                </select>

                {/* Add all to cart */}
                <button
                  onClick={handleAddAllToCart}
                  className="btn-primary"
                  style={{
                    padding: '0.65rem 1.25rem',
                    fontSize: '0.8rem',
                    borderRadius: '12px',
                    backgroundColor: 'var(--accent-gold)',
                    color: '#24130D',
                    border: 'none',
                    fontWeight: '850',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    minHeight: '38px'
                  }}
                >
                  <ShoppingBag size={14} />
                  <span>Add All to Cart</span>
                </button>

              </div>
            </div>

            {/* 2. WISHLIST PRODUCT GRID */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: '2.5rem',
                marginBottom: '6rem'
              }}
            >
              {sortedWishlistItems.map((product) => (
                <WishlistProductCard 
                  key={product._id || product.slug} 
                  product={product} 
                />
              ))}
            </div>

            {/* 9. STILL EXPLORING CTA */}
            <section style={{ borderTop: '1px solid rgba(245, 235, 221, 0.15)', paddingTop: '6rem', textAlign: 'center' }}>
              <h2 style={{ fontSize: '2.4rem', fontFamily: 'var(--font-serif)', color: 'var(--text-light)', fontWeight: '800', marginBottom: '0.75rem', margin: 0 }}>
                Still Exploring?
              </h2>
              <p style={{ fontSize: '1rem', color: 'var(--text-muted)', lineHeight: '1.65', marginBottom: '2.25rem', fontWeight: '500', marginTop: '0.5rem' }}>
                Discover more handcrafted MILASTY bakes made for your everyday rituals.
              </p>
              <Link 
                to="/shop" 
                className="btn-primary" 
                style={{ 
                  padding: '0.95rem 2.25rem', 
                  fontSize: '0.9rem', 
                  backgroundColor: 'var(--accent-gold)', 
                  color: '#24130D', 
                  border: 'none', 
                  borderRadius: '999px', 
                  fontWeight: '800',
                  textDecoration: 'none',
                  display: 'inline-block'
                }}
              >
                Explore All Bakes →
              </Link>
            </section>
          </div>
        )}

      </div>

      {/* Hidden scrollbar styles */}
      <style>{`
        .horizontal-scroll-container::-webkit-scrollbar {
          display: none !important;
        }
        .horizontal-scroll-container {
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
        }
      `}</style>

    </div>
  );
}
