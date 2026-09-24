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
          backgroundColor: '#FFFFFF',
          border: '1px solid #D9CEC0',
          borderRadius: '16px',
          padding: '1.75rem',
          maxWidth: '460px',
          width: '100%',
          boxShadow: '0 20px 60px rgba(36, 21, 15, 0.25)',
          color: '#241C18',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                backgroundColor: isDanger ? '#FCE8E6' : '#E8F5E9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isDanger ? '#B42318' : '#2F7D32',
                border: isDanger ? '1px solid #F3B7B0' : '1px solid #B9DDBD',
              }}
            >
              <AlertTriangle size={22} />
            </div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#24150F', fontWeight: '800', fontFamily: 'var(--font-serif)' }}>
              {title}
            </h3>
          </div>
          <button
            onClick={onCancel}
            style={{
              background: 'none',
              border: 'none',
              color: '#665B53',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        <p style={{ margin: '0 0 1.5rem 0', fontSize: '0.9rem', color: '#514840', lineHeight: '1.5', fontWeight: '500' }}>
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

