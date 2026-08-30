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
        <h1 style={{ fontSize: '2.1rem', fontFamily: 'var(--font-serif)', color: 'var(--admin-text-primary)', fontWeight: '800', margin: '0 0 0.35rem 0' }}>
          Customer Registry
        </h1>
        <p style={{ color: 'var(--admin-text-muted)', fontSize: '0.88rem', margin: 0, fontWeight: '500' }}>
          Monitor customer activity, order statistics, total lifetime spend, and account status controls.
        </p>
      </div>

      <div className="admin-table-container">
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem', gap: '1rem' }}>
            <RefreshCw size={20} className="animate-spin" color="var(--admin-accent-light)" />
            <span style={{ fontSize: '0.82rem', color: 'var(--admin-text-muted)', fontWeight: '600' }}>Loading customer accounts...</span>
          </div>
        ) : customers.length > 0 ? (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Email & Phone</th>
                <th>Total Orders</th>
                <th>Total Spent</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => {
                const initials = (c.name || 'C').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                return (
                  <tr key={c._id || c.email}>
                    <td style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      <div 
                        style={{ 
                          width: '38px', 
                          height: '38px', 
                          borderRadius: '50%', 
                          backgroundColor: 'rgba(185, 205, 148, 0.12)', 
                          color: 'var(--admin-accent-light)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: '800',
                          fontSize: '0.85rem',
                          border: '1px solid var(--admin-border)'
                        }}
                      >
                        {initials}
                      </div>
                      <div style={{ fontWeight: '800', color: 'var(--admin-text-primary)' }}>{c.name}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: '600', color: 'var(--admin-text-primary)' }}>{c.email}</div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--admin-text-muted)' }}>{c.phone || 'No phone'}</div>
                    </td>
                    <td style={{ fontWeight: '800', color: 'var(--admin-text-primary)' }}>{c.totalOrders || 0}</td>
                    <td style={{ fontWeight: '800', color: 'var(--admin-text-primary)' }}>₹{c.totalSpent || 0}</td>
                    <td>
                      <span className={`admin-badge ${c.status === 'disabled' ? 'admin-badge-danger' : 'admin-badge-success'}`}>
                        {c.status || 'active'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button 
                        onClick={() => handleToggleStatus(c._id, c.status)} 
                        className="admin-btn-secondary"
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.78rem' }}
                      >
                        {c.status === 'disabled' ? <UserCheck size={14} /> : <UserX size={14} />}
                        <span>{c.status === 'disabled' ? 'Enable' : 'Disable'}</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="admin-empty-state">
            <div className="admin-empty-icon">
              <Users size={24} />
            </div>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--admin-text-primary)', margin: 0, fontWeight: '800' }}>No customers yet</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--admin-text-muted)', margin: 0 }}>Registered customer accounts will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
