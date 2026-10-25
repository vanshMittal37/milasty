/**
 * Indian mobile numbers are stored in mixed formats ("9876543210", "+919876543210", "09876543210").
 * Everything that compares phone numbers goes through this so the same person always matches.
 *
 * @returns {string|null} the 10-digit mobile number, or null if it isn't a valid Indian mobile
 */
export function normalizeIndianMobile(raw) {
  let digits = String(raw || '').replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  return /^[6-9]\d{9}$/.test(digits) ? digits : null;
}

export const isEmailAddress = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
