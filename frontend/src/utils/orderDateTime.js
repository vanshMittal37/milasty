/**
 * MILASTY Order Date & Time Helpers
 * Standardized date, time, and estimated delivery calculations across customer and admin views.
 * Uses 'Asia/Kolkata' timezone / Indian locale formatting conventions.
 */

const TIMEZONE = 'Asia/Kolkata';

/** Format as "15 Oct 2026, 11:46 AM" */
export function formatDateTime(val) {
  if (!val) return '—';
  const d = new Date(val);
  if (isNaN(d.getTime())) return '—';
  try {
    return d.toLocaleString('en-IN', {
      timeZone: TIMEZONE,
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return d.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  }
}

/** Format as "15 Oct 2026" */
export function formatDateOnly(val) {
  if (!val) return '—';
  const d = new Date(val);
  if (isNaN(d.getTime())) return '—';
  try {
    return d.toLocaleDateString('en-IN', {
      timeZone: TIMEZONE,
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }
}

/** Format as "11:46 AM" */
export function formatTimeOnly(val) {
  if (!val) return '—';
  const d = new Date(val);
  if (isNaN(d.getTime())) return '—';
  try {
    return d.toLocaleTimeString('en-IN', {
      timeZone: TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return d.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  }
}

/**
 * Calculates estimated delivery date (9 days from order placement date)
 * Returns formatted string like "Sat, 24 Oct 2026"
 */
export function calculateEstimatedDeliveryDate(placementDate, days = 9) {
  if (!placementDate) return '—';
  const d = new Date(placementDate);
  if (isNaN(d.getTime())) return '—';
  const deliveryMs = d.getTime() + days * 24 * 60 * 60 * 1000;
  const deliveryDate = new Date(deliveryMs);
  try {
    return deliveryDate.toLocaleDateString('en-IN', {
      timeZone: TIMEZONE,
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return deliveryDate.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }
}

/** Format currency with rupee symbol */
export function formatInr(val) {
  const num = Number(val || 0);
  return `₹${num.toLocaleString('en-IN', {
    minimumFractionDigits: num % 1 !== 0 ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
}

/** Format seconds to "1h 24m 10s" */
export function formatElapsed(seconds) {
  const n = Number(seconds || 0);
  const h = Math.floor(n / 3600);
  const m = Math.floor((n % 3600) / 60);
  const sec = n % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m ${String(sec).padStart(2, '0')}s`;
  if (m > 0) return `${m}m ${String(sec).padStart(2, '0')}s`;
  return `${sec}s`;
}
