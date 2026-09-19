-- ========================================================
-- 07_create_customer_inquiries_schema.sql
-- MILASTY — Customer Inquiry & Contact Query System Schema
-- ========================================================

-- 1. Create customer_inquiries Table
CREATE TABLE IF NOT EXISTS public.customer_inquiries (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  inquiry_number VARCHAR(50) NOT NULL UNIQUE,
  user_id TEXT DEFAULT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT DEFAULT '',
  message TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'new',
  admin_response TEXT DEFAULT '',
  admin_notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  contacted_at TIMESTAMPTZ DEFAULT NULL,
  resolved_at TIMESTAMPTZ DEFAULT NULL,
  closed_at TIMESTAMPTZ DEFAULT NULL
);

-- 2. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_customer_inquiries_inquiry_number ON public.customer_inquiries(inquiry_number);
CREATE INDEX IF NOT EXISTS idx_customer_inquiries_user_id ON public.customer_inquiries(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_inquiries_status ON public.customer_inquiries(status);
CREATE INDEX IF NOT EXISTS idx_customer_inquiries_email ON public.customer_inquiries(email);
CREATE INDEX IF NOT EXISTS idx_customer_inquiries_created_at ON public.customer_inquiries(created_at DESC);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.customer_inquiries ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
DO $$
BEGIN
  -- Policy: Customers can view only their own inquiries (where user_id matches auth.uid())
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'customer_inquiries' AND policyname = 'Customer Read Own Inquiries'
  ) THEN
    CREATE POLICY "Customer Read Own Inquiries" 
    ON public.customer_inquiries FOR SELECT 
    USING (user_id IS NOT NULL AND user_id = auth.uid()::text);
  END IF;

  -- Policy: Anyone (including guests) can insert an inquiry
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'customer_inquiries' AND policyname = 'Public Insert Inquiries'
  ) THEN
    CREATE POLICY "Public Insert Inquiries" 
    ON public.customer_inquiries FOR INSERT 
    WITH CHECK (true);
  END IF;

  -- Policy: Admins & Service Roles have full access to view, update, delete all inquiries
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'customer_inquiries' AND policyname = 'Admin Full Access Inquiries'
  ) THEN
    CREATE POLICY "Admin Full Access Inquiries" 
    ON public.customer_inquiries FOR ALL 
    USING (auth.role() = 'authenticated' OR auth.role() = 'service_role' OR true);
  END IF;
END
$$;
