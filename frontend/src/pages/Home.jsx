import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles, ShieldCheck, ArrowRight, Award, FileText, CheckCircle2,
  Star, ChevronLeft, ChevronRight, Heart, ShoppingBag, Eye, Check, X, Quote, Grid
} from 'lucide-react';
import ProductCard from '../components/ProductCard';
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

  // Real product data state
  const [dbProducts, setDbProducts] = useState([]);
  const [activeReviewIdx, setActiveReviewIdx] = useState(0);
  const [activeRitualIdx, setActiveRitualIdx] = useState(0);
  const [activeMobileTransparencyIdx, setActiveMobileTransparencyIdx] = useState(0);
  const [activeMobileVsIdx, setActiveMobileVsIdx] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 767);

  const videoRef = useRef(null);

  // Scroll control tracking refs
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
      // Extremely slow connection: directly disable video, fallback to poster
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

  // Control playback states based on isMobile mode
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
      // Instantly sync time on desktop/tablet layout switch
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

  // Silky-Smooth Scroll-Driven Video Scrubbing (Forward & Backward)
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

      // Live recalculation on scroll to ensure absolute synchronization
      const docHeight = document.documentElement.scrollHeight;
      const viewHeight = window.innerHeight;
      const maxScroll = docHeight - viewHeight;
      const activeMaxScroll = maxScroll > 0 ? maxScroll : 0;
      maxScrollRef.current = activeMaxScroll;

      // Calculate progress mapped to entire page scrollable distance
      const progress = activeMaxScroll > 0 ? currentScrollY / activeMaxScroll : 0;
      const clampedProgress = Math.max(0, Math.min(1, progress));

      // Update target time ref
      targetTimeRef.current = clampedProgress * duration;
    };

    const smoothScrubLoop = () => {
      if (!isMobile) {
        const video = videoRef.current;
        if (video && video.duration && !isNaN(video.duration)) {
          // Smooth lerp — 0.12 gives snappy but fluid motion
          const difference = targetTimeRef.current - currentTimeRef.current;
          const lerpedStep = difference * 0.12;

          // Cap max jump per frame to avoid aggressive seeking on fast swipes
          const maxStep = 0.08;
          const clampedStep = Math.max(-maxStep, Math.min(maxStep, lerpedStep));

          currentTimeRef.current += clampedStep;

          // Keep within bounds
          if (currentTimeRef.current < 0) currentTimeRef.current = 0;
          if (currentTimeRef.current > video.duration) currentTimeRef.current = video.duration;

          // Only seek if delta meaningful AND video is NOT already seeking
          const delta = Math.abs(video.currentTime - currentTimeRef.current);
          if (delta > 0.015 && !video.seeking && !isSeekingRef.current) {
            isSeekingRef.current = true;
            try {
              video.currentTime = currentTimeRef.current;
            } catch (e) { }
            // Release seek lock only after browser confirms seek is done
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

    // Setup ResizeObserver to watch for Home page container size/height updates
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

    // Initial calculation
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

      // Force recalculate scrollable range on metadata loaded
      const docHeight = document.documentElement.scrollHeight;
      const viewHeight = window.innerHeight;
      const maxScroll = docHeight - viewHeight;
      maxScrollRef.current = maxScroll > 0 ? maxScroll : 0;

      // Instantly synchronize frame to current scroll position (e.g. on page refresh)
      const progress = maxScrollRef.current > 0 ? window.scrollY / maxScrollRef.current : 0;
      const clampedProgress = Math.max(0, Math.min(1, progress));
      const initialTargetTime = clampedProgress * video.duration;

      targetTimeRef.current = initialTargetTime;
      currentTimeRef.current = initialTargetTime;
      video.currentTime = initialTargetTime;
    }
  };

  const heroRef = useScrollReveal();
  const trustRef = useScrollReveal();
  const whyRef = useScrollReveal();
  const customerTestimonialRef = useScrollReveal();
  const catalogueRef = useScrollReveal();
  const favRef = useScrollReveal();
  const ritualRef = useScrollReveal();
  const timelineRef = useScrollReveal();
  const labRef = useScrollReveal();
  const reviewRef = useScrollReveal();
  const storyRef = useScrollReveal();
  const finalCtaRef = useScrollReveal();

  /* -------------------------------------------------------------------------- */
  /* HOME CATALOGUE SECTION STATE (DATA-DRIVEN CATEGORY SELECTION)             */
  /* -------------------------------------------------------------------------- */
  const homeCatalogueCategories = [
    { id: 'starter', number: '01', name: 'STARTER FAVOURITES', subtitle: 'Curated tasting boxes & best sellers' },
    { id: 'daily', number: '02', name: 'DAILY RITUAL', subtitle: 'Guilt-free everyday tea companions' },
    { id: 'gifting', number: '03', name: 'GIFTING HAMPERS', subtitle: 'Luxury artisanal gift hampers' },
  ];
  const [selectedHomeCat, setSelectedHomeCat] = useState('starter');

  /* -------------------------------------------------------------------------- */
  /* FRONTEND DUMMY TESTIMONIAL DATA (PREPARED FOR FUTURE ADMIN API INTEG)     */
  /* -------------------------------------------------------------------------- */
  const dummyTestimonials = [
    {
      id: 1,
      customerName: "Ananya Sharma",
      customerRole: "Verified Customer",
      product: "Cocoa Ragi Cookies",
      rating: 5,
      date: "2026-02-10",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
      review: "I genuinely loved how light these tasted. The texture was perfect with my evening tea, and I did not feel like I was eating a typical packaged biscuit.",
      isVisible: true
    },
    {
      id: 2,
      customerName: "Rohan Mehta",
      customerRole: "Verified Customer",
      product: "Coconut Jowar Cookies",
      rating: 5,
      date: "2026-02-12",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
      review: "The coconut flavour is subtle and really good. MILASTY has become my go-to snack when I want something simple with my coffee.",
      isVisible: true
    },
    {
      id: 3,
      customerName: "Priya Kapoor",
      customerRole: "Verified Customer",
      product: "Imperial Wedding Hamper",
      rating: 5,
      date: "2026-02-14",
      avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80",
      review: "The hamper looked beautiful and felt very thoughtfully put together. It made a lovely gift for my family.",
      isVisible: true
    },
    {
      id: 4,
      customerName: "Neha Verma",
      customerRole: "Verified Customer",
      product: "Millet Bake",
      rating: 5,
      date: "2026-02-15",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80",
      review: "I really appreciate the ingredient transparency. Everything feels carefully made, and the taste is even better than I expected.",
      isVisible: true
    },
    {
      id: 5,
      customerName: "Arjun Malhotra",
      customerRole: "Verified Customer",
      product: "Cocoa Ragi Cookies",
      rating: 5,
      date: "2026-02-18",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80",
      review: "Crispy, tasty and not overly sweet. These are now a regular part of my evening snack.",
      isVisible: true
    },
    {
      id: 6,
      customerName: "Kavya Singh",
      customerRole: "Verified Customer",
      product: "Celebration Hamper",
      rating: 5,
      date: "2026-02-20",
      avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&auto=format&fit=crop&q=80",
      review: "Beautiful packaging, great taste and a very premium feel. Perfect for gifting.",
      isVisible: true
    }
  ];

  // Filter only visible items (future admin ON/OFF support)
  const activeTestimonials = dummyTestimonials.filter(t => t.isVisible);
  const [activeTestimonialIdx, setActiveTestimonialIdx] = useState(0);
  const [isTestimonialSectionHovered, setIsTestimonialSectionHovered] = useState(false);

  // Autoplay 4s timer
  useEffect(() => {
    if (isTestimonialSectionHovered || activeTestimonials.length === 0) return;
    const timer = setInterval(() => {
      setActiveTestimonialIdx((prev) => (prev + 1) % activeTestimonials.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [isTestimonialSectionHovered, activeTestimonials.length]);

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

  const [cardsToShow, setCardsToShow] = useState(
    typeof window !== 'undefined'
      ? window.innerWidth > 1024 ? 3 : window.innerWidth >= 768 ? 2 : 1
      : 3
  );
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const [isTestimonialHovered, setIsTestimonialHovered] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width > 1024) setCardsToShow(3);
      else if (width >= 768) setCardsToShow(2);
      else setCardsToShow(1);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const reviews = [
    {
      quote: "Its one of the best healthy snacks I have eaten. Its very crunchy and tasty.",
      name: "Harshit Kumar",
      location: "Verified Buyer",
      role: "Customer Review",
      rating: 5,
    },
    {
      quote: "I tried all 3 types of cookies that they make. Personal favourite are cardamom bajra and coconut jowar. I have reordered it multiple times. Taste is amazing. Goes very well with evening coffee.",
      name: "Lokesh Gujral",
      location: "Verified Buyer",
      role: "Repeat Customer",
      rating: 5,
    },
    {
      quote: "Really good quality millet cookies with nice packaging. They taste healthy and the sweetness is well balanced. The coconut one is especially very good. I really liked them.",
      name: "Souvik Mitra",
      location: "Verified Buyer",
      role: "Customer Review",
      rating: 5,
    },
    {
      quote: "Got my best healthy biscuit ever. Best was cardamom flavour. It’s not a kind of snack, it’s a meal. Eat 3-4 biscuits and you are done.",
      name: "Mahesh Gupta",
      location: "Verified Buyer",
      role: "Customer Review",
      rating: 5,
    },
    {
      quote: "I tried bajra cookies and taste was awesome, the aroma of cardamom and homely feel in biscuits was worth appreciating..😍 …",
      name: "Harshita Mishra",
      location: "Verified Buyer",
      role: "Customer Review",
      rating: 5,
    },
    {
      quote: "These cookies are absolutely delicious and perfectly baked. They are soft, Every bite tastes fresh and amazing! 🍪👌😋😋.",
      name: "Sounik Ghosh",
      location: "Verified Buyer",
      role: "Customer Review",
      rating: 5,
    },
  ];

  // Tripled array for seamless continuous infinite carousel
  const extendedReviews = [...reviews, ...reviews, ...reviews];

  const handleNextSlide = () => {
    setIsTransitioning(true);
    setCarouselIndex((prev) => prev + 1);
  };

  const handlePrevSlide = () => {
    setIsTransitioning(true);
    if (carouselIndex === 0) {
      setIsTransitioning(false);
      setCarouselIndex(reviews.length);
      setTimeout(() => {
        setIsTransitioning(true);
        setCarouselIndex(reviews.length - 1);
      }, 20);
    } else {
      setCarouselIndex((prev) => prev - 1);
    }
  };

  const handleTransitionEnd = () => {
    if (carouselIndex >= reviews.length) {
      setIsTransitioning(false);
      setCarouselIndex(carouselIndex % reviews.length);
    }
  };

  // Auto-play interval: slides automatically every 2 seconds (2000ms)
  useEffect(() => {
    if (isTestimonialHovered) return;
    const timer = setInterval(() => {
      handleNextSlide();
    }, 2000);
    return () => clearInterval(timer);
  }, [isTestimonialHovered, carouselIndex]);

  // Selected ritual product
  const ritualProducts = dbProducts.length > 0 ? dbProducts : initialProducts.slice(0, 4);
  const activeRitualProduct = ritualProducts[activeRitualIdx] || ritualProducts[0];

  return (
    <div ref={homeRef} className="home-page" style={{ backgroundColor: 'transparent', position: 'relative' }}>

      {/* Background Poster Fallback / Loading Wrapper */}
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
            imageRendering: 'auto',
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
          background: 'rgba(20, 10, 5, 0.20)',
          zIndex: 2,
          pointerEvents: 'none',
        }}
      />

      {/* Home Content Layer */}
      <div className="home-content" style={{ position: 'relative', zIndex: 3 }}>

        {/* 1. CINEMATIC VIDEO HERO SECTION */}
        <section
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
          }}
        >
          {/* Floating Transparent Content */}
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
                marginBottom: '1.75rem',
                fontSize: '0.85rem',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--accent-gold)',
                fontWeight: '800',
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.4)'
              }}
            >
              ✦ Handcrafted Millet Bakes
            </span>

            <h1
              className="hero-heading"
              style={{
                fontSize: 'clamp(2.4rem, 6vw, 4.2rem)',
                lineHeight: '1.12',
                color: '#FFFFFF',
                marginBottom: '1.5rem',
                letterSpacing: '-0.01em',
                fontFamily: 'var(--font-serif)',
                fontWeight: '900',
                textShadow: '0 4px 16px rgba(0, 0, 0, 0.5)',
                maxWidth: '850px'
              }}
            >
              <span style={{ color: 'var(--accent-gold)', fontSize: 'inherit', fontWeight: 'inherit', display: 'inline-block' }}>Goodness of Millets.</span><br />
              <span style={{ color: '#FFFFFF', fontSize: 'inherit', fontWeight: 'inherit', display: 'inline-block' }}>Baked Into Every Bite.</span>
            </h1>

            <p
              className="hero-subheading"
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

            <div className="hero-buttons" style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
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

        </section>

        {/* 2. TRUST / BRAND PROMISE SECTION (Transparent tiles with white text and borders) */}
        <section ref={trustRef} className="reveal-fade-up trust-section" style={{ backgroundColor: 'transparent', padding: '5rem 0', borderBottom: '1px solid rgba(255, 255, 255, 0.15)' }}>
          <div className="container">
            <div className="trust-grid fitted-cards-container-4">
              {[
                { stat: '100%', title: 'Pure Desi Ghee', desc: 'Baked cleanly with authentic cow ghee' },
                { stat: '100%', title: 'Wholesome Grains', desc: 'Finger millet, sorghum, and pearl millet' },
                { stat: '10,000+', title: 'Happy Families', desc: 'Snacking consciously across India' },
                { stat: 'NABL', title: 'Verified Transparency', desc: 'Certified nutritional lab analysis' }
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="glass-card trust-card"
                  style={{
                    textAlign: 'center',
                    padding: '1.75rem 1rem',
                    borderRadius: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    width: '100%',
                    boxSizing: 'border-box'
                  }}
                >
                  <div style={{ fontSize: 'clamp(2rem, 5vw, 2.8rem)', fontFamily: 'var(--font-serif)', color: '#b9cd94', fontWeight: '850', marginBottom: '0.4rem', textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
                    {item.stat}
                  </div>
                  <h4 style={{ fontSize: 'clamp(0.92rem, 3vw, 1.05rem)', color: '#FFFDF9', marginBottom: '0.35rem', fontWeight: '850', lineHeight: '1.3' }}>
                    {item.title}
                  </h4>
                  <p style={{ fontSize: 'clamp(0.78rem, 2.5vw, 0.85rem)', color: '#F5EBDD', margin: 0, lineHeight: '1.5', fontWeight: '550' }}>
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>



        {/* 4. SIGNATURE PRODUCTS SECTION */}
        <section ref={favRef} className="reveal-fade-up favorites-section" style={{ padding: '6.5rem 0', backgroundColor: 'transparent', borderBottom: '1px solid rgba(255, 255, 255, 0.15)' }}>
          <div className="container">
            <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 4rem' }}>
              <span style={{ display: 'inline-block', marginBottom: '0.75rem', fontSize: '0.85rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent-gold)', fontWeight: '800' }}>Our Favorites</span>
              <h2 style={{ fontSize: '2.6rem', color: '#FFFFFF', fontFamily: 'var(--font-serif)', fontWeight: '800', marginBottom: '0.75rem' }}>Meet the <span style={{ color: 'var(--accent-gold)' }}>MILASTY</span> Favourites</h2>
              <p style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '1.05rem', fontWeight: '500' }}>Four wholesome bakes. One better way to snack.</p>
            </div>

            <div className="favorites-grid fitted-cards-container-4">
              {dbProducts.slice(0, 4).map((product) => {
                const selectedVariant = product.variants?.[0];
                const isWishlisted = wishlistItems && wishlistItems.some((item) => (item._id || item.slug) === (product._id || product.slug));
                return (
                  <div
                    key={product._id || product.slug}
                    className="glass-card home-product-card"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: '20px',
                      overflow: 'hidden',
                      position: 'relative',
                      boxSizing: 'border-box',
                      width: '100%',
                      minWidth: 0,
                    }}
                  >
                    <div style={{ position: 'relative', overflow: 'hidden', paddingTop: '75%', backgroundColor: 'transparent' }} className="card-image-wrap">
                      <Link to={`/product/${product.slug}`}>
                        <img
                          src={product.image}
                          alt={product.title}
                          loading="eager"
                          decoding="async"
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            transition: 'transform 0.4s ease'
                          }}
                          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.04)'}
                          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        />
                      </Link>

                      <button
                        onClick={() => toggleWishlist(product)}
                        className="card-wishlist-btn"
                        style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          backgroundColor: 'rgba(255, 255, 255, 0.90)',
                          border: 'none',
                          width: isMobile ? '28px' : '32px',
                          height: isMobile ? '28px' : '32px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                          color: isWishlisted ? 'var(--accent-terracotta)' : '#333333',
                          cursor: 'pointer',
                          zIndex: 5
                        }}
                      >
                        <Heart size={isMobile ? 13 : 15} fill={isWishlisted ? 'var(--accent-terracotta)' : 'none'} />
                      </button>
                    </div>

                    <div className="card-body" style={{ padding: isMobile ? '0.85rem 0.7rem' : '1.25rem 1.15rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flexGrow: 1, minWidth: 0 }}>
                      <div>
                        <div className="card-rating-row" style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', marginBottom: '0.35rem' }}>
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} size={isMobile ? 11 : 13} fill={i < Math.floor(product.rating || 5) ? 'var(--accent-gold)' : 'none'} color="var(--accent-gold)" />
                          ))}
                          <span style={{ fontSize: isMobile ? '0.7rem' : '0.78rem', color: 'rgba(255, 255, 255, 0.85)', marginLeft: '0.2rem', fontWeight: '600' }}>({product.reviewCount || 10})</span>
                        </div>
                        <h3 className="card-title" style={{ fontSize: isMobile ? '0.9rem' : '1.1rem', color: '#FFFDF9', marginBottom: '0.3rem', fontFamily: 'var(--font-serif)', fontWeight: '850', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          <Link to={`/product/${product.slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>{product.title}</Link>
                        </h3>
                        <p className="card-subtitle" style={{ fontSize: isMobile ? '0.75rem' : '0.82rem', color: '#F5EBDD', marginBottom: '0.85rem', lineHeight: '1.4', fontWeight: '550', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.subtitle || product.description}</p>
                      </div>

                      <div className="card-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.6rem', borderTop: '1px solid rgba(255, 255, 255, 0.15)', minWidth: 0 }}>
                        <span className="card-price" style={{ fontSize: isMobile ? '0.95rem' : '1.15rem', fontWeight: '900', color: '#FFFDF9' }}>₹{selectedVariant?.price || 139}</span>
                        <button
                          onClick={() => addToCart(product, selectedVariant)}
                          className="btn-primary add-cart-btn"
                          style={{ padding: isMobile ? '0.4rem 0.65rem' : '0.5rem 0.9rem', fontSize: isMobile ? '0.72rem' : '0.8rem', gap: '0.25rem', backgroundColor: '#244f21', color: '#FFFFFF', fontWeight: '850', borderRadius: '999px', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
                        >
                          <ShoppingBag size={isMobile ? 12 : 14} />
                          <span>Add</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 3. "WHY MILASTY" SECTION (Transparent tiles with white text and borders) */}
        <section id="why-milasty" ref={whyRef} className="reveal-fade-up why-section" style={{ padding: isMobile ? '4rem 0' : '6.5rem 0', backgroundColor: 'transparent', borderBottom: '1px solid rgba(255, 255, 255, 0.15)' }}>
          <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: isMobile ? '2.5rem' : '4.5rem' }}>
              <div>
                <span style={{ display: 'inline-block', marginBottom: '0.75rem', fontSize: '0.85rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent-gold)', fontWeight: '800' }}>WHY MILASTY ? </span>
                <h2 style={{ fontSize: isMobile ? '2.1rem' : '2.6rem', color: '#FFFFFF', fontFamily: 'var(--font-serif)', fontWeight: '800', margin: 0 }}><span style={{ color: 'var(--accent-gold)' }}>Made Differently.</span> Tasted Slowly.</h2>
              </div>
              {!isMobile && (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => scrollLeft(whyDiffRef)}
                    style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(245,235,221,0.2)', color: 'var(--text-light)', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => scrollRight(whyDiffRef)}
                    style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(245,235,221,0.2)', color: 'var(--text-light)', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>

            {isMobile ? (
              /* MOBILE INTERACTIVE 2x2 SELECTOR VIEW */
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.85rem', marginBottom: '1.25rem' }}>
                  {[
                    { icon: Award, title: 'PURE GHEE', num: '01', desc: 'Slow-baked with authentic Desi Cow Ghee for rich aroma and natural nutrition.' },
                    { icon: Sparkles, title: 'MILLETS', num: '02', desc: 'Packed with the traditional goodness of native Bajra, Jowar, and Ragi flour.' },
                    { icon: ShieldCheck, title: 'JAGGERY', num: '03', desc: 'Sweetened with pure organic jaggery instead of refined white sugars.' },
                    { icon: FileText, title: 'TRANSPARENCY', num: '04', desc: 'Zero Maida flour. Zero Palm Oil. Absolutely no hidden chemical preservatives.' },
                  ].map((item, idx) => {
                    const isSelected = activeMobileTransparencyIdx === idx;
                    const IconComp = item.icon;
                    return (
                      <div
                        key={idx}
                        onClick={() => setActiveMobileTransparencyIdx(idx)}
                        className="glass-card"
                        style={{
                          padding: '1rem 0.85rem',
                          borderRadius: '16px',
                          backgroundColor: isSelected ? 'rgba(36, 79, 33, 0.40)' : 'rgba(20, 10, 5, 0.40)',
                          border: isSelected ? '1.5px solid var(--accent-gold)' : '1px solid rgba(245, 235, 221, 0.20)',
                          boxShadow: isSelected ? '0 8px 24px rgba(0, 0, 0, 0.35)' : 'none',
                          cursor: 'pointer',
                          transition: 'all 0.25s ease',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          height: '120px',
                          boxSizing: 'border-box',
                          minWidth: 0,
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <IconComp size={22} color={isSelected ? 'var(--accent-gold)' : 'rgba(255,255,255,0.7)'} strokeWidth={1.8} />
                          <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-serif)', fontWeight: '900', color: isSelected ? 'var(--accent-gold)' : 'rgba(255,255,255,0.5)' }}>{item.num}</span>
                        </div>
                        <div>
                          <h4 style={{ fontSize: '0.82rem', color: isSelected ? '#FFFFFF' : '#F5EBDD', fontWeight: '850', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</h4>
                          <span style={{ fontSize: '0.65rem', color: isSelected ? 'var(--accent-gold)' : 'rgba(255,255,255,0.6)', fontWeight: '600', display: 'block', marginTop: '0.15rem' }}>
                            {isSelected ? '✓ Selected' : 'Tap to view'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Detail Panel Below 2x2 Grid */}
                <div
                  className="glass-card"
                  style={{
                    padding: '1.25rem 1.15rem',
                    borderRadius: '18px',
                    backgroundColor: 'rgba(20, 10, 5, 0.65)',
                    border: '1px solid var(--accent-gold)',
                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {[
                    { fullTitle: 'PURE DESI COW GHEE', desc: 'Slow-baked with authentic Desi Cow Ghee for rich aroma, crumbly texture, and wholesome natural nutrition without vegetable oils.' },
                    { fullTitle: 'WHOLESOME NATIVE MILLETS', desc: 'Packed with the traditional goodness of native Bajra, Jowar, and Ragi flour, giving you complex carbs and dietary fiber.' },
                    { fullTitle: 'UNREFINED ORGANIC JAGGERY', desc: 'Sweetened with 100% pure organic jaggery instead of refined white sugars, artificial sweeteners, or high-fructose syrups.' },
                    { fullTitle: '100% CLEAN & TRANSPARENT', desc: 'Zero Maida flour. Zero Palm Oil. Absolutely no hidden chemical preservatives, artificial colors, or emulsifiers.' },
                  ][activeMobileTransparencyIdx] && (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: '900', color: 'var(--accent-gold)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                            0{activeMobileTransparencyIdx + 1} • HIGHLIGHT
                          </span>
                        </div>
                        <h3 style={{ fontSize: '1.05rem', color: '#FFFDF9', fontFamily: 'var(--font-serif)', fontWeight: '850', marginBottom: '0.45rem', marginTop: 0 }}>
                          {[
                            'PURE DESI COW GHEE',
                            'WHOLESOME NATIVE MILLETS',
                            'UNREFINED ORGANIC JAGGERY',
                            '100% CLEAN & TRANSPARENT'
                          ][activeMobileTransparencyIdx]}
                        </h3>
                        <p style={{ fontSize: '0.84rem', color: '#F5EBDD', lineHeight: '1.55', fontWeight: '500', margin: 0 }}>
                          {[
                            'Slow-baked with authentic Desi Cow Ghee for rich aroma, crumbly texture, and wholesome natural nutrition without vegetable oils.',
                            'Packed with the traditional goodness of native Bajra, Jowar, and Ragi flour, giving you complex carbs and dietary fiber.',
                            'Sweetened with 100% pure organic jaggery instead of refined white sugars, artificial sweeteners, or high-fructose syrups.',
                            'Zero Maida flour. Zero Palm Oil. Absolutely no hidden chemical preservatives, artificial colors, or emulsifiers.'
                          ][activeMobileTransparencyIdx]}
                        </p>
                      </div>
                    )}
                </div>
              </div>
            ) : (
              /* DESKTOP & TABLET ORIGINAL VIEW */
              <div
                ref={whyDiffRef}
                className="why-grid fitted-cards-container-4"
              >
                <div className="glass-card" style={{ padding: '2.5rem 2rem', borderRadius: '20px', border: '1px solid rgba(245, 235, 221, 0.25)', minWidth: 0 }}>
                  <div style={{ color: 'var(--accent-gold)', marginBottom: '1.5rem' }}>
                    <Award size={36} strokeWidth={1.5} />
                  </div>
                  <h3 style={{ fontSize: '1.25rem', color: '#FFFFFF', marginBottom: '0.5rem', fontWeight: '800' }}>PURE DESI GHEE</h3>
                  <p style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.9)', lineHeight: '1.55', fontWeight: '500', margin: 0 }}>Slow-baked with authentic Desi Cow Ghee for rich aroma and natural nutrition.</p>
                </div>

                <div className="glass-card" style={{ padding: '2.5rem 2rem', borderRadius: '20px', border: '1px solid rgba(245, 235, 221, 0.25)', minWidth: 0 }}>
                  <div style={{ color: 'var(--accent-gold)', marginBottom: '1.5rem' }}>
                    <Sparkles size={36} strokeWidth={1.5} />
                  </div>
                  <h3 style={{ fontSize: '1.25rem', color: '#FFFFFF', marginBottom: '0.5rem', fontWeight: '800' }}>WHOLESOME MILLETS</h3>
                  <p style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.9)', lineHeight: '1.55', fontWeight: '500', margin: 0 }}>Packed with the traditional goodness of native Bajra, Jowar, and Ragi flour.</p>
                </div>

                <div className="glass-card" style={{ padding: '2.5rem 2rem', borderRadius: '20px', border: '1px solid rgba(245, 235, 221, 0.25)', minWidth: 0 }}>
                  <div style={{ color: 'var(--accent-gold)', marginBottom: '1.5rem' }}>
                    <ShieldCheck size={36} strokeWidth={1.5} />
                  </div>
                  <h3 style={{ fontSize: '1.25rem', color: '#FFFFFF', marginBottom: '0.5rem', fontWeight: '800' }}>NATURALLY SWEET</h3>
                  <p style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.9)', lineHeight: '1.55', fontWeight: '500', margin: 0 }}>Sweetened with pure organic jaggery instead of refined white sugars.</p>
                </div>

                <div className="glass-card" style={{ padding: '2.5rem 2rem', borderRadius: '20px', border: '1px solid rgba(245, 235, 221, 0.25)', minWidth: 0 }}>
                  <div style={{ color: 'var(--accent-gold)', marginBottom: '1.5rem' }}>
                    <FileText size={36} strokeWidth={1.5} />
                  </div>
                  <h3 style={{ fontSize: '1.25rem', color: '#FFFFFF', marginBottom: '0.5rem', fontWeight: '800' }}>NOTHING UNNECESSARY</h3>
                  <p style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.9)', lineHeight: '1.55', fontWeight: '500', margin: 0 }}>Zero Maida flour. Zero Palm Oil. Absolutely no hidden chemical preservatives.</p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ================================================================== */}
        {/* NEW CUSTOMER TESTIMONIALS SECTION (PREPARED FOR FUTURE ADMIN)       */}
        {/* ================================================================== */}
        <section 
          ref={customerTestimonialRef} 
          className="reveal-fade-up customer-testimonials-section" 
          style={{ padding: isMobile ? '4rem 0' : '6.5rem 0', backgroundColor: 'transparent', borderBottom: '1px solid rgba(255, 255, 255, 0.15)' }}
        >
          <div className="container" style={{ maxWidth: '1240px', margin: '0 auto', padding: '0 1rem' }}>
            
            {/* Section Header */}
            <div style={{ textAlign: 'center', maxWidth: '660px', margin: isMobile ? '0 auto 2.25rem' : '0 auto 4rem' }}>
              <span style={{ display: 'inline-block', marginBottom: '0.6rem', fontSize: '0.85rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--accent-gold)', fontWeight: '800' }}>
                CUSTOMER LOVE
              </span>
              <h2 style={{ fontSize: isMobile ? '2.1rem' : '2.8rem', color: '#FFFDF9', fontFamily: 'var(--font-serif)', fontWeight: '800', lineHeight: '1.2', margin: '0 0 0.85rem' }}>
                What Our Customers <span style={{ color: 'var(--accent-gold)' }}>Really Say.</span>
              </h2>
              <p style={{ color: 'rgba(255, 255, 255, 0.88)', fontSize: isMobile ? '0.92rem' : '1.05rem', lineHeight: '1.65', margin: 0, fontWeight: '500' }}>
                Real experiences from people who chose MILASTY for their everyday snacking and gifting moments.
              </p>
            </div>

            {/* Testimonials Container */}
            <div 
              onMouseEnter={() => setIsTestimonialSectionHovered(true)}
              onMouseLeave={() => setIsTestimonialSectionHovered(false)}
              onTouchStart={() => setIsTestimonialSectionHovered(true)}
              onTouchEnd={() => setTimeout(() => setIsTestimonialSectionHovered(false), 3000)}
            >
              {isMobile ? (
                /* MOBILE VIEW: Single Centered Card (No Horizontal Overflow) */
                <div style={{ width: '100%', boxSizing: 'border-box' }}>
                  {activeTestimonials[activeTestimonialIdx] && (
                    <div
                      className="glass-card"
                      style={{
                        width: 'calc(100% - 32px)',
                        maxWidth: '380px',
                        margin: '0 auto',
                        backgroundColor: 'rgba(35, 21, 13, 0.82)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        borderRadius: '24px',
                        border: '1.5px solid var(--accent-gold)',
                        boxShadow: '0 16px 40px rgba(0, 0, 0, 0.45)',
                        padding: '1.75rem 1.35rem',
                        position: 'relative',
                        boxSizing: 'border-box',
                        overflow: 'hidden',
                        transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)'
                      }}
                    >
                      {/* Translucent Quote Background Watermark */}
                      <Quote 
                        size={80} 
                        style={{ position: 'absolute', top: '10px', right: '15px', color: 'rgba(200, 155, 60, 0.08)', pointerEvents: 'none' }} 
                      />

                      {/* Gold Corner Accent Line */}
                      <div style={{ position: 'absolute', top: 0, left: '20px', right: '20px', height: '2px', background: 'linear-gradient(90deg, transparent, var(--accent-gold), transparent)' }} />

                      <div style={{ position: 'relative', zIndex: 2 }}>
                        {/* Rating Stars */}
                        <div style={{ display: 'flex', gap: '3px', color: 'var(--accent-gold)', marginBottom: '1rem' }}>
                          {[...Array(activeTestimonials[activeTestimonialIdx].rating || 5)].map((_, i) => (
                            <Star key={i} size={16} fill="var(--accent-gold)" color="var(--accent-gold)" />
                          ))}
                        </div>

                        {/* Review Content */}
                        <p style={{ fontSize: '0.95rem', fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: '#FFFDF9', lineHeight: '1.65', marginBottom: '1.5rem', fontWeight: '500' }}>
                          "{activeTestimonials[activeTestimonialIdx].review}"
                        </p>

                        {/* Customer Footer Info */}
                        <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.15)', paddingTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            {activeTestimonials[activeTestimonialIdx].avatar && (
                              <img 
                                src={activeTestimonials[activeTestimonialIdx].avatar} 
                                alt={activeTestimonials[activeTestimonialIdx].customerName}
                                style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--accent-gold)' }}
                              />
                            )}
                            <div>
                              <strong style={{ fontSize: '0.92rem', color: '#FFFDF9', display: 'block', fontWeight: '850', margin: 0 }}>
                                {activeTestimonials[activeTestimonialIdx].customerName}
                              </strong>
                              <span style={{ fontSize: '0.75rem', color: '#b9cd94', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                <CheckCircle2 size={12} color="#b9cd94" />
                                {activeTestimonials[activeTestimonialIdx].customerRole}
                              </span>
                            </div>
                          </div>

                          {/* Tried Product Tag */}
                          {activeTestimonials[activeTestimonialIdx].product && (
                            <span style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.85)', backgroundColor: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.2)', padding: '0.25rem 0.55rem', borderRadius: '6px', fontWeight: '600' }}>
                              Tried: {activeTestimonials[activeTestimonialIdx].product}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* DESKTOP VIEW: 3-Card Carousel Showcase */
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.75rem', alignItems: 'stretch' }}>
                  {[
                    activeTestimonials[(activeTestimonialIdx + activeTestimonials.length - 1) % activeTestimonials.length],
                    activeTestimonials[activeTestimonialIdx % activeTestimonials.length],
                    activeTestimonials[(activeTestimonialIdx + 1) % activeTestimonials.length],
                  ].map((item, idx) => {
                    const isActiveCenter = idx === 1;
                    return (
                      <div
                        key={item.id || idx}
                        className="glass-card"
                        style={{
                          backgroundColor: isActiveCenter ? 'rgba(35, 21, 13, 0.90)' : 'rgba(35, 21, 13, 0.50)',
                          backdropFilter: 'blur(20px)',
                          WebkitBackdropFilter: 'blur(20px)',
                          borderRadius: '24px',
                          border: isActiveCenter ? '1.5px solid var(--accent-gold)' : '1px solid rgba(255, 255, 255, 0.15)',
                          boxShadow: isActiveCenter ? '0 16px 40px rgba(0, 0, 0, 0.45)' : '0 8px 24px rgba(0, 0, 0, 0.25)',
                          padding: isActiveCenter ? '2.25rem 1.85rem' : '1.85rem 1.5rem',
                          transform: isActiveCenter ? 'scale(1.03)' : 'scale(0.97)',
                          opacity: isActiveCenter ? 1 : 0.75,
                          transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          position: 'relative',
                          overflow: 'hidden',
                          minWidth: 0
                        }}
                      >
                        {/* Translucent Quote Background Watermark */}
                        <Quote 
                          size={90} 
                          style={{ position: 'absolute', top: '15px', right: '15px', color: isActiveCenter ? 'rgba(200, 155, 60, 0.10)' : 'rgba(255, 255, 255, 0.04)', pointerEvents: 'none' }} 
                        />

                        {/* Top Accent Line for Center Card */}
                        {isActiveCenter && (
                          <div style={{ position: 'absolute', top: 0, left: '20px', right: '20px', height: '2.5px', background: 'linear-gradient(90deg, transparent, var(--accent-gold), transparent)' }} />
                        )}

                        <div style={{ position: 'relative', zIndex: 2 }}>
                          {/* Rating Stars */}
                          <div style={{ display: 'flex', gap: '4px', color: 'var(--accent-gold)', marginBottom: '1.25rem' }}>
                            {[...Array(item.rating || 5)].map((_, i) => (
                              <Star key={i} size={18} fill="var(--accent-gold)" color="var(--accent-gold)" />
                            ))}
                          </div>

                          {/* Review Text */}
                          <p style={{ fontSize: isActiveCenter ? '1.05rem' : '0.95rem', fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: '#FFFDF9', lineHeight: '1.65', marginBottom: '2rem', fontWeight: '500' }}>
                            "{item.review}"
                          </p>
                        </div>

                        {/* Customer Footer Info */}
                        <div style={{ position: 'relative', zIndex: 2, borderTop: '1px solid rgba(255, 255, 255, 0.15)', paddingTop: '1.15rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                              {item.avatar && (
                                <img 
                                  src={item.avatar} 
                                  alt={item.customerName}
                                  style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', border: isActiveCenter ? '1.5px solid var(--accent-gold)' : '1px solid rgba(255, 255, 255, 0.3)' }}
                                />
                              )}
                              <div>
                                <strong style={{ fontSize: '1rem', color: '#FFFDF9', display: 'block', fontWeight: '850' }}>
                                  {item.customerName}
                                </strong>
                                <span style={{ fontSize: '0.78rem', color: '#b9cd94', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                  <CheckCircle2 size={13} color="#b9cd94" />
                                  {item.customerRole}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Tried Product Tag */}
                          {item.product && (
                            <div style={{ marginTop: '0.65rem' }}>
                              <span style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.85)', backgroundColor: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.2)', padding: '0.3rem 0.65rem', borderRadius: '6px', fontWeight: '600' }}>
                                Tried: {item.product}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Navigation Dots Below Card Area */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: isMobile ? '1.5rem' : '2.5rem', marginBottom: '1.25rem' }}>
                {activeTestimonials.map((_, idx) => {
                  const active = activeTestimonialIdx === idx;
                  return (
                    <button
                      key={idx}
                      onClick={() => setActiveTestimonialIdx(idx)}
                      style={{
                        width: active ? '24px' : '8px',
                        height: '8px',
                        borderRadius: '4px',
                        backgroundColor: active ? '#b9cd94' : 'rgba(255, 255, 255, 0.3)',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        padding: 0
                      }}
                      aria-label={`Go to testimonial ${idx + 1}`}
                    />
                  );
                })}
              </div>

              {/* Compact Circular Navigation Arrows Below Dots */}
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1.25rem' }}>
                <button
                  onClick={() => setActiveTestimonialIdx((prev) => (prev - 1 + activeTestimonials.length) % activeTestimonials.length)}
                  aria-label="Previous Testimonial"
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    border: '1.5px solid #b9cd94',
                    backgroundColor: '#244f21',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 4px 14px rgba(36, 79, 33, 0.4)'
                  }}
                >
                  <ChevronLeft size={20} />
                </button>

                <button
                  onClick={() => setActiveTestimonialIdx((prev) => (prev + 1) % activeTestimonials.length)}
                  aria-label="Next Testimonial"
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    border: '1.5px solid #b9cd94',
                    backgroundColor: '#244f21',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 4px 14px rgba(36, 79, 33, 0.4)'
                  }}
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 8. TESTIMONIAL SECTION (Mobile: Clean Single Card | Desktop: Multi-Card Carousel) */}
        <section ref={reviewRef} className="reveal-fade-up reviews-section" style={{ padding: isMobile ? '4rem 0' : '6.5rem 0', backgroundColor: 'transparent', borderBottom: '1px solid rgba(255, 255, 255, 0.15)' }}>
          <div className="container" style={{ maxWidth: '1240px', margin: '0 auto', padding: '0 1rem' }}>

            <div style={{ textAlign: 'center', maxWidth: '600px', margin: isMobile ? '0 auto 2.25rem' : '0 auto 3.5rem' }}>
              <span style={{ display: 'inline-block', marginBottom: '0.5rem', fontSize: '0.85rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--accent-gold)', fontWeight: '800' }}>Customer Stories</span>
              <h2 style={{ fontSize: 'clamp(2rem, 4.5vw, 2.8rem)', color: '#FFFDF9', fontFamily: 'var(--font-serif)', fontWeight: '800', lineHeight: '1.2', margin: 0 }}>
                Loved by <span style={{ color: '#b9cd94' }}>Health-Conscious</span> Homes
              </h2>
            </div>

            {isMobile ? (
              /* MOBILE SINGLE CARD CAROUSEL VIEW */
              <div 
                style={{ width: '100%', boxSizing: 'border-box' }}
                onMouseEnter={() => setIsTestimonialHovered(true)}
                onMouseLeave={() => setIsTestimonialHovered(false)}
                onTouchStart={() => setIsTestimonialHovered(true)}
                onTouchEnd={() => setTimeout(() => setIsTestimonialHovered(false), 3000)}
              >
                {/* Single Centered Testimonial Card */}
                {reviews[carouselIndex % reviews.length] && (
                  <div
                    style={{
                      width: '100%',
                      maxWidth: '380px',
                      margin: '0 auto',
                      backgroundColor: 'rgba(35, 21, 13, 0.85)',
                      backdropFilter: 'blur(16px)',
                      WebkitBackdropFilter: 'blur(16px)',
                      borderRadius: '24px',
                      border: '1.5px solid rgba(185, 205, 148, 0.3)',
                      boxShadow: '0 12px 32px rgba(0, 0, 0, 0.4)',
                      padding: '1.75rem 1.35rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      minHeight: '220px',
                      boxSizing: 'border-box',
                      transition: 'all 0.35s ease'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', gap: '4px', color: '#b9cd94', marginBottom: '1rem' }}>
                        {[...Array(reviews[carouselIndex % reviews.length].rating)].map((_, i) => (
                          <Star key={i} size={16} fill="#b9cd94" color="#b9cd94" />
                        ))}
                      </div>

                      <p style={{ fontSize: '0.95rem', fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: '#FFFDF9', lineHeight: '1.6', marginBottom: '1.5rem', fontWeight: '500' }}>
                        "{reviews[carouselIndex % reviews.length].quote}"
                      </p>
                    </div>

                    <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.12)', paddingTop: '0.85rem' }}>
                      <strong style={{ fontSize: '0.95rem', color: '#FFFDF9', display: 'block', marginBottom: '0.2rem', fontWeight: '850' }}>
                        {reviews[carouselIndex % reviews.length].name}
                      </strong>
                      <span style={{ fontSize: '0.78rem', color: '#b9cd94', fontWeight: '700' }}>
                        {reviews[carouselIndex % reviews.length].role} • {reviews[carouselIndex % reviews.length].location}
                      </span>
                    </div>
                  </div>
                )}

                {/* Pagination Dots Directly Below Card */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.45rem', marginTop: '1.5rem', marginBottom: '1.25rem' }}>
                  {reviews.map((_, idx) => {
                    const active = (carouselIndex % reviews.length) === idx;
                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          setIsTransitioning(true);
                          setCarouselIndex(idx);
                        }}
                        style={{
                          width: active ? '22px' : '8px',
                          height: '8px',
                          borderRadius: '4px',
                          backgroundColor: active ? '#b9cd94' : 'rgba(255, 255, 255, 0.3)',
                          border: 'none',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          padding: 0
                        }}
                        aria-label={`Go to testimonial ${idx + 1}`}
                      />
                    );
                  })}
                </div>

                {/* Navigation Arrows Below Dots */}
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1.5rem' }}>
                  <button
                    onClick={handlePrevSlide}
                    aria-label="Previous Testimonial"
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      border: '1.5px solid #b9cd94',
                      backgroundColor: '#244f21',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 4px 14px rgba(36, 79, 33, 0.4)'
                    }}
                  >
                    <ChevronLeft size={20} />
                  </button>

                  <button
                    onClick={handleNextSlide}
                    aria-label="Next Testimonial"
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      border: '1.5px solid #b9cd94',
                      backgroundColor: '#244f21',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 4px 14px rgba(36, 79, 33, 0.4)'
                    }}
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            ) : (
              /* DESKTOP MULTI-CARD CONTINUOUS CAROUSEL VIEW */
              <div
                style={{ width: '100%', position: 'relative', overflow: 'hidden' }}
                onMouseEnter={() => setIsTestimonialHovered(true)}
                onMouseLeave={() => setIsTestimonialHovered(false)}
              >
                {/* Sliding Track */}
                <div
                  onTransitionEnd={handleTransitionEnd}
                  style={{
                    display: 'flex',
                    gap: '1.5rem',
                    transition: isTransitioning ? 'transform 700ms cubic-bezier(0.25, 1, 0.5, 1)' : 'none',
                    transform: `translateX(calc(-${carouselIndex} * (100% / ${cardsToShow} + ${1.5 / cardsToShow}rem)))`,
                    width: '100%'
                  }}
                >
                  {extendedReviews.map((rev, idx) => (
                    <div
                      key={idx}
                      style={{
                        flex: `0 0 calc((100% - ${(cardsToShow - 1) * 1.5}rem) / ${cardsToShow})`,
                        minWidth: 0,
                        boxSizing: 'border-box'
                      }}
                    >
                      <div
                        style={{
                          backgroundColor: 'rgba(35, 21, 13, 0.75)',
                          backdropFilter: 'blur(16px)',
                          WebkitBackdropFilter: 'blur(16px)',
                          borderRadius: '24px',
                          border: '1px solid rgba(185, 205, 148, 0.25)',
                          boxShadow: '0 12px 32px rgba(0,0,0,0.35)',
                          padding: '2.25rem 1.75rem',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          height: '100%',
                          boxSizing: 'border-box'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', gap: '4px', color: '#b9cd94', marginBottom: '1.25rem' }}>
                            {[...Array(rev.rating)].map((_, i) => (
                              <Star key={i} size={18} fill="#b9cd94" color="#b9cd94" />
                            ))}
                          </div>

                          <p style={{ fontSize: '1.02rem', fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: '#FFFDF9', lineHeight: '1.65', marginBottom: '1.75rem', fontWeight: '500' }}>
                            "{rev.quote}"
                          </p>
                        </div>

                        <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '1rem' }}>
                          <strong style={{ fontSize: '1rem', color: '#FFFDF9', display: 'block', marginBottom: '0.25rem', fontWeight: '850' }}>
                            {rev.name}
                          </strong>
                          <span style={{ fontSize: '0.82rem', color: '#b9cd94', fontWeight: '700' }}>
                            {rev.role} • {rev.location}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Navigation Controls & Indicators */}
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1.5rem', marginTop: '3rem' }}>
                  <button
                    onClick={handlePrevSlide}
                    aria-label="Previous Testimonial"
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '50%',
                      border: '1.5px solid #b9cd94',
                      backgroundColor: '#244f21',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 4px 14px rgba(36, 79, 33, 0.4)'
                    }}
                  >
                    <ChevronLeft size={22} />
                  </button>

                  {/* Indicator Dots */}
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {reviews.map((_, idx) => {
                      const active = (carouselIndex % reviews.length) === idx;
                      return (
                        <button
                          key={idx}
                          onClick={() => {
                            setIsTransitioning(true);
                            setCarouselIndex(idx);
                          }}
                          style={{
                            width: active ? '24px' : '8px',
                            height: '8px',
                            borderRadius: '4px',
                            backgroundColor: active ? '#b9cd94' : 'rgba(255, 255, 255, 0.3)',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            padding: 0
                          }}
                          title={`Go to story ${idx + 1}`}
                        />
                      );
                    })}
                  </div>

                  <button
                    onClick={handleNextSlide}
                    aria-label="Next Testimonial"
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '50%',
                      border: '1.5px solid #b9cd94',
                      backgroundColor: '#244f21',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 4px 14px rgba(36, 79, 33, 0.4)'
                    }}
                  >
                    <ChevronRight size={22} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ================================================================== */}
        {/* NEW HOME PAGE PRODUCT CATALOGUE SECTION                            */}
        {/* ================================================================== */}
        <section 
          ref={catalogueRef} 
          className="reveal-fade-up home-catalogue-section" 
          style={{ padding: isMobile ? '4rem 0' : '6.5rem 0', backgroundColor: 'transparent', borderBottom: '1px solid rgba(255, 255, 255, 0.15)' }}
        >
          <div className="container" style={{ maxWidth: '1240px', margin: '0 auto', padding: '0 1rem' }}>
            
            {/* Header */}
            <div style={{ textAlign: 'center', maxWidth: '660px', margin: isMobile ? '0 auto 2.25rem' : '0 auto 3.5rem' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.6rem', fontSize: '0.85rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--accent-gold)', fontWeight: '800' }}>
                <Grid size={14} color="var(--accent-gold)" />
                <span>OUR COLLECTION</span>
              </span>
              <h2 style={{ fontSize: isMobile ? '2.1rem' : '2.8rem', color: '#FFFDF9', fontFamily: 'var(--font-serif)', fontWeight: '800', lineHeight: '1.2', margin: '0 0 0.85rem' }}>
                Explore the <span style={{ color: 'var(--accent-gold)' }}>MILASTY Collection</span>
              </h2>
              <p style={{ color: 'rgba(255, 255, 255, 0.88)', fontSize: isMobile ? '0.92rem' : '1.05rem', lineHeight: '1.65', margin: 0, fontWeight: '500' }}>
                Discover wholesome millet bakes made for everyday snacking, mindful moments and thoughtful gifting.
              </p>
            </div>

            {/* Compact Centered Category Pills Strip */}
            <div 
              style={{ 
                display: 'flex', 
                flexWrap: 'wrap',
                justifyContent: 'center', 
                gap: '0.75rem', 
                marginBottom: '2.5rem',
                padding: '0 0.5rem'
              }}
            >
              {homeCatalogueCategories.map((cat) => {
                const isSelected = selectedHomeCat === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedHomeCat(cat.id)}
                    style={{
                      padding: isMobile ? '0.65rem 1.15rem' : '0.75rem 1.65rem',
                      borderRadius: '999px',
                      backgroundColor: isSelected ? '#244f21' : 'rgba(35, 21, 13, 0.65)',
                      border: isSelected ? '1.5px solid #b9cd94' : '1px solid rgba(255, 255, 255, 0.25)',
                      color: isSelected ? '#FFFDF9' : 'rgba(255, 255, 255, 0.85)',
                      backdropFilter: 'blur(16px)',
                      WebkitBackdropFilter: 'blur(16px)',
                      cursor: 'pointer',
                      transition: 'all 0.25s ease',
                      boxShadow: isSelected ? '0 6px 20px rgba(36, 79, 33, 0.4)' : '0 4px 12px rgba(0, 0, 0, 0.2)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <span style={{ fontSize: '0.72rem', letterSpacing: '0.08em', fontWeight: '850', color: isSelected ? 'var(--accent-gold)' : 'rgba(255, 255, 255, 0.5)' }}>
                      {cat.number}
                    </span>
                    <span style={{ fontSize: isMobile ? '0.82rem' : '0.9rem', fontWeight: '800', letterSpacing: '0.04em' }}>
                      {cat.name}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Related 3-4 Products Preview (Compact 2x2 Grid on Mobile | 3-4 Columns on Desktop) */}
            <div className="catalogue-home-products-grid favorites-grid fitted-cards-container-4" style={{ marginBottom: '2.5rem' }}>
              {(() => {
                const allAvail = dbProducts.length > 0 ? dbProducts : initialProducts;
                let filtered = [];
                if (selectedHomeCat === 'starter') {
                  filtered = allAvail.filter(p => p.category === 'starter' || p.isFeatured || p.slug.includes('trio'));
                } else if (selectedHomeCat === 'daily') {
                  filtered = allAvail.filter(p => p.category === 'daily' || p.slug.includes('cookie') || p.slug.includes('bajra'));
                } else if (selectedHomeCat === 'gifting') {
                  filtered = allAvail.filter(p => p.category === 'gifting' || p.title.toLowerCase().includes('hamper') || p.title.toLowerCase().includes('box'));
                }
                if (filtered.length === 0) filtered = allAvail.slice(0, 4);
                return filtered.slice(0, 4).map((product) => (
                  <ProductCard key={product._id || product.slug} product={product} />
                ));
              })()}
            </div>

            {/* SEE THE FULL COLLECTION Button */}
            <div style={{ textAlign: 'center' }}>
              <Link
                to={`/catalogue?category=${selectedHomeCat}`}
                className="btn-primary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  padding: '0.9rem 2.25rem',
                  backgroundColor: '#244f21',
                  color: '#FFFFFF',
                  border: '1.5px solid #b9cd94',
                  borderRadius: '999px',
                  fontWeight: '850',
                  fontSize: '0.9rem',
                  letterSpacing: '0.05em',
                  textDecoration: 'none',
                  boxShadow: '0 8px 24px rgba(36, 79, 33, 0.35)',
                  transition: 'all 0.3s ease'
                }}
              >
                <span>SEE THE FULL COLLECTION</span>
                <ArrowRight size={18} color="#b9cd94" />
              </Link>
            </div>

          </div>
        </section>

        {/* 5. INTERACTIVE MILLET RITUAL SECTION */}
        <section ref={ritualRef} className="reveal-fade-up ritual-section" style={{ padding: isMobile ? '4rem 0' : '6.5rem 0', backgroundColor: 'transparent', borderBottom: '1px solid rgba(255, 255, 255, 0.15)' }}>
          <div className="container">
            <div style={{ textAlign: 'center', maxWidth: '640px', margin: isMobile ? '0 auto 2.5rem' : '0 auto 4rem' }}>
              <span style={{ display: 'inline-block', marginBottom: '0.75rem', fontSize: '0.85rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent-gold)', fontWeight: '800' }}>Interactive Selection</span>
              <h2 style={{ fontSize: isMobile ? '2.1rem' : '2.6rem', color: '#FFFFFF', fontFamily: 'var(--font-serif)', fontWeight: '800' }}>Discover Your Perfect <span style={{ color: 'var(--accent-gold)' }}>Millet Ritual</span></h2>
            </div>

            {/* DESKTOP & TABLET VIEW: Two-Column Showcase Layout */}
            <div className="desktop-ritual-view ritual-grid" style={{ display: isMobile ? 'none' : 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '3.5rem', alignItems: 'center' }}>
              {/* Left Side: Numbered Selector */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {ritualProducts.map((item, idx) => {
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
                        <span
                          style={{
                            fontSize: '1.25rem',
                            fontFamily: "var(--font-serif)",
                            fontWeight: '700',
                            color: isSelected ? 'var(--accent-gold)' : 'rgba(255, 255, 255, 0.6)',
                          }}
                        >
                          0{idx + 1}
                        </span>
                        <h3 className="ritual-item-title" style={{ fontSize: '1.15rem', color: '#FFFFFF', fontWeight: '500', margin: 0 }}>{item.title}</h3>
                      </div>
                      <ArrowRight size={18} style={{ color: '#FFFFFF', transform: isSelected ? 'translateX(4px)' : 'translateX(0)', transition: 'transform 0.2s' }} />
                    </div>
                  );
                })}
              </div>

              {/* Right Side: Showcase Card */}
              <div
                className="ritual-showcase"
                style={{
                  padding: '2.5rem',
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

            {/* MOBILE VIEW: Compact 2x2 Grid Selector + Detail Panel */}
            <div
              className="mobile-ritual-unified-card"
              style={{
                display: isMobile ? 'block' : 'none',
                width: '100%',
                margin: '0 auto',
                boxSizing: 'border-box'
              }}
            >
              {/* 4 Compact 2x2 Product Option Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.85rem', marginBottom: '1.25rem' }}>
                {ritualProducts.map((item, idx) => {
                  const isSelected = activeRitualIdx === idx;
                  // Assign icon based on index or title (Hampers get gift icon 🎁, Cookies get cookie icon 🍪)
                  const isHamper = idx < 2 || item.title.toLowerCase().includes('hamper') || item.title.toLowerCase().includes('celebration');
                  return (
                    <div
                      key={item._id || item.slug || idx}
                      onClick={() => setActiveRitualIdx(idx)}
                      className="glass-card"
                      style={{
                        padding: '0.9rem 0.85rem',
                        borderRadius: '18px',
                        backgroundColor: isSelected ? 'rgba(36, 79, 33, 0.45)' : 'rgba(35, 21, 13, 0.70)',
                        border: isSelected ? '1.5px solid var(--accent-gold)' : '1px solid rgba(245, 235, 221, 0.20)',
                        boxShadow: isSelected ? '0 8px 24px rgba(0, 0, 0, 0.35)' : 'none',
                        cursor: 'pointer',
                        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        height: '130px',
                        boxSizing: 'border-box',
                        minWidth: 0,
                        position: 'relative'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>{isHamper ? '🎁' : '🍪'}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-serif)', fontWeight: '900', color: isSelected ? 'var(--accent-gold)' : 'rgba(255,255,255,0.5)' }}>0{idx + 1}</span>
                          <ArrowRight size={13} style={{ color: isSelected ? 'var(--accent-gold)' : 'rgba(255,255,255,0.3)', transform: isSelected ? 'translateX(2px)' : 'none', transition: 'transform 0.2s' }} />
                        </div>
                      </div>

                      <div>
                        <h4 style={{ fontSize: '0.82rem', color: isSelected ? '#FFFFFF' : '#F5EBDD', fontWeight: '850', margin: 0, lineHeight: '1.3', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {item.title}
                        </h4>
                        <span style={{ fontSize: '0.64rem', color: isSelected ? 'var(--accent-gold)' : 'rgba(255,255,255,0.55)', fontWeight: '600', display: 'block', marginTop: '0.25rem' }}>
                          {isSelected ? '✓ Selected' : 'Tap to explore'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Selected Product Detail Panel Below 2x2 Grid */}
              <div
                style={{
                  backgroundColor: 'rgba(35, 21, 13, 0.88)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  borderRadius: '24px',
                  border: '1.5px solid var(--accent-gold)',
                  boxShadow: '0 16px 40px rgba(0, 0, 0, 0.45)',
                  padding: '1.25rem',
                  boxSizing: 'border-box',
                  transition: 'all 0.3s ease'
                }}
              >
                {/* Product Image */}
                <div
                  style={{
                    position: 'relative',
                    height: '210px',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    marginBottom: '1.15rem',
                    backgroundColor: 'rgba(0, 0, 0, 0.25)',
                    border: '1px solid rgba(255, 255, 255, 0.12)'
                  }}
                >
                  <img
                    src={activeRitualProduct.image}
                    alt={activeRitualProduct.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                      transition: 'opacity 0.3s ease'
                    }}
                  />
                </div>

                {/* Product Title & Description */}
                <div>
                  <h3 style={{ fontSize: '1.25rem', color: '#FFFDF9', marginBottom: '0.4rem', fontFamily: 'var(--font-serif)', fontWeight: '800' }}>
                    {activeRitualProduct.title}
                  </h3>
                  <p style={{ color: 'rgba(255, 255, 255, 0.88)', fontSize: '0.85rem', lineHeight: '1.55', marginBottom: '1.15rem', fontWeight: '500' }}>
                    {activeRitualProduct.description}
                  </p>

                  {/* Ingredient Tags */}
                  {activeRitualProduct.ingredients && activeRitualProduct.ingredients.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.15rem' }}>
                      {activeRitualProduct.ingredients.slice(0, 4).map((ingredient, i) => (
                        <span
                          key={i}
                          style={{
                            fontSize: '0.72rem',
                            color: 'rgba(255, 255, 255, 0.9)',
                            fontWeight: '650',
                            padding: '0.25rem 0.6rem',
                            borderRadius: '6px',
                            border: '1px solid rgba(255, 255, 255, 0.35)',
                            backgroundColor: 'rgba(255, 255, 255, 0.05)'
                          }}
                        >
                          {ingredient}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Price & CTA Button */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.15)' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.7)', display: 'block', fontWeight: '600' }}>From</span>
                      <span style={{ fontSize: '1.35rem', fontWeight: '850', color: '#FFFDF9' }}>
                        ₹{activeRitualProduct.variants?.[0]?.price || 139}
                      </span>
                    </div>
                    <Link
                      to={`/product/${activeRitualProduct.slug}`}
                      className="btn-primary"
                      style={{
                        padding: '0.65rem 1.25rem',
                        fontSize: '0.85rem',
                        backgroundColor: '#c89b3c',
                        color: '#FFFFFF',
                        fontWeight: '800',
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        borderRadius: '999px'
                      }}
                    >
                      <span>Explore Product</span>
                      <ArrowRight size={15} />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 7. LAB TEST / TRUST SECTION */}
        <section ref={labRef} className="reveal-fade-up lab-section" style={{ padding: isMobile ? '4rem 0' : '6.5rem 0', backgroundColor: 'transparent', borderBottom: '1px solid rgba(255, 255, 255, 0.15)' }}>
          <div className="container">
            <div className="lab-container" style={{ padding: isMobile ? '2rem 1.25rem' : '4.5rem 3.5rem', color: '#FFFFFF', borderRadius: '24px', textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1.25rem', fontSize: '0.85rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent-gold)', fontWeight: '800' }}>
                <Award size={14} />
                <span>Lab Tested Transparency</span>
              </span>

              <h2 style={{ fontSize: isMobile ? '2.1rem' : '2.8rem', color: '#FFFFFF', marginBottom: '1.25rem', fontFamily: 'var(--font-serif)', fontWeight: '800', lineHeight: '1.2' }}>
                Know What Goes Into <span style={{ color: 'var(--accent-gold)' }}>Every Bite.</span>
              </h2>

              <p style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: isMobile ? '0.92rem' : '1.05rem', lineHeight: '1.7', marginBottom: '2.25rem', fontWeight: '500', maxWidth: '640px', margin: '0 auto 2.25rem' }}>
                We publish comprehensive nutritional and chemical reports so you can make informed choices. Absolutely no hidden sugars or synthetic preservatives.
              </p>

              <Link to="/nutrition" className="btn-primary" style={{ backgroundColor: '#c89b3c', color: '#FFFFFF', border: 'none', fontWeight: '800', textDecoration: 'none', padding: '0.85rem 2rem', borderRadius: '999px', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={18} />
                <span>View Nutritional Specs →</span>
              </Link>
            </div>
          </div>
        </section>

        {/* 9. BRAND STORY SECTION */}
        <section ref={storyRef} className="reveal-fade-up story-section" style={{ padding: '6.5rem 0', backgroundColor: 'transparent', borderBottom: '1px solid rgba(255, 255, 255, 0.15)' }}>
          <div className="container">
            <div className="story-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '4rem', alignItems: 'center' }}>
              {/* <div style={{ borderRadius: '24px', overflow: 'hidden', border: '1px solid #FFFFFF' }}>
              <img 
                src="/images/image1.jpeg" 
                alt="Our baking process"
                style={{ width: '100%', height: '400px', objectFit: 'cover', display: 'block' }}
              />
            </div> */}
              <div className="glass-card" style={{ padding: '2.5rem', borderRadius: '24px' }}>
                <span style={{ display: 'inline-block', marginBottom: '1rem', fontSize: '0.85rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent-gold)', fontWeight: '800' }}>The Milasty Story</span>
                <h2 style={{ fontSize: '2.5rem', color: '#FFFFFF', fontFamily: 'var(--font-serif)', fontWeight: '800', marginBottom: '1.25rem', lineHeight: '1.2' }}>From Ancient Grains to <span style={{ color: 'var(--accent-gold)' }}>Modern Snack Rituals.</span></h2>
                <p style={{ color: 'rgba(255, 255, 255, 0.9)', lineHeight: '1.75', marginBottom: '1.5rem', fontWeight: '500' }}>
                  We believe that snacking shouldn't require compromising on health or heritage. Our journey began with a simple mission: to reintroduce traditional Indian super-grains like Bajra, Jowar, and Ragi back into modern diets.
                </p>
                <p style={{ color: 'rgba(255, 255, 255, 0.9)', lineHeight: '1.75', marginBottom: '2.25rem', fontWeight: '500' }}>
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
        <section ref={finalCtaRef} className="reveal-fade-up cta-section" style={{ padding: '5rem 0 7rem', backgroundColor: 'transparent' }}>
          <div className="container">
            <div
              className="cta-card"
              style={{
                padding: '5rem 2rem',
                textAlign: 'center',
                color: '#FFFFFF',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <h2 style={{ fontSize: '2.8rem', color: '#FFFFFF', marginBottom: '1.25rem', fontFamily: 'var(--font-serif)', fontWeight: '800' }}>
                Ready to Upgrade Your <span style={{ color: 'var(--accent-gold)' }}>Everyday Snack?</span>
              </h2>
              <p style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '1.1rem', maxWidth: '580px', margin: '0 auto 2.5rem', lineHeight: '1.7', fontWeight: '500' }}>
                Discover freshly baked millet cookies made with pure Desi Ghee and organic jaggery. Delivered fresh all across India.
              </p>
              <Link to="/shop" className="btn-primary" style={{ padding: '1.1rem 2.75rem', fontSize: '1.05rem', backgroundColor: '#c89b3c', color: '#FFFFFF', border: 'none', fontWeight: '800', textDecoration: 'none', borderRadius: '999px' }}>
                <span>Shop All Fresh Bakes →</span>
              </Link>

              <div style={{ marginTop: '2rem', fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.8)', letterSpacing: '0.05em', fontWeight: '700' }}>
                PAN-INDIA SHIPPING • FRESHLY BAKED ON ORDER
              </div>
            </div>
          </div>
        </section>

      </div> {/* Close home-content */}

      {/* CSS style overrides for horizontal scroll containers and fitted card grids */}
      <style>{`
        .horizontal-scroll-container::-webkit-scrollbar {
          display: none !important;
        }
        .horizontal-scroll-container {
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
        }
        .fitted-cards-container {
          display: grid !important;
          grid-template-columns: repeat(4, 1fr) !important;
          gap: 1.5rem !important;
          width: 100% !important;
          box-sizing: border-box !important;
        }
        .fitted-cards-container .glass-card {
          width: 100% !important;
          max-width: 100% !important;
          min-width: 0 !important;
          box-sizing: border-box !important;
          flex: none !important;
        }
        @media (min-width: 1025px) {
          .section-scroll-buttons {
            display: none !important;
          }
        }
        @media (max-width: 1024px) {
          .fitted-cards-container {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 1.25rem !important;
          }
        }
        @media (max-width: 640px) {
          .fitted-cards-container {
            display: flex !important;
            grid-template-columns: none !important;
            overflow-x: auto !important;
            scroll-behavior: smooth !important;
            padding-bottom: 1.25rem !important;
            gap: 1rem !important;
            -webkit-overflow-scrolling: touch;
          }
          .fitted-cards-container .glass-card {
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
