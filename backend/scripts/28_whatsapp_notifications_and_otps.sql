-- ==============================================================================
-- 28_whatsapp_notifications_and_otps.sql
-- MILASTY WhatsApp Automation System Schema
-- ==============================================================================
-- IMPORTANT:
-- Do NOT execute this migration on production without explicit administrative review.
-- The backend service includes an automatic in-memory fallback layer, allowing the
-- application to run safely even before this script is applied to Supabase.
--
-- This script is completely additive and idempotent:
-- - It creates two brand new, isolated tables: whatsapp_notifications & whatsapp_otps.
-- - No existing production tables are modified or deleted.
-- - Safe to re-run multiple times without conflicts.
-- ==============================================================================

-- 1. Table for Outgoing Notification Queue and Delivery Logs
CREATE TABLE IF NOT EXISTS public.whatsapp_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_phone VARCHAR(20) NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  reference_id VARCHAR(100),
  idempotency_key VARCHAR(150),
  message_body TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  attempts INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 3,
  last_error TEXT,
  sent_via VARCHAR(30) NOT NULL DEFAULT 'whatsapp',
  metadata JSONB DEFAULT '{}'::jsonb,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure strict uniqueness on non-null idempotency keys (prevents duplicate notification sends)
CREATE UNIQUE INDEX IF NOT EXISTS idx_wa_notif_idempotency_key
  ON public.whatsapp_notifications(idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- High-performance composite indexes for queue worker and admin history
CREATE INDEX IF NOT EXISTS idx_wa_notif_status_created_asc
  ON public.whatsapp_notifications(status, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_wa_notif_status_created_desc
  ON public.whatsapp_notifications(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_wa_notif_phone
  ON public.whatsapp_notifications(recipient_phone);

CREATE INDEX IF NOT EXISTS idx_wa_notif_event_ref
  ON public.whatsapp_notifications(event_type, reference_id);

CREATE INDEX IF NOT EXISTS idx_wa_notif_created_at
  ON public.whatsapp_notifications(created_at DESC);


-- 2. Table for Secure WhatsApp OTPs (Registration & Forgot Password)
CREATE TABLE IF NOT EXISTS public.whatsapp_otps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(20) NOT NULL,
  purpose VARCHAR(30) NOT NULL,
  otp_hash VARCHAR(128) NOT NULL,
  attempts INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 3,
  expires_at TIMESTAMPTZ NOT NULL,
  verified_at TIMESTAMPTZ,
  resend_after TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Composite index optimized for the exact lookup in otpService.js
CREATE INDEX IF NOT EXISTS idx_wa_otps_lookup
  ON public.whatsapp_otps(phone, purpose, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_wa_otps_created_at
  ON public.whatsapp_otps(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_wa_otps_expires_at
  ON public.whatsapp_otps(expires_at);


-- 3. Automatic updated_at Trigger for Notifications
CREATE OR REPLACE FUNCTION public.handle_whatsapp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_whatsapp_notifications_updated_at ON public.whatsapp_notifications;
CREATE TRIGGER trg_whatsapp_notifications_updated_at
  BEFORE UPDATE ON public.whatsapp_notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_whatsapp_updated_at();


-- 4. Row-Level Security (RLS) Configuration
-- Only the backend service-role key (which bypasses RLS) can read, insert, and update.
-- Both public anonymous (anon) and standard authenticated user clients are completely blocked.
ALTER TABLE public.whatsapp_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_otps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Deny all public access to whatsapp_notifications" ON public.whatsapp_notifications;
CREATE POLICY "Deny all public access to whatsapp_notifications"
  ON public.whatsapp_notifications
  FOR ALL TO public
  USING (false)
  WITH CHECK (false);

DROP POLICY IF EXISTS "Deny all public access to whatsapp_otps" ON public.whatsapp_otps;
CREATE POLICY "Deny all public access to whatsapp_otps"
  ON public.whatsapp_otps
  FOR ALL TO public
  USING (false)
  WITH CHECK (false);
