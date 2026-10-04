import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

export default function FaqAccordion({ faqs }) {
  const [openIndex, setOpenIndex] = useState(0);

  const toggle = (idx) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      {faqs.map((faq, idx) => (
        <div
          key={idx}
          className="glass-card card-warm-beige"
          style={{
            border: 'var(--card-border, 1px solid #E3D6BF)',
            borderRadius: '12px',
            backgroundColor: 'var(--card-bg, #F5EEE1)',
            overflow: 'hidden',
            transition: 'all 0.2s ease',
          }}
        >
          <button
            onClick={() => toggle(idx)}
            style={{
              width: '100%',
              padding: '1.15rem 1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              textAlign: 'left',
              backgroundColor: openIndex === idx ? 'var(--card-inner-bg, #FBF7EF)' : 'var(--card-bg, #F5EEE1)',
              color: 'var(--text-heading, #2B2B2B)',
              fontWeight: '600',
              fontSize: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <HelpCircle size={18} color="#C89B3C" />
              <span>{faq.question}</span>
            </div>
            <ChevronDown
              size={18}
              color="#5C4028"
              style={{
                transform: openIndex === idx ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s ease',
              }}
            />
          </button>

          {openIndex === idx && (
            <div
              style={{
                padding: '1.25rem 1.5rem',
                fontSize: '0.92rem',
                color: '#6B5B52',
                lineHeight: '1.7',
                borderTop: '1px solid #E2D7C7',
                backgroundColor: '#FDFBF7',
              }}
            >
              {faq.answer}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
