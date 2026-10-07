import { supabase } from '../config/supabase.js';

// Ingredients live ONLY in the Supabase `honest_ingredients` table. They used to be written to a
// JSON file on the server's disk, which Railway wipes on every redeploy (admin edits and uploaded
// images vanished). Images themselves are stored on Cloudinary; the table keeps their URLs.

// Shown only if the table can't be read, so the home page never renders an empty section
const defaultIngredientsSeed = [
  { id: 'ing_bajra', name: 'BAJRA', subtitle: 'PEARL MILLET', description: 'Powerhouse of fiber, magnesium and essential minerals for long-lasting energy.', image_url: '/images/image1.jpeg', active: true },
  { id: 'ing_jowar', name: 'JOWAR', subtitle: 'SORGHUM MILLET', description: 'Gluten-free supergrain packed with antioxidant polyphenols and high dietary fiber.', image_url: '/images/image2.jpeg', active: true },
  { id: 'ing_ragi', name: 'RAGI', subtitle: 'FINGER MILLET', description: 'Natural calcium powerhouse supporting bone density and healthy blood glucose control.', image_url: '/images/image3.jpeg', active: true },
  { id: 'ing_ghee', name: 'DESI GHEE', subtitle: 'PURE COW GHEE', description: 'Traditional A2 cow ghee rich in butyric acid, enhancing gut health and vitamin absorption.', image_url: '/images/image4.jpg', active: true },
];

const TABLE = 'honest_ingredients';
const MIGRATION_HINT = 'Run backend/scripts/17_create_honest_ingredients.sql in Supabase.';

const format = (ing) => {
  const img = ing.image_url || ing.imageUrl || ing.image || '';
  return {
    id: ing.id,
    name: ing.name,
    subtitle: ing.subtitle || '',
    description: ing.description,
    image: img,
    imageUrl: img,
    image_url: img,
    active: ing.active !== false,
  };
};

const dbError = (res, action, error) => {
  console.error(`[INGREDIENTS] ${action} failed:`, error.message);
  const missingTable = error.code === 'PGRST205' || /honest_ingredients/.test(error.message || '');
  return res.status(500).json({
    message: missingTable
      ? `Ingredients table is missing in the database, so changes cannot be saved. ${MIGRATION_HINT}`
      : `Could not ${action}: ${error.message}`,
  });
};

/**
 * GET /api/ingredients (Public)
 */
export const getPublicIngredients = async (req, res) => {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('active', true)
    .order('created_at', { ascending: true });

  if (error) {
    console.error(`[INGREDIENTS] public read failed (${MIGRATION_HINT}):`, error.message);
    return res.json(defaultIngredientsSeed.map(format));
  }
  return res.json(data.map(format));
};

/**
 * GET /api/ingredients/admin/all (Admin)
 */
export const getAdminIngredients = async (req, res) => {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return dbError(res, 'load ingredients', error);
  return res.json(data.map(format));
};

/**
 * POST /api/ingredients (Admin)
 */
export const createIngredient = async (req, res) => {
  try {
    const { name, subtitle = '', description = '', image, imageUrl, image_url, active = true } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ message: 'Ingredient name is required' });
    if (!description || !description.trim()) return res.status(400).json({ message: 'Description is required' });

    const payload = {
      id: `ing_${Date.now()}`,
      name: name.trim().toUpperCase(),
      subtitle: subtitle.trim().toUpperCase(),
      description: description.trim(),
      image_url: imageUrl || image || image_url || '/images/image1.jpeg',
      active: Boolean(active),
    };

    const { data, error } = await supabase.from(TABLE).insert([payload]).select().single();
    if (error) return dbError(res, 'create ingredient', error);

    return res.json({ success: true, ingredient: format(data) });
  } catch (err) {
    return res.status(500).json({ message: 'Error creating ingredient', error: err.message });
  }
};

/**
 * PUT /api/ingredients/:id (Admin)
 */
export const updateIngredient = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, subtitle, description, image, imageUrl, image_url, active } = req.body;

    const finalImage = imageUrl !== undefined ? imageUrl : (image !== undefined ? image : image_url);
    const payload = { updated_at: new Date().toISOString() };
    if (name !== undefined) payload.name = name.trim().toUpperCase();
    if (subtitle !== undefined) payload.subtitle = subtitle.trim().toUpperCase();
    if (description !== undefined) payload.description = description.trim();
    if (finalImage !== undefined) payload.image_url = finalImage;
    if (active !== undefined) payload.active = Boolean(active);

    const { data, error } = await supabase.from(TABLE).update(payload).eq('id', id).select();
    if (error) return dbError(res, 'update ingredient', error);
    if (!data || data.length === 0) return res.status(404).json({ message: 'Ingredient not found' });

    return res.json({ success: true, message: 'Ingredient updated successfully', ingredient: format(data[0]) });
  } catch (err) {
    return res.status(500).json({ message: 'Error updating ingredient', error: err.message });
  }
};

/**
 * DELETE /api/ingredients/:id (Admin)
 */
export const deleteIngredient = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase.from(TABLE).delete().eq('id', id).select('id');
    if (error) return dbError(res, 'delete ingredient', error);
    if (!data || data.length === 0) return res.status(404).json({ message: 'Ingredient not found' });

    return res.json({ success: true, message: 'Ingredient deleted successfully' });
  } catch (err) {
    return res.status(500).json({ message: 'Error deleting ingredient', error: err.message });
  }
};
