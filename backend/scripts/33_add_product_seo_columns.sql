-- ============================================================================
-- 33_add_product_seo_columns.sql
-- MILASTY Admin Product SEO & Search Engine Optimization Columns
--
-- Adds dedicated SEO columns to the public.products table for granular
-- product-level search engine configuration, keywords, and custom URLs.
-- Safe to execute multiple times (IF NOT EXISTS).
-- ============================================================================

-- 1. Dedicated Product SEO Columns
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS meta_title TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS meta_description TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS focus_keyword TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS secondary_keywords JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS seo_slug TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS seo_metadata JSONB DEFAULT '{}'::jsonb;

-- 2. Create index on seo_slug for fast search & URL resolution
CREATE INDEX IF NOT EXISTS products_seo_slug_idx ON public.products (seo_slug);

-- 3. Backfill seo_slug with existing slug if empty
UPDATE public.products
SET seo_slug = slug
WHERE (seo_slug IS NULL OR seo_slug = '') AND slug IS NOT NULL;

-- 4. Invalidate PostgREST schema cache to recognize new columns immediately
NOTIFY pgrst, 'reload schema';

