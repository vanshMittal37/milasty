import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldCheck, MapPin, Phone, MessageSquare, Heart } from 'lucide-react';
import Logo from './Logo';

export default function Footer() {
  const location = useLocation();
  const transparentPages = ['/', '/our-story', '/products', '/shop', '/catalogue', '/nutrition', '/contact', '/wishlist'];
  const isTransparentPage = transparentPages.includes(location.pathname);

  return (
    <footer
      className={isTransparentPage ? 'transparent-blurred-footer' : ''}
      style={{
        position: 'relative',
        zIndex: 5,
        backgroundColor: isTransparentPage ? 'rgba(18, 9, 4, 0.30)' : 'rgba(20, 10, 5, 0.75)',
        backdropFilter: isTransparentPage ? 'blur(30px) saturate(150%)' : 'blur(24px)',
        WebkitBackdropFilter: isTransparentPage ? 'blur(30px) saturate(150%)' : 'blur(24px)',
        color: '#FFFDF9',
        paddingTop: '5rem',
        paddingBottom: '2.5rem',
        marginTop: '0rem',
        borderTop: isTransparentPage ? '1px solid rgba(255, 255, 255, 0.20)' : '1px solid rgba(245, 220, 180, 0.18)',
        boxShadow: isTransparentPage ? '0 -10px 40px rgba(0, 0, 0, 0.25)' : 'none',
        transition: 'all 0.35s ease',
      }}
    >
      <div className="container">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '2.5rem',
            paddingBottom: '3rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
          }}
        >
          {/* Column 1: Brand Info */}
          <div>
            <Logo variant="emblem" style={{ height: '110px', width: 'auto', marginBottom: '1.25rem' }} />
            <p style={{ fontSize: '0.88rem', color: 'rgba(252, 250, 246, 0.75)', marginBottom: '1.5rem', lineHeight: '1.75' }}>
              Where millets meet great taste. Healthy snacks baked in pure Desi Ghee and sweetened with organic Jaggery.
            </p>
            <p style={{ fontSize: '0.85rem', fontStyle: 'italic', color: 'var(--accent-gold)' }}>"Desh Ka Millets, Desh Ki Sehat"</p>
          </div>

          {/* Columns 2 & 3: Quick Links & Customer Care grouped for 2-column side-by-side layout on mobile */}
          <div className="footer-links-row">
            {/* Column 2: Quick Links */}
            <div>
              <h4 style={{ color: 'var(--bg-main)', marginBottom: '1.25rem', fontSize: '1rem', fontWeight: '600' }}>Quick Links</h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.88rem' }}>
                <li>
                  <Link to="/" style={{ color: 'rgba(252, 250, 246, 0.75)', transition: 'color 0.2s' }} className="footer-link">
                    Home
                  </Link>
                </li>
                <li>
                  <Link to="/our-story" style={{ color: 'rgba(252, 250, 246, 0.75)', transition: 'color 0.2s' }} className="footer-link">
                    Our Founder's Story
                  </Link>
                </li>
                <li>
                  <Link to="/shop" style={{ color: 'rgba(252, 250, 246, 0.75)', transition: 'color 0.2s' }} className="footer-link">
                    Shop All Bakes
                  </Link>
                </li>
                <li>
                  <Link to="/nutrition" style={{ color: 'rgba(252, 250, 246, 0.75)', transition: 'color 0.2s' }} className="footer-link">
                    Lab Reports & Nutrition
                  </Link>
                </li>
                <li>
                  <Link to="/contact" style={{ color: 'rgba(252, 250, 246, 0.75)', transition: 'color 0.2s' }} className="footer-link">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link to="/admin" style={{ color: 'var(--accent-gold)', fontWeight: '600', transition: 'color 0.2s' }} className="footer-link">
                    Admin Dashboard
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Customer Care */}
            <div>
              <h4 style={{ color: 'var(--bg-main)', marginBottom: '1.25rem', fontSize: '1rem', fontWeight: '600' }}>Customer Care</h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.88rem' }}>
                <li>
                  <Link to="/terms" style={{ color: 'rgba(252, 250, 246, 0.75)', transition: 'color 0.2s' }} className="footer-link">
                    Terms & Conditions
                  </Link>
                </li>
                <li>
                  <Link to="/privacy" style={{ color: 'rgba(252, 250, 246, 0.75)', transition: 'color 0.2s' }} className="footer-link">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/refund" style={{ color: 'rgba(252, 250, 246, 0.75)', transition: 'color 0.2s' }} className="footer-link">
                    Refund & Cancellation
                  </Link>
                </li>
                <li>
                  <Link to="/shipping" style={{ color: 'rgba(252, 250, 246, 0.75)', transition: 'color 0.2s' }} className="footer-link">
                    Shipping & Delivery
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Column 4: Contact & FSSAI */}
          <div>
            <h4 style={{ color: 'var(--bg-main)', marginBottom: '1.25rem', fontSize: '1rem', fontWeight: '600' }}>Trust & Connect</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.88rem', color: 'rgba(252, 250, 246, 0.75)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={18} color="var(--accent-gold)" />
                <span>FSSAI Lic No: 22724105001223</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MapPin size={18} color="var(--accent-gold)" />
                <span>Greater Noida, UP - 201306, India</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MessageSquare size={18} color="var(--accent-gold)" />
                <span>WhatsApp Desk: +91 89271 42056</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div
          style={{
            paddingTop: '2.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            fontSize: '0.85rem',
            color: 'rgba(252, 250, 246, 0.5)',
          }}
        >
          <div>© {new Date().getFullYear()} MILASTY Foods Private Limited. All Rights Reserved.</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span>Crafted with</span>
            <Heart size={13} color="var(--accent-terracotta)" fill="var(--accent-terracotta)" />
            <span>in pure Desi Ghee & Jaggery</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
