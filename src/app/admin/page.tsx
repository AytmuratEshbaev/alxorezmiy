'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { getDocuments } from '@/lib/firebase/client-queries';
import { useAuth } from '@/contexts/AuthContext';

interface Counts {
  news: number;
  teachers: number;
  olympiad: number;
  gallery: number;
  faq: number;
  unreadMessages: number;
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
  { key: 'unreadMessages', href: '/admin/messages', label: 'Yangi xabarlar', icon: '💬', bg: 'rgba(99,102,241,0.12)', color: '#6366F1' }
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
  const [counts, setCounts] = useState<Counts>({
    news: 0,
    teachers: 0,
    olympiad: 0,
    gallery: 0,
    faq: 0,
    unreadMessages: 0
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [news, teachers, olympiad, gallery, faq, messages] = await Promise.all([
          getDocuments<{ id: string }>('news'),
          getDocuments<{ id: string }>('teachers'),
          getDocuments<{ id: string }>('olympiad'),
          getDocuments<{ id: string }>('gallery'),
          getDocuments<{ id: string }>('faq'),
          getDocuments<{ id: string; read?: boolean }>('messages')
        ]);
        if (cancelled) return;
        setCounts({
          news: news.length,
          teachers: teachers.length,
          olympiad: olympiad.length,
          gallery: gallery.length,
          faq: faq.length,
          unreadMessages: messages.filter((m) => !m.read).length
        });
      } catch (err) {
        console.error('Dashboard counts error:', err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const greeting = user?.displayName || user?.email?.split('@')[0] || 'Admin';

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
        <div className="stat-cards">
          {STAT_CARDS.map((card) => (
            <Link key={card.key} href={card.href}>
              <div className="stat-card">
                <div className="stat-icon" style={{ background: card.bg, color: card.color }}>
                  {card.icon}
                </div>
                <div className="stat-info">
                  <h3>{card.label}</h3>
                  <div className="value">{counts[card.key]}</div>
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
              <svg className="quick-action-arrow" width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
