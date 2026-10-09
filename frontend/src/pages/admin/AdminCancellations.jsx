import React, { useEffect, useState, useCallback } from 'react';
import { RefreshCw, Search, X, AlertTriangle, CheckCircle2, Truck, ReceiptIndianRupee, History, ExternalLink } from 'lucide-react';
import api from '../../api/axios';

// Admin: Cancellations & Refunds. Refunds are made manually in the Razorpay Dashboard and recorded here.

const FILTERS = [
  ['all', 'All cancellations'],
  ['full', 'Full refunds — 100%'],
  ['partial', 'Partial refunds — 50%'],
  ['review', 'Pending admin review'],
  ['pending_refund', 'Pending refund'],
  ['refund_successful', 'Refund successful'],
  ['refund_failed', 'Refund failed'],
  ['shipment_failed', 'Shipment cancellation failed'],
];

const REFUND_LABELS = {
  pending: ['Pending', 'admin-badge-warning'],
  processing: ['Processing', 'admin-badge-info'],
  successful: ['Successful', 'admin-badge-success'],
  failed: ['Failed', 'admin-badge-danger'],
  needs_review: ['Needs review', 'admin-badge-danger'],
  not_applicable: ['No refund due', 'admin-badge-neutral'],
};

const SHIPMENT_LABELS = {
  not_required: ['Not booked', 'admin-badge-neutral'],
  pending: ['Cancel pending', 'admin-badge-warning'],
  in_progress: ['Cancelling…', 'admin-badge-info'],
  cancelled: ['Cancelled ✓', 'admin-badge-success'],
  failed: ['Cancel failed', 'admin-badge-danger'],
  manual_required: ['Manual / RTO needed', 'admin-badge-danger'],
  manually_resolved: ['Resolved manually', 'admin-badge-success'],
};

const REFUND_ACTIONS = {
  pending: [['processing', 'Mark Processing'], ['failed', 'Mark Failed']],
  processing: [['pending', 'Back to Pending'], ['failed', 'Mark Failed']],
  failed: [['processing', 'Retry → Processing'], ['pending', 'Back to Pending']],
  needs_review: [['processing', 'Mark Processing'], ['failed', 'Mark Failed']],
};
const CAN_MARK_REFUNDED = ['pending', 'processing', 'failed', 'needs_review'];

const inr = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const dt = (v) => (v ? new Date(v).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—');
const elapsed = (s) => {
  const n = Number(s || 0);
  const h = Math.floor(n / 3600); const m = Math.floor((n % 3600) / 60); const sec = n % 60;
  return `${h}h ${String(m).padStart(2, '0')}m ${String(sec).padStart(2, '0')}s`;
};
const Badge = ({ map, value }) => {
  const [label, cls] = map[value] || [value || '—', 'admin-badge-neutral'];
  return <span className={`admin-badge ${cls}`} style={{ fontSize: '0.72rem', whiteSpace: 'nowrap' }}>{label}</span>;
};

export default function AdminCancellations() {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [detail, setDetail] = useState(null); // { cancellation, items, events }
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/cancellations', { params: { filter, search: search.trim() || undefined } });
      setRows(res.data?.cancellations || []);
    } catch (e) {
      setError(e.response?.data?.message || 'Could not load cancellations. Has migration 19 been run?');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [filter, search]);

  useEffect(() => {
    const t = setTimeout(fetchRows, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [fetchRows, search]);

  const openDetail = async (id) => {
    setDetailLoading(true);
    try {
      const res = await api.get(`/admin/cancellations/${id}`);
      setDetail(res.data);
      window.dispatchEvent(new Event('milasty:cancellations-changed')); // refresh sidebar badge / bell
    } catch (e) {
      alert(e.response?.data?.message || 'Could not load cancellation details.');
    } finally {
      setDetailLoading(false);
    }
  };

  const refreshAfterAction = async (id) => {
    await Promise.all([openDetail(id), fetchRows()]);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <p style={{ fontSize: '0.68rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.07em', color: '#665A52', margin: '0 0 0.2rem 0' }}>
            Sales & Fulfillment
          </p>
          <h2 style={{ fontSize: 'clamp(1.15rem, 2.5vw, 1.45rem)', fontFamily: 'var(--font-serif)', color: '#21150F', fontWeight: '800', margin: 0, lineHeight: '1.25' }}>
            Cancellations &amp; Refunds
          </h2>
          <p style={{ color: '#4A3B2E', fontSize: '0.8rem', margin: '0.2rem 0 0 0', fontWeight: '500' }}>
            Refund in the Razorpay Dashboard, then record the Razorpay refund ID here. Shipment cancellation is tracked separately.
          </p>
        </div>
        <button onClick={fetchRows} className="admin-btn-secondary">
          <RefreshCw size={14} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
        {FILTERS.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            style={{
              padding: '0.4rem 0.8rem', borderRadius: '999px', fontSize: '0.76rem', fontWeight: '700', cursor: 'pointer',
              border: `1px solid ${filter === key ? '#5A2E16' : '#E7DED5'}`,
              background: filter === key ? 'linear-gradient(135deg, #5A2E16, #7C3D20)' : '#FFFFFF',
              color: filter === key ? '#FFFFFF' : '#4A3B2E',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div style={{ position: 'relative', maxWidth: '420px' }}>
        <Search size={16} color="#665A52" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search order #, customer name, email, phone, payment ID…"
          className="admin-input admin-search-input"
          style={{ paddingLeft: '2.75rem' }}
        />
      </div>

      {/* Table */}
      <div className="admin-table-container" style={{ overflowX: 'auto' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem', gap: '0.75rem', color: '#665A52', fontSize: '0.82rem', fontWeight: '600' }}>
            <RefreshCw size={18} className="animate-spin" color="#C68A3A" /> Loading cancellations…
          </div>
        ) : error ? (
          <div style={{ padding: '2rem', color: '#C62828', fontSize: '0.85rem', fontWeight: '600' }}>{error}</div>
        ) : rows.length === 0 ? (
          <div className="admin-empty-state" style={{ padding: '2.5rem', textAlign: 'center', color: '#665A52', fontSize: '0.85rem' }}>
            No cancellations match this view.
          </div>
        ) : (
          <table className="admin-table" style={{ minWidth: '1250px' }}>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Contact</th>
                <th>Ordered / Cancelled</th>
                <th>Order Amount</th>
                <th>Reason</th>
                <th>Elapsed</th>
                <th>Refund %</th>
                <th>Refund Amount</th>
                <th>Razorpay Payment ID</th>
                <th>Shipment</th>
                <th>Refund Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} style={!c.admin_seen_at ? { backgroundColor: 'rgba(198, 138, 58, 0.08)' } : undefined}>
                  <td style={{ fontWeight: '800', whiteSpace: 'nowrap' }}>
                    {c.order_number || c.orders?.order_number}
                    {!c.admin_seen_at && <span className="admin-badge admin-badge-warning" style={{ marginLeft: '0.35rem', fontSize: '0.62rem' }}>NEW</span>}
                  </td>
                  <td>{c.orders?.customer_name || '—'}</td>
                  <td style={{ fontSize: '0.76rem' }}>
                    <div>{c.orders?.customer_email || '—'}</div>
                    <div style={{ color: '#665A52' }}>{c.orders?.customer_phone || ''}</div>
                  </td>
                  <td style={{ fontSize: '0.76rem', whiteSpace: 'nowrap' }}>
                    <div>{dt(c.order_created_at)}</div>
                    <div style={{ color: '#C62828' }}>{dt(c.requested_at)}</div>
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {inr(c.orders?.grand_total)}
                    <div style={{ fontSize: '0.7rem', color: '#665A52' }}>{String(c.payment_method || '').toLowerCase() === 'razorpay' ? 'Prepaid' : 'COD'}</div>
                  </td>
                  <td style={{ fontSize: '0.78rem', maxWidth: '180px' }}>{c.reason}</td>
                  <td style={{ whiteSpace: 'nowrap', fontSize: '0.78rem' }}>{elapsed(c.elapsed_seconds)}</td>
                  <td style={{ fontWeight: '800' }}>{c.refund_percentage}%</td>
                  <td style={{ fontWeight: '800', color: '#2F7D32', whiteSpace: 'nowrap' }}>{inr(c.refund_amount)}</td>
                  <td style={{ fontSize: '0.74rem' }}><code>{c.razorpay_payment_id || '—'}</code></td>
                  <td><Badge map={SHIPMENT_LABELS} value={c.shipment_cancel_status} /></td>
                  <td><Badge map={REFUND_LABELS} value={c.refund_status} /></td>
                  <td>
                    <button className="admin-btn-secondary" style={{ padding: '0.35rem 0.7rem', fontSize: '0.76rem' }} onClick={() => openDetail(c.id)} disabled={detailLoading}>
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {detail && (
        <DetailPanel
          data={detail}
          onClose={() => setDetail(null)}
          onChanged={() => refreshAfterAction(detail.cancellation.id)}
        />
      )}
    </div>
  );
}

function Section({ icon: Icon, title, children, tone }) {
  return (
    <div style={{ border: `1px solid ${tone === 'warn' ? '#F0C9A8' : 'rgba(231, 222, 213, 0.8)'}`, background: tone === 'warn' ? '#FFF6EE' : 'rgba(252, 250, 247, 0.7)', borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#5A2E16' }}>
        {Icon && <Icon size={14} color="#C68A3A" />} {title}
      </div>
      {children}
    </div>
  );
}

const Row = ({ label, children }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', fontSize: '0.82rem' }}>
    <span style={{ color: '#665A52' }}>{label}</span>
    <span style={{ color: '#21150F', fontWeight: '700', textAlign: 'right', wordBreak: 'break-word' }}>{children}</span>
  </div>
);

function DetailPanel({ data, onClose, onChanged }) {
  const c = data.cancellation;
  const o = c.orders || {};
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null); // { type: 'ok' | 'err', text }
  const [refundId, setRefundId] = useState('');
  const [refundNotes, setRefundNotes] = useState('');
  const [needsManual, setNeedsManual] = useState(null); // message when Razorpay verification is unavailable
  const [manualAck, setManualAck] = useState(false);
  const [resolveNotes, setResolveNotes] = useState('');

  const run = async (fn, okText) => {
    if (busy) return;
    setBusy(true);
    setMsg(null);
    try {
      await fn();
      setMsg({ type: 'ok', text: okText });
      await onChanged();
    } catch (e) {
      const body = e.response?.data;
      if (body?.code === 'VERIFICATION_UNAVAILABLE') {
        setNeedsManual(body.message);
      } else {
        setMsg({ type: 'err', text: body?.message || e.message });
      }
    } finally {
      setBusy(false);
    }
  };

  const changeRefundStatus = (status) => {
    let notes = '';
    if (status === 'failed') {
      notes = window.prompt('Why did the refund fail? (required — saved to the audit log)') || '';
      if (!notes.trim()) return;
    }
    run(() => api.post(`/admin/cancellations/${c.id}/refund-status`, { status, notes }), `Refund status set to ${status}.`);
  };

  const markRefunded = (manualConfirm = false) => run(
    () => api.post(`/admin/cancellations/${c.id}/mark-refunded`, { refundId: refundId.trim(), notes: refundNotes, manualConfirm }),
    manualConfirm ? 'Refund recorded as manually confirmed by admin.' : 'Refund verified with Razorpay and recorded.',
  );

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', zIndex: 99999, display: 'flex', justifyContent: 'flex-end' }} onClick={onClose}>
      <div
        className="admin-card"
        onClick={(e) => e.stopPropagation()}
        style={{ width: '100%', maxWidth: '620px', height: '100%', overflowY: 'auto', padding: '1.5rem', borderRadius: 0, display: 'flex', flexDirection: 'column', gap: '1rem', boxSizing: 'border-box' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span style={{ fontSize: '0.68rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#C68A3A' }}>Cancellation</span>
            <h3 style={{ fontSize: '1.3rem', fontFamily: 'var(--font-serif)', color: '#21150F', margin: '0.1rem 0 0', fontWeight: '800' }}>{c.order_number || o.order_number}</h3>
          </div>
          <button onClick={onClose} aria-label="Close" style={{ background: 'none', border: 'none', color: '#665A52', cursor: 'pointer' }}><X size={20} /></button>
        </div>

        {msg && (
          <div style={{ padding: '0.65rem 0.85rem', borderRadius: '10px', fontSize: '0.8rem', fontWeight: '700', background: msg.type === 'ok' ? '#E8F5E9' : '#FEECEC', color: msg.type === 'ok' ? '#2F7D32' : '#C62828' }}>
            {msg.text}
          </div>
        )}

        {/* Refund */}
        <Section icon={ReceiptIndianRupee} title="Refund" tone={['pending', 'failed', 'needs_review'].includes(c.refund_status) ? 'warn' : undefined}>
          <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#2F7D32', fontFamily: 'var(--font-serif)' }}>
            {inr(c.refund_amount)} <span style={{ fontSize: '0.85rem', color: '#665A52', fontWeight: '700' }}>to refund ({c.refund_percentage}%)</span>
          </div>
          <Row label="Amount paid">{inr(c.amount_paid)}</Row>
          <Row label="Non-refundable">{inr(c.non_refundable)}</Row>
          <Row label="Razorpay payment ID"><code>{c.razorpay_payment_id || 'none (COD / unpaid)'}</code></Row>
          <Row label="Status"><Badge map={REFUND_LABELS} value={c.refund_status} /></Row>
          {c.refund_status === 'successful' && (
            <>
              <Row label="Refund ID"><code>{c.refund_reference}</code></Row>
              <Row label="Verified via">{c.refund_verified_via === 'razorpay_api' ? 'Razorpay API ✓' : 'Manually confirmed by admin'}</Row>
              <Row label="Processed by">{c.refund_processed_by_email || '—'} · {dt(c.refund_processed_at)}</Row>
            </>
          )}
          {c.refund_notes && <Row label="Notes">{c.refund_notes}</Row>}

          {REFUND_ACTIONS[c.refund_status] && (
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {REFUND_ACTIONS[c.refund_status].map(([status, label]) => (
                <button key={status} className="admin-btn-secondary" style={{ padding: '0.35rem 0.7rem', fontSize: '0.76rem' }} disabled={busy} onClick={() => changeRefundStatus(status)}>
                  {label}
                </button>
              ))}
            </div>
          )}

          {CAN_MARK_REFUNDED.includes(c.refund_status) && (
            <div style={{ borderTop: '1px dashed #E7DED5', paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ fontSize: '0.78rem', color: '#4A3B2E' }}>
                1. In the Razorpay Dashboard, refund <strong>{inr(c.refund_amount)}</strong> on payment <code>{c.razorpay_payment_id || '—'}</code>.<br />
                2. When Razorpay shows it as <em>processed</em>, paste the refund ID (<code>rfnd_…</code>) below.
              </div>
              <input className="admin-input" placeholder="Razorpay refund ID, e.g. rfnd_ABC123…" value={refundId} onChange={(e) => { setRefundId(e.target.value); setNeedsManual(null); setManualAck(false); }} />
              <textarea className="admin-input" rows={2} placeholder="Notes (optional)" value={refundNotes} onChange={(e) => setRefundNotes(e.target.value)} style={{ fontFamily: 'inherit' }} />
              {!needsManual ? (
                <button
                  onClick={() => markRefunded(false)}
                  disabled={busy || !/^rfnd_[A-Za-z0-9]{6,}$/.test(refundId.trim())}
                  style={{ padding: '0.55rem 1rem', borderRadius: '8px', border: 'none', background: '#2F7D32', color: '#FFF', fontWeight: '800', fontSize: '0.82rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', alignSelf: 'flex-start', opacity: busy ? 0.6 : 1 }}
                >
                  <CheckCircle2 size={14} /> {busy ? 'Verifying with Razorpay…' : 'Verify & Mark Refund Successful'}
                </button>
              ) : (
                <div style={{ padding: '0.75rem', borderRadius: '10px', background: '#FFF6EE', border: '1px solid #F0C9A8', fontSize: '0.78rem', color: '#7A3E12', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', gap: '0.4rem' }}><AlertTriangle size={14} /> {needsManual}</div>
                  <label style={{ display: 'flex', gap: '0.4rem', alignItems: 'flex-start', fontWeight: '700' }}>
                    <input type="checkbox" checked={manualAck} onChange={(e) => setManualAck(e.target.checked)} />
                    I checked the Razorpay Dashboard: refund {refundId.trim()} is processed for exactly {inr(c.refund_amount)}.
                  </label>
                  <button
                    onClick={() => markRefunded(true)}
                    disabled={busy || !manualAck}
                    style={{ padding: '0.5rem 0.9rem', borderRadius: '8px', border: 'none', background: '#C68A3A', color: '#FFF', fontWeight: '800', fontSize: '0.8rem', cursor: manualAck ? 'pointer' : 'not-allowed', alignSelf: 'flex-start', opacity: manualAck ? 1 : 0.6 }}
                  >
                    Confirm Manually (recorded as admin-confirmed)
                  </button>
                </div>
              )}
            </div>
          )}
        </Section>

        {/* Shipment */}
        <Section icon={Truck} title="Shipment cancellation" tone={['failed', 'manual_required', 'pending'].includes(c.shipment_cancel_status) ? 'warn' : undefined}>
          <Row label="Status"><Badge map={SHIPMENT_LABELS} value={c.shipment_cancel_status} /></Row>
          <Row label="Shipment status at cancellation">{c.shipment_status_at_request || '—'}</Row>
          <Row label="AWB">{o.awb_number || c.awb_at_request || '—'}{o.courier_name ? ` (${o.courier_name})` : ''}</Row>
          <Row label="Attempts">{c.shipment_cancel_attempts}{c.shipment_cancel_last_attempt_at ? ` · last ${dt(c.shipment_cancel_last_attempt_at)}` : ''}</Row>
          {c.shipment_cancel_error && (
            <div style={{ fontSize: '0.78rem', color: '#C62828', fontWeight: '700', display: 'flex', gap: '0.35rem' }}>
              <AlertTriangle size={14} style={{ flexShrink: 0 }} /> {c.shipment_cancel_error}
            </div>
          )}
          {c.shipment_cancel_status === 'manual_required' && (
            <div style={{ fontSize: '0.78rem', color: '#7A3E12' }}>
              The parcel is already with the courier. Raise a return-to-origin (RTO) with Shiprath, then record it below.
              {' '}<a href="https://shiprath.com/" target="_blank" rel="noopener noreferrer" style={{ color: '#5A2E16', fontWeight: '700' }}>shiprath.com <ExternalLink size={11} /></a>
            </div>
          )}
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {['pending', 'failed'].includes(c.shipment_cancel_status) && (
              <button className="admin-btn-secondary" style={{ padding: '0.35rem 0.7rem', fontSize: '0.76rem' }} disabled={busy}
                onClick={() => run(async () => {
                  const res = await api.post(`/admin/cancellations/${c.id}/retry-shipment-cancel`);
                  if (!res.data?.ok) throw new Error(res.data?.message || 'Shiprath did not confirm the cancellation.');
                }, 'Shiprath confirmed the shipment cancellation.')}>
                <RefreshCw size={13} /> Retry Shiprath Cancellation
              </button>
            )}
          </div>
          {['pending', 'failed', 'manual_required'].includes(c.shipment_cancel_status) && (
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              <input className="admin-input" style={{ flex: 1, minWidth: '200px' }} placeholder="How it was resolved (e.g. RTO ref, parcel never picked)" value={resolveNotes} onChange={(e) => setResolveNotes(e.target.value)} />
              <button className="admin-btn-secondary" style={{ padding: '0.35rem 0.7rem', fontSize: '0.76rem' }} disabled={busy || resolveNotes.trim().length < 5}
                onClick={() => run(() => api.post(`/admin/cancellations/${c.id}/resolve-shipment`, { notes: resolveNotes }), 'Shipment marked as resolved manually.')}>
                Mark Resolved Manually
              </button>
            </div>
          )}
        </Section>

        {/* Order & cancellation */}
        <Section title="Order & cancellation">
          <Row label="Customer">{o.customer_name || '—'}</Row>
          <Row label="Email / Mobile">{o.customer_email || '—'} · {o.customer_phone || '—'}</Row>
          <Row label="Ordered">{dt(c.order_created_at)}</Row>
          <Row label="Cancelled">{dt(c.requested_at)} by {c.requested_by_role}</Row>
          <Row label="Time elapsed">{elapsed(c.elapsed_seconds)}</Row>
          <Row label="Reason">{c.reason}</Row>
          <Row label="Payment">{String(o.payment_method || '').toUpperCase()} · {o.payment_status}</Row>
          <Row label="Subtotal / Discount / Delivery">{inr(o.subtotal)} / −{inr(o.discount_amount)} / {inr(o.delivery_fee)}</Row>
          <Row label="Grand total">{inr(o.grand_total)}</Row>
          {(data.items || []).length > 0 && (
            <div style={{ fontSize: '0.8rem', color: '#4A3B2E' }}>
              {data.items.map((it) => (
                <div key={it.id}>• {it.product_title || it.title} {it.variant_name ? `(${it.variant_name})` : ''} × {it.quantity}</div>
              ))}
            </div>
          )}
        </Section>

        {/* Audit log */}
        <Section icon={History} title="History">
          {(data.events || []).length === 0 ? <div style={{ fontSize: '0.8rem', color: '#665A52' }}>No events.</div> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {data.events.map((ev) => (
                <div key={ev.id} style={{ fontSize: '0.78rem', borderLeft: '2px solid #C68A3A', paddingLeft: '0.6rem' }}>
                  <div style={{ fontWeight: '800', color: '#21150F' }}>
                    {ev.event_type.replace(/_/g, ' ')}{ev.from_status || ev.to_status ? `: ${ev.from_status || '—'} → ${ev.to_status || '—'}` : ''}
                  </div>
                  <div style={{ color: '#665A52' }}>{dt(ev.created_at)} · {ev.actor_email || ev.actor_role || 'system'}</div>
                  {ev.details?.notes && <div style={{ color: '#4A3B2E' }}>{ev.details.notes}</div>}
                  {ev.details?.refund_id && <div style={{ color: '#4A3B2E' }}>Refund {ev.details.refund_id} · {ev.details.verified_via}</div>}
                  {ev.details?.response?.message && <div style={{ color: '#4A3B2E' }}>Shiprath: {ev.details.response.message}</div>}
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}
