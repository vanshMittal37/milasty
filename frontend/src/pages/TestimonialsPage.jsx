import React from 'react';
import TestimonialSection from '../components/TestimonialSection';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';

export default function TestimonialsPage() {
  return (
    <div style={{ backgroundColor: '#1C120C', minHeight: '100vh', paddingBottom: '5rem', color: '#FFFDF9' }}>
      {/* Page Hero Header */}
      <div
        style={{
          background: 'linear-gradient(180deg, rgba(35, 21, 13, 0.95) 0%, rgba(28, 18, 12, 1) 100%)',
          padding: '4.5rem 1.5rem 2.5rem',
          textAlign: 'center',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <span
            style={{
              backgroundColor: 'rgba(200, 155, 60, 0.15)',
              color: 'var(--accent-gold)',
              border: '1px solid rgba(200, 155, 60, 0.3)',
              padding: '0.4rem 1.1rem',
              borderRadius: '20px',
              fontSize: '0.8rem',
              fontWeight: '700',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1.25rem',
            }}
          >
            <Sparkles size={14} /> REVIEWS & TESTIMONIALS
          </span>
          <h1
            style={{
              fontSize: 'clamp(2.2rem, 5vw, 3.4rem)',
              fontFamily: 'var(--font-serif)',
              fontWeight: '800',
              color: '#FFFDF9',
              lineHeight: '1.2',
              margin: '0 0 1rem 0',
            }}
          >
            Loved by <span style={{ color: '#A3B580' }}>Celebrities</span> & Health-Conscious Homes
          </h1>
          <p
            style={{
              fontSize: '1.05rem',
              color: 'rgba(255, 255, 255, 0.75)',
              lineHeight: '1.6',
              margin: '0 auto 1.5rem',
              maxWidth: '620px',
            }}
          >
            Read authentic reviews and experiences from our valued customers and wellness icons who make Milasty's millet bakes part of their daily lifestyle.
          </p>
        </div>
      </div>

      {/* Main Review & Testimonial Component */}
      <TestimonialSection />

      {/* Bottom CTA Banner */}
      <div style={{ maxWidth: '1000px', margin: '3rem auto 0', padding: '0 1.5rem' }}>
        <div
          style={{
            backgroundColor: '#241A13',
            border: '1px solid #3E2F23',
            borderRadius: '24px',
            padding: '2.5rem 2rem',
            textAlign: 'center',
            boxShadow: '0 12px 36px rgba(0,0,0,0.3)',
          }}
        >
          <h3 style={{ fontSize: '1.6rem', fontFamily: 'var(--font-serif)', margin: '0 0 0.75rem 0', color: '#FFFDF9' }}>
            Ready to taste the guiltless indulgence?
          </h3>
          <p style={{ color: 'rgba(255, 255, 255, 0.7)', margin: '0 0 1.75rem 0', fontSize: '0.98rem' }}>
            Explore our artisanal organic millet cookies baked fresh with pure A2 Desi Ghee & natural Jaggery.
          </p>
          <Link
            to="/shop"
            style={{
              backgroundColor: '#A3B580',
              color: '#1C120C',
              padding: '0.85rem 2rem',
              borderRadius: '30px',
              fontWeight: '800',
              fontSize: '0.95rem',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.6rem',
              boxShadow: '0 6px 20px rgba(163, 181, 128, 0.3)',
              transition: 'transform 0.2s ease',
            }}
          >
            Explore Shop <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </div>
  );
}
