import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles, ShieldCheck, ArrowRight, Award, FileText, CheckCircle2,
  Star, ChevronLeft, ChevronRight, ChevronDown, Heart, ShoppingBag, Eye, Check, X, Quote, Grid,
  Flame, Leaf, Compass, Package, Cookie, HelpCircle, Gift, Building2, FileCheck, Apple
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
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [showAllIngredients, setShowAllIngredients] = useState(false);
  const [dbIngredients, setDbIngredients] = useState([]);
  const [activeCategorySlug, setActiveCategorySlug] = useState('cookies');
  const [activeFaq, setActiveFaq] = useState(null);

  // Dynamic Product Discovery CMS state
  const [discoveryConfig, setDiscoveryConfig] = useState({
    is_active: true,
    eyebrow: 'NOT SURE WHERE TO START?',
    title: 'Find Your Perfect MILASTY Snack',
    description: 'Something light. Something crunchy. Something chocolatey. Or something to share.',
    background_image_url: '',
    explore_button_text: 'EXPLORE ALL SNACKS →',
    explore_button_url: '/shop',
  });
  const [discoveryMoods, setDiscoveryMoods] = useState([]);
  const [selectedMoodId, setSelectedMoodId] = useState(null);

  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth <= 767 : false);

  // Scroll reveal references
  const heroRef = useScrollReveal();
  const trustRef = useScrollReveal();
  const categoryRef = useScrollReveal();
  const bestsellersRef = useScrollReveal();
  const whyRef = useScrollReveal();
  const moodRef = useScrollReveal();
  const ingredientsSectionRef = useScrollReveal();
  const pillarsRef = useScrollReveal();
  const customerTestimonialRef = useScrollReveal();
  const faqRef = useScrollReveal();
  const nutritionLabRef = useScrollReveal();
  const giftingCorporateRef = useScrollReveal();
  const finalCtaRef = useScrollReveal();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 767);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch Products & Categories & CMS
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
        const data = res.data;
        if (Array.isArray(data) && data.length > 0) {
          setCategories(data);
        } else if (data && Array.isArray(data.categories) && data.categories.length > 0) {
          setCategories(data.categories);
        } else {
          setCategories(defaultCategoryList);
        }
      })
      .catch(() => {
        setCategories(defaultCategoryList);
      });

    api.get('/ingredients')
      .then(res => {
        const list = Array.isArray(res.data)
          ? res.data
          : (Array.isArray(res.data?.ingredients) ? res.data.ingredients : (Array.isArray(res.data?.data) ? res.data.data : []));
        if (list.length > 0) {
          setDbIngredients(list);
        }
      })
      .catch((err) => console.log('Notice fetching ingredients:', err));

    api.get('/product-discovery')
      .then(res => {
        if (res.data && res.data.success) {
          if (res.data.section) setDiscoveryConfig(res.data.section);
          if (Array.isArray(res.data.moods) && res.data.moods.length > 0) {
            setDiscoveryMoods(res.data.moods);
            setSelectedMoodId(res.data.moods[0].id);
          }
        }
      })
      .catch(err => console.log('Notice fetching product discovery data:', err));
  }, []);

  // Fallback category dataset
  const defaultCategoryList = [
    { id: 'cookies', slug: 'cookies', name: 'Cookies', label: 'Cookies', subtitle: 'Handcrafted millet cookies in pure Desi Ghee' },
    { id: 'crackers', slug: 'crackers', name: 'Crackers', label: 'Crackers', subtitle: 'Crispy & savory wholesome millet crackers' },
    { id: 'brownies', slug: 'brownies', name: 'Brownies', label: 'Brownies', subtitle: 'Rich, chocolatey millet bakes naturally sweetened' },
    { id: 'gifting', slug: 'gifting', name: 'Gift Hampers', label: 'Gift Hampers', subtitle: 'Artisanal hampers for celebrations' },
  ];

  // Approved 11 FAQs dataset from PDF
  const faqs = [
    {
      q: "Do you deliver across India?",
      a: "Yes. We deliver MILASTY products across India through trusted courier partners."
    },
    {
      q: "Are MILASTY products baked fresh?",
      a: "Yes. Our cookies, crackers and brownies are made in small batches to maintain freshness, quality and taste."
    },
    {
      q: "What is the shelf life of MILASTY products?",
      a: "Shelf life varies by product. Please check the individual product page and packaging for the best-before information. Once opened, keep the product in an airtight container and consume it within the recommended period."
    },
    {
      q: "Are MILASTY products suitable for families?",
      a: "Our products are made with thoughtfully selected, familiar ingredients and are designed for everyday snacking and sharing with family. Please check the ingredients and allergen information for each product before consuming."
    },
    {
      q: "Are MILASTY products suitable for children?",
      a: "Our products may have a naturally crunchy or firm texture. For young children, please use your judgement based on their age and ability to chew safely, and always supervise while eating."
    },
    {
      q: "Do MILASTY products contain gluten or milk?",
      a: "It depends on the product. Some MILASTY products contain ingredients such as whole wheat (atta) and/or milk powder. Please check the individual product label for specific ingredients and allergen information."
    },
    {
      q: "Where can I find the ingredients and nutritional information?",
      a: "You can find the ingredients, allergen information and nutritional details on the respective product page and product packaging."
    },
    {
      q: "Do you offer gifting and bulk orders?",
      a: "Yes. We offer curated gift hampers, custom gifting and bulk orders for celebrations, offices, events and corporate requirements. Contact us to discuss your requirements."
    },
    {
      q: "Can I customize my MILASTY order based on my requirements?",
      a: "Yes. We offer customization for selected orders based on your requirements. Contact us to discuss your customization needs."
    },
    {
      q: "Are MILASTY products diabetic-friendly?",
      a: "Our regular products are not specifically diabetic-friendly, as they contain jaggery. However, we can prepare a custom sugar-free batch based on your requirements. The minimum order quantity for customization is 1 kg. Contact us to discuss your requirements."
    },
    {
      q: "Do you customize cakes?",
      a: "Yes. We offer customized cakes based on your preferred flavour, design and occasion. Contact us to discuss your requirements."
    }
  ];

  const allProductsList = dbProducts.length > 0 ? dbProducts : initialProducts;

  return (
    <div className="home-page-container" style={{ backgroundColor: '#F7F0E5', position: 'relative', overflowX: 'hidden' }}>

      {/* ================================================================== */}
      {/* 1. HERO SECTION — IMAGE 1: home_section_one.jpeg                   */}
      {/* ================================================================== */}
      <section
        ref={heroRef}
        className="home-hero-section"
        style={{
          position: 'relative',
          minHeight: isMobile ? 'auto' : '680px',
          height: isMobile ? 'auto' : '82vh',
          maxHeight: '900px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxSizing: 'border-box',
          padding: isMobile ? '3.5rem 1.25rem 4rem' : '4.5rem 2.5rem 5rem',
          overflow: 'hidden',
        }}
      >
        {/* Layer 0: Hero Background Image */}
        <div
          className="hero-background-layer"
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'url(/images/home_section_one.jpeg)',
            backgroundSize: 'cover',
            backgroundPosition: isMobile ? 'center center' : 'center right',
            backgroundRepeat: 'no-repeat',
            zIndex: 0,
          }}
        />

        {/* Layer 1: Warm Soft Gradient Overlay for Left Content Readability */}
        <div
          className="hero-overlay-layer"
          style={{
            position: 'absolute',
            inset: 0,
            background: isMobile
              ? 'linear-gradient(to bottom, rgba(247, 240, 229, 0.88) 0%, rgba(247, 240, 229, 0.72) 100%)'
              : 'linear-gradient(to right, rgba(247, 240, 229, 0.94) 0%, rgba(247, 240, 229, 0.82) 48%, rgba(247, 240, 229, 0.15) 100%)',
            zIndex: 1,
            pointerEvents: 'none',
          }}
        />

        {/* Layer 2: Hero Two-Sided Content Grid */}
        <div
          className="container hero-container"
          style={{
            position: 'relative',
            zIndex: 2,
            maxWidth: '1280px',
            margin: '0 auto',
            width: '100%',
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1.15fr 0.85fr',
            gap: isMobile ? '2rem' : '3.5rem',
            alignItems: 'center',
          }}
        >
          {/* Left Column: Real HTML Editable Content & CTAs */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: isMobile ? 'center' : 'flex-start',
              textAlign: isMobile ? 'center' : 'left',
            }}
          >
            {/* Handcrafted Badge */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                fontSize: '0.78rem',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: '#1F6B35',
                fontWeight: '800',
                marginBottom: '1rem',
                backgroundColor: 'rgba(31, 107, 53, 0.12)',
                padding: '0.38rem 0.95rem',
                borderRadius: '999px',
                border: '1px solid rgba(31, 107, 53, 0.25)',
              }}
            >
              <Leaf size={14} color="#1F6B35" />
              <span>HANDCRAFTED MILLET BAKES</span>
            </div>

            {/* Heading */}
            <h1
              className="hero-heading"
              style={{
                fontSize: 'clamp(2.6rem, 5.2vw, 4.4rem)',
                lineHeight: '1.08',
                color: '#3A1F14',
                marginBottom: '1.25rem',
                letterSpacing: '-0.02em',
                fontFamily: 'var(--font-serif, Georgia, serif)',
                fontWeight: '800',
              }}
            >
              Ancient Grains.<br />
              <span style={{ color: '#1F6B35', fontStyle: 'italic' }}>Modern Cravings.</span>
            </h1>

            {/* Description */}
            <p
              className="hero-subheading"
              style={{
                fontSize: 'clamp(1rem, 1.8vw, 1.18rem)',
                color: '#5C3A21',
                lineHeight: '1.65',
                marginBottom: '2rem',
                maxWidth: '560px',
                fontWeight: '500',
              }}
            >
              Delicious cookies, crackers & brownies made with <strong>millets</strong>, <strong>jaggery & desi ghee</strong> — crafted for the way you snack today.
            </p>

            {/* Rating & Social Proof */}
            <div
              style={{
                marginBottom: '2rem',
                display: 'inline-flex',
                gap: '0.6rem',
                alignItems: 'center',
                fontSize: '0.88rem',
                color: '#3A1F14',
                fontWeight: '700',
                flexWrap: 'wrap',
                justifyContent: isMobile ? 'center' : 'flex-start',
              }}
            >
              <div style={{ display: 'flex', color: '#1F6B35' }}>
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={16} fill="#1F6B35" color="#1F6B35" />
                ))}
              </div>
              <span style={{ fontWeight: '800', color: '#3A1F14' }}>4.9/5</span>
              <span style={{ color: '#A08670' }}>|</span>
              <span style={{ color: '#5C3A21', textDecoration: 'underline' }}>Loved by 10,000+ Conscious Snackers</span>
            </div>

            {/* Hero CTAs */}
            <div
              className="hero-buttons"
              style={{
                display: 'flex',
                gap: '1rem',
                flexWrap: 'wrap',
                justifyContent: isMobile ? 'center' : 'flex-start',
                alignItems: 'center',
              }}
            >
              {/* Primary Button: Deep MILASTY Green Pill */}
              <Link
                to="/shop"
                className="btn-primary"
                style={{
                  padding: '14px 28px',
                  fontSize: '0.95rem',
                  backgroundColor: '#1F6B35',
                  color: '#FFF9EF',
                  border: 'none',
                  fontWeight: '800',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  borderRadius: '999px',
                  boxShadow: '0 8px 20px rgba(31, 107, 53, 0.25)',
                  transition: 'all 0.25s ease',
                  minHeight: '52px',
                  boxSizing: 'border-box',
                }}
              >
                <span>Explore Our Bakes →</span>
              </Link>

              {/* Secondary Button: Cream Surface with Dark Border */}
              <a
                href="#why-milasty"
                className="btn-secondary"
                style={{
                  padding: '14px 28px',
                  fontSize: '0.95rem',
                  color: '#3A1F14',
                  fontWeight: '800',
                  backgroundColor: 'rgba(255, 249, 239, 0.8)',
                  border: '1.5px solid #3A1F14',
                  borderRadius: '999px',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  minHeight: '52px',
                  boxSizing: 'border-box',
                  transition: 'all 0.25s ease',
                }}
              >
                <span>Why MILASTY?</span>
              </a>
            </div>
          </div>

          {/* Right Column: Visual Placement Frame on Desktop */}
          {!isMobile && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              {/* Transparent spacer allowing the background image's photography to show crisply */}
              <div style={{ width: '100%', minHeight: '400px' }} />
            </div>
          )}
        </div>
      </section>

      {/* ================================================================== */}
      {/* ORGANIC CURVED SVG TRANSITION FROM HERO TO HOME_BG                */}
      {/* ================================================================== */}
      <div
        style={{
          position: 'relative',
          zIndex: 4,
          marginTop: '-40px',
          lineHeight: 0,
          overflow: 'hidden',
          pointerEvents: 'none',
        }}
      >
        <svg
          viewBox="0 0 1440 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ width: '100%', height: 'auto', display: 'block' }}
        >
          <path
            d="M0,32L48,42.7C96,53,192,75,288,80C384,85,480,75,576,64C672,53,768,43,864,48C960,53,1056,75,1152,80C1248,85,1344,75,1392,70L1440,64L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"
            fill="#F7EEDC"
          />
        </svg>
      </div>

      {/* ================================================================== */}
      {/* 2. HOME CONTENT WRAPPER — IMAGE 2: home_bg.jpeg (CONTINUOUS BG)    */}
      {/* ================================================================== */}
      <div
        className="home-content-wrapper"
        style={{
          position: 'relative',
          backgroundColor: '#F7EEDC',
        }}
      >
        {/* Layer 0: Continuous Background Image Layer */}
        <div
          className="home-content-background"
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'url(/images/home_bg.jpeg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center top',
            backgroundAttachment: 'fixed',
            backgroundRepeat: 'no-repeat',
            zIndex: 0,
          }}
        />

        {/* Layer 1: Subtle Light Warm Overlay to ensure image visibility & text readability */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(247, 238, 220, 0.22)',
            zIndex: 1,
            pointerEvents: 'none',
          }}
        />

        {/* Layer 2: All Home Content Sections */}
        <div className="home-content-inner" style={{ position: 'relative', zIndex: 2 }}>

          {/* SECTION 2 — TRUST / USP STRIP */}
          <section
            ref={trustRef}
            className="reveal-fade-up trust-section"
            style={{
              backgroundColor: 'transparent',
              padding: '1.75rem 0',
              borderBottom: '1px solid rgba(120, 75, 40, 0.14)',
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
                  color: '#3A1F14',
                  fontSize: isMobile ? '0.82rem' : '0.95rem',
                  fontWeight: '800',
                  letterSpacing: '0.02em',
                  textAlign: 'center',
                }}
              >
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ShieldCheck size={18} color="#1F6B35" />
                  <span>No Maida & no Palm Oil</span>
                </div>
                <span style={{ color: '#E8D2B5', display: isMobile ? 'none' : 'inline' }}>•</span>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Flame size={18} color="#1F6B35" />
                  <span>Baked in Desi Ghee</span>
                </div>
                <span style={{ color: '#E8D2B5', display: isMobile ? 'none' : 'inline' }}>•</span>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Sparkles size={18} color="#1F6B35" />
                  <span>Naturally sweetened with Jaggery</span>
                </div>
                <span style={{ color: '#E8D2B5', display: isMobile ? 'none' : 'inline' }}>•</span>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Leaf size={18} color="#1F6B35" />
                  <span>Made with Millets</span>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 3 — PRODUCT DISCOVERY BY CATEGORIES */}
          <section
            ref={categoryRef}
            className="reveal-fade-up categories-section"
            style={{
              padding: isMobile ? '4rem 0' : '6rem 0',
              backgroundColor: 'transparent',
              borderBottom: '1px solid rgba(120, 75, 40, 0.14)',
            }}
          >
            <div className="container" style={{ maxWidth: '1240px', margin: '0 auto', padding: '0 1rem' }}>
              
              <div style={{ textAlign: 'center', maxWidth: '660px', margin: '0 auto 3rem' }}>
                <span style={{ fontSize: '0.85rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#1F6B35', fontWeight: '800', display: 'block', marginBottom: '0.5rem' }}>
                  EXPLORE MILASTY COLLECTION
                </span>
                <h2 style={{ fontSize: isMobile ? '2.1rem' : '2.8rem', color: '#3A1F14', fontFamily: 'var(--font-serif, Georgia, serif)', fontWeight: '800', margin: 0, lineHeight: '1.2' }}>
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
                  marginBottom: '1.25rem',
                }}
              >
                {(showAllCategories ? categories : categories.slice(0, 4)).map((cat) => {
                  const isSelected = activeCategorySlug === cat.slug || activeCategorySlug === cat.id;
                  return (
                    <button
                      key={cat.id || cat.slug}
                      onClick={() => setActiveCategorySlug(cat.slug || cat.id)}
                      style={{
                        padding: isMobile ? '0.55rem 1.15rem' : '0.75rem 1.5rem',
                        borderRadius: '999px',
                        backgroundColor: isSelected ? '#1F6B35' : '#FFF9EF',
                        border: isSelected ? '1.5px solid #1F6B35' : '1px solid #E8D2B5',
                        color: isSelected ? '#FFF9EF' : '#3A1F14',
                        cursor: 'pointer',
                        fontSize: isMobile ? '0.82rem' : '0.9rem',
                        fontWeight: '800',
                        letterSpacing: '0.02em',
                        transition: 'all 0.25s ease',
                        boxShadow: isSelected ? '0 6px 20px rgba(31, 107, 53, 0.22)' : '0 2px 6px rgba(58, 31, 20, 0.04)',
                      }}
                    >
                      {cat.name || cat.label}
                    </button>
                  );
                })}
              </div>

              {categories.length > 4 && (
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                  <button
                    onClick={() => setShowAllCategories(!showAllCategories)}
                    style={{
                      padding: '0.55rem 1.35rem',
                      borderRadius: '999px',
                      backgroundColor: '#FFF9EF',
                      border: '1px solid #E8D2B5',
                      color: '#3A1F14',
                      fontSize: '0.82rem',
                      fontWeight: '800',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {showAllCategories ? 'Show Less Categories' : 'Explore Other Categories'}
                  </button>
                </div>
              )}

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
                    backgroundColor: '#1F6B35',
                    color: '#FFF9EF',
                    border: 'none',
                    borderRadius: '999px',
                    fontWeight: '800',
                    fontSize: '0.9rem',
                    textDecoration: 'none',
                    boxShadow: '0 6px 20px rgba(31, 107, 53, 0.2)',
                  }}
                >
                  <span>Browse Full {categories.find(c => c.slug === activeCategorySlug)?.name || 'Category'} Shop →</span>
                </Link>
              </div>

            </div>
          </section>

          {/* SECTION 4 — BESTSELLERS */}
          <section
            ref={bestsellersRef}
            className="reveal-fade-up bestsellers-section"
            style={{
              padding: isMobile ? '4rem 0' : '6.5rem 0',
              backgroundColor: 'transparent',
              borderBottom: '1px solid rgba(120, 75, 40, 0.14)',
            }}
          >
            <div className="container" style={{ maxWidth: '1240px', margin: '0 auto', padding: '0 1rem' }}>
              
              <div style={{ textAlign: 'center', maxWidth: '660px', margin: '0 auto 3rem' }}>
                <span style={{ fontSize: '0.85rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#1F6B35', fontWeight: '800', display: 'block', marginBottom: '0.5rem' }}>
                  THE ONES PEOPLE COME BACK FOR
                </span>
                <h2 style={{ fontSize: isMobile ? '2.1rem' : '2.8rem', color: '#3A1F14', fontFamily: 'var(--font-serif, Georgia, serif)', fontWeight: '800', margin: '0 0 0.75rem', lineHeight: '1.2' }}>
                  Your Next <span style={{ color: '#1F6B35' }}>Favourite Bake</span>
                </h2>
                <p style={{ color: '#5C3A21', fontSize: isMobile ? '0.92rem' : '1.05rem', margin: 0, fontWeight: '500' }}>
                  Discover the MILASTY bestsellers loved by our customers.
                </p>
              </div>

              {/* Bestseller Product Cards Grid */}
              <div className="bestsellers-grid fitted-cards-container-4" style={{ marginBottom: '3rem' }}>
                {(() => {
                  const bestsellers = allProductsList.filter(p => {
                    if (p.isBestseller === true || p.is_bestseller === true) return true;
                    if (Array.isArray(p.badges)) {
                      return p.badges.some(b => String(b).toLowerCase().replace(/\s+/g, '').includes('bestseller'));
                    }
                    return false;
                  });

                  if (bestsellers.length === 0) {
                    return (
                      <div style={{ textAlign: 'center', color: '#5C3A21', gridColumn: '1 / -1', padding: '2rem' }}>
                        <p style={{ fontSize: '1rem', opacity: 0.85 }}>No bestseller products marked yet. Mark products as Bestseller in Admin to feature them here.</p>
                      </div>
                    );
                  }

                  return bestsellers.map((product) => (
                    <ProductCard key={product._id || product.slug || product.id} product={product} />
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
                    backgroundColor: '#1F6B35',
                    color: '#FFF9EF',
                    border: 'none',
                    borderRadius: '999px',
                    fontWeight: '850',
                    fontSize: '0.92rem',
                    letterSpacing: '0.04em',
                    textDecoration: 'none',
                    boxShadow: '0 8px 24px rgba(31, 107, 53, 0.25)',
                  }}
                >
                  <span>EXPLORE ALL BESTSELLERS</span>
                  <ArrowRight size={18} color="#FFF9EF" />
                </Link>
              </div>

            </div>
          </section>

          {/* SECTION 5 — WHY MILASTY */}
          <section
            id="why-milasty"
            ref={whyRef}
            className="reveal-fade-up why-section"
            style={{
              backgroundColor: 'transparent',
              padding: isMobile ? '4rem 0' : '6.5rem 0',
              borderBottom: '1px solid rgba(120, 75, 40, 0.14)',
            }}
          >
            <div style={{ maxWidth: '1080px', margin: '0 auto', padding: '0 1rem' }}>
              
              <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
                <span style={{ fontSize: '0.85rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#1F6B35', fontWeight: '800', display: 'block', marginBottom: '0.5rem' }}>
                  WHY MILASTY?
                </span>
                <h2 style={{ fontSize: isMobile ? '2.1rem' : '2.8rem', fontFamily: 'var(--font-serif, Georgia, serif)', color: '#3A1F14', fontWeight: '850', marginBottom: '0.75rem' }}>
                  Because Better Ingredients Matter.
                </h2>
                <p style={{ fontSize: isMobile ? '0.92rem' : '1.05rem', color: '#5C3A21', fontWeight: '500', maxWidth: '650px', margin: '0 auto' }}>
                  Thoughtfully made bakes, with ingredients you can recognise and flavours you'll genuinely crave.
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
                    backgroundColor: '#FFF9EF',
                    border: '1.5px solid #1F6B35',
                    boxShadow: '0 8px 24px rgba(43, 20, 11, 0.06)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.75rem', paddingBottom: '1rem', borderBottom: '1px solid #E8D2B5' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(31, 107, 53, 0.15)', border: '1px solid #1F6B35', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CheckCircle2 size={18} color="#1F6B35" />
                    </div>
                    <h3 style={{ fontSize: '1.15rem', color: '#1F6B35', fontWeight: '900', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      WHAT GOES INTO MILASTY
                    </h3>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem' }}>
                    {[
                      { title: "Millets at the heart:", desc: "Ragi, Jowar & Bajra thoughtfully brought into everyday bakes." },
                      { title: "Desi ghee & jaggery:", desc: "Rich, familiar ingredients chosen for flavour as well as tradition." },
                      { title: "Small-batch craftsmanship:", desc: "Made with care, not just made at scale." },
                      { title: "Ingredient transparency:", desc: "We believe you should know exactly what goes into your snack." }
                    ].map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
                        <span style={{ color: '#1F6B35', fontWeight: '900', fontSize: '1.1rem', lineHeight: '1.2' }}>✓</span>
                        <div>
                          <h4 style={{ fontSize: '1rem', color: '#3A1F14', fontWeight: '800', margin: '0 0 0.25rem' }}>{item.title}</h4>
                          <p style={{ fontSize: '0.88rem', color: '#5C3A21', margin: 0, lineHeight: '1.5' }}>{item.desc}</p>
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
                    backgroundColor: '#FFF9EF',
                    border: '1.5px solid #E8D2B5',
                    boxShadow: '0 8px 24px rgba(43, 20, 11, 0.06)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.75rem', paddingBottom: '1rem', borderBottom: '1px solid #E8D2B5' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#FCE8E8', border: '1px solid #E06666', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <X size={18} color="#C0392B" />
                    </div>
                    <h3 style={{ fontSize: '1.15rem', color: '#3A1F14', fontWeight: '900', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      WHAT WE CHOOSE TO LEAVE OUT
                    </h3>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem' }}>
                    {[
                      { title: "No maida:", desc: "We don't use refined wheat flour in our millet cookies." },
                      { title: "No palm oil or Vanaspati:", desc: "We choose not to use palm oil or hydrogenated vegetable oil (Vanaspati) in our recipes." },
                      { title: "No added refined sugar:", desc: "We sweeten our recipes with jaggery instead." },
                      { title: "No unnecessary emulsifier, chemicals or additives:", desc: "We keep our recipes thoughtfully simple." }
                    ].map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
                        <span style={{ color: '#C0392B', fontWeight: '900', fontSize: '1.1rem', lineHeight: '1.2' }}>✕</span>
                        <div>
                          <h4 style={{ fontSize: '1rem', color: '#3A1F14', fontWeight: '800', margin: '0 0 0.25rem' }}>{item.title}</h4>
                          <p style={{ fontSize: '0.88rem', color: '#5C3A21', margin: 0, lineHeight: '1.5' }}>{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          </section>

          {/* DYNAMIC PRODUCT DISCOVERY BY MOOD */}
          {discoveryConfig.is_active !== false && (
            <section
              ref={moodRef}
              className="reveal-fade-up mood-section"
              style={{
                padding: isMobile ? '4rem 0' : '6.5rem 0',
                backgroundColor: 'transparent',
                borderBottom: '1px solid rgba(120, 75, 40, 0.14)',
                position: 'relative',
              }}
            >
              <div className="container" style={{ maxWidth: '1240px', margin: '0 auto', padding: '0 1rem', position: 'relative', zIndex: 2 }}>
                
                <div style={{ textAlign: 'center', maxWidth: '660px', margin: '0 auto 3rem' }}>
                  {discoveryConfig.eyebrow && (
                    <span style={{ fontSize: '0.85rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#1F6B35', fontWeight: '800', display: 'block', marginBottom: '0.5rem' }}>
                      {discoveryConfig.eyebrow}
                    </span>
                  )}
                  <h2 style={{ fontSize: isMobile ? '2.1rem' : '2.8rem', color: '#3A1F14', fontFamily: 'var(--font-serif, Georgia, serif)', fontWeight: '800', margin: '0 0 0.75rem', lineHeight: '1.2' }}>
                    {discoveryConfig.title || 'Find Your Perfect MILASTY Snack'}
                  </h2>
                  {discoveryConfig.description && (
                    <p style={{ color: '#5C3A21', fontSize: isMobile ? '0.92rem' : '1.05rem', margin: 0, fontWeight: '500' }}>
                      {discoveryConfig.description}
                    </p>
                  )}
                </div>

                {/* Mood Buttons Selector Pills */}
                {discoveryMoods.length > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      justifyContent: 'center',
                      gap: isMobile ? '0.55rem' : '0.85rem',
                      marginBottom: '2.5rem',
                    }}
                  >
                    {discoveryMoods.map((mood) => {
                      const isSelected = (selectedMoodId || discoveryMoods[0]?.id) === mood.id;
                      return (
                        <button
                          key={mood.id}
                          type="button"
                          onClick={() => setSelectedMoodId(mood.id)}
                          style={{
                            padding: isMobile ? '0.65rem 1.15rem' : '0.85rem 1.65rem',
                            borderRadius: '999px',
                            backgroundColor: isSelected ? '#1F6B35' : '#FFF9EF',
                            border: isSelected ? '1.5px solid #1F6B35' : '1px solid #E8D2B5',
                            color: isSelected ? '#FFF9EF' : '#3A1F14',
                            cursor: 'pointer',
                            fontSize: isMobile ? '0.82rem' : '0.92rem',
                            fontWeight: '800',
                            transition: 'all 0.25s ease',
                            boxShadow: isSelected ? '0 8px 24px rgba(31, 107, 53, 0.22)' : '0 2px 6px rgba(58, 31, 20, 0.04)',
                          }}
                        >
                          <span>{mood.name}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Selected Mood Products Display */}
                <div className="mood-products-grid fitted-cards-container-4" style={{ marginBottom: '2.5rem' }}>
                  {(() => {
                    const activeMoodObj = discoveryMoods.find(m => m.id === (selectedMoodId || discoveryMoods[0]?.id)) || discoveryMoods[0];
                    const moodProducts = activeMoodObj?.products || [];

                    if (moodProducts.length === 0) {
                      return (
                        <div style={{ textAlign: 'center', color: '#5C3A21', gridColumn: '1 / -1', padding: '3rem 1rem', backgroundColor: '#FFF9EF', borderRadius: '20px', border: '1px solid #E8D2B5' }}>
                          <p style={{ fontSize: '1rem', opacity: 0.85, margin: 0 }}>No snacks added to this collection yet.</p>
                        </div>
                      );
                    }

                    return moodProducts.map((product) => (
                      <ProductCard key={product._id || product.id || product.slug} product={product} />
                    ));
                  })()}
                </div>

                {/* Dynamic Explore All Button */}
                <div style={{ textAlign: 'center' }}>
                  <Link
                    to={discoveryConfig.explore_button_url || '/shop'}
                    className="btn-primary"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.85rem 2rem',
                      backgroundColor: '#1F6B35',
                      color: '#FFF9EF',
                      border: 'none',
                      borderRadius: '999px',
                      fontWeight: '800',
                      fontSize: '0.9rem',
                      textDecoration: 'none',
                    }}
                  >
                    <span>{discoveryConfig.explore_button_text || 'EXPLORE ALL SNACKS →'}</span>
                    <ArrowRight size={16} color="#FFF9EF" />
                  </Link>
                </div>

              </div>
            </section>
          )}

          {/* SECTION 6 — WHAT GOES INTO EVERY BAKE */}
          <section
            ref={ingredientsSectionRef}
            className="reveal-fade-up honest-baking-section"
            style={{
              backgroundColor: 'transparent',
              padding: isMobile ? '4rem 0' : '6.5rem 0',
              borderBottom: '1px solid rgba(120, 75, 40, 0.14)',
            }}
          >
            <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '0 1rem' }}>
              
              <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'flex-end', marginBottom: '3.5rem', gap: '1.5rem' }}>
                <div>
                  <span style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#1F6B35', fontWeight: '850', display: 'block', marginBottom: '0.5rem' }}>
                    HONEST INGREDIENTS
                  </span>
                  <h2 style={{ fontSize: isMobile ? '2.1rem' : '2.8rem', fontFamily: 'var(--font-serif, Georgia, serif)', color: '#3A1F14', fontWeight: '850', margin: '0 0 0.75rem' }}>
                    Know What Goes Into Your Bite.
                  </h2>
                  <p style={{ color: '#5C3A21', fontSize: isMobile ? '0.92rem' : '1.05rem', margin: 0, fontWeight: '500', maxWidth: '640px' }}>
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
                      backgroundColor: '#1F6B35',
                      color: '#FFF9EF',
                      border: 'none',
                      borderRadius: '999px',
                      fontWeight: '800',
                      fontSize: '0.9rem',
                      textDecoration: 'none',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <span>Explore Our Ingredients →</span>
                  </Link>
                  <div className="section-scroll-buttons" style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => scrollLeft(ingredientsRef)}
                      style={{ backgroundColor: '#FFF9EF', border: '1px solid #E8D2B5', color: '#3A1F14', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      onClick={() => scrollRight(ingredientsRef)}
                      style={{ backgroundColor: '#FFF9EF', border: '1px solid #E8D2B5', color: '#3A1F14', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>

              <div
                ref={ingredientsRef}
                className="horizontal-scroll-container fitted-cards-container-4"
                style={{ marginBottom: '2rem' }}
              >
                {(() => {
                  const defaultIngredients = [
                    { name: 'BAJRA', type: 'Pearl Millet', desc: 'Powerhouse of fiber, magnesium, and essential nutrients.', img: '/images/bajra.jpeg' },
                    { name: 'JOWAR', type: 'Sorghum Millet', desc: 'Gluten-free grain that aids digestion and regulates blood sugar.', img: '/images/jowar.jpeg' },
                    { name: 'RAGI', type: 'Finger Millet', desc: 'Calcium-rich grain that builds bone strength naturally.', img: '/images/ragi.jpeg' },
                    { name: 'DESI GHEE', type: 'Pure Cow Ghee', desc: 'Rich in A2 fats, vitamins, providing aroma and crisp texture.', img: '/images/ghee.jpeg' },
                  ];
                  const activeList = dbIngredients.length > 0 ? dbIngredients : defaultIngredients;
                  const itemsToDisplay = showAllIngredients ? activeList : activeList.slice(0, 4);

                  return itemsToDisplay.map((ingredient, idx) => (
                    <div key={ingredient.id || ingredient.name || idx} className="glass-card" style={{ textAlign: 'center', width: '100%', padding: '1.75rem 1.25rem', borderRadius: '20px', backgroundColor: '#FFF9EF', border: '1.5px solid #E8D2B5', boxShadow: '0 8px 24px rgba(43, 20, 11, 0.05)' }}>
                      <img
                        src={ingredient.image || ingredient.imageUrl || ingredient.image_url || ingredient.img}
                        alt={ingredient.name}
                        style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #E8D2B5', margin: '0 auto 1.25rem', display: 'block', boxShadow: '0 4px 12px rgba(43,20,11,0.08)' }}
                      />
                      <h4 style={{ fontSize: '1.05rem', fontWeight: '850', color: '#3A1F14', margin: '0 0 0.2rem 0' }}>{ingredient.name}</h4>
                      {(ingredient.subtitle || ingredient.type) && (
                        <span style={{ fontSize: '0.8rem', color: '#1F6B35', fontWeight: '850', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          {ingredient.subtitle || ingredient.type}
                        </span>
                      )}
                      <p style={{ fontSize: '0.85rem', color: '#5C3A21', lineHeight: '1.55', marginTop: '0.45rem', padding: '0 0.5rem', fontWeight: '550' }}>
                        {ingredient.description || ingredient.desc}
                      </p>
                    </div>
                  ));
                })()}
              </div>

              {((dbIngredients.length > 0 ? dbIngredients : [1,2,3,4,5]).length > 4) && (
                <div style={{ textAlign: 'center' }}>
                  <button
                    onClick={() => setShowAllIngredients(!showAllIngredients)}
                    style={{
                      padding: '0.75rem 1.75rem',
                      borderRadius: '999px',
                      backgroundColor: '#FFF9EF',
                      border: '1.5px solid #E8D2B5',
                      color: '#3A1F14',
                      fontSize: '0.88rem',
                      fontWeight: '800',
                      cursor: 'pointer',
                      transition: 'all 0.25s ease',
                    }}
                  >
                    {showAllIngredients ? 'Show Less Ingredients' : 'Explore Our Ingredients'}
                  </button>
                </div>
              )}

            </div>
          </section>

          {/* SECTION 7 — MILASTY 4 PILLARS */}
          <section
            ref={pillarsRef}
            className="reveal-fade-up pillars-section"
            style={{
              padding: isMobile ? '4rem 0' : '6.5rem 0',
              backgroundColor: 'transparent',
              borderBottom: '1px solid rgba(120, 75, 40, 0.14)',
            }}
          >
            <div className="container" style={{ maxWidth: '1240px', margin: '0 auto', padding: '0 1rem' }}>
              
              <div style={{ textAlign: 'center', maxWidth: '660px', margin: '0 auto 3.5rem' }}>
                <span style={{ fontSize: '0.85rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#1F6B35', fontWeight: '800', display: 'block', marginBottom: '0.5rem' }}>
                  OUR PROMISE
                </span>
                <h2 style={{ fontSize: isMobile ? '2.1rem' : '2.8rem', color: '#3A1F14', fontFamily: 'var(--font-serif, Georgia, serif)', fontWeight: '800', margin: '0 0 0.75rem', lineHeight: '1.2' }}>
                  Some Things We Simply <span style={{ color: '#1F6B35' }}>Won't Compromise On.</span>
                </h2>
                <p style={{ color: '#5C3A21', fontSize: isMobile ? '0.92rem' : '1.05rem', margin: 0, fontWeight: '500' }}>
                  Because “healthy” shouldn't be a marketing trick. It should be reflected in the ingredients.
                </p>
              </div>

              {/* 4 Pillars Cards Grid */}
              <div
                className="fitted-cards-container-4 pillars-grid-container"
                style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
                  gap: isMobile ? '0.75rem' : '1.5rem',
                  alignItems: 'stretch',
                }}
              >
                {[
                  {
                    pillar: '1. MILLETS AT THE HEART',
                    title: 'Millets at the Heart',
                    desc: 'Ragi, Jowar & Bajra — ancient Indian grains, reimagined for modern snacking.',
                    icon: Leaf
                  },
                  {
                    pillar: '2. MADE THE TRADITIONAL WAY',
                    title: 'Made the Traditional Way',
                    desc: 'Baked in desi ghee and sweetened with jaggery.',
                    icon: Flame
                  },
                  {
                    pillar: '3. CLEAN BY CHOICE',
                    title: 'Clean by Choice',
                    desc: 'No maida. No palm oil. No added refined sugar. No unnecessary additives.',
                    icon: ShieldCheck
                  },
                  {
                    pillar: '4. TASTE COMES FIRST',
                    title: 'Taste Comes First',
                    desc: 'Because a better snack is only better if you actually want another bite.',
                    icon: Sparkles
                  }
                ].map((p, idx) => {
                  const IconComp = p.icon;
                  return (
                    <div
                      key={idx}
                      className="glass-card pillar-card-item"
                      style={{
                        borderRadius: '20px',
                        padding: isMobile ? '1.25rem 1rem' : '2rem 1.5rem',
                        backgroundColor: '#FFF9EF',
                        border: '1.5px solid #E8D2B5',
                        boxShadow: '0 8px 24px rgba(43, 20, 11, 0.05)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        alignSelf: 'stretch',
                        boxSizing: 'border-box',
                        width: '100%',
                        height: '100%',
                        minHeight: isMobile ? '195px' : '240px',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                          <span style={{ fontSize: isMobile ? '0.65rem' : '0.75rem', fontWeight: '850', color: '#1F6B35', letterSpacing: '0.08em', textTransform: 'uppercase', backgroundColor: 'rgba(31, 107, 53, 0.12)', padding: '0.2rem 0.5rem', borderRadius: '999px', border: '1px solid rgba(31, 107, 53, 0.25)' }}>
                            PILLAR 0{idx + 1}
                          </span>
                          <div style={{ width: isMobile ? '30px' : '36px', height: isMobile ? '30px' : '36px', borderRadius: '50%', backgroundColor: 'rgba(31, 107, 53, 0.12)', border: '1px solid #1F6B35', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <IconComp size={isMobile ? 15 : 18} color="#1F6B35" />
                          </div>
                        </div>

                        <h3 style={{ fontSize: isMobile ? '1rem' : '1.25rem', color: '#3A1F14', fontFamily: 'var(--font-serif, Georgia, serif)', fontWeight: '850', marginBottom: '0.5rem', lineHeight: '1.25' }}>
                          {p.title}
                        </h3>
                      </div>

                      <p style={{ fontSize: isMobile ? '0.8rem' : '0.9rem', color: '#5C3A21', lineHeight: '1.55', margin: 0, fontWeight: '500', flexGrow: 1, display: 'flex', alignItems: 'flex-start' }}>
                        {p.desc}
                      </p>
                    </div>
                  );
                })}
              </div>

            </div>
          </section>

          {/* SECTION 8 — CUSTOMER REVIEWS */}
          <div ref={customerTestimonialRef} className="reveal-fade-up">
            <TestimonialSection />
          </div>

          {/* SECTION 9 — FREQUENTLY ASKED QUESTIONS */}
          <section
            ref={faqRef}
            className="reveal-fade-up faq-section"
            style={{
              padding: isMobile ? '4rem 0' : '6.5rem 0',
              backgroundColor: 'transparent',
              borderBottom: '1px solid rgba(120, 75, 40, 0.14)',
            }}
          >
            <div className="container" style={{ maxWidth: '850px', margin: '0 auto', padding: '0 1rem' }}>
              
              <div style={{ textAlign: 'center', marginBottom: isMobile ? '2.25rem' : '3.5rem' }}>
                <span style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#1F6B35', fontWeight: '800', display: 'block', marginBottom: '0.5rem' }}>
                  HELP CENTER
                </span>
                <h2 style={{ fontSize: isMobile ? '2rem' : '2.8rem', fontFamily: 'var(--font-serif, Georgia, serif)', color: '#3A1F14', fontWeight: '800', margin: 0, lineHeight: '1.2' }}>
                  Frequently Asked <span style={{ color: '#1F6B35' }}>Questions</span>
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
                        backgroundColor: '#FFF9EF',
                        border: isOpen ? '1.5px solid #1F6B35' : '1.5px solid #E8D2B5',
                        boxShadow: isOpen ? '0 8px 24px rgba(43, 20, 11, 0.08)' : '0 4px 16px rgba(43, 20, 11, 0.04)',
                        overflow: 'hidden',
                        boxSizing: 'border-box',
                        width: '100%',
                        transition: 'all 0.3s ease',
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
                          gap: '1rem',
                        }}
                      >
                        <span style={{ fontSize: isMobile ? '0.92rem' : '1.05rem', fontWeight: '800', color: '#3A1F14', flex: 1, fontFamily: 'var(--font-sans, sans-serif)' }}>
                          {faq.q}
                        </span>
                        <ChevronDown
                          size={20}
                          style={{
                            color: '#1F6B35',
                            transform: isOpen ? 'rotate(180deg)' : 'rotate(0)',
                            transition: 'transform 0.3s ease',
                            flexShrink: 0,
                          }}
                        />
                      </button>
                      
                      {isOpen && (
                        <div style={{ padding: isMobile ? '0 1.25rem 1.25rem 1.25rem' : '0 1.75rem 1.5rem 1.75rem', fontSize: isMobile ? '0.88rem' : '0.95rem', color: '#5C3A21', lineHeight: '1.65', fontWeight: '500', borderTop: '1px solid #E8D2B5', paddingTop: '1rem' }}>
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

            </div>
          </section>

          {/* SECTION 10 — NUTRITION & LAB TRANSPARENCY */}
          <section
            ref={nutritionLabRef}
            className="reveal-fade-up nutrition-lab-section"
            style={{
              padding: isMobile ? '4rem 0' : '6.5rem 0',
              backgroundColor: 'transparent',
              borderBottom: '1px solid rgba(120, 75, 40, 0.14)',
            }}
          >
            <div className="container" style={{ maxWidth: '1240px', margin: '0 auto', padding: '0 1rem' }}>
              
              <div style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto 3.5rem' }}>
                <span style={{ fontSize: '0.85rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#1F6B35', fontWeight: '800', display: 'block', marginBottom: '0.5rem' }}>
                  TESTED. DOCUMENTED. TRANSPARENT.
                </span>
                <h2 style={{ fontSize: isMobile ? '2.1rem' : '2.8rem', color: '#3A1F14', fontFamily: 'var(--font-serif, Georgia, serif)', fontWeight: '800', margin: '0 0 0.75rem', lineHeight: '1.2' }}>
                  See the Proof Behind the Pack.
                </h2>
                <p style={{ color: '#5C3A21', fontSize: isMobile ? '0.92rem' : '1.05rem', margin: 0, fontWeight: '500' }}>
                  Want to know more than what's on the front of the box? Explore our nutritional information, ingredient details and available laboratory reports.
                </p>
              </div>

              {/* 3 Mini Cards Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '1.5rem' }}>
                {/* Card 1: NUTRITION */}
                <div
                  className="glass-card"
                  style={{
                    borderRadius: '24px',
                    padding: '2.25rem 1.75rem',
                    backgroundColor: '#FFF9EF',
                    border: '1.5px solid #E8D2B5',
                    boxShadow: '0 8px 24px rgba(43, 20, 11, 0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxSizing: 'border-box',
                  }}
                >
                  <div>
                    <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: 'rgba(31, 107, 53, 0.12)', border: '1px solid #1F6B35', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                      <Apple size={22} color="#1F6B35" />
                    </div>
                    <h3 style={{ fontSize: '1.3rem', color: '#3A1F14', fontFamily: 'var(--font-serif, Georgia, serif)', fontWeight: '800', marginBottom: '0.75rem' }}>
                      1. NUTRITION
                    </h3>
                    <p style={{ fontSize: '0.92rem', color: '#5C3A21', lineHeight: '1.6', margin: '0 0 1.75rem', fontWeight: '500' }}>
                      See the nutritional information for our products.
                    </p>
                  </div>

                  <Link
                    to="/nutrition"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      color: '#1F6B35',
                      fontWeight: '800',
                      fontSize: '0.9rem',
                      textDecoration: 'none',
                    }}
                  >
                    <span>View Nutrition Details →</span>
                  </Link>
                </div>

                {/* Card 2: INGREDIENTS */}
                <div
                  className="glass-card"
                  style={{
                    borderRadius: '24px',
                    padding: '2.25rem 1.75rem',
                    backgroundColor: '#FFF9EF',
                    border: '1.5px solid #E8D2B5',
                    boxShadow: '0 8px 24px rgba(43, 20, 11, 0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxSizing: 'border-box',
                  }}
                >
                  <div>
                    <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: 'rgba(31, 107, 53, 0.12)', border: '1px solid #1F6B35', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                      <Leaf size={22} color="#1F6B35" />
                    </div>
                    <h3 style={{ fontSize: '1.3rem', color: '#3A1F14', fontFamily: 'var(--font-serif, Georgia, serif)', fontWeight: '800', marginBottom: '0.75rem' }}>
                      2. INGREDIENTS
                    </h3>
                    <p style={{ fontSize: '0.92rem', color: '#5C3A21', lineHeight: '1.6', margin: '0 0 1.75rem', fontWeight: '500' }}>
                      Explore what's inside each bake.
                    </p>
                  </div>

                  <Link
                    to="/nutrition"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      color: '#1F6B35',
                      fontWeight: '800',
                      fontSize: '0.9rem',
                      textDecoration: 'none',
                    }}
                  >
                    <span>Explore Ingredients →</span>
                  </Link>
                </div>

                {/* Card 3: LAB REPORTS */}
                <div
                  className="glass-card"
                  style={{
                    borderRadius: '24px',
                    padding: '2.25rem 1.75rem',
                    backgroundColor: '#FFF9EF',
                    border: '1.5px solid #E8D2B5',
                    boxShadow: '0 8px 24px rgba(43, 20, 11, 0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxSizing: 'border-box',
                  }}
                >
                  <div>
                    <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: 'rgba(31, 107, 53, 0.12)', border: '1px solid #1F6B35', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                      <FileCheck size={22} color="#1F6B35" />
                    </div>
                    <h3 style={{ fontSize: '1.3rem', color: '#3A1F14', fontFamily: 'var(--font-serif, Georgia, serif)', fontWeight: '800', marginBottom: '0.75rem' }}>
                      3. LAB REPORTS
                    </h3>
                    <p style={{ fontSize: '0.92rem', color: '#5C3A21', lineHeight: '1.6', margin: '0 0 1.75rem', fontWeight: '500' }}>
                      View available testing and reports.
                    </p>
                  </div>

                  <Link
                    to="/nutrition"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      color: '#1F6B35',
                      fontWeight: '800',
                      fontSize: '0.9rem',
                      textDecoration: 'none',
                    }}
                  >
                    <span>Access Lab Reports →</span>
                  </Link>
                </div>
              </div>

            </div>
          </section>

          {/* SECTION 11 — GIFTING + CORPORATE */}
          <section
            ref={giftingCorporateRef}
            className="reveal-fade-up gifting-corporate-section"
            style={{
              padding: isMobile ? '4rem 0' : '6.5rem 0',
              backgroundColor: 'transparent',
              borderBottom: '1px solid rgba(120, 75, 40, 0.14)',
            }}
          >
            <div className="container" style={{ maxWidth: '1240px', margin: '0 auto', padding: '0 1rem' }}>
              
              <div style={{ textAlign: 'center', maxWidth: '660px', margin: '0 auto 3.5rem' }}>
                <span style={{ fontSize: '0.85rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#1F6B35', fontWeight: '800', display: 'block', marginBottom: '0.5rem' }}>
                  MADE TO SHARE
                </span>
                <h2 style={{ fontSize: isMobile ? '2.1rem' : '2.8rem', color: '#3A1F14', fontFamily: 'var(--font-serif, Georgia, serif)', fontWeight: '800', margin: 0, lineHeight: '1.2' }}>
                  Good Food Is Better When It's Shared.
                </h2>
              </div>

              {/* 2 Content Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '2rem' }}>
                
                {/* CARD 1: GIFTING */}
                <div
                  className="glass-card"
                  style={{
                    borderRadius: '28px',
                    padding: isMobile ? '2rem 1.5rem' : '3rem 2.5rem',
                    backgroundColor: '#FFF9EF',
                    border: '1.5px solid #E8D2B5',
                    boxShadow: '0 8px 24px rgba(43, 20, 11, 0.06)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxSizing: 'border-box',
                  }}
                >
                  <div>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(31, 107, 53, 0.12)', border: '1px solid #1F6B35', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                      <Gift size={24} color="#1F6B35" />
                    </div>
                    <span style={{ fontSize: '0.8rem', fontWeight: '850', color: '#1F6B35', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }}>
                      CELEBRATIONS & MOMENTS
                    </span>
                    <h3 style={{ fontSize: isMobile ? '1.6rem' : '2rem', color: '#3A1F14', fontFamily: 'var(--font-serif, Georgia, serif)', fontWeight: '850', marginBottom: '1rem' }}>
                      GIFTING
                    </h3>
                    <p style={{ fontSize: isMobile ? '0.92rem' : '1.02rem', color: '#5C3A21', lineHeight: '1.7', margin: '0 0 2rem', fontWeight: '500' }}>
                      Thoughtful gifts, made with millet. Cookies, brownies, crackers and curated hampers for birthdays, festivals, celebrations and special moments.
                    </p>
                  </div>

                  <div>
                    <Link
                      to="/shop"
                      className="btn-primary"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.85rem 2rem',
                        backgroundColor: '#1F6B35',
                        color: '#FFF9EF',
                        border: 'none',
                        borderRadius: '999px',
                        fontWeight: '800',
                        fontSize: '0.92rem',
                        textDecoration: 'none',
                        boxShadow: '0 8px 24px rgba(31, 107, 53, 0.25)',
                      }}
                    >
                      <span>Explore Gift Hampers →</span>
                    </Link>
                  </div>
                </div>

                {/* CARD 2: CORPORATE & BULK ORDERS */}
                <div
                  className="glass-card"
                  style={{
                    borderRadius: '28px',
                    padding: isMobile ? '2rem 1.5rem' : '3rem 2.5rem',
                    backgroundColor: '#FFF9EF',
                    border: '1.5px solid #E8D2B5',
                    boxShadow: '0 8px 24px rgba(43, 20, 11, 0.06)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxSizing: 'border-box',
                  }}
                >
                  <div>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(31, 107, 53, 0.12)', border: '1px solid #1F6B35', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                      <Building2 size={24} color="#1F6B35" />
                    </div>
                    <span style={{ fontSize: '0.8rem', fontWeight: '850', color: '#1F6B35', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }}>
                      OFFICES & EVENTS
                    </span>
                    <h3 style={{ fontSize: isMobile ? '1.6rem' : '2rem', color: '#3A1F14', fontFamily: 'var(--font-serif, Georgia, serif)', fontWeight: '850', marginBottom: '1rem' }}>
                      CORPORATE & BULK ORDERS
                    </h3>
                    <p style={{ fontSize: isMobile ? '0.92rem' : '1.02rem', color: '#5C3A21', lineHeight: '1.7', margin: '0 0 2rem', fontWeight: '500' }}>
                      Better snacking for teams, offices & events. Custom snack boxes and gifting solutions for offices, startups, events and corporate occasions.
                    </p>
                  </div>

                  <div>
                    <Link
                      to="/contact"
                      className="btn-primary"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.85rem 2rem',
                        backgroundColor: '#1F6B35',
                        color: '#FFF9EF',
                        border: 'none',
                        borderRadius: '999px',
                        fontWeight: '800',
                        fontSize: '0.92rem',
                        textDecoration: 'none',
                        boxShadow: '0 8px 24px rgba(31, 107, 53, 0.25)',
                      }}
                    >
                      <span>Enquire for Bulk Orders →</span>
                    </Link>
                  </div>
                </div>

              </div>

            </div>
          </section>

          {/* SECTION 12 — FINAL CTA */}
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
                  color: '#3A1F14',
                  position: 'relative',
                  borderRadius: '32px',
                  border: '1.5px solid #E8D2B5',
                  backgroundColor: '#FFF9EF',
                  boxShadow: '0 12px 40px rgba(43, 20, 11, 0.08)',
                  overflow: 'hidden',
                }}
              >
                <h2 style={{ fontSize: isMobile ? '2.1rem' : '3.2rem', color: '#3A1F14', marginBottom: '1.25rem', fontFamily: 'var(--font-serif, Georgia, serif)', fontWeight: '800', lineHeight: '1.18' }}>
                  Ready to Upgrade Your <span style={{ color: '#1F6B35' }}>Everyday Snack?</span>
                </h2>
                
                <p style={{ color: '#5C3A21', fontSize: isMobile ? '0.95rem' : '1.15rem', maxWidth: '620px', margin: '0 auto 2.5rem', lineHeight: '1.7', fontWeight: '500' }}>
                  Discover freshly baked millet snacks & desserts made with pure Desi Ghee and Organic Jaggery. Delivered fresh all across India.
                </p>
                
                <Link
                  to="/shop"
                  className="btn-primary"
                  style={{
                    padding: isMobile ? '0.95rem 2.2rem' : '1.1rem 2.75rem',
                    fontSize: isMobile ? '0.95rem' : '1.05rem',
                    backgroundColor: '#1F6B35',
                    color: '#FFF9EF',
                    border: 'none',
                    fontWeight: '800',
                    textDecoration: 'none',
                    borderRadius: '999px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    boxShadow: '0 8px 24px rgba(31, 107, 53, 0.25)',
                  }}
                >
                  <span>Explore all Fresh Bakes →</span>
                </Link>

                <div style={{ marginTop: '2.25rem', fontSize: '0.85rem', color: '#1F6B35', letterSpacing: '0.08em', fontWeight: '800', textTransform: 'uppercase' }}>
                  All India Shipping • Freshly Baked on Order
                </div>
              </div>
            </div>
          </section>

        </div> {/* Close home-content-inner */}
      </div> {/* Close home-content-wrapper */}

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
        .pillars-section .fitted-cards-container-4 {
          align-items: stretch !important;
        }
        .pillars-section .glass-card,
        .pillars-section .pillar-card-item {
          height: 100% !important;
          display: flex !important;
          flex-direction: column !important;
          justify-content: space-between !important;
        }
        @media (max-width: 640px) {
          .pillars-section .fitted-cards-container-4 {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
            overflow-x: visible !important;
            gap: 0.75rem !important;
          }
          .pillars-section .fitted-cards-container-4 .glass-card,
          .pillars-section .pillar-card-item {
            flex: 1 1 100% !important;
            width: 100% !important;
            max-width: 100% !important;
            min-width: 0 !important;
            min-height: 195px !important;
            height: 100% !important;
          }
        }
      `}</style>

    </div>
  );
}
