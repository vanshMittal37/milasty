-- Migration 02: Add stock column to product_variants table
-- Ensures each variant has its own independent stock column in Supabase PostgreSQL
ALTER TABLE public.product_variants 
ADD COLUMN IF NOT EXISTS stock integer DEFAULT 50;
