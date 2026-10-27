'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { apiFetch } from '@/lib/admin-api';
import { useAuth } from '@/contexts/AuthContext';

interface Counts {
  news: number;
  teachers: number;
  olympiad: number;
  gallery: number;
  faq: number;
  unreadMessages: number;
  newApplications: number;
}

const STAT_CARDS: {
  key: keyof Counts;
  href: string;
  label: string;
  icon: string;
  bg: string;
  color: string;
}[] = [
  { key: 'news', href: '/admin/news', label: 'Yangiliklar', icon: '📰', bg: 'rgba(59,130,246,0.12)', color: '#3B82F6' },
  { key: 'teachers', href: '/admin/teachers', label: "O'qituvchilar", icon: '👨‍🏫', bg: 'rgba(16,185,129,0.12)', color: '#10B981' },
  { key: 'olympiad', href: '/admin/olympiad', label: 'Olimpiada', icon: '🏆', bg: 'rgba(245,158,11,0.12)', color: '#F59E0B' },
  { key: 'gallery', href: '/admin/gallery', label: 'Galereya', icon: '🖼', bg: 'rgba(168,85,247,0.12)', color: '#A855F7' },
  { key: 'faq', href: '/admin/faq', label: 'FAQ', icon: '❓', bg: 'rgba(239,68,68,0.12)', color: '#EF4444' },
  { key: 'newApplications', href: '/admin/applications', label: "Ko'rilmagan arizalar", icon: '🎓', bg: 'rgba(14,165,233,0.12)', color: '#0EA5E9' },
  { key: 'unreadMessages', href: '/admin/messages', label: "O'qilmagan xabarlar", icon: '💬', bg: 'rgba(99,102,241,0.12)', color: '#6366F1' }
];

const QUICK_ACTIONS = [
  { href: '/admin/news', icon: '📰', title: "Yangilik qo'shish", desc: 'Maktab haqida yangilik nashr qilish' },
  { href: '/admin/teachers', icon: '👨‍🏫', title: "O'qituvchi qo'shish", desc: "Yangi pedagog ma'lumotlari" },
  { href: '/admin/olympiad', icon: '🏆', title: 'Olimpiada natijasi', desc: "G'olibni qo'shish, yutuqlar" },
  { href: '/admin/gallery', icon: '🖼', title: 'Rasm yuklash', desc: 'Galereya uchun yangi foto' },
  { href: '/admin/settings', icon: '⚙️', title: 'Sozlamalar', desc: 'Maktab nomi, kontakt, statistika' },
  { href: '/admin/messages', icon: '💬', title: 'Xabarlar', desc: "Foydalanuvchilardan kelgan xabarlar" }
];

export default function DashboardPage() {
  const { user } = useAuth();
  const [counts, setCounts] = useState<Counts | null>(null);
  const [error, setError] = useState<string | null>(null);
  const seq = useRef(0);

  const load = useCallback(async () => {
    const mine = ++seq.current;
    try {
      const data = await apiFetch<Counts>('/api/admin/stats');
      if (mine !== seq.current) return;
      setCounts(data);
      setError(null);
    } catch (err) {
      if (mine !== seq.current) return;
      console.error('Dashboard counts error:', err);
      setError((err as Error).message || "Statistikani yuklab bo'lmadi");
    }
  }, []);

  useEffect(() => {
    void load();
    const onVisible = () => {
      if (document.visibilityState === 'visible') void load();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps -- so'rov hisoblagichi, DOM ref emas: eskirgan javoblarni bekor qilish uchun ataylab oshiriladi
      seq.current++;
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [load]);

  const greeting = user.name || user.email.split('@')[0] || 'Admin';

  return (
    <>
      <AdminHeader title="Dashboard" />
      <div className="content-area">
        <div className="welcome-banner">
          <div className="welcome-greeting">Salom, {greeting}</div>
          <h1>Al-Xorazmiy maktabi boshqaruv paneli</h1>
          <p>
            Yangiliklar, o&apos;qituvchilar, olimpiada natijalari va boshqa kontentni shu yerdan boshqarasiz.
          </p>
        </div>

        <h2 className="admin-section-title">📊 Statistika</h2>
        {error && (
          <div className="alert alert-error" role="alert">
            <span>Statistikani yuklab bo&apos;lmadi: {error}</span>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => void load()}>
              Qayta urinish
            </button>
          </div>
        )}
        <div className="stat-cards">
          {STAT_CARDS.map((card) => (
            <Link key={card.key} href={card.href}>
              <div className="stat-card">
                <div className="stat-icon" style={{ background: card.bg, color: card.color }}>
                  {card.icon}
                </div>
                <div className="stat-info">
                  <h3>{card.label}</h3>
                  <div className="value">{counts ? counts[card.key] : '—'}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <h2 className="admin-section-title">⚡ Tezkor amallar</h2>
        <div className="quick-actions">
          {QUICK_ACTIONS.map((q) => (
            <Link key={q.href} href={q.href} className="quick-action">
              <div className="quick-action-icon">{q.icon}</div>
              <div className="quick-action-text">
                <div className="quick-action-title">{q.title}</div>
                <div className="quick-action-desc">{q.desc}</div>
              </div>
              <svg
                aria-hidden="true"
                className="quick-action-arrow" width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
