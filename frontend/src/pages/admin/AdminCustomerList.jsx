import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Users, UserX, UserCheck, RefreshCw, Search, AlertTriangle, X, ShieldAlert } from 'lucide-react';
import api from '../../api/axios';

export default function AdminCustomerList() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'disabled'
  const [customerToDisable, setCustomerToDisable] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/customers');
      setCustomers(res.data || []);
    } catch (e) {
      console.error('Error fetching customers:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'disabled' ? 'active' : 'disabled';
    setUpdatingId(id);
    try {
      await api.put(`/admin/customers/${id}/status`, { status: nextStatus });
      setCustomers((prev) =>
        prev.map((c) => (c._id === id || c.id === id ? { ...c, status: nextStatus } : c))
      );
      setCustomerToDisable(null);
    } catch (e) {
      alert('Error updating customer status: ' + (e.response?.data?.message || e.message));
    } finally {
      setUpdatingId(null);
    }
  };

  // Filter customers by status tab and search keyword
  const filteredCustomers = customers.filter((c) => {
    if (statusFilter === 'active' && c.status === 'disabled') return false;
    if (statusFilter === 'disabled' && c.status !== 'disabled') return false;

    if (!search.trim()) return true;
    const query = search.toLowerCase();
    return (
      (c.name || '').toLowerCase().includes(query) ||
      (c.email || '').toLowerCase().includes(query) ||
      (c.phone || '').toLowerCase().includes(query)
    );
  });

  const totalCount = customers.length;
  const activeCount = customers.filter((c) => c.status !== 'disabled').length;
  const disabledCount = customers.filter((c) => c.status === 'disabled').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <p style={{ fontSize: '0.62rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#665A52', margin: '0 0 0.2rem 0' }}>
            Customers
          </p>
          <h2 style={{ fontSize: 'clamp(1.2rem, 2.5vw, 1.45rem)', fontFamily: 'var(--font-serif)', color: '#21150F', fontWeight: '800', margin: 0, lineHeight: '1.25' }}>
            Customer Registry
          </h2>
          <p style={{ color: '#665A52', fontSize: '0.82rem', margin: '0.2rem 0 0 0', fontWeight: '500' }}>
            Monitor customer activity, order statistics, total lifetime spend, and account access controls.
          </p>
        </div>

        <button onClick={fetchCustomers} className="admin-btn-secondary">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh List</span>
        </button>
      </div>

      {/* Tabs & Search Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        {/* Status Filter Tabs */}
        <div style={{ display: 'flex', gap: '0.4rem', backgroundColor: '#F0E6D8', padding: '0.3rem', borderRadius: '12px' }}>
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            style={{
              padding: '0.4rem 0.85rem',
              fontSize: '0.78rem',
              fontWeight: '800',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: statusFilter === 'all' ? '#FFFFFF' : 'transparent',
              color: statusFilter === 'all' ? '#21150F' : '#665A52',
              boxShadow: statusFilter === 'all' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <span>All</span>
            <span style={{ fontSize: '0.7rem', backgroundColor: '#E5D6C5', padding: '1px 6px', borderRadius: '999px', color: '#21150F' }}>
              {totalCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('active')}
            style={{
              padding: '0.4rem 0.85rem',
              fontSize: '0.78rem',
              fontWeight: '800',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: statusFilter === 'active' ? '#FFFFFF' : 'transparent',
              color: statusFilter === 'active' ? '#2E7D32' : '#665A52',
              boxShadow: statusFilter === 'active' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#2E7D32' }} />
            <span>Active</span>
            <span style={{ fontSize: '0.7rem', backgroundColor: 'rgba(46,125,50,0.12)', padding: '1px 6px', borderRadius: '999px', color: '#2E7D32' }}>
              {activeCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('disabled')}
            style={{
              padding: '0.4rem 0.85rem',
              fontSize: '0.78rem',
              fontWeight: '800',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: statusFilter === 'disabled' ? '#FFFFFF' : 'transparent',
              color: statusFilter === 'disabled' ? '#DC2626' : '#665A52',
              boxShadow: statusFilter === 'disabled' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#DC2626' }} />
            <span>Disabled</span>
            <span style={{ fontSize: '0.7rem', backgroundColor: 'rgba(220,38,38,0.12)', padding: '1px 6px', borderRadius: '999px', color: '#DC2626' }}>
              {disabledCount}
            </span>
          </button>
        </div>

        {/* Search Bar */}
        <div style={{ position: 'relative', width: '100%', maxWidth: '380px' }}>
          <Search size={16} color="#665A52" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or phone..."
            className="admin-input admin-search-input"
            style={{ paddingLeft: '2.75rem' }}
          />
        </div>
      </div>

      {/* Customer Registry Table */}
      <div className="admin-table-container">
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3.5rem', gap: '1rem' }}>
            <RefreshCw size={22} className="animate-spin" color="#85B870" />
            <span style={{ fontSize: '0.85rem', color: '#665A52', fontWeight: '700' }}>Loading customer accounts...</span>
          </div>
        ) : filteredCustomers.length > 0 ? (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Email &amp; Phone</th>
                <th>Total Orders</th>
                <th>Total Spent</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((c) => {
                const initials = (c.name || 'C').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
                const isDisabled = c.status === 'disabled';
                const isThisUpdating = updatingId === (c._id || c.id);

                return (
                  <tr key={c._id || c.id || c.email} style={{ backgroundColor: isDisabled ? 'rgba(239, 68, 68, 0.03)' : 'transparent' }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                        <div
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            backgroundColor: isDisabled ? '#7F1D1D' : '#5A2E16',
                            color: '#FFFFFF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: '900',
                            fontSize: '0.88rem',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                          }}
                        >
                          {initials}
                        </div>
                        <div>
                          <div style={{ fontWeight: '800', color: '#21150F', fontSize: '0.9rem' }}>
                            {c.name || 'Customer'}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#665A52', fontWeight: '600' }}>
                            ID: {String(c._id || c.id || 'N/A').slice(-6)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: '700', color: '#21150F', fontSize: '0.85rem' }}>{c.email || 'No email'}</div>
                      <div style={{ fontSize: '0.76rem', color: '#665A52', fontWeight: '600' }}>{c.phone || 'No phone provided'}</div>
                    </td>
                    <td style={{ fontWeight: '800', color: '#21150F', fontSize: '0.92rem' }}>{c.totalOrders || 0}</td>
                    <td style={{ fontWeight: '800', color: '#C68A3A', fontSize: '0.92rem' }}>₹{(c.totalSpent || 0).toLocaleString('en-IN')}</td>
                    <td>
                      <span className={`admin-badge ${isDisabled ? 'admin-badge-danger' : 'admin-badge-success'}`}>
                        {isDisabled ? 'Disabled' : 'Active'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {isDisabled ? (
                        <button
                          onClick={() => handleToggleStatus(c._id || c.id, 'disabled')}
                          disabled={isThisUpdating}
                          className="admin-btn-primary"
                          style={{ padding: '0.45rem 0.85rem', fontSize: '0.78rem', backgroundColor: '#2E7D32', borderColor: '#2E7D32' }}
                          title="Click to re-enable this customer for placing orders"
                        >
                          <UserCheck size={14} />
                          <span>{isThisUpdating ? 'Enabling...' : 'Enable'}</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => setCustomerToDisable(c)}
                          disabled={isThisUpdating}
                          className="admin-btn-danger"
                          style={{ padding: '0.45rem 0.85rem', fontSize: '0.78rem' }}
                          title="Disable this customer and prevent new orders"
                        >
                          <UserX size={14} />
                          <span>Disable</span>
                        </button>
                      )}
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
            <h3 style={{ fontSize: '1.15rem', color: '#21150F', margin: 0, fontWeight: '800' }}>
              {statusFilter === 'disabled' ? 'No disabled customers' : 'No customers found'}
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#665A52', margin: 0 }}>
              {search
                ? 'No customer account matches your search query.'
                : statusFilter === 'disabled'
                ? 'All registered customer accounts are currently active.'
                : 'Registered customer accounts will appear here.'}
            </p>
          </div>
        )}
      </div>

      {/* Confirmation Modal before Disabling Customer */}
      {customerToDisable &&
        createPortal(
          // Compact confirm dialog. Text uses divs with explicit sizes because global h3/p/span
          // font-size rules (some !important) would otherwise inflate it.
          <div
            onClick={() => setCustomerToDisable(null)}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(33, 21, 15, 0.55)',
              backdropFilter: 'blur(3px)',
              zIndex: 99999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem',
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Disable customer"
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                width: '100%',
                maxWidth: '400px',
                boxShadow: '0 20px 50px rgba(0,0,0,0.22)',
                border: '1px solid #E8DFD5',
                padding: '1.15rem 1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.85rem',
                fontSize: '0.84rem',
                lineHeight: 1.45,
                color: '#21150F',
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ width: '32px', height: '32px', flexShrink: 0, borderRadius: '50%', backgroundColor: '#FEE2E2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AlertTriangle size={16} />
                </div>
                <div style={{ flex: 1, fontSize: '1rem', fontWeight: 800 }}>Disable this customer?</div>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => setCustomerToDisable(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#665A52', padding: '0.2rem', display: 'flex' }}
                >
                  <X size={17} />
                </button>
              </div>

              {/* Customer */}
              <div style={{ backgroundColor: '#FBF8F4', padding: '0.6rem 0.8rem', borderRadius: '10px', border: '1px solid #EAE0D5' }}>
                <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{customerToDisable.name || 'Unnamed Customer'}</div>
                <div style={{ fontSize: '0.78rem', color: '#665A52', overflowWrap: 'anywhere' }}>
                  {customerToDisable.email || customerToDisable.phone || 'No contact info'}
                </div>
              </div>

              {/* Consequence */}
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', color: '#991B1B', fontSize: '0.82rem' }}>
                <ShieldAlert size={15} style={{ flexShrink: 0, marginTop: '0.15rem' }} />
                <div>
                  They won't be able to place orders and will be asked to contact you via the enquiry form.
                  You can re-enable them anytime from <strong>Disabled Customers</strong>.
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', marginTop: '0.15rem' }}>
                <button
                  type="button"
                  onClick={() => setCustomerToDisable(null)}
                  className="admin-btn-secondary"
                  style={{ padding: '0.5rem 1.1rem', fontSize: '0.82rem' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleStatus(customerToDisable._id || customerToDisable.id, 'active')}
                  disabled={updatingId === (customerToDisable._id || customerToDisable.id)}
                  style={{
                    padding: '0.5rem 1.1rem',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    border: 'none',
                    borderRadius: '10px',
                    backgroundColor: '#DC2626',
                    color: '#FFFFFF',
                    cursor: updatingId === (customerToDisable._id || customerToDisable.id) ? 'wait' : 'pointer',
                    opacity: updatingId === (customerToDisable._id || customerToDisable.id) ? 0.7 : 1,
                  }}
                >
                  <UserX size={15} />
                  {updatingId === (customerToDisable._id || customerToDisable.id) ? 'Disabling…' : 'Disable'}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}


