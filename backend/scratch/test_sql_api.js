import dotenv from 'dotenv';
dotenv.config();

async function testSqlApi() {
  const url = `${process.env.SUPABASE_URL}/rest/v1/rpc/exec_sql`;
  const headers = {
    'apikey': process.env.SUPABASE_SECRET_KEY,
    'Authorization': `Bearer ${process.env.SUPABASE_SECRET_KEY}`,
    'Content-Type': 'application/json'
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ sql: 'SELECT 1;' })
    });
    console.log('Status:', res.status, 'Response:', await res.text());
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

testSqlApi();
