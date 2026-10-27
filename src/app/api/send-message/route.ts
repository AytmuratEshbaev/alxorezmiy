import { NextResponse } from 'next/server';
import { escapeHtml } from '@/lib/utils';
import { getDb, runInBackground } from '@/lib/cf';
import { isSameOrigin, readJson, jsonError } from '@/lib/http';
import { rateLimit, clientIp } from '@/lib/rate-limit';
import { verifyTurnstile } from '@/lib/turnstile';
import { sendAdminEmail, emailLayout } from '@/lib/email';
import { newId, nowIso } from '@/lib/db/rows';

interface Body {
  name?: unknown;
  email?: unknown;
  subject?: unknown;
  message?: unknown;
  website?: unknown;
  turnstileToken?: unknown;
}

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return jsonError('Forbidden', 403);

  const body = await readJson<Body>(req);
  if (!body) return jsonError('Invalid JSON', 400);

  // Honeypot: odamlar yashirin "website" maydonini to'ldirmaydi, botlar to'ldiradi.
  // Soxta muvaffaqiyat qaytaramiz — bot rad etilganini bilmasin.
  if (str(body.website)) return NextResponse.json({ ok: true });

  const ip = clientIp(req);
  if (!(await rateLimit('FORM_LIMITER', `send-message:${ip}`))) {
    return jsonError("Juda ko'p so'rov. Iltimos, birozdan keyin urinib ko'ring.", 429);
  }

  const name = str(body.name);
  const email = str(body.email);
  const subject = str(body.subject);
  const message = str(body.message);

  if (!name || !email || !subject || !message) {
    return jsonError("Barcha maydonlar to'ldirilishi shart", 400);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return jsonError("Email format noto'g'ri", 400);
  }
  if (message.length > 5000 || subject.length > 200 || name.length > 100) {
    return jsonError('Maydonlar uzunligi cheklovdan oshib ketdi', 400);
  }
  if (!(await verifyTurnstile(str(body.turnstileToken), ip))) {
    return jsonError("Tekshiruvdan o'tilmadi. Sahifani yangilab, qayta urinib ko'ring.", 403);
  }

  let persisted = false;
  try {
    const now = nowIso();
    await getDb()
      .prepare(
        `INSERT INTO messages (id, name, email, subject, message, read, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, 0, ?, ?)`
      )
      .bind(newId(), name, email, subject, message, now, now)
      .run();
    persisted = true;
  } catch (err) {
    console.error('[send-message] D1 persist failed:', (err as Error).message);
  }

  const notification = sendAdminEmail({
    subject: `[Sayt] ${subject}`,
    replyTo: email,
    html: emailLayout(
      '📨 Yangi xabar — Al-Xorazmiy maktabi',
      [
        ['Ism:', escapeHtml(name)],
        ['Email:', `<a href="mailto:${escapeHtml(email)}" style="color:#6366F1;">${escapeHtml(email)}</a>`],
        ['Mavzu:', escapeHtml(subject)]
      ],
      { label: 'Xabar matni:', html: escapeHtml(message) }
    )
  });

  // Saqlangan bo'lsa — xatni fonda yuboramiz (foydalanuvchi Resend javobini kutmaydi).
  // Saqlanmagan bo'lsa — xat yagona kanal, natijasini kutamiz.
  if (persisted) {
    runInBackground(notification);
  } else if (!(await notification)) {
    return jsonError('Message could not be processed', 503);
  }
  return NextResponse.json({ ok: true });
}
