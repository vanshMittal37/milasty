import React, { useEffect } from 'react';
import { AlertTriangle, LogOut, Trash2, X } from 'lucide-react';

export default function ConfirmModal({
  isOpen,
  title = 'Are you sure?',
  message = 'Do you want to proceed with this action?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger', // 'danger' | 'warning' | 'info'
  onConfirm,
  onCancel,
  loading = false,
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const isDanger = type === 'danger';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.72)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
      }}
      onClick={onCancel}
    >
      <div
        className="admin-card animate-slide-up"
        style={{
          width: '100%',
          maxWidth: '420px',
          padding: '1.75rem',
          borderRadius: '20px',
          backgroundColor: 'var(--admin-surface-card, #182019)',
          border: '1px solid var(--admin-border, rgba(255, 255, 255, 0.15))',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '1rem',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onCancel}
          style={{
            position: 'absolute',
            top: '14px',
            right: '14px',
            background: 'none',
            border: 'none',
            color: 'var(--admin-text-muted, #929B94)',
            cursor: 'pointer',
            padding: '0.2rem',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <X size={18} />
        </button>

        {/* Icon Circle */}
        <div
          style={{
            width: '54px',
            height: '54px',
            borderRadius: '50%',
            backgroundColor: isDanger ? 'rgba(239, 68, 68, 0.15)' : 'rgba(185, 205, 148, 0.15)',
            border: isDanger ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(185, 205, 148, 0.4)',
            color: isDanger ? '#ef4444' : '#b9cd94',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {isDanger ? <AlertTriangle size={26} /> : <LogOut size={24} />}
        </div>

        {/* Text Details */}
        <div>
          <h3
            style={{
              fontSize: '1.25rem',
              fontFamily: 'var(--font-serif)',
              color: 'var(--admin-text-primary, #F4F5F0)',
              fontWeight: '800',
              margin: '0 0 0.35rem 0',
            }}
          >
            {title}
          </h3>
          <p
            style={{
              fontSize: '0.85rem',
              color: 'var(--admin-text-secondary, #C1C7C1)',
              lineHeight: '1.5',
              margin: 0,
              fontWeight: '500',
            }}
          >
            {message}
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.85rem', width: '100%', marginTop: '0.5rem' }}>
          <button
            onClick={onCancel}
            disabled={loading}
            className="admin-btn-secondary"
            style={{
              flex: 1,
              height: '42px',
              justifyContent: 'center',
              fontSize: '0.85rem',
              fontWeight: '700',
            }}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={isDanger ? 'admin-btn-danger' : 'admin-btn-primary'}
            style={{
              flex: 1,
              height: '42px',
              justifyContent: 'center',
              fontSize: '0.85rem',
              fontWeight: '800',
              backgroundColor: isDanger ? '#dc2626' : undefined,
              borderColor: isDanger ? '#dc2626' : undefined,
              color: '#FFFFFF',
            }}
          >
            {loading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
