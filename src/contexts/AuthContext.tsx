'use client';
import { createContext, useContext, type ReactNode } from 'react';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

interface AuthContextValue {
  user: AuthUser;
  logout: () => Promise<void>;
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
  return <AuthContext.Provider value={{ user, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
