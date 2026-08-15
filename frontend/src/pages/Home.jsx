import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, ShieldCheck, ArrowRight, Award, FileText, CheckCircle2, 
  Star, ChevronLeft, ChevronRight, Heart, ShoppingBag, Eye 
} from 'lucide-react';
import api from '../api/axios';
import { initialProducts } from '../data/seedData';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

export default function Home() {
  const { addToCart } = useCart();
  const { wishlistItems, toggleWishlist } = useWishlist();
  
  // Real product data state
  const [dbProducts, setDbProducts] = useState([]);
  const [activeReviewIdx, setActiveReviewIdx] = useState(0);
  const [activeRitualIdx, setActiveRitualIdx] = useState(0);
  const [scrollY, setScrollY] = useState(0);

  const videoRef = useRef(null);

  // Silky-Smooth Scroll-Driven Video Scrubbing (Forward & Backward)
  useEffect(() => {
    let targetTime = 0;
    let currentTime = 0;
    let isSeeking = false;
    let animationFrameId;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrollY(currentScrollY);

      const video = videoRef.current;
      if (!video) return;

      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight <= 0) return;

      const scrollFraction = currentScrollY / totalHeight;
      const duration = video.duration;

      if (duration && !isNaN(duration)) {
        targetTime = Math.max(0, Math.min(duration, scrollFraction * duration));
      }
    };

    const smoothScrubLoop = () => {
      const video = videoRef.current;
      if (video && video.duration && !isNaN(video.duration)) {
        // Smooth linear interpolation (lerp) for fluid transition
        currentTime += (targetTime - currentTime) * 0.15;

        // Prevent seek-lock / stutter by checking seeking state & delta
        if (!video.seeking && !isSeeking && Math.abs(video.currentTime - currentTime) > 0.02) {
          isSeeking = true;
          try {
            if ('fastSeek' in video) {
              video.fastSeek(currentTime);
            } else {
              video.currentTime = currentTime;
            }
          } catch (e) {
            // fallback safe block
          }
          isSeeking = false;
        }
      }
      animationFrameId = requestAnimationFrame(smoothScrubLoop);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    animationFrameId = requestAnimationFrame(smoothScrubLoop);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (video) {
      video.pause(); // Pause auto-play so scroll drives forward/backward time
      video.currentTime = 0;
    }
  };

  const heroRef = useScrollReveal();
  const trustRef = useScrollReveal();
  const whyRef = useScrollReveal();
  const favRef = useScrollReveal();
  const ritualRef = useScrollReveal();
  const timelineRef = useScrollReveal();
  const labRef = useScrollReveal();
  const reviewRef = useScrollReveal();
  const storyRef = useScrollReveal();
  const finalCtaRef = useScrollReveal();

  useEffect(() => {
    api.get('/products?limit=4')
      .then(res => {
        if (res.data && res.data.products && res.data.products.length > 0) {
          setDbProducts(res.data.products.slice(0, 4));
        } else {
          setDbProducts(initialProducts.slice(0, 4));
        }
      })
      .catch(() => {
        setDbProducts(initialProducts.slice(0, 4));
      });
  }, []);

  const reviews = [
    {
      quote: "MILASTY's Cardamom Bajra cookies have completely replaced refined biscuits in our home. Melt-in-mouth texture with authentic Desi Ghee aroma!",
      name: "Ananya Sharma",
      location: "New Delhi",
      role: "Verified Health Coach",
      rating: 5,
    },
    {
      quote: "Finding snacks that are truly 100% Maida-free and Palm Oil-free is so rare. The Cocoa Ragi is rich, crunchy, and my kids love it!",
      name: "Rohan & Priya Mehta",
      location: "Mumbai",
      role: "Conscious Parents",
      rating: 5,
    },
    {
      quote: "The lab test reports on their website gave me total confidence. Pure ingredients baked with genuine care.",
      name: "Dr. Sunita Rao",
      location: "Bengaluru",
      role: "Clinical Nutritionist",
      rating: 5,
    },
  ];

  // Selected ritual product
  const ritualProducts = dbProducts.length > 0 ? dbProducts : initialProducts.slice(0, 4);
  const activeRitualProduct = ritualProducts[activeRitualIdx] || ritualProducts[0];

  return (
    <div style={{ backgroundColor: 'transparent', position: 'relative' }}>
      
      {/* HTML5 BACKGROUND SCROLL VIDEO (Home Page Only) */}
      <video
        ref={videoRef}
        muted
        playsInline
        preload="auto"
        onLoadedMetadata={handleLoadedMetadata}
        disablePictureInPicture
        disableRemotePlayback
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center',
          zIndex: -2,
          willChange: 'transform',
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
        }}
      >
        <source src="/videos/milasty-cookie.mp4" type="video/mp4" />
      </video>

      {/* Dark Cover Overlay */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(20, 10, 5, 0.22)',
          zIndex: -1,
        }}
      />

      {/* 1. CINEMATIC VIDEO HERO SECTION */}
      <section
        style={{
          position: 'relative',
          height: '92vh',
          minHeight: '600px',
          overflow: 'hidden',
          backgroundColor: 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Floating Transparent Content */}
        <div 
          className="container" 
          style={{ 
            position: 'relative', 
            zIndex: 3, 
            textAlign: 'center',
            color: '#FFFFFF',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: Math.max(0, 1 - scrollY / 550),
            transform: `translateY(${-scrollY * 0.12}px)`,
            transition: 'opacity 0.1s ease-out, transform 0.1s ease-out',
          }}
        >
          <span 
            className="badge-pill" 
            style={{ 
              marginBottom: '1.75rem', 
              padding: '0.5rem 1.25rem', 
              fontSize: '0.8rem',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              backgroundColor: 'transparent',
              border: '1px solid var(--accent-gold)',
              color: 'var(--accent-gold)',
              fontWeight: '700'
            }}
          >
            ✦ Handcrafted Millet Bakes
          </span>

          <h1
            style={{
              fontSize: 'clamp(2.4rem, 6vw, 4.2rem)',
              lineHeight: '1.12',
              color: '#FFFFFF',
              marginBottom: '1.5rem',
              letterSpacing: '-0.01em',
              fontFamily: 'var(--font-serif)',
              fontWeight: '700',
              textShadow: '0 4px 16px rgba(0, 0, 0, 0.5)',
              maxWidth: '850px'
            }}
          >
            <span style={{ color: 'var(--accent-gold)' }}>Goodness of Millets.</span><br />Baked Into Every Bite.
          </h1>

          <p
            style={{
              fontSize: 'clamp(1rem, 2vw, 1.2rem)',
              color: '#FFFFFF',
              lineHeight: '1.7',
              marginBottom: '3rem',
              maxWidth: '600px',
              textShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
            }}
          >
            Wholesome millet cookies, slow-baked in <span style={{ color: 'var(--accent-gold)', fontWeight: '700' }}>pure Desi Ghee</span> and naturally sweetened with <span style={{ color: 'var(--accent-gold)', fontWeight: '700' }}>organic jaggery</span>.
          </p>

          <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
            <Link to="/shop" className="btn-primary" style={{ padding: '1rem 2.5rem', fontSize: '0.95rem', backgroundColor: '#c89b3c', color: '#FFFFFF', border: 'none', fontWeight: '800', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>Explore Fresh Bakes</span>
              <ArrowRight size={18} />
            </Link>
            <a href="#why-milasty" className="btn-secondary" style={{ padding: '0.95rem 2.25rem', fontSize: '0.95rem', borderColor: '#c89b3c', color: '#c89b3c', fontWeight: '800', backgroundColor: 'rgba(200, 155, 60, 0.12)' }}>
              <span>Why MILASTY?</span>
            </a>
          </div>

          {/* Trust badges */}
          <div 
            style={{ 
              marginTop: '3.5rem', 
              display: 'flex', 
              gap: '1.75rem', 
              flexWrap: 'wrap', 
              justifyContent: 'center',
              fontSize: '0.8rem', 
              color: '#FFFFFF', 
              fontWeight: '700',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              textShadow: '0 1px 4px rgba(0,0,0,0.3)'
            }}
          >
            <span>No Maida</span>
            <span>•</span>
            <span>No Palm Oil</span>
            <span>•</span>
            <span>No Refined Sugar</span>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div
          style={{
            position: 'absolute',
            bottom: '2.5rem',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 4,
            color: '#FFFFFF',
            fontSize: '0.75rem',
            letterSpacing: '0.12em',
            fontWeight: '700',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.5rem',
            opacity: Math.max(0, 1 - scrollY / 300),
            transition: 'opacity 0.15s ease-out'
          }}
        >
          <span>SCROLL TO EXPLORE</span>
          <div style={{ animation: 'bounce 1.5s infinite', display: 'flex', alignItems: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <polyline points="19 12 12 19 5 12"></polyline>
            </svg>
          </div>
        </div>
      </section>

      {/* 2. TRUST / BRAND PROMISE SECTION (Transparent tiles with white text and borders) */}
      <section ref={trustRef} className="reveal-fade-up" style={{ backgroundColor: 'transparent', padding: '5rem 0', borderBottom: '1px solid rgba(255, 255, 255, 0.15)' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '2.5rem' }}>
            <div style={{ textAlign: 'center', padding: '1.75rem 1.5rem', backgroundColor: 'transparent', border: '1px solid #FFFFFF', borderRadius: '16px', backdropFilter: 'none', WebkitBackdropFilter: 'none' }} className="trust-card">
              <div style={{ fontSize: '2.8rem', fontFamily: 'var(--font-serif)', color: 'var(--accent-gold)', fontWeight: '750', marginBottom: '0.5rem' }}>100%</div>
              <h4 style={{ fontSize: '1.05rem', color: '#FFFFFF', marginBottom: '0.25rem', fontWeight: '800' }}>Pure Desi Ghee</h4>
              <p style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.85)' }}>Baked cleanly with authentic cow ghee</p>
            </div>
            <div style={{ textAlign: 'center', padding: '1.75rem 1.5rem', backgroundColor: 'transparent', border: '1px solid #FFFFFF', borderRadius: '16px', backdropFilter: 'none', WebkitBackdropFilter: 'none' }} className="trust-card">
              <div style={{ fontSize: '2.8rem', fontFamily: 'var(--font-serif)', color: 'var(--accent-gold)', fontWeight: '750', marginBottom: '0.5rem' }}>100%</div>
              <h4 style={{ fontSize: '1.05rem', color: '#FFFFFF', marginBottom: '0.25rem', fontWeight: '800' }}>Wholesome Grains</h4>
              <p style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.85)' }}>Finger millet, sorghum, and pearl millet</p>
            </div>
            <div style={{ textAlign: 'center', padding: '1.75rem 1.5rem', backgroundColor: 'transparent', border: '1px solid #FFFFFF', borderRadius: '16px', backdropFilter: 'none', WebkitBackdropFilter: 'none' }} className="trust-card">
              <div style={{ fontSize: '2.8rem', fontFamily: 'var(--font-serif)', color: 'var(--accent-gold)', fontWeight: '750', marginBottom: '0.5rem' }}>10,000+</div>
              <h4 style={{ fontSize: '1.05rem', color: '#FFFFFF', marginBottom: '0.25rem', fontWeight: '800' }}>Happy Families</h4>
              <p style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.85)' }}>Snacking consciously across India</p>
            </div>
            <div style={{ textAlign: 'center', padding: '1.75rem 1.5rem', backgroundColor: 'transparent', border: '1px solid #FFFFFF', borderRadius: '16px', backdropFilter: 'none', WebkitBackdropFilter: 'none' }} className="trust-card">
              <div style={{ fontSize: '2.8rem', fontFamily: 'var(--font-serif)', color: 'var(--accent-gold)', fontWeight: '750', marginBottom: '0.5rem' }}>NABL</div>
              <h4 style={{ fontSize: '1.05rem', color: '#FFFFFF', marginBottom: '0.25rem', fontWeight: '800' }}>Verified Transparency</h4>
              <p style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.85)' }}>Certified nutritional lab analysis</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. "WHY MILASTY" SECTION (Transparent tiles with white text and borders) */}
      <section id="why-milasty" ref={whyRef} className="reveal-fade-up" style={{ padding: '6.5rem 0', backgroundColor: 'transparent', borderBottom: '1px solid rgba(255, 255, 255, 0.15)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 4.5rem' }}>
            <span className="badge-pill" style={{ marginBottom: '0.75rem', backgroundColor: 'transparent', border: '1px solid var(--accent-gold)', color: 'var(--accent-gold)' }}>Core Philosophy</span>
            <h2 style={{ fontSize: '2.6rem', color: '#FFFFFF', fontFamily: 'var(--font-serif)', fontWeight: '800' }}><span style={{ color: 'var(--accent-gold)' }}>Made Differently.</span> Tasted Slowly.</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
            <div style={{ padding: '2.5rem 2rem', backgroundColor: 'transparent', borderRadius: '24px', border: '1px solid #FFFFFF', backdropFilter: 'none', WebkitBackdropFilter: 'none' }}>
              <div style={{ color: 'var(--accent-gold)', marginBottom: '1.5rem' }}>
                <Award size={36} strokeWidth={1.5} />
              </div>
              <h3 style={{ fontSize: '1.25rem', color: '#FFFFFF', marginBottom: '0.75rem', fontWeight: '800' }}>PURE DESI GHEE</h3>
              <p style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.85)', lineHeight: '1.6', fontWeight: '500' }}>Slow-baked with authentic Desi Cow Ghee for rich aroma and natural nutrition.</p>
            </div>

            <div style={{ padding: '2.5rem 2rem', backgroundColor: 'transparent', borderRadius: '24px', border: '1px solid #FFFFFF', backdropFilter: 'none', WebkitBackdropFilter: 'none' }}>
              <div style={{ color: 'var(--accent-gold)', marginBottom: '1.5rem' }}>
                <Sparkles size={36} strokeWidth={1.5} />
              </div>
              <h3 style={{ fontSize: '1.25rem', color: '#FFFFFF', marginBottom: '0.75rem', fontWeight: '800' }}>WHOLESOME MILLETS</h3>
              <p style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.85)', lineHeight: '1.6', fontWeight: '500' }}>Packed with the traditional goodness of native Bajra, Jowar, and Ragi flour.</p>
            </div>

            <div style={{ padding: '2.5rem 2rem', backgroundColor: 'transparent', borderRadius: '24px', border: '1px solid #FFFFFF', backdropFilter: 'none', WebkitBackdropFilter: 'none' }}>
              <div style={{ color: 'var(--accent-gold)', marginBottom: '1.5rem' }}>
                <ShieldCheck size={36} strokeWidth={1.5} />
              </div>
              <h3 style={{ fontSize: '1.25rem', color: '#FFFFFF', marginBottom: '0.75rem', fontWeight: '800' }}>NATURALLY SWEET</h3>
              <p style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.85)', lineHeight: '1.6', fontWeight: '500' }}>Sweetened with pure organic jaggery instead of refined white sugars.</p>
            </div>

            <div style={{ padding: '2.5rem 2rem', backgroundColor: 'transparent', borderRadius: '24px', border: '1px solid #FFFFFF', backdropFilter: 'none', WebkitBackdropFilter: 'none' }}>
              <div style={{ color: 'var(--accent-gold)', marginBottom: '1.5rem' }}>
                <FileText size={36} strokeWidth={1.5} />
              </div>
              <h3 style={{ fontSize: '1.25rem', color: '#FFFFFF', marginBottom: '0.75rem', fontWeight: '800' }}>NOTHING UNNECESSARY</h3>
              <p style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.85)', lineHeight: '1.6', fontWeight: '500' }}>Zero Maida flour. Zero Palm Oil. Absolutely no hidden chemical preservatives.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SIGNATURE PRODUCTS SECTION */}
      <section ref={favRef} className="reveal-fade-up" style={{ padding: '6.5rem 0', backgroundColor: 'transparent', borderBottom: '1px solid rgba(255, 255, 255, 0.15)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 4rem' }}>
            <span className="badge-pill" style={{ marginBottom: '0.75rem', backgroundColor: 'transparent', border: '1px solid var(--accent-gold)', color: 'var(--accent-gold)' }}>Our Favorites</span>
            <h2 style={{ fontSize: '2.6rem', color: '#FFFFFF', fontFamily: 'var(--font-serif)', fontWeight: '800', marginBottom: '0.75rem' }}>Meet the <span style={{ color: 'var(--accent-gold)' }}>MILASTY</span> Favourites</h2>
            <p style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '1.05rem', fontWeight: '500' }}>Four wholesome bakes. One better way to snack.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: '2rem' }}>
            {dbProducts.map((product) => {
              const selectedVariant = product.variants?.[0];
              const isWishlisted = wishlistItems && wishlistItems.some((item) => (item._id || item.slug) === (product._id || product.slug));
              return (
                <div 
                  key={product._id || product.slug}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: '24px',
                    overflow: 'hidden',
                    backgroundColor: 'transparent',
                    border: '1px solid #FFFFFF',
                    position: 'relative',
                    backdropFilter: 'none',
                    WebkitBackdropFilter: 'none'
                  }}
                >
                  <div style={{ position: 'relative', overflow: 'hidden', paddingTop: '80%', backgroundColor: 'transparent' }}>
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
                          transition: 'transform 0.4s ease'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
                        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      />
                    </Link>
                    
                    <button
                      onClick={() => toggleWishlist(product)}
                      style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        backgroundColor: '#FFFFFF',
                        border: 'none',
                        width: '34px',
                        height: '34px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: 'var(--shadow-sm)',
                        color: isWishlisted ? 'var(--accent-terracotta)' : 'var(--text-muted)',
                        cursor: 'pointer',
                        zIndex: 5
                      }}
                    >
                      <Heart size={16} fill={isWishlisted ? 'var(--accent-terracotta)' : 'none'} />
                    </button>
                  </div>

                  <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flexGrow: 1 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.5rem' }}>
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={14} fill={i < Math.floor(product.rating || 5) ? 'var(--accent-gold)' : 'none'} color="var(--accent-gold)" />
                        ))}
                        <span style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.85)', marginLeft: '0.25rem', fontWeight: '600' }}>({product.reviewCount || 10})</span>
                      </div>
                      <h3 style={{ fontSize: '1.25rem', color: '#FFFFFF', marginBottom: '0.5rem', fontFamily: 'var(--font-serif)', fontWeight: '800' }}>
                        <Link to={`/product/${product.slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>{product.title}</Link>
                      </h3>
                      <p style={{ fontSize: '0.88rem', color: 'rgba(255, 255, 255, 0.85)', marginBottom: '1.25rem', lineHeight: '1.5', fontWeight: '500' }}>{product.subtitle || product.description}</p>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.25)' }}>
                      <span style={{ fontSize: '1.3rem', fontWeight: '900', color: '#FFFFFF' }}>₹{selectedVariant?.price || 139}</span>
                      <button 
                        onClick={() => addToCart(product, selectedVariant)}
                        className="btn-primary" 
                        style={{ padding: '0.6rem 1.15rem', fontSize: '0.82rem', gap: '0.35rem', backgroundColor: '#c89b3c', color: '#FFFFFF', fontWeight: '800' }}
                      >
                        <ShoppingBag size={15} />
                        <span>Add to Cart</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. INTERACTIVE MILLET RITUAL SECTION */}
      <section ref={ritualRef} className="reveal-fade-up" style={{ padding: '6.5rem 0', backgroundColor: 'transparent', borderBottom: '1px solid rgba(255, 255, 255, 0.15)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 4rem' }}>
            <span className="badge-pill" style={{ marginBottom: '0.75rem', backgroundColor: 'transparent', border: '1px solid var(--accent-gold)', color: 'var(--accent-gold)' }}>Interactive Selection</span>
            <h2 style={{ fontSize: '2.6rem', color: '#FFFFFF', fontFamily: 'var(--font-serif)', fontWeight: '800' }}>Discover Your Perfect <span style={{ color: 'var(--accent-gold)' }}>Millet Ritual</span></h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '3.5rem', alignItems: 'center' }}>
            {/* Left Side: Numbered Selector */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {ritualProducts.map((item, idx) => {
                const isSelected = activeRitualIdx === idx;
                return (
                  <div
                    key={item._id || item.slug}
                    onClick={() => setActiveRitualIdx(idx)}
                    style={{
                      padding: '1.25rem 1.5rem',
                      borderRadius: '16px',
                      backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                      border: isSelected ? '1.5px solid #FFFFFF' : '1px solid rgba(255, 255, 255, 0.65)',
                      cursor: 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backdropFilter: 'none',
                      WebkitBackdropFilter: 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                      <span
                        style={{
                          fontSize: '1.25rem',
                          fontFamily: "var(--font-serif)",
                          fontWeight: '900',
                          color: isSelected ? 'var(--accent-gold)' : 'rgba(255, 255, 255, 0.6)',
                        }}
                      >
                        0{idx + 1}
                      </span>
                      <h3 style={{ fontSize: '1.15rem', color: '#FFFFFF', fontWeight: '800' }}>{item.title}</h3>
                    </div>
                    <ArrowRight size={18} style={{ color: '#FFFFFF', transform: isSelected ? 'translateX(4px)' : 'translateX(0)', transition: 'transform 0.2s' }} />
                  </div>
                );
              })}
            </div>

            {/* Right Side: Showcase Card */}
            <div
              style={{
                padding: '2.5rem',
                backgroundColor: 'transparent',
                borderRadius: '24px',
                border: '1px solid #FFFFFF',
                backdropFilter: 'none',
                WebkitBackdropFilter: 'none'
              }}
            >
              <div style={{ position: 'relative', height: '300px', borderRadius: '16px', overflow: 'hidden', marginBottom: '1.75rem', backgroundColor: 'transparent' }}>
                <img 
                  src={activeRitualProduct.image} 
                  alt={activeRitualProduct.title}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              </div>

              <h3 style={{ fontSize: '1.6rem', color: '#FFFFFF', marginBottom: '0.5rem', fontFamily: 'var(--font-serif)', fontWeight: '800' }}>{activeRitualProduct.title}</h3>
              <p style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '0.95rem', lineHeight: '1.65', marginBottom: '1.5rem', fontWeight: '500' }}>
                {activeRitualProduct.description}
              </p>

              {/* Ingredient tags */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.75rem' }}>
                {activeRitualProduct.ingredients?.slice(0, 4).map((ingredient, i) => (
                  <span key={i} style={{ fontSize: '0.78rem', backgroundColor: 'transparent', color: '#FFFFFF', fontWeight: '700', padding: '0.35rem 0.75rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.65)' }}>
                    {ingredient}
                  </span>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '1.25rem', borderTop: '1px solid rgba(255, 255, 255, 0.25)' }}>
                <div>
                  <span style={{ fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.8)', display: 'block', fontWeight: '600' }}>From</span>
                  <span style={{ fontSize: '1.5rem', fontWeight: '900', color: '#FFFFFF' }}>₹{activeRitualProduct.variants?.[0]?.price || 139}</span>
                </div>
                <Link to={`/product/${activeRitualProduct.slug}`} className="btn-primary" style={{ padding: '0.75rem 1.5rem', fontSize: '0.88rem', backgroundColor: '#c89b3c', color: '#FFFFFF', fontWeight: '800', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span>Explore Product</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. MILASTY SNACK RITUAL */}
      <section ref={timelineRef} className="reveal-fade-up" style={{ padding: '6.5rem 0', backgroundColor: 'transparent', borderBottom: '1px solid rgba(255, 255, 255, 0.15)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto 4.5rem' }}>
            <span className="badge-pill" style={{ marginBottom: '0.5rem', backgroundColor: 'transparent', border: '1px solid var(--accent-gold)', color: 'var(--accent-gold)' }}>Mindful Eating</span>
            <h2 style={{ fontSize: '2.6rem', color: '#FFFFFF', fontFamily: 'var(--font-serif)', fontWeight: '800', marginBottom: '0.75rem' }}>The MILASTY <span style={{ color: 'var(--accent-gold)' }}>Snack Ritual</span></h2>
            <p style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '1.02rem', fontWeight: '500' }}>Turn your everyday snack break into a moment worth slowing down for.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '2rem' }}>
            <div style={{ padding: '2rem', backgroundColor: 'transparent', borderRadius: '20px', border: '1px solid #FFFFFF', backdropFilter: 'none', WebkitBackdropFilter: 'none' }}>
              <div style={{ fontSize: '1.8rem', fontFamily: 'var(--font-serif)', fontWeight: '900', color: 'var(--accent-gold)', marginBottom: '1.25rem' }}>01</div>
              <h4 style={{ fontSize: '1.15rem', color: '#FFFFFF', marginBottom: '0.5rem', fontWeight: '800' }}>PAUSE</h4>
              <p style={{ fontSize: '0.88rem', color: 'rgba(255, 255, 255, 0.85)', lineHeight: '1.6', fontWeight: '500' }}>Step away from screens and digital chatter for five mindful minutes.</p>
            </div>

            <div style={{ padding: '2rem', backgroundColor: 'transparent', borderRadius: '20px', border: '1px solid #FFFFFF', backdropFilter: 'none', WebkitBackdropFilter: 'none' }}>
              <div style={{ fontSize: '1.8rem', fontFamily: 'var(--font-serif)', fontWeight: '900', color: 'var(--accent-gold)', marginBottom: '1.25rem' }}>02</div>
              <h4 style={{ fontSize: '1.15rem', color: '#FFFFFF', marginBottom: '0.5rem', fontWeight: '800' }}>NOTICE</h4>
              <p style={{ fontSize: '0.88rem', color: 'rgba(255, 255, 255, 0.85)', lineHeight: '1.6', fontWeight: '500' }}>Take in the warm, nostalgic aroma of slow-baked millets and pure Cow Ghee.</p>
            </div>

            <div style={{ padding: '2rem', backgroundColor: 'transparent', borderRadius: '20px', border: '1px solid #FFFFFF', backdropFilter: 'none', WebkitBackdropFilter: 'none' }}>
              <div style={{ fontSize: '1.8rem', fontFamily: 'var(--font-serif)', fontWeight: '900', color: 'var(--accent-gold)', marginBottom: '1.25rem' }}>03</div>
              <h4 style={{ fontSize: '1.15rem', color: '#FFFFFF', marginBottom: '0.5rem', fontWeight: '800' }}>BITE SLOWLY</h4>
              <p style={{ fontSize: '0.88rem', color: 'rgba(255, 255, 255, 0.85)', lineHeight: '1.6', fontWeight: '500' }}>Enjoy the wholesome crumbly texture and balanced sweetness of unrefined jaggery.</p>
            </div>

            <div style={{ padding: '2rem', backgroundColor: 'transparent', borderRadius: '20px', border: '1px solid #FFFFFF', backdropFilter: 'none', WebkitBackdropFilter: 'none' }}>
              <div style={{ fontSize: '1.8rem', fontFamily: 'var(--font-serif)', fontWeight: '900', color: 'var(--accent-gold)', marginBottom: '1.25rem' }}>04</div>
              <h4 style={{ fontSize: '1.15rem', color: '#FFFFFF', marginBottom: '0.5rem', fontWeight: '800' }}>PAIR & ENJOY</h4>
              <p style={{ fontSize: '0.88rem', color: 'rgba(255, 255, 255, 0.85)', lineHeight: '1.6', fontWeight: '500' }}>Pair with a cup of warm ginger chai, filter coffee, or green tea.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. LAB TEST / TRUST SECTION */}
      <section ref={labRef} className="reveal-fade-up" style={{ padding: '6.5rem 0', backgroundColor: 'transparent', borderBottom: '1px solid rgba(255, 255, 255, 0.15)' }}>
        <div className="container">
          <div style={{ padding: '4.5rem 3.5rem', backgroundColor: 'transparent', color: '#FFFFFF', borderRadius: '30px', border: '1px solid #FFFFFF', backdropFilter: 'none', WebkitBackdropFilter: 'none' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '4rem', alignItems: 'center' }}>
              <div>
                <span className="badge-pill" style={{ backgroundColor: 'transparent', color: 'var(--accent-gold)', border: '1px solid var(--accent-gold)', marginBottom: '1.25rem' }}>
                  <Award size={14} />
                  <span>Lab Tested Transparency</span>
                </span>

                <h2 style={{ fontSize: '2.5rem', color: '#FFFFFF', marginBottom: '1.25rem', fontFamily: 'var(--font-serif)', fontWeight: '800', lineHeight: '1.2' }}>
                  Know What Goes Into <span style={{ color: 'var(--accent-gold)' }}>Every Bite.</span>
                </h2>

                <p style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '1rem', lineHeight: '1.7', marginBottom: '2.25rem', fontWeight: '500' }}>
                  We publish comprehensive nutritional and chemical reports so you can make informed choices. Absolutely no hidden sugars or synthetic preservatives.
                </p>

                <Link to="/nutrition" className="btn-primary" style={{ backgroundColor: '#c89b3c', color: '#FFFFFF', border: 'none', fontWeight: '800', textDecoration: 'none', padding: '0.85rem 2rem', borderRadius: '999px', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileText size={18} />
                  <span>View Nutritional Specs →</span>
                </Link>
              </div>

              {/* Comparison Box */}
              <div style={{ backgroundColor: 'transparent', padding: '2.25rem', borderRadius: '20px', border: '1px solid #FFFFFF', backdropFilter: 'none', WebkitBackdropFilter: 'none' }}>
                <h4 style={{ color: 'var(--accent-gold)', fontSize: '1.15rem', marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '800' }}>MILASTY vs Conventional Biscuits</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.92rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.25)', paddingBottom: '0.75rem' }}>
                    <span style={{ opacity: 0.85, fontWeight: '500' }}>Fat Source:</span>
                    <strong style={{ color: 'var(--accent-gold)', fontWeight: '800' }}>100% Pure Cow Ghee</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.25)', paddingBottom: '0.75rem' }}>
                    <span style={{ opacity: 0.85, fontWeight: '500' }}>Sweetener:</span>
                    <strong style={{ color: 'var(--accent-gold)', fontWeight: '800' }}>Organic Jaggery</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.25)', paddingBottom: '0.75rem' }}>
                    <span style={{ opacity: 0.85, fontWeight: '500' }}>Flour Base:</span>
                    <strong style={{ color: 'var(--accent-gold)', fontWeight: '800' }}>Bajra, Jowar, Ragi (No Maida)</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.25rem' }}>
                    <span style={{ opacity: 0.85, fontWeight: '500' }}>Preservatives:</span>
                    <strong style={{ color: 'var(--accent-gold)', fontWeight: '800' }}>Zero Synthetic Chemicals</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. TESTIMONIAL SECTION */}
      <section ref={reviewRef} className="reveal-fade-up" style={{ padding: '6.5rem 0', backgroundColor: 'transparent', borderBottom: '1px solid rgba(255, 255, 255, 0.15)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto 4rem' }}>
            <span className="badge-pill" style={{ marginBottom: '0.5rem', backgroundColor: 'transparent', border: '1px solid var(--accent-gold)', color: 'var(--accent-gold)' }}>Customer Stories</span>
            <h2 style={{ fontSize: '2.6rem', color: '#FFFFFF', fontFamily: 'var(--font-serif)', fontWeight: '800' }}>Loved by <span style={{ color: 'var(--accent-gold)' }}>Health-Conscious</span> Homes</h2>
          </div>

          <div style={{ maxWidth: '760px', margin: '0 auto', textAlign: 'center', position: 'relative' }}>
            <div style={{ padding: '3.5rem 2.5rem', backgroundColor: 'transparent', borderRadius: '24px', border: '1px solid #FFFFFF', backdropFilter: 'none', WebkitBackdropFilter: 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', color: 'var(--accent-gold)', marginBottom: '1.5rem' }}>
                {[...Array(reviews[activeReviewIdx].rating)].map((_, i) => (
                  <Star key={i} size={20} fill="var(--accent-gold)" color="var(--accent-gold)" />
                ))}
              </div>

              <p style={{ fontSize: '1.28rem', fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: '#FFFFFF', lineHeight: '1.65', marginBottom: '2.25rem', fontWeight: '600' }}>
                "{reviews[activeReviewIdx].quote}"
              </p>

              <div>
                <strong style={{ fontSize: '1.1rem', color: '#FFFFFF', display: 'block', marginBottom: '0.25rem', fontWeight: '800' }}>{reviews[activeReviewIdx].name}</strong>
                <span style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.85)', fontWeight: '600' }}>
                  {reviews[activeReviewIdx].role} • {reviews[activeReviewIdx].location}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '2.5rem' }}>
                <button
                  onClick={() => setActiveReviewIdx((activeReviewIdx - 1 + reviews.length) % reviews.length)}
                  style={{ width: '44px', height: '44px', borderRadius: '50%', border: '1.5px solid #c89b3c', backgroundColor: '#c89b3c', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
                >
                  <ChevronLeft size={22} />
                </button>
                <button
                  onClick={() => setActiveReviewIdx((activeReviewIdx + 1) % reviews.length)}
                  style={{ width: '44px', height: '44px', borderRadius: '50%', border: '1.5px solid #c89b3c', backgroundColor: '#c89b3c', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
                >
                  <ChevronRight size={22} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. BRAND STORY SECTION */}
      <section ref={storyRef} className="reveal-fade-up" style={{ padding: '6.5rem 0', backgroundColor: 'transparent', borderBottom: '1px solid rgba(255, 255, 255, 0.15)' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '4rem', alignItems: 'center' }}>
            <div style={{ borderRadius: '24px', overflow: 'hidden', border: '1px solid #FFFFFF' }}>
              <img 
                src="https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?auto=format&fit=crop&w=800&q=80" 
                alt="Our baking process"
                style={{ width: '100%', height: '400px', objectFit: 'cover', display: 'block' }}
              />
            </div>
            <div>
              <span className="badge-pill" style={{ marginBottom: '1rem', backgroundColor: 'transparent', border: '1px solid var(--accent-gold)', color: 'var(--accent-gold)' }}>The Milasty Story</span>
              <h2 style={{ fontSize: '2.5rem', color: '#FFFFFF', fontFamily: 'var(--font-serif)', fontWeight: '800', marginBottom: '1.25rem', lineHeight: '1.2' }}>From Ancient Grains to <span style={{ color: 'var(--accent-gold)' }}>Modern Snack Rituals.</span></h2>
              <p style={{ color: 'rgba(255, 255, 255, 0.85)', lineHeight: '1.75', marginBottom: '1.5rem', fontWeight: '500' }}>
                We believe that snacking shouldn't require compromising on health or heritage. Our journey began with a simple mission: to reintroduce traditional Indian super-grains like Bajra, Jowar, and Ragi back into modern diets.
              </p>
              <p style={{ color: 'rgba(255, 255, 255, 0.85)', lineHeight: '1.75', marginBottom: '2.25rem', fontWeight: '500' }}>
                Each batch is handcrafted in small quantities, baked in pure Desi Cow Ghee, and sweetened with organic jaggery. Clean labels, honest ingredients, and exceptional taste.
              </p>
              <Link to="/our-story" className="btn-primary" style={{ backgroundColor: '#c89b3c', color: '#FFFFFF', border: 'none', fontWeight: '800', textDecoration: 'none', padding: '0.85rem 2.25rem', borderRadius: '999px', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                <span>Discover Our Story</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 10. FINAL CTA SECTION */}
      <section ref={finalCtaRef} className="reveal-fade-up" style={{ padding: '5rem 0 7rem', backgroundColor: 'transparent' }}>
        <div className="container">
          <div
            style={{
              padding: '5rem 2rem',
              textAlign: 'center',
              backgroundColor: 'transparent',
              color: '#FFFFFF',
              borderRadius: '30px',
              border: '1px solid #FFFFFF',
              position: 'relative',
              overflow: 'hidden',
              backdropFilter: 'none',
              WebkitBackdropFilter: 'none'
            }}
          >
            <h2 style={{ fontSize: '2.8rem', color: '#FFFFFF', marginBottom: '1.25rem', fontFamily: 'var(--font-serif)', fontWeight: '800' }}>
              Ready to Upgrade Your <span style={{ color: 'var(--accent-gold)' }}>Everyday Snack?</span>
            </h2>
            <p style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '1.1rem', maxWidth: '580px', margin: '0 auto 2.5rem', lineHeight: '1.7', fontWeight: '500' }}>
              Discover freshly baked millet cookies made with pure Desi Ghee and organic jaggery. Delivered fresh all across India.
            </p>
            <Link to="/shop" className="btn-primary" style={{ padding: '1.1rem 2.75rem', fontSize: '1.05rem', backgroundColor: '#c89b3c', color: '#FFFFFF', border: 'none', fontWeight: '800', textDecoration: 'none', borderRadius: '999px' }}>
              <span>Shop All Fresh Bakes →</span>
            </Link>
            
            <div style={{ marginTop: '2rem', fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.7)', letterSpacing: '0.05em', fontWeight: '700' }}>
              PAN-INDIA SHIPPING • FRESHLY BAKED ON ORDER
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
