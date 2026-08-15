import React from 'react';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { Coffee, Eye, Heart, Sparkles } from 'lucide-react';

const STEPS = [
  {
    num: '01',
    title: 'PAUSE',
    desc: 'Step away from digital screens and work notifications for 5 mindful minutes.',
    icon: Coffee,
  },
  {
    num: '02',
    title: 'NOTICE AROMA',
    desc: 'Inhale the nostalgic, rich aroma of slow-baked pure Desi Ghee & Cardamom.',
    icon: Eye,
  },
  {
    num: '03',
    title: 'BITE SLOWLY',
    desc: 'Experience the signature crumbly texture of roasted Bajra, Jowar, and Ragi.',
    icon: Heart,
  },
  {
    num: '04',
    title: 'PAIR & ENJOY',
    desc: 'Sip with warm ginger tea, milk, or your favorite evening infusion.',
    icon: Sparkles,
  },
];

export default function ProcessTimeline() {
  const containerRef = useScrollReveal({ threshold: 0.2 });

  return (
    <div ref={containerRef} className="reveal-fade-up" style={{ padding: '2rem 0' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.75rem',
          position: 'relative',
        }}
      >
        {STEPS.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div
              key={idx}
              className="glass-card"
              style={{
                padding: '1.75rem',
                backgroundColor: '#FFFFFF',
                borderRadius: '20px',
                border: '1px solid #E2D7C7',
                position: 'relative',
                transition: 'all 0.3s ease',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1.25rem',
                }}
              >
                <div
                  style={{
                    fontSize: '1.8rem',
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontWeight: '900',
                    color: '#C89B3C',
                  }}
                >
                  {step.num}
                </div>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    backgroundColor: '#F5EFE6',
                    color: '#5C4028',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon size={20} />
                </div>
              </div>

              <h4 style={{ fontSize: '1.1rem', color: '#4A3525', marginBottom: '0.5rem' }}>{step.title}</h4>
              <p style={{ fontSize: '0.88rem', color: '#6B5B52', lineHeight: '1.6' }}>{step.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
