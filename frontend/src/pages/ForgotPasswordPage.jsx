import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Check, ArrowRight, ArrowLeft, RefreshCw, MessageSquare, ShieldCheck, Edit2 } from 'lucide-react';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';
import { AuthLayout, AuthInput, AuthButton, AuthAlert } from '../components/common/AuthComponents';
import { parseLoginIdentifier } from '../utils/loginIdentifier';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [identifier, setIdentifier] = useState('');
  const [sentEmail, setSentEmail] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [remainingAttempts, setRemainingAttempts] = useState(null);

  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    const parsed = parseLoginIdentifier(identifier);
    if (parsed.error) {
      setError(parsed.error);
      toast.error(parsed.error);
      return;
    }

    setError('');
    setLoading(true);

    // If identifier is a mobile number, use WhatsApp OTP flow
    if (parsed.type === 'phone') {
      try {
        const res = await api.post('/auth/forgot-password/send-otp', { phone: parsed.value });
        setOtpSent(true);
        setCooldown(res.data?.resendCooldown || 60);
        setRemainingAttempts(null);
        toast.success('Password reset code sent to your WhatsApp number!');
      } catch (err) {
        const msg = err.response?.data?.message || 'Failed to send WhatsApp reset code. Please try again.';
        setError(msg);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    } else {
      // If identifier is an email, use the email reset link flow
      try {
        const res = await api.post('/auth/forgot-password', { identifier: parsed.value });
        setSentEmail(true);
        setCooldown(60);
        toast.success(res.data?.message || 'Password reset link sent! Please check your email.');
      } catch (err) {
        const msg = err.response?.data?.message || 'Something went wrong. Please try again.';
        setError(msg);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();

    const cleanOtp = otp.trim();
    if (!cleanOtp || !/^\d{6}$/.test(cleanOtp)) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    const parsed = parseLoginIdentifier(identifier);
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/forgot-password/verify-otp', {
        phone: parsed.value,
        otp: cleanOtp,
      });

      toast.success('Code confirmed! Please set your new password.');
      // Seamlessly navigate to Reset Password page with the verified token
      navigate(`/reset-password?token=${res.data.token}&email=${encodeURIComponent(res.data.email || '')}`);
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid verification code. Please check and try again.';
      setError(msg);
      toast.error(msg);
      if (err.response?.data?.remainingAttempts !== undefined) {
        setRemainingAttempts(err.response.data.remainingAttempts);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = () => {
    if (cooldown > 0) return;
    handleSubmit();
  };

  // State A: Email reset link success card
  if (sentEmail) {
    return (
      <AuthLayout trustBadges={[]}>
        <div style={{ textAlign: 'center', padding: '0.4rem 0', display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
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
                color: '#2B1710',
                fontWeight: '800',
                margin: '0 0 0.45rem',
              }}
            >
              Check Your Email
            </h1>
            <p style={{ color: '#5A4438', fontSize: '0.88rem', lineHeight: '1.5', margin: 0, fontWeight: '500' }}>
              If an account matches{' '}
              <strong style={{ color: '#2B1710', wordBreak: 'break-all' }}>{identifier.trim()}</strong>, we've sent a secure reset link to its registered email address.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.2rem' }}>
            <button
              type="button"
              onClick={handleResend}
              disabled={cooldown > 0 || loading}
              style={{
                width: '100%',
                height: '46px',
                backgroundColor: '#F3EDE2',
                color: cooldown > 0 ? '#675449' : '#1F5A28',
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

            <Link
              to="/login"
              style={{
                fontSize: '0.86rem',
                color: '#1F5A28',
                fontWeight: '700',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.35rem',
              }}
            >
              <ArrowLeft size={15} />
              <span>Back to Login</span>
            </Link>
          </div>
        </div>
      </AuthLayout>
    );
  }

  // State B: WhatsApp OTP sent verification form
  if (otpSent) {
    return (
      <AuthLayout
        badge="SECURITY VERIFICATION"
        titleLine1="Enter WhatsApp"
        titleLine2="Reset Code"
        subtitle="We've sent a 6-digit password reset code to your WhatsApp number."
      >
        <AuthAlert message={error} type="error" />

        <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
          <div
            style={{
              padding: '1rem',
              backgroundColor: '#F7F3EB',
              borderRadius: '14px',
              border: '1.5px solid #1F5A28',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: '#CDE5CB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#1F5A28',
                  }}
                >
                  <MessageSquare size={16} />
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#2B1710' }}>
                    WhatsApp Reset Code
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#5A4438' }}>
                    Sent to {identifier.trim()}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setOtpSent(false);
                  setOtp('');
                  setError('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#1F5A28',
                  fontSize: '0.78rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  padding: '4px',
                }}
              >
                <Edit2 size={13} />
                <span>Edit</span>
              </button>
            </div>

            <AuthInput
              label="6-DIGIT VERIFICATION CODE *"
              type="text"
              icon={ShieldCheck}
              value={otp}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                setOtp(val);
                if (error) setError('');
              }}
              placeholder="000000"
              required
              autoFocus
              inputMode="numeric"
              maxLength={6}
              id="reset-otp"
            />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem' }}>
              <span style={{ color: '#5A4438' }}>Didn't receive the code?</span>
              <button
                type="button"
                onClick={handleResend}
                disabled={cooldown > 0 || loading}
                style={{
                  background: 'none',
                  border: 'none',
                  color: cooldown > 0 ? '#8C7A6F' : '#1F5A28',
                  fontWeight: '800',
                  cursor: cooldown > 0 ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                }}
              >
                <RefreshCw size={13} style={{ animation: loading ? 'authSpinner 0.8s linear infinite' : 'none' }} />
                <span>{cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend WhatsApp OTP'}</span>
              </button>
            </div>
          </div>

          <AuthButton loading={loading} loadingText="Verifying Code..." icon={ArrowRight}>
            Verify Code & Set Password
          </AuthButton>

          <div style={{ textAlign: 'center', paddingTop: '0.4rem' }}>
            <Link
              to="/login"
              style={{
                fontSize: '0.86rem',
                color: '#1F5A28',
                fontWeight: '700',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <ArrowLeft size={15} />
              <span>Back to Login</span>
            </Link>
          </div>
        </form>
      </AuthLayout>
    );
  }

  // State C: Initial Request Form (Enter Email or Mobile)
  return (
    <AuthLayout
      badge="PASSWORD RECOVERY"
      titleLine1="Forgot Your"
      titleLine2="Password?"
      subtitle="Enter your registered mobile number for instant WhatsApp OTP verification, or your email address for a reset link."
    >
      <AuthAlert message={error} type="error" />

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <AuthInput
          label="EMAIL ADDRESS OR MOBILE NUMBER *"
          type="text"
          icon={User}
          value={identifier}
          onChange={(e) => {
            setIdentifier(e.target.value);
            if (error) setError('');
          }}
          placeholder="e.g. 98765 43210 or yourname@gmail.com"
          required
          autoFocus
          id="forgot-identifier"
        />

        <AuthButton loading={loading} loadingText="Sending Reset Code..." icon={ArrowRight}>
          Continue
        </AuthButton>

        <div style={{ textAlign: 'center', paddingTop: '0.4rem' }}>
          <Link
            to="/login"
            style={{
              fontSize: '0.86rem',
              color: '#1F5A28',
              fontWeight: '700',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
          >
            <ArrowLeft size={15} />
            <span>Back to Login</span>
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
