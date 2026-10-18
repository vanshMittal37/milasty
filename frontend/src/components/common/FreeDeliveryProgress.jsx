import React from 'react';
import { Truck, Check } from 'lucide-react';
import { useCart } from '../../context/CartContext';

/**
 * "Add ₹X more for FREE delivery" progress bar, driven by the free delivery offer
 * the admin configures in the Coupons tab. Renders nothing when no offer is running.
 */
export default function FreeDeliveryProgress({ style = {} }) {
  const { subtotal, freeDeliveryThreshold, isFreeDelivery, amountForFreeDelivery } = useCart();

  if (freeDeliveryThreshold === null || freeDeliveryThreshold === undefined) return null;

  const percent = freeDeliveryThreshold > 0
    ? Math.min(100, Math.round((subtotal / freeDeliveryThreshold) * 100))
    : 100;

  return (
    <div style={{
      padding: '0.8rem 1rem', borderRadius: '14px',
      background: isFreeDelivery ? 'rgba(47, 107, 58, 0.1)' : '#FBF6ED',
      border: `1px solid ${isFreeDelivery ? 'rgba(47, 107, 58, 0.3)' : 'rgba(120, 75, 40, 0.14)'}`,
      display: 'flex', flexDirection: 'column', gap: '0.5rem',
      ...style,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.8rem', fontWeight: '700', color: isFreeDelivery ? '#2F6B3A' : '#2A170F' }}>
        {isFreeDelivery ? <Check size={15} color="#2F6B3A" /> : <Truck size={15} color="#2F6B3A" />}
        {isFreeDelivery ? (
          <span>Yay! You've unlocked <strong>FREE delivery</strong></span>
        ) : (
          <span>Add <strong style={{ color: '#2F6B3A' }}>₹{amountForFreeDelivery}</strong> more to get <strong>FREE delivery</strong></span>
        )}
      </div>
      <div style={{ height: '6px', borderRadius: '999px', background: 'rgba(120, 75, 40, 0.12)', overflow: 'hidden' }}>
        <div style={{ width: `${percent}%`, height: '100%', borderRadius: '999px', background: '#2F6B3A', transition: 'width 0.35s ease' }} />
      </div>
      {!isFreeDelivery && (
        <div style={{ fontSize: '0.7rem', color: '#806B59', fontWeight: '600' }}>
          Free delivery on orders of ₹{freeDeliveryThreshold} or more
        </div>
      )}
    </div>
  );
}
