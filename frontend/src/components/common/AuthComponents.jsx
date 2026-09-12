import React, { useState } from 'react';
import { ShieldAlert, CheckCircle2 } from 'lucide-react';

/**
 * Botanical Leaf Illustration Motif for top right corner of Auth Cards
 */
function LeafMotif() {
  return (
    <svg
      width="64"
      height="64"
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        position: 'absolute',
        top: '12px',
        right: '12px',
        opacity: 0.45,
        pointerEvents: 'none',
      }}
    >
      <path
        d="M56 8C40 8 26 20 22 36C20 28 14 18 4 14C12 28 20 38 28 42C26 48 24 54 22 60C28 52 36 44 44 40C52 38 60 24 56 8Z"
        stroke="#705438"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M22 36C32 32 44 26 56 8"
        stroke="#705438"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Shared Auth Container Layout matching reference image with ultra-high contrast dark espresso colors
 */
export function AuthLayout({ badge, titleLine1, titleLine2, title, subtitle, children, trustBadges }) {
  const defaultBadges = [
    { icon: '🔒', text: 'SSL Secured' },
    { icon: '🌿', text: '100% Natural' },
    { icon: '🚚', text: 'Pan-India Delivery' },
  ];
  const badgesToRender = trustBadges || defaultBadges;

  return (
    <div
      className="milasty-auth-page"
      style={{
        minHeight: '100vh',
        backgroundImage: 'url(/images/register_login_background_image.jpeg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 1rem 3rem',
        position: 'relative',
        boxSizing: 'border-box',
      }}
    >
      {/* Background Soft Dark Overlay for background contrast */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(25, 14, 8, 0.40)',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* Central Card */}
      <div
        className="milasty-auth-card"
        style={{
          position: 'relative',
          zIndex: 2,
          width: '100%',
          maxWidth: '460px',
          backgroundColor: '#FBF9F4',
          borderRadius: '26px',
          border: '1.5px solid #E2D7C7',
          boxShadow: '0 20px 48px rgba(35, 20, 10, 0.22), 0 4px 14px rgba(0,0,0,0.05)',
          padding: '2.5rem 2.25rem 2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
          boxSizing: 'border-box',
          overflow: 'hidden',
        }}
      >
        {/* Leaf Motif */}
        <LeafMotif />

        {/* Header Section */}
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 2 }}>
          {badge && (
            <span
              style={{
                fontSize: '0.68rem',
                fontWeight: '800',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: '#1C4019',
                backgroundColor: '#E2EBE0',
                padding: '0.35rem 0.9rem',
                borderRadius: '999px',
                border: '1.5px solid #B5C9B3',
                display: 'inline-block',
                marginBottom: '0.85rem',
              }}
            >
              {badge}
            </span>
          )}

          {/* Large Editorial Title - Deep Espresso Brown */}
          <h1
            style={{
              fontSize: '2.2rem',
              fontFamily: 'var(--font-serif)',
              color: '#1F100A',
              fontWeight: '900',
              margin: '0 0 0.45rem',
              letterSpacing: '-0.01em',
              lineHeight: '1.15',
            }}
          >
            {titleLine1 && titleLine2 ? (
              <>
                {titleLine1}
                <br />
                {titleLine2}
              </>
            ) : (
              title
            )}
          </h1>

          {subtitle && (
            <p
              style={{
                color: '#4A2F17',
                fontSize: '0.88rem',
                margin: 0,
                fontWeight: '600',
                lineHeight: '1.45',
                padding: '0 0.5rem',
              }}
            >
              {subtitle}
            </p>
          )}
        </div>

        {/* Dynamic Form Content */}
        {children}

        {/* Security / Trust Badges */}
        {badgesToRender && badgesToRender.length > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.85rem',
              paddingTop: '0.85rem',
              marginTop: '0.25rem',
              borderTop: '1.5px solid #E5DBCB',
              flexWrap: 'wrap',
            }}
          >
            {badgesToRender.map((badgeItem, idx) => (
              <span
                key={idx}
                style={{
                  fontSize: '0.72rem',
                  color: '#4A2F17',
                  fontWeight: '800',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  whiteSpace: 'nowrap',
                }}
              >
                <span>{badgeItem.icon}</span>
                <span>{badgeItem.text}</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Standard Alert Box for Errors
 */
export function AuthAlert({ message, type = 'error' }) {
  if (!message) return null;
  const isError = type === 'error';
  return (
    <div
      role="alert"
      style={{
        backgroundColor: isError ? '#FDF2F0' : '#EAEFE6',
        border: `1.5px solid ${isError ? '#D9534F' : '#1C4019'}`,
        color: isError ? '#801B18' : '#1C4019',
        padding: '0.8rem 0.95rem',
        borderRadius: '12px',
        fontSize: '0.85rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.55rem',
        fontWeight: '700',
        lineHeight: '1.4',
      }}
    >
      {isError ? <ShieldAlert size={18} style={{ flexShrink: 0 }} /> : <CheckCircle2 size={18} style={{ flexShrink: 0 }} />}
      <span>{message}</span>
    </div>
  );
}

/**
 * Input Component with High Contrast Labels, Dark Placeholders (#5C4329) & Dark Input Text (#1F100A)
 */
export function AuthInput({
  label,
  type = 'text',
  icon: Icon,
  rightElement,
  value,
  onChange,
  placeholder,
  required = false,
  error,
  autoComplete,
  id,
  hint,
  disabled = false,
  ...props
}) {
  const [isFocused, setIsFocused] = useState(false);
  const inputId = id || (label ? label.toLowerCase().replace(/[^a-z0-9]/g, '-') : undefined);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', width: '100%' }}>
      {label && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label
            htmlFor={inputId}
            style={{
              fontSize: '0.74rem',
              fontWeight: '900',
              color: '#2E180C',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            {label}
          </label>
          {hint && <span style={{ fontSize: '0.74rem', color: '#5C4329', fontWeight: '700' }}>{hint}</span>}
        </div>
      )}

      <div style={{ position: 'relative', width: '100%' }}>
        {Icon && (
          <div
            style={{
              position: 'absolute',
              left: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isFocused ? '#1C4019' : '#4A2F17',
              transition: 'color 0.2s',
              zIndex: 2,
            }}
          >
            <Icon size={18} style={{ strokeWidth: 2.2 }} />
          </div>
        )}
        <input
          id={inputId}
          type={type}
          required={required}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="milasty-auth-input"
          style={{
            width: '100%',
            height: '48px',
            paddingLeft: Icon ? '2.75rem' : '1rem',
            paddingRight: rightElement ? '3rem' : '1rem',
            borderRadius: '12px',
            border: `1.5px solid ${
              error ? '#B8321E' : isFocused ? '#1C4019' : '#D8CCB8'
            }`,
            boxShadow: isFocused ? '0 0 0 3px rgba(28, 64, 25, 0.15)' : 'none',
            fontSize: '0.92rem',
            fontWeight: '600',
            outline: 'none',
            backgroundColor: '#F3EDE2',
            color: '#1F100A',
            transition: 'all 0.2s ease',
            fontFamily: 'inherit',
            boxSizing: 'border-box',
          }}
          {...props}
        />
        {rightElement && (
          <div
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2,
            }}
          >
            {rightElement}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Deep MILASTY Green Primary Button Component with PURE WHITE Bold Text
 */
export function AuthButton({
  children,
  loading = false,
  loadingText = 'Please wait...',
  icon: Icon,
  disabled = false,
  type = 'submit',
  onClick,
  style = {},
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      style={{
        width: '100%',
        height: '50px',
        marginTop: '0.2rem',
        backgroundColor: '#1C4019',
        color: '#FFFFFF',
        borderRadius: '12px',
        border: 'none',
        fontWeight: '800',
        fontSize: '0.98rem',
        letterSpacing: '0.01em',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled || loading ? 0.78 : 1,
        transition: 'all 0.2s ease',
        fontFamily: 'inherit',
        boxShadow: '0 4px 14px rgba(28, 64, 25, 0.28)',
        boxSizing: 'border-box',
        ...style,
      }}
    >
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div
            style={{
              width: '18px',
              height: '18px',
              border: '2.5px solid rgba(255, 255, 255, 0.3)',
              borderTopColor: '#FFFFFF',
              borderRadius: '50%',
              animation: 'authSpinner 0.8s linear infinite',
            }}
          />
          <span style={{ color: '#FFFFFF', fontWeight: '800' }}>{loadingText}</span>
        </div>
      ) : (
        <>
          <span style={{ color: '#FFFFFF', fontWeight: '800' }}>{children}</span>
          {Icon && <Icon size={18} color="#FFFFFF" style={{ strokeWidth: 2.8 }} />}
        </>
      )}
    </button>
  );
}
