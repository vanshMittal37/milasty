import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Client } = pg;

async function setupCustomizationSchema() {
  const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || 'postgresql://postgres:postgres@db.vwstzycakjwjogtojzzg.supabase.co:5432/postgres';
  console.log('Connecting to PostgreSQL database to add customization columns...');
  
  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to Postgres directly!');

    const sqlStatements = [
      // 1. Add allow_customization and customization_placeholder to products table
      'ALTER TABLE public.products ADD COLUMN IF NOT EXISTS allow_customization boolean DEFAULT false;',
      'ALTER TABLE public.products ADD COLUMN IF NOT EXISTS customization_placeholder text;',
      
      // 2. Add customization_note to order_items table
      'ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS customization_note text;',

      // 3. Create index for fast lookup of customized order_items
      'CREATE INDEX IF NOT EXISTS idx_order_items_customization_note ON public.order_items(customization_note) WHERE customization_note IS NOT NULL;'
    ];

    for (const sql of sqlStatements) {
      try {
        await client.query(sql);
        console.log('Successfully executed:', sql);
      } catch (err) {
        console.warn('SQL warning:', err.message);
      }
    }

    console.log('--- Customization Database Setup Completed Successfully ---');
  } catch (err) {
    console.error('Migration connection error:', err.message);
  } finally {
    await client.end();
  }
}

setupCustomizationSchema();
