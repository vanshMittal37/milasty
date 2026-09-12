import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Phone, ArrowRight, Eye, EyeOff, Check, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { AuthLayout, AuthInput, AuthButton, AuthAlert } from '../components/common/AuthComponents';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Password requirements calculation
  const requirements = [
    { label: 'At least 8 characters', pass: password.length >= 8 },
    { label: 'One uppercase letter', pass: /[A-Z]/.test(password) },
    { label: 'One lowercase letter', pass: /[a-z]/.test(password) },
    { label: 'One number', pass: /\d/.test(password) },
  ];
  const metCount = requirements.filter((r) => r.pass).length;

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

    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!email.trim()) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await register(name.trim(), email.trim(), password, phone.trim());
      toast.success('Account created successfully! Welcome to MILASTY.');
      navigate('/account');
    } catch (err) {
      const msg = err.response?.data?.message || 'Error creating account. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      badge="Join the MILASTY Family"
      title="Create Your Account"
      subtitle="Sign up to enjoy personalised millet bakery orders, tracking & exclusive offers."
    >
      {/* Error Alert */}
      <AuthAlert message={error} type="error" />

      {/* Registration Form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
        {/* Full Name */}
        <AuthInput
          label="Full Name *"
          type="text"
          icon={User}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (error) setError('');
          }}
          placeholder="Your full name"
          required
          autoComplete="name"
          id="register-name"
        />

        {/* Email Address */}
        <AuthInput
          label="Email Address *"
          type="email"
          icon={Mail}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) setError('');
          }}
          placeholder="email@example.com"
          required
          autoComplete="email"
          id="register-email"
        />

        {/* Mobile Number */}
        <AuthInput
          label="Mobile Number"
          hint="(Optional)"
          type="tel"
          icon={Phone}
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value);
            if (error) setError('');
          }}
          placeholder="+91 XXXXX XXXXX"
          autoComplete="tel"
          id="register-phone"
        />

        {/* Password Field */}
        <div>
          <AuthInput
            label="Password *"
            type={showPassword ? 'text' : 'password'}
            icon={Lock}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) setError('');
            }}
            placeholder="Create a strong password"
            required
            autoComplete="new-password"
            id="register-password"
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

          {/* Compact Password Strength & Requirement Checklist */}
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

              {/* Requirement indicators */}
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

        {/* High Contrast Submit Button */}
        <AuthButton loading={loading} loadingText="Creating Account..." icon={ArrowRight}>
          Create Account
        </AuthButton>
      </form>

      {/* Switch to Login */}
      <div style={{ textAlign: 'center', fontSize: '0.88rem', color: '#5C3D20', fontWeight: '600', paddingTop: '0.1rem' }}>
        Already have an account?{' '}
        <Link to="/login" style={{ color: '#244f21', fontWeight: '800', textDecoration: 'none' }}>
          Login here
        </Link>
      </div>
    </AuthLayout>
  );
}
