import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Sparkles, ShieldCheck, Award, Leaf, Flame, Compass, ChevronRight, MessageSquare, Info, ChevronLeft } from 'lucide-react';
import Logo from '../components/Logo';

export default function OurStory() {
  const journeyRef = useRef(null);
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
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(135deg, rgba(15, 8, 4, 0.42) 0%, rgba(28, 14, 9, 0.32) 100%)',
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
              fontSize: '0.8rem', 
              textTransform: 'uppercase', 
              letterSpacing: '0.14em', 
              color: '#b9cd94', 
              fontWeight: '850',
              backgroundColor: 'rgba(36, 79, 33, 0.35)',
              padding: '0.4rem 0.95rem',
              borderRadius: '999px',
              border: '1.5px solid rgba(185, 205, 148, 0.4)'
            }}
          >
            Our Story
          </span>
          <h1 
            style={{ 
              fontSize: 'clamp(2.5rem, 5.5vw, 3.8rem)', 
              fontFamily: 'var(--font-serif)', 
              color: '#FFFDF9', 
              fontWeight: '850', 
              lineHeight: '1.15',
              letterSpacing: '-0.02em',
              margin: 0,
              textShadow: '0 2px 10px rgba(0,0,0,0.5)'
            }}
          >
            Born From a Mother's Search<br />for Better Snacking.
          </h1>
          <p 
            style={{ 
              fontSize: '1.15rem', 
              color: '#F5EBDD', 
              lineHeight: '1.75', 
              maxWidth: '540px',
              margin: '0.5rem 0 1.5rem',
              fontWeight: '550'
            }}
          >
            Milasty began with a simple question: Can everyday snacking be wholesome, honest, and genuinely delicious?
          </p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Link 
              to="/products" 
              className="btn-primary" 
              style={{ padding: '0.9rem 2.25rem', fontSize: '0.92rem', backgroundColor: '#244f21', color: '#FFFFFF', border: 'none', borderRadius: '999px', fontWeight: '850', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <span>Discover Our Rituals</span>
              <ChevronRight size={16} />
            </Link>
            <Link 
              to="/shop" 
              className="btn-secondary" 
              style={{ padding: '0.9rem 2.25rem', fontSize: '0.92rem', borderColor: '#b9cd94', color: '#b9cd94', backgroundColor: 'rgba(36, 79, 33, 0.25)', borderRadius: '999px', fontWeight: '850' }}
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
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}
          >
            <img
              src="/images/image2.jpeg"
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
              backgroundColor: 'rgba(28, 14, 9, 0.85)',
              padding: '0.55rem 1.15rem',
              borderRadius: '999px',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              fontSize: '0.78rem',
              fontWeight: '850',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: '#FFFDF9',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              pointerEvents: 'none'
            }}
          >
            <Sparkles size={13} color="#b9cd94" />
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
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.35)'
              }}
            >
              <img 
                src="/images/image3.jpeg" 
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
                backgroundColor: '#244f21', 
                color: '#FFFFFF', 
                padding: '0.65rem 1.25rem', 
                borderRadius: '12px',
                fontSize: '0.78rem',
                fontWeight: '850',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                boxShadow: '0 8px 20px rgba(0,0,0,0.3)'
              }}
            >
              Where It All Began
            </div>
          </div>

          {/* Right Text Block */}
          <div>
            <h2 
              style={{ 
                fontSize: 'clamp(1.6rem, 3.5vw, 2.2rem)', 
                fontFamily: 'var(--font-serif)', 
                color: '#FFFDF9', 
                marginBottom: '1.75rem', 
                lineHeight: '1.3',
                fontStyle: 'italic',
                fontWeight: '850',
                textShadow: '0 2px 8px rgba(0,0,0,0.4)'
              }}
            >
              "Snacking should nourish your soul, not burden your conscience."
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', color: '#F5EBDD', lineHeight: '1.85', fontSize: '1.02rem', fontWeight: '550' }}>
              <p>
                MILASTY was founded by <strong style={{ color: '#b9cd94', fontWeight: '800' }}>Anwesha</strong> in Greater Noida after realizing that almost every commercial snack labeled "digestive", "sugar-free", or "oats" on supermarket shelves was packed with hidden palm oil, refined maida flour, and synthetic preservatives.
              </p>
              <p>
                We set out to revive India's rich heritage of <strong style={{ color: '#b9cd94', fontWeight: '800' }}>millet baking</strong>. By pairing Pearl Millet (<strong style={{ color: '#b9cd94', fontWeight: '800' }}>Bajra</strong>), Sorghum (<strong style={{ color: '#b9cd94', fontWeight: '800' }}>Jowar</strong>), and Finger Millet (<strong style={{ color: '#b9cd94', fontWeight: '800' }}>Ragi</strong>) with 100% pure <strong style={{ color: '#b9cd94', fontWeight: '800' }}>Desi Ghee</strong> and organic <strong style={{ color: '#b9cd94', fontWeight: '800' }}>jaggery</strong>, we proved that healthy, <strong style={{ color: '#b9cd94', fontWeight: '800' }}>clean</strong> snacks can taste truly extraordinary.
              </p>
            </div>

            <blockquote 
              style={{ 
                borderLeft: '4px solid #b9cd94', 
                paddingLeft: '1.25rem', 
                margin: '2rem 0 2rem 0',
                fontFamily: 'var(--font-serif)',
                color: '#FFFDF9',
                fontWeight: '800',
                fontSize: '1.15rem'
              }}
            >
              "From a mother's kitchen to mindful, guilt-free homes across India."
            </blockquote>

            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', marginTop: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: '850', color: '#FFFDF9', fontSize: '0.88rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <ShieldCheck size={18} color="#b9cd94" />
                <span>Small Batch Crafted</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: '850', color: '#FFFDF9', fontSize: '0.88rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <Award size={18} color="#b9cd94" />
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
              <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.14em', color: '#b9cd94', fontWeight: '850', display: 'block', marginBottom: '0.5rem' }}>Milestones</span>
              <h2 style={{ fontSize: '2.25rem', fontFamily: 'var(--font-serif)', color: '#FFFDF9', fontWeight: '850', margin: 0, textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
                The MILASTY Journey
              </h2>
            </div>
            <div className="section-scroll-buttons" style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                onClick={() => scrollLeft(journeyRef)} 
                style={{ backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(245,235,221,0.25)', color: '#FFFDF9', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                onClick={() => scrollRight(journeyRef)} 
                style={{ backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(245,235,221,0.25)', color: '#FFFDF9', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div 
            ref={journeyRef}
            className="horizontal-scroll-container fitted-cards-container-5"
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
                  padding: '1.75rem',
                  borderRadius: '20px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  boxShadow: '0 12px 36px rgba(0, 0, 0, 0.35)',
                  transition: 'transform 0.2s',
                  position: 'relative',
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'none'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: '900', color: '#b9cd94' }}>{milestone.step}</span>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#b9cd94' }} />
                </div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: '850', color: '#FFFDF9', margin: '0 0 0.5rem 0' }}>{milestone.title}</h4>
                <p style={{ fontSize: '0.88rem', color: '#F5EBDD', lineHeight: '1.65', margin: 0, fontWeight: '550' }}>{milestone.desc}</p>
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
              <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.14em', color: '#b9cd94', fontWeight: '850', display: 'block', marginBottom: '0.5rem' }}>Our Principles</span>
              <h2 style={{ fontSize: '2.25rem', fontFamily: 'var(--font-serif)', color: '#FFFDF9', fontWeight: '850', margin: 0, textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>Our Non-Negotiables</h2>
              <p style={{ fontSize: '0.95rem', color: '#F5EBDD', fontWeight: '600', margin: '0.5rem 0 0 0' }}>The guidelines behind every single MILASTY bake.</p>
            </div>
            <div className="section-scroll-buttons" style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                onClick={() => scrollLeft(nonNegotiablesRef)} 
                style={{ backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(245,235,221,0.25)', color: '#FFFDF9', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                onClick={() => scrollRight(nonNegotiablesRef)} 
                style={{ backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(245,235,221,0.25)', color: '#FFFDF9', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div 
            ref={nonNegotiablesRef}
            className="horizontal-scroll-container fitted-cards-container-3"
          >
            
            <div className="glass-card" style={{ padding: '2.25rem 2rem', borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.2)', transition: 'transform 0.2s' }} onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-3px)'} onMouseOut={(e) => e.currentTarget.style.transform = 'none'}>
              <span style={{ fontSize: '0.85rem', fontWeight: '850', color: '#b9cd94', display: 'block', marginBottom: '0.75rem' }}>01</span>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '850', color: '#FFFDF9', marginBottom: '0.75rem', margin: 0 }}>Zero Palm Oil</h3>
              <p style={{ fontSize: '0.9rem', color: '#F5EBDD', lineHeight: '1.65', margin: 0, fontWeight: '550' }}>
                We exclusively bake with 100% pure Cow Desi Ghee. No cheap vegetable fats, trans fats, or hydrogenated oils ever enter our bakery.
              </p>
            </div>

            <div className="glass-card" style={{ padding: '2.25rem 2rem', borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.2)', transition: 'transform 0.2s' }} onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-3px)'} onMouseOut={(e) => e.currentTarget.style.transform = 'none'}>
              <span style={{ fontSize: '0.85rem', fontWeight: '850', color: '#b9cd94', display: 'block', marginBottom: '0.75rem' }}>02</span>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '850', color: '#FFFDF9', marginBottom: '0.75rem', margin: 0 }}>Unrefined Jaggery</h3>
              <p style={{ fontSize: '0.9rem', color: '#F5EBDD', lineHeight: '1.65', margin: 0, fontWeight: '550' }}>
                Naturally sweetened using organic jaggery rich in iron and essential minerals. Zero refined white sugar or artificial sweeteners.
              </p>
            </div>

            <div className="glass-card" style={{ padding: '2.25rem 2rem', borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.2)', transition: 'transform 0.2s' }} onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-3px)'} onMouseOut={(e) => e.currentTarget.style.transform = 'none'}>
              <span style={{ fontSize: '0.85rem', fontWeight: '850', color: '#b9cd94', display: 'block', marginBottom: '0.75rem' }}>03</span>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '850', color: '#FFFDF9', marginBottom: '0.75rem', margin: 0 }}>Zero Preservatives</h3>
              <p style={{ fontSize: '0.9rem', color: '#F5EBDD', lineHeight: '1.65', margin: 0, fontWeight: '550' }}>
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
              <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.14em', color: '#b9cd94', fontWeight: '850', display: 'block', marginBottom: '0.5rem' }}>Honest Baking</span>
              <h2 style={{ fontSize: '2.25rem', fontFamily: 'var(--font-serif)', color: '#FFFDF9', fontWeight: '850', margin: 0, textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
                What Goes Into Every Bake
              </h2>
            </div>
            <div className="section-scroll-buttons" style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                onClick={() => scrollLeft(ingredientsRef)} 
                style={{ backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(245,235,221,0.25)', color: '#FFFDF9', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                onClick={() => scrollRight(ingredientsRef)} 
                style={{ backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(245,235,221,0.25)', color: '#FFFDF9', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div 
            ref={ingredientsRef}
            className="horizontal-scroll-container fitted-cards-container-4"
          >
            {[
              { name: 'BAJRA', type: 'Pearl Millet', desc: 'Powerhouse of fiber, magnesium, and essential nutrients.', img: '/images/bajra.jpeg' },
              { name: 'JOWAR', type: 'Sorghum Millet', desc: 'Gluten-free grain that aids digestion and regulates blood sugar.', img: '/images/jowar.jpeg' },
              { name: 'RAGI', type: 'Finger Millet', desc: 'Calcium-rich grain that builds bone strength naturally.', img: '/images/ragi.jpeg' },
              { name: 'DESI GHEE', type: 'Pure Cow Ghee', desc: 'Rich in A2 fats, vitamins, providing aroma and crisp texture.', img: '/images/ghee.jpeg' },
            ].map((ingredient) => (
              <div key={ingredient.name} style={{ textAlign: 'center', width: '100%' }}>
                <img 
                  src={ingredient.img} 
                  alt={ingredient.name} 
                  style={{ width: '130px', height: '130px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(185, 205, 148, 0.4)', margin: '0 auto 1.25rem', display: 'block', boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }} 
                />
                <h4 style={{ fontSize: '1.05rem', fontWeight: '850', color: '#FFFDF9', margin: '0 0 0.2rem 0' }}>{ingredient.name}</h4>
                <span style={{ fontSize: '0.8rem', color: '#b9cd94', fontWeight: '850', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{ingredient.type}</span>
                <p style={{ fontSize: '0.85rem', color: '#F5EBDD', lineHeight: '1.55', marginTop: '0.45rem', padding: '0 0.5rem', fontWeight: '550' }}>{ingredient.desc}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 7. MILASTY DIFFERENCE COMPARISON SECTION */}
      <section style={{ backgroundColor: 'transparent', padding: '6rem 0', borderTop: '1px solid rgba(245, 220, 180, 0.15)', borderBottom: '1px solid rgba(245, 220, 180, 0.15)' }}>
        <div style={{ maxWidth: '850px', margin: '0 auto', paddingLeft: '1.5rem', paddingRight: '1.5rem' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{ fontSize: '2.25rem', fontFamily: 'var(--font-serif)', color: '#FFFDF9', fontWeight: '850', marginBottom: '0.5rem', textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
              Why MILASTY Feels Different
            </h2>
            <p style={{ fontSize: '0.98rem', color: '#F5EBDD', fontWeight: '600' }}>Comparing mindful everyday baking with mass-produced alternatives.</p>
          </div>

          <div 
            className="glass-card about-comparison-card"
            style={{ 
              borderRadius: '24px', 
              border: '1px solid rgba(255, 255, 255, 0.2)', 
              boxShadow: '0 16px 48px rgba(0,0,0,0.3)',
              overflow: 'hidden',
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', backgroundColor: 'rgba(36, 79, 33, 0.45)', color: '#FFFFFF', padding: '1.25rem 1.75rem', fontWeight: '850', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '1px solid rgba(255, 255, 255, 0.15)' }}>
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
                    fontSize: '0.95rem', 
                    borderBottom: idx < 3 ? '1px solid rgba(255, 255, 255, 0.12)' : 'none',
                    fontWeight: '600',
                    color: '#FFFDF9'
                  }}
                >
                  <span style={{ color: '#b9cd94', fontWeight: '850' }}>✓ {row.milasty}</span>
                  <span style={{ color: '#F5EBDD', opacity: 0.9 }}>✕ {row.standard}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* 9. TRUST & TRANSPARENCY SECTION */}
      <section style={{ backgroundColor: 'transparent', padding: '6.5rem 0', borderBottom: '1px solid rgba(245,220,180,0.15)' }}>
        <div style={{ maxWidth: '750px', margin: '0 auto', paddingLeft: '1.5rem', paddingRight: '1.5rem' }}>
          <div className="glass-card" style={{ padding: '3.5rem 2.5rem', borderRadius: '24px', textAlign: 'center' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '50%', backgroundColor: 'rgba(36, 79, 33, 0.4)', color: '#b9cd94', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', border: '1px solid rgba(185, 205, 148, 0.35)' }}>
              <Info size={24} />
            </div>
            <h2 style={{ fontSize: '2.2rem', fontFamily: 'var(--font-serif)', color: '#FFFDF9', fontWeight: '850', marginBottom: '1rem' }}>
              Know What Goes Into Your Food.
            </h2>
            <p style={{ fontSize: '1rem', color: '#F5EBDD', lineHeight: '1.7', marginBottom: '2.5rem', fontWeight: '550' }}>
              We maintain 100% transparency in recipe designs, nutritional parameters, and batch-test laboratory reports.
            </p>
            <Link
              to="/nutrition"
              className="btn-primary"
              style={{ padding: '0.95rem 2.25rem', fontSize: '0.92rem', backgroundColor: '#244f21', color: '#FFFFFF', border: 'none', borderRadius: '999px', textDecoration: 'none', fontWeight: '850' }}
            >
              Explore Nutrition & Lab Reports
            </Link>
          </div>
        </div>
      </section>



      {/* CSS style overrides for horizontal scroll containers, fitted card grids, and transparent blurred card styles */}
      <style>{`
        .horizontal-scroll-container::-webkit-scrollbar {
          display: none !important;
        }
        .horizontal-scroll-container {
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
        }
        .our-story-page .glass-card {
          background: rgba(28, 14, 9, 0.18) !important;
          background-color: rgba(28, 14, 9, 0.18) !important;
          backdrop-filter: blur(15px) saturate(140%) !important;
          -webkit-backdrop-filter: blur(15px) saturate(140%) !important;
          border: 1px solid rgba(255, 255, 255, 0.20) !important;
          box-shadow: 0 12px 36px rgba(0, 0, 0, 0.25) !important;
          transition: all 0.3s ease !important;
        }
        .our-story-page .glass-card:hover {
          background: rgba(36, 79, 33, 0.25) !important;
          border: 1px solid rgba(185, 205, 148, 0.45) !important;
          transform: translateY(-3px) !important;
        }
        .fitted-cards-container-5 {
          display: grid !important;
          grid-template-columns: repeat(5, 1fr) !important;
          gap: 1.25rem !important;
          width: 100% !important;
          box-sizing: border-box !important;
        }
        .fitted-cards-container-4 {
          display: grid !important;
          grid-template-columns: repeat(4, 1fr) !important;
          gap: 2rem !important;
          width: 100% !important;
          box-sizing: border-box !important;
        }
        .fitted-cards-container-3 {
          display: grid !important;
          grid-template-columns: repeat(3, 1fr) !important;
          gap: 1.5rem !important;
          width: 100% !important;
          box-sizing: border-box !important;
        }
        .fitted-cards-container-5 .glass-card,
        .fitted-cards-container-4 .glass-card,
        .fitted-cards-container-3 .glass-card {
          width: 100% !important;
          max-width: 100% !important;
          min-width: 0 !important;
          box-sizing: border-box !important;
          flex: none !important;
        }
        @media (min-width: 1025px) {
          .section-scroll-buttons {
            display: none !important;
          }
        }
        @media (max-width: 1024px) {
          .fitted-cards-container-5 {
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 1rem !important;
          }
          .fitted-cards-container-4 {
            grid-template-columns: repeat(4, 1fr) !important;
            gap: 1.5rem !important;
          }
          .fitted-cards-container-3 {
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 1rem !important;
          }
        }
        @media (max-width: 768px) {
          .fitted-cards-container-5,
          .fitted-cards-container-4,
          .fitted-cards-container-3 {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 1rem !important;
          }
        }
        @media (max-width: 640px) {
          .fitted-cards-container-5,
          .fitted-cards-container-3 {
            display: flex !important;
            grid-template-columns: none !important;
            overflow-x: auto !important;
            scroll-behavior: smooth !important;
            padding-bottom: 1.25rem !important;
            gap: 1rem !important;
            -webkit-overflow-scrolling: touch;
          }
          .fitted-cards-container-5 .glass-card,
          .fitted-cards-container-3 .glass-card {
            flex: 0 0 270px !important;
            width: 270px !important;
            max-width: 270px !important;
            min-width: 270px !important;
          }
        }
      `}</style>
      </div>
    </div>
  );
}
