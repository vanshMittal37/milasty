import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Sparkles, ShieldCheck, Award, Leaf, Flame, Compass, ChevronRight, MessageSquare, Info, ChevronLeft } from 'lucide-react';
import Logo from '../components/Logo';

export default function OurStory() {
  const journeyRef = useRef(null);
  const simpleRef = useRef(null);
  const nonNegotiablesRef = useRef(null);
  const ingredientsRef = useRef(null);

  const scrollLeft = (ref) => {
    if (ref.current) {
      ref.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
  };

  const scrollRight = (ref) => {
    if (ref.current) {
      ref.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
  };

  return (
    <div
      className="our-story-page"
      style={{
        minHeight: '100vh',
        padding: '0 0 5rem',
        position: 'relative',
        backgroundImage: 'url(/images/about_background_image.jpeg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Dark overlay for readability */}
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'linear-gradient(135deg, rgba(20, 10, 5, 0.45) 0%, rgba(36, 19, 13, 0.35) 100%)',
        zIndex: 0,
        pointerEvents: 'none',
      }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
      
      {/* 1. STORYTELLING HERO SECTION */}
      <section 
        className="shop-hero"
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
          gap: '4rem', 
          alignItems: 'center', 
          padding: '5rem 0 6rem',
          maxWidth: '1200px',
          margin: '0 auto',
          paddingLeft: '1.5rem',
          paddingRight: '1.5rem'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <span 
            style={{ 
              alignSelf: 'flex-start',
              fontSize: '0.78rem', 
              textTransform: 'uppercase', 
              letterSpacing: '0.12em', 
              color: 'var(--accent-gold)', 
              fontWeight: '800',
              backgroundColor: 'rgba(197, 160, 89, 0.08)',
              padding: '0.35rem 0.85rem',
              borderRadius: '999px',
              border: '1px solid rgba(197, 160, 89, 0.15)'
            }}
          >
            Our Story
          </span>
          <h1 
            style={{ 
              fontSize: 'clamp(2.5rem, 5.5vw, 3.8rem)', 
              fontFamily: 'var(--font-serif)', 
              color: 'var(--primary-dark)', 
              fontWeight: '800', 
              lineHeight: '1.15',
              letterSpacing: '-0.02em',
              margin: 0
            }}
          >
            Born From a Mother's Search<br />for Better Snacking.
          </h1>
          <p 
            style={{ 
              fontSize: '1.15rem', 
              color: 'var(--text-muted)', 
              lineHeight: '1.7', 
              maxWidth: '540px',
              margin: '0.5rem 0 1.5rem'
            }}
          >
            Milasty began with a simple question: Can everyday snacking be wholesome, honest, and genuinely delicious?
          </p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Link 
              to="/products" 
              className="btn-primary" 
              style={{ padding: '0.9rem 2.25rem', fontSize: '0.92rem', backgroundColor: 'var(--primary-dark)', color: 'var(--bg-main)', border: 'none', borderRadius: '999px', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <span>Discover Our Rituals</span>
              <ChevronRight size={16} />
            </Link>
            <Link 
              to="/shop" 
              className="btn-secondary" 
              style={{ padding: '0.9rem 2.25rem', fontSize: '0.92rem', borderColor: 'var(--primary-dark)', color: 'var(--primary-dark)', borderRadius: '999px', fontWeight: '800' }}
            >
              <span>Explore Our Bakes</span>
            </Link>
          </div>
        </div>

        {/* Hero image block with label */}
        <div style={{ position: 'relative' }}>
          <div 
            style={{ 
              position: 'relative', 
              overflow: 'hidden', 
              borderRadius: '24px', 
              boxShadow: '0 20px 40px rgba(56,20,35,0.06)',
              border: '1px solid rgba(245, 220, 180, 0.18)'
            }}
          >
            <img
              src="https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?auto=format&fit=crop&w=800&q=80"
              alt="Millet baking ingredients"
              style={{
                width: '100%',
                display: 'block',
                transition: 'transform 0.6s ease',
                objectFit: 'cover',
                height: '420px'
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            />
          </div>
          <div 
            style={{ 
              position: 'absolute', 
              bottom: '24px', 
              right: '24px',
              backgroundColor: 'transparent',
              padding: '0.55rem 1.15rem',
              borderRadius: '999px',
              border: '1px solid rgba(245, 235, 221, 0.20)',
              fontSize: '0.75rem',
              fontWeight: '800',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--text-light)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              pointerEvents: 'none'
            }}
          >
            <Sparkles size={13} color="var(--accent-gold)" />
            <span>Handcrafted with intention</span>
          </div>
        </div>
      </section>

      {/* 2. EDITORIAL FOUNDER STORY SECTION */}
      <section style={{ backgroundColor: 'transparent', padding: '6rem 0', borderTop: '1px solid rgba(245, 220, 180, 0.15)', borderBottom: '1px solid rgba(245, 220, 180, 0.15)' }}>
        <div 
          className="story-grid"
          style={{ 
            maxWidth: '1200px', 
            margin: '0 auto', 
            paddingLeft: '1.5rem', 
            paddingRight: '1.5rem',
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
            gap: '4.5rem', 
            alignItems: 'center' 
          }}
        >
          {/* Left Founder Image */}
          <div style={{ position: 'relative' }}>
            <div 
              style={{ 
                borderRadius: '24px', 
                overflow: 'hidden', 
                border: '1px solid rgba(245, 220, 180, 0.18)',
                boxShadow: '0 20px 40px rgba(56,20,35,0.04)'
              }}
            >
              <img 
                src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=800&q=80" 
                alt="Mother baking in kitchen" 
                style={{ width: '100%', height: '480px', objectFit: 'cover', display: 'block' }} 
              />
            </div>
            {/* Overlay Quote label */}
            <div 
              style={{ 
                position: 'absolute', 
                top: '24px', 
                left: '24px', 
                backgroundColor: 'var(--primary-dark)', 
                color: 'var(--bg-main)', 
                padding: '0.65rem 1.25rem', 
                borderRadius: '12px',
                fontSize: '0.78rem',
                fontWeight: '750',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                boxShadow: 'var(--shadow-md)'
              }}
            >
              Where It All Began
            </div>
          </div>

          {/* Right Text Block */}
          <div>
            <h2 
              style={{ 
                fontSize: 'clamp(1.5rem, 3.5vw, 2.1rem)', 
                fontFamily: 'var(--font-serif)', 
                color: 'var(--primary-dark)', 
                marginBottom: '1.75rem', 
                lineHeight: '1.3',
                fontStyle: 'italic'
              }}
            >
              "Snacking should nourish your soul, not burden your conscience."
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', color: '#2C221E', lineHeight: '1.8', fontSize: '1.02rem', fontWeight: '500' }}>
              <p>
                MILASTY was founded by <strong style={{ color: 'var(--primary-dark)' }}>Anwesha</strong> in Greater Noida after realizing that almost every commercial snack labeled "digestive", "sugar-free", or "oats" on supermarket shelves was packed with hidden palm oil, refined maida flour, and synthetic preservatives.
              </p>
              <p>
                We set out to revive India's rich heritage of <strong style={{ color: 'var(--accent-gold)' }}>millet baking</strong>. By pairing Pearl Millet (<strong style={{ color: 'var(--primary-dark)' }}>Bajra</strong>), Sorghum (<strong style={{ color: 'var(--primary-dark)' }}>Jowar</strong>), and Finger Millet (<strong style={{ color: 'var(--primary-dark)' }}>Ragi</strong>) with 100% pure <strong style={{ color: 'var(--primary-dark)' }}>Desi Ghee</strong> and organic <strong style={{ color: 'var(--primary-dark)' }}>jaggery</strong>, we proved that healthy, <strong style={{ color: 'var(--accent-gold)' }}>clean</strong> snacks can taste truly extraordinary.
              </p>
            </div>

            <blockquote 
              style={{ 
                borderLeft: '4px solid var(--accent-gold)', 
                paddingLeft: '1.25rem', 
                margin: '2rem 0 2rem 0',
                fontFamily: 'var(--font-serif)',
                color: 'var(--primary-dark)',
                fontWeight: '700',
                fontSize: '1.1rem'
              }}
            >
              "From a mother's kitchen to mindful, guilt-free homes across India."
            </blockquote>

            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', marginTop: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: '800', color: 'var(--primary-dark)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <ShieldCheck size={18} color="var(--accent-gold)" />
                <span>Small Batch Crafted</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: '800', color: 'var(--primary-dark)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <Award size={18} color="var(--accent-gold)" />
                <span>Zero Compromise</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. MILESTONES TIMELINE SECTION */}
      <section style={{ padding: '6rem 0', backgroundColor: 'transparent' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', paddingLeft: '1.5rem', paddingRight: '1.5rem' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3.5rem' }}>
            <div>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent-gold)', fontWeight: '800', display: 'block', marginBottom: '0.5rem' }}>Milestones</span>
              <h2 style={{ fontSize: '2.25rem', fontFamily: 'var(--font-serif)', color: 'var(--text-light)', fontWeight: '800', margin: 0 }}>
                The MILASTY Journey
              </h2>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                onClick={() => scrollLeft(journeyRef)} 
                style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(245,235,221,0.2)', color: 'var(--text-light)', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                onClick={() => scrollRight(journeyRef)} 
                style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(245,235,221,0.2)', color: 'var(--text-light)', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div 
            ref={journeyRef}
            className="horizontal-scroll-container"
            style={{ 
              display: 'flex', 
              gap: '1.5rem', 
              overflowX: 'auto', 
              scrollBehavior: 'smooth',
              paddingBottom: '1rem'
            }}
          >
            {[
              { step: '01', title: 'The Question', desc: 'Can everyday bakery snacks be healthy, clean, and genuinely delicious?' },
              { step: '02', title: 'The Search', desc: 'Sourcing honest local ingredients, unrefined sweeteners, and traditional grains.' },
              { step: '03', title: 'The First Bake', desc: 'Experimenting in small home batches with millet, pure Desi Ghee, and organic jaggery.' },
              { step: '04', title: 'MILASTY is Born', desc: 'A better, mindful way of snacking, establishing our small-batch bakery.' },
              { step: '05', title: 'Today', desc: 'Bringing handcrafted millet bakes to wellness-focused Indian homes.' },
            ].map((milestone) => (
              <div 
                key={milestone.step}
                className="glass-card"
                style={{
                  backgroundColor: 'transparent',
                  padding: '1.75rem',
                  borderRadius: '20px',
                  border: '1px solid rgba(245, 235, 221, 0.25)',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'transform 0.2s',
                  position: 'relative',
                  flexShrink: 0,
                  width: '280px'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'none'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--accent-gold)' }}>{milestone.step}</span>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent-gold)' }} />
                </div>
                <h4 style={{ fontSize: '1rem', fontWeight: '850', color: 'var(--text-light)', margin: '0 0 0.5rem 0' }}>{milestone.title}</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.6', margin: 0, fontWeight: '500' }}>{milestone.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. PHILOSOPHY SECTION */}
      <section style={{ backgroundColor: 'transparent', padding: '6rem 0', borderTop: '1px solid rgba(245, 220, 180, 0.15)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', paddingLeft: '1.5rem', paddingRight: '1.5rem' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3.5rem' }}>
            <div style={{ maxWidth: '600px' }}>
              <h2 style={{ fontSize: '2.25rem', fontFamily: 'var(--font-serif)', color: 'var(--text-light)', fontWeight: '800', marginBottom: '0.75rem', margin: 0 }}>
                Food Should Be Simple.
              </h2>
              <p style={{ fontSize: '1rem', color: 'var(--text-muted)', lineHeight: '1.6', fontWeight: '500', margin: '0.5rem 0 0 0' }}>
                We believe great food doesn't need a long list of complex additives. It just needs the right, wholesome ingredients.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                onClick={() => scrollLeft(simpleRef)} 
                style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(245,235,221,0.2)', color: 'var(--text-light)', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                onClick={() => scrollRight(simpleRef)} 
                style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(245,235,221,0.2)', color: 'var(--text-light)', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div 
            ref={simpleRef}
            className="horizontal-scroll-container"
            style={{ 
              display: 'flex', 
              gap: '1.5rem', 
              overflowX: 'auto', 
              scrollBehavior: 'smooth',
              paddingBottom: '1rem'
            }}
          >
            {[
              { num: '01', title: 'Real Grains', desc: '100% wholesome millet-based ingredients (Bajra, Jowar, Ragi) crafted for healthy everyday snacking.', icon: <Leaf size={24} /> },
              { num: '02', title: 'Honest Sweetness', desc: 'Naturally sweetened with premium organic jaggery rich in iron, containing zero refined white sugar.', icon: <Flame size={24} /> },
              { num: '03', title: 'Tradition, Reimagined', desc: 'Heritage grains and familiar Indian flavors, crafted to match modern, busy lifestyles.', icon: <Compass size={24} /> },
            ].map((card) => (
              <div 
                key={card.num} 
                className="glass-card"
                style={{ 
                  padding: '2.5rem 2rem', 
                  backgroundColor: 'transparent', 
                  borderRadius: '24px', 
                  border: '1px solid rgba(245, 235, 221, 0.25)',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'transform 0.25s',
                  position: 'relative',
                  flexShrink: 0,
                  width: '320px'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'none'}
              >
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'var(--accent-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', border: '1px solid rgba(245, 235, 221, 0.15)' }}>
                  {card.icon}
                </div>
                <span style={{ position: 'absolute', top: '2rem', right: '2rem', fontSize: '1.25rem', fontWeight: '900', color: 'rgba(245, 235, 221, 0.15)' }}>{card.num}</span>
                <h3 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-serif)', color: 'var(--text-light)', fontWeight: '800', marginBottom: '0.75rem', margin: 0 }}>{card.title}</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.65', margin: 0, fontWeight: '500' }}>{card.desc}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 5. REDESIGNED PILLARS SECTION */}
      <section style={{ backgroundColor: 'transparent', padding: '6rem 0', borderTop: '1px solid rgba(245, 220, 180, 0.15)', borderBottom: '1px solid rgba(245, 220, 180, 0.15)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', paddingLeft: '1.5rem', paddingRight: '1.5rem' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3.5rem' }}>
            <div>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent-gold)', fontWeight: '800', display: 'block', marginBottom: '0.5rem' }}>Our Principles</span>
              <h2 style={{ fontSize: '2.25rem', fontFamily: 'var(--font-serif)', color: 'var(--text-light)', fontWeight: '800', margin: 0 }}>Our Non-Negotiables</h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '600', margin: '0.5rem 0 0 0' }}>The guidelines behind every single MILASTY bake.</p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                onClick={() => scrollLeft(nonNegotiablesRef)} 
                style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(245,235,221,0.2)', color: 'var(--text-light)', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                onClick={() => scrollRight(nonNegotiablesRef)} 
                style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(245,235,221,0.2)', color: 'var(--text-light)', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div 
            ref={nonNegotiablesRef}
            className="horizontal-scroll-container"
            style={{ 
              display: 'flex', 
              gap: '1.5rem', 
              overflowX: 'auto', 
              scrollBehavior: 'smooth',
              paddingBottom: '1rem'
            }}
          >
            
            <div className="glass-card" style={{ padding: '2.25rem 2rem', backgroundColor: 'transparent', borderRadius: '20px', border: '1px solid rgba(245, 235, 221, 0.25)', transition: 'transform 0.2s', flexShrink: 0, width: '320px' }} onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-3px)'} onMouseOut={(e) => e.currentTarget.style.transform = 'none'}>
              <span style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--accent-gold)', display: 'block', marginBottom: '0.75rem' }}>01</span>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '850', color: 'var(--text-light)', marginBottom: '0.75rem', margin: 0 }}>Zero Palm Oil</h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: '1.65', margin: 0, fontWeight: '500' }}>
                We exclusively bake with 100% pure Cow Desi Ghee. No cheap vegetable fats, trans fats, or hydrogenated oils ever enter our bakery.
              </p>
            </div>

            <div className="glass-card" style={{ padding: '2.25rem 2rem', backgroundColor: 'transparent', borderRadius: '20px', border: '1px solid rgba(245, 235, 221, 0.25)', transition: 'transform 0.2s', flexShrink: 0, width: '320px' }} onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-3px)'} onMouseOut={(e) => e.currentTarget.style.transform = 'none'}>
              <span style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--accent-gold)', display: 'block', marginBottom: '0.75rem' }}>02</span>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '850', color: 'var(--text-light)', marginBottom: '0.75rem', margin: 0 }}>Unrefined Jaggery</h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: '1.65', margin: 0, fontWeight: '500' }}>
                Naturally sweetened using organic jaggery rich in iron and essential minerals. Zero refined white sugar or artificial sweeteners.
              </p>
            </div>

            <div className="glass-card" style={{ padding: '2.25rem 2rem', backgroundColor: 'transparent', borderRadius: '20px', border: '1px solid rgba(245, 235, 221, 0.25)', transition: 'transform 0.2s', flexShrink: 0, width: '320px' }} onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-3px)'} onMouseOut={(e) => e.currentTarget.style.transform = 'none'}>
              <span style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--accent-gold)', display: 'block', marginBottom: '0.75rem' }}>03</span>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '850', color: 'var(--text-light)', marginBottom: '0.75rem', margin: 0 }}>Zero Preservatives</h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: '1.65', margin: 0, fontWeight: '500' }}>
                No artificial food coloring, chemical preservatives, or synthetic shelf-life extenders. Just honest, wholesome, fresh baking.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* 6. INGREDIENTS LAYOUT SECTION */}
      <section style={{ backgroundColor: 'transparent', padding: '6rem 0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', paddingLeft: '1.5rem', paddingRight: '1.5rem' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3.5rem' }}>
            <div>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--accent-gold)', fontWeight: '800', display: 'block', marginBottom: '0.5rem' }}>Honest Baking</span>
              <h2 style={{ fontSize: '2.25rem', fontFamily: 'var(--font-serif)', color: 'var(--text-light)', fontWeight: '800', margin: 0 }}>
                What Goes Into Every Bake
              </h2>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                onClick={() => scrollLeft(ingredientsRef)} 
                style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(245,235,221,0.2)', color: 'var(--text-light)', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                onClick={() => scrollRight(ingredientsRef)} 
                style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(245,235,221,0.2)', color: 'var(--text-light)', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div 
            ref={ingredientsRef}
            className="horizontal-scroll-container"
            style={{ 
              display: 'flex', 
              gap: '2rem', 
              overflowX: 'auto', 
              scrollBehavior: 'smooth',
              paddingBottom: '1.5rem'
            }}
          >
            {[
              { name: 'BAJRA', type: 'Pearl Millet', desc: 'Powerhouse of fiber, magnesium, and essential nutrients.', img: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?auto=format&fit=crop&w=300&q=80' },
              { name: 'JOWAR', type: 'Sorghum Millet', desc: 'Gluten-free grain that aids digestion and regulates blood sugar.', img: 'https://images.unsplash.com/photo-1574316071802-0d684efa7bf5?auto=format&fit=crop&w=300&q=80' },
              { name: 'RAGI', type: 'Finger Millet', desc: 'Calcium-rich grain that builds bone strength naturally.', img: 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?auto=format&fit=crop&w=300&q=80' },
              { name: 'DESI GHEE', type: 'Pure Cow Ghee', desc: 'Rich in A2 fats, vitamins, providing aroma and crisp texture.', img: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=300&q=80' },
            ].map((ingredient) => (
              <div key={ingredient.name} style={{ textAlign: 'center', flexShrink: 0, width: '220px' }}>
                <img 
                  src={ingredient.img} 
                  alt={ingredient.name} 
                  style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(245, 235, 221, 0.25)', margin: '0 auto 1.25rem', display: 'block', boxShadow: 'var(--shadow-sm)' }} 
                />
                <h4 style={{ fontSize: '0.98rem', fontWeight: '850', color: 'var(--text-light)', margin: '0 0 0.15rem 0' }}>{ingredient.name}</h4>
                <span style={{ fontSize: '0.78rem', color: 'var(--accent-gold)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{ingredient.type}</span>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.5', marginTop: '0.45rem', padding: '0 0.5rem', fontWeight: '500' }}>{ingredient.desc}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 7. MILASTY DIFFERENCE COMPARISON SECTION */}
      <section style={{ backgroundColor: 'transparent', padding: '6rem 0', borderTop: '1px solid rgba(245, 220, 180, 0.15)', borderBottom: '1px solid rgba(245, 220, 180, 0.15)' }}>
        <div style={{ maxWidth: '850px', margin: '0 auto', paddingLeft: '1.5rem', paddingRight: '1.5rem' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{ fontSize: '2.25rem', fontFamily: 'var(--font-serif)', color: 'var(--text-light)', fontWeight: '800', marginBottom: '0.5rem' }}>
              Why MILASTY Feels Different
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '600' }}>Comparing mindful everyday baking with mass-produced alternatives.</p>
          </div>

          <div 
            style={{ 
              backgroundColor: 'transparent', 
              borderRadius: '24px', 
              border: '1px solid rgba(245, 235, 221, 0.25)', 
              boxShadow: 'var(--shadow-md)',
              overflow: 'hidden',
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)'
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', backgroundColor: '#24130D', color: '#FFFFFF', padding: '1.25rem 1.75rem', fontWeight: '800', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              <span>Mindful Snacking (MILASTY)</span>
              <span>Standard Supermarket Biscuits</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {[
                { milasty: '100% Millet-First (Bajra, Jowar, Ragi)', standard: 'Refined Wheat Flour (Maida) heavy' },
                { milasty: 'Pure Cow Desi Ghee exclusively', standard: 'Cheap Palm Oil & Hydrogenated vegetable fats' },
                { milasty: 'Naturally Sweetened with Jaggery', standard: 'Excessive highly refined white sugar' },
                { milasty: 'Small Batch, fresh baked to order', standard: 'Mass-produced with artificial shelf extenders' }
              ].map((row, idx) => (
                <div 
                  key={idx} 
                  style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1fr 1fr', 
                    padding: '1.25rem 1.75rem', 
                    fontSize: '0.9rem', 
                    borderBottom: idx < 3 ? '1px solid rgba(245, 235, 221, 0.15)' : 'none',
                    fontWeight: '600',
                    color: 'var(--text-light)'
                  }}
                >
                  <span style={{ color: 'var(--accent-gold)' }}>✓ {row.milasty}</span>
                  <span style={{ color: 'var(--text-muted)' }}>✕ {row.standard}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* 8. EMOTIONAL BRAND STATEMENT SECTION */}
      <section 
        style={{ 
          backgroundColor: 'var(--primary-dark)', 
          color: '#FFFFFF', 
          padding: '6.5rem 1.5rem', 
          textAlign: 'center', 
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ maxWidth: '800px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
          <h2 
            style={{ 
              fontSize: 'clamp(2rem, 5vw, 3rem)', 
              fontFamily: 'var(--font-serif)', 
              lineHeight: '1.2', 
              color: '#FDFBF7', 
              marginBottom: '1.5rem',
              fontWeight: '700' 
            }}
          >
            Better Ingredients. Thoughtful Baking.<br />A More Meaningful Snack.
          </h2>
          <p 
            style={{ 
              fontSize: '1.1rem', 
              color: 'rgba(253, 251, 247, 0.85)', 
              lineHeight: '1.7', 
              marginBottom: '2.75rem',
              maxWidth: '560px',
              margin: '0 auto 2.75rem' 
            }}
          >
            Because what we choose to eat every day deserves a little more intention and traditional care.
          </p>
          <Link 
            to="/shop" 
            className="btn-primary" 
            style={{ padding: '1rem 2.5rem', fontSize: '0.95rem', backgroundColor: 'var(--accent-gold)', color: '#24130D', border: 'none', borderRadius: '999px', fontWeight: '800', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <span>Explore MILASTY Bakes</span>
            <ChevronRight size={16} />
          </Link>
        </div>
      </section>

      {/* 9. TRUST & TRANSPARENCY SECTION */}
      <section style={{ backgroundColor: 'transparent', padding: '6.5rem 0', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ maxWidth: '750px', margin: '0 auto', textAlign: 'center', paddingLeft: '1.5rem', paddingRight: '1.5rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(197, 160, 89, 0.08)', color: 'var(--accent-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <Info size={22} />
          </div>
          <h2 style={{ fontSize: '2.1rem', fontFamily: 'var(--font-serif)', color: 'var(--text-light)', fontWeight: '800', marginBottom: '1rem' }}>
            Know What Goes Into Your Food.
          </h2>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: '1.65', marginBottom: '2.5rem', fontWeight: '500' }}>
            We maintain 100% transparency in recipe designs, nutritional parameters, and batch-test laboratory reports.
          </p>
          <Link 
            to="/nutrition" 
            className="btn-primary" 
            style={{ padding: '0.9rem 2.25rem', fontSize: '0.9rem', backgroundColor: 'var(--accent-gold)', color: '#24130D', border: 'none', borderRadius: '999px', textDecoration: 'none', fontWeight: '800' }}
          >
            Explore Nutrition & Lab Reports
          </Link>
        </div>
      </section>

      {/* 10. FOUNDER CLOSING PERSONAL MESSAGE */}
      <section style={{ padding: '6.5rem 0', backgroundColor: 'transparent' }}>
        <div 
          style={{ 
            maxWidth: '900px', 
            margin: '0 auto', 
            paddingLeft: '1.5rem', 
            paddingRight: '1.5rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1.5rem'
          }}
        >
          <Logo variant="emblem" style={{ height: '70px', width: 'auto', marginBottom: '0.25rem' }} />
          <h2 style={{ fontSize: '2.25rem', fontFamily: 'var(--font-serif)', color: 'var(--text-light)', fontWeight: '800', margin: 0 }}>
            Made With the Same Care We'd Give Our Family.
          </h2>
          <p style={{ fontSize: '1.05rem', color: 'var(--text-muted)', lineHeight: '1.8', maxWidth: '640px', margin: 0, fontWeight: '500', fontStyle: 'italic' }}>
            "Every recipe at MILASTY starts inside my kitchen. I wanted simple, guilt-free treats for my family that genuinely support wellness. Our promise is to maintain that same small-batch baking care as we grow."
          </p>
          <div style={{ marginTop: '1.25rem' }}>
            <div style={{ fontSize: '1.1rem', fontFamily: 'var(--font-serif)', color: 'var(--text-light)', fontWeight: '800' }}>— The MILASTY Team</div>
            <span style={{ fontSize: '0.78rem', color: 'var(--accent-gold)', fontWeight: '750', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginTop: '0.2rem' }}>Kitchens of Greater Noida</span>
          </div>
        </div>
      </section>

      {/* 11. FINAL BRAND CONVERSION CTA */}
      <section style={{ backgroundColor: 'transparent', padding: '6.5rem 0', borderTop: '1px solid rgba(245, 220, 180, 0.15)' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center', paddingLeft: '1.5rem', paddingRight: '1.5rem' }}>
          <h2 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-serif)', color: 'var(--text-light)', fontWeight: '800', marginBottom: '1rem', letterSpacing: '-0.01em' }}>
            Ready to Make Snacking a Ritual?
          </h2>
          <p style={{ fontSize: '1rem', color: 'var(--text-muted)', lineHeight: '1.65', marginBottom: '2.5rem', maxWidth: '520px', margin: '0.5rem auto 2.5rem', fontWeight: '500' }}>
            Explore fresh, handcrafted millet bakes made with jaggery, Desi Ghee, and plenty of traditional care.
          </p>
          <div style={{ display: 'flex', gap: '1.1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link 
              to="/shop" 
              className="btn-primary" 
              style={{ padding: '0.95rem 2.25rem', fontSize: '0.9rem', backgroundColor: 'var(--accent-gold)', color: '#24130D', border: 'none', borderRadius: '999px', textDecoration: 'none', fontWeight: '850' }}
            >
              Shop Fresh Bakes
            </Link>
            <Link 
              to="/products" 
              className="btn-secondary" 
              style={{ padding: '0.95rem 2.25rem', fontSize: '0.9rem', borderColor: 'var(--accent-gold)', color: 'var(--accent-gold)', borderRadius: '999px', textDecoration: 'none', fontWeight: '850', backgroundColor: 'transparent' }}
            >
              Discover Our Rituals
            </Link>
          </div>
        </div>
      </section>

      {/* CSS style overrides for horizontal scroll containers */}
      <style>{`
        .horizontal-scroll-container::-webkit-scrollbar {
          display: none !important;
        }
        .horizontal-scroll-container {
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
        }
      `}</style>
      </div>
    </div>
  );
}
