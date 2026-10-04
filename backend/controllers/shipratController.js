import { supabase } from '../config/supabase.js';

// ─── Shiprath B2C Constants ──────────────────────────────────────────────────
const SHIPRATH_BASE_URL = 'https://backend.shiprath.com/vendor/v1';
const WAREHOUSE_ADDRESS_ID = '1777118843112';
const WAREHOUSE_PINCODE = '201016';

/**
 * Build Shiprath request headers from env
 * NOTE: .trim() is critical — Railway sometimes injects trailing whitespace or \n
 */
function getShiprathHeaders() {
  const secretKey = (process.env.SHIPRATH_SECRET_KEY || '').trim();
  const customerId = (process.env.SHIPRATH_CUSTOMER_ID || '').trim();

  if (!secretKey || !customerId) {
    throw new Error(
      'Shiprath credentials not configured. Set SHIPRATH_SECRET_KEY and SHIPRATH_CUSTOMER_ID in environment variables.'
    );
  }

  return {
    'Content-Type': 'application/json',
    secretkey: secretKey,
    customerid: customerId,
  };
}


/**
 * Helper: Calculate package weight from cart/order items
 */
export function calculateItemsWeightKg(items = []) {
  if (!items || !items.length) return 0.5; // minimum default 500g

  let totalWeightKg = 0;
  for (const item of items) {
    const qty = Number(item.quantity || 1);
    const varName = String(item.variantName || item.variant_name || item.weight || '').toLowerCase();
    
    // Parse grams from variant name (e.g. "100g", "250 g", "500gm")
    const match = varName.match(/(\d+)\s*g/i);
    if (match) {
      const grams = Number(match[1]) * qty;
      totalWeightKg += (grams / 1000) * 1.2; // 20% packaging buffer
    } else {
      totalWeightKg += 0.3 * qty; // fallback: 300g per item
    }
  }

  // Minimum 0.5 kg, rounded to 1 decimal place
  return Math.max(0.5, Math.round(totalWeightKg * 10) / 10);
}

/**
 * Helper function for server-side dynamic shipping rate calculation
 */
export async function fetchLiveShiprathRate({ pincode, items = [], weight = null, length = 10, breadth = 10, height = 10, declaredValue = 200 }) {
  const cleanPincode = String(pincode || '').trim();
  if (!cleanPincode || !/^\d{6}$/.test(cleanPincode)) {
    throw new Error('Valid 6-digit destination pincode is required for shipping rate calculation.');
  }

  const calculatedWeight = weight ? Number(weight) : calculateItemsWeightKg(items);

  const secretKey = (process.env.SHIPRATH_SECRET_KEY || '').trim();
  const customerId = (process.env.SHIPRATH_CUSTOMER_ID || '').trim();

  const payload = {
    from_postal_code: WAREHOUSE_PINCODE,
    from_country_code: 'IN',
    to_postal_code: cleanPincode,
    to_country_code: 'IN',
    weight: calculatedWeight,
    length: Number(length || 10),
    height: Number(height || 10),
    width: Number(breadth || 10),
    parcel_type: 'Parcel',
    mode: 'Domestic',
    payment_mode: 'prepaid',
    cod_amount: 0,
  };

  const response = await fetch(`${SHIPRATH_BASE_URL}/shipment/shipment_rate_time`, {
    method: 'POST',
    headers: getShiprathHeaders(),
    body: JSON.stringify(payload),
  });


  const data = await response.json();


  if (!response.ok || !data.status) {
    console.error('[SHIPRATH API ERROR]', data);
    throw new Error(data.message || 'Failed to fetch shipping rates from Shiprath.');
  }

  const rawRates = data.rate_list || data.data || [];
  // Filter out COD rates (MILASTY is strictly prepaid)
  const prepaidRates = rawRates.filter(
    (r) => String(r.payment_mode || '').toLowerCase() !== 'cod'
  );

  if (!prepaidRates || prepaidRates.length === 0) {
    throw new Error(`No prepaid courier service available for pincode ${cleanPincode}.`);
  }

  // Standardize rate fields
  const formattedRates = prepaidRates.map((r) => {
    const totalCharges = Number(r.total_charge || r.total_charges || r.rate || r.freight_charge || 0);
    return {
      carrier_id: r.carrier_id,
      courier_id: r.courier_id,
      product_id: r.product_id,
      service_name: r.courier_name || r.carrier_name || r.service_name || 'Standard Courier',
      service_provider: r.carrier_name || r.courier_name || 'Shiprath Partner',
      product_type_name: r.product_name || r.service_type || r.product_type_name || 'Surface',
      total_charges: totalCharges,
      total_charge: totalCharges,
      zone: r.zone || r.courier_zone || 'India Domestic',
      cod_commission: 0,
      estimated_delivery: r.estimated_delivery || r.etd || '3-5 business days',
    };
  });

  // Sort by total_charges ascending (cheapest rate first)
  formattedRates.sort((a, b) => a.total_charges - b.total_charges);
  const selectedRate = formattedRates[0];

  return {
    rateList: formattedRates,
    selectedRate,
    shippingCharge: selectedRate.total_charges,
    weight: calculatedWeight,
    pincode: cleanPincode,
  };
}

/**
 * POST /api/shipping/rates (and /api/shiprat/rates)
 * Dynamic Shiprath rate endpoint for Checkout & Admin Test
 */
export const getShiprathRates = async (req, res) => {
  try {
    const {
      pincode,
      destinationPincode,
      destination_pincode,
      weight,
      length = 10,
      width,
      breadth = 10,
      height = 10,
      declaredValue = 200,
      items = [],
    } = req.body;

    const targetPincode = pincode || destinationPincode || destination_pincode;

    if (!targetPincode || !/^\d{6}$/.test(String(targetPincode).trim())) {
      return res.status(400).json({
        success: false,
        message: 'Valid 6-digit destination pincode is required.',
      });
    }

    const result = await fetchLiveShiprathRate({
      pincode: targetPincode,
      items,
      weight,
      length,
      breadth: width || breadth,
      height,
      declaredValue,
    });

    return res.json({
      success: true,
      rateList: result.rateList,
      selectedRate: result.selectedRate,
      shippingCharge: result.shippingCharge,
      weight: result.weight,
      pincode: result.pincode,
    });
  } catch (error) {
    console.error('[SHIPRATH RATES] Exception:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error fetching dynamic Shiprath rates.',
    });
  }
};

/**
 * GET /api/shipping/connection-status
 * Check Shiprath connection & credentials status for Admin Dashboard
 */
export const checkShiprathConnection = async (req, res) => {
  try {
    const secretKey = (process.env.SHIPRATH_SECRET_KEY || '').trim();
    const customerId = (process.env.SHIPRATH_CUSTOMER_ID || '').trim();

    const isPlaceholder = !secretKey || !customerId || 
      secretKey.includes('REPLACE_WITH') || 
      customerId.includes('REPLACE_WITH');

    if (isPlaceholder) {
      return res.json({
        success: true,
        connected: false,
        warehouse: 'MILASTY',
        warehouseId: WAREHOUSE_ADDRESS_ID,
        pickupPincode: WAREHOUSE_PINCODE,
        paymentMode: 'prepaid',
        codStatus: 'disabled',
        message: 'Shiprath API credentials not configured (SHIPRATH_SECRET_KEY, SHIPRATH_CUSTOMER_ID are set to placeholder values). Set real keys in Railway / .env file.',
      });
    }


    // Quick connectivity ping to Shiprath rate API
    try {
      const pingPayload = {
        from_postal_code: WAREHOUSE_PINCODE,
        from_country_code: 'IN',
        to_postal_code: '110001',
        to_country_code: 'IN',
        weight: 1,
        length: 10,
        height: 10,
        width: 10,
        parcel_type: 'Parcel',
        mode: 'Domestic',
        payment_mode: 'prepaid',
        cod_amount: 0,
      };

      const pingRes = await fetch(`${SHIPRATH_BASE_URL}/shipment/shipment_rate_time`, {
        method: 'POST',
        headers: getShiprathHeaders(),
        body: JSON.stringify(pingPayload),
      });


      const pingData = await pingRes.json();
      console.log('[SHIPRATH PING RESPONSE]', pingRes.status, pingData);

      const isConnected = pingRes.ok && (pingData.status === true || (pingData.rate_list && pingData.rate_list.length > 0));


      let responseMsg = 'Connected to Shiprath B2C Shipping Network';
      if (!isConnected) {
        responseMsg = pingData.message ? `Shiprath API Error: ${pingData.message.trim()}` : 'Shiprath API returned authentication error';
      }

      return res.json({
        success: true,
        connected: !!isConnected,
        warehouse: 'MILASTY',
        warehouseId: WAREHOUSE_ADDRESS_ID,
        pickupPincode: WAREHOUSE_PINCODE,
        paymentMode: 'prepaid',
        codStatus: 'disabled',
        message: responseMsg,
        raw: pingData,
      });
    } catch (pingErr) {
      return res.json({
        success: true,
        connected: false,
        warehouse: 'MILASTY',
        warehouseId: WAREHOUSE_ADDRESS_ID,
        pickupPincode: WAREHOUSE_PINCODE,
        paymentMode: 'prepaid',
        codStatus: 'disabled',
        message: `Shiprath connection test failed: ${pingErr.message}`,
      });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error checking Shiprath connection.', error: error.message });
  }
};

/**
 * POST /api/shipping/test-rate
 * Admin-only test endpoint (calculates rates without creating a shipment)
 */
export const adminTestRate = async (req, res) => {
  try {
    const { pincode, weight = 1, length = 10, width = 10, height = 10 } = req.body;

    if (!pincode || !/^\d{6}$/.test(String(pincode).trim())) {
      return res.status(400).json({ success: false, message: 'Please enter a valid 6-digit Indian PIN code.' });
    }

    const result = await fetchLiveShiprathRate({
      pincode,
      weight,
      length,
      breadth: width,
      height,
      declaredValue: 300,
    });

    return res.json({
      success: true,
      serviceName: result.selectedRate.service_name,
      serviceProvider: result.selectedRate.service_provider,
      totalCharges: result.selectedRate.total_charges,
      carrierId: result.selectedRate.carrier_id,
      courierId: result.selectedRate.courier_id,
      productId: result.selectedRate.product_id,
      zone: result.selectedRate.zone,
      codCommission: 0,
      rateList: result.rateList,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * Core Function: Book a Shiprath B2C shipment for a confirmed & payment-verified MILASTY order
 * Called ONLY AFTER Razorpay payment signature is verified.
 *
 * @param {Object} order  - Supabase order row (includes order_items)
 * @returns {Object}      - { awb, shipment_id, courier_name, tracking_url, raw }
 */
export const bookShiprathShipment = async (order) => {
  try {
    if (!order) return null;

    // Idempotency Check: Don't re-book if AWB already exists for this order
    if (order.awb_number || order.awb) {
      console.log('[SHIPRATH BOOK] Shipment already booked for order:', order.order_number || order.id, 'AWB:', order.awb_number || order.awb);
      return {
        success: true,
        alreadyBooked: true,
        awb: order.awb_number || order.awb,
        shipment_id: order.shipment_id || null,
        courier_name: order.courier_name || 'Shiprath',
      };
    }

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

    const items = order.order_items || order.items || [];
    const estimatedWeightKg = calculateItemsWeightKg(items);
    const declaredValue = Number(order.grand_total || order.subtotal || 200);

    // ── Fetch dynamic rate to pick carrier/courier/product IDs ───────────────
    let selectedRate = null;
    try {
      const rateResult = await fetchLiveShiprathRate({
        pincode: destinationPincode,
        items,
        weight: estimatedWeightKg,
        declaredValue,
      });
      selectedRate = rateResult.selectedRate;
    } catch (rateErr) {
      console.error('[SHIPRATH BOOK] Dynamic rate fetch failed:', rateErr.message);
      return { error: rateErr.message };
    }

    if (!selectedRate) {
      console.error('[SHIPRATH BOOK] No valid carrier rate found for booking.');
      return { error: 'No valid carrier rate found for destination pincode' };
    }

    console.log('[SHIPRATH BOOK] Using dynamic courier IDs:', {
      carrier_id: selectedRate.carrier_id,
      courier_id: selectedRate.courier_id,
      product_id: selectedRate.product_id,
      courier_name: selectedRate.service_name,
    });

    // ── Build consignee fields ───────────────────────────────────────────────
    const fullAddr = String(order.shipping_address || '');
    const addrParts = fullAddr.split(',').map((s) => s.trim()).filter(Boolean);
    const consigneeAddress = addrParts.slice(0, 2).join(', ') || fullAddr;
    const consigneeCity = order.delivery_city || addrParts[2] || 'City';
    const consigneeState = order.delivery_state || addrParts[3] || 'State';

    const bookItems = items.length > 0
      ? items.map((item) => ({
          name: String(item.product_title || item.title || 'MILASTY Artisan Bake').slice(0, 100),
          qty: Number(item.quantity || 1),
          price: Number(item.unit_price || item.price || 0),
          sku: String(item.product_id || 'SKU').slice(0, 50),
        }))
      : [{ name: 'MILASTY Artisan Bake', qty: 1, price: declaredValue, sku: 'MILASTY-001' }];

    const bookingPayload = {
      // Dynamic courier selection from Rate API
      carrier_id: selectedRate.carrier_id,
      courier_id: selectedRate.courier_id,
      product_id: selectedRate.product_id,

      // Warehouse
      address_id: WAREHOUSE_ADDRESS_ID,

      // Consignee (Customer)
      consignee_name: String(order.customer_name || 'Customer').slice(0, 100),
      consignee_mobile: String(order.customer_phone || '').replace(/\D/g, '').slice(-10),
      consignee_email: String(order.customer_email || '').slice(0, 100),
      consignee_address: consigneeAddress.slice(0, 200),
      consignee_city: consigneeCity.slice(0, 100),
      consignee_state: consigneeState.slice(0, 100),
      consignee_pincode: destinationPincode,
      consignee_country: 'India',

      // Package specs
      order_number: String(order.order_number || order.id).slice(0, 50),
      weight: estimatedWeightKg,
      length: 25,
      breadth: 20,
      height: 12,
      declared_value: declaredValue,
      invoice_value: declaredValue,

      // MILASTY is PREPAID ONLY
      payment_mode: 'prepaid',
      cod_amount: 0,

      // Item Manifest
      items: bookItems,
    };

    // ── Call Shiprath Create Shipment API ────────────────────────────────────
    const bookRes = await fetch(`${SHIPRATH_BASE_URL}/shipment/new_shipment_create`, {
      method: 'POST',
      headers: getShiprathHeaders(),
      body: JSON.stringify(bookingPayload),
    });

    let bookData = await bookRes.json();

    // Fallback URL endpoint if path differs in vendor API
    if (!bookData.status && bookData.message?.toLowerCase().includes('not found')) {
      const fbRes = await fetch(`${SHIPRATH_BASE_URL}/shipment/create_shipment`, {
        method: 'POST',
        headers: getShiprathHeaders(),
        body: JSON.stringify(bookingPayload),
      });
      bookData = await fbRes.json();
    }

    if (!bookData.status) {
      console.error('[SHIPRATH BOOK] Booking response failed:', bookData);
      return { error: bookData.message || 'Shiprath booking failed', raw: bookData };
    }

    const awb = bookData.awb_number || bookData.awb || bookData.data?.awb || null;
    const shipmentId = bookData.shipment_id || bookData.data?.shipment_id || null;
    const courierName = selectedRate.service_name || 'Shiprath Partner';
    const trackingUrl = awb ? `https://backend.shiprath.com/tracking/${awb}` : null;

    // ── Persist shipment details to Supabase Order Row ────────────────────────
    if (order.id && awb) {
      const updateData = {
        awb_number: awb,
        shipment_id: shipmentId,
        courier_name: courierName,
        tracking_url: trackingUrl,
        order_status: 'shipped',
      };

      const { error: dbErr } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', order.id);

      if (dbErr) {
        console.warn('[SHIPRATH BOOK] DB update column warning:', dbErr.message);
      } else {
        console.log('[SHIPRATH BOOK] ✅ Saved AWB to order row:', awb);
      }
    }

    return {
      success: true,
      awb,
      shipment_id: shipmentId,
      courier_name: courierName,
      tracking_url: trackingUrl,
      carrier_id: selectedRate.carrier_id,
      courier_id: selectedRate.courier_id,
      product_id: selectedRate.product_id,
      raw: bookData,
    };
  } catch (error) {
    console.error('[SHIPRATH BOOK] Exception:', error.message);
    return { error: error.message };
  }
};

/**
 * POST /api/shiprat/book (and /api/shipping/book)
 * Admin manual shipment creation endpoint
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
 * GET /api/shipping/track/:awb (and /api/shiprat/track/:awb)
 * Live shipment tracking by AWB
 */
export const trackShipment = async (req, res) => {
  try {
    const { awb } = req.params;
    if (!awb) {
      return res.status(400).json({ success: false, message: 'AWB number is required.' });
    }

    const response = await fetch(`${SHIPRATH_BASE_URL}/shipment/shipment_tracking`, {
      method: 'POST',
      headers: getShiprathHeaders(),
      body: JSON.stringify({ awb }),
    });

    let data = await response.json();

    // Fallback to GET endpoint if POST signature differs
    if (!response.ok || !data.status) {
      const getRes = await fetch(`${SHIPRATH_BASE_URL}/shipment/track_shipment?awb=${encodeURIComponent(awb)}`, {
        method: 'GET',
        headers: getShiprathHeaders(),
      });
      data = await getRes.json();
    }

    return res.json({ success: true, tracking: data });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error tracking shipment.', error: error.message });
  }
};

/**
 * GET /api/shipping/order/:orderId/tracking (and /api/shiprat/order/:orderId/tracking)
 * Customer order tracking with timeline stages
 */
export const trackOrderShipment = async (req, res) => {
  try {
    const { orderId } = req.params;

    const isUuid = /^[0-9a-fA-F-]{36}$/.test(orderId);
    let query = supabase.from('orders').select('id, order_number, awb_number, shipment_id, courier_name, tracking_url, order_status, pincode, customer_name, created_at');
    query = isUuid ? query.eq('id', orderId) : query.eq('order_number', orderId);

    const { data: order, error } = await query.maybeSingle();
    if (error || !order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const awb = order.awb_number;

    // Build timeline stages
    const timeline = [
      { step: 'Order Confirmed', completed: true, timestamp: order.created_at },
      { step: 'Shipment Created', completed: Boolean(awb || order.order_status === 'shipped' || order.order_status === 'delivered') },
      { step: 'Picked Up', completed: Boolean(order.order_status === 'shipped' || order.order_status === 'delivered') },
      { step: 'In Transit', completed: Boolean(order.order_status === 'shipped' || order.order_status === 'delivered') },
      { step: 'Dispatched / Out for Delivery', completed: Boolean(order.order_status === 'out_for_delivery' || order.order_status === 'delivered') },
      { step: 'Delivered', completed: Boolean(order.order_status === 'delivered') },
    ];

    if (!awb) {
      return res.json({
        success: true,
        awb: null,
        status: order.order_status || 'confirmed',
        courier_name: order.courier_name || 'Shiprath Partner',
        message: 'Order confirmed. AWB will be updated as soon as pickup is dispatched.',
        timeline,
        tracking: null,
      });
    }

    // Live call to Shiprath tracking
    let liveTracking = null;
    try {
      const trackRes = await fetch(`${SHIPRATH_BASE_URL}/shipment/shipment_tracking`, {
        method: 'POST',
        headers: getShiprathHeaders(),
        body: JSON.stringify({ awb }),
      });
      const trackData = await trackRes.json();
      if (trackData.status) {
        liveTracking = trackData;
      }
    } catch (_) {}

    return res.json({
      success: true,
      awb,
      courier_name: order.courier_name || 'Shiprath Partner',
      tracking_url: order.tracking_url || `https://backend.shiprath.com/tracking/${awb}`,
      order_status: order.order_status,
      timeline,
      tracking: liveTracking,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error fetching order tracking.', error: error.message });
  }
};

/**
 * POST /api/shipping/order/:id/cancel
 * Cancel order with MILASTY cancellation business rules:
 * 0–3 hours: 100% refund
 * >3–6 hours: 50% refund
 * After 6 hours: Cancellation disabled
 */
export const cancelOrderWithShipment = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason = 'Customer requested cancellation' } = req.body;

    const isUuid = /^[0-9a-fA-F-]{36}$/.test(id);
    let query = supabase.from('orders').select('*');
    query = isUuid ? query.eq('id', id) : query.eq('order_number', id);

    const { data: order, error } = await query.maybeSingle();

    if (error || !order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    if (order.order_status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Order is already cancelled.' });
    }

    // ── Check Cancellation Window ───────────────────────────────────────────
    const createdAt = new Date(order.created_at || new Date());
    const now = new Date();
    const hoursElapsed = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

    if (hoursElapsed > 6) {
      return res.status(400).json({
        success: false,
        message: 'Cancellations are disabled after 6 hours from order placement as per MILASTY policy.',
      });
    }

    let refundPercentage = 100;
    if (hoursElapsed > 3) {
      refundPercentage = 50;
    }

    const refundAmount = Math.round((Number(order.grand_total || 0) * refundPercentage) / 100);

    // Cancel order in Supabase
    const cancellationNote = `Cancelled at ${now.toISOString()} (${hoursElapsed.toFixed(1)}h elapsed). Refund Eligible: ${refundPercentage}% (₹${refundAmount}). Reason: ${reason}`;

    const { data: updatedOrder, error: updateErr } = await supabase
      .from('orders')
      .update({
        order_status: 'cancelled',
        notes: order.notes ? `${order.notes} | ${cancellationNote}` : cancellationNote,
      })
      .eq('id', order.id)
      .select()
      .single();

    if (updateErr) {
      return res.status(500).json({ success: false, message: 'Failed to update order status in database.' });
    }

    // Call Shiprath Cancellation API if shipment created
    if (order.awb_number || order.shipment_id) {
      try {
        await fetch(`${SHIPRATH_BASE_URL}/shipment/shipment_cancel`, {
          method: 'POST',
          headers: getShiprathHeaders(),
          body: JSON.stringify({
            awb: order.awb_number,
            shipment_id: order.shipment_id,
          }),
        });
        console.log('[SHIPRATH CANCEL] Sent cancellation request for AWB:', order.awb_number);
      } catch (shipCancelErr) {
        console.warn('[SHIPRATH CANCEL] API notice:', shipCancelErr.message);
      }
    }

    return res.json({
      success: true,
      message: `Order cancelled successfully. ${refundPercentage}% refund (₹${refundAmount}) will be processed.`,
      refundPercentage,
      refundAmount,
      hoursElapsed: Math.round(hoursElapsed * 10) / 10,
      order: updatedOrder,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error cancelling order.', error: error.message });
  }
};

/**
 * GET /api/shipping/diagnose-credentials  (PUBLIC — NO AUTH)
 * Safe Shiprath credential diagnostic endpoint.
 * Does NOT expose secret values. Does NOT create any shipment.
 * Reports env var presence, character length, whitespace detection, and live API response.
 */
export const diagnoseCredentials = async (req, res) => {
  const rawSecret = process.env.SHIPRATH_SECRET_KEY;
  const rawCustomer = process.env.SHIPRATH_CUSTOMER_ID;

  const secretPresent = Boolean(rawSecret);
  const customerPresent = Boolean(rawCustomer);

  // Trim whitespace/newlines
  const trimmedSecret = (rawSecret || '').trim();
  const trimmedCustomer = (rawCustomer || '').trim();

  const secretHasWhitespace = secretPresent && (rawSecret !== trimmedSecret);
  const customerHasWhitespace = customerPresent && (rawCustomer !== trimmedCustomer);

  const report = {
    environment: process.env.NODE_ENV || 'unknown',
    envVars: {
      SHIPRATH_SECRET_KEY: {
        present: secretPresent,
        length: trimmedSecret.length,
        hasWhitespace: secretHasWhitespace,
        firstChar: trimmedSecret.length > 0 ? trimmedSecret[0] : null,
        lastChar: trimmedSecret.length > 0 ? trimmedSecret[trimmedSecret.length - 1] : null,
      },
      SHIPRATH_CUSTOMER_ID: {
        present: customerPresent,
        length: trimmedCustomer.length,
        hasWhitespace: customerHasWhitespace,
        value: trimmedCustomer, // customer ID is not a secret — safe to expose for verification
      },
    },
    headers: {
      willSend: {
        'Content-Type': 'application/json',
        secretkey: secretPresent ? `[REDACTED — length ${trimmedSecret.length}]` : '[MISSING]',
        customerid: customerPresent ? trimmedCustomer : '[MISSING]',
      },
    },
  };

  if (!secretPresent || !customerPresent) {
    return res.json({
      ...report,
      apiTest: null,
      conclusion: 'FAIL — One or both env vars missing. Set SHIPRATH_SECRET_KEY and SHIPRATH_CUSTOMER_ID in Railway Variables.',
    });
  }

  // Make the live Shiprath rate API call using TRIMMED values and full parameter set
  let apiTest = null;
  try {
    const pingRes = await fetch(`${SHIPRATH_BASE_URL}/shipment/shipment_rate_time`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        secretkey: trimmedSecret,
        customerid: trimmedCustomer,
      },
      body: JSON.stringify({
        from_postal_code: WAREHOUSE_PINCODE,
        from_country_code: 'IN',
        to_postal_code: '110001',
        to_country_code: 'IN',
        weight: 1,
        length: 10,
        height: 10,
        width: 10,
        parcel_type: 'Parcel',
        mode: 'Domestic',
        payment_mode: 'prepaid',
        cod_amount: 0,
      }),

    });

    const pingData = await pingRes.json();
    const isConnected = pingRes.ok && (pingData.status === true || (pingData.rate_list && pingData.rate_list.length > 0));

    apiTest = {
      httpStatus: pingRes.status,
      shiprathStatus: pingData.status,
      shiprathMessage: pingData.message || null,
      rateCount: Array.isArray(pingData.rate_list) ? pingData.rate_list.length : (Array.isArray(pingData.data) ? pingData.data.length : 0),
      rawResponse: pingData,
      connected: isConnected,
    };

    const conclusion = isConnected
      ? 'SUCCESS — Shiprath API connected. Credentials are valid and working correctly.'
      : `FAIL — Shiprath returned: "${pingData.message || 'unknown error'}". HTTP ${pingRes.status}.`;

    return res.json({ ...report, apiTest, conclusion });

  } catch (err) {
    apiTest = { error: err.message };
    return res.json({
      ...report,
      apiTest,
      conclusion: `FAIL — Network error calling Shiprath API: ${err.message}`,
    });
  }

};

