-- Package details per order + persistent payment sessions. Safe to run more than once.

-- Package actually used for the shipment (kg / cm). Shown in the admin order view.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS package_weight_kg NUMERIC;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS package_length_cm NUMERIC;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS package_width_cm NUMERIC;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS package_height_cm NUMERIC;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS package_is_manual BOOLEAN DEFAULT FALSE;

-- Checkout state captured before Razorpay payment (cart, address, totals, selected shipping rate).
-- Previously held only in server memory, so a Railway restart between checkout and payment lost it.
CREATE TABLE IF NOT EXISTS payment_sessions (
  razorpay_order_id TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'created',   -- created | paid | cancelled | failed
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Server-only table: RLS on with no policies, so only the backend's service-role key can access it
-- (contains customer addresses and phone numbers).
ALTER TABLE payment_sessions ENABLE ROW LEVEL SECURITY;
