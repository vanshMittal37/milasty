import React, { useState, useEffect } from 'react';
import { Star, CheckCircle, XCircle, Trash2, Edit2, Plus, X, RefreshCw, ShieldAlert, Award, MessageSquare, Image, Check, Eye, EyeOff } from 'lucide-react';
import api from '../../api/axios';
import ConfirmationModal from '../../components/ConfirmationModal';
import { useToast } from '../../context/ToastContext';

export default function AdminReviewList() {
  const { toast } = useToast();

  // Top level main tabs: 'user-reviews' | 'testimonials'
  const [activeMainTab, setActiveMainTab] = useState('user-reviews');

  // Products list for dropdown
  const [products, setProducts] = useState([]);

  // Data Loading
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [loadingTestimonials, setLoadingTestimonials] = useState(true);

  // USER REVIEWS STATES
  const [reviews, setReviews] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'pending', 'approved', 'rejected'
  const [showAddReviewModal, setShowAddReviewModal] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [deleteReviewTargetId, setDeleteReviewTargetId] = useState(null);

  // Add Admin Review Form State
  const [revProductId, setRevProductId] = useState('');
  const [revName, setRevName] = useState('');
  const [revRating, setRevRating] = useState(5);
  const [revComment, setRevComment] = useState('');
  const [revImage, setRevImage] = useState('');
  const [revStatus, setRevStatus] = useState('approved');
  const [revVerified, setRevVerified] = useState(false);
  const [revShowOnProduct, setRevShowOnProduct] = useState(true);
  const [uploadingRevImage, setUploadingRevImage] = useState(false);

  // Edit Review Form State
  const [editRevName, setEditRevName] = useState('');
  const [editRevRating, setEditRevRating] = useState(5);
  const [editRevComment, setEditRevComment] = useState('');
  const [editRevImage, setEditRevImage] = useState('');
  const [editRevStatus, setEditRevStatus] = useState('approved');
  const [editRevVerified, setEditRevVerified] = useState(true);
  const [editRevShowOnProduct, setEditRevShowOnProduct] = useState(true);

  // TESTIMONIALS STATES
  const [testimonials, setTestimonials] = useState([]);
  const [showAddTestimonialModal, setShowAddTestimonialModal] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState(null);
  const [deleteTestimonialTargetId, setDeleteTestimonialTargetId] = useState(null);

  // Add Testimonial Form State
  const [tName, setTName] = useState('');
  const [tRole, setTRole] = useState('Valued Customer');
  const [tRating, setTRating] = useState(5);
  const [tContent, setTContent] = useState('');
  const [tImage, setTImage] = useState('');
  const [tIsPublished, setTIsPublished] = useState(true);
  const [uploadingTImage, setUploadingTImage] = useState(false);

  // Edit Testimonial Form State
  const [editTName, setEditTName] = useState('');
  const [editTRole, setEditTRole] = useState('');
  const [editTRating, setEditTRating] = useState(5);
  const [editTContent, setEditTContent] = useState('');
  const [editTImage, setEditTImage] = useState('');
  const [editTIsPublished, setEditTIsPublished] = useState(true);

  useEffect(() => {
    fetchProducts();
    fetchReviews();
    fetchTestimonials();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products');
      const list = Array.isArray(res.data) ? res.data : (Array.isArray(res.data?.products) ? res.data.products : []);
      setProducts(list);
      if (list.length > 0) {
        setRevProductId(list[0].id || list[0]._id);
      }
    } catch (e) {
      console.warn('Products load error:', e.message);
      setProducts([]);
    }
  };

  const fetchReviews = async () => {
    setLoadingReviews(true);
    try {
      const res = await api.get('/reviews/admin/all');
      const list = Array.isArray(res.data) ? res.data : (Array.isArray(res.data?.reviews) ? res.data.reviews : []);
      setReviews(list);
    } catch (e) {
      toast.error('Unable to fetch product reviews.');
      setReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  };

  const fetchTestimonials = async () => {
    setLoadingTestimonials(true);
    try {
      const res = await api.get('/testimonials/admin/all');
      const list = Array.isArray(res.data) ? res.data : (Array.isArray(res.data?.testimonials) ? res.data.testimonials : []);
      setTestimonials(list);
    } catch (e) {
      toast.error('Unable to fetch testimonials.');
      setTestimonials([]);
    } finally {
      setLoadingTestimonials(false);
    }
  };

  // Image Upload helper
  const handleUploadPhoto = async (e, setImageCallback, setUploadingCallback) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        setUploadingCallback(true);
        const res = await api.post('/upload', { image: reader.result });
        setImageCallback(res.data.url);
        toast.success('Image uploaded successfully.');
      } catch (err) {
        toast.error('Error uploading image.');
      } finally {
        setUploadingCallback(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // 1. CREATE ADMIN PRODUCT REVIEW
  const handleCreateAdminReview = async (e) => {
    e.preventDefault();
    if (!revProductId) {
      toast.error('Please select a product.');
      return;
    }
    try {
      await api.post('/reviews/admin/create', {
        productId: revProductId,
        reviewerName: revName || 'MILASTY Team',
        rating: Number(revRating),
        comment: revComment,
        reviewImageUrl: revImage,
        status: revStatus,
        isVerifiedPurchase: revVerified,
        showOnProduct: revShowOnProduct,
      });
      toast.success('Product review created successfully.');
      setShowAddReviewModal(false);
      setRevName('');
      setRevComment('');
      setRevImage('');
      setRevRating(5);
      fetchReviews();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error creating product review.');
    }
  };

  // 2. UPDATE REVIEW STATUS (APPROVE / REJECT)
  const handleStatusChange = async (id, newStatus) => {
    try {
      await api.put(`/reviews/${id}/status`, { status: newStatus });
      toast.success(`Review set to ${newStatus}.`);
      fetchReviews();
    } catch (e) {
      toast.error('Error updating review status.');
    }
  };

  // 3. TOGGLE SHOW ON PRODUCT
  const handleToggleShowOnProduct = async (review) => {
    const id = review.id || review._id;
    const newVal = !review.showOnProduct;
    try {
      await api.put(`/reviews/${id}`, { showOnProduct: newVal });
      toast.success(newVal ? 'Review will appear on product page.' : 'Review hidden from product page.');
      fetchReviews();
    } catch (e) {
      toast.error('Error updating visibility.');
    }
  };

  // 4. EDIT REVIEW SUBMIT
  const handleUpdateReviewSubmit = async (e) => {
    e.preventDefault();
    if (!editingReview) return;
    const id = editingReview.id || editingReview._id;
    try {
      await api.put(`/reviews/${id}`, {
        reviewerName: editRevName,
        rating: Number(editRevRating),
        comment: editRevComment,
        reviewImageUrl: editRevImage,
        status: editRevStatus,
        isVerifiedPurchase: editRevVerified,
        showOnProduct: editRevShowOnProduct,
      });
      toast.success('Review updated successfully.');
      setEditingReview(null);
      fetchReviews();
    } catch (e) {
      toast.error('Error updating review.');
    }
  };

  // 5. DELETE REVIEW
  const confirmDeleteReview = async () => {
    if (!deleteReviewTargetId) return;
    try {
      await api.delete(`/reviews/${deleteReviewTargetId}`);
      toast.success('Review deleted successfully.');
      setDeleteReviewTargetId(null);
      fetchReviews();
    } catch (e) {
      toast.error('Error deleting review.');
    }
  };

  // 6. CREATE TESTIMONIAL
  const handleCreateTestimonial = async (e) => {
    e.preventDefault();
    if (!tName || !tContent) {
      toast.error('Name and content are required.');
      return;
    }
    try {
      await api.post('/testimonials', {
        name: tName,
        role: tRole,
        rating: Number(tRating),
        content: tContent,
        imageUrl: tImage,
        isPublished: tIsPublished,
      });
      toast.success('Testimonial created successfully.');
      setShowAddTestimonialModal(false);
      setTName('');
      setTRole('Valued Customer');
      setTContent('');
      setTImage('');
      setTRating(5);
      fetchTestimonials();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Error creating testimonial.');
    }
  };

  // 7. TOGGLE TESTIMONIAL VISIBILITY
  const handleToggleTestimonialVisibility = async (testimonial) => {
    const id = testimonial.id || testimonial._id;
    const newVal = !testimonial.isPublished;
    try {
      await api.put(`/testimonials/${id}`, { isPublished: newVal });
      toast.success(newVal ? 'Testimonial published to homepage.' : 'Testimonial hidden from homepage.');
      fetchTestimonials();
    } catch (e) {
      toast.error('Error updating testimonial status.');
    }
  };

  // 8. EDIT TESTIMONIAL SUBMIT
  const handleUpdateTestimonialSubmit = async (e) => {
    e.preventDefault();
    if (!editingTestimonial) return;
    const id = editingTestimonial.id || editingTestimonial._id;
    try {
      await api.put(`/testimonials/${id}`, {
        name: editTName,
        role: editTRole,
        rating: Number(editTRating),
        content: editTContent,
        imageUrl: editTImage,
        isPublished: editTIsPublished,
      });
      toast.success('Testimonial updated successfully.');
      setEditingTestimonial(null);
      fetchTestimonials();
    } catch (e) {
      toast.error('Error updating testimonial.');
    }
  };

  // 9. DELETE TESTIMONIAL
  const confirmDeleteTestimonial = async () => {
    if (!deleteTestimonialTargetId) return;
    try {
      await api.delete(`/testimonials/${deleteTestimonialTargetId}`);
      toast.success('Testimonial deleted successfully.');
      setDeleteTestimonialTargetId(null);
      fetchTestimonials();
    } catch (e) {
      toast.error('Error deleting testimonial.');
    }
  };

  // Filter calculations for user reviews
  const safeReviews = Array.isArray(reviews) ? reviews : [];
  const safeTestimonials = Array.isArray(testimonials) ? testimonials : [];
  const safeProducts = Array.isArray(products) ? products : [];

  const countAll = safeReviews.length;
  const countPending = safeReviews.filter((r) => r.status === 'pending').length;
  const countApproved = safeReviews.filter((r) => r.status === 'approved' || !r.status).length;
  const countRejected = safeReviews.filter((r) => r.status === 'rejected').length;

  const filteredReviews = safeReviews.filter((r) => {
    const st = r.status || 'approved';
    if (filterStatus === 'all') return true;
    return st === filterStatus;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Banner Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.25rem' }}>
        <div>
          <p style={{ fontSize: '0.68rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--admin-text-muted)', margin: '0 0 0.2rem 0' }}>
            Reviews & Testimonials
          </p>
          <h2 style={{ fontSize: 'clamp(1.15rem, 2.5vw, 1.45rem)', fontFamily: 'var(--font-serif)', color: 'var(--admin-text-primary)', fontWeight: '800', margin: 0, lineHeight: '1.25' }}>
            Review Management & Moderation
          </h2>
          <p style={{ color: 'var(--admin-text-secondary)', fontSize: '0.8rem', margin: '0.2rem 0 0 0', fontWeight: '500' }}>
            Moderate real customer product reviews or manage brand-level homepage testimonials.
          </p>
        </div>

        {/* Action Button depending on Active Tab */}
        {activeMainTab === 'user-reviews' ? (
          <button
            onClick={() => setShowAddReviewModal(true)}
            className="admin-btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.1rem', fontSize: '0.82rem' }}
          >
            <Plus size={16} />
            <span>Add Product Review</span>
          </button>
        ) : (
          <button
            onClick={() => setShowAddTestimonialModal(true)}
            className="admin-btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.1rem', fontSize: '0.82rem' }}
          >
            <Plus size={16} />
            <span>Add Testimonial</span>
          </button>
        )}
      </div>

      {/* Main Tabs Navigation */}
      <div style={{ display: 'flex', gap: '0.75rem', borderBottom: '1px solid var(--admin-border-subtle)', paddingBottom: '0.25rem' }}>
        <button
          onClick={() => setActiveMainTab('user-reviews')}
          style={{
            padding: '0.65rem 1.25rem',
            border: 'none',
            backgroundColor: 'transparent',
            color: activeMainTab === 'user-reviews' ? 'var(--admin-accent-gold)' : 'var(--admin-text-muted)',
            borderBottom: activeMainTab === 'user-reviews' ? '2.5px solid var(--admin-accent-gold)' : '2.5px solid transparent',
            fontWeight: '800',
            fontSize: '0.88rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          <MessageSquare size={16} />
          <span>USER REVIEWS ({countAll})</span>
        </button>

        <button
          onClick={() => setActiveMainTab('testimonials')}
          style={{
            padding: '0.65rem 1.25rem',
            border: 'none',
            backgroundColor: 'transparent',
            color: activeMainTab === 'testimonials' ? 'var(--admin-accent-gold)' : 'var(--admin-text-muted)',
            borderBottom: activeMainTab === 'testimonials' ? '2.5px solid var(--admin-accent-gold)' : '2.5px solid transparent',
            fontWeight: '800',
            fontSize: '0.88rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          <Award size={16} />
          <span>HOMEPAGE TESTIMONIALS ({safeTestimonials.length})</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: USER REVIEWS MODERATION                           */}
      {/* ======================================================== */}
      {activeMainTab === 'user-reviews' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Filter Sub-Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
            {[
              { id: 'all', label: `All Reviews (${countAll})` },
              { id: 'pending', label: `Pending (${countPending})` },
              { id: 'approved', label: `Approved (${countApproved})` },
              { id: 'rejected', label: `Rejected (${countRejected})` },
            ].map((f) => {
              const isSel = filterStatus === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setFilterStatus(f.id)}
                  style={{
                    padding: '0.45rem 0.95rem',
                    borderRadius: '999px',
                    border: isSel ? '1px solid var(--admin-accent-gold)' : '1px solid var(--admin-border-subtle)',
                    backgroundColor: isSel ? 'rgba(201, 154, 50, 0.15)' : 'transparent',
                    color: isSel ? 'var(--admin-accent-gold)' : 'var(--admin-text-secondary)',
                    fontSize: '0.78rem',
                    fontWeight: isSel ? '800' : '600',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {f.label}
                </button>
              );
            })}
          </div>

          {/* Loading State */}
          {loadingReviews && (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--admin-text-muted)' }}>
              Loading user reviews from database...
            </div>
          )}

          {/* Reviews List */}
          {!loadingReviews && filteredReviews.length === 0 && (
            <div className="admin-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--admin-text-muted)' }}>
              No reviews found matching status "{filterStatus}".
            </div>
          )}

          {!loadingReviews && filteredReviews.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
              {filteredReviews.map((rev) => {
                const st = rev.status || 'approved';
                const isPending = st === 'pending';
                const isApproved = st === 'approved';
                const isRejected = st === 'rejected';

                return (
                  <div
                    key={rev.id || rev._id}
                    className="admin-card"
                    style={{
                      padding: '1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '1rem',
                      border: isPending ? '1.5px solid var(--admin-accent-gold)' : '1px solid var(--admin-border-subtle)',
                    }}
                  >
                    <div>
                      {/* Product Header */}
                      <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center', marginBottom: '0.85rem', borderBottom: '1px solid var(--admin-border-subtle)', paddingBottom: '0.75rem' }}>
                        <img
                          src={rev.productImage || '/images/image1.jpeg'}
                          alt={rev.productTitle}
                          style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--admin-border-subtle)' }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h4 style={{ fontSize: '0.9rem', color: 'var(--admin-text-primary)', margin: 0, fontWeight: '800', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {rev.productTitle}
                          </h4>
                          <span style={{ fontSize: '0.74rem', color: 'var(--admin-text-muted)' }}>
                            {rev.orderId ? `Order #${rev.orderId}` : 'Direct Customer Review'}
                          </span>
                        </div>
                      </div>

                      {/* Reviewer Details & Rating */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <strong style={{ fontSize: '0.85rem', color: 'var(--admin-text-primary)' }}>{rev.reviewerName}</strong>
                          {rev.isVerifiedPurchase && (
                            <span style={{ fontSize: '0.68rem', backgroundColor: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.3)', padding: '0.1rem 0.4rem', borderRadius: '999px', fontWeight: '800' }}>
                              ✓ Verified
                            </span>
                          )}
                        </div>

                        {/* Status Badge */}
                        <span
                          style={{
                            fontSize: '0.68rem',
                            fontWeight: '800',
                            textTransform: 'uppercase',
                            padding: '0.15rem 0.5rem',
                            borderRadius: '999px',
                            backgroundColor: isApproved ? 'rgba(34, 197, 94, 0.15)' : (isPending ? 'rgba(201, 154, 50, 0.15)' : 'rgba(239, 68, 68, 0.15)'),
                            color: isApproved ? '#22c55e' : (isPending ? 'var(--admin-accent-gold)' : '#ef4444'),
                            border: isApproved ? '1px solid rgba(34, 197, 94, 0.3)' : (isPending ? '1px solid var(--admin-accent-gold)' : '1px solid rgba(239, 68, 68, 0.3)'),
                          }}
                        >
                          {st}
                        </span>
                      </div>

                      {/* Rating Stars */}
                      <div style={{ display: 'flex', color: 'var(--admin-accent-gold)', marginBottom: '0.5rem' }}>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} size={14} fill={s <= rev.rating ? 'var(--admin-accent-gold)' : 'none'} color="var(--admin-accent-gold)" />
                        ))}
                      </div>

                      {/* Comment */}
                      {rev.comment && (
                        <p style={{ fontSize: '0.84rem', color: 'var(--admin-text-secondary)', lineHeight: '1.45', margin: '0 0 0.5rem 0' }}>
                          "{rev.comment}"
                        </p>
                      )}

                      {/* Attached Photo */}
                      {rev.reviewImageUrl && (
                        <img
                          src={rev.reviewImageUrl}
                          alt="Attached review photo"
                          style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--admin-border-subtle)', marginTop: '0.35rem' }}
                        />
                      )}
                    </div>

                    {/* Card Actions Footer */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid var(--admin-border-subtle)' }}>
                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        {!isApproved && (
                          <button
                            onClick={() => handleStatusChange(rev.id, 'approved')}
                            style={{ padding: '0.3rem 0.6rem', backgroundColor: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: '6px', fontSize: '0.72rem', fontWeight: '800', cursor: 'pointer' }}
                          >
                            Approve
                          </button>
                        )}

                        {!isRejected && (
                          <button
                            onClick={() => handleStatusChange(rev.id, 'rejected')}
                            style={{ padding: '0.3rem 0.6rem', backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', fontSize: '0.72rem', fontWeight: '800', cursor: 'pointer' }}
                          >
                            Reject
                          </button>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                        {/* Toggle Show on product */}
                        <button
                          onClick={() => handleToggleShowOnProduct(rev)}
                          title={rev.showOnProduct ? 'Visible on product page' : 'Hidden from product page'}
                          style={{ background: 'none', border: 'none', color: rev.showOnProduct ? 'var(--admin-accent-gold)' : 'var(--admin-text-muted)', cursor: 'pointer', padding: '0.25rem' }}
                        >
                          {rev.showOnProduct ? <Eye size={15} /> : <EyeOff size={15} />}
                        </button>

                        <button
                          onClick={() => {
                            setEditingReview(rev);
                            setEditRevName(rev.reviewerName || '');
                            setEditRevRating(rev.rating || 5);
                            setEditRevComment(rev.comment || '');
                            setEditRevImage(rev.reviewImageUrl || '');
                            setEditRevStatus(rev.status || 'approved');
                            setEditRevVerified(rev.isVerifiedPurchase);
                            setEditRevShowOnProduct(rev.showOnProduct);
                          }}
                          style={{ background: 'none', border: 'none', color: 'var(--admin-text-secondary)', cursor: 'pointer', padding: '0.25rem' }}
                        >
                          <Edit2 size={15} />
                        </button>

                        <button
                          onClick={() => setDeleteReviewTargetId(rev.id)}
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.25rem' }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: HOMEPAGE TESTIMONIALS                              */}
      {/* ======================================================== */}
      {activeMainTab === 'testimonials' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {loadingTestimonials && (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--admin-text-muted)' }}>
              Loading testimonials from database...
            </div>
          )}

          {!loadingTestimonials && testimonials.length === 0 && (
            <div className="admin-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--admin-text-muted)' }}>
              No brand testimonials created yet. Click "Add Testimonial" above.
            </div>
          )}

          {!loadingTestimonials && testimonials.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
              {testimonials.map((testim) => (
                <div
                  key={testim.id || testim._id}
                  className="admin-card"
                  style={{
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '1rem',
                  }}
                >
                  <div>
                    {/* Top Info */}
                    <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <img
                        src={testim.imageUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80'}
                        alt={testim.name}
                        style={{ width: '44px', height: '44px', objectFit: 'cover', borderRadius: '50%', border: '1.5px solid var(--admin-border-subtle)' }}
                      />
                      <div>
                        <strong style={{ fontSize: '0.92rem', color: 'var(--admin-text-primary)', display: 'block' }}>{testim.name}</strong>
                        <span style={{ fontSize: '0.76rem', color: 'var(--admin-accent-gold)', fontWeight: '600' }}>{testim.role}</span>
                      </div>
                    </div>

                    {/* Star Rating */}
                    <div style={{ display: 'flex', color: 'var(--admin-accent-gold)', marginBottom: '0.5rem' }}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} size={14} fill={s <= testim.rating ? 'var(--admin-accent-gold)' : 'none'} color="var(--admin-accent-gold)" />
                      ))}
                    </div>

                    {/* Testimonial Content */}
                    <p style={{ fontSize: '0.85rem', color: 'var(--admin-text-secondary)', fontStyle: 'italic', lineHeight: '1.5', margin: 0 }}>
                      "{testim.content}"
                    </p>
                  </div>

                  {/* Actions & Homepage Visibility */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid var(--admin-border-subtle)' }}>
                    <button
                      onClick={() => handleToggleTestimonialVisibility(testim)}
                      style={{
                        padding: '0.3rem 0.65rem',
                        borderRadius: '999px',
                        fontSize: '0.72rem',
                        fontWeight: '800',
                        cursor: 'pointer',
                        backgroundColor: testim.isPublished ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                        color: testim.isPublished ? '#22c55e' : 'var(--admin-text-muted)',
                        border: testim.isPublished ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid var(--admin-border-subtle)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                      }}
                    >
                      {testim.isPublished ? <Eye size={12} /> : <EyeOff size={12} />}
                      <span>{testim.isPublished ? 'Show on Homepage ON' : 'Homepage OFF'}</span>
                    </button>

                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      <button
                        onClick={() => {
                          setEditingTestimonial(testim);
                          setEditTName(testim.name || '');
                          setEditTRole(testim.role || '');
                          setEditTRating(testim.rating || 5);
                          setEditTContent(testim.content || '');
                          setEditTImage(testim.imageUrl || '');
                          setEditTIsPublished(testim.isPublished);
                        }}
                        style={{ background: 'none', border: 'none', color: 'var(--admin-text-secondary)', cursor: 'pointer', padding: '0.25rem' }}
                      >
                        <Edit2 size={15} />
                      </button>

                      <button
                        onClick={() => setDeleteTestimonialTargetId(testim.id)}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.25rem' }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: ADD ADMIN PRODUCT REVIEW */}
      {showAddReviewModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="admin-card" style={{ width: '100%', maxWidth: '520px', padding: '1.75rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.15rem', color: 'var(--admin-text-primary)', margin: 0, fontWeight: '800' }}>Add Product Review</h3>
              <button onClick={() => setShowAddReviewModal(false)} style={{ background: 'none', border: 'none', color: 'var(--admin-text-muted)', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            <form onSubmit={handleCreateAdminReview} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '0.3rem' }}>Select Product *</label>
                <select
                  value={revProductId}
                  onChange={(e) => setRevProductId(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', backgroundColor: 'var(--admin-bg-surface)', border: '1px solid var(--admin-border-subtle)', color: 'var(--admin-text-primary)' }}
                >
                  {safeProducts.map((p) => (
                    <option key={p.id || p._id} value={p.id || p._id}>{p.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '0.3rem' }}>Reviewer Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Priya Sharma"
                  value={revName}
                  onChange={(e) => setRevName(e.target.value)}
                  required
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', backgroundColor: 'var(--admin-bg-surface)', border: '1px solid var(--admin-border-subtle)', color: 'var(--admin-text-primary)' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '0.3rem' }}>Rating (1-5 Stars)</label>
                <select
                  value={revRating}
                  onChange={(e) => setRevRating(Number(e.target.value))}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', backgroundColor: 'var(--admin-bg-surface)', border: '1px solid var(--admin-border-subtle)', color: 'var(--admin-text-primary)' }}
                >
                  <option value={5}>★★★★★ 5 Stars</option>
                  <option value={4}>★★★★☆ 4 Stars</option>
                  <option value={3}>★★★☆☆ 3 Stars</option>
                  <option value={2}>★★☆☆☆ 2 Stars</option>
                  <option value={1}>★☆☆☆☆ 1 Star</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '0.3rem' }}>Review Description</label>
                <textarea
                  rows={3}
                  placeholder="Write review text..."
                  value={revComment}
                  onChange={(e) => setRevComment(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', backgroundColor: 'var(--admin-bg-surface)', border: '1px solid var(--admin-border-subtle)', color: 'var(--admin-text-primary)', fontFamily: 'inherit' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '0.3rem' }}>Review Image (Optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleUploadPhoto(e, setRevImage, setUploadingRevImage)}
                  style={{ fontSize: '0.8rem', color: 'var(--admin-text-secondary)' }}
                />
                {uploadingRevImage && <span style={{ fontSize: '0.75rem', color: 'var(--admin-accent-gold)' }}>Uploading image...</span>}
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <label style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--admin-text-primary)' }}>
                  <input type="checkbox" checked={revVerified} onChange={(e) => setRevVerified(e.target.checked)} />
                  Verified Purchase Badge
                </label>
                <label style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--admin-text-primary)' }}>
                  <input type="checkbox" checked={revShowOnProduct} onChange={(e) => setRevShowOnProduct(e.target.checked)} />
                  Show on Product Page
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowAddReviewModal(false)} className="admin-btn-secondary" style={{ padding: '0.5rem 1rem' }}>Cancel</button>
                <button type="submit" className="admin-btn-primary" style={{ padding: '0.5rem 1.25rem' }}>Create Review</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT ADMIN PRODUCT REVIEW */}
      {editingReview && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="admin-card" style={{ width: '100%', maxWidth: '520px', padding: '1.75rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.15rem', color: 'var(--admin-text-primary)', margin: 0, fontWeight: '800' }}>Edit Review</h3>
              <button onClick={() => setEditingReview(null)} style={{ background: 'none', border: 'none', color: 'var(--admin-text-muted)', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            <form onSubmit={handleUpdateReviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '0.3rem' }}>Reviewer Name</label>
                <input
                  type="text"
                  value={editRevName}
                  onChange={(e) => setEditRevName(e.target.value)}
                  required
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', backgroundColor: 'var(--admin-bg-surface)', border: '1px solid var(--admin-border-subtle)', color: 'var(--admin-text-primary)' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '0.3rem' }}>Rating</label>
                <select
                  value={editRevRating}
                  onChange={(e) => setEditRevRating(Number(e.target.value))}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', backgroundColor: 'var(--admin-bg-surface)', border: '1px solid var(--admin-border-subtle)', color: 'var(--admin-text-primary)' }}
                >
                  <option value={5}>★★★★★ 5 Stars</option>
                  <option value={4}>★★★★☆ 4 Stars</option>
                  <option value={3}>★★★☆☆ 3 Stars</option>
                  <option value={2}>★★☆☆☆ 2 Stars</option>
                  <option value={1}>★☆☆☆☆ 1 Star</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '0.3rem' }}>Review Text</label>
                <textarea
                  rows={3}
                  value={editRevComment}
                  onChange={(e) => setEditRevComment(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', backgroundColor: 'var(--admin-bg-surface)', border: '1px solid var(--admin-border-subtle)', color: 'var(--admin-text-primary)', fontFamily: 'inherit' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '0.3rem' }}>Status</label>
                <select
                  value={editRevStatus}
                  onChange={(e) => setEditRevStatus(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', backgroundColor: 'var(--admin-bg-surface)', border: '1px solid var(--admin-border-subtle)', color: 'var(--admin-text-primary)' }}
                >
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <label style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--admin-text-primary)' }}>
                  <input type="checkbox" checked={editRevVerified} onChange={(e) => setEditRevVerified(e.target.checked)} />
                  Verified Purchase Badge
                </label>
                <label style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--admin-text-primary)' }}>
                  <input type="checkbox" checked={editRevShowOnProduct} onChange={(e) => setEditRevShowOnProduct(e.target.checked)} />
                  Show on Product Page
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setEditingReview(null)} className="admin-btn-secondary" style={{ padding: '0.5rem 1rem' }}>Cancel</button>
                <button type="submit" className="admin-btn-primary" style={{ padding: '0.5rem 1.25rem' }}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ADD TESTIMONIAL */}
      {showAddTestimonialModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="admin-card" style={{ width: '100%', maxWidth: '520px', padding: '1.75rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.15rem', color: 'var(--admin-text-primary)', margin: 0, fontWeight: '800' }}>Add Homepage Testimonial</h3>
              <button onClick={() => setShowAddTestimonialModal(false)} style={{ background: 'none', border: 'none', color: 'var(--admin-text-muted)', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            <form onSubmit={handleCreateTestimonial} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '0.3rem' }}>Customer Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Sunita Rao"
                  value={tName}
                  onChange={(e) => setTName(e.target.value)}
                  required
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', backgroundColor: 'var(--admin-bg-surface)', border: '1px solid var(--admin-border-subtle)', color: 'var(--admin-text-primary)' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '0.3rem' }}>Role / Description</label>
                <input
                  type="text"
                  placeholder="e.g. Nutritionist & Wellness Coach"
                  value={tRole}
                  onChange={(e) => setTRole(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', backgroundColor: 'var(--admin-bg-surface)', border: '1px solid var(--admin-border-subtle)', color: 'var(--admin-text-primary)' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '0.3rem' }}>Rating</label>
                <select
                  value={tRating}
                  onChange={(e) => setTRating(Number(e.target.value))}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', backgroundColor: 'var(--admin-bg-surface)', border: '1px solid var(--admin-border-subtle)', color: 'var(--admin-text-primary)' }}
                >
                  <option value={5}>★★★★★ 5 Stars</option>
                  <option value={4}>★★★★☆ 4 Stars</option>
                  <option value={3}>★★★☆☆ 3 Stars</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '0.3rem' }}>Testimonial Text *</label>
                <textarea
                  rows={3}
                  placeholder="Enter testimonial content..."
                  value={tContent}
                  onChange={(e) => setTContent(e.target.value)}
                  required
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', backgroundColor: 'var(--admin-bg-surface)', border: '1px solid var(--admin-border-subtle)', color: 'var(--admin-text-primary)', fontFamily: 'inherit' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '0.3rem' }}>Photo (Optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleUploadPhoto(e, setTImage, setUploadingTImage)}
                  style={{ fontSize: '0.8rem', color: 'var(--admin-text-secondary)' }}
                />
                {uploadingTImage && <span style={{ fontSize: '0.75rem', color: 'var(--admin-accent-gold)' }}>Uploading photo...</span>}
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--admin-text-primary)' }}>
                  <input type="checkbox" checked={tIsPublished} onChange={(e) => setTIsPublished(e.target.checked)} />
                  Show on Homepage ON
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowAddTestimonialModal(false)} className="admin-btn-secondary" style={{ padding: '0.5rem 1rem' }}>Cancel</button>
                <button type="submit" className="admin-btn-primary" style={{ padding: '0.5rem 1.25rem' }}>Save Testimonial</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: EDIT TESTIMONIAL */}
      {editingTestimonial && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="admin-card" style={{ width: '100%', maxWidth: '520px', padding: '1.75rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.15rem', color: 'var(--admin-text-primary)', margin: 0, fontWeight: '800' }}>Edit Testimonial</h3>
              <button onClick={() => setEditingTestimonial(null)} style={{ background: 'none', border: 'none', color: 'var(--admin-text-muted)', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            <form onSubmit={handleUpdateTestimonialSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '0.3rem' }}>Customer Name</label>
                <input
                  type="text"
                  value={editTName}
                  onChange={(e) => setEditTName(e.target.value)}
                  required
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', backgroundColor: 'var(--admin-bg-surface)', border: '1px solid var(--admin-border-subtle)', color: 'var(--admin-text-primary)' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '0.3rem' }}>Role</label>
                <input
                  type="text"
                  value={editTRole}
                  onChange={(e) => setEditTRole(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', backgroundColor: 'var(--admin-bg-surface)', border: '1px solid var(--admin-border-subtle)', color: 'var(--admin-text-primary)' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '0.3rem' }}>Testimonial Text</label>
                <textarea
                  rows={3}
                  value={editTContent}
                  onChange={(e) => setEditTContent(e.target.value)}
                  required
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', backgroundColor: 'var(--admin-bg-surface)', border: '1px solid var(--admin-border-subtle)', color: 'var(--admin-text-primary)', fontFamily: 'inherit' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--admin-text-primary)' }}>
                  <input type="checkbox" checked={editTIsPublished} onChange={(e) => setEditTIsPublished(e.target.checked)} />
                  Show on Homepage ON
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setEditingTestimonial(null)} className="admin-btn-secondary" style={{ padding: '0.5rem 1rem' }}>Cancel</button>
                <button type="submit" className="admin-btn-primary" style={{ padding: '0.5rem 1.25rem' }}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL FOR DELETE REVIEW */}
      <ConfirmationModal
        isOpen={Boolean(deleteReviewTargetId)}
        onClose={() => setDeleteReviewTargetId(null)}
        onConfirm={confirmDeleteReview}
        title="Delete Review?"
        message="Are you sure you want to permanently delete this product review? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
      />

      {/* CONFIRMATION MODAL FOR DELETE TESTIMONIAL */}
      <ConfirmationModal
        isOpen={Boolean(deleteTestimonialTargetId)}
        onClose={() => setDeleteTestimonialTargetId(null)}
        onConfirm={confirmDeleteTestimonial}
        title="Delete Testimonial?"
        message="Are you sure you want to permanently delete this brand testimonial? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
}
