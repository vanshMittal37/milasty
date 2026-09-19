import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { supabase } from '../config/supabase.js';
import { initialProducts } from '../data/seedData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PREBOOKINGS_FILE = path.join(__dirname, '../data/prebookings_store.json');

// Helper to load JSON safely from disk
const loadJsonFile = (filePath, defaultData = []) => {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      if (content.trim()) return JSON.parse(content);
    }
  } catch (err) {
    console.warn(`Notice loading ${path.basename(filePath)}:`, err.message);
  }
  return defaultData;
};

// Helper to save JSON safely to disk
const saveJsonFile = (filePath, data) => {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.warn(`Notice saving ${path.basename(filePath)}:`, err.message);
  }
};

const memoryPrebookings = new Map();

// Helper to get seed prebookings linked to initialProducts
const getInitialPrebookingsSeed = () => [
  {
    id: 'pb-seed-1',
    product_id: 'signature-trio-box',
    enabled: true,
    preorder_enabled: true,
    launch_date: '2026-10-15T00:00:00.000Z',
    display_order: 1,
    custom_heading: 'Signature Trio Box',
    custom_description: '3 timeless MILASTY delights in 1 box.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'pb-seed-2',
    product_id: 'cardamom-bajra-cookies',
    enabled: true,
    preorder_enabled: true,
    launch_date: '2026-10-20T00:00:00.000Z',
    display_order: 2,
    custom_heading: 'Cardamom Bajra Cookies',
    custom_description: 'Pearl millet cookies with green cardamom.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'pb-seed-3',
    product_id: 'coconut-jowar-cookies',
    enabled: true,
    preorder_enabled: true,
    launch_date: '2026-10-25T00:00:00.000Z',
    display_order: 3,
    custom_heading: 'Coconut Jowar Cookies',
    custom_description: 'Light sorghum cookies with toasted coconut.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'pb-seed-4',
    product_id: 'cocoa-ragi-cookies',
    enabled: true,
    preorder_enabled: true,
    launch_date: '2026-10-30T00:00:00.000Z',
    display_order: 4,
    custom_heading: 'Cocoa Ragi Cookies',
    custom_description: 'Finger millet blended with Dutch cocoa.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Hydrate memory store from disk
const storedList = loadJsonFile(PREBOOKINGS_FILE, getInitialPrebookingsSeed());
storedList.forEach((pb) => { if (pb && pb.id) memoryPrebookings.set(String(pb.id), pb); });

const syncPrebookingsToDisk = () => {
  saveJsonFile(PREBOOKINGS_FILE, Array.from(memoryPrebookings.values()));
};

// Helper to lookup products across Supabase DB & seed products
const getProductsMap = async () => {
  const map = new Map();
  initialProducts.forEach((p) => {
    if (p.id) map.set(String(p.id), p);
    if (p._id) map.set(String(p._id), p);
    if (p.slug) map.set(String(p.slug), p);
  });

  try {
    const { data: dbProducts } = await supabase.from('products').select('*, product_variants(*)');
    if (dbProducts && dbProducts.length > 0) {
      dbProducts.forEach((p) => {
        const item = {
          _id: p.id,
          id: p.id,
          title: p.title,
          slug: p.slug,
          subtitle: p.subtitle,
          description: p.description,
          price: Number(p.product_variants?.[0]?.price || p.price || 0),
          originalPrice: Number(p.product_variants?.[0]?.original_price || p.original_price || p.price || 0),
          image: p.image_url,
          badges: p.badges || [],
        };
        if (p.id) map.set(String(p.id), item);
        if (p.slug) map.set(String(p.slug), item);
      });
    }
  } catch (err) {
    console.warn('Prebooking products fetch notice:', err.message);
  }

  return map;
};

/**
 * 1. PUBLIC: GET ACTIVE PRE-BOOKING PRODUCTS
 * GET /api/prebookings/active
 */
export const getPublicPrebookings = async (req, res) => {
  try {
    let dbPrebookings = [];

    try {
      const { data, error } = await supabase
        .from('prebook_products')
        .select('*')
        .eq('enabled', true)
        .order('display_order', { ascending: true })
        .order('launch_date', { ascending: true });

      if (!error && data) dbPrebookings = data;
    } catch (e) {
      console.warn('Supabase getPublicPrebookings notice:', e.message);
    }

    const memPrebookings = Array.from(memoryPrebookings.values()).filter((pb) => pb.enabled !== false);

    const pbMap = new Map();
    dbPrebookings.forEach((pb) => { if (pb && pb.id) pbMap.set(String(pb.id), pb); });
    memPrebookings.forEach((pb) => { if (pb && pb.id) pbMap.set(String(pb.id), pb); });

    let rawList = Array.from(pbMap.values());
    if (rawList.length === 0) {
      rawList = getInitialPrebookingsSeed();
    }

    const productsMap = await getProductsMap();
    const currentDate = new Date();

    const formatted = rawList
      .map((pb) => {
        const pidStr = String(pb.product_id || '').trim();
        const product = productsMap.get(pidStr) || productsMap.get(pidStr.toLowerCase()) || {};

        if (!product.title) return null; // Ignore deleted/missing products safely

        const launchDateObj = pb.launch_date ? new Date(pb.launch_date) : null;
        const isFuture = launchDateObj ? launchDateObj > currentDate : true;

        return {
          id: pb.id,
          productId: product.id || product._id || pidStr,
          title: pb.custom_heading || product.title,
          description: pb.custom_description || product.subtitle || product.description,
          image: product.image,
          price: product.price || 0,
          originalPrice: product.originalPrice || product.price || 0,
          launchDate: pb.launch_date,
          preorderEnabled: Boolean(pb.preorder_enabled ?? true),
          displayOrder: pb.display_order || 0,
          isUpcoming: isFuture,
          productSlug: product.slug || '',
        };
      })
      .filter(Boolean);

    // Sort by display order then launch date
    formatted.sort((a, b) => {
      if (a.displayOrder !== b.displayOrder) return a.displayOrder - b.displayOrder;
      return new Date(a.launchDate || 0) - new Date(b.launchDate || 0);
    });

    return res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching prebooking products', error: error.message });
  }
};

/**
 * 2. ADMIN: GET ALL PRE-BOOKING PRODUCTS
 * GET /api/prebookings/admin/all
 */
export const getAllAdminPrebookings = async (req, res) => {
  try {
    let dbPrebookings = [];

    try {
      const { data, error } = await supabase
        .from('prebook_products')
        .select('*')
        .order('display_order', { ascending: true });

      if (!error && data) dbPrebookings = data;
    } catch (e) {
      console.warn('Supabase getAllAdminPrebookings notice:', e.message);
    }

    const memPrebookings = Array.from(memoryPrebookings.values());

    const pbMap = new Map();
    dbPrebookings.forEach((pb) => { if (pb && pb.id) pbMap.set(String(pb.id), pb); });
    memPrebookings.forEach((pb) => { if (pb && pb.id) pbMap.set(String(pb.id), pb); });

    let rawList = Array.from(pbMap.values());
    if (rawList.length === 0) {
      rawList = getInitialPrebookingsSeed();
    }

    const productsMap = await getProductsMap();

    const formatted = rawList.map((pb) => {
      const pidStr = String(pb.product_id || '').trim();
      const product = productsMap.get(pidStr) || productsMap.get(pidStr.toLowerCase()) || {};

      return {
        id: pb.id,
        _id: pb.id,
        productId: pb.product_id,
        productTitle: product.title || pb.custom_heading || 'Product #' + pb.product_id,
        productImage: product.image || '',
        productPrice: product.price || 0,
        enabled: Boolean(pb.enabled ?? true),
        preorderEnabled: Boolean(pb.preorder_enabled ?? true),
        launchDate: pb.launch_date,
        preorderStartDate: pb.preorder_start_date || null,
        preorderEndDate: pb.preorder_end_date || null,
        displayOrder: pb.display_order || 0,
        customHeading: pb.custom_heading || '',
        customDescription: pb.custom_description || '',
        createdAt: pb.created_at,
      };
    });

    return res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching admin prebooking list', error: error.message });
  }
};

/**
 * 3. ADMIN: ADD PRODUCT TO PRE-BOOKING
 * POST /api/prebookings
 */
export const createPrebooking = async (req, res) => {
  try {
    const {
      productId,
      launchDate,
      enabled = true,
      preorderEnabled = true,
      displayOrder = 0,
      customHeading = '',
      customDescription = '',
    } = req.body;

    if (!productId) {
      return res.status(400).json({ message: 'Existing product selection is required' });
    }
    if (!launchDate) {
      return res.status(400).json({ message: 'Launch date is required' });
    }

    const newRecord = {
      product_id: String(productId).trim(),
      enabled: Boolean(enabled),
      preorder_enabled: Boolean(preorderEnabled),
      launch_date: new Date(launchDate).toISOString(),
      display_order: Number(displayOrder || 0),
      custom_heading: String(customHeading || '').trim(),
      custom_description: String(customDescription || '').trim(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    let inserted = null;

    try {
      const { data, error } = await supabase
        .from('prebook_products')
        .insert([newRecord])
        .select()
        .single();

      if (!error && data) inserted = data;
    } catch (e) {
      console.warn('Supabase prebook insert notice:', e.message);
    }

    if (!inserted) {
      const id = `pb_${Date.now()}`;
      inserted = { id, ...newRecord };
    }

    memoryPrebookings.set(String(inserted.id), inserted);
    syncPrebookingsToDisk();

    return res.status(201).json({
      success: true,
      message: 'Product added to Pre-Bookings successfully',
      prebooking: inserted,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating prebooking product', error: error.message });
  }
};

/**
 * 4. ADMIN: UPDATE PRE-BOOKING CONFIG
 * PUT /api/prebookings/:id
 */
export const updatePrebooking = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      productId,
      launchDate,
      enabled,
      preorderEnabled,
      displayOrder,
      customHeading,
      customDescription,
    } = req.body;

    const updates = { updated_at: new Date().toISOString() };
    if (productId !== undefined) updates.product_id = String(productId).trim();
    if (launchDate !== undefined) updates.launch_date = new Date(launchDate).toISOString();
    if (enabled !== undefined) updates.enabled = Boolean(enabled);
    if (preorderEnabled !== undefined) updates.preorder_enabled = Boolean(preorderEnabled);
    if (displayOrder !== undefined) updates.display_order = Number(displayOrder);
    if (customHeading !== undefined) updates.custom_heading = String(customHeading).trim();
    if (customDescription !== undefined) updates.custom_description = String(customDescription).trim();

    let updated = null;

    try {
      const { data, error } = await supabase
        .from('prebook_products')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (!error && data) updated = data;
    } catch (e) {
      console.warn('Supabase updatePrebooking notice:', e.message);
    }

    if (memoryPrebookings.has(String(id))) {
      const item = memoryPrebookings.get(String(id));
      Object.assign(item, updates);
      if (!updated) updated = item;
    } else if (updated) {
      memoryPrebookings.set(String(id), updated);
    }

    syncPrebookingsToDisk();

    return res.json({
      success: true,
      message: 'Pre-booking updated successfully',
      prebooking: updated || { id, ...updates },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating prebooking', error: error.message });
  }
};

/**
 * 5. ADMIN: REMOVE PRODUCT FROM PRE-BOOKING
 * DELETE /api/prebookings/:id
 */
export const deletePrebooking = async (req, res) => {
  try {
    const { id } = req.params;

    try {
      await supabase.from('prebook_products').delete().eq('id', id);
    } catch (e) {
      console.warn('Supabase deletePrebooking notice:', e.message);
    }

    memoryPrebookings.delete(String(id));
    syncPrebookingsToDisk();

    return res.json({ success: true, message: 'Removed from pre-booking successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting prebooking record', error: error.message });
  }
};
