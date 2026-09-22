import { supabase } from '../config/supabase.js';
import { initialProducts } from '../data/seedData.js';

// Default In-Memory Section Config (Fallback)
let memorySectionConfig = {
  is_active: true,
  eyebrow: 'NOT SURE WHERE TO START?',
  title: 'Find Your Perfect MILASTY Snack',
  description: 'Something light. Something crunchy. Something chocolatey. Or something to share.',
  explore_button_text: 'EXPLORE ALL SNACKS →',
  explore_button_url: '/shop',
};

// Default Initial Mood Groups from Prompt Specification
let memoryMoods = [
  {
    id: 'mood_classic',
    name: 'I LOVE CLASSIC',
    description: 'For familiar flavours with a millet twist.',
    display_order: 1,
    is_active: true,
    product_ids: [],
  },
  {
    id: 'mood_chocolate',
    name: 'I CRAVE CHOCOLATE',
    description: 'For those moments when chocolate is non-negotiable.',
    display_order: 2,
    is_active: true,
    product_ids: [],
  },
  {
    id: 'mood_crunchy',
    name: 'I WANT SOMETHING CRUNCHY',
    description: 'For chai-time, desk-time and anytime snacking.',
    display_order: 3,
    is_active: true,
    product_ids: [],
  },
  {
    id: 'mood_family',
    name: "I'M SHOPPING FOR THE FAMILY",
    description: 'A little something for everyone at home.',
    display_order: 4,
    is_active: true,
    product_ids: [],
  },
  {
    id: 'mood_gifting',
    name: "I'M SHOPPING FOR SOMEONE SPECIAL",
    description: 'Thoughtful millet-based gifting for every occasion.',
    display_order: 5,
    is_active: true,
    product_ids: [],
  },
];

/**
 * Robust price extraction helper
 */
function extractProductPrice(p) {
  if (!p) return 0;

  // Direct price check
  if (p.price !== undefined && p.price !== null && Number(p.price) > 0) {
    return Number(p.price);
  }

  // Supabase product_variants array check
  if (Array.isArray(p.product_variants) && p.product_variants.length > 0) {
    const firstVar = p.product_variants[0];
    if (firstVar) {
      const vPrice = firstVar.price || firstVar.original_price || firstVar.sale_price;
      if (vPrice && Number(vPrice) > 0) return Number(vPrice);
    }
  }

  // JSON variants array check
  let vars = p.variants;
  if (typeof vars === 'string') {
    try { vars = JSON.parse(vars); } catch (e) { vars = []; }
  }
  if (Array.isArray(vars) && vars.length > 0) {
    const firstVar = vars[0];
    if (firstVar) {
      const vPrice = firstVar.price || firstVar.originalPrice || firstVar.sale_price;
      if (vPrice && Number(vPrice) > 0) return Number(vPrice);
    }
  }

  // Other common price key fallbacks
  if (p.sale_price && Number(p.sale_price) > 0) return Number(p.sale_price);
  if (p.regular_price && Number(p.regular_price) > 0) return Number(p.regular_price);
  if (p.price_rupees && Number(p.price_rupees) > 0) return Number(p.price_rupees);
  if (p.originalPrice && Number(p.originalPrice) > 0) return Number(p.originalPrice);

  return 0;
}

/**
 * Helper to fetch all available products from DB or Seed Data
 */
async function fetchAllProducts() {
  try {
    const { data: dbProds, error } = await supabase.from('products').select('*, product_variants(*)');
    if (!error && dbProds && dbProds.length > 0) {
      return dbProds.map(p => {
        const primaryImg = p.image_url || p.image || p.secondary_image_url || '';
        return {
          ...p,
          image: primaryImg,
          resolvedPrice: extractProductPrice(p),
        };
      });
    }
  } catch (e) {
    console.warn('Supabase products fetch notice:', e.message);
  }

  return (initialProducts || []).map(p => {
    let img = p.image || p.imageUrl || p.image_url || '';
    return {
      ...p,
      image: img,
      resolvedPrice: extractProductPrice(p),
    };
  });
}

/**
 * Helper to match default initial products to memory moods if empty, ensuring no duplicates
 */
function assignInitialProductIds(products) {
  memoryMoods.forEach((m) => {
    if (!m.product_ids || m.product_ids.length === 0) {
      const tag = m.id.replace('mood_', '');
      const matched = products.filter((p) => {
        const title = (p.title || p.name || '').toLowerCase();
        const cat = (p.category || '').toLowerCase();
        if (tag === 'classic') return title.includes('cardamom') || title.includes('bajra') || title.includes('jowar') || cat === 'daily';
        if (tag === 'chocolate') return title.includes('choco') || title.includes('ragi') || title.includes('brownie') || title.includes('cocoa');
        if (tag === 'crunchy') return title.includes('cracker') || title.includes('crunch') || title.includes('masala');
        if (tag === 'family') return title.includes('trio') || title.includes('box') || cat === 'starter' || p.is_featured || p.isFeatured;
        if (tag === 'gifting') return title.includes('ritual') || title.includes('wedding') || title.includes('celebration') || title.includes('hamper') || cat === 'gifts';
        return false;
      });

      // Deduplicate IDs
      const rawIds = matched.map((p) => String(p.id || p._id || p.slug));
      m.product_ids = Array.from(new Set(rawIds));
    } else {
      // Ensure existing product_ids are deduplicated
      m.product_ids = Array.from(new Set((m.product_ids || []).map(id => String(id))));
    }
  });
}

/**
 * GET /api/product-discovery (Public)
 */
export const getPublicProductDiscovery = async (req, res) => {
  try {
    let sectionConfig = { ...memorySectionConfig };
    let moods = [];
    let moodProductsMap = {};

    try {
      const { data: sData } = await supabase
        .from('product_discovery_sections')
        .select('*')
        .limit(1)
        .single();
      if (sData) {
        sectionConfig = {
          is_active: sData.is_active !== false,
          eyebrow: sData.eyebrow || memorySectionConfig.eyebrow,
          title: sData.title || memorySectionConfig.title,
          description: sData.description || memorySectionConfig.description,
          explore_button_text: sData.explore_button_text || memorySectionConfig.explore_button_text,
          explore_button_url: sData.explore_button_url || memorySectionConfig.explore_button_url,
        };
      }

      const { data: mData } = await supabase
        .from('product_discovery_moods')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (mData && mData.length > 0) {
        moods = mData;
      }

      const { data: mpData } = await supabase
        .from('product_discovery_mood_products')
        .select('*')
        .order('display_order', { ascending: true });

      if (mpData) {
        mpData.forEach((row) => {
          if (!moodProductsMap[row.mood_id]) moodProductsMap[row.mood_id] = [];
          if (!moodProductsMap[row.mood_id].includes(String(row.product_id))) {
            moodProductsMap[row.mood_id].push(String(row.product_id));
          }
        });
      }
    } catch (e) {
      console.warn('Supabase product discovery fetch notice:', e.message);
    }

    const allProducts = await fetchAllProducts();
    assignInitialProductIds(allProducts);

    if (moods.length === 0) {
      moods = memoryMoods.filter((m) => m.is_active !== false);
    }

    const formattedMoods = moods.map((m) => {
      const rawIds = moodProductsMap[m.id] || m.product_ids || [];
      const uniqueIds = Array.from(new Set(rawIds.map(id => String(id))));
      
      const assignedProducts = uniqueIds
        .map((pid) => allProducts.find((p) => String(p.id || p._id || p.slug) === String(pid)))
        .filter((p) => Boolean(p) && p.is_active !== false && p.active !== false);

      return {
        id: m.id,
        name: m.name,
        description: m.description || '',
        display_order: m.display_order || 1,
        is_active: m.is_active !== false,
        products: assignedProducts,
      };
    });

    return res.json({
      success: true,
      section: sectionConfig,
      moods: formattedMoods,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error fetching product discovery data', error: err.message });
  }
};

/**
 * GET /api/product-discovery/admin (Admin)
 */
export const getAdminProductDiscovery = async (req, res) => {
  try {
    let sectionConfig = { ...memorySectionConfig };
    let moods = [];
    let moodProductsMap = {};

    try {
      const { data: sData } = await supabase
        .from('product_discovery_sections')
        .select('*')
        .limit(1)
        .single();

      if (sData) {
        sectionConfig = {
          is_active: sData.is_active !== false,
          eyebrow: sData.eyebrow || memorySectionConfig.eyebrow,
          title: sData.title || memorySectionConfig.title,
          description: sData.description || memorySectionConfig.description,
          explore_button_text: sData.explore_button_text || memorySectionConfig.explore_button_text,
          explore_button_url: sData.explore_button_url || memorySectionConfig.explore_button_url,
        };
      }

      const { data: mData } = await supabase
        .from('product_discovery_moods')
        .select('*')
        .order('display_order', { ascending: true });

      if (mData && mData.length > 0) moods = mData;

      const { data: mpData } = await supabase
        .from('product_discovery_mood_products')
        .select('*')
        .order('display_order', { ascending: true });

      if (mpData) {
        mpData.forEach((row) => {
          if (!moodProductsMap[row.mood_id]) moodProductsMap[row.mood_id] = [];
          if (!moodProductsMap[row.mood_id].includes(String(row.product_id))) {
            moodProductsMap[row.mood_id].push(String(row.product_id));
          }
        });
      }
    } catch (e) {
      console.warn('Supabase getAdminProductDiscovery notice:', e.message);
    }

    const allProducts = await fetchAllProducts();
    assignInitialProductIds(allProducts);

    if (moods.length === 0) moods = memoryMoods;

    const formattedMoods = moods.map((m) => {
      const rawIds = moodProductsMap[m.id] || m.product_ids || [];
      const uniqueIds = Array.from(new Set(rawIds.map(id => String(id))));
      return {
        id: m.id,
        name: m.name,
        description: m.description || '',
        display_order: m.display_order || 1,
        is_active: m.is_active !== false,
        product_ids: uniqueIds,
      };
    });

    return res.json({
      success: true,
      section: sectionConfig,
      moods: formattedMoods,
      availableProducts: allProducts.map((p) => ({
        id: String(p.id || p._id || p.slug),
        name: p.title || p.name || 'Untitled Product',
        category: p.category || '',
        price: extractProductPrice(p),
        image: p.image || p.imageUrl || p.image_url || '',
        is_active: p.is_active !== false && p.active !== false,
      })),
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error fetching admin product discovery data', error: err.message });
  }
};

/**
 * PUT /api/product-discovery/admin/section (Admin)
 */
export const updateSectionConfig = async (req, res) => {
  try {
    const { is_active, eyebrow, title, description, explore_button_text, explore_button_url } = req.body;

    const payload = {
      is_active: is_active !== undefined ? Boolean(is_active) : memorySectionConfig.is_active,
      eyebrow: eyebrow !== undefined ? String(eyebrow).trim() : memorySectionConfig.eyebrow,
      title: title !== undefined ? String(title).trim() : memorySectionConfig.title,
      description: description !== undefined ? String(description).trim() : memorySectionConfig.description,
      explore_button_text: explore_button_text !== undefined ? String(explore_button_text).trim() : memorySectionConfig.explore_button_text,
      explore_button_url: explore_button_url !== undefined ? String(explore_button_url).trim() : memorySectionConfig.explore_button_url,
      updated_at: new Date().toISOString(),
    };

    try {
      const { data: existing } = await supabase.from('product_discovery_sections').select('id').limit(1);
      if (existing && existing.length > 0) {
        await supabase.from('product_discovery_sections').update(payload).eq('id', existing[0].id);
      } else {
        await supabase.from('product_discovery_sections').insert([{ id: 'section_main', ...payload }]);
      }
    } catch (e) {
      console.warn('Supabase updateSectionConfig notice:', e.message);
    }

    memorySectionConfig = { ...memorySectionConfig, ...payload };

    return res.json({
      success: true,
      message: 'Product Discovery section updated successfully.',
      section: memorySectionConfig,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error updating section configuration', error: err.message });
  }
};

/**
 * POST /api/product-discovery/admin/moods (Admin)
 */
export const createMood = async (req, res) => {
  try {
    const { name, description = '', display_order, is_active = true, product_ids = [] } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Mood collection name is required' });
    }

    const uniqueProductIds = Array.from(new Set((product_ids || []).map(id => String(id))));
    const newId = `mood_${Date.now()}`;
    const payload = {
      id: newId,
      name: name.trim(),
      description: description.trim(),
      display_order: Number(display_order || memoryMoods.length + 1),
      is_active: Boolean(is_active),
      created_at: new Date().toISOString(),
    };

    try {
      await supabase.from('product_discovery_moods').insert([payload]);

      if (uniqueProductIds.length > 0) {
        const rows = uniqueProductIds.map((pid, idx) => ({
          mood_id: newId,
          product_id: String(pid),
          display_order: idx + 1,
        }));
        await supabase.from('product_discovery_mood_products').insert(rows);
      }
    } catch (e) {
      console.warn('Supabase createMood notice:', e.message);
    }

    const newMood = {
      id: newId,
      name: payload.name,
      description: payload.description,
      display_order: payload.display_order,
      is_active: payload.is_active,
      product_ids: uniqueProductIds,
    };
    memoryMoods.push(newMood);

    return res.json({ success: true, message: 'Mood collection created successfully.', mood: newMood });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error creating mood collection', error: err.message });
  }
};

/**
 * PUT /api/product-discovery/admin/moods/:id (Admin)
 */
export const updateMood = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, display_order, is_active, product_ids } = req.body;

    const payload = {};
    if (name !== undefined) payload.name = String(name).trim();
    if (description !== undefined) payload.description = String(description).trim();
    if (display_order !== undefined) payload.display_order = Number(display_order);
    if (is_active !== undefined) payload.is_active = Boolean(is_active);
    payload.updated_at = new Date().toISOString();

    const uniqueProductIds = Array.isArray(product_ids)
      ? Array.from(new Set(product_ids.map(pid => String(pid))))
      : undefined;

    try {
      await supabase.from('product_discovery_moods').update(payload).eq('id', id);

      if (uniqueProductIds !== undefined) {
        await supabase.from('product_discovery_mood_products').delete().eq('mood_id', id);
        if (uniqueProductIds.length > 0) {
          const rows = uniqueProductIds.map((pid, idx) => ({
            mood_id: id,
            product_id: String(pid),
            display_order: idx + 1,
          }));
          await supabase.from('product_discovery_mood_products').insert(rows);
        }
      }
    } catch (e) {
      console.warn('Supabase updateMood notice:', e.message);
    }

    const idx = memoryMoods.findIndex((m) => String(m.id) === String(id));
    if (idx >= 0) {
      memoryMoods[idx] = {
        ...memoryMoods[idx],
        ...(name !== undefined ? { name: String(name).trim() } : {}),
        ...(description !== undefined ? { description: String(description).trim() } : {}),
        ...(display_order !== undefined ? { display_order: Number(display_order) } : {}),
        ...(is_active !== undefined ? { is_active: Boolean(is_active) } : {}),
        ...(uniqueProductIds !== undefined ? { product_ids: uniqueProductIds } : {}),
      };
    }

    return res.json({ success: true, message: 'Mood collection updated successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error updating mood collection', error: err.message });
  }
};

/**
 * DELETE /api/product-discovery/admin/moods/:id (Admin)
 */
export const deleteMood = async (req, res) => {
  try {
    const { id } = req.params;
    try {
      await supabase.from('product_discovery_mood_products').delete().eq('mood_id', id);
      await supabase.from('product_discovery_moods').delete().eq('id', id);
    } catch (e) {
      console.warn('Supabase deleteMood notice:', e.message);
    }

    memoryMoods = memoryMoods.filter((m) => String(m.id) !== String(id));
    return res.json({ success: true, message: 'Mood collection deleted successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error deleting mood collection', error: err.message });
  }
};

/**
 * POST /api/product-discovery/admin/moods/reorder (Admin)
 */
export const reorderMoods = async (req, res) => {
  try {
    const { orderedIds } = req.body;
    if (!Array.isArray(orderedIds)) {
      return res.status(400).json({ success: false, message: 'orderedIds array is required' });
    }

    for (let i = 0; i < orderedIds.length; i++) {
      const id = orderedIds[i];
      const order = i + 1;

      try {
        await supabase.from('product_discovery_moods').update({ display_order: order }).eq('id', id);
      } catch (e) { }

      const idx = memoryMoods.findIndex((m) => String(m.id) === String(id));
      if (idx >= 0) memoryMoods[idx].display_order = order;
    }

    memoryMoods.sort((a, b) => a.display_order - b.display_order);

    return res.json({ success: true, message: 'Mood collections reordered successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error reordering mood collections', error: err.message });
  }
};
