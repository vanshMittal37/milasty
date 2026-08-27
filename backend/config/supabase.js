import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseSecretKey) {
  console.warn('⚠️ Supabase credentials (SUPABASE_URL, SUPABASE_SECRET_KEY) are missing in environment. Fallback modes will operate.');
}

// Create Supabase client using secret service key on server
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseSecretKey || 'placeholder-secret-key',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);
