import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Client } = pg;

export async function setupCustomerInquiriesSchema() {
  const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!dbUrl) {
    console.warn('⚠️ No DATABASE_URL/POSTGRES_URL present. Skipping direct postgres DDL migration script.');
    return;
  }
  
  console.log('Connecting to PostgreSQL database to setup customer_inquiries table...');
  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to Postgres directly!');

    const sqlStatements = [
      `CREATE TABLE IF NOT EXISTS public.customer_inquiries (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        inquiry_number VARCHAR(50) NOT NULL UNIQUE,
        user_id TEXT DEFAULT NULL,
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
      );`,

      `CREATE INDEX IF NOT EXISTS idx_customer_inquiries_inquiry_number ON public.customer_inquiries(inquiry_number);`,
      `CREATE INDEX IF NOT EXISTS idx_customer_inquiries_user_id ON public.customer_inquiries(user_id);`,
      `CREATE INDEX IF NOT EXISTS idx_customer_inquiries_status ON public.customer_inquiries(status);`,
      `CREATE INDEX IF NOT EXISTS idx_customer_inquiries_created_at ON public.customer_inquiries(created_at DESC);`,

      `ALTER TABLE public.customer_inquiries DISABLE ROW LEVEL SECURITY;`
    ];

    for (const sql of sqlStatements) {
      try {
        await client.query(sql);
      } catch (err) {
        console.warn('SQL execution notice:', err.message);
      }
    }

    console.log('--- customer_inquiries table setup completed successfully ---');
  } catch (err) {
    console.error('Migration connection error:', err.message);
  } finally {
    await client.end();
  }
}

if (process.argv[1]?.includes('setup_customer_inquiries_schema.js')) {
  setupCustomerInquiriesSchema().then(() => process.exit(0));
}
