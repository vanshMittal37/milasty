import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { 
  LayoutDashboard, Package, Tags, ShoppingCart, Users, Ticket, Star, 
  LogOut, Menu, Bell, ChevronDown, Globe, KeyRound, UserCheck, X, Truck, MessageSquare, Clock, HelpCircle, Sparkles, Compass
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ConfirmationModal from '../components/ConfirmationModal';

export default function AdminLayout() {
  const { isAuthenticated, isAdmin, logout } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const dropdownRef = useRef(null);

  // Close profile dropdown on click outside or Escape key
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setProfileDropdownOpen(false);
        setMobileSidebarOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Handle body class for background override
  useEffect(() => {
    document.body.classList.add('admin-body');
    return () => {
      document.body.classList.remove('admin-body');
    };
  }, []);

  // Securely protect layout from unauthenticated access
  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      navigate('/login');
    }
  }, [isAuthenticated, isAdmin, navigate]);

  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  const sections = [
    {
      title: 'Catalog',
      items: [
        { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
        { label: 'Products', path: '/admin/products', icon: Package },
        { label: 'Categories', path: '/admin/categories', icon: Tags },
        { label: 'Pre-Bookings', path: '/admin/prebookings', icon: Clock },
      ]
    },
    {
      title: 'Sales & Fulfillment',
      items: [
        { label: 'Orders Log', path: '/admin/orders', icon: ShoppingCart },
        { label: 'Coupons', path: '/admin/coupons', icon: Ticket },
        { label: 'Delivery Charges', path: '/admin/delivery-charges', icon: Truck },
      ]
    },
    {
      title: 'Customers & Support',
      items: [
        { label: 'Customers', path: '/admin/customers', icon: Users },
        { label: 'Inquiries', path: '/admin/inquiries', icon: MessageSquare },
        { label: 'Reviews & Testimonials', path: '/admin/reviews', icon: Star },
      ]
    },
    {
      title: 'Content & Discovery',
      items: [
        { label: 'Product Discovery', path: '/admin/product-discovery', icon: Compass },
        { label: 'Recommendation Quiz', path: '/admin/recommendation-quiz', icon: HelpCircle },
        { label: 'Honest Ingredients', path: '/admin/honest-ingredients', icon: Sparkles },
        { label: 'View Website', path: '/', icon: Globe },
      ]
    }
  ];

  // Helper to determine active route title & breadcrumb
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/admin/dashboard')) return { title: 'Dashboard', breadcrumb: 'Home / Dashboard' };
    if (path.includes('/admin/products/add')) return { title: 'Add Product', breadcrumb: 'Products / Add New' };
    if (path.includes('/admin/products/edit')) return { title: 'Edit Product', breadcrumb: 'Products / Edit' };
    if (path.includes('/admin/products')) return { title: 'Products', breadcrumb: 'Catalog / Products' };
    if (path.includes('/admin/categories')) return { title: 'Categories', breadcrumb: 'Catalog / Categories' };
    if (path.includes('/admin/prebookings')) return { title: 'Pre-Booking Products', breadcrumb: 'Catalog / Pre-Bookings' };
    if (path.includes('/admin/delivery-charges') || path.includes('/admin/delivery-areas')) return { title: 'Delivery Charges', breadcrumb: 'Fulfillment / Delivery Charges' };
    if (path.includes('/admin/orders')) return { title: 'Orders Log', breadcrumb: 'Sales / Orders Log' };
    if (path.includes('/admin/customers')) return { title: 'Customers', breadcrumb: 'Users / Customer List' };
    if (path.includes('/admin/inquiries')) return { title: 'Customer Inquiries', breadcrumb: 'Support / Customer Inquiries' };
    if (path.includes('/admin/coupons')) return { title: 'Coupons', breadcrumb: 'Promotions / Coupons' };
    if (path.includes('/admin/reviews')) return { title: 'Reviews Moderation', breadcrumb: 'Feedback / Reviews' };
    if (path.includes('/admin/product-discovery')) return { title: 'Product Discovery', breadcrumb: 'Content / Product Discovery' };
    if (path.includes('/admin/recommendation-quiz')) return { title: 'Recommendation Quiz', breadcrumb: 'Content / Product Quiz' };
    if (path.includes('/admin/honest-ingredients')) return { title: 'Honest Ingredients', breadcrumb: 'Content / Honest Ingredients' };
    return { title: 'Admin Panel', breadcrumb: 'MILASTY / Admin' };
  };

  const { title: pageTitle, breadcrumb: pageBreadcrumb } = getPageTitle();

  const handleLinkClick = () => {
    setMobileSidebarOpen(false);
  };

  const renderSidebarInner = () => (
    <div 
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100%', 
        justifyContent: 'space-between',
        backgroundColor: 'transparent',
        color: '#4A3B2E',
        padding: '1.5rem 1.15rem',
        overflowY: 'auto'
      }}
    >
      <div>
        {/* Brand Logo Header */}
        <div style={{ marginBottom: '1.75rem', borderBottom: '1px solid #E7DED5', paddingBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div 
              style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: 'linear-gradient(135deg, #5A2E16, #7C3D20)',
                color: '#FFFFFF',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: '900', fontFamily: 'var(--font-serif)', fontSize: '1rem',
                flexShrink: 0, boxShadow: '0 4px 12px rgba(90, 46, 22, 0.3)',
              }}
            >
              M
            </div>
            <div>
              <h2 style={{ fontSize: '1.05rem', fontFamily: 'var(--font-serif)', fontWeight: '900', letterSpacing: '0.04em', margin: 0, color: '#21150F', lineHeight: '1.1' }}>
                MILASTY<span style={{ color: '#C68A3A' }}>.</span>
              </h2>
              <div style={{ fontSize: '0.55rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#C68A3A', fontWeight: '800', marginTop: '0.1rem' }}>
                Admin Portal
              </div>
            </div>
          </div>
          <button 
            onClick={() => setMobileSidebarOpen(false)}
            style={{ background: 'none', border: 'none', color: '#665A52', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0.2rem' }}
            className="admin-hamburger-btn"
          >
            <X size={18} />
          </button>
        </div>

        {/* Sidebar Nav Items */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {sections.map((section) => (
            <div key={section.title}>
              <h3 style={{ fontSize: '0.58rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#B0A09A', fontWeight: '800', marginBottom: '0.4rem', paddingLeft: '0.5rem' }}>
                {section.title}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={handleLinkClick}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.65rem',
                        padding: '0.6rem 0.75rem', borderRadius: '10px',
                        fontSize: '0.83rem', fontWeight: active ? '800' : '600',
                        textDecoration: 'none',
                        color: active ? '#FFFFFF' : '#4A3B2E',
                        background: active ? 'linear-gradient(135deg, #5A2E16, #7C3D20)' : 'transparent',
                        boxShadow: active ? '0 4px 16px rgba(90, 46, 22, 0.28)' : 'none',
                        transition: 'all 0.18s ease',
                      }}
                      onMouseEnter={(e) => {
                        if (!active) {
                          e.currentTarget.style.backgroundColor = 'rgba(90, 46, 22, 0.07)';
                          e.currentTarget.style.color = '#5A2E16';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!active) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = '#4A3B2E';
                        }
                      }}
                      className="admin-sidebar-link"
                    >
                      <Icon size={16} color={active ? '#FFFFFF' : '#5A2E16'} style={{ flexShrink: 0, opacity: active ? 1 : 0.75 }} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Botanical Footer + Profile */}
      <div>
        <div style={{ textAlign: 'center', padding: '0.75rem 0.5rem 0.75rem', borderTop: '1px solid rgba(231,222,213,0.6)', marginTop: '0.5rem' }}>
          <div style={{ fontSize: '1.6rem', lineHeight: 1, marginBottom: '0.3rem' }}>🌿</div>
          <div style={{ fontSize: '0.6rem', color: '#B0A09A', fontWeight: '600', fontStyle: 'italic' }}>Good Food, Good Mood</div>
        </div>
        <div style={{ 
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0.75rem', borderRadius: '12px',
          backgroundColor: 'rgba(245, 237, 229, 0.6)',
          border: '1px solid rgba(231, 222, 213, 0.5)',
          marginTop: '0.5rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
            <div style={{ 
              width: '32px', height: '32px', borderRadius: '50%', 
              background: 'linear-gradient(135deg, #5A2E16, #7C3D20)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#FFFFFF', fontWeight: '900', fontSize: '0.84rem',
            }}>M</div>
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: '800', color: '#21150F' }}>Milasty Admin</div>
              <div style={{ fontSize: '0.62rem', color: '#888888', fontWeight: '600' }}>Store Manager</div>
            </div>
          </div>
          <button 
            onClick={() => setShowLogoutModal(true)} 
            style={{ 
              background: 'rgba(255,255,255,0.7)', border: '1px solid #FEECEC', color: '#C68A3A', 
              cursor: 'pointer', padding: '0.4rem', display: 'flex', alignItems: 'center',
              borderRadius: '8px', transition: 'all 0.2s'
            }}
            title="Log Out"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div 
      className="admin-page-wrapper" 
      style={{ 
        display: 'flex', 
        minHeight: '100vh',
        backgroundColor: '#F5EBDD',
        backgroundImage: `url('/images/dashboard_bg_image.jpeg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'top right',
        backgroundAttachment: 'fixed',
        backgroundRepeat: 'no-repeat',
        color: '#21150F',
      }}
    >
      
      {/* DESKTOP SIDEBAR (Fixed Left) */}
      <div 
        style={{ 
          width: '260px', position: 'fixed', top: 0, bottom: 0, left: 0,
          zIndex: 90, display: 'none', height: '100vh',
          borderRight: '1px solid rgba(231, 222, 213, 0.5)',
          backgroundColor: 'rgba(255, 255, 255, 0.72)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          overflowY: 'auto'
        }}
        className="admin-desktop-sidebar"
      >
        <style>{`
          @media (min-width: 1024px) {
            .admin-desktop-sidebar {
              display: block !important;
            }
            .admin-main-container {
              margin-left: 260px !important;
            }
          }
        `}</style>
        {renderSidebarInner()}
      </div>iv>

      {/* ==================================================
          MOBILE SIDEBAR DRAWER (Collapsible neutral overlay)
         ================================================== */}
      {mobileSidebarOpen && (
        <div 
          onClick={() => setMobileSidebarOpen(false)}
          style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            width: '100%', 
            height: '100%', 
            backgroundColor: 'rgba(50, 30, 15, 0.45)', 
            zIndex: 1000,
            backdropFilter: 'blur(4px)'
          }}
        />
      )}
      <div 
        style={{ 
          position: 'fixed', top: 0, bottom: 0, left: 0, width: '260px', maxWidth: '85vw',
          zIndex: 1001, 
          transform: mobileSidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          height: '100vh', overflowY: 'auto',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          boxShadow: mobileSidebarOpen ? '6px 0 40px rgba(90,46,22,0.2)' : 'none'
        }}
      >
        <SidebarContent />
      </div>

      {/* ==================================================
          RIGHT WORKSPACE CONTAINER (Top Bar + Main Outlet)
         ================================================== */}
      <div 
        style={{ 
          flexGrow: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          minWidth: 0,
          marginLeft: 0,
          backgroundColor: 'transparent'
        }}
        className="admin-main-container"
      >
        
        {/* STICKY TOP BAR */}
        <header 
          style={{ 
            position: 'sticky', top: 0, zIndex: 80,
            backgroundColor: 'rgba(255, 255, 255, 0.70)',
            backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
            borderBottom: '1px solid rgba(231, 222, 213, 0.5)',
            padding: '0.5rem 1.75rem',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            height: '70px',
            boxShadow: '0 2px 20px rgba(90, 46, 22, 0.05)',
          }}
        >
          {/* Left: Mobile hamburger menu toggle & titles */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <button 
              onClick={() => setMobileSidebarOpen(true)}
              style={{
                background: 'none',
                border: 'none',
                color: '#5A2E16',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '0.4rem',
                margin: 0
              }}
              className="admin-hamburger-btn"
            >
              <style>{`
                @media (min-width: 1024px) {
                  .admin-hamburger-btn {
                    display: none !important;
                  }
                }
              `}</style>
              <Menu size={22} />
            </button>
            
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <span style={{ fontSize: '0.62rem', fontWeight: '800', textTransform: 'uppercase', color: '#C68A3A', letterSpacing: '0.08em', lineHeight: '1.2' }}>
                {pageBreadcrumb}
              </span>
              <h1 style={{ fontSize: 'clamp(1.15rem, 2.5vw, 1.4rem)', fontFamily: 'var(--font-serif)', color: '#21150F', fontWeight: '900', margin: 0, lineHeight: '1.2' }}>
                {pageTitle}
              </h1>
            </div>
          </div>

          {/* Right: Actions, notification bell, admin profile dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link 
              to="/" 
              style={{ 
                color: '#5A2E16', 
                fontSize: '0.78rem', 
                fontWeight: '700',
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.4rem', 
                textDecoration: 'none',
                backgroundColor: '#F5EDE5',
                padding: '0.5rem 1rem',
                borderRadius: '999px',
                border: '1px solid #E7DED5',
                transition: 'all 0.2s ease'
              }}
              className="desktop-links"
            >
              <Globe size={14} color="#5A2E16" />
              <span>View Store</span>
            </Link>

            {/* Notification bell button */}
            <button
              style={{
                background: '#FFFFFF',
                border: '1px solid #E7DED5',
                color: '#5A2E16',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.55rem',
                borderRadius: '999px',
                transition: 'all 0.2s'
              }}
              title="Notifications"
            >
              <Bell size={16} />
            </button>
            
            {/* Interactive Admin Profile Avatar & Dropdown */}
            <div style={{ position: 'relative' }} ref={dropdownRef}>
              <div 
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.65rem',
                  cursor: 'pointer',
                  padding: '0.35rem 0.65rem',
                  borderRadius: '999px',
                  backgroundColor: profileDropdownOpen ? '#F5EDE5' : 'transparent',
                  border: '1px solid transparent',
                  transition: 'all 0.2s ease'
                }}
              >
                <div 
                  style={{ 
                    width: '34px', 
                    height: '34px', 
                    borderRadius: '50%', 
                    backgroundColor: '#5A2E16', 
                    color: '#FFFFFF', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    fontWeight: '900',
                    fontSize: '0.88rem',
                    border: '1.5px solid #C68A3A'
                  }}
                >
                  M
                </div>
                <div className="desktop-links" style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: '800', color: '#21150F', lineHeight: '1.2' }}>
                    Milasty Admin
                  </span>
                  <span style={{ fontSize: '0.66rem', color: '#665A52', fontWeight: '600' }}>
                    Super Admin
                  </span>
                </div>
                <ChevronDown size={13} color="#5A2E16" style={{ transform: profileDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </div>

              {/* Profile Dropdown Menu */}
              {profileDropdownOpen && (
                <div 
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: '230px',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E7DED5',
                    borderRadius: '16px',
                    padding: '0.5rem',
                    boxShadow: '0 12px 40px rgba(90, 46, 22, 0.15)',
                    zIndex: 200,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.2rem'
                  }}
                >
                  <div style={{ padding: '0.66rem 0.85rem', borderBottom: '1px solid #E7DED5', marginBottom: '0.25rem' }}>
                    <div style={{ fontWeight: '800', fontSize: '0.85rem', color: '#21150F' }}>Milasty Admin</div>
                    <div style={{ fontSize: '0.72rem', color: '#665A52', marginTop: '0.15rem', fontWeight: '500' }}>admin@milasty.com</div>
                  </div>

                  <button 
                    onClick={() => { setProfileDropdownOpen(false); toast.info('Profile settings are synchronized with Supabase Auth.'); }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.6rem',
                      width: '100%',
                      padding: '0.6rem 0.8rem',
                      background: 'none',
                      border: 'none',
                      color: '#21150F',
                      fontSize: '0.82rem',
                      fontWeight: '600',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background-color 0.15s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F5EDE5'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <UserCheck size={15} color="#5A2E16" />
                    <span>Profile Settings</span>
                  </button>

                  <button 
                    onClick={() => { setProfileDropdownOpen(false); toast.info('To change password, use Supabase Auth password reset flow.'); }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.6rem',
                      width: '100%',
                      padding: '0.6rem 0.8rem',
                      background: 'none',
                      border: 'none',
                      color: '#21150F',
                      fontSize: '0.82rem',
                      fontWeight: '600',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background-color 0.15s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F5EDE5'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <KeyRound size={15} color="#5A2E16" />
                    <span>Security & Password</span>
                  </button>

                  <div style={{ borderTop: '1px solid #E7DED5', marginTop: '0.25rem', paddingTop: '0.25rem' }}>
                    <button 
                      onClick={() => { setProfileDropdownOpen(false); setShowLogoutModal(true); }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        width: '100%',
                        padding: '0.6rem 0.8rem',
                        background: 'none',
                        border: 'none',
                        color: '#C62828',
                        fontSize: '0.82rem',
                        fontWeight: '700',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background-color 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FFF5F5'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <LogOut size={15} />
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* WORKSPACE AREA */}
        <main 
          style={{ 
            flexGrow: 1, 
            padding: '1.5rem 1.25rem',
            maxWidth: '1400px',
            width: '100%',
            margin: '0 auto',
            backgroundColor: 'transparent'
          }}
          className="admin-workspace-area"
        >
          <style>{`
            @media (min-width: 768px) {
              .admin-workspace-area {
                padding: 2rem !important;
              }
            }
          `}</style>
          <Outlet />
        </main>
      </div>

      <ConfirmationModal
        isOpen={showLogoutModal}
        title="Logout?"
        message="Are you sure you want to logout of the Admin Dashboard?"
        confirmText="Logout"
        cancelText="Cancel"
        isDanger={true}
        onConfirm={() => {
          logout();
          setShowLogoutModal(false);
          toast.success('Logged out successfully.');
          navigate('/login');
        }}
        onCancel={() => setShowLogoutModal(false)}
      />
    </div>
  );
}
