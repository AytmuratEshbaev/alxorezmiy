'use client';
import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { fallbackLang, getLocalizedField } from '@/lib/utils';
import EmptyState from '@/components/ui/EmptyState';
import type { FaqItem, Locale } from '@/types';

interface Props {
  items: FaqItem[];
  locale: Locale;
}

// React 18 tiplarida `inert` yo'q — yopiq javob AT daraxtidan va tab tartibidan chiqariladi.
const INERT = { inert: '' } as unknown as Record<string, never>;

type Filter = 'all' | 'admission' | 'education' | 'general';

export default function FaqAccordion({ items, locale }: Props) {
  const t = useTranslations();
  const [filter, setFilter] = useState<Filter>('all');
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (filter === 'all') return items;
    return items.filter((f) => f.category === filter);
  }, [items, filter]);

  const filters: Array<{ value: Filter; label: string }> = [
    { value: 'all', label: t('common.all') },
    { value: 'admission', label: t('faq_page.filter_admission') },
    { value: 'education', label: t('faq_page.filter_education') },
    { value: 'general', label: t('faq_page.filter_general') },
  ];

  return (
    <>
      <div className="faq-toolbar">
        <h2 id="faq-all-heading">{t('faq_page.all_questions')}</h2>
        <div className="filter-group" role="group" aria-labelledby="faq-all-heading">
          {filters.map((f) => (
            <button
              key={f.value}
              type="button"
              className={`filter-btn${filter === f.value ? ' active' : ''}`}
              aria-pressed={filter === f.value}
              onClick={() => setFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="accordion">
        {filtered.length === 0 ? (
          <EmptyState
            compact
            icon="question"
            title={t('faq_page_extra.empty_title')}
            text={t('faq_page_extra.empty_text')}
          />
        ) : (
          filtered.map((item) => {
            const open = openId === item.id;
            const panelId = `faq-panel-${item.id}`;
            const buttonId = `faq-button-${item.id}`;
            return (
              <div className={`accordion-item${open ? ' active' : ''}`} key={item.id}>
                <h3 className="accordion-heading">
                  <button
                    type="button"
                    id={buttonId}
                    className="accordion-header"
                    onClick={() => setOpenId(open ? null : item.id)}
                    aria-expanded={open}
                    aria-controls={panelId}
                  >
                    <span
                      className="accordion-question"
                      lang={fallbackLang(item, 'question', locale)}
                    >
                      {getLocalizedField(item, 'question', locale)}
                    </span>
                    <span className="accordion-icon" aria-hidden="true">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </span>
                  </button>
                </h3>
                <div
                  id={panelId}
                  className="accordion-body"
                  {...(open ? {} : INERT)}
                >
                  <div className="accordion-body-content">
                    <p className="accordion-answer" lang={fallbackLang(item, 'answer', locale)}>
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
