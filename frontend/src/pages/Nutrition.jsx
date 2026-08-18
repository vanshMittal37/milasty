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

  const dailyProducts = products.filter((p) => p.category === 'daily');

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
        backgroundImage: 'url(/images/nutrition_background_image.jpeg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(135deg, rgba(20, 10, 5, 0.30) 0%, rgba(36, 19, 13, 0.22) 100%)',
        zIndex: 0,
        pointerEvents: 'none',
      }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
      
      {/* 1. HERO SECTION */}
      <section 
        style={{ 
          padding: '6rem 0 5rem', 
          textAlign: 'center', 
          maxWidth: '850px', 
          margin: '0 auto',
          paddingLeft: '1.5rem',
          paddingRight: '1.5rem'
        }}
      >
        <span 
          style={{ 
            fontSize: '0.76rem', 
            textTransform: 'uppercase', 
            letterSpacing: '0.12em', 
            color: 'var(--accent-gold)', 
            fontWeight: '800',
            backgroundColor: 'rgba(197, 160, 89, 0.08)',
            padding: '0.35rem 0.85rem',
            borderRadius: '999px',
            border: '1px solid rgba(197, 160, 89, 0.15)',
            display: 'inline-block',
            marginBottom: '1.25rem'
          }}
        >
          Nutrition • Complete Transparency
        </span>
        <h1 
          style={{ 
            fontSize: 'clamp(2.5rem, 5.5vw, 3.8rem)', 
            fontFamily: 'var(--font-serif)', 
            color: 'var(--primary-dark)', 
            fontWeight: '800',
            lineHeight: '1.15',
            margin: '0 0 1.25rem 0',
            letterSpacing: '-0.02em'
          }}
        >
          What's Inside Every Bite.
        </h1>
        <p 
          style={{ 
            fontSize: '1.15rem', 
            color: 'var(--text-muted)', 
            lineHeight: '1.7', 
            marginBottom: '1.5rem',
            fontWeight: '500'
          }}
        >
          Simple ingredients. Honest nutrition. Complete transparency.
        </p>
        <p 
          style={{ 
            fontSize: '0.94rem', 
            color: 'var(--text-muted)', 
            lineHeight: '1.65', 
            maxWidth: '620px', 
            margin: '0 auto 2.5rem' 
          }}
        >
          At MILASTY, we believe you deserve to know exactly what goes into your snacks. We provide complete ingredient lists, macro breakdowns, and verified lab test reports for our slow-baked millet cookies.
        </p>
        
        {/* Trust Indicators */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', justifyContent: 'center', fontSize: '0.86rem', fontWeight: '800', color: 'var(--primary-dark)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <CheckCircle2 size={16} color="var(--accent-olive)" />
            <span>Clean-label ingredients</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <CheckCircle2 size={16} color="var(--accent-olive)" />
            <span>Transparent nutrition</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <CheckCircle2 size={16} color="var(--accent-olive)" />
            <span>Lab-tested information</span>
          </div>
        </div>
      </section>

      {/* 2. NUTRITION HIGHLIGHTS */}
      <section style={{ maxWidth: '1200px', margin: '0 auto 5rem', paddingLeft: '1.5rem', paddingRight: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-serif)', color: 'var(--text-light)', fontWeight: '800', margin: 0 }}>
            What's Inside Every Bite
          </h2>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              onClick={() => scrollLeft(insideBiteRef)} 
              style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(245,235,221,0.2)', color: 'var(--text-light)', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <ChevronLeft size={16} />
            </button>
            <button 
              onClick={() => scrollRight(insideBiteRef)} 
              style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(245,235,221,0.2)', color: 'var(--text-light)', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div 
          ref={insideBiteRef}
          className="horizontal-scroll-container"
          style={{ 
            display: 'flex', 
            gap: '1.5rem', 
            overflowX: 'auto', 
            scrollBehavior: 'smooth',
            paddingBottom: '1rem'
          }}
        >
          
          <div 
            className="glass-card" 
            style={{ 
              padding: '2rem 1.75rem', 
              backgroundColor: 'transparent', 
              borderRadius: '20px', 
              border: '1px solid rgba(245, 235, 221, 0.25)',
              transition: 'all 0.25s ease',
              flexShrink: 0,
              width: '280px'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.borderColor = 'var(--accent-gold)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'rgba(245, 235, 221, 0.25)';
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '1.25rem', fontFamily: 'var(--font-serif)', color: 'var(--accent-gold)', fontWeight: '900' }}>01</span>
              <Sprout size={22} color="var(--accent-gold)" />
            </div>
            <h3 style={{ fontSize: '1.05rem', color: 'var(--text-light)', marginBottom: '0.5rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Ancient Millets</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.6', margin: 0, fontWeight: '500' }}>
              Made with traditional millet grains such as Bajra, Jowar and Ragi.
            </p>
          </div>

          <div 
            className="glass-card" 
            style={{ 
              padding: '2rem 1.75rem', 
              backgroundColor: 'transparent', 
              borderRadius: '20px', 
              border: '1px solid rgba(245, 235, 221, 0.25)',
              transition: 'all 0.25s ease',
              flexShrink: 0,
              width: '280px'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.borderColor = 'var(--accent-gold)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'rgba(245, 235, 221, 0.25)';
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '1.25rem', fontFamily: 'var(--font-serif)', color: 'var(--accent-gold)', fontWeight: '900' }}>02</span>
              <ShieldCheck size={22} color="var(--accent-gold)" />
            </div>
            <h3 style={{ fontSize: '1.05rem', color: 'var(--text-light)', marginBottom: '0.5rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Pure Desi Ghee</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.6', margin: 0, fontWeight: '500' }}>
              Made using the ingredients listed in each product's formulation.
            </p>
          </div>

          <div 
            className="glass-card" 
            style={{ 
              padding: '2rem 1.75rem', 
              backgroundColor: 'transparent', 
              borderRadius: '20px', 
              border: '1px solid rgba(245, 235, 221, 0.25)',
              transition: 'all 0.25s ease',
              flexShrink: 0,
              width: '280px'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.borderColor = 'var(--accent-gold)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'rgba(245, 235, 221, 0.25)';
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '1.25rem', fontFamily: 'var(--font-serif)', color: 'var(--accent-gold)', fontWeight: '900' }}>03</span>
              <Sparkles size={22} color="var(--accent-gold)" />
            </div>
            <h3 style={{ fontSize: '1.05rem', color: 'var(--text-light)', marginBottom: '0.5rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Unrefined Jaggery</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.6', margin: 0, fontWeight: '500' }}>
              Naturally sweetened with unrefined jaggery where specified.
            </p>
          </div>

          <div 
            className="glass-card" 
            style={{ 
              padding: '2rem 1.75rem', 
              backgroundColor: 'transparent', 
              borderRadius: '20px', 
              border: '1px solid rgba(245, 235, 221, 0.25)',
              transition: 'all 0.25s ease',
              flexShrink: 0,
              width: '280px'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.borderColor = 'var(--accent-gold)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'rgba(245, 235, 221, 0.25)';
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '1.25rem', fontFamily: 'var(--font-serif)', color: 'var(--accent-gold)', fontWeight: '900' }}>04</span>
              <Layers size={22} color="var(--accent-gold)" />
            </div>
            <h3 style={{ fontSize: '1.05rem', color: 'var(--text-light)', marginBottom: '0.5rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Full Transparency</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.6', margin: 0, fontWeight: '500' }}>
              Clear nutritional information for the products listed below.
            </p>
          </div>

        </div>
      </section>

      {/* 3. NUTRITION COMPARISON SECTION (Desktop view / Mobile option B) */}
      <section style={{ maxWidth: '1200px', margin: '0 auto 6.5rem', paddingLeft: '1.5rem', paddingRight: '1.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <h2 style={{ fontSize: '2.1rem', fontFamily: 'var(--font-serif)', color: 'var(--primary-dark)', fontWeight: '800', margin: '0 0 0.5rem 0' }}>
            Nutrition, At A Glance
          </h2>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', margin: 0, fontWeight: '500' }}>
            Compare the nutritional profile of our signature bakes.
          </p>
        </div>

        {/* DESKTOP TABLE VIEW */}
        {/* DESKTOP TABLE VIEW */}
        <div className="desktop-only-table" style={{ borderRadius: '24px', overflow: 'hidden', border: '1px solid rgba(245, 235, 221, 0.25)', backgroundColor: 'transparent', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', boxShadow: 'var(--shadow-md)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#24130D', color: '#FFFFFF' }}>
                <th style={{ padding: '2rem 1.5rem', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: '800', width: '22%' }}>Metric</th>
                {dailyProducts.map((p, idx) => (
                  <th key={idx} style={{ padding: '2rem 1.5rem', verticalAlign: 'top', width: '26%' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div style={{ width: '110px', height: '110px', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.15)' }}>
                        <img src={p.image} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      <div>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: '850', color: '#FFFFFF', margin: '0 0 0.25rem 0' }}>{p.title}</h4>
                        <p style={{ fontSize: '0.76rem', color: 'rgba(255, 255, 255, 0.75)', lineHeight: '1.4', margin: 0, fontWeight: '500', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.subtitle || p.description}</p>
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
                <td style={{ padding: '1.25rem 1.5rem', fontWeight: '850', color: 'var(--text-light)', fontSize: '0.88rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <Flame size={15} color="var(--accent-gold)" />
                    <span>Energy (kcal)</span>
                  </div>
                </td>
                {dailyProducts.map((p, idx) => (
                  <td key={idx} style={{ padding: '1.25rem 1.5rem', fontWeight: '800', color: 'var(--text-light)', fontSize: '0.9rem' }}>
                    {p.nutritionFacts.energyKcal} <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>per 100g</span>
                  </td>
                ))}
              </tr>

              <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'transparent' }}>
                <td style={{ padding: '1.25rem 1.5rem', fontWeight: '850', color: 'var(--text-light)', fontSize: '0.88rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <Activity size={15} color="var(--accent-gold)" />
                    <span>Protein (g)</span>
                  </div>
                </td>
                {dailyProducts.map((p, idx) => (
                  <td key={idx} style={{ padding: '1.25rem 1.5rem', fontWeight: '800', color: 'var(--text-light)', fontSize: '0.9rem' }}>
                    {p.nutritionFacts.proteinG}g
                  </td>
                ))}
              </tr>

              <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
                <td style={{ padding: '1.25rem 1.5rem', fontWeight: '850', color: 'var(--text-light)', fontSize: '0.88rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <Wheat size={15} color="var(--accent-gold)" />
                    <span>Carbohydrates (g)</span>
                  </div>
                </td>
                {dailyProducts.map((p, idx) => (
                  <td key={idx} style={{ padding: '1.25rem 1.5rem', fontWeight: '800', color: 'var(--text-light)', fontSize: '0.9rem' }}>
                    {p.nutritionFacts.carbohydrateG}g
                  </td>
                ))}
              </tr>

              <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'transparent' }}>
                <td style={{ padding: '1.25rem 1.5rem', fontWeight: '850', color: 'var(--text-light)', fontSize: '0.88rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <CheckCircle2 size={15} color="var(--accent-gold)" />
                    <span>Added Refined Sugar</span>
                  </div>
                </td>
                {dailyProducts.map((p, idx) => (
                  <td key={idx} style={{ padding: '1.25rem 1.5rem', fontWeight: '800', color: 'var(--accent-gold)', fontSize: '0.85rem' }}>
                    0g (100% Unrefined Jaggery)
                  </td>
                ))}
              </tr>

              <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
                <td style={{ padding: '1.25rem 1.5rem', fontWeight: '850', color: 'var(--text-light)', fontSize: '0.88rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <CheckCircle2 size={15} color="var(--accent-gold)" />
                    <span>Fat Type</span>
                  </div>
                </td>
                {dailyProducts.map((p, idx) => (
                  <td key={idx} style={{ padding: '1.25rem 1.5rem', fontWeight: '800', color: 'var(--accent-gold)', fontSize: '0.85rem' }}>
                    100% Pure Desi Ghee (0% Palm Oil)
                  </td>
                ))}
              </tr>

              <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'transparent' }}>
                <td style={{ padding: '1.25rem 1.5rem', fontWeight: '850', color: 'var(--text-light)', fontSize: '0.88rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <Sprout size={15} color="var(--accent-gold)" />
                    <span>Dietary Fiber (g)</span>
                  </div>
                </td>
                {dailyProducts.map((p, idx) => (
                  <td key={idx} style={{ padding: '1.25rem 1.5rem', fontWeight: '800', color: 'var(--text-light)', fontSize: '0.9rem' }}>
                    {p.nutritionFacts.dietaryFiberG}g
                  </td>
                ))}
              </tr>

              <tr style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
                <td style={{ padding: '1.5rem 1.5rem', fontWeight: '850', color: 'var(--text-light)', fontSize: '0.88rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <FileText size={15} color="var(--accent-gold)" />
                    <span>Official Lab Report</span>
                  </div>
                </td>
                {dailyProducts.map((p, idx) => (
                  <td key={idx} style={{ padding: '1.5rem 1.5rem' }}>
                    {p.labReportUrl ? (
                      <button
                        onClick={() => handleDownload(p.labReportUrl, `${p.title.replace(/\s+/g, '_')}_Lab_Report.pdf`)}
                        className="btn-primary"
                        style={{ 
                          padding: '0.5rem 1rem', 
                          fontSize: '0.8rem', 
                          fontWeight: '800', 
                          backgroundColor: 'var(--accent-gold)', 
                          color: '#24130D',
                          borderRadius: '10px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          textDecoration: 'none',
                          transition: 'all 0.2s',
                          cursor: 'pointer'
                        }}
                      >
                        <Download size={13} />
                        <span>Download Lab Report</span>
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>Unavailable</span>
                    )}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* MOBILE STACKED CARDS VIEW (Option B - displays on screens < 768px via inline media-query CSS) */}
        <div 
          className="mobile-only-cards horizontal-scroll-container" 
          style={{ 
            display: 'none', 
            flexDirection: 'row', 
            gap: '1.5rem', 
            overflowX: 'auto', 
            scrollBehavior: 'smooth', 
            paddingBottom: '1rem' 
          }}
        >
          {dailyProducts.map((p, idx) => (
            <div 
              key={idx} 
              className="glass-card" 
              style={{ 
                backgroundColor: 'transparent', 
                borderRadius: '24px', 
                border: '1px solid rgba(245, 235, 221, 0.25)', 
                overflow: 'hidden',
                boxShadow: 'var(--shadow-sm)',
                flexShrink: 0,
                width: '280px'
              }}
            >
              <div style={{ padding: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', borderBottom: '1px solid rgba(245, 235, 221, 0.25)' }}>
                <img src={p.image} alt={p.title} style={{ width: '70px', height: '70px', borderRadius: '10px', objectFit: 'cover' }} />
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: '850', color: 'var(--text-light)', margin: '0 0 0.15rem 0' }}>{p.title}</h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0, fontWeight: '500' }}>{p.subtitle || p.description}</p>
                </div>
              </div>

              <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: '700' }}>Energy</span>
                  <span style={{ color: 'var(--text-light)', fontWeight: '900' }}>{p.nutritionFacts.energyKcal} kcal</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: '700' }}>Protein</span>
                  <span style={{ color: 'var(--text-light)', fontWeight: '900' }}>{p.nutritionFacts.proteinG}g</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: '700' }}>Carbohydrates</span>
                  <span style={{ color: 'var(--text-light)', fontWeight: '900' }}>{p.nutritionFacts.carbohydrateG}g</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: '700' }}>Added Sugar</span>
                  <span style={{ color: 'var(--accent-gold)', fontWeight: '900' }}>0g (100% Jaggery)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: '700' }}>Fat Type</span>
                  <span style={{ color: 'var(--accent-gold)', fontWeight: '900' }}>100% Desi Ghee</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: '700' }}>Dietary Fiber</span>
                  <span style={{ color: 'var(--text-light)', fontWeight: '900' }}>{p.nutritionFacts.dietaryFiberG}g</span>
                </div>

                <div style={{ paddingTop: '1rem', borderTop: '1px solid rgba(245, 235, 221, 0.25)', marginTop: '0.5rem' }}>
                  {p.labReportUrl ? (
                    <button
                      onClick={() => handleDownload(p.labReportUrl, `${p.title.replace(/\s+/g, '_')}_Lab_Report.pdf`)}
                      className="btn-primary"
                      style={{ 
                        padding: '0.65rem 0', 
                        fontSize: '0.8rem', 
                        fontWeight: '800', 
                        backgroundColor: 'var(--accent-gold)', 
                        color: '#24130D',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.35rem',
                        textDecoration: 'none',
                        width: '100%',
                        cursor: 'pointer'
                      }}
                    >
                      <Download size={14} />
                      <span>Download Lab Report</span>
                    </button>
                  ) : (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '700', textAlign: 'center', display: 'block' }}>Report Unavailable</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

      </section>

      {/* 4. VISUAL STORYTELLING (From Grain To Bake) */}
      <section style={{ backgroundColor: 'rgba(20, 10, 5, 0.55)', padding: '6.5rem 0', borderTop: '1px solid rgba(245, 220, 180, 0.15)', borderBottom: '1px solid rgba(245, 220, 180, 0.15)', marginBottom: '6.5rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', paddingLeft: '1.5rem', paddingRight: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '4rem', alignItems: 'center' }}>
            
            {/* Left Column: Image */}
            <div style={{ borderRadius: '24px', overflow: 'hidden', border: '1px solid rgba(245, 220, 180, 0.18)' }}>
              <img
                src="https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=800&q=80"
                alt="Slow baked millet cookies pile"
                style={{ width: '100%', height: '420px', objectFit: 'cover', display: 'block', transition: 'transform 0.4s' }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
              />
            </div>

            {/* Right Column: Steps */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent-gold)', fontWeight: '800', display: 'block', marginBottom: '0.35rem' }}>Ingredient Philosophy</span>
                <h2 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-serif)', color: 'var(--primary-dark)', fontWeight: '800', margin: 0 }}>
                  From Grain To Bake
                </h2>
              </div>
              <p style={{ fontSize: '0.96rem', color: 'var(--text-muted)', lineHeight: '1.65', margin: 0, fontWeight: '500' }}>
                We work directly with domestic farming sources to identify wholesome ancient millets. We never refine, strip, or dilute our baking ingredients.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '0.5rem' }}>
                <div>
                  <h4 style={{ fontSize: '0.88rem', fontWeight: '850', color: 'var(--primary-dark)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    <span style={{ color: 'var(--accent-gold)' }}>01</span>
                    <span>Ancient Grains</span>
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, lineHeight: '1.5', fontWeight: '500' }}>Sourced native Bajra, Jowar, and Ragi flour.</p>
                </div>
                <div>
                  <h4 style={{ fontSize: '0.88rem', fontWeight: '850', color: 'var(--primary-dark)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    <span style={{ color: 'var(--accent-gold)' }}>02</span>
                    <span>Selected Ingredients</span>
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, lineHeight: '1.5', fontWeight: '500' }}>Pure cow Desi Ghee & unrefined organic jaggery.</p>
                </div>
                <div>
                  <h4 style={{ fontSize: '0.88rem', fontWeight: '850', color: 'var(--primary-dark)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    <span style={{ color: 'var(--accent-gold)' }}>03</span>
                    <span>Slow Baking</span>
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, lineHeight: '1.5', fontWeight: '500' }}>Slow-baked in temperature-controlled oven bakes.</p>
                </div>
                <div>
                  <h4 style={{ fontSize: '0.88rem', fontWeight: '850', color: 'var(--primary-dark)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    <span style={{ color: 'var(--accent-gold)' }}>04</span>
                    <span>Finished Bake</span>
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, lineHeight: '1.5', fontWeight: '500' }}>A crumbly, delicious, clean millet cookie.</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 5. EDUCATIONAL SECTION (Why Ghee, Jaggery, Millets) */}
      <section style={{ maxWidth: '1200px', margin: '0 auto 6.5rem', paddingLeft: '1.5rem', paddingRight: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '4.5rem' }}>
          <div>
            <span className="badge-pill badge-gold" style={{ marginBottom: '0.5rem', display: 'inline-block' }}>Clean Sourcing</span>
            <h2 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-serif)', color: 'var(--text-light)', fontWeight: '800', margin: 0 }}>
              Why These Ingredients Matter
            </h2>
            <p style={{ fontSize: '0.96rem', color: 'var(--text-muted)', margin: '0.5rem 0 0 0', fontWeight: '500' }}>
              We believe transparency starts with understanding what goes into your food.
            </p>
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
            gap: '2.5rem', 
            overflowX: 'auto', 
            scrollBehavior: 'smooth',
            paddingBottom: '1.5rem'
          }}
        >
          
          <div className="glass-card" style={{ padding: '2.5rem 2.25rem', backgroundColor: 'transparent', borderRadius: '24px', border: '1px solid rgba(245, 235, 221, 0.25)', flexShrink: 0, width: '340px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '1.5rem', fontFamily: 'var(--font-serif)', color: 'var(--accent-gold)', fontWeight: '900' }}>01</span>
              <Sparkles size={28} color="var(--accent-gold)" />
            </div>
            <h3 style={{ fontSize: '1.25rem', color: 'var(--text-light)', marginBottom: '0.75rem', fontFamily: 'var(--font-serif)', fontWeight: '800' }}>Why Pure Desi Ghee?</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: '1.7', margin: 0, fontWeight: '500' }}>
              Unlike industrial palm oil and hydrogenated fats used in commercial biscuits, pure Desi Ghee provides butyric acid, supporting gut lining integrity and enhancing bioavailability of fat-soluble vitamins (A, D, E, K).
            </p>
          </div>

          <div className="glass-card" style={{ padding: '2.5rem 2.25rem', backgroundColor: 'transparent', borderRadius: '24px', border: '1px solid rgba(245, 235, 221, 0.25)', flexShrink: 0, width: '340px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '1.5rem', fontFamily: 'var(--font-serif)', color: 'var(--accent-gold)', fontWeight: '900' }}>02</span>
              <Award size={28} color="var(--accent-gold)" />
            </div>
            <h3 style={{ fontSize: '1.25rem', color: 'var(--text-light)', marginBottom: '0.75rem', fontFamily: 'var(--font-serif)', fontWeight: '800' }}>Why Unrefined Organic Jaggery?</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: '1.7', margin: 0, fontWeight: '500' }}>
              Refined white sugar strips away minerals causing rapid blood glucose spikes. Organic jaggery retains essential trace elements like Iron, Magnesium, and Potassium, ensuring sustained clean energy.
            </p>
          </div>

          <div className="glass-card" style={{ padding: '2.5rem 2.25rem', backgroundColor: 'transparent', borderRadius: '24px', border: '1px solid rgba(245, 235, 221, 0.25)', flexShrink: 0, width: '340px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '1.5rem', fontFamily: 'var(--font-serif)', color: 'var(--accent-gold)', fontWeight: '900' }}>03</span>
              <ShieldCheck size={28} color="var(--accent-gold)" />
            </div>
            <h3 style={{ fontSize: '1.25rem', color: 'var(--text-light)', marginBottom: '0.75rem', fontFamily: 'var(--font-serif)', fontWeight: '800' }}>Why Ancient Millets over Maida?</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: '1.7', margin: 0, fontWeight: '500' }}>
              Refined Maida creates inflammatory mucus in the digestive tract. Millets (Bajra, Jowar, Ragi) deliver rich dietary fiber, naturally slow digestion, and keep you feeling full for longer.
            </p>
          </div>

        </div>
      </section>

      {/* 6. TRUST SECTION */}
      <section style={{ backgroundColor: 'transparent', padding: '6rem 0', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', marginBottom: '6.5rem' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center', paddingLeft: '1.5rem', paddingRight: '1.5rem' }}>
          <h2 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-serif)', color: 'var(--text-light)', fontWeight: '800', marginBottom: '0.75rem' }}>
            Know What You Eat.
          </h2>
          <p style={{ fontSize: '1rem', color: 'var(--text-muted)', lineHeight: '1.65', marginBottom: '3.5rem', fontWeight: '500' }}>
            Every ingredient has a place. Every number has a source.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '2rem', textAlign: 'left' }}>
            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: '850', color: 'var(--text-light)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Ingredient Transparency</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, lineHeight: '1.5', fontWeight: '500' }}>Clear ingredient information on every pack.</p>
            </div>
            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: '850', color: 'var(--text-light)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Nutritional Info</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, lineHeight: '1.5', fontWeight: '500' }}>Per 100g nutritional values clearly listed.</p>
            </div>
            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: '850', color: 'var(--text-light)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Product Specific Data</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, lineHeight: '1.5', fontWeight: '500' }}>Specific calculations shown for individual bakes.</p>
            </div>
            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: '850', color: 'var(--text-light)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Lab Reports</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, lineHeight: '1.5', fontWeight: '500' }}>Downloadable certified reports available.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. CTA SECTION */}
      <section style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center', paddingLeft: '1.5rem', paddingRight: '1.5rem' }}>
        <h2 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-serif)', color: 'var(--text-light)', fontWeight: '800', marginBottom: '1rem', letterSpacing: '-0.01em' }}>
          Better Ingredients. Thoughtful Bakes.
        </h2>
        <p style={{ fontSize: '1rem', color: 'var(--text-muted)', lineHeight: '1.65', marginBottom: '2.5rem', maxWidth: '520px', margin: '0.5rem auto 2.5rem', fontWeight: '500' }}>
          Explore the MILASTY collection and discover your everyday wellness ritual.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link 
            to="/shop" 
            className="btn-primary" 
            style={{ 
              padding: '0.95rem 2.25rem', 
              fontSize: '0.9rem', 
              backgroundColor: 'var(--accent-gold)', 
              color: '#24130D', 
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
              fontSize: '0.9rem', 
              borderColor: 'var(--accent-gold)', 
              color: 'var(--accent-gold)', 
              borderRadius: '999px', 
              fontWeight: '850', 
              textDecoration: 'none',
              cursor: 'pointer',
              backgroundColor: 'transparent'
            }}
          >
            Learn About MILASTY
          </Link>
        </div>
      </section>

      {/* Inject styling rules for mobile vs desktop views */}
      <style>{`
        @media (max-width: 767px) {
          .desktop-only-table {
            display: none !important;
          }
          .mobile-only-cards {
            display: flex !important;
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
