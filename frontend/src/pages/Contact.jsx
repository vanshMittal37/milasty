import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  MessageSquare, MapPin, ShieldCheck, Mail, Send, CheckCircle2, 
  HelpCircle, Package, ArrowRight, ChevronDown, Sparkles 
} from 'lucide-react';

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });

  const [activeFaq, setActiveFaq] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API request
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 1200);
  };

  const handleSelectReason = (reasonText) => {
    setFormData(prev => ({
      ...prev,
      message: `Hi MILASTY Team, I am reaching out regarding: ${reasonText}. `
    }));
    // Smooth scroll to form
    const formElement = document.getElementById('contact-inquiry-form');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const faqs = [
    {
      q: "How can I track my order?",
      a: "You can track your order live from your Account Dashboard. Just navigate to 'My Orders' and click on the specific order to see its journey."
    },
    {
      q: "How can I contact MILASTY?",
      a: "You can reach us instantly on WhatsApp at +91 89271 42056, or email us at hello@milasty.com."
    },
    {
      q: "Where can I find nutritional information?",
      a: "Complete nutritional macro breakdowns and official NABL-accredited lab reports are available on our dedicated Nutrition page."
    },
    {
      q: "How can I ask about gifting?",
      a: "Please drop us a message using our contact form under 'Gifting & Bulk Orders', or text us on WhatsApp, and our team will get back to you with custom catalog options."
    }
  ];

  return (
    <div
      className="contact-page"
      style={{
        minHeight: '100vh',
        padding: '0 0 6rem',
        width: '100%',
        maxWidth: '100%',
        overflowX: 'hidden',
        boxSizing: 'border-box',
        position: 'relative',
        backgroundImage: 'url(/images/contact_background_image.jpeg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'linear-gradient(135deg, rgba(20, 10, 5, 0.72) 0%, rgba(36, 19, 13, 0.65) 100%)',
        zIndex: 0,
        pointerEvents: 'none',
      }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
      
      {/* 1. HERO SECTION */}
      <section 
        style={{ 
          padding: '6.5rem 0 4.5rem', 
          textAlign: 'center', 
          maxWidth: '850px', 
          margin: '0 auto',
          paddingLeft: '1.5rem',
          paddingRight: '1.5rem'
        }}
      >
        <span 
          style={{ 
            fontSize: '0.76rem', 
            textTransform: 'uppercase', 
            letterSpacing: '0.12em', 
            color: 'var(--accent-gold)', 
            fontWeight: '800',
            backgroundColor: 'rgba(197, 160, 89, 0.08)',
            padding: '0.35rem 0.85rem',
            borderRadius: '999px',
            border: '1px solid rgba(197, 160, 89, 0.15)',
            display: 'inline-block',
            marginBottom: '1.25rem'
          }}
        >
          We'd love to hear from you
        </span>
        <h1 
          style={{ 
            fontSize: 'clamp(2.5rem, 5.5vw, 3.8rem)', 
            fontFamily: 'var(--font-serif)', 
            color: 'var(--primary-dark)', 
            fontWeight: '800',
            lineHeight: '1.15',
            margin: '0 0 1.25rem 0',
            letterSpacing: '-0.02em'
          }}
        >
          Let's Talk. We're Listening.
        </h1>
        <p 
          style={{ 
            fontSize: '1.12rem', 
            color: 'var(--text-muted)', 
            lineHeight: '1.65', 
            maxWidth: '600px',
            margin: '0 auto',
            fontWeight: '500'
          }}
        >
          Have a question about your order, ingredients, gifting, or anything MILASTY? Our team is here to help.
        </p>
      </section>

      {/* 2. QUICK CONTACT OPTIONS */}
      <section style={{ maxWidth: '1200px', margin: '0 auto 6.5rem', paddingLeft: '1.5rem', paddingRight: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
          
          {/* Card 1: WhatsApp */}
          <div 
            className="glass-card" 
            style={{ 
              padding: '2.5rem 2rem', 
              backgroundColor: 'transparent', 
              borderRadius: '24px', 
              border: '1px solid rgba(245, 220, 180, 0.18)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'all 0.25s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div>
              <div style={{ width: '46px', height: '46px', borderRadius: '50%', backgroundColor: 'rgba(39, 76, 55, 0.08)', color: 'var(--accent-olive)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                <MessageSquare size={20} />
              </div>
              <h3 style={{ fontSize: '1.15rem', color: 'var(--primary-dark)', fontWeight: '850', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>WhatsApp Support</h3>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '1.5rem', fontWeight: '500' }}>
                Quick questions? Chat with our team for instant assistance.
              </p>
            </div>
            <a 
              href="https://api.whatsapp.com/send/?phone=918927142056&text=Hi%20MILASTY%2C%20I%20have%20a%20query"
              target="_blank"
              rel="noreferrer"
              style={{ 
                fontSize: '0.86rem', 
                color: 'var(--primary-dark)', 
                fontWeight: '800', 
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <span>Chat on WhatsApp</span>
              <ArrowRight size={14} />
            </a>
          </div>

          {/* Card 2: Email */}
          <div 
            className="glass-card" 
            style={{ 
              padding: '2.5rem 2rem', 
              backgroundColor: 'transparent', 
              borderRadius: '24px', 
              border: '1px solid rgba(245, 220, 180, 0.18)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'all 0.25s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div>
              <div style={{ width: '46px', height: '46px', borderRadius: '50%', backgroundColor: 'rgba(197, 160, 89, 0.08)', color: 'var(--accent-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                <Mail size={20} />
              </div>
              <h3 style={{ fontSize: '1.15rem', color: 'var(--primary-dark)', fontWeight: '850', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Email Us</h3>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '1.5rem', fontWeight: '500' }}>
                Send us your questions, feedback or bulk enquiries.
              </p>
            </div>
            <a 
              href="mailto:hello@milasty.com"
              style={{ 
                fontSize: '0.86rem', 
                color: 'var(--primary-dark)', 
                fontWeight: '800', 
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <span>Send an Email</span>
              <ArrowRight size={14} />
            </a>
          </div>

          {/* Card 3: Orders */}
          <div 
            className="glass-card" 
            style={{ 
              padding: '2.5rem 2rem', 
              backgroundColor: 'transparent', 
              borderRadius: '24px', 
              border: '1px solid rgba(245, 220, 180, 0.18)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'all 0.25s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div>
              <div style={{ width: '46px', height: '46px', borderRadius: '50%', backgroundColor: 'rgba(56, 20, 35, 0.05)', color: 'var(--primary-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                <Package size={20} />
              </div>
              <h3 style={{ fontSize: '1.15rem', color: 'var(--primary-dark)', fontWeight: '850', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Orders & Support</h3>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '1.5rem', fontWeight: '500' }}>
                Need help with an existing order or want to track shipping?
              </p>
            </div>
            <Link 
              to="/account/orders"
              style={{ 
                fontSize: '0.86rem', 
                color: 'var(--primary-dark)', 
                fontWeight: '800', 
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <span>View My Orders</span>
              <ArrowRight size={14} />
            </Link>
          </div>

        </div>
      </section>

      {/* 3. MAIN CONTACT SECTION + 4. FORM */}
      <section style={{ maxWidth: '1200px', margin: '0 auto 6.5rem', paddingLeft: '1.5rem', paddingRight: '1.5rem' }}>
        <div className="story-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '5rem', alignItems: 'start' }}>
          
          {/* Left Column: Business Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div>
              <h2 style={{ fontSize: '2.1rem', fontFamily: 'var(--font-serif)', color: 'var(--primary-dark)', fontWeight: '800', margin: '0 0 0.75rem 0' }}>Get In Touch</h2>
              <p style={{ fontSize: '0.96rem', color: 'var(--text-muted)', lineHeight: '1.65', margin: 0, fontWeight: '500' }}>
                Whether you're curious about our ingredients, need help with an order, or want to explore gifting options, we'd love to hear from you.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', marginTop: '0.5rem' }}>
              
              {/* Address block */}
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'rgba(20, 10, 5, 0.55)', border: '1px solid rgba(245, 220, 180, 0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-gold)', flexShrink: 0 }}>
                  <MapPin size={18} />
                </div>
                <div>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--primary-dark)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.35rem' }}>Registered Bakery Address</h4>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.5', margin: 0, fontWeight: '500' }}>
                    MILASTY Foods Private Limited,<br />
                    Greater Noida, Gautam Buddha Nagar,<br />
                    Uttar Pradesh - 201306, India
                  </p>
                </div>
              </div>

              {/* WhatsApp block */}
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'rgba(20, 10, 5, 0.55)', border: '1px solid rgba(245, 220, 180, 0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-gold)', flexShrink: 0 }}>
                  <MessageSquare size={18} />
                </div>
                <div>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--primary-dark)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.35rem' }}>WhatsApp Desk</h4>
                  <a 
                    href="https://api.whatsapp.com/send/?phone=918927142056&text=Hi%20MILASTY%2C%20I%20have%20a%20query"
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: '0.9rem', color: 'var(--primary-dark)', fontWeight: '750', textDecoration: 'none' }}
                  >
                    +91 89271 42056
                  </a>
                </div>
              </div>

              {/* Email block */}
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'rgba(20, 10, 5, 0.55)', border: '1px solid rgba(245, 220, 180, 0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-gold)', flexShrink: 0 }}>
                  <Mail size={18} />
                </div>
                <div>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--primary-dark)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.35rem' }}>Email Support</h4>
                  <a 
                    href="mailto:hello@milasty.com"
                    style={{ fontSize: '0.9rem', color: 'var(--primary-dark)', fontWeight: '750', textDecoration: 'none' }}
                  >
                    hello@milasty.com
                  </a>
                </div>
              </div>

              {/* License block */}
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'rgba(20, 10, 5, 0.55)', border: '1px solid rgba(245, 220, 180, 0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-olive)', flexShrink: 0 }}>
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--primary-dark)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.35rem' }}>Food Safety License</h4>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0, fontWeight: '500' }}>
                    FSSAI Lic No: 22724105001223
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* Right Column: Custom Message Form */}
          <div id="contact-inquiry-form" className="glass-card" style={{ padding: '3rem 2.5rem', backgroundColor: 'transparent', borderRadius: '24px', border: '1px solid rgba(245, 220, 180, 0.18)', boxShadow: '0 8px 30px rgba(56, 20, 35, 0.02)' }}>
            <h3 style={{ fontSize: '1.6rem', fontFamily: 'var(--font-serif)', color: 'var(--primary-dark)', fontWeight: '800', margin: '0 0 0.25rem 0' }}>Send Us a Message</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '2rem', fontWeight: '500' }}>We usually respond as soon as possible.</p>

            {submitted ? (
              <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--accent-olive)' }}>
                <CheckCircle2 size={48} style={{ margin: '0 auto 1.25rem' }} />
                <h4 style={{ fontSize: '1.35rem', fontFamily: 'var(--font-serif)', color: 'var(--primary-dark)', fontWeight: '800', marginBottom: '0.5rem' }}>Thank you for reaching out.</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: '1.6', margin: 0, fontWeight: '500' }}>We've received your message and will get back to you soon.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: '800', color: 'var(--primary-dark)', display: 'block', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter your name"
                    style={{ width: '100%', height: '52px', padding: '0 1rem', borderRadius: '12px', border: '1px solid var(--border-color)', fontSize: '0.9rem', outline: 'none', backgroundColor: 'var(--bg-subtle)', color: 'var(--text-light)' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: '800', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="name@example.com"
                    style={{ width: '100%', height: '52px', padding: '0 1rem', borderRadius: '12px', border: '1px solid var(--border-color)', fontSize: '0.9rem', outline: 'none', backgroundColor: 'var(--bg-subtle)', color: 'var(--text-light)' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: '800', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    WhatsApp / Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    style={{ width: '100%', height: '52px', padding: '0 1rem', borderRadius: '12px', border: '1px solid var(--border-color)', fontSize: '0.9rem', outline: 'none', backgroundColor: 'var(--bg-subtle)', color: 'var(--text-light)' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: '800', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Message / Inquiry *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="How can we help you?"
                    style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)', fontSize: '0.9rem', outline: 'none', resize: 'none', backgroundColor: 'var(--bg-subtle)', color: 'var(--text-light)', lineHeight: '1.5' }}
                  />
                </div>

                <button 
                  type="submit" 
                  className="btn-primary" 
                  disabled={loading}
                  style={{ 
                    height: '52px',
                    justifyContent: 'center', 
                    marginTop: '0.5rem',
                    backgroundColor: 'var(--accent-gold)',
                    color: '#24130D',
                    border: 'none',
                    borderRadius: '12px',
                    fontWeight: '800',
                    fontSize: '0.92rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    width: '100%'
                  }}
                >
                  <Send size={16} />
                  <span>{loading ? 'Sending...' : 'Send Inquiry'}</span>
                </button>
              </form>
            )}
          </div>

        </div>
      </section>

      {/* 5. CONTACT REASONS (Interactive inquiry populators) */}
      <section style={{ maxWidth: '1200px', margin: '0 auto 6.5rem', paddingLeft: '1.5rem', paddingRight: '1.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <h2 style={{ fontSize: '2.1rem', fontFamily: 'var(--font-serif)', color: 'var(--primary-dark)', fontWeight: '800', margin: 0 }}>
            How Can We Help?
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
          <div 
            onClick={() => handleSelectReason("Questions about an existing order")}
            className="glass-card" 
            style={{ padding: '2rem 1.5rem', backgroundColor: 'transparent', borderRadius: '20px', border: '1px solid rgba(245, 220, 180, 0.18)', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s' }}
            onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--primary-dark)'}
            onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
          >
            <h4 style={{ fontSize: '0.95rem', fontWeight: '850', color: 'var(--primary-dark)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Order Support</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, lineHeight: '1.5', fontWeight: '500' }}>Questions about an existing order.</p>
          </div>

          <div 
            onClick={() => handleSelectReason("Ingredients, pack sizes or product information")}
            className="glass-card" 
            style={{ padding: '2rem 1.5rem', backgroundColor: 'transparent', borderRadius: '20px', border: '1px solid rgba(245, 220, 180, 0.18)', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s' }}
            onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--primary-dark)'}
            onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
          >
            <h4 style={{ fontSize: '0.95rem', fontWeight: '850', color: 'var(--primary-dark)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Product Questions</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, lineHeight: '1.5', fontWeight: '500' }}>Ingredients, pack sizes or product info.</p>
          </div>

          <div 
            onClick={() => handleSelectReason("Corporate, festive or celebration gifting")}
            className="glass-card" 
            style={{ padding: '2rem 1.5rem', backgroundColor: 'transparent', borderRadius: '20px', border: '1px solid rgba(245, 220, 180, 0.18)', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s' }}
            onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--primary-dark)'}
            onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
          >
            <h4 style={{ fontSize: '0.95rem', fontWeight: '850', color: 'var(--primary-dark)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Gifting & Bulk</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, lineHeight: '1.5', fontWeight: '500' }}>Corporate, festive or celebration gifting.</p>
          </div>

          <div 
            onClick={() => handleSelectReason("General enquiry")}
            className="glass-card" 
            style={{ padding: '2rem 1.5rem', backgroundColor: 'transparent', borderRadius: '20px', border: '1px solid rgba(245, 220, 180, 0.18)', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s' }}
            onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--primary-dark)'}
            onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
          >
            <h4 style={{ fontSize: '0.95rem', fontWeight: '850', color: 'var(--primary-dark)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>General Enquiry</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, lineHeight: '1.5', fontWeight: '500' }}>Anything else you'd like to ask.</p>
          </div>
        </div>
      </section>

      {/* 6. FAQ SECTION */}
      <section style={{ maxWidth: '800px', margin: '0 auto 6.5rem', paddingLeft: '1.5rem', paddingRight: '1.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent-gold)', fontWeight: '800', display: 'block', marginBottom: '0.35rem' }}>Help Center</span>
          <h2 style={{ fontSize: '2.1rem', fontFamily: 'var(--font-serif)', color: 'var(--primary-dark)', fontWeight: '800', margin: 0 }}>
            Before You Reach Out
          </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {faqs.map((faq, idx) => {
            const isOpen = activeFaq === idx;
            return (
              <div 
                key={idx} 
                style={{ 
                  backgroundColor: 'transparent', 
                  borderRadius: '16px', 
                  border: '1px solid rgba(245, 235, 221, 0.25)', 
                  overflow: 'hidden' 
                }}
              >
                <button
                  onClick={() => setActiveFaq(isOpen ? null : idx)}
                  style={{
                    width: '100%',
                    padding: '1.25rem 1.5rem',
                    backgroundColor: 'transparent',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    outline: 'none'
                  }}
                >
                  <span style={{ fontSize: '0.92rem', fontWeight: '850', color: 'var(--text-light)' }}>{faq.q}</span>
                  <ChevronDown 
                    size={16} 
                    style={{ 
                      color: 'var(--text-muted)', 
                      transform: isOpen ? 'rotate(180deg)' : 'rotate(0)', 
                      transition: 'transform 0.25s ease' 
                    }} 
                  />
                </button>
                
                {isOpen && (
                  <div style={{ padding: '0 1.5rem 1.5rem 1.5rem', fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: '1.6', fontWeight: '500' }}>
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 7. BRAND STORY CTA */}
      <section style={{ maxWidth: '1150px', margin: '0 auto', paddingLeft: '1.5rem', paddingRight: '1.5rem' }}>
        <div 
          className="glass-card" 
          style={{ 
            padding: '5rem 2rem', 
            textAlign: 'center', 
            backgroundColor: 'transparent', 
            color: '#FFFFFF', 
            borderRadius: '30px', 
            border: '1px solid rgba(245, 235, 221, 0.25)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '-30%',
              left: '-10%',
              width: '500px',
              height: '500px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(185, 92, 60, 0.12) 0%, rgba(56, 20, 35, 0) 70%)',
              pointerEvents: 'none',
            }}
          />

          <h2 style={{ fontSize: '2.5rem', color: '#FFFFFF', marginBottom: '1rem', fontFamily: 'var(--font-serif)', fontWeight: '800' }}>
            Made With Intention. Shared With Love.
          </h2>
          <p style={{ color: 'rgba(252, 250, 246, 0.75)', fontSize: '1rem', maxWidth: '520px', margin: '0.5rem auto 2.5rem', lineHeight: '1.65', fontWeight: '500' }}>
            Discover the story, ingredients and rituals behind MILASTY.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link 
              to="/our-story" 
              className="btn-primary" 
              style={{ 
                padding: '0.95rem 2.25rem', 
                fontSize: '0.9rem', 
                backgroundColor: 'var(--accent-gold)', 
                color: '#24130D', 
                border: 'none', 
                borderRadius: '999px', 
                fontWeight: '850', 
                textDecoration: 'none'
              }}
            >
              Our Story
            </Link>
            <Link 
              to="/shop" 
              className="btn-secondary" 
              style={{ 
                padding: '0.95rem 2.25rem', 
                fontSize: '0.9rem', 
                borderColor: 'var(--accent-gold)', 
                color: 'var(--accent-gold)', 
                borderRadius: '999px', 
                fontWeight: '850', 
                textDecoration: 'none',
                backgroundColor: 'transparent'
              }}
            >
              Explore Bakes
            </Link>
          </div>
        </div>
      </section>

      </div>
    </div>
  );
}
