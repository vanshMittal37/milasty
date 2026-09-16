import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from './AuthContext';

const DeliveryContext = createContext();

const SESSION_STORAGE_KEY = 'milasty_delivery_info';

export function DeliveryProvider({ children }) {
  const { user, isAuthenticated } = useAuth();

  const [deliveryInfo, setDeliveryInfo] = useState(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Unable to load saved delivery info:', e);
    }
    return {
      checked: false,
      available: null,
      pincode: '',
      city: '',
      state: '',
      deliveryCharge: 0,
      isFreeDelivery: false,
      estimatedDays: '3–5 business days',
      deliveryNote: '',
      message: '',
      isSavedAddress: false,
      isTemp: false,
      savedAddressLabel: '',
    };
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Synchronize with Session Storage
  useEffect(() => {
    try {
      if (deliveryInfo && deliveryInfo.checked) {
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(deliveryInfo));
      } else {
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
      }
    } catch (e) {
      console.warn('Unable to save delivery info:', e);
    }
  }, [deliveryInfo]);

  // Perform serviceability check against backend DB API
  const checkPincode = useCallback(async (pincodeInput, options = {}) => {
    const pincode = String(pincodeInput || '').trim();

    if (!pincode || !/^\d{6}$/.test(pincode)) {
      const invalidState = {
        checked: false,
        available: false,
        pincode,
        city: '',
        state: '',
        deliveryCharge: 0,
        isFreeDelivery: false,
        estimatedDays: '3–5 business days',
        deliveryNote: '',
        message: 'Please enter a valid 6-digit Indian PIN code.',
        isSavedAddress: options.isSavedAddress || false,
        isTemp: options.isTemp || false,
        savedAddressLabel: options.savedAddressLabel || '',
      };
      setError('Please enter a valid 6-digit Indian PIN code.');
      return invalidState;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.get(`/delivery-areas/check/${pincode}`);
      const data = res.data || {};

      const resultState = {
        checked: true,
        available: !!data.available,
        pincode: data.pincode || pincode,
        city: data.city || '',
        state: data.state || '',
        deliveryCharge: Number(data.deliveryCharge || 0),
        isFreeDelivery: !!data.isFreeDelivery || Number(data.deliveryCharge || 0) === 0,
        estimatedDays: data.estimatedDays || '3–5 business days',
        deliveryNote: data.deliveryNote || 'Delivered within 3–5 business days',
        message: data.message || (data.available ? `Delivery available in ${data.city}, ${data.state}` : "Sorry, we currently don't deliver to this area."),
        isSavedAddress: !!options.isSavedAddress,
        isTemp: !!options.isTemp,
        savedAddressLabel: options.savedAddressLabel || '',
      };

      setDeliveryInfo(resultState);
      return resultState;
    } catch (err) {
      console.error('checkPincode error:', err);
      const fallbackState = {
        checked: true,
        available: false,
        pincode,
        city: '',
        state: '',
        deliveryCharge: 0,
        isFreeDelivery: false,
        estimatedDays: '3–5 business days',
        deliveryNote: '',
        message: err.response?.data?.message || 'Unable to check delivery availability. Please try again.',
        isSavedAddress: !!options.isSavedAddress,
        isTemp: !!options.isTemp,
        savedAddressLabel: options.savedAddressLabel || '',
      };
      setError(fallbackState.message);
      setDeliveryInfo(fallbackState);
      return fallbackState;
    } finally {
      setLoading(false);
    }
  }, []);

  // Automatic saved address detection on login / profile load
  useEffect(() => {
    if (!isAuthenticated) {
      // Requirement 18: Privacy - Clear customer's saved address upon logout
      if (deliveryInfo.isSavedAddress || (deliveryInfo.checked && !deliveryInfo.isTemp)) {
        clearDeliveryInfo();
      }
      return;
    }

    // Customer is logged in — fetch default address PIN
    const addresses = user?.addresses || [];
    if (addresses.length > 0) {
      const defaultAddr = addresses.find((a) => (a.isDefault || a.is_default) && a.pincode && /^\d{6}$/.test(String(a.pincode).trim()))
        || addresses.find((a) => a.pincode && /^\d{6}$/.test(String(a.pincode).trim()))
        || null;

      if (defaultAddr && defaultAddr.pincode) {
        // If user hasn't explicitly entered a temporary PIN during this session, auto-check default saved PIN
        if (!deliveryInfo.isTemp || !deliveryInfo.checked) {
          checkPincode(defaultAddr.pincode, {
            isSavedAddress: true,
            savedAddressLabel: defaultAddr.addressType || defaultAddr.fullName || 'Saved Address',
          });
        }
      }
    }
  }, [user, isAuthenticated, checkPincode]);

  const clearDeliveryInfo = () => {
    const resetState = {
      checked: false,
      available: null,
      pincode: '',
      city: '',
      state: '',
      deliveryCharge: 0,
      isFreeDelivery: false,
      estimatedDays: '3–5 business days',
      deliveryNote: '',
      message: '',
      isSavedAddress: false,
      isTemp: false,
      savedAddressLabel: '',
    };
    setDeliveryInfo(resetState);
    setError(null);
    try {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    } catch (e) {}
  };

  const setDeliveryInfoDirect = (info) => {
    setDeliveryInfo((prev) => ({ ...prev, ...info, checked: true }));
  };

  return (
    <DeliveryContext.Provider
      value={{
        deliveryInfo,
        loading,
        error,
        checkPincode,
        clearDeliveryInfo,
        setDeliveryInfoDirect,
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
