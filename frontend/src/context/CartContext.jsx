import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState([]);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponDiscountAmount, setCouponDiscountAmount] = useState(0);

  // Load cart item list based on active user context
  useEffect(() => {
    const key = user ? `milasty_cart_${user._id}` : 'milasty_cart_guest';
    try {
      const saved = localStorage.getItem(key);
      setCartItems(saved ? JSON.parse(saved) : []);
    } catch (e) {
      setCartItems([]);
    }
  }, [user]);

  // Save changes to active storage key when cart modifies
  useEffect(() => {
    const key = user ? `milasty_cart_${user._id}` : 'milasty_cart_guest';
    try {
      localStorage.setItem(key, JSON.stringify(cartItems));
    } catch (e) {
      console.error('Failed to save cart', e);
    }
  }, [cartItems, user]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const addToCart = (product, variant, qty = 1) => {
    const selectedVariant = variant || product?.variants?.[0] || {};
    const itemKey = `${product?._id || product?.slug}-${selectedVariant?.name || 'default'}`;
    const unitPrice = selectedVariant?.price || product?.finalPrice || product?.price || 0;
    const availableStock = selectedVariant?.stock !== undefined && selectedVariant?.stock !== null
      ? Number(selectedVariant.stock)
      : (product?.stock !== undefined && product?.stock !== null ? Number(product.stock) : 50);

    if (availableStock <= 0) {
      showToast('This variant is currently Out of Stock.');
      return;
    }

    setCartItems((prevItems) => {
      const existingIndex = prevItems.findIndex((item) => item.key === itemKey);
      if (existingIndex > -1) {
        const existingQty = prevItems[existingIndex].quantity;
        const requestedQty = existingQty + qty;
        if (requestedQty > availableStock) {
          showToast(`Only ${availableStock} packs are available.`);
          const cappedQty = Math.min(requestedQty, availableStock);
          const updated = [...prevItems];
          updated[existingIndex].quantity = cappedQty;
          updated[existingIndex].availableStock = availableStock;
          updated[existingIndex].totalPrice = cappedQty * unitPrice;
          return updated;
        }
        const updated = [...prevItems];
        updated[existingIndex].quantity = requestedQty;
        updated[existingIndex].availableStock = availableStock;
        updated[existingIndex].totalPrice = requestedQty * unitPrice;
        return updated;
      } else {
        const cappedQty = Math.min(qty, availableStock);
        if (qty > availableStock) {
          showToast(`Only ${availableStock} packs are available.`);
        }
        return [
          ...prevItems,
          {
            key: itemKey,
            productId: product._id || product.id || product.slug,
            variantId: selectedVariant.id || selectedVariant._id || null,
            slug: product.slug,
            title: product.title,
            variantName: selectedVariant.name || 'Standard Pack',
            weight: selectedVariant.weight || '',
            price: unitPrice,
            originalPrice: selectedVariant.originalPrice || unitPrice,
            image: product.image,
            availableStock: availableStock,
            quantity: cappedQty,
            totalPrice: unitPrice * cappedQty,
          },
        ];
      }
    });

    showToast(`Added "${product.title} (${selectedVariant.weight || selectedVariant.name})"` );
  };

  const updateQuantity = (itemKey, delta) => {
    setCartItems((prevItems) => {
      return prevItems
        .map((item) => {
          if (item.key === itemKey) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (item.availableStock !== undefined && newQty > item.availableStock) {
              showToast(`Only ${item.availableStock} packs are available.`);
              return {
                ...item,
                quantity: item.availableStock,
                totalPrice: item.availableStock * item.price,
              };
            }
            return {
              ...item,
              quantity: newQty,
              totalPrice: newQty * item.price,
            };
          }
          return item;
        })
        .filter(Boolean);
    });
  };

  const removeFromCart = (itemKey) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.key !== itemKey));
  };

  const clearCart = () => {
    setCartItems([]);
    setAppliedCoupon(null);
    setCouponDiscountAmount(0);
  };

  const subtotal = cartItems.reduce((acc, item) => acc + item.totalPrice, 0);
  const deliveryFee = subtotal >= 499 || subtotal === 0 ? 0 : 49;
  const grandTotal = Math.max(0, subtotal - couponDiscountAmount + deliveryFee);
  const totalItemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const applyCoupon = async (code) => {
    const upperCode = code ? code.toUpperCase() : '';
    try {
      const res = await api.post('/coupons/validate', { code: upperCode, subtotal });
      if (res.data && res.data.valid) {
        setAppliedCoupon(res.data);
        setCouponDiscountAmount(res.data.discountAmount);
        showToast(res.data.message);
        return { success: true, message: res.data.message };
      }
    } catch (error) {
      // Graceful client fallback validation
      if (upperCode === 'WELCOME10') {
        const discount = Math.round(subtotal * 0.1);
        const fallbackCoupon = {
          valid: true,
          code: 'WELCOME10',
          discountType: 'percentage',
          discountValue: 10,
          discountAmount: discount,
          message: `Coupon applied! You saved ₹${discount}`,
        };
        setAppliedCoupon(fallbackCoupon);
        setCouponDiscountAmount(discount);
        showToast(`Coupon WELCOME10 applied! You saved ₹${discount}`);
        return { success: true, message: `Coupon WELCOME10 applied! You saved ₹${discount}` };
      } else if (upperCode === 'MILASTY100') {
        if (subtotal < 500) {
          const msg = 'Minimum order amount of ₹500 required for MILASTY100';
          showToast(msg);
          return { success: false, message: msg };
        }
        const discount = 100;
        const fallbackCoupon = {
          valid: true,
          code: 'MILASTY100',
          discountType: 'fixed',
          discountValue: 100,
          discountAmount: discount,
          message: 'Coupon MILASTY100 applied! You saved ₹100',
        };
        setAppliedCoupon(fallbackCoupon);
        setCouponDiscountAmount(discount);
        showToast('Coupon MILASTY100 applied! You saved ₹100');
        return { success: true, message: 'Coupon MILASTY100 applied! You saved ₹100' };
      }
      const msg = error.response?.data?.message || 'Invalid coupon code';
      showToast(msg);
      return { success: false, message: msg };
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscountAmount(0);
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
