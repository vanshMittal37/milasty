import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutGrid, Package, Heart, MapPin, User, Lock, LogOut,
  ChevronRight, Plus, Trash2, Edit3, ShoppingBag, Search,
  Calendar, ArrowRight, CheckCircle2, AlertCircle, Eye, EyeOff, 
  Mail, Phone, MessageSquare, X, Check, RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import ConfirmationModal from '../components/ConfirmationModal';
import api from '../api/axios';


// — Design tokens (mirrors --cp-* variables for inline JS)
const T = {
  bg:            '#FCFAF7',
  surface:       '#FFFFFF',
  surfaceAlt:    '#F7F2EC',
  brand:         '#5A2E16',
  brandLight:    '#F5EDE5',
  accent:        '#C58A35',
  accentLight:   '#FEF9EC',
  border:        '#E7DED5',
  textPrimary:   '#171717',
  textSecondary: '#4A3B2E',
  textMuted:     '#888888',
  textLabel:     '#666666',
  success:       '#2E7D32',
  successBg:     '#EDF7EE',
  warning:       '#B7791F',
  warningBg:     '#FEF9EC',
  danger:        '#C62828',
  dangerBg:      '#FEECEC',
  info:          '#1565C0',
  infoBg:        '#EAF2FF',
  shadow:        '0 2px 10px rgba(90, 46, 22, 0.07)',
  shadowMd:      '0 4px 20px rgba(90, 46, 22, 0.10)',
};

// Skeleton Loader
function SkeletonBox({ height = '40px', width = '100%', borderRadius = '12px' }) {
  return (
    <div
      className="milasty-skeleton-pulse"
      style={{ height, width, borderRadius, flexShrink: 0 }}
    />
  );
}

// Status badge helper
function OrderStatusBadge({ status }) {
  const s = String(status || 'Pending');
  const map = {
    Pending:          { bg: T.warningBg,  color: T.warning,  border: '#F0D68A' },
    Confirmed:        { bg: T.infoBg,     color: T.info,     border: '#90CAF9' },
    Processing:       { bg: '#F3E8FF',    color: '#6B21A8',  border: '#D8B4FE' },
    Packed:           { bg: '#F3E8FF',    color: '#6B21A8',  border: '#D8B4FE' },
    Shipped:          { bg: T.accentLight,color: T.accent,   border: '#F5D889' },
    'Out for Delivery':{ bg: T.accentLight,color: T.accent,  border: '#F5D889' },
    Delivered:        { bg: T.successBg,  color: T.success,  border: '#A5D6A7' },
    Cancelled:        { bg: T.dangerBg,   color: T.danger,   border: '#EF9A9A' },
  };
  const style = map[s] || { bg: '#F3F4F6', color: '#6B7280', border: '#D1D5DB' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '0.25rem 0.7rem',
      borderRadius: '999px', fontSize: '0.72rem', fontWeight: '700',
      backgroundColor: style.bg, color: style.color,
      border: `1px solid ${style.border}`, letterSpacing: '0.02em', whiteSpace: 'nowrap',
    }}>
      {s}
    </span>
  );
}

// Section header helper
function SectionHeader({ title, action }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
      <h2 style={{ fontSize: '1.05rem', fontWeight: '800', color: T.textPrimary, margin: 0 }}>{title}</h2>
      {action}
    </div>
  );
}

// Input field style
const inputStyle = {
  width: '100%', height: '46px', padding: '0 1rem',
  borderRadius: '10px', border: `1px solid ${T.border}`,
  fontSize: '0.9rem', outline: 'none',
  backgroundColor: '#FFFFFF', color: T.textPrimary,
  boxSizing: 'border-box', fontFamily: 'var(--font-sans)',
};

const labelStyle = {
  fontSize: '0.74rem', fontWeight: '700', color: T.textSecondary,
  display: 'block', marginBottom: '0.4rem',
};

// Card style
const cardStyle = {
  backgroundColor: T.surface, border: `1px solid ${T.border}`,
  borderRadius: '16px', boxShadow: T.shadow,
  transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
};

export default function AccountDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout, addAddress, deleteAddress, updateProfile, updateAddress, setDefaultAddress } = useAuth();
  const { wishlistItems, wishlistCount, toggleWishlist } = useWishlist();
  const { totalItemCount, setIsCartOpen, addToCart } = useCart();
  const { toast } = useToast();

  const queryTab = new URLSearchParams(location.search).get('tab');
  const [activeTab, setActiveTab] = useState(queryTab || 'overview');

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Orders
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('All');

  // Address Modal
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [deleteAddrTargetId, setDeleteAddrTargetId] = useState(null);
  const [addressForm, setAddressForm] = useState({
    fullName: '', phone: '', addressLine: '', building: '',
    city: '', state: '', pincode: '', addressType: 'Home',
  });

  // Profile
  const [profileForm, setProfileForm] = useState({ name: '', email: '', phone: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileEditMode, setProfileEditMode] = useState(false);

  // Password
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    if (queryTab) setActiveTab(queryTab);
  }, [queryTab]);

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    fetchOrders();
    if (user) {
      setProfileForm({ name: user.name || '', email: user.email || '', phone: user.phone || '' });
    }
  }, [isAuthenticated, user]);

  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await api.get('/orders/my-orders');
      setOrders(Array.isArray(res.data) ? res.data : []);
    } catch { setOrders([]); }
    finally { setLoadingOrders(false); }
  };

  if (!isAuthenticated) return null;

  const confirmLogout = () => {
    setShowLogoutModal(false);
    logout();
    toast.success('Logged out successfully.');
    navigate('/', { replace: true });
  };

  // Address handlers
  const handleOpenAddAddress = () => {
    setEditingAddress(null);
    setAddressForm({ fullName: user?.name || '', phone: user?.phone || '', addressLine: '', building: '', city: '', state: '', pincode: '', addressType: 'Home' });
    setShowAddressModal(true);
  };
  const handleOpenEditAddress = (addr) => {
    setEditingAddress(addr);
    setAddressForm({ fullName: addr.fullName || '', phone: addr.phone || '', addressLine: addr.addressLine || '', building: addr.building || '', city: addr.city || '', state: addr.state || '', pincode: addr.pincode || '', addressType: addr.addressType || 'Home' });
    setShowAddressModal(true);
  };
  const handleSaveAddress = async (e) => {
    e.preventDefault();
    const cleanPin = (addressForm.pincode || '').trim();
    if (!cleanPin || !/^\d{6}$/.test(cleanPin)) { toast.error('Please enter a valid 6-digit Indian PIN code.'); return; }
    try {
      const isFirst = !user?.addresses || user.addresses.length === 0;
      const payload = { ...addressForm, pincode: cleanPin, isDefault: editingAddress ? (editingAddress.isDefault ?? true) : (isFirst || false) };
      if (editingAddress) { await updateAddress(editingAddress._id || editingAddress.id, payload); toast.success('Address updated.'); }
      else { await addAddress(payload); toast.success('Address saved.'); }
      setShowAddressModal(false);
    } catch { toast.error('Failed to save address.'); }
  };
  const confirmDeleteAddress = async () => {
    if (!deleteAddrTargetId) return;
    try { await deleteAddress(deleteAddrTargetId); toast.success('Address removed.'); setDeleteAddrTargetId(null); }
    catch { toast.error('Failed to delete address.'); }
  };
  const handleSetDefault = async (addrId) => {
    try { await setDefaultAddress(addrId); toast.success('Default address updated.'); }
    catch { toast.error('Failed to update.'); }
  };

  // Profile
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!profileForm.name.trim() || !profileForm.email.trim()) { toast.error('Name and Email are required.'); return; }
    setSavingProfile(true);
    try { await updateProfile(profileForm); toast.success('Profile updated.'); setProfileEditMode(false); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed to update.'); }
    finally { setSavingProfile(false); }
  };

  // Password
  const handleSavePassword = async (e) => {
    e.preventDefault();
    if (!passwordForm.currentPassword) { toast.error('Enter current password.'); return; }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) { toast.error('Passwords do not match.'); return; }
    const reqs = [passwordForm.newPassword.length >= 8, /[A-Z]/.test(passwordForm.newPassword), /[a-z]/.test(passwordForm.newPassword), /\d/.test(passwordForm.newPassword)];
    if (!reqs.every(Boolean)) { toast.error('Password must be 8+ chars with uppercase, lowercase & number.'); return; }
    setPasswordLoading(true);
    try {
      const res = await api.put('/auth/change-password', { currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword });
      toast.success(res.data?.message || 'Password changed!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) { toast.error(err.response?.data?.message || 'Error updating password.'); }
    finally { setPasswordLoading(false); }
  };

  const passwordChecklist = [
    { label: 'At least 8 characters', pass: passwordForm.newPassword.length >= 8 },
    { label: 'One uppercase letter', pass: /[A-Z]/.test(passwordForm.newPassword) },
    { label: 'One lowercase letter', pass: /[a-z]/.test(passwordForm.newPassword) },
    { label: 'One number', pass: /\d/.test(passwordForm.newPassword) },
  ];

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';
  const recentOrders = orders.slice(0, 4);

  const filteredOrders = orders.filter((o) => {
    const id = (o.orderNumber || o._id || '').toLowerCase();
    const matchSearch = id.includes(orderSearch.toLowerCase());
    if (orderStatusFilter === 'All') return matchSearch;
    return matchSearch && (o.status === orderStatusFilter || o.orderStatus === orderStatusFilter);
  });

  // ——————————————————————————
  // RENDER
  // ——————————————————————————
  return (
    <div className="account-dashboard-page" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

      {/* ================================================
          TAB 1: OVERVIEW / DASHBOARD
          ================================================ */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

          {/* 1. Profile Summary Card */}
          <div style={{ ...cardStyle, padding: '1.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
              {/* Avatar */}
              <div style={{
                width: '62px', height: '62px', borderRadius: '50%',
                backgroundColor: T.brandLight, border: `2px solid ${T.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.6rem', fontFamily: 'var(--font-sans)', fontWeight: '900', color: T.brand, flexShrink: 0,
              }}>
                {userInitial}
              </div>
              <div>
                <div style={{ fontSize: '1.1rem', fontWeight: '800', color: T.textPrimary, marginBottom: '0.35rem' }}>{user?.name || 'Customer'}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.83rem', color: T.textMuted, fontWeight: '500' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Mail size={13} color={T.accent} /> {user?.email}</span>
                  {user?.phone && <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Phone size={13} color={T.accent} /> {user.phone}</span>}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
              {[
                { label: 'Edit Profile', icon: Edit3, onClick: () => setActiveTab('profile'), color: T.brand, bg: T.brandLight },
                { label: 'Change Password', icon: Lock, onClick: () => setActiveTab('password'), color: T.textSecondary, bg: T.surfaceAlt },
                { label: 'Logout', icon: LogOut, onClick: () => setShowLogoutModal(true), color: T.danger, bg: T.dangerBg, border: '#EF9A9A' },
              ].map((btn) => {
                const Icon = btn.icon;
                return (
                  <button
                    key={btn.label}
                    onClick={btn.onClick}
                    style={{
                      padding: '0.55rem 1.05rem', fontSize: '0.8rem', fontWeight: '700',
                      borderRadius: '10px', border: `1px solid ${btn.border || T.border}`,
                      color: btn.color, backgroundColor: btn.bg, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '0.4rem',
                      transition: 'all 0.18s ease',
                    }}
                  >
                    <Icon size={14} />
                    <span>{btn.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Account Summary Stat Cards */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.05rem', fontWeight: '800', color: T.textPrimary, margin: 0 }}>Account Summary</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              {[
                { label: 'Total Orders', desc: 'Track purchases', value: loadingOrders ? null : orders.length, icon: Package, iconBg: '#EAF2FF', iconColor: '#1565C0', onClick: () => setActiveTab('orders') },
                { label: 'Saved Wishlist', desc: 'Favourite items', value: wishlistCount, icon: Heart, iconBg: '#FEECEC', iconColor: '#C62828', onClick: () => setActiveTab('wishlist') },
                { label: 'Delivery Locations', desc: 'Saved addresses', value: user?.addresses?.length || 0, icon: MapPin, iconBg: T.accentLight, iconColor: T.accent, onClick: () => setActiveTab('addresses') },
                { label: 'Cart Items', desc: 'Active items', value: totalItemCount, icon: ShoppingBag, iconBg: '#F3E8FF', iconColor: '#6B21A8', onClick: () => setIsCartOpen(true) },
              ].map((card) => {
                const Icon = card.icon;
                return (
                  <div key={card.label} className="milasty-stat-card" onClick={card.onClick} role="button" tabIndex={0}>
                    <div className="milasty-stat-icon-wrapper" style={{ backgroundColor: card.iconBg }}>
                      <Icon size={22} color={card.iconColor} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.68rem', color: T.textMuted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{card.label}</div>
                      {card.value === null ? (
                        <SkeletonBox height="22px" width="50px" borderRadius="6px" />
                      ) : (
                        <div style={{ fontSize: '1.5rem', fontWeight: '900', color: T.textPrimary, lineHeight: 1.2 }}>{card.value}</div>
                      )}
                      <div style={{ fontSize: '0.74rem', color: card.iconColor, fontWeight: '600' }}>{card.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Quick Actions + Recent Orders */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.75rem', alignItems: 'start' }}>

            {/* Quick Actions */}
            <div>
              <SectionHeader title="Quick Actions" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {[
                  { label: 'Track My Orders', desc: 'Live journey & delivery updates', icon: Package, iconBg: '#EAF2FF', iconColor: '#1565C0', onClick: () => setActiveTab('orders') },
                  { label: 'View Wishlist', desc: 'Your saved products', icon: Heart, iconBg: '#FEECEC', iconColor: '#C62828', onClick: () => setActiveTab('wishlist') },
                  { label: 'Manage Addresses', desc: 'Add or edit delivery locations', icon: MapPin, iconBg: T.accentLight, iconColor: T.accent, onClick: () => setActiveTab('addresses') },
                  { label: 'My Inquiries', desc: 'View your support requests', icon: MessageSquare, iconBg: '#EDF7EE', iconColor: '#2E7D32', path: '/account/inquiries' },
                ].map((action) => {
                  const Icon = action.icon;
                  const content = (
                    <div style={{
                      ...cardStyle, display: 'flex', alignItems: 'center',
                      justifyContent: 'space-between', padding: '1rem 1.15rem', cursor: 'pointer',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                        <div style={{ padding: '10px', borderRadius: '10px', backgroundColor: action.iconBg, flexShrink: 0 }}>
                          <Icon size={17} color={action.iconColor} />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.9rem', fontWeight: '700', color: T.textPrimary }}>{action.label}</div>
                          <div style={{ fontSize: '0.76rem', color: T.textMuted, marginTop: '0.1rem' }}>{action.desc}</div>
                        </div>
                      </div>
                      <ChevronRight size={16} color={T.accent} />
                    </div>
                  );
                  return action.path ? (
                    <Link key={action.label} to={action.path} style={{ textDecoration: 'none' }}>{content}</Link>
                  ) : (
                    <div key={action.label} onClick={action.onClick}>{content}</div>
                  );
                })}
              </div>
            </div>

            {/* Recent Orders */}
            <div>
              <SectionHeader
                title="Recent Orders"
                action={orders.length > 0 && (
                  <button
                    onClick={() => setActiveTab('orders')}
                    style={{ background: 'none', border: 'none', color: T.brand, fontSize: '0.82rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                  >
                    View All ({orders.length}) <ArrowRight size={14} />
                  </button>
                )}
              />

              {loadingOrders ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <SkeletonBox height="90px" />
                  <SkeletonBox height="90px" />
                  <SkeletonBox height="90px" />
                </div>
              ) : orders.length === 0 ? (
                <div style={{ ...cardStyle, padding: '2.5rem 1.5rem', textAlign: 'center' }}>
                  <Package size={36} color={T.border} style={{ margin: '0 auto 0.75rem' }} />
                  <h4 style={{ fontSize: '1rem', fontWeight: '800', color: T.textPrimary, margin: '0 0 0.35rem 0' }}>No orders yet</h4>
                  <p style={{ color: T.textMuted, fontSize: '0.85rem', margin: '0 0 1.25rem 0' }}>Your MILASTY journey starts here.</p>
                  <Link to="/shop" style={{
                    padding: '0.6rem 1.5rem', fontSize: '0.82rem', fontWeight: '700',
                    borderRadius: '999px', backgroundColor: T.brand, color: '#FFFFFF',
                    textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                  }}>
                    <span>Explore Store</span><ArrowRight size={14} />
                  </Link>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {recentOrders.map((order) => {
                    const status = order.status || order.orderStatus || 'Confirmed';
                    const date = new Date(order.createdAt || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                    const img = order.items?.[0]?.image;
                    return (
                      <div key={order._id} style={{ ...cardStyle, padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                        {img && (
                          <img src={img} alt="" style={{ width: '48px', height: '48px', borderRadius: '10px', objectFit: 'cover', border: `1px solid ${T.border}`, flexShrink: 0 }} />
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: '800', color: T.textPrimary }}>
                            Order #{order.orderNumber || order._id?.slice(-8).toUpperCase()}
                          </div>
                          <div style={{ fontSize: '0.74rem', color: T.textMuted, display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.1rem' }}>
                            <Calendar size={11} /> {date}
                          </div>
                          <div style={{ fontSize: '0.88rem', fontWeight: '800', color: T.textPrimary, marginTop: '0.2rem' }}>₹{order.totalAmount}</div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem', flexShrink: 0 }}>
                          <OrderStatusBadge status={status} />
                          <Link to={`/account/orders/${order._id}`} style={{
                            padding: '0.35rem 0.85rem', fontSize: '0.75rem', fontWeight: '700',
                            borderRadius: '8px', border: `1px solid ${T.border}`, color: T.brand,
                            backgroundColor: T.brandLight, textDecoration: 'none',
                            display: 'flex', alignItems: 'center', gap: '0.2rem',
                          }}>
                            View <ChevronRight size={12} />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================================================
          TAB 2: MY ORDERS
          ================================================ */}
      {activeTab === 'orders' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Search + Filter Bar */}
          <div style={{ ...cardStyle, padding: '1.25rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
            <div style={{ position: 'relative', flexGrow: 1, minWidth: '200px' }}>
              <Search size={15} color={T.textMuted} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                placeholder="Search by order ID..."
                style={{ ...inputStyle, paddingLeft: '38px' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {['All', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map((s) => (
                <button
                  key={s}
                  onClick={() => setOrderStatusFilter(s)}
                  style={{
                    padding: '0.45rem 0.9rem', fontSize: '0.78rem', fontWeight: '700', borderRadius: '8px', cursor: 'pointer',
                    border: `1px solid ${orderStatusFilter === s ? T.brand : T.border}`,
                    backgroundColor: orderStatusFilter === s ? T.brand : T.surface,
                    color: orderStatusFilter === s ? '#FFFFFF' : T.textSecondary,
                    transition: 'all 0.18s ease',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Orders List */}
          {loadingOrders ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <SkeletonBox height="130px" /><SkeletonBox height="130px" /><SkeletonBox height="130px" />
            </div>
          ) : filteredOrders.length === 0 ? (
            <div style={{ ...cardStyle, padding: '3.5rem 1.5rem', textAlign: 'center' }}>
              <Package size={44} color={T.border} style={{ margin: '0 auto 1rem' }} />
              <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: T.textPrimary, margin: '0 0 0.35rem 0' }}>No orders found</h3>
              <p style={{ color: T.textMuted, fontSize: '0.88rem', margin: '0 0 1.5rem 0' }}>
                {orderSearch || orderStatusFilter !== 'All' ? 'Try adjusting your search or filter.' : "You haven't placed any orders yet."}
              </p>
              <Link to="/shop" style={{
                padding: '0.7rem 1.75rem', fontSize: '0.85rem', fontWeight: '800', borderRadius: '999px',
                backgroundColor: T.brand, color: '#FFFFFF', textDecoration: 'none',
                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              }}>
                <span>Explore Shop</span><ArrowRight size={15} />
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              {filteredOrders.map((order) => {
                const status = order.status || order.orderStatus || 'Confirmed';
                const date = new Date(order.createdAt || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                return (
                  <div key={order._id} style={{ ...cardStyle, padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', paddingBottom: '1rem', borderBottom: `1px solid ${T.border}` }}>
                      <div>
                        <div style={{ fontSize: '0.95rem', fontWeight: '800', color: T.textPrimary }}>
                          Order #{order.orderNumber || order._id?.slice(-8).toUpperCase()}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: T.textMuted, display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.2rem' }}>
                          <Calendar size={12} /> Placed on {date}
                        </div>
                      </div>
                      <OrderStatusBadge status={status} />
                    </div>

                    {/* Items Preview */}
                    {order.items?.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', padding: '0.75rem 0' }}>
                        {order.items.slice(0, 2).map((item, idx) => (
                          <div key={idx} style={{ display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
                            <img src={item.image} alt={item.title} style={{ width: '52px', height: '52px', borderRadius: '10px', objectFit: 'cover', border: `1px solid ${T.border}`, flexShrink: 0 }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '0.88rem', fontWeight: '700', color: T.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
                              <div style={{ fontSize: '0.76rem', color: T.textMuted }}>Qty: {item.quantity} • ₹{item.price * item.quantity}</div>
                            </div>
                          </div>
                        ))}
                        {order.items.length > 2 && <div style={{ fontSize: '0.75rem', color: T.textMuted }}>+{order.items.length - 2} more item(s)</div>}
                      </div>
                    )}

                    {/* Footer */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.85rem', borderTop: `1px solid ${T.border}` }}>
                      <div>
                        <div style={{ fontSize: '0.7rem', color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>Total Paid</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: '900', color: T.textPrimary }}>₹{order.totalAmount}</div>
                      </div>
                      <Link to={`/account/orders/${order._id}`} style={{
                        padding: '0.6rem 1.25rem', fontSize: '0.82rem', fontWeight: '700', borderRadius: '10px',
                        backgroundColor: T.brand, color: '#FFFFFF', textDecoration: 'none',
                        display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                      }}>
                        <span>View Details</span><ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================================================
          TAB 3: WISHLIST
          ================================================ */}
      {activeTab === 'wishlist' && (
        <div>
          {wishlistItems.length === 0 ? (
            <div style={{ ...cardStyle, padding: '4rem 1.5rem', textAlign: 'center' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: T.dangerBg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                <Heart size={30} color={T.danger} />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: T.textPrimary, margin: '0 0 0.35rem 0' }}>Your wishlist is empty</h3>
              <p style={{ color: T.textMuted, fontSize: '0.88rem', margin: '0 0 1.5rem 0' }}>
                "Your wishlist is waiting for something delicious."
              </p>
              <Link to="/shop" style={{
                padding: '0.7rem 1.75rem', fontSize: '0.85rem', fontWeight: '700', borderRadius: '999px',
                backgroundColor: T.brand, color: '#FFFFFF', textDecoration: 'none',
                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              }}>
                <span>Explore Products</span><ArrowRight size={15} />
              </Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.25rem' }}>
              {wishlistItems.map((item) => {
                const pId = item._id || item.slug;
                const variant = item.variants?.[0];
                const price = variant?.price || item.price;
                const original = variant?.originalPrice || item.originalPrice;
                return (
                  <div key={pId} style={{ ...cardStyle, overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column' }}>
                    {/* Remove */}
                    <button
                      type="button"
                      onClick={() => toggleWishlist(item)}
                      aria-label="Remove from wishlist"
                      style={{
                        position: 'absolute', top: '10px', right: '10px', zIndex: 5,
                        backgroundColor: 'rgba(255,255,255,0.9)', border: 'none', color: T.danger,
                        width: '32px', height: '32px', borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                        boxShadow: T.shadow,
                      }}
                    >
                      <Heart size={16} fill={T.danger} color={T.danger} />
                    </button>

                    {/* Image */}
                    <div style={{ position: 'relative', paddingTop: '72%', backgroundColor: T.surfaceAlt }}>
                      <Link to={`/product/${item.slug || pId}`}>
                        <img src={item.image} alt={item.title} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                      </Link>
                    </div>

                    {/* Info */}
                    <div style={{ padding: '1.1rem', display: 'flex', flexDirection: 'column', flexGrow: 1, gap: '0.75rem' }}>
                      <div>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: '800', color: T.textPrimary, margin: '0 0 0.25rem 0' }}>
                          <Link to={`/product/${item.slug || pId}`} style={{ color: 'inherit', textDecoration: 'none' }}>{item.title}</Link>
                        </h4>
                        <p style={{ fontSize: '0.78rem', color: T.textMuted, margin: 0, lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                          {item.subtitle || item.description}
                        </p>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.65rem', borderTop: `1px solid ${T.border}` }}>
                        <div>
                          <span style={{ fontSize: '1.1rem', fontWeight: '900', color: T.textPrimary }}>₹{price}</span>
                          {original && original > price && <span style={{ fontSize: '0.78rem', color: T.textMuted, textDecoration: 'line-through', marginLeft: '0.4rem' }}>₹{original}</span>}
                        </div>
                        <button
                          type="button"
                          onClick={() => addToCart(item, variant)}
                          style={{
                            padding: '0.5rem 0.9rem', fontSize: '0.78rem', fontWeight: '700', borderRadius: '8px',
                            backgroundColor: T.brand, color: '#FFFFFF', border: 'none', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '0.3rem',
                          }}
                        >
                          <ShoppingBag size={13} /><span>Add to Cart</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================================================
          TAB 4: ADDRESSES
          ================================================ */}
      {activeTab === 'addresses' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: '800', color: T.textPrimary, margin: 0 }}>Saved Delivery Addresses</h2>
            <button
              type="button"
              onClick={handleOpenAddAddress}
              style={{
                padding: '0.65rem 1.2rem', fontSize: '0.83rem', fontWeight: '700', borderRadius: '10px',
                backgroundColor: T.brand, color: '#FFFFFF', border: 'none', cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              }}
            >
              <Plus size={16} /><span>Add New Address</span>
            </button>
          </div>

          {!user?.addresses?.length ? (
            <div style={{ ...cardStyle, padding: '3.5rem 1.5rem', textAlign: 'center' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: T.accentLight, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                <MapPin size={28} color={T.accent} />
              </div>
              <h4 style={{ fontSize: '1rem', fontWeight: '800', color: T.textPrimary, margin: '0 0 0.35rem 0' }}>No saved addresses</h4>
              <p style={{ color: T.textMuted, fontSize: '0.85rem', margin: '0 0 1.25rem 0' }}>Add your delivery address for instant checkout.</p>
              <button
                type="button"
                onClick={handleOpenAddAddress}
                style={{ padding: '0.6rem 1.35rem', fontSize: '0.83rem', fontWeight: '700', borderRadius: '10px', backgroundColor: T.brand, color: '#FFFFFF', border: 'none', cursor: 'pointer' }}
              >
                Add Address Now
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.15rem' }}>
              {user.addresses.map((addr, idx) => (
                <div
                  key={addr._id || addr.id || idx}
                  style={{
                    backgroundColor: T.surface,
                    borderRadius: '16px',
                    border: addr.isDefault ? `2px solid ${T.accent}` : `1px solid ${T.border}`,
                    padding: '1.5rem',
                    boxShadow: addr.isDefault ? `0 4px 20px rgba(197, 138, 53, 0.15)` : T.shadow,
                    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.95rem', fontWeight: '800', color: T.textPrimary }}>{addr.fullName}</span>
                        {addr.isDefault && (
                          <span style={{ fontSize: '0.62rem', fontWeight: '800', textTransform: 'uppercase', backgroundColor: T.accentLight, color: T.accent, padding: '0.12rem 0.5rem', borderRadius: '999px', border: `1px solid ${T.border}` }}>
                            Default
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '0.64rem', fontWeight: '700', textTransform: 'uppercase', backgroundColor: T.brandLight, color: T.brand, padding: '0.2rem 0.6rem', borderRadius: '6px' }}>
                        {addr.addressType || 'Home'}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: T.textSecondary, lineHeight: '1.55', margin: '0 0 0.5rem 0' }}>
                      {addr.building && `${addr.building}, `}{addr.addressLine}, {addr.city}, {addr.state} — {addr.pincode}
                    </p>
                    <p style={{ fontSize: '0.8rem', color: T.textMuted, margin: 0 }}>📞 {addr.phone}</p>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.85rem', borderTop: `1px solid ${T.border}`, marginTop: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {!addr.isDefault && (
                      <button
                        type="button"
                        onClick={() => handleSetDefault(addr._id || addr.id)}
                        style={{ background: 'none', border: 'none', color: T.accent, fontSize: '0.78rem', fontWeight: '700', cursor: 'pointer', padding: 0 }}
                      >
                        Set as Default
                      </button>
                    )}
                    {addr.isDefault && <span style={{ fontSize: '0.75rem', color: T.textMuted }} />}
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <button type="button" onClick={() => handleOpenEditAddress(addr)} style={{ background: 'none', border: 'none', color: T.brand, fontSize: '0.78rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Edit3 size={13} /> Edit
                      </button>
                      <button type="button" onClick={() => setDeleteAddrTargetId(addr._id || addr.id)} style={{ background: 'none', border: 'none', color: T.danger, fontSize: '0.78rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================================================
          TAB 5: PROFILE
          ================================================ */}
      {activeTab === 'profile' && (
        <div style={{ ...cardStyle, padding: '2.25rem', maxWidth: '600px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: '800', color: T.textPrimary, margin: 0 }}>Personal Information</h2>
            {!profileEditMode && (
              <button
                onClick={() => setProfileEditMode(true)}
                style={{ padding: '0.5rem 1rem', fontSize: '0.82rem', fontWeight: '700', borderRadius: '10px', border: `1px solid ${T.border}`, backgroundColor: T.brandLight, color: T.brand, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <Edit3 size={14} /> Edit Profile
              </button>
            )}
          </div>

          {!profileEditMode ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              {[
                { label: 'Full Name', value: user?.name, icon: User },
                { label: 'Email Address', value: user?.email, icon: Mail },
                { label: 'Mobile Number', value: user?.phone || '—', icon: Phone },
              ].map((field) => {
                const Icon = field.icon;
                return (
                  <div key={field.label} style={{ padding: '1rem', backgroundColor: T.surfaceAlt, borderRadius: '12px', border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: T.brandLight, flexShrink: 0 }}>
                      <Icon size={15} color={T.brand} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: T.textMuted, fontWeight: '700', marginBottom: '0.15rem' }}>{field.label}</div>
                      <div style={{ fontSize: '0.92rem', fontWeight: '700', color: T.textPrimary }}>{field.value}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {[
                { label: 'Full Name *', key: 'name', type: 'text', required: true, placeholder: 'Your full name' },
                { label: 'Email Address *', key: 'email', type: 'email', required: true, placeholder: 'your@email.com' },
                { label: 'Mobile Number', key: 'phone', type: 'tel', required: false, placeholder: '+91 98765 43210' },
              ].map((field) => (
                <div key={field.key}>
                  <label style={labelStyle}>{field.label}</label>
                  <input
                    type={field.type}
                    required={field.required}
                    placeholder={field.placeholder}
                    value={profileForm[field.key]}
                    onChange={(e) => setProfileForm({ ...profileForm, [field.key]: e.target.value })}
                    style={inputStyle}
                  />
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setProfileEditMode(false)} style={{ padding: '0.65rem 1.25rem', fontSize: '0.83rem', fontWeight: '700', borderRadius: '10px', border: `1px solid ${T.border}`, color: T.textSecondary, backgroundColor: T.surface, cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" disabled={savingProfile} style={{ padding: '0.65rem 1.75rem', fontSize: '0.83rem', fontWeight: '700', borderRadius: '10px', border: 'none', backgroundColor: T.brand, color: '#FFFFFF', cursor: 'pointer', opacity: savingProfile ? 0.75 : 1 }}>
                  {savingProfile ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ================================================
          TAB 6: CHANGE PASSWORD
          ================================================ */}
      {activeTab === 'password' && (
        <div style={{ ...cardStyle, padding: '2.25rem', maxWidth: '520px' }}>
          <h2 style={{ fontSize: '1.05rem', fontWeight: '800', color: T.textPrimary, margin: '0 0 0.4rem 0' }}>Update Password</h2>
          <p style={{ fontSize: '0.84rem', color: T.textMuted, margin: '0 0 1.75rem 0' }}>Keep your account secure with a strong password.</p>

          <form onSubmit={handleSavePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Current Password */}
            <div>
              <label style={labelStyle}>Current Password *</label>
              <div style={{ position: 'relative' }}>
                <input type={showCurrentPassword ? 'text' : 'password'} required value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  placeholder="Enter current password" style={{ ...inputStyle, paddingRight: '44px' }} />
                <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: T.textMuted, cursor: 'pointer', padding: 0 }}>
                  {showCurrentPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label style={labelStyle}>New Password *</label>
              <div style={{ position: 'relative' }}>
                <input type={showNewPassword ? 'text' : 'password'} required value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  placeholder="Enter strong new password" style={{ ...inputStyle, paddingRight: '44px' }} />
                <button type="button" onClick={() => setShowNewPassword(!showNewPassword)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: T.textMuted, cursor: 'pointer', padding: 0 }}>
                  {showNewPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {/* Strength Checklist */}
              {passwordForm.newPassword && (
                <div style={{ marginTop: '0.65rem', padding: '0.85rem', backgroundColor: T.surfaceAlt, borderRadius: '10px', border: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  {passwordChecklist.map((req, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: req.pass ? T.success : T.textMuted, fontWeight: '600' }}>
                      <div style={{ width: '14px', height: '14px', borderRadius: '50%', backgroundColor: req.pass ? T.successBg : T.surfaceAlt, border: `1px solid ${req.pass ? '#A5D6A7' : T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {req.pass && <Check size={9} color={T.success} strokeWidth={3} />}
                      </div>
                      {req.label}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label style={labelStyle}>Confirm New Password *</label>
              <div style={{ position: 'relative' }}>
                <input type={showConfirmPassword ? 'text' : 'password'} required value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  placeholder="Re-enter new password" style={{ ...inputStyle, paddingRight: '44px' }} />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: T.textMuted, cursor: 'pointer', padding: 0 }}>
                  {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword && (
                <div style={{ fontSize: '0.78rem', color: T.danger, marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <AlertCircle size={13} /> Passwords do not match
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button type="submit" disabled={passwordLoading} style={{
                padding: '0.75rem 2rem', fontSize: '0.85rem', borderRadius: '10px',
                border: 'none', backgroundColor: T.brand, color: '#FFFFFF',
                fontWeight: '700', cursor: 'pointer', opacity: passwordLoading ? 0.75 : 1,
                display: 'flex', alignItems: 'center', gap: '0.4rem',
              }}>
                {passwordLoading ? <><RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} /> Updating...</> : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================================================
          ADDRESS MODAL
          ================================================ */}
      {showAddressModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(50,30,15,0.5)', backdropFilter: 'blur(4px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{
            backgroundColor: T.surface, borderRadius: '20px', border: `1px solid ${T.border}`,
            width: '100%', maxWidth: '540px', padding: '2rem', boxShadow: '0 20px 60px rgba(90, 46, 22, 0.20)',
            position: 'relative', maxHeight: '90vh', overflowY: 'auto',
          }}>
            <button onClick={() => setShowAddressModal(false)} style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'none', border: 'none', color: T.textMuted, cursor: 'pointer', padding: '0.2rem' }}>
              <X size={20} />
            </button>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: T.textPrimary, marginBottom: '1.5rem' }}>
              {editingAddress ? 'Edit Address' : 'Add New Address'}
            </h3>

            <form onSubmit={handleSaveAddress} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Full Name *</label>
                  <input type="text" required value={addressForm.fullName} onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Phone *</label>
                  <input type="tel" required value={addressForm.phone} onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })} style={inputStyle} />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Street Address *</label>
                <input type="text" required value={addressForm.addressLine} onChange={(e) => setAddressForm({ ...addressForm, addressLine: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Building / Flat / Apartment</label>
                <input type="text" value={addressForm.building} onChange={(e) => setAddressForm({ ...addressForm, building: e.target.value })} style={inputStyle} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                <div><label style={labelStyle}>City *</label><input type="text" required value={addressForm.city} onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })} style={inputStyle} /></div>
                <div><label style={labelStyle}>State *</label><input type="text" required value={addressForm.state} onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })} style={inputStyle} /></div>
                <div><label style={labelStyle}>Pincode *</label><input type="text" required maxLength={6} value={addressForm.pincode} onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })} style={inputStyle} /></div>
              </div>

              <div>
                <label style={labelStyle}>Address Type</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {['Home', 'Work', 'Other'].map((t) => (
                    <button key={t} type="button" onClick={() => setAddressForm({ ...addressForm, addressType: t })}
                      style={{ padding: '0.45rem 1rem', fontSize: '0.82rem', fontWeight: '700', borderRadius: '8px', cursor: 'pointer', border: `1px solid ${addressForm.addressType === t ? T.brand : T.border}`, backgroundColor: addressForm.addressType === t ? T.brand : T.surface, color: addressForm.addressType === t ? '#FFFFFF' : T.textSecondary }}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowAddressModal(false)} style={{ padding: '0.65rem 1.25rem', fontSize: '0.83rem', borderRadius: '10px', border: `1px solid ${T.border}`, color: T.textSecondary, backgroundColor: T.surface, cursor: 'pointer', fontWeight: '600' }}>
                  Cancel
                </button>
                <button type="submit" style={{ padding: '0.65rem 1.75rem', fontSize: '0.83rem', borderRadius: '10px', border: 'none', backgroundColor: T.brand, color: '#FFFFFF', fontWeight: '700', cursor: 'pointer' }}>
                  Save Address
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modals */}
      <ConfirmationModal
        isOpen={showLogoutModal}
        title="Logout from MILASTY?"
        message="Are you sure you want to logout from your account?"
        confirmText="Logout"
        cancelText="Cancel"
        isDanger={true}
        onConfirm={confirmLogout}
        onCancel={() => setShowLogoutModal(false)}
      />
      <ConfirmationModal
        isOpen={!!deleteAddrTargetId}
        title="Delete Address?"
        message="Are you sure you want to remove this delivery address?"
        confirmText="Delete Address"
        cancelText="Cancel"
        isDanger={true}
        onConfirm={confirmDeleteAddress}
        onCancel={() => setDeleteAddrTargetId(null)}
      />
    </div>
  );
}
