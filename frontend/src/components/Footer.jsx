import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldCheck, MapPin, Phone, MessageSquare, Heart, Instagram, Facebook, Youtube, Linkedin } from 'lucide-react';
import Logo from './Logo';

export default function Footer() {
  const location = useLocation();

  return (
    <footer
      style={{
        position: 'relative',
        zIndex: 5,
        backgroundColor: '#29140C',
        color: '#F5EBDD',
        paddingTop: '4.5rem',
        paddingBottom: '0rem',
        marginTop: '0rem',
        borderTop: '1px solid rgba(245, 235, 221, 0.15)',
        boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.35)',
        transition: 'all 0.35s ease',
      }}
    >
      <div className="container" style={{ maxWidth: '1240px', margin: '0 auto', padding: '0 1.5rem' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '2.5rem',
            paddingBottom: '3rem',
            borderBottom: '1px solid rgba(245, 235, 221, 0.12)',
          }}
        >
          {/* Column 1: Brand Info */}
          <div>
            <Logo variant="emblem" style={{ height: '110px', width: 'auto', marginBottom: '1.25rem' }} />
            <p style={{ fontSize: '0.9rem', color: '#DCCBB7', marginBottom: '1.5rem', lineHeight: '1.75' }}>
              Where millets meet great taste. Healthy snacks baked in pure Desi Ghee and sweetened with organic Jaggery.
            </p>
            <p style={{ fontSize: '0.88rem', fontStyle: 'italic', color: '#D4AF37', fontWeight: '600' }}>"Desh Ka Millets, Desh Ki Sehat"</p>
          </div>

          {/* Columns 2 & 3: Quick Links & Customer Care */}
          <div className="footer-links-row">
            {/* Column 2: Quick Links */}
            <div>
              <h4 style={{ color: '#F5EBDD', marginBottom: '1.25rem', fontSize: '1.05rem', fontWeight: '800', letterSpacing: '0.04em' }}>Quick Links</h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem', padding: 0, margin: 0 }}>
                <li>
                  <Link to="/" style={{ color: '#E8D8C5', transition: 'color 0.2s', textDecoration: 'none' }} className="footer-link">
                    Home
                  </Link>
                </li>
                <li>
                  <Link to="/our-story" style={{ color: '#E8D8C5', transition: 'color 0.2s', textDecoration: 'none' }} className="footer-link">
                    Our Founder's Story
                  </Link>
                </li>
                <li>
                  <Link to="/shop" style={{ color: '#E8D8C5', transition: 'color 0.2s', textDecoration: 'none' }} className="footer-link">
                    Shop All Bakes
                  </Link>
                </li>
                <li>
                  <Link to="/nutrition" style={{ color: '#E8D8C5', transition: 'color 0.2s', textDecoration: 'none' }} className="footer-link">
                    Lab Reports & Nutrition
                  </Link>
                </li>
                <li>
                  <Link to="/contact" style={{ color: '#E8D8C5', transition: 'color 0.2s', textDecoration: 'none' }} className="footer-link">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link to="/admin" style={{ color: '#8FBA72', fontWeight: '700', transition: 'color 0.2s', textDecoration: 'none' }} className="footer-link">
                    Admin Dashboard
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Customer Care */}
            <div>
              <h4 style={{ color: '#F5EBDD', marginBottom: '1.25rem', fontSize: '1.05rem', fontWeight: '800', letterSpacing: '0.04em' }}>Customer Care</h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem', padding: 0, margin: 0 }}>
                <li>
                  <Link to="/terms" style={{ color: '#E8D8C5', transition: 'color 0.2s', textDecoration: 'none' }} className="footer-link">
                    Terms & Conditions
                  </Link>
                </li>
                <li>
                  <Link to="/privacy" style={{ color: '#E8D8C5', transition: 'color 0.2s', textDecoration: 'none' }} className="footer-link">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/refund" style={{ color: '#E8D8C5', transition: 'color 0.2s', textDecoration: 'none' }} className="footer-link">
                    Refund & Cancellation
                  </Link>
                </li>
                <li>
                  <Link to="/shipping" style={{ color: '#E8D8C5', transition: 'color 0.2s', textDecoration: 'none' }} className="footer-link">
                    Shipping & Delivery
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Column 4: Contact & FSSAI & Social Links */}
          <div>
            <h4 style={{ color: '#F5EBDD', marginBottom: '1.25rem', fontSize: '1.05rem', fontWeight: '800', letterSpacing: '0.04em' }}>Trust & Connect</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.9rem', color: '#DCCBB7' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={18} color="#D4AF37" />
                <span>FSSAI Lic No: 22724105001223</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MapPin size={18} color="#D4AF37" />
                <span>Greater Noida, UP - 201306, India</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MessageSquare size={18} color="#D4AF37" />
                <span>WhatsApp Desk: +91 89271 42056</span>
              </div>
              
              {/* Social Media Links */}
              <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(245, 235, 221, 0.12)' }}>
                <span style={{ fontSize: '0.82rem', color: '#D4AF37', fontWeight: '700', display: 'block', marginBottom: '0.6rem', letterSpacing: '0.05em' }}>Follow Our Journey</span>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <a href="https://instagram.com/milasty" target="_blank" rel="noopener noreferrer" aria-label="Instagram" style={{ color: '#F5EBDD', backgroundColor: 'rgba(255,255,255,0.08)', padding: '0.45rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease', border: '1px solid rgba(245,235,221,0.2)' }} onMouseOver={(e) => { e.currentTarget.style.color = '#8FBA72'; e.currentTarget.style.borderColor = '#8FBA72'; }} onMouseOut={(e) => { e.currentTarget.style.color = '#F5EBDD'; e.currentTarget.style.borderColor = 'rgba(245,235,221,0.2)'; }}>
                    <Instagram size={17} />
                  </a>
                  <a href="https://facebook.com/milasty" target="_blank" rel="noopener noreferrer" aria-label="Facebook" style={{ color: '#F5EBDD', backgroundColor: 'rgba(255,255,255,0.08)', padding: '0.45rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease', border: '1px solid rgba(245,235,221,0.2)' }} onMouseOver={(e) => { e.currentTarget.style.color = '#8FBA72'; e.currentTarget.style.borderColor = '#8FBA72'; }} onMouseOut={(e) => { e.currentTarget.style.color = '#F5EBDD'; e.currentTarget.style.borderColor = 'rgba(245,235,221,0.2)'; }}>
                    <Facebook size={17} />
                  </a>
                  <a href="https://youtube.com/@milasty" target="_blank" rel="noopener noreferrer" aria-label="YouTube" style={{ color: '#F5EBDD', backgroundColor: 'rgba(255,255,255,0.08)', padding: '0.45rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease', border: '1px solid rgba(245,235,221,0.2)' }} onMouseOver={(e) => { e.currentTarget.style.color = '#8FBA72'; e.currentTarget.style.borderColor = '#8FBA72'; }} onMouseOut={(e) => { e.currentTarget.style.color = '#F5EBDD'; e.currentTarget.style.borderColor = 'rgba(245,235,221,0.2)'; }}>
                    <Youtube size={17} />
                  </a>
                  <a href="https://linkedin.com/company/milasty" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" style={{ color: '#F5EBDD', backgroundColor: 'rgba(255,255,255,0.08)', padding: '0.45rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease', border: '1px solid rgba(245,235,221,0.2)' }} onMouseOver={(e) => { e.currentTarget.style.color = '#8FBA72'; e.currentTarget.style.borderColor = '#8FBA72'; }} onMouseOut={(e) => { e.currentTarget.style.color = '#F5EBDD'; e.currentTarget.style.borderColor = 'rgba(245,235,221,0.2)'; }}>
                    <Linkedin size={17} />
                  </a>
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
            fontSize: '0.85rem',
            color: '#DCCBB7',
          }}
        >
          <div>© {new Date().getFullYear()} MILASTY Foods Private Limited. All Rights Reserved.</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span>Crafted with</span>
            <Heart size={13} color="#E06D53" fill="#E06D53" />
            <span>in pure Desi Ghee & Organic Jaggery</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
