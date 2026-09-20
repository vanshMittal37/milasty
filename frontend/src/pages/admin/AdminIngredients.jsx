import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, EyeOff, Sparkles, Image as ImageIcon, Check, RefreshCw } from 'lucide-react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import ConfirmationModal from '../../components/ConfirmationModal';

export default function AdminIngredients() {
  const { toast } = useToast();
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState(null);
  const [name, setName] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [targetId, setTargetId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchIngredients();
  }, []);

  const fetchIngredients = async () => {
    setLoading(true);
    try {
      const res = await api.get('/ingredients/admin/all')
        .catch(() => api.get('/ingredients/admin'))
        .catch(() => api.get('/ingredients'));

      const list = Array.isArray(res.data)
        ? res.data
        : (res.data?.ingredients || res.data?.data || []);
      setIngredients(list);
    } catch (err) {
      console.error('Error fetching ingredients:', err);
      toast.error('Failed to load honest ingredients.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingIngredient(null);
    setName('');
    setSubtitle('');
    setDescription('');
    setImage('');
    setActive(true);
    setModalOpen(true);
  };

  const handleOpenEdit = (ing) => {
    setEditingIngredient(ing);
    setName(ing.name || '');
    setSubtitle(ing.subtitle || '');
    setDescription(ing.description || '');
    setImage(ing.image || ing.imageUrl || ing.image_url || '');
    setActive(ing.active !== false);
    setModalOpen(true);
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
      if (res.data && (res.data.imageUrl || res.data.url)) {
        const uploadedUrl = res.data.imageUrl || res.data.url;
        setImage(uploadedUrl);
        toast.success('Image uploaded successfully.');
      }
    } catch (err) {
      console.error('Image upload failed:', err);
      // Fallback base64 conversion
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result);
        toast.success('Image loaded successfully.');
      };
      reader.readAsDataURL(file);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Ingredient name is required.');
      return;
    }

    setSaving(true);
    const payload = {
      name: name.trim(),
      subtitle: subtitle.trim(),
      description: description.trim(),
      image,
      imageUrl: image,
      image_url: image,
      active,
    };

    try {
      if (editingIngredient) {
        await api.put(`/ingredients/${editingIngredient.id}`, payload);
        toast.success('Ingredient updated successfully.');
      } else {
        await api.post('/ingredients', payload);
        toast.success('Ingredient created successfully.');
      }
      setModalOpen(false);
      fetchIngredients();
    } catch (err) {
      console.error('Save ingredient error:', err);
      toast.error('Failed to save ingredient.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!targetId) return;
    setDeleting(true);
    try {
      await api.delete(`/ingredients/${targetId}`);
      toast.success('Ingredient deleted successfully.');
      setDeleteModalOpen(false);
      setTargetId(null);
      fetchIngredients();
    } catch (err) {
      console.error('Delete ingredient error:', err);
      toast.error('Failed to delete ingredient.');
    } finally {
      setDeleting(false);
    }
  };

  const toggleActive = async (ing) => {
    try {
      await api.put(`/ingredients/${ing.id}`, { active: !ing.active });
      toast.success(`Ingredient ${!ing.active ? 'activated' : 'deactivated'}.`);
      fetchIngredients();
    } catch (err) {
      console.error('Toggle status error:', err);
      toast.error('Failed to update status.');
    }
  };

  return (
    <div style={{ padding: '2rem 1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <Sparkles size={24} color="var(--admin-accent)" />
            <h1 style={{ fontSize: '1.75rem', fontWeight: '850', color: 'var(--admin-text-primary)', margin: 0, fontFamily: 'var(--font-serif)' }}>
              Honest Ingredients CMS
            </h1>
          </div>
          <p style={{ color: 'var(--admin-text-muted)', fontSize: '0.9rem', margin: 0, fontWeight: '500' }}>
            Manage clean ingredient stories shown on the homepage educational section.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="admin-btn-primary"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.25rem',
            borderRadius: '12px',
            fontWeight: '700',
            cursor: 'pointer',
          }}
        >
          <Plus size={18} />
          <span>Add New Ingredient</span>
        </button>
      </div>

      {/* LIST GRID */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--admin-text-muted)' }}>
          <RefreshCw size={32} className="animate-spin" style={{ marginBottom: '1rem', color: 'var(--admin-accent)' }} />
          <p>Loading ingredients...</p>
        </div>
      ) : ingredients.length === 0 ? (
        <div className="admin-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <Sparkles size={48} color="var(--admin-accent)" style={{ marginBottom: '1rem', opacity: 0.5 }} />
          <h3 style={{ color: 'var(--admin-text-primary)', margin: '0 0 0.5rem' }}>No Ingredients Found</h3>
          <p style={{ color: 'var(--admin-text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Add your first ingredient story to feature it on the homepage.
          </p>
          <button
            onClick={handleOpenAdd}
            className="admin-btn-primary"
          >
            Add Ingredient
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {ingredients.map((ing) => {
            const imgSrc = ing.image || ing.imageUrl || ing.image_url;
            return (
              <div
                key={ing.id}
                className="admin-card"
                style={{
                  borderRadius: '18px',
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  backgroundColor: 'var(--admin-surface-card)',
                  border: '1px solid var(--admin-border)',
                  opacity: ing.active ? 1 : 0.65,
                }}
              >
                <div>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    {imgSrc ? (
                      <img
                        src={imgSrc}
                        alt={ing.name}
                        style={{ width: '64px', height: '64px', borderRadius: '14px', objectFit: 'cover', flexShrink: 0, border: '1px solid var(--admin-border)' }}
                      />
                    ) : (
                      <div style={{ width: '64px', height: '64px', borderRadius: '14px', backgroundColor: 'var(--admin-surface-elevated)', border: '1px solid var(--admin-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <ImageIcon size={28} color="var(--admin-accent)" />
                      </div>
                    )}

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                        <h3 style={{ fontSize: '1.1rem', color: 'var(--admin-text-primary)', margin: 0, fontWeight: '800' }}>
                          {ing.name}
                        </h3>
                        <button
                          onClick={() => toggleActive(ing)}
                          title={ing.active ? 'Deactivate' : 'Activate'}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: ing.active ? 'var(--admin-accent)' : 'var(--admin-text-muted)',
                            padding: '0.2rem',
                          }}
                        >
                          {ing.active ? <Eye size={18} /> : <EyeOff size={18} />}
                        </button>
                      </div>
                      {ing.subtitle && (
                        <p style={{ color: 'var(--admin-accent)', fontSize: '0.8rem', margin: '0.2rem 0 0', fontWeight: '600' }}>
                          {ing.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  <p style={{ color: 'var(--admin-text-secondary)', fontSize: '0.85rem', lineHeight: '1.55', margin: 0, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {ing.description}
                  </p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--admin-border)' }}>
                  <button
                    onClick={() => handleOpenEdit(ing)}
                    className="admin-btn-secondary"
                    style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}
                  >
                    <Edit2 size={14} />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => {
                      setTargetId(ing.id);
                      setDeleteModalOpen(true);
                    }}
                    style={{
                      backgroundColor: 'rgba(220, 53, 69, 0.15)',
                      color: '#ff6b6b',
                      border: '1px solid rgba(220, 53, 69, 0.3)',
                      padding: '0.45rem 0.85rem',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}
                  >
                    <Trash2 size={14} />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ backgroundColor: 'var(--admin-surface-card)', border: '1px solid var(--admin-border)', borderRadius: '20px', padding: '2rem', maxWidth: '550px', width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
            <h2 style={{ color: 'var(--admin-text-primary)', fontFamily: 'var(--font-serif)', margin: '0 0 1.5rem', fontSize: '1.4rem' }}>
              {editingIngredient ? 'Edit Ingredient' : 'Add New Ingredient'}
            </h2>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', color: 'var(--admin-text-secondary)', fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                  Ingredient Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Pure Desi Ghee"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="admin-input"
                />
              </div>

              <div>
                <label style={{ display: 'block', color: 'var(--admin-text-secondary)', fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                  Subtitle / Tagline
                </label>
                <input
                  type="text"
                  placeholder="e.g., Why Pure Desi Ghee?"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  className="admin-input"
                />
              </div>

              <div>
                <label style={{ display: 'block', color: 'var(--admin-text-secondary)', fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                  Description / Story *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Explain why this ingredient matters..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="admin-input"
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', color: 'var(--admin-text-secondary)', fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                  Ingredient Image
                </label>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  {image && (
                    <img src={image} alt="Preview" style={{ width: '56px', height: '56px', borderRadius: '10px', objectFit: 'cover', border: '1px solid var(--admin-border)' }} />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                    style={{ color: 'var(--admin-text-secondary)', fontSize: '0.85rem' }}
                  />
                </div>
                {uploadingImage && <span style={{ color: 'var(--admin-accent)', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>Uploading image...</span>}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <input
                  type="checkbox"
                  id="ingActive"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--admin-accent)' }}
                />
                <label htmlFor="ingActive" style={{ color: 'var(--admin-text-primary)', fontSize: '0.9rem', cursor: 'pointer', fontWeight: '600' }}>
                  Active (Show on Homepage)
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="admin-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="admin-btn-primary"
                >
                  {saving ? 'Saving...' : editingIngredient ? 'Update Ingredient' : 'Create Ingredient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Ingredient?"
        message="Are you sure you want to delete this ingredient story? This action cannot be undone."
        confirmText={deleting ? 'Deleting...' : 'Delete'}
        confirmVariant="danger"
      />
    </div>
  );
}
