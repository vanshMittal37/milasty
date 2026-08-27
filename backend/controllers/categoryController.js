import { supabase } from '../config/supabase.js';

export const getCategories = async (req, res) => {
  try {
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .order('display_order', { ascending: true });

    if (!error && categories && categories.length > 0) {
      return res.json(categories);
    }

    // Fallback static categories
    res.json([
      { id: '1', slug: 'starter', name: 'STARTER BOX', label: 'Starter Box', subtitle: 'Curated luxury ritual box' },
      { id: '2', slug: 'daily', name: 'DAILY BAKES', label: 'Daily Bakes', subtitle: 'Everyday healthy tea break snacks' },
      { id: '3', slug: 'gifting', name: 'GIFTING HAMPER', label: 'Gifting Hamper', subtitle: 'Artisanal gift boxes' },
      { id: '4', slug: 'cookies', name: 'COOKIES', label: 'Cookies', subtitle: 'Pure Desi Ghee millet cookies' },
    ]);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching categories', error: error.message });
  }
};

export const createCategory = async (req, res) => {
  try {
    const { name, description, image, label, subtitle } = req.body;
    const slug = name.toLowerCase().replace(/\s+/g, '-');

    const { data: category, error } = await supabase
      .from('categories')
      .insert([{ name, slug, label: label || name, subtitle: subtitle || description, image_url: image }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: 'Error creating category', error: error.message });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { data: category, error } = await supabase
      .from('categories')
      .update(req.body)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: 'Error updating category', error: error.message });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) throw error;
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting category', error: error.message });
  }
};
