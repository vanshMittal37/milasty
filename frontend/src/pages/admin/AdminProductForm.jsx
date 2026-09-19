import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, Upload, Trash2, RefreshCw, Image as ImageIcon, Plus } from 'lucide-react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import { LOW_STOCK_THRESHOLD } from '../../config/constants';
import { useCategories } from '../../context/CategoryContext';

export default function AdminProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const { toast } = useToast();
  const { categories: ctxCategories, refreshCategories } = useCategories();

  const emptyForm = {
    title: '',
    slug: '',
    subtitle: '',
    description: '',
    category: 'daily',
    price: '',
    originalPrice: '',
    discountType: 'none',
    discountValue: '',
    stock: '',
    pieces: '',
    sku: '',
    status: 'active',
    isFeatured: true,
    image: '',
    secondaryImage: '',
    labReportUrl: '',
    badges: '',
    ingredients: '',
    allergens: '',
    benefits: '',
    nutritionFacts: {
      energyKcal: '',
      proteinG: '',
      carbohydrateG: '',
      totalSugarsG: '',
      addedSugarsG: '',
      totalFatG: '',
      dietaryFiberG: '',
      sodiumMg: '',
    },
    variants: [],
  };

  const [formData, setFormData] = useState(emptyForm);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadingMain, setUploadingMain] = useState(false);
  const [uploadingSec, setUploadingSec] = useState(false);
  const [uploadingReport, setUploadingReport] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    if (ctxCategories && ctxCategories.length > 0) {
      setCategories(ctxCategories);
    } else {
      fetchCategories();
    }
  }, [ctxCategories]);

  useEffect(() => {
    if (isEdit) {
      fetchProductDetails();
    } else {
      setFormData(emptyForm);
    }
  }, [id]);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      if (res.data) setCategories(res.data);
    } catch (e) {
      setCategories(ctxCategories && ctxCategories.length > 0 ? ctxCategories : [
        { name: 'STARTER BOX', slug: 'starter' },
        { name: 'DAILY BAKES', slug: 'daily' },
        { name: 'GIFTING HAMPER', slug: 'gifting' },
        { name: 'COOKIES', slug: 'cookies' },
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
          price: res.data.price !== undefined && res.data.price !== null ? res.data.price : '',
          originalPrice: res.data.originalPrice !== undefined && res.data.originalPrice !== null ? res.data.originalPrice : '',
          stock: res.data.stock !== undefined && res.data.stock !== null ? res.data.stock : '',
          pieces: res.data.pieces || res.data.nutritionFacts?.pieces || '',
          image: res.data.image || '',
          secondaryImage: res.data.secondaryImage || '',
          labReportUrl: res.data.labReportUrl || res.data.lab_report_url || '',
          badges: Array.isArray(res.data.badges) ? res.data.badges.join(', ') : res.data.badges || '',
          ingredients: Array.isArray(res.data.ingredients) ? res.data.ingredients.join(', ') : res.data.ingredients || '',
          benefits: Array.isArray(res.data.benefits) ? res.data.benefits.join(', ') : res.data.benefits || '',
          variants: (res.data.variants || []).map(v => ({
            ...v,
            stock: v.stock !== undefined && v.stock !== null ? v.stock : (v.in_stock ? 50 : 0)
          })),
        });
      }
    } catch (e) {
      toast.error('Failed to load product details');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleFileUpload = async (e, fieldName = 'image') => {
    const file = e.target.files[0];
    if (!file) return;

    if (fieldName === 'labReportUrl') {
      if (!file.type.match(/^(application\/pdf|image\/(jpeg|jpg|png|webp))$/i)) {
        toast.error('Only PDF documents and image files are supported for Lab Reports');
        return;
      }
    } else {
      if (!file.type.match(/^image\/(jpeg|jpg|png|webp)$/i)) {
        toast.error('Only JPG, JPEG, PNG, or WEBP images are supported');
        return;
      }
    }

    if (file.size > 15 * 1024 * 1024) {
      toast.error('File size exceeds 15MB limit');
      return;
    }

    if (fieldName === 'image') setUploadingMain(true);
    else if (fieldName === 'secondaryImage') setUploadingSec(true);
    else if (fieldName === 'labReportUrl') setUploadingReport(true);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      try {
        const base64Data = reader.result;
        const res = await api.post('/upload', { image: base64Data });
        if (res.data && res.data.url) {
          setFormData((prev) => ({ ...prev, [fieldName]: res.data.url }));
          toast.success(fieldName === 'labReportUrl' ? 'Lab report uploaded successfully!' : 'Image uploaded successfully!');
        } else {
          toast.error('File upload failed');
        }
      } catch (err) {
        console.error('File upload error:', err);
        const serverMsg = err.response?.data?.message || err.message || 'Upload failed';
        toast.error(`Upload failed: ${serverMsg}`);
      } finally {
        if (fieldName === 'image') setUploadingMain(false);
        else if (fieldName === 'secondaryImage') setUploadingSec(false);
        else if (fieldName === 'labReportUrl') setUploadingReport(false);
      }
    };
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
    if (!formData.title || !formData.title.trim()) {
      toast.error('Product title is required');
      return;
    }

    const basePriceNum = formData.price !== '' && formData.price !== null ? Number(formData.price) : null;
    const isVariantProduct = formData.variants && formData.variants.length > 0;

    if (!isVariantProduct) {
      if (basePriceNum === null || isNaN(basePriceNum)) {
        toast.error('Please enter a base price or add at least one variant.');
        return;
      }
      if (formData.stock === '' || formData.stock === null || formData.stock === undefined) {
        toast.error('Please enter total stock for this product.');
        return;
      }
    } else {
      // Validate variants independently
      for (let i = 0; i < formData.variants.length; i++) {
        const v = formData.variants[i];
        if (!v.name && !v.weight) {
          toast.error(`Variant #${i + 1} requires a Name or Weight.`);
          return;
        }
        if (v.price === '' || v.price === null || v.price === undefined) {
          toast.error(`Variant #${i + 1} (${v.name || v.weight}) requires a price.`);
          return;
        }
        if (v.stock === '' || v.stock === null || v.stock === undefined) {
          toast.error(`Variant #${i + 1} (${v.name || v.weight}) requires stock quantity.`);
          return;
        }
      }
    }

    setLoading(true);

    const payload = {
      ...formData,
      pieces: formData.pieces ? String(formData.pieces).trim() : '',
      badges: typeof formData.badges === 'string' ? formData.badges.split(',').map((s) => s.trim()).filter(Boolean) : formData.badges,
      ingredients: typeof formData.ingredients === 'string' ? formData.ingredients.split(',').map((s) => s.trim()).filter(Boolean) : formData.ingredients,
      benefits: typeof formData.benefits === 'string' ? formData.benefits.split(',').map((s) => s.trim()).filter(Boolean) : formData.benefits,
      price: basePriceNum,
      originalPrice: formData.originalPrice !== '' && formData.originalPrice !== null ? Number(formData.originalPrice) : null,
      stock: formData.stock !== '' && formData.stock !== null ? Number(formData.stock) : (isVariantProduct ? formData.variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0) : null),
    };

    try {
      if (isEdit) {
        await api.put(`/products/${id}`, payload);
        toast.success('Product updated successfully.');
      } else {
        await api.post('/products', payload);
        toast.success('Product created successfully.');
      }
      refreshCategories();
      navigate('/admin/products');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  if (loadingDetails) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '40vh', gap: '1rem' }}>
        <RefreshCw size={24} className="animate-spin" color="var(--admin-accent)" />
        <span style={{ fontSize: '0.88rem', color: 'var(--admin-text-muted)', fontWeight: '600' }}>Loading product details...</span>
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
      variants: [...formData.variants, { name: '', weight: '', price: '', originalPrice: '', stock: '' }],
    });
  };

  const removeVariant = (index) => {
    const updated = formData.variants.filter((_, i) => i !== index);
    setFormData({ ...formData, variants: updated });
  };

  return (
    <div style={{ maxWidth: '920px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
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
        }}
      >
        <ArrowLeft size={16} />
        <span>Back to Product Listing</span>
      </Link>

      <div className="admin-card" style={{ padding: '2rem' }}>
        <div style={{ borderBottom: '1px solid var(--admin-border)', paddingBottom: '0.85rem', marginBottom: '1.5rem' }}>
          <p style={{ fontSize: '0.68rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--admin-text-muted)', letterSpacing: '0.07em', margin: '0 0 0.2rem 0' }}>
            {isEdit ? 'Modify Product' : 'New Catalog Entry'}
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
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData({
                    ...formData,
                    title: val,
                    slug: isEdit ? formData.slug : val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
                  });
                }}
                placeholder="Enter product title"
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
                {categories.length > 0 ? (
                  categories.map((cat) => (
                    <option key={cat._id || cat.slug || cat.id} value={cat.slug}>{cat.name || cat.label}</option>
                  ))
                ) : (
                  <option value="daily">Daily Bakes</option>
                )}
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
                placeholder="Enter product subtitle"
                className="admin-input"
              />
            </div>
          </div>

          {/* Pricing Box */}
          <div 
            style={{ 
              backgroundColor: 'var(--admin-surface-elevated)', 
              padding: '1.25rem', 
              borderRadius: '12px', 
              border: '1px solid var(--admin-border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            {/* Dynamic Status Helper Banner */}
            <div 
              style={{
                padding: '0.65rem 0.9rem',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: formData.variants && formData.variants.length > 0 ? 'rgba(39, 76, 55, 0.15)' : 'rgba(217, 119, 6, 0.12)',
                color: formData.variants && formData.variants.length > 0 ? '#b9cd94' : '#f59e0b',
                border: `1px solid ${formData.variants && formData.variants.length > 0 ? 'rgba(185, 205, 148, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
              }}
            >
              <span>
                {formData.variants && formData.variants.length > 0 
                  ? '✓ Variants are being used. Base price is optional.' 
                  : '⚠️ Add a base price because this product has no variants.'}
              </span>
            </div>

            <div 
              style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', 
                gap: '1rem',
                alignItems: 'start'
              }}
            >
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: '800', color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Base Price (₹)
                </label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="Enter base price if no variants"
                  className="admin-input"
                />
                <span style={{ fontSize: '0.68rem', color: 'var(--admin-text-muted)', marginTop: '0.35rem', display: 'block' }}>
                  Optional when using variants. Required if this product has no variants.
                </span>
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
                  onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                  placeholder="Enter discount"
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
                <div style={{ fontSize: '0.7rem', color: 'var(--admin-text-muted)', fontWeight: '750', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.15rem' }}>Selling Price:</div>
                <div style={{ fontSize: '1.35rem', fontWeight: '900', color: 'var(--admin-accent)' }}>
                  ₹{calculatedFinalPrice || 0}
                </div>
              </div>
            </div>
          </div>

          {/* Stock, Pieces, SKU, Status */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1.25rem' }}>
            <div>
              <label style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Total Stock {formData.variants && formData.variants.length > 0 ? '(Auto / Optional)' : '*'}
              </label>
              <input
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                placeholder={formData.variants && formData.variants.length > 0 ? "Calculated from variants" : "Enter total stock"}
                className="admin-input"
              />
              <span style={{ fontSize: '0.68rem', color: 'var(--admin-text-muted)', marginTop: '0.35rem', display: 'block' }}>
                {formData.variants && formData.variants.length > 0 ? 'Automatically aggregated from variants' : 'Required for simple products'}
              </span>
            </div>
            <div>
              <label style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Pieces / Pack Count
              </label>
              <input
                type="text"
                value={formData.pieces}
                onChange={(e) => setFormData({ ...formData, pieces: e.target.value })}
                placeholder="e.g. 6 Pieces"
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
              placeholder="Enter product description..."
              className="admin-input"
              style={{ resize: 'none' }}
            />
          </div>

          {/* Cloudinary Image Upload & URL Options */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', border: '1px solid var(--admin-border)', padding: '1.25rem', borderRadius: '12px', backgroundColor: 'var(--admin-surface-elevated)' }}>
            <h4 style={{ margin: 0, fontSize: '0.92rem', color: 'var(--admin-text-primary)', fontWeight: '700' }}>Product Image Management</h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
              {/* Main Image Upload Box */}
              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase' }}>
                  Main Image URL or File *
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.65rem' }}>
                  <input
                    type="text"
                    required
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    placeholder="Enter image URL"
                    className="admin-input"
                    style={{ flex: 1 }}
                  />
                  <label 
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0 0.85rem',
                      backgroundColor: 'var(--admin-accent)',
                      color: '#ffffff',
                      borderRadius: '8px',
                      fontSize: '0.78rem',
                      fontWeight: '700',
                      cursor: uploadingMain ? 'not-allowed' : 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <Upload size={14} />
                    <span>{uploadingMain ? 'Uploading...' : 'Upload Image'}</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/jpg"
                      onChange={(e) => handleFileUpload(e, 'image')}
                      style={{ display: 'none' }}
                      disabled={uploadingMain}
                    />
                  </label>
                </div>

                {/* Main Image Preview */}
                {formData.image ? (
                  <div style={{ position: 'relative', width: '90px', height: '90px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--admin-border)' }}>
                    <img src={formData.image} alt="Main preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, image: '' })}
                      style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        border: 'none',
                        color: '#ff5b5b',
                        borderRadius: '4px',
                        padding: '3px',
                        cursor: 'pointer',
                      }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ) : null}
              </div>

              {/* Secondary Image Upload Box */}
              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase' }}>
                  Secondary Image URL or File
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.65rem' }}>
                  <input
                    type="text"
                    value={formData.secondaryImage}
                    onChange={(e) => setFormData({ ...formData, secondaryImage: e.target.value })}
                    placeholder="Enter secondary image URL"
                    className="admin-input"
                    style={{ flex: 1 }}
                  />
                  <label 
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0 0.85rem',
                      backgroundColor: 'var(--admin-surface-card)',
                      border: '1px solid var(--admin-border)',
                      color: 'var(--admin-text-primary)',
                      borderRadius: '8px',
                      fontSize: '0.78rem',
                      fontWeight: '700',
                      cursor: uploadingSec ? 'not-allowed' : 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <Upload size={14} />
                    <span>{uploadingSec ? 'Uploading...' : 'Upload Image'}</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/jpg"
                      onChange={(e) => handleFileUpload(e, 'secondaryImage')}
                      style={{ display: 'none' }}
                      disabled={uploadingSec}
                    />
                  </label>
                </div>

                {/* Secondary Image Preview */}
                {formData.secondaryImage ? (
                  <div style={{ position: 'relative', width: '90px', height: '90px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--admin-border)' }}>
                    <img src={formData.secondaryImage} alt="Secondary preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, secondaryImage: '' })}
                      style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        border: 'none',
                        color: '#ff5b5b',
                        borderRadius: '4px',
                        padding: '3px',
                        cursor: 'pointer',
                      }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {/* Laboratory Report Management (Part 1 Requirement) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', border: '1px solid var(--admin-border)', padding: '1.25rem', borderRadius: '12px', backgroundColor: 'var(--admin-surface-elevated)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '0.92rem', color: 'var(--admin-text-primary)', fontWeight: '700' }}>Lab Report PDF / Document</h4>
                <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.74rem', color: 'var(--admin-text-muted)' }}>
                  Upload official laboratory analysis report (PDF or image). Only products with uploaded lab reports will show the "Download Lab Report" button on the Nutrition page.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  value={formData.labReportUrl || ''}
                  onChange={(e) => setFormData({ ...formData, labReportUrl: e.target.value })}
                  placeholder="Enter lab report URL or upload file..."
                  className="admin-input"
                  style={{ flex: 1, minWidth: '220px' }}
                />

                <label 
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.6rem 1rem',
                    backgroundColor: 'var(--admin-accent)',
                    color: '#ffffff',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    fontWeight: '700',
                    cursor: uploadingReport ? 'not-allowed' : 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <Upload size={14} />
                  <span>{uploadingReport ? 'Uploading...' : (formData.labReportUrl ? 'Replace Report' : 'Upload Lab Report')}</span>
                  <input
                    type="file"
                    accept="application/pdf,image/jpeg,image/png,image/webp"
                    onChange={(e) => handleFileUpload(e, 'labReportUrl')}
                    style={{ display: 'none' }}
                    disabled={uploadingReport}
                  />
                </label>

                {formData.labReportUrl && (
                  <>
                    <a
                      href={formData.labReportUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="admin-btn-secondary"
                      style={{ padding: '0.6rem 0.95rem', fontSize: '0.78rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      View Report
                    </a>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, labReportUrl: '' })}
                      style={{
                        padding: '0.6rem 0.85rem',
                        backgroundColor: 'var(--admin-danger-bg)',
                        color: 'var(--admin-danger)',
                        border: '1px solid var(--admin-danger)',
                        borderRadius: '8px',
                        fontSize: '0.78rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem'
                      }}
                    >
                      <Trash2 size={13} />
                      <span>Remove Report</span>
                    </button>
                  </>
                )}
              </div>

              {formData.labReportUrl ? (
                <div style={{ fontSize: '0.74rem', color: 'var(--admin-accent)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  ✓ Lab report active & ready for public download on Nutrition page.
                </div>
              ) : (
                <div style={{ fontSize: '0.74rem', color: 'var(--admin-text-muted)' }}>
                  No lab report uploaded. Nutrition page will display "Not available" for this product.
                </div>
              )}
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
                placeholder="Enter badges"
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
                placeholder="Enter ingredients"
                className="admin-input"
              />
            </div>
          </div>

          {/* Product Variants System */}
          <div style={{ borderTop: '1px solid var(--admin-border)', paddingTop: '1.5rem', marginTop: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h4 style={{ fontSize: '1rem', fontFamily: 'var(--font-serif)', color: 'var(--admin-text-primary)', fontWeight: '800', margin: 0 }}>Product Pack Options (Variants)</h4>
                <p style={{ fontSize: '0.74rem', color: 'var(--admin-text-muted)', margin: '0.15rem 0 0 0' }}>Configure weights, pricing tiers, and stock limits.</p>
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
                {formData.variants.map((v, index) => {
                  const numStock = Number(v.stock !== undefined && v.stock !== '' ? v.stock : 0);
                  const isOut = numStock === 0;
                  const isLow = numStock > 0 && numStock <= LOW_STOCK_THRESHOLD;

                  return (
                    <div 
                      key={index} 
                      style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr)) 100px 44px', 
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
                          onChange={(e) => handleVariantChange(index, 'price', e.target.value)}
                          placeholder="Enter price"
                          className="admin-input"
                          style={{ height: '36px', padding: '0 0.65rem', fontSize: '0.82rem' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.68rem', fontWeight: '800', color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '0.35rem', textTransform: 'uppercase' }}>Original Price</label>
                        <input 
                          type="number" 
                          value={v.originalPrice} 
                          onChange={(e) => handleVariantChange(index, 'originalPrice', e.target.value)}
                          placeholder="Original price"
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
                          onChange={(e) => handleVariantChange(index, 'stock', e.target.value)}
                          placeholder="Stock"
                          className="admin-input"
                          style={{ height: '36px', padding: '0 0.65rem', fontSize: '0.82rem' }}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '36px' }}>
                        <span className={`admin-badge ${isOut ? 'admin-badge-danger' : isLow ? 'admin-badge-warning' : 'admin-badge-success'}`} style={{ fontSize: '0.65rem', width: '100%', textAlign: 'center' }}>
                          {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'}
                        </span>
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
                  );
                })}
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
            disabled={loading || uploadingMain || uploadingSec} 
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
            <span>
              {loading 
                ? (isEdit ? 'Updating Product...' : 'Creating Product...') 
                : (isEdit ? 'Update Product Details' : 'Save & Publish Product')}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
}
