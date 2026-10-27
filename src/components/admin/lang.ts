export type Lang = 'uz' | 'ru' | 'kk' | 'en';

export const LANGS: Lang[] = ['uz', 'ru', 'kk', 'en'];

export const LANG_LABELS: Record<Lang, string> = {
  uz: "🇺🇿 O'zbek",
  ru: '🇷🇺 Русский',
  kk: '🏳️ Qaraqalpaq',
  en: '🇬🇧 English',
};

export type LangRecord = Record<Lang, string>;

export const emptyLangRecord = (): LangRecord => ({ uz: '', ru: '', kk: '', en: '' });

/** `{ title_uz, title_ru, ... }` kabi yozuvdan `{ uz, ru, kk, en }` olish. */
export function pickLang(obj: object, prefix: string): LangRecord {
  const rec = obj as Record<string, unknown>;
  const out = emptyLangRecord();
  for (const l of LANGS) {
    const v = rec[`${prefix}_${l}`];
    out[l] = typeof v === 'string' ? v : '';
  }
  return out;
}

/** `{ uz, ru, kk, en }` → `{ title_uz, title_ru, ... }` (qiymatlar trim qilinadi). */
export function spreadLang(prefix: string, values: LangRecord): Record<string, string> {
  const out: Record<string, string> = {};
  for (const l of LANGS) out[`${prefix}_${l}`] = values[l].trim();
  return out;
}
