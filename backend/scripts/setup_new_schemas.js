import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const { Client } = pg;

export async function setupNewSchemas() {
  const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!dbUrl) {
    console.warn('⚠️ No DATABASE_URL/POSTGRES_URL present. Skipping direct postgres DDL migration script.');
    return;
  }
  
  console.log('Connecting to PostgreSQL database to setup prebookings, testimonials & quiz tables...');
  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to Postgres directly!');

    const sqlStatements = [
      `ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category_id TEXT REFERENCES public.categories(id);`,
      `CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);`,
      `ALTER TABLE public.products ADD COLUMN IF NOT EXISTS lab_report_url TEXT DEFAULT '';`,

      `CREATE TABLE IF NOT EXISTS public.prebook_products (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
        enabled BOOLEAN NOT NULL DEFAULT true,
        preorder_enabled BOOLEAN NOT NULL DEFAULT true,
        launch_date TIMESTAMPTZ NOT NULL,
        preorder_start_date TIMESTAMPTZ,
        preorder_end_date TIMESTAMPTZ,
        display_order INTEGER DEFAULT 0,
        custom_heading TEXT DEFAULT '',
        custom_description TEXT DEFAULT '',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );`,

      `CREATE INDEX IF NOT EXISTS idx_prebook_products_product_id ON public.prebook_products(product_id);`,
      `CREATE INDEX IF NOT EXISTS idx_prebook_products_enabled ON public.prebook_products(enabled);`,
      `CREATE INDEX IF NOT EXISTS idx_prebook_products_launch_date ON public.prebook_products(launch_date);`,

      `ALTER TABLE public.testimonials ADD COLUMN IF NOT EXISTS show_on_home BOOLEAN DEFAULT true;`,
      `ALTER TABLE public.testimonials ADD COLUMN IF NOT EXISTS show_on_shop BOOLEAN DEFAULT true;`,
      `ALTER TABLE public.testimonials ADD COLUMN IF NOT EXISTS product_id TEXT REFERENCES public.products(id) ON DELETE SET NULL;`,
      `ALTER TABLE public.testimonials ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT true;`,

      `CREATE TABLE IF NOT EXISTS public.recommendation_questions (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        question_text TEXT NOT NULL,
        subtitle TEXT DEFAULT '',
        active BOOLEAN NOT NULL DEFAULT true,
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );`,

      `CREATE TABLE IF NOT EXISTS public.recommendation_options (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        question_id TEXT NOT NULL REFERENCES public.recommendation_questions(id) ON DELETE CASCADE,
        option_text TEXT NOT NULL,
        description TEXT DEFAULT '',
        active BOOLEAN NOT NULL DEFAULT true,
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );`,

      `CREATE INDEX IF NOT EXISTS idx_rec_options_question_id ON public.recommendation_options(question_id);`,

      `CREATE TABLE IF NOT EXISTS public.recommendation_option_products (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        option_id TEXT NOT NULL REFERENCES public.recommendation_options(id) ON DELETE CASCADE,
        product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
        display_order INTEGER DEFAULT 0,
        CONSTRAINT unique_option_product UNIQUE (option_id, product_id)
      );`,

      `CREATE INDEX IF NOT EXISTS idx_rec_option_products_option_id ON public.recommendation_option_products(option_id);`,
      `CREATE INDEX IF NOT EXISTS idx_rec_option_products_product_id ON public.recommendation_option_products(product_id);`,

      `ALTER TABLE public.prebook_products DISABLE ROW LEVEL SECURITY;`,
      `ALTER TABLE public.recommendation_questions DISABLE ROW LEVEL SECURITY;`,
      `ALTER TABLE public.recommendation_options DISABLE ROW LEVEL SECURITY;`,
      `ALTER TABLE public.recommendation_option_products DISABLE ROW LEVEL SECURITY;`,

      `CREATE TABLE IF NOT EXISTS public.product_images (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
        image_url TEXT NOT NULL,
        public_id TEXT DEFAULT '',
        sort_order INTEGER DEFAULT 0,
        is_primary BOOLEAN DEFAULT false,
        alt_text TEXT DEFAULT '',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );`,
      `CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON public.product_images(product_id);`,
      `CREATE INDEX IF NOT EXISTS idx_product_images_is_primary ON public.product_images(is_primary);`,
      `ALTER TABLE public.product_images DISABLE ROW LEVEL SECURITY;`,

      `CREATE TABLE IF NOT EXISTS public.category_products (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        category_id TEXT NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
        product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        CONSTRAINT unique_cat_prod UNIQUE (category_id, product_id)
      );`,
      `CREATE INDEX IF NOT EXISTS idx_category_products_category_id ON public.category_products(category_id);`,
      `CREATE INDEX IF NOT EXISTS idx_category_products_product_id ON public.category_products(product_id);`,
      `ALTER TABLE public.category_products DISABLE ROW LEVEL SECURITY;`
    ];

    for (const sql of sqlStatements) {
      try {
        await client.query(sql);
      } catch (err) {
        console.warn('SQL execution notice:', err.message);
      }
    }

    console.log('--- New schemas setup completed successfully ---');
  } catch (err) {
    console.error('Migration connection error:', err.message);
  } finally {
    await client.end();
  }
}

if (process.argv[1]?.includes('setup_new_schemas.js')) {
  setupNewSchemas().then(() => process.exit(0));
}
