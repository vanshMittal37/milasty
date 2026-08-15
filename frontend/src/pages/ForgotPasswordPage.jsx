import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, CheckCircle2 } from 'lucide-react';
import api from '../api/axios';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (e) {
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '4rem 0 6rem' }}>
      <div className="container" style={{ maxWidth: '440px' }}>
        <div className="glass-card" style={{ padding: '2.5rem 2rem', backgroundColor: '#FFFFFF' }}>
          <h1 style={{ fontSize: '1.8rem', color: '#4A3525', textAlign: 'center', marginBottom: '0.5rem' }}>Reset Password</h1>
          <p style={{ color: '#6B5B52', fontSize: '0.9rem', textAlign: 'center', marginBottom: '1.75rem' }}>
            Enter your registered email address and we'll send you instructions to reset your password.
          </p>

          {sent ? (
            <div style={{ textAlign: 'center', padding: '1.5rem 0', color: '#274C37' }}>
              <CheckCircle2 size={44} style={{ margin: '0 auto 1rem' }} />
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Instructions Sent!</h3>
              <p style={{ color: '#6B5B52', fontSize: '0.88rem', marginBottom: '1.5rem' }}>Check your email inbox for password recovery steps.</p>
              <Link to="/login" className="btn-primary">Back to Login</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#4A3525', display: 'block', marginBottom: '0.35rem' }}>Registered Email</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} color="#6B5B52" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" style={{ width: '100%', padding: '0.7rem 0.75rem 0.7rem 2.4rem', borderRadius: '8px', border: '1px solid #E2D7C7', fontSize: '0.9rem' }} />
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '0.85rem' }}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
