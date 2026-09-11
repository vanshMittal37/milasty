import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Lock, Mail, Eye, EyeOff, CheckCircle2, ShieldAlert, AlertTriangle, ArrowRight, ArrowLeft } from 'lucide-react';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';
import { supabase } from '../config/supabase';

const inputStyle = {
  width: '100%',
  height: '52px',
  padding: '0 3rem 0 2.75rem',
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

    if (token) {
      setAccessToken(token);
    }
    if (customToken) {
      setResetToken(customToken);
    }
    if (refresh) {
      setRefreshToken(refresh);
    }
    if (userEmail) {
      setEmail(userEmail);
    }

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, [location]);

  // Real-time password requirement checks
  const requirements = [
    { label: '8+ characters', pass: password.length >= 8 },
    { label: 'Uppercase letter', pass: /[A-Z]/.test(password) },
    { label: 'Lowercase letter', pass: /[a-z]/.test(password) },
    { label: 'Number', pass: /\d/.test(password) },
  ];

  const isPasswordValid = requirements.every((r) => r.pass);
  const passwordsMatch = password && confirmPassword && password === confirmPassword;

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
      let supabaseSuccess = false;
      try {
        const { error: sErr } = await supabase.auth.updateUser({ password });
        if (!sErr) supabaseSuccess = true;
      } catch (err) {
        console.warn('Frontend Supabase Auth updateUser warning:', err);
      }

      // 2. Call backend API to update password (supports JWT token and Supabase access_token)
      const res = await api.post('/auth/reset-password', {
        email,
        password,
        token: resetToken || null,
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      // 3. Clear recovery session to prevent session reuse
      try {
        await supabase.auth.signOut();
      } catch (e) {}

      setSuccess(true);
      toast.success(res.data?.message || 'Password updated successfully!');

      // Redirect to login after 3 seconds
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
        {/* EXPIRED / INVALID TOKEN SCREEN */}
        {isExpired ? (
          <div style={{ textAlign: 'center', padding: '0.5rem 0', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'rgba(184, 50, 30, 0.10)',
                color: '#B8321E',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
              }}
            >
              <AlertTriangle size={36} />
            </div>

            <div>
              <h1
                style={{
                  fontSize: '1.75rem',
                  fontFamily: 'var(--font-serif)',
                  color: '#24130D',
                  fontWeight: '800',
                  margin: '0 0 0.4rem',
                }}
              >
                Reset Link Expired
              </h1>
              <p style={{ color: '#5C3D20', fontSize: '0.88rem', lineHeight: '1.5', margin: 0 }}>
                This password reset link is no longer valid or has expired. Please request a new password reset link.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
              <Link
                to="/forgot-password"
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
                <span>Request New Reset Link</span>
                <ArrowRight size={18} />
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
        ) : success ? (
          /* SUCCESS SCREEN */
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
              <h1
                style={{
                  fontSize: '1.75rem',
                  fontFamily: 'var(--font-serif)',
                  color: '#24130D',
                  fontWeight: '800',
                  margin: '0 0 0.4rem',
                }}
              >
                Password Updated Successfully
              </h1>
              <p style={{ color: '#5C3D20', fontSize: '0.88rem', lineHeight: '1.5', margin: 0 }}>
                Your password has been changed successfully. You can now sign in using your new password.
              </p>
            </div>

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
                marginTop: '0.5rem',
                boxSizing: 'border-box',
              }}
            >
              <span>Continue to Login</span>
              <ArrowRight size={18} />
            </Link>
          </div>
        ) : (
          /* RESET PASSWORD FORM */
          <>
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
                New Credentials
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
                Create New Password
              </h1>
              <p style={{ color: '#5C3D20', fontSize: '0.88rem', margin: 0, fontWeight: '500', lineHeight: '1.5' }}>
                Set a strong new password for your MILASTY account.
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

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              {/* Registered Email Address */}
              <div>
                <label style={labelStyle}>Registered Email Address *</label>
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

              {/* New Password */}
              <div>
                <label style={labelStyle}>New Password *</label>
                <div style={{ position: 'relative' }}>
                  <Lock
                    size={16}
                    color="#7A5535"
                    style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                  />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="Enter new password"
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
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '14px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#7A5535',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      padding: 0,
                    }}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              {/* Password Requirements Checklist */}
              <div
                style={{
                  backgroundColor: 'rgba(100, 65, 35, 0.05)',
                  borderRadius: '12px',
                  padding: '0.75rem 0.9rem',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '0.4rem 0.75rem',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                }}
              >
                {requirements.map((req, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: req.pass ? '#244f21' : '#7A5535' }}>
                    <span style={{ fontWeight: '800', fontSize: '0.85rem' }}>{req.pass ? '✓' : '○'}</span>
                    <span>{req.label}</span>
                  </div>
                ))}
              </div>

              {/* Confirm Password */}
              <div>
                <label style={labelStyle}>Confirm New Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock
                    size={16}
                    color="#7A5535"
                    style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                  />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="Confirm new password"
                    style={{
                      ...inputStyle,
                      borderColor: confirmPassword && !passwordsMatch ? '#B8321E' : 'rgba(100, 65, 35, 0.28)',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = confirmPassword && !passwordsMatch ? '#B8321E' : '#244f21';
                      e.target.style.boxShadow = '0 0 0 3px rgba(36,79,33,0.10)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = confirmPassword && !passwordsMatch ? '#B8321E' : 'rgba(100, 65, 35, 0.28)';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{
                      position: 'absolute',
                      right: '14px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#7A5535',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      padding: 0,
                    }}
                  >
                    {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                {confirmPassword && !passwordsMatch && (
                  <span style={{ fontSize: '0.75rem', color: '#B8321E', fontWeight: '700', marginTop: '0.35rem', display: 'block' }}>
                    Passwords do not match
                  </span>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !isPasswordValid || !passwordsMatch}
                style={{
                  width: '100%',
                  height: '52px',
                  marginTop: '0.35rem',
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
                  cursor: loading || !isPasswordValid || !passwordsMatch ? 'not-allowed' : 'pointer',
                  opacity: loading || !isPasswordValid || !passwordsMatch ? 0.65 : 1,
                  transition: 'all 0.2s ease',
                  fontFamily: 'inherit',
                }}
              >
                {loading ? (
                  <span style={{ color: '#FFFFFF', fontWeight: '800' }}>Updating...</span>
                ) : (
                  <>
                    <span style={{ color: '#FFFFFF', fontWeight: '800' }}>Update Password</span>
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
          </>
        )}
      </div>
    </div>
  );
}
