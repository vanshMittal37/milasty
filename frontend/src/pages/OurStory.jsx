import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Sparkles, ShieldCheck, Award, Leaf, Flame, Compass, ChevronRight, Info, CheckCircle2, ArrowRight } from 'lucide-react';

// ========================================================
// SECTION — ORBIT JOURNEY (Milestones) COMPONENT
// ========================================================
function OrbitJourneySection() {
  const milestones = [
    { 
      step: '01', 
      title: 'MY HEALTH JOURNEY', 
      desc: 'Corporate life, rushed meals and COVID led me to rethink my relationship with food.',
      icon: Compass
    },
    { 
      step: '02', 
      title: 'DISCOVERING MILLETS', 
      desc: 'I went back to traditional millets, looking for food that felt nourishing and satisfying.',
      icon: Leaf
    },
    { 
      step: '03', 
      title: 'BAKING AT HOME', 
      desc: 'Experiments began in my kitchen with millets, desi ghee and jaggery.',
      icon: Flame
    },
    { 
      step: '04', 
      title: 'PEOPLE WANTED MORE', 
      desc: 'My friends and family tasted the cookies and started asking for more.',
      icon: Heart
    },
    { 
      step: '05', 
      title: 'MILASTY WAS BORN', 
      desc: 'A personal journey became a mission to make mindful snacking delicious and accessible.',
      icon: Sparkles
    },
  ];

  const [activeIdx, setActiveIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 767);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Cyclic Rotation from Step 1 to 5
  useEffect(() => {
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
          <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.14em', color: '#2F6B3A', fontWeight: '850', display: 'block', marginBottom: '0.5rem' }}>
            MILESTONES
          </span>
          <h2 style={{ fontSize: isMobile ? '2.1rem' : '2.8rem', fontFamily: 'var(--font-serif)', color: '#32180D', fontWeight: '850', margin: 0 }}>
            The MILASTY <span style={{ color: '#2F6B3A', fontSize: '1.18em', fontWeight: '900' }}>Journey</span>
          </h2>
          <p style={{ fontSize: isMobile ? '0.92rem' : '1.05rem', color: '#654B38', fontWeight: '500', marginTop: '0.6rem', lineHeight: '1.6' }}>
            From one woman's search for better food to a brand built around better everyday snacking.
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
                backgroundColor: '#DCC8AE', 
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
                        backgroundColor: '#2F6B3A',
                        border: '2px solid #DCC8AE',
                        boxShadow: '0 4px 10px rgba(75, 45, 25, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <span style={{ fontSize: '0.85rem', fontWeight: '900', color: '#FFFFFF', fontFamily: 'var(--font-serif)', lineHeight: 1 }}>
                        {m.step}
                      </span>
                    </div>

                    {/* Main Card Container */}
                    <div
                      style={{
                        backgroundColor: '#FFF9F0',
                        borderRadius: '24px',
                        border: isHighlight ? '2px solid #2F6B3A' : '1px solid #DCC8AE',
                        boxShadow: isHighlight ? '0 10px 30px rgba(47, 107, 58, 0.15)' : '0 4px 16px rgba(75, 45, 25, 0.05)',
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
                          width: '64px', 
                          height: '64px', 
                          borderRadius: '50%', 
                          backgroundColor: '#E3EEDC', 
                          border: '1.5px solid #DCC8AE', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          flexShrink: 0 
                        }}
                      >
                        <IconComp size={28} color="#2F6B3A" strokeWidth={1.5} />
                      </div>

                      {/* Right Text Content Details */}
                      <div style={{ flexGrow: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                          <span style={{ fontSize: '0.62rem', letterSpacing: '0.12em', fontWeight: '900', color: '#2F6B3A', textTransform: 'uppercase' }}>
                            STEP {m.step}
                          </span>
                          {isHighlight && (
                            <span style={{ fontSize: '0.55rem', letterSpacing: '0.06em', fontWeight: '850', textTransform: 'uppercase', color: '#FFFFFF', backgroundColor: '#2F6B3A', padding: '0.15rem 0.5rem', borderRadius: '999px' }}>
                              ACTIVE MILESTONE
                            </span>
                          )}
                        </div>

                        <h3 style={{ fontSize: '1.15rem', fontFamily: 'var(--font-serif)', color: '#32180D', fontWeight: '850', margin: '0 0 0.35rem', lineHeight: '1.2' }}>
                          {m.title}
                        </h3>

                        <p style={{ fontSize: '0.78rem', color: '#654B38', lineHeight: '1.45', margin: 0, fontWeight: '500' }}>
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
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#2F6B3A', border: '1.5px solid #DCC8AE', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(75, 45, 25, 0.15)' }}>
                <Leaf size={16} color="#FFFFFF" />
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
                borderLeft: '2px dashed #DCC8AE', 
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
                          backgroundColor: '#FFF9F0',
                          border: isHighlight ? '2px solid #2F6B3A' : '1px solid #DCC8AE',
                          boxShadow: isHighlight 
                            ? '0 12px 32px rgba(47, 107, 58, 0.15)' 
                            : '0 4px 16px rgba(75, 45, 25, 0.05)',
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
                            width: '56px', 
                            height: '56px', 
                            borderRadius: '50%', 
                            backgroundColor: '#E3EEDC', 
                            border: '1.5px solid #DCC8AE', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            flexShrink: 0 
                          }}
                        >
                          <IconComp size={26} color="#2F6B3A" strokeWidth={1.5} />
                        </div>

                        <div style={{ flexGrow: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: isEven ? 'flex-end' : 'flex-start', gap: '0.5rem', marginBottom: '0.4rem' }}>
                            <span style={{ fontSize: '0.68rem', letterSpacing: '0.12em', fontWeight: '900', color: '#2F6B3A', textTransform: 'uppercase' }}>
                              STEP {m.step}
                            </span>
                            {isHighlight && (
                              <span style={{ fontSize: '0.62rem', letterSpacing: '0.08em', fontWeight: '850', textTransform: 'uppercase', color: '#FFFFFF', backgroundColor: '#2F6B3A', padding: '0.15rem 0.6rem', borderRadius: '999px' }}>
                                ACTIVE MILESTONE
                              </span>
                            )}
                          </div>

                          <h3 style={{ fontSize: '1.4rem', color: '#32180D', fontFamily: 'var(--font-serif)', fontWeight: '850', margin: '0 0 0.45rem', lineHeight: '1.2' }}>
                            {m.title}
                          </h3>

                          <p style={{ fontSize: '0.94rem', color: '#654B38', lineHeight: '1.6', margin: 0, fontWeight: '500' }}>
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
                          width: isHighlight ? '50px' : '40px',
                          height: isHighlight ? '50px' : '40px',
                          borderRadius: '50%',
                          backgroundColor: '#2F6B3A',
                          border: '2px solid #DCC8AE',
                          boxShadow: '0 4px 12px rgba(75, 45, 25, 0.15)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transform: isHighlight ? 'scale(1.12)' : 'scale(1)',
                          transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
                        }}
                      >
                        <span style={{ fontSize: isHighlight ? '1rem' : '0.85rem', fontWeight: '900', color: '#FFFFFF', fontFamily: 'var(--font-serif)', lineHeight: 1 }}>
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
              <div style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: '#2F6B3A', border: '1.5px solid #DCC8AE', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(75, 45, 25, 0.15)' }}>
                <Leaf size={20} color="#FFFFFF" />
              </div>
            </div>

          </div>
        )}

      </div>
    </section>
  );
}

export default function OurStory() {
  useEffect(() => {
    document.title = "About MILASTY | The Story Behind Our Millet Bakes";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', 'Discover the MILASTY story — from a home kitchen to millet-based bakes made with honest ingredients, care and no compromise on taste.');
    }
  }, []);

  return (
    <div
      className="our-story-page"
      style={{
        minHeight: '100vh',
        padding: '0 0 5rem',
        position: 'relative',
        backgroundColor: '#F7F0E5',
        backgroundImage: 'linear-gradient(rgba(247, 240, 229, 0.88), rgba(247, 240, 229, 0.88)), url(/images/about_background_image.jpeg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        color: '#2B170D',
        overflowX: 'hidden',
      }}
    >
      <div style={{ position: 'relative', zIndex: 1 }}>
      
      {/* 1. SECTION 1 — HERO */}
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
              color: '#2F6B3A', 
              fontWeight: '850',
              backgroundColor: '#E3EEDC',
              padding: '0.4rem 0.95rem',
              borderRadius: '999px',
              border: '1px solid #DCC8AE'
            }}
          >
            THE MILASTY STORY
          </span>
          <h1 
            style={{ 
              fontSize: 'clamp(2.5rem, 5.5vw, 3.8rem)', 
              fontFamily: 'var(--font-serif)', 
              color: '#32180D', 
              fontWeight: '850', 
              lineHeight: '1.15',
              letterSpacing: '-0.02em',
              margin: 0
            }}
          >
            Born in a Home Kitchen.<br />
            Made for Better Snacking.
          </h1>
          <p 
            style={{ 
              fontSize: '1.15rem', 
              color: '#654B38', 
              lineHeight: '1.75', 
              maxWidth: '560px',
              margin: '0.5rem 0 1.5rem',
              fontWeight: '550'
            }}
          >
            What started as a search for better food became a mission to make better snacking a part of everyday life — millet-based bakes made with honest ingredients, care, and no compromise on taste.
          </p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Link 
              to="/shop" 
              className="btn-primary" 
              style={{ 
                padding: '0.95rem 2.4rem', 
                fontSize: '0.95rem', 
                backgroundColor: '#2F6B3A', 
                color: '#FFFFFF', 
                border: 'none', 
                borderRadius: '999px', 
                fontWeight: '850', 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                boxShadow: '0 4px 16px rgba(47, 107, 58, 0.25)',
                transition: 'all 0.3s ease',
                textDecoration: 'none'
              }}
            >
              <span>Discover Our Bakes</span>
              <ChevronRight size={18} />
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
              boxShadow: '0 12px 32px rgba(75, 45, 25, 0.12)',
              border: '1px solid #DCC8AE'
            }}
          >
            <img
              src="/images/image2.jpeg"
              alt="MILASTY millet baking ingredients and process"
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
              backgroundColor: '#FFF9F0',
              padding: '0.6rem 1.2rem',
              borderRadius: '999px',
              border: '1px solid #DCC8AE',
              fontSize: '0.78rem',
              fontWeight: '850',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: '#32180D',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              pointerEvents: 'none',
              boxShadow: '0 6px 16px rgba(75, 45, 25, 0.1)'
            }}
          >
            <Sparkles size={14} color="#2F6B3A" />
            <span>Handcrafted with intention</span>
          </div>
        </div>
      </section>

      {/* 2. SECTION 2 — STORY */}
      <section style={{ backgroundColor: '#FCF8F1', padding: '6rem 0', borderTop: '1px solid #DCC8AE', borderBottom: '1px solid #DCC8AE' }}>
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
          {/* Left Founder / Kitchen Image */}
          <div style={{ position: 'relative' }}>
            <div 
              style={{ 
                borderRadius: '24px', 
                overflow: 'hidden', 
                border: '1px solid #DCC8AE',
                boxShadow: '0 12px 32px rgba(75, 45, 25, 0.1)'
              }}
            >
              <img 
                src="/images/image3.jpeg" 
                alt="Baking with authentic ingredients in home kitchen" 
                style={{ width: '100%', height: '500px', objectFit: 'cover', display: 'block' }} 
              />
            </div>
            {/* Overlay Quote label */}
            <div 
              style={{ 
                position: 'absolute', 
                top: '24px', 
                left: '24px', 
                backgroundColor: '#2F6B3A', 
                color: '#FFFFFF', 
                padding: '0.65rem 1.25rem', 
                borderRadius: '12px',
                fontSize: '0.78rem',
                fontWeight: '850',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                boxShadow: '0 4px 12px rgba(47, 107, 58, 0.2)'
              }}
            >
              Where It All Began
            </div>
          </div>

          {/* Right Text Block */}
          <div>
            <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.14em', color: '#2F6B3A', fontWeight: '850', display: 'block', marginBottom: '0.6rem' }}>
              OUR FOUNDING STORY
            </span>
            <h2 
              style={{ 
                fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', 
                fontFamily: 'var(--font-serif)', 
                color: '#32180D', 
                marginBottom: '1.75rem', 
                lineHeight: '1.25',
                fontWeight: '850'
              }}
            >
              We Wanted Better.<br />Finding It Wasn't Easy.
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', color: '#654B38', lineHeight: '1.85', fontSize: '1.05rem', fontWeight: '500' }}>
              <p>
                While navigating my own health journey, I realised how difficult it was to find snacks that genuinely fit the way I wanted to eat. So many products claimed to be “healthy”, but a closer look at the ingredient list often told a different story.
              </p>
              <p>
                Instead of settling, I went back to my kitchen. I started experimenting with simple recipes made with ingredients I could understand and trust. There was no business plan behind it — just a personal need to create food that felt right for my everyday life.
              </p>
              <p>
                Then I started sharing those homemade bakes with family, friends and others around me. The response was clear: people weren't just looking for healthier options; they were looking for more honest ones.
              </p>
              <p style={{ fontWeight: '700', color: '#32180D', fontSize: '1.1rem' }}>
                And that's where MILASTY began.
              </p>
              <p>
                Built around millets, thoughtful ingredients and great taste, MILASTY is our way of making everyday snacking a little more conscious — without making it boring.
              </p>
            </div>

            <blockquote 
              style={{ 
                paddingLeft: '1.35rem', 
                margin: '2rem 0',
                fontFamily: 'var(--font-serif)',
                color: '#32180D',
                fontWeight: '800',
                fontSize: '1.15rem',
                lineHeight: '1.6',
                fontStyle: 'italic',
                backgroundColor: '#FFF9F0',
                padding: '1rem 1.35rem',
                borderRadius: '0 12px 12px 0',
                border: '1px solid #DCC8AE',
                borderLeft: '4px solid #2F6B3A'
              }}
            >
              "Because sometimes, the most meaningful brands don't begin with a business plan. They begin with a problem worth solving."
            </blockquote>
          </div>
        </div>
      </section>

      {/* STORY HIGHLIGHT STRIP */}
      <section style={{ backgroundColor: '#F1E5D4', borderBottom: '1px solid #DCC8AE', padding: '2.5rem 0' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 1.5rem' }}>
          <div 
            style={{ 
              display: 'flex', 
              justify: 'space-around', 
              alignItems: 'center', 
              flexWrap: 'wrap', 
              gap: '2rem' 
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: '#E3EEDC', border: '1px solid #DCC8AE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldCheck size={22} color="#2F6B3A" />
              </div>
              <span style={{ color: '#32180D', fontFamily: 'var(--font-serif)', fontSize: '1.05rem', fontWeight: '850', letterSpacing: '0.04em' }}>
                SMALL-BATCH CRAFTED
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: '#E3EEDC', border: '1px solid #DCC8AE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Leaf size={22} color="#2F6B3A" />
              </div>
              <span style={{ color: '#32180D', fontFamily: 'var(--font-serif)', fontSize: '1.05rem', fontWeight: '850', letterSpacing: '0.04em' }}>
                HONEST INGREDIENTS
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: '#E3EEDC', border: '1px solid #DCC8AE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Award size={22} color="#2F6B3A" />
              </div>
              <span style={{ color: '#32180D', fontFamily: 'var(--font-serif)', fontSize: '1.05rem', fontWeight: '850', letterSpacing: '0.04em' }}>
                TASTE WITHOUT COMPROMISE
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SECTION — MILASTY JOURNEY / MILESTONES */}
      <OrbitJourneySection />

      {/* 4. PRESERVED EXISTING SECTION — TRANSPARENCY & NUTRITION */}
      <section style={{ backgroundColor: 'transparent', padding: '5rem 0', borderBottom: '1px solid #DCC8AE' }}>
        <div style={{ maxWidth: '780px', margin: '0 auto', paddingLeft: '1.5rem', paddingRight: '1.5rem' }}>
          <div style={{ backgroundColor: '#FFF9F0', border: '1px solid #DCC8AE', padding: '3.5rem 2.5rem', borderRadius: '24px', textAlign: 'center', boxShadow: '0 8px 30px rgba(75, 45, 25, 0.06)' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '50%', backgroundColor: '#E3EEDC', color: '#2F6B3A', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', border: '1px solid #DCC8AE' }}>
              <Info size={24} />
            </div>
            <h2 style={{ fontSize: '2.2rem', fontFamily: 'var(--font-serif)', color: '#32180D', fontWeight: '850', marginBottom: '1rem' }}>
              Know What Goes Into Your Food.
            </h2>
            <p style={{ fontSize: '1.05rem', color: '#654B38', lineHeight: '1.7', marginBottom: '2.5rem', fontWeight: '550' }}>
              We maintain 100% transparency in recipe designs, nutritional parameters, and batch-test laboratory reports.
            </p>
            <Link
              to="/nutrition"
              className="btn-primary"
              style={{ padding: '0.95rem 2.25rem', fontSize: '0.92rem', backgroundColor: '#2F6B3A', color: '#FFFFFF', border: 'none', borderRadius: '999px', textDecoration: 'none', fontWeight: '850', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <span>Explore Nutrition & Lab Reports</span>
              <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* 5. SECTION — MILASTY PROMISE */}
      <section style={{ backgroundColor: 'transparent', padding: '6.5rem 0 4rem', borderBottom: '1px solid #DCC8AE' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', paddingLeft: '1.5rem', paddingRight: '1.5rem', textAlign: 'center' }}>
          <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.14em', color: '#2F6B3A', fontWeight: '850', display: 'block', marginBottom: '0.6rem' }}>
            THE MILASTY PROMISE
          </span>
          <h2 style={{ fontSize: 'clamp(2.2rem, 4.5vw, 3.2rem)', fontFamily: 'var(--font-serif)', color: '#32180D', fontWeight: '850', margin: '0 0 1.25rem', lineHeight: '1.2' }}>
            Good Food Should Feel Good to Choose.
          </h2>
          <p style={{ fontSize: '1.15rem', color: '#654B38', lineHeight: '1.8', maxWidth: '720px', margin: '0 auto 3rem', fontWeight: '550' }}>
            From the ingredients we choose to the way we bake, we believe in making everyday snacking more thoughtful, transparent and genuinely delicious.
          </p>

          {/* PROMISE CTAS */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
            {/* Primary CTA */}
            <Link
              to="/shop"
              style={{
                padding: '1rem 2.4rem',
                fontSize: '0.95rem',
                backgroundColor: '#2F6B3A',
                color: '#FFFFFF',
                borderRadius: '999px',
                textDecoration: 'none',
                fontWeight: '850',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 16px rgba(47, 107, 58, 0.25)',
                transition: 'all 0.3s ease'
              }}
            >
              <span>Explore Our Bakes</span>
              <ChevronRight size={18} />
            </Link>

            {/* Secondary CTA */}
            <Link
              to="/nutrition"
              style={{
                padding: '1rem 2.4rem',
                fontSize: '0.95rem',
                backgroundColor: '#FFF9F0',
                color: '#32180D',
                borderRadius: '999px',
                textDecoration: 'none',
                fontWeight: '850',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                border: '1.5px solid #32180D',
                boxShadow: '0 4px 16px rgba(75, 45, 25, 0.05)',
                transition: 'all 0.3s ease'
              }}
            >
              <span>Explore Ingredients & Nutrition</span>
              <ChevronRight size={18} color="#2F6B3A" />
            </Link>
          </div>
        </div>
      </section>

      {/* 6. FINAL CLOSING LINE */}
      <section style={{ padding: '5rem 1.5rem 3rem', textAlign: 'center' }}>
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
          <p 
            style={{ 
              fontSize: 'clamp(1.6rem, 3.5vw, 2.2rem)', 
              fontFamily: 'var(--font-serif)', 
              color: '#32180D', 
              fontWeight: '850', 
              lineHeight: '1.6',
              margin: 0
            }}
          >
            Made with millets.<br />
            Baked with care.<br />
            <span style={{ color: '#2F6B3A', fontStyle: 'italic' }}>Created for everyday cravings.</span>
          </p>
        </div>
      </section>

      {/* CSS style overrides for horizontal scroll containers and card styles */}
      <style>{`
        .horizontal-scroll-container::-webkit-scrollbar {
          display: none !important;
        }
        .horizontal-scroll-container {
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
        }
        .our-story-page .glass-card {
          background: #FFF9F0 !important;
          background-color: #FFF9F0 !important;
          border: 1px solid #DCC8AE !important;
          box-shadow: 0 4px 16px rgba(75, 45, 25, 0.05) !important;
          transition: all 0.3s ease !important;
        }
        .our-story-page .glass-card:hover {
          background: #FFF9F0 !important;
          border: 1px solid #2F6B3A !important;
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
