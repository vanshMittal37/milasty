/**
 * Migration 14: Add notes column to orders table and customization_note to order_items
 * Run: node --experimental-vm-modules scripts/14_add_notes_and_customization_columns.js
 */
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_KEY
);

async function runMigration() {
  console.log('Running Migration 14: Add notes + customization_note columns...\n');

  // Check if notes column already exists by doing a select
  const { data: ordersCheck, error: ordersCheckErr } = await supabase
    .from('orders')
    .select('notes')
    .limit(1);

  if (ordersCheckErr && ordersCheckErr.message?.includes('notes')) {
    console.log('❌ orders.notes column DOES NOT exist - needs to be added manually');
    console.log('\nPlease run this SQL in your Supabase Dashboard > SQL Editor:');
    console.log('─────────────────────────────────────────────────────────────');
    console.log('ALTER TABLE orders ADD COLUMN IF NOT EXISTS notes text;');
    console.log('ALTER TABLE order_items ADD COLUMN IF NOT EXISTS customization_note text;');
    console.log('─────────────────────────────────────────────────────────────');
    console.log('\nThis is the root cause of orders not appearing after checkout.');
  } else if (!ordersCheckErr) {
    console.log('✅ orders.notes column already exists - no migration needed');
  } else {
    console.log('⚠️  Error checking orders table:', ordersCheckErr.message);
  }

  // Check customization_note
  const { data: itemsCheck, error: itemsCheckErr } = await supabase
    .from('order_items')
    .select('customization_note')
    .limit(1);

  if (itemsCheckErr && itemsCheckErr.message?.includes('customization_note')) {
    console.log('❌ order_items.customization_note column DOES NOT exist - needs to be added manually');
  } else if (!itemsCheckErr) {
    console.log('✅ order_items.customization_note column already exists');
  }

  console.log('\n--- Check complete ---');
}

runMigration().catch(console.error);
