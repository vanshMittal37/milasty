import React, { useState } from 'react';
import { Package } from 'lucide-react';

/**
 * Order item thumbnail. Uses item.image → item.product_image, and shows a neat placeholder when an
 * order item has no image or the image fails to load (instead of the browser's broken-image icon).
 */
export default function OrderItemImage({ item, size = 52, radius = 10, style = {} }) {
  const src = item?.image || item?.product_image || '';
  const [failed, setFailed] = useState(false);
  const box = {
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: `${radius}px`,
    border: '1px solid #E7DED5',
    flexShrink: 0,
    ...style,
  };

  if (!src || failed) {
    return (
      <div aria-hidden="true" style={{ ...box, backgroundColor: '#F4EBDD', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8A6A50' }}>
        <Package size={Math.round(size * 0.42)} />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={item?.title || item?.product_title || 'Product'}
      loading="lazy"
      onError={() => setFailed(true)}
      style={{ ...box, objectFit: 'cover', display: 'block' }}
    />
  );
}
