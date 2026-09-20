import { supabase } from '../config/supabase.js';

let memoryIngredients = [
  { id: 'ing_bajra', name: 'BAJRA', subtitle: 'PEARL MILLET', description: 'Powerhouse of fiber, magnesium and essential nutrients for long-lasting energy.', imageUrl: '/images/image1.jpeg', active: true },
  { id: 'ing_jowar', name: 'JOWAR', subtitle: 'SORGHUM MILLET', description: 'Gluten-free supergrain packed with antioxidant polyphenols and high dietary fiber.', imageUrl: '/images/image2.jpeg', active: true },
  { id: 'ing_ragi', name: 'RAGI', subtitle: 'FINGER MILLET', description: 'Natural calcium powerhouse supporting bone density and healthy blood glucose control.', imageUrl: '/images/image3.jpeg', active: true },
  { id: 'ing_ghee', name: 'DESI GHEE', subtitle: 'PURE COW GHEE', description: 'Traditional A2 cow ghee rich in butyric acid, enhancing gut health and vitamin absorption.', imageUrl: '/images/image4.jpg', active: true },
];

/**
 * GET /api/ingredients (Public)
 */
export const getPublicIngredients = async (req, res) => {
  try {
    let dbIngredients = [];
    try {
      const { data, error } = await supabase
        .from('honest_ingredients')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: true });

      if (!error && data && data.length > 0) {
        dbIngredients = data;
      }
    } catch (e) {
      console.warn('Supabase getPublicIngredients notice:', e.message);
    }

    const source = dbIngredients.length > 0 ? dbIngredients : memoryIngredients.filter((i) => i.active !== false);
    const formatted = source.map((ing) => {
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
    });

    return res.json(formatted);
  } catch (err) {
    return res.status(500).json({ message: 'Error fetching ingredients', error: err.message });
  }
};

/**
 * GET /api/ingredients/admin/all (Admin)
 */
export const getAdminIngredients = async (req, res) => {
  try {
    let dbIngredients = [];
    try {
      const { data, error } = await supabase
        .from('honest_ingredients')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        dbIngredients = data;
      }
    } catch (e) {
      console.warn('Supabase getAdminIngredients notice:', e.message);
    }

    const source = dbIngredients.length > 0 ? dbIngredients : memoryIngredients;
    const formatted = source.map((ing) => {
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
    });

    return res.json(formatted);
  } catch (err) {
    return res.status(500).json({ message: 'Error fetching admin ingredients', error: err.message });
  }
};

/**
 * POST /api/ingredients (Admin)
 */
export const createIngredient = async (req, res) => {
  try {
    const { name, subtitle = '', description = '', image, imageUrl, image_url, active = true } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ message: 'Ingredient name is required' });
    if (!description || !description.trim()) return res.status(400).json({ message: 'Description is required' });

    const finalImage = imageUrl || image || image_url || '/images/image1.jpeg';
    const newId = `ing_${Date.now()}`;
    const payload = {
      id: newId,
      name: name.trim().toUpperCase(),
      subtitle: subtitle.trim().toUpperCase(),
      description: description.trim(),
      image_url: finalImage,
      active: Boolean(active),
    };

    try {
      await supabase.from('honest_ingredients').insert([payload]);
    } catch (e) {
      console.warn('Supabase createIngredient notice:', e.message);
    }

    const newIng = {
      id: newId,
      name: payload.name,
      subtitle: payload.subtitle,
      description: payload.description,
      image: finalImage,
      imageUrl: finalImage,
      image_url: finalImage,
      active: payload.active,
    };
    memoryIngredients.unshift(newIng);

    return res.json({ success: true, ingredient: newIng });
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
    const payload = {};
    if (name !== undefined) payload.name = name.trim().toUpperCase();
    if (subtitle !== undefined) payload.subtitle = subtitle.trim().toUpperCase();
    if (description !== undefined) payload.description = description.trim();
    if (finalImage !== undefined) payload.image_url = finalImage;
    if (active !== undefined) payload.active = Boolean(active);
    payload.updated_at = new Date().toISOString();

    try {
      await supabase.from('honest_ingredients').update(payload).eq('id', id);
    } catch (e) {
      console.warn('Supabase updateIngredient notice:', e.message);
    }

    const idx = memoryIngredients.findIndex((i) => i.id === id);
    if (idx >= 0) {
      memoryIngredients[idx] = {
        ...memoryIngredients[idx],
        ...(name !== undefined ? { name: name.toUpperCase() } : {}),
        ...(subtitle !== undefined ? { subtitle: subtitle.toUpperCase() } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(finalImage !== undefined ? { image: finalImage, imageUrl: finalImage, image_url: finalImage } : {}),
        ...(active !== undefined ? { active } : {}),
      };
    }

    return res.json({ success: true, message: 'Ingredient updated successfully' });
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
    try {
      await supabase.from('honest_ingredients').delete().eq('id', id);
    } catch (e) {
      console.warn('Supabase deleteIngredient notice:', e.message);
    }

    memoryIngredients = memoryIngredients.filter((i) => i.id !== id);
    return res.json({ success: true, message: 'Ingredient deleted successfully' });
  } catch (err) {
    return res.status(500).json({ message: 'Error deleting ingredient', error: err.message });
  }
};
