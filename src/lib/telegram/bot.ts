import 'server-only';
import { getSecret } from '@/lib/cf';

/** Telegram Bot API bilan ishlash (https://core.telegram.org/bots/api). */
const API = 'https://api.telegram.org';

export function getBotToken(): string | undefined {
  return getSecret('TELEGRAM_BOT_TOKEN');
}

export async function callBot<T = unknown>(
  method: string,
  params: Record<string, unknown>
): Promise<T> {
  const token = getBotToken();
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN o'rnatilmagan");
  const res = await fetch(`${API}/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
    signal: AbortSignal.timeout(10_000),
  });
  const data = (await res.json().catch(() => ({}))) as {
    ok?: boolean;
    result?: T;
    description?: string;
  };
  if (!res.ok || !data.ok) throw new Error(`Telegram ${method}: ${data.description || res.status}`);
  return data.result as T;
}

let usernameMemo: { token: string; username: string } | null = null;

/** Bot @username'i (deep link uchun) — getMe orqali, isolate davomida eslab qolinadi. */
export async function getBotUsername(): Promise<string> {
  const token = getBotToken() || '';
  if (usernameMemo?.token !== token) {
    const me = await callBot<{ username: string }>('getMe', {});
    usernameMemo = { token, username: me.username };
  }
  return usernameMemo.username;
}

/**
 * Webhook `secret_token` — bot token'dan hosil qilinadi, alohida secret kerak emas.
 * scripts/setup-bot.mjs ham aynan shu formula bilan setWebhook qiladi.
 */
export async function webhookSecret(): Promise<string | null> {
  const token = getBotToken();
  if (!token) return null;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(token),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode('alxorezmiy-webhook'));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Doimiy vaqtli satr taqqoslash (webhook sirini tekshirish uchun). */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export interface InlineButton {
  text: string;
  callback_data: string;
}

export function sendMessage(
  chatId: string | number,
  text: string,
  buttons?: InlineButton[][]
): Promise<{ message_id: number }> {
  return callBot('sendMessage', {
    chat_id: chatId,
    text,
    link_preview_options: { is_disabled: true },
    ...(buttons ? { reply_markup: { inline_keyboard: buttons } } : {}),
  });
}
