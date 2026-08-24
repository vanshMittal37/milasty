import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, ChevronRight, ShoppingBag, Leaf, Sparkles, 
  Shield, Award, ArrowRight, Star, ChevronLeft, HelpCircle, Check, Filter
} from 'lucide-react';
import ProductCard from '../components/ProductCard';
import api from '../api/axios';
import { initialProducts } from '../data/seedData';
import { useCart } from '../context/CartContext';

export default function Shop() {
  const { addToCart } = useCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search state
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [catSearch, setCatSearch] = useState('');
  const [filterModalOpen, setFilterModalOpen] = useState(false);

  // Recommendation Engine State
  const [recStep, setRecStep] = useState(1);
  const [recAnswers, setRecAnswers] = useState({ lookingFor: '', preference: '' });
  const [recResult, setRecResult] = useState(null);

  // Reviews Carousel State
  const [reviewIndex, setReviewIndex] = useState(0);

  // Mobile detection
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/products?limit=50');
      if (res.data && res.data.products && res.data.products.length > 0) {
        setProducts(res.data.products);
      } else {
        setProducts(initialProducts);
      }
    } catch (err) {
      setProducts(initialProducts);
    } finally {
      setLoading(false);
    }
  };

  // Categories definition (Data-driven)
  const categoryList = [
    { id: 'all', name: 'ALL BAKES', label: 'All Bakes' },
    { id: 'starter', name: 'STARTER FAVOURITES', label: 'Starter Favourites', count: 'Curated Boxes' },
    { id: 'daily', name: 'DAILY RITUAL', label: 'Daily Ritual', count: 'Everyday Cookies' },
    { id: 'gifts', name: 'GIFTING HAMPERS', label: 'Gifting Hampers', count: 'Celebration Gifts' },
  ];

  // Filtering products for Featured section & Category filtering
  const featuredProducts = products.filter(p => p.isFeatured || p.category === 'starter');
  
  const displayedProducts = products.filter(p => {
    const matchesCat = selectedCategory === 'all' || 
                       p.category === selectedCategory || 
                       (selectedCategory === 'gifts' && (p.category === 'gifting' || p.title.toLowerCase().includes('hamper') || p.title.toLowerCase().includes('box')));
    const matchesSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Dummy Reviews Data
  const dummyReviews = [
    {
      id: 1,
      name: "Ananya Sharma",
      role: "Verified Customer",
      rating: 5,
      comment: "Loved the texture and flavour of Cardamom Bajra! It feels like a much better option for my evening tea snack without any sugar spikes.",
      product: "Cardamom Bajra Cookies"
    },
    {
      id: 2,
      name: "Rohan Verma",
      role: "Verified Customer",
      rating: 5,
      comment: "The Signature Trio Box was the perfect starter hamper. Desi ghee aroma is so authentic, reminding me of homemade Nankhatai.",
      product: "Signature Trio Box"
    },
    {
      id: 3,
      name: "Priya Nair",
      role: "Verified Customer",
      rating: 5,
      comment: "My kids absolutely adore Cocoa Ragi cookies! Great way to feed calcium and iron rich finger millet without complaining.",
      product: "Cocoa Ragi Cookies"
    },
    {
      id: 4,
      name: "Vikramaditya Rao",
      role: "Verified Customer",
      rating: 5,
      comment: "Ordered the Imperial Wedding Hamper for corporate gifting. Pristine packaging and wholesome taste! Everyone loved it.",
      product: "Imperial Wedding Hamper"
    },
    {
      id: 5,
      name: "Meera Sengupta",
      role: "Verified Customer",
      rating: 5,
      comment: "Light, crispy, and gentle on the gut. Coconut Jowar cookies pair so wonderfully with warm ginger tea.",
      product: "Coconut Jowar Cookies"
    }
  ];

  // Recommendation Engine Logic
  const handleRecAnswer = (key, value) => {
    const newAnswers = { ...recAnswers, [key]: value };
    setRecAnswers(newAnswers);

    if (key === 'lookingFor') {
      setRecStep(2);
    } else if (key === 'preference') {
      // Determine match
      let match = products[0];
      if (newAnswers.lookingFor === 'Gifting') {
        match = products.find(p => p.category === 'gifts' || p.title.toLowerCase().includes('hamper')) || products[0];
      } else if (value === 'Rich & Indulgent') {
        match = products.find(p => p.slug.includes('ragi') || p.slug.includes('trio')) || products[0];
      } else if (value === 'Less Sweet') {
        match = products.find(p => p.slug.includes('bajra')) || products[1] || products[0];
      } else {
        match = products.find(p => p.slug.includes('jowar')) || products[2] || products[0];
      }
      setRecResult(match);
      setRecStep(3);
    }
  };

  const resetRec = () => {
    setRecStep(1);
    setRecAnswers({ lookingFor: '', preference: '' });
    setRecResult(null);
  };

  const handleScrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div
      className="shop-page products-page"
      style={{
        minHeight: '100vh',
        padding: '0 0 0rem',
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
      {/* Dark overlay matching MILASTY Shop theme */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(135deg, rgba(20, 10, 5, 0.35) 0%, rgba(36, 19, 13, 0.25) 100%)',
        zIndex: 0,
        pointerEvents: 'none',
      }} />
      <div style={{ position: 'relative', zIndex: 1 }}>

      {/* ================================================================== */}
      {/* 3. FEATURED PRODUCTS (Strict 2x2 Grid on Mobile) */}
      {/* ================================================================== */}
      <section 
        id="featured-bakes-section" 
        style={{ padding: isMobile ? '3.5rem 1rem' : '5.5rem 1.5rem', maxWidth: '1200px', margin: '0 auto', boxSizing: 'border-box' }}
      >
        <div style={{ textAlign: 'center', maxWidth: '750px', margin: isMobile ? '0 auto 2.25rem' : '0 auto 3.5rem' }}>
          <span style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--accent-gold)', fontWeight: '850', display: 'block', marginBottom: '0.5rem' }}>
            FEATURED BAKES
          </span>
          <h2 style={{ fontSize: isMobile ? '2.4rem' : '3.3rem', fontFamily: 'var(--font-serif)', color: '#FFFDF9', fontWeight: '850', margin: 0, lineHeight: '1.2' }}>
            Discover Our <span style={{ color: '#b9cd94', fontSize: '1.05em' }}>Favourites</span>
          </h2>
          <p style={{ fontSize: isMobile ? '0.95rem' : '1.12rem', color: '#F5EBDD', margin: '0.6rem 0 0', fontWeight: '500' }}>
            A few of the MILASTY favourites worth trying first.
          </p>
        </div>

        {/* Circular Featured Products Showcase: 4 Columns on Desktop | 2x2 Grid on Mobile */}
        <div 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', 
            gap: isMobile ? '1.5rem 1rem' : '2.5rem 1.5rem',
            alignItems: 'start',
            justifyItems: 'center',
            maxWidth: '1050px',
            margin: '0 auto'
          }}
        >
          {featuredProducts.slice(0, 4).map((product) => (
            <Link
              key={product._id || product.slug}
              to={`/product/${product.slug}`}
              style={{
                textDecoration: 'none',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                width: '100%',
                maxWidth: isMobile ? '150px' : '220px',
                cursor: 'pointer',
                transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
              onMouseOver={(e) => {
                const circle = e.currentTarget.querySelector('.featured-circle-wrap');
                const title = e.currentTarget.querySelector('.featured-circle-title');
                if (circle) {
                  circle.style.transform = 'scale(1.06)';
                  circle.style.borderColor = '#b9cd94';
                  circle.style.boxShadow = '0 12px 28px rgba(36, 79, 33, 0.45)';
                }
                if (title) title.style.color = 'var(--accent-gold)';
              }}
              onMouseOut={(e) => {
                const circle = e.currentTarget.querySelector('.featured-circle-wrap');
                const title = e.currentTarget.querySelector('.featured-circle-title');
                if (circle) {
                  circle.style.transform = 'scale(1)';
                  circle.style.borderColor = 'rgba(185, 205, 148, 0.45)';
                  circle.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.35)';
                }
                if (title) title.style.color = '#FFFDF9';
              }}
            >
              {/* Circular Product Image Wrap */}
              <div
                className="featured-circle-wrap"
                style={{
                  width: isMobile ? '135px' : '200px',
                  height: isMobile ? '135px' : '200px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  position: 'relative',
                  border: '2px solid rgba(185, 205, 148, 0.45)',
                  backgroundColor: 'rgba(35, 21, 13, 0.75)',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  marginBottom: '0.9rem',
                  boxSizing: 'border-box'
                }}
              >
                <img
                  src={product.image}
                  alt={product.title}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block'
                  }}
                />
              </div>

              {/* Product Name Centered Below Circle */}
              <h3
                className="featured-circle-title"
                style={{
                  fontSize: isMobile ? '0.88rem' : '1.05rem',
                  color: '#FFFDF9',
                  fontFamily: 'var(--font-serif)',
                  fontWeight: '800',
                  lineHeight: '1.3',
                  margin: 0,
                  transition: 'color 0.25s ease',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  wordBreak: 'break-word',
                  maxWidth: '100%'
                }}
              >
                {product.title}
              </h3>
            </Link>
          ))}
        </div>
      </section>

      {/* ================================================================== */}
      {/* 4. CATEGORIES SECTION (Dedicated Filter & Search Product Cards Grid) */}
      {/* ================================================================== */}
      <section 
        id="shop-categories-section"
        style={{ 
          padding: isMobile ? '3.5rem 1rem' : '5.5rem 1.5rem', 
          backgroundColor: 'rgba(20, 10, 5, 0.45)', 
          borderTop: '1px solid rgba(255, 255, 255, 0.12)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.12)' 
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto', boxSizing: 'border-box' }}>
          <div style={{ textAlign: 'center', maxWidth: '750px', margin: isMobile ? '0 auto 1.75rem' : '0 auto 3rem' }}>
            <span style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--accent-gold)', fontWeight: '850', display: 'block', marginBottom: '0.5rem' }}>
              EXPLORE BY CATEGORY & SEARCH
            </span>
            <h2 style={{ fontSize: isMobile ? '2.4rem' : '3.3rem', fontFamily: 'var(--font-serif)', color: '#FFFDF9', fontWeight: '850', margin: '0 0 0.5rem', lineHeight: '1.2' }}>
              Browse <span style={{ color: '#b9cd94', fontSize: '1.05em' }}>MILASTY Collection</span>
            </h2>
            <p style={{ fontSize: isMobile ? '0.95rem' : '1.12rem', color: '#F5EBDD', margin: 0, fontWeight: '500' }}>
              Showing {displayedProducts.length} bakes {selectedCategory !== 'all' ? `in ${categoryList.find(c => c.id === selectedCategory)?.label || selectedCategory}` : ''}
            </p>
          </div>

          {/* Search Bar & Category Filter Popup Trigger */}
          <div 
            style={{ 
              display: 'flex', 
              gap: isMobile ? '0.5rem' : '0.75rem', 
              maxWidth: '620px', 
              margin: isMobile ? '0 auto 1.75rem' : '0 auto 2.5rem', 
              alignItems: 'center',
              width: '100%',
              boxSizing: 'border-box' 
            }}
          >
            <div style={{ position: 'relative', flexGrow: 1 }}>
              <Search className="shop-search-icon" size={isMobile ? 16 : 18} />
              <input 
                type="text"
                className="shop-search-input"
                placeholder={isMobile ? "Search bakes..." : "Search cookies, ingredients, hampers..."}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  style={{
                    position: 'absolute',
                    right: isMobile ? '10px' : '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: 'rgba(255, 255, 255, 0.65)',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    padding: '0.2rem 0.4rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 3
                  }}
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
            
            <button
              onClick={() => setFilterModalOpen(true)}
              style={{
                padding: isMobile ? '0.6rem 1rem' : '0.85rem 1.35rem',
                borderRadius: '999px',
                backgroundColor: 'rgba(36, 79, 33, 0.85)',
                border: '1.5px solid #b9cd94',
                color: '#FFFDF9',
                fontWeight: '850',
                fontSize: isMobile ? '0.82rem' : '0.88rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: isMobile ? '0.35rem' : '0.45rem',
                flexShrink: 0,
                boxShadow: '0 4px 14px rgba(36, 79, 33, 0.4)'
              }}
            >
              <Filter size={isMobile ? 15 : 17} color="var(--accent-gold)" />
              <span>Filter</span>
            </button>
          </div>

          {/* Product Cards for Categories Section */}
          <div className="favorites-grid fitted-cards-container-4">
            {displayedProducts.length > 0 ? (
              displayedProducts.map((product) => (
                <ProductCard key={product._id || product.slug} product={product} />
              ))
            ) : (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem 1.5rem', color: '#F5EBDD', backgroundColor: 'rgba(35, 21, 13, 0.5)', borderRadius: '24px' }}>
                <p style={{ fontSize: '1.1rem', fontWeight: '600' }}>No bakes found matching your filter criteria.</p>
                <button 
                  onClick={() => { setSearch(''); setSelectedCategory('all'); }} 
                  className="btn-primary" 
                  style={{ marginTop: '1rem', padding: '0.65rem 1.5rem', backgroundColor: '#c89b3c', color: '#FFF', borderRadius: '999px', border: 'none' }}
                >
                  Reset All Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* FILTER POPUP MODAL */}
      {filterModalOpen && (
        <div 
          style={{ 
            position: 'fixed', 
            inset: 0, 
            backgroundColor: 'rgba(0, 0, 0, 0.75)', 
            backdropFilter: 'blur(8px)', 
            WebkitBackdropFilter: 'blur(8px)', 
            zIndex: 100, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            padding: '1.5rem' 
          }}
          onClick={() => setFilterModalOpen(false)}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{ 
              backgroundColor: 'rgba(35, 21, 13, 0.95)', 
              borderRadius: '24px', 
              border: '1.5px solid var(--accent-gold)', 
              padding: '2rem 1.75rem', 
              maxWidth: '420px', 
              width: '100%', 
              color: '#FFFDF9',
              boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
              position: 'relative'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.15)', paddingBottom: '0.85rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-serif)', margin: 0, fontWeight: '800', color: 'var(--accent-gold)' }}>Filter Categories</h3>
              <button 
                onClick={() => setFilterModalOpen(false)}
                style={{ backgroundColor: 'transparent', border: 'none', color: '#FFFDF9', cursor: 'pointer', padding: '0.25rem' }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.8)', marginBottom: '1.25rem', fontWeight: '500' }}>
              Select a category filter to explore bakes:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
              {categoryList.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategory(cat.id);
                      setFilterModalOpen(false);
                      handleScrollToSection('shop-categories-section');
                    }}
                    style={{
                      padding: '0.85rem 1.25rem',
                      borderRadius: '16px',
                      backgroundColor: isSelected ? '#244f21' : 'rgba(20, 10, 5, 0.60)',
                      border: isSelected ? '1.5px solid #b9cd94' : '1px solid rgba(255, 255, 255, 0.2)',
                      color: isSelected ? '#FFFDF9' : 'rgba(255, 255, 255, 0.85)',
                      fontWeight: '800',
                      fontSize: '0.9rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'all 0.25s ease'
                    }}
                  >
                    <span>{cat.label}</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--accent-gold)', fontWeight: '700' }}>{cat.count || 'All'}</span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => {
                setSelectedCategory('all');
                setSearch('');
                setFilterModalOpen(false);
              }}
              style={{
                width: '100%',
                padding: '0.8rem',
                borderRadius: '999px',
                backgroundColor: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                color: 'rgba(255,255,255,0.75)',
                fontWeight: '700',
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              Reset All Filters
            </button>
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* 5. RECOMMENDATION ENGINE (Interactive Bake Finder) */}
      {/* ================================================================== */}
      <section 
        style={{ padding: isMobile ? '3.5rem 1rem' : '5.5rem 1.5rem', maxWidth: '850px', margin: '0 auto', boxSizing: 'border-box' }}
      >
        <div 
          className="glass-card"
          style={{ 
            padding: isMobile ? '2rem 1.25rem' : '3.5rem 3rem', 
            borderRadius: '24px', 
            backgroundColor: 'rgba(35, 21, 13, 0.75)',
            border: '1.5px solid var(--accent-gold)',
            boxShadow: '0 16px 40px rgba(0, 0, 0, 0.45)',
            textAlign: 'center'
          }}
        >
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-gold)', fontWeight: '850', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.75rem' }}>
            <HelpCircle size={16} />
            <span>NOT SURE WHAT TO CHOOSE?</span>
          </div>

          <h2 style={{ fontSize: isMobile ? '1.8rem' : '2.5rem', fontFamily: 'var(--font-serif)', color: '#FFFDF9', fontWeight: '850', margin: '0 0 1.5rem', lineHeight: '1.25' }}>
            Find Your Perfect <span style={{ color: 'var(--accent-gold)' }}>MILASTY Bake</span>
          </h2>

          {recStep === 1 && (
            <div>
              <p style={{ fontSize: '1rem', color: '#F5EBDD', marginBottom: '1.75rem', fontWeight: '600' }}>
                Question 1: What are you looking for?
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', maxWidth: '400px', margin: '0 auto' }}>
                {['Everyday Chai Snacking', 'Something for Gifting', 'A Light Evening Snack'].map((option) => (
                  <button
                    key={option}
                    onClick={() => handleRecAnswer('lookingFor', option)}
                    style={{
                      padding: '0.9rem 1.25rem',
                      borderRadius: '999px',
                      backgroundColor: 'rgba(20, 10, 5, 0.65)',
                      border: '1px solid rgba(255, 255, 255, 0.25)',
                      color: '#FFFDF9',
                      fontWeight: '750',
                      fontSize: '0.92rem',
                      cursor: 'pointer',
                      transition: 'all 0.25s ease'
                    }}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          )}

          {recStep === 2 && (
            <div>
              <p style={{ fontSize: '1rem', color: '#F5EBDD', marginBottom: '1.75rem', fontWeight: '600' }}>
                Question 2: What kind of flavour profile do you prefer?
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', maxWidth: '400px', margin: '0 auto' }}>
                {['Less Sweet & Spiced', 'Rich & Indulgent Cocoa', 'Light & Nutty Coconut'].map((option) => (
                  <button
                    key={option}
                    onClick={() => handleRecAnswer('preference', option)}
                    style={{
                      padding: '0.9rem 1.25rem',
                      borderRadius: '999px',
                      backgroundColor: 'rgba(20, 10, 5, 0.65)',
                      border: '1px solid rgba(255, 255, 255, 0.25)',
                      color: '#FFFDF9',
                      fontWeight: '750',
                      fontSize: '0.92rem',
                      cursor: 'pointer',
                      transition: 'all 0.25s ease'
                    }}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          )}

          {recStep === 3 && recResult && (
            <div>
              <span style={{ fontSize: '0.82rem', color: 'var(--accent-gold)', fontWeight: '850', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>
                ✦ YOUR PERFECT MATCH ✦
              </span>
              <h3 style={{ fontSize: '1.6rem', color: '#FFFDF9', fontFamily: 'var(--font-serif)', fontWeight: '850', marginBottom: '0.5rem' }}>
                {recResult.title}
              </h3>
              <p style={{ fontSize: '0.92rem', color: '#F5EBDD', maxWidth: '500px', margin: '0 auto 1.75rem', lineHeight: '1.6' }}>
                {recResult.subtitle || recResult.description}
              </p>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link
                  to={`/product/${recResult.slug}`}
                  className="btn-primary"
                  style={{
                    padding: '0.85rem 2rem',
                    backgroundColor: '#244f21',
                    color: '#FFF',
                    borderRadius: '999px',
                    fontWeight: '850',
                    textDecoration: 'none',
                    border: '1.5px solid #b9cd94',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <span>EXPLORE PRODUCT →</span>
                </Link>
                <button
                  onClick={resetRec}
                  style={{
                    padding: '0.85rem 1.5rem',
                    backgroundColor: 'transparent',
                    color: 'rgba(255, 255, 255, 0.75)',
                    borderRadius: '999px',
                    fontWeight: '700',
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    cursor: 'pointer'
                  }}
                >
                  Retake Quiz
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ================================================================== */}
      {/* 6. TRUST STRIP */}
      {/* ================================================================== */}
      <section 
        className="products-trust-strip" 
        style={{ 
          backgroundColor: 'rgba(20, 10, 5, 0.65)', 
          padding: '2.5rem 0', 
          borderTop: '1px solid rgba(255, 255, 255, 0.15)', 
          borderBottom: '1px solid rgba(255, 255, 255, 0.15)' 
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto', paddingLeft: '1.5rem', paddingRight: '1.5rem', display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#FFFDF9', fontWeight: '850', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            <Leaf size={16} color="var(--accent-gold)" />
            <span>100% PURE DESI GHEE</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#FFFDF9', fontWeight: '850', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            <Sparkles size={16} color="var(--accent-gold)" />
            <span>NO MAIDA</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#FFFDF9', fontWeight: '850', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            <Shield size={16} color="var(--accent-gold)" />
            <span>ORGANIC JAGGERY</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#FFFDF9', fontWeight: '850', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            <Award size={16} color="var(--accent-gold)" />
            <span>NO PALM OIL</span>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* 7. REVIEWS (1 Card at a time on Mobile) */}
      {/* ================================================================== */}
      <section 
        style={{ padding: isMobile ? '3.5rem 1rem' : '5.5rem 1.5rem', maxWidth: '900px', margin: '0 auto', boxSizing: 'border-box' }}
      >
        <div style={{ textAlign: 'center', marginBottom: isMobile ? '2rem' : '3.5rem' }}>
          <span style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--accent-gold)', fontWeight: '850', display: 'block', marginBottom: '0.5rem' }}>
            CUSTOMER REVIEWS
          </span>
          <h2 style={{ fontSize: isMobile ? '2.4rem' : '3.3rem', fontFamily: 'var(--font-serif)', color: '#FFFDF9', fontWeight: '850', margin: 0, lineHeight: '1.2' }}>
            Loved by <span style={{ color: '#b9cd94', fontSize: '1.05em' }}>MILASTY Customers</span>
          </h2>
        </div>

        {/* Reviews Showcase */}
        <div style={{ width: '100%', maxWidth: isMobile ? '380px' : '750px', margin: '0 auto' }}>
          {(() => {
            const rev = dummyReviews[reviewIndex];
            return (
              <div
                className="glass-card"
                style={{
                  padding: isMobile ? '2rem 1.5rem' : '3rem 2.5rem',
                  borderRadius: '24px',
                  backgroundColor: 'rgba(35, 21, 13, 0.75)',
                  border: '1.5px solid rgba(255, 255, 255, 0.18)',
                  boxShadow: '0 12px 32px rgba(0, 0, 0, 0.35)',
                  textAlign: 'center',
                  boxSizing: 'border-box',
                  width: '100%',
                  margin: '0 auto'
                }}
              >
                {/* Rating Stars */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.25rem', marginBottom: '1.25rem' }}>
                  {[...Array(rev.rating)].map((_, i) => (
                    <Star key={i} size={18} fill="var(--accent-gold)" color="var(--accent-gold)" />
                  ))}
                </div>

                {/* Review Text */}
                <p style={{ fontSize: isMobile ? '0.95rem' : '1.15rem', color: '#FFFDF9', lineHeight: '1.65', marginBottom: '1.5rem', fontWeight: '500', fontStyle: 'italic' }}>
                  "{rev.comment}"
                </p>

                {/* Author Info */}
                <div>
                  <h4 style={{ fontSize: '1rem', color: '#FFFDF9', fontWeight: '850', margin: '0 0 0.2rem' }}>
                    — {rev.name}
                  </h4>
                  <span style={{ fontSize: '0.78rem', color: '#b9cd94', fontWeight: '700' }}>
                    {rev.role} • {rev.product}
                  </span>
                </div>
              </div>
            );
          })()}

          {/* Dots Indicator & Navigation Arrows */}
          <div style={{ marginTop: '1.75rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            {/* Dots */}
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              {dummyReviews.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setReviewIndex(idx)}
                  style={{
                    width: reviewIndex === idx ? '24px' : '8px',
                    height: '8px',
                    borderRadius: '999px',
                    backgroundColor: reviewIndex === idx ? 'var(--accent-gold)' : 'rgba(255, 255, 255, 0.25)',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                />
              ))}
            </div>

            {/* Prev / Next Arrows */}
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => setReviewIndex(prev => (prev === 0 ? dummyReviews.length - 1 : prev - 1))}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(35, 21, 13, 0.75)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  color: '#FFFDF9',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => setReviewIndex(prev => (prev === dummyReviews.length - 1 ? 0 : prev + 1))}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(35, 21, 13, 0.75)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  color: '#FFFDF9',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </section>



      </div>
    </div>
  );
}
