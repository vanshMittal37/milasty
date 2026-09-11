import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, CheckCircle2, ArrowRight, ArrowLeft, RefreshCw, ShieldAlert } from 'lucide-react';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';
import { supabase } from '../config/supabase';

const inputStyle = {
  width: '100%',
  height: '52px',
  padding: '0 1rem 0 2.75rem',
  borderRadius: '12px',
  border: '1.5px solid rgba(100, 65, 35, 0.28)',
  fontSize: '0.92rem',
  outline: 'none',
  backgroundColor: 'rgba(255, 252, 245, 0.75)',
  color: '#24130D',
  transition: 'border-color 0.2s, box-shadow 0.2s',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
};

const labelStyle = {
  fontSize: '0.74rem',
  fontWeight: '800',
  color: '#4A2C10',
  display: 'block',
  marginBottom: '0.45rem',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const validateEmail = (val) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(val);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    if (!email.trim()) {
      setError('Please enter your email address.');
      toast.error('Please enter your email address.');
      return;
    }

    if (!validateEmail(email.trim())) {
      setError('Please enter a valid email address.');
      toast.error('Please enter a valid email address.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // Trigger frontend Supabase Auth recovery email directly
      try {
        await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/reset-password`,
        });
      } catch (sErr) {
        console.warn('Frontend Supabase resetPasswordForEmail warning:', sErr);
      }

      // Trigger backend auto-sync & reset request
      const res = await api.post('/auth/forgot-password', { email: email.trim() });
      setSent(true);
      setCooldown(60);
      toast.success(res.data?.message || 'Password reset link sent! Please check your email.');
    } catch (err) {
      const msg = err.response?.data?.message || 'Something went wrong. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = () => {
    if (cooldown > 0) return;
    handleSubmit();
  };

  return (
    <div
      className="light-bg-page"
      style={{
        minHeight: '100vh',
        backgroundImage: 'url(/images/register_login_background_image.jpeg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '5rem 1rem 3rem',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '480px',
          backgroundColor: 'rgba(255, 252, 245, 0.92)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderRadius: '28px',
          border: '1px solid rgba(100, 65, 35, 0.18)',
          boxShadow: '0 20px 60px rgba(50, 28, 10, 0.20)',
          padding: '2.5rem 1.75rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
          boxSizing: 'border-box',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', borderBottom: '1px solid rgba(100, 65, 35, 0.12)', paddingBottom: '1.25rem' }}>
          <span
            style={{
              fontSize: '0.68rem',
              fontWeight: '800',
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: '#244f21',
              backgroundColor: 'rgba(36, 79, 33, 0.08)',
              padding: '0.3rem 0.8rem',
              borderRadius: '999px',
              border: '1px solid rgba(36, 79, 33, 0.15)',
              display: 'inline-block',
              marginBottom: '0.85rem',
            }}
          >
            Account Security
          </span>
          <h1
            style={{
              fontSize: '1.85rem',
              fontFamily: 'var(--font-serif)',
              color: '#24130D',
              fontWeight: '800',
              margin: '0 0 0.4rem',
              letterSpacing: '-0.01em',
            }}
          >
            Forgot Password
          </h1>
          <p style={{ color: '#5C3D20', fontSize: '0.88rem', margin: 0, fontWeight: '500', lineHeight: '1.5' }}>
            Enter the email address associated with your MILASTY account and we'll send you a secure link to reset your password.
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <div
            style={{
              backgroundColor: 'rgba(184, 50, 30, 0.08)',
              border: '1.5px solid rgba(184, 50, 30, 0.35)',
              color: '#8B2020',
              padding: '0.85rem 1rem',
              borderRadius: '12px',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: '600',
            }}
          >
            <ShieldAlert size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Form OR Success View */}
        {sent ? (
          <div style={{ textAlign: 'center', padding: '0.5rem 0', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'rgba(36, 79, 33, 0.10)',
                color: '#244f21',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
              }}
            >
              <CheckCircle2 size={36} />
            </div>

            <div>
              <h3 style={{ fontSize: '1.3rem', fontFamily: 'var(--font-serif)', color: '#24130D', fontWeight: '700', marginBottom: '0.4rem' }}>
                Check Your Email
              </h3>
              <p style={{ color: '#5C3D20', fontSize: '0.88rem', lineHeight: '1.5', margin: 0, fontWeight: '500' }}>
                We've sent password reset instructions to <strong>{email}</strong>. Please check your inbox and spam folder.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
              <Link
                to="/login"
                style={{
                  width: '100%',
                  height: '50px',
                  backgroundColor: '#244f21',
                  color: '#FFFFFF',
                  borderRadius: '14px',
                  fontWeight: '800',
                  fontSize: '0.92rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  textDecoration: 'none',
                  boxSizing: 'border-box',
                }}
              >
                <span>Back to Login</span>
                <ArrowRight size={18} />
              </Link>

              <button
                type="button"
                onClick={handleResend}
                disabled={cooldown > 0 || loading}
                style={{
                  width: '100%',
                  height: '46px',
                  backgroundColor: 'transparent',
                  color: cooldown > 0 ? '#8B7865' : '#244f21',
                  borderRadius: '12px',
                  border: '1.5px solid rgba(36, 79, 33, 0.3)',
                  fontWeight: '700',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  cursor: cooldown > 0 ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                <span>{cooldown > 0 ? `Resend Email (${cooldown}s)` : 'Resend Email'}</span>
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={labelStyle}>Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={16}
                  color="#7A5535"
                  style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="Enter your registered email"
                  style={inputStyle}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#244f21';
                    e.target.style.boxShadow = '0 0 0 3px rgba(36,79,33,0.10)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(100, 65, 35, 0.28)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                height: '52px',
                marginTop: '0.25rem',
                backgroundColor: '#244f21',
                color: '#FFFFFF',
                borderRadius: '14px',
                border: 'none',
                fontWeight: '800',
                fontSize: '0.95rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.75 : 1,
                transition: 'all 0.2s ease',
                fontFamily: 'inherit',
              }}
            >
              {loading ? (
                <span style={{ color: '#FFFFFF', fontWeight: '800' }}>Sending...</span>
              ) : (
                <>
                  <span style={{ color: '#FFFFFF', fontWeight: '800' }}>Send Reset Link</span>
                  <ArrowRight size={18} color="#FFFFFF" />
                </>
              )}
            </button>

            <div style={{ textAlign: 'center', paddingTop: '0.25rem' }}>
              <Link
                to="/login"
                style={{
                  fontSize: '0.85rem',
                  color: '#244f21',
                  fontWeight: '700',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <ArrowLeft size={16} />
                <span>Back to Login</span>
              </Link>
            </div>
          </form>
        )}

        {/* Security badge */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1.25rem', paddingTop: '0.25rem', borderTop: '1px solid rgba(100, 65, 35, 0.10)' }}>
          {['🔒 256-bit Encryption', '🌿 MILASTY Protection'].map((badge) => (
            <span key={badge} style={{ fontSize: '0.7rem', color: '#7A5535', fontWeight: '600' }}>
              {badge}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
