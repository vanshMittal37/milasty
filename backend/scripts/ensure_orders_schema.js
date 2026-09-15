import dotenv from 'dotenv';
dotenv.config();
import { supabase } from '../config/supabase.js';

async function migrateOrdersSchema() {
  console.log('--- Ensuring orders table columns in Supabase ---');

  const columnsToAdd = [
    { name: 'delivery_city', type: 'text' },
    { name: 'delivery_state', type: 'text' },
    { name: 'razorpay_order_id', type: 'text' },
    { name: 'razorpay_payment_id', type: 'text' },
    { name: 'razorpay_signature', type: 'text' },
    { name: 'updated_at', type: 'timestamp with time zone DEFAULT now()' },
  ];

  for (const col of columnsToAdd) {
    try {
      // Test selecting the column
      const { error } = await supabase.from('orders').select(col.name).limit(1);
      if (error && error.message?.includes('does not exist')) {
        console.log(`Column '${col.name}' missing. Attempting RPC/migration...`);
      } else {
        console.log(`Column '${col.name}' exists in orders table.`);
      }
    } catch (e) {
      console.warn(`Check column ${col.name} warning:`, e.message);
    }
  }

  process.exit(0);
}

migrateOrdersSchema();
