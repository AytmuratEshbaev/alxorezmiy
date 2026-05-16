'use client';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

interface Props {
  title: string;
  path: string; // e.g. /uz/news/abc — without origin
}

export default function NewsShareButtons({ title, path }: Props) {
  const t = useTranslations('news_page');
  const [url, setUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUrl(window.location.origin + path);
    }
  }, [path]);

  async function onCopy() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  const tg = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
  const fb = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 'var(--s-2)',
        marginTop: 'var(--s-8)',
        paddingTop: 'var(--s-6)',
        borderTop: '1px solid var(--border-subtle)'
      }}
    >
      <span style={{ fontSize: '.9375rem', color: 'var(--ink-3)', marginRight: 'var(--s-2)' }}>
        {t('share_title')}:
      </span>
      <a
        href={tg}
        target="_blank"
        rel="noopener noreferrer"
        className="btn btn-secondary btn-sm"
        aria-label={`${t('share_title')} — ${t('share_telegram')}`}
        style={{ gap: 'var(--s-2)' }}
      >
        <span aria-hidden="true">✈️</span> {t('share_telegram')}
      </a>
      <a
        href={fb}
        target="_blank"
        rel="noopener noreferrer"
        className="btn btn-secondary btn-sm"
        aria-label={`${t('share_title')} — ${t('share_facebook')}`}
        style={{ gap: 'var(--s-2)' }}
      >
        <span aria-hidden="true">📘</span> {t('share_facebook')}
      </a>
      <button
        type="button"
        onClick={onCopy}
        className="btn btn-secondary btn-sm"
        aria-label={t('share_copy')}
        style={{ gap: 'var(--s-2)' }}
      >
        <span aria-hidden="true">🔗</span> {copied ? t('share_copied') : t('share_copy')}
      </button>
    </div>
  );
}
