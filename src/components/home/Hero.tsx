import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import HeroParticles from './HeroParticles';

export default async function Hero() {
  const t = await getTranslations('hero');
  return (
    <section className="hero" id="hero">
      <HeroParticles />
      <div className="container">
        <div className="hero-content">
          <span className="hero-eyebrow animate-on-scroll">{t('eyebrow')}</span>
          <h1 className="animate-on-scroll animate-delay-1">{t('title')}</h1>
          <p className="animate-on-scroll animate-delay-2">{t('description')}</p>
          <div className="hero-actions animate-on-scroll animate-delay-3">
            <Link href={'/admission' as never} className="btn btn-primary btn-lg">{t('btn_admission')}</Link>
            <Link href={'/about' as never} className="btn btn-ghost btn-lg">{t('btn_about')}</Link>
          </div>
        </div>
      </div>
      <a href="#aboutShort" className="hero-scroll-cue" aria-label="Quyiroq aylantirish">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </a>
    </section>
  );
}
