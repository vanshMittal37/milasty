import { supabase } from '../config/supabase.js';

/**
 * PUBLIC API — Validate Coupon Code Server-Side (Single Source of Truth)
 * POST /api/coupons/validate
 */
export const validateCoupon = async (req, res) => {
  try {
    const { code, subtotal = 0, userId = null } = req.body;
    const cleanCode = String(code || '').toUpperCase().trim();

    if (!cleanCode) {
      return res.status(400).json({ valid: false, message: 'Please enter a coupon code.' });
    }

    const subtotalNum = Number(subtotal || 0);
    if (subtotalNum <= 0) {
      return res.status(400).json({ valid: false, message: 'Cart subtotal must be greater than zero.' });
    }

    let { data: coupon } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', cleanCode)
      .maybeSingle();

    if (!coupon) {
      if (cleanCode === 'WELCOME10') {
        coupon = {
          id: 'def-1',
          code: 'WELCOME10',
          discount_type: 'percentage',
          discount_value: 10,
          min_order_amount: 300,
          max_discount: 200,
          is_active: true,
        };
      } else if (cleanCode === 'MILASTY100') {
        coupon = {
          id: 'def-2',
          code: 'MILASTY100',
          discount_type: 'fixed',
          discount_value: 100,
          min_order_amount: 500,
          max_discount: 100,
          is_active: true,
        };
      }
    }

    if (!coupon) {
      return res.status(404).json({ valid: false, message: 'Invalid coupon code.' });
    }

    // 1. Check Active Status
    if (!coupon.is_active) {
      return res.status(400).json({ valid: false, message: 'This coupon is currently unavailable.' });
    }

    const now = new Date();

    // 2. Check Start Date
    if (coupon.starts_at && new Date(coupon.starts_at) > now) {
      return res.status(400).json({ valid: false, message: 'This coupon promotion has not started yet.' });
    }

    // 3. Check Expiry Date
    if (coupon.expires_at && new Date(coupon.expires_at) <= now) {
      return res.status(400).json({ valid: false, message: 'This coupon has expired.' });
    }

    // 4. Check Minimum Order Amount
    const minOrder = Number(coupon.min_order_amount || 0);
    if (subtotalNum < minOrder) {
      return res.status(400).json({
        valid: false,
        message: `Minimum order of ₹${minOrder} is required to use code ${coupon.code}.`,
        minOrderRequired: minOrder,
      });
    }

    // 5. Check Global Usage Limit
    if (coupon.usage_limit !== null && coupon.usage_limit !== undefined && coupon.usage_limit > 0) {
      if (Number(coupon.usage_count || 0) >= Number(coupon.usage_limit)) {
        return res.status(400).json({ valid: false, message: 'This coupon has reached its usage limit.' });
      }
    }

    // 6. Check Per-User Usage Limit
    const targetUser = userId || req.user?.id || req.user?._id;
    if (targetUser && coupon.per_user_limit !== null && coupon.per_user_limit > 0) {
      const { count, error: usageErr } = await supabase
        .from('coupon_usages')
        .select('id', { count: 'exact', head: true })
        .eq('coupon_id', coupon.id)
        .eq('user_id', targetUser);

      if (!usageErr && count !== null && count >= Number(coupon.per_user_limit)) {
        return res.status(400).json({ valid: false, message: 'You have already used this coupon.' });
      }
    }

    // 7. Calculate Server-Side Discount Amount
    let discountAmount = 0;
    const valueNum = Number(coupon.discount_value || 0);
    const maxCap = Number(coupon.max_discount || 0);

    if (coupon.discount_type === 'percentage') {
      let calc = Math.round((subtotalNum * valueNum) / 100);
      if (maxCap > 0 && calc > maxCap) {
        calc = maxCap;
      }
      discountAmount = Math.min(subtotalNum, calc);
    } else {
      discountAmount = Math.min(subtotalNum, valueNum);
    }

    return res.json({
      valid: true,
      couponId: coupon.id,
      code: coupon.code,
      discountType: coupon.discount_type,
      discountValue: valueNum,
      discountAmount,
      minOrderAmount: minOrder,
      maxDiscount: maxCap,
      message: `Coupon ${coupon.code} applied! You saved ₹${discountAmount}`,
    });
  } catch (error) {
    console.error('validateCoupon error:', error);
    return res.status(500).json({ valid: false, message: 'Error validating coupon code', error: error.message });
  }
};

/**
 * PUBLIC API — Get Dynamic Featured Promotional Coupons for Top Announcement Bar
 * GET /api/coupons/featured
 */
export const getFeaturedPromoCoupon = async (req, res) => {
  try {
    const { data: coupons } = await supabase
      .from('coupons')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    const now = new Date();
    const validCoupons = (coupons || []).filter((coupon) => {
      const startsValid = !coupon.starts_at || new Date(coupon.starts_at) <= now;
      const expiresValid = !coupon.expires_at || new Date(coupon.expires_at) > now;
      const usageValid = coupon.usage_limit === null || coupon.usage_limit === undefined || Number(coupon.usage_count || 0) < Number(coupon.usage_limit);
      return startsValid && expiresValid && usageValid;
    });

    // Filter by is_featured if marked, else use all valid active coupons
    let featuredList = validCoupons.filter((c) => c.is_featured);
    if (featuredList.length === 0) {
      featuredList = validCoupons;
    }

    const defaultPromos = [
      {
        code: 'WELCOME10',
        discountType: 'percentage',
        discountValue: 10,
        minOrderAmount: 300,
        maxDiscount: 200,
        discountText: '10% OFF',
        displayText: 'Use code WELCOME10 for 10% OFF on orders above ₹300',
      },
      {
        code: 'MILASTY100',
        discountType: 'fixed',
        discountValue: 100,
        minOrderAmount: 500,
        maxDiscount: 100,
        discountText: '₹100 OFF',
        displayText: 'Use code MILASTY100 for ₹100 OFF on orders above ₹500',
      },
    ];

    if (featuredList.length === 0) {
      return res.json({
        success: true,
        promos: defaultPromos,
        marqueeText: defaultPromos.map((p) => p.displayText).join(' • '),
        promo: defaultPromos[0],
      });
    }

    const promos = featuredList.map((coupon) => {
      const valNum = Number(coupon.discount_value || 0);
      const minOrder = Number(coupon.min_order_amount || 0);
      const discountText = coupon.discount_type === 'percentage'
        ? `${valNum}% OFF`
        : `₹${valNum} OFF`;

      const conditionText = minOrder > 0 ? `on orders above ₹${minOrder}` : '';
      const displayText = `Use code ${coupon.code} for ${discountText}${conditionText ? ' ' + conditionText : ''}`.trim();

      return {
        code: coupon.code,
        discountType: coupon.discount_type,
        discountValue: valNum,
        minOrderAmount: minOrder,
        maxDiscount: Number(coupon.max_discount || 0),
        discountText,
        displayText,
      };
    });

    const marqueeText = promos.map((p) => p.displayText).join(' • ');

    return res.json({
      success: true,
      promos,
      marqueeText,
      promo: promos[0],
    });
  } catch (error) {
    console.error('getFeaturedPromoCoupon error:', error);
    const defaultPromos = [
      {
        code: 'WELCOME10',
        discountType: 'percentage',
        discountValue: 10,
        minOrderAmount: 300,
        maxDiscount: 200,
        discountText: '10% OFF',
        displayText: 'Use code WELCOME10 for 10% OFF on orders above ₹300',
      },
      {
        code: 'MILASTY100',
        discountType: 'fixed',
        discountValue: 100,
        minOrderAmount: 500,
        maxDiscount: 100,
        discountText: '₹100 OFF',
        displayText: 'Use code MILASTY100 for ₹100 OFF on orders above ₹500',
      },
    ];
    return res.json({
      success: true,
      promos: defaultPromos,
      marqueeText: defaultPromos.map((p) => p.displayText).join(' • '),
      promo: defaultPromos[0],
    });
  }
};

/**
 * PUBLIC API — Get All Active Promotional Coupons for Storefront & Cart Offers
 * GET /api/coupons/active
 */
export const getActiveCoupons = async (req, res) => {
  try {
    const { data: coupons, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const now = new Date();
    const validCoupons = (coupons || []).filter((coupon) => {
      const startsValid = !coupon.starts_at || new Date(coupon.starts_at) <= now;
      const expiresValid = !coupon.expires_at || new Date(coupon.expires_at) > now;
      const usageValid = coupon.usage_limit === null || coupon.usage_limit === undefined || Number(coupon.usage_count || 0) < Number(coupon.usage_limit);
      return startsValid && expiresValid && usageValid;
    }).map((coupon) => {
      const valNum = Number(coupon.discount_value || 0);
      const minOrder = Number(coupon.min_order_amount || 0);
      const discountText = coupon.discount_type === 'percentage'
        ? `${valNum}% OFF`
        : `₹${valNum} OFF`;

      const conditionText = minOrder > 0 ? `on orders above ₹${minOrder}` : '';
      const displayText = `Use code ${coupon.code} for ${discountText}${conditionText ? ' ' + conditionText : ''}`.trim();

      return {
        id: coupon.id,
        code: coupon.code,
        discountType: coupon.discount_type,
        discountValue: valNum,
        minOrderAmount: minOrder,
        maxDiscount: Number(coupon.max_discount || 0),
        isFeatured: !!coupon.is_featured,
        description: coupon.description || '',
        discountText,
        conditionText,
        displayText,
      };
    });

    const defaultCoupons = [
      {
        id: 'def-1',
        code: 'WELCOME10',
        discountType: 'percentage',
        discountValue: 10,
        minOrderAmount: 300,
        maxDiscount: 200,
        isFeatured: true,
        description: 'Get 10% OFF on orders above ₹300',
        discountText: '10% OFF',
        conditionText: 'on orders above ₹300',
        displayText: 'Use code WELCOME10 for 10% OFF on orders above ₹300',
      },
      {
        id: 'def-2',
        code: 'MILASTY100',
        discountType: 'fixed',
        discountValue: 100,
        minOrderAmount: 500,
        maxDiscount: 100,
        isFeatured: true,
        description: 'Get ₹100 OFF on orders above ₹500',
        discountText: '₹100 OFF',
        conditionText: 'on orders above ₹500',
        displayText: 'Use code MILASTY100 for ₹100 OFF on orders above ₹500',
      },
    ];

    if (validCoupons.length === 0) {
      return res.json({ success: true, coupons: defaultCoupons });
    }

    return res.json({ success: true, coupons: validCoupons });
  } catch (error) {
    console.error('getActiveCoupons error:', error);
    const defaultCoupons = [
      {
        id: 'def-1',
        code: 'WELCOME10',
        discountType: 'percentage',
        discountValue: 10,
        minOrderAmount: 300,
        maxDiscount: 200,
        isFeatured: true,
        description: 'Get 10% OFF on orders above ₹300',
        discountText: '10% OFF',
        conditionText: 'on orders above ₹300',
        displayText: 'Use code WELCOME10 for 10% OFF on orders above ₹300',
      },
      {
        id: 'def-2',
        code: 'MILASTY100',
        discountType: 'fixed',
        discountValue: 100,
        minOrderAmount: 500,
        maxDiscount: 100,
        isFeatured: true,
        description: 'Get ₹100 OFF on orders above ₹500',
        discountText: '₹100 OFF',
        conditionText: 'on orders above ₹500',
        displayText: 'Use code MILASTY100 for ₹100 OFF on orders above ₹500',
      },
    ];
    return res.json({ success: true, coupons: defaultCoupons, error: error.message });
  }
};

/**
 * ADMIN API — List All Coupons
 * GET /api/coupons
 */
export const getCoupons = async (req, res) => {
  try {
    const { data: coupons, error } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return res.json(coupons || []);
  } catch (error) {
    console.error('getCoupons error:', error);
    return res.status(500).json({ message: 'Error fetching coupons', error: error.message });
  }
};

/**
 * ADMIN API — Create New Coupon
 * POST /api/coupons
 */
export const createCoupon = async (req, res) => {
  try {
    const {
      code,
      discountType = 'percentage',
      discountValue,
      minOrderAmount = 0,
      maxDiscountAmount = null,
      maxDiscount = null,
      isActive = true,
      is_active = true,
      isFeatured = false,
      is_featured = false,
      startsAt = null,
      expiresAt = null,
      usageLimit = null,
      perUserLimit = null,
      description = '',
    } = req.body;

    const cleanCode = String(code || '').toUpperCase().trim();
    if (!cleanCode) {
      return res.status(400).json({ message: 'Coupon code is required.' });
    }

    const valNum = Number(discountValue);
    if (isNaN(valNum) || valNum <= 0) {
      return res.status(400).json({ message: 'Discount value must be greater than zero.' });
    }

    const payload = {
      code: cleanCode,
      discount_type: discountType === 'fixed' ? 'fixed' : 'percentage',
      discount_value: valNum,
      min_order_amount: Math.max(0, Number(minOrderAmount || 0)),
      max_discount: maxDiscountAmount !== null && maxDiscountAmount !== undefined ? Number(maxDiscountAmount) : (maxDiscount ? Number(maxDiscount) : null),
      is_active: is_active !== undefined ? !!is_active : !!isActive,
      is_featured: is_featured !== undefined ? !!is_featured : !!isFeatured,
      starts_at: startsAt ? new Date(startsAt).toISOString() : new Date().toISOString(),
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      usage_limit: usageLimit ? Number(usageLimit) : null,
      per_user_limit: perUserLimit ? Number(perUserLimit) : null,
      description: String(description || '').trim(),
      updated_at: new Date().toISOString(),
    };

    // Check if coupon code already exists to update instead of erroring out
    const { data: existing } = await supabase
      .from('coupons')
      .select('id')
      .eq('code', cleanCode)
      .maybeSingle();

    let coupon, error;
    if (existing) {
      const res = await supabase
        .from('coupons')
        .update(payload)
        .eq('id', existing.id)
        .select()
        .single();
      coupon = res.data;
      error = res.error;
    } else {
      const res = await supabase
        .from('coupons')
        .insert([payload])
        .select()
        .single();
      coupon = res.data;
      error = res.error;
    }

    if (error) throw error;
    return res.status(201).json(coupon);
  } catch (error) {
    console.error('createCoupon error:', error);
    return res.status(500).json({ message: `Error creating coupon: ${error.message}` });
  }
};

/**
 * ADMIN API — Update Coupon
 * PUT /api/coupons/:id
 */
export const updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;

    const updatePayload = { updated_at: new Date().toISOString() };

    if (body.code) updatePayload.code = String(body.code).toUpperCase().trim();
    if (body.discountType) updatePayload.discount_type = body.discountType;
    if (body.discount_type) updatePayload.discount_type = body.discount_type;
    if (body.discountValue !== undefined) updatePayload.discount_value = Number(body.discountValue);
    if (body.discount_value !== undefined) updatePayload.discount_value = Number(body.discount_value);
    if (body.minOrderAmount !== undefined) updatePayload.min_order_amount = Number(body.minOrderAmount);
    if (body.min_order_amount !== undefined) updatePayload.min_order_amount = Number(body.min_order_amount);
    if (body.maxDiscountAmount !== undefined) updatePayload.max_discount = Number(body.maxDiscountAmount);
    if (body.max_discount !== undefined) updatePayload.max_discount = Number(body.max_discount);
    if (body.isActive !== undefined) updatePayload.is_active = !!body.isActive;
    if (body.is_active !== undefined) updatePayload.is_active = !!body.is_active;
    if (body.isFeatured !== undefined) updatePayload.is_featured = !!body.isFeatured;
    if (body.is_featured !== undefined) updatePayload.is_featured = !!body.is_featured;
    if (body.description !== undefined) updatePayload.description = String(body.description || '').trim();
    if (body.expiresAt !== undefined) updatePayload.expires_at = body.expiresAt ? new Date(body.expiresAt).toISOString() : null;
    if (body.expires_at !== undefined) updatePayload.expires_at = body.expires_at ? new Date(body.expires_at).toISOString() : null;

    let { data: coupon, error } = await supabase
      .from('coupons')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (!coupon) {
      const { data: couponByCode, error: errByCode } = await supabase
        .from('coupons')
        .update(updatePayload)
        .eq('code', String(id).toUpperCase())
        .select()
        .maybeSingle();
      coupon = couponByCode;
      error = errByCode;
    }

    if (error) throw error;
    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found to update.' });
    }
    return res.json(coupon);
  } catch (error) {
    console.error('updateCoupon error:', error);
    return res.status(500).json({ message: `Error updating coupon: ${error.message}` });
  }
};

/**
 * ADMIN API — Delete/Deactivate Coupon
 * DELETE /api/coupons/:id
 */
export const deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('coupons')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return res.json({ message: 'Coupon deleted successfully' });
  } catch (error) {
    console.error('deleteCoupon error:', error);
    return res.status(500).json({ message: `Error deleting coupon: ${error.message}` });
  }
};

