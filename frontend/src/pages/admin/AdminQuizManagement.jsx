import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, HelpCircle, Eye, Check, Package, RefreshCw, Layers, Sparkles, X } from 'lucide-react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import ConfirmationModal from '../../components/ConfirmationModal';

export default function AdminQuizManagement() {
  const { toast } = useToast();
  const [questions, setQuestions] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Question Modal
  const [qModalOpen, setQModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [qText, setQText] = useState('');
  const [qSubtitle, setQSubtitle] = useState('');
  const [qActive, setQActive] = useState(true);
  const [qOrder, setQOrder] = useState(1);
  const [savingQ, setSavingQ] = useState(false);

  // Option Modal
  const [optModalOpen, setOptModalOpen] = useState(false);
  const [editingOption, setEditingOption] = useState(null);
  const [targetQId, setTargetQId] = useState('');
  const [optText, setOptText] = useState('');
  const [optDesc, setOptDesc] = useState('');
  const [optActive, setOptActive] = useState(true);
  const [optOrder, setOptOrder] = useState(1);
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [prodSearch, setProdSearch] = useState('');
  const [savingOpt, setSavingOpt] = useState(false);

  // Delete Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // { type: 'question'|'option', id: string }

  // Admin Preview Modal
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewQIndex, setPreviewQIndex] = useState(0);
  const [previewSelectedOption, setPreviewSelectedOption] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [quizRes, prodRes] = await Promise.all([
        api.get('/quiz/admin/all'),
        api.get('/products?limit=100'),
      ]);

      if (quizRes.data) setQuestions(quizRes.data);
      if (prodRes.data && prodRes.data.products) setProducts(prodRes.data.products);
    } catch (err) {
      console.error('Error fetching quiz data:', err);
      toast.error('Failed to load recommendation quiz.');
    } finally {
      setLoading(false);
    }
  };

  // QUESTION HANDLERS
  const handleOpenAddQuestion = () => {
    setEditingQuestion(null);
    setQText('');
    setQSubtitle('');
    setQActive(true);
    setQOrder(questions.length + 1);
    setQModalOpen(true);
  };

  const handleOpenEditQuestion = (q) => {
    setEditingQuestion(q);
    setQText(q.questionText);
    setQSubtitle(q.subtitle || '');
    setQActive(q.active !== false);
    setQOrder(q.displayOrder || 1);
    setQModalOpen(true);
  };

  const handleSaveQuestion = async (e) => {
    e.preventDefault();
    if (!qText || !qText.trim()) {
      toast.error('Question text is required.');
      return;
    }

    setSavingQ(true);
    const payload = {
      questionText: qText.trim(),
      subtitle: qSubtitle.trim(),
      active: qActive,
      displayOrder: Number(qOrder || 1),
    };

    try {
      if (editingQuestion) {
        await api.put(`/quiz/questions/${editingQuestion.id}`, payload);
        toast.success('Question updated successfully.');
      } else {
        await api.post('/quiz/questions', payload);
        toast.success('Question created successfully.');
      }
      setQModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error('Failed to save question.');
    } finally {
      setSavingQ(false);
    }
  };

  // OPTION HANDLERS
  const handleOpenAddOption = (questionId) => {
    setEditingOption(null);
    setTargetQId(questionId);
    setOptText('');
    setOptDesc('');
    setOptActive(true);
    const q = questions.find((item) => String(item.id) === String(questionId));
    setOptOrder((q?.options?.length || 0) + 1);
    setSelectedProductIds([]);
    setProdSearch('');
    setOptModalOpen(true);
  };

  const handleOpenEditOption = (qId, opt) => {
    setEditingOption(opt);
    setTargetQId(qId);
    setOptText(opt.optionText);
    setOptDesc(opt.description || '');
    setOptActive(opt.active !== false);
    setOptOrder(opt.displayOrder || 1);
    setSelectedProductIds(opt.productIds || opt.mappedProducts?.map((p) => p.id || p._id) || []);
    setProdSearch('');
    setOptModalOpen(true);
  };

  const handleSaveOption = async (e) => {
    e.preventDefault();
    if (!optText || !optText.trim()) {
      toast.error('Option text is required.');
      return;
    }

    setSavingOpt(true);
    const payload = {
      questionId: targetQId,
      optionText: optText.trim(),
      description: optDesc.trim(),
      active: optActive,
      displayOrder: Number(optOrder || 1),
      productIds: selectedProductIds,
    };

    try {
      if (editingOption) {
        await api.put(`/quiz/options/${editingOption.id}`, payload);
        toast.success('Quiz option updated successfully.');
      } else {
        await api.post('/quiz/options', payload);
        toast.success('Quiz option created successfully.');
      }
      setOptModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error('Failed to save quiz option.');
    } finally {
      setSavingOpt(false);
    }
  };

  // DELETE HANDLERS
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === 'question') {
        await api.delete(`/quiz/questions/${deleteTarget.id}`);
        toast.success('Question deleted successfully.');
      } else if (deleteTarget.type === 'option') {
        await api.delete(`/quiz/options/${deleteTarget.id}`);
        toast.success('Option deleted successfully.');
      }
      setDeleteModalOpen(false);
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      toast.error('Delete failed.');
    }
  };

  const toggleProductSelection = (productId) => {
    const pStr = String(productId);
    if (selectedProductIds.includes(pStr)) {
      setSelectedProductIds(selectedProductIds.filter((id) => id !== pStr));
    } else {
      setSelectedProductIds([...selectedProductIds, pStr]);
    }
  };

  const filteredProducts = products.filter((p) => {
    if (!prodSearch) return true;
    return p.title.toLowerCase().includes(prodSearch.toLowerCase());
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', color: 'var(--admin-text-primary)', fontWeight: '800', margin: 0, fontFamily: 'var(--font-serif)' }}>
            Recommendation Quiz Management
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--admin-text-muted)', margin: '0.2rem 0 0 0' }}>
            Configure questions, options, and product recommendation mappings for the "Find Your Perfect MILASTY Bake" section.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => {
              setPreviewQIndex(0);
              setPreviewSelectedOption(null);
              setPreviewModalOpen(true);
            }}
            className="admin-btn-secondary"
            style={{ padding: '0.65rem 1rem', fontSize: '0.82rem' }}
          >
            <Eye size={16} color="var(--admin-accent)" />
            <span>Test Quiz Preview</span>
          </button>
          
          <button
            onClick={handleOpenAddQuestion}
            className="admin-btn-primary"
            style={{ padding: '0.65rem 1.25rem', fontSize: '0.85rem' }}
          >
            <Plus size={16} />
            <span>+ Add New Question</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '4rem', gap: '0.75rem' }}>
          <RefreshCw size={22} className="animate-spin" color="var(--admin-accent)" />
          <span style={{ fontSize: '0.9rem', color: 'var(--admin-text-muted)' }}>Loading recommendation questions...</span>
        </div>
      ) : questions.length === 0 ? (
        <div className="admin-card" style={{ padding: '4rem 1.5rem', textAlign: 'center', color: 'var(--admin-text-muted)' }}>
          <HelpCircle size={36} color="var(--admin-text-muted)" style={{ marginBottom: '0.75rem' }} />
          <h4 style={{ fontSize: '1.05rem', color: 'var(--admin-text-primary)', margin: '0 0 0.35rem 0', fontWeight: '700' }}>
            No recommendation questions configured
          </h4>
          <p style={{ fontSize: '0.82rem', margin: '0 auto 1.25rem', maxWidth: '420px' }}>
            Add your first question to enable the interactive bake recommendation quiz on the shop page.
          </p>
          <button onClick={handleOpenAddQuestion} className="admin-btn-primary" style={{ fontSize: '0.82rem' }}>
            <Plus size={14} />
            <span>Add First Question</span>
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {questions.map((q, qIndex) => (
            <div key={q.id} className="admin-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Question Header Card */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--admin-border)', paddingBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(143, 175, 91, 0.15)', color: 'var(--admin-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '0.85rem' }}>
                    Q{qIndex + 1}
                  </span>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', color: 'var(--admin-text-primary)', fontWeight: '800', margin: 0 }}>
                      "{q.questionText}"
                    </h3>
                    {q.subtitle && (
                      <p style={{ fontSize: '0.78rem', color: 'var(--admin-text-muted)', margin: '0.15rem 0 0 0' }}>
                        {q.subtitle}
                      </p>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <span className={`admin-badge ${q.active ? 'admin-badge-success' : 'admin-badge-danger'}`} style={{ fontSize: '0.72rem' }}>
                    {q.active ? 'Active' : 'Disabled'}
                  </span>
                  <button onClick={() => handleOpenEditQuestion(q)} className="admin-icon-btn" title="Edit Question">
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => {
                      setDeleteTarget({ type: 'question', id: q.id });
                      setDeleteModalOpen(true);
                    }}
                    className="admin-icon-btn"
                    style={{ color: 'var(--admin-danger)' }}
                    title="Delete Question"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Options Header & Add Option Action */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                  <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--admin-text-secondary)', fontWeight: '800', margin: 0 }}>
                    Quiz Answer Options ({q.options?.length || 0})
                  </h4>
                  <button
                    onClick={() => handleOpenAddOption(q.id)}
                    className="admin-btn-secondary"
                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                  >
                    <Plus size={13} />
                    <span>Add Option</span>
                  </button>
                </div>

                {/* Options List */}
                {!q.options || q.options.length === 0 ? (
                  <div style={{ padding: '1.5rem', textAlign: 'center', backgroundColor: 'var(--admin-surface-elevated)', borderRadius: '10px', color: 'var(--admin-text-muted)', fontSize: '0.8rem' }}>
                    No options created for this question yet. Click "+ Add Option" above to create an option.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {q.options.map((opt, optIdx) => (
                      <div
                        key={opt.id}
                        style={{
                          padding: '1rem 1.25rem',
                          borderRadius: '12px',
                          backgroundColor: 'var(--admin-surface-elevated)',
                          border: '1px solid var(--admin-border)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.75rem',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ fontSize: '0.74rem', color: 'var(--admin-accent)', fontWeight: '800' }}>#{optIdx + 1}</span>
                              <span style={{ fontWeight: '800', color: 'var(--admin-text-primary)', fontSize: '0.92rem' }}>
                                {opt.optionText}
                              </span>
                              {!opt.active && <span className="admin-badge admin-badge-danger" style={{ fontSize: '0.65rem' }}>Disabled</span>}
                            </div>
                            {opt.description && (
                              <p style={{ fontSize: '0.78rem', color: 'var(--admin-text-muted)', margin: '0.2rem 0 0 0' }}>
                                {opt.description}
                              </p>
                            )}
                          </div>

                          <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <button onClick={() => handleOpenEditOption(q.id, opt)} className="admin-icon-btn" title="Edit Option & Product Mapping">
                              <Edit2 size={13} />
                            </button>
                            <button
                              onClick={() => {
                                setDeleteTarget({ type: 'option', id: opt.id });
                                setDeleteModalOpen(true);
                              }}
                              className="admin-icon-btn"
                              style={{ color: 'var(--admin-danger)' }}
                              title="Delete Option"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>

                        {/* Mapped Products Pills */}
                        <div style={{ borderTop: '1px dashed var(--admin-border)', paddingTop: '0.65rem' }}>
                          <span style={{ fontSize: '0.68rem', textTransform: 'uppercase', color: 'var(--admin-text-muted)', fontWeight: '800', display: 'block', marginBottom: '0.4rem' }}>
                            RECOMMENDED PRODUCTS ({opt.mappedProducts?.length || 0}):
                          </span>
                          {opt.mappedProducts && opt.mappedProducts.length > 0 ? (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                              {opt.mappedProducts.map((prod) => (
                                <div
                                  key={prod.id || prod._id}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.4rem',
                                    padding: '0.35rem 0.65rem',
                                    borderRadius: '999px',
                                    backgroundColor: 'rgba(143, 175, 91, 0.12)',
                                    border: '1px solid rgba(143, 175, 91, 0.3)',
                                    fontSize: '0.76rem',
                                    fontWeight: '700',
                                    color: 'var(--admin-text-primary)'
                                  }}
                                >
                                  {prod.image && <img src={prod.image} alt="" style={{ width: '18px', height: '18px', borderRadius: '50%', objectFit: 'cover' }} />}
                                  <span>{prod.title}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.74rem', color: 'var(--admin-danger)', fontStyle: 'italic' }}>
                              ⚠️ No products assigned yet. Click edit to map products.
                            </span>
                          )}
                        </div>

                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          ))}
        </div>
      )}

      {/* QUESTION MODAL */}
      {qModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ backgroundColor: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: '16px', maxWidth: '480px', width: '100%', padding: '1.75rem', color: 'var(--admin-text-primary)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--admin-border)', paddingBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontFamily: 'var(--font-serif)', color: 'var(--admin-text-primary)' }}>
                {editingQuestion ? 'Edit Question' : 'Add New Question'}
              </h3>
              <button onClick={() => setQModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--admin-text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            </div>

            <form onSubmit={handleSaveQuestion} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase' }}>
                  Question Text *
                </label>
                <input
                  type="text"
                  required
                  value={qText}
                  onChange={(e) => setQText(e.target.value)}
                  placeholder="e.g. What are you looking for?"
                  className="admin-input"
                />
              </div>

              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase' }}>
                  Subtitle / Instruction (Optional)
                </label>
                <input
                  type="text"
                  value={qSubtitle}
                  onChange={(e) => setQSubtitle(e.target.value)}
                  placeholder="e.g. Select your preference to see matching bakes."
                  className="admin-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase' }}>Status</label>
                  <select value={qActive ? 'true' : 'false'} onChange={(e) => setQActive(e.target.value === 'true')} className="admin-input">
                    <option value="true">Active (Visible)</option>
                    <option value="false">Disabled (Hidden)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase' }}>Display Order</label>
                  <input type="number" value={qOrder} onChange={(e) => setQOrder(e.target.value)} className="admin-input" />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setQModalOpen(false)} className="admin-btn-secondary" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" disabled={savingQ} className="admin-btn-primary" style={{ flex: 1 }}>{savingQ ? 'Saving...' : 'Save Question'}</button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* OPTION MODAL (WITH SEARCHABLE MULTI-PRODUCT SELECTOR) */}
      {optModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ backgroundColor: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: '16px', maxWidth: '560px', width: '100%', padding: '1.75rem', color: 'var(--admin-text-primary)', maxHeight: '90vh', overflowY: 'auto' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--admin-border)', paddingBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontFamily: 'var(--font-serif)', color: 'var(--admin-text-primary)' }}>
                {editingOption ? 'Edit Quiz Option' : 'Add Quiz Option'}
              </h3>
              <button onClick={() => setOptModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--admin-text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            </div>

            <form onSubmit={handleSaveOption} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase' }}>
                  Option Label *
                </label>
                <input
                  type="text"
                  required
                  value={optText}
                  onChange={(e) => setOptText(e.target.value)}
                  placeholder="e.g. Everyday Chai Snacking"
                  className="admin-input"
                />
              </div>

              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase' }}>
                  Description (Optional)
                </label>
                <input
                  type="text"
                  value={optDesc}
                  onChange={(e) => setOptDesc(e.target.value)}
                  placeholder="e.g. Wholesome low-GI cookies perfect for tea time."
                  className="admin-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase' }}>Status</label>
                  <select value={optActive ? 'true' : 'false'} onChange={(e) => setOptActive(e.target.value === 'true')} className="admin-input">
                    <option value="true">Active (Visible)</option>
                    <option value="false">Disabled (Hidden)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase' }}>Display Order</label>
                  <input type="number" value={optOrder} onChange={(e) => setOptOrder(e.target.value)} className="admin-input" />
                </div>
              </div>

              {/* SEARCHABLE MULTI-PRODUCT SELECTOR */}
              <div style={{ borderTop: '1px solid var(--admin-border)', paddingTop: '1rem' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: '800', color: 'var(--admin-accent)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase' }}>
                  Map Recommended Products ({selectedProductIds.length} Selected) *
                </label>
                <p style={{ fontSize: '0.74rem', color: 'var(--admin-text-muted)', margin: '0 0 0.65rem 0' }}>
                  Select existing products to recommend when a customer picks this option.
                </p>

                <input
                  type="text"
                  placeholder="Search products to map..."
                  value={prodSearch}
                  onChange={(e) => setProdSearch(e.target.value)}
                  className="admin-input"
                  style={{ marginBottom: '0.65rem' }}
                />

                <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid var(--admin-border)', borderRadius: '8px', backgroundColor: 'var(--admin-surface-elevated)', padding: '0.4rem' }}>
                  {filteredProducts.map((p) => {
                    const pIdStr = String(p.id || p._id);
                    const isSelected = selectedProductIds.includes(pIdStr);

                    return (
                      <div
                        key={pIdStr}
                        onClick={() => toggleProductSelection(pIdStr)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.5rem 0.75rem',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          backgroundColor: isSelected ? 'rgba(143, 175, 91, 0.15)' : 'transparent',
                          marginBottom: '0.2rem',
                          transition: 'background-color 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          {p.image && <img src={p.image} alt="" style={{ width: '26px', height: '26px', borderRadius: '4px', objectFit: 'cover' }} />}
                          <span style={{ fontSize: '0.82rem', fontWeight: isSelected ? '800' : '600', color: 'var(--admin-text-primary)' }}>{p.title}</span>
                        </div>
                        {isSelected && <Check size={16} color="var(--admin-accent)" strokeWidth={3} />}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setOptModalOpen(false)} className="admin-btn-secondary" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" disabled={savingOpt} className="admin-btn-primary" style={{ flex: 1 }}>{savingOpt ? 'Saving...' : 'Save Option'}</button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ADMIN PREVIEW MODAL */}
      {previewModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backdropFilter: 'blur(6px)' }}>
          <div style={{ backgroundColor: 'rgba(35, 21, 13, 0.95)', border: '1.5px solid #c89b3c', borderRadius: '24px', maxWidth: '650px', width: '100%', padding: '2rem', color: '#FFFDF9', position: 'relative', boxShadow: '0 20px 50px rgba(0,0,0,0.8)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.15)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={18} color="#c89b3c" />
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontFamily: 'var(--font-serif)', color: '#FFFDF9' }}>
                  Admin Interactive Quiz Preview
                </h3>
              </div>
              <button onClick={() => setPreviewModalOpen(false)} style={{ background: 'none', border: 'none', color: '#FFFDF9', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            </div>

            {questions.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#F5EBDD' }}>No active questions to preview.</div>
            ) : (
              <div>
                {(() => {
                  const currentQ = questions[previewQIndex];
                  return (
                    <div style={{ textAlign: 'center' }}>
                      <span style={{ fontSize: '0.76rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#c89b3c', fontWeight: '850', display: 'block', marginBottom: '0.4rem' }}>
                        NOT SURE WHAT TO CHOOSE?
                      </span>

                      <h3 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-serif)', color: '#FFFDF9', fontWeight: '850', margin: '0 0 0.5rem 0' }}>
                        {currentQ.questionText}
                      </h3>
                      {currentQ.subtitle && <p style={{ fontSize: '0.85rem', color: '#F5EBDD', marginBottom: '1.25rem' }}>{currentQ.subtitle}</p>}

                      {/* Options */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '380px', margin: '0 auto 1.5rem' }}>
                        {currentQ.options?.map((opt) => {
                          const isSel = previewSelectedOption?.id === opt.id;
                          return (
                            <button
                              key={opt.id}
                              onClick={() => setPreviewSelectedOption(opt)}
                              style={{
                                padding: '0.8rem 1.25rem',
                                borderRadius: '999px',
                                backgroundColor: isSel ? '#244f21' : 'rgba(20, 10, 5, 0.65)',
                                border: isSel ? '2px solid #b9cd94' : '1.5px solid rgba(255, 255, 255, 0.25)',
                                color: '#FFFDF9',
                                fontWeight: '800',
                                fontSize: '0.88rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem'
                              }}
                            >
                              {isSel && <Check size={16} color="#b9cd94" />}
                              <span>{opt.optionText}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Mapped Recommendations Preview */}
                      {previewSelectedOption && (
                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '1.25rem', marginTop: '1rem', textAlign: 'left' }}>
                          <h4 style={{ fontSize: '0.9rem', color: '#c89b3c', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.85rem 0', fontWeight: '850', textAlign: 'center' }}>
                            Recommended Bakes Preview ({previewSelectedOption.mappedProducts?.length || 0})
                          </h4>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                            {previewSelectedOption.mappedProducts?.map((p) => (
                              <div key={p.id || p._id} style={{ padding: '0.85rem', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {p.image && <img src={p.image} alt={p.title} style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '8px' }} />}
                                <div style={{ fontWeight: '800', fontSize: '0.85rem', color: '#FFFDF9' }}>{p.title}</div>
                                <div style={{ fontSize: '0.8rem', color: '#b9cd94', fontWeight: '700' }}>₹{p.price}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        title={deleteTarget?.type === 'question' ? 'Delete Question?' : 'Delete Option?'}
        message="Are you sure you want to delete this record? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        isDanger={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteModalOpen(false)}
      />

    </div>
  );
}
