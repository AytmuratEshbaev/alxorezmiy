'use client';
import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { getLocalizedField } from '@/lib/utils';
import { transformImage } from '@/lib/imagekit';
import type { GalleryItem, Locale } from '@/types';

interface Props {
  items: GalleryItem[];
  locale: Locale;
}

export default function GalleryGrid({ items, locale }: Props) {
  const t = useTranslations();
  const [filter, setFilter] = useState<string>('all');

  const filtered = useMemo(() => {
    if (filter === 'all') return items;
    return items.filter((p) => p.category === filter);
  }, [items, filter]);

  const filters = [
    { value: 'all', label: t('common.all') },
    { value: 'building', label: t('gallery_page.filter_building') },
    { value: 'lessons', label: t('gallery_page.filter_lessons') },
    { value: 'sports', label: t('gallery_page.filter_sports') },
    { value: 'events', label: t('gallery_page.filter_events') }
  ];

  return (
    <>
      <div className="flex-between" style={{ marginBottom: 'var(--space-xl)', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
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

      <div className="grid grid-3">
        {filtered.length === 0 ? (
          <div
            role="status"
            style={{
              gridColumn: '1/-1',
              textAlign: 'center',
              color: 'var(--ink-3)',
              padding: 'var(--s-12) var(--s-4)'
            }}
          >
            <div aria-hidden="true" style={{ fontSize: '2.5rem', marginBottom: 'var(--s-3)', opacity: 0.5 }}>🖼️</div>
            <p style={{ margin: 0, fontWeight: 500, color: 'var(--ink-2)' }}>
              {t('gallery_page_extra.empty_title')}
            </p>
            <p style={{ margin: 'var(--s-2) 0 0', fontSize: '0.9375rem' }}>
              {t('gallery_page_extra.empty_text')}
            </p>
          </div>
        ) : (
          filtered.map((item) => {
            const caption = getLocalizedField(item, 'caption', locale);
            const optimized = transformImage(item.url, { width: 600 });
            const fullSize = transformImage(item.url, { width: 1600 });
            const altText = caption || t('gallery_page.title');
            return (
              <a
                key={item.id}
                href={fullSize}
                target="_blank"
                rel="noopener noreferrer"
                className="gallery-item"
                aria-label={`${t('gallery_page_extra.open_image')}: ${altText}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={optimized} alt={altText} loading="lazy" />
                {caption && <div className="gallery-caption">{caption}</div>}
              </a>
            );
          })
        )}
      </div>
    </>
  );
}
