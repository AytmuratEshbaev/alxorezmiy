import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';

export default async function Hero() {
  const [t, tSections] = await Promise.all([
    getTranslations('hero'),
    getTranslations('sections'),
  ]);

  return (
    <section className="home-hero" id="hero">
      <div className="home-hero-text">
        <span className="home-hero-eyebrow">{t('eyebrow')}</span>
        <h1>{t('title')}</h1>
        <p>{t('description')}</p>
        <div className="home-hero-actions">
          <Link href={'/admission' as never} className="btn btn-primary btn-lg">
            {t('btn_admission')}
          </Link>
          <Link href={'/about' as never} className="btn btn-ghost btn-lg">
            {t('btn_about')}
          </Link>
        </div>
      </div>
      <div className="home-hero-photo">
        <Image
          src="/assets/images/hero.webp"
          alt={tSections('photo_alt')}
          fill
          priority
          sizes="(max-width: 960px) 100vw, 58vw"
        />
      </div>
    </section>
  );
}
