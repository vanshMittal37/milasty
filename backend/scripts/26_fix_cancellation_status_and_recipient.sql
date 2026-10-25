-- ════════════════════════════════════════════════════════════════════════════
-- 26. Fix cancelled orders still showing as Confirmed/Processing + store the delivery recipient
--
-- Root cause: request_order_cancellation (script 23) ran
--     UPDATE orders SET ..., updated_at = v_now
-- but public.orders has no updated_at column, so the function failed. The backend then fell back to
-- inserting the cancellation itself and its orders update failed for the same reason, unchecked —
-- leaving orders with a cancellation + pending refund whose order_status was still "confirmed".
--
-- Also: script 25 (recipient_name / recipient_phone) was never applied, so orders placed "for someone
-- else" lost the recipient (it survived only in orders.notes as "Deliver to: NAME (PHONE)").
--
-- Additive / corrective only. No order, payment, customer or cancellation row is deleted.
-- Run once in the Supabase SQL editor. Safe to re-run.
-- ════════════════════════════════════════════════════════════════════════════

-- 1. Recipient columns (same as script 25) ---------------------------------------------------------
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS recipient_name VARCHAR(100);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS recipient_phone VARCHAR(15);

-- Backfill only from what was actually stored at checkout (the notes). Orders without that note were
-- for the customer themselves and keep NULL — no recipient is invented.
UPDATE public.orders
   SET recipient_name  = btrim(substring(notes FROM 'Deliver to:\s*(.+?)\s*\(\d{10}\)')),
       recipient_phone = substring(notes FROM 'Deliver to:\s*.+?\s*\((\d{10})\)')
 WHERE recipient_name IS NULL
   AND notes ~ 'Deliver to:\s*.+?\s*\(\d{10}\)';

-- 2. Cancellation function without orders.updated_at ----------------------------------------------
--    Policy unchanged from script 23: cancellable within 3 hours of placement; paid Razorpay orders are
--    charged 10% of the product amount (grand_total − delivery_fee) and refunded the rest; COD/unpaid
--    orders: no charge, no refund.
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
  -- Lock the order row so simultaneous requests serialize: one cancels, the rest get duplicate=true
  SELECT * INTO o FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'ORDER_NOT_FOUND'; END IF;

  SELECT * INTO existing FROM public.order_cancellations WHERE order_id = p_order_id;
  IF FOUND THEN
    -- Make sure the order row agrees with the existing cancellation (repairs older failures)
    UPDATE public.orders SET order_status = 'cancelled' WHERE id = o.id AND lower(coalesce(order_status, '')) <> 'cancelled';
    RETURN jsonb_build_object('duplicate', true, 'cancellation', to_jsonb(existing));
  END IF;

  IF lower(coalesce(o.order_status, '')) = 'cancelled' THEN RAISE EXCEPTION 'ALREADY_CANCELLED'; END IF;
  IF lower(coalesce(o.order_status, '')) = 'delivered' OR lower(coalesce(o.shipment_status, '')) = 'delivered' THEN
    RAISE EXCEPTION 'ALREADY_DELIVERED';
  END IF;
  IF p_reason IS NULL OR length(btrim(p_reason)) < 3 THEN RAISE EXCEPTION 'REASON_REQUIRED'; END IF;

  -- 3-hour rule on the database clock (order creation vs now)
  v_elapsed := floor(extract(epoch FROM (v_now - o.created_at)))::INTEGER;
  IF v_elapsed <= 3 * 3600 THEN
    v_pct := 90;
  ELSE
    RAISE EXCEPTION 'WINDOW_CLOSED';
  END IF;

  v_prepaid := lower(coalesce(o.payment_method, '')) = 'razorpay' AND lower(coalesce(o.payment_status, '')) = 'paid';
  IF v_prepaid THEN
    v_paid   := round(coalesce(o.grand_total, 0) * 100)::BIGINT;
    -- 10% charge on the product amount only; the delivery fee is refunded in full
    v_charge := round(greatest(0, round((coalesce(o.grand_total, 0) - coalesce(o.delivery_fee, 0)) * 100)) * 0.10)::BIGINT;
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
    v_ship_st := 'manual_required';                             -- parcel already with the courier
  ELSIF v_awb IS NOT NULL OR v_order_ship = 'creating' THEN
    v_ship_st := 'pending';                                     -- backend calls Shiprath cancel next
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

  -- Cancel the order (no updated_at: orders has no such column). Unbooked orders also get
  -- shipment_status = 'cancelled' so the courier booking can never claim them.
  UPDATE public.orders
     SET order_status = 'cancelled',
         shipment_status = CASE WHEN v_ship_st = 'not_required' THEN 'cancelled' ELSE shipment_status END
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

-- 3. Repair orders that have a cancellation record but were left active ---------------------------
--    (as of 25 Oct 2026: MIL-980101 'confirmed', MIL-484593 'processing'). The backend also repairs
--    these on the next read, so this is belt-and-braces.
INSERT INTO public.order_cancellation_events (cancellation_id, order_id, event_type, from_status, to_status, actor_role, details)
SELECT c.id, o.id, 'order_status_synced', o.order_status, 'cancelled', 'system', jsonb_build_object('via', 'migration_26')
  FROM public.order_cancellations c
  JOIN public.orders o ON o.id = c.order_id
 WHERE lower(coalesce(o.order_status, '')) <> 'cancelled';

UPDATE public.orders o
   SET order_status = 'cancelled',
       shipment_status = CASE
         WHEN c.shipment_cancel_status = 'not_required'
          AND lower(coalesce(o.shipment_status, '')) IN ('', 'not_created', 'pending', 'failed')
         THEN 'cancelled' ELSE o.shipment_status END
  FROM public.order_cancellations c
 WHERE c.order_id = o.id
   AND lower(coalesce(o.order_status, '')) <> 'cancelled';

NOTIFY pgrst, 'reload schema';
