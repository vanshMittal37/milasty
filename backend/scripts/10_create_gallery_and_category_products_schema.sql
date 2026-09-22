-- ========================================================
-- 10_create_gallery_and_category_products_schema.sql
-- MILASTY — Product Multi-Image Gallery & Category Products Relationship
-- ========================================================

-- 1. Create product_images Table
CREATE TABLE IF NOT EXISTS public.product_images (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  public_id TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  alt_text TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON public.product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_is_primary ON public.product_images(is_primary);

-- Disable RLS for backend / API access
ALTER TABLE public.product_images DISABLE ROW LEVEL SECURITY;

-- 2. Create category_products Table (Many-to-Many Relationship)
CREATE TABLE IF NOT EXISTS public.category_products (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  category_id TEXT NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(category_id, product_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_category_products_category_id ON public.category_products(category_id);
CREATE INDEX IF NOT EXISTS idx_category_products_product_id ON public.category_products(product_id);

-- Disable RLS for backend / API access
ALTER TABLE public.category_products DISABLE ROW LEVEL SECURITY;

-- 3. Migration: Seed product_images from existing products if not present
DO $$
DECLARE
  p RECORD;
BEGIN
  FOR p IN SELECT id, image_url, secondary_image_url FROM public.products WHERE image_url IS NOT NULL AND image_url != '' LOOP
    IF NOT EXISTS (SELECT 1 FROM public.product_images WHERE product_id = p.id) THEN
      -- Insert Primary Image
      INSERT INTO public.product_images (product_id, image_url, sort_order, is_primary)
      VALUES (p.id, p.image_url, 0, true);
      
      -- Insert Secondary Image if available and different
      IF p.secondary_image_url IS NOT NULL AND p.secondary_image_url != '' AND p.secondary_image_url != p.image_url THEN
        INSERT INTO public.product_images (product_id, image_url, sort_order, is_primary)
        VALUES (p.id, p.secondary_image_url, 1, false);
      END IF;
    END IF;
  END LOOP;
END $$;

-- 4. Migration: Seed category_products from existing category fields if not present
DO $$
DECLARE
  c RECORD;
  p RECORD;
BEGIN
  FOR c IN SELECT id, slug, name FROM public.categories LOOP
    FOR p IN SELECT id, category, category_id FROM public.products LOOP
      IF (p.category_id = c.id) OR (LOWER(TRIM(p.category)) = LOWER(TRIM(c.slug))) OR (LOWER(TRIM(p.category)) = LOWER(TRIM(c.name))) THEN
        INSERT INTO public.category_products (category_id, product_id)
        VALUES (c.id, p.id)
        ON CONFLICT (category_id, product_id) DO NOTHING;
      END IF;
    END LOOP;
  END LOOP;
END $$;
