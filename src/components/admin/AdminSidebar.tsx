'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV: { section: string; items: { href: string; label: string; icon: JSX.Element }[] }[] = [
  {
    section: 'Asosiy',
    items: [
      {
        href: '/admin',
        label: 'Dashboard',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        )
      }
    ]
  },
  {
    section: 'Kontent',
    items: [
      {
        href: '/admin/news',
        label: 'Yangiliklar',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M19 20H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1m2 13a2 2 0 0 1-2-2V7m2 13a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
          </svg>
        )
      },
      {
        href: '/admin/teachers',
        label: "O'qituvchilar",
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
          </svg>
        )
      },
      {
        href: '/admin/olympiad',
        label: 'Olimpiada',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="12" cy="8" r="7" />
            <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
          </svg>
        )
      },
      {
        href: '/admin/gallery',
        label: 'Galereya',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        )
      },
      {
        href: '/admin/faq',
        label: 'FAQ',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        )
      },
      {
        href: '/admin/messages',
        label: 'Xabarlar',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )
      }
    ]
  },
  {
    section: 'Sozlamalar',
    items: [
      {
        href: '/admin/settings',
        label: 'Umumiy',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="12" cy="12" r="3" />
          </svg>
        )
      },
      {
        href: '/admin/users',
        label: 'Adminlar',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        )
      }
    ]
  }
];

export function AdminSidebar() {
  const pathname = usePathname();
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">AX</div>
        <div className="sidebar-title">Admin Panel</div>
      </div>
      <nav className="sidebar-nav">
        {NAV.map((sec) => (
          <div key={sec.section}>
            <div className="nav-section">{sec.section}</div>
            {sec.items.map((item) => {
              const active =
                item.href === '/admin'
                  ? pathname === '/admin'
                  : pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link key={item.href} href={item.href} className={active ? 'active' : ''}>
                  {item.icon}
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}
