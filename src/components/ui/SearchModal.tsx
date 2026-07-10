'use client';
import { useState, useEffect, useMemo, useRef, useId } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { getDocuments } from '@/lib/firebase/client-queries';
import { getLocalizedField } from '@/lib/utils';
import { useRouter } from '@/i18n/routing';
import Icon, { type IconName } from '@/components/ui/Icon';
import type { News, Teacher, FaqItem, Locale } from '@/types';

interface SearchResult {
  type: 'news' | 'teacher' | 'faq';
  id: string;
  title: string;
  subtitle: string;
  href: string; // locale-prefixed, for the <a> fallback
  path: string; // locale-relative, for next-intl router.push
  icon: IconName;
}

// Cache the fetched collections in sessionStorage so reopening the modal within the same
// tab doesn't re-read ~100 Firestore docs. Short TTL keeps results reasonably fresh.
// v2: FAQ collection added to the index.
const SEARCH_CACHE_KEY = 'search-data-v2';
const SEARCH_CACHE_TTL = 5 * 60 * 1000;

interface SearchCache {
  ts: number;
  news: News[];
  teachers: Teacher[];
  faq: FaqItem[];
}

export default function SearchModal({ onClose }: { onClose: () => void }) {
  const locale = useLocale() as Locale;
  const t = useTranslations('search');
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [news, setNews] = useState<News[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [faq, setFaq] = useState<FaqItem[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);

  const baseId = useId();
  const listId = `${baseId}-list`;
  const inputId = `${baseId}-input`;
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  const optionId = (r: SearchResult) => `${baseId}-opt-${r.type}-${r.id}`;

  // Navigate via the next-intl router (SPA transition). `href` is locale-prefixed for the
  // anchor fallback; `path` is locale-relative for router.push (which re-adds the prefix).
  function navigate(r: SearchResult) {
    onClose();
    router.push(r.path as never);
  }

  useEffect(() => {
    let cancelled = false;

    function readCache(): SearchCache | null {
      try {
        const raw = sessionStorage.getItem(SEARCH_CACHE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as SearchCache;
        if (!parsed || Date.now() - parsed.ts > SEARCH_CACHE_TTL) return null;
        return parsed;
      } catch {
        return null;
      }
    }

    async function load() {
      const cached = readCache();
      if (cached) {
        setNews(cached.news);
        setTeachers(cached.teachers);
        setFaq(cached.faq || []);
        return;
      }
      let n: News[] = [];
      let tc: Teacher[] = [];
      let fq: FaqItem[] = [];
      try {
        n = await getDocuments<News>('news', {
          orderBy: 'createdAt',
          direction: 'desc',
          limit: 50,
        });
      } catch (err) {
        console.warn('[SearchModal] news fetch failed:', err);
      }
      try {
        tc = await getDocuments<Teacher>('teachers', { limit: 50 });
      } catch (err) {
        console.warn('[SearchModal] teachers fetch failed:', err);
      }
      try {
        fq = await getDocuments<FaqItem>('faq', { limit: 100 });
      } catch (err) {
        console.warn('[SearchModal] faq fetch failed:', err);
      }
      if (cancelled) return;
      const publishedNews = n.filter((x) => x.status === 'published');
      setNews(publishedNews);
      setTeachers(tc);
      setFaq(fq);
      try {
        sessionStorage.setItem(
          SEARCH_CACHE_KEY,
          JSON.stringify({
            ts: Date.now(),
            news: publishedNews,
            teachers: tc,
            faq: fq,
          } satisfies SearchCache)
        );
      } catch {
        // Storage unavailable (private mode / quota) — non-fatal.
      }
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
          path: `/news/${item.id}`,
          icon: 'newspaper',
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
          path: `/teachers#${item.id}`,
          icon: 'user',
        });
      }
    }
    for (const item of faq) {
      const question = getLocalizedField(item, 'question', locale).toLowerCase();
      const answer = getLocalizedField(item, 'answer', locale).toLowerCase();
      if (question.includes(q) || answer.includes(q)) {
        out.push({
          type: 'faq',
          id: item.id,
          title: getLocalizedField(item, 'question', locale),
          subtitle: getLocalizedField(item, 'answer', locale).substring(0, 100),
          href: `/${locale}/faq`,
          path: `/faq`,
          icon: 'question',
        });
      }
    }
    return out.slice(0, 10);
  }, [query, news, teachers, faq, locale]);

  // Focus the input on open; restore focus to the trigger on close.
  useEffect(() => {
    previouslyFocused.current = document.activeElement as HTMLElement;
    inputRef.current?.focus();
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
      previouslyFocused.current?.focus();
    };
  }, []);

  // Keyboard: Escape / Arrow navigation / Enter activation / focus trap (Tab).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIdx((i) => Math.min(results.length - 1, i + 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIdx((i) => Math.max(0, i - 1));
      } else if (e.key === 'Enter') {
        const r = results[activeIdx];
        if (r) {
          e.preventDefault();
          onClose();
          router.push(r.path as never);
        }
      } else if (e.key === 'Tab') {
        // Only the input is tabbable — keep focus inside the dialog.
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [activeIdx, onClose, results, router]);

  // Keep the active option scrolled into view.
  useEffect(() => {
    const r = results[activeIdx];
    if (!r) return;
    document.getElementById(optionId(r))?.scrollIntoView({ block: 'nearest' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIdx, results]);

  const activeDescendant = results[activeIdx] ? optionId(results[activeIdx]) : undefined;

  return (
    <div className="search-modal active">
      <div className="search-modal-backdrop" onClick={onClose} />
      <div
        className="search-modal-box"
        ref={boxRef}
        role="dialog"
        aria-modal="true"
        aria-label={t('dialog_label')}
      >
        <div className="search-modal-input-wrap">
          <Icon name="search" size={20} />
          <label htmlFor={inputId} className="visually-hidden">
            {t('input_label')}
          </label>
          <input
            ref={inputRef}
            id={inputId}
            type="text"
            className="search-modal-input"
            placeholder={t('placeholder')}
            autoComplete="off"
            role="combobox"
            aria-expanded={results.length > 0}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={activeDescendant}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIdx(0);
            }}
          />
          <kbd className="search-kbd">ESC</kbd>
        </div>
        <div className="search-modal-results">
          {query.length < 2 ? (
            <div className="search-empty">
              <p style={{ color: 'var(--text-lo)', fontSize: '0.875rem' }}>{t('min_chars')}</p>
              <div style={{ marginTop: 8, fontSize: '0.75rem', color: 'var(--text-lo)' }}>
                {t('keyboard')}: <kbd className="search-kbd">↑↓</kbd> ·{' '}
                <kbd className="search-kbd">Enter</kbd> · <kbd className="search-kbd">ESC</kbd>
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="search-empty">
              <div
                style={{ marginBottom: 8, opacity: 0.5, display: 'flex', justifyContent: 'center' }}
              >
                <Icon name="search" size={40} />
              </div>
              <p style={{ color: 'var(--text-mid)' }}>{t('no_results', { query })}</p>
            </div>
          ) : (
            <ul
              className="search-result-list"
              role="listbox"
              id={listId}
              aria-label={t('dialog_label')}
            >
              {results.map((r, i) => (
                <li key={`${r.type}-${r.id}`} role="presentation">
                  <a
                    href={r.href}
                    id={optionId(r)}
                    role="option"
                    aria-selected={i === activeIdx}
                    tabIndex={-1}
                    className={`search-result${i === activeIdx ? ' active' : ''}`}
                    onMouseEnter={() => setActiveIdx(i)}
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(r);
                    }}
                  >
                    <span className="search-result-icon">
                      <Icon name={r.icon} size={18} />
                    </span>
                    <div className="search-result-text">
                      <div className="search-result-title">{r.title}</div>
                      <div className="search-result-subtitle">{r.subtitle}</div>
                    </div>
                    <span className="search-result-type">
                      {r.type === 'news'
                        ? t('type_news')
                        : r.type === 'teacher'
                          ? t('type_teacher')
                          : t('type_faq')}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
