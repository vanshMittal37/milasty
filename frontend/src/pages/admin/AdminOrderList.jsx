import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, Filter, RefreshCw, Eye, X, Package, CreditCard, MapPin, User, Mail, Phone, Sparkles, Printer, Zap, ExternalLink, Truck, CheckCircle2, AlertCircle, Download, FileText, Clock, RotateCcw } from 'lucide-react';
import api from '../../api/axios';
import CreateShipmentDialog from './CreateShipmentDialog';
import { formatDateTime, calculateEstimatedDeliveryDate, formatInr } from '../../utils/orderDateTime';

const STAGES = ['Pending', 'Confirmed', 'Processing', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];

// Shipments are created manually by admin once the order is packed (nothing books at checkout).
// The backend re-checks all of this and locks the order, so the button can't double-book.
const STUCK_AFTER_MS = 10 * 60 * 1000;
export function canCreateShipment(o) {
  if (!o) return false;
  if (o.awb_number || o.awb) return false;
  if (String(o.paymentStatus || o.payment_status || '').toLowerCase() !== 'paid') return false;
  if (String(o.rawPaymentMethod || o.payment_method || '').toLowerCase() === 'cod') return false;
  if (['cancelled', 'delivered'].includes(String(o.orderStatus || o.order_status || '').toLowerCase())) return false;
  if (o.cancellation) return false;
  const st = String(o.shipment_status || '').toLowerCase();
  if (['', 'pending', 'not_created', 'failed'].includes(st)) return true;
  if (st === 'creating') {
    // Only offer it again for an attempt that has been stuck for a while (the dialog then requires a panel check)
    const lastTouch = new Date(o.shipment_last_attempt_at || o.createdAt || o.created_at || 0).getTime();
    return Date.now() - lastTouch > STUCK_AFTER_MS;
  }
  return false;
}

/**
 * Determine if an order is eligible to be reset back to 'processing' fulfillment state.
 * Eligible only when:
 * 1. Order is paid.
 * 2. Active shipment has been created.
 * 3. Order is NOT delivered or completed.
 * 4. Order is NOT cancelled or refunded.
 */
export function canResetShipment(o) {
  if (!o) return false;
  const payStatus = String(o.paymentStatus || o.payment_status || '').toLowerCase();
  if (payStatus !== 'paid') return false;
  if (payStatus === 'refunded') return false;

  const ordStatus = String(o.orderStatus || o.order_status || '').toLowerCase();
  if (['delivered', 'completed', 'cancelled'].includes(ordStatus)) return false;
  if (o.cancellation) return false;

  const hasShipment = Boolean(
    o.awb_number ||
    o.awb ||
    String(o.shipment_status || '').toLowerCase() === 'booked' ||
    o.shipment_id ||
    o.shipment_booking_response?.shipment_id
  );
  return hasShipment;
}

// Shipment status shown in the Orders Log (only states MILASTY actually records from Shiprath)
function shipmentStatusInfo(o) {
  const st = String(o.shipment_status || '').toLowerCase();
  const cs = o.cancellation?.shipment_cancel_status;
  if (st === 'cancelled' || cs === 'cancelled' || cs === 'manually_resolved') return ['🚫 Cancelled', '#B91C1C', 'rgba(239,68,68,0.1)'];
  if (['pending', 'in_progress', 'failed', 'manual_required'].includes(cs)) return [cs === 'manual_required' ? '⚠️ Cancellation — needs RTO' : '⏳ Cancellation Requested', '#B45309', 'rgba(234,179,8,0.12)'];
  if (st === 'creating') return ['⏳ Creating…', '#2563EB', 'rgba(59,130,246,0.1)'];
  if (st === 'failed') return ['❌ Failed — needs attention', '#DC2626', 'rgba(239,68,68,0.1)'];
  if (st === 'booked') return ['📦 Created', '#15803D', 'rgba(34,197,94,0.1)'];
  if (st === 'picked_up') return ['🚚 Picked Up', '#15803D', 'rgba(34,197,94,0.1)'];
  if (st === 'in_transit') return ['🚚 In Transit', '#15803D', 'rgba(34,197,94,0.1)'];
  if (st === 'out_for_delivery') return ['🚚 Out for Delivery', '#15803D', 'rgba(34,197,94,0.1)'];
  if (st === 'delivered') return ['✅ Delivered', '#15803D', 'rgba(34,197,94,0.1)'];
  if (o.awb_number || o.awb) return ['📦 Created', '#15803D', 'rgba(34,197,94,0.1)'];
  return ['○ Not Created', '#6B7280', 'rgba(107,114,128,0.1)'];
}

const STATUS_DISPLAY_MAP = {
  'pending': 'Pending',
  'confirmed': 'Confirmed',
  'processing': 'Processing',
  'packed': 'Packed',
  'shipped': 'Shipped',
  'out_for_delivery': 'Out for Delivery',
  'delivered': 'Delivered',
  'cancelled': 'Cancelled',
};

// Shipment cancelled with Shiprath (or resolved manually from Cancellations & Refunds)
const isShipmentCancelled = (o) =>
  String(o.shipment_status || '').toLowerCase() === 'cancelled' ||
  ['cancelled', 'manually_resolved'].includes(o.cancellation?.shipment_cancel_status);

function getPickupStatusLabel(status) {
  switch (String(status || '').toLowerCase()) {
    case 'confirmed': return 'Pickup Confirmed';
    case 'processing': return 'Processing';
    case 'failed': return 'Pickup Failed';
    case 'cancelled': return 'Pickup Cancelled';
    default: return 'Not Created';
  }
}

function getPickupBadgeStyle(status) {
  switch (String(status || '').toLowerCase()) {
    case 'confirmed': return { background: 'rgba(34,197,94,0.15)', color: '#15803D' };
    case 'processing': return { background: 'rgba(59,130,246,0.15)', color: '#1D4ED8' };
    case 'failed': return { background: 'rgba(239,68,68,0.15)', color: '#DC2626' };
    case 'cancelled': return { background: 'rgba(107,114,128,0.15)', color: '#4B5563' };
    default: return { background: 'rgba(217,119,6,0.15)', color: '#B45309' };
  }
}

export default function AdminOrderList() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [customizationFilter, setCustomizationFilter] = useState('');
  const [shipmentFilter, setShipmentFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showPrintView, setShowPrintView] = useState(false);
  const [shipDialogOrderId, setShipDialogOrderId] = useState(null); // Create Shipment dialog

  // Post-shipment fulfillment: pickup and label state
  const [pickupLoading, setPickupLoading] = useState(false);
  const [labelLoading, setLabelLoading] = useState(false);
  const [pickupNotice, setPickupNotice] = useState(null);

  // Reset shipment to processing state
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetReason, setResetReason] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, paymentFilter, search]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (search) params.append('search', search);
      const res = await api.get(`/orders/admin/all?${params.toString()}`);
      const list = res.data || [];
      setOrders(list);
      setSelectedOrder((prev) => (prev ? (list.find((o) => o.id === prev.id) || prev) : prev));
    } catch (e) {
      console.error('Error fetching admin orders:', e);
    } finally {
      setLoading(false);
    }
  };

  // Instant local status update without re-fetching all orders
  const handleStatusChange = async (orderId, newStatus) => {
    // 1. Update state locally immediately (instant response, no loading spinner)
    setOrders((prevOrders) =>
      prevOrders.map((o) => {
        if (o.id === orderId || o._id === orderId || o.orderId === orderId) {
          return {
            ...o,
            orderStatus: newStatus,
            status: newStatus,
            order_status: newStatus.toLowerCase(),
          };
        }
        return o;
      })
    );

    if (selectedOrder && (selectedOrder.id === orderId || selectedOrder._id === orderId || selectedOrder.orderId === orderId)) {
      setSelectedOrder((prev) => (prev ? { ...prev, orderStatus: newStatus, status: newStatus } : null));
    }

    // 2. Perform backend update silently
    try {
      const res = await api.put(`/orders/admin/${orderId}/status`, { orderStatus: newStatus });
      if (res.data && res.data.success && res.data.order) {
        const updated = res.data.order;
        setOrders((prevOrders) =>
          prevOrders.map((o) =>
            o.id === orderId || o._id === orderId || o.orderId === orderId ? { ...o, ...updated } : o
          )
        );
      }
    } catch (e) {
      console.error('Error updating order status:', e);
      alert(e.response?.data?.message || 'Unable to update order status on server.');
    }
  };

  // Live shipment tracking through the MILASTY backend (Shiprath credentials stay server-side)
  const [shipTracking, setShipTracking] = useState({ orderId: null, loading: false, data: null, error: null });
  const handleTrackShipment = async (orderId) => {
    setShipTracking({ orderId, loading: true, data: null, error: null });
    try {
      const res = await api.get(`/shiprat/order/${orderId}/tracking`);
      setShipTracking({ orderId, loading: false, data: res.data, error: null });
    } catch (e) {
      setShipTracking({ orderId, loading: false, data: null, error: e.response?.data?.message || 'Could not reach the tracking service.' });
    }
  };

  const handleCreatePickup = async (orderId) => {
    if (!orderId) return;
    setPickupLoading(true);
    setPickupNotice(null);
    try {
      const res = await api.post(`/shiprat/order/${encodeURIComponent(orderId)}/pickup`);
      if (res.data?.success) {
        setPickupNotice({ type: 'success', text: res.data.message || 'Pickup scheduled with Shiprath!' });
        if (res.data.order) {
          const updated = res.data.order;
          setSelectedOrder((prev) => ({ ...prev, ...updated }));
          setOrders((prev) => prev.map((o) => (o.id === orderId || o._id === orderId || o.order_number === orderId ? { ...o, ...updated } : o)));
        } else {
          fetchOrders();
        }
      } else {
        setPickupNotice({ type: 'error', text: res.data?.message || 'Pickup request was rejected.' });
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Error creating pickup request.';
      setPickupNotice({ type: 'error', text: msg });
    } finally {
      setPickupLoading(false);
    }
  };

  const handleRetryLabel = async (orderId) => {
    if (!orderId) return;
    setLabelLoading(true);
    try {
      const res = await api.post(`/shiprat/order/${encodeURIComponent(orderId)}/retry-label`);
      if (res.data?.success && res.data.shipping_label_url) {
        const patch = {
          shipping_label_url: res.data.shipping_label_url,
          shipping_label_status: 'generated',
        };
        setSelectedOrder((prev) => ({
          ...prev,
          ...patch,
          shipment_booking_response: {
            ...(prev.shipment_booking_response || {}),
            label: res.data.shipping_label_url,
            label_status: 'generated',
            shipping_label_url: res.data.shipping_label_url,
          },
        }));
        setOrders((prev) => prev.map((o) => (o.id === orderId || o._id === orderId || o.order_number === orderId ? { ...o, ...patch } : o)));
      } else {
        alert(res.data?.message || 'Could not generate label.');
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Error generating label.');
    } finally {
      setLabelLoading(false);
    }
  };

  const handleConfirmReset = async () => {
    if (!selectedOrder) return;
    const orderId = selectedOrder.id || selectedOrder._id || selectedOrder.order_number;
    if (!resetReason.trim()) {
      setResetError('Please enter a reason for resetting the shipment.');
      return;
    }

    setResetLoading(true);
    setResetError(null);
    try {
      const res = await api.post(`/shiprat/order/${encodeURIComponent(orderId)}/reset-shipment`, {
        reason: resetReason.trim(),
      });
      if (res.data?.success) {
        const updated = res.data.order;
        if (updated) {
          setSelectedOrder((prev) => ({ ...prev, ...updated }));
          setOrders((prev) => prev.map((o) => (o.id === orderId || o._id === orderId || o.order_number === orderId ? { ...o, ...updated } : o)));
        } else {
          await fetchOrders();
        }
        setShowResetModal(false);
        setResetReason('');
      } else {
        setResetError(res.data?.message || 'Failed to reset shipment.');
      }
    } catch (err) {
      setResetError(err.response?.data?.message || err.message || 'Error resetting shipment.');
    } finally {
      setResetLoading(false);
    }
  };

  // Called by CreateShipmentDialog: update the row / modal immediately, then re-sync from the server
  const handleShipmentCreated = (orderId, result) => {
    if (result?.success) {
      const patch = {
        awb_number: result.awb || null,
        awb: result.awb || null,
        courier_name: result.courier_name || 'Shiprath Partner',
        shipment_status: 'booked',
        shipment_error: null,
        orderStatus: 'Packed',
        status: 'Packed',
        order_status: 'packed',
      };
      setOrders((prev) => prev.map((o) => ((o.id === orderId || o._id === orderId) ? { ...o, ...patch } : o)));
      setSelectedOrder((prev) => (prev && (prev.id === orderId || prev._id === orderId) ? { ...prev, ...patch } : prev));
    }
    fetchOrders();
  };


  const parseAddress = (addr, orderObj) => {
    const raw = addr || (orderObj ? (orderObj.shipping_address || orderObj.deliveryAddress || orderObj.delivery_address || orderObj.address) : null);
    if (!raw) return { line: 'N/A', city: '', state: '', pin: '' };
    if (typeof raw === 'object' && raw !== null) {
      const line = [raw.building, raw.addressLine || raw.address || raw.street].filter(Boolean).join(', ');
      return {
        line: line || 'Address provided',
        city: raw.city || '',
        state: raw.state || '',
        pin: raw.pincode || raw.pin || raw.zip || '',
      };
    }
    const str = String(raw);
    const pinMatch = str.match(/\b\d{6}\b/);
    return {
      line: str,
      city: '',
      state: '',
      pin: pinMatch ? pinMatch[0] : '',
    };
  };

  const filteredOrders = orders.filter((o) => {
    // Payment filter
    if (paymentFilter) {
      const payStatus = (o.paymentStatus || o.payment_status || 'pending').toLowerCase();
      const payMethod = (o.paymentMethod || o.payment_method || 'cod').toLowerCase();
      if (paymentFilter === 'paid' && payStatus !== 'paid') return false;
      if (paymentFilter === 'pending' && payStatus !== 'pending') return false;
      if (paymentFilter === 'razorpay' && !payMethod.includes('razorpay')) return false;
      if (paymentFilter === 'cod' && !(payMethod.includes('cod') || payMethod.includes('cash'))) return false;
    }

    // Customization filter
    if (customizationFilter) {
      const items = o.items || o.order_items || [];
      const hasNotesOnOrder = Boolean((o.notes || o.special_instructions || '').trim());
      const customizedCount = items.filter((i) => (i.customization_note || i.customizationNote || i.instruction || i.notes || '').trim().length > 0).length;
      const isCustomized = customizedCount > 0 || hasNotesOnOrder;
      if (customizationFilter === 'customized' && !isCustomized) return false;
      if (customizationFilter === 'not_customized' && isCustomized) return false;
    }

    // Shipment filter
    if (shipmentFilter) {
      const hasAwb = Boolean(o.awb_number || o.awb);
      if (shipmentFilter === 'booked' && !hasAwb) return false;
      if (shipmentFilter === 'pending' && hasAwb) return false;
    }

    // Text search (client-side)
    if (search) {
      const q = search.toLowerCase();
      const orderNum = (o.orderNumber || o.orderId || '').toLowerCase();
      const name = (o.customerName || '').toLowerCase();
      const email = (o.customerEmail || '').toLowerCase();
      const phone = (o.customerPhone || '').toLowerCase();
      const awb = (o.awb_number || o.awb || '').toLowerCase();
      if (!orderNum.includes(q) && !name.includes(q) && !email.includes(q) && !phone.includes(q) && !awb.includes(q)) return false;
    }

    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Header Area */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <p style={{ fontSize: '0.68rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.07em', color: '#665A52', margin: '0 0 0.2rem 0' }}>
            Orders Management
          </p>
          <h2 style={{ fontSize: 'clamp(1.15rem, 2.5vw, 1.45rem)', fontFamily: 'var(--font-serif)', color: '#21150F', fontWeight: '800', margin: 0, lineHeight: '1.25' }}>
            Orders Log & Tracking
          </h2>
          <p style={{ color: '#4A3B2E', fontSize: '0.8rem', margin: '0.2rem 0 0 0', fontWeight: '500' }}>
            Monitor live customer purchases, verify payment status, and dispatch e-commerce packages.
          </p>
        </div>

        <button onClick={fetchOrders} className="admin-btn-secondary">
          <RefreshCw size={14} />
          <span>Refresh Log</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flexGrow: 1, maxWidth: '380px' }}>
          <Search size={16} color="#665A52" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Order #, customer name, email, phone..."
            className="admin-input admin-search-input"
            style={{ paddingLeft: '2.75rem' }}
          />
        </div>

        {/* Order Status Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Filter size={15} color="#665A52" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="admin-input"
            style={{ width: 'auto', paddingRight: '2rem' }}
          >
            <option value="">All Lifecycle Statuses</option>
            {STAGES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Payment Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <CreditCard size={15} color="#665A52" />
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="admin-input"
            style={{ width: 'auto', paddingRight: '2rem' }}
          >
            <option value="">All Payment Types</option>
            <option value="paid">Paid Orders</option>
            <option value="pending">Pending Payment</option>
            <option value="razorpay">Razorpay Prepaid</option>
            <option value="cod">Cash on Delivery</option>
          </select>
        </div>

        {/* Customization Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Sparkles size={15} color="#665A52" />
          <select
            value={customizationFilter}
            onChange={(e) => setCustomizationFilter(e.target.value)}
            className="admin-input"
            style={{ width: 'auto', paddingRight: '2rem' }}
          >
            <option value="">All Customization</option>
            <option value="customized">Customized Items</option>
            <option value="not_customized">No Customization</option>
          </select>
        </div>

        {/* Shipment Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Truck size={15} color="#665A52" />
          <select
            value={shipmentFilter}
            onChange={(e) => setShipmentFilter(e.target.value)}
            className="admin-input"
            style={{ width: 'auto', paddingRight: '2rem' }}
          >
            <option value="">All Shipments</option>
            <option value="booked">AWB Booked ✅</option>
            <option value="pending">Awaiting Shipment ⚠️</option>
          </select>
        </div>
      </div>

      {/* Main Orders Table */}
      <div className="admin-table-container">
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem', gap: '1rem' }}>
            <RefreshCw size={20} className="animate-spin" color="#C68A3A" />
            <span style={{ fontSize: '0.82rem', color: '#665A52', fontWeight: '600' }}>Loading orders log...</span>
          </div>
        ) : filteredOrders.length > 0 ? (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Customer</th>
                <th>Delivery Location</th>
                <th>Payment</th>
                <th>Amount</th>
                <th>Shipment / AWB</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((o) => {
                const orderNum = o.orderNumber || o.orderId || (o.id ? `MIL-${String(o.id).slice(-6)}` : 'N/A');
                const custName = o.customerName || o.user?.name || 'Customer';
                const custEmail = o.customerEmail || o.user?.email || '';
                const custPhone = o.customerPhone || o.user?.phone || '';
                const addrObj = parseAddress(o.shippingAddress, o);
                const pin = o.pincode || addrObj.pin;
                const fee = o.deliveryFee !== undefined ? o.deliveryFee : 0;
                const total = o.grandTotal || o.totalAmount || 0;

                const rawStatus = (o.orderStatus || o.status || 'confirmed').toLowerCase();
                const displayStatus = STATUS_DISPLAY_MAP[rawStatus] || rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1);

                let statusBadgeClass = 'admin-badge-neutral';
                if (displayStatus === 'Delivered') statusBadgeClass = 'admin-badge-success';
                else if (displayStatus === 'Cancelled') statusBadgeClass = 'admin-badge-danger';
                else if (['Pending', 'Confirmed', 'Processing', 'Packed', 'Shipped', 'Out for Delivery'].includes(displayStatus)) statusBadgeClass = 'admin-badge-warning';

                const payStatus = (o.paymentStatus || o.payment_status || 'pending').toLowerCase();
                const payMethod = o.paymentMethod || o.payment_method || 'Cash on Delivery';

                const orderItemsList = o.items || o.order_items || [];
                const customizedCount = orderItemsList.filter((i) => (i.customization_note || i.customizationNote || i.instruction || i.notes || '').trim().length > 0).length || (o.notes ? 1 : 0);

                return (
                  <tr key={o.id || o._id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: '800', color: '#21150F', whiteSpace: 'nowrap' }}>
                      <div>{orderNum}</div>
                      <div style={{ fontSize: '0.72rem', color: '#665A52', fontFamily: 'inherit', fontWeight: '600', marginTop: '0.2rem' }}>
                        {formatDateTime(o.createdAt || o.created_at)}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: '700', color: '#21150F' }}>{custName}</div>
                      <div style={{ fontSize: '0.74rem', color: '#665A52' }}>
                        {custEmail || custPhone || 'No contact provided'}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.82rem', fontWeight: '600', color: '#21150F', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {addrObj.line}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#665A52', display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: '700', color: '#C68A3A' }}>{pin ? `PIN: ${pin}` : 'No PIN'}</span>
                        • Fee: {Number(fee) === 0 ? <strong style={{ color: '#22c55e' }}>FREE</strong> : `₹${fee}`}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.82rem', fontWeight: '600', color: '#4A3B2E' }}>{payMethod}</div>
                      <span className={`admin-badge ${payStatus === 'paid' ? 'admin-badge-success' : 'admin-badge-warning'}`} style={{ fontSize: '0.72rem' }}>
                        {payStatus === 'paid' ? '✓ Paid' : 'Pending'}
                      </span>
                    </td>
                    <td style={{ fontWeight: '800', color: '#21150F' }}>
                      ₹{total.toLocaleString('en-IN')}
                    </td>
                    <td>
                      {(o.awb_number || o.awb) ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                          {isShipmentCancelled(o) ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', fontWeight: '800', color: '#B91C1C', background: 'rgba(239,68,68,0.1)', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                              <X size={11} /> AWB Cancelled
                            </span>
                          ) : (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', fontWeight: '800', color: '#2F7D32', background: 'rgba(34,197,94,0.1)', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                              <CheckCircle2 size={11} /> AWB Booked
                            </span>
                          )}
                          <code style={{ fontSize: '0.72rem', color: '#381423', fontFamily: 'monospace', letterSpacing: '0.03em' }}>{o.awb_number || o.awb}</code>
                          {o.courier_name && <span style={{ fontSize: '0.68rem', color: '#665A52' }}>{o.courier_name}</span>}
                        </div>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', fontWeight: '700', color: '#B7791F', background: 'rgba(234,179,8,0.1)', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                          <AlertCircle size={11} /> Not Booked
                        </span>
                      )}
                    </td>
                    <td>
                      {/* Two separate status badges: Payment + Shipment */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        <span className={`admin-badge ${statusBadgeClass}`} style={{ fontSize: '0.72rem' }}>
                          {displayStatus}
                        </span>
                        {(() => {
                          const [label, color, bg] = shipmentStatusInfo(o);
                          return <span title={o.shipment_error || ''} style={{ fontSize: '0.68rem', fontWeight: '700', color, background: bg, padding: '0.1rem 0.4rem', borderRadius: '4px', whiteSpace: 'nowrap' }}>{label}</span>;
                        })()}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', alignItems: 'center', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => setSelectedOrder(o)}
                          className="admin-btn-secondary"
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                          title="View Order Details"
                        >
                          <Eye size={13} />
                          <span>View</span>
                        </button>
                        {canCreateShipment(o) && (
                          <button
                            onClick={() => setShipDialogOrderId(o.id || o._id)}
                            className="admin-btn-secondary"
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.72rem', background: '#381423', color: '#D4AF37', border: 'none' }}
                            title={o.shipment_error || 'Create the Shiprath shipment once this order is packed'}
                          >
                            <Truck size={12} />
                            <span>{String(o.shipment_status || '').toLowerCase() === 'failed' ? 'Retry Shipment' : 'Create Shipment'}</span>
                          </button>
                        )}
                        <select
                          value={displayStatus}
                          onChange={(e) => handleStatusChange(o.id || o._id, e.target.value)}
                          className="admin-input"
                          style={{ width: 'auto', padding: '0.28rem 0.5rem', fontSize: '0.75rem' }}
                        >
                          {STAGES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="admin-empty-state">
            <div className="admin-empty-icon">
              <Filter size={24} />
            </div>
            <h3 style={{ fontSize: '1.1rem', color: '#21150F', margin: 0, fontWeight: '800' }}>No orders found</h3>
            <p style={{ fontSize: '0.85rem', color: '#665A52', margin: 0 }}>No store orders matching your current query filters.</p>
          </div>
        )}
      </div>

      {shipDialogOrderId && (
        <CreateShipmentDialog
          orderId={shipDialogOrderId}
          onClose={() => setShipDialogOrderId(null)}
          onCreated={(result) => handleShipmentCreated(shipDialogOrderId, result)}
        />
      )}

      {/* ORDER DETAILS MODAL */}
      {selectedOrder && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(6px)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
        }}>
          <div className="admin-card" style={{
            width: '100%',
            maxWidth: '680px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '1.75rem',
            position: 'relative',
            borderRadius: '16px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(231, 222, 213, 0.65)', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <span style={{ fontSize: '0.68rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#C68A3A' }}>
                  Order Details Breakdown
                </span>
                <h3 style={{ fontSize: '1.3rem', fontFamily: 'var(--font-serif)', color: '#21150F', margin: '0.1rem 0 0 0', fontWeight: '800' }}>
                  {selectedOrder.orderNumber || selectedOrder.orderId || `MIL-${String(selectedOrder.id).slice(-6)}`}
                </h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  onClick={() => setShowPrintView(true)}
                  className="admin-btn-secondary"
                  style={{ padding: '0.4rem 0.75rem', fontSize: '0.78rem', background: '#2F7D32', color: '#FFF', border: 'none' }}
                  title="Print Preparation & Packing Slip"
                >
                  <Printer size={14} />
                  <span>Print Prep Slip</span>
                </button>
                <button
                  onClick={() => setSelectedOrder(null)}
                  style={{ background: 'none', border: 'none', color: '#665A52', cursor: 'pointer', padding: '4px' }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Customer & Shipping Summary Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
              <div style={{ background: 'rgba(252, 250, 247, 0.7)', border: '1px solid rgba(231, 222, 213, 0.65)', borderRadius: '12px', padding: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#C68A3A', fontWeight: '700', fontSize: '0.8rem', marginBottom: '0.6rem' }}>
                  <User size={15} /> Customer Details
                </div>
                <div style={{ fontSize: '0.88rem', fontWeight: '700', color: '#21150F' }}>
                  {selectedOrder.customerName || selectedOrder.user?.name || 'Customer'}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#4A3B2E', margin: '0.2rem 0' }}>
                  <Mail size={13} style={{ display: 'inline', marginRight: '4px' }} />
                  {selectedOrder.customerEmail || selectedOrder.user?.email || 'N/A'}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#4A3B2E' }}>
                  <Phone size={13} style={{ display: 'inline', marginRight: '4px' }} />
                  {selectedOrder.customerPhone || selectedOrder.user?.phone || 'N/A'}
                </div>
              </div>

              <div style={{ background: 'rgba(252, 250, 247, 0.7)', border: '1px solid rgba(231, 222, 213, 0.65)', borderRadius: '12px', padding: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#C68A3A', fontWeight: '700', fontSize: '0.8rem', marginBottom: '0.6rem' }}>
                  <MapPin size={15} /> Delivery Address
                </div>
                {selectedOrder.recipient_name && (
                  <div style={{ fontSize: '0.8rem', color: '#2F6B3A', fontWeight: '700', backgroundColor: '#EAEFE5', borderRadius: '8px', padding: '0.4rem 0.6rem', marginBottom: '0.5rem' }}>
                    🎁 Deliver to: {selectedOrder.recipient_name} · {selectedOrder.recipient_phone}
                  </div>
                )}
                <div style={{ fontSize: '0.82rem', color: '#21150F', lineHeight: '1.4' }}>
                  {typeof selectedOrder.shippingAddress === 'object'
                    ? [selectedOrder.shippingAddress.fullName, selectedOrder.shippingAddress.building, selectedOrder.shippingAddress.addressLine, selectedOrder.shippingAddress.city, selectedOrder.shippingAddress.state].filter(Boolean).join(', ')
                    : selectedOrder.shippingAddress || 'N/A'}
                </div>
                <div style={{ fontSize: '0.78rem', fontWeight: '700', color: '#C68A3A', marginTop: '0.4rem' }}>
                  PIN: {selectedOrder.pincode || (typeof selectedOrder.shippingAddress === 'object' ? selectedOrder.shippingAddress.pincode : 'N/A')}
                </div>
              </div>
            </div>

            {/* Payment & Status Banner */}
            <div style={{ background: 'rgba(252, 250, 247, 0.7)', border: '1px solid rgba(231, 222, 213, 0.65)', borderRadius: '12px', padding: '1rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: '#665A52', textTransform: 'uppercase', fontWeight: '700' }}>Payment Information</span>
                <div style={{ fontSize: '0.9rem', fontWeight: '800', color: '#21150F', marginTop: '0.1rem' }}>
                  {selectedOrder.paymentMethod || selectedOrder.payment_method || 'Cash on Delivery'}
                  <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', fontWeight: '700', padding: '2px 8px', borderRadius: '999px', background: (selectedOrder.paymentStatus || selectedOrder.payment_status) === 'paid' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(234, 179, 8, 0.15)', color: (selectedOrder.paymentStatus || selectedOrder.payment_status) === 'paid' ? '#22c55e' : '#eab308' }}>
                    {(selectedOrder.paymentStatus || selectedOrder.payment_status || 'pending').toUpperCase()}
                  </span>
                </div>
                {selectedOrder.paymentId && (
                  <div style={{ fontSize: '0.72rem', fontFamily: 'monospace', color: '#665A52', marginTop: '0.2rem' }}>
                    Payment ID: {selectedOrder.paymentId}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#4A3B2E' }}>Status:</span>
                <select
                  value={STATUS_DISPLAY_MAP[(selectedOrder.orderStatus || selectedOrder.status || 'confirmed').toLowerCase()] || 'Confirmed'}
                  onChange={(e) => handleStatusChange(selectedOrder.id || selectedOrder._id, e.target.value)}
                  className="admin-input"
                  style={{ width: 'auto', padding: '0.4rem 0.75rem', fontSize: '0.8rem', fontWeight: '700' }}
                >
                  {STAGES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Order Timestamps & Critical Dates Section */}
            <div style={{ background: '#FFFDF9', border: '1px solid rgba(231, 222, 213, 0.85)', borderRadius: '12px', padding: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.72rem', color: '#C68A3A', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '0.06em', marginBottom: '0.6rem' }}>
                Order Timestamps &amp; Delivery Window
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem 1.25rem', fontSize: '0.82rem' }}>
                <div>
                  <span style={{ color: '#665A52', display: 'block', fontSize: '0.72rem' }}>Order Placed:</span>
                  <strong style={{ color: '#21150F' }}>{formatDateTime(selectedOrder.createdAt || selectedOrder.created_at)}</strong>
                </div>
                <div>
                  <span style={{ color: '#665A52', display: 'block', fontSize: '0.72rem' }}>Payment Transaction:</span>
                  <strong style={{ color: (selectedOrder.paymentStatus || selectedOrder.payment_status) === 'paid' ? '#2F7D32' : '#B7791F' }}>
                    {String(selectedOrder.paymentMethod || selectedOrder.payment_method || '').toLowerCase().includes('cod')
                      ? 'Not applicable (Cash on Delivery)'
                      : (selectedOrder.paidAt || selectedOrder.paid_at
                          ? formatDateTime(selectedOrder.paidAt || selectedOrder.paid_at)
                          : ((selectedOrder.paymentStatus || selectedOrder.payment_status) === 'paid' ? 'Completed at checkout' : 'Pending verification'))}
                  </strong>
                </div>
                <div>
                  <span style={{ color: '#665A52', display: 'block', fontSize: '0.72rem' }}>Estimated Delivery:</span>
                  <strong style={{ color: '#2F7D32' }}>
                    Estimated by {calculateEstimatedDeliveryDate(selectedOrder.createdAt || selectedOrder.created_at, 9)} (9 days)
                  </strong>
                </div>
                <div>
                  <span style={{ color: '#665A52', display: 'block', fontSize: '0.72rem' }}>Shipment Booking:</span>
                  <strong style={{ color: '#21150F' }}>
                    {selectedOrder.shipment_booked_at ? formatDateTime(selectedOrder.shipment_booked_at) : 'Not booked yet'}
                  </strong>
                </div>
              </div>
            </div>

            {/* Cancellation / refund / shipment-cancel state (managed on the Cancellations & Refunds page) */}
            {selectedOrder.cancellation && (
              <div style={{ background: '#FFF6EE', border: '1px solid #F0C9A8', borderRadius: '12px', padding: '1rem', marginBottom: '1.25rem', fontSize: '0.82rem', color: '#7A3E12' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <strong style={{ fontSize: '0.88rem', color: '#C62828' }}>⚠️ Cancelled by Customer</strong>
                  <a href="/admin/cancellations" style={{ fontWeight: '800', color: '#5A2E16', fontSize: '0.78rem' }}>Manage in Cancellations &amp; Refunds →</a>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.4rem 0.85rem', fontSize: '0.78rem' }}>
                  <div>Cancelled At: <strong>{formatDateTime(selectedOrder.cancellation.requested_at || selectedOrder.cancellation.requestedAt)}</strong></div>
                  <div>10% Charge: <strong style={{ color: '#C62828' }}>−{formatInr(selectedOrder.cancellation.cancellation_charge ?? selectedOrder.cancellation.cancellationCharge ?? (selectedOrder.grandTotal * 0.1))}</strong></div>
                  <div>90% Refund: <strong style={{ color: '#2F7D32' }}>{formatInr(selectedOrder.cancellation.refund_amount ?? selectedOrder.cancellation.refundAmount)}</strong></div>
                  <div>Refund Status: <strong>{String(selectedOrder.cancellation.refund_status || selectedOrder.cancellation.refundStatus).replace(/_/g, ' ').toUpperCase()}</strong></div>
                  {(selectedOrder.cancellation.refund_reference || selectedOrder.cancellation.refundReference) && (
                    <div>Refund Ref: <code>{selectedOrder.cancellation.refund_reference || selectedOrder.cancellation.refundReference}</code></div>
                  )}
                  {(selectedOrder.cancellation.refund_processed_at || selectedOrder.cancellation.refundProcessedAt) && (
                    <div>Refund Processed: {formatDateTime(selectedOrder.cancellation.refund_processed_at || selectedOrder.cancellation.refundProcessedAt)}</div>
                  )}
                </div>
                {selectedOrder.cancellation.shipment_cancel_error && (
                  <div style={{ color: '#C62828', marginTop: '0.4rem', fontSize: '0.74rem' }}>
                    Shipment cancellation error: {selectedOrder.cancellation.shipment_cancel_error}
                  </div>
                )}
              </div>
            )}

            {/* Previous Shipment History Section (Preserved snapshot when reset) */}
            {(() => {
              const history = Array.isArray(selectedOrder.shipment_history) && selectedOrder.shipment_history.length > 0
                ? selectedOrder.shipment_history
                : (Array.isArray(selectedOrder.shipment_booking_response?.history) ? selectedOrder.shipment_booking_response.history : []);

              if (!history || history.length === 0) return null;

              return (
                <div style={{
                  background: '#FFF9F5',
                  border: '1px solid #FED7AA',
                  borderRadius: '12px',
                  padding: '1rem',
                  marginBottom: '1.25rem',
                }}>
                  <div style={{
                    fontSize: '0.74rem',
                    textTransform: 'uppercase',
                    fontWeight: '800',
                    color: '#9A3412',
                    letterSpacing: '0.05em',
                    marginBottom: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}>
                    <RotateCcw size={14} color="#EA580C" />
                    <span>Previous Shipment History ({history.length})</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {[...history].reverse().map((entry, idx) => {
                      const oldAwb = entry.awb || entry.awb_number || 'N/A';
                      const oldCourier = entry.courier_name || entry.booked_service_name || 'Shiprath Partner';
                      const prevPickupStatus = entry.pickup_status || 'not_created';
                      const resetReason = entry.reset_reason || 'N/A';
                      const resetDate = entry.reset_at ? formatDateTime(entry.reset_at) : 'N/A';
                      const resetAdmin = entry.reset_by_admin_email || entry.reset_by_admin_id || 'Admin';

                      return (
                        <div
                          key={idx}
                          style={{
                            backgroundColor: '#FFFFFF',
                            borderRadius: '8px',
                            padding: '0.75rem 0.85rem',
                            border: '1px solid #FDBA74',
                            fontSize: '0.78rem',
                          }}
                        >
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.4rem 1rem' }}>
                            <div>
                              <span style={{ color: '#786C63', fontSize: '0.72rem' }}>Old AWB: </span>
                              <code style={{ background: '#F8FAFC', padding: '0.1rem 0.35rem', borderRadius: '4px', fontWeight: '700', color: '#9A3412' }}>
                                {oldAwb}
                              </code>
                            </div>
                            <div>
                              <span style={{ color: '#786C63', fontSize: '0.72rem' }}>Old Courier: </span>
                              <strong style={{ color: '#2C1810' }}>{oldCourier}</strong>
                            </div>
                            <div>
                              <span style={{ color: '#786C63', fontSize: '0.72rem' }}>Previous Pickup Status: </span>
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                padding: '0.1rem 0.45rem',
                                borderRadius: '999px',
                                fontSize: '0.7rem',
                                fontWeight: '800',
                                ...getPickupBadgeStyle(prevPickupStatus),
                              }}>
                                {getPickupStatusLabel(prevPickupStatus)}
                              </span>
                            </div>
                            <div>
                              <span style={{ color: '#786C63', fontSize: '0.72rem' }}>Reset At: </span>
                              <span style={{ color: '#4A3B2E' }}>{resetDate} ({resetAdmin})</span>
                            </div>
                          </div>

                          <div style={{ marginTop: '0.45rem', paddingTop: '0.45rem', borderTop: '1px dashed #FED7AA', display: 'flex', gap: '0.4rem', alignItems: 'baseline' }}>
                            <span style={{ color: '#9A3412', fontWeight: '700', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                              Reset Reason:
                            </span>
                            <span style={{ color: '#21150F', fontStyle: 'italic', fontSize: '0.78rem' }}>
                              "{resetReason}"
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Shipment & AWB Details Banner */}
            <div style={{ background: 'rgba(252, 250, 247, 0.7)', border: '1px solid rgba(231, 222, 213, 0.65)', borderRadius: '12px', padding: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#665A52', textTransform: 'uppercase', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Truck size={14} color="#C68A3A" />
                    <span>Shiprath B2C Courier Booking</span>
                  </div>
                  {(selectedOrder.awb_number || selectedOrder.awb) ? (
                    <div style={{ marginTop: '0.35rem', fontSize: '0.88rem', fontWeight: '700', color: '#21150F' }}>
                      AWB: <code style={{ backgroundColor: '#F8FAFC', padding: '0.15rem 0.45rem', borderRadius: '4px', color: '#381423' }}>{selectedOrder.awb_number || selectedOrder.awb}</code>
                      {selectedOrder.courier_name && <span style={{ marginLeft: '0.5rem', color: '#665A52', fontSize: '0.8rem' }}>({selectedOrder.courier_name})</span>}
                    </div>
                  ) : (
                    <div style={{ marginTop: '0.25rem', fontSize: '0.82rem', color: '#B7791F', fontWeight: '600' }}>
                      Current Shipment: Not Created
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {(selectedOrder.awb_number || selectedOrder.awb) ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleTrackShipment(selectedOrder.id || selectedOrder._id)}
                        disabled={shipTracking.loading}
                        style={{ padding: '0.45rem 0.85rem', borderRadius: '8px', backgroundColor: '#381423', color: '#FFF', border: 'none', fontSize: '0.78rem', fontWeight: '700', cursor: shipTracking.loading ? 'wait' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                      >
                        <Truck size={13} />
                        <span>{shipTracking.loading ? 'Tracking...' : 'Track Shipment'}</span>
                      </button>

                      {canResetShipment(selectedOrder) && (
                        <button
                          type="button"
                          onClick={() => {
                            setResetReason('');
                            setResetError(null);
                            setShowResetModal(true);
                          }}
                          style={{
                            padding: '0.45rem 0.85rem',
                            borderRadius: '8px',
                            backgroundColor: '#FEF2F2',
                            color: '#991B1B',
                            border: '1px solid #FECACA',
                            fontSize: '0.78rem',
                            fontWeight: '700',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                          }}
                          title="Courier returned without collecting package? Reset fulfilment to create a new shipment."
                        >
                          <RotateCcw size={13} color="#991B1B" />
                          <span>RESET SHIPMENT TO PROCESSING</span>
                        </button>
                      )}
                    </>
                  ) : canCreateShipment(selectedOrder) ? (
                    <button
                      onClick={() => setShipDialogOrderId(selectedOrder.id || selectedOrder._id)}
                      style={{ padding: '0.5rem 1rem', borderRadius: '8px', backgroundColor: '#381423', color: '#D4AF37', border: 'none', fontSize: '0.82rem', fontWeight: '800', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                    >
                      <Zap size={14} color="#D4AF37" />
                      <span>{String(selectedOrder.shipment_status || '').toLowerCase() === 'failed' ? 'Retry Shipment' : 'Create Shipment'}</span>
                    </button>
                  ) : (
                    <span style={{ fontSize: '0.78rem', color: '#665A52', fontWeight: '600' }}>
                      {String(selectedOrder.shipment_status || '').toLowerCase() === 'creating'
                        ? 'Shipment creation in progress…'
                        : String(selectedOrder.rawPaymentMethod || selectedOrder.payment_method || '').toLowerCase() === 'cod'
                          ? 'COD order — book manually in the Shiprath panel'
                          : shipmentStatusInfo(selectedOrder)[0]}
                    </span>
                  )}
                </div>
              </div>

              {/* Live tracking result (fetched via MILASTY backend → Shiprath shipment_tracking API) */}
              {(selectedOrder.awb_number || selectedOrder.awb) && shipTracking.orderId === (selectedOrder.id || selectedOrder._id) && !shipTracking.loading && (
                <div style={{ marginTop: '0.85rem', paddingTop: '0.85rem', borderTop: '1px solid rgba(231, 222, 213, 0.65)', fontSize: '0.8rem', color: '#21150F' }}>
                  {shipTracking.data?.tracking_live ? (
                    <>
                      <div style={{ fontWeight: '700', marginBottom: '0.4rem' }}>
                        Shipment status: <span style={{ color: '#2F6B3A' }}>{String(shipTracking.data.shipment_status || '—').replace(/_/g, ' ').toUpperCase()}</span>
                        {shipTracking.data.tracking?.estimated_delivery && (
                          <span style={{ marginLeft: '0.6rem', color: '#665A52', fontWeight: '600' }}>EDD: {shipTracking.data.tracking.estimated_delivery}</span>
                        )}
                      </div>
                      {(shipTracking.data.tracking?.shipment_track || []).length > 0 ? (
                        <ul style={{ margin: 0, paddingLeft: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                          {shipTracking.data.tracking.shipment_track.map((ev, i) => (
                            <li key={i}>
                              <strong>{ev.activity || 'Update'}</strong>
                              {ev.location && <span style={{ color: '#665A52' }}> — {ev.location}</span>}
                              {ev.date && <span style={{ color: '#8A7B70' }}> · {ev.date}</span>}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div style={{ color: '#665A52' }}>No scan events from the courier yet.</div>
                      )}
                    </>
                  ) : (
                    <div style={{ color: '#B7791F', fontWeight: '600' }}>
                      {shipTracking.error || 'Live tracking is not available from Shiprath right now.'}
                    </div>
                  )}
                  <div style={{ marginTop: '0.6rem', color: '#665A52' }}>
                    You can also track AWB <code>{selectedOrder.awb_number || selectedOrder.awb}</code> on{' '}
                    <a href="https://shiprath.com/" target="_blank" rel="noopener noreferrer" style={{ color: '#381423', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                      shiprath.com <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              )}

              {/* Post-Shipment Operations: Pickup & Shipping Slip Section */}
              {(() => {
                const so = selectedOrder;
                const hasShipment = Boolean(so.awb_number || so.awb || String(so.shipment_status || '').toLowerCase() === 'booked');
                if (!hasShipment) return null;

                const activeAwb = String(so.awb_number || so.awb || '').trim();
                const activeShipmentId = String(so.shipment_id || so.shipment_booking_response?.shipment_id || '').trim();

                const storedPickup = so.shipment_booking_response?.pickup;
                const storedPickupAwb = String(
                  storedPickup?.awb ||
                  storedPickup?.awb_number ||
                  so.pickup_response?.awb ||
                  so.pickup_response?.awb_number ||
                  so.pickup_confirmation_ref ||
                  ''
                ).trim();

                const storedPickupShipmentId = String(
                  storedPickup?.shipment_id ||
                  so.pickup_response?.shipment_id ||
                  ''
                ).trim();

                // Strict matching rules:
                // 1. Both active AWB and stored pickup AWB must exist and match
                // 2. Missing AWB must not automatically count as a match
                // 3. If both stored and active shipment IDs are present, they must also match
                // 4. Missing shipment ID must not override an AWB mismatch
                const awbMatches = Boolean(activeAwb && storedPickupAwb && activeAwb.toLowerCase() === storedPickupAwb.toLowerCase());
                const shipmentIdMatches = (!activeShipmentId || !storedPickupShipmentId) ||
                  (activeShipmentId.toLowerCase() === storedPickupShipmentId.toLowerCase());
                const isSameShipment = awbMatches && shipmentIdMatches;

                const rawPickupStatus = so.pickup_status || so.shipment_booking_response?.pickup?.status || storedPickup?.status;
                const pickupStatus = (rawPickupStatus && isSameShipment) ? String(rawPickupStatus).toLowerCase() : 'not_created';
                const pickupRequestId = isSameShipment ? (so.pickup_request_id || storedPickup?.request_id) : null;
                const pickupDate = isSameShipment ? (so.pickup_scheduled_date || storedPickup?.scheduled_date) : null;
                const pickupRef = isSameShipment ? (so.pickup_confirmation_ref || storedPickup?.confirmation_ref) : null;
                const pickupError = isSameShipment ? (so.pickup_error || storedPickup?.error) : null;

                const labelUrl = so.shipping_label_url ||
                  so.shipment_booking_response?.label ||
                  so.shipment_booking_response?.shipping_label_url ||
                  so.shipment_booking_response?.data?.label;

                const labelStatus = so.shipping_label_status || (labelUrl ? 'generated' : (so.shipment_booking_response?.label_status || 'not_generated'));

                return (
                  <div style={{ marginTop: '0.85rem', paddingTop: '0.85rem', borderTop: '1px solid rgba(231, 222, 213, 0.65)' }}>
                    {/* 3-Column Operations Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.75rem', marginTop: '0.35rem' }}>
                      
                      {/* 1. Shipment Information */}
                      <div style={{ background: '#FFFFFF', borderRadius: '8px', padding: '0.75rem', border: '1px solid #E5DCCE' }}>
                        <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: '800', color: '#8C6845', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Truck size={13} color="#C68A3A" />
                          <span>Shipment Information</span>
                        </div>
                        <div style={{ fontSize: '0.78rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <div>
                            <span style={{ color: '#786C63' }}>Courier: </span>
                            <strong style={{ color: '#2C1810' }}>{so.courier_name || so.booked_service_name || 'Shiprath Partner'}</strong>
                          </div>
                          <div>
                            <span style={{ color: '#786C63' }}>AWB: </span>
                            <code style={{ background: '#F8FAFC', padding: '0.1rem 0.35rem', borderRadius: '4px', fontSize: '0.76rem', fontWeight: '700', color: '#381423' }}>
                              {so.awb_number || so.awb}
                            </code>
                          </div>
                          <div>
                            <span style={{ color: '#786C63' }}>Shipment ID: </span>
                            <span style={{ color: '#2C1810', fontWeight: '600' }}>
                              {so.shipment_id || so.shipment_booking_response?.shipment_id || '—'}
                            </span>
                          </div>
                          <div>
                            <span style={{ color: '#786C63' }}>Status: </span>
                            <span style={{
                              display: 'inline-block',
                              padding: '0.1rem 0.4rem',
                              borderRadius: '999px',
                              fontSize: '0.7rem',
                              fontWeight: '700',
                              background: 'rgba(34,197,94,0.12)',
                              color: '#15803D'
                            }}>
                              {String(so.shipment_status || 'booked').replace(/_/g, ' ').toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 2. Pickup Information */}
                      <div style={{ background: '#FFFFFF', borderRadius: '8px', padding: '0.75rem', border: '1px solid #E5DCCE' }}>
                        <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: '800', color: '#8C6845', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Clock size={13} color="#C68A3A" />
                          <span>Pickup Information</span>
                        </div>
                        
                        <div style={{ marginBottom: '0.45rem' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            padding: '0.15rem 0.5rem',
                            borderRadius: '999px',
                            fontSize: '0.74rem',
                            fontWeight: '800',
                            ...getPickupBadgeStyle(pickupStatus)
                          }}>
                            {getPickupStatusLabel(pickupStatus)}
                          </span>
                        </div>

                        {pickupStatus === 'confirmed' ? (
                          <div style={{ fontSize: '0.76rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            {pickupRequestId && (
                              <div>
                                <span style={{ color: '#786C63' }}>Req ID: </span>
                                <code style={{ background: '#F8FAFC', padding: '0.1rem 0.35rem', borderRadius: '4px', fontSize: '0.74rem', fontWeight: '700', color: '#381423' }}>
                                  {pickupRequestId}
                                </code>
                              </div>
                            )}
                            {pickupDate && (
                              <div>
                                <span style={{ color: '#786C63' }}>Date: </span>
                                <strong style={{ color: '#2C1810' }}>
                                  {new Date(pickupDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </strong>
                              </div>
                            )}
                            {pickupRef && pickupRef !== pickupRequestId && (
                              <div>
                                <span style={{ color: '#786C63' }}>Ref: </span>
                                <span style={{ color: '#2C1810', fontWeight: '600' }}>{pickupRef}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div>
                            {pickupStatus === 'failed' && pickupError && (
                              <div style={{ fontSize: '0.72rem', color: '#DC2626', marginBottom: '0.4rem', background: '#FEF2F2', padding: '0.3rem 0.45rem', borderRadius: '4px', border: '1px solid #FCA5A5' }}>
                                <strong>Error:</strong> {pickupError}
                              </div>
                            )}

                            <button
                              type="button"
                              onClick={() => handleCreatePickup(so.id || so._id)}
                              disabled={pickupLoading}
                              style={{
                                width: '100%',
                                padding: '0.5rem 0.75rem',
                                borderRadius: '6px',
                                background: pickupLoading ? '#9CA3AF' : '#381423',
                                color: '#D4AF37',
                                border: 'none',
                                fontWeight: '800',
                                fontSize: '0.78rem',
                                cursor: pickupLoading ? 'wait' : 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.35rem',
                              }}
                            >
                              <Zap size={12} color="#D4AF37" />
                              <span>{pickupLoading ? 'Scheduling…' : (pickupStatus === 'failed' ? 'Retry Create Pickup' : 'CREATE PICKUP')}</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* 3. Shipping Documents / Slip */}
                      <div style={{ background: '#FFFFFF', borderRadius: '8px', padding: '0.75rem', border: '1px solid #E5DCCE' }}>
                        <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: '800', color: '#8C6845', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <FileText size={13} color="#C68A3A" />
                          <span>Shipping Documents</span>
                        </div>

                        <div style={{ marginBottom: '0.45rem' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            padding: '0.15rem 0.5rem',
                            borderRadius: '999px',
                            fontSize: '0.74rem',
                            fontWeight: '800',
                            background: labelUrl ? 'rgba(34,197,94,0.12)' : (labelStatus === 'failed' ? 'rgba(239,68,68,0.12)' : 'rgba(156,163,175,0.15)'),
                            color: labelUrl ? '#15803D' : (labelStatus === 'failed' ? '#DC2626' : '#6B7280'),
                          }}>
                            {labelUrl ? '✓ Slip Ready' : (labelStatus === 'failed' ? '⚠️ Slip Failed' : '⚪ Not Generated')}
                          </span>
                        </div>

                        {labelUrl ? (
                          <div>
                            <a
                              href={labelUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                width: '100%',
                                boxSizing: 'border-box',
                                padding: '0.5rem 0.75rem',
                                borderRadius: '6px',
                                background: '#15803D',
                                color: '#FFFFFF',
                                textDecoration: 'none',
                                fontWeight: '800',
                                fontSize: '0.78rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.35rem',
                              }}
                            >
                              <Download size={13} />
                              <span>DOWNLOAD SHIPPING SLIP</span>
                            </a>
                            <div style={{ marginTop: '0.3rem', fontSize: '0.68rem', color: '#786C63', textAlign: 'center' }}>
                              Shiprath official shipping label
                            </div>
                          </div>
                        ) : (
                          <div>
                            <button
                              type="button"
                              onClick={() => handleRetryLabel(so.id || so._id)}
                              disabled={labelLoading}
                              style={{
                                width: '100%',
                                padding: '0.5rem 0.75rem',
                                borderRadius: '6px',
                                background: labelLoading ? '#9CA3AF' : '#854D0E',
                                color: '#FFFFFF',
                                border: 'none',
                                fontWeight: '800',
                                fontSize: '0.76rem',
                                cursor: labelLoading ? 'wait' : 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.35rem',
                              }}
                            >
                              <RefreshCw size={12} className={labelLoading ? 'animate-spin' : ''} />
                              <span>{labelLoading ? 'Fetching Label…' : 'RETRY LABEL GENERATION'}</span>
                            </button>
                          </div>
                        )}
                      </div>

                    </div>

                    {pickupNotice && (
                      <div style={{
                        marginTop: '0.65rem',
                        padding: '0.45rem 0.75rem',
                        borderRadius: '6px',
                        fontSize: '0.78rem',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        background: pickupNotice.type === 'success' ? '#F0FDF4' : '#FEF2F2',
                        color: pickupNotice.type === 'success' ? '#166534' : '#991B1B',
                        border: `1px solid ${pickupNotice.type === 'success' ? '#BBF7D0' : '#FECACA'}`,
                      }}>
                        {pickupNotice.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                        <span>{pickupNotice.text}</span>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Internal shipping details (admin only — never shown to customers) */}
              {(() => {
                const so = selectedOrder;
                const fallbackUsed = so.booked_carrier_id && (
                  String(so.booked_carrier_id) !== String(so.selected_carrier_id ?? '') ||
                  String(so.booked_courier_id ?? '') !== String(so.selected_courier_id ?? '') ||
                  String(so.booked_product_id ?? '') !== String(so.selected_product_id ?? '')
                );
                const show = (v) => (v === null || v === undefined ? '—' : v === '' ? '"" (empty)' : String(v));
                const rows = [
                  ['Payment', `${String(so.paymentStatus || so.payment_status || '').toUpperCase()}`],
                  ['Razorpay Order ID', show(so.razorpay_order_id)],
                  ['Razorpay Payment ID', show(so.razorpay_payment_id || so.paymentId)],
                  ['Customer shipping charge', `₹${so.deliveryFee ?? so.delivery_fee ?? 0}`],
                  ['Selected courier', show(so.selected_service_name)],
                  ['Carrier ID', show(so.selected_carrier_id)],
                  ['Courier ID', show(so.selected_courier_id)],
                  ['Product ID', show(so.selected_product_id)],
                  ['Shiprath rate', so.selected_delivery_fee != null ? `₹${so.selected_delivery_fee}` : '—'],
                  ...(fallbackUsed ? [
                    ['Booked with (fallback)', show(so.booked_service_name)],
                    ['Booked carrier / courier / product', `${show(so.booked_carrier_id)} / ${show(so.booked_courier_id)} / ${show(so.booked_product_id)}`],
                    ['Booked rate', so.booked_shipping_charge != null ? `₹${so.booked_shipping_charge}` : '—'],
                  ] : []),
                  ['Package weight', so.package_weight_kg != null ? `${Number(so.package_weight_kg)} kg${so.package_is_manual ? ' (manual)' : ''}` : '—'],
                  ['Package size', so.package_length_cm != null ? `${Number(so.package_length_cm)} × ${Number(so.package_width_cm)} × ${Number(so.package_height_cm)} cm` : '—'],
                  ['Shipment status', String(so.shipment_status || 'pending').toUpperCase()],
                  ['AWB', show(so.awb_number || so.awb)],
                  ['Shiprath shipment ID', show(so.shipment_id)],
                  ['Booked at', so.shipment_booked_at ? new Date(so.shipment_booked_at).toLocaleString('en-IN') : '—'],
                ];
                const attempts = Array.isArray(so.shipment_attempts) ? so.shipment_attempts : [];
                return (
                  <div style={{ marginTop: '0.85rem', borderTop: '1px dashed rgba(231, 222, 213, 0.9)', paddingTop: '0.75rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(140px, auto) 1fr', gap: '0.3rem 0.85rem', fontSize: '0.78rem' }}>
                      {rows.map(([k, v]) => (
                        <React.Fragment key={k}>
                          <span style={{ color: '#665A52', fontWeight: '600' }}>{k}</span>
                          <code style={{ color: '#21150F', fontWeight: '700', wordBreak: 'break-all' }}>{v}</code>
                        </React.Fragment>
                      ))}
                    </div>
                    {so.shipment_error && (
                      <div style={{ marginTop: '0.6rem', padding: '0.55rem 0.7rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', fontSize: '0.76rem', color: '#991B1B', wordBreak: 'break-word' }}>
                        <strong>Shipment error:</strong> {so.shipment_error}
                      </div>
                    )}
                    {attempts.length > 0 && (
                      <details style={{ marginTop: '0.6rem', fontSize: '0.76rem' }}>
                        <summary style={{ cursor: 'pointer', fontWeight: '700', color: '#381423' }}>Booking attempts ({attempts.length})</summary>
                        <ul style={{ margin: '0.4rem 0 0', paddingLeft: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                          {attempts.map((a, i) => (
                            <li key={i} style={{ color: a.ok ? '#166534' : '#991B1B' }}>
                              {a.at ? new Date(a.at).toLocaleString('en-IN') : ''} · {a.service_name} (₹{a.quoted_charges}) · {a.ok ? 'BOOKED' : a.uncertain ? 'UNCERTAIN' : 'REJECTED'}{a.message ? ` — ${a.message}` : ''}
                            </li>
                          ))}
                        </ul>
                      </details>
                    )}
                  </div>
                );
              })()}
            </div>


            {/* Order Level Customization Summary Banner */}
            {selectedOrder.notes && (
              <div style={{
                marginBottom: '1.25rem',
                padding: '0.85rem 1rem',
                backgroundColor: 'rgba(217, 119, 6, 0.12)',
                border: '1px solid rgba(217, 119, 6, 0.35)',
                borderRadius: '12px',
                color: '#21150F',
              }}>
                <div style={{ fontSize: '0.74rem', fontWeight: '800', color: '#F59E0B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Sparkles size={14} color="#F59E0B" />
                  <span>Order Customization Summary</span>
                </div>
                <div style={{ fontSize: '0.86rem', fontWeight: '600', fontStyle: 'italic', color: '#FDE68A', lineHeight: '1.4' }}>
                  "{selectedOrder.notes}"
                </div>
              </div>
            )}

            {/* Ordered Items List */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '0.85rem', color: '#4A3B2E', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem', fontWeight: '800' }}>
                Ordered Items ({(selectedOrder.items || selectedOrder.order_items || []).length})
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {(selectedOrder.items || selectedOrder.order_items || []).map((item, idx) => {
                  const note = item.customization_note || item.customizationNote || item.instruction || item.notes;
                  return (
                    <div key={idx} style={{ padding: '0.85rem 1rem', background: 'rgba(252, 250, 247, 0.7)', border: '1px solid rgba(231, 222, 213, 0.65)', borderRadius: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <Package size={16} color="#C68A3A" />
                          <div>
                            <div style={{ fontSize: '0.88rem', fontWeight: '700', color: '#21150F' }}>
                              {item.title || item.product_title || item.product_name || 'Bakery Item'}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#665A52' }}>
                              Variant: {item.variantName || item.variant_name || item.variantWeight || item.variant_weight || 'Standard'} • Qty: {item.quantity}
                            </div>
                          </div>
                        </div>
                        <div style={{ fontSize: '0.9rem', fontWeight: '800', color: '#21150F' }}>
                          ₹{((item.totalPrice || item.total_price || (item.price * item.quantity)) || 0).toLocaleString('en-IN')}
                        </div>
                      </div>

                      {/* Customization Callout */}
                      {note ? (
                        <div style={{
                          marginTop: '0.6rem',
                          padding: '0.65rem 0.85rem',
                          background: '#FBF6EE',
                          border: '1px solid rgba(47,125,50,0.3)',
                          borderRadius: '8px',
                          color: '#3A1F14',
                        }}>
                          <div style={{ fontSize: '0.72rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#2F7D32', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '0.2rem' }}>
                            <Sparkles size={13} color="#2F7D32" /> ✦ CUSTOMER INSTRUCTION
                          </div>
                          <div style={{ fontSize: '0.85rem', fontWeight: '600', fontStyle: 'italic', color: '#2A140D', lineHeight: '1.4' }}>
                            "{note}"
                          </div>
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.72rem', color: '#665A52', marginTop: '0.4rem', fontStyle: 'italic' }}>
                          No customization requested for this product.
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Cost Breakdown */}
            <div style={{ borderTop: '1px solid rgba(231, 222, 213, 0.65)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', alignItems: 'flex-end', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '220px', color: '#4A3B2E' }}>
                <span>Subtotal:</span>
                <span>₹{(selectedOrder.subtotal || 0).toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '220px', color: '#4A3B2E' }}>
                <span>Delivery Fee:</span>
                <span>{(selectedOrder.deliveryFee || selectedOrder.delivery_fee || 0) === 0 ? <strong style={{ color: '#22c55e' }}>FREE</strong> : `₹${selectedOrder.deliveryFee || selectedOrder.delivery_fee}`}</span>
              </div>
              {(selectedOrder.discountAmount > 0 || selectedOrder.coupon_discount > 0 || selectedOrder.couponDiscount > 0) && (
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '260px', color: '#22c55e' }}>
                  <span>Discount {(selectedOrder.couponCode || selectedOrder.coupon_code) ? `(${selectedOrder.couponCode || selectedOrder.coupon_code})` : ''}:</span>
                  <span>-₹{selectedOrder.discountAmount || selectedOrder.coupon_discount || selectedOrder.couponDiscount}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '220px', fontSize: '1.1rem', fontWeight: '900', color: '#21150F', borderTop: '1px dashed rgba(231, 222, 213, 0.65)', paddingTop: '0.5rem', marginTop: '0.2rem' }}>
                <span>Grand Total:</span>
                <span>₹{(selectedOrder.grandTotal || selectedOrder.totalAmount || 0).toLocaleString('en-IN')}</span>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* PRINT / PREPARATION SLIP MODAL */}
      {selectedOrder && showPrintView && createPortal(
        <div className="print-slip-portal" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(8px)',
          zIndex: 100000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
        }}>
          {/* Print only the slip, on a single page (the admin page behind it is hidden when printing) */}
          <style>{`
            @media print {
              @page { size: A4; margin: 10mm; }
              body > *:not(.print-slip-portal) { display: none !important; }
              html, body { height: auto !important; overflow: visible !important; background: #FFFFFF !important; }
              .print-slip-portal { position: static !important; inset: auto !important; padding: 0 !important; background: none !important; backdrop-filter: none !important; display: block !important; }
              .print-slip-sheet { max-width: none !important; max-height: none !important; overflow: visible !important; box-shadow: none !important; border-radius: 0 !important; padding: 0 !important; }
              .print-slip-sheet * { break-inside: avoid; }
              .print-slip-actions { display: none !important; }
            }
          `}</style>
          <div className="print-slip-sheet" style={{
            background: '#FFFFFF',
            color: '#3A1F14',
            width: '100%',
            maxWidth: '560px',
            maxHeight: '92vh',
            overflowY: 'auto',
            padding: '2rem',
            borderRadius: '16px',
            boxShadow: '0 25px 50px rgba(0,0,0,0.6)',
            fontFamily: 'monospace, sans-serif',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #3A1F14', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: '900', margin: 0, color: '#3A1F14' }}>MILASTY — ORDER PREPARATION & PACKING SLIP</h2>
                <div style={{ fontSize: '0.82rem', fontWeight: '700', color: '#2F7D32', marginTop: '0.2rem' }}>
                  {selectedOrder.orderNumber || selectedOrder.orderId || `MIL-${String(selectedOrder.id).slice(-6)}`}
                </div>
              </div>
              <div className="print-slip-actions" style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => window.print()}
                  style={{ background: '#2F7D32', color: '#FFF', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '6px', fontWeight: '700', cursor: 'pointer', fontSize: '0.8rem' }}
                >
                  Print
                </button>
                <button
                  onClick={() => setShowPrintView(false)}
                  style={{ background: '#E2D7C7', color: '#3A1F14', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '6px', fontWeight: '700', cursor: 'pointer', fontSize: '0.8rem' }}
                >
                  Close
                </button>
              </div>
            </div>

            <div style={{ fontSize: '0.85rem', marginBottom: '1.25rem', lineHeight: '1.5', borderBottom: '1px dashed #CCC', paddingBottom: '0.75rem' }}>
              <div><strong>Customer:</strong> {selectedOrder.customerName || selectedOrder.user?.name || 'Customer'}</div>
              <div><strong>Phone:</strong> {selectedOrder.customerPhone || selectedOrder.user?.phone || 'N/A'}</div>
              <div><strong>Delivery Address:</strong> {typeof selectedOrder.shippingAddress === 'object'
                ? [selectedOrder.shippingAddress.building, selectedOrder.shippingAddress.addressLine, selectedOrder.shippingAddress.city].filter(Boolean).join(', ')
                : selectedOrder.shippingAddress || 'N/A'}
              </div>
              <div><strong>Order Placement:</strong> {formatDateTime(selectedOrder.createdAt || selectedOrder.created_at)}</div>
              <div><strong>Estimated Delivery:</strong> Estimated by {calculateEstimatedDeliveryDate(selectedOrder.createdAt || selectedOrder.created_at, 9)}</div>
              <div><strong>Status:</strong> {(selectedOrder.orderStatus || selectedOrder.status || 'Confirmed').toUpperCase()}</div>
            </div>

            <div style={{ border: '2px solid #2F7D32', borderRadius: '10px', padding: '1rem', background: '#FBF6EE', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: '900', textTransform: 'uppercase', color: '#2F7D32', textAlign: 'center', marginBottom: '0.75rem', letterSpacing: '0.05em' }}>
                ------------------------<br />
                CUSTOMER CUSTOMIZATION & SPECIAL INSTRUCTIONS<br />
                ------------------------
              </div>

              {(selectedOrder.items || selectedOrder.order_items || []).map((item, i) => {
                const note = item.customization_note || item.customizationNote;
                return (
                  <div key={i} style={{ marginBottom: '1rem', borderBottom: '1px dashed rgba(47,125,50,0.3)', paddingBottom: '0.75rem' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: '800', color: '#3A1F14' }}>
                      {i + 1}. {item.title || item.product_title || item.product_name || 'Item'} × {item.quantity}
                    </div>
                    {note ? (
                      <div style={{ marginTop: '0.3rem', padding: '0.5rem', background: '#FFF', border: '1px solid #2F7D32', borderRadius: '6px', fontSize: '0.88rem', fontWeight: '700', color: '#2A140D' }}>
                        ✦ CUSTOMER INSTRUCTION:<br />
                        <span style={{ fontStyle: 'italic', color: '#166534' }}>"{note}"</span>
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.8rem', color: '#725D50', marginTop: '0.2rem', fontStyle: 'italic' }}>
                        No customization requested.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ textAlign: 'center', fontSize: '0.75rem', color: '#725D50', fontStyle: 'italic' }}>
              Please verify all special baking & packaging instructions before dispatch.
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* RESET SHIPMENT TO PROCESSING CONFIRMATION MODAL */}
      {selectedOrder && showResetModal && createPortal(
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(6px)',
          zIndex: 100005,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.25rem',
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '14px',
            maxWidth: '520px',
            width: '100%',
            padding: '1.5rem',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
            border: '1px solid #E5DCCE',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid #F3EDE6', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <RotateCcw size={20} color="#991B1B" />
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#21150F', fontWeight: '800' }}>
                  Reset Shipment to Processing
                </h3>
              </div>
              <button
                type="button"
                onClick={() => { setShowResetModal(false); setResetError(null); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', color: '#8A7B70' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.86rem', color: '#4A3B2E', lineHeight: '1.45', margin: '0 0 0.85rem 0' }}>
              The courier returned without collecting the package. Resetting this order will allow you to create a new shipment and pickup.
            </p>

            {/* Safety Warning Notice (Requirement 9) */}
            <div style={{
              padding: '0.75rem',
              borderRadius: '8px',
              backgroundColor: '#FFFBEB',
              border: '1px solid #FDE68A',
              color: '#92400E',
              fontSize: '0.78rem',
              lineHeight: '1.4',
              marginBottom: '1rem',
              display: 'flex',
              gap: '0.5rem',
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Important Courier Notice:</strong> If an old courier pickup was already scheduled, please ensure it is cancelled through the Shiprath portal before arranging another pickup. Resetting the order in MILASTY does not automatically cancel an external courier pickup that is already in motion.
              </div>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#21150F', marginBottom: '0.4rem' }}>
                Reason for Reset <span style={{ color: '#DC2626' }}>*</span>:
              </label>
              <textarea
                rows={3}
                value={resetReason}
                onChange={(e) => setResetReason(e.target.value)}
                placeholder="e.g. Package not ready – courier returned without collection."
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '0.6rem 0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #D5C9BD',
                  fontSize: '0.82rem',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  outline: 'none',
                }}
              />
            </div>

            {resetError && (
              <div style={{
                padding: '0.6rem 0.75rem',
                borderRadius: '6px',
                backgroundColor: '#FEF2F2',
                border: '1px solid #FCA5A5',
                color: '#991B1B',
                fontSize: '0.78rem',
                marginBottom: '1rem',
              }}>
                {resetError}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem' }}>
              <button
                type="button"
                onClick={() => { setShowResetModal(false); setResetError(null); }}
                disabled={resetLoading}
                style={{
                  padding: '0.55rem 1rem',
                  borderRadius: '8px',
                  backgroundColor: '#F3EDE6',
                  color: '#4A3B2E',
                  border: 'none',
                  fontSize: '0.82rem',
                  fontWeight: '700',
                  cursor: resetLoading ? 'not-allowed' : 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                disabled={resetLoading || !resetReason.trim()}
                style={{
                  padding: '0.55rem 1.15rem',
                  borderRadius: '8px',
                  backgroundColor: resetLoading || !resetReason.trim() ? '#FCA5A5' : '#991B1B',
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: '0.82rem',
                  fontWeight: '800',
                  cursor: resetLoading || !resetReason.trim() ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                {resetLoading && <RefreshCw size={13} className="animate-spin" />}
                <span>{resetLoading ? 'Resetting…' : 'Confirm Reset'}</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}




