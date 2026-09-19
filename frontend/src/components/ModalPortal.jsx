import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';

/**
 * ModalPortal Component
 * Renders modal dialogs directly into document.body via React Portal.
 * Solves CSS stacking context conflicts, parent overflow clipping, and navbar overlaps.
 */
export default function ModalPortal({
  isOpen,
  onClose,
  children,
  closeOnBackdrop = true,
  closeOnEsc = true,
}) {
  // Lock body scroll when modal is open and restore on unmount/close
  useEffect(() => {
    if (isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle === 'hidden' ? '' : originalStyle;
      };
    }
  }, [isOpen]);

  // Handle Escape key press
  useEffect(() => {
    if (!isOpen || !closeOnEsc || !onClose) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeOnEsc, onClose]);

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div
      className="modal-portal-overlay animate-fade-in"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(14, 7, 4, 0.8)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 1000, // Layer hierarchy: Content (0) < Sticky (10) < Navbar (100) < Drawers (500) < Modals (1000) < Toasts (2000)
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        boxSizing: 'border-box',
      }}
      onClick={(e) => {
        if (closeOnBackdrop && e.target === e.currentTarget && onClose) {
          onClose();
        }
      }}
    >
      <div 
        style={{ 
          zIndex: 1001, 
          width: '100%', 
          display: 'flex', 
          justifyContent: 'center',
          maxHeight: '100%',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}
