import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Star,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Package,
  Send,
  Loader2,
  Heart,
  MessageSquare,
  ShieldCheck,
  ShoppingBag,
} from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function OrderReviewPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [orderData, setOrderData] = useState(null);
  const [error, setError] = useState('');
  
  // Per-product review form states: { [productId]: { rating: 5, comment: '', submitting: false, success: false, error: '' } }
  const [reviewForms, setReviewForms] = useState({});

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }

    fetchOrderReviewDetails();
  }, [orderId, isAuthenticated]);

  const fetchOrderReviewDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/reviews/order/${encodeURIComponent(orderId)}`);
      if (res.data?.success && res.data.order) {
        setOrderData(res.data.order);

        // Initialize review form state for unreviewed products
        const initial = {};
        (res.data.order.items || []).forEach((item) => {
          initial[item.productId] = {
            rating: item.alreadyReviewed ? (item.existingReview?.rating || 5) : 5,
            comment: item.alreadyReviewed ? (item.existingReview?.comment || '') : '',
            hoverRating: 0,
            submitting: false,
            success: Boolean(item.alreadyReviewed),
            error: '',
          };
        });
        setReviewForms(initial);
      } else {
        setError(res.data?.message || 'Could not load order details for review.');
      }
    } catch (err) {
      console.error('[ORDER REVIEW FETCH ERROR]', err);
      const msg = err.response?.data?.message || 'Could not load order details. Please verify your order status.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRatingChange = (productId, rating) => {
    setReviewForms((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        rating,
        error: '',
      },
    }));
  };

  const handleHoverRating = (productId, hoverRating) => {
    setReviewForms((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        hoverRating,
      },
    }));
  };

  const handleCommentChange = (productId, comment) => {
    setReviewForms((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        comment,
        error: '',
      },
    }));
  };

  const handleSubmitReview = async (item) => {
    const form = reviewForms[item.productId];
    if (!form) return;

    if (!form.rating || form.rating < 1 || form.rating > 5) {
      setReviewForms((prev) => ({
        ...prev,
        [item.productId]: { ...prev[item.productId], error: 'Please choose a rating between 1 and 5 stars.' },
      }));
      return;
    }

    setReviewForms((prev) => ({
      ...prev,
      [item.productId]: { ...prev[item.productId], submitting: true, error: '' },
    }));

    try {
      const payload = {
        productId: item.productId,
        orderId: orderData.id,
        orderItemId: item.orderItemId,
        rating: form.rating,
        comment: form.comment.trim(),
      };

      const res = await api.post('/reviews', payload);

      if (res.data?.success) {
        toast.success(`Thank you! Review submitted for ${item.title}`);
        setReviewForms((prev) => ({
          ...prev,
          [item.productId]: {
            ...prev[item.productId],
            submitting: false,
            success: true,
            error: '',
          },
        }));

        // Refresh details to update state
        fetchOrderReviewDetails();
      } else {
        throw new Error(res.data?.message || 'Failed to submit review');
      }
    } catch (err) {
      console.error('[SUBMIT REVIEW ERROR]', err);
      const errMsg = err.response?.data?.message || 'Could not submit review. Please try again.';
      setReviewForms((prev) => ({
        ...prev,
        [item.productId]: { ...prev[item.productId], submitting: false, error: errMsg },
      }));
      toast.error(errMsg);
    }
  };

  const ratingLabels = ['', 'Needs Improvement', 'Fair Taste', 'Good Snack', 'Very Delicious', 'Absolute Perfection! ⭐'];

  if (loading) {
    return (
      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '3rem 1.5rem', textAlign: 'center' }}>
        <Loader2 size={36} color="#2F6B3A" style={{ animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
        <p style={{ color: '#5A2E16', fontWeight: '700', fontSize: '0.95rem' }}>Loading your order review details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <div
          style={{
            backgroundColor: '#FDF0ED',
            border: '1.5px solid #FCA5A5',
            borderRadius: '16px',
            padding: '2rem',
            textAlign: 'center',
          }}
        >
          <AlertCircle size={40} color="#DC2626" style={{ margin: '0 auto 0.75rem' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#991B1B', margin: '0 0 0.5rem 0' }}>
            Review Not Available
          </h2>
          <p style={{ fontSize: '0.9rem', color: '#7F1D1D', margin: '0 0 1.5rem 0', lineHeight: '1.5' }}>
            {error}
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Link
              to="/account/orders"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                backgroundColor: '#2F6B3A',
                color: '#FFFFFF',
                padding: '0.75rem 1.4rem',
                borderRadius: '999px',
                fontWeight: '700',
                fontSize: '0.88rem',
                textDecoration: 'none',
              }}
            >
              <ArrowLeft size={16} />
              <span>Back to Orders</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const items = orderData?.items || [];
  const reviewedCount = items.filter((i) => i.alreadyReviewed).length;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1.5rem 1.25rem 4rem', fontFamily: 'Inter, sans-serif' }}>
      
      {/* ─── Back Nav ─── */}
      <div style={{ marginBottom: '1.25rem' }}>
        <Link
          to={`/account/orders/${orderData.id}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: '#5A2E16',
            fontWeight: '700',
            fontSize: '0.85rem',
            textDecoration: 'none',
          }}
        >
          <ArrowLeft size={15} />
          <span>Back to Order #{orderData.orderNumber}</span>
        </Link>
      </div>

      {/* ─── Header Card ─── */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          padding: '1.75rem 2rem',
          border: '1.5px solid #E8DCCB',
          marginBottom: '1.75rem',
          boxShadow: '0 4px 20px rgba(90, 46, 22, 0.05)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: '800',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: '#2F6B3A',
                  backgroundColor: '#E7F4E8',
                  padding: '3px 10px',
                  borderRadius: '999px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <CheckCircle2 size={13} color="#2F6B3A" />
                Delivered Order
              </span>
              <span style={{ fontSize: '0.8rem', color: '#8C7766', fontWeight: '600' }}>
                Order #{orderData.orderNumber}
              </span>
            </div>
            <h1 style={{ fontSize: '1.45rem', fontWeight: '900', color: '#2A140D', margin: '0.5rem 0 0.35rem 0', fontFamily: 'var(--font-serif)' }}>
              How was your MILASTY bake? 💛
            </h1>
            <p style={{ fontSize: '0.88rem', color: '#5A3422', margin: 0, lineHeight: '1.5' }}>
              Your feedback helps our bakers maintain the highest quality of artisanal millet treats. Share your review below!
            </p>
          </div>

          <div
            style={{
              backgroundColor: '#FAF7F2',
              border: '1px solid #D8CCB8',
              borderRadius: '12px',
              padding: '0.75rem 1.15rem',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '0.72rem', fontWeight: '700', color: '#8C7766', textTransform: 'uppercase' }}>
              Reviewed
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: '900', color: '#2F6B3A', marginTop: '2px' }}>
              {reviewedCount} / {items.length}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Purchased Products Review List ─── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {items.map((item, idx) => {
          const form = reviewForms[item.productId] || { rating: 5, comment: '', hoverRating: 0 };
          const isReviewed = item.alreadyReviewed || form.success;
          const displayRating = form.hoverRating || form.rating;

          return (
            <div
              key={item.productId || idx}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '18px',
                border: isReviewed ? '1.5px solid #CDE5CB' : '1.5px solid #E8DCCB',
                padding: '1.5rem',
                boxShadow: '0 4px 16px rgba(42, 20, 13, 0.04)',
                transition: 'all 0.2s ease',
              }}
            >
              {/* Product Info Row */}
              <div style={{ display: 'flex', gap: '1.15rem', alignItems: 'center', marginBottom: '1.25rem' }}>
                <img
                  src={item.image || '/images/image1.jpeg'}
                  alt={item.title}
                  style={{
                    width: '74px',
                    height: '74px',
                    borderRadius: '14px',
                    objectFit: 'cover',
                    backgroundColor: '#F5EBE0',
                    border: '1px solid #E8DCCB',
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#2A140D', margin: 0 }}>
                      {item.title}
                    </h3>
                    {isReviewed && (
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: '800',
                          backgroundColor: '#E7F4E8',
                          color: '#2F6B3A',
                          padding: '2px 8px',
                          borderRadius: '999px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                        }}
                      >
                        <CheckCircle2 size={11} />
                        Reviewed
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#725D50', marginTop: '3px' }}>
                    {item.variantName} &bull; Qty: {item.quantity} &bull; ₹{item.unitPrice}
                  </div>
                </div>
              </div>

              {/* Review Section */}
              {isReviewed ? (
                /* Already Reviewed State */
                <div
                  style={{
                    backgroundColor: '#F7F3EB',
                    borderRadius: '14px',
                    padding: '1rem 1.25rem',
                    border: '1px solid #CDE5CB',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                    <div style={{ display: 'flex', gap: '2px' }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={16}
                          fill={star <= (item.existingReview?.rating || form.rating) ? '#F59E0B' : 'none'}
                          color={star <= (item.existingReview?.rating || form.rating) ? '#F59E0B' : '#D1D5DB'}
                        />
                      ))}
                    </div>
                    <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#2A140D' }}>
                      {ratingLabels[item.existingReview?.rating || form.rating]}
                    </span>
                  </div>
                  {(item.existingReview?.comment || form.comment) ? (
                    <p style={{ fontSize: '0.86rem', color: '#5A3422', margin: '0.35rem 0 0 0', fontStyle: 'italic', lineHeight: '1.5' }}>
                      "{item.existingReview?.comment || form.comment}"
                    </p>
                  ) : (
                    <p style={{ fontSize: '0.8rem', color: '#8C7766', margin: '0.2rem 0 0 0' }}>
                      Rating submitted. Thank you!
                    </p>
                  )}
                </div>
              ) : (
                /* Interactive Review Form */
                <div style={{ borderTop: '1px solid #F0E6D8', paddingTop: '1.15rem' }}>
                  {/* Star Rating Selector */}
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '800', color: '#5A2E16', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.4rem' }}>
                      Your Rating *
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => handleRatingChange(item.productId, star)}
                            onMouseEnter={() => handleHoverRating(item.productId, star)}
                            onMouseLeave={() => handleHoverRating(item.productId, 0)}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '2px',
                              transition: 'transform 0.15s ease',
                              transform: displayRating >= star ? 'scale(1.15)' : 'scale(1)',
                            }}
                            aria-label={`Rate ${star} stars`}
                          >
                            <Star
                              size={28}
                              fill={displayRating >= star ? '#F59E0B' : '#F3EDE2'}
                              color={displayRating >= star ? '#D97706' : '#C4B5A5'}
                            />
                          </button>
                        ))}
                      </div>
                      <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#2A140D' }}>
                        {ratingLabels[displayRating] || ''}
                      </span>
                    </div>
                  </div>

                  {/* Feedback Comments */}
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '800', color: '#5A2E16', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.4rem' }}>
                      Your Experience (Optional)
                    </label>
                    <textarea
                      value={form.comment}
                      onChange={(e) => handleCommentChange(item.productId, e.target.value)}
                      placeholder="How did you like the taste, aroma, texture, and packaging? Would you recommend it?"
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '0.75rem 0.95rem',
                        borderRadius: '12px',
                        border: '1.5px solid #D8CCB8',
                        fontSize: '0.88rem',
                        fontFamily: 'inherit',
                        backgroundColor: '#FAF7F2',
                        color: '#2A140D',
                        outline: 'none',
                        resize: 'vertical',
                        lineHeight: '1.45',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  {/* Validation Error */}
                  {form.error && (
                    <div style={{ color: '#DC2626', fontSize: '0.8rem', fontWeight: '700', marginBottom: '0.75rem' }}>
                      {form.error}
                    </div>
                  )}

                  {/* Submit Button */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={() => handleSubmitReview(item)}
                      disabled={form.submitting}
                      style={{
                        backgroundColor: '#2F6B3A',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '999px',
                        padding: '0.65rem 1.35rem',
                        fontSize: '0.85rem',
                        fontWeight: '800',
                        cursor: form.submitting ? 'not-allowed' : 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        boxShadow: '0 2px 10px rgba(47, 107, 58, 0.25)',
                        transition: 'all 0.2s',
                        opacity: form.submitting ? 0.7 : 1,
                      }}
                    >
                      {form.submitting ? (
                        <>
                          <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                          <span>Submitting...</span>
                        </>
                      ) : (
                        <>
                          <Send size={14} />
                          <span>Submit Review</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

