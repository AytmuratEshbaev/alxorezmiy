import { NextResponse } from 'next/server';
import { isSameOrigin, readJson, jsonError, NO_STORE } from '@/lib/http';
import { rateLimit, clientIp } from '@/lib/rate-limit';
import { getBotToken, getBotUsername } from '@/lib/telegram/bot';
import { cancelApproval, createApproval } from '@/lib/auth/approval';

/**
 * Kirishni boshlash: tasdiq so'rovi ochiladi, brauzer raqamni ko'rsatadi va botga deep link
 * beradi. Tasdiqni brauzer /api/admin/login/poll orqali kutadi (lib/auth/approval.ts).
 */
export async function POST(req: Request) {
  if (!isSameOrigin(req)) return jsonError('Forbidden', 403);
  if (!getBotToken()) {
    console.error("[login] TELEGRAM_BOT_TOKEN o'rnatilmagan");
    return jsonError("Kirish sozlanmagan (TELEGRAM_BOT_TOKEN yo'q)", 503);
  }
  if (!(await rateLimit('LOGIN_LIMITER', `login-ip:${clientIp(req)}`))) {
    return jsonError("Juda ko'p urinish. Birozdan so'ng qayta urinib ko'ring.", 429);
  }

  let username: string;
  try {
    username = await getBotUsername();
  } catch (err) {
    console.error('[login] getMe failed:', (err as Error).message);
    return jsonError("Telegram bilan bog'lanib bo'lmadi. Keyinroq urinib ko'ring.", 502);
  }

  const row = await createApproval(req, 'login');
  return NextResponse.json(
    {
      id: row.id,
      code: row.code,
      url: `https://t.me/${username}?start=${row.id}`,
      expiresAt: row.expiresAt,
    },
    { headers: NO_STORE }
  );
}

export async function DELETE(req: Request) {
  if (!isSameOrigin(req)) return jsonError('Forbidden', 403);
  const body = await readJson<{ id?: unknown }>(req);
  if (typeof body?.id !== 'string' || !/^[\w-]{10,64}$/.test(body.id)) {
    return jsonError('Invalid request ID', 400);
  }
  await cancelApproval(body.id);
  return NextResponse.json({ ok: true }, { headers: NO_STORE });
}
