import { normalizeIndianMobile } from '../../utils/phone.js';

const getFrontendBaseUrl = () => {
  return process.env.FRONTEND_URL || process.env.APP_URL || 'https://milasty.com';
};

/**
 * ─── CUSTOMER ACCOUNT NOTIFICATIONS ─────────────────────────────────────────
 */

/**
 * AUTH_OTP – Signup Verification Code
 */
export const authOtpTemplate = ({ otp = '', OTP = '' }) => {
  const code = otp || OTP || '';
  return [
    'MILASTY',
    '',
    `Your account verification code is: ${code}`,
    '',
    'Valid for 10 minutes. For your security, do not share this code with anyone.',
    '',
    'Thank you for joining MILASTY!',
  ].join('\n');
};

/**
 * AUTH_WELCOME – New User Welcome
 */
export const customerWelcome = ({ customerName = 'Friend' }) => {
  return [
    `🌿 Welcome to MILASTY, ${customerName}!`,
    '',
    "We're delighted to have you here. ✨",
    '',
    'Discover our handcrafted millet bakes made in 100% pure Desi Ghee, sweetened naturally with organic Jaggery and zero refined sugar or preservatives.',
    '',
    'Enjoy a nourishing, guilt-free snacking experience!',
    '',
    '👉 Explore MILASTY: https://milasty.com/shop',
    '',
    'With love,',
    'Team MILASTY 🌿',
  ].join('\n');
};

/**
 * PASS_RESET_OTP – Password Reset Code
 */
export const passResetOtpTemplate = ({ otp = '', OTP = '' }) => {
  const code = otp || OTP || '';
  return [
    'MILASTY',
    '',
    `Your password reset code is: ${code}`,
    '',
    'Valid for 10 minutes. If you did not request this, please ignore this message.',
    '',
    '© MILASTY All rights reserved.',
  ].join('\n');
};

/**
 * PASS_RESET_SUCCESS – Password Reset Confirmation
 */
export const customerPasswordResetCompleted = ({ customerName = 'Valued Customer' }) => {
  return [
    '🔐 MILASTY Security Alert',
    '',
    `Hello ${customerName},`,
    '',
    'Your password reset has been completed successfully. You can now log in to your account with your new credentials.',
    '',
    '👉 Login: https://milasty.com/login',
    '',
    'Team MILASTY 🌿',
  ].join('\n');
};

export const customerPasswordChanged = ({ customerName = 'Valued Customer' }) => {
  return customerPasswordResetCompleted({ customerName });
};

/**
 * ─── ADMIN ACCOUNT NOTIFICATIONS ────────────────────────────────────────────
 */
export const adminNewCustomer = ({
  customerName = 'Customer',
  customerPhone = 'N/A',
  customerEmail = 'N/A',
  registrationTime = '',
}) => {
  const timeStr = registrationTime || new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  const adminUrl = `${getFrontendBaseUrl()}/admin/customers`;

  return [
    '👤 NEW CUSTOMER REGISTERED!',
    '',
    'A new customer has joined MILASTY.',
    '',
    `Name: ${customerName}`,
    `Phone: +91 ${normalizeIndianMobile(customerPhone) || customerPhone}`,
    `Email: ${customerEmail || 'N/A'}`,
    `Registration Time: ${timeStr}`,
    '',
    `👉 View Customer: ${adminUrl}`,
  ].join('\n');
};
