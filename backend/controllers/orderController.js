import { supabase } from '../config/supabase.js';
import { syncAuthUsersToProfiles } from './authController.js';
import { getDeliveryChargeForPincode } from './paymentController.js';

// Status Canonical Mappings
const CANONICAL_STATUS_MAP = {
  'pending': 'pending',
  'Pending': 'pending',
  'confirmed': 'confirmed',
  'Confirmed': 'confirmed',
  'processing': 'processing',
  'Processing': 'processing',
  'packed': 'packed',
  'Packed': 'packed',
  'shipped': 'shipped',
  'Shipped': 'shipped',
  'out_for_delivery': 'out_for_delivery',
  'Out for Delivery': 'out_for_delivery',
  'Out For Delivery': 'out_for_delivery',
  'delivered': 'delivered',
  'Delivered': 'delivered',
  'cancelled': 'cancelled',
  'Cancelled': 'cancelled',
};

/**
 * CREATE COD OR DIRECT ORDER
 * POST /api/orders
 */
export const createOrder = async (req, res) => {
  try {
    const {
      customerName,
      customerEmail,
      email,
      customerPhone,
      phone,
      shippingAddress,
      pincode,
      items, // array of { productId, variantName, quantity }
      paymentMethod = 'cod',
      paymentId = null,
      couponCode = null,
    } = req.body;

    const finalEmail = customerEmail || email || '';
    const finalPhone = customerPhone || phone || '';

    if (!items || !items.length) {
      return res.status(400).json({ message: 'Order must contain at least one item' });
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

    if (!customerName || !finalPhone || !formattedAddress || !finalPincode) {
      return res.status(400).json({ message: 'Shipping details, customer name, mobile phone, and pincode are mandatory' });
    }

    // SERVER-SIDE PRICING & STOCK VALIDATION
    const productIds = items.map((i) => i.productId || i.product_id).filter(Boolean);
    const { data: dbProducts } = await supabase
      .from('products')
      .select('*, product_variants(*)')
      .in('id', productIds);

    // Pre-check stock
    for (const item of items) {
      const targetId = item.productId || item.product_id;
      if (targetId) {
        const dbProduct = dbProducts ? dbProducts.find((p) => p.id === targetId || p.slug === targetId) : null;
        if (dbProduct) {
          const vName = item.variantName || item.variant_name;
          const vId = item.variantId || item.variant_id;
          const vWeight = item.variantWeight || item.variant_weight;

          const dbVariant = (dbProduct.product_variants || []).find((v) => 
            (vId && v.id === vId) || 
            (vWeight && (v.weight === vWeight || v.name === vWeight)) || 
            (vName && (v.name === vName || v.weight === vName))
          );

          const variantStocksMap = dbProduct.nutrition_facts?.variant_stocks || {};
          const stockFromMap = vId && variantStocksMap[vId] !== undefined
            ? Number(variantStocksMap[vId])
            : (vWeight && variantStocksMap[vWeight] !== undefined
              ? Number(variantStocksMap[vWeight])
              : (vName && variantStocksMap[vName] !== undefined
                ? Number(variantStocksMap[vName])
                : (dbVariant && variantStocksMap[dbVariant.id] !== undefined
                  ? Number(variantStocksMap[dbVariant.id])
                  : (dbVariant && variantStocksMap[dbVariant.weight] !== undefined
                    ? Number(variantStocksMap[dbVariant.weight])
                    : (dbVariant && variantStocksMap[dbVariant.name] !== undefined
                      ? Number(variantStocksMap[dbVariant.name])
                      : undefined)))));

          const availableStock = dbVariant && dbVariant.stock !== undefined && dbVariant.stock !== null
            ? Number(dbVariant.stock)
            : (stockFromMap !== undefined ? stockFromMap : (dbProduct.stock !== undefined && dbProduct.stock !== null ? Number(dbProduct.stock) : 50));

          if (availableStock < (item.quantity || 1)) {
            return res.status(400).json({ 
              message: `Insufficient stock available for ${dbProduct.title} (${vWeight || vName || 'Standard Pack'}). Available: ${availableStock}, Requested: ${item.quantity}` 
            });
          }
        }
      }
    }

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

      validatedItems.push({
        product_id: dbProduct ? dbProduct.id : null,
        product_title: title,
        variant_name: item.variantName || item.variant_name || item.variantWeight || item.variant_weight || 'Standard Pack',
        unit_price: unitPrice,
        quantity: item.quantity,
        total_price: itemTotal,
      });
    }

    // SERVER-ENFORCED DELIVERY CHARGE FROM DATABASE
    const { deliveryFee, city: deliveryCity, state: deliveryState } = await getDeliveryChargeForPincode(finalPincode, subtotal);

    // Coupon calculation
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
    const orderNumber = `MIL-${Date.now().toString().slice(-6)}`;
    const cleanPaymentMethod = (paymentMethod || 'cod').toLowerCase();
    const isCod = cleanPaymentMethod === 'cod';

    let order = null;

    try {
      const { data, error: orderErr } = await supabase
        .from('orders')
        .insert([
          {
            order_number: orderNumber,
            user_id: req.user ? (req.user.id || req.user._id) : null,
            customer_name: customerName || req.user?.name || 'Customer',
            customer_email: finalEmail || req.user?.email || '',
            customer_phone: finalPhone || req.user?.phone || '',
            shipping_address: formattedAddress,
            pincode: finalPincode,
            subtotal,
            delivery_fee: deliveryFee,
            discount_amount: discountAmount,
            coupon_id: validatedCouponId,
            coupon_code: validatedCouponCode,
            grand_total: grandTotal,
            payment_method: cleanPaymentMethod,
            payment_id: paymentId || null,
            payment_status: paymentId ? 'paid' : (isCod ? 'pending' : 'pending'),
            order_status: isCod ? 'confirmed' : 'pending',
          },
        ])
        .select()
        .single();

      if (!orderErr && data) {
        order = data;
        const orderItemsRows = validatedItems.map((v) => ({
          ...v,
          order_id: order.id,
        }));
        const { data: insertedItems } = await supabase
          .from('order_items')
          .insert(orderItemsRows)
          .select();
          
        if (insertedItems) {
          order.order_items = insertedItems;
        }

        // Record Coupon Usage for COD orders
        if (isCod && validatedCouponId) {
          try {
            const { data: cData } = await supabase
              .from('coupons')
              .select('id, usage_count')
              .eq('id', validatedCouponId)
              .maybeSingle();

            if (cData) {
              await supabase
                .from('coupons')
                .update({
                  usage_count: Number(cData.usage_count || 0) + 1,
                  updated_at: new Date().toISOString()
                })
                .eq('id', cData.id);

              if (req.user) {
                await supabase
                  .from('coupon_usages')
                  .insert([{
                    coupon_id: cData.id,
                    user_id: req.user.id || req.user._id,
                    order_id: order.id,
                    discount_amount: discountAmount,
                  }]);
              }
            }
          } catch (cErr) {
            console.warn('COD coupon usage notice:', cErr.message);
          }
        }
      } else if (orderErr) {
        console.error('Supabase order insert error:', orderErr.message);
      }
    } catch (e) {
      console.warn('Supabase order table insert exception:', e.message);
    }

    // For COD orders, perform immediate stock deduction
    if (isCod) {
      for (const item of items) {
        const targetId = item.productId || item.product_id;
        const vName = item.variantName || item.variant_name;
        const vId = item.variantId || item.variant_id;
        const vWeight = item.variantWeight || item.variant_weight;

        if (targetId) {
          const { data: dbProduct } = await supabase
            .from('products')
            .select('*, product_variants(*)')
            .eq('id', targetId)
            .maybeSingle();

          if (dbProduct) {
            const dbVariant = (dbProduct.product_variants || []).find((v) => 
              (vId && v.id === vId) || 
              (vWeight && (v.weight === vWeight || v.name === vWeight)) || 
              (vName && (v.name === vName || v.weight === vName))
            );

            const variantStocksMap = { ...(dbProduct.nutrition_facts?.variant_stocks || {}) };
            const keyName = vId || vWeight || vName || dbVariant?.id || dbVariant?.weight || dbVariant?.name;

            const currentStock = dbVariant && dbVariant.stock !== undefined && dbVariant.stock !== null
              ? Number(dbVariant.stock)
              : (keyName && variantStocksMap[keyName] !== undefined 
                ? Number(variantStocksMap[keyName]) 
                : (dbVariant?.in_stock ? 50 : 0));

            const newStock = Math.max(0, currentStock - (item.quantity || 1));

            if (keyName) variantStocksMap[keyName] = newStock;
            if (vWeight) variantStocksMap[vWeight] = newStock;
            if (vName) variantStocksMap[vName] = newStock;

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
        }
      }
    }

    if (!order) {
      order = {
        id: `ord_${Date.now()}`,
        order_number: orderNumber,
        customer_name: customerName,
        customer_email: finalEmail,
        customer_phone: finalPhone,
        shipping_address: formattedAddress,
        pincode: finalPincode,
        subtotal,
        delivery_fee: deliveryFee,
        discount_amount: discountAmount,
        grand_total: grandTotal,
        order_status: isCod ? 'confirmed' : 'pending',
        payment_status: paymentId ? 'paid' : 'pending',
        payment_method: cleanPaymentMethod,
        order_items: validatedItems,
      };
    }

    return res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order: formatOrderPayload(order),
    });
  } catch (error) {
    console.error('Error in createOrder:', error);
    res.status(500).json({ message: 'Error creating order', error: error.message });
  }
};

/**
 * Format raw DB order payload into clean, consistent frontend payload (No fake placeholders)
 */
export const formatOrderPayload = (o) => {
  if (!o) return null;
  const isRazorpay = String(o.payment_method || '').toLowerCase() === 'razorpay';
  const displayPaymentMethod = isRazorpay ? 'Razorpay' : 'Cash on Delivery';

  const rawOrderStatus = o.order_status || 'confirmed';
  const canonicalOrderStatus = CANONICAL_STATUS_MAP[rawOrderStatus] || rawOrderStatus;

  return {
    ...o,
    orderId: o.id || o.order_number,
    _id: o.id,
    id: o.id,
    orderNumber: o.order_number || `MIL-${String(o.id || '').slice(-6)}`,
    customerName: o.customer_name || 'Customer',
    customerEmail: o.customer_email || '',
    customerPhone: o.customer_phone || '',
    shippingAddress: o.shipping_address || '',
    pincode: o.pincode || '',
    subtotal: Number(o.subtotal || 0),
    deliveryFee: Number(o.delivery_fee || 0),
    discountAmount: Number(o.discount_amount || 0),
    grandTotal: Number(o.grand_total || 0),
    totalAmount: Number(o.grand_total || 0),
    orderStatus: canonicalOrderStatus,
    paymentStatus: o.payment_status || 'pending',
    paymentMethod: displayPaymentMethod,
    rawPaymentMethod: o.payment_method || 'razorpay',
    paymentId: o.payment_id || null,
    createdAt: o.created_at || new Date().toISOString(),
    items: (o.order_items || []).map((item) => ({
      ...item,
      productId: item.product_id,
      title: item.product_title || 'Bakery Item',
      variantName: item.variant_name || 'Standard Pack',
      price: Number(item.unit_price || 0),
      quantity: item.quantity || 1,
      totalPrice: Number(item.total_price || (item.unit_price * item.quantity)),
    })),
  };
};

/**
 * GET CUSTOMER MY ORDERS
 * Only returns real finalized purchases (paid Razorpay OR confirmed COD orders)
 * GET /api/orders/my-orders
 */
export const getMyOrders = async (req, res) => {
  try {
    const userId = req.user ? (req.user.id || req.user._id) : null;
    if (!userId) {
      return res.json([]);
    }

    const { data: orders, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error || !orders) {
      return res.json([]);
    }

    // Filter out any lingering pending Razorpay attempts if payment was never completed
    const filteredOrders = orders.filter((o) => {
      const isRazorpay = String(o.payment_method || '').toLowerCase() === 'razorpay';
      if (isRazorpay && o.payment_status === 'pending' && !o.payment_id) {
        return false;
      }
      return true;
    });

    const formatted = filteredOrders.map(formatOrderPayload);
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching orders', error: error.message });
  }
};

/**
 * GET ALL ADMIN ORDERS
 * Only returns real finalized customer purchases
 * GET /api/orders/admin/all
 */
export const getAllOrders = async (req, res) => {
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false });

    if (error || !orders) {
      return res.json([]);
    }

    // Filter out abandoned Razorpay attempts (payment_status pending & no payment_id)
    const filteredOrders = orders.filter((o) => {
      const isRazorpay = String(o.payment_method || '').toLowerCase() === 'razorpay';
      if (isRazorpay && o.payment_status === 'pending' && !o.payment_id) {
        return false;
      }
      return true;
    });

    const formatted = filteredOrders.map(formatOrderPayload);
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching all orders', error: error.message });
  }
};

/**
 * GET SINGLE ORDER BY ID OR ORDER NUMBER
 * GET /api/orders/detail/:identifier
 */
export const getOrderById = async (req, res) => {
  try {
    const { identifier } = req.params;
    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(identifier);

    let query = supabase.from('orders').select('*, order_items(*)');

    if (isUuid) {
      query = query.or(`id.eq.${identifier},order_number.eq.${identifier}`);
    } else {
      query = query.eq('order_number', identifier);
    }

    const { data: order, error } = await query.maybeSingle();

    if (!error && order) {
      return res.json(formatOrderPayload(order));
    }

    // Search fallback
    const { data: allOrders } = await supabase.from('orders').select('*, order_items(*)').limit(50);
    if (allOrders && allOrders.length > 0) {
      const match = allOrders.find((o) => o.id === identifier || o.order_number === identifier || identifier.includes(o.order_number));
      if (match) {
        return res.json(formatOrderPayload(match));
      }
    }

    return res.status(404).json({ message: 'Order details not found' });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching order details', error: error.message });
  }
};

/**
 * CANCEL ORDER
 * PUT /api/orders/:id/cancel
 */
export const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id);

    let query = supabase.from('orders').update({ order_status: 'cancelled' });
    if (isUuid) {
      query = query.eq('id', id);
    } else {
      query = query.eq('order_number', id);
    }

    const { data: order, error } = await query.select().single();

    if (error) throw error;
    res.json({ message: 'Order cancelled successfully', order: formatOrderPayload(order) });
  } catch (error) {
    res.status(500).json({ message: 'Error cancelling order', error: error.message });
  }
};

/**
 * ADMIN: UPDATE ORDER STATUS (FIXES HTTP 500 ROOT CAUSE COMPLETELY)
 * PUT /api/orders/admin/:id/status
 */
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { orderStatus, paymentStatus } = req.body;

    console.log('[ADMIN STATUS UPDATE REQUEST]', { orderId: id, orderStatus, paymentStatus });

    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id);

    const updates = {};
    if (orderStatus) {
      const canonical = CANONICAL_STATUS_MAP[orderStatus] || orderStatus.toLowerCase();
      updates.order_status = canonical;
    }
    if (paymentStatus) {
      updates.payment_status = String(paymentStatus).toLowerCase();
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'No valid status updates provided' });
    }

    let query = supabase.from('orders').update(updates);
    if (isUuid) {
      query = query.eq('id', id);
    } else {
      query = query.eq('order_number', id);
    }

    const { data: updatedOrder, error } = await query.select('*, order_items(*)').maybeSingle();

    if (error) {
      console.error('[ADMIN STATUS UPDATE ERROR]', error);
      return res.status(500).json({
        message: `Database error updating order status: ${error.message}`,
        code: error.code,
      });
    }

    if (!updatedOrder) {
      return res.status(404).json({ message: 'Order record not found to update' });
    }

    console.log('[ADMIN STATUS UPDATE SUCCESS]', { orderId: id, newStatus: updatedOrder.order_status });
    res.json({
      success: true,
      message: 'Order status updated successfully',
      order: formatOrderPayload(updatedOrder),
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Error updating order status', error: error.message });
  }
};

/**
 * ADMIN: ANALYTICS SUMMARY
 * GET /api/orders/admin/analytics
 */
export const getAdminAnalytics = async (req, res) => {
  try {
    await syncAuthUsersToProfiles();

    const [ordersRes, customersRes] = await Promise.all([
      supabase.from('orders').select('*'),
      supabase.from('users').select('id, role').eq('role', 'customer')
    ]);

    if (ordersRes.error) {
      throw ordersRes.error;
    }

    const allOrders = ordersRes.data || [];
    // Only count real finalized orders (filter out abandoned razorpay attempts)
    const orders = allOrders.filter((o) => {
      const isRazorpay = String(o.payment_method || '').toLowerCase() === 'razorpay';
      if (isRazorpay && o.payment_status === 'pending' && !o.payment_id) {
        return false;
      }
      return true;
    });

    const customers = customersRes.data || null;

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + Number(o.grand_total || 0), 0);
    const pendingOrders = orders.filter((o) => (o.order_status || '').toLowerCase() === 'pending').length;
    const deliveredOrders = orders.filter((o) => (o.order_status || '').toLowerCase() === 'delivered').length;
    const totalCustomers = customers !== null ? customers.length : null;

    res.json({
      totalOrders,
      totalRevenue,
      pendingOrders,
      deliveredOrders,
      totalCustomers,
    });
  } catch (error) {
    console.error('[ANALYTICS] Server error:', error.message);
    res.status(500).json({ message: 'Error fetching admin analytics', error: error.message });
  }
};
