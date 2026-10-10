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

// category_products.category_id / product_id are UUID columns: never send a slug like "cookies" there.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (v) => UUID_RE.test(String(v || ''));

/** Find a category by its UUID or by its slug (each against its own column). */
async function findCategory(idOrSlug) {
  const key = String(idOrSlug || '').trim();
  if (!key) return { category: null, error: null };
  const query = supabase.from('categories').select('*');
  const { data, error } = isUuid(key) ? await query.eq('id', key).maybeSingle() : await query.eq('slug', key).maybeSingle();
  return { category: data || null, error };
}

/** Validate a productIds payload: unique UUIDs only. Returns { ids } or { invalid }. */
function parseProductIds(productIds) {
  const ids = [...new Set((productIds || []).filter(Boolean).map((v) => String(v).trim()))];
  const invalid = ids.filter((v) => !isUuid(v));
  return invalid.length ? { invalid } : { ids };
}

/**
 * Point each product's legacy products.category / category_id at a category it still belongs to
 * in the category_products junction table, or clear them when it belongs to none.
 */
async function reassignLegacyCategory(productIds) {
  const { data: rels } = await supabase.from('category_products').select('category_id, product_id').in('product_id', productIds);
  const { data: cats } = await supabase.from('categories').select('id, slug');
  const catById = new Map((cats || []).map((c) => [String(c.id), c]));

  for (const pid of productIds) {
    const remaining = (rels || [])
      .filter((r) => String(r.product_id) === pid)
      .map((r) => catById.get(String(r.category_id)))
      .find(Boolean);

    const update = remaining
      ? { category: remaining.slug, category_id: remaining.id }
      : { category: null, category_id: null };
    let { error } = await supabase.from('products').update(update).eq('id', pid);
    if (error && !remaining) {
      // products.category may be NOT NULL in older schemas — fall back to an empty value
      ({ error } = await supabase.from('products').update({ category: '', category_id: null }).eq('id', pid));
    }
    if (error) console.warn(`Could not clear legacy category for product ${pid}:`, error.message);
  }
}

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

    const parsedProducts = parseProductIds(productIds);
    if (parsedProducts.invalid) {
      return res.status(400).json({ message: `Invalid product id(s): ${parsedProducts.invalid.join(', ')}. Reload the page and select the products again.` });
    }

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
    if (parsedProducts.ids.length > 0) {
      const productIdsToLink = parsedProducts.ids;
      savedProductIds = productIdsToLink;

      const { error: relErr } = await supabase
        .from('category_products')
        .insert(productIdsToLink.map((pId) => ({ category_id: targetCatId, product_id: pId })));
      if (relErr) {
        console.error('category_products insert error:', relErr.message);
        return res.status(500).json({ message: `Category created, but its products could not be saved: ${relErr.message}` });
      }

      const { error: syncErr } = await supabase.from('products').update({ category: targetSlug, category_id: targetCatId }).in('id', productIdsToLink);
      if (syncErr) console.warn('products legacy category sync notice:', syncErr.message);
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
    const { name, description, image, image_url, productIds } = req.body;
    const finalImage = image_url || image;

    // 1. Resolve the real category row (by UUID or slug — never a slug against the UUID column)
    const { category: existing, error: findErr } = await findCategory(id);
    if (findErr) return res.status(500).json({ message: `Could not load category: ${findErr.message}` });
    if (!existing) return res.status(404).json({ message: `Category "${id}" not found. Reload the page and try again.` });
    const targetCatId = existing.id; // UUID — the only value used for category_products

    let parsedProducts = null;
    if (Array.isArray(productIds)) {
      parsedProducts = parseProductIds(productIds);
      if (parsedProducts.invalid) {
        return res.status(400).json({ message: `Invalid product id(s): ${parsedProducts.invalid.join(', ')}. Reload the page and select the products again.` });
      }
    }

    // 2. Category fields
    const updatePayload = {};
    if (name) {
      updatePayload.name = name.trim();
      updatePayload.label = name.trim();
      updatePayload.slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }
    if (description !== undefined) updatePayload.subtitle = description;
    if (finalImage) updatePayload.image_url = finalImage;

    let category = existing;
    if (Object.keys(updatePayload).length > 0) {
      const { data: updatedCat, error: updErr } = await supabase
        .from('categories')
        .update(updatePayload)
        .eq('id', targetCatId)
        .select()
        .maybeSingle();
      if (updErr) return res.status(500).json({ message: `Could not update category: ${updErr.message}` });
      if (updatedCat) category = updatedCat;
    }
    const targetSlug = category.slug;
    const oldSlug = existing.slug && existing.slug !== targetSlug ? existing.slug : null;

    // 3. Category products: apply only the difference (keep unchanged links as they are)
    const { data: currentRels, error: relErr } = await supabase
      .from('category_products')
      .select('product_id')
      .eq('category_id', targetCatId);
    if (relErr) return res.status(500).json({ message: `Could not load category products: ${relErr.message}` });
    const currentIds = (currentRels || []).map((r) => String(r.product_id));

    let savedProductIds = currentIds;
    if (parsedProducts) {
      const newIds = parsedProducts.ids;
      const toAdd = newIds.filter((pid) => !currentIds.includes(pid));
      const toRemove = currentIds.filter((pid) => !newIds.includes(pid));

      if (toRemove.length > 0) {
        const { error: delErr } = await supabase
          .from('category_products')
          .delete()
          .eq('category_id', targetCatId)
          .in('product_id', toRemove);
        if (delErr) return res.status(500).json({ message: `Could not remove products from category: ${delErr.message}` });
      }
      if (toAdd.length > 0) {
        const { error: insErr } = await supabase
          .from('category_products')
          .upsert(toAdd.map((pId) => ({ category_id: targetCatId, product_id: pId })), { onConflict: 'category_id,product_id', ignoreDuplicates: true });
        if (insErr) return res.status(500).json({ message: `Could not add products to category: ${insErr.message}` });
      }

      // Keep the legacy products.category / category_id columns in sync
      if (newIds.length > 0) {
        const { error: syncErr } = await supabase
          .from('products')
          .update({ category: targetSlug, category_id: targetCatId })
          .in('id', newIds);
        if (syncErr) console.warn('products legacy category sync notice:', syncErr.message);
      }

      // Products no longer in this category but whose legacy columns still point here
      const legacyFilter = [`category_id.eq.${targetCatId}`, `category.eq.${targetSlug}`, ...(oldSlug ? [`category.eq.${oldSlug}`] : [])].join(',');
      const { data: pointingHere } = await supabase.from('products').select('id').or(legacyFilter);
      const removedIds = (pointingHere || []).map((p) => String(p.id)).filter((pid) => !newIds.includes(pid));
      if (removedIds.length > 0) await reassignLegacyCategory(removedIds);

      savedProductIds = newIds;
    }

    return res.json({
      ...category,
      id: targetCatId,
      _id: targetCatId,
      description: category.subtitle || '',
      subtitle: category.subtitle || '',
      image_url: category.image_url,
      image: category.image_url,
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

    // Fetch target category details (by UUID or slug)
    const { category: cat } = await findCategory(id);
    if (!cat) return res.status(404).json({ message: 'Category not found.' });
    const catId = cat.id;
    const catSlug = cat.slug || '';
    const catName = cat.name || '';

    // Check if any products are assigned to this category
    let dbProducts = [];
    let catRels = [];

    try {
      const { data: pData } = await supabase.from('products').select('id, category, category_id');
      if (pData) dbProducts = pData;
    } catch (e) {}

    try {
      const { data: rels } = await supabase.from('category_products').select('product_id').eq('category_id', catId);
      if (rels) catRels = rels;
    } catch (e) {}

    const assignedRelIds = new Set((catRels || []).map(r => r.product_id));
    (dbProducts || []).forEach(p => {
      if (p.category_id === catId || p.category === catSlug || p.category === catName || (p.category && p.category.toLowerCase() === catSlug.toLowerCase())) {
        assignedRelIds.add(p.id);
      }
    });

    if (assignedRelIds.size > 0) {
      return res.status(400).json({
        message: `This category contains ${assignedRelIds.size} product(s). Please reassign or delete these products before deleting this category.`
      });
    }

    try {
      await supabase.from('category_products').delete().eq('category_id', catId);
    } catch (e) {}

    const { error } = await supabase.from('categories').delete().eq('id', catId);
    if (error) throw error;

    return res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('deleteCategory error:', error);
    res.status(500).json({ message: 'Error deleting category', error: error.message });
  }
};
