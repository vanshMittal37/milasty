import { supabase } from '../config/supabase.js';
import { initialProducts } from '../data/seedData.js';

/*
 * Recommendation quiz (Shop page) lives ONLY in Supabase:
 * recommendation_questions / recommendation_options / recommendation_option_products
 * (scripts/22_prebooking_quiz_discovery_tables.sql seeds the default question once).
 * No in-memory / JSON-file store — admin edits used to vanish on every Railway deploy.
 */
const dbError = (res, action, error) => {
  console.error(`[QUIZ] ${action} failed:`, error?.message || error);
  return res.status(500).json({
    message: `Could not ${action}: ${error?.message || 'database error'}. If a table is missing, run scripts/22_prebooking_quiz_discovery_tables.sql in Supabase.`,
  });
};

const getProductsMap = async () => {
  const map = new Map();
  initialProducts.forEach((p) => {
    if (p.id) map.set(String(p.id), p);
    if (p._id) map.set(String(p._id), p);
    if (p.slug) map.set(String(p.slug), p);
  });
  const { data: dbProducts, error } = await supabase.from('products').select('*, product_variants(*)');
  if (error) console.warn('Quiz products map notice:', error.message);
  (dbProducts || []).forEach((p) => {
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
  return map;
};

const loadQuiz = async ({ activeOnly }) => {
  let qQuery = supabase.from('recommendation_questions').select('*').order('display_order', { ascending: true });
  let oQuery = supabase.from('recommendation_options').select('*').order('display_order', { ascending: true });
  if (activeOnly) {
    qQuery = qQuery.eq('active', true);
    oQuery = oQuery.eq('active', true);
  }
  const [q, o, op] = await Promise.all([
    qQuery,
    oQuery,
    supabase.from('recommendation_option_products').select('*').order('display_order', { ascending: true }),
  ]);
  const error = q.error || o.error || op.error;
  return { error, questions: q.data || [], options: o.data || [], optionProducts: op.data || [] };
};

const productIdsFor = (optionProducts, optionId) =>
  optionProducts.filter((r) => String(r.option_id) === String(optionId)).map((r) => String(r.product_id));

/** Replace an option's product list, touching only the links that changed. */
const syncOptionProducts = async (optionId, productIds) => {
  const wanted = [...new Set((productIds || []).filter(Boolean).map(String))];
  const { data: current, error: curErr } = await supabase.from('recommendation_option_products').select('product_id').eq('option_id', optionId);
  if (curErr) return curErr;
  const have = (current || []).map((r) => String(r.product_id));
  const toRemove = have.filter((pid) => !wanted.includes(pid));
  if (toRemove.length) {
    const { error } = await supabase.from('recommendation_option_products').delete().eq('option_id', optionId).in('product_id', toRemove);
    if (error) return error;
  }
  // (re)write order for every wanted product
  if (wanted.length) {
    const rows = wanted.map((pid, idx) => ({ option_id: optionId, product_id: pid, display_order: idx + 1 }));
    const { error } = await supabase.from('recommendation_option_products').upsert(rows, { onConflict: 'option_id,product_id' });
    if (error) return error;
  }
  return null;
};

/**
 * 1. PUBLIC: GET ACTIVE QUIZ QUESTIONS & OPTIONS & MAPPED PRODUCTS
 * GET /api/quiz/active
 */
export const getPublicQuiz = async (req, res) => {
  try {
    const { error, questions, options, optionProducts } = await loadQuiz({ activeOnly: true });
    if (error) {
      console.warn('[QUIZ] public fetch notice:', error.message);
      return res.json({ success: true, questions: [] });
    }
    const productsMap = await getProductsMap();

    const formattedQuestions = questions.map((q) => ({
      id: q.id,
      questionText: q.question_text,
      subtitle: q.subtitle || '',
      displayOrder: q.display_order || 0,
      options: options
        .filter((o) => String(o.question_id) === String(q.id))
        .map((o) => ({
          id: o.id,
          optionText: o.option_text,
          description: o.description || '',
          displayOrder: o.display_order || 0,
          recommendedProducts: productIdsFor(optionProducts, o.id)
            .map((pid) => productsMap.get(pid) || productsMap.get(pid.toLowerCase()))
            .filter((p) => p && p.status !== 'inactive'),
        })),
    }));

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
    const { error, questions, options, optionProducts } = await loadQuiz({ activeOnly: false });
    if (error) return dbError(res, 'load the quiz', error);
    const productsMap = await getProductsMap();

    const formattedQuestions = questions.map((q) => ({
      id: q.id,
      _id: q.id,
      questionText: q.question_text,
      subtitle: q.subtitle || '',
      active: Boolean(q.active ?? true),
      displayOrder: q.display_order || 0,
      options: options
        .filter((o) => String(o.question_id) === String(q.id))
        .map((o) => {
          const ids = productIdsFor(optionProducts, o.id);
          return {
            id: o.id,
            _id: o.id,
            questionId: o.question_id,
            optionText: o.option_text,
            description: o.description || '',
            active: Boolean(o.active ?? true),
            displayOrder: o.display_order || 0,
            productIds: ids,
            mappedProducts: ids.map((pid) => productsMap.get(pid) || productsMap.get(pid.toLowerCase()) || { id: pid, title: pid }),
          };
        }),
    }));

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
    if (!questionText || !String(questionText).trim()) return res.status(400).json({ message: 'Question text is required' });

    const { data: inserted, error } = await supabase
      .from('recommendation_questions')
      .insert([{
        question_text: String(questionText).trim(),
        subtitle: String(subtitle || '').trim(),
        active: Boolean(active),
        display_order: Number(displayOrder || 0),
      }])
      .select()
      .single();
    if (error || !inserted) return dbError(res, 'create the question', error);

    return res.status(201).json({ success: true, message: 'Question created successfully', question: inserted });
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
    if (displayOrder !== undefined && displayOrder !== '') updates.display_order = Number(displayOrder);

    const { data: updated, error } = await supabase.from('recommendation_questions').update(updates).eq('id', id).select().maybeSingle();
    if (error) return dbError(res, 'update the question', error);
    if (!updated) return res.status(404).json({ message: 'Question not found. Reload the page and try again.' });

    return res.json({ success: true, message: 'Question updated successfully', question: updated });
  } catch (error) {
    res.status(500).json({ message: 'Error updating question', error: error.message });
  }
};

/**
 * 5. ADMIN: DELETE QUIZ QUESTION (its options and product links cascade)
 * DELETE /api/quiz/questions/:id
 */
export const deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const { data: removed, error } = await supabase.from('recommendation_questions').delete().eq('id', id).select('id');
    if (error) return dbError(res, 'delete the question', error);
    if (!removed || removed.length === 0) return res.status(404).json({ message: 'Question not found (it may already be deleted).' });
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
    if (!questionId || !optionText || !String(optionText).trim()) {
      return res.status(400).json({ message: 'Question selection and option text are required' });
    }

    const { data: inserted, error } = await supabase
      .from('recommendation_options')
      .insert([{
        question_id: String(questionId).trim(),
        option_text: String(optionText).trim(),
        description: String(description || '').trim(),
        active: Boolean(active),
        display_order: Number(displayOrder || 0),
      }])
      .select()
      .single();
    if (error || !inserted) return dbError(res, 'create the option', error);

    const linkErr = await syncOptionProducts(inserted.id, productIds);
    if (linkErr) return dbError(res, 'save the option\'s products', linkErr);

    return res.status(201).json({ success: true, message: 'Option created successfully', option: { ...inserted, product_ids: productIds || [] } });
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
    if (displayOrder !== undefined && displayOrder !== '') updates.display_order = Number(displayOrder);

    const { data: updated, error } = await supabase.from('recommendation_options').update(updates).eq('id', id).select().maybeSingle();
    if (error) return dbError(res, 'update the option', error);
    if (!updated) return res.status(404).json({ message: 'Option not found. Reload the page and try again.' });

    if (Array.isArray(productIds)) {
      const linkErr = await syncOptionProducts(id, productIds);
      if (linkErr) return dbError(res, 'save the option\'s products', linkErr);
    }

    return res.json({ success: true, message: 'Option updated successfully', option: { ...updated, product_ids: productIds } });
  } catch (error) {
    res.status(500).json({ message: 'Error updating option', error: error.message });
  }
};

/**
 * 8. ADMIN: DELETE QUIZ OPTION (product links cascade)
 * DELETE /api/quiz/options/:id
 */
export const deleteOption = async (req, res) => {
  try {
    const { id } = req.params;
    const { data: removed, error } = await supabase.from('recommendation_options').delete().eq('id', id).select('id');
    if (error) return dbError(res, 'delete the option', error);
    if (!removed || removed.length === 0) return res.status(404).json({ message: 'Option not found (it may already be deleted).' });
    return res.json({ success: true, message: 'Option deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting option', error: error.message });
  }
};
