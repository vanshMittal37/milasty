import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Mail, CheckCircle2, ArrowRight, ArrowLeft, RefreshCw } from 'lucide-react';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';
import { AuthLayout, AuthInput, AuthButton, AuthAlert } from '../components/common/AuthComponents';

export default function ForgotPasswordPage() {
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
      const msg = 'Please enter your email address.';
      setError(msg);
      toast.error(msg);
      return;
    }

    if (!validateEmail(email.trim())) {
      const msg = 'Please enter a valid email address.';
      setError(msg);
      toast.error(msg);
      return;
    }

    setError('');
    setLoading(true);

    try {
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
    <AuthLayout
      badge="Account Security"
      title="Forgot Password"
      subtitle="Enter the email address associated with your MILASTY account and we'll send you a secure link to reset your password."
      trustBadges={[
        { icon: '🔒', text: '256-bit Encryption' },
        { icon: '🌿', text: 'MILASTY Protection' },
      ]}
    >
      {/* Error Alert */}
      <AuthAlert message={error} type="error" />

      {sent ? (
        /* Polished Success View */
        <div style={{ textAlign: 'center', padding: '0.25rem 0', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              backgroundColor: 'rgba(36, 79, 33, 0.10)',
              color: '#244f21',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto',
            }}
          >
            <CheckCircle2 size={34} color="#244f21" />
          </div>

          <div>
            <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-serif)', color: '#24130D', fontWeight: '800', marginBottom: '0.4rem' }}>
              Check Your Email
            </h3>
            <p style={{ color: '#5C3D20', fontSize: '0.88rem', lineHeight: '1.5', margin: 0, fontWeight: '500' }}>
              We've sent password reset instructions to <strong style={{ color: '#24130D' }}>{email}</strong>. Please check your inbox and follow the secure link.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.25rem' }}>
            <Link
              to="/login"
              style={{
                width: '100%',
                height: '50px',
                backgroundColor: '#244f21',
                color: '#FFFFFF',
                borderRadius: '14px',
                fontWeight: '700',
                fontSize: '0.95rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                textDecoration: 'none',
                boxShadow: '0 4px 14px rgba(36, 79, 33, 0.25)',
                boxSizing: 'border-box',
              }}
            >
              <span>Back to Login</span>
              <ArrowRight size={18} color="#FFFFFF" />
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
              <RefreshCw size={15} style={{ animation: loading ? 'authSpinner 0.8s linear infinite' : 'none' }} />
              <span>{cooldown > 0 ? `Resend Email (${cooldown}s)` : 'Resend Email'}</span>
            </button>
          </div>
        </div>
      ) : (
        /* Form View */
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <AuthInput
            label="Email Address"
            type="email"
            icon={Mail}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError('');
            }}
            placeholder="Enter your registered email"
            required
            autoComplete="email"
            id="forgot-email"
          />

          <AuthButton loading={loading} loadingText="Sending..." icon={ArrowRight}>
            Send Reset Link
          </AuthButton>

          <div style={{ textAlign: 'center', paddingTop: '0.1rem' }}>
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
    </AuthLayout>
  );
}
