'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Telegram orqali tasdiqlash oynasi (kirish va qayta tasdiqlash uchun umumiy).
 * `start` so'rov ochadi va saytda ko'rsatiladigan raqamni qaytaradi; keyin komponent
 * /api/admin/login/poll orqali tasdiqni kutadi. Server tomoni: lib/auth/approval.ts.
 */
export interface ApprovalStart {
  id: string;
  code: string;
  /** Faqat kirishda: botga deep link. Qayta tasdiqlashda bot o'zi xabar yuboradi. */
  url?: string;
  expiresAt: string;
}

type Result = 'ok' | 'denied' | 'not_admin' | 'expired';
type State =
  | { phase: 'starting' }
  | { phase: 'cancelling' }
  | { phase: 'waiting'; start: ApprovalStart }
  | { phase: 'failed'; result: Exclude<Result, 'ok'> | 'error'; message?: string };

const POLL_MS = 2000;

async function postJson<T>(url: string, body?: object): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    credentials: 'same-origin',
    ...(body
      ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
      : {}),
    signal: AbortSignal.timeout(15_000),
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(data.error || `Xatolik (${res.status})`);
  return data;
}

export const startLogin = () => postJson<ApprovalStart>('/api/admin/login');
export const startReauth = () => postJson<ApprovalStart>('/api/admin/reauth');

async function cancelRemote(id: string): Promise<void> {
  await fetch('/api/admin/login', {
    method: 'DELETE',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
    keepalive: true,
    signal: AbortSignal.timeout(10_000),
  }).catch(() => {});
}

const FAIL_TEXT: Record<Exclude<Result, 'ok'>, string> = {
  denied: "So'rov rad etildi (yoki noto'g'ri raqam tanlandi).",
  not_admin:
    "Bu Telegram akkaunt admin sifatida qo'shilmagan. Bot sizga Telegram ID'ingizni yubordi — uni mavjud adminga yuboring.",
  expired: "Vaqt tugadi — so'rov 5 daqiqa amal qiladi.",
};

function useCountdown(until: string | null): string {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!until) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [until]);
  if (!until) return '';
  const left = Math.max(0, Math.round((Date.parse(until) - now) / 1000));
  return `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
}

export function TelegramApproval({
  start,
  onApproved,
  onCancel,
}: {
  start: () => Promise<ApprovalStart>;
  onApproved: () => void;
  onCancel?: () => void;
}) {
  const [state, setState] = useState<State>({ phase: 'starting' });
  const run = useRef(0);
  const activeId = useRef<string | null>(null);
  const onApprovedRef = useRef(onApproved);
  onApprovedRef.current = onApproved;

  const begin = useCallback(async () => {
    const id = ++run.current;
    const alive = () => id === run.current;
    setState({ phase: 'starting' });
    let info: ApprovalStart;
    try {
      info = await start();
    } catch (err) {
      if (alive()) setState({ phase: 'failed', result: 'error', message: (err as Error).message });
      return;
    }
    if (!alive()) {
      await cancelRemote(info.id);
      return;
    }
    activeId.current = info.id;
    setState({ phase: 'waiting', start: info });

    while (alive()) {
      await new Promise((r) => setTimeout(r, POLL_MS));
      if (!alive()) return;
      if (Date.now() >= Date.parse(info.expiresAt)) {
        activeId.current = null;
        run.current++;
        setState({ phase: 'failed', result: 'expired' });
        void cancelRemote(info.id);
        return;
      }
      let status: Result | 'pending';
      try {
        status = (
          await postJson<{ status: Result | 'pending' }>('/api/admin/login/poll', { id: info.id })
        ).status;
      } catch {
        continue; // vaqtinchalik tarmoq xatosi — kutishda davom etamiz
      }
      if (!alive() || status === 'pending') continue;
      activeId.current = null;
      run.current++;
      if (status === 'ok') onApprovedRef.current();
      else setState({ phase: 'failed', result: status });
      return;
    }
  }, [start]);

  useEffect(() => {
    // React Strict Mode'ning sinov mount'i serverda ikkinchi so'rov ochmasin.
    const timer = setTimeout(() => void begin(), 0);
    return () => {
      clearTimeout(timer);
      // eslint-disable-next-line react-hooks/exhaustive-deps -- so'rov hisoblagichi, DOM ref emas: unmount'da kutishni to'xtatish uchun ataylab oshiriladi
      run.current++;
      const id = activeId.current;
      activeId.current = null;
      if (id) void cancelRemote(id);
    };
  }, [begin]);

  const cancel = async () => {
    run.current++;
    const id = activeId.current;
    activeId.current = null;
    setState({ phase: 'cancelling' });
    if (id) await cancelRemote(id);
    onCancel?.();
  };

  const countdown = useCountdown(state.phase === 'waiting' ? state.start.expiresAt : null);

  if (state.phase === 'starting') {
    return (
      <p className="login-desc" role="status">
        So‘rov tayyorlanmoqda…
      </p>
    );
  }

  if (state.phase === 'cancelling') {
    return (
      <p className="login-desc" role="status">
        So‘rov bekor qilinmoqda…
      </p>
    );
  }

  if (state.phase === 'failed') {
    return (
      <div>
        <div role="alert" className="tg-approval-error">
          {state.result === 'error' ? state.message : FAIL_TEXT[state.result]}
        </div>
        <div className="tg-approval-actions">
          {onCancel && (
            <button type="button" className="btn btn-outline" onClick={() => void cancel()}>
              Bekor qilish
            </button>
          )}
          <button type="button" className="btn btn-primary" onClick={() => void begin()}>
            Qayta urinish
          </button>
        </div>
      </div>
    );
  }

  const { code, url } = state.start;
  return (
    <div aria-live="polite">
      <p className="login-desc">
        {url
          ? "Telegram'da botni oching va quyidagi raqamni tanlang:"
          : "Telegram'ga xabar yuborildi. Botda quyidagi raqamni tanlang:"}
      </p>
      <div
        className="tg-approval-code"
        aria-label={`Tasdiqlash raqami ${code.split('').join(' ')}`}
      >
        {code}
      </div>
      {url && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary tg-approval-open"
        >
          Telegram&apos;ni ochish
        </a>
      )}
      <p className="form-hint form-hint-block">
        Tasdiq kutilmoqda... {countdown}
        <br />
        Botdagi xabarda brauzer va IP manzil ko&apos;rsatiladi — ular sizniki ekanini tekshiring.
      </p>
      {onCancel && (
        <div className="tg-approval-actions">
          <button type="button" className="btn btn-outline" onClick={() => void cancel()}>
            Bekor qilish
          </button>
        </div>
      )}
    </div>
  );
}
