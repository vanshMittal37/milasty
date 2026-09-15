import { supabase } from '../config/supabase.js';

async function checkProductsCols() {
  const { data, error } = await supabase.from('products').select('*').limit(1);
  console.log('Products keys:', data ? Object.keys(data[0] || {}) : null);
  console.log('Error:', error);
}

checkProductsCols();
