import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutGrid, Package, Heart, MapPin, User, Lock, LogOut, Menu, X, 
  ChevronRight, Plus, Trash2, Edit3, ShoppingBag, Search, Filter, 
  Calendar, ArrowRight, ShieldCheck, CheckCircle2, RefreshCw, Check, 
  ExternalLink, AlertCircle, Eye, EyeOff, Mail, Phone 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import ConfirmationModal from '../components/ConfirmationModal';
import api from '../api/axios';
import { initialProducts } from '../data/seedData';

// Skeleton Loader Helper Component for smooth loading states
function SkeletonBox({ height = '40px', width = '100%', borderRadius = '12px', className = '' }) {
  return (
    <div 
      className={`milasty-skeleton-pulse ${className}`} 
      style={{ height, width, borderRadius }}
    />
  );
}

export default function AccountDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout, addAddress, deleteAddress, updateProfile, updateAddress } = useAuth();
  const { wishlistItems, wishlistCount, toggleWishlist } = useWishlist();
  const { totalItemCount, setIsCartOpen, addToCart } = useCart();
  const { toast } = useToast();

  const queryTab = new URLSearchParams(location.search).get('tab');
  const [activeTab, setActiveTab] = useState(queryTab || 'overview');

  useEffect(() => {
    if (queryTab) {
      setActiveTab(queryTab);
    }
  }, [queryTab]);

  // Mobile drawer state
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Logout confirmation modal state
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Orders State
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('All');

  // Modals & Forms State
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [deleteAddrTargetId, setDeleteAddrTargetId] = useState(null);
  const [addressForm, setAddressForm] = useState({
    fullName: '',
    phone: '',
    addressLine: '',
    building: '',
    city: '',
    state: '',
    pincode: '',
    addressType: 'Home',
  });

  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [savingProfile, setSavingProfile] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchOrders();
    if (user) {
      setProfileForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }
  }, [isAuthenticated, user]);

  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await api.get('/orders/my-orders');
      if (res.data) {
        setOrders(res.data);
      }
    } catch (err) {
      setOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  // Handle Logout Confirmation
  const confirmLogout = () => {
    setShowLogoutModal(false);
    logout();
    toast.success('Logged out successfully from your MILASTY account.');
    navigate('/', { replace: true });
  };

  // Address Handlers
  const handleOpenAddAddress = () => {
    setEditingAddress(null);
    setAddressForm({
      fullName: user?.name || '',
      phone: user?.phone || '',
      addressLine: '',
      building: '',
      city: '',
      state: '',
      pincode: '',
      addressType: 'Home',
    });
    setShowAddressModal(true);
  };

  const handleOpenEditAddress = (addr) => {
    setEditingAddress(addr);
    setAddressForm({
      fullName: addr.fullName || '',
      phone: addr.phone || '',
      addressLine: addr.addressLine || '',
      building: addr.building || '',
      city: addr.city || '',
      state: addr.state || '',
      pincode: addr.pincode || '',
      addressType: addr.addressType || 'Home',
    });
    setShowAddressModal(true);
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    try {
      if (editingAddress) {
        await updateAddress(editingAddress._id, addressForm);
        toast.success('Address updated successfully.');
      } else {
        await addAddress(addressForm);
        toast.success('New delivery address saved.');
      }
      setShowAddressModal(false);
    } catch (err) {
      toast.error('Failed to save address. Please try again.');
    }
  };

  const confirmDeleteAddress = async () => {
    if (!deleteAddrTargetId) return;
    try {
      await deleteAddress(deleteAddrTargetId);
      toast.success('Delivery address removed.');
      setDeleteAddrTargetId(null);
    } catch (err) {
      toast.error('Failed to delete address.');
    }
  };

  // Profile Save Handler
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!profileForm.name.trim() || !profileForm.email.trim()) {
      toast.error('Name and Email are required.');
      return;
    }
    setSavingProfile(true);
    try {
      await updateProfile(profileForm);
      toast.success('Profile details updated successfully.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  // Password Change Handler
  const handleSavePassword = async (e) => {
    e.preventDefault();
    if (!passwordForm.currentPassword) {
      toast.error('Please enter your current password.');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }
    const passwordRequirements = [
      passwordForm.newPassword.length >= 8,
      /[A-Z]/.test(passwordForm.newPassword),
      /[a-z]/.test(passwordForm.newPassword),
      /\d/.test(passwordForm.newPassword),
    ];
    if (!passwordRequirements.every(Boolean)) {
      toast.error('Password must be 8+ characters with uppercase, lowercase, and numbers.');
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await api.put('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success(res.data?.message || 'Password changed successfully.');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setActiveTab('overview');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error updating password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  // Password Checklist Metrics
  const passwordChecklist = [
    { label: 'At least 8 characters', pass: passwordForm.newPassword.length >= 8 },
    { label: 'One uppercase letter (A-Z)', pass: /[A-Z]/.test(passwordForm.newPassword) },
    { label: 'One lowercase letter (a-z)', pass: /[a-z]/.test(passwordForm.newPassword) },
    { label: 'One number (0-9)', pass: /\d/.test(passwordForm.newPassword) },
  ];

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';
  const recentOrders = orders.slice(0, 3);
  const recommendedProducts = initialProducts.slice(0, 3);

  // Filtered Orders for Orders Tab
  const filteredOrders = orders.filter((order) => {
    const orderIdStr = (order.orderNumber || order._id || '').toLowerCase();
    const matchesSearch = orderIdStr.includes(orderSearch.toLowerCase());
    if (orderStatusFilter === 'All') return matchesSearch;
    return matchesSearch && (order.status === orderStatusFilter || order.orderStatus === orderStatusFilter);
  });

  // Navigation Items Definitions
  const mainNavItems = [
    { id: 'overview', label: 'Dashboard', icon: LayoutGrid },
    { id: 'orders', label: 'My Orders', icon: Package, badge: orders.length },
    { id: 'wishlist', label: 'Wishlist', icon: Heart, badge: wishlistCount },
    { id: 'addresses', label: 'Addresses', icon: MapPin, badge: user?.addresses?.length || 0 },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  const accountNavItems = [
    { id: 'password', label: 'Change Password', icon: Lock },
  ];

  // Helper renderer for Sidebar Links
  const renderNavButtons = (closeDrawerOnSelect = false) => (
    <>
      <div className="milasty-sidebar-section-title">MAIN</div>
      <div className="milasty-sidebar-nav">
        {mainNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                if (closeDrawerOnSelect) setMobileDrawerOpen(false);
              }}
              className={`milasty-sidebar-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} />
              <span style={{ flexGrow: 1 }}>{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: '800',
                    backgroundColor: isActive ? '#FFFFFF' : 'rgba(245, 235, 221, 0.15)',
                    color: isActive ? '#274C37' : '#F7F0E4',
                    padding: '0.15rem 0.5rem',
                    borderRadius: '999px',
                  }}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="milasty-sidebar-divider" />

      <div className="milasty-sidebar-section-title">ACCOUNT</div>
      <div className="milasty-sidebar-nav">
        {accountNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                if (closeDrawerOnSelect) setMobileDrawerOpen(false);
              }}
              className={`milasty-sidebar-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}

        {/* Logout Button */}
        <button
          type="button"
          onClick={() => {
            if (closeDrawerOnSelect) setMobileDrawerOpen(false);
            setShowLogoutModal(true);
          }}
          className="milasty-sidebar-item"
          style={{ color: '#D9534F' }}
        >
          <LogOut size={18} color="#D9534F" />
          <span>Logout</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="account-dashboard-page" style={{ color: '#F5F5F5' }}>

            {/* ==================================================
                TAB 1: OVERVIEW / DASHBOARD MAIN
               ================================================== */}
            {activeTab === 'overview' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                
                {/* 1. ACCOUNT HERO CARD (Customer Name shown ONCE here) */}
                <div
                  style={{
                    background: '#111613',
                    borderRadius: '20px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    padding: '1.75rem 1.75rem',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1.5rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
                    <div
                      style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        backgroundColor: '#1D3B28',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.65rem',
                        fontFamily: 'var(--font-serif)',
                        fontWeight: '800',
                        border: '1px solid rgba(133, 184, 112, 0.3)',
                      }}
                    >
                      {userInitial}
                    </div>

                    <div>
                      <span style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#85B870', fontWeight: '800' }}>
                        GOOD MORNING 👋
                      </span>
                      <h2 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-serif)', color: '#F0F4F1', fontWeight: '800', margin: '0.1rem 0 0.35rem 0' }}>
                        Welcome back, {user?.name}
                      </h2>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.82rem', color: '#9EB0A2', fontWeight: '600' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Mail size={14} color="#85B870" /> {user?.email}</span>
                        {user?.phone && <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Phone size={14} color="#85B870" /> {user.phone}</span>}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => setActiveTab('profile')}
                      style={{
                        padding: '0.55rem 1.05rem',
                        fontSize: '0.8rem',
                        fontWeight: '700',
                        borderRadius: '10px',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        color: '#F0F4F1',
                        backgroundColor: 'rgba(255, 255, 255, 0.04)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                      }}
                    >
                      <Edit3 size={14} color="#85B870" />
                      <span>Edit Profile</span>
                    </button>

                    <button
                      onClick={() => setActiveTab('password')}
                      style={{
                        padding: '0.55rem 1.05rem',
                        fontSize: '0.8rem',
                        fontWeight: '700',
                        borderRadius: '10px',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        color: '#F0F4F1',
                        backgroundColor: 'rgba(255, 255, 255, 0.04)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                      }}
                    >
                      <Lock size={14} color="#85B870" />
                      <span>Change Password</span>
                    </button>

                    <button
                      onClick={() => setShowLogoutModal(true)}
                      style={{
                        padding: '0.55rem 1.05rem',
                        fontSize: '0.8rem',
                        fontWeight: '700',
                        borderRadius: '10px',
                        border: '1px solid rgba(217, 83, 79, 0.3)',
                        color: '#D9534F',
                        backgroundColor: 'rgba(217, 83, 79, 0.08)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                      }}
                    >
                      <LogOut size={14} color="#D9534F" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>

                {/* 2. STAT CARDS (Matching Image 2 Admin Dashboard Style) */}
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontFamily: 'var(--font-serif)', color: '#F0F4F1', fontWeight: '800', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Account Summary
                  </h3>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.15rem' }}>
                    
                    {/* Orders Card (Green Accent) */}
                    <div className="milasty-stat-card" onClick={() => setActiveTab('orders')}>
                      <div className="milasty-stat-icon-wrapper" style={{ backgroundColor: 'rgba(29, 59, 40, 0.4)', color: '#85B870' }}>
                        <Package size={22} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.68rem', color: '#7B8E80', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em' }}>TOTAL ORDERS</div>
                        {loadingOrders ? (
                          <SkeletonBox height="24px" width="50px" />
                        ) : (
                          <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#F0F4F1', margin: '0.1rem 0' }}>{orders.length}</div>
                        )}
                        <div style={{ fontSize: '0.74rem', color: '#85B870', fontWeight: '600' }}>Track purchases</div>
                      </div>
                    </div>

                    {/* Wishlist Card (Red/Pink Accent) */}
                    <div className="milasty-stat-card" onClick={() => setActiveTab('wishlist')}>
                      <div className="milasty-stat-icon-wrapper" style={{ backgroundColor: 'rgba(217, 83, 79, 0.15)', color: '#D9534F' }}>
                        <Heart size={22} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.68rem', color: '#7B8E80', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em' }}>SAVED WISHLIST</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#F0F0F1', margin: '0.1rem 0' }}>{wishlistCount}</div>
                        <div style={{ fontSize: '0.74rem', color: '#D9534F', fontWeight: '600' }}>Favourite bakes</div>
                      </div>
                    </div>

                    {/* Addresses Card (Yellow/Gold Accent) */}
                    <div className="milasty-stat-card" onClick={() => setActiveTab('addresses')}>
                      <div className="milasty-stat-icon-wrapper" style={{ backgroundColor: 'rgba(185, 154, 91, 0.15)', color: '#B99A5B' }}>
                        <MapPin size={22} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.68rem', color: '#7B8E80', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em' }}>DELIVERY LOCATIONS</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#F0F4F1', margin: '0.1rem 0' }}>{user?.addresses?.length || 0}</div>
                        <div style={{ fontSize: '0.74rem', color: '#B99A5B', fontWeight: '600' }}>Saved addresses</div>
                      </div>
                    </div>

                    {/* Cart Card (Purple Accent) */}
                    <div className="milasty-stat-card" onClick={() => setIsCartOpen(true)}>
                      <div className="milasty-stat-icon-wrapper" style={{ backgroundColor: 'rgba(111, 66, 193, 0.18)', color: '#A586E8' }}>
                        <ShoppingBag size={22} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.68rem', color: '#7B8E80', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em' }}>CART ITEMS</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#F0F4F1', margin: '0.1rem 0' }}>{totalItemCount}</div>
                        <div style={{ fontSize: '0.74rem', color: '#A586E8', fontWeight: '600' }}>Active items</div>
                      </div>
                    </div>

                  </div>
                </div>

                {/* 3. TWO-COLUMN GRID: QUICK ACTIONS & RECENT ORDERS */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.75rem', alignItems: 'start' }}>
                  
                  {/* Column A: Quick Actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontFamily: 'var(--font-serif)', color: '#F0F4F1', fontWeight: '800', margin: 0 }}>
                      Quick Actions
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div
                        onClick={() => setActiveTab('orders')}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '1rem 1.25rem',
                          backgroundColor: '#111613',
                          borderRadius: '14px',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
                          <div style={{ padding: '9px', borderRadius: '10px', backgroundColor: 'rgba(29, 59, 40, 0.4)', color: '#85B870' }}>
                            <Package size={18} />
                          </div>
                          <div>
                            <h4 style={{ fontSize: '0.9rem', fontWeight: '800', color: '#F0F4F1', margin: 0 }}>Track My Orders</h4>
                            <p style={{ fontSize: '0.76rem', color: '#9EB0A2', margin: 0, fontWeight: '500' }}>Live journey & dispatch updates</p>
                          </div>
                        </div>
                        <ChevronRight size={18} color="#85B870" />
                      </div>

                      <div
                        onClick={() => setActiveTab('wishlist')}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '1rem 1.25rem',
                          backgroundColor: '#111613',
                          borderRadius: '14px',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
                          <div style={{ padding: '9px', borderRadius: '10px', backgroundColor: 'rgba(217, 83, 79, 0.15)', color: '#D9534F' }}>
                            <Heart size={18} />
                          </div>
                          <div>
                            <h4 style={{ fontSize: '0.9rem', fontWeight: '800', color: '#F0F4F1', margin: 0 }}>View Wishlist</h4>
                            <p style={{ fontSize: '0.76rem', color: '#9EB0A2', margin: 0, fontWeight: '500' }}>Saved favorites & rituals</p>
                          </div>
                        </div>
                        <ChevronRight size={18} color="#85B870" />
                      </div>

                      <div
                        onClick={() => setActiveTab('addresses')}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '1rem 1.25rem',
                          backgroundColor: '#111613',
                          borderRadius: '14px',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
                          <div style={{ padding: '9px', borderRadius: '10px', backgroundColor: 'rgba(185, 154, 91, 0.15)', color: '#B99A5B' }}>
                            <MapPin size={18} />
                          </div>
                          <div>
                            <h4 style={{ fontSize: '0.9rem', fontWeight: '800', color: '#F0F4F1', margin: 0 }}>Manage Addresses</h4>
                            <p style={{ fontSize: '0.76rem', color: '#9EB0A2', margin: 0, fontWeight: '500' }}>Update shipping destinations</p>
                          </div>
                        </div>
                        <ChevronRight size={18} color="#85B870" />
                      </div>

                      <div
                        onClick={() => setActiveTab('profile')}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '1rem 1.25rem',
                          backgroundColor: '#111613',
                          borderRadius: '14px',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
                          <div style={{ padding: '9px', borderRadius: '10px', backgroundColor: 'rgba(255, 255, 255, 0.06)', color: '#F0F4F1' }}>
                            <User size={18} />
                          </div>
                          <div>
                            <h4 style={{ fontSize: '0.9rem', fontWeight: '800', color: '#F0F4F1', margin: 0 }}>Edit Profile</h4>
                            <p style={{ fontSize: '0.76rem', color: '#9EB0A2', margin: 0, fontWeight: '500' }}>Name, email & phone details</p>
                          </div>
                        </div>
                        <ChevronRight size={18} color="#85B870" />
                      </div>

                    </div>
                  </div>

                  {/* Column B: Recent Orders */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ fontSize: '1.1rem', fontFamily: 'var(--font-serif)', color: '#F0F4F1', fontWeight: '800', margin: 0 }}>
                        Recent Orders
                      </h3>
                      {orders.length > 0 && (
                        <button
                          onClick={() => setActiveTab('orders')}
                          style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '0.76rem',
                            color: '#85B870',
                            fontWeight: '800',
                            cursor: 'pointer',
                            textTransform: 'uppercase',
                            letterSpacing: '0.06em',
                          }}
                        >
                          View All ({orders.length})
                        </button>
                      )}
                    </div>

                    {loadingOrders ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <SkeletonBox height="100px" />
                        <SkeletonBox height="100px" />
                      </div>
                    ) : orders.length === 0 ? (
                      <div
                        style={{
                          padding: '2.25rem 1.25rem',
                          textAlign: 'center',
                          backgroundColor: '#111613',
                          borderRadius: '16px',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                        }}
                      >
                        <Package size={34} color="#85B870" style={{ margin: '0 auto 0.65rem' }} />
                        <h4 style={{ fontSize: '1.05rem', fontFamily: 'var(--font-serif)', color: '#F0F4F1', fontWeight: '800', margin: '0 0 0.3rem 0' }}>
                          No orders yet
                        </h4>
                        <p style={{ color: '#9EB0A2', fontSize: '0.82rem', margin: '0 0 1.15rem 0', fontWeight: '500' }}>
                          Your delicious MILASTY journey starts here.
                        </p>
                        <Link
                          to="/shop"
                          style={{
                            padding: '0.55rem 1.35rem',
                            fontSize: '0.8rem',
                            fontWeight: '800',
                            borderRadius: '999px',
                            backgroundColor: '#1D3B28',
                            color: '#FFFFFF',
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                          }}
                        >
                          <span>Explore MILASTY</span>
                          <ArrowRight size={14} />
                        </Link>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {recentOrders.map((order) => {
                          const statusStyleMap = {
                            Pending: { bg: 'rgba(185, 154, 91, 0.15)', text: '#B99A5B' },
                            Confirmed: { bg: 'rgba(29, 59, 40, 0.4)', text: '#85B870' },
                            Processing: { bg: 'rgba(29, 59, 40, 0.4)', text: '#85B870' },
                            Delivered: { bg: 'rgba(29, 59, 40, 0.5)', text: '#A2D186' },
                            Cancelled: { bg: 'rgba(217, 83, 79, 0.18)', text: '#D9534F' },
                          };
                          const currentStatus = order.status || order.orderStatus || 'Confirmed';
                          const statusStyle = statusStyleMap[currentStatus] || { bg: 'rgba(255,255,255,0.08)', text: '#9EB0A2' };
                          const formattedDate = new Date(order.createdAt || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

                          return (
                            <div
                              key={order._id}
                              style={{
                                backgroundColor: '#111613',
                                borderRadius: '14px',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                padding: '1.15rem',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.75rem',
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                  <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#F0F4F1' }}>
                                    ORDER #{order.orderNumber || order._id.slice(-8).toUpperCase()}
                                  </div>
                                  <span style={{ fontSize: '0.74rem', color: '#9EB0A2', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.15rem' }}>
                                    <Calendar size={12} color="#85B870" /> {formattedDate}
                                  </span>
                                </div>
                                <span style={{ fontSize: '0.65rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.04em', backgroundColor: statusStyle.bg, color: statusStyle.text, padding: '0.25rem 0.65rem', borderRadius: '999px' }}>
                                  {currentStatus}
                                </span>
                              </div>

                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.6rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                                <div>
                                  <span style={{ fontSize: '0.68rem', color: '#7B8E80', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: '700', display: 'block' }}>Total Amount</span>
                                  <span style={{ fontSize: '1.05rem', fontWeight: '900', color: '#F0F4F1' }}>₹{order.totalAmount}</span>
                                </div>
                                <Link
                                  to={`/account/orders/${order._id}`}
                                  style={{
                                    fontSize: '0.78rem',
                                    color: '#85B870',
                                    fontWeight: '800',
                                    textDecoration: 'none',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                  }}
                                >
                                  <span>View Order</span>
                                  <ArrowRight size={13} />
                                </Link>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* 4. RECOMMENDED BAKES ("MADE FOR YOUR RITUAL") */}
                <div style={{ borderTop: '1px solid rgba(245, 235, 221, 0.12)', paddingTop: '2.5rem' }}>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#B99A5B', fontWeight: '800', display: 'block' }}>
                      PERSONALIZED SELECTION
                    </span>
                    <h3 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-serif)', color: '#F7F0E4', fontWeight: '800', margin: '0.2rem 0 0 0' }}>
                      Made for Your Ritual
                    </h3>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
                    {recommendedProducts.map((p) => {
                      const selectedVariant = p.variants?.[0];
                      return (
                        <div
                          key={p._id || p.slug}
                          style={{
                            backgroundColor: '#24120B',
                            borderRadius: '20px',
                            border: '1px solid rgba(245, 235, 221, 0.16)',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                          }}
                        >
                          <div style={{ position: 'relative', paddingTop: '75%', backgroundColor: 'rgba(255, 255, 255, 0.04)' }}>
                            <Link to={`/product/${p.slug}`}>
                              <img
                                src={p.image}
                                alt={p.title}
                                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            </Link>
                          </div>

                          <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flexGrow: 1 }}>
                            <div>
                              <h4 style={{ fontSize: '1rem', fontFamily: 'var(--font-serif)', color: '#F7F0E4', fontWeight: '800', margin: '0 0 0.35rem 0' }}>
                                <Link to={`/product/${p.slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>{p.title}</Link>
                              </h4>
                              <p style={{ fontSize: '0.78rem', color: '#CDBFAE', margin: '0 0 0.85rem 0', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                {p.subtitle || p.description}
                              </p>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid rgba(245, 235, 221, 0.12)' }}>
                              <span style={{ fontSize: '1.1rem', fontWeight: '900', color: '#F7F0E4' }}>₹{selectedVariant?.price || p.price}</span>
                              <button
                                onClick={() => addToCart(p, selectedVariant)}
                                style={{
                                  padding: '0.55rem 1rem',
                                  fontSize: '0.78rem',
                                  fontWeight: '800',
                                  borderRadius: '10px',
                                  backgroundColor: '#274C37',
                                  color: '#FFFFFF',
                                  border: 'none',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.35rem',
                                }}
                              >
                                <ShoppingBag size={14} />
                                <span>Add to Cart</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            )}

            {/* ==================================================
                TAB 2: MY ORDERS TAB
               ================================================== */}
            {activeTab === 'orders' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
                
                {/* Search & Filter Bar */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#24120B', padding: '1.25rem', borderRadius: '18px', border: '1px solid rgba(245, 235, 221, 0.16)' }}>
                  
                  {/* Search input */}
                  <div style={{ position: 'relative', flexGrow: 1, minWidth: '220px' }}>
                    <Search size={16} color="#B99A5B" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="text"
                      value={orderSearch}
                      onChange={(e) => setOrderSearch(e.target.value)}
                      placeholder="Search order ID..."
                      style={{
                        width: '100%',
                        height: '42px',
                        paddingLeft: '40px',
                        paddingRight: '14px',
                        borderRadius: '10px',
                        border: '1px solid rgba(245, 235, 221, 0.2)',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        color: '#F7F0E4',
                        fontSize: '0.85rem',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  {/* Status filter buttons */}
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {['All', 'Confirmed', 'Processing', 'Delivered', 'Cancelled'].map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setOrderStatusFilter(status)}
                        style={{
                          padding: '0.45rem 0.85rem',
                          fontSize: '0.78rem',
                          fontWeight: '700',
                          borderRadius: '8px',
                          border: orderStatusFilter === status ? '1px solid #274C37' : '1px solid rgba(245, 235, 221, 0.16)',
                          backgroundColor: orderStatusFilter === status ? '#274C37' : 'rgba(255, 255, 255, 0.04)',
                          color: orderStatusFilter === status ? '#FFFFFF' : '#CDBFAE',
                          cursor: 'pointer',
                        }}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Orders List */}
                {loadingOrders ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <SkeletonBox height="140px" />
                    <SkeletonBox height="140px" />
                    <SkeletonBox height="140px" />
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <div style={{ padding: '3.5rem 1.5rem', textAlign: 'center', backgroundColor: '#24120B', borderRadius: '24px', border: '1px solid rgba(245, 235, 221, 0.16)' }}>
                    <Package size={42} color="#B99A5B" style={{ margin: '0 auto 1rem' }} />
                    <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-serif)', color: '#F7F0E4', fontWeight: '800', margin: '0 0 0.4rem 0' }}>
                      No orders found
                    </h3>
                    <p style={{ color: '#CDBFAE', fontSize: '0.88rem', margin: '0 0 1.5rem 0' }}>
                      {orderSearch || orderStatusFilter !== 'All' ? 'Try adjusting your search or status filter.' : 'You haven’t placed any orders yet.'}
                    </p>
                    <Link
                      to="/shop"
                      style={{
                        padding: '0.7rem 1.75rem',
                        fontSize: '0.85rem',
                        fontWeight: '800',
                        borderRadius: '999px',
                        backgroundColor: '#274C37',
                        color: '#FFFFFF',
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                      }}
                    >
                      <span>Explore Shop</span>
                      <ArrowRight size={15} />
                    </Link>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {filteredOrders.map((order) => {
                      const formattedDate = new Date(order.createdAt || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                      const currentStatus = order.status || order.orderStatus || 'Confirmed';

                      return (
                        <div
                          key={order._id}
                          style={{
                            backgroundColor: '#24120B',
                            borderRadius: '20px',
                            border: '1px solid rgba(245, 235, 221, 0.16)',
                            padding: '1.5rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1.15rem',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', borderBottom: '1px solid rgba(245, 235, 221, 0.12)', paddingBottom: '0.85rem' }}>
                            <div>
                              <div style={{ fontSize: '0.95rem', fontWeight: '850', color: '#F7F0E4' }}>
                                ORDER #{order.orderNumber || order._id.slice(-8).toUpperCase()}
                              </div>
                              <span style={{ fontSize: '0.78rem', color: '#CDBFAE', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.2rem' }}>
                                <Calendar size={13} color="#B99A5B" /> Placed on {formattedDate}
                              </span>
                            </div>

                            <span
                              style={{
                                fontSize: '0.72rem',
                                fontWeight: '800',
                                textTransform: 'uppercase',
                                letterSpacing: '0.04em',
                                backgroundColor: currentStatus === 'Cancelled' ? 'rgba(217, 83, 79, 0.2)' : 'rgba(39, 76, 55, 0.3)',
                                color: currentStatus === 'Cancelled' ? '#D9534F' : '#A2C579',
                                padding: '0.35rem 0.85rem',
                                borderRadius: '999px',
                                border: `1px solid ${currentStatus === 'Cancelled' ? 'rgba(217, 83, 79, 0.3)' : 'rgba(39, 76, 55, 0.4)'}`
                              }}
                            >
                              {currentStatus}
                            </span>
                          </div>

                          {/* Items List Preview */}
                          {order.items && order.items.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                              {order.items.map((item, idx) => (
                                <div key={idx} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                  <img
                                    src={item.image}
                                    alt={item.title}
                                    style={{ width: '54px', height: '54px', borderRadius: '10px', objectFit: 'cover', border: '1px solid rgba(245, 235, 221, 0.15)' }}
                                  />
                                  <div style={{ flexGrow: 1 }}>
                                    <h4 style={{ fontSize: '0.88rem', fontWeight: '800', color: '#F7F0E4', margin: '0 0 0.15rem 0' }}>
                                      {item.title}
                                    </h4>
                                    <span style={{ fontSize: '0.76rem', color: '#CDBFAE' }}>
                                      Qty: {item.quantity} • {item.weight || 'Standard'}
                                    </span>
                                  </div>
                                  <span style={{ fontSize: '0.9rem', fontWeight: '800', color: '#F7F0E4' }}>
                                    ₹{item.price * item.quantity}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Total & Action Footer */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.85rem', borderTop: '1px solid rgba(245, 235, 221, 0.12)' }}>
                            <div>
                              <span style={{ fontSize: '0.72rem', color: '#CDBFAE', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: '700' }}>
                                Total Paid
                              </span>
                              <div style={{ fontSize: '1.25rem', fontWeight: '900', color: '#F7F0E4' }}>
                                ₹{order.totalAmount}
                              </div>
                            </div>

                            <Link
                              to={`/account/orders/${order._id}`}
                              style={{
                                padding: '0.6rem 1.25rem',
                                fontSize: '0.82rem',
                                fontWeight: '800',
                                borderRadius: '10px',
                                backgroundColor: '#274C37',
                                color: '#FFFFFF',
                                textDecoration: 'none',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                              }}
                            >
                              <span>View Details</span>
                              <ArrowRight size={14} />
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

              </div>
            )}

            {/* ==================================================
                TAB 3: WISHLIST TAB
               ================================================== */}
            {activeTab === 'wishlist' && (
              <div>
                {wishlistItems.length === 0 ? (
                  <div style={{ padding: '3.5rem 1.5rem', textAlign: 'center', backgroundColor: '#24120B', borderRadius: '24px', border: '1px solid rgba(245, 235, 221, 0.16)' }}>
                    <Heart size={44} color="#D9534F" style={{ margin: '0 auto 1rem' }} />
                    <h3 style={{ fontSize: '1.3rem', fontFamily: 'var(--font-serif)', color: '#F7F0E4', fontWeight: '800', margin: '0 0 0.35rem 0' }}>
                      Your wishlist is empty
                    </h3>
                    <p style={{ color: '#CDBFAE', fontSize: '0.88rem', margin: '0 0 1.5rem 0', fontWeight: '500' }}>
                      Save your favourite organic bakes to quickly re-order them later.
                    </p>
                    <Link
                      to="/shop"
                      style={{
                        padding: '0.7rem 1.75rem',
                        fontSize: '0.85rem',
                        fontWeight: '800',
                        borderRadius: '999px',
                        backgroundColor: '#274C37',
                        color: '#FFFFFF',
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                      }}
                    >
                      <span>Explore Shop</span>
                      <ArrowRight size={15} />
                    </Link>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
                    {wishlistItems.map((item) => {
                      const pId = item._id || item.slug;
                      const selectedVariant = item.variants?.[0];
                      const sellingPrice = selectedVariant?.price || item.price;
                      const originalPrice = selectedVariant?.originalPrice || item.originalPrice;

                      return (
                        <div
                          key={pId}
                          style={{
                            backgroundColor: '#24120B',
                            borderRadius: '20px',
                            border: '1px solid rgba(245, 235, 221, 0.16)',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                            position: 'relative',
                          }}
                        >
                          {/* Remove from wishlist button */}
                          <button
                            type="button"
                            onClick={() => {
                              toggleWishlist(item);
                              toast.info('Item removed from wishlist.');
                            }}
                            aria-label="Remove item from wishlist"
                            style={{
                              position: 'absolute',
                              top: '12px',
                              right: '12px',
                              zIndex: 5,
                              backgroundColor: 'rgba(20, 10, 5, 0.75)',
                              border: 'none',
                              color: '#D9534F',
                              width: '34px',
                              height: '34px',
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                            }}
                          >
                            <Heart size={18} fill="#D9534F" color="#D9534F" />
                          </button>

                          <div style={{ position: 'relative', paddingTop: '75%', backgroundColor: 'rgba(255, 255, 255, 0.04)' }}>
                            <Link to={`/product/${item.slug || pId}`}>
                              <img
                                src={item.image}
                                alt={item.title}
                                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            </Link>
                          </div>

                          <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flexGrow: 1 }}>
                            <div>
                              <h4 style={{ fontSize: '1.05rem', fontFamily: 'var(--font-serif)', color: '#F7F0E4', fontWeight: '800', margin: '0 0 0.35rem 0' }}>
                                <Link to={`/product/${item.slug || pId}`} style={{ color: 'inherit', textDecoration: 'none' }}>{item.title}</Link>
                              </h4>
                              <p style={{ fontSize: '0.8rem', color: '#CDBFAE', margin: '0 0 1rem 0', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                {item.subtitle || item.description}
                              </p>
                            </div>

                            {/* Dual Price Comparison logic */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid rgba(245, 235, 221, 0.12)' }}>
                              <div>
                                <span style={{ fontSize: '1.15rem', fontWeight: '900', color: '#F7F0E4' }}>
                                  ₹{sellingPrice}
                                </span>
                                {originalPrice && originalPrice > sellingPrice && (
                                  <span style={{ fontSize: '0.82rem', color: '#CDBFAE', textDecoration: 'line-through', marginLeft: '0.5rem' }}>
                                    ₹{originalPrice}
                                  </span>
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={() => addToCart(item, selectedVariant)}
                                style={{
                                  padding: '0.55rem 1rem',
                                  fontSize: '0.78rem',
                                  fontWeight: '800',
                                  borderRadius: '10px',
                                  backgroundColor: '#274C37',
                                  color: '#FFFFFF',
                                  border: 'none',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.35rem',
                                }}
                              >
                                <ShoppingBag size={14} />
                                <span>Add to Cart</span>
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

            {/* ==================================================
                TAB 4: ADDRESSES TAB
               ================================================== */}
            {activeTab === 'addresses' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-serif)', color: '#F7F0E4', fontWeight: '800', margin: 0 }}>
                      Saved Delivery Destinations
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={handleOpenAddAddress}
                    style={{
                      padding: '0.65rem 1.25rem',
                      fontSize: '0.82rem',
                      fontWeight: '800',
                      borderRadius: '12px',
                      backgroundColor: '#274C37',
                      color: '#FFFFFF',
                      border: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      cursor: 'pointer',
                    }}
                  >
                    <Plus size={16} />
                    <span>Add New Address</span>
                  </button>
                </div>

                {user?.addresses?.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem 1.5rem', backgroundColor: '#24120B', borderRadius: '24px', border: '1px dashed rgba(245, 235, 221, 0.2)' }}>
                    <MapPin size={38} color="#B99A5B" style={{ margin: '0 auto 0.85rem' }} />
                    <h4 style={{ fontSize: '1.1rem', fontFamily: 'var(--font-serif)', color: '#F7F0E4', fontWeight: '800', margin: '0 0 0.35rem 0' }}>
                      No saved addresses
                    </h4>
                    <p style={{ color: '#CDBFAE', fontSize: '0.85rem', margin: '0 0 1.25rem 0' }}>
                      Add your preferred delivery addresses for instant checkout.
                    </p>
                    <button
                      type="button"
                      onClick={handleOpenAddAddress}
                      style={{
                        padding: '0.6rem 1.35rem',
                        fontSize: '0.8rem',
                        fontWeight: '800',
                        borderRadius: '10px',
                        backgroundColor: '#274C37',
                        color: '#FFFFFF',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      Add Address Now
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                    {user?.addresses?.map((addr, idx) => (
                      <div
                        key={addr._id || idx}
                        style={{
                          backgroundColor: '#24120B',
                          borderRadius: '20px',
                          border: '1px solid rgba(245, 235, 221, 0.16)',
                          padding: '1.5rem',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                            <span style={{ fontSize: '0.95rem', fontWeight: '850', color: '#F7F0E4' }}>{addr.fullName}</span>
                            <span
                              style={{
                                fontSize: '0.65rem',
                                fontWeight: '800',
                                textTransform: 'uppercase',
                                backgroundColor: 'rgba(185, 154, 91, 0.15)',
                                color: '#B99A5B',
                                padding: '0.2rem 0.6rem',
                                borderRadius: '6px',
                                border: '1px solid rgba(185, 154, 91, 0.25)',
                              }}
                            >
                              {addr.addressType || 'Home'}
                            </span>
                          </div>

                          <p style={{ fontSize: '0.85rem', color: '#CDBFAE', lineHeight: '1.6', margin: '0 0 1rem 0', fontWeight: '500' }}>
                            {addr.building && `${addr.building}, `}{addr.addressLine}, {addr.city}, {addr.state} - {addr.pincode}
                          </p>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.85rem', borderTop: '1px solid rgba(245, 235, 221, 0.12)' }}>
                          <span style={{ fontSize: '0.78rem', color: '#F7F0E4', fontWeight: '700' }}>Phone: {addr.phone}</span>
                          <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button
                              type="button"
                              onClick={() => handleOpenEditAddress(addr)}
                              style={{ background: 'none', border: 'none', color: '#B99A5B', fontSize: '0.8rem', fontWeight: '800', cursor: 'pointer' }}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteAddrTargetId(addr._id)}
                              style={{ background: 'none', border: 'none', color: '#D9534F', fontSize: '0.8rem', fontWeight: '800', cursor: 'pointer' }}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ==================================================
                TAB 5: PROFILE TAB
               ================================================== */}
            {activeTab === 'profile' && (
              <div
                style={{
                  backgroundColor: '#24120B',
                  borderRadius: '24px',
                  border: '1px solid rgba(245, 235, 221, 0.16)',
                  padding: '2.25rem 2rem',
                  maxWidth: '600px',
                }}
              >
                <h3 style={{ fontSize: '1.3rem', fontFamily: 'var(--font-serif)', color: '#F7F0E4', fontWeight: '800', marginBottom: '1.5rem' }}>
                  Edit Profile Information
                </h3>

                <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div>
                    <label style={{ fontSize: '0.74rem', fontWeight: '800', color: '#F7F0E4', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      style={{
                        width: '100%',
                        height: '48px',
                        padding: '0 1rem',
                        borderRadius: '12px',
                        border: '1px solid rgba(245, 235, 221, 0.2)',
                        fontSize: '0.9rem',
                        outline: 'none',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        color: '#F7F0E4',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.74rem', fontWeight: '800', color: '#F7F0E4', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      style={{
                        width: '100%',
                        height: '48px',
                        padding: '0 1rem',
                        borderRadius: '12px',
                        border: '1px solid rgba(245, 235, 221, 0.2)',
                        fontSize: '0.9rem',
                        outline: 'none',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        color: '#F7F0E4',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.74rem', fontWeight: '800', color: '#F7F0E4', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Mobile Number
                    </label>
                    <input
                      type="tel"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      placeholder="+91 98765 43210"
                      style={{
                        width: '100%',
                        height: '48px',
                        padding: '0 1rem',
                        borderRadius: '12px',
                        border: '1px solid rgba(245, 235, 221, 0.2)',
                        fontSize: '0.9rem',
                        outline: 'none',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        color: '#F7F0E4',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.85rem', marginTop: '0.75rem' }}>
                    <button
                      type="submit"
                      disabled={savingProfile}
                      style={{
                        padding: '0.75rem 2rem',
                        fontSize: '0.85rem',
                        borderRadius: '12px',
                        border: 'none',
                        backgroundColor: '#274C37',
                        color: '#FFFFFF',
                        fontWeight: '800',
                        cursor: savingProfile ? 'not-allowed' : 'pointer',
                        opacity: savingProfile ? 0.75 : 1,
                      }}
                    >
                      {savingProfile ? 'Saving Changes...' : 'Save Profile Changes'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ==================================================
                TAB 6: CHANGE PASSWORD TAB
               ================================================== */}
            {activeTab === 'password' && (
              <div
                style={{
                  backgroundColor: '#24120B',
                  borderRadius: '24px',
                  border: '1px solid rgba(245, 235, 221, 0.16)',
                  padding: '2.25rem 2rem',
                  maxWidth: '600px',
                }}
              >
                <h3 style={{ fontSize: '1.3rem', fontFamily: 'var(--font-serif)', color: '#F7F0E4', fontWeight: '800', marginBottom: '1.5rem' }}>
                  Update Password
                </h3>

                <form onSubmit={handleSavePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  
                  {/* Current Password */}
                  <div>
                    <label style={{ fontSize: '0.74rem', fontWeight: '800', color: '#F7F0E4', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Current Password *
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        required
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                        placeholder="Enter current password"
                        style={{
                          width: '100%',
                          height: '48px',
                          paddingLeft: '1rem',
                          paddingRight: '44px',
                          borderRadius: '12px',
                          border: '1px solid rgba(245, 235, 221, 0.2)',
                          fontSize: '0.9rem',
                          outline: 'none',
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          color: '#F7F0E4',
                          boxSizing: 'border-box',
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#CDBFAE', cursor: 'pointer' }}
                      >
                        {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div>
                    <label style={{ fontSize: '0.74rem', fontWeight: '800', color: '#F7F0E4', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      New Password *
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        placeholder="Enter new strong password"
                        style={{
                          width: '100%',
                          height: '48px',
                          paddingLeft: '1rem',
                          paddingRight: '44px',
                          borderRadius: '12px',
                          border: '1px solid rgba(245, 235, 221, 0.2)',
                          fontSize: '0.9rem',
                          outline: 'none',
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          color: '#F7F0E4',
                          boxSizing: 'border-box',
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#CDBFAE', cursor: 'pointer' }}
                      >
                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>

                    {/* Password Strength Checklist */}
                    <div
                      style={{
                        marginTop: '0.75rem',
                        padding: '0.75rem 1rem',
                        backgroundColor: 'rgba(255, 255, 255, 0.04)',
                        borderRadius: '12px',
                        border: '1px solid rgba(245, 235, 221, 0.12)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.35rem',
                      }}
                    >
                      {passwordChecklist.map((req, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.76rem', color: req.pass ? '#7AA34A' : '#CDBFAE', fontWeight: '700' }}>
                          <div
                            style={{
                              width: '14px',
                              height: '14px',
                              borderRadius: '50%',
                              backgroundColor: req.pass ? '#274C37' : 'rgba(245, 235, 221, 0.2)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            <CheckCircle2 size={10} color={req.pass ? '#FFFFFF' : '#CDBFAE'} />
                          </div>
                          <span>{req.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Confirm New Password */}
                  <div>
                    <label style={{ fontSize: '0.74rem', fontWeight: '800', color: '#F7F0E4', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Confirm New Password *
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                        placeholder="Re-enter new password"
                        style={{
                          width: '100%',
                          height: '48px',
                          paddingLeft: '1rem',
                          paddingRight: '44px',
                          borderRadius: '12px',
                          border: '1px solid rgba(245, 235, 221, 0.2)',
                          fontSize: '0.9rem',
                          outline: 'none',
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          color: '#F7F0E4',
                          boxSizing: 'border-box',
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#CDBFAE', cursor: 'pointer' }}
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                    <button
                      type="submit"
                      disabled={passwordLoading}
                      style={{
                        padding: '0.75rem 2rem',
                        fontSize: '0.85rem',
                        borderRadius: '12px',
                        border: 'none',
                        backgroundColor: '#274C37',
                        color: '#FFFFFF',
                        fontWeight: '800',
                        cursor: passwordLoading ? 'not-allowed' : 'pointer',
                        opacity: passwordLoading ? 0.75 : 1,
                      }}
                    >
                      {passwordLoading ? 'Updating Password...' : 'Update Password'}
                    </button>
                  </div>
                </form>
              </div>
            )}

      {/* ==================================================
          ADD / EDIT ADDRESS MODAL
         ================================================== */}
      {showAddressModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(15, 7, 3, 0.8)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div
            style={{
              backgroundColor: '#24120B',
              borderRadius: '24px',
              border: '1px solid rgba(245, 235, 221, 0.25)',
              width: '100%',
              maxWidth: '540px',
              padding: '2.25rem',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
              position: 'relative',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <button
              onClick={() => setShowAddressModal(false)}
              style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'none', border: 'none', color: '#CDBFAE', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            <h3 style={{ fontSize: '1.3rem', fontFamily: 'var(--font-serif)', color: '#F7F0E4', fontWeight: '800', marginBottom: '1.5rem' }}>
              {editingAddress ? 'Edit Delivery Address' : 'Add New Address'}
            </h3>

            <form onSubmit={handleSaveAddress} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: '800', color: '#F7F0E4', display: 'block', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Full Name *</label>
                  <input type="text" required value={addressForm.fullName} onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })} style={{ width: '100%', height: '44px', padding: '0 0.85rem', borderRadius: '10px', border: '1px solid rgba(245, 235, 221, 0.2)', fontSize: '0.88rem', outline: 'none', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: '#F7F0E4', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: '800', color: '#F7F0E4', display: 'block', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Phone Number *</label>
                  <input type="tel" required value={addressForm.phone} onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })} style={{ width: '100%', height: '44px', padding: '0 0.85rem', borderRadius: '10px', border: '1px solid rgba(245, 235, 221, 0.2)', fontSize: '0.88rem', outline: 'none', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: '#F7F0E4', boxSizing: 'border-box' }} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: '800', color: '#F7F0E4', display: 'block', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Street Address *</label>
                <input type="text" required value={addressForm.addressLine} onChange={(e) => setAddressForm({ ...addressForm, addressLine: e.target.value })} style={{ width: '100%', height: '44px', padding: '0 0.85rem', borderRadius: '10px', border: '1px solid rgba(245, 235, 221, 0.2)', fontSize: '0.88rem', outline: 'none', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: '#F7F0E4', boxSizing: 'border-box' }} />
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: '800', color: '#F7F0E4', display: 'block', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Building / Flat / Apartment</label>
                <input type="text" value={addressForm.building} onChange={(e) => setAddressForm({ ...addressForm, building: e.target.value })} style={{ width: '100%', height: '44px', padding: '0 0.85rem', borderRadius: '10px', border: '1px solid rgba(245, 235, 221, 0.2)', fontSize: '0.88rem', outline: 'none', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: '#F7F0E4', boxSizing: 'border-box' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: '800', color: '#F7F0E4', display: 'block', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>City *</label>
                  <input type="text" required value={addressForm.city} onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })} style={{ width: '100%', height: '44px', padding: '0 0.75rem', borderRadius: '10px', border: '1px solid rgba(245, 235, 221, 0.2)', fontSize: '0.88rem', outline: 'none', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: '#F7F0E4', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: '800', color: '#F7F0E4', display: 'block', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>State *</label>
                  <input type="text" required value={addressForm.state} onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })} style={{ width: '100%', height: '44px', padding: '0 0.75rem', borderRadius: '10px', border: '1px solid rgba(245, 235, 221, 0.2)', fontSize: '0.88rem', outline: 'none', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: '#F7F0E4', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: '800', color: '#F7F0E4', display: 'block', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Pincode *</label>
                  <input type="text" required value={addressForm.pincode} onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })} style={{ width: '100%', height: '44px', padding: '0 0.75rem', borderRadius: '10px', border: '1px solid rgba(245, 235, 221, 0.2)', fontSize: '0.88rem', outline: 'none', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: '#F7F0E4', boxSizing: 'border-box' }} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: '800', color: '#F7F0E4', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Address Type</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {['Home', 'Work', 'Other'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setAddressForm({ ...addressForm, addressType: t })}
                      style={{
                        padding: '0.45rem 1.1rem',
                        fontSize: '0.8rem',
                        fontWeight: '800',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        backgroundColor: addressForm.addressType === t ? '#274C37' : 'rgba(255, 255, 255, 0.05)',
                        color: addressForm.addressType === t ? '#FFFFFF' : '#F7F0E4',
                        border: addressForm.addressType === t ? '1px solid #274C37' : '1px solid rgba(245, 235, 221, 0.16)',
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setShowAddressModal(false)}
                  style={{ padding: '0.65rem 1.35rem', fontSize: '0.82rem', borderRadius: '10px', border: '1px solid rgba(245, 235, 221, 0.2)', color: '#CDBFAE', backgroundColor: 'transparent', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '0.65rem 1.75rem', fontSize: '0.82rem', borderRadius: '10px', border: 'none', backgroundColor: '#274C37', color: '#FFFFFF', fontWeight: '800', cursor: 'pointer' }}
                >
                  Save Address
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================
          LOGOUT CONFIRMATION MODAL
         ================================================== */}
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

      {/* ==================================================
          DELETE ADDRESS CONFIRMATION MODAL
         ================================================== */}
      <ConfirmationModal
        isOpen={!!deleteAddrTargetId}
        title="Delete Address?"
        message="Are you sure you want to remove this address?"
        confirmText="Delete Address"
        cancelText="Cancel"
        isDanger={true}
        onConfirm={confirmDeleteAddress}
        onCancel={() => setDeleteAddrTargetId(null)}
      />
    </div>
  );
}
