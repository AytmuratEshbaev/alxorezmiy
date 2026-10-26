import type { ReactNode } from 'react';
import '@/styles/globals.css';
import '@/styles/admin.css';
import { fontVariables } from '@/lib/fonts';
import { ConfirmDialogHost } from '@/components/admin/ConfirmDialog';
import { ToastHost } from '@/components/admin/Toast';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Admin Panel | Al-Xorazmiy',
  robots: { index: false, follow: false }
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className={fontVariables} style={{ display: 'contents' }}>
      {children}
      <ConfirmDialogHost />
      <ToastHost />
    </div>
  );
}
