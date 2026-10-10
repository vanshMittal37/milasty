-- ════════════════════════════════════════════════════════════════════════════
-- 20. Columns the reviews / testimonials code writes but the original schema (06) lacked.
--
-- Without these, every testimonial insert failed in Supabase and the backend silently kept the
-- testimonial only on Railway's disk — so it vanished on the next deploy.
-- Additive only, safe to re-run. Run once in the Supabase SQL editor.
-- ════════════════════════════════════════════════════════════════════════════

-- Testimonials (homepage / shop)
CREATE TABLE IF NOT EXISTS public.testimonials (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  content TEXT NOT NULL
);
ALTER TABLE public.testimonials ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'Valued Customer';
ALTER TABLE public.testimonials ADD COLUMN IF NOT EXISTS rating INTEGER NOT NULL DEFAULT 5;
ALTER TABLE public.testimonials ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT '';
ALTER TABLE public.testimonials ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.testimonials ADD COLUMN IF NOT EXISTS show_on_home BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.testimonials ADD COLUMN IF NOT EXISTS show_on_shop BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.testimonials ADD COLUMN IF NOT EXISTS product_id TEXT;
ALTER TABLE public.testimonials ADD COLUMN IF NOT EXISTS verified BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.testimonials ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
ALTER TABLE public.testimonials ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.testimonials ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Product reviews
CREATE TABLE IF NOT EXISTS public.product_reviews (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  product_id TEXT NOT NULL,
  rating INTEGER NOT NULL DEFAULT 5
);
ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS product_title TEXT DEFAULT '';
ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS product_image TEXT DEFAULT '';
ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS user_id TEXT DEFAULT '';
ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS order_id TEXT DEFAULT '';
ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS order_item_id TEXT DEFAULT '';
ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS reviewer_name TEXT NOT NULL DEFAULT 'Customer';
ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS email TEXT DEFAULT '';
ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS comment TEXT DEFAULT '';
ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS review_image_url TEXT DEFAULT '';
ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS review_source VARCHAR(20) NOT NULL DEFAULT 'customer';
ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'pending';
ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS show_on_product BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS is_verified_purchase BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

NOTIFY pgrst, 'reload schema';
