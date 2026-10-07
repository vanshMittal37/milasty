import { supabase } from '../config/supabase.js';

/**
 * Extract the missing column name from a PostgREST / Postgres error, if that is what the error is.
 *  - PGRST204: "Could not find the 'foo' column of 'orders' in the schema cache"
 *  - 42703:    "column orders.foo does not exist" / "column \"foo\" of relation \"orders\" does not exist"
 */
export function missingColumnFromError(error) {
  const msg = String(error?.message || '');
  const m =
    msg.match(/Could not find the '([^']+)' column/i) ||
    msg.match(/column\s+"?(?:[a-z_]+\.)?([a-z0-9_]+)"?\s+(?:of relation "[^"]+"\s+)?does not exist/i);
  return m ? m[1] : null;
}

/**
 * Update an order row, silently dropping any columns that don't exist in this deployment's schema.
 * Lets new optional shipment/payment fields be written before the migration has been run, without
 * losing the columns that do exist.
 *
 * @returns {{ error: object|null, skipped: string[] }}
 */
export async function safeUpdateOrder(orderId, fields) {
  let payload = Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== undefined));
  const skipped = [];

  while (Object.keys(payload).length > 0) {
    const { error } = await supabase.from('orders').update(payload).eq('id', orderId);
    if (!error) return { error: null, skipped };

    const col = missingColumnFromError(error);
    if (!col || !(col in payload)) return { error, skipped };

    skipped.push(col);
    const { [col]: _omit, ...rest } = payload;
    payload = rest;
  }
  return { error: null, skipped };
}
