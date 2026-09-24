import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, MapPin, MessageSquare, Heart, Instagram, Facebook, Youtube, Linkedin } from 'lucide-react';
import Logo from './Logo';

export default function Footer() {
  return (
    <footer
      className="milasty-footer"
      style={{
        position: 'relative',
        zIndex: 5,
        backgroundColor: '#2A140D',
        color: '#F3E7D8',
        paddingTop: '4rem',
        paddingBottom: '0rem',
        marginTop: '0rem',
        borderTop: '1px solid rgba(248, 235, 221, 0.15)',
        boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.35)',
        transition: 'all 0.35s ease',
      }}
    >
      <div className="container" style={{ maxWidth: '1240px', margin: '0 auto', padding: '0 1.5rem' }}>
        <div
          className="footer-grid-layout"
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr)',
            gap: '2.5rem',
            paddingBottom: '3.5rem',
            borderBottom: '1px solid rgba(248, 235, 221, 0.12)',
          }}
        >
          {/* Column 1: Brand Info (40%) */}
          <div style={{ paddingRight: '1rem' }}>
            <Logo variant="emblem" style={{ height: '100px', width: 'auto', marginBottom: '1.25rem' }} />
            <p style={{ fontSize: '1rem', color: '#D8C6B4', marginBottom: '1.25rem', lineHeight: '1.65', maxWidth: '380px' }}>
              Where millets meet great taste. Healthy snacks baked in pure Desi Ghee and sweetened with organic Jaggery.
            </p>
            <p style={{ fontSize: '0.95rem', fontStyle: 'italic', color: '#B7D99F', fontWeight: '600' }}>
              "Desh Ka Millets, Desh Ki Sehat"
            </p>
          </div>

          {/* Column 2: Quick Links (20%) */}
          <div>
            <h4
              style={{
                color: '#F8EBDD',
                marginBottom: '1.25rem',
                fontSize: '1.05rem',
                fontWeight: '700',
                letterSpacing: '0.02em',
                textTransform: 'uppercase'
              }}
            >
              Quick Links
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.8rem', fontSize: '0.98rem', padding: 0, margin: 0 }}>
              <li>
                <Link to="/" style={{ color: '#D8C6B4', transition: 'color 180ms ease', textDecoration: 'none' }} className="footer-link">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/our-story" style={{ color: '#D8C6B4', transition: 'color 180ms ease', textDecoration: 'none' }} className="footer-link">
                  Our Founder's Story
                </Link>
              </li>
              <li>
                <Link to="/shop" style={{ color: '#D8C6B4', transition: 'color 180ms ease', textDecoration: 'none' }} className="footer-link">
                  Shop All Bakes
                </Link>
              </li>
              <li>
                <Link to="/nutrition" style={{ color: '#D8C6B4', transition: 'color 180ms ease', textDecoration: 'none' }} className="footer-link">
                  Lab Reports & Nutrition
                </Link>
              </li>
              <li>
                <Link to="/contact" style={{ color: '#D8C6B4', transition: 'color 180ms ease', textDecoration: 'none' }} className="footer-link">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/admin" style={{ color: '#9BCB88', fontWeight: '700', transition: 'color 180ms ease', textDecoration: 'none' }} className="footer-link">
                  Admin Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Customer Care (20%) */}
          <div>
            <h4
              style={{
                color: '#F8EBDD',
                marginBottom: '1.25rem',
                fontSize: '1.05rem',
                fontWeight: '700',
                letterSpacing: '0.02em',
                textTransform: 'uppercase'
              }}
            >
              Customer Care
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.8rem', fontSize: '0.98rem', padding: 0, margin: 0 }}>
              <li>
                <Link to="/terms" style={{ color: '#D8C6B4', transition: 'color 180ms ease', textDecoration: 'none' }} className="footer-link">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link to="/privacy" style={{ color: '#D8C6B4', transition: 'color 180ms ease', textDecoration: 'none' }} className="footer-link">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/refund" style={{ color: '#D8C6B4', transition: 'color 180ms ease', textDecoration: 'none' }} className="footer-link">
                  Refund & Cancellation
                </Link>
              </li>
              <li>
                <Link to="/shipping" style={{ color: '#D8C6B4', transition: 'color 180ms ease', textDecoration: 'none' }} className="footer-link">
                  Shipping & Delivery
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Trust & Connect (20%) */}
          <div>
            <h4
              style={{
                color: '#F8EBDD',
                marginBottom: '1.25rem',
                fontSize: '1.05rem',
                fontWeight: '700',
                letterSpacing: '0.02em',
                textTransform: 'uppercase'
              }}
            >
              Trust & Connect
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.95rem', fontSize: '0.95rem', color: '#D8C6B4' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <ShieldCheck size={18} color="#9BCB88" style={{ flexShrink: 0 }} />
                <span>FSSAI Lic No: 22724105001223</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <MapPin size={18} color="#9BCB88" style={{ flexShrink: 0 }} />
                <span>Greater Noida, UP - 201306, India</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <MessageSquare size={18} color="#9BCB88" style={{ flexShrink: 0 }} />
                <span>WhatsApp Desk: +91 89271 42056</span>
              </div>

              {/* Social Media Links */}
              <div style={{ marginTop: '0.85rem', paddingTop: '0.85rem', borderTop: '1px solid rgba(248, 235, 221, 0.12)' }}>
                <span style={{ fontSize: '0.82rem', color: '#9BCB88', fontWeight: '700', display: 'block', marginBottom: '0.6rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  Follow Our Journey
                </span>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  {[
                    { icon: Instagram, label: 'Instagram', href: 'https://instagram.com/milasty' },
                    { icon: Facebook, label: 'Facebook', href: 'https://facebook.com/milasty' },
                    { icon: Youtube, label: 'YouTube', href: 'https://youtube.com/@milasty' },
                    { icon: Linkedin, label: 'LinkedIn', href: 'https://linkedin.com/company/milasty' }
                  ].map((soc, idx) => {
                    const SocIcon = soc.icon;
                    return (
                      <a
                        key={idx}
                        href={soc.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={soc.label}
                        style={{
                          color: '#F8EBDD',
                          backgroundColor: 'rgba(255,255,255,0.08)',
                          padding: '0.45rem',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s ease',
                          border: '1px solid rgba(248,235,221,0.2)',
                          width: '36px',
                          height: '36px',
                          boxSizing: 'border-box'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.color = '#9BCB88';
                          e.currentTarget.style.borderColor = '#9BCB88';
                          e.currentTarget.style.backgroundColor = 'rgba(155, 203, 136, 0.12)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.color = '#F8EBDD';
                          e.currentTarget.style.borderColor = 'rgba(248,235,221,0.2)';
                          e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)';
                        }}
                      >
                        <SocIcon size={17} />
                      </a>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Bottom Bar */}
      <div style={{ backgroundColor: '#1F0E07', padding: '1.5rem 0', marginTop: '0' }}>
        <div
          className="container"
          style={{
            maxWidth: '1240px',
            margin: '0 auto',
            padding: '0 1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            fontSize: '0.88rem',
            color: '#D8C6B4',
          }}
        >
          <div>© {new Date().getFullYear()} MILASTY Foods Private Limited. All Rights Reserved.</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span>Crafted with</span>
            <Heart size={14} color="#E06D53" fill="#E06D53" />
            <span>in pure Desi Ghee & Organic Jaggery</span>
          </div>
        </div>
      </div>

      <style>{`
        .footer-link:hover {
          color: #9BCB88 !important;
        }
        @media (max-width: 1024px) {
          .footer-grid-layout {
            grid-template-columns: 1fr 1fr !important;
            gap: 2rem !important;
          }
        }
        @media (max-width: 640px) {
          .footer-grid-layout {
            grid-template-columns: 1fr !important;
            gap: 2.25rem !important;
          }
        }
      `}</style>
    </footer>
  );
}
