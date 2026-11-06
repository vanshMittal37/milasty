-- ==============================================================================
-- 31_google_authentication.sql
-- MILASTY Google Authentication & Customer Account Linking Schema
-- ==============================================================================
-- NOTE: DO NOT EXECUTE ON PRODUCTION DATABASE WITHOUT EXPLICIT APPROVAL.
-- This script adds google_id and avatar_url columns to public.users for secure
-- Google Sign-In, Sign-Up, and automatic account linking.
-- ==============================================================================

-- 1. Add google_id column for verified Google account subject identifier (sub)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS google_id VARCHAR(255);

-- 2. Add avatar_url column for storing Google profile picture URL
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 3. Create index for fast lookups by google_id during sign-in
CREATE INDEX IF NOT EXISTS idx_users_google_id
  ON public.users(google_id);

-- 4. Document column purposes
COMMENT ON COLUMN public.users.google_id IS 
  'Verified Google OAuth2/OIDC subject identifier (sub) for customer authentication';

COMMENT ON COLUMN public.users.avatar_url IS 
  'Customer avatar or profile photo URL from Google profile';

