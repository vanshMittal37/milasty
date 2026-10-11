-- ════════════════════════════════════════════════════════════════════════════
-- 22. Tables for Pre-Bookings, the Shop recommendation quiz and the Home "Find Your Perfect
--     MILASTY Snack" (Product Discovery) section.
--
-- Migration 08 declared `product_id TEXT REFERENCES products(id)` while products.id is UUID, so
-- Postgres rejected the whole script and these tables were never created. The backend then kept
-- everything in server memory / a temp file — edits and deletes were lost on every deploy, and
-- built-in seed items kept coming back. Product Discovery tables were never defined at all.
--
-- Additive and safe to re-run. Product ids are stored as text (products.id::text) with no FK, so
-- this works on every database state. Run once in the Supabase SQL editor.
-- ════════════════════════════════════════════════════════════════════════════

-- ── Pre-bookings ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.prebook_products (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text
);
ALTER TABLE public.prebook_products ADD COLUMN IF NOT EXISTS product_id TEXT;
ALTER TABLE public.prebook_products ADD COLUMN IF NOT EXISTS enabled BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.prebook_products ADD COLUMN IF NOT EXISTS preorder_enabled BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.prebook_products ADD COLUMN IF NOT EXISTS launch_date TIMESTAMPTZ;
ALTER TABLE public.prebook_products ADD COLUMN IF NOT EXISTS preorder_start_date TIMESTAMPTZ;
ALTER TABLE public.prebook_products ADD COLUMN IF NOT EXISTS preorder_end_date TIMESTAMPTZ;
ALTER TABLE public.prebook_products ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
ALTER TABLE public.prebook_products ADD COLUMN IF NOT EXISTS custom_heading TEXT DEFAULT '';
ALTER TABLE public.prebook_products ADD COLUMN IF NOT EXISTS custom_description TEXT DEFAULT '';
ALTER TABLE public.prebook_products ADD COLUMN IF NOT EXISTS title TEXT DEFAULT '';
ALTER TABLE public.prebook_products ADD COLUMN IF NOT EXISTS price NUMERIC DEFAULT 0;
ALTER TABLE public.prebook_products ADD COLUMN IF NOT EXISTS original_price NUMERIC DEFAULT 0;
ALTER TABLE public.prebook_products ADD COLUMN IF NOT EXISTS category TEXT DEFAULT '';
ALTER TABLE public.prebook_products ADD COLUMN IF NOT EXISTS product_image TEXT DEFAULT '';
ALTER TABLE public.prebook_products ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.prebook_products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
CREATE INDEX IF NOT EXISTS idx_prebook_products_enabled ON public.prebook_products(enabled);

-- ── Shop recommendation quiz ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.recommendation_questions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  question_text TEXT NOT NULL,
  subtitle TEXT DEFAULT '',
  active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.recommendation_options (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  question_id TEXT NOT NULL REFERENCES public.recommendation_questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  description TEXT DEFAULT '',
  active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.recommendation_option_products (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  option_id TEXT NOT NULL REFERENCES public.recommendation_options(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  CONSTRAINT unique_option_product UNIQUE (option_id, product_id)
);
CREATE INDEX IF NOT EXISTS idx_rec_options_question_id ON public.recommendation_options(question_id);
CREATE INDEX IF NOT EXISTS idx_rec_option_products_option_id ON public.recommendation_option_products(option_id);

-- ── Home "Find Your Perfect MILASTY Snack" (Product Discovery) ────────────
CREATE TABLE IF NOT EXISTS public.product_discovery_sections (
  id TEXT PRIMARY KEY DEFAULT 'section_main',
  is_active BOOLEAN NOT NULL DEFAULT true,
  eyebrow TEXT DEFAULT '',
  title TEXT DEFAULT '',
  description TEXT DEFAULT '',
  explore_button_text TEXT DEFAULT '',
  explore_button_url TEXT DEFAULT '/shop',
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.product_discovery_moods (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.product_discovery_mood_products (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  mood_id TEXT NOT NULL REFERENCES public.product_discovery_moods(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  CONSTRAINT unique_mood_product UNIQUE (mood_id, product_id)
);
CREATE INDEX IF NOT EXISTS idx_discovery_mood_products_mood ON public.product_discovery_mood_products(mood_id);

-- Backend-only access (the API uses the service-role key)
ALTER TABLE public.prebook_products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendation_questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendation_options DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendation_option_products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_discovery_sections DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_discovery_moods DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_discovery_mood_products DISABLE ROW LEVEL SECURITY;

-- ── One-time defaults (only when empty) so the storefront looks the same as before ──
INSERT INTO public.product_discovery_sections (id, is_active, eyebrow, title, description, explore_button_text, explore_button_url)
SELECT 'section_main', true, 'NOT SURE WHERE TO START?', 'Find Your Perfect MILASTY Snack',
       'Something light. Something crunchy. Something chocolatey. Or something to share.', 'EXPLORE ALL SNACKS →', '/shop'
WHERE NOT EXISTS (SELECT 1 FROM public.product_discovery_sections);

DO $$
DECLARE
  m RECORD;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.product_discovery_moods) THEN
    INSERT INTO public.product_discovery_moods (id, name, description, display_order) VALUES
      ('mood_classic',   'I LOVE CLASSIC',                   'For familiar flavours with a millet twist.',            1),
      ('mood_chocolate', 'I CRAVE CHOCOLATE',                'For those moments when chocolate is non-negotiable.',   2),
      ('mood_crunchy',   'I WANT SOMETHING CRUNCHY',         'For chai-time, desk-time and anytime snacking.',        3),
      ('mood_family',    'I''M SHOPPING FOR THE FAMILY',      'A little something for everyone at home.',              4),
      ('mood_gifting',   'I''M SHOPPING FOR SOMEONE SPECIAL', 'Thoughtful millet-based gifting for every occasion.',   5);

    -- Same title/category matching the old in-memory defaults used
    FOR m IN SELECT id FROM public.product_discovery_moods LOOP
      INSERT INTO public.product_discovery_mood_products (mood_id, product_id, display_order)
      SELECT m.id, p.id::text, row_number() OVER (ORDER BY p.title)
        FROM public.products p
       WHERE (m.id = 'mood_classic'   AND (p.title ILIKE '%cardamom%' OR p.title ILIKE '%bajra%' OR p.title ILIKE '%jowar%'))
          OR (m.id = 'mood_chocolate' AND (p.title ILIKE '%choco%' OR p.title ILIKE '%ragi%' OR p.title ILIKE '%brownie%' OR p.title ILIKE '%cocoa%'))
          OR (m.id = 'mood_crunchy'   AND (p.title ILIKE '%cracker%' OR p.title ILIKE '%crunch%' OR p.title ILIKE '%masala%'))
          OR (m.id = 'mood_family'    AND (p.title ILIKE '%trio%' OR p.title ILIKE '%box%' OR p.category = 'starter'))
          OR (m.id = 'mood_gifting'   AND (p.title ILIKE '%ritual%' OR p.title ILIKE '%wedding%' OR p.title ILIKE '%celebration%' OR p.title ILIKE '%hamper%' OR p.category = 'gifts'))
      ON CONFLICT (mood_id, product_id) DO NOTHING;
    END LOOP;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.recommendation_questions) THEN
    INSERT INTO public.recommendation_questions (id, question_text, subtitle, display_order)
    VALUES ('q_default', 'What are you looking for?', 'Select an option to discover custom recommended MILASTY bakes.', 1);
    INSERT INTO public.recommendation_options (id, question_id, option_text, description, display_order) VALUES
      ('opt_chai',    'q_default', 'Everyday Chai Snacking', 'Wholesome, low-GI crunchy cookies perfect for tea time.', 1),
      ('opt_gifting', 'q_default', 'Something for Gifting',  'Artisan hampers and bestseller boxes for family & celebrations.', 2),
      ('opt_evening', 'q_default', 'A Light Evening Snack',  'Digestive & nutrient-dense millet bakes without refined flour.', 3);
    INSERT INTO public.recommendation_option_products (option_id, product_id, display_order)
    SELECT o.option_id, p.id::text, row_number() OVER (PARTITION BY o.option_id ORDER BY p.title)
      FROM (VALUES ('opt_chai'), ('opt_gifting'), ('opt_evening')) AS o(option_id)
      JOIN public.products p ON
           (o.option_id = 'opt_chai'    AND (p.title ILIKE '%jowar%' OR p.title ILIKE '%bajra%'))
        OR (o.option_id = 'opt_gifting' AND (p.title ILIKE '%trio%' OR p.title ILIKE '%hamper%' OR p.title ILIKE '%ritual%'))
        OR (o.option_id = 'opt_evening' AND (p.title ILIKE '%ragi%' OR p.title ILIKE '%jowar%'))
    ON CONFLICT (option_id, product_id) DO NOTHING;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
