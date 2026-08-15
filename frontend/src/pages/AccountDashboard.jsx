import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  User, Package, Heart, MapPin, Plus, Trash2, LogOut, ShieldCheck, 
  ShoppingBag, ChevronRight, Edit3, X, Mail, Phone, Calendar, ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import api from '../api/axios';
import { initialProducts } from '../data/seedData';

export default function AccountDashboard() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, addAddress, deleteAddress, updateProfile, updateAddress } = useAuth();
  const { wishlistCount } = useWishlist();
  const { totalItemCount, setIsCartOpen, addToCart } = useCart();

  // Local state
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // Modals / Form toggles
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null); // null means adding
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

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: '',
  });

  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchOrders();
    // Initialize profile form
    setProfileForm({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
    });
  }, [isAuthenticated, user]);

  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await api.get('/orders/myorders');
      if (res.data) {
        setOrders(res.data);
      }
    } catch (err) {
      // Offline fallback: try mapping ORD-108134 if user email matches seed orders
      setOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

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
      } else {
        await addAddress(addressForm);
      }
      setShowAddressModal(false);
    } catch (err) {
      console.error('Error saving address', err);
    }
  };

  const handleDeleteAddress = async (addrId) => {
    if (window.confirm("Are you sure you want to delete this address?")) {
      try {
        await deleteAddress(addrId);
      } catch (err) {
        console.error('Error deleting address', err);
      }
    }
  };

  // Profile Handlers
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      await updateProfile(profileForm);
      setShowProfileModal(false);
    } catch (err) {
      console.error('Error updating profile', err);
    }
  };

  // Scroll to element helper
  const handleScrollToSection = (elementId) => {
    const el = document.getElementById(elementId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';
  const recentOrders = orders.slice(0, 3);
  const recommendedProducts = initialProducts.slice(0, 3);

  return (
    <div style={{ backgroundColor: '#FBF8F2', minHeight: '100vh', padding: '2.5rem 0 6.5rem' }}>
      <div className="container" style={{ maxWidth: '1150px' }}>
        
        {/* Navigation Tabs (Horizontal Bar) */}
        <div 
          style={{ 
            display: 'flex', 
            gap: '1.5rem', 
            marginBottom: '2.5rem', 
            borderBottom: '1px solid var(--border-color)', 
            paddingBottom: '0.75rem',
            overflowX: 'auto',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
        >
          <button onClick={() => setActiveTab('overview')} style={{ background: 'none', border: 'none', padding: '0.5rem 0.25rem', fontSize: '0.85rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.06em', color: activeTab === 'overview' ? 'var(--primary-dark)' : 'var(--text-muted)', borderBottom: activeTab === 'overview' ? '2.5px solid var(--primary-dark)' : '2.5px solid transparent', cursor: 'pointer', transition: 'all 0.2s' }}>Overview</button>
          <Link to="/account/orders" style={{ textDecoration: 'none', background: 'none', border: 'none', padding: '0.5rem 0.25rem', fontSize: '0.85rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', borderBottom: '2.5px solid transparent', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>My Orders</Link>
          <Link to="/wishlist" style={{ textDecoration: 'none', background: 'none', border: 'none', padding: '0.5rem 0.25rem', fontSize: '0.85rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', borderBottom: '2.5px solid transparent', cursor: 'pointer' }}>Wishlist</Link>
          <button onClick={() => { setActiveTab('overview'); setTimeout(() => handleScrollToSection('saved-addresses-dashboard'), 150); }} style={{ background: 'none', border: 'none', padding: '0.5rem 0.25rem', fontSize: '0.85rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', borderBottom: '2.5px solid transparent', cursor: 'pointer' }}>Addresses</button>
          <button onClick={() => setShowProfileModal(true)} style={{ background: 'none', border: 'none', padding: '0.5rem 0.25rem', fontSize: '0.85rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', borderBottom: '2.5px solid transparent', cursor: 'pointer' }}>Profile</button>
        </div>

        {/* 2. ACCOUNT HEADER */}
        <section 
          className="glass-card" 
          style={{ 
            padding: '3rem 2.5rem', 
            backgroundColor: '#FFFFFF', 
            borderRadius: '24px', 
            border: '1.5px solid var(--border-color)',
            boxShadow: '0 8px 30px rgba(56, 20, 35, 0.02)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '2rem',
            marginBottom: '3rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.75rem', flexWrap: 'wrap' }}>
            {/* Initial Circle Avatar */}
            <div 
              style={{ 
                width: '74px', 
                height: '74px', 
                borderRadius: '50%', 
                backgroundColor: 'var(--primary-dark)', 
                color: '#FFFFFF', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                fontSize: '1.8rem', 
                fontFamily: 'var(--font-serif)',
                fontWeight: '800',
                border: '1.5px solid var(--border-color)',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              {userInitial}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent-gold)', fontWeight: '800' }}>My Account</span>
              <h1 style={{ fontSize: '1.85rem', fontFamily: 'var(--font-serif)', color: 'var(--primary-dark)', fontWeight: '800', margin: 0 }}>
                Welcome back, {user?.name} 👋
              </h1>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.86rem', color: 'var(--text-muted)', fontWeight: '600', marginTop: '0.15rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Mail size={13} /> {user?.email}</span>
                {user?.phone && <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Phone size={13} /> {user.phone}</span>}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button 
              onClick={() => setShowProfileModal(true)} 
              className="btn-secondary" 
              style={{ padding: '0.7rem 1.25rem', fontSize: '0.8rem', fontWeight: '800', borderRadius: '10px', borderColor: 'var(--border-color)', color: 'var(--primary-dark)' }}
            >
              <Edit3 size={14} />
              <span>Edit Profile</span>
            </button>
            <button 
              onClick={logout} 
              className="btn-secondary" 
              style={{ padding: '0.7rem 1.25rem', fontSize: '0.8rem', fontWeight: '800', borderRadius: '10px', borderColor: 'rgba(217, 83, 79, 0.2)', color: 'var(--accent-terracotta)', backgroundColor: 'rgba(217, 83, 79, 0.02)' }}
            >
              <LogOut size={14} />
              <span>Logout</span>
            </button>
          </div>
        </section>

        {/* 3. ACCOUNT SUMMARY CARDS */}
        <section 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
            gap: '1.5rem', 
            marginBottom: '4.5rem' 
          }}
        >
          <div 
            onClick={() => navigate('/account/orders')}
            className="glass-card" 
            style={{ padding: '1.75rem', backgroundColor: '#FFFFFF', borderRadius: '20px', border: '1.5px solid var(--border-color)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1.25rem', transition: 'transform 0.2s' }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'none'}
          >
            <div style={{ width: '46px', height: '46px', borderRadius: '12px', backgroundColor: 'rgba(56, 20, 35, 0.05)', color: 'var(--primary-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={22} />
            </div>
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: '950', color: 'var(--primary-dark)' }}>{orders.length} {orders.length === 1 ? 'Order' : 'Orders'}</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: '600' }}>Track your purchases</div>
            </div>
          </div>

          <div 
            onClick={() => navigate('/wishlist')}
            className="glass-card" 
            style={{ padding: '1.75rem', backgroundColor: '#FFFFFF', borderRadius: '20px', border: '1.5px solid var(--border-color)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1.25rem', transition: 'transform 0.2s' }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'none'}
          >
            <div style={{ width: '46px', height: '46px', borderRadius: '12px', backgroundColor: 'rgba(217, 83, 79, 0.05)', color: 'var(--accent-terracotta)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Heart size={22} />
            </div>
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: '950', color: 'var(--primary-dark)' }}>{wishlistCount} Saved</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: '600' }}>Favourite products</div>
            </div>
          </div>

          <div 
            onClick={() => handleScrollToSection('saved-addresses-dashboard')}
            className="glass-card" 
            style={{ padding: '1.75rem', backgroundColor: '#FFFFFF', borderRadius: '20px', border: '1.5px solid var(--border-color)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1.25rem', transition: 'transform 0.2s' }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'none'}
          >
            <div style={{ width: '46px', height: '46px', borderRadius: '12px', backgroundColor: 'rgba(39, 76, 55, 0.05)', color: 'var(--accent-olive)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MapPin size={22} />
            </div>
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: '950', color: 'var(--primary-dark)' }}>{user?.addresses?.length || 0} {user?.addresses?.length === 1 ? 'Address' : 'Addresses'}</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: '600' }}>Saved delivery locations</div>
            </div>
          </div>

          <div 
            onClick={() => setIsCartOpen(true)}
            className="glass-card" 
            style={{ padding: '1.75rem', backgroundColor: '#FFFFFF', borderRadius: '20px', border: '1.5px solid var(--border-color)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1.25rem', transition: 'transform 0.2s' }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'none'}
          >
            <div style={{ width: '46px', height: '46px', borderRadius: '12px', backgroundColor: 'rgba(197, 160, 89, 0.08)', color: 'var(--accent-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShoppingBag size={22} />
            </div>
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: '950', color: 'var(--primary-dark)' }}>{totalItemCount} {totalItemCount === 1 ? 'Item' : 'Items'}</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: '600' }}>Items in your cart</div>
            </div>
          </div>
        </section>

        {/* Two-Column Grid: Quick Actions & Recent Orders */}
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '3rem', marginBottom: '5rem', alignItems: 'start' }}>
          
          {/* Column A: Quick Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-serif)', color: 'var(--primary-dark)', fontWeight: '800', margin: 0 }}>Quick Actions</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              <Link 
                to="/account/orders" 
                style={{ textDecoration: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1.5px solid var(--border-color)', transition: 'all 0.2s' }}
                onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--primary-dark)'}
                onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
              >
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <Package size={18} color="var(--primary-dark)" />
                  <div>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--primary-dark)', margin: 0 }}>Track My Orders</h4>
                    <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: 0, fontWeight: '500' }}>Live journey & dispatch updates</p>
                  </div>
                </div>
                <ChevronRight size={16} color="var(--text-muted)" />
              </Link>

              <Link 
                to="/wishlist" 
                style={{ textDecoration: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1.5px solid var(--border-color)', transition: 'all 0.2s' }}
                onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--primary-dark)'}
                onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
              >
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <Heart size={18} color="var(--accent-terracotta)" />
                  <div>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--primary-dark)', margin: 0 }}>View Wishlist</h4>
                    <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: 0, fontWeight: '500' }}>Saved favorites & rituals</p>
                  </div>
                </div>
                <ChevronRight size={16} color="var(--text-muted)" />
              </Link>

              <div 
                onClick={() => handleScrollToSection('saved-addresses-dashboard')}
                style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1.5px solid var(--border-color)', transition: 'all 0.2s' }}
                onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--primary-dark)'}
                onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
              >
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <MapPin size={18} color="var(--accent-olive)" />
                  <div>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--primary-dark)', margin: 0 }}>Manage Addresses</h4>
                    <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: 0, fontWeight: '500' }}>Update shipping destinations</p>
                  </div>
                </div>
                <ChevronRight size={16} color="var(--text-muted)" />
              </div>

              <Link 
                to="/shop" 
                style={{ textDecoration: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1.5px solid var(--border-color)', transition: 'all 0.2s' }}
                onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--primary-dark)'}
                onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
              >
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <ShoppingBag size={18} color="var(--accent-gold)" />
                  <div>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--primary-dark)', margin: 0 }}>Continue Shopping</h4>
                    <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: 0, fontWeight: '500' }}>Discover new clean bakes</p>
                  </div>
                </div>
                <ChevronRight size={16} color="var(--text-muted)" />
              </Link>

            </div>
          </div>

          {/* Column B: Recent Orders */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <h2 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-serif)', color: 'var(--primary-dark)', fontWeight: '800', margin: 0 }}>Recent Orders</h2>
              {orders.length > 0 && <Link to="/account/orders" style={{ fontSize: '0.8rem', color: 'var(--accent-gold)', fontWeight: '800', textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.04em' }}>View All ({orders.length})</Link>}
            </div>

            {loadingOrders ? (
              <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#FFFFFF', borderRadius: '24px', border: '1.5px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.88rem', fontWeight: '700' }}>Loading orders...</div>
            ) : orders.length === 0 ? (
              /* Empty orders state */
              <div 
                className="glass-card" 
                style={{ 
                  padding: '3rem 2rem', 
                  textAlign: 'center', 
                  backgroundColor: '#FFFFFF', 
                  borderRadius: '24px', 
                  border: '1.5px solid var(--border-color)',
                  boxShadow: '0 8px 30px rgba(56, 20, 35, 0.02)'
                }}
              >
                <Package size={32} color="var(--accent-gold)" style={{ margin: '0 auto 1rem' }} />
                <h4 style={{ fontSize: '1.15rem', fontFamily: 'var(--font-serif)', color: 'var(--primary-dark)', fontWeight: '800', marginBottom: '0.35rem', margin: 0 }}>No orders yet</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.5', marginBottom: '1.75rem', marginTop: '0.35rem', fontWeight: '500' }}>Your MILASTY rituals are waiting for you.</p>
                <Link to="/shop" className="btn-primary" style={{ padding: '0.75rem 2rem', fontSize: '0.84rem', textDecoration: 'none', borderRadius: '999px', backgroundColor: 'var(--primary-dark)', color: '#FFFFFF', fontWeight: '800' }}>
                  Explore Our Bakes →
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {recentOrders.map((order) => {
                  const statusColors = {
                    Pending: { bg: 'rgba(197, 160, 89, 0.1)', text: 'var(--accent-gold)' },
                    Confirmed: { bg: 'rgba(39, 76, 55, 0.08)', text: 'var(--accent-olive)' },
                    Processing: { bg: 'rgba(56, 20, 35, 0.05)', text: 'var(--primary-dark)' },
                    Delivered: { bg: 'rgba(39, 76, 55, 0.1)', text: 'var(--accent-olive)' },
                    Cancelled: { bg: 'rgba(217, 83, 79, 0.08)', text: 'var(--accent-terracotta)' }
                  };
                  const statusStyle = statusColors[order.status] || { bg: 'rgba(0,0,0,0.05)', text: 'var(--text-muted)' };
                  const formattedDate = new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

                  return (
                    <div 
                      key={order._id}
                      style={{ 
                        backgroundColor: '#FFFFFF', 
                        borderRadius: '20px', 
                        border: '1.5px solid var(--border-color)', 
                        padding: '1.5rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem',
                        transition: 'border-color 0.2s'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--primary-dark)'}
                      onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                        <div>
                          <div style={{ fontSize: '0.88rem', fontWeight: '850', color: 'var(--primary-dark)' }}>ORDER #{order.orderNumber || order._id.slice(-8).toUpperCase()}</div>
                          <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.15rem' }}><Calendar size={12} /> {formattedDate}</span>
                        </div>
                        <span style={{ fontSize: '0.68rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.04em', backgroundColor: statusStyle.bg, color: statusStyle.text, padding: '0.35rem 0.75rem', borderRadius: '999px' }}>
                          {order.status}
                        </span>
                      </div>

                      {order.items && order.items.length > 0 && (
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                          <img src={order.items[0].image} alt={order.items[0].title} style={{ width: '64px', height: '64px', borderRadius: '10px', objectFit: 'cover', border: '1px solid var(--border-color)' }} />
                          <div>
                            <h4 style={{ fontSize: '0.88rem', fontWeight: '800', color: 'var(--primary-dark)', margin: '0 0 0.15rem 0' }}>{order.items[0].title}</h4>
                            <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: '600' }}>Qty: {order.items[0].quantity} • {order.items[0].weight}</span>
                          </div>
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
                        <div>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: '700', display: 'block' }}>Total Amount</span>
                          <span style={{ fontSize: '1.15rem', fontWeight: '900', color: 'var(--primary-dark)' }}>₹{order.totalAmount}</span>
                        </div>
                        <Link 
                          to={`/account/orders/${order._id}`} 
                          style={{ 
                            fontSize: '0.8rem', 
                            color: 'var(--primary-dark)', 
                            fontWeight: '800', 
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}
                        >
                          <span>View Order</span>
                          <ArrowRight size={14} />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* 7. SAVED DELIVERY ADDRESSES SECTION */}
        <section id="saved-addresses-dashboard" className="glass-card" style={{ padding: '3rem 2.5rem', backgroundColor: '#FFFFFF', borderRadius: '24px', border: '1.5px solid var(--border-color)', boxShadow: '0 8px 30px rgba(56, 20, 35, 0.02)', marginBottom: '5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.6rem', fontFamily: 'var(--font-serif)', color: 'var(--primary-dark)', fontWeight: '800', margin: '0 0 0.25rem 0' }}>Saved Delivery Locations</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, fontWeight: '500' }}>Your preferred shipping destinations</p>
            </div>
            
            <button 
              onClick={handleOpenAddAddress}
              className="btn-primary" 
              style={{ 
                padding: '0.75rem 1.5rem', 
                fontSize: '0.82rem', 
                fontWeight: '800', 
                borderRadius: '12px', 
                backgroundColor: 'var(--primary-dark)', 
                color: '#FFFFFF', 
                border: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                cursor: 'pointer'
              }}
            >
              <Plus size={15} />
              <span>Add Address</span>
            </button>
          </div>

          {user?.addresses?.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem', border: '1.5px dashed var(--border-color)', borderRadius: '20px' }}>
              <MapPin size={28} color="var(--accent-gold)" style={{ margin: '0 auto 0.75rem' }} />
              <h4 style={{ fontSize: '1.05rem', fontFamily: 'var(--font-serif)', color: 'var(--primary-dark)', fontWeight: '800', margin: '0 0 0.25rem 0' }}>No saved addresses</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', margin: '0 0 1.25rem 0', fontWeight: '500' }}>Add your delivery address for faster checkouts.</p>
              <button 
                onClick={handleOpenAddAddress}
                className="btn-secondary" 
                style={{ padding: '0.55rem 1.25rem', fontSize: '0.8rem', borderRadius: '10px', fontWeight: '800' }}
              >
                Add Address
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
              {user?.addresses?.map((addr) => (
                <div 
                  key={addr._id} 
                  style={{ 
                    border: '1.5px solid var(--border-color)', 
                    borderRadius: '20px', 
                    padding: '1.5rem', 
                    backgroundColor: '#FCFAF6', 
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '180px'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: '850', color: 'var(--primary-dark)' }}>{addr.fullName}</span>
                      <span 
                        style={{ 
                          fontSize: '0.62rem', 
                          fontWeight: '800', 
                          textTransform: 'uppercase', 
                          letterSpacing: '0.04em',
                          backgroundColor: 'rgba(56, 20, 35, 0.05)',
                          color: 'var(--primary-dark)',
                          padding: '0.25rem 0.6rem',
                          borderRadius: '6px'
                        }}
                      >
                        {addr.addressType || 'Home'}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '1rem', fontWeight: '500' }}>
                      {addr.building && `${addr.building}, `}{addr.addressLine}, {addr.city}, {addr.state} - {addr.pincode}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '0.85rem' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--primary-dark)', fontWeight: '750' }}>Phone: {addr.phone}</span>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <button 
                        onClick={() => handleOpenEditAddress(addr)}
                        style={{ background: 'none', border: 'none', color: 'var(--primary-dark)', fontSize: '0.78rem', fontWeight: '800', cursor: 'pointer' }}
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteAddress(addr._id)}
                        style={{ background: 'none', border: 'none', color: 'var(--accent-terracotta)', fontSize: '0.78rem', fontWeight: '800', cursor: 'pointer' }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 11. PERSONALIZED SHOPPING: MADE FOR YOUR RITUAL */}
        <section style={{ borderTop: '1.5px solid var(--border-color)', paddingTop: '6rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent-gold)', fontWeight: '800', display: 'block', marginBottom: '0.35rem' }}>Personalized Sourcing</span>
            <h2 style={{ fontSize: '2.4rem', fontFamily: 'var(--font-serif)', color: 'var(--primary-dark)', fontWeight: '800', margin: 0 }}>
              Made for Your Ritual
            </h2>
            <p style={{ fontSize: '0.96rem', color: 'var(--text-muted)', margin: '0.5rem 0 0 0', fontWeight: '500' }}>
              Discover more handcrafted MILASTY bakes for your everyday moments.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2.5rem' }}>
            {recommendedProducts.map((p) => {
              const selectedVariant = p.variants?.[0];
              return (
                <div 
                  key={p._id || p.slug}
                  className="glass-card"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: '24px',
                    overflow: 'hidden',
                    backgroundColor: '#FFFFFF',
                    border: '1.5px solid var(--border-color)',
                    position: 'relative'
                  }}
                >
                  <div style={{ position: 'relative', overflow: 'hidden', paddingTop: '80%', backgroundColor: '#FCFAF6' }}>
                    <Link to={`/product/${p.slug}`}>
                      <img 
                        src={p.image} 
                        alt={p.title} 
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s' }}
                        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      />
                    </Link>
                  </div>

                  <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flexGrow: 1 }}>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', fontFamily: 'var(--font-serif)', color: 'var(--primary-dark)', fontWeight: '800', marginBottom: '0.35rem' }}>
                        <Link to={`/product/${p.slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>{p.title}</Link>
                      </h3>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: '1.5', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', fontWeight: '500' }}>
                        {p.subtitle || p.description}
                      </p>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '1.15rem', fontWeight: '900', color: 'var(--primary-dark)' }}>₹{selectedVariant?.price || p.price}</span>
                      <button 
                        onClick={() => addToCart(p, selectedVariant)}
                        className="btn-primary"
                        style={{ padding: '0.6rem 1.15rem', fontSize: '0.8rem', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', borderRadius: '10px' }}
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
        </section>

      </div>

      {/* ==================================================
          MODAL 1: ADD / EDIT ADDRESS MODAL
         ================================================== */}
      {showAddressModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(56, 20, 35, 0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div 
            className="glass-card" 
            style={{ 
              backgroundColor: '#FFFFFF', 
              borderRadius: '24px', 
              border: '1.5px solid var(--border-color)', 
              width: '100%', 
              maxWidth: '560px', 
              padding: '2.5rem',
              boxShadow: 'var(--shadow-lg)',
              position: 'relative'
            }}
          >
            <button 
              onClick={() => setShowAddressModal(false)}
              style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            <h3 style={{ fontSize: '1.4rem', fontFamily: 'var(--font-serif)', color: 'var(--primary-dark)', fontWeight: '800', marginBottom: '1.5rem' }}>
              {editingAddress ? 'Edit Delivery Address' : 'Add New Address'}
            </h3>

            <form onSubmit={handleSaveAddress} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--primary-dark)', display: 'block', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Full Name *</label>
                  <input type="text" required value={addressForm.fullName} onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })} style={{ width: '100%', height: '48px', padding: '0 0.85rem', borderRadius: '10px', border: '1.5px solid var(--border-color)', fontSize: '0.88rem', outline: 'none', backgroundColor: '#FCFAF6' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--primary-dark)', display: 'block', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Phone Number *</label>
                  <input type="tel" required value={addressForm.phone} onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })} style={{ width: '100%', height: '48px', padding: '0 0.85rem', borderRadius: '10px', border: '1.5px solid var(--border-color)', fontSize: '0.88rem', outline: 'none', backgroundColor: '#FCFAF6' }} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--primary-dark)', display: 'block', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Street Address *</label>
                <input type="text" required value={addressForm.addressLine} onChange={(e) => setAddressForm({ ...addressForm, addressLine: e.target.value })} style={{ width: '100%', height: '48px', padding: '0 0.85rem', borderRadius: '10px', border: '1.5px solid var(--border-color)', fontSize: '0.88rem', outline: 'none', backgroundColor: '#FCFAF6' }} />
              </div>

              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--primary-dark)', display: 'block', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Building / Flat / Apartment</label>
                <input type="text" value={addressForm.building} onChange={(e) => setAddressForm({ ...addressForm, building: e.target.value })} style={{ width: '100%', height: '48px', padding: '0 0.85rem', borderRadius: '10px', border: '1.5px solid var(--border-color)', fontSize: '0.88rem', outline: 'none', backgroundColor: '#FCFAF6' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--primary-dark)', display: 'block', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>City *</label>
                  <input type="text" required value={addressForm.city} onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })} style={{ width: '100%', height: '48px', padding: '0 0.85rem', borderRadius: '10px', border: '1.5px solid var(--border-color)', fontSize: '0.88rem', outline: 'none', backgroundColor: '#FCFAF6' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--primary-dark)', display: 'block', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>State *</label>
                  <input type="text" required value={addressForm.state} onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })} style={{ width: '100%', height: '48px', padding: '0 0.85rem', borderRadius: '10px', border: '1.5px solid var(--border-color)', fontSize: '0.88rem', outline: 'none', backgroundColor: '#FCFAF6' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--primary-dark)', display: 'block', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Pincode *</label>
                  <input type="text" required value={addressForm.pincode} onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })} style={{ width: '100%', height: '48px', padding: '0 0.85rem', borderRadius: '10px', border: '1.5px solid var(--border-color)', fontSize: '0.88rem', outline: 'none', backgroundColor: '#FCFAF6' }} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--primary-dark)', display: 'block', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Address Type</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {['Home', 'Work', 'Other'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setAddressForm({ ...addressForm, addressType: t })}
                      style={{
                        padding: '0.5rem 1.25rem',
                        fontSize: '0.82rem',
                        fontWeight: '800',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        backgroundColor: addressForm.addressType === t ? 'var(--primary-dark)' : '#FCFAF6',
                        color: addressForm.addressType === t ? '#FFFFFF' : 'var(--primary-dark)',
                        border: addressForm.addressType === t ? '1.5px solid var(--primary-dark)' : '1.5px solid var(--border-color)',
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
                  className="btn-secondary"
                  style={{ padding: '0.7rem 1.5rem', fontSize: '0.82rem', borderRadius: '10px' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  style={{ padding: '0.7rem 2rem', fontSize: '0.82rem', borderRadius: '10px', border: 'none', backgroundColor: 'var(--primary-dark)', color: '#FFFFFF', fontWeight: '800', cursor: 'pointer' }}
                >
                  Save Address
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================
          MODAL 2: EDIT PROFILE MODAL
         ================================================== */}
      {showProfileModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(56, 20, 35, 0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div 
            className="glass-card" 
            style={{ 
              backgroundColor: '#FFFFFF', 
              borderRadius: '24px', 
              border: '1.5px solid var(--border-color)', 
              width: '100%', 
              maxWidth: '460px', 
              padding: '2.5rem',
              boxShadow: 'var(--shadow-lg)',
              position: 'relative'
            }}
          >
            <button 
              onClick={() => setShowProfileModal(false)}
              style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            <h3 style={{ fontSize: '1.4rem', fontFamily: 'var(--font-serif)', color: 'var(--primary-dark)', fontWeight: '800', marginBottom: '1.5rem' }}>
              Edit Profile Information
            </h3>

            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--primary-dark)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Full Name</label>
                <input 
                  type="text" 
                  required 
                  value={profileForm.name} 
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} 
                  style={{ width: '100%', height: '52px', padding: '0 1rem', borderRadius: '12px', border: '1.5px solid var(--border-color)', fontSize: '0.88rem', outline: 'none', backgroundColor: '#FCFAF6', color: 'var(--primary-dark)' }} 
                />
              </div>

              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--primary-dark)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Email Address</label>
                <input 
                  type="email" 
                  required 
                  value={profileForm.email} 
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} 
                  style={{ width: '100%', height: '52px', padding: '0 1rem', borderRadius: '12px', border: '1.5px solid var(--border-color)', fontSize: '0.88rem', outline: 'none', backgroundColor: '#FCFAF6', color: 'var(--primary-dark)' }} 
                />
              </div>

              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--primary-dark)', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Phone Number</label>
                <input 
                  type="tel" 
                  value={profileForm.phone} 
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} 
                  placeholder="No phone saved"
                  style={{ width: '100%', height: '52px', padding: '0 1rem', borderRadius: '12px', border: '1.5px solid var(--border-color)', fontSize: '0.88rem', outline: 'none', backgroundColor: '#FCFAF6', color: 'var(--primary-dark)' }} 
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.75rem' }}>
                <button 
                  type="button" 
                  onClick={() => setShowProfileModal(false)}
                  className="btn-secondary"
                  style={{ padding: '0.7rem 1.5rem', fontSize: '0.82rem', borderRadius: '10px' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  style={{ padding: '0.7rem 2rem', fontSize: '0.82rem', borderRadius: '10px', border: 'none', backgroundColor: 'var(--primary-dark)', color: '#FFFFFF', fontWeight: '800', cursor: 'pointer' }}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
