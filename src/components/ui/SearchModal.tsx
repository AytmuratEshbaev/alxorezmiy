'use client';
import { useState, useEffect, useMemo } from 'react';
import { useLocale } from 'next-intl';
import { getDocuments } from '@/lib/firebase/client-queries';
import { getLocalizedField, escapeHtml } from '@/lib/utils';
import type { News, Teacher, Locale } from '@/types';

interface SearchResult {
  type: 'news' | 'teacher';
  id: string;
  title: string;
  subtitle: string;
  href: string;
  icon: string;
}

export default function SearchModal({ onClose }: { onClose: () => void }) {
  const locale = useLocale() as Locale;
  const [query, setQuery] = useState('');
  const [news, setNews] = useState<News[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      let n: News[] = [];
      let t: Teacher[] = [];
      try {
        n = await getDocuments<News>('news', { orderBy: 'createdAt', direction: 'desc', limit: 50 });
      } catch (err) {
        console.warn('[SearchModal] news fetch failed:', err);
      }
      try {
        t = await getDocuments<Teacher>('teachers', { limit: 50 });
      } catch (err) {
        console.warn('[SearchModal] teachers fetch failed:', err);
      }
      if (cancelled) return;
      setNews(n.filter((x) => x.status === 'published'));
      setTeachers(t);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const results = useMemo<SearchResult[]>(() => {
    if (query.length < 2) return [];
    const q = query.toLowerCase();
    const out: SearchResult[] = [];
    for (const item of news) {
      const title = getLocalizedField(item, 'title', locale).toLowerCase();
      const content = getLocalizedField(item, 'content', locale).toLowerCase();
      if (title.includes(q) || content.includes(q)) {
        out.push({
          type: 'news',
          id: item.id,
          title: getLocalizedField(item, 'title', locale),
          subtitle: getLocalizedField(item, 'content', locale).substring(0, 100),
          href: `/${locale}/news/${item.id}`,
          icon: '📰'
        });
      }
    }
    for (const item of teachers) {
      const name = getLocalizedField(item, 'name', locale).toLowerCase();
      const subject = (item.subject || '').toLowerCase();
      if (name.includes(q) || subject.includes(q)) {
        out.push({
          type: 'teacher',
          id: item.id,
          title: getLocalizedField(item, 'name', locale),
          subtitle: `${item.subject || ''} · ${item.category || ''}`,
          href: `/${locale}/teachers#${item.id}`,
          icon: '👨‍🏫'
        });
      }
    }
    return out.slice(0, 10);
  }, [query, news, teachers, locale]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIdx((i) => Math.min(results.length - 1, i + 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIdx((i) => Math.max(0, i - 1));
      } else if (e.key === 'Enter') {
        const r = results[activeIdx];
        if (r) window.location.href = r.href;
      }
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [activeIdx, onClose, results]);

  return (
    <div className="search-modal active">
      <div className="search-modal-backdrop" onClick={onClose} />
      <div className="search-modal-box">
        <div className="search-modal-input-wrap">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input
            type="text"
            className="search-modal-input"
            placeholder="Qidirish: yangilik, o'qituvchi..."
            autoComplete="off"
            autoFocus
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActiveIdx(0); }}
          />
          <kbd className="search-kbd">ESC</kbd>
        </div>
        <div className="search-modal-results">
          {query.length < 2 ? (
            <div className="search-empty">
              <p style={{ color: 'var(--text-lo)', fontSize: '0.875rem' }}>Kamida 2 ta harf yozing</p>
              <div style={{ marginTop: 8, fontSize: '0.75rem', color: 'var(--text-lo)' }}>
                Klaviatura: <kbd className="search-kbd">↑↓</kbd> · <kbd className="search-kbd">Enter</kbd> · <kbd className="search-kbd">ESC</kbd>
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="search-empty">
              <div style={{ fontSize: '2.5rem', marginBottom: 8, opacity: 0.5 }}>🔍</div>
              <p style={{ color: 'var(--text-mid)' }} dangerouslySetInnerHTML={{ __html: `"${escapeHtml(query)}" bo'yicha hech narsa topilmadi` }} />
            </div>
          ) : (
            results.map((r, i) => (
              <a key={`${r.type}-${r.id}`} href={r.href} className={`search-result${i === activeIdx ? ' active' : ''}`}>
                <span className="search-result-icon">{r.icon}</span>
                <div className="search-result-text">
                  <div className="search-result-title">{r.title}</div>
                  <div className="search-result-subtitle">{r.subtitle}</div>
                </div>
                <span className="search-result-type">{r.type === 'news' ? 'Yangilik' : "O'qituvchi"}</span>
              </a>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
