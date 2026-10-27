import 'server-only';
import { cookies } from 'next/headers';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { getDb } from '@/lib/cf';
import { nowIso } from '@/lib/db/rows';
import { clientIp } from '@/lib/rate-limit';
import { sendMessage, type InlineButton } from '@/lib/telegram/bot';
import { createSession, currentSessionId, sha256Hex } from './session';

/**
 * Telegram orqali tasdiqlash (kirish va xavfli amallar oldidan qayta tasdiqlash).
 *
 * 1. Brauzer so'rov ochadi: bazada yozuv, brauzerga HttpOnly cookie'da sir, sahifada raqam.
 * 2. Bot adminga so'rov tafsilotlari (brauzer, IP, joy) va raqamli tugmalar yuboradi.
 *    Kirishda admin deep link (t.me/<bot>?start=<id>) orqali o'zi botga keladi.
 * 3. Admin saytdagi raqamni tanlasa — tasdiqlanadi, boshqa raqam yoki "Bu men emas" — rad.
 *    Raqam faqat saytda ko'rinadi: begona odam o'z havolasini yuborib, adminni "tasdiqla"
 *    deb aldab qo'ysa ham, to'g'ri raqamni bilmaydi.
 * 4. Brauzer so'rovni kuzatadi (poll) va tasdiqlangach sessiya oladi. Sir faqat shu
 *    brauzerda — deep link'ni ko'rgan boshqa odam sessiyani ola olmaydi.
 */

const COOKIE = '__Host-ax_login';
const TTL_MS = 5 * 60 * 1000;

export type ApprovalKind = 'login' | 'reauth';
export type ApprovalStatus = 'pending' | 'approved' | 'denied' | 'not_admin';
export type PollResult = 'pending' | 'ok' | 'denied' | 'not_admin' | 'expired';

export interface ApprovalRow {
  id: string;
  kind: ApprovalKind;
  code: string;
  admin_id: string | null;
  session_id: string | null;
  status: ApprovalStatus;
  ip: string;
  client: string;
  createdAt: string;
  expiresAt: string;
}

function randomToken(bytes: number): string {
  const buf = crypto.getRandomValues(new Uint8Array(bytes));
  let s = '';
  for (const b of buf) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function randomInt(min: number, max: number): number {
  const [n] = crypto.getRandomValues(new Uint32Array(1));
  return min + (n % (max - min + 1));
}

/** "Chrome · Windows · UZ, Tashkent" — botdagi xabarda admin so'rovni tanib olishi uchun. */
function describeClient(req: Request): string {
  const ua = req.headers.get('user-agent') || '';
  const browser =
    [
      [/YaBrowser\//, 'Yandex'],
      [/Edg\//, 'Edge'],
      [/OPR\//, 'Opera'],
      [/Firefox\//, 'Firefox'],
      [/Chrome\//, 'Chrome'],
      [/Safari\//, 'Safari'],
    ].find(([re]) => (re as RegExp).test(ua))?.[1] ?? "Noma'lum brauzer";
  const os =
    [
      [/Android/, 'Android'],
      [/iPhone|iPad|iPod/, 'iOS'],
      [/Windows/, 'Windows'],
      [/Mac OS X/, 'macOS'],
      [/Linux/, 'Linux'],
    ].find(([re]) => (re as RegExp).test(ua))?.[1] ?? '';
  let place = '';
  try {
    const cf = getCloudflareContext().cf as { country?: string; city?: string } | undefined;
    place = [cf?.country, cf?.city].filter(Boolean).join(', ');
  } catch {
    /* next dev */
  }
  return [browser, os, place].filter(Boolean).join(' · ');
}

/** Yangi tasdiq so'rovi: yozuv yaratadi va brauzerga sir cookie'sini o'rnatadi. */
export async function createApproval(
  req: Request,
  kind: ApprovalKind,
  opts: { adminId?: string; sessionId?: string } = {}
): Promise<ApprovalRow> {
  const secret = randomToken(32);
  const now = Date.now();
  const row: ApprovalRow = {
    id: randomToken(16),
    kind,
    code: String(randomInt(10, 99)),
    admin_id: opts.adminId ?? null,
    session_id: opts.sessionId ?? null,
    status: 'pending',
    ip: clientIp(req),
    client: describeClient(req),
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + TTL_MS).toISOString(),
  };
  const jar = await cookies();
  const previous = jar.get(COOKIE)?.value;
  const db = getDb();
  await db.batch([
    db.prepare(`DELETE FROM login_requests WHERE expiresAt < ?`).bind(nowIso()),
    // Shu brauzerning avvalgi tugallanmagan so'rovi bekor bo'ladi.
    db
      .prepare(`DELETE FROM login_requests WHERE secret_hash = ?`)
      .bind(previous ? await sha256Hex(previous) : ''),
    db
      .prepare(
        `INSERT INTO login_requests
           (id, secret_hash, kind, code, admin_id, session_id, status, ip, client, createdAt, expiresAt)
         VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?)`
      )
      .bind(
        row.id,
        await sha256Hex(secret),
        row.kind,
        row.code,
        row.admin_id,
        row.session_id,
        row.ip,
        row.client,
        row.createdAt,
        row.expiresAt
      ),
  ]);
  jar.set(COOKIE, secret, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: '/',
    maxAge: TTL_MS / 1000,
  });
  return row;
}

export async function deleteApproval(id: string): Promise<void> {
  await getDb().prepare(`DELETE FROM login_requests WHERE id = ?`).bind(id).run();
}

/** ID va brauzer siri birga mos kelishi shart: eski tab yangi so'rovni yopmasin. */
export async function cancelApproval(id: string): Promise<void> {
  const jar = await cookies();
  const secret = jar.get(COOKIE)?.value;
  if (!secret || secret.length > 128) return;
  await getDb()
    .prepare(`DELETE FROM login_requests WHERE id = ? AND secret_hash = ?`)
    .bind(id, await sha256Hex(secret))
    .run();
  // Cookie 5 daqiqada tugaydi. Uni o'chiruvchi kechikkan javob yangi so'rov
  // cookie'sini o'chirib yubormasin; D1 yozuvi yo'q bo'lsa sir endi ishlamaydi.
}

const TIME_FORMAT = new Intl.DateTimeFormat('ru-RU', {
  timeZone: 'Asia/Tashkent',
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

/** Adminga raqamli tugmalar bilan tasdiq xabarini yuboradi. */
export async function sendApprovalPrompt(chatId: string, row: ApprovalRow): Promise<void> {
  const choices = new Set([row.code]);
  while (choices.size < 3) choices.add(String(randomInt(10, 99)));
  const numbers = [...choices];
  for (let i = numbers.length - 1; i > 0; i--) {
    const j = randomInt(0, i);
    [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
  }
  const buttons: InlineButton[][] = [
    numbers.map((n) => ({ text: n, callback_data: `a:${row.id}:${n}` })),
    [{ text: '❌ Bu men emas', callback_data: `a:${row.id}:x` }],
  ];
  const title =
    row.kind === 'login'
      ? "🔐 Admin panelga kirish so'rovi"
      : "⚠️ Xavfli amalni tasdiqlash (admin qo'shish yoki o'chirish)";
  const text = [
    title,
    '',
    `🖥 ${row.client}`,
    `🌐 IP: ${row.ip}`,
    `🕒 ${TIME_FORMAT.format(new Date(row.createdAt))} (Toshkent)`,
    '',
    "Saytda ko'rsatilgan raqamni tanlang.",
    "Agar bu siz bo'lmasangiz — «Bu men emas» ni bosing.",
  ].join('\n');
  await sendMessage(chatId, text, buttons);
}

/** Brauzer so'rovning holatini so'raydi; tasdiqlangan bo'lsa — sessiya beradi/yangilaydi. */
export async function pollApproval(id: string): Promise<PollResult> {
  const jar = await cookies();
  const secret = jar.get(COOKIE)?.value;
  if (!secret || secret.length > 128) return 'expired';
  const db = getDb();
  const row = await db
    .prepare(`SELECT * FROM login_requests WHERE id = ? AND secret_hash = ?`)
    .bind(id, await sha256Hex(secret))
    .first<ApprovalRow>();

  // Boshqa tab yangisini ochgan bo'lishi mumkin: uning cookie'sini o'chirmaymiz.
  if (!row) return 'expired';

  const finish = async (result: PollResult): Promise<PollResult> => {
    if (row) await deleteApproval(row.id);
    return result;
  };

  if (!(Date.parse(row.expiresAt) > Date.now())) return finish('expired');
  if (row.status === 'pending') return 'pending';
  if (row.status !== 'approved' || !row.admin_id) {
    return finish(row.status === 'not_admin' ? 'not_admin' : 'denied');
  }

  // Bir martalik: parallel poll'lar ikkita sessiya ochmasin.
  const claimed = await db
    .prepare(`DELETE FROM login_requests WHERE id = ? AND status = 'approved'`)
    .bind(row.id)
    .run();
  if (!claimed.meta.changes) return 'expired';

  if (row.kind === 'login') {
    await createSession(row.admin_id);
    await db
      .prepare(`UPDATE admins SET lastLoginAt = ? WHERE id = ?`)
      .bind(nowIso(), row.admin_id)
      .run();
  } else {
    // Qayta tasdiqlash faqat so'rovni ochgan sessiyaga tegishli.
    if (!row.session_id || row.session_id !== (await currentSessionId())) return finish('denied');
    const now = nowIso();
    const renewed = await db
      .prepare(
        `UPDATE sessions SET verifiedAt = ?1 WHERE id = ?2 AND admin_id = ?3
          AND expiresAt > ?1 AND absoluteExpiresAt > ?1`
      )
      .bind(now, row.session_id, row.admin_id)
      .run();
    if (!renewed.meta.changes) return finish('denied');
  }
  return finish('ok');
}
