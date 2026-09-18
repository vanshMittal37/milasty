import dotenv from 'dotenv';
dotenv.config();
import { supabase } from '../config/supabase.js';

async function testTable() {
  console.log('Testing access to payment_sessions table via Supabase client...');
  const { data, error } = await supabase.from('payment_sessions').select('*').limit(1);
  if (error) {
    console.log('payment_sessions query error:', error.message, error.code);
  } else {
    console.log('payment_sessions table exists! Rows count sample:', data.length);
  }
  process.exit(0);
}

testTable();
