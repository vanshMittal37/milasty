import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, ChevronRight, ShoppingBag, Leaf, Sparkles, 
  Shield, Award, ArrowRight, Star, ChevronLeft, Check, Filter,
  Calendar, Truck, Gift
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
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [recSelectedOption, setRecSelectedOption] = useState(null);

  // Reviews Carousel State & Automatic Auto-play (every 2.0s with hover/swipe pause)
  const [reviewIndex, setReviewIndex] = useState(0);
  const [isReviewHovered, setIsReviewHovered] = useState(false);
  const [reviewTouchStartX, setReviewTouchStartX] = useState(null);
  const [reviewTouchStartY, setReviewTouchStartY] = useState(null);

  useEffect(() => {
    if (isReviewHovered) return;
    const timer = setInterval(() => {
      setReviewIndex((prev) => (prev + 1) % 5);
    }, 2000);
    return () => clearInterval(timer);
  }, [isReviewHovered]);

  // Mobile Products Carousel Index State
  const [shopProductsIndex, setShopProductsIndex] = useState(0);
  const [isShopProductsHovered, setIsShopProductsHovered] = useState(false);
  const [shopProductsTouchStartX, setShopProductsTouchStartX] = useState(null);
  const [shopProductsTouchStartY, setShopProductsTouchStartY] = useState(null);

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

  // Single Source of Truth for Categories
  const categoriesList = [
    { 
      id: 'starter', 
      number: '01',
      name: 'STARTER FAVOURITES', 
      label: 'Starter Favourites', 
      subtitle: 'Curated tasting boxes & best sellers',
      image: '/images/image1.jpeg' 
    },
    { 
      id: 'daily', 
      number: '02',
      name: 'DAILY RITUAL', 
      label: 'Daily Ritual', 
      subtitle: 'Guilt-free everyday tea companions',
      image: '/images/bajra.jpeg' 
    },
    { 
      id: 'gifts', 
      number: '03',
      name: 'GIFTING HAMPERS', 
      label: 'Gifting Hampers', 
      subtitle: 'Luxury artisanal gift hampers',
      image: '/images/image2.jpeg' 
    },
    { 
      id: 'cookies', 
      number: '04',
      name: 'COOKIES', 
      label: 'Cookies', 
      subtitle: 'Pure Desi Ghee millet cookies',
      image: '/images/jowar.jpeg' 
    },
  ];

  // Helper function to check product category match
  const matchesCategoryFilter = (p, catId) => {
    if (catId === 'all') return true;
    if (p.category === catId) return true;
    if (catId === 'gifts' && (p.category === 'gifting' || p.title.toLowerCase().includes('hamper') || p.title.toLowerCase().includes('box'))) return true;
    if (catId === 'cookies' && (p.category === 'daily' || p.title.toLowerCase().includes('cookies') || p.slug.includes('cookies'))) return true;
    if (catId === 'starter' && (p.category === 'starter' || p.isFeatured || p.title.toLowerCase().includes('trio'))) return true;
    return false;
  };

  // Filter categories to ensure only categories with at least 1 matching product are active
  const activeCategoryList = categoriesList.filter(cat => 
    products.some(p => matchesCategoryFilter(p, cat.id))
  );

  // Full category list including "ALL BAKES" for filter modal & catalogue
  const modalCategoryList = [
    { id: 'all', number: '00', name: 'ALL BAKES', label: 'All Bakes', subtitle: 'Explore the complete MILASTY collection' },
    ...activeCategoryList
  ];

  // Featured Products (Normal Product Cards, NOT circular)
  const featuredProducts = products.filter(p => p.isFeatured || p.category === 'starter');

  // Filtered Catalogue Products
  const displayedProducts = products.filter(p => {
    const matchesCat = matchesCategoryFilter(p, selectedCategory);
    const matchesSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Mobile Products Carousel Auto-play (every 2.0s with hover/swipe pause)
  useEffect(() => {
    if (!isMobile || isShopProductsHovered || displayedProducts.length <= 2) return;
    const maxIndex = Math.max(0, displayedProducts.length - 2);
    const timer = setInterval(() => {
      setShopProductsIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
    }, 2000);
    return () => clearInterval(timer);
  }, [isMobile, isShopProductsHovered, displayedProducts.length]);

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

  // Custom Future Favourites Bakes Data (Tailored Luxury Themes for Wood Background)
  const customFutureFavourites = [
    {
      id: 'signature-trio-box',
      title: 'Signature Trio Box',
      badgeText: '🔥 BESTSELLER',
      desc: '3 timeless MILASTY delights in 1 box.',
      preBookPrice: '₹549',
      originalPrice: '₹650',
      shippingDate: 'SHIPPING STARTS 15TH JUNE',
      image: '/images/image1.jpeg',
      features: [
        { icon: Leaf, label: 'Wholesome' },
        { icon: Gift, label: 'Gifting' },
        { icon: Award, label: 'Top Rated' },
      ],
      // Luxury Amber Cocoa Theme
      bgGradient: 'linear-gradient(180deg, rgba(46, 26, 15, 0.92) 0%, rgba(26, 14, 8, 0.96) 100%)',
      borderColor: 'rgba(212, 175, 55, 0.45)',
      titleColor: '#FFFDF9',
      badgeBg: 'linear-gradient(135deg, #D4AF37 0%, #AA8222 100%)',
      badgeColor: '#1A0E07',
      priceBoxBg: '#D8BA96',
      priceLabelColor: '#382315',
      priceTextColor: '#FFFDF9',
      btnBg: '#241208',
      btnColor: '#FFFDF9',
      featureIconColor: '#D4AF37',
      featureTextColor: '#FFFDF9',
      featuresBg: 'rgba(0, 0, 0, 0.3)',
      featuresBorder: 'rgba(212, 175, 55, 0.2)',
    },
    {
      id: 'cardamom-bajra-cookies',
      title: 'Cardamom Bajra Cookies',
      badgeText: '🍃 HIGH FIBER',
      desc: 'Pearl millet cookies with green cardamom.',
      preBookPrice: '₹99',
      originalPrice: '₹120',
      shippingDate: 'SHIPPING STARTS 20TH JUNE',
      image: '/images/bajra.jpeg',
      features: [
        { icon: Leaf, label: 'High Fiber' },
        { icon: Shield, label: 'Digestion' },
        { icon: Sparkles, label: 'No Sugar' },
      ],
      // Deep Forest Emerald Glass Theme (Same as Card 3)
      bgGradient: 'linear-gradient(180deg, rgba(30, 44, 20, 0.92) 0%, rgba(18, 28, 12, 0.96) 100%)',
      borderColor: '#557038',
      titleColor: '#FFFDF9',
      badgeBg: '#3D5625',
      badgeColor: '#FAF4EB',
      priceBoxBg: '#8BA460',
      priceLabelColor: '#15240A',
      priceTextColor: '#101C07',
      btnBg: '#728C47',
      btnColor: '#101C07',
      featureIconColor: '#A3B580',
      featureTextColor: '#FFFDF9',
      featuresBg: 'rgba(0, 0, 0, 0.25)',
      featuresBorder: 'rgba(255, 255, 255, 0.08)',
    },
    {
      id: 'coconut-jowar-cookies',
      title: 'Coconut Jowar Cookies',
      badgeText: '🛡 GLUTEN-FREE',
      desc: 'Light sorghum cookies with toasted coconut.',
      preBookPrice: '₹99',
      originalPrice: '₹120',
      shippingDate: 'SHIPPING STARTS 18TH JUNE',
      image: '/images/jowar.jpeg',
      features: [
        { icon: Shield, label: 'Gluten Free' },
        { icon: Award, label: 'Protein' },
        { icon: Leaf, label: 'Jowar' },
      ],
      // Deep Forest Emerald Glass Theme
      bgGradient: 'linear-gradient(180deg, rgba(30, 44, 20, 0.92) 0%, rgba(18, 28, 12, 0.96) 100%)',
      borderColor: '#557038',
      titleColor: '#FFFDF9',
      badgeBg: '#3D5625',
      badgeColor: '#FAF4EB',
      priceBoxBg: '#8BA460',
      priceLabelColor: '#15240A',
      priceTextColor: '#101C07',
      btnBg: '#728C47',
      btnColor: '#101C07',
      featureIconColor: '#A3B580',
      featureTextColor: '#FFFDF9',
      featuresBg: 'rgba(0, 0, 0, 0.25)',
      featuresBorder: 'rgba(255, 255, 255, 0.08)',
    },
    {
      id: 'cocoa-ragi-cookies',
      title: 'Cocoa Ragi Cookies',
      badgeText: '💪 CALCIUM+',
      desc: 'Finger millet blended with Dutch cocoa.',
      preBookPrice: '₹99',
      originalPrice: '₹120',
      shippingDate: 'SHIPPING STARTS 22ND JUNE',
      image: '/images/ragi.jpeg',
      features: [
        { icon: Shield, label: 'Calcium' },
        { icon: Award, label: 'Strong Bone' },
        { icon: Sparkles, label: 'Real Cocoa' },
      ],
      // Deep Velvet Cocoa & Copper Accent Theme
      bgGradient: 'linear-gradient(180deg, rgba(58, 30, 20, 0.92) 0%, rgba(33, 16, 10, 0.96) 100%)',
      borderColor: '#A87045',
      titleColor: '#FFFDF9',
      badgeBg: '#C8733B',
      badgeColor: '#FFFDF9',
      priceBoxBg: '#DFB28C',
      priceLabelColor: '#2A140A',
      priceTextColor: '#1A0B05',
      btnBg: '#261107',
      btnColor: '#FFFDF9',
      featureIconColor: '#DFB28C',
      featureTextColor: '#FFFDF9',
      featuresBg: 'rgba(0, 0, 0, 0.28)',
      featuresBorder: 'rgba(223, 178, 140, 0.2)',
    },
  ];

  // Category Click Handler → Auto Select Filter & Smooth Scroll to Catalogue
  const handleCategoryClick = (catId) => {
    setSelectedCategory(catId);
    setFilterModalOpen(false);
    
    // Smooth scroll to product catalogue section
    const targetEl = document.getElementById('browse-milasty-collection');
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleScrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
      {/* 2. FUTURE FAVOURITES / WHAT'S NEXT FROM MILASTY                     */}
      {/* ================================================================== */}
      <section 
        id="future-favourites-section" 
        style={{ 
          padding: isMobile ? '2.5rem 1rem 3.5rem' : '4.5rem 1.5rem 5rem', 
          maxWidth: '1280px', 
          margin: '0 auto', 
          boxSizing: 'border-box' 
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', maxWidth: '780px', margin: isMobile ? '0 auto 2rem' : '0 auto 3rem' }}>
          <span 
            style={{ 
              fontSize: '0.8rem', 
              textTransform: 'uppercase', 
              letterSpacing: '0.18em', 
              color: '#A3B580', 
              fontWeight: '800', 
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.65rem'
            }}
          >
            <Leaf size={14} color="#A3B580" /> FUTURE FAVOURITES <Leaf size={14} color="#A3B580" />
          </span>
          <h2 
            style={{ 
              fontSize: isMobile ? '2.2rem' : '3.4rem', 
              fontFamily: 'var(--font-serif), "Playfair Display", Georgia, serif', 
              color: '#FFFDF9', 
              fontWeight: '800', 
              margin: '0 0 0.85rem 0', 
              lineHeight: '1.2' 
            }}
          >
            What's Next from <span style={{ color: '#A3B580' }}>MILASTY</span>
          </h2>
          <p 
            style={{ 
              fontSize: isMobile ? '0.92rem' : '1.08rem', 
              color: '#EADEC9', 
              margin: '0 auto 1.5rem', 
              fontWeight: '500',
              lineHeight: '1.6',
              maxWidth: '620px'
            }}
          >
            Exciting new bakes, handcrafted with the goodness you love.<br />
            Pre-book your favourites now and be the first to enjoy!
          </p>

          <span
            style={{
              backgroundColor: 'rgba(36, 79, 33, 0.45)',
              color: '#EADEC9',
              border: '1.5px solid rgba(163, 181, 128, 0.45)',
              padding: '0.45rem 1.25rem',
              borderRadius: '25px',
              fontSize: '0.78rem',
              fontWeight: '700',
              letterSpacing: '0.08em',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)'
            }}
          >
            <Calendar size={14} color="#A3B580" /> NOW OPEN FOR PRE-BOOKING
          </span>
        </div>

        {/* 4 Custom Product Cards Grid (Short, Compact & Concise Design) */}
        <div 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', 
            gap: isMobile ? '0.65rem' : '1.15rem', 
            alignItems: 'stretch' 
          }}
        >
          {customFutureFavourites.map((item) => (
            <div
              key={item.id}
              style={{
                background: item.bgGradient,
                borderRadius: isMobile ? '14px' : '20px',
                border: `1.5px solid ${item.borderColor}`,
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
                padding: isMobile ? '0.65rem 0.55rem 0.6rem' : '1.15rem 1rem 1rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                overflow: 'hidden',
                boxSizing: 'border-box',
                transition: 'transform 0.3s ease, border-color 0.3s ease',
              }}
            >
              <div>
                {/* Top Badge */}
                <div style={{ marginBottom: isMobile ? '0.35rem' : '0.75rem' }}>
                  <span
                    style={{
                      background: item.badgeBg,
                      color: item.badgeColor,
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      padding: isMobile ? '0.18rem 0.45rem' : '0.3rem 0.8rem',
                      borderRadius: '20px',
                      fontSize: isMobile ? '0.54rem' : '0.7rem',
                      fontWeight: '800',
                      letterSpacing: '0.03em',
                      textTransform: 'uppercase',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.2rem',
                    }}
                  >
                    {item.badgeText}
                  </span>
                </div>

                {/* Card Title & Side Thumbnail Image Layout */}
                <div 
                  style={{ 
                    display: 'grid', 
                    gridTemplateColumns: isMobile ? '1fr 55px' : '1fr 85px', 
                    gap: isMobile ? '0.35rem' : '0.65rem', 
                    alignItems: 'center', 
                    marginBottom: isMobile ? '0.35rem' : '0.75rem' 
                  }}
                >
                  <div>
                    <h3
                      style={{
                        margin: 0,
                        fontSize: isMobile ? '0.85rem' : '1.1rem',
                        fontWeight: '800',
                        color: item.titleColor,
                        fontFamily: 'var(--font-serif), "Playfair Display", Georgia, serif',
                        lineHeight: '1.2',
                      }}
                    >
                      {item.title}
                    </h3>
                  </div>
                  <div 
                    style={{ 
                      width: isMobile ? '55px' : '85px', 
                      height: isMobile ? '55px' : '85px', 
                      borderRadius: isMobile ? '8px' : '12px', 
                      overflow: 'hidden', 
                      boxShadow: '0 4px 10px rgba(0,0,0,0.3)', 
                      border: '1px solid rgba(255,255,255,0.15)', 
                      flexShrink: 0 
                    }}
                  >
                    <img
                      src={item.image}
                      alt={item.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                  </div>
                </div>

                {/* Description */}
                <p
                  style={{
                    fontSize: isMobile ? '0.68rem' : '0.82rem',
                    color: item.descColor || 'rgba(255, 255, 255, 0.82)',
                    lineHeight: '1.3',
                    marginBottom: isMobile ? '0.35rem' : '0.85rem',
                    fontWeight: '400',
                    margin: isMobile ? '0 0 0.35rem 0' : '0 0 0.85rem 0',
                  }}
                >
                  {item.desc}
                </p>

                {/* 3 Feature Badges */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '0.1rem',
                    marginBottom: isMobile ? '0.45rem' : '0.85rem',
                    textAlign: 'center',
                    padding: isMobile ? '0.25rem 0.15rem' : '0.5rem 0.3rem',
                    backgroundColor: item.featuresBg || 'rgba(0, 0, 0, 0.22)',
                    borderRadius: isMobile ? '8px' : '10px',
                    border: `1px solid ${item.featuresBorder || 'rgba(255, 255, 255, 0.08)'}`,
                  }}
                >
                  {item.features.map((feat, idx) => {
                    const FeatIcon = feat.icon;
                    return (
                      <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.1rem' }}>
                        <FeatIcon size={isMobile ? 11 : 15} color={item.featureIconColor || '#A3B580'} />
                        <span style={{ fontSize: isMobile ? '0.52rem' : '0.64rem', color: item.featureTextColor || '#FFFDF9', fontWeight: '600', lineHeight: '1.1' }}>
                          {feat.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                {/* Collection Card Action Row: Price & Add Button */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: isMobile ? '0.65rem' : '0.85rem', paddingTop: '0.25rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
                      <span style={{ fontSize: isMobile ? '1.15rem' : '1.35rem', fontWeight: '950', color: '#FFFDF9', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                        {item.preBookPrice}
                      </span>
                      <span style={{ fontSize: isMobile ? '0.78rem' : '0.88rem', textDecoration: 'line-through', color: 'rgba(255, 255, 255, 0.65)', fontWeight: '600' }}>
                        {item.originalPrice}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      addToCart({
                        _id: item.id,
                        title: item.title,
                        price: parseInt(item.preBookPrice.replace('₹', '')),
                        image: item.image,
                        category: 'cookies',
                        quantity: 1
                      });
                    }}
                    className="btn-primary"
                    style={{
                      backgroundColor: '#244f21',
                      color: '#FFFFFF',
                      border: '1.5px solid #b9cd94',
                      padding: isMobile ? '0.4rem 0.75rem' : '0.8rem 1.4rem',
                      borderRadius: '999px',
                      fontSize: isMobile ? '0.75rem' : '0.92rem',
                      fontWeight: '850',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: isMobile ? '0.25rem' : '0.45rem',
                      boxShadow: '0 6px 18px rgba(0,0,0,0.35)',
                      transition: 'all 0.25s ease',
                      flexShrink: 0
                    }}
                  >
                    <ShoppingBag size={isMobile ? 12 : 17} color="#b9cd94" />
                    <span>Add</span>
                  </button>
                </div>

                {/* Shipping Starts Date Pill */}
                <div style={{ textAlign: 'center' }}>
                  <span
                    style={{
                      fontSize: isMobile ? '0.52rem' : '0.66rem',
                      color: item.descColor ? 'rgba(44, 26, 14, 0.8)' : 'rgba(255, 255, 255, 0.75)',
                      fontWeight: '700',
                      letterSpacing: '0.03em',
                      textTransform: 'uppercase',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.2rem',
                    }}
                  >
                    <Calendar size={isMobile ? 9 : 12} color={item.descColor ? 'rgba(44, 26, 14, 0.8)' : 'rgba(255, 255, 255, 0.75)'} /> {item.shippingDate}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>


      </section>

      {/* ================================================================== */}
      {/* 3. EXPLORE BY CATEGORY (Circular Category Design) */}
      {/* ================================================================== */}
      <section 
        id="explore-by-category-section"
        style={{ 
          padding: isMobile ? '3.5rem 1rem' : '5.5rem 1.5rem', 
          backgroundColor: 'rgba(20, 10, 5, 0.45)', 
          borderTop: '1px solid rgba(255, 255, 255, 0.12)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.12)' 
        }}
      >
        <div style={{ maxWidth: '1240px', margin: '0 auto', boxSizing: 'border-box' }}>
          <div style={{ textAlign: 'center', maxWidth: '750px', margin: isMobile ? '0 auto 2.25rem' : '0 auto 3.5rem' }}>
            <span style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--accent-gold)', fontWeight: '850', display: 'block', marginBottom: '0.5rem' }}>
              EXPLORE BY CATEGORY
            </span>
            <h2 style={{ fontSize: isMobile ? '2.2rem' : '3.2rem', fontFamily: 'var(--font-serif)', color: '#FFFDF9', fontWeight: '850', margin: '0 0 0.5rem', lineHeight: '1.2' }}>
              Explore the <span style={{ color: '#b9cd94' }}>MILASTY Collection</span>
            </h2>
            <p style={{ fontSize: isMobile ? '0.92rem' : '1.1rem', color: '#F5EBDD', margin: 0, fontWeight: '500' }}>
              Discover our wholesome bakes by collection.
            </p>
          </div>

          {/* Circular Category Grid: 2x2 on Mobile | Clean Horizontal Row on Desktop */}
          <div 
            style={{ 
              display: 'grid', 
              gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : `repeat(${activeCategoryList.length}, 1fr)`, 
              gap: isMobile ? '1.75rem 1rem' : '2.5rem 2rem',
              alignItems: 'start',
              justifyItems: 'center',
              maxWidth: isMobile ? '380px' : `${activeCategoryList.length * 240}px`,
              margin: '0 auto'
            }}
          >
            {activeCategoryList.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <div
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat.id)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    width: '100%',
                    maxWidth: isMobile ? '160px' : '200px',
                    cursor: 'pointer',
                    transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                  }}
                  onMouseOver={(e) => {
                    const circle = e.currentTarget.querySelector('.category-circle-wrap');
                    const title = e.currentTarget.querySelector('.category-circle-title');
                    if (circle) {
                      circle.style.transform = 'scale(1.08)';
                      circle.style.borderColor = '#b9cd94';
                      circle.style.boxShadow = '0 12px 30px rgba(36, 79, 33, 0.5), 0 0 20px rgba(185, 205, 148, 0.3)';
                    }
                    if (title) title.style.color = 'var(--accent-gold)';
                  }}
                  onMouseOut={(e) => {
                    const circle = e.currentTarget.querySelector('.category-circle-wrap');
                    const title = e.currentTarget.querySelector('.category-circle-title');
                    if (circle) {
                      circle.style.transform = 'scale(1)';
                      circle.style.borderColor = isSelected ? '#b9cd94' : 'rgba(185, 205, 148, 0.45)';
                      circle.style.boxShadow = isSelected ? '0 10px 25px rgba(36, 79, 33, 0.4)' : '0 8px 24px rgba(0, 0, 0, 0.35)';
                    }
                    if (title) title.style.color = isSelected ? 'var(--accent-gold)' : '#FFFDF9';
                  }}
                >
                  {/* Circle Image Wrapper */}
                  <div
                    className="category-circle-wrap"
                    style={{
                      width: isMobile ? '105px' : '150px',
                      height: isMobile ? '105px' : '150px',
                      borderRadius: '50%',
                      overflow: 'hidden',
                      position: 'relative',
                      border: isSelected ? '2.5px solid #b9cd94' : '2px solid rgba(185, 205, 148, 0.45)',
                      backgroundColor: 'rgba(35, 21, 13, 0.85)',
                      boxShadow: isSelected ? '0 10px 25px rgba(36, 79, 33, 0.4)' : '0 8px 24px rgba(0, 0, 0, 0.35)',
                      transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                      marginBottom: '0.85rem',
                      boxSizing: 'border-box'
                    }}
                  >
                    <img
                      src={cat.image}
                      alt={cat.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                        transition: 'transform 0.4s ease'
                      }}
                    />
                    {/* Active check badge */}
                    {isSelected && (
                      <div 
                        style={{
                          position: 'absolute',
                          bottom: '6px',
                          right: '6px',
                          backgroundColor: '#244f21',
                          border: '1.5px solid #b9cd94',
                          borderRadius: '50%',
                          width: '24px',
                          height: '24px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#FFFDF9'
                        }}
                      >
                        <Check size={14} strokeWidth={3} color="#b9cd94" />
                      </div>
                    )}
                  </div>

                  {/* Category Name Centered Below Circle */}
                  <span 
                    style={{ 
                      fontSize: '0.68rem', 
                      letterSpacing: '0.08em', 
                      fontWeight: '850', 
                      color: isSelected ? 'var(--accent-gold)' : 'rgba(255, 255, 255, 0.5)',
                      marginBottom: '0.15rem',
                      display: 'block'
                    }}
                  >
                    {cat.number}
                  </span>
                  <h3
                    className="category-circle-title"
                    style={{
                      fontSize: isMobile ? '0.82rem' : '0.95rem',
                      color: isSelected ? 'var(--accent-gold)' : '#FFFDF9',
                      fontFamily: 'var(--font-serif)',
                      fontWeight: '800',
                      lineHeight: '1.25',
                      margin: 0,
                      transition: 'color 0.25s ease',
                      letterSpacing: '0.02em',
                      textTransform: 'uppercase'
                    }}
                  >
                    {cat.name}
                  </h3>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* 4. BROWSE MILASTY COLLECTION (Search + Filter + Product Catalogue) */}
      {/* ================================================================== */}
      <section 
        id="browse-milasty-collection"
        style={{ 
          padding: isMobile ? '3.5rem 1rem' : '5.5rem 1.5rem', 
          maxWidth: '1240px', 
          margin: '0 auto', 
          boxSizing: 'border-box' 
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: '750px', margin: isMobile ? '0 auto 1.75rem' : '0 auto 3rem' }}>
          <span style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--accent-gold)', fontWeight: '850', display: 'block', marginBottom: '0.5rem' }}>
            BROWSE MILASTY COLLECTION
          </span>
          <h2 style={{ fontSize: isMobile ? '2.2rem' : '3.2rem', fontFamily: 'var(--font-serif)', color: '#FFFDF9', fontWeight: '850', margin: '0 0 0.5rem', lineHeight: '1.2' }}>
            Explore All <span style={{ color: '#b9cd94' }}>Wholesome Bakes</span>
          </h2>
          <p style={{ fontSize: isMobile ? '0.92rem' : '1.1rem', color: '#F5EBDD', margin: 0, fontWeight: '500' }}>
            Showing {displayedProducts.length} bakes {selectedCategory !== 'all' ? `in ${modalCategoryList.find(c => c.id === selectedCategory)?.label || selectedCategory}` : ''}
          </p>
        </div>

        {/* Selected Active Category Indicator Pill */}
        {selectedCategory !== 'all' && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <div 
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                padding: '0.4rem 1rem', 
                borderRadius: '999px', 
                backgroundColor: '#244f21', 
                border: '1.5px solid #b9cd94', 
                color: '#FFFDF9', 
                fontSize: '0.82rem', 
                fontWeight: '800' 
              }}
            >
              <Check size={14} color="#b9cd94" />
              <span>ACTIVE FILTER: {modalCategoryList.find(c => c.id === selectedCategory)?.label?.toUpperCase()}</span>
              <button 
                onClick={() => setSelectedCategory('all')} 
                style={{ backgroundColor: 'transparent', border: 'none', color: '#FFFDF9', cursor: 'pointer', marginLeft: '0.25rem', fontWeight: '900', padding: 0 }}
                title="Clear Category Filter"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Search Bar & Category Filter Trigger */}
        <div 
          style={{ 
            display: 'flex', 
            gap: '0.75rem', 
            maxWidth: '620px', 
            margin: '0 auto 2.5rem', 
            alignItems: 'center' 
          }}
        >
          <div style={{ position: 'relative', flexGrow: 1 }}>
            <Search size={20} color="var(--accent-gold)" style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', zIndex: 2 }} />
            <input 
              type="text"
              placeholder="Search cookies, ingredients, hampers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '0.85rem 1.25rem 0.85rem 3.4rem',
                borderRadius: '999px',
                backgroundColor: 'rgba(35, 21, 13, 0.85)',
                border: '1.5px solid rgba(255, 255, 255, 0.25)',
                color: '#FFFDF9',
                fontSize: isMobile ? '0.88rem' : '0.95rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>
          
          <button
            onClick={() => setFilterModalOpen(true)}
            style={{
              padding: '0.85rem 1.35rem',
              borderRadius: '999px',
              backgroundColor: 'rgba(36, 79, 33, 0.85)',
              border: '1.5px solid #b9cd94',
              color: '#FFFDF9',
              fontWeight: '850',
              fontSize: '0.88rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              flexShrink: 0,
              boxShadow: '0 4px 14px rgba(36, 79, 33, 0.4)'
            }}
          >
            <Filter size={17} color="var(--accent-gold)" />
            <span>Filter</span>
          </button>
        </div>

        {/* Product Cards Grid / Mobile 2-Card Horizontal Carousel */}
        {isMobile ? (
          <div style={{ width: '100%', overflow: 'hidden' }}>
            {displayedProducts.length > 0 ? (
              <>
                <div
                  onMouseEnter={() => setIsShopProductsHovered(true)}
                  onMouseLeave={() => setIsShopProductsHovered(false)}
                  onTouchStart={(e) => {
                    setIsShopProductsHovered(true);
                    const touch = e.touches[0];
                    setShopProductsTouchStartX(touch.clientX);
                    setShopProductsTouchStartY(touch.clientY);
                  }}
                  onTouchMove={(e) => {
                    if (shopProductsTouchStartX === null) return;
                    const touch = e.touches[0];
                    const diffX = shopProductsTouchStartX - touch.clientX;
                    const diffY = Math.abs(shopProductsTouchStartY - touch.clientY);
                    if (Math.abs(diffX) > diffY && Math.abs(diffX) > 10) {
                      if (e.cancelable) e.preventDefault();
                    }
                  }}
                  onTouchEnd={(e) => {
                    setIsShopProductsHovered(false);
                    if (shopProductsTouchStartX === null) return;
                    const touch = e.changedTouches[0];
                    const diffX = shopProductsTouchStartX - touch.clientX;
                    const diffY = Math.abs(shopProductsTouchStartY - touch.clientY);
                    const maxIdx = Math.max(0, displayedProducts.length - 2);
                    if (Math.abs(diffX) > 40 && Math.abs(diffX) > diffY) {
                      if (diffX > 0) {
                        // Swiped left -> next
                        setShopProductsIndex((prev) => (prev >= maxIdx ? 0 : prev + 1));
                      } else {
                        // Swiped right -> prev
                        setShopProductsIndex((prev) => (prev <= 0 ? maxIdx : prev - 1));
                      }
                    }
                    setShopProductsTouchStartX(null);
                    setShopProductsTouchStartY(null);
                  }}
                  style={{
                    display: 'flex',
                    flexWrap: 'nowrap',
                    gap: '0.65rem',
                    transform: `translateX(calc(-${shopProductsIndex} * (50% + 0.325rem)))`,
                    transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                    width: '100%',
                    touchAction: 'pan-y',
                    userSelect: 'none',
                    WebkitUserSelect: 'none'
                  }}
                >
                  {displayedProducts.map((product) => (
                    <div
                      key={product._id || product.slug}
                      style={{
                        flex: '0 0 calc(50% - 0.325rem)',
                        minWidth: 'calc(50% - 0.325rem)',
                        maxWidth: 'calc(50% - 0.325rem)',
                        boxSizing: 'border-box'
                      }}
                    >
                      <ProductCard product={product} />
                    </div>
                  ))}
                </div>

                {/* Mobile Carousel Pagination Dots & Left/Right Buttons */}
                <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.85rem' }}>
                  {/* Pagination Dots */}
                  <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center' }}>
                    {Array.from({ length: Math.max(1, displayedProducts.length - 1) }).map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setShopProductsIndex(idx)}
                        style={{
                          width: shopProductsIndex === idx ? '22px' : '8px',
                          height: '8px',
                          borderRadius: '999px',
                          backgroundColor: shopProductsIndex === idx ? '#b9cd94' : 'rgba(255, 255, 255, 0.25)',
                          border: 'none',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease'
                        }}
                      />
                    ))}
                  </div>

                  {/* Left / Right Navigation Buttons */}
                  <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
                    <button
                      onClick={() => {
                        const maxIdx = Math.max(0, displayedProducts.length - 2);
                        setShopProductsIndex((prev) => (prev <= 0 ? maxIdx : prev - 1));
                      }}
                      aria-label="Previous product"
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(35, 21, 13, 0.85)',
                        border: '1px solid rgba(255, 255, 255, 0.25)',
                        color: '#FFFDF9',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                      }}
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button
                      onClick={() => {
                        const maxIdx = Math.max(0, displayedProducts.length - 2);
                        setShopProductsIndex((prev) => (prev >= maxIdx ? 0 : prev + 1));
                      }}
                      aria-label="Next product"
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(35, 21, 13, 0.85)',
                        border: '1px solid rgba(255, 255, 255, 0.25)',
                        color: '#FFFDF9',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                      }}
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem 1.5rem', color: '#F5EBDD', backgroundColor: 'rgba(35, 21, 13, 0.5)', borderRadius: '24px' }}>
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
        ) : (
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
        )}
      </section>

      {/* ================================================================== */}
      {/* 5. FIND YOUR PERFECT MILASTY BAKE (Single Question Recommendation) */}
      {/* ================================================================== */}
      <section 
        id="recommendation-section"
        style={{ padding: isMobile ? '2.5rem 1rem' : '4.5rem 1.5rem', maxWidth: '850px', margin: '0 auto', boxSizing: 'border-box' }}
      >
        <div 
          className="glass-card"
          style={{ 
            padding: isMobile ? '1.75rem 1.15rem' : '3rem 2.5rem', 
            borderRadius: '24px', 
            backgroundColor: 'rgba(35, 21, 13, 0.75)',
            border: '1.5px solid var(--accent-gold)',
            boxShadow: '0 16px 40px rgba(0, 0, 0, 0.45)',
            textAlign: 'center'
          }}
        >
          <span style={{ fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--accent-gold)', fontWeight: '850', display: 'block', marginBottom: '0.5rem' }}>
            NOT SURE WHAT TO CHOOSE?
          </span>

          <h2 style={{ fontSize: isMobile ? '1.75rem' : '2.4rem', fontFamily: 'var(--font-serif)', color: '#FFFDF9', fontWeight: '850', margin: '0 0 1.5rem', lineHeight: '1.25' }}>
            Find Your Perfect <span style={{ color: 'var(--accent-gold)' }}>MILASTY Bake</span>
          </h2>

          <p style={{ fontSize: isMobile ? '0.95rem' : '1.05rem', color: '#F5EBDD', marginBottom: '1.5rem', fontWeight: '600' }}>
            What are you looking for?
          </p>

          {/* Option Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', maxWidth: '420px', margin: '0 auto 1.5rem' }}>
            {[
              { label: 'Everyday Chai Snacking', catId: 'daily' },
              { label: 'Something for Gifting', catId: 'gifts' },
              { label: 'A Light Evening Snack', catId: 'daily' }
            ].map((option) => {
              const isOptionSelected = recSelectedOption?.label === option.label;
              return (
                <button
                  key={option.label}
                  onClick={() => setRecSelectedOption(option)}
                  style={{
                    padding: isMobile ? '0.85rem 1.1rem' : '0.95rem 1.35rem',
                    borderRadius: '999px',
                    backgroundColor: isOptionSelected ? '#244f21' : 'rgba(20, 10, 5, 0.65)',
                    border: isOptionSelected ? '2px solid #b9cd94' : '1.5px solid rgba(255, 255, 255, 0.25)',
                    color: '#FFFDF9',
                    fontWeight: '800',
                    fontSize: isMobile ? '0.88rem' : '0.95rem',
                    cursor: 'pointer',
                    transition: 'all 0.25s ease',
                    boxShadow: isOptionSelected ? '0 6px 20px rgba(36, 79, 33, 0.5)' : '0 4px 12px rgba(0, 0, 0, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  {isOptionSelected && <Check size={16} color="#b9cd94" />}
                  <span>{option.label}</span>
                </button>
              );
            })}
          </div>

          {/* Explore Bakes Button (Appears after selecting an option) */}
          {recSelectedOption && (
            <div style={{ marginTop: '1.25rem' }}>
              <button
                onClick={() => handleCategoryClick(recSelectedOption.catId)}
                className="btn-primary"
                style={{
                  padding: isMobile ? '0.85rem 2rem' : '1rem 2.5rem',
                  fontSize: isMobile ? '0.9rem' : '1rem',
                  backgroundColor: '#c89b3c',
                  color: '#FFFFFF',
                  border: 'none',
                  fontWeight: '850',
                  borderRadius: '999px',
                  cursor: 'pointer',
                  boxShadow: '0 8px 24px rgba(200, 155, 60, 0.4)',
                  transition: 'all 0.3s ease',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <span>Explore Recommended Bakes</span>
                <ArrowRight size={18} />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* FILTER POPUP MODAL (Synchronized with single category source) */}
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
              {modalCategoryList.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryClick(cat.id)}
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.72rem', color: isSelected ? 'var(--accent-gold)' : 'rgba(255,255,255,0.5)', fontWeight: '800' }}>{cat.number}</span>
                      <span>{cat.label}</span>
                    </div>
                    {isSelected && <Check size={16} color="#b9cd94" />}
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
      {/* 7. REVIEWS */}
      {/* ================================================================== */}
      <section 
        style={{ padding: isMobile ? '3.5rem 1rem' : '5.5rem 1.5rem', maxWidth: '900px', margin: '0 auto', boxSizing: 'border-box' }}
      >
        <div style={{ textAlign: 'center', marginBottom: isMobile ? '2rem' : '3.5rem' }}>
          <span style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--accent-gold)', fontWeight: '850', display: 'block', marginBottom: '0.5rem' }}>
            CUSTOMER REVIEWS
          </span>
          <h2 style={{ fontSize: isMobile ? '2.2rem' : '3.2rem', fontFamily: 'var(--font-serif)', color: '#FFFDF9', fontWeight: '850', margin: 0, lineHeight: '1.2' }}>
            Loved by <span style={{ color: '#b9cd94' }}>MILASTY Customers</span>
          </h2>
        </div>

        {/* Reviews Showcase with Touch Swipe Support */}
        <div style={{ width: '100%', maxWidth: isMobile ? '380px' : '750px', margin: '0 auto' }}>
          {(() => {
            const rev = dummyReviews[reviewIndex];
            return (
              <div
                className="glass-card"
                onMouseEnter={() => setIsReviewHovered(true)}
                onMouseLeave={() => setIsReviewHovered(false)}
                onTouchStart={(e) => {
                  setIsReviewHovered(true);
                  const touch = e.touches[0];
                  setReviewTouchStartX(touch.clientX);
                  setReviewTouchStartY(touch.clientY);
                }}
                onTouchMove={(e) => {
                  if (reviewTouchStartX === null) return;
                  const touch = e.touches[0];
                  const diffX = reviewTouchStartX - touch.clientX;
                  const diffY = Math.abs(reviewTouchStartY - touch.clientY);
                  // Prevent vertical scroll interference if horizontal swipe is intentional
                  if (Math.abs(diffX) > diffY && Math.abs(diffX) > 10) {
                    if (e.cancelable) e.preventDefault();
                  }
                }}
                onTouchEnd={(e) => {
                  setIsReviewHovered(false);
                  if (reviewTouchStartX === null) return;
                  const touch = e.changedTouches[0];
                  const diffX = reviewTouchStartX - touch.clientX;
                  const diffY = Math.abs(reviewTouchStartY - touch.clientY);
                  if (Math.abs(diffX) > 40 && Math.abs(diffX) > diffY) {
                    if (diffX > 0) {
                      // Swiped left -> next
                      setReviewIndex((prev) => (prev + 1) % dummyReviews.length);
                    } else {
                      // Swiped right -> prev
                      setReviewIndex((prev) => (prev === 0 ? dummyReviews.length - 1 : prev - 1));
                    }
                  }
                  setReviewTouchStartX(null);
                  setReviewTouchStartY(null);
                }}
                style={{
                  padding: isMobile ? '2rem 1.5rem' : '3rem 2.5rem',
                  borderRadius: '24px',
                  backgroundColor: 'rgba(35, 21, 13, 0.75)',
                  border: '1.5px solid rgba(255, 255, 255, 0.18)',
                  boxShadow: '0 12px 32px rgba(0, 0, 0, 0.35)',
                  textAlign: 'center',
                  boxSizing: 'border-box',
                  width: '100%',
                  margin: '0 auto',
                  touchAction: 'pan-y',
                  userSelect: 'none',
                  WebkitUserSelect: 'none'
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
      {/* 8. BACK TO TOP BUTTON */}
      {/* ================================================================== */}
      <div 
        style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          padding: isMobile ? '1.5rem 0 3rem' : '2.5rem 0 4rem' 
        }}
      >
        <button
          onClick={() => handleScrollToSection('shop-hero-section')}
          style={{
            padding: isMobile ? '0.75rem 1.6rem' : '0.9rem 2.25rem',
            borderRadius: '999px',
            backgroundColor: 'rgba(36, 79, 33, 0.75)',
            border: '1.5px solid #b9cd94',
            color: '#FFFDF9',
            fontWeight: '850',
            fontSize: isMobile ? '0.82rem' : '0.9rem',
            letterSpacing: '0.08em',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: '0 6px 20px rgba(36, 79, 33, 0.4), inset 0 1px 1px rgba(255,255,255,0.2)',
            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#244f21';
            e.currentTarget.style.transform = 'translateY(-3px)';
            e.currentTarget.style.boxShadow = '0 10px 25px rgba(36, 79, 33, 0.6)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(36, 79, 33, 0.75)';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(36, 79, 33, 0.4)';
          }}
        >
          <span>BACK TO TOP</span>
          <span style={{ fontSize: '1.1rem', fontWeight: '900', color: 'var(--accent-gold)', lineHeight: 1 }}>↑</span>
        </button>
      </div>

      {/* ================================================================== */}
      {/* 9. FINAL CONVERSION */}
      {/* ================================================================== */}
      <section 
        className="reveal-fade-up cta-section"
        style={{ 
          padding: isMobile ? '4rem 0 6rem' : '5rem 0 7rem', 
          backgroundColor: 'transparent' 
        }}
      >
        <div className="container" style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 1rem' }}>
          <div
            className="cta-card glass-card"
            style={{
              padding: isMobile ? '3.5rem 1.5rem' : '5rem 2rem',
              textAlign: 'center',
              color: '#FFFFFF',
              position: 'relative',
              borderRadius: '30px',
              backgroundColor: 'rgba(35, 21, 13, 0.75)',
              border: '1.5px solid rgba(255, 255, 255, 0.20)',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)',
              overflow: 'hidden',
            }}
          >
            <h2 style={{ fontSize: isMobile ? '2.1rem' : '2.8rem', color: '#FFFFFF', marginBottom: '1.25rem', fontFamily: 'var(--font-serif)', fontWeight: '800' }}>
              Ready to Upgrade Your <span style={{ color: 'var(--accent-gold)' }}>Everyday Snack?</span>
            </h2>
            <p style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: isMobile ? '0.95rem' : '1.1rem', maxWidth: '580px', margin: '0 auto 2.5rem', lineHeight: '1.7', fontWeight: '500' }}>
              Discover freshly baked millet cookies made with pure Desi Ghee and organic jaggery. Delivered fresh all across India.
            </p>
            <button
              onClick={() => handleScrollToSection('browse-milasty-collection')}
              className="btn-primary" 
              style={{ padding: '1.1rem 2.75rem', fontSize: '1.05rem', backgroundColor: '#c89b3c', color: '#FFFFFF', border: 'none', fontWeight: '800', textDecoration: 'none', borderRadius: '999px', cursor: 'pointer' }}
            >
              <span>Shop All Fresh Bakes →</span>
            </button>

            <div style={{ marginTop: '2rem', fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.8)', letterSpacing: '0.05em', fontWeight: '700' }}>
              PAN-INDIA SHIPPING • FRESHLY BAKED ON ORDER
            </div>
          </div>
        </div>
      </section>

      </div>
    </div>
  );
}
