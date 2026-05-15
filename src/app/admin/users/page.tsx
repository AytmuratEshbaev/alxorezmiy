'use client';
import { AdminHeader } from '@/components/admin/AdminHeader';

export default function UsersAdminPage() {
  return (
    <>
      <AdminHeader title="Adminlar" />
      <div className="content-area">
        <div className="admin-card">
          <div className="card-header">
            <h2 className="card-title">Admin foydalanuvchilar</h2>
          </div>
          <div style={{ padding: 40, textAlign: 'center', color: '#64748B', lineHeight: 1.7 }}>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>👥</div>
            <p>
              Admin foydalanuvchilarni{' '}
              <a
                href="https://console.firebase.google.com/"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--primary)', fontWeight: 600 }}
              >
                Firebase Console
              </a>{' '}
              orqali boshqaring.
            </p>
            <p style={{ fontSize: '0.9rem', marginTop: 8 }}>
              Authentication &gt; Users bo&apos;limidan yangi admin qo&apos;shing va parolini belgilang.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
