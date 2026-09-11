-- Migration: Fix orders_user_id_fkey constraint
-- Ensures existing orders are never deleted when a user is deleted,
-- and primary key updates automatically cascade to referenced orders.

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_user_id_fkey;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES public.users(id)
  ON DELETE SET NULL
  ON UPDATE CASCADE;
