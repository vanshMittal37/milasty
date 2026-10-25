import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Tags, RefreshCw, Upload, Image as ImageIcon, Edit3, ShieldAlert, CheckCircle, Package, Layers, X, Search, Check } from 'lucide-react';
import api from '../../api/axios';
import ConfirmationModal from '../../components/ConfirmationModal';
import { useToast } from '../../context/ToastContext';
import { useCategories } from '../../context/CategoryContext';

const ACCEPTED_IMAGE_TYPES = /^image\/(jpeg|jpg|png|webp)$/i;
const MAX_SOURCE_BYTES = 10 * 1024 * 1024; // what the admin may pick; it is resized before upload
const MAX_EDGE_PX = 1600;                   // category tiles never display larger than this

const readAsDataUrl = (blob) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = () => reject(new Error('The file could not be read. Please choose it again.'));
  reader.readAsDataURL(blob);
});

/**
 * Downscale big photos in the browser so the upload stays small (phone photos are often 5–10 MB,
 * which is slow and can exceed hosting request limits). Small images are sent as they are.
 * WEBP keeps PNG transparency; browsers that can't encode WEBP fall back to the original file.
 */
async function prepareCategoryImage(file) {
  const original = await readAsDataUrl(file);
  const img = await new Promise((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error('This image could not be opened. Please choose a JPG, PNG or WEBP image.'));
    el.src = original;
  });
  const scale = Math.min(1, MAX_EDGE_PX / Math.max(img.naturalWidth, img.naturalHeight));
  if (scale === 1 && file.size <= 1.5 * 1024 * 1024) return original;

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.naturalWidth * scale);
  canvas.height = Math.round(img.naturalHeight * scale);
  canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
  const resized = canvas.toDataURL('image/webp', 0.88);
  if (!resized.startsWith('data:image/webp')) return original;
  return resized.length < original.length ? resized : original;
}

// Message for a failed upload: the server's own explanation when there is one
function uploadErrorMessage(err) {
  if (!err.response) return 'Upload failed: could not reach the server. Check your internet connection and try again.';
  const { status, data } = err.response;
  if (data?.message) return data.message;
  if (status === 401 || status === 403) return 'Your admin session has expired. Please log in again and retry.';
  if (status === 413) return 'This image is too large to upload. Please choose a smaller image.';
  return `Upload failed (error ${status}). Please try again.`;
}

export default function AdminCategories() {
  const { categories, categoriesLoading: fetching, refreshCategories } = useCategories();
  
  // Products list for multi-select taxonomy assignment
  const [allProducts, setAllProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);

  // Create Category Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [creating, setCreating] = useState(false);

  // Edit Category Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editCategoryData, setEditCategoryData] = useState(null);
  const [editProductSearch, setEditProductSearch] = useState('');
  const [editImageUploading, setEditImageUploading] = useState(false);
  // Upload feedback per form: { status: 'uploading'|'done'|'error', progress, message, preview }
  const [createUpload, setCreateUpload] = useState(null);
  const [editUpload, setEditUpload] = useState(null);
  const [updating, setUpdating] = useState(false);

  // Delete State
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  const { toast } = useToast();

  // Load products list on mount
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setProductsLoading(true);
    try {
      const res = await api.get('/products?includeUpcoming=true&limit=500');
      const list = res.data.products || res.data || [];
      setAllProducts(list);
    } catch (err) {
      console.error('Error fetching products for taxonomy assignment:', err);
    } finally {
      setProductsLoading(false);
    }
  };

  // Toggle selection for Create Category
  const toggleSelectProduct = (productId) => {
    setSelectedProductIds(prev =>
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );
  };

  // Toggle selection for Edit Category
  const toggleEditSelectProduct = (productId) => {
    if (!editCategoryData) return;
    setEditCategoryData(prev => {
      const current = prev.productIds || [];
      const updated = current.includes(productId)
        ? current.filter(id => id !== productId)
        : [...current, productId];
      return { ...prev, productIds: updated };
    });
  };

  // Image upload (Cloudinary via /api/upload). The category keeps its current image until a new one
  // has uploaded AND the form is saved — a failed upload changes nothing.
  const handleFileUpload = async (e, isEdit = false) => {
    const input = e.target;
    const file = input.files?.[0];
    input.value = ''; // lets the admin pick the same file again after an error
    if (!file) return;

    const setStatus = isEdit ? setEditUpload : setCreateUpload;
    const setBusy = isEdit ? setEditImageUploading : setUploadingImage;
    const fail = (message) => {
      setStatus((prev) => ({ ...prev, status: 'error', message }));
      toast.error(message);
    };

    if (!ACCEPTED_IMAGE_TYPES.test(file.type)) {
      fail('Only JPG, PNG or WEBP images are supported.');
      return;
    }
    if (file.size > MAX_SOURCE_BYTES) {
      fail('This image is larger than 10 MB. Please choose a smaller image.');
      return;
    }

    const preview = URL.createObjectURL(file);
    setStatus({ status: 'uploading', progress: 0, message: 'Preparing image…', preview });
    setBusy(true);
    try {
      const imageData = await prepareCategoryImage(file);
      const res = await api.post('/upload', { image: imageData }, {
        onUploadProgress: (ev) => {
          if (!ev.total) return;
          const progress = Math.min(99, Math.round((ev.loaded / ev.total) * 100));
          setStatus((prev) => ({ ...prev, progress, message: `Uploading… ${progress}%` }));
        },
      });
      const url = res.data?.url;
      if (!url) throw Object.assign(new Error('no url'), { response: { status: 502, data: { message: 'Upload finished but no image URL was returned. Please try again.' } } });

      if (isEdit) setEditCategoryData((prev) => (prev ? { ...prev, image: url, image_url: url } : prev));
      else setImage(url);
      setStatus({ status: 'done', progress: 100, preview, message: isEdit ? 'New image uploaded — click "Update Category" to save it.' : 'Image uploaded.' });
      toast.success('Image uploaded. Save the category to apply it.');
    } catch (err) {
      console.error('Category image upload error:', err);
      // Errors from reading/resizing the file already carry a message for the admin
      fail(err.response || err.isAxiosError ? uploadErrorMessage(err) : err.message);
    } finally {
      setBusy(false);
    }
  };

  const UploadStatus = ({ state }) => {
    if (!state) return null;
    const color = state.status === 'error' ? '#C62828' : state.status === 'done' ? '#2F7D32' : '#8A5A1F';
    return (
      <div role={state.status === 'error' ? 'alert' : 'status'} style={{ marginTop: '0.5rem' }}>
        {state.status === 'uploading' && (
          <div style={{ height: '6px', borderRadius: '999px', backgroundColor: 'rgba(198,138,58,0.18)', overflow: 'hidden', marginBottom: '0.35rem' }}>
            <div style={{ width: `${state.progress || 5}%`, height: '100%', backgroundColor: '#C68A3A', transition: 'width 0.2s ease' }} />
          </div>
        )}
        <div style={{ fontSize: '0.74rem', fontWeight: 700, color }}>{state.message}</div>
      </div>
    );
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
      await api.post('/categories', {
        name,
        description,
        image,
        image_url: image,
        productIds: selectedProductIds
      });
      toast.success('Category created successfully.');
      setName('');
      setDescription('');
      setImage('');
      setCreateUpload(null);
      setSelectedProductIds([]);
      setProductSearch('');
      refreshCategories();
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
      status: cat.is_active !== false ? 'active' : 'inactive',
      productIds: Array.isArray(cat.productIds) ? cat.productIds : []
    });
    setEditProductSearch('');
    setEditUpload(null);
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
      const res = await api.put(`/categories/${editCategoryData.id}`, editCategoryData);
      // Confirm the server stored the image we uploaded, not just that the request succeeded
      if (editUpload?.status === 'done' && res.data?.image_url && res.data.image_url !== editCategoryData.image_url) {
        toast.error('The category saved, but the new image was not stored. Please upload it again.');
        return;
      }
      setEditUpload(null);
      toast.success('Category updated successfully.');
      setEditModalOpen(false);
      setEditCategoryData(null);
      refreshCategories();
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
      refreshCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error deleting category.');
    } finally {
      setDeleteTargetId(null);
    }
  };

  // Image currently saved for the category being edited (not the unsaved upload)
  const savedEditCategory = editCategoryData ? categories.find((c) => (c._id || c.id) === editCategoryData.id) : null;
  const savedEditImage = savedEditCategory?.image_url || savedEditCategory?.image || null;

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
          <p style={{ fontSize: '0.68rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.07em', color: '#665A52', margin: '0 0 0.2rem 0' }}>
            Catalog Taxonomy
          </p>
          <h2 style={{ fontSize: 'clamp(1.15rem, 2.5vw, 1.45rem)', fontFamily: 'var(--font-serif)', color: '#21150F', fontWeight: '800', margin: 0, lineHeight: '1.25' }}>
            Category Management
          </h2>
          <p style={{ color: '#4A3B2E', fontSize: '0.8rem', margin: '0.2rem 0 0 0', fontWeight: '500' }}>
            Control store collections, dynamic product filters, and collection hero images.
          </p>
        </div>

        <button onClick={refreshCategories} className="admin-btn-secondary" style={{ padding: '0.45rem 0.85rem', fontSize: '0.78rem' }}>
          <RefreshCw size={14} className={fetching ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Analytics Summary Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        <div className="admin-card" style={{ padding: '1rem 1.25rem', borderLeft: '4px solid #C68A3A' }}>
          <span style={{ fontSize: '0.7rem', color: '#665A52', fontWeight: '750', textTransform: 'uppercase' }}>Total Categories</span>
          <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#21150F', marginTop: '0.2rem' }}>{totalCategories}</div>
        </div>
        <div className="admin-card" style={{ padding: '1rem 1.25rem', borderLeft: '4px solid #3B82F6' }}>
          <span style={{ fontSize: '0.7rem', color: '#665A52', fontWeight: '750', textTransform: 'uppercase' }}>Active Collections</span>
          <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#3B82F6', marginTop: '0.2rem' }}>{activeCategories}</div>
        </div>
        <div className="admin-card" style={{ padding: '1rem 1.25rem', borderLeft: '4px solid #10B981' }}>
          <span style={{ fontSize: '0.7rem', color: '#665A52', fontWeight: '750', textTransform: 'uppercase' }}>With Products</span>
          <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#10B981', marginTop: '0.2rem' }}>{categoriesWithProducts}</div>
        </div>
        <div className="admin-card" style={{ padding: '1rem 1.25rem', borderLeft: '4px solid #F59E0B' }}>
          <span style={{ fontSize: '0.7rem', color: '#665A52', fontWeight: '750', textTransform: 'uppercase' }}>Empty Collections</span>
          <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#F59E0B', marginTop: '0.2rem' }}>{emptyCategories}</div>
        </div>
      </div>

      {/* Main Grid: Form Left, List Right */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>

        {/* Left Column: Create Category Form */}
        <div className="admin-card">
          <h3 style={{ fontSize: '1.1rem', fontFamily: 'var(--font-serif)', color: '#21150F', fontWeight: '800', marginBottom: '1.25rem', marginTop: 0 }}>
            Add New Category
          </h3>
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Name */}
            <div>
              <label style={{ fontSize: '0.74rem', fontWeight: '800', color: '#4A3B2E', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
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
              <label style={{ fontSize: '0.74rem', fontWeight: '800', color: '#4A3B2E', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
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
            <div style={{ backgroundColor: 'var(--admin-surface-elevated)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(231, 222, 213, 0.65)' }}>
              <label style={{ fontSize: '0.74rem', fontWeight: '800', color: '#4A3B2E', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
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
                    backgroundColor: '#C68A3A',
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginTop: '0.5rem', padding: '0.5rem', backgroundColor: 'var(--admin-surface-card)', borderRadius: '8px', border: '1px solid rgba(231, 222, 213, 0.65)' }}>
                  <img src={image} alt="Category Preview" style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#21150F' }}>Image Ready</div>
                    <div style={{ fontSize: '0.68rem', color: '#665A52' }}>Cloudinary URL stored</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setImage('')}
                    style={{ backgroundColor: 'transparent', border: 'none', color: '#C62828', cursor: 'pointer', padding: '4px' }}
                    title="Remove Image"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ) : createUpload?.status === 'uploading' && createUpload.preview ? (
                <img src={createUpload.preview} alt="Uploading" style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover', opacity: 0.55 }} />
              ) : (
                <span style={{ fontSize: '0.68rem', color: '#f59e0b', fontWeight: '700' }}>
                  ⚠️ Category image is required for publishing.
                </span>
              )}
              <UploadStatus state={createUpload} />
            </div>

            {/* PRODUCTS IN THIS CATEGORY */}
            <div style={{ backgroundColor: 'var(--admin-surface-elevated)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(231, 222, 213, 0.65)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <label style={{ fontSize: '0.74rem', fontWeight: '800', color: '#4A3B2E', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Products in this Category
                </label>
                <span style={{ fontSize: '0.7rem', color: '#C68A3A', fontWeight: '800' }}>
                  Selected: {selectedProductIds.length}
                </span>
              </div>
              <p style={{ fontSize: '0.68rem', color: '#665A52', margin: '0 0 0.75rem 0' }}>
                Select the products that should appear in this collection.
              </p>

              {/* Search input */}
              <div style={{ position: 'relative', marginBottom: '0.6rem' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#665A52' }} />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Search products..."
                  className="admin-input admin-search-input"
                  style={{ fontSize: '0.78rem', padding: '0.45rem 0.75rem 0.45rem 2.5rem' }}
                />
              </div>

              {/* Product List Selector */}
              <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.35rem', border: '1px solid rgba(231, 222, 213, 0.65)', borderRadius: '8px', padding: '0.4rem', backgroundColor: 'var(--admin-surface-card)' }}>
                {allProducts.length === 0 ? (
                  <div style={{ fontSize: '0.72rem', color: '#665A52', textAlign: 'center', padding: '1rem 0' }}>
                    {productsLoading ? 'Loading store products...' : 'No products found'}
                  </div>
                ) : (
                  allProducts
                    .filter(p => {
                      const pTitle = p.title || p.name || '';
                      return !productSearch || pTitle.toLowerCase().includes(productSearch.toLowerCase());
                    })
                    .map(p => {
                      const pId = p.id || p._id;
                      const pTitle = p.title || p.name || 'Untitled Product';
                      const isSelected = selectedProductIds.includes(pId);
                      const pImg = p.image || p.image_url || (p.images && p.images[0]?.image_url);
                      return (
                        <div
                          key={pId}
                          onClick={() => toggleSelectProduct(pId)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.4rem 0.6rem',
                            borderRadius: '6px',
                            backgroundColor: isSelected ? 'rgba(36, 79, 33, 0.12)' : 'transparent',
                            border: isSelected ? '1px solid #C68A3A' : '1px solid transparent',
                            cursor: 'pointer',
                            userSelect: 'none'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flex: 1, minWidth: 0 }}>
                            {pImg ? (
                              <img src={pImg} alt={pTitle} style={{ width: '32px', height: '32px', borderRadius: '6px', objectFit: 'cover' }} />
                            ) : (
                              <div style={{ width: '32px', height: '32px', borderRadius: '6px', backgroundColor: 'var(--admin-surface-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Package size={14} color="#665A52" />
                              </div>
                            )}
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{ fontSize: '0.78rem', fontWeight: '700', color: '#21150F', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                {pTitle}
                              </div>
                              <div style={{ fontSize: '0.66rem', color: '#665A52' }}>
                                ₹{p.price || 0} {p.is_active !== false ? '• Active' : '• Inactive'}
                              </div>
                            </div>
                          </div>
                          <div style={{
                            width: '18px',
                            height: '18px',
                            borderRadius: '4px',
                            border: isSelected ? 'none' : '1.5px solid rgba(231, 222, 213, 0.65)',
                            backgroundColor: isSelected ? '#C68A3A' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#ffffff',
                            flexShrink: 0,
                            marginLeft: '0.5rem'
                          }}>
                            {isSelected && <Check size={12} strokeWidth={3} />}
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
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
          <h3 style={{ fontSize: '1.1rem', fontFamily: 'var(--font-serif)', color: '#21150F', fontWeight: '800', marginBottom: '1.25rem', marginTop: 0 }}>
            Active Store Collections
          </h3>

          {fetching ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 0', gap: '0.5rem' }}>
              <RefreshCw size={20} className="animate-spin" color="#C68A3A" />
              <span style={{ fontSize: '0.8rem', color: '#665A52', fontWeight: '600' }}>Fetching live database categories...</span>
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
                      border: '1px solid rgba(231, 222, 213, 0.65)',
                      gap: '0.85rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flex: 1, minWidth: 0 }}>
                      {/* Thumbnail */}
                      <img 
                        src={img} 
                        alt={cat.name} 
                        style={{ width: '48px', height: '48px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0, border: '1px solid rgba(231, 222, 213, 0.65)' }} 
                      />
                      
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: '800', color: '#21150F', fontSize: '0.9rem' }}>{cat.name}</span>
                          <span className={`admin-badge ${isActive ? 'admin-badge-success' : 'admin-badge-warning'}`} style={{ fontSize: '0.62rem', padding: '0.1rem 0.45rem' }}>
                            {isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#665A52', marginTop: '0.15rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                          <span>Slug: <strong style={{ color: '#C68A3A' }}>{cat.slug}</strong></span>
                          <span>•</span>
                          <span><strong style={{ color: '#21150F' }}>{pCount}</strong> {pCount === 1 ? 'Product' : 'Products'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: '0.35rem', flexShrink: 0 }}>
                      <button
                        onClick={() => openEditModal(cat)}
                        className="admin-icon-btn"
                        style={{ color: '#C68A3A' }}
                        title="Edit Category"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteTargetId(cat._id || cat.id || cat.slug)}
                        className="admin-icon-btn"
                        style={{ color: '#C62828' }}
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
            <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#665A52', fontSize: '0.85rem', fontWeight: '600' }}>
              No categories defined.
            </div>
          )}
        </div>

      </div>

      {/* Edit Category Modal */}
      {editModalOpen && editCategoryData && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="admin-card" style={{ width: '100%', maxWidth: '520px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
            
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexShrink: 0 }}>
              <h3 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-serif)', color: '#21150F', fontWeight: '800', margin: 0 }}>
                Edit Collection Category
              </h3>
              <button
                type="button"
                onClick={() => { setEditModalOpen(false); setEditCategoryData(null); }}
                style={{ backgroundColor: 'transparent', border: 'none', color: '#665A52', cursor: 'pointer', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto', paddingRight: '0.4rem', gap: '1.15rem' }}>
              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: '800', color: '#4A3B2E', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase' }}>Category Name *</label>
                <input
                  type="text"
                  required
                  value={editCategoryData.name}
                  onChange={(e) => setEditCategoryData({ ...editCategoryData, name: e.target.value })}
                  className="admin-input"
                />
              </div>

              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: '800', color: '#4A3B2E', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase' }}>Description</label>
                <textarea
                  rows={3}
                  value={editCategoryData.description}
                  onChange={(e) => setEditCategoryData({ ...editCategoryData, description: e.target.value })}
                  className="admin-input"
                  style={{ resize: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: '800', color: '#4A3B2E', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase' }}>Status</label>
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
              <div style={{ backgroundColor: 'var(--admin-surface-elevated)', padding: '0.85rem', borderRadius: '10px', border: '1px solid rgba(231, 222, 213, 0.65)' }}>
                <label style={{ fontSize: '0.72rem', fontWeight: '800', color: '#4A3B2E', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase' }}>Category Image</label>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.6rem', flexWrap: 'wrap' }}>
                  {/* The saved image stays until a new one has uploaded and the category is updated */}
                  {savedEditImage && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <img src={savedEditImage} alt="Current category" style={{ width: '50px', height: '50px', borderRadius: '8px', objectFit: 'cover' }} />
                      <span style={{ fontSize: '0.72rem', color: '#665A52' }}>Current image</span>
                    </div>
                  )}
                  {editUpload?.preview && editUpload.status !== 'error' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <img src={editUpload.preview} alt="New category" style={{ width: '50px', height: '50px', borderRadius: '8px', objectFit: 'cover', opacity: editUpload.status === 'uploading' ? 0.55 : 1, outline: '2px solid #C68A3A', outlineOffset: '2px' }} />
                      <span style={{ fontSize: '0.72rem', color: '#8A5A1F', fontWeight: 700 }}>New image</span>
                    </div>
                  )}
                </div>

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
                <div style={{ fontSize: '0.7rem', color: '#665A52', marginTop: '0.4rem' }}>JPG, PNG or WEBP · up to 10 MB · large photos are resized automatically</div>
                <UploadStatus state={editUpload} />
              </div>

              {/* PRODUCTS IN THIS CATEGORY */}
              <div style={{ backgroundColor: 'var(--admin-surface-elevated)', padding: '0.85rem', borderRadius: '10px', border: '1px solid rgba(231, 222, 213, 0.65)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label style={{ fontSize: '0.72rem', fontWeight: '800', color: '#4A3B2E', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Products in this Category
                  </label>
                  <span style={{ fontSize: '0.7rem', color: '#C68A3A', fontWeight: '800' }}>
                    Selected: {(editCategoryData.productIds || []).length}
                  </span>
                </div>
                <p style={{ fontSize: '0.68rem', color: '#665A52', margin: '0 0 0.65rem 0' }}>
                  Select the products that should appear in this collection.
                </p>

                {/* Search input */}
                <div style={{ position: 'relative', marginBottom: '0.6rem' }}>
                  <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#665A52' }} />
                  <input
                    type="text"
                    value={editProductSearch}
                    onChange={(e) => setEditProductSearch(e.target.value)}
                    placeholder="Search products..."
                    className="admin-input admin-search-input"
                    style={{ fontSize: '0.78rem', padding: '0.45rem 0.75rem 0.45rem 2.5rem' }}
                  />
                </div>

                {/* Product List Selector */}
                <div style={{ maxHeight: '140px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.35rem', border: '1px solid rgba(231, 222, 213, 0.65)', borderRadius: '8px', padding: '0.4rem', backgroundColor: 'var(--admin-surface-card)' }}>
                  {allProducts.length === 0 ? (
                    <div style={{ fontSize: '0.72rem', color: '#665A52', textAlign: 'center', padding: '1rem 0' }}>
                      {productsLoading ? 'Loading store products...' : 'No products found'}
                    </div>
                  ) : (
                    allProducts
                      .filter(p => {
                        const pTitle = p.title || p.name || '';
                        return !editProductSearch || pTitle.toLowerCase().includes(editProductSearch.toLowerCase());
                      })
                      .map(p => {
                        const pId = p.id || p._id;
                        const pTitle = p.title || p.name || 'Untitled Product';
                        const isSelected = (editCategoryData.productIds || []).includes(pId);
                        const pImg = p.image || p.image_url || (p.images && p.images[0]?.image_url);
                        return (
                          <div
                            key={pId}
                            onClick={() => toggleEditSelectProduct(pId)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '0.4rem 0.6rem',
                              borderRadius: '6px',
                              backgroundColor: isSelected ? 'rgba(36, 79, 33, 0.12)' : 'transparent',
                              border: isSelected ? '1px solid #C68A3A' : '1px solid transparent',
                              cursor: 'pointer',
                              userSelect: 'none'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flex: 1, minWidth: 0 }}>
                              {pImg ? (
                                <img src={pImg} alt={pTitle} style={{ width: '32px', height: '32px', borderRadius: '6px', objectFit: 'cover' }} />
                              ) : (
                                <div style={{ width: '32px', height: '32px', borderRadius: '6px', backgroundColor: 'var(--admin-surface-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <Package size={14} color="#665A52" />
                                </div>
                              )}
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <div style={{ fontSize: '0.78rem', fontWeight: '700', color: '#21150F', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                  {pTitle}
                                </div>
                                <div style={{ fontSize: '0.66rem', color: '#665A52' }}>
                                  ₹{p.price || 0} {p.is_active !== false ? '• Active' : '• Inactive'}
                                </div>
                              </div>
                            </div>
                            <div style={{
                              width: '18px',
                              height: '18px',
                              borderRadius: '4px',
                              border: isSelected ? 'none' : '1.5px solid rgba(231, 222, 213, 0.65)',
                              backgroundColor: isSelected ? '#C68A3A' : 'transparent',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#ffffff',
                              flexShrink: 0,
                              marginLeft: '0.5rem'
                            }}>
                              {isSelected && <Check size={12} strokeWidth={3} />}
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>
              </div>

              {/* Sticky Footer for Buttons */}
              <div 
                style={{ 
                  display: 'flex', 
                  gap: '0.75rem', 
                  marginTop: '0.5rem',
                  paddingTop: '0.85rem', 
                  borderTop: '1px solid rgba(231, 222, 213, 0.65)',
                  backgroundColor: 'var(--admin-surface-card)',
                  position: 'sticky',
                  bottom: 0,
                  zIndex: 10,
                  flexShrink: 0
                }}
              >
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

