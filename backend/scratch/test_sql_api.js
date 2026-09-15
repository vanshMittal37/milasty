import { supabase } from '../config/supabase.js';

async function alterTable() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;

  // Let's try Supabase query endpoint or postgres rpc if exists
  const res = await fetch(`${url}/rest/v1/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': key,
      'Authorization': `Bearer ${key}`
    },
    body: JSON.stringify({ query: 'ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS stock integer DEFAULT 50;' })
  });
  console.log('Fetch /rest/v1/query status:', res.status);
  const text = await res.text();
  console.log('Fetch result:', text);
}

alterTable();
