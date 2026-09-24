import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, Calendar, Search, RefreshCw, CheckCircle2, XCircle, Clock, Package, Upload } from 'lucide-react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import ConfirmationModal from '../../components/ConfirmationModal';

export default function AdminPrebookingList() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [prebookings, setPrebookings] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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

      const pbData = Array.isArray(pbRes.data) ? pbRes.data : (pbRes.data?.prebookings || []);
      setPrebookings(pbData);
      if (prodRes.data && prodRes.data.products) setProducts(prodRes.data.products);
    } catch (err) {
      console.error('Error loading prebookings data:', err);
      toast.error('Failed to load prebooking products.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    navigate('/admin/prebookings/add?prebook=true');
  };

  const handleOpenEdit = (item) => {
    const targetId = item.productId || item.id;
    navigate(`/admin/prebookings/edit/${targetId}?prebook=true`);
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
      <div className="admin-table-container">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '4rem', gap: '0.75rem' }}>
            <RefreshCw size={22} className="animate-spin" color="#2F7D32" />
            <span style={{ fontSize: '0.9rem', color: '#665B53', fontWeight: '700' }}>Loading pre-booking products...</span>
          </div>
        ) : filteredPrebookings.length === 0 ? (
          <div className="admin-empty-state">
            <Clock size={36} color="#2F7D32" style={{ marginBottom: '0.75rem' }} />
            <h4 style={{ fontSize: '1.05rem', color: '#24150F', margin: '0 0 0.35rem 0', fontWeight: '800' }}>
              No upcoming products configured
            </h4>
            <p style={{ fontSize: '0.85rem', color: '#665B53', margin: '0 auto 1.25rem', maxWidth: '420px' }}>
              Add a product to show it in the "What's Next from MILASTY" section on the shop page.
            </p>
            <button onClick={handleOpenAdd} className="admin-btn-secondary" style={{ fontSize: '0.82rem' }}>
              <Plus size={14} />
              <span>Add First Pre-Booking Product</span>
            </button>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Launch Date</th>
                <th>Status</th>
                <th>Pre-Booking</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
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
        )}
      </div>



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
