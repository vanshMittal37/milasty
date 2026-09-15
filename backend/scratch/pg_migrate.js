import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Client } = pg;

// Supabase direct connection string format:
// postgres://postgres:[YOUR-PASSWORD]@db.vwstzycakjwjogtojzzg.supabase.co:5432/postgres
// or pooler: postgres://postgres.vwstzycakjwjogtojzzg:[YOUR-PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres

async function migrate() {
  const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  console.log('Database URL available:', !!dbUrl);
  if (!dbUrl) {
    console.log('No DATABASE_URL found in env.');
    return;
  }
  const client = new Client({ connectionString: dbUrl });
  try {
    await client.connect();
    console.log('Connected to Postgres directly!');
    await client.query('ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS stock integer DEFAULT 50;');
    console.log('Successfully added stock column to product_variants!');
  } catch (err) {
    console.error('Migration error:', err.message);
  } finally {
    await client.end();
  }
}

migrate();
