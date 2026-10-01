import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, Search, RefreshCw, Eye, CheckCircle2, 
  Clock, Mail, Phone, ExternalLink, Send, FileText, Filter, AlertCircle, X, ChevronDown, Check
} from 'lucide-react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';

function AdminStatusBadge({ status }) {
  const getStyle = () => {
    switch (status) {
      case 'new':
        return { bg: 'rgba(198, 138, 58, 0.15)', color: '#C68A3A', border: 'rgba(198, 138, 58, 0.35)', label: 'NEW' };
      case 'in_progress':
        return { bg: 'rgba(245, 158, 11, 0.15)', color: '#B45309', border: 'rgba(245, 158, 11, 0.35)', label: 'IN PROGRESS' };
      case 'contacted':
        return { bg: 'rgba(59, 130, 246, 0.15)', color: '#1D4ED8', border: 'rgba(59, 130, 246, 0.35)', label: 'CONTACTED' };
      case 'resolved':
        return { bg: 'rgba(143, 175, 91, 0.18)', color: '#4D7C2B', border: 'rgba(143, 175, 91, 0.35)', label: 'RESOLVED' };
      case 'closed':
        return { bg: 'rgba(102, 90, 82, 0.15)', color: '#665A52', border: 'rgba(102, 90, 82, 0.35)', label: 'CLOSED' };
      default:
        return { bg: 'rgba(102, 90, 82, 0.15)', color: '#665A52', border: 'rgba(102, 90, 82, 0.35)', label: (status || 'UNKNOWN').toUpperCase() };
    }
  };

  const s = getStyle();
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '0.2rem 0.6rem',
        borderRadius: '999px',
        fontSize: '0.68rem',
        fontWeight: '800',
        letterSpacing: '0.04em',
        backgroundColor: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
      }}
    >
      {s.label}
    </span>
  );
}

export default function AdminInquiryList() {
  const { toast } = useToast();
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // Modal State
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStatus, setModalStatus] = useState('new');
  const [modalResponse, setModalResponse] = useState('');
  const [modalNotes, setModalNotes] = useState('');
  const [savingStatus, setSavingStatus] = useState(false);
  const [savingResponse, setSavingResponse] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);

  // Summary Counts
  const [summary, setSummary] = useState({
    totalQueries: 0,
    new: 0,
    in_progress: 0,
    contacted: 0,
    resolved: 0,
    closed: 0,
  });

  const fetchInquiries = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      let res;
      try {
        res = await api.get('/inquiries/admin/all');
      } catch (err404) {
        res = await api.get('/inquiries/admin');
      }
      if (res.data && res.data.success && Array.isArray(res.data.inquiries)) {
        let list = res.data.inquiries;

        // Compute summary counts
        const counts = {
          totalQueries: list.length,
          new: list.filter(i => i.status === 'new').length,
          in_progress: list.filter(i => i.status === 'in_progress').length,
          contacted: list.filter(i => i.status === 'contacted').length,
          resolved: list.filter(i => i.status === 'resolved').length,
          closed: list.filter(i => i.status === 'closed').length,
        };
        setSummary(counts);

        // Filter by status
        if (statusFilter !== 'all') {
          list = list.filter(i => i.status === statusFilter);
        }

        // Filter by search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          list = list.filter(i => 
            (i.inquiry_number || '').toLowerCase().includes(q) ||
            (i.name || '').toLowerCase().includes(q) ||
            (i.email || '').toLowerCase().includes(q) ||
            (i.phone || '').toLowerCase().includes(q) ||
            (i.message || '').toLowerCase().includes(q)
          );
        }

        // Sort
        list.sort((a, b) => {
          const dateA = new Date(a.created_at || 0).getTime();
          const dateB = new Date(b.created_at || 0).getTime();
          return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
        });

        setInquiries(list);

        if (isManualRefresh) {
          toast.success('Inquiry list updated.');
        }
      }
    } catch (err) {
      console.error('Failed to load inquiries:', err);
      toast.error('Unable to fetch customer inquiries.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, [statusFilter, searchQuery, sortBy]);

  // Modal Open Handler
  const openInquiryModal = (inquiry) => {
    setSelectedInquiry(inquiry);
    setModalStatus(inquiry.status || 'new');
    setModalResponse(inquiry.admin_response || '');
    setModalNotes(inquiry.admin_notes || '');
    setIsModalOpen(true);
  };

  // Status save
  const handleSaveStatus = async () => {
    if (!selectedInquiry) return;
    setSavingStatus(true);
    try {
      const targetId = selectedInquiry.id || selectedInquiry.inquiry_number;
      const res = await api.patch(`/inquiries/admin/${targetId}/status`, {
        status: modalStatus
      });

      if (res.data && res.data.success) {
        toast.success('Inquiry status updated.');
        setSelectedInquiry(res.data.inquiry);
        fetchInquiries();
      }
    } catch (err) {
      console.error('Status update error:', err);
      toast.error(err.response?.data?.message || 'Failed to update status.');
    } finally {
      setSavingStatus(false);
    }
  };

  // Response save
  const handleSaveResponse = async () => {
    if (!selectedInquiry) return;
    setSavingResponse(true);
    try {
      const targetId = selectedInquiry.id || selectedInquiry.inquiry_number;
      const res = await api.patch(`/inquiries/admin/${targetId}/response`, {
        admin_response: modalResponse
      });

      if (res.data && res.data.success) {
        toast.success('Admin response saved successfully.');
        setSelectedInquiry(res.data.inquiry);
        fetchInquiries();
      }
    } catch (err) {
      console.error('Response save error:', err);
      toast.error(err.response?.data?.message || 'Failed to save admin response.');
    } finally {
      setSavingResponse(false);
    }
  };

  // Notes save
  const handleSaveNotes = async () => {
    if (!selectedInquiry) return;
    setSavingNotes(true);
    try {
      const targetId = selectedInquiry.id || selectedInquiry.inquiry_number;
      const res = await api.patch(`/inquiries/admin/${targetId}/notes`, {
        admin_notes: modalNotes
      });

      if (res.data && res.data.success) {
        toast.success('Internal notes saved.');
        setSelectedInquiry(res.data.inquiry);
        fetchInquiries();
      }
    } catch (err) {
      console.error('Notes save error:', err);
      toast.error(err.response?.data?.message || 'Failed to save internal notes.');
    } finally {
      setSavingNotes(false);
    }
  };

  const getMailtoUrl = (inquiry) => {
    const subject = encodeURIComponent(`Regarding your MILASTY inquiry (${inquiry.inquiry_number})`);
    const body = encodeURIComponent(`Hello ${inquiry.name},\n\nThank you for reaching out to MILASTY regarding your inquiry (${inquiry.inquiry_number}).\n\n`);
    return `mailto:${inquiry.email}?subject=${subject}&body=${body}`;
  };

  const getWhatsappUrl = (inquiry) => {
    const cleanPhone = String(inquiry.phone || '').replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const text = encodeURIComponent(`Hello ${inquiry.name}, this is MILASTY regarding your inquiry (${inquiry.inquiry_number}).`);
    return `https://wa.me/${phoneWithCountry}?text=${text}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Recently';
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header & Refresh */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <p style={{ fontSize: '0.68rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.07em', color: '#665A52', margin: '0 0 0.2rem 0' }}>
            Customer Support
          </p>
          <h2 style={{ fontSize: 'clamp(1.15rem, 2.5vw, 1.45rem)', fontFamily: 'var(--font-serif)', color: '#21150F', fontWeight: '800', margin: 0, lineHeight: '1.25' }}>
            Customer Inquiries
          </h2>
          <p style={{ color: '#4A3B2E', fontSize: '0.8rem', margin: '0.2rem 0 0 0', fontWeight: '500' }}>
            View and manage customer questions and contact requests.
          </p>
        </div>

        <button
          onClick={() => fetchInquiries(true)}
          disabled={refreshing || loading}
          className="admin-btn-secondary"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          <span>Refresh List</span>
        </button>
      </div>

      {/* SUMMARY METRICS CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem' }}>
        {[
          { label: 'Total', count: summary.totalQueries, color: '#21150F' },
          { label: 'New', count: summary.new, color: '#C68A3A' },
          { label: 'In Progress', count: summary.in_progress, color: '#B45309' },
          { label: 'Contacted', count: summary.contacted, color: '#1D4ED8' },
          { label: 'Resolved', count: summary.resolved, color: '#4D7C2B' },
          { label: 'Closed', count: summary.closed, color: '#665A52' },
        ].map((item, idx) => (
          <div 
            key={idx}
            className="admin-card"
            style={{ padding: '1rem', textAlign: 'center', backgroundColor: 'rgba(255, 255, 255, 0.85)' }}
          >
            <div style={{ fontSize: '1.5rem', fontWeight: '900', color: item.color }}>{item.count}</div>
            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#665A52', fontWeight: '800', marginTop: '0.2rem' }}>
              {item.label}
            </div>
          </div>
        ))}
      </div>

      {/* FILTER TABS & SEARCH / SORT BAR */}
      <div className="admin-card" style={{ padding: '1.25rem' }}>
        {/* Status Filter Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.35rem', marginBottom: '1rem' }}>
          {[
            { key: 'all', label: 'All' },
            { key: 'new', label: 'New' },
            { key: 'in_progress', label: 'In Progress' },
            { key: 'contacted', label: 'Contacted' },
            { key: 'resolved', label: 'Resolved' },
            { key: 'closed', label: 'Closed' },
          ].map((tab) => {
            const isActive = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                style={{
                  padding: '0.45rem 1rem',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  fontWeight: '800',
                  border: isActive ? '1px solid #C68A3A' : '1px solid transparent',
                  backgroundColor: isActive ? 'rgba(198, 138, 58, 0.12)' : 'rgba(255, 255, 255, 0.4)',
                  color: isActive ? '#C68A3A' : '#4A3B2E',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.18s',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search & Sort Controls */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
            <Search size={16} color="#665A52" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', zIndex: 2 }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by inquiry #, name, email, phone, message..."
              className="admin-input"
              style={{ paddingLeft: '2.75rem !important' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: '#665A52', fontWeight: '700' }}>Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="admin-input"
              style={{ width: '150px' }}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* INQUIRY LIST */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#665A52' }}>
          <RefreshCw size={22} className="animate-spin" color="#C68A3A" style={{ marginBottom: '0.5rem' }} />
          <p style={{ fontSize: '0.85rem', margin: 0, fontWeight: '600' }}>Loading customer inquiries...</p>
        </div>
      ) : inquiries.length === 0 ? (
        <div className="admin-card" style={{ padding: '3.5rem 2rem', textAlign: 'center' }}>
          <MessageSquare size={38} color="#C68A3A" style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
          <h3 style={{ fontSize: '1.1rem', fontFamily: 'var(--font-serif)', color: '#21150F', fontWeight: '800', marginBottom: '0.3rem' }}>
            No customer inquiries found.
          </h3>
          <p style={{ fontSize: '0.84rem', color: '#665A52', margin: 0, fontWeight: '500' }}>
            {searchQuery || statusFilter !== 'all'
              ? 'No inquiries match your current search or status filter.'
              : 'Customer queries submitted via the contact form will appear here.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {inquiries.map((inquiry) => (
            <div
              key={inquiry.id || inquiry.inquiry_number}
              className="admin-card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                backgroundColor: 'rgba(255, 255, 255, 0.92)',
              }}
            >
              {/* Row Top */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
                    <span style={{ fontSize: '1rem', fontWeight: '800', color: '#21150F' }}>
                      {inquiry.inquiry_number}
                    </span>
                    <AdminStatusBadge status={inquiry.status} />
                    {inquiry.user_id ? (
                      <span style={{ fontSize: '0.68rem', backgroundColor: 'rgba(59, 130, 246, 0.12)', color: '#1D4ED8', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: '800' }}>
                        LOGGED IN CUSTOMER
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.68rem', backgroundColor: 'rgba(245, 237, 229, 0.8)', color: '#665A52', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: '800' }}>
                        GUEST
                      </span>
                    )}
                  </div>

                  <div style={{ fontSize: '0.92rem', fontWeight: '800', color: '#21150F' }}>
                    {inquiry.name}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#665A52', display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.25rem', alignItems: 'center' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><Mail size={13} color="#C68A3A" /> {inquiry.email}</span>
                    {inquiry.phone && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><Phone size={13} color="#C68A3A" /> {inquiry.phone}</span>}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ fontSize: '0.78rem', color: '#665A52', textAlign: 'right' }}>
                    <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: '700' }}>Submitted:</div>
                    <div style={{ color: '#21150F', fontWeight: '700' }}>{formatDate(inquiry.created_at)}</div>
                  </div>

                  <button
                    onClick={() => openInquiryModal(inquiry)}
                    className="admin-btn-primary"
                    style={{ padding: '0.55rem 1.25rem', fontSize: '0.82rem' }}
                  >
                    View / Manage
                  </button>
                </div>
              </div>

              {/* Message Box */}
              <div 
                style={{ 
                  backgroundColor: 'var(--admin-surface-elevated)', 
                  padding: '0.85rem 1.15rem', 
                  borderRadius: '10px', 
                  border: '1px solid rgba(231, 222, 213, 0.65)',
                }}
              >
                <div style={{ fontSize: '0.68rem', fontWeight: '800', color: '#665A52', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                  CUSTOMER MESSAGE:
                </div>
                <div style={{ fontSize: '0.86rem', color: '#21150F', fontStyle: 'italic', lineHeight: '1.4' }}>
                  "{inquiry.message}"
                </div>
              </div>

              {/* Admin Response Snippet if present */}
              {inquiry.admin_response && (
                <div style={{ backgroundColor: 'rgba(198, 138, 58, 0.08)', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid rgba(198, 138, 58, 0.25)' }}>
                  <div style={{ fontSize: '0.68rem', fontWeight: '800', color: '#C68A3A', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>
                    ADMIN RESPONSE SAVED:
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#21150F', fontWeight: '500' }}>
                    {inquiry.admin_response}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* DETAIL & MANAGEMENT MODAL */}
      {isModalOpen && selectedInquiry && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
        >
          <div
            className="admin-card"
            style={{
              width: '100%',
              maxWidth: '620px',
              maxHeight: '90vh',
              overflowY: 'auto',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '16px',
              padding: '1.75rem',
              color: '#21150F',
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid rgba(231, 222, 213, 0.7)', paddingBottom: '0.85rem' }}>
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: '800', color: '#C68A3A', textTransform: 'uppercase' }}>
                  Inquiry #{selectedInquiry.inquiry_number}
                </span>
                <h3 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-serif)', color: '#21150F', fontWeight: '800', margin: 0 }}>
                  Customer Question Details
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#665A52', cursor: 'pointer', padding: '0.2rem' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Customer Details */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem', backgroundColor: 'var(--admin-surface-elevated)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(231, 222, 213, 0.65)' }}>
              <div>
                <div style={{ fontSize: '0.7rem', color: '#665A52', fontWeight: '700', textTransform: 'uppercase' }}>Customer Name</div>
                <div style={{ fontWeight: '800', color: '#21150F', fontSize: '0.92rem' }}>{selectedInquiry.name}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: '#665A52', fontWeight: '700', textTransform: 'uppercase' }}>Submitted Date</div>
                <div style={{ fontWeight: '700', color: '#21150F', fontSize: '0.88rem' }}>{formatDate(selectedInquiry.created_at)}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: '#665A52', fontWeight: '700', textTransform: 'uppercase' }}>Email Address</div>
                <div style={{ fontWeight: '700', color: '#21150F', fontSize: '0.85rem' }}>{selectedInquiry.email}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: '#665A52', fontWeight: '700', textTransform: 'uppercase' }}>Phone Number</div>
                <div style={{ fontWeight: '700', color: '#21150F', fontSize: '0.85rem' }}>{selectedInquiry.phone || 'N/A'}</div>
              </div>
            </div>

            {/* Quick Contact Buttons */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
              <a
                href={getMailtoUrl(selectedInquiry)}
                target="_blank"
                rel="noreferrer"
                className="admin-btn-secondary"
                style={{ fontSize: '0.78rem', textDecoration: 'none' }}
              >
                <Mail size={14} color="#C68A3A" /> Reply via Email
              </a>
              {selectedInquiry.phone && (
                <a
                  href={getWhatsappUrl(selectedInquiry)}
                  target="_blank"
                  rel="noreferrer"
                  className="admin-btn-secondary"
                  style={{ fontSize: '0.78rem', textDecoration: 'none' }}
                >
                  <Send size={14} color="#C68A3A" /> WhatsApp Customer
                </a>
              )}
            </div>

            {/* Message Body */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ fontSize: '0.74rem', fontWeight: '800', color: '#4A3B2E', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase' }}>
                Customer Inquiry Message
              </label>
              <div style={{ backgroundColor: '#FFFFFF', border: '1.5px solid rgba(207, 194, 181, 0.75)', borderRadius: '10px', padding: '1rem', fontSize: '0.88rem', color: '#21150F', lineHeight: '1.5' }}>
                {selectedInquiry.message}
              </div>
            </div>

            {/* Status Selector */}
            <div style={{ marginBottom: '1.25rem', backgroundColor: 'var(--admin-surface-elevated)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(231, 222, 213, 0.65)' }}>
              <label style={{ fontSize: '0.74rem', fontWeight: '800', color: '#4A3B2E', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase' }}>
                Update Inquiry Status
              </label>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <select
                  value={modalStatus}
                  onChange={(e) => setModalStatus(e.target.value)}
                  className="admin-input"
                  style={{ flex: 1 }}
                >
                  <option value="new">New</option>
                  <option value="in_progress">In Progress</option>
                  <option value="contacted">Contacted</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
                <button
                  onClick={handleSaveStatus}
                  disabled={savingStatus}
                  className="admin-btn-primary"
                  style={{ padding: '0.55rem 1rem', fontSize: '0.8rem' }}
                >
                  {savingStatus ? 'Saving...' : 'Update Status'}
                </button>
              </div>
            </div>

            {/* Admin Response Area */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ fontSize: '0.74rem', fontWeight: '800', color: '#4A3B2E', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase' }}>
                Official Admin Response / Notes
              </label>
              <textarea
                rows={3}
                value={modalResponse}
                onChange={(e) => setModalResponse(e.target.value)}
                placeholder="Enter official resolution or response summary..."
                className="admin-input"
                style={{ width: '100%', resize: 'vertical' }}
              />
              <div style={{ textAlign: 'right', marginTop: '0.5rem' }}>
                <button
                  onClick={handleSaveResponse}
                  disabled={savingResponse}
                  className="admin-btn-primary"
                  style={{ padding: '0.5rem 1.2rem', fontSize: '0.8rem' }}
                >
                  {savingResponse ? 'Saving...' : 'Save Response'}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
