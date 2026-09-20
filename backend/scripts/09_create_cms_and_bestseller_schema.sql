-- ========================================================
-- 09_create_cms_and_bestseller_schema.sql
-- MILASTY — Bestseller Flag, Snack Finder & Honest Ingredients CMS
-- ========================================================

-- 1. Ensure is_bestseller column exists in products table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'is_bestseller'
  ) THEN
    ALTER TABLE public.products ADD COLUMN is_bestseller BOOLEAN DEFAULT false;
  END IF;
END $$;

-- 2. Create snack_finder_questions Table
CREATE TABLE IF NOT EXISTS public.snack_finder_questions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create snack_finder_options Table
CREATE TABLE IF NOT EXISTS public.snack_finder_options (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  question_id TEXT NOT NULL REFERENCES public.snack_finder_questions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create snack_finder_option_products Table (Many-to-Many Relationship)
CREATE TABLE IF NOT EXISTS public.snack_finder_option_products (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  option_id TEXT NOT NULL REFERENCES public.snack_finder_options(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(option_id, product_id)
);

-- 5. Create honest_ingredients Table
CREATE TABLE IF NOT EXISTS public.honest_ingredients (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  subtitle TEXT DEFAULT '',
  description TEXT NOT NULL,
  image_url TEXT NOT NULL DEFAULT '',
  active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Disable Row Level Security for seamless API access
ALTER TABLE public.snack_finder_questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.snack_finder_options DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.snack_finder_option_products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.honest_ingredients DISABLE ROW LEVEL SECURITY;
