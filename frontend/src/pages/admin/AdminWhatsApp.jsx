import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare, RefreshCw, QrCode, Smartphone, Send, ShieldCheck,
  AlertTriangle, CheckCircle2, Clock, XCircle, LogOut, ArrowRight,
  HelpCircle, Search, Filter, PhoneCall, ExternalLink, Zap, Trash2,
  Users, Sliders, RotateCw, Eye, Plus, Check, X, Shield, Bell
} from 'lucide-react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import ConfirmationModal from '../../components/ConfirmationModal';

export default function AdminWhatsApp() {
  const { toast } = useToast();

  // Active Tab: 'overview' | 'history' | 'settings' | 'recipients'
  const [activeTab, setActiveTab] = useState('overview');

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
  const [showClearSessionModal, setShowClearSessionModal] = useState(false);

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
    today: 0,
    customer: 0,
    admin: 0,
    successRate: '100%',
  });

  // History State
  const [history, setHistory] = useState([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [recipientTypeFilter, setRecipientTypeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [retryingId, setRetryingId] = useState(null);

  // Notification Matrix Settings State
  const [settings, setSettings] = useState({});
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  // Admin Recipients State
  const [recipients, setRecipients] = useState([]);
  const [loadingRecipients, setLoadingRecipients] = useState(false);
  const [showAddRecipientModal, setShowAddRecipientModal] = useState(false);
  const [newRecipient, setNewRecipient] = useState({
    name: '',
    phone: '',
    is_primary: false,
    categories: ['all'],
  });
  const [savingRecipient, setSavingRecipient] = useState(false);
  const [deletingRecipientId, setDeletingRecipientId] = useState(null);

  // 1. Fetch Status & Stats
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

  // 2. Fetch QR Code
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
        params: {
          status: statusFilter,
          recipientType: recipientTypeFilter,
          search: searchTerm || undefined,
          limit: 50,
        },
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

  // 4. Fetch Matrix Settings
  const fetchSettings = async () => {
    setLoadingSettings(true);
    try {
      const res = await api.get('/admin/whatsapp/settings');
      if (res.data?.success) {
        setSettings(res.data.settings || {});
      }
    } catch (err) {
      console.error('[ADMIN WHATSAPP] Settings fetch error:', err);
    } finally {
      setLoadingSettings(false);
    }
  };

  // 5. Fetch Admin Recipients
  const fetchRecipients = async () => {
    setLoadingRecipients(true);
    try {
      const res = await api.get('/admin/whatsapp/recipients');
      if (res.data?.success) {
        setRecipients(res.data.recipients || []);
      }
    } catch (err) {
      console.error('[ADMIN WHATSAPP] Recipients fetch error:', err);
    } finally {
      setLoadingRecipients(false);
    }
  };

  // Polling & Lifecycle
  useEffect(() => {
    fetchStatusAndStats();
    fetchHistory();
    fetchSettings();
    fetchRecipients();

    const interval = setInterval(() => {
      fetchStatusAndStats();
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [statusFilter, recipientTypeFilter]);

  useEffect(() => {
    if (statusData?.status === 'qr_ready') {
      fetchQrCode();
    }
  }, [statusData?.status]);

  // Actions
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

  const handleClearSession = async () => {
    setActionLoading(true);
    setShowClearSessionModal(false);
    try {
      const res = await api.post('/admin/whatsapp/clear-session');
      toast.success(res.data?.message || 'WhatsApp session cleared. Fresh QR code generated!');
      await fetchStatusAndStats();
      await fetchQrCode();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to clear WhatsApp session.');
    } finally {
      setActionLoading(false);
    }
  };

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

  const handleRetry = async (notificationId) => {
    setRetryingId(notificationId);
    try {
      const res = await api.post(`/admin/whatsapp/retry/${notificationId}`);
      if (res.data?.success) {
        toast.success(res.data.message || 'Notification queued for retry!');
        fetchHistory();
        fetchStatusAndStats();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to retry notification.');
    } finally {
      setRetryingId(null);
    }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const res = await api.put('/admin/whatsapp/settings', { settings });
      if (res.data?.success) {
        toast.success('Notification settings saved successfully!');
        setSettings(res.data.settings);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleToggleSetting = (key, type) => {
    setSettings((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [type]: !prev[key]?.[type],
      },
    }));
  };

  const handleAddRecipient = async (e) => {
    if (e) e.preventDefault();
    const cleanPhone = newRecipient.phone.replace(/\D/g, '').slice(-10);
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      toast.error('Please enter a valid 10-digit Indian phone number.');
      return;
    }
    if (!newRecipient.name.trim()) {
      toast.error('Please enter a recipient name.');
      return;
    }

    setSavingRecipient(true);
    try {
      const res = await api.post('/admin/whatsapp/recipients', {
        ...newRecipient,
        phone: cleanPhone,
      });
      if (res.data?.success) {
        toast.success('Admin recipient added successfully!');
        setShowAddRecipientModal(false);
        setNewRecipient({ name: '', phone: '', is_primary: false, categories: ['all'] });
        fetchRecipients();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add recipient.');
    } finally {
      setSavingRecipient(false);
    }
  };

  const handleToggleRecipientActive = async (rec) => {
    try {
      const res = await api.put(`/admin/whatsapp/recipients/${rec.id}`, {
        is_active: !rec.is_active,
      });
      if (res.data?.success) {
        toast.success(`Recipient ${rec.is_active ? 'disabled' : 'enabled'}`);
        fetchRecipients();
      }
    } catch (err) {
      toast.error('Failed to update recipient status.');
    }
  };

  const handleDeleteRecipient = async (id) => {
    try {
      const res = await api.delete(`/admin/whatsapp/recipients/${id}`);
      if (res.data?.success) {
        toast.success('Admin recipient removed.');
        fetchRecipients();
      }
    } catch (err) {
      toast.error('Failed to remove admin recipient.');
    }
  };

  const isConnected = statusData?.isConnected;
  const statusType = statusData?.status || 'disconnected';

  // Group settings by category
  const categoriesList = ['order', 'payment', 'returns', 'enquiry', 'account', 'system'];
  const categoryLabels = {
    order: '📦 Order & Shipping Lifecycle',
    payment: '💳 Payment & Transaction Alerts',
    returns: '🔄 Cancellations & Refunds',
    enquiry: '💬 Customer Inquiries & Contact Forms',
    account: '👤 Account Security & Registration',
    system: '🚨 System & Reliability Alerts',
  };

  return (
    <div style={{ padding: '0 0 4rem 0', color: '#2B1710', fontFamily: 'Inter, sans-serif' }}>

      {/* ─── Top Header Card ──────────────────────────────────────────────────────── */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '18px',
          padding: '1.75rem 2rem',
          border: '1.5px solid #E8DCCB',
          marginBottom: '1.5rem',
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
                WhatsApp Two-Way Automation Manager
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
              Real-time, two-way automated messaging delivering customer updates and instant personal WhatsApp alerts to Admin.
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
            <>
              <button
                type="button"
                onClick={() => setShowClearSessionModal(true)}
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
                  transition: 'all 0.2s',
                }}
                title="Delete expired credentials from server and start fresh QR pairing"
              >
                <Trash2 size={15} />
                <span>Clear Auth Session</span>
              </button>
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
            </>
          )}
        </div>
      </div>

      {/* ─── WhatsApp Safe Test Mode Banner ────────────────────────────────────────── */}
      {statusData?.testMode?.enabled && (
        <div
          style={{
            backgroundColor: '#FEF3C7',
            border: '1.5px solid #F59E0B',
            borderRadius: '14px',
            padding: '1rem 1.25rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            boxShadow: '0 4px 14px rgba(217, 119, 6, 0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: '#FDE68A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#B45309',
                flexShrink: 0,
              }}
            >
              <AlertTriangle size={22} />
            </div>
            <div>
              <div style={{ fontWeight: '800', color: '#92400E', fontSize: '0.95rem' }}>
                WHATSAPP TEST MODE ACTIVE — ZERO REAL CUSTOMER/ADMIN IMPACT
              </div>
              <div style={{ fontSize: '0.82rem', color: '#78350F', marginTop: '2px', lineHeight: '1.4' }}>
                All outgoing WhatsApp and fallback SMS dispatches are intercepted and routed strictly to verified testing device{' '}
                <strong>{statusData.testMode.testNumber || '918791383595'}</strong> ({statusData.testMode.testNumberMasked || '+91 87913 ***95'}). Real customer and admin phone numbers will not receive test messages.
              </div>
            </div>
          </div>
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: '800',
              backgroundColor: '#B45309',
              color: '#FFFFFF',
              padding: '6px 14px',
              borderRadius: '999px',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            Safe Test Mode
          </span>
        </div>
      )}

      {/* ─── Navigation Tabs ──────────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          backgroundColor: '#FFFFFF',
          padding: '0.45rem',
          borderRadius: '14px',
          border: '1.5px solid #E8DCCB',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
        }}
      >
        {[
          { id: 'overview', label: 'Overview & Device', icon: Smartphone },
          { id: 'history', label: 'Delivery Audit Log', icon: MessageSquare, badge: historyTotal },
          { id: 'settings', label: 'Notification Matrix', icon: Sliders },
          { id: 'recipients', label: 'Admin Recipients', icon: Users, badge: recipients.length },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 1.25rem',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: isActive ? '#1F5A28' : 'transparent',
                color: isActive ? '#FFFFFF' : '#5A4438',
                fontWeight: '700',
                fontSize: '0.88rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease-in-out',
              }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
              {typeof tab.badge !== 'undefined' && (
                <span
                  style={{
                    backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : '#F3EDE2',
                    color: isActive ? '#FFFFFF' : '#2B1710',
                    fontSize: '0.72rem',
                    padding: '2px 7px',
                    borderRadius: '999px',
                    fontWeight: '800',
                  }}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ─── KPI Metric Cards (Always visible across all tabs) ────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div style={metricCardStyle}>
          <div style={{ fontSize: '0.75rem', color: '#5A4438', fontWeight: '700', textTransform: 'uppercase' }}>
            Total Dispatches
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#2B1710', marginTop: '0.25rem' }}>
            {stats.total.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#8C7A6F', marginTop: '0.2rem' }}>
            {stats.today || 0} sent today
          </div>
        </div>

        <div style={metricCardStyle}>
          <div style={{ fontSize: '0.75rem', color: '#1F5A28', fontWeight: '700', textTransform: 'uppercase' }}>
            Customer Messages
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#1F5A28', marginTop: '0.25rem' }}>
            {(stats.customer || 0).toLocaleString()}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#8C7A6F', marginTop: '0.2rem' }}>Orders, OTPs & Updates</div>
        </div>

        <div style={metricCardStyle}>
          <div style={{ fontSize: '0.75rem', color: '#2B1710', fontWeight: '700', textTransform: 'uppercase' }}>
            Admin Alerts
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#2B1710', marginTop: '0.25rem' }}>
            {(stats.admin || 0).toLocaleString()}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#8C7A6F', marginTop: '0.2rem' }}>Personal WhatsApp Alerts</div>
        </div>

        <div style={metricCardStyle}>
          <div style={{ fontSize: '0.75rem', color: '#1F5A28', fontWeight: '700', textTransform: 'uppercase' }}>
            Delivered
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#1F5A28', marginTop: '0.25rem' }}>
            {stats.sent.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#1F5A28', marginTop: '0.2rem' }}>Success rate: {stats.successRate}</div>
        </div>

        <div style={metricCardStyle}>
          <div style={{ fontSize: '0.75rem', color: '#DC2626', fontWeight: '700', textTransform: 'uppercase' }}>
            Failed / Pending
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: '800', color: stats.failed > 0 ? '#DC2626' : '#2B1710', marginTop: '0.25rem' }}>
            {stats.failed} <span style={{ fontSize: '0.95rem', color: '#D97706', fontWeight: '600' }}>({stats.pending} pending)</span>
          </div>
          <div style={{ fontSize: '0.74rem', color: '#8C7A6F', marginTop: '0.2rem' }}>Retryable via Log</div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════════
          TAB 1: OVERVIEW & DEVICE PAIRING
      ══════════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'overview' && (
        <>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
            gap: '1.5rem',
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
                        Linked Business WhatsApp Number
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
                      boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                    }}
                  >
                    <img
                      src={qrData.qrDataUrl}
                      alt="WhatsApp QR Code"
                      style={{ width: '220px', height: '220px', display: 'block' }}
                    />
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#5A4438', marginTop: '0.85rem', textAlign: 'center' }}>
                    Open <strong>WhatsApp</strong> on your phone &rarr; <strong>Linked Devices</strong> &rarr; <strong>Link a Device</strong>.
                  </div>
                </div>
              ) : (
                // Offline
                <div
                  style={{
                    padding: '1.5rem',
                    backgroundColor: '#FAF7F2',
                    borderRadius: '14px',
                    textAlign: 'center',
                    border: '1.5px solid #E8DCCB',
                  }}
                >
                  <div style={{ color: '#D97706', marginBottom: '0.5rem' }}>
                    <AlertTriangle size={32} style={{ margin: '0 auto' }} />
                  </div>
                  <div style={{ fontWeight: '800', fontSize: '0.95rem', color: '#2B1710' }}>
                    WhatsApp Service Disconnected
                  </div>
                  <p style={{ fontSize: '0.82rem', color: '#5A4438', margin: '0.4rem 0 1rem 0' }}>
                    Click below to generate a new QR pairing code or initiate connection.
                  </p>
                  <button
                    type="button"
                    onClick={handleReconnect}
                    disabled={actionLoading}
                    style={{
                      backgroundColor: '#1F5A28',
                      color: '#FFFFFF',
                      borderRadius: '10px',
                      padding: '0.55rem 1.25rem',
                      fontWeight: '700',
                      fontSize: '0.85rem',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    Connect WhatsApp
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Box B: Send Test Message */}
          <div style={panelCardStyle}>
            <div style={panelHeaderStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Send size={20} color="#1F5A28" />
                <h2 style={panelTitleStyle}>Send Test WhatsApp Message</h2>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#8C7A6F' }}>Admin Verification Tool</span>
            </div>

            <form onSubmit={handleSendTest} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>RECIPIENT MOBILE NUMBER (10 DIGITS) *</label>
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

        {/* Box C: Simplified Customer Notification Policy */}
        <div style={{ ...panelCardStyle, marginTop: '1.5rem' }}>
          <div style={panelHeaderStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <ShieldCheck size={20} color="#1F5A28" />
              <div>
                <h2 style={panelTitleStyle}>Simplified Customer Order Policy (Active)</h2>
                <div style={{ fontSize: '0.8rem', color: '#5A4438', marginTop: '2px' }}>
                  Customers receive strictly three premium WhatsApp updates. Intermediate stages are suppressed centrally.
                </div>
              </div>
            </div>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: '800',
                backgroundColor: '#E7F4E8',
                color: '#1F5A28',
                padding: '4px 12px',
                borderRadius: '999px',
              }}
            >
              3-Update Policy Enforced
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '1rem',
              marginTop: '0.75rem',
            }}
          >
            <div
              style={{
                backgroundColor: '#FAF7F2',
                borderRadius: '12px',
                padding: '1rem',
                border: '1.5px solid #CDE5CB',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                <CheckCircle2 size={16} color="#1F5A28" />
                <span style={{ fontWeight: '800', fontSize: '0.88rem', color: '#1F5A28' }}>1. Order Confirmed</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#5A4438', margin: 0, lineHeight: '1.4' }}>
                Sent immediately when COD order or prepaid payment is verified. Direct link to canonical order details.
              </p>
            </div>

            <div
              style={{
                backgroundColor: '#FAF7F2',
                borderRadius: '12px',
                padding: '1rem',
                border: '1.5px solid #CDE5CB',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                <CheckCircle2 size={16} color="#1F5A28" />
                <span style={{ fontWeight: '800', fontSize: '0.88rem', color: '#1F5A28' }}>2. Order Shipped</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#5A4438', margin: 0, lineHeight: '1.4' }}>
                Clean dispatch notice with expected delivery. Strictly strips courier names, AWBs, and courier URLs.
              </p>
            </div>

            <div
              style={{
                backgroundColor: '#FAF7F2',
                borderRadius: '12px',
                padding: '1rem',
                border: '1.5px solid #CDE5CB',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                <CheckCircle2 size={16} color="#1F5A28" />
                <span style={{ fontWeight: '800', fontSize: '0.88rem', color: '#1F5A28' }}>3. Order Delivered</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#5A4438', margin: 0, lineHeight: '1.4' }}>
                Delivered celebration update with customer feedback prompt. Pure handcrafted brand experience.
              </p>
            </div>
          </div>

          <div
            style={{
              marginTop: '1rem',
              padding: '0.75rem 1rem',
              backgroundColor: '#FFFBEB',
              borderRadius: '10px',
              border: '1px solid #FCD34D',
              fontSize: '0.78rem',
              color: '#92400E',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.5rem',
            }}
          >
            <span>
              🔒 <strong>Central Router Suppression:</strong> Order Placed, Processing, Packed, Reached City, and Out for Delivery are automatically suppressed for customers.
            </span>
            <span style={{ color: '#78350F', fontWeight: '700' }}>
              Admin alerts remain 100% active.
            </span>
          </div>
        </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════════
          TAB 2: DELIVERY AUDIT LOG & HISTORY
      ══════════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'history' && (
        <div style={panelCardStyle}>
          <div style={panelHeaderStyle}>
            <div>
              <h2 style={panelTitleStyle}>Notification Delivery Audit Log</h2>
              <div style={{ fontSize: '0.8rem', color: '#5A4438', marginTop: '0.2rem' }}>
                Real-time delivery log of both Customer and Admin personal WhatsApp alerts.
              </div>
            </div>

            {/* Filter Pills & Search */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
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

              {/* Recipient Type Filter */}
              <div style={{ display: 'flex', gap: '3px', backgroundColor: '#FAF7F2', padding: '3px', borderRadius: '10px', border: '1px solid #D8CCB8' }}>
                {[
                  { id: 'all', label: 'All Recip.' },
                  { id: 'customer', label: 'Customer' },
                  { id: 'admin', label: 'Admin' },
                ].map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRecipientTypeFilter(r.id)}
                    style={{
                      background: recipientTypeFilter === r.id ? '#1F5A28' : 'none',
                      color: recipientTypeFilter === r.id ? '#FFFFFF' : '#5A4438',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '4px 9px',
                      fontSize: '0.74rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                    }}
                  >
                    {r.label}
                  </button>
                ))}
              </div>

              {/* Status Filter */}
              <div style={{ display: 'flex', gap: '3px', backgroundColor: '#FAF7F2', padding: '3px', borderRadius: '10px', border: '1px solid #D8CCB8' }}>
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
                      padding: '4px 9px',
                      fontSize: '0.74rem',
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

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ borderBottom: '1.5px solid #F3EDE2', backgroundColor: '#FAF7F2' }}>
                  <th style={thStyle}>RECIPIENT TYPE</th>
                  <th style={thStyle}>PHONE NUMBER</th>
                  <th style={thStyle}>EVENT / CATEGORY</th>
                  <th style={thStyle}>REFERENCE ID</th>
                  <th style={thStyle}>STATUS</th>
                  <th style={thStyle}>DISPATCH DATE</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {loadingHistory ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: '#8C7A6F' }}>
                      Loading notification records...
                    </td>
                  </tr>
                ) : history.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: '#8C7A6F' }}>
                      No notification dispatches found matching filters.
                    </td>
                  </tr>
                ) : (
                  history.map((row) => {
                    const isRowAdmin = row.recipient_type === 'admin';
                    const isSuccess = row.status === 'sent';
                    const isPending = row.status === 'pending';
                    const isFailed = row.status === 'failed';

                    return (
                      <tr key={row.id} style={{ borderBottom: '1px solid #F8F5F0' }}>
                        <td style={tdStyle}>
                          <span
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: '800',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              backgroundColor: isRowAdmin ? '#FEF3C7' : '#E7F4E8',
                              color: isRowAdmin ? '#92400E' : '#1F5A28',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                            }}
                          >
                            {isRowAdmin ? 'ADMIN' : 'CUSTOMER'}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <span style={{ fontWeight: '700', color: '#2B1710' }}>
                            +91 {row.masked_phone || row.recipient_phone}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <span style={{ fontWeight: '600', color: '#5A4438' }}>
                            {row.event_type}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <span style={{ fontFamily: 'monospace', color: '#1F5A28', fontWeight: '700' }}>
                            {row.reference_id || row.order_id || '—'}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <span
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: '800',
                              padding: '2px 8px',
                              borderRadius: '999px',
                              backgroundColor: isSuccess ? '#CDE5CB' : isPending ? '#FEF3C7' : '#FEE2E2',
                              color: isSuccess ? '#1F5A28' : isPending ? '#92400E' : '#991B1B',
                              textTransform: 'uppercase',
                            }}
                          >
                            {row.status}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <span style={{ color: '#8C7A6F', fontSize: '0.78rem' }}>
                            {new Date(row.created_at).toLocaleString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                            <button
                              type="button"
                              onClick={() => setSelectedNotification(row)}
                              title="View Full Message"
                              style={{
                                background: '#FAF7F2',
                                border: '1px solid #D8CCB8',
                                borderRadius: '8px',
                                padding: '4px 8px',
                                color: '#5A4438',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                fontSize: '0.74rem',
                                fontWeight: '700',
                              }}
                            >
                              <Eye size={12} />
                              <span>View</span>
                            </button>

                            {isFailed && (
                              <button
                                type="button"
                                onClick={() => handleRetry(row.id)}
                                disabled={retryingId === row.id}
                                title="Retry delivery"
                                style={{
                                  background: '#1F5A28',
                                  border: 'none',
                                  borderRadius: '8px',
                                  padding: '4px 8px',
                                  color: '#FFFFFF',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '3px',
                                  fontSize: '0.74rem',
                                  fontWeight: '700',
                                }}
                              >
                                <RotateCw size={12} style={{ animation: retryingId === row.id ? 'spin 1s linear infinite' : 'none' }} />
                                <span>Retry</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════════
          TAB 3: NOTIFICATION MATRIX SETTINGS
      ══════════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'settings' && (
        <div style={panelCardStyle}>
          <div style={panelHeaderStyle}>
            <div>
              <h2 style={panelTitleStyle}>Notification Matrix & Event Preferences</h2>
              <div style={{ fontSize: '0.8rem', color: '#5A4438', marginTop: '0.2rem' }}>
                Control which customer and admin WhatsApp messages are dispatched for each platform activity.
              </div>
            </div>

            <button
              type="button"
              onClick={handleSaveSettings}
              disabled={savingSettings}
              style={{
                backgroundColor: '#1F5A28',
                color: '#FFFFFF',
                borderRadius: '12px',
                border: 'none',
                padding: '0.65rem 1.4rem',
                fontSize: '0.85rem',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                boxShadow: '0 4px 12px rgba(31, 90, 40, 0.2)',
              }}
            >
              <Check size={16} />
              <span>{savingSettings ? 'Saving...' : 'Save Matrix Changes'}</span>
            </button>
          </div>

          {loadingSettings ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#8C7A6F' }}>
              Loading notification settings...
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {categoriesList.map((catKey) => {
                const categoryEvents = Object.entries(settings).filter(
                  ([_, val]) => (val.category || 'order') === catKey
                );

                if (categoryEvents.length === 0) return null;

                return (
                  <div
                    key={catKey}
                    style={{
                      border: '1.5px solid #F3EDE2',
                      borderRadius: '14px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        backgroundColor: '#FAF7F2',
                        padding: '0.85rem 1.25rem',
                        borderBottom: '1px solid #E8DCCB',
                        fontSize: '0.92rem',
                        fontWeight: '800',
                        color: '#2B1710',
                      }}
                    >
                      {categoryLabels[catKey] || catKey.toUpperCase()}
                    </div>

                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #F3EDE2', backgroundColor: '#FFFFFF' }}>
                          <th style={{ ...thStyle, width: '45%' }}>ACTIVITY & DESCRIPTION</th>
                          <th style={{ ...thStyle, textAlign: 'center', width: '27%' }}>CUSTOMER WHATSAPP</th>
                          <th style={{ ...thStyle, textAlign: 'center', width: '28%' }}>ADMIN PERSONAL WHATSAPP</th>
                        </tr>
                      </thead>
                      <tbody>
                        {categoryEvents.map(([eventKey, conf]) => (
                          <tr key={eventKey} style={{ borderBottom: '1px solid #FAF7F2' }}>
                            <td style={tdStyle}>
                              <div style={{ fontWeight: '800', color: '#2B1710' }}>{eventKey}</div>
                              <div style={{ fontSize: '0.76rem', color: '#8C7A6F', marginTop: '2px' }}>
                                {conf.description}
                              </div>
                            </td>
                            <td style={{ ...tdStyle, textAlign: 'center' }}>
                              <label
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.45rem',
                                  cursor: 'pointer',
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={Boolean(conf.customer)}
                                  onChange={() => handleToggleSetting(eventKey, 'customer')}
                                  style={{ width: '16px', height: '16px', accentColor: '#1F5A28', cursor: 'pointer' }}
                                />
                                <span style={{ fontSize: '0.78rem', fontWeight: '700', color: conf.customer ? '#1F5A28' : '#8C7A6F' }}>
                                  {conf.customer ? 'Enabled' : 'Disabled'}
                                </span>
                              </label>
                            </td>
                            <td style={{ ...tdStyle, textAlign: 'center' }}>
                              <label
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.45rem',
                                  cursor: 'pointer',
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={Boolean(conf.admin)}
                                  onChange={() => handleToggleSetting(eventKey, 'admin')}
                                  style={{ width: '16px', height: '16px', accentColor: '#1F5A28', cursor: 'pointer' }}
                                />
                                <span style={{ fontSize: '0.78rem', fontWeight: '700', color: conf.admin ? '#1F5A28' : '#8C7A6F' }}>
                                  {conf.admin ? 'Enabled' : 'Disabled'}
                                </span>
                              </label>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════════
          TAB 4: ADMIN RECIPIENTS MANAGEMENT
      ══════════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'recipients' && (
        <div style={panelCardStyle}>
          <div style={panelHeaderStyle}>
            <div>
              <h2 style={panelTitleStyle}>Admin Personal WhatsApp Recipients</h2>
              <div style={{ fontSize: '0.8rem', color: '#5A4438', marginTop: '0.2rem' }}>
                Manage the authorized admin phone numbers that receive immediate alerts when customer activities occur.
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowAddRecipientModal(true)}
              style={{
                backgroundColor: '#1F5A28',
                color: '#FFFFFF',
                borderRadius: '12px',
                border: 'none',
                padding: '0.65rem 1.25rem',
                fontSize: '0.85rem',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                boxShadow: '0 4px 12px rgba(31, 90, 40, 0.2)',
              }}
            >
              <Plus size={16} />
              <span>Add Admin Number</span>
            </button>
          </div>

          {loadingRecipients ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#8C7A6F' }}>
              Loading authorized recipients...
            </div>
          ) : recipients.length === 0 ? (
            <div
              style={{
                padding: '2.5rem',
                backgroundColor: '#FAF7F2',
                borderRadius: '14px',
                textAlign: 'center',
                border: '1.5px solid #E8DCCB',
              }}
            >
              <Users size={32} color="#8C7A6F" style={{ margin: '0 auto 0.5rem auto' }} />
              <div style={{ fontWeight: '800', color: '#2B1710' }}>No Admin Numbers Configured</div>
              <p style={{ fontSize: '0.82rem', color: '#5A4438', margin: '0.25rem 0 1rem 0' }}>
                Add your personal WhatsApp number to start receiving instant alerts on customer orders and inquiries.
              </p>
              <button
                type="button"
                onClick={() => setShowAddRecipientModal(true)}
                style={{
                  backgroundColor: '#1F5A28',
                  color: '#FFFFFF',
                  borderRadius: '10px',
                  padding: '0.55rem 1.25rem',
                  fontWeight: '700',
                  fontSize: '0.85rem',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Add Primary Admin Phone
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
              {recipients.map((rec) => (
                <div
                  key={rec.id}
                  style={{
                    backgroundColor: '#FAF7F2',
                    borderRadius: '14px',
                    padding: '1.25rem',
                    border: '1.5px solid #E8DCCB',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontWeight: '800', color: '#2B1710', fontSize: '0.95rem' }}>
                        {rec.name}
                      </div>
                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        {rec.is_primary && (
                          <span
                            style={{
                              fontSize: '0.68rem',
                              fontWeight: '800',
                              padding: '2px 7px',
                              borderRadius: '6px',
                              backgroundColor: '#FEF3C7',
                              color: '#92400E',
                            }}
                          >
                            PRIMARY
                          </span>
                        )}
                        <span
                          style={{
                            fontSize: '0.68rem',
                            fontWeight: '800',
                            padding: '2px 7px',
                            borderRadius: '6px',
                            backgroundColor: rec.is_active ? '#CDE5CB' : '#FEE2E2',
                            color: rec.is_active ? '#1F5A28' : '#991B1B',
                          }}
                        >
                          {rec.is_active ? 'ACTIVE' : 'DISABLED'}
                        </span>
                      </div>
                    </div>

                    <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#1F5A28', margin: '0.5rem 0' }}>
                      +91 {rec.phone}
                    </div>

                    <div style={{ fontSize: '0.75rem', color: '#8C7A6F' }}>
                      Subscribed to: <strong>{(rec.categories || ['all']).join(', ')}</strong>
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: '1.25rem',
                      paddingTop: '0.75rem',
                      borderTop: '1px solid #E8DCCB',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => handleToggleRecipientActive(rec)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: rec.is_active ? '#B91C1C' : '#1F5A28',
                        fontSize: '0.78rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                      }}
                    >
                      {rec.is_active ? 'Disable Alert Delivery' : 'Enable Alert Delivery'}
                    </button>

                    {!rec.is_primary && (
                      <button
                        type="button"
                        onClick={() => handleDeleteRecipient(rec.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#DC2626',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          fontSize: '0.78rem',
                          fontWeight: '700',
                        }}
                      >
                        <Trash2 size={13} />
                        <span>Remove</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Modal: View Full Notification Message ──────────────────────────────────── */}
      {selectedNotification && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem',
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              maxWidth: '560px',
              width: '100%',
              padding: '1.5rem',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              border: '1.5px solid #E8DCCB',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: '#2B1710' }}>
                  WhatsApp Message Payload
                </h3>
                <div style={{ fontSize: '0.75rem', color: '#8C7A6F', marginTop: '2px' }}>
                  Sent to +91 {selectedNotification.recipient_phone} ({selectedNotification.recipient_type || 'customer'})
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedNotification(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8C7A6F' }}
              >
                <X size={20} />
              </button>
            </div>

            <div
              style={{
                backgroundColor: '#FAF7F2',
                borderRadius: '12px',
                padding: '1rem',
                border: '1px solid #D8CCB8',
                whiteSpace: 'pre-wrap',
                fontFamily: 'monospace',
                fontSize: '0.82rem',
                lineHeight: '1.5',
                color: '#2B1710',
                maxHeight: '360px',
                overflowY: 'auto',
              }}
            >
              {selectedNotification.message_body}
            </div>

            {selectedNotification.last_error && (
              <div
                style={{
                  marginTop: '0.75rem',
                  padding: '0.65rem',
                  borderRadius: '8px',
                  backgroundColor: '#FEE2E2',
                  color: '#991B1B',
                  fontSize: '0.78rem',
                  fontWeight: '600',
                }}
              >
                Error: {selectedNotification.last_error}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <button
                type="button"
                onClick={() => setSelectedNotification(null)}
                style={{
                  backgroundColor: '#1F5A28',
                  color: '#FFFFFF',
                  borderRadius: '10px',
                  border: 'none',
                  padding: '0.55rem 1.25rem',
                  fontWeight: '700',
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal: Add Admin Recipient ────────────────────────────────────────────── */}
      {showAddRecipientModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem',
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              maxWidth: '480px',
              width: '100%',
              padding: '1.5rem',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              border: '1.5px solid #E8DCCB',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: '#2B1710' }}>
                Add Admin WhatsApp Recipient
              </h3>
              <button
                type="button"
                onClick={() => setShowAddRecipientModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8C7A6F' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddRecipient} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>ADMIN NAME *</label>
                <input
                  type="text"
                  value={newRecipient.name}
                  onChange={(e) => setNewRecipient({ ...newRecipient, name: e.target.value })}
                  placeholder="e.g. Rahul / Anwesha (Founder)"
                  required
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>PERSONAL WHATSAPP NUMBER *</label>
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
                    value={newRecipient.phone}
                    onChange={(e) => setNewRecipient({ ...newRecipient, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                    placeholder="9876543210"
                    required
                    style={{ ...inputStyle, paddingLeft: '44px' }}
                  />
                </div>
              </div>

              <div>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '0.82rem',
                    color: '#2B1710',
                    fontWeight: '700',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={newRecipient.is_primary}
                    onChange={(e) => setNewRecipient({ ...newRecipient, is_primary: e.target.checked })}
                    style={{ width: '16px', height: '16px', accentColor: '#1F5A28' }}
                  />
                  <span>Mark as Primary Admin Recipient</span>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowAddRecipientModal(false)}
                  style={{
                    backgroundColor: '#FAF7F2',
                    color: '#5A4438',
                    border: '1px solid #D8CCB8',
                    borderRadius: '10px',
                    padding: '0.55rem 1.15rem',
                    fontWeight: '700',
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingRecipient}
                  style={{
                    backgroundColor: '#1F5A28',
                    color: '#FFFFFF',
                    borderRadius: '10px',
                    border: 'none',
                    padding: '0.55rem 1.25rem',
                    fontWeight: '700',
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                  }}
                >
                  {savingRecipient ? 'Saving...' : 'Save Recipient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modals for Disconnect and Clear Session */}
      <ConfirmationModal
        isOpen={showDisconnectModal}
        onClose={() => setShowDisconnectModal(false)}
        onConfirm={handleConfirmDisconnect}
        title={clearAuthOnDisconnect ? 'Connect a Different Number?' : 'Disconnect WhatsApp?'}
        message={
          clearAuthOnDisconnect
            ? 'This will safely clear your active device session and generate a fresh QR code so you can link a new WhatsApp number.'
            : 'Automated WhatsApp customer notifications will be paused until WhatsApp is reconnected.'
        }
        confirmText={clearAuthOnDisconnect ? 'Clear & Scan New QR' : 'Disconnect'}
        confirmColor="#DC2626"
      />

      <ConfirmationModal
        isOpen={showClearSessionModal}
        onClose={() => setShowClearSessionModal(false)}
        onConfirm={handleClearSession}
        title="Clear Expired WhatsApp Session?"
        message="This safely wipes expired Baileys authentication files from the server and generates a clean QR code. Use this if your previous device logged out."
        confirmText="Clear & Generate QR"
        confirmColor="#DC2626"
      />

    </div>
  );
}

// ─── Reusable Design Token Styles ─────────────────────────────────────────────
const metricCardStyle = {
  backgroundColor: '#FFFFFF',
  borderRadius: '16px',
  padding: '1.15rem 1.3rem',
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
  flexWrap: 'wrap',
  gap: '0.75rem',
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
