import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingBag, Star, Heart, ChevronRight, ChevronLeft, CheckCircle2, XCircle, ShieldCheck, Truck, Sparkles, AlertTriangle, Plus, Minus, Info } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useDelivery } from '../context/DeliveryContext';
import api from '../api/axios';
import { initialProducts } from '../data/seedData';
import ProductCard from '../components/ProductCard';
import PriceDisplay from '../components/PriceDisplay';
import { LOW_STOCK_THRESHOLD } from '../config/constants';

export default function ProductDetail() {
  const { slug, id } = useParams();
  const identifier = slug || id;

  const { addToCart, showToast } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { deliveryInfo, checkPincode, clearDeliveryInfo } = useDelivery();

  const [product, setProduct] = useState(null);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [btnText, setBtnText] = useState('Add to Cart');
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [activeTab, setActiveTab] = useState('nutrition');
  
  const [inputPincode, setInputPincode] = useState('');
  const [checkingPincode, setCheckingPincode] = useState(false);
  const [pincodeError, setPincodeError] = useState('');

  const handleCheckPincode = async () => {
    const clean = inputPincode.trim();
    if (!clean || clean.length !== 6 || !/^\d{6}$/.test(clean)) {
      setPincodeError('Please enter a valid 6-digit PIN code');
      return;
    }
    setPincodeError('');
    setCheckingPincode(true);
    await checkPincode(clean);
    setCheckingPincode(false);
  };

  useEffect(() => {
    if (identifier) {
      fetchProduct();
    }
  }, [identifier]);

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
      }
    } catch (err) {
      const found = initialProducts.find((p) => p.slug === identifier || p._id === identifier);
      if (found) {
        setProduct(found);
        setSelectedImageIndex(0);
        const allFiltered = initialProducts.filter((p) => p.slug !== identifier && p._id !== identifier);
        const sameCategory = allFiltered.filter(p => p.category === found.category);
        setRelatedProducts(sameCategory.length > 0 ? sameCategory : allFiltered);
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

  if (loading) {
    return (
      <div style={{ minHeight: '65vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#140A05' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', color: '#FFFDF9' }}>
          <div className="animate-spin" style={{ width: '40px', height: '40px', border: '3px solid rgba(185, 205, 148, 0.2)', borderTopColor: '#b9cd94', borderRadius: '50%' }} />
          <span style={{ fontSize: '0.95rem', fontWeight: '600', letterSpacing: '0.05em' }}>Loading Product Details...</span>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div style={{ minHeight: '65vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#140A05', color: '#FFFDF9', textAlign: 'center', padding: '2rem' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', marginBottom: '1rem' }}>Product Not Found</h2>
        <p style={{ color: '#F5EBDD', marginBottom: '1.5rem' }}>The product you are looking for does not exist or has been removed.</p>
        <Link to="/shop" className="btn-primary" style={{ padding: '0.75rem 1.5rem', borderRadius: '999px', backgroundColor: '#244f21', color: '#FFF', textDecoration: 'none' }}>
          Back to Shop Catalog
        </Link>
      </div>
    );
  }

  // Deduplicate gallery images so single images are never rendered twice
  const rawImages = [product.image, product.secondaryImage].filter((img) => Boolean(img) && typeof img === 'string' && img.trim() !== '');
  const images = Array.from(new Set(rawImages));

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

  const wishlisted = isInWishlist(product._id || product.slug);

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

  const handleAddToCart = async () => {
    if (currentStock <= 0) {
      if (showToast) showToast('This item is currently out of stock.');
      return;
    }

    setBtnText('Adding...');
    try {
      await addToCart(product, selectedVariant, quantity);
      setBtnText('✓ Added to Cart');
      setTimeout(() => setBtnText('Add to Cart'), 2000);
    } catch (e) {
      setBtnText('Unable to Add');
      setTimeout(() => setBtnText('Add to Cart'), 2000);
    }
  };

  // Safe nutrition facts entries (skipping variant_stocks and object values to fix React Error #31)
  const safeNutritionFacts = product.nutritionFacts
    ? Object.entries(product.nutritionFacts).filter(
        ([k, v]) => k !== 'variant_stocks' && k !== 'pieces' && v !== null && v !== undefined && v !== '' && typeof v !== 'object'
      )
    : [];

  return (
    <div style={{ backgroundColor: '#140A05', color: '#FFFDF9', minHeight: '100vh', paddingTop: '1rem', paddingBottom: '5rem' }}>
      
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
            color: '#F5EBDD', 
            marginBottom: '2rem',
            flexWrap: 'wrap'
          }}
        >
          <Link to="/" style={{ color: '#F5EBDD', textDecoration: 'none', transition: 'color 0.2s' }} onMouseOver={(e) => e.target.style.color = '#b9cd94'} onMouseOut={(e) => e.target.style.color = '#F5EBDD'}>
            Home
          </Link>
          <ChevronRight size={14} color="rgba(245, 235, 221, 0.4)" />
          <Link to="/shop" style={{ color: '#F5EBDD', textDecoration: 'none', transition: 'color 0.2s' }} onMouseOver={(e) => e.target.style.color = '#b9cd94'} onMouseOut={(e) => e.target.style.color = '#F5EBDD'}>
            Shop
          </Link>
          <ChevronRight size={14} color="rgba(245, 235, 221, 0.4)" />
          <span style={{ color: '#b9cd94', fontWeight: '700' }}>{product.title}</span>
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
              style={{ 
                position: 'relative', 
                width: '100%', 
                paddingTop: '100%', // 1:1 Aspect Ratio Square Box
                borderRadius: '20px', 
                overflow: 'hidden', 
                backgroundColor: 'rgba(20, 10, 5, 0.4)', 
                border: '1px solid rgba(255, 255, 255, 0.12)',
                boxShadow: '0 16px 40px rgba(0,0,0,0.35)'
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
                  transition: 'transform 0.4s ease'
                }} 
              />
              {/* Discount Ribbon Badge */}
              {hasDiscount && (
                <div 
                  style={{ 
                    position: 'absolute', 
                    top: '16px', 
                    left: '16px', 
                    backgroundColor: '#244f21', 
                    color: '#FFFDF9', 
                    border: '1px solid #b9cd94',
                    padding: '0.35rem 0.85rem', 
                    borderRadius: '999px', 
                    fontSize: '0.75rem', 
                    fontWeight: '800',
                    letterSpacing: '0.05em',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                  }}
                >
                  SAVE {discountPercent}%
                </div>
              )}
            </div>

            {/* Thumbnails Row — ONLY RENDERED IF THERE ARE MULTIPLE UNIQUE IMAGES */}
            {images.length > 1 && (
              <div style={{ display: 'flex', gap: '0.85rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
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
                        backgroundColor: 'transparent',
                        border: isActive ? '2px solid #b9cd94' : '1px solid rgba(255, 255, 255, 0.18)',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: isActive ? '0 0 12px rgba(185, 205, 148, 0.4)' : 'none',
                        flexShrink: 0
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
                  color: '#b9cd94', 
                  backgroundColor: 'rgba(36, 79, 33, 0.4)', 
                  padding: '0.25rem 0.75rem', 
                  borderRadius: '999px',
                  border: '1px solid rgba(185, 205, 148, 0.3)'
                }}
              >
                {product.category || 'Milasty Bakes'}
              </span>

              {/* Product Badges */}
              {Array.isArray(product.badges) && product.badges.map((b, i) => (
                <span 
                  key={i} 
                  style={{ 
                    fontSize: '0.72rem', 
                    fontWeight: '700', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.05em', 
                    color: '#F5EBDD', 
                    backgroundColor: 'rgba(255, 255, 255, 0.08)', 
                    padding: '0.25rem 0.75rem', 
                    borderRadius: '999px',
                    border: '1px solid rgba(255, 255, 255, 0.12)'
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
                color: '#FFFDF9', 
                margin: 0, 
                lineHeight: '1.2' 
              }}
            >
              {product.title}
            </h1>

            {/* Subtitle / Tagline (Hidden if empty) */}
            {product.subtitle && product.subtitle.trim() !== '' && (
              <p style={{ fontSize: '1rem', color: '#F5EBDD', margin: 0, fontWeight: '500', opacity: 0.9 }}>
                {product.subtitle}
              </p>
            )}

            {/* Rating / Review Info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ display: 'flex', color: '#b9cd94' }}>
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={15} fill="#b9cd94" color="#b9cd94" />
                ))}
              </div>
              <span style={{ fontSize: '0.88rem', fontWeight: '750', color: '#FFFDF9' }}>
                {product.rating || 5.0}
              </span>
              <span style={{ fontSize: '0.82rem', color: '#F5EBDD', opacity: 0.8 }}>
                {product.reviewCount ? `(${product.reviewCount} Reviews)` : '(No reviews yet)'}
              </span>
            </div>

            {/* Description */}
            {product.description && (
              <p style={{ fontSize: '0.95rem', color: '#F5EBDD', lineHeight: '1.6', margin: 0, opacity: 0.95 }}>
                {product.description}
              </p>
            )}

            {/* Price Section */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.85rem', marginTop: '0.5rem', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '2rem', fontWeight: '900', color: '#FFFDF9' }}>
                ₹{currentPrice}
              </span>
              {hasDiscount && (
                <span style={{ fontSize: '1.2rem', color: 'rgba(245, 235, 221, 0.5)', textDecoration: 'line-through', fontWeight: '600' }}>
                  ₹{currentOriginalPrice}
                </span>
              )}
            </div>

            {/* Variant Pack Size Selector */}
            {hasVariants && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#b9cd94' }}>
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
                          border: isSelected ? '2px solid #b9cd94' : '1px solid rgba(255, 255, 255, 0.18)',
                          backgroundColor: isSelected ? 'rgba(36, 79, 33, 0.45)' : 'rgba(20, 10, 5, 0.3)',
                          color: isSelected ? '#FFFDF9' : '#F5EBDD',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '0.15rem',
                          transition: 'all 0.2s',
                          boxShadow: isSelected ? '0 4px 14px rgba(36, 79, 33, 0.4)' : 'none',
                          opacity: isVOut ? 0.6 : 1
                        }}
                      >
                        <span style={{ fontSize: '0.9rem', fontWeight: '800' }}>{v.weight || v.name}</span>
                        <span style={{ fontSize: '0.78rem', color: isSelected ? '#b9cd94' : '#F5EBDD', fontWeight: '700' }}>₹{v.price}</span>
                        {isVOut && (
                          <span style={{ fontSize: '0.62rem', color: '#ff6b6b', fontWeight: '800', textTransform: 'uppercase' }}>Out of Stock</span>
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
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', backgroundColor: 'rgba(220, 38, 38, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '0.45rem 0.85rem', borderRadius: '8px', fontSize: '0.82rem', fontWeight: '800' }}>
                  <AlertTriangle size={15} />
                  <span>Out of Stock</span>
                </div>
              ) : currentStock <= 5 ? (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', backgroundColor: 'rgba(217, 119, 6, 0.18)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.35)', padding: '0.45rem 0.85rem', borderRadius: '8px', fontSize: '0.82rem', fontWeight: '800' }}>
                  <Sparkles size={15} />
                  <span>⚡ Only {currentStock} packs left — order soon!</span>
                </div>
              ) : currentStock <= LOW_STOCK_THRESHOLD ? (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', backgroundColor: 'rgba(217, 119, 6, 0.12)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.25)', padding: '0.45rem 0.85rem', borderRadius: '8px', fontSize: '0.82rem', fontWeight: '750' }}>
                  <Sparkles size={15} />
                  <span>⚡ Only {currentStock} packs left</span>
                </div>
              ) : (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', color: '#b9cd94', fontSize: '0.85rem', fontWeight: '700' }}>
                  <CheckCircle2 size={16} />
                  <span>In Stock ({currentStock} available)</span>
                </div>
              )}
            </div>

            {/* Quantity Selector & Add to Cart Action Row */}
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '1rem', flexWrap: 'wrap' }}>
              
              {/* Quantity Counter */}
              <div 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  backgroundColor: 'rgba(255, 255, 255, 0.08)', 
                  border: '1px solid rgba(255, 255, 255, 0.15)', 
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
                    color: quantity <= 1 || currentStock <= 0 ? 'rgba(255, 255, 255, 0.25)' : '#FFFDF9',
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
                <span style={{ padding: '0 0.85rem', fontWeight: '800', fontSize: '0.95rem', minWidth: '32px', textAlign: 'center' }}>
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={handleQuantityIncrease}
                  disabled={quantity >= currentStock || currentStock <= 0}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: quantity >= currentStock || currentStock <= 0 ? 'rgba(255, 255, 255, 0.25)' : '#FFFDF9',
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
                  backgroundColor: currentStock <= 0 ? 'rgba(255, 255, 255, 0.1)' : '#244f21',
                  color: currentStock <= 0 ? 'rgba(255, 255, 255, 0.4)' : '#FFFFFF',
                  border: currentStock <= 0 ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid #b9cd94',
                  fontSize: '0.95rem',
                  fontWeight: '850',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  cursor: currentStock <= 0 ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: currentStock > 0 ? '0 6px 20px rgba(36, 79, 33, 0.4)' : 'none'
                }}
              >
                <ShoppingBag size={18} color={currentStock > 0 ? '#b9cd94' : 'rgba(255, 255, 255, 0.4)'} />
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
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: wishlisted ? '#b9cd94' : '#FFFDF9',
                  transition: 'all 0.2s'
                }}
              >
                <Heart size={20} fill={wishlisted ? '#b9cd94' : 'none'} color={wishlisted ? '#b9cd94' : '#FFFDF9'} />
              </button>
            </div>

            {/* Pincode Serviceability Check Box */}
            <div 
              style={{ 
                marginTop: '1.25rem', 
                padding: '1.1rem', 
                borderRadius: '14px', 
                backgroundColor: 'rgba(255, 255, 255, 0.04)', 
                border: '1px solid rgba(255, 255, 255, 0.1)' 
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.85rem', fontWeight: '800', color: '#b9cd94' }}>
                  <Truck size={17} />
                  <span>Check Delivery Availability</span>
                </div>
                {deliveryInfo && (
                  <button 
                    type="button"
                    onClick={() => clearDeliveryInfo()} 
                    style={{ background: 'none', border: 'none', color: '#b9cd94', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Change PIN
                  </button>
                )}
              </div>

              {!deliveryInfo || !deliveryInfo.checked ? (
                <div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="text"
                      maxLength={6}
                      value={inputPincode}
                      onChange={(e) => setInputPincode(e.target.value.replace(/\D/g, ''))}
                      placeholder="Enter 6-digit Pincode"
                      onKeyDown={(e) => { if (e.key === 'Enter') handleCheckPincode(); }}
                      style={{
                        flex: 1,
                        padding: '0.55rem 0.85rem',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(0, 0, 0, 0.3)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        color: '#FFFDF9',
                        fontSize: '0.88rem',
                        fontFamily: 'monospace',
                        fontWeight: '700'
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleCheckPincode}
                      disabled={checkingPincode}
                      style={{
                        padding: '0.55rem 1.1rem',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(36, 79, 33, 0.8)',
                        border: '1px solid #b9cd94',
                        color: '#FFFDF9',
                        fontSize: '0.82rem',
                        fontWeight: '800',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem'
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
                <div>
                  {(deliveryInfo.available ?? deliveryInfo.isDeliverable) ? (
                    <div style={{ backgroundColor: 'rgba(34, 197, 94, 0.12)', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: '10px', padding: '0.85rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#22c55e', fontWeight: '800', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                        <CheckCircle2 size={16} />
                        <span>Delivery Available to {deliveryInfo.pincode}</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.78rem', color: '#F5EBDD', paddingLeft: '1.4rem' }}>
                        <div>Location: <strong style={{ color: '#FFFDF9' }}>{deliveryInfo.city}, {deliveryInfo.state}</strong></div>
                        <div>Delivery Fee: <strong style={{ color: Number(deliveryInfo.deliveryCharge) === 0 ? '#22c55e' : '#b9cd94' }}>
                          {Number(deliveryInfo.deliveryCharge) === 0 ? 'FREE DELIVERY' : `₹${deliveryInfo.deliveryCharge}`}
                        </strong></div>
                        <div>Estimated Delivery: <strong style={{ color: '#FFFDF9' }}>{deliveryInfo.estimatedDays || '3-5'} business days</strong></div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '10px', padding: '0.85rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#ef4444', fontWeight: '800', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                        <XCircle size={16} />
                        <span>Delivery Not Available</span>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.78rem', color: '#F5EBDD', paddingLeft: '1.4rem' }}>
                        {deliveryInfo.message || `We do not currently deliver to PIN code ${deliveryInfo.pincode}.`}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Accordions / Information Tabs Section */}
        <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.12)', paddingTop: '3rem', marginBottom: '4rem' }}>
          <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.12)', marginBottom: '1.5rem', overflowX: 'auto' }}>
            <button
              onClick={() => setActiveTab('nutrition')}
              style={{
                padding: '0.75rem 1.25rem',
                border: 'none',
                backgroundColor: 'transparent',
                color: activeTab === 'nutrition' ? '#b9cd94' : '#F5EBDD',
                borderBottom: activeTab === 'nutrition' ? '2px solid #b9cd94' : '2px solid transparent',
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
                color: activeTab === 'ingredients' ? '#b9cd94' : '#F5EBDD',
                borderBottom: activeTab === 'ingredients' ? '2px solid #b9cd94' : '2px solid transparent',
                fontWeight: '800',
                fontSize: '0.95rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              Ingredients & Craft
            </button>
          </div>

          {/* Tab 1: Accredited Nutritional Facts Table */}
          {activeTab === 'nutrition' && (
            <div style={{ maxWidth: '680px' }}>
              {safeNutritionFacts.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                  <tbody>
                    {safeNutritionFacts.map(([k, v], idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', backgroundColor: idx % 2 === 0 ? 'rgba(36, 79, 33, 0.15)' : 'transparent' }}>
                        <td style={{ padding: '0.75rem 0.85rem', fontWeight: '700', color: '#F5EBDD', textTransform: 'capitalize' }}>
                          {k.replace(/([A-Z])/g, ' $1')}
                        </td>
                        <td style={{ padding: '0.75rem 0.85rem', fontWeight: '900', textAlign: 'right', color: '#b9cd94' }}>
                          {String(v)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p style={{ color: '#F5EBDD', opacity: 0.8 }}>No nutritional information listed for this product.</p>
              )}
            </div>
          )}

          {/* Tab 2: Ingredients */}
          {activeTab === 'ingredients' && (
            <div style={{ maxWidth: '680px', color: '#F5EBDD', lineHeight: '1.7' }}>
              {Array.isArray(product.ingredients) && product.ingredients.length > 0 ? (
                <ul style={{ paddingLeft: '1.25rem', margin: 0 }}>
                  {product.ingredients.map((ing, i) => (
                    <li key={i} style={{ marginBottom: '0.35rem' }}>{ing}</li>
                  ))}
                </ul>
              ) : (
                <p>{product.ingredients || 'Crafted with premium natural ingredients and zero artificial preservatives.'}</p>
              )}
            </div>
          )}
        </div>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.12)', paddingTop: '3rem' }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', color: '#FFFDF9', fontWeight: '800', marginBottom: '1.5rem' }}>
              You May Also Like
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.5rem' }}>
              {relatedProducts.map((relProduct) => (
                <ProductCard key={relProduct._id || relProduct.id || relProduct.slug} product={relProduct} />
              ))}
          