'use client';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

export default function BackToTop() {
  const t = useTranslations();
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <button
      type="button"
      className={`back-to-top${visible ? ' visible' : ''}`}
      aria-label={t('a11y.back_to_top')}
      onClick={() => {
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
        // Fokus sahifa boshiga — klaviatura foydalanuvchisi pastda "yo'qolib" qolmasin.
        document.getElementById('main-content')?.focus({ preventScroll: true });
      }}
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <path d="M18 15l-6-6-6 6" />
      </svg>
    </button>
  );
}
