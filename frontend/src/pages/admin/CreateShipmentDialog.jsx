import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Truck, RefreshCw, AlertTriangle, CheckCircle2, Package } from 'lucide-react';
import api from '../../api/axios';

// Admin "Create Shipment": the only way a Shiprath shipment is created. Nothing is booked at checkout.
// The backend re-validates everything and locks the order, so repeated clicks can't double-book.

const MAX_WEIGHT_KG = 30;

export default function CreateShipmentDialog({ orderId, onClose, onCreated }) {
  const [preview, setPreview] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [pkg, setPkg] = useState({ weightKg: '', length: '', width: '', height: '' });
  const [calculatedPkg, setCalculatedPkg] = useState(null);
  const [step, setStep] = useState('review'); // review → confirm → done
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null); // { message, failures[] }
  const [result, setResult] = useState(null);
  const [ackForce, setAckForce] = useState(false);
  const [ackUncertain, setAckUncertain] = useState(false);

  useEffect(() => {
    let alive = true;
    api.get(`/orders/admin/${orderId}/shipment-preview`)
      .then((res) => {
        if (!alive) return;
        setPreview(res.data);
        if (res.data.package) {
          const p = { weightKg: String(res.data.package.weightKg), length: String(res.data.package.length), width: String(res.data.package.width), height: String(res.data.package.height) };
          setPkg(p);
          setCalculatedPkg(p);
        }
      })
      .catch((e) => alive && setLoadError(e.response?.data?.message || 'Could not load order details.'));
    return () => { alive = false; };
  }, [orderId]);

  const o = preview?.order;
  const nums = ['weightKg', 'length', 'width', 'height'].map((k) => Number(pkg[k]));
  const pkgError = nums.some((v) => !Number.isFinite(v) || v <= 0)
    ? 'Enter a weight and all three dimensions (greater than 0).'
    : nums[0] > MAX_WEIGHT_KG ? `Weight above ${MAX_WEIGHT_KG} kg looks wrong — check the parcel.` : null;
  const pkgEdited = calculatedPkg && ['weightKg', 'length', 'width', 'height'].some((k) => Number(pkg[k]) !== Number(calculatedPkg[k]));
  const needsForce = Boolean(preview?.inProgress);
  const needsUncertainAck = Boolean(preview?.uncertainPreviousAttempt);
  const canProceed = preview && !preview.blockedReason && !pkgError && (!needsForce || ackForce) && (!needsUncertainAck || ackUncertain);

  const submit = async () => {
    if (submitting) return; // the button is disabled too; the server lock is the real guarantee
    setSubmitting(true);
    setError(null);
    try {
      const body = {
        // Send the box only if the admin changed it (otherwise the server uses its own calculation)
        ...((pkgEdited || !calculatedPkg) ? { package: { weightKg: nums[0], length: nums[1], width: nums[2], height: nums[3] } } : {}),
        ...(needsForce ? { force: true } : {}),
        ...(needsUncertainAck ? { confirmNoExistingShipment: true } : {}),
      };
      const res = await api.post(`/orders/admin/${orderId}/book-shipment`, body);
      if (!res.data?.success) throw { response: { data: res.data } };
      setResult(res.data);
      setStep('done');
      onCreated?.(res.data);
    } catch (e) {
      const d = e.response?.data || {};
      setError({ message: d.rawError || d.message || e.message || 'Shipment creation failed.', failures: d.courierFailures || [], uncertain: d.uncertain, code: d.code });
      setStep('review');
      onCreated?.(null); // refresh the list so the failed / existing state shows
    } finally {
      setSubmitting(false);
    }
  };

  const row = (label, value) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', fontSize: '0.82rem' }}>
      <span style={{ color: '#665A52' }}>{label}</span>
      <span style={{ color: '#21150F', fontWeight: '700', textAlign: 'right', wordBreak: 'break-word' }}>{value}</span>
    </div>
  );

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100001, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={submitting ? undefined : onClose}>
      <div className="admin-card" onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '560px', maxHeight: '92vh', overflowY: 'auto', padding: '1.5rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '1rem', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span style={{ fontSize: '0.68rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#C68A3A' }}>Create Shiprath Shipment</span>
            <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-serif)', color: '#21150F', margin: '0.1rem 0 0', fontWeight: '800' }}>{o?.order_number || '…'}</h3>
          </div>
          <button onClick={onClose} disabled={submitting} aria-label="Close" style={{ background: 'none', border: 'none', color: '#665A52', cursor: 'pointer' }}><X size={20} /></button>
        </div>

        {loadError && <div style={{ color: '#C62828', fontSize: '0.85rem', fontWeight: '700' }}>{loadError}</div>}
        {!preview && !loadError && (
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', color: '#665A52', fontSize: '0.85rem' }}><RefreshCw size={16} className="animate-spin" /> Loading order…</div>
        )}

        {step === 'done' && result && (
          <div style={{ background: '#E8F5E9', border: '1px solid #A5D6A7', borderRadius: '12px', padding: '1rem', color: '#1B5E20', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: '800' }}><CheckCircle2 size={16} /> {result.alreadyBooked ? 'Shipment already existed — nothing new was created.' : 'Shipment created with Shiprath.'}</div>
            <div>AWB: <code>{result.awb || '(not returned yet — check Shiprath panel)'}</code></div>
            <div>Courier: {result.courier_name || '—'}{result.fallbackUsed ? ' (fallback — the courier quoted at checkout was rejected)' : ''}</div>
            <button onClick={onClose} className="admin-btn-secondary" style={{ alignSelf: 'flex-start', marginTop: '0.4rem' }}>Done</button>
          </div>
        )}

        {preview && step !== 'done' && (
          <>
            {preview.blockedReason && (
              <div style={{ background: '#FEECEC', border: '1px solid #EF9A9A', borderRadius: '10px', padding: '0.75rem', color: '#C62828', fontSize: '0.82rem', fontWeight: '700' }}>{preview.blockedReason}</div>
            )}

            <div style={{ border: '1px solid rgba(231,222,213,0.8)', borderRadius: '12px', padding: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              {row('Customer', `${o.customer_name || '—'} · ${o.customer_phone || '—'}`)}
              {row('Address', `${o.shipping_address || '—'}${o.pincode ? ` — ${o.pincode}` : ''}`)}
              {row('Payment', `${String(o.payment_method || '').toUpperCase()} · ${o.payment_status}`)}
              {row('Delivery charge paid', `₹${o.delivery_fee}`)}
              {row('Courier quoted at checkout', o.selected_service_name || '—')}
              {row('Shipment status', String(o.shipment_status || 'not_created').replace(/_/g, ' '))}
              <div style={{ fontSize: '0.8rem', color: '#4A3B2E', borderTop: '1px dashed #E7DED5', paddingTop: '0.45rem' }}>
                {(o.items || []).map((it, i) => <div key={i}>• {it.title}{it.variant ? ` (${it.variant})` : ''} × {it.quantity}</div>)}
              </div>
            </div>

            {!preview.blockedReason && (
              <div style={{ border: '1px solid rgba(231,222,213,0.8)', borderRadius: '12px', padding: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: '#5A2E16' }}>
                  <Package size={14} color="#C68A3A" /> Parcel {calculatedPkg ? '(calculated — edit if you packed differently)' : '(enter details)'}
                </div>
                {preview.packageError && <div style={{ fontSize: '0.78rem', color: '#B45309' }}>Automatic calculation failed: {preview.packageError}. Enter the packed parcel details.</div>}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '0.5rem' }}>
                  {[['weightKg', 'Weight (kg)'], ['length', 'Length (cm)'], ['width', 'Width (cm)'], ['height', 'Height (cm)']].map(([k, label]) => (
                    <label key={k} style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.72rem', fontWeight: '700', color: '#665A52' }}>
                      {label}
                      <input type="number" min="0" step="0.01" className="admin-input" value={pkg[k]} disabled={submitting || step === 'confirm'}
                        onChange={(e) => setPkg((p) => ({ ...p, [k]: e.target.value }))} />
                    </label>
                  ))}
                </div>
                {pkgError && <div style={{ fontSize: '0.78rem', color: '#C62828', fontWeight: '700' }}>{pkgError}</div>}
              </div>
            )}

            {needsForce && !preview.blockedReason && (
              <label style={{ display: 'flex', gap: '0.45rem', fontSize: '0.8rem', color: '#7A3E12', background: '#FFF6EE', border: '1px solid #F0C9A8', borderRadius: '10px', padding: '0.7rem', fontWeight: '700' }}>
                <input type="checkbox" checked={ackForce} onChange={(e) => setAckForce(e.target.checked)} />
                A previous creation attempt is still marked "Creating" (it may be stuck). I checked the Shiprath panel and no shipment exists for this order.
              </label>
            )}
            {needsUncertainAck && !preview.blockedReason && (
              <label style={{ display: 'flex', gap: '0.45rem', fontSize: '0.8rem', color: '#7A3E12', background: '#FFF6EE', border: '1px solid #F0C9A8', borderRadius: '10px', padding: '0.7rem', fontWeight: '700' }}>
                <input type="checkbox" checked={ackUncertain} onChange={(e) => setAckUncertain(e.target.checked)} />
                The last attempt lost Shiprath's response, so a shipment may already exist. I checked the Shiprath panel and there is NO shipment for this order.
              </label>
            )}

            {error && (
              <div style={{ background: '#FEECEC', border: '1px solid #EF9A9A', borderRadius: '10px', padding: '0.75rem', color: '#C62828', fontSize: '0.8rem' }}>
                <div style={{ display: 'flex', gap: '0.4rem', fontWeight: '800' }}><AlertTriangle size={15} style={{ flexShrink: 0 }} /> {error.message}</div>
                {error.failures.length > 0 && <ul style={{ margin: '0.4rem 0 0', paddingLeft: '1.1rem' }}>{error.failures.map((f, i) => <li key={i}>{f}</li>)}</ul>}
                {!error.uncertain && error.code !== 'ALREADY_BOOKED' && <div style={{ marginTop: '0.35rem', color: '#7A3E12' }}>The order is unchanged. Fix the issue and try again.</div>}
              </div>
            )}

            {!preview.blockedReason && (
              step === 'review' ? (
                <button onClick={() => setStep('confirm')} disabled={!canProceed}
                  style={{ padding: '0.65rem 1.1rem', borderRadius: '10px', border: 'none', background: '#381423', color: '#D4AF37', fontWeight: '800', fontSize: '0.85rem', cursor: canProceed ? 'pointer' : 'not-allowed', opacity: canProceed ? 1 : 0.55, display: 'inline-flex', alignItems: 'center', gap: '0.4rem', alignSelf: 'flex-end' }}>
                  <Truck size={15} /> {error ? 'Retry Shipment Creation' : 'Create Shipment'}
                </button>
              ) : (
                <div style={{ background: '#FFF6EE', border: '1px solid #F0C9A8', borderRadius: '12px', padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  <div style={{ fontSize: '0.84rem', fontWeight: '800', color: '#21150F' }}>
                    Create a Shiprath shipment for {o.order_number} ({nums[0]} kg, {nums[1]}×{nums[2]}×{nums[3]} cm)? This books a real courier pickup and is charged to the Shiprath wallet.
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                    <button onClick={() => setStep('review')} disabled={submitting} className="admin-btn-secondary">Back</button>
                    <button onClick={submit} disabled={submitting}
                      style={{ padding: '0.55rem 1rem', borderRadius: '8px', border: 'none', background: '#2F7D32', color: '#FFF', fontWeight: '800', fontSize: '0.82rem', cursor: submitting ? 'wait' : 'pointer', opacity: submitting ? 0.7 : 1, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                      {submitting ? <><RefreshCw size={14} className="animate-spin" /> Creating shipment…</> : 'Yes, Create Shipment'}
                    </button>
                  </div>
                </div>
              )
            )}
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
