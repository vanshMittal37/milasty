import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Mail, ArrowRight, ShieldAlert, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const user = await login(email, password);
      if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/account');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
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
        backgroundColor: '#FBF8F2' 
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
          backgroundImage: "linear-gradient(rgba(56, 20, 35, 0.45), rgba(56, 20, 35, 0.45)), url('https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=1000&q=80')",
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
            100% Clean Label
          </span>
        </div>

        {/* Bottom Editorial Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '440px' }}>
          <span style={{ fontSize: '1.5rem', color: 'var(--accent-gold)' }}>✦</span>
          <h2 style={{ fontSize: '3rem', fontFamily: 'var(--font-serif)', fontWeight: '800', margin: 0, letterSpacing: '-0.02em', lineHeight: '1' }}>
            MILASTY.
          </h2>
          <h3 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-serif)', fontWeight: '500', margin: 0, color: 'var(--accent-gold)' }}>
            Where Millets Meet Great Taste.
          </h3>
          <p style={{ fontSize: '0.96rem', lineHeight: '1.6', margin: '0.5rem 0 0 0', opacity: 0.9, fontWeight: '500' }}>
            Handcrafted millet bakes made with pure Desi Ghee and organic Jaggery.
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
            <h2 style={{ fontSize: '2.1rem', fontFamily: 'var(--font-serif)', color: 'var(--primary-dark)', fontWeight: '900', margin: 0 }}>MILASTY</h2>
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
            <h1 style={{ fontSize: '2.1rem', fontFamily: 'var(--font-serif)', color: 'var(--primary-dark)', fontWeight: '800', margin: '0 0 0.5rem 0' }}>Welcome Back</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: 0, fontWeight: '500' }}>Sign in to manage your orders, addresses, and wishlist.</p>
          </div>

          {/* Error Banner */}
          {error && (
            <div style={{ backgroundColor: 'rgba(217, 83, 79, 0.08)', border: '1.5px solid var(--accent-terracotta)', color: 'var(--accent-terracotta)', padding: '0.85rem 1rem', borderRadius: '12px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600' }}>
              <ShieldAlert size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="auth-form" style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem' }}>
            {/* Email field */}
            <div>
              <label style={{ fontSize: '0.76rem', fontWeight: '800', color: 'var(--primary-dark)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Email Address</label>
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
                    backgroundColor: '#FCFAF6',
                    color: 'var(--primary-dark)',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--primary-dark)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                />
              </div>
            </div>

            {/* Password field */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                <label style={{ fontSize: '0.76rem', fontWeight: '800', color: 'var(--primary-dark)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Password</label>
                <Link to="/forgot-password" style={{ fontSize: '0.78rem', color: 'var(--accent-gold)', fontWeight: '800', textDecoration: 'none' }}>Forgot password?</Link>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ 
                    width: '100%', 
                    height: '52px', 
                    padding: '0 3rem 0 2.75rem', 
                    borderRadius: '12px', 
                    border: '1.5px solid var(--border-color)', 
                    fontSize: '0.9rem',
                    outline: 'none',
                    backgroundColor: '#FCFAF6',
                    color: 'var(--primary-dark)',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--primary-dark)'}
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

            {/* Login button */}
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
                backgroundColor: 'var(--primary-dark)',
                color: '#FFFFFF',
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
              {loading ? <span>Signing in...</span> : <><span>Login to Account</span><ArrowRight size={16} /></>}
            </button>
          </form>

          {/* Redirect to Register link */}
          <div style={{ textAlign: 'center', fontSize: '0.86rem', color: 'var(--text-muted)', fontWeight: '600' }}>
            Don't have an account? <Link to="/register" style={{ color: 'var(--primary-dark)', fontWeight: '800', textDecoration: 'none' }}>Create one here</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
