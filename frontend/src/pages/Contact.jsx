import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  MessageSquare, MapPin, ShieldCheck, Mail, Send, CheckCircle2, 
  Package, ArrowRight, ChevronDown, AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function Contact() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [submittedInquiry, setSubmittedInquiry] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });

  const [activeFaq, setActiveFaq] = useState(null);

  // Auto pre-fill name, email, phone if user is logged in
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: prev.name || user.name || '',
        email: prev.email || user.email || '',
        phone: prev.phone || user.phone || '',
      }));
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      setErrorMessage('Please fill in all required fields (Name, Email, Message).');
      return;
    }

    setLoading(true);

    try {
      // POST inquiry to real database endpoint
      const response = await api.post('/inquiries', {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        message: formData.message.trim(),
      });

      if (response.data && response.data.success) {
        setSubmittedInquiry(response.data.inquiry);
        setSubmitted(true);
        // Reset form data so user cannot double-submit
        setFormData({ name: '', email: '', phone: '', message: '' });
      } else {
        setErrorMessage(response.data?.message || 'Unable to submit your inquiry right now. Please try again.');
      }
    } catch (error) {
      console.error('Inquiry submission error:', error);
      const apiMsg = error.response?.data?.message || 'Unable to submit your inquiry right now. Please try again.';
      setErrorMessage(apiMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectReason = (reasonText) => {
    setFormData(prev => ({
      ...prev,
      message: `Hi MILASTY Team, I am reaching out regarding: ${reasonText}. `
    }));
    setSubmitted(false);
    setErrorMessage('');
    const formElement = document.getElementById('contact-inquiry-form');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const resetFormToSubmitAnother = () => {
    setSubmitted(false);
    setSubmittedInquiry(null);
    setErrorMessage('');
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      message: '',
    });
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

  const shopCardStyle = {
    backgroundColor: '#FFF9F0',
    borderRadius: '24px',
    border: '1px solid #DCC8AE',
    boxShadow: '0 8px 30px rgba(75, 45, 25, 0.06)',
    color: '#2B170D',
  };

  return (
    <div
      className="contact-page shop-theme-page"
      style={{
        minHeight: '100vh',
        padding: '0 0 6rem',
        width: '100%',
        maxWidth: '100%',
        overflowX: 'hidden',
        boxSizing: 'border-box',
        position: 'relative',
        backgroundColor: '#F7F0E5',
        backgroundImage: 'linear-gradient(rgba(247, 240, 229, 0.25), rgba(247, 240, 229, 0.25)), url(/images/about_background_image.jpeg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        color: '#2B170D'
      }}
    >
      <div>
      
      {/* 1. HERO SECTION */}
      <section 
        style={{ 
          padding: '4rem 1.5rem 3.5rem', 
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
            color: '#2F6B3A', 
            fontWeight: '850',
            backgroundColor: '#E3EEDC',
            padding: '0.4rem 0.95rem',
            borderRadius: '999px',
            border: '1px solid #DCC8AE',
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
            color: '#32180D', 
            fontWeight: '850',
            lineHeight: '1.15',
            margin: '0 0 1.25rem 0',
            letterSpacing: '-0.02em'
          }}
        >
          Let's Talk. We're Listening.
        </h1>
        <p 
          style={{ 
            fontSize: 'clamp(1rem, 2.2vw, 1.12rem)', 
            color: '#654B38', 
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
      <section style={{ width: '100%', maxWidth: '1200px', margin: '0 auto 6.5rem', paddingLeft: '1.5rem', paddingRight: '1.5rem', boxSizing: 'border-box' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '2rem' }}>
          
          {/* Card 1: WhatsApp */}
          <div 
            style={{ 
              ...shopCardStyle,
              padding: '2.5rem 2rem', 
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'all 0.25s ease',
              boxSizing: 'border-box',
              minWidth: 0
            }}
          >
            <div>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#E3EEDC', color: '#2F6B3A', border: '1px solid #DCC8AE', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                <MessageSquare size={22} />
              </div>
              <h3 style={{ fontSize: '1.15rem', color: '#32180D', fontWeight: '850', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>WhatsApp Support</h3>
              <p style={{ fontSize: '0.88rem', color: '#654B38', lineHeight: '1.6', marginBottom: '1.5rem', fontWeight: '500' }}>
                Quick questions? Chat with our team for instant assistance.
              </p>
            </div>
            <a 
              href="https://api.whatsapp.com/send/?phone=918927142056&text=Hi%20MILASTY%2C%20I%20have%20a%20query"
              target="_blank"
              rel="noreferrer"
              style={{ 
                fontSize: '0.88rem', 
                color: '#2F6B3A', 
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
            style={{ 
              ...shopCardStyle,
              padding: '2.5rem 2rem', 
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'all 0.25s ease',
              boxSizing: 'border-box',
              minWidth: 0
            }}
          >
            <div>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#E3EEDC', color: '#2F6B3A', border: '1px solid #DCC8AE', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                <Mail size={22} />
              </div>
              <h3 style={{ fontSize: '1.15rem', color: '#32180D', fontWeight: '850', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Email Us</h3>
              <p style={{ fontSize: '0.88rem', color: '#654B38', lineHeight: '1.6', marginBottom: '1.5rem', fontWeight: '500' }}>
                Send us your questions, feedback or bulk enquiries.
              </p>
            </div>
            <a 
              href="mailto:hello@milasty.com"
              style={{ 
                fontSize: '0.88rem', 
                color: '#2F6B3A', 
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
            style={{ 
              ...shopCardStyle,
              padding: '2.5rem 2rem', 
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'all 0.25s ease',
              boxSizing: 'border-box',
              minWidth: 0
            }}
          >
            <div>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#E3EEDC', color: '#2F6B3A', border: '1px solid #DCC8AE', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                <Package size={22} />
              </div>
              <h3 style={{ fontSize: '1.15rem', color: '#32180D', fontWeight: '850', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Orders & Support</h3>
              <p style={{ fontSize: '0.88rem', color: '#654B38', lineHeight: '1.6', marginBottom: '1.5rem', fontWeight: '500' }}>
                Need help with an existing order or want to track shipping?
              </p>
            </div>
            <Link 
              to="/account/orders"
              style={{ 
                fontSize: '0.88rem', 
                color: '#2F6B3A', 
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

      {/* 3. MAIN CONTACT SECTION + 4. CUSTOMER SUBMISSION FLOW */}
      <section style={{ width: '100%', maxWidth: '1200px', margin: '0 auto 6.5rem', paddingLeft: '1.5rem', paddingRight: '1.5rem', boxSizing: 'border-box' }}>
        <div className="story-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '3.5rem', alignItems: 'start' }}>
          
          {/* Left Column: Business Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', minWidth: 0 }}>
            <div>
              <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontFamily: 'var(--font-serif)', color: '#32180D', fontWeight: '850', margin: '0 0 0.75rem 0' }}>Get In Touch</h2>
              <p style={{ fontSize: '0.98rem', color: '#654B38', lineHeight: '1.7', margin: 0, fontWeight: '500' }}>
                Whether you're curious about our ingredients, need help with an order, or want to explore gifting options, we'd love to hear from you.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', marginTop: '0.5rem' }}>
              
              {/* Address block */}
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: '#E3EEDC', border: '1px solid #DCC8AE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2F6B3A', flexShrink: 0 }}>
                  <MapPin size={20} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <h4 style={{ fontSize: '0.88rem', fontWeight: '850', color: '#2F6B3A', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.35rem' }}>Registered Bakery Address</h4>
                  <p style={{ fontSize: '0.9rem', color: '#654B38', lineHeight: '1.5', margin: 0, fontWeight: '500', wordBreak: 'break-word' }}>
                    MILASTY Foods Private Limited,<br />
                    Greater Noida, Gautam Buddha Nagar,<br />
                    Uttar Pradesh - 201306, India
                  </p>
                </div>
              </div>

              {/* WhatsApp block */}
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: '#E3EEDC', border: '1px solid #DCC8AE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2F6B3A', flexShrink: 0 }}>
                  <MessageSquare size={20} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <h4 style={{ fontSize: '0.88rem', fontWeight: '850', color: '#2F6B3A', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.35rem' }}>WhatsApp Desk</h4>
                  <a 
                    href="https://api.whatsapp.com/send/?phone=918927142056&text=Hi%20MILASTY%2C%20I%20have%20a%20query"
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: '0.92rem', color: '#32180D', fontWeight: '800', textDecoration: 'none', wordBreak: 'break-all' }}
                  >
                    +91 89271 42056
                  </a>
                </div>
              </div>

              {/* Email block */}
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: '#E3EEDC', border: '1px solid #DCC8AE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2F6B3A', flexShrink: 0 }}>
                  <Mail size={20} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <h4 style={{ fontSize: '0.88rem', fontWeight: '850', color: '#2F6B3A', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.35rem' }}>Email Support</h4>
                  <a 
                    href="mailto:hello@milasty.com"
                    style={{ fontSize: '0.92rem', color: '#32180D', fontWeight: '800', textDecoration: 'none', wordBreak: 'break-all' }}
                  >
                    hello@milasty.com
                  </a>
                </div>
              </div>

              {/* License block */}
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: '#E3EEDC', border: '1px solid #DCC8AE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2F6B3A', flexShrink: 0 }}>
                  <ShieldCheck size={20} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <h4 style={{ fontSize: '0.88rem', fontWeight: '850', color: '#2F6B3A', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.35rem' }}>Food Safety License</h4>
                  <p style={{ fontSize: '0.9rem', color: '#654B38', margin: 0, fontWeight: '500' }}>
                    FSSAI Lic No: 22724105001223
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* Right Column: Custom Message Form or Success Confirmation Card */}
          <div 
            id="contact-inquiry-form" 
            style={{ 
              ...shopCardStyle,
              padding: 'clamp(1.5rem, 4vw, 2.5rem)', 
              width: 'calc(100% - 0px)', 
              maxWidth: '100%', 
              margin: '0 auto',
              boxSizing: 'border-box' 
            }}
          >
            {submitted ? (
              <div style={{ textAlign: 'center', padding: '1.5rem 0.5rem' }}>
                <div 
                  style={{ 
                    width: '64px', 
                    height: '64px', 
                    borderRadius: '50%', 
                    backgroundColor: '#E3EEDC', 
                    color: '#2F6B3A', 
                    border: '2px solid #DCC8AE', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    margin: '0 auto 1.5rem' 
                  }}
                >
                  <CheckCircle2 size={36} color="#2F6B3A" />
                </div>

                <h3 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-serif)', color: '#32180D', fontWeight: '850', marginBottom: '0.75rem' }}>
                  ✓ Thank You for Contacting MILASTY
                </h3>

                {submittedInquiry?.inquiry_number && (
                  <div style={{ display: 'inline-block', backgroundColor: '#E3EEDC', color: '#2F6B3A', padding: '0.35rem 0.9rem', borderRadius: '999px', fontSize: '0.85rem', fontWeight: '800', marginBottom: '1.25rem', border: '1px solid #DCC8AE' }}>
                    Inquiry Reference: {submittedInquiry.inquiry_number}
                  </div>
                )}

                <p style={{ color: '#654B38', fontSize: '0.96rem', lineHeight: '1.6', margin: '0 0 0.85rem 0', fontWeight: '500' }}>
                  Your inquiry has been received successfully.
                </p>

                <p style={{ color: '#654B38', fontSize: '0.92rem', lineHeight: '1.6', margin: '0 0 1.5rem 0', fontWeight: '500' }}>
                  Our team will contact you shortly by email or WhatsApp.
                </p>

                {isAuthenticated && (
                  <p style={{ color: '#2F6B3A', fontSize: '0.88rem', margin: '0 0 1.75rem 0', fontWeight: '600' }}>
                    You can track your inquiry from your MILASTY account.
                  </p>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginTop: '1rem' }}>
                  {isAuthenticated ? (
                    <Link
                      to="/account/inquiries"
                      className="btn-primary"
                      style={{
                        height: '48px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#2F6B3A',
                        color: '#FFFFFF',
                        borderRadius: '12px',
                        fontWeight: '850',
                        fontSize: '0.92rem',
                        textDecoration: 'none',
                        gap: '0.45rem',
                      }}
                    >
                      <MessageSquare size={16} />
                      <span>View My Inquiries</span>
                    </Link>
                  ) : (
                    <Link
                      to="/shop"
                      className="btn-primary"
                      style={{
                        height: '48px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#2F6B3A',
                        color: '#FFFFFF',
                        borderRadius: '12px',
                        fontWeight: '850',
                        fontSize: '0.92rem',
                        textDecoration: 'none',
                        gap: '0.45rem',
                      }}
                    >
                      <span>Continue Shopping</span>
                    </Link>
                  )}

                  <button
                    type="button"
                    onClick={resetFormToSubmitAnother}
                    style={{
                      background: 'transparent',
                      border: '1px solid #DCC8AE',
                      color: '#2F6B3A',
                      height: '44px',
                      borderRadius: '12px',
                      fontSize: '0.85rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                    }}
                  >
                    Submit Another Inquiry
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <h3 style={{ fontSize: '1.6rem', fontFamily: 'var(--font-serif)', color: '#32180D', fontWeight: '850', margin: '0 0 0.25rem 0' }}>Send Us a Message</h3>
                <p style={{ fontSize: '0.88rem', color: '#654B38', marginBottom: '1.75rem', fontWeight: '500' }}>We usually respond as soon as possible.</p>

                {errorMessage && (
                  <div style={{ padding: '0.85rem 1rem', backgroundColor: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '12px', color: '#dc2626', fontSize: '0.88rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertCircle size={18} style={{ flexShrink: 0 }} />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%', boxSizing: 'border-box' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: '850', color: '#32180D', display: 'block', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter your name"
                      style={{ width: '100%', height: '52px', padding: '0 1rem', borderRadius: '12px', border: '1px solid #DCC8AE', fontSize: '0.9rem', outline: 'none', backgroundColor: '#FCF8F1', color: '#32180D', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: '850', color: '#32180D', display: 'block', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="name@example.com"
                      style={{ width: '100%', height: '52px', padding: '0 1rem', borderRadius: '12px', border: '1px solid #DCC8AE', fontSize: '0.9rem', outline: 'none', backgroundColor: '#FCF8F1', color: '#32180D', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: '850', color: '#32180D', display: 'block', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      WhatsApp / Phone Number (Optional)
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+91 98765 43210"
                      style={{ width: '100%', height: '52px', padding: '0 1rem', borderRadius: '12px', border: '1px solid #DCC8AE', fontSize: '0.9rem', outline: 'none', backgroundColor: '#FCF8F1', color: '#32180D', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: '850', color: '#32180D', display: 'block', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Message / Inquiry *
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="How can we help you?"
                      style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '1px solid #DCC8AE', fontSize: '0.9rem', outline: 'none', resize: 'none', backgroundColor: '#FCF8F1', color: '#32180D', lineHeight: '1.5', boxSizing: 'border-box' }}
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
                      backgroundColor: '#2F6B3A',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '12px',
                      fontWeight: '850',
                      fontSize: '0.92rem',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      width: '100%',
                      opacity: loading ? 0.75 : 1,
                    }}
                  >
                    <Send size={16} />
                    <span>{loading ? 'Sending...' : 'Send Inquiry'}</span>
                  </button>
                </form>
              </div>
            )}
          </div>

        </div>
      </section>

      {/* 5. CONTACT REASONS */}
      <section style={{ width: '100%', maxWidth: '1200px', margin: '0 auto 6.5rem', paddingLeft: '1.5rem', paddingRight: '1.5rem', boxSizing: 'border-box' }}>
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontFamily: 'var(--font-serif)', color: '#32180D', fontWeight: '850', margin: 0 }}>
            How Can We Help?
          </h2>
        </div>

        <div className="how-can-we-help-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '1.5rem' }}>
          <div 
            onClick={() => handleSelectReason("Questions about an existing order")}
            style={{ ...shopCardStyle, padding: '2rem 1.5rem', borderRadius: '20px', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s', boxSizing: 'border-box' }}
          >
            <h4 style={{ fontSize: '0.95rem', fontWeight: '850', color: '#2F6B3A', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Order Support</h4>
            <p style={{ fontSize: '0.85rem', color: '#654B38', margin: 0, lineHeight: '1.5', fontWeight: '500' }}>Questions about an existing order.</p>
          </div>

          <div 
            onClick={() => handleSelectReason("Ingredients, pack sizes or product information")}
            style={{ ...shopCardStyle, padding: '2rem 1.5rem', borderRadius: '20px', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s', boxSizing: 'border-box' }}
          >
            <h4 style={{ fontSize: '0.95rem', fontWeight: '850', color: '#2F6B3A', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Product Questions</h4>
            <p style={{ fontSize: '0.85rem', color: '#654B38', margin: 0, lineHeight: '1.5', fontWeight: '500' }}>Ingredients, pack sizes or product info.</p>
          </div>

          <div 
            onClick={() => handleSelectReason("Corporate, festive or celebration gifting")}
            style={{ ...shopCardStyle, padding: '2rem 1.5rem', borderRadius: '20px', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s', boxSizing: 'border-box' }}
          >
            <h4 style={{ fontSize: '0.95rem', fontWeight: '850', color: '#2F6B3A', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Gifting & Bulk</h4>
            <p style={{ fontSize: '0.85rem', color: '#654B38', margin: 0, lineHeight: '1.5', fontWeight: '500' }}>Corporate, festive or celebration gifting.</p>
          </div>

          <div 
            onClick={() => handleSelectReason("General enquiry")}
            style={{ ...shopCardStyle, padding: '2rem 1.5rem', borderRadius: '20px', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s', boxSizing: 'border-box' }}
          >
            <h4 style={{ fontSize: '0.95rem', fontWeight: '850', color: '#2F6B3A', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>General Enquiry</h4>
            <p style={{ fontSize: '0.85rem', color: '#654B38', margin: 0, lineHeight: '1.5', fontWeight: '500' }}>Anything else you'd like to ask.</p>
          </div>
        </div>
      </section>

      {/* 6. FAQ SECTION */}
      <section style={{ width: '100%', maxWidth: '800px', margin: '0 auto 6.5rem', paddingLeft: '1.5rem', paddingRight: '1.5rem', boxSizing: 'border-box' }}>
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.14em', color: '#2F6B3A', fontWeight: '850', display: 'block', marginBottom: '0.35rem' }}>Help Center</span>
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontFamily: 'var(--font-serif)', color: '#32180D', fontWeight: '850', margin: 0 }}>
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
                  ...shopCardStyle,
                  borderRadius: '16px', 
                  overflow: 'hidden',
                  boxSizing: 'border-box',
                  width: '100%',
                  alignSelf: 'stretch'
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
                  <span style={{ fontSize: '0.95rem', fontWeight: '850', color: '#32180D', flex: 1 }}>{faq.q}</span>
                  <ChevronDown 
                    size={18} 
                    style={{ 
                      color: '#2F6B3A', 
                      transform: isOpen ? 'rotate(180deg)' : 'rotate(0)', 
                      transition: 'transform 0.25s ease',
                      flexShrink: 0
                    }} 
                  />
                </button>
                
                {isOpen && (
                  <div style={{ padding: '0 1.5rem 1.5rem 1.5rem', fontSize: '0.9rem', color: '#654B38', lineHeight: '1.6', fontWeight: '500' }}>
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
          style={{ 
            ...shopCardStyle,
            padding: 'clamp(2.5rem, 6vw, 5rem) 1.5rem', 
            textAlign: 'center', 
            borderRadius: '30px', 
            position: 'relative',
            overflow: 'hidden',
            boxSizing: 'border-box'
          }}
        >
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', color: '#32180D', marginBottom: '1rem', fontFamily: 'var(--font-serif)', fontWeight: '850' }}>
            Made With Intention. Shared With Love.
          </h2>
          <p style={{ color: '#654B38', fontSize: '1.02rem', maxWidth: '520px', margin: '0.5rem auto 2.5rem', lineHeight: '1.7', fontWeight: '500' }}>
            Discover the story, ingredients and rituals behind MILASTY.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link 
              to="/our-story" 
              className="btn-primary" 
              style={{ 
                padding: '0.95rem 2.25rem', 
                fontSize: '0.92rem', 
                backgroundColor: '#2F6B3A', 
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
                borderColor: '#DCC8AE', 
                color: '#32180D', 
                borderRadius: '999px', 
                fontWeight: '850', 
                textDecoration: 'none',
                backgroundColor: '#FFF9F0'
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
