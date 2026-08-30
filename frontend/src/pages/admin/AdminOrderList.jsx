import React, { useState, useEffect } from 'react';
import { Search, Filter, RefreshCw, Eye, ArrowUpRight } from 'lucide-react';
import api from '../../api/axios';

const STAGES = ['Pending', 'Confirmed', 'Processing', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];

export default function AdminOrderList() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, search]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (search) params.append('search', search);
      const res = await api.get(`/orders/admin/all?${params.toString()}`);
      setOrders(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await api.put(`/orders/admin/${orderId}/status`, { orderStatus: newStatus });
      fetchOrders();
    } catch (e) {
      alert('Error updating order status');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header Area */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1.25rem', borderBottom: '1px solid var(--admin-border)', paddingBottom: '1rem', marginBottom: '1rem' }}>
        <div>
          <span style={{ fontSize: '0.68rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--admin-text-muted)', letterSpacing: '0.05em' }}>
            Orders Log
          </span>
          <h1 style={{ fontSize: 'clamp(1.2rem, 2.5vw, 1.55rem)', fontFamily: 'var(--font-serif)', color: 'var(--admin-text-primary)', fontWeight: '800', margin: '0.1rem 0 0.25rem 0', lineHeight: '1.25' }}>
            Orders Management Log
          </h1>
          <p style={{ color: 'var(--admin-text-secondary)', fontSize: '0.88rem', margin: 0, fontWeight: '500' }}>
            Transition e-commerce order statuses across baking, packing, shipping, and delivery lifecycle.
          </p>
        </div>

        <button 
          onClick={fetchOrders} 
          className="admin-btn-secondary"
        >
          <RefreshCw size={14} />
          <span>Refresh Log</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flexGrow: 1, maxWidth: '420px' }}>
          <Search size={16} color="var(--admin-text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            placeholder="Search by Order ID, customer, email..." 
            className="admin-input"
            style={{ paddingLeft: '2.5rem' }} 
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={15} color="var(--admin-text-muted)" />
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="admin-input"
            style={{ width: 'auto', paddingRight: '2rem' }}
          >
            <option value="">All Order Statuses</option>
            {STAGES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Orders Table */}
      <div className="admin-table-container">
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem', gap: '1rem' }}>
            <RefreshCw size={20} className="animate-spin" color="var(--admin-accent)" />
            <span style={{ fontSize: '0.82rem', color: 'var(--admin-text-muted)', fontWeight: '600' }}>Loading orders log...</span>
          </div>
        ) : orders.length > 0 ? (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Current Status</th>
                <th>Date</th>
                <th style={{ textAlign: 'right' }}>Update Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                let badgeClass = 'admin-badge-neutral';
                if (o.orderStatus === 'Delivered') badgeClass = 'admin-badge-success';
                else if (o.orderStatus === 'Cancelled') badgeClass = 'admin-badge-danger';
                else if (['Pending', 'Packed', 'Shipped', 'Out for Delivery'].includes(o.orderStatus)) badgeClass = 'admin-badge-warning';

                return (
                  <tr key={o._id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: '800', color: 'var(--admin-text-primary)' }}>
                      {o.orderId || o._id.slice(-8).toUpperCase()}
                    </td>
                    <td>
                      <div style={{ fontWeight: '700', color: 'var(--admin-text-primary)' }}>{o.user?.name || o.shippingAddress?.fullName || 'Guest'}</div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--admin-text-muted)' }}>{o.user?.email || o.shippingAddress?.phone || 'N/A'}</div>
                    </td>
                    <td style={{ fontWeight: '800', color: 'var(--admin-text-primary)' }}>
                      ₹{o.totalAmount}
                    </td>
                    <td>
                      <span className={`admin-badge ${badgeClass}`}>
                        {o.orderStatus}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--admin-text-muted)', fontWeight: '600' }}>
                      {new Date(o.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <select 
                        value={o.orderStatus} 
                        onChange={(e) => handleStatusChange(o._id, e.target.value)}
                        className="admin-input"
                        style={{ width: 'auto', padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
                      >
                        {STAGES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="admin-empty-state">
            <div className="admin-empty-icon">
              <Filter size={24} />
            </div>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--admin-text-primary)', margin: 0, fontWeight: '800' }}>No orders found</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--admin-text-muted)', margin: 0 }}>No store orders matching the filter selection.</p>
          </div>
        )}
      </div>

    </div>
  );
}
