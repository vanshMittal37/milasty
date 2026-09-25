import { supabase } from '../config/supabase.js';

async function setupRules() {
  console.log('Testing Supabase query on delivery_charge_rules...');
  
  try {
    // Check if table exists by selecting
    const { data, error } = await supabase
      .from('delivery_charge_rules')
      .select('*');

    if (error) {
      console.log('Supabase query error:', error.message);
      console.log('Error details:', error);
    } else {
      console.log('Successfully queried delivery_charge_rules! Current rows:', data);
    }
  } catch (err) {
    console.error('Exception:', err);
  }
  process.exit(0);
}

setupRules();
