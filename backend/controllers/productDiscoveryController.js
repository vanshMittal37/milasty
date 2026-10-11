import { supabase } from '../config/supabase.js';
import { initialProducts } from '../data/seedData.js';

// Display defaults, used only if the section row is missing (never used as storage)
const DEFAULT_SECTION = {
  is_active: true,
  eyebrow: 'NOT SURE WHERE TO START?',
  title: 'Find Your Perfect MILASTY Snack',
  description: 'Something light. Something crunchy. Something chocolatey. Or something to share.',
  explore_button_text: 'EXPLORE ALL SNACKS →',
  explore_button_url: '/shop',
};

/**
 * Robust price extraction helper
 */
function extractProductPrice(p) {
  if (!p) return 0;

  // 1. Check resolvedPrice if already set
  if (p.resolvedPrice && Number(p.resolvedPrice) > 0) {
    return Number(p.resolvedPrice);
  }

  // 2. Direct top-level numeric checks
  const topKeys = ['price', 'original_price', 'sale_price', 'regular_price', 'originalPrice', 'base_price', 'mrp', 'price_rupees'];
  for (const k of topKeys) {
    if (p[k] !== undefined && p[k] !== null && Number(p[k]) > 0) {
      return Number(p[k]);
    }
  }

  // 3. Supabase product_variants array check
  if (Array.isArray(p.product_variants) && p.product_variants.length > 0) {
    for (const v of p.product_variants) {
      if (v) {
        const vPrice = v.price || v.original_price || v.sale_price || v.originalPrice;
        if (vPrice && Number(vPrice) > 0) return Number(vPrice);
      }
    }
  }

  // 4. JSON / array variants check
  let vars = p.variants;
  if (typeof vars === 'string') {
    try { vars = JSON.parse(vars); } catch (e) { vars = []; }
  }
  if (Array.isArray(vars) && vars.length > 0) {
    for (const v of vars) {
      if (v) {
        const vPrice = v.price || v.originalPrice || v.sale_price || v.original_price;
        if (vPrice && Number(vPrice) > 0) return Number(vPrice);
      }
    }
  }

  // 5. Check inside nutrition_facts or metadata if present
  if (p.nutrition_facts && typeof p.nutrition_facts === 'object') {
    if (p.nutrition_facts.price && Number(p.nutrition_facts.price) > 0) {
      return Number(p.nutrition_facts.price);
    }
  }

  // 6. Fallback: match initialProducts by slug or title
  const pSlug = (p.slug || '').toLowerCase().trim();
  const pTitle = (p.title || p.name || '').toLowerCase().trim();
  
  if (initialProducts && Array.isArray(initialProducts)) {
    const matched = initialProducts.find(ip => {
      const ipSlug = (ip.slug || '').toLowerCase().trim();
      const ipTitle = (ip.title || ip.name || '').toLowerCase().trim();
      return (pSlug && ipSlug && pSlug === ipSlug) || (pTitle && ipTitle && pTitle === ipTitle);
    });

    if (matched) {
      if (Array.isArray(matched.variants) && matched.variants.length > 0) {
        const firstV = matched.variants[0];
        if (firstV && firstV.price && Number(firstV.price) > 0) {
          return Number(firstV.price);
        }
      }
      if (matched.price && Number(matched.price) > 0) {
        return Number(matched.price);
      }
    }
  }

  return 0;
}

/**
 * Helper to fetch all available products from DB or Seed Data
 */
async function fetchAllProducts() {
  let dbProds = [];
  try {
    const { data: prods, error } = await supabase.from('products').select('*, product_variants(*)');
    if (!error && prods && prods.length > 0) {
      dbProds = prods;
    }
  } catch (e) {
    console.warn('Supabase products fetch notice:', e.message);
  }

  // Also query product_variants directly to cover any unjoined variants
  try {
    const { data: allVariants } = await supabase.from('product_variants').select('*');
    if (allVariants && allVariants.length > 0) {
      const variantsByPid = {};
      allVariants.forEach(v => {
        const pid = String(v.product_id);
        if (!variantsByPid[pid]) variantsByPid[pid] = [];
        variantsByPid[pid].push(v);
      });

      dbProds = dbProds.map(p => {
        const pid = String(p.id);
        const existingVars = p.product_variants || [];
        if (existingVars.length === 0 && variantsByPid[pid]) {
          return { ...p, product_variants: variantsByPid[pid] };
        }
        return p;
      });
    }
  } catch (e) {}

  if (dbProds.length > 0) {
    return dbProds.map(p => {
      const primaryImg = p.image_url || p.image || p.secondary_image_url || '';
      const priceVal = extractProductPrice(p);

      let normalizedVariants = [];
      if (Array.isArray(p.product_variants) && p.product_variants.length > 0) {
        normalizedVariants = p.product_variants.map(v => ({
          id: v.id,
          name: v.name || 'Standard Pack',
          weight: v.weight || '',
          price: Number(v.price || v.original_price || priceVal),
          originalPrice: Number(v.original_price || v.price || priceVal),
          inStock: v.in_stock !== false,
        }));
      } else if (Array.isArray(p.variants) && p.variants.length > 0) {
        normalizedVariants = p.variants.map(v => ({
          ...v,
          price: Number(v.price || v.originalPrice || priceVal),
        }));
      } else {
        normalizedVariants = [{ name: 'Standard Pack', price: priceVal, originalPrice: priceVal, inStock: true }];
      }

      return {
        ...p,
        title: p.title || p.name || 'Untitled Product',
        name: p.title || p.name || 'Untitled Product',
        image: primaryImg,
        image_url: primaryImg,
        price: priceVal,
        resolvedPrice: priceVal,
        variants: normalizedVariants,
      };
    });
  }

  return (initialProducts || []).map(p => {
    let img = p.image || p.imageUrl || p.image_url || '';
    const priceVal = extractProductPrice(p);

    let normalizedVariants = Array.isArray(p.variants) && p.variants.length > 0
      ? p.variants.map(v => ({ ...v, price: Number(v.price || priceVal) }))
      : [{ name: 'Standard Pack', price: priceVal, originalPrice: priceVal, inStock: true }];

    return {
      ...p,
      title: p.title || p.name || 'Untitled Product',
      name: p.title || p.name || 'Untitled Product',
      image: img,
      image_url: img,
      price: priceVal,
      resolvedPrice: priceVal,
      variants: normalizedVariants,
    };
  });
}

/*
 * Product Discovery ("Find Your Perfect MILASTY Snack") lives ONLY in Supabase:
 * product_discovery_sections / product_discovery_moods / product_discovery_mood_products
 * (scripts/22_prebooking_quiz_discovery_tables.sql creates them and seeds the defaults once).
 * Previously these tables did not exist, so everything ran from server memory and every admin change
 * was lost on restart/deploy.
 */
const dbError = (res, action, error) => {
  console.error(`[DISCOVERY] ${action} failed:`, error?.message || error);
  return res.status(500).json({
    success: false,
    message: `Could not ${action}: ${error?.message || 'database error'}. If a table is missing, run scripts/22_prebooking_quiz_discovery_tables.sql in Supabase.`,
  });
};

const sectionFromRow = (row) => ({
  is_active: row ? row.is_active !== false : DEFAULT_SECTION.is_active,
  eyebrow: row?.eyebrow || DEFAULT_SECTION.eyebrow,
  title: row?.title || DEFAULT_SECTION.title,
  description: row?.description || DEFAULT_SECTION.description,
  explore_button_text: row?.explore_button_text || DEFAULT_SECTION.explore_button_text,
  explore_button_url: row?.explore_button_url || DEFAULT_SECTION.explore_button_url,
});

const loadDiscovery = async ({ activeOnly }) => {
  let moodsQuery = supabase.from('product_discovery_moods').select('*').order('display_order', { ascending: true });
  if (activeOnly) moodsQuery = moodsQuery.eq('is_active', true);
  const [s, m, mp] = await Promise.all([
    supabase.from('product_discovery_sections').select('*').limit(1),
    moodsQuery,
    supabase.from('product_discovery_mood_products').select('*').order('display_order', { ascending: true }),
  ]);
  const error = s.error || m.error || mp.error;
  const moodProductsMap = {};
  (mp.data || []).forEach((row) => {
    const list = (moodProductsMap[row.mood_id] = moodProductsMap[row.mood_id] || []);
    if (!list.includes(String(row.product_id))) list.push(String(row.product_id));
  });
  return { error, section: sectionFromRow(s.data?.[0]), moods: m.data || [], moodProductsMap };
};

/** Replace a mood's products, touching only links that changed; order follows the given list. */
const syncMoodProducts = async (moodId, productIds) => {
  const wanted = [...new Set((productIds || []).filter(Boolean).map(String))];
  const { data: current, error: curErr } = await supabase.from('product_discovery_mood_products').select('product_id').eq('mood_id', moodId);
  if (curErr) return curErr;
  const toRemove = (current || []).map((r) => String(r.product_id)).filter((pid) => !wanted.includes(pid));
  if (toRemove.length) {
    const { error } = await supabase.from('product_discovery_mood_products').delete().eq('mood_id', moodId).in('product_id', toRemove);
    if (error) return error;
  }
  if (wanted.length) {
    const rows = wanted.map((pid, idx) => ({ mood_id: moodId, product_id: pid, display_order: idx + 1 }));
    const { error } = await supabase.from('product_discovery_mood_products').upsert(rows, { onConflict: 'mood_id,product_id' });
    if (error) return error;
  }
  return null;
};

/**
 * GET /api/product-discovery (Public)
 */
export const getPublicProductDiscovery = async (req, res) => {
  try {
    const { error, section, moods, moodProductsMap } = await loadDiscovery({ activeOnly: true });
    if (error) {
      console.warn('[DISCOVERY] public fetch notice:', error.message);
      return res.json({ success: true, section: { ...DEFAULT_SECTION, is_active: false }, moods: [] });
    }
    const allProducts = await fetchAllProducts();

    const formattedMoods = moods.map((m) => ({
      id: m.id,
      name: m.name,
      description: m.description || '',
      display_order: m.display_order || 1,
      is_active: m.is_active !== false,
      products: (moodProductsMap[m.id] || [])
        .map((pid) => allProducts.find((p) => String(p.id || p._id || p.slug) === String(pid)))
        .filter((p) => Boolean(p) && p.is_active !== false && p.active !== false),
    }));

    return res.json({ success: true, section, moods: formattedMoods });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error fetching product discovery data', error: err.message });
  }
};

/**
 * GET /api/product-discovery/admin (Admin)
 */
export const getAdminProductDiscovery = async (req, res) => {
  try {
    const { error, section, moods, moodProductsMap } = await loadDiscovery({ activeOnly: false });
    if (error) return dbError(res, 'load the discovery section', error);
    const allProducts = await fetchAllProducts();

    return res.json({
      success: true,
      section,
      moods: moods.map((m) => ({
        id: m.id,
        name: m.name,
        description: m.description || '',
        display_order: m.display_order || 1,
        is_active: m.is_active !== false,
        product_ids: moodProductsMap[m.id] || [],
      })),
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
    const payload = { id: 'section_main', updated_at: new Date().toISOString() };
    if (is_active !== undefined) payload.is_active = Boolean(is_active);
    if (eyebrow !== undefined) payload.eyebrow = String(eyebrow).trim();
    if (title !== undefined) payload.title = String(title).trim();
    if (description !== undefined) payload.description = String(description).trim();
    if (explore_button_text !== undefined) payload.explore_button_text = String(explore_button_text).trim();
    if (explore_button_url !== undefined) payload.explore_button_url = String(explore_button_url).trim();

    // One section row; update it if present (whatever its id), otherwise create it
    const { data: existing, error: findErr } = await supabase.from('product_discovery_sections').select('id').limit(1);
    if (findErr) return dbError(res, 'save the section', findErr);
    const result = existing?.length
      ? await supabase.from('product_discovery_sections').update({ ...payload, id: existing[0].id }).eq('id', existing[0].id).select().single()
      : await supabase.from('product_discovery_sections').insert([payload]).select().single();
    if (result.error) return dbError(res, 'save the section', result.error);

    return res.json({ success: true, message: 'Product Discovery section updated successfully.', section: sectionFromRow(result.data) });
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
    if (!name || !String(name).trim()) return res.status(400).json({ success: false, message: 'Mood collection name is required' });

    let order = Number(display_order);
    if (!order) {
      const { count } = await supabase.from('product_discovery_moods').select('id', { count: 'exact', head: true });
      order = (count || 0) + 1;
    }

    const { data: mood, error } = await supabase
      .from('product_discovery_moods')
      .insert([{ name: String(name).trim(), description: String(description || '').trim(), display_order: order, is_active: Boolean(is_active) }])
      .select()
      .single();
    if (error || !mood) return dbError(res, 'create the mood collection', error);

    const linkErr = await syncMoodProducts(mood.id, product_ids);
    if (linkErr) return dbError(res, 'save the mood\'s products', linkErr);

    return res.json({
      success: true,
      message: 'Mood collection created successfully.',
      mood: { ...mood, product_ids: [...new Set((product_ids || []).map(String))] },
    });
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

    const payload = { updated_at: new Date().toISOString() };
    if (name !== undefined) payload.name = String(name).trim();
    if (description !== undefined) payload.description = String(description).trim();
    if (display_order !== undefined && display_order !== '') payload.display_order = Number(display_order);
    if (is_active !== undefined) payload.is_active = Boolean(is_active);

    const { data: mood, error } = await supabase.from('product_discovery_moods').update(payload).eq('id', id).select().maybeSingle();
    if (error) return dbError(res, 'update the mood collection', error);
    if (!mood) return res.status(404).json({ success: false, message: 'Mood collection not found. Reload the page and try again.' });

    if (Array.isArray(product_ids)) {
      const linkErr = await syncMoodProducts(id, product_ids);
      if (linkErr) return dbError(res, 'save the mood\'s products', linkErr);
    }

    return res.json({ success: true, message: 'Mood collection updated successfully.', mood });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error updating mood collection', error: err.message });
  }
};

/**
 * DELETE /api/product-discovery/admin/moods/:id (Admin) — product links cascade
 */
export const deleteMood = async (req, res) => {
  try {
    const { id } = req.params;
    const { data: removed, error } = await supabase.from('product_discovery_moods').delete().eq('id', id).select('id');
    if (error) return dbError(res, 'delete the mood collection', error);
    if (!removed || removed.length === 0) return res.status(404).json({ success: false, message: 'Mood collection not found (it may already be deleted).' });
    return res.json({ success: true, message: 'Mood collection deleted successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error deleting mood collection', error: err.message });
  }
};

/**
 * PUT|POST /api/product-discovery/admin/moods/reorder (Admin)
 * Body: { orders: [{ id, display_order }] }  (admin page)  or  { orderedIds: [id, ...] }
 */
export const reorderMoods = async (req, res) => {
  try {
    const { orders, orderedIds } = req.body;
    const list = Array.isArray(orders)
      ? orders.map((o, i) => ({ id: o.id, display_order: Number(o.display_order) || i + 1 }))
      : Array.isArray(orderedIds) ? orderedIds.map((id, i) => ({ id, display_order: i + 1 })) : null;
    if (!list) return res.status(400).json({ success: false, message: 'orders (or orderedIds) array is required' });

    for (const { id, display_order } of list) {
      const { error } = await supabase.from('product_discovery_moods').update({ display_order, updated_at: new Date().toISOString() }).eq('id', id);
      if (error) return dbError(res, 'reorder the mood collections', error);
    }
    return res.json({ success: true, message: 'Mood collections reordered successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error reordering mood collections', error: err.message });
  }
};
