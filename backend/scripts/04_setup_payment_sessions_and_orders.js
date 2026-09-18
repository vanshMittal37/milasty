import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Client } = pg;

async function setupDatabaseSchema() {
  const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || 'postgresql://postgres:postgres@db.vwstzycakjwjogtojzzg.supabase.co:5432/postgres';
  console.log('Connecting to PostgreSQL database to setup payment_sessions and update orders schema...');
  
  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to Postgres directly!');

    const sqlStatements = [
      // 1. Ensure orders table columns
      'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_city text;',
      'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_state text;',
      'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS razorpay_order_id text;',
      'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS razorpay_payment_id text;',
      'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS razorpay_signature text;',
      'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();',
      
      // 2. Ensure order_items table columns
      'ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS product_image text;',
      'ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS variant_id text;',

      // 3. Create payment_sessions table
      `CREATE TABLE IF NOT EXISTS public.payment_sessions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid,
        razorpay_order_id text UNIQUE,
        amount numeric NOT NULL,
        currency text DEFAULT 'INR',
        status text NOT NULL DEFAULT 'created',
        customer_name text,
        customer_email text,
        customer_phone text,
        shipping_address text,
        pincode text,
        delivery_city text,
        delivery_state text,
        subtotal numeric NOT NULL,
        delivery_fee numeric NOT NULL DEFAULT 0,
        discount_amount numeric NOT NULL DEFAULT 0,
        grand_total numeric NOT NULL,
        items jsonb NOT NULL,
        coupon_code text,
        created_at timestamp with time zone DEFAULT now(),
        updated_at timestamp with time zone DEFAULT now()
      );`,

      // 4. Index on payment_sessions
      'CREATE INDEX IF NOT EXISTS idx_payment_sessions_razorpay_order_id ON public.payment_sessions(razorpay_order_id);',
      'CREATE INDEX IF NOT EXISTS idx_orders_razorpay_payment_id ON public.orders(razorpay_payment_id);',
      'CREATE INDEX IF NOT EXISTS idx_orders_razorpay_order_id ON public.orders(razorpay_order_id);'
    ];

    for (const sql of sqlStatements) {
      try {
        await client.query(sql);
        console.log('Successfully executed DDL:', sql.slice(0, 60) + '...');
      } catch (err) {
        console.warn('SQL warning:', err.message);
      }
    }

    console.log('--- Database Setup Completed Successfully ---');
  } catch (err) {
    console.error('Migration connection error:', err.message);
  } finally {
    await client.end();
    process.exit(0);
  }
}

setupDatabaseSchema();
