import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, Clock, Truck, ChevronRight, Search, Filter, AlertCircle, ShoppingBag, ShieldCheck } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function OrderHistoryPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All'); // 'All', 'Active', 'Processing', 'Shipped', 'Delivered', 'Cancelled'

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    } else {
      fetchMyOrders();
    }
  }, [isAuthenticated]);

  const fetchMyOrders = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await api.get('/orders/my-orders');
      setOrders(res.data || []);
    } catch (e) {
      console.error('Error fetching orders', e);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  // Calculations for summary statistics
  const totalOrders = orders.length;
  const activeOrders = orders.filter(o => 
    ['Pending', 'Confirmed', 'Processing', 'Packed', 'Shipped', 'Out for Delivery'].includes(o.orderStatus)
  ).length;
  const deliveredOrders = orders.filter(o => o.orderStatus === 'Delivered').length;

  // Filtering & Searching logic
  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.orderId.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (selectedFilter === 'All') return matchesSearch;
    if (selectedFilter === 'Active') {
      return matchesSearch && ['Pending', 'Confirmed', 'Processing', 'Packed', 'Shipped', 'Out for Delivery'].includes(order.orderStatus);
    }
    return matchesSearch && order.orderStatus === selectedFilter;
  });

  // Small compact status timeline helper
  const renderCompactTimeline = (status) => {
    const stages = ['Confirmed', 'Processing', 'Shipped', 'Delivered'];
    const currentIdx = stages.indexOf(status === 'Pending' ? 'Confirmed' : (status === 'Packed' ? 'Processing' : (status === 'Out for Delivery' ? 'Shipped' : status)));
    
    if (status === 'Cancelled') {
      return (
        <span style={{ fontSize: '0.8rem', color: 'var(--accent-terracotta)', fontWeight: '700' }}>
          ✕ THIS ORDER WAS CANCELLED
        </span>
      );
    }

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginTop: '0.65rem' }}>
        {stages.map((stage, idx) => {
          const isPassed = idx <= currentIdx;
          const isCurrent = idx === currentIdx;
          return (
            <React.Fragment key={stage}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <div 
                  style={{ 
                    width: '7px', 
                    height: '7px', 
                    borderRadius: '50%', 
                    backgroundColor: isPassed ? 'var(--accent-olive)' : '#E2D7C7',
                    boxShadow: isCurrent ? '0 0 0 2px rgba(39, 76, 55, 0.15)' : 'none'
                  }} 
                />
                <span style={{ fontSize: '0.68rem', fontWeight: isPassed ? '800' : '650', color: isPassed ? 'var(--primary-dark)' : 'var(--text-muted)' }}>
                  {stage}
                </span>
              </div>
              {idx < stages.length - 1 && (
                <div style={{ width: '12px', height: '1.5px', backgroundColor: idx < currentIdx ? 'var(--accent-olive)' : '#E2D7C7' }} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  if (!isAuthenticated) return null;

  return (
    <div style={{ backgroundColor: '#FBF8F2', minHeight: '100vh', padding: '2.5rem 0 5rem' }}>
      <div className="container" style={{ maxWidth: '1150px' }}>
        
        {/* Breadcrumbs */}
        <div style={{ fontSize: '0.78rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>Home</Link>
          <span style={{ margin: '0 0.5rem' }}>/</span>
          <Link to="/account" style={{ color: 'inherit', textDecoration: 'none' }}>My Account</Link>
          <span style={{ margin: '0 0.5rem' }}>/</span>
          <span style={{ color: 'var(--primary-dark)' }}>Orders</span>
        </div>

        {/* Page Header */}
        <div style={{ marginBottom: '2.5rem' }}>
          <h1 style={{ fontSize: '2.1rem', fontFamily: 'var(--font-serif)', color: 'var(--primary-dark)', fontWeight: '800', marginBottom: '0.45rem', letterSpacing: '-0.01em' }}>
            My Orders
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', margin: 0, fontWeight: '500' }}>
            Track your current shipments, check live statuses, and review your past organic millet bakes.
          </p>
        </div>

        {/* Statistics Widgets */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
          <div className="glass-card" style={{ padding: '1.25rem 1.5rem', backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1.5px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 4px 15px rgba(56, 20, 35, 0.01)' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: 'rgba(56, 20, 35, 0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-dark)' }}>
              <Package size={20} />
            </div>
            <div>
              <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: '700', display: 'block' }}>Total Orders</span>
              <span style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--primary-dark)', lineHeight: 1.1 }}>{loading ? '...' : totalOrders}</span>
            </div>
          </div>

          <div className="glass-card" style={{ padding: '1.25rem 1.5rem', backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1.5px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 4px 15px rgba(56, 20, 35, 0.01)' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: 'rgba(197, 160, 89, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-gold)' }}>
              <Clock size={20} />
            </div>
            <div>
              <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: '700', display: 'block' }}>Active Orders</span>
              <span style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--primary-dark)', lineHeight: 1.1 }}>{loading ? '...' : activeOrders}</span>
            </div>
          </div>

          <div className="glass-card" style={{ padding: '1.25rem 1.5rem', backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1.5px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 4px 15px rgba(56, 20, 35, 0.01)' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: 'rgba(39, 76, 55, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-olive)' }}>
              <Truck size={20} />
            </div>
            <div>
              <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: '700', display: 'block' }}>Delivered</span>
              <span style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--primary-dark)', lineHeight: 1.1 }}>{loading ? '...' : deliveredOrders}</span>
            </div>
          </div>
        </div>

        {/* Filters and Search Bar Row */}
        <div 
          style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            gap: '1.25rem', 
            marginBottom: '2rem', 
            flexWrap: 'wrap' 
          }}
        >
          {/* Filters pills */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {['All', 'Active', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map((filter) => (
              <button
                key={filter}
                onClick={() => setSelectedFilter(filter)}
                style={{
                  padding: '0.45rem 1rem',
                  fontSize: '0.78rem',
                  fontWeight: '700',
                  borderRadius: '999px',
                  cursor: 'pointer',
                  border: '1.5px solid',
                  borderColor: selectedFilter === filter ? 'var(--primary-dark)' : 'var(--border-color)',
                  backgroundColor: selectedFilter === filter ? 'var(--primary-dark)' : '#FFFFFF',
                  color: selectedFilter === filter ? '#FFFFFF' : 'var(--primary-dark)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  transition: 'all 0.2s'
                }}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search by order ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem 1rem 0.65rem 2.25rem',
                borderRadius: '10px',
                border: '1.5px solid var(--border-color)',
                fontSize: '0.85rem',
                outline: 'none',
                fontFamily: 'inherit',
                backgroundColor: '#FFFFFF',
                color: 'var(--primary-dark)'
              }}
            />
          </div>
        </div>

        {/* LOADING STATE - Skeleton UI */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {[1, 2].map((i) => (
              <div 
                key={i} 
                className="glass-card" 
                style={{ 
                  padding: '2rem', 
                  backgroundColor: '#FFFFFF', 
                  borderRadius: '24px', 
                  border: '1.5px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  opacity: 0.7
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1.5px solid #F5EFE6', paddingBottom: '1rem' }}>
                  <div style={{ height: '16px', width: '120px', backgroundColor: '#E2D7C7', borderRadius: '4px' }}></div>
                  <div style={{ height: '16px', width: '80px', backgroundColor: '#E2D7C7', borderRadius: '4px' }}></div>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div style={{ height: '60px', width: '60px', backgroundColor: '#E2D7C7', borderRadius: '8px' }}></div>
                  <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ height: '12px', width: '180px', backgroundColor: '#E2D7C7', borderRadius: '4px' }}></div>
                    <div style={{ height: '10px', width: '100px', backgroundColor: '#E2D7C7', borderRadius: '4px' }}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ERROR STATE */}
        {!loading && error && (
          <div className="glass-card" style={{ padding: '4rem 2rem', textAlign: 'center', backgroundColor: '#FFFFFF', borderRadius: '24px', border: '1.5px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
            <AlertCircle size={44} color="var(--accent-terracotta)" style={{ margin: '0 auto 1.25rem' }} />
            <h3 style={{ fontSize: '1.3rem', fontFamily: 'var(--font-serif)', color: 'var(--primary-dark)', fontWeight: '800', marginBottom: '0.5rem', margin: 0 }}>Unable to Load Your Orders</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>We encountered an error connecting to our server. Please try again.</p>
            <button onClick={fetchMyOrders} className="btn-primary" style={{ padding: '0.8rem 2rem', backgroundColor: 'var(--primary-dark)', border: 'none', borderRadius: '999px', color: '#FFFFFF', cursor: 'pointer', fontWeight: '750' }}>
              Try Again
            </button>
          </div>
        )}

        {/* EMPTY STATE */}
        {!loading && !error && filteredOrders.length === 0 && (
          <div className="glass-card" style={{ padding: '5rem 2rem', textAlign: 'center', backgroundColor: '#FFFFFF', borderRadius: '24px', border: '1.5px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
            <ShoppingBag size={48} color="var(--accent-gold)" style={{ margin: '0 auto 1.25rem' }} />
            <h3 style={{ fontSize: '1.3rem', fontFamily: 'var(--font-serif)', color: 'var(--primary-dark)', fontWeight: '800', marginBottom: '0.5rem', margin: 0 }}>No Orders Found</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem', maxWidth: '300px', margin: '0.5rem auto 1.75rem' }}>Your next wholesome snack is waiting. Discover MILASTY's handcrafted bakes.</p>
            <Link to="/shop" className="btn-primary" style={{ padding: '0.85rem 2rem', backgroundColor: 'var(--primary-dark)', border: 'none', borderRadius: '999px', color: '#FFFFFF', textDecoration: 'none', fontWeight: '850', fontSize: '0.9rem' }}>
              Explore Fresh Bakes →
            </Link>
          </div>
        )}

        {/* ORDERS LIST */}
        {!loading && !error && filteredOrders.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            {filteredOrders.map((order) => {
              const totalItems = order.items?.reduce((acc, i) => acc + i.quantity, 0) || 0;
              const isCancelled = order.orderStatus === 'Cancelled';
              
              // Get first item image preview
              const firstItemImage = order.items?.[0]?.productId?.image || order.items?.[0]?.image || 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=150&q=80';

              return (
                <div 
                  key={order._id || order.orderId} 
                  className="glass-card" 
                  style={{ 
                    padding: '2rem', 
                    backgroundColor: '#FFFFFF', 
                    borderRadius: '24px', 
                    border: '1.5px solid var(--border-color)',
                    boxShadow: '0 8px 30px rgba(56, 20, 35, 0.01)',
                    transition: 'transform 0.2s',
                  }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'none'}
                >
                  
                  {/* Order Card Top Bar */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1.5px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
                    <div>
                      <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--accent-gold)', fontWeight: '800', display: 'block', marginBottom: '0.15rem' }}>Order Number</span>
                      <span style={{ fontSize: '1.2rem', fontWeight: '850', color: 'var(--primary-dark)' }}>#{order.orderId}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <span 
                        className="badge-pill" 
                        style={{ 
                          backgroundColor: isCancelled ? 'rgba(217, 83, 79, 0.08)' : 'rgba(39, 76, 55, 0.08)', 
                          color: isCancelled ? 'var(--accent-terracotta)' : 'var(--accent-olive)',
                          border: isCancelled ? '1px solid rgba(217, 83, 79, 0.15)' : '1px solid rgba(39, 76, 55, 0.15)',
                          fontSize: '0.72rem',
                          fontWeight: '800',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                          padding: '0.2rem 0.6rem'
                        }}
                      >
                        {order.orderStatus}
                      </span>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: '600' }}>
                        <Clock size={13} />
                        <span>{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                    </div>
                  </div>

                  {/* Order Preview Content */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', gap: '1.1rem', alignItems: 'center' }}>
                      {/* Product Image Preview */}
                      <img 
                        src={firstItemImage} 
                        alt="Product preview" 
                        style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '10px', border: '1px solid rgba(56,20,35,0.05)' }} 
                      />
                      <div>
                        <div style={{ fontSize: '0.92rem', color: 'var(--primary-dark)', fontWeight: '800', marginBottom: '0.15rem' }}>
                          {order.items?.[0]?.title || 'Millet Bakery Item'}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                          {totalItems} {totalItems === 1 ? 'item' : 'items'} in this order
                          {order.items?.length > 1 && ` (including ${order.items?.[1]?.title || 'others'})`}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '700', display: 'block', marginBottom: '0.15rem' }}>Total Amount</span>
                        <div style={{ fontSize: '1.35rem', fontWeight: '900', color: 'var(--primary-dark)' }}>₹{order.totalAmount}</div>
                      </div>
                      
                      <Link 
                        to={`/account/orders/${order.orderId}`} 
                        className="btn-secondary" 
                        style={{ 
                          padding: '0.65rem 1.15rem', 
                          fontSize: '0.82rem',
                          borderRadius: '10px',
                          border: '1.5px solid var(--border-color)',
                          color: 'var(--primary-dark)',
                          fontWeight: '800',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          textDecoration: 'none'
                        }}
                      >
                        <span>View Order</span>
                        <ChevronRight size={14} />
                      </Link>
                    </div>
                  </div>

                  {/* Compact Timeline display in card */}
                  <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-color)' }}>
                    {renderCompactTimeline(order.orderStatus)}
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
