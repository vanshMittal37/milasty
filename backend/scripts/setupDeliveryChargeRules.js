import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

const { Client } = pg;

async function setupDeliveryChargeRulesTable() {
  const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || 'postgresql://postgres:postgres@db.vwstzycakjwjogtojzzg.supabase.co:5432/postgres';
  console.log('Connecting to PostgreSQL database to setup delivery_charge_rules table...');
  
  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to Postgres directly!');

    // 1. Create table
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.delivery_charge_rules (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        min_order_value NUMERIC(10,2) NOT NULL DEFAULT 0.00,
        max_order_value NUMERIC(10,2) NULL,
        delivery_charge NUMERIC(10,2) NOT NULL DEFAULT 0.00,
        is_free_delivery BOOLEAN NOT NULL DEFAULT false,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('Created or verified delivery_charge_rules table.');

    // 2. Indexes
    await client.query('CREATE INDEX IF NOT EXISTS idx_delivery_charge_rules_active ON public.delivery_charge_rules(is_active);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_delivery_charge_rules_min_max ON public.delivery_charge_rules(min_order_value, max_order_value);');

    // 3. RLS
    await client.query('ALTER TABLE public.delivery_charge_rules ENABLE ROW LEVEL SECURITY;');
    
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE tablename = 'delivery_charge_rules' AND policyname = 'Public Read Delivery Charge Rules'
        ) THEN
          CREATE POLICY "Public Read Delivery Charge Rules" ON public.delivery_charge_rules FOR SELECT USING (true);
        END IF;
      END
      $$;
    `);

    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE tablename = 'delivery_charge_rules' AND policyname = 'Admin Full Access Delivery Charge Rules'
        ) THEN
          CREATE POLICY "Admin Full Access Delivery Charge Rules" ON public.delivery_charge_rules FOR ALL USING (true);
        END IF;
      END
      $$;
    `);

    // 4. Seed default rules if table is empty
    const { rows } = await client.query('SELECT count(*) FROM public.delivery_charge_rules');
    if (parseInt(rows[0].count) === 0) {
      await client.query(`
        INSERT INTO public.delivery_charge_rules (min_order_value, max_order_value, delivery_charge, is_free_delivery, is_active)
        VALUES
          (0.00, 799.00, 40.00, false, true),
          (800.00, 1499.00, 20.00, false, true),
          (1500.00, NULL, 0.00, true, true);
      `);
      console.log('Seeded initial delivery charge rules (₹0-799 -> ₹40, ₹800-1499 -> ₹20, ₹1500+ -> FREE).');
    } else {
      console.log(`Found ${rows[0].count} existing rules in delivery_charge_rules.`);
    }

    console.log('--- delivery_charge_rules Setup Completed Successfully ---');
  } catch (err) {
    console.error('Migration error:', err.message);
  } finally {
    await client.end();
    process.exit(0);
  }
}

setupDeliveryChargeRulesTable();
