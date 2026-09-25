import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from './AuthContext';

const DeliveryContext = createContext();

export function DeliveryProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const [deliveryRules, setDeliveryRules] = useState([]);
  const [loadingRules, setLoadingRules] = useState(false);

  // Fetch active delivery charge rules on mount
  const fetchDeliveryRules = useCallback(async () => {
    setLoadingRules(true);
    try {
      const res = await api.get('/delivery-charges/public-rules');
      if (res.data && res.data.rules) {
        setDeliveryRules(res.data.rules.filter(r => r.is_active));
      }
    } catch (err) {
      console.warn('Unable to load delivery rules:', err);
    } finally {
      setLoadingRules(false);
    }
  }, []);

  useEffect(() => {
    fetchDeliveryRules();
  }, [fetchDeliveryRules]);

  /**
   * Synchronous / Asynchronous delivery calculation helper
   */
  const calculateDeliveryFee = useCallback((subtotalInput) => {
    const subtotal = Math.max(0, Number(subtotalInput || 0));
    const activeRules = deliveryRules.filter(r => r.is_active);

    if (activeRules.length === 0) {
      // Fallback default rules if rules not loaded yet from backend
      if (subtotal >= 1500) return { fee: 0, isFree: true };
      if (subtotal >= 800) return { fee: 20, isFree: false };
      return { fee: 40, isFree: false };
    }

    const matchedRule = activeRules.find(r => {
      const min = Number(r.min_order_value || 0);
      const max = r.max_order_value !== null && r.max_order_value !== '' && r.max_order_value !== undefined 
        ? Number(r.max_order_value) 
        : null;

      if (subtotal < min) return false;
      if (max !== null && subtotal > max) return false;
      return true;
    });

    if (!matchedRule) {
      return { fee: 0, isFree: false, error: 'No delivery rule matches this order amount.' };
    }

    const fee = Number(matchedRule.delivery_charge || 0);
    const isFree = matchedRule.is_free_delivery || fee === 0;

    return {
      fee: isFree ? 0 : fee,
      isFree,
      matchedRule,
    };
  }, [deliveryRules]);

  // Backward compatible deliveryInfo state (Always Available)
  const deliveryInfo = {
    checked: true,
    available: true,
    pincode: '',
    city: '',
    state: '',
    deliveryCharge: 0,
    isFreeDelivery: true,
    estimatedDays: '3–5 business days',
    deliveryNote: 'All India Delivery Available',
    message: 'All India Delivery Available',
  };

  const checkPincode = useCallback(async () => {
    return {
      checked: true,
      available: true,
      deliveryCharge: 0,
      isFreeDelivery: true,
      message: 'All India Delivery Available',
    };
  }, []);

  return (
    <DeliveryContext.Provider
      value={{
        deliveryInfo,
        deliveryRules,
        loadingRules,
        fetchDeliveryRules,
        calculateDeliveryFee,
        checkPincode,
      }}
    >
      {children}
    </DeliveryContext.Provider>
  );
}

export function useDelivery() {
  const context = useContext(DeliveryContext);
  if (!context) {
    throw new Error('useDelivery must be used within a DeliveryProvider');
  }
  return context;
}
