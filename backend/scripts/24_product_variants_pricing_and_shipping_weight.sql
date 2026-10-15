-- ════════════════════════════════════════════════════════════════════════════
-- 24. Product Variants Pricing, Discounts & Shipping Weights Migration
-- MILASTY — Product Variants, Discount Pricing & Shipping Weight Update
-- Safe, additive migration. Preserves all existing products, variants, and orders.
-- ════════════════════════════════════════════════════════════════════════════

-- 1. Add shipping_weight to products table (for products without variants)
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS shipping_weight NUMERIC(10, 2) DEFAULT NULL;

-- 2. Add pricing, discount, and shipping weight columns to product_variants table
ALTER TABLE public.product_variants
  ADD COLUMN IF NOT EXISTS original_price NUMERIC(10, 2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS discount_type TEXT DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS discount_value NUMERIC(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS shipping_weight NUMERIC(10, 2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS sku TEXT DEFAULT NULL;

-- 3. Add shipping_weight to order_items for audit and historical shipping accuracy
ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS shipping_weight NUMERIC(10, 2) DEFAULT NULL;

-- 4. Backfill existing product_variants original_price if null
UPDATE public.product_variants
SET original_price = price
WHERE original_price IS NULL AND price IS NOT NULL;
