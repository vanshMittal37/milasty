import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  DollarSign, Package, ShoppingBag, Users, AlertTriangle, ArrowUpRight, 
  Plus, RefreshCw, CheckCircle, TrendingUp, ChevronRight, Activity, MessageSquare, Ticket
} from 'lucide-react';
import api from '../../api/axios';

export default function AdminDashboardMain() {
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [timeOfDay, setTimeOfDay] = useState('Good morning');
  const [activeRange, setActiveRange] = useState('7 Days');

  useEffect(() => {
    const hr = new Date().getHours();
    if (hr < 12) setTimeOfDay('Good morning');
    else if (hr < 17) setTimeOfDay('Good afternoon');
    else setTimeOfDay('Good evening');
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(false);
    try {
      const [statsRes, productsRes, reviewsRes] = await Promise.all([
        api.get('/orders/admin/analytics'),
        api.get('/products?limit=100'),
        api.get('/reviews')
      ]);
      setStats(statsRes.data);
      setProducts(productsRes.data.products || []);
      setReviews(reviewsRes.data || []);
    } catch (e) {
      console.error('Error fetching dashboard analytics', e);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem' }}>
        <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(45,106,79,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <RefreshCw size={20} className="animate-spin" color="var(--admin-accent)" />
        </div>
        <span style={{ fontSize: '0.78rem', color: 'var(--admin-text-muted)', fontWeight: '700', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Loading analytics…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', gap: '1.25rem', padding: '2rem', textAlign: 'center', margin: '0 auto', maxWidth: '520px' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--admin-danger-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <AlertTriangle size={24} color="var(--admin-danger)" />
        </div>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontFamily: 'var(--font-serif)', color: 'var(--admin-text-primary)', fontWeight: '800', marginBottom: '0.4rem' }}>Unable to load dashboard</h3>
          <p style={{ fontSize: '0.84rem', color: 'var(--admin-text-secondary)', margin: 0, lineHeight: '1.5' }}>Check your connection or server status and try again.</p>
        </div>
        <button onClick={fetchDashboardData} className="admin-btn-primary">
          <RefreshCw size={14} />
          Try Again
        </button>
      </div>
    );
  }

  const lowStockItems = products.filter(p => (p.stock !== undefined ? p.stock : 50) <= 5);
  const recentOrdersForChart = stats?.recentOrders ? [...stats.recentOrders].reverse() : [];
  const chartPoints = recentOrdersForChart.map((o, idx) => ({ x: idx, y: o.totalAmount || 0 }));
  const maxVal = chartPoints.length > 0 ? Math.max(...chartPoints.map(p => p.y), 1) : 1;

  const isCatalogConnected = products.length > 0;
  const isCustomersConnected = (stats?.totalCustomers || 0) > 0;
  const isOrdersConnected = (stats?.totalOrders || 0) > 0;
  const isReviewsConnected = reviews.length > 0;

  const activityEvents = [];
  if (stats?.recentOrders?.length > 0) {
    stats.recentOrders.slice(0, 3).forEach(o => {
      activityEvents.push({
        type: 'order',
        title: 'New order received',
        desc: `${o.orderId} · ₹${o.totalAmount} by ${o.customerName}`,
        time: new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    });
  }
  if (products.length > 0) {
    products.slice(0, 2).forEach(p => {
      activityEvents.push({ type: 'product', title: 'Product catalog active', desc: `${p.title} loaded in store catalog`, time: 'Catalog Sync' });
    });
  }
  if (reviews.length > 0) {
    reviews.slice(0, 1).forEach(r => {
      activityEvents.push({ type: 'review', title: 'Review submitted', desc: `"${r.comment?.slice(0, 35)}…" by ${r.name}`, time: 'Pending review' });
    });
  }

  const kpiData = [
    {
      label: 'Total Revenue',
      value: `₹${(stats?.totalRevenue || 0).toLocaleString('en-IN')}`,
      sub: 'Captured sales',
      sub2: 'Current period',
      icon: DollarSign,
      color: 'var(--admin-accent)',
      bg: 'rgba(45,106,79,0.10)',
      topColor: 'var(--admin-accent)',
    },
    {
      label: 'Total Orders',
      value: stats?.totalOrders || 0,
      sub: `${stats?.pendingOrders || 0} Pending`,
      sub2: `${stats?.deliveredOrders || 0} Delivered`,
      icon: ShoppingBag,
      color: '#2563EB',
      bg: 'rgba(37,99,235,0.08)',
      topColor: '#2563EB',
    },
    {
      label: 'Low Stock Alert',
      value: lowStockItems.length,
      sub: lowStockItems.length > 0 ? 'Action Required' : 'Stock Optimal',
      sub2: 'Threshold ≤ 5 units',
      icon: AlertTriangle,
      color: lowStockItems.length > 0 ? 'var(--admin-danger)' : 'var(--admin-success)',
      bg: lowStockItems.length > 0 ? 'var(--admin-danger-bg)' : 'var(--admin-success-bg)',
      topColor: lowStockItems.length > 0 ? 'var(--admin-danger)' : 'var(--admin-success)',
    },
    {
      label: 'Customers',
      value: stats?.totalCustomers || 0,
      sub: 'Registered users',
      sub2: 'Supabase Auth',
      icon: Users,
      color: '#7C3AED',
      bg: 'rgba(124,58,237,0.08)',
      topColor: '#7C3AED',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

      {/* ── HEADER ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <p style={{ fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--admin-text-muted)', margin: '0 0 0.3rem 0' }}>
            {timeOfDay} 👋
          </p>
          <h2 style={{ fontSize: 'clamp(1.15rem, 2.5vw, 1.55rem)', fontFamily: 'var(--font-serif)', fontWeight: '800', color: 'var(--admin-text-primary)', margin: 0, lineHeight: '1.25' }}>
            Store Performance Overview
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--admin-text-secondary)', margin: '0.3rem 0 0 0', fontWeight: '500' }}>
            Here's what's happening with Milasty today.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem' }}>
          <button onClick={fetchDashboardData} className="admin-btn-secondary" style={{ fontSize: '0.8rem' }}>
            <RefreshCw size={13} />
            Refresh
          </button>
          <Link to="/admin/products/add" className="admin-btn-primary" style={{ fontSize: '0.8rem' }}>
            <Plus size={13} />
            Add Product
          </Link>
        </div>
      </div>

      {/* ── KPI CARDS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1.1rem' }} className="admin-kpi-row">
        <style>{`
          @media (min-width: 1200px) { .admin-kpi-row { grid-template-columns: repeat(4, 1fr) !important; } }
        `}</style>

        {kpiData.map((k) => {
          const Icon = k.icon;
          return (
            <div
              key={k.label}
              style={{
                background: '#FFFFFF',
                border: '1px solid var(--admin-border)',
                borderTop: `3px solid ${k.topColor}`,
                borderRadius: '12px',
                padding: '1.15rem 1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.85rem',
                boxShadow: '0 2px 8px rgba(26,35,50,0.05)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                cursor: 'default'
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(26,35,50,0.10)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 2px 8px rgba(26,35,50,0.05)'; }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '0.68rem', color: 'var(--admin-text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{k.label}</span>
                <div style={{ padding: '0.45rem', borderRadius: '9px', backgroundColor: k.bg, color: k.color }}>
                  <Icon size={16} />
                </div>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: '900', color: 'var(--admin-text-primary)', letterSpacing: '-0.03em', lineHeight: '1' }}>
                {k.value}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #F1F5F9', paddingTop: '0.65rem' }}>
                <span style={{ fontSize: '0.72rem', color: k.color, fontWeight: '700' }}>{k.sub}</span>
                <span style={{ fontSize: '0.68rem', color: 'var(--admin-text-muted)', fontWeight: '600' }}>{k.sub2}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── SALES CHART + LOW STOCK ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }} className="admin-dashboard-split">
        <style>{`
          @media (min-width: 1024px) { .admin-dashboard-split { grid-template-columns: 2fr 1fr !important; } }
        `}</style>

        {/* Sales Chart */}
        <div className="admin-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontFamily: 'var(--font-serif)', color: 'var(--admin-text-primary)', fontWeight: '800', margin: 0 }}>Sales Overview</h3>
              <p style={{ fontSize: '0.72rem', color: 'var(--admin-text-muted)', margin: '0.2rem 0 0', fontWeight: '500' }}>Revenue performance over time</p>
            </div>
            <div style={{ display: 'flex', gap: '0.25rem', backgroundColor: '#F8FAFC', padding: '0.2rem', borderRadius: '8px', border: '1px solid var(--admin-border)' }}>
              {['7 Days', '30 Days', '3 Months'].map(range => (
                <button
                  key={range}
                  onClick={() => setActiveRange(range)}
                  style={{
                    border: 'none',
                    background: range === activeRange ? '#FFFFFF' : 'none',
                    color: range === activeRange ? 'var(--admin-accent)' : 'var(--admin-text-muted)',
                    fontSize: '0.68rem',
                    padding: '0.3rem 0.65rem',
                    borderRadius: '6px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    boxShadow: range === activeRange ? '0 1px 4px rgba(0,0,0,0.08)' : 'none'
                  }}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          {chartPoints.length > 0 ? (
            <div style={{ position: 'relative', width: '100%', height: '200px' }}>
              <svg viewBox="0 0 500 180" width="100%" height="100%" style={{ overflow: 'visible' }}>
                <defs>
                  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2D6A4F" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#2D6A4F" stopOpacity="0.01" />
                  </linearGradient>
                </defs>
                {[0, 45, 90, 135].map(y => (
                  <line key={y} x1="0" y1={y} x2="500" y2={y} stroke="#E2E8F0" strokeWidth="0.75" />
                ))}
                <path
                  d={chartPoints.reduce((acc, p, i) => {
                    const x = (i / (chartPoints.length - 1 || 1)) * 500;
                    const y = 160 - (p.y / maxVal) * 140;
                    return acc + `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                  }, '')}
                  fill="none"
                  stroke="#2D6A4F"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d={chartPoints.reduce((acc, p, i) => {
                    const x = (i / (chartPoints.length - 1 || 1)) * 500;
                    const y = 160 - (p.y / maxVal) * 140;
                    return acc + `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                  }, '') + ` L 500 160 L 0 160 Z`}
                  fill="url(#chartGrad)"
                />
                {chartPoints.map((p, i) => {
                  const x = (i / (chartPoints.length - 1 || 1)) * 500;
                  const y = 160 - (p.y / maxVal) * 140;
                  return (
                    <circle key={i} cx={x} cy={y} r="4" fill="#FFFFFF" stroke="#2D6A4F" strokeWidth="2">
                      <title>₹{p.y}</title>
                    </circle>
                  );
                })}
              </svg>
            </div>
          ) : (
            <div style={{ height: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', border: '1.5px dashed var(--admin-border)', borderRadius: '10px', backgroundColor: '#FAFBFC' }}>
              <TrendingUp size={22} color="var(--admin-text-muted)" />
              <span style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--admin-text-secondary)' }}>No sales data yet</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--admin-text-muted)', fontWeight: '500', textAlign: 'center', maxWidth: '250px' }}>Sales performance will appear here once orders are completed.</span>
            </div>
          )}
        </div>

        {/* Low Stock */}
        <div className="admin-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontFamily: 'var(--font-serif)', color: 'var(--admin-text-primary)', fontWeight: '800', margin: 0 }}>Low Stock Alert</h3>
            <p style={{ fontSize: '0.72rem', color: 'var(--admin-text-muted)', margin: '0.2rem 0 0', fontWeight: '500' }}>Inventory requiring attention</p>
          </div>

          <div style={{ flexGrow: 1 }}>
            {lowStockItems.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {lowStockItems.slice(0, 4).map((p) => (
                  <div key={p._id || p.slug} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem', background: '#F8FAFC', borderRadius: '9px', border: '1px solid var(--admin-border)' }}>
                    <img src={p.image} alt={p.title} style={{ width: '38px', height: '38px', objectFit: 'cover', borderRadius: '7px', border: '1px solid var(--admin-border)' }} />
                    <div style={{ flexGrow: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--admin-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.title}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--admin-danger)', fontWeight: '700', marginTop: '0.1rem' }}>
                        {p.stock !== undefined ? p.stock : 0} left
                      </div>
                    </div>
                    <span className="admin-badge admin-badge-danger">{p.stock <= 0 ? 'Out' : 'Low'}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem', backgroundColor: 'rgba(45,106,79,0.05)', borderRadius: '10px', border: '1.5px dashed rgba(45,106,79,0.2)' }}>
                <CheckCircle size={26} color="var(--admin-success)" />
                <span style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--admin-text-primary)' }}>Inventory looks healthy</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--admin-text-muted)', fontWeight: '500' }}>No products need restocking.</span>
              </div>
            )}
          </div>

          <Link to="/admin/products" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', fontSize: '0.78rem', fontWeight: '700', color: 'var(--admin-accent)', textDecoration: 'none', marginTop: '1rem', borderTop: '1px solid var(--admin-border)', paddingTop: '0.9rem' }}>
            Manage Inventory <ArrowUpRight size={13} />
          </Link>
        </div>
      </div>

      {/* ── RECENT ORDERS TABLE ── */}
      <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.2rem 1.4rem', borderBottom: '1px solid var(--admin-border)', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontFamily: 'var(--font-serif)', color: 'var(--admin-text-primary)', fontWeight: '800', margin: 0 }}>Recent Orders</h3>
            <p style={{ fontSize: '0.72rem', color: 'var(--admin-text-muted)', margin: '0.2rem 0 0', fontWeight: '500' }}>Latest checkout activities</p>
          </div>
          <Link to="/admin/orders" style={{ fontSize: '0.78rem', color: 'var(--admin-accent)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.2rem', textDecoration: 'none' }}>
            View All <ArrowUpRight size={13} />
          </Link>
        </div>

        <div style={{ overflowX: 'auto' }}>
          {stats?.recentOrders?.length > 0 ? (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentOrders.slice(0, 5).map(o => (
                  <tr key={o.orderId}>
                    <td style={{ fontFamily: 'monospace', fontWeight: '700', fontSize: '0.8rem', color: 'var(--admin-text-secondary)' }}>{o.orderId}</td>
                    <td>
                      <div style={{ fontWeight: '700', color: 'var(--admin-text-primary)', fontSize: '0.84rem' }}>{o.customerName}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--admin-text-muted)' }}>{o.phone}</div>
                    </td>
                    <td style={{ fontWeight: '800', color: 'var(--admin-text-primary)' }}>₹{o.totalAmount}</td>
                    <td>
                      <span className={`admin-badge ${o.paymentStatus === 'Paid' ? 'admin-badge-success' : 'admin-badge-danger'}`}>
                        {o.paymentStatus}
                      </span>
                    </td>
                    <td>
                      <span className="admin-badge admin-badge-warning">{o.orderStatus}</span>
                    </td>
                    <td style={{ color: 'var(--admin-text-muted)', fontSize: '0.76rem', fontWeight: '600' }}>
                      {new Date(o.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Link to="/admin/orders" style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--admin-accent)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.15rem' }}>
                        View <ChevronRight size={13} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--admin-text-muted)', fontSize: '0.84rem', fontWeight: '600' }}>
              No recent orders recorded yet.
            </div>
          )}
        </div>
      </div>

      {/* ── QUICK ACTIONS ── */}
      <div>
        <p style={{ fontSize: '0.68rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--admin-text-muted)', margin: '0 0 0.75rem' }}>Quick Actions</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(195px, 1fr))', gap: '1rem' }}>
          {[
            { label: 'Add Product', desc: 'Add new product to store', path: '/admin/products/add', icon: Plus, color: 'var(--admin-accent)', bg: 'rgba(45,106,79,0.10)' },
            { label: 'Manage Orders', desc: 'Review all order logs', path: '/admin/orders', icon: ShoppingBag, color: '#2563EB', bg: 'rgba(37,99,235,0.08)' },
            { label: 'Customers', desc: 'View registered accounts', path: '/admin/customers', icon: Users, color: '#7C3AED', bg: 'rgba(124,58,237,0.08)' },
            { label: 'Create Coupon', desc: 'Setup discount codes', path: '/admin/coupons', icon: Ticket, color: '#D48B2F', bg: 'rgba(212,139,47,0.10)' },
          ].map(act => {
            const Icon = act.icon;
            return (
              <Link
                key={act.label}
                to={act.path}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid var(--admin-border)',
                  borderRadius: '12px',
                  padding: '1.1rem',
                  textDecoration: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.65rem',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 1px 4px rgba(26,35,50,0.05)'
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(26,35,50,0.08)'; e.currentTarget.style.borderColor = act.color; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 1px 4px rgba(26,35,50,0.05)'; e.currentTarget.style.borderColor = 'var(--admin-border)'; }}
              >
                <div style={{ width: '34px', height: '34px', borderRadius: '8px', backgroundColor: act.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: act.color }}>
                  <Icon size={16} />
                </div>
                <div>
                  <h4 style={{ fontSize: '0.84rem', fontWeight: '800', color: 'var(--admin-text-primary)', margin: '0 0 0.2rem' }}>{act.label}</h4>
                  <p style={{ fontSize: '0.7rem', color: 'var(--admin-text-muted)', margin: 0, fontWeight: '500' }}>{act.desc}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── ACTIVITY + STORE HEALTH ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem', paddingBottom: '1rem' }} className="admin-dashboard-footer">
        <style>{`
          @media (min-width: 1024px) { .admin-dashboard-footer { grid-template-columns: 1fr 1fr !important; } }
        `}</style>

        {/* Recent Activity */}
        <div className="admin-card">
          <h3 style={{ fontSize: '1rem', fontFamily: 'var(--font-serif)', color: 'var(--admin-text-primary)', fontWeight: '800', marginBottom: '0.2rem', marginTop: 0 }}>Recent Activity</h3>
          <p style={{ fontSize: '0.72rem', color: 'var(--admin-text-muted)', margin: '0 0 1.25rem', fontWeight: '500' }}>Live store event history</p>

          {activityEvents.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {activityEvents.map((act, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '0.75rem', borderBottom: idx !== activityEvents.length - 1 ? '1px solid #F1F5F9' : 'none', paddingBottom: '0.75rem' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'rgba(45,106,79,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--admin-accent)', flexShrink: 0 }}>
                    <Activity size={12} />
                  </div>
                  <div style={{ flexGrow: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--admin-text-primary)' }}>{act.title}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--admin-text-muted)', marginTop: '0.12rem', fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{act.desc}</div>
                  </div>
                  <span style={{ fontSize: '0.68rem', color: 'var(--admin-text-muted)', fontWeight: '600', flexShrink: 0 }}>{act.time}</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--admin-text-muted)', fontSize: '0.82rem', fontWeight: '600' }}>No recent activity.</div>
          )}
        </div>

        {/* Store Health */}
        <div className="admin-card">
          <h3 style={{ fontSize: '1rem', fontFamily: 'var(--font-serif)', color: 'var(--admin-text-primary)', fontWeight: '800', marginBottom: '0.2rem', marginTop: 0 }}>Store Health</h3>
          <p style={{ fontSize: '0.72rem', color: 'var(--admin-text-muted)', margin: '0 0 1.25rem', fontWeight: '500' }}>Database & system status</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {[
              { icon: Package, label: 'Product Catalog', ok: isCatalogConnected },
              { icon: Users, label: 'Customer Registry', ok: isCustomersConnected },
              { icon: ShoppingBag, label: 'Order Gateway', ok: isOrdersConnected },
              { icon: MessageSquare, label: 'Review Moderation', ok: isReviewsConnected },
            ].map(({ icon: Icon, label, ok }, idx) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: idx < 3 ? '1px solid #F1F5F9' : 'none', paddingBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <Icon size={15} color="var(--admin-text-muted)" />
                  <span style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--admin-text-primary)' }}>{label}</span>
                </div>
                <span className={`admin-badge ${ok ? 'admin-badge-success' : 'admin-badge-danger'}`}>
                  {ok ? '● Active' : '○ Offline'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
