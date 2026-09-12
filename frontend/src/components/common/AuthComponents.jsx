import React, { useState } from 'react';
import { ShieldAlert, CheckCircle2, Lock, Mail, User, Phone } from 'lucide-react';

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
        stroke="#8A7352"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M22 36C32 32 44 26 56 8"
        stroke="#8A7352"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Shared Auth Container Layout matching reference image:
 * - Warm cream/ivory background card (#FBF9F4)
 * - Corner botanical flourish
 * - Clear pill badge
 * - Large serif title with natural line break support
 * - Clean trust indicators footer
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
          backgroundColor: 'rgba(25, 14, 8, 0.35)',
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
          border: '1px solid rgba(138, 115, 82, 0.22)',
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

        {/* Header Header Header */}
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 2 }}>
          {badge && (
            <span
              style={{
                fontSize: '0.66rem',
                fontWeight: '800',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: '#244F21',
                backgroundColor: '#EAEFE6',
                padding: '0.3rem 0.85rem',
                borderRadius: '999px',
                border: '1px solid rgba(36, 79, 33, 0.18)',
                display: 'inline-block',
                marginBottom: '0.85rem',
              }}
            >
              {badge}
            </span>
          )}

          {/* Large Editorial Serif Title */}
          <h1
            style={{
              fontSize: '2.2rem',
              fontFamily: 'var(--font-serif)',
              color: '#26150F',
              fontWeight: '800',
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
                color: '#5C3D20',
                fontSize: '0.88rem',
                margin: 0,
                fontWeight: '500',
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
              borderTop: '1px solid rgba(138, 115, 82, 0.15)',
              flexWrap: 'wrap',
            }}
          >
            {badgesToRender.map((badgeItem, idx) => (
              <span
                key={idx}
                style={{
                  fontSize: '0.7rem',
                  color: '#6B4A2F',
                  fontWeight: '700',
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
        backgroundColor: isError ? '#FDF2F0' : '#EFEFEE',
        border: `1.5px solid ${isError ? '#E8B4AC' : '#244F21'}`,
        color: isError ? '#9C2A1B' : '#244F21',
        padding: '0.8rem 0.95rem',
        borderRadius: '12px',
        fontSize: '0.84rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.55rem',
        fontWeight: '600',
        lineHeight: '1.4',
      }}
    >
      {isError ? <ShieldAlert size={18} style={{ flexShrink: 0 }} /> : <CheckCircle2 size={18} style={{ flexShrink: 0 }} />}
      <span>{message}</span>
    </div>
  );
}

/**
 * Input Component strictly matching reference image:
 * - Off-white/cream input background (#F7F4EE)
 * - Warm border (#E0D6C6)
 * - Clear UPPERCASE label in dark brown (#4A2C10)
 * - Dark readable placeholder (#8A7352)
 * - Dark readable typed text (#26150F)
 * - No icon/text overlap
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
              fontSize: '0.72rem',
              fontWeight: '800',
              color: '#3D2413',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            {label}
          </label>
          {hint && <span style={{ fontSize: '0.72rem', color: '#7A5535', fontWeight: '600' }}>{hint}</span>}
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
              color: isFocused ? '#244F21' : '#6B4A2F',
              transition: 'color 0.2s',
              zIndex: 2,
            }}
          >
            <Icon size={18} />
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
          style={{
            width: '100%',
            height: '48px',
            paddingLeft: Icon ? '2.75rem' : '1rem',
            paddingRight: rightElement ? '3rem' : '1rem',
            borderRadius: '12px',
            border: `1.5px solid ${
              error ? '#B8321E' : isFocused ? '#244F21' : '#E2D7C7'
            }`,
            boxShadow: isFocused ? '0 0 0 3px rgba(36, 79, 33, 0.12)' : 'none',
            fontSize: '0.9rem',
            outline: 'none',
            backgroundColor: '#F5F1E8',
            color: '#26150F',
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
 * Deep MILASTY Green Primary Button Component with WHITE High-Contrast Text
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
        backgroundColor: '#244F21',
        color: '#FFFFFF',
        borderRadius: '12px',
        border: 'none',
        fontWeight: '700',
        fontSize: '0.96rem',
        letterSpacing: '0.01em',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled || loading ? 0.78 : 1,
        transition: 'all 0.2s ease',
        fontFamily: 'inherit',
        boxShadow: '0 4px 12px rgba(36, 79, 33, 0.22)',
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
          <span style={{ color: '#FFFFFF', fontWeight: '700' }}>{loadingText}</span>
        </div>
      ) : (
        <>
          <span style={{ color: '#FFFFFF', fontWeight: '700' }}>{children}</span>
          {Icon && <Icon size={18} color="#FFFFFF" style={{ strokeWidth: 2.5 }} />}
        </>
      )}
    </button>
  );
}
