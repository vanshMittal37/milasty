import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  DollarSign, Package, ShoppingBag, Users, AlertTriangle, ArrowUpRight, 
  Plus, RefreshCw, CheckCircle, TrendingUp, ChevronRight, MessageSquare, Ticket, AlertCircle, XCircle
} from 'lucide-react';
import api from '../../api/axios';
import { LOW_STOCK_THRESHOLD } from '../../config/constants';

// Same rules as GET /orders/admin/analytics: revenue = paid & not cancelled, or COD once delivered.
// Days are Indian calendar days.
function buildDashboardFromOrders(orders) {
  const lower = (v) => String(v || '').toLowerCase();
  const created = (o) => o.created_at || o.createdAt;
  const total = (o) => Number(o.grand_total ?? o.grandTotal ?? o.totalAmount ?? 0);
  const method = (o) => lower(o.payment_method || o.rawPaymentMethod);
  const payStatus = (o) => lower(o.payment_status || o.paymentStatus);
  const orderStatus = (o) => lower(o.order_status || o.orderStatus).replace(/\s+/g, '_');

  const isRevenue = (o) => {
    if (orderStatus(o) === 'cancelled') return false;
    if (payStatus(o) === 'paid') return true;
    return method(o) === 'cod' && orderStatus(o) === 'delivered';
  };
  const dayKey = (d) => new Date(d).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  const byDay = new Map();
  orders.filter((o) => created(o) && isRevenue(o)).forEach((o) => {
    const k = dayKey(created(o));
    const cur = byDay.get(k) || { revenue: 0, orders: 0 };
    cur.revenue += total(o);
    cur.orders += 1;
    byDay.set(k, cur);
  });
  const today = dayKey(Date.now());
  const shift = (key, delta) => { const d = new Date(`${key}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + delta); return d.toISOString().slice(0, 10); };
  const label = (key) => new Date(`${key}T12:00:00Z`).toLocaleDateString('en-IN', { timeZone: 'UTC', day: 'numeric', month: 'short' });
  const r2 = (n) => Math.round(n * 100) / 100;
  const daily = (n) => Array.from({ length: n }, (_, i) => {
    const key = shift(today, i - (n - 1));
    const v = byDay.get(key) || { revenue: 0, orders: 0 };
    return { key, label: label(key), revenue: r2(v.revenue), orders: v.orders };
  });
  const weekly = Array.from({ length: 13 }, (_, w) => {
    const end = shift(today, -7 * (12 - w));
    let revenue = 0; let count = 0;
    for (let d = 0; d < 7; d++) { const v = byDay.get(shift(end, -d)); if (v) { revenue += v.revenue; count += v.orders; } }
    return { key: end, label: `w/e ${label(end)}`, revenue: r2(revenue), orders: count };
  });

  const title = (s) => String(s || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const recentOrders = [...orders]
    .filter((o) => created(o))
    .sort((a, b) => new Date(created(b)) - new Date(created(a)))
    .slice(0, 6)
    .map((o) => ({
      id: o.id,
      orderId: o.order_number || o.orderNumber || o.orderId,
      customerName: o.customerName || o.customer_name || 'Customer',
      phone: o.customerPhone || o.customer_phone || '',
      totalAmount: total(o),
      paymentStatus: method(o) === 'cod' && payStatus(o) !== 'paid' ? 'COD' : title(payStatus(o) || 'pending'),
      orderStatus: title(orderStatus(o) || 'confirmed'),
      createdAt: created(o),
    }));

  return {
    totalRevenue: r2(orders.filter(isRevenue).reduce((s, o) => s + total(o), 0)),
    recentOrders,
    salesSeries: { '7 Days': daily(7), '30 Days': daily(30), '3 Months': weekly },
  };
}

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
      let statsData = statsRes.data || {};
      // Older backends don't send the sales series / recent orders — build them from the Orders Log data
      if (!statsData.salesSeries || !Array.isArray(statsData.recentOrders)) {
        try {
          const ordersRes = await api.get('/orders/admin/all');
          statsData = { ...statsData, ...buildDashboardFromOrders(Array.isArray(ordersRes.data) ? ordersRes.data : []) };
        } catch (fallbackErr) {
          console.warn('Dashboard fallback (orders list) failed:', fallbackErr.message);
        }
      }
      setStats(statsData);
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
        <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(143,175,91,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <RefreshCw size={20} className="animate-spin" color="#C68A3A" />
        </div>
        <span style={{ fontSize: '0.78rem', color: '#665A52', fontWeight: '700', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Loading analytics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', gap: '1.25rem', padding: '2rem', textAlign: 'center', margin: '0 auto', maxWidth: '520px' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#FEECEC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <AlertTriangle size={24} color="#C62828" />
        </div>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontFamily: 'var(--font-serif)', color: '#21150F', fontWeight: '800', marginBottom: '0.4rem' }}>Unable to load dashboard</h3>
          <p style={{ fontSize: '0.84rem', color: '#4A3B2E', margin: 0, lineHeight: '1.5' }}>Check your connection or server status and try again.</p>
        </div>
        <button onClick={fetchDashboardData} className="admin-btn-primary">
          <RefreshCw size={14} />
          Try Again
        </button>
      </div>
    );
  }

  // Parse products & variants for exact stock alerts
  const lowStockItems = [];
  const outOfStockItems = [];

  products.forEach((p) => {
    const hasVariants = Array.isArray(p.variants) && p.variants.length > 0;
    if (hasVariants) {
      p.variants.forEach((v) => {
        const vStock = Number(v.stock !== undefined && v.stock !== null ? v.stock : (v.in_stock ? 50 : 0));
        const item = {
          productId: p._id || p.slug,
          title: p.title,
          variantName: v.name || v.weight || 'Variant',
          weight: v.weight || '',
          price: v.price || p.price,
          stock: vStock,
          image: p.image,
        };
        if (vStock === 0) {
          outOfStockItems.push(item);
        } else if (vStock <= LOW_STOCK_THRESHOLD) {
          lowStockItems.push(item);
        }
      });
    } else {
      const pStock = Number(p.stock !== undefined && p.stock !== null ? p.stock : 0);
      const item = {
        productId: p._id || p.slug,
        title: p.title,
        variantName: null,
        weight: '',
        price: p.price,
        stock: pStock,
        image: p.image,
      };
      if (pStock === 0) {
        outOfStockItems.push(item);
      } else if (pStock <= LOW_STOCK_THRESHOLD) {
        lowStockItems.push(item);
      }
    }
  });

  lowStockItems.sort((a, b) => a.stock - b.stock);
  outOfStockItems.sort((a, b) => a.stock - b.stock);

  const isCatalogConnected = !error && Array.isArray(products);
  const isCustomersConnected = !error && stats !== null;
  const isOrdersConnected = !error && stats !== null;
  const isReviewsConnected = !error && Array.isArray(reviews);

  // Real revenue per day (7 / 30 days) or per week (3 months), from /orders/admin/analytics
  const series = stats?.salesSeries?.[activeRange] || [];
  const periodRevenue = series.reduce((sum, b) => sum + b.revenue, 0);
  const periodOrders = series.reduce((sum, b) => sum + b.orders, 0);
  const hasSales = periodOrders > 0;
  const maxVal = Math.max(...series.map((b) => b.revenue), 1);
  const labelEvery = series.length > 14 ? 5 : series.length > 8 ? 2 : 1;
  const inr = (v) => `Rs.${Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

  const kpiData = [
    {
      label: 'Total Revenue',
      value: `Rs.${(stats?.totalRevenue || 0).toLocaleString('en-IN')}`,
      sub: 'Collected sales',
      sub2: 'Paid + delivered COD',
      icon: DollarSign,
      color: '#C68A3A',
      bg: 'rgba(245, 237, 229, 0.7)',
      topColor: '#C68A3A',
    },
    {
      label: 'Total Products',
      value: products.length,
      sub: `${products.length} Catalog Items`,
      sub2: 'Live in store',
      icon: Package,
      color: '#3B82F6',
      bg: 'rgba(59,130,246,0.12)',
      topColor: '#3B82F6',
    },
    {
      label: 'Low Stock Variants',
      value: lowStockItems.length,
      sub: lowStockItems.length > 0 ? `${lowStockItems.length} Need Restock` : 'Stock Optimal',
      sub2: `Threshold <= ${LOW_STOCK_THRESHOLD} units`,
      icon: AlertTriangle,
      color: lowStockItems.length > 0 ? '#F59E0B' : '#C68A3A',
      bg: lowStockItems.length > 0 ? 'rgba(245,158,11,0.12)' : 'rgba(198,138,58,0.12)',
      topColor: lowStockItems.length > 0 ? '#F59E0B' : '#C68A3A',
    },
    {
      label: 'Out of Stock Variants',
      value: outOfStockItems.length,
      sub: outOfStockItems.length > 0 ? `${outOfStockItems.length} Unavailable` : 'All Available',
      sub2: 'Stock = 0 units',
      icon: XCircle,
      color: outOfStockItems.length > 0 ? '#C62828' : '#2E7D32',
      bg: outOfStockItems.length > 0 ? '#FEECEC' : '#EDF7EE',
      topColor: outOfStockItems.length > 0 ? '#C62828' : '#2E7D32',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

      {/* -€-€ HEADER -€-€ */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <p style={{ fontSize: '0.68rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.07em', color: '#C68A3A', margin: '0 0 0.3rem 0' }}>
            {timeOfDay} ðŸ‘‹
          </p>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontWeight: '800', color: '#21150F', margin: 0, lineHeight: '1.25' }}>
            Store Performance Overview
          </h2>
          <p style={{ fontSize: '0.8rem', color: '#665A52', margin: '0.3rem 0 0 0', fontWeight: '500' }}>
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

      {/* -€-€ KPI CARDS -€-€ */}
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
                background: 'rgba(255, 255, 255, 0.88)',
                border: '1px solid #E5D9CE',
                borderTop: `4px solid ${k.topColor}`,
                borderRadius: '16px',
                padding: '1.25rem 1.35rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.85rem',
                boxShadow: '0 4px 20px rgba(90, 46, 22, 0.06)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                cursor: 'default'
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(90, 46, 22, 0.12)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 20px rgba(90, 46, 22, 0.06)'; }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '0.68rem', color: '#665A52', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{k.label}</span>
                <div style={{ padding: '0.5rem', borderRadius: '10px', backgroundColor: k.bg, color: k.color }}>
                  <Icon size={18} />
                </div>
              </div>
              <div style={{ fontSize: '2rem', fontFamily: 'var(--font-serif)', fontWeight: '900', color: '#21150F', letterSpacing: '-0.03em', lineHeight: '1' }}>
                {k.value}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E7DED5', paddingTop: '0.65rem' }}>
                <span style={{ fontSize: '0.75rem', color: k.color, fontWeight: '800' }}>{k.sub}</span>
                <span style={{ fontSize: '0.72rem', color: '#888888', fontWeight: '600' }}>{k.sub2}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* -€-€ SALES CHART + LOW STOCK -€-€ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }} className="admin-dashboard-split">
        <style>{`
          @media (min-width: 1024px) { .admin-dashboard-split { grid-template-columns: 2fr 1fr !important; } }
        `}</style>

        {/* Sales Chart */}
        <div className="admin-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontFamily: 'var(--font-serif)', color: '#21150F', fontWeight: '800', margin: 0 }}>Sales Overview</h3>
              <p style={{ fontSize: '0.78rem', color: '#665A52', margin: '0.2rem 0 0', fontWeight: '500' }}>Revenue performance over time</p>
            </div>
            <div style={{ display: 'flex', gap: '0.35rem', backgroundColor: 'rgba(245,237,229,0.8)', padding: '0.25rem', borderRadius: '8px', border: '1px solid rgba(231,222,213,0.7)' }}>
              {['7 Days', '30 Days', '3 Months'].map(range => (
                <button
                  key={range}
                  onClick={() => setActiveRange(range)}
                  style={{
                    border: 'none',
                    background: range === activeRange ? 'linear-gradient(135deg, #5A2E16, #7C3D20)' : 'transparent',
                    color: range === activeRange ? '#FFFFFF' : '#665A52',
                    fontSize: '0.72rem', padding: '0.35rem 0.75rem',
                    borderRadius: '6px', fontWeight: '800',
                    cursor: 'pointer', transition: 'all 0.15s',
                    boxShadow: range === activeRange ? '0 2px 8px rgba(90,46,22,0.2)' : 'none',
                  }}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          {/* Period summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
            {[
              ['Revenue', inr(periodRevenue)],
              ['Orders', periodOrders],
              ['Avg. order', periodOrders ? inr(periodRevenue / periodOrders) : '—'],
            ].map(([label, value]) => (
              <div key={label} style={{ background: 'rgba(245,237,229,0.55)', border: '1px solid rgba(231,222,213,0.7)', borderRadius: '10px', padding: '0.6rem 0.8rem' }}>
                <div style={{ fontSize: '0.66rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#665A52' }}>{label}</div>
                <div style={{ fontSize: '1.1rem', fontWeight: '900', color: '#21150F', fontFamily: 'var(--font-serif)' }}>{value}</div>
              </div>
            ))}
          </div>

          {hasSales ? (
            <div style={{ width: '100%' }}>
              <svg viewBox="0 0 600 210" width="100%" height="220" preserveAspectRatio="none" role="img" aria-label={`Revenue for the last ${activeRange}`}>
                {[0, 0.25, 0.5, 0.75, 1].map((f) => (
                  <line key={f} x1="0" x2="600" y1={180 - f * 165} y2={180 - f * 165} stroke="rgba(90,46,22,0.08)" strokeWidth="1" />
                ))}
                {series.map((b, i) => {
                  const slot = 600 / series.length;
                  const w = Math.max(2, slot * 0.62);
                  const h = (b.revenue / maxVal) * 165;
                  return (
                    <g key={b.key}>
                      <rect x={i * slot + (slot - w) / 2} y={180 - h} width={w} height={Math.max(h, b.revenue > 0 ? 2 : 0)} rx="3"
                        fill={b.revenue > 0 ? '#C68A3A' : 'transparent'}>
                        <title>{`${b.label}: ${inr(b.revenue)} · ${b.orders} order${b.orders === 1 ? '' : 's'}`}</title>
                      </rect>
                      {/* invisible full-height hit area so empty days still show a tooltip */}
                      <rect x={i * slot} y="0" width={slot} height="180" fill="transparent">
                        <title>{`${b.label}: ${inr(b.revenue)} · ${b.orders} order${b.orders === 1 ? '' : 's'}`}</title>
                      </rect>
                    </g>
                  );
                })}
              </svg>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.25rem', marginTop: '0.25rem' }}>
                {series.map((b, i) => (
                  <span key={b.key} style={{ flex: 1, textAlign: 'center', fontSize: '0.62rem', color: '#888888', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', visibility: (i % labelEvery === 0 || i === series.length - 1) ? 'visible' : 'hidden' }}>
                    {b.label}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ height: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', border: '1.5px dashed rgba(90,46,22,0.15)', borderRadius: '12px', backgroundColor: 'rgba(245,237,229,0.4)' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C68A3A" strokeWidth="2"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
              <span style={{ fontSize: '0.88rem', fontWeight: '800', color: '#21150F' }}>No sales in the last {activeRange.toLowerCase()}</span>
              <span style={{ fontSize: '0.76rem', color: '#888888', fontWeight: '500', textAlign: 'center', maxWidth: '280px' }}>Paid orders (and delivered COD orders) will appear here.</span>
            </div>
          )}
        </div>

        {/* Inventory Attention Alerts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Out of stock box */}
          {outOfStockItems.length > 0 && (
            <div className="admin-card" style={{ display: 'flex', flexDirection: 'column', borderColor: 'rgba(198, 40, 40, 0.2)' }}>
              <div style={{ marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '0.95rem', fontFamily: 'var(--font-serif)', color: '#C62828', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <XCircle size={16} color="#FF8A87" /> OUT OF STOCK
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: '#665A52', margin: '0.15rem 0 0', fontWeight: '600' }}>
                    {outOfStockItems.length} {outOfStockItems.length === 1 ? 'variant is unavailable' : 'variants are unavailable'}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {outOfStockItems.slice(0, 3).map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.65rem 0.85rem', background: 'rgba(217, 83, 79, 0.12)', borderRadius: '10px', border: '1px solid rgba(217, 83, 79, 0.25)' }}>
                    <img src={item.image} alt={item.title} style={{ width: '38px', height: '38px', objectFit: 'cover', borderRadius: '8px', border: '1px solid rgba(231,222,213,0.6)' }} />
                    <div style={{ flexGrow: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: '800', color: '#21150F', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.title}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#FF8A87', fontWeight: '700' }}>
                        {item.variantName ? `${item.variantName} · ` : ''}Out of Stock
                      </div>
                    </div>
                    <Link to={`/admin/products/edit/${item.productId}`} className="admin-btn-secondary" style={{ padding: '0.35rem 0.65rem', fontSize: '0.72rem', textDecoration: 'none' }}>
                      Manage →
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Low Stock Alert Box */}
          <div className="admin-card" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div style={{ marginBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontFamily: 'var(--font-serif)', color: '#21150F', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <AlertTriangle size={16} color="#FBBF24" /> LOW STOCK ALERT
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#665A52', margin: '0.15rem 0 0', fontWeight: '600' }}>
                {lowStockItems.length} {lowStockItems.length === 1 ? 'variant needs attention' : 'variants need attention'}
              </p>
            </div>

            <div style={{ flexGrow: 1 }}>
              {lowStockItems.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {lowStockItems.slice(0, 4).map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.65rem 0.85rem', background: 'rgba(245, 158, 11, 0.12)', borderRadius: '10px', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
                      <img src={item.image} alt={item.title} style={{ width: '38px', height: '38px', objectFit: 'cover', borderRadius: '8px', border: '1px solid rgba(231,222,213,0.6)' }} />
                      <div style={{ flexGrow: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: '800', color: '#21150F', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.title}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: '#FBBF24', fontWeight: '700' }}>
                          {item.variantName ? `${item.variantName} · ` : ''}Only {item.stock} left (Rs.{item.price})
                        </div>
                      </div>
                      <Link to={`/admin/products/edit/${item.productId}`} className="admin-btn-secondary" style={{ padding: '0.35rem 0.65rem', fontSize: '0.72rem', textDecoration: 'none' }}>
                        Manage →
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                                <div style={{ padding: '1.5rem 1rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', backgroundColor: 'rgba(46, 125, 50, 0.08)', borderRadius: '10px', border: '1px dashed rgba(46, 125, 50, 0.25)' }}>
                  <CheckCircle size={24} color="#2E7D32" />
                  <span style={{ fontSize: '0.84rem', fontWeight: '800', color: '#2E7D32' }}>Inventory looks healthy</span>
                  <span style={{ fontSize: '0.72rem', color: '#888888', fontWeight: '500' }}>No variant products are low on stock.</span>
                </div>
              )}
            </div>

            <Link to="/admin/products" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', fontSize: '0.8rem', fontWeight: '800', color: '#C68A3A', textDecoration: 'none', marginTop: '0.85rem', borderTop: '1px solid rgba(231, 222, 213, 0.6)', paddingTop: '0.75rem' }}>
              Manage Inventory <ArrowUpRight size={14} />
            </Link>
        </div>
      </div>
    </div>

      {/* -€-€ RECENT ORDERS TABLE -€-€ */}
      <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.2rem 1.4rem', borderBottom: '1px solid rgba(231, 222, 213, 0.65)', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontFamily: 'var(--font-serif)', color: '#21150F', fontWeight: '800', margin: 0 }}>Recent Orders</h3>
            <p style={{ fontSize: '0.72rem', color: '#665A52', margin: '0.2rem 0 0', fontWeight: '500' }}>Latest checkout activities</p>
          </div>
          <Link to="/admin/orders" style={{ fontSize: '0.78rem', color: '#C68A3A', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.2rem', textDecoration: 'none' }}>
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
                {stats.recentOrders.slice(0, 6).map(o => (
                  <tr key={o.id || o.orderId}>
                    <td style={{ fontFamily: 'monospace', fontWeight: '700', fontSize: '0.8rem', color: '#4A3B2E' }}>{o.orderId}</td>
                    <td>
                      <div style={{ fontWeight: '700', color: '#21150F', fontSize: '0.84rem' }}>{o.customerName}</div>
                      <div style={{ fontSize: '0.7rem', color: '#665A52' }}>{o.phone}</div>
                    </td>
                    <td style={{ fontWeight: '800', color: '#21150F' }}>{inr(o.totalAmount)}</td>
                    <td>
                      <span className={`admin-badge ${o.paymentStatus === 'Paid' ? 'admin-badge-success' : o.paymentStatus === 'COD' ? 'admin-badge-warning' : 'admin-badge-danger'}`}>
                        {o.paymentStatus}
                      </span>
                    </td>
                    <td>
                      <span className={`admin-badge ${o.orderStatus === 'Delivered' ? 'admin-badge-success' : o.orderStatus === 'Cancelled' ? 'admin-badge-danger' : 'admin-badge-warning'}`}>{o.orderStatus}</span>
                    </td>
                    <td style={{ color: '#665A52', fontSize: '0.76rem', fontWeight: '600' }}>
                      {new Date(o.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Link to="/admin/orders" style={{ fontSize: '0.78rem', fontWeight: '700', color: '#C68A3A', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.15rem' }}>
                        View <ChevronRight size={13} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#665A52', fontSize: '0.84rem', fontWeight: '600' }}>
              No recent orders recorded yet.
            </div>
          )}
        </div>
      </div>

      {/* -€-€ QUICK ACTIONS -€-€ */}
      <div>
        <p style={{ fontSize: '0.68rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.07em', color: '#665A52', margin: '0 0 0.75rem' }}>Quick Actions</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(195px, 1fr))', gap: '1rem' }}>
          {[
            { label: 'Add Product', desc: 'Add new product to store', path: '/admin/products/add', icon: Plus, color: '#C68A3A', bg: 'rgba(245, 237, 229, 0.7)' },
            { label: 'Manage Orders', desc: 'Review all order logs', path: '/admin/orders', icon: ShoppingBag, color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
            { label: 'Customers', desc: 'View registered accounts', path: '/admin/customers', icon: Users, color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)' },
            { label: 'Create Coupon', desc: 'Setup discount codes', path: '/admin/coupons', icon: Ticket, color: 'var(--admin-accent-gold)', bg: 'rgba(214,162,63,0.12)' },
          ].map(act => {
            const Icon = act.icon;
            return (
              <Link
                key={act.label}
                to={act.path}
                style={{
                  background: 'var(--admin-surface-card)',
                  border: '1px solid rgba(231, 222, 213, 0.65)',
                  borderRadius: '12px',
                  padding: '1.1rem',
                  textDecoration: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.65rem',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.15)'
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(0,0,0,0.25)'; e.currentTarget.style.borderColor = act.color; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.15)'; e.currentTarget.style.borderColor = 'rgba(231, 222, 213, 0.65)'; }}
              >
                <div style={{ width: '34px', height: '34px', borderRadius: '8px', backgroundColor: act.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: act.color }}>
                  <Icon size={16} />
                </div>
                <div>
                  <h4 style={{ fontSize: '0.84rem', fontWeight: '800', color: '#21150F', margin: '0 0 0.2rem' }}>{act.label}</h4>
                  <p style={{ fontSize: '0.7rem', color: '#4A3B2E', margin: 0, fontWeight: '500' }}>{act.desc}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* -€-€ STORE HEALTH -€-€ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem', paddingBottom: '1rem' }} className="admin-dashboard-footer">
        <style>{`
          @media (min-width: 1024px) { .admin-dashboard-footer { grid-template-columns: 1fr !important; } }
        `}</style>

        {/* Store Health */}
        <div className="admin-card">
          <h3 style={{ fontSize: '1rem', fontFamily: 'var(--font-serif)', color: '#21150F', fontWeight: '800', marginBottom: '0.2rem', marginTop: 0 }}>Store Health</h3>
          <p style={{ fontSize: '0.72rem', color: '#665A52', margin: '0 0 1.25rem', fontWeight: '500' }}>Database & system status</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {[
              { icon: Package, label: 'Product Catalog', ok: isCatalogConnected },
              { icon: Users, label: 'Customer Registry', ok: isCustomersConnected },
              { icon: ShoppingBag, label: 'Order Gateway', ok: isOrdersConnected },
              { icon: MessageSquare, label: 'Review Moderation', ok: isReviewsConnected },
            ].map(({ icon: Icon, label, ok }, idx) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: idx < 3 ? '1px solid rgba(231, 222, 213, 0.65)' : 'none', paddingBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <Icon size={15} color="#665A52" />
                  <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#21150F' }}>{label}</span>
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



