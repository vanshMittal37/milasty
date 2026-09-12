import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Lock, Mail, Eye, EyeOff, CheckCircle2, AlertTriangle, ArrowRight, ArrowLeft, Check, X } from 'lucide-react';
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

  // Real-time password requirement checks
  const requirements = [
    { label: 'At least 8 characters', pass: password.length >= 8 },
    { label: 'One uppercase letter', pass: /[A-Z]/.test(password) },
    { label: 'One lowercase letter', pass: /[a-z]/.test(password) },
    { label: 'One number', pass: /\d/.test(password) },
  ];

  const metCount = requirements.filter((r) => r.pass).length;
  const isPasswordValid = requirements.every((r) => r.pass);
  const passwordsMatch = password && confirmPassword && password === confirmPassword;

  const getStrengthLabel = () => {
    if (password.length === 0) return null;
    if (metCount <= 1) return { text: 'Weak', color: '#D96B5F', width: '25%' };
    if (metCount === 2) return { text: 'Fair', color: '#D6A23F', width: '50%' };
    if (metCount === 3) return { text: 'Good', color: '#8FAF5B', width: '75%' };
    return { text: 'Strong', color: '#244f21', width: '100%' };
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
      <AuthLayout badge="Account Security" title="Reset Link Expired" subtitle="This password reset link is no longer valid or has expired. Please request a new link.">
        <div style={{ textAlign: 'center', padding: '0.25rem 0', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              backgroundColor: 'rgba(184, 50, 30, 0.10)',
              color: '#B8321E',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto',
            }}
          >
            <AlertTriangle size={34} color="#B8321E" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.25rem' }}>
            <Link
              to="/forgot-password"
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
              <span>Request New Reset Link</span>
              <ArrowRight size={18} color="#FFFFFF" />
            </Link>

            <Link
              to="/login"
              style={{
                fontSize: '0.85rem',
                color: '#244f21',
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
    return (
      <AuthLayout badge="Account Security" title="Password Updated" subtitle="Your password has been successfully updated. You can now sign in with your new credentials.">
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
              marginTop: '0.25rem',
              boxShadow: '0 4px 14px rgba(36, 79, 33, 0.25)',
              boxSizing: 'border-box',
            }}
          >
            <span>Back to Login</span>
            <ArrowRight size={18} color="#FFFFFF" />
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      badge="New Credentials"
      title="Reset Password"
      subtitle="Create a new secure password for your MILASTY account."
    >
      {/* Error Alert */}
      <AuthAlert message={error} type="error" />

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
        {/* Email Address (if present or editable) */}
        {email && (
          <AuthInput
            label="Registered Email Address *"
            type="email"
            icon={Mail}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your registered email"
            required
            autoComplete="email"
            id="reset-email"
          />
        )}

        {/* New Password */}
        <div>
          <AuthInput
            label="New Password *"
            type={showPassword ? 'text' : 'password'}
            icon={Lock}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) setError('');
            }}
            placeholder="New password"
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
                  color: '#7A5535',
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

          {/* Password Strength & Requirements Checklist */}
          {password.length > 0 && (
            <div
              style={{
                marginTop: '0.6rem',
                padding: '0.65rem 0.85rem',
                backgroundColor: 'rgba(100, 65, 35, 0.04)',
                borderRadius: '10px',
                border: '1px solid rgba(100, 65, 35, 0.10)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.4rem',
              }}
            >
              {strength && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.72rem', color: '#5C3D20', fontWeight: '700' }}>
                    Password strength
                  </span>
                  <span style={{ fontSize: '0.72rem', color: strength.color, fontWeight: '800' }}>
                    {strength.text}
                  </span>
                </div>
              )}

              {/* Strength Bar */}
              {strength && (
                <div
                  style={{
                    height: '4px',
                    width: '100%',
                    backgroundColor: 'rgba(100, 65, 35, 0.15)',
                    borderRadius: '2px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: strength.width,
                      backgroundColor: strength.color,
                      transition: 'all 0.3s ease',
                    }}
                  />
                </div>
              )}

              {/* Requirements list */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '0.25rem 0.5rem',
                  marginTop: '0.2rem',
                }}
              >
                {requirements.map((req, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      fontSize: '0.7rem',
                      color: req.pass ? '#244f21' : '#7A5535',
                      fontWeight: req.pass ? '700' : '500',
                    }}
                  >
                    {req.pass ? (
                      <Check size={12} color="#244f21" style={{ strokeWidth: 3 }} />
                    ) : (
                      <X size={12} color="#9C7756" />
                    )}
                    <span>{req.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Confirm New Password */}
        <div>
          <AuthInput
            label="Confirm New Password *"
            type={showConfirmPassword ? 'text' : 'password'}
            icon={Lock}
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (error) setError('');
            }}
            placeholder="Confirm password"
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
                  color: '#7A5535',
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
          {confirmPassword && (
            <div style={{ marginTop: '0.3rem', fontSize: '0.73rem', fontWeight: '700', color: passwordsMatch ? '#244f21' : '#B8321E' }}>
              {passwordsMatch ? '✓ Passwords match' : '✕ Passwords do not match'}
            </div>
          )}
        </div>

        <AuthButton loading={loading} loadingText="Updating Password..." icon={ArrowRight}>
          Update Password
        </AuthButton>
      </form>
    </AuthLayout>
  );
}
