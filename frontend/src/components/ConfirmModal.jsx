import React from 'react';
import { AlertTriangle, LogOut, Trash2, X } from 'lucide-react';
import ModalPortal from './ModalPortal';

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
  if (!isOpen) return null;
  const isDanger = type === 'danger';

  return (
    <ModalPortal isOpen={isOpen} onClose={onCancel}>
      <div
        className="milasty-confirm-modal animate-slide-up"
        style={{
          width: '90vw',
          maxWidth: '440px',
          padding: '1.85rem',
          borderRadius: '24px',
          backgroundColor: '#181E19',
          border: '1px solid rgba(255, 255, 255, 0.16)',
          boxShadow: '0 25px 70px rgba(0, 0, 0, 0.75)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '1.1rem',
          position: 'relative',
          boxSizing: 'border-box',
          margin: '0 auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onCancel}
          style={{
            position: 'absolute',
            top: '18px',
            right: '18px',
            background: 'rgba(255, 255, 255, 0.08)',
            border: 'none',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#9CA3AF',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.color = '#FFFFFF';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.18)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.color = '#9CA3AF';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
          }}
        >
          <X size={18} />
        </button>

        {/* Icon Circle */}
        <div
          style={{
            width: '54px',
            height: '54px',
            borderRadius: '16px',
            backgroundColor: isDanger ? 'rgba(239, 68, 68, 0.18)' : 'rgba(198, 138, 58, 0.18)',
            border: isDanger ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(198, 138, 58, 0.4)',
            color: isDanger ? '#EF4444' : '#EAB308',
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
              fontSize: '1.3rem',
              fontFamily: 'var(--font-serif)',
              color: '#FFFFFF',
              fontWeight: '800',
              margin: '0 0 0.4rem 0',
              lineHeight: '1.25',
            }}
          >
            {title}
          </h3>
          <p
            style={{
              fontSize: '0.92rem',
              color: '#D1D5DB',
              lineHeight: '1.55',
              margin: 0,
              fontWeight: '400',
            }}
          >
            {message}
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.85rem', width: '100%', marginTop: '0.5rem' }}>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            style={{
              flex: 1,
              padding: '0.7rem 1.25rem',
              fontSize: '0.88rem',
              fontWeight: '700',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              color: '#F3F4F6',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              textAlign: 'center',
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.16)')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)')}
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            style={{
              flex: 1,
              padding: '0.7rem 1.25rem',
              fontSize: '0.88rem',
              fontWeight: '800',
              borderRadius: '12px',
              border: 'none',
              backgroundColor: isDanger ? '#DC2626' : '#C68A3A',
              color: '#FFFFFF',
              cursor: 'pointer',
              boxShadow: isDanger ? '0 4px 16px rgba(220, 38, 38, 0.45)' : '0 4px 16px rgba(198, 138, 58, 0.45)',
              transition: 'all 0.2s ease',
              textAlign: 'center',
              opacity: loading ? 0.7 : 1,
            }}
            onMouseOver={(e) => (e.currentTarget.style.opacity = loading ? '0.7' : '0.9')}
            onMouseOut={(e) => (e.currentTarget.style.opacity = loading ? '0.7' : '1')}
          >
            {loading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </ModalPortal>
  );
}


