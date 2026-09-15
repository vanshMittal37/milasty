import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Tags, RefreshCw, Upload, Image as ImageIcon, Edit3, ShieldAlert, CheckCircle, Package, Layers, X } from 'lucide-react';
import api from '../../api/axios';
import ConfirmationModal from '../../components/ConfirmationModal';
import { useToast } from '../../context/ToastContext';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [fetching, setFetching] = useState(true);
  
  // Create Category Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [creating, setCreating] = useState(false);

  // Edit Category Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editCategoryData, setEditCategoryData] = useState(null);
  const [editImageUploading, setEditImageUploading] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Delete State
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  const { toast } = useToast();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setFetching(true);
    try {
      const res = await api.get('/categories');
      setCategories(res.data || []);
    } catch (e) {
      toast.error('Unable to fetch categories');
    } finally {
      setFetching(false);
    }
  };

  // Image File Upload Helper using Cloudinary Endpoint
  const handleFileUpload = (e, isEdit = false) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.match(/^image\/(jpeg|jpg|png|webp)$/i)) {
      toast.error('Only JPG, JPEG, PNG, or WEBP images are supported');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size exceeds 5MB limit');
      return;
    }

    if (isEdit) setEditImageUploading(true);
    else setUploadingImage(true);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      try {
        const base64Data = reader.result;
        const res = await api.post('/upload', { image: base64Data });
        if (res.data && res.data.url) {
          if (isEdit) {
            setEditCategoryData(prev => ({ ...prev, image: res.data.url, image_url: res.data.url }));
          } else {
            setImage(res.data.url);
          }
          toast.success('Category image uploaded successfully!');
        } else {
          toast.error('Cloudinary upload failed');
        }
      } catch (err) {
        console.error('Image upload error:', err);
        toast.error('Image upload failed. Check connection.');
      } finally {
        if (isEdit) setEditImageUploading(false);
        else setUploadingImage(false);
      }
    };
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Category name is required');
      return;
    }
    if (!image || !image.trim()) {
      toast.error('Category image is required. Please upload an image.');
      return;
    }

    setCreating(true);
    try {
      await api.post('/categories', { name, description, image, image_url: image });
      toast.success('Category created successfully.');
      setName('');
      setDescription('');
      setImage('');
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error creating category.');
    } finally {
      setCreating(false);
    }
  };

  const openEditModal = (cat) => {
    setEditCategoryData({
      id: cat._id || cat.id,
      name: cat.name || '',
      description: cat.description || cat.subtitle || '',
      image: cat.image_url || cat.image || '',
      image_url: cat.image_url || cat.image || '',
      status: cat.is_active !== false ? 'active' : 'inactive'
    });
    setEditModalOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editCategoryData || !editCategoryData.name.trim()) {
      toast.error('Category name is required');
      return;
    }

    setUpdating(true);
    try {
      await api.put(`/categories/${editCategoryData.id}`, editCategoryData);
      toast.success('Category updated successfully.');
      setEditModalOpen(false);
      setEditCategoryData(null);
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error updating category.');
    } finally {
      setUpdating(false);
    }
  };

  const confirmDeleteCategory = async () => {
    if (!deleteTargetId) return;
    try {
      const res = await api.delete(`/categories/${deleteTargetId}`);
      toast.success(res.data?.message || 'Category deleted successfully.');
      setDeleteTargetId(null);
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error deleting category.');
      setDeleteTargetId(null);
    }
  };

  // Analytics Metrics
  const totalCategories = categories.length;
  const activeCategories = categories.filter(c => c.is_active !== false).length;
  const categoriesWithProducts = categories.filter(c => (c.productCount || 0) > 0).length;
  const emptyCategories = categories.filter(c => (c.productCount || 0) === 0).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <p style={{ fontSize: '0.68rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--admin-text-muted)', margin: '0 0 0.2rem 0' }}>
            Catalog Taxonomy
          </p>
          <h2 style={{ fontSize: 'clamp(1.15rem, 2.5vw, 1.45rem)', fontFamily: 'var(--font-serif)', color: 'var(--admin-text-primary)', fontWeight: '800', margin: 0, lineHeight: '1.25' }}>
            Category Management
          </h2>
          <p style={{ color: 'var(--admin-text-secondary)', fontSize: '0.8rem', margin: '0.2rem 0 0 0', fontWeight: '500' }}>
            Control store collections, dynamic product filters, and collection hero images.
          </p>
        </div>

        <button onClick={fetchCategories} className="admin-btn-secondary" style={{ padding: '0.45rem 0.85rem', fontSize: '0.78rem' }}>
          <RefreshCw size={14} className={fetching ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Analytics Summary Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        <div className="admin-card" style={{ padding: '1rem 1.25rem', borderLeft: '4px solid var(--admin-accent)' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--admin-text-muted)', fontWeight: '750', textTransform: 'uppercase' }}>Total Categories</span>
          <div style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--admin-text-primary)', marginTop: '0.2rem' }}>{totalCategories}</div>
        </div>
        <div className="admin-card" style={{ padding: '1rem 1.25rem', borderLeft: '4px solid #3B82F6' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--admin-text-muted)', fontWeight: '750', textTransform: 'uppercase' }}>Active Collections</span>
          <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#3B82F6', marginTop: '0.2rem' }}>{activeCategories}</div>
        </div>
        <div className="admin-card" style={{ padding: '1rem 1.25rem', borderLeft: '4px solid #10B981' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--admin-text-muted)', fontWeight: '750', textTransform: 'uppercase' }}>With Products</span>
          <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#10B981', marginTop: '0.2rem' }}>{categoriesWithProducts}</div>
        </div>
        <div className="admin-card" style={{ padding: '1rem 1.25rem', borderLeft: '4px solid #F59E0B' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--admin-text-muted)', fontWeight: '750', textTransform: 'uppercase' }}>Empty Collections</span>
          <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#F59E0B', marginTop: '0.2rem' }}>{emptyCategories}</div>
        </div>
      </div>

      {/* Main Grid: Form Left, List Right */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>

        {/* Left Column: Create Category Form */}
        <div className="admin-card">
          <h3 style={{ fontSize: '1.1rem', fontFamily: 'var(--font-serif)', color: 'var(--admin-text-primary)', fontWeight: '800', marginBottom: '1.25rem', marginTop: 0 }}>
            Add New Category
          </h3>
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Name */}
            <div>
              <label style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Category Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Healthy Millet Snacks"
                className="admin-input"
              />
            </div>

            {/* Description */}
            <div>
              <label style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Description
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief collection summary for store visitors..."
                className="admin-input"
                style={{ resize: 'none' }}
              />
            </div>

            {/* Mandatory Image Upload */}
            <div style={{ backgroundColor: 'var(--admin-surface-elevated)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--admin-border)' }}>
              <label style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Category Image *
              </label>
              
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <input
                  type="text"
                  required
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="Cloudinary Image URL or Upload File"
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
                    cursor: uploadingImage ? 'not-allowed' : 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <Upload size={14} />
                  <span>{uploadingImage ? 'Uploading...' : 'Upload'}</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/jpg"
                    onChange={(e) => handleFileUpload(e, false)}
                    style={{ display: 'none' }}
                    disabled={uploadingImage}
                  />
                </label>
              </div>

              {/* Instant Image Preview */}
              {image ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginTop: '0.5rem', padding: '0.5rem', backgroundColor: 'var(--admin-surface-card)', borderRadius: '8px', border: '1px solid var(--admin-border)' }}>
                  <img src={image} alt="Category Preview" style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--admin-text-primary)' }}>Image Ready</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--admin-text-muted)' }}>Cloudinary URL stored</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setImage('')}
                    style={{ backgroundColor: 'transparent', border: 'none', color: 'var(--admin-danger)', cursor: 'pointer', padding: '4px' }}
                    title="Remove Image"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ) : (
                <span style={{ fontSize: '0.68rem', color: '#f59e0b', fontWeight: '700' }}>
                  ⚠️ Category image is required for publishing.
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={creating || uploadingImage || !image}
              className="admin-btn-primary"
              style={{ width: '100%', marginTop: '0.5rem', opacity: (!image || creating) ? 0.6 : 1 }}
            >
              <Plus size={15} />
              <span>{creating ? 'Creating Category...' : 'Save & Publish Category'}</span>
            </button>
          </form>
        </div>

        {/* Right Column: Categories List */}
        <div className="admin-card">
          <h3 style={{ fontSize: '1.1rem', fontFamily: 'var(--font-serif)', color: 'var(--admin-text-primary)', fontWeight: '800', marginBottom: '1.25rem', marginTop: 0 }}>
            Active Store Collections
          </h3>

          {fetching ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 0', gap: '0.5rem' }}>
              <RefreshCw size={20} className="animate-spin" color="var(--admin-accent)" />
              <span style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)', fontWeight: '600' }}>Fetching live database categories...</span>
            </div>
          ) : categories.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {categories.map((cat) => {
                const img = cat.image_url || cat.image || 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500';
                const pCount = cat.productCount || 0;
                const isActive = cat.is_active !== false;

                return (
                  <div
                    key={cat._id || cat.id || cat.slug}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.85rem 1rem',
                      borderRadius: '12px',
                      backgroundColor: 'var(--admin-surface-elevated)',
                      border: '1px solid var(--admin-border)',
                      gap: '0.85rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flex: 1, minWidth: 0 }}>
                      {/* Thumbnail */}
                      <img 
                        src={img} 
                        alt={cat.name} 
                        style={{ width: '48px', height: '48px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0, border: '1px solid var(--admin-border)' }} 
                      />
                      
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: '800', color: 'var(--admin-text-primary)', fontSize: '0.9rem' }}>{cat.name}</span>
                          <span className={`admin-badge ${isActive ? 'admin-badge-success' : 'admin-badge-warning'}`} style={{ fontSize: '0.62rem', padding: '0.1rem 0.45rem' }}>
                            {isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--admin-text-muted)', marginTop: '0.15rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                          <span>Slug: <strong style={{ color: 'var(--admin-accent)' }}>{cat.slug}</strong></span>
                          <span>•</span>
                          <span><strong style={{ color: 'var(--admin-text-primary)' }}>{pCount}</strong> {pCount === 1 ? 'Product' : 'Products'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: '0.35rem', flexShrink: 0 }}>
                      <button
                        onClick={() => openEditModal(cat)}
                        className="admin-icon-btn"
                        style={{ color: 'var(--admin-accent)' }}
                        title="Edit Category"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteTargetId(cat._id || cat.id || cat.slug)}
                        className="admin-icon-btn"
                        style={{ color: 'var(--admin-danger)' }}
                        title="Delete Category"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--admin-text-muted)', fontSize: '0.85rem', fontWeight: '600' }}>
              No categories defined.
            </div>
          )}
        </div>

      </div>

      {/* Edit Category Modal */}
      {editModalOpen && editCategoryData && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="admin-card" style={{ width: '100%', maxWidth: '480px', padding: '1.75rem', position: 'relative' }}>
            <button
              onClick={() => { setEditModalOpen(false); setEditCategoryData(null); }}
              style={{ position: 'absolute', top: '16px', right: '16px', backgroundColor: 'transparent', border: 'none', color: 'var(--admin-text-muted)', cursor: 'pointer' }}
            >
              <X size={18} />
            </button>

            <h3 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-serif)', color: 'var(--admin-text-primary)', fontWeight: '800', marginBottom: '1.25rem', marginTop: 0 }}>
              Edit Collection Category
            </h3>

            <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase' }}>Category Name *</label>
                <input
                  type="text"
                  required
                  value={editCategoryData.name}
                  onChange={(e) => setEditCategoryData({ ...editCategoryData, name: e.target.value })}
                  className="admin-input"
                />
              </div>

              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase' }}>Description</label>
                <textarea
                  rows={3}
                  value={editCategoryData.description}
                  onChange={(e) => setEditCategoryData({ ...editCategoryData, description: e.target.value })}
                  className="admin-input"
                  style={{ resize: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase' }}>Status</label>
                <select
                  value={editCategoryData.status}
                  onChange={(e) => setEditCategoryData({ ...editCategoryData, status: e.target.value })}
                  className="admin-input"
                >
                  <option value="active">Active (Visible)</option>
                  <option value="inactive">Inactive (Hidden)</option>
                </select>
              </div>

              {/* Image Change */}
              <div style={{ backgroundColor: 'var(--admin-surface-elevated)', padding: '0.85rem', borderRadius: '10px', border: '1px solid var(--admin-border)' }}>
                <label style={{ fontSize: '0.72rem', fontWeight: '800', color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase' }}>Category Image</label>
                
                {editCategoryData.image ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <img src={editCategoryData.image} alt="Preview" style={{ width: '50px', height: '50px', borderRadius: '8px', objectFit: 'cover' }} />
                    <span style={{ fontSize: '0.72rem', color: 'var(--admin-text-muted)' }}>Current Image Active</span>
                  </div>
                ) : null}

                <label className="admin-btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.4rem 0.85rem', fontSize: '0.78rem', cursor: editImageUploading ? 'not-allowed' : 'pointer' }}>
                  <Upload size={14} />
                  <span>{editImageUploading ? 'Uploading...' : 'Upload New Image'}</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/jpg"
                    onChange={(e) => handleFileUpload(e, true)}
                    style={{ display: 'none' }}
                    disabled={editImageUploading}
                  />
                </label>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="admin-btn-secondary"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating || editImageUploading}
                  className="admin-btn-primary"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  {updating ? 'Updating...' : 'Update Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Deletion */}
      <ConfirmationModal
        isOpen={!!deleteTargetId}
        title="Delete Category?"
        message="Are you sure you want to delete this category? If products are currently assigned to this category, deletion will be blocked."
        confirmText="Delete Category"
        cancelText="Cancel"
        isDanger={true}
        onConfirm={confirmDeleteCategory}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
}
