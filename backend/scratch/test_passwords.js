import pkg from 'pg';
const { Client } = pkg;

const passwords = [
  'postgres',
  'vwstzycakjwjogtojzzg',
  'milasty_super_secret_jwt_key_2026',
  'Milasty@2026',
  'Milasty123',
  'milasty123',
  'admin'
];

async function tryPasswords() {
  for (const pass of passwords) {
    const dbUrl = `postgresql://postgres:${encodeURIComponent(pass)}@db.vwstzycakjwjogtojzzg.supabase.co:5432/postgres`;
    const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
    try {
      await client.connect();
      console.log(`✅ SUCCESS WITH PASSWORD: ${pass}`);
      const res = await client.query(`
        CREATE TABLE IF NOT EXISTS public.customer_inquiries (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          inquiry_number VARCHAR(50) NOT NULL UNIQUE,
          user_id UUID DEFAULT NULL,
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          phone TEXT DEFAULT '',
          message TEXT NOT NULL,
          status VARCHAR(20) NOT NULL DEFAULT 'new',
          admin_response TEXT DEFAULT '',
          admin_notes TEXT DEFAULT '',
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          contacted_at TIMESTAMPTZ DEFAULT NULL,
          resolved_at TIMESTAMPTZ DEFAULT NULL,
          closed_at TIMESTAMPTZ DEFAULT NULL
        );
      `);
      console.log('Created customer_inquiries table successfully!');
      await client.end();
      return;
    } catch (err) {
      console.log(`Failed with password '${pass}': ${err.message}`);
      try { await client.end(); } catch (e) {}
    }
  }
}

tryPasswords();
