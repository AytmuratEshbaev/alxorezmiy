import { SocialIcons } from './social-icons';
import { filled } from '@/lib/utils';
import type { Settings } from '@/types';

const SOCIAL = [
  { key: 'telegram', label: 'Telegram' },
  { key: 'instagram', label: 'Instagram' },
  { key: 'facebook', label: 'Facebook' },
  { key: 'youtube', label: 'YouTube' },
] as const;

export interface SocialLink {
  key: (typeof SOCIAL)[number]['key'];
  label: string;
  href: string;
}

/**
 * Sozlamalardagi to'ldirilgan ijtimoiy tarmoq havolalari. Server ularni to'liq https://
 * URL'ga normallashtiradi; bo'sh satr = "o'rnatilmagan".
 */
export function getSocialLinks(s: Settings | null | undefined): SocialLink[] {
  if (!s) return [];
  return SOCIAL.flatMap(({ key, label }) => {
    const href = filled(s[key]);
    return href ? [{ key, label, href }] : [];
  });
}

/** `icons` — footer'dagi kvadrat ikonkalar; `buttons` — kontakt sahifasidagi yorliqli tugmalar. */
export default function SocialLinks({
  links,
  variant,
}: {
  links: SocialLink[];
  variant: 'icons' | 'buttons';
}) {
  if (links.length === 0) return null;
  if (variant === 'icons') {
    return (
      <ul className="footer-social">
        {links.map((l) => (
          <li key={l.key}>
            <a href={l.href} target="_blank" rel="noopener noreferrer" aria-label={l.label}>
              {SocialIcons[l.key]}
            </a>
          </li>
        ))}
      </ul>
    );
  }
  return (
    <ul className="social-buttons">
      {links.map((l) => (
        <li key={l.key}>
          <a
            href={l.href}
            className="btn btn-secondary btn-sm"
            target="_blank"
            rel="noopener noreferrer"
          >
            {SocialIcons[l.key]} {l.label}
          </a>
        </li>
      ))}
    </ul>
  );
}
