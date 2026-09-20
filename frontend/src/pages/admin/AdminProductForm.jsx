import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, Save, Upload, Trash2, RefreshCw, Image as ImageIcon, Plus, 
  Check, X, FileText, AlertCircle, Calendar, Sparkles, CheckSquare, Square
} from 'lucide-react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import { LOW_STOCK_THRESHOLD } from '../../config/constants';
import { useCategories } from '../../context/CategoryContext';

export const PREDEFINED_NUTRITION_LIST = [
  { key: 'energy', label: 'Calories / Energy', unit: 'kcal/100g' },
  { key: 'protein', label: 'Protein', unit: 'g' },
  { key: 'total_fat', label: 'Total Fat', unit: 'g' },
  { key: 'saturated_fat', label: 'Saturated Fat', unit: 'g' },
  { key: 'trans_fat', label: 'Trans Fat', unit: 'g' },
  { key: 'carbohydrates', label: 'Carbohydrates', unit: 'g' },
  { key: 'dietary_fiber', label: 'Dietary Fiber', unit: 'g' },
  { key: 'total_sugars', label: 'Total Sugars', unit: 'g' },
  { key: 'added_sugars', label: 'Added Sugars', unit: 'g' },
  { key: 'sodium', label: 'Sodium', unit: 'mg' },
  { key: 'calcium', label: 'Calcium', unit: 'mg' },
  { key: 'iron', label: 'Iron', unit: 'mg' },
  { key: 'potassium', label: 'Potassium', unit: 'mg' },
  { key: 'cholesterol', label: 'Cholesterol', unit: 'mg' },
  { key: 'vitamin_d', label: 'Vitamin D', unit: 'mcg' },
  { key: 'vitamin_b12', label: 'Vitamin B12', unit: 'mcg' },
];

export const PRESET_BADGES = [
  'Bestseller',
  'High Fiber',
  'Gluten-Free',
  'Calcium+',
  'Organic',
  'No Palm Oil',
  'No Maida',
  'New',
  'Top Rated',
];

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
    category: 'cookies',
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
    allergens: '',
    targetAudience: '',
    variants: [],
  };

  const [formData, setFormData] = useState(emptyForm);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadingMain, setUploadingMain] = useState(false);
  const [uploadingSec, setUploadingSec] = useState(false);
  const [uploadingReport, setUploadingReport] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Structured Lists State
  const [badgesList, setBadgesList] = useState([]);
  const [customBadgeInput, setCustomBadgeInput] = useState('');

  const [ingredientsList, setIngredientsList] = useState([]);
  const [newIngredientInput, setNewIngredientInput] = useState('');
  const [bulkIngredientsInput, setBulkIngredientsInput] = useState('');

  const [benefitsList, setBenefitsList] = useState([]);
  const [newBenefitInput, setNewBenefitInput] = useState('');

  // Structured Nutrition State: { [key]: { label, value, unit } }
  const [nutritionMap, setNutritionMap] = useState({});
  const [customNutritionLabel, setCustomNutritionLabel] = useState('');
  const [customNutritionValue, setCustomNutritionValue] = useState('');
  const [customNutritionUnit, setCustomNutritionUnit] = useState('g');

  // Pre-Booking Config State
  const [prebookingEnabled, setPrebookingEnabled] = useState(false);
  const [preorderAllowed, setPreorderAllowed] = useState(true);
  const [prebookingLaunchDate, setPrebookingLaunchDate] = useState('');
  const [prebookingDisplayOrder, setPrebookingDisplayOrder] = useState(1);
  const [existingPrebookingId, setExistingPrebookingId] = useState(null);

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
      setBadgesList(['High Fiber']);
      setIngredientsList(['Millet Flour', 'Desi Ghee', 'Jaggery']);
      setBenefitsList(['Rich in Fiber', 'No Refined Sugar']);
      const defaultNutr = {};
      PREDEFINED_NUTRITION_LIST.slice(0, 4).forEach((item) => {
        defaultNutr[item.key] = { label: item.label, value: '', unit: item.unit };
      });
      setNutritionMap(defaultNutr);
    }
  }, [id]);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      if (res.data) setCategories(res.data);
    } catch (e) {
      setCategories(ctxCategories && ctxCategories.length > 0 ? ctxCategories : [
        { name: 'COOKIES', slug: 'cookies' },
        { name: 'DAILY BAKES', slug: 'daily' },
        { name: 'GIFTING HAMPER', slug: 'gifting' },
        { name: 'STARTER BOX', slug: 'starter' },
      ]);
    }
  };

  const fetchProductDetails = async () => {
    setLoadingDetails(true);
    try {
      const [prodRes, pbRes] = await Promise.all([
        api.get(`/products/${id}`),
        api.get('/prebookings/admin/all').catch(() => ({ data: [] })),
      ]);

      if (prodRes.data) {
        const p = prodRes.data;
        setFormData({
          title: p.title || '',
          slug: p.slug || '',
          subtitle: p.subtitle || '',
          description: p.description || '',
          category: p.category || 'cookies',
          price: p.price !== undefined && p.price !== null ? p.price : '',
          originalPrice: p.originalPrice !== undefined && p.originalPrice !== null ? p.originalPrice : '',
          discountType: p.discountType || 'none',
          discountValue: p.discountValue || '',
          stock: p.stock !== undefined && p.stock !== null ? p.stock : '',
          pieces: p.pieces || p.nutritionFacts?.pieces || '',
          sku: p.sku || '',
          status: p.status || (p.is_active !== false ? 'active' : 'inactive'),
          isFeatured: p.isFeatured !== false,
          image: p.image || p.image_url || '',
          secondaryImage: p.secondaryImage || p.secondary_image_url || '',
          labReportUrl: p.labReportUrl || p.lab_report_url || '',
          allergens: p.allergens || '',
          targetAudience: p.targetAudience || p.target_audience || '',
          variants: (p.variants || []).map(v => ({
            ...v,
            stock: v.stock !== undefined && v.stock !== null ? v.stock : (v.in_stock ? 50 : 0)
          })),
        });

        // Badges parsing
        const rawBadges = p.badges;
        const parsedB = Array.isArray(rawBadges)
          ? rawBadges
          : (typeof rawBadges === 'string' ? rawBadges.split(',').map((s) => s.trim()).filter(Boolean) : []);
        setBadgesList(parsedB);

        // Ingredients parsing
        const rawIng = p.ingredients;
        const parsedI = Array.isArray(rawIng)
          ? rawIng
          : (typeof rawIng === 'string' ? rawIng.split(',').map((s) => s.trim()).filter(Boolean) : []);
        setIngredientsList(parsedI);

        // Benefits parsing
        const rawBen = p.benefits;
        const parsedBen = Array.isArray(rawBen)
          ? rawBen
          : (typeof rawBen === 'string' ? rawBen.split(',').map((s) => s.trim()).filter(Boolean) : []);
        setBenefitsList(parsedBen);

        // Nutrition Map parsing
        const rawNutr = p.nutritionFacts || p.nutrition_facts || {};
        const nMap = {};

        // Parse key-value entries
        Object.entries(rawNutr).forEach(([k, val]) => {
          if (k === 'pieces' || k === 'variant_stocks') return;
          if (val && typeof val === 'object' && val.value !== undefined) {
            nMap[k] = { label: val.label || k.replace(/_/g, ' '), value: val.value, unit: val.unit || 'g' };
          } else if (val !== undefined && val !== null && val !== '') {
            const predef = PREDEFINED_NUTRITION_LIST.find((item) => item.key === k);
            nMap[k] = {
              label: predef ? predef.label : k.replace(/_/g, ' '),
              value: val,
              unit: predef ? predef.unit : 'g',
            };
          }
        });
        setNutritionMap(nMap);

        // Check if attached to pre-booking
        const pbList = Array.isArray(pbRes.data) ? pbRes.data : (pbRes.data?.prebookings || []);
        const matchedPb = pbList.find((pb) => String(pb.productId || pb.product_id) === String(p.id || id));
        if (matchedPb) {
          setExistingPrebookingId(matchedPb.id);
          setPrebookingEnabled(matchedPb.enabled !== false);
          setPreorderAllowed(matchedPb.preorderEnabled !== false);
          const dateStr = matchedPb.launchDate || matchedPb.launch_date;
          if (dateStr) {
            setPrebookingLaunchDate(new Date(dateStr).toISOString().split('T')[0]);
          }
          setPrebookingDisplayOrder(matchedPb.displayOrder || 1);
        }
      }
    } catch (e) {
      toast.error('Failed to load product details');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleFileUpload = async (e, fieldName = 'image') => {
    const file = e.target.files?.[0];
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

  // Badge helpers
  const togglePresetBadge = (badgeName) => {
    if (badgesList.includes(badgeName)) {
      setBadgesList(badgesList.filter((b) => b !== badgeName));
    } else {
      setBadgesList([...badgesList, badgeName]);
    }
  };

  const addCustomBadge = () => {
    const clean = customBadgeInput.trim();
    if (!clean) return;
    if (!badgesList.includes(clean)) {
      setBadgesList([...badgesList, clean]);
    }
    setCustomBadgeInput('');
  };

  const removeBadge = (badgeName) => {
    setBadgesList(badgesList.filter((b) => b !== badgeName));
  };

  // Ingredient helpers
  const addSingleIngredient = () => {
    const clean = newIngredientInput.trim();
    if (!clean) return;
    if (!ingredientsList.includes(clean)) {
      setIngredientsList([...ingredientsList, clean]);
    }
    setNewIngredientInput('');
  };

  const removeIngredient = (index) => {
    setIngredientsList(ingredientsList.filter((_, i) => i !== index));
  };

  const handleBulkIngredients = () => {
    if (!bulkIngredientsInput.trim()) return;
    const splitItems = bulkIngredientsInput
      .split(/[,;\n]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const merged = Array.from(new Set([...ingredientsList, ...splitItems]));
    setIngredientsList(merged);
    setBulkIngredientsInput('');
    toast.success(`Added ${splitItems.length} ingredients.`);
  };

  // Benefit helpers
  const addBenefit = () => {
    const clean = newBenefitInput.trim();
    if (!clean) return;
    if (!benefitsList.includes(clean)) {
      setBenefitsList([...benefitsList, clean]);
    }
    setNewBenefitInput('');
  };

  const removeBenefit = (index) => {
    setBenefitsList(benefitsList.filter((_, i) => i !== index));
  };

  // Nutrition helpers
  const toggleNutritionField = (item) => {
    const exists = !!nutritionMap[item.key];
    const updated = { ...nutritionMap };
    if (exists) {
      delete updated[item.key];
    } else {
      updated[item.key] = { label: item.label, value: '', unit: item.unit };
    }
    setNutritionMap(updated);
  };

  const updateNutritionValue = (key, val) => {
    setNutritionMap((prev) => ({
      ...prev,
      [key]: { ...prev[key], value: val },
    }));
  };

  const updateNutritionUnit = (key, unitVal) => {
    setNutritionMap((prev) => ({
      ...prev,
      [key]: { ...prev[key], unit: unitVal },
    }));
  };

  const removeNutritionField = (key) => {
    const updated = { ...nutritionMap };
    delete updated[key];
    setNutritionMap(updated);
  };

  const addCustomNutritionField = () => {
    const cleanLabel = customNutritionLabel.trim();
    if (!cleanLabel) {
      toast.error('Please enter a nutrition field label.');
      return;
    }
    const customKey = `custom_${cleanLabel.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_${Date.now().toString().slice(-4)}`;
    setNutritionMap((prev) => ({
      ...prev,
      [customKey]: {
        label: cleanLabel,
        value: customNutritionValue,
        unit: customNutritionUnit || 'g',
      },
    }));
    setCustomNutritionLabel('');
    setCustomNutritionValue('');
    setCustomNutritionUnit('g');
    toast.success(`Added custom nutrition field: ${cleanLabel}`);
  };

  // Variant helpers
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
      toast.error('Product title is required.');
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
    }

    setLoading(true);

    const payload = {
      ...formData,
      pieces: formData.pieces ? String(formData.pieces).trim() : '',
      badges: badgesList,
      ingredients: ingredientsList,
      benefits: benefitsList,
      nutritionFacts: {
        ...nutritionMap,
        pieces: formData.pieces ? String(formData.pieces).trim() : '',
      },
      price: basePriceNum,
      originalPrice: formData.originalPrice !== '' && formData.originalPrice !== null ? Number(formData.originalPrice) : null,
      stock: formData.stock !== '' && formData.stock !== null ? Number(formData.stock) : (isVariantProduct ? formData.variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0) : null),
    };

    try {
      let savedProduct = null;
      if (isEdit) {
        const res = await api.put(`/products/${id}`, payload);
        savedProduct = res.data;
        toast.success('Product details updated successfully.');
      } else {
        const res = await api.post('/products', payload);
        savedProduct = res.data;
        toast.success('Product created successfully.');
      }

      const targetProductId = savedProduct?.id || savedProduct?._id || id;

      // Handle Pre-booking Config attach/update
      if (prebookingEnabled && targetProductId) {
        const pbPayload = {
          productId: targetProductId,
          title: formData.title,
          description: formData.description,
          price: basePriceNum || (formData.variants?.[0]?.price ? Number(formData.variants[0].price) : 0),
          originalPrice: Number(formData.originalPrice || basePriceNum || 0),
          category: formData.category,
          image: formData.image,
          launchDate: prebookingLaunchDate ? new Date(prebookingLaunchDate).toISOString() : new Date(Date.now() + 30 * 84600 * 1000).toISOString(),
          enabled: true,
          preorderEnabled: preorderAllowed,
          displayOrder: Number(prebookingDisplayOrder || 1),
          customHeading: formData.title,
          customDescription: formData.subtitle || formData.description,
        };

        if (existingPrebookingId) {
          await api.put(`/prebookings/${existingPrebookingId}`, pbPayload);
        } else {
          await api.post('/prebookings', pbPayload);
        }
      } else if (!prebookingEnabled && existingPrebookingId) {
        // Disable prebooking config
        await api.put(`/prebookings/${existingPrebookingId}`, { enabled: false });
      }

      refreshCategories();
      navigate('/admin/products');
    } catch (err) {
      console.error('Product save error:', err);
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

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
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
            {isEdit ? 'Modify Product Architecture' : 'New Product Entry'}
          </p>
          <h2 style={{ fontSize: 'clamp(1.15rem, 2.5vw, 1.45rem)', fontFamily: 'var(--font-serif)', color: 'var(--admin-text-primary)', fontWeight: '800', margin: 0, lineHeight: '1.25' }}>
            {isEdit ? 'Edit Product Details' : 'Add New Product'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* ================================================================== */}
          {/* SECTION 1: BASIC INFORMATION */}
          {/* ================================================================== */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '0.92rem', color: 'var(--admin-accent)', fontWeight: '850', margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid var(--admin-border)', paddingBottom: '0.4rem' }}>
              1. Basic Information
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase' }}>
                  Product Title / Name *
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
                  placeholder="e.g. Cardamom Bajra Cookies"
                  className="admin-input"
                />
              </div>

              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase' }}>
                  URL Slug *
                </label>
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="cardamom-bajra-cookies"
                  className="admin-input"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase' }}>
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
                    <option value="cookies">Cookies</option>
                  )}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase' }}>
                  Subtitle / Short Tagline
                </label>
                <input
                  type="text"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  placeholder="e.g. Pearl millet cookies with green cardamom"
                  className="admin-input"
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase' }}>
                Full Product Description *
              </label>
              <textarea
                rows={4}
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter detailed description..."
                className="admin-input"
                style={{ resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase' }}>
                  Catalog Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="admin-input"
                >
                  <option value="active">Active (Visible in Store)</option>
                  <option value="inactive">Inactive (Hidden)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase' }}>
                  Featured Product
                </label>
                <select
                  value={formData.isFeatured ? 'true' : 'false'}
                  onChange={(e) => setFormData({ ...formData, isFeatured: e.target.value === 'true' })}
                  className="admin-input"
                >
                  <option value="true">YES (Show in Featured Grid)</option>
                  <option value="false">NO (Standard Item)</option>
                </select>
              </div>
            </div>
          </div>

          {/* ================================================================== */}
          {/* SECTION 2: PRODUCT IMAGES */}
          {/* ================================================================== */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', backgroundColor: 'var(--admin-surface-elevated)', padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--admin-border)' }}>
            <h3 style={{ fontSize: '0.92rem', color: 'var(--admin-accent)', fontWeight: '850', margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid var(--admin-border)', paddingBottom: '0.4rem' }}>
              2. Product Images
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
              {/* Primary Image Upload Box */}
              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase' }}>
                  Primary Image URL / File *
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.65rem' }}>
                  <input
                    type="text"
                    required
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    placeholder="/images/image1.jpeg"
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
                    <span>{uploadingMain ? 'Uploading...' : 'Upload'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'image')}
                      style={{ display: 'none' }}
                      disabled={uploadingMain}
                    />
                  </label>
                </div>

                {formData.image && (
                  <div style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--admin-border)' }}>
                    <img src={formData.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, image: '' })}
                      style={{ position: 'absolute', top: '4px', right: '4px', backgroundColor: 'rgba(0,0,0,0.7)', border: 'none', color: '#ff5b5b', borderRadius: '4px', padding: '3px', cursor: 'pointer' }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}
              </div>

              {/* Secondary Image Upload Box */}
              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase' }}>
                  Secondary Image URL / File
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.65rem' }}>
                  <input
                    type="text"
                    value={formData.secondaryImage}
                    onChange={(e) => setFormData({ ...formData, secondaryImage: e.target.value })}
                    placeholder="Secondary image URL"
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
                    <span>{uploadingSec ? 'Uploading...' : 'Upload'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'secondaryImage')}
                      style={{ display: 'none' }}
                      disabled={uploadingSec}
                    />
                  </label>
                </div>

                {formData.secondaryImage && (
                  <div style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--admin-border)' }}>
                    <img src={formData.secondaryImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, secondaryImage: '' })}
                      style={{ position: 'absolute', top: '4px', right: '4px', backgroundColor: 'rgba(0,0,0,0.7)', border: 'none', color: '#ff5b5b', borderRadius: '4px', padding: '3px', cursor: 'pointer' }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ================================================================== */}
          {/* SECTION 3: PRODUCT BADGES */}
          {/* ================================================================== */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '0.92rem', color: 'var(--admin-accent)', fontWeight: '850', margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid var(--admin-border)', paddingBottom: '0.4rem' }}>
              3. Product Badges
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', margin: 0 }}>
              Select relevant highlight badges to display on product cards and detail pages.
            </p>

            {/* Presets Checklist */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem' }}>
              {PRESET_BADGES.map((badgeName) => {
                const isSelected = badgesList.includes(badgeName);
                return (
                  <button
                    key={badgeName}
                    type="button"
                    onClick={() => togglePresetBadge(badgeName)}
                    style={{
                      padding: '0.45rem 0.85rem',
                      borderRadius: '20px',
                      fontSize: '0.78rem',
                      fontWeight: '800',
                      cursor: 'pointer',
                      border: isSelected ? '1.5px solid var(--admin-accent)' : '1px solid var(--admin-border)',
                      backgroundColor: isSelected ? 'rgba(39, 76, 55, 0.25)' : 'var(--admin-surface-elevated)',
                      color: isSelected ? 'var(--admin-accent)' : 'var(--admin-text-muted)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {isSelected ? <CheckSquare size={14} color="var(--admin-accent)" /> : <Square size={14} />}
                    <span>{badgeName}</span>
                  </button>
                );
              })}
            </div>

            {/* Active Badges Tags & Custom Entry */}
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="text"
                value={customBadgeInput}
                onChange={(e) => setCustomBadgeInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomBadge(); } }}
                placeholder="Add custom badge..."
                className="admin-input"
                style={{ flex: 1, maxWidth: '280px' }}
              />
              <button type="button" onClick={addCustomBadge} className="admin-btn-secondary" style={{ padding: '0.6rem 0.85rem', fontSize: '0.78rem' }}>
                <Plus size={14} /> Add Badge
              </button>
            </div>

            {badgesList.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', marginTop: '0.25rem' }}>
                {badgesList.map((b) => (
                  <span key={b} style={{ backgroundColor: 'var(--admin-accent)', color: '#FFF', fontSize: '0.72rem', fontWeight: '800', padding: '0.25rem 0.65rem', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                    {b}
                    <X size={12} style={{ cursor: 'pointer' }} onClick={() => removeBadge(b)} />
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* ================================================================== */}
          {/* SECTION 4: INGREDIENTS */}
          {/* ================================================================== */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', backgroundColor: 'var(--admin-surface-elevated)', padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--admin-border)' }}>
            <h3 style={{ fontSize: '0.92rem', color: 'var(--admin-accent)', fontWeight: '850', margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid var(--admin-border)', paddingBottom: '0.4rem' }}>
              4. Ingredients
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', margin: 0 }}>
              Add handcrafted ingredients that will display on the Product Detail page.
            </p>

            {/* Single Add & Chip Display */}
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="text"
                value={newIngredientInput}
                onChange={(e) => setNewIngredientInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSingleIngredient(); } }}
                placeholder="e.g. Organic Bajra Flour"
                className="admin-input"
                style={{ flex: 1 }}
              />
              <button type="button" onClick={addSingleIngredient} className="admin-btn-secondary" style={{ padding: '0.65rem 1rem', fontSize: '0.78rem' }}>
                <Plus size={14} /> Add Ingredient
              </button>
            </div>

            {/* Bulk Import */}
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="text"
                value={bulkIngredientsInput}
                onChange={(e) => setBulkIngredientsInput(e.target.value)}
                placeholder="Or paste comma-separated ingredients..."
                className="admin-input"
                style={{ flex: 1, fontSize: '0.8rem' }}
              />
              <button type="button" onClick={handleBulkIngredients} className="admin-btn-secondary" style={{ padding: '0.65rem 0.85rem', fontSize: '0.78rem' }}>
                Bulk Import
              </button>
            </div>

            {/* Ingredient Chips List */}
            {ingredientsList.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.25rem' }}>
                {ingredientsList.map((ing, idx) => (
                  <span
                    key={idx}
                    style={{
                      padding: '0.35rem 0.75rem',
                      borderRadius: '8px',
                      backgroundColor: 'var(--admin-surface-card)',
                      border: '1px solid var(--admin-border)',
                      color: 'var(--admin-text-primary)',
                      fontSize: '0.8rem',
                      fontWeight: '700',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                    }}
                  >
                    <span>• {ing}</span>
                    <X size={13} color="var(--admin-danger)" style={{ cursor: 'pointer' }} onClick={() => removeIngredient(idx)} />
                  </span>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', fontStyle: 'italic' }}>
                No ingredients added yet.
              </div>
            )}
          </div>

          {/* ================================================================== */}
          {/* SECTION 5: NUTRITION FACTS */}
          {/* ================================================================== */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem', backgroundColor: 'var(--admin-surface-elevated)', padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--admin-border)' }}>
            <div>
              <h3 style={{ fontSize: '0.92rem', color: 'var(--admin-accent)', fontWeight: '850', margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid var(--admin-border)', paddingBottom: '0.4rem' }}>
                5. Nutrition Facts
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', margin: '0.35rem 0 0 0' }}>
                Add the nutritional information that should appear on the product page and Nutrition section. Select only the fields that apply.
              </p>
            </div>

            {/* Selectable Nutrition Fields Checklist */}
            <div>
              <label style={{ fontSize: '0.72rem', fontWeight: '800', color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase' }}>
                Select Relevant Nutrition Fields
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.5rem' }}>
                {PREDEFINED_NUTRITION_LIST.map((item) => {
                  const isChecked = !!nutritionMap[item.key];
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => toggleNutritionField(item)}
                      style={{
                        padding: '0.45rem 0.65rem',
                        borderRadius: '8px',
                        fontSize: '0.76rem',
                        fontWeight: '700',
                        textAlign: 'left',
                        cursor: 'pointer',
                        border: isChecked ? '1.5px solid var(--admin-accent)' : '1px solid var(--admin-border)',
                        backgroundColor: isChecked ? 'rgba(39, 76, 55, 0.25)' : 'var(--admin-surface-card)',
                        color: isChecked ? 'var(--admin-accent)' : 'var(--admin-text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      {isChecked ? <CheckSquare size={13} color="var(--admin-accent)" /> : <Square size={13} />}
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Nutrition Values Input Grid */}
            {Object.keys(nutritionMap).length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderTop: '1px dashed var(--admin-border)', paddingTop: '1rem' }}>
                <label style={{ fontSize: '0.72rem', fontWeight: '800', color: 'var(--admin-text-secondary)', display: 'block', textTransform: 'uppercase' }}>
                  Configured Nutrition Values &amp; Units
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.85rem' }}>
                  {Object.entries(nutritionMap).map(([key, nObj]) => (
                    <div
                      key={key}
                      style={{
                        padding: '0.75rem',
                        borderRadius: '10px',
                        backgroundColor: 'var(--admin-surface-card)',
                        border: '1px solid var(--admin-border)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.35rem',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: '800', color: 'var(--admin-text-primary)' }}>{nObj.label}</span>
                        <button
                          type="button"
                          onClick={() => removeNutritionField(key)}
                          style={{ background: 'none', border: 'none', color: 'var(--admin-danger)', cursor: 'pointer', fontSize: '0.72rem', fontWeight: '700' }}
                        >
                          Remove
                        </button>
                      </div>

                      <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center' }}>
                        <input
                          type="number"
                          step="0.01"
                          value={nObj.value !== undefined ? nObj.value : ''}
                          onChange={(e) => updateNutritionValue(key, e.target.value)}
                          placeholder="e.g. 7.8"
                          className="admin-input"
                          style={{ flex: 1, padding: '0.4rem 0.6rem', fontSize: '0.85rem', fontWeight: '700' }}
                        />
                        <input
                          type="text"
                          value={nObj.unit || 'g'}
                          onChange={(e) => updateNutritionUnit(key, e.target.value)}
                          placeholder="unit"
                          className="admin-input"
                          style={{ width: '90px', padding: '0.4rem 0.6rem', fontSize: '0.8rem', textAlign: 'center' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Custom Nutrition Field Builder */}
            <div style={{ borderTop: '1px dashed var(--admin-border)', paddingTop: '0.85rem' }}>
              <label style={{ fontSize: '0.72rem', fontWeight: '800', color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                Add Custom Nutrition Field
              </label>
              <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="Field name (e.g. Zinc)"
                  value={customNutritionLabel}
                  onChange={(e) => setCustomNutritionLabel(e.target.value)}
                  className="admin-input"
                  style={{ flex: 2, minWidth: '140px' }}
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Value (e.g. 1.5)"
                  value={customNutritionValue}
                  onChange={(e) => setCustomNutritionValue(e.target.value)}
                  className="admin-input"
                  style={{ flex: 1, minWidth: '100px' }}
                />
                <input
                  type="text"
                  placeholder="Unit (mg)"
                  value={customNutritionUnit}
                  onChange={(e) => setCustomNutritionUnit(e.target.value)}
                  className="admin-input"
                  style={{ width: '80px' }}
                />
                <button type="button" onClick={addCustomNutritionField} className="admin-btn-secondary" style={{ padding: '0.55rem 0.85rem', fontSize: '0.78rem' }}>
                  <Plus size={14} /> Add Field
                </button>
              </div>
            </div>
          </div>

          {/* ================================================================== */}
          {/* SECTION 6: LAB REPORT */}
          {/* ================================================================== */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', border: '1px solid var(--admin-border)', padding: '1.25rem', borderRadius: '14px', backgroundColor: 'var(--admin-surface-elevated)' }}>
            <h3 style={{ fontSize: '0.92rem', color: 'var(--admin-accent)', fontWeight: '850', margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid var(--admin-border)', paddingBottom: '0.4rem' }}>
              6. Lab Report
            </h3>
            <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--admin-text-muted)' }}>
              Upload official NABL laboratory analysis report (PDF or image). Only products with an active lab report will show the "Download Lab Report" button.
            </p>

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
                  accept="application/pdf,image/*"
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
                    <FileText size={13} /> View
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
                    <span>Remove</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* ================================================================== */}
          {/* SECTION 7: PRICING & VARIANTS */}
          {/* ================================================================== */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h3 style={{ fontSize: '0.92rem', color: 'var(--admin-accent)', fontWeight: '850', margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid var(--admin-border)', paddingBottom: '0.4rem' }}>
              7. Pricing, Stock &amp; Pack Variants
            </h3>

            {/* Pricing Controls Box */}
            <div style={{ backgroundColor: 'var(--admin-surface-elevated)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--admin-border)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: '800', color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase' }}>
                    Base Price (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="e.g. 99"
                    className="admin-input"
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: '800', color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase' }}>
                    Original Price / MRP (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.originalPrice}
                    onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                    placeholder="e.g. 120"
                    className="admin-input"
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: '800', color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase' }}>
                    Discount Type
                  </label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                    className="admin-input"
                  >
                    <option value="none">No Discount</option>
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Flat (₹)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: '800', color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase' }}>
                    Discount Value
                  </label>
                  <input
                    type="number"
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                    placeholder="0"
                    className="admin-input"
                  />
                </div>
              </div>
            </div>

            {/* Stock & SKU */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1.25rem' }}>
              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase' }}>
                  Total Stock Quantity
                </label>
                <input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  placeholder="e.g. 100"
                  className="admin-input"
                />
              </div>

              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase' }}>
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
                <label style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase' }}>
                  SKU Code
                </label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="MLS-PRD-001"
                  className="admin-input"
                />
              </div>
            </div>

            {/* Pack Variants List */}
            <div style={{ border: '1px solid var(--admin-border)', padding: '1.25rem', borderRadius: '12px', backgroundColor: 'var(--admin-surface-elevated)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                  <h4 style={{ fontSize: '0.92rem', color: 'var(--admin-text-primary)', fontWeight: '800', margin: 0 }}>Pack Weight Variants</h4>
                  <p style={{ fontSize: '0.74rem', color: 'var(--admin-text-muted)', margin: '0.15rem 0 0 0' }}>Add pack size options (e.g., 100g, 250g, 500g).</p>
                </div>
                <button type="button" onClick={addVariant} className="admin-btn-secondary" style={{ padding: '0.45rem 0.85rem', fontSize: '0.78rem' }}>
                  <Plus size={14} /> Add Variant Option
                </button>
              </div>

              {formData.variants && formData.variants.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {formData.variants.map((v, index) => (
                    <div key={index} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr)) 44px', gap: '0.75rem', alignItems: 'end', padding: '0.85rem', borderRadius: '10px', backgroundColor: 'var(--admin-surface-card)', border: '1px solid var(--admin-border)' }}>
                      <div>
                        <label style={{ fontSize: '0.68rem', fontWeight: '800', color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '0.35rem', textTransform: 'uppercase' }}>Name</label>
                        <input type="text" value={v.name} onChange={(e) => handleVariantChange(index, 'name', e.target.value)} placeholder="Regular Pack" className="admin-input" style={{ height: '36px', fontSize: '0.8rem' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.68rem', fontWeight: '800', color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '0.35rem', textTransform: 'uppercase' }}>Weight</label>
                        <input type="text" value={v.weight} onChange={(e) => handleVariantChange(index, 'weight', e.target.value)} placeholder="100g" className="admin-input" style={{ height: '36px', fontSize: '0.8rem' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.68rem', fontWeight: '800', color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '0.35rem', textTransform: 'uppercase' }}>Price (₹)</label>
                        <input type="number" value={v.price} onChange={(e) => handleVariantChange(index, 'price', e.target.value)} placeholder="99" className="admin-input" style={{ height: '36px', fontSize: '0.8rem' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.68rem', fontWeight: '800', color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '0.35rem', textTransform: 'uppercase' }}>Stock</label>
                        <input type="number" value={v.stock} onChange={(e) => handleVariantChange(index, 'stock', e.target.value)} placeholder="50" className="admin-input" style={{ height: '36px', fontSize: '0.8rem' }} />
                      </div>
                      <button type="button" onClick={() => removeVariant(index)} className="admin-icon-btn" style={{ color: 'var(--admin-danger)', height: '36px' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: '0.78rem', color: 'var(--admin-text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '1rem' }}>
                  No pack variants added. Product will use base price.
                </div>
              )}
            </div>
          </div>

          {/* ================================================================== */}
          {/* SECTION 8: PRODUCT BENEFITS */}
          {/* ================================================================== */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '0.92rem', color: 'var(--admin-accent)', fontWeight: '850', margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid var(--admin-border)', paddingBottom: '0.4rem' }}>
              8. Product Benefits
            </h3>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="text"
                value={newBenefitInput}
                onChange={(e) => setNewBenefitInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addBenefit(); } }}
                placeholder="e.g. Low Glycemic Index"
                className="admin-input"
                style={{ flex: 1 }}
              />
              <button type="button" onClick={addBenefit} className="admin-btn-secondary" style={{ padding: '0.65rem 1rem', fontSize: '0.78rem' }}>
                <Plus size={14} /> Add Benefit
              </button>
            </div>

            {benefitsList.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                {benefitsList.map((b, idx) => (
                  <span key={idx} style={{ backgroundColor: 'var(--admin-surface-elevated)', border: '1px solid var(--admin-border)', color: 'var(--admin-text-primary)', fontSize: '0.78rem', fontWeight: '700', padding: '0.35rem 0.75rem', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                    ✓ {b}
                    <X size={13} color="var(--admin-danger)" style={{ cursor: 'pointer' }} onClick={() => removeBenefit(idx)} />
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* ================================================================== */}
          {/* SECTION 9: SEO & METADATA */}
          {/* ================================================================== */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '0.92rem', color: 'var(--admin-accent)', fontWeight: '850', margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid var(--admin-border)', paddingBottom: '0.4rem' }}>
              9. SEO &amp; Target Audience
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase' }}>
                  Allergens Warning
                </label>
                <input
                  type="text"
                  value={formData.allergens}
                  onChange={(e) => setFormData({ ...formData, allergens: e.target.value })}
                  placeholder="e.g. Contains Tree Nuts (Almonds)"
                  className="admin-input"
                />
              </div>

              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase' }}>
                  Target Audience
                </label>
                <input
                  type="text"
                  value={formData.targetAudience}
                  onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                  placeholder="e.g. Chai Lovers & Health-Conscious Snackers"
                  className="admin-input"
                />
              </div>
            </div>
          </div>

          {/* ================================================================== */}
          {/* SECTION 10: PRE-BOOKING CONFIGURATION */}
          {/* ================================================================== */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', backgroundColor: 'var(--admin-surface-elevated)', padding: '1.25rem', borderRadius: '14px', border: '1.5px solid var(--admin-accent)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '0.92rem', color: 'var(--admin-accent)', fontWeight: '850', margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  10. Pre-Booking Section Config ("What's Next")
                </h3>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.74rem', color: 'var(--admin-text-muted)' }}>
                  Attach this product to the "What's Next from MILASTY" section on the shop page with a future launch date.
                </p>
              </div>

              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={prebookingEnabled}
                  onChange={(e) => setPrebookingEnabled(e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--admin-accent)', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--admin-text-primary)' }}>
                  {prebookingEnabled ? 'Pre-Booking Active' : 'Pre-Booking Disabled'}
                </span>
              </label>
            </div>

            {prebookingEnabled && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', borderTop: '1px dashed var(--admin-border)', paddingTop: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase' }}>
                    Launch Date *
                  </label>
                  <input
                    type="date"
                    required={prebookingEnabled}
                    value={prebookingLaunchDate}
                    onChange={(e) => setPrebookingLaunchDate(e.target.value)}
                    className="admin-input"
                  />
                  <span style={{ fontSize: '0.68rem', color: 'var(--admin-text-muted)', marginTop: '0.2rem', display: 'block' }}>
                    Future date = Product appears in "What's Next". Past date = moves to "All Bakes".
                  </span>
                </div>

                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase' }}>
                    Pre-Order Allowed
                  </label>
                  <select
                    value={preorderAllowed ? 'true' : 'false'}
                    onChange={(e) => setPreorderAllowed(e.target.value === 'true')}
                    className="admin-input"
                  >
                    <option value="true">YES (Customers can pre-book now)</option>
                    <option value="false">NO (Coming Soon preview only)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase' }}>
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={prebookingDisplayOrder}
                    onChange={(e) => setPrebookingDisplayOrder(e.target.value)}
                    placeholder="1"
                    className="admin-input"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={loading || uploadingMain || uploadingSec || uploadingReport} 
            className="admin-btn-primary" 
            style={{ 
              width: '100%', 
              height: '52px', 
              justifyContent: 'center', 
              marginTop: '1rem',
              fontSize: '0.95rem',
              textTransform: 'uppercase',
              letterSpacing: '0.06em'
            }}
          >
            <Save size={18} />
            <span>
              {loading 
                ? (isEdit ? 'Updating Product Architecture...' : 'Creating Product...') 
                : (isEdit ? 'Save Product Details' : 'Save & Publish Product')}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
}   </div>
  );
}
