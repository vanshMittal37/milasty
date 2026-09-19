import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Ticket, Tag, RefreshCw, Star, CheckCircle, XCircle, Pencil, X } from 'lucide-react';
import api from '../../api/axios';
import ConfirmationModal from '../../components/ConfirmationModal';
import { useToast } from '../../context/ToastContext';

export default function AdminCouponList() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const { toast } = useToast();

  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState('percentage');
  const [discountValue, setDiscountValue] = useState(10);
  const [minOrderAmount, setMinOrderAmount] = useState(300);
  const [maxDiscountAmount, setMaxDiscountAmount] = useState(200);
  const [isFeatured, setIsFeatured] = useState(true);
  const [description, setDescription] = useState('');

  // Edit Form State
  const [editCode, setEditCode] = useState('');
  const [editDiscountType, setEditDiscountType] = useState('percentage');
  const [editDiscountValue, setEditDiscountValue] = useState(10);
  const [editMinOrderAmount, setEditMinOrderAmount] = useState(0);
  const [editMaxDiscountAmount, setEditMaxDiscountAmount] = useState(0);
  const [editIsFeatured, setEditIsFeatured] = useState(false);
  const [editIsActive, setEditIsActive] = useState(true);
  const [editDescription, setEditDescription] = useState('');

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await api.get('/coupons');
      setCoupons(res.data || []);
    } catch (e) {
      toast.error('Unable to fetch coupons.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    if (!code.trim()) {
      toast.error('Please enter a coupon code.');
      return;
    }
    setCreating(true);
    try {
      await api.post('/coupons', {
        code: code.toUpperCase().trim(),
        discountType,
        discountValue: Number(discountValue),
        minOrderAmount: Number(minOrderAmount || 0),
        maxDiscountAmount: Number(maxDiscountAmount || 0),
        isFeatured,
        description,
        isActive: true,
      });
      toast.success('Coupon created / updated successfully.');
      setCode('');
      setDescription('');
      fetchCoupons();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Error creating coupon.');
    } finally {
      setCreating(false);
    }
  };

  const openEditModal = (coupon) => {
    setEditingCoupon(coupon);
    setEditCode(coupon.code || '');
    setEditDiscountType(coupon.discount_type || coupon.discountType || 'percentage');
    setEditDiscountValue(Number(coupon.discount_value || coupon.discountValue || 0));
    setEditMinOrderAmount(Number(coupon.min_order_amount || coupon.minOrderAmount || 0));
    setEditMaxDiscountAmount(Number(coupon.max_discount || coupon.maxDiscountAmount || 0));
    setEditIsFeatured(coupon.is_featured ?? coupon.isFeatured ?? false);
    setEditIsActive(coupon.is_active ?? coupon.isActive ?? true);
    setEditDescription(coupon.description || '');
  };

  const handleUpdateCouponSubmit = async (e) => {
    e.preventDefault();
    if (!editingCoupon) return;
    if (!editCode.trim()) {
      toast.error('Please enter a coupon code.');
      return;
    }
    setUpdating(true);
    try {
      const targetId = editingCoupon.id || editingCoupon._id || editingCoupon.code;
      await api.put(`/coupons/${targetId}`, {
        code: editCode.toUpperCase().trim(),
        discount_type: editDiscountType,
        discount_value: Number(editDiscountValue),
        min_order_amount: Number(editMinOrderAmount || 0),
        max_discount: Number(editMaxDiscountAmount || 0),
        is_featured: editIsFeatured,
        is_active: editIsActive,
        description: editDescription,
      });
      toast.success(`Coupon ${editCode} updated successfully.`);
      setEditingCoupon(null);
      fetchCoupons();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Error updating coupon.');
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleActive = async (coupon) => {
    try {
      const newStatus = !coupon.is_active;
      await api.put(`/coupons/${coupon.id || coupon._id || coupon.code}`, { is_active: newStatus });
      toast.success(`Coupon ${coupon.code} is now ${newStatus ? 'Active' : 'Inactive'}.`);
      fetchCoupons();
    } catch (e) {
      toast.error('Failed to update coupon status.');
    }
  };

  const handleToggleFeatured = async (coupon) => {
    try {
      const newFeatured = !coupon.is_featured;
      await api.put(`/coupons/${coupon.id || coupon._id || coupon.code}`, { is_featured: newFeatured });
      toast.success(`Coupon ${coupon.code} ${newFeatured ? 'featured on top announcement bar' : 'unfeatured'}.`);
      fetchCoupons();
    } catch (e) {
      toast.error('Failed to update featured status.');
    }
  };

  const confirmDeleteCoupon = async () => {
    if (!deleteTargetId) return;
    try {
      await api.delete(`/coupons/${deleteTargetId}`);
      toast.success('Coupon removed.');
      setDeleteTargetId(null);
      fetchCoupons();
    } catch (e) {
      toast.error('Error deleting coupon.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <p style={{ fontSize: '0.68rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--admin-text-muted)', margin: '0 0 0.2rem 0' }}>
            Coupons &amp; Discounts
          </p>
          <h2 style={{ fontSize: 'clamp(1.15rem, 2.5vw, 1.45rem)', fontFamily: 'var(--font-serif)', color: 'var(--admin-text-primary)', fontWeight: '800', margin: 0, lineHeight: '1.25' }}>
            Promotions &amp; Discount Codes
          </h2>
          <p style={{ color: 'var(--admin-text-secondary)', fontSize: '0.8rem', margin: '0.2rem 0 0 0', fontWeight: '500' }}>
            Create and manage promotional discount voucher codes for store checkout and the top announcement bar.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>

        {/* Left Card: Create Coupon Form */}
        <div className="admin-card">
          <h3 style={{ fontSize: '1.1rem', fontFamily: 'var(--font-serif)', color: 'var(--admin-text-primary)', fontWeight: '800', marginBottom: '1.25rem', marginTop: 0 }}>
            Create New Coupon
          </h3>
          <form onSubmit={handleCreateCoupon} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            <div>
              <label style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Coupon Code *
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. WELCOME10"
                className="admin-input"
                style={{ textTransform: 'uppercase', fontWeight: '800', letterSpacing: '0.05em' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Discount Type
                </label>
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value)}
                  className="admin-input"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Flat (₹)</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Discount Value *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(Number(e.target.value))}
                  className="admin-input"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Min Order (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={minOrderAmount}
                  onChange={(e) => setMinOrderAmount(Number(e.target.value))}
                  className="admin-input"
                />
              </div>
              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Max Cap (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={maxDiscountAmount}
                  onChange={(e) => setMaxDiscountAmount(Number(e.target.value))}
                  className="admin-input"
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Description (Optional)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. 10% OFF for new customers"
                className="admin-input"
              />
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontSize: '0.84rem', color: 'var(--admin-text-primary)', fontWeight: '600' }}>
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: 'var(--admin-accent)' }}
              />
              <span>Feature on Top Announcement Bar</span>
            </label>

            <button
              type="submit"
              disabled={creating}
              className="admin-btn-primary"
              style={{ width: '100%', marginTop: '0.5rem' }}
            >
              <Plus size={15} />
              <span>{creating ? 'Saving...' : 'Create / Save Coupon'}</span>
            </button>
          </form>
        </div>

        {/* Right Card: Coupons List */}
        <div className="admin-card">
          <h3 style={{ fontSize: '1.1rem', fontFamily: 'var(--font-serif)', color: 'var(--admin-text-primary)', fontWeight: '800', marginBottom: '1.25rem', marginTop: 0 }}>
            Active Promotional Coupons
          </h3>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2.5rem 0', gap: '0.5rem' }}>
              <RefreshCw size={18} className="animate-spin" color="var(--admin-accent)" />
              <span style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)', fontWeight: '600' }}>Fetching coupons...</span>
            </div>
          ) : coupons.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {coupons.map((c) => {
                const isActive = c.is_active ?? true;
                const isFeat = c.is_featured ?? false;
                const discType = c.discount_type || c.discountType || 'percentage';
                const discVal = c.discount_value || c.discountValue || 0;
                const minOrd = c.min_order_amount || c.minOrderAmount || 0;
                const maxCap = c.max_discount || c.maxDiscountAmount || 0;

                return (
                  <div
                    key={c.id || c._id || c.code}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.65rem',
                      padding: '1rem 1.15rem',
                      borderRadius: '14px',
                      backgroundColor: 'var(--admin-surface-elevated)',
                      border: isActive ? '1px solid var(--admin-border)' : '1px solid rgba(255, 91, 91, 0.2)',
                      opacity: isActive ? 1 : 0.75,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: isActive ? 'rgba(143, 175, 91, 0.12)' : 'rgba(255, 91, 91, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isActive ? 'var(--admin-accent)' : '#ff5b5b' }}>
                          <Ticket size={18} />
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontWeight: '800', color: 'var(--admin-text-primary)', fontSize: '0.98rem', letterSpacing: '0.04em' }}>{c.code}</span>
                            {isFeat && (
                              <span style={{ fontSize: '0.68rem', fontWeight: '800', backgroundColor: 'rgba(185, 205, 148, 0.2)', color: '#b9cd94', padding: '0.15rem 0.45rem', borderRadius: '999px', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                                <Star size={10} fill="#b9cd94" /> Announcement Bar
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.76rem', color: 'var(--admin-text-muted)', marginTop: '0.15rem' }}>
                            {discType === 'percentage' ? `${discVal}% OFF` : `₹${discVal} FLAT OFF`}
                            {minOrd > 0 ? ` • Min Order: ₹${minOrd}` : ''}
                            {maxCap > 0 ? ` • Max Cap: ₹${maxCap}` : ''}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <button
                          onClick={() => openEditModal(c)}
                          className="admin-icon-btn"
                          style={{ color: '#b9cd94' }}
                          title="Edit Coupon Details"
                        >
                          <Pencil size={15} />
                        </button>

                        <button
                          onClick={() => handleToggleActive(c)}
                          style={{
                            padding: '0.35rem 0.75rem',
                            fontSize: '0.74rem',
                            fontWeight: '700',
                            borderRadius: '8px',
                            border: 'none',
                            cursor: 'pointer',
                            backgroundColor: isActive ? 'rgba(29, 59, 40, 0.6)' : 'rgba(217, 83, 79, 0.2)',
                            color: isActive ? '#85B870' : '#D9534F',
                          }}
                          title={isActive ? 'Deactivate Coupon' : 'Activate Coupon'}
                        >
                          {isActive ? 'Active' : 'Inactive'}
                        </button>

                        <button
                          onClick={() => handleToggleFeatured(c)}
                          className="admin-icon-btn"
                          style={{ color: isFeat ? '#b9cd94' : 'var(--admin-text-muted)' }}
                          title={isFeat ? 'Unfeature from Announcement Bar' : 'Feature on Announcement Bar'}
                        >
                          <Star size={15} fill={isFeat ? '#b9cd94' : 'none'} />
                        </button>

                        <button
                          onClick={() => setDeleteTargetId(c.id || c._id || c.code)}
                          className="admin-icon-btn"
                          style={{ color: 'var(--admin-danger)' }}
                          title="Delete Coupon"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: 'var(--admin-text-muted)', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.45rem' }}>
                      <span>Uses: <strong>{c.usage_count || 0}</strong> {c.usage_limit ? `/ ${c.usage_limit}` : '(Unlimited)'}</span>
                      <span>{c.description || 'Promotional Discount'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--admin-text-muted)', fontSize: '0.85rem', fontWeight: '600' }}>
              No active promotional coupons.
            </div>
          )}
        </div>

      </div>

      {/* Edit Coupon Modal */}
      {editingCoupon && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
        >
          <div
            className="admin-card"
            style={{
              width: '100%',
              maxWidth: '520px',
              backgroundColor: 'var(--admin-surface)',
              border: '1px solid var(--admin-border)',
              borderRadius: '16px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
              position: 'relative',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontFamily: 'var(--font-serif)', color: 'var(--admin-text-primary)', fontWeight: '800', margin: 0 }}>
                Edit Coupon — {editingCoupon.code}
              </h3>
              <button
                onClick={() => setEditingCoupon(null)}
                style={{ background: 'none', border: 'none', color: 'var(--admin-text-muted)', cursor: 'pointer', padding: '0.2rem' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateCouponSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Coupon Code *
                </label>
                <input
                  type="text"
                  required
                  value={editCode}
                  onChange={(e) => setEditCode(e.target.value)}
                  className="admin-input"
                  style={{ textTransform: 'uppercase', fontWeight: '800', letterSpacing: '0.05em' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Discount Type
                  </label>
                  <select
                    value={editDiscountType}
                    onChange={(e) => setEditDiscountType(e.target.value)}
                    className="admin-input"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Flat (₹)</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Discount Value *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={editDiscountValue}
                    onChange={(e) => setEditDiscountValue(Number(e.target.value))}
                    className="admin-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Min Order (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editMinOrderAmount}
                    onChange={(e) => setEditMinOrderAmount(Number(e.target.value))}
                    className="admin-input"
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Max Cap (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editMaxDiscountAmount}
                    onChange={(e) => setEditMaxDiscountAmount(Number(e.target.value))}
                    className="admin-input"
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Description
                </label>
                <input
                  type="text"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="admin-input"
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.2rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontSize: '0.84rem', color: 'var(--admin-text-primary)', fontWeight: '600' }}>
                  <input
                    type="checkbox"
                    checked={editIsFeatured}
                    onChange={(e) => setEditIsFeatured(e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: 'var(--admin-accent)' }}
                  />
                  <span>Feature on Top Announcement Bar</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontSize: '0.84rem', color: 'var(--admin-text-primary)', fontWeight: '600' }}>
                  <input
                    type="checkbox"
                    checked={editIsActive}
                    onChange={(e) => setEditIsActive(e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: 'var(--admin-accent)' }}
                  />
                  <span>Coupon Is Active</span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setEditingCoupon(null)}
                  style={{
                    flex: 1,
                    padding: '0.65rem',
                    borderRadius: '8px',
                    border: '1px solid var(--admin-border)',
                    backgroundColor: 'transparent',
                    color: 'var(--admin-text-secondary)',
                    fontWeight: '700',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="admin-btn-primary"
                  style={{ flex: 1 }}
                >
                  {updating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={!!deleteTargetId}
        title="Delete Coupon?"
        message="Are you sure you want to delete this coupon? Customers will no longer be able to apply this discount code at checkout."
        confirmText="Delete Coupon"
        cancelText="Cancel"
        isDanger={true}
        onConfirm={confirmDeleteCoupon}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
}

