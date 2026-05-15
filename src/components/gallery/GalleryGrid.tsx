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
          <p style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--text-tertiary)', padding: 60 }}>
            {t('gallery_page.empty')}
          </p>
        ) : (
          filtered.map((item) => {
            const caption = getLocalizedField(item, 'caption', locale);
            const optimized = transformImage(item.url, { width: 600 });
            return (
              <div className="gallery-item" key={item.id} style={{ cursor: 'pointer' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={optimized} alt={caption} loading="lazy" />
                {caption && <div className="gallery-caption">{caption}</div>}
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
