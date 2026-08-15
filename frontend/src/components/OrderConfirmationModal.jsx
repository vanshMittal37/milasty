import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, ShieldCheck, ExternalLink, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import api from '../api/axios';

export default function OrderConfirmationModal({ formData, onClose }) {
  const { cartItems, subtotal, deliveryFee, totalAmount, clearCart, setIsCartOpen } = useCart();
  const [loading, setLoading] = useState(false);

  const handleFinalConfirm = async () => {
    setLoading(true);
    try {
      const payload = {
        customerName: formData.customerName,
        phone: formData.phone,
        address: formData.address,
        pincode: formData.pincode,
        items: cartItems,
        subtotal,
        deliveryFee,
        totalAmount,
      };

      const res = await api.post('/orders', payload);
      const whatsappUrl = res.data.whatsappRedirectUrl;

      // Clear local cart state
      clearCart();
      setIsCartOpen(false);
      onClose();

      // Redirect to WhatsApp
      window.open(whatsappUrl, '_blank');
    } catch (error) {
      console.error('Error logging order:', error);
      // Fallback direct WhatsApp redirect
      let message = `*NEW ORDER - MILASTY RITUAL BASKET*\n\n`;
      cartItems.forEach((item, index) => {
        message += `${index + 1}. ${item.title} (${item.variantName} - ${item.weight}) x ${item.quantity} = ₹${item.totalPrice}\n`;
      });
      message += `\n*Total:* ₹${totalAmount}\n*Name:* ${formData.customerName}\n*Phone:* ${formData.phone}\n*Address:* ${formData.address}, Pincode: ${formData.pincode}`;

      const whatsappUrl = `https://api.whatsapp.com/send/?phone=918927142056&text=${encodeURIComponent(message)}`;
      clearCart();
      setIsCartOpen(false);
      onClose();
      window.open(whatsappUrl, '_blank');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(44, 34, 30, 0.75)',
        backdropFilter: 'blur(6px)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
      }}
      className="animate-fade-in"
    >
      <div
        style={{
          width: '100%',
          maxWidth: '520px',
          backgroundColor: '#FDFBF7',
          borderRadius: '20px',
          padding: '2rem',
          boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
          border: '1px solid #E2D7C7',
          position: 'relative',
        }}
        className="animate-slide-up"
      >
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', color: '#6B5B52' }}
        >
          <X size={20} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'rgba(200, 155, 60, 0.15)',
              color: '#C89B3C',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '0.75rem',
            }}
          >
            <ShieldCheck size={32} />
          </div>
          <h2 style={{ fontSize: '1.4rem', color: '#4A3525' }}>Before We Transfer You To WhatsApp</h2>
          <p style={{ fontSize: '0.88rem', color: '#6B5B52' }}>Please review our essential small-batch bakery guidelines:</p>
        </div>

        {/* Policy Checklist */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.75rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', backgroundColor: '#F5EFE6', padding: '0.85rem', borderRadius: '12px' }}>
            <CheckCircle2 size={20} color="#274C37" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontSize: '0.85rem', color: '#2C221E' }}>
              <strong>Prepaid Orders Only:</strong> All orders are freshly baked upon payment confirmation over WhatsApp bank transfer/UPI.
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', backgroundColor: '#F5EFE6', padding: '0.85rem', borderRadius: '12px' }}>
            <AlertTriangle size={20} color="#D9822B" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontSize: '0.85rem', color: '#2C221E' }}>
              <strong>Mandatory Unboxing Video:</strong> In the rare event of transit damage, an unedited 360° unboxing video recorded while opening the seal is required for replacement.
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', backgroundColor: '#F5EFE6', padding: '0.85rem', borderRadius: '12px' }}>
            <CheckCircle2 size={20} color="#274C37" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontSize: '0.85rem', color: '#2C221E' }}>
              <strong>Freshness Guarantee:</strong> Baked with 0% Maida, 0% Palm Oil, and 0% Preservatives in pure Desi Ghee & Jaggery.
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleFinalConfirm}
          disabled={loading}
          className="btn-primary"
          style={{
            width: '100%',
            justifyContent: 'center',
            padding: '0.95rem',
            fontSize: '1rem',
            backgroundColor: '#274C37',
          }}
        >
          {loading ? (
            <span>Generating Order...</span>
          ) : (
            <>
              <span>I Understand & Continue to WhatsApp</span>
              <ExternalLink size={18} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
