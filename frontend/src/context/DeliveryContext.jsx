import React, { createContext, useContext, useState, useCallback } from 'react';
import api from '../api/axios';

const DeliveryContext = createContext();

export function DeliveryProvider({ children }) {
  const [shippingRateInfo, setShippingRateInfo] = useState({
    loading: false,
    pincode: '',
    shippingCharge: 0,
    selectedRate: null,
    rateList: [],
    error: null,
  });

  /**
   * Fetch dynamic live shipping rates from Shiprath API for a given pincode and items/weight
   */
  const fetchShippingRates = useCallback(async ({ pincode, weight = 1, items = [] }) => {
    const cleanPin = String(pincode || '').trim();
    if (!cleanPin || !/^\d{6}$/.test(cleanPin)) {
      return { success: false, shippingCharge: 0, error: 'Valid 6-digit Indian PIN code required.' };
    }

    setShippingRateInfo(prev => ({ ...prev, loading: true, error: null, pincode: cleanPin }));

    try {
      const res = await api.post('/shipping/rates', {
        pincode: cleanPin,
        weight,
        items,
      });

      if (res.data && res.data.success) {
        const selected = res.data.selectedRate;
        const fee = Number(res.data.shippingCharge || selected?.total_charges || 0);

        const infoData = {
          loading: false,
          pincode: cleanPin,
          shippingCharge: fee,
          selectedRate: selected,
          rateList: res.data.rateList || [],
          error: null,
        };

        setShippingRateInfo(infoData);
        return { success: true, shippingCharge: fee, selectedRate: selected, rateList: res.data.rateList || [] };
      } else {
        const errMsg = res.data?.message || 'Failed to fetch dynamic shipping rates.';
        setShippingRateInfo(prev => ({ ...prev, loading: false, error: errMsg }));
        return { success: false, shippingCharge: 0, error: errMsg };
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Error communicating with shipping service.';
      setShippingRateInfo(prev => ({ ...prev, loading: false, error: errMsg }));
      return { success: false, shippingCharge: 0, error: errMsg };
    }
  }, []);

  // Backward compatible deliveryInfo state
  const deliveryInfo = {
    checked: true,
    available: true,
    pincode: shippingRateInfo.pincode || '',
    city: '',
    state: '',
    deliveryCharge: shippingRateInfo.shippingCharge || 0,
    isFreeDelivery: false,
    estimatedDays: '3–5 business days',
    deliveryNote: 'Dynamic Shiprath Delivery Available across India',
    message: 'All India Shiprath Delivery Available',
  };

  const checkPincode = useCallback(async (pincode) => {
    if (pincode && /^\d{6}$/.test(String(pincode).trim())) {
      const res = await fetchShippingRates({ pincode });
      return {
        checked: true,
        available: res.success,
        deliveryCharge: res.shippingCharge || 0,
        isFreeDelivery: false,
        message: res.success ? 'Dynamic Shiprath Delivery Available' : (res.error || 'Pincode not deliverable'),
      };
    }
    return {
      checked: true,
      available: true,
      deliveryCharge: 0,
      isFreeDelivery: false,
      message: 'All India Delivery Available',
    };
  }, [fetchShippingRates]);

  return (
    <DeliveryContext.Provider
      value={{
        deliveryInfo,
        shippingRateInfo,
        fetchShippingRates,
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
