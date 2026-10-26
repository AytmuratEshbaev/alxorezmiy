import { NextResponse } from 'next/server';
import { escapeHtml } from '@/lib/utils';
import { getDb } from '@/lib/cf';
import { isSameOrigin, readJson, jsonError } from '@/lib/http';
import { rateLimit, clientIp } from '@/lib/rate-limit';
import { verifyTurnstile } from '@/lib/turnstile';
import { sendAdminEmail, emailLayout } from '@/lib/email';
import { newId, nowIso } from '@/lib/db/rows';

interface Body {
  studentName?: unknown;
  phone?: unknown;
  grade?: unknown;
  message?: unknown;
  website?: unknown;
  turnstileToken?: unknown;
}

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return jsonError('Forbidden', 403);

  const body = await readJson<Body>(req);
  if (!body) return jsonError('Invalid JSON', 400);

  // Honeypot — botlar uchun soxta muvaffaqiyat.
  if (str(body.website)) return NextResponse.json({ ok: true });

  const ip = clientIp(req);
  if (!(await rateLimit('FORM_LIMITER', `apply:${ip}`))) {
    return jsonError("Juda ko'p so'rov. Iltimos, birozdan keyin urinib ko'ring.", 429);
  }

  const studentName = str(body.studentName);
  const phone = str(body.phone);
  const grade = str(body.grade);
  const message = str(body.message);

  if (!studentName || !phone || !grade) {
    return jsonError("Barcha majburiy maydonlar to'ldirilishi shart", 400);
  }
  // Telefon: raqamlar, bo'sh joy, +, -, () — 7–20 belgi.
  if (!/^[+\d][\d\s()-]{6,19}$/.test(phone)) {
    return jsonError("Telefon raqami noto'g'ri", 400);
  }
  if (studentName.length > 120 || grade.length > 20 || message.length > 2000) {
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
        `INSERT INTO applications (id, studentName, phone, grade, message, status, read, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, 'new', 0, ?, ?)`
      )
      .bind(newId(), studentName, phone, grade, message, now, now)
      .run();
    persisted = true;
  } catch (err) {
    console.error('[apply] D1 persist failed:', (err as Error).message);
  }

  const emailSent = await sendAdminEmail({
    subject: `[Qabul] ${studentName} — ${grade}-sinf`,
    html: emailLayout(
      '🎓 Yangi qabul arizasi — Al-Xorazmiy maktabi',
      [
        ["O'quvchi:", escapeHtml(studentName)],
        ['Telefon:', `<a href="tel:${escapeHtml(phone)}" style="color:#6366F1;">${escapeHtml(phone)}</a>`],
        ['Sinf:', escapeHtml(grade)]
      ],
      message ? { label: 'Xabar:', html: escapeHtml(message) } : undefined
    )
  });

  if (!persisted && !emailSent) return jsonError('Application could not be processed', 503);
  return NextResponse.json({ ok: true });
}
