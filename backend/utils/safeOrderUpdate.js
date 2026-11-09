import { supabase } from '../config/supabase.js';

/**
 * Critical payment and order integrity columns.
 * These columns must NEVER be silently removed or omitted during an update.
 * If any of these are rejected by the database, the operation must fail explicitly.
 */
export const CRITICAL_PAYMENT_COLUMNS = new Set([
  'payment_status',
  'payment_id',
  'razorpay_payment_id',
  'razorpay_order_id',
  'order_status',
  'grand_total',
  'total_amount',
  'id',
  'order_number',
]);

/**
 * Extract the missing column name from a PostgREST (PGRST204) or PostgreSQL (42703) error.
 * Handles all known message variations from Supabase and PostgREST schema cache.
 *
 * Examples:
 *  - PGRST204: "Could not find the 'paid_at' column of 'orders' in the schema cache"
 *  - PGRST204: "Could not find the 'paid_at' column of 'public.orders' in the schema cache"
 *  - PGRST204: "Could not find the column 'paid_at' of 'orders' in the schema cache"
 *  - PGRST204: "Could not find the 'paid_at' column in the schema cache"
 *  - 42703:    "column \"paid_at\" of relation \"orders\" does not exist"
 *  - 42703:    "column orders.paid_at does not exist"
 *  - 42703:    "column \"paid_at\" does not exist"
 */
export function missingColumnFromError(error) {
  if (!error) return null;
  const msg = String(error.message || error.details || error.hint || '');

  // 1. PostgREST schema cache missing column (PGRST204)
  const pgrstMatch =
    msg.match(/Could not find (?:the )?(?:column )?'([^']+)'(?: column)?(?: of (?:'?[a-zA-Z0-9_.]+'?))? in the schema cache/i) ||
    msg.match(/Could not find the '([^']+)' column/i);
  if (pgrstMatch) return pgrstMatch[1];

  // 2. PostgreSQL 42703: column does not exist
  const pgMatch =
    msg.match(/column\s+"?(?:[a-zA-Z0-9_]+\.)?([a-zA-Z0-9_]+)"?\s+(?:of relation "[^"]+"\s+)?does not exist/i);
  if (pgMatch) return pgMatch[1];

  return null;
}

/**
 * Safely update an order row, dropping confirmed missing OPTIONAL columns if the
 * database schema or PostgREST schema cache does not yet have them.
 *
 * Guarantees:
 *  - Handles both UUID order IDs and human-readable order numbers (MIL-XXXXXX).
 *  - Never removes critical payment fields (payment_status, payment_id, etc.).
 *  - Logs every fallback and dropped optional column clearly.
 *  - Retries safely until valid fields are updated.
 *
 * @param {string} orderIdentifier - Order UUID or order_number
 * @param {object} fields - Object of fields to update
 * @returns {Promise<{ error: object|null, skipped: string[] }>}
 */
export async function safeUpdateOrder(orderIdentifier, fields) {
  if (!orderIdentifier) {
    return { error: new Error('Order identifier is required for update'), skipped: [] };
  }

  let payload = Object.fromEntries(
    Object.entries(fields).filter(([, v]) => v !== undefined)
  );
  const skipped = [];
  const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(String(orderIdentifier));

  while (Object.keys(payload).length > 0) {
    let query = supabase.from('orders').update(payload);
    if (isUuid) {
      query = query.eq('id', orderIdentifier);
    } else {
      query = query.eq('order_number', orderIdentifier);
    }

    const { error } = await query;
    if (!error) {
      if (skipped.length > 0) {
        console.log(`[SAFE ORDER UPDATE] Order ${orderIdentifier} updated successfully (omitted missing optional columns: ${skipped.join(', ')})`);
      }
      return { error: null, skipped };
    }

    const col = missingColumnFromError(error);
    if (!col || !(col in payload)) {
      console.error(`[SAFE ORDER UPDATE] Database update error on order ${orderIdentifier} (non-column error):`, error.message);
      return { error, skipped };
    }

    // Safety check: CRITICAL payment and status fields must NEVER be silently omitted
    if (CRITICAL_PAYMENT_COLUMNS.has(col)) {
      console.error(`[SAFE ORDER UPDATE] CRITICAL column "${col}" rejected by database on order ${orderIdentifier}. Halting update to preserve payment integrity.`);
      return { error, skipped };
    }

    // Optional column confirmed missing: record, omit and retry remaining fields
    skipped.push(col);
    console.warn(`[SAFE ORDER UPDATE] Dropping confirmed missing optional column "${col}" for order ${orderIdentifier} (${error.code || 'PGRST204'}: ${error.message}). Retrying remaining fields...`);
    const { [col]: _omit, ...rest } = payload;
    payload = rest;
  }

  if (skipped.length > 0) {
    console.warn(`[SAFE ORDER UPDATE] All requested update fields were skipped for order ${orderIdentifier} (none existed in schema)`);
  }
  return { error: null, skipped };
}
