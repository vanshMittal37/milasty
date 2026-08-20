import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, ChevronRight, ShoppingBag, Leaf, Sparkles, 
  Shield, Award, ArrowUpDown 
} from 'lucide-react';
import ProductCard from '../components/ProductCard';
import api from '../api/axios';
import { initialProducts } from '../data/seedData';
import { useCart } from '../context/CartContext';

export default function Shop() {
  const { addToCart } = useCart();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & State
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [search, selectedCategory, sortBy, page]);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      if (res.data) setCategories(res.data);
    } catch (e) {
      setCategories([
        { name: 'Starter Favorites', slug: 'starter' },
        { name: 'Daily Ritual Cookies', slug: 'daily' },
        { name: 'Gifting Hampers', slug: 'gifts' },
      ]);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (selectedCategory && selectedCategory !== 'all') params.append('category', selectedCategory);
      if (sortBy) params.append('sort', sortBy);
      params.append('page', page);
      params.append('limit', 12);

      const res = await api.get(`/products?${params.toString()}`);
      if (res.data && res.data.products) {
        setProducts(res.data.products);
        setTotalPages(res.data.pages || 1);
      }
    } catch (err) {
      // Fallback
      let filtered = [...initialProducts];
      if (selectedCategory !== 'all') filtered = filtered.filter((p) => p.category === selectedCategory);
      if (search) filtered = filtered.filter((p) => p.title.toLowerCase().includes(search.toLowerCase()));
      setProducts(filtered);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const handleScrollToGrid = () => {
    const el = document.getElementById('shop-listings-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Find featured product (starter box or first item)
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

  return (
    <div
      className="shop-page products-page"
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
        className="products-hero-section"
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', 
          gap: '3.5rem', 
          alignItems: 'center', 
          padding: '4.5rem 1.5rem 5.5rem',
          maxWidth: '1200px',
          margin: '0 auto',
          boxSizing: 'border-box'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', minWidth: 0 }}>
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
              fontSize: 'clamp(2.2rem, 5.5vw, 3.8rem)', 
              fontFamily: 'var(--font-serif)', 
              color: 'var(--primary-dark)', 
              fontWeight: '800', 
              lineHeight: '1.15',
              letterSpacing: '-0.02em',
              margin: 0
            }}
          >
            Discover Your Daily MILASTY Ritual.
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
            <button 
              onClick={handleScrollToGrid}
              className="btn-primary" 
              style={{ padding: '0.9rem 2.25rem', fontSize: '0.92rem', backgroundColor: 'var(--primary-dark)', color: 'var(--bg-main)', border: 'none', borderRadius: '999px', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}
            >
              <span>Shop All Bakes</span>
              <ChevronRight size={16} />
            </button>
            <button 
              onClick={handleScrollToGrid}
              className="btn-secondary" 
              style={{ padding: '0.9rem 2.25rem', fontSize: '0.92rem', borderColor: 'var(--primary-dark)', color: 'var(--primary-dark)', borderRadius: '999px', fontWeight: '800', cursor: 'pointer', backgroundColor: 'transparent' }}
            >
              Explore Collection
            </button>
          </div>
        </div>

        {/* Hero image with rounded corners */}
        <div style={{ position: 'relative', minWidth: 0 }}>
          <div 
            className="products-hero-image-wrap"
            style={{ 
              position: 'relative', 
              overflow: 'hidden', 
              borderRadius: '24px', 
              boxShadow: '0 20px 40px rgba(56,20,35,0.06)',
              border: '1px solid rgba(245, 220, 180, 0.18)'
            }}
          >
            <img
              src="/images/image3.jpeg"
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

      {/* 2. TRUST STRIP */}
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

      {/* 4. MAIN PRODUCTS & FILTERS SECTION */}
      <section id="shop-listings-section" style={{ padding: '6rem 0', backgroundColor: 'rgba(20, 10, 5, 0.55)', borderTop: '1px solid rgba(245, 220, 180, 0.15)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', paddingLeft: '1.5rem', paddingRight: '1.5rem', boxSizing: 'border-box' }}>
          
          {/* Section Heading */}
          <div style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '2.1rem', fontFamily: 'var(--font-serif)', color: 'var(--primary-dark)', fontWeight: '800', marginBottom: '0.35rem', margin: 0 }}>
              Explore Our Collection
            </h2>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {products.length} handcrafted {products.length === 1 ? 'bake' : 'bakes'} available
            </span>
          </div>

          {/* Search, Category Filter & Sort Controls Toolbar */}
          <div 
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '1.25rem', 
              marginBottom: '3rem',
              backgroundColor: 'rgba(20, 10, 5, 0.4)',
              padding: '1.5rem',
              borderRadius: '20px',
              border: '1px solid rgba(245, 220, 180, 0.15)',
              boxSizing: 'border-box'
            }}
          >
            {/* Search Bar & Sort Dropdown Row */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', width: '100%', alignItems: 'center', justifyContent: 'space-between' }}>
              {/* Search Bar */}
              <div style={{ position: 'relative', flex: '1 1 280px', minWidth: 0 }}>
                <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--accent-gold)' }} />
                <input
                  type="text"
                  placeholder="Search millet cookies, hampers, crackers..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem 0.75rem 2.8rem',
                    borderRadius: '999px',
                    backgroundColor: 'rgba(20, 10, 5, 0.65)',
                    border: '1px solid rgba(197, 160, 89, 0.3)',
                    color: 'var(--primary-dark)',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Sort selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                <ArrowUpDown size={16} color="var(--accent-gold)" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{
                    padding: '0.7rem 1.25rem',
                    borderRadius: '999px',
                    backgroundColor: 'rgba(20, 10, 5, 0.65)',
                    border: '1px solid rgba(197, 160, 89, 0.3)',
                    color: 'var(--primary-dark)',
                    fontSize: '0.85rem',
                    fontWeight: '700',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="newest" style={{ backgroundColor: '#241209', color: '#FFF' }}>Newest First</option>
                  <option value="price_asc" style={{ backgroundColor: '#241209', color: '#FFF' }}>Price: Low to High</option>
                  <option value="price_desc" style={{ backgroundColor: '#241209', color: '#FFF' }}>Price: High to Low</option>
                  <option value="popular" style={{ backgroundColor: '#241209', color: '#FFF' }}>Most Popular</option>
                </select>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div style={{ display: 'flex', gap: '0.65rem', overflowX: 'auto', paddingBottom: '0.25rem', width: '100%', flexWrap: 'wrap' }} className="mobile-scroll-container">
              <button
                onClick={() => { setSelectedCategory('all'); setPage(1); }}
                style={{
                  padding: '0.55rem 1.25rem',
                  borderRadius: '999px',
                  fontWeight: '800',
                  fontSize: '0.8rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                  backgroundColor: selectedCategory === 'all' ? '#244f21' : 'rgba(36, 79, 33, 0.12)',
                  color: selectedCategory === 'all' ? '#FFFFFF' : '#b9cd94',
                  border: selectedCategory === 'all' ? '1.5px solid #244f21' : '1.5px solid rgba(185, 205, 148, 0.35)',
                  boxShadow: selectedCategory === 'all' ? '0 4px 14px rgba(36, 79, 33, 0.35)' : 'none',
                }}
              >
                All Bakes
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.slug || cat._id}
                  onClick={() => { setSelectedCategory(cat.slug || cat.name); setPage(1); }}
                  style={{
                    padding: '0.55rem 1.25rem',
                    borderRadius: '999px',
                    fontWeight: '800',
                    fontSize: '0.8rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    cursor: 'pointer',
                    transition: 'all 0.25s ease',
                    backgroundColor: selectedCategory === (cat.slug || cat.name) ? '#244f21' : 'rgba(36, 79, 33, 0.12)',
                    color: selectedCategory === (cat.slug || cat.name) ? '#FFFFFF' : '#b9cd94',
                    border: selectedCategory === (cat.slug || cat.name) ? '1.5px solid #244f21' : '1.5px solid rgba(185, 205, 148, 0.35)',
                    boxShadow: selectedCategory === (cat.slug || cat.name) ? '0 4px 14px rgba(36, 79, 33, 0.35)' : 'none',
                  }}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 260px), 1fr))', gap: '2.25rem' }}>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="glass-card" style={{ height: '420px', backgroundColor: 'rgba(20,10,5,0.4)', borderRadius: '24px', opacity: 0.6 }} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div style={{ padding: '4rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-serif)', color: 'var(--primary-dark)', marginBottom: '0.5rem' }}>No bakes found matching your search.</h3>
              <button onClick={() => { setSearch(''); setSelectedCategory('all'); }} className="btn-primary" style={{ padding: '0.65rem 1.5rem', fontSize: '0.85rem', marginTop: '1rem' }}>
                Reset Filters
              </button>
            </div>
          ) : (
            <div
              className="products-main-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 260px), 1fr))',
                gap: '2.5rem',
              }}
            >
              {products.map((product) => (
                <ProductCard key={product._id || product.slug} product={product} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '3.5rem', alignItems: 'center' }}>
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '999px',
                  backgroundColor: 'rgba(20, 10, 5, 0.65)',
                  border: '1px solid rgba(197, 160, 89, 0.3)',
                  color: 'var(--primary-dark)',
                  cursor: page === 1 ? 'not-allowed' : 'pointer',
                  opacity: page === 1 ? 0.5 : 1,
                  fontWeight: '700',
                  fontSize: '0.85rem'
                }}
              >
                Previous
              </button>
              <span style={{ fontSize: '0.9rem', color: 'var(--primary-dark)', fontWeight: '700', padding: '0 0.75rem' }}>
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '999px',
                  backgroundColor: 'rgba(20, 10, 5, 0.65)',
                  border: '1px solid rgba(197, 160, 89, 0.3)',
                  color: 'var(--primary-dark)',
                  cursor: page === totalPages ? 'not-allowed' : 'pointer',
                  opacity: page === totalPages ? 0.5 : 1,
                  fontWeight: '700',
                  fontSize: '0.85rem'
                }}
              >
                Next
              </button>
            </div>
          )}

        </div>
      </section>

      {/* 5. THE MILASTY TEA RITUAL SECTION */}
      <section style={{ backgroundColor: 'var(--primary-dark)', color: '#FFFFFF', padding: '6.5rem 0', borderTop: '1px solid rgba(245, 220, 180, 0.15)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', paddingLeft: '1.5rem', paddingRight: '1.5rem', boxSizing: 'border-box' }}>
          
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
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
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
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center', paddingLeft: '1.5rem', paddingRight: '1.5rem', boxSizing: 'border-box' }}>
          <h2 style={{ fontSize: '2.3rem', fontFamily: 'var(--font-serif)', color: 'var(--primary-dark)', fontWeight: '800', marginBottom: '1rem', letterSpacing: '-0.01em' }}>
            Make Your Everyday Snack A Little More Meaningful.
          </h2>
          <p style={{ fontSize: '1rem', color: 'var(--text-muted)', lineHeight: '1.65', marginBottom: '2.5rem', maxWidth: '540px', margin: '0.5rem auto 2.5rem', fontWeight: '500' }}>
            Discover handcrafted millet bakes made for mindful everyday moments and healthy guilt-free lifestyles.
          </p>
          <button 
            onClick={handleScrollToGrid}
            className="btn-primary" 
            style={{ padding: '0.95rem 2.25rem', fontSize: '0.9rem', backgroundColor: 'var(--primary-dark)', color: 'var(--bg-main)', border: 'none', borderRadius: '999px', textDecoration: 'none', fontWeight: '850', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}
          >
            <span>Explore All Bakes →</span>
          </button>
        </div>
      </section>

      </div>
    </div>
  );
}
