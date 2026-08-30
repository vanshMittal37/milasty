import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Ticket, Tag, RefreshCw } from 'lucide-react';
import api from '../../api/axios';

export default function AdminCouponList() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState('percentage');
  const [discountValue, setDiscountValue] = useState(10);
  const [minOrderAmount, setMinOrderAmount] = useState(300);
  const [maxDiscountAmount, setMaxDiscountAmount] = useState(200);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await api.get('/coupons');
      setCoupons(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post('/coupons', {
        code: code.toUpperCase(),
        discountType,
        discountValue,
        minOrderAmount,
        maxDiscountAmount,
        expiryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
      });
      setCode('');
      fetchCoupons();
    } catch (e) {
      alert('Error creating coupon');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this coupon?')) {
      try {
        await api.delete(`/coupons/${id}`);
        fetchCoupons();
      } catch (e) {
        alert('Error deleting coupon');
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 style={{ fontSize: '2.1rem', fontFamily: 'var(--font-serif)', color: 'var(--admin-text-primary)', fontWeight: '800', margin: '0 0 0.35rem 0' }}>
          Coupons & Discounts
        </h1>
        <p style={{ color: 'var(--admin-text-muted)', fontSize: '0.88rem', margin: 0, fontWeight: '500' }}>
          Create and manage promotional discount voucher codes for store checkout.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', alignItems: 'start' }}>
        
        {/* Left Card: Create Coupon Form */}
        <div className="admin-card">
          <h3 style={{ fontSize: '1.15rem', fontFamily: 'var(--font-serif)', color: 'var(--admin-text-primary)', fontWeight: '800', marginBottom: '1.5rem', marginTop: 0 }}>
            Create New Coupon
          </h3>
          <form onSubmit={handleCreateCoupon} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Coupon Code *
              </label>
              <input 
                type="text" 
                required 
                value={code} 
                onChange={(e) => setCode(e.target.value)} 
                placeholder="e.g. FESTIVE20" 
                className="admin-input"
                style={{ textTransform: 'uppercase', fontWeight: '800' }}
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
                  value={maxDiscountAmount} 
                  onChange={(e) => setMaxDiscountAmount(Number(e.target.value))} 
                  className="admin-input"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={creating} 
              className="admin-btn-primary" 
              style={{ width: '100%', marginTop: '0.5rem' }}
            >
              <Plus size={15} />
              <span>{creating ? 'Creating...' : 'Create Coupon'}</span>
            </button>
          </form>
        </div>

        {/* Right Card: Coupons List */}
        <div className="admin-card">
          <h3 style={{ fontSize: '1.15rem', fontFamily: 'var(--font-serif)', color: 'var(--admin-text-primary)', fontWeight: '800', marginBottom: '1.5rem', marginTop: 0 }}>
            Active Promotional Coupons
          </h3>
          
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2.5rem 0', gap: '0.5rem' }}>
              <RefreshCw size={18} className="animate-spin" color="var(--admin-accent-light)" />
              <span style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)', fontWeight: '600' }}>Fetching coupons...</span>
            </div>
          ) : coupons.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {coupons.map((c) => (
                <div 
                  key={c._id || c.code} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    padding: '1rem 1.25rem', 
                    borderRadius: '12px', 
                    backgroundColor: 'rgba(255, 255, 255, 0.03)', 
                    border: '1px solid var(--admin-border)' 
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: 'rgba(185, 205, 148, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--admin-accent-light)' }}>
                      <Ticket size={16} />
                    </div>
                    <div>
                      <div style={{ fontWeight: '800', color: 'var(--admin-text-primary)', fontSize: '0.92rem', letterSpacing: '0.04em' }}>{c.code}</div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--admin-text-muted)', marginTop: '0.15rem' }}>
                        {c.discountType === 'percentage' ? `${c.discountValue}% OFF` : `₹${c.discountValue} FLAT OFF`} • Min Order: ₹{c.minOrderAmount || 0}
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleDelete(c._id)} 
                    style={{ 
                      background: 'none', 
                      border: 'none', 
                      color: 'rgba(217, 83, 79, 0.7)', 
                      cursor: 'pointer',
                      padding: '0.45rem',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = 'var(--accent-terracotta)';
                      e.currentTarget.style.backgroundColor = 'rgba(217, 83, 79, 0.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'rgba(217, 83, 79, 0.7)';
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600' }}>
              No active promotional coupons.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
