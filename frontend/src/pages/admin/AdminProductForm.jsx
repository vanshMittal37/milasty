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
      { name: 'Standard Pack', weight: '100g', price: 139, originalPrice: 160, stock: 100 },
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
          variants: res.data.variants && res.data.variants.length > 0
            ? res.data.variants
            : [{ name: 'Standard Pack', weight: '100g', price: res.data.price || 139, originalPrice: res.data.originalPrice || 160, stock: res.data.stock || 100 }],
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
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '40vh', gap: '1rem' }}>
        <RefreshCw size={20} className="animate-spin" color="var(--admin-accent)" />
        <span style={{ fontSize: '0.82rem', color: 'var(--admin-text-muted)', fontWeight: '600' }}>Loading product details...</span>
      </div>
    );
  }

  const handleVariantChange = (index, field, value) => {
    const updated = [...formData.variants];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, variants: updated });
  };

  const addVariant = () => {
    setFormData({
      ...formData,
      variants: [...formData.variants, { name: '', weight: '', price: 0, originalPrice: 0, stock: 10 }],
    });
  };

  const removeVariant = (index) => {
    const updated = formData.variants.filter((_, i) => i !== index);
    setFormData({ ...formData, variants: updated });
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Back Link */}
      <Link 
        to="/admin/products" 
        style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '0.45rem', 
          color: 'var(--admin-accent)', 
          fontWeight: '800', 
          fontSize: '0.85rem',
          textDecoration: 'none',
          transition: 'color 0.2s'
        }}
      >
        <ArrowLeft size={16} />
        <span>Back to Product Listing</span>
      </Link>

      <div className="admin-card" style={{ padding: '2rem' }}>
        <div style={{ borderBottom: '1px solid var(--admin-border)', paddingBottom: '0.85rem', marginBottom: '1.5rem' }}>
          <p style={{ fontSize: '0.68rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--admin-text-muted)', letterSpacing: '0.07em', margin: '0 0 0.2rem 0' }}>
            {isEdit ? 'Modify' : 'New Entry'}
          </p>
          <h2 style={{ fontSize: 'clamp(1.15rem, 2.5vw, 1.45rem)', fontFamily: 'var(--font-serif)', color: 'var(--admin-text-primary)', fontWeight: '800', margin: 0, lineHeight: '1.25' }}>
            {isEdit ? 'Edit Catalog Product' : 'Add New Product'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Title & Slug */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
            <div>
              <label style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Product Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-') })}
                placeholder="e.g. Cardamom Bajra Cookies"
                className="admin-input"
              />
            </div>
            <div>
              <label style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                URL Slug *
              </label>
              <input
                type="text"
                required
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="e.g. cardamom-bajra-cookies"
                className="admin-input"
              />
            </div>
          </div>

          {/* Category & Subtitle */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
            <div>
              <label style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="admin-input"
                style={{ cursor: 'pointer' }}
              >
                {categories.map((cat) => (
                  <option key={cat._id || cat.slug} value={cat.slug}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Subtitle / Tagline
              </label>
              <input
                type="text"
                value={formData.subtitle}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                placeholder="e.g. Warming Pearl Millet with Aromatic Cardamom"
                className="admin-input"
              />
            </div>
          </div>

          {/* Pricing Auto Calculator Box */}
          <div 
            style={{ 
              backgroundColor: 'var(--admin-surface-elevated)', 
              padding: '1.25rem', 
              borderRadius: '12px', 
              border: '1px solid var(--admin-border)',
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', 
              gap: '1rem',
              alignItems: 'center'
            }}
          >
            <div>
              <label style={{ fontSize: '0.72rem', fontWeight: '800', color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Base Price (₹) *
              </label>
              <input
                type="number"
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                className="admin-input"
              />
            </div>
            <div>
              <label style={{ fontSize: '0.72rem', fontWeight: '800', color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Discount Type
              </label>
              <select
                value={formData.discountType}
                onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                className="admin-input"
                style={{ cursor: 'pointer' }}
              >
                <option value="none">No Discount</option>
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Flat (₹)</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.72rem', fontWeight: '800', color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Discount Value
              </label>
              <input
                type="number"
                value={formData.discountValue}
                onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                className="admin-input"
              />
            </div>
            <div 
              style={{ 
                backgroundColor: 'var(--admin-surface-card)', 
                padding: '0.85rem 1rem', 
                borderRadius: '10px', 
                border: '1px solid var(--admin-border)', 
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '0.7rem', color: 'var(--admin-text-muted)', fontWeight: '750', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.15rem' }}>Auto Final Price:</div>
              <div style={{ fontSize: '1.35rem', fontWeight: '900', color: 'var(--admin-accent)' }}>₹{calculatedFinalPrice}</div>
            </div>
          </div>

          {/* Stock, SKU, Status */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.25rem' }}>
            <div>
              <label style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Total Stock *
              </label>
              <input
                type="number"
                required
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                className="admin-input"
              />
            </div>
            <div>
              <label style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                SKU Code
              </label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                placeholder="e.g. MLS-PRD-001"
                className="admin-input"
              />
            </div>
            <div>
              <label style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Catalog Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="admin-input"
                style={{ cursor: 'pointer' }}
              >
                <option value="active">Active (Visible)</option>
                <option value="inactive">Inactive (Hidden)</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Product Description *
            </label>
            <textarea
              rows={4}
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Provide a detailed description of the product, its flavor profile, and baking method..."
              className="admin-input"
              style={{ resize: 'none' }}
            />
          </div>

          {/* Image URLs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
            <div>
              <label style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Main Product Image URL *
              </label>
              <input
                type="text"
                required
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                className="admin-input"
              />
            </div>
            <div>
              <label style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Secondary Image URL
              </label>
              <input
                type="text"
                value={formData.secondaryImage}
                onChange={(e) => setFormData({ ...formData, secondaryImage: e.target.value })}
                placeholder="Optional second gallery image link..."
                className="admin-input"
              />
            </div>
          </div>

          {/* Badges & Ingredients */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
            <div>
              <label style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Badges (comma separated)
              </label>
              <input
                type="text"
                value={formData.badges}
                onChange={(e) => setFormData({ ...formData, badges: e.target.value })}
                placeholder="e.g. Pure Desi Ghee, Organic Jaggery, No Maida"
                className="admin-input"
              />
            </div>
            <div>
              <label style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Ingredients (comma separated)
              </label>
              <input
                type="text"
                value={formData.ingredients}
                onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
                placeholder="e.g. Bajra, Pure Desi Ghee, Organic Jaggery"
                className="admin-input"
              />
            </div>
          </div>

          {/* Product Pack Options Variants System */}
          <div style={{ borderTop: '1px solid var(--admin-border)', paddingTop: '1.5rem', marginTop: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h4 style={{ fontSize: '1rem', fontFamily: 'var(--font-serif)', color: 'var(--admin-text-primary)', fontWeight: '800', margin: 0 }}>Product Pack Options (Variants)</h4>
                <p style={{ fontSize: '0.74rem', color: 'var(--admin-text-muted)', margin: '0.15rem 0 0 0' }}>Configure weights, discount values, pricing tiers, and stock limits.</p>
              </div>
              <button 
                type="button" 
                onClick={addVariant}
                className="admin-btn-secondary"
                style={{ padding: '0.45rem 0.85rem', fontSize: '0.78rem' }}
              >
                <Plus size={14} />
                <span>Add Variant Option</span>
              </button>
            </div>

            {formData.variants && formData.variants.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {formData.variants.map((v, index) => (
                  <div 
                    key={index} 
                    style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr)) 44px', 
                      gap: '0.85rem', 
                      alignItems: 'end',
                      padding: '1rem',
                      borderRadius: '12px',
                      backgroundColor: 'var(--admin-surface-elevated)',
                      border: '1px solid var(--admin-border)'
                    }}
                  >
                    <div>
                      <label style={{ fontSize: '0.68rem', fontWeight: '800', color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '0.35rem', textTransform: 'uppercase' }}>Variant Name</label>
                      <input 
                        type="text" 
                        required 
                        value={v.name} 
                        onChange={(e) => handleVariantChange(index, 'name', e.target.value)}
                        placeholder="e.g. Regular Pack" 
                        className="admin-input"
                        style={{ height: '36px', padding: '0 0.65rem', fontSize: '0.82rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.68rem', fontWeight: '800', color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '0.35rem', textTransform: 'uppercase' }}>Weight</label>
                      <input 
                        type="text" 
                        required 
                        value={v.weight} 
                        onChange={(e) => handleVariantChange(index, 'weight', e.target.value)}
                        placeholder="e.g. 100g" 
                        className="admin-input"
                        style={{ height: '36px', padding: '0 0.65rem', fontSize: '0.82rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.68rem', fontWeight: '800', color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '0.35rem', textTransform: 'uppercase' }}>Price (₹)</label>
                      <input 
                        type="number" 
                        required 
                        value={v.price} 
                        onChange={(e) => handleVariantChange(index, 'price', Number(e.target.value))}
                        className="admin-input"
                        style={{ height: '36px', padding: '0 0.65rem', fontSize: '0.82rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.68rem', fontWeight: '800', color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '0.35rem', textTransform: 'uppercase' }}>Original Price</label>
                      <input 
                        type="number" 
                        required 
                        value={v.originalPrice} 
                        onChange={(e) => handleVariantChange(index, 'originalPrice', Number(e.target.value))}
                        className="admin-input"
                        style={{ height: '36px', padding: '0 0.65rem', fontSize: '0.82rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.68rem', fontWeight: '800', color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '0.35rem', textTransform: 'uppercase' }}>Stock</label>
                      <input 
                        type="number" 
                        required 
                        value={v.stock} 
                        onChange={(e) => handleVariantChange(index, 'stock', Number(e.target.value))}
                        className="admin-input"
                        style={{ height: '36px', padding: '0 0.65rem', fontSize: '0.82rem' }}
                      />
                    </div>
                    <button 
                      type="button" 
                      onClick={() => removeVariant(index)}
                      className="admin-icon-btn"
                      style={{ color: 'var(--admin-danger)', height: '36px', width: '36px', borderRadius: '6px' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '2rem', textAlign: 'center', border: '1px dashed var(--admin-border)', borderRadius: '12px', color: 'var(--admin-text-muted)', fontSize: '0.82rem' }}>
                No variants configured. Click "Add Variant Option" to configure pricing pack variants.
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={loading} 
            className="admin-btn-primary" 
            style={{ 
              width: '100%', 
              height: '50px', 
              justifyContent: 'center', 
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
