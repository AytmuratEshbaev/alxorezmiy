'use client';
import { startTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('error_page');
  const router = useRouter();

  useEffect(() => {
    console.error('[page error]', error);
  }, [error]);

  // Server komponent xatosi: avval RSC ma'lumotini qayta so'raymiz, keyin chegarani tiklaymiz.
  function retry() {
    startTransition(() => {
      router.refresh();
      reset();
    });
  }

  return (
    <section className="status-page" role="alert">
      <div className="container status-page-inner">
        <h1>{t('title')}</h1>
        <p>{t('message')}</p>
        {error.digest && <p className="status-page-code">ID: {error.digest}</p>}
        <div className="status-page-actions">
          <button type="button" className="btn btn-primary btn-lg" onClick={retry}>
            {t('retry')}
          </button>
          <Link href={'/' as never} className="btn btn-outline btn-lg">
            {t('back_home')}
          </Link>
        </div>
      </div>
    </section>
  );
}
