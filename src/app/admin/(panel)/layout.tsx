import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth/session';
import { AuthProvider } from '@/contexts/AuthContext';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

/**
 * Himoyalangan admin sahifalari. Sessiya serverda tekshiriladi — login qilmagan
 * foydalanuvchi sahifa kodini ham, ma'lumotni ham olmaydi (API'lar ham alohida tekshiradi).
 */
export default async function PanelLayout({ children }: { children: ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect('/admin/login');

  return (
    <AuthProvider user={user}>
      <div className="admin-layout">
        <AdminSidebar />
        <main className="main-content">{children}</main>
      </div>
    </AuthProvider>
  );
}
