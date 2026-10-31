import crypto from 'crypto';
import { supabase } from '../config/supabase.js';
import { normalizeIndianMobile } from '../utils/phone.js';
import { enqueueNotification } from './notificationQueue.js';

// In-memory storage fallback for OTPs (when DB table whatsapp_otps has not been created yet)
const inMemoryOtps = new Map();

// Rate limiting trackers: phone -> { count, windowStart }, ip -> { count, windowStart }
const rateLimitByPhone = new Map();
const rateLimitByIp = new Map();

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS_PER_PHONE = 5;
const MAX_REQUESTS_PER_IP = 15;
const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds
const MAX_ATTEMPTS = 3;

let dbTableAvailable = null;

async function checkOtpTableAvailability() {
  if (dbTableAvailable !== null) return dbTableAvailable;
  try {
    const { error } = await supabase.from('whatsapp_otps').select('id').limit(1);
    if (error && (error.code === '42P01' || error.message?.includes('does not exist') || error.message?.includes('schema cache'))) {
      dbTableAvailable = false;
      console.log('[OTP SERVICE] DB table whatsapp_otps not found. Using in-memory OTP engine.');
    } else {
      dbTableAvailable = true;
      console.log('[OTP SERVICE] Connected to Supabase whatsapp_otps table.');
    }
  } catch (e) {
    dbTableAvailable = false;
  }
  return dbTableAvailable;
}

/**
 * Check and record rate limit for an identifier (phone or IP).
 */
function checkRateLimit(trackerMap, key, maxRequests) {
  if (!key) return true;
  const now = Date.now();
  const entry = trackerMap.get(key);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    trackerMap.set(key, { count: 1, windowStart: now });
    return true;
  }

  if (entry.count >= maxRequests) {
    return false;
  }

  entry.count += 1;
  return true;
}

/**
 * Cryptographic hash helper for OTPs.
 */
function hashOtp(otp) {
  return crypto.createHash('sha256').update(String(otp).trim()).digest('hex');
}

/**
 * Generates and delivers a cryptographically secure 6-digit WhatsApp OTP.
 *
 * @param {object} params
 * @param {string} params.phone - Recipient mobile number
 * @param {'signup' | 'forgot_password'} params.purpose - Purpose of the OTP
 * @param {string} [params.ip] - Client IP for rate limiting
 * @returns {Promise<{ success: boolean, message: string, resendCooldown?: number, error?: string }>}
 */
export async function generateAndSendWhatsAppOtp({ phone: rawPhone, purpose, ip = null }) {
  const phone = normalizeIndianMobile(rawPhone);
  if (!phone) {
    return { success: false, error: 'Please enter a valid 10-digit Indian mobile number.' };
  }

  if (!['signup', 'forgot_password'].includes(purpose)) {
    return { success: false, error: 'Invalid OTP purpose specified.' };
  }

  // 1. IP & Phone Rate Limiting
  if (ip && !checkRateLimit(rateLimitByIp, ip, MAX_REQUESTS_PER_IP)) {
    return {
      success: false,
      error: 'Too many requests from this connection. Please wait 15 minutes before trying again.',
    };
  }

  if (!checkRateLimit(rateLimitByPhone, `${purpose}:${phone}`, MAX_REQUESTS_PER_PHONE)) {
    return {
      success: false,
      error: 'Too many OTP requests for this mobile number. Please wait 15 minutes before trying again.',
    };
  }

  const hasDb = await checkOtpTableAvailability();
  const now = new Date();
  const nowMs = now.getTime();

  // 2. Resend Cooldown Check (60 seconds)
  if (hasDb) {
    try {
      const { data: latest } = await supabase
        .from('whatsapp_otps')
        .select('resend_after, created_at')
        .eq('phone', phone)
        .eq('purpose', purpose)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latest?.resend_after) {
        const resendAfterMs = new Date(latest.resend_after).getTime();
        if (nowMs < resendAfterMs) {
          const waitSec = Math.ceil((resendAfterMs - nowMs) / 1000);
          return {
            success: false,
            error: `Please wait ${waitSec} second${waitSec > 1 ? 's' : ''} before requesting another OTP.`,
            resendCooldown: waitSec,
          };
        }
      }
    } catch (e) {}
  } else {
    const memKey = `${purpose}:${phone}`;
    const latestMem = inMemoryOtps.get(memKey);
    if (latestMem && nowMs < latestMem.resendAfterMs) {
      const waitSec = Math.ceil((latestMem.resendAfterMs - nowMs) / 1000);
      return {
        success: false,
        error: `Please wait ${waitSec} second${waitSec > 1 ? 's' : ''} before requesting another OTP.`,
        resendCooldown: waitSec,
      };
    }
  }

  // 3. Generate Cryptographically Secure 6-digit OTP
  const rawOtp = crypto.randomInt(100000, 999999).toString();
  const hashedOtp = hashOtp(rawOtp);
  const expiresAt = new Date(nowMs + OTP_EXPIRY_MS);
  const resendAfter = new Date(nowMs + RESEND_COOLDOWN_MS);

  // 4. Save to Database or In-Memory Store
  if (hasDb) {
    try {
      await supabase.from('whatsapp_otps').insert([{
        phone,
        purpose,
        otp_hash: hashedOtp,
        attempts: 0,
        max_attempts: MAX_ATTEMPTS,
        expires_at: expiresAt.toISOString(),
        resend_after: resendAfter.toISOString(),
      }]);
    } catch (dbErr) {
      console.warn('[OTP SERVICE] DB insert failed, falling back to memory:', dbErr.message);
      inMemoryOtps.set(`${purpose}:${phone}`, {
        phone,
        purpose,
        otpHash: hashedOtp,
        attempts: 0,
        maxAttempts: MAX_ATTEMPTS,
        expiresAtMs: expiresAt.getTime(),
        resendAfterMs: resendAfter.getTime(),
        verifiedAt: null,
      });
    }
  } else {
    inMemoryOtps.set(`${purpose}:${phone}`, {
      phone,
      purpose,
      otpHash: hashedOtp,
      attempts: 0,
      maxAttempts: MAX_ATTEMPTS,
      expiresAtMs: expiresAt.getTime(),
      resendAfterMs: resendAfter.getTime(),
      verifiedAt: null,
    });
  }

  // 5. Build and Send WhatsApp OTP Message
  let messageText = '';
  if (purpose === 'signup') {
    messageText = [
      '*MILASTY*',
      '',
      `Your account verification code is: *${rawOtp}*`,
      '',
      'Valid for 10 minutes. For your security, do not share this code with anyone.',
      '',
      'Thank you for joining MILASTY!',
    ].join('\n');
  } else {
    messageText = [
      '*MILASTY*',
      '',
      `Your password reset code is: *${rawOtp}*`,
      '',
      'Valid for 10 minutes. If you did not request this, please ignore this message.',
      '',
      '© MILASTY All rights reserved.',
    ].join('\n');
  }

  // Unique idempotency key prevents any duplicate message send
  const idempotencyKey = `otp:${purpose}:${phone}:${Date.now()}`;

  await enqueueNotification({
    recipientPhone: phone,
    eventType: `${purpose}_otp`,
    referenceId: phone,
    idempotencyKey,
    messageBody: messageText,
    allowSmsFallback: true,
  });

  console.log(`[OTP SERVICE] 📲 WhatsApp OTP generated and queued for ${phone} (${purpose})`);

  return {
    success: true,
    message: 'Verification code sent to your WhatsApp number.',
    resendCooldown: 60,
  };
}

/**
 * Verifies a submitted OTP against the stored cryptographic hash.
 *
 * @param {object} params
 * @param {string} params.phone - Recipient mobile number
 * @param {'signup' | 'forgot_password'} params.purpose - Purpose of the OTP
 * @param {string} params.otp - The 6-digit OTP code entered by customer
 * @returns {Promise<{ success: boolean, message?: string, error?: string, remainingAttempts?: number }>}
 */
export async function verifyWhatsAppOtp({ phone: rawPhone, purpose, otp }) {
  const phone = normalizeIndianMobile(rawPhone);
  if (!phone) {
    return { success: false, error: 'Please enter a valid 10-digit Indian mobile number.' };
  }

  const cleanOtp = String(otp || '').trim();
  if (!cleanOtp || !/^\d{6}$/.test(cleanOtp)) {
    return { success: false, error: 'Please enter a valid 6-digit OTP code.' };
  }

  const hasDb = await checkOtpTableAvailability();
  const now = new Date();
  const nowMs = now.getTime();
  const submittedHash = hashOtp(cleanOtp);

  if (hasDb) {
    try {
      // Find the most recent unverified OTP for this phone + purpose
      const { data: record, error } = await supabase
        .from('whatsapp_otps')
        .select('*')
        .eq('phone', phone)
        .eq('purpose', purpose)
        .is('verified_at', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !record) {
        return { success: false, error: 'No active OTP request found. Please request a new code.' };
      }

      // Check Expiry
      if (nowMs > new Date(record.expires_at).getTime()) {
        return { success: false, error: 'This verification code has expired. Please request a new one.' };
      }

      // Check Attempt Limit
      if (record.attempts >= record.max_attempts) {
        return { success: false, error: 'Maximum verification attempts exceeded. Please request a new code.' };
      }

      // Check Hash Match
      if (record.otp_hash !== submittedHash) {
        const newAttempts = Number(record.attempts || 0) + 1;
        const remaining = Math.max(0, record.max_attempts - newAttempts);

        await supabase
          .from('whatsapp_otps')
          .update({ attempts: newAttempts })
          .eq('id', record.id);

        if (remaining <= 0) {
          return {
            success: false,
            error: 'Incorrect OTP code. Maximum verification attempts reached. Please request a new code.',
            remainingAttempts: 0,
          };
        }

        return {
          success: false,
          error: `Incorrect OTP code. ${remaining} attempt${remaining > 1 ? 's' : ''} remaining.`,
          remainingAttempts: remaining,
        };
      }

      // Mark verified
      await supabase
        .from('whatsapp_otps')
        .update({ verified_at: new Date().toISOString() })
        .eq('id', record.id);

      console.log(`[OTP SERVICE] ✅ OTP successfully verified for ${phone} (${purpose})`);
      return { success: true, message: 'OTP verified successfully.' };
    } catch (dbErr) {
      console.warn('[OTP SERVICE] DB verify failed, checking memory:', dbErr.message);
    }
  }

  // In-Memory Fallback Verification
  const memKey = `${purpose}:${phone}`;
  const memRecord = inMemoryOtps.get(memKey);

  if (!memRecord || memRecord.verifiedAt !== null) {
    return { success: false, error: 'No active OTP request found. Please request a new code.' };
  }

  if (nowMs > memRecord.expiresAtMs) {
    return { success: false, error: 'This verification code has expired. Please request a new one.' };
  }

  if (memRecord.attempts >= memRecord.maxAttempts) {
    return { success: false, error: 'Maximum verification attempts exceeded. Please request a new code.' };
  }

  if (memRecord.otpHash !== submittedHash) {
    memRecord.attempts += 1;
    const remaining = Math.max(0, memRecord.maxAttempts - memRecord.attempts);

    if (remaining <= 0) {
      return {
        success: false,
        error: 'Incorrect OTP code. Maximum verification attempts reached. Please request a new code.',
        remainingAttempts: 0,
      };
    }

    return {
      success: false,
      error: `Incorrect OTP code. ${remaining} attempt${remaining > 1 ? 's' : ''} remaining.`,
      remainingAttempts: remaining,
    };
  }

  // Mark verified
  memRecord.verifiedAt = new Date().toISOString();
  console.log(`[OTP SERVICE] ✅ Memory OTP successfully verified for ${phone} (${purpose})`);
  return { success: true, message: 'OTP verified successfully.' };
}
