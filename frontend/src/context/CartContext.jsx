import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const currentUserId = user ? (user.id || user._id) : null;
  const prevUserIdRef = useRef(currentUserId);
  const isSyncingRef = useRef(false);

  // Load cart initially based on whether user is logged in or guest
  const [cartItems, setCartItems] = useState(() => {
    try {
      if (currentUserId) {
        const userSaved = localStorage.getItem(`milasty_cart_${currentUserId}`);
        if (userSaved) return JSON.parse(userSaved);
      } else {
        const guestSaved = localStorage.getItem('milasty_guest_cart');
        if (guestSaved) return JSON.parse(guestSaved);
      }
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
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Helper to generate unique item key based on product_id + variant + customization_note
  const getItemKey = (item) => {
    const pId = item.productId || item.product_id || item._id || item.id || item.slug || '';
    const vName = item.variantName || item.variant_name || item.weight || 'Standard Pack';
    const vId = item.variantId || item.variant_id || vName;
    const note = String(item.customization_note || item.customizationNote || '').trim();
    return `${pId}_${vId}_${note}`;
  };

  // Helper to merge guest cart items with user server cart items
  const mergeCartLists = (userCart = [], guestCart = []) => {
    const map = new Map();

    (userCart || []).forEach((item) => {
      const key = getItemKey(item);
      map.set(key, { ...item });
    });

    (guestCart || []).forEach((guestItem) => {
      const key = getItemKey(guestItem);
      if (map.has(key)) {
        const existing = map.get(key);
        const newQty = Number(existing.quantity || 0) + Number(guestItem.quantity || 0);
        const unitPrice = Number(existing.unitPrice || guestItem.unitPrice || 0);
        map.set(key, {
          ...existing,
          quantity: newQty,
          totalPrice: unitPrice * newQty,
        });
      } else {
        map.set(key, { ...guestItem });
      }
    });

    return Array.from(map.values());
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Load and sync server cart for authenticated users
  const syncServerCart = useCallback(async (activeUserId) => {
    if (!activeUserId || isSyncingRef.current) return;
    isSyncingRef.current = true;

    try {
      // 1. Fetch authenticated user's cart from Supabase backend
      const res = await api.get('/cart');
      const serverCart = Array.isArray(res.data?.items) ? res.data.items : [];

      // 2. Check for guest cart items in localStorage to merge
      let guestCart = [];
      try {
        const guestSaved = localStorage.getItem('milasty_guest_cart');
        if (guestSaved) {
          guestCart = JSON.parse(guestSaved);
        }
      } catch (e) {}

      let finalCart = serverCart;

      if (guestCart && guestCart.length > 0) {
        // Merge guest cart into server cart
        finalCart = mergeCartLists(serverCart, guestCart);
        // Persist merged cart back to server
        await api.put('/cart', { items: finalCart });
        // Clear guest cart from localStorage
        try {
          localStorage.removeItem('milasty_guest_cart');
        } catch (e) {}
      }

      setCartItems(finalCart);

      // Cache locally for instant UX
      try {
        localStorage.setItem(`milasty_cart_${activeUserId}`, JSON.stringify(finalCart));
        localStorage.setItem('milasty_cart_items', JSON.stringify(finalCart));
      } catch (e) {}
    } catch (error) {
      console.error('Failed to sync server cart:', error);
      showToast('Unable to synchronize cart with server. Retrying...');
    } finally {
      isSyncingRef.current = false;
    }
  }, []);

  // Handle Auth transitions (login / logout) & initial load
  useEffect(() => {
    const prevUserId = prevUserIdRef.current;
    const activeUserId = currentUserId;

    if (activeUserId) {
      // User is logged in — fetch server cart
      syncServerCart(activeUserId);
    } else if (prevUserId && !activeUserId) {
      // Logout transition — reset UI cart, do NOT erase server cart
      setCartItems([]);
      setAppliedCoupon(null);
      setCouponDiscountAmount(0);
      try {
        localStorage.removeItem('milasty_cart_items');
        localStorage.removeItem('milasty_guest_cart');
        sessionStorage.removeItem('milasty_applied_coupon');
      } catch (e) {}
    }

    prevUserIdRef.current = activeUserId;
  }, [currentUserId, syncServerCart]);

  // Save changes to server/localStorage helper
  const persistCartChanges = async (newCart) => {
    const activeUserId = user ? (user.id || user._id) : null;
    if (activeUserId) {
      try {
        const res = await api.put('/cart', { items: newCart });
        const serverSaved = Array.isArray(res.data?.items) ? res.data.items : newCart;
        localStorage.setItem(`milasty_cart_${activeUserId}`, JSON.stringify(serverSaved));
        localStorage.setItem('milasty_cart_items', JSON.stringify(serverSaved));
      } catch (error) {
        console.error('Failed to persist cart changes to server:', error);
        showToast('Cart saved locally. Reconnecting to server...');
      }
    } else {
      try {
        localStorage.setItem('milasty_guest_cart', JSON.stringify(newCart));
        localStorage.setItem('milasty_cart_items', JSON.stringify(newCart));
      } catch (e) {}
    }
  };

  const addToCart = async (product, variant, qty = 1, customizationNote = '') => {
    if (!product) return;

    const selectedVariant = variant || (product.variants && product.variants[0]) || {};
    const unitPrice = selectedVariant.price !== undefined ? Number(selectedVariant.price) : Number(product.price || 0);
    const variantName = selectedVariant.weight || selectedVariant.name || selectedVariant.variantWeight || 'Standard Pack';
    const variantId = selectedVariant.id || selectedVariant._id || variantName;
    const pId = product._id || product.id || product.slug || 'item';
    const cleanNote = String(customizationNote || '').trim().slice(0, 300);
    
    const cartItemId = `${pId}_${variantId}_${cleanNote ? encodeURIComponent(cleanNote.slice(0, 15)) + '_' + Date.now() : 'std'}`;
    const image = product.image || product.image_url || product.primary_image || '/images/image1.jpeg';
    const title = product.title || product.name || 'MILASTY Bake';
    const allowCustomization = Boolean(product.allow_customization || product.allowCustomization);
    const placeholder = product.customization_placeholder || product.customizationPlaceholder || null;

    let updatedList = [];
    const existingIdx = cartItems.findIndex((item) => {
      const itemPId = item.productId || item.product_id;
      const itemVId = item.variantId || item.variant_id || item.variantName;
      const itemNote = String(item.customization_note || item.customizationNote || '').trim();
      return itemPId === pId && (itemVId === variantId || item.variantName === variantName) && itemNote === cleanNote;
    });

    if (existingIdx > -1) {
      updatedList = [...cartItems];
      const newQty = updatedList[existingIdx].quantity + qty;
      updatedList[existingIdx] = {
        ...updatedList[existingIdx],
        quantity: newQty,
        totalPrice: updatedList[existingIdx].unitPrice * newQty,
      };
    } else {
      updatedList = [
        ...cartItems,
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
          customization_note: cleanNote || null,
          allow_customization: allowCustomization,
          customization_placeholder: placeholder,
        },
      ];
    }

    setCartItems(updatedList);
    await persistCartChanges(updatedList);
    showToast(`✓ Added ${title} (${variantName}) to cart`);
  };

  const updateCartItemCustomization = async (targetId, newNote) => {
    if (!targetId) return;
    const cleanNote = String(newNote || '').trim().slice(0, 300);

    const updatedList = cartItems.map((item) => {
      const matches = item.cartItemId === targetId || item.id === targetId || item._id === targetId;
      if (matches) {
        return {
          ...item,
          customization_note: cleanNote || null,
        };
      }
      return item;
    });

    setCartItems(updatedList);
    await persistCartChanges(updatedList);
    showToast('✓ Special instruction updated');
  };

  const removeCartItemCustomization = async (targetId) => {
    if (!targetId) return;

    const updatedList = cartItems.map((item) => {
      const matches = item.cartItemId === targetId || item.id === targetId || item._id === targetId;
      if (matches) {
        return {
          ...item,
          customization_note: null,
        };
      }
      return item;
    });

    setCartItems(updatedList);
    await persistCartChanges(updatedList);
    showToast('Special instruction removed');
  };

  const updateQuantity = async (targetId, newQty) => {
    if (!targetId) return;
    if (newQty <= 0) {
      await removeFromCart(targetId);
      return;
    }

    const updatedList = cartItems.map((item) => {
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
    });

    setCartItems(updatedList);
    await persistCartChanges(updatedList);
  };

  const removeFromCart = async (targetId) => {
    if (!targetId) return;

    const updatedList = cartItems.filter((item) => {
      const idMatches =
        (item.cartItemId && item.cartItemId === targetId) ||
        (item.productId && item.productId === targetId) ||
        (item._id && item._id === targetId) ||
        (item.id && item.id === targetId) ||
        (item.key && item.key === targetId);
      return !idMatches;
    });

    setCartItems(updatedList);
    await persistCartChanges(updatedList);
  };

  const clearCart = async () => {
    setCartItems([]);
    setAppliedCoupon(null);
    setCouponDiscountAmount(0);

    if (currentUserId) {
      try {
        await api.delete('/cart');
        localStorage.removeItem(`milasty_cart_${currentUserId}`);
        localStorage.removeItem('milasty_cart_items');
      } catch (error) {
        console.error('Failed to clear cart on server:', error);
      }
    } else {
      try {
        localStorage.removeItem('milasty_guest_cart');
        localStorage.removeItem('milasty_cart_items');
      } catch (e) {}
    }

    try {
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
        updateCartItemCustomization,
        removeCartItemCustomization,
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
        syncServerCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);

