import React from 'react';
import { Star, CheckCircle, Quote } from 'lucide-react';

export default function ReviewCard({ review }) {
  return (
    <div
      className="glass-card"
      style={{
        padding: '1.75rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
        position: 'relative',
      }}
    >
      <Quote
        size={36}
        color="rgba(200, 155, 60, 0.2)"
        style={{ position: 'absolute', top: '1.25rem', right: '1.25rem' }}
      />
      <div>
        <div style={{ display: 'flex', color: '#C89B3C', marginBottom: '0.75rem' }}>
          {[...Array(review.rating || 5)].map((_, i) => (
            <Star key={i} size={16} fill="#C89B3C" color="#C89B3C" />
          ))}
        </div>
        <p
          style={{
            fontSize: '0.92rem',
            color: '#4A3525',
            fontStyle: 'italic',
            lineHeight: '1.6',
            marginBottom: '1.25rem',
          }}
        >
          "{review.comment}"
        </p>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '1rem',
          borderTop: '1px solid #E2D7C7',
        }}
      >
        <div>
          <div style={{ fontWeight: '700', color: '#4A3525', fontSize: '0.95rem' }}>{review.name}</div>
          <div style={{ fontSize: '0.78rem', color: '#6B5B52' }}>{review.location || 'India'}</div>
        </div>

        {review.verifiedPurchase && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              color: '#274C37',
              fontSize: '0.75rem',
              fontWeight: '600',
            }}
          >
            <CheckCircle size={14} />
            <span>Verified Customer</span>
          </div>
        )}
      </div>
    </div>
  );
}
