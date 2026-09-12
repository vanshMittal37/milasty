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
      badge="Customer Portal"
      title="Welcome Back"
      subtitle="Sign in to manage your orders, addresses, and wishlist."
    >
      {/* Error Alert */}
      <AuthAlert message={error} type="error" />

      {/* Login Form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Email Field */}
        <AuthInput
          label="Email Address"
          type="email"
          icon={Mail}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) setError('');
          }}
          placeholder="name@example.com"
          required
          autoComplete="email"
          id="login-email"
        />

        {/* Password Field with Forgot Link & Eye Toggle */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label
              htmlFor="login-password"
              style={{
                fontSize: '0.74rem',
                fontWeight: '800',
                color: '#4A2C10',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Password
            </label>
            <Link
              to="/forgot-password"
              style={{
                fontSize: '0.78rem',
                color: '#244f21',
                fontWeight: '800',
                textDecoration: 'none',
                transition: 'opacity 0.2s',
              }}
            >
              Forgot password?
            </Link>
          </div>

          <AuthInput
            type={showPassword ? 'text' : 'password'}
            icon={Lock}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) setError('');
            }}
            placeholder="••••••••"
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
        </div>

        {/* Submit Button with High Contrast Text */}
        <AuthButton loading={loading} loadingText="Signing In..." icon={ArrowRight}>
          Sign In to Account
        </AuthButton>
      </form>

      {/* Switch to Register */}
      <div style={{ textAlign: 'center', fontSize: '0.88rem', color: '#5C3D20', fontWeight: '600', paddingTop: '0.1rem' }}>
        Don't have an account?{' '}
        <Link to="/register" style={{ color: '#244f21', fontWeight: '800', textDecoration: 'none' }}>
          Create one here
        </Link>
      </div>
    </AuthLayout>
  );
}
