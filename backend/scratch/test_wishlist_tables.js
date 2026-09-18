import dotenv from 'dotenv';
dotenv.config();
import { supabase } from '../config/supabase.js';

async function checkWishlistTables() {
  console.log('--- Inspecting Wishlist Database Tables ---');
  
  // 1. Check if 'wishlist' table exists
  const { data: wData, error: wErr } = await supabase.from('wishlist').select('*').limit(1);
  console.log('wishlist table check:', { exists: !wErr, error: wErr?.message, code: wErr?.code, sample: wData });

  // 2. Check if 'wishlists' table exists
  const { data: wsData, error: wsErr } = await supabase.from('wishlists').select('*').limit(1);
  console.log('wishlists table check:', { exists: !wsErr, error: wsErr?.message, code: wsErr?.code, sample: wsData });

  // 3. Check if 'users' table has 'wishlist' column
  const { data: uData, error: uErr } = await supabase.from('users').select('id, email, wishlist').limit(1);
  console.log('users table wishlist column check:', { exists: !uErr, error: uErr?.message, sample: uData });

  process.exit(0);
}

checkWishlistTables();
