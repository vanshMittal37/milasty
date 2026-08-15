import React, { useState, useEffect } from 'react';
import { Package, Clock, Phone, MapPin, CheckCircle, RefreshCw } from 'lucide-react';
import api from '../api/axios';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/orders');
      setOrders(res.data || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <div style={{ padding: '3rem 0 5rem' }}>
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span className="badge-pill badge-gold" style={{ marginBottom: '0.5rem' }}>
              Bakery Administration
            </span>
            <h1 style={{ fontSize: '2.2rem', color: '#4A3525' }}>WhatsApp Orders Log</h1>
            <p style={{ color: '#6B5B52', fontSize: '0.95rem' }}>
              Every customer order initiated via the Ritual Basket is recorded here for fulfillment tracking.
            </p>
          </div>

          <button onClick={fetchOrders} className="btn-secondary" style={{ padding: '0.65rem 1.25rem' }}>
            <RefreshCw size={16} />
            <span>Refresh Orders</span>
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#6B5B52' }}>Loading order history...</div>
        ) : orders.length === 0 ? (
          <div className="glass-card" style={{ padding: '4rem 2rem', textAlign: 'center', color: '#6B5B52' }}>
            <Package size={48} color="#D9CBB7" style={{ margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.3rem', color: '#5C4028', marginBottom: '0.5rem' }}>No Orders Logged Yet</h3>
            <p style={{ fontSize: '0.9rem' }}>Placed customer orders will automatically appear in this dashboard.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {orders.map((order, idx) => (
              <div
                key={idx}
                className="glass-card"
                style={{
                  padding: '1.75rem',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E2D7C7',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '1px solid #E2D7C7',
                    paddingBottom: '1rem',
                    marginBottom: '1rem',
                    flexWrap: 'wrap',
                    gap: '0.75rem',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '1.2rem', fontWeight: '800', color: '#4A3525', marginRight: '0.75rem' }}>
                      {order.orderId}
                    </span>
                    <span className="badge-pill badge-gold">
                      {order.status ? order.status.replace('_', ' ').toUpperCase() : 'PENDING'}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.85rem', color: '#6B5B52', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Clock size={15} />
                    <span>{new Date(order.createdAt).toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                  {/* Customer info */}
                  <div>
                    <h4 style={{ fontSize: '0.95rem', color: '#5C4028', marginBottom: '0.5rem' }}>Customer Details</h4>
                    <div style={{ fontSize: '0.9rem', color: '#2C221E', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      <div style={{ fontWeight: '700' }}>{order.customerName}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#274C37' }}>
                        <Phone size={14} />
                        <a href={`https://wa.me/${order.phone}`} target="_blank" rel="noreferrer" style={{ textDecoration: 'underline' }}>
                          {order.phone}
                        </a>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.35rem', color: '#6B5B52', fontSize: '0.85rem' }}>
                        <MapPin size={14} style={{ flexShrink: 0, marginTop: '3px' }} />
                        <span>{order.address} (Pincode: {order.pincode})</span>
                      </div>
                    </div>
                  </div>

                  {/* Items list */}
                  <div>
                    <h4 style={{ fontSize: '0.95rem', color: '#5C4028', marginBottom: '0.5rem' }}>Ordered Items</h4>
                    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.88rem' }}>
                      {order.items?.map((item, i) => (
                        <li key={i} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #E2D7C7', paddingBottom: '0.2rem' }}>
                          <span>
                            {item.title} ({item.variantName} - {item.weight}) x {item.quantity}
                          </span>
                          <span style={{ fontWeight: '700', color: '#4A3525' }}>₹{item.totalPrice}</span>
                        </li>
                      ))}
                    </ul>
                    <div style={{ marginTop: '0.75rem', textAlign: 'right', fontWeight: '800', color: '#4A3525', fontSize: '1.05rem' }}>
                      Total: ₹{order.totalAmount}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
