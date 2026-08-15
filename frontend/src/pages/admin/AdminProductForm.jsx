import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, Sparkles, Plus, Trash2, RefreshCw } from 'lucide-react';
import api from '../../api/axios';

export default function AdminProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    subtitle: '',
    description: '',
    category: 'daily',
    price: 139,
    originalPrice: 160,
    discountType: 'percentage',
    discountValue: 10,
    stock: 100,
    sku: '',
    status: 'active',
    isFeatured: true,
    image: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=800&q=80',
    secondaryImage: '',
    badges: 'Pure Desi Ghee, Organic Jaggery, No Maida',
    ingredients: 'Pearl Millet (Bajra), Pure Desi Ghee, Organic Jaggery, Green Cardamom',
    allergens: 'Contains Dairy (Ghee).',
    benefits: 'High Fiber, Iron Rich, Zero Palm Oil',
    nutritionFacts: {
      energyKcal: '476 kcal / 100g',
      proteinG: '7.9g',
      carbohydrateG: '64.2g',
      totalSugarsG: '17.5g',
      addedSugarsG: '0g',
      totalFatG: '21.4g',
      dietaryFiberG: '8.1g',
      sodiumMg: '38mg',
    },
    variants: [
      { name: 'Trial Pack', weight: '70g', price: 99, originalPrice: 120, stock: 50 },
      { name: 'Regular Pack', weight: '100g', price: 139, originalPrice: 160, stock: 50 },
      { name: 'Couple Pack', weight: '130g', price: 179, originalPrice: 200, stock: 50 },
      { name: 'Family Pack', weight: '180g', price: 239, originalPrice: 275, stock: 50 },
    ],
  });

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    fetchCategories();
    if (isEdit) fetchProductDetails();
  }, [id]);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      if (res.data) setCategories(res.data);
    } catch (e) {
      setCategories([
        { name: 'Starter Favorites', slug: 'starter' },
        { name: 'Daily Ritual Cookies', slug: 'daily' },
        { name: 'Gifting Hampers', slug: 'gifts' },
      ]);
    }
  };

  const fetchProductDetails = async () => {
    setLoadingDetails(true);
    try {
      const res = await api.get(`/products/${id}`);
      if (res.data) {
        setFormData({
          ...res.data,
          badges: Array.isArray(res.data.badges) ? res.data.badges.join(', ') : res.data.badges || '',
          ingredients: Array.isArray(res.data.ingredients) ? res.data.ingredients.join(', ') : res.data.ingredients || '',
          benefits: Array.isArray(res.data.benefits) ? res.data.benefits.join(', ') : res.data.benefits || '',
        });
      }
    } catch (e) {
      console.error('Error loading product details', e);
    } finally {
      setLoadingDetails(false);
    }
  };

  const calculatedFinalPrice = (() => {
    const base = Number(formData.price) || 0;
    const val = Number(formData.discountValue) || 0;
    if (formData.discountType === 'percentage' && val > 0) {
      return Math.round(base * (1 - val / 100));
    } else if (formData.discountType === 'fixed' && val > 0) {
      return Math.max(0, base - val);
    }
    return base;
  })();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      ...formData,
      badges: typeof formData.badges === 'string' ? formData.badges.split(',').map((s) => s.trim()).filter(Boolean) : formData.badges,
      ingredients: typeof formData.ingredients === 'string' ? formData.ingredients.split(',').map((s) => s.trim()).filter(Boolean) : formData.ingredients,
      benefits: typeof formData.benefits === 'string' ? formData.benefits.split(',').map((s) => s.trim()).filter(Boolean) : formData.benefits,
      finalPrice: calculatedFinalPrice,
    };

    try {
      if (isEdit) {
        await api.put(`/products/${id}`, payload);
      } else {
        await api.post('/products', payload);
      }
      navigate('/admin/products');
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving product');
    } finally {
      setLoading(false);
    }
  };

  if (loadingDetails) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justify: 'center', minHeight: '40vh', gap: '1rem' }}>
        <RefreshCw size={20} className="animate-spin" color="var(--primary-dark)" />
        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: '600' }}>Loading product details...</span>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Back Link */}
      <Link 
        to="/admin/products" 
        style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '0.45rem', 
          color: 'var(--primary-dark)', 
          fontWeight: '800', 
          fontSize: '0.85rem',
          textDecoration: 'none',
          transition: 'color 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-gold)'}
        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--primary-dark)'}
      >
        <ArrowLeft size={16} />
        <span>Back to Product Listing</span>
      </Link>

      <div 
        className="glass-card" 
        style={{ 
          padding: '2.5rem', 
          backgroundColor: '#FFFFFF', 
          borderRadius: '16px', 
          border: '1.5px solid var(--border-color)', 
          boxShadow: '0 4px 20px rgba(56, 20, 35, 0.01)' 
        }}
      >
        <h2 style={{ fontSize: '1.65rem', fontFamily: 'var(--font-serif)', color: 'var(--primary-dark)', fontWeight: '800', marginBottom: '2rem', marginTop: 0 }}>
          {isEdit ? 'Edit Catalog Product' : 'Add New Product'}
        </h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Title & Slug */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
            <div>
              <label style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--primary-dark)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Product Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-') })}
                placeholder="e.g. Cardamom Bajra Cookies"
                style={{ 
                  width: '100%', 
                  height: '46px', 
                  padding: '0 0.95rem', 
                  borderRadius: '10px', 
                  border: '1.5px solid var(--border-color)', 
                  fontSize: '0.88rem',
                  outline: 'none',
                  backgroundColor: '#FCFAF6',
                  fontFamily: 'inherit',
                  color: 'var(--primary-dark)'
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--primary-dark)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                URL Slug *
              </label>
              <input
                type="text"
                required
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="e.g. cardamom-bajra-cookies"
                style={{ 
                  width: '100%', 
                  height: '46px', 
                  padding: '0 0.95rem', 
                  borderRadius: '10px', 
                  border: '1.5px solid var(--border-color)', 
                  fontSize: '0.88rem',
                  outline: 'none',
                  backgroundColor: '#FCFAF6',
                  fontFamily: 'inherit',
                  color: 'var(--primary-dark)'
                }}
              />
            </div>
          </div>

          {/* Category & Subtitle */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
            <div>
              <label style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--primary-dark)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                style={{ 
                  width: '100%', 
                  height: '46px', 
                  padding: '0 0.75rem', 
                  borderRadius: '10px', 
                  border: '1.5px solid var(--border-color)', 
                  fontSize: '0.88rem',
                  outline: 'none',
                  backgroundColor: '#FCFAF6',
                  fontFamily: 'inherit',
                  color: 'var(--primary-dark)',
                  cursor: 'pointer'
                }}
              >
                {categories.map((cat) => (
                  <option key={cat._id || cat.slug} value={cat.slug}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--primary-dark)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Subtitle / Tagline
              </label>
              <input
                type="text"
                value={formData.subtitle}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                placeholder="e.g. Warming Pearl Millet with Aromatic Cardamom"
                style={{ 
                  width: '100%', 
                  height: '46px', 
                  padding: '0 0.95rem', 
                  borderRadius: '10px', 
                  border: '1.5px solid var(--border-color)', 
                  fontSize: '0.88rem',
                  outline: 'none',
                  backgroundColor: '#FCFAF6',
                  fontFamily: 'inherit',
                  color: 'var(--primary-dark)'
                }}
              />
            </div>
          </div>

          {/* Pricing Auto Calculator Box */}
          <div 
            style={{ 
              backgroundColor: '#FCFAF6', 
              padding: '1.5rem', 
              borderRadius: '14px', 
              border: '1.5px solid var(--border-color)',
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', 
              gap: '1.25rem',
              alignItems: 'center'
            }}
          >
            <div>
              <label style={{ fontSize: '0.72rem', fontWeight: '800', color: 'var(--primary-dark)', display: 'block', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Base Price (₹) *
              </label>
              <input
                type="number"
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                style={{ 
                  width: '100%', 
                  height: '42px', 
                  padding: '0 0.75rem', 
                  borderRadius: '8px', 
                  border: '1.5px solid var(--border-color)', 
                  fontSize: '0.88rem',
                  outline: 'none',
                  backgroundColor: '#FFFFFF',
                  fontFamily: 'inherit',
                  color: 'var(--primary-dark)'
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.72rem', fontWeight: '800', color: 'var(--primary-dark)', display: 'block', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Discount Type
              </label>
              <select
                value={formData.discountType}
                onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                style={{ 
                  width: '100%', 
                  height: '42px', 
                  padding: '0 0.65rem', 
                  borderRadius: '8px', 
                  border: '1.5px solid var(--border-color)', 
                  fontSize: '0.88rem',
                  outline: 'none',
                  backgroundColor: '#FFFFFF',
                  fontFamily: 'inherit',
                  color: 'var(--primary-dark)',
                  cursor: 'pointer'
                }}
              >
                <option value="none">No Discount</option>
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Flat (₹)</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.72rem', fontWeight: '800', color: 'var(--primary-dark)', display: 'block', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Discount Value
              </label>
              <input
                type="number"
                value={formData.discountValue}
                onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                style={{ 
                  width: '100%', 
                  height: '42px', 
                  padding: '0 0.75rem', 
                  borderRadius: '8px', 
                  border: '1.5px solid var(--border-color)', 
                  fontSize: '0.88rem',
                  outline: 'none',
                  backgroundColor: '#FFFFFF',
                  fontFamily: 'inherit',
                  color: 'var(--primary-dark)'
                }}
              />
            </div>
            <div 
              style={{ 
                backgroundColor: '#FFFFFF', 
                padding: '0.85rem 1rem', 
                borderRadius: '10px', 
                border: '1px solid var(--border-color)', 
                textAlign: 'center',
                boxShadow: 'var(--shadow-sm)' 
              }}
            >
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '750', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.15rem' }}>Auto Final Price:</div>
              <div style={{ fontSize: '1.35rem', fontWeight: '900', color: 'var(--accent-olive)' }}>₹{calculatedFinalPrice}</div>
            </div>
          </div>

          {/* Stock, SKU, Status */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.25rem' }}>
            <div>
              <label style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--primary-dark)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Total Stock *
              </label>
              <input
                type="number"
                required
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                style={{ 
                  width: '100%', 
                  height: '46px', 
                  padding: '0 0.95rem', 
                  borderRadius: '10px', 
                  border: '1.5px solid var(--border-color)', 
                  fontSize: '0.88rem',
                  outline: 'none',
                  backgroundColor: '#FCFAF6',
                  fontFamily: 'inherit',
                  color: 'var(--primary-dark)'
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--primary-dark)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                SKU Code
              </label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                placeholder="e.g. MLS-PRD-001"
                style={{ 
                  width: '100%', 
                  height: '46px', 
                  padding: '0 0.95rem', 
                  borderRadius: '10px', 
                  border: '1.5px solid var(--border-color)', 
                  fontSize: '0.88rem',
                  outline: 'none',
                  backgroundColor: '#FCFAF6',
                  fontFamily: 'inherit',
                  color: 'var(--primary-dark)'
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--primary-dark)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Catalog Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                style={{ 
                  width: '100%', 
                  height: '46px', 
                  padding: '0 0.75rem', 
                  borderRadius: '10px', 
                  border: '1.5px solid var(--border-color)', 
                  fontSize: '0.88rem',
                  outline: 'none',
                  backgroundColor: '#FCFAF6',
                  fontFamily: 'inherit',
                  color: 'var(--primary-dark)',
                  cursor: 'pointer'
                }}
              >
                <option value="active">Active (Visible)</option>
                <option value="inactive">Inactive (Hidden)</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--primary-dark)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Product Description *
            </label>
            <textarea
              rows={4}
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Provide a detailed description of the product, its flavor profile, and baking method..."
              style={{ 
                width: '100%', 
                padding: '0.75rem 0.95rem', 
                borderRadius: '10px', 
                border: '1.5px solid var(--border-color)', 
                fontSize: '0.88rem',
                outline: 'none',
                backgroundColor: '#FCFAF6',
                fontFamily: 'inherit',
                color: 'var(--primary-dark)',
                resize: 'none'
              }}
            />
          </div>

          {/* Image URLs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
            <div>
              <label style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--primary-dark)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Main Product Image URL *
              </label>
              <input
                type="text"
                required
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                style={{ 
                  width: '100%', 
                  height: '46px', 
                  padding: '0 0.95rem', 
                  borderRadius: '10px', 
                  border: '1.5px solid var(--border-color)', 
                  fontSize: '0.88rem',
                  outline: 'none',
                  backgroundColor: '#FCFAF6',
                  fontFamily: 'inherit',
                  color: 'var(--primary-dark)'
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--primary-dark)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Secondary Image URL
              </label>
              <input
                type="text"
                value={formData.secondaryImage}
                onChange={(e) => setFormData({ ...formData, secondaryImage: e.target.value })}
                placeholder="Optional second gallery image link..."
                style={{ 
                  width: '100%', 
                  height: '46px', 
                  padding: '0 0.95rem', 
                  borderRadius: '10px', 
                  border: '1.5px solid var(--border-color)', 
                  fontSize: '0.88rem',
                  outline: 'none',
                  backgroundColor: '#FCFAF6',
                  fontFamily: 'inherit',
                  color: 'var(--primary-dark)'
                }}
              />
            </div>
          </div>

          {/* Badges & Ingredients */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
            <div>
              <label style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--primary-dark)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Badges (comma separated)
              </label>
              <input
                type="text"
                value={formData.badges}
                onChange={(e) => setFormData({ ...formData, badges: e.target.value })}
                placeholder="e.g. Pure Desi Ghee, Organic Jaggery, No Maida"
                style={{ 
                  width: '100%', 
                  height: '46px', 
                  padding: '0 0.95rem', 
                  borderRadius: '10px', 
                  border: '1.5px solid var(--border-color)', 
                  fontSize: '0.88rem',
                  outline: 'none',
                  backgroundColor: '#FCFAF6',
                  fontFamily: 'inherit',
                  color: 'var(--primary-dark)'
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--primary-dark)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Ingredients (comma separated)
              </label>
              <input
                type="text"
                value={formData.ingredients}
                onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
                placeholder="e.g. Bajra, Pure Desi Ghee, Organic Jaggery"
                style={{ 
                  width: '100%', 
                  height: '46px', 
                  padding: '0 0.95rem', 
                  borderRadius: '10px', 
                  border: '1.5px solid var(--border-color)', 
                  fontSize: '0.88rem',
                  outline: 'none',
                  backgroundColor: '#FCFAF6',
                  fontFamily: 'inherit',
                  color: 'var(--primary-dark)'
                }}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={loading} 
            className="btn-primary" 
            style={{ 
              width: '100%', 
              height: '52px', 
              justifyContent: 'center', 
              backgroundColor: 'var(--primary-dark)',
              border: 'none',
              borderRadius: '12px',
              color: '#FFFFFF',
              fontWeight: '800',
              fontSize: '0.92rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer',
              marginTop: '1rem',
              textTransform: 'uppercase',
              letterSpacing: '0.06em'
            }}
          >
            <Save size={16} />
            <span>{loading ? 'Saving Changes...' : (isEdit ? 'Update Product Details' : 'Save & Publish Product')}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
