import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingBag, Star, ShieldCheck, Heart, ChevronRight, ChevronLeft, CheckCircle, Plus, Minus } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import api from '../api/axios';
import { initialProducts } from '../data/seedData';
import ProductCard from '../components/ProductCard';
import PriceDisplay from '../components/PriceDisplay';

export default function ShopProductDetail() {
  const { id } = useParams();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const relatedRef = useRef(null);

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

  const [product, setProduct] = useState(null);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState('');
  const [loading, setLoading] = useState(true);
  const [btnText, setBtnText] = useState('Add to Cart');
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  const [pincode, setPincode] = useState('');
  const [deliveryMsg, setDeliveryMsg] = useState('');

  const checkDelivery = () => {
    if (pincode.length === 6) {
      setDeliveryMsg('⚡ Delivery Available: Estimated in 2–4 Business Days');
    } else {
      setDeliveryMsg('Please enter a valid 6-digit Pincode');
    }
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [isRelatedHovered, setIsRelatedHovered] = useState(false);
  const [relatedIndex, setRelatedIndex] = useState(0);
  const [relatedTouchStartX, setRelatedTouchStartX] = useState(null);
  const [relatedTouchStartY, setRelatedTouchStartY] = useState(null);

  // Auto-scroll Related Products ("You May Also Like") mobile 2-card slider (every 2.0s with hover/touch pause)
  useEffect(() => {
    if (!isMobile || isRelatedHovered || relatedProducts.length <= 2) return;
    const maxIdx = Math.max(0, relatedProducts.length - 2);
    const timer = setInterval(() => {
      setRelatedIndex((prev) => (prev >= maxIdx ? 0 : prev + 1));
    }, 2000);
    return () => clearInterval(timer);
  }, [isMobile, isRelatedHovered, relatedProducts.length]);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/products/${id}`);
      if (res.data) {
        setProduct(res.data);
        setSelectedImage(res.data.image);
        fetchRelated(res.data.category);
      }
    } catch (err) {
      const found = initialProducts.find((p) => p.slug === id || p._id === id);
      if (found) {
        setProduct(found);
        setSelectedImage(found.image);
        const allFiltered = initialProducts.filter((p) => p.slug !== id && p._id !== id);
        const sameCategory = allFiltered.filter(p => p.category === found.category);
        const otherCategory = allFiltered.filter(p => p.category !== found.category);
        setRelatedProducts(sameCategory.length > 0 ? [...sameCategory, ...otherCategory] : allFiltered);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchRelated = async (category) => {
    try {
      const res = await api.get('/products?limit=100');
      if (res.data && res.data.products && res.data.products.length > 0) {
        const allFiltered = res.data.products.filter((p) => p.slug !== id && p._id !== id);
        const sameCategory = allFiltered.filter(p => p.category === category);
        const otherCategory = allFiltered.filter(p => p.category !== category);
        setRelatedProducts(sameCategory.length > 0 ? [...sameCategory, ...otherCategory] : allFiltered);
      } else {
        const allFiltered = initialProducts.filter((p) => p.slug !== id && p._id !== id);
        const sameCategory = allFiltered.filter(p => p.category === category);
        const otherCategory = allFiltered.filter(p => p.category !== category);
        setRelatedProducts(sameCategory.length > 0 ? [...sameCategory, ...otherCategory] : allFiltered);
      }
    } catch (e) {
      const allFiltered = initialProducts.filter((p) => p.slug !== id && p._id !== id);
      const sameCategory = allFiltered.filter(p => p.category === category);
      const otherCategory = allFiltered.filter(p => p.category !== category);
      setRelatedProducts(sameCategory.length > 0 ? [...sameCategory, ...otherCategory] : allFiltered);
    }
  };

  if (loading) {
    return (
      <div style={{
        backgroundImage: 'url(/images/ritiual_background_image.jpeg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        minHeight: '100vh',
        padding: '6rem 0',
        textAlign: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative'
      }}>
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'linear-gradient(135deg, rgba(15, 8, 4, 0.42) 0%, rgba(28, 14, 9, 0.32) 100%)',
          zIndex: 0,
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'relative',
          zIndex: 1,
          backgroundColor: 'rgba(20, 10, 5, 0.65)',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
          padding: '3rem 2.5rem',
          borderRadius: '24px',
          border: '1px solid rgba(245, 220, 180, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.85rem'
        }}>
          <ShoppingBag size={36} color="#b9cd94" className="animate-float" />
          <p style={{ color: '#FFFDF9', fontSize: '1rem', fontWeight: '800', margin: 0 }}>Gathering product details...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div style={{
        backgroundImage: 'url(/images/ritiual_background_image.jpeg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        minHeight: '100vh',
        padding: '6rem 0',
        textAlign: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative'
      }}>
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'linear-gradient(135deg, rgba(15, 8, 4, 0.42) 0%, rgba(28, 14, 9, 0.32) 100%)',
          zIndex: 0,
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'relative',
          zIndex: 1,
          backgroundColor: 'rgba(20, 10, 5, 0.65)',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
          maxWidth: '440px',
          margin: '0 auto',
          padding: '3rem 2rem',
          borderRadius: '24px',
          border: '1px solid rgba(245, 220, 180, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.25rem'
        }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', color: '#FFFDF9', fontSize: '1.8rem', fontWeight: '800', margin: 0 }}>Product Not Found</h2>
          <Link to="/shop" style={{ padding: '0.85rem 2.25rem', textDecoration: 'none', borderRadius: '999px', backgroundColor: '#244f21', color: '#FFFFFF', fontWeight: '800', fontSize: '0.9rem', border: '1px solid #b9cd94' }}>
            Back to Shop
          </Link>
        </div>
      </div>
    );
  }

  const selectedVariant = product?.variants?.[selectedVariantIndex] || product?.variants?.[0] || {};
  const unitPrice = selectedVariant?.price || product?.finalPrice || product?.price || 0;
  const wishlisted = isInWishlist(product?._id || product?.slug);
  const currentStock = selectedVariant?.stock || product?.stock || 50;

  const handleAddToCart = async () => {
    setBtnText('Adding...');
    try {
      await addToCart(product, selectedVariant, quantity);
      setBtnText('✓ Added');
      setTimeout(() => setBtnText('Add to Cart'), 1500);
    } catch (e) {
      setBtnText('Unable to add');
      setTimeout(() => setBtnText('Add to Cart'), 2000);
    }
  };

  return (
    <div style={{
      backgroundImage: 'url(/images/ritiual_background_image.jpeg)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      minHeight: '100vh',
      padding: isMobile ? '1.25rem 0 3rem' : '2.5rem 0 5rem',
      position: 'relative'
    }}>
      {/* Dark overlay for readability matching Shop */}
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'linear-gradient(135deg, rgba(15, 8, 4, 0.42) 0%, rgba(28, 14, 9, 0.32) 100%)',
        zIndex: 0,
        pointerEvents: 'none',
      }} />

      <div className="container" style={{ maxWidth: '1150px', position: 'relative', zIndex: 1, padding: isMobile ? '0 0.85rem' : '0 1.5rem' }}>
        
        {/* Breadcrumb */}
        <div style={{
          fontSize: isMobile ? '0.72rem' : '0.78rem',
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          color: '#F5EBDD',
          marginBottom: isMobile ? '1.25rem' : '2rem',
          backgroundColor: 'rgba(20, 10, 5, 0.65)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          padding: isMobile ? '0.45rem 0.95rem' : '0.6rem 1.2rem',
          borderRadius: '999px',
          display: 'inline-flex',
          alignItems: 'center',
          border: '1px solid rgba(185, 205, 148, 0.35)',
          maxWidth: '100%',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          textOverflow: 'ellipsis'
        }}>
          <Link to="/" style={{ color: '#F5EBDD', textDecoration: 'none' }}>Home</Link>
          <span style={{ margin: '0 0.4rem', color: '#b9cd94' }}>/</span>
          <Link to="/shop" style={{ color: '#F5EBDD', textDecoration: 'none' }}>Shop</Link>
          <span style={{ margin: '0 0.4rem', color: '#b9cd94' }}>/</span>
          <span style={{ color: '#b9cd94', fontWeight: '800', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.title}</span>
        </div>

        {/* Main Details Panel */}
        <div
          className="glass-card"
          style={{
            backgroundColor: 'rgba(20, 10, 5, 0.55)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: isMobile ? '20px' : '28px',
            border: '1px solid rgba(245, 220, 180, 0.18)',
            boxShadow: '0 16px 48px rgba(0,0,0,0.4)',
            padding: isMobile ? '1.25rem 1rem' : '2.5rem',
            marginBottom: isMobile ? '2rem' : '3.5rem'
          }}
        >
          <div 
            className="product-detail-layout"
            style={{ 
              display: 'grid', 
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', 
              gap: isMobile ? '1.5rem' : '3.5rem', 
              alignItems: 'start'
            }}
          >
            {/* Left Column: Image gallery */}
            <div>
              <div 
                style={{ 
                  borderRadius: isMobile ? '16px' : '20px', 
                  overflow: 'hidden', 
                  backgroundColor: 'rgba(20, 10, 5, 0.65)', 
                  border: '1.5px solid rgba(245, 220, 180, 0.22)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                  position: 'relative'
                }}
              >
                <img 
                  src={selectedImage} 
                  alt={product.title} 
                  className="product-main-image"
                  style={{ width: '100%', height: isMobile ? '260px' : '440px', objectFit: 'cover', display: 'block', transition: 'transform 0.4s ease' }} 
                  onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                />
              </div>
              
              {/* Gallery Thumbnails */}
              <div style={{ display: 'flex', gap: isMobile ? '0.5rem' : '0.75rem', marginTop: isMobile ? '0.75rem' : '1rem' }}>
                <img
                  src={product.image}
                  alt="Thumbnail primary"
                  onClick={() => setSelectedImage(product.image)}
                  style={{
                    width: isMobile ? '58px' : '74px',
                    height: isMobile ? '58px' : '74px',
                    objectFit: 'cover',
                    borderRadius: isMobile ? '10px' : '12px',
                    cursor: 'pointer',
                    border: selectedImage === product.image ? '2.5px solid #b9cd94' : '1.5px solid rgba(245, 220, 180, 0.25)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                  }}
                />
                {product.secondaryImage && (
                  <img
                    src={product.secondaryImage}
                    alt="Thumbnail secondary"
                    onClick={() => setSelectedImage(product.secondaryImage)}
                    style={{
                      width: isMobile ? '58px' : '74px',
                      height: isMobile ? '58px' : '74px',
                      objectFit: 'cover',
                      borderRadius: isMobile ? '10px' : '12px',
                      cursor: 'pointer',
                      border: selectedImage === product.secondaryImage ? '2.5px solid #b9cd94' : '1.5px solid rgba(245, 220, 180, 0.25)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                    }}
                  />
                )}
              </div>
            </div>

            {/* Right Column: Details & Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '0.85rem' : '1.2rem' }}>
              
              {/* Badges / Stock */}
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                {product.badges?.slice(0, isMobile ? 1 : 2).map((badge, idx) => (
                  <span 
                    key={idx} 
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: '800',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      color: '#b9cd94',
                      backgroundColor: 'rgba(36, 79, 33, 0.85)',
                      border: '1px solid rgba(185, 205, 148, 0.4)',
                      padding: '0.25rem 0.65rem',
                      borderRadius: '999px',
                    }}
                  >
                    {badge}
                  </span>
                ))}
                <span 
                  style={{ 
                    fontSize: '0.68rem',
                    fontWeight: '800',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    backgroundColor: currentStock > 5 ? 'rgba(36, 79, 33, 0.30)' : 'rgba(184, 50, 30, 0.30)', 
                    color: currentStock > 5 ? '#b9cd94' : '#ff9e88',
                    border: currentStock > 5 ? '1px solid rgba(185, 205, 148, 0.4)' : '1px solid rgba(184, 50, 30, 0.4)',
                    padding: '0.25rem 0.65rem',
                    borderRadius: '999px'
                  }}
                >
                  {currentStock > 5 ? 'In Stock' : 'Low Stock'}
                </span>
              </div>

              {/* Title & Description */}
              <div>
                <h1 style={{ fontSize: isMobile ? '1.45rem' : '2.2rem', fontFamily: 'var(--font-serif)', color: '#FFFDF9', fontWeight: '800', margin: '0 0 0.3rem 0', lineHeight: '1.2' }}>{product.title}</h1>
                <p style={{ fontSize: isMobile ? '0.88rem' : '1rem', color: '#F5EBDD', lineHeight: '1.45', margin: 0, fontWeight: '500' }}>
                  {product.subtitle || product.description}
                </p>
              </div>

              {/* Ratings & reviews */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: isMobile ? '0.78rem' : '0.85rem', color: '#F5EBDD', fontWeight: '600' }}>
                  <div style={{ display: 'flex', color: '#b9cd94' }}>
                    <Star size={14} fill="#b9cd94" color="#b9cd94" />
                  </div>
                  <span style={{ color: '#FFFDF9', fontWeight: '800' }}>{product.rating}</span>
                  <span style={{ color: '#F5EBDD' }}>({product.reviewCount || 24} reviews)</span>
                </div>
                {/* Stock Scarcity Signal */}
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.2rem 0.55rem', borderRadius: '6px', backgroundColor: 'rgba(234, 179, 8, 0.15)', border: '1px solid rgba(234, 179, 8, 0.4)', color: '#FACC15', fontSize: '0.74rem', fontWeight: '800' }}>
                  <span>⚡ Limited Batch: Only {currentStock || 8} left!</span>
                </div>
              </div>

              {/* Price section */}
              <PriceDisplay 
                price={unitPrice} 
                originalPrice={selectedVariant.originalPrice} 
                size="large" 
              />

              {/* Pack Size Selectors */}
              {product.variants && product.variants.length > 1 && (
                <div style={{ padding: '0.1rem 0' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: '800', color: '#FFFDF9', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '0.4rem' }}>Select Pack Size</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {product.variants.map((v, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedVariantIndex(idx)}
                        style={{
                          padding: isMobile ? '0.5rem 0.85rem' : '0.65rem 1.15rem',
                          borderRadius: '12px',
                          fontWeight: '800',
                          fontSize: isMobile ? '0.78rem' : '0.85rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          backgroundColor: selectedVariantIndex === idx ? '#244f21' : 'rgba(20, 10, 5, 0.65)',
                          color: selectedVariantIndex === idx ? '#FFFFFF' : '#F5EBDD',
                          border: selectedVariantIndex === idx ? '1.5px solid #b9cd94' : '1.5px solid rgba(185, 205, 148, 0.35)',
                          boxShadow: selectedVariantIndex === idx ? '0 4px 14px rgba(36, 79, 33, 0.35)' : 'none',
                        }}
                      >
                        {v.name} ({v.weight}) • ₹{v.price}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity Selector & Main Buttons */}
              <div style={{ display: 'flex', gap: isMobile ? '0.65rem' : '1rem', alignItems: 'center', flexWrap: 'wrap', paddingTop: '0.2rem' }}>
                {/* Qty count */}
                <div style={{ display: 'inline-flex', alignItems: 'center', border: '1.5px solid rgba(185, 205, 148, 0.35)', borderRadius: '999px', backgroundColor: 'rgba(20, 10, 5, 0.65)', padding: isMobile ? '0.25rem 0.55rem' : '0.35rem 0.75rem' }}>
                  <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} style={{ padding: '0.2rem 0.45rem', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#FFFDF9' }}><Minus size={14} /></button>
                  <span style={{ padding: '0 0.65rem', fontWeight: '900', color: '#FFFDF9', fontSize: isMobile ? '0.88rem' : '0.95rem' }}>{quantity}</span>
                  <button onClick={() => setQuantity((q) => Math.min(currentStock, q + 1))} style={{ padding: '0.2rem 0.45rem', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#FFFDF9' }}><Plus size={14} /></button>
                </div>

                {/* Add to cart */}
                <button
                  onClick={handleAddToCart}
                  style={{
                    padding: isMobile ? '0.75rem 1.4rem' : '0.9rem 2.25rem',
                    fontSize: isMobile ? '0.85rem' : '0.92rem',
                    backgroundColor: '#244f21',
                    color: '#FFFFFF',
                    border: '1px solid #b9cd94',
                    borderRadius: '999px',
                    fontWeight: '800',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(36, 79, 33, 0.35)',
                    flexGrow: isMobile ? 1 : 0
                  }}
                >
                  <ShoppingBag size={16} color="#FFFFFF" />
                  <span>{btnText}</span>
                </button>

                {/* Wishlist toggle */}
                <button
                  onClick={() => toggleWishlist(product)}
                  style={{
                    width: isMobile ? '40px' : '46px',
                    height: isMobile ? '40px' : '46px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(20, 10, 5, 0.65)',
                    border: '1.5px solid rgba(185, 205, 148, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: wishlisted ? '#b9cd94' : '#F5EBDD',
                    transition: 'all 0.2s',
                    flexShrink: 0
                  }}
                  title="Add to Wishlist"
                >
                  <Heart size={18} fill={wishlisted ? '#b9cd94' : 'none'} color={wishlisted ? '#b9cd94' : '#F5EBDD'} />
                </button>
              </div>

              {/* Pincode Delivery Checker */}
              <div style={{ marginTop: '0.4rem', paddingTop: '0.65rem', borderTop: '1px solid rgba(255, 255, 255, 0.12)' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: '800', color: '#FFFDF9', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.35rem' }}>
                  Delivery Availability
                </span>
                <div style={{ display: 'flex', gap: '0.5rem', maxWidth: '320px' }}>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="Enter 6-digit Pincode..."
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                    style={{
                      padding: '0.4rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.22)',
                      backgroundColor: 'rgba(20, 10, 5, 0.65)',
                      color: '#FFFDF9',
                      fontSize: '0.78rem',
                      flexGrow: 1
                    }}
                  />
                  <button
                    onClick={checkDelivery}
                    style={{
                      padding: '0.4rem 0.85rem',
                      borderRadius: '8px',
                      backgroundColor: '#244f21',
                      border: '1px solid #b9cd94',
                      color: '#FFFDF9',
                      fontSize: '0.76rem',
                      fontWeight: '800',
                      cursor: 'pointer'
                    }}
                  >
                    Check
                  </button>
                </div>
                {deliveryMsg && (
                  <div style={{ fontSize: '0.74rem', color: deliveryMsg.includes('⚡') ? '#b9cd94' : '#f87171', fontWeight: '700', marginTop: '0.35rem' }}>
                    {deliveryMsg}
                  </div>
                )}
              </div>

              {/* Custom Brand Trust bullet strip */}
              <div style={{ marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.45rem', borderTop: '1.5px solid rgba(255, 255, 255, 0.12)', paddingTop: '0.75rem', fontSize: isMobile ? '0.78rem' : '0.85rem', color: '#F5EBDD', fontWeight: '600' }}>
                <ShieldCheck size={15} color="#b9cd94" />
                <span>100% Maida-Free • Cow Desi Ghee &amp; Jaggery</span>
              </div>

            </div>
          </div>
        </div>

        {/* Section 2: Nutrition Facts & Ingredients tables */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '2.5rem', marginBottom: '4.5rem' }}>
          
          <div className="glass-card" style={{
            padding: '2.25rem 2rem',
            backgroundColor: 'rgba(20, 10, 5, 0.55)',
            backdropFilter: 'blur(18px)',
            WebkitBackdropFilter: 'blur(18px)',
            borderRadius: '24px',
            border: '1px solid rgba(245, 220, 180, 0.18)',
            boxShadow: '0 8px 30px rgba(0,0,0,0.3)'
          }}>
            <h3 style={{ fontSize: '1.3rem', fontFamily: 'var(--font-serif)', color: '#FFFDF9', fontWeight: '800', marginBottom: '1.25rem', margin: 0 }}>Ingredients &amp; Allergens</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: '1.25rem 0 0 0', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {product.ingredients?.map((ing, idx) => (
                <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.94rem', color: '#F5EBDD', fontWeight: '600' }}>
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#b9cd94', flexShrink: 0 }} />
                  <span>{ing}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="glass-card" style={{
            padding: '2.25rem 2rem',
            backgroundColor: 'rgba(20, 10, 5, 0.55)',
            backdropFilter: 'blur(18px)',
            WebkitBackdropFilter: 'blur(18px)',
            borderRadius: '24px',
            border: '1px solid rgba(245, 220, 180, 0.18)',
            boxShadow: '0 8px 30px rgba(0,0,0,0.3)'
          }}>
            <h3 style={{ fontSize: '1.3rem', fontFamily: 'var(--font-serif)', color: '#FFFDF9', fontWeight: '850', marginBottom: '1.25rem', margin: 0 }}>Accredited Nutritional Facts</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', marginTop: '1.25rem' }}>
              <tbody>
                {product.nutritionFacts &&
                  Object.entries(product.nutritionFacts).map(([k, v], idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.12)', backgroundColor: idx % 2 === 0 ? 'rgba(36, 79, 33, 0.15)' : 'transparent' }}>
                      <td style={{ padding: '0.7rem 0.65rem', fontWeight: '700', color: '#F5EBDD', textTransform: 'capitalize' }}>{k.replace(/([A-Z])/g, ' $1')}</td>
                      <td style={{ padding: '0.7rem 0.65rem', fontWeight: '900', textAlign: 'right', color: '#b9cd94' }}>{v}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 3: Related Products recommendations with 2-card animated mobile slider */}
        {relatedProducts.length > 0 && (
          <section style={{ borderTop: '1px solid rgba(245, 220, 180, 0.18)', paddingTop: '4.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#b9cd94', fontWeight: '800', display: 'block', marginBottom: '0.35rem' }}>Discover More</span>
                <h2 style={{ fontSize: '2.2rem', fontFamily: 'var(--font-serif)', color: '#FFFDF9', fontWeight: '800', margin: 0 }}>
                  You May Also Like
                </h2>
              </div>
              {!isMobile && (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => scrollLeft(relatedRef)}
                    aria-label="Scroll left"
                    style={{ backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', color: '#FFFDF9', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => scrollRight(relatedRef)}
                    aria-label="Scroll right"
                    style={{ backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', color: '#FFFDF9', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>

            {isMobile ? (
              <div style={{ width: '100%', overflow: 'hidden' }}>
                <div
                  onMouseEnter={() => setIsRelatedHovered(true)}
                  onMouseLeave={() => setIsRelatedHovered(false)}
                  onTouchStart={(e) => {
                    setIsRelatedHovered(true);
                    const touch = e.touches[0];
                    setRelatedTouchStartX(touch.clientX);
                    setRelatedTouchStartY(touch.clientY);
                  }}
                  onTouchMove={(e) => {
                    if (relatedTouchStartX === null) return;
                    const touch = e.touches[0];
                    const diffX = relatedTouchStartX - touch.clientX;
                    const diffY = Math.abs(relatedTouchStartY - touch.clientY);
                    if (Math.abs(diffX) > diffY && Math.abs(diffX) > 10) {
                      if (e.cancelable) e.preventDefault();
                    }
                  }}
                  onTouchEnd={(e) => {
                    setIsRelatedHovered(false);
                    if (relatedTouchStartX === null) return;
                    const touch = e.changedTouches[0];
                    const diffX = relatedTouchStartX - touch.clientX;
                    const diffY = Math.abs(relatedTouchStartY - touch.clientY);
                    const maxIdx = Math.max(0, relatedProducts.length - 2);
                    if (Math.abs(diffX) > 40 && Math.abs(diffX) > diffY) {
                      if (diffX > 0) {
                        // Swiped left -> next
                        setRelatedIndex((prev) => (prev >= maxIdx ? 0 : prev + 1));
                      } else {
                        // Swiped right -> prev
                        setRelatedIndex((prev) => (prev <= 0 ? maxIdx : prev - 1));
                      }
                    }
                    setRelatedTouchStartX(null);
                    setRelatedTouchStartY(null);
                  }}
                  style={{
                    display: 'flex',
                    flexWrap: 'nowrap',
                    gap: '0.65rem',
                    transform: `translateX(calc(-${relatedIndex} * (50% + 0.325rem)))`,
                    transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                    width: '100%',
                    touchAction: 'pan-y',
                    userSelect: 'none',
                    WebkitUserSelect: 'none'
                  }}
                >
                  {relatedProducts.map((p) => (
                    <div
                      key={p._id || p.slug}
                      style={{
                        flex: '0 0 calc(50% - 0.325rem)',
                        minWidth: 'calc(50% - 0.325rem)',
                        maxWidth: 'calc(50% - 0.325rem)',
                        boxSizing: 'border-box'
                      }}
                    >
                      <ProductCard product={p} />
                    </div>
                  ))}
                </div>

                {/* Pagination Dots & Navigation Controls */}
                <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.85rem' }}>
                  {/* Dots */}
                  <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center' }}>
                    {Array.from({ length: Math.max(1, relatedProducts.length - 1) }).map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setRelatedIndex(idx)}
                        style={{
                          width: relatedIndex === idx ? '22px' : '8px',
                          height: '8px',
                          borderRadius: '999px',
                          backgroundColor: relatedIndex === idx ? '#b9cd94' : 'rgba(255, 255, 255, 0.25)',
                          border: 'none',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease'
                        }}
                      />
                    ))}
                  </div>

                  {/* Left / Right Chevron Buttons */}
                  <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
                    <button
                      onClick={() => {
                        const maxIdx = Math.max(0, relatedProducts.length - 2);
                        setRelatedIndex((prev) => (prev <= 0 ? maxIdx : prev - 1));
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
                        const maxIdx = Math.max(0, relatedProducts.length - 2);
                        setRelatedIndex((prev) => (prev >= maxIdx ? 0 : prev + 1));
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
              </div>
            ) : (
              <div
                ref={relatedRef}
                className="horizontal-scroll-container"
                style={{
                  display: 'flex',
                  flexWrap: 'nowrap',
                  gap: '1.5rem',
                  overflowX: 'auto',
                  scrollBehavior: 'smooth',
                  paddingBottom: '1.25rem',
                  WebkitOverflowScrolling: 'touch',
                  width: '100%'
                }}
              >
                {relatedProducts.map((p) => (
                  <div key={p._id || p.slug} style={{ flex: '0 0 280px', minWidth: '280px', width: '280px', boxSizing: 'border-box' }}>
                    <ProductCard product={p} />
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

      </div>

      {/* Sticky Bottom Action Bar for Mobile Viewports */}
      {isMobile && (
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: 'rgba(20, 10, 5, 0.94)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderTop: '1px solid rgba(185, 205, 148, 0.35)',
            padding: '0.65rem 1.15rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 100,
            boxShadow: '0 -8px 24px rgba(0, 0, 0, 0.4)'
          }}
        >
          <div>
            <div style={{ fontSize: '0.68rem', color: '#F5EBDD', fontWeight: '600' }}>Price</div>
            <div style={{ fontSize: '1.05rem', fontWeight: '900', color: '#b9cd94' }}>₹{unitPrice}</div>
          </div>
          <button
            onClick={handleAddToCart}
            style={{
              padding: '0.6rem 1.45rem',
              backgroundColor: '#244f21',
              color: '#FFFFFF',
              border: '1.5px solid #b9cd94',
              borderRadius: '999px',
              fontWeight: '850',
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <ShoppingBag size={15} />
            <span>{btnText}</span>
          </button>
        </div>
      )}
    </div>
  );
}
