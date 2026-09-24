import React, { useState, useEffect } from 'react';
import { Users, Shield, UserX, UserCheck, RefreshCw, Search } from 'lucide-react';
import api from '../../api/axios';

export default function AdminCustomerList() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

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
    const nextStatus = currentStatus === 'disabled' ? 'active' : 'disabled';
    try {
      await api.put(`/admin/customers/${id}/status`, { status: nextStatus });
      fetchCustomers();
    } catch (e) {
      alert('Error updating customer status');
    }
  };

  const filteredCustomers = customers.filter(c => {
    if (!search.trim()) return true;
    const query = search.toLowerCase();
    return (
      (c.name || '').toLowerCase().includes(query) ||
      (c.email || '').toLowerCase().includes(query) ||
      (c.phone || '').toLowerCase().includes(query)
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <p style={{ fontSize: '0.62rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#7B8E80', margin: '0 0 0.2rem 0' }}>
            Customers
          </p>
          <h2 style={{ fontSize: 'clamp(1.2rem, 2.5vw, 1.45rem)', fontFamily: 'var(--font-serif)', color: '#F5F5F5', fontWeight: '800', margin: 0, lineHeight: '1.25' }}>
            Customer Registry
          </h2>
          <p style={{ color: '#A7ADB8', fontSize: '0.82rem', margin: '0.2rem 0 0 0', fontWeight: '500' }}>
            Monitor customer activity, order statistics, total lifetime spend, and account status controls.
          </p>
        </div>

        <button onClick={fetchCustomers} className="admin-btn-secondary">
          <RefreshCw size={14} />
          <span>Refresh List</span>
        </button>
      </div>

      {/* Search Bar */}
      <div style={{ position: 'relative', maxWidth: '400px' }}>
        <Search size={16} color="#7B8E80" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by customer name, email, or phone..."
          className="admin-input"
          style={{ paddingLeft: '2.5rem' }}
        />
      </div>

      <div className="admin-table-container">
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3.5rem', gap: '1rem' }}>
            <RefreshCw size={22} className="animate-spin" color="#85B870" />
            <span style={{ fontSize: '0.85rem', color: '#A7ADB8', fontWeight: '700' }}>Loading customer accounts...</span>
          </div>
        ) : filteredCustomers.length > 0 ? (
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
              {filteredCustomers.map((c) => {
                const initials = (c.name || 'C').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                const isDisabled = c.status === 'disabled';
                return (
                  <tr key={c._id || c.id || c.email}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                        <div
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            backgroundColor: '#274C37',
                            color: '#FFFFFF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: '900',
                            fontSize: '0.88rem',
                            border: '1px solid rgba(255, 255, 255, 0.15)'
                          }}
                        >
                          {initials}
                        </div>
                        <div>
                          <div style={{ fontWeight: '800', color: '#F5F5F5', fontSize: '0.9rem' }}>{c.name || 'Customer'}</div>
                          <div style={{ fontSize: '0.72rem', color: '#7B8E80', fontWeight: '600' }}>ID: {String(c._id || c.id || 'N/A').slice(-6)}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: '700', color: '#F5F5F5', fontSize: '0.85rem' }}>{c.email || 'No email'}</div>
                      <div style={{ fontSize: '0.76rem', color: '#A7ADB8', fontWeight: '600' }}>{c.phone || 'No phone provided'}</div>
                    </td>
                    <td style={{ fontWeight: '800', color: '#F5F5F5', fontSize: '0.92rem' }}>{c.totalOrders || 0}</td>
                    <td style={{ fontWeight: '800', color: '#85B870', fontSize: '0.92rem' }}>₹{(c.totalSpent || 0).toLocaleString('en-IN')}</td>
                    <td>
                      <span className={`admin-badge ${isDisabled ? 'admin-badge-danger' : 'admin-badge-success'}`}>
                        {isDisabled ? 'Disabled' : 'Active'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => handleToggleStatus(c._id || c.id, c.status)}
                        className={isDisabled ? "admin-btn-primary" : "admin-btn-danger"}
                        style={{ padding: '0.45rem 0.85rem', fontSize: '0.78rem' }}
                      >
                        {isDisabled ? <UserCheck size={14} /> : <UserX size={14} />}
                        <span>{isDisabled ? 'Enable' : 'Disable'}</span>
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
              <Users size={26} />
            </div>
            <h3 style={{ fontSize: '1.15rem', color: '#F5F5F5', margin: 0, fontWeight: '800' }}>No customers found</h3>
            <p style={{ fontSize: '0.85rem', color: '#A7ADB8', margin: 0 }}>
              {search ? 'No customer account matches your search query.' : 'Registered customer accounts will appear here.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
