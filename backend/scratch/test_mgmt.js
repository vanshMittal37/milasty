import dotenv from 'dotenv';
dotenv.config();

async function testMgmt() {
  const ref = 'vwstzycakjwjogtojzzg';
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${secretKey}`
    },
    body: JSON.stringify({ query: 'ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS stock integer DEFAULT 50;' })
  });
  console.log('Management API status:', res.status);
  const text = await res.text();
  console.log('Management API response:', text);
}

testMgmt();
