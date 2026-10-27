'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocale } from 'next-intl';
import { useTheme } from '@/contexts/ThemeContext';

/**
 * Cloudflare Turnstile — ko'rinmas captcha. `appearance: 'interaction-only'`: oddiy
 * foydalanuvchi hech narsa ko'rmaydi, faqat shubhali holatda tekshiruv oynasi chiqadi.
 * NEXT_PUBLIC_TURNSTILE_SITE_KEY bo'lmasa (lokal dev) — hech narsa render qilinmaydi
 * va formalar tokensiz yuboriladi.
 */
const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '';
const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

/** true — formalar token olinmaguncha yuborilmasligi kerak. */
export const TURNSTILE_ENABLED = SITE_KEY !== '';

interface TurnstileApi {
  render(el: HTMLElement, opts: Record<string, unknown>): string;
  reset(id: string): void;
  remove(id: string): void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let scriptPromise: Promise<TurnstileApi> | null = null;

function loadScript(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = SCRIPT_SRC;
      s.async = true;
      s.defer = true;
      // CSP 'strict-dynamic': nonce'li skript yaratgan skript ishonchli hisoblanadi.
      s.onload = () =>
        window.turnstile ? resolve(window.turnstile) : reject(new Error('turnstile missing'));
      s.onerror = () => {
        scriptPromise = null;
        s.remove();
        reject(new Error('turnstile script failed'));
      };
      document.head.appendChild(s);
    });
  }
  return scriptPromise;
}

// Turnstile o'zbek/qoraqalpoq tillarini qo'llamaydi — 'auto' (brauzer tili) qoldiramiz.
const LANG: Record<string, string> = { uz: 'auto', kk: 'auto', ru: 'ru', en: 'en' };

export type TurnstileFailure = 'script' | 'widget';

interface Props {
  onToken: (token: string) => void;
  /** Skript yuklanmasa yoki widget xato bersa. Keyin token kelsa, onToken bilan tiklanadi. */
  onError?: (kind: TurnstileFailure) => void;
  /** Qiymat o'zgarganda widget qayta ishga tushadi (token bir martalik). */
  resetKey?: number;
}

export default function Turnstile({ onToken, onError, resetKey = 0 }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);
  const onErrorRef = useRef(onError);
  onTokenRef.current = onToken;
  onErrorRef.current = onError;
  const locale = useLocale();
  const { theme, resolved } = useTheme();

  // Til yoki tema o'zgarsa widget qayta chiziladi (Turnstile temani keyin o'zgartira olmaydi).
  useEffect(() => {
    if (!SITE_KEY || !resolved || !ref.current) return;
    let cancelled = false;
    loadScript()
      .then((ts) => {
        if (cancelled || !ref.current) return;
        onTokenRef.current('');
        widgetId.current = ts.render(ref.current, {
          sitekey: SITE_KEY,
          appearance: 'interaction-only',
          size: 'flexible',
          theme,
          language: LANG[locale] || 'auto',
          callback: (token: string) => onTokenRef.current(token),
          'expired-callback': () => onTokenRef.current(''),
          'timeout-callback': () => onTokenRef.current(''),
          'error-callback': () => {
            onTokenRef.current('');
            onErrorRef.current?.('widget');
          },
        });
      })
      .catch((err) => {
        console.warn('[turnstile]', err);
        if (!cancelled) onErrorRef.current?.('script');
      });
    return () => {
      cancelled = true;
      if (widgetId.current && window.turnstile) window.turnstile.remove(widgetId.current);
      widgetId.current = null;
    };
  }, [locale, theme, resolved]);

  useEffect(() => {
    if (resetKey === 0 || !widgetId.current || !window.turnstile) return;
    onTokenRef.current('');
    window.turnstile.reset(widgetId.current);
  }, [resetKey]);

  if (!SITE_KEY) return null;
  return <div ref={ref} className="turnstile-slot" />;
}

/**
 * Formalar uchun Turnstile holati: token, qayta ishga tushirish va "tayyor emas" sababi.
 * `blocked` true bo'lsa yuborish tugmasi o'chiriladi va `waitingReason` ko'rsatiladi.
 */
export function useTurnstileGate() {
  const [token, setTokenState] = useState('');
  const [failure, setFailure] = useState<TurnstileFailure | null>(null);
  const [resetKey, setResetKey] = useState(0);

  const onToken = useCallback((t: string) => {
    setTokenState(t);
    if (t) setFailure(null);
  }, []);
  const onError = useCallback((kind: TurnstileFailure) => setFailure(kind), []);
  const reset = useCallback(() => setResetKey((k) => k + 1), []);

  const blocked = TURNSTILE_ENABLED && !token;
  const waitingReason: 'verifying' | 'unavailable' | null = !blocked
    ? null
    : failure
      ? 'unavailable'
      : 'verifying';

  return { token, blocked, waitingReason, reset, props: { onToken, onError, resetKey } };
}

/** HTTP javobidan forma xatosi turini aniqlaydi (403 — tekshiruv, 429 — limit). */
export type SubmitError = 'error' | 'forbidden' | 'rate_limited';
export function submitErrorFromStatus(status: number): SubmitError {
  if (status === 403) return 'forbidden';
  if (status === 429) return 'rate_limited';
  return 'error';
}
