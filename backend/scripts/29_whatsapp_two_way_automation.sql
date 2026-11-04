-- ==============================================================================
-- 29_whatsapp_two_way_automation.sql
-- MILASTY WhatsApp Two-Way Automation: Customer & Admin Notification Architecture
-- ==============================================================================
-- Idempotent, safe migration script. Can be re-run multiple times without error.
-- ==============================================================================

-- 1. Extend whatsapp_notifications table for two-way tracking
ALTER TABLE public.whatsapp_notifications
  ADD COLUMN IF NOT EXISTS recipient_type VARCHAR(20) NOT NULL DEFAULT 'customer',
  ADD COLUMN IF NOT EXISTS recipient_id VARCHAR(100),
  ADD COLUMN IF NOT EXISTS order_id VARCHAR(100),
  ADD COLUMN IF NOT EXISTS enquiry_id VARCHAR(100),
  ADD COLUMN IF NOT EXISTS template_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS provider_message_id VARCHAR(150);

-- Indexes for fast filtering on admin panel
CREATE INDEX IF NOT EXISTS idx_wa_notif_recipient_type
  ON public.whatsapp_notifications(recipient_type);

CREATE INDEX IF NOT EXISTS idx_wa_notif_order_id
  ON public.whatsapp_notifications(order_id);

CREATE INDEX IF NOT EXISTS idx_wa_notif_enquiry_id
  ON public.whatsapp_notifications(enquiry_id);


-- 2. Notification Matrix Settings Table
CREATE TABLE IF NOT EXISTS public.whatsapp_notification_settings (
  key VARCHAR(100) PRIMARY KEY,
  customer_enabled BOOLEAN NOT NULL DEFAULT true,
  admin_enabled BOOLEAN NOT NULL DEFAULT true,
  category VARCHAR(50) NOT NULL DEFAULT 'order',
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Admin Personal WhatsApp Recipients Table
CREATE TABLE IF NOT EXISTS public.whatsapp_admin_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  categories JSONB NOT NULL DEFAULT '["all"]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wa_admin_recipients_phone
  ON public.whatsapp_admin_recipients(phone);

CREATE INDEX IF NOT EXISTS idx_wa_admin_recipients_active
  ON public.whatsapp_admin_recipients(is_active);


-- 4. Seed Default Notification Matrix (Section 10)
INSERT INTO public.whatsapp_notification_settings (key, customer_enabled, admin_enabled, category, description)
VALUES
  ('ORDER_PLACED', true, true, 'order', 'When customer places an order'),
  ('ORDER_CONFIRMED', true, false, 'order', 'When order is confirmed'),
  ('ORDER_PROCESSING', true, false, 'order', 'When bakery begins preparation'),
  ('ORDER_PACKED', true, false, 'order', 'When order is packed & inspected'),
  ('ORDER_DISPATCHED', true, false, 'order', 'When package leaves bakery'),
  ('ORDER_SHIPPED', true, false, 'order', 'When courier picks up package'),
  ('ORDER_REACHED_CITY', true, false, 'order', 'When package arrives in customer city'),
  ('ORDER_OUT_FOR_DELIVERY', true, false, 'order', 'When delivery executive is on the way'),
  ('ORDER_DELIVERED', true, false, 'order', 'When delivery is completed'),
  ('ORDER_CANCELLED', true, false, 'order', 'When cancellation is finalized'),
  ('CANCELLATION_REQUESTED', true, true, 'order', 'When customer requests cancellation'),
  ('PAYMENT_SUCCESS', true, true, 'payment', 'When payment is verified'),
  ('PAYMENT_FAILED', true, true, 'payment', 'When payment fails at checkout'),
  ('RETURN_REQUESTED', true, true, 'returns', 'When return is requested'),
  ('RETURN_APPROVED', true, false, 'returns', 'When return is approved'),
  ('REFUND_REQUESTED', true, true, 'returns', 'When refund is requested'),
  ('REFUND_INITIATED', true, false, 'returns', 'When refund is initiated'),
  ('REFUND_COMPLETED', true, true, 'returns', 'When refund is processed & completed'),
  ('CUSTOMER_REGISTERED', true, true, 'account', 'When new customer registers'),
  ('PASSWORD_CHANGED', true, false, 'account', 'When password is changed'),
  ('PASSWORD_RESET_COMPLETED', true, false, 'account', 'When password reset is completed'),
  ('CUSTOMER_ENQUIRY_CREATED', true, true, 'enquiry', 'When enquiry or contact form is submitted'),
  ('WHATSAPP_DISCONNECTED', false, true, 'system', 'When WhatsApp connection is lost'),
  ('WHATSAPP_NOTIFICATION_FAILED', false, true, 'system', 'When notification permanently fails')
ON CONFLICT (key) DO NOTHING;


-- 5. Row Level Security (RLS) Policies
ALTER TABLE public.whatsapp_notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_admin_recipients ENABLE ROW LEVEL SECURITY;

-- Block public anonymous and authenticated client-side access
DROP POLICY IF EXISTS "Deny anon access to whatsapp_notification_settings" ON public.whatsapp_notification_settings;
CREATE POLICY "Deny anon access to whatsapp_notification_settings"
  ON public.whatsapp_notification_settings FOR ALL
  TO anon, authenticated
  USING (false);

DROP POLICY IF EXISTS "Deny anon access to whatsapp_admin_recipients" ON public.whatsapp_admin_recipients;
CREATE POLICY "Deny anon access to whatsapp_admin_recipients"
  ON public.whatsapp_admin_recipients FOR ALL
  TO anon, authenticated
  USING (false);

