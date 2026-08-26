import React, { useState, useEffect, useRef } from 'react';
import { Star, CheckCircle2, Quote, ChevronLeft, ChevronRight } from 'lucide-react';

export default function TestimonialSection() {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 992 : false
  );

  const [activeMobileIdx, setActiveMobileIdx] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 992);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Bottom 3 Customer Reviews Data
  const customerReviews = [
    {
      id: 1,
      name: 'Harshita Mishra',
      quote:
        'I tried bajra cookies and taste was awesome. The aroma of cardamom and homely feel in biscuits was worth appreciating. 🥰❤️',
      rating: 5,
      avatar:
        'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
      verified: true,
    },
    {
      id: 2,
      name: 'Sounik Ghosh',
      quote:
        'These cookies are absolutely delicious and perfectly baked. They are soft, Every bite tastes fresh and amazing! 🤩🔥😋',
      rating: 5,
      avatar:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
      verified: true,
    },
    {
      id: 3,
      name: 'Harshit Kumar',
      quote:
        'Its one of the best healthy snacks I have eaten. Its very crunchy and tasty. 😍✨',
      rating: 5,
      avatar:
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
      verified: true,
    },
  ];

  // Automatic scrolling for mobile view (every 3.5s)
  useEffect(() => {
    if (!isMobile || isHovered) return;
    const interval = setInterval(() => {
      setActiveMobileIdx((prev) => (prev + 1) % customerReviews.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [isMobile, isHovered, customerReviews.length]);

  // Touch Swipe Handlers for Mobile Slider
  const handleTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    if (distance > 35) {
      setActiveMobileIdx((prev) => (prev + 1) % customerReviews.length);
    } else if (distance < -35) {
      setActiveMobileIdx((prev) =>
        prev === 0 ? customerReviews.length - 1 : prev - 1
      );
    }
    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  return (
    <section
      style={{
        width: '100%',
        maxWidth: '1200px',
        margin: '0 auto',
        padding: isMobile ? '2.5rem 1.5rem' : '4rem 1.5rem',
        boxSizing: 'border-box',
      }}
    >
      {/* ------------------------------------------------------------- */}
      {/* 1. TOP FEATURED CARD: CELEBRITY PICK                           */}
      {/* ------------------------------------------------------------- */}
      <div
        style={{
          backgroundColor: '#E5D3BF',
          borderRadius: isMobile ? '18px' : '28px',
          boxShadow: '0 16px 36px rgba(0, 0, 0, 0.4)',
          overflow: 'hidden',
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '42% 58%',
          alignItems: 'stretch',
          position: 'relative',
          border: '1px solid #D9C3AE',
        }}
      >
        {/* Left Image Section */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: isMobile ? '200px' : 'auto',
            minHeight: isMobile ? '180px' : '380px',
            maxHeight: isMobile ? '220px' : 'none',
            overflow: 'hidden',
            backgroundColor: '#2A1D15',
          }}
        >
          <img
            src="/images/celebrity_pick.jpg"
            alt="Celebrity Pick - Ananya Sharma"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: isMobile ? 'center 20%' : 'center 25%',
              display: 'block',
            }}
          />
          {/* Wave divider for desktop */}
          {!isMobile && (
            <svg
              viewBox="0 0 100 400"
              preserveAspectRatio="none"
              style={{
                position: 'absolute',
                top: 0,
                right: -1,
                bottom: 0,
                width: '50px',
                height: '100%',
                color: '#E5D3BF',
                pointerEvents: 'none',
                zIndex: 2,
              }}
            >
              <path
                d="M100,0 C65,120 75,280 100,400 L100,0 Z"
                fill="currentColor"
              />
            </svg>
          )}
        </div>

        {/* Right Content Section */}
        <div
          style={{
            padding: isMobile ? '1.6rem 1.35rem 1.75rem' : '3.25rem 3.5rem 3rem 2.5rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            position: 'relative',
            zIndex: 1,
            boxSizing: 'border-box',
          }}
        >
          {/* Top Pill Badge */}
          <div style={{ marginBottom: isMobile ? '0.75rem' : '1rem' }}>
            <span
              style={{
                backgroundColor: '#D9C3AE',
                color: '#4A341E',
                padding: isMobile ? '0.35rem 0.85rem' : '0.4rem 1rem',
                borderRadius: '20px',
                fontSize: isMobile ? '0.72rem' : '0.74rem',
                fontWeight: '700',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
              }}
            >
              <span style={{ color: '#8C6C38' }}>★</span> CELEBRITY PICK
            </span>
          </div>

          {/* Green Star Ratings */}
          <div
            style={{
              display: 'flex',
              gap: '4px',
              color: '#586E37',
              marginBottom: isMobile ? '0.65rem' : '1rem',
            }}
          >
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={isMobile ? 16 : 18} fill="#586E37" color="#586E37" />
            ))}
          </div>

          {/* Large Quote Mark */}
          <div style={{ marginBottom: isMobile ? '0.4rem' : '0.5rem', color: '#9E805E' }}>
            <Quote size={isMobile ? 28 : 42} style={{ transform: 'rotate(180deg)' }} />
          </div>

          {/* Main Quote Text */}
          <p
            style={{
              fontSize: isMobile ? '0.95rem' : '1.18rem',
              fontFamily: 'var(--font-serif), "Playfair Display", Georgia, serif',
              fontStyle: 'italic',
              color: '#3B2A1E',
              lineHeight: isMobile ? '1.6' : '1.65',
              marginBottom: isMobile ? '1.25rem' : '1.75rem',
              fontWeight: '500',
              margin: isMobile ? '0 0 1.25rem' : '0 0 1.75rem',
            }}
          >
            "I genuinely loved how light these cookies are. The texture was
            perfect while my cravings low, and I still feel full. I'm now eating
            a guiltless indulgence!"
          </p>

          {/* Author Details with Vertical Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '0.85rem' : '1.1rem' }}>
            <div
              style={{
                width: '2.5px',
                height: isMobile ? '38px' : '44px',
                backgroundColor: '#9B8161',
                borderRadius: '2px',
              }}
            />
            <div>
              <div
                style={{
                  margin: 0,
                  fontSize: isMobile ? '1.02rem' : '1.12rem',
                  fontWeight: '800',
                  color: '#281B13',
                  fontFamily: 'var(--font-serif), Georgia, serif',
                  lineHeight: '1.2',
                }}
              >
                Ananya Sharma
              </div>
              <div
                style={{
                  margin: '0.2rem 0 0',
                  fontSize: isMobile ? '0.82rem' : '0.86rem',
                  color: '#4F6331',
                  fontWeight: '700',
                }}
              >
                Actress & Wellness Enthusiast
              </div>
            </div>
          </div>

          {/* Botanical Leaf Artwork Watermark */}
          <svg
            width={isMobile ? '90' : '150'}
            height={isMobile ? '90' : '150'}
            viewBox="0 0 120 120"
            fill="none"
            style={{
              position: 'absolute',
              bottom: '5px',
              right: '10px',
              opacity: isMobile ? 0.12 : 0.16,
              pointerEvents: 'none',
              color: '#604C37',
            }}
          >
            <path
              d="M100 110 C85 80 60 50 20 20 M35 35 C50 25 70 35 75 50 C55 55 40 45 35 35 Z M60 65 C75 55 90 65 95 80 C75 85 65 75 60 65 Z M20 20 C30 8 45 5 55 12 C48 30 35 28 20 20 Z"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="currentColor"
            />
          </svg>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. SECTION DIVIDER: WHAT OUR CUSTOMERS SAY                    */}
      {/* ------------------------------------------------------------- */}
      <div
        style={{
          margin: isMobile ? '2rem 0 1.5rem' : '4rem 0 3rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: isMobile ? '0.75rem' : '1.25rem',
        }}
      >
        <div
          style={{
            flex: 1,
            height: '1px',
            background:
              'linear-gradient(90deg, transparent, rgba(163, 181, 128, 0.4), transparent)',
          }}
        />
        <span
          style={{
            color: '#A3B580',
            fontSize: isMobile ? '0.75rem' : '0.86rem',
            fontWeight: '800',
            letterSpacing: isMobile ? '0.12em' : '0.18em',
            textTransform: 'uppercase',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            whiteSpace: 'nowrap',
          }}
        >
          <span style={{ fontSize: isMobile ? '0.95rem' : '1.05rem' }}>🍃</span> WHAT OUR CUSTOMERS SAY
        </span>
        <div
          style={{
            flex: 1,
            height: '1px',
            background:
              'linear-gradient(90deg, transparent, rgba(163, 181, 128, 0.4), transparent)',
          }}
        />
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. BOTTOM CUSTOMER REVIEWS (DESKTOP GRID / MOBILE CAROUSEL)  */}
      {/* ------------------------------------------------------------- */}
      {isMobile ? (
        /* MOBILE AUTOMATIC HORIZONTAL SCROLLING SLIDER */
        <div
          style={{ position: 'relative', width: '100%', overflow: 'hidden' }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div
            style={{
              display: 'flex',
              transition: 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)',
              transform: `translateX(-${activeMobileIdx * 100}%)`,
              width: '100%',
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {customerReviews.map((review) => (
              <div
                key={review.id}
                style={{
                  flex: '0 0 100%',
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '0 4px',
                }}
              >
                <div
                  style={{
                    backgroundColor: 'rgba(35, 21, 13, 0.75)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    borderRadius: '18px',
                    border: '1px solid rgba(185, 205, 148, 0.25)',
                    boxShadow: '0 10px 28px rgba(0, 0, 0, 0.4)',
                    padding: '1.25rem 1.15rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '210px',
                    boxSizing: 'border-box',
                  }}
                >
                  <div>
                    {/* Star Rating */}
                    <div
                      style={{
                        display: 'flex',
                        gap: '3px',
                        color: '#8CB051',
                        marginBottom: '0.65rem',
                      }}
                    >
                      {[...Array(review.rating)].map((_, i) => (
                        <Star key={i} size={15} fill="#8CB051" color="#8CB051" />
                      ))}
                    </div>

                    {/* Quote Icon */}
                    <div style={{ marginBottom: '0.35rem', color: '#9B7D57' }}>
                      <Quote size={24} style={{ transform: 'rotate(180deg)' }} />
                    </div>

                    {/* Review Text */}
                    <p
                      style={{
                        fontSize: '0.9rem',
                        fontFamily:
                          'var(--font-serif), "Playfair Display", Georgia, serif',
                        fontStyle: 'italic',
                        color: '#F0E6D8',
                        lineHeight: '1.55',
                        marginBottom: '1.25rem',
                        fontWeight: '500',
                      }}
                    >
                      "{review.quote}"
                    </p>
                  </div>

                  {/* Bottom Customer Info */}
                  <div
                    style={{
                      borderTop: '1px dotted #4A3A2C',
                      paddingTop: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                      }}
                    >
                      <img
                        src={review.avatar}
                        alt={review.name}
                        style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: '1.5px solid rgba(255, 255, 255, 0.2)',
                        }}
                      />
                      <div>
                        <h4
                          style={{
                            margin: 0,
                            fontSize: '0.9rem',
                            fontWeight: '700',
                            color: '#FFFDF9',
                          }}
                        >
                          {review.name}
                        </h4>
                        {review.verified && (
                          <span
                            style={{
                              fontSize: '0.72rem',
                              color: '#8CB051',
                              fontWeight: '600',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.2rem',
                              marginTop: '0.1rem',
                            }}
                          >
                            <CheckCircle2 size={12} color="#8CB051" /> Verified Buyer
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ opacity: 0.35, color: '#8CB051' }}>
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.4 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
                        <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Mobile Auto-Scroll Controls & Indicators */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              marginTop: '1.15rem',
            }}
          >
            <button
              onClick={() =>
                setActiveMobileIdx((prev) =>
                  prev === 0 ? customerReviews.length - 1 : prev - 1
                )
              }
              aria-label="Previous Review"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                border: '1px solid rgba(185, 205, 148, 0.4)',
                backgroundColor: 'rgba(35, 21, 13, 0.85)',
                color: '#A3B580',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              <ChevronLeft size={16} />
            </button>

            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
              {customerReviews.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveMobileIdx(idx)}
                  aria-label={`Go to review slide ${idx + 1}`}
                  style={{
                    width: activeMobileIdx === idx ? '22px' : '7px',
                    height: '7px',
                    borderRadius: '4px',
                    backgroundColor:
                      activeMobileIdx === idx ? '#A3B580' : 'rgba(255, 255, 255, 0.25)',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                  }}
                />
              ))}
            </div>

            <button
              onClick={() =>
                setActiveMobileIdx((prev) => (prev + 1) % customerReviews.length)
              }
              aria-label="Next Review"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                border: '1px solid rgba(185, 205, 148, 0.4)',
                backgroundColor: 'rgba(35, 21, 13, 0.85)',
                color: '#A3B580',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      ) : (
        /* DESKTOP 3-COLUMN GRID */
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1.5rem',
            alignItems: 'stretch',
          }}
        >
          {customerReviews.map((review) => (
            <div
              key={review.id}
              style={{
                backgroundColor: 'rgba(35, 21, 13, 0.75)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                borderRadius: '20px',
                border: '1px solid rgba(185, 205, 148, 0.25)',
                boxShadow: '0 12px 32px rgba(0, 0, 0, 0.4)',
                padding: '1.75rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                overflow: 'hidden',
                transition: 'transform 0.3s ease, border-color 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.borderColor = 'rgba(185, 205, 148, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'rgba(185, 205, 148, 0.25)';
              }}
            >
              <div>
                {/* Star Rating */}
                <div
                  style={{
                    display: 'flex',
                    gap: '4px',
                    color: '#8CB051',
                    marginBottom: '0.85rem',
                  }}
                >
                  {[...Array(review.rating)].map((_, i) => (
                    <Star key={i} size={16} fill="#8CB051" color="#8CB051" />
                  ))}
                </div>

                {/* Quote Icon */}
                <div style={{ marginBottom: '0.5rem', color: '#9B7D57' }}>
                  <Quote size={28} style={{ transform: 'rotate(180deg)' }} />
                </div>

                {/* Review Text */}
                <p
                  style={{
                    fontSize: '0.95rem',
                    fontFamily:
                      'var(--font-serif), "Playfair Display", Georgia, serif',
                    fontStyle: 'italic',
                    color: '#F0E6D8',
                    lineHeight: '1.65',
                    marginBottom: '1.75rem',
                    fontWeight: '500',
                  }}
                >
                  "{review.quote}"
                </p>
              </div>

              {/* Bottom Customer Info & Verified Badge */}
              <div
                style={{
                  borderTop: '1px dotted #4A3A2C',
                  paddingTop: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.85rem',
                  }}
                >
                  <img
                    src={review.avatar}
                    alt={review.name}
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '1.5px solid rgba(255, 255, 255, 0.2)',
                    }}
                  />
                  <div>
                    <h4
                      style={{
                        margin: 0,
                        fontSize: '0.95rem',
                        fontWeight: '700',
                        color: '#FFFDF9',
                      }}
                    >
                      {review.name}
                    </h4>
                    {review.verified && (
                      <span
                        style={{
                          fontSize: '0.76rem',
                          color: '#8CB051',
                          fontWeight: '600',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          marginTop: '0.15rem',
                        }}
                      >
                        <CheckCircle2 size={13} color="#8CB051" /> Verified Buyer
                      </span>
                    )}
                  </div>
                </div>

                {/* Watermark leaf icon */}
                <div style={{ opacity: 0.35, color: '#8CB051' }}>
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.4 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
                    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
