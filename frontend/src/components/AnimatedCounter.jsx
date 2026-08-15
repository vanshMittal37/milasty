import React, { useState, useEffect } from 'react';
import { useScrollReveal } from '../hooks/useScrollReveal';

export default function AnimatedCounter({ targetValue, prefix = '', suffix = '', duration = 1500, label, subtext }) {
  const [count, setCount] = useState(0);
  const elementRef = useScrollReveal({ threshold: 0.3 });

  useEffect(() => {
    let startTime;
    let animationFrame;
    const target = parseFloat(targetValue.toString().replace(/[^0-9.]/g, '')) || 100;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // Ease out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(easeOut * target));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        setCount(target);
      }
    };

    const currentEl = elementRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          animationFrame = requestAnimationFrame(animate);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    if (currentEl) {
      observer.observe(currentEl);
    }

    return () => {
      cancelAnimationFrame(animationFrame);
      observer.disconnect();
    };
  }, [targetValue, duration, elementRef]);

  return (
    <div ref={elementRef} className="reveal-fade-up" style={{ textAlign: 'center', padding: '1rem' }}>
      <div style={{ fontSize: '2.5rem', fontFamily: "'Playfair Display', Georgia, serif", fontWeight: '900', color: '#4A3525', lineHeight: '1' }}>
        {prefix}{count.toLocaleString('en-IN')}{suffix}
      </div>
      {label && <div style={{ fontSize: '1rem', fontWeight: '700', color: '#5C4028', marginTop: '0.4rem' }}>{label}</div>}
      {subtext && <div style={{ fontSize: '0.82rem', color: '#6B5B52', marginTop: '0.2rem' }}>{subtext}</div>}
    </div>
  );
}
