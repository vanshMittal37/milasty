-- ==============================================================================
-- 34_whatsapp_templates_and_variant_order.sql
-- MILASTY: WhatsApp Message Templates & Product Variant Drag-and-Drop Display Order
-- ==============================================================================

-- 1. Create table for WhatsApp message templates
CREATE TABLE IF NOT EXISTS public.whatsapp_message_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  event TEXT NOT NULL,
  variables JSONB DEFAULT '[]'::jsonb,
  content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  is_custom BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast query lookup
CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_cat ON public.whatsapp_message_templates(category);
CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_event ON public.whatsapp_message_templates(event);

-- Enable Row Level Security (RLS)
ALTER TABLE public.whatsapp_message_templates ENABLE ROW LEVEL SECURITY;

-- Service role full access policy
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'whatsapp_message_templates' AND policyname = 'service_role_all_whatsapp_templates'
  ) THEN
    CREATE POLICY service_role_all_whatsapp_templates ON public.whatsapp_message_templates
      FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 2. Add sort_order & display_order to product_variants for deterministic sorting
ALTER TABLE public.product_variants
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_product_variants_sort ON public.product_variants(product_id, sort_order);

