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
    // Dynamic greeting based on time of day
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
      // Fetch stats, products, and reviews in parallel
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
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1.25rem' }}>
        <RefreshCw size={28} className="animate-spin" color="var(--admin-accent)" />
        <span style={{ fontSize: '0.82rem', color: 'var(--admin-text-muted)', fontWeight: '700', letterSpacing: '0.04em' }}>LOADING STORE PERFORMANCE ANALYTICS...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', gap: '1.5rem', padding: '2rem', textAlign: 'center', margin: '0 auto', maxWidth: '600px' }}>
        <AlertTriangle size={48} color="var(--admin-danger)" />
        <div>
          <h3 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-serif)', color: 'var(--admin-text-primary)', fontWeight: '800', marginBottom: '0.5rem' }}>Unable to load dashboard data</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--admin-text-secondary)', margin: 0 }}>Please check your internet connection or server status and try again.</p>
        </div>
        <button 
          onClick={fetchDashboardData} 
          className="admin-btn-primary" 
        >
          Try Again
        </button>
      </div>
    );
  }

  // Filter low stock products (stock <= 5)
  const lowStockItems = products.filter(p => (p.stock !== undefined ? p.stock : 50) <= 5);

  // Generate elegant SVG points for recent orders to draw a beautiful sales overview trend line
  const recentOrdersForChart = stats?.recentOrders ? [...stats.recentOrders].reverse() : [];
  const chartPoints = recentOrdersForChart.map((o, idx) => ({ x: idx, y: o.totalAmount || 0 }));
  const maxVal = chartPoints.length > 0 ? Math.max(...chartPoints.map(p => p.y), 1) : 1;

  // Real store health indicators based on database records
  const isCatalogConnected = products.length > 0;
  const isCustomersConnected = (stats?.totalCustomers || 0) > 0;
  const isOrdersConnected = (stats?.totalOrders || 0) > 0;
  const isReviewsConnected = reviews.length > 0;

  // Compile real recent activity events
  const activityEvents = [];
  if (stats?.recentOrders && stats.recentOrders.length > 0) {
    stats.recentOrders.slice(0, 3).forEach(o => {
      activityEvents.push({
        type: 'order',
        title: 'New order received',
        desc: `${o.orderId} • ₹${o.totalAmount} by ${o.customerName}`,
        time: new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    });
  }
  if (products.length > 0) {
    products.slice(0, 2).forEach(p => {
      activityEvents.push({
        type: 'product',
        title: 'Product catalog active',
        desc: `${p.title} loaded in store catalog`,
        time: 'Catalog Sync'
      });
    });
  }
  if (reviews.length > 0) {
    reviews.slice(0, 1).forEach(r => {
      activityEvents.push({
        type: 'review',
        title: 'Review submitted',
        desc: `"${r.comment?.slice(0, 30)}..." by ${r.name}`,
        time: 'Moderation pending'
      });
    });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      
      {/* ==================================================
          1. DASHBOARD HEADER
         ================================================== */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid var(--admin-border)' }}>
        <div>
          <span style={{ fontSize: '0.68rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--admin-text-muted)', letterSpacing: '0.05em' }}>
            Overview
          </span>
          <h1 style={{ fontSize: 'clamp(28px, 4.5vw, 40px)', fontFamily: 'var(--font-serif)', color: 'var(--admin-text-primary)', fontWeight: '800', margin: '0.15rem 0 0.35rem 0', lineHeight: '1.2' }}>
            {timeOfDay}, Admin 👋
          </h1>
          <p style={{ color: 'var(--admin-text-secondary)', fontSize: '0.88rem', margin: 0, fontWeight: '500' }}>
            Here's what's happening with your store today.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            onClick={fetchDashboardData} 
            className="admin-btn-secondary"
          >
            <RefreshCw size={14} />
            <span>Refresh</span>
          </button>
          <Link 
            to="/admin/products/add" 
            className="admin-btn-primary"
          >
            <Plus size={14} />
            <span>Add New Product</span>
          </Link>
        </div>
      </div>

      {/* ==================================================
          2. STORE OVERVIEW SECTION (4 KPI Cards in one Row)
         ================================================== */}
      <div>
        <h3 style={{ fontSize: '0.8rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--admin-text-muted)', marginBottom: '0.75rem', marginTop: 0 }}>
          Store Overview
        </h3>
        
        <div 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
            gap: '1.25rem' 
          }}
          className="admin-kpi-row"
        >
          <style>{`
            @media (min-width: 1200px) {
              .admin-kpi-row {
                grid-template-columns: repeat(4, 1fr) !important;
              }
            }
          `}</style>

          {/* Card 1: Total Revenue */}
          <div className="admin-card admin-card-hover" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '145px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--admin-text-muted)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Revenue</span>
                <div style={{ fontSize: '1.75rem', fontWeight: '900', color: 'var(--admin-text-primary)', letterSpacing: '-0.02em', marginTop: '0.35rem' }}>
                  ₹{stats?.totalRevenue || 0}
                </div>
              </div>
              <div style={{ padding: '0.5rem', borderRadius: '10px', backgroundColor: 'rgba(117, 139, 69, 0.08)', color: 'var(--admin-accent)' }}>
                <DollarSign size={18} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--admin-border)', paddingTop: '0.65rem' }}>
              <span style={{ fontSize: '0.74rem', color: 'var(--admin-accent)', fontWeight: '750' }}>Captured sales</span>
              <span style={{ fontSize: '0.68rem', color: 'var(--admin-text-muted)', fontWeight: '600' }}>Current period</span>
            </div>
          </div>

          {/* Card 2: Total Orders */}
          <div className="admin-card admin-card-hover" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '145px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--admin-text-muted)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Orders</span>
                <div style={{ fontSize: '1.75rem', fontWeight: '900', color: 'var(--admin-text-primary)', letterSpacing: '-0.02em', marginTop: '0.35rem' }}>
                  {stats?.totalOrders || 0}
                </div>
              </div>
              <div style={{ padding: '0.5rem', borderRadius: '10px', backgroundColor: 'rgba(117, 139, 69, 0.08)', color: 'var(--admin-accent)' }}>
                <ShoppingBag size={18} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--admin-border)', paddingTop: '0.65rem' }}>
              <span style={{ fontSize: '0.74rem', color: 'var(--admin-accent-gold)', fontWeight: '750' }}>
                {stats?.pendingOrders || 0} Pending
              </span>
              <span style={{ fontSize: '0.74rem', color: 'var(--admin-success)', fontWeight: '750' }}>
                {stats?.deliveredOrders || 0} Delivered
              </span>
            </div>
          </div>

          {/* Card 3: Low Stock Alert */}
          <div className="admin-card admin-card-hover" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '145px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--admin-text-muted)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Low Stock Alert</span>
                <div style={{ fontSize: '1.75rem', fontWeight: '900', color: lowStockItems.length > 0 ? 'var(--admin-danger)' : 'var(--admin-text-primary)', letterSpacing: '-0.02em', marginTop: '0.35rem' }}>
                  {lowStockItems.length}
                </div>
              </div>
              <div style={{ padding: '0.5rem', borderRadius: '10px', backgroundColor: lowStockItems.length > 0 ? 'var(--admin-danger-bg)' : 'rgba(24, 32, 25, 0.04)', color: lowStockItems.length > 0 ? 'var(--admin-danger)' : 'var(--admin-text-muted)' }}>
                <AlertTriangle size={18} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--admin-border)', paddingTop: '0.65rem' }}>
              <span style={{ fontSize: '0.74rem', color: lowStockItems.length > 0 ? 'var(--admin-danger)' : 'var(--admin-text-muted)', fontWeight: '750' }}>
                {lowStockItems.length > 0 ? 'Action Required' : 'Stock Optimal'}
              </span>
              <span style={{ fontSize: '0.68rem', color: 'var(--admin-text-muted)', fontWeight: '600' }}>Threshold ≤ 5</span>
            </div>
          </div>

          {/* Card 4: Total Customers */}
          <div className="admin-card admin-card-hover" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '145px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--admin-text-muted)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Customers</span>
                <div style={{ fontSize: '1.75rem', fontWeight: '900', color: 'var(--admin-text-primary)', letterSpacing: '-0.02em', marginTop: '0.35rem' }}>
                  {stats?.totalCustomers || 0}
                </div>
              </div>
              <div style={{ padding: '0.5rem', borderRadius: '10px', backgroundColor: 'rgba(117, 139, 69, 0.08)', color: 'var(--admin-accent)' }}>
                <Users size={18} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--admin-border)', paddingTop: '0.65rem' }}>
              <span style={{ fontSize: '0.74rem', color: 'var(--admin-accent)', fontWeight: '750' }}>Registered Users</span>
              <span style={{ fontSize: '0.68rem', color: 'var(--admin-text-muted)', fontWeight: '600' }}>Supabase Auth</span>
            </div>
          </div>

        </div>
      </div>

      {/* ==================================================
          3. CHARTS & LOW STOCK SPLIT (Grid Layout)
         ================================================== */}
      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
          gap: '1.5rem' 
        }}
        className="admin-dashboard-split-row"
      >
        <style>{`
          @media (min-width: 1024px) {
            .admin-dashboard-split-row {
              grid-template-columns: 2fr 1fr !important;
            }
          }
        `}</style>

        {/* Sales Overview Card */}
        <div className="admin-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontFamily: 'var(--font-serif)', color: 'var(--admin-text-primary)', fontWeight: '800', margin: 0 }}>Sales Overview</h3>
              <p style={{ fontSize: '0.74rem', color: 'var(--admin-text-muted)', margin: '0.15rem 0 0 0', fontWeight: '500' }}>Revenue performance over time</p>
            </div>
            
            <div style={{ display: 'flex', gap: '0.35rem', backgroundColor: 'rgba(24, 32, 25, 0.02)', padding: '0.25rem', borderRadius: '8px', border: '1px solid var(--admin-border)' }}>
              {['7 Days', '30 Days', '3 Months', '1 Year'].map(range => (
                <button 
                  key={range} 
                  onClick={() => setActiveRange(range)}
                  style={{ 
                    border: 'none', 
                    background: range === activeRange ? 'rgba(117, 139, 69, 0.12)' : 'none', 
                    color: range === activeRange ? 'var(--admin-accent)' : 'var(--admin-text-muted)', 
                    fontSize: '0.7rem', 
                    padding: '0.35rem 0.75rem', 
                    borderRadius: '6px', 
                    fontWeight: '800',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          {chartPoints.length > 0 ? (
            <div style={{ position: 'relative', width: '100%', height: '220px', marginTop: '1.5rem' }}>
              <svg viewBox="0 0 500 200" width="100%" height="100%" style={{ overflow: 'visible' }}>
                <defs>
                  <linearGradient id="chartGradPlum" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--admin-accent)" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="var(--admin-accent)" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                
                {/* Horizontal Grid lines */}
                {[0, 50, 100, 150].map((yVal) => (
                  <line key={yVal} x1="0" y1={yVal} x2="500" y2={yVal} stroke="var(--admin-border)" strokeWidth="0.75" strokeDasharray="3 3" />
                ))}

                {/* Line Path */}
                <path
                  d={chartPoints.reduce((acc, p, idx) => {
                    const xCoord = (idx / (chartPoints.length - 1 || 1)) * 500;
                    const yCoord = 180 - (p.y / maxVal) * 150;
                    return acc + `${idx === 0 ? 'M' : 'L'} ${xCoord} ${yCoord}`;
                  }, '')}
                  fill="none"
                  stroke="var(--admin-accent)" 
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Area Fill */}
                <path
                  d={chartPoints.reduce((acc, p, idx) => {
                    const xCoord = (idx / (chartPoints.length - 1 || 1)) * 500;
                    const yCoord = 180 - (p.y / maxVal) * 150;
                    return acc + `${idx === 0 ? 'M' : 'L'} ${xCoord} ${yCoord}`;
                  }, '') + ` L 500 180 L 0 180 Z`}
                  fill="url(#chartGradPlum)"
                />

                {/* Trend dots */}
                {chartPoints.map((p, idx) => {
                  const xCoord = (idx / (chartPoints.length - 1 || 1)) * 500;
                  const yCoord = 180 - (p.y / maxVal) * 150;
                  return (
                    <circle 
                      key={idx} 
                      cx={xCoord} 
                      cy={yCoord} 
                      r="4.5" 
                      fill="#FFFFFF" 
                      stroke="var(--admin-accent)" 
                      strokeWidth="2.5" 
                      style={{ cursor: 'pointer' }}
                    >
                      <title>₹{p.y}</title>
                    </circle>
                  );
                })}
              </svg>
            </div>
          ) : (
            <div style={{ height: '220px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.45rem', border: '1px dashed var(--admin-border)', borderRadius: '12px', backgroundColor: 'rgba(24, 32, 25, 0.01)' }}>
              <TrendingUp size={24} color="var(--admin-text-muted)" />
              <span style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--admin-text-primary)' }}>No sales data yet</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--admin-text-muted)', fontWeight: '500' }}>Your sales performance will appear here once completed orders are recorded.</span>
            </div>
          )}
        </div>

        {/* Low Stock Alert Card */}
        <div className="admin-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontFamily: 'var(--font-serif)', color: 'var(--admin-text-primary)', fontWeight: '800', margin: 0 }}>Low Stock Alert</h3>
            <p style={{ fontSize: '0.74rem', color: 'var(--admin-text-muted)', margin: '0.15rem 0 1.5rem 0', fontWeight: '500' }}>Inventory requiring attention</p>
            
            {lowStockItems.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {lowStockItems.slice(0, 3).map((p) => (
                  <div key={p._id || p.slug} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '1px solid var(--admin-border)', paddingBottom: '0.75rem' }}>
                    <img src={p.image} alt={p.title} style={{ width: '42px', height: '42px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--admin-border)' }} />
                    <div style={{ flexGrow: 1 }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: '800', color: 'var(--admin-text-primary)', lineHeight: '1.25' }}>{p.title}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--admin-danger)', fontWeight: '750', marginTop: '0.15rem' }}>
                        {p.stock !== undefined ? p.stock : 0} units left
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '2.5rem 1rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--admin-success-bg)', borderRadius: '12px', border: '1px dashed rgba(102, 138, 69, 0.25)' }}>
                <CheckCircle size={28} color="var(--admin-success)" />
                <span style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--admin-text-primary)' }}>✓ Inventory looks healthy</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--admin-text-muted)', fontWeight: '500' }}>No products currently need restocking.</span>
              </div>
            )}
          </div>
          
          <Link 
            to="/admin/products" 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '0.35rem', 
              fontSize: '0.8rem', 
              fontWeight: '800', 
              color: 'var(--admin-accent)', 
              textDecoration: 'none',
              marginTop: '1.5rem',
              borderTop: '1px solid var(--admin-border)',
              paddingTop: '1rem'
            }}
          >
            <span>Manage Inventory</span>
            <ArrowUpRight size={14} />
          </Link>
        </div>
      </div>

      {/* ==================================================
          4. RECENT ORDERS TABLE
         ================================================== */}
      <div className="admin-table-container" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontFamily: 'var(--font-serif)', color: 'var(--admin-text-primary)', fontWeight: '800', margin: 0 }}>Recent Orders</h3>
            <p style={{ fontSize: '0.74rem', color: 'var(--admin-text-muted)', margin: '0.15rem 0 0 0', fontWeight: '500' }}>Latest store checkout activities</p>
          </div>
          
          <Link to="/admin/orders" style={{ fontSize: '0.82rem', color: 'var(--admin-accent)', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.2rem', textDecoration: 'none' }}>
            <span>View All Orders</span>
            <ArrowUpRight size={14} />
          </Link>
        </div>

        {stats?.recentOrders && stats.recentOrders.length > 0 ? (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Order Status</th>
                <th>Date</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentOrders.slice(0, 5).map((o) => (
                <tr key={o.orderId}>
                  <td style={{ fontFamily: 'monospace', fontWeight: '800', color: 'var(--admin-text-primary)' }}>{o.orderId}</td>
                  <td>
                    <div style={{ fontWeight: '750', color: 'var(--admin-text-primary)' }}>{o.customerName}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--admin-text-muted)' }}>{o.phone}</div>
                  </td>
                  <td style={{ fontWeight: '800', color: 'var(--admin-text-primary)' }}>₹{o.totalAmount}</td>
                  <td>
                    <span className={`admin-badge ${o.paymentStatus === 'Paid' ? 'admin-badge-success' : 'admin-badge-danger'}`}>
                      {o.paymentStatus}
                    </span>
                  </td>
                  <td>
                    <span className="admin-badge admin-badge-warning">
                      {o.orderStatus}
                    </span>
                  </td>
                  <td style={{ color: 'var(--admin-text-muted)', fontSize: '0.78rem', fontWeight: '600' }}>
                    {new Date(o.createdAt).toLocaleDateString('en-IN')}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <Link 
                      to="/admin/orders" 
                      style={{ 
                        fontSize: '0.8rem', 
                        fontWeight: '800', 
                        color: 'var(--admin-accent)', 
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.15rem'
                      }}
                    >
                      <span>View</span>
                      <ChevronRight size={14} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--admin-text-muted)', fontSize: '0.85rem', fontWeight: '600' }}>
            No recent orders registered yet.
          </div>
        )}
      </div>

      {/* ==================================================
          5. QUICK ACTIONS
         ================================================== */}
      <div>
        <h3 style={{ fontSize: '0.8rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--admin-text-muted)', marginBottom: '0.75rem', marginTop: 0 }}>
          Quick Actions
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
          {[
            { label: 'Add Product', desc: 'Add a new product to your MILASTY store →', path: '/admin/products/add', icon: Plus },
            { label: 'Manage Orders', desc: 'Verify store sales and full order logs →', path: '/admin/orders', icon: ShoppingBag },
            { label: 'Manage Customers', desc: 'Review registered accounts list →', path: '/admin/customers', icon: Users },
            { label: 'Create Coupon', desc: 'Configure promotional discount codes →', path: '/admin/coupons', icon: Ticket },
          ].map(act => {
            const Icon = act.icon;
            return (
              <Link 
                key={act.label} 
                to={act.path}
                className="admin-card admin-card-hover"
                style={{ 
                  textDecoration: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.65rem'
                }}
              >
                <div style={{ width: '34px', height: '34px', borderRadius: '8px', backgroundColor: 'rgba(117, 139, 69, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--admin-accent)' }}>
                  <Icon size={16} />
                </div>
                <div>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--admin-text-primary)', margin: '0.25rem 0 0.15rem 0' }}>{act.label}</h4>
                  <p style={{ fontSize: '0.72rem', color: 'var(--admin-text-muted)', margin: 0, fontWeight: '500', lineHeight: '1.3' }}>{act.desc}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ==================================================
          6. RECENT ACTIVITY & STORE HEALTH (Grid Layout)
         ================================================== */}
      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
          gap: '1.5rem',
          marginBottom: '1.5rem'
        }}
        className="admin-dashboard-footer-row"
      >
        <style>{`
          @media (min-width: 1024px) {
            .admin-dashboard-footer-row {
              grid-template-columns: 1fr 1fr !important;
            }
          }
        `}</style>

        {/* Recent Activity Card */}
        <div className="admin-card">
          <h3 style={{ fontSize: '1.1rem', fontFamily: 'var(--font-serif)', color: 'var(--admin-text-primary)', fontWeight: '800', marginBottom: '0.25rem', marginTop: 0 }}>Recent Activity</h3>
          <p style={{ fontSize: '0.74rem', color: 'var(--admin-text-muted)', margin: '0 0 1.5rem 0', fontWeight: '500' }}>Live store event history log</p>

          {activityEvents.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {activityEvents.map((act, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '0.75rem', borderBottom: idx !== activityEvents.length - 1 ? '1px solid var(--admin-border)' : 'none', paddingBottom: '0.75rem' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'rgba(117, 139, 69, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--admin-accent)', flexShrink: 0 }}>
                    <Activity size={12} />
                  </div>
                  <div style={{ flexGrow: 1 }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: '800', color: 'var(--admin-text-primary)' }}>{act.title}</div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--admin-text-muted)', marginTop: '0.15rem', fontWeight: '500' }}>{act.desc}</div>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--admin-text-muted)', fontWeight: '600', flexShrink: 0 }}>{act.time}</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--admin-text-muted)', fontSize: '0.82rem', fontWeight: '600' }}>
              No recent activity log.
            </div>
          )}
        </div>

        {/* Store Health Card */}
        <div className="admin-card">
          <h3 style={{ fontSize: '1.1rem', fontFamily: 'var(--font-serif)', color: 'var(--admin-text-primary)', fontWeight: '800', marginBottom: '0.25rem', marginTop: 0 }}>Store Health</h3>
          <p style={{ fontSize: '0.74rem', color: 'var(--admin-text-muted)', margin: '0 0 1.5rem 0', fontWeight: '500' }}>Database connection and component status</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--admin-border)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Package size={15} color="var(--admin-text-muted)" />
                <span style={{ fontSize: '0.82rem', fontWeight: '750', color: 'var(--admin-text-primary)' }}>Product Catalog Status</span>
              </div>
              <span className={`admin-badge ${isCatalogConnected ? 'admin-badge-success' : 'admin-badge-danger'}`}>
                {isCatalogConnected ? 'Active' : 'Offline'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--admin-border)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={15} color="var(--admin-text-muted)" />
                <span style={{ fontSize: '0.82rem', fontWeight: '750', color: 'var(--admin-text-primary)' }}>Customer Accounts Registry</span>
              </div>
              <span className={`admin-badge ${isCustomersConnected ? 'admin-badge-success' : 'admin-badge-danger'}`}>
                {isCustomersConnected ? 'Connected' : 'Offline'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--admin-border)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShoppingBag size={15} color="var(--admin-text-muted)" />
                <span style={{ fontSize: '0.82rem', fontWeight: '750', color: 'var(--admin-text-primary)' }}>Order Fulfillment Gateway</span>
              </div>
              <span className={`admin-badge ${isOrdersConnected ? 'admin-badge-success' : 'admin-badge-danger'}`}>
                {isOrdersConnected ? 'Connected' : 'Offline'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MessageSquare size={15} color="var(--admin-text-muted)" />
                <span style={{ fontSize: '0.82rem', fontWeight: '750', color: 'var(--admin-text-primary)' }}>Review Moderation Gateway</span>
              </div>
              <span className={`admin-badge ${isReviewsConnected ? 'admin-badge-success' : 'admin-badge-danger'}`}>
                {isReviewsConnected ? 'Active' : 'Offline'}
              </span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
