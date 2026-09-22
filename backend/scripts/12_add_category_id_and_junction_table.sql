-- =============================================
-- 12_add_category_id_and_junction_table.sql
-- MILASTY — Complete Category-Product Relationship Fix
-- Run this ONCE in Supabase SQL Editor
-- NOTE: products.id and categories.id are UUID type in Supabase
-- =============================================

-- 1. Add category_id column to products table if not exists (UUID to match categories.id)
ALTER TABLE public.products 
  ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL;

-- 2. Add index on category_id for performance
CREATE INDEX IF NOT EXISTS idx_products_category_id 
  ON public.products(category_id);

-- 3. Create category_products Many-to-Many junction table
--    Both FK columns must be UUID to match their referenced primary keys
CREATE TABLE IF NOT EXISTS public.category_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_cat_prod UNIQUE (category_id, product_id)
);

-- 4. Add indexes on junction table
CREATE INDEX IF NOT EXISTS idx_category_products_category_id 
  ON public.category_products(category_id);

CREATE INDEX IF NOT EXISTS idx_category_products_product_id 
  ON public.category_products(product_id);

-- 5. Disable RLS for backend API access (service key used)
ALTER TABLE public.category_products DISABLE ROW LEVEL SECURITY;

-- 6. Add is_active column to categories if missing
ALTER TABLE public.categories 
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 7. Add product_images table if not exists
CREATE TABLE IF NOT EXISTS public.product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  public_id TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  alt_text TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_images_product_id 
  ON public.product_images(product_id);

ALTER TABLE public.product_images DISABLE ROW LEVEL SECURITY;

-- 8. DATA MIGRATION: Set products.category_id from categories table
-- Resolves existing products that store category slug in "category" column
DO $$
DECLARE
  c RECORD;
  p RECORD;
BEGIN
  FOR c IN SELECT id, slug, name FROM public.categories LOOP
    FOR p IN SELECT id, category, category_id FROM public.products LOOP
      -- Already correct UUID match — just sync junction table
      IF (p.category_id = c.id) THEN
        INSERT INTO public.category_products (category_id, product_id)
        VALUES (c.id, p.id)
        ON CONFLICT (category_id, product_id) DO NOTHING;
      -- Match by category slug or name text and category_id not yet set
      ELSIF (p.category_id IS NULL) AND (
        LOWER(TRIM(p.category)) = LOWER(TRIM(c.slug)) OR
        LOWER(TRIM(p.category)) = LOWER(TRIM(c.name)) OR
        (LOWER(TRIM(p.category)) IN ('gifts', 'gifting') AND LOWER(TRIM(c.slug)) = 'gifting')
      ) THEN
        -- Update category_id on the product record
        UPDATE public.products
        SET category_id = c.id,
            category = c.slug
        WHERE id = p.id;
        
        -- Insert junction table row
        INSERT INTO public.category_products (category_id, product_id)
        VALUES (c.id, p.id)
        ON CONFLICT (category_id, product_id) DO NOTHING;
      END IF;
    END LOOP;
  END LOOP;
END $$;

-- 9. Seed product_images from existing products if not already seeded
DO $$
DECLARE
  p RECORD;
BEGIN
  FOR p IN SELECT id, image_url, secondary_image_url FROM public.products 
           WHERE image_url IS NOT NULL AND image_url != '' LOOP
    IF NOT EXISTS (SELECT 1 FROM public.product_images WHERE product_id = p.id) THEN
      INSERT INTO public.product_images (product_id, image_url, sort_order, is_primary)
      VALUES (p.id, p.image_url, 0, true);
      
      IF p.secondary_image_url IS NOT NULL AND p.secondary_image_url != '' 
         AND p.secondary_image_url != p.image_url THEN
        INSERT INTO public.product_images (product_id, image_url, sort_order, is_primary)
        VALUES (p.id, p.secondary_image_url, 1, false);
      END IF;
    END IF;
  END LOOP;
END $$;

-- 10. Verify results — run this to confirm everything worked
SELECT 
  c.name AS category_name,
  c.slug AS category_slug,
  c.id AS category_id,
  COUNT(DISTINCT cp.product_id) AS product_count_junction,
  COUNT(DISTINCT p.id) AS product_count_direct
FROM public.categories c
LEFT JOIN public.category_products cp ON cp.category_id = c.id
LEFT JOIN public.products p ON p.category_id = c.id
GROUP BY c.id, c.name, c.slug
ORDER BY c.created_at;

