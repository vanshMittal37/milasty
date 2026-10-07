import Razorpay from 'razorpay';
import crypto from 'crypto';
import { supabase } from '../config/supabase.js';
import {
  bookShiprathShipment,
  fetchLiveShiprathRate,
  calculatePackage,
  getShippingQuote,
  saveShippingQuote,
  claimOrderForBooking,
} from './shipratController.js';
import { safeUpdateOrder } from '../utils/safeOrderUpdate.js';

// Payment sessions (keyed by razorpay_order_id): cart, address, totals and the selected shipping
// rate captured before payment. Kept in memory for speed AND persisted in the Supabase
// `payment_sessions` table so a Railway restart between checkout and payment loses nothing.
const paymentSessions = new Map();
let sessionTableWarned = false;

const warnSessionTable = (err) => {
  if (!sessionTableWarned) {
    sessionTableWarned = true;
    console.error('[PAYMENT SESSION] Could not persist to payment_sessions table (run scripts/16_package_and_payment_sessions.sql):', err.message);
  }
};

async function saveSession(id, data) {
  paymentSessions.set(id, data);
  const { error } = await supabase.from('payment_sessions').upsert({
    razorpay_order_id: id,
    status: data.status || 'created',
    data,
    updated_at: new Date().toISOString(),
  });
  if (error) warnSessionTable(error);
}

async function loadSession(id) {
  if (!id) return null;
  if (paymentSessions.has(id)) return paymentSessions.get(id);
  const { data: row, error } = await supabase.from('payment_sessions').select('data, status').eq('razorpay_order_id', id).maybeSingle();
  if (error) { warnSessionTable(error); return null; }
  if (!row?.data) return null;
  const session = { ...row.data, status: row.status || row.data.status };
  paymentSessions.set(id, session);
  console.log(`[PAYMENT SESSION] Restored session ${id} from database`);
  return session;
}

async function setSessionStatus(id, status) {
  const s = paymentSessions.get(id);
  if (s) s.status = status;
  const { error } = await supabase.from('payment_sessions')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('razorpay_order_id', id);
  if (error) warnSessionTable(error);
}

const getRazorpayInstance = () => {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) {
    throw new Error('Razorpay credentials not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in environment variables.');
  }
  return new Razorpay({ key_id, key_secret });
};

/**
 * Helper: Calculate dynamic delivery charge using Shiprath Rate API
 */
export const getDeliveryChargeForPincode = async (pincode, subtotal, items = []) => {
  try {
    const rateResult = await fetchLiveShiprathRate({ pincode, items, declaredValue: subtotal });
    // Log all rates so Railway shows what Shiprath returned
    console.log(`[RATES] dest=${pincode} weight=${rateResult.weight}kg → ${rateResult.rateList.length} options: ${rateResult.rateList.map(r => `${r.service_name} ₹${r.total_charges}`).join(', ')}`);
    return {
      deliveryFee: rateResult.shippingCharge,
      isFreeDelivery: false,
      selectedRate: rateResult.selectedRate,
      rateList: rateResult.rateList,
      city: '',
      state: ''
    };
  } catch (err) {
    console.warn('[SHIPRATH RATE WARNING] Dynamic rate calculation fallback:', err.message);
    return {
      deliveryFee: 0,
      isFreeDelivery: false,
      selectedRate: null,
      rateList: [],
      city: '',
      state: ''
    };
  }
};

/**
 * 1. CREATE PAYMENT SESSION & RAZORPAY ORDER (SERVER-SIDE SINGLE SOURCE OF TRUTH)
 * POST /api/payments/create-session
 */
export const createPaymentSession = async (req, res) => {
  try {
    const {
      customerName,
      customerEmail,
      email,
      customerPhone,
      phone,
      shippingAddress,
      pincode,
      items: clientItems = [],
      couponCode = null,
      userId = null,
      quoteId = null,              // shipping quote the checkout displayed (opaque id, no courier data)
      expectedDeliveryFee = null,  // delivery charge the customer saw — must match what we charge
      expectedGrandTotal = null,   // total the customer saw
    } = req.body;

    const finalEmail = customerEmail || email || '';
    const finalPhone = customerPhone || phone || '';

    // Authenticated checkout: the server-side cart is the source of truth (same cart on every device).
    // Fall back to the submitted items only if the server cart is empty (e.g. a failed cart sync).
    let items = Array.isArray(clientItems) ? clientItems : [];
    const authUserId = req.user ? (req.user.id || req.user._id) : null;
    if (authUserId) {
      const { data: cartRow } = await supabase.from('users').select('cart').eq('id', authUserId).maybeSingle();
      if (Array.isArray(cartRow?.cart) && cartRow.cart.length > 0) {
        items = cartRow.cart;
      }
    }

    if (!items || !items.length) {
      return res.status(400).json({ success: false, message: 'Cart must contain at least one item' });
    }

    let formattedAddress = '';
    let finalPincode = pincode || '';

    if (typeof shippingAddress === 'object' && shippingAddress !== null) {
      formattedAddress = [
        shippingAddress.building,
        shippingAddress.addressLine,
        shippingAddress.city,
        shippingAddress.state,
        shippingAddress.country || 'India',
      ].filter(Boolean).join(', ');
      if (!finalPincode && shippingAddress.pincode) {
        finalPincode = shippingAddress.pincode;
      }
    } else {
      formattedAddress = String(shippingAddress || '');
    }

    // Server-side product price & stock validation
    const productIds = items.map((i) => i.productId || i.product_id).filter(Boolean);
    const { data: dbProducts } = await supabase
      .from('products')
      .select('*, product_variants(*)')
      .in('id', productIds);

    let subtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const targetId = item.productId || item.product_id;
      const dbProduct = dbProducts ? dbProducts.find((p) => p.id === targetId || p.slug === targetId) : null;
      let unitPrice = Number(item.unit_price || item.unitPrice || 149);
      let title = item.title || 'MILASTY Artisan Bake';

      if (dbProduct) {
        title = dbProduct.title;
        const vName = item.variantName || item.variant_name;
        const vId = item.variantId || item.variant_id;
        const vWeight = item.variantWeight || item.variant_weight;

        const dbVariant = (dbProduct.product_variants || []).find((v) => 
          (vId && v.id === vId) || 
          (vWeight && (v.weight === vWeight || v.name === vWeight)) || 
          (vName && (v.name === vName || v.weight === vName))
        );

        if (dbVariant) {
          unitPrice = Number(dbVariant.price);
        }
      }

      const itemTotal = unitPrice * item.quantity;
      subtotal += itemTotal;

      const rawNote = item.customization_note || item.customizationNote || item.instruction || null;
      const cleanNote = rawNote ? String(rawNote).trim().slice(0, 300) : null;

      validatedItems.push({
        product_id: dbProduct ? dbProduct.id : null,
        product_title: title,
        product_image: item.image || item.product_image || (dbProduct ? dbProduct.primary_image : null) || null,
        variant_id: item.variantId || item.variant_id || null,
        variant_name: item.variantName || item.variant_name || item.variantWeight || item.variant_weight || 'Standard Pack',
        unit_price: unitPrice,
        quantity: item.quantity,
        total_price: itemTotal,
        customization_note: cleanNote || null,
      });
    }

    // ── Shipping: automatic cheapest-valid-rate selection (server only) ──────
    if (!/^\d{6}$/.test(String(finalPincode).trim())) {
      return res.status(400).json({ success: false, message: 'A valid 6-digit delivery pincode is required.' });
    }
    finalPincode = String(finalPincode).trim();
    const deliveryCity = typeof shippingAddress === 'object' && shippingAddress ? String(shippingAddress.city || '').trim() : '';
    const deliveryState = typeof shippingAddress === 'object' && shippingAddress ? String(shippingAddress.state || '').trim() : '';

    let shipPackage;
    try {
      shipPackage = await calculatePackage(validatedItems);
    } catch (pkgErr) {
      console.error('[PAYMENT SESSION] Package calculation failed:', pkgErr.message);
      return res.status(422).json({
        success: false,
        code: 'PACKAGE_UNAVAILABLE',
        message: 'We could not calculate delivery for an item in your cart. Please contact MILASTY support.',
      });
    }
    const packageWeightKg = shipPackage.totalWeightKg;

    // Reuse the exact quote the checkout displayed when it still matches this package; else re-quote.
    let shippingQuote = getShippingQuote(quoteId);
    if (shippingQuote && (shippingQuote.pincode !== finalPincode || Number(shippingQuote.weightKg) !== Number(packageWeightKg))) {
      console.log(`[PAYMENT SESSION] Quote ${quoteId} no longer matches (pincode/weight changed) — re-quoting`);
      shippingQuote = null;
    }
    if (!shippingQuote) {
      try {
        const live = await fetchLiveShiprathRate({ pincode: finalPincode, pkg: shipPackage, declaredValue: subtotal });
        shippingQuote = {
          pincode: live.pincode,
          weightKg: live.weight,
          dimensions: live.dimensions,
          selectedRate: live.selectedRate,
          rateList: live.rateList,
        };
      } catch (rateErr) {
        console.error('[PAYMENT SESSION] Shipping rate unavailable:', rateErr.message);
        return res.status(422).json({
          success: false,
          code: 'SHIPPING_UNAVAILABLE',
          message: 'Delivery is not available for this pincode right now. Please check the pincode or try again shortly.',
        });
      }
    }

    const chosenRate = shippingQuote.selectedRate; // cheapest valid rate — never chosen by the client
    const allRates = shippingQuote.rateList;
    const deliveryFee = Number(chosenRate.total_charges);
    console.log(`[PAYMENT SESSION] Auto-selected "${chosenRate.service_name}" ₹${deliveryFee} (carrier_id="${chosenRate.carrier_id}" courier_id="${chosenRate.courier_id}" product_id="${chosenRate.product_id}") for ${finalPincode} @ ${packageWeightKg}kg`);

    // The customer must pay exactly what they were shown. If the rate moved, show the new amount first.
    if (expectedDeliveryFee !== null && expectedDeliveryFee !== undefined && Number(expectedDeliveryFee) !== deliveryFee) {
      const newQuoteId = saveShippingQuote(shippingQuote);
      return res.status(409).json({
        success: false,
        code: 'SHIPPING_CHANGED',
        message: `The delivery charge for your pincode has been updated to ₹${deliveryFee}. Please review your total and pay again.`,
        deliveryFee,
        quoteId: newQuoteId,
      });
    }

    // Server-side Coupon discount calculation (Single Source of Truth)
    let discountAmount = 0;
    let validatedCouponId = null;
    let validatedCouponCode = null;

    if (couponCode) {
      try {
        const cleanCode = String(couponCode).toUpperCase().trim();
        const { data: coupon } = await supabase
          .from('coupons')
          .select('*')
          .eq('code', cleanCode)
          .eq('is_active', true)
          .maybeSingle();

        if (coupon) {
          const now = new Date();
          const startsValid = !coupon.starts_at || new Date(coupon.starts_at) <= now;
          const expiresValid = !coupon.expires_at || new Date(coupon.expires_at) > now;
          const minOrder = Number(coupon.min_order_amount || 0);

          if (startsValid && expiresValid && subtotal >= minOrder) {
            validatedCouponId = coupon.id;
            validatedCouponCode = coupon.code;
            const valNum = Number(coupon.discount_value || 0);
            const maxCap = Number(coupon.max_discount || 0);

            if (coupon.discount_type === 'percentage') {
              let calc = Math.round((subtotal * valNum) / 100);
              if (maxCap > 0 && calc > maxCap) {
                calc = maxCap;
              }
              discountAmount = Math.min(subtotal, calc);
            } else {
              discountAmount = Math.min(subtotal, valNum);
            }
          }
        }
      } catch (e) {
        console.warn('Coupon calculation notice:', e.message);
      }
    }

    const grandTotal = Math.max(0, subtotal - discountAmount + deliveryFee);
    const amountInPaise = Math.round(grandTotal * 100);

    // Server prices are authoritative. If they differ from what the checkout displayed (price change,
    // cart edited on another device), show the customer the real total before opening Razorpay.
    if (expectedGrandTotal !== null && expectedGrandTotal !== undefined && Math.round(Number(expectedGrandTotal) * 100) !== amountInPaise) {
      return res.status(409).json({
        success: false,
        code: 'TOTAL_CHANGED',
        message: `Your order total has been updated to ₹${grandTotal}. Please review and pay again.`,
        subtotal,
        discountAmount,
        deliveryFee,
        grandTotal,
        quoteId: saveShippingQuote(shippingQuote),
      });
    }

    // Create Razorpay Order with EXACT grand total
    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`,
    };

    let razorpayOrder;
    const razorpay = getRazorpayInstance();
    razorpayOrder = await razorpay.orders.create(options);

    // Log calculation details
    console.log('--- RAZORPAY PAYMENT SESSION CREATED ---', {
      razorpay_order_id: razorpayOrder.id,
      subtotal_paise: Math.round(subtotal * 100),
      discount_paise: Math.round(discountAmount * 100),
      delivery_charge_paise: Math.round(deliveryFee * 100),
      final_total_paise: amountInPaise,
      grandTotalRupees: grandTotal,
      couponCode: validatedCouponCode,
      customerName,
      pincode: finalPincode,
    });

    let resolvedUserId = req.user ? (req.user.id || req.user._id) : userId;
    if (!resolvedUserId && (finalEmail || finalPhone)) {
      try {
        let query = supabase.from('users').select('id');
        if (finalEmail) {
          query = query.eq('email', finalEmail.toLowerCase().trim());
        } else if (finalPhone) {
          query = query.eq('phone', finalPhone.trim());
        }
        const { data: matchedUser } = await query.maybeSingle();
        if (matchedUser?.id) {
          resolvedUserId = matchedUser.id;
        }
      } catch (e) {
        // ignore
      }
    }

    const customizationSummary = validatedItems
      .filter((i) => i.customization_note)
      .map((i) => `${i.product_title} (${i.variant_name}): "${i.customization_note}"`)
      .join(' | ');

    // Save session in memory store — includes the selected rate quote so booking uses the exact same carrier
    const sessionData = {
      id: razorpayOrder.id,
      razorpay_order_id: razorpayOrder.id,
      user_id: resolvedUserId || null,
      customerName: customerName || req.user?.name || 'Customer',
      customerEmail: finalEmail || req.user?.email || '',
      customerPhone: finalPhone || req.user?.phone || '',
      shippingAddress: formattedAddress,
      pincode: finalPincode,
      deliveryCity,
      deliveryState,
      items: validatedItems,
      subtotal,
      deliveryFee,
      discountAmount,
      coupon_id: validatedCouponId,
      coupon_code: validatedCouponCode,
      grandTotal,
      amountInPaise,
      notes: customizationSummary || null,
      status: 'created',
      createdAt: new Date().toISOString(),
      // ── Shiprath quote: the exact selected rate (IDs unchanged) + the other valid options from the
      //    SAME rate response, used as the automatic booking fallback order ──
      selectedRate: chosenRate,
      rateList: allRates,
      packageWeightKg,
      packageDimensions: shippingQuote.dimensions || null,
    };

    // Drop sessions older than 24h so the in-memory store can't grow forever
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    for (const [key, s] of paymentSessions) {
      if (new Date(s.createdAt).getTime() < cutoff) paymentSessions.delete(key);
    }
    await saveSession(razorpayOrder.id, sessionData);

    // Customer-safe response: amounts only — no courier names, IDs or rate list
    return res.json({
      success: true,
      keyId: process.env.RAZORPAY_KEY_ID,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency || 'INR',
      grandTotal,
      deliveryFee,
      subtotal,
      discountAmount,
      couponCode: validatedCouponCode,
    });
  } catch (error) {
    console.error('Error in createPaymentSession:', error);
    res.status(500).json({
      success: false,
      message: 'Error initiating payment checkout session',
      error: error.message,
    });
  }
};

/**
 * Legacy support endpoint for /create
 */
export const createRazorpayOrder = createPaymentSession;

// In-memory set to prevent race conditions during concurrent webhook & frontend verification
const activeFinalizations = new Set();

/**
 * 2. IDEMPOTENT FINALIZATION OF MILASTY ORDER UPON VERIFIED PAYMENT
 */
export const finalizeOrderFromPayment = async ({
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature = null,
  sessionOverride = null,
}) => {
  const lockKey = razorpay_payment_id || razorpay_order_id;

  // Prevent concurrent duplicate executions for the same payment/order
  if (lockKey && activeFinalizations.has(lockKey)) {
    console.log('[ORDER FINALIZATION] Concurrent finalization already in progress for key:', lockKey);
    let attempts = 0;
    while (attempts < 10) {
      await new Promise((r) => setTimeout(r, 400));
      if (razorpay_payment_id || razorpay_order_id) {
        // limit(1), not maybeSingle(): maybeSingle() errors (returns null) when legacy duplicate
        // rows exist, which would let a retry create yet another duplicate order.
        const { data: existingRows } = await supabase
          .from('orders')
          .select('*, order_items(*)')
          .or(`payment_id.eq.${razorpay_payment_id || 'N/A'},payment_id.eq.${razorpay_order_id || 'N/A'}`)
          .order('created_at', { ascending: true })
          .limit(1);
        const existing = existingRows?.[0];
        if (existing) {
          console.log('[ORDER FINALIZATION] Returned existing order from concurrent wait:', existing.order_number);
          return existing;
        }
      }
      attempts++;
    }
  }

  if (lockKey) activeFinalizations.add(lockKey);

  try {
    // Idempotency check: check if order already created in Supabase
    if (razorpay_payment_id || razorpay_order_id) {
      const { data: existingOrderRows, error: existingErr } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .or(`payment_id.eq.${razorpay_payment_id || 'N/A'},payment_id.eq.${razorpay_order_id || 'N/A'}`)
        .order('created_at', { ascending: true })
        .limit(1);

      if (existingErr) {
        // Never create an order when we can't confirm one doesn't already exist
        throw new Error(`Idempotency check failed: ${existingErr.message}`);
      }
      const existingOrder = existingOrderRows?.[0];

      if (existingOrder) {
        console.log('[ORDER FINALIZATION] Order already exists (idempotent duplicate prevented):', existingOrder.order_number);
        return existingOrder;
      }
    }


  // Get session data
  let session = sessionOverride || await loadSession(razorpay_order_id);

  const orderNumber = `MIL-${Date.now().toString().slice(-6)}`;

  // Base order payload — only columns guaranteed to exist in the schema
  const baseOrderPayload = {
    order_number: orderNumber,
    user_id: session?.user_id || null,
    customer_name: session?.customerName || 'Customer',
    customer_email: session?.customerEmail || '',
    customer_phone: session?.customerPhone || '',
    shipping_address: session?.shippingAddress || '',
    pincode: session?.pincode || '',
    subtotal: session?.subtotal || 0,
    delivery_fee: session?.deliveryFee || 0,
    discount_amount: session?.discountAmount || 0,
    coupon_id: session?.coupon_id || null,
    coupon_code: session?.coupon_code || null,
    grand_total: session?.grandTotal || 0,
    payment_method: 'razorpay',
    payment_id: razorpay_payment_id || razorpay_order_id || null,
    payment_status: 'paid',
    order_status: 'confirmed',
    shipment_status: 'pending',
    // ── Stored Shiprath rate quote — used for booking, prevents re-fetch/drift ──
    // IDs are stored exactly as the Rate API returned them: an empty courier_id stays "".
    selected_carrier_id: session?.selectedRate ? String(session.selectedRate.carrier_id ?? '') : null,
    selected_courier_id: session?.selectedRate ? String(session.selectedRate.courier_id ?? '') : null,
    selected_product_id: session?.selectedRate ? String(session.selectedRate.product_id ?? '') : null,
    selected_service_name: session?.selectedRate?.service_name || null,
    selected_delivery_fee: session?.deliveryFee || 0,
  };

  if (!session) {
    console.error(`[ORDER FINALIZATION] ⚠️ No payment session in memory for ${razorpay_order_id} (server restarted between checkout and payment?). Order will be created from payment data only — admin must review items/address.`);
  }

  let newOrder = null;

  try {
    // Try inserting with notes column first
    let { data: orderRow, error: insertErr } = await supabase
      .from('orders')
      .insert([{ ...baseOrderPayload, notes: session?.notes || null }])
      .select()
      .single();

    // If notes column doesn't exist in schema, retry without it
    if (insertErr && (insertErr.message?.toLowerCase().includes('notes') || insertErr.code === '42703')) {
      console.warn('[PAYMENT] notes column not in schema, retrying without it');
      const retry = await supabase
        .from('orders')
        .insert([baseOrderPayload])
        .select()
        .single();
      orderRow = retry.data;
      insertErr = retry.error;
    }

    if (insertErr || !orderRow) {
      console.error('[PAYMENT] Failed inserting order into Supabase:', insertErr?.message || 'no data returned');
      throw new Error(`Order database insert failed: ${insertErr?.message || 'no data returned'}`);
    }

    newOrder = orderRow;

    // Optional columns (added by migration 15) — written separately so a missing column never
    // blocks order creation after a successful payment.
    const { skipped: skippedCols } = await safeUpdateOrder(newOrder.id, {
      razorpay_order_id: razorpay_order_id || null,
      razorpay_payment_id: razorpay_payment_id || null,
      delivery_city: session?.deliveryCity || null,
      delivery_state: session?.deliveryState || null,
      selected_rate_snapshot: session?.selectedRate || null,
      shipping_rate_options: Array.isArray(session?.rateList) ? session.rateList.map(({ raw, ...r }) => r) : null,
      quoted_weight_kg: session?.packageWeightKg ?? null,
      package_weight_kg: session?.packageWeightKg ?? null,
      package_length_cm: session?.packageDimensions?.length ?? null,
      package_width_cm: session?.packageDimensions?.width ?? null,
      package_height_cm: session?.packageDimensions?.height ?? null,
    });
    if (skippedCols.length) {
      console.warn(`[ORDER FINALIZATION] Columns missing in orders table (run scripts/15_shipping_automation_columns.sql): ${skippedCols.join(', ')}`);
    }
    Object.assign(newOrder, {
      delivery_city: session?.deliveryCity || null,
      delivery_state: session?.deliveryState || null,
    });

    if (session?.items && session.items.length > 0) {
      // Full row including optional columns (may not exist in older DB schemas)
      const orderItemsRows = session.items.map((item) => ({
        order_id: newOrder.id,
        product_id: item.product_id,
        product_title: item.product_title,
        product_image: item.product_image || null,
        variant_id: item.variant_id || null,
        variant_name: item.variant_name,
        unit_price: item.unit_price,
        quantity: item.quantity,
        total_price: item.total_price,
        customization_note: item.customization_note || item.customizationNote || item.instruction || item.notes || null,
      }));

      // Guaranteed-only columns that always exist in the schema
      const guaranteedItemRows = session.items.map((item) => ({
        order_id: newOrder.id,
        product_id: item.product_id,
        product_title: item.product_title,
        variant_name: item.variant_name || 'Standard Pack',
        unit_price: item.unit_price,
        quantity: item.quantity,
        total_price: item.total_price,
      }));

      let { data: insertedItems, error: itemsErr } = await supabase
        .from('order_items')
        .insert(orderItemsRows)
        .select();

      if (itemsErr) {
        console.warn('[PAYMENT] order_items full insert failed, retrying with guaranteed columns:', itemsErr.message);
        const { data: fbItems, error: fbErr } = await supabase
          .from('order_items')
          .insert(guaranteedItemRows)
          .select();
        if (fbErr) {
          console.warn('[PAYMENT] order_items guaranteed insert also failed:', fbErr.message);
        }
        // Merge back optional data client-side
        insertedItems = fbItems ? fbItems.map((item, idx) => ({
          ...item,
          product_image: session.items[idx]?.product_image || null,
          variant_id: session.items[idx]?.variant_id || null,
          customization_note: session.items[idx]?.customization_note || null,
        })) : null;
      }

      if (insertedItems) {
        newOrder.order_items = insertedItems;
      }
    }

    // Record Coupon Usage safely upon successful order completion
    if (session?.coupon_id || session?.coupon_code) {
      try {
        const cCode = session.coupon_code;
        const cId = session.coupon_id;

        // Increment coupon usage_count
        const { data: cData } = await supabase
          .from('coupons')
          .select('id, usage_count')
          .or(`id.eq.${cId || '00000000-0000-0000-0000-000000000000'},code.eq.${cCode}`)
          .maybeSingle();

        if (cData) {
          await supabase
            .from('coupons')
            .update({
              usage_count: Number(cData.usage_count || 0) + 1,
              updated_at: new Date().toISOString()
            })
            .eq('id', cData.id);

          // Record entry in coupon_usages
          if (session.user_id) {
            await supabase
              .from('coupon_usages')
              .insert([{
                coupon_id: cData.id,
                user_id: session.user_id,
                order_id: newOrder.id,
                discount_amount: session.discountAmount || 0,
              }]);
          }
        }
      } catch (couponUsageErr) {
        console.warn('Coupon usage record notice:', couponUsageErr.message);
      }
    }
  } catch (e) {
    console.error('[PAYMENT] Exception creating finalized order:', e.message);
    throw e; // Re-throw so verifyRazorpayPayment returns a 500
  }

  // Stock Deduction
  if (session?.items && session.items.length > 0) {
    for (const item of session.items) {
      const targetId = item.product_id;
      const vName = item.variant_name;
      if (targetId) {
        try {
          const { data: dbProduct } = await supabase
            .from('products')
            .select('*, product_variants(*)')
            .eq('id', targetId)
            .maybeSingle();

          if (dbProduct) {
            const dbVariant = (dbProduct.product_variants || []).find((v) => 
              v.name === vName || v.weight === vName || v.id === vName
            );
            const variantStocksMap = { ...(dbProduct.nutrition_facts?.variant_stocks || {}) };
            const keyName = vName || dbVariant?.id || dbVariant?.weight || dbVariant?.name;
            const currentStock = dbVariant && dbVariant.stock !== undefined && dbVariant.stock !== null
              ? Number(dbVariant.stock)
              : (keyName && variantStocksMap[keyName] !== undefined 
                ? Number(variantStocksMap[keyName]) 
                : (dbVariant?.in_stock ? 50 : 0));

            const newStock = Math.max(0, currentStock - (item.quantity || 1));

            if (keyName) variantStocksMap[keyName] = newStock;
            const updatedNutritionFacts = {
              ...(typeof dbProduct.nutrition_facts === 'object' && dbProduct.nutrition_facts !== null ? dbProduct.nutrition_facts : {}),
              variant_stocks: variantStocksMap,
            };

            await supabase
              .from('products')
              .update({ nutrition_facts: updatedNutritionFacts })
              .eq('id', dbProduct.id);

            if (dbVariant) {
              const updatePayload = { in_stock: newStock > 0 };
              if (dbVariant.stock !== undefined && dbVariant.stock !== null) {
                updatePayload.stock = newStock;
              }
              await supabase
                .from('product_variants')
                .update(updatePayload)
                .eq('id', dbVariant.id);
            }
          }
        } catch (stkErr) {
          console.warn('Stock deduction notice:', stkErr.message);
        }
      }
    }
  }

  // Update session status to paid
  if (session) {
    session.status = 'paid';
    await setSessionStatus(razorpay_order_id, 'paid');
  }

  if (!newOrder) {
    throw new Error('Order could not be persisted to the database after payment verification');
  }
  return newOrder;

  } finally {
    if (lockKey) activeFinalizations.delete(lockKey);
  }
};

/**
 * Auto-book a Shiprath shipment for a paid order, at most once.
 * Atomically claims the order (pending → creating) so concurrent callers
 * (frontend verify + multiple Razorpay webhook events) cannot double-book.
 */
const autoBookShipment = async (orderId, tag = '[SHIPRATH]') => {
  try {
    // Only a never-attempted order can be auto-booked. 'creating', 'booked' and 'failed' are skipped;
    // a failed booking is retried by admin, never silently by a repeated webhook.
    const { claimed, error: claimErr } = await claimOrderForBooking(orderId, ['pending', 'not_created', null]);

    if (claimErr) {
      console.error(`${tag} Could not claim order for auto-book:`, claimErr.message);
      return;
    }
    if (!claimed) {
      console.log(`${tag} Order ${orderId} already booked, failed, or booking in progress — skipping`);
      return;
    }

    const { data: freshOrder } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', orderId)
      .maybeSingle();
    if (!freshOrder) return;

    console.log(`${tag} ${freshOrder.order_number} → Starting auto-book`);
    // bookShiprathShipment persists the outcome itself (booked + AWB, or failed + exact error)
    const result = await bookShiprathShipment(freshOrder);
    if (result?.success) {
      console.log(`${tag} ${freshOrder.order_number} → ✅ Auto-book SUCCESS AWB: ${result.awb} Courier: ${result.courier_name}${result.fallbackUsed ? ' (fallback)' : ''}`);
    } else {
      console.error(`${tag} ${freshOrder.order_number} → ❌ Auto-book FAILED: ${result?.rawError || result?.error || 'Unknown error'}`);
    }
  } catch (shipErr) {
    console.error(`${tag} Auto-book exception:`, shipErr.message);
    await safeUpdateOrder(orderId, { shipment_status: 'failed', shipment_error: shipErr.message });
  }
};


/**
 * 3. VERIFY RAZORPAY PAYMENT SIGNATURE & AMOUNT
 * POST /api/payments/verify
 */
export const verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

    const rzpOrderId = razorpay_order_id || orderId;

    if (!rzpOrderId || !razorpay_payment_id) {
      return res.status(400).json({ success: false, message: 'Missing Razorpay order or payment details' });
    }

    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    if (!key_secret) {
      console.error('[VERIFY] RAZORPAY_KEY_SECRET not configured');
      return res.status(500).json({ success: false, message: 'Payment verification not configured on server.' });
    }

    const hmac = crypto.createHmac('sha256', key_secret);
    hmac.update((rzpOrderId || '') + '|' + (razorpay_payment_id || ''));
    const generated_signature = hmac.digest('hex');

    if (!razorpay_signature || generated_signature !== razorpay_signature) {
      console.warn('[VERIFY] Invalid Razorpay signature. Expected:', generated_signature, 'Got:', razorpay_signature);
      return res.status(400).json({ success: false, message: 'Invalid payment signature. Payment not verified.' });
    }

    // Finalize order into database
    const order = await finalizeOrderFromPayment({
      razorpay_order_id: rzpOrderId,
      razorpay_payment_id,
      razorpay_signature,
    });

    // Auto-book Shiprath B2C shipment (fire-and-forget — does not block response)
    if (order?.id) {
      setImmediate(() => autoBookShipment(order.id, '[SHIPRATH]'));
    }

    return res.json({
      success: true,
      message: 'Payment verified and order confirmed successfully',
      orderId: order.id || order.order_number,
      order,
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ success: false, message: 'Error verifying payment', error: error.message });
  }
};

/**
 * 4. CANCEL PAYMENT SESSION (USER CLOSED / CANCELLED RAZORPAY)
 * POST /api/payments/cancel
 */
export const cancelPaymentSession = async (req, res) => {
  try {
    const { razorpay_order_id } = req.body;
    if (razorpay_order_id) {
      await setSessionStatus(razorpay_order_id, 'cancelled');
    }
    console.log('[PAYMENT SESSION CANCELLED] No order created in database for:', razorpay_order_id);
    return res.json({ success: true, message: 'Payment session marked as cancelled. No order created.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error cancelling payment session' });
  }
};

/**
 * 5. FAIL PAYMENT SESSION
 * POST /api/payments/fail
 */
export const failPaymentSession = async (req, res) => {
  try {
    const { razorpay_order_id } = req.body;
    if (razorpay_order_id) {
      await setSessionStatus(razorpay_order_id, 'failed');
    }
    console.log('[PAYMENT SESSION FAILED] No order created in database for:', razorpay_order_id);
    return res.json({ success: true, message: 'Payment session marked as failed. No order created.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error failing payment session' });
  }
};

/**
 * 6. RAZORPAY WEBHOOK ENDPOINT
 * POST /api/payments/webhook
 */
export const handleRazorpayWebhook = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;
    const receivedSignature = req.headers['x-razorpay-signature'];

    // req.body will be a raw Buffer (due to express.raw middleware in server.js)
    const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body));

    if (!webhookSecret) {
      console.warn('[WEBHOOK] RAZORPAY_WEBHOOK_SECRET not set — skipping signature verification (not recommended for production)');
    } else if (!receivedSignature) {
      console.warn('[WEBHOOK] No x-razorpay-signature header received — rejecting');
      return res.status(400).json({ status: 'missing_signature' });
    } else {
      const hmac = crypto.createHmac('sha256', webhookSecret);
      hmac.update(rawBody);
      const expectedSignature = hmac.digest('hex');

      if (expectedSignature !== receivedSignature) {
        console.warn('[WEBHOOK] Invalid Razorpay webhook signature');
        return res.status(400).json({ status: 'invalid_signature' });
      }
    }

    // Parse the raw body as JSON for event processing
    const bodyData = Buffer.isBuffer(rawBody) ? JSON.parse(rawBody.toString('utf8')) : req.body;
    const event = bodyData.event;
    const payload = bodyData.payload;

    console.log('[WEBHOOK RECEIVED] Event:', event);

    if (event === 'payment.captured' || event === 'payment.authorized' || event === 'order.paid') {
      const paymentEntity = payload?.payment?.entity;
      const orderEntity = payload?.order?.entity;

      const razorpay_order_id = paymentEntity?.order_id || orderEntity?.id;
      const razorpay_payment_id = paymentEntity?.id;

      if (razorpay_order_id && razorpay_payment_id) {
        const finalizedOrder = await finalizeOrderFromPayment({
          razorpay_order_id,
          razorpay_payment_id,
        });

        // Auto-book Shiprath shipment (fire-and-forget, same as /payments/verify path)
        if (finalizedOrder?.id) {
          setImmediate(() => autoBookShipment(finalizedOrder.id, '[SHIPRATH WEBHOOK]'));
        }
      }
    } else if (event === 'payment.failed') {
      const paymentEntity = payload?.payment?.entity;
      const razorpay_order_id = paymentEntity?.order_id;
      if (razorpay_order_id) {
        await setSessionStatus(razorpay_order_id, 'failed');
      }
    }

    return res.json({ status: 'ok' });
  } catch (error) {
    console.error('Error handling Razorpay webhook:', error);
    res.status(500).json({ status: 'error', error: error.message });
  }
};
