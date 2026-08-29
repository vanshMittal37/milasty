import React, { useEffect, useRef } from 'react';
import { useCart } from '../context/CartContext';

export default function EdgeSwipeHandler() {
  const { openCart, openNav, isCartOpen, mobileNavOpen } = useCart();
  const touchStartRef = useRef(null);

  useEffect(() => {
    // Edge swipe listener for opening drawers on mobile screens (< 768px)
    const handleTouchStart = (e) => {
      if (window.innerWidth >= 768) return;
      // Do not initiate edge gesture if a drawer is already open
      if (isCartOpen || mobileNavOpen) return;

      const touch = e.touches[0];
      if (!touch) return;

      const x = touch.clientX;
      const y = touch.clientY;
      const screenWidth = window.innerWidth;
      const edgeThreshold = 30; // 30px edge activation area

      const isRightEdge = x >= screenWidth - edgeThreshold;
      const isLeftEdge = x <= edgeThreshold;

      if (isRightEdge || isLeftEdge) {
        touchStartRef.current = {
          x,
          y,
          side: isRightEdge ? 'right' : 'left',
          time: Date.now()
        };
      } else {
        touchStartRef.current = null;
      }
    };

    const handleTouchEnd = (e) => {
      if (!touchStartRef.current) return;

      const touch = e.changedTouches[0];
      if (!touch) {
        touchStartRef.current = null;
        return;
      }

      const diffX = touch.clientX - touchStartRef.current.x;
      const diffY = Math.abs(touch.clientY - touchStartRef.current.y);
      const side = touchStartRef.current.side;
      touchStartRef.current = null;

      // Ensure gesture is predominantly horizontal (diffX > diffY)
      if (diffY > Math.abs(diffX)) return;

      const swipeThreshold = 45; // Minimum horizontal distance required

      // Swipe from right edge toward left (diffX < -45) -> Open Cart
      if (side === 'right' && diffX < -swipeThreshold) {
        openCart();
      }

      // Swipe from left edge toward right (diffX > 45) -> Open Navigation Drawer
      if (side === 'left' && diffX > swipeThreshold) {
        openNav();
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [openCart, openNav, isCartOpen, mobileNavOpen]);

  return null;
}
