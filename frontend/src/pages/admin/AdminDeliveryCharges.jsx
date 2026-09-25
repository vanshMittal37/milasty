import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit2, Trash2, CheckCircle2, AlertTriangle, ShieldCheck, 
  ToggleLeft, ToggleRight, X, RefreshCw, Truck, ArrowRight 
} from 'lucide-react';
import api from '../../api/axios';

export default function AdminDeliveryCharges() {
  const [rules, setRules] = useState([]);
  const [coverage, setCoverage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [formData, setFormData] = useState({
    min_order_value: '0',
    max_order_value: '',
    delivery_charge: '40',
    is_free_delivery: false,
    is_active: true,
  });

  // Delete modal state
  const [deletingRule, setDeletingRule] = useState(null);

  const fetchRules = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.get('/delivery-charges');
      if (res.data && res.data.rules) {
        setRules(res.data.rules);
        setCoverage(res.data.coverage || null);
      }
    } catch (err) {
      console.error('Failed to load delivery rules:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to load delivery charge rules.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleOpenAdd = () => {
    setEditingRule(null);
    setFormData({
      min_order_value: '0',
      max_order_value: '',
      delivery_charge: '40',
      is_free_delivery: false,
      is_active: true,
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (rule) => {
    setEditingRule(rule);
    setFormData({
      min_order_value: String(rule.min_order_value || 0),
      max_order_value: rule.max_order_value !== null && rule.max_order_value !== undefined ? String(rule.max_order_value) : '',
      delivery_charge: String(rule.delivery_charge || 0),
      is_free_delivery: !!rule.is_free_delivery,
      is_active: !!rule.is_active,
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const minNum = Number(formData.min_order_value);
    if (isNaN(minNum) || minNum < 0) {
      setErrorMsg('Minimum Order Value must be a valid number >= 0.');
      return;
    }

    let maxNum = null;
    if (formData.max_order_value !== '' && formData.max_order_value !== null) {
      maxNum = Number(formData.max_order_value);
      if (isNaN(maxNum) || maxNum <= minNum) {
        setErrorMsg('Maximum Order Value must be greater than Minimum Order Value.');
        return;
      }
    }

    const freeFlag = formData.is_free_delivery || Number(formData.delivery_charge) === 0;
    const chargeNum = freeFlag ? 0 : Math.max(0, Number(formData.delivery_charge || 0));

    const payload = {
      min_order_value: minNum,
      max_order_value: maxNum,
      delivery_charge: chargeNum,
      is_free_delivery: freeFlag,
      is_active: formData.is_active,
    };

    setSubmitting(true);
    try {
      if (editingRule) {
        await api.put(`/delivery-charges/${editingRule.id}`, payload);
        setSuccessMsg('Delivery rule updated successfully.');
      } else {
        await api.post('/delivery-charges', payload);
        setSuccessMsg('New delivery rule added successfully.');
      }
      setIsModalOpen(false);
      fetchRules();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to save delivery rule.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (rule) => {
    try {
      await api.put(`/delivery-charges/${rule.id}`, {
        ...rule,
        is_active: !rule.is_active,
      });
      fetchRules();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to update rule status.');
    }
  };

  const handleDelete = async () => {
    if (!deletingRule) return;
    setSubmitting(true);
    try {
      await api.delete(`/delivery-charges/${deletingRule.id}`);
      setSuccessMsg('Delivery rule deleted successfully.');
      setDeletingRule(null);
      fetchRules();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to delete delivery rule.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '1.75rem 2rem', color: '#FFF8F0', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Header Banner */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1rem',
        marginBottom: '2rem',
        paddingBottom: '1.25rem',
        borderBottom: '1px solid rgba(232, 220, 203, 0.12)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '1.2rem' }}>🇮🇳</span>
            <span style={{ fontSize: '0.75rem', fontWeight: '800', letterSpacing: '0.12em', color: '#E5C396', textTransform: 'uppercase' }}>
              All India Shipping Engine
            </span>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: '900', color: '#FFF8F0', margin: 0, fontFamily: 'var(--font-serif, Georgia, serif)' }}>
            Delivery Charges
          </h1>
          <p style={{ color: '#E8DCCB', opacity: 0.8, fontSize: '0.9rem', margin: '0.35rem 0 0 0' }}>
            Configure order-value based delivery pricing slabs across India.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.4rem',
            borderRadius: '12px',
            backgroundColor: '#C59B68',
            color: '#1C0D08',
            fontWeight: '900',
            fontSize: '0.88rem',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(197, 155, 104, 0.25)',
            transition: 'all 0.2s',
          }}
        >
          <Plus size={18} />
          <span>Add Delivery Rule</span>
        </button>
      </div>

      {/* Alerts */}
      {successMsg && (
        <div style={{
          backgroundColor: 'rgba(46, 125, 50, 0.2)',
          border: '1px solid rgba(46, 125, 50, 0.5)',
          color: '#81C784',
          padding: '0.85rem 1.25rem',
          borderRadius: '12px',
          marginBottom: '1.5rem',
          fontSize: '0.88rem',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={18} />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} style={{ background: 'none', border: 'none', color: '#81C784', cursor: 'pointer' }}><X size={16} /></button>
        </div>
      )}

      {errorMsg && (
        <div style={{
          backgroundColor: 'rgba(192, 57, 43, 0.2)',
          border: '1px solid rgba(192, 57, 43, 0.5)',
          color: '#E74C3C',
          padding: '0.85rem 1.25rem',
          borderRadius: '12px',
          marginBottom: '1.5rem',
          fontSize: '0.88rem',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={18} />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg('')} style={{ background: 'none', border: 'none', color: '#E74C3C', cursor: 'pointer' }}><X size={16} /></button>
        </div>
      )}

      {/* Coverage Status Bar */}
      {coverage && (
        <div style={{
          padding: '1.1rem 1.35rem',
          borderRadius: '16px',
          backgroundColor: coverage.isCovered ? 'rgba(47, 125, 50, 0.15)' : 'rgba(217, 119, 6, 0.15)',
          border: coverage.isCovered ? '1px solid rgba(47, 125, 50, 0.4)' : '1px solid rgba(217, 119, 6, 0.4)',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.85rem',
        }}>
          {coverage.isCovered ? (
            <CheckCircle2 size={22} color="#81C784" style={{ flexShrink: 0 }} />
          ) : (
            <AlertTriangle size={22} color="#F59E0B" style={{ flexShrink: 0 }} />
          )}
          <div>
            <div style={{
              fontWeight: '800',
              fontSize: '0.92rem',
              color: coverage.isCovered ? '#81C784' : '#F59E0B',
              letterSpacing: '0.01em',
            }}>
              {coverage.isCovered ? '✓ All Order Values Covered' : '⚠️ Order Value Coverage Warning'}
            </div>
            <div style={{ fontSize: '0.82rem', color: '#E8DCCB', opacity: 0.85, marginTop: '2px' }}>
              {coverage.message}
            </div>
          </div>
        </div>
      )}

      {/* Rules Table */}
      <div style={{
        backgroundColor: '#271712',
        border: '1px solid rgba(232, 220, 203, 0.12)',
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
      }}>
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid rgba(232, 220, 203, 0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: '800', margin: 0, color: '#FFF8F0' }}>
            Configured Delivery Rules ({rules.length})
          </h3>
          <button
            onClick={fetchRules}
            disabled={loading}
            style={{
              background: 'none',
              border: '1px solid rgba(232, 220, 203, 0.2)',
              color: '#E8DCCB',
              borderRadius: '8px',
              padding: '0.35rem 0.75rem',
              fontSize: '0.78rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
          >
            <RefreshCw size={13} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#E8DCCB', opacity: 0.7 }}>
            Loading delivery rules...
          </div>
        ) : rules.length === 0 ? (
          <div style={{ padding: '3.5rem 2rem', textAlign: 'center' }}>
            <Truck size={42} color="#C59B68" style={{ marginBottom: '1rem', opacity: 0.6 }} />
            <h4 style={{ fontSize: '1.1rem', fontWeight: '800', margin: '0 0 0.5rem 0', color: '#FFF8F0' }}>No Delivery Rules Configured</h4>
            <p style={{ fontSize: '0.85rem', color: '#E8DCCB', opacity: 0.7, margin: '0 0 1.25rem 0' }}>
              Click "+ Add Delivery Rule" above to create your first pricing rule.
            </p>
            <button onClick={handleOpenAdd} style={{ padding: '0.65rem 1.25rem', borderRadius: '10px', backgroundColor: '#C59B68', color: '#1C0D08', border: 'none', fontWeight: '800', cursor: 'pointer' }}>
              + Add Delivery Rule
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)', borderBottom: '1px solid rgba(232, 220, 203, 0.1)', color: '#E5C396', fontSize: '0.78rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: '800' }}>Order Value Range</th>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: '800' }}>Delivery Charge</th>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: '800' }}>Status</th>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: '800' }}>Last Updated</th>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: '800', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((rule, idx) => {
                  const isFree = rule.is_free_delivery || Number(rule.delivery_charge) === 0;
                  const rangeText = rule.max_order_value !== null && rule.max_order_value !== undefined 
                    ? `₹${rule.min_order_value} – ₹${rule.max_order_value}`
                    : `₹${rule.min_order_value}+`;

                  return (
                    <tr
                      key={rule.id || idx}
                      style={{
                        borderBottom: '1px solid rgba(232, 220, 203, 0.07)',
                        backgroundColor: rule.is_active ? 'transparent' : 'rgba(0, 0, 0, 0.25)',
                        opacity: rule.is_active ? 1 : 0.6,
                      }}
                    >
                      <td style={{ padding: '1.1rem 1.5rem', fontWeight: '800', color: '#FFF8F0', fontSize: '0.95rem' }}>
                        {rangeText}
                      </td>

                      <td style={{ padding: '1.1rem 1.5rem' }}>
                        {isFree ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 10px',
                            borderRadius: '999px',
                            backgroundColor: 'rgba(46, 125, 50, 0.25)',
                            color: '#81C784',
                            fontWeight: '800',
                            fontSize: '0.8rem',
                            border: '1px solid rgba(46, 125, 50, 0.4)',
                          }}>
                            FREE
                          </span>
                        ) : (
                          <span style={{ fontWeight: '800', color: '#FFF8F0', fontSize: '0.95rem' }}>
                            ₹{rule.delivery_charge}
                          </span>
                        )}
                      </td>

                      <td style={{ padding: '1.1rem 1.5rem' }}>
                        <button
                          onClick={() => handleToggleStatus(rule)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '4px 10px',
                            borderRadius: '999px',
                            backgroundColor: rule.is_active ? 'rgba(46, 125, 50, 0.2)' : 'rgba(158, 158, 158, 0.2)',
                            color: rule.is_active ? '#81C784' : '#9E9E9E',
                            border: rule.is_active ? '1px solid rgba(46, 125, 50, 0.4)' : '1px solid rgba(158, 158, 158, 0.4)',
                            fontWeight: '700',
                            fontSize: '0.78rem',
                            cursor: 'pointer',
                          }}
                        >
                          {rule.is_active ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                          <span>{rule.is_active ? 'Active' : 'Inactive'}</span>
                        </button>
                      </td>

                      <td style={{ padding: '1.1rem 1.5rem', color: '#E8DCCB', opacity: 0.6, fontSize: '0.8rem' }}>
                        {rule.updated_at ? new Date(rule.updated_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                      </td>

                      <td style={{ padding: '1.1rem 1.5rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => handleOpenEdit(rule)}
                            style={{
                              padding: '0.45rem 0.75rem',
                              borderRadius: '8px',
                              backgroundColor: 'rgba(232, 220, 203, 0.08)',
                              color: '#E5C396',
                              border: '1px solid rgba(232, 220, 203, 0.15)',
                              cursor: 'pointer',
                              fontWeight: '700',
                              fontSize: '0.8rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <Edit2 size={13} />
                            <span>Edit</span>
                          </button>

                          <button
                            onClick={() => setDeletingRule(rule)}
                            style={{
                              padding: '0.45rem 0.75rem',
                              borderRadius: '8px',
                              backgroundColor: 'rgba(192, 57, 43, 0.15)',
                              color: '#E74C3C',
                              border: '1px solid rgba(192, 57, 43, 0.3)',
                              cursor: 'pointer',
                              fontWeight: '700',
                              fontSize: '0.8rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <Trash2 size={13} />
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADD / EDIT MODAL */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem',
        }}>
          <div style={{
            backgroundColor: '#1E110D',
            border: '1px solid #C59B68',
            borderRadius: '24px',
            width: '100%',
            maxWidth: '480px',
            padding: '1.75rem',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
            color: '#FFF8F0',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', paddingBottom: '0.85rem', borderBottom: '1px solid rgba(232, 220, 203, 0.12)' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '900', margin: 0, fontFamily: 'var(--font-serif, Georgia, serif)', color: '#FFF8F0' }}>
                {editingRule ? 'Edit Delivery Rule' : 'Add Delivery Rule'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: '#E8DCCB', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '800', color: '#E5C396', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Minimum Order Value (₹) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  required
                  value={formData.min_order_value}
                  onChange={(e) => setFormData(prev => ({ ...prev, min_order_value: e.target.value }))}
                  placeholder="0"
                  style={{
                    width: '100%',
                    padding: '0.75rem 0.9rem',
                    borderRadius: '12px',
                    backgroundColor: '#271712',
                    border: '1.5px solid rgba(232, 220, 203, 0.2)',
                    color: '#FFF8F0',
                    fontSize: '0.95rem',
                    fontWeight: '700',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '800', color: '#E5C396', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Maximum Order Value (₹) <span style={{ textTransform: 'none', opacity: 0.6, fontWeight: '500' }}>(Optional — leave blank for no upper limit)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={formData.max_order_value}
                  onChange={(e) => setFormData(prev => ({ ...prev, max_order_value: e.target.value }))}
                  placeholder="e.g. 799 or leave blank"
                  style={{
                    width: '100%',
                    padding: '0.75rem 0.9rem',
                    borderRadius: '12px',
                    backgroundColor: '#271712',
                    border: '1.5px solid rgba(232, 220, 203, 0.2)',
                    color: '#FFF8F0',
                    fontSize: '0.95rem',
                    fontWeight: '700',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Free Delivery Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem', backgroundColor: '#271712', borderRadius: '12px', border: '1px solid rgba(232, 220, 203, 0.12)' }}>
                <div>
                  <div style={{ fontWeight: '800', fontSize: '0.9rem', color: '#FFF8F0' }}>Free Delivery</div>
                  <div style={{ fontSize: '0.76rem', color: '#E8DCCB', opacity: 0.7 }}>Set delivery charge to ₹0 (FREE)</div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.is_free_delivery}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    is_free_delivery: e.target.checked,
                    delivery_charge: e.target.checked ? '0' : (prev.delivery_charge === '0' ? '40' : prev.delivery_charge)
                  }))}
                  style={{ width: '20px', height: '20px', accentColor: '#C59B68', cursor: 'pointer' }}
                />
              </div>

              {!formData.is_free_delivery && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '800', color: '#E5C396', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Delivery Charge (₹) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required={!formData.is_free_delivery}
                    value={formData.delivery_charge}
                    onChange={(e) => setFormData(prev => ({ ...prev, delivery_charge: e.target.value }))}
                    placeholder="40"
                    style={{
                      width: '100%',
                      padding: '0.75rem 0.9rem',
                      borderRadius: '12px',
                      backgroundColor: '#271712',
                      border: '1.5px solid rgba(232, 220, 203, 0.2)',
                      color: '#FFF8F0',
                      fontSize: '0.95rem',
                      fontWeight: '700',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              )}

              {/* Active Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem', backgroundColor: '#271712', borderRadius: '12px', border: '1px solid rgba(232, 220, 203, 0.12)' }}>
                <div>
                  <div style={{ fontWeight: '800', fontSize: '0.9rem', color: '#FFF8F0' }}>Rule Status</div>
                  <div style={{ fontSize: '0.76rem', color: '#E8DCCB', opacity: 0.7 }}>Inactive rules are not used for calculations</div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  style={{ width: '20px', height: '20px', accentColor: '#81C784', cursor: 'pointer' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ flex: 1, padding: '0.85rem', borderRadius: '12px', border: '1px solid rgba(232, 220, 203, 0.2)', backgroundColor: 'transparent', color: '#E8DCCB', fontWeight: '800', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ flex: 1, padding: '0.85rem', borderRadius: '12px', border: 'none', backgroundColor: '#C59B68', color: '#1C0D08', fontWeight: '900', cursor: submitting ? 'not-allowed' : 'pointer' }}
                >
                  {submitting ? 'Saving...' : 'Save Delivery Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingRule && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem',
        }}>
          <div style={{
            backgroundColor: '#1E110D',
            border: '1px solid rgba(192, 57, 43, 0.4)',
            borderRadius: '24px',
            width: '100%',
            maxWidth: '420px',
            padding: '1.75rem',
            textAlign: 'center',
            color: '#FFF8F0',
          }}>
            <AlertTriangle size={42} color="#E74C3C" style={{ marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: '900', margin: '0 0 0.5rem 0' }}>
              Delete Delivery Rule?
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#E8DCCB', opacity: 0.8, margin: '0 0 1.5rem 0', lineHeight: 1.5 }}>
              Are you sure you want to delete this delivery rule ({deletingRule.max_order_value !== null ? `₹${deletingRule.min_order_value}–₹${deletingRule.max_order_value}` : `₹${deletingRule.min_order_value}+`})?
              Existing completed orders will not be affected.
            </p>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => setDeletingRule(null)}
                style={{ flex: 1, padding: '0.8rem', borderRadius: '12px', border: '1px solid rgba(232, 220, 203, 0.2)', backgroundColor: 'transparent', color: '#E8DCCB', fontWeight: '800', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={submitting}
                style={{ flex: 1, padding: '0.8rem', borderRadius: '12px', border: 'none', backgroundColor: '#E74C3C', color: '#FFFFFF', fontWeight: '900', cursor: submitting ? 'not-allowed' : 'pointer' }}
              >
                {submitting ? 'Deleting...' : 'Delete Rule'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
