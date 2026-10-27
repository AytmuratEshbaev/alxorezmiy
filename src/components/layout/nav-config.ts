export interface NavChild {
  key: string;
  href: string;
  i18nKey: string;
}
export interface NavItem extends NavChild {
  children?: NavChild[];
}

export const NAV_ITEMS: NavItem[] = [
  { key: 'home', href: '/', i18nKey: 'nav.home' },
  {
    key: 'about_group',
    href: '/about',
    i18nKey: 'nav.about',
    children: [
      { key: 'about', href: '/about', i18nKey: 'nav.about_general' },
      { key: 'directions', href: '/directions', i18nKey: 'nav.directions' },
      { key: 'teachers', href: '/teachers', i18nKey: 'nav.teachers' },
      { key: 'gallery', href: '/gallery', i18nKey: 'nav.gallery' },
    ],
  },
  { key: 'achievements', href: '/achievements', i18nKey: 'nav.achievements' },
  { key: 'news', href: '/news', i18nKey: 'nav.news' },
  { key: 'admission', href: '/admission', i18nKey: 'nav.admission' },
  { key: 'faq', href: '/faq', i18nKey: 'nav.faq' },
  { key: 'contact', href: '/contact', i18nKey: 'nav.contact' },
];

/** Locale-relative pathname normalizatsiyasi (oxiridagi `/` siz). */
function normalize(pathname: string): string {
  return pathname === '/' ? '/' : pathname.replace(/\/$/, '');
}

/** `/news` → `/news` va `/news/abc` uchun ham faol (bosh sahifa faqat aniq mos kelganda). */
export function matchesPath(pathname: string, href: string): boolean {
  const path = normalize(pathname);
  if (href === '/') return path === '/';
  return path === href || path.startsWith(`${href}/`);
}

export function isItemActive(pathname: string, item: NavItem): boolean {
  if (matchesPath(pathname, item.href)) return true;
  return !!item.children?.some((c) => matchesPath(pathname, c.href));
}
