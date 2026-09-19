import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, MessageSquare, CheckCircle2, Clock, ShieldCheck, RefreshCw, AlertCircle } from 'lucide-react';
import api from '../api/axios';
import { InquiryStatusBadge } from './CustomerInquiryList';

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
      const response = await api.get(`/api/inquiries/my-inquiries/${id}`);
      if (response.data && response.data.success) {
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

  useEffect(() => {
    if (id) {
      fetchDetail();
    }
  }, [id]);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Recently';
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return dateStr;
    }
  };

  // Determine timeline step checkmarks based on database status
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
      <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#9EB0A2' }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            border: '3px solid rgba(133, 184, 112, 0.2)',
            borderTopColor: '#85B870',
            borderRadius: '50%',
            margin: '0 auto 1rem',
            animation: 'spin 1s linear infinite',
          }}
        />
        <p style={{ fontSize: '0.9rem', margin: 0 }}>Loading inquiry details...</p>
      </div>
    );
  }

  if (error || !inquiry) {
    return (
      <div
        style={{
          padding: '2rem',
          backgroundColor: '#0D120E',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          textAlign: 'center',
          maxWidth: '500px',
          margin: '2rem auto',
        }}
      >
        <AlertCircle size={32} color="#FCA5A5" style={{ margin: '0 auto 0.75rem' }} />
        <h3 style={{ fontSize: '1.1rem', color: '#F0F4F1', marginBottom: '0.5rem' }}>Inquiry Not Found</h3>
        <p style={{ color: '#9EB0A2', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
          {error || "The inquiry you requested could not be found or you don't have permission to view it."}
        </p>
        <Link
          to="/account/inquiries"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.55rem 1.25rem',
            backgroundColor: '#274C37',
            color: '#FFFFFF',
            borderRadius: '8px',
            fontWeight: '800',
            fontSize: '0.85rem',
            textDecoration: 'none',
          }}
        >
          <ArrowLeft size={16} />
          <span>Back to My Inquiries</span>
        </Link>
      </div>
    );
  }

  const hasAdminResponse = Boolean(inquiry.admin_response && inquiry.admin_response.trim());

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto', width: '100%', minWidth: 0 }}>
      {/* Top Navigation */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link
          to="/account/inquiries"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            color: '#85B870',
            fontSize: '0.85rem',
            fontWeight: '700',
            textDecoration: 'none',
          }}
        >
          <ArrowLeft size={16} />
          <span>Back to My Inquiries</span>
        </Link>

        <button
          onClick={() => fetchDetail(true)}
          disabled={refreshing}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            background: 'none',
            border: 'none',
            color: '#9EB0A2',
            fontSize: '0.8rem',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Main Detail Header Card */}
      <div
        style={{
          backgroundColor: '#0D120E',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '20px',
          padding: '2rem',
          marginBottom: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#85B870', fontWeight: '800', marginBottom: '0.25rem' }}>
              Inquiry Reference
            </div>
            <h1 style={{ fontSize: '1.6rem', color: '#F0F4F1', fontWeight: '900', margin: 0, fontFamily: 'var(--font-sans)', letterSpacing: '0.02em' }}>
              {inquiry.inquiry_number}
            </h1>
          </div>
          <div>
            <InquiryStatusBadge status={inquiry.status} />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: '#9EB0A2', fontWeight: '600' }}>
          <Calendar size={15} color="#85B870" />
          <span>Submitted on: {formatDate(inquiry.created_at)}</span>
        </div>
      </div>

      {/* Status Timeline Card */}
      <div
        style={{
          backgroundColor: '#0D120E',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '20px',
          padding: '1.75rem 2rem',
          marginBottom: '1.5rem',
        }}
      >
        <h3 style={{ fontSize: '0.88rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#85B870', fontWeight: '800', marginBottom: '1.5rem', margin: '0 0 1.5rem 0' }}>
          Inquiry Status Timeline
        </h3>

        <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', flexWrap: 'wrap', gap: '1rem' }}>
          {stages.map((stage, idx) => (
            <div
              key={stage.key}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                flex: 1,
                minWidth: '100px',
                textAlign: 'center',
                position: 'relative',
                zIndex: 1,
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: stage.isCompleted ? '#274C37' : 'rgba(255,255,255,0.05)',
                  border: stage.isCompleted ? '2px solid #85B870' : '1px solid rgba(255,255,255,0.15)',
                  color: stage.isCompleted ? '#FFFFFF' : '#7B8E80',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '800',
                  fontSize: '0.8rem',
                  marginBottom: '0.5rem',
                }}
              >
                {stage.isCompleted ? <CheckCircle2 size={18} color="#85B870" /> : <Clock size={16} color="#7B8E80" />}
              </div>
              <span style={{ fontSize: '0.78rem', fontWeight: stage.isCompleted ? '800' : '600', color: stage.isCompleted ? '#F0F4F1' : '#7B8E80' }}>
                {stage.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Your Message Section */}
      <div
        style={{
          backgroundColor: '#0D120E',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '20px',
          padding: '2rem',
          marginBottom: '1.5rem',
        }}
      >
        <h3 style={{ fontSize: '0.88rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#85B870', fontWeight: '800', margin: '0 0 1rem 0' }}>
          Your Message
        </h3>
        <div
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '12px',
            padding: '1.25rem 1.5rem',
            color: '#F0F4F1',
            fontSize: '0.94rem',
            lineHeight: '1.65',
            whiteSpace: 'pre-wrap',
            fontWeight: '500',
          }}
        >
          {inquiry.message}
        </div>
      </div>

      {/* MILASTY Response Area (REQUIREMENTS #17 & #18) */}
      <div
        style={{
          backgroundColor: '#0D120E',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '20px',
          padding: '2rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <ShieldCheck size={20} color="#85B870" />
          <h3 style={{ fontSize: '0.92rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#85B870', fontWeight: '800', margin: 0 }}>
            {hasAdminResponse ? 'MILASTY Response' : 'MILASTY Support'}
          </h3>
        </div>

        {hasAdminResponse ? (
          <div
            style={{
              backgroundColor: 'rgba(39, 76, 55, 0.25)',
              border: '1px solid rgba(133, 184, 112, 0.4)',
              borderRadius: '14px',
              padding: '1.25rem 1.5rem',
              color: '#F0F4F1',
              fontSize: '0.94rem',
              lineHeight: '1.65',
              whiteSpace: 'pre-wrap',
              fontWeight: '500',
            }}
          >
            {inquiry.admin_response}
          </div>
        ) : (
          <div
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              border: '1px border-dashed rgba(255, 255, 255, 0.1)',
              borderRadius: '14px',
              padding: '1.25rem 1.5rem',
              color: '#9EB0A2',
              fontSize: '0.92rem',
              lineHeight: '1.6',
            }}
          >
            Thank you for your inquiry. Our team will contact you shortly by email or WhatsApp.
          </div>
        )}
      </div>
    </div>
  );
}
