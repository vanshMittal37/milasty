-- ============================================================================
-- 32_shipment_pickup_and_shipping_slip.sql
-- MILASTY Post-Shipment Fulfillment: Pickup Management & Shipping Slip Storage
--
-- Adds dedicated columns to public.orders for tracking courier pickup requests,
-- pickup confirmation references, and official Shiprath shipping slips.
-- Safe to run multiple times (idempotent IF NOT EXISTS).
-- ============================================================================

-- 1. Pickup Management Columns
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS pickup_status TEXT DEFAULT 'not_created';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS pickup_request_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS pickup_scheduled_date TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS pickup_confirmation_ref TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS pickup_error TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS pickup_created_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS pickup_response JSONB;

-- 2. Official Shipping Slip / Label Columns
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_label_url TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_label_status TEXT DEFAULT 'not_generated';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_label_error TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_label_generated_at TIMESTAMPTZ;

-- 3. Invalidate PostgREST schema cache to recognize new columns immediately
NOTIFY pgrst, 'reload schema';

