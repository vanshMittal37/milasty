import { supabase } from '../config/supabase.js';

async function test() {
  const { data, error } = await supabase.from('product_variants').select('*').limit(5);
  console.log('product_variants sample data:', data, 'error:', error);
}

test();
