'use client';
import { useEffect, useRef } from 'react';
import { useLocale } from 'next-intl';
import { intlLocale } from '@/lib/utils';

export interface StatItem {
  key: string;
  label: string;
  count: number;
  suffix?: string;
}

/**
 * Raqamlar serverda haqiqiy qiymat bilan render qilinadi (JS'siz ham, qidiruv tizimlari uchun
 * ham to'g'ri). Mount'dan keyin faqat hali ko'rinmagan kartalar 0 ga tushirilib, ekranga
 * kirganda sanab chiqiladi; reduced-motion'da animatsiya yo'q.
 */
export default function StatsCounter({ stats }: { stats: StatItem[] }) {
  const locale = useLocale();
  const refs = useRef<Array<HTMLSpanElement | null>>([]);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const fmt = new Intl.NumberFormat(intlLocale(locale));
    const rafs = new Set<number>();
    const els = refs.current.slice();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target as HTMLSpanElement;
          observer.unobserve(el);
          const target = Number(el.dataset.count);
          const duration = 1600;
          const startTime = performance.now();
          const update = (now: number) => {
            const progress = Math.min((now - startTime) / duration, 1);
            const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
            el.textContent = fmt.format(Math.round(target * eased));
            if (progress < 1) {
              const id = requestAnimationFrame(update);
              rafs.add(id);
            }
          };
          rafs.add(requestAnimationFrame(update));
        }
      },
      { threshold: 0.3 }
    );
    for (const el of els) {
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      const inView = rect.top < window.innerHeight && rect.bottom > 0;
      // Ko'rinib turgan raqamni "sakratmaymiz" — faqat ekrandan tashqaridagilar animatsiyalanadi.
      if (inView) continue;
      el.textContent = fmt.format(0);
      observer.observe(el);
    }
    return () => {
      observer.disconnect();
      rafs.forEach((id) => cancelAnimationFrame(id));
      // Unmount/qayta ishga tushishda haqiqiy qiymatni tiklaymiz.
      for (const el of els) {
        if (el) el.textContent = fmt.format(Number(el.dataset.count));
      }
    };
  }, [locale]);

  if (stats.length === 0) return null;
  const fmt = new Intl.NumberFormat(intlLocale(locale));

  return (
    <section className="stats-section">
      <div className="container">
        <div className={`grid grid-${Math.max(2, Math.min(stats.length, 4))}`}>
          {stats.map((s, i) => (
            <div
              key={s.key}
              className={`stat-card animate-on-scroll${i > 0 ? ` animate-delay-${i}` : ''}`}
            >
              <div className="stat-number">
                <span
                  ref={(el) => {
                    refs.current[i] = el;
                  }}
                  data-count={s.count}
                  suppressHydrationWarning
                >
                  {fmt.format(s.count)}
                </span>
                {s.suffix}
              </div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
