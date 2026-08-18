import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, ChevronLeft, ChevronRight, ShoppingBag, Leaf, Sparkles, Shield, Award, Filter, ArrowUpDown } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import api from '../api/axios';
import { initialProducts } from '../data/seedData';

export default function Shop() {
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

  const activeCatName = categories.find(c => c.slug === selectedCategory)?.name || selectedCategory;
  const featuredStripProducts = products.slice(0, 3);

  return (
    <div
      className="shop-page"
      style={{
        minHeight: '100vh',
        padding: '0 0 5rem',
        width: '100%',
        maxWidth: '100%',
        overflowX: 'hidden',
        boxSizing: 'border-box',
        position: 'relative',
        backgroundImage: 'url(/images/shop_background_image.jpeg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(135deg, rgba(15, 8, 4, 0.40) 0%, rgba(28, 14, 9, 0.30) 100%)',
        zIndex: 0,
        pointerEvents: 'none',
      }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
      
      {/* 1. HERO SECTION */}
      <section 
        className="shop-hero"
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
              fontSize: '0.8rem', 
              textTransform: 'uppercase', 
              letterSpacing: '0.14em', 
              color: '#b9cd94', 
              fontWeight: '850',
              backgroundColor: 'rgba(36, 79, 33, 0.35)',
              padding: '0.4rem 0.95rem',
              borderRadius: '999px',
              border: '1.5px solid rgba(185, 205, 148, 0.4)'
            }}
          >
            Organic Millet Bakery
          </span>
          <h1 
            style={{ 
              fontSize: 'clamp(2.5rem, 5.5vw, 3.8rem)', 
              fontFamily: 'var(--font-serif)', 
              color: '#FFFDF9', 
              fontWeight: '850', 
              lineHeight: '1.15',
              letterSpacing: '-0.02em',
              margin: 0,
              textShadow: '0 2px 10px rgba(0,0,0,0.5)'
            }}
          >
            Explore Our<br />Handcrafted Bakes.
          </h1>
          <p 
            style={{ 
              fontSize: '1.15rem', 
              color: '#F5EBDD', 
              lineHeight: '1.75', 
              maxWidth: '540px',
              margin: '0.5rem 0 1.5rem',
              fontWeight: '550'
            }}
          >
            Slow-crafted with wholesome millets, pure Desi Ghee and thoughtful ingredients for everyday indulgence.
          </p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button 
              onClick={handleScrollToGrid}
              className="btn-primary" 
              style={{ padding: '0.9rem 2.25rem', fontSize: '0.92rem', backgroundColor: '#244f21', color: '#FFFFFF', border: 'none', borderRadius: '999px', fontWeight: '850', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}
            >
              <span>Explore Bestsellers</span>
              <ChevronRight size={16} />
            </button>
            <Link 
              to="/products" 
              className="btn-secondary" 
              style={{ padding: '0.9rem 2.25rem', fontSize: '0.92rem', borderColor: '#b9cd94', color: '#b9cd94', backgroundColor: 'rgba(36, 79, 33, 0.25)', borderRadius: '999px', fontWeight: '850', textDecoration: 'none' }}
            >
              <span>Discover Our Rituals</span>
            </Link>
          </div>
        </div>

        {/* Hero image */}
        <div style={{ position: 'relative' }}>
          <div 
            style={{ 
              position: 'relative', 
              overflow: 'hidden', 
              borderRadius: '24px', 
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}
          >
            <img
              src="https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=800&q=80"
              alt="Millet bakery cookies pile"
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

      {/* 3. MAIN SHOP LISTINGS SECTION WITH SEARCH & FILTER */}
      <section id="shop-listings-section" style={{ padding: '6rem 0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', paddingLeft: '1.5rem', paddingRight: '1.5rem' }}>
          
          {/* Redesigned Compact Premium Filter Toolbar */}
          <div 
            className="filter-toolbar"
            style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              gap: '1.5rem', 
              marginBottom: '1rem', 
              flexWrap: 'wrap',
              backgroundColor: 'rgba(35, 21, 13, 0.70)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              padding: '1.25rem 2rem',
              borderRadius: '24px',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              boxShadow: '0 12px 36px rgba(0,0,0,0.35)'
            }}
          >
            {/* Search Input Left with Icon */}
            <div style={{ position: 'relative', width: '100%', maxWidth: '440px' }}>
              <Search size={16} color="#b9cd94" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search bakes, ingredients, or rituals..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem 0.75rem 2.5rem',
                  borderRadius: '14px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  fontSize: '0.88rem',
                  outline: 'none',
                  fontFamily: 'inherit',
                  backgroundColor: 'rgba(20, 10, 5, 0.65)',
                  color: '#FFFDF9',
                  transition: 'border-color 0.2s',
                }}
              />
            </div>

            {/* Dropdown Filters Right with Icons */}
            <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end', flexGrow: 1 }}>
              
              {/* Category selector */}
              <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                <Filter size={14} color="#b9cd94" style={{ position: 'absolute', left: '14px', pointerEvents: 'none' }} />
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setPage(1);
                  }}
                  style={{
                    padding: '0.7rem 1rem 0.7rem 2.2rem',
                    borderRadius: '14px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    fontSize: '0.82rem',
                    color: '#FFFDF9',
                    fontWeight: '800',
                    backgroundColor: 'rgba(20, 10, 5, 0.65)',
                    outline: 'none',
                    cursor: 'pointer',
                    minWidth: '160px',
                    appearance: 'none',
                    WebkitAppearance: 'none'
                  }}
                >
                  <option value="all">Category: All</option>
                  {categories.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <span style={{ position: 'absolute', right: '14px', pointerEvents: 'none', fontSize: '0.6rem', color: '#b9cd94' }}>▼</span>
              </div>

              {/* Sort selector */}
              <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                <ArrowUpDown size={14} color="#b9cd94" style={{ position: 'absolute', left: '14px', pointerEvents: 'none' }} />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{
                    padding: '0.7rem 1rem 0.7rem 2.2rem',
                    borderRadius: '14px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    fontSize: '0.82rem',
                    color: '#FFFDF9',
                    fontWeight: '800',
                    backgroundColor: 'rgba(20, 10, 5, 0.65)',
                    outline: 'none',
                    cursor: 'pointer',
                    minWidth: '180px',
                    appearance: 'none',
                    WebkitAppearance: 'none'
                  }}
                >
                  <option value="newest">Sort: Newest First</option>
                  <option value="price_low_high">Price: Low to High</option>
                  <option value="price_high_low">Price: High to Low</option>
                  <option value="popular">Most Popular</option>
                  <option value="discount">Highest Discount</option>
                </select>
                <span style={{ position: 'absolute', right: '14px', pointerEvents: 'none', fontSize: '0.6rem', color: '#b9cd94' }}>▼</span>
              </div>
            </div>
          </div>

          {/* Category Removable Chip & Dynamic Count Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '2.5rem', minHeight: '32px' }}>
            <div>
              {selectedCategory !== 'all' && (
                <button 
                  onClick={() => setSelectedCategory('all')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontSize: '0.76rem',
                    fontWeight: '850',
                    backgroundColor: 'rgba(36, 79, 33, 0.35)',
                    color: '#b9cd94',
                    padding: '0.35rem 0.85rem',
                    borderRadius: '999px',
                    cursor: 'pointer',
                    border: '1px solid rgba(185, 205, 148, 0.4)',
                    transition: 'all 0.2s',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em'
                  }}
                >
                  ✕ {activeCatName}
                </button>
              )}
            </div>
            
            <span style={{ fontSize: '0.85rem', color: '#F5EBDD', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Showing {products.length} handcrafted {products.length === 1 ? 'bake' : 'bakes'}
            </span>
          </div>

          {/* Grid View */}
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '2.5rem' }}>
              {[1, 2, 3].map((i) => (
                <div key={i} className="glass-card" style={{ height: '440px', borderRadius: '24px', opacity: 0.6 }} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="glass-card" style={{ padding: '5rem 2rem', textAlign: 'center', borderRadius: '24px' }}>
              <ShoppingBag size={48} color="#b9cd94" style={{ margin: '0 auto 1.25rem' }} />
              <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-serif)', color: '#FFFDF9', marginBottom: '0.5rem', margin: 0 }}>No bakes found</h3>
              <p style={{ color: '#F5EBDD', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Try another search query or explore all our handcrafted products.</p>
              <button
                onClick={() => {
                  setSearch('');
                  setSelectedCategory('all');
                  setSortBy('newest');
                }}
                className="btn-primary"
                style={{ padding: '0.75rem 2.25rem', borderRadius: '999px', border: 'none', backgroundColor: '#244f21', color: '#FFFFFF', cursor: 'pointer', fontWeight: '850' }}
              >
                View All Products
              </button>
            </div>
          ) : (
            <div
              className="shop-main-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: '2.5rem',
              }}
            >
              {products.map((product) => (
                <ProductCard key={product._id || product.slug} product={product} />
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {!loading && totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem', marginTop: '4rem' }}>
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="btn-secondary"
                style={{ padding: '0.6rem 1.25rem', borderColor: 'rgba(255,255,255,0.2)', color: '#FFFDF9', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: '850', opacity: page === 1 ? 0.5 : 1, cursor: page === 1 ? 'default' : 'pointer' }}
              >
                <ChevronLeft size={16} />
                <span>Previous</span>
              </button>
              <span style={{ fontSize: '0.88rem', color: '#FFFDF9', fontWeight: '850' }}>
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="btn-secondary"
                style={{ padding: '0.6rem 1.25rem', borderColor: 'rgba(255,255,255,0.2)', color: '#FFFDF9', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: '850', opacity: page === totalPages ? 0.5 : 1, cursor: page === totalPages ? 'default' : 'pointer' }}
              >
                <span>Next</span>
                <ChevronRight size={16} />
              </button>
            </div>
          )}

        </div>
      </section>

      {/* 4. SHOP TRUST SECTION STRIP (Benefit Text + Icon, non-button layout) */}
      <section style={{ backgroundColor: 'transparent', padding: '3.5rem 0', borderTop: '1px solid rgba(245, 220, 180, 0.15)', borderBottom: '1px solid rgba(245, 220, 180, 0.15)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', paddingLeft: '1.5rem', paddingRight: '1.5rem', display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', color: '#FFFDF9', fontWeight: '850', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            <Leaf size={18} color="#b9cd94" />
            <span>Pure Desi Ghee</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', color: '#FFFDF9', fontWeight: '850', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            <Sparkles size={18} color="#b9cd94" />
            <span>Wholesome Millets</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', color: '#FFFDF9', fontWeight: '850', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            <Shield size={18} color="#b9cd94" />
            <span>Thoughtful Ingredients</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', color: '#FFFDF9', fontWeight: '850', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            <Award size={18} color="#b9cd94" />
            <span>Handcrafted Baking</span>
          </div>
        </div>
      </section>

      {/* 5. FINAL SHOP CTA */}
      <section style={{ backgroundColor: 'transparent', padding: '6.5rem 0' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center', paddingLeft: '1.5rem', paddingRight: '1.5rem' }}>
          <h2 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-serif)', color: '#FFFDF9', fontWeight: '850', marginBottom: '1rem', letterSpacing: '-0.01em', textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
            Your Next Ritual Starts With A Bite.
          </h2>
          <p style={{ fontSize: '1.02rem', color: '#F5EBDD', lineHeight: '1.7', marginBottom: '2.5rem', maxWidth: '520px', margin: '0.5rem auto 2.5rem', fontWeight: '550' }}>
            Find a bake that makes your everyday pause a little more special and nourishing.
          </p>
          <button 
            onClick={handleScrollToGrid}
            className="btn-primary" 
            style={{ padding: '0.95rem 2.25rem', fontSize: '0.92rem', backgroundColor: '#244f21', color: '#FFFFFF', border: 'none', borderRadius: '999px', fontWeight: '850', cursor: 'pointer' }}
          >
            Explore All Bakes
          </button>
        </div>
      </section>

      </div>
    </div>
  );
}
