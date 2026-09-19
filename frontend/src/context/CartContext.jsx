import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState([]);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [appliedCoupon, setAppliedCoupon] = useState(() => {
    try {
      const saved = sessionStorage.getItem('milasty_applied_coupon');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [couponDiscountAmount, setCouponDiscountAmount] = useState(0);

  // Sync appliedCoupon with Session Storage
  useEffect(() => {
    try {
      if (appliedCoupon) {
        sessionStorage.setItem('milasty_applied_coupon', JSON.stringify(appliedCoupon));
      } else {
        sessionStorage.removeItem('milasty_applied_coupon');
      }
    } catch (e) {}
  }, [appliedCoupon]);

  const subtotal = cartItems.reduce((acc, item) => acc + item.totalPrice, 0);

  // Recalculate or revalidate coupon discount when subtotal modifies
  useEffect(() => {
    if (!appliedCoupon) {
      setCouponDiscountAmount(0);
      return;
    }

    if (subtotal <= 0) {
      setAppliedCoupon(null);
      setCouponDiscountAmount(0);
      return;
    }

    const minOrder = Number(appliedCoupon.minOrderAmount || 0);
    if (subtotal < minOrder) {
      const couponCodeMsg = appliedCoupon.code;
      setAppliedCoupon(null);
      setCouponDiscountAmount(0);
      sessionStorage.removeItem('milasty_applied_coupon');
      showToast(`Coupon ${couponCodeMsg} removed because minimum order requirement (₹${minOrder}) is no longer met.`);
      return;
    }

    // Dynamic recalculation for quantity changes
    let newDiscount = 0;
    const valNum = Number(appliedCoupon.discountValue || 0);
    const maxCap = Number(appliedCoupon.maxDiscount || 0);

    if (appliedCoupon.discountType === 'percentage') {
      let calc = Math.round((subtotal * valNum) / 100);
      if (maxCap > 0 && calc > maxCap) {
        calc = maxCap;
      }
      newDiscount = Math.min(subtotal, calc);
    } else {
      newDiscount = Math.min(subtotal, valNum);
    }

    setCouponDiscountAmount(newDiscount);
  }, [subtotal, appliedCoupon]);

  const deliveryFee = 0;
  const grandTotal = Math.max(0, subtotal - couponDiscountAmount);
  const totalItemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const applyCoupon = async (code) => {
    const upperCode = String(code || '').toUpperCase().trim();
    if (!upperCode) {
      const msg = 'Please enter a coupon code.';
      showToast(msg);
      return { success: false, message: msg };
    }

    try {
      const res = await api.post('/coupons/validate', {
        code: upperCode,
        subtotal,
        userId: user ? (user.id || user._id) : null,
      });

      if (res.data && res.data.valid) {
        setAppliedCoupon(res.data);
        setCouponDiscountAmount(res.data.discountAmount);
        showToast(res.data.message);
        return { success: true, message: res.data.message };
      }
      const msg = res.data?.message || 'Invalid coupon code';
      showToast(msg);
      return { success: false, message: msg };
    } catch (error) {
      const msg = error.response?.data?.message || 'Unable to apply coupon. Please try again.';
      showToast(msg);
      return { success: false, message: msg };
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscountAmount(0);
    try {
      sessionStorage.removeItem('milasty_applied_coupon');
    } catch (e) {}
    showToast('Coupon removed');
  };


  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const openCart = () => {
    setMobileNavOpen(false);
    setIsCartOpen(true);
  };

  const openNav = () => {
    setIsCartOpen(false);
    setMobileNavOpen(true);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        isCartOpen,
        setIsCartOpen,
        mobileNavOpen,
        setMobileNavOpen,
        openCart,
        openNav,
        subtotal,
        deliveryFee,
        grandTotal,
        totalAmount: grandTotal,
        totalItemCount,
        toastMessage,
        setToastMessage,
        showToast,
        appliedCoupon,
        couponDiscountAmount,
        applyCoupon,
        removeCoupon,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
