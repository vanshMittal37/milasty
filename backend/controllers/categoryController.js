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
    let categories = [];
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('created_at', { ascending: true });
      if (!error && data) categories = data;
    } catch (e) {
      console.warn('Error fetching categories from DB:', e.message);
    }

    if (!categories || categories.length === 0) {
      console.log('Seeding default categories to Supabase...');
      for (const cat of INITIAL_CATEGORIES) {
        try {
          await supabase.from('categories').upsert({
            name: cat.name,
            label: cat.label || cat.name,
            slug: cat.slug,
            subtitle: cat.subtitle,
            image_url: cat.image_url,
          }, { onConflict: 'slug' });
        } catch (e) {}
      }
      try {
        const { data: seeded } = await supabase.from('categories').select('*').order('created_at', { ascending: true });
        categories = seeded || INITIAL_CATEGORIES;
      } catch (e) {
        categories = INITIAL_CATEGORIES;
      }
    }

    // Safely query products and category_products
    let dbProducts = [];
    let catProductsRels = [];

    try {
      const { data: pData } = await supabase.from('products').select('id, category, category_id');
      if (pData) dbProducts = pData;
    } catch (e) {
      console.warn('Warning querying products in getCategories:', e.message);
      // Try without category_id if schema cache missing
      try {
        const { data: pData2 } = await supabase.from('products').select('id, category');
        if (pData2) dbProducts = pData2;
      } catch (e2) {}
    }

    try {
      const { data: cpData, error: cpErr } = await supabase.from('category_products').select('category_id, product_id');
      if (!cpErr && cpData) catProductsRels = cpData;
    } catch (e) {
      console.warn('Warning querying category_products table:', e.message);
    }

    // Map product IDs and dynamic counts per category
    const catProductIdsMap = {};
    (categories || []).forEach(cat => {
      const cId = cat.id || cat._id;
      const cSlug = cat.slug;
      if (cId) catProductIdsMap[cId] = new Set();
      if (cSlug) catProductIdsMap[cSlug] = new Set();
    });

    // 1. Fill from category_products junction table (source of truth)
    (catProductsRels || []).forEach(rel => {
      const cId = rel.category_id;
      const pId = rel.product_id;
      if (cId && pId) {
        if (!catProductIdsMap[cId]) catProductIdsMap[cId] = new Set();
        catProductIdsMap[cId].add(pId);
      }
    });

    // 2. Fill from products.category_id (direct FK) and products.category (legacy slug)
    (dbProducts || []).forEach((p) => {
      const pCat = (p.category || '').toString().toLowerCase().trim();
      const pCatId = (p.category_id || '').toString().toLowerCase().trim();

      (categories || []).forEach(cat => {
        const cId = (cat.id || cat._id || '').toString().toLowerCase().trim();
        const cSlug = (cat.slug || '').toString().toLowerCase().trim();
        const cName = (cat.name || '').toString().toLowerCase().trim();

        let isMatch = false;
        if (pCatId && (pCatId === cId || pCatId === cSlug)) isMatch = true;
        if (pCat && (pCat === cId || pCat === cSlug || pCat === cName)) isMatch = true;
        if (pCat === 'gifts' && (cSlug === 'gifting' || cSlug === 'gifts')) isMatch = true;
        if (pCat === 'gifting' && (cSlug === 'gifting' || cSlug === 'gifts')) isMatch = true;

        if (isMatch) {
          const realCId = cat.id || cat._id;
          if (realCId) {
            if (!catProductIdsMap[realCId]) catProductIdsMap[realCId] = new Set();
            catProductIdsMap[realCId].add(p.id);
          }
          if (cSlug) {
            if (!catProductIdsMap[cSlug]) catProductIdsMap[cSlug] = new Set();
            catProductIdsMap[cSlug].add(p.id);
          }
        }
      });
    });

    const formatted = categories.map((cat, idx) => {
      const defaultDesc = INITIAL_CATEGORIES.find(c => c.slug === cat.slug)?.description || 'Wholesome artisanal bakes collection';
      const img = cat.image_url || cat.image || INITIAL_CATEGORIES[idx % 4]?.image_url || 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600';
      const key = cat.id || cat._id || cat.slug;
      
      const pSet = new Set([
        ...(catProductIdsMap[cat.id] || []),
        ...(catProductIdsMap[cat.slug] || []),
        ...(catProductIdsMap[key] || [])
      ]);
      const productIds = Array.from(pSet);

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
        productCount: productIds.length,
        productIds: productIds,
        created_at: cat.created_at || new Date().toISOString(),
      };
    });

    return res.json(formatted);
  } catch (error) {
    console.error('getCategories error:', error);
    return res.json(INITIAL_CATEGORIES.map((cat, idx) => ({
      _id: cat.slug,
      id: cat.slug,
      name: cat.name,
      label: cat.label,
      slug: cat.slug,
      description: cat.description,
      subtitle: cat.subtitle,
      image_url: cat.image_url,
      image: cat.image_url,
      display_order: idx + 1,
      is_active: true,
      productCount: 0,
      productIds: [],
      created_at: new Date().toISOString()
    })));
  }
};

export const createCategory = async (req, res) => {
  try {
    const { name, description, image, image_url, label, subtitle, status, productIds } = req.body;
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

    const targetCatId = category.id;
    const targetSlug = category.slug || slug;

    // Save Category Products Relationship
    let savedProductIds = [];
    if (Array.isArray(productIds) && productIds.length > 0) {
      savedProductIds = productIds;

      const relRows = [];
      productIds.forEach(pId => {
        relRows.push({ category_id: targetCatId, product_id: pId });
        if (targetSlug && targetSlug !== targetCatId) {
          relRows.push({ category_id: targetSlug, product_id: pId });
        }
      });

      try {
        await supabase.from('category_products').insert(relRows);
      } catch (err) {
        console.warn('category_products insert warning:', err?.message);
      }

      try {
        await supabase.from('products').update({ category: targetSlug, category_id: targetCatId }).in('id', productIds);
      } catch (err) {}
    }

    return res.status(201).json({
      ...category,
      _id: category.id,
      description: description || subtitle || '',
      subtitle: subtitle || description || '',
      image: category.image_url,
      image_url: category.image_url,
      productCount: savedProductIds.length,
      productIds: savedProductIds,
    });
  } catch (error) {
    console.error('createCategory error:', error);
    res.status(500).json({ message: 'Error creating category', error: error.message });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, image, image_url, status, is_active, productIds } = req.body;
    const finalImage = image_url || image;

    // 1. Find target category in database by id or slug
    let { data: category } = await supabase
      .from('categories')
      .select('*')
      .or(`id.eq.${id},slug.eq.${id}`)
      .maybeSingle();

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

    if (Object.keys(updatePayload).length > 0) {
      const { data: updatedCat } = await supabase
        .from('categories')
        .update(updatePayload)
        .or(`id.eq.${id},slug.eq.${id}`)
        .select()
        .maybeSingle();
      if (updatedCat) category = updatedCat;
    }

    const targetCatId = category?.id || id;
    const targetSlug = category?.slug || updatePayload.slug || id;

    // 2. Synchronize Category Products Relationship
    let savedProductIds = [];
    if (Array.isArray(productIds)) {
      savedProductIds = productIds;

      // Delete existing relationships for both targetCatId and targetSlug
      try {
        await supabase.from('category_products').delete().eq('category_id', targetCatId);
      } catch (e) {}
      if (targetSlug && targetSlug !== targetCatId) {
        try {
          await supabase.from('category_products').delete().eq('category_id', targetSlug);
        } catch (e) {}
      }

      if (productIds.length > 0) {
        // Insert relationship entries for targetCatId and targetSlug (if different)
        const relRows = [];
        productIds.forEach(pId => {
          relRows.push({ category_id: targetCatId, product_id: pId });
          if (targetSlug && targetSlug !== targetCatId) {
            relRows.push({ category_id: targetSlug, product_id: pId });
          }
        });

        try {
          await supabase.from('category_products').insert(relRows);
        } catch (err) {
          console.warn('category_products insert notice:', err?.message);
        }

        // Also update products table category & category_id columns for legacy compatibility
        try {
          await supabase.from('products').update({
            category: targetSlug,
            category_id: targetCatId
          }).in('id', productIds);
        } catch (e) {
          console.warn('products table legacy sync notice:', e?.message);
        }
      }
    } else {
      try {
        const { data: rels } = await supabase.from('category_products').select('product_id').or(`category_id.eq.${targetCatId},category_id.eq.${targetSlug}`);
        savedProductIds = Array.from(new Set((rels || []).map(r => r.product_id)));
      } catch (e) {}
    }

    return res.json({
      ...(category || { id, name }),
      id: targetCatId,
      _id: targetCatId,
      name: updatePayload.name || category?.name || name,
      description: description || category?.subtitle || '',
      subtitle: updatePayload.subtitle || category?.subtitle || description || '',
      image_url: finalImage || category?.image_url,
      image: finalImage || category?.image_url,
      productCount: savedProductIds.length,
      productIds: savedProductIds,
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
    let dbProducts = [];
    let catRels = [];

    try {
      const { data: pData } = await supabase.from('products').select('id, category, category_id');
      if (pData) dbProducts = pData;
    } catch (e) {}

    try {
      const { data: rels } = await supabase.from('category_products').select('product_id').eq('category_id', id);
      if (rels) catRels = rels;
    } catch (e) {}

    const assignedRelIds = new Set((catRels || []).map(r => r.product_id));
    (dbProducts || []).forEach(p => {
      if (p.category_id === id || p.category === catSlug || p.category === catName || (p.category && p.category.toLowerCase() === catSlug.toLowerCase())) {
        assignedRelIds.add(p.id);
      }
    });

    if (assignedRelIds.size > 0) {
      return res.status(400).json({
        message: `This category contains ${assignedRelIds.size} product(s). Please reassign or delete these products before deleting this category.`
      });
    }

    try {
      await supabase.from('category_products').delete().eq('category_id', id);
    } catch (e) {}

    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) throw error;

    return res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('deleteCategory error:', error);
    res.status(500).json({ message: 'Error deleting category', error: error.message });
  }
};
