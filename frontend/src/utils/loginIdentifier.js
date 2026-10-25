/**
 * Login / password-reset identifier: an email address or an Indian mobile number
 * (10 digits, optionally written with +91 / 91 / 0 and spaces or dashes). Mirrors backend/utils/phone.js.
 *
 * @returns {{ type: 'email'|'phone', value: string } | { error: string }}
 */
export function parseLoginIdentifier(raw) {
  const value = String(raw || '').trim();
  if (!value) return { error: 'Please enter your email address or mobile number.' };

  if (value.includes('@')) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
      ? { type: 'email', value: value.toLowerCase() }
      : { error: 'Please enter a valid email address.' };
  }

  if (/[a-z]/i.test(value)) return { error: 'Please enter a valid email address or 10-digit mobile number.' };
  let digits = value.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  return /^[6-9]\d{9}$/.test(digits)
    ? { type: 'phone', value: digits }
    : { error: 'Please enter a valid 10-digit mobile number.' };
}
