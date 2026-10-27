'use client';
import { toast } from '@/components/admin/Toast';
import type { Lang } from '@/components/admin/lang';

export interface FieldCheck {
  /** true bo'lsa maydon to'g'ri. */
  valid: boolean;
  fieldId: string;
  message: string;
  /** Maydon qaysi til tabida joylashgan (yashirin tabdagi xatoga o'tish uchun). */
  lang?: Lang;
}

/**
 * Formani JS'da tekshiradi (brauzer yashirin tabdagi `required` maydonga fokus bera olmaydi).
 * Birinchi xatoda tegishli tabga o'tadi, maydonga fokus beradi va toast chiqaradi.
 */
export function validateFields(checks: FieldCheck[], setLang?: (l: Lang) => void): boolean {
  const bad = checks.find((c) => !c.valid);
  if (!bad) return true;
  if (bad.lang && setLang) setLang(bad.lang);
  toast.error(bad.message);
  // Tab almashgandan keyin (render) fokus beramiz.
  window.requestAnimationFrame(() => {
    const el = document.getElementById(bad.fieldId);
    if (el) {
      el.setAttribute('aria-invalid', 'true');
      el.focus();
      el.addEventListener('input', () => el.removeAttribute('aria-invalid'), { once: true });
    }
  });
  return false;
}

/** Raqamli maydon qiymatini (string holatda saqlanadigan) butun songa aylantirish. */
export function parseIntField(value: string, fallback: number): number {
  const n = parseInt(value.trim(), 10);
  return Number.isFinite(n) ? n : fallback;
}
