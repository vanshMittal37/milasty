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
            backgroundColor: 'rgba(47, 107, 58, 0.10)',
            border: '1px solid rgba(47, 107, 58, 0.28)',
            marginBottom: '1.25rem'
          }}>
            <Truck size={14} color="#2F6B3A" />
            <span style={{
              fontSize: '0.75rem',
              fontWeight: '800',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: '#2F6B3A'
            }}>
              POLICY • MILASTY
            </span>
          </div>

          <h1 
            className="font-serif"
            style={{ 
              fontSize: 'clamp(2.2rem, 5vw, 3.6rem)',
              color: '#32180D',
              lineHeight: '1.15',
              marginBottom: '1rem',
              letterSpacing: '-0.01em'
            }}
          >
            Shipping & Delivery Policy
          </h1>

          <p style={{
            fontSize: 'clamp(1rem, 2vw, 1.2rem)',
            color: '#654B38',
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
            color: '#654B38',
            backgroundColor: '#FFF9F0',
            padding: '0.35rem 0.9rem',
            borderRadius: '999px',
            border: '1px solid #E4D1B7'
          }}>
            <Clock size={14} color="#2F6B3A" />
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
                backgroundColor: '#FFF9F0',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                borderRadius: '20px',
                border: '1px solid #E4D1B7',
                padding: '1.25rem 1rem',
                boxShadow: '0 12px 32px rgba(75, 45, 25, 0.08)',
                display: 'none'
              }}
              className="tc-sticky-nav"
            >
              <div style={{
                fontSize: '0.75rem',
                fontWeight: '800',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: '#2F6B3A',
                marginBottom: '1rem',
                paddingLeft: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}>
                <Sparkles size={14} color="#2F6B3A" />
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
                        color: isActive ? '#2F6B3A' : '#654B38',
                        backgroundColor: isActive ? 'rgba(47, 107, 58, 0.12)' : 'transparent',
                        textAlign: 'left',
                        width: '100%',
                        border: 'none',
                        transition: 'all 0.2s ease',
                        cursor: 'pointer'
                      }}
                    >
                      <IconComp size={15} color={isActive ? '#2F6B3A' : 'rgba(47, 107, 58, 0.75)'} />
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
                  color: '#2F6B3A',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}>
                  <Truck size={14} color="#2F6B3A" />
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
                        <span style={{ fontSize: '0.7rem', fontWeight: '800', color: '#2F6B3A', backgroundColor: 'rgba(47, 107, 58, 0.10)', padding: '0.15rem 0.5rem', borderRadius: '999px' }}>
                          STEP {st.step}
                        </span>
                        <strong style={{ fontSize: '0.9rem', color: '#32180D', lineHeight: '1.2' }}>{st.title}</strong>
                        <span style={{ fontSize: '0.78rem', color: '#654B38', opacity: 0.85 }}>{st.desc}</span>
                      </div>
                      {i < arr.length - 1 && (
                        <ArrowRight size={16} color="rgba(47, 107, 58, 0.75)" className="shipping-step-arrow" style={{ flexShrink: 0 }} />
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
                    backgroundColor: 'rgba(47, 107, 58, 0.10)',
                    border: '1px solid rgba(47, 107, 58, 0.28)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Package size={22} color="#2F6B3A" />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#2F6B3A', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Section 01</span>
                    <h2 className="font-serif" style={{ fontSize: 'clamp(1.3rem, 3vw, 1.75rem)', color: '#32180D', margin: 0 }}>
                      Shipping Coverage
                    </h2>
                  </div>
                </div>

                <p style={{ color: '#654B38', lineHeight: '1.75', fontSize: '1rem', marginBottom: '1.25rem' }}>
                  At MILASTY, we believe in serving you the freshest millet bakes. All products are baked in small, artisanal batches upon order confirmation and shipped through verified courier partners.
                </p>

                {/* Highlight Card */}
                <div style={{
                  backgroundColor: 'rgba(47, 107, 58, 0.07)',
                  borderLeft: '4px solid #2F6B3A',
                  borderRadius: '14px',
                  padding: '1.1rem 1.35rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem'
                }}>
                  <CheckCircle2 size={20} color="#2F6B3A" style={{ flexShrink: 0 }} />
                  <span style={{ color: '#32180D', fontWeight: '650', fontSize: '0.95rem', lineHeight: '1.5' }}>
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
                    backgroundColor: 'rgba(47, 107, 58, 0.10)',
                    border: '1px solid rgba(47, 107, 58, 0.28)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Clock size={22} color="#2F6B3A" />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#2F6B3A', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Section 02</span>
                    <h2 className="font-serif" style={{ fontSize: 'clamp(1.3rem, 3vw, 1.75rem)', color: '#32180D', margin: 0 }}>
                      Dispatch Timeline
                    </h2>
                  </div>
                </div>

                <p style={{ color: '#654B38', lineHeight: '1.75', fontSize: '1rem', marginBottom: '1.25rem' }}>
                  Orders are freshly prepared and dispatched within <strong style={{ color: '#2F6B3A', fontSize: '1.08rem', backgroundColor: 'rgba(47, 107, 58, 0.10)', padding: '0.1rem 0.5rem', borderRadius: '6px' }}>1–2 business days</strong> after successful payment confirmation over WhatsApp.
                </p>

                <p style={{ color: '#654B38', lineHeight: '1.75', fontSize: '1rem', margin: 0 }}>
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
                    backgroundColor: 'rgba(47, 107, 58, 0.10)',
                    border: '1px solid rgba(47, 107, 58, 0.28)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Truck size={22} color="#2F6B3A" />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#2F6B3A', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Section 03</span>
                    <h2 className="font-serif" style={{ fontSize: 'clamp(1.3rem, 3vw, 1.75rem)', color: '#32180D', margin: 0 }}>
                      Estimated Delivery Time
                    </h2>
                  </div>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))',
                  gap: '1rem',
                  marginBottom: '1.25rem'
                }}>
                  <div style={{
                    backgroundColor: '#FFF9F0',
                    border: '1px solid rgba(47, 107, 58, 0.28)',
                    borderRadius: '14px',
                    padding: '1.25rem'
                  }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#2F6B3A', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Most Indian Cities</span>
                    <h3 style={{ color: '#32180D', fontSize: '1.5rem', margin: '0.35rem 0 0.2rem', fontWeight: '800' }}>
                      3–7 business days
                    </h3>
                    <p style={{ color: '#654B38', fontSize: '0.88rem', margin: 0 }}>Standard pan-India courier delivery window</p>
                  </div>

                  <div style={{
                    backgroundColor: '#FFF9F0',
                    border: '1px solid #E4D1B7',
                    borderRadius: '14px',
                    padding: '1.25rem'
                  }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#654B38', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Remote Locations</span>
                    <h3 style={{ color: '#32180D', fontSize: '1.25rem', margin: '0.35rem 0 0.2rem', fontWeight: '700' }}>
                      May take slightly longer
                    </h3>
                    <p style={{ color: '#654B38', fontSize: '0.88rem', margin: 0 }}>Depending on regional courier access</p>
                  </div>
                </div>

                {/* Notice Box */}
                <div style={{
                  backgroundColor: '#FFF9F0',
                  border: '1px solid #E4D1B7',
                  borderRadius: '14px',
                  padding: '1.1rem 1.35rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem'
                }}>
                  <AlertCircle size={20} color="#2F6B3A" style={{ flexShrink: 0 }} />
                  <span style={{ color: '#654B38', fontSize: '0.92rem', lineHeight: '1.5' }}>
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
                    backgroundColor: 'rgba(47, 107, 58, 0.10)',
                    border: '1px solid rgba(47, 107, 58, 0.28)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <MapPin size={22} color="#2F6B3A" />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#2F6B3A', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Section 04</span>
                    <h2 className="font-serif" style={{ fontSize: 'clamp(1.3rem, 3vw, 1.75rem)', color: '#32180D', margin: 0 }}>
                      Address & Contact Details
                    </h2>
                  </div>
                </div>

                <p style={{ color: '#654B38', lineHeight: '1.75', fontSize: '1rem', marginBottom: '1.25rem' }}>
                  Please ensure that your complete shipping address, 6-digit postal pincode, landmark, and reachable contact phone number are provided accurately during ordering.
                </p>

                <p style={{ color: '#654B38', lineHeight: '1.75', fontSize: '1rem', margin: 0 }}>
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
                    backgroundColor: 'rgba(47, 107, 58, 0.10)',
                    border: '1px solid rgba(47, 107, 58, 0.28)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Smartphone size={22} color="#2F6B3A" />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#2F6B3A', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Section 05</span>
                    <h2 className="font-serif" style={{ fontSize: 'clamp(1.3rem, 3vw, 1.75rem)', color: '#32180D', margin: 0 }}>
                      Tracking Information
                    </h2>
                  </div>
                </div>

                <p style={{ color: '#654B38', lineHeight: '1.75', fontSize: '1rem', marginBottom: '1.25rem' }}>
                  Once your shipment is dispatched, courier tracking details and waybill links will be shared directly with you over WhatsApp.
                </p>

                {/* Highlight Notice Card */}
                <div style={{
                  backgroundColor: 'rgba(47, 107, 58, 0.07)',
                  borderLeft: '4px solid #2F6B3A',
                  borderRadius: '14px',
                  padding: '1.1rem 1.35rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem'
                }}>
                  <MessageSquare size={20} color="#2F6B3A" style={{ flexShrink: 0 }} />
                  <span style={{ color: '#32180D', fontWeight: '650', fontSize: '0.95rem', lineHeight: '1.5' }}>
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
                    backgroundColor: 'rgba(47, 107, 58, 0.10)',
                    border: '1px solid rgba(47, 107, 58, 0.28)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Shield size={22} color="#2F6B3A" />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#2F6B3A', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Section 06</span>
                    <h2 className="font-serif" style={{ fontSize: 'clamp(1.3rem, 3vw, 1.75rem)', color: '#32180D', margin: 0 }}>
                      Packaging & Safety
                    </h2>
                  </div>
                </div>

                <p style={{ color: '#654B38', lineHeight: '1.75', fontSize: '1rem', margin: 0 }}>
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
                    backgroundColor: 'rgba(185, 28, 28, 0.08)',
                    border: '1px solid rgba(185, 28, 28, 0.30)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <AlertTriangle size={22} color="#B91C1C" />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#B91C1C', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Section 07</span>
                    <h2 className="font-serif" style={{ fontSize: 'clamp(1.3rem, 3vw, 1.75rem)', color: '#32180D', margin: 0 }}>
                      Damaged Packages
                    </h2>
                  </div>
                </div>

                <p style={{ color: '#654B38', lineHeight: '1.75', fontSize: '1rem', marginBottom: '1.25rem' }}>
                  If your package arrives physically damaged, tampered with, or open, please notify us within <strong style={{ color: '#2F6B3A', fontSize: '1.05rem' }}>24 hours</strong> of delivery along with clear photo or video proof.
                </p>

                {/* Warm Unboxing Recommendation Notice Box */}
                <div style={{
                  backgroundColor: 'rgba(47, 107, 58, 0.07)',
                  borderLeft: '4px solid #2F6B3A',
                  borderRadius: '14px',
                  padding: '1.1rem 1.35rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Camera size={18} color="#2F6B3A" />
                    <span style={{ color: '#32180D', fontWeight: '700', fontSize: '0.95rem' }}>
                      🎥 Unboxing Video Recommendation
                    </span>
                  </div>
                  <p style={{ color: '#654B38', fontSize: '0.9rem', lineHeight: '1.6', margin: 0 }}>
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
                    backgroundColor: 'rgba(47, 107, 58, 0.10)',
                    border: '1px solid rgba(47, 107, 58, 0.28)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Archive size={22} color="#2F6B3A" />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#2F6B3A', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Section 08</span>
                    <h2 className="font-serif" style={{ fontSize: 'clamp(1.3rem, 3vw, 1.75rem)', color: '#32180D', margin: 0 }}>
                      Storage Instructions
                    </h2>
                  </div>
                </div>

                <p style={{ color: '#654B38', lineHeight: '1.75', fontSize: '1rem', marginBottom: '1rem' }}>
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
                    <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', color: '#654B38', fontSize: '0.95rem' }}>
                      <CheckCircle2 size={16} color="#2F6B3A" style={{ flexShrink: 0, marginTop: '3px' }} />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>

                {/* Highlight Box */}
                <div style={{
                  backgroundColor: 'rgba(47, 107, 58, 0.07)',
                  borderLeft: '4px solid #2F6B3A',
                  borderRadius: '14px',
                  padding: '1.1rem 1.35rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem'
                }}>
                  <Cookie size={20} color="#2F6B3A" style={{ flexShrink: 0 }} />
                  <span style={{ color: '#32180D', fontWeight: '650', fontSize: '0.95rem', lineHeight: '1.5' }}>
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
                    backgroundColor: 'rgba(47, 107, 58, 0.10)',
                    border: '1px solid rgba(47, 107, 58, 0.28)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <PackageX size={22} color="#2F6B3A" />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#2F6B3A', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Section 09</span>
                    <h2 className="font-serif" style={{ fontSize: 'clamp(1.3rem, 3vw, 1.75rem)', color: '#32180D', margin: 0 }}>
                      Delivery Attempts & Return to Origin (RTO)
                    </h2>
                  </div>
                </div>

                <p style={{ color: '#654B38', lineHeight: '1.75', fontSize: '1rem', marginBottom: '1rem' }}>
                  Courier partners make 2–3 delivery attempts before marking a shipment as RTO. Please ensure your phone is reachable and someone is available to receive the parcel.
                </p>

                <p style={{ color: '#654B38', lineHeight: '1.75', fontSize: '1rem', marginBottom: '1.25rem' }}>
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
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', color: '#654B38', fontSize: '0.92rem' }}>
                      <AlertCircle size={16} color="#2F6B3A" style={{ flexShrink: 0, marginTop: '3px' }} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                {/* Final Important Verification Notice */}
                <div style={{
                  backgroundColor: '#FFF9F0',
                  border: '1px solid rgba(47, 107, 58, 0.28)',
                  borderRadius: '14px',
                  padding: '1.1rem 1.35rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem'
                }}>
                  <MapPin size={20} color="#2F6B3A" style={{ flexShrink: 0 }} />
                  <span style={{ color: '#32180D', fontWeight: '650', fontSize: '0.92rem', lineHeight: '1.5' }}>
                    "Please verify your address and contact details carefully at checkout to avoid RTO charges and delivery delays."
                  </span>
                </div>
              </div>

              {/* SECTION 10: SUPPORT CTA CARD */}
              <div 
                id="shipping-support" 
                className="reveal-fade-up"
                style={{
                  backgroundColor: 'rgba(47, 107, 58, 0.08)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: '1.5px solid rgba(47, 107, 58, 0.35)',
                  borderRadius: '24px',
                  padding: 'clamp(2rem, 5vw, 3rem) clamp(1.5rem, 4vw, 2.5rem)',
                  textAlign: 'center',
                  boxShadow: '0 16px 40px rgba(75, 45, 25, 0.10)'
                }}
              >
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  backgroundColor: '#244f21',
                  border: '1.5px solid #2F6B3A',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.25rem',
                  boxShadow: '0 8px 20px rgba(47, 107, 58, 0.25)'
                }}>
                  <MessageSquare size={26} color="#FFFFFF" />
                </div>

                <h3 className="font-serif" style={{ fontSize: 'clamp(1.4rem, 3.5vw, 2rem)', color: '#32180D', marginBottom: '0.75rem' }}>
                  Questions about delivery?
                </h3>

                <p style={{ fontSize: '1.05rem', color: '#654B38', marginBottom: '1.75rem' }}>
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
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 1rem', borderRadius: '999px', backgroundColor: 'rgba(47, 107, 58, 0.10)', border: '1px solid rgba(47, 107, 58, 0.28)', marginBottom: '1.25rem' }}>
            <RotateCcw size={14} color="#2F6B3A" />
            <span style={{ fontSize: '0.75rem', fontWeight: '800', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#2F6B3A' }}>POLICY • MILASTY</span>
          </div>
          <h1 className="font-serif" style={{ fontSize: 'clamp(2.2rem, 5vw, 3.6rem)', color: '#32180D', lineHeight: '1.15', marginBottom: '1rem', letterSpacing: '-0.01em' }}>Refund &amp; Cancellation Policy</h1>
          <p style={{ fontSize: 'clamp(1rem, 2vw, 1.2rem)', color: '#654B38', opacity: 0.9, maxWidth: '620px', margin: '0 auto 1.5rem', lineHeight: '1.6' }}>
            Simple, fair, and transparent — because MILASTY values trust 🍪
          </p>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#654B38', backgroundColor: '#FFF9F0', padding: '0.35rem 0.9rem', borderRadius: '999px', border: '1px solid #E4D1B7' }}>
            <Clock size={14} color="#2F6B3A" />
            <span>Last Updated: January 2026</span>
          </div>
        </section>

        <div className="container" style={{ maxWidth: '1180px', margin: '0 auto', padding: '0 1.25rem 6rem', position: 'relative' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '2.5rem', alignItems: 'start' }} className="tc-layout-grid">
            <aside style={{ position: 'sticky', top: '100px', backgroundColor: '#FFF9F0', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderRadius: '20px', border: '1px solid #E4D1B7', padding: '1.25rem 1rem', boxShadow: '0 12px 32px rgba(75, 45, 25, 0.08)', display: 'none' }} className="tc-sticky-nav">
              <div style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#2F6B3A', marginBottom: '1rem', paddingLeft: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Sparkles size={14} color="#2F6B3A" />
                <span>On This Page</span>
              </div>
              <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {refundSections.map((sec) => {
                  const IconComp = sec.icon;
                  const isActive = activeSection === sec.id;
                  return (
                    <button key={sec.id} onClick={() => scrollToSection(sec.id)} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.6rem 0.75rem', borderRadius: '10px', fontSize: '0.85rem', fontWeight: isActive ? '700' : '500', color: isActive ? '#2F6B3A' : '#654B38', backgroundColor: isActive ? 'rgba(47, 107, 58, 0.12)' : 'transparent', textAlign: 'left', width: '100%', border: 'none', transition: 'all 0.2s ease', cursor: 'pointer' }}>
                      <IconComp size={15} color={isActive ? '#2F6B3A' : 'rgba(47, 107, 58, 0.75)'} />
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sec.label}</span>
                    </button>
                  );
                })}
              </nav>
            </aside>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div id="no-returns" className="glass-card reveal-fade-up" style={{ padding: 'clamp(1.5rem, 4vw, 2.5rem)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: 'rgba(47, 107, 58, 0.10)', border: '1px solid rgba(47, 107, 58, 0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Cookie size={22} color="#2F6B3A" />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#2F6B3A', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Section 01</span>
                    <h2 className="font-serif" style={{ fontSize: 'clamp(1.3rem, 3vw, 1.75rem)', color: '#32180D', margin: 0 }}>Food Products Cannot Be Returned</h2>
                  </div>
                </div>
                <p style={{ color: '#654B38', lineHeight: '1.75', fontSize: '1rem', marginBottom: '1.25rem' }}>MILASTY sells handcrafted edible food products baked fresh in small batches without artificial preservatives. For strict hygiene and food safety reasons, we do not accept returns once an order has been delivered.</p>
                <div style={{ backgroundColor: 'rgba(47, 107, 58, 0.07)', borderLeft: '4px solid #2F6B3A', borderRadius: '14px', padding: '1.1rem 1.35rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <CheckCircle2 size={20} color="#2F6B3A" style={{ flexShrink: 0 }} />
                  <span style={{ color: '#32180D', fontWeight: '650', fontSize: '0.95rem', lineHeight: '1.5' }}>"No return policy helps ensure food safety for all customers."</span>
                </div>
              </div>

              <div id="eligible-cases" className="glass-card reveal-fade-up" style={{ padding: 'clamp(1.5rem, 4vw, 2.5rem)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: 'rgba(47, 107, 58, 0.10)', border: '1px solid rgba(47, 107, 58, 0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Package size={22} color="#2F6B3A" />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#2F6B3A', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Section 02</span>
                    <h2 className="font-serif" style={{ fontSize: 'clamp(1.3rem, 3vw, 1.75rem)', color: '#32180D', margin: 0 }}>When Replacement or Refund is Possible</h2>
                  </div>
                </div>
                <p style={{ color: '#654B38', lineHeight: '1.75', fontSize: '1rem', marginBottom: '1.25rem' }}>We will happily provide an immediate replacement or full refund in genuine issue cases such as:</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {["Product received in physically damaged condition during transit", "Wrong product or item variant delivered", "Package arrived tampered with or outer seal opened prior to delivery"].map((text, i) => (
                    <div key={i} style={{ backgroundColor: '#FFF9F0', border: '1px solid #E4D1B7', borderRadius: '12px', padding: '0.9rem 1.1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <Sparkles size={18} color="#2F6B3A" style={{ flexShrink: 0 }} />
                      <span style={{ color: '#654B38', fontSize: '0.95rem', fontWeight: '500' }}>{text}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div id="time-limit" className="glass-card reveal-fade-up" style={{ padding: 'clamp(1.5rem, 4vw, 2.5rem)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: 'rgba(47, 107, 58, 0.10)', border: '1px solid rgba(47, 107, 58, 0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Clock size={22} color="#2F6B3A" />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#2F6B3A', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Section 03</span>
                    <h2 className="font-serif" style={{ fontSize: 'clamp(1.3rem, 3vw, 1.75rem)', color: '#32180D', margin: 0 }}>Reporting Time Limit</h2>
                  </div>
                </div>
                <p style={{ color: '#654B38', lineHeight: '1.75', fontSize: '1rem', marginBottom: '1.25rem' }}>If there is any issue with your delivered shipment, please inform our WhatsApp support team within <strong style={{ color: '#2F6B3A', fontSize: '1.05rem' }}>24 hours of delivery</strong>.</p>
                <div style={{ backgroundColor: 'rgba(47, 107, 58, 0.07)', borderLeft: '4px solid #2F6B3A', borderRadius: '14px', padding: '1.1rem 1.35rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <Camera size={20} color="#2F6B3A" style={{ flexShrink: 0 }} />
                  <span style={{ color: '#32180D', fontWeight: '650', fontSize: '0.95rem', lineHeight: '1.5' }}>"Photo or video proof is required for faster resolution."</span>
                </div>
              </div>

              <div id="courier-issues" className="glass-card reveal-fade-up" style={{ padding: 'clamp(1.5rem, 4vw, 2.5rem)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: 'rgba(47, 107, 58, 0.10)', border: '1px solid rgba(47, 107, 58, 0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Truck size={22} color="#2F6B3A" />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#2F6B3A', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Section 04</span>
                    <h2 className="font-serif" style={{ fontSize: 'clamp(1.3rem, 3vw, 1.75rem)', color: '#32180D', margin: 0 }}>Courier Damages & Delays</h2>
                  </div>
                </div>
                <p style={{ color: '#654B38', lineHeight: '1.75', fontSize: '1rem', marginBottom: '1rem' }}>All MILASTY products are securely packed in protective corrugated boxes before dispatch. However, transit delays or severe package handling damage caused by third-party courier services may occasionally occur.</p>
                <p style={{ color: '#654B38', lineHeight: '1.75', fontSize: '1rem', margin: 0 }}>In case of transit damage, we coordinate directly with courier management to file claims and re-dispatch fresh bakery boxes to you at the earliest possible window.</p>
              </div>

              <div id="unboxing-video" className="glass-card reveal-fade-up" style={{ padding: 'clamp(1.5rem, 4vw, 2.5rem)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: 'rgba(47, 107, 58, 0.10)', border: '1px solid rgba(47, 107, 58, 0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Camera size={22} color="#2F6B3A" />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#2F6B3A', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Section 05</span>
                    <h2 className="font-serif" style={{ fontSize: 'clamp(1.3rem, 3vw, 1.75rem)', color: '#32180D', margin: 0 }}>Unboxing Video Requirement (Mandatory)</h2>
                  </div>
                </div>
                <p style={{ color: '#654B38', lineHeight: '1.75', fontSize: '1rem', marginBottom: '1.25rem' }}>To claim a replacement for transit damage or missing items, an unedited 360° unboxing video recorded while opening the outer shipping seal is mandatory. Please WhatsApp the video to +91 89271 42056 within 24 hours of delivery.</p>
                <div style={{ backgroundColor: 'rgba(47, 107, 58, 0.07)', borderLeft: '4px solid #2F6B3A', borderRadius: '14px', padding: '1.1rem 1.35rem', display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1rem' }}>
                  <CheckCircle2 size={20} color="#2F6B3A" style={{ flexShrink: 0 }} />
                  <span style={{ color: '#32180D', fontWeight: '650', fontSize: '0.95rem', lineHeight: '1.5' }}>"An unboxing video helps us verify courier-related damage quickly and process replacements or refunds faster."</span>
                </div>
                <div style={{ backgroundColor: 'rgba(185, 28, 28, 0.06)', borderLeft: '4px solid #B91C1C', borderRadius: '14px', padding: '1.1rem 1.35rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <AlertCircle size={20} color="#B91C1C" style={{ flexShrink: 0 }} />
                  <span style={{ color: '#32180D', fontWeight: '650', fontSize: '0.92rem', lineHeight: '1.5' }}>Orders marked as “Delivered” by the courier partner will not be eligible for refund unless a valid damage claim with unboxing video proof is submitted within 24 hours.</span>
                </div>
              </div>

              <div id="refund-timeline" className="glass-card reveal-fade-up" style={{ padding: 'clamp(1.5rem, 4vw, 2.5rem)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: 'rgba(47, 107, 58, 0.10)', border: '1px solid rgba(47, 107, 58, 0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <CreditCard size={22} color="#2F6B3A" />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#2F6B3A', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Section 06</span>
                    <h2 className="font-serif" style={{ fontSize: 'clamp(1.3rem, 3vw, 1.75rem)', color: '#32180D', margin: 0 }}>Refund Timeline</h2>
                  </div>
                </div>
                <p style={{ color: '#654B38', lineHeight: '1.75', fontSize: '1rem', margin: 0 }}>Once your refund claim is inspected and approved by our team, the amount will be processed within <strong style={{ color: '#2F6B3A', fontSize: '1.1rem', backgroundColor: 'rgba(47, 107, 58, 0.10)', padding: '0.1rem 0.5rem', borderRadius: '6px' }}>5–7 business days</strong> back to your original payment method (UPI / Bank Transfer).</p>
              </div>

              <div id="cancellation-policy" className="glass-card reveal-fade-up" style={{ padding: 'clamp(1.5rem, 4vw, 2.5rem)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: 'rgba(47, 107, 58, 0.10)', border: '1px solid rgba(47, 107, 58, 0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <XCircle size={22} color="#2F6B3A" />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#2F6B3A', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Section 07</span>
                    <h2 className="font-serif" style={{ fontSize: 'clamp(1.3rem, 3vw, 1.75rem)', color: '#32180D', margin: 0 }}>Order Cancellation Policy</h2>
                  </div>
                </div>
                <p style={{ color: '#654B38', lineHeight: '1.75', fontSize: '1rem', marginBottom: '1.5rem' }}>
                  Since our millet cookies are prepared and packed soon after payment confirmation, cancellations are accepted only within the first 3 hours:
                </p>
                <div className="tc-cancellation-timeline" style={{ marginBottom: '1.5rem' }}>
                  <div className="tc-timeline-item">
                    <div className="tc-timeline-badge"><span>0–3 HOURS</span></div>
                    <div className="tc-timeline-content">
                      <h4 style={{ color: '#32180D', fontSize: '1.1rem', margin: '0 0 0.25rem', fontWeight: '700' }}>Easy Cancellation &amp; Refund ✓</h4>
                      <p style={{ color: '#654B38', fontSize: '0.88rem', margin: 0, lineHeight: '1.6' }}>
                        Cancellations requested within 3 hours of placing the order are eligible for a refund after deducting a 10% cancellation charge on the product amount only. Delivery charges are excluded from the cancellation charge and refunded where applicable.
                      </p>
                    </div>
                  </div>
                  <div className="tc-timeline-item">
                    <div className="tc-timeline-badge" style={{ backgroundColor: 'rgba(185, 28, 28, 0.08)', borderColor: 'rgba(185, 28, 28, 0.30)', color: '#B91C1C' }}><span>AFTER 3 HOURS</span></div>
                    <div className="tc-timeline-content">
                      <h4 style={{ color: '#B91C1C', fontSize: '1.1rem', margin: '0 0 0.25rem', fontWeight: '700' }}>Cancellation Window Closed ✕</h4>
                      <p style={{ color: '#654B38', fontSize: '0.88rem', margin: 0, lineHeight: '1.6' }}>
                        Cancellations and refunds for change of mind are not accepted after 3 hours, as small-batch baking and dispatch preparation may have commenced.
                      </p>
                    </div>
                  </div>
                </div>

                <p style={{ color: '#654B38', fontSize: '0.92rem', lineHeight: '1.65', margin: '1rem 0' }}>
                  Exceptions apply where a refund or other remedy is required under applicable consumer protection laws.
                </p>

                {/* Automatic status transition notice */}
                <div style={{
                  backgroundColor: 'rgba(47, 107, 58, 0.07)',
                  borderLeft: '4px solid #2F6B3A',
                  borderRadius: '12px',
                  padding: '1rem 1.25rem',
                  marginTop: '1.5rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem'
                }}>
                  <Clock size={18} color="#2F6B3A" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div style={{ fontSize: '0.88rem', color: '#654B38', lineHeight: '1.55' }}>
                    <strong style={{ color: '#2B140B' }}>Automatic Order Progression:</strong> After 3 hours, the order status automatically changes from “Confirmed” to “Processing”, along with disabling the cancel option.
                  </div>
                </div>
              </div>

              <div id="rto-refusal" className="glass-card reveal-fade-up" style={{ padding: 'clamp(1.5rem, 4vw, 2.5rem)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: 'rgba(47, 107, 58, 0.10)', border: '1px solid rgba(47, 107, 58, 0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <PackageX size={22} color="#2F6B3A" />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#2F6B3A', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Section 08</span>
                    <h2 className="font-serif" style={{ fontSize: 'clamp(1.3rem, 3vw, 1.75rem)', color: '#32180D', margin: 0 }}>Return to Origin (RTO) & Delivery Refusal</h2>
                  </div>
                </div>
                <p style={{ color: '#654B38', lineHeight: '1.75', fontSize: '1rem', marginBottom: '1.25rem' }}>If a package is returned to our bakery facility due to:</p>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem 0', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {["Customer being unavailable at the specified address after multiple attempts", "Incorrect or incomplete shipping address provided during ordering", "Unreachable contact phone number provided", "Refusal to accept the delivery parcel upon courier arrival"].map((bullet, idx) => (
                    <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', fontSize: '0.92rem', color: '#654B38' }}>
                      <CheckCircle2 size={16} color="#2F6B3A" style={{ flexShrink: 0, marginTop: '3px' }} />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
                <div style={{ backgroundColor: '#FFF9F0', border: '1px solid #E4D1B7', borderRadius: '14px', padding: '1.1rem 1.35rem' }}>
                  <p style={{ color: '#654B38', fontSize: '0.9rem', lineHeight: '1.6', margin: '0 0 0.5rem' }}>• Deductions will be made for two-way courier shipping costs incurred during RTO shipments.</p>
                  <p style={{ color: '#654B38', fontSize: '0.9rem', lineHeight: '1.6', margin: '0 0 0.5rem' }}>• Returned edible parcels undergo mandatory quality inspection before any partial refund or re-dispatch is considered.</p>
                  <p style={{ color: '#654B38', fontSize: '0.9rem', lineHeight: '1.6', margin: 0 }}>• Additional shipping charges will apply for re-dispatching RTO parcels to corrected addresses.</p>
                </div>
              </div>

              <div id="refund-support" className="reveal-fade-up" style={{ backgroundColor: 'rgba(47, 107, 58, 0.08)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1.5px solid rgba(47, 107, 58, 0.35)', borderRadius: '24px', padding: 'clamp(2rem, 5vw, 3rem) clamp(1.5rem, 4vw, 2.5rem)', textAlign: 'center', boxShadow: '0 16px 40px rgba(75, 45, 25, 0.10)' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#244f21', border: '1.5px solid #2F6B3A', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', boxShadow: '0 8px 20px rgba(47, 107, 58, 0.25)' }}>
                  <MessageSquare size={26} color="#FFFFFF" />
                </div>
                <h3 className="font-serif" style={{ fontSize: 'clamp(1.4rem, 3.5vw, 2rem)', color: '#32180D', marginBottom: '0.75rem' }}>Facing an issue with your order?</h3>
                <p style={{ fontSize: '1.05rem', color: '#654B38', marginBottom: '1.75rem' }}>We'll make it right ❤️</p>
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
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 1rem', borderRadius: '999px', backgroundColor: 'rgba(47, 107, 58, 0.10)', border: '1px solid rgba(47, 107, 58, 0.28)', marginBottom: '1.25rem' }}>
            <ShieldCheck size={14} color="#2F6B3A" />
            <span style={{ fontSize: '0.75rem', fontWeight: '800', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#2F6B3A' }}>LEGAL • MILASTY</span>
          </div>
          <h1 className="font-serif" style={{ fontSize: 'clamp(2.2rem, 5vw, 3.6rem)', color: '#32180D', lineHeight: '1.15', marginBottom: '1rem', letterSpacing: '-0.01em' }}>Privacy Policy</h1>
          <p style={{ fontSize: 'clamp(1rem, 2vw, 1.2rem)', color: '#654B38', opacity: 0.9, maxWidth: '620px', margin: '0 auto 1.5rem', lineHeight: '1.6' }}>
            Your trust matters. Here's exactly how MILASTY handles your data.
          </p>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#654B38', backgroundColor: '#FFF9F0', padding: '0.35rem 0.9rem', borderRadius: '999px', border: '1px solid #E4D1B7' }}>
            <Clock size={14} color="#2F6B3A" />
            <span>Last Updated: January 2026</span>
          </div>
        </section>

        <div className="container" style={{ maxWidth: '1180px', margin: '0 auto', padding: '0 1.25rem 6rem', position: 'relative' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '2.5rem', alignItems: 'start' }} className="tc-layout-grid">
            <aside style={{ position: 'sticky', top: '100px', backgroundColor: '#FFF9F0', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderRadius: '20px', border: '1px solid #E4D1B7', padding: '1.25rem 1rem', boxShadow: '0 12px 32px rgba(75, 45, 25, 0.08)', display: 'none' }} className="tc-sticky-nav">
              <div style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#2F6B3A', marginBottom: '1rem', paddingLeft: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Sparkles size={14} color="#2F6B3A" />
                <span>On This Page</span>
              </div>
              <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {privacySections.map((sec) => {
                  const IconComp = sec.icon;
                  const isActive = activeSection === sec.id;
                  return (
                    <button key={sec.id} onClick={() => scrollToSection(sec.id)} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.6rem 0.75rem', borderRadius: '10px', fontSize: '0.85rem', fontWeight: isActive ? '700' : '500', color: isActive ? '#2F6B3A' : '#654B38', backgroundColor: isActive ? 'rgba(47, 107, 58, 0.12)' : 'transparent', textAlign: 'left', width: '100%', border: 'none', transition: 'all 0.2s ease', cursor: 'pointer' }}>
                      <IconComp size={15} color={isActive ? '#2F6B3A' : 'rgba(47, 107, 58, 0.75)'} />
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sec.label}</span>
                    </button>
                  );
                })}
              </nav>
            </aside>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div id="promise" className="glass-card reveal-fade-up" style={{ padding: 'clamp(1.5rem, 4vw, 2.5rem)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: 'rgba(47, 107, 58, 0.10)', border: '1px solid rgba(47, 107, 58, 0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Leaf size={22} color="#2F6B3A" />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#2F6B3A', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Section 01</span>
                    <h2 className="font-serif" style={{ fontSize: 'clamp(1.3rem, 3vw, 1.75rem)', color: '#32180D', margin: 0 }}>Our Promise</h2>
                  </div>
                </div>
                <p style={{ color: '#654B38', lineHeight: '1.75', fontSize: '1rem', marginBottom: '1.25rem' }}>MILASTY deeply respects your privacy. We collect only the minimum personal information required to deliver your fresh artisan cookies safely to your doorstep and provide you with seamless customer support.</p>
                <div style={{ backgroundColor: 'rgba(47, 107, 58, 0.07)', borderLeft: '4px solid #2F6B3A', borderRadius: '14px', padding: '1.1rem 1.35rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <CheckCircle2 size={20} color="#2F6B3A" style={{ flexShrink: 0 }} />
                  <span style={{ color: '#32180D', fontWeight: '650', fontSize: '0.95rem', lineHeight: '1.5' }}>"We do not sell or misuse your personal data — ever."</span>
                </div>
              </div>

              <div id="data-collected" className="glass-card reveal-fade-up" style={{ padding: 'clamp(1.5rem, 4vw, 2.5rem)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: 'rgba(47, 107, 58, 0.10)', border: '1px solid rgba(47, 107, 58, 0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <FileSpreadsheet size={22} color="#2F6B3A" />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#2F6B3A', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Section 02</span>
                    <h2 className="font-serif" style={{ fontSize: 'clamp(1.3rem, 3vw, 1.75rem)', color: '#32180D', margin: 0 }}>What Information We Collect</h2>
                  </div>
                </div>
                <p style={{ color: '#654B38', lineHeight: '1.75', fontSize: '1rem', marginBottom: '1.25rem' }}>When you place an order through WhatsApp or reach out to our team for inquiries, we may collect:</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '0.85rem' }}>
                  {["Your name", "Your phone number", "Your delivery address & pincode", "Order details (products & quantity)", "Payment confirmation (transaction reference only)"].map((item, idx) => (
                    <div key={idx} style={{ backgroundColor: '#FFF9F0', border: '1px solid #E4D1B7', borderRadius: '12px', padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <Sparkles size={16} color="#2F6B3A" style={{ flexShrink: 0 }} />
                      <span style={{ fontSize: '0.9rem', color: '#654B38', fontWeight: '500' }}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div id="purpose" className="glass-card reveal-fade-up" style={{ padding: 'clamp(1.5rem, 4vw, 2.5rem)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: 'rgba(47, 107, 58, 0.10)', border: '1px solid rgba(47, 107, 58, 0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Cookie size={22} color="#2F6B3A" />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#2F6B3A', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Section 03</span>
                    <h2 className="font-serif" style={{ fontSize: 'clamp(1.3rem, 3vw, 1.75rem)', color: '#32180D', margin: 0 }}>Why We Collect This Data</h2>
                  </div>
                </div>
                <p style={{ color: '#654B38', lineHeight: '1.75', fontSize: '1rem', marginBottom: '1.25rem' }}>We collect this information strictly for genuine business purposes such as:</p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {["Confirming your small-batch bakery order", "Shipping cookies to your exact delivery address", "Providing real-time order updates via WhatsApp", "Assisting with customer support and resolving delivery queries"].map((text, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', fontSize: '0.95rem', color: '#654B38' }}>
                      <CheckCircle2 size={18} color="#2F6B3A" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span>{text}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div id="courier-sharing" className="glass-card reveal-fade-up" style={{ padding: 'clamp(1.5rem, 4vw, 2.5rem)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: 'rgba(47, 107, 58, 0.10)', border: '1px solid rgba(47, 107, 58, 0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Truck size={22} color="#2F6B3A" />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#2F6B3A', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Section 04</span>
                    <h2 className="font-serif" style={{ fontSize: 'clamp(1.3rem, 3vw, 1.75rem)', color: '#32180D', margin: 0 }}>Sharing Information With Courier Partners</h2>
                  </div>
                </div>
                <p style={{ color: '#654B38', lineHeight: '1.75', fontSize: '1rem', marginBottom: '1.25rem' }}>To deliver your fresh bakery order safely across India, we share limited necessary information — such as your recipient name, phone number, and delivery shipping address — with our trusted courier logistics partners.</p>
                <div style={{ backgroundColor: 'rgba(47, 107, 58, 0.07)', borderLeft: '4px solid #2F6B3A', borderRadius: '14px', padding: '1.1rem 1.35rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <PackageCheck size={20} color="#2F6B3A" style={{ flexShrink: 0 }} />
                  <span style={{ color: '#32180D', fontWeight: '650', fontSize: '0.95rem', lineHeight: '1.5' }}>"Courier partners receive only what is necessary for delivery."</span>
                </div>
              </div>

              <div id="data-protection" className="glass-card reveal-fade-up" style={{ padding: 'clamp(1.5rem, 4vw, 2.5rem)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: 'rgba(47, 107, 58, 0.10)', border: '1px solid rgba(47, 107, 58, 0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Lock size={22} color="#2F6B3A" />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#2F6B3A', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Section 05</span>
                    <h2 className="font-serif" style={{ fontSize: 'clamp(1.3rem, 3vw, 1.75rem)', color: '#32180D', margin: 0 }}>How We Protect Your Information</h2>
                  </div>
                </div>
                <p style={{ color: '#654B38', lineHeight: '1.75', fontSize: '1rem', marginBottom: '1.25rem' }}>MILASTY takes customer privacy and data security seriously. We strictly enforce that:</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {["Your information is accessed only by authorized MILASTY operations personnel", "Order details are used solely for fulfilling your shipment and providing customer care", "We NEVER record, store, or handle sensitive card details, CVVs, or banking credentials"].map((rule, idx) => (
                    <div key={idx} style={{ backgroundColor: '#FFF9F0', border: '1px solid #E4D1B7', borderRadius: '12px', padding: '1rem 1.15rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                      <Lock size={18} color="#2F6B3A" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span style={{ color: '#654B38', fontSize: '0.92rem', lineHeight: '1.5' }}>{rule}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div id="marketing" className="glass-card reveal-fade-up" style={{ padding: 'clamp(1.5rem, 4vw, 2.5rem)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: 'rgba(47, 107, 58, 0.10)', border: '1px solid rgba(47, 107, 58, 0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Megaphone size={22} color="#2F6B3A" />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#2F6B3A', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Section 06</span>
                    <h2 className="font-serif" style={{ fontSize: 'clamp(1.3rem, 3vw, 1.75rem)', color: '#32180D', margin: 0 }}>Marketing Communication</h2>
                  </div>
                </div>
                <p style={{ color: '#654B38', lineHeight: '1.75', fontSize: '1rem', marginBottom: '1.25rem' }}>We may occasionally send updates regarding new seasonal MILASTY bakes, special artisan offers, or health tips. You can opt out at any time by simply messaging us "STOP" on WhatsApp.</p>
                <div style={{ backgroundColor: 'rgba(47, 107, 58, 0.07)', borderLeft: '4px solid #2F6B3A', borderRadius: '14px', padding: '1.1rem 1.35rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <Megaphone size={20} color="#2F6B3A" style={{ flexShrink: 0 }} />
                  <span style={{ color: '#32180D', fontWeight: '650', fontSize: '0.95rem', lineHeight: '1.5' }}>"No spam. Only meaningful updates, and only if you're comfortable."</span>
                </div>
              </div>

              <div id="your-rights" className="glass-card reveal-fade-up" style={{ padding: 'clamp(1.5rem, 4vw, 2.5rem)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: 'rgba(47, 107, 58, 0.10)', border: '1px solid rgba(47, 107, 58, 0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <UserCheck size={22} color="#2F6B3A" />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#2F6B3A', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Section 07</span>
                    <h2 className="font-serif" style={{ fontSize: 'clamp(1.3rem, 3vw, 1.75rem)', color: '#32180D', margin: 0 }}>Your Rights</h2>
                  </div>
                </div>
                <p style={{ color: '#654B38', lineHeight: '1.75', fontSize: '1rem', marginBottom: '1.25rem' }}>You retain full control over your personal data at all times. You have the right to request:</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '1rem' }}>
                  {[{ title: "Right to Inspect", desc: "To see what contact and order data we hold about you" }, { title: "Right to Correct", desc: "Correction of any incomplete or inaccurate delivery details" }, { title: "Right to Deletion", desc: "Deletion of your personal details after your order fulfillment" }].map((right, index) => (
                    <div key={index} style={{ backgroundColor: '#FFF9F0', border: '1px solid #E4D1B7', borderRadius: '14px', padding: '1.15rem' }}>
                      <h4 style={{ color: '#2F6B3A', fontSize: '1rem', marginBottom: '0.35rem', fontWeight: '700' }}>{right.title}</h4>
                      <p style={{ color: '#654B38', fontSize: '0.88rem', margin: 0, lineHeight: '1.5' }}>{right.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div id="cookies-tracking" className="glass-card reveal-fade-up" style={{ padding: 'clamp(1.5rem, 4vw, 2.5rem)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: 'rgba(47, 107, 58, 0.10)', border: '1px solid rgba(47, 107, 58, 0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Globe2 size={22} color="#2F6B3A" />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#2F6B3A', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Section 08</span>
                    <h2 className="font-serif" style={{ fontSize: 'clamp(1.3rem, 3vw, 1.75rem)', color: '#32180D', margin: 0 }}>Website Cookies & Tracking</h2>
                  </div>
                </div>
                <p style={{ color: '#654B38', lineHeight: '1.75', fontSize: '1rem', margin: 0 }}>The MILASTY website is designed as an informational brand platform and does not use invasive third-party tracking cookies or collect unnecessary browser history data.</p>
              </div>

              <div id="policy-updates" className="glass-card reveal-fade-up" style={{ padding: 'clamp(1.5rem, 4vw, 2.5rem)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: 'rgba(47, 107, 58, 0.10)', border: '1px solid rgba(47, 107, 58, 0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Scale size={22} color="#2F6B3A" />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#2F6B3A', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Section 09</span>
                    <h2 className="font-serif" style={{ fontSize: 'clamp(1.3rem, 3vw, 1.75rem)', color: '#32180D', margin: 0 }}>Policy Updates</h2>
                  </div>
                </div>
                <p style={{ color: '#654B38', lineHeight: '1.75', fontSize: '1rem', margin: 0 }}>This Privacy Policy may be updated occasionally to reflect operational or regulatory improvements. Any revisions will be posted directly on this page with an updated effective date.</p>
              </div>

              <div id="privacy-support" className="reveal-fade-up" style={{ backgroundColor: 'rgba(47, 107, 58, 0.08)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1.5px solid rgba(47, 107, 58, 0.35)', borderRadius: '24px', padding: 'clamp(2rem, 5vw, 3rem) clamp(1.5rem, 4vw, 2.5rem)', textAlign: 'center', boxShadow: '0 16px 40px rgba(75, 45, 25, 0.10)' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#244f21', border: '1.5px solid #2F6B3A', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', boxShadow: '0 8px 20px rgba(47, 107, 58, 0.25)' }}>
                  <MessageSquare size={26} color="#FFFFFF" />
                </div>
                <h3 className="font-serif" style={{ fontSize: 'clamp(1.4rem, 3.5vw, 2rem)', color: '#32180D', marginBottom: '0.75rem' }}>Questions about your privacy or data?</h3>
                <p style={{ fontSize: '1.05rem', color: '#654B38', marginBottom: '1.75rem' }}>Message us anytime ❤️</p>
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
      { id: 'products-quality', label: '2. Products & Quality', icon: Cookie },
      { id: 'allergies', label: '3. Ingredients & Allergens', icon: AlertTriangle },
      { id: 'placing-order', label: '4. Placing an Order', icon: MessageSquare },
      { id: 'pricing-payments', label: '5. Pricing & Payments', icon: CreditCard },
      { id: 'custom-orders', label: '6. Customised Orders', icon: Sparkles },
      { id: 'shipping', label: '7. Shipping & Delivery', icon: Truck },
      { id: 'returns-refunds', label: '8. Cancellations & Refunds', icon: RotateCcw },
      { id: 'cancellation', label: '9. Grievance Redressal', icon: PhoneCall },
      { id: 'privacy', label: '10. Your Privacy', icon: Lock },
      { id: 'website-experience', label: '11. Website Experience', icon: Globe2 },
      { id: 'brand', label: '12. Respecting Our Brand', icon: Shield },
      { id: 'changes', label: '13. Changes to Terms', icon: FileText },
      { id: 'legal-jurisdiction', label: '14. Governing Law', icon: Scale },
      { id: 'policies-overview', label: '15. Our Policies', icon: FileSpreadsheet },
      { id: 'support-cta', label: '16. Contact MILASTY', icon: PhoneCall },
    ];

    return (
      <div style={{ position: 'relative' }}>
        <section className="reveal-fade-up" style={{ padding: '4.5rem 1.25rem 3rem', textAlign: 'center', maxWidth: '850px', margin: '0 auto', position: 'relative' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 1rem', borderRadius: '999px', backgroundColor: 'rgba(47, 107, 58, 0.10)', border: '1px solid rgba(47, 107, 58, 0.28)', marginBottom: '1.25rem' }}>
            <FileText size={14} color="#2F6B3A" />
            <span style={{ fontSize: '0.75rem', fontWeight: '800', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#2F6B3A' }}>LEGAL • MILASTY</span>
          </div>
          <h1 className="font-serif" style={{ fontSize: 'clamp(2.2rem, 5vw, 3.6rem)', color: '#32180D', lineHeight: '1.15', marginBottom: '1rem', letterSpacing: '-0.01em' }}>Terms &amp; Conditions</h1>
          <p style={{ fontSize: 'clamp(1rem, 2vw, 1.2rem)', color: '#654B38', opacity: 0.9, maxWidth: '620px', margin: '0 auto 1.5rem', lineHeight: '1.6' }}>
            Clear, honest and transparent — because great taste and thoughtful ingredients belong together.
          </p>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#654B38', backgroundColor: '#FFF9F0', padding: '0.35rem 0.9rem', borderRadius: '999px', border: '1px solid #E4D1B7' }}>
            <Clock size={14} color="#2F6B3A" />
            <span>Last Updated: October 2026</span>
          </div>
        </section>

        <div className="container" style={{ maxWidth: '1180px', margin: '0 auto', padding: '0 clamp(0.75rem, 3vw, 1.25rem) 6rem', position: 'relative' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '2.5rem', alignItems: 'start' }} className="tc-layout-grid">
            <aside style={{ position: 'sticky', top: '100px', backgroundColor: '#FFF9F0', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderRadius: '20px', border: '1px solid #E4D1B7', padding: '1.25rem 1rem', boxShadow: '0 12px 32px rgba(75, 45, 25, 0.08)', display: 'none' }} className="tc-sticky-nav">
              <div style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#2F6B3A', marginBottom: '1rem', paddingLeft: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Sparkles size={14} color="#2F6B3A" />
                <span>On This Page</span>
              </div>
              <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {tcSections.map((sec) => {
                  const IconComp = sec.icon;
                  const isActive = activeSection === sec.id;
                  return (
                    <button key={sec.id} onClick={() => scrollToSection(sec.id)} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.6rem 0.75rem', borderRadius: '10px', fontSize: '0.85rem', fontWeight: isActive ? '700' : '500', color: isActive ? '#2F6B3A' : '#654B38', backgroundColor: isActive ? 'rgba(47, 107, 58, 0.12)' : 'transparent', textAlign: 'left', width: '100%', border: 'none', transition: 'all 0.2s ease', cursor: 'pointer' }}>
                      <IconComp size={15} color={isActive ? '#2F6B3A' : 'rgba(47, 107, 58, 0.75)'} />
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sec.label}</span>
                    </button>
                  );
                })}
              </nav>
            </aside>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

              {/* WELCOME INTRO */}
              <div className="glass-card reveal-fade-up" style={{ padding: 'clamp(1.5rem, 4vw, 2.5rem)', background: 'linear-gradient(135deg, rgba(47, 107, 58, 0.06) 0%, rgba(255, 249, 240, 0.95) 100%)', border: '1.5px solid rgba(47, 107, 58, 0.2)' }}>
                <p style={{ color: '#654B38', lineHeight: '1.85', fontSize: '1rem', margin: 0 }}>
                  Welcome to <strong style={{ color: '#2F6B3A' }}>MILASTY</strong>. At MILASTY, we believe that great taste and thoughtful ingredients belong together. From our millet cookies and crackers to brownies, customised bakes and gifting collections, we put care into the products we create and the experience we offer.
                  <br /><br />
                  We value the trust you place in us. These Terms &amp; Conditions explain how ordering from MILASTY works, what you can expect from us, and how we aim to make your experience clear, convenient and enjoyable.
                  <br /><br />
                  By accessing our website or placing an order through our authorised direct consumer channels, you agree to these Terms &amp; Conditions.
                </p>
              </div>

              {/* SECTION 1: ABOUT MILASTY */}
              <div id="about" className="glass-card reveal-fade-up" style={{ padding: 'clamp(1.5rem, 4vw, 2.5rem)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: 'rgba(47, 107, 58, 0.10)', border: '1px solid rgba(47, 107, 58, 0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Leaf size={22} color="#2F6B3A" />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#2F6B3A', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Section 01</span>
                    <h2 className="font-serif" style={{ fontSize: 'clamp(1.3rem, 3vw, 1.75rem)', color: '#32180D', margin: 0 }}>About MILASTY</h2>
                  </div>
                </div>
                <p style={{ color: '#654B38', lineHeight: '1.75', fontSize: '1rem', marginBottom: '1.25rem' }}>MILASTY is a founder-led Indian millet-bakes brand operated as a sole proprietorship by <strong style={{ color: '#32180D' }}>Anwesha Chakraborty</strong>. Our products include millet cookies, crackers, brownies, customised cakes, gift hampers and other baked goods introduced from time to time.</p>
                <p style={{ color: '#654B38', lineHeight: '1.75', fontSize: '1rem', marginBottom: '1.5rem' }}>These Terms apply to consumer purchases made through <strong style={{ color: '#2F6B3A' }}>www.milasty.com</strong> and our authorised direct ordering channels, including WhatsApp. Wholesale, distribution, retail-reseller, corporate gifting and other business-to-business orders are governed by separate terms or agreements.</p>
                <div className="tc-info-box">
                  <div className="tc-info-box-header">
                    <FileSpreadsheet size={18} color="#2F6B3A" />
                    <span className="tc-info-box-title">Business Details</span>
                  </div>
                  {[
                    { label: 'Business Name', value: 'MILASTY', type: 'text' },
                    { label: 'Legal Proprietor', value: 'Anwesha Chakraborty', type: 'text' },
                    { label: 'Address', value: 'B3-1503, Amrapali Golf Homes, Sector 4, Greater Noida West, Gautam Buddha Nagar, Uttar Pradesh - 201016', type: 'text' },
                    { label: 'Support Email', value: 'milasty.cookies@gmail.com', type: 'email' },
                    { label: 'Phone / WhatsApp', value: '8927142056', type: 'phone' },
                    { label: 'FSSAI Licence', value: '22726446000086', type: 'text' },
                  ].map((item, i) => (
                    <div key={i} className="tc-info-row">
                      <span className="tc-info-label">{item.label}:</span>
                      <span className="tc-info-value">
                        {item.type === 'email' ? (
                          <a href={`mailto:${item.value}`}>{item.value}</a>
                        ) : item.type === 'phone' ? (
                          <a href={`tel:${item.value}`}>+91 {item.value}</a>
                        ) : (
                          item.value
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION 2: PRODUCTS & QUALITY */}
              <div id="products-quality" className="glass-card reveal-fade-up" style={{ padding: 'clamp(1.5rem, 4vw, 2.5rem)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: 'rgba(47, 107, 58, 0.10)', border: '1px solid rgba(47, 107, 58, 0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Cookie size={22} color="#2F6B3A" />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#2F6B3A', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Section 02</span>
                    <h2 className="font-serif" style={{ fontSize: 'clamp(1.3rem, 3vw, 1.75rem)', color: '#32180D', margin: 0 }}>Our Products &amp; Quality Commitment</h2>
                  </div>
                </div>
                <p style={{ color: '#654B38', lineHeight: '1.75', fontSize: '1rem', marginBottom: '1rem' }}>We aim to provide accurate information about our products so that you can make an informed choice. Product descriptions, photographs, ingredients, pack sizes, net quantities, prices and other relevant details are displayed to help you understand what you are purchasing.</p>
                <p style={{ color: '#654B38', lineHeight: '1.75', fontSize: '1rem', marginBottom: '1rem' }}>As some of our products are prepared and baked in batches, minor variations in shape, colour, texture or appearance may occur. We make reasonable efforts to ensure that such variations do not affect the product's conformity with its description or our quality standards.</p>
                <div style={{ backgroundColor: 'rgba(47, 107, 58, 0.07)', borderLeft: '4px solid #2F6B3A', borderRadius: '14px', padding: '1.1rem 1.35rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <Sparkles size={20} color="#2F6B3A" style={{ flexShrink: 0 }} />
                  <span style={{ color: '#32180D', fontWeight: '650', fontSize: '0.95rem', lineHeight: '1.5' }}>We may introduce new products, improve recipes or update packaging from time to time. Any material information relevant to your purchase will be communicated as appropriate.</span>
                </div>
              </div>

              {/* SECTION 3: INGREDIENTS & ALLERGENS */}
              <div id="allergies" className="glass-card reveal-fade-up" style={{ padding: 'clamp(1.5rem, 4vw, 2.5rem)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: 'rgba(185, 28, 28, 0.08)', border: '1px solid rgba(185, 28, 28, 0.30)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <AlertTriangle size={22} color="#B91C1C" />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#B91C1C', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Section 03</span>
                    <h2 className="font-serif" style={{ fontSize: 'clamp(1.3rem, 3vw, 1.75rem)', color: '#32180D', margin: 0 }}>Ingredients, Allergens &amp; Product Information</h2>
                  </div>
                </div>
                <p style={{ color: '#654B38', lineHeight: '1.75', fontSize: '1rem', marginBottom: '1rem' }}>We believe customers should have the information they need to choose products with confidence. Each MILASTY product has its own ingredient composition. Please review the product description and packaging for ingredient lists, allergen declarations, dietary information, storage instructions and applicable best-before or use-before details.</p>
                <p style={{ color: '#654B38', lineHeight: '1.75', fontSize: '1rem', marginBottom: '1.25rem' }}>Depending on the product, ingredients may include wheat, milk, nuts or other potential allergens. <strong style={{ color: '#32180D' }}>If you have a food allergy or a specific dietary requirement, please contact us before ordering</strong> so that we can clarify the information available for the product.</p>
                <div style={{ backgroundColor: 'rgba(185, 28, 28, 0.06)', borderLeft: '4px solid #B91C1C', borderRadius: '14px', padding: '1.1rem 1.35rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                    <AlertTriangle size={18} color="#B91C1C" />
                    <span style={{ color: '#32180D', fontWeight: '700', fontSize: '0.95rem' }}>Important Notice</span>
                  </div>
                  <p style={{ color: '#654B38', fontSize: '0.9rem', lineHeight: '1.6', margin: 0 }}>Please do not assume that a product is gluten-free, dairy-free, sugar-free or suitable for a particular medical condition unless this is expressly stated for that specific product. Our product descriptions provide food information, not medical advice or a guarantee of health outcomes.</p>
                </div>
              </div>

              {/* SECTION 4: PLACING AN ORDER */}
              <div id="placing-order" className="glass-card reveal-fade-up" style={{ padding: 'clamp(1.5rem, 4vw, 2.5rem)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: 'rgba(47, 107, 58, 0.10)', border: '1px solid rgba(47, 107, 58, 0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <MessageSquare size={22} color="#2F6B3A" />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#2F6B3A', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Section 04</span>
                    <h2 className="font-serif" style={{ fontSize: 'clamp(1.3rem, 3vw, 1.75rem)', color: '#32180D', margin: 0 }}>Placing &amp; Confirming an Order</h2>
                  </div>
                </div>
                <p style={{ color: '#654B38', lineHeight: '1.75', fontSize: '1rem', marginBottom: '1rem' }}>You can place consumer orders through our website or an authorised direct ordering channel. Before completing your order, please review the selected products, quantities, prices, delivery address, contact details and any special instructions.</p>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.25rem 0', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {[
                    'After receiving an order, we will send an acknowledgement or confirmation through the relevant channel.',
                    'An order is considered accepted when MILASTY confirms acceptance through the applicable ordering process.',
                    'For WhatsApp orders, the written confirmation exchanged with you establishes the agreed product specifications, quantity, price and other order details.',
                    'Any payment already collected for an order that cannot be fulfilled will be handled in accordance with our applicable policy and legal obligations.',
                  ].map((point, idx) => (
                    <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', color: '#654B38', fontSize: '0.95rem' }}>
                      <CheckCircle2 size={16} color="#2F6B3A" style={{ flexShrink: 0, marginTop: '3px' }} />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* SECTION 5: PRICING & PAYMENTS */}
              <div id="pricing-payments" className="glass-card reveal-fade-up" style={{ padding: 'clamp(1.5rem, 4vw, 2.5rem)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: 'rgba(47, 107, 58, 0.10)', border: '1px solid rgba(47, 107, 58, 0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <CreditCard size={22} color="#2F6B3A" />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#2F6B3A', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Section 05</span>
                    <h2 className="font-serif" style={{ fontSize: 'clamp(1.3rem, 3vw, 1.75rem)', color: '#32180D', margin: 0 }}>Transparent Pricing &amp; Payments</h2>
                  </div>
                </div>
                <p style={{ color: '#654B38', lineHeight: '1.75', fontSize: '1rem', marginBottom: '1.25rem' }}>We want you to know what you are paying for before you complete a purchase. Prices are displayed in <strong style={{ color: '#32180D' }}>Indian Rupees (INR)</strong>. Applicable taxes, delivery charges and other mandatory charges will be disclosed before you finalise your order.</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                  {[
                    'We will not add optional products or services to your order without the required consent.',
                    'We will not use misleading pricing, hidden charges or confusing checkout practices.',
                    'Prices and offers may change over time. Any advertised discount will be presented transparently.',
                    'Where an offer has eligibility conditions or limits, we will communicate those conditions clearly.',
                  ].map((rule, idx) => (
                    <div key={idx} style={{ backgroundColor: '#FFF9F0', border: '1px solid #E4D1B7', borderRadius: '12px', padding: '1rem', display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                      <CheckCircle2 size={18} color="#2F6B3A" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span style={{ fontSize: '0.9rem', color: '#654B38', lineHeight: '1.5' }}>{rule}</span>
                    </div>
                  ))}
                </div>
                <div style={{ backgroundColor: 'rgba(185, 28, 28, 0.06)', borderLeft: '4px solid #B91C1C', borderRadius: '14px', padding: '1.1rem 1.35rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <AlertCircle size={20} color="#B91C1C" style={{ flexShrink: 0 }} />
                  <span style={{ color: '#32180D', fontWeight: '650', fontSize: '0.95rem', lineHeight: '1.5' }}>Please keep your payment credentials secure and never share your banking PINs or OTPs with anyone claiming to represent MILASTY.</span>
                </div>
              </div>

              {/* SECTION 6: CUSTOMISED ORDERS */}
              <div id="custom-orders" className="glass-card reveal-fade-up" style={{ padding: 'clamp(1.5rem, 4vw, 2.5rem)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: 'rgba(47, 107, 58, 0.10)', border: '1px solid rgba(47, 107, 58, 0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Sparkles size={22} color="#2F6B3A" />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#2F6B3A', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Section 06</span>
                    <h2 className="font-serif" style={{ fontSize: 'clamp(1.3rem, 3vw, 1.75rem)', color: '#32180D', margin: 0 }}>Customised Cakes, Hampers &amp; Special Orders</h2>
                  </div>
                </div>
                <p style={{ color: '#654B38', lineHeight: '1.75', fontSize: '1rem', marginBottom: '1rem' }}>We understand that customised bakes and gifts often accompany meaningful occasions. For customised cakes, personalised hampers and other special orders, we encourage you to share your requirements clearly — including the preferred flavour, size, ingredients, decoration, personalisation and requested delivery date.</p>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.25rem 0', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {[
                    'We will confirm the agreed specifications and applicable payment arrangements before proceeding.',
                    'Since customised products require advance preparation, changes to an order may depend on its preparation status.',
                    'We will make reasonable efforts to fulfil the confirmed specifications. If a material change becomes necessary, we will communicate with you.',
                    'Please inform us of any allergies or dietary requirements before the order is confirmed.',
                  ].map((point, idx) => (
                    <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', color: '#654B38', fontSize: '0.95rem' }}>
                      <CheckCircle2 size={16} color="#2F6B3A" style={{ flexShrink: 0, marginTop: '3px' }} />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* SECTION 7: SHIPPING & DELIVERY */}
              <div id="shipping" className="glass-card reveal-fade-up" style={{ padding: 'clamp(1.5rem, 4vw, 2.5rem)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: 'rgba(47, 107, 58, 0.10)', border: '1px solid rgba(47, 107, 58, 0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Truck size={22} color="#2F6B3A" />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#2F6B3A', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Section 07</span>
                    <h2 className="font-serif" style={{ fontSize: 'clamp(1.3rem, 3vw, 1.75rem)', color: '#32180D', margin: 0 }}>Shipping &amp; Delivery</h2>
                  </div>
                </div>
                <p style={{ color: '#654B38', lineHeight: '1.75', fontSize: '1rem', marginBottom: '1rem' }}>We want your MILASTY order to reach you in good condition and with clear expectations about delivery. We work with delivery partners where necessary. Although we aim to meet the communicated timelines, unforeseen circumstances such as weather, transport disruption or courier delays may affect delivery.</p>
                <div style={{ backgroundColor: 'rgba(47, 107, 58, 0.07)', borderLeft: '4px solid #2F6B3A', borderRadius: '14px', padding: '1.1rem 1.35rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <Truck size={20} color="#2F6B3A" style={{ flexShrink: 0 }} />
                  <span style={{ color: '#32180D', fontWeight: '650', fontSize: '0.95rem', lineHeight: '1.5' }}>If a shipment is delayed, damaged, missing or delivered incorrectly, please contact us so that we can review the issue and help you. For complete details, see our <a href="/shipping" style={{ color: '#2F6B3A', fontWeight: '700' }}>Shipping &amp; Delivery Policy</a>.</span>
                </div>
              </div>

              {/* SECTION 8: CANCELLATIONS & REFUNDS */}
              <div id="returns-refunds" className="glass-card reveal-fade-up" style={{ padding: 'clamp(1.5rem, 4vw, 2.5rem)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: 'rgba(47, 107, 58, 0.10)', border: '1px solid rgba(47, 107, 58, 0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <RotateCcw size={22} color="#2F6B3A" />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#2F6B3A', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Section 08</span>
                    <h2 className="font-serif" style={{ fontSize: 'clamp(1.3rem, 3vw, 1.75rem)', color: '#32180D', margin: 0 }}>Cancellations, Refunds &amp; Replacements</h2>
                  </div>
                </div>
                <p style={{ color: '#654B38', lineHeight: '1.75', fontSize: '1rem', marginBottom: '1.25rem' }}>We want you to feel confident when placing an order with MILASTY. If something is not right with your order, please reach out to us promptly and share your order details. Photographs of the product and packaging may help us understand and investigate the concern.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.25rem' }}>
                  <div style={{ backgroundColor: 'rgba(47, 107, 58, 0.07)', borderLeft: '4px solid #2F6B3A', borderRadius: '14px', padding: '1.1rem 1.35rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <Clock size={20} color="#2F6B3A" style={{ flexShrink: 0 }} />
                    <span style={{ color: '#32180D', fontWeight: '650', fontSize: '0.95rem', lineHeight: '1.5' }}>We will review genuine concerns fairly and communicate the applicable resolution under our published policy and Indian consumer-protection law.</span>
                  </div>
                  <div style={{ backgroundColor: 'rgba(47, 107, 58, 0.07)', borderLeft: '4px solid #2F6B3A', borderRadius: '14px', padding: '1.1rem 1.35rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <ShieldCheck size={20} color="#2F6B3A" style={{ flexShrink: 0 }} />
                    <span style={{ color: '#32180D', fontWeight: '650', fontSize: '0.95rem', lineHeight: '1.5' }}>Our policies are intended to explain the process clearly, not to take away any consumer right or remedy that the law protects.</span>
                  </div>
                </div>
                <p style={{ color: '#654B38', fontSize: '0.92rem', lineHeight: '1.6', margin: 0 }}>For full details, please read our <a href="/refund" style={{ color: '#2F6B3A', fontWeight: '700' }}>Refund &amp; Cancellation Policy</a>.</p>
              </div>

              {/* SECTION 9: CUSTOMER SUPPORT & GRIEVANCE REDRESSAL */}
              <div id="cancellation" className="glass-card reveal-fade-up" style={{ padding: 'clamp(1.5rem, 4vw, 2.5rem)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: 'rgba(47, 107, 58, 0.10)', border: '1px solid rgba(47, 107, 58, 0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <PhoneCall size={22} color="#2F6B3A" />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#2F6B3A', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Section 09</span>
                    <h2 className="font-serif" style={{ fontSize: 'clamp(1.3rem, 3vw, 1.75rem)', color: '#32180D', margin: 0 }}>Customer Support &amp; Grievance Redressal</h2>
                  </div>
                </div>
                <p style={{ color: '#654B38', lineHeight: '1.75', fontSize: '1rem', marginBottom: '1.25rem' }}>Your feedback matters to us, and we want you to have a clear way to reach us. For any concern about a product, payment, order, delivery or these Terms, please contact our designated grievance contact. Please include your order number, order date and a short description of your concern.</p>
                <div className="tc-info-box" style={{ marginBottom: '1.25rem' }}>
                  <div className="tc-info-box-header">
                    <UserCheck size={18} color="#2F6B3A" />
                    <span className="tc-info-box-title">Grievance Officer / Designated Contact</span>
                  </div>
                  {[
                    { label: 'Name', value: 'Ankit Chakraborty', type: 'text' },
                    { label: 'Email', value: 'milasty.cookies@gmail.com', type: 'email' },
                    { label: 'Phone / WhatsApp', value: '8250018663', type: 'phone' },
                    { label: 'Postal Address', value: 'B3-1503, Amrapali Golf Homes, Sector 4, Greater Noida West, Gautam Buddha Nagar, Uttar Pradesh - 201016', type: 'text' },
                  ].map((item, i) => (
                    <div key={i} className="tc-info-row">
                      <span className="tc-info-label">{item.label}:</span>
                      <span className="tc-info-value">
                        {item.type === 'email' ? (
                          <a href={`mailto:${item.value}`}>{item.value}</a>
                        ) : item.type === 'phone' ? (
                          <a href={`tel:${item.value}`}>+91 {item.value}</a>
                        ) : (
                          item.value
                        )}
                      </span>
                    </div>
                  ))}
                </div>
                <div style={{ backgroundColor: 'rgba(47, 107, 58, 0.07)', borderLeft: '4px solid #2F6B3A', borderRadius: '14px', padding: '1.1rem 1.35rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <Clock size={20} color="#2F6B3A" style={{ flexShrink: 0 }} />
                  <span style={{ color: '#32180D', fontWeight: '650', fontSize: '0.95rem', lineHeight: '1.5' }}>We will acknowledge consumer grievances within <strong>48 hours</strong> and endeavour to resolve them within one month of receipt, in accordance with the applicable E-Commerce Rules.</span>
                </div>
              </div>

              {/* SECTION 10: YOUR PRIVACY */}
              <div id="privacy" className="glass-card reveal-fade-up" style={{ padding: 'clamp(1.5rem, 4vw, 2.5rem)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: 'rgba(47, 107, 58, 0.10)', border: '1px solid rgba(47, 107, 58, 0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Lock size={22} color="#2F6B3A" />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#2F6B3A', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Section 10</span>
                    <h2 className="font-serif" style={{ fontSize: 'clamp(1.3rem, 3vw, 1.75rem)', color: '#32180D', margin: 0 }}>Your Privacy</h2>
                  </div>
                </div>
                <p style={{ color: '#654B38', lineHeight: '1.75', fontSize: '1rem', marginBottom: '1rem' }}>We respect your privacy and the information you share with us. Our separate Privacy Policy explains how personal information is collected, used, stored and shared in connection with our website, orders and customer support.</p>
                <p style={{ color: '#654B38', lineHeight: '1.75', fontSize: '0.92rem', margin: 0 }}>For details, please read our <a href="/privacy" style={{ color: '#2F6B3A', fontWeight: '700' }}>Privacy Policy</a>.</p>
              </div>

              {/* SECTION 11: FAIR WEBSITE EXPERIENCE */}
              <div id="website-experience" className="glass-card reveal-fade-up" style={{ padding: 'clamp(1.5rem, 4vw, 2.5rem)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: 'rgba(47, 107, 58, 0.10)', border: '1px solid rgba(47, 107, 58, 0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Globe2 size={22} color="#2F6B3A" />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#2F6B3A', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Section 11</span>
                    <h2 className="font-serif" style={{ fontSize: 'clamp(1.3rem, 3vw, 1.75rem)', color: '#32180D', margin: 0 }}>A Fair &amp; Transparent Website Experience</h2>
                  </div>
                </div>
                <p style={{ color: '#654B38', lineHeight: '1.75', fontSize: '1rem', marginBottom: '1.25rem' }}>We want our website to help you make informed decisions, without pressure or confusion. We aim to:</p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {[
                    'Present product information and prices clearly.',
                    'Disclose material conditions attached to offers.',
                    'Identify paid or sponsored product placements clearly wherever applicable.',
                    'Avoid misleading product descriptions, false urgency or confusing checkout practices.',
                    'Seek the required consent before adding optional products or services.',
                    'Present relevant product information in a way that helps you compare and choose.',
                  ].map((point, idx) => (
                    <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', color: '#654B38', fontSize: '0.95rem' }}>
                      <CheckCircle2 size={16} color="#2F6B3A" style={{ flexShrink: 0, marginTop: '3px' }} />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* SECTION 12: RESPECTING OUR BRAND */}
              <div id="brand" className="glass-card reveal-fade-up" style={{ padding: 'clamp(1.5rem, 4vw, 2.5rem)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: 'rgba(47, 107, 58, 0.10)', border: '1px solid rgba(47, 107, 58, 0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Shield size={22} color="#2F6B3A" />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#2F6B3A', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Section 12</span>
                    <h2 className="font-serif" style={{ fontSize: 'clamp(1.3rem, 3vw, 1.75rem)', color: '#32180D', margin: 0 }}>Respecting Our Brand</h2>
                  </div>
                </div>
                <p style={{ color: '#654B38', lineHeight: '1.75', fontSize: '1rem', marginBottom: '1rem' }}>The MILASTY name, logo, photographs, packaging designs, illustrations, written content and other original brand materials are owned by MILASTY or their respective rights holders, as applicable.</p>
                <div style={{ backgroundColor: 'rgba(47, 107, 58, 0.07)', borderLeft: '4px solid #2F6B3A', borderRadius: '14px', padding: '1.1rem 1.35rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <Heart size={20} color="#2F6B3A" style={{ flexShrink: 0 }} />
                  <span style={{ color: '#32180D', fontWeight: '650', fontSize: '0.95rem', lineHeight: '1.5' }}>You are welcome to browse our website and share links to our products. Reproducing, modifying or commercially using our protected content without permission is not permitted, except where allowed by law.</span>
                </div>
              </div>

              {/* SECTION 13: CHANGES TO TERMS */}
              <div id="changes" className="glass-card reveal-fade-up" style={{ padding: 'clamp(1.5rem, 4vw, 2.5rem)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: 'rgba(47, 107, 58, 0.10)', border: '1px solid rgba(47, 107, 58, 0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <FileText size={22} color="#2F6B3A" />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#2F6B3A', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Section 13</span>
                    <h2 className="font-serif" style={{ fontSize: 'clamp(1.3rem, 3vw, 1.75rem)', color: '#32180D', margin: 0 }}>Changes to These Terms</h2>
                  </div>
                </div>
                <p style={{ color: '#654B38', lineHeight: '1.75', fontSize: '1rem', marginBottom: '1rem' }}>As MILASTY grows, we may update these Terms to reflect changes in our products, ordering process, customer experience or applicable requirements. The latest version will be published on this page with its updated date.</p>
                <p style={{ color: '#654B38', lineHeight: '1.75', fontSize: '1rem', margin: 0 }}>We will not use an update to remove rights that have already accrued to customers or to avoid our obligations for an existing order. We encourage you to revisit this page whenever you wish to understand how we work.</p>
              </div>

              {/* SECTION 14: GOVERNING LAW */}
              <div id="legal-jurisdiction" className="glass-card reveal-fade-up" style={{ padding: 'clamp(1.5rem, 4vw, 2.5rem)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: 'rgba(47, 107, 58, 0.10)', border: '1px solid rgba(47, 107, 58, 0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Scale size={22} color="#2F6B3A" />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#2F6B3A', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Section 14</span>
                    <h2 className="font-serif" style={{ fontSize: 'clamp(1.3rem, 3vw, 1.75rem)', color: '#32180D', margin: 0 }}>Governing Law &amp; Consumer Rights</h2>
                  </div>
                </div>
                <p style={{ color: '#654B38', lineHeight: '1.75', fontSize: '1rem', marginBottom: '1rem' }}>These Terms are governed by the applicable laws of <strong style={{ color: '#32180D' }}>India</strong>. If a concern arises, we encourage you to contact us first so that we have an opportunity to understand the issue and work towards a fair resolution.</p>
                <div style={{ backgroundColor: 'rgba(47, 107, 58, 0.07)', borderLeft: '4px solid #2F6B3A', borderRadius: '14px', padding: '1.1rem 1.35rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <Scale size={20} color="#2F6B3A" style={{ flexShrink: 0 }} />
                  <span style={{ color: '#32180D', fontWeight: '650', fontSize: '0.95rem', lineHeight: '1.5' }}>Nothing in these Terms is intended to exclude or limit consumer rights available under the <strong>Consumer Protection Act, 2019</strong>, the applicable E-Commerce Rules or other applicable laws. You may approach an appropriate consumer commission in accordance with applicable law.</span>
                </div>
              </div>

              {/* SECTION 15: HOW OUR POLICIES WORK TOGETHER */}
              <div id="policies-overview" className="glass-card reveal-fade-up" style={{ padding: 'clamp(1.5rem, 4vw, 2.5rem)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: 'rgba(47, 107, 58, 0.10)', border: '1px solid rgba(47, 107, 58, 0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <FileSpreadsheet size={22} color="#2F6B3A" />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#2F6B3A', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Section 15</span>
                    <h2 className="font-serif" style={{ fontSize: 'clamp(1.3rem, 3vw, 1.75rem)', color: '#32180D', margin: 0 }}>How Our Policies Work Together</h2>
                  </div>
                </div>
                <p style={{ color: '#654B38', lineHeight: '1.75', fontSize: '1rem', marginBottom: '1.25rem' }}>These Terms explain the general conditions for using the MILASTY website and placing consumer orders. Our separate policies provide more detailed information on specific subjects:</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {[
                    { label: 'Privacy Policy', href: '/privacy', desc: 'How we handle personal information.' },
                    { label: 'Refund & Cancellation Policy', href: '/refund', desc: 'How cancellations, refunds, replacements and related concerns are handled.' },
                    { label: 'Shipping & Delivery Policy', href: '/shipping', desc: 'Delivery availability, charges, timelines and delivery-related concerns.' },
                  ].map((policy, i) => (
                    <div key={i} style={{ backgroundColor: '#FFF9F0', border: '1px solid #E4D1B7', borderRadius: '12px', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      <ArrowRight size={18} color="#2F6B3A" style={{ flexShrink: 0 }} />
                      <div>
                        <a href={policy.href} style={{ color: '#2F6B3A', fontWeight: '700', fontSize: '0.95rem', textDecoration: 'none' }}>{policy.label}</a>
                        <p style={{ color: '#654B38', fontSize: '0.88rem', margin: 0 }}>{policy.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA SUPPORT SECTION */}
              <div id="support-cta" className="reveal-fade-up" style={{ backgroundColor: 'rgba(47, 107, 58, 0.08)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1.5px solid rgba(47, 107, 58, 0.35)', borderRadius: '24px', padding: 'clamp(2rem, 5vw, 3rem) clamp(1.5rem, 4vw, 2.5rem)', textAlign: 'center', boxShadow: '0 16px 40px rgba(75, 45, 25, 0.10)' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#244f21', border: '1.5px solid #2F6B3A', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', boxShadow: '0 8px 20px rgba(47, 107, 58, 0.25)' }}>
                  <MessageSquare size={26} color="#FFFFFF" />
                </div>
                <h3 className="font-serif" style={{ fontSize: 'clamp(1.4rem, 3.5vw, 2rem)', color: '#32180D', marginBottom: '0.5rem' }}>Contact MILASTY</h3>
                <p style={{ fontSize: '1rem', color: '#654B38', marginBottom: '0.5rem' }}>Have a question before ordering, need help with a purchase or want to share feedback?</p>
                <p style={{ fontSize: '0.95rem', color: '#654B38', marginBottom: '1.75rem', fontStyle: 'italic' }}>MILASTY — Where millets meet great taste. ❤️</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem', justifyContent: 'center', marginBottom: '1.5rem', width: '100%', boxSizing: 'border-box' }}>
                  {[
                    { icon: Globe2, label: 'www.milasty.com', href: 'https://www.milasty.com' },
                    { icon: Megaphone, label: 'milasty.cookies@gmail.com', href: 'mailto:milasty.cookies@gmail.com' },
                    { icon: PhoneCall, label: '8927142056', href: 'tel:8927142056' },
                  ].map((item, i) => {
                    const Icon = item.icon;
                    return (
                      <a
                        key={i}
                        href={item.href}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.45rem',
                          backgroundColor: '#FFF9F0',
                          border: '1px solid #E4D1B7',
                          borderRadius: '999px',
                          padding: '0.4rem 0.9rem',
                          fontSize: '0.85rem',
                          color: '#654B38',
                          textDecoration: 'none',
                          maxWidth: '100%',
                          boxSizing: 'border-box',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <Icon size={14} color="#2F6B3A" style={{ flexShrink: 0 }} />
                        <span style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{item.label}</span>
                      </a>
                    );
                  })}
                </div>
                <a href={getWhatsappUrl('Terms & Conditions')} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ padding: '0.9rem 2.25rem', fontSize: '1rem', fontWeight: '750', display: 'inline-flex', alignItems: 'center', gap: '0.6rem' }}>
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
        backgroundColor: '#F7F0E5',
        color: '#2B170D',
      }}
    >
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
