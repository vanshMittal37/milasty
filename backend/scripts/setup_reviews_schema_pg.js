import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Client } = pg;

export async function setupReviewsAndTestimonialsPg() {
  const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || 'postgresql://postgres:postgres@db.vwstzycakjwjogtojzzg.supabase.co:5432/postgres';
  console.log('Connecting to PostgreSQL database to setup product_reviews & testimonials tables...');
  
  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to Postgres directly!');

    const sqlStatements = [
      // 1. Create product_reviews table
      `CREATE TABLE IF NOT EXISTS public.product_reviews (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        product_id TEXT NOT NULL,
        product_title TEXT DEFAULT '',
        product_image TEXT DEFAULT '',
        user_id TEXT DEFAULT '',
        order_id TEXT DEFAULT '',
        order_item_id TEXT DEFAULT '',
        reviewer_name TEXT NOT NULL DEFAULT 'Customer',
        email TEXT DEFAULT '',
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment TEXT DEFAULT '',
        review_image_url TEXT DEFAULT '',
        review_source VARCHAR(20) NOT NULL DEFAULT 'customer',
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        is_published BOOLEAN NOT NULL DEFAULT true,
        show_on_product BOOLEAN NOT NULL DEFAULT true,
        is_verified_purchase BOOLEAN NOT NULL DEFAULT true,
        is_featured BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );`,

      // Alter columns to ensure they exist if table existed
      `ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS product_title TEXT DEFAULT '';`,
      `ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS product_image TEXT DEFAULT '';`,
      `ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS user_id TEXT DEFAULT '';`,
      `ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS order_id TEXT DEFAULT '';`,
      `ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS order_item_id TEXT DEFAULT '';`,
      `ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS review_image_url TEXT DEFAULT '';`,
      `ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS review_source VARCHAR(20) DEFAULT 'customer';`,
      `ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending';`,
      `ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT true;`,
      `ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS show_on_product BOOLEAN DEFAULT true;`,
      `ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS is_verified_purchase BOOLEAN DEFAULT true;`,
      `ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;`,

      // Indexes
      `CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON public.product_reviews(product_id);`,
      `CREATE INDEX IF NOT EXISTS idx_product_reviews_user_id ON public.product_reviews(user_id);`,
      `CREATE INDEX IF NOT EXISTS idx_product_reviews_status ON public.product_reviews(status);`,

      // Disable RLS so backend queries & inserts are never blocked
      `ALTER TABLE public.product_reviews DISABLE ROW LEVEL SECURITY;`,

      // 2. Create testimonials table
      `CREATE TABLE IF NOT EXISTS public.testimonials (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        name TEXT NOT NULL,
        role TEXT DEFAULT 'Valued Customer',
        rating INTEGER NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
        content TEXT NOT NULL,
        image_url TEXT DEFAULT '',
        is_published BOOLEAN NOT NULL DEFAULT true,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );`,

      `ALTER TABLE public.testimonials DISABLE ROW LEVEL SECURITY;`,
    ];

    for (const sql of sqlStatements) {
      try {
        await client.query(sql);
      } catch (err) {
        console.warn('SQL Notice:', err.message);
      }
    }

    console.log('--- product_reviews and testimonials schema setup complete ---');
  } catch (err) {
    console.error('Migration connection error:', err.message);
  } finally {
    await client.end();
  }
}

if (process.argv[1]?.includes('setup_reviews_schema_pg.js')) {
  setupReviewsAndTestimonialsPg().then(() => process.exit(0));
}
