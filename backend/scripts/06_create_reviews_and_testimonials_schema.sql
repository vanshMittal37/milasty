-- ========================================================
-- 06_create_reviews_and_testimonials_schema.sql
-- MILASTY — Product Reviews, Customer Feedback & Testimonials Schema
-- ========================================================

-- 1. Create product_reviews Table
CREATE TABLE IF NOT EXISTS public.product_reviews (
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
  review_source VARCHAR(20) NOT NULL DEFAULT 'customer', -- 'customer' | 'admin'
  status VARCHAR(20) NOT NULL DEFAULT 'pending',         -- 'pending' | 'approved' | 'rejected'
  is_published BOOLEAN NOT NULL DEFAULT true,
  show_on_product BOOLEAN NOT NULL DEFAULT true,
  is_verified_purchase BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Partial Unique Index: Ensures 1 customer review per user per product
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_user_product_review 
ON public.product_reviews(user_id, product_id) 
WHERE (review_source = 'customer' AND user_id IS NOT NULL AND user_id != '');

-- Indexes for fast querying
CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON public.product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_user_id ON public.product_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_status ON public.product_reviews(status);
CREATE INDEX IF NOT EXISTS idx_product_reviews_is_published ON public.product_reviews(is_published);

-- 2. Create testimonials Table (Homepage Brand Testimonials)
CREATE TABLE IF NOT EXISTS public.testimonials (
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
);

CREATE INDEX IF NOT EXISTS idx_testimonials_is_published ON public.testimonials(is_published);

-- 3. Enable RLS
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies (Idempotent: Drop existing policy before recreating)

-- Policies for public.product_reviews
DROP POLICY IF EXISTS "Public Read Approved Published Product Reviews" ON public.product_reviews;
CREATE POLICY "Public Read Approved Published Product Reviews" 
ON public.product_reviews FOR SELECT 
USING (status = 'approved' AND is_published = true AND show_on_product = true);

DROP POLICY IF EXISTS "Admin Full Access Product Reviews" ON public.product_reviews;
CREATE POLICY "Admin Full Access Product Reviews" 
ON public.product_reviews FOR ALL 
USING (auth.role() = 'authenticated' OR auth.role() = 'service_role' OR true);

-- Policies for public.testimonials
DROP POLICY IF EXISTS "Public Read Testimonials" ON public.testimonials;
CREATE POLICY "Public Read Testimonials" 
ON public.testimonials FOR SELECT 
USING (is_published = true);

DROP POLICY IF EXISTS "Admin Full Access Testimonials" ON public.testimonials;
CREATE POLICY "Admin Full Access Testimonials" 
ON public.testimonials FOR ALL 
USING (auth.role() = 'authenticated' OR auth.role() = 'service_role' OR true);
