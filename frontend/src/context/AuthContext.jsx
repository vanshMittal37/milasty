import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('milasty_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('milasty_token') || null;
  });

  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('milasty_token', token);
    } else {
      delete api.defaults.headers.common['Authorization'];
      localStorage.removeItem('milasty_token');
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('milasty_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('milasty_user');
    }
  }, [user]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    setUser(res.data);
    setToken(res.data.token);
    return res.data;
  };

  const register = async (name, email, password, phone) => {
    const res = await api.post('/auth/register', { name, email, password, phone });
    setUser(res.data);
    setToken(res.data.token);
    return res.data;
  };

  const logout = () => {
    // Clear user-specific persistent states
    if (user && user._id) {
      localStorage.removeItem(`milasty_cart_${user._id}`);
      localStorage.removeItem(`milasty_wishlist_${user._id}`);
    }
    
    // Clear authorization headers
    delete api.defaults.headers.common['Authorization'];

    // Clear main authentication storage
    localStorage.removeItem('milasty_user');
    localStorage.removeItem('milasty_token');

    // Reset user/token context state
    setUser(null);
    setToken(null);
  };

  const addAddress = async (addressData) => {
    const res = await api.post('/auth/address', addressData);
    const updatedAddresses = res.data;
    setUser((prev) => ({ ...prev, addresses: updatedAddresses }));
    return updatedAddresses;
  };

  const deleteAddress = async (addressId) => {
    const res = await api.delete(`/auth/address/${addressId}`);
    const updatedAddresses = res.data;
    setUser((prev) => ({ ...prev, addresses: updatedAddresses }));
    return updatedAddresses;
  };

  const updateProfile = async (profileData) => {
    const res = await api.put('/auth/profile', profileData);
    const updatedUser = res.data;
    setUser((prev) => ({ ...prev, ...updatedUser }));
    return updatedUser;
  };

  const updateAddress = async (addressId, addressData) => {
    const res = await api.put(`/auth/address/${addressId}`, addressData);
    const updatedAddresses = res.data;
    setUser((prev) => ({ ...prev, addresses: updatedAddresses }));
    return updatedAddresses;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isAdmin: user?.role === 'admin',
        login,
        register,
        logout,
        addAddress,
        deleteAddress,
        updateProfile,
        updateAddress,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
