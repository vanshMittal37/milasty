import React, { createContext, useContext, useState, useCallback } from 'react';
import api from '../api/axios';

const DeliveryContext = createContext();

export function DeliveryProvider({ children }) {
  const [shippingRateInfo, setShippingRateInfo] = useState({
    loading: false,
    pincode: '',
    shippingCharge: 0,
    error: null,
  });

  /**
   * Fetch the delivery charge for a pincode. The courier is chosen server-side; only the amount is returned.
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
        const fee = Number(res.data.deliveryFee ?? res.data.shippingCharge ?? 0);

        const infoData = {
          loading: false,
          pincode: cleanPin,
          shippingCharge: fee,
          error: null,
        };

        setShippingRateInfo(infoData);
        return { success: true, shippingCharge: fee };
      } else {
        const errMsg = res.data?.message || 'Failed to fetch the delivery charge.';
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
    deliveryNote: 'Delivery available across India',
    message: 'All India Delivery Available',
  };

  const checkPincode = useCallback(async (pincode) => {
    if (pincode && /^\d{6}$/.test(String(pincode).trim())) {
      const res = await fetchShippingRates({ pincode });
      return {
        checked: true,
        available: res.success,
        deliveryCharge: res.shippingCharge || 0,
        isFreeDelivery: false,
        message: res.success ? 'Delivery available' : (res.error || 'Pincode not deliverable'),
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

  /**
   * Helper function for calculating delivery fee (uses the quoted delivery charge if set, else 0)
   */
  const calculateDeliveryFee = useCallback((subtotal = 0) => {
    const fee = Number(shippingRateInfo.shippingCharge || 0);
    return {
      fee,
      isFree: false,
      amountNeededForFree: 0,
      percentageToFree: 100,
    };
  }, [shippingRateInfo.shippingCharge]);

  /**
   * Reset delivery info state
   */
  const clearDeliveryInfo = useCallback(() => {
    setShippingRateInfo({
      loading: false,
      pincode: '',
      shippingCharge: 0,
      error: null,
    });
  }, []);

  return (
    <DeliveryContext.Provider
      value={{
        deliveryInfo,
        shippingRateInfo,
        fetchShippingRates,
        checkPincode,
        calculateDeliveryFee,
        clearDeliveryInfo,
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
