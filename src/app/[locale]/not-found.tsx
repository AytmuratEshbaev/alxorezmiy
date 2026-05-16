import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';

export default async function NotFound() {
  const t = await getTranslations();
  return (
    <section
      style={{
        minHeight: '90vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--s-12) var(--s-4)',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: -1,
          background:
            'radial-gradient(ellipse at top, var(--amber-soft) 0%, transparent 55%),radial-gradient(ellipse at bottom, var(--navy-soft) 0%, transparent 55%)',
          opacity: 0.9
        }}
      />

      <div className="container" style={{ maxWidth: 640, position: 'relative' }}>
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(6rem,16vw,11rem)',
            fontWeight: 800,
            background: 'var(--brand-gradient)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            lineHeight: 0.9,
            marginBottom: 'var(--s-6)',
            letterSpacing: '-.05em'
          }}
        >
          404
        </div>
        <span className="hero-eyebrow" style={{ display: 'inline-flex', marginBottom: 'var(--s-4)' }}>
          {t('not_found.eyebrow')}
        </span>
        <h1 style={{ marginBottom: 'var(--s-4)', fontSize: 'clamp(1.5rem,3vw,2.25rem)' }}>{t('not_found.title')}</h1>
        <p style={{ fontSize: '1.0625rem', marginBottom: 'var(--s-8)', color: 'var(--text-mid)', lineHeight: 1.6 }}>
          {t('not_found.message')}
        </p>
        <div style={{ display: 'flex', gap: 'var(--s-3)', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href={'/' as never} className="btn btn-primary btn-lg">{t('not_found.back_home')}</Link>
          <Link href={'/contact' as never} className="btn btn-ghost btn-lg" style={{ color: 'var(--text-hi)', borderColor: 'var(--border)' }}>
            {t('not_found.go_contact')}
          </Link>
        </div>
        <div style={{ marginTop: 'var(--s-12)', paddingTop: 'var(--s-6)', borderTop: '1px solid var(--border-subtle)' }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-lo)', marginBottom: 'var(--s-3)' }}>{t('not_found.or_visit')}</p>
          <div style={{ display: 'flex', gap: 'var(--s-4)', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href={'/about' as never} style={{ fontSize: '0.9375rem', color: 'var(--brand-1)', textDecoration: 'none' }}>
              {t('nav.about')}
            </Link>
            <Link href={'/teachers' as never} style={{ fontSize: '0.9375rem', color: 'var(--brand-1)', textDecoration: 'none' }}>
              {t('nav.teachers')}
            </Link>
            <Link href={'/news' as never} style={{ fontSize: '0.9375rem', color: 'var(--brand-1)', textDecoration: 'none' }}>
              {t('nav.news')}
            </Link>
            <Link href={'/admission' as never} style={{ fontSize: '0.9375rem', color: 'var(--brand-1)', textDecoration: 'none' }}>
              {t('nav.admission')}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
