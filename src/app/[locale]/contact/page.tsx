import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { getSettings } from '@/lib/firebase/server-queries';
import ContactForm from '@/components/contact/ContactForm';
import { buildPageMetadata } from '@/lib/seo';
import type { Settings } from '@/types';

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta.contact' });
  return buildPageMetadata({ locale, title: t('title'), description: t('description'), path: '/contact' });
}

async function safeGetSettings(): Promise<Settings | null> {
  try {
    return await getSettings();
  } catch (err) {
    console.warn('[contact] getSettings failed:', err);
    return null;
  }
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const s = await safeGetSettings();

  return (
    <>
      <div className="page-header">
        <h1>{t('contact_page.title')}</h1>
        <div className="breadcrumb">
          <Link href={'/' as never}>{t('common.home')}</Link>
          <span className="separator">/</span>
          <span className="current">{t('nav.contact')}</span>
        </div>
      </div>

      <section className="section">
        <div className="container">
          <div className="grid grid-4">
            <div className="card card-hover contact-card animate-on-scroll">
              <div className="contact-icon">📍</div>
              <div>
                <h4>{t('contact_page.address_label')}</h4>
                <p>{s?.address || t('contact_page.address')}</p>
              </div>
            </div>
            <div className="card card-hover contact-card animate-on-scroll animate-delay-1">
              <div className="contact-icon">📞</div>
              <div>
                <h4>{t('contact_page.phone_label')}</h4>
                <p>{s?.phone || t('contact_page.phone')}</p>
              </div>
            </div>
            <div className="card card-hover contact-card animate-on-scroll animate-delay-2">
              <div className="contact-icon">📧</div>
              <div>
                <h4>{t('contact_page.email_label')}</h4>
                <p>{s?.email || t('contact_page.email')}</p>
              </div>
            </div>
            <div className="card card-hover contact-card animate-on-scroll animate-delay-3">
              <div className="contact-icon">🕐</div>
              <div>
                <h4>{t('contact_page.hours_label')}</h4>
                <p>{s?.hours || t('contact_page.hours')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="grid grid-2 contact-grid-2" style={{ gap: 'var(--space-2xl)' }}>
            <div className="animate-on-scroll">
              <h2 style={{ marginBottom: 'var(--space-xl)' }}>{t('contact_page.form_title')}</h2>
              <ContactForm />
            </div>

            <div className="animate-on-scroll animate-delay-1">
              <h2 style={{ marginBottom: 'var(--space-xl)' }}>{t('contact_page.map_title')}</h2>
              <div className="map-container">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d14792.5!2d59.603!3d42.462!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x41dd9b0261fb71e9%3A0x7e8e3ad743d0e1!2sNukus%2C%20Karakalpakstan!5e0!3m2!1sen!2s!4v1"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>

              <div style={{ marginTop: 'var(--space-xl)' }}>
                <h3 style={{ marginBottom: 'var(--space-md)' }}>{t('contact_page.social_title')}</h3>
                <div className="flex gap-md" style={{ flexWrap: 'wrap' }}>
                  {s?.telegram && (
                    <a href={s.telegram} className="btn btn-secondary btn-sm" style={{ gap: 8 }} target="_blank" rel="noopener">
                      <span>✈️</span> Telegram
                    </a>
                  )}
                  {s?.instagram && (
                    <a href={s.instagram} className="btn btn-secondary btn-sm" style={{ gap: 8 }} target="_blank" rel="noopener">
                      <span>📷</span> Instagram
                    </a>
                  )}
                  {s?.facebook && (
                    <a href={s.facebook} className="btn btn-secondary btn-sm" style={{ gap: 8 }} target="_blank" rel="noopener">
                      <span>📘</span> Facebook
                    </a>
                  )}
                  {s?.youtube && (
                    <a href={s.youtube} className="btn btn-secondary btn-sm" style={{ gap: 8 }} target="_blank" rel="noopener">
                      <span>▶️</span> YouTube
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
