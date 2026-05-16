'use client';
import '@/styles/globals.css';
import '@/styles/admin.css';
import { usePathname } from 'next/navigation';
import { AuthProvider } from '@/contexts/AuthContext';
import { AuthGuard } from '@/components/admin/AuthGuard';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { ConfirmDialogHost } from '@/components/admin/ConfirmDialog';
import { ToastHost } from '@/components/admin/Toast';
import type { ReactNode } from 'react';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/admin/login';

  return (
    <AuthProvider>
      <AuthGuard>
        {isLoginPage ? (
          children
        ) : (
          <div className="admin-layout">
            <AdminSidebar />
            <main className="main-content">{children}</main>
          </div>
        )}
        <ConfirmDialogHost />
        <ToastHost />
      </AuthGuard>
    </AuthProvider>
  );
}
