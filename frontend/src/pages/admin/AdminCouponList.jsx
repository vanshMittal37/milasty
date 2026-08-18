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
        <h1 style={{ fontSize: '2.1rem', fontFamily: 'var(--font-serif)', color: 'var(--primary-dark)', fontWeight: '800', margin: '0 0 0.35rem 0' }}>
          Coupons & Discounts
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0, fontWeight: '500' }}>
          Create, review, and delete promotional discount coupons for user checkouts.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', alignItems: 'start' }}>
        
        {/* Left Card: Create Coupon Form */}
        <div 
          className="glass-card" 
          style={{ 
            padding: '2rem', 
            backgroundColor: 'rgba(50, 26, 18, 0.60)', 
            borderRadius: '16px', 
            border: '1px solid rgba(245, 235, 221, 0.25)', 
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)' 
          }}
        >
          <h3 style={{ fontSize: '1.15rem', fontFamily: 'var(--font-serif)', color: 'var(--text-light)', fontWeight: '800', marginBottom: '1.5rem', marginTop: 0 }}>
            Create New Coupon
          </h3>
          <form onSubmit={handleCreateCoupon} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--accent-gold)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Coupon Code *
              </label>
              <input 
                type="text" 
                required 
                value={code} 
                onChange={(e) => setCode(e.target.value.toUpperCase())} 
                placeholder="e.g. FESTIVE20" 
                style={{ 
                  width: '100%', 
                  height: '46px', 
                  padding: '0 0.95rem', 
                  borderRadius: '10px', 
                  border: '1px solid rgba(245, 235, 221, 0.25)', 
                  fontSize: '0.88rem',
                  outline: 'none',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  fontFamily: 'inherit',
                  color: 'var(--text-light)',
                  textTransform: 'uppercase'
                }} 
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--accent-gold)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Discount Type
                </label>
                <select 
                  value={discountType} 
                  onChange={(e) => setDiscountType(e.target.value)} 
                  style={{ 
                    width: '100%', 
                    height: '46px', 
                    padding: '0 0.75rem', 
                    borderRadius: '10px', 
                    border: '1px solid rgba(245, 235, 221, 0.25)', 
                    fontSize: '0.88rem',
                    outline: 'none',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    fontFamily: 'inherit',
                    color: 'var(--text-light)'
                  }}
                >
                  <option value="percentage" style={{ backgroundColor: '#24130D', color: '#FFF' }}>Percentage (%)</option>
                  <option value="fixed" style={{ backgroundColor: '#24130D', color: '#FFF' }}>Fixed Flat (₹)</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--accent-gold)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Discount Value *
                </label>
                <input 
                  type="number" 
                  required 
                  value={discountValue} 
                  onChange={(e) => setDiscountValue(Number(e.target.value))} 
                  style={{ 
                    width: '100%', 
                    height: '46px', 
                    padding: '0 0.95rem', 
                    borderRadius: '10px', 
                    border: '1px solid rgba(245, 235, 221, 0.25)', 
                    fontSize: '0.88rem',
                    outline: 'none',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    fontFamily: 'inherit',
                    color: 'var(--text-light)'
                  }} 
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--accent-gold)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Min Order (₹)
                </label>
                <input 
                  type="number" 
                  value={minOrderAmount} 
                  onChange={(e) => setMinOrderAmount(Number(e.target.value))} 
                  style={{ 
                    width: '100%', 
                    height: '46px', 
                    padding: '0 0.95rem', 
                    borderRadius: '10px', 
                    border: '1px solid rgba(245, 235, 221, 0.25)', 
                    fontSize: '0.88rem',
                    outline: 'none',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    fontFamily: 'inherit',
                    color: 'var(--text-light)'
                  }} 
                />
              </div>
              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--accent-gold)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Max Cap (₹)
                </label>
                <input 
                  type="number" 
                  value={maxDiscountAmount} 
                  onChange={(e) => setMaxDiscountAmount(Number(e.target.value))} 
                  style={{ 
                    width: '100%', 
                    height: '46px', 
                    padding: '0 0.95rem', 
                    borderRadius: '10px', 
                    border: '1px solid rgba(245, 235, 221, 0.25)', 
                    fontSize: '0.88rem',
                    outline: 'none',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    fontFamily: 'inherit',
                    color: 'var(--text-light)'
                  }} 
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={creating} 
              className="btn-primary" 
              style={{ 
                width: '100%', 
                height: '48px', 
                justifyContent: 'center', 
                backgroundColor: 'var(--accent-gold)', 
                border: 'none', 
                borderRadius: '10px', 
                color: '#24130D',
                fontWeight: '800',
                fontSize: '0.88rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                cursor: 'pointer',
                marginTop: '0.5rem'
              }}
            >
              <Plus size={15} />
              <span>{creating ? 'Creating...' : 'Create Coupon'}</span>
            </button>
          </form>
        </div>

        {/* Right Card: Coupons List */}
        <div 
          className="glass-card" 
          style={{ 
            padding: '2rem', 
            backgroundColor: 'rgba(50, 26, 18, 0.60)', 
            borderRadius: '16px', 
            border: '1px solid rgba(245, 235, 221, 0.25)', 
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)' 
          }}
        >
          <h3 style={{ fontSize: '1.15rem', fontFamily: 'var(--font-serif)', color: 'var(--text-light)', fontWeight: '800', marginBottom: '1.5rem', marginTop: 0 }}>
            Active Promotional Coupons
          </h3>
          
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2.5rem 0', gap: '0.5rem' }}>
              <RefreshCw size={18} className="animate-spin" color="var(--accent-gold)" />
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>Fetching coupons...</span>
            </div>
          ) : coupons.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {coupons.map((c) => (
                <div 
                  key={c._id} 
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    padding: '0.95rem 1.25rem', 
                    backgroundColor: 'rgba(255, 255, 255, 0.03)', 
                    borderRadius: '12px', 
                    border: '1px solid rgba(245, 235, 221, 0.15)'
                  }}
                  className="admin-coupon-row"
                >
                  <div>
                    <div style={{ fontWeight: '850', color: 'var(--text-light)', fontSize: '0.92rem', letterSpacing: '0.04em' }}>{c.code}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '600', marginTop: '0.15rem' }}>
                      {c.discountType === 'percentage' ? `${c.discountValue}% OFF` : `₹${c.discountValue} OFF`} (Min order ₹{c.minOrderAmount})
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--accent-gold)', fontWeight: '750', marginTop: '0.25rem' }}>
                      Used: {c.usedCount || 0} times
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
