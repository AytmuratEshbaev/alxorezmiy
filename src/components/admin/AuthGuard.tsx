'use client';
import { useEffect, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export function AuthGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (loading) return;
    if (!user && !isLoginPage) {
      router.replace('/admin/login');
    } else if (user && isLoginPage) {
      router.replace('/admin');
    }
  }, [user, loading, isLoginPage, router]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#F8FAFC',
          color: '#64748B',
          fontFamily: 'system-ui, sans-serif'
        }}
      >
        Yuklanmoqda...
      </div>
    );
  }

  if (!user && !isLoginPage) return null;
  if (user && isLoginPage) return null;

  return <>{children}</>;
}
