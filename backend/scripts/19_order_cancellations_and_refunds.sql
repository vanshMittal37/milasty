-- ════════════════════════════════════════════════════════════════════════════
-- 19. Order cancellations, manual refund tracking & shipment-cancellation tracking
--
-- Additive only: no existing order, payment or customer data is changed or deleted.
-- Run once in the Supabase SQL editor. Safe to re-run.
--
-- Refund policy (computed in the database with now() — never the customer's clock):
--   elapsed <= 3h 00m 00s          → 100% of the amount paid
--   3h < elapsed <= 5h 00m 00s     → 50%  of the amount paid
--   elapsed > 5h                   → cancellation blocked (no policy defined)
-- "Amount paid" = orders.grand_total (items − coupon + delivery) for PAID Razorpay orders; 0 for COD.
-- Amounts are stored in paise; the refund is rounded DOWN to the paisa so it never exceeds the %.
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.order_cancellations (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id               UUID NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE RESTRICT,
  order_number           TEXT,
  user_id                UUID REFERENCES public.users(id) ON DELETE SET NULL,
  requested_by_role      TEXT NOT NULL DEFAULT 'customer' CHECK (requested_by_role IN ('customer', 'admin')),
  reason                 TEXT NOT NULL CHECK (length(btrim(reason)) BETWEEN 3 AND 500),

  -- Timing (database clock)
  order_created_at       TIMESTAMPTZ NOT NULL,
  requested_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  elapsed_seconds        INTEGER NOT NULL CHECK (elapsed_seconds >= 0),

  -- Money (paise)
  payment_method         TEXT,
  razorpay_payment_id    TEXT,
  amount_paid_paise      BIGINT NOT NULL CHECK (amount_paid_paise >= 0),
  refund_percentage      SMALLINT NOT NULL CHECK (refund_percentage IN (0, 50, 100)),
  refund_amount_paise    BIGINT NOT NULL CHECK (refund_amount_paise >= 0),
  non_refundable_paise   BIGINT GENERATED ALWAYS AS (amount_paid_paise - refund_amount_paise) STORED,
  CONSTRAINT refund_not_above_paid CHECK (refund_amount_paise <= amount_paid_paise),

  -- Manual refund workflow (admin refunds in the Razorpay Dashboard, then records it here)
  refund_status          TEXT NOT NULL CHECK (refund_status IN
                           ('not_applicable', 'needs_review', 'pending', 'processing', 'successful', 'failed')),
  refund_reference       TEXT UNIQUE,          -- Razorpay refund id (rfnd_…) — unique: one refund can't close two cancellations
  refund_verified_via    TEXT CHECK (refund_verified_via IN ('razorpay_api', 'manual_admin')),
  refund_processed_by    UUID REFERENCES public.users(id) ON DELETE SET NULL,
  refund_processed_by_email TEXT,
  refund_processed_at    TIMESTAMPTZ,
  refund_notes           TEXT,
  CONSTRAINT successful_refund_has_reference CHECK (refund_status <> 'successful' OR refund_reference IS NOT NULL),

  -- Shipment cancellation (tracked independently of the refund)
  shipment_cancel_status TEXT NOT NULL CHECK (shipment_cancel_status IN
                           ('not_required', 'pending', 'in_progress', 'cancelled', 'failed', 'manual_required', 'manually_resolved')),
  shipment_status_at_request TEXT,
  awb_at_request         TEXT,
  shipment_cancel_attempts INTEGER NOT NULL DEFAULT 0,
  shipment_cancel_last_attempt_at TIMESTAMPTZ,
  shipment_cancel_response JSONB,
  shipment_cancel_error  TEXT,

  admin_seen_at          TIMESTAMPTZ,          -- drives the admin notification badge
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS order_cancellations_requested_at_idx ON public.order_cancellations (requested_at DESC);
CREATE INDEX IF NOT EXISTS order_cancellations_refund_status_idx ON public.order_cancellations (refund_status);
CREATE INDEX IF NOT EXISTS order_cancellations_shipment_status_idx ON public.order_cancellations (shipment_cancel_status);
CREATE INDEX IF NOT EXISTS order_cancellations_unseen_idx ON public.order_cancellations (requested_at) WHERE admin_seen_at IS NULL;

-- Append-only audit trail of every cancellation / refund / shipment change
CREATE TABLE IF NOT EXISTS public.order_cancellation_events (
  id               BIGSERIAL PRIMARY KEY,
  cancellation_id  UUID NOT NULL REFERENCES public.order_cancellations(id) ON DELETE RESTRICT,
  order_id         UUID NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
  event_type       TEXT NOT NULL,
  from_status      TEXT,
  to_status        TEXT,
  actor_id         UUID,
  actor_role       TEXT,
  actor_email      TEXT,
  details          JSONB,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS order_cancellation_events_cancellation_idx ON public.order_cancellation_events (cancellation_id, created_at);

-- Only the backend (service role) may touch these tables; no anon/authenticated access via PostgREST
ALTER TABLE public.order_cancellations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_cancellation_events ENABLE ROW LEVEL SECURITY;

-- ────────────────────────────────────────────────────────────────────────────
-- Atomic cancellation. Locks the order row, so simultaneous requests are serialised:
-- the first creates the cancellation, every later one gets {duplicate: true}.
-- Errors are raised with a stable code prefix the backend maps to HTTP responses.
-- ────────────────────────────────────────────────────────────────────────────
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
  v_refund     BIGINT := 0;
  v_prepaid    BOOLEAN;
  v_refund_st  TEXT;
  v_ship_st    TEXT;
  v_order_ship TEXT;
  v_awb        TEXT;
BEGIN
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

  v_elapsed := floor(extract(epoch FROM (v_now - o.created_at)))::INTEGER;
  IF v_elapsed <= 3 * 3600 THEN v_pct := 100;
  ELSIF v_elapsed <= 5 * 3600 THEN v_pct := 50;
  ELSE RAISE EXCEPTION 'WINDOW_CLOSED';
  END IF;

  v_prepaid := lower(coalesce(o.payment_method, '')) = 'razorpay' AND lower(coalesce(o.payment_status, '')) = 'paid';
  IF v_prepaid THEN
    v_paid   := round(coalesce(o.grand_total, 0) * 100)::BIGINT;
    v_refund := floor(v_paid * v_pct / 100.0)::BIGINT;
    v_refund_st := CASE
      WHEN coalesce(o.payment_id, '') NOT LIKE 'pay\_%' THEN 'needs_review'   -- no Razorpay payment id to refund against
      WHEN v_refund = 0 THEN 'not_applicable'
      ELSE 'pending'
    END;
  ELSE
    v_refund_st := 'not_applicable';                                         -- COD / unpaid: nothing to refund
  END IF;

  v_awb := nullif(coalesce(o.awb_number, o.awb), '');
  v_order_ship := lower(coalesce(o.shipment_status, ''));
  IF v_order_ship IN ('picked_up', 'in_transit', 'out_for_delivery') THEN
    v_ship_st := 'manual_required';                                          -- parcel already with the courier → RTO
  ELSIF v_awb IS NOT NULL OR v_order_ship = 'creating' THEN
    v_ship_st := 'pending';                                                  -- backend calls Shiprath cancel next
  ELSE
    v_ship_st := 'not_required';                                             -- never booked
  END IF;

  INSERT INTO public.order_cancellations (
    order_id, order_number, user_id, requested_by_role, reason,
    order_created_at, requested_at, elapsed_seconds,
    payment_method, razorpay_payment_id, amount_paid_paise, refund_percentage, refund_amount_paise, refund_status,
    shipment_cancel_status, shipment_status_at_request, awb_at_request
  ) VALUES (
    o.id, o.order_number, o.user_id, coalesce(p_actor_role, 'customer'), btrim(p_reason),
    o.created_at, v_now, v_elapsed,
    o.payment_method, CASE WHEN o.payment_id LIKE 'pay\_%' THEN o.payment_id END, v_paid, v_pct, v_refund, v_refund_st,
    v_ship_st, o.shipment_status, v_awb
  ) RETURNING * INTO created;

  -- Cancel the order. An unbooked order also gets shipment_status = 'cancelled' so the
  -- auto-booker (which only claims pending/not_created/NULL) can never book it afterwards.
  UPDATE public.orders
     SET order_status = 'cancelled',
         shipment_status = CASE WHEN v_ship_st = 'not_required' THEN 'cancelled' ELSE shipment_status END
   WHERE id = o.id;

  INSERT INTO public.order_cancellation_events (cancellation_id, order_id, event_type, from_status, to_status, actor_id, actor_role, actor_email, details)
  VALUES (created.id, o.id, 'cancellation_requested', o.order_status, 'cancelled', p_actor_id, p_actor_role, p_actor_email,
          jsonb_build_object('elapsed_seconds', v_elapsed, 'refund_percentage', v_pct, 'amount_paid_paise', v_paid,
                             'refund_amount_paise', v_refund, 'refund_status', v_refund_st, 'shipment_cancel_status', v_ship_st));

  RETURN jsonb_build_object('duplicate', false, 'cancellation', to_jsonb(created));
END;
$$;

REVOKE ALL ON FUNCTION public.request_order_cancellation(UUID, TEXT, UUID, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.request_order_cancellation(UUID, TEXT, UUID, TEXT, TEXT) TO service_role;

NOTIFY pgrst, 'reload schema';
