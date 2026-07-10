import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { escapeHtml } from '@/lib/utils';
import { rateLimit, clientIp } from '@/lib/rate-limit';
import { adminDb } from '@/lib/firebase/admin';

const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_SITE_URL || 'https://alxorezmiy.uz',
  ...(process.env.NODE_ENV !== 'production' ? ['http://localhost:3000'] : [])
];

function corsHeaders(origin: string | null): Record<string, string> {
  const allowed = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin'
  };
}

export async function OPTIONS(req: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req.headers.get('origin')) });
}

export async function POST(req: Request) {
  const origin = req.headers.get('origin');
  const headers = corsHeaders(origin);

  let body: {
    studentName?: string;
    phone?: string;
    grade?: string;
    message?: string;
    website?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400, headers });
  }

  // Honeypot — fake success for bots.
  if (body.website && body.website.trim() !== '') {
    return NextResponse.json({ ok: true }, { headers });
  }

  // Rate-limit by IP: 5 requests / 10 minutes.
  if (!rateLimit(`apply:${clientIp(req)}`, { limit: 5, windowMs: 10 * 60 * 1000 })) {
    return NextResponse.json(
      { error: "Juda ko'p so'rov. Iltimos, birozdan keyin urinib ko'ring." },
      { status: 429, headers }
    );
  }

  const studentName = body.studentName?.trim() || '';
  const phone = body.phone?.trim() || '';
  const grade = body.grade?.trim() || '';
  const message = body.message?.trim() || '';

  if (!studentName || !phone || !grade) {
    return NextResponse.json({ error: "Barcha majburiy maydonlar to'ldirilishi shart" }, { status: 400, headers });
  }
  // Loose phone validation: digits, spaces, +, -, () — 7 to 20 chars.
  if (!/^[+\d][\d\s()-]{6,19}$/.test(phone)) {
    return NextResponse.json({ error: "Telefon raqami noto'g'ri" }, { status: 400, headers });
  }
  if (studentName.length > 120 || grade.length > 20 || message.length > 2000) {
    return NextResponse.json({ error: 'Maydonlar uzunligi cheklovdan oshib ketdi' }, { status: 400, headers });
  }

  // (a) Best-effort persistence to the `applications` collection.
  let persisted = false;
  try {
    await adminDb.collection('applications').add({
      studentName,
      phone,
      grade,
      message,
      status: 'new',
      read: false,
      createdAt: FieldValue.serverTimestamp()
    });
    persisted = true;
  } catch (err) {
    console.warn('[apply] Firestore persist failed:', (err as Error).message);
  }

  // (b) Notification email via Resend, if configured.
  let emailSent = false;
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.ADMIN_EMAIL;
  if (apiKey && to) {
    const html = `
      <!DOCTYPE html><html><body style="margin:0;padding:0;background:#F4F4F8;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#0F172A;">
        <div style="max-width:600px;margin:0 auto;padding:32px 24px;">
          <div style="background:linear-gradient(135deg,#6366F1,#8B5CF6);padding:24px;border-radius:12px 12px 0 0;color:white;">
            <h1 style="margin:0;font-size:20px;font-weight:700;">🎓 Yangi qabul arizasi — Al-Xorazmiy maktabi</h1>
          </div>
          <div style="background:white;padding:32px 24px;border-radius:0 0 12px 12px;border:1px solid #E5E7EB;border-top:none;">
            <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
              <tr><td style="padding:8px 0;color:#64748B;font-size:14px;width:120px;">O'quvchi:</td><td style="padding:8px 0;font-weight:600;">${escapeHtml(studentName)}</td></tr>
              <tr><td style="padding:8px 0;color:#64748B;font-size:14px;">Telefon:</td><td style="padding:8px 0;"><a href="tel:${escapeHtml(phone)}" style="color:#6366F1;">${escapeHtml(phone)}</a></td></tr>
              <tr><td style="padding:8px 0;color:#64748B;font-size:14px;">Sinf:</td><td style="padding:8px 0;font-weight:600;">${escapeHtml(grade)}</td></tr>
            </table>
            ${
              message
                ? `<div style="background:#F8FAFC;padding:20px;border-radius:8px;border-left:4px solid #6366F1;">
            <div style="color:#64748B;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px;">Xabar:</div>
            <div style="white-space:pre-wrap;line-height:1.6;color:#0F172A;">${escapeHtml(message)}</div>
          </div>`
                : ''
            }
          </div>
        </div>
      </body></html>
    `;
    try {
      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'Al-Xorazmiy <onboarding@resend.dev>',
          to: [to],
          subject: `[Qabul] ${studentName} — ${grade}-sinf`,
          html
        })
      });
      emailSent = r.ok;
      if (!r.ok) {
        console.warn('[apply] Resend failed:', await r.text());
      }
    } catch (err) {
      console.warn('[apply] Resend error:', (err as Error).message);
    }
  }

  // Succeed if EITHER channel worked; 503 only when both are unavailable.
  if (!persisted && !emailSent) {
    return NextResponse.json(
      { error: 'Application could not be processed' },
      { status: 503, headers }
    );
  }

  return NextResponse.json({ ok: true, persisted, emailSent }, { headers });
}
