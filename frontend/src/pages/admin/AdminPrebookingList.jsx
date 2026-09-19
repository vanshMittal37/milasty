import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Calendar, Search, RefreshCw, CheckCircle2, XCircle, Clock, Package } from 'lucide-react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import ConfirmationModal from '../../components/ConfirmationModal';

export default function AdminPrebookingList() {
  const { toast } = useToast();
  const [prebookings, setPrebookings] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal / Form state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [productSearch, setProductSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form Fields
  const [launchDate, setLaunchDate] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [preorderEnabled, setPreorderEnabled] = useState(true);
  const [displayOrder, setDisplayOrder] = useState(1);
  const [customHeading, setCustomHeading] = useState('');
  const [customDescription, setCustomDescription] = useState('');

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pbRes, prodRes] = await Promise.all([
        api.get('/prebookings/admin/all'),
        api.get('/products?limit=100'),
      ]);

      if (pbRes.data) setPrebookings(pbRes.data);
      if (prodRes.data && prodRes.data.products) setProducts(prodRes.data.products);
    } catch (err) {
      console.error('Error loading prebookings data:', err);
      toast.error('Failed to load prebooking products.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setSelectedProduct(null);
    setProductSearch('');
    // Default launch date to 30 days in the future formatted YYYY-MM-DD
    const defaultDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    setLaunchDate(defaultDate);
    setEnabled(true);
    setPreorderEnabled(true);
    setDisplayOrder(prebookings.length + 1);
    setCustomHeading('');
    setCustomDescription('');
    setModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    const matched = products.find((p) => String(p.id || p._id) === String(item.productId));
    setSelectedProduct(matched || { id: item.productId, title: item.productTitle });
    setProductSearch(matched ? matched.title : item.productTitle || '');
    const dateFormatted = item.launchDate ? new Date(item.launchDate).toISOString().split('T')[0] : '';
    setLaunchDate(dateFormatted);
    setEnabled(item.enabled !== false);
    setPreorderEnabled(item.preorderEnabled !== false);
    setDisplayOrder(item.displayOrder || 1);
    setCustomHeading(item.customHeading || '');
    setCustomDescription(item.customDescription || '');
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!selectedProduct) {
      toast.error('Please select an existing product for pre-booking.');
      return;
    }
    if (!launchDate) {
      toast.error('Please select a valid launch date.');
      return;
    }

    setSaving(true);
    const payload = {
      productId: selectedProduct.id || selectedProduct._id,
      launchDate: new Date(launchDate).toISOString(),
      enabled,
      preorderEnabled,
      displayOrder: Number(displayOrder || 1),
      customHeading,
      customDescription,
    };

    try {
      if (editingItem) {
        await api.put(`/prebookings/${editingItem.id}`, payload);
        toast.success('Pre-booking product updated successfully.');
      } else {
        await api.post('/prebookings', payload);
        toast.success('Pre-booking product added successfully.');
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Error saving prebooking:', err);
      toast.error(err.response?.data?.message || 'Failed to save pre-booking product.');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    try {
      await api.delete(`/prebookings/${deletingId}`);
      toast.success('Removed product from pre-bookings.');
      setDeleteModalOpen(false);
      setDeletingId(null);
      fetchData();
    } catch (err) {
      toast.error('Failed to remove pre-booking product.');
    }
  };

  const filteredPrebookings = prebookings.filter((pb) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (pb.productTitle && pb.productTitle.toLowerCase().includes(q)) ||
      (pb.customHeading && pb.customHeading.toLowerCase().includes(q))
    );
  });

  const filteredProductOptions = products.filter((p) => {
    if (!productSearch) return true;
    return p.title.toLowerCase().includes(productSearch.toLowerCase());
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', color: 'var(--admin-text-primary)', fontWeight: '800', margin: 0, fontFamily: 'var(--font-serif)' }}>
            Pre-Booking Products
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--admin-text-muted)', margin: '0.2rem 0 0 0' }}>
            Manage upcoming MILASTY products and their launch dates displayed in the "What's Next" section.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="admin-btn-primary"
          style={{ padding: '0.65rem 1.25rem', fontSize: '0.85rem' }}
        >
          <Plus size={16} />
          <span>+ Add Pre-Booking Product</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="admin-card" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={16} color="var(--admin-text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search pre-booking products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="admin-input"
            style={{ paddingLeft: '2.4rem' }}
          />
        </div>
      </div>

      {/* Main Table View */}
      <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '4rem', gap: '0.75rem' }}>
            <RefreshCw size={22} className="animate-spin" color="var(--admin-accent)" />
            <span style={{ fontSize: '0.9rem', color: 'var(--admin-text-muted)' }}>Loading pre-booking products...</span>
          </div>
        ) : filteredPrebookings.length === 0 ? (
          <div style={{ padding: '4rem 1.5rem', textAlign: 'center', color: 'var(--admin-text-muted)' }}>
            <Clock size={36} color="var(--admin-text-muted)" style={{ marginBottom: '0.75rem' }} />
            <h4 style={{ fontSize: '1.05rem', color: 'var(--admin-text-primary)', margin: '0 0 0.35rem 0', fontWeight: '700' }}>
              No upcoming products configured
            </h4>
            <p style={{ fontSize: '0.82rem', margin: '0 auto 1.25rem', maxWidth: '420px' }}>
              Add a product to show it in the "What's Next from MILASTY" section on the shop page.
            </p>
            <button onClick={handleOpenAdd} className="admin-btn-secondary" style={{ fontSize: '0.82rem' }}>
              <Plus size={14} />
              <span>Add First Pre-Booking Product</span>
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--admin-surface-elevated)', borderBottom: '1px solid var(--admin-border)', color: 'var(--admin-text-muted)', textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Product</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Launch Date</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Status</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Pre-Booking</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Order</th>
                  <th style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPrebookings.map((item) => {
                  const launchDateObj = item.launchDate ? new Date(item.launchDate) : null;
                  const formattedDate = launchDateObj ? launchDateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A';
                  const isUpcoming = launchDateObj ? launchDateObj > new Date() : true;

                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--admin-border)' }}>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                          {item.productImage ? (
                            <img src={item.productImage} alt={item.productTitle} style={{ width: '44px', height: '44px', borderRadius: '8px', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: '44px', height: '44px', borderRadius: '8px', backgroundColor: 'var(--admin-surface-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Package size={20} color="var(--admin-text-muted)" />
                            </div>
                          )}
                          <div>
                            <div style={{ fontWeight: '800', color: 'var(--admin-text-primary)' }}>
                              {item.productTitle}
                            </div>
                            {item.customHeading && item.customHeading !== item.productTitle && (
                              <div style={{ fontSize: '0.74rem', color: 'var(--admin-accent)' }}>
                                Title: {item.customHeading}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '1rem 1.25rem', fontWeight: '600', color: 'var(--admin-text-primary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Calendar size={14} color="var(--admin-accent)" />
                          <span>{formattedDate}</span>
                        </div>
                      </td>

                      <td style={{ padding: '1rem 1.25rem' }}>
                        {!item.enabled ? (
                          <span className="admin-badge admin-badge-danger" style={{ fontSize: '0.72rem' }}>Disabled</span>
                        ) : isUpcoming ? (
                          <span className="admin-badge admin-badge-success" style={{ fontSize: '0.72rem' }}>Upcoming</span>
                        ) : (
                          <span className="admin-badge admin-badge-warning" style={{ fontSize: '0.72rem' }}>Launched</span>
                        )}
                      </td>

                      <td style={{ padding: '1rem 1.25rem' }}>
                        {item.preorderEnabled ? (
                          <span style={{ color: 'var(--admin-accent)', fontWeight: '700', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <CheckCircle2 size={14} /> Enabled
                          </span>
                        ) : (
                          <span style={{ color: 'var(--admin-text-muted)', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <XCircle size={14} /> Closed
                          </span>
                        )}
                      </td>

                      <td style={{ padding: '1rem 1.25rem', fontWeight: '700', color: 'var(--admin-text-secondary)' }}>
                        #{item.displayOrder || 1}
                      </td>

                      <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="admin-icon-btn"
                            title="Edit Pre-booking"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => {
                              setDeletingId(item.id);
                              setDeleteModalOpen(true);
                            }}
                            className="admin-icon-btn"
                            style={{ color: 'var(--admin-danger)' }}
                            title="Remove Pre-booking"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADD / EDIT PRE-BOOKING MODAL */}
      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ backgroundColor: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: '16px', maxWidth: '520px', width: '100%', padding: '1.75rem', color: 'var(--admin-text-primary)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--admin-border)', paddingBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontFamily: 'var(--font-serif)', color: 'var(--admin-text-primary)' }}>
                {editingItem ? 'Edit Pre-Booking Product' : 'Add Pre-Booking Product'}
              </h3>
              <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--admin-text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* Product Selector */}
              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase' }}>
                  Select Existing Product *
                </label>
                
                {selectedProduct ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem 0.85rem', backgroundColor: 'var(--admin-surface-elevated)', border: '1.5px solid var(--admin-accent)', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      {selectedProduct.image && <img src={selectedProduct.image} alt="" style={{ width: '32px', height: '32px', borderRadius: '6px', objectFit: 'cover' }} />}
                      <span style={{ fontWeight: '800', fontSize: '0.85rem', color: 'var(--admin-text-primary)' }}>{selectedProduct.title}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setSelectedProduct(null); setProductSearch(''); }}
                      style={{ background: 'none', border: 'none', color: 'var(--admin-danger)', cursor: 'pointer', fontSize: '0.78rem', fontWeight: '700' }}
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      placeholder="Search product name..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="admin-input"
                    />
                    <div style={{ maxHeight: '160px', overflowY: 'auto', marginTop: '0.35rem', border: '1px solid var(--admin-border)', borderRadius: '8px', backgroundColor: 'var(--admin-surface-elevated)' }}>
                      {filteredProductOptions.map((p) => (
                        <div
                          key={p.id || p._id}
                          onClick={() => { setSelectedProduct(p); setProductSearch(p.title); }}
                          style={{ padding: '0.6rem 0.85rem', cursor: 'pointer', fontSize: '0.82rem', borderBottom: '1px solid var(--admin-border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                          className="hover-highlight"
                        >
                          {p.image && <img src={p.image} alt="" style={{ width: '28px', height: '28px', borderRadius: '4px', objectFit: 'cover' }} />}
                          <span style={{ fontWeight: '700' }}>{p.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Launch Date */}
              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase' }}>
                  Launch Date *
                </label>
                <input
                  type="date"
                  required
                  value={launchDate}
                  onChange={(e) => setLaunchDate(e.target.value)}
                  className="admin-input"
                />
              </div>

              {/* Toggles */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase' }}>
                    Pre-Booking Active
                  </label>
                  <select
                    value={enabled ? 'true' : 'false'}
                    onChange={(e) => setEnabled(e.target.value === 'true')}
                    className="admin-input"
                  >
                    <option value="true">Enabled (Show in What's Next)</option>
                    <option value="false">Disabled (Hidden)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase' }}>
                    Pre-Order Allowed
                  </label>
                  <select
                    value={preorderEnabled ? 'true' : 'false'}
                    onChange={(e) => setPreorderEnabled(e.target.value === 'true')}
                    className="admin-input"
                  >
                    <option value="true">YES (Customers can Pre-Book)</option>
                    <option value="false">NO (Coming Soon only)</option>
                  </select>
                </div>
              </div>

              {/* Display Order */}
              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase' }}>
                  Display Order
                </label>
                <input
                  type="number"
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(e.target.value)}
                  placeholder="1"
                  className="admin-input"
                />
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setModalOpen(false)} className="admin-btn-secondary" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="admin-btn-primary" style={{ flex: 1 }}>
                  {saving ? 'Saving...' : 'Save Pre-Booking'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        title="Remove Pre-Booking Product?"
        message="Are you sure you want to remove this product from the pre-booking list?"
        confirmText="Remove"
        cancelText="Cancel"
        isDanger={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteModalOpen(false)}
      />

    </div>
  );
}
