import React, { useState } from 'react';
import { Pencil, X, Check } from 'lucide-react';
import { useCart } from '../context/CartContext';
import ModalPortal from './ModalPortal';

/**
 * "Edit" link for a cart line whose product has more than one variant. Opens a picker so the
 * customer can switch pack size from the cart or checkout without going back to the product page.
 * Text uses divs with explicit sizes so global h3/p/span font rules don't inflate it.
 */
export default function VariantEditButton({ item, style = {} }) {
  const { getVariantsForItem, changeCartItemVariant } = useCart();
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [saving, setSaving] = useState(false);

  const variants = getVariantsForItem(item);
  if (variants.length < 2) return null;

  const currentId = item.variantId || item.variant_id
    || variants.find((v) => v.name === item.variantName || v.weight === item.variantName)?.id;

  const openPicker = () => {
    setSelectedId(currentId);
    setOpen(true);
  };

  const handleSave = async () => {
    const chosen = variants.find((v) => v.id === selectedId);
    if (!chosen || chosen.id === currentId) {
      setOpen(false);
      return;
    }
    setSaving(true);
    await changeCartItemVariant(item.cartItemId, chosen);
    setSaving(false);
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={openPicker}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
          background: 'none', border: 'none', padding: 0, cursor: 'pointer',
          color: '#2F6B3A', fontSize: '0.75rem', fontWeight: 800, textDecoration: 'underline',
          ...style,
        }}
        aria-label={`Change pack size for ${item.title}`}
      >
        <Pencil size={11} /> Edit
      </button>

      <ModalPortal isOpen={open} onClose={() => setOpen(false)}>
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Choose pack size"
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '100%', maxWidth: '380px', backgroundColor: '#FFFFFF', borderRadius: '18px',
            padding: '1.1rem 1.2rem', boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
            display: 'flex', flexDirection: 'column', gap: '0.85rem', color: '#2A170F',
            fontSize: '0.85rem', lineHeight: 1.4, boxSizing: 'border-box',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <img
              src={item.image}
              alt=""
              style={{ width: '44px', height: '44px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0 }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '1rem', fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
              <div style={{ fontSize: '0.75rem', color: '#634B3B' }}>Choose pack size</div>
            </div>
            <button
              type="button"
              aria-label="Close"
              onClick={() => setOpen(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#634B3B', padding: '0.2rem', display: 'flex' }}
            >
              <X size={18} />
            </button>
          </div>

          <div role="radiogroup" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {variants.map((v) => {
              const isSelected = v.id === selectedId;
              const outOfStock = v.inStock === false;
              const showMrp = Number(v.originalPrice) > Number(v.price);
              return (
                <button
                  key={v.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  disabled={outOfStock}
                  onClick={() => setSelectedId(v.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.65rem', width: '100%', textAlign: 'left',
                    padding: '0.7rem 0.85rem', borderRadius: '12px', cursor: outOfStock ? 'not-allowed' : 'pointer',
                    border: isSelected ? '2px solid #2F6B3A' : '1px solid rgba(120, 75, 40, 0.2)',
                    background: isSelected ? 'rgba(47, 107, 58, 0.07)' : '#FFFFFF',
                    opacity: outOfStock ? 0.5 : 1, color: '#2A170F', fontSize: '0.85rem',
                  }}
                >
                  <div style={{
                    width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0,
                    border: isSelected ? '5px solid #2F6B3A' : '2px solid rgba(120, 75, 40, 0.35)', boxSizing: 'border-box',
                  }} />
                  <div style={{ flex: 1, fontWeight: 700 }}>
                    {v.name || v.weight}
                    {outOfStock && <div style={{ fontSize: '0.7rem', color: '#B91C1C', fontWeight: 600 }}>Out of stock</div>}
                  </div>
                  <div style={{ textAlign: 'right', fontWeight: 800 }}>
                    ₹{v.price}
                    {showMrp && (
                      <div style={{ fontSize: '0.7rem', color: '#A38C7A', fontWeight: 500, textDecoration: 'line-through' }}>₹{v.originalPrice}</div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
              padding: '0.75rem', borderRadius: '999px', border: 'none', cursor: saving ? 'wait' : 'pointer',
              background: '#2F6B3A', color: '#FFFFFF', fontSize: '0.88rem', fontWeight: 800,
              opacity: saving ? 0.7 : 1,
            }}
          >
            <Check size={16} /> {saving ? 'Updating…' : 'Update'}
          </button>
        </div>
      </ModalPortal>
    </>
  );
}
