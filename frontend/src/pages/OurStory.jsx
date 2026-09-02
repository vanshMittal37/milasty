import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Sparkles, ShieldCheck, Award, Leaf, Flame, Compass, ChevronRight, MessageSquare, Info, ChevronLeft } from 'lucide-react';
import Logo from '../components/Logo';

// ========================================================
// SECTION 1 — ORBIT JOURNEY (Milestones) COMPONENT
// ========================================================
function OrbitJourneySection() {
  const milestones = [
    { 
      step: '01', 
      title: 'The Question', 
      desc: 'Can everyday bakery snacks be healthy, clean, and genuinely delicious?',
      icon: Compass
    },
    { 
      step: '02', 
      title: 'The Search', 
      desc: 'Sourcing honest local ingredients, unrefined sweeteners, and traditional grains.',
      icon: Leaf
    },
    { 
      step: '03', 
      title: 'The First Bake', 
      desc: 'Experimenting in small home batches with millet, pure Desi Ghee, and organic jaggery.',
      icon: Flame
    },
    { 
      step: '04', 
      title: 'MILASTY is Born', 
      desc: 'A better, mindful way of snacking, establishing our small-batch bakery.',
      icon: ShieldCheck
    },
    { 
      step: '05', 
      title: 'Today', 
      desc: 'Bringing handcrafted millet bakes to wellness-focused Indian homes.',
      icon: Sparkles
    },
  ];

  const [activeIdx, setActiveIdx] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 767);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Cyclic Rotation from Step 1 to 5
  React.useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % milestones.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [isPaused, milestones.length]);

  return (
    <section 
      style={{ 
        padding: isMobile ? '3rem 0 2.5rem' : '6.5rem 0', 
        backgroundColor: 'transparent',
        overflow: 'hidden',
        position: 'relative' 
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div style={{ maxWidth: '1100px', margin: '0 auto', paddingLeft: isMobile ? '0.75rem' : '1.5rem', paddingRight: isMobile ? '0.75rem' : '1.5rem', boxSizing: 'border-box' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 3rem' }}>
          <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--accent-gold)', fontWeight: '850', display: 'block', marginBottom: '0.5rem' }}>
            MILESTONES
          </span>
          <h2 style={{ fontSize: isMobile ? '2.1rem' : '2.8rem', fontFamily: 'var(--font-serif)', color: '#FFFDF9', fontWeight: '850', margin: 0, textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
            The MILASTY <span style={{ color: '#b9cd94', fontSize: '1.18em', fontWeight: '900', textShadow: '0 0 12px rgba(185, 205, 148, 0.4)' }}>Journey</span>
          </h2>
          <p style={{ fontSize: isMobile ? '0.92rem' : '1.05rem', color: '#F5EBDD', fontWeight: '500', marginTop: '0.6rem', lineHeight: '1.6' }}>
            From an inspiring question to handcrafted bakes delivered nationwide.
          </p>
        </div>

        {isMobile ? (
          /* MOBILE EXACT REFERENCE DESIGN */
          <div style={{ position: 'relative', width: '100%', maxWidth: '420px', margin: '0 auto', padding: '0 0.5rem' }}>
            
            {/* Central Vertical Line Path running right down center */}
            <div 
              style={{ 
                position: 'absolute', 
                top: '15px', 
                bottom: '35px', 
                left: '50%', 
                transform: 'translateX(-50%)', 
                width: '2px', 
                backgroundColor: 'rgba(185, 205, 148, 0.55)', 
                boxShadow: '0 0 8px rgba(185, 205, 148, 0.3)',
                zIndex: 1 
              }} 
            />

            {/* List of 5 Milestone Stacked Cards with Top Centered Number Nodes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', position: 'relative', zIndex: 2 }}>
              {milestones.map((m, idx) => {
                const IconComp = m.icon;
                const isHighlight = idx === activeIdx;

                return (
                  <div 
                    key={m.step}
                    onClick={() => {
                      setIsPaused(true);
                      setActiveIdx(idx);
                    }}
                    style={{ position: 'relative', width: '100%', cursor: 'pointer' }}
                  >
                    {/* Top Center Circular Step Number Badge (01..05) */}
                    <div 
                      style={{ 
                        position: 'relative',
                        zIndex: 10,
                        margin: '0 auto -18px',
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        backgroundColor: '#1c3d19',
                        border: isHighlight ? '2px solid var(--accent-gold)' : '1.5px solid #b9cd94',
                        boxShadow: isHighlight ? '0 0 16px rgba(185, 205, 148, 0.6), 0 4px 10px rgba(0,0,0,0.5)' : '0 4px 10px rgba(0,0,0,0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <span style={{ fontSize: '0.85rem', fontWeight: '900', color: '#FFFDF9', fontFamily: 'var(--font-serif)', lineHeight: 1 }}>
                        {m.step}
                      </span>
                    </div>

                    {/* Main Card Container */}
                    <div
                      style={{
                        backgroundColor: isHighlight ? 'rgba(38, 24, 16, 0.94)' : 'rgba(32, 20, 13, 0.82)',
                        backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)',
                        borderRadius: '24px',
                        border: isHighlight ? '1.5px solid #b9cd94' : '1px solid rgba(255, 255, 255, 0.16)',
                        boxShadow: isHighlight ? '0 14px 36px rgba(0,0,0,0.6), 0 0 20px rgba(185, 205, 148, 0.2)' : '0 8px 24px rgba(0,0,0,0.4)',
                        padding: '1.5rem 1.15rem 1.35rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        boxSizing: 'border-box',
                        transition: 'all 0.35s ease'
                      }}
                    >
                      {/* Left Circular Olive-Green Icon Container */}
                      <div 
                        style={{ 
                          width: '72px', 
                          height: '72px', 
                          borderRadius: '50%', 
                          backgroundColor: 'rgba(40, 58, 28, 0.85)', 
                          border: '1.5px solid rgba(185, 205, 148, 0.4)', 
                          boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.5)',
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          flexShrink: 0 
                        }}
                      >
                        <IconComp size={34} color="#b9cd94" strokeWidth={1.5} />
                      </div>

                      {/* Right Text Content Details */}
                      <div style={{ flexGrow: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                          <span style={{ fontSize: '0.62rem', letterSpacing: '0.12em', fontWeight: '900', color: 'rgba(185, 205, 148, 0.85)', textTransform: 'uppercase' }}>
                            STEP {m.step}
                          </span>
                          {isHighlight && (
                            <span style={{ fontSize: '0.55rem', letterSpacing: '0.06em', fontWeight: '850', textTransform: 'uppercase', color: '#FFFDF9', backgroundColor: '#244f21', padding: '0.15rem 0.5rem', borderRadius: '999px', border: '1px solid #b9cd94' }}>
                              ACTIVE MILESTONE
                            </span>
                          )}
                        </div>

                        <h3 style={{ fontSize: '1.15rem', fontFamily: 'var(--font-serif)', color: '#FFFDF9', fontWeight: '850', margin: '0 0 0.35rem', lineHeight: '1.2' }}>
                          {m.title}
                        </h3>

                        <p style={{ fontSize: '0.78rem', color: '#F5EBDD', lineHeight: '1.45', margin: 0, fontWeight: '500' }}>
                          {m.desc}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Leaf Icon at End of Vertical Path */}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.75rem', position: 'relative', zIndex: 5 }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#1c3d19', border: '1.5px solid #b9cd94', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.4)' }}>
                <Leaf size={16} color="var(--accent-gold)" />
              </div>
            </div>

          </div>
        ) : (
          /* DESKTOP / TABLET ALTERNATING INFOGRAPHIC LAYOUT */
          <div style={{ position: 'relative', width: '100%', margin: '0 auto' }}>
            
            {/* Central Vertical Dashed Line Path */}
            <div 
              style={{ 
                position: 'absolute', 
                top: '20px', 
                bottom: '20px', 
                left: '50%', 
                transform: 'translateX(-50%)', 
                width: '2px', 
                borderLeft: '2px dashed rgba(185, 205, 148, 0.65)', 
                boxShadow: '0 0 12px rgba(185, 205, 148, 0.3)',
                zIndex: 1 
              }} 
            />

            {/* Render 5 Milestone Nodes in Alternating Flow */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3.5rem', position: 'relative', zIndex: 2 }}>
              {milestones.map((m, idx) => {
                const isEven = idx % 2 === 0;
                const isHighlight = idx === activeIdx;
                const IconComp = m.icon;

                return (
                  <div 
                    key={m.step}
                    onClick={() => {
                      setIsPaused(true);
                      setActiveIdx(idx);
                    }}
                    style={{
                      display: 'flex',
                      flexDirection: isEven ? 'row-reverse' : 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '100%',
                      position: 'relative',
                      cursor: 'pointer'
                    }}
                  >
                    {/* Card Side */}
                    <div 
                      style={{ 
                        width: '44%', 
                        textAlign: isEven ? 'right' : 'left'
                      }}
                    >
                      <div
                        style={{
                          padding: '1.75rem 1.6rem',
                          borderRadius: '22px',
                          backgroundColor: isHighlight ? 'rgba(35, 21, 13, 0.92)' : 'rgba(35, 21, 13, 0.55)',
                          backdropFilter: 'blur(20px)',
                          WebkitBackdropFilter: 'blur(20px)',
                          border: isHighlight ? '2px solid #b9cd94' : '1px solid rgba(255, 255, 255, 0.18)',
                          boxShadow: isHighlight 
                            ? '0 16px 40px rgba(0, 0, 0, 0.55), 0 0 25px rgba(185, 205, 148, 0.3)' 
                            : '0 10px 30px rgba(0, 0, 0, 0.3)',
                          transform: isHighlight ? 'scale(1.02)' : 'scale(1)',
                          transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                          boxSizing: 'border-box',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '1.25rem',
                          flexDirection: isEven ? 'row-reverse' : 'row'
                        }}
                      >
                        {/* Circular Icon Badge inside card */}
                        <div 
                          style={{ 
                            width: '64px', 
                            height: '64px', 
                            borderRadius: '50%', 
                            backgroundColor: 'rgba(40, 58, 28, 0.85)', 
                            border: '1.5px solid rgba(185, 205, 148, 0.4)', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            flexShrink: 0 
                          }}
                        >
                          <IconComp size={30} color="#b9cd94" strokeWidth={1.5} />
                        </div>

                        <div style={{ flexGrow: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: isEven ? 'flex-end' : 'flex-start', gap: '0.5rem', marginBottom: '0.4rem' }}>
                            <span style={{ fontSize: '0.68rem', letterSpacing: '0.12em', fontWeight: '900', color: isHighlight ? '#b9cd94' : 'var(--accent-gold)', textTransform: 'uppercase' }}>
                              STEP {m.step}
                            </span>
                            {isHighlight && (
                              <span style={{ fontSize: '0.62rem', letterSpacing: '0.08em', fontWeight: '850', textTransform: 'uppercase', color: '#FFFDF9', backgroundColor: '#244f21', padding: '0.15rem 0.6rem', borderRadius: '999px', border: '1px solid #b9cd94' }}>
                                ACTIVE MILESTONE
                              </span>
                            )}
                          </div>

                          <h3 style={{ fontSize: '1.4rem', color: '#FFFDF9', fontFamily: 'var(--font-serif)', fontWeight: '850', margin: '0 0 0.45rem', lineHeight: '1.2' }}>
                            {m.title}
                          </h3>

                          <p style={{ fontSize: '0.94rem', color: '#F5EBDD', lineHeight: '1.6', margin: 0, fontWeight: '500' }}>
                            {m.desc}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Central Node Badge */}
                    <div 
                      style={{ 
                        width: '12%', 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center',
                        flexShrink: 0,
                        zIndex: 5 
                      }}
                    >
                      <div
                        style={{
                          width: isHighlight ? '54px' : '44px',
                          height: isHighlight ? '54px' : '44px',
                          borderRadius: '50%',
                          backgroundColor: isHighlight ? '#244f21' : 'rgba(20, 10, 5, 0.95)',
                          border: isHighlight ? '2.5px solid #b9cd94' : '1.5px solid var(--accent-gold)',
                          boxShadow: isHighlight ? '0 0 22px #b9cd94, 0 4px 14px rgba(0,0,0,0.6)' : '0 4px 12px rgba(0,0,0,0.4)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transform: isHighlight ? 'scale(1.12)' : 'scale(1)',
                          transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
                        }}
                      >
                        <span style={{ fontSize: isHighlight ? '1.05rem' : '0.88rem', fontWeight: '900', color: isHighlight ? '#FFFDF9' : 'var(--accent-gold)', fontFamily: 'var(--font-serif)', lineHeight: 1 }}>
                          {m.step}
                        </span>
                      </div>
                    </div>

                    {/* Empty Spacer Side */}
                    <div style={{ width: '44%' }} />
                  </div>
                );
              })}
            </div>

            {/* Bottom Leaf Icon at End of Vertical Path */}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2.5rem', position: 'relative', zIndex: 5 }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: '#1c3d19', border: '1.5px solid #b9cd94', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
                <Leaf size={20} color="var(--accent-gold)" />
              </div>
            </div>

          </div>
        )}

      </div>
    </section>
  );
}

export default function OurStory() {
  const journeyRef = useRef(null);

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
        overflowX: 'hidden',
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
              to="/shop" 
              className="btn-primary" 
              style={{ padding: '0.9rem 2.25rem', fontSize: '0.92rem', backgroundColor: '#244f21', color: '#FFFFFF', border: 'none', borderRadius: '999px', fontWeight: '850', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <span>Discover Our Bakes</span>
              <ChevronRight size={16} />
            </Link>
          </div>
        </div>

        {/* Hero image block with label */}
        {/* <div style={{ position: 'relative' }}>
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
        </div> */}
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

      {/* 3. REDESIGNED ORBIT MILESTONES TIMELINE SECTION */}
      <OrbitJourneySection />



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
