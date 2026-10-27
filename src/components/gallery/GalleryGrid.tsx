'use client';
import Image from 'next/image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { fallbackLang, getLocalizedField } from '@/lib/utils';
import { resizedImage } from '@/lib/image-loader';
import EmptyState from '@/components/ui/EmptyState';
import Icon from '@/components/ui/Icon';
import type { GalleryItem, Locale } from '@/types';

interface Props {
  items: GalleryItem[];
  locale: Locale;
}

const SWIPE_MIN_PX = 50;

export default function GalleryGrid({ items, locale }: Props) {
  const t = useTranslations();
  const [filter, setFilter] = useState<string>('all');
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

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

  const openAt = (idx: number, trigger: HTMLElement) => {
    triggerRef.current = trigger;
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

  // Ochilganda: scroll lock + yopish tugmasiga fokus; yopilganda fokus bosilgan rasmga qaytadi.
  useEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current;
    document.body.style.overflow = 'hidden';
    closeBtnRef.current?.focus();
    return () => {
      document.body.style.overflow = '';
      trigger?.focus();
    };
  }, [open]);

  // Klaviatura: Escape / strelkalar / fokus tuzog'i.
  useEffect(() => {
    if (!open) return;
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
        const focusables = dialogRef.current?.querySelectorAll<HTMLElement>('button');
        if (!focusables || focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement;
        if (!dialogRef.current?.contains(active)) {
          e.preventDefault();
          first.focus();
        } else if (e.shiftKey && active === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, close, prev, next]);

  function onTouchStart(e: React.TouchEvent) {
    const p = e.touches[0];
    touchStart.current = p ? { x: p.clientX, y: p.clientY } : null;
  }
  function onTouchEnd(e: React.TouchEvent) {
    const start = touchStart.current;
    touchStart.current = null;
    const p = e.changedTouches[0];
    if (!start || !p || filtered.length < 2) return;
    const dx = p.clientX - start.x;
    const dy = p.clientY - start.y;
    // Faqat aniq gorizontal surish — vertikal harakat va kichik tebranishlar e'tiborsiz.
    if (Math.abs(dx) < SWIPE_MIN_PX || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    if (dx < 0) next();
    else prev();
  }

  const current = open ? filtered[lightboxIdx] : null;
  const currentCaption = current ? getLocalizedField(current, 'caption', locale) : '';
  const currentLang = current ? fallbackLang(current, 'caption', locale) : undefined;

  return (
    <>
      <div className="gallery-toolbar">
        <div className="filter-group" role="group" aria-label={t('gallery_page.title')}>
          {filters.map((f) => (
            <button
              key={f.value}
              type="button"
              className={`filter-btn${filter === f.value ? ' active' : ''}`}
              aria-pressed={filter === f.value}
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

      {filtered.length === 0 ? (
        <EmptyState
          compact
          icon="image"
          title={t('gallery_page_extra.empty_title')}
          text={t('gallery_page_extra.empty_text')}
        />
      ) : (
        <div className="grid grid-3">
          {filtered.map((item, idx) => {
            const caption = getLocalizedField(item, 'caption', locale);
            const altText = caption || t('gallery_page.title');
            return (
              <button
                key={item.id}
                type="button"
                className="gallery-item"
                onClick={(e) => openAt(idx, e.currentTarget)}
                aria-label={`${t('gallery_page_extra.open_image')}: ${altText}`}
                aria-haspopup="dialog"
              >
                <Image
                  src={item.url}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
                {caption && (
                  <div
                    className="gallery-caption"
                    aria-hidden="true"
                    lang={fallbackLang(item, 'caption', locale)}
                  >
                    {caption}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

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
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={resizedImage(current.url, 1600)}
              alt={currentCaption || t('gallery_page.title')}
              lang={currentLang}
            />
            {currentCaption && (
              <div className="lightbox-caption" aria-hidden="true" lang={currentLang}>
                {currentCaption}
              </div>
            )}
            {filtered.length > 1 && (
              <p className="lightbox-counter" aria-live="polite">
                {t('gallery_page_extra.counter', {
                  current: lightboxIdx + 1,
                  total: filtered.length,
                })}
              </p>
            )}
            <button
              type="button"
              className="lightbox-close"
              ref={closeBtnRef}
              onClick={close}
              aria-label={t('gallery_page_extra.close')}
            >
              <Icon name="x" size={22} />
            </button>
            {filtered.length > 1 && (
              <>
                <button
                  type="button"
                  className="lightbox-prev"
                  onClick={prev}
                  aria-label={t('gallery_page_extra.prev')}
                >
                  <Icon name="chevron-left" size={24} />
                </button>
                <button
                  type="button"
                  className="lightbox-next"
                  onClick={next}
                  aria-label={t('gallery_page_extra.next')}
                >
                  <Icon name="chevron-right" size={24} />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
