import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  // Load cart from localStorage
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('milasty_cart_items');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

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

  // Sync cartItems with localStorage
  useEffect(() => {
    try {
      localStorage.setItem('milasty_cart_items', JSON.stringify(cartItems));
    } catch (e) {}
  }, [cartItems]);

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

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const addToCart = async (product, variant, qty = 1) => {
    if (!product) return;

    const selectedVariant = variant || (product.variants && product.variants[0]) || {};
    const unitPrice = selectedVariant.price !== undefined ? Number(selectedVariant.price) : Number(product.price || 0);
    const variantName = selectedVariant.weight || selectedVariant.name || selectedVariant.variantWeight || 'Standard Pack';
    const variantId = selectedVariant.id || selectedVariant._id || variantName;
    const pId = product._id || product.id || product.slug || 'item';
    const cartItemId = `${pId}_${variantId}`;
    const image = product.image || product.image_url || product.primary_image || '/images/image1.jpeg';
    const title = product.title || product.name || 'MILASTY Bake';

    setCartItems((prevItems) => {
      const existingIdx = prevItems.findIndex((item) => item.cartItemId === cartItemId || (item.productId === pId && item.variantName === variantName));

      if (existingIdx > -1) {
        const updated = [...prevItems];
        const newQty = updated[existingIdx].quantity + qty;
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: newQty,
          totalPrice: updated[existingIdx].unitPrice * newQty,
        };
        return updated;
      }

      return [
        ...prevItems,
        {
          cartItemId,
          productId: pId,
          title,
          image,
          variantName,
          variantId: selectedVariant.id || selectedVariant._id || null,
          unitPrice,
          originalPrice: selectedVariant.originalPrice || product.originalPrice || unitPrice,
          quantity: qty,
          totalPrice: unitPrice * qty,
        },
      ];
    });

    showToast(`✓ Added ${title} (${variantName}) to cart`);
  };

  const updateQuantity = (targetId, newQty) => {
    if (!targetId) return;
    if (newQty <= 0) {
      removeFromCart(targetId);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) => {
        const matches =
          (item.cartItemId && item.cartItemId === targetId) ||
          (item.productId && item.productId === targetId) ||
          (item._id && item._id === targetId) ||
          (item.id && item.id === targetId) ||
          (item.key && item.key === targetId);

        if (matches) {
          return {
            ...item,
            quantity: newQty,
            totalPrice: item.unitPrice * newQty,
          };
        }
        return item;
      })
    );
  };

  const removeFromCart = (targetId) => {
    if (!targetId) return;
    setCartItems((prev) =>
      prev.filter((item) => {
        const idMatches =
          (item.cartItemId && item.cartItemId === targetId) ||
          (item.productId && item.productId === targetId) ||
          (item._id && item._id === targetId) ||
          (item.id && item.id === targetId) ||
          (item.key && item.key === targetId);
        return !idMatches;
      })
    );
  };

  const clearCart = () => {
    setCartItems([]);
    setAppliedCoupon(null);
    setCouponDiscountAmount(0);
    try {
      localStorage.removeItem('milasty_cart_items');
      sessionStorage.removeItem('milasty_applied_coupon');
    } catch (e) {}
  };

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
