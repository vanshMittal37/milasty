import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Check, ArrowRight, ArrowLeft, RefreshCw } from 'lucide-react';
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

  if (sent) {
    /* Polished Success Card matching Forgot Password Success Structure */
    return (
      <AuthLayout trustBadges={[]}>
        <div style={{ textAlign: 'center', padding: '0.4rem 0', display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
          {/* Green Circle Check Badge */}
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: '#CDE5CB',
              color: '#1F5A28',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto',
            }}
          >
            <Check size={28} color="#1F5A28" style={{ strokeWidth: 3 }} />
          </div>

          <div>
            <h1
              className="auth-heading"
              style={{
                fontSize: '1.9rem',
                fontFamily: 'var(--font-serif)',
                color: '#2B1710 !important',
                fontWeight: '800',
                margin: '0 0 0.45rem',
              }}
            >
              Check Your Email
            </h1>
            <p style={{ color: '#5A4438 !important', fontSize: '0.88rem', lineHeight: '1.5', margin: 0, fontWeight: '500' }}>
              We've sent password reset instructions to{' '}
              <strong style={{ color: '#2B1710 !important', wordBreak: 'break-all' }}>{email}</strong>. Please check your inbox and follow the secure link.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.2rem' }}>
            {/* Resend Email Button */}
            <button
              type="button"
              onClick={handleResend}
              disabled={cooldown > 0 || loading}
              style={{
                width: '100%',
                height: '46px',
                backgroundColor: '#F3EDE2',
                color: cooldown > 0 ? '#675449 !important' : '#1F5A28 !important',
                borderRadius: '12px',
                border: '1.5px solid #1F5A28',
                fontWeight: '700',
                fontSize: '0.88rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.45rem',
                cursor: cooldown > 0 ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
              }}
            >
              <RefreshCw size={15} style={{ animation: loading ? 'authSpinner 0.8s linear infinite' : 'none' }} />
              <span>{cooldown > 0 ? `Resend Email (${cooldown}s)` : 'Resend Email'}</span>
            </button>

            {/* Back to Login Link */}
            <Link
              to="/login"
              style={{
                fontSize: '0.86rem',
                color: '#1F5A28 !important',
                fontWeight: '700',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.35rem',
              }}
            >
              <ArrowLeft size={16} />
              <span>Back to Login</span>
            </Link>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      badge="ACCOUNT SECURITY"
      titleLine1="Forgot"
      titleLine2="Password"
      subtitle="Enter the email address associated with your MILASTY account and we'll send you a secure link to reset your password."
      trustBadges={[
        { icon: '🔒', text: '256-bit Encryption' },
        { icon: '🌿', text: 'MILASTY Protection' },
      ]}
    >
      {/* Error Alert */}
      <AuthAlert message={error} type="error" />

      {/* Form View */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
        <AuthInput
          label="EMAIL ADDRESS"
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
              fontSize: '0.86rem',
              color: '#1F5A28 !important',
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
    </AuthLayout>
  );
}
