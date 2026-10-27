'use client';
import type { KeyboardEvent, ReactNode } from 'react';
import { LANGS, LANG_LABELS, type Lang } from '@/components/admin/lang';

const tabId = (prefix: string, l: Lang) => `${prefix}-tab-${l}`;
const panelId = (prefix: string, l: Lang) => `${prefix}-panel-${l}`;

/** Til tablari (role="tablist"), strelka tugmalari bilan almashtirish. */
export function LangTabs({
  idPrefix,
  active,
  onChange,
}: {
  idPrefix: string;
  active: Lang;
  onChange: (l: Lang) => void;
}) {
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = LANGS.indexOf(active);
    let next: Lang | null = null;
    if (e.key === 'ArrowRight') next = LANGS[(i + 1) % LANGS.length];
    else if (e.key === 'ArrowLeft') next = LANGS[(i - 1 + LANGS.length) % LANGS.length];
    else if (e.key === 'Home') next = LANGS[0];
    else if (e.key === 'End') next = LANGS[LANGS.length - 1];
    if (!next) return;
    e.preventDefault();
    onChange(next);
    document.getElementById(tabId(idPrefix, next))?.focus();
  };

  return (
    <div className="lang-tabs-bar" role="tablist" aria-label="Til" onKeyDown={onKeyDown}>
      {LANGS.map((l) => (
        <button
          key={l}
          type="button"
          role="tab"
          id={tabId(idPrefix, l)}
          aria-selected={active === l}
          aria-controls={panelId(idPrefix, l)}
          tabIndex={active === l ? 0 : -1}
          className={'lang-tab' + (active === l ? ' active' : '')}
          onClick={() => onChange(l)}
        >
          {LANG_LABELS[l]}
        </button>
      ))}
    </div>
  );
}

export function LangPanel({
  idPrefix,
  lang,
  active,
  children,
}: {
  idPrefix: string;
  lang: Lang;
  active: Lang;
  children: ReactNode;
}) {
  return (
    <div
      role="tabpanel"
      id={panelId(idPrefix, lang)}
      aria-labelledby={tabId(idPrefix, lang)}
      className={'lang-panel' + (active === lang ? ' active' : '')}
      hidden={active !== lang}
    >
      {children}
    </div>
  );
}
