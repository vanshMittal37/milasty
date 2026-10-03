import { supabase } from '../config/supabase.js';

// ─── Shiprath B2C Constants ──────────────────────────────────────────────────
const SHIPRATH_BASE_URL = 'https://backend.shiprath.com/vendor/v1';
const WAREHOUSE_ADDRESS_ID = '1777118843112';
const WAREHOUSE_PINCODE = '201016';

/**
 * Build Shiprath request headers from env
 */
function getShiprathHeaders() {
  const secretKey = process.env.SHIPRATH_SECRET_KEY;
  const customerId = process.env.SHIPRATH_CUSTOMER_ID;

  if (!secretKey || !customerId) {
    throw new Error(
      'Shiprath credentials not configured. Set SHIPRATH_SECRET_KEY and SHIPRATH_CUSTOMER_ID in environment variables.'
    );
  }

  return {
    'Content-Type': 'application/json',
    secretkey: secretKey,
    customerid: String(customerId),
  };
}

/**
 * POST /api/shiprat/rates
 * Fetch live courier rates for a destination pincode + order weight/dims
 */
export const getShiprathRates = async (req, res) => {
  try {
    const {
      destinationPincode,
      weightKg = 0.5,
      length = 20,
      breadth = 15,
      height = 10,
      declaredValue = 200,
    } = req.body;

    if (!destinationPincode || !/^\d{6}$/.test(String(destinationPincode).trim())) {
      return res.status(400).json({ success: false, message: 'Valid 6-digit destination pincode is required.' });
    }

    const payload = {
      address_id: WAREHOUSE_ADDRESS_ID,
      destination_pincode: String(destinationPincode).trim(),
      weight: Number(weightKg),
      length: Number(length),
      breadth: Number(breadth),
      height: Number(height),
      declared_value: Number(declaredValue),
      payment_mode: 'prepaid', // MILASTY is prepaid only — never COD
      cod_amount: 0,
    };

    const response = await fetch(`${SHIPRATH_BASE_URL}/shipment/shipment_rate_time`, {
      method: 'POST',
      headers: getShiprathHeaders(),
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok || !data.status) {
      console.error('[SHIPRATH RATES] API error:', data);
      return res.status(502).json({
        success: false,
        message: data.message || 'Failed to fetch shipping rates from Shiprath.',
        raw: data,
      });
    }

    // Sort by cheapest rate, filter out COD-only options (safety guard)
    const rateList = (data.rate_list || []).filter(
      (r) => String(r.payment_mode || '').toLowerCase() !== 'cod'
    );

    return res.json({ success: true, rateList });
  } catch (error) {
    console.error('[SHIPRATH RATES] Exception:', error.message);
    return res.status(500).json({ success: false, message: 'Error fetching Shiprath rates.', error: error.message });
  }
};

/**
 * Core function: Book a Shiprath B2C shipment for a confirmed MILASTY order
 * Called internally by payment & order controllers after order is finalized.
 *
 * @param {Object} order  - Supabase order row (must include order_items)
 * @returns {Object}      - { awb, shipment_id, courier_name, tracking_url, raw }
 */
export const bookShiprathShipment = async (order) => {
  const logs = [];

  try {
    const secretKey = process.env.SHIPRATH_SECRET_KEY;
    const customerId = process.env.SHIPRATH_CUSTOMER_ID;

    if (!secretKey || !customerId) {
      console.warn('[SHIPRATH BOOK] Credentials not set — skipping Shiprath booking.');
      return null;
    }

    const destinationPincode = String(order.pincode || '').trim();
    if (!destinationPincode || !/^\d{6}$/.test(destinationPincode)) {
      console.warn('[SHIPRATH BOOK] Invalid/missing pincode on order:', order.order_number);
      return null;
    }

    // ── Estimate total weight from order items ──────────────────────────────
    // Rough estimate: each 100g pack ≈ 0.12 kg shipped weight (including packaging)
    const items = order.order_items || order.items || [];
    let estimatedWeightKg = 0.5; // minimum default

    for (const item of items) {
      const qty = Number(item.quantity || 1);
      const varName = String(item.variant_name || item.variantName || '').toLowerCase();
      // Parse numeric grams from variant name (e.g. "100g", "250 g", "200gm")
      const match = varName.match(/(\d+)\s*g/i);
      if (match) {
        const grams = Number(match[1]) * qty;
        estimatedWeightKg += grams / 1000 * 1.2; // add 20% packaging buffer
      } else {
        estimatedWeightKg += 0.3 * qty; // fallback: 300g per unknown item
      }
    }
    estimatedWeightKg = Math.max(0.5, Math.round(estimatedWeightKg * 10) / 10); // min 0.5 kg

    const declaredValue = Number(order.grand_total || order.subtotal || 200);

    // ── Step 1: Fetch available rates ────────────────────────────────────────
    logs.push('Fetching Shiprath rates...');
    const ratePayload = {
      address_id: WAREHOUSE_ADDRESS_ID,
      destination_pincode: destinationPincode,
      weight: estimatedWeightKg,
      length: 25,
      breadth: 20,
      height: 12,
      declared_value: declaredValue,
      payment_mode: 'prepaid',
      cod_amount: 0,
    };

    const rateRes = await fetch(`${SHIPRATH_BASE_URL}/shipment/shipment_rate_time`, {
      method: 'POST',
      headers: getShiprathHeaders(),
      body: JSON.stringify(ratePayload),
    });
    const rateData = await rateRes.json();

    if (!rateData.status || !rateData.rate_list || rateData.rate_list.length === 0) {
      console.error('[SHIPRATH BOOK] No rates returned for pincode:', destinationPincode, rateData);
      return null;
    }

    // ── Step 2: Pick the cheapest prepaid courier dynamically ────────────────
    // IMPORTANT: Never hardcode carrier_id, courier_id, product_id
    const prepaidRates = rateData.rate_list.filter(
      (r) => String(r.payment_mode || '').toLowerCase() !== 'cod'
    );

    if (prepaidRates.length === 0) {
      console.error('[SHIPRATH BOOK] No prepaid rates available for pincode:', destinationPincode);
      return null;
    }

    // Sort by total_charge ascending (cheapest first)
    prepaidRates.sort((a, b) => Number(a.total_charge || 0) - Number(b.total_charge || 0));
    const selected = prepaidRates[0];

    logs.push(
      `Selected courier: ${selected.courier_name || selected.carrier_name} | carrier_id: ${selected.carrier_id} | courier_id: ${selected.courier_id} | product_id: ${selected.product_id}`
    );

    // ── Step 3: Build booking payload ────────────────────────────────────────
    // Parse full shipping address for consignee fields
    const fullAddr = String(order.shipping_address || '');
    const addrParts = fullAddr.split(',').map((s) => s.trim()).filter(Boolean);
    const consigneeAddress = addrParts.slice(0, 2).join(', ') || fullAddr;
    const consigneeCity = order.delivery_city || addrParts[2] || '';
    const consigneeState = order.delivery_state || addrParts[3] || '';

    // Build item list for booking
    const bookItems = items.length > 0
      ? items.map((item) => ({
          name: String(item.product_title || item.title || 'MILASTY Artisan Bake').slice(0, 100),
          qty: Number(item.quantity || 1),
          price: Number(item.unit_price || item.price || 0),
          sku: String(item.product_id || 'SKU').slice(0, 50),
        }))
      : [{ name: 'MILASTY Artisan Bake', qty: 1, price: declaredValue, sku: 'MILASTY-001' }];

    const bookingPayload = {
      // Carrier selection (dynamic from rate calculator — never hardcoded)
      carrier_id: selected.carrier_id,
      courier_id: selected.courier_id,
      product_id: selected.product_id,

      // Pickup warehouse
      address_id: WAREHOUSE_ADDRESS_ID,

      // Consignee (customer)
      consignee_name: String(order.customer_name || 'Customer').slice(0, 100),
      consignee_mobile: String(order.customer_phone || '').replace(/\D/g, '').slice(-10),
      consignee_email: String(order.customer_email || '').slice(0, 100),
      consignee_address: consigneeAddress.slice(0, 200),
      consignee_city: consigneeCity.slice(0, 100),
      consignee_state: consigneeState.slice(0, 100),
      consignee_pincode: destinationPincode,
      consignee_country: 'India',

      // Shipment details
      order_number: String(order.order_number || order.id).slice(0, 50),
      weight: estimatedWeightKg,
      length: 25,
      breadth: 20,
      height: 12,
      declared_value: declaredValue,
      invoice_value: declaredValue,

      // MILASTY is PREPAID ONLY — COD must never be used
      payment_mode: 'prepaid',
      cod_amount: 0,

      // Items
      items: bookItems,
    };

    // ── Step 4: Create shipment booking ─────────────────────────────────────
    logs.push('Booking Shiprath shipment...');
    const bookRes = await fetch(`${SHIPRATH_BASE_URL}/shipment/create_shipment`, {
      method: 'POST',
      headers: getShiprathHeaders(),
      body: JSON.stringify(bookingPayload),
    });
    const bookData = await bookRes.json();

    if (!bookData.status) {
      console.error('[SHIPRATH BOOK] Booking failed:', bookData);
      return { error: bookData.message || 'Shiprath booking failed', raw: bookData };
    }

    const awb = bookData.awb_number || bookData.awb || bookData.data?.awb || null;
    const shipmentId = bookData.shipment_id || bookData.data?.shipment_id || null;
    const courierName = selected.courier_name || selected.carrier_name || 'Shiprath';
    const trackingUrl = awb
      ? `https://backend.shiprath.com/tracking/${awb}`
      : null;

    logs.push(`Booking success — AWB: ${awb}`);

    // ── Step 5: Persist AWB & tracking info to Supabase order row ───────────
    if (order.id && awb) {
      try {
        const shipmentMeta = {
          awb,
          shipment_id: shipmentId,
          carrier_id: selected.carrier_id,
          courier_id: selected.courier_id,
          product_id: selected.product_id,
          courier_name: courierName,
          tracking_url: trackingUrl,
          booked_at: new Date().toISOString(),
          estimated_delivery: selected.estimated_delivery || selected.etd || null,
        };

        // Try updating dedicated shipment columns first
        const { error: updateErr } = await supabase
          .from('orders')
          .update({
            awb_number: awb,
            shipment_id: shipmentId,
            courier_name: courierName,
            tracking_url: trackingUrl,
            order_status: 'shipped',
          })
          .eq('id', order.id);

        if (updateErr) {
          // Columns may not exist in schema yet — store in notes/metadata fallback
          console.warn('[SHIPRATH BOOK] Could not update shipment columns (may not exist):', updateErr.message);
          // Try storing in a JSON metadata approach via notes column
          await supabase
            .from('orders')
            .update({
              notes: JSON.stringify({ shipment: shipmentMeta, original_notes: order.notes || null }),
            })
            .eq('id', order.id);
        } else {
          console.log('[SHIPRATH BOOK] Updated order row with AWB:', awb);
        }
      } catch (dbErr) {
        console.warn('[SHIPRATH BOOK] DB update notice:', dbErr.message);
      }
    }

    console.log('[SHIPRATH BOOK] ✅ Shipment booked:', { awb, courier: courierName, order: order.order_number });

    return {
      success: true,
      awb,
      shipment_id: shipmentId,
      courier_name: courierName,
      tracking_url: trackingUrl,
      estimated_delivery: selected.estimated_delivery || selected.etd || null,
      carrier_id: selected.carrier_id,
      courier_id: selected.courier_id,
      product_id: selected.product_id,
      raw: bookData,
    };
  } catch (error) {
    console.error('[SHIPRATH BOOK] Exception:', error.message);
    return { error: error.message };
  }
};

/**
 * POST /api/shiprat/book
 * Admin-triggered manual booking for an existing order (by orderId)
 */
export const bookShipmentForOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      return res.status(400).json({ success: false, message: 'orderId is required.' });
    }

    const isUuid = /^[0-9a-fA-F-]{36}$/.test(orderId);
    let query = supabase.from('orders').select('*, order_items(*)');
    query = isUuid ? query.eq('id', orderId) : query.eq('order_number', orderId);

    const { data: order, error } = await query.maybeSingle();
    if (error || !order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const result = await bookShiprathShipment(order);
    if (!result || result.error) {
      return res.status(502).json({
        success: false,
        message: result?.error || 'Shiprath booking failed.',
        raw: result?.raw || null,
      });
    }

    return res.json({ success: true, ...result });
  } catch (error) {
    console.error('[SHIPRATH BOOK ROUTE] Exception:', error.message);
    return res.status(500).json({ success: false, message: 'Error booking shipment.', error: error.message });
  }
};

/**
 * GET /api/shiprat/track/:awb
 * Live shipment tracking by AWB number
 */
export const trackShipment = async (req, res) => {
  try {
    const { awb } = req.params;
    if (!awb) {
      return res.status(400).json({ success: false, message: 'AWB number is required.' });
    }

    const response = await fetch(`${SHIPRATH_BASE_URL}/shipment/track_shipment?awb=${encodeURIComponent(awb)}`, {
      method: 'GET',
      headers: getShiprathHeaders(),
    });

    const data = await response.json();

    if (!response.ok || !data.status) {
      console.error('[SHIPRATH TRACK] API error:', data);
      return res.status(502).json({
        success: false,
        message: data.message || 'Failed to fetch tracking info.',
        raw: data,
      });
    }

    return res.json({ success: true, tracking: data });
  } catch (error) {
    console.error('[SHIPRATH TRACK] Exception:', error.message);
    return res.status(500).json({ success: false, message: 'Error tracking shipment.', error: error.message });
  }
};

/**
 * GET /api/shiprat/order/:orderId/tracking
 * Fetch AWB from our DB order → then live-track it with Shiprath
 */
export const trackOrderShipment = async (req, res) => {
  try {
    const { orderId } = req.params;

    const isUuid = /^[0-9a-fA-F-]{36}$/.test(orderId);
    let query = supabase.from('orders').select('id, order_number, awb_number, courier_name, tracking_url, order_status, pincode, customer_name');
    query = isUuid ? query.eq('id', orderId) : query.eq('order_number', orderId);

    const { data: order, error } = await query.maybeSingle();
    if (error || !order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const awb = order.awb_number;

    if (!awb) {
      // Check if AWB is stored in notes JSON fallback
      const { data: fullOrder } = await supabase
        .from('orders')
        .select('notes')
        .eq('id', order.id)
        .maybeSingle();

      let awbFromNotes = null;
      if (fullOrder?.notes) {
        try {
          const parsed = JSON.parse(fullOrder.notes);
          awbFromNotes = parsed?.shipment?.awb || null;
        } catch (_) { /* not JSON */ }
      }

      if (!awbFromNotes) {
        return res.json({
          success: true,
          awb: null,
          status: order.order_status || 'confirmed',
          message: 'Shipment not yet booked or AWB not available.',
          tracking: null,
        });
      }

      order.awb_number = awbFromNotes;
    }

    // Live tracking call to Shiprath
    try {
      const trackRes = await fetch(
        `${SHIPRATH_BASE_URL}/shipment/track_shipment?awb=${encodeURIComponent(order.awb_number)}`,
        { method: 'GET', headers: getShiprathHeaders() }
      );
      const trackData = await trackRes.json();

      return res.json({
        success: true,
        awb: order.awb_number,
        courier_name: order.courier_name || null,
        tracking_url: order.tracking_url || null,
        order_status: order.order_status,
        tracking: trackData.status ? trackData : null,
        raw: trackData,
      });
    } catch (trackErr) {
      // Return what we have even if live tracking API fails
      return res.json({
        success: true,
        awb: order.awb_number,
        courier_name: order.courier_name || null,
        tracking_url: order.tracking_url || null,
        order_status: order.order_status,
        tracking: null,
        error: trackErr.message,
      });
    }
  } catch (error) {
    console.error('[SHIPRATH ORDER TRACK] Exception:', error.message);
    return res.status(500).json({ success: false, message: 'Error fetching order tracking.', error: error.message });
  }
};
