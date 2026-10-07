-- Automatic shipping: stored quote, fallback list, booking audit trail and tracking.
-- Safe to run more than once. The backend works without these columns (they are written
-- best-effort), but automatic fallback and the admin audit trail need them.

-- Payment references
ALTER TABLE orders ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT;

-- Structured delivery address parts (used for the Shiprath consignee city/state)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_city TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_state TEXT;

-- Checkout quote: the exact selected rate + every valid option from the SAME rate response
ALTER TABLE orders ADD COLUMN IF NOT EXISTS selected_rate_snapshot JSONB;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_rate_options JSONB;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS quoted_weight_kg NUMERIC;

-- What was actually booked (differs from selected_* only when automatic fallback was used)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS booked_carrier_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS booked_courier_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS booked_product_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS booked_service_name TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS booked_shipping_charge NUMERIC;

-- Booking audit trail
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipment_attempts JSONB;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipment_booking_response JSONB;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipment_booked_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipment_last_attempt_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipment_tracking_updated_at TIMESTAMPTZ;

-- NOTE: a UNIQUE index on payment_id would be the hard database-level guarantee against duplicate
-- orders, but the table already contains legacy duplicates (3 payments with 3 orders each), so it
-- would fail. After cleaning those up, run:
--   CREATE UNIQUE INDEX IF NOT EXISTS orders_payment_id_unique ON orders (payment_id) WHERE payment_id IS NOT NULL;
