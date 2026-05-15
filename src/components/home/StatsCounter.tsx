'use client';
import { useEffect, useRef } from 'react';

interface StatItem {
  label: string;
  count: number;
  suffix?: string;
}

export default function StatsCounter({ stats }: { stats: StatItem[] }) {
  const refs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target as HTMLDivElement;
          const target = Number(el.dataset.count);
          const suffix = el.dataset.suffix || '';
          const duration = 2000;
          const startTime = performance.now();
          const update = (now: number) => {
            const progress = Math.min((now - startTime) / duration, 1);
            const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
            el.textContent = Math.floor(target * eased).toLocaleString() + suffix;
            if (progress < 1) requestAnimationFrame(update);
          };
          requestAnimationFrame(update);
          observer.unobserve(el);
        });
      },
      { threshold: 0.3 }
    );
    refs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section className="stats-section">
      <div className="container">
        <div className="grid grid-4">
          {stats.map((s, i) => (
            <div key={i} className={`stat-card animate-on-scroll${i > 0 ? ` animate-delay-${i}` : ''}`}>
              <div
                ref={(el) => {
                  refs.current[i] = el;
                }}
                className="stat-number"
                data-count={s.count}
                data-suffix={s.suffix || ''}
              >
                0
              </div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
