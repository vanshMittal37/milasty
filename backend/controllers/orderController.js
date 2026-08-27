import { supabase } from '../config/supabase.js';

// Create Direct Database Order (Without WhatsApp dependency)
export const createOrder = async (req, res) => {
  try {
    const {
      customerName,
      customerEmail,
      customerPhone,
      shippingAddress,
      pincode,
      items, // array of { productId, variantName, quantity }
      paymentMethod = 'razorpay',
      paymentId = null,
      notes = '',
    } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ message: 'Order must contain at least one item' });
    }

    if (!customerName || !customerPhone || !shippingAddress || !pincode) {
      return res.status(400).json({ message: 'Shipping details are mandatory' });
    }

    // SERVER-SIDE PRICE VALIDATION TRUTH
    // Fetch product pricing directly from Supabase
    const productIds = items.map((i) => i.productId);
    const { data: dbProducts, error: prodErr } = await supabase
      .from('products')
      .select('id, title, product_variants(*)')
      .in('id', productIds);

    let subtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const dbProduct = dbProducts ? dbProducts.find((p) => p.id === item.productId) : null;
      let unitPrice = 149; // fallback if product not seeded
      let title = item.title || 'MILASTY Artisan Cookie';

      if (dbProduct) {
        title = dbProduct.title;
        const dbVariant = (dbProduct.product_variants || []).find((v) => v.name === item.variantName);
        if (dbVariant) {
          unitPrice = Number(dbVariant.price);
        }
      }

      const itemTotal = unitPrice * item.quantity;
      subtotal += itemTotal;

      validatedItems.push({
        product_id: dbProduct ? dbProduct.id : null,
        product_title: title,
        variant_name: item.variantName || 'Standard Pack',
        unit_price: unitPrice,
        quantity: item.quantity,
        total_price: itemTotal,
      });
    }

    const deliveryFee = subtotal >= 499 || subtotal === 0 ? 0 : 49;
    const grandTotal = subtotal + deliveryFee;
    const orderNumber = `MIL-${Date.now().toString().slice(-6)}`;

    // Insert Order into Supabase
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert([
        {
          order_number: orderNumber,
          user_id: req.user ? req.user.id : null,
          customer_name: customerName,
          customer_email: customerEmail || '',
          customer_phone: customerPhone,
          shipping_address: shippingAddress,
          pincode,
          subtotal,
          delivery_fee: deliveryFee,
          grand_total: grandTotal,
          payment_method: paymentMethod,
          payment_id: paymentId,
          payment_status: paymentId ? 'paid' : 'pending',
          order_status: 'confirmed',
        },
      ])
      .select()
      .single();

    if (orderErr) throw orderErr;

    // Insert Order Items into Supabase
    const orderItemsRows = validatedItems.map((v) => ({
      ...v,
      order_id: order.id,
    }));
    await supabase.from('order_items').insert(orderItemsRows);

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order: {
        id: order.id,
        _id: order.id,
        orderId: order.id,
        orderNumber: order.order_number,
        grandTotal: order.grand_total,
        orderStatus: order.order_status,
        paymentStatus: order.payment_status,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating order', error: error.message });
  }
};

// Get User Orders
export const getMyOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(orders || []);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching orders', error: error.message });
  }
};

// Admin: Get All Orders
export const getAllOrders = async (req, res) => {
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(orders || []);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching all orders', error: error.message });
  }
};
