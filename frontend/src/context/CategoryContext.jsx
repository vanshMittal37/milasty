import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const CategoryContext = createContext();

export function CategoryProvider({ children }) {
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const refreshCategories = async () => {
    try {
      setCategoriesLoading(true);
      const res = await api.get('/categories');
      setCategories(res.data || []);
    } catch (err) {
      console.error('Error fetching dynamic categories:', err);
    } finally {
      setCategoriesLoading(false);
    }
  };

  useEffect(() => {
    refreshCategories();
  }, []);

  return (
    <CategoryContext.Provider value={{ categories, setCategories, categoriesLoading, refreshCategories }}>
      {children}
    </CategoryContext.Provider>
  );
}

export function useCategories() {
  const context = useContext(CategoryContext);
  if (!context) {
    throw new Error('useCategories must be used within a CategoryProvider');
  }
  return context;
}
