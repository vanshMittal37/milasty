import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles, ShieldCheck, ArrowRight, Award, FileText, CheckCircle2,
  Star, ChevronLeft, ChevronRight, ChevronDown, Heart, ShoppingBag, Eye, Check, X, Quote, Grid,
  Flame, Leaf, Compass, Package, Cookie, HelpCircle
} from 'lucide-react';
import ProductCard from '../components/ProductCard';
import TestimonialSection from '../components/TestimonialSection';
import api from '../api/axios';
import { initialProducts } from '../data/seedData';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

export default function Home() {
  const { addToCart } = useCart();
  const { wishlistItems, toggleWishlist } = useWishlist();

  const snackRitualRef = useRef(null);
  const whyDiffRef = useRef(null);
  const ingredientsRef = useRef(null);

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

  // Real product data & category state
  const [dbProducts, setDbProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategorySlug, setActiveCategorySlug] = useState('cookies');
  const [selectedMood, setSelectedMood] = useState('classic');
  const [activeFaq, setActiveFaq] = useState(null);

  const [scrollY, setScrollY] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 767);

  const videoRef = useRef(null);
  const targetTimeRef = useRef(0);
  const currentTimeRef = useRef(0);
  const isSeekingRef = useRef(false);
  const animationFrameRef = useRef(null);
  const maxScrollRef = useRef(0);
  const homeRef = useRef(null);

  // Default poster URLs
  const DEFAULT_MOBILE_POSTER = "https://res.cloudinary.com/dmm8lfc3x/video/upload/so_0,c_scale,w_480,q_auto:eco/v1787068808/cookie_video.jpg";
  const DEFAULT_DESKTOP_POSTER = "https://res.cloudinary.com/dmm8lfc3x/video/upload/so_0,q_auto/v1787068808/cookie_video.jpg";

  // Video optimization states
  const [videoPlayError, setVideoPlayError] = useState(false);
  const [videoSrc, setVideoSrc] = useState(
    typeof window !== 'undefined' && window.innerWidth <= 767
      ? "https://res.cloudinary.com/dmm8lfc3x/video/upload/c_scale,w_480,q_auto:eco,f_auto/v1787068808/cookie_video.mp4"
      : "https://res.cloudinary.com/dmm8lfc3x/video/upload/q_auto,f_auto/v1787068808/cookie_video.mp4"
  );
  const [videoPoster, setVideoPoster] = useState(
    typeof window !== 'undefined' && window.innerWidth <= 767
      ? DEFAULT_MOBILE_POSTER
      : DEFAULT_DESKTOP_POSTER
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 767);
    };
    window.addEventListener('resize', handleResize);

    const width = window.innerWidth;
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const isSlowConnection = connection && (connection.saveData || (connection.effectiveType && ['slow-2g', '2g', '3g'].includes(connection.effectiveType)));

    if (isSlowConnection) {
      setVideoSrc('');
      setVideoPlayError(true);
    } else {
      if (width <= 767) {
        setVideoSrc("https://res.cloudinary.com/dmm8lfc3x/video/upload/c_scale,w_480,q_auto:eco,f_auto/v1787068808/cookie_video.mp4");
      } else if (width <= 1024) {
        setVideoSrc("https://res.cloudinary.com/dmm8lfc3x/video/upload/c_scale,w_800,q_auto,f_auto/v1787068808/cookie_video.mp4");
      } else {
        setVideoSrc("https://res.cloudinary.com/dmm8lfc3x/video/upload/q_auto,f_auto/v1787068808/cookie_video.mp4");
      }
    }

    if (width <= 767) {
      setVideoPoster(DEFAULT_MOBILE_POSTER);
    } else if (width <= 1024) {
      setVideoPoster("https://res.cloudinary.com/dmm8lfc3x/video/upload/so_0,c_scale,w_800,q_auto/v1787068808/cookie_video.jpg");
    } else {
      setVideoPoster(DEFAULT_DESKTOP_POSTER);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Video playback controller
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isMobile) {
      video.loop = true;
      video.muted = true;
      video.playsInline = true;
      video.playbackRate = 1.0;
      video.play().catch(err => console.log("Video autoplay failed:", err));
    } else {
      video.loop = false;
      video.playbackRate = 1.0;
      video.pause();
      const docHeight = document.documentElement.scrollHeight;
      const viewHeight = window.innerHeight;
      const maxScroll = docHeight - viewHeight;
      maxScrollRef.current = maxScroll > 0 ? maxScroll : 0;
      const progress = maxScrollRef.current > 0 ? window.scrollY / maxScrollRef.current : 0;
      const clampedProgress = Math.max(0, Math.min(1, progress));
      const initialTargetTime = clampedProgress * video.duration;

      targetTimeRef.current = initialTargetTime;
      currentTimeRef.current = initialTargetTime;
      try {
        video.currentTime = initialTargetTime;
      } catch (e) { }
    }
  }, [isMobile, videoSrc]);

  // Video Scrubbing Loop
  useEffect(() => {
    const updateScrollMetrics = () => {
      if (isMobile) return;
      const docHeight = document.documentElement.scrollHeight;
      const viewHeight = window.innerHeight;
      const maxScroll = docHeight - viewHeight;
      maxScrollRef.current = maxScroll > 0 ? maxScroll : 0;

      const video = videoRef.current;
      if (video && video.duration && !isNaN(video.duration)) {
        const progress = maxScrollRef.current > 0 ? window.scrollY / maxScrollRef.current : 0;
        const clampedProgress = Math.max(0, Math.min(1, progress));
        targetTimeRef.current = clampedProgress * video.duration;
      }
    };

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrollY(currentScrollY);

      if (isMobile) return;

      const video = videoRef.current;
      if (!video) return;

      const duration = video.duration;
      if (!duration || isNaN(duration)) return;

      const docHeight = document.documentElement.scrollHeight;
      const viewHeight = window.innerHeight;
      const maxScroll = docHeight - viewHeight;
      const activeMaxScroll = maxScroll > 0 ? maxScroll : 0;
      maxScrollRef.current = activeMaxScroll;

      const progress = activeMaxScroll > 0 ? currentScrollY / activeMaxScroll : 0;
      const clampedProgress = Math.max(0, Math.min(1, progress));

      targetTimeRef.current = clampedProgress * duration;
    };

    const smoothScrubLoop = () => {
      if (!isMobile) {
        const video = videoRef.current;
        if (video && video.duration && !isNaN(video.duration)) {
          const difference = targetTimeRef.current - currentTimeRef.current;
          const lerpedStep = difference * 0.12;
          const maxStep = 0.08;
          const clampedStep = Math.max(-maxStep, Math.min(maxStep, lerpedStep));

          currentTimeRef.current += clampedStep;

          if (currentTimeRef.current < 0) currentTimeRef.current = 0;
          if (currentTimeRef.current > video.duration) currentTimeRef.current = video.duration;

          const delta = Math.abs(video.currentTime - currentTimeRef.current);
          if (delta > 0.015 && !video.seeking && !isSeekingRef.current) {
            isSeekingRef.current = true;
            try {
              video.currentTime = currentTimeRef.current;
            } catch (e) { }
            const releaseLock = () => {
              isSeekingRef.current = false;
              video.removeEventListener('seeked', releaseLock);
            };
            video.addEventListener('seeked', releaseLock, { once: true });
          }
        }
      }
      animationFrameRef.current = requestAnimationFrame(smoothScrubLoop);
    };

    const resizeObserver = new ResizeObserver(() => {
      updateScrollMetrics();
    });
    if (homeRef.current) {
      resizeObserver.observe(homeRef.current);
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', updateScrollMetrics, { passive: true });
    window.addEventListener('load', updateScrollMetrics, { passive: true });
    animationFrameRef.current = requestAnimationFrame(smoothScrubLoop);

    updateScrollMetrics();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', updateScrollMetrics);
      window.removeEventListener('load', updateScrollMetrics);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isMobile]);

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (video) {
      if (isMobile) {
        video.loop = true;
        video.play().catch(err => console.log("Video autoplay failed:", err));
        return;
      }
      video.pause();

      const docHeight = document.documentElement.scrollHeight;
      const viewHeight = window.innerHeight;
      const maxScroll = docHeight - viewHeight;
      maxScrollRef.current = maxScroll > 0 ? maxScroll : 0;

      const progress = maxScrollRef.current > 0 ? window.scrollY / maxScrollRef.current : 0;
      const clampedProgress = Math.max(0, Math.min(1, progress));
      const initialTargetTime = clampedProgress * video.duration;

      targetTimeRef.current = initialTargetTime;
      currentTimeRef.current = initialTargetTime;
      video.currentTime = initialTargetTime;
    }
  };

  // Scroll reveal references
  const heroRef = useScrollReveal();
  const trustRef = useScrollReveal();
  const categoryRef = useScrollReveal();
  const bestsellersRef = useScrollReveal();
  const whyRef = useScrollReveal();
  const customerTestimonialRef = useScrollReveal();
  const moodRef = useScrollReveal();
  const ritualRef = useScrollReveal();
  const labRef = useScrollReveal();
  const storyRef = useScrollReveal();
  const ingredientsSectionRef = useScrollReveal();
  const pillarsRef = useScrollReveal();
  const faqRef = useScrollReveal();
  const finalCtaRef = useScrollReveal();

  // Dynamic Home CMS Data state
  const [homeCms, setHomeCms] = useState({
    eyebrow: "HANDCRAFTED MILLET BAKES",
    heroTitle: "Ancient Grains. Modern Cravings.",
    heroSubtitle: "Delicious cookies, crackers & brownies made with millets, jaggery & desi ghee — crafted for the way you snack today.",
    heroVideoUrl: "https://res.cloudinary.com/dmm8lfc3x/video/upload/q_auto,f_auto/v1787068808/cookie_video.mp4",
    heroPosterUrl: "https://res.cloudinary.com/dmm8lfc3x/video/upload/so_0,q_auto/v1787068808/cookie_video.jpg",
  });

  // Fetch Home CMS data
  useEffect(() => {
    api.get('/home-cms')
      .then(res => {
        if (res.data) {
          setHomeCms(prev => ({ ...prev, ...res.data }));
        }
      })
      .catch(err => console.log('Using default Home CMS content'));
  }, []);

  // Fetch Products & Categories
  useEffect(() => {
    api.get('/products?limit=12')
      .then(res => {
        if (res.data && res.data.products && res.data.products.length > 0) {
          setDbProducts(res.data.products);
        } else {
          setDbProducts(initialProducts);
        }
      })
      .catch(() => {
        setDbProducts(initialProducts);
      });

    api.get('/categories')
      .then(res => {
        if (res.data && Array.isArray(res.data) && res.data.length > 0) {
          setCategories(res.data);
        } else {
          setCategories(defaultCategoryList);
        }
      })
      .catch(() => {
        setCategories(defaultCategoryList);
      });
  }, []);

  // Fallback category dataset
  const defaultCategoryList = [
    { id: 'cookies', slug: 'cookies', name: 'Cookies', label: 'Cookies', subtitle: 'Handcrafted millet cookies in pure Desi Ghee' },
    { id: 'crackers', slug: 'crackers', name: 'Crackers', label: 'Crackers', subtitle: 'Crispy & savory wholesome millet crackers' },
    { id: 'brownies', slug: 'brownies', name: 'Brownies', label: 'Brownies', subtitle: 'Rich, chocolatey millet bakes naturally sweetened' },
    { id: 'gifting', slug: 'gifting', name: 'Gift Hampers', label: 'Gift Hampers', subtitle: 'Artisanal hampers for celebrations' },
  ];

  // Mood filters list
  const moodOptions = [
    { id: 'classic', label: 'I love classic', subtitle: 'Timeless flavours like Cardamom & Desi Ghee', tag: 'classic' },
    { id: 'crunchy', label: 'Light & crunchy', subtitle: 'Crispy crackers & toasted millets', tag: 'crunchy' },
    { id: 'chocolate', label: 'Chocolate cravings', subtitle: 'Deep dark cocoa & rich ragi bakes', tag: 'cocoa' },
    { id: 'wholesome', label: 'Something wholesome', subtitle: 'Nutrient-rich trio of Bajra, Jowar & Ragi', tag: 'wholesome' },
    { id: 'share', label: 'Something to share', subtitle: 'Family packs & artisanal gift hampers', tag: 'gifting' },
  ];

  // FAQs dataset
  const faqs = [
    {
      q: "Do you deliver across India?",
      a: "Yes. We deliver across India using trusted courier partners. Shipping charges are calculated based on your location and total order weight."
    },
    {
      q: "Are the cookies baked fresh?",
      a: "Yes. MILASTY cookies are baked in small batches, often on request, to ensure freshness and quality."
    },
    {
      q: "What is the shelf life of MILASTY cookies?",
      a: "Our cookies are best enjoyed within 45 days when stored in a cool and dry place away from moisture."
    },
    {
      q: "Are MILASTY cookies suitable for families?",
      a: "Our millet cookies are crafted with familiar home-style ingredients and balanced sweetness, making them a thoughtful snack choice for everyday family moments."
    },
    {
      q: "Are the cookies suitable for children?",
      a: "MILASTY cookies are naturally crunchy due to millets. We do not recommend them for children below 6 years of age. For older children, please serve in small pieces under supervision."
    },
    {
      q: "Do your cookies contain gluten or milk?",
      a: "Yes. Our cookies contain a small quantity of whole wheat (atta) and milk powder, so they are not gluten-free or dairy-free."
    }
  ];

  // Ritual products helper
  const allProductsList = dbProducts.length > 0 ? dbProducts : initialProducts;
  const [activeRitualIdx, setActiveRitualIdx] = useState(0);
  const activeRitualProduct = allProductsList[activeRitualIdx] || allProductsList[0];

  return (
    <div ref={homeRef} className="home-page" style={{ backgroundColor: 'transparent', position: 'relative' }}>

      {/* Background Poster Fallback Wrapper */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage: `url(${videoPoster || DEFAULT_MOBILE_POSTER})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />

      {/* Video Background Layer */}
      <div className="home-video-layer" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', overflow: 'hidden', pointerEvents: 'none', zIndex: 1 }}>
        <video
          ref={videoRef}
          muted
          playsInline
          autoPlay={isMobile}
          loop={isMobile}
          preload="auto"
          onLoadedMetadata={handleLoadedMetadata}
          onError={() => setVideoPlayError(true)}
          disablePictureInPicture
          disableRemotePlayback
          poster={videoPoster || DEFAULT_MOBILE_POSTER}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center center',
            willChange: 'contents',
            transform: 'translate3d(0,0,0)',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            display: videoPlayError ? 'none' : 'block'
          }}
        >
          {videoSrc && <source src={videoSrc} type="video/mp4" />}
        </video>
      </div>

      {/* Dark Cover Overlay */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(20, 10, 5, 0.22)',
          zIndex: 2,
          pointerEvents: 'none',
        }}
      />

      {/* Home Main Content Layer */}
      <div className="home-content" style={{ position: 'relative', zIndex: 3 }}>

        {/* ================================================================== */}
        {/* SECTION 1 — HERO                                                   */}
        {/* ================================================================== */}
        <section
          ref={heroRef}
          className="hero-section"
          style={{
            position: 'relative',
            height: isMobile ? 'auto' : '92vh',
            minHeight: isMobile ? 'auto' : '600px',
            overflow: 'hidden',
            backgroundColor: 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxSizing: 'border-box',
            padding: isMobile ? '6rem 1rem 3.5rem' : '0 1.5rem',
          }}
        >
          <div
            className="container hero-content"
            style={{
              position: 'relative',
              zIndex: 3,
              textAlign: 'center',
              color: '#FFFFFF',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: isMobile ? 1 : Math.max(0, 1 - scrollY / 550),
              transform: isMobile ? 'none' : `translateY(${-scrollY * 0.12}px)`,
              transition: isMobile ? 'none' : 'opacity 0.1s ease-out, transform 0.1s ease-out',
            }}
          >
            <span
              style={{
                marginBottom: '1.25rem',
                fontSize: '0.85rem',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--accent-gold)',
                fontWeight: '800',
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.4)'
              }}
            >
              ✦ {homeCms.eyebrow || "HANDCRAFTED MILLET BAKES"}
            </span>

            <h1
              className="hero-heading"
              style={{
                fontSize: 'clamp(2.4rem, 6vw, 4.2rem)',
                lineHeight: '1.12',
                color: '#FFFFFF',
                marginBottom: '1.25rem',
                letterSpacing: '-0.01em',
                fontFamily: 'var(--font-serif)',
                fontWeight: '900',
                textShadow: '0 4px 16px rgba(0, 0, 0, 0.5)',
                maxWidth: '850px'
              }}
            >
              {homeCms.heroTitle || "Ancient Grains. Modern Cravings."}
            </h1>

            <p
              className="hero-subheading"
              style={{
                fontSize: 'clamp(1rem, 2vw, 1.2rem)',
                color: '#FFFFFF',
                lineHeight: '1.7',
                marginBottom: '2.5rem',
                maxWidth: '650px',
                textShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
                fontWeight: '500'
              }}
            >
              {homeCms.heroSubtitle || "Delicious cookies, crackers & brownies made with millets, jaggery & desi ghee — crafted for the way you snack today."}
            </p>

            <div className="hero-buttons" style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
              <Link
                to="/shop"
                className="btn-primary"
                style={{
                  padding: '1rem 2.5rem',
                  fontSize: '0.95rem',
                  backgroundColor: '#c89b3c',
                  color: '#FFFFFF',
                  border: 'none',
                  fontWeight: '800',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  borderRadius: '999px',
                  boxShadow: '0 8px 24px rgba(200, 155, 60, 0.35)'
                }}
              >
                <span>Explore Our Bakes →</span>
              </Link>
              <a
                href="#why-milasty"
                className="btn-secondary"
                style={{
                  padding: '0.95rem 2.25rem',
                  fontSize: '0.95rem',
                  borderColor: '#c89b3c',
                  color: '#c89b3c',
                  fontWeight: '800',
                  backgroundColor: 'rgba(200, 155, 60, 0.12)',
                  borderRadius: '999px',
                  textDecoration: 'none'
                }}
              >
                <span>Why MILASTY?</span>
              </a>
            </div>

            {/* Micro Rating Badge */}
            <div
              style={{
                marginTop: isMobile ? '2rem' : '2.75rem',
                display: 'inline-flex',
                gap: '0.5rem',
                alignItems: 'center',
                fontSize: '0.85rem',
                color: '#FFFDF9',
                fontWeight: '700'
              }}
            >
              <div style={{ display: 'flex', color: '#b9cd94' }}>
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={14} fill="#b9cd94" color="#b9cd94" />
                ))}
              </div>
              <span style={{ color: 'var(--accent-gold)', fontWeight: '800' }}>4.9/5 Loved by 10,000+ Conscious Snackers</span>
            </div>
          </div>
        </section>

        {/* ================================================================== */}
        {/* SECTION 2 — TRUST / USP STRIP                                      */}
        {/* ================================================================== */}
        <section
          ref={trustRef}
          className="reveal-fade-up trust-section"
          style={{
            backgroundColor: 'rgba(20, 10, 5, 0.55)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            padding: '1.75rem 0',
            borderTop: '1px solid rgba(255, 255, 255, 0.15)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
          }}
        >
          <div className="container" style={{ maxWidth: '1240px', margin: '0 auto', padding: '0 1rem' }}>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                alignItems: 'center',
                gap: isMobile ? '0.75rem 1.25rem' : '2.5rem',
                color: '#FFFDF9',
                fontSize: isMobile ? '0.82rem' : '0.95rem',
                fontWeight: '800',
                letterSpacing: '0.02em',
                textAlign: 'center'
              }}
            >
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={18} color="#b9cd94" />
                <span>0% Maida & Palm Oil</span>
              </div>
              <span style={{ color: 'rgba(255, 255, 255, 0.35)', display: isMobile ? 'none' : 'inline' }}>•</span>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                <Flame size={18} color="#b9cd94" />
                <span>Baked in Desi Ghee</span>
              </div>
              <span style={{ color: 'rgba(255, 255, 255, 0.35)', display: isMobile ? 'none' : 'inline' }}>•</span>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={18} color="#b9cd94" />
                <span>Naturally Sweetened with Jaggery</span>
              </div>
              <span style={{ color: 'rgba(255, 255, 255, 0.35)', display: isMobile ? 'none' : 'inline' }}>•</span>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                <Leaf size={18} color="#b9cd94" />
                <span>Made with Millets</span>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================== */}
        {/* SECTION 3 — PRODUCT DISCOVERY BY CATEGORIES                        */}
        {/* ================================================================== */}
        <section
          ref={categoryRef}
          className="reveal-fade-up categories-section"
          style={{
            padding: isMobile ? '4rem 0' : '6rem 0',
            backgroundColor: 'transparent',
            borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
          }}
        >
          <div className="container" style={{ maxWidth: '1240px', margin: '0 auto', padding: '0 1rem' }}>
            
            <div style={{ textAlign: 'center', maxWidth: '660px', margin: '0 auto 3rem' }}>
              <span style={{ fontSize: '0.85rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--accent-gold)', fontWeight: '800', display: 'block', marginBottom: '0.5rem' }}>
                Explore by Category
              </span>
              <h2 style={{ fontSize: isMobile ? '2.1rem' : '2.8rem', color: '#FFFDF9', fontFamily: 'var(--font-serif)', fontWeight: '800', margin: 0, lineHeight: '1.2' }}>
                Something for Every Craving
              </h2>
            </div>

            {/* Category Selector Pills */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: isMobile ? '0.5rem' : '0.75rem',
                marginBottom: '2.5rem'
              }}
            >
              {categories.map((cat) => {
                const isSelected = activeCategorySlug === cat.slug || activeCategorySlug === cat.id;
                return (
                  <button
                    key={cat.id || cat.slug}
                    onClick={() => setActiveCategorySlug(cat.slug || cat.id)}
                    style={{
                      padding: isMobile ? '0.55rem 1.15rem' : '0.75rem 1.5rem',
                      borderRadius: '999px',
                      backgroundColor: isSelected ? '#244f21' : 'rgba(35, 21, 13, 0.65)',
                      border: isSelected ? '1.5px solid #b9cd94' : '1px solid rgba(255, 255, 255, 0.18)',
                      color: isSelected ? '#FFFDF9' : 'rgba(255, 255, 255, 0.8)',
                      backdropFilter: 'blur(12px)',
                      WebkitBackdropFilter: 'blur(12px)',
                      cursor: 'pointer',
                      fontSize: isMobile ? '0.82rem' : '0.9rem',
                      fontWeight: '800',
                      letterSpacing: '0.02em',
                      transition: 'all 0.25s ease',
                      boxShadow: isSelected ? '0 6px 20px rgba(36, 79, 33, 0.45)' : 'none'
                    }}
                  >
                    {cat.name || cat.label}
                  </button>
                );
              })}
            </div>

            {/* Dynamic Category Products Display Grid */}
            <div className="category-products-grid fitted-cards-container-4" style={{ marginBottom: '2.5rem' }}>
              {(() => {
                const slugLower = (activeCategorySlug || '').toLowerCase();
                let filtered = allProductsList.filter(p => {
                  const pCat = (p.category || '').toLowerCase();
                  const pTitle = (p.title || '').toLowerCase();
                  if (slugLower === 'cookies') return pCat === 'cookies' || pCat === 'daily' || pTitle.includes('cookie');
                  if (slugLower === 'crackers') return pCat === 'crackers' || pTitle.includes('cracker') || pTitle.includes('bajra');
                  if (slugLower === 'brownies') return pCat === 'brownies' || pTitle.includes('brownie') || pTitle.includes('cocoa');
                  if (slugLower === 'gifting' || slugLower === 'gift hampers') return pCat === 'gifting' || pCat === 'gifts' || pTitle.includes('hamper') || pTitle.includes('trio');
                  return pCat === slugLower;
                });

                if (filtered.length === 0) {
                  filtered = allProductsList.slice(0, 4);
                }

                return filtered.slice(0, 4).map((product) => (
                  <ProductCard key={product._id || product.slug} product={product} />
                ));
              })()}
            </div>

            <div style={{ textAlign: 'center' }}>
              <Link
                to="/shop"
                className="btn-primary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.85rem 2rem',
                  backgroundColor: 'rgba(36, 79, 33, 0.8)',
                  color: '#FFFFFF',
                  border: '1.5px solid #b9cd94',
                  borderRadius: '999px',
                  fontWeight: '800',
                  fontSize: '0.9rem',
                  textDecoration: 'none',
                  transition: 'all 0.3s ease'
                }}
              >
                <span>Browse Full {categories.find(c => c.slug === activeCategorySlug)?.name || 'Category'} Shop →</span>
              </Link>
            </div>

          </div>
        </section>

        {/* ================================================================== */}
        {/* SECTION 4 — BESTSELLERS                                            */}
        {/* ================================================================== */}
        <section
          ref={bestsellersRef}
          className="reveal-fade-up bestsellers-section"
          style={{
            padding: isMobile ? '4rem 0' : '6.5rem 0',
            backgroundColor: 'transparent',
            borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
          }}
        >
          <div className="container" style={{ maxWidth: '1240px', margin: '0 auto', padding: '0 1rem' }}>
            
            <div style={{ textAlign: 'center', maxWidth: '660px', margin: '0 auto 3rem' }}>
              <span style={{ fontSize: '0.85rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--accent-gold)', fontWeight: '800', display: 'block', marginBottom: '0.5rem' }}>
                THE ONES PEOPLE COME BACK FOR
              </span>
              <h2 style={{ fontSize: isMobile ? '2.1rem' : '2.8rem', color: '#FFFDF9', fontFamily: 'var(--font-serif)', fontWeight: '800', margin: '0 0 0.75rem', lineHeight: '1.2' }}>
                Your Next <span style={{ color: 'var(--accent-gold)' }}>Favourite Bake</span>
              </h2>
              <p style={{ color: 'rgba(255, 255, 255, 0.88)', fontSize: isMobile ? '0.92rem' : '1.05rem', margin: 0, fontWeight: '500' }}>
                Discover the MILASTY bestsellers loved by our customers.
              </p>
            </div>

            {/* Bestseller Product Cards Grid */}
            <div className="bestsellers-grid fitted-cards-container-4" style={{ marginBottom: '3rem' }}>
              {(() => {
                const bestsellers = allProductsList.filter(p => p.isFeatured || (p.badges && p.badges.some(b => b.toLowerCase().includes('bestseller'))));
                const listToDisplay = bestsellers.length > 0 ? bestsellers : allProductsList;
                return listToDisplay.slice(0, 4).map((product) => (
                  <ProductCard key={product._id || product.slug} product={product} />
                ));
              })()}
            </div>

            <div style={{ textAlign: 'center' }}>
              <Link
                to="/shop"
                className="btn-primary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  padding: isMobile ? '0.85rem 1.85rem' : '1rem 2.5rem',
                  backgroundColor: '#244f21',
                  color: '#FFFFFF',
                  border: '1.5px solid #b9cd94',
                  borderRadius: '999px',
                  fontWeight: '850',
                  fontSize: '0.92rem',
                  letterSpacing: '0.04em',
                  textDecoration: 'none',
                  boxShadow: '0 8px 24px rgba(36, 79, 33, 0.35)'
                }}
              >
                <span>EXPLORE ALL BESTSELLERS</span>
                <ArrowRight size={18} color="#b9cd94" />
              </Link>
            </div>

          </div>
        </section>

        {/* ================================================================== */}
        {/* SECTION 5 — WHY MILASTY                                           */}
        {/* ================================================================== */}
        <section
          id="why-milasty"
          ref={whyRef}
          className="reveal-fade-up why-section"
          style={{
            backgroundColor: 'transparent',
            padding: isMobile ? '4rem 0' : '6.5rem 0',
            borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
          }}
        >
          <div style={{ maxWidth: '1080px', margin: '0 auto', padding: '0 1rem' }}>
            
            <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
              <span style={{ fontSize: '0.85rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--accent-gold)', fontWeight: '800', display: 'block', marginBottom: '0.5rem' }}>
                WHY MILASTY?
              </span>
              <h2 style={{ fontSize: isMobile ? '2.1rem' : '2.8rem', fontFamily: 'var(--font-serif)', color: '#FFFDF9', fontWeight: '850', marginBottom: '0.75rem' }}>
                Because Better Ingredients Matter.
              </h2>
              <p style={{ fontSize: isMobile ? '0.92rem' : '1.05rem', color: '#F5EBDD', fontWeight: '500', maxWidth: '650px', margin: '0 auto' }}>
                Thoughtfully made bakes, with ingredients you can recognise and flavours you’ll genuinely crave.
              </p>
            </div>

            {/* Premium Two-Column Comparison Cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                gap: '2rem',
              }}
            >
              {/* LEFT COLUMN: WHAT GOES INTO MILASTY */}
              <div
                className="glass-card"
                style={{
                  borderRadius: '24px',
                  padding: isMobile ? '1.75rem 1.25rem' : '2.25rem',
                  backgroundColor: 'rgba(36, 79, 33, 0.55)',
                  border: '1.5px solid #b9cd94',
                  boxShadow: '0 16px 40px rgba(0, 0, 0, 0.4)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.75rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(185, 205, 148, 0.3)' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#244f21', border: '1px solid #b9cd94', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckCircle2 size={18} color="#b9cd94" />
                  </div>
                  <h3 style={{ fontSize: '1.2rem', color: '#FFFDF9', fontWeight: '900', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    WHAT GOES INTO MILASTY
                  </h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem' }}>
                  {[
                    { title: "1. Millets at the Heart", desc: "Ragi, Jowar & Bajra thoughtfully brought into everyday bakes." },
                    { title: "2. Desi ghee & jaggery", desc: "Rich, familiar ingredients chosen for flavor as well as tradition." },
                    { title: "3. Small-batch craftsmanship", desc: "Made with care, not just made at scale." },
                    { title: "4. Ingredient transparency", desc: "We believe you should know exactly what goes into your snack." }
                  ].map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
                      <span style={{ color: '#b9cd94', fontWeight: '900', fontSize: '1.1rem', lineHeight: '1.2' }}>✓</span>
                      <div>
                        <h4 style={{ fontSize: '1rem', color: '#FFFDF9', fontWeight: '800', margin: '0 0 0.25rem' }}>{item.title}</h4>
                        <p style={{ fontSize: '0.88rem', color: 'rgba(255, 255, 255, 0.85)', margin: 0, lineHeight: '1.5' }}>{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* RIGHT COLUMN: WHAT WE CHOOSE TO LEAVE OUT */}
              <div
                className="glass-card"
                style={{
                  borderRadius: '24px',
                  padding: isMobile ? '1.75rem 1.25rem' : '2.25rem',
                  backgroundColor: 'rgba(35, 21, 13, 0.65)',
                  border: '1.5px solid rgba(255, 255, 255, 0.2)',
                  boxShadow: '0 16px 40px rgba(0, 0, 0, 0.4)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.75rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.15)' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(220, 50, 50, 0.2)', border: '1px solid rgba(255, 100, 100, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <X size={18} color="#ff8888" />
                  </div>
                  <h3 style={{ fontSize: '1.2rem', color: '#FFFDF9', fontWeight: '900', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    WHAT WE CHOOSE TO LEAVE OUT
                  </h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem' }}>
                  {[
                    { title: "1. No maida", desc: "We don't use refined wheat flour in our millet cookies." },
                    { title: "2. No palm oil or vegetable oil", desc: "We choose not to use palm oil or vegetable oil (dalda) in our recipes." },
                    { title: "3. No added refined sugar", desc: "We sweeten our recipes with jaggery instead." },
                    { title: "4. No unnecessary emulsifier, chemicals or additives", desc: "We keep our recipes thoughtfully simple." }
                  ].map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
                      <span style={{ color: '#ff8888', fontWeight: '900', fontSize: '1.1rem', lineHeight: '1.2' }}>✕</span>
                      <div>
                        <h4 style={{ fontSize: '1rem', color: '#FFFDF9', fontWeight: '800', margin: '0 0 0.25rem' }}>{item.title}</h4>
                        <p style={{ fontSize: '0.88rem', color: 'rgba(255, 255, 255, 0.80)', margin: 0, lineHeight: '1.5' }}>{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ================================================================== */}
        {/* EXISTING TESTIMONIAL / CUSTOMER REVIEWS SECTION                    */}
        {/* CRITICAL: PRESERVED EXACTLY IN ITS ORIGINAL POSITION              */}
        {/* ================================================================== */}
        <div ref={customerTestimonialRef} className="reveal-fade-up">
          <TestimonialSection />
        </div>

        {/* ================================================================== */}
        {/* SECTION 6 — PRODUCT DISCOVERY BY MOOD                              */}
        {/* ================================================================== */}
        <section
          ref={moodRef}
          className="reveal-fade-up mood-section"
          style={{
            padding: isMobile ? '4rem 0' : '6.5rem 0',
            backgroundColor: 'transparent',
            borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
          }}
        >
          <div className="container" style={{ maxWidth: '1240px', margin: '0 auto', padding: '0 1rem' }}>
            
            <div style={{ textAlign: 'center', maxWidth: '660px', margin: '0 auto 3rem' }}>
              <span style={{ fontSize: '0.85rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--accent-gold)', fontWeight: '800', display: 'block', marginBottom: '0.5rem' }}>
                NOT SURE WHERE TO START?
              </span>
              <h2 style={{ fontSize: isMobile ? '2.1rem' : '2.8rem', color: '#FFFDF9', fontFamily: 'var(--font-serif)', fontWeight: '800', margin: '0 0 0.75rem', lineHeight: '1.2' }}>
                Find Your Perfect <span style={{ color: 'var(--accent-gold)' }}>MILASTY Snack</span>
              </h2>
              <p style={{ color: 'rgba(255, 255, 255, 0.88)', fontSize: isMobile ? '0.92rem' : '1.05rem', margin: 0, fontWeight: '500' }}>
                Something light. Something crunchy. Something chocolatey. Or something to share.
              </p>
            </div>

            {/* Mood Category Selector Options */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: isMobile ? '0.55rem' : '0.85rem',
                marginBottom: '2.5rem'
              }}
            >
              {moodOptions.map((mood) => {
                const isSelected = selectedMood === mood.id;
                return (
                  <button
                    key={mood.id}
                    onClick={() => setSelectedMood(mood.id)}
                    style={{
                      padding: isMobile ? '0.65rem 1.15rem' : '0.85rem 1.65rem',
                      borderRadius: '999px',
                      backgroundColor: isSelected ? '#244f21' : 'rgba(35, 21, 13, 0.65)',
                      border: isSelected ? '1.5px solid #b9cd94' : '1px solid rgba(255, 255, 255, 0.18)',
                      color: isSelected ? '#FFFDF9' : 'rgba(255, 255, 255, 0.85)',
                      backdropFilter: 'blur(16px)',
                      WebkitBackdropFilter: 'blur(16px)',
                      cursor: 'pointer',
                      fontSize: isMobile ? '0.82rem' : '0.92rem',
                      fontWeight: '800',
                      transition: 'all 0.25s ease',
                      boxShadow: isSelected ? '0 8px 24px rgba(36, 79, 33, 0.45)' : 'none'
                    }}
                  >
                    <span>{mood.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Mood Filtered Products Cards */}
            <div className="mood-products-grid fitted-cards-container-4" style={{ marginBottom: '2.5rem' }}>
              {(() => {
                const currentMoodObj = moodOptions.find(m => m.id === selectedMood);
                const tag = currentMoodObj ? currentMoodObj.tag : 'classic';
                let filtered = allProductsList.filter(p => {
                  const title = (p.title || '').toLowerCase();
                  const desc = (p.description || '').toLowerCase();
                  const cat = (p.category || '').toLowerCase();
                  if (tag === 'classic') return title.includes('cardamom') || title.includes('bajra') || cat === 'daily';
                  if (tag === 'crunchy') return title.includes('cracker') || title.includes('jowar') || desc.includes('crunch');
                  if (tag === 'cocoa') return title.includes('cocoa') || title.includes('ragi') || title.includes('chocolate');
                  if (tag === 'wholesome') return title.includes('trio') || cat === 'starter' || p.isFeatured;
                  if (tag === 'gifting') return title.includes('hamper') || title.includes('box') || cat === 'gifts';
                  return true;
                });

                if (filtered.length === 0) filtered = allProductsList.slice(0, 4);

                return filtered.slice(0, 4).map((product) => (
                  <ProductCard key={product._id || product.slug} product={product} />
                ));
              })()}
            </div>

            <div style={{ textAlign: 'center' }}>
              <Link
                to="/shop"
                className="btn-primary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.85rem 2rem',
                  backgroundColor: '#244f21',
                  color: '#FFFFFF',
                  border: '1.5px solid #b9cd94',
                  borderRadius: '999px',
                  fontWeight: '800',
                  fontSize: '0.9rem',
                  textDecoration: 'none'
                }}
              >
                <span>EXPLORE ALL SNACKS</span>
                <ArrowRight size={16} color="#b9cd94" />
              </Link>
            </div>

          </div>
        </section>

        {/* ================================================================== */}
        {/* EXISTING INTERACTIVE MILLET RITUAL SECTION                         */}
        {/* ================================================================== */}
        <section ref={ritualRef} className="reveal-fade-up ritual-section desktop-only-section" style={{ display: isMobile ? 'none' : 'block', padding: '6.5rem 0', backgroundColor: 'transparent', borderBottom: '1px solid rgba(255, 255, 255, 0.15)' }}>
          <div className="container">
            <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 4rem' }}>
              <span style={{ display: 'inline-block', marginBottom: '0.75rem', fontSize: '0.85rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent-gold)', fontWeight: '800' }}>Interactive Selection</span>
              <h2 style={{ fontSize: '2.6rem', color: '#FFFFFF', fontFamily: 'var(--font-serif)', fontWeight: '800' }}>Discover Your Perfect <span style={{ color: 'var(--accent-gold)' }}>Millet Ritual</span></h2>
            </div>

            <div className="desktop-ritual-view ritual-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '3.5rem', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {allProductsList.slice(0, 4).map((item, idx) => {
                  const isSelected = activeRitualIdx === idx;
                  return (
                    <div
                      key={item._id || item.slug || idx}
                      onClick={() => setActiveRitualIdx(idx)}
                      style={{
                        padding: '1.25rem 1.5rem',
                        borderRadius: '16px',
                        backgroundColor: isSelected ? 'rgba(35, 21, 13, 0.82)' : 'rgba(35, 21, 13, 0.50)',
                        border: isSelected ? '1.5px solid var(--accent-gold)' : '1px solid rgba(255, 255, 255, 0.12)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        cursor: 'pointer',
                        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                        <span style={{ fontSize: '1.25rem', fontFamily: "var(--font-serif)", fontWeight: '700', color: isSelected ? 'var(--accent-gold)' : 'rgba(255, 255, 255, 0.6)' }}>
                          0{idx + 1}
                        </span>
                        <h3 className="ritual-item-title" style={{ fontSize: '1.15rem', color: '#FFFFFF', fontWeight: '500', margin: 0 }}>{item.title}</h3>
                      </div>
                      <ArrowRight size={18} style={{ color: '#FFFFFF', transform: isSelected ? 'translateX(4px)' : 'translateX(0)', transition: 'transform 0.2s' }} />
                    </div>
                  );
                })}
              </div>

              <div className="ritual-showcase" style={{ padding: '2.5rem' }}>
                <div style={{ position: 'relative', height: '300px', borderRadius: '16px', overflow: 'hidden', marginBottom: '1.75rem', backgroundColor: 'transparent' }}>
                  <img src={activeRitualProduct.image} alt={activeRitualProduct.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <h3 style={{ fontSize: '1.6rem', color: '#FFFFFF', marginBottom: '0.5rem', fontFamily: 'var(--font-serif)', fontWeight: '800' }}>{activeRitualProduct.title}</h3>
                <p style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '0.95rem', lineHeight: '1.65', marginBottom: '1.5rem', fontWeight: '500' }}>{activeRitualProduct.description}</p>

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
                    <span style={{ fontSize: '1.5rem', fontWeight: '900', color: '#FFFFFF' }}>₹{activeRitualProduct.variants?.[0]?.price || activeRitualProduct.price || 139}</span>
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

        {/* ================================================================== */}
        {/* SECTION 7 — WHAT GOES INTO EVERY BAKE                              */}
        {/* ================================================================== */}
        <section
          ref={ingredientsSectionRef}
          className="reveal-fade-up honest-baking-section"
          style={{
            backgroundColor: 'transparent',
            padding: isMobile ? '4rem 0' : '6.5rem 0',
            borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
          }}
        >
          <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '0 1rem' }}>
            
            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'flex-end', marginBottom: '3.5rem', gap: '1.5rem' }}>
              <div>
                <span style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#b9cd94', fontWeight: '850', display: 'block', marginBottom: '0.5rem' }}>
                  HONEST INGREDIENTS
                </span>
                <h2 style={{ fontSize: isMobile ? '2.1rem' : '2.8rem', fontFamily: 'var(--font-serif)', color: '#FFFDF9', fontWeight: '850', margin: '0 0 0.75rem', textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
                  Know What Goes Into Your Bite.
                </h2>
                <p style={{ color: 'rgba(255, 255, 255, 0.88)', fontSize: isMobile ? '0.92rem' : '1.05rem', margin: 0, fontWeight: '500', maxWidth: '640px' }}>
                  We believe you deserve to know what's in the food you eat. That's why we keep our ingredients transparent and our labels easy to understand.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <Link
                  to="/nutrition"
                  className="btn-primary"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.85rem 1.85rem',
                    backgroundColor: '#c89b3c',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '999px',
                    fontWeight: '800',
                    fontSize: '0.9rem',
                    textDecoration: 'none',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <span>Explore Our Ingredients →</span>
                </Link>
                <div className="section-scroll-buttons" style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    onClick={() => scrollLeft(ingredientsRef)} 
                    style={{ backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(245,235,221,0.25)', color: '#FFFDF9', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button 
                    onClick={() => scrollRight(ingredientsRef)} 
                    style={{ backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(245,235,221,0.25)', color: '#FFFDF9', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>

            <div 
              ref={ingredientsRef}
              className="horizontal-scroll-container fitted-cards-container-4"
            >
              {[
                { name: 'BAJRA', type: 'Pearl Millet', desc: 'Powerhouse of fiber, magnesium, and essential nutrients.', img: '/images/bajra.jpeg' },
                { name: 'JOWAR', type: 'Sorghum Millet', desc: 'Gluten-free grain that aids digestion and regulates blood sugar.', img: '/images/jowar.jpeg' },
                { name: 'RAGI', type: 'Finger Millet', desc: 'Calcium-rich grain that builds bone strength naturally.', img: '/images/ragi.jpeg' },
                { name: 'DESI GHEE', type: 'Pure Cow Ghee', desc: 'Rich in A2 fats, vitamins, providing aroma and crisp texture.', img: '/images/ghee.jpeg' },
              ].map((ingredient) => (
                <div key={ingredient.name} className="glass-card" style={{ textAlign: 'center', width: '100%', padding: '1.75rem 1.25rem', borderRadius: '20px' }}>
                  <img 
                    src={ingredient.img} 
                    alt={ingredient.name} 
                    style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(185, 205, 148, 0.4)', margin: '0 auto 1.25rem', display: 'block', boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }} 
                  />
                  <h4 style={{ fontSize: '1.05rem', fontWeight: '850', color: '#FFFDF9', margin: '0 0 0.2rem 0' }}>{ingredient.name}</h4>
                  <span style={{ fontSize: '0.8rem', color: '#b9cd94', fontWeight: '850', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{ingredient.type}</span>
                  <p style={{ fontSize: '0.85rem', color: '#F5EBDD', lineHeight: '1.55', marginTop: '0.45rem', padding: '0 0.5rem', fontWeight: '550' }}>{ingredient.desc}</p>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* ================================================================== */}
        {/* SECTION 8 — MILASTY 4 PILLARS                                      */}
        {/* ================================================================== */}
        <section
          ref={pillarsRef}
          className="reveal-fade-up pillars-section"
          style={{
            padding: isMobile ? '4rem 0' : '6.5rem 0',
            backgroundColor: 'transparent',
            borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
          }}
        >
          <div className="container" style={{ maxWidth: '1240px', margin: '0 auto', padding: '0 1rem' }}>
            
            <div style={{ textAlign: 'center', maxWidth: '660px', margin: '0 auto 3.5rem' }}>
              <span style={{ fontSize: '0.85rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--accent-gold)', fontWeight: '800', display: 'block', marginBottom: '0.5rem' }}>
                OUR PROMISE
              </span>
              <h2 style={{ fontSize: isMobile ? '2.1rem' : '2.8rem', color: '#FFFDF9', fontFamily: 'var(--font-serif)', fontWeight: '800', margin: '0 0 0.75rem', lineHeight: '1.2' }}>
                Some Things We Simply <span style={{ color: 'var(--accent-gold)' }}>Won't Compromise On.</span>
              </h2>
              <p style={{ color: 'rgba(255, 255, 255, 0.88)', fontSize: isMobile ? '0.92rem' : '1.05rem', margin: 0, fontWeight: '500' }}>
                Because “healthy” shouldn't be a marketing trick. It should be reflected in the ingredients.
              </p>
            </div>

            {/* 4 Pillars Cards Grid */}
            <div className="fitted-cards-container-4" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: '1.5rem' }}>
              {[
                {
                  pillar: 'PILLAR 1',
                  title: 'Millets at the Heart',
                  desc: 'Ragi, Jowar & Bajra — ancient Indian grains, reimagined for modern snacking.',
                  icon: Leaf
                },
                {
                  pillar: 'PILLAR 2',
                  title: 'Made the Traditional Way',
                  desc: 'Baked in desi ghee and sweetened with jaggery.',
                  icon: Flame
                },
                {
                  pillar: 'PILLAR 3',
                  title: 'Clean by Choice',
                  desc: 'No maida. No palm oil. No added refined sugar. No unnecessary additives.',
                  icon: ShieldCheck
                },
                {
                  pillar: 'PILLAR 4',
                  title: 'Taste Comes First',
                  desc: 'Because a better snack is only better if you actually want another bite.',
                  icon: Sparkles
                }
              ].map((p, idx) => {
                const IconComp = p.icon;
                return (
                  <div
                    key={idx}
                    className="glass-card"
                    style={{
                      borderRadius: '24px',
                      padding: '2rem 1.5rem',
                      backgroundColor: 'rgba(35, 21, 13, 0.65)',
                      border: '1px solid rgba(255, 255, 255, 0.18)',
                      boxShadow: '0 12px 32px rgba(0, 0, 0, 0.35)',
                      display: 'flex',
                      flexDirection: 'column',
                      height: '100%',
                      boxSizing: 'border-box'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: '850', color: 'var(--accent-gold)', letterSpacing: '0.08em', textTransform: 'uppercase', backgroundColor: 'rgba(200, 155, 60, 0.15)', padding: '0.25rem 0.65rem', borderRadius: '999px', border: '1px solid rgba(200, 155, 60, 0.3)' }}>
                        {p.pillar}
                      </span>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#244f21', border: '1px solid #b9cd94', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <IconComp size={18} color="var(--accent-gold)" />
                      </div>
                    </div>

                    <h3 style={{ fontSize: '1.25rem', color: '#FFFDF9', fontFamily: 'var(--font-serif)', fontWeight: '850', marginBottom: '0.75rem', lineHeight: '1.25' }}>
                      {p.title}
                    </h3>

                    <p style={{ fontSize: '0.9rem', color: '#F5EBDD', lineHeight: '1.6', margin: 0, fontWeight: '500' }}>
                      {p.desc}
                    </p>
                  </div>
                );
              })}
            </div>

          </div>
        </section>

        {/* ================================================================== */}
        {/* SECTION 9 — FAQs                                                  */}
        {/* ================================================================== */}
        <section
          ref={faqRef}
          className="reveal-fade-up faq-section"
          style={{
            padding: isMobile ? '4rem 0' : '6.5rem 0',
            backgroundColor: 'transparent',
            borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
          }}
        >
          <div className="container" style={{ maxWidth: '800px', margin: '0 auto', padding: '0 1rem' }}>
            
            <div style={{ textAlign: 'center', marginBottom: isMobile ? '2.25rem' : '3.5rem' }}>
              <span style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--accent-gold)', fontWeight: '800', display: 'block', marginBottom: '0.5rem' }}>
                HELP CENTER
              </span>
              <h2 style={{ fontSize: isMobile ? '2rem' : '2.8rem', fontFamily: 'var(--font-serif)', color: '#FFFDF9', fontWeight: '800', margin: 0, lineHeight: '1.2' }}>
                Frequently Asked <span style={{ color: 'var(--accent-gold)' }}>Questions</span>
              </h2>
            </div>

            {/* Accordion FAQ UI */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {faqs.map((faq, idx) => {
                const isOpen = activeFaq === idx;
                return (
                  <div 
                    key={idx} 
                    className="glass-card"
                    style={{ 
                      borderRadius: '20px', 
                      backgroundColor: 'rgba(35, 21, 13, 0.75)',
                      backdropFilter: 'blur(16px)',
                      WebkitBackdropFilter: 'blur(16px)',
                      border: isOpen ? '1.5px solid var(--accent-gold)' : '1px solid rgba(255, 255, 255, 0.15)',
                      boxShadow: isOpen ? '0 12px 32px rgba(0, 0, 0, 0.4)' : '0 4px 16px rgba(0, 0, 0, 0.2)',
                      overflow: 'hidden',
                      boxSizing: 'border-box',
                      width: '100%',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <button
                      onClick={() => setActiveFaq(isOpen ? null : idx)}
                      style={{
                        width: '100%',
                        padding: isMobile ? '1.1rem 1.25rem' : '1.35rem 1.75rem',
                        backgroundColor: 'transparent',
                        border: 'none',
                        textAlign: 'left',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        outline: 'none',
                        gap: '1rem'
                      }}
                    >
                      <span style={{ fontSize: isMobile ? '0.92rem' : '1.05rem', fontWeight: '800', color: '#FFFDF9', flex: 1, fontFamily: 'var(--font-sans)' }}>
                        {faq.q}
                      </span>
                      <ChevronDown 
                        size={20} 
                        style={{ 
                          color: 'var(--accent-gold)', 
                          transform: isOpen ? 'rotate(180deg)' : 'rotate(0)', 
                          transition: 'transform 0.3s ease',
                          flexShrink: 0
                        }} 
                      />
                    </button>
                    
                    {isOpen && (
                      <div style={{ padding: isMobile ? '0 1.25rem 1.25rem 1.25rem' : '0 1.75rem 1.5rem 1.75rem', fontSize: isMobile ? '0.88rem' : '0.95rem', color: 'rgba(255, 255, 255, 0.88)', lineHeight: '1.65', fontWeight: '500', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '1rem' }}>
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

          </div>
        </section>

        {/* ================================================================== */}
        {/* SECTION 10 — FINAL CTA                                             */}
        {/* ================================================================== */}
        <section
          ref={finalCtaRef}
          className="reveal-fade-up cta-section"
          style={{ padding: isMobile ? '4rem 0 5rem' : '5.5rem 0 7rem', backgroundColor: 'transparent' }}
        >
          <div className="container" style={{ maxWidth: '960px', margin: '0 auto', padding: '0 1rem' }}>
            <div
              className="glass-card cta-card"
              style={{
                padding: isMobile ? '3.5rem 1.5rem' : '5rem 2.5rem',
                textAlign: 'center',
                color: '#FFFFFF',
                position: 'relative',
                borderRadius: '32px',
                border: '1.5px solid rgba(200, 155, 60, 0.4)',
                backgroundColor: 'rgba(36, 79, 33, 0.50)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                overflow: 'hidden',
              }}
            >
              <h2 style={{ fontSize: isMobile ? '2.1rem' : '3.2rem', color: '#FFFFFF', marginBottom: '1.25rem', fontFamily: 'var(--font-serif)', fontWeight: '800', lineHeight: '1.18' }}>
                Ready to Upgrade Your <span style={{ color: 'var(--accent-gold)' }}>Everyday Snack?</span>
              </h2>
              
              <p style={{ color: 'rgba(255, 255, 255, 0.92)', fontSize: isMobile ? '0.95rem' : '1.15rem', maxWidth: '620px', margin: '0 auto 2.5rem', lineHeight: '1.7', fontWeight: '500' }}>
                Discover freshly baked millet snacks & desserts made with pure Desi Ghee and Organic Jaggery. Delivered fresh all across India.
              </p>
              
              <Link
                to="/shop"
                className="btn-primary"
                style={{
                  padding: isMobile ? '0.95rem 2.2rem' : '1.1rem 2.75rem',
                  fontSize: isMobile ? '0.95rem' : '1.05rem',
                  backgroundColor: '#c89b3c',
                  color: '#FFFFFF',
                  border: 'none',
                  fontWeight: '800',
                  textDecoration: 'none',
                  borderRadius: '999px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  boxShadow: '0 10px 30px rgba(200, 155, 60, 0.4)'
                }}
              >
                <span>Explore all Fresh Bakes →</span>
              </Link>

              <div style={{ marginTop: '2.25rem', fontSize: '0.85rem', color: '#b9cd94', letterSpacing: '0.08em', fontWeight: '800', textTransform: 'uppercase' }}>
                Pan-India Shipping • Freshly Baked on Order
              </div>
            </div>
          </div>
        </section>

      </div> {/* Close home-content */}

      {/* Global & Responsive CSS Overrides */}
      <style>{`
        .horizontal-scroll-container::-webkit-scrollbar {
          display: none !important;
        }
        .horizontal-scroll-container {
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
        }
        .fitted-cards-container-4 {
          display: grid !important;
          grid-template-columns: repeat(4, 1fr) !important;
          gap: 1.5rem !important;
          width: 100% !important;
          box-sizing: border-box !important;
        }
        .fitted-cards-container-4 .glass-card {
          width: 100% !important;
          max-width: 100% !important;
          min-width: 0 !important;
          box-sizing: border-box !important;
        }
        @media (max-width: 1024px) {
          .fitted-cards-container-4 {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 1.25rem !important;
          }
        }
        @media (max-width: 640px) {
          .fitted-cards-container-4 {
            display: flex !important;
            grid-template-columns: none !important;
            overflow-x: auto !important;
            scroll-behavior: smooth !important;
            padding-bottom: 1.25rem !important;
            gap: 1rem !important;
            -webkit-overflow-scrolling: touch;
          }
          .fitted-cards-container-4 .glass-card {
            flex: 0 0 270px !important;
            width: 270px !important;
            max-width: 270px !important;
            min-width: 270px !important;
          }
        }
      `}</style>

    </div>
  );
}
