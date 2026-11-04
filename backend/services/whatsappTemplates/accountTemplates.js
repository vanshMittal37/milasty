import { normalizeIndianMobile } from '../../utils/phone.js';

const getFrontendBaseUrl = () => {
  return process.env.FRONTEND_URL || process.env.APP_URL || 'https://milasty.com';
};

/**
 * ─── CUSTOMER ACCOUNT NOTIFICATIONS ─────────────────────────────────────────
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
    `👉 Explore MILASTY: ${getFrontendBaseUrl()}/shop`,
    '',
    'With love,',
    'Team MILASTY 🌿',
  ].join('\n');
};

export const customerPasswordChanged = ({ customerName = 'Valued Customer' }) => {
  return [
    '🔐 MILASTY Security Alert',
    '',
    `Hello ${customerName},`,
    'Your account password was just changed successfully.',
    '',
    'If you did not perform this action, please contact our support team immediately or reset your password on our website.',
    '',
    `👉 MILASTY Security: ${getFrontendBaseUrl()}/login`,
    '',
    'Team MILASTY 🌿',
  ].join('\n');
};

export const customerPasswordResetCompleted = ({ customerName = 'Valued Customer' }) => {
  return [
    '🔐 MILASTY Security Alert',
    '',
    `Hello ${customerName},`,
    'Your password reset has been completed successfully.',
    '',
    'You can now log in to your account with your new credentials.',
    '',
    `👉 Login: ${getFrontendBaseUrl()}/login`,
    '',
    'Team MILASTY 🌿',
  ].join('\n');
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
