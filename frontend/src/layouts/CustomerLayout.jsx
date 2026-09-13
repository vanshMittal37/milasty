import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { 
  LayoutDashboard, Package, Heart, MapPin, User, Lock, LogOut, Menu, X, 
  Store, Home as HomeIcon, ChevronRight, Bell, ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import ConfirmationModal from '../components/ConfirmationModal';

export default function CustomerLayout() {
  const { user, isAuthenticated, logout } = useAuth();
  const { wishlistCount } = useWishlist();
  const { totalItemCount } = useCart();
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Protect layout: Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Set dark body styling for customer portal
  useEffect(() => {
    document.body.style.backgroundColor = '#0F1115';
    document.body.style.color = '#F5F5F5';
    return () => {
      document.body.style.backgroundColor = '';
      document.body.style.color = '';
    };
  }, []);

  if (!isAuthenticated) {
    return null;
  }

  const confirmLogout = () => {
    setShowLogoutModal(false);
    logout();
    toast.success('Logged out successfully.');
    navigate('/login', { replace: true });
  };

  const navSections = [
    {
      title: 'MAIN',
      items: [
        { label: 'Dashboard', path: '/account', icon: LayoutDashboard },
        { label: 'My Orders', path: '/account/orders', icon: Package },
        { label: 'Wishlist', path: '/wishlist', icon: Heart, badge: wishlistCount },
        { label: 'Addresses', path: '/account?tab=addresses', icon: MapPin },
        { label: 'Profile', path: '/account?tab=profile', icon: User },
      ]
    },
    {
      title: 'ACCOUNT',
      items: [
        { label: 'Change Password', path: '/account?tab=password', icon: Lock },
      ]
    },
    {
      title: 'SYSTEM / STORE',
      items: [
        { label: 'Visit Store', path: '/shop', icon: Store, external: true },
        { label: 'Home', path: '/', icon: HomeIcon, external: true },
      ]
    }
  ];

  const getPageHeaderInfo = () => {
    const path = location.pathname;
    const search = location.search;

    if (path === '/account') {
      if (search.includes('tab=addresses')) return { category: 'ACCOUNT / ADDRESSES', title: 'Delivery Locations', subtitle: 'Manage your saved shipping addresses for fast checkout.' };
      if (search.includes('tab=profile')) return { category: 'ACCOUNT / PROFILE', title: 'Personal Profile', subtitle: 'Manage your account name, email and phone number.' };
      if (search.includes('tab=password')) return { category: 'ACCOUNT / SECURITY', title: 'Security & Password', subtitle: 'Update your account password and security settings.' };
      return { category: 'ACCOUNT / OVERVIEW', title: 'Dashboard', subtitle: "Here's what's happening with your MILASTY account today." };
    }
    if (path.includes('/account/orders/')) {
      return { category: 'ACCOUNT / ORDERS', title: 'Order Details', subtitle: 'View order summary, items, and tracking status.' };
    }
    if (path === '/account/orders') {
      return { category: 'ACCOUNT / ORDERS', title: 'My Orders', subtitle: 'Track and review your past purchases and order status.' };
    }
    if (path === '/wishlist') {
      return { category: 'ACCOUNT / WISHLIST', title: 'My Wishlist', subtitle: 'Your saved favorite bakes and rituals.' };
    }
    return { category: 'ACCOUNT / PORTAL', title: 'Customer Portal', subtitle: 'Manage your MILASTY account.' };
  };

  const { category, title, subtitle } = getPageHeaderInfo();
  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

  const SidebarContent = () => (
    <div 
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100%', 
        justifyContent: 'space-between',
        backgroundColor: '#151922',
        color: '#A7ADB8',
        padding: '1.75rem 1.25rem',
        overflowY: 'auto'
      }}
    >
      <div>
        {/* Brand Header */}
        <div style={{ marginBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.10)', paddingBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div 
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                backgroundColor: '#274C37',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '900',
                fontFamily: 'var(--font-serif)',
                fontSize: '1.1rem',
                border: '1px solid rgba(255,255,255,0.15)'
              }}
            >
              M
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontFamily: 'var(--font-serif)', fontWeight: '900', letterSpacing: '0.04em', margin: 0, color: '#F5F5F5' }}>
                MILASTY
              </h2>
              <div style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#85B870', fontWeight: '800', marginTop: '0.1rem' }}>
                Customer Portal
              </div>
            </div>
          </div>
          <button 
            onClick={() => setMobileSidebarOpen(false)}
            style={{ background: 'none', border: 'none', color: '#A7ADB8', cursor: 'pointer', display: 'none', padding: '0.2rem' }}
            className="customer-mobile-close-btn"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Sections */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {navSections.map((sec) => (
            <div key={sec.title}>
              <div style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#7B8E80', fontWeight: '800', marginBottom: '0.65rem' }}>
                {sec.title}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                {sec.items.map((item) => {
                  const Icon = item.icon;
                  const currentPath = location.pathname + location.search;
                  const isActive = !item.external && (
                    item.path.includes('?') 
                      ? currentPath === item.path 
                      : (location.pathname === item.path && !location.search)
                  );

                  return (
                    <Link
                      key={item.label}
                      to={item.path}
                      onClick={() => setMobileSidebarOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.6rem 0.85rem',
                        borderRadius: '8px',
                        fontSize: '0.82rem',
                        fontWeight: '700',
                        textDecoration: 'none',
                        color: isActive ? '#FFFFFF' : '#A7ADB8',
                        backgroundColor: isActive ? 'rgba(39, 76, 55, 0.45)' : 'transparent',
                        borderLeft: isActive ? '3px solid #85B870' : '3px solid transparent',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Icon size={16} color={isActive ? '#85B870' : '#7B8E80'} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span 
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: '800',
                            backgroundColor: isActive ? '#85B870' : 'rgba(255,255,255,0.08)',
                            color: isActive ? '#0F1115' : '#F5F5F5',
                            padding: '0.15rem 0.5rem',
                            borderRadius: '999px'
                          }}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Sidebar Footer User Card & Logout */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.10)', paddingTop: '1.25rem', marginTop: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', minWidth: 0 }}>
            <div 
              style={{ 
                width: '36px', 
                height: '36px', 
                borderRadius: '50%', 
                backgroundColor: '#274C37', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: '#FFFFFF',
                fontWeight: '900',
                fontSize: '0.9rem',
                border: '1px solid rgba(255,255,255,0.15)',
                flexShrink: 0
              }}
            >
              {userInitial}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '0.82rem', fontWeight: '800', color: '#F5F5F5', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.name || 'Customer'}
              </div>
              <div style={{ fontSize: '0.66rem', color: '#7B8E80', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.email || 'Authenticated User'}
              </div>
            </div>
          </div>
          
          <button 
            type="button"
            onClick={() => setShowLogoutModal(true)} 
            style={{ 
              background: 'none', 
              border: 'none', 
              color: '#D9534F', 
              cursor: 'pointer',
              padding: '0.45rem',
              display: 'flex',
              alignItems: 'center',
              borderRadius: '6px',
              transition: 'all 0.2s',
              flexShrink: 0
            }}
            title="Log Out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0F1115', color: '#F5F5F5' }}>
      
      {/* DESKTOP PERMANENT SIDEBAR */}
      <aside 
        style={{ 
          width: '260px', 
          position: 'fixed', 
          top: 0, 
          bottom: 0, 
          left: 0, 
          zIndex: 90,
          borderRight: '1px solid rgba(255,255,255,0.10)',
          height: '100vh',
        }}
        className="customer-desktop-sidebar"
      >
        <SidebarContent />
      </aside>

      {/* MOBILE SIDEBAR DRAWER OVERLAY */}
      {mobileSidebarOpen && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(4px)',
            zIndex: 998,
          }}
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* MOBILE DRAWER */}
      <aside 
        style={{
          position: 'fixed',
          top: 0,
          bottom: 0,
          left: 0,
          width: '280px',
          zIndex: 999,
          transform: mobileSidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          boxShadow: '4px 0 24px rgba(0,0,0,0.5)',
        }}
        className="customer-mobile-drawer"
      >
        <SidebarContent />
      </aside>

      {/* MAIN CONTENT WRAPPER */}
      <div 
        style={{ 
          flexGrow: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          minWidth: 0,
        }}
        className="customer-main-area"
      >
        {/* MOBILE TOP HEADER BAR (Hidden on desktop via CSS) */}
        <header 
          style={{ 
            height: '64px', 
            backgroundColor: '#151922', 
            borderBottom: '1px solid rgba(255,255,255,0.10)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            padding: '0 1.25rem', 
            position: 'sticky', 
            top: 0, 
            zIndex: 80 
          }}
          className="customer-mobile-header-bar"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <button 
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              style={{ background: 'none', border: 'none', color: '#F5F5F5', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0.2rem' }}
            >
              <Menu size={22} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1rem', fontFamily: 'var(--font-serif)', fontWeight: '900', color: '#F5F5F5' }}>
                MILASTY
              </span>
              <span style={{ fontSize: '0.62rem', backgroundColor: 'rgba(39, 76, 55, 0.45)', color: '#85B870', padding: '0.15rem 0.5rem', borderRadius: '999px', fontWeight: '800' }}>
                PORTAL
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Link 
              to="/shop" 
              style={{ 
                fontSize: '0.75rem', 
                color: '#85B870', 
                fontWeight: '800', 
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                backgroundColor: 'rgba(255,255,255,0.05)',
                padding: '0.35rem 0.75rem',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.10)'
              }}
            >
              <span>Store</span>
              <ChevronRight size={12} />
            </Link>

            <div 
              style={{ 
                width: '32px', 
                height: '32px', 
                borderRadius: '50%', 
                backgroundColor: '#274C37', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: '#FFFFFF',
                fontWeight: '900',
                fontSize: '0.85rem',
                border: '1px solid rgba(255,255,255,0.15)'
              }}
            >
              {userInitial}
            </div>
          </div>
        </header>

        {/* DASHBOARD TOP HEADER SECTION */}
        <div 
          style={{ 
            padding: '1.75rem 2rem 0', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem'
          }}
        >
          <div>
            <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#7B8E80', fontWeight: '800', marginBottom: '0.2rem' }}>
              {category}
            </div>
            <h1 style={{ fontSize: '1.8rem', fontFamily: 'var(--font-serif)', color: '#F5F5F5', fontWeight: '800', margin: 0 }}>
              {title}
            </h1>
            <p style={{ fontSize: '0.85rem', color: '#A7ADB8', margin: '0.25rem 0 0 0', fontWeight: '500' }}>
              {subtitle}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Link
              to="/shop"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.55rem 1.15rem',
                borderRadius: '8px',
                backgroundColor: '#274C37',
                color: '#FFFFFF',
                fontWeight: '800',
                fontSize: '0.82rem',
                textDecoration: 'none',
                transition: 'all 0.2s',
                boxShadow: '0 4px 14px rgba(39, 76, 55, 0.3)',
              }}
            >
              <span>Visit Store</span>
              <ChevronRight size={15} />
            </Link>
          </div>
        </div>

        {/* MAIN ROUTED OUTLET / CONTENT AREA */}
        <main style={{ padding: '1.75rem 2rem 3rem', flexGrow: 1 }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <Outlet />
          </div>
        </main>
      </div>

      {/* LOGOUT CONFIRMATION MODAL */}
      <ConfirmationModal
        isOpen={showLogoutModal}
        title="Logout from MILASTY?"
        message="Are you sure you want to logout from your customer portal session?"
        confirmText="Yes, Logout"
        cancelText="Cancel"
        onConfirm={confirmLogout}
        onCancel={() => setShowLogoutModal(false)}
        danger={true}
      />
    </div>
  );
}
