import React, { useState, useEffect } from 'react';
import { Star, CheckCircle, XCircle, Trash2, Edit2, Plus, X, RefreshCw, ShieldAlert, Award } from 'lucide-react';
import api from '../../api/axios';

export default function AdminReviewList() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingReview, setEditingReview] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Create Form States
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [status, setStatus] = useState('approved');
  const [isVerified, setIsVerified] = useState(true);

  // Edit Form States
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState('');
  const [editStatus, setEditStatus] = useState('approved');
  const [editIsVerified, setEditIsVerified] = useState(true);

  // Filter State
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reviews');
      setReviews(res.data || []);
    } catch (e) {
      console.error('Error fetching reviews:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReview = async (e) => {
    e.preventDefault();
    try {
      await api.post('/reviews', {
        name,
        email,
        rating: Number(rating),
        comment,
        isVerified,
        status,
      });
      setName('');
      setEmail('');
      setRating(5);
      setComment('');
      setStatus('approved');
      setIsVerified(true);
      setShowAddForm(false);
      fetchReviews();
    } catch (e) {
      alert('Error creating review: ' + (e.response?.data?.message || e.message));
    }
  };

  const handleUpdateReview = async (e) => {
    e.preventDefault();
    if (!editingReview) return;
    try {
      const id = editingReview.id || editingReview._id;
      await api.put(`/reviews/${id}`, {
        name: editName,
        email: editEmail,
        rating: Number(editRating),
        comment: editComment,
        status: editStatus,
        isVerified: editIsVerified,
      });
      setEditingReview(null);
      fetchReviews();
    } catch (e) {
      alert('Error updating review: ' + (e.response?.data?.message || e.message));
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await api.put(`/reviews/${id}`, { status: newStatus });
      fetchReviews();
    } catch (e) {
      alert('Error updating review status: ' + (e.response?.data?.message || e.message));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this review?')) {
      try {
        await api.delete(`/reviews/${id}`);
        fetchReviews();
      } catch (e) {
        alert('Error deleting review: ' + (e.response?.data?.message || e.message));
      }
    }
  };

  const startEdit = (review) => {
    setEditingReview(review);
    setEditName(review.name || '');
    setEditEmail(review.email || '');
    setEditRating(review.rating || 5);
    setEditComment(review.comment || review.text || '');
    setEditStatus(review.status || 'approved');
    setEditIsVerified(review.is_verified || review.isVerified || false);
  };

  const filteredReviews = reviews.filter((r) => {
    const currentStatus = r.status || 'approved';
    if (filterStatus === 'all') return true;
    return currentStatus === filterStatus;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.25rem' }}>
        <div>
          <p style={{ fontSize: '0.68rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--admin-text-muted)', margin: '0 0 0.2rem 0' }}>
            Reviews & Faq
          </p>
          <h2 style={{ fontSize: 'clamp(1.15rem, 2.5vw, 1.45rem)', fontFamily: 'var(--font-serif)', color: 'var(--admin-text-primary)', fontWeight: '800', margin: 0, lineHeight: '1.25' }}>
            Review & Testimonial Moderation
          </h2>
          <p style={{ color: 'var(--admin-text-secondary)', fontSize: '0.8rem', margin: '0.2rem 0 0 0', fontWeight: '500' }}>
            Moderate customer feedback or manually add verified brand testimonials.
          </p>
        </div>
        <button
          onClick={() => { setShowAddForm(!showAddForm); setEditingReview(null); }}
          className="admin-btn-primary"
          style={{ padding: '0.55rem 1.15rem' }}
        >
          {showAddForm ? <X size={15} /> : <Plus size={15} />}
          <span>{showAddForm ? 'Close Form' : 'Add Testimonial'}</span>
        </button>
      </div>

      {/* Add Review Card Form */}
      {showAddForm && (
        <div className="admin-card animate-fadeIn">
          <h3 style={{ fontSize: '1.05rem', fontFamily: 'var(--font-serif)', color: 'var(--admin-text-primary)', fontWeight: '800', marginBottom: '1.25rem', marginTop: 0 }}>
            Create Verified Testimonial
          </h3>
          <form onSubmit={handleCreateReview} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <div>
                <label className="admin-input-label">Customer Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Priyal Sharma"
                  className="admin-input"
                />
              </div>
              <div>
                <label className="admin-input-label">Email (Optional)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. priyal@example.com"
                  className="admin-input"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
              <div>
                <label className="admin-input-label">Rating Score (1-5) *</label>
                <select
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                  className="admin-input"
                >
                  <option value={5}>5 Stars (Excellent)</option>
                  <option value={4}>4 Stars (Very Good)</option>
                  <option value={3}>3 Stars (Average)</option>
                  <option value={2}>2 Stars (Below Avg)</option>
                  <option value={1}>1 Star (Poor)</option>
                </select>
              </div>
              <div>
                <label className="admin-input-label">Status *</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="admin-input"
                >
                  <option value="approved">Approved (Visible)</option>
                  <option value="pending">Pending Review</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div>
                <label className="admin-input-label">Verified Customer *</label>
                <select
                  value={isVerified ? 'yes' : 'no'}
                  onChange={(e) => setIsVerified(e.target.value === 'yes')}
                  className="admin-input"
                >
                  <option value="yes">Verified Purchase (Checkmark)</option>
                  <option value="no">Unverified/Guest Feedback</option>
                </select>
              </div>
            </div>

            <div>
              <label className="admin-input-label">Review / Comment *</label>
              <textarea
                required
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Write the customer's comments or custom brand testimonial content..."
                className="admin-input"
                style={{ resize: 'vertical', fontFamily: 'inherit' }}
              />
            </div>

            <button type="submit" className="admin-btn-primary" style={{ alignSelf: 'flex-start', padding: '0.6rem 1.75rem' }}>
              <Plus size={15} /> Save Testimonial
            </button>
          </form>
        </div>
      )}

      {/* Edit Review Card Form */}
      {editingReview && (
        <div className="admin-card animate-fadeIn" style={{ borderColor: 'var(--admin-accent)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontFamily: 'var(--font-serif)', color: 'var(--admin-text-primary)', fontWeight: '800', margin: 0 }}>
              Edit Review Details
            </h3>
            <button onClick={() => setEditingReview(null)} className="admin-icon-btn">
              <X size={16} />
            </button>
          </div>
          <form onSubmit={handleUpdateReview} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <div>
                <label className="admin-input-label">Customer Name *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="admin-input"
                />
              </div>
              <div>
                <label className="admin-input-label">Email</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="admin-input"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
              <div>
                <label className="admin-input-label">Rating Score (1-5) *</label>
                <select
                  value={editRating}
                  onChange={(e) => setEditRating(Number(e.target.value))}
                  className="admin-input"
                >
                  <option value={5}>5 Stars</option>
                  <option value={4}>4 Stars</option>
                  <option value={3}>3 Stars</option>
                  <option value={2}>2 Stars</option>
                  <option value={1}>1 Star</option>
                </select>
              </div>
              <div>
                <label className="admin-input-label">Status *</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="admin-input"
                >
                  <option value="approved">Approved (Visible)</option>
                  <option value="pending">Pending Review</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div>
                <label className="admin-input-label">Verified *</label>
                <select
                  value={editIsVerified ? 'yes' : 'no'}
                  onChange={(e) => setEditIsVerified(e.target.value === 'yes')}
                  className="admin-input"
                >
                  <option value="yes">Verified Purchase</option>
                  <option value="no">Guest Feedback</option>
                </select>
              </div>
            </div>

            <div>
              <label className="admin-input-label">Review Comment *</label>
              <textarea
                required
                rows={3}
                value={editComment}
                onChange={(e) => setEditComment(e.target.value)}
                className="admin-input"
                style={{ resize: 'vertical', fontFamily: 'inherit' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button type="submit" className="admin-btn-primary" style={{ padding: '0.6rem 1.75rem' }}>
                Save Changes
              </button>
              <button type="button" onClick={() => setEditingReview(null)} className="admin-btn-secondary" style={{ padding: '0.6rem 1.25rem' }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter Bar */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', borderBottom: '1px solid var(--admin-border)', paddingBottom: '1rem' }}>
        {[
          { label: 'All Reviews', val: 'all' },
          { label: 'Approved', val: 'approved' },
          { label: 'Pending', val: 'pending' },
          { label: 'Rejected', val: 'rejected' },
        ].map((tab) => (
          <button
            key={tab.val}
            onClick={() => setFilterStatus(tab.val)}
            style={{
              padding: '0.45rem 1rem',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: '700',
              cursor: 'pointer',
              border: filterStatus === tab.val ? '1px solid var(--admin-accent)' : '1px solid var(--admin-border)',
              backgroundColor: filterStatus === tab.val ? 'rgba(143, 175, 91, 0.1)' : 'transparent',
              color: filterStatus === tab.val ? 'var(--admin-accent)' : 'var(--admin-text-secondary)',
              transition: 'all 0.2s ease',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '30vh', gap: '1rem' }}>
          <RefreshCw size={20} className="animate-spin" color="var(--admin-accent)" />
          <span style={{ fontSize: '0.82rem', color: 'var(--admin-text-muted)', fontWeight: '600' }}>Loading database reviews...</span>
        </div>
      ) : filteredReviews.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {filteredReviews.map((r) => {
            const id = r.id || r._id;
            const currentStatus = r.status || 'approved';
            const isVerifiedPurchase = r.is_verified || r.isVerified;

            return (
              <div
                key={id}
                className="admin-card admin-card-hover"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '1.25rem',
                  position: 'relative',
                  borderLeft: currentStatus === 'pending'
                    ? '3px solid #D8B84A'
                    : currentStatus === 'rejected'
                    ? '3px solid var(--admin-danger)'
                    : '1px solid var(--admin-border)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', color: '#D8B84A', gap: '0.15rem' }}>
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={14}
                          fill={i < (r.rating || 5) ? '#D8B84A' : 'none'}
                          color={i < (r.rating || 5) ? '#D8B84A' : '#929B94'}
                        />
                      ))}
                    </div>
                    {isVerifiedPurchase && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.68rem', color: 'var(--admin-accent)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        <Award size={12} /> Verified Purchase
                      </span>
                    )}
                  </div>

                  <p style={{ fontStyle: 'italic', fontSize: '0.88rem', color: '#F0F2ED', margin: '0 0 1rem 0', lineHeight: '1.5' }}>
                    "{r.comment || r.text || 'No comment provided'}"
                  </p>

                  <div style={{ fontWeight: '800', fontSize: '0.88rem', color: '#FFFFFF' }}>
                    {r.name || 'Customer'}
                  </div>
                  {r.email && (
                    <div style={{ fontSize: '0.74rem', color: '#AEB6AE', marginTop: '0.15rem' }}>
                      {r.email}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderTop: '1px solid var(--admin-border)', paddingTop: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      {currentStatus === 'approved' && (
                        <span className="admin-badge admin-badge-success">
                          <CheckCircle size={10} /> Approved
                        </span>
                      )}
                      {currentStatus === 'pending' && (
                        <span className="admin-badge" style={{ backgroundColor: 'rgba(216, 184, 74, 0.12)', color: '#D8B84A', border: '1px solid rgba(216, 184, 74, 0.25)' }}>
                          <RefreshCw size={10} className="animate-spin" /> Pending Review
                        </span>
                      )}
                      {currentStatus === 'rejected' && (
                        <span className="admin-badge" style={{ backgroundColor: 'rgba(220, 95, 95, 0.12)', color: 'var(--admin-danger)', border: '1px solid rgba(220, 95, 95, 0.25)' }}>
                          <XCircle size={10} /> Rejected
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--admin-text-muted)', fontWeight: '600' }}>
                      {r.created_at ? new Date(r.created_at).toLocaleDateString() : 'Verified'}
                    </span>
                  </div>

                  {/* Moderation Actions */}
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
                    {currentStatus !== 'approved' && (
                      <button
                        onClick={() => handleStatusChange(id, 'approved')}
                        className="admin-btn-secondary"
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', gap: '0.25rem', borderColor: 'rgba(143, 175, 91, 0.4)' }}
                        title="Approve Review"
                      >
                        <CheckCircle size={12} color="var(--admin-accent)" /> Approve
                      </button>
                    )}
                    {currentStatus !== 'rejected' && (
                      <button
                        onClick={() => handleStatusChange(id, 'rejected')}
                        className="admin-btn-secondary"
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', gap: '0.25rem', borderColor: 'rgba(220, 95, 95, 0.4)' }}
                        title="Reject Review"
                      >
                        <XCircle size={12} color="var(--admin-danger)" /> Reject
                      </button>
                    )}
                    <button
                      onClick={() => startEdit(r)}
                      className="admin-icon-btn"
                      title="Edit Review Details"
                      style={{ padding: '0.45rem', backgroundColor: 'rgba(255,255,255,0.03)' }}
                    >
                      <Edit2 size={13} color="var(--admin-text-secondary)" />
                    </button>
                    <button
                      onClick={() => handleDelete(id)}
                      className="admin-icon-btn"
                      title="Delete Review"
                      style={{ padding: '0.45rem', backgroundColor: 'rgba(255,255,255,0.03)', color: 'var(--admin-danger)' }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="admin-empty-state">
          <div className="admin-empty-icon">
            <Star size={24} />
          </div>
          <h3 style={{ fontSize: '1.1rem', color: 'var(--admin-text-primary)', margin: 0, fontWeight: '800' }}>
            No matching reviews
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--admin-text-muted)', margin: 0 }}>
            There are no reviews matching the status filter "{filterStatus}".
          </p>
        </div>
      )}
    </div>
  );
}
