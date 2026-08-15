import Coupon from '../models/Coupon.js';

export const validateCoupon = async (req, res) => {
  try {
    const { code, subtotal } = req.body;
    if (!code) return res.status(400).json({ message: 'Coupon code is required' });

    const coupon = await Coupon.findOne({ code: code.toUpperCase(), active: true });
    if (!coupon) {
      return res.status(404).json({ message: 'Invalid or inactive coupon code' });
    }

    if (new Date() > new Date(coupon.expiryDate)) {
      return res.status(400).json({ message: 'This coupon code has expired' });
    }

    if (subtotal < coupon.minOrderAmount) {
      return res.status(400).json({
        message: `Minimum order amount of ₹${coupon.minOrderAmount} required for this coupon`,
      });
    }

    if (coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ message: 'Coupon usage limit reached' });
    }

    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
      discountAmount = Math.round((subtotal * coupon.discountValue) / 100);
      if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
        discountAmount = coupon.maxDiscountAmount;
      }
    } else if (coupon.discountType === 'fixed') {
      discountAmount = Math.min(subtotal, coupon.discountValue);
    }

    res.json({
      valid: true,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount,
      message: `Coupon applied! You saved ₹${discountAmount}`,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error validating coupon', error: error.message });
  }
};

export const getCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json(coupons);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching coupons', error: error.message });
  }
};

export const createCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.create(req.body);
    res.status(201).json(coupon);
  } catch (error) {
    res.status(500).json({ message: 'Error creating coupon', error: error.message });
  }
};

export const updateCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(coupon);
  } catch (error) {
    res.status(500).json({ message: 'Error updating coupon', error: error.message });
  }
};

export const deleteCoupon = async (req, res) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    res.json({ message: 'Coupon deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting coupon', error: error.message });
  }
};
