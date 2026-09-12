import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Phone, ArrowRight, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
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

  // Password requirements checklist strictly matching reference image UI
  const requirements = [
    { label: 'At least 8 characters', pass: password.length >= 8 },
    { label: 'One uppercase letter (A-Z)', pass: /[A-Z]/.test(password) },
    { label: 'One lowercase letter (a-z)', pass: /[a-z]/.test(password) },
    { label: 'One number (0-9)', pass: /\d/.test(password) },
  ];

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
      badge="JOIN THE MILASTY FAMILY"
      titleLine1="Create Your"
      titleLine2="Account"
      subtitle="Sign up to enjoy personalised millet bakery orders, tracking & exclusive offers."
    >
      {/* Error Alert */}
      <AuthAlert message={error} type="error" />

      {/* Registration Form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.05rem' }}>
        {/* Full Name */}
        <AuthInput
          label="FULL NAME"
          type="text"
          icon={User}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (error) setError('');
          }}
          placeholder="Enter your full name"
          required
          autoComplete="name"
          id="register-name"
        />

        {/* Email Address */}
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
          id="register-email"
        />

        {/* Mobile Number */}
        <AuthInput
          label="MOBILE NUMBER (Optional)"
          type="tel"
          icon={Phone}
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value);
            if (error) setError('');
          }}
          placeholder="+91 98765 43210"
          autoComplete="tel"
          id="register-phone"
        />

        {/* Password */}
        <div>
          <AuthInput
            label="PASSWORD"
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
                  color: '#6B4A2F',
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

          {/* Checklist Box matching Reference Image */}
          <div
            style={{
              marginTop: '0.6rem',
              padding: '0.65rem 0.85rem',
              backgroundColor: '#F5F1E8',
              borderRadius: '12px',
              border: '1px solid #E2D7C7',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.35rem',
            }}
          >
            {requirements.map((req, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  fontSize: '0.74rem',
                  color: req.pass ? '#244F21' : '#6B4A2F',
                  fontWeight: req.pass ? '700' : '500',
                }}
              >
                <div
                  style={{
                    width: '15px',
                    height: '15px',
                    borderRadius: '50%',
                    backgroundColor: req.pass ? '#244F21' : '#E2D7C7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <CheckCircle2 size={11} color={req.pass ? '#FFFFFF' : '#8A7352'} />
                </div>
                <span>{req.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* High Contrast Submit Button */}
        <AuthButton loading={loading} loadingText="Creating Account..." icon={ArrowRight}>
          Create Account
        </AuthButton>
      </form>

      {/* Switch to Login */}
      <div style={{ textAlign: 'center', fontSize: '0.86rem', color: '#5C3D20', fontWeight: '600', paddingTop: '0.1rem' }}>
        Already have an account?{' '}
        <Link to="/login" style={{ color: '#244F21', fontWeight: '800', textDecoration: 'none' }}>
          Login here
        </Link>
      </div>
    </AuthLayout>
  );
}
