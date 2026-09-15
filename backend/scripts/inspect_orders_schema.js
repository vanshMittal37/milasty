import dotenv from 'dotenv';
dotenv.config();
import { supabase } from '../config/supabase.js';

async function checkSchema() {
  console.log('--- Inspecting orders table schema in Supabase ---');
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error selecting from orders table:', error);
  } else {
    console.log('Orders table existing row / structure:', data);
    if (data && data[0]) {
      console.log('Keys in orders table:', Object.keys(data[0]));
    }
  }

  const { data: items, error: itemsErr } = await supabase
    .from('order_items')
    .select('*')
    .limit(1);

  if (itemsErr) {
    console.error('Error selecting from order_items table:', itemsErr);
  } else {
    console.log('Order_items existing row / structure:', items);
    if (items && items[0]) {
      console.log('Keys in order_items table:', Object.keys(items[0]));
    }
  }
  process.exit(0);
}

checkSchema();
