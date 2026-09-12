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
              className="auth-label"
              style={{
                fontSize: '0.74rem',
                fontWeight: '700',
                color: '#3A2922 !important',
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

          <div style={{ textAlign: 'right', marginTop: '0.15rem' }}>
            <Link
              to="/forgot-password"
              style={{
                fontSize: '0.82rem',
                color: '#1F5A28 !important',
                fontWeight: '700',
                textDecoration: 'none',
              }}
            >
              Forgot password?
            </Link>
          </div>
        </div>

        {/* Primary Action Button - Sign In to Account */}
        <AuthButton loading={loading} loadingText="Signing In..." icon={ArrowRight}>
          Sign In to Account
        </AuthButton>
      </form>

      {/* Switch to Register (NO Google/Apple/OR divider) */}
      <div style={{ textAlign: 'center', fontSize: '0.88rem', color: '#5A4438 !important', fontWeight: '600', paddingTop: '0.2rem' }}>
        Don't have an account?{' '}
        <Link to="/register" style={{ color: '#1F5A28 !important', fontWeight: '800', textDecoration: 'none' }}>
          Create one here
        </Link>
      </div>
    </AuthLayout>
  );
}
