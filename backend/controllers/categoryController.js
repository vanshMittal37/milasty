import { supabase } from '../config/supabase.js';

// Default categories to seed DB if categories table is currently empty
const INITIAL_CATEGORIES = [
  { 
    slug: 'starter', 
    name: 'STARTER FAVOURITES', 
    label: 'Starter Favourites', 
    subtitle: 'Curated tasting boxes & best sellers',
    description: 'Curated tasting boxes & best sellers',
    display_order: 1,
    image_url: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600' 
  },
  { 
    slug: 'daily', 
    name: 'DAILY RITUAL', 
    label: 'Daily Ritual', 
    subtitle: 'Guilt-free everyday tea companions',
    description: 'Guilt-free everyday tea companions',
    display_order: 2,
    image_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600' 
  },
  { 
    slug: 'gifting', 
    name: 'GIFTING HAMPERS', 
    label: 'Gifting Hampers', 
    subtitle: 'Luxury artisanal gift hampers',
    description: 'Luxury artisanal gift hampers',
    display_order: 3,
    image_url: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=600' 
  },
  { 
    slug: 'cookies', 
    name: 'COOKIES', 
    label: 'Cookies', 
    subtitle: 'Pure Desi Ghee millet cookies',
    description: 'Pure Desi Ghee millet cookies',
    display_order: 4,
    image_url: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=600' 
  },
];

export const getCategories = async (req, res) => {
  try {
    let { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .order('created_at', { ascending: true });

    if (error || !categories || categories.length === 0) {
      console.log('Seeding default categories to Supabase...');
      for (const cat of INITIAL_CATEGORIES) {
        await supabase.from('categories').upsert({
          name: cat.name,
          label: cat.label || cat.name,
          slug: cat.slug,
          subtitle: cat.subtitle,
          image_url: cat.image_url,
        }, { onConflict: 'slug' });
      }
      const { data: seeded } = await supabase.from('categories').select('*').order('created_at', { ascending: true });
      categories = seeded || INITIAL_CATEGORIES;
    }

    // Safely query products
    const { data: dbProducts, error: prodError } = await supabase.from('products').select('*');
    if (prodError) {
      console.error('Error fetching products for category count:', prodError);
    }

    // Compute dynamic product counts per category (each product counted once)
    const countsMap = {};
    (categories || []).forEach(cat => {
      const key = cat.id || cat._id || cat.slug;
      if (key) countsMap[key] = 0;
      if (cat.slug) countsMap[cat.slug] = 0;
    });

    (dbProducts || []).forEach((p) => {
      const pCat = (p.category || '').toString().toLowerCase().trim();
      const pCatId = (p.category_id || '').toString().toLowerCase().trim();

      const matchedCat = (categories || []).find(cat => {
        const cId = (cat.id || cat._id || '').toString().toLowerCase().trim();
        const cSlug = (cat.slug || '').toString().toLowerCase().trim();
        const cName = (cat.name || '').toString().toLowerCase().trim();

        if (pCatId && (pCatId === cId || pCatId === cSlug)) return true;
        if (pCat) {
          if (pCat === cId || pCat === cSlug || pCat === cName) return true;
          // Alias matching for gifts vs gifting
          if (pCat === 'gifts' && (cSlug === 'gifting' || cSlug === 'gifts')) return true;
          if (pCat === 'gifting' && (cSlug === 'gifting' || cSlug === 'gifts')) return true;
        }
        return false;
      });

      if (matchedCat) {
        const key = matchedCat.id || matchedCat._id || matchedCat.slug;
        if (key) countsMap[key] = (countsMap[key] || 0) + 1;
        if (matchedCat.slug && matchedCat.slug !== key) countsMap[matchedCat.slug] = (countsMap[matchedCat.slug] || 0) + 1;
      }
    });

    const formatted = categories.map((cat, idx) => {
      const defaultDesc = INITIAL_CATEGORIES.find(c => c.slug === cat.slug)?.description || 'Wholesome artisanal bakes collection';
      const img = cat.image_url || cat.image || INITIAL_CATEGORIES[idx % 4]?.image_url || 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600';
      const key = cat.id || cat._id || cat.slug;
      const catCount = countsMap[key] !== undefined ? countsMap[key] : (countsMap[cat.slug] || 0);

      return {
        _id: cat.id || cat._id || cat.slug,
        id: cat.id || cat._id || cat.slug,
        name: cat.name,
        label: cat.label || cat.name,
        slug: cat.slug,
        description: cat.subtitle || cat.description || defaultDesc,
        subtitle: cat.subtitle || cat.description || defaultDesc,
        image_url: img,
        image: img,
        display_order: cat.display_order !== undefined ? cat.display_order : idx + 1,
        is_active: cat.is_active !== false,
        productCount: catCount,
        created_at: cat.created_at || new Date().toISOString(),
      };
    });

    return res.json(formatted);
  } catch (error) {
    console.error('getCategories error:', error);
    res.status(500).json({ message: 'Error fetching categories', error: error.message });
  }
};

export const createCategory = async (req, res) => {
  try {
    const { name, description, image, image_url, label, subtitle, status } = req.body;
    const finalImage = image_url || image;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    if (!finalImage || !finalImage.trim()) {
      return res.status(400).json({ message: 'Category image is required. Please upload an image.' });
    }

    let slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    if (!slug) slug = `category-${Date.now()}`;

    // Check slug collision
    const { data: existing } = await supabase.from('categories').select('id').eq('slug', slug).maybeSingle();
    if (existing) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    const payload = {
      name: name.trim(),
      label: label || name.trim(),
      slug: slug,
      subtitle: description || subtitle || name.trim(),
      image_url: finalImage,
    };

    let { data: category, error } = await supabase.from('categories').insert([payload]).select().single();

    if (error) {
      console.error('Supabase Category Insert Error:', error);
      return res.status(400).json({ message: error.message || 'Database error creating category' });
    }

    return res.status(201).json({
      ...category,
      _id: category.id,
      description: description || subtitle || '',
      subtitle: subtitle || description || '',
      image: category.image_url,
      image_url: category.image_url,
      productCount: 0,
    });
  } catch (error) {
    console.error('createCategory error:', error);
    res.status(500).json({ message: 'Error creating category', error: error.message });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, image, image_url, status, is_active } = req.body;
    const finalImage = image_url || image;

    const updatePayload = {};

    if (name) {
      updatePayload.name = name.trim();
      updatePayload.label = name.trim();
      updatePayload.slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }

    if (description !== undefined) {
      updatePayload.subtitle = description;
    }

    if (finalImage) {
      updatePayload.image_url = finalImage;
    }

    if (status !== undefined) {
      updatePayload.is_active = status === 'active';
    } else if (is_active !== undefined) {
      updatePayload.is_active = is_active;
    }

    const { data: category, error } = await supabase
      .from('categories')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) {
      return res.status(400).json({ message: error.message || 'Database error updating category' });
    }

    return res.json({
      ...(category || { id, name }),
      description: description || '',
      image_url: finalImage || category?.image_url,
      image: finalImage || category?.image_url,
    });
  } catch (error) {
    console.error('updateCategory error:', error);
    res.status(500).json({ message: 'Error updating category', error: error.message });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch target category details
    const { data: cat } = await supabase.from('categories').select('*').eq('id', id).maybeSingle();
    const catSlug = cat?.slug || id;
    const catName = cat?.name || id;

    // Check if any products are assigned to this category
    const { data: dbProducts } = await supabase.from('products').select('id, category, category_id');
    const assignedProducts = (dbProducts || []).filter(
      p => p.category_id === id || p.category === catSlug || p.category === catName || (p.category && p.category.toLowerCase() === catSlug.toLowerCase())
    );

    if (assignedProducts && assignedProducts.length > 0) {
      return res.status(400).json({
        message: `This category contains ${assignedProducts.length} product(s). Please reassign or delete these products before deleting this category.`
      });
    }

    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) throw error;

    return res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('deleteCategory error:', error);
    res.status(500).json({ message: 'Error deleting category', error: error.message });
  }
};
