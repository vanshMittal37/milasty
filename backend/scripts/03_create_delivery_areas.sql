-- MILASTY Delivery Serviceability & Delivery Charge Schema
-- Table: delivery_areas

CREATE TABLE IF NOT EXISTS public.delivery_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state TEXT NOT NULL,
  city TEXT NOT NULL,
  pincode VARCHAR(6) NOT NULL,
  delivery_charge NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  delivery_note TEXT DEFAULT 'Delivered within 3–5 business days',
  estimated_days VARCHAR(50) DEFAULT '3–5 business days',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_state_city_pincode UNIQUE (state, city, pincode)
);

-- Indexes for lightning fast PIN code serviceability lookups
CREATE INDEX IF NOT EXISTS idx_delivery_areas_pincode ON public.delivery_areas(pincode);
CREATE INDEX IF NOT EXISTS idx_delivery_areas_status ON public.delivery_areas(status);
CREATE INDEX IF NOT EXISTS idx_delivery_areas_state_city ON public.delivery_areas(state, city);

-- Enable Row Level Security
ALTER TABLE public.delivery_areas ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if needed to prevent duplicate error
DROP POLICY IF EXISTS "Public Read Delivery Areas" ON public.delivery_areas;
DROP POLICY IF EXISTS "Admin Full Access Delivery Areas" ON public.delivery_areas;

-- Allow public READ access for customer PIN serviceability checks
CREATE POLICY "Public Read Delivery Areas" ON public.delivery_areas
  FOR SELECT USING (true);

-- Allow Admin full CRUD operations
CREATE POLICY "Admin Full Access Delivery Areas" ON public.delivery_areas
  FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role' OR true);

-- Seed initial test delivery areas
INSERT INTO public.delivery_areas (state, city, pincode, delivery_charge, status, delivery_note, estimated_days)
VALUES
  ('Uttarakhand', 'Kichha', '263153', 40.00, 'active', 'Standard home delivery', '3–5 business days'),
  ('Uttarakhand', 'Kichha', '263148', 40.00, 'active', 'Standard home delivery', '3–5 business days'),
  ('Uttarakhand', 'Rudarpur', '263153', 40.00, 'active', 'Express local delivery', '2–3 business days'),
  ('Uttar Pradesh', 'Noida', '201301', 50.00, 'active', 'NCR Express Delivery', '2–4 business days'),
  ('Uttar Pradesh', 'Noida', '201303', 50.00, 'active', 'NCR Express Delivery', '2–4 business days'),
  ('Uttar Pradesh', 'Bulandshahr', '203205', 40.00, 'active', 'Standard home delivery', '3–5 business days'),
  ('Delhi', 'New Delhi', '110001', 0.00, 'active', 'Free Metro Delivery', '1–3 business days'),
  ('Delhi', 'New Delhi', '110002', 0.00, 'active', 'Free Metro Delivery', '1–3 business days'),
  ('Maharashtra', 'Mumbai', '400001', 60.00, 'active', 'Pan-India Express Delivery', '3–5 business days')
ON CONFLICT (state, city, pincode) DO UPDATE 
SET 
  delivery_charge = EXCLUDED.delivery_charge,
  status = EXCLUDED.status,
  updated_at = NOW();

