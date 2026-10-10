-- ════════════════════════════════════════════════════════════════════════════
-- 21. Admin-controlled product ordering + bestseller flag as the single source of truth
--
-- Additive and safe to re-run. No product, variant, price, image or order data is deleted.
-- Run once in the Supabase SQL editor, before deploying the matching backend.
-- ════════════════════════════════════════════════════════════════════════════

-- 1. Display Order: positive integer, lower shows first. NULL = not ordered (shown after ordered products).
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS display_order INTEGER;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_display_order_positive') THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_display_order_positive CHECK (display_order IS NULL OR display_order >= 1);
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_products_display_order ON public.products (display_order);

-- 2. Bestseller flag (already added by migration 09 on most databases)
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_bestseller BOOLEAN DEFAULT false;

-- Preserve today's homepage: until now a product with a "Bestseller"/"Best Seller" BADGE was also
-- shown in the Bestseller section even if the flag was off. Those products keep their place by
-- getting the flag. From now on only the admin "Bestseller Product" dropdown controls the section.
UPDATE public.products
   SET is_bestseller = true
 WHERE COALESCE(is_bestseller, false) = false
   AND badges::text ~* 'best\s*seller';

UPDATE public.products SET is_bestseller = false WHERE is_bestseller IS NULL;

NOTIFY pgrst, 'reload schema';
