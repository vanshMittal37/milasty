import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Calendar, ChevronRight, Clock, RefreshCw, AlertCircle } from 'lucide-react';
import api from '../api/axios';

// Helper component for customer status badges matching MILASTY design system
export function InquiryStatusBadge({ status }) {
  const s = String(status || 'new').toLowerCase();
  
  let bg = 'rgba(185, 205, 148, 0.15)';
  let color = '#b9cd94';
  let border = 'rgba(185, 205, 148, 0.3)';
  let label = 'New';
  let dotColor = '#b9cd94';

  if (s === 'in_progress' || s === 'in progress') {
    bg = 'rgba(245, 158, 11, 0.15)';
    color = '#F59E0B';
    border = 'rgba(245, 158, 11, 0.3)';
    label = 'In Progress';
    dotColor = '#F59E0B';
  } else if (s === 'contacted') {
    bg = 'rgba(59, 130, 246, 0.15)';
    color = '#60A5FA';
    border = 'rgba(59, 130, 246, 0.3)';
    label = 'Contacted';
    dotColor = '#60A5FA';
  } else if (s === 'resolved') {
    bg = 'rgba(34, 197, 94, 0.15)';
    color = '#4ADE80';
    border = 'rgba(34, 197, 94, 0.3)';
    label = 'Resolved';
    dotColor = '#4ADE80';
  } else if (s === 'closed') {
    bg = 'rgba(156, 163, 175, 0.15)';
    color = '#9CA3AF';
    border = 'rgba(156, 163, 175, 0.3)';
    label = 'Closed';
    dotColor = '#9CA3AF';
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.4rem',
        padding: '0.25rem 0.75rem',
        borderRadius: '999px',
        fontSize: '0.75rem',
        fontWeight: '800',
        backgroundColor: bg,
        color: color,
        border: `1px solid ${border}`,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
      }}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: dotColor,
        }}
      />
      {label}
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
      if (response.data && response.data.success) {
        setInquiries(response.data.inquiries || []);
      } else {
        setInquiries([]);
      }
    } catch (err) {
      console.error('Fetch customer inquiries error:', err);
      setError('Unable to load your inquiries right now. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Recently';
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div style={{ width: '100%', minWidth: 0 }}>
      {/* Header & Refresh Action Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.75rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.4rem', color: '#F0F4F1', fontWeight: '800', margin: 0, fontFamily: 'var(--font-sans)' }}>
            My Inquiries ({inquiries.length})
          </h2>
          <p style={{ fontSize: '0.82rem', color: '#9EB0A2', margin: '0.25rem 0 0 0' }}>
            View your questions and track your inquiries with MILASTY.
          </p>
        </div>

        <button
          onClick={() => fetchInquiries(true)}
          disabled={refreshing || loading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.45rem 0.9rem',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            color: '#85B870',
            fontSize: '0.8rem',
            fontWeight: '700',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh Status'}</span>
        </button>
      </div>

      {/* Loading State */}
      {loading ? (
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
          <p style={{ fontSize: '0.9rem', margin: 0 }}>Loading your inquiries...</p>
        </div>
      ) : error ? (
        <div
          style={{
            padding: '1.5rem',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '12px',
            color: '#FCA5A5',
            fontSize: '0.9rem',
            textAlign: 'center',
          }}
        >
          <AlertCircle size={24} style={{ margin: '0 auto 0.5rem' }} />
          <p style={{ margin: 0 }}>{error}</p>
          <button
            onClick={() => fetchInquiries()}
            style={{
              marginTop: '1rem',
              padding: '0.4rem 1rem',
              backgroundColor: '#274C37',
              color: '#FFF',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '700',
            }}
          >
            Try Again
          </button>
        </div>
      ) : inquiries.length === 0 ? (
        /* Empty State */
        <div
          style={{
            backgroundColor: '#0D120E',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '4rem 2rem',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'rgba(39, 76, 55, 0.4)',
              color: '#85B870',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
              border: '1px solid rgba(133, 184, 112, 0.3)',
            }}
          >
            <MessageSquare size={26} />
          </div>
          <h3 style={{ fontSize: '1.15rem', color: '#F0F4F1', fontWeight: '800', marginBottom: '0.4rem' }}>
            No inquiries yet.
          </h3>
          <p style={{ fontSize: '0.88rem', color: '#9EB0A2', maxWidth: '400px', margin: '0 auto 1.75rem' }}>
            Have a question? Contact the MILASTY team.
          </p>
          <Link
            to="/contact"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 1.5rem',
              backgroundColor: '#274C37',
              color: '#FFFFFF',
              borderRadius: '8px',
              fontWeight: '800',
              fontSize: '0.88rem',
              textDecoration: 'none',
              boxShadow: '0 4px 14px rgba(39, 76, 55, 0.3)',
            }}
          >
            <MessageSquare size={16} />
            <span>Contact Us</span>
          </Link>
        </div>
      ) : (
        /* Inquiry Cards Grid */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))', gap: '1.25rem' }}>
          {inquiries.map((inquiry) => {
            const hasResponse = Boolean(inquiry.admin_response && inquiry.admin_response.trim());

            return (
              <div
                key={inquiry.id || inquiry.inquiry_number}
                style={{
                  backgroundColor: '#0D120E',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'all 0.2s ease',
                  boxSizing: 'border-box',
                }}
              >
                <div>
                  {/* Top Card Bar: Number & Status Badge */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div style={{ fontSize: '1.05rem', fontWeight: '900', color: '#F0F4F1', fontFamily: 'var(--font-sans)', letterSpacing: '0.02em' }}>
                      {inquiry.inquiry_number || 'INQ-1000'}
                    </div>
                    <InquiryStatusBadge status={inquiry.status} />
                  </div>

                  {/* Submission Date */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: '#7B8E80', marginBottom: '1rem', fontWeight: '600' }}>
                    <Calendar size={14} color="#7B8E80" />
                    <span>Submitted: {formatDate(inquiry.created_at)}</span>
                  </div>

                  {/* Message Preview */}
                  <div style={{ marginBottom: '1.25rem' }}>
                    <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#85B870', fontWeight: '800', marginBottom: '0.35rem' }}>
                      Your Message
                    </div>
                    <p
                      style={{
                        fontSize: '0.88rem',
                        color: '#D1D7D2',
                        lineHeight: '1.5',
                        margin: 0,
                        fontWeight: '500',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      "{inquiry.message}"
                    </p>
                  </div>

                  {/* Response indicator tag */}
                  {hasResponse && (
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        padding: '0.25rem 0.6rem',
                        backgroundColor: 'rgba(39, 76, 55, 0.35)',
                        border: '1px solid rgba(133, 184, 112, 0.3)',
                        borderRadius: '6px',
                        color: '#85B870',
                        fontSize: '0.74rem',
                        fontWeight: '700',
                        marginBottom: '1.25rem',
                      }}
                    >
                      <span>Response received from MILASTY</span>
                    </div>
                  )}
                </div>

                {/* Card Action Button */}
                <Link
                  to={`/account/inquiries/${inquiry.id || inquiry.inquiry_number}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.45rem',
                    width: '100%',
                    padding: '0.6rem 1rem',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#F0F4F1',
                    fontSize: '0.82rem',
                    fontWeight: '800',
                    textDecoration: 'none',
                    transition: 'all 0.2s ease',
                    boxSizing: 'border-box',
                  }}
                >
                  <span>View Details</span>
                  <ChevronRight size={15} color="#85B870" />
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
