import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, Filter, RefreshCw, Eye, X, Package, CreditCard, MapPin, User, Mail, Phone, Sparkles, Printer, Zap, ExternalLink, Truck, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../../api/axios';

const STAGES = ['Pending', 'Confirmed', 'Processing', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];

// Shipments are booked automatically after payment. Admin only needs to act when that failed,
// or when a booking never started / got stuck (no update for 10+ minutes).
const STUCK_AFTER_MS = 10 * 60 * 1000;
function needsShipmentRetry(o) {
  if (o.awb_number || o.awb) return false;
  if (String(o.paymentStatus || o.payment_status || '').toLowerCase() !== 'paid') return false;
  if (String(o.orderStatus || o.order_status || '').toLowerCase() === 'cancelled') return false;
  const st = String(o.shipment_status || '').toLowerCase();
  if (st === 'failed') return true;
  if (st === 'booked') return false;
  const lastTouch = new Date(o.shipment_last_attempt_at || o.createdAt || o.created_at || 0).getTime();
  return Date.now() - lastTouch > STUCK_AFTER_MS;
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
  const [bookingShipment, setBookingShipment] = useState(false);
  const [bookingOrderId, setBookingOrderId] = useState(null);
  const [manualPkg, setManualPkg] = useState({ weightKg: '', length: '', width: '', height: '' });

  // Manual box inputs apply to one order only
  useEffect(() => {
    setManualPkg({ weightKg: '', length: '', width: '', height: '' });
  }, [selectedOrder?.id]);

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
      setOrders(res.data || []);
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

  // Retry a failed automatic booking. Normal orders are booked automatically after payment.
  // pkg (optional): manual box { weightKg, length, width, height } when a different physical box is used
  const handleBookShipment = async (orderId, force = false, pkg = null) => {
    setBookingShipment(true);
    setBookingOrderId(orderId);
    try {
      const res = await api.post(`/orders/admin/${orderId}/retry-shipment`, pkg ? { force, package: pkg } : { force });
      if (res.data?.success) {
        const awbVal = res.data.awb || res.data.awb_number || null;
        const courierName = res.data.courier_name || 'Shiprath Partner';
        // Update list and modal optimistically
        setOrders(prev => prev.map(o =>
          (o.id === orderId || o._id === orderId)
            ? { ...o, awb_number: awbVal, awb: awbVal, courier_name: courierName, shipment_status: 'booked' }
            : o
        ));
        if (selectedOrder && (selectedOrder.id === orderId || selectedOrder._id === orderId)) {
          setSelectedOrder(prev => ({
            ...prev,
            awb_number: awbVal,
            awb: awbVal,
            courier_name: courierName,
            tracking_url: res.data.tracking_url,
            shipment_status: 'booked',
          }));
        }
        alert(`✅ Shipment booked!\nAWB: ${awbVal || '(not returned yet)'}\nCourier: ${courierName}${res.data.fallbackUsed ? '\n(Fallback courier — selected courier was rejected)' : ''}`);
        fetchOrders?.();
      } else {
        // BUG 3 FIX: Show real Shiprath error, not generic
        const realMsg = res.data?.rawError || res.data?.message || 'Shiprath could not book any courier for this order.';
        const failures = res.data?.courierFailures || [];
        const hint = res.data?.hint || '';
        let alertMsg = `❌ Booking failed:\n${realMsg}`;
        if (failures.length) alertMsg += `\n\nPer-courier details:\n${failures.join('\n')}`;
        if (hint) alertMsg += `\n\nℹ️ ${hint}`;
        alert(alertMsg);
      }
    } catch (err) {
      const errData = err.response?.data;
      if (err.response?.status === 409 && errData?.code === 'IN_PROGRESS' && !force) {
        setBookingShipment(false);
        setBookingOrderId(null);
        if (window.confirm(`${errData.message}\n\nForce a new booking attempt now?`)) {
          return handleBookShipment(orderId, true, pkg);
        }
        return;
      }
      const realMsg = errData?.rawError || errData?.message || err.message || 'Error booking shipment.';
      const failures = errData?.courierFailures || [];
      let alertMsg = `❌ ${realMsg}`;
      if (failures.length) alertMsg += `\n\nPer-courier:\n${failures.join('\n')}`;
      alert(alertMsg);
      fetchOrders?.();
    } finally {
      setBookingShipment(false);
      setBookingOrderId(null);
    }
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
                    <td style={{ fontFamily: 'monospace', fontWeight: '800', color: '#21150F' }}>
                      {orderNum}
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
                          const shipSt = (o.shipment_status || '').toLowerCase();
                          if (isShipmentCancelled(o)) return <span style={{ fontSize: '0.68rem', fontWeight: '700', color: '#B91C1C', background: 'rgba(239,68,68,0.1)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>🚫 Shipment Cancelled</span>;
                          if (o.cancellation && ['pending', 'in_progress', 'failed', 'manual_required'].includes(o.cancellation.shipment_cancel_status)) return <span style={{ fontSize: '0.68rem', fontWeight: '700', color: '#B45309', background: 'rgba(234,179,8,0.12)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>⚠️ Cancel {o.cancellation.shipment_cancel_status === 'manual_required' ? 'needs RTO' : o.cancellation.shipment_cancel_status.replace(/_/g, ' ')}</span>;
                          if (shipSt === 'booked') return <span style={{ fontSize: '0.68rem', fontWeight: '700', color: '#22c55e', background: 'rgba(34,197,94,0.1)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>📦 Booked</span>;
                          if (['picked_up', 'in_transit', 'out_for_delivery', 'delivered'].includes(shipSt)) return <span style={{ fontSize: '0.68rem', fontWeight: '700', color: '#22c55e', background: 'rgba(34,197,94,0.1)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>🚚 {shipSt.replace(/_/g, ' ')}</span>;
                          if (shipSt === 'creating') return <span style={{ fontSize: '0.68rem', fontWeight: '700', color: '#3b82f6', background: 'rgba(59,130,246,0.1)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>⏳ Booking...</span>;
                          if (shipSt === 'failed') return <span style={{ fontSize: '0.68rem', fontWeight: '700', color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '0.1rem 0.4rem', borderRadius: '4px', cursor: 'pointer', title: o.shipment_error || 'See details' }}>❌ Ship Failed</span>;
                          if (o.awb_number || o.awb) return <span style={{ fontSize: '0.68rem', fontWeight: '700', color: '#22c55e', background: 'rgba(34,197,94,0.1)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>📦 Booked</span>;
                          return null;
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
                        {needsShipmentRetry(o) && (
                          <button
                            onClick={() => handleBookShipment(o.id || o._id)}
                            disabled={bookingShipment && bookingOrderId === (o.id || o._id)}
                            className="admin-btn-secondary"
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.72rem', background: '#381423', color: '#D4AF37', border: 'none', opacity: (bookingShipment && bookingOrderId === (o.id || o._id)) ? 0.6 : 1 }}
                            title={o.shipment_error || 'Automatic booking did not complete — retry'}
                          >
                            <Truck size={12} />
                            <span>{(bookingShipment && bookingOrderId === (o.id || o._id)) ? 'Retrying…' : 'Retry Shipment'}</span>
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
            <div style={{ background: 'rgba(252, 250, 247, 0.7)', border: '1px solid rgba(231, 222, 213, 0.65)', borderRadius: '12px', padding: '1rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
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
            {/* Cancellation / refund / shipment-cancel state (managed on the Cancellations & Refunds page) */}
            {selectedOrder.cancellation && (
              <div style={{ background: '#FFF6EE', border: '1px solid #F0C9A8', borderRadius: '12px', padding: '0.85rem 1rem', marginBottom: '1rem', fontSize: '0.8rem', color: '#7A3E12', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <div>
                  <strong>Cancelled by customer.</strong> Refund {selectedOrder.cancellation.refund_percentage}% (₹{Number(selectedOrder.cancellation.refund_amount).toFixed(2)}) — {String(selectedOrder.cancellation.refund_status).replace(/_/g, ' ')}.
                  {' '}Shipment cancellation: {String(selectedOrder.cancellation.shipment_cancel_status).replace(/_/g, ' ')}.
                  {selectedOrder.cancellation.shipment_cancel_error && <div style={{ color: '#C62828', marginTop: '0.2rem' }}>{selectedOrder.cancellation.shipment_cancel_error}</div>}
                </div>
                <a href="/admin/cancellations" style={{ fontWeight: '800', color: '#5A2E16', whiteSpace: 'nowrap' }}>Open in Cancellations &amp; Refunds →</a>
              </div>
            )}

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
                      Shipment not yet booked with courier
                    </div>
                  )}
                </div>

                <div>
                  {(selectedOrder.awb_number || selectedOrder.awb) ? (
                    // backend.shiprath.com/tracking/{awb} is not a real Shiprath page (it 404s with
                    // "Cannot find module 'html'"), so track through the MILASTY backend instead.
                    <button
                      type="button"
                      onClick={() => handleTrackShipment(selectedOrder.id || selectedOrder._id)}
                      disabled={shipTracking.loading}
                      style={{ padding: '0.45rem 0.85rem', borderRadius: '8px', backgroundColor: '#381423', color: '#FFF', border: 'none', fontSize: '0.78rem', fontWeight: '700', cursor: shipTracking.loading ? 'wait' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      <Truck size={13} />
                      <span>{shipTracking.loading ? 'Tracking...' : 'Track Shipment'}</span>
                    </button>
                  ) : needsShipmentRetry(selectedOrder) ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.45rem' }}>
                      <button
                        onClick={() => {
                          const vals = ['weightKg', 'length', 'width', 'height'].map((k) => Number(manualPkg[k]));
                          const useManual = vals.every((v) => v > 0);
                          if (!useManual && vals.some((v) => v > 0)) {
                            alert('Fill all four manual box fields (weight, length, width, height) or leave them all empty.');
                            return;
                          }
                          handleBookShipment(selectedOrder.id || selectedOrder._id, false, useManual
                            ? { weightKg: vals[0], length: vals[1], width: vals[2], height: vals[3] }
                            : null);
                        }}
                        disabled={bookingShipment}
                        style={{ padding: '0.5rem 1rem', borderRadius: '8px', backgroundColor: '#381423', color: '#D4AF37', border: 'none', fontSize: '0.82rem', fontWeight: '800', cursor: bookingShipment ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                      >
                        <Zap size={14} color="#D4AF37" />
                        <span>{bookingShipment ? 'Retrying...' : 'Retry Shipment'}</span>
                      </button>
                      <details style={{ fontSize: '0.74rem', color: '#665A52' }}>
                        <summary style={{ cursor: 'pointer', fontWeight: '700' }}>Use a different box (optional)</summary>
                        <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.4rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                          {[['weightKg', 'Weight kg'], ['length', 'L cm'], ['width', 'W cm'], ['height', 'H cm']].map(([k, label]) => (
                            <input
                              key={k}
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder={label}
                              value={manualPkg[k]}
                              onChange={(e) => setManualPkg((p) => ({ ...p, [k]: e.target.value }))}
                              className="admin-input"
                              style={{ width: '78px', padding: '0.25rem 0.4rem', fontSize: '0.74rem' }}
                            />
                          ))}
                        </div>
                      </details>
                    </div>
                  ) : (
                    <span style={{ fontSize: '0.78rem', color: '#665A52', fontWeight: '600' }}>Automatic booking in progress…</span>
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

    </div>
  );
}




