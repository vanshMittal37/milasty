import { useEffect, useRef } from 'react';

export function useScrollReveal(options = {}) {
  const elementRef = useRef(null);

  useEffect(() => {
    // Immediately ensure element is visible on mount so content is present in DOM right away
    if (elementRef.current) {
      elementRef.current.classList.add('is-visible');
    }

    // Respect prefers-reduced-motion
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            if (options.once !== false) {
              observer.unobserve(entry.target);
            }
          }
        });
      },
      {
        threshold: options.threshold || 0,
        rootMargin: options.rootMargin || '300px 0px 300px 0px',
      }
    );

    const currentEl = elementRef.current;
    if (currentEl) {
      observer.observe(currentEl);
    }

    return () => {
      if (currentEl) {
        observer.unobserve(currentEl);
      }
    };
  }, [options]);

  return elementRef;
}
