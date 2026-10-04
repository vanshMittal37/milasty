import React from 'react';

export default function PriceDisplay({
  price,
  originalPrice,
  discountType,
  discountValue,
  discountLabel: customLabel,
  size = 'medium',
  className = '',
  style = {},
  prefix = '',
  showBadge = true,
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

  const discountTag = (() => {
    if (customLabel) return customLabel;
    if (discountType === 'percentage' && Number(discountValue) > 0) return `${discountValue}% OFF`;
    if (discountType === 'fixed' && Number(discountValue) > 0) return `₹${discountValue} OFF`;
    if (hasDiscount && origPrice > 0) {
      const diff = origPrice - currentPrice;
      const pct = Math.round((diff / origPrice) * 100);
      return pct > 0 ? `${pct}% OFF` : `₹${diff} OFF`;
    }
    return null;
  })();

  return (
    <div
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.45rem',
        flexWrap: 'wrap',
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
      {showBadge && hasDiscount && discountTag && (
        <span
          style={{
            fontSize: '0.68rem',
            color: '#2F6B3A',
            backgroundColor: '#E3EEDC',
            border: '1px solid rgba(47, 107, 58, 0.25)',
            padding: '0.12rem 0.4rem',
            borderRadius: '4px',
            fontWeight: '850',
            whiteSpace: 'nowrap',
            lineHeight: '1.1',
          }}
        >
          {discountTag}
        </span>
      )}
    </div>
  );
}
