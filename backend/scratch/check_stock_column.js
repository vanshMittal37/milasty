import { supabase } from '../config/supabase.js';

async function testStock() {
  const { data, error } = await supabase.from('product_variants').select('id, name, stock').limit(2);
  console.log('Select stock column:', data, 'error:', error);
}

testStock();
