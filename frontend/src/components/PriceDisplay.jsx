import React from 'react';

export default function PriceDisplay({
  price,
  originalPrice,
  size = 'medium',
  className = '',
  style = {},
  prefix = '',
}) {
  const currentPrice = Number(price || 0);
  const origPrice = Number(originalPrice || 0);
  const hasDiscount = origPrice > currentPrice;

  const fontSizes = {
    small: { current: '0.9rem', original: '0.78rem' },
    medium: { current: '1.1rem', original: '0.88rem' },
    large: { current: '1.45rem', original: '1rem' },
  };

  const sizes = fontSizes[size] || fontSizes.medium;

  return (
    <div
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'baseline',
        gap: '0.5rem',
        ...style,
      }}
    >
      <span
        style={{
          fontSize: sizes.current,
          fontWeight: '800',
          color: '#32180D',
        }}
      >
        {prefix}₹{currentPrice}
      </span>
      {hasDiscount && (
        <span
          style={{
            fontSize: sizes.original,
            color: 'var(--text-muted, #806A57)',
            textDecoration: 'line-through',
            fontWeight: '500',
          }}
        >
          ₹{origPrice}
        </span>
      )}
    </div>
  );
}
