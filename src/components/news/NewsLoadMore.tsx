'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import NewsCard from '@/components/news/NewsCard';
import type { News, Locale } from '@/types';

interface Props {
  locale: Locale;
  /** ISO createdAt of the last server-rendered item — the cursor for page 2. */
  initialCursor: string | null;
  pageSize?: number;
  /** false when the server already knows there are no more items. */
  hasMoreInitial: boolean;
}

export default function NewsLoadMore({
  locale,
  initialCursor,
  pageSize = 12,
  hasMoreInitial,
}: Props) {
  const t = useTranslations('news_page');
  const [items, setItems] = useState<News[]>([]);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(!hasMoreInitial || !initialCursor);
  const [error, setError] = useState(false);
  const [cursor, setCursor] = useState<string | null>(initialCursor);

  async function loadMore() {
    if (loading || done || !cursor) return;
    setLoading(true);
    setError(false);
    try {
      const qs = new URLSearchParams({ before: cursor, limit: String(pageSize) });
      const res = await fetch(`/api/public/news?${qs}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { items: page } = (await res.json()) as { items: News[] };
      setItems((prev) => [...prev, ...page]);

      if (page.length < pageSize) {
        setDone(true);
      } else {
        setCursor(page[page.length - 1].createdAt);
      }
    } catch (err) {
      console.warn('[NewsLoadMore] load failed:', err);
      // Degrade gracefully — hide the button on error.
      setError(true);
      setDone(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {items.length > 0 && (
        <div className="grid grid-3" style={{ marginTop: 'var(--s-8)' }}>
          {items.map((item) => (
            <NewsCard key={item.id} item={item} locale={locale} />
          ))}
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: 'var(--s-8)' }} aria-live="polite">
        {!done && !error && (
          <button
            type="button"
            className="btn btn-outline btn-lg"
            onClick={loadMore}
            disabled={loading}
          >
            {loading ? t('load_more_loading') : t('load_more')}
          </button>
        )}
        {done && !error && items.length > 0 && (
          <p style={{ margin: 0, color: 'var(--ink-3)', fontSize: '0.9375rem' }}>
            {t('load_more_end')}
          </p>
        )}
      </div>
    </>
  );
}
