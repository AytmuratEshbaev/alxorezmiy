'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Adds `visible` class to elements with `.animate-on-scroll`, `.animate-scale`,
 * `.animate-slide-left`, `.animate-slide-right` when they enter the viewport.
 *
 * Replaces the equivalent IntersectionObserver block from the legacy `js/main.js`.
 * Re-runs on route change so newly mounted elements get observed too.
 */
export default function ScrollAnimations() {
  const pathname = usePathname();

  useEffect(() => {
    const selector =
      '.animate-on-scroll, .animate-scale, .animate-slide-left, .animate-slide-right';
    const elements = document.querySelectorAll<HTMLElement>(selector);
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
    );

    for (const el of elements) {
      // If element is already in view at mount (e.g. above-the-fold hero on
      // first paint), mark it visible immediately so it doesn't stay hidden
      // when IntersectionObserver fires after a delay.
      const rect = el.getBoundingClientRect();
      const inView = rect.top < window.innerHeight && rect.bottom > 0;
      if (inView) {
        el.classList.add('visible');
      } else {
        observer.observe(el);
      }
    }

    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
