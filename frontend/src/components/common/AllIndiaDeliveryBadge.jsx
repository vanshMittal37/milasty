import React from 'react';

export function AllIndiaDeliveryBadge({ style = {}, variant = 'default', compact = false }) {
  if (compact) {
    return (
      <div
        className="all-india-badge-compact"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 10px',
          borderRadius: '999px',
          backgroundColor: '#F0F9F1',
          border: '1px solid #C3E6CB',
          color: '#1E6B34',
          fontSize: '0.78rem',
          fontWeight: '700',
          letterSpacing: '0.01em',
          boxShadow: '0 1px 3px rgba(30, 107, 52, 0.08)',
          ...style,
        }}
      >
        <span style={{ fontSize: '0.9rem', lineHeight: 1 }}>🇮🇳</span>
        <span>ALL INDIA DELIVERY AVAILABLE</span>
      </div>
    );
  }

  return (
    <div
      className="all-india-badge-card"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '0.75rem 1rem',
        borderRadius: '14px',
        backgroundColor: '#F4EFE6',
        border: '1.5px solid #D8CBB5',
        boxShadow: '0 2px 8px rgba(43, 20, 11, 0.04)',
        ...style,
      }}
    >
      <div
        style={{
          width: '34px',
          height: '34px',
          borderRadius: '10px',
          backgroundColor: '#2B140B',
          color: '#FFF8F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.1rem',
          flexShrink: 0,
        }}
      >
        🇮🇳
      </div>
      <div>
        <div
          style={{
            fontSize: '0.85rem',
            fontWeight: '800',
            color: '#2B140B',
            letterSpacing: '0.02em',
            lineHeight: 1.2,
          }}
        >
          ALL INDIA DELIVERY AVAILABLE
        </div>
        <div
          style={{
            fontSize: '0.75rem',
            color: '#665343',
            marginTop: '2px',
            fontWeight: '500',
          }}
        >
          Calculated dynamically according to your order value
        </div>
      </div>
    </div>
  );
}

export default AllIndiaDeliveryBadge;
