import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag, Heart, User, Menu, X, ChevronDown, LogOut } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  const { cartItems, totalItemCount, isCartOpen, setIsCartOpen } = useCart();
  const { wishlistCount } = useWishlist();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const location = useLocation();

  const cartCount = totalItemCount || cartItems.length;
  const toggleCart = () => setIsCartOpen(!isCartOpen);

  const accountMenuRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target)) {
        setAccountMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/our-story' },
    { name: 'Rituals', path: '/products' },
    { name: 'Shop', path: '/shop' },
    { name: 'Nutrition', path: '/nutrition' },
    { name: 'Contact', path: '/contact' },
  ];

  // Get first letter of customer's name
  const firstLetter = isAuthenticated && user?.name ? user.name.charAt(0).toUpperCase() : 'A';

  // Dynamic Theme Styling
  const isHome = location.pathname === '/';
  const textThemeColor = '#FFFFFF';
  const textMutedThemeColor = 'rgba(255, 255, 255, 0.8)';
  const borderThemeColor = 'rgba(255, 255, 255, 0.15)';

  return (
    <>
      {/* Top Announcement Bar - Continuous Smooth Marquee */}
      <div 
        className="announcement-bar"
        style={{ 
          backgroundColor: '#1A0C05', 
          color: '#FCFAF6', 
          fontSize: '0.82rem', 
          padding: '0.55rem 0', 
          borderBottom: '1px solid rgba(255,255,255,0.08)', 
          zIndex: 101, 
          position: 'relative',
          transition: 'background-color 0.35s ease',
          overflow: 'hidden',
          whiteSpace: 'nowrap'
        }}
      >
        <div className="announcement-marquee-track">
          <div className="announcement-marquee-content">
            <span>Handcrafted Millet Bakes • Pure Desi Ghee • Organic Jaggery • Use code&nbsp;</span>
            <strong style={{ color: '#b9cd94' }}>WELCOME10</strong>
            <span>&nbsp;for 10% OFF</span>
          </div>
          <div className="announcement-marquee-content">
            <span>Handcrafted Millet Bakes • Pure Desi Ghee • Organic Jaggery • Use code&nbsp;</span>
            <strong style={{ color: '#b9cd94' }}>WELCOME10</strong>
            <span>&nbsp;for 10% OFF</span>
          </div>
          <div className="announcement-marquee-content">
            <span>Handcrafted Millet Bakes • Pure Desi Ghee • Organic Jaggery • Use code&nbsp;</span>
            <strong style={{ color: '#b9cd94' }}>WELCOME10</strong>
            <span>&nbsp;for 10% OFF</span>
          </div>
          <div className="announcement-marquee-content">
            <span>Handcrafted Millet Bakes • Pure Desi Ghee • Organic Jaggery • Use code&nbsp;</span>
            <strong style={{ color: '#b9cd94' }}>WELCOME10</strong>
            <span>&nbsp;for 10% OFF</span>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <div 
        onClick={() => setMobileMenuOpen(false)}
        className="mobile-menu-overlay"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100vh',
          backgroundColor: 'rgba(20, 10, 5, 0.55)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 98,
          opacity: mobileMenuOpen ? 1 : 0,
          pointerEvents: mobileMenuOpen ? 'auto' : 'none',
          visibility: mobileMenuOpen ? 'visible' : 'hidden',
          transition: 'opacity 250ms ease, visibility 250ms step-end',
          overflow: 'hidden'
        }}
      />

      {/* Main Sticky 100% Full-Width Navbar Container */}
      <div 
        className="sticky-navbar"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          width: '100%',
          padding: 0,
          transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <header
          className="site-header"
          style={{
            width: '100%',
            maxWidth: '100%',
            margin: 0,
            borderRadius: 0,
            backgroundColor: '#241209',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.35)',
            transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <div className="container header-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: scrolled ? '70px' : '82px', maxWidth: '100%', padding: '0 2.5rem', transition: 'height 0.35s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            
            {/* Logo Left */}
            <Link to="/" style={{ display: 'flex', alignItems: 'center', transition: 'opacity 0.2s' }} className="hover-scale site-logo">
              <Logo variant="primary" style={{ height: '46px', width: 'auto' }} className="mobile-logo-adjust" />
            </Link>

            {/* Right Container holding Nav Links & Action Dock */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '2.5rem' }}>

              {/* Navigation Links - Shifted Right */}
              <nav className="desktop-links" style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                {navLinks.map((link) => {
                  const isActive = location.pathname === link.path;
                  const isRitual = link.name === 'Rituals';
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      style={{
                        fontSize: isRitual ? '0.82rem' : '0.86rem',
                        fontWeight: '800',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        color: isActive ? '#b9cd94' : textMutedThemeColor,
                        position: 'relative',
                        padding: '0.4rem 0',
                        transition: 'color 0.35s ease',
                      }}
                      className="nav-hover-link"
                    >
                      {link.name}
                      {isActive && (
                        <span
                          style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            width: '100%',
                            height: '2px',
                            backgroundColor: '#b9cd94',
                            borderRadius: '2px',
                            transition: 'background-color 0.35s ease',
                          }}
                        />
                      )}
                    </Link>
                  );
                })}
              </nav>

              {/* Action Dock - Right */}
              <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                
                {/* Wishlist Link - Icon Only with Badge */}
                <Link 
                  to="/wishlist" 
                  aria-label="Wishlist"
                  style={{ 
                    position: 'relative',
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: textThemeColor, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    transition: 'all 0.25s ease' 
                  }} 
                  className="desktop-links hover-scale"
                >
                  <Heart size={19} strokeWidth={2.2} />
                  {wishlistCount > 0 && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '-2px',
                        right: '-2px',
                        fontSize: '0.65rem',
                        lineHeight: 1,
                        minWidth: '16px',
                        height: '16px',
                        padding: '0 4px',
                        borderRadius: '999px',
                        backgroundColor: '#244f21',
                        color: '#FFFDF9',
                        border: '1.5px solid #b9cd94',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '900',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.4)',
                        boxSizing: 'border-box'
                      }}
                    >
                      {wishlistCount}
                    </span>
                  )}
                </Link>

                {/* Cart Button - Icon Only with Badge */}
                <button 
                  onClick={toggleCart} 
                  aria-label="Shopping Cart"
                  className="btn-primary cart-button" 
                  style={{ 
                    position: 'relative',
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    padding: 0,
                    backgroundColor: '#244f21', 
                    color: '#FFFFFF',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    border: '1px solid #b9cd94',
                    cursor: 'pointer',
                    transition: 'all 0.25s ease'
                  }}
                >
                  <ShoppingBag size={19} strokeWidth={2.2} />
                  <span 
                    className="cart-badge"
                    style={{ 
                      position: 'absolute',
                      top: '-2px',
                      right: '-2px',
                      fontSize: '0.65rem',
                      lineHeight: 1,
                      minWidth: '16px',
                      height: '16px',
                      padding: '0 4px',
                      borderRadius: '999px',
                      backgroundColor: '#244f21',
                      color: '#FFFDF9',
                      border: '1.5px solid #b9cd94',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '900',
                      boxShadow: '0 2px 5px rgba(0,0,0,0.4)',
                      boxSizing: 'border-box'
                    }}
                  >
                    {cartCount}
                  </span>
                </button>

                {/* Account Dropdown Toggle */}
              <div style={{ position: 'relative' }} ref={accountMenuRef} className="account-menu-wrapper">
                <button
                  onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                  className="account-button"
                  style={{ 
                    background: 'none', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem', 
                    color: textThemeColor, 
                    cursor: 'pointer',
                    transition: 'color 0.35s ease'
                  }}
                >
                  {/* Circular letter avatar or user icon */}
                  {isAuthenticated ? (
                    <div 
                      style={{ 
                        width: '32px', 
                        height: '32px', 
                        borderRadius: '50%', 
                        backgroundColor: '#FFFFFF', 
                        color: '#241209', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        fontSize: '0.9rem',
                        fontWeight: '800',
                        border: '1.5px solid var(--accent-gold)',
                        transition: 'all 0.35s ease'
                      }}
                    >
                      {firstLetter}
                    </div>
                  ) : (
                    <div 
                      style={{ 
                        width: '32px', 
                        height: '32px', 
                        borderRadius: '50%', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        border: '1.5px solid rgba(255, 255, 255, 0.4)',
                        color: textThemeColor,
                        transition: 'all 0.35s ease'
                      }}
                    >
                      <User size={14} />
                    </div>
                  )}
                  
                  <span className="desktop-links" style={{ fontSize: '0.82rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {isAuthenticated ? user?.name?.split(' ')[0] : 'Account'}
                  </span>
                  <span className="desktop-links" style={{ display: 'inline-flex', alignItems: 'center' }}>
                    <ChevronDown size={14} />
                  </span>
                </button>

                {accountMenuOpen && (
                  <div
                    className="glass-card animate-slide-up"
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: 'calc(100% + 12px)',
                      width: '220px',
                      backgroundColor: '#FFFFFF',
                      padding: '0.75rem 0',
                      zIndex: 200,
                      boxShadow: 'var(--shadow-lg)',
                      borderRadius: 'var(--radius-md)',
                      border: '1.5px solid var(--border-color)',
                      textAlign: 'left'
                    }}
                  >
                    {isAuthenticated ? (
                      <>
                        <div style={{ padding: '0.5rem 1.25rem 0.75rem', borderBottom: '1px solid var(--border-color)' }}>
                          <div style={{ fontWeight: '700', fontSize: '0.88rem', color: 'var(--primary-dark)' }}>{user?.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user?.email}</div>
                        </div>
                        <Link to="/account" onClick={() => setAccountMenuOpen(false)} style={{ display: 'block', padding: '0.6rem 1.25rem', fontSize: '0.88rem', color: 'var(--primary-dark)' }}>
                          My Dashboard & Addresses
                        </Link>
                        <Link to="/account/orders" onClick={() => setAccountMenuOpen(false)} style={{ display: 'block', padding: '0.6rem 1.25rem', fontSize: '0.88rem', color: 'var(--primary-dark)' }}>
                          My Orders & Tracking
                        </Link>
                        {isAdmin && (
                          <Link to="/admin/dashboard" onClick={() => setAccountMenuOpen(false)} style={{ display: 'block', padding: '0.6rem 1.25rem', fontSize: '0.88rem', color: 'var(--accent-olive)', fontWeight: '700' }}>
                            ★ Admin Management Panel
                          </Link>
                        )}
                        <button
                          onClick={() => {
                            logout();
                            setAccountMenuOpen(false);
                          }}
                          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', textAlign: 'left', padding: '0.6rem 1.25rem', fontSize: '0.88rem', color: 'var(--accent-terracotta)', background: 'none', borderTop: '1px solid var(--border-color)', marginTop: '0.35rem', fontWeight: '700', cursor: 'pointer' }}
                        >
                          <LogOut size={14} />
                          <span>Logout</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <Link to="/login" onClick={() => setAccountMenuOpen(false)} style={{ display: 'block', padding: '0.65rem 1.25rem', fontSize: '0.88rem', color: 'var(--primary-dark)', fontWeight: '600' }}>
                          Customer Login
                        </Link>
                        <Link to="/register" onClick={() => setAccountMenuOpen(false)} style={{ display: 'block', padding: '0.65rem 1.25rem', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                          Create New Account
                        </Link>
                        <Link to="/admin/login" onClick={() => setAccountMenuOpen(false)} style={{ display: 'block', padding: '0.65rem 1.25rem', fontSize: '0.85rem', color: 'var(--accent-gold)', fontWeight: '700', borderTop: '1px solid var(--border-color)', marginTop: '0.35rem' }}>
                          Admin Portal Login
                        </Link>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Hamburger Toggle */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
              className="mobile-toggle mobile-toggle-btn" 
              style={{ 
                background: 'none', 
                color: textThemeColor, 
                display: 'flex', 
                alignItems: 'center', 
                padding: '0.25rem',
                transition: 'color 0.35s ease'
              }}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        <div 
          className={`mobile-menu-panel ${mobileMenuOpen ? 'open' : ''}`}
          style={{ 
            backgroundColor: 'rgba(35, 21, 13, 0.97)', /* Deep Warm Chocolate */
            backgroundImage: 'linear-gradient(135deg, rgba(35, 21, 13, 0.98) 0%, rgba(20, 10, 5, 0.99) 100%)',
            border: '1.5px solid rgba(200, 155, 60, 0.28)', /* Thin Muted Gold Border */
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.55)',
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: '12px',
            right: '12px',
            width: 'calc(100% - 24px)',
            margin: '0 auto',
            zIndex: 99,
            padding: '1.75rem 1.5rem',
            display: 'flex', 
            flexDirection: 'column', 
            gap: '1.5rem',
            borderRadius: '24px',
            maxHeight: 'calc(100vh - 120px)',
            overflowY: 'auto',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            opacity: mobileMenuOpen ? 1 : 0,
            transform: mobileMenuOpen ? 'translateY(0)' : 'translateY(-12px)',
            pointerEvents: mobileMenuOpen ? 'auto' : 'none',
            visibility: mobileMenuOpen ? 'visible' : 'hidden',
            transition: 'opacity 300ms ease, transform 300ms cubic-bezier(0.16, 1, 0.3, 1), visibility 300ms step-end'
          }}
        >
          {/* Header Inside Menu */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.10)', paddingBottom: '1rem' }}>
            <Logo variant="primary" style={{ height: '30px', width: 'auto' }} />
            <button
              onClick={() => setMobileMenuOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.8)',
                width: '44px',
                height: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                padding: 0
              }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {navLinks.map((link, idx) => {
              const isActive = location.pathname === link.path;
              const formattedIdx = String(idx + 1).padStart(2, '0');
              return (
                <Link 
                  key={link.path} 
                  to={link.path} 
                  onClick={() => setMobileMenuOpen(false)} 
                  style={{ 
                    fontSize: '1.2rem', 
                    fontFamily: 'var(--font-serif)',
                    fontWeight: '800', 
                    color: isActive ? 'var(--accent-gold)' : '#FCFAF6',
                    padding: '0.85rem 0',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    textDecoration: 'none',
                    transition: 'all 0.25s ease'
                  }}
                  className="mobile-nav-row"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--accent-gold)', opacity: 0.75, fontFamily: 'var(--font-sans)', fontWeight: '700' }}>
                      {formattedIdx}
                    </span>
                    <span>{link.name.toUpperCase()}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {isActive ? (
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--accent-gold)' }} />
                    ) : (
                      <span className="arrow-indicator" style={{ fontSize: '1rem', opacity: 0.4, transition: 'transform 0.2s ease', color: '#FFFFFF' }}>→</span>
                    )}
                  </div>
                </Link>
              );
            })}

            {/* Wishlist Link inside mobile menu */}
            <Link 
              to="/wishlist" 
              onClick={() => setMobileMenuOpen(false)} 
              style={{ 
                fontSize: '1.2rem', 
                fontFamily: 'var(--font-serif)',
                fontWeight: '800', 
                color: location.pathname === '/wishlist' ? 'var(--accent-gold)' : '#FCFAF6',
                padding: '0.85rem 0',
                borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                textDecoration: 'none',
                transition: 'all 0.25s ease'
              }}
              className="mobile-nav-row"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--accent-gold)', opacity: 0.75, fontFamily: 'var(--font-sans)', fontWeight: '700' }}>
                  07
                </span>
                <span>WISHLIST</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {location.pathname === '/wishlist' ? (
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--accent-gold)' }} />
                ) : wishlistCount > 0 ? (
                  <span 
                    style={{ 
                      backgroundColor: 'var(--accent-gold)', 
                      color: 'var(--primary-dark)', 
                      padding: '0.15rem 0.45rem', 
                      borderRadius: '999px', 
                      fontSize: '0.72rem', 
                      fontWeight: '900' 
                    }}
                  >
                    {wishlistCount}
                  </span>
                ) : (
                  <span className="arrow-indicator" style={{ fontSize: '1rem', opacity: 0.4, color: '#FFFFFF' }}>→</span>
                )}
              </div>
            </Link>
          </div>

          {/* Mobile Account / Auth links */}
          <div style={{ marginTop: '0.5rem', backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)', padding: '1.25rem', borderRadius: '18px' }}>
            <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: '800', letterSpacing: '0.1em', color: 'var(--accent-gold)', textTransform: 'uppercase', marginBottom: '0.85rem' }}>
              CUSTOMER ACCOUNT
            </span>
            {isAuthenticated ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ fontSize: '0.82rem', color: 'rgba(252, 250, 246, 0.7)' }}>Logged in as: <strong style={{ color: '#FFFFFF' }}>{user?.name}</strong></div>
                <Link to="/account" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '0.9rem', color: '#FFFFFF', fontWeight: '700', textDecoration: 'none' }}>My Dashboard</Link>
                <Link to="/account/orders" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '0.9rem', color: '#FFFFFF', fontWeight: '700', textDecoration: 'none' }}>My Orders</Link>
                {isAdmin && <Link to="/admin/dashboard" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '0.9rem', color: 'var(--accent-gold)', fontWeight: '800', textDecoration: 'none' }}>★ Admin Panel</Link>}
                <button 
                  onClick={() => { logout(); setMobileMenuOpen(false); }} 
                  style={{ background: 'none', color: '#c8503c', fontSize: '0.9rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.75rem 0 0', borderTop: '1px solid rgba(255, 255, 255, 0.08)', width: '100%', cursor: 'pointer', borderLeft: 'none', borderRight: 'none', borderBottom: 'none' }}
                >
                  <LogOut size={15} />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <Link to="/login" onClick={() => setMobileMenuOpen(false)} style={{ display: 'block', fontSize: '0.9rem', color: '#FFFFFF', fontWeight: '750', textDecoration: 'none' }}>Sign In</Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)} style={{ display: 'block', fontSize: '0.9rem', color: 'rgba(252, 250, 246, 0.75)', fontWeight: '600', textDecoration: 'none' }}>Create New Account</Link>
                <Link to="/admin/login" onClick={() => setMobileMenuOpen(false)} style={{ display: 'block', fontSize: '0.85rem', color: 'var(--accent-gold)', fontWeight: '800', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '0.75rem', marginTop: '0.25rem', textDecoration: 'none' }}>Admin Portal Login</Link>
              </div>
            )}
          </div>
        </div>
    </>
  );
}
