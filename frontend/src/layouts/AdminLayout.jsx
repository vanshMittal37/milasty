import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { 
  LayoutDashboard, Package, Tags, ShoppingCart, Users, Ticket, Star, 
  LogOut, Menu, Bell, ChevronDown, Globe, KeyRound, UserCheck, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AdminLayout() {
  const { isAuthenticated, isAdmin, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
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
      title: 'Main',
      items: [
        { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
        { label: 'Products', path: '/admin/products', icon: Package },
        { label: 'Categories', path: '/admin/categories', icon: Tags },
        { label: 'Orders Log', path: '/admin/orders', icon: ShoppingCart },
      ]
    },
    {
      title: 'Customers',
      items: [
        { label: 'Customers', path: '/admin/customers', icon: Users },
        { label: 'Coupons', path: '/admin/coupons', icon: Ticket },
        { label: 'Reviews', path: '/admin/reviews', icon: Star },
      ]
    },
    {
      title: 'System',
      items: [
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
    if (path.includes('/admin/products')) return { title: 'Products', breadcrumb: 'Inventory / Products' };
    if (path.includes('/admin/categories')) return { title: 'Categories', breadcrumb: 'Inventory / Categories' };
    if (path.includes('/admin/orders')) return { title: 'Orders Log', breadcrumb: 'Sales / Orders Log' };
    if (path.includes('/admin/customers')) return { title: 'Customers', breadcrumb: 'Users / Customer List' };
    if (path.includes('/admin/coupons')) return { title: 'Coupons', breadcrumb: 'Promotions / Coupons' };
    if (path.includes('/admin/reviews')) return { title: 'Reviews Moderation', breadcrumb: 'Feedback / Reviews' };
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
        backgroundColor: 'var(--admin-sidebar-bg)',
        color: 'var(--admin-text-secondary)',
        padding: '1.75rem 1.25rem',
        overflowY: 'auto'
      }}
    >
      <div>
        {/* Brand Logo Header */}
        <div style={{ marginBottom: '2rem', borderBottom: '1px solid var(--admin-border)', paddingBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-serif)', fontWeight: '900', letterSpacing: '0.06em', margin: 0, color: 'var(--admin-text-primary)' }}>
              MILASTY<span style={{ color: 'var(--admin-accent)' }}>.</span>
            </h2>
            <div style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--admin-text-muted)', fontWeight: '700', marginTop: '0.2rem' }}>
              Store Management
            </div>
          </div>
          <button 
            onClick={() => setMobileSidebarOpen(false)}
            style={{ background: 'none', border: 'none', color: 'var(--admin-text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0.2rem' }}
            className="admin-hamburger-btn"
          >
            <X size={18} />
          </button>
        </div>

        {/* Sidebar Nav Items */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {sections.map((section) => (
            <div key={section.title}>
              <h3 style={{ fontSize: '0.64rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--admin-text-muted)', fontWeight: '800', marginBottom: '0.65rem' }}>
                {section.title}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
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
                        padding: '0.6rem 0.85rem',
                        borderRadius: '8px',
                        fontSize: '0.82rem',
                        fontWeight: '700',
                        textDecoration: 'none',
                        color: active ? 'var(--admin-text-primary)' : 'var(--admin-text-secondary)',
                        backgroundColor: active ? 'rgba(143, 175, 91, 0.12)' : 'transparent',
                        borderLeft: active ? '3px solid var(--admin-accent)' : '3px solid transparent',
                        transition: 'all 0.2s ease',
                      }}
                      className="admin-sidebar-link"
                    >
                      <Icon size={15} color={active ? 'var(--admin-accent)' : 'var(--admin-text-muted)'} />
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
      <div style={{ borderTop: '1px solid var(--admin-border)', paddingTop: '1.25rem', marginTop: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
            <div 
              style={{ 
                width: '34px', 
                height: '34px', 
                borderRadius: '50%', 
                backgroundColor: 'rgba(255, 255, 255, 0.04)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: 'var(--admin-text-primary)',
                fontWeight: '800',
                fontSize: '0.85rem',
                border: '1px solid var(--admin-border)'
              }}
            >
              M
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--admin-text-primary)' }}>Milasty Admin</div>
              <div style={{ fontSize: '0.66rem', color: 'var(--admin-text-muted)', fontWeight: '600' }}>Store Manager</div>
            </div>
          </div>
          
          <button 
            onClick={logout} 
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'var(--admin-danger)', 
              cursor: 'pointer',
              padding: '0.4rem',
              display: 'flex',
              alignItems: 'center',
              borderRadius: '6px',
              transition: 'all 0.2s'
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
            backgroundColor: 'rgba(0, 0, 0, 0.65)', 
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
            backgroundColor: 'var(--admin-surface)', 
            borderBottom: '1px solid var(--admin-border)', 
            padding: '0.5rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '72px'
          }}
        >
          {/* Left: Mobile hamburger menu toggle & titles */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <button 
              onClick={() => setMobileSidebarOpen(true)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--admin-accent)',
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
              <span style={{ fontSize: '0.64rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--admin-text-muted)', letterSpacing: '0.05em', lineHeight: '1.2' }}>
                {pageBreadcrumb}
              </span>
              <h1 style={{ fontSize: 'clamp(1.15rem, 2.5vw, 1.4rem)', fontFamily: 'var(--font-serif)', color: 'var(--admin-text-primary)', fontWeight: '800', margin: 0, lineHeight: '1.2' }}>
                {pageTitle}
              </h1>
            </div>
          </div>

          {/* Right: Actions, notification bell, admin profile dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <Link 
              to="/" 
              style={{ 
                color: 'var(--admin-text-primary)', 
                fontSize: '0.74rem', 
                fontWeight: '700',
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.35rem', 
                textDecoration: 'none',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                backgroundColor: 'rgba(143, 175, 91, 0.1)',
                padding: '0.45rem 0.8rem',
                borderRadius: '6px',
                border: '1px solid rgba(143, 175, 91, 0.25)'
              }}
              className="desktop-links hover-scale"
            >
              <Globe size={13} />
              <span>View Store</span>
            </Link>

            {/* Notification bell button */}
            <button
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--admin-text-primary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.45rem',
                borderRadius: '8px',
                transition: 'background-color 0.2s'
              }}
              className="hover-scale"
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              title="Notifications"
            >
              <Bell size={15} />
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
                  padding: '0.3rem 0.6rem',
                  borderRadius: '8px',
                  backgroundColor: profileDropdownOpen ? 'rgba(255, 255, 255, 0.04)' : 'transparent',
                  transition: 'all 0.2s ease'
                }}
              >
                <div 
                  style={{ 
                    width: '32px', 
                    height: '32px', 
                    borderRadius: '50%', 
                    backgroundColor: 'rgba(143, 175, 91, 0.12)', 
                    color: 'var(--admin-accent)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    fontWeight: '800',
                    fontSize: '0.85rem',
                    border: '1.5px solid var(--admin-accent)'
                  }}
                >
                  M
                </div>
                <div className="desktop-links" style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--admin-text-primary)', lineHeight: '1.2' }}>
                    Milasty Admin
                  </span>
                  <span style={{ fontSize: '0.66rem', color: 'var(--admin-text-muted)', fontWeight: '600' }}>
                    Super Admin
                  </span>
                </div>
                <ChevronDown size={12} color="var(--admin-text-muted)" style={{ transform: profileDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </div>

              {/* Profile Dropdown Menu */}
              {profileDropdownOpen && (
                <div 
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: '220px',
                    backgroundColor: 'var(--admin-surface-elevated)',
                    border: '1px solid var(--admin-border)',
                    borderRadius: '12px',
                    padding: '0.4rem',
                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
                    zIndex: 200,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.2rem'
                  }}
                >
                  <div style={{ padding: '0.6rem 0.8rem', borderBottom: '1px solid var(--admin-border)', marginBottom: '0.25rem' }}>
                    <div style={{ fontWeight: '800', fontSize: '0.82rem', color: 'var(--admin-text-primary)' }}>Milasty Admin</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--admin-text-muted)', marginTop: '0.15rem' }}>admin@milasty.com</div>
                  </div>

                  <button 
                    onClick={() => { setProfileDropdownOpen(false); alert('Profile settings are synchronized with Supabase Auth.'); }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.6rem',
                      width: '100%',
                      padding: '0.55rem 0.8rem',
                      background: 'none',
                      border: 'none',
                      color: 'var(--admin-text-secondary)',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background-color 0.15s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <UserCheck size={14} color="var(--admin-accent)" />
                    <span>Profile Settings</span>
                  </button>

                  <button 
                    onClick={() => { setProfileDropdownOpen(false); alert('To change password, use Supabase Auth password reset flow.'); }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.6rem',
                      width: '100%',
                      padding: '0.55rem 0.8rem',
                      background: 'none',
                      border: 'none',
                      color: 'var(--admin-text-secondary)',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background-color 0.15s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <KeyRound size={14} color="var(--admin-accent-gold)" />
                    <span>Change Password</span>
                  </button>

                  <div style={{ borderTop: '1px solid var(--admin-border)', marginTop: '0.25rem', paddingTop: '0.25rem' }}>
                    <button 
                      onClick={() => { setProfileDropdownOpen(false); logout(); }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        width: '100%',
                        padding: '0.55rem 0.8rem',
                        background: 'none',
                        border: 'none',
                        color: 'var(--admin-danger)',
                        fontSize: '0.8rem',
                        fontWeight: '700',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background-color 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--admin-danger-bg)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <LogOut size={14} color="var(--admin-danger)" />
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

    </div>
  );
}
