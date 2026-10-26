import 'server-only';
import { getSecret } from '@/lib/cf';

interface SendArgs {
  subject: string;
  html: string;
  replyTo?: string;
}

/**
 * Admin'ga bildirishnoma xati (Resend). RESEND_API_KEY yoki ADMIN_EMAIL bo'lmasa — false.
 * Hech qachon throw qilmaydi: xat yuborilmasa ham ma'lumot bazada saqlanib qoladi.
 */
export async function sendAdminEmail({ subject, html, replyTo }: SendArgs): Promise<boolean> {
  const apiKey = getSecret('RESEND_API_KEY');
  const to = getSecret('ADMIN_EMAIL');
  if (!apiKey || !to) return false;
  const from = getSecret('RESEND_FROM') || 'Al-Xorazmiy <onboarding@resend.dev>';

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: to
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        ...(replyTo ? { reply_to: replyTo } : {}),
        subject,
        html,
      }),
    });
    if (!r.ok) console.warn('[email] Resend failed:', r.status, await r.text());
    return r.ok;
  } catch (err) {
    console.warn('[email] Resend error:', (err as Error).message);
    return false;
  }
}

/** Ikkala bildirishnoma uchun umumiy HTML qobiq. `rows` va `body` allaqachon escape qilingan bo'lishi shart. */
export function emailLayout(
  title: string,
  rows: [string, string][],
  body?: { label: string; html: string }
): string {
  const rowsHtml = rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:8px 0;color:#64748B;font-size:14px;width:120px;vertical-align:top;">${k}</td><td style="padding:8px 0;font-weight:600;">${v}</td></tr>`
    )
    .join('');
  const bodyHtml = body
    ? `<div style="background:#F8FAFC;padding:20px;border-radius:8px;border-left:4px solid #6366F1;">
         <div style="color:#64748B;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px;">${body.label}</div>
         <div style="white-space:pre-wrap;line-height:1.6;color:#0F172A;">${body.html}</div>
       </div>`
    : '';
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#F4F4F8;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#0F172A;">
  <div style="max-width:600px;margin:0 auto;padding:32px 24px;">
    <div style="background:linear-gradient(135deg,#6366F1,#8B5CF6);padding:24px;border-radius:12px 12px 0 0;color:white;">
      <h1 style="margin:0;font-size:20px;font-weight:700;">${title}</h1>
    </div>
    <div style="background:white;padding:32px 24px;border-radius:0 0 12px 12px;border:1px solid #E5E7EB;border-top:none;">
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">${rowsHtml}</table>
      ${bodyHtml}
    </div>
  </div>
</body></html>`;
}
