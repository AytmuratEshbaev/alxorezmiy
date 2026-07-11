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
  // Firestore cursor: the last QueryDocumentSnapshot once we've loaded a page,
  // otherwise the serialized ISO string from the server's last item.
  const [cursor, setCursor] = useState<unknown>(initialCursor);

  async function loadMore() {
    if (loading || done) return;
    setLoading(true);
    setError(false);
    try {
      // Mirror getNewsList: where status == 'published', orderBy createdAt desc.
      const [{ collection, query, where, orderBy, startAfter, limit, getDocs, Timestamp }, { db }] =
        await Promise.all([import('firebase/firestore'), import('@/lib/firebase/client')]);

      const startVal = typeof cursor === 'string' ? Timestamp.fromDate(new Date(cursor)) : cursor;

      const q = query(
        collection(db, 'news'),
        where('status', '==', 'published'),
        orderBy('createdAt', 'desc'),
        startAfter(startVal),
        limit(pageSize)
      );
      const snap = await getDocs(q);
      const page = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as News);
      setItems((prev) => [...prev, ...page]);

      if (snap.docs.length < pageSize) {
        setDone(true);
      } else {
        setCursor(snap.docs[snap.docs.length - 1]);
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
