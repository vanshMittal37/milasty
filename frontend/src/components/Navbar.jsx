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

  // Prevent background scrolling when mobile menu dropdown is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/our-story' },
    { name: 'Shop', path: '/shop' },
    { name: 'Nutrition', path: '/nutrition' },
    { name: 'Contact', path: '/contact' },
  ];

  // Get first letter of customer's name
  const firstLetter = isAuthenticated && user?.name ? user.name.charAt(0).toUpperCase() : 'A';

  // Dynamic Theme Styling
  const textThemeColor = '#FFFFFF';
  const textMutedThemeColor = 'rgba(255, 255, 255, 0.8)';

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
          <div 
            className="header-container" 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              height: scrolled ? '82px' : '98px', 
              width: '100%', 
              maxWidth: '100%',
              paddingLeft: 'clamp(24px, 4vw, 64px)', 
              paddingRight: 'clamp(24px, 4vw, 64px)',
              boxSizing: 'border-box',
              transition: 'height 0.35s cubic-bezier(0.16, 1, 0.3, 1)' 
            }}
          >
            
            {/* LEFT: Logo (Increased Size) */}
            <Link 
              to="/" 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                transition: 'opacity 0.2s' 
              }} 
              className="hover-scale site-logo"
            >
              <Logo variant="primary" style={{ height: scrolled ? '78px' : '96px', width: 'auto', transition: 'height 0.35s ease' }} className="mobile-logo-adjust" />
            </Link>

            {/* RIGHT: Navigation Links + Action Controls Grouped Together */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '2.5rem' }}>
              
              {/* Navigation Links - Right Aligned */}
              <nav 
                className="desktop-links" 
                style={{ 
                  display: 'flex', 
                  gap: '2rem', 
                  alignItems: 'center' 
                }}
              >
                {navLinks.map((link) => {
                  const isActive = location.pathname === link.path;
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      style={{
                        fontSize: '0.86rem',
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

              {/* Action Dock (Wishlist, Cart, Profile) */}
              <div 
                className="header-actions" 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '1rem' 
                }}
              >
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
                      className="account-dropdown-menu animate-slide-up"
                      style={{
                        position: 'absolute',
                        right: 0,
                        top: 'calc(100% + 12px)',
                        width: 'min(240px, calc(100vw - 24px))',
                        backgroundColor: 'rgba(28, 14, 9, 0.95)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        padding: '0.65rem 0',
                        zIndex: 9999,
                        boxShadow: '0 16px 40px rgba(0, 0, 0, 0.50)',
                        borderRadius: '16px',
                        border: '1px solid rgba(245, 220, 180, 0.22)',
                        textAlign: 'left',
                        boxSizing: 'border-box',
                      }}
                    >
                      {isAuthenticated ? (
                        <>
                          <div style={{ padding: '0.65rem 1.1rem 0.65rem', borderBottom: '1px solid rgba(245, 220, 180, 0.15)' }}>
                            <div style={{ fontWeight: '800', fontSize: '0.9rem', color: '#FFFDF9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
                            <div style={{ fontSize: '0.75rem', color: '#b9cd94', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '0.1rem' }}>{user?.email}</div>
                          </div>
                          <Link to="/account" onClick={() => setAccountMenuOpen(false)} style={{ display: 'block', padding: '0.65rem 1.1rem', fontSize: '0.86rem', color: '#F5EBDD', fontWeight: '500', transition: 'all 0.2s' }}>
                            My Dashboard &amp; Addresses
                          </Link>
                          <Link to="/account/orders" onClick={() => setAccountMenuOpen(false)} style={{ display: 'block', padding: '0.65rem 1.1rem', fontSize: '0.86rem', color: '#F5EBDD', fontWeight: '500', transition: 'all 0.2s' }}>
                            My Orders &amp; Tracking
                          </Link>
                          <Link to="/wishlist" onClick={() => setAccountMenuOpen(false)} style={{ display: 'block', padding: '0.65rem 1.1rem', fontSize: '0.86rem', color: '#F5EBDD', fontWeight: '500', transition: 'all 0.2s' }}>
                            My Wishlist
                          </Link>
                          {isAdmin && (
                            <Link to="/admin/dashboard" onClick={() => setAccountMenuOpen(false)} style={{ display: 'block', padding: '0.65rem 1.1rem', fontSize: '0.86rem', color: '#b9cd94', fontWeight: '800' }}>
                              ★ Admin Panel
                            </Link>
                          )}
                          <button
                            onClick={() => {
                              logout();
                              setAccountMenuOpen(false);
                            }}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', textAlign: 'left', padding: '0.65rem 1.1rem', fontSize: '0.86rem', color: '#e57373', background: 'none', border: 'none', borderTop: '1px solid rgba(245, 220, 180, 0.15)', marginTop: '0.35rem', fontWeight: '700', cursor: 'pointer' }}
                          >
                            <LogOut size={14} />
                            <span>Logout</span>
                          </button>
                        </>
                      ) : (
                        <>
                          <Link to="/login" onClick={() => setAccountMenuOpen(false)} style={{ display: 'block', padding: '0.7rem 1.1rem', fontSize: '0.88rem', color: '#FFFDF9', fontWeight: '700' }}>
                            Customer Login
                          </Link>
                          <Link to="/register" onClick={() => setAccountMenuOpen(false)} style={{ display: 'block', padding: '0.7rem 1.1rem', fontSize: '0.88rem', color: '#b9cd94', fontWeight: '600' }}>
                            Create New Account
                          </Link>
                          <Link to="/admin/login" onClick={() => setAccountMenuOpen(false)} style={{ display: 'block', padding: '0.65rem 1.1rem', fontSize: '0.82rem', color: '#E8DCCB', fontWeight: '700', borderTop: '1px solid rgba(245, 220, 180, 0.15)', marginTop: '0.35rem' }}>
                            Admin Portal Login
                          </Link>
                        </>
                      )}
                    </div>
                  )}
                </div>
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
            backgroundColor: 'rgba(35, 21, 13, 0.97)',
            backgroundImage: 'linear-gradient(135deg, rgba(35, 21, 13, 0.98) 0%, rgba(20, 10, 5, 0.99) 100%)',
            border: '1.5px solid rgba(200, 155, 60, 0.28)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.55)',
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: '12px',
            right: '12px',
            borderRadius: '24px',
            padding: '1.75rem 1.5rem 2rem',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
            zIndex: 99,
            transition: 'transform 300ms cubic-bezier(0.16, 1, 0.3, 1), opacity 300ms ease, visibility 300ms step-end',
            transform: mobileMenuOpen ? 'translateY(0) scale(1)' : 'translateY(-12px) scale(0.97)',
            opacity: mobileMenuOpen ? 1 : 0,
            visibility: mobileMenuOpen ? 'visible' : 'hidden',
            pointerEvents: mobileMenuOpen ? 'auto' : 'none'
          }}
        >
          {/* Mobile Drawer Content */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#b9cd94', fontWeight: '800', marginBottom: '0.5rem' }}>Navigation</span>
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    fontSize: '1.1rem',
                    fontWeight: '800',
                    fontFamily: 'var(--font-serif)',
                    color: isActive ? '#b9cd94' : '#FFFDF9',
                    padding: '0.65rem 0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    textDecoration: 'none',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
                  }}
                >
                  <span>{link.name}</span>
                  {isActive && <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#b9cd94' }} />}
                </Link>
              );
            })}
          </div>

          {/* Quick Account / Wishlist actions in mobile menu */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.12)' }}>
            <Link 
              to="/wishlist" 
              onClick={() => setMobileMenuOpen(false)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#F5EBDD', fontSize: '0.92rem', fontWeight: '700', textDecoration: 'none' }}
            >
              <Heart size={18} color="#b9cd94" />
              <span>My Wishlist ({wishlistCount})</span>
            </Link>
            
            {isAuthenticated ? (
              <Link 
                to="/account" 
                onClick={() => setMobileMenuOpen(false)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#F5EBDD', fontSize: '0.92rem', fontWeight: '700', textDecoration: 'none' }}
              >
                <User size={18} color="#b9cd94" />
                <span>My Dashboard ({user?.name})</span>
              </Link>
            ) : (
              <Link 
                to="/login" 
                onClick={() => setMobileMenuOpen(false)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#b9cd94', fontSize: '0.92rem', fontWeight: '800', textDecoration: 'none' }}
              >
                <User size={18} color="#b9cd94" />
                <span>Sign In / Register</span>
              </Link>
            )}
          </div>

        </div>
      </div>
    </>
  );
}
