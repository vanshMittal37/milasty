import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const DEFAULT_FALLBACK_CATEGORIES = [
  { 
    _id: 'starter', 
    id: 'starter', 
    slug: 'starter', 
    name: 'STARTER FAVOURITES', 
    label: 'Starter Favourites', 
    description: 'Curated tasting boxes & best sellers',
    subtitle: 'Curated tasting boxes & best sellers',
    display_order: 1,
    image_url: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600',
    image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600',
    productCount: 0,
    productIds: []
  },
  { 
    _id: 'daily', 
    id: 'daily', 
    slug: 'daily', 
    name: 'DAILY RITUAL', 
    label: 'Daily Ritual', 
    description: 'Guilt-free everyday tea companions',
    subtitle: 'Guilt-free everyday tea companions',
    display_order: 2,
    image_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600',
    productCount: 0,
    productIds: []
  },
  { 
    _id: 'gifting', 
    id: 'gifting', 
    slug: 'gifting', 
    name: 'GIFTING HAMPERS', 
    label: 'Gifting Hampers', 
    description: 'Luxury artisanal gift hampers',
    subtitle: 'Luxury artisanal gift hampers',
    display_order: 3,
    image_url: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=600',
    image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=600',
    productCount: 0,
    productIds: []
  },
  { 
    _id: 'cookies', 
    id: 'cookies', 
    slug: 'cookies', 
    name: 'COOKIES', 
    label: 'Cookies', 
    description: 'Pure Desi Ghee millet cookies',
    subtitle: 'Pure Desi Ghee millet cookies',
    display_order: 4,
    image_url: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=600',
    image: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=600',
    productCount: 0,
    productIds: []
  },
];

const CategoryContext = createContext();

export function CategoryProvider({ children }) {
  const [categories, setCategories] = useState(DEFAULT_FALLBACK_CATEGORIES);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const refreshCategories = async () => {
    try {
      setCategoriesLoading(true);
      const res = await api.get('/categories');
      const data = res.data;
      if (Array.isArray(data) && data.length > 0) {
        setCategories(data);
      } else if (data && Array.isArray(data.categories) && data.categories.length > 0) {
        setCategories(data.categories);
      } else {
        setCategories(DEFAULT_FALLBACK_CATEGORIES);
      }
    } catch (err) {
      console.warn('Backend categories endpoint fetch warning, using fallback taxonomy:', err?.message || err);
      setCategories(DEFAULT_FALLBACK_CATEGORIES);
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
