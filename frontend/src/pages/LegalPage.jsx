import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  ShieldCheck, 
  Truck, 
  RotateCcw, 
  FileText, 
  Leaf, 
  MessageSquare, 
  Cookie, 
  AlertTriangle, 
  Heart, 
  Baby, 
  Clock, 
  Scale, 
  Sparkles,
  CheckCircle2,
  PhoneCall,
  Lock,
  FileSpreadsheet,
  Megaphone,
  UserCheck,
  Globe2,
  Package,
  Camera,
  CreditCard,
  XCircle,
  PackageX,
  AlertCircle,
  MapPin,
  Smartphone,
  Shield,
  Archive,
  ArrowRight,
  PackageCheck
} from 'lucide-react';

export default function LegalPage() {
  const location = useLocation();
  const path = location.pathname;

  // Active section state for legal page side navigation
  const [activeSection, setActiveSection] = useState('coverage');

  // WhatsApp Link Helper
  const whatsappNumber = "918927142056";
  const getWhatsappUrl = (topic) => {
    const msg = encodeURIComponent(`Hi MILASTY! I have a question regarding your ${topic}.`);
    return `https://wa.me/${whatsappNumber}?text=${msg}`;
  };

  const scrollToSection = (id) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      const offset = 90;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  // ========================================================
  // 1. REDESIGNED SHIPPING & DELIVERY POLICY COMPONENT
  // ========================================================
  const renderShippingPolicy = () => {
    const shippingSections = [
      { id: 'coverage', label: '1. Shipping Coverage', icon: Package },
      { id: 'dispatch-timeline', label: '2. Dispatch Timeline', icon: Clock },
      { id: 'estimated-delivery', label: '3. Estimated Delivery', icon: Truck },
      { id: 'address-contact', label: '4. Address & Contact', icon: MapPin },
      { id: 'tracking-info', label: '5. Tracking Info', icon: Smartphone },
      { id: 'packaging-safety', label: '6. Packaging & Safety', icon: Shield },
      { id: 'damaged-packages', label: '7. Damaged Packages', icon: AlertTriangle },
      { id: 'storage-instructions', label: '8. Storage Tips', icon: Archive },
      { id: 'rto-attempts', label: '9. Delivery & RTO', icon: PackageX },
      { id: 'shipping-support', label: '10. Shipping Support', icon: PhoneCall },
    ];

    return (
      <div style={{ position: 'relative' }}>
        {/* HERO SECTION */}
        <section 
          className="reveal-fade-up"
          style={{
            padding: '4.5rem 1.25rem 3rem',
            textAlign: 'center',
            maxWidth: '850px',
            margin: '0 auto',
            position: 'relative'
          }}
        >
          {/* Eyebrow badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.4rem 1rem',
            borderRadius: '999px',
            backgroundColor: 'rgba(185, 205, 148, 0.15)',
            border: '1px solid rgba(185, 205, 148, 0.35)',
            marginBottom: '1.25rem'
          }}>
            <Truck size={14} color="#b9cd94" />
            <span style={{
              fontSize: '0.75rem',
              fontWeight: '800',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: '#b9cd94'
            }}>
              POLICY • MILASTY
            </span>
          </div>

          <h1 
            className="font-serif"
            style={{ 
              fontSize: 'clamp(2.2rem, 5vw, 3.6rem)',
              color: '#F5EBDD',
              lineHeight: '1.15',
              marginBottom: '1rem',
              letterSpacing: '-0.01em'
            }}
          >
            Shipping & Delivery Policy
          </h1>

          <p style={{
            fontSize: 'clamp(1rem, 2vw, 1.2rem)',
            color: '#E8DCCB',
            opacity: 0.9,
            maxWidth: '620px',
            margin: '0 auto 1.5rem',
            lineHeight: '1.6'
          }}>
            Freshly packed MILASTY cookies delivered across India 🚚🍪
          </p>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.85rem',
            color: 'rgba(232, 220, 203, 0.75)',
            backgroundColor: 'rgba(50, 26, 18, 0.5)',
            padding: '0.35rem 0.9rem',
            borderRadius: '999px',
            border: '1px solid rgba(245, 235, 221, 0.15)'
          }}>
            <Clock size={14} color="#b9cd94" />
            <span>Last Updated: January 2026</span>
          </div>
        </section>

        {/* MAIN CONTENT CONTAINER */}
        <div 
          className="container" 
          style={{ 
            maxWidth: '1180px', 
            margin: '0 auto', 
            padding: '0 1.25rem 6rem',
            position: 'relative' 
          }}
        >
          <div 
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr)',
              gap: '2.5rem',
              alignItems: 'start'
            }}
            className="tc-layout-grid"
          >
            {/* STICKY SIDE NAVIGATION (DESKTOP) */}
            <aside 
              style={{
                position: 'sticky',
                top: '100px',
                backgroundColor: 'rgba(35, 21, 13, 0.65)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                borderRadius: '20px',
                border: '1px solid rgba(245, 220, 180, 0.22)',
                padding: '1.25rem 1rem',
                boxShadow: '0 12px 32px rgba(0, 0, 0, 0.35)',
                display: 'none'
              }}
              className="tc-sticky-nav"
            >
              <div style={{
                fontSize: '0.75rem',
                fontWeight: '800',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: '#b9cd94',
                marginBottom: '1rem',
                paddingLeft: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}>
                <Sparkles size={14} color="#b9cd94" />
                <span>On This Page</span>
              </div>
              
              <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {shippingSections.map((sec) => {
                  const IconComp = sec.icon;
                  const isActive = activeSection === sec.id;
                  return (
                    <button
                      key={sec.id}
                      onClick={() => scrollToSection(sec.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.65rem',
                        padding: '0.6rem 0.75rem',
                        borderRadius: '10px',
                        fontSize: '0.85rem',
                        fontWeight: isActive ? '700' : '500',
                        color: isActive ? '#FFFFFF' : 'rgba(232, 220, 203, 0.8)',
                        backgroundColor: isActive ? '#244f21' : 'transparent',
                        textAlign: 'left',
                        width: '100%',
                        border: 'none',
                        transition: 'all 0.2s ease',
                        cursor: 'pointer'
                      }}
                    >
                      <IconComp size={15} color={isActive ? '#b9cd94' : 'rgba(185, 205, 148, 0.7)'} />
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {sec.label}
                      </span>
                    </button>
                  );
                })}
              </nav>
            </aside>

            {/* MAIN SECTIONS DOCUMENT */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              {/* DECORATIVE PROCESS TIMELINE */}
              <div 
                className="glass-card reveal-fade-up"
                style={{ padding: 'clamp(1.25rem, 3vw, 1.75rem)' }}
              >
                <div style={{
                  fontSize: '0.75rem',
                  fontWeight: '800',
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  color: '#b9cd94',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}>
                  <Truck size={14} color="#b9cd94" />
                  <span>MILASTY Fresh Delivery Journey</span>
                </div>

                <div className="shipping-process-flow">
                  {[
                    { step: "01", title: "Order Confirmed", desc: "Small-batch scheduled" },
                    { step: "02", title: "Fresh Prepared", desc: "1–2 Days Baking" },
                    { step: "03", title: "Dispatched", desc: "Courier handover" },
                    { step: "04", title: "In Transit", desc: "Live WhatsApp tracking" },
                    { step: "05", title: "Delivered", desc: "3–7 Business Days" }
                  ].map((st, i, arr) => (
                    <React.Fragment key={st.step}>
                      <div className="shipping-step-card">
                        <span style={{ fontSize: '0.7rem', fontWeight: '800', color: '#b9cd94', backgroundColor: 'rgba(185,205,148,0.15)', padding: '0.15rem 0.5rem', borderRadius: '999px' }}>
                          STEP {st.step}
                        </span>
                        <strong style={{ fontSize: '0.9rem', color: '#F5EBDD', lineHeight: '1.2' }}>{st.title}</strong>
                        <span style={{ fontSize: '0.78rem', color: '#E8DCCB', opacity: 0.85 }}>{st.desc}</span>
                      </div>
                      {i < arr.length - 1 && (
                        <ArrowRight size={16} color="rgba(185, 205, 148, 0.6)" className="shipping-step-arrow" style={{ flexShrink: 0 }} />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* SECTION 1: SHIPPING COVERAGE */}
              <div 
                id="coverage" 
                className="glass-card reveal-fade-up"
                style={{ padding: 'clamp(1.5rem, 4vw, 2.5rem)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(185, 205, 148, 0.15)',
                    border: '1px solid rgba(185, 205, 148, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Package size={22} color="#b9cd94" />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#b9cd94', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Section 01</span>
                    <h2 className="font-serif" style={{ fontSize: 'clamp(1.3rem, 3vw, 1.75rem)', color: '#F5EBDD', margin: 0 }}>
                      Shipping Coverage
                    </h2>
                  </div>
                </div>

                <p style={{ color: '#E8DCCB', lineHeight: '1.75', fontSize: '1rem', marginBottom: '1.25rem' }}>
                  At MILASTY, we believe in serving you the freshest millet bakes. All products are baked in small, artisanal batches upon order confirmation and shipped through verified courier partners.
                </p>

                {/* Highlight Card */}
                <div style={{
                  backgroundColor: 'rgba(185, 205, 148, 0.12)',
                  borderLeft: '4px solid #b9cd94',
                  borderRadius: '14px',
                  padding: '1.1rem 1.35rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem'
                }}>
                  <CheckCircle2 size={20} color="#b9cd94" style={{ flexShrink: 0 }} />
                  <span style={{ color: '#F5EBDD', fontWeight: '650', fontSize: '0.95rem', lineHeight: '1.5' }}>
                    Pan-India delivery available (subject to courier serviceability).
                  </span>
                </div>
              </div>

              {/* SECTION 2: DISPATCH TIMELINE */}
              <div 
                id="dispatch-timeline" 
                className="glass-card reveal-fade-up"
                style={{ padding: 'clamp(1.5rem, 4vw, 2.5rem)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(185, 205, 148, 0.15)',
                    border: '1px solid rgba(185, 205, 148, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Clock size={22} color="#b9cd94" />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#b9cd94', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Section 02</span>
                    <h2 className="font-serif" style={{ fontSize: 'clamp(1.3rem, 3vw, 1.75rem)', color: '#F5EBDD', margin: 0 }}>
                      Dispatch Timeline
                    </h2>
                  </div>
                </div>

                <p style={{ color: '#E8DCCB', lineHeight: '1.75', fontSize: '1rem', marginBottom: '1.25rem' }}>
                  Orders are freshly prepared and dispatched within <strong style={{ color: '#b9cd94', fontSize: '1.08rem', backgroundColor: 'rgba(185, 205, 148, 0.15)', padding: '0.1rem 0.5rem', borderRadius: '6px' }}>1–2 business days</strong> after successful payment confirmation over WhatsApp.
                </p>

                <p style={{ color: '#E8DCCB', lineHeight: '1.75', fontSize: '1rem', margin: 0 }}>
                  High-demand festive periods, national holidays, or special batch baking runs may occasionally extend dispatch times slightly to ensure freshness standards.
                </p>
              </div>

              {/* SECTION 3: ESTIMATED DELIVERY TIME */}
              <div 
                id="estimated-delivery" 
                className="glass-card reveal-fade-up"
                style={{ padding: 'clamp(1.5rem, 4vw, 2.5rem)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(185, 205, 148, 0.15)',
                    border: '1px solid rgba(185, 205, 148, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Truck size={22} color="#b9cd94" />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#b9cd94', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Section 03</span>
                    <h2 className="font-serif" style={{ fontSize: 'clamp(1.3rem, 3vw, 1.75rem)', color: '#F5EBDD', margin: 0 }}>
                      Estimated Delivery Time
                    </h2>
                  </div>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '1rem',
                  marginBottom: '1.25rem'
                }}>
                  <div style={{
                    backgroundColor: 'rgba(50, 26, 18, 0.5)',
                    border: '1px solid rgba(185, 205, 148, 0.3)',
                    borderRadius: '14px',
                    padding: '1.25rem'
                  }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#b9cd94', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Most Indian Cities</span>
                    <h3 style={{ color: '#F5EBDD', fontSize: '1.5rem', margin: '0.35rem 0 0.2rem', fontWeight: '800' }}>
                      3–7 business days
                    </h3>
                    <p style={{ color: '#E8DCCB', fontSize: '0.88rem', margin: 0 }}>Standard pan-India courier delivery window</p>
                  </div>

                  <div style={{
                    backgroundColor: 'rgba(50, 26, 18, 0.5)',
                    border: '1px solid rgba(245, 235, 221, 0.15)',
                    borderRadius: '14px',
                    padding: '1.25rem'
                  }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#E8DCCB', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Remote Locations</span>
                    <h3 style={{ color: '#F5EBDD', fontSize: '1.25rem', margin: '0.35rem 0 0.2rem', fontWeight: '700' }}>
                      May take slightly longer
                    </h3>
                    <p style={{ color: '#E8DCCB', fontSize: '0.88rem', margin: 0 }}>Depending on regional courier access</p>
                  </div>
                </div>

                {/* Notice Box */}
                <div style={{
                  backgroundColor: 'rgba(50, 26, 18, 0.6)',
                  border: '1px solid rgba(245, 235, 221, 0.18)',
                  borderRadius: '14px',
                  padding: '1.1rem 1.35rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem'
                }}>
                  <AlertCircle size={20} color="#b9cd94" style={{ flexShrink: 0 }} />
                  <span style={{ color: '#E8DCCB', fontSize: '0.92rem', lineHeight: '1.5' }}>
                    Courier delays may occasionally happen due to operational, regional, or extreme weather reasons beyond our direct control.
                  </span>
                </div>
              </div>

              {/* SECTION 4: ADDRESS & CONTACT DETAILS */}
              <div 
                id="address-contact" 
                className="glass-card reveal-fade-up"
                style={{ padding: 'clamp(1.5rem, 4vw, 2.5rem)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(185, 205, 148, 0.15)',
                    border: '1px solid rgba(185, 205, 148, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <MapPin size={22} color="#b9cd94" />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#b9cd94', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Section 04</span>
                    <h2 className="font-serif" style={{ fontSize: 'clamp(1.3rem, 3vw, 1.75rem)', color: '#F5EBDD', margin: 0 }}>
                      Address & Contact Details
                    </h2>
                  </div>
                </div>

                <p style={{ color: '#E8DCCB', lineHeight: '1.75', fontSize: '1rem', marginBottom: '1.25rem' }}>
                  Please ensure that your complete shipping address, 6-digit postal pincode, landmark, and reachable contact phone number are provided accurately during ordering.
                </p>

                <p style={{ color: '#E8DCCB', lineHeight: '1.75', fontSize: '1rem', margin: 0 }}>
                  Incorrect or incomplete delivery addresses leading to non-delivery, parcel returns (RTO), or re-routing will incur additional courier re-shipping fees.
                </p>
              </div>

              {/* SECTION 5: TRACKING INFORMATION */}
              <div 
                id="tracking-info" 
                className="glass-card reveal-fade-up"
                style={{ padding: 'clamp(1.5rem, 4vw, 2.5rem)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(185, 205, 148, 0.15)',
                    border: '1px solid rgba(185, 205, 148, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Smartphone size={22} color="#b9cd94" />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#b9cd94', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Section 05</span>
                    <h2 className="font-serif" style={{ fontSize: 'clamp(1.3rem, 3vw, 1.75rem)', color: '#F5EBDD', margin: 0 }}>
                      Tracking Information
                    </h2>
                  </div>
                </div>

                <p style={{ color: '#E8DCCB', lineHeight: '1.75', fontSize: '1rem', marginBottom: '1.25rem' }}>
                  Once your shipment is dispatched, courier tracking details and waybill links will be shared directly with you over WhatsApp.
                </p>

                {/* Highlight Notice Card */}
                <div style={{
                  backgroundColor: 'rgba(185, 205, 148, 0.12)',
                  borderLeft: '4px solid #b9cd94',
                  borderRadius: '14px',
                  padding: '1.1rem 1.35rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem'
                }}>
                  <MessageSquare size={20} color="#b9cd94" style={{ flexShrink: 0 }} />
                  <span style={{ color: '#F5EBDD', fontWeight: '650', fontSize: '0.95rem', lineHeight: '1.5' }}>
                    "WhatsApp is our primary communication channel for shipping updates."
                  </span>
                </div>
              </div>

              {/* SECTION 6: PACKAGING & SAFETY */}
              <div 
                id="packaging-safety" 
                className="glass-card reveal-fade-up"
                style={{ padding: 'clamp(1.5rem, 4vw, 2.5rem)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(185, 205, 148, 0.15)',
                    border: '1px solid rgba(185, 205, 148, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Shield size={22} color="#b9cd94" />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#b9cd94', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Section 06</span>
                    <h2 className="font-serif" style={{ fontSize: 'clamp(1.3rem, 3vw, 1.75rem)', color: '#F5EBDD', margin: 0 }}>
                      Packaging & Safety
                    </h2>
                  </div>
                </div>

                <p style={{ color: '#E8DCCB', lineHeight: '1.75', fontSize: '1rem', margin: 0 }}>
                  Every MILASTY cookie pack is sealed in food-grade protective packaging and dispatched inside sturdy corrugated outer shipping boxes to cushion against transit vibration and prevent moisture entry.
                </p>
              </div>

              {/* SECTION 7: DAMAGED PACKAGES */}
              <div 
                id="damaged-packages" 
                className="glass-card reveal-fade-up"
                style={{ padding: 'clamp(1.5rem, 4vw, 2.5rem)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <AlertTriangle size={22} color="#F87171" />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#F87171', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Section 07</span>
                    <h2 className="font-serif" style={{ fontSize: 'clamp(1.3rem, 3vw, 1.75rem)', color: '#F5EBDD', margin: 0 }}>
                      Damaged Packages
                    </h2>
                  </div>
                </div>

                <p style={{ color: '#E8DCCB', lineHeight: '1.75', fontSize: '1rem', marginBottom: '1.25rem' }}>
                  If your package arrives physically damaged, tampered with, or open, please notify us within <strong style={{ color: '#b9cd94', fontSize: '1.05rem' }}>24 hours</strong> of delivery along with clear photo or video proof.
                </p>

                {/* Warm Unboxing Recommendation Notice Box */}
                <div style={{
                  backgroundColor: 'rgba(185, 205, 148, 0.12)',
                  borderLeft: '4px solid #b9cd94',
                  borderRadius: '14px',
                  padding: '1.1rem 1.35rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Camera size={18} color="#b9cd94" />
                    <span style={{ color: '#F5EBDD', fontWeight: '700', fontSize: '0.95rem' }}>
                      🎥 Unboxing Video Recommendation
                    </span>
                  </div>
                  <p style={{ color: '#E8DCCB', fontSize: '0.9rem', lineHeight: '1.6', margin: 0 }}>
                    We highly recommend recording an unboxing video while opening the outer courier seal. Please note: without an unboxing video, verifying courier-related damage claims may not be possible.
                  </p>
                </div>
              </div>

              {/* SECTION 8: STORAGE INSTRUCTIONS */}
              <div 
                id="storage-instructions" 
                className="glass-card reveal-fade-up"
                style={{ padding: 'clamp(1.5rem, 4vw, 2.5rem)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(185, 205, 148, 0.15)',
                    border: '1px solid rgba(185, 205, 148, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Archive size={22} color="#b9cd94" />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#b9cd94', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Section 08</span>
                    <h2 className="font-serif" style={{ fontSize: 'clamp(1.3rem, 3vw, 1.75rem)', color: '#F5EBDD', margin: 0 }}>
                      Storage Instructions
                    </h2>
                  </div>
                </div>

                <p style={{ color: '#E8DCCB', lineHeight: '1.75', fontSize: '1rem', marginBottom: '1rem' }}>
                  To maintain original crunchiness and flavor after opening:
                </p>

                <ul style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: '0 0 1.25rem 0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.65rem'
                }}>
                  {[
                    "Store in a cool, dry place away from direct sunlight and heat",
                    "Keep the pack tightly sealed or transfer cookies into a clean airtight container",
                    "Consume within the freshness period specified on the package label"
                  ].map((tip, idx) => (
                    <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', color: '#E8DCCB', fontSize: '0.95rem' }}>
                      <CheckCircle2 size={16} color="#b9cd94" style={{ flexShrink: 0, marginTop: '3px' }} />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>

                {/* Highlight Box */}
                <div style={{
                  backgroundColor: 'rgba(185, 205, 148, 0.12)',
                  borderLeft: '4px solid #b9cd94',
                  borderRadius: '14px',
                  padding: '1.1rem 1.35rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem'
                }}>
                  <Cookie size={20} color="#b9cd94" style={{ flexShrink: 0 }} />
                  <span style={{ color: '#F5EBDD', fontWeight: '650', fontSize: '0.95rem', lineHeight: '1.5' }}>
                    "Proper storage keeps the cookies crunchy and fresh for longer."
                  </span>
                </div>
              </div>

              {/* SECTION 9: DELIVERY ATTEMPTS & RETURN TO ORIGIN (RTO) */}
              <div 
                id="rto-attempts" 
                className="glass-card reveal-fade-up"
                style={{ padding: 'clamp(1.5rem, 4vw, 2.5rem)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(185, 205, 148, 0.15)',
                    border: '1px solid rgba(185, 205, 148, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <PackageX size={22} color="#b9cd94" />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#b9cd94', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Section 09</span>
                    <h2 className="font-serif" style={{ fontSize: 'clamp(1.3rem, 3vw, 1.75rem)', color: '#F5EBDD', margin: 0 }}>
                      Delivery Attempts & Return to Origin (RTO)
                    </h2>
                  </div>
                </div>

                <p style={{ color: '#E8DCCB', lineHeight: '1.75', fontSize: '1rem', marginBottom: '1rem' }}>
                  Courier partners make 2–3 delivery attempts before marking a shipment as RTO. Please ensure your phone is reachable and someone is available to receive the parcel.
                </p>

                <p style={{ color: '#E8DCCB', lineHeight: '1.75', fontSize: '1rem', marginBottom: '1.25rem' }}>
                  If a package returns due to customer unavailability, incorrect address, unreachable contact number, or refusal to accept delivery:
                </p>

                <ul style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: '0 0 1.5rem 0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.65rem'
                }}>
                  {[
                    "Re-shipping charges will apply for sending the parcel again",
                    "If a refund is requested, shipping costs will be deducted"
                  ].map((item, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', color: '#E8DCCB', fontSize: '0.92rem' }}>
                      <AlertCircle size={16} color="#b9cd94" style={{ flexShrink: 0, marginTop: '3px' }} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                {/* Final Important Verification Notice */}
                <div style={{
                  backgroundColor: 'rgba(50, 26, 18, 0.6)',
                  border: '1px solid rgba(185, 205, 148, 0.3)',
                  borderRadius: '14px',
                  padding: '1.1rem 1.35rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem'
                }}>
                  <MapPin size={20} color="#b9cd94" style={{ flexShrink: 0 }} />
                  <span style={{ color: '#F5EBDD', fontWeight: '650', fontSize: '0.92rem', lineHeight: '1.5' }}>
                    "Please verify your address and contact details carefully at checkout to avoid RTO charges and delivery delays."
                  </span>
                </div>
              </div>

              {/* SECTION 10: SUPPORT CTA CARD */}
              <div 
                id="shipping-support" 
                className="reveal-fade-up"
                style={{
                  backgroundColor: 'rgba(36, 79, 33, 0.35)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: '1.5px solid rgba(185, 205, 148, 0.4)',
                  borderRadius: '24px',
                  padding: 'clamp(2rem, 5vw, 3rem) clamp(1.5rem, 4vw, 2.5rem)',
                  textAlign: 'center',
                  boxShadow: '0 16px 40px rgba(0, 0, 0, 0.4)'
                }}
              >
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  backgroundColor: '#244f21',
                  border: '1.5px solid #b9cd94',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.25rem',
                  boxShadow: '0 8px 20px rgba(0,0,0,0.3)'
                }}>
                  <MessageSquare size={26} color="#FFFFFF" />
                </div>

                <h3 className="font-serif" style={{ fontSize: 'clamp(1.4rem, 3.5vw, 2rem)', color: '#F5EBDD', marginBottom: '0.75rem' }}>
                  Questions about delivery?
                </h3>

                <p style={{ fontSize: '1.05rem', color: '#E8DCCB', marginBottom: '1.75rem' }}>
                  Message us anytime ❤️
                </p>

                <a 
                  href={getWhatsappUrl("Shipping & Delivery Inquiry")} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="btn-primary"
                  style={{
                    padding: '0.9rem 2.25rem',
                    fontSize: '1rem',
                    fontWeight: '750',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.6rem'
                  }}
                >
                  <MessageSquare size={18} />
                  <span>Contact MILASTY Support</span>
                </a>
              </div>

            </div>
          </div>
        </div>
      </div>
    );
  };

  // ========================================================
  // 2. REDESIGNED REFUND & REPLACEMENT POLICY COMPONENT
  // ========================================================
  const renderRefundPolicy = () => {
    const refundSections = [
      { id: 'no-returns', label: '1. Food Return Policy', icon: Cookie },
      { id: 'eligible-cases', label: '2. Eligible Cases', icon: Package },
      { id: 'time-limit', label: '3. Reporting Window', icon: Clock },
      { id: 'courier-issues', label: '4. Courier & Delays', icon: Truck },
      { id: 'unboxing-video', label: '5. Unboxing Video', icon: Camera },
      { id: 'refund-timeline', label: '6. Refund Timeline', icon: CreditCard },
      { id: 'cancellation-policy', label: '7. Cancellation Policy', icon: XCircle },
      { id: 'rto-refusal', label: '8. RTO & Refusal', icon: PackageX },
      { id: 'refund-support', label: '9. Refund Support', icon: PhoneCall },
    ];

    return (
      <div style={{ position: 'relative' }}>
        <section className="reveal-fade-up" style={{ padding: '4.5rem 1.25rem 3rem', textAlign: 'center', maxWidth: '850px', margin: '0 auto', position: 'relative' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 1rem', borderRadius: '999px', backgroundColor: 'rgba(185, 205, 148, 0.15)', border: '1px solid rgba(185, 205, 148, 0.35)', marginBottom: '1.25rem' }}>
            <RotateCcw size={14} color="#b9cd94" />
            <span style={{ fontSize: '0.75rem', fontWeight: '800', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#b9cd94' }}>POLICY • MILASTY</span>
          </div>
          <h1 className="font-serif" style={{ fontSize: 'clamp(2.2rem, 5vw, 3.6rem)', color: '#F5EBDD', lineHeight: '1.15', marginBottom: '1rem', letterSpacing: '-0.01em' }}>Refund & Replacement Policy</h1>
          <p style={{ fontSize: 'clamp(1rem, 2vw, 1.2rem)', color: '#E8DCCB', opacity: 0.9, maxWidth: '620px', margin: '0 auto 1.5rem', lineHeight: '1.6' }}>
            Simple, fair, and transparent — because MILASTY values trust 🍪
          </p>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'rgba(232, 220, 203, 0.75)', backgroundColor: 'rgba(50, 26, 18, 0.5)', padding: '0.35rem 0.9rem', borderRadius: '999px', border: '1px solid rgba(245, 235, 221, 0.15)' }}>
            <Clock size={14} color="#b9cd94" />
            <span>Last Updated: January 2026</span>
          </div>
        </section>

        <div className="container" style={{ maxWidth: '1180px', margin: '0 auto', padding: '0 1.25rem 6rem', position: 'relative' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '2.5rem', alignItems: 'start' }} className="tc-layout-grid">
            <aside style={{ position: 'sticky', top: '100px', backgroundColor: 'rgba(35, 21, 13, 0.65)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderRadius: '20px', border: '1px solid rgba(245, 220, 180, 0.22)', padding: '1.25rem 1rem', boxShadow: '0 12px 32px rgba(0, 0, 0, 0.35)', display: 'none' }} className="tc-sticky-nav">
              <div style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#b9cd94', marginBottom: '1rem', paddingLeft: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Sparkles size={14} color="#b9cd94" />
                <span>On This Page</span>
              </div>
              <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {refundSections.map((sec) => {
                  const IconComp = sec.icon;
                  const isActive = activeSection === sec.id;
                  return (
                    <button key={sec.id} onClick={() => scrollToSection(sec.id)} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.6rem 0.75rem', borderRadius: '10px', fontSize: '0.85rem', fontWeight: isActive ? '700' : '500', color: isActive ? '#FFFFFF' : 'rgba(232, 220, 203, 0.8)', backgroundColor: isActive ? '#244f21' : 'transparent', textAlign: 'left', width: '100%', border: 'none', transition: 'all 0.2s ease', cursor: 'pointer' }}>
                      <IconComp size={15} color={isActive ? '#b9cd94' : 'rgba(185, 205, 148, 0.7)'} />
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sec.label}</span>
                    </button>
                  );
                })}
              </nav>
            </aside>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div id="no-returns" className="glass-card reveal-fade-up" style={{ padding: 'clamp(1.5rem, 4vw, 2.5rem)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: 'rgba(185, 205, 148, 0.15)', border: '1px solid rgba(185, 205, 148, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Cookie size={22} color="#b9cd94" />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#b9cd94', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Section 01</span>
                    <h2 className="font-serif" style={{ fontSize: 'clamp(1.3rem, 3vw, 1.75rem)', color: '#F5EBDD', margin: 0 }}>Food Products Cannot Be Returned</h2>
                  </div>
                </div>
                <p style={{ color: '#E8DCCB', lineHeight: '1.75', fontSize: '1rem', marginBottom: '1.25rem' }}>MILASTY sells handcrafted edible food products baked fresh in small batches without artificial preservatives. For strict hygiene and food safety reasons, we do not accept returns once an order has been delivered.</p>
                <div style={{ backgroundColor: 'rgba(185, 205, 148, 0.12)', borderLeft: '4px solid #b9cd94', borderRadius: '14px', padding: '1.1rem 1.35rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <CheckCircle2 size={20} color="#b9cd94" style={{ flexShrink: 0 }} />
                  <span style={{ color: '#F5EBDD', fontWeight: '650', fontSize: '0.95rem', lineHeight: '1.5' }}>"No return policy helps ensure food safety for all customers."</span>
                </div>
              </div>

              <div id="eligible-cases" className="glass-card reveal-fade-up" style={{ padding: 'clamp(1.5rem, 4vw, 2.5rem)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: 'rgba(185, 205, 148, 0.15)', border: '1px solid rgba(185, 205, 148, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Package size={22} color="#b9cd94" />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#b9cd94', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Section 02</span>
                    <h2 className="font-serif" style={{ fontSize: 'clamp(1.3rem, 3vw, 1.75rem)', color: '#F5EBDD', margin: 0 }}>When Replacement or Refund is Possible</h2>
                  </div>
                </div>
                <p style={{ color: '#E8DCCB', lineHeight: '1.75', fontSize: '1rem', marginBottom: '1.25rem' }}>We will happily provide an immediate replacement or full refund in genuine issue cases such as:</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {["Product received in physically damaged condition during transit", "Wrong product or item variant delivered", "Package arrived tampered with or outer seal opened prior to delivery"].map((text, i) => (
                    <div key={i} style={{ backgroundColor: 'rgba(50, 26, 18, 0.5)', border: '1px solid rgba(245, 235, 221, 0.15)', borderRadius: '12px', padding: '0.9rem 1.1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <Sparkles size={18} color="#b9cd94" style={{ flexShrink: 0 }} />
                      <span style={{ color: '#E8DCCB', fontSize: '0.95rem', fontWeight: '500' }}>{text}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div id="time-limit" className="glass-card reveal-fade-up" style={{ padding: 'clamp(1.5rem, 4vw, 2.5rem)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: 'rgba(185, 205, 148, 0.15)', border: '1px solid rgba(185, 205, 148, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Clock size={22} color="#b9cd94" />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#b9cd94', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Section 03</span>
                    <h2 className="font-serif" style={{ fontSize: 'clamp(1.3rem, 3vw, 1.75rem)', color: '#F5EBDD', margin: 0 }}>Reporting Time Limit</h2>
                  </div>
                </div>
                <p style={{ color: '#E8DCCB', lineHeight: '1.75', fontSize: '1rem', marginBottom: '1.25rem' }}>If there is any issue with your delivered shipment, please inform our WhatsApp support team within <strong style={{ color: '#b9cd94', fontSize: '1.05rem' }}>24 hours of delivery</strong>.</p>
                <div style={{ backgroundColor: 'rgba(185, 205, 148, 0.12)', borderLeft: '4px solid #b9cd94', borderRadius: '14px', padding: '1.1rem 1.35rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <Camera size={20} color="#b9cd94" style={{ flexShrink: 0 }} />
                  <span style={{ color: '#F5EBDD', fontWeight: '650', fontSize: '0.95rem', lineHeight: '1.5' }}>"Photo or video proof is required for faster resolution."</span>
                </div>
              </div>

              <div id="courier-issues" className="glass-card reveal-fade-up" style={{ padding: 'clamp(1.5rem, 4vw, 2.5rem)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: 'rgba(185, 205, 148, 0.15)', border: '1px solid rgba(185, 205, 148, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Truck size={22} color="#b9cd94" />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#b9cd94', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Section 04</span>
                    <h2 className="font-serif" style={{ fontSize: 'clamp(1.3rem, 3vw, 1.75rem)', color: '#F5EBDD', margin: 0 }}>Courier Damages & Delays</h2>
                  </div>
                </div>
                <p style={{ color: '#E8DCCB', lineHeight: '1.75', fontSize: '1rem', marginBottom: '1rem' }}>All MILASTY products are securely packed in protective corrugated boxes before dispatch. However, transit delays or severe package handling damage caused by third-party courier services may occasionally occur.</p>
                <p style={{ color: '#E8DCCB', lineHeight: '1.75', fontSize: '1rem', margin: 0 }}>In case of transit damage, we coordinate directly with courier management to file claims and re-dispatch fresh bakery boxes to you at the earliest possible window.</p>
              </div>

              <div id="unboxing-video" className="glass-card reveal-fade-up" style={{ padding: 'clamp(1.5rem, 4vw, 2.5rem)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: 'rgba(185, 205, 148, 0.15)', border: '1px solid rgba(185, 205, 148, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Camera size={22} color="#b9cd94" />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#b9cd94', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Section 05</span>
                    <h2 className="font-serif" style={{ fontSize: 'clamp(1.3rem, 3vw, 1.75rem)', color: '#F5EBDD', margin: 0 }}>Unboxing Video Requirement (Mandatory)</h2>
                  </div>
                </div>
                <p style={{ color: '#E8DCCB', lineHeight: '1.75', fontSize: '1rem', marginBottom: '1.25rem' }}>To claim a replacement for transit damage or missing items, an unedited 360° unboxing video recorded while opening the outer shipping seal is mandatory. Please WhatsApp the video to +91 89271 42056 within 24 hours of delivery.</p>
                <div style={{ backgroundColor: 'rgba(185, 205, 148, 0.12)', borderLeft: '4px solid #b9cd94', borderRadius: '14px', padding: '1.1rem 1.35rem', display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1rem' }}>
                  <CheckCircle2 size={20} color="#b9cd94" style={{ flexShrink: 0 }} />
                  <span style={{ color: '#F5EBDD', fontWeight: '650', fontSize: '0.95rem', lineHeight: '1.5' }}>"An unboxing video helps us verify courier-related damage quickly and process replacements or refunds faster."</span>
                </div>
                <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.08)', borderLeft: '4px solid #F87171', borderRadius: '14px', padding: '1.1rem 1.35rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <AlertCircle size={20} color="#F87171" style={{ flexShrink: 0 }} />
                  <span style={{ color: '#F5EBDD', fontWeight: '650', fontSize: '0.92rem', lineHeight: '1.5' }}>Orders marked as “Delivered” by the courier partner will not be eligible for refund unless a valid damage claim with unboxing video proof is submitted within 24 hours.</span>
                </div>
              </div>

              <div id="refund-timeline" className="glass-card reveal-fade-up" style={{ padding: 'clamp(1.5rem, 4vw, 2.5rem)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: 'rgba(185, 205, 148, 0.15)', border: '1px solid rgba(185, 205, 148, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <CreditCard size={22} color="#b9cd94" />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#b9cd94', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Section 06</span>
                    <h2 className="font-serif" style={{ fontSize: 'clamp(1.3rem, 3vw, 1.75rem)', color: '#F5EBDD', margin: 0 }}>Refund Timeline</h2>
                  </div>
                </div>
                <p style={{ color: '#E8DCCB', lineHeight: '1.75', fontSize: '1rem', margin: 0 }}>Once your refund claim is inspected and approved by our team, the amount will be processed within <strong style={{ color: '#b9cd94', fontSize: '1.1rem', backgroundColor: 'rgba(185, 205, 148, 0.15)', padding: '0.1rem 0.5rem', borderRadius: '6px' }}>5–7 business days</strong> back to your original payment method (UPI / Bank Transfer).</p>
              </div>

              <div id="cancellation-policy" className="glass-card reveal-fade-up" style={{ padding: 'clamp(1.5rem, 4vw, 2.5rem)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: 'rgba(185, 205, 148, 0.15)', border: '1px solid rgba(185, 205, 148, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <XCircle size={22} color="#b9cd94" />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#b9cd94', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Section 07</span>
                    <h2 className="font-serif" style={{ fontSize: 'clamp(1.3rem, 3vw, 1.75rem)', color: '#F5EBDD', margin: 0 }}>Order Cancellation Policy</h2>
                  </div>
                </div>
                <p style={{ color: '#E8DCCB', lineHeight: '1.75', fontSize: '1rem', marginBottom: '2rem' }}>Since our millet cookies are prepared and packed soon after payment confirmation, cancellations are accepted only within strict time windows:</p>
                <div className="tc-cancellation-timeline" style={{ marginBottom: '1.5rem' }}>
                  <div className="tc-timeline-item">
                    <div className="tc-timeline-badge"><span>0–3 HOURS</span></div>
                    <div className="tc-timeline-content">
                      <h4 style={{ color: '#F5EBDD', fontSize: '1.1rem', margin: '0 0 0.25rem', fontWeight: '700' }}>Full Refund (100%) ✓</h4>
                      <p style={{ color: '#E8DCCB', fontSize: '0.88rem', margin: 0 }}>Cancellations requested within 3 hours of payment.</p>
                    </div>
                  </div>
                  <div className="tc-timeline-item">
                    <div className="tc-timeline-badge" style={{ backgroundColor: 'rgba(185, 205, 148, 0.2)', borderColor: 'rgba(185, 205, 148, 0.4)' }}><span>3–6 HOURS</span></div>
                    <div className="tc-timeline-content">
                      <h4 style={{ color: '#F5EBDD', fontSize: '1.1rem', margin: '0 0 0.25rem', fontWeight: '700' }}>50% Refund ✓</h4>
                      <p style={{ color: '#E8DCCB', fontSize: '0.88rem', margin: 0 }}>Cancellations requested between 3 to 6 hours after payment.</p>
                    </div>
                  </div>
                  <div className="tc-timeline-item">
                    <div className="tc-timeline-badge" style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.35)', color: '#F87171' }}><span>AFTER 6 HOURS</span></div>
                    <div className="tc-timeline-content">
                      <h4 style={{ color: '#F87171', fontSize: '1.1rem', margin: '0 0 0.25rem', fontWeight: '700' }}>Cancellation Not Possible ✕</h4>
                      <p style={{ color: '#E8DCCB', fontSize: '0.88rem', margin: 0 }}>Small-batch baking and dispatch preparation has commenced.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div id="rto-refusal" className="glass-card reveal-fade-up" style={{ padding: 'clamp(1.5rem, 4vw, 2.5rem)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: 'rgba(185, 205, 148, 0.15)', border: '1px solid rgba(185, 205, 148, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <PackageX size={22} color="#b9cd94" />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#b9cd94', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Section 08</span>
                    <h2 className="font-serif" style={{ fontSize: 'clamp(1.3rem, 3vw, 1.75rem)', color: '#F5EBDD', margin: 0 }}>Return to Origin (RTO) & Delivery Refusal</h2>
                  </div>
                </div>
                <p style={{ color: '#E8DCCB', lineHeight: '1.75', fontSize: '1rem', marginBottom: '1.25rem' }}>If a package is returned to our bakery facility due to:</p>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem 0', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {["Customer being unavailable at the specified address after multiple attempts", "Incorrect or incomplete shipping address provided during ordering", "Unreachable contact phone number provided", "Refusal to accept the delivery parcel upon courier arrival"].map((bullet, idx) => (
                    <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', fontSize: '0.92rem', color: '#E8DCCB' }}>
                      <CheckCircle2 size={16} color="#b9cd94" style={{ flexShrink: 0, marginTop: '3px' }} />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
                <div style={{ backgroundColor: 'rgba(50, 26, 18, 0.6)', border: '1px solid rgba(245, 235, 221, 0.2)', borderRadius: '14px', padding: '1.1rem 1.35rem' }}>
                  <p style={{ color: '#E8DCCB', fontSize: '0.9rem', lineHeight: '1.6', margin: '0 0 0.5rem' }}>• Deductions will be made for two-way courier shipping costs incurred during RTO shipments.</p>
                  <p style={{ color: '#E8DCCB', fontSize: '0.9rem', lineHeight: '1.6', margin: '0 0 0.5rem' }}>• Returned edible parcels undergo mandatory quality inspection before any partial refund or re-dispatch is considered.</p>
                  <p style={{ color: '#E8DCCB', fontSize: '0.9rem', lineHeight: '1.6', margin: 0 }}>• Additional shipping charges will apply for re-dispatching RTO parcels to corrected addresses.</p>
                </div>
              </div>

              <div id="refund-support" className="reveal-fade-up" style={{ backgroundColor: 'rgba(36, 79, 33, 0.35)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1.5px solid rgba(185, 205, 148, 0.4)', borderRadius: '24px', padding: 'clamp(2rem, 5vw, 3rem) clamp(1.5rem, 4vw, 2.5rem)', textAlign: 'center', boxShadow: '0 16px 40px rgba(0, 0, 0, 0.4)' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#244f21', border: '1.5px solid #b9cd94', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', boxShadow: '0 8px 20px rgba(0,0,0,0.3)' }}>
                  <MessageSquare size={26} color="#FFFFFF" />
                </div>
                <h3 className="font-serif" style={{ fontSize: 'clamp(1.4rem, 3.5vw, 2rem)', color: '#F5EBDD', marginBottom: '0.75rem' }}>Facing an issue with your order?</h3>
                <p style={{ fontSize: '1.05rem', color: '#E8DCCB', marginBottom: '1.75rem' }}>We'll make it right ❤️</p>
                <a href={getWhatsappUrl("Refund & Replacement Claim")} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ padding: '0.9rem 2.25rem', fontSize: '1rem', fontWeight: '750', display: 'inline-flex', alignItems: 'center', gap: '0.6rem' }}>
                  <MessageSquare size={18} />
                  <span>Contact MILASTY Support</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ========================================================
  // 3. REDESIGNED PRIVACY POLICY COMPONENT
  // ========================================================
  const renderPrivacyPolicy = () => {
    const privacySections = [
      { id: 'promise', label: '1. Our Promise', icon: Leaf },
      { id: 'data-collected', label: '2. What We Collect', icon: FileSpreadsheet },
      { id: 'purpose', label: '3. Why We Collect', icon: Cookie },
      { id: 'courier-sharing', label: '4. Courier Sharing', icon: Truck },
      { id: 'data-protection', label: '5. Data Protection', icon: Lock },
      { id: 'marketing', label: '6. Marketing Comm.', icon: Megaphone },
      { id: 'your-rights', label: '7. Your Rights', icon: UserCheck },
      { id: 'cookies-tracking', label: '8. Cookies & Tracking', icon: Globe2 },
      { id: 'policy-updates', label: '9. Policy Updates', icon: Scale },
      { id: 'privacy-support', label: '10. Privacy Support', icon: PhoneCall },
    ];

    return (
      <div style={{ position: 'relative' }}>
        <section className="reveal-fade-up" style={{ padding: '4.5rem 1.25rem 3rem', textAlign: 'center', maxWidth: '850px', margin: '0 auto', position: 'relative' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 1rem', borderRadius: '999px', backgroundColor: 'rgba(185, 205, 148, 0.15)', border: '1px solid rgba(185, 205, 148, 0.35)', marginBottom: '1.25rem' }}>
            <ShieldCheck size={14} color="#b9cd94" />
            <span style={{ fontSize: '0.75rem', fontWeight: '800', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#b9cd94' }}>LEGAL • MILASTY</span>
          </div>
          <h1 className="font-serif" style={{ fontSize: 'clamp(2.2rem, 5vw, 3.6rem)', color: '#F5EBDD', lineHeight: '1.15', marginBottom: '1rem', letterSpacing: '-0.01em' }}>Privacy Policy</h1>
          <p style={{ fontSize: 'clamp(1rem, 2vw, 1.2rem)', color: '#E8DCCB', opacity: 0.9, maxWidth: '620px', margin: '0 auto 1.5rem', lineHeight: '1.6' }}>
            Your trust matters. Here's exactly how MILASTY handles your data.
          </p>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'rgba(232, 220, 203, 0.75)', backgroundColor: 'rgba(50, 26, 18, 0.5)', padding: '0.35rem 0.9rem', borderRadius: '999px', border: '1px solid rgba(245, 235, 221, 0.15)' }}>
            <Clock size={14} color="#b9cd94" />
            <span>Last Updated: January 2026</span>
          </div>
        </section>

        <div className="container" style={{ maxWidth: '1180px', margin: '0 auto', padding: '0 1.25rem 6rem', position: 'relative' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '2.5rem', alignItems: 'start' }} className="tc-layout-grid">
            <aside style={{ position: 'sticky', top: '100px', backgroundColor: 'rgba(35, 21, 13, 0.65)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderRadius: '20px', border: '1px solid rgba(245, 220, 180, 0.22)', padding: '1.25rem 1rem', boxShadow: '0 12px 32px rgba(0, 0, 0, 0.35)', display: 'none' }} className="tc-sticky-nav">
              <div style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#b9cd94', marginBottom: '1rem', paddingLeft: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Sparkles size={14} color="#b9cd94" />
                <span>On This Page</span>
              </div>
              <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {privacySections.map((sec) => {
                  const IconComp = sec.icon;
                  const isActive = activeSection === sec.id;
                  return (
                    <button key={sec.id} onClick={() => scrollToSection(sec.id)} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.6rem 0.75rem', borderRadius: '10px', fontSize: '0.85rem', fontWeight: isActive ? '700' : '500', color: isActive ? '#FFFFFF' : 'rgba(232, 220, 203, 0.8)', backgroundColor: isActive ? '#244f21' : 'transparent', textAlign: 'left', width: '100%', border: 'none', transition: 'all 0.2s ease', cursor: 'pointer' }}>
                      <IconComp size={15} color={isActive ? '#b9cd94' : 'rgba(185, 205, 148, 0.7)'} />
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sec.label}</span>
                    </button>
                  );
                })}
              </nav>
            </aside>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div id="promise" className="glass-card reveal-fade-up" style={{ padding: 'clamp(1.5rem, 4vw, 2.5rem)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: 'rgba(185, 205, 148, 0.15)', border: '1px solid rgba(185, 205, 148, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Leaf size={22} color="#b9cd94" />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#b9cd94', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Section 01</span>
                    <h2 className="font-serif" style={{ fontSize: 'clamp(1.3rem, 3vw, 1.75rem)', color: '#F5EBDD', margin: 0 }}>Our Promise</h2>
                  </div>
                </div>
                <p style={{ color: '#E8DCCB', lineHeight: '1.75', fontSize: '1rem', marginBottom: '1.25rem' }}>MILASTY deeply respects your privacy. We collect only the minimum personal information required to deliver your fresh artisan cookies safely to your doorstep and provide you with seamless customer support.</p>
                <div style={{ backgroundColor: 'rgba(185, 205, 148, 0.12)', borderLeft: '4px solid #b9cd94', borderRadius: '14px', padding: '1.1rem 1.35rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <CheckCircle2 size={20} color="#b9cd94" style={{ flexShrink: 0 }} />
                  <span style={{ color: '#F5EBDD', fontWeight: '650', fontSize: '0.95rem', lineHeight: '1.5' }}>"We do not sell or misuse your personal data — ever."</span>
                </div>
              </div>

              <div id="data-collected" className="glass-card reveal-fade-up" style={{ padding: 'clamp(1.5rem, 4vw, 2.5rem)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: 'rgba(185, 205, 148, 0.15)', border: '1px solid rgba(185, 205, 148, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <FileSpreadsheet size={22} color="#b9cd94" />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#b9cd94', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Section 02</span>
                    <h2 className="font-serif" style={{ fontSize: 'clamp(1.3rem, 3vw, 1.75rem)', color: '#F5EBDD', margin: 0 }}>What Information We Collect</h2>
                  </div>
                </div>
                <p style={{ color: '#E8DCCB', lineHeight: '1.75', fontSize: '1rem', marginBottom: '1.25rem' }}>When you place an order through WhatsApp or reach out to our team for inquiries, we may collect:</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
                  {["Your name", "Your phone number", "Your delivery address & pincode", "Order details (products & quantity)", "Payment confirmation (transaction reference only)"].map((item, idx) => (
                    <div key={idx} style={{ backgroundColor: 'rgba(50, 26, 18, 0.5)', border: '1px solid rgba(245, 235, 221, 0.15)', borderRadius: '12px', padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <Sparkles size={16} color="#b9cd94" style={{ flexShrink: 0 }} />
                      <span style={{ fontSize: '0.9rem', color: '#E8DCCB', fontWeight: '500' }}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div id="purpose" className="glass-card reveal-fade-up" style={{ padding: 'clamp(1.5rem, 4vw, 2.5rem)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: 'rgba(185, 205, 148, 0.15)', border: '1px solid rgba(185, 205, 148, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Cookie size={22} color="#b9cd94" />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#b9cd94', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Section 03</span>
                    <h2 className="font-serif" style={{ fontSize: 'clamp(1.3rem, 3vw, 1.75rem)', color: '#F5EBDD', margin: 0 }}>Why We Collect This Data</h2>
                  </div>
                </div>
                <p style={{ color: '#E8DCCB', lineHeight: '1.75', fontSize: '1rem', marginBottom: '1.25rem' }}>We collect this information strictly for genuine business purposes such as:</p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {["Confirming your small-batch bakery order", "Shipping cookies to your exact delivery address", "Providing real-time order updates via WhatsApp", "Assisting with customer support and resolving delivery queries"].map((text, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', fontSize: '0.95rem', color: '#E8DCCB' }}>
                      <CheckCircle2 size={18} color="#b9cd94" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span>{text}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div id="courier-sharing" className="glass-card reveal-fade-up" style={{ padding: 'clamp(1.5rem, 4vw, 2.5rem)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: 'rgba(185, 205, 148, 0.15)', border: '1px solid rgba(185, 205, 148, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Truck size={22} color="#b9cd94" />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#b9cd94', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Section 04</span>
                    <h2 className="font-serif" style={{ fontSize: 'clamp(1.3rem, 3vw, 1.75rem)', color: '#F5EBDD', margin: 0 }}>Sharing Information With Courier Partners</h2>
                  </div>
                </div>
                <p style={{ color: '#E8DCCB', lineHeight: '1.75', fontSize: '1rem', marginBottom: '1.25rem' }}>To deliver your fresh bakery order safely across India, we share limited necessary information — such as your recipient name, phone number, and delivery shipping address — with our trusted courier logistics partners.</p>
                <div style={{ backgroundColor: 'rgba(185, 205, 148, 0.12)', borderLeft: '4px solid #b9cd94', borderRadius: '14px', padding: '1.1rem 1.35rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <PackageCheck size={20} color="#b9cd94" style={{ flexShrink: 0 }} />
                  <span style={{ color: '#F5EBDD', fontWeight: '650', fontSize: '0.95rem', lineHeight: '1.5' }}>"Courier partners receive only what is necessary for delivery."</span>
                </div>
              </div>

              <div id="data-protection" className="glass-card reveal-fade-up" style={{ padding: 'clamp(1.5rem, 4vw, 2.5rem)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: 'rgba(185, 205, 148, 0.15)', border: '1px solid rgba(185, 205, 148, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Lock size={22} color="#b9cd94" />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#b9cd94', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Section 05</span>
                    <h2 className="font-serif" style={{ fontSize: 'clamp(1.3rem, 3vw, 1.75rem)', color: '#F5EBDD', margin: 0 }}>How We Protect Your Information</h2>
                  </div>
                </div>
                <p style={{ color: '#E8DCCB', lineHeight: '1.75', fontSize: '1rem', marginBottom: '1.25rem' }}>MILASTY takes customer privacy and data security seriously. We strictly enforce that:</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {["Your information is accessed only by authorized MILASTY operations personnel", "Order details are used solely for fulfilling your shipment and providing customer care", "We NEVER record, store, or handle sensitive card details, CVVs, or banking credentials"].map((rule, idx) => (
                    <div key={idx} style={{ backgroundColor: 'rgba(50, 26, 18, 0.5)', border: '1px solid rgba(245, 235, 221, 0.15)', borderRadius: '12px', padding: '1rem 1.15rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                      <Lock size={18} color="#b9cd94" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span style={{ color: '#E8DCCB', fontSize: '0.92rem', lineHeight: '1.5' }}>{rule}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div id="marketing" className="glass-card reveal-fade-up" style={{ padding: 'clamp(1.5rem, 4vw, 2.5rem)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: 'rgba(185, 205, 148, 0.15)', border: '1px solid rgba(185, 205, 148, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Megaphone size={22} color="#b9cd94" />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#b9cd94', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Section 06</span>
                    <h2 className="font-serif" style={{ fontSize: 'clamp(1.3rem, 3vw, 1.75rem)', color: '#F5EBDD', margin: 0 }}>Marketing Communication</h2>
                  </div>
                </div>
                <p style={{ color: '#E8DCCB', lineHeight: '1.75', fontSize: '1rem', marginBottom: '1.25rem' }}>We may occasionally send updates regarding new seasonal MILASTY bakes, special artisan offers, or health tips. You can opt out at any time by simply messaging us "STOP" on WhatsApp.</p>
                <div style={{ backgroundColor: 'rgba(185, 205, 148, 0.12)', borderLeft: '4px solid #b9cd94', borderRadius: '14px', padding: '1.1rem 1.35rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <Megaphone size={20} color="#b9cd94" style={{ flexShrink: 0 }} />
                  <span style={{ color: '#F5EBDD', fontWeight: '650', fontSize: '0.95rem', lineHeight: '1.5' }}>"No spam. Only meaningful updates, and only if you're comfortable."</span>
                </div>
              </div>

              <div id="your-rights" className="glass-card reveal-fade-up" style={{ padding: 'clamp(1.5rem, 4vw, 2.5rem)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: 'rgba(185, 205, 148, 0.15)', border: '1px solid rgba(185, 205, 148, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <UserCheck size={22} color="#b9cd94" />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#b9cd94', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Section 07</span>
                    <h2 className="font-serif" style={{ fontSize: 'clamp(1.3rem, 3vw, 1.75rem)', color: '#F5EBDD', margin: 0 }}>Your Rights</h2>
                  </div>
                </div>
                <p style={{ color: '#E8DCCB', lineHeight: '1.75', fontSize: '1rem', marginBottom: '1.25rem' }}>You retain full control over your personal data at all times. You have the right to request:</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                  {[{ title: "Right to Inspect", desc: "To see what contact and order data we hold about you" }, { title: "Right to Correct", desc: "Correction of any incomplete or inaccurate delivery details" }, { title: "Right to Deletion", desc: "Deletion of your personal details after your order fulfillment" }].map((right, index) => (
                    <div key={index} style={{ backgroundColor: 'rgba(50, 26, 18, 0.5)', border: '1px solid rgba(245, 235, 221, 0.15)', borderRadius: '14px', padding: '1.15rem' }}>
                      <h4 style={{ color: '#b9cd94', fontSize: '1rem', marginBottom: '0.35rem', fontWeight: '700' }}>{right.title}</h4>
                      <p style={{ color: '#E8DCCB', fontSize: '0.88rem', margin: 0, lineHeight: '1.5' }}>{right.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div id="cookies-tracking" className="glass-card reveal-fade-up" style={{ padding: 'clamp(1.5rem, 4vw, 2.5rem)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: 'rgba(185, 205, 148, 0.15)', border: '1px solid rgba(185, 205, 148, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Globe2 size={22} color="#b9cd94" />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#b9cd94', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Section 08</span>
                    <h2 className="font-serif" style={{ fontSize: 'clamp(1.3rem, 3vw, 1.75rem)', color: '#F5EBDD', margin: 0 }}>Website Cookies & Tracking</h2>
                  </div>
                </div>
                <p style={{ color: '#E8DCCB', lineHeight: '1.75', fontSize: '1rem', margin: 0 }}>The MILASTY website is designed as an informational brand platform and does not use invasive third-party tracking cookies or collect unnecessary browser history data.</p>
              </div>

              <div id="policy-updates" className="glass-card reveal-fade-up" style={{ padding: 'clamp(1.5rem, 4vw, 2.5rem)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: 'rgba(185, 205, 148, 0.15)', border: '1px solid rgba(185, 205, 148, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Scale size={22} color="#b9cd94" />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#b9cd94', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Section 09</span>
                    <h2 className="font-serif" style={{ fontSize: 'clamp(1.3rem, 3vw, 1.75rem)', color: '#F5EBDD', margin: 0 }}>Policy Updates</h2>
                  </div>
                </div>
                <p style={{ color: '#E8DCCB', lineHeight: '1.75', fontSize: '1rem', margin: 0 }}>This Privacy Policy may be updated occasionally to reflect operational or regulatory improvements. Any revisions will be posted directly on this page with an updated effective date.</p>
              </div>

              <div id="privacy-support" className="reveal-fade-up" style={{ backgroundColor: 'rgba(36, 79, 33, 0.35)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1.5px solid rgba(185, 205, 148, 0.4)', borderRadius: '24px', padding: 'clamp(2rem, 5vw, 3rem) clamp(1.5rem, 4vw, 2.5rem)', textAlign: 'center', boxShadow: '0 16px 40px rgba(0, 0, 0, 0.4)' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#244f21', border: '1.5px solid #b9cd94', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', boxShadow: '0 8px 20px rgba(0,0,0,0.3)' }}>
                  <MessageSquare size={26} color="#FFFFFF" />
                </div>
                <h3 className="font-serif" style={{ fontSize: 'clamp(1.4rem, 3.5vw, 2rem)', color: '#F5EBDD', marginBottom: '0.75rem' }}>Questions about your privacy or data?</h3>
                <p style={{ fontSize: '1.05rem', color: '#E8DCCB', marginBottom: '1.75rem' }}>Message us anytime ❤️</p>
                <a href={getWhatsappUrl("Privacy Policy & Personal Data")} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ padding: '0.9rem 2.25rem', fontSize: '1rem', fontWeight: '750', display: 'inline-flex', alignItems: 'center', gap: '0.6rem' }}>
                  <MessageSquare size={18} />
                  <span>Contact MILASTY Support</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ========================================================
  // 4. REDESIGNED TERMS & CONDITIONS COMPONENT
  // ========================================================
  const renderTermsAndConditions = () => {
    const tcSections = [
      { id: 'about', label: '1. About MILASTY', icon: Leaf },
      { id: 'whatsapp-ordering', label: '2. WhatsApp Ordering', icon: MessageSquare },
      { id: 'freshness', label: '3. Product & Variations', icon: Cookie },
      { id: 'allergies', label: '4. Allergies & Ingredients', icon: AlertTriangle },
      { id: 'health-disclaimer', label: '5. Health Disclaimer', icon: Heart },
      { id: 'children-advisory', label: '6. Children Advisory', icon: Baby },
      { id: 'shipping', label: '7. Pan-India Shipping', icon: Truck },
      { id: 'returns-refunds', label: '8. Returns & Refunds', icon: RotateCcw },
      { id: 'cancellation', label: '9. Cancellation Policy', icon: Clock },
      { id: 'legal-jurisdiction', label: '10. Legal & Jurisdiction', icon: Scale },
      { id: 'support-cta', label: '11. MILASTY Support', icon: PhoneCall },
    ];

    return (
      <div style={{ position: 'relative' }}>
        <section className="reveal-fade-up" style={{ padding: '4.5rem 1.25rem 3rem', textAlign: 'center', maxWidth: '850px', margin: '0 auto', position: 'relative' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 1rem', borderRadius: '999px', backgroundColor: 'rgba(185, 205, 148, 0.15)', border: '1px solid rgba(185, 205, 148, 0.35)', marginBottom: '1.25rem' }}>
            <FileText size={14} color="#b9cd94" />
            <span style={{ fontSize: '0.75rem', fontWeight: '800', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#b9cd94' }}>LEGAL • MILASTY</span>
          </div>
          <h1 className="font-serif" style={{ fontSize: 'clamp(2.2rem, 5vw, 3.6rem)', color: '#F5EBDD', lineHeight: '1.15', marginBottom: '1rem', letterSpacing: '-0.01em' }}>Terms & Conditions</h1>
          <p style={{ fontSize: 'clamp(1rem, 2vw, 1.2rem)', color: '#E8DCCB', opacity: 0.9, maxWidth: '600px', margin: '0 auto 1.5rem', lineHeight: '1.6' }}>
            Clear, honest and transparent — just like MILASTY.
          </p>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'rgba(232, 220, 203, 0.75)', backgroundColor: 'rgba(50, 26, 18, 0.5)', padding: '0.35rem 0.9rem', borderRadius: '999px', border: '1px solid rgba(245, 235, 221, 0.15)' }}>
            <Clock size={14} color="#b9cd94" />
            <span>Last Updated: January 2026</span>
          </div>
        </section>

        <div className="container" style={{ maxWidth: '1180px', margin: '0 auto', padding: '0 1.25rem 6rem', position: 'relative' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '2.5rem', alignItems: 'start' }} className="tc-layout-grid">
            <aside style={{ position: 'sticky', top: '100px', backgroundColor: 'rgba(35, 21, 13, 0.65)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderRadius: '20px', border: '1px solid rgba(245, 220, 180, 0.22)', padding: '1.25rem 1rem', boxShadow: '0 12px 32px rgba(0, 0, 0, 0.35)', display: 'none' }} className="tc-sticky-nav">
              <div style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#b9cd94', marginBottom: '1rem', paddingLeft: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Sparkles size={14} color="#b9cd94" />
                <span>On This Page</span>
              </div>
              <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {tcSections.map((sec) => {
                  const IconComp = sec.icon;
                  const isActive = activeSection === sec.id;
                  return (
                    <button key={sec.id} onClick={() => scrollToSection(sec.id)} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.6rem 0.75rem', borderRadius: '10px', fontSize: '0.85rem', fontWeight: isActive ? '700' : '500', color: isActive ? '#FFFFFF' : 'rgba(232, 220, 203, 0.8)', backgroundColor: isActive ? '#244f21' : 'transparent', textAlign: 'left', width: '100%', border: 'none', transition: 'all 0.2s ease', cursor: 'pointer' }}>
                      <IconComp size={15} color={isActive ? '#b9cd94' : 'rgba(185, 205, 148, 0.7)'} />
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sec.label}</span>
                    </button>
                  );
                })}
              </nav>
            </aside>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div id="about" className="glass-card reveal-fade-up" style={{ padding: 'clamp(1.5rem, 4vw, 2.5rem)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: 'rgba(185, 205, 148, 0.15)', border: '1px solid rgba(185, 205, 148, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Leaf size={22} color="#b9cd94" />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#b9cd94', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Section 01</span>
                    <h2 className="font-serif" style={{ fontSize: 'clamp(1.3rem, 3vw, 1.75rem)', color: '#F5EBDD', margin: 0 }}>About MILASTY</h2>
                  </div>
                </div>
                <p style={{ color: '#E8DCCB', lineHeight: '1.75', fontSize: '1rem', margin: 0 }}>MILASTY is a premium Indian brand offering millet-based cookies baked with organic jaggery and pure Desi Ghee. Our website is informational, designed to educate you about our pure ingredients and artisanal small-batch bakery products, and orders are placed directly through WhatsApp.</p>
              </div>

              <div id="whatsapp-ordering" className="glass-card reveal-fade-up" style={{ padding: 'clamp(1.5rem, 4vw, 2.5rem)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: 'rgba(185, 205, 148, 0.15)', border: '1px solid rgba(185, 205, 148, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <MessageSquare size={22} color="#b9cd94" />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#b9cd94', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Section 02</span>
                    <h2 className="font-serif" style={{ fontSize: 'clamp(1.3rem, 3vw, 1.75rem)', color: '#F5EBDD', margin: 0 }}>Ordering Through WhatsApp</h2>
                  </div>
                </div>
                <p style={{ color: '#E8DCCB', lineHeight: '1.75', fontSize: '1rem', marginBottom: '1.25rem' }}>We accept orders only via WhatsApp or direct messages. All orders placed on MILASTY generate a pre-formatted WhatsApp order receipt. Orders are confirmed and scheduled for small-batch baking after payment is successfully completed and final approval is provided over WhatsApp chat.</p>
                <div style={{ backgroundColor: 'rgba(185, 205, 148, 0.12)', borderLeft: '4px solid #b9cd94', borderRadius: '14px', padding: '1.1rem 1.35rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <Sparkles size={20} color="#b9cd94" style={{ flexShrink: 0 }} />
                  <span style={{ color: '#F5EBDD', fontWeight: '650', fontSize: '0.95rem', lineHeight: '1.5' }}>"No confusing checkout system — only simple, personal ordering."</span>
                </div>
              </div>

              <div id="freshness" className="glass-card reveal-fade-up" style={{ padding: 'clamp(1.5rem, 4vw, 2.5rem)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: 'rgba(185, 205, 148, 0.15)', border: '1px solid rgba(185, 205, 148, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Cookie size={22} color="#b9cd94" />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#b9cd94', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Section 03</span>
                    <h2 className="font-serif" style={{ fontSize: 'clamp(1.3rem, 3vw, 1.75rem)', color: '#F5EBDD', margin: 0 }}>Product Freshness & Variations</h2>
                  </div>
                </div>
                <p style={{ color: '#E8DCCB', lineHeight: '1.75', fontSize: '1rem', margin: 0 }}>Our cookies are batch-made using natural, unrefined ingredients. Because every batch is handcrafted in small artisanal quantities without artificial colorings or chemical preservatives, minor differences in texture, shape, or shade of golden color are completely normal and a hallmark of authentic handcrafted baking.</p>
              </div>

              <div id="allergies" className="glass-card reveal-fade-up" style={{ padding: 'clamp(1.5rem, 4vw, 2.5rem)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <AlertTriangle size={22} color="#F87171" />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#F87171', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Section 04</span>
                    <h2 className="font-serif" style={{ fontSize: 'clamp(1.3rem, 3vw, 1.75rem)', color: '#F5EBDD', margin: 0 }}>Allergies & Ingredients</h2>
                  </div>
                </div>
                <p style={{ color: '#E8DCCB', lineHeight: '1.75', fontSize: '1rem', marginBottom: '1.25rem' }}>While all our products are 100% free of Maida (refined wheat flour), Palm Oil, and artificial additives, they are prepared in a bakery facility that handles tree nuts, seeds, wheat, and dairy (Pure Desi Ghee).</p>
                <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.08)', borderLeft: '4px solid #F87171', borderRadius: '14px', padding: '1.1rem 1.35rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                    <AlertTriangle size={18} color="#F87171" />
                    <span style={{ color: '#F5EBDD', fontWeight: '700', fontSize: '0.95rem' }}>Allergen Warning Notice</span>
                  </div>
                  <p style={{ color: '#E8DCCB', fontSize: '0.9rem', lineHeight: '1.6', margin: 0 }}>If you have severe allergic reactions to nuts, gluten, or dairy, please review the exact ingredient labels carefully or consult with our team on WhatsApp before placing your order.</p>
                </div>
              </div>

              <div id="health-disclaimer" className="glass-card reveal-fade-up" style={{ padding: 'clamp(1.5rem, 4vw, 2.5rem)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: 'rgba(185, 205, 148, 0.15)', border: '1px solid rgba(185, 205, 148, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Heart size={22} color="#b9cd94" />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#b9cd94', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Section 05</span>
                    <h2 className="font-serif" style={{ fontSize: 'clamp(1.3rem, 3vw, 1.75rem)', color: '#F5EBDD', margin: 0 }}>Health Disclaimer</h2>
                  </div>
                </div>
                <p style={{ color: '#E8DCCB', lineHeight: '1.75', fontSize: '1rem', marginBottom: '1.25rem' }}>MILASTY cookies are made with wholesome, clean ingredients like millets, organic jaggery, and pure Desi Ghee. However, they are bakery food products and are not intended to diagnose, treat, cure, or prevent any disease or medical condition.</p>
                <div style={{ backgroundColor: 'rgba(185, 205, 148, 0.12)', borderLeft: '4px solid #b9cd94', borderRadius: '14px', padding: '1.1rem 1.35rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <Heart size={20} color="#b9cd94" style={{ flexShrink: 0 }} />
                  <span style={{ color: '#F5EBDD', fontWeight: '650', fontSize: '0.95rem', lineHeight: '1.5' }}>"Please consult a medical professional if you have specific dietary concerns."</span>
                </div>
              </div>

              <div id="children-advisory" className="glass-card reveal-fade-up" style={{ padding: 'clamp(1.5rem, 4vw, 2.5rem)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: 'rgba(185, 205, 148, 0.15)', border: '1px solid rgba(185, 205, 148, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Baby size={22} color="#b9cd94" />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#b9cd94', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Section 06</span>
                    <h2 className="font-serif" style={{ fontSize: 'clamp(1.3rem, 3vw, 1.75rem)', color: '#F5EBDD', margin: 0 }}>Children Advisory</h2>
                  </div>
                </div>
                <p style={{ color: '#E8DCCB', lineHeight: '1.75', fontSize: '1rem', margin: 0 }}>MILASTY cookies are dense and crunchy due to the high fiber content of authentic ancient millets. Children below 6 years of age should consume these cookies only under adult supervision to prevent choking hazards.</p>
              </div>

              <div id="shipping" className="glass-card reveal-fade-up" style={{ padding: 'clamp(1.5rem, 4vw, 2.5rem)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: 'rgba(185, 205, 148, 0.15)', border: '1px solid rgba(185, 205, 148, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Truck size={22} color="#b9cd94" />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#b9cd94', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Section 07</span>
                    <h2 className="font-serif" style={{ fontSize: 'clamp(1.3rem, 3vw, 1.75rem)', color: '#F5EBDD', margin: 0 }}>Pan-India Shipping</h2>
                  </div>
                </div>
                <p style={{ color: '#E8DCCB', lineHeight: '1.75', fontSize: '1rem', marginBottom: '1.25rem' }}>We ship across India through premium, reliable courier partners. All products are baked fresh upon order confirmation and dispatched within 24–48 hours. Delivery usually takes 3–7 business days depending on your pincode location.</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                  <div style={{ backgroundColor: 'rgba(50, 26, 18, 0.5)', border: '1px solid rgba(245, 235, 221, 0.15)', borderRadius: '12px', padding: '1rem', display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                    <CheckCircle2 size={18} color="#b9cd94" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span style={{ fontSize: '0.9rem', color: '#E8DCCB', lineHeight: '1.5' }}>Courier delays may occasionally happen due to operational or weather reasons.</span>
                  </div>
                  <div style={{ backgroundColor: 'rgba(50, 26, 18, 0.5)', border: '1px solid rgba(245, 235, 221, 0.15)', borderRadius: '12px', padding: '1rem', display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                    <CheckCircle2 size={18} color="#b9cd94" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span style={{ fontSize: '0.9rem', color: '#E8DCCB', lineHeight: '1.5' }}>Please ensure your shipping address, pincode, and phone number are correct.</span>
                  </div>
                </div>
              </div>

              <div id="returns-refunds" className="glass-card reveal-fade-up" style={{ padding: 'clamp(1.5rem, 4vw, 2.5rem)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: 'rgba(185, 205, 148, 0.15)', border: '1px solid rgba(185, 205, 148, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <RotateCcw size={22} color="#b9cd94" />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#b9cd94', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Section 08</span>
                    <h2 className="font-serif" style={{ fontSize: 'clamp(1.3rem, 3vw, 1.75rem)', color: '#F5EBDD', margin: 0 }}>Returns & Refunds Policy</h2>
                  </div>
                </div>
                <p style={{ color: '#E8DCCB', lineHeight: '1.75', fontSize: '1rem', marginBottom: '1.5rem' }}>Since MILASTY cookies are edible food products prepared fresh without preservatives, returns are not accepted once the order has been delivered. Refunds or replacements are possible only in genuine cases such as damaged outer packaging or incorrect items delivered.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ backgroundColor: 'rgba(185, 205, 148, 0.12)', borderLeft: '4px solid #b9cd94', borderRadius: '14px', padding: '1.1rem 1.35rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <Clock size={20} color="#b9cd94" style={{ flexShrink: 0 }} />
                    <span style={{ color: '#F5EBDD', fontWeight: '650', fontSize: '0.95rem', lineHeight: '1.5' }}>"Please report any issue within 24 hours of delivery with photo/video proof."</span>
                  </div>
                  <div style={{ backgroundColor: 'rgba(185, 205, 148, 0.12)', borderLeft: '4px solid #b9cd94', borderRadius: '14px', padding: '1.1rem 1.35rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <ShieldCheck size={20} color="#b9cd94" style={{ flexShrink: 0 }} />
                    <span style={{ color: '#F5EBDD', fontWeight: '650', fontSize: '0.95rem', lineHeight: '1.5' }}>"A proper unboxing (parcel opening) video is mandatory to process any concern."</span>
                  </div>
                </div>
              </div>

              <div id="cancellation" className="glass-card reveal-fade-up" style={{ padding: 'clamp(1.5rem, 4vw, 2.5rem)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: 'rgba(185, 205, 148, 0.15)', border: '1px solid rgba(185, 205, 148, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Clock size={22} color="#b9cd94" />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#b9cd94', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Section 09</span>
                    <h2 className="font-serif" style={{ fontSize: 'clamp(1.3rem, 3vw, 1.75rem)', color: '#F5EBDD', margin: 0 }}>Order Cancellation Policy</h2>
                  </div>
                </div>
                <p style={{ color: '#E8DCCB', lineHeight: '1.75', fontSize: '1rem', marginBottom: '2rem' }}>Since cookies are prepared and packed soon after payment confirmation, cancellations are accepted only within a limited time window:</p>
                <div className="tc-cancellation-timeline" style={{ marginBottom: '2rem' }}>
                  <div className="tc-timeline-item">
                    <div className="tc-timeline-badge"><span>03 HOURS</span></div>
                    <div className="tc-timeline-content">
                      <h4 style={{ color: '#F5EBDD', fontSize: '1.1rem', margin: '0 0 0.25rem', fontWeight: '700' }}>Full Refund (100%)</h4>
                      <p style={{ color: '#E8DCCB', fontSize: '0.88rem', margin: 0 }}>Cancellations requested within 3 hours of payment.</p>
                    </div>
                  </div>
                  <div className="tc-timeline-item">
                    <div className="tc-timeline-badge" style={{ backgroundColor: 'rgba(185, 205, 148, 0.2)', borderColor: 'rgba(185, 205, 148, 0.4)' }}><span>03–06 HRS</span></div>
                    <div className="tc-timeline-content">
                      <h4 style={{ color: '#F5EBDD', fontSize: '1.1rem', margin: '0 0 0.25rem', fontWeight: '700' }}>50% Refund</h4>
                      <p style={{ color: '#E8DCCB', fontSize: '0.88rem', margin: 0 }}>Cancellations requested between 3 to 6 hours after payment.</p>
                    </div>
                  </div>
                  <div className="tc-timeline-item">
                    <div className="tc-timeline-badge" style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.35)', color: '#F87171' }}><span>&gt; 06 HOURS</span></div>
                    <div className="tc-timeline-content">
                      <h4 style={{ color: '#F87171', fontSize: '1.1rem', margin: '0 0 0.25rem', fontWeight: '700' }}>Cancellation Not Possible</h4>
                      <p style={{ color: '#E8DCCB', fontSize: '0.88rem', margin: 0 }}>Baking & packing has already commenced.</p>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <p style={{ color: 'rgba(232, 220, 203, 0.85)', fontSize: '0.9rem', lineHeight: '1.6', margin: 0 }}>• The cancellation window is calculated from the exact time the payment is successfully completed.</p>
                  <p style={{ color: 'rgba(232, 220, 203, 0.85)', fontSize: '0.9rem', lineHeight: '1.6', margin: 0 }}>• Approved refunds are processed within 5–7 business days via the original payment method.</p>
                </div>
              </div>

              <div id="legal-jurisdiction" className="glass-card reveal-fade-up" style={{ padding: 'clamp(1.5rem, 4vw, 2.5rem)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: 'rgba(185, 205, 148, 0.15)', border: '1px solid rgba(185, 205, 148, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Scale size={22} color="#b9cd94" />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#b9cd94', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Section 10</span>
                    <h2 className="font-serif" style={{ fontSize: 'clamp(1.3rem, 3vw, 1.75rem)', color: '#F5EBDD', margin: 0 }}>Legal & Jurisdiction</h2>
                  </div>
                </div>
                <p style={{ color: '#E8DCCB', lineHeight: '1.75', fontSize: '1rem', margin: 0 }}>These Terms & Conditions are governed under the laws of India. Any disputes or claims arising out of or related to our services fall exclusively under the jurisdiction of the competent courts of Noida, Uttar Pradesh, India.</p>
              </div>

              <div id="support-cta" className="reveal-fade-up" style={{ backgroundColor: 'rgba(36, 79, 33, 0.35)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1.5px solid rgba(185, 205, 148, 0.4)', borderRadius: '24px', padding: 'clamp(2rem, 5vw, 3rem) clamp(1.5rem, 4vw, 2.5rem)', textAlign: 'center', boxShadow: '0 16px 40px rgba(0, 0, 0, 0.4)' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#244f21', border: '1.5px solid #b9cd94', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', boxShadow: '0 8px 20px rgba(0,0,0,0.3)' }}>
                  <MessageSquare size={26} color="#FFFFFF" />
                </div>
                <h3 className="font-serif" style={{ fontSize: 'clamp(1.4rem, 3.5vw, 2rem)', color: '#F5EBDD', marginBottom: '0.75rem' }}>Questions about our Terms & Conditions?</h3>
                <p style={{ fontSize: '1.05rem', color: '#E8DCCB', marginBottom: '1.75rem' }}>Reach us anytime on WhatsApp ❤️</p>
                <a href={getWhatsappUrl("Terms & Conditions")} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ padding: '0.9rem 2.25rem', fontSize: '1rem', fontWeight: '750', display: 'inline-flex', alignItems: 'center', gap: '0.6rem' }}>
                  <MessageSquare size={18} />
                  <span>Contact MILASTY Support</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const isShippingPage = path === '/shipping';
  const isRefundPage = path === '/refund';
  const isPrivacyPage = path === '/privacy';
  const isTcPage = path === '/terms' || path === '/';

  return (
    <div
      className="legal-page"
      style={{
        minHeight: '100vh',
        width: '100%',
        maxWidth: '100%',
        overflowX: 'hidden',
        boxSizing: 'border-box',
        position: 'relative',
        backgroundImage: 'url(/images/about_background_image.jpeg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Background Soft Grain & Warm Overlay */}
      <div 
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(135deg, rgba(20, 10, 5, 0.45) 0%, rgba(36, 19, 13, 0.35) 100%)',
          zIndex: 0,
          pointerEvents: 'none',
        }} 
      />

      <div style={{ position: 'relative', zIndex: 1, padding: '2rem 0 5rem' }}>
        {isShippingPage ? (
          renderShippingPolicy()
        ) : isRefundPage ? (
          renderRefundPolicy()
        ) : isPrivacyPage ? (
          renderPrivacyPolicy()
        ) : (
          renderTermsAndConditions()
        )}
      </div>
    </div>
  );
}
