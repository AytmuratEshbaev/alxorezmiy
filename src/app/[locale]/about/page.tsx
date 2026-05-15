import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { getSettings } from '@/lib/firebase/server-queries';
import { getLocalizedField } from '@/lib/utils';
import type { Locale, Settings } from '@/types';

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta.about' });
  return { title: t('title'), description: t('description') };
}

async function safeGetSettings(): Promise<Settings | null> {
  try {
    return await getSettings();
  } catch (err) {
    console.warn('[about] getSettings failed:', err);
    return null;
  }
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const settings = await safeGetSettings();
  const fullName = settings ? getLocalizedField(settings, 'fullName', locale as Locale) : '';

  return (
    <>
      <div className="page-header">
        <h1>{t('about_page.title')}</h1>
        <div className="breadcrumb">
          <Link href={'/' as never}>{t('common.home')}</Link>
          <span className="separator">/</span>
          <span className="current">{t('about_page.title')}</span>
        </div>
      </div>

      {fullName && (
        <section className="section" style={{ padding: 'var(--s-12) 0 var(--s-8)' }} id="officialName">
          <div className="container" style={{ maxWidth: 860 }}>
            <div
              className="card animate-on-scroll"
              style={{ textAlign: 'center', background: 'var(--brand-gradient-soft)', border: '1px solid rgba(99,102,241,0.15)' }}
            >
              <span className="section-label" style={{ marginBottom: 'var(--s-4)' }}>📜 {t('footer.official_name')}</span>
              <p style={{ fontSize: '1.0625rem', lineHeight: 1.7, color: 'var(--text-hi)', fontWeight: 500, margin: 0 }}>{fullName}</p>
            </div>
          </div>
        </section>
      )}

      <section className="section" id="history">
        <div className="container">
          <div className="section-header animate-on-scroll">
            <span className="section-label">{t('about_page.history_label')}</span>
            <h2>{t('about_page.history_title')}</h2>
          </div>
          <div className="timeline animate-on-scroll">
            {['2010', '2012', '2015', '2018', '2020', '2023', '2026'].map((y) => (
              <div className="timeline-item" key={y}>
                <span className="timeline-year">{y}</span>
                <h3>{t(`about_history.y${y}` as never)}</h3>
                <p>{t(`about_history.y${y}_text` as never)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ background: 'var(--bg-secondary)' }} id="mission">
        <div className="container">
          <div className="section-header animate-on-scroll">
            <span className="section-label">{t('about_page.mission_label')}</span>
            <h2>{t('about_page.mission_title')}</h2>
            <p>{t('about_page.mission_text')}</p>
          </div>
          <div className="grid grid-2" style={{ maxWidth: 900, margin: '0 auto' }}>
            {[
              { key: 'excellence', icon: '🏆' },
              { key: 'innovation', icon: '💡' },
              { key: 'integrity', icon: '⚖️' },
              { key: 'community', icon: '🤝' }
            ].map((v, i) => (
              <div
                key={v.key}
                className={`card card-hover animate-on-scroll${i > 0 ? ` animate-delay-${i}` : ''}`}
                style={{ textAlign: 'center' }}
              >
                <div className="direction-icon" style={{ fontSize: '2rem' }}>{v.icon}</div>
                <h3>{t(`about_page.values.${v.key}` as never)}</h3>
                <p>{t(`about_page.values.${v.key}_desc` as never)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="leadership">
        <div className="container">
          <div className="section-header animate-on-scroll">
            <span className="section-label">{t('about_page.leadership_label')}</span>
            <h2>{t('about_page.leadership_title')}</h2>
          </div>
          <div className="grid grid-3" style={{ maxWidth: 900, margin: '0 auto' }}>
            {[
              { name: 'Abdullayev Baxtiyor', role: 'Maktab direktori', deg: 'Pedagogika fanlari doktori', img: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&h=200&fit=crop' },
              { name: 'Rahimova Gulnora', role: "O'quv ishlari bo'yicha o'rinbosar", deg: 'Pedagogika fanlari nomzodi', img: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop' },
              { name: 'Toshmatov Sardor', role: "Ilmiy ishlar bo'yicha o'rinbosar", deg: 'Fizika-matematika fanlari nomzodi', img: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop' }
            ].map((m, i) => (
              <div className={`card team-card animate-on-scroll${i > 0 ? ` animate-delay-${i}` : ''}`} key={m.name}>
                <div className="card-avatar">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={m.img} alt={m.role} loading="lazy" />
                </div>
                <h3>{m.name}</h3>
                <p className="role">{m.role}</p>
                <p style={{ fontSize: '0.85rem', marginTop: 8 }}>{m.deg}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ background: 'var(--bg-secondary)' }} id="virtualTour">
        <div className="container">
          <div className="section-header animate-on-scroll">
            <span className="section-label">{t('about_page.virtual_tour_label')}</span>
            <h2>{t('about_page.virtual_tour')}</h2>
          </div>
          <div className="grid grid-3 animate-on-scroll">
            {[
              { src: 'https://images.unsplash.com/photo-1562774053-701939374585?w=500&h=375&fit=crop', cap: 'Maktab binosi' },
              { src: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=500&h=375&fit=crop', cap: 'Sinf xonasi' },
              { src: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=500&h=375&fit=crop', cap: 'Laboratoriya' },
              { src: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=500&h=375&fit=crop', cap: 'Kutubxona' },
              { src: 'https://images.unsplash.com/photo-1571260899304-425eee4c7efc?w=500&h=375&fit=crop', cap: 'Sport zali' },
              { src: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=500&h=375&fit=crop', cap: "Yig'ilishlar zali" }
            ].map((g) => (
              <div className="gallery-item" key={g.src}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={g.src} alt={g.cap} loading="lazy" />
                <div className="gallery-caption">{g.cap}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
