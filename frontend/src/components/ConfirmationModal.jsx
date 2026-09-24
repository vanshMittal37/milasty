import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
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
  return (
    <ModalPortal isOpen={isOpen} onClose={onCancel}>
      <div
        style={{
          backgroundColor: '#141A16',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '20px',
          padding: '1.75rem',
          maxWidth: '460px',
          width: '100%',
          boxShadow: '0 25px 70px rgba(0, 0, 0, 0.60)',
          color: '#F5F5F5',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                backgroundColor: isDanger ? 'rgba(217, 83, 79, 0.15)' : 'rgba(39, 76, 55, 0.45)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isDanger ? '#FF8A87' : '#85B870',
                border: isDanger ? '1px solid rgba(217, 83, 79, 0.30)' : '1px solid rgba(133, 184, 112, 0.30)',
              }}
            >
              <AlertTriangle size={22} />
            </div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#F5F5F5', fontWeight: '800', fontFamily: 'var(--font-serif)' }}>
              {title}
            </h3>
          </div>
          <button
            onClick={onCancel}
            style={{
              background: 'none',
              border: 'none',
              color: '#A7ADB8',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        <p style={{ margin: '0 0 1.5rem 0', fontSize: '0.88rem', color: '#A7ADB8', lineHeight: '1.5', fontWeight: '500' }}>
          {message}
        </p>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={onCancel}
            className="admin-btn-secondary"
            style={{
              padding: '0.65rem 1.25rem',
              fontSize: '0.85rem',
            }}
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={isDanger ? "admin-btn-danger" : "admin-btn-primary"}
            style={{
              padding: '0.65rem 1.25rem',
              fontSize: '0.85rem',
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </ModalPortal>
  );
}

