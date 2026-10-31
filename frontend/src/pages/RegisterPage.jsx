import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { User, Mail, Lock, Phone, ArrowRight, Eye, EyeOff, CheckCircle2, MessageSquare, RefreshCw, Edit2, ShieldCheck } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { AuthLayout, AuthInput, AuthButton, AuthAlert } from '../components/common/AuthComponents';

export default function RegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { register } = useAuth();
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // OTP flow states
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [error, setError] = useState('');
  const [remainingAttempts, setRemainingAttempts] = useState(null);

  // Countdown timer for resend
  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  // Password requirements checklist
  const requirements = [
    { label: 'At least 8 characters', pass: password.length >= 8 },
    { label: 'One uppercase letter (A-Z)', pass: /[A-Z]/.test(password) },
    { label: 'One lowercase letter (a-z)', pass: /[a-z]/.test(password) },
    { label: 'One number (0-9)', pass: /\d/.test(password) },
  ];

  const validateInputs = () => {
    if (!name.trim()) {
      setError('Please enter your full name.');
      return false;
    }
    if (!email.trim()) {
      setError('Please enter a valid email address.');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.toLowerCase().trim())) {
      setError('Please enter a valid email address.');
      return false;
    }
    const phoneDigits = phone.replace(/[\s\-()]/g, '').replace(/^(\+?91|0)(?=\d{10}$)/, '');
    if (!/^[6-9]\d{9}$/.test(phoneDigits)) {
      setError('Please enter a valid 10-digit Indian mobile number.');
      return false;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return false;
    }
    return true;
  };

  // Step 1: Request WhatsApp OTP
  const handleRequestOtp = async (e) => {
    if (e) e.preventDefault();
    if (!validateInputs()) return;

    setError('');
    setSendingOtp(true);

    try {
      const res = await api.post('/auth/signup/send-otp', {
        name: name.trim(),
        email: email.trim(),
        password,
        phone: phone.trim(),
      });

      setOtpSent(true);
      setCooldown(res.data?.resendCooldown || 60);
      setRemainingAttempts(null);
      toast.success('Verification code sent to your WhatsApp number!');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to send WhatsApp verification code. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setSendingOtp(false);
    }
  };

  // Step 2: Verify OTP & Complete Registration
  const handleVerifyAndRegister = async (e) => {
    if (e) e.preventDefault();
    if (!validateInputs()) return;

    const cleanOtp = otp.trim();
    if (!cleanOtp || !/^\d{6}$/.test(cleanOtp)) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const user = await register(name.trim(), email.trim(), password, phone.trim(), cleanOtp);
      toast.success('Account created successfully! Welcome to MILASTY.');
      const returnTarget = location.state?.from || (user?.role === 'admin' ? '/admin/dashboard' : '/account');
      navigate(returnTarget, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || 'Error creating account. Please check the OTP and try again.';
      setError(msg);
      toast.error(msg);
      if (err.response?.data?.remainingAttempts !== undefined) {
        setRemainingAttempts(err.response.data.remainingAttempts);
      }
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
      <form onSubmit={otpSent ? handleVerifyAndRegister : handleRequestOtp} style={{ display: 'flex', flexDirection: 'column', gap: '1.05rem' }}>
        {/* Full Name */}
        <AuthInput
          label="FULL NAME *"
          type="text"
          icon={User}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (error) setError('');
          }}
          placeholder="Enter your full name"
          required
          disabled={otpSent}
          autoComplete="name"
          id="register-name"
        />

        {/* Email Address */}
        <AuthInput
          label="EMAIL ADDRESS *"
          type="email"
          icon={Mail}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) setError('');
          }}
          placeholder="Enter your email address"
          required
          disabled={otpSent}
          autoComplete="email"
          id="register-email"
        />

        {/* Mobile Number */}
        <AuthInput
          label="MOBILE NUMBER *"
          type="tel"
          icon={Phone}
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value);
            if (error) setError('');
          }}
          placeholder="98765 43210"
          required
          disabled={otpSent}
          inputMode="numeric"
          autoComplete="tel"
          id="register-phone"
        />

        {/* Password (Only editable before OTP verification step) */}
        {!otpSent && (
          <div>
            <AuthInput
              label="PASSWORD *"
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

            {/* Password Requirements Checklist Box */}
            <div
              style={{
                marginTop: '0.6rem',
                padding: '0.65rem 0.85rem',
                backgroundColor: '#F3EDE2',
                borderRadius: '12px',
                border: '1.5px solid #D8CCB8',
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
                    fontSize: '0.76rem',
                    color: req.pass ? '#1F5A28' : '#5A4438',
                    fontWeight: '700',
                  }}
                >
                  <div
                    style={{
                      width: '15px',
                      height: '15px',
                      borderRadius: '50%',
                      backgroundColor: req.pass ? '#1F5A28' : '#C8BBA7',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <CheckCircle2 size={11} color={req.pass ? '#FFFFFF' : '#5A4438'} />
                  </div>
                  <span>{req.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: OTP Verification Card */}
        {otpSent && (
          <div
            style={{
              padding: '1rem',
              backgroundColor: '#F7F3EB',
              borderRadius: '14px',
              border: '1.5px solid #1F5A28',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: '#CDE5CB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#1F5A28',
                  }}
                >
                  <MessageSquare size={16} />
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#2B1710' }}>
                    WhatsApp Verification Code
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#5A4438' }}>
                    Sent to +91 {phone.trim()}
                  </div>
                </div>
              </div>

              {/* Edit Details Button */}
              <button
                type="button"
                onClick={() => {
                  setOtpSent(false);
                  setOtp('');
                  setError('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#1F5A28',
                  fontSize: '0.78rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  padding: '4px',
                }}
              >
                <Edit2 size={13} />
                <span>Edit</span>
              </button>
            </div>

            {/* 6-Digit OTP Input */}
            <AuthInput
              label="ENTER 6-DIGIT CODE *"
              type="text"
              icon={ShieldCheck}
              value={otp}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                setOtp(val);
                if (error) setError('');
              }}
              placeholder="000000"
              required
              autoFocus
              inputMode="numeric"
              maxLength={6}
              id="register-otp"
            />

            {/* Resend OTP Bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem' }}>
              <span style={{ color: '#5A4438' }}>Didn't receive the code?</span>
              <button
                type="button"
                onClick={handleRequestOtp}
                disabled={cooldown > 0 || sendingOtp}
                style={{
                  background: 'none',
                  border: 'none',
                  color: cooldown > 0 ? '#8C7A6F' : '#1F5A28',
                  fontWeight: '800',
                  cursor: cooldown > 0 ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                }}
              >
                <RefreshCw size={13} style={{ animation: sendingOtp ? 'authSpinner 0.8s linear infinite' : 'none' }} />
                <span>{cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend WhatsApp OTP'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Submit Action Button */}
        {!otpSent ? (
          <AuthButton loading={sendingOtp} loadingText="Sending WhatsApp Code..." icon={ArrowRight}>
            Get WhatsApp Verification Code
          </AuthButton>
        ) : (
          <AuthButton loading={loading} loadingText="Verifying & Creating Account..." icon={CheckCircle2}>
            Verify OTP & Create Account
          </AuthButton>
        )}
      </form>

      {/* Switch to Login */}
      <div style={{ textAlign: 'center', fontSize: '0.9rem', color: '#4A3525', fontWeight: '600', paddingTop: '0.2rem' }}>
        Already have an account?{' '}
        <Link to="/login" state={{ from: location.state?.from }} style={{ color: '#1F5A28', fontWeight: '800', textDecoration: 'none' }}>
          Login here
        </Link>
      </div>
    </AuthLayout>
  );
}
