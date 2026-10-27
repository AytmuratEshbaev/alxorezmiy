'use client';
import { useEffect } from 'react';

// Root layout darajasidagi xato — butun daraxt (shu jumladan [locale]/layout va i18n
// provider) o'rniga render qilinadi, shuning uchun matnlar statik va o'z <html>/<body> si bor.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[global error]', error);
  }, [error]);

  return (
    <html lang="uz">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px 16px',
          fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
          background: '#f4f5f8',
          color: '#0f172a',
          textAlign: 'center',
        }}
      >
        <main style={{ maxWidth: 560 }} role="alert">
          <h1 style={{ fontSize: '1.5rem', margin: '0 0 12px' }}>
            Nimadir noto&lsquo;g&lsquo;ri ketdi
          </h1>
          <p style={{ color: '#475569', lineHeight: 1.6, margin: '0 0 8px' }}>
            Kutilmagan xatolik yuz berdi. Iltimos, qaytadan urinib ko&lsquo;ring.
          </p>
          <p lang="ru" style={{ color: '#475569', lineHeight: 1.6, margin: '0 0 8px' }}>
            Произошла непредвиденная ошибка. Пожалуйста, попробуйте ещё раз.
          </p>
          <p lang="en" style={{ color: '#475569', lineHeight: 1.6, margin: '0 0 24px' }}>
            An unexpected error occurred. Please try again.
          </p>
          {error.digest && (
            <p style={{ fontFamily: 'monospace', fontSize: 12, color: '#576173' }}>
              ID: {error.digest}
            </p>
          )}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={reset}
              style={{
                padding: '12px 24px',
                minHeight: 44,
                borderRadius: 8,
                border: 0,
                background: '#0d0d5c',
                color: '#ffffff',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Qayta urinish / Повторить / Try again
            </button>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/uz"
              style={{
                padding: '12px 24px',
                minHeight: 44,
                boxSizing: 'border-box',
                borderRadius: 8,
                border: '1px solid #0d0d5c',
                color: '#0d0d5c',
                textDecoration: 'none',
                fontWeight: 600,
              }}
            >
              Bosh sahifa
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
