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
        { label: 'Delivery Areas', path: '/admin/delivery-areas', icon: Truck },
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
    if (path.includes('/admin/delivery-areas')) return { title: 'Delivery Areas', breadcrumb: 'Fulfillment / Delivery Areas' };
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

  const SidebarContent = () => (
    <div 
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100%', 
        justifyContent: 'space-between',
        backgroundColor: '#24150F',
        color: '#D8CCC0',
        padding: '1.75rem 1.25rem',
        overflowY: 'auto'
      }}
    >
      <div>
        {/* Brand Logo Header */}
        <div style={{ marginBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.12)', paddingBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontFamily: 'var(--font-serif)', fontWeight: '900', letterSpacing: '0.06em', margin: 0, color: '#FFFFFF' }}>
              MILASTY<span style={{ color: '#5FAF65' }}>.</span>
            </h2>
            <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#D8CCC0', fontWeight: '700', marginTop: '0.2rem' }}>
              Store Management
            </div>
          </div>
          <button 
            onClick={() => setMobileSidebarOpen(false)}
            style={{ background: 'none', border: 'none', color: '#D8CCC0', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0.2rem' }}
            className="admin-hamburger-btn"
          >
            <X size={18} />
          </button>
        </div>

        {/* Sidebar Nav Items */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {sections.map((section) => (
            <div key={section.title}>
              <h3 style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8D7B6C', fontWeight: '800', marginBottom: '0.65rem' }}>
                {section.title}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={handleLinkClick}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.65rem 0.85rem',
                        borderRadius: '8px',
                        fontSize: '0.85rem',
                        fontWeight: active ? '800' : '600',
                        textDecoration: 'none',
                        color: active ? '#FFFFFF' : '#D8CCC0',
                        backgroundColor: active ? 'rgba(47, 125, 50, 0.30)' : 'transparent',
                        borderLeft: active ? '3px solid #5FAF65' : '3px solid transparent',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        if (!active) {
                          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                          e.currentTarget.style.color = '#FFFFFF';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!active) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = '#D8CCC0';
                        }
                      }}
                      className="admin-sidebar-link"
                    >
                      <Icon size={16} color={active ? '#5FAF65' : '#D8CCC0'} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Sidebar Profile Card Footer */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.12)', paddingTop: '1.25rem', marginTop: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
            <div 
              style={{ 
                width: '36px', 
                height: '36px', 
                borderRadius: '50%', 
                backgroundColor: 'rgba(255, 255, 255, 0.12)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: '#FFFFFF',
                fontWeight: '800',
                fontSize: '0.88rem',
                border: '1px solid rgba(255, 255, 255, 0.25)'
              }}
            >
              M
            </div>
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: '800', color: '#FFFFFF' }}>Milasty Admin</div>
              <div style={{ fontSize: '0.68rem', color: '#D8CCC0', fontWeight: '600' }}>Store Manager</div>
            </div>
          </div>
          
          <button 
            onClick={() => setShowLogoutModal(true)} 
            style={{ 
              background: 'none', 
              border: 'none', 
              color: '#F87171', 
              cursor: 'pointer',
              padding: '0.4rem',
              display: 'flex',
              alignItems: 'center',
              borderRadius: '6px',
              transition: 'all 0.2s'
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
    <div className="admin-page-wrapper" style={{ display: 'flex' }}>
      
      {/* ==================================================
          DESKTOP SIDEBAR (Fixed Left)
         ================================================== */}
      <div 
        style={{ 
          width: '260px', 
          position: 'fixed', 
          top: 0, 
          bottom: 0, 
          left: 0, 
          zIndex: 90,
          display: 'none',
          height: '100vh',
          borderRight: '1px solid var(--admin-border)',
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
        <SidebarContent />
      </div>

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
            backgroundColor: 'rgba(24, 16, 12, 0.65)', 
            zIndex: 1000,
            backdropFilter: 'blur(4px)'
          }}
        />
      )}
      <div 
        style={{ 
          position: 'fixed', 
          top: 0, 
          bottom: 0, 
          left: 0, 
          width: '260px', 
          maxWidth: '85vw',
          zIndex: 1001, 
          transform: mobileSidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          height: '100vh',
          overflowY: 'auto',
          boxShadow: mobileSidebarOpen ? '6px 0 25px rgba(0,0,0,0.4)' : 'none'
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
          marginLeft: 0
        }}
        className="admin-main-container"
      >
        
        {/* STICKY TOP BAR */}
        <header 
          style={{ 
            position: 'sticky', 
            top: 0, 
            zIndex: 80, 
            backgroundColor: '#FFFFFF', 
            borderBottom: '1px solid #D9CEC0', 
            padding: '0.5rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '72px',
            boxShadow: '0 2px 10px rgba(36, 21, 15, 0.03)',
          }}
        >
          {/* Left: Mobile hamburger menu toggle & titles */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <button 
              onClick={() => setMobileSidebarOpen(true)}
              style={{
                background: 'none',
                border: 'none',
                color: '#2F7D32',
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
              <span style={{ fontSize: '0.68rem', fontWeight: '800', textTransform: 'uppercase', color: '#665B53', letterSpacing: '0.06em', lineHeight: '1.2' }}>
                {pageBreadcrumb}
              </span>
              <h1 style={{ fontSize: 'clamp(1.2rem, 2.5vw, 1.45rem)', fontFamily: 'var(--font-serif)', color: '#24150F', fontWeight: '800', margin: 0, lineHeight: '1.2' }}>
                {pageTitle}
              </h1>
            </div>
          </div>

          {/* Right: Actions, notification bell, admin profile dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <Link 
              to="/" 
              style={{ 
                color: '#FFFFFF', 
                fontSize: '0.76rem', 
                fontWeight: '700',
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.35rem', 
                textDecoration: 'none',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                backgroundColor: '#24150F',
                padding: '0.5rem 0.9rem',
                borderRadius: '8px',
                border: 'none',
                boxShadow: '0 2px 6px rgba(36,21,15,0.15)'
              }}
              className="desktop-links hover-scale"
            >
              <Globe size={14} />
              <span>View Store</span>
            </Link>

            {/* Notification bell button */}
            <button
              style={{
                background: '#F5EFE7',
                border: '1px solid #D9CEC0',
                color: '#24150F',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.5rem',
                borderRadius: '8px',
                transition: 'all 0.2s'
              }}
              className="hover-scale"
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
                  borderRadius: '8px',
                  backgroundColor: profileDropdownOpen ? '#F5EFE7' : 'transparent',
                  border: '1px solid transparent',
                  transition: 'all 0.2s ease'
                }}
              >
                <div 
                  style={{ 
                    width: '34px', 
                    height: '34px', 
                    borderRadius: '50%', 
                    backgroundColor: '#E8F5E9', 
                    color: '#2F7D32', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    fontWeight: '800',
                    fontSize: '0.88rem',
                    border: '1.5px solid #2F7D32'
                  }}
                >
                  M
                </div>
                <div className="desktop-links" style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: '800', color: '#24150F', lineHeight: '1.2' }}>
                    Milasty Admin
                  </span>
                  <span style={{ fontSize: '0.68rem', color: '#665B53', fontWeight: '600' }}>
                    Super Admin
                  </span>
                </div>
                <ChevronDown size={13} color="#514840" style={{ transform: profileDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
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
                    border: '1px solid #D9CEC0',
                    borderRadius: '12px',
                    padding: '0.5rem',
                    boxShadow: '0 10px 35px rgba(36, 21, 15, 0.18)',
                    zIndex: 200,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.2rem'
                  }}
                >
                  <div style={{ padding: '0.6rem 0.8rem', borderBottom: '1px solid #E5DDD3', marginBottom: '0.25rem' }}>
                    <div style={{ fontWeight: '800', fontSize: '0.85rem', color: '#24150F' }}>Milasty Admin</div>
                    <div style={{ fontSize: '0.72rem', color: '#665B53', marginTop: '0.15rem', fontWeight: '500' }}>admin@milasty.com</div>
                  </div>

                  <button 
                    onClick={() => { setProfileDropdownOpen(false); alert('Profile settings are synchronized with Supabase Auth.'); }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.6rem',
                      width: '100%',
                      padding: '0.6rem 0.8rem',
                      background: 'none',
                      border: 'none',
                      color: '#241C18',
                      fontSize: '0.82rem',
                      fontWeight: '600',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background-color 0.15s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F5EFE7'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <UserCheck size={15} color="#2F7D32" />
                    <span>Profile Settings</span>
                  </button>

                  <button 
                    onClick={() => { setProfileDropdownOpen(false); alert('To change password, use Supabase Auth password reset flow.'); }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.6rem',
                      width: '100%',
                      padding: '0.6rem 0.8rem',
                      background: 'none',
                      border: 'none',
                      color: '#241C18',
                      fontSize: '0.82rem',
                      fontWeight: '600',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background-color 0.15s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F5EFE7'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <KeyRound size={15} color="#B7791F" />
                    <span>Change Password</span>
                  </button>

                  <div style={{ borderTop: '1px solid #E5DDD3', marginTop: '0.25rem', paddingTop: '0.25rem' }}>
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        setShowLogoutModal(true);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.65rem',
                        width: '100%',
                        padding: '0.65rem 0.85rem',
                        fontSize: '0.82rem',
                        fontWeight: '700',
                        color: '#B42318',
                        backgroundColor: 'transparent',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background-color 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FCE8E6'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <LogOut size={15} color="#B42318" />
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
            backgroundColor: 'var(--admin-bg)'
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
