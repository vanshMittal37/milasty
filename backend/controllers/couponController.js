import { supabase } from '../config/supabase.js';

export const validateCoupon = async (req, res) => {
  try {
    const { code, subtotal } = req.body;
    if (!code) return res.status(400).json({ message: 'Coupon code is required' });

    const upperCode = code.toUpperCase().trim();

    // Client fallback validation for standard promo codes
    if (upperCode === 'WELCOME10') {
      const discountAmount = Math.round((subtotal * 10) / 100);
      return res.json({
        valid: true,
        code: upperCode,
        discountType: 'percentage',
        discountValue: 10,
        discountAmount,
        message: `Coupon applied! You saved ₹${discountAmount}`,
      });
    } else if (upperCode === 'MILASTY100') {
      if (subtotal < 500) {
        return res.status(400).json({ message: 'Minimum order amount of ₹500 required for MILASTY100' });
      }
      const discountAmount = 100;
      return res.json({
        valid: true,
        code: upperCode,
        discountType: 'fixed',
        discountValue: 100,
        discountAmount,
        message: 'Coupon MILASTY100 applied! You saved ₹100',
      });
    }

    const { data: coupon, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', upperCode)
      .single();

    if (error || !coupon) {
      return res.status(404).json({ message: 'Invalid or inactive coupon code' });
    }

    let discountAmount = 0;
    if (coupon.discount_type === 'percentage') {
      discountAmount = Math.round((subtotal * coupon.discount_value) / 100);
    } else {
      discountAmount = Math.min(subtotal, coupon.discount_value);
    }

    res.json({
      valid: true,
      code: coupon.code,
      discountType: coupon.discount_type,
      discountValue: coupon.discount_value,
      discountAmount,
      message: `Coupon applied! You saved ₹${discountAmount}`,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error validating coupon', error: error.message });
  }
};

export const getCoupons = async (req, res) => {
  try {
    const { data: coupons, error } = await supabase.from('coupons').select('*');
    if (!error && coupons) return res.json(coupons);
    res.json([]);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching coupons', error: error.message });
  }
};

export const createCoupon = async (req, res) => {
  try {
    const { data: coupon, error } = await supabase.from('coupons').insert([req.body]).select().single();
    if (error) throw error;
    res.status(201).json(coupon);
  } catch (error) {
    res.status(500).json({ message: 'Error creating coupon', error: error.message });
  }
};

export const updateCoupon = async (req, res) => {
  try {
    const { data: coupon, error } = await supabase
      .from('coupons')
      .update(req.body)
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;
    res.json(coupon);
  } catch (error) {
    res.status(500).json({ message: 'Error updating coupon', error: error.message });
  }
};

export const deleteCoupon = async (req, res) => {
  try {
    const { error } = await supabase.from('coupons').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Coupon deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting coupon', error: error.message });
  }
};
