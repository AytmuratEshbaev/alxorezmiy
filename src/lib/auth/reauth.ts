import 'server-only';
import type { AdminUser } from './session';

/**
 * Xavfli amallar (admin qo'shish/o'chirish) faqat yaqinda Telegram orqali tasdiqlangan sessiyada:
 * o'g'irlangan eski sessiya bilan yangi "orqa eshik" admin yaratib bo'lmasin.
 */
const RECENT_LOGIN_MS = 15 * 60 * 1000;

export function isRecentLogin(user: AdminUser): boolean {
  const at = Date.parse(user.verifiedAt);
  const age = Date.now() - at;
  return Number.isFinite(at) && age >= 0 && age < RECENT_LOGIN_MS;
}

export const REAUTH_ERROR = 'Xavfsizlik uchun bu amalni Telegram orqali tasdiqlash kerak.';
