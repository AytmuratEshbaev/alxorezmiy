'use client';
import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { getLocalizedField } from '@/lib/utils';
import type { FaqItem, Locale } from '@/types';

interface Props {
  items: FaqItem[];
  locale: Locale;
}

export default function FaqAccordion({ items, locale }: Props) {
  const t = useTranslations();
  const [filter, setFilter] = useState<'all' | 'admission' | 'education' | 'general'>('all');
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (filter === 'all') return items;
    return items.filter((f) => f.category === filter);
  }, [items, filter]);

  const filters: Array<{ value: typeof filter; label: string }> = [
    { value: 'all', label: t('common.all') },
    { value: 'admission', label: t('faq_page.filter_admission') },
    { value: 'education', label: t('faq_page.filter_education') },
    { value: 'general', label: t('faq_page.filter_general') }
  ];

  return (
    <>
      <div className="flex-between" style={{ marginBottom: 'var(--space-xl)', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
        <h2 style={{ fontSize: '1.5rem' }}>{t('faq_page.all_questions')}</h2>
        <div className="filter-group" style={{ marginBottom: 0 }}>
          {filters.map((f) => (
            <button
              key={f.value}
              type="button"
              className={`filter-btn${filter === f.value ? ' active' : ''}`}
              onClick={() => setFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="accordion">
        {filtered.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: 60 }}>{t('faq_page.empty')}</p>
        ) : (
          filtered.map((item) => {
            const open = openId === item.id;
            return (
              <div className={`accordion-item${open ? ' active' : ''}`} key={item.id}>
                <div
                  className="accordion-header"
                  onClick={() => setOpenId(open ? null : item.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setOpenId(open ? null : item.id);
                    }
                  }}
                >
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>
                    {getLocalizedField(item, 'question', locale)}
                  </h3>
                  <span className="accordion-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </span>
                </div>
                <div className="accordion-body" style={{ maxHeight: open ? 1000 : 0 }}>
                  <div className="accordion-body-content">
                    <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                      {getLocalizedField(item, 'answer', locale)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
