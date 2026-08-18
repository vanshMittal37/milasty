import React, { useState, useEffect } from 'react';
import { Users, Shield, UserX, UserCheck, RefreshCw } from 'lucide-react';
import api from '../../api/axios';

export default function AdminCustomerList() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/customers');
      setCustomers(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'active' ? 'disabled' : 'active';
    try {
      await api.put(`/admin/customers/${id}/status`, { status: nextStatus });
      fetchCustomers();
    } catch (e) {
      alert('Error updating customer status');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 style={{ fontSize: '2.1rem', fontFamily: 'var(--font-serif)', color: 'var(--text-light)', fontWeight: '800', margin: '0 0 0.35rem 0' }}>
          Customer Registry
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0, fontWeight: '500' }}>
          Monitor customer activity, order statistics, total lifetime spend, and account status controls.
        </p>
      </div>

      <div className="glass-card" style={{ padding: '2rem', backgroundColor: 'rgba(50, 26, 18, 0.60)', borderRadius: '16px', border: '1px solid rgba(245, 235, 221, 0.25)', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem', gap: '1rem' }}>
            <RefreshCw size={20} className="animate-spin" color="var(--accent-gold)" />
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: '600' }}>Loading customer accounts...</span>
          </div>
        ) : customers.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(245, 235, 221, 0.15)', color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: '800' }}>Customer</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: '800' }}>Email & Phone</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: '800' }}>Total Orders</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: '800' }}>Total Spent</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: '800' }}>Status</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'right', fontWeight: '800' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c._id} style={{ borderBottom: '1px solid rgba(245, 235, 221, 0.15)' }}>
                    <td style={{ padding: '1rem', fontWeight: '800', color: 'var(--text-light)' }}>{c.name}</td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: '750', color: 'var(--text-light)' }}>{c.email}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{c.phone || 'N/A'}</div>
                    </td>
                    <td style={{ padding: '1rem', fontWeight: '850', color: 'var(--text-light)' }}>{c.orderCount || 0}</td>
                    <td style={{ padding: '1rem', fontWeight: '850', color: 'var(--text-light)' }}>₹{c.totalSpent || 0}</td>
                    <td style={{ padding: '1rem' }}>
                      <span 
                        style={{ 
                          fontSize: '0.7rem',
                          fontWeight: '800',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                          backgroundColor: c.status === 'active' ? 'rgba(39, 76, 55, 0.08)' : 'rgba(217, 83, 79, 0.08)', 
                          color: c.status === 'active' ? 'var(--accent-gold)' : 'var(--accent-terracotta)',
                          padding: '0.25rem 0.6rem',
                          borderRadius: '6px',
                          border: c.status === 'active' ? '1px solid rgba(201, 154, 50, 0.25)' : '1px solid rgba(217, 83, 79, 0.25)'
                        }}
                      >
                        {c.status || 'active'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <button
                        onClick={() => handleToggleStatus(c._id, c.status || 'active')}
                        className="btn-secondary"
                        style={{ 
                          padding: '0.45rem 0.85rem', 
                          fontSize: '0.78rem', 
                          borderRadius: '8px',
                          fontWeight: '800',
                          borderColor: c.status === 'active' ? 'rgba(217, 83, 79, 0.2)' : 'rgba(201, 154, 50, 0.2)',
                          color: c.status === 'active' ? 'var(--accent-terracotta)' : 'var(--accent-gold)',
                          backgroundColor: 'transparent',
                          cursor: 'pointer'
                        }}
                      >
                        {c.status === 'active' ? 'Disable Account' : 'Enable Account'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600' }}>
            No customer accounts registered yet.
          </div>
        )}
      </div>
    </div>
  );
}
