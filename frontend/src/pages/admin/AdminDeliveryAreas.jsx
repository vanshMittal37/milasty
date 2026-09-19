import React, { useState, useEffect } from 'react';
import { 
  MapPin, Plus, Search, Edit2, Trash2, CheckCircle2, XCircle, 
  Truck, RefreshCw, Filter, AlertCircle, Info, Sparkles 
} from 'lucide-react';
import api from '../../api/axios';
import ConfirmationModal from '../../components/ConfirmationModal';
import { useToast } from '../../context/ToastContext';

export default function AdminDeliveryAreas() {
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const { toast } = useToast();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);

  // Form Fields
  const [pincode, setPincode] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [deliveryCharge, setDeliveryCharge] = useState('0');
  const [status, setStatus] = useState('Active');
  const [estimatedDays, setEstimatedDays] = useState('3-5');
  const [notes, setNotes] = useState('');

  // Delete Modal State
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const indianStates = [
    'Uttarakhand', 'Uttar Pradesh', 'Delhi', 'Haryana', 'Punjab', 
    'Maharashtra', 'Karnataka', 'Tamil Nadu', 'Gujarat', 'Rajasthan', 
    'West Bengal', 'Telangana', 'Madhya Pradesh', 'Kerala', 'Bihar', 
    'Jharkhand', 'Assam', 'Himachal Pradesh', 'Odisha', 'Goa', 'Chandigarh'
  ];

  useEffect(() => {
    fetchDeliveryAreas();
  }, []);

  const fetchDeliveryAreas = async () => {
    setLoading(true);
    try {
      const res = await api.get('/delivery-areas');
      const data = res.data;
      if (Array.isArray(data)) {
        setAreas(data);
      } else if (data && Array.isArray(data.areas)) {
        setAreas(data.areas);
      } else {
        setAreas([]);
      }
    } catch (e) {
      toast.error('Failed to fetch delivery areas');
      setAreas([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLookupPincode = async () => {
    const cleanPincode = pincode.trim();
    if (!cleanPincode || cleanPincode.length !== 6 || !/^\d{6}$/.test(cleanPincode)) {
      toast.error('Please enter a valid 6-digit PIN code to lookup');
      return;
    }

    setLookupLoading(true);
    try {
      const res = await api.get(`/delivery-areas/lookup-pincode/${cleanPincode}`);
      if (res.data && res.data.success) {
        const { city: foundCity, state: foundState } = res.data;
        if (foundCity) setCity(foundCity);
        if (foundState) setState(foundState);
        toast.success(`Found details for ${cleanPincode}: ${foundCity}, ${foundState}`);
      } else {
        toast.error(res.data?.message || 'PIN code details not found');
      }
    } catch (e) {
      toast.error('Failed to lookup PIN code');
    } finally {
      setLookupLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setPincode('');
    setCity('');
    setState('Uttarakhand');
    setDeliveryCharge('0');
    setStatus('Active');
    setEstimatedDays('3-5');
    setNotes('');
    setIsModalOpen(true);
  };

  const checkIsActive = (area) => {
    if (!area) return false;
    if (typeof area.is_deliverable === 'boolean') return area.is_deliverable;
    if (typeof area.isDeliverable === 'boolean') return area.isDeliverable;
    if (area.status) {
      const s = String(area.status).toLowerCase();
      return s === 'active' || s === 'true';
    }
    return true;
  };

  const openEditModal = (area) => {
    const active = checkIsActive(area);
    setEditingId(area.id);
    setPincode(area.pincode || '');
    setCity(area.city || '');
    setState(area.state || 'Uttarakhand');
    setDeliveryCharge(area.delivery_charge !== undefined ? String(area.delivery_charge) : '0');
    setStatus(active ? 'Active' : 'Inactive');
    setEstimatedDays(area.estimated_days || '3-5');
    setNotes(area.notes || '');
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const cleanPincode = pincode.trim();
    const cleanCity = city.trim();
    const cleanState = state.trim();
    const chargeVal = parseFloat(deliveryCharge);

    if (!cleanPincode || cleanPincode.length !== 6 || !/^\d{6}$/.test(cleanPincode)) {
      toast.error('Please enter a valid 6-digit PIN code');
      return;
    }
    if (!cleanCity) {
      toast.error('City is required');
      return;
    }
    if (!cleanState) {
      toast.error('State is required');
      return;
    }
    if (isNaN(chargeVal) || chargeVal < 0) {
      toast.error('Delivery charge must be 0 or a positive number');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        pincode: cleanPincode,
        city: cleanCity,
        state: cleanState,
        deliveryCharge: chargeVal,
        status: status === 'Active' ? 'active' : 'inactive',
        isDeliverable: status === 'Active',
        estimatedDays: estimatedDays.trim() || '3-5',
        notes: notes.trim()
      };

      if (editingId) {
        await api.put(`/delivery-areas/${editingId}`, payload);
        toast.success(`Updated delivery area for PIN code ${cleanPincode}`);
      } else {
        await api.post('/delivery-areas', payload);
        toast.success(`Added new delivery area for PIN code ${cleanPincode}`);
      }

      setIsModalOpen(false);
      fetchDeliveryAreas();
    } catch (e) {
      const msg = e.response?.data?.error || e.response?.data?.message || 'Failed to save delivery area';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (area) => {
    const currentActive = checkIsActive(area);
    const newStatusStr = currentActive ? 'inactive' : 'active';
    const newIsDeliverable = !currentActive;

    try {
      await api.put(`/delivery-areas/${area.id}`, {
        status: newStatusStr,
        isDeliverable: newIsDeliverable
      });
      toast.success(`PIN ${area.pincode} status changed to ${newStatusStr === 'active' ? 'Active' : 'Inactive'}`);
      setAreas(prev => (Array.isArray(prev) ? prev : []).map(item => 
        item.id === area.id 
          ? { ...item, status: newStatusStr, is_deliverable: newIsDeliverable, isDeliverable: newIsDeliverable } 
          : item
      ));
    } catch (e) {
      toast.error('Failed to update status');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/delivery-areas/${deleteTarget.id}`);
      toast.success(`Deleted delivery area for PIN code ${deleteTarget.pincode}`);
      setDeleteTarget(null);
      fetchDeliveryAreas();
    } catch (e) {
      toast.error('Failed to delete delivery area');
    } finally {
      setDeleting(false);
    }
  };

  // Safe Areas Array
  const areaList = Array.isArray(areas) ? areas : [];

  // Filter Areas
  const filteredAreas = areaList.filter(area => {
    const matchesSearch = 
      (area.pincode && area.pincode.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (area.city && area.city.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (area.state && area.state.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const active = checkIsActive(area);

    if (statusFilter === 'ACTIVE') {
      return matchesSearch && active;
    }
    if (statusFilter === 'INACTIVE') {
      return matchesSearch && !active;
    }
    return matchesSearch;
  });

  // Calculate Metrics
  const totalAreasCount = areaList.length;
  const activeAreasCount = areaList.filter(a => checkIsActive(a)).length;
  const inactiveAreasCount = totalAreasCount - activeAreasCount;
  const freeDeliveryCount = areaList.filter(a => Number(a.delivery_charge) === 0).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <p style={{ fontSize: '0.68rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--admin-text-muted)', margin: '0 0 0.2rem 0' }}>
            Fulfillment & Logistics
          </p>
          <h2 style={{ fontSize: 'clamp(1.25rem, 2.5vw, 1.55rem)', fontFamily: 'var(--font-serif)', color: 'var(--admin-text-primary)', fontWeight: '800', margin: 0, lineHeight: '1.25' }}>
            Delivery Serviceability & Charges
          </h2>
          <p style={{ color: 'var(--admin-text-secondary)', fontSize: '0.82rem', margin: '0.25rem 0 0 0', fontWeight: '500' }}>
            Manage serviceable PIN codes, cities, states, and specific delivery charges for customer checkout.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button 
            onClick={fetchDeliveryAreas}
            className="admin-btn admin-btn-secondary"
            title="Refresh List"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 0.85rem' }}
          >
            <RefreshCw size={15} className={loading ? 'spin' : ''} />
            <span style={{ fontSize: '0.8rem' }}>Refresh</span>
          </button>
          
          <button 
            onClick={openAddModal}
            className="admin-btn admin-btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.55rem 1.1rem', backgroundColor: '#244f21', color: '#ffffff' }}
          >
            <Plus size={16} />
            <span style={{ fontWeight: '700', fontSize: '0.85rem' }}>Add Serviceable PIN</span>
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem' }}>
        <div className="admin-card" style={{ padding: '1.1rem 1.25rem', borderLeft: '4px solid var(--admin-accent)' }}>
          <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--admin-text-muted)', fontWeight: '700', letterSpacing: '0.05em' }}>
            Total Serviceable Areas
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '900', color: 'var(--admin-text-primary)', marginTop: '0.2rem', fontFamily: 'var(--font-serif)' }}>
            {totalAreasCount}
          </div>
        </div>

        <div className="admin-card" style={{ padding: '1.1rem 1.25rem', borderLeft: '4px solid #22c55e' }}>
          <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--admin-text-muted)', fontWeight: '700', letterSpacing: '0.05em' }}>
            Active Locations
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '900', color: '#22c55e', marginTop: '0.2rem', fontFamily: 'var(--font-serif)' }}>
            {activeAreasCount}
          </div>
        </div>

        <div className="admin-card" style={{ padding: '1.1rem 1.25rem', borderLeft: '4px solid #3b82f6' }}>
          <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--admin-text-muted)', fontWeight: '700', letterSpacing: '0.05em' }}>
            Free Delivery Locations
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '900', color: '#3b82f6', marginTop: '0.2rem', fontFamily: 'var(--font-serif)' }}>
            {freeDeliveryCount}
          </div>
        </div>

        <div className="admin-card" style={{ padding: '1.1rem 1.25rem', borderLeft: '4px solid #ef4444' }}>
          <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--admin-text-muted)', fontWeight: '700', letterSpacing: '0.05em' }}>
            Inactive Locations
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '900', color: '#ef4444', marginTop: '0.2rem', fontFamily: 'var(--font-serif)' }}>
            {inactiveAreasCount}
          </div>
        </div>
      </div>

      {/* Action & Filter Bar */}
      <div className="admin-card" style={{ padding: '1rem 1.25rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flex: '1', minWidth: '260px', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '380px' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--admin-text-muted)' }} />
            <input 
              type="text" 
              placeholder="Search by PIN code, city, state..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.55rem 0.85rem 0.55rem 2.4rem',
                backgroundColor: 'var(--admin-bg)',
                border: '1px solid var(--admin-border)',
                borderRadius: '8px',
                color: 'var(--admin-text-primary)',
                fontSize: '0.82rem',
                outline: 'none'
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--admin-text-muted)', fontWeight: '600' }}>
            <Filter size={15} /> Status:
          </div>
          <div style={{ display: 'flex', backgroundColor: 'var(--admin-bg)', padding: '3px', borderRadius: '8px', border: '1px solid var(--admin-border)' }}>
            {['ALL', 'ACTIVE', 'INACTIVE'].map(mode => (
              <button
                key={mode}
                onClick={() => setStatusFilter(mode)}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  backgroundColor: statusFilter === mode ? 'var(--admin-accent)' : 'transparent',
                  color: statusFilter === mode ? '#ffffff' : 'var(--admin-text-secondary)',
                  transition: 'all 0.15s ease'
                }}
              >
                {mode === 'ALL' ? 'All' : mode === 'ACTIVE' ? 'Active' : 'Inactive'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Delivery Areas Table */}
      <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--admin-text-muted)' }}>
            <RefreshCw size={24} className="spin" style={{ marginBottom: '0.5rem' }} />
            <p style={{ margin: 0, fontSize: '0.85rem' }}>Loading delivery serviceability records...</p>
          </div>
        ) : filteredAreas.length === 0 ? (
          <div style={{ padding: '3.5rem 1.5rem', textAlign: 'center', color: 'var(--admin-text-muted)' }}>
            <MapPin size={36} style={{ opacity: 0.4, marginBottom: '0.75rem' }} />
            <h4 style={{ margin: '0 0 0.3rem 0', color: 'var(--admin-text-primary)', fontSize: '1rem' }}>
              No Delivery Areas Found
            </h4>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--admin-text-secondary)' }}>
              {searchTerm || statusFilter !== 'ALL' 
                ? 'Try adjusting your search query or status filter.' 
                : 'Get started by adding serviceable PIN codes for your store delivery.'}
            </p>
            {!searchTerm && statusFilter === 'ALL' && (
              <button 
                onClick={openAddModal}
                className="admin-btn admin-btn-primary"
                style={{ marginTop: '1.25rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', backgroundColor: '#244f21' }}
              >
                <Plus size={16} /> Add First Delivery Area
              </button>
            )}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--admin-border)' }}>
                  <th style={{ padding: '0.85rem 1.25rem', color: 'var(--admin-text-muted)', fontWeight: '700', textTransform: 'uppercase', fontSize: '0.68rem', letterSpacing: '0.05em' }}>
                    PIN Code
                  </th>
                  <th style={{ padding: '0.85rem 1.25rem', color: 'var(--admin-text-muted)', fontWeight: '700', textTransform: 'uppercase', fontSize: '0.68rem', letterSpacing: '0.05em' }}>
                    City / Town
                  </th>
                  <th style={{ padding: '0.85rem 1.25rem', color: 'var(--admin-text-muted)', fontWeight: '700', textTransform: 'uppercase', fontSize: '0.68rem', letterSpacing: '0.05em' }}>
                    State
                  </th>
                  <th style={{ padding: '0.85rem 1.25rem', color: 'var(--admin-text-muted)', fontWeight: '700', textTransform: 'uppercase', fontSize: '0.68rem', letterSpacing: '0.05em' }}>
                    Delivery Charge
                  </th>
                  <th style={{ padding: '0.85rem 1.25rem', color: 'var(--admin-text-muted)', fontWeight: '700', textTransform: 'uppercase', fontSize: '0.68rem', letterSpacing: '0.05em' }}>
                    Est. Time
                  </th>
                  <th style={{ padding: '0.85rem 1.25rem', color: 'var(--admin-text-muted)', fontWeight: '700', textTransform: 'uppercase', fontSize: '0.68rem', letterSpacing: '0.05em' }}>
                    Status
                  </th>
                  <th style={{ padding: '0.85rem 1.25rem', color: 'var(--admin-text-muted)', fontWeight: '700', textTransform: 'uppercase', fontSize: '0.68rem', letterSpacing: '0.05em', textAlign: 'right' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAreas.map(area => {
                  const isActive = checkIsActive(area);
                  const charge = Number(area.delivery_charge);

                  return (
                    <tr key={area.id} style={{ borderBottom: '1px solid var(--admin-border)', transition: 'background-color 0.15s' }}>
                      <td style={{ padding: '0.9rem 1.25rem', fontWeight: '800', color: 'var(--admin-text-primary)', fontFamily: 'monospace', fontSize: '0.9rem' }}>
                        {area.pincode}
                      </td>
                      <td style={{ padding: '0.9rem 1.25rem', color: 'var(--admin-text-primary)', fontWeight: '600' }}>
                        {area.city}
                      </td>
                      <td style={{ padding: '0.9rem 1.25rem', color: 'var(--admin-text-secondary)' }}>
                        {area.state}
                      </td>
                      <td style={{ padding: '0.9rem 1.25rem' }}>
                        {charge === 0 ? (
                          <span style={{ 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: '0.3rem', 
                            padding: '0.2rem 0.6rem', 
                            borderRadius: '20px', 
                            backgroundColor: 'rgba(34, 197, 94, 0.15)', 
                            color: '#22c55e', 
                            fontSize: '0.72rem', 
                            fontWeight: '800' 
                          }}>
                            <Sparkles size={11} /> FREE
                          </span>
                        ) : (
                          <span style={{ fontWeight: '800', color: '#b9cd94', fontSize: '0.88rem' }}>
                            ₹{charge}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '0.9rem 1.25rem', color: 'var(--admin-text-secondary)', fontSize: '0.78rem' }}>
                        {area.estimated_days ? (area.estimated_days.includes('days') ? area.estimated_days : `${area.estimated_days} business days`) : '3-5 business days'}
                      </td>
                      <td style={{ padding: '0.9rem 1.25rem' }}>
                        <button
                          onClick={() => handleToggleStatus(area)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0.25rem 0.65rem',
                            borderRadius: '20px',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '0.72rem',
                            fontWeight: '800',
                            backgroundColor: isActive ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color: isActive ? '#22c55e' : '#ef4444',
                            transition: 'all 0.15s ease'
                          }}
                          title="Click to toggle status"
                        >
                          {isActive ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                          {isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td style={{ padding: '0.9rem 1.25rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => openEditModal(area)}
                            className="admin-btn admin-btn-secondary"
                            style={{ padding: '0.4rem 0.6rem' }}
                            title="Edit Location"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(area)}
                            className="admin-btn"
                            style={{ padding: '0.4rem 0.6rem', backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)' }}
                            title="Delete Location"
                          >
                            <Trash2 size={14} />
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

      {/* Add / Edit Delivery Area Modal */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 99999,
          backgroundColor: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div className="admin-card" style={{
            width: '100%',
            maxWidth: '520px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '1.5rem',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--admin-border)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Truck size={20} style={{ color: 'var(--admin-accent)' }} />
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontFamily: 'var(--font-serif)', color: 'var(--admin-text-primary)' }}>
                  {editingId ? 'Edit Delivery Area' : 'Add Serviceable Delivery Area'}
                </h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--admin-text-muted)', cursor: 'pointer' }}
              >
                <XCircle size={20} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              
              {/* PIN Code Lookup Row */}
              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase' }}>
                  6-Digit Indian PIN Code *
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="e.g. 263153"
                    value={pincode}
                    onChange={e => setPincode(e.target.value.replace(/\D/g, ''))}
                    style={{
                      flex: 1,
                      padding: '0.6rem 0.85rem',
                      backgroundColor: 'var(--admin-bg)',
                      border: '1px solid var(--admin-border)',
                      borderRadius: '8px',
                      color: 'var(--admin-text-primary)',
                      fontSize: '0.9rem',
                      fontFamily: 'monospace',
                      fontWeight: '700'
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleLookupPincode}
                    disabled={lookupLoading || pincode.length !== 6}
                    className="admin-btn admin-btn-secondary"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.6rem 0.85rem', fontSize: '0.78rem' }}
                  >
                    {lookupLoading ? <RefreshCw size={14} className="spin" /> : <Search size={14} />}
                    Lookup PIN
                  </button>
                </div>
                <span style={{ fontSize: '0.7rem', color: 'var(--admin-text-muted)', display: 'block', marginTop: '0.3rem' }}>
                  Click "Lookup PIN" to auto-fetch official City and State details from India Post.
                </span>
              </div>

              {/* State & City Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase' }}>
                    State *
                  </label>
                  <select
                    value={state}
                    onChange={e => setState(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.85rem',
                      backgroundColor: 'var(--admin-bg)',
                      border: '1px solid var(--admin-border)',
                      borderRadius: '8px',
                      color: 'var(--admin-text-primary)',
                      fontSize: '0.85rem'
                    }}
                  >
                    {indianStates.map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                    {!indianStates.includes(state) && state && (
                      <option value={state}>{state}</option>
                    )}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase' }}>
                    City / Town *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kichha"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.85rem',
                      backgroundColor: 'var(--admin-bg)',
                      border: '1px solid var(--admin-border)',
                      borderRadius: '8px',
                      color: 'var(--admin-text-primary)',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>
              </div>

              {/* Delivery Charge & Status */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase' }}>
                    Delivery Fee (₹) *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--admin-text-muted)', fontWeight: '700' }}>
                      ₹
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      required
                      placeholder="0 for FREE"
                      value={deliveryCharge}
                      onChange={e => setDeliveryCharge(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.6rem 0.85rem 0.6rem 2rem',
                        backgroundColor: 'var(--admin-bg)',
                        border: '1px solid var(--admin-border)',
                        borderRadius: '8px',
                        color: 'var(--admin-text-primary)',
                        fontSize: '0.88rem',
                        fontWeight: '700'
                      }}
                    />
                  </div>
                  <span style={{ fontSize: '0.68rem', color: Number(deliveryCharge) === 0 ? '#22c55e' : 'var(--admin-text-muted)', display: 'block', marginTop: '0.25rem', fontWeight: '700' }}>
                    {Number(deliveryCharge) === 0 ? '✓ FREE Delivery active' : `Flat rate ₹${deliveryCharge} delivery fee`}
                  </span>
                </div>

                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase' }}>
                    Service Status
                  </label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.85rem',
                      backgroundColor: 'var(--admin-bg)',
                      border: '1px solid var(--admin-border)',
                      borderRadius: '8px',
                      color: 'var(--admin-text-primary)',
                      fontSize: '0.85rem'
                    }}
                  >
                    <option value="Active">Active (Deliverable)</option>
                    <option value="Inactive">Inactive (Not Deliverable)</option>
                  </select>
                </div>
              </div>

              {/* Estimated Days & Notes */}
              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase' }}>
                  Estimated Delivery Timeline
                </label>
                <input
                  type="text"
                  placeholder="e.g. 2-3 business days"
                  value={estimatedDays}
                  onChange={e => setEstimatedDays(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.85rem',
                    backgroundColor: 'var(--admin-bg)',
                    border: '1px solid var(--admin-border)',
                    borderRadius: '8px',
                    color: 'var(--admin-text-primary)',
                    fontSize: '0.85rem'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--admin-text-secondary)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase' }}>
                  Internal Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Local Hub delivery area, priority shipping"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.85rem',
                    backgroundColor: 'var(--admin-bg)',
                    border: '1px solid var(--admin-border)',
                    borderRadius: '8px',
                    color: 'var(--admin-text-primary)',
                    fontSize: '0.82rem',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Form Buttons */}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="admin-btn admin-btn-secondary"
                  style={{ padding: '0.6rem 1.25rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="admin-btn admin-btn-primary"
                  style={{ padding: '0.6rem 1.5rem', backgroundColor: '#244f21', color: '#ffffff' }}
                >
                  {submitting ? 'Saving...' : editingId ? 'Update Area' : 'Save Area'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <ConfirmationModal
          isOpen={!!deleteTarget}
          title="Delete Delivery Area?"
          message={`Are you sure you want to delete the delivery area for PIN code ${deleteTarget.pincode} (${deleteTarget.city}, ${deleteTarget.state})? Customers in this PIN code will no longer see delivery availability.`}
          confirmText="Yes, Delete"
          cancelText="Cancel"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
          isLoading={deleting}
        />
      )}

    </div>
  );
}
