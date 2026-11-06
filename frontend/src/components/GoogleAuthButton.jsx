import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

// Google Official G Logo SVG (Clean Vector)
export function GoogleGIcon({ size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', flexShrink: 0 }}
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        fill="#EA4335"
      />
    </svg>
  );
}

/**
 * Premium Google Sign-In & Sign-Up Button
 * Supported on both desktop and mobile.
 */
export default function GoogleAuthButton({
  text = 'Continue with Google',
  onSuccessRedirect = null,
  onSuccess = null,
  disabled = false,
  className = '',
}) {
  const { loginWithGoogle } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);
  const hiddenBtnRef = useRef(null);

  const clientId =
    import.meta.env.VITE_GOOGLE_CLIENT_ID ||
    '1084278457245-placeholder.apps.googleusercontent.com';

  const returnTarget =
    onSuccessRedirect ||
    location.state?.from ||
    '/account';

  // Load Google Identity Services Script
  useEffect(() => {
    let script = document.getElementById('google-gsi-script');
    if (!script) {
      script = document.createElement('script');
      script.id = 'google-gsi-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }

    const initGoogle = () => {
      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: handleGoogleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
          });

          // Render hidden native Google button for seamless popup trigger
          if (hiddenBtnRef.current) {
            window.google.accounts.id.renderButton(hiddenBtnRef.current, {
              type: 'standard',
              theme: 'outline',
              size: 'large',
              text: 'continue_with',
            });
          }

          setGoogleReady(true);
        } catch (err) {
          console.warn('[GOOGLE AUTH] Failed to initialize Google ID client:', err);
        }
      }
    };

    if (window.google?.accounts?.id) {
      initGoogle();
    } else {
      script.addEventListener('load', initGoogle);
      const timer = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(timer);
          initGoogle();
        }
      }, 300);
      return () => {
        clearInterval(timer);
        script.removeEventListener('load', initGoogle);
      };
    }
  }, [clientId]);

  const handleGoogleCredentialResponse = async (response) => {
    if (!response || !response.credential) {
      toast.error('Google sign-in was cancelled or returned no credentials.');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const user = await loginWithGoogle(response.credential);
      toast.success(
        user?.isNewUser
          ? `Welcome to MILASTY, ${user.name || 'Friend'}! 🌿`
          : `Welcome back, ${user.name || 'Customer'}! 💛`
      );
      if (typeof onSuccess === 'function') {
        onSuccess(user);
      } else {
        navigate(returnTarget, { replace: true });
      }
    } catch (err) {
      console.error('[GOOGLE AUTH ERROR]', err);
      const msg =
        err.response?.data?.message ||
        'Could not complete Google authentication. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleButtonClick = () => {
    if (disabled || loading) return;

    if (!window.google?.accounts?.id) {
      toast.error('Google services are still loading. Please try again in a moment.');
      return;
    }

    setLoading(true);

    try {
      // First try triggering native hidden button click (handles mobile popups reliably)
      if (hiddenBtnRef.current) {
        const nativeBtn = hiddenBtnRef.current.querySelector('div[role="button"]') || hiddenBtnRef.current.querySelector('button');
        if (nativeBtn) {
          nativeBtn.click();
          setTimeout(() => setLoading(false), 2000);
          return;
        }
      }

      // Fallback: prompt Google One Tap / Account Chooser
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          console.log('[GOOGLE PROMPT]', notification.getNotDisplayedReason?.() || 'dismissed');
          setLoading(false);
        }
      });
    } catch (err) {
      console.error('[GOOGLE PROMPT ERROR]', err);
      setLoading(false);
      toast.error('Unable to open Google sign-in window. Please check your browser popup settings.');
    }
  };

  return (
    <div style={{ width: '100%' }} className={className}>
      {/* Hidden container for Google's native button */}
      <div
        ref={hiddenBtnRef}
        style={{
          position: 'absolute',
          opacity: 0,
          pointerEvents: 'none',
          height: 0,
          width: 0,
          overflow: 'hidden',
        }}
        aria-hidden="true"
      />

      {/* Styled Premium Custom Button */}
      <button
        type="button"
        onClick={handleButtonClick}
        disabled={disabled || loading}
        style={{
          width: '100%',
          height: '48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.75rem',
          backgroundColor: '#FFFFFF',
          color: '#2B2B2B',
          border: '1.5px solid #E5D5C5',
          borderRadius: '12px',
          fontSize: '0.92rem',
          fontWeight: '700',
          fontFamily: 'var(--font-sans, system-ui, sans-serif)',
          cursor: disabled || loading ? 'not-allowed' : 'pointer',
          boxShadow: '0 2px 8px rgba(70, 40, 20, 0.05)',
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          outline: 'none',
          position: 'relative',
          padding: '0 1.25rem',
          userSelect: 'none',
          opacity: disabled ? 0.6 : 1,
        }}
        onMouseOver={(e) => {
          if (!disabled && !loading) {
            e.currentTarget.style.backgroundColor = '#FCF9F6';
            e.currentTarget.style.borderColor = '#C4A482';
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(70, 40, 20, 0.10)';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = '#FFFFFF';
          e.currentTarget.style.borderColor = '#E5D5C5';
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(70, 40, 20, 0.05)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        <GoogleGIcon size={20} />
        <span>{loading ? 'Connecting with Google...' : text}</span>
      </button>
    </div>
  );
}

/**
 * Visual Divider Component: "OR CONTINUE WITH EMAIL / PHONE"
 */
export function AuthDivider({ text = 'OR CONTINUE WITH EMAIL / PHONE' }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        margin: '1.25rem 0',
        width: '100%',
      }}
    >
      <div
        style={{
          flexGrow: 1,
          height: '1px',
          backgroundColor: '#E5D5C5',
          opacity: 0.8,
        }}
      />
      <span
        style={{
          padding: '0 0.85rem',
          fontSize: '0.68rem',
          fontWeight: '800',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: '#8A7363',
          fontFamily: 'var(--font-sans, system-ui, sans-serif)',
        }}
      >
        {text}
      </span>
      <div
        style={{
          flexGrow: 1,
          height: '1px',
          backgroundColor: '#E5D5C5',
          opacity: 0.8,
        }}
      />
    </div>
  );
}
