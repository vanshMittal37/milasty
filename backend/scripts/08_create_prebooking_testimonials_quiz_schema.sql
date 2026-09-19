-- ========================================================
-- 08_create_prebooking_testimonials_quiz_schema.sql
-- MILASTY — Pre-Bookings, Enhanced Testimonials & Recommendation Quiz Schema
-- ========================================================

-- 1. Ensure lab_report_url column on products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS lab_report_url TEXT DEFAULT '';

-- 2. Create prebook_products Table
CREATE TABLE IF NOT EXISTS public.prebook_products (
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
);

CREATE INDEX IF NOT EXISTS idx_prebook_products_product_id ON public.prebook_products(product_id);
CREATE INDEX IF NOT EXISTS idx_prebook_products_enabled ON public.prebook_products(enabled);
CREATE INDEX IF NOT EXISTS idx_prebook_products_launch_date ON public.prebook_products(launch_date);

-- 3. Enhance testimonials Table
ALTER TABLE public.testimonials ADD COLUMN IF NOT EXISTS show_on_home BOOLEAN DEFAULT true;
ALTER TABLE public.testimonials ADD COLUMN IF NOT EXISTS show_on_shop BOOLEAN DEFAULT true;
ALTER TABLE public.testimonials ADD COLUMN IF NOT EXISTS product_id TEXT REFERENCES public.products(id) ON DELETE SET NULL;
ALTER TABLE public.testimonials ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT true;

-- 4. Create recommendation_questions Table
CREATE TABLE IF NOT EXISTS public.recommendation_questions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  question_text TEXT NOT NULL,
  subtitle TEXT DEFAULT '',
  active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create recommendation_options Table
CREATE TABLE IF NOT EXISTS public.recommendation_options (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  question_id TEXT NOT NULL REFERENCES public.recommendation_questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  description TEXT DEFAULT '',
  active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rec_options_question_id ON public.recommendation_options(question_id);

-- 6. Create recommendation_option_products Table (Junction Table)
CREATE TABLE IF NOT EXISTS public.recommendation_option_products (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  option_id TEXT NOT NULL REFERENCES public.recommendation_options(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  display_order INTEGER DEFAULT 0,
  CONSTRAINT unique_option_product UNIQUE (option_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_rec_option_products_option_id ON public.recommendation_option_products(option_id);
CREATE INDEX IF NOT EXISTS idx_rec_option_products_product_id ON public.recommendation_option_products(product_id);

-- 7. Disable RLS or set public access for new tables so frontend API can read
ALTER TABLE public.prebook_products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendation_questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendation_options DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendation_option_products DISABLE ROW LEVEL SECURITY;
