import React, { useState, useEffect } from 'react';
import { Search, Filter, RefreshCw, Eye, ArrowUpRight, X, Package, CreditCard, MapPin, User, Mail, Phone, Calendar, CheckCircle, Clock } from 'lucide-react';
import api from '../../api/axios';

const STAGES = ['Pending', 'Confirmed', 'Processing', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];

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

export default function AdminOrderList() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

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
      // Revert if API failed
      fetchOrders();
    }
  };

  const parseAddress = (addr) => {
    if (!addr) return { line: 'N/A', city: '', state: '', pin: '' };
    if (typeof addr === 'object') {
      const line = [addr.building, addr.addressLine || addr.address].filter(Boolean).join(', ');
      return {
        line: line || 'Address provided',
        city: addr.city || '',
        state: addr.state || '',
        pin: addr.pincode || addr.pin || '',
      };
    }
    const str = String(addr);
    const pinMatch = str.match(/\b\d{6}\b/);
    return {
      line: str,
      city: '',
      state: '',
      pin: pinMatch ? pinMatch[0] : '',
    };
  };

  const filteredOrders = orders.filter((o) => {
    if (!paymentFilter) return true;
    const payStatus = (o.paymentStatus || o.payment_status || 'pending').toLowerCase();
    const payMethod = (o.paymentMethod || o.payment_method || 'cod').toLowerCase();
    if (paymentFilter === 'paid') return payStatus === 'paid';
    if (paymentFilter === 'pending') return payStatus === 'pending';
    if (paymentFilter === 'razorpay') return payMethod.includes('razorpay');
    if (paymentFilter === 'cod') return payMethod.includes('cod') || payMethod.includes('cash');
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Header Area */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <p style={{ fontSize: '0.68rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--admin-text-muted)', margin: '0 0 0.2rem 0' }}>
            Orders Management
          </p>
          <h2 style={{ fontSize: 'clamp(1.15rem, 2.5vw, 1.45rem)', fontFamily: 'var(--font-serif)', color: 'var(--admin-text-primary)', fontWeight: '800', margin: 0, lineHeight: '1.25' }}>
            Orders Log & Tracking
          </h2>
          <p style={{ color: 'var(--admin-text-secondary)', fontSize: '0.8rem', margin: '0.2rem 0 0 0', fontWeight: '500' }}>
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
          <Search size={16} color="var(--admin-text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Order #, customer name, email, phone..."
            className="admin-input"
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>

        {/* Order Status Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Filter size={15} color="var(--admin-text-muted)" />
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
          <CreditCard size={15} color="var(--admin-text-muted)" />
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
      </div>

      {/* Main Orders Table */}
      <div className="admin-table-container">
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem', gap: '1rem' }}>
            <RefreshCw size={20} className="animate-spin" color="var(--admin-accent)" />
            <span style={{ fontSize: '0.82rem', color: 'var(--admin-text-muted)', fontWeight: '600' }}>Loading orders log...</span>
          </div>
        ) : filteredOrders.length > 0 ? (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Customer</th>
                <th>Delivery Location</th>
                <th>Payment Method</th>
                <th>Payment Status</th>
                <th>Amount</th>
                <th>Lifecycle Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((o) => {
                const orderNum = o.orderNumber || o.orderId || (o.id ? `MIL-${String(o.id).slice(-6)}` : 'N/A');
                const custName = o.customerName || o.user?.name || 'Customer';
                const custEmail = o.customerEmail || o.user?.email || '';
                const custPhone = o.customerPhone || o.user?.phone || '';
                const addrObj = parseAddress(o.shippingAddress);
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

                return (
                  <tr key={o.id || o._id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: '800', color: 'var(--admin-text-primary)' }}>
                      {orderNum}
                    </td>
                    <td>
                      <div style={{ fontWeight: '700', color: 'var(--admin-text-primary)' }}>{custName}</div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--admin-text-muted)' }}>
                        {custEmail || custPhone || 'No contact provided'}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--admin-text-primary)', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {addrObj.line}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--admin-text-muted)', display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: '700', color: 'var(--admin-accent)' }}>{pin ? `PIN: ${pin}` : 'No PIN'}</span>
                        • Fee: {Number(fee) === 0 ? <strong style={{ color: '#22c55e' }}>FREE</strong> : `₹${fee}`}
                      </div>
                    </td>
                    <td style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--admin-text-secondary)' }}>
                      {payMethod}
                    </td>
                    <td>
                      <span className={`admin-badge ${payStatus === 'paid' ? 'admin-badge-success' : 'admin-badge-warning'}`}>
                        {payStatus === 'paid' ? 'Paid' : 'Pending'}
                      </span>
                    </td>
                    <td style={{ fontWeight: '800', color: 'var(--admin-text-primary)' }}>
                      ₹{total.toLocaleString('en-IN')}
                    </td>
                    <td>
                      <span className={`admin-badge ${statusBadgeClass}`}>
                        {displayStatus}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                        <button
                          onClick={() => setSelectedOrder(o)}
                          className="admin-btn-secondary"
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                          title="View Order Details"
                        >
                          <Eye size={13} />
                          <span>View</span>
                        </button>
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
            <h3 style={{ fontSize: '1.1rem', color: 'var(--admin-text-primary)', margin: 0, fontWeight: '800' }}>No orders found</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--admin-text-muted)', margin: 0 }}>No store orders matching your current query filters.</p>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--admin-border)', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <span style={{ fontSize: '0.68rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--admin-accent)' }}>
                  Order Details Breakdown
                </span>
                <h3 style={{ fontSize: '1.3rem', fontFamily: 'var(--font-serif)', color: 'var(--admin-text-primary)', margin: '0.1rem 0 0 0', fontWeight: '800' }}>
                  {selectedOrder.orderNumber || selectedOrder.orderId || `MIL-${String(selectedOrder.id).slice(-6)}`}
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                style={{ background: 'none', border: 'none', color: 'var(--admin-text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Customer & Shipping Summary Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--admin-border)', borderRadius: '12px', padding: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--admin-accent)', fontWeight: '700', fontSize: '0.8rem', marginBottom: '0.6rem' }}>
                  <User size={15} /> Customer Details
                </div>
                <div style={{ fontSize: '0.88rem', fontWeight: '700', color: 'var(--admin-text-primary)' }}>
                  {selectedOrder.customerName || selectedOrder.user?.name || 'Customer'}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--admin-text-secondary)', margin: '0.2rem 0' }}>
                  <Mail size={13} style={{ display: 'inline', marginRight: '4px' }} />
                  {selectedOrder.customerEmail || selectedOrder.user?.email || 'N/A'}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--admin-text-secondary)' }}>
                  <Phone size={13} style={{ display: 'inline', marginRight: '4px' }} />
                  {selectedOrder.customerPhone || selectedOrder.user?.phone || 'N/A'}
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--admin-border)', borderRadius: '12px', padding: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--admin-accent)', fontWeight: '700', fontSize: '0.8rem', marginBottom: '0.6rem' }}>
                  <MapPin size={15} /> Delivery Address
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--admin-text-primary)', lineHeight: '1.4' }}>
                  {typeof selectedOrder.shippingAddress === 'object'
                    ? [selectedOrder.shippingAddress.fullName, selectedOrder.shippingAddress.building, selectedOrder.shippingAddress.addressLine, selectedOrder.shippingAddress.city, selectedOrder.shippingAddress.state].filter(Boolean).join(', ')
                    : selectedOrder.shippingAddress || 'N/A'}
                </div>
                <div style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--admin-accent)', marginTop: '0.4rem' }}>
                  PIN: {selectedOrder.pincode || (typeof selectedOrder.shippingAddress === 'object' ? selectedOrder.shippingAddress.pincode : 'N/A')}
                </div>
              </div>
            </div>

            {/* Payment & Status Banner */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--admin-border)', borderRadius: '12px', padding: '1rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--admin-text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Payment Information</span>
                <div style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--admin-text-primary)', marginTop: '0.1rem' }}>
                  {selectedOrder.paymentMethod || selectedOrder.payment_method || 'Cash on Delivery'}
                  <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', fontWeight: '700', padding: '2px 8px', borderRadius: '999px', background: (selectedOrder.paymentStatus || selectedOrder.payment_status) === 'paid' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(234, 179, 8, 0.15)', color: (selectedOrder.paymentStatus || selectedOrder.payment_status) === 'paid' ? '#22c55e' : '#eab308' }}>
                    {(selectedOrder.paymentStatus || selectedOrder.payment_status || 'pending').toUpperCase()}
                  </span>
                </div>
                {selectedOrder.paymentId && (
                  <div style={{ fontSize: '0.72rem', fontFamily: 'monospace', color: 'var(--admin-text-muted)', marginTop: '0.2rem' }}>
                    Payment ID: {selectedOrder.paymentId}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--admin-text-secondary)' }}>Status:</span>
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

            {/* Ordered Items List */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '0.85rem', color: 'var(--admin-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem', fontWeight: '800' }}>
                Ordered Items ({(selectedOrder.items || selectedOrder.order_items || []).length})
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {(selectedOrder.items || selectedOrder.order_items || []).map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--admin-border)', borderRadius: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <Package size={16} color="var(--admin-accent)" />
                      <div>
                        <div style={{ fontSize: '0.88rem', fontWeight: '700', color: 'var(--admin-text-primary)' }}>
                          {item.title || item.product_title || 'Bakery Item'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>
                          Variant: {item.variantName || item.variant_name || item.variantWeight || item.variant_weight || 'Standard'} • Qty: {item.quantity}
                        </div>
                      </div>
                    </div>
                    <div style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--admin-text-primary)' }}>
                      ₹{((item.totalPrice || item.total_price || (item.price * item.quantity)) || 0).toLocaleString('en-IN')}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cost Breakdown */}
            <div style={{ borderTop: '1px solid var(--admin-border)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', alignItems: 'flex-end', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '220px', color: 'var(--admin-text-secondary)' }}>
                <span>Subtotal:</span>
                <span>₹{(selectedOrder.subtotal || 0).toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '220px', color: 'var(--admin-text-secondary)' }}>
                <span>Delivery Fee:</span>
                <span>{(selectedOrder.deliveryFee || selectedOrder.delivery_fee || 0) === 0 ? <strong style={{ color: '#22c55e' }}>FREE</strong> : `₹${selectedOrder.deliveryFee || selectedOrder.delivery_fee}`}</span>
              </div>
              {(selectedOrder.discountAmount > 0 || selectedOrder.coupon_discount > 0 || selectedOrder.couponDiscount > 0) && (
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '260px', color: '#22c55e' }}>
                  <span>Discount {(selectedOrder.couponCode || selectedOrder.coupon_code) ? `(${selectedOrder.couponCode || selectedOrder.coupon_code})` : ''}:</span>
                  <span>-₹{selectedOrder.discountAmount || selectedOrder.coupon_discount || selectedOrder.couponDiscount}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '220px', fontSize: '1.1rem', fontWeight: '900', color: 'var(--admin-text-primary)', borderTop: '1px dashed var(--admin-border)', paddingTop: '0.5rem', marginTop: '0.2rem' }}>
                <span>Grand Total:</span>
                <span>₹{(selectedOrder.grandTotal || selectedOrder.totalAmount || 0).toLocaleString('en-IN')}</span>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
