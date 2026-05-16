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
          <div
            role="status"
            style={{ textAlign: 'center', color: 'var(--ink-3)', padding: 'var(--s-12) var(--s-4)' }}
          >
            <div aria-hidden="true" style={{ fontSize: '2.5rem', marginBottom: 'var(--s-3)', opacity: 0.5 }}>❓</div>
            <p style={{ margin: 0, fontWeight: 500, color: 'var(--ink-2)' }}>
              {t('faq_page_extra.empty_title')}
            </p>
            <p style={{ margin: 'var(--s-2) 0 0', fontSize: '0.9375rem' }}>
              {t('faq_page_extra.empty_text')}
            </p>
          </div>
        ) : (
          filtered.map((item) => {
            const open = openId === item.id;
            const panelId = `faq-panel-${item.id}`;
            const buttonId = `faq-button-${item.id}`;
            return (
              <div className={`accordion-item${open ? ' active' : ''}`} key={item.id}>
                <button
                  type="button"
                  id={buttonId}
                  className="accordion-header"
                  onClick={() => setOpenId(open ? null : item.id)}
                  aria-expanded={open}
                  aria-controls={panelId}
                  style={{ width: '100%', textAlign: 'left' }}
                >
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>
                    {getLocalizedField(item, 'question', locale)}
                  </h3>
                  <span className="accordion-icon" aria-hidden="true">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </span>
                </button>
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  className="accordion-body"
                  style={{ maxHeight: open ? 1000 : 0 }}
                >
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
