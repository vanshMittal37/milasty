import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit2, Trash2, CheckCircle2, AlertTriangle, 
  ToggleLeft, ToggleRight, X, RefreshCw, Truck, ArrowRight, ShieldCheck, Tag
} from 'lucide-react';
import api from '../../api/axios';
import ConfirmationModal from '../../components/ConfirmationModal';
import { useToast } from '../../context/ToastContext';

export default function AdminDeliveryCharges() {
  const [rules, setRules] = useState([]);
  const [coverage, setCoverage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

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
    try {
      const res = await api.get('/delivery-charges');
      if (res.data && res.data.rules) {
        setRules(res.data.rules);
        setCoverage(res.data.coverage || null);
      }
    } catch (err) {
      console.error('Failed to load delivery rules:', err);
      toast.error(err.response?.data?.message || 'Failed to load delivery charge rules.');
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
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const minNum = Number(formData.min_order_value);
    if (isNaN(minNum) || minNum < 0) {
      toast.error('Minimum Order Value must be a valid number >= 0.');
      return;
    }

    let maxNum = null;
    if (formData.max_order_value !== '' && formData.max_order_value !== null) {
      maxNum = Number(formData.max_order_value);
      if (isNaN(maxNum) || maxNum <= minNum) {
        toast.error('Maximum Order Value must be greater than Minimum Order Value.');
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
        toast.success('Delivery rule updated successfully.');
      } else {
        await api.post('/delivery-charges', payload);
        toast.success('New delivery rule added successfully.');
      }
      setIsModalOpen(false);
      fetchRules();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save delivery rule.');
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
      toast.success(`Delivery rule marked ${!rule.is_active ? 'Active' : 'Inactive'}.`);
      fetchRules();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update rule status.');
    }
  };

  const handleDelete = async () => {
    if (!deletingRule) return;
    setSubmitting(true);
    try {
      await api.delete(`/delivery-charges/${deletingRule.id}`);
      toast.success('Delivery rule deleted successfully.');
      setDeletingRule(null);
      fetchRules();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete delivery rule.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <p style={{ fontSize: '0.68rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.07em', color: '#665A52', margin: '0 0 0.2rem 0' }}>
            Shipping &amp; Logistics
          </p>
          <h2 style={{ fontSize: 'clamp(1.15rem, 2.5vw, 1.45rem)', fontFamily: 'var(--font-serif)', color: '#21150F', fontWeight: '800', margin: 0, lineHeight: '1.25' }}>
            Delivery Charge Rules
          </h2>
          <p style={{ color: '#4A3B2E', fontSize: '0.8rem', margin: '0.2rem 0 0 0', fontWeight: '500' }}>
            Configure order-value based delivery pricing slabs for customer checkout across India.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="admin-btn-primary"
        >
          <Plus size={16} />
          <span>Add Delivery Rule</span>
        </button>
      </div>

      {/* Coverage Status Bar */}
      {coverage && (
        <div style={{
          padding: '1rem 1.25rem',
          borderRadius: '14px',
          backgroundColor: coverage.isCovered ? 'rgba(143, 175, 91, 0.12)' : 'rgba(217, 119, 6, 0.12)',
          border: coverage.isCovered ? '1px solid rgba(143, 175, 91, 0.35)' : '1px solid rgba(217, 119, 6, 0.35)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.85rem',
        }}>
          {coverage.isCovered ? (
            <CheckCircle2 size={20} color="#8FF75B" style={{ flexShrink: 0 }} />
          ) : (
            <AlertTriangle size={20} color="#F59E0B" style={{ flexShrink: 0 }} />
          )}
          <div>
            <div style={{
              fontWeight: '800',
              fontSize: '0.88rem',
              color: coverage.isCovered ? '#4D7C2B' : '#B45309',
              letterSpacing: '0.01em',
            }}>
              {coverage.isCovered ? 'Full Order Value Coverage' : 'Order Value Coverage Gap Detected'}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#4A3B2E', marginTop: '2px', fontWeight: '500' }}>
              {coverage.message}
            </div>
          </div>
        </div>
      )}

      {/* Main Admin Card - Rules Table */}
      <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid rgba(231, 222, 213, 0.65)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.4)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Truck size={18} color="#C68A3A" />
            <h3 style={{ fontSize: '1.05rem', fontFamily: 'var(--font-serif)', color: '#21150F', fontWeight: '800', margin: 0 }}>
              Active Delivery Slabs ({rules.length})
            </h3>
          </div>
          <button
            onClick={fetchRules}
            disabled={loading}
            className="admin-icon-btn"
            style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.4rem 0.75rem', borderRadius: '8px', border: '1px solid rgba(207, 194, 181, 0.5)' }}
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#665A52', fontSize: '0.85rem', fontWeight: '600' }}>
            <RefreshCw size={20} className="animate-spin" color="#C68A3A" style={{ marginBottom: '0.5rem' }} />
            <div>Fetching delivery rules...</div>
          </div>
        ) : rules.length === 0 ? (
          <div style={{ padding: '3.5rem 2rem', textAlign: 'center' }}>
            <Truck size={42} color="#C68A3A" style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <h4 style={{ fontSize: '1.1rem', fontFamily: 'var(--font-serif)', fontWeight: '800', margin: '0 0 0.5rem 0', color: '#21150F' }}>
              No Delivery Rules Configured
            </h4>
            <p style={{ fontSize: '0.85rem', color: '#665A52', margin: '0 0 1.25rem 0', fontWeight: '500' }}>
              Click "+ Add Delivery Rule" to create your first delivery pricing slab.
            </p>
            <button onClick={handleOpenAdd} className="admin-btn-primary">
              + Add Delivery Rule
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'rgba(247, 243, 238, 0.7)', borderBottom: '1px solid rgba(231, 222, 213, 0.7)', color: '#665A52', fontSize: '0.74rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: '800' }}>Order Value Slab</th>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: '800' }}>Delivery Fee</th>
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
                        borderBottom: '1px solid rgba(231, 222, 213, 0.4)',
                        backgroundColor: rule.is_active ? 'transparent' : 'rgba(0, 0, 0, 0.02)',
                        opacity: rule.is_active ? 1 : 0.65,
                      }}
                    >
                      <td style={{ padding: '1.1rem 1.5rem', fontWeight: '800', color: '#21150F', fontSize: '0.92rem' }}>
                        {rangeText}
                      </td>

                      <td style={{ padding: '1.1rem 1.5rem' }}>
                        {isFree ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '3px 10px',
                            borderRadius: '999px',
                            backgroundColor: 'rgba(143, 175, 91, 0.15)',
                            color: '#4D7C2B',
                            fontWeight: '800',
                            fontSize: '0.78rem',
                            border: '1px solid rgba(143, 175, 91, 0.4)',
                          }}>
                            FREE DELIVERY
                          </span>
                        ) : (
                          <span style={{ fontWeight: '800', color: '#21150F', fontSize: '0.92rem' }}>
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
                            padding: '0.35rem 0.75rem',
                            borderRadius: '8px',
                            backgroundColor: rule.is_active ? 'rgba(29, 59, 40, 0.6)' : 'rgba(217, 83, 79, 0.15)',
                            color: rule.is_active ? '#85B870' : '#D9534F',
                            border: 'none',
                            fontWeight: '700',
                            fontSize: '0.74rem',
                            cursor: 'pointer',
                          }}
                        >
                          {rule.is_active ? <ToggleRight size={15} /> : <ToggleLeft size={15} />}
                          <span>{rule.is_active ? 'Active' : 'Inactive'}</span>
                        </button>
                      </td>

                      <td style={{ padding: '1.1rem 1.5rem', color: '#665A52', fontSize: '0.78rem', fontWeight: '500' }}>
                        {rule.updated_at ? new Date(rule.updated_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                      </td>

                      <td style={{ padding: '1.1rem 1.5rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                          <button
                            onClick={() => handleOpenEdit(rule)}
                            className="admin-icon-btn"
                            style={{ color: '#b9cd94' }}
                            title="Edit Rule"
                          >
                            <Edit2 size={15} />
                          </button>

                          <button
                            onClick={() => setDeletingRule(rule)}
                            className="admin-icon-btn"
                            style={{ color: '#C62828' }}
                            title="Delete Rule"
                          >
                            <Trash2 size={15} />
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
          zIndex: 1000,
          padding: '1rem',
        }}>
          <div style={{
            width: '100%',
            maxWidth: '480px',
            backgroundColor: 'rgba(255, 255, 255, 0.92)',
            border: '1px solid rgba(231, 222, 213, 0.8)',
            borderRadius: '18px',
            padding: '1.75rem',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)',
            color: '#21150F',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', paddingBottom: '0.85rem', borderBottom: '1px solid rgba(231, 222, 213, 0.7)' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '800', margin: 0, fontFamily: 'var(--font-serif)', color: '#21150F' }}>
                {editingRule ? 'Edit Delivery Pricing Rule' : 'Add New Delivery Rule'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: '#665A52', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: '800', color: '#4A3B2E', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
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
                  className="admin-input"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: '800', color: '#4A3B2E', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Maximum Order Value (₹) <span style={{ textTransform: 'none', opacity: 0.7, fontWeight: '500' }}>(Optional)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={formData.max_order_value}
                  onChange={(e) => setFormData(prev => ({ ...prev, max_order_value: e.target.value }))}
                  placeholder="e.g. 799 (Leave empty for no upper limit)"
                  className="admin-input"
                />
              </div>

              {/* Free Delivery Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem', backgroundColor: 'var(--admin-surface-elevated)', borderRadius: '12px', border: '1px solid rgba(231, 222, 213, 0.7)' }}>
                <div>
                  <div style={{ fontWeight: '800', fontSize: '0.86rem', color: '#21150F' }}>Free Delivery Slab</div>
                  <div style={{ fontSize: '0.74rem', color: '#665A52' }}>Set shipping fee to ₹0 for this order slab</div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.is_free_delivery}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    is_free_delivery: e.target.checked,
                    delivery_charge: e.target.checked ? '0' : (prev.delivery_charge === '0' ? '40' : prev.delivery_charge)
                  }))}
                  style={{ width: '18px', height: '18px', accentColor: '#C68A3A', cursor: 'pointer' }}
                />
              </div>

              {!formData.is_free_delivery && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: '800', color: '#4A3B2E', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Delivery Fee (₹) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required={!formData.is_free_delivery}
                    value={formData.delivery_charge}
                    onChange={(e) => setFormData(prev => ({ ...prev, delivery_charge: e.target.value }))}
                    placeholder="40"
                    className="admin-input"
                  />
                </div>
              )}

              {/* Active Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem', backgroundColor: 'var(--admin-surface-elevated)', borderRadius: '12px', border: '1px solid rgba(231, 222, 213, 0.7)' }}>
                <div>
                  <div style={{ fontWeight: '800', fontSize: '0.86rem', color: '#21150F' }}>Rule Status</div>
                  <div style={{ fontSize: '0.74rem', color: '#665A52' }}>Active rules apply immediately to store checkout</div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  style={{ width: '18px', height: '18px', accentColor: '#C68A3A', cursor: 'pointer' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    flex: 1,
                    padding: '0.65rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(231, 222, 213, 0.65)',
                    backgroundColor: 'transparent',
                    color: '#4A3B2E',
                    fontWeight: '700',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="admin-btn-primary"
                  style={{ flex: 1 }}
                >
                  {submitting ? 'Saving...' : 'Save Delivery Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      <ConfirmationModal
        isOpen={!!deletingRule}
        title="Delete Delivery Rule?"
        message={deletingRule ? `Are you sure you want to delete this delivery rule (${deletingRule.max_order_value !== null && deletingRule.max_order_value !== undefined ? `₹${deletingRule.min_order_value}–₹${deletingRule.max_order_value}` : `₹${deletingRule.min_order_value}+`})?` : ''}
        confirmText="Delete Rule"
        cancelText="Cancel"
        isDanger={true}
        onConfirm={handleDelete}
        onCancel={() => setDeletingRule(null)}
      />

    </div>
  );
}
