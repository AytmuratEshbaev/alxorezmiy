'use client';
import { useState, useEffect, useMemo, useRef, useId, useCallback } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import Icon, { type IconName } from '@/components/ui/Icon';
import type { Locale } from '@/types';

interface SearchResult {
  type: 'news' | 'teacher' | 'faq';
  id: string;
  title: string;
  subtitle: string;
  href: string; // locale-prefixed, for the <a> fallback
  path: string; // locale-relative, for next-intl router.push
  icon: IconName;
}

/** GET /api/public/search?locale=… — server tomonida lokalizatsiya qilingan (uz zaxira) va qisqartirilgan. */
interface SearchIndex {
  news: { id: string; title: string; excerpt: string }[];
  teachers: { id: string; name: string; subject: string }[];
  faq: { id: string; question: string; answer: string }[];
}

// Har bir til uchun alohida sessionStorage keshi; faqat muvaffaqiyatli javob saqlanadi.
const SEARCH_CACHE_PREFIX = 'search-index-v3:';
const SEARCH_CACHE_TTL = 5 * 60 * 1000;

function readCache(locale: string): SearchIndex | null {
  try {
    const raw = sessionStorage.getItem(SEARCH_CACHE_PREFIX + locale);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { ts: number; data: SearchIndex };
    if (!parsed?.data || Date.now() - parsed.ts > SEARCH_CACHE_TTL) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

function writeCache(locale: string, data: SearchIndex) {
  try {
    sessionStorage.setItem(SEARCH_CACHE_PREFIX + locale, JSON.stringify({ ts: Date.now(), data }));
  } catch {
    // Storage unavailable (private mode / quota) — non-fatal.
  }
}

function isIndex(x: unknown): x is SearchIndex {
  const o = x as SearchIndex | null;
  return !!o && Array.isArray(o.news) && Array.isArray(o.teachers) && Array.isArray(o.faq);
}

export default function SearchModal({ onClose }: { onClose: () => void }) {
  const locale = useLocale() as Locale;
  const t = useTranslations('search');
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState<SearchIndex | null>(null);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [attempt, setAttempt] = useState(0);
  const [activeIdx, setActiveIdx] = useState(0);

  const baseId = useId();
  const listId = `${baseId}-list`;
  const inputId = `${baseId}-input`;
  const inputRef = useRef<HTMLInputElement>(null);
  const retryRef = useRef<HTMLButtonElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  const optionId = (r: SearchResult) => `${baseId}-opt-${r.type}-${r.id}`;

  const navigate = useCallback(
    (r: SearchResult) => {
      onClose();
      router.push(r.path as never);
    },
    [onClose, router]
  );

  useEffect(() => {
    const cached = readCache(locale);
    if (cached) {
      setIndex(cached);
      setLoadState('ready');
      return;
    }
    const ctrl = new AbortController();
    setLoadState('loading');
    fetch(`/api/public/search?${new URLSearchParams({ locale })}`, { signal: ctrl.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: unknown = await res.json();
        if (!isIndex(data)) throw new Error('malformed search index');
        writeCache(locale, data);
        setIndex(data);
        setLoadState('ready');
      })
      .catch((err) => {
        if (ctrl.signal.aborted) return;
        console.warn('[SearchModal] search index fetch failed:', err);
        setLoadState('error');
      });
    return () => ctrl.abort();
  }, [locale, attempt]);

  const results = useMemo<SearchResult[]>(() => {
    if (!index || query.trim().length < 2) return [];
    const q = query.trim().toLocaleLowerCase();
    const has = (...xs: string[]) => xs.some((x) => (x || '').toLocaleLowerCase().includes(q));
    const out: SearchResult[] = [];
    for (const n of index.news) {
      if (!has(n.title, n.excerpt)) continue;
      out.push({
        type: 'news',
        id: n.id,
        title: n.title,
        subtitle: (n.excerpt || '').substring(0, 100),
        href: `/${locale}/news/${n.id}`,
        path: `/news/${n.id}`,
        icon: 'newspaper',
      });
    }
    for (const tc of index.teachers) {
      if (!has(tc.name, tc.subject)) continue;
      out.push({
        type: 'teacher',
        id: tc.id,
        title: tc.name,
        subtitle: tc.subject || '',
        href: `/${locale}/teachers#teacher-${tc.id}`,
        path: `/teachers#teacher-${tc.id}`,
        icon: 'user',
      });
    }
    for (const f of index.faq) {
      if (!has(f.question, f.answer)) continue;
      out.push({
        type: 'faq',
        id: f.id,
        title: f.question,
        subtitle: (f.answer || '').substring(0, 100),
        href: `/${locale}/faq`,
        path: `/faq`,
        icon: 'question',
      });
    }
    return out.slice(0, 10);
  }, [query, index, locale]);

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
      } else if (e.key === 'Enter' && document.activeElement === inputRef.current) {
        const r = results[activeIdx];
        if (r) {
          e.preventDefault();
          navigate(r);
        }
      } else if (e.key === 'Tab') {
        // Tab tartibida faqat input va (xato holatida) "qayta urinish" tugmasi.
        const order = [inputRef.current, retryRef.current].filter(Boolean) as HTMLElement[];
        e.preventDefault();
        const i = order.indexOf(document.activeElement as HTMLElement);
        const nextIdx = e.shiftKey ? (i <= 0 ? order.length - 1 : i - 1) : (i + 1) % order.length;
        order[nextIdx]?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [activeIdx, onClose, results, navigate]);

  // Keep the active option scrolled into view.
  useEffect(() => {
    const r = results[activeIdx];
    if (!r) return;
    document.getElementById(optionId(r))?.scrollIntoView({ block: 'nearest' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIdx, results]);

  const activeDescendant = results[activeIdx] ? optionId(results[activeIdx]) : undefined;
  const typing = query.trim().length >= 2;

  // Ekran o'quvchilar uchun jonli holat: yuklanmoqda / xato / natijalar soni.
  const liveText =
    loadState === 'loading' && typing
      ? t('loading')
      : loadState === 'error'
        ? t('error')
        : typing
          ? t('results_count', { count: results.length })
          : '';

  return (
    <div className="search-modal active">
      <div className="search-modal-backdrop" onClick={onClose} />
      <div
        className="search-modal-box"
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
            type="search"
            className="search-modal-input"
            placeholder={t('placeholder')}
            autoComplete="off"
            enterKeyHint="search"
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
        <p className="visually-hidden" role="status" aria-live="polite">
          {liveText}
        </p>
        <div className="search-modal-results">
          {loadState === 'error' ? (
            <div className="search-empty">
              <p className="search-error">{t('error')}</p>
              <button
                ref={retryRef}
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => {
                  setAttempt((a) => a + 1);
                  inputRef.current?.focus();
                }}
              >
                <Icon name="refresh" size={16} /> {t('retry')}
              </button>
            </div>
          ) : !typing ? (
            <div className="search-empty">
              <p className="search-hint">{t('min_chars')}</p>
              <div className="search-hint search-hint-keys">
                {t('keyboard')}: <kbd className="search-kbd">↑↓</kbd> ·{' '}
                <kbd className="search-kbd">Enter</kbd> · <kbd className="search-kbd">ESC</kbd>
              </div>
            </div>
          ) : loadState === 'loading' ? (
            <div className="search-empty">
              <p className="search-hint">{t('loading')}</p>
            </div>
          ) : results.length === 0 ? (
            <div className="search-empty">
              <div className="search-empty-icon">
                <Icon name="search" size={40} />
              </div>
              <p>{t('no_results', { query })}</p>
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
                      {r.subtitle && <div className="search-result-subtitle">{r.subtitle}</div>}
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
