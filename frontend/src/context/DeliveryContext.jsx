import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const DeliveryContext = createContext();

const SESSION_STORAGE_KEY = 'milasty_delivery_info';

export function DeliveryProvider({ children }) {
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
    };
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      if (deliveryInfo.checked) {
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(deliveryInfo));
      } else {
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
      }
    } catch (e) {
      console.warn('Unable to save delivery info:', e);
    }
  }, [deliveryInfo]);

  const checkPincode = async (pincodeInput) => {
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
      };
      setError(fallbackState.message);
      setDeliveryInfo(fallbackState);
      return fallbackState;
    } finally {
      setLoading(false);
    }
  };

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
