-- ════════════════════════════════════════════════════════════════════════════
-- 27. Remove shipping weight from products.nutrition_facts
--
-- Shipping weight is courier-only data (products.shipping_weight / product_variants.shipping_weight).
-- Older admin saves also copied it into nutrition_facts, which the storefront lists under
-- "Nutritional Facts" — so customers saw e.g. "SHIPPING WEIGHT 100".
--
-- Only the copy inside nutrition_facts is removed. The shipping_weight columns used for delivery
-- charges are NOT touched. The backend also strips it on every read/write, so this is a data tidy-up.
-- Run once in the Supabase SQL editor. Safe to re-run.
-- ════════════════════════════════════════════════════════════════════════════

UPDATE public.products
   SET nutrition_facts = nutrition_facts - 'shipping_weight' - 'shippingWeight'
 WHERE nutrition_facts ?| ARRAY['shipping_weight', 'shippingWeight'];

NOTIFY pgrst, 'reload schema';
