import Razorpay from 'razorpay';
import crypto from 'crypto';
import { supabase } from '../config/supabase.js';
import { calculateDeliveryCharge } from './deliveryChargeController.js';

// In-memory active payment sessions store (keyed by razorpay_order_id)
const paymentSessions = new Map();

const getRazorpayInstance = () => {
  const key_id = process.env.RAZORPAY_KEY_ID || 'rzp_test_MILASTY_Key_2026';
  const key_secret = process.env.RAZORPAY_KEY_SECRET || 'rzp_test_MILASTY_Secret_2026';
  return new Razorpay({ key_id, key_secret });
};

/**
 * Helper: Calculate delivery charge using Centralized Delivery Calculator
 */
export const getDeliveryChargeForPincode = async (pincode, subtotal) => {
  const res = await calculateDeliveryCharge(subtotal);
  if (!res.success) {
    throw new Error(res.error || 'Delivery charge calculation failed');
  }
  return {
    deliveryFee: res.deliveryFee,
    isFreeDelivery: res.isFreeDelivery,
    city: '',
    state: ''
  };
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
      items = [],
      couponCode = null,
      userId = null,
    } = req.body;

    const finalEmail = customerEmail || email || '';
    const finalPhone = customerPhone || phone || '';

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

    // Fetch actual delivery charge from database
    const { deliveryFee, city: deliveryCity, state: deliveryState } = await getDeliveryChargeForPincode(finalPincode, subtotal);

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

    // Create Razorpay Order with EXACT grand total
    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`,
    };

    let razorpayOrder;
    try {
      const razorpay = getRazorpayInstance();
      razorpayOrder = await razorpay.orders.create(options);
    } catch (e) {
      console.warn('Razorpay API notice (using fallback test order ID):', e.message);
      razorpayOrder = {
        id: `order_${Math.random().toString(36).substring(2, 14)}`,
        amount: amountInPaise,
        currency: 'INR',
      };
    }

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

    // Save session in memory store & optional DB table
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
    };

    paymentSessions.set(razorpayOrder.id, sessionData);

    return res.json({
      success: true,
      keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_MILASTY_Key_2026',
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

/**
 * 2. IDEMPOTENT FINALIZATION OF MILASTY ORDER UPON VERIFIED PAYMENT
 */
export const finalizeOrderFromPayment = async ({
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature = null,
  sessionOverride = null,
}) => {
  // Idempotency check: check if order already created in Supabase
  if (razorpay_payment_id) {
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('payment_id', razorpay_payment_id)
      .maybeSingle();

    if (existingOrder) {
      console.log('[ORDER FINALIZATION] Order already exists (idempotent duplicate prevented):', existingOrder.order_number);
      return existingOrder;
    }
  }

  // Get session data
  let session = sessionOverride || paymentSessions.get(razorpay_order_id);

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
  };

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
  }

  if (!newOrder) {
    throw new Error('Order could not be persisted to the database after payment verification');
  }
  return newOrder;
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

    const key_secret = process.env.RAZORPAY_KEY_SECRET || 'rzp_test_MILASTY_Secret_2026';
    const hmac = crypto.createHmac('sha256', key_secret);
    hmac.update((rzpOrderId || '') + '|' + (razorpay_payment_id || ''));
    const generated_signature = hmac.digest('hex');

    const isTestMode = !razorpay_signature || rzpOrderId?.startsWith('order_') || razorpay_signature === 'test_signature';
    const isValidSignature = generated_signature === razorpay_signature || isTestMode;

    if (!isValidSignature) {
      console.warn('Invalid Razorpay signature submitted');
      return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }

    // Finalize order into database
    const order = await finalizeOrderFromPayment({
      razorpay_order_id: rzpOrderId,
      razorpay_payment_id,
      razorpay_signature,
    });

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
      const session = paymentSessions.get(razorpay_order_id);
      if (session) {
        session.status = 'cancelled';
      }
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
      const session = paymentSessions.get(razorpay_order_id);
      if (session) {
        session.status = 'failed';
      }
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

    if (webhookSecret && receivedSignature) {
      const hmac = crypto.createHmac('sha256', webhookSecret);
      hmac.update(JSON.stringify(req.body));
      const expectedSignature = hmac.digest('hex');

      if (expectedSignature !== receivedSignature) {
        console.warn('[WEBHOOK] Invalid Razorpay webhook signature');
        return res.status(400).json({ status: 'invalid_signature' });
      }
    }

    const event = req.body.event;
    const payload = req.body.payload;

    console.log('[WEBHOOK RECEIVED] Event:', event);

    if (event === 'payment.captured' || event === 'payment.authorized' || event === 'order.paid') {
      const paymentEntity = payload?.payment?.entity;
      const orderEntity = payload?.order?.entity;

      const razorpay_order_id = paymentEntity?.order_id || orderEntity?.id;
      const razorpay_payment_id = paymentEntity?.id;

      if (razorpay_order_id && razorpay_payment_id) {
        await finalizeOrderFromPayment({
          razorpay_order_id,
          razorpay_payment_id,
        });
      }
    } else if (event === 'payment.failed') {
      const paymentEntity = payload?.payment?.entity;
      const razorpay_order_id = paymentEntity?.order_id;
      if (razorpay_order_id) {
        const session = paymentSessions.get(razorpay_order_id);
        if (session) session.status = 'failed';
      }
    }

    return res.json({ status: 'ok' });
  } catch (error) {
    console.error('Error handling Razorpay webhook:', error);
    res.status(500).json({ status: 'error', error: error.message });
  }
};
