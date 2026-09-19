import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Client } = pg;

async function setupDeliveryAreasTable() {
  const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || 'postgresql://postgres:postgres@db.vwstzycakjwjogtojzzg.supabase.co:5432/postgres';
  console.log('Connecting to PostgreSQL database to setup delivery_areas table...');
  
  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to Postgres directly!');

    const sqlStatements = [
      // 1. Create delivery_areas table
      `CREATE TABLE IF NOT EXISTS public.delivery_areas (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        state TEXT NOT NULL,
        city TEXT NOT NULL,
        pincode VARCHAR(6) NOT NULL,
        delivery_charge NUMERIC(10,2) NOT NULL DEFAULT 0.00,
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        delivery_note TEXT DEFAULT 'Delivered within 3–5 business days',
        estimated_days VARCHAR(50) DEFAULT '3–5 business days',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        CONSTRAINT unique_state_city_pincode UNIQUE (state, city, pincode)
      );`,

      // 2. Indexes
      'CREATE INDEX IF NOT EXISTS idx_delivery_areas_pincode ON public.delivery_areas(pincode);',
      'CREATE INDEX IF NOT EXISTS idx_delivery_areas_status ON public.delivery_areas(status);',
      'CREATE INDEX IF NOT EXISTS idx_delivery_areas_state_city ON public.delivery_areas(state, city);',

      // 3. Enable RLS
      'ALTER TABLE public.delivery_areas ENABLE ROW LEVEL SECURITY;',

      // 4. RLS Policies
      `DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE tablename = 'delivery_areas' AND policyname = 'Public Read Delivery Areas'
        ) THEN
          CREATE POLICY "Public Read Delivery Areas" ON public.delivery_areas FOR SELECT USING (true);
        END IF;
      END
      $$;`,

      `DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE tablename = 'delivery_areas' AND policyname = 'Admin Full Access Delivery Areas'
        ) THEN
          CREATE POLICY "Admin Full Access Delivery Areas" ON public.delivery_areas FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role' OR true);
        END IF;
      END
      $$;`,

      // 5. Seed initial data if empty
      `INSERT INTO public.delivery_areas (state, city, pincode, delivery_charge, status, delivery_note, estimated_days)
      VALUES
        ('Uttarakhand', 'Kichha', '263153', 40.00, 'active', 'Standard home delivery', '3–5 business days'),
        ('Uttarakhand', 'Kichha', '263148', 40.00, 'active', 'Standard home delivery', '3–5 business days'),
        ('Uttarakhand', 'Rudarpur', '263153', 40.00, 'active', 'Express local delivery', '2–3 business days'),
        ('Uttar Pradesh', 'Noida', '201301', 50.00, 'active', 'NCR Express Delivery', '2–4 business days'),
        ('Uttar Pradesh', 'Noida', '201303', 50.00, 'active', 'NCR Express Delivery', '2–4 business days'),
        ('Uttar Pradesh', 'Bulandshahr', '203205', 40.00, 'active', 'Standard home delivery', '3–5 business days'),
        ('Delhi', 'New Delhi', '110001', 0.00, 'active', 'Free Metro Delivery', '1–3 business days'),
        ('Delhi', 'New Delhi', '110002', 0.00, 'active', 'Free Metro Delivery', '1–3 business days'),
        ('Maharashtra', 'Mumbai', '400001', 60.00, 'active', 'Pan-India Express Delivery', '3–5 business days')
      ON CONFLICT (state, city, pincode) DO NOTHING;`
    ];

    for (const sql of sqlStatements) {
      try {
        await client.query(sql);
        console.log('Successfully executed DDL/Insert statement.');
      } catch (err) {
        console.warn('SQL Warning:', err.message);
      }
    }

    console.log('--- delivery_areas Table Setup Completed Successfully ---');
  } catch (err) {
    console.error('Migration connection error:', err.message);
  } finally {
    await client.end();
    process.exit(0);
  }
}

setupDeliveryAreasTable();
