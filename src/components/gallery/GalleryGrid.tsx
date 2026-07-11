'use client';
import Image from 'next/image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { getLocalizedField } from '@/lib/utils';
import { transformImage } from '@/lib/imagekit';
import Icon from '@/components/ui/Icon';
import type { GalleryItem, Locale } from '@/types';

interface Props {
  items: GalleryItem[];
  locale: Locale;
}

export default function GalleryGrid({ items, locale }: Props) {
  const t = useTranslations();
  const [filter, setFilter] = useState<string>('all');
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    if (filter === 'all') return items;
    return items.filter((p) => p.category === filter);
  }, [items, filter]);

  const filters = [
    { value: 'all', label: t('common.all') },
    { value: 'building', label: t('gallery_page.filter_building') },
    { value: 'lessons', label: t('gallery_page.filter_lessons') },
    { value: 'sports', label: t('gallery_page.filter_sports') },
    { value: 'events', label: t('gallery_page.filter_events') },
  ];

  const openAt = (idx: number) => {
    triggerRef.current = document.activeElement as HTMLElement;
    setLightboxIdx(idx);
  };
  const close = useCallback(() => setLightboxIdx(null), []);
  const prev = useCallback(
    () => setLightboxIdx((i) => (i === null ? i : (i - 1 + filtered.length) % filtered.length)),
    [filtered.length]
  );
  const next = useCallback(
    () => setLightboxIdx((i) => (i === null ? i : (i + 1) % filtered.length)),
    [filtered.length]
  );

  const open = lightboxIdx !== null;

  // Keyboard: Escape / arrows / focus trap. Body scroll lock + focus restore.
  useEffect(() => {
    if (!open) return;
    const previouslyFocused = triggerRef.current;
    document.body.style.overflow = 'hidden';
    closeBtnRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        next();
      } else if (e.key === 'Tab') {
        // Trap focus within the dialog.
        const focusables = dialogRef.current?.querySelectorAll<HTMLElement>('button');
        if (!focusables || focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      previouslyFocused?.focus();
    };
  }, [open, close, prev, next]);

  const current = open ? filtered[lightboxIdx] : null;
  const currentCaption = current ? getLocalizedField(current, 'caption', locale) : '';

  return (
    <>
      <div
        className="flex-between"
        style={{ marginBottom: 'var(--space-xl)', flexWrap: 'wrap', gap: 'var(--space-md)' }}
      >
        <div className="filter-group" style={{ marginBottom: 0 }}>
          {filters.map((f) => (
            <button
              key={f.value}
              type="button"
              className={`filter-btn${filter === f.value ? ' active' : ''}`}
              onClick={() => {
                setFilter(f.value);
                setLightboxIdx(null);
              }}
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
              padding: 'var(--s-12) var(--s-4)',
            }}
          >
            <Icon
              name="image"
              size={44}
              style={{ color: 'var(--ink-4)', marginBottom: 'var(--s-3)' }}
            />
            <p style={{ margin: 0, fontWeight: 500, color: 'var(--ink-2)' }}>
              {t('gallery_page_extra.empty_title')}
            </p>
            <p style={{ margin: 'var(--s-2) 0 0', fontSize: '0.9375rem' }}>
              {t('gallery_page_extra.empty_text')}
            </p>
          </div>
        ) : (
          filtered.map((item, idx) => {
            const caption = getLocalizedField(item, 'caption', locale);
            const altText = caption || t('gallery_page.title');
            return (
              <button
                key={item.id}
                type="button"
                className="gallery-item"
                onClick={() => openAt(idx)}
                aria-label={`${t('gallery_page_extra.open_image')}: ${altText}`}
                aria-haspopup="dialog"
              >
                <Image
                  src={item.url}
                  alt={altText}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
                {caption && <div className="gallery-caption">{caption}</div>}
              </button>
            );
          })
        )}
      </div>

      {open && current && (
        <div
          className="lightbox active"
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <div
            className="lightbox-content"
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={currentCaption || t('gallery_page_extra.lightbox_label')}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={transformImage(current.url, { width: 1600 })}
              alt={currentCaption || t('gallery_page.title')}
            />
            {currentCaption && <div className="lightbox-caption">{currentCaption}</div>}
            <button
              type="button"
              className="lightbox-close"
              ref={closeBtnRef}
              onClick={close}
              aria-label={t('gallery_page_extra.close')}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
            {filtered.length > 1 && (
              <>
                <button
                  type="button"
                  className="lightbox-prev"
                  onClick={prev}
                  aria-label={t('gallery_page_extra.prev')}
                >
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="lightbox-next"
                  onClick={next}
                  aria-label={t('gallery_page_extra.next')}
                >
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
