import { NextResponse } from 'next/server';
import { requireAdmin, jsonError, NO_STORE } from '@/lib/http';
import { rateLimit } from '@/lib/rate-limit';
import { createApproval, deleteApproval, sendApprovalPrompt } from '@/lib/auth/approval';
import { currentSessionId } from '@/lib/auth/session';

/**
 * Xavfli amal oldidan qayta tasdiqlash: bot to'g'ridan-to'g'ri adminning Telegram'iga
 * raqamli tugmalar yuboradi, tasdiqlangach shu sessiyaning `verifiedAt` vaqti yangilanadi.
 */
export async function POST(req: Request) {
  const auth = await requireAdmin(req);
  if ('response' in auth) return auth.response;
  if (!(await rateLimit('LOGIN_LIMITER', `reauth:${auth.user.id}`))) {
    return jsonError("Juda ko'p urinish. Birozdan so'ng qayta urinib ko'ring.", 429);
  }
  const sessionId = await currentSessionId();
  if (!sessionId) return jsonError('Unauthorized', 401);

  const row = await createApproval(req, 'reauth', { adminId: auth.user.id, sessionId });
  try {
    await sendApprovalPrompt(auth.user.telegramId, row);
  } catch (err) {
    await deleteApproval(row.id);
    console.error('[reauth] sendMessage failed:', (err as Error).message);
    return jsonError(
      "Telegram'ga xabar yuborib bo'lmadi. Botni bloklamaganingizni tekshiring.",
      502
    );
  }
  return NextResponse.json(
    { id: row.id, code: row.code, expiresAt: row.expiresAt },
    { headers: NO_STORE }
  );
}
