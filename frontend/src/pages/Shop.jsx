import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, ChevronRight, ShoppingBag, Leaf, Sparkles, 
  Shield, Award, ArrowRight, Star, ChevronLeft, HelpCircle, Check
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
      {/* 1. SHOP HERO (Compact on Mobile) */}
      {/* ================================================================== */}
      <section 
        style={{ 
          padding: isMobile ? '3rem 1.25rem 2rem' : '5rem 1.5rem 3.5rem', 
          textAlign: 'center', 
          maxWidth: '850px', 
          margin: '0 auto',
          boxSizing: 'border-box'
        }}
      >
        <span 
          style={{ 
            fontSize: '0.78rem', 
            textTransform: 'uppercase', 
            letterSpacing: '0.14em', 
            color: 'var(--accent-gold)', 
            fontWeight: '850',
            backgroundColor: 'rgba(36, 79, 33, 0.35)',
            padding: '0.35rem 0.95rem',
            borderRadius: '999px',
            border: '1.5px solid rgba(185, 205, 148, 0.4)',
            display: 'inline-block',
            marginBottom: '1rem'
          }}
        >
          SHOP MILASTY
        </span>
        <h1 
          style={{ 
            fontSize: isMobile ? '2.1rem' : '3.6rem', 
            fontFamily: 'var(--font-serif)', 
            color: '#FFFDF9', 
            fontWeight: '850', 
            lineHeight: '1.15',
            margin: '0 0 0.85rem 0',
            letterSpacing: '-0.02em',
            textShadow: '0 2px 10px rgba(0,0,0,0.5)'
          }}
        >
          Wholesome Millet Bakes.
        </h1>
        <p 
          style={{ 
            fontSize: isMobile ? '0.95rem' : '1.12rem', 
            color: '#F5EBDD', 
            lineHeight: '1.6', 
            maxWidth: '560px',
            margin: '0 auto',
            fontWeight: '550'
          }}
        >
          Slow-baked in pure Desi Ghee and organic jaggery for everyday mindful snacking.
        </p>
      </section>

      {/* ================================================================== */}
      {/* 2. CATEGORY NAVIGATION BAR */}
      {/* ================================================================== */}
      <section 
        style={{ 
          position: 'sticky',
          top: '70px',
          zIndex: 40,
          backgroundColor: 'rgba(20, 10, 5, 0.88)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(255, 255, 255, 0.12)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
          padding: '0.65rem 0'
        }}
      >
        <div 
          className="shop-categories-nav-strip"
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '0 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isMobile ? 'flex-start' : 'center',
            gap: '0.65rem',
            overflowX: 'auto',
            whiteSpace: 'nowrap',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {categoryList.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  handleScrollToSection('featured-bakes-section');
                }}
                style={{
                  padding: isMobile ? '0.45rem 1.1rem' : '0.6rem 1.4rem',
                  borderRadius: '999px',
                  backgroundColor: isSelected ? '#244f21' : 'rgba(35, 21, 13, 0.60)',
                  border: isSelected ? '1.5px solid #b9cd94' : '1px solid rgba(255, 255, 255, 0.20)',
                  color: isSelected ? '#FFFDF9' : 'rgba(255, 255, 255, 0.85)',
                  fontSize: isMobile ? '0.78rem' : '0.86rem',
                  fontWeight: '850',
                  letterSpacing: '0.04em',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                  flexShrink: 0,
                  boxShadow: isSelected ? '0 4px 14px rgba(36, 79, 33, 0.45)' : 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <span>{cat.name}</span>
                {isSelected && <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: 'var(--accent-gold)', display: 'inline-block' }} />}
              </button>
            );
          })}
        </div>
      </section>

      {/* ================================================================== */}
      {/* 3. FEATURED PRODUCTS (Strict 2x2 Grid on Mobile) */}
      {/* ================================================================== */}
      <section 
        id="featured-bakes-section" 
        style={{ padding: isMobile ? '3.5rem 1rem' : '5.5rem 1.5rem', maxWidth: '1200px', margin: '0 auto', boxSizing: 'border-box' }}
      >
        <div style={{ textAlign: 'center', maxWidth: '640px', margin: isMobile ? '0 auto 2.25rem' : '0 auto 3.5rem' }}>
          <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--accent-gold)', fontWeight: '800', display: 'block', marginBottom: '0.4rem' }}>
            FEATURED BAKES
          </span>
          <h2 style={{ fontSize: isMobile ? '2.1rem' : '2.7rem', fontFamily: 'var(--font-serif)', color: '#FFFDF9', fontWeight: '850', margin: 0, lineHeight: '1.2' }}>
            Discover Our <span style={{ color: 'var(--accent-gold)' }}>Favourites</span>
          </h2>
          <p style={{ fontSize: isMobile ? '0.9rem' : '1.05rem', color: '#F5EBDD', margin: '0.5rem 0 0', fontWeight: '500' }}>
            A few of the MILASTY favourites worth trying first.
          </p>
        </div>

        {/* Product Grid: Strict 2x2 Grid on Mobile (<768px) | 3-4 Columns Desktop */}
        <div className="favorites-grid fitted-cards-container-4">
          {displayedProducts.length > 0 ? (
            displayedProducts.map((product) => (
              <ProductCard key={product._id || product.slug} product={product} />
            ))
          ) : (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: '#F5EBDD' }}>
              <p style={{ fontSize: '1.1rem' }}>No bakes found in this category.</p>
              <button 
                onClick={() => setSelectedCategory('all')} 
                className="btn-primary" 
                style={{ marginTop: '1rem', padding: '0.6rem 1.5rem', backgroundColor: '#c89b3c', color: '#FFF', borderRadius: '999px', border: 'none' }}
              >
                View All Bakes
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ================================================================== */}
      {/* 4. CATEGORIES SECTION */}
      {/* ================================================================== */}
      <section 
        style={{ 
          padding: isMobile ? '3.5rem 1rem' : '5.5rem 1.5rem', 
          backgroundColor: 'rgba(20, 10, 5, 0.45)', 
          borderTop: '1px solid rgba(255, 255, 255, 0.12)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.12)' 
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto', boxSizing: 'border-box' }}>
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: isMobile ? '0 auto 2.25rem' : '0 auto 3.5rem' }}>
            <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--accent-gold)', fontWeight: '800', display: 'block', marginBottom: '0.4rem' }}>
              EXPLORE BY CATEGORY
            </span>
            <h2 style={{ fontSize: isMobile ? '2.1rem' : '2.7rem', fontFamily: 'var(--font-serif)', color: '#FFFDF9', fontWeight: '850', margin: 0, lineHeight: '1.2' }}>
              Find Your Perfect <span style={{ color: 'var(--accent-gold)' }}>MILASTY</span>
            </h2>
          </div>

          <div 
            style={{ 
              display: 'grid', 
              gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', 
              gap: isMobile ? '0.75rem' : '2rem' 
            }}
          >
            {categoryList.filter(c => c.id !== 'all').map((cat) => (
              <div 
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  handleScrollToSection('featured-bakes-section');
                }}
                className="glass-card"
                style={{
                  padding: isMobile ? '1.5rem 1rem' : '2.5rem 2rem',
                  borderRadius: '20px',
                  backgroundColor: 'rgba(35, 21, 13, 0.65)',
                  border: selectedCategory === cat.id ? '1.5px solid var(--accent-gold)' : '1px solid rgba(255, 255, 255, 0.18)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxSizing: 'border-box'
                }}
              >
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(36, 79, 33, 0.45)', border: '1px solid rgba(185, 205, 148, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.15rem' }}>
                  <Sparkles size={22} color="var(--accent-gold)" />
                </div>
                <h3 style={{ fontSize: isMobile ? '0.95rem' : '1.25rem', color: '#FFFDF9', fontFamily: 'var(--font-serif)', fontWeight: '850', margin: '0 0 0.35rem' }}>
                  {cat.label}
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.7)', fontWeight: '600' }}>
                  {cat.count}
                </span>
                <span style={{ fontSize: '0.78rem', color: 'var(--accent-gold)', fontWeight: '800', marginTop: '1rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                  <span>Browse Category</span>
                  <ArrowRight size={13} />
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

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
          <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--accent-gold)', fontWeight: '800', display: 'block', marginBottom: '0.4rem' }}>
            CUSTOMER REVIEWS
          </span>
          <h2 style={{ fontSize: isMobile ? '2.1rem' : '2.7rem', fontFamily: 'var(--font-serif)', color: '#FFFDF9', fontWeight: '850', margin: 0, lineHeight: '1.2' }}>
            Loved by <span style={{ color: 'var(--accent-gold)' }}>MILASTY Customers</span>
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

      {/* ================================================================== */}
      {/* 8. FINAL CONVERSION SECTION */}
      {/* ================================================================== */}
      <section 
        style={{ 
          padding: isMobile ? '4rem 1rem' : '6rem 1.5rem', 
          backgroundColor: 'rgba(20, 10, 5, 0.65)',
          borderTop: '1px solid rgba(255, 255, 255, 0.15)'
        }}
      >
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center', boxSizing: 'border-box' }}>
          <h2 style={{ fontSize: isMobile ? '2.1rem' : '3.2rem', fontFamily: 'var(--font-serif)', color: '#FFFDF9', fontWeight: '850', marginBottom: '1rem', lineHeight: '1.2' }}>
            READY TO FIND YOUR <span style={{ color: 'var(--accent-gold)' }}>MILASTY FAVOURITE?</span>
          </h2>
          <p style={{ fontSize: isMobile ? '0.95rem' : '1.1rem', color: '#F5EBDD', lineHeight: '1.65', marginBottom: '2.25rem', maxWidth: '560px', margin: '0.5rem auto 2.25rem', fontWeight: '500' }}>
            Slow-baked goodness, made for everyday moments and thoughtful gifting.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button 
              onClick={() => handleScrollToSection('featured-bakes-section')}
              className="btn-primary" 
              style={{ padding: '0.95rem 2.25rem', fontSize: '0.9rem', backgroundColor: '#244f21', color: '#FFFFFF', border: '1.5px solid #b9cd94', borderRadius: '999px', fontWeight: '850', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}
            >
              <span>EXPLORE ALL BAKES →</span>
            </button>
            <button 
              onClick={() => handleScrollToSection('featured-bakes-section')}
              className="btn-secondary" 
              style={{ padding: '0.95rem 2.25rem', fontSize: '0.9rem', borderColor: '#b9cd94', color: '#b9cd94', borderRadius: '999px', fontWeight: '850', backgroundColor: 'rgba(36, 79, 33, 0.25)', cursor: 'pointer' }}
            >
              FIND YOUR BAKE →
            </button>
          </div>
        </div>
      </section>

      </div>
    </div>
  );
}
