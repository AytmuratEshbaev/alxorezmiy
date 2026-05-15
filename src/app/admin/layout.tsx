import type { ReactNode } from 'react';
import AdminLayoutClient from './AdminLayoutClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Admin Panel | Al-Xorazmiy',
  robots: { index: false, follow: false }
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
