import { NextResponse } from 'next/server';
import { escapeHtml } from '@/lib/utils';

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

  let body: { name?: string; email?: string; subject?: string; message?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400, headers });
  }

  const { name, email, subject, message } = body;
  if (!name || !email || !subject || !message) {
    return NextResponse.json({ error: "Barcha maydonlar to'ldirilishi shart" }, { status: 400, headers });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Email format noto'g'ri" }, { status: 400, headers });
  }
  if (message.length > 5000 || subject.length > 200 || name.length > 100) {
    return NextResponse.json({ error: 'Maydonlar uzunligi cheklovdan oshib ketdi' }, { status: 400, headers });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.ADMIN_EMAIL;
  if (!apiKey || !to) {
    return NextResponse.json({ ok: true, emailSent: false, note: 'Email service not configured' }, { headers });
  }

  const html = `
    <!DOCTYPE html><html><body style="margin:0;padding:0;background:#F4F4F8;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#0F172A;">
      <div style="max-width:600px;margin:0 auto;padding:32px 24px;">
        <div style="background:linear-gradient(135deg,#6366F1,#8B5CF6);padding:24px;border-radius:12px 12px 0 0;color:white;">
          <h1 style="margin:0;font-size:20px;font-weight:700;">📨 Yangi xabar — Al-Xorazmiy maktabi</h1>
        </div>
        <div style="background:white;padding:32px 24px;border-radius:0 0 12px 12px;border:1px solid #E5E7EB;border-top:none;">
          <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
            <tr><td style="padding:8px 0;color:#64748B;font-size:14px;width:90px;">Ism:</td><td style="padding:8px 0;font-weight:600;">${escapeHtml(name)}</td></tr>
            <tr><td style="padding:8px 0;color:#64748B;font-size:14px;">Email:</td><td style="padding:8px 0;"><a href="mailto:${escapeHtml(email)}" style="color:#6366F1;">${escapeHtml(email)}</a></td></tr>
            <tr><td style="padding:8px 0;color:#64748B;font-size:14px;">Mavzu:</td><td style="padding:8px 0;font-weight:600;">${escapeHtml(subject)}</td></tr>
          </table>
          <div style="background:#F8FAFC;padding:20px;border-radius:8px;border-left:4px solid #6366F1;">
            <div style="color:#64748B;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px;">Xabar matni:</div>
            <div style="white-space:pre-wrap;line-height:1.6;color:#0F172A;">${escapeHtml(message)}</div>
          </div>
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
        reply_to: email,
        subject: `[Sayt] ${subject}`,
        html
      })
    });
    if (!r.ok) {
      const errText = await r.text();
      return NextResponse.json({ error: 'Email yuborilmadi', detail: errText }, { status: 500, headers });
    }
    return NextResponse.json({ ok: true, emailSent: true }, { headers });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500, headers });
  }
}
