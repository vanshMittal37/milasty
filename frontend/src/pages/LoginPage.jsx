import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { AuthLayout, AuthInput, AuthButton, AuthAlert } from '../components/common/AuthComponents';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const user = await login(email.trim(), password);
      toast.success(`Welcome back, ${user?.name || 'Customer'}!`);
      if (user?.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/account');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid email or password. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      badge="CUSTOMER PORTAL"
      titleLine1="Welcome"
      titleLine2="Back"
      subtitle="Sign in to manage your orders, addresses, and wishlist."
    >
      {/* Error Alert */}
      <AuthAlert message={error} type="error" />

      {/* Login Form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
        {/* Email Field */}
        <AuthInput
          label="EMAIL ADDRESS"
          type="email"
          icon={Mail}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) setError('');
          }}
          placeholder="Enter your email address"
          required
          autoComplete="email"
          id="login-email"
        />

        {/* Password Field with Forgot Link & Eye Toggle */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label
              htmlFor="login-password"
              style={{
                fontSize: '0.74rem',
                fontWeight: '900',
                color: '#2E180C',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              PASSWORD
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
            placeholder="Enter your password"
            required
            autoComplete="current-password"
            id="login-password"
            rightElement={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#4A2F17',
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

          <div style={{ textAlign: 'right', marginTop: '0.15rem' }}>
            <Link
              to="/forgot-password"
              style={{
                fontSize: '0.82rem',
                color: '#1C4019',
                fontWeight: '800',
                textDecoration: 'none',
              }}
            >
              Forgot password?
            </Link>
          </div>
        </div>

        {/* Primary Action Button */}
        <AuthButton loading={loading} loadingText="Signing In..." icon={ArrowRight}>
          Sign In to Account
        </AuthButton>
      </form>

      {/* Social Logins OR Separator matching reference */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginTop: '0.2rem' }}>
        <div style={{ position: 'relative', textAlign: 'center' }}>
          <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1.5px', backgroundColor: '#D8CCB8' }} />
          <span style={{ position: 'relative', backgroundColor: '#FBF9F4', padding: '0 0.75rem', fontSize: '0.74rem', color: '#5C4329', fontWeight: '800' }}>
            OR
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
          <button
            type="button"
            onClick={() => toast.info('Google Sign-in initialized')}
            style={{
              height: '42px',
              backgroundColor: '#FFFFFF',
              border: '1.5px solid #D8CCB8',
              borderRadius: '10px',
              fontSize: '0.76rem',
              fontWeight: '800',
              color: '#2E180C',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              cursor: 'pointer',
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.13C3.25 21.32 7.33 24 12 24z"/>
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.6H1.24C.45 8.17 0 9.98 0 12s.45 3.83 1.24 5.4l4.04-3.13z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.25 2.68 1.24 6.6l4.04 3.13c.95-2.83 3.6-4.98 6.72-4.98z"/>
            </svg>
            <span>Continue with Google</span>
          </button>

          <button
            type="button"
            onClick={() => toast.info('Apple Sign-in initialized')}
            style={{
              height: '42px',
              backgroundColor: '#FFFFFF',
              border: '1.5px solid #D8CCB8',
              borderRadius: '10px',
              fontSize: '0.76rem',
              fontWeight: '800',
              color: '#2E180C',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              cursor: 'pointer',
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="#000000">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.35c.67-.82 1.13-1.96.99-3.1-.98.04-2.16.66-2.86 1.47-.62.72-1.16 1.88-.99 3.01 1.09.09 2.2-.56 2.86-1.38z"/>
            </svg>
            <span>Continue with Apple</span>
          </button>
        </div>
      </div>

      {/* Switch to Register */}
      <div style={{ textAlign: 'center', fontSize: '0.88rem', color: '#4A2F17', fontWeight: '700', paddingTop: '0.2rem' }}>
        Don't have an account?{' '}
        <Link to="/register" style={{ color: '#1C4019', fontWeight: '900', textDecoration: 'none' }}>
          Create one here
        </Link>
      </div>
    </AuthLayout>
  );
}
