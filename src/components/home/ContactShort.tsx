import { getTranslations } from 'next-intl/server';
import Icon, { type IconName } from '@/components/ui/Icon';
import { filled, telHref } from '@/lib/utils';
import type { Settings } from '@/types';

/** Bosh sahifadagi qisqa kontaktlar. Sozlamalar bo'sh bo'lsa (yangi baza) — umuman ko'rsatilmaydi. */
export default async function ContactShort({ settings }: { settings: Settings | null }) {
  const t = await getTranslations();
  const address = filled(settings?.address);
  const phone = filled(settings?.phone);
  const email = filled(settings?.email);

  const cards: { key: string; icon: IconName; label: string; value: string; href?: string }[] = [];
  if (address) {
    cards.push({
      key: 'address',
      icon: 'map-pin',
      label: t('contact_page.address_label'),
      value: address,
    });
  }
  if (phone) {
    cards.push({
      key: 'phone',
      icon: 'phone',
      label: t('contact_page.phone_label'),
      value: phone,
      href: telHref(phone),
    });
  }
  if (email) {
    cards.push({
      key: 'email',
      icon: 'mail',
      label: t('contact_page.email_label'),
      value: email,
      href: `mailto:${email}`,
    });
  }
  if (cards.length === 0) return null;

  return (
    <section className="section" id="contactShort">
      <div className="container">
        <div className="section-header animate-on-scroll">
          <span className="section-label">{t('sections.contact_label')}</span>
          <h2>{t('sections.contact_title')}</h2>
        </div>
        <div className={`grid grid-${Math.max(2, cards.length)} animate-on-scroll`}>
          {cards.map((c) => (
            <div key={c.key} className="card contact-card">
              <div className="contact-icon">
                <Icon name={c.icon} />
              </div>
              <div>
                <h3>{c.label}</h3>
                <p>{c.href ? <a href={c.href}>{c.value}</a> : c.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
