import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingBag, Star, Heart, ChevronRight, ChevronLeft, CheckCircle2, XCircle, ShieldCheck, Truck, Sparkles, AlertTriangle, Plus, Minus, Info, MapPin, Save, FileText, ExternalLink, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useDelivery } from '../context/DeliveryContext';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { initialProducts } from '../data/seedData';
import ProductCard from '../components/ProductCard';
import PriceDisplay from '../components/PriceDisplay';
import AuthPromptModal from '../components/AuthPromptModal';
import { LOW_STOCK_THRESHOLD } from '../config/constants';

export default function ProductDetail() {
  const { slug, id } = useParams();
  const identifier = slug || id;

  const { addToCart, showToast } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { deliveryInfo, checkPincode, clearDeliveryInfo } = useDelivery();
  const { user, isAuthenticated, addAddress } = useAuth();

  const [product, setProduct] = useState(null);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [btnText, setBtnText] = useState('Add to Cart');
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [activeTab, setActiveTab] = useState('nutrition');
  const [reviewsData, setReviewsData] = useState({ averageRating: 0, totalReviews: 0, ratingDistribution: {}, reviews: [] });
  const [selectedModalImage, setSelectedModalImage] = useState(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [customizationNote, setCustomizationNote] = useState('');
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);

  const fetchProductReviews = async (targetId) => {
    try {
      const res = await api.get(`/reviews/product/${targetId}`);
      if (res.data && typeof res.data === 'object') {
        const reviewsArr = Array.isArray(res.data.reviews)
          ? res.data.reviews
          : (Array.isArray(res.data) ? res.data : []);

        const count = reviewsArr.length;
        const avg = count > 0
          ? (reviewsArr.reduce((sum, r) => sum + Number(r.rating || 5), 0) / count).toFixed(1)
          : 0;

        const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        reviewsArr.forEach((r) => {
          const rnum = Math.round(Number(r.rating || 5));
          if (dist[rnum] !== undefined) dist[rnum] += 1;
        });

        setReviewsData({
          averageRating: Number(res.data.averageRating || avg),
          totalReviews: Number(res.data.totalReviews !== undefined ? res.data.totalReviews : count),
          ratingDistribution: res.data.ratingDistribution || dist,
          reviews: reviewsArr,
        });
      }
    } catch (e) {
      console.warn('Error fetching product reviews:', e.message);
    }
  };

  const [inputPincode, setInputPincode] = useState('');
  const [checkingPincode, setCheckingPincode] = useState(false);
  const [pincodeError, setPincodeError] = useState('');
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    if (identifier) {
      fetchProduct();
    }
  }, [identifier]);

  // Keyboard navigation for Lightbox — MUST be declared before any early returns
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isLightboxOpen) return;
      if (e.key === 'Escape') setIsLightboxOpen(false);
      if (e.key === 'ArrowRight') setSelectedImageIndex((prev) => prev + 1);
      if (e.key === 'ArrowLeft') setSelectedImageIndex((prev) => (prev > 0 ? prev - 1 : 0));
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/products/${identifier}`);
      if (res.data) {
        setProduct(res.data);
        setSelectedImageIndex(0);

        if (res.data.variants && res.data.variants.length > 0) {
          const availIdx = res.data.variants.findIndex((v) => (v.stock !== undefined ? v.stock : 50) > 0);
          setSelectedVariantIndex(availIdx >= 0 ? availIdx : 0);
        }
        fetchRelated(res.data.category, res.data._id || res.data.slug);
        fetchProductReviews(res.data._id || res.data.id || res.data.slug);
      }
    } catch (err) {
      const found = initialProducts.find((p) => p.slug === identifier || p._id === identifier);
      if (found) {
        setProduct(found);
        setSelectedImageIndex(0);
        const allFiltered = initialProducts.filter((p) => p.slug !== identifier && p._id !== identifier);
        const sameCategory = allFiltered.filter(p => p.category === found.category);
        setRelatedProducts(sameCategory.length > 0 ? sameCategory : allFiltered);
        fetchProductReviews(found._id || found.id || found.slug || identifier);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchRelated = async (category, currentId) => {
    try {
      const res = await api.get('/products?limit=100');
      if (res.data && res.data.products && res.data.products.length > 0) {
        const allFiltered = res.data.products.filter((p) => p.slug !== currentId && p._id !== currentId);
        const sameCategory = allFiltered.filter(p => p.category === category);
        const otherCategory = allFiltered.filter(p => p.category !== category);
        setRelatedProducts(sameCategory.length > 0 ? [...sameCategory, ...otherCategory].slice(0, 4) : allFiltered.slice(0, 4));
      }
    } catch (e) {
      const allFiltered = initialProducts.filter((p) => p.slug !== currentId && p._id !== currentId);
      setRelatedProducts(allFiltered.slice(0, 4));
    }
  };

  const handleCheckPincode = async () => {
    const clean = inputPincode.trim();
    if (!clean || clean.length !== 6 || !/^\d{6}$/.test(clean)) {
      setPincodeError('Please enter a valid 6-digit Indian PIN code.');
      return;
    }
    setPincodeError('');
    setCheckingPincode(true);
    await checkPincode(clean, { isTemp: true, isSavedAddress: false });
    setCheckingPincode(false);
    setIsChangingPin(false);
  };

  const handleSaveTempPinToAddress = async () => {
    if (!isAuthenticated || !deliveryInfo.pincode) return;
    setSavingAddress(true);
    try {
      await addAddress({
        fullName: user?.name || 'Customer',
        phone: user?.phone || '',
        addressLine: 'Delivery Location',
        building: '',
        city: deliveryInfo.city || 'City',
        state: deliveryInfo.state || 'State',
        pincode: deliveryInfo.pincode,
        addressType: 'Home',
        isDefault: true,
      });
      if (showToast) showToast('Address & PIN saved to your account!');
    } catch (err) {
      if (showToast) showToast('Failed to save address.');
    } finally {
      setSavingAddress(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '65vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7F0E5' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', color: '#32180D' }}>
          <div className="animate-spin" style={{ width: '40px', height: '40px', border: '3px solid #DCC8AE', borderTopColor: '#2F6B3A', borderRadius: '50%' }} />
          <span style={{ fontSize: '0.95rem', fontWeight: '600', letterSpacing: '0.05em' }}>Loading Product Details...</span>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div style={{ minHeight: '65vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7F0E5', color: '#32180D', textAlign: 'center', padding: '2rem' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', marginBottom: '1rem' }}>Product Not Found</h2>
        <p style={{ color: '#654B38', marginBottom: '1.5rem' }}>The product you are looking for does not exist or has been removed.</p>
        <Link to="/shop" className="btn-primary" style={{ padding: '0.75rem 1.5rem', borderRadius: '999px', backgroundColor: '#2F6B3A', color: '#FFFFFF', textDecoration: 'none' }}>
          Back to Shop Catalog
        </Link>
      </div>
    );
  }

  const handleTouchStart = (e) => {
    touchEndX.current = null;
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    if (distance > 40 && images.length > 1) {
      setSelectedImageIndex((prev) => (prev + 1) % images.length);
    } else if (distance < -40 && images.length > 1) {
      setSelectedImageIndex((prev) => (prev - 1 + images.length) % images.length);
    }
  };


  // Extract all gallery images from product_images relation or legacy single fields
  const galleryImageUrls = [];
  if (Array.isArray(product?.images) && product.images.length > 0) {
    product.images.forEach((imgObj) => {
      const url = typeof imgObj === 'string' ? imgObj : (imgObj.image_url || imgObj.url || imgObj.image);
      if (url && typeof url === 'string' && url.trim() !== '') {
        galleryImageUrls.push(url.trim());
      }
    });
  }

  if (galleryImageUrls.length === 0 && product) {
    const fallbackList = [
      product.image,
      product.image_url,
      product.secondaryImage,
      product.secondary_image,
      product.primary_image
    ].filter((img) => Boolean(img) && typeof img === 'string' && img.trim() !== '');
    galleryImageUrls.push(...fallbackList);
  }

  if (galleryImageUrls.length === 0) {
    galleryImageUrls.push('https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=800');
  }

  const images = Array.from(new Set(galleryImageUrls));

  const hasVariants = product.variants && product.variants.length > 0;
  const selectedVariant = hasVariants ? (product.variants[selectedVariantIndex] || product.variants[0]) : null;

  // Variant stock resolution
  const currentStock = hasVariants
    ? (selectedVariant?.stock !== undefined && selectedVariant?.stock !== null ? Number(selectedVariant.stock) : 50)
    : (product.stock !== undefined && product.stock !== null ? Number(product.stock) : 50);

  const currentPrice = hasVariants ? Number(selectedVariant?.price || 0) : Number(product.price || 0);
  const currentOriginalPrice = hasVariants
    ? Number(selectedVariant?.originalPrice || selectedVariant?.price || 0)
    : Number(product.originalPrice || product.price || 0);

  const hasDiscount = currentOriginalPrice > currentPrice;
  const discountPercent = hasDiscount ? Math.round(((currentOriginalPrice - currentPrice) / currentOriginalPrice) * 100) : 0;

  const wishlisted = isInWishlist(product._id || product.id || product.slug);

  const handleQuantityIncrease = () => {
    if (quantity >= currentStock) {
      if (showToast) showToast(`Only ${currentStock} packs are available.`);
      return;
    }
    setQuantity((prev) => prev + 1);
  };

  const handleQuantityDecrease = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };
  // Requirement 8: Enforce Login Prompt for Logged-Out Users
  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    if (currentStock <= 0) {
      if (showToast) showToast('This item is currently out of stock.');
      return;
    }

    setBtnText('Adding...');
    try {
      await addToCart(product, selectedVariant, quantity, customizationNote);
      setBtnText('✓ Added to Cart');
      setTimeout(() => setBtnText('Add to Cart'), 2000);
    } catch (e) {
      setBtnText('Unable to Add');
      setTimeout(() => setBtnText('Add to Cart'), 2000);
    }
  };

  // Safe nutrition facts normalized list
  const getNormalizedNutritionList = () => {
    const raw = product.nutritionFacts || product.nutrition_facts;
    if (!raw) return [];
    
    if (Array.isArray(raw)) {
      return raw.map((item) => {
        if (typeof item === 'object' && item !== null) {
          return {
            label: item.label || item.key || 'Nutrition',
            value: item.value ?? '',
            unit: item.unit ?? ''
          };
        }
        return { label: String(item), value: '', unit: '' };
      }).filter((item) => Boolean(item.label && (item.value !== '' || item.unit !== '')));
    }
    
    if (typeof raw === 'object' && raw !== null) {
      return Object.entries(raw).map(([key, val]) => {
        if (key === 'variant_stocks' || key === 'pieces') return null;
        if (val === null || val === undefined || val === '') return null;
        if (typeof val === 'object' && val !== null) {
          const label = val.label || key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').replace(/^./, (str) => str.toUpperCase());
          return {
            label: label,
            value: val.value ?? '',
            unit: val.unit ?? ''
          };
        }
        const label = key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').replace(/^./, (str) => str.toUpperCase());
        return { label, value: String(val), unit: '' };
      }).filter(Boolean);
    }
    return [];
  };

  const safeNutritionFacts = getNormalizedNutritionList();

  const getIngredientsList = () => {
    const raw = product.ingredients;
    if (!raw) return [];
    if (Array.isArray(raw)) {
      return raw.map((i) => String(i).trim()).filter((i) => i.length > 0);
    }
    if (typeof raw === 'string') {
      return raw.split(',').map((s) => s.trim()).filter((s) => s.length > 0);
    }
    return [];
  };

  const ingredientsList = getIngredientsList();
  const labReportUrl = product.labReportUrl || product.lab_report_url || product.lab_report || product.labReport;

  return (
    <div style={{ backgroundColor: '#F7F0E5', color: '#2B170D', minHeight: '100vh', paddingTop: '1rem', paddingBottom: '5rem' }}>
      
      {/* Auth Prompt Modal for Logged-Out Guest Purchases */}
      <AuthPromptModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        title="Login Required to Purchase"
        message="Please log in or create an account to purchase MILASTY handcrafted products and proceed to checkout."
      />

      {/* Maximum Container Width */}
      <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '0 1.25rem' }}>
        
        {/* Breadcrumbs Navigation */}
        <nav 
          aria-label="Breadcrumb"
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            fontSize: '0.85rem', 
            color: '#654B38', 
            marginBottom: '2rem',
            flexWrap: 'wrap'
          }}
        >
          <Link to="/" style={{ color: '#654B38', textDecoration: 'none', transition: 'color 0.2s' }} onMouseOver={(e) => e.target.style.color = '#2F6B3A'} onMouseOut={(e) => e.target.style.color = '#654B38'}>
            Home
          </Link>
          <ChevronRight size={14} color="#806A57" />
          <Link to="/shop" style={{ color: '#654B38', textDecoration: 'none', transition: 'color 0.2s' }} onMouseOver={(e) => e.target.style.color = '#2F6B3A'} onMouseOut={(e) => e.target.style.color = '#654B38'}>
            Shop
          </Link>
          <ChevronRight size={14} color="#806A57" />
          <span style={{ color: '#2F6B3A', fontWeight: '700' }}>{product.title}</span>
        </nav>

        {/* 2-Column Product Detail Layout */}
        <div 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
            gap: '3rem',
            alignItems: 'start',
            marginBottom: '4rem'
          }}
        >
          
          {/* LEFT COLUMN: Product Image Gallery */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Main Dominant Image Container */}
            <div 
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onClick={() => setIsLightboxOpen(true)}
              style={{ 
                position: 'relative', 
                width: '100%', 
                paddingTop: '100%', 
                borderRadius: '20px', 
                overflow: 'hidden', 
                backgroundColor: '#FFF9F0', 
                border: '1px solid #DCC8AE',
                boxShadow: '0 8px 30px rgba(75, 45, 25, 0.08)',
                cursor: 'zoom-in',
                userSelect: 'none'
              }}
            >
              <img 
                src={images[selectedImageIndex] || product.image} 
                alt={product.title} 
                style={{ 
                  position: 'absolute', 
                  top: 0, 
                  left: 0, 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'cover',
                  transition: 'opacity 0.3s ease, transform 0.4s ease'
                }} 
              />

              {/* Save Discount Badge */}
              {hasDiscount && (
                <div 
                  style={{ 
                    position: 'absolute', 
                    top: '16px', 
                    left: '16px', 
                    backgroundColor: '#2F6B3A', 
                    color: '#FFFFFF', 
                    border: '1px solid #2F6B3A',
                    padding: '0.35rem 0.85rem', 
                    borderRadius: '999px', 
                    fontSize: '0.75rem', 
                    fontWeight: '800',
                    letterSpacing: '0.05em',
                    boxShadow: '0 4px 12px rgba(47, 107, 58, 0.25)',
                    zIndex: 2
                  }}
                >
                  SAVE {discountPercent}%
                </div>
              )}

              {/* Click to Zoom Overlay Indicator */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '16px',
                  right: '16px',
                  backgroundColor: '#FFF9F0',
                  backdropFilter: 'blur(6px)',
                  color: '#2F6B3A',
                  border: '1px solid #DCC8AE',
                  padding: '0.3rem 0.75rem',
                  borderRadius: '999px',
                  fontSize: '0.72rem',
                  fontWeight: '700',
                  pointerEvents: 'none',
                  zIndex: 2
                }}
              >
                🔍 Tap to Expand
              </div>

              {/* Prev / Next Chevrons on Main Gallery when multiple images exist */}
              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImageIndex((prev) => (prev - 1 + images.length) % images.length);
                    }}
                    aria-label="Previous Image"
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '12px',
                      transform: 'translateY(-50%)',
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      backgroundColor: '#FFF9F0',
                      border: '1px solid #DCC8AE',
                      color: '#32180D',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      zIndex: 3,
                      transition: 'all 0.2s'
                    }}
                  >
                    <ChevronLeft size={20} />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImageIndex((prev) => (prev + 1) % images.length);
                    }}
                    aria-label="Next Image"
                    style={{
                      position: 'absolute',
                      top: '50%',
                      right: '12px',
                      transform: 'translateY(-50%)',
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      backgroundColor: '#FFF9F0',
                      border: '1px solid #DCC8AE',
                      color: '#32180D',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      zIndex: 3,
                      transition: 'all 0.2s'
                    }}
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}

              {/* Mobile Dots Indicator */}
              {images.length > 1 && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '16px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    gap: '6px',
                    zIndex: 2
                  }}
                >
                  {images.map((_, idx) => (
                    <div
                      key={idx}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedImageIndex(idx);
                      }}
                      style={{
                        width: idx === selectedImageIndex ? '20px' : '8px',
                        height: '8px',
                        borderRadius: '999px',
                        backgroundColor: idx === selectedImageIndex ? '#2F6B3A' : '#DCC8AE',
                        transition: 'all 0.3s ease',
                        cursor: 'pointer'
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Thumbnails Row */}
            {images.length > 1 && (
              <div style={{ display: 'flex', gap: '0.85rem', overflowX: 'auto', paddingBottom: '0.5rem', scrollbarWidth: 'thin' }}>
                {images.map((img, idx) => {
                  const isActive = idx === selectedImageIndex;
                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedImageIndex(idx)}
                      style={{
                        width: '72px',
                        height: '72px',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        padding: 0,
                        backgroundColor: '#FFF9F0',
                        border: isActive ? '2px solid #2F6B3A' : '1px solid #DCC8AE',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: isActive ? '0 0 14px rgba(47, 107, 58, 0.25)' : 'none',
                        flexShrink: 0,
                        opacity: isActive ? 1 : 0.75
                      }}
                    >
                      <img src={img} alt={`Thumbnail ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Product Details & Purchase Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Category / Badges Row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span 
                style={{ 
                  fontSize: '0.72rem', 
                  fontWeight: '800', 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.08em', 
                  color: '#2F6B3A', 
                  backgroundColor: '#E3EEDC', 
                  padding: '0.25rem 0.75rem', 
                  borderRadius: '999px',
                  border: '1px solid #DCC8AE'
                }}
              >
                {product.category || 'Milasty Bakes'}
              </span>

              {Array.isArray(product.badges) && product.badges.map((b, i) => (
                <span 
                  key={i} 
                  style={{ 
                    fontSize: '0.72rem', 
                    fontWeight: '700', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.05em', 
                    color: '#32180D', 
                    backgroundColor: '#F1E5D4', 
                    padding: '0.25rem 0.75rem', 
                    borderRadius: '999px',
                    border: '1px solid #DCC8AE'
                  }}
                >
                  {b}
                </span>
              ))}
            </div>

            {/* Product Title */}
            <h1 
              style={{ 
                fontFamily: 'var(--font-serif)', 
                fontSize: 'clamp(1.85rem, 3.5vw, 2.5rem)', 
                fontWeight: '850', 
                color: '#32180D', 
                margin: 0, 
                lineHeight: '1.2' 
              }}
            >
              {product.title}
            </h1>

            {product.subtitle && product.subtitle.trim() !== '' && (
              <p style={{ fontSize: '1rem', color: '#654B38', margin: 0, fontWeight: '500' }}>
                {product.subtitle}
              </p>
            )}

            {/* Rating / Review Info */}
            {((reviewsData.totalReviews || product.reviewCount || 0) > 0) ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ display: 'flex', color: '#2F6B3A' }}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      size={15}
                      fill={s <= Math.round(reviewsData.averageRating || product.rating || 0) ? '#2F6B3A' : 'none'}
                      color="#2F6B3A"
                    />
                  ))}
                </div>
                <span style={{ fontSize: '0.88rem', fontWeight: '750', color: '#32180D' }}>
                  {Number(reviewsData.averageRating || product.rating || 5).toFixed(1)}
                </span>
                <span style={{ fontSize: '0.82rem', color: '#806A57' }}>
                  ({reviewsData.totalReviews || product.reviewCount} {(reviewsData.totalReviews || product.reviewCount) === 1 ? 'Review' : 'Reviews'})
                </span>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ display: 'flex', color: '#DCC8AE' }}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} size={15} fill="none" color="#DCC8AE" />
                  ))}
                </div>
                <span style={{ fontSize: '0.82rem', color: '#806A57', fontWeight: '600' }}>
                  (No reviews yet)
                </span>
              </div>
            )}

            {/* Description */}
            {product.description && (
              <p style={{ fontSize: '0.95rem', color: '#654B38', lineHeight: '1.6', margin: 0 }}>
                {product.description}
              </p>
            )}

            {/* Product Benefits Section */}
            {((Array.isArray(product.benefits) && product.benefits.length > 0) || (typeof product.benefits === 'string' && product.benefits.trim().length > 0)) && (
              <div style={{ marginTop: '0.4rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#2F6B3A' }}>
                  Key Bake Benefits
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                  {(Array.isArray(product.benefits) ? product.benefits : product.benefits.split(',')).map((b, idx) => {
                    const cleanB = String(b).trim();
                    if (!cleanB) return null;
                    return (
                      <div 
                        key={idx} 
                        style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '0.35rem', 
                          backgroundColor: '#E3EEDC', 
                          border: '1px solid #DCC8AE', 
                          padding: '0.3rem 0.75rem', 
                          borderRadius: '999px', 
                          fontSize: '0.8rem', 
                          color: '#2F6B3A', 
                          fontWeight: '700' 
                        }}
                      >
                        <CheckCircle2 size={13} color="#2F6B3A" />
                        <span>{cleanB}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Price Section */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.85rem', marginTop: '0.5rem', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '2rem', fontWeight: '900', color: '#32180D' }}>
                ₹{currentPrice}
              </span>
              {hasDiscount && (
                <span style={{ fontSize: '1.2rem', color: '#806A57', textDecoration: 'line-through', fontWeight: '600' }}>
                  ₹{currentOriginalPrice}
                </span>
              )}
            </div>

            {/* Variant Pack Size Selector */}
            {hasVariants && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#2F6B3A' }}>
                  Select Pack Size
                </label>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  {product.variants.map((v, index) => {
                    const isSelected = index === selectedVariantIndex;
                    const vStock = v.stock !== undefined && v.stock !== null ? Number(v.stock) : 50;
                    const isVOut = vStock <= 0;

                    return (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          setSelectedVariantIndex(index);
                          setQuantity(1);
                        }}
                        style={{
                          padding: '0.65rem 1.15rem',
                          borderRadius: '12px',
                          border: isSelected ? '2px solid #2F6B3A' : '1px solid #DCC8AE',
                          backgroundColor: isSelected ? '#E3EEDC' : '#FFF9F0',
                          color: isSelected ? '#2F6B3A' : '#32180D',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '0.15rem',
                          transition: 'all 0.2s',
                          boxShadow: isSelected ? '0 4px 14px rgba(47, 107, 58, 0.15)' : 'none',
                          opacity: isVOut ? 0.6 : 1
                        }}
                      >
                        <span style={{ fontSize: '0.9rem', fontWeight: '800' }}>{v.weight || v.name}</span>
                        <span style={{ fontSize: '0.78rem', color: isSelected ? '#2F6B3A' : '#654B38', fontWeight: '700' }}>₹{v.price}</span>
                        {isVOut && (
                          <span style={{ fontSize: '0.62rem', color: '#dc2626', fontWeight: '800', textTransform: 'uppercase' }}>Out of Stock</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Independent Stock Alert Badge */}
            <div style={{ marginTop: '0.25rem' }}>
              {currentStock <= 0 ? (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', backgroundColor: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', padding: '0.45rem 0.85rem', borderRadius: '8px', fontSize: '0.82rem', fontWeight: '800' }}>
                  <AlertTriangle size={15} />
                  <span>Out of Stock</span>
                </div>
              ) : currentStock <= 5 ? (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', backgroundColor: '#fef3c7', color: '#d97706', border: '1px solid #fde68a', padding: '0.45rem 0.85rem', borderRadius: '8px', fontSize: '0.82rem', fontWeight: '800' }}>
                  <Sparkles size={15} />
                  <span>⚡ Only {currentStock} packs left — order soon!</span>
                </div>
              ) : currentStock <= LOW_STOCK_THRESHOLD ? (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', backgroundColor: '#fef3c7', color: '#d97706', border: '1px solid #fde68a', padding: '0.45rem 0.85rem', borderRadius: '8px', fontSize: '0.75rem' }}>
                  <Sparkles size={15} />
                  <span>⚡ Only {currentStock} packs left</span>
                </div>
              ) : (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', color: '#2F6B3A', fontSize: '0.85rem', fontWeight: '700' }}>
                  <CheckCircle2 size={16} />
                  <span>In Stock ({currentStock} available)</span>
                </div>
              )}
            </div>

            {/* PERSONALIZE YOUR BAKE - Product Level Customization Card */}
            {Boolean(product?.allow_customization || product?.allowCustomization) && (
              <div
                style={{
                  backgroundColor: '#FBF6EE',
                  border: '1.5px solid rgba(47, 125, 50, 0.25)',
                  borderRadius: '16px',
                  padding: '1.25rem',
                  marginTop: '0.85rem',
                  marginBottom: '0.25rem',
                  boxShadow: '0 4px 16px rgba(47, 125, 50, 0.05)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#2F7D32', letterSpacing: '0.04em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span>✦</span> PERSONALIZE YOUR BAKE
                  </span>
                  <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#725D50', backgroundColor: 'rgba(58,31,20,0.06)', padding: '0.15rem 0.55rem', borderRadius: '999px' }}>
                    Optional
                  </span>
                </div>
                
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '800', color: '#3A1F14', marginBottom: '0.2rem' }}>
                  Special Instructions
                </label>
                <p style={{ fontSize: '0.78rem', color: '#725D50', margin: '0 0 0.65rem 0', lineHeight: '1.45' }}>
                  Optional — tell us how you'd like this particular item prepared. Your instruction applies <strong>ONLY to this product</strong>.
                </p>
                
                <div style={{ position: 'relative' }}>
                  <textarea
                    value={customizationNote}
                    onChange={(e) => setCustomizationNote(e.target.value.slice(0, 300))}
                    placeholder={product.customization_placeholder || product.customizationPlaceholder || "Example: Please write Happy Birthday Aanya."}
                    rows={3}
                    maxLength={300}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '0.75rem 0.85rem',
                      fontSize: '0.88rem',
                      borderRadius: '10px',
                      border: '1px solid rgba(58, 31, 20, 0.22)',
                      backgroundColor: '#FFFFFF',
                      color: '#3A1F14',
                      resize: 'vertical',
                      fontFamily: 'var(--font-sans)',
                      outline: 'none',
                    }}
                  />
                  <div style={{ textAlign: 'right', fontSize: '0.72rem', color: customizationNote.length >= 300 ? '#DC2626' : '#725D50', marginTop: '0.25rem', fontWeight: '700' }}>
                    {customizationNote.length}/300
                  </div>
                </div>
              </div>
            )}

            {/* Quantity Selector & Add to Cart Action Row */}
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '1rem', flexWrap: 'wrap' }}>
              <div 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  backgroundColor: '#FFF9F0', 
                  border: '1px solid #DCC8AE', 
                  borderRadius: '999px',
                  padding: '0.25rem 0.5rem'
                }}
              >
                <button
                  type="button"
                  onClick={handleQuantityDecrease}
                  disabled={quantity <= 1 || currentStock <= 0}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: quantity <= 1 || currentStock <= 0 ? '#DCC8AE' : '#32180D',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: quantity <= 1 || currentStock <= 0 ? 'not-allowed' : 'pointer',
                  }}
                >
                  <Minus size={14} />
                </button>
                <span style={{ padding: '0 0.85rem', fontWeight: '800', fontSize: '0.95rem', minWidth: '32px', textAlign: 'center', color: '#32180D' }}>
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={handleQuantityIncrease}
                  disabled={quantity >= currentStock || currentStock <= 0}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: quantity >= currentStock || currentStock <= 0 ? '#DCC8AE' : '#32180D',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: quantity >= currentStock || currentStock <= 0 ? 'not-allowed' : 'pointer',
                  }}
                >
                  <Plus size={14} />
                </button>
              </div>

              {/* Primary Add to Cart Button */}
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={currentStock <= 0}
                style={{
                  flex: 1,
                  minWidth: '200px',
                  padding: '0.85rem 1.75rem',
                  borderRadius: '999px',
                  backgroundColor: currentStock <= 0 ? '#E6D4BC' : '#2F6B3A',
                  color: currentStock <= 0 ? '#806A57' : '#FFFFFF',
                  border: currentStock <= 0 ? '1px solid #DCC8AE' : '1px solid #2F6B3A',
                  fontSize: '0.95rem',
                  fontWeight: '850',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  cursor: currentStock <= 0 ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: currentStock > 0 ? '0 6px 20px rgba(47, 107, 58, 0.3)' : 'none'
                }}
              >
                <ShoppingBag size={18} color={currentStock > 0 ? '#FFFFFF' : '#806A57'} />
                <span>{currentStock <= 0 ? 'Out of Stock' : btnText}</span>
              </button>

              {/* Wishlist Heart Button */}
              <button
                type="button"
                onClick={() => toggleWishlist(product)}
                aria-label="Wishlist"
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: '#FFF9F0',
                  border: '1px solid #DCC8AE',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: wishlisted ? '#2F6B3A' : '#32180D',
                  transition: 'all 0.2s'
                }}
              >
                <Heart size={20} fill={wishlisted ? '#2F6B3A' : 'none'} color={wishlisted ? '#2F6B3A' : '#32180D'} />
              </button>
            </div>

            {/* Pincode Serviceability Check Box */}
            <div 
              style={{ 
                marginTop: '1.25rem', 
                padding: '1.2rem', 
                borderRadius: '16px', 
                backgroundColor: '#FFF9F0', 
                border: '1px solid #DCC8AE' 
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem', fontWeight: '800', color: '#2F6B3A' }}>
                  <Truck size={18} />
                  <span>Check Delivery Availability</span>
                </div>
                {deliveryInfo && deliveryInfo.checked && (
                  <button 
                    type="button"
                    onClick={() => {
                      setIsChangingPin(!isChangingPin);
                      setInputPincode('');
                      setPincodeError('');
                    }} 
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#2F6B3A',
                      fontSize: '0.8rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                    }}
                  >
                    <MapPin size={13} />
                    <span>{isChangingPin ? 'Cancel' : 'Change PIN'}</span>
                  </button>
                )}
              </div>

              {/* Display Mode A: Input Mode */}
              {(!deliveryInfo || !deliveryInfo.checked || isChangingPin) ? (
                <div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="text"
                      maxLength={6}
                      value={inputPincode}
                      onChange={(e) => setInputPincode(e.target.value.replace(/\D/g, ''))}
                      placeholder="Enter 6-digit Indian PIN code"
                      onKeyDown={(e) => { if (e.key === 'Enter') handleCheckPincode(); }}
                      style={{
                        flex: 1,
                        padding: '0.6rem 0.85rem',
                        borderRadius: '10px',
                        backgroundColor: '#FCF8F1',
                        border: pincodeError ? '1px solid #ef4444' : '1px solid #DCC8AE',
                        color: '#32180D',
                        fontSize: '0.9rem',
                        fontFamily: 'monospace',
                        fontWeight: '700',
                        outline: 'none',
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleCheckPincode}
                      disabled={checkingPincode}
                      style={{
                        padding: '0.6rem 1.25rem',
                        borderRadius: '10px',
                        backgroundColor: '#2F6B3A',
                        border: '1px solid #2F6B3A',
                        color: '#FFFFFF',
                        fontSize: '0.85rem',
                        fontWeight: '800',
                        cursor: checkingPincode ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      {checkingPincode ? 'Checking...' : 'Check'}
                    </button>
                  </div>
                  {pincodeError && (
                    <p style={{ marginTop: '0.45rem', fontSize: '0.78rem', color: '#ef4444', margin: '0.45rem 0 0 0', fontWeight: '600' }}>
                      {pincodeError}
                    </p>
                  )}
                </div>
              ) : (
                /* Display Mode B: Checked Result Mode */
                <div>
                  {deliveryInfo.available ? (
                    <div style={{ backgroundColor: '#E3EEDC', border: '1px solid #DCC8AE', borderRadius: '12px', padding: '0.9rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#2F6B3A', fontWeight: '800', fontSize: '0.9rem', marginBottom: '0.35rem' }}>
                        <CheckCircle2 size={17} />
                        <span>
                          {deliveryInfo.isSavedAddress ? '✓ Delivery available to your address' : `✓ Delivery available to PIN ${deliveryInfo.pincode}`}
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.82rem', color: '#654B38', paddingLeft: '1.5rem' }}>
                        <div>Location: <strong style={{ color: '#32180D' }}>{deliveryInfo.pincode}{deliveryInfo.city ? `, ${deliveryInfo.city}` : ''}{deliveryInfo.state ? `, ${deliveryInfo.state}` : ''}</strong></div>
                        <div>Delivery Charge: <strong style={{ color: '#2F6B3A' }}>
                          {Number(deliveryInfo.deliveryCharge) === 0 ? 'FREE Delivery' : `₹${deliveryInfo.deliveryCharge}`}
                        </strong></div>
                        <div>Estimated Dispatch: <strong style={{ color: '#32180D' }}>{deliveryInfo.estimatedDays || '3–5 business days'}</strong></div>
                      </div>

                      {/* If user checked a temporary PIN while logged in, offer to save it */}
                      {isAuthenticated && deliveryInfo.isTemp && (
                        <div style={{ marginTop: '0.75rem', paddingTop: '0.6rem', borderTop: '1px dashed #DCC8AE', display: 'flex', justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            onClick={handleSaveTempPinToAddress}
                            disabled={savingAddress}
                            style={{
                              background: '#FFF9F0',
                              border: '1px solid #2F6B3A',
                              color: '#2F6B3A',
                              fontSize: '0.75rem',
                              fontWeight: '800',
                              padding: '0.3rem 0.75rem',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                            }}
                          >
                            <Save size={13} />
                            <span>{savingAddress ? 'Saving...' : 'Save this PIN to my addresses'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ backgroundColor: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '12px', padding: '0.9rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#dc2626', fontWeight: '800', fontSize: '0.9rem', marginBottom: '0.35rem' }}>
                        <XCircle size={17} />
                        <span>Delivery is currently unavailable at {deliveryInfo.pincode}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: '#991b1b', paddingLeft: '1.5rem', lineHeight: '1.4' }}>
                        {deliveryInfo.message || `Sorry, we do not currently deliver to PIN code ${deliveryInfo.pincode}.`}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Accordions / Information Tabs Section */}
        <div style={{ borderTop: '1px solid #DCC8AE', paddingTop: '3rem', marginBottom: '4rem' }}>
          <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid #DCC8AE', marginBottom: '1.5rem', overflowX: 'auto' }}>
            <button
              onClick={() => setActiveTab('nutrition')}
              style={{
                padding: '0.75rem 1.25rem',
                border: 'none',
                backgroundColor: 'transparent',
                color: activeTab === 'nutrition' ? '#2F6B3A' : '#654B38',
                borderBottom: activeTab === 'nutrition' ? '2px solid #2F6B3A' : '2px solid transparent',
                fontWeight: '800',
                fontSize: '0.95rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              Nutritional Facts
            </button>
            <button
              onClick={() => setActiveTab('ingredients')}
              style={{
                padding: '0.75rem 1.25rem',
                border: 'none',
                backgroundColor: 'transparent',
                color: activeTab === 'ingredients' ? '#2F6B3A' : '#654B38',
                borderBottom: activeTab === 'ingredients' ? '2px solid #2F6B3A' : '2px solid transparent',
                fontWeight: '800',
                fontSize: '0.95rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              Ingredients &amp; Craft
            </button>
            {labReportUrl && (
              <button
                onClick={() => setActiveTab('labreport')}
                style={{
                  padding: '0.75rem 1.25rem',
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: activeTab === 'labreport' ? '#2F6B3A' : '#654B38',
                  borderBottom: activeTab === 'labreport' ? '2px solid #2F6B3A' : '2px solid transparent',
                  fontWeight: '800',
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                Verified Lab Report
              </button>
            )}
            <button
              onClick={() => setActiveTab('reviews')}
              style={{
                padding: '0.75rem 1.25rem',
                border: 'none',
                backgroundColor: 'transparent',
                color: activeTab === 'reviews' ? '#2F6B3A' : '#654B38',
                borderBottom: activeTab === 'reviews' ? '2px solid #2F6B3A' : '2px solid transparent',
                fontWeight: '800',
                fontSize: '0.95rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              Customer Reviews ({reviewsData.totalReviews || 0})
            </button>
          </div>

          {activeTab === 'nutrition' && (
            <div style={{ backgroundColor: '#FFF9F0', padding: '1.5rem', borderRadius: '16px', border: '1px solid #DCC8AE' }}>
              {safeNutritionFacts.length > 0 ? (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: labReportUrl ? '1.5rem' : 0 }}>
                    {safeNutritionFacts.map((item, idx) => (
                      <div key={idx} style={{ borderBottom: '1px solid #DCC8AE', paddingBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.78rem', color: '#2F6B3A', textTransform: 'uppercase', fontWeight: '700', display: 'block' }}>
                          {item.label}
                        </span>
                        <span style={{ fontSize: '1rem', fontWeight: '800', color: '#32180D' }}>
                          {item.value} {item.unit}
                        </span>
                      </div>
                    ))}
                  </div>

                  {labReportUrl && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#E3EEDC', border: '1px solid #DCC8AE', padding: '0.85rem 1.25rem', borderRadius: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <ShieldCheck size={20} color="#2F6B3A" />
                        <div>
                          <div style={{ fontSize: '0.88rem', fontWeight: '800', color: '#32180D' }}>Verified Laboratory Analysis Available</div>
                          <div style={{ fontSize: '0.78rem', color: '#654B38' }}>Independently tested for purity, nutrition levels &amp; heavy metals.</div>
                        </div>
                      </div>
                      <a
                        href={labReportUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          backgroundColor: '#2F6B3A',
                          color: '#FFFFFF',
                          border: '1px solid #2F6B3A',
                          padding: '0.45rem 0.95rem',
                          borderRadius: '8px',
                          fontSize: '0.82rem',
                          fontWeight: '800',
                          textDecoration: 'none'
                        }}
                      >
                        <FileText size={15} /> View Lab Report <ExternalLink size={13} />
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <p style={{ color: '#654B38', margin: 0, lineHeight: '1.6' }}>
                    Rich in fiber, vitamins, deshi ghee goodness, and essential minerals. No added artificial additives.
                  </p>
                  {labReportUrl && (
                    <div style={{ marginTop: '1rem' }}>
                      <a
                        href={labReportUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          backgroundColor: '#2F6B3A',
                          color: '#FFFFFF',
                          border: '1px solid #2F6B3A',
                          padding: '0.45rem 0.95rem',
                          borderRadius: '8px',
                          fontSize: '0.82rem',
                          fontWeight: '800',
                          textDecoration: 'none'
                        }}
                      >
                        <FileText size={15} /> Download Verified Lab Report <ExternalLink size={13} />
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'ingredients' && (
            <div style={{ backgroundColor: '#FFF9F0', padding: '1.5rem', borderRadius: '16px', border: '1px solid #DCC8AE' }}>
              {ingredientsList.length > 0 ? (
                <div>
                  <h4 style={{ fontSize: '0.9rem', color: '#2F6B3A', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.85rem' }}>
                    Crafted With Natural Ingredients
                  </h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                    {ingredientsList.map((ing, idx) => (
                      <span
                        key={idx}
                        style={{
                          fontSize: '0.85rem',
                          fontWeight: '700',
                          color: '#32180D',
                          backgroundColor: '#FCF8F1',
                          border: '1px solid #DCC8AE',
                          padding: '0.4rem 0.85rem',
                          borderRadius: '999px'
                        }}
                      >
                        ✓ {ing}
                      </span>
                    ))}
                  </div>
                  <p style={{ color: '#654B38', fontSize: '0.85rem', margin: 0, lineHeight: '1.5' }}>
                    Handcrafted using 100% natural ingredients, organic millets, Desi Cow Ghee, and unrefined organic jaggery. No refined palm oil, no artificial preservatives, zero maida.
                  </p>
                </div>
              ) : (
                <p style={{ color: '#654B38', lineHeight: '1.6', margin: 0 }}>
                  Handcrafted using 100% natural ingredients, organic millets, Desi Cow Ghee, and unrefined organic jaggery. No refined palm oil, no artificial preservatives, zero maida.
                </p>
              )}
            </div>
          )}

          {activeTab === 'labreport' && labReportUrl && (
            <div style={{ backgroundColor: '#FFF9F0', padding: '2rem', borderRadius: '16px', border: '1px solid #DCC8AE', textAlign: 'center' }}>
              <ShieldCheck size={40} color="#2F6B3A" style={{ margin: '0 auto 1rem' }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#32180D', margin: '0 0 0.5rem 0' }}>Official Quality &amp; Nutrition Lab Report</h3>
              <p style={{ color: '#654B38', fontSize: '0.9rem', maxWidth: '500px', margin: '0 auto 1.5rem auto' }}>
                Every batch of {product.title} is certified by NABL-accredited food safety testing laboratories. Click below to inspect the complete lab report document.
              </p>
              <a
                href={labReportUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  backgroundColor: '#2F6B3A',
                  color: '#FFFFFF',
                  border: '1px solid #2F6B3A',
                  padding: '0.75rem 1.75rem',
                  borderRadius: '999px',
                  fontSize: '0.95rem',
                  fontWeight: '850',
                  textDecoration: 'none',
                  boxShadow: '0 4px 16px rgba(47, 107, 58, 0.3)'
                }}
              >
                <FileText size={18} /> View / Download Full Lab Certificate <ExternalLink size={15} />
              </a>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div style={{ backgroundColor: '#FFF9F0', padding: '2rem', borderRadius: '20px', border: '1px solid #DCC8AE' }}>
              {/* Reviews Summary Header */}
              <div style={{ display: 'flex', gap: '2.5rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid #DCC8AE' }}>
                <div style={{ textAlign: 'center', paddingRight: '2rem', borderRight: '1px solid #DCC8AE' }}>
                  <div style={{ fontSize: '3rem', fontWeight: '900', color: '#32180D', lineHeight: 1 }}>
                    {reviewsData.averageRating || '0.0'}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', margin: '0.4rem 0', color: '#2F6B3A' }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} size={16} fill={s <= Math.round(reviewsData.averageRating || 0) ? '#2F6B3A' : 'none'} color="#2F6B3A" />
                    ))}
                  </div>
                  <span style={{ fontSize: '0.8rem', color: '#806A57', fontWeight: '600' }}>
                    Based on {reviewsData.totalReviews || 0} reviews
                  </span>
                </div>

                {/* Rating Distribution Breakdown */}
                <div style={{ flex: 1, minWidth: '220px', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {[5, 4, 3, 2, 1].map((num) => {
                    const count = reviewsData.ratingDistribution?.[num] || 0;
                    const pct = reviewsData.totalReviews > 0 ? (count / reviewsData.totalReviews) * 100 : 0;
                    return (
                      <div key={num} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.8rem', color: '#654B38' }}>
                        <span style={{ width: '24px', fontWeight: '700' }}>{num}★</span>
                        <div style={{ flex: 1, height: '6px', backgroundColor: '#F1E5D4', borderRadius: '999px', overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', backgroundColor: '#2F6B3A', borderRadius: '999px', transition: 'width 0.5s ease-out' }} />
                        </div>
                        <span style={{ width: '24px', textAlign: 'right', opacity: 0.7, fontWeight: '600' }}>{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Reviews List */}
              {Array.isArray(reviewsData.reviews) && reviewsData.reviews.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {reviewsData.reviews.map((rev) => (
                    <div key={rev.id} style={{ padding: '1.25rem', backgroundColor: '#FCF8F1', borderRadius: '14px', border: '1px solid #DCC8AE' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <strong style={{ fontSize: '0.95rem', color: '#32180D' }}>{rev.reviewerName}</strong>
                          {rev.isVerifiedPurchase && (
                            <span style={{ fontSize: '0.72rem', backgroundColor: '#E3EEDC', color: '#2F6B3A', border: '1px solid #DCC8AE', padding: '0.15rem 0.5rem', borderRadius: '999px', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                              <CheckCircle2 size={11} /> Verified Purchase
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: '0.78rem', color: '#806A57' }}>
                          {new Date(rev.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>

                      <div style={{ display: 'flex', color: '#2F6B3A', marginBottom: '0.5rem' }}>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} size={14} fill={s <= rev.rating ? '#2F6B3A' : 'none'} color="#2F6B3A" />
                        ))}
                      </div>

                      {rev.comment && (
                        <p style={{ fontSize: '0.9rem', color: '#654B38', lineHeight: '1.5', margin: '0 0 0.5rem 0' }}>
                          {rev.comment}
                        </p>
                      )}

                      {/* Photo Thumbnail */}
                      {rev.reviewImageUrl && (
                        <img 
                          src={rev.reviewImageUrl} 
                          alt="Customer review photo" 
                          onClick={() => setSelectedModalImage(rev.reviewImageUrl)}
                          style={{ width: '70px', height: '70px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #DCC8AE', cursor: 'pointer', marginTop: '0.5rem' }} 
                        />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                  <Star size={36} color="#2F6B3A" style={{ margin: '0 auto 0.75rem', opacity: 0.8 }} />
                  <h4 style={{ fontSize: '1.1rem', color: '#32180D', fontWeight: '800', margin: '0 0 0.35rem 0' }}>No reviews yet</h4>
                  <p style={{ fontSize: '0.88rem', color: '#654B38', margin: 0 }}>Be the first to share your experience with this artisan millet bake!</p>
                </div>
              )}
            </div>
          )}

          {/* Photo Lightbox Modal */}
          {selectedModalImage && (
            <div 
              onClick={() => setSelectedModalImage(null)}
              style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}
            >
              <img src={selectedModalImage} alt="Review photo full" style={{ maxWidth: '90vw', maxHeight: '85vh', borderRadius: '16px', objectFit: 'contain' }} />
            </div>
          )}

          {/* Fullscreen Product Gallery Lightbox Modal */}
          {isLightboxOpen && (
            <div 
              onClick={() => setIsLightboxOpen(false)}
              style={{ 
                position: 'fixed', 
                inset: 0, 
                backgroundColor: 'rgba(10, 5, 2, 0.95)', 
                backdropFilter: 'blur(12px)', 
                WebkitBackdropFilter: 'blur(12px)', 
                zIndex: 999999, 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                padding: '1.5rem',
                userSelect: 'none'
              }}
            >
              {/* Top Bar */}
              <div 
                onClick={(e) => e.stopPropagation()} 
                style={{ width: '100%', maxWidth: '1100px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#FFFDF9' }}
              >
                <div>
                  <div style={{ fontSize: '1.1rem', fontWeight: '800', fontFamily: 'var(--font-serif)' }}>{product.title}</div>
                  <div style={{ fontSize: '0.78rem', color: '#b9cd94', fontWeight: '700' }}>
                    Image {selectedImageIndex + 1} of {images.length}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsLightboxOpen(false)}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.12)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#FFFDF9',
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Center Image View with Chevrons */}
              <div 
                onClick={(e) => e.stopPropagation()}
                style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', maxWidth: '1000px', margin: '1rem 0' }}
              >
                {images.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setSelectedImageIndex((prev) => (prev - 1 + images.length) % images.length)}
                    style={{
                      position: 'absolute',
                      left: '10px',
                      backgroundColor: 'rgba(20, 10, 5, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: '#FFFDF9',
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      zIndex: 10
                    }}
                  >
                    <ChevronLeft size={26} />
                  </button>
                )}

                <img
                  src={images[selectedImageIndex] || product.image}
                  alt={`${product.title} view ${selectedImageIndex + 1}`}
                  style={{
                    maxHeight: '72vh',
                    maxWidth: '85vw',
                    objectFit: 'contain',
                    borderRadius: '16px',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                />

                {images.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setSelectedImageIndex((prev) => (prev + 1) % images.length)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      backgroundColor: 'rgba(20, 10, 5, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: '#FFFDF9',
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      zIndex: 10
                    }}
                  >
                    <ChevronRight size={26} />
                  </button>
                )}
              </div>

              {/* Bottom Thumbnails Strip */}
              {images.length > 1 && (
                <div 
                  onClick={(e) => e.stopPropagation()} 
                  style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', padding: '0.5rem 1rem', maxWidth: '90vw' }}
                >
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedImageIndex(idx)}
                      style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '10px',
                        overflow: 'hidden',
                        padding: 0,
                        backgroundColor: 'transparent',
                        border: idx === selectedImageIndex ? '2px solid #b9cd94' : '1px solid rgba(255, 255, 255, 0.2)',
                        cursor: 'pointer',
                        opacity: idx === selectedImageIndex ? 1 : 0.6,
                        flexShrink: 0
                      }}
                    >
                      <img src={img} alt={`Thumb ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <div>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.6rem', fontWeight: '800', color: '#32180D', marginBottom: '1.5rem' }}>
              You May Also Like
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
              {relatedProducts.map((p) => (
                <ProductCard key={p._id || p.slug} product={p} />
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
