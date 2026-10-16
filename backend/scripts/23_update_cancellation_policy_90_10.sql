-- ════════════════════════════════════════════════════════════════════════════
-- 23. MILASTY: Updated Order Cancellation Policy (3h window, 10% charge, 90% refund)
--
-- Cancellation rules:
--   - Customers can cancel only within 3 hours (10800s) of order placement.
--   - Deduct 10% cancellation charge from order amount.
--   - Customer eligible for 90% refund (prepaid Razorpay orders; COD has 0 refund).
--   - Elapsed > 3h: cancellation blocked with WINDOW_CLOSED.
--   - Amounts stored in paise, rounded safely so refund never exceeds 90%.
--   - Tracks cancellation_charge_paise, refund_amount_paise, and paid_at timestamp.
--
-- Run in the Supabase SQL editor. Safe to re-run.
-- ════════════════════════════════════════════════════════════════════════════

-- 1. Ensure refund_percentage allows 90% (while keeping 0, 50, 100 for historical records)
ALTER TABLE public.order_cancellations 
  DROP CONSTRAINT IF EXISTS order_cancellations_refund_percentage_check;

ALTER TABLE public.order_cancellations 
  ADD CONSTRAINT order_cancellations_refund_percentage_check 
  CHECK (refund_percentage IN (0, 50, 90, 100));

-- 2. Ensure cancellation_charge_paise exists
ALTER TABLE public.order_cancellations 
  ADD COLUMN IF NOT EXISTS cancellation_charge_paise BIGINT;

-- Backfill cancellation_charge_paise from non_refundable_paise if null
UPDATE public.order_cancellations
   SET cancellation_charge_paise = non_refundable_paise
 WHERE cancellation_charge_paise IS NULL AND non_refundable_paise IS NOT NULL;

-- 3. Ensure paid_at column exists in public.orders for tracking verified payment timestamp
ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

-- 4. Replace atomic cancellation RPC with updated 3-hour window and 90%/10% calculation
CREATE OR REPLACE FUNCTION public.request_order_cancellation(
  p_order_id    UUID,
  p_reason      TEXT,
  p_actor_id    UUID DEFAULT NULL,
  p_actor_role  TEXT DEFAULT 'customer',
  p_actor_email TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  o            public.orders%ROWTYPE;
  existing     public.order_cancellations%ROWTYPE;
  created      public.order_cancellations%ROWTYPE;
  v_now        TIMESTAMPTZ := now();
  v_elapsed    INTEGER;
  v_pct        SMALLINT;
  v_paid       BIGINT := 0;
  v_charge     BIGINT := 0;
  v_refund     BIGINT := 0;
  v_prepaid    BOOLEAN;
  v_refund_st  TEXT;
  v_ship_st    TEXT;
  v_order_ship TEXT;
  v_awb        TEXT;
BEGIN
  -- Lock order row so simultaneous requests serialize cleanly
  SELECT * INTO o FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'ORDER_NOT_FOUND'; END IF;

  SELECT * INTO existing FROM public.order_cancellations WHERE order_id = p_order_id;
  IF FOUND THEN
    RETURN jsonb_build_object('duplicate', true, 'cancellation', to_jsonb(existing));
  END IF;

  IF lower(coalesce(o.order_status, '')) = 'cancelled' THEN RAISE EXCEPTION 'ALREADY_CANCELLED'; END IF;
  IF lower(coalesce(o.order_status, '')) = 'delivered' OR lower(coalesce(o.shipment_status, '')) = 'delivered' THEN
    RAISE EXCEPTION 'ALREADY_DELIVERED';
  END IF;
  IF p_reason IS NULL OR length(btrim(p_reason)) < 3 THEN RAISE EXCEPTION 'REASON_REQUIRED'; END IF;

  -- 3-hour cancellation rule using trusted server timestamp (order creation vs now)
  v_elapsed := floor(extract(epoch FROM (v_now - o.created_at)))::INTEGER;
  IF v_elapsed <= 3 * 3600 THEN
    v_pct := 90;
  ELSE
    RAISE EXCEPTION 'WINDOW_CLOSED';
  END IF;

  v_prepaid := lower(coalesce(o.payment_method, '')) = 'razorpay' AND lower(coalesce(o.payment_status, '')) = 'paid';
  IF v_prepaid THEN
    v_paid   := round(coalesce(o.grand_total, 0) * 100)::BIGINT;
    -- 10% cancellation charge on product amount only; delivery charges are refunded where applicable
    v_charge := round(greatest(0, round((coalesce(o.grand_total, 0) - coalesce(o.delivery_fee, coalesce(o.delivery_charge, coalesce(o.shipping_fee, 0)))) * 100)) * 0.10)::BIGINT;
    v_refund := v_paid - v_charge;
    v_refund_st := CASE
      WHEN coalesce(o.payment_id, '') NOT LIKE 'pay\_%' THEN 'needs_review'
      WHEN v_refund = 0 THEN 'not_applicable'
      ELSE 'pending'
    END;
  ELSE
    v_pct := 0;
    v_paid := 0;
    v_charge := 0;
    v_refund := 0;
    v_refund_st := 'not_applicable';                            -- COD / unpaid: nothing to refund
  END IF;

  v_awb := nullif(coalesce(o.awb_number, o.awb), '');
  v_order_ship := lower(coalesce(o.shipment_status, ''));
  IF v_order_ship IN ('picked_up', 'in_transit', 'out_for_delivery') THEN
    v_ship_st := 'manual_required';                             -- parcel already with courier
  ELSIF v_awb IS NOT NULL OR v_order_ship = 'creating' THEN
    v_ship_st := 'pending';                                     -- backend triggers Shiprath cancel
  ELSE
    v_ship_st := 'not_required';                                -- never booked
  END IF;

  INSERT INTO public.order_cancellations (
    order_id, order_number, user_id, requested_by_role, reason,
    order_created_at, requested_at, elapsed_seconds,
    payment_method, razorpay_payment_id, amount_paid_paise, refund_percentage, refund_amount_paise, cancellation_charge_paise, refund_status,
    shipment_cancel_status, shipment_status_at_request, awb_at_request
  ) VALUES (
    o.id, o.order_number, o.user_id, coalesce(p_actor_role, 'customer'), btrim(p_reason),
    o.created_at, v_now, v_elapsed,
    o.payment_method, CASE WHEN o.payment_id LIKE 'pay\_%' THEN o.payment_id END, v_paid, v_pct, v_refund, v_charge, v_refund_st,
    v_ship_st, o.shipment_status, v_awb
  ) RETURNING * INTO created;

  -- Cancel the order. Unbooked orders get shipment_status = 'cancelled' to block auto-booking
  UPDATE public.orders
     SET order_status = 'cancelled',
         shipment_status = CASE WHEN v_ship_st = 'not_required' THEN 'cancelled' ELSE shipment_status END,
         updated_at = v_now
   WHERE id = o.id;

  INSERT INTO public.order_cancellation_events (cancellation_id, order_id, event_type, from_status, to_status, actor_id, actor_role, actor_email, details)
  VALUES (created.id, o.id, 'cancellation_requested', o.order_status, 'cancelled', p_actor_id, p_actor_role, p_actor_email,
          jsonb_build_object('elapsed_seconds', v_elapsed, 'refund_percentage', v_pct, 'amount_paid_paise', v_paid,
                             'cancellation_charge_paise', v_charge, 'refund_amount_paise', v_refund, 'refund_status', v_refund_st, 'shipment_cancel_status', v_ship_st));

  RETURN jsonb_build_object('duplicate', false, 'cancellation', to_jsonb(created));
END;
$$;

REVOKE ALL ON FUNCTION public.request_order_cancellation(UUID, TEXT, UUID, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.request_order_cancellation(UUID, TEXT, UUID, TEXT, TEXT) TO service_role;

NOTIFY pgrst, 'reload schema';
