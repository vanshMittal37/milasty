import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingBag, Star, ShieldCheck, Heart, ChevronRight, CheckCircle, Plus, Minus } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import api from '../api/axios';
import { initialProducts } from '../data/seedData';

export default function ShopProductDetail() {
  const { id } = useParams();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const [product, setProduct] = useState(null);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState('');
  const [loading, setLoading] = useState(true);
  const [btnText, setBtnText] = useState('Add to Cart');
  const [relatedProducts, setRelatedProducts] = useState([]);

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
        setRelatedProducts(initialProducts.filter(p => p.category === found.category && p.slug !== found.slug).slice(0, 3));
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchRelated = async (category) => {
    try {
      const res = await api.get(`/products?category=${category}&limit=4`);
      if (res.data && res.data.products) {
        setRelatedProducts(res.data.products.filter((p) => p.slug !== id && p._id !== id).slice(0, 3));
      }
    } catch (e) {}
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

  const selectedVariant = product.variants[selectedVariantIndex] || product.variants[0];
  const unitPrice = selectedVariant.price || product.finalPrice || product.price;
  const wishlisted = isInWishlist(product._id || product.slug);
  const currentStock = selectedVariant.stock || product.stock || 50;

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
      padding: '2.5rem 0 5rem',
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

      <div className="container" style={{ maxWidth: '1150px', position: 'relative', zIndex: 1 }}>
        
        {/* Breadcrumb */}
        <div style={{
          fontSize: '0.78rem',
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          color: '#F5EBDD',
          marginBottom: '2rem',
          backgroundColor: 'rgba(20, 10, 5, 0.65)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          padding: '0.6rem 1.2rem',
          borderRadius: '999px',
          display: 'inline-flex',
          alignItems: 'center',
          border: '1px solid rgba(185, 205, 148, 0.35)'
        }}>
          <Link to="/" style={{ color: '#F5EBDD', textDecoration: 'none' }}>Home</Link>
          <span style={{ margin: '0 0.5rem', color: '#b9cd94' }}>/</span>
          <Link to="/shop" style={{ color: '#F5EBDD', textDecoration: 'none' }}>Shop</Link>
          <span style={{ margin: '0 0.5rem', color: '#b9cd94' }}>/</span>
          <span style={{ color: '#b9cd94', fontWeight: '800' }}>{product.title}</span>
        </div>

        {/* Main Details Panel */}
        <div
          className="glass-card"
          style={{
            backgroundColor: 'rgba(20, 10, 5, 0.55)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: '28px',
            border: '1px solid rgba(245, 220, 180, 0.18)',
            boxShadow: '0 16px 48px rgba(0,0,0,0.4)',
            padding: '2.5rem',
            marginBottom: '3.5rem'
          }}
        >
          <div 
            className="product-detail-layout"
            style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', 
              gap: '3.5rem', 
              alignItems: 'start'
            }}
          >
            {/* Left Column: Image gallery */}
            <div>
              <div 
                style={{ 
                  borderRadius: '20px', 
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
                  style={{ width: '100%', height: '440px', objectFit: 'cover', display: 'block', transition: 'transform 0.4s ease' }} 
                  onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                />
              </div>
              
              {/* Gallery Thumbnails */}
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                <img
                  src={product.image}
                  alt="Thumbnail primary"
                  onClick={() => setSelectedImage(product.image)}
                  style={{
                    width: '74px',
                    height: '74px',
                    objectFit: 'cover',
                    borderRadius: '12px',
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
                      width: '74px',
                      height: '74px',
                      objectFit: 'cover',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      border: selectedImage === product.secondaryImage ? '2.5px solid #b9cd94' : '1.5px solid rgba(245, 220, 180, 0.25)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                    }}
                  />
                )}
              </div>
            </div>

            {/* Right Column: Details & Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem' }}>
              
              {/* Badges / Stock */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                {product.badges?.map((badge, idx) => (
                  <span 
                    key={idx} 
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: '800',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: '#b9cd94',
                      backgroundColor: 'rgba(36, 79, 33, 0.85)',
                      border: '1px solid rgba(185, 205, 148, 0.4)',
                      padding: '0.3rem 0.75rem',
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
                    padding: '0.3rem 0.75rem',
                    borderRadius: '999px'
                  }}
                >
                  {currentStock > 5 ? 'In Stock' : 'Low Stock'}
                </span>
              </div>

              {/* Title & Description */}
              <div>
                <h1 style={{ fontSize: '2.4rem', fontFamily: 'var(--font-serif)', color: '#FFFDF9', fontWeight: '800', margin: '0 0 0.5rem 0' }}>{product.title}</h1>
                <p style={{ fontSize: '1.05rem', color: '#F5EBDD', lineHeight: '1.6', margin: 0, fontWeight: '500' }}>
                  {product.subtitle || product.description}
                </p>
              </div>

              {/* Ratings & reviews */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#F5EBDD', fontWeight: '600' }}>
                <div style={{ display: 'flex', color: '#b9cd94' }}>
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={15} fill="#b9cd94" color="#b9cd94" />
                  ))}
                </div>
                <span style={{ color: '#FFFDF9', fontWeight: '800' }}>{product.rating}</span>
                <span style={{ color: '#F5EBDD' }}>({product.reviewCount || 24} customer reviews)</span>
                <span style={{ color: 'rgba(255, 255, 255, 0.25)' }}>|</span>
                <span style={{ color: '#F5EBDD' }}>SKU: {product.sku || 'MLS-001'}</span>
              </div>

              {/* Price section */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.65rem' }}>
                <span style={{ fontSize: '2.2rem', fontWeight: '900', color: '#b9cd94' }}>₹{unitPrice}</span>
                {selectedVariant.originalPrice && (
                  <span style={{ textDecoration: 'line-through', color: 'rgba(245, 235, 221, 0.65)', fontSize: '1.15rem', fontWeight: '500' }}>
                    ₹{selectedVariant.originalPrice}
                  </span>
                )}
              </div>

              {/* Pack Size Selectors */}
              {product.variants && product.variants.length > 1 && (
                <div style={{ padding: '0.35rem 0' }}>
                  <span style={{ fontSize: '0.74rem', fontWeight: '800', color: '#FFFDF9', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '0.65rem' }}>Select Pack Size</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {product.variants.map((v, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedVariantIndex(idx)}
                        style={{
                          padding: '0.65rem 1.15rem',
                          borderRadius: '12px',
                          fontWeight: '800',
                          fontSize: '0.85rem',
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
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', paddingTop: '0.5rem' }}>
                {/* Qty count */}
                <div style={{ display: 'inline-flex', alignItems: 'center', border: '1.5px solid rgba(185, 205, 148, 0.35)', borderRadius: '999px', backgroundColor: 'rgba(20, 10, 5, 0.65)', padding: '0.35rem 0.75rem' }}>
                  <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} style={{ padding: '0.2rem 0.55rem', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#FFFDF9' }}><Minus size={14} /></button>
                  <span style={{ padding: '0 0.85rem', fontWeight: '900', color: '#FFFDF9', fontSize: '0.95rem' }}>{quantity}</span>
                  <button onClick={() => setQuantity((q) => Math.min(currentStock, q + 1))} style={{ padding: '0.2rem 0.55rem', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#FFFDF9' }}><Plus size={14} /></button>
                </div>

                {/* Add to cart */}
                <button
                  onClick={handleAddToCart}
                  style={{
                    padding: '0.9rem 2.25rem',
                    fontSize: '0.92rem',
                    backgroundColor: '#244f21',
                    color: '#FFFFFF',
                    border: '1px solid #b9cd94',
                    borderRadius: '999px',
                    fontWeight: '800',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(36, 79, 33, 0.35)'
                  }}
                >
                  <ShoppingBag size={16} color="#FFFFFF" />
                  <span>{btnText}</span>
                </button>

                {/* Wishlist toggle */}
                <button
                  onClick={() => toggleWishlist(product)}
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(20, 10, 5, 0.65)',
                    border: '1.5px solid rgba(185, 205, 148, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: wishlisted ? '#b9cd94' : '#F5EBDD',
                    transition: 'all 0.2s'
                  }}
                  title="Add to Wishlist"
                >
                  <Heart size={18} fill={wishlisted ? '#b9cd94' : 'none'} color={wishlisted ? '#b9cd94' : '#F5EBDD'} />
                </button>
              </div>

              {/* Custom Brand Trust bullet strip */}
              <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: '1.5px solid rgba(255, 255, 255, 0.15)', paddingTop: '1.25rem', fontSize: '0.88rem', color: '#F5EBDD' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: '600' }}>
                  <ShieldCheck size={17} color="#b9cd94" />
                  <span>100% Maida-Free &amp; Palm-Oil Free</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: '600' }}>
                  <ShieldCheck size={17} color="#b9cd94" />
                  <span>Baked in pure Cow Desi Ghee &amp; sweetened with Jaggery</span>
                </div>
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

        {/* Section 3: Related Products recommendations */}
        {relatedProducts.length > 0 && (
          <section style={{ borderTop: '1px solid rgba(245, 220, 180, 0.18)', paddingTop: '4.5rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#b9cd94', fontWeight: '800', display: 'block', marginBottom: '0.35rem' }}>Discover More</span>
              <h2 style={{ fontSize: '2.2rem', fontFamily: 'var(--font-serif)', color: '#FFFDF9', fontWeight: '800', margin: 0 }}>
                You May Also Like
              </h2>
            </div>

            <div 
              className="products-main-grid" 
              style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 260px), 1fr))', 
                gap: '2.5rem' 
              }}
            >
              {relatedProducts.map((p) => (
                <ProductCard key={p._id || p.slug} product={p} />
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  );
}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
              {relatedProducts.map((p) => (
                <div key={`related-${p._id || p.slug}`} style={{ display: 'flex', flexDirection: 'column', gap: '0.50rem' }}>
                  <Link to={`/product/${p.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div style={{
                      borderRadius: '20px',
                      overflow: 'hidden',
                      border: '1px solid rgba(100, 65, 35, 0.15)',
                      backgroundColor: 'rgba(255, 250, 242, 0.80)',
                      backdropFilter: 'blur(14px)',
                      WebkitBackdropFilter: 'blur(14px)',
                      boxShadow: '0 4px 16px rgba(80, 45, 15, 0.08)'
                    }}>
                      <img src={p.image} alt={p.title} style={{ width: '100%', height: '240px', objectFit: 'cover', display: 'block', transition: 'transform 0.4s' }} onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'} onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'} />
                    </div>
                    <h4 style={{ fontSize: '1.05rem', fontFamily: 'var(--font-serif)', fontWeight: '800', color: '#24130D', marginTop: '0.85rem', marginBottom: '0.2rem' }}>{p.title}</h4>
                    <span style={{ fontSize: '0.95rem', fontWeight: '800', color: '#244f21' }}>₹{p.variants?.[0]?.price || p.price}</span>
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  );
}
