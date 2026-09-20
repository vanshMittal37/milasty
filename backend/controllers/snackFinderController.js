import { supabase } from '../config/supabase.js';

// In-memory memory fallback data if tables not yet populated in Supabase
let memoryQuestions = [
  {
    id: 'q_default_snack',
    title: 'What are you looking for?',
    description: 'Select your current mood or craving preference to find matching bakes.',
    active: true,
  }
];

let memoryOptions = [
  { id: 'opt_crunchy', questionId: 'q_default_snack', name: 'Light & Crunchy', description: 'Crispy millet bakes perfect for tea time.', active: true, displayOrder: 1, productIds: [] },
  { id: 'opt_chocolate', questionId: 'q_default_snack', name: 'Chocolate Cravings', description: 'Rich cocoa & artisanal chocolate millet cookies.', active: true, displayOrder: 2, productIds: [] },
  { id: 'opt_wholesome', questionId: 'q_default_snack', name: 'Something Wholesome', description: 'Nutrient-rich ancient grain bakes with Desi Ghee.', active: true, displayOrder: 3, productIds: [] },
  { id: 'opt_share', questionId: 'q_default_snack', name: 'Something to Share', description: 'Artisanal gift boxes & family celebration hampers.', active: true, displayOrder: 4, productIds: [] },
];

/**
 * GET /api/snack-finder (Public)
 */
export const getPublicSnackFinder = async (req, res) => {
  try {
    let questions = [];
    let options = [];
    let optionProductsMap = {}; // option_id -> array of product_id

    try {
      const { data: qData, error: qErr } = await supabase
        .from('snack_finder_questions')
        .select('*')
        .eq('active', true);

      if (!qErr && qData && qData.length > 0) {
        questions = qData;
      }

      const { data: oData, error: oErr } = await supabase
        .from('snack_finder_options')
        .select('*')
        .eq('active', true)
        .order('display_order', { ascending: true });

      if (!oErr && oData && oData.length > 0) {
        options = oData;
      }

      const { data: opData, error: opErr } = await supabase
        .from('snack_finder_option_products')
        .select('*');

      if (!opErr && opData) {
        opData.forEach((row) => {
          if (!optionProductsMap[row.option_id]) optionProductsMap[row.option_id] = [];
          optionProductsMap[row.option_id].push(row.product_id);
        });
      }
    } catch (e) {
      console.warn('Supabase snack finder fetch notice:', e.message);
    }

    if (questions.length === 0) questions = memoryQuestions;
    if (options.length === 0) options = memoryOptions;

    // Attach product_ids to options
    const formattedOptions = options.map((opt) => ({
      id: opt.id,
      questionId: opt.question_id || opt.questionId,
      name: opt.name,
      description: opt.description || '',
      imageUrl: opt.image_url || opt.imageUrl || '',
      productIds: optionProductsMap[opt.id] || opt.productIds || [],
    }));

    return res.json({
      question: questions[0] || memoryQuestions[0],
      options: formattedOptions,
    });
  } catch (err) {
    return res.status(500).json({ message: 'Error fetching snack finder data', error: err.message });
  }
};

/**
 * GET /api/snack-finder/admin/all (Admin)
 */
export const getAdminSnackFinder = async (req, res) => {
  try {
    let questions = [];
    let options = [];
    let optionProductsMap = {};

    try {
      const { data: qData } = await supabase.from('snack_finder_questions').select('*').order('created_at', { ascending: false });
      if (qData && qData.length > 0) questions = qData;

      const { data: oData } = await supabase.from('snack_finder_options').select('*').order('display_order', { ascending: true });
      if (oData && oData.length > 0) options = oData;

      const { data: opData } = await supabase.from('snack_finder_option_products').select('*');
      if (opData) {
        opData.forEach((row) => {
          if (!optionProductsMap[row.option_id]) optionProductsMap[row.option_id] = [];
          optionProductsMap[row.option_id].push(row.product_id);
        });
      }
    } catch (e) {
      console.warn('Supabase getAdminSnackFinder notice:', e.message);
    }

    if (questions.length === 0) questions = memoryQuestions;
    if (options.length === 0) options = memoryOptions;

    const formattedOptions = options.map((opt) => ({
      id: opt.id,
      questionId: opt.question_id || opt.questionId,
      name: opt.name,
      description: opt.description || '',
      imageUrl: opt.image_url || opt.imageUrl || '',
      active: opt.active !== false,
      productIds: optionProductsMap[opt.id] || opt.productIds || [],
    }));

    return res.json({
      questions: questions.map((q) => ({
        id: q.id,
        title: q.title,
        description: q.description || '',
        active: q.active !== false,
      })),
      options: formattedOptions,
    });
  } catch (err) {
    return res.status(500).json({ message: 'Error fetching admin snack finder data', error: err.message });
  }
};

/**
 * POST /api/snack-finder/options (Admin)
 */
export const createOption = async (req, res) => {
  try {
    const { questionId, name, description = '', imageUrl = '', active = true, productIds = [] } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ message: 'Option name is required' });

    const newId = `opt_${Date.now()}`;
    const payload = {
      id: newId,
      question_id: questionId || memoryQuestions[0].id,
      name: name.trim(),
      description: description.trim(),
      image_url: imageUrl,
      active: Boolean(active),
    };

    try {
      await supabase.from('snack_finder_options').insert([payload]);

      if (Array.isArray(productIds) && productIds.length > 0) {
        const rows = productIds.map((pid) => ({ option_id: newId, product_id: pid }));
        await supabase.from('snack_finder_option_products').insert(rows);
      }
    } catch (e) {
      console.warn('Supabase createOption notice:', e.message);
    }

    const newOpt = {
      id: newId,
      questionId: payload.question_id,
      name: payload.name,
      description: payload.description,
      imageUrl: payload.image_url,
      active: payload.active,
      productIds,
    };
    memoryOptions.push(newOpt);

    return res.json({ success: true, option: newOpt });
  } catch (err) {
    return res.status(500).json({ message: 'Error creating option', error: err.message });
  }
};

/**
 * PUT /api/snack-finder/options/:id (Admin)
 */
export const updateOption = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, imageUrl, active, productIds } = req.body;

    const payload = {};
    if (name !== undefined) payload.name = name.trim();
    if (description !== undefined) payload.description = description.trim();
    if (imageUrl !== undefined) payload.image_url = imageUrl;
    if (active !== undefined) payload.active = Boolean(active);
    payload.updated_at = new Date().toISOString();

    try {
      await supabase.from('snack_finder_options').update(payload).eq('id', id);

      if (Array.isArray(productIds)) {
        await supabase.from('snack_finder_option_products').delete().eq('option_id', id);
        if (productIds.length > 0) {
          const rows = productIds.map((pid) => ({ option_id: id, product_id: pid }));
          await supabase.from('snack_finder_option_products').insert(rows);
        }
      }
    } catch (e) {
      console.warn('Supabase updateOption notice:', e.message);
    }

    const idx = memoryOptions.findIndex((o) => o.id === id);
    if (idx >= 0) {
      memoryOptions[idx] = {
        ...memoryOptions[idx],
        ...(name !== undefined ? { name } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(imageUrl !== undefined ? { imageUrl } : {}),
        ...(active !== undefined ? { active } : {}),
        ...(Array.isArray(productIds) ? { productIds } : {}),
      };
    }

    return res.json({ success: true, message: 'Option updated successfully' });
  } catch (err) {
    return res.status(500).json({ message: 'Error updating option', error: err.message });
  }
};

/**
 * DELETE /api/snack-finder/options/:id (Admin)
 */
export const deleteOption = async (req, res) => {
  try {
    const { id } = req.params;
    try {
      await supabase.from('snack_finder_option_products').delete().eq('option_id', id);
      await supabase.from('snack_finder_options').delete().eq('id', id);
    } catch (e) {
      console.warn('Supabase deleteOption notice:', e.message);
    }

    memoryOptions = memoryOptions.filter((o) => o.id !== id);
    return res.json({ success: true, message: 'Option deleted successfully' });
  } catch (err) {
    return res.status(500).json({ message: 'Error deleting option', error: err.message });
  }
};
