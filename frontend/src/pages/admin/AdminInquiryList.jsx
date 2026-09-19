import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, Search, Filter, Mail, Phone, Calendar, 
  ExternalLink, CheckCircle2, Clock, User, FileText, X, Save, RefreshCw
} from 'lucide-react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';

// Helper for status styling in Admin
export function AdminStatusBadge({ status }) {
  const s = String(status || 'new').toLowerCase();
  
  let bg = 'rgba(255, 255, 255, 0.08)';
  let color = '#C5CBC5';
  let border = 'rgba(255, 255, 255, 0.15)';
  let label = 'NEW';

  if (s === 'new') {
    bg = 'rgba(184, 204, 122, 0.15)';
    color = '#B8CC7A';
    border = 'rgba(184, 204, 122, 0.3)';
    label = 'NEW';
  } else if (s === 'in_progress' || s === 'in progress') {
    bg = 'rgba(245, 158, 11, 0.15)';
    color = '#F59E0B';
    border = 'rgba(245, 158, 11, 0.3)';
    label = 'IN PROGRESS';
  } else if (s === 'contacted') {
    bg = 'rgba(59, 130, 246, 0.15)';
    color = '#60A5FA';
    border = 'rgba(59, 130, 246, 0.3)';
    label = 'CONTACTED';
  } else if (s === 'resolved') {
    bg = 'rgba(34, 197, 94, 0.15)';
    color = '#4ADE80';
    border = 'rgba(34, 197, 94, 0.3)';
    label = 'RESOLVED';
  } else if (s === 'closed') {
    bg = 'rgba(156, 163, 175, 0.15)';
    color = '#9CA3AF';
    border = 'rgba(156, 163, 175, 0.3)';
    label = 'CLOSED';
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '0.2rem 0.65rem',
        borderRadius: '6px',
        fontSize: '0.7rem',
        fontWeight: '800',
        backgroundColor: bg,
        color: color,
        border: `1px solid ${border}`,
        letterSpacing: '0.05em',
      }}
    >
      {label}
    </span>
  );
}

export default function AdminInquiryList() {
  const { toast } = useToast();

  const [inquiries, setInquiries] = useState([]);
  const [summary, setSummary] = useState({
    totalQueries: 0,
    new: 0,
    in_progress: 0,
    contacted: 0,
    resolved: 0,
    closed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters & Controls
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');

  // Selected Inquiry Modal state
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [modalStatus, setModalStatus] = useState('new');
  const [modalResponse, setModalResponse] = useState('');
  const [modalNotes, setModalNotes] = useState('');
  const [savingStatus, setSavingStatus] = useState(false);
  const [savingResponse, setSavingResponse] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);

  const fetchInquiries = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const response = await api.get('/inquiries/admin/all', {
        params: {
          status: statusFilter,
          search: searchQuery,
          sort: sortOrder,
        }
      });

      if (response.data && response.data.success) {
        setInquiries(response.data.inquiries || []);
        if (response.data.summary) {
          setSummary(response.data.summary);
        }
      }
    } catch (err) {
      console.error('Fetch admin inquiries error:', err);
      toast.error('Error loading inquiries database.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, [statusFilter, searchQuery, sortOrder]);

  const openInquiryModal = (inquiry) => {
    setSelectedInquiry(inquiry);
    setModalStatus(inquiry.status || 'new');
    setModalResponse(inquiry.admin_response || '');
    setModalNotes(inquiry.admin_notes || '');
  };

  const closeInquiryModal = () => {
    setSelectedInquiry(null);
  };

  // Status update
  const handleUpdateStatus = async () => {
    if (!selectedInquiry) return;
    setSavingStatus(true);
    try {
      const targetId = selectedInquiry.id || selectedInquiry.inquiry_number;
      const res = await api.patch(`/inquiries/admin/${targetId}/status`, {
        status: modalStatus
      });

      if (res.data && res.data.success) {
        toast.success('Status updated successfully.');
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
        toast.success('Internal notes saved successfully.');
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

  // Formatting helpers for Email / WhatsApp / Call
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

  const getTelUrl = (inquiry) => {
    return `tel:${inquiry.phone}`;
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
    <div style={{ width: '100%', minWidth: 0 }}>
      {/* Header & Subtitle */}
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', color: '#F4F5F0', fontWeight: '900', margin: 0 }}>
            Customer Inquiries
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--admin-text-muted)', margin: '0.2rem 0 0 0' }}>
            View and manage customer questions and contact requests.
          </p>
        </div>

        <button
          onClick={() => fetchInquiries(true)}
          disabled={refreshing || loading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.5rem 1rem',
            backgroundColor: 'var(--admin-surface)',
            border: '1px solid var(--admin-border)',
            borderRadius: '8px',
            color: '#B8CC7A',
            fontSize: '0.8rem',
            fontWeight: '700',
            cursor: 'pointer',
          }}
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          <span>Refresh List</span>
        </button>
      </div>

      {/* SUMMARY METRICS CARDS (REQUIREMENTS #21) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ backgroundColor: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: '12px', padding: '1.25rem 1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#F4F5F0' }}>{summary.totalQueries}</div>
          <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9DA69F', fontWeight: '800', marginTop: '0.2rem' }}>Total</div>
        </div>

        <div style={{ backgroundColor: 'var(--admin-surface)', border: '1px solid rgba(184, 204, 122, 0.3)', borderRadius: '12px', padding: '1.25rem 1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#B8CC7A' }}>{summary.new}</div>
          <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#B8CC7A', fontWeight: '800', marginTop: '0.2rem' }}>New</div>
        </div>

        <div style={{ backgroundColor: 'var(--admin-surface)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '12px', padding: '1.25rem 1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#F59E0B' }}>{summary.in_progress}</div>
          <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#F59E0B', fontWeight: '800', marginTop: '0.2rem' }}>In Progress</div>
        </div>

        <div style={{ backgroundColor: 'var(--admin-surface)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '12px', padding: '1.25rem 1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#60A5FA' }}>{summary.contacted}</div>
          <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#60A5FA', fontWeight: '800', marginTop: '0.2rem' }}>Contacted</div>
        </div>

        <div style={{ backgroundColor: 'var(--admin-surface)', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: '12px', padding: '1.25rem 1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#4ADE80' }}>{summary.resolved}</div>
          <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#4ADE80', fontWeight: '800', marginTop: '0.2rem' }}>Resolved</div>
        </div>

        <div style={{ backgroundColor: 'var(--admin-surface)', border: '1px solid rgba(156, 163, 175, 0.3)', borderRadius: '12px', padding: '1.25rem 1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#9CA3AF' }}>{summary.closed}</div>
          <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9CA3AF', fontWeight: '800', marginTop: '0.2rem' }}>Closed</div>
        </div>
      </div>

      {/* FILTER TABS & SEARCH / SORT BAR (REQUIREMENTS #22, #23, #64) */}
      <div style={{ backgroundColor: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: '14px', padding: '1.25rem', marginBottom: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Status Filter Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
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
                  fontSize: '0.8rem',
                  fontWeight: '800',
                  border: isActive ? '1px solid #B8CC7A' : '1px solid transparent',
                  backgroundColor: isActive ? 'rgba(184, 204, 122, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                  color: isActive ? '#B8CC7A' : '#C5CBC5',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search & Sort Controls */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
            <Search size={16} color="#7B8E80" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by inquiry #, name, email, phone, message..."
              style={{
                width: '100%',
                height: '42px',
                paddingLeft: '2.5rem',
                paddingRight: '1rem',
                backgroundColor: '#111713',
                border: '1px solid var(--admin-border)',
                borderRadius: '8px',
                color: '#F4F5F0',
                fontSize: '0.85rem',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.78rem', color: '#9DA69F', fontWeight: '700' }}>Sort:</span>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              style={{
                height: '42px',
                padding: '0 0.85rem',
                backgroundColor: '#111713',
                border: '1px solid var(--admin-border)',
                borderRadius: '8px',
                color: '#F4F5F0',
                fontSize: '0.85rem',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* INQUIRY LIST OR EMPTY STATE (REQUIREMENTS #24, #62) */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#9DA69F' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              border: '3px solid rgba(184, 204, 122, 0.2)',
              borderTopColor: '#B8CC7A',
              borderRadius: '50%',
              margin: '0 auto 1rem',
              animation: 'spin 1s linear infinite',
            }}
          />
          <p style={{ fontSize: '0.88rem', margin: 0 }}>Loading database queries...</p>
        </div>
      ) : inquiries.length === 0 ? (
        <div
          style={{
            backgroundColor: 'var(--admin-surface)',
            border: '1px solid var(--admin-border)',
            borderRadius: '16px',
            padding: '4rem 2rem',
            textAlign: 'center',
          }}
        >
          <MessageSquare size={36} color="#7B8E80" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.1rem', color: '#F4F5F0', fontWeight: '800', marginBottom: '0.3rem' }}>
            No customer inquiries yet.
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#9DA69F', margin: 0 }}>
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
              style={{
                backgroundColor: 'var(--admin-surface)',
                border: '1px solid var(--admin-border)',
                borderRadius: '14px',
                padding: '1.25rem 1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
              }}
            >
              {/* Row Top: Number, Name, Contact, Status, Date */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
                    <span style={{ fontSize: '1.05rem', fontWeight: '900', color: '#F4F5F0', fontFamily: 'var(--font-sans)' }}>
                      {inquiry.inquiry_number}
                    </span>
                    <AdminStatusBadge status={inquiry.status} />
                    {inquiry.user_id ? (
                      <span style={{ fontSize: '0.68rem', backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#60A5FA', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: '800' }}>
                        LOGGED IN CUSTOMER
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.68rem', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: '#9DA69F', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: '800' }}>
                        GUEST
                      </span>
                    )}
                  </div>

                  <div style={{ fontSize: '0.92rem', fontWeight: '800', color: '#F4F5F0' }}>
                    {inquiry.name}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#9DA69F', display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.2rem' }}>
                    <span>✉ {inquiry.email}</span>
                    {inquiry.phone && <span>📞 {inquiry.phone}</span>}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ fontSize: '0.78rem', color: '#9DA69F', textAlign: 'right' }}>
                    <div>Submitted:</div>
                    <div style={{ color: '#F4F5F0', fontWeight: '700' }}>{formatDate(inquiry.created_at)}</div>
                  </div>

                  <button
                    onClick={() => openInquiryModal(inquiry)}
                    style={{
                      padding: '0.55rem 1.25rem',
                      backgroundColor: '#274C37',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                      fontWeight: '800',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}
                  >
                    <span>View / Manage</span>
                  </button>
                </div>
              </div>

              {/* Message Snippet */}
              <div
                style={{
                  backgroundColor: '#111713',
                  borderRadius: '8px',
                  padding: '0.85rem 1rem',
                  fontSize: '0.86rem',
                  color: '#C5CBC5',
                  lineHeight: '1.5',
                }}
              >
                <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#7B8E80', fontWeight: '800', marginBottom: '0.2rem' }}>
                  Customer Message:
                </div>
                "{inquiry.message}"
              </div>
            </div>
          ))}
        </div>
      )}

      {/* DETAILED INQUIRY MANAGEMENT MODAL (REQUIREMENTS #25, #26, #27, #28, #29, #31, #59) */}
      {selectedInquiry && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(5px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            overflowY: 'auto',
          }}
          onClick={closeInquiryModal}
        >
          <div
            style={{
              backgroundColor: '#161D18',
              border: '1px solid var(--admin-border)',
              borderRadius: '20px',
              maxWidth: '750px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '2rem',
              boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
              boxSizing: 'border-box',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--admin-border)', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                  <h3 style={{ fontSize: '1.3rem', fontFamily: 'var(--font-serif)', color: '#F4F5F0', margin: 0, fontWeight: '900' }}>
                    {selectedInquiry.inquiry_number}
                  </h3>
                  <AdminStatusBadge status={selectedInquiry.status} />
                </div>
                <div style={{ fontSize: '0.78rem', color: '#9DA69F' }}>
                  Submitted on {formatDate(selectedInquiry.created_at)}
                </div>
              </div>

              <button
                onClick={closeInquiryModal}
                style={{ background: 'none', border: 'none', color: '#9DA69F', cursor: 'pointer', padding: '0.3rem' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content Sections */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* SECTION 1: CUSTOMER INFORMATION */}
              <div style={{ backgroundColor: '#111713', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--admin-border)' }}>
                <h4 style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#B8CC7A', fontWeight: '800', margin: '0 0 0.85rem 0' }}>
                  CUSTOMER INFORMATION
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#7B8E80', fontWeight: '700' }}>Name</div>
                    <div style={{ fontSize: '0.92rem', color: '#F4F5F0', fontWeight: '800' }}>{selectedInquiry.name}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#7B8E80', fontWeight: '700' }}>Email Address</div>
                    <div style={{ fontSize: '0.92rem', color: '#F4F5F0', fontWeight: '800' }}>{selectedInquiry.email}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#7B8E80', fontWeight: '700' }}>WhatsApp / Phone</div>
                    <div style={{ fontSize: '0.92rem', color: '#F4F5F0', fontWeight: '800' }}>{selectedInquiry.phone || 'Not provided'}</div>
                  </div>
                </div>
              </div>

              {/* SECTION 2: MANUAL CONTACT OPTIONS (REQUIREMENTS #25, #26, #27, #28) */}
              <div>
                <h4 style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#B8CC7A', fontWeight: '800', margin: '0 0 0.75rem 0' }}>
                  MANUAL CONTACT OPTIONS
                </h4>
                <p style={{ fontSize: '0.78rem', color: '#9DA69F', margin: '0 0 0.85rem 0' }}>
                  Clicking these buttons opens your mail client, WhatsApp web/app, or phone dialer. MILASTY does NOT send automatic messages.
                </p>

                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  {/* Email Button */}
                  <a
                    href={getMailtoUrl(selectedInquiry)}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      padding: '0.65rem 1.15rem',
                      backgroundColor: 'rgba(59, 130, 246, 0.15)',
                      border: '1px solid rgba(59, 130, 246, 0.4)',
                      borderRadius: '8px',
                      color: '#60A5FA',
                      fontSize: '0.85rem',
                      fontWeight: '800',
                      textDecoration: 'none',
                    }}
                  >
                    <Mail size={16} />
                    <span>Email Customer</span>
                  </a>

                  {/* WhatsApp Button */}
                  {selectedInquiry.phone && (
                    <a
                      href={getWhatsappUrl(selectedInquiry)}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.45rem',
                        padding: '0.65rem 1.15rem',
                        backgroundColor: 'rgba(34, 197, 94, 0.15)',
                        border: '1px solid rgba(34, 197, 94, 0.4)',
                        borderRadius: '8px',
                        color: '#4ADE80',
                        fontSize: '0.85rem',
                        fontWeight: '800',
                        textDecoration: 'none',
                      }}
                    >
                      <MessageSquare size={16} />
                      <span>WhatsApp</span>
                    </a>
                  )}

                  {/* Call Button */}
                  {selectedInquiry.phone && (
                    <a
                      href={getTelUrl(selectedInquiry)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.45rem',
                        padding: '0.65rem 1.15rem',
                        backgroundColor: 'rgba(245, 158, 11, 0.15)',
                        border: '1px solid rgba(245, 158, 11, 0.4)',
                        borderRadius: '8px',
                        color: '#F59E0B',
                        fontSize: '0.85rem',
                        fontWeight: '800',
                        textDecoration: 'none',
                      }}
                    >
                      <Phone size={16} />
                      <span>Call Customer</span>
                    </a>
                  )}
                </div>
              </div>

              {/* SECTION 3: INQUIRY MESSAGE */}
              <div>
                <h4 style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#B8CC7A', fontWeight: '800', margin: '0 0 0.5rem 0' }}>
                  CUSTOMER MESSAGE
                </h4>
                <div
                  style={{
                    backgroundColor: '#111713',
                    border: '1px solid var(--admin-border)',
                    borderRadius: '10px',
                    padding: '1rem 1.25rem',
                    color: '#F4F5F0',
                    fontSize: '0.9rem',
                    lineHeight: '1.6',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {selectedInquiry.message}
                </div>
              </div>

              {/* SECTION 4: ADMIN STATUS CONTROL (REQUIREMENTS #11, #59) */}
              <div style={{ borderTop: '1px solid var(--admin-border)', paddingTop: '1.25rem' }}>
                <h4 style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#B8CC7A', fontWeight: '800', margin: '0 0 0.5rem 0' }}>
                  STATUS MANAGEMENT
                </h4>
                <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <select
                    value={modalStatus}
                    onChange={(e) => setModalStatus(e.target.value)}
                    style={{
                      height: '44px',
                      padding: '0 1rem',
                      backgroundColor: '#111713',
                      border: '1px solid var(--admin-border)',
                      borderRadius: '8px',
                      color: '#F4F5F0',
                      fontSize: '0.9rem',
                      fontWeight: '700',
                      outline: 'none',
                      cursor: 'pointer',
                      flex: 1,
                      minWidth: '180px',
                    }}
                  >
                    <option value="new">New</option>
                    <option value="in_progress">In Progress</option>
                    <option value="contacted">Contacted</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>

                  <button
                    onClick={handleUpdateStatus}
                    disabled={savingStatus}
                    style={{
                      height: '44px',
                      padding: '0 1.25rem',
                      backgroundColor: '#274C37',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      fontWeight: '800',
                      cursor: savingStatus ? 'not-allowed' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                    }}
                  >
                    <Save size={16} />
                    <span>{savingStatus ? 'Updating...' : 'Update Status'}</span>
                  </button>
                </div>
              </div>

              {/* SECTION 5: ADMIN RESPONSE (PUBLIC TO CUSTOMER) (REQUIREMENTS #29, #30) */}
              <div style={{ borderTop: '1px solid var(--admin-border)', paddingTop: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <h4 style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#B8CC7A', fontWeight: '800', margin: 0 }}>
                    ADMIN RESPONSE (VISIBLE TO CUSTOMER)
                  </h4>
                  <span style={{ fontSize: '0.7rem', color: '#9DA69F' }}>Customer will see this in "My Inquiries"</span>
                </div>

                <textarea
                  rows={3}
                  value={modalResponse}
                  onChange={(e) => setModalResponse(e.target.value)}
                  placeholder="Write an official response for the customer (e.g. 'Thank you for reaching out. We offer bulk custom orders...')"
                  style={{
                    width: '100%',
                    padding: '0.85rem 1rem',
                    backgroundColor: '#111713',
                    border: '1px solid var(--admin-border)',
                    borderRadius: '8px',
                    color: '#F4F5F0',
                    fontSize: '0.88rem',
                    lineHeight: '1.5',
                    outline: 'none',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                    marginBottom: '0.75rem',
                  }}
                />

                <button
                  onClick={handleSaveResponse}
                  disabled={savingResponse}
                  style={{
                    height: '40px',
                    padding: '0 1.25rem',
                    backgroundColor: '#274C37',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    fontWeight: '800',
                    cursor: savingResponse ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                  }}
                >
                  <Save size={15} />
                  <span>{savingResponse ? 'Saving...' : 'Save Admin Response'}</span>
                </button>
              </div>

              {/* SECTION 6: INTERNAL NOTES (ADMIN ONLY) (REQUIREMENTS #31) */}
              <div style={{ borderTop: '1px solid var(--admin-border)', paddingTop: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <h4 style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#F59E0B', fontWeight: '800', margin: 0 }}>
                    INTERNAL NOTES (ADMIN ONLY)
                  </h4>
                  <span style={{ fontSize: '0.7rem', color: '#9DA69F' }}>Private notes, hidden from customer</span>
                </div>

                <textarea
                  rows={2}
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                  placeholder="Add internal notes (e.g. 'Customer interested in 100 boxes for Diwali, follow up on Monday')"
                  style={{
                    width: '100%',
                    padding: '0.85rem 1rem',
                    backgroundColor: '#111713',
                    border: '1px solid var(--admin-border)',
                    borderRadius: '8px',
                    color: '#F4F5F0',
                    fontSize: '0.88rem',
                    lineHeight: '1.5',
                    outline: 'none',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                    marginBottom: '0.75rem',
                  }}
                />

                <button
                  onClick={handleSaveNotes}
                  disabled={savingNotes}
                  style={{
                    height: '40px',
                    padding: '0 1.25rem',
                    backgroundColor: 'rgba(245, 158, 11, 0.2)',
                    border: '1px solid rgba(245, 158, 11, 0.4)',
                    color: '#F59E0B',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    fontWeight: '800',
                    cursor: savingNotes ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                  }}
                >
                  <Save size={15} />
                  <span>{savingNotes ? 'Saving...' : 'Save Internal Notes'}</span>
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
