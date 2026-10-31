import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare, RefreshCw, QrCode, Smartphone, Send, ShieldCheck,
  AlertTriangle, CheckCircle2, Clock, XCircle, LogOut, ArrowRight,
  HelpCircle, Search, Filter, PhoneCall, ExternalLink, Zap
} from 'lucide-react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import ConfirmationModal from '../../components/ConfirmationModal';

export default function AdminWhatsApp() {
  const { toast } = useToast();

  // Status & Connection State
  const [statusData, setStatusData] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // QR Code State
  const [qrData, setQrData] = useState(null);
  const [loadingQr, setLoadingQr] = useState(false);

  // Controls State
  const [actionLoading, setActionLoading] = useState(false);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [clearAuthOnDisconnect, setClearAuthOnDisconnect] = useState(false);

  // Test Message State
  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('Hello from MILASTY! This is a test notification from your WhatsApp automation system. 🌾');
  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // Statistics State
  const [stats, setStats] = useState({
    total: 0,
    sent: 0,
    pending: 0,
    failed: 0,
    successRate: '100%',
  });

  // History State
  const [history, setHistory] = useState([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Fetch WhatsApp Status & Stats
  const fetchStatusAndStats = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const [statusRes, statsRes] = await Promise.all([
        api.get('/admin/whatsapp/status'),
        api.get('/admin/whatsapp/stats'),
      ]);

      if (statusRes.data?.success) {
        setStatusData(statusRes.data);
      }

      if (statsRes.data?.success && statsRes.data.stats) {
        setStats(statsRes.data.stats);
      }
    } catch (err) {
      console.error('[ADMIN WHATSAPP] Fetch error:', err);
    } finally {
      setLoadingStatus(false);
      if (isManual) setRefreshing(false);
    }
  };

  // 2. Fetch QR Code when needed
  const fetchQrCode = async () => {
    setLoadingQr(true);
    try {
      const res = await api.get('/admin/whatsapp/qr');
      if (res.data?.success) {
        setQrData(res.data);
      }
    } catch (err) {
      console.error('[ADMIN WHATSAPP] QR fetch error:', err);
    } finally {
      setLoadingQr(false);
    }
  };

  // 3. Fetch Notification History
  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await api.get('/admin/whatsapp/history', {
        params: { status: statusFilter, limit: 50 },
      });
      if (res.data?.success) {
        setHistory(res.data.notifications || []);
        setHistoryTotal(res.data.total || 0);
      }
    } catch (err) {
      console.error('[ADMIN WHATSAPP] History fetch error:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Auto-polling connection status every 4 seconds
  useEffect(() => {
    fetchStatusAndStats();
    fetchHistory();

    const interval = setInterval(() => {
      fetchStatusAndStats();
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  // Refetch history when filter changes
  useEffect(() => {
    fetchHistory();
  }, [statusFilter]);

  // If status is qr_ready, fetch QR code immediately
  useEffect(() => {
    if (statusData?.status === 'qr_ready') {
      fetchQrCode();
    }
  }, [statusData?.status]);

  // Action: Manual Reconnect
  const handleReconnect = async () => {
    setActionLoading(true);
    try {
      const res = await api.post('/admin/whatsapp/reconnect');
      toast.success(res.data?.message || 'Reconnecting to WhatsApp...');
      await fetchStatusAndStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reconnect WhatsApp.');
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Disconnect
  const handleConfirmDisconnect = async () => {
    setActionLoading(true);
    setShowDisconnectModal(false);
    try {
      const res = await api.post('/admin/whatsapp/disconnect', {
        clearAuth: clearAuthOnDisconnect,
      });
      toast.info(res.data?.message || 'WhatsApp disconnected.');
      await fetchStatusAndStats();
      if (clearAuthOnDisconnect) {
        fetchQrCode();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to disconnect WhatsApp.');
    } finally {
      setActionLoading(false);
      setClearAuthOnDisconnect(false);
    }
  };

  // Action: Send Live Test Message
  const handleSendTest = async (e) => {
    if (e) e.preventDefault();
    const cleanPhone = testPhone.replace(/\D/g, '').slice(-10);
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      toast.error('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    if (!testMessage.trim()) {
      toast.error('Please enter a message to send.');
      return;
    }

    setSendingTest(true);
    setTestResult(null);

    try {
      const res = await api.post('/admin/whatsapp/test-message', {
        phone: cleanPhone,
        message: testMessage.trim(),
      });

      if (res.data?.success) {
        toast.success(res.data.message || 'Test message delivered successfully!');
        setTestResult({ success: true, message: res.data.message, messageId: res.data.messageId });
        fetchStatusAndStats();
        fetchHistory();
      } else {
        setTestResult({ success: false, message: res.data?.message || 'Delivery failed.' });
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Error delivering test message.';
      toast.error(msg);
      setTestResult({ success: false, message: msg });
    } finally {
      setSendingTest(false);
    }
  };

  // Filtered History
  const displayedHistory = history.filter((item) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const phone = String(item.recipient_phone || '').toLowerCase();
    const ref = String(item.reference_id || '').toLowerCase();
    const event = String(item.event_type || '').toLowerCase();
    return phone.includes(term) || ref.includes(term) || event.includes(term);
  });

  const isConnected = statusData?.isConnected;
  const statusType = statusData?.status || 'disconnected';

  return (
    <div style={{ padding: '0 0 4rem 0', color: '#2B1710', fontFamily: 'Inter, sans-serif' }}>

      {/* ─── Top Header Card ──────────────────────────────────────────────────────── */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '18px',
          padding: '1.75rem 2rem',
          border: '1.5px solid #E8DCCB',
          marginBottom: '2rem',
          boxShadow: '0 4px 20px rgba(43, 23, 16, 0.04)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.25rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '16px',
              backgroundColor: isConnected ? '#E7F4E8' : '#FDF0ED',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isConnected ? '#1F5A28' : '#D9534F',
              boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.05)',
            }}
          >
            <MessageSquare size={26} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <h1 style={{ fontSize: '1.45rem', fontWeight: '800', color: '#2B1710', margin: 0 }}>
                WhatsApp Automation Manager
              </h1>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  padding: '3px 10px',
                  borderRadius: '999px',
                  backgroundColor: isConnected ? '#CDE5CB' : statusType === 'qr_ready' ? '#FEF3C7' : '#FEE2E2',
                  color: isConnected ? '#1F5A28' : statusType === 'qr_ready' ? '#92400E' : '#991B1B',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: isConnected ? '#1F5A28' : statusType === 'qr_ready' ? '#D97706' : '#DC2626',
                  }}
                />
                {isConnected ? 'ONLINE / CONNECTED' : statusType === 'qr_ready' ? 'SCAN QR CODE' : 'OFFLINE'}
              </span>
            </div>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#5A4438' }}>
              Baileys singleton engine delivering real-time Customer Signup OTPs, Password Recovery, and Automated Order Updates.
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={() => fetchStatusAndStats(true)}
            disabled={refreshing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              backgroundColor: '#FAF7F2',
              color: '#2B1710',
              border: '1.5px solid #D8CCB8',
              borderRadius: '12px',
              padding: '0.65rem 1.15rem',
              fontSize: '0.85rem',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <RefreshCw size={15} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            <span>Refresh</span>
          </button>

          {isConnected ? (
            <button
              type="button"
              onClick={() => {
                setClearAuthOnDisconnect(false);
                setShowDisconnectModal(true);
              }}
              disabled={actionLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                backgroundColor: '#FDF0ED',
                color: '#DC2626',
                border: '1.5px solid #FCA5A5',
                borderRadius: '12px',
                padding: '0.65rem 1.15rem',
                fontSize: '0.85rem',
                fontWeight: '700',
                cursor: 'pointer',
              }}
            >
              <LogOut size={15} />
              <span>Disconnect</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleReconnect}
              disabled={actionLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                backgroundColor: '#1F5A28',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '12px',
                padding: '0.65rem 1.25rem',
                fontSize: '0.85rem',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(31, 90, 40, 0.2)',
              }}
            >
              <Zap size={15} />
              <span>Reconnect Now</span>
            </button>
          )}
        </div>
      </div>

      {/* ─── Metric KPI Cards ──────────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2rem',
        }}
      >
        <div style={metricCardStyle}>
          <div style={{ fontSize: '0.78rem', color: '#5A4438', fontWeight: '700', textTransform: 'uppercase' }}>
            Total Notifications
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#2B1710', marginTop: '0.35rem' }}>
            {stats.total.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#8C7A6F', marginTop: '0.2rem' }}>All-time message dispatches</div>
        </div>

        <div style={metricCardStyle}>
          <div style={{ fontSize: '0.78rem', color: '#1F5A28', fontWeight: '700', textTransform: 'uppercase' }}>
            Successfully Delivered
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#1F5A28', marginTop: '0.35rem' }}>
            {stats.sent.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#8C7A6F', marginTop: '0.2rem' }}>Confirmed recipient delivery</div>
        </div>

        <div style={metricCardStyle}>
          <div style={{ fontSize: '0.78rem', color: '#D97706', fontWeight: '700', textTransform: 'uppercase' }}>
            Pending in Queue
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#D97706', marginTop: '0.35rem' }}>
            {stats.pending.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#8C7A6F', marginTop: '0.2rem' }}>Queued or awaiting dispatch</div>
        </div>

        <div style={metricCardStyle}>
          <div style={{ fontSize: '0.78rem', color: '#DC2626', fontWeight: '700', textTransform: 'uppercase' }}>
            Failed Attempts
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#DC2626', marginTop: '0.35rem' }}>
            {stats.failed.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#8C7A6F', marginTop: '0.2rem' }}>Exceeded max retries (3)</div>
        </div>

        <div style={metricCardStyle}>
          <div style={{ fontSize: '0.78rem', color: '#1F5A28', fontWeight: '700', textTransform: 'uppercase' }}>
            Success Rate
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#1F5A28', marginTop: '0.35rem' }}>
            {stats.successRate}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#8C7A6F', marginTop: '0.2rem' }}>Delivery reliability score</div>
        </div>
      </div>

      {/* ─── Two-Column Operations Layout ─────────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem',
        }}
      >
        {/* Box A: WhatsApp Connection & QR Code */}
        <div style={panelCardStyle}>
          <div style={panelHeaderStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Smartphone size={20} color="#1F5A28" />
              <h2 style={panelTitleStyle}>Device Connection & Pairing</h2>
            </div>
            {isConnected && (
              <span style={{ fontSize: '0.75rem', color: '#1F5A28', fontWeight: '700' }}>Active Session</span>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            {isConnected ? (
              // Connected View
              <div
                style={{
                  backgroundColor: '#F7F3EB',
                  borderRadius: '14px',
                  padding: '1.25rem',
                  border: '1.5px solid #CDE5CB',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      backgroundColor: '#CDE5CB',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#1F5A28',
                    }}
                  >
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: '#5A4438', fontWeight: '600' }}>
                      Linked Business Account
                    </div>
                    <div style={{ fontSize: '1.15rem', fontWeight: '800', color: '#2B1710' }}>
                      {statusData.connectedPhone ? `+${statusData.connectedPhone}` : 'Authenticated Device'}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '0.75rem',
                    marginTop: '1.15rem',
                    paddingTop: '0.85rem',
                    borderTop: '1px solid #D8CCB8',
                    fontSize: '0.8rem',
                  }}
                >
                  <div>
                    <span style={{ color: '#8C7A6F' }}>Last Connected:</span>
                    <div style={{ fontWeight: '700', color: '#2B1710', marginTop: '2px' }}>
                      {statusData.lastConnectedAt
                        ? new Date(statusData.lastConnectedAt).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })
                        : 'Active now'}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: '#8C7A6F' }}>Auto Reconnects:</span>
                    <div style={{ fontWeight: '700', color: '#2B1710', marginTop: '2px' }}>
                      {statusData.reconnectAttempts || 0} attempts
                    </div>
                  </div>
                </div>

                {/* Option to Link a Different Number */}
                <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setClearAuthOnDisconnect(true);
                      setShowDisconnectModal(true);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#B91C1C',
                      fontSize: '0.82rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}
                  >
                    <span>Connect a Different WhatsApp Number</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            ) : statusType === 'qr_ready' && qrData?.qrDataUrl ? (
              // QR Code Ready to Scan
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '1rem',
                  backgroundColor: '#FDFBF7',
                  borderRadius: '14px',
                  border: '1.5px dashed #1F5A28',
                }}
              >
                <div style={{ fontSize: '0.9rem', fontWeight: '800', color: '#2B1710', marginBottom: '0.5rem' }}>
                  Scan to Link WhatsApp Account
                </div>
                <div
                  style={{
                    padding: '12px',
                    backgroundColor: '#FFFFFF',
                    borderRadius: '12px',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                  }}
                >
                  <img
                    src={qrData.qrDataUrl}
                    alt="WhatsApp Pairing QR Code"
                    style={{ width: '220px', height: '220px', display: 'block' }}
                  />
                </div>
                <div
                  style={{
                    fontSize: '0.78rem',
                    color: '#5A4438',
                    textAlign: 'center',
                    marginTop: '0.85rem',
                    lineHeight: '1.45',
                  }}
                >
                  1. Open WhatsApp on your phone.<br />
                  2. Tap <strong>Linked Devices</strong> &gt; <strong>Link a Device</strong>.<br />
                  3. Point your camera at this QR code.
                </div>
                <button
                  type="button"
                  onClick={fetchQrCode}
                  disabled={loadingQr}
                  style={{
                    marginTop: '0.75rem',
                    background: 'none',
                    border: 'none',
                    color: '#1F5A28',
                    fontSize: '0.78rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                  }}
                >
                  <RefreshCw size={13} style={{ animation: loadingQr ? 'spin 1s linear infinite' : 'none' }} />
                  <span>Refresh QR Code</span>
                </button>
              </div>
            ) : (
              // Disconnected / Initializing View
              <div
                style={{
                  padding: '1.5rem',
                  backgroundColor: '#FAF7F2',
                  borderRadius: '14px',
                  border: '1.5px solid #E8DCCB',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    backgroundColor: '#FDF0ED',
                    color: '#DC2626',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 0.85rem',
                  }}
                >
                  <AlertTriangle size={22} />
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: '800', color: '#2B1710' }}>
                  WhatsApp Service is Disconnected
                </div>
                <p style={{ fontSize: '0.82rem', color: '#5A4438', margin: '0.35rem 0 1.25rem' }}>
                  Automatic customer order notifications and OTP messages are currently queued in safe offline mode.
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={handleReconnect}
                    disabled={actionLoading}
                    style={{
                      padding: '0.65rem 1.25rem',
                      backgroundColor: '#1F5A28',
                      color: '#FFFFFF',
                      borderRadius: '10px',
                      border: 'none',
                      fontSize: '0.85rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                    }}
                  >
                    <Zap size={14} />
                    <span>Initialize Connection</span>
                  </button>
                  <button
                    type="button"
                    onClick={fetchQrCode}
                    disabled={loadingQr}
                    style={{
                      padding: '0.65rem 1.1rem',
                      backgroundColor: '#FFFFFF',
                      color: '#2B1710',
                      borderRadius: '10px',
                      border: '1.5px solid #D8CCB8',
                      fontSize: '0.85rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                    }}
                  >
                    <QrCode size={14} />
                    <span>Generate QR</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Box B: Send Live Test Message */}
        <div style={panelCardStyle}>
          <div style={panelHeaderStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Send size={20} color="#1F5A28" />
              <h2 style={panelTitleStyle}>Send Live WhatsApp Test</h2>
            </div>
            <span style={{ fontSize: '0.75rem', color: '#8C7A6F', fontWeight: '600' }}>Rate Limited</span>
          </div>

          <form onSubmit={handleSendTest} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>RECIPIENT MOBILE NUMBER *</label>
              <div style={{ position: 'relative' }}>
                <span
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '0.85rem',
                    fontWeight: '700',
                    color: '#8C7A6F',
                  }}
                >
                  +91
                </span>
                <input
                  type="text"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="9876543210"
                  required
                  style={{
                    ...inputStyle,
                    paddingLeft: '44px',
                  }}
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>TEST MESSAGE BODY *</label>
              <textarea
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                rows={3}
                required
                style={{
                  ...inputStyle,
                  resize: 'vertical',
                  fontFamily: 'inherit',
                  lineHeight: '1.4',
                }}
              />
            </div>

            {testResult && (
              <div
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '10px',
                  backgroundColor: testResult.success ? '#E7F4E8' : '#FDF0ED',
                  border: `1.5px solid ${testResult.success ? '#CDE5CB' : '#FCA5A5'}`,
                  fontSize: '0.82rem',
                  color: testResult.success ? '#1F5A28' : '#DC2626',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                {testResult.success ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                <span>{testResult.message}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={sendingTest || !isConnected}
              style={{
                backgroundColor: isConnected ? '#1F5A28' : '#A0A0A0',
                color: '#FFFFFF',
                borderRadius: '12px',
                border: 'none',
                padding: '0.75rem 1.25rem',
                fontSize: '0.88rem',
                fontWeight: '700',
                cursor: isConnected ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                boxShadow: isConnected ? '0 4px 12px rgba(31, 90, 40, 0.2)' : 'none',
                marginTop: '0.25rem',
              }}
            >
              <Send size={15} />
              <span>{sendingTest ? 'Sending via WhatsApp...' : 'Dispatch Test Message'}</span>
            </button>
          </form>
        </div>
      </div>

      {/* ─── Notification History Table ────────────────────────────────────────── */}
      <div style={panelCardStyle}>
        <div style={panelHeaderStyle}>
          <div>
            <h2 style={panelTitleStyle}>Notification Delivery Log</h2>
            <div style={{ fontSize: '0.8rem', color: '#5A4438', marginTop: '0.2rem' }}>
              Real-time audit log of OTPs, Order Confirmations, Shipments, and Refund WhatsApp messages
            </div>
          </div>

          {/* Filter Pills & Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <Search
                size={14}
                style={{
                  position: 'absolute',
                  left: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#8C7A6F',
                }}
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search phone or order..."
                style={{
                  ...inputStyle,
                  padding: '0.4rem 0.75rem 0.4rem 30px',
                  fontSize: '0.82rem',
                  width: '180px',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.35rem', backgroundColor: '#FAF7F2', padding: '3px', borderRadius: '10px', border: '1px solid #D8CCB8' }}>
              {['all', 'sent', 'pending', 'failed'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  style={{
                    background: statusFilter === st ? '#1F5A28' : 'none',
                    color: statusFilter === st ? '#FFFFFF' : '#5A4438',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '4px 10px',
                    fontSize: '0.76rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                  }}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table View */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#FAF7F2', borderBottom: '1.5px solid #E8DCCB' }}>
                <th style={thStyle}>RECIPIENT</th>
                <th style={thStyle}>EVENT TYPE</th>
                <th style={thStyle}>REFERENCE</th>
                <th style={thStyle}>STATUS</th>
                <th style={thStyle}>ATTEMPTS</th>
                <th style={thStyle}>SENT TIMESTAMP</th>
              </tr>
            </thead>
            <tbody>
              {loadingHistory ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: '#8C7A6F' }}>
                    <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 0.5rem' }} />
                    <div>Loading notification delivery records...</div>
                  </td>
                </tr>
              ) : displayedHistory.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: '#8C7A6F' }}>
                    <MessageSquare size={28} style={{ opacity: 0.35, margin: '0 auto 0.5rem' }} />
                    <div style={{ fontWeight: '700' }}>No notifications found</div>
                    <div style={{ fontSize: '0.75rem', marginTop: '0.2rem' }}>
                      Notification events will appear here once triggered.
                    </div>
                  </td>
                </tr>
              ) : (
                displayedHistory.map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #F3EDE2', transition: 'background-color 0.15s' }}>
                    {/* Recipient */}
                    <td style={tdStyle}>
                      <div style={{ fontWeight: '700', color: '#2B1710' }}>
                        +91 {item.masked_phone || item.recipient_phone}
                      </div>
                    </td>

                    {/* Event Type */}
                    <td style={tdStyle}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '0.72rem',
                          fontWeight: '800',
                          backgroundColor: '#F3EDE2',
                          color: '#2B1710',
                          textTransform: 'uppercase',
                          letterSpacing: '0.03em',
                        }}
                      >
                        {String(item.event_type || 'notification').replace(/_/g, ' ')}
                      </span>
                    </td>

                    {/* Reference ID */}
                    <td style={tdStyle}>
                      <div style={{ fontWeight: '600', color: '#5A4438' }}>
                        {item.reference_id || '—'}
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td style={tdStyle}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '3px 8px',
                          borderRadius: '999px',
                          fontSize: '0.72rem',
                          fontWeight: '700',
                          backgroundColor:
                            item.status === 'sent'
                              ? '#CDE5CB'
                              : item.status === 'failed'
                              ? '#FEE2E2'
                              : '#FEF3C7',
                          color:
                            item.status === 'sent'
                              ? '#1F5A28'
                              : item.status === 'failed'
                              ? '#991B1B'
                              : '#92400E',
                        }}
                      >
                        {item.status === 'sent' ? (
                          <CheckCircle2 size={12} />
                        ) : item.status === 'failed' ? (
                          <XCircle size={12} />
                        ) : (
                          <Clock size={12} />
                        )}
                        <span style={{ textTransform: 'capitalize' }}>{item.status || 'pending'}</span>
                      </span>
                    </td>

                    {/* Attempts */}
                    <td style={tdStyle}>
                      <span style={{ color: item.attempts > 1 ? '#DC2626' : '#5A4438', fontWeight: '600' }}>
                        {item.attempts || 1} / 3
                      </span>
                    </td>

                    {/* Sent Timestamp */}
                    <td style={tdStyle}>
                      <div style={{ fontSize: '0.75rem', color: '#5A4438' }}>
                        {item.sent_at
                          ? new Date(item.sent_at).toLocaleString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : item.created_at
                          ? new Date(item.created_at).toLocaleString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '—'}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Disconnect Confirmation Modal ────────────────────────────────────────── */}
      <ConfirmationModal
        isOpen={showDisconnectModal}
        onClose={() => setShowDisconnectModal(false)}
        onConfirm={handleConfirmDisconnect}
        title={clearAuthOnDisconnect ? 'Connect a Different WhatsApp Number?' : 'Disconnect WhatsApp Service?'}
        message={
          clearAuthOnDisconnect
            ? 'This will clear stored authentication credentials from the server. You will be provided a fresh QR code to scan and link another WhatsApp account.'
            : 'Are you sure you want to disconnect WhatsApp? Your stored credentials will be preserved, and you can reconnect anytime with one click.'
        }
        confirmText={clearAuthOnDisconnect ? 'Clear & Re-link' : 'Disconnect'}
        confirmButtonClass={clearAuthOnDisconnect ? 'btn-danger' : 'btn-warning'}
      />
    </div>
  );
}

// ─── Reusable Design Token Styles ─────────────────────────────────────────────
const metricCardStyle = {
  backgroundColor: '#FFFFFF',
  borderRadius: '16px',
  padding: '1.25rem 1.4rem',
  border: '1.5px solid #E8DCCB',
  boxShadow: '0 2px 10px rgba(43, 23, 16, 0.03)',
};

const panelCardStyle = {
  backgroundColor: '#FFFFFF',
  borderRadius: '18px',
  padding: '1.75rem',
  border: '1.5px solid #E8DCCB',
  boxShadow: '0 4px 20px rgba(43, 23, 16, 0.04)',
};

const panelHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '1.25rem',
  paddingBottom: '0.85rem',
  borderBottom: '1px solid #F3EDE2',
};

const panelTitleStyle = {
  fontSize: '1.05rem',
  fontWeight: '800',
  color: '#2B1710',
  margin: 0,
};

const labelStyle = {
  display: 'block',
  fontSize: '0.72rem',
  fontWeight: '800',
  color: '#5A4438',
  letterSpacing: '0.05em',
  marginBottom: '0.35rem',
};

const inputStyle = {
  width: '100%',
  padding: '0.65rem 0.85rem',
  backgroundColor: '#FAF7F2',
  border: '1.5px solid #D8CCB8',
  borderRadius: '10px',
  fontSize: '0.88rem',
  color: '#2B1710',
  outline: 'none',
  boxSizing: 'border-box',
};

const thStyle = {
  padding: '0.85rem 1rem',
  fontSize: '0.72rem',
  fontWeight: '800',
  color: '#5A4438',
  letterSpacing: '0.04em',
};

const tdStyle = {
  padding: '0.85rem 1rem',
  verticalAlign: 'middle',
};
