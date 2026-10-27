import { NextResponse } from 'next/server';
import { safeEqual, webhookSecret } from '@/lib/telegram/bot';
import { handleUpdate } from '@/lib/telegram/updates';

/**
 * Telegram bot webhook'i. setWebhook'da berilgan secret_token har so'rovda headerda keladi —
 * u mos kelmasa so'rov Telegram'dan emas. Webhook: `npm run bot:setup`.
 */
export async function POST(req: Request) {
  const expected = await webhookSecret();
  const got = req.headers.get('x-telegram-bot-api-secret-token') || '';
  if (!expected || !safeEqual(got, expected)) return new NextResponse(null, { status: 401 });

  let update;
  try {
    update = await req.json();
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  if (!update || typeof update !== 'object') return new NextResponse(null, { status: 400 });
  try {
    await handleUpdate(update);
  } catch (err) {
    // Vaqtinchalik D1/Telegram xatosida update yo'qolmasin: Telegram qayta yuboradi.
    console.error('[telegram] update failed:', (err as Error).message);
    return NextResponse.json({ ok: false }, { status: 503 });
  }
  return NextResponse.json({ ok: true });
}
