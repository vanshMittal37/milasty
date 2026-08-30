import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  DollarSign, Package, ShoppingBag, Users, AlertTriangle, ArrowUpRight, 
  Plus, RefreshCw, Layers, ShieldCheck, Award, Star, Ticket, Edit3, CheckCircle,
  TrendingUp, Calendar, ChevronRight, Activity, MessageSquare
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
        <RefreshCw size={28} className="animate-spin" color="var(--primary-dark)" />
        <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)', fontWeight: '700', letterSpacing: '0.04em' }}>LOADING STORE PERFORMANCE ANALYTICS...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', gap: '1.5rem', padding: '2rem', textAlign: 'center' }}>
        <ShieldCheck size={48} color="var(--accent-terracotta)" />
        <div>
          <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-serif)', color: 'var(--primary-dark)', fontWeight: '800', marginBottom: '0.5rem' }}>Unable to load dashboard data</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>Please check your internet connection or server status and try again.</p>
        </div>
        <button 
          onClick={fetchDashboardData} 
          className="btn-primary" 
          style={{ padding: '0.75rem 1.75rem', borderRadius: '10px', fontSize: '0.85rem', fontWeight: '800', backgroundColor: 'var(--primary-dark)', color: '#FFFFFF', border: 'none', cursor: 'pointer' }}
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* ==================================================
          1. DASHBOARD HEADER
         ================================================== */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--admin-border)' }}>
        <div>
          <h1 style={{ fontSize: '2.1rem', fontFamily: 'var(--font-serif)', color: 'var(--admin-text-primary)', fontWeight: '800', margin: '0 0 0.35rem 0' }}>
            {timeOfDay}, Admin 👋
          </h1>
          <p style={{ color: 'var(--admin-text-muted)', fontSize: '0.88rem', margin: 0, fontWeight: '500' }}>
            Monitor your store performance, orders, inventory and customers from one place.
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
            <span>Add New Product</span>
          </Link>
        </div>
      </div>

      {/* ==================================================
          2. STORE OVERVIEW SECTION (4 KPI Cards in one Row)
         ================================================== */}
      <div>
        <h3 style={{ fontSize: '1rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--primary-dark)', marginBottom: '1rem', marginTop: 0 }}>
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
                <span style={{ fontSize: '0.74rem', color: 'var(--admin-text-muted)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Revenue</span>
                <div style={{ fontSize: '1.85rem', fontWeight: '900', color: 'var(--admin-text-primary)', letterSpacing: '-0.02em', marginTop: '0.35rem' }}>
                  ₹{stats?.totalRevenue || 0}
                </div>
              </div>
              <div style={{ padding: '0.5rem', borderRadius: '10px', backgroundColor: 'rgba(185, 205, 148, 0.12)', color: 'var(--admin-accent-light)' }}>
                <DollarSign size={18} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--admin-border)', paddingTop: '0.65rem' }}>
              <span style={{ fontSize: '0.74rem', color: 'var(--admin-accent-gold)', fontWeight: '750' }}>Captured sales</span>
              <span style={{ fontSize: '0.68rem', color: 'var(--admin-text-muted)', fontWeight: '600' }}>Current period</span>
            </div>
          </div>

          {/* Card 2: Total Orders */}
          <div className="admin-card admin-card-hover" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '145px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '0.74rem', color: 'var(--admin-text-muted)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Orders</span>
                <div style={{ fontSize: '1.85rem', fontWeight: '900', color: 'var(--admin-text-primary)', letterSpacing: '-0.02em', marginTop: '0.35rem' }}>
                  {stats?.totalOrders || 0}
                </div>
              </div>
              <div style={{ padding: '0.5rem', borderRadius: '10px', backgroundColor: 'rgba(185, 205, 148, 0.12)', color: 'var(--admin-accent-light)' }}>
                <ShoppingBag size={18} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--admin-border)', paddingTop: '0.65rem' }}>
              <span style={{ fontSize: '0.74rem', color: 'var(--admin-text-secondary)', fontWeight: '750' }}>
                {stats?.pendingOrders || 0} Pending
              </span>
              <span style={{ fontSize: '0.74rem', color: 'var(--admin-text-muted)', fontWeight: '750' }}>
                {stats?.deliveredOrders || 0} Delivered
              </span>
            </div>
          </div>

          {/* Card 3: Low Stock Alert */}
          <div className="admin-card admin-card-hover" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '145px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '0.74rem', color: 'var(--admin-text-muted)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Low Stock Alert</span>
                <div style={{ fontSize: '1.85rem', fontWeight: '900', color: lowStockItems.length > 0 ? '#FF8A80' : 'var(--admin-text-primary)', letterSpacing: '-0.02em', marginTop: '0.35rem' }}>
                  {lowStockItems.length}
                </div>
              </div>
              <div style={{ padding: '0.5rem', borderRadius: '10px', backgroundColor: lowStockItems.length > 0 ? 'var(--admin-danger-bg)' : 'rgba(255, 255, 255, 0.05)', color: lowStockItems.length > 0 ? '#FF8A80' : 'var(--admin-text-muted)' }}>
                <AlertTriangle size={18} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--admin-border)', paddingTop: '0.65rem' }}>
              <span style={{ fontSize: '0.74rem', color: lowStockItems.length > 0 ? '#FF8A80' : 'var(--admin-text-muted)', fontWeight: '750' }}>
                {lowStockItems.length > 0 ? 'Action Required' : 'Stock Optimal'}
              </span>
              <span style={{ fontSize: '0.68rem', color: 'var(--admin-text-muted)', fontWeight: '600' }}>Threshold ≤ 5</span>
            </div>
          </div>

          {/* Card 4: Total Customers */}
          <div className="admin-card admin-card-hover" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '145px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '0.74rem', color: 'var(--admin-text-muted)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Customers</span>
                <div style={{ fontSize: '1.85rem', fontWeight: '900', color: 'var(--admin-text-primary)', letterSpacing: '-0.02em', marginTop: '0.35rem' }}>
                  {stats?.totalCustomers || 0}
                </div>
              </div>
              <div style={{ padding: '0.5rem', borderRadius: '10px', backgroundColor: 'rgba(185, 205, 148, 0.12)', color: 'var(--admin-accent-light)' }}>
                <Users size={18} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--admin-border)', paddingTop: '0.65rem' }}>
              <span style={{ fontSize: '0.74rem', color: 'var(--admin-accent-gold)', fontWeight: '750' }}>Registered Users</span>
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
        <div 
          className="glass-card" 
          style={{ 
            padding: '2rem', 
            backgroundColor: 'rgba(50, 26, 18, 0.60)', 
            borderRadius: '16px', 
            border: '1px solid rgba(245, 235, 221, 0.25)',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontFamily: 'var(--font-serif)', color: 'var(--text-light)', fontWeight: '800', margin: 0 }}>Sales Overview</h3>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: '0.15rem 0 0 0', fontWeight: '500' }}>Revenue performance over time</p>
            </div>
            
            <div style={{ display: 'flex', gap: '0.35rem', backgroundColor: 'rgba(255,255,255,0.03)', padding: '0.25rem', borderRadius: '8px', border: '1px solid rgba(245, 235, 221, 0.15)' }}>
              {['7 Days', '30 Days', '3 Months', '1 Year'].map(range => (
                <button 
                  key={range} 
                  onClick={() => setActiveRange(range)}
                  style={{ 
                    border: 'none', 
                    background: range === activeRange ? 'rgba(255, 255, 255, 0.05)' : 'none', 
                    color: range === activeRange ? 'var(--accent-gold)' : 'var(--text-muted)', 
                    fontSize: '0.7rem', 
                    padding: '0.35rem 0.75rem', 
                    borderRadius: '6px', 
                    fontWeight: '800',
                    cursor: 'pointer',
                    boxShadow: range === activeRange ? 'var(--shadow-sm)' : 'none',
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
                    <stop offset="0%" stopColor="var(--accent-gold)" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="var(--accent-gold)" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                
                {/* Horizontal Grid lines */}
                {[0, 50, 100, 150].map((yVal) => (
                  <line key={yVal} x1="0" y1={yVal} x2="500" y2={yVal} stroke="rgba(245, 235, 221, 0.1)" strokeWidth="1" strokeDasharray="4 4" />
                ))}

                {/* Line Path */}
                <path
                  d={chartPoints.reduce((acc, p, idx) => {
                    const xCoord = (idx / (chartPoints.length - 1 || 1)) * 500;
                    const yCoord = 180 - (p.y / maxVal) * 150;
                    return acc + `${idx === 0 ? 'M' : 'L'} ${xCoord} ${yCoord}`;
                  }, '')}
                  fill="none"
                  stroke="var(--accent-gold)" 
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
                      fill="#24130D" 
                      stroke="var(--accent-gold)" 
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
            <div style={{ height: '220px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.45rem', border: '1px dashed rgba(245, 235, 221, 0.25)', borderRadius: '12px', backgroundColor: 'rgba(255, 255, 255, 0.03)' }}>
              <TrendingUp size={24} color="var(--text-muted)" />
              <span style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-light)' }}>No sales data yet</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '500' }}>Your sales performance will appear here once completed orders are recorded.</span>
            </div>
          )}
        </div>

        {/* Low Stock Alert Card */}
        <div 
          className="glass-card" 
          style={{ 
            padding: '2rem', 
            backgroundColor: 'rgba(50, 26, 18, 0.60)', 
            borderRadius: '16px', 
            border: '1px solid rgba(245, 235, 221, 0.25)', 
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <h3 style={{ fontSize: '1.15rem', fontFamily: 'var(--font-serif)', color: 'var(--text-light)', fontWeight: '800', margin: 0 }}>Low Stock Alert</h3>
            <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: '0.15rem 0 1.5rem 0', fontWeight: '500' }}>Inventory requiring attention</p>
            
            {lowStockItems.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {lowStockItems.slice(0, 3).map((p) => (
                  <div key={p._id || p.slug} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '1px solid rgba(245, 235, 221, 0.15)', paddingBottom: '0.75rem' }}>
                    <img src={p.image} alt={p.title} style={{ width: '42px', height: '42px', objectFit: 'cover', borderRadius: '8px', border: '1px solid rgba(245, 235, 221, 0.15)' }} />
                    <div style={{ flexGrow: 1 }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: '800', color: 'var(--text-light)', lineHeight: '1.25' }}>{p.title}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--accent-terracotta)', fontWeight: '750', marginTop: '0.15rem' }}>
                        {p.stock !== undefined ? p.stock : 0} units left
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '2.5rem 1rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', backgroundColor: 'rgba(39, 76, 55, 0.02)', borderRadius: '12px', border: '1.5px dashed rgba(39, 76, 55, 0.15)' }}>
                <CheckCircle size={28} color="var(--accent-gold)" />
                <span style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-light)' }}>✓ Inventory looks healthy</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '500' }}>No products currently need restocking.</span>
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
              color: 'var(--accent-gold)', 
              textDecoration: 'none',
              marginTop: '1.5rem',
              borderTop: '1px solid rgba(245, 235, 221, 0.15)',
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
         ========================================      <div className="glass-card" style={{ padding: '2rem', backgroundColor: 'rgba(50, 26, 18, 0.60)', borderRadius: '16px', border: '1px solid rgba(245, 235, 221, 0.25)', boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontFamily: 'var(--font-serif)', color: 'var(--text-light)', fontWeight: '800', margin: 0 }}>Recent Orders</h3>
            <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: '0.15rem 0 0 0', fontWeight: '500' }}>Latest store checkout activities</p>
          </div>
          
          <Link to="/admin/orders" style={{ fontSize: '0.82rem', color: 'var(--accent-gold)', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.2rem', textDecoration: 'none' }}>
            <span>View All Orders</span>
            <ArrowUpRight size={14} />
          </Link>
        </div>

        {stats?.recentOrders && stats.recentOrders.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1.5px solid rgba(245, 235, 221, 0.15)', color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: '800' }}>Order ID</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: '800' }}>Customer</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: '800' }}>Total</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: '800' }}>Payment</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: '800' }}>Order Status</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: '800' }}>Date</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'right', fontWeight: '800' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentOrders.slice(0, 5).map((o) => (
                  <tr key={o.orderId} style={{ borderBottom: '1px solid rgba(245, 235, 221, 0.15)' }}>
                    <td style={{ padding: '1rem', fontWeight: '800', color: 'var(--text-light)' }}>{o.orderId}</td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: '750', color: 'var(--text-light)' }}>{o.customerName}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{o.phone}</div>
                    </td>
                    <td style={{ padding: '1rem', fontWeight: '800', color: 'var(--text-light)' }}>₹{o.totalAmount}</td>
                    <td style={{ padding: '1rem' }}>
                      <span 
                        style={{ 
                          fontSize: '0.7rem',
                          fontWeight: '800',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                          backgroundColor: o.paymentStatus === 'Paid' ? 'rgba(39, 76, 55, 0.08)' : 'rgba(217, 83, 79, 0.08)', 
                          color: o.paymentStatus === 'Paid' ? 'var(--accent-gold)' : 'var(--accent-terracotta)',
                          padding: '0.25rem 0.6rem',
                          borderRadius: '6px'
                        }}
                      >
                        {o.paymentStatus}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span 
                        style={{ 
                          fontSize: '0.7rem',
                          fontWeight: '800',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                          backgroundColor: 'rgba(197, 160, 89, 0.08)',
                          color: 'var(--accent-gold)',
                          padding: '0.25rem 0.6rem',
                          borderRadius: '6px'
                        }}
                      >
                        {o.orderStatus}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: '600' }}>
                      {new Date(o.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <Link 
                        to="/admin/orders" 
                        style={{ 
                          fontSize: '0.8rem', 
                          fontWeight: '800', 
                          color: 'var(--accent-gold)', 
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
          </div>
        ) : (
          <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600' }}>
            No recent orders registered yet.
          </div>
        )}
      </div>

      {/* ==================================================
          5. QUICK ACTIONS
         ================================================== */}
      <div>
        <h3 style={{ fontSize: '1rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-light)', marginBottom: '1rem', marginTop: 0 }}>
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
                style={{ 
                  backgroundColor: 'rgba(50, 26, 18, 0.60)', 
                  borderRadius: '16px', 
                  border: '1px solid rgba(245, 235, 221, 0.25)', 
                  padding: '1.5rem',
                  textDecoration: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.65rem',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
                }}
                className="admin-action-card"
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.2)';
                }}
              >
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-gold)' }}>
                  <Icon size={16} />
                </div>
                <div>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-light)', margin: '0.25rem 0 0.15rem 0' }}>{act.label}</h4>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0, fontWeight: '500', lineHeight: '1.3' }}>{act.desc}</p>
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
        <div 
          className="glass-card" 
          style={{ 
            padding: '2rem', 
            backgroundColor: 'rgba(50, 26, 18, 0.60)', 
            borderRadius: '16px', 
            border: '1px solid rgba(245, 235, 221, 0.25)',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
          }}
        >
          <h3 style={{ fontSize: '1.15rem', fontFamily: 'var(--font-serif)', color: 'var(--text-light)', fontWeight: '800', marginBottom: '0.25rem', marginTop: 0 }}>Recent Activity</h3>
          <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: '0 0 1.5rem 0', fontWeight: '500' }}>Live store event history log</p>

          {activityEvents.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {activityEvents.map((act, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '0.75rem', borderBottom: idx !== activityEvents.length - 1 ? '1px solid rgba(245, 235, 221, 0.15)' : 'none', paddingBottom: '0.75rem' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'rgba(255, 255, 255, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-gold)', flexShrink: 0 }}>
                    <Activity size={12} />
                  </div>
                  <div style={{ flexGrow: 1 }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: '800', color: 'var(--text-light)' }}>{act.title}</div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.15rem', fontWeight: '500' }}>{act.desc}</div>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '600', flexShrink: 0 }}>{act.time}</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: '600' }}>
              No recent activity log.
            </div>
          )}
        </div>

        {/* Store Health Card */}
        <div 
          className="glass-card" 
          style={{ 
            padding: '2rem', 
            backgroundColor: 'rgba(50, 26, 18, 0.60)', 
            borderRadius: '16px', 
            border: '1px solid rgba(245, 235, 221, 0.25)',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
          }}
        >
          <h3 style={{ fontSize: '1.15rem', fontFamily: 'var(--font-serif)', color: 'var(--text-light)', fontWeight: '800', marginBottom: '0.25rem', marginTop: 0 }}>Store Health</h3>
          <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: '0 0 1.5rem 0', fontWeight: '500' }}>Database connection and component status</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(245, 235, 221, 0.15)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Package size={15} color="var(--text-muted)" />
                <span style={{ fontSize: '0.82rem', fontWeight: '750', color: 'var(--text-light)' }}>Product Catalog Status</span>
              </div>
              <span style={{ fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.04em', backgroundColor: isCatalogConnected ? 'rgba(39, 76, 55, 0.08)' : 'rgba(217, 83, 79, 0.08)', color: isCatalogConnected ? 'var(--accent-gold)' : 'var(--accent-terracotta)', padding: '0.25rem 0.6rem', borderRadius: '6px' }}>
                {isCatalogConnected ? 'Active' : 'Offline'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(245, 235, 221, 0.15)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={15} color="var(--text-muted)" />
                <span style={{ fontSize: '0.82rem', fontWeight: '750', color: 'var(--text-light)' }}>Customer Accounts Registry</span>
              </div>
              <span style={{ fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.04em', backgroundColor: isCustomersConnected ? 'rgba(39, 76, 55, 0.08)' : 'rgba(217, 83, 79, 0.08)', color: isCustomersConnected ? 'var(--accent-gold)' : 'var(--accent-terracotta)', padding: '0.25rem 0.6rem', borderRadius: '6px' }}>
                {isCustomersConnected ? 'Connected' : 'Offline'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(245, 235, 221, 0.15)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShoppingBag size={15} color="var(--text-muted)" />
                <span style={{ fontSize: '0.82rem', fontWeight: '750', color: 'var(--text-light)' }}>Order Fulfillment Gateway</span>
              </div>
              <span style={{ fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.04em', backgroundColor: isOrdersConnected ? 'rgba(39, 76, 55, 0.08)' : 'rgba(217, 83, 79, 0.08)', color: isOrdersConnected ? 'var(--accent-gold)' : 'var(--accent-terracotta)', padding: '0.25rem 0.6rem', borderRadius: '6px' }}>
                {isOrdersConnected ? 'Connected' : 'Offline'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MessageSquare size={15} color="var(--text-muted)" />
                <span style={{ fontSize: '0.82rem', fontWeight: '750', color: 'var(--text-light)' }}>Review Moderation Gateway</span>
              </div>
              <span style={{ fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.04em', backgroundColor: isReviewsConnected ? 'rgba(39, 76, 55, 0.08)' : 'rgba(217, 83, 79, 0.08)', color: isReviewsConnected ? 'var(--accent-gold)' : 'var(--accent-terracotta)', padding: '0.25rem 0.6rem', borderRadius: '6px' }}>
                {isReviewsConnected ? 'Active' : 'Offline'}
              </span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
