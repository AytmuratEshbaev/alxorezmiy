import { setRequestLocale, getTranslations } from 'next-intl/server';
import { getSettings } from '@/lib/db/queries';
import ContactForm from '@/components/contact/ContactForm';
import Icon, { type IconName } from '@/components/ui/Icon';
import PageHeader from '@/components/ui/PageHeader';
import SocialLinks, { getSocialLinks } from '@/components/layout/SocialLinks';
import { buildPageMetadata } from '@/lib/seo';
import { filled, safe, telHref } from '@/lib/utils';
import type { Settings } from '@/types';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta.contact' });
  return buildPageMetadata({
    locale,
    title: t('title'),
    description: t('description'),
    path: '/contact',
  });
}

interface ContactRow {
  key: string;
  icon: IconName;
  label: string;
  value: string;
  href?: string;
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const s = await safe<Settings | null>(() => getSettings(), null, 'contact getSettings');

  // Faqat admin to'ldirgan ma'lumotlar — bo'sh sozlamalarda soxta manzil/telefon ko'rsatilmaydi.
  const rows: ContactRow[] = [];
  const address = filled(s?.address);
  const phone = filled(s?.phone);
  const email = filled(s?.email);
  const hours = filled(s?.hours);
  if (address) {
    rows.push({
      key: 'address',
      icon: 'map-pin',
      label: t('contact_page.address_label'),
      value: address,
    });
  }
  if (phone) {
    rows.push({
      key: 'phone',
      icon: 'phone',
      label: t('contact_page.phone_label'),
      value: phone,
      href: telHref(phone),
    });
  }
  if (email) {
    rows.push({
      key: 'email',
      icon: 'mail',
      label: t('contact_page.email_label'),
      value: email,
      href: `mailto:${email}`,
    });
  }
  if (hours) {
    rows.push({ key: 'hours', icon: 'clock', label: t('contact_page.hours_label'), value: hours });
  }
  const social = getSocialLinks(s);

  return (
    <>
      <PageHeader title={t('contact_page.title')} crumbs={[{ label: t('nav.contact') }]} />

      {rows.length > 0 && (
        <section className="section" aria-labelledby="contact-info-heading">
          <div className="container">
            <h2 id="contact-info-heading" className="visually-hidden">
              {t('contact_page.info_title')}
            </h2>
            <div className={`grid grid-${Math.max(2, rows.length)}`}>
              {rows.map((r, i) => (
                <div
                  key={r.key}
                  className={`card card-hover contact-card animate-on-scroll${i > 0 ? ` animate-delay-${i}` : ''}`}
                >
                  <div className="contact-icon">
                    <Icon name={r.icon} />
                  </div>
                  <div>
                    <h3>{r.label}</h3>
                    <p>{r.href ? <a href={r.href}>{r.value}</a> : r.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="section" style={rows.length > 0 ? { paddingTop: 0 } : undefined}>
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
                  title={t('contact_page.map_title')}
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d14792.5!2d59.603!3d42.462!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x41dd9b0261fb71e9%3A0x7e8e3ad743d0e1!2sNukus%2C%20Karakalpakstan!5e0!3m2!1sen!2s!4v1"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>

              {social.length > 0 && (
                <div style={{ marginTop: 'var(--space-xl)' }}>
                  <h3 style={{ marginBottom: 'var(--space-md)' }}>
                    {t('contact_page.social_title')}
                  </h3>
                  <SocialLinks links={social} variant="buttons" />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
