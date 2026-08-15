import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { 
  LayoutDashboard, Package, Tags, ShoppingCart, Users, Ticket, Star, 
  LogOut, ArrowLeft, Menu, Bell, User, ChevronRight, Globe
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AdminLayout() {
  const { isAuthenticated, isAdmin, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Securely protect layout from unauthenticated access in useEffect
  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      navigate('/admin/login');
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

  // Helper to determine active route title
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
        background: 'linear-gradient(180deg, #381423 0%, #200812 100%)', // Brand Deep Plum Gradient
        color: '#FFFFFF',
        padding: '2rem 1.5rem',
        overflowY: 'auto'
      }}
    >
      <div>
        {/* Brand Logo Header */}
        <div style={{ marginBottom: '2.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.65rem', fontFamily: 'var(--font-serif)', fontWeight: '900', letterSpacing: '0.08em', margin: 0, color: '#FFFFFF' }}>
            MILASTY<span style={{ color: 'var(--accent-gold)' }}>.</span>
          </h2>
          <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent-gold)', fontWeight: '800', marginTop: '0.2rem' }}>
            Store Management
          </div>
        </div>

        {/* Sidebar Nav Items */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          {sections.map((section) => (
            <div key={section.title}>
              <h3 style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255, 255, 255, 0.4)', fontWeight: '800', marginBottom: '0.75rem' }}>
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
                        padding: '0.7rem 1rem',
                        borderRadius: '10px',
                        fontSize: '0.85rem',
                        fontWeight: '700',
                        textDecoration: 'none',
                        color: active ? '#FFFFFF' : 'rgba(255, 255, 255, 0.75)',
                        backgroundColor: active ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                        borderLeft: active ? '3.5px solid var(--accent-gold)' : '3.5px solid transparent',
                        transition: 'all 0.2s ease',
                      }}
                      className="admin-sidebar-link"
                    >
                      <Icon size={16} color={active ? 'var(--accent-gold)' : 'rgba(255, 255, 255, 0.75)'} />
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
      <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '1.5rem', marginTop: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div 
              style={{ 
                width: '38px', 
                height: '38px', 
                borderRadius: '50%', 
                backgroundColor: 'rgba(255,255,255,0.1)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: 'var(--accent-gold)',
                fontWeight: '800',
                fontSize: '0.95rem',
                border: '1px solid rgba(255,255,255,0.2)'
              }}
            >
              M
            </div>
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: '800', color: '#FFFFFF' }}>Milasty Admin</div>
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', fontWeight: '600' }}>Store Manager</div>
            </div>
          </div>
          
          <button 
            onClick={logout} 
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'rgba(255, 255, 255, 0.6)', 
              cursor: 'pointer',
              padding: '0.4rem',
              display: 'flex',
              alignItems: 'center',
              borderRadius: '6px',
              transition: 'color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-terracotta)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)'}
            title="Log Out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ backgroundColor: '#F8F5F0', minHeight: '100vh', display: 'flex' }}>
      
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
          MOBILE SIDEBAR DRAWER (Collapsible overlay)
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
            backgroundColor: 'rgba(56, 20, 35, 0.4)', 
            zIndex: 1000,
            backdropFilter: 'blur(2px)'
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
          zIndex: 1001, 
          transform: mobileSidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          height: '100vh',
          overflowY: 'auto'
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
            backgroundColor: 'rgba(248, 245, 240, 0.96)', 
            backdropFilter: 'blur(10px)',
            borderBottom: '1.5px solid var(--border-color)', 
            padding: '1rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '70px'
          }}
        >
          {/* Left: Mobile hamburger menu toggle & titles */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button 
              onClick={() => setMobileSidebarOpen(true)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary-dark)',
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
            
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
                {pageBreadcrumb}
              </span>
              <h1 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-serif)', color: 'var(--primary-dark)', fontWeight: '800', margin: 0 }}>
                {pageTitle}
              </h1>
            </div>
          </div>

          {/* Right: Actions, admin profile view */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <Link 
              to="/" 
              style={{ 
                color: 'var(--text-muted)', 
                fontSize: '0.8rem', 
                fontWeight: '750',
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.35rem', 
                textDecoration: 'none',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                backgroundColor: 'rgba(56, 20, 35, 0.03)',
                padding: '0.45rem 0.95rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)'
              }}
              className="desktop-links hover-scale"
            >
              <Globe size={13} />
              <span>View Website</span>
            </Link>

            {/* Notification bell button */}
            <button
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.45rem',
                borderRadius: '8px',
                transition: 'background-color 0.2s'
              }}
              className="hover-scale"
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(56, 20, 35, 0.03)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              title="Notifications"
            >
              <Bell size={16} />
            </button>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div 
                style={{ 
                  width: '34px', 
                  height: '34px', 
                  borderRadius: '50%', 
                  backgroundColor: 'var(--primary-dark)', 
                  color: '#FFFFFF', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontWeight: '800',
                  fontSize: '0.85rem',
                  border: '1.5px solid var(--accent-gold)'
                }}
              >
                M
              </div>
              <div className="desktop-links" style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: '800', color: 'var(--primary-dark)', lineHeight: '1.2' }}>
                  Milasty Admin
                </span>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                  Store Manager
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* WORKSPACE AREA */}
        <main 
          style={{ 
            flexGrow: 1, 
            padding: '2.5rem 1.5rem',
            maxWidth: '1400px',
            width: '100%',
            margin: '0 auto'
          }}
          className="admin-workspace-area"
        >
          <style>{`
            @media (min-width: 768px) {
              .admin-workspace-area {
                padding: 3rem 2rem !important;
              }
            }
          `}</style>
          <Outlet />
        </main>
      </div>

    </div>
  );
}
