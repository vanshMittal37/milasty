import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { supabase } from '../config/supabase.js';
import { initialProducts } from '../data/seedData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const QUIZ_FILE = path.join(__dirname, '../data/quiz_store.json');

const loadJsonFile = (filePath, defaultData = null) => {
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

const getInitialQuizSeed = () => ({
  questions: [
    {
      id: 'q-seed-1',
      question_text: 'What are you looking for?',
      subtitle: 'Select an option to discover custom recommended MILASTY bakes.',
      active: true,
      display_order: 1,
      created_at: new Date().toISOString(),
    },
  ],
  options: [
    {
      id: 'opt-seed-1',
      question_id: 'q-seed-1',
      option_text: 'Everyday Chai Snacking',
      description: 'Wholesome, low-GI crunchy cookies perfect for tea time.',
      active: true,
      display_order: 1,
      product_ids: ['coconut-jowar-cookies', 'cardamom-bajra-cookies'],
      created_at: new Date().toISOString(),
    },
    {
      id: 'opt-seed-2',
      question_id: 'q-seed-1',
      option_text: 'Something for Gifting',
      description: 'Artisan hampers and bestseller boxes for family & celebrations.',
      active: true,
      display_order: 2,
      product_ids: ['signature-trio-box', 'imperial-wedding-hamper'],
      created_at: new Date().toISOString(),
    },
    {
      id: 'opt-seed-3',
      question_id: 'q-seed-1',
      option_text: 'A Light Evening Snack',
      description: 'Digestive & nutrient-dense millet bakes without refined flour.',
      active: true,
      display_order: 3,
      product_ids: ['cocoa-ragi-cookies', 'coconut-jowar-cookies'],
      created_at: new Date().toISOString(),
    },
  ],
});

let quizStore = loadJsonFile(QUIZ_FILE, getInitialQuizSeed());
if (!quizStore || !quizStore.questions || quizStore.questions.length === 0) {
  quizStore = getInitialQuizSeed();
}

const syncQuizToDisk = () => {
  saveJsonFile(QUIZ_FILE, quizStore);
};

// Lookup product details
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
          labReportUrl: p.lab_report_url || '',
          status: p.is_active !== false ? 'active' : 'inactive',
        };
        if (p.id) map.set(String(p.id), item);
        if (p.slug) map.set(String(p.slug), item);
      });
    }
  } catch (err) {
    console.warn('Quiz products map notice:', err.message);
  }

  return map;
};

/**
 * 1. PUBLIC: GET ACTIVE QUIZ QUESTIONS & OPTIONS & MAPPED PRODUCTS
 * GET /api/quiz/active
 */
export const getPublicQuiz = async (req, res) => {
  try {
    let dbQuestions = [];
    let dbOptions = [];
    let dbOptionProducts = [];

    try {
      const { data: qData } = await supabase
        .from('recommendation_questions')
        .select('*')
        .eq('active', true)
        .order('display_order', { ascending: true });

      if (qData) dbQuestions = qData;

      const { data: optData } = await supabase
        .from('recommendation_options')
        .select('*')
        .eq('active', true)
        .order('display_order', { ascending: true });

      if (optData) dbOptions = optData;

      const { data: opData } = await supabase
        .from('recommendation_option_products')
        .select('*')
        .order('display_order', { ascending: true });

      if (opData) dbOptionProducts = opData;
    } catch (e) {
      console.warn('Supabase getPublicQuiz notice:', e.message);
    }

    let questions = dbQuestions.length > 0 ? dbQuestions : quizStore.questions.filter((q) => q.active !== false);
    let options = dbOptions.length > 0 ? dbOptions : quizStore.options.filter((o) => o.active !== false);

    if (questions.length === 0) {
      questions = getInitialQuizSeed().questions;
      options = getInitialQuizSeed().options;
    }

    const productsMap = await getProductsMap();

    const formattedQuestions = questions.map((q) => {
      const qOptions = options
        .filter((o) => String(o.question_id || o.questionId) === String(q.id))
        .map((o) => {
          let optionProductIds = [];
          if (dbOptionProducts.length > 0) {
            optionProductIds = dbOptionProducts
              .filter((op) => String(op.option_id) === String(o.id))
              .map((op) => op.product_id);
          } else {
            optionProductIds = o.product_ids || o.productIds || [];
          }

          const mappedProducts = optionProductIds
            .map((pid) => {
              const pidStr = String(pid).trim();
              const p = productsMap.get(pidStr) || productsMap.get(pidStr.toLowerCase());
              if (!p || p.status === 'inactive') return null;
              return p;
            })
            .filter(Boolean);

          return {
            id: o.id,
            optionText: o.option_text || o.optionText,
            description: o.description || '',
            displayOrder: o.display_order || 0,
            recommendedProducts: mappedProducts,
          };
        });

      return {
        id: q.id,
        questionText: q.question_text || q.questionText,
        subtitle: q.subtitle || '',
        displayOrder: q.display_order || 0,
        options: qOptions,
      };
    });

    return res.json({ success: true, questions: formattedQuestions });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching recommendation quiz', error: error.message });
  }
};

/**
 * 2. ADMIN: GET ALL QUIZ QUESTIONS, OPTIONS & MAPPED PRODUCTS
 * GET /api/quiz/admin/all
 */
export const getAllAdminQuiz = async (req, res) => {
  try {
    let dbQuestions = [];
    let dbOptions = [];
    let dbOptionProducts = [];

    try {
      const { data: qData } = await supabase.from('recommendation_questions').select('*').order('display_order', { ascending: true });
      if (qData) dbQuestions = qData;

      const { data: optData } = await supabase.from('recommendation_options').select('*').order('display_order', { ascending: true });
      if (optData) dbOptions = optData;

      const { data: opData } = await supabase.from('recommendation_option_products').select('*');
      if (opData) dbOptionProducts = opData;
    } catch (e) {
      console.warn('Supabase getAllAdminQuiz notice:', e.message);
    }

    let questions = dbQuestions.length > 0 ? dbQuestions : quizStore.questions;
    let options = dbOptions.length > 0 ? dbOptions : quizStore.options;

    if (!questions || questions.length === 0) {
      questions = getInitialQuizSeed().questions;
      options = getInitialQuizSeed().options;
    }

    const productsMap = await getProductsMap();

    const formattedQuestions = questions.map((q) => {
      const qOptions = options
        .filter((o) => String(o.question_id || o.questionId) === String(q.id))
        .map((o) => {
          let optionProductIds = [];
          if (dbOptionProducts.length > 0) {
            optionProductIds = dbOptionProducts
              .filter((op) => String(op.option_id) === String(o.id))
              .map((op) => op.product_id);
          } else {
            optionProductIds = o.product_ids || o.productIds || [];
          }

          const mappedProducts = optionProductIds
            .map((pid) => {
              const pidStr = String(pid).trim();
              return productsMap.get(pidStr) || productsMap.get(pidStr.toLowerCase()) || { id: pid, title: pid };
            })
            .filter(Boolean);

          return {
            id: o.id,
            _id: o.id,
            questionId: o.question_id || o.questionId,
            optionText: o.option_text || o.optionText,
            description: o.description || '',
            active: Boolean(o.active ?? true),
            displayOrder: o.display_order || 0,
            productIds: optionProductIds,
            mappedProducts,
          };
        });

      return {
        id: q.id,
        _id: q.id,
        questionText: q.question_text || q.questionText,
        subtitle: q.subtitle || '',
        active: Boolean(q.active ?? true),
        displayOrder: q.display_order || 0,
        options: qOptions,
      };
    });

    return res.json(formattedQuestions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching admin quiz list', error: error.message });
  }
};

/**
 * 3. ADMIN: CREATE QUIZ QUESTION
 * POST /api/quiz/questions
 */
export const createQuestion = async (req, res) => {
  try {
    const { questionText, subtitle = '', active = true, displayOrder = 0 } = req.body;

    if (!questionText || !questionText.trim()) {
      return res.status(400).json({ message: 'Question text is required' });
    }

    const newRecord = {
      question_text: String(questionText).trim(),
      subtitle: String(subtitle || '').trim(),
      active: Boolean(active),
      display_order: Number(displayOrder || 0),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    let inserted = null;

    try {
      const { data, error } = await supabase.from('recommendation_questions').insert([newRecord]).select().single();
      if (!error && data) inserted = data;
    } catch (e) {
      console.warn('Supabase createQuestion notice:', e.message);
    }

    if (!inserted) {
      const id = `q_${Date.now()}`;
      inserted = { id, ...newRecord };
    }

    quizStore.questions.push(inserted);
    syncQuizToDisk();

    return res.status(201).json({
      success: true,
      message: 'Question created successfully',
      question: inserted,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating question', error: error.message });
  }
};

/**
 * 4. ADMIN: UPDATE QUIZ QUESTION
 * PUT /api/quiz/questions/:id
 */
export const updateQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const { questionText, subtitle, active, displayOrder } = req.body;

    const updates = { updated_at: new Date().toISOString() };
    if (questionText !== undefined) updates.question_text = String(questionText).trim();
    if (subtitle !== undefined) updates.subtitle = String(subtitle).trim();
    if (active !== undefined) updates.active = Boolean(active);
    if (displayOrder !== undefined) updates.display_order = Number(displayOrder);

    let updated = null;

    try {
      const { data, error } = await supabase.from('recommendation_questions').update(updates).eq('id', id).select().single();
      if (!error && data) updated = data;
    } catch (e) {
      console.warn('Supabase updateQuestion notice:', e.message);
    }

    const idx = quizStore.questions.findIndex((q) => String(q.id) === String(id));
    if (idx !== -1) {
      Object.assign(quizStore.questions[idx], updates);
      if (!updated) updated = quizStore.questions[idx];
    } else if (updated) {
      quizStore.questions.push(updated);
    }

    syncQuizToDisk();

    return res.json({
      success: true,
      message: 'Question updated successfully',
      question: updated || { id, ...updates },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating question', error: error.message });
  }
};

/**
 * 5. ADMIN: DELETE QUIZ QUESTION
 * DELETE /api/quiz/questions/:id
 */
export const deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;

    try {
      await supabase.from('recommendation_questions').delete().eq('id', id);
    } catch (e) {
      console.warn('Supabase deleteQuestion notice:', e.message);
    }

    quizStore.questions = quizStore.questions.filter((q) => String(q.id) !== String(id));
    quizStore.options = quizStore.options.filter((o) => String(o.question_id) !== String(id));
    syncQuizToDisk();

    return res.json({ success: true, message: 'Question deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting question', error: error.message });
  }
};

/**
 * 6. ADMIN: CREATE QUIZ OPTION
 * POST /api/quiz/options
 */
export const createOption = async (req, res) => {
  try {
    const { questionId, optionText, description = '', active = true, displayOrder = 0, productIds = [] } = req.body;

    if (!questionId || !optionText || !optionText.trim()) {
      return res.status(400).json({ message: 'Question selection and option text are required' });
    }

    const newRecord = {
      question_id: String(questionId).trim(),
      option_text: String(optionText).trim(),
      description: String(description || '').trim(),
      active: Boolean(active),
      display_order: Number(displayOrder || 0),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    let inserted = null;

    try {
      const { data, error } = await supabase.from('recommendation_options').insert([newRecord]).select().single();
      if (!error && data) inserted = data;
    } catch (e) {
      console.warn('Supabase createOption notice:', e.message);
    }

    if (!inserted) {
      const id = `opt_${Date.now()}`;
      inserted = { id, ...newRecord };
    }

    // Insert product mappings
    if (productIds && Array.isArray(productIds) && productIds.length > 0) {
      try {
        const rows = productIds.map((pid, idx) => ({
          option_id: inserted.id,
          product_id: String(pid),
          display_order: idx + 1,
        }));
        await supabase.from('recommendation_option_products').insert(rows);
      } catch (opErr) {
        console.warn('Supabase option products insert notice:', opErr.message);
      }
    }

    inserted.product_ids = productIds || [];
    quizStore.options.push(inserted);
    syncQuizToDisk();

    return res.status(201).json({
      success: true,
      message: 'Option created successfully',
      option: inserted,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating option', error: error.message });
  }
};

/**
 * 7. ADMIN: UPDATE QUIZ OPTION
 * PUT /api/quiz/options/:id
 */
export const updateOption = async (req, res) => {
  try {
    const { id } = req.params;
    const { optionText, description, active, displayOrder, productIds } = req.body;

    const updates = { updated_at: new Date().toISOString() };
    if (optionText !== undefined) updates.option_text = String(optionText).trim();
    if (description !== undefined) updates.description = String(description).trim();
    if (active !== undefined) updates.active = Boolean(active);
    if (displayOrder !== undefined) updates.display_order = Number(displayOrder);

    let updated = null;

    try {
      const { data, error } = await supabase.from('recommendation_options').update(updates).eq('id', id).select().single();
      if (!error && data) updated = data;
    } catch (e) {
      console.warn('Supabase updateOption notice:', e.message);
    }

    // Sync product mappings
    if (productIds && Array.isArray(productIds)) {
      try {
        await supabase.from('recommendation_option_products').delete().eq('option_id', id);
        if (productIds.length > 0) {
          const rows = productIds.map((pid, idx) => ({
            option_id: id,
            product_id: String(pid),
            display_order: idx + 1,
          }));
          await supabase.from('recommendation_option_products').insert(rows);
        }
      } catch (opErr) {
        console.warn('Option products update notice:', opErr.message);
      }
    }

    const idx = quizStore.options.findIndex((o) => String(o.id) === String(id));
    if (idx !== -1) {
      Object.assign(quizStore.options[idx], updates);
      if (productIds !== undefined) quizStore.options[idx].product_ids = productIds;
      if (!updated) updated = quizStore.options[idx];
    } else if (updated) {
      updated.product_ids = productIds || [];
      quizStore.options.push(updated);
    }

    syncQuizToDisk();

    return res.json({
      success: true,
      message: 'Option updated successfully',
      option: updated || { id, ...updates },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating option', error: error.message });
  }
};

/**
 * 8. ADMIN: DELETE QUIZ OPTION
 * DELETE /api/quiz/options/:id
 */
export const deleteOption = async (req, res) => {
  try {
    const { id } = req.params;

    try {
      await supabase.from('recommendation_option_products').delete().eq('option_id', id);
      await supabase.from('recommendation_options').delete().eq('id', id);
    } catch (e) {
      console.warn('Supabase deleteOption notice:', e.message);
    }

    quizStore.options = quizStore.options.filter((o) => String(o.id) !== String(id));
    syncQuizToDisk();

    return res.json({ success: true, message: 'Option deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting option', error: error.message });
  }
};
