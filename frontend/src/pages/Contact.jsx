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
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(135deg, rgba(20, 10, 5, 0.40) 0%, rgba(36, 19, 13, 0.30) 100%)',
        zIndex: 0,
        pointerEvents: 'none',
      }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
      
      {/* 1. HERO SECTION */}
      <section 
        style={{ 
          padding: '6.5rem 1.5rem 4.5rem', 
          textAlign: 'center', 
          maxWidth: '850px', 
          margin: '0 auto',
          boxSizing: 'border-box'
        }}
      >
        <span 
          style={{ 
            fontSize: '0.78rem', 
            textTransform: 'uppercase', 
            letterSpacing: '0.14em', 
            color: '#b9cd94', 
            fontWeight: '850',
            backgroundColor: 'rgba(36, 79, 33, 0.35)',
            padding: '0.4rem 0.95rem',
            borderRadius: '999px',
            border: '1.5px solid rgba(185, 205, 148, 0.4)',
            display: 'inline-block',
            marginBottom: '1.25rem'
          }}
        >
          We'd love to hear from you
        </span>
        <h1 
          style={{ 
            fontSize: 'clamp(2.1rem, 5.2vw, 3.8rem)', 
            fontFamily: 'var(--font-serif)', 
            color: '#FFFDF9', 
            fontWeight: '850',
            lineHeight: '1.15',
            margin: '0 0 1.25rem 0',
            letterSpacing: '-0.02em',
            textShadow: '0 2px 10px rgba(0,0,0,0.5)'
          }}
        >
          Let's Talk. We're Listening.
        </h1>
        <p 
          style={{ 
            fontSize: 'clamp(1rem, 2.2vw, 1.12rem)', 
            color: '#F5EBDD', 
            lineHeight: '1.65', 
            maxWidth: '600px',
            margin: '0 auto',
            fontWeight: '550'
          }}
        >
          Have a question about your order, ingredients, gifting, or anything MILASTY? Our team is here to help.
        </p>
      </section>

      {/* 2. QUICK CONTACT OPTIONS */}
      <section style={{ width: '100%', maxWidth: '1200px', margin: '0 auto 6.5rem', paddingLeft: '1.5rem', paddingRight: '1.5rem', boxSizing: 'border-box' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '2rem' }}>
          
          {/* Card 1: WhatsApp */}
          <div 
            className="glass-card" 
            style={{ 
              padding: '2.5rem 2rem', 
              borderRadius: '24px', 
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'all 0.25s ease',
              boxSizing: 'border-box',
              minWidth: 0
            }}
          >
            <div>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(36, 79, 33, 0.45)', color: '#b9cd94', border: '1px solid rgba(185, 205, 148, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                <MessageSquare size={22} />
              </div>
              <h3 style={{ fontSize: '1.15rem', color: '#FFFDF9', fontWeight: '850', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>WhatsApp Support</h3>
              <p style={{ fontSize: '0.88rem', color: '#F5EBDD', lineHeight: '1.6', marginBottom: '1.5rem', fontWeight: '500' }}>
                Quick questions? Chat with our team for instant assistance.
              </p>
            </div>
            <a 
              href="https://api.whatsapp.com/send/?phone=918927142056&text=Hi%20MILASTY%2C%20I%20have%20a%20query"
              target="_blank"
              rel="noreferrer"
              style={{ 
                fontSize: '0.88rem', 
                color: '#b9cd94', 
                fontWeight: '850', 
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <span>Chat on WhatsApp</span>
              <ArrowRight size={15} />
            </a>
          </div>

          {/* Card 2: Email */}
          <div 
            className="glass-card" 
            style={{ 
              padding: '2.5rem 2rem', 
              borderRadius: '24px', 
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'all 0.25s ease',
              boxSizing: 'border-box',
              minWidth: 0
            }}
          >
            <div>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(36, 79, 33, 0.45)', color: '#b9cd94', border: '1px solid rgba(185, 205, 148, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                <Mail size={22} />
              </div>
              <h3 style={{ fontSize: '1.15rem', color: '#FFFDF9', fontWeight: '850', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Email Us</h3>
              <p style={{ fontSize: '0.88rem', color: '#F5EBDD', lineHeight: '1.6', marginBottom: '1.5rem', fontWeight: '500' }}>
                Send us your questions, feedback or bulk enquiries.
              </p>
            </div>
            <a 
              href="mailto:hello@milasty.com"
              style={{ 
                fontSize: '0.88rem', 
                color: '#b9cd94', 
                fontWeight: '850', 
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <span>Send an Email</span>
              <ArrowRight size={15} />
            </a>
          </div>

          {/* Card 3: Orders */}
          <div 
            className="glass-card" 
            style={{ 
              padding: '2.5rem 2rem', 
              borderRadius: '24px', 
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'all 0.25s ease',
              boxSizing: 'border-box',
              minWidth: 0
            }}
          >
            <div>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(36, 79, 33, 0.45)', color: '#b9cd94', border: '1px solid rgba(185, 205, 148, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                <Package size={22} />
              </div>
              <h3 style={{ fontSize: '1.15rem', color: '#FFFDF9', fontWeight: '850', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Orders & Support</h3>
              <p style={{ fontSize: '0.88rem', color: '#F5EBDD', lineHeight: '1.6', marginBottom: '1.5rem', fontWeight: '500' }}>
                Need help with an existing order or want to track shipping?
              </p>
            </div>
            <Link 
              to="/account/orders"
              style={{ 
                fontSize: '0.88rem', 
                color: '#b9cd94', 
                fontWeight: '850', 
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <span>View My Orders</span>
              <ArrowRight size={15} />
            </Link>
          </div>

        </div>
      </section>

      {/* 3. MAIN CONTACT SECTION + 4. FORM */}
      <section style={{ width: '100%', maxWidth: '1200px', margin: '0 auto 6.5rem', paddingLeft: '1.5rem', paddingRight: '1.5rem', boxSizing: 'border-box' }}>
        <div className="story-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '3.5rem', alignItems: 'start' }}>
          
          {/* Left Column: Business Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', minWidth: 0 }}>
            <div>
              <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontFamily: 'var(--font-serif)', color: '#FFFDF9', fontWeight: '850', margin: '0 0 0.75rem 0', textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>Get In Touch</h2>
              <p style={{ fontSize: '0.98rem', color: '#F5EBDD', lineHeight: '1.7', margin: 0, fontWeight: '550' }}>
                Whether you're curious about our ingredients, need help with an order, or want to explore gifting options, we'd love to hear from you.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', marginTop: '0.5rem' }}>
              
              {/* Address block */}
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: 'rgba(36, 79, 33, 0.45)', border: '1px solid rgba(185, 205, 148, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b9cd94', flexShrink: 0 }}>
                  <MapPin size={20} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <h4 style={{ fontSize: '0.88rem', fontWeight: '850', color: '#b9cd94', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.35rem' }}>Registered Bakery Address</h4>
                  <p style={{ fontSize: '0.9rem', color: '#F5EBDD', lineHeight: '1.5', margin: 0, fontWeight: '500', wordBreak: 'break-word' }}>
                    MILASTY Foods Private Limited,<br />
                    Greater Noida, Gautam Buddha Nagar,<br />
                    Uttar Pradesh - 201306, India
                  </p>
                </div>
              </div>

              {/* WhatsApp block */}
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: 'rgba(36, 79, 33, 0.45)', border: '1px solid rgba(185, 205, 148, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b9cd94', flexShrink: 0 }}>
                  <MessageSquare size={20} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <h4 style={{ fontSize: '0.88rem', fontWeight: '850', color: '#b9cd94', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.35rem' }}>WhatsApp Desk</h4>
                  <a 
                    href="https://api.whatsapp.com/send/?phone=918927142056&text=Hi%20MILASTY%2C%20I%20have%20a%20query"
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: '0.92rem', color: '#FFFDF9', fontWeight: '800', textDecoration: 'none', wordBreak: 'break-all' }}
                  >
                    +91 89271 42056
                  </a>
                </div>
              </div>

              {/* Email block */}
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: 'rgba(36, 79, 33, 0.45)', border: '1px solid rgba(185, 205, 148, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b9cd94', flexShrink: 0 }}>
                  <Mail size={20} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <h4 style={{ fontSize: '0.88rem', fontWeight: '850', color: '#b9cd94', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.35rem' }}>Email Support</h4>
                  <a 
                    href="mailto:hello@milasty.com"
                    style={{ fontSize: '0.92rem', color: '#FFFDF9', fontWeight: '800', textDecoration: 'none', wordBreak: 'break-all' }}
                  >
                    hello@milasty.com
                  </a>
                </div>
              </div>

              {/* License block */}
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: 'rgba(36, 79, 33, 0.45)', border: '1px solid rgba(185, 205, 148, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b9cd94', flexShrink: 0 }}>
                  <ShieldCheck size={20} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <h4 style={{ fontSize: '0.88rem', fontWeight: '850', color: '#b9cd94', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.35rem' }}>Food Safety License</h4>
                  <p style={{ fontSize: '0.9rem', color: '#F5EBDD', margin: 0, fontWeight: '500' }}>
                    FSSAI Lic No: 22724105001223
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* Right Column: Custom Message Form */}
          <div id="contact-inquiry-form" className="glass-card" style={{ padding: 'clamp(1.5rem, 4vw, 2.5rem)', borderRadius: '24px', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
            <h3 style={{ fontSize: '1.6rem', fontFamily: 'var(--font-serif)', color: '#FFFDF9', fontWeight: '850', margin: '0 0 0.25rem 0' }}>Send Us a Message</h3>
            <p style={{ fontSize: '0.88rem', color: '#F5EBDD', marginBottom: '2rem', fontWeight: '550' }}>We usually respond as soon as possible.</p>

            {submitted ? (
              <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#b9cd94' }}>
                <CheckCircle2 size={48} style={{ margin: '0 auto 1.25rem' }} />
                <h4 style={{ fontSize: '1.35rem', fontFamily: 'var(--font-serif)', color: '#FFFDF9', fontWeight: '850', marginBottom: '0.5rem' }}>Thank you for reaching out.</h4>
                <p style={{ color: '#F5EBDD', fontSize: '0.92rem', lineHeight: '1.6', margin: 0, fontWeight: '500' }}>We've received your message and will get back to you soon.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%', boxSizing: 'border-box' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: '850', color: '#F5EBDD', display: 'block', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter your name"
                    style={{ width: '100%', height: '52px', padding: '0 1rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.2)', fontSize: '0.9rem', outline: 'none', backgroundColor: 'rgba(20, 10, 5, 0.65)', color: '#FFFDF9', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: '850', color: '#F5EBDD', display: 'block', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="name@example.com"
                    style={{ width: '100%', height: '52px', padding: '0 1rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.2)', fontSize: '0.9rem', outline: 'none', backgroundColor: 'rgba(20, 10, 5, 0.65)', color: '#FFFDF9', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: '850', color: '#F5EBDD', display: 'block', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    WhatsApp / Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    style={{ width: '100%', height: '52px', padding: '0 1rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.2)', fontSize: '0.9rem', outline: 'none', backgroundColor: 'rgba(20, 10, 5, 0.65)', color: '#FFFDF9', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: '850', color: '#F5EBDD', display: 'block', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Message / Inquiry *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="How can we help you?"
                    style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.2)', fontSize: '0.9rem', outline: 'none', resize: 'none', backgroundColor: 'rgba(20, 10, 5, 0.65)', color: '#FFFDF9', lineHeight: '1.5', boxSizing: 'border-box' }}
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
                    backgroundColor: '#244f21',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '12px',
                    fontWeight: '850',
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
      <section style={{ width: '100%', maxWidth: '1200px', margin: '0 auto 6.5rem', paddingLeft: '1.5rem', paddingRight: '1.5rem', boxSizing: 'border-box' }}>
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontFamily: 'var(--font-serif)', color: '#FFFDF9', fontWeight: '850', margin: 0, textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
            How Can We Help?
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '1.5rem' }}>
          <div 
            onClick={() => handleSelectReason("Questions about an existing order")}
            className="glass-card" 
            style={{ padding: '2rem 1.5rem', borderRadius: '20px', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s', boxSizing: 'border-box' }}
          >
            <h4 style={{ fontSize: '0.95rem', fontWeight: '850', color: '#b9cd94', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Order Support</h4>
            <p style={{ fontSize: '0.85rem', color: '#F5EBDD', margin: 0, lineHeight: '1.5', fontWeight: '500' }}>Questions about an existing order.</p>
          </div>

          <div 
            onClick={() => handleSelectReason("Ingredients, pack sizes or product information")}
            className="glass-card" 
            style={{ padding: '2rem 1.5rem', borderRadius: '20px', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s', boxSizing: 'border-box' }}
          >
            <h4 style={{ fontSize: '0.95rem', fontWeight: '850', color: '#b9cd94', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Product Questions</h4>
            <p style={{ fontSize: '0.85rem', color: '#F5EBDD', margin: 0, lineHeight: '1.5', fontWeight: '500' }}>Ingredients, pack sizes or product info.</p>
          </div>

          <div 
            onClick={() => handleSelectReason("Corporate, festive or celebration gifting")}
            className="glass-card" 
            style={{ padding: '2rem 1.5rem', borderRadius: '20px', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s', boxSizing: 'border-box' }}
          >
            <h4 style={{ fontSize: '0.95rem', fontWeight: '850', color: '#b9cd94', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Gifting & Bulk</h4>
            <p style={{ fontSize: '0.85rem', color: '#F5EBDD', margin: 0, lineHeight: '1.5', fontWeight: '500' }}>Corporate, festive or celebration gifting.</p>
          </div>

          <div 
            onClick={() => handleSelectReason("General enquiry")}
            className="glass-card" 
            style={{ padding: '2rem 1.5rem', borderRadius: '20px', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s', boxSizing: 'border-box' }}
          >
            <h4 style={{ fontSize: '0.95rem', fontWeight: '850', color: '#b9cd94', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>General Enquiry</h4>
            <p style={{ fontSize: '0.85rem', color: '#F5EBDD', margin: 0, lineHeight: '1.5', fontWeight: '500' }}>Anything else you'd like to ask.</p>
          </div>
        </div>
      </section>

      {/* 6. FAQ SECTION */}
      <section style={{ width: '100%', maxWidth: '800px', margin: '0 auto 6.5rem', paddingLeft: '1.5rem', paddingRight: '1.5rem', boxSizing: 'border-box' }}>
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.14em', color: '#b9cd94', fontWeight: '850', display: 'block', marginBottom: '0.35rem' }}>Help Center</span>
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontFamily: 'var(--font-serif)', color: '#FFFDF9', fontWeight: '850', margin: 0, textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
            Before You Reach Out
          </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {faqs.map((faq, idx) => {
            const isOpen = activeFaq === idx;
            return (
              <div 
                key={idx} 
                className="glass-card"
                style={{ 
                  borderRadius: '16px', 
                  overflow: 'hidden',
                  boxSizing: 'border-box'
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
                    outline: 'none',
                    gap: '1rem'
                  }}
                >
                  <span style={{ fontSize: '0.95rem', fontWeight: '850', color: '#FFFDF9', flex: 1 }}>{faq.q}</span>
                  <ChevronDown 
                    size={18} 
                    style={{ 
                      color: '#b9cd94', 
                      transform: isOpen ? 'rotate(180deg)' : 'rotate(0)', 
                      transition: 'transform 0.25s ease',
                      flexShrink: 0
                    }} 
                  />
                </button>
                
                {isOpen && (
                  <div style={{ padding: '0 1.5rem 1.5rem 1.5rem', fontSize: '0.9rem', color: '#F5EBDD', lineHeight: '1.6', fontWeight: '500' }}>
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 7. BRAND STORY CTA */}
      <section style={{ width: '100%', maxWidth: '1150px', margin: '0 auto', paddingLeft: '1.5rem', paddingRight: '1.5rem', boxSizing: 'border-box' }}>
        <div 
          className="glass-card" 
          style={{ 
            padding: 'clamp(2.5rem, 6vw, 5rem) 1.5rem', 
            textAlign: 'center', 
            color: '#FFFFFF', 
            borderRadius: '30px', 
            position: 'relative',
            overflow: 'hidden',
            boxSizing: 'border-box'
          }}
        >
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', color: '#FFFDF9', marginBottom: '1rem', fontFamily: 'var(--font-serif)', fontWeight: '850', textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
            Made With Intention. Shared With Love.
          </h2>
          <p style={{ color: '#F5EBDD', fontSize: '1.02rem', maxWidth: '520px', margin: '0.5rem auto 2.5rem', lineHeight: '1.7', fontWeight: '550' }}>
            Discover the story, ingredients and rituals behind MILASTY.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link 
              to="/our-story" 
              className="btn-primary" 
              style={{ 
                padding: '0.95rem 2.25rem', 
                fontSize: '0.92rem', 
                backgroundColor: '#244f21', 
                color: '#FFFFFF', 
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
                fontSize: '0.92rem', 
                borderColor: '#b9cd94', 
                color: '#b9cd94', 
                borderRadius: '999px', 
                fontWeight: '850', 
                textDecoration: 'none',
                backgroundColor: 'rgba(36, 79, 33, 0.25)'
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

