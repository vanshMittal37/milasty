import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Calendar, ChevronRight, Clock, RefreshCw, AlertCircle, Plus } from 'lucide-react';
import api from '../api/axios';

const T = {
  bg: '#FCFAF7', surface: '#FFFFFF', surfaceAlt: '#F7F2EC',
  brand: '#5A2E16', brandLight: '#F5EDE5',
  accent: '#C58A35', accentLight: '#FEF9EC',
  border: '#E7DED5',
  textPrimary: '#171717', textSecondary: '#4A3B2E', textMuted: '#888888',
  success: '#2E7D32', successBg: '#EDF7EE',
  danger: '#C62828', dangerBg: '#FEECEC',
  warning: '#B7791F', warningBg: '#FEF9EC',
  info: '#1565C0', infoBg: '#EAF2FF',
  shadow: '0 2px 10px rgba(90, 46, 22, 0.07)',
};

export function InquiryStatusBadge({ status }) {
  const s = String(status || 'new').toLowerCase();
  const map = {
    new:         { bg: T.infoBg,    color: T.info,    label: 'New' },
    in_progress: { bg: T.warningBg, color: T.warning, label: 'In Progress' },
    'in progress': { bg: T.warningBg, color: T.warning, label: 'In Progress' },
    contacted:   { bg: '#F3E8FF',  color: '#6B21A8', label: 'Contacted' },
    resolved:    { bg: T.successBg, color: T.success, label: 'Resolved' },
    closed:      { bg: '#F3F4F6',  color: '#6B7280', label: 'Closed' },
  };
  const style = map[s] || { bg: T.infoBg, color: T.info, label: status || 'New' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
      padding: '0.25rem 0.75rem', borderRadius: '999px',
      fontSize: '0.72rem', fontWeight: '700',
      backgroundColor: style.bg, color: style.color,
      letterSpacing: '0.04em', textTransform: 'uppercase',
      whiteSpace: 'nowrap',
    }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: style.color, flexShrink: 0 }} />
      {style.label}
    </span>
  );
}

export default function CustomerInquiryList() {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchInquiries = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const response = await api.get('/inquiries/my-inquiries');
      if (response.data?.success) {
        setInquiries(response.data.inquiries || []);
      } else {
        setInquiries([]);
      }
    } catch (err) {
      console.error('Fetch customer inquiries error:', err);
      setError('Unable to load your inquiries. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchInquiries(); }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Recently';
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch (e) { return dateStr; }
  };

  const cardStyle = {
    backgroundColor: T.surface, border: `1px solid ${T.border}`,
    borderRadius: '14px', boxShadow: T.shadow,
  };

  return (
    <div style={{ width: '100%', minWidth: 0 }}>

      {/* Header Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.05rem', fontWeight: '800', color: T.textPrimary, margin: 0 }}>
            My Inquiries {!loading && `(${inquiries.length})`}
          </h2>
          <p style={{ fontSize: '0.82rem', color: T.textMuted, margin: '0.2rem 0 0 0' }}>
            View your questions and support requests.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
          <button
            onClick={() => fetchInquiries(true)}
            disabled={refreshing || loading}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.5rem 0.9rem', borderRadius: '8px',
              border: `1px solid ${T.border}`, backgroundColor: T.surface,
              color: T.textSecondary, fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer',
            }}
          >
            <RefreshCw size={13} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <Link to="/contact" style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.5rem 1rem', borderRadius: '8px',
            backgroundColor: T.brand, color: '#FFFFFF',
            fontSize: '0.8rem', fontWeight: '700', textDecoration: 'none',
          }}>
            <Plus size={14} /> New Inquiry
          </Link>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ ...cardStyle, padding: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#EDE8E1', animation: 'milastyPulse 1.5s ease-in-out infinite', flexShrink: 0 }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                <div style={{ height: '14px', width: '160px', backgroundColor: '#EDE8E1', borderRadius: '4px', animation: 'milastyPulse 1.5s ease-in-out infinite' }} />
                <div style={{ height: '12px', width: '100px', backgroundColor: '#EDE8E1', borderRadius: '4px', animation: 'milastyPulse 1.5s ease-in-out infinite' }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div style={{ ...cardStyle, padding: '2rem', textAlign: 'center', backgroundColor: T.dangerBg, border: `1px solid #EF9A9A` }}>
          <AlertCircle size={28} color={T.danger} style={{ margin: '0 auto 0.75rem' }} />
          <p style={{ color: T.danger, fontSize: '0.9rem', margin: '0 0 1rem' }}>{error}</p>
          <button onClick={() => fetchInquiries()} style={{ padding: '0.5rem 1.25rem', backgroundColor: T.brand, color: '#FFFFFF', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>
            Try Again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && inquiries.length === 0 && (
        <div style={{ ...cardStyle, padding: '4rem 2rem', textAlign: 'center' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: T.accentLight, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.15rem' }}>
            <MessageSquare size={28} color={T.accent} />
          </div>
          <h3 style={{ fontSize: '1rem', fontWeight: '800', color: T.textPrimary, margin: '0 0 0.35rem 0' }}>No Inquiries Yet</h3>
          <p style={{ fontSize: '0.85rem', color: T.textMuted, maxWidth: '340px', margin: '0 auto 1.5rem' }}>
            Have a question about your order or products? Our team is here to help.
          </p>
          <Link to="/contact" style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.65rem 1.5rem', backgroundColor: T.brand, color: '#FFFFFF',
            borderRadius: '999px', fontWeight: '700', textDecoration: 'none', fontSize: '0.85rem',
          }}>
            <MessageSquare size={15} /> Contact MILASTY Team
          </Link>
        </div>
      )}

      {/* Inquiry List */}
      {!loading && !error && inquiries.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {inquiries.map((inquiry) => {
            const inquiryId = inquiry._id || inquiry.id;
            const subject = inquiry.subject || inquiry.topic || 'General Inquiry';
            const message = inquiry.message || inquiry.details || '';
            const status = inquiry.status || 'new';
            const hasReply = inquiry.reply || inquiry.adminReply;
            const dateLabel = formatDate(inquiry.createdAt);

            return (
              <Link
                key={inquiryId}
                to={`/account/inquiries/${inquiryId}`}
                style={{ textDecoration: 'none' }}
              >
                <div style={{
                  ...cardStyle, padding: '1.25rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  gap: '1rem', flexWrap: 'wrap',
                  transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
                  cursor: 'pointer',
                }}>
                  {/* Left: Icon + Content */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: 0 }}>
                    <div style={{
                      width: '42px', height: '42px', borderRadius: '10px',
                      backgroundColor: hasReply ? T.successBg : T.accentLight,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <MessageSquare size={18} color={hasReply ? T.success : T.accent} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: '700', color: T.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {subject}
                      </div>
                      <div style={{ fontSize: '0.76rem', color: T.textMuted, marginTop: '0.15rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {message.length > 80 ? message.slice(0, 80) + '...' : message}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.3rem', fontSize: '0.72rem', color: T.textMuted }}>
                        <Calendar size={11} /> {dateLabel}
                        {hasReply && (
                          <span style={{ color: T.success, fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                            · ✓ Reply received
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Badge + Arrow */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                    <InquiryStatusBadge status={status} />
                    <ChevronRight size={16} color={T.textMuted} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
