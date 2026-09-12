import React, { useState } from 'react';
import { ShieldAlert, CheckCircle2 } from 'lucide-react';

/**
 * Shared Auth Container Layout for MILASTY Authentication Pages
 */
export function AuthLayout({ badge, title, subtitle, children, trustBadges }) {
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
        padding: '5rem 1.25rem 3.5rem',
        position: 'relative',
        boxSizing: 'border-box',
      }}
    >
      {/* Background Soft Dark Overlay for Maximum Contrast & Readability */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(25, 14, 8, 0.38)',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* Central Premium Card */}
      <div
        className="milasty-auth-card"
        style={{
          position: 'relative',
          zIndex: 2,
          width: '100%',
          maxWidth: '480px',
          backgroundColor: '#FFFDF9',
          borderRadius: '24px',
          border: '1.5px solid rgba(100, 65, 35, 0.16)',
          boxShadow: '0 20px 50px rgba(30, 16, 8, 0.22), 0 4px 12px rgba(0, 0, 0, 0.06)',
          padding: '2.5rem 2.25rem 2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
          boxSizing: 'border-box',
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', borderBottom: '1px solid rgba(100, 65, 35, 0.12)', paddingBottom: '1.35rem' }}>
          {badge && (
            <span
              style={{
                fontSize: '0.68rem',
                fontWeight: '800',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: '#244f21',
                backgroundColor: 'rgba(36, 79, 33, 0.08)',
                padding: '0.35rem 0.85rem',
                borderRadius: '999px',
                border: '1px solid rgba(36, 79, 33, 0.18)',
                display: 'inline-block',
                marginBottom: '0.85rem',
              }}
            >
              {badge}
            </span>
          )}
          {title && (
            <h1
              style={{
                fontSize: '1.9rem',
                fontFamily: 'var(--font-serif)',
                color: '#24130D',
                fontWeight: '800',
                margin: '0 0 0.4rem',
                letterSpacing: '-0.01em',
                lineHeight: '1.25',
              }}
            >
              {title}
            </h1>
          )}
          {subtitle && (
            <p style={{ color: '#5C3D20', fontSize: '0.9rem', margin: 0, fontWeight: '500', lineHeight: '1.5' }}>
              {subtitle}
            </p>
          )}
        </div>

        {/* Dynamic Form Content */}
        {children}

        {/* Security / Value Indicators */}
        {badgesToRender && badgesToRender.length > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1rem',
              paddingTop: '0.85rem',
              borderTop: '1px solid rgba(100, 65, 35, 0.10)',
              flexWrap: 'wrap',
            }}
          >
            {badgesToRender.map((badgeItem, idx) => (
              <span
                key={idx}
                style={{
                  fontSize: '0.72rem',
                  color: '#6B4030',
                  fontWeight: '700',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
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
        backgroundColor: isError ? 'rgba(184, 50, 30, 0.08)' : 'rgba(36, 79, 33, 0.08)',
        border: `1.5px solid ${isError ? 'rgba(184, 50, 30, 0.30)' : 'rgba(36, 79, 33, 0.30)'}`,
        color: isError ? '#8B2020' : '#244f21',
        padding: '0.85rem 1rem',
        borderRadius: '12px',
        fontSize: '0.85rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.6rem',
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
 * Standard Text / Email Input Component with strict padding to avoid icon overlap
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', width: '100%' }}>
      {label && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label
            htmlFor={inputId}
            style={{
              fontSize: '0.74rem',
              fontWeight: '800',
              color: '#4A2C10',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            {label}
          </label>
          {hint && <span style={{ fontSize: '0.74rem', color: '#7A5535', fontWeight: '500' }}>{hint}</span>}
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
              color: isFocused ? '#244f21' : '#7A5535',
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
            height: '50px',
            paddingLeft: Icon ? '2.85rem' : '1rem',
            paddingRight: rightElement ? '3rem' : '1rem',
            borderRadius: '12px',
            border: `1.5px solid ${
              error ? '#B8321E' : isFocused ? '#244f21' : 'rgba(100, 65, 35, 0.25)'
            }`,
            boxShadow: isFocused ? '0 0 0 3px rgba(36, 79, 33, 0.12)' : 'none',
            fontSize: '0.92rem',
            outline: 'none',
            backgroundColor: 'rgba(255, 252, 245, 0.90)',
            color: '#24130D',
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
 * Standard High Contrast Primary Button Component
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
        height: '52px',
        marginTop: '0.35rem',
        backgroundColor: '#244f21',
        color: '#FFFFFF',
        borderRadius: '14px',
        border: 'none',
        fontWeight: '700',
        fontSize: '0.98rem',
        letterSpacing: '0.01em',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled || loading ? 0.75 : 1,
        transition: 'all 0.2s ease',
        fontFamily: 'inherit',
        boxShadow: '0 4px 14px rgba(36, 79, 33, 0.25)',
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
