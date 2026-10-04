import React from 'react';
import { AlertTriangle, LogOut, X } from 'lucide-react';
import ModalPortal from './ModalPortal';

export default function ConfirmationModal({
  isOpen,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed? This action cannot be undone.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDanger = true,
  onConfirm,
  onCancel,
}) {
  if (!isOpen) return null;

  return (
    <ModalPortal isOpen={isOpen} onClose={onCancel}>
      <div
        className="milasty-confirm-modal animate-slide-up"
        style={{
          backgroundColor: '#181E19',
          border: '1px solid rgba(255, 255, 255, 0.16)',
          borderRadius: '24px',
          padding: '1.85rem',
          maxWidth: '440px',
          width: '90vw',
          boxShadow: '0 25px 70px rgba(0, 0, 0, 0.75)',
          color: '#F9FAFB',
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

        {/* Modal Header & Icon */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', marginBottom: '1rem', paddingRight: '2rem' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              backgroundColor: isDanger ? 'rgba(239, 68, 68, 0.18)' : 'rgba(198, 138, 58, 0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isDanger ? '#EF4444' : '#EAB308',
              border: isDanger ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(198, 138, 58, 0.4)',
              flexShrink: 0,
            }}
          >
            {isDanger ? <AlertTriangle size={24} /> : <LogOut size={22} />}
          </div>
          <h3
            style={{
              margin: 0,
              fontSize: '1.3rem',
              color: '#FFFFFF',
              fontWeight: '800',
              fontFamily: 'var(--font-serif)',
              lineHeight: '1.25',
              letterSpacing: '-0.01em',
            }}
          >
            {title}
          </h3>
        </div>

        {/* Message */}
        <p
          style={{
            margin: '0 0 1.65rem 0',
            fontSize: '0.92rem',
            color: '#D1D5DB',
            lineHeight: '1.55',
            fontWeight: '400',
          }}
        >
          {message}
        </p>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.85rem', width: '100%' }}>
          <button
            type="button"
            onClick={onCancel}
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
            }}
            onMouseOver={(e) => (e.currentTarget.style.opacity = '0.9')}
            onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </ModalPortal>
  );
}


