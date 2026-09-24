import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, ChevronRight, ShoppingBag, Leaf, Sparkles, 
  Shield, Award, ArrowRight, Star, ChevronLeft, Check, Filter,
  Calendar, Truck, Gift
} from 'lucide-react';
import ProductCard from '../components/ProductCard';
import api from '../api/axios';
import { initialProducts } from '../data/seedData';
import { useCart } from '../context/CartContext';
import { useCategories } from '../context/CategoryContext';

const cardThemes = [
  {
    bgGradient: '#FFF9F0',
    borderColor: '#DCC8AE',
    titleColor: '#32180D',
    badgeBg: '#E3EEDC',
    badgeColor: '#24572E',
  },
  {
    bgGradient: '#FFF9F0',
    borderColor: '#DCC8AE',
    titleColor: '#32180D',
    badgeBg: '#E3EEDC',
    badgeColor: '#24572E',
  },
  {
    bgGradient: '#FFF9F0',
    borderColor: '#DCC8AE',
    titleColor: '#32180D',
    badgeBg: '#E3EEDC',
    badgeColor: '#24572E',
  },
];

const formatLaunchDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch (e) {
    return String(dateStr);
  }
};

export default function Shop() {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search state
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [recSelectedOption, setRecSelectedOption] = useState(null);

  // Pre-booking State (Database-backed)
  const [prebookingProducts, setPrebookingProducts] = useState([]);
  const [showAllPrebookings, setShowAllPrebookings] = useState(false);
  const [prebookingLoading, setPrebookingLoading] = useState(true);

  // Testimonials State (Database-backed)
  const [testimonials, setTestimonials] = useState([]);
  const [testimonialsLoading, setTestimonialsLoading] = useState(true);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [isReviewHovered, setIsReviewHovered] = useState(false);
  const [reviewTouchStartX, setReviewTouchStartX] = useState(null);
  const [reviewTouchStartY, setReviewTouchStartY] = useState(null);

  // Recommendation Quiz State (Database-backed)
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [quizSelectedOption, setQuizSelectedOption] = useState(null);
  const [quizRecommendations, setQuizRecommendations] = useState([]);
  const [quizLoading, setQuizLoading] = useState(true);

  // Mobile Products Carousel Index State
  const [shopProductsIndex, setShopProductsIndex] = useState(0);
  const [isShopProductsHovered, setIsShopProductsHovered] = useState(false);
  const [shopProductsTouchStartX, setShopProductsTouchStartX] = useState(null);
  const [shopProductsTouchStartY, setShopProductsTouchStartY] = useState(null);

  // Mobile detection
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  // These hooks MUST be before any useEffect calls (Rules of Hooks)
  const { categories, categoriesLoading } = useCategories();
  const [exploreModalOpen, setExploreModalOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchPrebookings();
    fetchTestimonials();
    fetchQuiz();
  }, []);

  const fetchPrebookings = async () => {
    setPrebookingLoading(true);
    try {
      const res = await api.get('/prebookings/active');
      const list = Array.isArray(res.data) 
        ? res.data 
        : (Array.isArray(res.data?.prebookings) ? res.data.prebookings : (Array.isArray(res.data?.data) ? res.data.data : []));
      setPrebookingProducts(list);
    } catch (err) {
      console.error('Error loading prebooking products:', err);
    } finally {
      setPrebookingLoading(false);
    }
  };

  const fetchTestimonials = async () => {
    setTestimonialsLoading(true);
    try {
      const res = await api.get('/testimonials?placement=shop');
      const list = Array.isArray(res.data) 
        ? res.data 
        : (Array.isArray(res.data?.testimonials) ? res.data.testimonials : (Array.isArray(res.data?.data) ? res.data.data : []));
      setTestimonials(list);
    } catch (err) {
      console.error('Error loading testimonials:', err);
    } finally {
      setTestimonialsLoading(false);
    }
  };

  const fetchQuiz = async () => {
    setQuizLoading(true);
    try {
      const res = await api.get('/quiz/active');
      const list = Array.isArray(res.data) 
        ? res.data 
        : (Array.isArray(res.data?.questions) ? res.data.questions : (Array.isArray(res.data?.data) ? res.data.data : []));
      setQuizQuestions(list);
    } catch (err) {
      console.error('Error loading recommendation quiz:', err);
    } finally {
      setQuizLoading(false);
    }
  };

  // Testimonials Auto-play
  useEffect(() => {
    if (isReviewHovered || testimonials.length <= 1) return;
    const timer = setInterval(() => {
      setReviewIndex((prev) => (prev + 1) % testimonials.length);
    }, 2500);
    return () => clearInterval(timer);
  }, [isReviewHovered, testimonials.length]);

  // Lock background body scroll when modals open
  useEffect(() => {
    if (exploreModalOpen || filterModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [exploreModalOpen, filterModalOpen]);

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

  // Safe Array Wrappers
  const safeCategories = Array.isArray(categories) ? categories : [];
  const safeProducts = Array.isArray(products) ? products : [];

  // Helper function to check product category match against live database categories
  const matchesCategoryFilter = (p, catIdOrSlug) => {
    if (!catIdOrSlug || catIdOrSlug === 'all') return true;
    
    const pId = p.id || p._id;
    const cleanFilter = String(catIdOrSlug).toLowerCase().trim();
    
    // Find the category object for this filter value (match by id, slug, _id, or name)
    const catObj = safeCategories.find(c => 
      String(c.id || '').toLowerCase() === cleanFilter || 
      String(c.slug || '').toLowerCase() === cleanFilter || 
      String(c._id || '').toLowerCase() === cleanFilter ||
      String(c.name || '').toLowerCase() === cleanFilter
    );
    
    // 1. Check Many-to-Many category_products relation productIds array
    if (catObj && Array.isArray(catObj.productIds) && pId && catObj.productIds.includes(pId)) {
      return true;
    }

    // 2. Check direct product category_id (UUID) matching
    const targetId = catObj ? catObj.id : catIdOrSlug;
    const targetSlug = catObj ? catObj.slug : catIdOrSlug;
    const targetName = catObj ? catObj.name : catIdOrSlug;

    const pCat = (p.category || '').toString().toLowerCase().trim();
    const pCatId = (p.category_id || p.categoryId || '').toString().toLowerCase().trim();

    // Check by UUID category_id
    if (pCatId && targetId && pCatId === String(targetId).toLowerCase()) return true;
    // Check by slug
    if (pCat && targetSlug && pCat === String(targetSlug).toLowerCase()) return true;
    // Check by name  
    if (pCat && targetName && pCat === String(targetName).toLowerCase()) return true;
    // Fallback: raw param match
    if (pCat && pCat === cleanFilter) return true;
    if (pCatId && pCatId === cleanFilter) return true;
    
    return false;
  };

  const handleCategoryClick = (catIdOrSlug) => {
    setSelectedCategory(catIdOrSlug);
    setFilterModalOpen(false);
    setExploreModalOpen(false);
    const element = document.getElementById('browse-milasty-collection');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // First 4 Categories to render on Shop page main section
  const firstFourCategories = safeCategories.slice(0, 4);

  // Full category list for filter popup modal including "ALL BAKES"
  const modalCategoryList = [
    { id: 'all', number: '00', name: 'ALL BAKES', label: 'All Bakes', subtitle: 'Explore the complete MILASTY collection' },
    ...safeCategories.map((c, idx) => ({
      id: c.slug || c.id,       // Use slug for filter so matchesCategoryFilter works via slug
      catId: c.id || c._id,    // Keep original UUID for reference
      number: String(idx + 1).padStart(2, '0'),
      name: c.name,
      label: c.label || c.name,
      subtitle: c.description || c.subtitle || '',
      image: c.image_url || c.image,
      productCount: c.productCount || 0,
    }))
  ];


  // Featured Products
  const featuredProducts = safeProducts.filter(p => p.isFeatured || p.category === 'starter');

  // Filtered Catalogue Products
  const displayedProducts = safeProducts.filter(p => {
    const matchesCat = matchesCategoryFilter(p, selectedCategory);
    const pTitle = (p.title || p.name || '').toString();
    const pDesc = (p.description || p.subtitle || '').toString();
    const cleanSearch = (search || '').toLowerCase();
    const matchesSearch = !cleanSearch || pTitle.toLowerCase().includes(cleanSearch) || pDesc.toLowerCase().includes(cleanSearch);
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
        backgroundColor: '#F7F0E5',
        backgroundImage: 'linear-gradient(rgba(247, 240, 229, 0.88), rgba(247, 240, 229, 0.88)), url(/images/about_background_image.jpeg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      <div style={{ position: 'relative', zIndex: 1 }}>

      {/* ================================================================== */}
      {/* 2. FUTURE FAVOURITES / WHAT'S NEXT FROM MILASTY                     */}
      {/* ================================================================== */}
      {prebookingProducts.length > 0 && (
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
                color: '#2F6B3A', 
                fontWeight: '800', 
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.65rem'
              }}
            >
              <Leaf size={14} color="#2F6B3A" /> FUTURE FAVOURITES <Leaf size={14} color="#2F6B3A" />
            </span>
            <h2 
              style={{ 
                fontSize: isMobile ? '2.2rem' : '3.4rem', 
                fontFamily: 'var(--font-serif), "Playfair Display", Georgia, serif', 
                color: '#32180D', 
                fontWeight: '800', 
                margin: '0 0 0.85rem 0', 
                lineHeight: '1.2' 
              }}
            >
              What's Next from <span style={{ color: '#2F6B3A' }}>MILASTY</span>
            </h2>
            <p 
              style={{ 
                fontSize: isMobile ? '0.92rem' : '1.08rem', 
                color: '#654B38', 
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
                backgroundColor: '#E3EEDC',
                color: '#24572E',
                border: '1.5px solid rgba(47, 107, 58, 0.3)',
                padding: '0.45rem 1.25rem',
                borderRadius: '25px',
                fontSize: '0.78rem',
                fontWeight: '700',
                letterSpacing: '0.08em',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 14px rgba(43, 20, 11, 0.05)'
              }}
            >
              <Calendar size={14} color="#2F6B3A" /> NOW OPEN FOR PRE-BOOKING
            </span>
          </div>

          {/* Dynamic Product Cards Grid */}
          <div 
            style={{ 
              display: 'grid', 
              gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : `repeat(${Math.min(prebookingProducts.length, 4)}, 1fr)`, 
              gap: isMobile ? '0.65rem' : '1.15rem', 
              alignItems: 'stretch' 
            }}
          >
            {(showAllPrebookings ? prebookingProducts : prebookingProducts.slice(0, 4)).map((item, idx) => {
              const theme = cardThemes[idx % cardThemes.length];
              const pId = item.productId || item.product_id || item.id;
              const title = item.productTitle || item.title || 'Upcoming Bake';
              const price = item.productPrice || item.price || 0;
              const image = item.productImage || item.image || '/images/image1.jpeg';
              const description = item.productDescription || item.description || 'Pre-book your package today.';
              const formattedDate = formatLaunchDate(item.launchDate || item.launch_date);

              return (
                <div
                  key={item.id || idx}
                  onClick={() => navigate(`/product/${item.productSlug || item.slug || pId}`)}
                  style={{
                    background: '#FFF9F0',
                    borderRadius: isMobile ? '14px' : '20px',
                    border: '1.5px solid #DCC8AE',
                    boxShadow: '0 4px 16px rgba(43, 20, 11, 0.05)',
                    padding: isMobile ? '0.65rem 0.55rem 0.6rem' : '1.15rem 1rem 1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative',
                    overflow: 'hidden',
                    boxSizing: 'border-box',
                    cursor: 'pointer',
                    transition: 'transform 0.3s ease, border-color 0.3s ease',
                  }}
                >
                  <div>
                    {/* Top Badge */}
                    <div style={{ marginBottom: isMobile ? '0.35rem' : '0.75rem' }}>
                      <span
                        style={{
                          background: '#E3EEDC',
                          color: '#24572E',
                          border: '1px solid rgba(47, 107, 58, 0.25)',
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
                        🔥 PRE-ORDER
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
                            color: '#32180D',
                            fontFamily: 'var(--font-serif), "Playfair Display", Georgia, serif',
                            lineHeight: '1.2',
                          }}
                        >
                          {title}
                        </h3>
                      </div>
                      <div 
                        style={{ 
                          width: isMobile ? '55px' : '85px', 
                          height: isMobile ? '55px' : '85px', 
                          borderRadius: isMobile ? '8px' : '12px', 
                          overflow: 'hidden', 
                          boxShadow: '0 2px 8px rgba(43,20,11,0.08)', 
                          border: '1px solid #DCC8AE', 
                          flexShrink: 0 
                        }}
                      >
                        <img
                          src={image}
                          alt={title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        />
                      </div>
                    </div>

                    {/* Description */}
                    <p
                      style={{
                        fontSize: isMobile ? '0.68rem' : '0.82rem',
                        color: '#654B38',
                        lineHeight: '1.3',
                        marginBottom: isMobile ? '0.35rem' : '0.85rem',
                        fontWeight: '400',
                        margin: isMobile ? '0 0 0.35rem 0' : '0 0 0.85rem 0',
                      }}
                    >
                      {description}
                    </p>
                  </div>

                  <div>
                    {/* Collection Card Action Row: Price & Pre-book Button */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: isMobile ? '0.2rem' : '0.5rem', marginBottom: isMobile ? '0.45rem' : '0.85rem', paddingTop: '0.25rem', width: '100%', boxSizing: 'border-box' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', flexShrink: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: isMobile ? '0.2rem' : '0.4rem', flexWrap: 'nowrap' }}>
                          <span style={{ fontSize: isMobile ? '0.92rem' : '1.35rem', fontWeight: '950', color: '#2B170D', whiteSpace: 'nowrap' }}>
                            ₹{price}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart({
                            _id: pId,
                            id: pId,
                            title: title,
                            price: Number(price),
                            image: image,
                            category: 'cookies',
                            quantity: 1,
                            is_preorder: true,
                            expected_ship_date: formattedDate
                          });
                        }}
                        className="btn-primary"
                        style={{
                          backgroundColor: '#2F6B3A',
                          color: '#FFFFFF',
                          border: 'none',
                          padding: isMobile ? '0.35rem 0.5rem' : '0.8rem 1.4rem',
                          borderRadius: '999px',
                          fontSize: isMobile ? '0.68rem' : '0.92rem',
                          fontWeight: '850',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: isMobile ? '0.15rem' : '0.45rem',
                          boxShadow: '0 4px 12px rgba(47, 107, 58, 0.25)',
                          transition: 'all 0.25s ease',
                          flexShrink: 0
                        }}
                      >
                        <ShoppingBag size={isMobile ? 11 : 17} color="#FFFFFF" />
                        <span>Pre-book</span>
                      </button>
                    </div>

                    {/* Shipping Starts Date Pill */}
                    {formattedDate && (
                      <div style={{ textAlign: 'center' }}>
                        <span
                          style={{
                            fontSize: isMobile ? '0.52rem' : '0.66rem',
                            color: '#806A57',
                            fontWeight: '700',
                            letterSpacing: '0.03em',
                            textTransform: 'uppercase',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.2rem',
                          }}
                        >
                          <Calendar size={isMobile ? 9 : 12} color="#806A57" /> SHIPPING STARTS {formattedDate}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {prebookingProducts.length > 4 && (
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <button
                onClick={() => setShowAllPrebookings(!showAllPrebookings)}
                style={{
                  padding: '0.65rem 1.65rem',
                  borderRadius: '999px',
                  backgroundColor: '#FFF9F0',
                  border: '1.5px solid #DCC8AE',
                  color: '#32180D',
                  fontSize: '0.88rem',
                  fontWeight: '800',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease'
                }}
              >
                {showAllPrebookings ? 'Show Less' : 'Show More'}
              </button>
            </div>
          )}
        </section>
      )}

      {/* ================================================================== */}
      {/* 3. EXPLORE BY CATEGORY (Circular Category Design) */}
      {/* ================================================================== */}
      <section 
        id="explore-by-category-section"
        style={{ 
          padding: isMobile ? '3.5rem 1rem' : '5.5rem 1.5rem', 
          backgroundColor: '#F1E5D4', 
          borderTop: '1px solid #DCC8AE',
          borderBottom: '1px solid #DCC8AE' 
        }}
      >
        <div style={{ maxWidth: '1240px', margin: '0 auto', boxSizing: 'border-box' }}>
          <div style={{ textAlign: 'center', maxWidth: '750px', margin: isMobile ? '0 auto 2.25rem' : '0 auto 3.5rem' }}>
            <span style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.14em', color: '#2F6B3A', fontWeight: '850', display: 'block', marginBottom: '0.5rem' }}>
              EXPLORE BY CATEGORY
            </span>
            <h2 style={{ fontSize: isMobile ? '2.2rem' : '3.2rem', fontFamily: 'var(--font-serif)', color: '#32180D', fontWeight: '850', margin: '0 0 0.5rem', lineHeight: '1.2' }}>
              Explore the <span style={{ color: '#2F6B3A' }}>MILASTY Collection</span>
            </h2>
            <p style={{ fontSize: isMobile ? '0.92rem' : '1.1rem', color: '#654B38', margin: 0, fontWeight: '500' }}>
              Discover our wholesome bakes by collection.
            </p>
          </div>

          {/* Circular Category Grid: First 4 Active Categories */}
          <div 
            style={{ 
              display: 'grid', 
              gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : `repeat(${Math.min(firstFourCategories.length || 1, 4)}, 1fr)`, 
              gap: isMobile ? '1.75rem 1rem' : '2.5rem 2rem',
              alignItems: 'start',
              justifyItems: 'center',
              maxWidth: isMobile ? '380px' : `${Math.min(firstFourCategories.length || 1, 4) * 240}px`,
              margin: '0 auto'
            }}
          >
            {firstFourCategories.map((cat, idx) => {
              const catIdOrSlug = cat.slug || cat.id;
              const isSelected = selectedCategory === catIdOrSlug || selectedCategory === cat.id || selectedCategory === cat.slug;
              const img = cat.image_url || cat.image || 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500';

              return (
                <div
                  key={cat.id || cat.slug || idx}
                  onClick={() => handleCategoryClick(catIdOrSlug)}
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
                      border: isSelected ? '3px solid #2F6B3A' : '2px solid #DCC8AE',
                      backgroundColor: '#FFF9F0',
                      boxShadow: isSelected ? '0 8px 20px rgba(47, 107, 58, 0.25)' : '0 4px 12px rgba(43, 20, 11, 0.05)',
                      transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                      marginBottom: '0.85rem',
                      boxSizing: 'border-box'
                    }}
                  >
                    <img
                      src={img}
                      alt={`${cat.name} category`}
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
                          backgroundColor: '#2F6B3A',
                          border: '1.5px solid #FFFFFF',
                          borderRadius: '50%',
                          width: '24px',
                          height: '24px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#FFFFFF'
                        }}
                      >
                        <Check size={14} strokeWidth={3} color="#FFFFFF" />
                      </div>
                    )}
                  </div>

                  {/* Category Number & Name */}
                  <span 
                    style={{ 
                      fontSize: '0.68rem', 
                      letterSpacing: '0.08em', 
                      fontWeight: '850', 
                      color: isSelected ? '#2F6B3A' : '#806A57',
                      marginBottom: '0.15rem',
                      display: 'block'
                    }}
                  >
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <h3
                    className="category-circle-title"
                    style={{
                      fontSize: isMobile ? '0.82rem' : '0.95rem',
                      color: isSelected ? '#2F6B3A' : '#32180D',
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

          {/* Conditional "Explore More Categories" CTA Button if categories.length > 4 */}
          {categories.length > 4 && (
            <div style={{ textAlign: 'center', marginTop: '3rem' }}>
              <button
                onClick={() => setExploreModalOpen(true)}
                className="btn-primary"
                style={{
                  padding: '0.85rem 2.25rem',
                  borderRadius: '999px',
                  backgroundColor: '#2F6B3A',
                  color: '#FFFFFF',
                  border: 'none',
                  fontWeight: '850',
                  fontSize: '0.92rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  boxShadow: '0 8px 24px rgba(47, 107, 58, 0.25)',
                  transition: 'all 0.3s ease'
                }}
              >
                <span>Explore More Categories ({categories.length - 4} More)</span>
                <ArrowRight size={16} color="#FFFFFF" />
              </button>
            </div>
          )}

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
          <span style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.14em', color: '#2F6B3A', fontWeight: '850', display: 'block', marginBottom: '0.5rem' }}>
            BROWSE MILASTY COLLECTION
          </span>
          <h2 style={{ fontSize: isMobile ? '2.2rem' : '3.2rem', fontFamily: 'var(--font-serif)', color: '#32180D', fontWeight: '850', margin: '0 0 0.5rem', lineHeight: '1.2' }}>
            Explore All <span style={{ color: '#2F6B3A' }}>Wholesome Bakes</span>
          </h2>
          <p style={{ fontSize: isMobile ? '0.92rem' : '1.1rem', color: '#654B38', margin: 0, fontWeight: '500' }}>
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
                backgroundColor: '#2F6B3A', 
                border: '1.5px solid #2F6B3A', 
                color: '#FFFFFF', 
                fontSize: '0.82rem', 
                fontWeight: '800' 
              }}
            >
              <Check size={14} color="#FFFFFF" />
              <span>ACTIVE FILTER: {modalCategoryList.find(c => c.id === selectedCategory)?.label?.toUpperCase()}</span>
              <button 
                onClick={() => setSelectedCategory('all')} 
                style={{ backgroundColor: 'transparent', border: 'none', color: '#FFFFFF', cursor: 'pointer', marginLeft: '0.25rem', fontWeight: '900', padding: 0 }}
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
            <Search size={20} color="#2F6B3A" style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', zIndex: 2 }} />
            <input 
              type="text"
              placeholder="Search cookies, ingredients, hampers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '0.85rem 1.25rem 0.85rem 3.4rem',
                borderRadius: '999px',
                backgroundColor: '#FFF9F0',
                border: '1.5px solid #DCC8AE',
                color: '#32180D',
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
              backgroundColor: '#2F6B3A',
              border: 'none',
              color: '#FFFFFF',
              fontWeight: '850',
              fontSize: '0.88rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              flexShrink: 0,
              boxShadow: '0 4px 14px rgba(47, 107, 58, 0.25)'
            }}
          >
            <Filter size={17} color="#FFFFFF" />
            <span>Filter</span>
          </button>
        </div>

        {/* Product Cards Grid */}
        <div className="favorites-grid fitted-cards-container-4">
          {displayedProducts.length > 0 ? (
            displayedProducts.map((product) => (
              <ProductCard key={product._id || product.slug} product={product} />
            ))
          ) : (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem 1.5rem', color: '#654B38', backgroundColor: '#FFF9F0', border: '1px solid #DCC8AE', borderRadius: '24px' }}>
              <Sparkles size={32} color="#2F6B3A" style={{ marginBottom: '0.75rem' }} />
              <h3 style={{ fontSize: '1.4rem', fontFamily: 'var(--font-serif)', color: '#32180D', margin: '0 0 0.4rem 0', fontWeight: '800' }}>No products yet</h3>
              <p style={{ fontSize: '0.95rem', color: '#654B38', margin: '0 auto 1.5rem', maxWidth: '480px', lineHeight: '1.5' }}>
                We're preparing something delicious for this collection. Check back soon.
              </p>
              <button 
                onClick={() => { setSearch(''); setSelectedCategory('all'); }} 
                className="btn-primary" 
                style={{ padding: '0.75rem 1.75rem', backgroundColor: '#2F6B3A', color: '#FFF', borderRadius: '999px', border: 'none', fontWeight: '800', cursor: 'pointer' }}
              >
                Reset All Filters
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ================================================================== */}
      {/* 5. FIND YOUR PERFECT MILASTY BAKE (Database-backed Quiz) */}
      {/* ================================================================== */}
      {quizQuestions.length > 0 && (
        <section 
          id="recommendation-section"
          style={{ padding: isMobile ? '2.5rem 1rem' : '4.5rem 1.5rem', maxWidth: '850px', margin: '0 auto', boxSizing: 'border-box' }}
        >
          <div 
            className="glass-card"
            style={{ 
              padding: isMobile ? '1.75rem 1.15rem' : '3rem 2.5rem', 
              borderRadius: '24px', 
              backgroundColor: '#FFF9F0',
              border: '1.5px solid #DCC8AE',
              boxShadow: '0 8px 24px rgba(43, 20, 11, 0.06)',
              textAlign: 'center'
            }}
          >
            <span style={{ fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#2F6B3A', fontWeight: '850', display: 'block', marginBottom: '0.5rem' }}>
              NOT SURE WHAT TO CHOOSE?
            </span>

            <h2 style={{ fontSize: isMobile ? '1.75rem' : '2.4rem', fontFamily: 'var(--font-serif)', color: '#32180D', fontWeight: '850', margin: '0 0 1.5rem', lineHeight: '1.25' }}>
              Find Your Perfect <span style={{ color: '#2F6B3A' }}>MILASTY Bake</span>
            </h2>

            {/* Questions Render */}
            {quizQuestions.map((q) => (
              <div key={q.id} style={{ marginBottom: '2rem' }}>
                <p style={{ fontSize: isMobile ? '0.95rem' : '1.05rem', color: '#654B38', marginBottom: '1.25rem', fontWeight: '600' }}>
                  {q.questionText}
                </p>

                {/* Option Buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', maxWidth: '420px', margin: '0 auto' }}>
                  {(q.options || []).map((option) => {
                    const isOptionSelected = quizSelectedOption?.id === option.id;
                    return (
                      <button
                        key={option.id}
                        onClick={() => {
                          setQuizSelectedOption(option);
                          const recs = option.recommendedProducts || option.mappedProducts || [];
                          setQuizRecommendations(recs);
                        }}
                        style={{
                          padding: isMobile ? '0.85rem 1.1rem' : '0.95rem 1.35rem',
                          borderRadius: '999px',
                          backgroundColor: isOptionSelected ? '#2F6B3A' : '#F1E5D4',
                          border: isOptionSelected ? '2px solid #2F6B3A' : '1.5px solid #DCC8AE',
                          color: isOptionSelected ? '#FFFFFF' : '#32180D',
                          fontWeight: '800',
                          fontSize: isMobile ? '0.88rem' : '0.95rem',
                          cursor: 'pointer',
                          transition: 'all 0.25s ease',
                          boxShadow: isOptionSelected ? '0 6px 20px rgba(47, 107, 58, 0.25)' : 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        {isOptionSelected && <Check size={16} color="#FFFFFF" />}
                        <span>{option.optionText}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Recommended Products Result Box */}
            {quizSelectedOption && (
              <div style={{ marginTop: '2rem', borderTop: '1px dashed #DCC8AE', paddingTop: '1.5rem', width: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
                <h3 style={{ fontSize: '1.2rem', color: '#2F6B3A', fontFamily: 'var(--font-serif)', marginBottom: '1rem', fontWeight: '800' }}>
                  Recommended for You ({quizRecommendations.length})
                </h3>

                {quizRecommendations.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, minmax(0, 1fr))', gap: '0.85rem', width: '100%', boxSizing: 'border-box' }}>
                    {quizRecommendations.map((prod) => (
                      <div
                        key={prod.id || prod._id}
                        onClick={() => navigate(`/product/${prod.slug || prod.id || prod._id}`)}
                        style={{
                          backgroundColor: '#FCF8F1',
                          padding: isMobile ? '0.65rem' : '0.85rem',
                          borderRadius: '16px',
                          border: '1px solid #DCC8AE',
                          display: 'flex',
                          gap: '0.65rem',
                          alignItems: 'center',
                          textAlign: 'left',
                          cursor: 'pointer',
                          width: '100%',
                          boxSizing: 'border-box',
                          minWidth: 0,
                          overflow: 'hidden',
                          transition: 'transform 0.2s ease, border-color 0.2s ease',
                        }}
                      >
                        <img src={prod.image || prod.primary_image || '/images/image1.jpeg'} alt={prod.title} style={{ width: isMobile ? '48px' : '56px', height: isMobile ? '48px' : '56px', objectFit: 'cover', borderRadius: '10px', flexShrink: 0 }} />
                        <div style={{ flexGrow: 1, minWidth: 0, overflow: 'hidden' }}>
                          <div style={{ fontWeight: '800', color: '#32180D', fontSize: isMobile ? '0.82rem' : '0.92rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {prod.title}
                          </div>
                          <div style={{ color: '#2F6B3A', fontWeight: '800', fontSize: isMobile ? '0.78rem' : '0.88rem', marginTop: '0.15rem' }}>
                            ₹{prod.price}
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart(prod, null, 1);
                          }}
                          style={{ backgroundColor: '#2F6B3A', color: '#FFF', border: 'none', padding: isMobile ? '0.35rem 0.65rem' : '0.45rem 0.85rem', borderRadius: '999px', fontWeight: '800', fontSize: isMobile ? '0.7rem' : '0.78rem', cursor: 'pointer', flexShrink: 0 }}
                        >
                          + Add
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: '#654B38', fontSize: '0.9rem' }}>
                    No specific bakes mapped for this option yet.
                  </p>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* EXPLORE MORE CATEGORIES POPUP MODAL */}
      {exploreModalOpen && (
        <div 
          style={{ 
            position: 'fixed', 
            inset: 0, 
            backgroundColor: 'rgba(43, 20, 11, 0.6)', 
            backdropFilter: 'blur(8px)', 
            WebkitBackdropFilter: 'blur(8px)', 
            zIndex: 99999, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            padding: '1rem' 
          }}
          onClick={() => setExploreModalOpen(false)}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{ 
              backgroundColor: '#FFF9F0', 
              borderRadius: '24px', 
              border: '1.5px solid #DCC8AE', 
              padding: isMobile ? '1.25rem 1rem' : '2.25rem 2rem', 
              maxWidth: '720px', 
              width: '100%', 
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              color: '#32180D',
              boxShadow: '0 24px 60px rgba(43, 20, 11, 0.2)',
              position: 'relative'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #DCC8AE', paddingBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.35rem', fontFamily: 'var(--font-serif)', margin: 0, fontWeight: '850', color: '#32180D' }}>Explore All Collections</h3>
                <span style={{ fontSize: '0.78rem', color: '#2F6B3A', fontWeight: '700', marginTop: '0.2rem', display: 'block' }}>Showing {categories.length} dynamic store collections</span>
              </div>
              <button 
                onClick={() => setExploreModalOpen(false)}
                style={{ backgroundColor: '#F1E5D4', border: 'none', borderRadius: '50%', color: '#32180D', cursor: 'pointer', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: '900' }}
              >
                ✕
              </button>
            </div>

            <div style={{ overflowY: 'auto', flex: 1, paddingRight: '0.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: '1.25rem' }}>
                {categories.map((cat, idx) => {
                  const catIdOrSlug = cat.slug || cat.id;
                  const isSelected = selectedCategory === catIdOrSlug || selectedCategory === cat.id;
                  const img = cat.image_url || cat.image || 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500';
                  const pCount = cat.productCount || 0;

                  return (
                    <div
                      key={cat.id || cat.slug || idx}
                      onClick={() => handleCategoryClick(catIdOrSlug)}
                      style={{
                        padding: '1.15rem 1rem',
                        borderRadius: '18px',
                        backgroundColor: isSelected ? '#E3EEDC' : '#FCF8F1',
                        border: isSelected ? '2px solid #2F6B3A' : '1px solid #DCC8AE',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center',
                        transition: 'all 0.25s ease'
                      }}
                    >
                      <div style={{ width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', marginBottom: '0.75rem', border: isSelected ? '2px solid #2F6B3A' : '1.5px solid #DCC8AE', position: 'relative' }}>
                        <img src={img} alt={cat.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        {isSelected && (
                          <div style={{ position: 'absolute', bottom: '4px', right: '4px', backgroundColor: '#2F6B3A', borderRadius: '50%', padding: '2px', border: '1px solid #FFFFFF' }}>
                            <Check size={12} color="#FFFFFF" strokeWidth={3} />
                          </div>
                        )}
                      </div>
                      <span style={{ fontSize: '0.62rem', letterSpacing: '0.08em', color: isSelected ? '#24572E' : '#2F6B3A', fontWeight: '850', textTransform: 'uppercase' }}>
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <div style={{ fontSize: '0.88rem', fontWeight: '800', fontFamily: 'var(--font-serif)', color: isSelected ? '#24572E' : '#32180D', marginTop: '0.2rem', textTransform: 'uppercase' }}>
                        {cat.name}
                      </div>
                      <span style={{ fontSize: '0.72rem', color: '#654B38', marginTop: '0.25rem', fontWeight: '700' }}>
                        {pCount} {pCount === 1 ? 'Product' : 'Products'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FILTER POPUP MODAL (Synchronized with single category source) */}
      {filterModalOpen && (
        <div 
          style={{ 
            position: 'fixed', 
            inset: 0, 
            backgroundColor: 'rgba(43, 20, 11, 0.6)', 
            backdropFilter: 'blur(8px)', 
            WebkitBackdropFilter: 'blur(8px)', 
            zIndex: 99999, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            padding: '1rem' 
          }}
          onClick={() => setFilterModalOpen(false)}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{ 
              backgroundColor: '#FFF9F0', 
              borderRadius: '24px', 
              border: '1.5px solid #DCC8AE', 
              padding: isMobile ? '1.5rem 1.15rem' : '2rem 1.75rem', 
              maxWidth: '450px', 
              width: '100%', 
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              color: '#32180D',
              boxShadow: '0 20px 50px rgba(43, 20, 11, 0.2)',
              position: 'relative'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #DCC8AE', paddingBottom: '0.85rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-serif)', margin: 0, fontWeight: '800', color: '#32180D' }}>Filter Categories</h3>
              <button 
                onClick={() => setFilterModalOpen(false)}
                style={{ backgroundColor: '#F1E5D4', border: 'none', borderRadius: '50%', color: '#32180D', cursor: 'pointer', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: '900' }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: '#654B38', marginBottom: '1rem', fontWeight: '500' }}>
              Select a category filter to explore bakes:
            </p>

            <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem', paddingRight: '0.2rem' }}>
              {modalCategoryList.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                const pCount = cat.id === 'all' ? products.length : (cat.productCount || 0);

                return (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryClick(cat.id)}
                    style={{
                      padding: '0.85rem 1.25rem',
                      borderRadius: '16px',
                      backgroundColor: isSelected ? '#2F6B3A' : '#F1E5D4',
                      border: isSelected ? '1.5px solid #2F6B3A' : '1px solid #DCC8AE',
                      color: isSelected ? '#FFFFFF' : '#32180D',
                      fontWeight: '800',
                      fontSize: '0.9rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'all 0.25s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span style={{ fontSize: '0.72rem', color: isSelected ? '#FFFFFF' : '#2F6B3A', fontWeight: '850' }}>{cat.number}</span>
                      <span>{cat.label}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <span style={{ fontSize: '0.74rem', color: isSelected ? '#FFFFFF' : '#654B38', fontWeight: '600' }}>
                        {pCount} {pCount === 1 ? 'Product' : 'Products'}
                      </span>
                      {isSelected && <Check size={16} color="#FFFFFF" strokeWidth={3} />}
                    </div>
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
      {/* 7. REVIEWS (Database-backed Testimonials) */}
      {/* ================================================================== */}
      {testimonials.length > 0 && (
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
              const rev = testimonials[reviewIndex % testimonials.length];
              if (!rev) return null;
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
                        setReviewIndex((prev) => (prev + 1) % testimonials.length);
                      } else {
                        setReviewIndex((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1));
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
                    {[...Array(Number(rev.rating || 5))].map((_, i) => (
                      <Star key={i} size={18} fill="var(--accent-gold)" color="var(--accent-gold)" />
                    ))}
                  </div>

                  {/* Review Text */}
                  <p style={{ fontSize: isMobile ? '0.95rem' : '1.15rem', color: '#FFFDF9', lineHeight: '1.65', marginBottom: '1.5rem', fontWeight: '500', fontStyle: 'italic' }}>
                    "{rev.testimonialText || rev.content}"
                  </p>

                  {/* Author Info */}
                  <div>
                    <h4 style={{ fontSize: '1rem', color: '#FFFDF9', fontWeight: '850', margin: '0 0 0.2rem' }}>
                      — {rev.customerName || rev.name}
                    </h4>
                    <span style={{ fontSize: '0.78rem', color: '#b9cd94', fontWeight: '700' }}>
                      {rev.verified !== false ? 'Verified Customer' : 'Customer'}{rev.productTitle ? ` • ${rev.productTitle}` : ''}
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Dots Indicator & Navigation Arrows */}
            {testimonials.length > 1 && (
              <div style={{ marginTop: '1.75rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  {testimonials.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setReviewIndex(idx)}
                      style={{
                        width: (reviewIndex % testimonials.length) === idx ? '24px' : '8px',
                        height: '8px',
                        borderRadius: '999px',
                        backgroundColor: (reviewIndex % testimonials.length) === idx ? 'var(--accent-gold)' : 'rgba(255, 255, 255, 0.25)',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                    />
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button
                    onClick={() => setReviewIndex(prev => (prev === 0 ? testimonials.length - 1 : prev - 1))}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(35, 21, 13, 0.75)',
                      border: '1.5px solid rgba(255, 255, 255, 0.25)',
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
                    onClick={() => setReviewIndex(prev => (prev === testimonials.length - 1 ? 0 : prev + 1))}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(35, 21, 13, 0.75)',
                      border: '1.5px solid rgba(255, 255, 255, 0.25)',
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
            )}
          </div>
        </section>
      )}

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
