'use client';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { confirmDialog } from '@/components/admin/ConfirmDialog';

export function AdminHeader({ title }: { title: string }) {
  const { user, logout } = useAuth();
  const router = useRouter();

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Admin';
  const initial = (user?.displayName || user?.email || 'A')[0].toUpperCase();

  const handleLogout = async () => {
    const ok = await confirmDialog({
      title: 'Chiqishni tasdiqlang',
      message: 'Admin paneldan chiqmoqchimisiz?',
      confirmText: 'Ha, chiqish',
      cancelText: 'Bekor qilish',
      icon: '🚪'
    });
    if (!ok) return;
    await logout();
    router.replace('/admin/login');
  };

  const toggleSidebar = () => {
    document.querySelector('.sidebar')?.classList.toggle('active');
  };

  return (
    <header className="admin-navbar">
      <div className="navbar-left">
        <button className="sidebar-toggle" onClick={toggleSidebar} aria-label="Menyu">
          <svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="currentColor" strokeWidth={2}>
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <div className="page-title">{title}</div>
      </div>
      <div className="navbar-right">
        <a
          href="https://alxorezmiy.uz"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-logout"
          style={{ color: 'var(--primary)', background: 'var(--primary-soft)' }}
        >
          <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
          Saytni ochish
        </a>
        <div className="user-profile">
          <div className="user-avatar">{initial}</div>
          <div className="user-info">
            <span className="user-name">{displayName}</span>
            <span className="user-role">Admin</span>
          </div>
        </div>
        <button className="btn-logout" onClick={handleLogout}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Chiqish
        </button>
      </div>
    </header>
  );
}
