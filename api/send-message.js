// ============================================
// SEND MESSAGE — Vercel Function (Resend API)
// ============================================
// Contact form xabar adminga email yuboradi.
// Required env vars (Vercel dashboard):
//   RESEND_API_KEY  — re_... (Resend dashboard'dan)
//   ADMIN_EMAIL     — kim'ga yuborish (admin email)

function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[m]));
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, email, subject, message } = req.body || {};

  // Validation
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: 'Barcha maydonlar to\'ldirilishi shart' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Email format noto\'g\'ri' });
  }
  if (message.length > 5000 || subject.length > 200 || name.length > 100) {
    return res.status(400).json({ error: 'Maydonlar uzunligi cheklovdan oshib ketdi' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.ADMIN_EMAIL;

  if (!apiKey || !to) {
    console.error('Missing env: RESEND_API_KEY or ADMIN_EMAIL');
    // Email yubora olmayapmiz, lekin Firestore'ga yozilgani uchun
    // user javobi muvaffaqiyatli — log qilamiz va davom etamiz
    return res.status(200).json({ ok: true, emailSent: false, note: 'Email service not configured' });
  }

  const html = `
    <!DOCTYPE html>
    <html><body style="margin:0;padding:0;background:#F4F4F8;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#0F172A;">
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
          <div style="margin-top:24px;padding-top:24px;border-top:1px solid #E5E7EB;font-size:13px;color:#94A3B8;">
            Bu xabar <a href="https://alxorezmiy.uz/contact" style="color:#6366F1;">alxorezmiy.uz/contact</a> orqali yuborildi.<br>
            Javob berish uchun shu emailga "Reply" bosing — ${escapeHtml(email)}'ga boradi.
          </div>
        </div>
      </div>
    </body></html>
  `;

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Al-Xorazmiy <onboarding@resend.dev>',
        to: [to],
        reply_to: email,
        subject: `[Sayt] ${subject}`,
        html: html
      })
    });

    if (!r.ok) {
      const errText = await r.text();
      console.error('Resend API error:', r.status, errText);
      return res.status(500).json({ error: 'Email yuborilmadi', detail: errText });
    }

    return res.status(200).json({ ok: true, emailSent: true });
  } catch (err) {
    console.error('Send error:', err);
    return res.status(500).json({ error: err.message });
  }
}
