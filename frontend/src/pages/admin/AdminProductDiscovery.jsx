import React, { useState, useEffect } from 'react';
import { 
  Compass, Plus, Edit2, Trash2, X, ArrowUp, ArrowDown, 
  Search, Sparkles, Layers, AlertTriangle 
} from 'lucide-react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import ConfirmationModal from '../../components/ConfirmationModal';

export default function AdminProductDiscovery() {
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [savingSection, setSavingSection] = useState(false);
  const [savingMood, setSavingMood] = useState(false);

  // Section Config State
  const [sectionConfig, setSectionConfig] = useState({
    is_active: true,
    eyebrow: 'NOT SURE WHERE TO START?',
    title: 'Find Your Perfect MILASTY Snack',
    description: 'Something light. Something crunchy. Something chocolatey. Or something to share.',
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
    // Ensure product_ids are deduplicated
    const uniqueIds = Array.from(new Set((m.product_ids || []).map(id => String(id))));
    setSelectedProductIds(uniqueIds);
    setProductSearch('');
    setMoodModalOpen(true);
  };

  // Save Mood Handler
  const handleSaveMood = async (e) => {
    e.preventDefault();
    if (!moodName.trim()) {
      toast.error('Mood category name is required.');
      return;
    }

    setSavingMood(true);
    // Deduplicate product IDs before sending
    const uniqueIds = Array.from(new Set(selectedProductIds.map(id => String(id))));

    const payload = {
      name: moodName.trim(),
      description: moodDescription.trim(),
      display_order: Number(moodOrder || 1),
      is_active: moodActive,
      product_ids: uniqueIds,
    };

    try {
      if (editingMood) {
        await api.put(`/product-discovery/admin/moods/${editingMood.id}`, payload);
        toast.success('Mood category updated successfully.');
      } else {
        await api.post('/product-discovery/admin/moods', payload);
        toast.success('Mood category created successfully.');
      }
      setMoodModalOpen(false);
      fetchDiscoveryData();
    } catch (err) {
      console.error('Error saving mood:', err);
      toast.error('Failed to save mood category.');
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
      toast.success(`Category "${m.name}" ${newActive ? 'activated' : 'deactivated'}.`);
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
      toast.success(`Category "${moodToDelete.name}" deleted.`);
      setDeleteModalOpen(false);
      setMoodToDelete(null);
      fetchDiscoveryData();
    } catch (err) {
      toast.error('Failed to delete mood category.');
    }
  };

  // Product Selector Checkbox Toggle
  const handleToggleProductSelection = (pid) => {
    const strId = String(pid);
    setSelectedProductIds(prev => {
      const exists = prev.some(id => String(id) === strId);
      if (exists) {
        return prev.filter(id => String(id) !== strId);
      } else {
        return Array.from(new Set([...prev, strId]));
      }
    });
  };

  const handleSelectAllProducts = (filteredList) => {
    const allFilteredIds = filteredList.map(p => String(p.id));
    const isAllSelected = allFilteredIds.every(id => selectedProductIds.some(spid => String(spid) === id));
    if (isAllSelected) {
      setSelectedProductIds(prev => prev.filter(id => !allFilteredIds.includes(String(id))));
    } else {
      const combined = new Set([...selectedProductIds.map(String), ...allFilteredIds]);
      setSelectedProductIds(Array.from(combined));
    }
  };

  // Calculate Metrics
  const activeMoodsCount = moods.filter(m => m.is_active !== false).length;
  const totalAssignedProductsCount = Array.from(
    new Set(moods.flatMap(m => (m.product_ids || []).map(String)))
  ).length;

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--admin-text-secondary)' }}>
        <div className="admin-spinner" style={{ margin: '0 auto 1rem' }} />
        <p>Loading Product Discovery configuration...</p>
      </div>
    );
  }

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
          <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--admin-text-muted)', fontWeight: '800', marginBottom: '0.35rem' }}>Mood Categories</div>
          <div style={{ fontSize: '1.4rem', fontWeight: '900', color: 'var(--admin-text-primary)' }}>
            {activeMoodsCount} Active <span style={{ fontSize: '0.9rem', color: 'var(--admin-text-muted)', fontWeight: '600' }}>({moods.length} total)</span>
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--admin-card-bg)', border: '1px solid var(--admin-border)', borderRadius: '12px', padding: '1.25rem' }}>
          <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--admin-text-muted)', fontWeight: '800', marginBottom: '0.35rem' }}>Assigned Products</div>
          <div style={{ fontSize: '1.4rem', fontWeight: '900', color: 'var(--admin-text-primary)' }}>
            {totalAssignedProductsCount} Unique Products
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
              style={{ width: '100%', padding: '0.65rem 0.85rem', backgroundColor: '#252525', border: '1px solid var(--admin-border)', borderRadius: '8px', color: '#FFFFFF', fontSize: '0.88rem' }}
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
              style={{ width: '100%', padding: '0.65rem 0.85rem', backgroundColor: '#252525', border: '1px solid var(--admin-border)', borderRadius: '8px', color: '#FFFFFF', fontSize: '0.88rem' }}
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
            style={{ width: '100%', padding: '0.65rem 0.85rem', backgroundColor: '#252525', border: '1px solid var(--admin-border)', borderRadius: '8px', color: '#FFFFFF', fontSize: '0.88rem', resize: 'vertical' }}
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
              style={{ width: '100%', padding: '0.65rem 0.85rem', backgroundColor: '#252525', border: '1px solid var(--admin-border)', borderRadius: '8px', color: '#FFFFFF', fontSize: '0.88rem' }}
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
              style={{ width: '100%', padding: '0.65rem 0.85rem', backgroundColor: '#252525', border: '1px solid var(--admin-border)', borderRadius: '8px', color: '#FFFFFF', fontSize: '0.88rem' }}
            />
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
      {/* 3. MOOD COLLECTIONS / CATEGORIES MANAGEMENT                          */}
      {/* -------------------------------------------------------------------- */}
      <div style={{ backgroundColor: 'var(--admin-card-bg)', border: '1px solid var(--admin-border)', borderRadius: '16px', padding: '1.75rem', marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', color: 'var(--admin-text-primary)', margin: 0, fontFamily: 'var(--font-serif)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Layers size={18} color="var(--admin-accent)" />
              Mood Categories / Collections ({moods.length})
            </h2>
            <p style={{ color: 'var(--admin-text-secondary)', fontSize: '0.82rem', margin: '0.2rem 0 0' }}>
              Create and manage mood categories and assign snacks to each category.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenAddMood}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.7rem 1.5rem',
              backgroundColor: '#2E4C1E',
              color: '#FFFFFF',
              border: '1.5px solid #A3C878',
              borderRadius: '8px',
              fontWeight: '800',
              fontSize: '0.88rem',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(46, 76, 30, 0.3)'
            }}
          >
            <Plus size={18} />
            <span>+ Create New Category</span>
          </button>
        </div>

        {/* Mood Cards List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {moods.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--admin-text-muted)' }}>
              No mood categories found. Click <strong>"+ Create New Category"</strong> to make one.
            </div>
          ) : (
            moods.map((mood, idx) => {
              // Deduplicate product IDs for mapping
              const uniquePids = Array.from(new Set((mood.product_ids || []).map(String)));
              const assignedProds = uniquePids
                .map(pid => availableProducts.find(p => String(p.id) === String(pid)))
                .filter(Boolean);

              const hasInactiveProducts = assignedProds.some(p => p.is_active === false);
              const is0Products = assignedProds.length === 0;

              return (
                <div
                  key={mood.id}
                  style={{
                    backgroundColor: '#1E1E1E',
                    border: mood.is_active ? '1px solid var(--admin-border)' : '1px dashed #663333',
                    borderRadius: '12px',
                    padding: '1.25rem',
                    opacity: mood.is_active ? 1 : 0.75,
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
                            <AlertTriangle size={14} /> This category has no products assigned.
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
                        style={{ padding: '0.4rem', backgroundColor: '#2A2A2A', border: '1px solid var(--admin-border)', color: idx === 0 ? '#555' : '#FFF', borderRadius: '6px', cursor: idx === 0 ? 'not-allowed' : 'pointer' }}
                        title="Move Up"
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveMood(idx, 1)}
                        disabled={idx === moods.length - 1}
                        style={{ padding: '0.4rem', backgroundColor: '#2A2A2A', border: '1px solid var(--admin-border)', color: idx === moods.length - 1 ? '#555' : '#FFF', borderRadius: '6px', cursor: idx === moods.length - 1 ? 'not-allowed' : 'pointer' }}
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
                        style={{ padding: '0.45rem 0.75rem', backgroundColor: '#2A2A2A', border: '1px solid var(--admin-border)', color: mood.is_active ? '#FFB74D' : '#A3C878', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer' }}
                      >
                        {mood.is_active ? 'Deactivate' : 'Activate'}
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => { setMoodToDelete(mood); setDeleteModalOpen(true); }}
                        style={{ padding: '0.45rem 0.65rem', backgroundColor: 'rgba(255,100,100,0.1)', border: '1px solid rgba(255,100,100,0.3)', color: '#FF8888', borderRadius: '6px', cursor: 'pointer' }}
                        title="Delete Category"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Assigned Products Thumbnails */}
                  <div style={{ paddingTop: '0.75rem', borderTop: '1px solid var(--admin-border)' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--admin-text-muted)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                      ASSIGNED PRODUCTS ({assignedProds.length}):
                    </div>
                    {assignedProds.length === 0 ? (
                      <span style={{ fontSize: '0.82rem', color: 'var(--admin-text-muted)', fontStyle: 'italic' }}>None</span>
                    ) : (
                      <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
                        {assignedProds.map((prod) => (
                          <div key={prod.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', backgroundColor: '#2A2A2A', border: '1px solid var(--admin-border)', borderRadius: '6px', padding: '0.35rem 0.65rem', fontSize: '0.78rem', color: '#FFFDF9' }}>
                            {prod.image && <img src={prod.image} alt={prod.name} style={{ width: '20px', height: '20px', borderRadius: '50%', objectFit: 'cover' }} />}
                            <span>{prod.name}</span>
                            <span style={{ color: 'var(--admin-accent)', fontWeight: '800' }}>₹{prod.price || prod.resolvedPrice || prod.originalPrice || 0}</span>
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
      {/* 4. ADD / EDIT MOOD MODAL                                             */}
      {/* -------------------------------------------------------------------- */}
      {moodModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ backgroundColor: '#1E1E1E', border: '1px solid var(--admin-border)', borderRadius: '20px', width: '100%', maxWidth: '750px', maxHeight: '90vh', overflowY: 'auto', padding: '1.75rem', boxShadow: '0 20px 50px rgba(0,0,0,0.7)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--admin-border)', paddingBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.2rem', color: '#FFFDF9', fontFamily: 'var(--font-serif)', margin: 0 }}>
                {editingMood ? `Edit Category: ${editingMood.name}` : 'Create New Mood Category'}
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
                    CATEGORY NAME *
                  </label>
                  <input
                    type="text"
                    required
                    value={moodName}
                    onChange={e => setMoodName(e.target.value)}
                    placeholder="e.g. I CRAVE CHOCOLATE"
                    style={{ width: '100%', padding: '0.65rem 0.85rem', backgroundColor: '#2A2A2A', border: '1px solid var(--admin-border)', borderRadius: '8px', color: '#FFFFFF', fontSize: '0.88rem' }}
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
                    style={{ width: '100%', padding: '0.65rem 0.85rem', backgroundColor: '#2A2A2A', border: '1px solid var(--admin-border)', borderRadius: '8px', color: '#FFFFFF', fontSize: '0.88rem' }}
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
                  style={{ width: '100%', padding: '0.65rem 0.85rem', backgroundColor: '#2A2A2A', border: '1px solid var(--admin-border)', borderRadius: '8px', color: '#FFFFFF', fontSize: '0.88rem' }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.88rem', color: '#FFFDF9', fontWeight: '700' }}>
                  <input
                    type="checkbox"
                    checked={moodActive}
                    onChange={e => setMoodActive(e.target.checked)}
                  />
                  <span>Active Category (Show on Homepage)</span>
                </label>
              </div>

              {/* SEARCHABLE PRODUCT SELECTOR */}
              <div style={{ borderTop: '1px solid var(--admin-border)', paddingTop: '1.25rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--admin-accent)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    ASSIGN PRODUCTS ({Array.from(new Set(selectedProductIds.map(String))).length} selected)
                  </label>

                  {/* Search Bar */}
                  <div style={{ position: 'relative', width: '220px' }}>
                    <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--admin-text-muted)' }} />
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={productSearch}
                      onChange={e => setProductSearch(e.target.value)}
                      style={{ width: '100%', padding: '0.4rem 0.6rem 0.4rem 2rem', backgroundColor: '#2A2A2A', border: '1px solid var(--admin-border)', borderRadius: '6px', color: '#FFF', fontSize: '0.8rem' }}
                    />
                  </div>
                </div>

                {/* Filtered Products Checkbox List */}
                <div style={{ maxHeight: '240px', overflowY: 'auto', border: '1px solid var(--admin-border)', borderRadius: '10px', backgroundColor: '#181818', padding: '0.75rem' }}>
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
                        <div style={{ paddingBottom: '0.5rem', borderBottom: '1px solid var(--admin-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
                          const strProdId = String(prod.id);
                          const isChecked = selectedProductIds.some(spid => String(spid) === strProdId);
                          return (
                            <label
                              key={prod.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '0.5rem 0.75rem',
                                borderRadius: '6px',
                                backgroundColor: isChecked ? 'rgba(46, 76, 30, 0.35)' : 'transparent',
                                border: isChecked ? '1px solid #A3C878' : '1px solid transparent',
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
                                ₹{prod.price || prod.resolvedPrice || prod.originalPrice || 0}
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
                  {savingMood ? 'Saving...' : 'Save Category'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        title="Delete Mood Category?"
        message={`Are you sure you want to delete "${moodToDelete?.name}"? Product relationships for this category will be removed. (Actual products in catalog will NOT be deleted).`}
        onConfirm={handleConfirmDeleteMood}
        onCancel={() => { setDeleteModalOpen(false); setMoodToDelete(null); }}
      />

    </div>
  );
}
