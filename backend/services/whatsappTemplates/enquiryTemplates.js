import { normalizeIndianMobile } from '../../utils/phone.js';

const getFrontendBaseUrl = () => {
  return process.env.FRONTEND_URL || process.env.APP_URL || 'https://milasty.com';
};

/**
 * ─── CUSTOMER ENQUIRY ACKNOWLEDGEMENT ───────────────────────────────────────
 */
export const customerEnquiryAck = ({
  customerName = 'Valued Customer',
  enquiryId = '',
  enquirySubject = 'Customer Enquiry',
}) => {
  return [
    `🌿 Namaste ${customerName}!`,
    '',
    'Thank you for reaching out to MILASTY. 💛',
    '',
    "We've successfully received your enquiry.",
    '',
    '━━━━━━━━━━━━━━━━━━',
    'ENQUIRY DETAILS',
    '',
    `Reference ID: ${enquiryId}`,
    `Subject: ${enquirySubject}`,
    '━━━━━━━━━━━━━━━━━━',
    '',
    'Our team will review your request and get back to you as soon as possible.',
    '',
    'Thank you for connecting with MILASTY.',
    '',
    `👉 Visit MILASTY: ${getFrontendBaseUrl()}`,
    '',
    'Warm regards,',
    'Team MILASTY 🌿',
  ].join('\n');
};

/**
 * ─── ADMIN ENQUIRY ALERT ────────────────────────────────────────────────────
 */
export const adminNewEnquiry = ({
  customerName = 'Customer',
  customerPhone = 'N/A',
  customerEmail = 'N/A',
  enquiryId = '',
  enquirySubject = 'General Inquiry',
  productName = '',
  enquiryMessage = '',
  enquiryTime = '',
}) => {
  const timeStr = enquiryTime || new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  const adminUrl = `${getFrontendBaseUrl()}/admin/inquiries`;

  const lines = [
    '🔔 NEW CUSTOMER ENQUIRY!',
    '',
    'A new enquiry has been received on MILASTY.',
    '',
    '━━━━━━━━━━━━━━━━━━',
    '👤 CUSTOMER DETAILS',
    '',
    `Name: ${customerName}`,
    `Phone: +91 ${normalizeIndianMobile(customerPhone) || customerPhone}`,
    `Email: ${customerEmail || 'N/A'}`,
    '',
    '━━━━━━━━━━━━━━━━━━',
    '📝 ENQUIRY DETAILS',
    '',
    `Enquiry ID: ${enquiryId}`,
    `Subject: ${enquirySubject}`,
  ];

  if (productName) {
    lines.push(`Product: ${productName}`);
  }

  lines.push('');
  lines.push('Message:');
  lines.push(enquiryMessage || '(No message provided)');
  lines.push('');
  lines.push(`Received At: ${timeStr}`);
  lines.push('━━━━━━━━━━━━━━━━━━');
  lines.push('');
  lines.push('⚡ Please review and respond to this customer.');
  lines.push('');
  lines.push(`👉 View Enquiry in Admin Panel: ${adminUrl}`);

  return lines.join('\n');
};
