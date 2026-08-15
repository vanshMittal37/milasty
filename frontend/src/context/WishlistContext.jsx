import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import api from '../api/axios';

const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [wishlistItems, setWishlistItems] = useState([]);

  // Load wishlist item list based on active user context
  useEffect(() => {
    const key = user ? `milasty_wishlist_${user._id}` : 'milasty_wishlist_guest';
    try {
      const saved = localStorage.getItem(key);
      setWishlistItems(saved ? JSON.parse(saved) : []);
    } catch (e) {
      setWishlistItems([]);
    }
  }, [user]);

  // Keep server wishlist synchronized if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchServerWishlist();
    }
  }, [isAuthenticated]);

  // Save changes to active storage key when wishlist modifies
  useEffect(() => {
    const key = user ? `milasty_wishlist_${user._id}` : 'milasty_wishlist_guest';
    try {
      localStorage.setItem(key, JSON.stringify(wishlistItems));
    } catch (e) {
      // Continue
    }
  }, [wishlistItems, user]);

  const fetchServerWishlist = async () => {
    try {
      const res = await api.get('/wishlist');
      if (res.data) {
        setWishlistItems(res.data);
      }
    } catch (e) {
      // Fallback
    }
  };

  const toggleWishlist = async (product) => {
    const pId = product._id || product.slug;
    const exists = wishlistItems.some((item) => (item._id || item.slug) === pId);

    if (isAuthenticated) {
      try {
        await api.post('/wishlist/toggle', { productId: pId });
        fetchServerWishlist();
      } catch (e) {
        // Fallback local toggle
        localToggle(product, exists);
      }
    } else {
      localToggle(product, exists);
    }
  };

  const localToggle = (product, exists) => {
    const pId = product._id || product.slug;
    if (exists) {
      setWishlistItems((prev) => prev.filter((item) => (item._id || item.slug) !== pId));
    } else {
      setWishlistItems((prev) => [...prev, product]);
    }
  };

  const isInWishlist = (productId) => {
    return wishlistItems.some((item) => (item._id || item.slug) === productId);
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlistItems,
        toggleWishlist,
        isInWishlist,
        wishlistCount: wishlistItems.length,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => useContext(WishlistContext);
