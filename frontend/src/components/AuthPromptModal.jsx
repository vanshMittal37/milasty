import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { X, Lock, LogIn, UserPlus, ShieldCheck } from 'lucide-react';

export default function AuthPromptModal({ isOpen, onClose, title = "Login Required", message = "Please log in or create an account to purchase MILASTY products." }) {
  const navigate = useNavigate();
  const location = useLocation();

  if (!isOpen) return null;

  const handleLogin = () => {
    onClose();
    navigate('/login', { state: { from: location.pathname } });
  };

  const handleRegister = () => {
    onClose();
    navigate('/register', { state: { from: location.pathname } });
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(14, 7, 4, 0.8)',
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
          maxWidth: '440px',
          backgroundColor: '#1E120B',
          borderRadius: '24px',
          border: '1px solid rgba(185, 205, 148, 0.25)',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.6)',
          padding: '2.25rem 2rem',
          textAlign: 'center',
          position: 'relative',
          color: '#FFFDF9',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'none',
            border: 'none',
            color: 'rgba(255, 255, 255, 0.5)',
            cursor: 'pointer',
            padding: '6px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <X size={20} />
        </button>

        {/* Lock Icon */}
        <div
          style={{
            width: '68px',
            height: '68px',
            borderRadius: '50%',
            backgroundColor: 'rgba(36, 79, 33, 0.3)',
            border: '1px solid rgba(185, 205, 148, 0.3)',
            color: '#b9cd94',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.25rem',
          }}
        >
          <Lock size={32} />
        </div>

        <h3
          style={{
            fontFamily: 'var(--font-serif, Georgia, serif)',
            fontSize: '1.5rem',
            fontWeight: '800',
            marginBottom: '0.6rem',
            color: '#FFFDF9',
          }}
        >
          {title}
        </h3>

        <p
          style={{
            fontSize: '0.9rem',
            color: 'rgba(245, 235, 221, 0.8)',
            lineHeight: '1.5',
            marginBottom: '2rem',
            padding: '0 0.5rem',
          }}
        >
          {message}
        </p>

        {/* CTAs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <button
            type="button"
            onClick={handleLogin}
            style={{
              width: '100%',
              padding: '0.85rem 1.25rem',
              backgroundColor: '#244f21',
              color: '#FFFFFF',
              border: '1px solid #b9cd94',
              borderRadius: '12px',
              fontWeight: '800',
              fontSize: '0.95rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 16px rgba(36, 79, 33, 0.35)',
            }}
          >
            <LogIn size={18} />
            <span>Log In to Account</span>
          </button>

          <button
            type="button"
            onClick={handleRegister}
            style={{
              width: '100%',
              padding: '0.85rem 1.25rem',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              color: '#b9cd94',
              border: '1px solid rgba(185, 205, 148, 0.3)',
              borderRadius: '12px',
              fontWeight: '800',
              fontSize: '0.95rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
            }}
          >
            <UserPlus size={18} />
            <span>Create New Account</span>
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', marginTop: '1.5rem', fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.4)', fontWeight: '600' }}>
          <ShieldCheck size={14} color="#b9cd94" />
          <span>Secure MILASTY Checkout &amp; Order Guarantee</span>
        </div>
      </div>
    </div>
  );
}
