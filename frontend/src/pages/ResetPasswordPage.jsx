import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle2, AlertTriangle, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';
import { supabase } from '../config/supabase';
import { AuthLayout, AuthInput, AuthButton, AuthAlert } from '../components/common/AuthComponents';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isExpired, setIsExpired] = useState(false);

  // Extracted auth params from URL
  const [accessToken, setAccessToken] = useState('');
  const [refreshToken, setRefreshToken] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    // Listen to Supabase Auth state / recovery events
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) {
        if (session?.access_token) {
          setAccessToken(session.access_token);
        }
        if (session?.user?.email) {
          setEmail(session.user.email);
        }
      }
    });

    // Parse Hash Fragment (#access_token=...&refresh_token=...&type=recovery)
    const hash = location.hash;
    const search = location.search;

    const hashParams = new URLSearchParams(hash.startsWith('#') ? hash.substring(1) : hash);
    const queryParams = new URLSearchParams(search);

    const token = hashParams.get('access_token') || queryParams.get('access_token');
    const customToken = queryParams.get('token');
    const refresh = hashParams.get('refresh_token') || queryParams.get('refresh_token');
    const userEmail = hashParams.get('email') || queryParams.get('email');
    const errorDesc = hashParams.get('error_description') || queryParams.get('error_description');

    if (errorDesc || hash.includes('error=unauthorized_client') || hash.includes('error_code=404')) {
      setIsExpired(true);
      return;
    }

    if (token) setAccessToken(token);
    if (customToken) setResetToken(customToken);
    if (refresh) setRefreshToken(refresh);
    if (userEmail) setEmail(userEmail);

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, [location]);

  // Real-time password requirement checks matching requirements
  const requirements = [
    { label: 'At least 8 characters', pass: password.length >= 8 },
    { label: 'One uppercase letter (A-Z)', pass: /[A-Z]/.test(password) },
    { label: 'One lowercase letter (a-z)', pass: /[a-z]/.test(password) },
    { label: 'One number (0-9)', pass: /\d/.test(password) },
  ];

  const metCount = requirements.filter((r) => r.pass).length;
  const isPasswordValid = requirements.every((r) => r.pass);
  const passwordsMatch = password && confirmPassword && password === confirmPassword;

  const getStrengthLabel = () => {
    if (password.length === 0) return { text: 'Weak', color: '#5A4438', bars: 1 };
    if (metCount <= 1) return { text: 'Weak', color: '#D9534F', bars: 1 };
    if (metCount === 2) return { text: 'Fair', color: '#D6A23F', bars: 2 };
    if (metCount === 3) return { text: 'Good', color: '#7AA34A', bars: 3 };
    return { text: 'Strong', color: '#1F5A28', bars: 4 };
  };

  const strength = getStrengthLabel();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isPasswordValid) {
      const msg = 'Please meet all password requirements.';
      setError(msg);
      toast.error(msg);
      return;
    }

    if (!passwordsMatch) {
      const msg = 'Passwords do not match.';
      setError(msg);
      toast.error(msg);
      return;
    }

    setError('');
    setLoading(true);

    try {
      // 1. Update password in Supabase Auth client if session present
      try {
        await supabase.auth.updateUser({ password });
      } catch (err) {
        console.warn('Frontend Supabase Auth updateUser warning:', err);
      }

      // 2. Call backend API to update password
      const res = await api.post('/auth/reset-password', {
        email,
        password,
        token: resetToken || null,
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      // 3. Clear recovery session
      try {
        await supabase.auth.signOut();
      } catch (e) {}

      setSuccess(true);
      toast.success(res.data?.message || 'Password updated successfully!');

      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update password. Link may be expired.';
      setError(msg);
      toast.error(msg);
      if (err.response?.status === 400 && msg.toLowerCase().includes('expired')) {
        setIsExpired(true);
      }
    } finally {
      setLoading(false);
    }
  };

  if (isExpired) {
    return (
      <AuthLayout badge="ACCOUNT SECURITY" titleLine1="Reset Link" titleLine2="Expired" subtitle="This password reset link is no longer valid or has expired. Please request a new link.">
        <div style={{ textAlign: 'center', padding: '0.25rem 0', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: '#FDF2F0',
              color: '#B8321E',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto',
            }}
          >
            <AlertTriangle size={32} color="#B8321E" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.25rem' }}>
            <Link
              to="/forgot-password"
              style={{
                width: '100%',
                height: '50px',
                backgroundColor: '#1F5A28',
                color: '#FFFFFF',
                borderRadius: '12px',
                fontWeight: '700',
                fontSize: '0.95rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                textDecoration: 'none',
                boxShadow: '0 4px 14px rgba(31, 90, 40, 0.28)',
                boxSizing: 'border-box',
              }}
            >
              <span>Request New Reset Link</span>
              <ArrowRight size={18} color="#FFFFFF" />
            </Link>

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
              <ArrowLeft size={16} />
              <span>Back to Login</span>
            </Link>
          </div>
        </div>
      </AuthLayout>
    );
  }

  if (success) {
    /* Reset Success Card matching Reset Password Success Screen */
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
              Password Updated
            </h1>
            <p style={{ color: '#5A4438', fontSize: '0.88rem', lineHeight: '1.5', margin: 0, fontWeight: '500' }}>
              Your password has been successfully updated. You can now log in with your new password.
            </p>
          </div>

          <Link
            to="/login"
            style={{
              width: '100%',
              height: '50px',
              backgroundColor: '#1F5A28',
              color: '#FFFFFF',
              borderRadius: '12px',
              fontWeight: '700',
              fontSize: '0.95rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              textDecoration: 'none',
              marginTop: '0.2rem',
              boxShadow: '0 4px 14px rgba(31, 90, 40, 0.28)',
              boxSizing: 'border-box',
            }}
          >
            <span>Go to Login →</span>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      badge="ACCOUNT SECURITY"
      titleLine1="Reset"
      titleLine2="Password"
      subtitle="Create a new secure password for your MILASTY account."
    >
      {/* Error Alert */}
      <AuthAlert message={error} type="error" />

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.05rem' }}>
        {/* New Password */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <label
              htmlFor="reset-password"
              className="auth-label"
              style={{
                fontSize: '0.74rem',
                fontWeight: '700',
                color: '#3A2922',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              NEW PASSWORD
            </label>
          </div>

          <AuthInput
            type={showPassword ? 'text' : 'password'}
            icon={Lock}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) setError('');
            }}
            placeholder="Enter new password"
            required
            autoComplete="new-password"
            id="reset-password"
            rightElement={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#5A4438',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '4px',
                  borderRadius: '4px',
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            }
          />

          {/* Password Strength Indicator Header matching requirements */}
          <div
            style={{
              marginTop: '0.6rem',
              padding: '0.65rem 0.85rem',
              backgroundColor: '#F3EDE2',
              borderRadius: '12px',
              border: '1.5px solid #D8CCB8',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.45rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.74rem', color: '#5A4438', fontWeight: '700' }}>
                Password strength
              </span>
              <span style={{ fontSize: '0.74rem', color: strength.color, fontWeight: '800' }}>
                {strength.text}
              </span>
            </div>

            {/* 4 Segmented Bars */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
              {[1, 2, 3, 4].map((segment) => (
                <div
                  key={segment}
                  style={{
                    height: '5px',
                    borderRadius: '2px',
                    backgroundColor: segment <= strength.bars ? strength.color : '#D8CCB8',
                    transition: 'all 0.3s ease',
                  }}
                />
              ))}
            </div>

            {/* Checklist Requirements */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginTop: '0.2rem' }}>
              {requirements.map((req, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    fontSize: '0.74rem',
                    color: req.pass ? '#1F5A28' : '#5A4438',
                    fontWeight: '700',
                  }}
                >
                  <div
                    style={{
                      width: '15px',
                      height: '15px',
                      borderRadius: '50%',
                      backgroundColor: req.pass ? '#1F5A28' : '#C8BBA7',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <CheckCircle2 size={11} color={req.pass ? '#FFFFFF' : '#5A4438'} />
                  </div>
                  <span>{req.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Confirm New Password */}
        <div>
          <AuthInput
            label="CONFIRM PASSWORD"
            type={showConfirmPassword ? 'text' : 'password'}
            icon={Lock}
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (error) setError('');
            }}
            placeholder="Confirm new password"
            required
            autoComplete="new-password"
            id="reset-confirm-password"
            rightElement={
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#5A4438',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '4px',
                  borderRadius: '4px',
                }}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            }
          />
        </div>

        <AuthButton loading={loading} loadingText="Updating Password..." icon={ArrowRight}>
          Update Password
        </AuthButton>

        <div style={{ textAlign: 'center', paddingTop: '0.1rem' }}>
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
            <ArrowLeft size={16} />
            <span>Back to Login</span>
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
