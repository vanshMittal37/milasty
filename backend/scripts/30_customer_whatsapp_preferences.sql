-- ==============================================================================
-- 30_customer_whatsapp_preferences.sql
-- MILASTY Customer WhatsApp Notification Preferences
-- ==============================================================================
-- NOTE: DO NOT EXECUTE ON PRODUCTION DATABASE WITHOUT EXPLICIT APPROVAL.
-- This script provides the database migration to store customer WhatsApp notification
-- preferences, distinguishing between transactional and promotional channels.
-- ==============================================================================

-- 1. Add notification_preferences column to public.users if not present
-- Default value: transactional WhatsApp enabled (true), promotional opt-out (false)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS notification_preferences JSONB NOT NULL 
  DEFAULT '{"whatsapp": true, "whatsapp_promotional": false}'::jsonb;

-- 2. Create GIN index for efficient query performance on JSONB preferences
CREATE INDEX IF NOT EXISTS idx_users_notification_preferences
  ON public.users USING gin (notification_preferences);

-- 3. Document the schema for developer and audit visibility
COMMENT ON COLUMN public.users.notification_preferences IS 
  'Customer notification preferences JSONB. e.g. {"whatsapp": true, "whatsapp_promotional": false}. "whatsapp" controls transactional messages (orders, deliveries, refunds). "whatsapp_promotional" controls marketing and offer campaigns. Security alerts (OTPs, password changes) bypass preferences.';

-- 4. Enable Row Level Security (RLS) check reminder:
-- Ensure existing policies on public.users allow authenticated customers to select and update only their own row:
-- (auth.uid() = id OR id = current_setting('request.jwt.claims', true)::json->>'sub')
