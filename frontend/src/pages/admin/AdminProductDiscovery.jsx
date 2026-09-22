import React, { useState, useEffect } from 'react';
import { 
  Compass, Plus, Edit2, Trash2, Eye, Check, X, Upload, ArrowUp, ArrowDown, 
  Search, ShieldAlert, Sparkles, Layers, Image as ImageIcon, Link as LinkIcon, AlertTriangle 
} from 'lucide-react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import ConfirmationModal from '../../components/ConfirmationModal';

export default function AdminProductDiscovery() {
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [savingSection, setSavingSection] = useState(false);
  const [savingMood, setSavingMood] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Section Config State
  const [sectionConfig, setSectionConfig] = useState({
    is_active: true,
    eyebrow: 'NOT SURE WHERE TO START?',
    title: 'Find Your Perfect MILASTY Snack',
    description: 'Something light. Something crunchy. Something chocolatey. Or something to share.',
    background_image_url: '',
    explore_button_text: 'EXPLORE ALL SNACKS →',
    explore_button_url: '/shop',
  });

  // Mood Collections State
  const [moods, setMoods] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);

  // Mood Modal State
  const [moodModalOpen, setMoodModalOpen] = useState(false);
  const [editingMood, setEditingMood] = useState(null);
  const [moodName, setMoodName] = useState('');
  const [moodDescription, setMoodDescription] = useState('');
  const [moodOrder, setMoodOrder] = useState(1);
  const [moodActive, setMoodActive] = useState(true);
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [productSearch, setProductSearch] = useState('');

  // Delete Confirmation Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [moodToDelete, setMoodToDelete] = useState(null);

  // Preview State
  const [previewActiveMoodIdx, setPreviewActiveMoodIdx] = useState(0);

  useEffect(() => {
    fetchDiscoveryData();
  }, []);

  const fetchDiscoveryData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/product-discovery/admin');
      if (res.data && res.data.success) {
        if (res.data.section) setSectionConfig(res.data.section);
        if (Array.isArray(res.data.moods)) setMoods(res.data.moods);
        if (Array.isArray(res.data.availableProducts)) setAvailableProducts(res.data.availableProducts);
      }
    } catch (err) {
      console.error('Error fetching admin product discovery data:', err);
      toast.error('Failed to load Product Discovery configuration.');
    } finally {
      setLoading(false);
    }
  };

  // Section Config Handlers
  const handleSaveSectionConfig = async (e) => {
    if (e) e.preventDefault();
    setSavingSection(true);
    try {
      const res = await api.put('/product-discovery/admin/section', sectionConfig);
      if (res.data && res.data.success) {
        toast.success('Product Discovery section configuration saved.');
        if (res.data.section) setSectionConfig(res.data.section);
      }
    } catch (err) {
      console.error('Failed to save section config:', err);
      toast.error('Error saving section configuration.');
    } finally {
      setSavingSection(false);
    }
  };

  const handleToggleSectionActive = async (newActive) => {
    const updated = { ...sectionConfig, is_active: newActive };
    setSectionConfig(updated);
    try {
      await api.put('/product-discovery/admin/section', updated);
      toast.success(newActive ? 'Product Discovery section enabled.' : 'Product Discovery section disabled.');
    } catch (err) {
      toast.error('Failed to toggle section status.');
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = res.data?.imageUrl || res.data?.url || res.data?.secure_url;
      if (url) {
        setSectionConfig(prev => ({ ...prev, background_image_url: url }));
        toast.success('Background image uploaded successfully.');
      }
    } catch (err) {
      console.error('Upload failed:', err);
      toast.error('Image upload failed.');
    } finally {
      setUploadingImage(false);
    }
  };

  // Mood Modal Openers
  const handleOpenAddMood = () => {
    setEditingMood(null);
    setMoodName('');
    setMoodDescription('');
    setMoodOrder(moods.length + 1);
    setMoodActive(true);
    setSelectedProductIds([]);
    setProductSearch('');
    setMoodModalOpen(true);
  };

  const handleOpenEditMood = (m) => {
    setEditingMood(m);
    setMoodName(m.name || '');
    setMoodDescription(m.description || '');
    setMoodOrder(m.display_order || 1);
    setMoodActive(m.is_active !== false);
    setSelectedProductIds(m.product_ids || []);
    setProductSearch('');
    setMoodModalOpen(true);
  };

  // Save Mood Handler
  const handleSaveMood = async (e) => {
    e.preventDefault();
    if (!moodName.trim()) {
      toast.error('Mood collection name is required.');
      return;
    }

    setSavingMood(true);
    const payload = {
      name: moodName.trim(),
      description: moodDescription.trim(),
      display_order: Number(moodOrder || 1),
      is_active: moodActive,
      product_ids: selectedProductIds,
    };

    try {
      if (editingMood) {
        await api.put(`/product-discovery/admin/moods/${editingMood.id}`, payload);
        toast.success('Mood collection updated successfully.');
      } else {
        await api.post('/product-discovery/admin/moods', payload);
        toast.success('Mood collection created successfully.');
      }
      setMoodModalOpen(false);
      fetchDiscoveryData();
    } catch (err) {
      console.error('Error saving mood:', err);
      toast.error('Failed to save mood collection.');
    } finally {
      setSavingMood(false);
    }
  };

  // Toggle Mood Active Status
  const handleToggleMoodActive = async (m) => {
    try {
      const newActive = !m.is_active;
      await api.put(`/product-discovery/admin/moods/${m.id}`, { is_active: newActive });
      setMoods(prev => prev.map(item => item.id === m.id ? { ...item, is_active: newActive } : item));
      toast.success(`Mood "${m.name}" ${newActive ? 'activated' : 'deactivated'}.`);
    } catch (err) {
      toast.error('Failed to update mood status.');
    }
  };

  // Reorder Moods Handler
  const handleMoveMood = async (index, direction) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= moods.length) return;

    const newMoods = [...moods];
    const temp = newMoods[index];
    newMoods[index] = newMoods[targetIdx];
    newMoods[targetIdx] = temp;

    // Update display orders
    const reordered = newMoods.map((m, idx) => ({ ...m, display_order: idx + 1 }));
    setMoods(reordered);

    try {
      await api.post('/product-discovery/admin/moods/reorder', {
        orderedIds: reordered.map(m => m.id),
      });
      toast.success('Mood order updated.');
    } catch (err) {
      toast.error('Failed to reorder moods.');
      fetchDiscoveryData();
    }
  };

  // Delete Mood Handler
  const handleConfirmDeleteMood = async () => {
    if (!moodToDelete) return;
    try {
      await api.delete(`/product-discovery/admin/moods/${moodToDelete.id}`);
      toast.success(`Mood "${moodToDelete.name}" deleted.`);
      setDeleteModalOpen(false);
      setMoodToDelete(null);
      fetchDiscoveryData();
    } catch (err) {
      toast.error('Failed to delete mood collection.');
    }
  };

  // Product Selector Checkbox Toggle
  const handleToggleProductSelection = (pid) => {
    setSelectedProductIds(prev => 
      prev.includes(pid) ? prev.filter(id => id !== pid) : [...prev, pid]
    );
  };

  const handleSelectAllProducts = (filteredList) => {
    const allFilteredIds = filteredList.map(p => p.id);
    const isAllSelected = allFilteredIds.every(id => selectedProductIds.includes(id));
    if (isAllSelected) {
      setSelectedProductIds(prev => prev.filter(id => !allFilteredIds.includes(id)));
    } else {
      const combined = new Set([...selectedProductIds, ...allFilteredIds]);
      setSelectedProductIds(Array.from(combined));
    }
  };

  // Calculate Metrics
  const activeMoodsCount = moods.filter(m => m.is_active !== false).length;
  const totalAssignedProductsCount = Array.from(
    new Set(moods.flatMap(m => m.product_ids || []))
  ).length;

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--admin-text-secondary)' }}>
        <div className="admin-spinner" style={{ margin: '0 auto 1rem' }} />
        <p>Loading Product Discovery configuration...</p>
      </div>
    );
  }

  const activeMoodsForPreview = moods.filter(m => m.is_active !== false);
  const currentPreviewMood = activeMoodsForPreview[previewActiveMoodIdx] || activeMoodsForPreview[0];
  const currentPreviewProducts = currentPreviewMood
    ? (currentPreviewMood.product_ids || [])
        .map(pid => availableProducts.find(p => String(p.id) === String(pid)))
        .filter(p => Boolean(p) && p.is_active !== false)
    : [];

  return (
    <div style={{ paddingBottom: '4rem' }}>
      
      {/* -------------------------------------------------------------------- */}
      {/* 1. TOP HEADER & METRICS                                              */}
      {/* -------------------------------------------------------------------- */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
            <Compass size={24} color="var(--admin-accent)" />
            <h1 style={{ fontSize: '1.6rem', color: 'var(--admin-text-primary)', fontFamily: 'var(--font-serif)', margin: 0 }}>
              Product Discovery by Mood
            </h1>
          </div>
          <p style={{ color: 'var(--admin-text-secondary)', fontSize: '0.88rem', margin: 0 }}>
            Manage the interactive "Find Your Perfect MILASTY Snack" section on the homepage.
          </p>
        </div>

        {/* Global ON / OFF Section Toggle Card */}
        <div 
          style={{ 
            backgroundColor: 'var(--admin-card-bg)', 
            border: '1px solid var(--admin-border)', 
            borderRadius: '12px', 
            padding: '0.75rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}
        >
          <div>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--admin-text-muted)', fontWeight: '800' }}>
              SHOW ON HOMEPAGE
            </div>
            <div style={{ fontSize: '0.9rem', fontWeight: '800', color: sectionConfig.is_active ? '#A3C878' : '#E57373' }}>
              {sectionConfig.is_active ? 'SECTION IS ACTIVE' : 'SECTION IS HIDDEN'}
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleToggleSectionActive(!sectionConfig.is_active)}
            style={{
              padding: '0.5rem 1.15rem',
              borderRadius: '999px',
              border: 'none',
              backgroundColor: sectionConfig.is_active ? '#2E4C1E' : '#4A1D1D',
              color: sectionConfig.is_active ? '#C5E1A5' : '#FFCDD2',
              fontWeight: '800',
              fontSize: '0.82rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
            }}
          >
            {sectionConfig.is_active ? 'ON (VISIBLE)' : 'OFF (HIDDEN)'}
          </button>
        </div>
      </div>

      {/* Quick Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
        <div style={{ backgroundColor: 'var(--admin-card-bg)', border: '1px solid var(--admin-border)', borderRadius: '12px', padding: '1.25rem' }}>
          <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--admin-text-muted)', fontWeight: '800', marginBottom: '0.35rem' }}>Section Visibility</div>
          <div style={{ fontSize: '1.4rem', fontWeight: '900', color: sectionConfig.is_active ? '#A3C878' : '#E57373' }}>
            {sectionConfig.is_active ? 'Active' : 'Disabled'}
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--admin-card-bg)', border: '1px solid var(--admin-border)', borderRadius: '12px', padding: '1.25rem' }}>
          <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--admin-text-muted)', fontWeight: '800', marginBottom: '0.35rem' }}>Mood Collections</div>
          <div style={{ fontSize: '1.4rem', fontWeight: '900', color: 'var(--admin-text-primary)' }}>
            {activeMoodsCount} Active <span style={{ fontSize: '0.9rem', color: 'var(--admin-text-muted)', fontWeight: '600' }}>({moods.length} total)</span>
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--admin-card-bg)', border: '1px solid var(--admin-border)', borderRadius: '12px', padding: '1.25rem' }}>
          <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--admin-text-muted)', fontWeight: '800', marginBottom: '0.35rem' }}>Assigned Products</div>
          <div style={{ fontSize: '1.4rem', fontWeight: '900', color: 'var(--admin-text-primary)' }}>
            {totalAssignedProductsCount} Products
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* 2. SECTION CONTENT MANAGEMENT FORM                                   */}
      {/* -------------------------------------------------------------------- */}
      <form onSubmit={handleSaveSectionConfig} style={{ backgroundColor: 'var(--admin-card-bg)', border: '1px solid var(--admin-border)', borderRadius: '16px', padding: '1.75rem', marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.15rem', color: 'var(--admin-text-primary)', margin: '0 0 1.25rem', fontFamily: 'var(--font-serif)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sparkles size={18} color="var(--admin-accent)" />
          Section Content Settings
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--admin-text-secondary)', fontWeight: '700', marginBottom: '0.4rem' }}>
              SECTION EYEBROW
            </label>
            <input
              type="text"
              value={sectionConfig.eyebrow}
              onChange={e => setSectionConfig({ ...sectionConfig, eyebrow: e.target.value })}
              placeholder="e.g. NOT SURE WHERE TO START?"
              style={{ width: '100%', padding: '0.65rem 0.85rem', backgroundColor: '#1A120B', border: '1px solid var(--admin-border)', borderRadius: '8px', color: '#FFFFFF', fontSize: '0.88rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--admin-text-secondary)', fontWeight: '700', marginBottom: '0.4rem' }}>
              HEADLINE
            </label>
            <input
              type="text"
              value={sectionConfig.title}
              onChange={e => setSectionConfig({ ...sectionConfig, title: e.target.value })}
              placeholder="e.g. Find Your Perfect MILASTY Snack"
              style={{ width: '100%', padding: '0.65rem 0.85rem', backgroundColor: '#1A120B', border: '1px solid var(--admin-border)', borderRadius: '8px', color: '#FFFFFF', fontSize: '0.88rem' }}
            />
          </div>
        </div>

        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--admin-text-secondary)', fontWeight: '700', marginBottom: '0.4rem' }}>
            DESCRIPTION
          </label>
          <textarea
            rows={2}
            value={sectionConfig.description}
            onChange={e => setSectionConfig({ ...sectionConfig, description: e.target.value })}
            placeholder="Subheading paragraph describing the mood selection..."
            style={{ width: '100%', padding: '0.65rem 0.85rem', backgroundColor: '#1A120B', border: '1px solid var(--admin-border)', borderRadius: '8px', color: '#FFFFFF', fontSize: '0.88rem', resize: 'vertical' }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--admin-text-secondary)', fontWeight: '700', marginBottom: '0.4rem' }}>
              EXPLORE ALL BUTTON TEXT
            </label>
            <input
              type="text"
              value={sectionConfig.explore_button_text}
              onChange={e => setSectionConfig({ ...sectionConfig, explore_button_text: e.target.value })}
              placeholder="e.g. EXPLORE ALL SNACKS →"
              style={{ width: '100%', padding: '0.65rem 0.85rem', backgroundColor: '#1A120B', border: '1px solid var(--admin-border)', borderRadius: '8px', color: '#FFFFFF', fontSize: '0.88rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--admin-text-secondary)', fontWeight: '700', marginBottom: '0.4rem' }}>
              EXPLORE ALL BUTTON DESTINATION URL
            </label>
            <input
              type="text"
              value={sectionConfig.explore_button_url}
              onChange={e => setSectionConfig({ ...sectionConfig, explore_button_url: e.target.value })}
              placeholder="e.g. /shop"
              style={{ width: '100%', padding: '0.65rem 0.85rem', backgroundColor: '#1A120B', border: '1px solid var(--admin-border)', borderRadius: '8px', color: '#FFFFFF', fontSize: '0.88rem' }}
            />
          </div>
        </div>

        {/* Cloudinary Background Image Upload */}
        <div style={{ marginBottom: '1.75rem', paddingTop: '1rem', borderTop: '1px solid var(--admin-border)' }}>
          <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--admin-text-secondary)', fontWeight: '700', marginBottom: '0.6rem' }}>
            SECTION BACKGROUND IMAGE (OPTIONAL)
          </label>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
            {sectionConfig.background_image_url ? (
              <div style={{ position: 'relative', width: '140px', height: '80px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--admin-border)' }}>
                <img src={sectionConfig.background_image_url} alt="Section Background" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button
                  type="button"
                  onClick={() => setSectionConfig({ ...sectionConfig, background_image_url: '' })}
                  style={{ position: 'absolute', top: '4px', right: '4px', backgroundColor: 'rgba(0,0,0,0.7)', border: 'none', color: '#FF8888', borderRadius: '50%', width: '22px', height: '22px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div style={{ width: '140px', height: '80px', borderRadius: '8px', border: '2px dashed var(--admin-border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--admin-text-muted)', fontSize: '0.75rem' }}>
                <ImageIcon size={20} style={{ marginBottom: '0.2rem' }} />
                <span>No Custom Image</span>
              </div>
            )}

            <div style={{ flex: 1 }}>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                id="bg-image-upload"
                style={{ display: 'none' }}
              />
              <label
                htmlFor="bg-image-upload"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.6rem 1.25rem',
                  backgroundColor: 'rgba(184, 204, 122, 0.15)',
                  border: '1px solid #B8CC7A',
                  color: '#B8CC7A',
                  borderRadius: '8px',
                  fontWeight: '700',
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                <Upload size={16} />
                <span>{uploadingImage ? 'Uploading Image...' : (sectionConfig.background_image_url ? 'Replace Image' : 'Upload Cloudinary Image')}</span>
              </label>
              {sectionConfig.background_image_url && (
                <button
                  type="button"
                  onClick={() => setSectionConfig({ ...sectionConfig, background_image_url: '' })}
                  style={{ marginLeft: '0.75rem', background: 'none', border: 'none', color: '#FF8888', fontSize: '0.82rem', fontWeight: '700', cursor: 'pointer' }}
                >
                  Remove Image
                </button>
              )}
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <button
            type="submit"
            disabled={savingSection}
            style={{
              padding: '0.75rem 2rem',
              backgroundColor: '#2E4C1E',
              color: '#FFFFFF',
              border: '1.5px solid #A3C878',
              borderRadius: '8px',
              fontWeight: '800',
              fontSize: '0.9rem',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(46, 76, 30, 0.4)'
            }}
          >
            {savingSection ? 'Saving Settings...' : 'Save Section Settings'}
          </button>
        </div>
      </form>

      {/* -------------------------------------------------------------------- */}
      {/* 3. MOOD COLLECTIONS MANAGEMENT                                       */}
      {/* -------------------------------------------------------------------- */}
      <div style={{ backgroundColor: 'var(--admin-card-bg)', border: '1px solid var(--admin-border)', borderRadius: '16px', padding: '1.75rem', marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', color: 'var(--admin-text-primary)', margin: 0, fontFamily: 'var(--font-serif)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Layers size={18} color="var(--admin-accent)" />
              Mood Collections ({moods.length})
            </h2>
            <p style={{ color: 'var(--admin-text-secondary)', fontSize: '0.82rem', margin: '0.2rem 0 0' }}>
              Administer mood buttons and their assigned product cards on the homepage.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenAddMood}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 1.35rem',
              backgroundColor: '#2E4C1E',
              color: '#FFFFFF',
              border: '1px solid #A3C878',
              borderRadius: '8px',
              fontWeight: '800',
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            <Plus size={16} />
            <span>+ Add Mood Collection</span>
          </button>
        </div>

        {/* Mood Cards List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {moods.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--admin-text-muted)' }}>
              No mood collections found. Click <strong>"+ Add Mood Collection"</strong> to create one.
            </div>
          ) : (
            moods.map((mood, idx) => {
              const assignedProds = (mood.product_ids || [])
                .map(pid => availableProducts.find(p => String(p.id) === String(pid)))
                .filter(Boolean);

              const hasInactiveProducts = assignedProds.some(p => p.is_active === false);
              const is0Products = assignedProds.length === 0;

              return (
                <div
                  key={mood.id}
                  style={{
                    backgroundColor: '#17100B',
                    border: mood.is_active ? '1px solid var(--admin-border)' : '1px dashed #663333',
                    borderRadius: '12px',
                    padding: '1.25rem',
                    opacity: mood.is_active ? 1 : 0.7,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: '800', color: 'var(--admin-accent)', backgroundColor: 'rgba(184, 204, 122, 0.12)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                          ORDER #{mood.display_order || idx + 1}
                        </span>
                        <h3 style={{ fontSize: '1.05rem', color: '#FFFFFF', fontWeight: '800', margin: 0 }}>
                          {mood.name}
                        </h3>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: '800',
                            padding: '0.15rem 0.55rem',
                            borderRadius: '999px',
                            backgroundColor: mood.is_active ? 'rgba(163, 200, 120, 0.2)' : 'rgba(255, 100, 100, 0.2)',
                            color: mood.is_active ? '#A3C878' : '#FF8888',
                            border: mood.is_active ? '1px solid #A3C878' : '1px solid #FF8888',
                          }}
                        >
                          {mood.is_active ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </div>

                      {mood.description && (
                        <p style={{ fontSize: '0.85rem', color: 'var(--admin-text-secondary)', margin: '0 0 0.5rem' }}>
                          {mood.description}
                        </p>
                      )}

                      {/* Warning Badges */}
                      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                        {is0Products && (
                          <span style={{ fontSize: '0.75rem', color: '#FFB74D', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontWeight: '700' }}>
                            <AlertTriangle size={14} /> This mood has no products assigned.
                          </span>
                        )}
                        {hasInactiveProducts && (
                          <span style={{ fontSize: '0.75rem', color: '#E57373', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontWeight: '700' }}>
                            <AlertTriangle size={14} /> 1 or more assigned products are inactive.
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {/* Reorder Buttons */}
                      <button
                        type="button"
                        onClick={() => handleMoveMood(idx, -1)}
                        disabled={idx === 0}
                        style={{ padding: '0.4rem', backgroundColor: '#261B12', border: '1px solid var(--admin-border)', color: idx === 0 ? '#555' : '#FFF', borderRadius: '6px', cursor: idx === 0 ? 'not-allowed' : 'pointer' }}
                        title="Move Up"
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveMood(idx, 1)}
                        disabled={idx === moods.length - 1}
                        style={{ padding: '0.4rem', backgroundColor: '#261B12', border: '1px solid var(--admin-border)', color: idx === moods.length - 1 ? '#555' : '#FFF', borderRadius: '6px', cursor: idx === moods.length - 1 ? 'not-allowed' : 'pointer' }}
                        title="Move Down"
                      >
                        <ArrowDown size={14} />
                      </button>

                      {/* Edit Mood */}
                      <button
                        type="button"
                        onClick={() => handleOpenEditMood(mood)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.45rem 0.85rem', backgroundColor: 'rgba(184, 204, 122, 0.15)', border: '1px solid #B8CC7A', color: '#B8CC7A', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer' }}
                      >
                        <Edit2 size={14} /> Edit & Assign Products
                      </button>

                      {/* Toggle Active */}
                      <button
                        type="button"
                        onClick={() => handleToggleMoodActive(mood)}
                        style={{ padding: '0.45rem 0.75rem', backgroundColor: '#261B12', border: '1px solid var(--admin-border)', color: mood.is_active ? '#FFB74D' : '#A3C878', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer' }}
                      >
                        {mood.is_active ? 'Deactivate' : 'Activate'}
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => { setMoodToDelete(mood); setDeleteModalOpen(true); }}
                        style={{ padding: '0.45rem 0.65rem', backgroundColor: 'rgba(255,100,100,0.1)', border: '1px solid rgba(255,100,100,0.3)', color: '#FF8888', borderRadius: '6px', cursor: 'pointer' }}
                        title="Delete Mood"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Assigned Products Thumbnails */}
                  <div style={{ paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--admin-text-muted)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                      ASSIGNED PRODUCTS ({assignedProds.length}):
                    </div>
                    {assignedProds.length === 0 ? (
                      <span style={{ fontSize: '0.82rem', color: 'var(--admin-text-muted)', fontStyle: 'italic' }}>None</span>
                    ) : (
                      <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
                        {assignedProds.map((prod) => (
                          <div key={prod.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', backgroundColor: '#231811', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '6px', padding: '0.35rem 0.65rem', fontSize: '0.78rem', color: '#FFFDF9' }}>
                            {prod.image && <img src={prod.image} alt={prod.name} style={{ width: '20px', height: '20px', borderRadius: '50%', objectFit: 'cover' }} />}
                            <span>{prod.name}</span>
                            <span style={{ color: 'var(--admin-accent)', fontWeight: '800' }}>₹{prod.price}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* 4. LIVE HOMEPAGE PREVIEW                                             */}
      {/* -------------------------------------------------------------------- */}
      <div style={{ backgroundColor: 'rgba(20, 10, 5, 0.75)', border: '1.5px solid var(--admin-accent)', borderRadius: '20px', padding: '2rem 1.5rem', marginBottom: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--admin-accent)', fontWeight: '800', backgroundColor: 'rgba(184, 204, 122, 0.15)', padding: '0.35rem 0.85rem', borderRadius: '999px', display: 'inline-block', marginBottom: '0.5rem' }}>
            ✦ LIVE HOMEPAGE PREVIEW
          </span>
          <p style={{ color: 'var(--admin-text-secondary)', fontSize: '0.82rem', margin: 0 }}>
            Real-time preview of how visitors see this section on the live website.
          </p>
        </div>

        {!sectionConfig.is_active ? (
          <div style={{ textAlign: 'center', padding: '2.5rem', color: '#FF8888', backgroundColor: 'rgba(255,100,100,0.1)', borderRadius: '12px' }}>
            <strong>[SECTION IS CURRENTLY HIDDEN ON HOMEPAGE]</strong>
          </div>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '0.82rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--accent-gold, #c89b3c)', fontWeight: '800', display: 'block', marginBottom: '0.5rem' }}>
              {sectionConfig.eyebrow}
            </span>
            <h2 style={{ fontSize: '2rem', color: '#FFFDF9', fontFamily: 'var(--font-serif)', fontWeight: '800', margin: '0 0 0.5rem' }}>
              {sectionConfig.title}
            </h2>
            <p style={{ color: 'rgba(255, 255, 255, 0.88)', fontSize: '0.92rem', margin: '0 auto 2rem', maxWidth: '600px' }}>
              {sectionConfig.description}
            </p>

            {/* Mood Pills Preview */}
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.65rem', marginBottom: '2rem' }}>
              {activeMoodsForPreview.map((m, idx) => {
                const isSelected = (previewActiveMoodIdx === idx);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPreviewActiveMoodIdx(idx)}
                    style={{
                      padding: '0.65rem 1.25rem',
                      borderRadius: '999px',
                      backgroundColor: isSelected ? '#244f21' : 'rgba(35, 21, 13, 0.65)',
                      border: isSelected ? '1.5px solid #b9cd94' : '1px solid rgba(255, 255, 255, 0.18)',
                      color: isSelected ? '#FFFDF9' : 'rgba(255, 255, 255, 0.85)',
                      fontSize: '0.85rem',
                      fontWeight: '800',
                      cursor: 'pointer'
                    }}
                  >
                    {m.name}
                  </button>
                );
              })}
            </div>

            {/* Products Preview Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              {currentPreviewProducts.length === 0 ? (
                <div style={{ gridColumn: '1 / -1', padding: '2rem', color: 'rgba(255, 255, 255, 0.7)', fontStyle: 'italic' }}>
                  No snacks added to this collection yet.
                </div>
              ) : (
                currentPreviewProducts.slice(0, 4).map((p) => (
                  <div key={p.id} style={{ backgroundColor: 'rgba(35, 21, 13, 0.8)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '16px', padding: '1rem', textAlign: 'left' }}>
                    {p.image && <img src={p.image} alt={p.name} style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '10px', marginBottom: '0.75rem' }} />}
                    <h4 style={{ fontSize: '0.95rem', color: '#FFFDF9', fontWeight: '800', margin: '0 0 0.25rem' }}>{p.name}</h4>
                    <span style={{ fontSize: '0.82rem', color: '#b9cd94', fontWeight: '800' }}>₹{p.price}</span>
                  </div>
                ))
              )}
            </div>

            <div style={{ display: 'inline-block', padding: '0.75rem 1.75rem', backgroundColor: '#244f21', color: '#FFF', borderRadius: '999px', fontWeight: '800', fontSize: '0.88rem', border: '1.5px solid #b9cd94' }}>
              {sectionConfig.explore_button_text}
            </div>
          </div>
        )}
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* 5. ADD / EDIT MOOD MODAL                                             */}
      {/* -------------------------------------------------------------------- */}
      {moodModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ backgroundColor: '#1A120B', border: '1px solid var(--admin-border)', borderRadius: '20px', width: '100%', maxWidth: '750px', maxHeight: '90vh', overflowY: 'auto', padding: '1.75rem', boxShadow: '0 20px 50px rgba(0,0,0,0.6)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--admin-border)', paddingBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.2rem', color: '#FFFDF9', fontFamily: 'var(--font-serif)', margin: 0 }}>
                {editingMood ? `Edit Mood: ${editingMood.name}` : 'Add New Mood Collection'}
              </h3>
              <button
                type="button"
                onClick={() => setMoodModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--admin-text-secondary)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveMood}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--admin-text-secondary)', fontWeight: '700', marginBottom: '0.4rem' }}>
                    MOOD NAME *
                  </label>
                  <input
                    type="text"
                    required
                    value={moodName}
                    onChange={e => setMoodName(e.target.value)}
                    placeholder="e.g. I CRAVE CHOCOLATE"
                    style={{ width: '100%', padding: '0.65rem 0.85rem', backgroundColor: '#261B12', border: '1px solid var(--admin-border)', borderRadius: '8px', color: '#FFFFFF', fontSize: '0.88rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--admin-text-secondary)', fontWeight: '700', marginBottom: '0.4rem' }}>
                    DISPLAY ORDER
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={moodOrder}
                    onChange={e => setMoodOrder(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', backgroundColor: '#261B12', border: '1px solid var(--admin-border)', borderRadius: '8px', color: '#FFFFFF', fontSize: '0.88rem' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--admin-text-secondary)', fontWeight: '700', marginBottom: '0.4rem' }}>
                  SHORT DESCRIPTION
                </label>
                <input
                  type="text"
                  value={moodDescription}
                  onChange={e => setMoodDescription(e.target.value)}
                  placeholder="e.g. For those moments when chocolate is non-negotiable."
                  style={{ width: '100%', padding: '0.65rem 0.85rem', backgroundColor: '#261B12', border: '1px solid var(--admin-border)', borderRadius: '8px', color: '#FFFFFF', fontSize: '0.88rem' }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.88rem', color: '#FFFDF9', fontWeight: '700' }}>
                  <input
                    type="checkbox"
                    checked={moodActive}
                    onChange={e => setMoodActive(e.target.checked)}
                  />
                  <span>Active Collection (Show on Homepage)</span>
                </label>
              </div>

              {/* SEARCHABLE PRODUCT SELECTOR */}
              <div style={{ borderTop: '1px solid var(--admin-border)', paddingTop: '1.25rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--admin-accent)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    ASSIGN PRODUCTS ({selectedProductIds.length} selected)
                  </label>

                  {/* Search Bar */}
                  <div style={{ position: 'relative', width: '220px' }}>
                    <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--admin-text-muted)' }} />
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={productSearch}
                      onChange={e => setProductSearch(e.target.value)}
                      style={{ width: '100%', padding: '0.4rem 0.6rem 0.4rem 2rem', backgroundColor: '#261B12', border: '1px solid var(--admin-border)', borderRadius: '6px', color: '#FFF', fontSize: '0.8rem' }}
                    />
                  </div>
                </div>

                {/* Filtered Products Checkbox List */}
                <div style={{ maxHeight: '240px', overflowY: 'auto', border: '1px solid var(--admin-border)', borderRadius: '10px', backgroundColor: '#130C07', padding: '0.75rem' }}>
                  {(() => {
                    const filtered = availableProducts.filter(p => 
                      (p.name || '').toLowerCase().includes(productSearch.toLowerCase()) ||
                      (p.category || '').toLowerCase().includes(productSearch.toLowerCase())
                    );

                    if (filtered.length === 0) {
                      return <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--admin-text-muted)', fontSize: '0.85rem' }}>No products match your search.</div>;
                    }

                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', fontWeight: '700' }}>Showing {filtered.length} products</span>
                          <button
                            type="button"
                            onClick={() => handleSelectAllProducts(filtered)}
                            style={{ background: 'none', border: 'none', color: 'var(--admin-accent)', fontSize: '0.78rem', fontWeight: '800', cursor: 'pointer' }}
                          >
                            Toggle Select All
                          </button>
                        </div>

                        {filtered.map((prod) => {
                          const isChecked = selectedProductIds.includes(prod.id);
                          return (
                            <label
                              key={prod.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '0.5rem 0.75rem',
                                borderRadius: '6px',
                                backgroundColor: isChecked ? 'rgba(46, 76, 30, 0.3)' : 'transparent',
                                border: isChecked ? '1px solid #2E4C1E' : '1px solid transparent',
                                cursor: 'pointer'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleToggleProductSelection(prod.id)}
                                />
                                {prod.image && <img src={prod.image} alt={prod.name} style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />}
                                <div>
                                  <div style={{ fontSize: '0.85rem', color: '#FFFDF9', fontWeight: '700' }}>{prod.name}</div>
                                  <div style={{ fontSize: '0.72rem', color: 'var(--admin-text-muted)' }}>{prod.category}</div>
                                </div>
                              </div>
                              <div style={{ fontSize: '0.82rem', color: 'var(--admin-accent)', fontWeight: '800' }}>
                                ₹{prod.price}
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--admin-border)', paddingTop: '1.25rem' }}>
                <button
                  type="button"
                  onClick={() => setMoodModalOpen(false)}
                  style={{ padding: '0.65rem 1.25rem', backgroundColor: 'transparent', border: '1px solid var(--admin-border)', color: 'var(--admin-text-secondary)', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '700' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingMood}
                  style={{ padding: '0.65rem 1.75rem', backgroundColor: '#2E4C1E', border: '1.5px solid #A3C878', color: '#FFFFFF', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '800' }}
                >
                  {savingMood ? 'Saving...' : 'Save Mood Collection'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        title="Delete Mood Collection?"
        message={`Are you sure you want to delete "${moodToDelete?.name}"? Product relationships for this mood will be removed. (Actual products in catalog will NOT be deleted).`}
        onConfirm={handleConfirmDeleteMood}
        onCancel={() => { setDeleteModalOpen(false); setMoodToDelete(null); }}
      />

    </div>
  );
}
