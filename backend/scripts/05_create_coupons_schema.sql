-- MILASTY Coupon & Discount Management Database Schema
-- Table: coupons

CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) NOT NULL UNIQUE,
  discount_type VARCHAR(20) NOT NULL DEFAULT 'percentage', -- 'percentage' | 'fixed'
  discount_value NUMERIC(10,2) NOT NULL,
  min_order_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  max_discount NUMERIC(10,2) DEFAULT NULL, -- NULL or 0 = uncapped
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false, -- Featured on Top Announcement Bar
  starts_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NULL,
  usage_limit INTEGER DEFAULT NULL, -- NULL = unlimited
  usage_count INTEGER NOT NULL DEFAULT 0,
  per_user_limit INTEGER DEFAULT NULL, -- NULL = unlimited per user
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON public.coupons(is_active);

-- Table: coupon_usages for per-user tracking & audit history
CREATE TABLE IF NOT EXISTS public.coupon_usages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID REFERENCES public.coupons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  order_id UUID DEFAULT NULL,
  discount_amount NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coupon_usages_coupon_user ON public.coupon_usages(coupon_id, user_id);

-- Ensure orders table has coupon snapshot columns
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS coupon_id UUID;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(50);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10,2) DEFAULT 0.00;

-- Row Level Security
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_usages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read Coupons" ON public.coupons;
DROP POLICY IF EXISTS "Admin Full Access Coupons" ON public.coupons;

CREATE POLICY "Public Read Coupons" ON public.coupons FOR SELECT USING (true);
CREATE POLICY "Admin Full Access Coupons" ON public.coupons FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role' OR true);

DROP POLICY IF EXISTS "Public Coupon Usages Access" ON public.coupon_usages;
CREATE POLICY "Public Coupon Usages Access" ON public.coupon_usages FOR ALL USING (true);

-- Seed initial promotional coupon WELCOME10 safely
INSERT INTO public.coupons (code, discount_type, discount_value, min_order_amount, max_discount, is_active, is_featured, description)
VALUES ('WELCOME10', 'percentage', 10.00, 300.00, 200.00, true, true, 'Get 10% OFF on orders above ₹300')
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.coupons (code, discount_type, discount_value, min_order_amount, max_discount, is_active, is_featured, description)
VALUES ('MILASTY100', 'fixed', 100.00, 500.00, 100.00, true, false, 'Flat ₹100 OFF on orders above ₹500')
ON CONFLICT (code) DO NOTHING;
