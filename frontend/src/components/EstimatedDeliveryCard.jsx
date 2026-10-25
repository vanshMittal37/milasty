import React from 'react';
import { CalendarDays } from 'lucide-react';
import { formatDeliveryDate } from '../utils/orderDateTime';

/**
 * Estimated delivery: heading + date, nothing else. `date` is any value Date can parse (the courier's
 * estimate once shipped, otherwise the order's own estimate). Renders nothing without a valid date.
 */
export default function EstimatedDeliveryCard({ date, style }) {
  const label = formatDeliveryDate(date);
  if (!label) return null;
  // On narrow screens the only allowed line break is after "Tuesday," — never inside "3 November 2026"
  const [weekday, ...rest] = label.split(', ');

  return (
    <div
      style={{
        backgroundColor: '#EEF4EA',
        border: '1px solid rgba(47, 107, 58, 0.22)',
        borderRadius: '16px',
        padding: '1.15rem 1.3rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.9rem',
        boxShadow: '0 4px 18px rgba(47, 107, 58, 0.06)',
        ...style,
      }}
    >
      <div style={{
        width: '42px', height: '42px', borderRadius: '12px', flexShrink: 0,
        backgroundColor: '#FFFFFF', border: '1px solid rgba(47, 107, 58, 0.18)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <CalendarDays size={20} color="#2F6B3A" />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#2F6B3A' }}>
          Estimated Delivery
        </div>
        <div style={{
          marginTop: '0.2rem',
          fontFamily: 'var(--font-serif)',
          fontSize: 'clamp(1.02rem, 3.6vw, 1.22rem)',
          fontWeight: 800,
          color: '#2B140B',
          lineHeight: 1.3,
        }}>
          <span style={{ whiteSpace: 'nowrap' }}>{weekday},</span>{' '}
          <span style={{ whiteSpace: 'nowrap' }}>{rest.join(', ')}</span>
        </div>
      </div>
    </div>
  );
}
