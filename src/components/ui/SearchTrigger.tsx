'use client';
import { useState, useEffect, lazy, Suspense } from 'react';
import { useTranslations } from 'next-intl';

const SearchModal = lazy(() => import('./SearchModal'));

export default function SearchTrigger() {
  const t = useTranslations();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      <button
        type="button"
        className="search-trigger"
        aria-label={t('a11y.search')}
        title={t('a11y.search')}
        onClick={() => setOpen(true)}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7.5" />
          <line x1="20.5" y1="20.5" x2="16.5" y2="16.5" />
        </svg>
      </button>
      {open && (
        <Suspense fallback={null}>
          <SearchModal onClose={() => setOpen(false)} />
        </Suspense>
      )}
    </>
  );
}
