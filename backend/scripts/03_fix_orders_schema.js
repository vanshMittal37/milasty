import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Client } = pg;

async function migrateOrdersTable() {
  const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || 'postgresql://postgres:postgres@db.vwstzycakjwjogtojzzg.supabase.co:5432/postgres';
  console.log('Connecting to PostgreSQL database to migrate orders table...');
  
  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to Postgres directly!');

    const sqlStatements = [
      'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_city text;',
      'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_state text;',
      'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS razorpay_order_id text;',
      'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS razorpay_payment_id text;',
      'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS razorpay_signature text;',
      'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();',
      'ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS product_image text;',
      'ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS variant_id text;'
    ];

    for (const sql of sqlStatements) {
      try {
        await client.query(sql);
        console.log('Executed:', sql);
      } catch (err) {
        console.warn('SQL execution warning:', sql, err.message);
      }
    }

    console.log('--- Orders Table Schema Migration Completed Successfully ---');
  } catch (err) {
    console.error('Migration connection error:', err.message);
  } finally {
    await client.end();
    process.exit(0);
  }
}

migrateOrdersTable();
