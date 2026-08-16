import React from 'react';

export default function Logo({ variant = 'primary', height, width, style, className }) {
  const src = variant === 'emblem' 
    ? '/images/branding/milasty-logo-emblem.png'
    : '/images/branding/milasty-logo-primary.png';

  const alt = variant === 'emblem' ? 'MILASTY Emblem' : 'MILASTY Logo';

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={{
        height: height || 'auto',
        width: width || 'auto',
        objectFit: 'contain',
        display: 'block',
        ...style
      }}
    />
  );
}
