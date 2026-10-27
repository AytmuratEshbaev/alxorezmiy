'use client';
import { useState } from 'react';
import { TelegramApproval, startLogin } from '@/components/admin/TelegramApproval';

export default function LoginForm({ configured, next }: { configured: boolean; next: string }) {
  const [started, setStarted] = useState(false);

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">AX</div>
        <h1 className="login-title">Tizimga kirish</h1>

        {!configured ? (
          <div role="alert" className="tg-approval-error">
            Kirish sozlanmagan: TELEGRAM_BOT_TOKEN o&apos;rnatilmagan.
          </div>
        ) : started ? (
          <TelegramApproval
            start={startLogin}
            // To'liq yuklash: server panel layout'i yangi sessiya cookie'si bilan render qilinadi.
            onApproved={() => window.location.assign(next)}
            onCancel={() => setStarted(false)}
          />
        ) : (
          <>
            <p className="login-desc">
              Maktab admin paneliga kirish har safar Telegram bot orqali tasdiqlanadi
            </p>
            <button
              type="button"
              className="btn btn-primary tg-approval-open"
              onClick={() => setStarted(true)}
            >
              Telegram orqali kirish
            </button>
          </>
        )}
      </div>
    </div>
  );
}
