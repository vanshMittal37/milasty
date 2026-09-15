import dotenv from 'dotenv';
dotenv.config();
import { supabase } from '../config/supabase.js';

export async function ensureDeliveryAreasTable() {
  try {
    // Check if delivery_areas table exists
    const { data: testData, error: testErr } = await supabase.from('delivery_areas').select('id').limit(1);

    if (testErr && testErr.code === '42P01') {
      console.log('⚠️ delivery_areas table missing in Supabase. Run 03_create_delivery_areas.sql in Supabase SQL Editor.');
      return false;
    }

    // Seed default records if table is currently empty
    const { data: existing, error: countErr } = await supabase.from('delivery_areas').select('*');
    if (!countErr && (!existing || existing.length === 0)) {
      console.log('🌱 Seeding initial delivery areas to Supabase...');
      const seedRecords = [
        { state: 'Uttarakhand', city: 'Kichha', pincode: '263153', delivery_charge: 40.00, status: 'active', delivery_note: 'Standard home delivery', estimated_days: '3–5 business days' },
        { state: 'Uttarakhand', city: 'Kichha', pincode: '263148', delivery_charge: 40.00, status: 'active', delivery_note: 'Standard home delivery', estimated_days: '3–5 business days' },
        { state: 'Uttarakhand', city: 'Rudarpur', pincode: '263153', delivery_charge: 40.00, status: 'active', delivery_note: 'Express local delivery', estimated_days: '2–3 business days' },
        { state: 'Uttar Pradesh', city: 'Noida', pincode: '201301', delivery_charge: 50.00, status: 'active', delivery_note: 'NCR Express Delivery', estimated_days: '2–4 business days' },
        { state: 'Delhi', city: 'New Delhi', pincode: '110001', delivery_charge: 0.00, status: 'active', delivery_note: 'Free Metro Delivery', estimated_days: '1–3 business days' },
        { state: 'Maharashtra', city: 'Mumbai', pincode: '400001', delivery_charge: 60.00, status: 'active', delivery_note: 'Pan-India Express Delivery', estimated_days: '3–5 business days' },
      ];
      for (const rec of seedRecords) {
        await supabase.from('delivery_areas').upsert(rec, { onConflict: 'state,city,pincode' });
      }
      console.log('✅ Initial delivery areas seeded successfully.');
    }
    return true;
  } catch (err) {
    console.error('Error ensuring delivery_areas table:', err.message);
    return false;
  }
}

// Run directly if invoked from CLI
if (process.argv[1]?.includes('seedDeliveryAreas.js')) {
  ensureDeliveryAreasTable();
}
