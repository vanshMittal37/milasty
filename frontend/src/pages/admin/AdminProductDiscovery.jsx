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

  const handleOpenEditMood = (mood) => {
    setEditingMood(mood);
    setMoodName(mood.name || '');
    setMoodDescription(mood.description || '');
    setMoodOrder(mood.display_order || 1);
    setMoodActive(mood.is_active ?? true);
    setSelectedProductIds(Array.isArray(mood.product_ids) ? mood.product_ids : []);
    setProductSearch('');
    setMoodModalOpen(true);
  };

  const handleToggleProductSelection = (productId) => {
    const strId = String(productId);
    setSelectedProductIds(prev => {
      const exists = prev.some(id => String(id) === strId);
      if (exists) {
        return prev.filter(id => String(id) !== strId);
      } else {
        return [...prev, productId];
      }
    });
  };

  const handleSelectAllProducts = (filteredProds) => {
    const filteredIds = filteredProds.map(p => p.id);
    const allSelected = filteredIds.every(id => selectedProductIds.some(spid => String(spid) === String(id)));

    if (allSelected) {
      setSelectedProductIds(prev => prev.filter(id => !filteredIds.some(fid => String(fid) === String(id))));
    } else {
      const newIds = new Set([...selectedProductIds, ...filteredIds]);
      setSelectedProductIds(Array.from(newIds));
    }
  };

  const handleSaveMood = async (e) => {
    e.preventDefault();
    if (!moodName.trim()) {
      toast.error('Please enter a category name.');
      return;
    }

    setSavingMood(true);
    const payload = {
      name: moodName.trim(),
      description: moodDescription.trim(),
      display_order: Number(moodOrder) || 1,
      is_active: moodActive,
      product_ids: selectedProductIds,
    };

    try {
      if (editingMood) {
        const res = await api.put(`/product-discovery/admin/moods/${editingMood.id}`, payload);
        if (res.data && res.data.success) {
          toast.success(`Category "${moodName}" updated.`);
          setMoodModalOpen(false);
          fetchDiscoveryData();
        }
      } else {
        const res = await api.post('/product-discovery/admin/moods', payload);
        if (res.data && res.data.success) {
          toast.success(`New category "${moodName}" created.`);
          setMoodModalOpen(false);
          fetchDiscoveryData();
        }
      }
    } catch (err) {
      console.error('Error saving mood:', err);
      toast.error(err.response?.data?.message || 'Failed to save mood category.');
    } finally {
      setSavingMood(false);
    }
  };

  const handleMoveMood = async (index, direction) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= moods.length) return;

    const newMoods = [...moods];
    const temp = newMoods[index];
    newMoods[index] = newMoods[targetIdx];
    newMoods[targetIdx] = temp;

    const orderedPayload = newMoods.map((m, i) => ({
      id: m.id,
      display_order: i + 1,
    }));

    setMoods(newMoods);

    try {
      await api.put('/product-discovery/admin/moods/reorder', { orders: orderedPayload });
      toast.success('Mood display order updated.');
    } catch (err) {
      console.error('Failed to reorder moods:', err);
      toast.error('Failed to update category display order.');
      fetchDiscoveryData();
    }
  };

  const handleConfirmDeleteMood = async () => {
    if (!moodToDelete) return;
    try {
      const res = await api.delete(`/product-discovery/admin/moods/${moodToDelete.id}`);
      if (res.data && res.data.success) {
        toast.success(`Category "${moodToDelete.name}" deleted.`);
        setMoodToDelete(null);
        setDeleteModalOpen(false);
        fetchDiscoveryData();
      }
    } catch (err) {
      console.error('Failed to delete mood category:', err);
      toast.error('Failed to delete mood category.');
    }
  };

  const activeMoodsCount = moods.filter(m => m.is_active).length;
  const totalAssignedProductsCount = new Set(
    moods.flatMap(m => (m.product_ids || []).map(String))
  ).size;

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 1rem' }}>
        <Compass size={32} color="#C68A3A" className="animate-spin" style={{ marginBottom: '1rem' }} />
        <span style={{ fontSize: '0.9rem', color: '#665A52', fontWeight: '700' }}>Loading Product Discovery settings...</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Top Header & Section Status Card */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <p style={{ fontSize: '0.68rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.07em', color: '#665A52', margin: '0 0 0.2rem 0' }}>
            Storefront Discovery
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Compass size={22} color="#C68A3A" />
            <h2 style={{ fontSize: 'clamp(1.15rem, 2.5vw, 1.45rem)', fontFamily: 'var(--font-serif)', color: '#21150F', fontWeight: '800', margin: 0, lineHeight: '1.25' }}>
              Product Discovery by Mood
            </h2>
          </div>
          <p style={{ color: '#4A3B2E', fontSize: '0.8rem', margin: '0.2rem 0 0 0', fontWeight: '500' }}>
            Manage the interactive "Find Your Perfect MILASTY Snack" section on the storefront homepage.
          </p>
        </div>

        {/* Global ON / OFF Section Toggle Card */}
        <div 
          className="admin-card"
          style={{ 
            padding: '0.75rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            backgroundColor: 'rgba(255, 255, 255, 0.92)',
          }}
        >
          <div>
            <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#665A52', fontWeight: '800' }}>
              HOMEPAGE SECTION
            </div>
            <div style={{ fontSize: '0.86rem', fontWeight: '800', color: sectionConfig.is_active ? '#4D7C2B' : '#C62828' }}>
              {sectionConfig.is_active ? 'SECTION ACTIVE' : 'SECTION HIDDEN'}
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleToggleSectionActive(!sectionConfig.is_active)}
            style={{
              padding: '0.45rem 1rem',
              borderRadius: '999px',
              border: 'none',
              backgroundColor: sectionConfig.is_active ? 'rgba(143, 175, 91, 0.2)' : 'rgba(198, 40, 40, 0.12)',
              color: sectionConfig.is_active ? '#4D7C2B' : '#C62828',
              fontWeight: '800',
              fontSize: '0.78rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            {sectionConfig.is_active ? 'ON (VISIBLE)' : 'OFF (HIDDEN)'}
          </button>
        </div>
      </div>

      {/* Quick Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
        <div className="admin-card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#665A52', fontWeight: '800', marginBottom: '0.35rem' }}>Section Status</div>
          <div style={{ fontSize: '1.4rem', fontWeight: '900', color: sectionConfig.is_active ? '#4D7C2B' : '#C62828' }}>
            {sectionConfig.is_active ? 'Active' : 'Disabled'}
          </div>
        </div>

        <div className="admin-card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#665A52', fontWeight: '800', marginBottom: '0.35rem' }}>Mood Categories</div>
          <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#21150F' }}>
            {activeMoodsCount} Active <span style={{ fontSize: '0.85rem', color: '#665A52', fontWeight: '600' }}>({moods.length} total)</span>
          </div>
        </div>

        <div className="admin-card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#665A52', fontWeight: '800', marginBottom: '0.35rem' }}>Assigned Products</div>
          <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#21150F' }}>
            {totalAssignedProductsCount} Unique Snacks
          </div>
        </div>
      </div>

      {/* Section Content Settings */}
      <form onSubmit={handleSaveSectionConfig} className="admin-card" style={{ padding: '1.75rem' }}>
        <h3 style={{ fontSize: '1.1rem', color: '#21150F', margin: '0 0 1.25rem', fontFamily: 'var(--font-serif)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '800' }}>
          <Sparkles size={18} color="#C68A3A" />
          Section Content Settings
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.74rem', color: '#4A3B2E', fontWeight: '800', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              SECTION EYEBROW
            </label>
            <input
              type="text"
              value={sectionConfig.eyebrow}
              onChange={e => setSectionConfig({ ...sectionConfig, eyebrow: e.target.value })}
              placeholder="e.g. NOT SURE WHERE TO START?"
              className="admin-input"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.74rem', color: '#4A3B2E', fontWeight: '800', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              MAIN HEADLINE
            </label>
            <input
              type="text"
              value={sectionConfig.title}
              onChange={e => setSectionConfig({ ...sectionConfig, title: e.target.value })}
              placeholder="e.g. Find Your Perfect MILASTY Snack"
              className="admin-input"
            />
          </div>
        </div>

        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', fontSize: '0.74rem', color: '#4A3B2E', fontWeight: '800', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            SECTION DESCRIPTION
          </label>
          <textarea
            rows={2}
            value={sectionConfig.description}
            onChange={e => setSectionConfig({ ...sectionConfig, description: e.target.value })}
            placeholder="e.g. Something light. Something crunchy. Something chocolatey."
            className="admin-input"
            style={{ width: '100%', resize: 'vertical' }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.74rem', color: '#4A3B2E', fontWeight: '800', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              EXPLORE ALL BUTTON TEXT
            </label>
            <input
              type="text"
              value={sectionConfig.explore_button_text}
              onChange={e => setSectionConfig({ ...sectionConfig, explore_button_text: e.target.value })}
              placeholder="e.g. EXPLORE ALL SNACKS →"
              className="admin-input"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.74rem', color: '#4A3B2E', fontWeight: '800', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              EXPLORE ALL DESTINATION URL
            </label>
            <input
              type="text"
              value={sectionConfig.explore_button_url}
              onChange={e => setSectionConfig({ ...sectionConfig, explore_button_url: e.target.value })}
              placeholder="e.g. /shop"
              className="admin-input"
            />
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <button
            type="submit"
            disabled={savingSection}
            className="admin-btn-primary"
            style={{ padding: '0.65rem 1.75rem' }}
          >
            {savingSection ? 'Saving Settings...' : 'Save Section Settings'}
          </button>
        </div>
      </form>

      {/* Mood Categories / Collections */}
      <div className="admin-card" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', color: '#21150F', margin: 0, fontFamily: 'var(--font-serif)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '800' }}>
              <Layers size={18} color="#C68A3A" />
              Mood Categories / Collections ({moods.length})
            </h3>
            <p style={{ color: '#4A3B2E', fontSize: '0.8rem', margin: '0.2rem 0 0', fontWeight: '500' }}>
              Create and manage mood categories and assign snacks to each category.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenAddMood}
            className="admin-btn-primary"
          >
            <Plus size={16} />
            <span>Create New Category</span>
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {moods.length === 0 ? (
            <div style={{ padding: '2.5rem', textAlign: 'center', color: '#665A52', fontSize: '0.85rem', fontWeight: '600' }}>
              No mood categories found. Click <strong>"+ Create New Category"</strong> to make one.
            </div>
          ) : (
            moods.map((mood, idx) => {
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
                    backgroundColor: 'var(--admin-surface-elevated)',
                    border: mood.is_active ? '1px solid rgba(231, 222, 213, 0.65)' : '1px dashed rgba(255, 91, 91, 0.4)',
                    borderRadius: '14px',
                    padding: '1.25rem',
                    opacity: mood.is_active ? 1 : 0.75,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: '800', color: '#C68A3A', backgroundColor: 'rgba(198, 138, 58, 0.12)', padding: '0.2rem 0.55rem', borderRadius: '6px' }}>
                          ORDER #{mood.display_order || idx + 1}
                        </span>
                        <h4 style={{ fontSize: '1.05rem', color: '#21150F', fontWeight: '800', margin: 0, fontFamily: 'var(--font-serif)' }}>
                          {mood.name}
                        </h4>
                        <span
                          style={{
                            fontSize: '0.68rem',
                            fontWeight: '800',
                            padding: '0.15rem 0.55rem',
                            borderRadius: '999px',
                            backgroundColor: mood.is_active ? 'rgba(143, 175, 91, 0.18)' : 'rgba(255, 91, 91, 0.12)',
                            color: mood.is_active ? '#4D7C2B' : '#C62828',
                            border: mood.is_active ? '1px solid rgba(143, 175, 91, 0.35)' : '1px solid rgba(255, 91, 91, 0.3)',
                          }}
                        >
                          {mood.is_active ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </div>

                      {mood.description && (
                        <p style={{ fontSize: '0.84rem', color: '#4A3B2E', margin: '0 0 0.5rem', fontWeight: '500' }}>
                          {mood.description}
                        </p>
                      )}

                      {/* Warning Badges */}
                      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                        {is0Products && (
                          <span style={{ fontSize: '0.75rem', color: '#B45309', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontWeight: '700' }}>
                            <AlertTriangle size={14} /> No products assigned to this category.
                          </span>
                        )}
                        {hasInactiveProducts && (
                          <span style={{ fontSize: '0.75rem', color: '#C62828', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontWeight: '700' }}>
                            <AlertTriangle size={14} /> 1 or more assigned products are currently inactive.
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <button
                        type="button"
                        onClick={() => handleMoveMood(idx, -1)}
                        disabled={idx === 0}
                        className="admin-icon-btn"
                        title="Move Up"
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveMood(idx, 1)}
                        disabled={idx === moods.length - 1}
                        className="admin-icon-btn"
                        title="Move Down"
                      >
                        <ArrowDown size={14} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenEditMood(mood)}
                        className="admin-icon-btn"
                        style={{ color: '#b9cd94', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.45rem 0.85rem' }}
                      >
                        <Edit2 size={14} /> <span>Edit &amp; Assign Products</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleMoodActive(mood)}
                        className="admin-icon-btn"
                        title={mood.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {mood.is_active ? 'Deactivate' : 'Activate'}
                      </button>

                      <button
                        type="button"
                        onClick={() => { setMoodToDelete(mood); setDeleteModalOpen(true); }}
                        className="admin-icon-btn"
                        style={{ color: '#C62828' }}
                        title="Delete Category"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Assigned Products Thumbnails */}
                  <div style={{ paddingTop: '0.75rem', borderTop: '1px solid rgba(231, 222, 213, 0.65)' }}>
                    <div style={{ fontSize: '0.7rem', color: '#665A52', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                      ASSIGNED PRODUCTS ({assignedProds.length}):
                    </div>
                    {assignedProds.length === 0 ? (
                      <span style={{ fontSize: '0.82rem', color: '#665A52', fontStyle: 'italic' }}>None</span>
                    ) : (
                      <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
                        {assignedProds.map((prod) => (
                          <div 
                            key={prod.id} 
                            style={{ 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              gap: '0.4rem', 
                              backgroundColor: '#FFFFFF', 
                              border: '1px solid rgba(231, 222, 213, 0.7)', 
                              borderRadius: '8px', 
                              padding: '0.35rem 0.65rem', 
                              fontSize: '0.78rem', 
                              color: '#21150F',
                              fontWeight: '600',
                            }}
                          >
                            {prod.image && <img src={prod.image} alt={prod.name} style={{ width: '20px', height: '20px', borderRadius: '50%', objectFit: 'cover' }} />}
                            <span>{prod.name}</span>
                            <span style={{ color: '#C68A3A', fontWeight: '800' }}>₹{prod.price || prod.resolvedPrice || prod.originalPrice || 0}</span>
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

      {/* ADD / EDIT MOOD MODAL */}
      {moodModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid rgba(231, 222, 213, 0.8)', borderRadius: '18px', width: '100%', maxWidth: '750px', maxHeight: '90vh', overflowY: 'auto', padding: '1.75rem', boxShadow: '0 20px 50px rgba(0,0,0,0.4)', color: '#21150F' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(231, 222, 213, 0.7)', paddingBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.2rem', color: '#21150F', fontFamily: 'var(--font-serif)', margin: 0, fontWeight: '800' }}>
                {editingMood ? `Edit Category: ${editingMood.name}` : 'Create New Mood Category'}
              </h3>
              <button
                type="button"
                onClick={() => setMoodModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#665A52', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveMood}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', color: '#4A3B2E', fontWeight: '800', marginBottom: '0.45rem', textTransform: 'uppercase' }}>
                    CATEGORY NAME *
                  </label>
                  <input
                    type="text"
                    required
                    value={moodName}
                    onChange={e => setMoodName(e.target.value)}
                    placeholder="e.g. I CRAVE CHOCOLATE"
                    className="admin-input"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', color: '#4A3B2E', fontWeight: '800', marginBottom: '0.45rem', textTransform: 'uppercase' }}>
                    DISPLAY ORDER
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={moodOrder}
                    onChange={e => setMoodOrder(e.target.value)}
                    className="admin-input"
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.74rem', color: '#4A3B2E', fontWeight: '800', marginBottom: '0.45rem', textTransform: 'uppercase' }}>
                  SHORT DESCRIPTION
                </label>
                <input
                  type="text"
                  value={moodDescription}
                  onChange={e => setMoodDescription(e.target.value)}
                  placeholder="e.g. For those moments when chocolate is non-negotiable."
                  className="admin-input"
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontSize: '0.85rem', color: '#21150F', fontWeight: '700' }}>
                  <input
                    type="checkbox"
                    checked={moodActive}
                    onChange={e => setMoodActive(e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: '#C68A3A' }}
                  />
                  <span>Active Category (Show on Homepage)</span>
                </label>
              </div>

              {/* SEARCHABLE PRODUCT SELECTOR */}
              <div style={{ borderTop: '1px solid rgba(231, 222, 213, 0.7)', paddingTop: '1.25rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
                  <label style={{ fontSize: '0.78rem', color: '#C68A3A', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    ASSIGN PRODUCTS ({Array.from(new Set(selectedProductIds.map(String))).length} selected)
                  </label>

                  {/* Search Bar */}
                  <div style={{ position: 'relative', width: '220px' }}>
                    <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#665A52' }} />
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={productSearch}
                      onChange={e => setProductSearch(e.target.value)}
                      className="admin-input admin-search-input"
                      style={{ paddingLeft: '2.5rem' }}
                    />
                  </div>
                </div>

                {/* Filtered Products Checkbox List */}
                <div style={{ maxHeight: '240px', overflowY: 'auto', border: '1px solid rgba(231, 222, 213, 0.75)', borderRadius: '10px', backgroundColor: '#FFFFFF', padding: '0.75rem' }}>
                  {(() => {
                    const filtered = availableProducts.filter(p => 
                      (p.name || '').toLowerCase().includes(productSearch.toLowerCase()) ||
                      (p.category || '').toLowerCase().includes(productSearch.toLowerCase())
                    );

                    if (filtered.length === 0) {
                      return <div style={{ padding: '1.5rem', textAlign: 'center', color: '#665A52', fontSize: '0.85rem' }}>No products match your search.</div>;
                    }

                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ paddingBottom: '0.5rem', borderBottom: '1px solid rgba(231, 222, 213, 0.65)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.75rem', color: '#665A52', fontWeight: '700' }}>Showing {filtered.length} products</span>
                          <button
                            type="button"
                            onClick={() => handleSelectAllProducts(filtered)}
                            style={{ background: 'none', border: 'none', color: '#C68A3A', fontSize: '0.78rem', fontWeight: '800', cursor: 'pointer' }}
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
                                borderRadius: '8px',
                                backgroundColor: isChecked ? 'rgba(198, 138, 58, 0.12)' : 'transparent',
                                border: isChecked ? '1px solid rgba(198, 138, 58, 0.4)' : '1px solid transparent',
                                cursor: 'pointer'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleToggleProductSelection(prod.id)}
                                  style={{ accentColor: '#C68A3A' }}
                                />
                                {prod.image && <img src={prod.image} alt={prod.name} style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />}
                                <div>
                                  <div style={{ fontSize: '0.85rem', color: '#21150F', fontWeight: '700' }}>{prod.name}</div>
                                  <div style={{ fontSize: '0.72rem', color: '#665A52' }}>{prod.category}</div>
                                </div>
                              </div>
                              <div style={{ fontSize: '0.82rem', color: '#C68A3A', fontWeight: '800' }}>
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
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid rgba(231, 222, 213, 0.7)', paddingTop: '1.25rem' }}>
                <button
                  type="button"
                  onClick={() => setMoodModalOpen(false)}
                  style={{ padding: '0.65rem 1.25rem', backgroundColor: 'transparent', border: '1px solid rgba(231, 222, 213, 0.65)', color: '#4A3B2E', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '700' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingMood}
                  className="admin-btn-primary"
                  style={{ padding: '0.65rem 1.75rem' }}
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
