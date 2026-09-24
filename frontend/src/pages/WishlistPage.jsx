import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Trash2, ArrowRight, Star, ChevronRight, Eye, Sparkles, ChevronLeft } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { initialProducts } from '../data/seedData';
import ProductCard from '../components/ProductCard';

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
      sorted.sort((a, b) => (a?.title || '').localeCompare(b?.title || ''));
    }
    return sorted;
  };

  const sortedWishlistItems = getSortedItems();
  const recommendations = initialProducts.slice(0, 4);

  return (
    <div
      className="wishlist-page"
      style={{
        minHeight: '100vh',
        padding: '0 0 6.5rem',
        width: '100%',
        maxWidth: '100%',
        overflowX: 'hidden',
        boxSizing: 'border-box',
        backgroundColor: '#F7F0E5',
        backgroundImage: 'linear-gradient(rgba(247, 240, 229, 0.25), rgba(247, 240, 229, 0.25)), url(/images/about_background_image.jpeg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        color: '#2B170D'
      }}
    >
      <div>

      {/* 1. HERO SECTION */}
      <section
        className="wishlist-hero-section"
        style={{
          padding: '3rem 1.5rem 2.5rem',
          textAlign: 'center',
          maxWidth: '800px',
          margin: '0 auto',
          boxSizing: 'border-box'
        }}
      >
        <div 
          style={{
            backgroundColor: '#FFF9F0',
            borderRadius: '24px',
            border: '1px solid #DCC8AE',
            boxShadow: '0 8px 30px rgba(75, 45, 25, 0.06)',
            padding: '2.5rem 2rem 2rem',
            display: 'inline-block',
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          <span
            style={{
              fontSize: '0.74rem',
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: '#2F6B3A',
              fontWeight: '850',
              backgroundColor: '#E3EEDC',
              padding: '0.4rem 0.95rem',
              borderRadius: '999px',
              border: '1px solid #DCC8AE',
              display: 'inline-block',
              marginBottom: '1rem'
            }}
          >
            Saved For Later
          </span>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <Heart size={26} color="#2F6B3A" fill="#2F6B3A" />
            <h1
              style={{
                fontSize: '2.5rem',
                fontFamily: 'var(--font-serif)',
                color: '#32180D',
                fontWeight: '850',
                margin: 0,
                letterSpacing: '-0.01em'
              }}
            >
              My Wishlist
            </h1>
          </div>
          <p style={{ fontSize: '1rem', color: '#654B38', lineHeight: '1.6', margin: '0 0 0.85rem 0', fontWeight: '500' }}>
            Keep your favourite MILASTY bakes close and discover them whenever you're ready.
          </p>
          <span style={{ fontSize: '0.82rem', color: '#2F6B3A', fontWeight: '850', textTransform: 'uppercase', letterSpacing: '0.06em', backgroundColor: '#E3EEDC', padding: '0.35rem 0.85rem', borderRadius: '8px', border: '1px solid #DCC8AE', display: 'inline-block' }}>
            {wishlistItems.length} {wishlistItems.length === 1 ? 'ITEM' : 'ITEMS'} SAVED
          </span>
        </div>
      </section>

      {/* Main container */}
      <div className="container wishlist-main-container" style={{ maxWidth: '1200px' }}>
        
        {wishlistItems.length === 0 ? (
          /* EMPTY WISHLIST STATE */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5rem' }}>
            <div
              style={{
                padding: '3.5rem 2rem',
                textAlign: 'center',
                backgroundColor: '#FFF9F0',
                borderRadius: '24px',
                border: '1px solid #DCC8AE',
                maxWidth: '620px',
                margin: '0 auto',
                boxShadow: '0 8px 30px rgba(75, 45, 25, 0.06)'
              }}
            >
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#E3EEDC', border: '1px solid #DCC8AE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2F6B3A', margin: '0 auto 1.5rem' }}>
                <Heart size={28} color="#2F6B3A" />
              </div>
              <h3 style={{ fontSize: '1.35rem', fontFamily: 'var(--font-serif)', color: '#32180D', fontWeight: '850', margin: '0 0 0.5rem' }}>Nothing saved yet.</h3>
              <p style={{ color: '#654B38', fontSize: '0.92rem', lineHeight: '1.6', marginBottom: '2rem', marginTop: '0.5rem', fontWeight: '500' }}>
                Your favourite MILASTY bakes will appear here when you tap the heart icon.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', alignItems: 'center' }}>
                <Link
                  to="/shop"
                  className="btn-primary"
                  style={{
                    padding: '0.9rem 2.25rem',
                    fontSize: '0.9rem',
                    backgroundColor: '#2F6B3A',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '999px',
                    fontWeight: '850',
                    textDecoration: 'none',
                    display: 'inline-block'
                  }}
                >
                  Explore Our Bakes
                </Link>
                <Link
                  to="/shop"
                  style={{
                    fontSize: '0.84rem',
                    color: '#2F6B3A',
                    fontWeight: '850',
                    textDecoration: 'none',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em'
                  }}
                >
                  Discover Your Daily Ritual →
                </Link>
              </div>
            </div>

            {/* RECOMMENDED PRODUCTS */}
            <section style={{ borderTop: '1px solid #DCC8AE', paddingTop: '4rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem' }}>
                <div>
                  <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.14em', color: '#2F6B3A', fontWeight: '850', display: 'block', marginBottom: '0.35rem' }}>Recommendations</span>
                  <h2 style={{ fontSize: '2.1rem', fontFamily: 'var(--font-serif)', color: '#32180D', fontWeight: '850', margin: 0 }}>
                    You May Also Love
                  </h2>
                </div>
                <div className="section-scroll-buttons" style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => scrollLeft(recRef)}
                    style={{ backgroundColor: '#FFF9F0', border: '1px solid #DCC8AE', color: '#32180D', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => scrollRight(recRef)}
                    style={{ backgroundColor: '#FFF9F0', border: '1px solid #DCC8AE', color: '#32180D', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
              
              <div 
                ref={recRef}
                className="wishlist-recommendations-grid"
                style={{ 
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '1.5rem',
                  width: '100%',
                }}
              >
                {recommendations.map((p) => (
                  <ProductCard key={`rec-${p._id || p.slug}`} product={p} />
                ))}
              </div>
            </section>
          </div>
        ) : (
          /* WISHLIST HAS PRODUCTS */
          <div>
            {/* WISHLIST TOOLBAR */}
            <div
              style={{
                display: 'flex',
                justify: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
                marginBottom: '2rem',
                paddingBottom: '1rem',
                borderBottom: '1px solid #DCC8AE'
              }}
            >
              <span style={{ fontSize: '0.9rem', color: '#654B38', fontWeight: '700' }}>
                Showing {sortedWishlistItems.length} {sortedWishlistItems.length === 1 ? 'saved bake' : 'saved bakes'}
              </span>

              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>

                {/* Sort selector */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{
                    padding: '0.65rem 1rem',
                    borderRadius: '12px',
                    border: '1px solid #DCC8AE',
                    fontSize: '0.8rem',
                    color: '#32180D',
                    fontWeight: '700',
                    backgroundColor: '#FFF9F0',
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
                  style={{
                    padding: '0.65rem 1.25rem',
                    fontSize: '0.8rem',
                    borderRadius: '12px',
                    backgroundColor: '#2F6B3A',
                    color: '#FFFFFF',
                    border: 'none',
                    fontWeight: '800',
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

            {/* WISHLIST PRODUCT GRID */}
            <div
              className="wishlist-items-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: '2.5rem',
                marginBottom: '6rem'
              }}
            >
              {sortedWishlistItems.map((product) => (
                <ProductCard 
                  key={product._id || product.slug} 
                  product={product} 
                />
              ))}
            </div>

            {/* YOU MAY ALSO LOVE RECOMMENDATIONS */}
            <section style={{ borderTop: '1px solid #DCC8AE', paddingTop: '4rem', marginBottom: '4rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#2F6B3A', fontWeight: '850', display: 'block', marginBottom: '0.25rem' }}>Recommendations</span>
                  <h2 style={{ fontSize: '1.8rem', fontFamily: 'var(--font-serif)', color: '#32180D', fontWeight: '850', margin: 0 }}>You May Also Love</h2>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    onClick={() => scrollLeft(recRef)} 
                    aria-label="Scroll Left" 
                    style={{ backgroundColor: '#FFF9F0', border: '1px solid #DCC8AE', color: '#32180D', width: '38px', height: '38px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button 
                    onClick={() => scrollRight(recRef)} 
                    aria-label="Scroll Right" 
                    style={{ backgroundColor: '#FFF9F0', border: '1px solid #DCC8AE', color: '#32180D', width: '38px', height: '38px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              <div 
                ref={recRef} 
                className="wishlist-recommendations-grid"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '1.5rem',
                  width: '100%',
                }}
              >
                {recommendations.map((p) => (
                  <ProductCard key={`rec-${p._id || p.slug}`} product={p} />
                ))}
              </div>
            </section>

            {/* STILL EXPLORING CTA */}
            <section style={{ borderTop: '1px solid #DCC8AE', paddingTop: '4rem', textAlign: 'center' }}>
              <div style={{
                backgroundColor: '#FFF9F0',
                borderRadius: '24px',
                border: '1px solid #DCC8AE',
                boxShadow: '0 8px 30px rgba(75, 45, 25, 0.06)',
                padding: '3.5rem 2rem',
              }}>
                <h2 style={{ fontSize: '2.4rem', fontFamily: 'var(--font-serif)', color: '#32180D', fontWeight: '800', marginBottom: '0.75rem', margin: '0 0 0.75rem' }}>
                  Still Exploring?
                </h2>
                <p style={{ fontSize: '1rem', color: '#654B38', lineHeight: '1.65', marginBottom: '2.25rem', fontWeight: '500', marginTop: '0.5rem' }}>
                  Discover more handcrafted MILASTY bakes made for your everyday rituals.
                </p>
                <Link
                  to="/shop"
                  style={{
                    padding: '0.95rem 2.25rem',
                    fontSize: '0.9rem',
                    backgroundColor: '#2F6B3A',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '999px',
                    fontWeight: '850',
                    textDecoration: 'none',
                    display: 'inline-block'
                  }}
                >
                  Explore All Bakes →
                </Link>
              </div>
            </section>
          </div>
        )}

      </div>

      </div>
    </div>
  );
}
