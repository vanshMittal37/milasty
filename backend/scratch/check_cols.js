import { supabase } from '../config/supabase.js';

async function checkColumns() {
  const { data, error } = await supabase.from('product_variants').select('*').limit(1);
  console.log('Product variants keys:', data ? Object.keys(data[0] || {}) : null);
  console.log('Error:', error);
}

checkColumns();
