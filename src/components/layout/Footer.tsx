import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { getSettings } from '@/lib/firebase/server-queries';
import { SocialIcons } from './social-icons';
import { getLocalizedField } from '@/lib/utils';
import type { Locale, Settings } from '@/types';

async function safeGetSettings(): Promise<Settings | null> {
  try {
    return await getSettings();
  } catch (err) {
    console.warn('[Footer] getSettings failed; rendering without settings:', err);
    return null;
  }
}

export default async function Footer({ locale }: { locale: Locale }) {
  const t = await getTranslations();
  const s = await safeGetSettings();
  const fullName = s ? getLocalizedField(s, 'fullName', locale) : '';

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-about">
            <h4>Al-Xorazmiy maktabi</h4>
            <p>{t('footer.about_text')}</p>
            <div className="footer-social">
              {s?.telegram && <a href={s.telegram} target="_blank" rel="noopener" aria-label="Telegram">{SocialIcons.telegram}</a>}
              {s?.instagram && <a href={s.instagram} target="_blank" rel="noopener" aria-label="Instagram">{SocialIcons.instagram}</a>}
              {s?.facebook && <a href={s.facebook} target="_blank" rel="noopener" aria-label="Facebook">{SocialIcons.facebook}</a>}
              {s?.youtube && <a href={s.youtube} target="_blank" rel="noopener" aria-label="YouTube">{SocialIcons.youtube}</a>}
            </div>
          </div>
          <div>
            <h4>{t('footer.quick_links')}</h4>
            <ul className="footer-links">
              <li><Link href="/about">{t('nav.about')}</Link></li>
              <li><Link href="/directions">{t('nav.directions')}</Link></li>
              <li><Link href="/teachers">{t('nav.teachers')}</Link></li>
              <li><Link href="/achievements">{t('nav.achievements')}</Link></li>
              <li><Link href="/admission">{t('nav.admission')}</Link></li>
              <li><Link href="/gallery">{t('nav.gallery')}</Link></li>
            </ul>
          </div>
          <div>
            <h4>{t('footer.contact_info')}</h4>
            <ul className="footer-contact">
              {s?.address && <li><span>{SocialIcons.pin}</span> <span>{s.address}</span></li>}
              {s?.phone && <li><span>{SocialIcons.phone}</span> <a href={`tel:${s.phone.replace(/\s+/g, '')}`}>{s.phone}</a></li>}
              {s?.email && <li><span>{SocialIcons.mail}</span> <a href={`mailto:${s.email}`}>{s.email}</a></li>}
              {s?.hours && <li><span>{SocialIcons.clock}</span> <span>{s.hours}</span></li>}
            </ul>
          </div>
          <div>
            <h4>{t('nav.faq')}</h4>
            <ul className="footer-links">
              <li><Link href="/faq">{t('nav.faq')}</Link></li>
              <li><Link href="/news">{t('nav.news')}</Link></li>
              <li><Link href="/contact">{t('nav.contact')}</Link></li>
            </ul>
          </div>
        </div>
        {fullName && (
          <div className="footer-official-name" style={{ marginBottom: 'var(--s-5)', paddingTop: 'var(--s-5)', borderTop: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,.4)', display: 'block', marginBottom: '6px' }}>{t('footer.official_name')}</span>
            <p style={{ fontSize: '0.8125rem', lineHeight: 1.5, color: 'rgba(255,255,255,.55)', maxWidth: 900, margin: '0 auto' }}>{fullName}</p>
          </div>
        )}
        <div className="footer-bottom">
          <span>{t('footer.copyright')}</span>
          <span>Made with ❤️ in Nukus</span>
        </div>
      </div>
    </footer>
  );
}
