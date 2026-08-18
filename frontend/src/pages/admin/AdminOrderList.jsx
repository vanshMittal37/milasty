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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Header Area */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem' }}>
        <div>
          <h1 style={{ fontSize: '2.1rem', fontFamily: 'var(--font-serif)', color: 'var(--primary-dark)', fontWeight: '800', margin: '0 0 0.35rem 0' }}>
            Orders Management Log
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0, fontWeight: '500' }}>
            Transition e-commerce order statuses across baking, packing, shipping, and delivery lifecycle.
          </p>
        </div>

        <button 
          onClick={fetchOrders} 
          className="btn-secondary" 
          style={{ 
            padding: '0.65rem 1.15rem', 
            fontSize: '0.82rem', 
            fontWeight: '800', 
            borderRadius: '10px', 
            borderColor: 'var(--border-color)', 
            color: 'var(--primary-dark)',
            cursor: 'pointer'
          }}
        >
          <RefreshCw size={14} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div 
        style={{ 
          backgroundColor: 'rgba(50, 26, 18, 0.60)', 
          padding: '1.25rem', 
          borderRadius: '16px', 
          border: '1px solid rgba(245, 235, 221, 0.25)', 
          display: 'flex', 
          gap: '1rem', 
          flexWrap: 'wrap',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
        }}
      >
        <div style={{ position: 'relative', flexGrow: 1, minWidth: '260px' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search orders by ID, Customer name, or Phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ 
              width: '100%', 
              height: '44px',
              padding: '0 1rem 0 2.5rem', 
              borderRadius: '10px', 
              border: '1px solid rgba(245, 235, 221, 0.25)', 
              fontSize: '0.88rem',
              outline: 'none',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              color: 'var(--text-light)',
              fontFamily: 'inherit'
            }}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ 
            height: '44px',
            padding: '0 1rem', 
            borderRadius: '10px', 
            border: '1px solid rgba(245, 235, 221, 0.25)', 
            fontSize: '0.88rem', 
            fontWeight: '750', 
            color: 'var(--text-light)',
            outline: 'none',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            cursor: 'pointer',
            fontFamily: 'inherit'
          }}
        >
          <option value="" style={{ backgroundColor: '#24130D', color: '#FFF' }}>All Statuses</option>
          {STAGES.map((s) => (
            <option key={s} value={s} style={{ backgroundColor: '#24130D', color: '#FFF' }}>{s}</option>
          ))}
        </select>
      </div>

      {/* Orders Table Log */}
      <div className="glass-card" style={{ padding: '2rem', backgroundColor: 'rgba(50, 26, 18, 0.60)', borderRadius: '16px', border: '1px solid rgba(245, 235, 221, 0.25)', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem', gap: '1rem' }}>
            <RefreshCw size={20} className="animate-spin" color="var(--accent-gold)" />
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: '600' }}>Fetching orders log...</span>
          </div>
        ) : orders.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(245, 235, 221, 0.15)', color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: '800' }}>Order ID</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: '800' }}>Customer</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: '800' }}>Purchased Items</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: '800' }}>Total Amount</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: '800' }}>Payment Status</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: '800' }}>Update Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o._id || o.orderId} style={{ borderBottom: '1px solid rgba(245, 235, 221, 0.15)' }}>
                    <td style={{ padding: '1.1rem 1rem', fontWeight: '800', color: 'var(--text-light)' }}>{o.orderId}</td>
                    <td style={{ padding: '1.1rem 1rem' }}>
                      <div style={{ fontWeight: '750', color: 'var(--text-light)' }}>{o.customerName}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '600' }}>{o.phone}</div>
                    </td>
                    <td style={{ padding: '1.1rem 1rem', color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: '600', maxWidth: '240px', lineHeight: '1.3' }}>
                      {o.items?.map((i) => `${i.title} (x${i.quantity})`).join(', ')}
                    </td>
                    <td style={{ padding: '1.1rem 1rem', fontWeight: '850', color: 'var(--text-light)' }}>₹{o.totalAmount}</td>
                    <td style={{ padding: '1.1rem 1rem' }}>
                      <span 
                        style={{ 
                          fontSize: '0.7rem',
                          fontWeight: '800',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                          backgroundColor: o.paymentStatus === 'Paid' ? 'rgba(39, 76, 55, 0.08)' : 'rgba(217, 83, 79, 0.08)', 
                          color: o.paymentStatus === 'Paid' ? 'var(--accent-gold)' : 'var(--accent-terracotta)',
                          padding: '0.25rem 0.6rem',
                          borderRadius: '6px',
                          border: o.paymentStatus === 'Paid' ? '1px solid rgba(201, 154, 50, 0.25)' : '1px solid rgba(217, 83, 79, 0.25)'
                        }}
                      >
                        {o.paymentMethod}: {o.paymentStatus}
                      </span>
                    </td>
                    <td style={{ padding: '1.1rem 1rem' }}>
                      <select
                        value={o.orderStatus}
                        onChange={(e) => handleStatusChange(o.orderId || o._id, e.target.value)}
                        style={{ 
                          padding: '0.45rem 0.75rem', 
                          borderRadius: '8px', 
                          border: '1px solid rgba(245, 235, 221, 0.25)', 
                          fontWeight: '800', 
                          fontSize: '0.8rem', 
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          color: 'var(--text-light)',
                          outline: 'none',
                          cursor: 'pointer',
                          fontFamily: 'inherit'
                        }}
                      >
                        {STAGES.map((s) => (
                          <option key={s} value={s} style={{ backgroundColor: '#24130D', color: '#FFF' }}>{s}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600' }}>
            No orders found matching the filter criteria.
          </div>
        )}
      </div>

    </div>
  );
}
