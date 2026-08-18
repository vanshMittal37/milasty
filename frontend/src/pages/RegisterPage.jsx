import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Phone, ArrowRight, ShieldAlert, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const inputStyle = {
  width: '100%',
  height: '52px',
  padding: '0 1rem 0 2.75rem',
  borderRadius: '12px',
  border: '1.5px solid rgba(100, 65, 35, 0.28)',
  fontSize: '0.92rem',
  outline: 'none',
  backgroundColor: 'rgba(255, 252, 245, 0.70)',
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

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await register(name, email, password, phone);
      navigate('/account');
    } catch (err) {
      setError(err.response?.data?.message || 'Error creating account');
    } finally {
      setLoading(false);
    }
  };

  const focusStyle = (e) => {
    e.target.style.borderColor = '#244f21';
    e.target.style.boxShadow = '0 0 0 3px rgba(36,79,33,0.10)';
  };
  const blurStyle = (e) => {
    e.target.style.borderColor = 'rgba(100, 65, 35, 0.28)';
    e.target.style.boxShadow = 'none';
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
        padding: '5rem 1.5rem 3rem',
      }}
    >
      {/* Central frosted glass card */}
      <div
        style={{
          width: '100%',
          maxWidth: '500px',
          backgroundColor: 'rgba(255, 252, 245, 0.88)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderRadius: '28px',
          border: '1px solid rgba(100, 65, 35, 0.18)',
          boxShadow: '0 20px 60px rgba(50, 28, 10, 0.20)',
          padding: '2.75rem 2.5rem 2.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', borderBottom: '1px solid rgba(100, 65, 35, 0.12)', paddingBottom: '1.5rem' }}>
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
            Join the MILASTY Family
          </span>
          <h1
            style={{
              fontSize: '2rem',
              fontFamily: 'var(--font-serif)',
              color: '#24130D',
              fontWeight: '800',
              margin: '0 0 0.35rem',
              letterSpacing: '-0.01em',
            }}
          >
            Create Your Account
          </h1>
          <p style={{ color: '#5C3D20', fontSize: '0.9rem', margin: 0, fontWeight: '500', lineHeight: '1.5' }}>
            Sign up to enjoy personalised millet bakery orders, tracking &amp; exclusive offers.
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
            <ShieldAlert size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>

          {/* Full Name */}
          <div>
            <label style={labelStyle}>Full Name *</label>
            <div style={{ position: 'relative' }}>
              <User size={16} color="#7A5535" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ananya Sharma"
                style={inputStyle}
                onFocus={focusStyle}
                onBlur={blurStyle}
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label style={labelStyle}>Email Address *</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} color="#7A5535" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                style={inputStyle}
                onFocus={focusStyle}
                onBlur={blurStyle}
              />
            </div>
          </div>

          {/* Mobile Number */}
          <div>
            <label style={labelStyle}>Mobile Number <span style={{ color: '#7A5535', fontWeight: '500', textTransform: 'none' }}>(Optional)</span></label>
            <div style={{ position: 'relative' }}>
              <Phone size={16} color="#7A5535" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                style={inputStyle}
                onFocus={focusStyle}
                onBlur={blurStyle}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label style={labelStyle}>Password *</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} color="#7A5535" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                style={{ ...inputStyle, padding: '0 3rem 0 2.75rem' }}
                onFocus={focusStyle}
                onBlur={blurStyle}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#7A5535', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              height: '52px',
              marginTop: '0.5rem',
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
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.75 : 1,
              transition: 'all 0.2s ease',
              fontFamily: 'inherit',
            }}
          >
            {loading ? <span>Creating Account...</span> : <><span>Create Account</span><ArrowRight size={17} /></>}
          </button>
        </form>

        {/* Footer link */}
        <div style={{ textAlign: 'center', fontSize: '0.88rem', color: '#5C3D20', fontWeight: '600' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#244f21', fontWeight: '800', textDecoration: 'none' }}>
            Login here
          </Link>
        </div>

        {/* Trust badges */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', paddingTop: '0.25rem', borderTop: '1px solid rgba(100, 65, 35, 0.10)', flexWrap: 'wrap' }}>
          {['🔒 SSL Secured', '🌿 100% Natural', '🚚 Pan-India Delivery'].map((badge) => (
            <span key={badge} style={{ fontSize: '0.7rem', color: '#7A5535', fontWeight: '600' }}>{badge}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
