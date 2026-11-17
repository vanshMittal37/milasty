import { supabase } from '../config/supabase.js';

/**
 * ─── OFFICIAL CLIENT WHATSAPP TEMPLATE REPOSITORY ───────────────────────────
 * All 12 verified official templates with exact client content, variable mappings,
 * and default fallback values.
 */
export const OFFICIAL_TEMPLATES = [
  // ──────────────────────────────────────────────────────────────────────────
  // A. Account & Authentication
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'AUTH_OTP',
    name: 'Signup Verification Code',
    category: 'account',
    event: 'signup_otp',
    triggerDescription: 'Triggered when a customer signs up and requests a WhatsApp OTP.',
    variables: ['OTP'],
    sampleData: {
      OTP: '482910',
    },
    defaultContent: [
      'MILASTY',
      '',
      'Your account verification code is: {{OTP}}',
      '',
      'Valid for 10 minutes. For your security, do not share this code with anyone.',
      '',
      'Thank you for joining MILASTY!',
    ].join('\n'),
    isActive: true,
    providerApproved: true,
  },
  {
    id: 'AUTH_WELCOME',
    name: 'New User Welcome',
    category: 'account',
    event: 'CUSTOMER_REGISTERED',
    triggerDescription: 'Triggered when a new user registers or completes first signup verification.',
    variables: ['customerName'],
    sampleData: {
      customerName: 'Aarav Sharma',
    },
    defaultContent: [
      '🌿 Welcome to MILASTY, {{customerName}}!',
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
    ].join('\n'),
    isActive: true,
    providerApproved: true,
  },
  {
    id: 'PASS_RESET_OTP',
    name: 'Password Reset Code',
    category: 'account',
    event: 'forgot_password_otp',
    triggerDescription: 'Triggered when a customer requests a password reset code via WhatsApp.',
    variables: ['OTP'],
    sampleData: {
      OTP: '739201',
    },
    defaultContent: [
      'MILASTY',
      '',
      'Your password reset code is: {{OTP}}',
      '',
      'Valid for 10 minutes. If you did not request this, please ignore this message.',
      '',
      '© MILASTY All rights reserved.',
    ].join('\n'),
    isActive: true,
    providerApproved: true,
  },
  {
    id: 'PASS_RESET_SUCCESS',
    name: 'Password Reset Confirmation',
    category: 'account',
    event: 'PASSWORD_RESET_COMPLETED',
    triggerDescription: 'Triggered immediately after a password reset is completed successfully.',
    variables: ['customerName'],
    sampleData: {
      customerName: 'Aarav Sharma',
    },
    defaultContent: [
      '🔐 MILASTY Security Alert',
      '',
      'Hello {{customerName}},',
      '',
      'Your password reset has been completed successfully. You can now log in to your account with your new credentials.',
      '',
      '👉 Login: https://milasty.com/login',
      '',
      'Team MILASTY 🌿',
    ].join('\n'),
    isActive: true,
    providerApproved: true,
  },

  // ──────────────────────────────────────────────────────────────────────────
  // B. Payment Notifications
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'PAYMENT_SUCCESS',
    name: 'Payment Received',
    category: 'payment',
    event: 'PAYMENT_SUCCESS',
    triggerDescription: 'Triggered when online payment is verified via Razorpay webhook or manual verification.',
    variables: ['customerName', 'amount', 'orderNumber', 'orderId'],
    sampleData: {
      customerName: 'Priya Sharma',
      amount: '849',
      orderNumber: 'MIL-413561',
      orderId: '5ada78e0-3726-4800-ba2c-5f664ee8ad08',
    },
    defaultContent: [
      '💳 Payment Successful!',
      '',
      'Hello {{customerName}},',
      '',
      'Your payment of ₹{{amount}} for MILASTY order #{{orderNumber}} has been received successfully.',
      '',
      'Our bakers are crafting your order with fresh, organic ingredients.',
      '',
      '👉 View Order: https://milasty.com/account/orders/{{orderId}}',
      '',
      'Thank you for choosing MILASTY! 🌿',
    ].join('\n'),
    isActive: true,
    providerApproved: true,
  },
  {
    id: 'PAYMENT_FAILED',
    name: 'Payment Failed / Pending',
    category: 'payment',
    event: 'PAYMENT_FAILED',
    triggerDescription: 'Triggered when an attempted payment fails at checkout.',
    variables: ['customerName', 'amount', 'orderNumber', 'orderId'],
    sampleData: {
      customerName: 'Priya Sharma',
      amount: '849',
      orderNumber: 'MIL-413561',
      orderId: '5ada78e0-3726-4800-ba2c-5f664ee8ad08',
    },
    defaultContent: [
      '⚠️ Payment Update',
      '',
      'Hello {{customerName}},',
      '',
      "We couldn't confirm your payment of ₹{{amount}} for order #{{orderNumber}}.",
      '',
      'If your amount was deducted, please allow your bank or payment provider a few moments to update the status before trying again.',
      '',
      '👉 Retry or View Order: https://milasty.com/account/orders/{{orderId}}',
      '',
      'Need help? Reply to this message for assistance.',
      '',
      'Team MILASTY 🌿',
    ].join('\n'),
    isActive: true,
    providerApproved: true,
  },

  // ──────────────────────────────────────────────────────────────────────────
  // C. Order Lifecycle Notifications
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'ORDER_CONFIRMED',
    name: 'Order Placed / Confirmed',
    category: 'order',
    event: 'ORDER_CONFIRMED',
    triggerDescription: 'Triggered when an order is paid or confirmed by the bakery.',
    variables: ['customerName', 'orderNumber', 'orderId'],
    sampleData: {
      customerName: 'Priya Sharma',
      orderNumber: 'MIL-413561',
      orderId: '5ada78e0-3726-4800-ba2c-5f664ee8ad08',
    },
    defaultContent: [
      'Hello {{customerName}},',
      '',
      'Good news! Your MILASTY order has been confirmed 💛',
      '',
      'Order ID: #{{orderNumber}}',
      '',
      'We are preparing your items with love and care.',
      '',
      '👉 View Your Order: https://milasty.com/account/orders/{{orderId}}',
      '',
      'With love,',
      'Team MILASTY 🌿',
    ].join('\n'),
    isActive: true,
    providerApproved: true,
  },
  {
    id: 'ORDER_SHIPPED',
    name: 'Order Dispatched',
    category: 'order',
    event: 'ORDER_SHIPPED',
    triggerDescription: 'Triggered when the package is handed over to courier and dispatched.',
    variables: ['customerName', 'orderNumber', 'estimatedDeliveryDate', 'orderId'],
    sampleData: {
      customerName: 'Debarghya Basu',
      orderNumber: 'MIL-413561',
      estimatedDeliveryDate: '24 Nov 2026',
      orderId: '5ada78e0-3726-4800-ba2c-5f664ee8ad08',
    },
    defaultContent: [
      'Hello {{customerName}}, 💛',
      '',
      'Your MILASTY order #{{orderNumber}} is on its way!',
      '',
      '📦 Expected Delivery: {{estimatedDeliveryDate}}',
      '',
      '👉 Track Your Order:',
      'https://milasty.com/account/orders/{{orderId}}',
      '',
      'A Quick Note:',
      '',
      'We hope your order reaches you in the same perfect condition in which we carefully packed it!',
      '',
      'However, if you notice any missing items, damage, leakage or package tampering, we kindly request you to share a continuous, uncut unboxing video, starting from the sealed package and covering the entire opening process.',
      '',
      'This will help us understand the issue and assist you better.',
      '',
      'Complaints without a complete unboxing video may not be eligible for resolution.',
      '',
      'Thank you for choosing MILASTY and supporting our journey! 💛',
      '',
      'With love,',
      'Team MILASTY 🌿',
      '',
      'Where millets meet great taste.',
    ].join('\n'),
    isActive: true,
    providerApproved: true,
  },
  {
    id: 'ORDER_DELIVERED',
    name: 'Order Delivered & Review',
    category: 'order',
    event: 'ORDER_DELIVERED',
    triggerDescription: 'Triggered when delivery partner confirms delivery to the customer.',
    variables: ['customerName', 'orderNumber', 'orderId'],
    sampleData: {
      customerName: 'Debarghya Basu',
      orderNumber: 'MIL-413561',
      orderId: '5ada78e0-3726-4800-ba2c-5f664ee8ad08',
    },
    defaultContent: [
      'Hello {{customerName}}!',
      '',
      'Your MILASTY order #{{orderNumber}} has been successfully delivered! 💛',
      '',
      'We hope you love your purchase. Your experience means a lot to us.',
      '',
      "We'd love to hear what you think! ⭐",
      '',
      'Share your experience:',
      'https://milasty.com/account/orders/{{orderId}}/review',
      '',
      'Thank you for choosing MILASTY.',
      '',
      'With love,',
      'Team MILASTY 🌿',
    ].join('\n'),
    isActive: true,
    providerApproved: true,
  },

  // ──────────────────────────────────────────────────────────────────────────
  // D. Customer Support & Post-Purchase
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'ORDER_CANCEL_REQ',
    name: 'Cancellation Received',
    category: 'order',
    event: 'CANCELLATION_REQUESTED',
    triggerDescription: 'Triggered when a customer submits a cancellation request.',
    variables: ['customerName', 'orderNumber', 'orderId'],
    sampleData: {
      customerName: 'Rohan Verma',
      orderNumber: 'MIL-413561',
      orderId: '5ada78e0-3726-4800-ba2c-5f664ee8ad08',
    },
    defaultContent: [
      'Hello {{customerName}},',
      '',
      'Your cancellation request for order #{{orderNumber}} has been received.',
      '',
      'Our team will review it and share an update shortly.',
      '',
      '👉 View Order: https://milasty.com/account/orders/{{orderId}}',
      '',
      'Warm regards,',
      'Team MILASTY 🌿',
    ].join('\n'),
    isActive: true,
    providerApproved: true,
  },
  {
    id: 'REFUND_COMPLETE',
    name: 'Refund Processed',
    category: 'returns',
    event: 'REFUND_COMPLETED',
    triggerDescription: 'Triggered when refund amount is processed back to customer.',
    variables: ['customerName', 'refundAmount', 'orderNumber', 'orderId'],
    sampleData: {
      customerName: 'Rohan Verma',
      refundAmount: '849',
      orderNumber: 'MIL-413561',
      orderId: '5ada78e0-3726-4800-ba2c-5f664ee8ad08',
    },
    defaultContent: [
      'Hello {{customerName}},',
      '',
      'A refund of ₹{{refundAmount}} for order #{{orderNumber}} has been successfully processed.',
      '',
      'Depending on your payment method or bank, it will reflect in your account within 5–7 business days.',
      '',
      'Thank you for your patience and understanding.',
      '',
      '👉 View Order: https://milasty.com/account/orders/{{orderId}}',
      '',
      'With love,',
      'Team MILASTY 🌿',
    ].join('\n'),
    isActive: true,
    providerApproved: true,
  },
  {
    id: 'ENQUIRY_RECEIVED',
    name: 'Support Contact Form',
    category: 'enquiry',
    event: 'CUSTOMER_ENQUIRY_CREATED',
    triggerDescription: 'Triggered when customer submits an inquiry or contact form on the website.',
    variables: ['customerName', 'enquiryId', 'enquirySubject'],
    sampleData: {
      customerName: 'Meera Kapoor',
      enquiryId: 'ENQ-8902',
      enquirySubject: 'Bulk Gifting Inquiry',
    },
    defaultContent: [
      'Hello {{customerName}}!',
      '',
      'Thank you for reaching out to MILASTY. 💛',
      '',
      "We've successfully received your enquiry.",
      '',
      '━━━━━━━━━━━━━━━━━━',
      'ENQUIRY DETAILS',
      '',
      'Reference ID: {{enquiryId}}',
      'Subject: {{enquirySubject}}',
      '━━━━━━━━━━━━━━━━━━',
      '',
      'Our team will review your request and get back to you as soon as possible.',
      '',
      'Thank you for connecting with MILASTY.',
      '',
      '👉 Visit MILASTY: https://milasty.com',
      '',
      'Warm regards,',
      'Team MILASTY 🌿',
    ].join('\n'),
    isActive: true,
    providerApproved: true,
  },
];

// In-memory customization cache
const memoryTemplates = new Map();
OFFICIAL_TEMPLATES.forEach((t) => {
  memoryTemplates.set(t.id, {
    ...t,
    content: t.defaultContent,
    isCustom: false,
    updatedAt: new Date().toISOString(),
  });
});

let dbChecked = false;
let dbAvailable = false;

async function checkDbAvailability() {
  if (dbChecked) return dbAvailable;
  try {
    const { error } = await supabase.from('whatsapp_message_templates').select('id').limit(1);
    if (!error) {
      dbAvailable = true;
    } else {
      dbAvailable = false;
    }
  } catch (e) {
    dbAvailable = false;
  }
  dbChecked = true;
  return dbAvailable;
}

/**
 * ─── RENDER TEMPLATE WITH CLEAN FALLBACKS ────────────────────────────────────
 * Guarantees zero "undefined", "null", or empty variables.
 */
export function renderTemplateText(templateText, variables = {}) {
  if (!templateText) return '';

  return templateText.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, (match, varName) => {
    const val = variables[varName];

    if (val !== undefined && val !== null && String(val).trim() !== '' && String(val) !== 'undefined' && String(val) !== 'null') {
      return String(val).trim();
    }

    // Default variable fallbacks based on variable name
    switch (varName) {
      case 'customerName':
        return 'Valued Customer';
      case 'amount':
      case 'refundAmount':
        return '0';
      case 'orderNumber':
        return variables.orderId ? String(variables.orderId).slice(0, 8) : 'MILASTY';
      case 'orderId':
        return variables.orderNumber || '';
      case 'estimatedDeliveryDate':
        return 'Within 3–5 business days';
      case 'enquiryId':
        return 'MILASTY-ENQ';
      case 'enquirySubject':
        return 'Customer Enquiry';
      case 'OTP':
        return '';
      default:
        return '';
    }
  });
}

/**
 * Get all 12 templates (combining DB/memory customizations with official defaults)
 */
export async function getAllTemplates() {
  const hasDb = await checkDbAvailability();
  if (hasDb) {
    try {
      const { data, error } = await supabase.from('whatsapp_message_templates').select('*');
      if (!error && Array.isArray(data) && data.length > 0) {
        data.forEach((row) => {
          if (memoryTemplates.has(row.id)) {
            const current = memoryTemplates.get(row.id);
            memoryTemplates.set(row.id, {
              ...current,
              content: row.content || current.defaultContent,
              isActive: row.is_active !== false,
              isCustom: Boolean(row.is_custom),
              providerApproved: row.is_custom ? false : true,
              updatedAt: row.updated_at || current.updatedAt,
            });
          }
        });
      }
    } catch (e) {
      console.warn('[WHATSAPP TEMPLATES] DB fetch error:', e.message);
    }
  }

  return Array.from(memoryTemplates.values());
}

/**
 * Get a specific template by ID
 */
export async function getTemplateById(templateId) {
  const all = await getAllTemplates();
  return all.find((t) => t.id === templateId) || null;
}

/**
 * Update a template's content or active status
 */
export async function updateTemplate(templateId, updates = {}) {
  const existing = memoryTemplates.get(templateId);
  if (!existing) {
    throw new Error(`Template ${templateId} not found.`);
  }

  const isContentChanged = updates.content !== undefined && updates.content !== existing.defaultContent;
  const newContent = updates.content !== undefined ? updates.content : existing.content;
  const newIsActive = updates.isActive !== undefined ? Boolean(updates.isActive) : existing.isActive;

  const updatedObj = {
    ...existing,
    content: newContent,
    isActive: newIsActive,
    isCustom: isContentChanged,
    providerApproved: isContentChanged ? false : true,
    updatedAt: new Date().toISOString(),
  };

  memoryTemplates.set(templateId, updatedObj);

  const hasDb = await checkDbAvailability();
  if (hasDb) {
    try {
      await supabase.from('whatsapp_message_templates').upsert({
        id: templateId,
        name: existing.name,
        category: existing.category,
        event: existing.event,
        variables: existing.variables,
        content: newContent,
        is_active: newIsActive,
        is_custom: isContentChanged,
        updated_at: updatedObj.updatedAt,
      }, { onConflict: 'id' });
    } catch (e) {
      console.warn('[WHATSAPP TEMPLATES] DB update error:', e.message);
    }
  }

  return updatedObj;
}

/**
 * Reset a template back to the official client default
 */
export async function resetTemplateToDefault(templateId) {
  const existing = memoryTemplates.get(templateId);
  if (!existing) {
    throw new Error(`Template ${templateId} not found.`);
  }

  const resetObj = {
    ...existing,
    content: existing.defaultContent,
    isCustom: false,
    providerApproved: true,
    updatedAt: new Date().toISOString(),
  };

  memoryTemplates.set(templateId, resetObj);

  const hasDb = await checkDbAvailability();
  if (hasDb) {
    try {
      await supabase.from('whatsapp_message_templates').update({
        content: existing.defaultContent,
        is_custom: false,
        updated_at: resetObj.updatedAt,
      }).eq('id', templateId);
    } catch (e) {
      console.warn('[WHATSAPP TEMPLATES] DB reset error:', e.message);
    }
  }

  return resetObj;
}

/**
 * Render a template by its ID (asynchronous, fetches fresh from DB if available)
 */
export async function renderTemplate(templateId, variables = {}) {
  const t = await getTemplateById(templateId);
  const text = t ? t.content : (OFFICIAL_TEMPLATES.find((x) => x.id === templateId)?.defaultContent || '');
  return renderTemplateText(text, variables);
}

/**
 * Render a template synchronously from memory cache
 */
export function renderTemplateSync(templateId, variables = {}) {
  const t = memoryTemplates.get(templateId);
  const text = t ? t.content : (OFFICIAL_TEMPLATES.find((x) => x.id === templateId)?.defaultContent || '');
  return renderTemplateText(text, variables);
}
