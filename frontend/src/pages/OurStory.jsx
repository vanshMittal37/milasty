import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Sparkles, ShieldCheck, Award, Leaf, Flame, Compass, ChevronRight, MessageSquare, Info, ChevronLeft } from 'lucide-react';
import Logo from '../components/Logo';

// ========================================================
// SECTION 1 — ORBIT JOURNEY (Milestones) COMPONENT
// ========================================================
function OrbitJourneySection() {
  const milestones = [
    { step: '01', title: 'The Question', desc: 'Can everyday bakery snacks be healthy, clean, and genuinely delicious?' },
    { step: '02', title: 'The Search', desc: 'Sourcing honest local ingredients, unrefined sweeteners, and traditional grains.' },
    { step: '03', title: 'The First Bake', desc: 'Experimenting in small home batches with millet, pure Desi Ghee, and organic jaggery.', isActive: true },
    { step: '04', title: 'MILASTY is Born', desc: 'A better, mindful way of snacking, establishing our small-batch bakery.' },
    { step: '05', title: 'Today', desc: 'Bringing handcrafted millet bakes to wellness-focused Indian homes.' },
  ];

  const [isMobile, setIsMobile] = React.useState(false);
  const [isTablet, setIsTablet] = React.useState(false);

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 767);
      setIsTablet(window.innerWidth > 767 && window.innerWidth <= 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <section 
      style={{ 
        padding: isMobile ? '3.5rem 0' : '6.5rem 0', 
        backgroundColor: 'transparent',
        overflow: 'hidden',
        position: 'relative' 
      }}
    >
      <div style={{ maxWidth: '1100px', margin: '0 auto', paddingLeft: isMobile ? '1rem' : '1.5rem', paddingRight: isMobile ? '1rem' : '1.5rem', boxSizing: 'border-box' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 3.5rem' }}>
          <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--accent-gold)', fontWeight: '850', display: 'block', marginBottom: '0.5rem' }}>
            MILESTONES
          </span>
          <h2 style={{ fontSize: isMobile ? '2.1rem' : '2.8rem', fontFamily: 'var(--font-serif)', color: '#FFFDF9', fontWeight: '850', margin: 0, textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
            The MILASTY <span style={{ color: '#b9cd94' }}>Journey</span>
          </h2>
          <p style={{ fontSize: isMobile ? '0.92rem' : '1.05rem', color: '#F5EBDD', fontWeight: '500', marginTop: '0.6rem', lineHeight: '1.6' }}>
            From an inspiring question to handcrafted bakes delivered nationwide.
          </p>
        </div>

        {/* ALTERNATING CENTRAL PATH INFOGRAPHIC FIGURE (Inspired by Reference 1) */}
        <div style={{ position: 'relative', width: '100%', margin: '0 auto' }}>
          
          {/* Central Vertical Dashed Line Path */}
          <div 
            style={{ 
              position: 'absolute', 
              top: '20px', 
              bottom: '20px', 
              left: isMobile ? '28px' : '50%', 
              transform: isMobile ? 'none' : 'translateX(-50%)', 
              width: '2px', 
              borderLeft: '2px dashed rgba(185, 205, 148, 0.65)', 
              boxShadow: '0 0 12px rgba(185, 205, 148, 0.3)',
              zIndex: 1 
            }} 
          />

          {/* Render 5 Milestone Nodes in Alternating Flow */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '2.25rem' : '3.5rem', position: 'relative', zIndex: 2 }}>
            {milestones.map((m, idx) => {
              const isEven = idx % 2 === 0; // Left side on desktop for even index, right side for odd
              const isHighlight = m.isActive;

              return (
                <div 
                  key={m.step}
                  style={{
                    display: 'flex',
                    flexDirection: isMobile ? 'row' : isEven ? 'row-reverse' : 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    position: 'relative'
                  }}
                >
                  {/* Card Side (Left or Right on Desktop, Right on Mobile) */}
                  <div 
                    style={{ 
                      width: isMobile ? 'calc(100% - 60px)' : '44%', 
                      marginLeft: isMobile ? '12px' : 0,
                      textAlign: isMobile ? 'left' : isEven ? 'right' : 'left'
                    }}
                  >
                    <div
                      style={{
                        padding: isMobile ? '1.25rem 1.1rem' : '1.75rem 1.6rem',
                        borderRadius: '22px',
                        backgroundColor: isHighlight ? 'rgba(35, 21, 13, 0.88)' : 'rgba(35, 21, 13, 0.65)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        border: isHighlight ? '2px solid #b9cd94' : '1px solid rgba(255, 255, 255, 0.2)',
                        boxShadow: isHighlight 
                          ? '0 16px 40px rgba(0, 0, 0, 0.5), 0 0 25px rgba(185, 205, 148, 0.25)' 
                          : '0 10px 30px rgba(0, 0, 0, 0.35)',
                        transition: 'all 0.3s ease',
                        boxSizing: 'border-box'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: isMobile ? 'space-between' : isEven ? 'flex-end' : 'flex-start', gap: '0.5rem', marginBottom: '0.4rem' }}>
                        <span style={{ fontSize: '0.68rem', letterSpacing: '0.12em', fontWeight: '900', color: isHighlight ? '#b9cd94' : 'var(--accent-gold)', textTransform: 'uppercase' }}>
                          STEP {m.step}
                        </span>
                        {isHighlight && (
                          <span style={{ fontSize: '0.62rem', letterSpacing: '0.08em', fontWeight: '850', textTransform: 'uppercase', color: '#FFFDF9', backgroundColor: '#244f21', padding: '0.15rem 0.6rem', borderRadius: '999px', border: '1px solid #b9cd94' }}>
                            ACTIVE MILESTONE
                          </span>
                        )}
                      </div>

                      <h3 style={{ fontSize: isMobile ? '1.15rem' : '1.4rem', color: '#FFFDF9', fontFamily: 'var(--font-serif)', fontWeight: '850', margin: '0 0 0.45rem', lineHeight: '1.2' }}>
                        {m.title}
                      </h3>

                      <p style={{ fontSize: isMobile ? '0.84rem' : '0.94rem', color: '#F5EBDD', lineHeight: '1.6', margin: 0, fontWeight: '500' }}>
                        {m.desc}
                      </p>
                    </div>
                  </div>

                  {/* Central Node Badge (Origami/Ribbon Node Inspired by Reference 1) */}
                  <div 
                    style={{ 
                      width: isMobile ? '56px' : '12%', 
                      display: 'flex', 
                      justifyContent: 'center', 
                      alignItems: 'center',
                      flexShrink: 0,
                      zIndex: 5 
                    }}
                  >
                    <div
                      style={{
                        width: isHighlight ? '52px' : '44px',
                        height: isHighlight ? '52px' : '44px',
                        borderRadius: '50%',
                        backgroundColor: isHighlight ? '#244f21' : 'rgba(20, 10, 5, 0.95)',
                        border: isHighlight ? '2.5px solid #b9cd94' : '1.5px solid var(--accent-gold)',
                        boxShadow: isHighlight ? '0 0 20px #b9cd94, 0 4px 14px rgba(0,0,0,0.6)' : '0 4px 12px rgba(0,0,0,0.4)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <span style={{ fontSize: isHighlight ? '1rem' : '0.88rem', fontWeight: '900', color: isHighlight ? '#FFFDF9' : 'var(--accent-gold)', fontFamily: 'var(--font-serif)', lineHeight: 1 }}>
                        {m.step}
                      </span>
                    </div>
                  </div>

                  {/* Empty Spacer Side for Desktop Alternating Balance */}
                  {!isMobile && (
                    <div style={{ width: '44%' }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
}

// ========================================================
// SECTION 2 — ORBIT PRINCIPLES (Non-Negotiables) COMPONENT
// ========================================================
function OrbitPrinciplesSection() {
  const principles = [
    { 
      step: '01', 
      title: 'Zero Palm Oil', 
      desc: 'We exclusively bake with 100% pure Cow Desi Ghee. No cheap vegetable fats, trans fats, or hydrogenated oils ever enter our bakery.',
      icon: Flame,
      image: '/images/ghee.jpeg',
      badge: 'NON-NEGOTIABLE'
    },
    { 
      step: '02', 
      title: 'Unrefined Jaggery', 
      desc: 'Naturally sweetened using organic jaggery rich in iron and essential minerals. Zero refined white sugar or artificial sweeteners.',
      icon: Sparkles,
      image: '/images/image2.jpeg',
      badge: 'NON-NEGOTIABLE'
    },
    { 
      step: '03', 
      title: 'Zero Preservatives', 
      desc: 'No artificial food coloring, chemical preservatives, or synthetic shelf-life extenders. Just honest, wholesome, fresh baking.',
      icon: ShieldCheck,
      image: '/images/image3.jpeg',
      badge: 'NON-NEGOTIABLE'
    },
    { 
      step: '04', 
      title: 'Wholesome Grains', 
      desc: 'Native Bajra, Jowar, and Ragi flour instead of refined maida. Nutrient-dense nutrition in every single bite.',
      icon: Leaf,
      image: '/images/bajra.jpeg',
      badge: 'NON-NEGOTIABLE'
    },
  ];

  const [isMobile, setIsMobile] = React.useState(false);
  const [isTablet, setIsTablet] = React.useState(false);

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 767);
      setIsTablet(window.innerWidth > 767 && window.innerWidth <= 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <section 
      style={{ 
        padding: isMobile ? '3.5rem 0 3rem' : '6rem 0 5rem', 
        backgroundColor: 'transparent',
        borderTop: '1px solid rgba(245, 220, 180, 0.15)',
        borderBottom: '1px solid rgba(245, 220, 180, 0.15)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div style={{ maxWidth: '1280px', margin: '0 auto', paddingLeft: isMobile ? '1rem' : '1.5rem', paddingRight: isMobile ? '1rem' : '1.5rem', boxSizing: 'border-box' }}>
        
        {/* RESPONSIVE FIGURE/DIAGRAM COMPOSITION (Desktop, Tablet & Mobile) */}
        {!isMobile && !isTablet ? (
          /* DESKTOP VIEW */
          <div style={{ position: 'relative', minHeight: '680px', width: '100%', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            
            {/* Center Heading Block */}
            <div style={{ zIndex: 10, textAlign: 'center', maxWidth: '380px', padding: '1.5rem', boxSizing: 'border-box' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(36, 79, 33, 0.45)', border: '1.5px solid rgba(185, 205, 148, 0.4)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.85rem' }}>
                <Leaf size={22} color="var(--accent-gold)" />
              </div>
              
              <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.16em', color: 'var(--accent-gold)', fontWeight: '850', display: 'block', marginBottom: '0.35rem' }}>
                OUR PRINCIPLES
              </span>

              <h2 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-serif)', color: '#FFFDF9', fontWeight: '850', margin: '0 0 0.65rem', lineHeight: '1.15', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
                Our Non-Negotiables
              </h2>

              <div style={{ width: '40px', height: '2px', backgroundColor: 'var(--accent-gold)', margin: '0 auto 0.75rem', opacity: 0.7 }} />

              <p style={{ fontSize: '0.98rem', color: '#F5EBDD', fontWeight: '500', margin: 0, lineHeight: '1.5', fontStyle: 'italic' }}>
                The four pillars we <span style={{ color: 'var(--accent-gold)', fontWeight: '700' }}>never</span> compromise on.
              </p>
            </div>

            {/* Connecting Circular Dotted Ring (Darkened & Enhanced for Desktop) */}
            <div 
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '620px',
                height: '420px',
                borderRadius: '50%',
                border: '2px dashed rgba(185, 205, 148, 0.85)',
                boxShadow: '0 0 20px rgba(185, 205, 148, 0.25)',
                pointerEvents: 'none',
                zIndex: 1,
              }}
            />

            {/* Small Decorative Dots on Ring */}
            <div style={{ position: 'absolute', top: 'calc(50% - 210px)', left: '50%', transform: 'translate(-50%, -50%)', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#b9cd94', border: '2.5px solid rgba(18, 9, 4, 0.95)', boxShadow: '0 0 10px #b9cd94', zIndex: 2 }} />
            <div style={{ position: 'absolute', top: 'calc(50% + 210px)', left: '50%', transform: 'translate(-50%, -50%)', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#b9cd94', border: '2.5px solid rgba(18, 9, 4, 0.95)', boxShadow: '0 0 10px #b9cd94', zIndex: 2 }} />
            <div style={{ position: 'absolute', top: '50%', left: 'calc(50% - 310px)', transform: 'translate(-50%, -50%)', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#b9cd94', border: '2.5px solid rgba(18, 9, 4, 0.95)', boxShadow: '0 0 10px #b9cd94', zIndex: 2 }} />
            <div style={{ position: 'absolute', top: '50%', left: 'calc(50% + 310px)', transform: 'translate(-50%, -50%)', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#b9cd94', border: '2.5px solid rgba(18, 9, 4, 0.95)', boxShadow: '0 0 10px #b9cd94', zIndex: 2 }} />

            {/* 4 Floating Cards Positioned Around Center */}
            <div style={{ position: 'absolute', top: '2%', left: '2%', width: '420px', zIndex: 5 }}>
              <PrincipleCardDesktop principle={principles[0]} />
            </div>
            <div style={{ position: 'absolute', top: '2%', right: '2%', width: '420px', zIndex: 5 }}>
              <PrincipleCardDesktop principle={principles[1]} />
            </div>
            <div style={{ position: 'absolute', bottom: '2%', left: '2%', width: '420px', zIndex: 5 }}>
              <PrincipleCardDesktop principle={principles[2]} />
            </div>
            <div style={{ position: 'absolute', bottom: '2%', right: '2%', width: '420px', zIndex: 5 }}>
              <PrincipleCardDesktop principle={principles[3]} />
            </div>
          </div>
        ) : (
          /* MOBILE & TABLET UNIFIED CONNECTED FIGURE LAYOUT */
          <div 
            style={{ 
              position: 'relative', 
              width: '100%', 
              maxWidth: '480px',
              margin: '0 auto',
              padding: '1.25rem 0.65rem',
              backgroundColor: 'rgba(35, 21, 13, 0.45)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderRadius: '28px',
              border: '1.5px solid rgba(185, 205, 148, 0.35)',
              boxShadow: '0 16px 40px rgba(0, 0, 0, 0.45)',
              boxSizing: 'border-box',
              overflow: 'hidden'
            }}
          >
            {/* Top 2 Cards Row (01 & 02) */}
            <div 
              style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(2, 1fr)', 
                gap: '0.65rem',
                position: 'relative',
                zIndex: 2
              }}
            >
              <PrincipleCardMobile principle={principles[0]} isMobile={isMobile} />
              <PrincipleCardMobile principle={principles[1]} isMobile={isMobile} />
            </div>

            {/* Connecting Vertical & Horizontal Dashed Lines */}
            <div style={{ position: 'relative', height: '55px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0.2rem 0' }}>
              {/* Dashed background connector line */}
              <div 
                style={{ 
                  position: 'absolute', 
                  width: '70%', 
                  height: '100%', 
                  borderLeft: '1.5px dashed rgba(185, 205, 148, 0.65)', 
                  borderRight: '1.5px dashed rgba(185, 205, 148, 0.65)',
                  borderTop: '1.5px dashed rgba(185, 205, 148, 0.55)',
                  borderBottom: '1.5px dashed rgba(185, 205, 148, 0.55)',
                  borderRadius: '20px',
                  pointerEvents: 'none'
                }} 
              />

              {/* Central Connected Emblem Node */}
              <div 
                style={{ 
                  backgroundColor: 'rgba(20, 10, 5, 0.95)',
                  borderRadius: '999px',
                  border: '1.5px solid var(--accent-gold)',
                  padding: '0.35rem 1.1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.6), 0 0 12px rgba(185, 205, 148, 0.3)',
                  zIndex: 10,
                  pointerEvents: 'auto'
                }}
              >
                <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#244f21', border: '1px solid #b9cd94', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Leaf size={12} color="var(--accent-gold)" />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: '0.62rem', letterSpacing: '0.12em', fontWeight: '900', color: 'var(--accent-gold)', textTransform: 'uppercase', display: 'block', lineHeight: 1 }}>
                    MILASTY
                  </span>
                  <span style={{ fontSize: '0.58rem', fontWeight: '800', color: '#FFFDF9', letterSpacing: '0.04em' }}>
                    4 PILLARS
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom 2 Cards Row (03 & 04) */}
            <div 
              style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(2, 1fr)', 
                gap: '0.65rem',
                position: 'relative',
                zIndex: 2,
                marginBottom: '1rem'
              }}
            >
              <PrincipleCardMobile principle={principles[2]} isMobile={isMobile} />
              <PrincipleCardMobile principle={principles[3]} isMobile={isMobile} />
            </div>

            {/* INTEGRATED CONNECTED BOTTOM TRUST ROW (Fitted inside card container) */}
            <div 
              style={{ 
                paddingTop: '0.85rem', 
                borderTop: '1.5px dashed rgba(185, 205, 148, 0.45)',
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '0.45rem',
                alignItems: 'center',
                boxSizing: 'border-box',
                width: '100%'
              }}
            >
              {[
                { label: 'Honest Ingredients', icon: Leaf },
                { label: 'Pure Baking', icon: Flame },
                { label: 'Real Nourishment', icon: Sparkles },
                { label: 'Nothing Unnecessary', icon: ShieldCheck }
              ].map((item, idx) => {
                const IconComp = item.icon;
                return (
                  <div 
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      backgroundColor: 'rgba(20, 10, 5, 0.75)',
                      padding: '0.45rem 0.5rem',
                      borderRadius: '999px',
                      border: '1px solid rgba(185, 205, 148, 0.35)',
                      boxSizing: 'border-box',
                      minWidth: 0,
                      overflow: 'hidden'
                    }}
                  >
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'rgba(36, 79, 33, 0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <IconComp size={11} color="var(--accent-gold)" />
                    </div>
                    <span 
                      style={{ 
                        fontSize: isMobile ? '0.64rem' : '0.72rem', 
                        fontWeight: '800', 
                        color: '#FFFDF9', 
                        letterSpacing: '0.01em', 
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>

          </div>
        )}

        {/* DESKTOP BOTTOM TRUST / VALUE STRIP */}
        {!isMobile && !isTablet && (
          <div 
            style={{ 
              marginTop: '4rem', 
              paddingTop: '2rem', 
              borderTop: '1px solid rgba(255, 255, 255, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-around',
              maxWidth: '1000px',
              margin: '4rem auto 0'
            }}
          >
            {[
              { label: 'Honest Ingredients', icon: Leaf },
              { label: 'Pure Baking', icon: Flame },
              { label: 'Real Nourishment', icon: Sparkles },
              { label: 'Nothing Unnecessary', icon: ShieldCheck }
            ].map((item, idx) => {
              const IconComp = item.icon;
              return (
                <div 
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem',
                    backgroundColor: 'rgba(35, 21, 13, 0.55)',
                    padding: '0.85rem 1.25rem',
                    borderRadius: '999px',
                    border: '1px solid rgba(185, 205, 148, 0.3)',
                    boxSizing: 'border-box'
                  }}
                >
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'rgba(36, 79, 33, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <IconComp size={15} color="var(--accent-gold)" />
                  </div>
                  <span style={{ fontSize: '0.88rem', fontWeight: '800', color: '#FFFDF9', letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </section>
  );
}

// Subcomponent: Desktop Floating Principle Card
function PrincipleCardDesktop({ principle }) {
  const Icon = principle.icon;
  const [hovered, setHovered] = React.useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        borderRadius: '24px',
        backgroundColor: 'rgba(35, 21, 13, 0.78)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: hovered ? '1.5px solid #b9cd94' : '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: hovered ? '0 16px 40px rgba(0, 0, 0, 0.5), 0 0 20px rgba(185, 205, 148, 0.2)' : '0 10px 30px rgba(0,0,0,0.35)',
        transform: hovered ? 'translateY(-6px)' : 'translateY(0)',
        transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        overflow: 'hidden',
        boxSizing: 'border-box',
        height: '210px'
      }}
    >
      {/* Integrated Ingredient Image */}
      <div 
        style={{ 
          width: '145px', 
          height: '100%', 
          position: 'relative', 
          overflow: 'hidden',
          flexShrink: 0 
        }}
      >
        <img
          src={principle.image}
          alt={principle.title}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: hovered ? 'scale(1.08)' : 'scale(1)',
            transition: 'transform 0.5s ease'
          }}
        />
        {/* Subtle overlay gradient */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(0,0,0,0.1), rgba(35, 21, 13, 0.8))' }} />
        
        {/* Circular Floating Badge Icon */}
        <div 
          style={{ 
            position: 'absolute', 
            bottom: '12px', 
            left: '12px', 
            width: '34px', 
            height: '34px', 
            borderRadius: '50%', 
            backgroundColor: '#244f21', 
            border: '1px solid #b9cd94', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            boxShadow: '0 4px 10px rgba(0,0,0,0.4)'
          }}
        >
          <Icon size={17} color="var(--accent-gold)" />
        </div>
      </div>

      {/* Card Details */}
      <div style={{ padding: '1.25rem 1.25rem 1.25rem 1rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', flexGrow: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
          <span style={{ fontSize: '1.35rem', fontWeight: '900', color: 'var(--accent-gold)', fontFamily: 'var(--font-serif)', lineHeight: 1 }}>
            {principle.step}
          </span>
          <span style={{ fontSize: '0.62rem', letterSpacing: '0.08em', fontWeight: '850', textTransform: 'uppercase', color: '#b9cd94', backgroundColor: 'rgba(36, 79, 33, 0.6)', padding: '0.15rem 0.55rem', borderRadius: '999px', border: '1px solid rgba(185, 205, 148, 0.3)' }}>
            {principle.badge}
          </span>
        </div>

        <h3 style={{ fontSize: '1.15rem', color: '#FFFDF9', fontFamily: 'var(--font-serif)', fontWeight: '850', margin: '0 0 0.35rem', lineHeight: '1.2' }}>
          {principle.title}
        </h3>

        <p style={{ fontSize: '0.82rem', color: '#F5EBDD', lineHeight: '1.5', margin: 0, fontWeight: '500', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {principle.desc}
        </p>
      </div>
    </div>
  );
}

// Subcomponent: Mobile 2x2 Principle Card
function PrincipleCardMobile({ principle, isMobile }) {
  const Icon = principle.icon;

  return (
    <div
      style={{
        borderRadius: '18px',
        backgroundColor: 'rgba(35, 21, 13, 0.75)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.18)',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        height: '100%'
      }}
    >
      {/* Top Image Strip */}
      <div style={{ height: isMobile ? '80px' : '110px', width: '100%', position: 'relative', overflow: 'hidden' }}>
        <img
          src={principle.image}
          alt={principle.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 30%, rgba(35, 21, 13, 0.85))' }} />
        
        {/* Step Badge */}
        <span 
          style={{ 
            position: 'absolute', 
            top: '8px', 
            left: '8px', 
            fontSize: isMobile ? '0.95rem' : '1.1rem', 
            fontWeight: '900', 
            color: 'var(--accent-gold)', 
            fontFamily: 'var(--font-serif)',
            backgroundColor: 'rgba(20, 10, 5, 0.75)',
            padding: '0.1rem 0.5rem',
            borderRadius: '8px',
            border: '1px solid rgba(185, 205, 148, 0.3)'
          }}
        >
          {principle.step}
        </span>

        {/* Floating Icon */}
        <div 
          style={{ 
            position: 'absolute', 
            bottom: '6px', 
            right: '8px', 
            width: '26px', 
            height: '26px', 
            borderRadius: '50%', 
            backgroundColor: '#244f21', 
            border: '1px solid #b9cd94', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}
        >
          <Icon size={13} color="var(--accent-gold)" />
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: isMobile ? '0.75rem 0.65rem' : '1rem 0.85rem', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
        <span style={{ fontSize: '0.58rem', letterSpacing: '0.06em', fontWeight: '850', color: '#b9cd94', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
          {principle.badge}
        </span>
        <h3 style={{ fontSize: isMobile ? '0.92rem' : '1.05rem', color: '#FFFDF9', fontFamily: 'var(--font-serif)', fontWeight: '850', margin: '0 0 0.35rem', lineHeight: '1.25' }}>
          {principle.title}
        </h3>
        <p style={{ fontSize: isMobile ? '0.74rem' : '0.82rem', color: '#F5EBDD', lineHeight: '1.4', margin: 0, fontWeight: '500', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {principle.desc}
        </p>
      </div>
    </div>
  );
}

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

      {/* 5. REDESIGNED ORBIT PRINCIPLES SECTION */}
      <OrbitPrinciplesSection />

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
