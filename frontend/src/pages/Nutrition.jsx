import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck, Download, Award, FileText, Sparkles, CheckCircle2,
  Sprout, Heart, BookOpen, Layers, Check, ChevronRight, Activity, Flame, Wheat,
  ChevronLeft
} from 'lucide-react';
import api from '../api/axios';
import { initialProducts } from '../data/seedData';

export default function Nutrition() {
  const [products, setProducts] = useState(initialProducts);
  const [glanceIndex, setGlanceIndex] = useState(0);
  const [whyIngredientsIndex, setWhyIngredientsIndex] = useState(0);

  const [isGlanceHovered, setIsGlanceHovered] = useState(false);
  const [isIngredientsHovered, setIsIngredientsHovered] = useState(false);

  // Touch gesture swipe state
  const [glanceTouchStartX, setGlanceTouchStartX] = useState(null);
  const [glanceTouchStartY, setGlanceTouchStartY] = useState(null);
  const [ingredientsTouchStartX, setIngredientsTouchStartX] = useState(null);
  const [ingredientsTouchStartY, setIngredientsTouchStartY] = useState(null);

  const insideBiteRef = useRef(null);
  const glanceRef = useRef(null);
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

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get('/products?limit=100');
        if (res.data && res.data.products) {
          setProducts(res.data.products);
        }
      } catch (err) {
        console.error('Error fetching products from database, using seed fallback:', err);
      }
    };
    fetchProducts();
  }, []);

  const displayProducts = products && products.length > 0 ? products : initialProducts;
  const dailyProducts = displayProducts.filter((p) => {
    const reportUrl = p.labReportUrl || p.lab_report_url;
    return reportUrl && typeof reportUrl === 'string' && reportUrl.trim() !== '';
  }).slice(0, 5);

  // Auto-scroll Nutrition At A Glance cards (every 2.0s with hover/touch pause)
  useEffect(() => {
    if (isGlanceHovered || dailyProducts.length <= 1) return;
    const timer = setInterval(() => {
      setGlanceIndex((prev) => (prev + 1) % dailyProducts.length);
    }, 2000);
    return () => clearInterval(timer);
  }, [isGlanceHovered, dailyProducts.length]);

  // Auto-scroll Why Ingredients Matter / Clean Sourcing cards (every 2.0s with hover/touch pause)
  useEffect(() => {
    if (isIngredientsHovered) return;
    const timer = setInterval(() => {
      setWhyIngredientsIndex((prev) => (prev + 1) % 3);
    }, 2000);
    return () => clearInterval(timer);
  }, [isIngredientsHovered]);

  const whyIngredientsData = [
    {
      title: "Why Pure Desi Ghee?",
      icon: <Sparkles size={28} color="#2F6B3A" />,
      desc: "Unlike industrial palm oil and hydrogenated fats used in commercial biscuits, pure Desi Ghee provides butyric acid, supporting gut lining integrity and enhancing bioavailability of fat-soluble vitamins (A, D, E, K)."
    },
    {
      title: "Why Unrefined Organic Jaggery?",
      icon: <Award size={28} color="#2F6B3A" />,
      desc: "Refined white sugar strips away minerals causing rapid blood glucose spikes. Organic jaggery retains essential trace elements like Iron, Magnesium, and Potassium, ensuring sustained clean energy."
    },
    {
      title: "Why Ancient Millets over Maida?",
      icon: <ShieldCheck size={28} color="#2F6B3A" />,
      desc: "Refined Maida creates inflammatory mucus in the digestive tract. Millets (Bajra, Jowar, Ragi) deliver rich dietary fiber, naturally slow digestion, and keep you feeling full for longer."
    }
  ];

  const handleDownload = async (url, filename) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', filename || 'report.pdf');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed, opening in new tab:', error);
      window.open(url, '_blank');
    }
  };

  return (
    <div
      className="nutrition-page"
      style={{
        minHeight: '100vh',
        padding: '0 0 6rem',
        width: '100%',
        maxWidth: '100%',
        overflowX: 'hidden',
        boxSizing: 'border-box',
        position: 'relative',
        backgroundColor: '#F7F0E5',
        backgroundImage: 'linear-gradient(rgba(247, 240, 229, 0.25), rgba(247, 240, 229, 0.25)), url(/images/nutrition_background_image.jpeg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        color: '#2B170D',
      }}
    >
      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* 1. HERO SECTION */}
        <section
          className="nutrition-hero-section"
          style={{
            padding: '5rem 1.5rem 4rem',
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
            Nutrition • Complete Transparency
          </span>
          <h1
            style={{
              fontSize: 'clamp(2.1rem, 5.2vw, 3.8rem)',
              fontFamily: 'var(--font-serif)',
              color: '#32180D',
              fontWeight: '850',
              lineHeight: '1.15',
              margin: '0 0 1.25rem 0',
              letterSpacing: '-0.02em',
            }}
          >
            What's Inside Every Bite.
          </h1>
          <p
            style={{
              fontSize: 'clamp(1rem, 2.2vw, 1.18rem)',
              color: '#654B38',
              lineHeight: '1.7',
              marginBottom: '1.5rem',
              fontWeight: '550'
            }}
          >
            Simple ingredients. Honest nutrition. Complete transparency.
          </p>
          <p
            style={{
              fontSize: '0.94rem',
              color: '#654B38',
              lineHeight: '1.65',
              maxWidth: '620px',
              margin: '0 auto 2.5rem'
            }}
          >
            At MILASTY, we believe you deserve to know exactly what goes into your snacks. We provide complete ingredient lists, macro breakdowns, and verified lab test reports for our slow-baked millet cookies.
          </p>

          {/* Trust Indicators */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', justifyContent: 'center', fontSize: '0.86rem', fontWeight: '850', color: '#32180D' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <CheckCircle2 size={18} color="#2F6B3A" />
              <span>Clean-label ingredients</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <CheckCircle2 size={18} color="#2F6B3A" />
              <span>Transparent nutrition</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <CheckCircle2 size={18} color="#2F6B3A" />
              <span>Lab-tested information</span>
            </div>
          </div>
        </section>

        {/* 2. NUTRITION HIGHLIGHTS */}
        <section style={{ maxWidth: '1200px', margin: '0 auto 5rem', paddingLeft: '1.5rem', paddingRight: '1.5rem', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h2 style={{ fontSize: 'clamp(1.35rem, 3.2vw, 1.8rem)', fontFamily: 'var(--font-serif)', color: '#32180D', fontWeight: '850', margin: 0 }}>
              What's Inside Every Bite
            </h2>
            <div className="section-scroll-buttons" style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => scrollLeft(insideBiteRef)}
                aria-label="Scroll left"
                style={{ backgroundColor: '#FFF9F0', border: '1px solid #DCC8AE', color: '#32180D', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => scrollRight(insideBiteRef)}
                aria-label="Scroll right"
                style={{ backgroundColor: '#FFF9F0', border: '1px solid #DCC8AE', color: '#32180D', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div
            ref={glanceRef}
            className="horizontal-scroll-container fitted-cards-container-4"
            onMouseEnter={() => setIsGlanceHovered(true)}
            onMouseLeave={() => setIsGlanceHovered(false)}
            onTouchStart={() => setIsGlanceHovered(true)}
            onTouchEnd={() => setIsGlanceHovered(false)}
          >
            <div
              style={{
                backgroundColor: '#FFF9F0',
                border: '1px solid #DCC8AE',
                padding: '2rem 1.75rem',
                borderRadius: '20px',
                boxSizing: 'border-box',
                boxShadow: '0 4px 16px rgba(75, 45, 25, 0.05)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <span style={{ fontSize: '1.25rem', fontFamily: 'var(--font-serif)', color: '#2F6B3A', fontWeight: '900' }}>01</span>
                <Sprout size={22} color="#2F6B3A" />
              </div>
              <h3 style={{ fontSize: '1.05rem', color: '#32180D', marginBottom: '0.5rem', fontWeight: '850', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Ancient Millets</h3>
              <p style={{ fontSize: '0.85rem', color: '#654B38', lineHeight: '1.6', margin: 0, fontWeight: '500' }}>
                Made with traditional millet grains such as Bajra, Jowar and Ragi.
              </p>
            </div>

            <div
              style={{
                backgroundColor: '#FFF9F0',
                border: '1px solid #DCC8AE',
                padding: '2rem 1.75rem',
                borderRadius: '20px',
                boxSizing: 'border-box',
                boxShadow: '0 4px 16px rgba(75, 45, 25, 0.05)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <span style={{ fontSize: '1.25rem', fontFamily: 'var(--font-serif)', color: '#2F6B3A', fontWeight: '900' }}>02</span>
                <ShieldCheck size={22} color="#2F6B3A" />
              </div>
              <h3 style={{ fontSize: '1.05rem', color: '#32180D', marginBottom: '0.5rem', fontWeight: '850', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Pure Desi Ghee</h3>
              <p style={{ fontSize: '0.85rem', color: '#654B38', lineHeight: '1.6', margin: 0, fontWeight: '500' }}>
                Made using the ingredients listed in each product's formulation.
              </p>
            </div>

            <div
              style={{
                backgroundColor: '#FFF9F0',
                border: '1px solid #DCC8AE',
                padding: '2rem 1.75rem',
                borderRadius: '20px',
                boxSizing: 'border-box',
                boxShadow: '0 4px 16px rgba(75, 45, 25, 0.05)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <span style={{ fontSize: '1.25rem', fontFamily: 'var(--font-serif)', color: '#2F6B3A', fontWeight: '900' }}>03</span>
                <Sparkles size={22} color="#2F6B3A" />
              </div>
              <h3 style={{ fontSize: '1.05rem', color: '#32180D', marginBottom: '0.5rem', fontWeight: '850', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Unrefined Jaggery</h3>
              <p style={{ fontSize: '0.85rem', color: '#654B38', lineHeight: '1.6', margin: 0, fontWeight: '500' }}>
                Naturally sweetened with unrefined jaggery where specified.
              </p>
            </div>

            <div
              style={{
                backgroundColor: '#FFF9F0',
                border: '1px solid #DCC8AE',
                padding: '2rem 1.75rem',
                borderRadius: '20px',
                boxSizing: 'border-box',
                boxShadow: '0 4px 16px rgba(75, 45, 25, 0.05)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <span style={{ fontSize: '1.25rem', fontFamily: 'var(--font-serif)', color: '#2F6B3A', fontWeight: '900' }}>04</span>
                <Layers size={22} color="#2F6B3A" />
              </div>
              <h3 style={{ fontSize: '1.05rem', color: '#32180D', marginBottom: '0.5rem', fontWeight: '850', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Full Transparency</h3>
              <p style={{ fontSize: '0.85rem', color: '#654B38', lineHeight: '1.6', margin: 0, fontWeight: '500' }}>
                Clear nutritional information for the products listed below.
              </p>
            </div>
          </div>
        </section>

        {/* 3. NUTRITION COMPARISON SECTION */}
        <section style={{ maxWidth: '1200px', margin: '0 auto 6.5rem', paddingLeft: '1.5rem', paddingRight: '1.5rem', boxSizing: 'border-box' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontFamily: 'var(--font-serif)', color: '#32180D', fontWeight: '850', margin: '0 0 0.5rem 0' }}>
              Nutrition, At A Glance
            </h2>
            <p style={{ fontSize: '0.98rem', color: '#654B38', margin: 0, fontWeight: '550' }}>
              Compare the nutritional profile of our signature bakes.
            </p>
          </div>

          {/* DESKTOP TABLE VIEW */}
          <div className="desktop-only-table" style={{ borderRadius: '24px', overflowX: 'auto', border: '1px solid #DCC8AE', boxShadow: '0 8px 30px rgba(75, 45, 25, 0.06)', backgroundColor: '#FFF9F0', maxWidth: '100%' }}>
            <table style={{ width: '100%', minWidth: '700px', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#F1E5D4', color: '#32180D' }}>
                  <th style={{ padding: '1.75rem 1.5rem', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: '850', width: '22%' }}>Metric</th>
                  {dailyProducts.map((p, idx) => (
                    <th key={idx} style={{ padding: '1.75rem 1.5rem', verticalAlign: 'top', width: '26%' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div style={{ width: '100px', height: '100px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #DCC8AE' }}>
                          <img src={p.image} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <div>
                          <h4 style={{ fontSize: '0.95rem', fontWeight: '850', color: '#32180D', margin: '0 0 0.25rem 0' }}>{p.title}</h4>
                          <p style={{ fontSize: '0.76rem', color: '#654B38', lineHeight: '1.4', margin: 0, fontWeight: '500', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.subtitle || p.description}</p>
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #DCC8AE', backgroundColor: '#FCF8F1' }}>
                  <td style={{ padding: '1.25rem 1.5rem', fontWeight: '850', color: '#32180D', fontSize: '0.88rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <Flame size={15} color="#2F6B3A" />
                      <span>Energy (kcal)</span>
                    </div>
                  </td>
                  {dailyProducts.map((p, idx) => {
                    const val = p.nutritionFacts?.energyKcal;
                    return (
                      <td key={idx} style={{ padding: '1.25rem 1.5rem', fontWeight: '800', color: '#2B170D', fontSize: '0.9rem' }}>
                        {val !== undefined && val !== null && val !== '' ? `${val} kcal` : '—'}
                      </td>
                    );
                  })}
                </tr>

                <tr style={{ borderBottom: '1px solid #DCC8AE', backgroundColor: '#FFF9F0' }}>
                  <td style={{ padding: '1.25rem 1.5rem', fontWeight: '850', color: '#32180D', fontSize: '0.88rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <Activity size={15} color="#2F6B3A" />
                      <span>Protein (g)</span>
                    </div>
                  </td>
                  {dailyProducts.map((p, idx) => {
                    const val = p.nutritionFacts?.proteinG;
                    return (
                      <td key={idx} style={{ padding: '1.25rem 1.5rem', fontWeight: '800', color: '#2B170D', fontSize: '0.9rem' }}>
                        {val !== undefined && val !== null && val !== '' ? `${val}g` : '—'}
                      </td>
                    );
                  })}
                </tr>

                <tr style={{ borderBottom: '1px solid #DCC8AE', backgroundColor: '#FCF8F1' }}>
                  <td style={{ padding: '1.25rem 1.5rem', fontWeight: '850', color: '#32180D', fontSize: '0.88rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <Wheat size={15} color="#2F6B3A" />
                      <span>Carbohydrates (g)</span>
                    </div>
                  </td>
                  {dailyProducts.map((p, idx) => {
                    const val = p.nutritionFacts?.carbohydrateG;
                    return (
                      <td key={idx} style={{ padding: '1.25rem 1.5rem', fontWeight: '800', color: '#2B170D', fontSize: '0.9rem' }}>
                        {val !== undefined && val !== null && val !== '' ? `${val}g` : '—'}
                      </td>
                    );
                  })}
                </tr>

                <tr style={{ borderBottom: '1px solid #DCC8AE', backgroundColor: '#FFF9F0' }}>
                  <td style={{ padding: '1.25rem 1.5rem', fontWeight: '850', color: '#32180D', fontSize: '0.88rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <CheckCircle2 size={15} color="#2F6B3A" />
                      <span>Added Refined Sugar</span>
                    </div>
                  </td>
                  {dailyProducts.map((p, idx) => (
                    <td key={idx} style={{ padding: '1.25rem 1.5rem', fontWeight: '850', color: '#2F6B3A', fontSize: '0.85rem' }}>
                      0g (100% Unrefined Jaggery)
                    </td>
                  ))}
                </tr>

                <tr style={{ borderBottom: '1px solid #DCC8AE', backgroundColor: '#FCF8F1' }}>
                  <td style={{ padding: '1.25rem 1.5rem', fontWeight: '850', color: '#32180D', fontSize: '0.88rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <CheckCircle2 size={15} color="#2F6B3A" />
                      <span>Fat Type</span>
                    </div>
                  </td>
                  {dailyProducts.map((p, idx) => (
                    <td key={idx} style={{ padding: '1.25rem 1.5rem', fontWeight: '850', color: '#2F6B3A', fontSize: '0.85rem' }}>
                      100% Pure Desi Ghee (0% Palm Oil)
                    </td>
                  ))}
                </tr>

                <tr style={{ borderBottom: '1px solid #DCC8AE', backgroundColor: '#FFF9F0' }}>
                  <td style={{ padding: '1.25rem 1.5rem', fontWeight: '850', color: '#32180D', fontSize: '0.88rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <Sprout size={15} color="#2F6B3A" />
                      <span>Dietary Fiber (g)</span>
                    </div>
                  </td>
                  {dailyProducts.map((p, idx) => {
                    const val = p.nutritionFacts?.dietaryFiberG;
                    return (
                      <td key={idx} style={{ padding: '1.25rem 1.5rem', fontWeight: '800', color: '#2B170D', fontSize: '0.9rem' }}>
                        {val !== undefined && val !== null && val !== '' ? `${val}g` : '—'}
                      </td>
                    );
                  })}
                </tr>

                <tr style={{ backgroundColor: '#FCF8F1' }}>
                  <td style={{ padding: '1.5rem 1.5rem', fontWeight: '850', color: '#32180D', fontSize: '0.88rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <FileText size={15} color="#2F6B3A" />
                      <span>Official Lab Report</span>
                    </div>
                  </td>
                  {dailyProducts.map((p, idx) => {
                    const reportUrl = p.labReportUrl || p.lab_report_url || '';
                    return (
                      <td key={idx} style={{ padding: '1.5rem 1.5rem' }}>
                        {reportUrl ? (
                          <button
                            onClick={() => handleDownload(reportUrl, `${p.title.replace(/\s+/g, '_')}_Lab_Report.pdf`)}
                            className="btn-primary"
                            style={{
                              padding: '0.55rem 1rem',
                              fontSize: '0.8rem',
                              fontWeight: '850',
                              backgroundColor: '#2F6B3A',
                              color: '#FFFFFF',
                              borderRadius: '10px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              textDecoration: 'none',
                              border: 'none',
                              cursor: 'pointer'
                            }}
                          >
                            <Download size={13} />
                            <span>Download Lab Report</span>
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: '#806A57', fontWeight: '600' }}>Not available</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>

          {/* MOBILE SINGLE CARD AUTO-SCROLLING CAROUSEL (NUTRITION AT A GLANCE) */}
          <div
            className="nutrition-glance-mobile-carousel"
            onMouseEnter={() => setIsGlanceHovered(true)}
            onMouseLeave={() => setIsGlanceHovered(false)}
            onTouchStart={(e) => {
              setIsGlanceHovered(true);
              const touch = e.touches[0];
              setGlanceTouchStartX(touch.clientX);
              setGlanceTouchStartY(touch.clientY);
            }}
            onTouchMove={(e) => {
              if (glanceTouchStartX === null) return;
              const touch = e.touches[0];
              const diffX = glanceTouchStartX - touch.clientX;
              const diffY = Math.abs(glanceTouchStartY - touch.clientY);
              if (Math.abs(diffX) > diffY && Math.abs(diffX) > 10) {
                if (e.cancelable) e.preventDefault();
              }
            }}
            onTouchEnd={(e) => {
              setIsGlanceHovered(false);
              if (glanceTouchStartX === null) return;
              const touch = e.changedTouches[0];
              const diffX = glanceTouchStartX - touch.clientX;
              const diffY = Math.abs(glanceTouchStartY - touch.clientY);
              if (Math.abs(diffX) > 40 && Math.abs(diffX) > diffY) {
                if (diffX > 0) {
                  setGlanceIndex((prev) => (prev + 1) % dailyProducts.length);
                } else {
                  setGlanceIndex((prev) => (prev === 0 ? dailyProducts.length - 1 : prev - 1));
                }
              }
              setGlanceTouchStartX(null);
              setGlanceTouchStartY(null);
            }}
            style={{ touchAction: 'pan-y', userSelect: 'none', WebkitUserSelect: 'none' }}
          >
            {dailyProducts[glanceIndex] && (
              <div
                key={glanceIndex}
                style={{
                  backgroundColor: '#FFF9F0',
                  border: '1px solid #DCC8AE',
                  borderRadius: '24px',
                  overflow: 'hidden',
                  width: '100%',
                  boxSizing: 'border-box'
                }}
              >
                <div style={{ padding: '1.25rem 1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', borderBottom: '1px solid #DCC8AE' }}>
                  <img src={dailyProducts[glanceIndex].image} alt={dailyProducts[glanceIndex].title} style={{ width: '60px', height: '60px', borderRadius: '12px', objectFit: 'cover' }} />
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: '850', color: '#32180D', margin: '0 0 0.15rem 0' }}>{dailyProducts[glanceIndex].title}</h3>
                    <p style={{ fontSize: '0.78rem', color: '#654B38', margin: 0, fontWeight: '500' }}>{dailyProducts[glanceIndex].subtitle || dailyProducts[glanceIndex].description}</p>
                  </div>
                </div>

                <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: '#654B38', fontWeight: '700' }}>Energy</span>
                    <span style={{ color: '#32180D', fontWeight: '900' }}>{dailyProducts[glanceIndex].nutritionFacts?.energyKcal} kcal</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: '#654B38', fontWeight: '700' }}>Protein</span>
                    <span style={{ color: '#32180D', fontWeight: '900' }}>{dailyProducts[glanceIndex].nutritionFacts?.proteinG}g</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: '#654B38', fontWeight: '700' }}>Carbohydrates</span>
                    <span style={{ color: '#32180D', fontWeight: '900' }}>{dailyProducts[glanceIndex].nutritionFacts?.carbohydrateG}g</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: '#654B38', fontWeight: '700' }}>Added Sugar</span>
                    <span style={{ color: '#2F6B3A', fontWeight: '900' }}>0g (100% Jaggery)</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: '#654B38', fontWeight: '700' }}>Fat Type</span>
                    <span style={{ color: '#2F6B3A', fontWeight: '900' }}>100% Desi Ghee</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: '#654B38', fontWeight: '700' }}>Dietary Fiber</span>
                    <span style={{ color: '#32180D', fontWeight: '900' }}>{dailyProducts[glanceIndex].nutritionFacts?.dietaryFiberG}g</span>
                  </div>

                  {dailyProducts[glanceIndex].labReportUrl && (
                    <div style={{ paddingTop: '0.85rem', borderTop: '1px solid #DCC8AE', marginTop: '0.35rem' }}>
                      <button
                        onClick={() => handleDownload(dailyProducts[glanceIndex].labReportUrl, `${dailyProducts[glanceIndex].title.replace(/\s+/g, '_')}_Lab_Report.pdf`)}
                        className="btn-primary"
                        style={{
                          padding: '0.65rem 0',
                          fontSize: '0.8rem',
                          fontWeight: '850',
                          backgroundColor: '#2F6B3A',
                          color: '#FFFFFF',
                          borderRadius: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.35rem',
                          width: '100%',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        <Download size={14} />
                        <span>Download Lab Report</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Carousel Manual Control Strip with Arrows & Dots */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.85rem', marginTop: '1.25rem' }}>
              <button
                onClick={() => setGlanceIndex((prev) => (prev === 0 ? dailyProducts.length - 1 : prev - 1))}
                aria-label="Previous card"
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: '#FFF9F0',
                  border: '1px solid #DCC8AE',
                  color: '#32180D',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease'
                }}
              >
                <ChevronLeft size={18} />
              </button>

              <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center' }}>
                {dailyProducts.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setGlanceIndex(idx)}
                    style={{
                      width: glanceIndex === idx ? '24px' : '8px',
                      height: '8px',
                      borderRadius: '999px',
                      backgroundColor: glanceIndex === idx ? '#2F6B3A' : '#DCC8AE',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    aria-label={`Go to card ${idx + 1}`}
                  />
                ))}
              </div>

              <button
                onClick={() => setGlanceIndex((prev) => (prev + 1) % dailyProducts.length)}
                aria-label="Next card"
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: '#FFF9F0',
                  border: '1px solid #DCC8AE',
                  color: '#32180D',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease'
                }}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

        </section>

        {/* 4. VISUAL STORYTELLING (From Grain To Bake) */}
        <section style={{ backgroundColor: '#F1E5D4', padding: '6.5rem 0', borderTop: '1px solid #DCC8AE', borderBottom: '1px solid #DCC8AE', marginBottom: '6.5rem' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', paddingLeft: '1.5rem', paddingRight: '1.5rem', boxSizing: 'border-box' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '3.5rem', alignItems: 'center' }}>

              {/* Left Column: Image */}
              <div style={{ borderRadius: '24px', overflow: 'hidden', border: '1px solid #DCC8AE', boxShadow: '0 8px 30px rgba(75, 45, 25, 0.08)' }}>
                <img
                  src="/images/image1.jpeg"
                  alt="Slow baked millet cookies pile"
                  style={{ width: '100%', height: 'auto', minHeight: '280px', maxHeight: '420px', objectFit: 'cover', display: 'block', transition: 'transform 0.4s' }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                />
              </div>

              {/* Right Column: Steps */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                  <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.14em', color: '#2F6B3A', fontWeight: '850', display: 'block', marginBottom: '0.35rem' }}>Ingredient Philosophy</span>
                  <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontFamily: 'var(--font-serif)', color: '#32180D', fontWeight: '850', margin: 0 }}>
                    From Grain To Bake
                  </h2>
                </div>
                <p style={{ fontSize: '0.98rem', color: '#654B38', lineHeight: '1.7', margin: 0, fontWeight: '550' }}>
                  We work directly with domestic farming sources to identify wholesome ancient millets. We never refine, strip, or dilute our baking ingredients.
                </p>

                <div className="grain-to-bake-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '1rem', marginTop: '0.5rem' }}>
                  <div style={{ backgroundColor: '#FFF9F0', border: '1px solid #DCC8AE', padding: '1.25rem', borderRadius: '16px' }}>
                    <h4 style={{ fontSize: '0.88rem', fontWeight: '850', color: '#2F6B3A', display: 'flex', alignItems: 'flex-start', gap: '0.4rem', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      <span style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>01</span>
                      <span>Ancient Grains</span>
                    </h4>
                    <p style={{ fontSize: '0.8rem', color: '#654B38', margin: 0, lineHeight: '1.5', fontWeight: '500' }}>Sourced native Bajra, Jowar, and Ragi flour.</p>
                  </div>
                  <div style={{ backgroundColor: '#FFF9F0', border: '1px solid #DCC8AE', padding: '1.25rem', borderRadius: '16px' }}>
                    <h4 style={{ fontSize: '0.88rem', fontWeight: '850', color: '#2F6B3A', display: 'flex', alignItems: 'flex-start', gap: '0.4rem', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      <span style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>02</span>
                      <span>Selected Ingredients</span>
                    </h4>
                    <p style={{ fontSize: '0.8rem', color: '#654B38', margin: 0, lineHeight: '1.5', fontWeight: '500' }}>Pure cow Desi Ghee & unrefined organic jaggery.</p>
                  </div>
                  <div style={{ backgroundColor: '#FFF9F0', border: '1px solid #DCC8AE', padding: '1.25rem', borderRadius: '16px' }}>
                    <h4 style={{ fontSize: '0.88rem', fontWeight: '850', color: '#2F6B3A', display: 'flex', alignItems: 'flex-start', gap: '0.4rem', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      <span style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>03</span>
                      <span>Slow Baking</span>
                    </h4>
                    <p style={{ fontSize: '0.8rem', color: '#654B38', margin: 0, lineHeight: '1.5', fontWeight: '500' }}>Slow-baked in temperature-controlled oven bakes.</p>
                  </div>
                  <div style={{ backgroundColor: '#FFF9F0', border: '1px solid #DCC8AE', padding: '1.25rem', borderRadius: '16px' }}>
                    <h4 style={{ fontSize: '0.88rem', fontWeight: '850', color: '#2F6B3A', display: 'flex', alignItems: 'flex-start', gap: '0.4rem', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      <span style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>04</span>
                      <span>Finished Bake</span>
                    </h4>
                    <p style={{ fontSize: '0.8rem', color: '#654B38', margin: 0, lineHeight: '1.5', fontWeight: '500' }}>A crumbly, delicious, clean millet cookie.</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* 5. EDUCATIONAL SECTION (Why Ghee, Jaggery, Millets) */}
        <section style={{ width: '100%', maxWidth: '1200px', margin: '0 auto 6.5rem', paddingLeft: '1.5rem', paddingRight: '1.5rem', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3.5rem', flexWrap: 'wrap', gap: '1.25rem' }}>
            <div>
              <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.14em', color: '#2F6B3A', fontWeight: '850', backgroundColor: '#E3EEDC', padding: '0.4rem 0.95rem', borderRadius: '999px', border: '1px solid #DCC8AE', display: 'inline-block', marginBottom: '0.75rem' }}>Clean Sourcing</span>
              <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontFamily: 'var(--font-serif)', color: '#32180D', fontWeight: '850', margin: 0 }}>
                Why These Ingredients Matter
              </h2>
              <p style={{ fontSize: '0.98rem', color: '#654B38', margin: '0.5rem 0 0 0', fontWeight: '550' }}>
                We believe transparency starts with understanding what goes into your food.
              </p>
            </div>
            <div className="section-scroll-buttons" style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => scrollLeft(ingredientsRef)}
                aria-label="Scroll left"
                style={{ backgroundColor: '#FFF9F0', border: '1px solid #DCC8AE', color: '#32180D', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => scrollRight(ingredientsRef)}
                aria-label="Scroll right"
                style={{ backgroundColor: '#FFF9F0', border: '1px solid #DCC8AE', color: '#32180D', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* DESKTOP 3 CARDS VIEW */}
          <div
            ref={ingredientsRef}
            className="horizontal-scroll-container fitted-cards-container-3"
            onMouseEnter={() => setIsIngredientsHovered(true)}
            onMouseLeave={() => setIsIngredientsHovered(false)}
            onTouchStart={() => setIsIngredientsHovered(true)}
            onTouchEnd={() => setIsIngredientsHovered(false)}
          >
            {whyIngredientsData.map((item, idx) => (
              <div key={idx} style={{ backgroundColor: '#FFF9F0', border: '1px solid #DCC8AE', padding: '2.5rem 2.25rem', borderRadius: '24px', boxSizing: 'border-box', boxShadow: '0 4px 16px rgba(75, 45, 25, 0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <span style={{ fontSize: '1.5rem', fontFamily: 'var(--font-serif)', color: '#2F6B3A', fontWeight: '900' }}>0{idx + 1}</span>
                  {item.icon}
                </div>
                <h3 style={{ fontSize: '1.25rem', color: '#32180D', marginBottom: '0.75rem', fontFamily: 'var(--font-serif)', fontWeight: '850' }}>{item.title}</h3>
                <p style={{ color: '#654B38', fontSize: '0.92rem', lineHeight: '1.7', margin: 0, fontWeight: '500' }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>

          {/* MOBILE SINGLE CARD AUTO-SCROLLING CAROUSEL (WHY INGREDIENTS MATTER) */}
          <div
            className="why-ingredients-mobile-carousel"
            onMouseEnter={() => setIsIngredientsHovered(true)}
            onMouseLeave={() => setIsIngredientsHovered(false)}
            onTouchStart={(e) => {
              setIsIngredientsHovered(true);
              const touch = e.touches[0];
              setIngredientsTouchStartX(touch.clientX);
              setIngredientsTouchStartY(touch.clientY);
            }}
            onTouchMove={(e) => {
              if (ingredientsTouchStartX === null) return;
              const touch = e.touches[0];
              const diffX = ingredientsTouchStartX - touch.clientX;
              const diffY = Math.abs(ingredientsTouchStartY - touch.clientY);
              if (Math.abs(diffX) > diffY && Math.abs(diffX) > 10) {
                if (e.cancelable) e.preventDefault();
              }
            }}
            onTouchEnd={(e) => {
              setIsIngredientsHovered(false);
              if (ingredientsTouchStartX === null) return;
              const touch = e.changedTouches[0];
              const diffX = ingredientsTouchStartX - touch.clientX;
              const diffY = Math.abs(ingredientsTouchStartY - touch.clientY);
              if (Math.abs(diffX) > 40 && Math.abs(diffX) > diffY) {
                if (diffX > 0) {
                  setWhyIngredientsIndex((prev) => (prev + 1) % whyIngredientsData.length);
                } else {
                  setWhyIngredientsIndex((prev) => (prev === 0 ? whyIngredientsData.length - 1 : prev - 1));
                }
              }
              setIngredientsTouchStartX(null);
              setIngredientsTouchStartY(null);
            }}
            style={{ touchAction: 'pan-y', userSelect: 'none', WebkitUserSelect: 'none' }}
          >
            {whyIngredientsData[whyIngredientsIndex] && (
              <div style={{ backgroundColor: '#FFF9F0', border: '1px solid #DCC8AE', padding: '2rem 1.5rem', borderRadius: '24px', boxSizing: 'border-box' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <span style={{ fontSize: '1.4rem', fontFamily: 'var(--font-serif)', color: '#2F6B3A', fontWeight: '900' }}>
                    0{whyIngredientsIndex + 1}
                  </span>
                  {whyIngredientsData[whyIngredientsIndex].icon}
                </div>
                <h3 style={{ fontSize: '1.2rem', color: '#32180D', marginBottom: '0.65rem', fontFamily: 'var(--font-serif)', fontWeight: '850' }}>
                  {whyIngredientsData[whyIngredientsIndex].title}
                </h3>
                <p style={{ color: '#654B38', fontSize: '0.9rem', lineHeight: '1.65', margin: 0, fontWeight: '500' }}>
                  {whyIngredientsData[whyIngredientsIndex].desc}
                </p>
              </div>
            )}

            {/* Carousel Manual Control Strip with Arrows & Dots */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.85rem', marginTop: '1.25rem' }}>
              <button
                onClick={() => setWhyIngredientsIndex((prev) => (prev === 0 ? whyIngredientsData.length - 1 : prev - 1))}
                aria-label="Previous ingredient"
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: '#FFF9F0',
                  border: '1px solid #DCC8AE',
                  color: '#32180D',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease'
                }}
              >
                <ChevronLeft size={18} />
              </button>

              <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center' }}>
                {whyIngredientsData.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setWhyIngredientsIndex(idx)}
                    style={{
                      width: whyIngredientsIndex === idx ? '24px' : '8px',
                      height: '8px',
                      borderRadius: '999px',
                      backgroundColor: whyIngredientsIndex === idx ? '#2F6B3A' : '#DCC8AE',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    aria-label={`Go to ingredient card ${idx + 1}`}
                  />
                ))}
              </div>

              <button
                onClick={() => setWhyIngredientsIndex((prev) => (prev + 1) % whyIngredientsData.length)}
                aria-label="Next ingredient"
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: '#FFF9F0',
                  border: '1px solid #DCC8AE',
                  color: '#32180D',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease'
                }}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </section>

        {/* 6. TRUST SECTION */}
        <section style={{ backgroundColor: 'transparent', width: '100%', padding: '6rem 0', borderTop: '1px solid #DCC8AE', borderBottom: '1px solid #DCC8AE', marginBottom: '6.5rem' }}>
          <div style={{ width: '100%', maxWidth: '900px', margin: '0 auto', textAlign: 'center', paddingLeft: '1.5rem', paddingRight: '1.5rem', boxSizing: 'border-box' }}>
            <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontFamily: 'var(--font-serif)', color: '#32180D', fontWeight: '850', marginBottom: '0.75rem' }}>
              Know What You Eat.
            </h2>
            <p style={{ fontSize: '1.02rem', color: '#654B38', lineHeight: '1.65', marginBottom: '3.5rem', fontWeight: '550' }}>
              Every ingredient has a place. Every number has a source.
            </p>

            <div className="know-what-you-eat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '1.25rem', textAlign: 'left' }}>
              <div style={{ backgroundColor: '#FFF9F0', border: '1px solid #DCC8AE', padding: '1.5rem', borderRadius: '18px' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: '850', color: '#2F6B3A', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Ingredient Transparency</h4>
                <p style={{ fontSize: '0.8rem', color: '#654B38', margin: 0, lineHeight: '1.5', fontWeight: '500' }}>Clear ingredient information on every pack.</p>
              </div>
              <div style={{ backgroundColor: '#FFF9F0', border: '1px solid #DCC8AE', padding: '1.5rem', borderRadius: '18px' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: '850', color: '#2F6B3A', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Nutritional Info</h4>
                <p style={{ fontSize: '0.8rem', color: '#654B38', margin: 0, lineHeight: '1.5', fontWeight: '500' }}>Per 100g nutritional values clearly listed.</p>
              </div>
              <div style={{ backgroundColor: '#FFF9F0', border: '1px solid #DCC8AE', padding: '1.5rem', borderRadius: '18px' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: '850', color: '#2F6B3A', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Product Specific Data</h4>
                <p style={{ fontSize: '0.8rem', color: '#654B38', margin: 0, lineHeight: '1.5', fontWeight: '500' }}>Specific calculations shown for individual bakes.</p>
              </div>
              <div style={{ backgroundColor: '#FFF9F0', border: '1px solid #DCC8AE', padding: '1.5rem', borderRadius: '18px' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: '850', color: '#2F6B3A', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Lab Reports</h4>
                <p style={{ fontSize: '0.8rem', color: '#654B38', margin: 0, lineHeight: '1.5', fontWeight: '500' }}>Downloadable certified reports available.</p>
              </div>
            </div>
          </div>
        </section>

        {/* 7. CTA SECTION */}
        <section style={{ width: '100%', maxWidth: '800px', margin: '0 auto', textAlign: 'center', paddingLeft: '1.5rem', paddingRight: '1.5rem', boxSizing: 'border-box' }}>
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontFamily: 'var(--font-serif)', color: '#32180D', fontWeight: '850', marginBottom: '1rem', letterSpacing: '-0.01em' }}>
            Better Ingredients. Thoughtful Bakes.
          </h2>
          <p style={{ fontSize: '1.02rem', color: '#654B38', lineHeight: '1.7', marginBottom: '2.5rem', maxWidth: '520px', margin: '0.5rem auto 2.5rem', fontWeight: '550' }}>
            Explore the MILASTY collection and discover your everyday wellness ritual.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              to="/shop"
              className="btn-primary"
              style={{
                padding: '0.95rem 2.25rem',
                fontSize: '0.92rem',
                backgroundColor: '#2F6B3A',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '999px',
                fontWeight: '850',
                textDecoration: 'none',
                cursor: 'pointer'
              }}
            >
              Explore Our Bakes
            </Link>
            <Link
              to="/our-story"
              className="btn-secondary"
              style={{
                padding: '0.95rem 2.25rem',
                fontSize: '0.92rem',
                border: '1.5px solid #32180D',
                color: '#32180D',
                borderRadius: '999px',
                fontWeight: '850',
                textDecoration: 'none',
                cursor: 'pointer',
                backgroundColor: '#FFF9F0'
              }}
            >
              Learn About MILASTY
            </Link>
          </div>
        </section>

        {/* Inject styling rules for mobile vs desktop views */}
        <style>{`
        @media (max-width: 820px) {
          .desktop-only-table {
            display: none !important;
          }
          .mobile-only-cards {
            display: grid !important;
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 0.85rem !important;
          }
        }
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
