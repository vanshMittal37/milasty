import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { ShoppingBag, Heart, User, Menu, X, ChevronDown, LogOut, ChevronRight, Home as HomeIcon, Leaf, Sparkles, Phone, Package, Instagram, Facebook, Youtube, Linkedin } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';

import ConfirmationModal from './ConfirmationModal';
import { useToast } from '../context/ToastContext';
import api from '../api/axios';

export default function Navbar() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const { cartItems, totalItemCount, isCartOpen, setIsCartOpen, mobileNavOpen, setMobileNavOpen, openCart, openNav } = useCart();
  const { wishlistCount } = useWishlist();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { toast } = useToast();
  const location = useLocation();

  const cartCount = totalItemCount || cartItems.length;
  const toggleCart = () => {
    if (isCartOpen) {
      setIsCartOpen(false);
    } else {
      openCart();
    }
  };

  const toggleMobileNav = () => {
    if (mobileNavOpen) {
      setMobileNavOpen(false);
    } else {
      openNav();
    }
  };

  // Promo state and showToast MUST be declared before any useEffect
  const [promos, setPromos] = useState([
    {
      code: 'WELCOME10',
      discountText: '10% OFF',
      minOrderAmount: 300,
    },
    {
      code: 'MILASTY100',
      discountText: '₹100 OFF',
      minOrderAmount: 500,
    },
  ]);
  const { showToast } = useCart();
  const accountMenuRef = useRef(null);
  const touchStartRef = useRef(null);

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

  // Prevent background scrolling when mobile menu drawer is open
  useEffect(() => {
    if (mobileNavOpen) {
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
    } else {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    }
    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };
  }, [mobileNavOpen]);

  const navLinks = [
    { name: 'Home', path: '/', icon: HomeIcon },
    { name: 'About', path: '/our-story', icon: Leaf },
    { name: 'Shop', path: '/shop', icon: ShoppingBag },
    { name: 'Nutrition', path: '/nutrition', icon: Sparkles },
    { name: 'Contact', path: '/contact', icon: Phone },
  ];

  // Get first letter of customer's name
  const firstLetter = isAuthenticated && user?.name ? user.name.charAt(0).toUpperCase() : 'A';

  // Dynamic Theme Styling
  const textThemeColor = '#FFFFFF';
  const textMutedThemeColor = 'rgba(255, 255, 255, 0.8)';

  useEffect(() => {
    const fetchPromo = async () => {
      try {
        const res = await api.get('/coupons/featured');
        if (res.data?.success && res.data?.promos && res.data.promos.length > 0) {
          setPromos(res.data.promos);
        } else if (res.data?.promo) {
          setPromos([res.data.promo]);
        }
      } catch (e) {}
    };
    fetchPromo();
  }, []);

  const handleCopyCoupon = (code, e) => {
    if (e) e.stopPropagation();
    if (!code) return;
    navigator.clipboard.writeText(code);
    if (showToast) {
      showToast(`✓ Coupon code ${code} copied!`);
    } else if (toast) {
      toast(`✓ Coupon code ${code} copied!`, 'success');
    }
  };

  return (
    <>
      {/* Top Fixed Main Navbar Wrapper (Announcement Bar + Site Header Fixed At Top) */}
      <div
        className="fixed-navbar-wrapper"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 500,
          width: '100%',
          boxSizing: 'border-box'
        }}
      >
        {/* Top Announcement Bar - Continuous Smooth Marquee */}
        <div 
          className="announcement-bar"
          style={{ 
            backgroundColor: '#1A0C05', 
            color: '#FCFAF6', 
            fontSize: '0.82rem', 
            padding: '0.55rem 0', 
            borderBottom: '1px solid rgba(255,255,255,0.08)', 
            position: 'relative',
            transition: 'background-color 0.35s ease',
            overflow: 'hidden',
            whiteSpace: 'nowrap'
          }}
        >
          <div className="announcement-marquee-track">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="announcement-marquee-content">
                <span>Handcrafted Millet Bakes • Pure Desi Ghee • Organic Jaggery</span>
                {promos && promos.length > 0 ? (
                  promos.map((p, idx) => (
                    <span 
                      key={idx} 
                      onClick={(e) => handleCopyCoupon(p.code, e)}
                      style={{ cursor: 'pointer' }}
                      title={`Click to copy code ${p.code}`}
                    >
                      <span> • Use code&nbsp;</span>
                      <strong style={{ color: '#b9cd94', textDecoration: 'underline' }}>{p.code}</strong>
                      <span>&nbsp;for {p.discountText}{p.minOrderAmount > 0 ? ` on orders above ₹${p.minOrderAmount}` : ''}</span>
                    </span>
                  ))
                ) : (
                  <span> • Special Offers Available</span>
                )}
              </div>
            ))}
          </div>
        </div>


        {/* Main Header Container */}
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
                  <ShoppingBag size={18} strokeWidth={2.4} color="#FFFFFF" stroke="#FFFFFF" style={{ color: '#FFFFFF', stroke: '#FFFFFF', display: 'block' }} />
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
                        width: 'min(250px, calc(100vw - 24px))',
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
                            <div style={{ fontWeight: '800', fontSize: '0.9rem', color: '#FFFDF9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {isAdmin ? 'MILASTY Admin' : user?.name}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#b9cd94', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '0.1rem' }}>
                              {user?.email} {isAdmin ? '(Admin)' : ''}
                            </div>
                          </div>

                          {isAdmin ? (
                            <>
                              <Link to="/admin/dashboard" onClick={() => setAccountMenuOpen(false)} style={{ display: 'block', padding: '0.65rem 1.1rem', fontSize: '0.86rem', color: '#b9cd94', fontWeight: '800' }}>
                                ★ Go to Admin Dashboard
                              </Link>
                            </>
                          ) : (
                            <>
                              <Link to="/account" onClick={() => setAccountMenuOpen(false)} style={{ display: 'block', padding: '0.65rem 1.1rem', fontSize: '0.86rem', color: '#F5EBDD', fontWeight: '500', transition: 'all 0.2s' }}>
                                My Dashboard &amp; Addresses
                              </Link>
                              <Link to="/account/orders" onClick={() => setAccountMenuOpen(false)} style={{ display: 'block', padding: '0.65rem 1.1rem', fontSize: '0.86rem', color: '#F5EBDD', fontWeight: '500', transition: 'all 0.2s' }}>
                                My Orders &amp; Tracking
                              </Link>
                              <Link to="/wishlist" onClick={() => setAccountMenuOpen(false)} style={{ display: 'block', padding: '0.65rem 1.1rem', fontSize: '0.86rem', color: '#F5EBDD', fontWeight: '500', transition: 'all 0.2s' }}>
                                My Wishlist
                              </Link>
                            </>
                          )}

                          <button
                            onClick={() => {
                              setAccountMenuOpen(false);
                              setShowLogoutModal(true);
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
                            Sign In / Login
                          </Link>
                          <Link to="/register" onClick={() => setAccountMenuOpen(false)} style={{ display: 'block', padding: '0.7rem 1.1rem', fontSize: '0.88rem', color: '#b9cd94', fontWeight: '600' }}>
                            Create New Account
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
              onClick={toggleMobileNav} 
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
              <Menu size={24} />
            </button>
          </div>
        </header>

        {/* Mobile Navigation Drawer Backdrop & Side Drawer rendered via React Portal into document.body */}
        {mobileNavOpen && createPortal(
          <div 
            onClick={() => setMobileNavOpen(false)}
            className="mobile-nav-backdrop"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100vw',
              height: '100vh',
              backgroundColor: 'rgba(25, 14, 8, 0.65)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
              zIndex: 999998,
              display: 'flex',
            }}
          >
            {/* Mobile Navigation Side Drawer — opens from LEFT */}
            <div 
              className="mobile-menu-panel open"
              onClick={(e) => e.stopPropagation()}
              onTouchStart={(e) => {
                const touch = e.touches[0];
                if (touch) {
                  touchStartRef.current = { x: touch.clientX, y: touch.clientY };
                }
              }}
              onTouchEnd={(e) => {
                if (!touchStartRef.current) return;
                const touch = e.changedTouches[0];
                if (touch) {
                  const diffX = touchStartRef.current.x - touch.clientX;
                  const diffY = Math.abs(touch.clientY - touchStartRef.current.y);
                  if (diffX > 50 && diffX > diffY * 1.5) {
                    setMobileNavOpen(false);
                  }
                }
                touchStartRef.current = null;
              }}
              style={{ 
                backgroundColor: '#FCF8F1',
                borderRight: '1.5px solid rgba(74, 48, 35, 0.18)',
                borderTopRightRadius: '24px',
                borderBottomRightRadius: '24px',
                boxShadow: '16px 0 48px rgba(25, 14, 8, 0.35)',
                position: 'fixed',
                top: 0,
                left: 0,
                bottom: 0,
                width: '85vw',
                maxWidth: '360px',
                height: '100vh',
                padding: '0',
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                zIndex: 999999,
                overflow: 'hidden',
              }}
            >
              {/* Subtle Corner Leaf Glow */}
              <div style={{
                position: 'absolute',
                bottom: '-20px',
                right: '-20px',
                width: '180px',
                height: '180px',
                backgroundImage: 'radial-gradient(circle, rgba(47, 125, 50, 0.12) 0%, transparent 70%)',
                borderRadius: '50%',
                pointerEvents: 'none',
                zIndex: 0,
              }} />

              {/* ── HEADER ── */}
              <div style={{
                padding: '1.4rem 1.4rem 1.2rem',
                borderBottom: '1.5px solid rgba(74, 48, 35, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: '#F7EBDD',
                flexShrink: 0,
                position: 'relative',
                zIndex: 2,
              }}>
                <div>
                  <Logo variant="dark" style={{ height: '40px', width: 'auto' }} />
                  <div style={{
                    fontSize: '0.75rem',
                    color: '#654B38',
                    marginTop: '0.2rem',
                    fontStyle: 'italic',
                    fontWeight: '600',
                    fontFamily: 'var(--font-serif), Georgia, serif'
                  }}>
                    Where Millets Meet Great Taste
                  </div>
                </div>
                <button
                  onClick={() => setMobileNavOpen(false)}
                  aria-label="Close Navigation Menu"
                  style={{
                    backgroundColor: '#EFE1CF',
                    border: '1.5px solid rgba(74, 48, 35, 0.18)',
                    color: '#3A241A',
                    width: '44px',
                    height: '44px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    flexShrink: 0,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* ── NAVIGATION LINKS (5 PRIMARY LINKS ONLY) ── */}
              <div style={{
                flexGrow: 1,
                overflowY: 'auto',
                padding: '1.25rem 1.2rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                position: 'relative',
                zIndex: 2
              }}>
                {navLinks.map((link) => {
                  const isActive = location.pathname === link.path;
                  const LinkIcon = link.icon || HomeIcon;
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      onClick={() => setMobileNavOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.9rem',
                        padding: '0.9rem 1.1rem',
                        borderRadius: '16px',
                        backgroundColor: isActive ? '#E8F2E8' : '#F5EBDD',
                        border: isActive ? '1.5px solid #2F7D32' : '1.5px solid rgba(74, 48, 35, 0.12)',
                        color: isActive ? '#2F7D32' : '#3A241A',
                        textDecoration: 'none',
                        transition: 'all 0.2s ease',
                        minHeight: '56px',
                        boxSizing: 'border-box',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '12px',
                        backgroundColor: isActive ? 'rgba(47, 125, 50, 0.18)' : '#EFE1CF',
                        border: isActive ? '1px solid rgba(47, 125, 50, 0.3)' : '1px solid rgba(74, 48, 35, 0.12)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <LinkIcon size={19} color={isActive ? '#2F7D32' : '#5C3A21'} />
                      </div>
                      <span style={{
                        fontWeight: isActive ? '800' : '700',
                        fontSize: '1.05rem',
                        fontFamily: 'var(--font-sans)',
                        flexGrow: 1,
                        lineHeight: '1.2',
                      }}>{link.name}</span>
                      <ChevronRight size={18} color={isActive ? '#2F7D32' : '#75675D'} />
                    </Link>
                  );
                })}
              </div>

              {/* ── BRAND MESSAGE CARD & SOCIAL FOOTER ── */}
              <div style={{
                padding: '1.2rem 1.2rem 1.5rem',
                borderTop: '1.5px solid rgba(74, 48, 35, 0.14)',
                backgroundColor: '#F7EBDD',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                flexShrink: 0,
                position: 'relative',
                zIndex: 2,
              }}>
                {/* Signature Brand Message Card */}
                <div style={{
                  padding: '1rem 1.15rem',
                  borderRadius: '18px',
                  backgroundColor: '#FCF8F1',
                  border: '1.5px solid rgba(74, 48, 35, 0.16)',
                  display: 'flex',
                  gap: '0.85rem',
                  alignItems: 'center',
                }}>
                  <div style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(47, 125, 50, 0.15)',
                    border: '1px solid rgba(47, 125, 50, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Leaf size={16} color="#2F7D32" />
                  </div>
                  <div style={{
                    fontSize: '0.88rem',
                    fontStyle: 'italic',
                    fontFamily: 'var(--font-serif), Georgia, serif',
                    color: '#3A241A',
                    lineHeight: '1.4',
                    fontWeight: '600'
                  }}>
                    Good food brings good people together.
                  </div>
                </div>

                {/* Social Media Buttons */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.85rem', paddingTop: '0.2rem' }}>
                  {[
                    { icon: Instagram, label: 'Instagram' },
                    { icon: Facebook, label: 'Facebook' },
                    { icon: Youtube, label: 'Youtube' },
                    { icon: Linkedin, label: 'Linkedin' }
                  ].map((soc, idx) => {
                    const SocIcon = soc.icon;
                    return (
                      <button
                        key={idx}
                        aria-label={soc.label}
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          backgroundColor: '#EFE1CF',
                          border: '1.5px solid rgba(74, 48, 35, 0.16)',
                          color: '#3A241A',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          padding: 0
                        }}
                      >
                        <SocIcon size={18} />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>

      <ConfirmationModal
        isOpen={showLogoutModal}
        title="Logout?"
        message="Are you sure you want to logout of your account?"
        confirmText="Logout"
        cancelText="Cancel"
        isDanger={true}
        onConfirm={() => {
          logout();
          setShowLogoutModal(false);
          toast.success('Logged out successfully.');
          navigate('/', { replace: true });
        }}
        onCancel={() => setShowLogoutModal(false)}
      />
    </>
  );
}
