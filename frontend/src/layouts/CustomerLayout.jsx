import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { 
  LayoutDashboard, Package, Heart, MapPin, User, Lock, LogOut, Menu, X, 
  Store, ChevronRight, MessageSquare, ShoppingBag, Search, Bell
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

  useEffect(() => {
    if (!isAuthenticated) navigate('/login');
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    document.body.classList.add('customer-portal-body');
    return () => document.body.classList.remove('customer-portal-body');
  }, []);

  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname, location.search]);

  if (!isAuthenticated) return null;

  const confirmLogout = () => {
    setShowLogoutModal(false);
    logout();
    toast.success('Logged out successfully.');
    navigate('/login', { replace: true });
  };

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';
  const userName = user?.name || 'Customer';

  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good Morning';
    if (hr < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const navSections = [
    {
      title: 'MAIN',
      items: [
        { label: 'Dashboard', path: '/account', icon: LayoutDashboard },
        { label: 'My Orders', path: '/account/orders', icon: Package },
        { label: 'Wishlist', path: '/wishlist', icon: Heart, badge: wishlistCount },
        { label: 'Addresses', path: '/account?tab=addresses', icon: MapPin },
        { label: 'My Inquiries', path: '/account/inquiries', icon: MessageSquare },
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
      title: 'STORE',
      items: [
        { label: 'Visit Store', path: '/shop', icon: Store },
      ]
    }
  ];

  const getPageHeaderInfo = () => {
    const path = location.pathname;
    const search = location.search;
    if (path === '/account') {
      if (search.includes('tab=addresses')) return { category: 'ACCOUNT / ADDRESSES', title: 'Delivery Locations', subtitle: 'Manage your saved shipping addresses for fast checkout.' };
      if (search.includes('tab=profile')) return { category: 'ACCOUNT / PROFILE', title: 'My Profile', subtitle: 'Manage your account name, email and phone number.' };
      if (search.includes('tab=password')) return { category: 'ACCOUNT / SECURITY', title: 'Change Password', subtitle: 'Update your account password and security settings.' };
      return { category: 'ACCOUNT OVERVIEW', title: `${getGreeting()}, ${userName} ☀️`, subtitle: "Here's what's happening with your MILASTY account today." };
    }
    if (path.includes('/account/orders/')) return { category: 'ACCOUNT / ORDERS', title: 'Order Details', subtitle: 'View order summary, items, and tracking status.' };
    if (path === '/account/orders') return { category: 'ACCOUNT / ORDERS', title: 'My Orders', subtitle: 'Track and manage your MILASTY purchases.' };
    if (path.includes('/account/inquiries')) return { category: 'ACCOUNT / SUPPORT', title: 'My Inquiries', subtitle: 'View your questions and support requests.' };
    if (path === '/wishlist') return { category: 'ACCOUNT / WISHLIST', title: 'My Wishlist', subtitle: 'Your saved favourite bakes and products.' };
    return { category: 'ACCOUNT / PORTAL', title: 'Customer Portal', subtitle: 'Manage your MILASTY account.' };
  };

  const { category, title, subtitle } = getPageHeaderInfo();
  const isDashboard = location.pathname === '/account' && !location.search;

  const isNavActive = (item) => {
    if (item.path.includes('?')) {
      return (location.pathname + location.search) === item.path;
    }
    return location.pathname === item.path && !location.search;
  };

  const SidebarContent = ({ onClose }) => (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      padding: '1.5rem 1rem', overflowY: 'auto', gap: '0',
      backgroundColor: 'transparent',
    }}>
      {/* Brand Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '1.75rem', paddingBottom: '1.25rem',
        borderBottom: '1px solid rgba(231, 222, 213, 0.6)',
      }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #5A2E16, #7C3D20)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            boxShadow: '0 4px 12px rgba(90, 46, 22, 0.25)',
          }}>
            <span style={{ color: '#FFFFFF', fontWeight: '900', fontFamily: 'var(--font-serif)', fontSize: '1rem' }}>M</span>
          </div>
          <div>
            <div style={{ fontSize: '1rem', fontFamily: 'var(--font-serif)', fontWeight: '900', letterSpacing: '0.06em', color: '#21150F', lineHeight: '1.1' }}>
              MILASTY
            </div>
            <div style={{ fontSize: '0.55rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#C58A35', fontWeight: '800', marginTop: '0.1rem' }}>
              Customer Portal
            </div>
          </div>
        </Link>
        {onClose && (
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(231,222,213,0.5)', cursor: 'pointer', color: '#888', padding: '0.3rem', borderRadius: '8px', display: 'flex', alignItems: 'center' }}>
            <X size={16} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
        {navSections.map((sec) => (
          <div key={sec.title} style={{ marginBottom: '0.5rem' }}>
            <div style={{
              fontSize: '0.6rem', fontWeight: '800', textTransform: 'uppercase',
              letterSpacing: '0.12em', color: '#B0A09A', padding: '0 0.5rem',
              marginBottom: '0.35rem', marginTop: '0.75rem',
            }}>{sec.title}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
              {sec.items.map((item) => {
                const Icon = item.icon;
                const active = isNavActive(item);
                return (
                  <Link
                    key={item.label}
                    to={item.path}
                    onClick={() => onClose && onClose()}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.65rem',
                      padding: '0.6rem 0.75rem', borderRadius: '10px',
                      fontSize: '0.84rem', fontWeight: active ? '800' : '600',
                      textDecoration: 'none',
                      color: active ? '#FFFFFF' : '#4A3B2E',
                      background: active
                        ? 'linear-gradient(135deg, #5A2E16, #7C3D20)'
                        : 'transparent',
                      boxShadow: active ? '0 4px 16px rgba(90, 46, 22, 0.28)' : 'none',
                      transition: 'all 0.18s ease',
                    }}
                    onMouseEnter={e => {
                      if (!active) {
                        e.currentTarget.style.backgroundColor = 'rgba(90, 46, 22, 0.07)';
                        e.currentTarget.style.color = '#5A2E16';
                      }
                    }}
                    onMouseLeave={e => {
                      if (!active) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = '#4A3B2E';
                      }
                    }}
                  >
                    <Icon size={16} style={{ flexShrink: 0, opacity: active ? 1 : 0.7 }} />
                    <span style={{ flexGrow: 1 }}>{item.label}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span style={{
                        fontSize: '0.65rem', fontWeight: '800',
                        backgroundColor: active ? 'rgba(255,255,255,0.25)' : '#F0E8DE',
                        color: active ? '#FFFFFF' : '#5A2E16',
                        padding: '0.08rem 0.45rem', borderRadius: '999px',
                        minWidth: '18px', textAlign: 'center',
                      }}>
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

      {/* Botanical Decoration */}
      <div style={{
        textAlign: 'center', padding: '0.75rem 0.5rem 0.5rem',
        borderTop: '1px solid rgba(231, 222, 213, 0.6)', marginTop: '0.5rem',
      }}>
        <div style={{ fontSize: '1.8rem', lineHeight: 1, marginBottom: '0.35rem' }}>🌿</div>
        <div style={{ fontSize: '0.65rem', color: '#B0A09A', fontWeight: '600', fontStyle: 'italic' }}>
          Good Food, Good Mood
        </div>
      </div>

      {/* User Card Footer */}
      <div style={{ paddingTop: '0.75rem', marginTop: '0.5rem' }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem',
          padding: '0.75rem', borderRadius: '12px',
          backgroundColor: 'rgba(245, 237, 229, 0.6)',
          border: '1px solid rgba(231, 222, 213, 0.5)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', minWidth: 0 }}>
            <div style={{
              width: '34px', height: '34px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #5A2E16, #7C3D20)',
              border: '2px solid rgba(255,255,255,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#FFFFFF', fontWeight: '900', fontSize: '0.88rem', flexShrink: 0,
            }}>
              {userInitial}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '0.82rem', fontWeight: '800', color: '#21150F', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {userName}
              </div>
              <div style={{ fontSize: '0.64rem', color: '#888', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.email || ''}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowLogoutModal(true)}
            title="Log Out"
            style={{
              background: 'rgba(255,255,255,0.7)', border: '1px solid #FEECEC', cursor: 'pointer',
              color: '#C62828', padding: '0.4rem', borderRadius: '8px',
              display: 'flex', alignItems: 'center', transition: 'all 0.18s', flexShrink: 0,
            }}
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{
      display: 'flex', minHeight: '100vh', width: '100%',
      backgroundImage: `url('/images/dashboard_bg_image.jpeg')`,
      backgroundSize: 'cover', backgroundPosition: 'top center',
      backgroundAttachment: 'fixed', backgroundRepeat: 'no-repeat',
      color: '#21150F',
    }}>

      {/* DESKTOP FIXED SIDEBAR */}
      <aside
        style={{
          width: '240px', position: 'fixed', top: 0, bottom: 0, left: 0,
          zIndex: 90, height: '100vh',
          borderRight: '1px solid rgba(231, 222, 213, 0.5)',
          backgroundColor: 'rgba(255, 255, 255, 0.72)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
        className="customer-desktop-sidebar"
      >
        <SidebarContent onClose={null} />
      </aside>

      {/* MOBILE OVERLAY */}
      {mobileSidebarOpen && (
        <div
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(33, 21, 15, 0.4)', backdropFilter: 'blur(4px)', zIndex: 998 }}
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* MOBILE DRAWER */}
      <aside
        style={{
          position: 'fixed', top: 0, bottom: 0, left: 0, width: '260px',
          zIndex: 999,
          transform: mobileSidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          boxShadow: '4px 0 40px rgba(90, 46, 22, 0.2)',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
        className="customer-mobile-drawer"
      >
        <SidebarContent onClose={() => setMobileSidebarOpen(false)} />
      </aside>

      {/* MAIN CONTENT WRAPPER */}
      <div
        style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minWidth: 0, backgroundColor: 'transparent' }}
        className="customer-main-area"
      >
        {/* MOBILE TOP HEADER */}
        <header
          style={{
            height: '60px', backgroundColor: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderBottom: '1px solid rgba(231, 222, 213, 0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 1.25rem', position: 'sticky', top: 0, zIndex: 80,
          }}
          className="customer-mobile-header-bar"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              style={{ background: 'none', border: 'none', color: '#5A2E16', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0.2rem' }}
            >
              <Menu size={22} />
            </button>
            <span style={{ fontSize: '1rem', fontFamily: 'var(--font-serif)', fontWeight: '900', color: '#21150F' }}>
              MILASTY
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Link
              to="/shop"
              style={{
                fontSize: '0.75rem', color: '#5A2E16', fontWeight: '700', textDecoration: 'none',
                display: 'flex', alignItems: 'center', gap: '0.25rem',
                backgroundColor: 'rgba(245, 237, 229, 0.8)', padding: '0.35rem 0.75rem',
                borderRadius: '8px', border: '1px solid rgba(231, 222, 213, 0.7)',
              }}
            >
              <span>Store</span>
              <ChevronRight size={12} />
            </Link>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #5A2E16, #7C3D20)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#FFFFFF', fontWeight: '900', fontSize: '0.85rem',
            }}>
              {userInitial}
            </div>
          </div>
        </header>

        {/* DESKTOP TOP HEADER BAR */}
        <div
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.70)', backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderBottom: '1px solid rgba(231, 222, 213, 0.5)',
            padding: '0 2rem', height: '64px', display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 80,
            boxShadow: '0 2px 20px rgba(90, 46, 22, 0.05)',
          }}
          className="customer-desktop-topbar"
        >
          {/* Search */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.6rem',
            backgroundColor: 'rgba(252, 250, 247, 0.8)', border: '1px solid rgba(231, 222, 213, 0.7)',
            borderRadius: '12px', padding: '0.55rem 1rem', width: '260px',
            backdropFilter: 'blur(8px)',
          }}>
            <Search size={14} color="#B0A09A" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: '0.82rem', color: '#B0A09A', fontWeight: '500' }}>
              Search your account...
            </span>
          </div>

          {/* Right side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <Link to="/shop" style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.55rem 1.15rem', borderRadius: '12px',
              background: 'linear-gradient(135deg, #5A2E16, #7C3D20)',
              color: '#FFFFFF', fontWeight: '800', fontSize: '0.82rem', textDecoration: 'none',
              boxShadow: '0 4px 16px rgba(90, 46, 22, 0.25)',
              transition: 'all 0.18s ease',
            }}>
              <Store size={14} />
              <span>Visit Store</span>
              <ChevronRight size={13} />
            </Link>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #5A2E16, #7C3D20)',
                border: '2px solid rgba(255,255,255,0.5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#FFFFFF', fontWeight: '900', fontSize: '0.9rem', flexShrink: 0,
                boxShadow: '0 2px 10px rgba(90, 46, 22, 0.2)',
              }}>
                {userInitial}
              </div>
              <div style={{ display: 'none' }} className="cp-user-name-label">
                <span style={{ fontSize: '0.83rem', fontWeight: '700', color: '#21150F' }}>{userName}</span>
              </div>
            </div>
          </div>
        </div>

        {/* PAGE HEADER */}
        <div style={{ padding: '1.75rem 2rem 0', backgroundColor: 'transparent' }}>
          <div style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.14em', color: '#C68A3A', fontWeight: '800', marginBottom: '0.3rem' }}>
            {category}
          </div>
          <h1 style={{
            fontSize: isDashboard ? '1.85rem' : '1.45rem',
            fontFamily: 'var(--font-serif)', fontWeight: '900',
            color: '#21150F', margin: 0, letterSpacing: '-0.02em', lineHeight: 1.2,
          }}>
            {title}
          </h1>
          {subtitle && (
            <p style={{ fontSize: '0.88rem', color: '#665A52', margin: '0.35rem 0 0 0', fontWeight: '500' }}>
              {subtitle}
            </p>
          )}
        </div>

        {/* MAIN OUTLET */}
        <main style={{ padding: '1.5rem 2rem 3rem', flexGrow: 1 }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <Outlet />
          </div>
        </main>
      </div>

      {/* LOGOUT MODAL */}
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
