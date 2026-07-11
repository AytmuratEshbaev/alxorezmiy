'use client';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { SocialIcons } from '@/components/layout/social-icons';
import Icon from '@/components/ui/Icon';

interface Props {
  title: string;
  /** Absolute share URL, built server-side from NEXT_PUBLIC_SITE_URL (no hydration race). */
  url?: string;
  /** Fallback path (e.g. /uz/news/abc) — used to build a URL if `url` is missing. */
  path?: string;
}

export default function NewsShareButtons({ title, url: urlProp, path }: Props) {
  const t = useTranslations('news_page');
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      setCanShare(true);
    }
  }, []);

  // Prefer the server-provided absolute URL; fall back to the live location at click time.
  function resolveUrl(): string {
    if (urlProp) return urlProp;
    if (typeof window !== 'undefined') {
      return path ? window.location.origin + path : window.location.href;
    }
    return '';
  }

  async function onCopy() {
    const url = resolveUrl();
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  async function onNativeShare() {
    const url = resolveUrl();
    if (!url) return;
    try {
      await navigator.share({ title, url });
    } catch {
      // user cancelled or unsupported — ignore
    }
  }

  const shareUrl = urlProp || '';
  const tg = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(title)}`;
  const fb = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
  const wa = `https://wa.me/?text=${encodeURIComponent(`${title} ${shareUrl}`)}`;

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 'var(--s-2)',
        marginTop: 'var(--s-8)',
        paddingTop: 'var(--s-6)',
        borderTop: '1px solid var(--border-subtle)',
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
        {SocialIcons.telegram} {t('share_telegram')}
      </a>
      <a
        href={wa}
        target="_blank"
        rel="noopener noreferrer"
        className="btn btn-secondary btn-sm"
        aria-label={`${t('share_title')} — ${t('share_whatsapp')}`}
        style={{ gap: 'var(--s-2)' }}
      >
        {SocialIcons.whatsapp} {t('share_whatsapp')}
      </a>
      <a
        href={fb}
        target="_blank"
        rel="noopener noreferrer"
        className="btn btn-secondary btn-sm"
        aria-label={`${t('share_title')} — ${t('share_facebook')}`}
        style={{ gap: 'var(--s-2)' }}
      >
        {SocialIcons.facebook} {t('share_facebook')}
      </a>
      {mounted && canShare && (
        <button
          type="button"
          onClick={onNativeShare}
          className="btn btn-secondary btn-sm"
          aria-label={t('share_native')}
          style={{ gap: 'var(--s-2)' }}
        >
          <Icon name="share" size={18} /> {t('share_native')}
        </button>
      )}
      <button
        type="button"
        onClick={onCopy}
        className="btn btn-secondary btn-sm"
        aria-label={t('share_copy')}
        style={{ gap: 'var(--s-2)' }}
      >
        <Icon name="link" size={18} /> {copied ? t('share_copied') : t('share_copy')}
      </button>
      <span aria-live="polite" className="visually-hidden">
        {copied ? t('share_copied') : ''}
      </span>
    </div>
  );
}
