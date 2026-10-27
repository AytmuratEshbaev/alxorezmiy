'use client';
import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import NewsCard from '@/components/news/NewsCard';
import type { News, Locale } from '@/types';

interface Props {
  locale: Locale;
  /** `${publishedAt}|${id}` of the last server-rendered item — the cursor for page 2. */
  initialCursor: string | null;
  pageSize?: number;
}

export default function NewsLoadMore({ locale, initialCursor, pageSize = 12 }: Props) {
  const t = useTranslations('news_page');
  const [items, setItems] = useState<News[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const gridRef = useRef<HTMLDivElement>(null);

  async function loadMore() {
    if (loading || !cursor) return;
    setLoading(true);
    setError(false);
    try {
      const qs = new URLSearchParams({ before: cursor, limit: String(pageSize) });
      const res = await fetch(`/api/public/news?${qs}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { items: News[]; nextCursor: string | null };
      const firstNew = items.length;
      setItems((prev) => [...prev, ...data.items]);
      setCursor(data.nextCursor ?? null);
      // Fokusni birinchi yangi kartaga — klaviatura foydalanuvchisi joyini yo'qotmasin.
      requestAnimationFrame(() => {
        gridRef.current?.querySelectorAll<HTMLElement>('a.news-card')[firstNew]?.focus();
      });
    } catch (err) {
      console.warn('[NewsLoadMore] load failed:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  const done = !cursor;

  return (
    <>
      {items.length > 0 && (
        <div className="grid grid-3" style={{ marginTop: 'var(--s-8)' }} ref={gridRef}>
          {items.map((item) => (
            <NewsCard key={item.id} item={item} locale={locale} />
          ))}
        </div>
      )}

      <div className="load-more">
        <div aria-live="polite">
          {error && <p className="load-more-error">{t('load_more_error')}</p>}
          {done && items.length > 0 && <p className="load-more-end">{t('load_more_end')}</p>}
        </div>
        {!done && (
          <button
            type="button"
            className="btn btn-outline btn-lg"
            onClick={loadMore}
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? t('load_more_loading') : error ? t('retry') : t('load_more')}
          </button>
        )}
      </div>
    </>
  );
}
