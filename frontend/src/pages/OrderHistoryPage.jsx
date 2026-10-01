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

  // Design tokens
  const T = {
    bg: '#FCFAF7', surface: '#FFFFFF', surfaceAlt: '#F7F2EC',
    brand: '#5A2E16', brandLight: '#F5EDE5',
    accent: '#C58A35', accentLight: '#FEF9EC',
    border: '#E7DED5',
    textPrimary: '#171717', textSecondary: '#4A3B2E', textMuted: '#888888',
    success: '#2E7D32', successBg: '#EDF7EE',
    danger: '#C62828', dangerBg: '#FEECEC',
    warning: '#B7791F', warningBg: '#FEF9EC',
    shadow: '0 2px 10px rgba(90, 46, 22, 0.07)',
  };

  const cardStyle = {
    backgroundColor: T.surface, border: `1px solid ${T.border}`,
    borderRadius: '16px', boxShadow: T.shadow,
  };

  const StatusBadge = ({ status }) => {
    const s = String(status || 'Confirmed');
    const map = {
      Pending:       { bg: T.warningBg, color: T.warning },
      Confirmed:     { bg: '#EAF2FF', color: '#1565C0' },
      Processing:    { bg: '#F3E8FF', color: '#6B21A8' },
      Packed:        { bg: '#F3E8FF', color: '#6B21A8' },
      Shipped:       { bg: T.accentLight, color: T.accent },
      'Out for Delivery': { bg: T.accentLight, color: T.accent },
      Delivered:     { bg: T.successBg, color: T.success },
      Cancelled:     { bg: T.dangerBg, color: T.danger },
    };
    const style = map[s] || { bg: '#F3F4F6', color: '#6B7280' };
    return (
      <span style={{ padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: '700', backgroundColor: style.bg, color: style.color, display: 'inline-block', whiteSpace: 'nowrap' }}>
        {s}
      </span>
    );
  };

  return (
    <div className="account-dashboard-page" style={{ backgroundColor: T.bg, minHeight: '100vh', padding: '0 0 4rem' }}>
      <div className="container" style={{ maxWidth: '1080px' }}>

        {/* Summary Header */}
        <div style={{ ...cardStyle, padding: '1.75rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem' }}>
          <div>
            <div style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.14em', color: T.textMuted, fontWeight: '800', marginBottom: '0.3rem' }}>ACCOUNT / ORDERS</div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: T.textPrimary, margin: 0, letterSpacing: '-0.02em' }}>My Orders</h1>
            <p style={{ color: T.textMuted, fontSize: '0.85rem', margin: '0.3rem 0 0 0' }}>Track your shipments and rate delivered products.</p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {[
              { label: 'Total Orders', value: totalOrders, color: T.textPrimary },
              { label: 'In Progress', value: activeOrders, color: T.accent },
              { label: 'Delivered', value: deliveredOrders, color: T.success },
            ].map((stat) => (
              <div key={stat.label} style={{ padding: '0.85rem 1.15rem', backgroundColor: T.surfaceAlt, borderRadius: '12px', border: `1px solid ${T.border}`, textAlign: 'center', minWidth: '90px' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: '900', color: stat.color, lineHeight: 1 }}>{stat.value}</div>
                <div style={{ fontSize: '0.68rem', fontWeight: '700', color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.15rem' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Filter Toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
            {['All', 'Active', 'Delivered', 'Cancelled'].map((f) => {
              const sel = selectedFilter === f;
              return (
                <button key={f} onClick={() => setSelectedFilter(f)} style={{
                  padding: '0.5rem 1rem', borderRadius: '999px', border: `1px solid ${sel ? T.brand : T.border}`,
                  backgroundColor: sel ? T.brand : T.surface,
                  color: sel ? '#FFFFFF' : T.textSecondary,
                  fontSize: '0.82rem', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap',
                  transition: 'all 0.18s ease',
                }}>
                  {f}
                </button>
              );
            })}
          </div>

          <div style={{ position: 'relative', width: '100%', maxWidth: '260px' }}>
            <Search size={15} color={T.textMuted} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search by Order ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', height: '42px', padding: '0 1rem 0 36px', borderRadius: '10px', border: `1px solid ${T.border}`, fontSize: '0.85rem', outline: 'none', backgroundColor: T.surface, color: T.textPrimary, boxSizing: 'border-box' }}
            />
          </div>
        </div>

        {/* LOADING */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ ...cardStyle, padding: '1.75rem' }}>
                <div style={{ height: '16px', width: '140px', backgroundColor: '#EDE8E1', borderRadius: '6px', marginBottom: '1rem', animation: 'milastyPulse 1.5s ease-in-out infinite' }} />
                <div style={{ height: '60px', backgroundColor: '#EDE8E1', borderRadius: '10px', animation: 'milastyPulse 1.5s ease-in-out infinite' }} />
              </div>
            ))}
          </div>
        )}

        {/* ERROR */}
        {!loading && error && (
          <div style={{ ...cardStyle, padding: '4rem 2rem', textAlign: 'center' }}>
            <AlertCircle size={44} color={T.danger} style={{ margin: '0 auto 1.25rem' }} />
            <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: T.textPrimary, margin: '0 0 0.45rem 0' }}>Unable to Load Orders</h3>
            <p style={{ color: T.textMuted, fontSize: '0.88rem', margin: '0 0 1.5rem' }}>We encountered an error. Please try again.</p>
            <button onClick={fetchMyOrders} style={{ padding: '0.7rem 1.75rem', backgroundColor: T.brand, color: '#FFFFFF', border: 'none', borderRadius: '999px', fontWeight: '700', cursor: 'pointer' }}>
              Try Again
            </button>
          </div>
        )}

        {/* EMPTY */}
        {!loading && !error && filteredOrders.length === 0 && (
          <div style={{ ...cardStyle, padding: '5rem 2rem', textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: T.brandLight, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
              <ShoppingBag size={28} color={T.brand} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: T.textPrimary, margin: '0 0 0.35rem 0' }}>No Orders Found</h3>
            <p style={{ color: T.textMuted, fontSize: '0.88rem', margin: '0 0 1.5rem' }}>
              {searchTerm || selectedFilter !== 'All' ? 'Try adjusting your search or filters.' : 'Your next wholesome snack is waiting.'}
            </p>
            <Link to="/shop" style={{ padding: '0.75rem 1.75rem', backgroundColor: T.brand, color: '#FFFFFF', borderRadius: '999px', textDecoration: 'none', fontWeight: '700', fontSize: '0.88rem' }}>
              Explore Fresh Bakes →
            </Link>
          </div>
        )}

        {/* ORDERS LIST */}
        {!loading && !error && filteredOrders.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
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
                <div key={order._id || order.id || order.orderId} style={{ ...cardStyle, padding: '1.5rem' }}>

                  {/* Card Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', borderBottom: `1px solid ${T.border}`, paddingBottom: '1rem', marginBottom: '1.15rem' }}>
                    <div>
                      <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: T.textMuted, fontWeight: '700', marginBottom: '0.15rem' }}>Order Number</div>
                      <div style={{ fontSize: '1.05rem', fontWeight: '800', color: T.textPrimary }}>#{order.orderNumber || order.orderId}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      {hasCustomization && (
                        <span style={{ backgroundColor: T.successBg, color: T.success, border: `1px solid #A5D6A7`, fontSize: '0.68rem', fontWeight: '700', padding: '0.2rem 0.6rem', borderRadius: '999px' }}>
                          ✦ Customized
                        </span>
                      )}
                      <StatusBadge status={order.orderStatus || 'Confirmed'} />
                      <span style={{ fontSize: '0.76rem', fontWeight: '600', color: isPaid ? T.success : T.warning, display: 'flex', alignItems: 'center', gap: '0.25rem', backgroundColor: isPaid ? T.successBg : T.warningBg, padding: '0.25rem 0.65rem', borderRadius: '8px' }}>
                        <ShieldCheck size={12} /> {order.paymentMethod} · {isPaid ? 'Paid' : 'Pending'}
                      </span>
                      <div style={{ fontSize: '0.78rem', color: T.textMuted, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        <Clock size={12} />
                        {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                  </div>

                  {/* Items Preview */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <img src={firstItemImage} alt="Product" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '10px', border: `1px solid ${T.border}`, flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: '0.95rem', color: T.textPrimary, fontWeight: '700' }}>
                          {firstItem.title || firstItem.product_title || 'Millet Bakery Item'}
                          {firstItem.variantName && firstItem.variantName !== 'default' && (
                            <span style={{ fontSize: '0.78rem', color: T.accent, marginLeft: '0.4rem' }}>({firstItem.variantName})</span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.76rem', color: T.textMuted, marginTop: '0.1rem' }}>
                          {totalItems} {totalItems === 1 ? 'pack' : 'packs'}
                          {order.items?.length > 1 && ` + ${order.items.length - 1} more`}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.68rem', color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>Total</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: '900', color: T.textPrimary }}>₹{order.totalAmount || order.grandTotal || 0}</div>
                      </div>
                      <Link to={`/account/orders/${order.id || order._id || order.orderId}`} style={{
                        padding: '0.6rem 1.15rem', fontSize: '0.82rem', borderRadius: '10px',
                        border: `1px solid ${T.border}`, color: T.brand, backgroundColor: T.brandLight,
                        fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                        textDecoration: 'none',
                      }}>
                        View Order <ChevronRight size={14} />
                      </Link>
                    </div>
                  </div>

                  {/* DELIVERED: Review Section */}
                  {isDelivered && (
                    <div style={{ marginTop: '1.25rem', paddingTop: '1.1rem', borderTop: `1px solid ${T.border}` }}>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: '700', color: T.brand, margin: '0 0 0.85rem 0', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Star size={15} fill={T.accent} color={T.accent} /> Rate your products
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                        {order.items?.map((item) => {
                          const pId = item.product_id || item.productId;
                          const pTitle = item.title || item.product_title || 'Artisan Bake';
                          const pVariant = item.variantName || item.variant_name;
                          const existingReview = myReviews.find((r) => r.productId === pId);
                          const currentState = reviewFormState[pId] || { rating: 5, comment: '', image: '', loading: false, error: '', success: false };

                          if (existingReview || currentState.success) {
                            return (
                              <div key={pId} style={{ padding: '0.85rem 1rem', backgroundColor: T.successBg, borderRadius: '10px', border: `1px solid #A5D6A7`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                                <div>
                                  <div style={{ fontSize: '0.88rem', fontWeight: '700', color: T.textPrimary }}>{pTitle} {pVariant && pVariant !== 'Standard Pack' ? `(${pVariant})` : ''}</div>
                                  <div style={{ fontSize: '0.76rem', color: T.success, fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.1rem' }}>
                                    <CheckCircle2 size={12} /> Review submitted — Awaiting moderation
                                  </div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.2rem' }}>
                                  {[1,2,3,4,5].map((s) => <Star key={s} size={14} fill={s <= (existingReview?.rating || currentState.rating || 5) ? T.accent : 'none'} color={T.accent} />)}
                                </div>
                              </div>
                            );
                          }

                          return (
                            <div key={pId} style={{ padding: '1.1rem', backgroundColor: T.surfaceAlt, borderRadius: '12px', border: `1px solid ${T.border}` }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                <span style={{ fontSize: '0.9rem', fontWeight: '700', color: T.textPrimary }}>
                                  {pTitle} {pVariant && pVariant !== 'Standard Pack' ? `(${pVariant})` : ''}
                                </span>
                                <div style={{ display: 'flex', gap: '0.25rem' }}>
                                  {[1,2,3,4,5].map((s) => (
                                    <button key={s} type="button" onClick={() => handleStarClick(pId, s)}
                                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.1rem' }}>
                                      <Star size={20} fill={s <= (currentState.rating || 5) ? T.accent : 'none'} color={s <= (currentState.rating || 5) ? T.accent : T.border} />
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <textarea rows={2} placeholder="Write your feedback (optional)..."
                                value={currentState.comment || ''}
                                onChange={(e) => handleCommentChange(pId, e.target.value)}
                                style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: `1px solid ${T.border}`, backgroundColor: T.surface, color: T.textPrimary, fontSize: '0.85rem', outline: 'none', fontFamily: 'inherit', resize: 'vertical', marginBottom: '0.65rem', boxSizing: 'border-box' }}
                              />
                              {currentState.error && <div style={{ color: T.danger, fontSize: '0.78rem', marginBottom: '0.5rem' }}>⚠️ {currentState.error}</div>}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                                <label style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: T.brand, fontWeight: '700' }}>
                                  <Camera size={14} />
                                  {currentState.uploadingImage ? 'Uploading...' : (currentState.image ? '✓ Photo Attached' : 'Add Photo')}
                                  <input type="file" accept="image/*" onChange={(e) => handlePhotoUpload(pId, e)} style={{ display: 'none' }} />
                                </label>
                                <button type="button" disabled={currentState.loading || currentState.uploadingImage}
                                  onClick={() => handleSubmitReview(order.id || order._id, pId, item.id)}
                                  style={{ padding: '0.5rem 1.25rem', backgroundColor: T.accent, color: '#FFFFFF', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '0.82rem', cursor: 'pointer', opacity: currentState.loading ? 0.7 : 1 }}>
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
