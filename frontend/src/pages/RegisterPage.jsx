import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Phone, ArrowRight, ShieldAlert, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

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

  return (
    <div 
      style={{ 
        minHeight: '100vh', 
        display: 'grid', 
        gridTemplateColumns: '1fr', 
        backgroundColor: 'var(--bg-main)' 
      }}
      className="auth-split-layout"
    >
      <style>{`
        @media (min-width: 768px) {
          .auth-split-layout {
            grid-template-columns: 40% 60% !important;
          }
        }
        @media (min-width: 1024px) {
          .auth-split-layout {
            grid-template-columns: 50% 50% !important;
          }
        }
      `}</style>

      {/* ==================================================
          LEFT SIDE: BRAND IMAGE PANEL (Desktop / Tablet)
         ================================================== */}
      <div 
        style={{ 
          position: 'relative', 
          height: '100%', 
          minHeight: '100vh',
          display: 'none',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '3rem',
          backgroundImage: "linear-gradient(rgba(56, 20, 35, 0.45), rgba(56, 20, 35, 0.45)), url('https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1000&q=80')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          color: '#FFFFFF'
        }}
        className="auth-image-panel"
      >
        <style>{`
          @media (min-width: 768px) {
            .auth-image-panel {
              display: flex !important;
            }
          }
        `}</style>
        
        {/* Top Header Badge */}
        <div>
          <span 
            style={{ 
              fontSize: '0.68rem', 
              fontWeight: '800', 
              textTransform: 'uppercase', 
              letterSpacing: '0.08em', 
              backgroundColor: 'rgba(255, 255, 255, 0.25)', 
              color: '#FFFFFF',
              border: '1.5px solid rgba(255, 255, 255, 0.4)',
              padding: '0.35rem 0.85rem', 
              borderRadius: '999px',
              backdropFilter: 'blur(4px)'
            }}
          >
            Made with Millets • Made with Care
          </span>
        </div>

        {/* Bottom Editorial Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '440px' }}>
          <span style={{ fontSize: '1.5rem', color: 'var(--accent-gold)' }}>✦</span>
          <h2 style={{ fontSize: '3rem', fontFamily: 'var(--font-serif)', fontWeight: '800', margin: 0, letterSpacing: '-0.02em', lineHeight: '1' }}>
            MILASTY.
          </h2>
          <h3 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-serif)', fontWeight: '500', margin: 0, color: 'var(--accent-gold)' }}>
            Begin Your MILASTY Ritual
          </h3>
          <p style={{ fontSize: '0.96rem', lineHeight: '1.6', margin: '0.5rem 0 0 0', opacity: 0.9, fontWeight: '500' }}>
            Create your account and enjoy handcrafted millet goodness, order tracking and a more personal shopping experience.
          </p>
        </div>
      </div>

      {/* ==================================================
          RIGHT SIDE: AUTHENTICATION FORM
         ================================================== */}
      <div 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          padding: '2.5rem 1.5rem',
          minHeight: '100vh'
        }}
      >
        <div 
          style={{ 
            width: '100%', 
            maxWidth: '440px', 
            display: 'flex', 
            flexDirection: 'column',
            gap: '2.25rem' 
          }}
        >
          {/* Mobile Brand Logo Header */}
          <div 
            style={{ 
              textAlign: 'center', 
              display: 'none',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.5rem'
            }}
            className="auth-mobile-logo"
          >
            <style>{`
              @media (max-width: 767px) {
                .auth-mobile-logo {
                  display: flex !important;
                }
              }
            `}</style>
            <h2 style={{ fontSize: '2.1rem', fontFamily: 'var(--font-serif)', color: 'var(--text-light)', fontWeight: '900', margin: 0 }}>MILASTY</h2>
            <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent-gold)', fontWeight: '800' }}>Where Millets Meet Great Taste</span>
          </div>

          {/* Form Header */}
          <div style={{ textAlign: 'left' }}>
            <span 
              style={{ 
                fontSize: '0.68rem', 
                fontWeight: '800', 
                textTransform: 'uppercase', 
                letterSpacing: '0.08em', 
                color: 'var(--accent-gold)',
                backgroundColor: 'rgba(197, 160, 89, 0.08)',
                padding: '0.3rem 0.65rem',
                borderRadius: '6px',
                display: 'inline-block',
                marginBottom: '0.75rem'
              }}
            >
              Customer Portal
            </span>
            <h1 style={{ fontSize: '2.1rem', fontFamily: 'var(--font-serif)', color: 'var(--text-light)', fontWeight: '800', margin: '0 0 0.5rem 0' }}>Create Your Account</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: 0, fontWeight: '500' }}>Sign up to enjoy personalized millet bakery orders and tracking.</p>
          </div>

          {/* Error Banner */}
          {error && (
            <div style={{ backgroundColor: 'rgba(217, 83, 79, 0.08)', border: '1.5px solid var(--accent-terracotta)', color: 'var(--accent-terracotta)', padding: '0.85rem 1rem', borderRadius: '12px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600' }}>
              <ShieldAlert size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="auth-form" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            
            {/* Full Name */}
            <div>
              <label style={{ fontSize: '0.76rem', fontWeight: '800', color: 'var(--text-light)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Full Name *</label>
              <div style={{ position: 'relative' }}>
                <User size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ananya Sharma"
                  style={{ 
                    width: '100%', 
                    height: '52px', 
                    padding: '0 1rem 0 2.75rem', 
                    borderRadius: '12px', 
                    border: '1.5px solid var(--border-color)', 
                    fontSize: '0.9rem',
                    outline: 'none',
                    backgroundColor: 'transparent',
                    color: 'var(--text-light)',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--accent-gold)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label style={{ fontSize: '0.76rem', fontWeight: '800', color: 'var(--text-light)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Email Address *</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  style={{ 
                    width: '100%', 
                    height: '52px', 
                    padding: '0 1rem 0 2.75rem', 
                    borderRadius: '12px', 
                    border: '1.5px solid var(--border-color)', 
                    fontSize: '0.9rem',
                    outline: 'none',
                    backgroundColor: 'transparent',
                    color: 'var(--text-light)',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--accent-gold)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                />
              </div>
            </div>

            {/* Mobile Number */}
            <div>
              <label style={{ fontSize: '0.76rem', fontWeight: '800', color: 'var(--text-light)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Mobile Number</label>
              <div style={{ position: 'relative' }}>
                <Phone size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  style={{ 
                    width: '100%', 
                    height: '52px', 
                    padding: '0 1rem 0 2.75rem', 
                    borderRadius: '12px', 
                    border: '1.5px solid var(--border-color)', 
                    fontSize: '0.9rem',
                    outline: 'none',
                    backgroundColor: 'transparent',
                    color: 'var(--text-light)',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--accent-gold)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={{ fontSize: '0.76rem', fontWeight: '800', color: 'var(--text-light)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Password *</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  style={{ 
                    width: '100%', 
                    height: '52px', 
                    padding: '0 3rem 0 2.75rem', 
                    borderRadius: '12px', 
                    border: '1.5px solid var(--border-color)', 
                    fontSize: '0.9rem',
                    outline: 'none',
                    backgroundColor: 'transparent',
                    color: 'var(--text-light)',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--accent-gold)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 0
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit button */}
            <button 
              type="submit" 
              disabled={loading} 
              className="btn-primary" 
              style={{ 
                width: '100%', 
                height: '52px', 
                justifyContent: 'center', 
                padding: '0.85rem', 
                marginTop: '0.75rem',
                backgroundColor: 'var(--accent-gold)',
                color: '#24130D',
                borderRadius: '12px',
                border: 'none',
                fontWeight: '800',
                fontSize: '0.92rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                cursor: 'pointer'
              }}
            >
              {loading ? <span>Creating Account...</span> : <><span>Create Account</span><ArrowRight size={16} /></>}
            </button>
          </form>

          {/* Redirect to Login link */}
          <div style={{ textAlign: 'center', fontSize: '0.86rem', color: 'var(--text-muted)', fontWeight: '600' }}>
            Already have an account? <Link to="/login" style={{ color: 'var(--accent-gold)', fontWeight: '800', textDecoration: 'none' }}>Login here</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
