'use client';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AdminModal } from '@/components/admin/AdminModal';
import { TelegramApproval, startReauth } from '@/components/admin/TelegramApproval';

export interface AuthUser {
  id: string;
  telegramId: string;
  name: string;
  username: string;
  verifiedAt: string;
}

interface AuthContextValue {
  user: AuthUser;
  logout: () => Promise<void>;
  /**
   * Xavfli amal oldidan Telegram orqali qayta tasdiqlash (bot raqamli tugmalar yuboradi).
   * true — tasdiqlandi, false — foydalanuvchi bekor qildi.
   */
  reauthenticate: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function logout() {
  try {
    await fetch('/api/admin/logout', { method: 'POST', credentials: 'same-origin' });
  } finally {
    // To'liq qayta yuklash — client router keshida himoyalangan sahifalar qolmasin.
    window.location.href = '/admin/login';
  }
}

/** Foydalanuvchi serverda (panel layout) aniqlanadi va shu yerga uzatiladi. */
export function AuthProvider({ user, children }: { user: AuthUser; children: ReactNode }) {
  const [pending, setPending] = useState<((ok: boolean) => void) | null>(null);
  const attempt = useRef<{ promise: Promise<boolean>; resolve: (ok: boolean) => void } | null>(
    null
  );

  const reauthenticate = useCallback(() => {
    if (attempt.current) return attempt.current.promise;
    let complete!: (ok: boolean) => void;
    const promise = new Promise<boolean>((resolve) => {
      complete = resolve;
    });
    attempt.current = { promise, resolve: complete };
    setPending(() => complete);
    return promise;
  }, []);
  const finish = (ok: boolean) => {
    attempt.current?.resolve(ok);
    attempt.current = null;
    setPending(null);
  };

  useEffect(
    () => () => {
      attempt.current?.resolve(false);
      attempt.current = null;
    },
    []
  );

  return (
    <AuthContext.Provider value={{ user, logout, reauthenticate }}>
      {children}
      {pending && (
        <AdminModal
          title="Telegram orqali tasdiqlang"
          onRequestClose={() => finish(false)}
          width={440}
        >
          <div className="modal-body">
            <TelegramApproval
              start={startReauth}
              onApproved={() => finish(true)}
              onCancel={() => finish(false)}
            />
          </div>
        </AdminModal>
      )}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
