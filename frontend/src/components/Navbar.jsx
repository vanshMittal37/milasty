import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag, Heart, User, Menu, X, ChevronDown, LogOut } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';

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
      {/* Top Announcement Bar */}
      <div 
        style={{ 
          backgroundColor: isHome ? 'transparent' : '#1A0C05', 
          color: '#FCFAF6', 
          fontSize: '0.82rem', 
          padding: '0.55rem 0', 
          textAlign: 'center', 
          fontWeight: '500', 
          letterSpacing: '0.05em', 
          borderBottom: '1px solid rgba(255,255,255,0.08)', 
          zIndex: 101, 
          position: 'relative',
          transition: 'background-color 0.35s ease'
        }}
      >
        <span>Handcrafted Millet Bakes • Pure Desi Ghee • Organic Jaggery • Use code </span>
        <strong style={{ color: 'var(--accent-gold)' }}>WELCOME10</strong>
        <span> for 10% OFF</span>
      </div>

      {/* Main Sticky 100% Full-Width Navbar Container */}
      <div 
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
          style={{
            width: '100%',
            maxWidth: '100%',
            margin: 0,
            borderRadius: 0,
            backgroundColor: !isHome || scrolled ? '#241209' : 'transparent',
            backdropFilter: !isHome || scrolled ? 'blur(12px)' : 'none',
            WebkitBackdropFilter: !isHome || scrolled ? 'blur(12px)' : 'none',
            borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: !isHome || scrolled ? '0 10px 30px rgba(0, 0, 0, 0.35)' : 'none',
            transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: scrolled || !isHome ? '64px' : '76px', maxWidth: '100%', padding: '0 2.5rem', transition: 'height 0.35s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            
            {/* Logo */}
            <Link to="/" style={{ display: 'flex', alignItems: 'center', transition: 'opacity 0.2s' }} className="hover-scale">
              <span style={{ fontSize: '1.65rem', fontFamily: 'var(--font-serif)', fontWeight: '900', color: textThemeColor, letterSpacing: '0.08em', transition: 'color 0.35s ease' }}>
                MILASTY<span style={{ color: 'var(--accent-gold)' }}>.</span>
              </span>
            </Link>

            {/* Navigation Links - Center */}
            <nav className="desktop-links" style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path;
                const isRitual = link.name === 'Rituals';
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    style={{
                      fontSize: isRitual ? '0.78rem' : '0.82rem',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: isActive ? 'var(--accent-gold)' : textMutedThemeColor,
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
                          backgroundColor: 'var(--accent-gold)',
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              
              {/* Wishlist Link */}
              <Link 
                to="/wishlist" 
                style={{ 
                  fontSize: '0.82rem', 
                  fontWeight: '700', 
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: textThemeColor, 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.4rem',
                  transition: 'color 0.35s ease' 
                }} 
                className="desktop-links hover-scale"
              >
                <Heart size={18} strokeWidth={2} />
                <span>Wishlist ({wishlistCount})</span>
              </Link>

              {/* Cart Button */}
              <button 
                onClick={toggleCart} 
                className="btn-primary" 
                style={{ 
                  padding: '0.55rem 1.25rem', 
                  fontSize: '0.8rem', 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.05em', 
                  backgroundColor: '#c89b3c', 
                  color: '#FFFFFF',
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.4rem',
                  border: 'none',
                  fontWeight: '800',
                  transition: 'all 0.35s ease'
                }}
              >
                <ShoppingBag size={16} />
                <span>Cart</span>
                <span 
                  style={{ 
                    backgroundColor: '#241209', 
                    color: '#c89b3c', 
                    padding: '0.15rem 0.45rem', 
                    borderRadius: '999px', 
                    fontSize: '0.75rem', 
                    fontWeight: '900',
                    transition: 'all 0.35s ease'
                  }}
                >
                  {cartCount}
                </span>
              </button>

              {/* Account Dropdown Toggle */}
              <div style={{ position: 'relative' }} ref={accountMenuRef}>
                <button
                  onClick={() => setAccountMenuOpen(!accountMenuOpen)}
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
                  <ChevronDown size={14} />
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
              className="mobile-toggle" 
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
        {mobileMenuOpen && (
          <div 
            className="animate-slide-down-mobile"
            style={{ 
              backgroundColor: '#FFFFFF', 
              border: '1.5px solid var(--border-color)', 
              boxShadow: 'var(--shadow-lg)',
              position: 'absolute',
              top: 'calc(100% + 4px)',
              left: '1.5rem',
              right: '1.5rem',
              zIndex: 99,
              padding: '1.5rem',
              display: 'flex', 
              flexDirection: 'column', 
              gap: '1rem',
              borderRadius: '20px',
              maxHeight: 'calc(100vh - 120px)',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path;
                return (
                  <Link 
                    key={link.path} 
                    to={link.path} 
                    onClick={() => setMobileMenuOpen(false)} 
                    style={{ 
                      fontSize: '1.05rem', 
                      fontWeight: isActive ? '700' : '500', 
                      color: isActive ? 'var(--primary-dark)' : 'var(--text-muted)',
                      padding: '0.75rem 0',
                      borderBottom: '1px solid var(--border-color)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <span>{link.name}</span>
                    {isActive && <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--accent-gold)' }} />}
                  </Link>
                );
              })}
            </div>

            {/* Mobile Account / Auth links */}
            <div style={{ marginTop: '0.5rem', backgroundColor: 'var(--bg-subtle)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
              {isAuthenticated ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Logged in as: <strong style={{ color: 'var(--primary-dark)' }}>{user?.name}</strong></div>
                  <Link to="/account" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '0.9rem', color: 'var(--primary-dark)', fontWeight: '600' }}>My Dashboard</Link>
                  <Link to="/account/orders" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '0.9rem', color: 'var(--primary-dark)', fontWeight: '600' }}>My Orders</Link>
                  {isAdmin && <Link to="/admin/dashboard" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '0.9rem', color: 'var(--accent-olive)', fontWeight: '700' }}>★ Admin Panel</Link>}
                  <button 
                    onClick={() => { logout(); setMobileMenuOpen(false); }} 
                    style={{ background: 'none', color: 'var(--accent-terracotta)', fontSize: '0.9rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.5rem 0 0', borderTop: '1px solid var(--border-color)', width: '100%', cursor: 'pointer' }}
                  >
                    <LogOut size={15} />
                    <span>Logout</span>
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)} style={{ display: 'block', padding: '0.95rem 0', fontSize: '0.95rem', color: 'var(--primary-dark)', fontWeight: '700' }}>Customer Login</Link>
                  <Link to="/register" onClick={() => setMobileMenuOpen(false)} style={{ display: 'block', padding: '0.9rem 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Create New Account</Link>
                  <Link to="/admin/login" onClick={() => setMobileMenuOpen(false)} style={{ display: 'block', padding: '0.85rem 0', fontSize: '0.85rem', color: 'var(--accent-gold)', fontWeight: '700', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem', marginTop: '0.25rem' }}>Admin Portal Login</Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
