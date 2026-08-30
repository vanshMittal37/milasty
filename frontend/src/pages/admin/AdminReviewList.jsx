import React, { useState, useEffect } from 'react';
import { Star, CheckCircle, Trash2, RefreshCw } from 'lucide-react';
import api from '../../api/axios';

export default function AdminReviewList() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ borderBottom: '1px solid var(--admin-border)', paddingBottom: '1rem', marginBottom: '1rem' }}>
        <span style={{ fontSize: '0.68rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--admin-text-muted)', letterSpacing: '0.05em' }}>
          Reviews
        </span>
        <h1 style={{ fontSize: 'clamp(28px, 4.5vw, 40px)', fontFamily: 'var(--font-serif)', color: 'var(--admin-text-primary)', fontWeight: '800', margin: '0.15rem 0 0.35rem 0', lineHeight: '1.2' }}>
          Customer Review Moderation
        </h1>
        <p style={{ color: 'var(--admin-text-secondary)', fontSize: '0.88rem', margin: 0, fontWeight: '500' }}>
          Review and moderate customer testimonials and product reviews.
        </p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '30vh', gap: '1rem' }}>
          <RefreshCw size={20} className="animate-spin" color="var(--admin-accent)" />
          <span style={{ fontSize: '0.82rem', color: 'var(--admin-text-muted)', fontWeight: '600' }}>Loading client reviews...</span>
        </div>
      ) : reviews.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {reviews.map((r, idx) => (
            <div 
              key={idx} 
              className="admin-card admin-card-hover" 
              style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'space-between',
                gap: '1.25rem'
              }}
            >
              <div>
                <div style={{ display: 'flex', color: 'var(--admin-accent-gold)', marginBottom: '0.75rem', gap: '0.15rem' }}>
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      size={15} 
                      fill={i < (r.rating || 5) ? 'var(--admin-accent-gold)' : 'none'} 
                      color={i < (r.rating || 5) ? 'var(--admin-accent-gold)' : 'var(--admin-text-muted)'} 
                    />
                  ))}
                </div>
                <p style={{ fontStyle: 'italic', fontSize: '0.9rem', color: 'var(--admin-text-primary)', margin: '0 0 1rem 0', lineHeight: '1.5' }}>
                  "{r.comment || r.text || 'Great product quality and fast delivery!'}"
                </p>
                <div style={{ fontWeight: '800', fontSize: '0.88rem', color: 'var(--admin-text-primary)' }}>
                  {r.name || r.user || 'Customer'}
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--admin-text-muted)', marginTop: '0.2rem' }}>
                  {r.role || r.product || 'Verified Customer'}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--admin-border)', paddingTop: '0.85rem' }}>
                <span className="admin-badge admin-badge-success">
                  <CheckCircle size={12} /> Approved
                </span>
                <span style={{ fontSize: '0.74rem', color: 'var(--admin-text-muted)', fontWeight: '600' }}>
                  {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : 'Verified'}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="admin-empty-state">
          <div className="admin-empty-icon">
            <Star size={24} />
          </div>
          <h3 style={{ fontSize: '1.1rem', color: 'var(--admin-text-primary)', margin: 0, fontWeight: '800' }}>No customer reviews</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--admin-text-muted)', margin: 0 }}>Customer feedback and reviews will appear here for moderation.</p>
        </div>
      )}
    </div>
  );
}
