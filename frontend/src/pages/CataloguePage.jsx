import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  Sparkles, Filter, ChevronRight, ShoppingBag, Leaf, 
  Shield, Award, ArrowRight, Grid 
} from 'lucide-react';
import ProductCard from '../components/ProductCard';
import api from '../api/axios';
import { initialProducts } from '../data/seedData';
import { useCart } from '../context/CartContext';

export default function CataloguePage() {
  const { addToCart } = useCart();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategoryParam = searchParams.get('category') || 'all';

  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(activeCategoryParam);
  const [loading, setLoading] = useState(true);

  // Define Category Taxonomy
  const categories = [
    { id: 'all', name: 'ALL PRODUCTS', desc: 'Browse our complete range of handcrafted millet bakes.' },
    { id: 'starter', name: 'STARTER FAVOURITES', desc: 'Curated box & signature favorites for new MILASTY discoverers.' },
    { id: 'daily', name: 'DAILY RITUAL', desc: 'Earthy, low-GI millet cookies slow baked for your daily tea time.' },
    { id: 'gifting', name: 'GIFTING HAMPERS', desc: 'Luxury handcrafted hampers crafted for celebrations & warm memories.' },
  ];

  useEffect(() => {
    // Sync category state from URL search params
    const categoryFromUrl = searchParams.get('category') || 'all';
    setSelectedCategory(categoryFromUrl);
  }, [searchParams]);

  useEffect(() => {
    fetchCatalogueProducts();
  }, [selectedCategory]);

  const fetchCatalogueProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory && selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }
      params.append('limit', 50);

      const res = await api.get(`/products?${params.toString()}`);
      if (res.data && res.data.products && res.data.products.length > 0) {
        setProducts(res.data.products);
      } else {
        filterFallbackProducts(selectedCategory);
      }
    } catch (err) {
      filterFallbackProducts(selectedCategory);
    } finally {
      setLoading(false);
    }
  };

  const filterFallbackProducts = (cat) => {
    if (cat === 'all') {
      setProducts(initialProducts);
    } else if (cat === 'starter') {
      setProducts(initialProducts.filter(p => p.category === 'starter' || p.isFeatured));
    } else if (cat === 'daily') {
      setProducts(initialProducts.filter(p => p.category === 'daily'));
    } else if (cat === 'gifting' || cat === 'gifts') {
      setProducts(initialProducts.filter(p => p.category === 'gifting' || p.category === 'gifts' || p.title.toLowerCase().includes('box') || p.title.toLowerCase().includes('hamper')));
    } else {
      setProducts(initialProducts);
    }
  };

  const handleCategorySelect = (catId) => {
    setSelectedCategory(catId);
    if (catId === 'all') {
      setSearchParams({});
    } else {
      setSearchParams({ category: catId });
    }
  };

  const currentCategoryInfo = categories.find(c => c.id === selectedCategory) || categories[0];

  return (
    <div 
      className="catalogue-page products-page" 
      style={{ 
        minHeight: '100vh', 
        paddingBottom: '5rem',
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
      {/* Dark overlay matching Shop page */}
      <div 
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(135deg, rgba(20, 10, 5, 0.30) 0%, rgba(36, 19, 13, 0.22) 100%)',
          zIndex: 0,
          pointerEvents: 'none',
        }} 
      />

      <div style={{ position: 'relative', zIndex: 1 }}>
      
      {/* 1. COMPACT HERO SECTION */}
      <section 
        style={{ 
          padding: '4.5rem 1.5rem 2.5rem', 
          textAlign: 'center', 
          borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
          backgroundColor: 'transparent'
        }}
      >
        <div className="container" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <span 
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '0.4rem', 
              marginBottom: '0.75rem', 
              fontSize: '0.82rem', 
              letterSpacing: '0.12em', 
              textTransform: 'uppercase', 
              color: 'var(--accent-gold)', 
              fontWeight: '800' 
            }}
          >
            <Grid size={14} color="var(--accent-gold)" />
            <span>OUR COLLECTION</span>
          </span>

          <h1 
            style={{ 
              fontSize: 'clamp(2.2rem, 5vw, 3.2rem)', 
              color: '#FFFDF9', 
              fontFamily: 'var(--font-serif)', 
              fontWeight: '850', 
              lineHeight: '1.2', 
              marginBottom: '1rem' 
            }}
          >
            The MILASTY <span style={{ color: 'var(--accent-gold)' }}>Catalogue</span>
          </h1>

          <p 
            style={{ 
              color: 'rgba(255, 255, 255, 0.88)', 
              fontSize: 'clamp(0.95rem, 2vw, 1.1rem)', 
              lineHeight: '1.6', 
              margin: '0 auto', 
              maxWidth: '600px', 
              fontWeight: '500' 
            }}
          >
            Wholesome millet bakes slow-baked for every kind of everyday snacking and celebration moment.
          </p>
        </div>
      </section>

      {/* 2. CATEGORY NAVIGATION TABS / FILTER STRIP */}
      <section style={{ padding: '1.25rem 0.5rem 0.75rem', position: 'sticky', top: '70px', zIndex: 30, backgroundColor: 'rgba(20, 10, 5, 0.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255, 255, 255, 0.12)' }}>
        <div className="container" style={{ maxWidth: '1240px', margin: '0 auto', padding: '0 0.5rem' }}>
          <div 
            className="category-tab-strip"
            style={{ 
              display: 'flex', 
              gap: '0.45rem', 
              overflowX: 'auto', 
              paddingBottom: '0.35rem',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              justifyContent: 'flex-start',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => handleCategorySelect(cat.id)}
                  style={{
                    padding: '0.45rem 0.95rem',
                    borderRadius: '999px',
                    backgroundColor: isSelected ? '#244f21' : 'rgba(35, 21, 13, 0.65)',
                    border: isSelected ? '1.5px solid #b9cd94' : '1px solid rgba(255, 255, 255, 0.2)',
                    color: isSelected ? '#FFFDF9' : 'rgba(255, 255, 255, 0.85)',
                    fontWeight: isSelected ? '850' : '600',
                    fontSize: '0.75rem',
                    letterSpacing: '0.03em',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.25s ease',
                    boxShadow: isSelected ? '0 4px 14px rgba(36, 79, 33, 0.4)' : 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}
                >
                  {isSelected && <Sparkles size={11} color="#b9cd94" />}
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. COMPLETE PRODUCT CATALOGUE GRID */}
      <section className="catalogue-listings-section" style={{ padding: '1.75rem 0.5rem' }}>
        <div className="container" style={{ maxWidth: '1240px', margin: '0 auto', padding: '0 0.5rem' }}>
          
          {/* Active Category Meta Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.4rem', color: '#FFFDF9', fontFamily: 'var(--font-serif)', fontWeight: '800', margin: 0 }}>
                {currentCategoryInfo.name}
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.7)', margin: '0.25rem 0 0', fontWeight: '500' }}>
                {currentCategoryInfo.desc}
              </p>
            </div>
            <span style={{ fontSize: '0.82rem', color: 'var(--accent-gold)', fontWeight: '750', backgroundColor: 'rgba(200, 155, 60, 0.12)', padding: '0.35rem 0.85rem', borderRadius: '8px', border: '1px solid rgba(200, 155, 60, 0.3)' }}>
              {products.length} {products.length === 1 ? 'Product' : 'Products'} Available
            </span>
          </div>

          {/* Product Grid: 4 Columns on Desktop | 2x2 Grid on Mobile */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem 0', color: 'rgba(255,255,255,0.7)' }}>
              <Sparkles size={32} className="animate-spin" color="var(--accent-gold)" style={{ margin: '0 auto 1rem' }} />
              <p>Loading MILASTY Collection...</p>
            </div>
          ) : products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 1.5rem', backgroundColor: 'rgba(35, 21, 13, 0.5)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <p style={{ fontSize: '1.1rem', color: '#FFFDF9', fontWeight: '600' }}>No products found in this category.</p>
              <button 
                onClick={() => handleCategorySelect('all')}
                className="btn-primary"
                style={{ marginTop: '1rem', padding: '0.65rem 1.5rem', backgroundColor: '#c89b3c', color: '#FFF', borderRadius: '999px', border: 'none' }}
              >
                View All Products
              </button>
            </div>
          ) : (
            <div className="catalogue-grid favorites-grid fitted-cards-container-4">
              {products.map((product) => (
                <ProductCard key={product._id || product.slug} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      </div>
    </div>
  );
}
