import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { getSettings } from '@/lib/db/queries';
import { SocialIcons } from './social-icons';
import SocialLinks, { getSocialLinks } from './SocialLinks';
import { fallbackLang, filled, getLocalizedField, safe, telHref } from '@/lib/utils';
import type { Locale } from '@/types';

export default async function Footer({ locale }: { locale: Locale }) {
  const t = await getTranslations();
  const s = await safe(() => getSettings(), null, 'Footer getSettings');
  const fullName = s ? getLocalizedField(s, 'fullName', locale) : '';
  const social = getSocialLinks(s);
  const address = filled(s?.address);
  const phone = filled(s?.phone);
  const email = filled(s?.email);
  const hours = filled(s?.hours);
  const hasContact = !!(address || phone || email || hours);
  const year = String(new Date().getFullYear());

  return (
    <footer className="footer">
      <div className="container">
        <div className={`footer-grid${hasContact ? '' : ' footer-grid-3'}`}>
          <div className="footer-about">
            <h2 className="footer-brand">{t('site_short_name')}</h2>
            <p>{t('footer.about_text')}</p>
            <SocialLinks links={social} variant="icons" />
          </div>
          <nav aria-labelledby="footer-quick-links">
            <h2 id="footer-quick-links">{t('footer.quick_links')}</h2>
            <ul className="footer-links">
              <li>
                <Link href="/about">{t('nav.about')}</Link>
              </li>
              <li>
                <Link href="/directions">{t('nav.directions')}</Link>
              </li>
              <li>
                <Link href="/teachers">{t('nav.teachers')}</Link>
              </li>
              <li>
                <Link href="/achievements">{t('nav.achievements')}</Link>
              </li>
              <li>
                <Link href="/admission">{t('nav.admission')}</Link>
              </li>
              <li>
                <Link href="/gallery">{t('nav.gallery')}</Link>
              </li>
            </ul>
          </nav>
          {hasContact && (
            <div>
              <h2>{t('footer.contact_info')}</h2>
              <ul className="footer-contact">
                {address && (
                  <li>
                    <span>{SocialIcons.pin}</span> <span>{address}</span>
                  </li>
                )}
                {phone && (
                  <li>
                    <span>{SocialIcons.phone}</span> <a href={telHref(phone)}>{phone}</a>
                  </li>
                )}
                {email && (
                  <li>
                    <span>{SocialIcons.mail}</span> <a href={`mailto:${email}`}>{email}</a>
                  </li>
                )}
                {hours && (
                  <li>
                    <span>{SocialIcons.clock}</span> <span>{hours}</span>
                  </li>
                )}
              </ul>
            </div>
          )}
          <nav aria-labelledby="footer-info-links">
            <h2 id="footer-info-links">{t('footer.info_links')}</h2>
            <ul className="footer-links">
              <li>
                <Link href="/faq">{t('nav.faq')}</Link>
              </li>
              <li>
                <Link href="/news">{t('nav.news')}</Link>
              </li>
              <li>
                <Link href="/contact">{t('nav.contact')}</Link>
              </li>
            </ul>
          </nav>
        </div>
        {fullName && (
          <div className="footer-official-name">
            <span className="footer-official-label">{t('footer.official_name')}</span>
            <p lang={s ? fallbackLang(s, 'fullName', locale) : undefined}>{fullName}</p>
          </div>
        )}
        <div className="footer-bottom">
          <span>{t('footer.copyright', { year })}</span>
          <span>{t('footer.location')}</span>
        </div>
      </div>
    </footer>
  );
}
