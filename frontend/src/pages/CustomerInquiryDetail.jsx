import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, MessageSquare, CheckCircle2, Clock, ShieldCheck, RefreshCw, AlertCircle, Check } from 'lucide-react';
import api from '../api/axios';
import { InquiryStatusBadge } from './CustomerInquiryList';

const T = {
  bg: '#FCFAF7', surface: '#FFFFFF', surfaceAlt: '#F7F2EC',
  brand: '#5A2E16', brandLight: '#F5EDE5',
  accent: '#C58A35', accentLight: '#FEF9EC',
  border: '#E7DED5',
  textPrimary: '#171717', textSecondary: '#4A3B2E', textMuted: '#888888',
  success: '#2E7D32', successBg: '#EDF7EE',
  danger: '#C62828', dangerBg: '#FEECEC',
  shadow: '0 2px 10px rgba(90, 46, 22, 0.07)',
};

const cardStyle = {
  backgroundColor: T.surface,
  border: `1px solid ${T.border}`,
  borderRadius: '16px',
  boxShadow: T.shadow,
};

export default function CustomerInquiryDetail() {
  const { id } = useParams();
  const [inquiry, setInquiry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDetail = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/inquiries/my-inquiries/${id}`);
      if (response.data?.success) {
        setInquiry(response.data.inquiry);
      } else {
        setError('Inquiry details not found.');
      }
    } catch (err) {
      console.error('Fetch inquiry detail error:', err);
      setError('Unable to load inquiry details right now.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { if (id) fetchDetail(); }, [id]);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Recently';
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
      });
    } catch (e) { return dateStr; }
  };

  const currentStatus = String(inquiry?.status || 'new').toLowerCase();
  const stages = [
    { key: 'new', label: 'Inquiry Submitted', isCompleted: true },
    { key: 'in_progress', label: 'In Progress', isCompleted: ['in_progress', 'contacted', 'resolved', 'closed'].includes(currentStatus) },
    { key: 'contacted', label: 'Contacted', isCompleted: ['contacted', 'resolved', 'closed'].includes(currentStatus) },
    { key: 'resolved', label: 'Resolved', isCompleted: ['resolved', 'closed'].includes(currentStatus) },
    { key: 'closed', label: 'Closed', isCompleted: currentStatus === 'closed' },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <div style={{ width: '40px', height: '40px', border: `3px solid ${T.border}`, borderTopColor: T.brand, borderRadius: '50%', margin: '0 auto 1rem', animation: 'spin 1s linear infinite' }} />
        <p style={{ fontSize: '0.9rem', color: T.textMuted, margin: 0 }}>Loading inquiry details...</p>
      </div>
    );
  }

  if (error || !inquiry) {
    return (
      <div style={{ ...cardStyle, padding: '3rem 2rem', textAlign: 'center', maxWidth: '500px', margin: '2rem auto' }}>
        <AlertCircle size={32} color={T.danger} style={{ margin: '0 auto 0.75rem' }} />
        <h3 style={{ fontSize: '1.1rem', color: T.textPrimary, margin: '0 0 0.5rem 0', fontWeight: '800' }}>Inquiry Not Found</h3>
        <p style={{ color: T.textMuted, fontSize: '0.88rem', margin: '0 0 1.5rem' }}>
          {error || "We couldn't find this inquiry."}
        </p>
        <Link to="/account/inquiries" style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.45rem',
          padding: '0.6rem 1.35rem', backgroundColor: T.brand, color: '#FFFFFF',
          borderRadius: '10px', fontWeight: '700', fontSize: '0.85rem', textDecoration: 'none',
        }}>
          <ArrowLeft size={15} /> Back to My Inquiries
        </Link>
      </div>
    );
  }

  const hasAdminResponse = Boolean(inquiry.admin_response && inquiry.admin_response.trim());

  return (
    <div style={{ maxWidth: '800px', width: '100%', minWidth: 0 }}>

      {/* Top Nav */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/account/inquiries" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: T.brand, fontSize: '0.83rem', fontWeight: '700', textDecoration: 'none' }}>
          <ArrowLeft size={15} /> Back to My Inquiries
        </Link>
        <button onClick={() => fetchDetail(true)} disabled={refreshing} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: 'none', border: `1px solid ${T.border}`, borderRadius: '8px', padding: '0.4rem 0.85rem', color: T.textMuted, fontSize: '0.78rem', fontWeight: '700', cursor: 'pointer' }}>
          <RefreshCw size={13} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          Refresh
        </button>
      </div>

      {/* Header Card */}
      <div style={{ ...cardStyle, padding: '1.75rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '0.85rem' }}>
          <div>
            <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.14em', color: T.textMuted, fontWeight: '800', marginBottom: '0.2rem' }}>
              INQUIRY REFERENCE
            </div>
            <h1 style={{ fontSize: '1.3rem', color: T.textPrimary, fontWeight: '900', margin: 0 }}>
              {inquiry.inquiry_number || `#${id?.slice(-8).toUpperCase()}`}
            </h1>
          </div>
          <InquiryStatusBadge status={inquiry.status} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: T.textMuted }}>
          <Calendar size={13} color={T.accent} />
          Submitted on: {formatDate(inquiry.created_at || inquiry.createdAt)}
        </div>
      </div>

      {/* Status Timeline */}
      <div style={{ ...cardStyle, padding: '1.5rem', marginBottom: '1.25rem' }}>
        <h3 style={{ fontSize: '0.82rem', fontWeight: '800', color: T.textPrimary, margin: '0 0 1.25rem 0', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          Inquiry Progress
        </h3>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {stages.map((stage, i) => (
            <React.Fragment key={stage.key}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', minWidth: '80px' }}>
                <div style={{
                  width: '30px', height: '30px', borderRadius: '50%',
                  backgroundColor: stage.isCompleted ? T.brand : T.surfaceAlt,
                  border: `2px solid ${stage.isCompleted ? T.brand : T.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  {stage.isCompleted
                    ? <Check size={13} color="#FFFFFF" strokeWidth={3} />
                    : <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: T.border }} />
                  }
                </div>
                <span style={{ fontSize: '0.62rem', textAlign: 'center', color: stage.isCompleted ? T.brand : T.textMuted, fontWeight: stage.isCompleted ? '700' : '500', lineHeight: '1.2' }}>
                  {stage.label}
                </span>
              </div>
              {i < stages.length - 1 && (
                <div style={{ flex: 1, height: '2px', backgroundColor: stages[i + 1].isCompleted ? T.brand : T.border, minWidth: '12px', marginBottom: '1.2rem', transition: 'background-color 0.3s ease' }} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Subject + Message */}
      <div style={{ ...cardStyle, padding: '1.5rem', marginBottom: '1.25rem' }}>
        <h3 style={{ fontSize: '0.82rem', fontWeight: '800', color: T.textPrimary, margin: '0 0 1rem 0', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          Your Inquiry
        </h3>
        {inquiry.subject && (
          <div style={{ marginBottom: '0.75rem' }}>
            <div style={{ fontSize: '0.68rem', color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '700', marginBottom: '0.25rem' }}>Subject</div>
            <div style={{ fontSize: '0.95rem', fontWeight: '700', color: T.textPrimary }}>{inquiry.subject}</div>
          </div>
        )}
        {inquiry.product && (
          <div style={{ marginBottom: '0.75rem' }}>
            <div style={{ fontSize: '0.68rem', color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '700', marginBottom: '0.25rem' }}>Product</div>
            <div style={{ fontSize: '0.88rem', fontWeight: '600', color: T.textSecondary }}>{inquiry.product}</div>
          </div>
        )}
        <div>
          <div style={{ fontSize: '0.68rem', color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '700', marginBottom: '0.35rem' }}>Message</div>
          <div style={{ fontSize: '0.9rem', color: T.textSecondary, lineHeight: '1.7', padding: '1rem', backgroundColor: T.surfaceAlt, borderRadius: '10px', border: `1px solid ${T.border}` }}>
            {inquiry.message || inquiry.details || '—'}
          </div>
        </div>
      </div>

      {/* Admin Response */}
      {hasAdminResponse ? (
        <div style={{ ...cardStyle, padding: '1.5rem', marginBottom: '1.25rem', backgroundColor: T.successBg, border: `1px solid #A5D6A7` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: T.surface }}>
              <CheckCircle2 size={16} color={T.success} />
            </div>
            <h3 style={{ fontSize: '0.85rem', fontWeight: '800', color: T.success, margin: 0 }}>MILASTY Team Response</h3>
          </div>
          <div style={{ fontSize: '0.9rem', color: T.textSecondary, lineHeight: '1.7', padding: '1rem', backgroundColor: T.surface, borderRadius: '10px', border: `1px solid #A5D6A7` }}>
            {inquiry.admin_response}
          </div>
          {inquiry.responded_at && (
            <div style={{ fontSize: '0.75rem', color: T.success, marginTop: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Clock size={11} /> Replied on {formatDate(inquiry.responded_at)}
            </div>
          )}
        </div>
      ) : (
        <div style={{ ...cardStyle, padding: '1.35rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '10px', borderRadius: '10px', backgroundColor: T.accentLight, flexShrink: 0 }}>
            <Clock size={18} color={T.accent} />
          </div>
          <div>
            <div style={{ fontSize: '0.88rem', fontWeight: '700', color: T.textPrimary }}>Response Pending</div>
            <div style={{ fontSize: '0.78rem', color: T.textMuted, marginTop: '0.15rem' }}>
              Our team typically responds within 1–2 business days.
            </div>
          </div>
        </div>
      )}

      {/* Customer Details */}
      <div style={{ ...cardStyle, padding: '1.5rem' }}>
        <h3 style={{ fontSize: '0.82rem', fontWeight: '800', color: T.textPrimary, margin: '0 0 1rem 0', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          Contact Details
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
          {[
            { label: 'Full Name', value: inquiry.name || inquiry.full_name },
            { label: 'Email', value: inquiry.email },
            { label: 'Phone', value: inquiry.phone || '—' },
          ].map((field) => field.value && (
            <div key={field.label} style={{ padding: '0.85rem', backgroundColor: T.surfaceAlt, borderRadius: '10px', border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: '0.66rem', color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '700', marginBottom: '0.2rem' }}>{field.label}</div>
              <div style={{ fontSize: '0.88rem', fontWeight: '600', color: T.textPrimary }}>{field.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
