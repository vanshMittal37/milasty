import { supabase } from '../config/supabase.js';
import { normalizeIndianMobile } from '../utils/phone.js';

/**
 * ─── DEFAULT NOTIFICATION MATRIX (Section 10) ──────────────────────────────
 */
export const DEFAULT_NOTIFICATION_MATRIX = {
  ORDER_PLACED: { customer: true, admin: true, category: 'order', description: 'When customer places an order' },
  ORDER_CONFIRMED: { customer: true, admin: false, category: 'order', description: 'When order is confirmed' },
  ORDER_PROCESSING: { customer: true, admin: false, category: 'order', description: 'When bakery begins preparation' },
  ORDER_PACKED: { customer: true, admin: false, category: 'order', description: 'When order is packed & inspected' },
  ORDER_DISPATCHED: { customer: true, admin: false, category: 'order', description: 'When package leaves bakery' },
  ORDER_SHIPPED: { customer: true, admin: false, category: 'order', description: 'When courier picks up package' },
  ORDER_REACHED_CITY: { customer: true, admin: false, category: 'order', description: 'When package arrives in customer city' },
  ORDER_OUT_FOR_DELIVERY: { customer: true, admin: false, category: 'order', description: 'When delivery executive is on the way' },
  ORDER_DELIVERED: { customer: true, admin: false, category: 'order', description: 'When delivery is completed' },
  ORDER_CANCELLED: { customer: true, admin: false, category: 'order', description: 'When cancellation is finalized' },
  CANCELLATION_REQUESTED: { customer: true, admin: true, category: 'order', description: 'When customer requests cancellation' },
  PAYMENT_SUCCESS: { customer: true, admin: true, category: 'payment', description: 'When payment is verified' },
  PAYMENT_FAILED: { customer: true, admin: true, category: 'payment', description: 'When payment fails at checkout' },
  RETURN_REQUESTED: { customer: true, admin: true, category: 'returns', description: 'When return is requested' },
  RETURN_APPROVED: { customer: true, admin: false, category: 'returns', description: 'When return is approved' },
  REFUND_REQUESTED: { customer: true, admin: true, category: 'returns', description: 'When refund is requested' },
  REFUND_INITIATED: { customer: true, admin: false, category: 'returns', description: 'When refund is initiated' },
  REFUND_COMPLETED: { customer: true, admin: true, category: 'returns', description: 'When refund is processed & completed' },
  CUSTOMER_REGISTERED: { customer: true, admin: true, category: 'account', description: 'When new customer registers' },
  PASSWORD_CHANGED: { customer: true, admin: false, category: 'account', description: 'When password is changed' },
  PASSWORD_RESET_COMPLETED: { customer: true, admin: false, category: 'account', description: 'When password reset is completed' },
  CUSTOMER_ENQUIRY_CREATED: { customer: true, admin: true, category: 'enquiry', description: 'When enquiry or contact form is submitted' },
  WHATSAPP_DISCONNECTED: { customer: false, admin: true, category: 'system', description: 'When WhatsApp connection is lost' },
  WHATSAPP_NOTIFICATION_FAILED: { customer: false, admin: true, category: 'system', description: 'When notification permanently fails' },
};

// In-memory fallback caches
let memorySettings = { ...DEFAULT_NOTIFICATION_MATRIX };
let memoryRecipients = [];
let dbTablesChecked = false;
let dbTablesAvailable = false;

/**
 * Initialize default in-memory primary admin recipient from environment variable
 */
function initMemoryRecipients() {
  if (memoryRecipients.length === 0) {
    const envAdmin = normalizeIndianMobile(process.env.WHATSAPP_ADMIN_NUMBER);
    if (envAdmin) {
      memoryRecipients.push({
        id: 'rec_primary_env',
        name: 'Primary Admin',
        phone: envAdmin,
        is_primary: true,
        is_active: true,
        categories: ['all'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
  }
}
initMemoryRecipients();

/**
 * Check if the Supabase settings & recipients tables are ready
 */
async function checkDbAvailability() {
  if (dbTablesChecked) return dbTablesAvailable;
  try {
    const { error: setErr } = await supabase.from('whatsapp_notification_settings').select('key').limit(1);
    const { error: recErr } = await supabase.from('whatsapp_admin_recipients').select('id').limit(1);

    if (!setErr && !recErr) {
      dbTablesAvailable = true;
      console.log('[WHATSAPP SETTINGS] Connected to Supabase settings and recipients tables.');
    } else {
      dbTablesAvailable = false;
      console.log('[WHATSAPP SETTINGS] Using resilient in-memory settings layer.');
    }
  } catch (e) {
    dbTablesAvailable = false;
  }
  dbTablesChecked = true;
  return dbTablesAvailable;
}

/**
 * ─── NOTIFICATION SETTINGS (MATRIX) ─────────────────────────────────────────
 */

export async function getNotificationSettings() {
  const hasDb = await checkDbAvailability();
  if (hasDb) {
    try {
      const { data, error } = await supabase.from('whatsapp_notification_settings').select('*');
      if (!error && Array.isArray(data) && data.length > 0) {
        const matrix = { ...DEFAULT_NOTIFICATION_MATRIX };
        for (const row of data) {
          if (row.key) {
            matrix[row.key] = {
              customer: Boolean(row.customer_enabled),
              admin: Boolean(row.admin_enabled),
              category: row.category || matrix[row.key]?.category || 'other',
              description: row.description || matrix[row.key]?.description || '',
            };
          }
        }
        memorySettings = matrix;
        return matrix;
      }
    } catch (e) {
      console.warn('[WHATSAPP SETTINGS] DB fetch error, using memory fallback:', e.message);
    }
  }
  return memorySettings;
}

export async function updateNotificationSettings(updates = {}) {
  const current = await getNotificationSettings();
  const nextSettings = { ...current };

  for (const [key, val] of Object.entries(updates)) {
    if (nextSettings[key]) {
      nextSettings[key] = {
        ...nextSettings[key],
        customer: typeof val.customer === 'boolean' ? val.customer : nextSettings[key].customer,
        admin: typeof val.admin === 'boolean' ? val.admin : nextSettings[key].admin,
      };
    }
  }

  memorySettings = nextSettings;

  const hasDb = await checkDbAvailability();
  if (hasDb) {
    try {
      const rows = Object.entries(nextSettings).map(([key, val]) => ({
        key,
        customer_enabled: val.customer,
        admin_enabled: val.admin,
        category: val.category,
        description: val.description,
        updated_at: new Date().toISOString(),
      }));
      await supabase.from('whatsapp_notification_settings').upsert(rows, { onConflict: 'key' });
    } catch (e) {
      console.warn('[WHATSAPP SETTINGS] Could not persist settings to Supabase:', e.message);
    }
  }

  return memorySettings;
}

/**
 * Check if customer or admin notifications are active for a specific event
 */
export async function isEventEnabled(eventName) {
  const settings = await getNotificationSettings();
  const eventConfig = settings[eventName] || DEFAULT_NOTIFICATION_MATRIX[eventName];
  if (!eventConfig) {
    return { customer: true, admin: true };
  }
  return {
    customer: Boolean(eventConfig.customer),
    admin: Boolean(eventConfig.admin),
  };
}

/**
 * ─── ADMIN RECIPIENTS MANAGEMENT ───────────────────────────────────────────
 */

export async function getAdminRecipients() {
  const hasDb = await checkDbAvailability();
  if (hasDb) {
    try {
      const { data, error } = await supabase
        .from('whatsapp_admin_recipients')
        .select('*')
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: true });

      if (!error && Array.isArray(data) && data.length > 0) {
        memoryRecipients = data;
        return data;
      }
    } catch (e) {
      console.warn('[WHATSAPP RECIPIENTS] DB error, using memory:', e.message);
    }
  }

  initMemoryRecipients();
  return memoryRecipients;
}

export async function getActiveAdminRecipientsForCategory(category = 'all') {
  const recipients = await getAdminRecipients();
  return recipients.filter((rec) => {
    if (!rec.is_active) return false;
    const cats = Array.isArray(rec.categories) ? rec.categories : ['all'];
    return cats.includes('all') || cats.includes(category);
  });
}

export async function addAdminRecipient({ name, phone, is_primary = false, categories = ['all'] }) {
  const cleanPhone = normalizeIndianMobile(phone);
  if (!cleanPhone) {
    throw new Error('Valid 10-digit Indian mobile number is required.');
  }
  if (!name || !name.trim()) {
    throw new Error('Recipient name is required.');
  }

  const existing = await getAdminRecipients();
  if (existing.some((r) => r.phone === cleanPhone)) {
    throw new Error(`Admin recipient with phone number +91 ${cleanPhone} already exists.`);
  }

  const newRec = {
    id: `rec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name: name.trim(),
    phone: cleanPhone,
    is_primary: Boolean(is_primary),
    is_active: true,
    categories: Array.isArray(categories) && categories.length > 0 ? categories : ['all'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const hasDb = await checkDbAvailability();
  if (hasDb) {
    try {
      const { data, error } = await supabase
        .from('whatsapp_admin_recipients')
        .insert([{
          name: newRec.name,
          phone: newRec.phone,
          is_primary: newRec.is_primary,
          is_active: newRec.is_active,
          categories: newRec.categories,
        }])
        .select()
        .single();

      if (!error && data) {
        newRec.id = data.id;
      }
    } catch (e) {
      console.warn('[WHATSAPP RECIPIENTS] DB insert error:', e.message);
    }
  }

  memoryRecipients.push(newRec);
  return newRec;
}

export async function updateAdminRecipient(id, updates = {}) {
  const hasDb = await checkDbAvailability();

  if (updates.phone) {
    const clean = normalizeIndianMobile(updates.phone);
    if (!clean) throw new Error('Invalid mobile number format.');
    updates.phone = clean;
  }

  updates.updated_at = new Date().toISOString();

  if (hasDb) {
    try {
      await supabase
        .from('whatsapp_admin_recipients')
        .update(updates)
        .eq('id', id);
    } catch (e) {
      console.warn('[WHATSAPP RECIPIENTS] DB update error:', e.message);
    }
  }

  const idx = memoryRecipients.findIndex((r) => String(r.id) === String(id));
  if (idx !== -1) {
    memoryRecipients[idx] = { ...memoryRecipients[idx], ...updates };
    return memoryRecipients[idx];
  }
  return null;
}

export async function deleteAdminRecipient(id) {
  const hasDb = await checkDbAvailability();
  if (hasDb) {
    try {
      await supabase
        .from('whatsapp_admin_recipients')
        .delete()
        .eq('id', id);
    } catch (e) {
      console.warn('[WHATSAPP RECIPIENTS] DB delete error:', e.message);
    }
  }

  memoryRecipients = memoryRecipients.filter((r) => String(r.id) !== String(id));
  return true;
}
