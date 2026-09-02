import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, ShieldCheck, Heart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { initialProducts } from '../data/seedData';

export default function InteractiveServiceShowcase({ products = initialProducts }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const { addToCart } = useCart();

  const dailyItems = products.filter((p) => p.category === 'daily' || p.category === 'starter').slice(0, 4);
  const activeProduct = dailyItems[activeIdx] || dailyItems[0];
  const selectedVariant = activeProduct?.variants?.[0] || {};

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '3rem', alignItems: 'center' }}>
      {/* Left Column: Interactive List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {dailyItems.map((item, idx) => {
          const isSelected = activeIdx === idx;
          return (
            <div
              key={item._id || item.slug}
              onMouseEnter={() => setActiveIdx(idx)}
              onClick={() => setActiveIdx(idx)}
              data-cursor="VIEW"
              style={{
                padding: '1.5rem',
                borderRadius: '16px',
                backgroundColor: isSelected ? '#FFFFFF' : 'rgba(255, 255, 255, 0.4)',
                border: isSelected ? '2px solid #5C4028' : '1px solid rgba(226, 215, 199, 0.6)',
                boxShadow: isSelected ? '0 12px 28px rgba(74, 53, 37, 0.12)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <span
                  style={{
                    fontSize: '1.4rem',
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontWeight: '900',
                    color: isSelected ? '#C89B3C' : '#99887A',
                    transition: 'color 0.3s ease',
                  }}
                >
                  0{idx + 1}
                </span>
                <div>
                  <h3 style={{ fontSize: '1.2rem', color: '#4A3525', marginBottom: '0.2rem' }}>{item.title}</h3>
                  <p style={{ fontSize: '0.85rem', color: '#6B5B52' }}>{item.subtitle}</p>
                </div>
              </div>

              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: isSelected ? '#5C4028' : '#F5EFE6',
                  color: isSelected ? '#FFFFFF' : '#4A3525',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s ease',
                  transform: isSelected ? 'translateX(4px)' : 'translateX(0)',
                }}
              >
                <ArrowRight size={18} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Right Column: Dynamic Interactive Card */}
      <div
        className="glass-card animate-fade-in"
        style={{
          padding: '2rem',
          backgroundColor: '#FFFFFF',
          borderRadius: '24px',
          border: '1.5px solid #E2D7C7',
          boxShadow: '0 20px 40px rgba(74, 53, 37, 0.15)',
        }}
      >
        <div style={{ position: 'relative', height: '280px', borderRadius: '16px', overflow: 'hidden', marginBottom: '1.5rem', backgroundColor: '#F5EFE6' }}>
          <img
            src={activeProduct.image}
            alt={activeProduct.title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform 0.5s ease',
            }}
          />
          <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {activeProduct.badges?.slice(0, 2).map((b, i) => (
              <span key={i} className="badge-pill badge-gold">
                {b}
              </span>
            ))}
          </div>
        </div>

        <h3 style={{ fontSize: '1.5rem', color: '#4A3525', marginBottom: '0.5rem' }}>{activeProduct.title}</h3>
        <p style={{ color: '#6B5B52', fontSize: '0.92rem', lineHeight: '1.6', marginBottom: '1.25rem' }}>
          {activeProduct.description}
        </p>

        {/* Benefits bullets */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {activeProduct.benefits?.slice(0, 3).map((ben, i) => (
            <span key={i} style={{ fontSize: '0.78rem', backgroundColor: '#F5EFE6', color: '#274C37', fontWeight: '600', padding: '0.3rem 0.65rem', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
              <ShieldCheck size={13} color="#274C37" />
              <span>{ben}</span>
            </span>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '1rem', borderTop: '1px solid #E2D7C7' }}>
          <div>
            <div style={{ fontSize: '0.78rem', color: '#6B5B52' }}>Pack Price</div>
            <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#4A3525' }}>₹{selectedVariant.price}</div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Link to={`/shop/product/${activeProduct.slug}`} className="btn-secondary" style={{ padding: '0.65rem 1rem', fontSize: '0.85rem' }}>
              View Details
            </Link>
            <button onClick={() => addToCart(activeProduct, selectedVariant)} className="btn-primary" style={{ padding: '0.65rem 1.1rem', fontSize: '0.85rem' }}>
              <Sparkles size={16} />
              <span>Add to Cart</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
