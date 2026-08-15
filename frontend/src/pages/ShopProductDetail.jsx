import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingBag, Star, ShieldCheck, Heart, ChevronRight, CheckCircle, Plus, Minus, MessageCircle, HelpCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import api from '../api/axios';
import { initialProducts } from '../data/seedData';

export default function ShopProductDetail() {
  const { id } = useParams(); // It's named 'id' in parameters but could be slug or ID
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
        // Find local related
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
    } catch (e) {
      // Continue
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '6rem 0', textAlign: 'center', backgroundColor: '#FBF8F2', minHeight: '80vh' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.85rem' }}>
          <ShoppingBag size={32} color="var(--accent-gold)" className="animate-float" />
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', fontWeight: '700' }}>Gathering product details...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div style={{ padding: '6rem 0', textAlign: 'center', backgroundColor: '#FBF8F2', minHeight: '80vh' }}>
        <div style={{ maxWidth: '400px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', color: 'var(--primary-dark)', fontSize: '1.8rem', fontWeight: '800' }}>Product Not Found</h2>
          <Link to="/shop" className="btn-primary" style={{ padding: '0.8rem 2rem', textDecoration: 'none', borderRadius: '999px', backgroundColor: 'var(--primary-dark)', color: '#FFFFFF', fontWeight: '750' }}>
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
    <div style={{ backgroundColor: '#FBF8F2', minHeight: '100vh', padding: '2.5rem 0 5rem' }}>
      <div className="container" style={{ maxWidth: '1150px' }}>
        
        {/* Breadcrumb */}
        <div style={{ fontSize: '0.78rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '2rem' }}>
          <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>Home</Link>
          <span style={{ margin: '0 0.5rem' }}>/</span>
          <Link to="/shop" style={{ color: 'inherit', textDecoration: 'none' }}>Shop</Link>
          <span style={{ margin: '0 0.5rem' }}>/</span>
          <span style={{ color: 'var(--primary-dark)' }}>{product.title}</span>
        </div>

        {/* Main Details layout */}
        <div 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
            gap: '4rem', 
            alignItems: 'start',
            marginBottom: '4.5rem'
          }}
        >
          {/* Left Column: Image gallery */}
          <div>
            <div 
              style={{ 
                borderRadius: '24px', 
                overflow: 'hidden', 
                backgroundColor: '#FFFFFF', 
                border: '1.5px solid var(--border-color)',
                boxShadow: '0 8px 30px rgba(56, 20, 35, 0.02)',
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
                  border: selectedImage === product.image ? '2px solid var(--accent-gold)' : '1px solid var(--border-color)',
                  boxShadow: 'var(--shadow-sm)'
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
                    border: selectedImage === product.secondaryImage ? '2px solid var(--accent-gold)' : '1px solid var(--border-color)',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                />
              )}
            </div>
          </div>

          {/* Right Column: Details & Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Badges / Stock */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              {product.badges?.map((badge, idx) => (
                <span 
                  key={idx} 
                  style={{
                    fontSize: '0.65rem',
                    fontWeight: '800',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: 'var(--primary-dark)',
                    backgroundColor: 'var(--accent-gold)',
                    padding: '0.3rem 0.65rem',
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
                  backgroundColor: currentStock > 5 ? 'rgba(39, 76, 55, 0.08)' : 'rgba(217, 83, 79, 0.08)', 
                  color: currentStock > 5 ? 'var(--accent-olive)' : 'var(--accent-terracotta)',
                  padding: '0.3rem 0.65rem',
                  borderRadius: '999px'
                }}
              >
                {currentStock > 5 ? 'In Stock' : 'Low Stock'}
              </span>
            </div>

            {/* Title & Description */}
            <div>
              <h1 style={{ fontSize: '2.4rem', fontFamily: 'var(--font-serif)', color: 'var(--primary-dark)', fontWeight: '800', margin: '0 0 0.5rem 0' }}>{product.title}</h1>
              <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', lineHeight: '1.6', margin: 0, fontWeight: '500' }}>
                {product.subtitle || product.description}
              </p>
            </div>

            {/* Ratings & reviews */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.84rem', color: 'var(--text-muted)', fontWeight: '600' }}>
              <div style={{ display: 'flex', color: 'var(--accent-gold)' }}>
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={14} fill="var(--accent-gold)" color="var(--accent-gold)" />
                ))}
              </div>
              <span style={{ color: 'var(--primary-dark)', fontWeight: '800' }}>{product.rating}</span>
              <span>({product.reviewCount || 24} customer reviews)</span>
              <span style={{ color: 'var(--border-color)' }}>|</span>
              <span>SKU: {product.sku || 'MLS-001'}</span>
            </div>

            {/* Price section */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
              <span style={{ fontSize: '2.1rem', fontWeight: '900', color: 'var(--primary-dark)' }}>₹{unitPrice}</span>
              {selectedVariant.originalPrice && (
                <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)', fontSize: '1.1rem', fontWeight: '500' }}>
                  ₹{selectedVariant.originalPrice}
                </span>
              )}
            </div>

            {/* Pack Size Selectors */}
            {product.variants && product.variants.length > 1 && (
              <div style={{ padding: '0.5rem 0' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: '800', color: 'var(--primary-dark)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '0.65rem' }}>Select Pack Size</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {product.variants.map((v, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedVariantIndex(idx)}
                      style={{
                        padding: '0.6rem 1.1rem',
                        borderRadius: '10px',
                        fontWeight: '800',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        backgroundColor: selectedVariantIndex === idx ? 'var(--primary-dark)' : '#FFFFFF',
                        color: selectedVariantIndex === idx ? '#FFFFFF' : 'var(--primary-dark)',
                        border: selectedVariantIndex === idx ? '1.5px solid var(--primary-dark)' : '1.5px solid var(--border-color)',
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
              <div style={{ display: 'inline-flex', alignItems: 'center', border: '1.5px solid var(--border-color)', borderRadius: '999px', backgroundColor: '#FFFFFF', padding: '0.35rem 0.75rem' }}>
                <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} style={{ padding: '0.2rem 0.5rem', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><Minus size={14} /></button>
                <span style={{ padding: '0 0.85rem', fontWeight: '900', color: 'var(--primary-dark)', fontSize: '0.92rem' }}>{quantity}</span>
                <button onClick={() => setQuantity((q) => Math.min(currentStock, q + 1))} style={{ padding: '0.2rem 0.5rem', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><Plus size={14} /></button>
              </div>

              {/* Add to cart */}
              <button
                onClick={handleAddToCart}
                className="btn-primary"
                style={{
                  padding: '0.9rem 2.25rem',
                  fontSize: '0.9rem',
                  backgroundColor: 'var(--primary-dark)',
                  color: 'var(--bg-main)',
                  border: 'none',
                  borderRadius: '999px',
                  fontWeight: '800',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <ShoppingBag size={16} />
                <span>{btnText}</span>
              </button>

              {/* Wishlist toggle */}
              <button
                onClick={() => toggleWishlist(product)}
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  backgroundColor: '#FFFFFF',
                  border: '1.5px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: wishlisted ? 'var(--accent-terracotta)' : 'var(--text-muted)',
                  transition: 'all 0.2s'
                }}
                title="Add to Wishlist"
              >
                <Heart size={18} fill={wishlisted ? 'var(--accent-terracotta)' : 'none'} />
              </button>
            </div>

            {/* Custom Brand Trust bullet strip */}
            <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: '600' }}>
                <ShieldCheck size={16} color="var(--accent-olive)" />
                <span>100% Maida-Free & Palm-Oil Free</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: '600' }}>
                <ShieldCheck size={16} color="var(--accent-olive)" />
                <span>Baked in pure Cow Desi Ghee & sweetened with Jaggery</span>
              </div>
            </div>

          </div>
        </div>

        {/* Section 2: Nutrition Facts & Ingredients tables */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2.5rem', marginBottom: '5rem' }}>
          
          <div className="glass-card" style={{ padding: '2.25rem 2rem', backgroundColor: '#FFFFFF', borderRadius: '24px', border: '1.5px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-serif)', color: 'var(--primary-dark)', fontWeight: '800', marginBottom: '1.25rem', margin: 0 }}>Ingredients & Allergens</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: '1.25rem 0 0 0', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {product.ingredients?.map((ing, idx) => (
                <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.92rem', color: 'var(--primary-dark)', fontWeight: '600' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--accent-gold)' }} />
                  <span>{ing}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="glass-card" style={{ padding: '2.25rem 2rem', backgroundColor: '#FFFFFF', borderRadius: '24px', border: '1.5px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-serif)', color: 'var(--primary-dark)', fontWeight: '800', marginBottom: '1.25rem', margin: 0 }}>Accredited Nutritional Facts</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', marginTop: '1.25rem' }}>
              <tbody>
                {product.nutritionFacts &&
                  Object.entries(product.nutritionFacts).map(([k, v], idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: idx % 2 === 0 ? '#FCFAF6' : '#FFFFFF' }}>
                      <td style={{ padding: '0.65rem', fontWeight: '750', color: 'var(--primary-dark)', textTransform: 'capitalize' }}>{k.replace(/([A-Z])/g, ' $1')}</td>
                      <td style={{ padding: '0.65rem', fontWeight: '900', textAlign: 'right', color: 'var(--primary-dark)' }}>{v}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 3: Related Products recommendations */}
        {relatedProducts.length > 0 && (
          <section style={{ borderTop: '1.5px solid var(--border-color)', paddingTop: '5rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
              <h2 style={{ fontSize: '2.1rem', fontFamily: 'var(--font-serif)', color: 'var(--primary-dark)', fontWeight: '800', margin: 0 }}>
                You May Also Like
              </h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
              {relatedProducts.map((p) => (
                <div key={`related-${p._id || p.slug}`} style={{ display: 'flex', flexDirection: 'column', gap: '0.50rem' }}>
                  <Link to={`/product/${p.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div style={{ borderRadius: '20px', overflow: 'hidden', border: '1.5px solid var(--border-color)' }}>
                      <img src={p.image} alt={p.title} style={{ width: '100%', height: '240px', objectFit: 'cover', display: 'block', transition: 'transform 0.4s' }} onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'} onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'} />
                    </div>
                    <h4 style={{ fontSize: '1rem', fontWeight: '850', color: 'var(--primary-dark)', marginTop: '0.75rem', marginBottom: '0.2rem' }}>{p.title}</h4>
                    <span style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--accent-gold)' }}>₹{p.variants?.[0]?.price || p.price}</span>
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
