import dotenv from 'dotenv';
dotenv.config();
import { supabase } from '../config/supabase.js';

async function testUpdateWithoutUpdatedAt() {
  console.log('--- Testing Order Status Update without updated_at ---');
  
  const { data: orders, error: fetchErr } = await supabase
    .from('orders')
    .select('*')
    .limit(1);

  if (fetchErr || !orders || orders.length === 0) {
    console.error('Fetch order error:', fetchErr);
    process.exit(1);
  }

  const order = orders[0];
  console.log('Testing with Order ID:', order.id, 'Current status:', order.order_status);

  const statusesToTest = ['confirmed', 'Confirmed', 'Out for Delivery', 'out_for_delivery', 'processing', 'Processing', 'packed', 'shipped', 'delivered', 'cancelled'];

  for (const status of statusesToTest) {
    console.log(`\nAttempting update with order_status = "${status}"...`);
    const { data, error } = await supabase
      .from('orders')
      .update({
        order_status: status
      })
      .eq('id', order.id)
      .select()
      .maybeSingle();

    if (error) {
      console.error(`ERROR for "${status}":`, error.message, error.code, error.details);
    } else {
      console.log(`SUCCESS for "${status}": updated row status is "${data?.order_status}"`);
    }
  }

  process.exit(0);
}

testUpdateWithoutUpdatedAt();
