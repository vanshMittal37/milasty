import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import api from '../api/axios';
import { initialProducts } from '../data/seedData';
import { Sparkles, Heart, ChevronRight, Leaf, Shield, Award, ShoppingBag, Eye } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function Products() {
  const { addToCart } = useCart();
  const [products, setProducts] = useState(initialProducts);
  const [activeCategory, setActiveCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [featuredBtnText, setFeaturedBtnText] = useState('Add to Cart');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get('/products');
        if (res.data && res.data.length > 0) {
          setProducts(res.data);
        }
      } catch (err) {
        console.warn('Using initial seed products');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const filteredProducts =
    activeCategory === 'all'
      ? products
      : products.filter((p) => p.category === activeCategory);

  // Find the featured product (Signature Trio Box or first item)
  const featuredProduct = products.find(p => p.category === 'starter') || products[0];

  const handleAddFeaturedToCart = async () => {
    if (!featuredProduct) return;
    setFeaturedBtnText('Adding...');
    try {
      const selectedVariant = featuredProduct.variants?.[0] || { name: 'Standard Pack', weight: 'Trial Pack', price: 599 };
      await addToCart(featuredProduct, selectedVariant);
      setFeaturedBtnText('✓ Added');
      setTimeout(() => setFeaturedBtnText('Add to Cart'), 1500);
    } catch (e) {
      setFeaturedBtnText('Unable to add');
      setTimeout(() => setFeaturedBtnText('Add to Cart'), 2000);
    }
  };

  const handleScrollToProducts = () => {
    const el = document.getElementById('products-grid-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div
      className="products-page"
      style={{
        minHeight: '100vh',
        padding: '0 0 5rem',
        width: '100%',
        maxWidth: '100%',
        overflowX: 'hidden',
        boxSizing: 'border-box',
        position: 'relative',
        backgroundImage: 'url(/images/ritiual_background_image.jpeg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Dark overlay for readability */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(135deg, rgba(20, 10, 5, 0.30) 0%, rgba(36, 19, 13, 0.22) 100%)',
        zIndex: 0,
        pointerEvents: 'none',
      }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
      
      {/* 1. EDITORIAL HERO SECTION */}
      <section 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
          gap: '4rem', 
          alignItems: 'center', 
          padding: '5rem 0 6rem',
          maxWidth: '1200px',
          margin: '0 auto',
          paddingLeft: '1.5rem',
          paddingRight: '1.5rem'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <span 
            style={{ 
              alignSelf: 'flex-start',
              fontSize: '0.78rem', 
              textTransform: 'uppercase', 
              letterSpacing: '0.12em', 
              color: 'var(--accent-gold)', 
              fontWeight: '800',
              backgroundColor: 'rgba(197, 160, 89, 0.08)',
              padding: '0.35rem 0.85rem',
              borderRadius: '999px',
              border: '1px solid rgba(197, 160, 89, 0.15)'
            }}
          >
            Handcrafted Millet Bakery
          </span>
          <h1 
            style={{ 
              fontSize: 'clamp(2.5rem, 5.5vw, 3.8rem)', 
              fontFamily: 'var(--font-serif)', 
              color: 'var(--primary-dark)', 
              fontWeight: '800', 
              lineHeight: '1.15',
              letterSpacing: '-0.02em',
              margin: 0
            }}
          >
            Discover Your<br />Daily MILASTY Ritual.
          </h1>
          <p 
            style={{ 
              fontSize: '1.15rem', 
              color: 'var(--text-muted)', 
              lineHeight: '1.7', 
              maxWidth: '540px',
              margin: '0.5rem 0 1.5rem'
            }}
          >
            Wholesome millet bakes, slow-crafted with pure Desi Ghee and thoughtful ingredients for everyday moments of joy.
          </p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Link 
              to="/shop" 
              className="btn-primary" 
              style={{ padding: '0.9rem 2.25rem', fontSize: '0.92rem', backgroundColor: 'var(--primary-dark)', color: 'var(--bg-main)', border: 'none', borderRadius: '999px', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none' }}
            >
              <span>Shop All Bakes</span>
              <ChevronRight size={16} />
            </Link>
            <button 
              onClick={handleScrollToProducts}
              className="btn-secondary" 
              style={{ padding: '0.9rem 2.25rem', fontSize: '0.92rem', borderColor: 'var(--primary-dark)', color: 'var(--primary-dark)', borderRadius: '999px', fontWeight: '800', cursor: 'pointer', backgroundColor: 'transparent' }}
            >
              Discover Our Ritual
            </button>
          </div>
        </div>

        {/* Hero image with rounded corners */}
        <div style={{ position: 'relative' }}>
          <div 
            style={{ 
              position: 'relative', 
              overflow: 'hidden', 
              borderRadius: '24px', 
              boxShadow: '0 20px 40px rgba(56,20,35,0.06)',
              border: '1px solid rgba(245, 220, 180, 0.18)'
            }}
          >
            <img
              src="https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=800&q=80"
              alt="Handcrafted millet cookies pile"
              style={{
                width: '100%',
                display: 'block',
                transition: 'transform 0.6s ease',
                objectFit: 'cover',
                height: '420px'
              }}
            />
          </div>
        </div>
      </section>

      <section className="products-trust-strip" style={{ backgroundColor: 'rgba(20, 10, 5, 0.55)', padding: '2.5rem 0', borderTop: '1px solid rgba(245, 220, 180, 0.15)', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', paddingLeft: '1.5rem', paddingRight: '1.5rem', display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-dark)', fontWeight: '800', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            <Leaf size={16} color="var(--accent-gold)" />
            <span>100% Pure Desi Ghee</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-dark)', fontWeight: '800', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            <Sparkles size={16} color="var(--accent-gold)" />
            <span>Wholesome Millets</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-dark)', fontWeight: '800', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            <Shield size={16} color="var(--accent-gold)" />
            <span>No Palm Oil</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-dark)', fontWeight: '800', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            <Award size={16} color="var(--accent-gold)" />
            <span>Thoughtful Ingredients</span>
          </div>
        </div>
      </section>

      {/* 3. FEATURED COLLECTION SECTION ("Start With Something Special") */}
      {featuredProduct && (
        <section style={{ padding: '6rem 0', backgroundColor: 'transparent' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', paddingLeft: '1.5rem', paddingRight: '1.5rem' }}>
            
            <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--accent-gold)', fontWeight: '800', display: 'block', marginBottom: '0.5rem' }}>Bestselling Starter</span>
              <h2 style={{ fontSize: '2.25rem', fontFamily: 'var(--font-serif)', color: 'var(--primary-dark)', fontWeight: '800', margin: 0 }}>
                Start With Something Special
              </h2>
            </div>

            <div 
              className="glass-card animate-slide-up products-featured-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '3.5rem',
                alignItems: 'center',
                backgroundColor: 'rgba(20, 10, 5, 0.55)',
                padding: '3rem',
                borderRadius: '30px',
                border: '1px solid rgba(245, 220, 180, 0.18)',
                boxShadow: '0 12px 40px rgba(56, 20, 35, 0.02)'
              }}
            >
              {/* Featured Image */}
              <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '20px', border: '1px solid var(--border-color)' }}>
                <img 
                  src={featuredProduct.image} 
                  alt={featuredProduct.title} 
                  style={{ width: '100%', height: '360px', objectFit: 'cover', display: 'block' }} 
                />
                <span 
                  style={{ 
                    position: 'absolute', 
                    top: '20px', 
                    left: '20px', 
                    fontSize: '0.7rem', 
                    fontWeight: '800', 
                    color: '#FFFFFF', 
                    backgroundColor: 'var(--accent-olive)', 
                    padding: '0.35rem 0.85rem', 
                    borderRadius: '999px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em'
                  }}
                >
                  Best Seller
                </span>
              </div>

              {/* Featured Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <h3 style={{ fontSize: '1.8rem', fontFamily: 'var(--font-serif)', color: 'var(--primary-dark)', fontWeight: '800', margin: 0 }}>
                  {featuredProduct.title}
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.02rem', lineHeight: '1.65', margin: 0, fontWeight: '500' }}>
                  {featuredProduct.description || featuredProduct.subtitle}
                </p>
                <div style={{ fontSize: '1.8rem', fontWeight: '900', color: 'var(--primary-dark)' }}>
                  ₹{featuredProduct.variants?.[0]?.price || 599}
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600', marginLeft: '0.45rem' }}>
                    for {featuredProduct.variants?.[0]?.weight || 'Trio Pack'}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                  <button 
                    onClick={handleAddFeaturedToCart}
                    className="btn-primary" 
                    style={{ padding: '0.9rem 2.25rem', fontSize: '0.9rem', backgroundColor: 'var(--primary-dark)', color: 'var(--bg-main)', border: 'none', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    <ShoppingBag size={15} />
                    <span>{featuredBtnText}</span>
                  </button>
                  <Link 
                    to={`/product/${featuredProduct.slug}`} 
                    className="btn-secondary" 
                    style={{ padding: '0.9rem 2.25rem', fontSize: '0.9rem', borderColor: 'var(--border-color)', color: 'var(--primary-dark)', borderRadius: '12px', fontWeight: '800', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    <Eye size={15} />
                    <span>View Details</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 4. MAIN PRODUCTS SECTION WITH CATEGORY FILTER */}
      <section id="products-grid-section" style={{ padding: '6rem 0', backgroundColor: 'rgba(20, 10, 5, 0.55)', borderTop: '1px solid rgba(245, 220, 180, 0.15)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', paddingLeft: '1.5rem', paddingRight: '1.5rem' }}>
          
          {/* Header & Product count */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '3.5rem' }}>
            <div>
              <h2 style={{ fontSize: '2.1rem', fontFamily: 'var(--font-serif)', color: 'var(--primary-dark)', fontWeight: '800', marginBottom: '0.35rem', margin: 0 }}>
                Explore Our Collection
              </h2>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {filteredProducts.length} handcrafted {filteredProducts.length === 1 ? 'bake' : 'bakes'} available
              </span>
            </div>

            {/* Horizontal Category selector */}
            <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem', width: '100%', maxWidth: 'none', flexWrap: 'wrap' }} className="mobile-scroll-container">
              {[
                { key: 'all', label: 'All Rituals' },
                { key: 'starter', label: 'Starter Favorites' },
                { key: 'daily', label: 'Daily Ritual Cookies' },
                { key: 'gifts', label: 'Gifting & Hampers' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveCategory(tab.key)}
                  style={{
                    padding: '0.55rem 1.25rem',
                    borderRadius: '999px',
                    fontWeight: '800',
                    fontSize: '0.82rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    cursor: 'pointer',
                    transition: 'all 0.25s',
                    backgroundColor: activeCategory === tab.key ? 'var(--primary-dark)' : '#FCFAF6',
                    color: activeCategory === tab.key ? '#FFFFFF' : 'var(--primary-dark)',
                    border: activeCategory === tab.key ? '1px solid var(--primary-dark)' : '1px solid var(--border-color)',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Grid Layout */}
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2.25rem' }}>
              {[1, 2, 3].map((i) => (
                <div key={i} className="glass-card" style={{ height: '420px', backgroundColor: '#FCFAF6', borderRadius: '24px', opacity: 0.6 }} />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div style={{ padding: '4rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-serif)', color: 'var(--primary-dark)', marginBottom: '0.5rem' }}>No bakes found in this ritual yet.</h3>
              <button onClick={() => setActiveCategory('all')} className="btn-primary" style={{ padding: '0.65rem 1.5rem', fontSize: '0.85rem' }}>
                Explore All Bakes
              </button>
            </div>
          ) : (
            <div
              className="products-main-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '2.5rem',
              }}
            >
              {filteredProducts.map((product) => (
                <ProductCard key={product._id || product.slug} product={product} />
              ))}
            </div>
          )}

        </div>
      </section>

      {/* 5. THE MILASTY TEA RITUAL SECTION (Dark Plum background card) */}
      <section style={{ backgroundColor: 'var(--primary-dark)', color: '#FFFFFF', padding: '6.5rem 0', borderTop: '1px solid rgba(245, 220, 180, 0.15)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', paddingLeft: '1.5rem', paddingRight: '1.5rem' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '4.5rem' }}>
            <Sparkles size={28} color="var(--accent-gold)" style={{ margin: '0 auto 1.25rem' }} />
            <h2 style={{ fontSize: '2.25rem', fontFamily: 'var(--font-serif)', color: '#FDFBF7', fontWeight: '800', marginBottom: '0.5rem', margin: 0 }}>
              The MILASTY Tea Ritual
            </h2>
            <p style={{ color: 'rgba(253,251,247,0.85)', maxWidth: '520px', margin: '0.5rem auto 0', fontSize: '0.98rem', fontWeight: '500' }}>
              Turn an everyday snack break into a moment of pause.
            </p>
          </div>

          <div
            className="products-ritual-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '2rem',
              textAlign: 'center',
            }}
          >
            <div className="glass-card" style={{ padding: '2rem 1.5rem', borderRadius: '20px' }}>
              <div style={{ fontSize: '1.5rem', color: 'var(--accent-gold)', fontWeight: '900', marginBottom: '0.75rem' }}>01 / PAUSE</div>
              <p style={{ fontSize: '0.86rem', color: 'rgba(255,255,255,0.7)', lineHeight: '1.65', margin: 0, fontWeight: '500' }}>Step away from screens and notifications for 5 minutes.</p>
            </div>
            <div className="glass-card" style={{ padding: '2rem 1.5rem', borderRadius: '20px' }}>
              <div style={{ fontSize: '1.5rem', color: 'var(--accent-gold)', fontWeight: '900', marginBottom: '0.75rem' }}>02 / NOTICE</div>
              <p style={{ fontSize: '0.86rem', color: 'rgba(255,255,255,0.7)', lineHeight: '1.65', margin: 0, fontWeight: '500' }}>Take in the rich aroma of slow-baked millets and pure cow Desi Ghee.</p>
            </div>
            <div className="glass-card" style={{ padding: '2rem 1.5rem', borderRadius: '20px' }}>
              <div style={{ fontSize: '1.5rem', color: 'var(--accent-gold)', fontWeight: '900', marginBottom: '0.75rem' }}>03 / BITE SLOWLY</div>
              <p style={{ fontSize: '0.86rem', color: 'rgba(255,255,255,0.7)', lineHeight: '1.65', margin: 0, fontWeight: '500' }}>Enjoy the wholesome crumble and honest texture of natural grains.</p>
            </div>
            <div className="glass-card" style={{ padding: '2rem 1.5rem', borderRadius: '20px' }}>
              <div style={{ fontSize: '1.5rem', color: 'var(--accent-gold)', fontWeight: '900', marginBottom: '0.75rem' }}>04 / PAIR & ENJOY</div>
              <p style={{ fontSize: '0.86rem', color: 'rgba(255,255,255,0.7)', lineHeight: '1.65', margin: 0, fontWeight: '500' }}>Pair with your favorite warm ginger tea, milk, or brew of choice.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FINAL BRAND CONVERSION CTA */}
      <section style={{ backgroundColor: 'rgba(20, 10, 5, 0.55)', padding: '6.5rem 0', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center', paddingLeft: '1.5rem', paddingRight: '1.5rem' }}>
          <h2 style={{ fontSize: '2.3rem', fontFamily: 'var(--font-serif)', color: 'var(--primary-dark)', fontWeight: '800', marginBottom: '1rem', letterSpacing: '-0.01em' }}>
            Make Your Everyday Snack A Little More Meaningful.
          </h2>
          <p style={{ fontSize: '1rem', color: 'var(--text-muted)', lineHeight: '1.65', marginBottom: '2.5rem', maxWidth: '540px', margin: '0.5rem auto 2.5rem', fontWeight: '500' }}>
            Discover handcrafted millet bakes made for mindful everyday moments and healthy guilt-free lifestyles.
          </p>
          <Link 
            to="/shop" 
            className="btn-primary" 
            style={{ padding: '0.95rem 2.25rem', fontSize: '0.9rem', backgroundColor: 'var(--primary-dark)', color: 'var(--bg-main)', border: 'none', borderRadius: '999px', textDecoration: 'none', fontWeight: '850', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <span>Shop All Bakes →</span>
          </Link>
        </div>
      </section>

      </div>
    </div>
  );
}
