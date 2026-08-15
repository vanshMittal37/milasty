import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, Mail, ArrowRight, ShieldAlert, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@milasty.com');
  const [password, setPassword] = useState('Admin@123456');
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
        setError('Access denied: Account does not have administrator role.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid admin credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: '2.5rem 1.5rem',
        backgroundColor: '#FBF8F2' 
      }}
    >
      <div 
        className="glass-card animate-slide-up" 
        style={{ 
          width: '100%', 
          maxWidth: '430px', 
          padding: '3rem 2.5rem', 
          backgroundColor: '#FFFFFF', 
          borderRadius: '20px',
          border: '1.5px solid var(--border-color)',
          boxShadow: 'var(--shadow-md)',
          display: 'flex',
          flexDirection: 'column',
          gap: '2rem'
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div 
            style={{ 
              width: '56px', 
              height: '56px', 
              borderRadius: '50%', 
              backgroundColor: 'rgba(56, 20, 35, 0.04)', 
              color: 'var(--primary-dark)', 
              display: 'inline-flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              marginBottom: '1rem',
              border: '1.5px solid var(--border-color)'
            }}
          >
            <Shield size={24} />
          </div>
          <h1 style={{ fontSize: '1.8rem', fontFamily: 'var(--font-serif)', color: 'var(--primary-dark)', fontWeight: '800', margin: '0 0 0.35rem 0' }}>
            MILASTY Admin
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0, fontWeight: '600' }}>
            Enter authorized credentials to access dashboard
          </p>
        </div>

        {error && (
          <div style={{ backgroundColor: 'rgba(217, 83, 79, 0.08)', border: '1.5px solid var(--accent-terracotta)', color: 'var(--accent-terracotta)', padding: '0.85rem 1rem', borderRadius: '12px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600' }}>
            <ShieldAlert size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem' }}>
          <div>
            <label style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--primary-dark)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Admin Email
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="email" 
                required 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                style={{ 
                  width: '100%', 
                  height: '50px', 
                  padding: '0 1rem 0 2.75rem', 
                  borderRadius: '12px', 
                  border: '1.5px solid var(--border-color)', 
                  fontSize: '0.9rem',
                  outline: 'none',
                  backgroundColor: '#FCFAF6',
                  color: 'var(--primary-dark)',
                  fontFamily: 'inherit'
                }} 
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--primary-dark)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type={showPassword ? "text" : "password"} 
                required 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                style={{ 
                  width: '100%', 
                  height: '50px', 
                  padding: '0 3rem 0 2.75rem', 
                  borderRadius: '12px', 
                  border: '1.5px solid var(--border-color)', 
                  fontSize: '0.9rem',
                  outline: 'none',
                  backgroundColor: '#FCFAF6',
                  color: 'var(--primary-dark)',
                  fontFamily: 'inherit'
                }} 
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

          <button 
            type="submit" 
            disabled={loading} 
            className="btn-primary" 
            style={{ 
              width: '100%', 
              height: '50px', 
              justifyContent: 'center', 
              padding: '0.85rem', 
              marginTop: '0.75rem',
              backgroundColor: 'var(--primary-dark)',
              color: '#FFFFFF',
              borderRadius: '12px',
              border: 'none',
              fontWeight: '800',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '0.06em'
            }}
          >
            {loading ? <span>Authenticating...</span> : <><span>Login to Dashboard</span><ArrowRight size={16} /></>}
          </button>
        </form>

        <div style={{ padding: '0.85rem', backgroundColor: '#FCFAF6', borderRadius: '10px', border: '1px solid var(--border-color)', textAlign: 'center', fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: '650', lineHeight: '1.4' }}>
          <div style={{ color: 'var(--primary-dark)', fontWeight: '800', marginBottom: '0.2rem' }}>Demo Administration Credentials:</div>
          admin@milasty.com / Admin@123456
        </div>
      </div>
    </div>
  );
}
