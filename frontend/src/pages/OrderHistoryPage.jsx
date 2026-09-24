import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, Clock, Truck, ChevronRight, Search, Filter, AlertCircle, ShoppingBag, ShieldCheck, Star, Camera, CheckCircle2 } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function OrderHistoryPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [orders, setOrders] = useState([]);
  const [myReviews, setMyReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All'); // 'All', 'Active', 'Processing', 'Shipped', 'Delivered', 'Cancelled'

  // Review Form States per product ID
  const [reviewFormState, setReviewFormState] = useState({});

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    } else {
      fetchMyOrders();
      fetchMyReviews();
    }
  }, [isAuthenticated]);

  const fetchMyOrders = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await api.get('/orders/my-orders');
      const list = Array.isArray(res.data) ? res.data : (Array.isArray(res.data?.orders) ? res.data.orders : []);
      setOrders(list);
    } catch (e) {
      console.error('Error fetching orders', e);
      setOrders([]);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyReviews = async () => {
    try {
      const res = await api.get('/reviews/my-reviews');
      const list = Array.isArray(res.data) ? res.data : (Array.isArray(res.data?.reviews) ? res.data.reviews : []);
      setMyReviews(list);
    } catch (e) {
      console.warn('Error fetching user reviews:', e.message);
      setMyReviews([]);
    }
  };

  // Star Rating Click
  const handleStarClick = (productId, starRating) => {
    setReviewFormState((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        rating: starRating,
        error: '',
      },
    }));
  };

  // Comment Text Change
  const handleCommentChange = (productId, val) => {
    setReviewFormState((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        comment: val,
      },
    }));
  };

  // Photo Upload Handler
  const handlePhotoUpload = async (productId, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        setReviewFormState((prev) => ({
          ...prev,
          [productId]: { ...prev[productId], uploadingImage: true, error: '' },
        }));

        const res = await api.post('/upload', { image: reader.result });
        setReviewFormState((prev) => ({
          ...prev,
          [productId]: { ...prev[productId], image: res.data.url, uploadingImage: false },
        }));
      } catch (err) {
        setReviewFormState((prev) => ({
          ...prev,
          [productId]: { ...prev[productId], uploadingImage: false, error: 'Photo upload failed. You can still submit without a photo.' },
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  // Review Submit Handler
  const handleSubmitReview = async (orderId, productId, orderItemId) => {
    const current = reviewFormState[productId] || {};
    const rating = current.rating || 5;
    const comment = current.comment || '';
    const image = current.image || '';

    if (!rating || rating < 1) {
      setReviewFormState((prev) => ({
        ...prev,
        [productId]: { ...prev[productId], error: 'Please select a rating between 1 and 5 stars.' },
      }));
      return;
    }

    setReviewFormState((prev) => ({
      ...prev,
      [productId]: { ...prev[productId], loading: true, error: '' },
    }));

    try {
      await api.post('/reviews', {
        productId,
        orderId,
        orderItemId,
        rating,
        comment,
        reviewImageUrl: image,
      });

      setReviewFormState((prev) => ({
        ...prev,
        [productId]: { ...prev[productId], loading: false, success: true },
      }));
      fetchMyReviews();
    } catch (err) {
      setReviewFormState((prev) => ({
        ...prev,
        [productId]: {
          ...prev[productId],
          loading: false,
          error: err.response?.data?.message || 'Unable to submit your review. Please try again.',
        },
      }));
    }
  };

  // Calculations for summary statistics
  const safeOrders = Array.isArray(orders) ? orders : [];
  const safeMyReviews = Array.isArray(myReviews) ? myReviews : [];

  const totalOrders = safeOrders.length;
  const activeOrders = safeOrders.filter((o) =>
    ['Pending', 'Confirmed', 'Processing', 'Packed', 'Shipped', 'Out for Delivery'].includes(o.orderStatus)
  ).length;
  const deliveredOrders = safeOrders.filter((o) => String(o.orderStatus).toLowerCase() === 'delivered').length;

  // Filtering & Searching logic
  const filteredOrders = safeOrders.filter((order) => {
    const matchesSearch = (order.orderId || order.orderNumber || '').toLowerCase().includes(searchTerm.toLowerCase());

    if (selectedFilter === 'All') return matchesSearch;
    if (selectedFilter === 'Active') {
      return (
        matchesSearch &&
        ['Pending', 'Confirmed', 'Processing', 'Packed', 'Shipped', 'Out for Delivery'].includes(order.orderStatus)
      );
    }
    return matchesSearch && String(order.orderStatus).toLowerCase() === selectedFilter.toLowerCase();
  });

  if (!isAuthenticated) return null;

  return (
    <div className="account-dashboard-page" style={{ backgroundColor: 'transparent', minHeight: '100vh', padding: '0 0 4rem' }}>
      <div className="container" style={{ maxWidth: '1150px' }}>
        
        {/* Breadcrumb Header */}
        <div style={{ fontSize: '0.78rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>Home</Link>
          <span style={{ margin: '0 0.5rem' }}>/</span>
          <Link to="/account" style={{ color: 'inherit', textDecoration: 'none' }}>My Account</Link>
          <span style={{ margin: '0 0.5rem' }}>/</span>
          <span style={{ color: 'var(--accent-gold)' }}>Order History</span>
        </div>

        {/* Page Title & Stats Banner */}
        <div 
          className="glass-card" 
          style={{ 
            padding: '2rem 2.25rem', 
            backgroundColor: 'transparent', 
            marginBottom: '2rem', 
            borderRadius: '24px', 
            border: '1px solid rgba(245, 235, 221, 0.25)',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.2)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
            <div>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent-gold)', fontWeight: '800', display: 'block', marginBottom: '0.35rem' }}>Customer Dashboard</span>
              <h1 style={{ fontSize: '1.8rem', fontFamily: 'var(--font-serif)', color: 'var(--text-light)', fontWeight: '800', margin: 0 }}>My Orders</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '0.45rem 0 0 0', fontWeight: '500' }}>
                Track live shipments and share feedback on your delivered artisan bakes.
              </p>
            </div>

            {/* Summary Stat Pills */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <div style={{ padding: '0.75rem 1.25rem', backgroundColor: 'rgba(255, 255, 255, 0.04)', borderRadius: '16px', border: '1px solid rgba(245, 235, 221, 0.12)', textAlign: 'center' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: '900', color: 'var(--text-light)', display: 'block', lineHeight: 1 }}>{totalOrders}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Orders</span>
              </div>
              <div style={{ padding: '0.75rem 1.25rem', backgroundColor: 'rgba(255, 255, 255, 0.04)', borderRadius: '16px', border: '1px solid rgba(245, 235, 221, 0.12)', textAlign: 'center' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: '900', color: 'var(--accent-gold)', display: 'block', lineHeight: 1 }}>{activeOrders}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>In Progress</span>
              </div>
              <div style={{ padding: '0.75rem 1.25rem', backgroundColor: 'rgba(255, 255, 255, 0.04)', borderRadius: '16px', border: '1px solid rgba(245, 235, 221, 0.12)', textAlign: 'center' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: '900', color: '#81c784', display: 'block', lineHeight: 1 }}>{deliveredOrders}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Delivered</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filters & Search Toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
          
          {/* Status Filter Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
            {['All', 'Active', 'Delivered', 'Cancelled'].map((filter) => {
              const isSelected = selectedFilter === filter;
              return (
                <button
                  key={filter}
                  onClick={() => setSelectedFilter(filter)}
                  style={{
                    padding: '0.55rem 1.1rem',
                    borderRadius: '999px',
                    border: isSelected ? '1px solid var(--accent-gold)' : '1px solid rgba(245, 235, 221, 0.15)',
                    backgroundColor: isSelected ? 'rgba(201, 154, 50, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                    color: isSelected ? 'var(--accent-gold)' : 'var(--text-muted)',
                    fontSize: '0.82rem',
                    fontWeight: isSelected ? '800' : '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {filter}
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', width: '100%', maxWidth: '280px' }}>
            <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Search by Order ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem 1rem 0.65rem 2.25rem',
                borderRadius: '10px',
                border: '1px solid rgba(245, 235, 221, 0.25)',
                fontSize: '0.85rem',
                outline: 'none',
                fontFamily: 'inherit',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                color: 'var(--text-light)'
              }}
            />
          </div>
        </div>

        {/* LOADING STATE */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {[1, 2].map((i) => (
              <div 
                key={i} 
                className="glass-card" 
                style={{ padding: '2rem', backgroundColor: 'transparent', borderRadius: '24px', border: '1px solid rgba(245, 235, 221, 0.25)', opacity: 0.7 }}
              >
                <div style={{ height: '20px', width: '140px', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '4px', marginBottom: '1rem' }} />
                <div style={{ height: '60px', backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px' }} />
              </div>
            ))}
          </div>
        )}

        {/* ERROR STATE */}
        {!loading && error && (
          <div className="glass-card" style={{ padding: '4rem 2rem', textAlign: 'center', backgroundColor: 'transparent', borderRadius: '24px', border: '1px solid rgba(245, 235, 221, 0.25)' }}>
            <AlertCircle size={44} color="var(--accent-terracotta)" style={{ margin: '0 auto 1.25rem' }} />
            <h3 style={{ fontSize: '1.3rem', fontFamily: 'var(--font-serif)', color: 'var(--text-light)', fontWeight: '800', margin: 0 }}>Unable to Load Your Orders</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0.5rem 0 1.5rem' }}>We encountered an error connecting to our server. Please try again.</p>
            <button onClick={fetchMyOrders} className="btn-primary" style={{ padding: '0.8rem 2rem', backgroundColor: 'var(--accent-gold)', border: 'none', borderRadius: '999px', color: '#24130D', cursor: 'pointer', fontWeight: '800' }}>
              Try Again
            </button>
          </div>
        )}

        {/* EMPTY STATE */}
        {!loading && !error && filteredOrders.length === 0 && (
          <div className="glass-card" style={{ padding: '5rem 2rem', textAlign: 'center', backgroundColor: 'transparent', borderRadius: '24px', border: '1px solid rgba(245, 235, 221, 0.25)' }}>
            <ShoppingBag size={48} color="var(--accent-gold)" style={{ margin: '0 auto 1.25rem' }} />
            <h3 style={{ fontSize: '1.3rem', fontFamily: 'var(--font-serif)', color: 'var(--text-light)', fontWeight: '800', margin: 0 }}>No Orders Found</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0.5rem auto 1.75rem', maxWidth: '300px' }}>Your next wholesome snack is waiting. Discover MILASTY's handcrafted bakes.</p>
            <Link to="/shop" className="btn-primary" style={{ padding: '0.85rem 2rem', backgroundColor: 'var(--accent-gold)', border: 'none', borderRadius: '999px', color: '#24130D', textDecoration: 'none', fontWeight: '850', fontSize: '0.9rem' }}>
              Explore Fresh Bakes →
            </Link>
          </div>
        )}

        {/* ORDERS LIST */}
        {!loading && !error && filteredOrders.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            {filteredOrders.map((order) => {
              const totalItems = order.items?.reduce((acc, i) => acc + i.quantity, 0) || 0;
              const isDelivered = String(order.orderStatus).toLowerCase() === 'delivered';
              const isCancelled = String(order.orderStatus).toLowerCase() === 'cancelled';
              const isPaid = String(order.paymentStatus).toLowerCase() === 'paid';
              const orderItemsList = order.order_items || order.items || [];
              const hasCustomization = orderItemsList.some((i) => Boolean(i.customization_note || i.customizationNote));
              
              const firstItem = orderItemsList[0] || {};
              const firstItemImage = firstItem.image || firstItem.product_image || '/images/image1.jpeg';

              return (
                <div 
                  key={order._id || order.id || order.orderId} 
                  className="glass-card" 
                  style={{ 
                    padding: '1.75rem', 
                    backgroundColor: 'rgba(50, 26, 18, 0.40)', 
                    borderRadius: '20px', 
                    border: '1px solid rgba(245, 235, 221, 0.2)',
                    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.25)',
                  }}
                >
                  
                  {/* Order Card Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid rgba(245, 235, 221, 0.12)', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
                    <div>
                      <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#b9cd94', fontWeight: '800', display: 'block', marginBottom: '0.15rem' }}>Order Number</span>
                      <span style={{ fontSize: '1.2rem', fontWeight: '850', color: '#FFFDF9' }}>#{order.orderNumber || order.orderId}</span>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      {hasCustomization && (
                        <span 
                          style={{ 
                            backgroundColor: 'rgba(47, 125, 50, 0.25)', 
                            color: '#9BCB88', 
                            border: '1px solid rgba(155, 203, 136, 0.4)',
                            fontSize: '0.72rem',
                            fontWeight: '800',
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                            padding: '0.25rem 0.65rem',
                            borderRadius: '999px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}
                        >
                          ✦ Customized
                        </span>
                      )}

                      <span 
                        style={{ 
                          backgroundColor: isCancelled ? 'rgba(217, 83, 79, 0.15)' : (isDelivered ? 'rgba(129, 199, 132, 0.2)' : 'rgba(36, 79, 33, 0.25)'), 
                          color: isCancelled ? '#ef5350' : (isDelivered ? '#81c784' : '#b9cd94'),
                          border: isCancelled ? '1px solid rgba(217, 83, 79, 0.3)' : (isDelivered ? '1px solid rgba(129, 199, 132, 0.3)' : '1px solid rgba(185, 205, 148, 0.3)'),
                          fontSize: '0.72rem',
                          fontWeight: '800',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                          padding: '0.25rem 0.65rem',
                          borderRadius: '999px'
                        }}
                      >
                        {isDelivered ? '✓ Delivered' : (order.orderStatus || 'Confirmed')}
                      </span>

                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          color: isPaid ? '#81c784' : '#e5c158',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          backgroundColor: 'rgba(255, 255, 255, 0.04)',
                          padding: '0.25rem 0.65rem',
                          borderRadius: '8px',
                          border: '1px solid rgba(255, 255, 255, 0.1)'
                        }}
                      >
                        <ShieldCheck size={13} />
                        {order.paymentMethod} · {isPaid ? 'Paid' : 'Pending'}
                      </span>

                      <div style={{ fontSize: '0.8rem', color: 'rgba(255, 253, 249, 0.6)', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: '600' }}>
                        <Clock size={13} />
                        <span>{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                    </div>
                  </div>

                  {/* Order Items Preview */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', gap: '1.1rem', alignItems: 'center' }}>
                      <img 
                        src={firstItemImage} 
                        alt="Product preview" 
                        style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '10px', border: '1px solid rgba(245, 235, 221, 0.15)' }} 
                      />
                      <div>
                        <div style={{ fontSize: '0.95rem', color: '#FFFDF9', fontWeight: '800', marginBottom: '0.15rem' }}>
                          {firstItem.title || firstItem.product_title || 'Millet Bakery Item'}
                          {firstItem.variantName && firstItem.variantName !== 'default' && (
                            <span style={{ fontSize: '0.8rem', color: '#b9cd94', marginLeft: '0.4rem', fontWeight: '600' }}>
                              ({firstItem.variantName})
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'rgba(255, 253, 249, 0.65)', fontWeight: '600' }}>
                          {totalItems} {totalItems === 1 ? 'pack' : 'packs'} in this order
                          {order.items?.length > 1 && ` (and ${order.items.length - 1} other item${order.items.length > 2 ? 's' : ''})`}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'rgba(255, 253, 249, 0.6)', fontWeight: '700', display: 'block', marginBottom: '0.15rem' }}>Total Amount</span>
                        <div style={{ fontSize: '1.35rem', fontWeight: '900', color: '#FFFDF9' }}>₹{order.totalAmount || order.grandTotal || 0}</div>
                      </div>
                      
                      <Link 
                        to={`/account/orders/${order.id || order.orderId}`} 
                        className="btn-secondary" 
                        style={{ 
                          padding: '0.65rem 1.15rem', 
                          fontSize: '0.82rem',
                          borderRadius: '10px',
                          border: '1px solid rgba(245, 235, 221, 0.25)',
                          color: '#b9cd94',
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

                  {/* ======================================================== */}
                  {/* DELIVERED ORDER PRODUCT REVIEWS SECTION                  */}
                  {/* ======================================================== */}
                  {isDelivered && (
                    <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(245, 235, 221, 0.15)' }}>
                      <h4 style={{ fontSize: '0.92rem', fontWeight: '800', color: 'var(--accent-gold)', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Star size={16} fill="var(--accent-gold)" color="var(--accent-gold)" />
                        <span>How was your experience? Rate your products</span>
                      </h4>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {order.items?.map((item) => {
                          const pId = item.product_id || item.productId;
                          const pTitle = item.title || item.product_title || 'Artisan Bake';
                          const pVariant = item.variantName || item.variant_name;

                          const existingReview = myReviews.find((r) => r.productId === pId);
                          const currentState = reviewFormState[pId] || { rating: 5, comment: '', image: '', loading: false, error: '', success: false };

                          // If already reviewed or submitted in current session
                          if (existingReview || currentState.success) {
                            return (
                              <div key={pId} style={{ padding: '0.9rem 1.15rem', backgroundColor: 'rgba(36, 79, 33, 0.2)', borderRadius: '12px', border: '1px solid rgba(185, 205, 148, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                                <div>
                                  <strong style={{ fontSize: '0.88rem', color: '#FFFDF9', display: 'block' }}>
                                    {pTitle} {pVariant && pVariant !== 'Standard Pack' ? `(${pVariant})` : ''}
                                  </strong>
                                  <span style={{ fontSize: '0.78rem', color: '#81c784', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.2rem' }}>
                                    <CheckCircle2 size={13} />
                                    Review submitted — Awaiting moderation
                                  </span>
                                </div>
                                <div style={{ display: 'flex', gap: '0.2rem' }}>
                                  {[1, 2, 3, 4, 5].map((s) => (
                                    <Star 
                                      key={s} 
                                      size={14} 
                                      fill={s <= (existingReview?.rating || currentState.rating || 5) ? 'var(--accent-gold)' : 'none'} 
                                      color="var(--accent-gold)" 
                                    />
                                  ))}
                                </div>
                              </div>
                            );
                          }

                          // Review Submission Form
                          return (
                            <div key={pId} style={{ padding: '1.15rem', backgroundColor: 'rgba(0, 0, 0, 0.25)', borderRadius: '14px', border: '1px solid rgba(245, 235, 221, 0.15)' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                <span style={{ fontSize: '0.9rem', fontWeight: '800', color: '#FFFDF9' }}>
                                  {pTitle} {pVariant && pVariant !== 'Standard Pack' ? `(${pVariant})` : ''}
                                </span>

                                {/* 5 Star Interactive Rating */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                  {[1, 2, 3, 4, 5].map((s) => (
                                    <button
                                      key={s}
                                      type="button"
                                      onClick={() => handleStarClick(pId, s)}
                                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.15rem', display: 'flex', alignItems: 'center' }}
                                    >
                                      <Star
                                        size={22}
                                        fill={s <= (currentState.rating || 5) ? 'var(--accent-gold)' : 'none'}
                                        color={s <= (currentState.rating || 5) ? 'var(--accent-gold)' : 'rgba(255, 255, 255, 0.25)'}
                                      />
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Feedback Text Input */}
                              <textarea
                                rows={2}
                                placeholder="Write your feedback (optional)..."
                                value={currentState.comment || ''}
                                onChange={(e) => handleCommentChange(pId, e.target.value)}
                                style={{
                                  width: '100%',
                                  padding: '0.65rem 0.85rem',
                                  borderRadius: '10px',
                                  border: '1px solid rgba(245, 235, 221, 0.2)',
                                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                  color: '#FFFDF9',
                                  fontSize: '0.85rem',
                                  outline: 'none',
                                  fontFamily: 'inherit',
                                  resize: 'vertical',
                                  marginBottom: '0.75rem',
                                }}
                              />

                              {/* Error alert */}
                              {currentState.error && (
                                <div style={{ color: '#ef5350', fontSize: '0.78rem', fontWeight: '600', marginBottom: '0.65rem' }}>
                                  ⚠️ {currentState.error}
                                </div>
                              )}

                              {/* Actions */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                                <label style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: '#b9cd94', fontWeight: '700' }}>
                                  <Camera size={14} />
                                  <span>{currentState.uploadingImage ? 'Uploading photo...' : (currentState.image ? '✓ Photo Attached' : 'Add Photo (optional)')}</span>
                                  <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => handlePhotoUpload(pId, e)} style={{ display: 'none' }} />
                                </label>

                                <button
                                  type="button"
                                  disabled={currentState.loading || currentState.uploadingImage}
                                  onClick={() => handleSubmitReview(order.id || order._id, pId, item.id)}
                                  style={{
                                    padding: '0.55rem 1.35rem',
                                    backgroundColor: 'var(--accent-gold)',
                                    color: '#24130D',
                                    border: 'none',
                                    borderRadius: '10px',
                                    fontWeight: '850',
                                    fontSize: '0.82rem',
                                    cursor: currentState.loading ? 'wait' : 'pointer',
                                    opacity: currentState.loading ? 0.7 : 1,
                                    transition: 'all 0.2s',
                                  }}
                                >
                                  {currentState.loading ? 'Submitting...' : 'Submit Review'}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
