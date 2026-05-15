import { getTranslations } from 'next-intl/server';
import type { Settings } from '@/types';

export default async function ContactShort({ settings }: { settings: Settings | null }) {
  const t = await getTranslations();
  return (
    <section className="section" id="contactShort">
      <div className="container">
        <div className="section-header animate-on-scroll">
          <span className="section-label">{t('sections.contact_label')}</span>
          <h2>{t('sections.contact_title')}</h2>
        </div>
        <div className="grid grid-3 animate-on-scroll">
          <div className="card contact-card">
            <div className="contact-icon">📍</div>
            <div>
              <h4>{t('contact_page.address_label')}</h4>
              <p>{settings?.address || t('contact_page.address')}</p>
            </div>
          </div>
          <div className="card contact-card">
            <div className="contact-icon">📞</div>
            <div>
              <h4>{t('contact_page.phone_label')}</h4>
              <p>{settings?.phone || t('contact_page.phone')}</p>
            </div>
          </div>
          <div className="card contact-card">
            <div className="contact-icon">📧</div>
            <div>
              <h4>{t('contact_page.email_label')}</h4>
              <p>{settings?.email || t('contact_page.email')}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
