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
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 style={{ fontSize: '2.1rem', fontFamily: 'var(--font-serif)', color: 'var(--primary-dark)', fontWeight: '800', margin: '0 0 0.35rem 0' }}>
          Customer Review Moderation
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0, fontWeight: '500' }}>
          Review and moderate customer testimonials and product reviews.
        </p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '30vh', gap: '1rem' }}>
          <RefreshCw size={20} className="animate-spin" color="var(--primary-dark)" />
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: '600' }}>Loading client reviews...</span>
        </div>
      ) : reviews.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {reviews.map((r, idx) => (
            <div 
              key={idx} 
              className="glass-card" 
              style={{ 
                padding: '1.75rem', 
                backgroundColor: '#FFFFFF', 
                borderRadius: '16px', 
                border: '1.5px solid var(--border-color)', 
                boxShadow: '0 4px 20px rgba(56, 20, 35, 0.01)',
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'space-between',
                gap: '1.5rem'
              }}
            >
              <div>
                <div style={{ display: 'flex', color: 'var(--accent-gold)', marginBottom: '0.75rem', gap: '0.1rem' }}>
                  {[...Array(r.rating || 5)].map((_, i) => (
                    <Star key={i} size={14} fill="var(--accent-gold)" color="var(--accent-gold)" />
                  ))}
                </div>
                <p style={{ fontSize: '0.9rem', color: 'var(--primary-dark)', fontStyle: 'italic', margin: 0, lineHeight: '1.6', fontWeight: '500' }}>
                  "{r.comment}"
                </p>
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: '800', fontSize: '0.86rem', color: 'var(--primary-dark)' }}>{r.name}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '600', marginTop: '0.15rem' }}>
                    {r.productName || 'Verified Purchase'}
                  </div>
                </div>
                
                <span 
                  style={{ 
                    fontSize: '0.68rem',
                    fontWeight: '800',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    backgroundColor: 'rgba(39, 76, 55, 0.08)',
                    color: 'var(--accent-olive)',
                    padding: '0.25rem 0.6rem',
                    borderRadius: '6px'
                  }}
                >
                  Approved
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card" style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600', border: '1.5px solid var(--border-color)', borderRadius: '16px', backgroundColor: '#FFFFFF' }}>
          No customer reviews submitted yet.
        </div>
      )}
    </div>
  );
}
