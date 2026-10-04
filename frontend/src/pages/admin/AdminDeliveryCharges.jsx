import React, { useState, useEffect } from 'react';
import { 
  Truck, CheckCircle2, XCircle, RefreshCw, ShieldCheck, 
  Zap, Package, MapPin, CreditCard, Play, Info, AlertCircle, ArrowRight
} from 'lucide-react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';

export default function AdminShippingLogistics() {
  const { toast } = useToast();

  // Shiprath Connection State
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [testingConnection, setTestingConnection] = useState(false);

  // Admin Rate Test State
  const [testForm, setTestForm] = useState({
    pincode: '110001',
    weight: '1.0',
    length: '10',
    width: '10',
    height: '10',
  });
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [testError, setTestError] = useState('');

  // Fetch connection status on mount
  const fetchConnection = async () => {
    setTestingConnection(true);
    try {
      const res = await api.get('/shipping/connection-status');
      if (res.data) {
        setConnectionStatus(res.data);
      }
    } catch (err) {
      console.error('Connection status check error:', err);
      setConnectionStatus({
        connected: false,
        message: 'Could not reach server to test Shiprath connection.',
      });
    } finally {
      setTestingConnection(false);
    }
  };

  useEffect(() => {
    fetchConnection();
  }, []);

  // Run Shipping Test
  const handleRunShippingTest = async (e) => {
    e.preventDefault();
    setTestError('');
    setTestResult(null);

    const cleanPin = testForm.pincode.trim();
    if (!cleanPin || !/^\d{6}$/.test(cleanPin)) {
      setTestError('Please enter a valid 6-digit Indian PIN code.');
      return;
    }

    setTestLoading(true);
    try {
      const res = await api.post('/shipping/test-rate', {
        pincode: cleanPin,
        weight: Number(testForm.weight || 1),
        length: Number(testForm.length || 10),
        width: Number(testForm.width || 10),
        height: Number(testForm.height || 10),
      });

      if (res.data && res.data.success) {
        setTestResult(res.data);
        toast.success('Dynamic Shiprath rate calculated successfully!');
      } else {
        setTestError(res.data?.message || 'Rate calculation test failed.');
      }
    } catch (err) {
      console.error('Shipping test error:', err);
      setTestError(err.response?.data?.message || 'Error executing Shiprath rate test.');
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <div style={{ padding: '0 0 4rem 0', color: '#1E293B', fontFamily: 'Inter, sans-serif' }}>
      
      {/* Header Banner */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        padding: '1.75rem 2rem',
        border: '1px solid #E2E8F0',
        marginBottom: '2rem',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.4rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#381423', color: '#D4AF37', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Truck size={20} />
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0F172A', margin: 0 }}>
              Shipping &amp; Logistics
            </h1>
          </div>
          <p style={{ color: '#64748B', fontSize: '0.9rem', margin: 0 }}>
            Powered by Shiprath B2C Dynamic Courier API • Single Source of Truth for MILASTY Deliveries
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={fetchConnection}
            disabled={testingConnection}
            style={{
              padding: '0.65rem 1.25rem',
              borderRadius: '10px',
              border: '1px solid #CBD5E1',
              backgroundColor: '#F8FAFC',
              color: '#334155',
              fontSize: '0.85rem',
              fontWeight: '700',
              cursor: testingConnection ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s',
            }}
          >
            <RefreshCw size={15} className={testingConnection ? 'spin-anim' : ''} />
            <span>Refresh Status</span>
          </button>
        </div>
      </div>

      {/* Grid Layout: Top Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.75rem', marginBottom: '2rem' }}>

        {/* SECTION 1: Shiprath Connection Status */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          padding: '1.75rem',
          border: '1px solid #E2E8F0',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Zap size={18} color="#D4AF37" />
                <span>1. Shiprath Connection</span>
              </h2>

              <span style={{
                fontSize: '0.75rem',
                fontWeight: '800',
                padding: '0.35rem 0.85rem',
                borderRadius: '999px',
                backgroundColor: connectionStatus?.connected ? '#DCFCE7' : '#FEE2E2',
                color: connectionStatus?.connected ? '#15803D' : '#B91C1C',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}>
                {connectionStatus?.connected ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                <span>{connectionStatus?.connected ? 'Connected' : 'Not Connected'}</span>
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.88rem', color: '#475569' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ color: '#64748B', fontWeight: '600' }}>Warehouse</span>
                <strong style={{ color: '#0F172A' }}>MILASTY</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ color: '#64748B', fontWeight: '600' }}>Warehouse ID</span>
                <code style={{ color: '#381423', backgroundColor: '#F8FAFC', padding: '0.15rem 0.45rem', borderRadius: '4px', fontWeight: '700' }}>
                  1777118843112
                </code>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ color: '#64748B', fontWeight: '600' }}>Pickup Pincode</span>
                <strong style={{ color: '#0F172A', fontFamily: 'monospace' }}>201016</strong>
              </div>

              {connectionStatus?.message && (
                <div style={{
                  marginTop: '0.5rem',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '8px',
                  backgroundColor: connectionStatus?.connected ? '#F0FDF4' : '#FEF2F2',
                  border: connectionStatus?.connected ? '1px solid #BBF7D0' : '1px solid #FECACA',
                  color: connectionStatus?.connected ? '#166534' : '#991B1B',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  lineHeight: '1.4',
                }}>
                  {connectionStatus.message}
                </div>
              )}
            </div>
          </div>

          <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #F1F5F9', display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={fetchConnection}
              disabled={testingConnection}
              style={{
                flexGrow: 1,
                padding: '0.65rem 1rem',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#381423',
                color: '#FFFFFF',
                fontSize: '0.82rem',
                fontWeight: '700',
                cursor: testingConnection ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
              }}
            >
              <Zap size={14} color="#D4AF37" />
              <span>{testingConnection ? 'Testing Connection...' : 'Test Shiprath Connection'}</span>
            </button>
          </div>
        </div>

        {/* SECTION 2: Rate Calculation Status */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          padding: '1.75rem',
          border: '1px solid #E2E8F0',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Package size={18} color="#D4AF37" />
                <span>2. Rate Calculation</span>
              </h2>

              <span style={{
                fontSize: '0.75rem',
                fontWeight: '800',
                padding: '0.35rem 0.85rem',
                borderRadius: '999px',
                backgroundColor: '#DCFCE7',
                color: '#15803D',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}>
                <CheckCircle2 size={13} />
                <span>Status: Enabled</span>
              </span>
            </div>

            <div style={{ backgroundColor: '#F8FAFC', padding: '1rem 1.15rem', borderRadius: '12px', border: '1px solid #E2E8F0', marginBottom: '1rem' }}>
              <div style={{ fontWeight: '800', color: '#0F172A', fontSize: '0.9rem', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <ShieldCheck size={16} color="#15803D" />
                <span>Dynamic Shiprath Rates</span>
              </div>
              <p style={{ color: '#475569', fontSize: '0.85rem', lineHeight: '1.5', margin: 0 }}>
                Shipping charges are calculated dynamically using Shiprath based on destination pincode, package weight and dimensions.
              </p>
            </div>

            <div style={{ fontSize: '0.8rem', color: '#64748B', backgroundColor: '#FEF3C7', padding: '0.65rem 0.9rem', borderRadius: '8px', color: '#92400E', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Info size={14} flexShrink={0} />
              <span>Old order-value slabs (₹20, ₹40, ₹1500+ free delivery) have been deprecated completely.</span>
            </div>
          </div>
        </div>

        {/* SECTION 3 & 4: Pricing Rules & Shipment Settings */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          padding: '1.75rem',
          border: '1px solid #E2E8F0',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}>
          <div>
            <h2 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0F172A', margin: '0 0 1.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CreditCard size={18} color="#D4AF37" />
              <span>3. Customer Shipping Pricing &amp; Rules</span>
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.88rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ color: '#64748B', fontWeight: '600' }}>Pricing Mode</span>
                <span style={{ fontWeight: '800', color: '#15803D', backgroundColor: '#DCFCE7', padding: '0.15rem 0.5rem', borderRadius: '6px', fontSize: '0.78rem' }}>
                  Charge actual Shiprath rate
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ color: '#64748B', fontWeight: '600' }}>Payment Mode</span>
                <strong style={{ color: '#0F172A' }}>Prepaid Only</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ color: '#64748B', fontWeight: '600' }}>COD (Cash on Delivery)</span>
                <span style={{ fontWeight: '700', color: '#94A3B8' }}>Disabled</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ color: '#64748B', fontWeight: '600' }}>Future Markup Layer</span>
                <span style={{ color: '#64748B', fontStyle: 'italic', fontSize: '0.8rem' }}>
                  Backend ready: Cost + Markup = Payable
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* SECTION 5: Admin Shipping Rate Test */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        padding: '2rem',
        border: '1px solid #E2E8F0',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
      }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0F172A', margin: '0 0 0.35rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Play size={18} color="#D4AF37" />
            <span>5. Shipping Rate Calculation Test (Admin Only)</span>
          </h2>
          <p style={{ color: '#64748B', fontSize: '0.88rem', margin: 0 }}>
            Enter a pincode and package dimensions to calculate live dynamic courier rates via Shiprath. Does NOT create a shipment.
          </p>
        </div>

        <form onSubmit={handleRunShippingTest} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem', alignItems: 'end' }}>
          
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: '800', color: '#475569', display: 'block', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
              Destination Pincode *
            </label>
            <input
              type="text"
              required
              maxLength={6}
              value={testForm.pincode}
              onChange={(e) => setTestForm(prev => ({ ...prev, pincode: e.target.value }))}
              placeholder="e.g. 110001"
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                fontSize: '0.9rem',
                fontFamily: 'monospace',
                fontWeight: '700',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: '800', color: '#475569', display: 'block', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
              Weight (kg)
            </label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              value={testForm.weight}
              onChange={(e) => setTestForm(prev => ({ ...prev, weight: e.target.value }))}
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                fontSize: '0.9rem',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: '800', color: '#475569', display: 'block', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
              Length (cm)
            </label>
            <input
              type="number"
              min="1"
              value={testForm.length}
              onChange={(e) => setTestForm(prev => ({ ...prev, length: e.target.value }))}
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                fontSize: '0.9rem',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: '800', color: '#475569', display: 'block', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
              Width (cm)
            </label>
            <input
              type="number"
              min="1"
              value={testForm.width}
              onChange={(e) => setTestForm(prev => ({ ...prev, width: e.target.value }))}
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                fontSize: '0.9rem',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: '800', color: '#475569', display: 'block', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
              Height (cm)
            </label>
            <input
              type="number"
              min="1"
              value={testForm.height}
              onChange={(e) => setTestForm(prev => ({ ...prev, height: e.target.value }))}
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                fontSize: '0.9rem',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={testLoading}
              style={{
                width: '100%',
                padding: '0.65rem 1.25rem',
                borderRadius: '8px',
                backgroundColor: '#381423',
                color: '#FFFFFF',
                border: 'none',
                fontSize: '0.88rem',
                fontWeight: '800',
                cursor: testLoading ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                boxSizing: 'border-box',
              }}
            >
              {testLoading ? 'Calculating...' : 'Calculate Shiprath Rate'}
            </button>
          </div>

        </form>

        {testError && (
          <div style={{ backgroundColor: '#FEE2E2', border: '1px solid #EF4444', color: '#991B1B', padding: '0.85rem 1rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '600', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={16} />
            <span>{testError}</span>
          </div>
        )}

        {/* Test Result Display Card */}
        {testResult && (
          <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '12px', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.85rem' }}>
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: '800', textTransform: 'uppercase', backgroundColor: '#DCFCE7', color: '#15803D', padding: '0.2rem 0.6rem', borderRadius: '6px' }}>
                  Live API Response Success
                </span>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0F172A', margin: '0.35rem 0 0 0' }}>
                  {testResult.serviceName} ({testResult.serviceProvider})
                </h3>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'block' }}>Calculated Shipping Charge</span>
                <span style={{ fontSize: '1.4rem', fontWeight: '900', color: '#0F172A' }}>₹{testResult.totalCharges}</span>
              </div>
            </div>

            {/* Field breakdown grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', fontSize: '0.85rem' }}>
              <div style={{ backgroundColor: '#FFFFFF', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: '600' }}>Service Name</span>
                <strong style={{ color: '#0F172A' }}>{testResult.serviceName}</strong>
              </div>
              <div style={{ backgroundColor: '#FFFFFF', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: '600' }}>Service Provider</span>
                <strong style={{ color: '#0F172A' }}>{testResult.serviceProvider}</strong>
              </div>
              <div style={{ backgroundColor: '#FFFFFF', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: '600' }}>Total Charges</span>
                <strong style={{ color: '#15803D' }}>₹{testResult.totalCharges}</strong>
              </div>
              <div style={{ backgroundColor: '#FFFFFF', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: '600' }}>Carrier ID</span>
                <code style={{ color: '#381423', fontWeight: '700' }}>{testResult.carrierId || 'N/A'}</code>
              </div>
              <div style={{ backgroundColor: '#FFFFFF', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: '600' }}>Courier ID</span>
                <code style={{ color: '#381423', fontWeight: '700' }}>{testResult.courierId || 'N/A'}</code>
              </div>
              <div style={{ backgroundColor: '#FFFFFF', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: '600' }}>Product ID</span>
                <code style={{ color: '#381423', fontWeight: '700' }}>{testResult.productId || 'N/A'}</code>
              </div>
              <div style={{ backgroundColor: '#FFFFFF', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: '600' }}>Shipping Zone</span>
                <strong style={{ color: '#0F172A' }}>{testResult.zone}</strong>
              </div>
              <div style={{ backgroundColor: '#FFFFFF', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: '600' }}>COD Commission</span>
                <strong style={{ color: '#0F172A' }}>₹{testResult.codCommission || 0} (Prepaid Only)</strong>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
