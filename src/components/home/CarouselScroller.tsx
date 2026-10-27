'use client';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import Icon from '@/components/ui/Icon';

/**
 * Gorizontal aylantiriladigan trek: klaviatura bilan fokuslanadi (strelkalar ishlaydi),
 * oldingi/keyingi tugmalari bir karta kengligida suradi va chekkalarda o'chadi.
 */
export default function CarouselScroller({
  children,
  label,
  prevLabel,
  nextLabel,
}: {
  children: ReactNode;
  label: string;
  prevLabel: string;
  nextLabel: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const update = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 2);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 2);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    update();
    el.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    return () => {
      el.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [update]);

  function scrollByCard(dir: 1 | -1) {
    const el = trackRef.current;
    if (!el) return;
    const card = el.firstElementChild as HTMLElement | null;
    const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
    const step = card ? card.getBoundingClientRect().width + gap : el.clientWidth * 0.8;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollBy({ left: dir * step, behavior: reduce ? 'auto' : 'smooth' });
  }

  const single = atStart && atEnd;

  return (
    <div className="carousel">
      <div
        ref={trackRef}
        className="carousel-track"
        id="achievementsCarousel"
        tabIndex={0}
        role="region"
        aria-roledescription="carousel"
        aria-label={label}
      >
        {children}
      </div>
      {!single && (
        <div className="carousel-controls">
          <button
            type="button"
            className="carousel-btn"
            onClick={() => scrollByCard(-1)}
            disabled={atStart}
            aria-label={prevLabel}
            aria-controls="achievementsCarousel"
          >
            <Icon name="chevron-left" size={20} />
          </button>
          <button
            type="button"
            className="carousel-btn"
            onClick={() => scrollByCard(1)}
            disabled={atEnd}
            aria-label={nextLabel}
            aria-controls="achievementsCarousel"
          >
            <Icon name="chevron-right" size={20} />
          </button>
        </div>
      )}
    </div>
  );
}
