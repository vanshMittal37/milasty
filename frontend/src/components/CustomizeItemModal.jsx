import React, { useState, useEffect } from 'react';
import { X, Check, Trash2 } from 'lucide-react';
import ModalPortal from './ModalPortal';

export default function CustomizeItemModal({ isOpen, onClose, item, onSave, onRemove }) {
  const [note, setNote] = useState('');

  useEffect(() => {
    if (item) {
      setNote(item.customization_note || item.customizationNote || '');
    } else {
      setNote('');
    }
  }, [item, isOpen]);

  if (!isOpen || !item) return null;

  const handleSave = (e) => {
    e.preventDefault();
    const clean = note.trim().slice(0, 300);
    onSave(item.cartItemId || item.key || item.id || item._id, clean);
    onClose();
  };

  const handleRemove = () => {
    if (onRemove) {
      onRemove(item.cartItemId || item.key || item.id || item._id);
    }
    onClose();
  };

  return (
    <ModalPortal>
      <div
        style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(20, 10, 5, 0.7)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.25rem',
        }}
        onClick={onClose}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '480px',
            backgroundColor: '#FBF6ED',
            borderRadius: '20px',
            border: '1.5px solid #E4D1B7',
            boxShadow: '0 20px 50px rgba(42, 23, 15, 0.3)',
            overflow: 'hidden',
            boxSizing: 'border-box',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid rgba(120, 75, 40, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#FFF9F0',
            }}
          >
            <div>
              <span style={{ fontSize: '0.72rem', fontWeight: '800', color: '#2F6B3A', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block' }}>
                ✦ Customize This Product
              </span>
              <h3 style={{ fontSize: '1.15rem', fontFamily: 'var(--font-serif)', color: '#2B140B', margin: '0.2rem 0 0', fontWeight: '800' }}>
                {item.title}
              </h3>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(120, 75, 40, 0.08)',
                border: 'none',
                color: '#2B140B',
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSave} style={{ padding: '1.5rem' }}>
            <p style={{ fontSize: '0.84rem', color: '#6B584C', margin: '0 0 1rem', lineHeight: '1.5' }}>
              Add a special instruction for <strong>{item.title}</strong> ({item.variantName || 'Standard Pack'}).
              <br />
              <span style={{ fontSize: '0.78rem', color: '#725D50', fontStyle: 'italic' }}>
                Note: This instruction applies ONLY to this product line.
              </span>
            </p>

            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '800', color: '#2B140B', marginBottom: '0.4rem' }}>
              Special Instructions
            </label>

            <div style={{ position: 'relative' }}>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value.slice(0, 300))}
                placeholder={item.customization_placeholder || "Example: Please write Happy Birthday Aanya."}
                rows={4}
                maxLength={300}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '0.8rem',
                  fontSize: '0.9rem',
                  borderRadius: '12px',
                  border: '1.5px solid #E4D1B7',
                  backgroundColor: '#FFFFFF',
                  color: '#2B140B',
                  outline: 'none',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                }}
              />
              <div style={{ textAlign: 'right', fontSize: '0.75rem', color: note.length >= 300 ? '#DC2626' : '#6B584C', marginTop: '0.3rem', fontWeight: '700' }}>
                {note.length}/300
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', alignItems: 'center' }}>
              {item.customization_note && (
                <button
                  type="button"
                  onClick={handleRemove}
                  style={{
                    padding: '0.75rem 1rem',
                    backgroundColor: 'rgba(220, 38, 38, 0.08)',
                    color: '#DC2626',
                    border: '1px solid rgba(220, 38, 38, 0.2)',
                    borderRadius: '999px',
                    fontWeight: '700',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                >
                  <Trash2 size={15} />
                  <span>Remove</span>
                </button>
              )}

              <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    padding: '0.75rem 1.25rem',
                    backgroundColor: 'transparent',
                    color: '#6B584C',
                    border: '1px solid #E4D1B7',
                    borderRadius: '999px',
                    fontWeight: '700',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#2F6B3A',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '999px',
                    fontWeight: '800',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(47, 107, 58, 0.25)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                >
                  <Check size={16} />
                  <span>Save Instruction</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>
  );
}
