import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import api from '../api/axios';
import AuthPromptModal from '../components/AuthPromptModal';

const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();

  const [wishlistItems, setWishlistItems] = useState([]);
  const [wishlistProductIds, setWishlistProductIds] = useState(new Set());
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [togglingIds, setTogglingIds] = useState(new Set());

  // Clean up any legacy guest local storage items
  useEffect(() => {
    try {
      localStorage.removeItem('milasty_wishlist_guest');
      if (user) {
        localStorage.removeItem(`milasty_wishlist_${user._id || user.id}`);
      }
    } catch (e) {}
  }, [user]);

  // Sync wishlist from server when authenticated, clear on logout
  const fetchServerWishlist = useCallback(async () => {
    if (!isAuthenticated) return;
    setWishlistLoading(true);
    try {
      const res = await api.get('/wishlist');
      if (res.data && res.data.success) {
        const idsArray = res.data.productIds || [];
        const idsSet = new Set(idsArray.map((id) => String(id)));
        setWishlistProductIds(idsSet);
        setWishlistItems(res.data.products || []);
      } else if (Array.isArray(res.data)) {
        const items = res.data;
        setWishlistItems(items);
        const idsSet = new Set(items.map((item) => String(item._id || item.id || item.slug)));
        setWishlistProductIds(idsSet);
      }
    } catch (err) {
      console.error('Error fetching wishlist from server:', err);
    } finally {
      setWishlistLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchServerWishlist();
    } else {
      // Clear state immediately on logout so no previous user hearts remain visible
      setWishlistItems([]);
      setWishlistProductIds(new Set());
      setShowAuthModal(false);
      setWishlistLoading(false);
    }
  }, [isAuthenticated, fetchServerWishlist]);

  // Fast O(1) membership check
  const isInWishlist = useCallback(
    (productId) => {
      if (!productId) return false;
      const targetId = String(productId).trim();
      return wishlistProductIds.has(targetId);
    },
    [wishlistProductIds]
  );

  const isProductInWishlist = isInWishlist;

  const toggleWishlist = useCallback(
    async (product) => {
      if (!product) return;

      // Require Auth for guest users
      if (!isAuthenticated) {
        setShowAuthModal(true);
        return;
      }

      const pId = String(product._id || product.id || product.slug || '').trim();
      if (!pId) return;

      // Serialize clicks & prevent race conditions
      if (togglingIds.has(pId)) return;

      setTogglingIds((prev) => new Set(prev).add(pId));

      const isCurrentlyWishlisted = wishlistProductIds.has(pId);

      // Optimistic update
      setWishlistProductIds((prev) => {
        const next = new Set(prev);
        if (isCurrentlyWishlisted) {
          next.delete(pId);
        } else {
          next.add(pId);
        }
        return next;
      });

      setWishlistItems((prev) => {
        if (isCurrentlyWishlisted) {
          return prev.filter((item) => String(item._id || item.id || item.slug) !== pId);
        } else {
          return [...prev, product];
        }
      });

      try {
        const res = await api.post('/wishlist/toggle', { productId: pId });
        if (res.data && res.data.success) {
          const idsSet = new Set((res.data.productIds || []).map((id) => String(id)));
          setWishlistProductIds(idsSet);
          setWishlistItems(res.data.products || []);

          if (res.data.added) {
            toast.success('Added to wishlist');
          } else {
            toast.info('Removed from wishlist');
          }
        } else {
          throw new Error(res.data?.message || 'Wishlist operation failed');
        }
      } catch (err) {
        console.error('Database/API wishlist error:', err);
        // Rollback optimistic update on failure & show exact error toast
        setWishlistProductIds((prev) => {
          const next = new Set(prev);
          if (isCurrentlyWishlisted) {
            next.add(pId);
          } else {
            next.delete(pId);
          }
          return next;
        });

        setWishlistItems((prev) => {
          if (isCurrentlyWishlisted) {
            return [...prev, product];
          } else {
            return prev.filter((item) => String(item._id || item.id || item.slug) !== pId);
          }
        });

        if (isCurrentlyWishlisted) {
          toast.error('Could not remove this product from your wishlist.');
        } else {
          toast.error('Could not add this product to your wishlist. Please try again.');
        }
      } finally {
        setTogglingIds((prev) => {
          const next = new Set(prev);
          next.delete(pId);
          return next;
        });
      }
    },
    [isAuthenticated, wishlistProductIds, togglingIds, toast]
  );

  const addToWishlist = useCallback(
    async (product) => {
      const pId = String(product._id || product.id || product.slug || '').trim();
      if (!isInWishlist(pId)) {
        await toggleWishlist(product);
      }
    },
    [isInWishlist, toggleWishlist]
  );

  const removeFromWishlist = useCallback(
    async (product) => {
      const pId = String(product._id || product.id || product.slug || '').trim();
      if (isInWishlist(pId)) {
        await toggleWishlist(product);
      }
    },
    [isInWishlist, toggleWishlist]
  );

  const value = useMemo(
    () => ({
      wishlistItems,
      wishlistProductIds,
      wishlistCount: wishlistProductIds.size,
      wishlistLoading,
      isWishlistLoading: wishlistLoading,
      isInWishlist,
      isProductInWishlist,
      toggleWishlist,
      addToWishlist,
      removeFromWishlist,
      getUserWishlist: fetchServerWishlist,
      showAuthModal,
      setShowAuthModal,
    }),
    [
      wishlistItems,
      wishlistProductIds,
      wishlistLoading,
      isInWishlist,
      isProductInWishlist,
      toggleWishlist,
      addToWishlist,
      removeFromWishlist,
      fetchServerWishlist,
      showAuthModal,
    ]
  );

  return (
    <WishlistContext.Provider value={value}>
      {children}
      <AuthPromptModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        title="Login Required"
        message="Please login or create an account to save products to your wishlist."
      />
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

