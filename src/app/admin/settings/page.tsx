'use client';
import { useEffect, useState, type FormEvent } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { toast } from '@/components/admin/Toast';
import { db } from '@/lib/firebase/client';

type Lang = 'uz' | 'ru' | 'kk' | 'en';
const LANGS: Lang[] = ['uz', 'ru', 'kk', 'en'];
const LANG_LABELS: Record<Lang, string> = {
  uz: "🇺🇿 O'zbek",
  ru: '🇷🇺 Русский',
  kk: '🏳️ Qaraqalpaq',
  en: '🇬🇧 English'
};

interface Settings {
  fullName_uz?: string;
  fullName_ru?: string;
  fullName_kk?: string;
  fullName_en?: string;
  shortName_uz?: string;
  shortName_ru?: string;
  shortName_kk?: string;
  shortName_en?: string;
  address?: string;
  phone?: string;
  email?: string;
  hours?: string;
  telegram?: string;
  instagram?: string;
  facebook?: string;
  youtube?: string;
  students_count?: number;
  teachers_count?: number;
  experience_years?: number;
  olympiad_winners?: number;
}

interface FormState {
  fullName: Record<Lang, string>;
  shortName: Record<Lang, string>;
  address: string;
  phone: string;
  email: string;
  hours: string;
  telegram: string;
  instagram: string;
  facebook: string;
  youtube: string;
  students_count: number;
  teachers_count: number;
  experience_years: number;
  olympiad_winners: number;
}

const emptyForm = (): FormState => ({
  fullName: { uz: '', ru: '', kk: '', en: '' },
  shortName: { uz: '', ru: '', kk: '', en: '' },
  address: '',
  phone: '',
  email: '',
  hours: '',
  telegram: '',
  instagram: '',
  facebook: '',
  youtube: '',
  students_count: 0,
  teachers_count: 0,
  experience_years: 0,
  olympiad_winners: 0
});

export default function SettingsAdminPage() {
  const [form, setForm] = useState<FormState>(emptyForm());
  const [activeLang, setActiveLang] = useState<Lang>('uz');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'settings', 'main'));
        if (cancelled) return;
        if (snap.exists()) {
          const d = snap.data() as Settings;
          setForm({
            fullName: {
              uz: d.fullName_uz || '',
              ru: d.fullName_ru || '',
              kk: d.fullName_kk || '',
              en: d.fullName_en || ''
            },
            shortName: {
              uz: d.shortName_uz || '',
              ru: d.shortName_ru || '',
              kk: d.shortName_kk || '',
              en: d.shortName_en || ''
            },
            address: d.address || '',
            phone: d.phone || '',
            email: d.email || '',
            hours: d.hours || '',
            telegram: d.telegram || '',
            instagram: d.instagram || '',
            facebook: d.facebook || '',
            youtube: d.youtube || '',
            students_count: d.students_count || 0,
            teachers_count: d.teachers_count || 0,
            experience_years: d.experience_years || 0,
            olympiad_winners: d.olympiad_winners || 0
          });
        }
      } catch (err) {
        console.error('Load settings error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      await setDoc(
        doc(db, 'settings', 'main'),
        {
          fullName_uz: form.fullName.uz.trim(),
          fullName_ru: form.fullName.ru.trim(),
          fullName_kk: form.fullName.kk.trim(),
          fullName_en: form.fullName.en.trim(),
          shortName_uz: form.shortName.uz.trim(),
          shortName_ru: form.shortName.ru.trim(),
          shortName_kk: form.shortName.kk.trim(),
          shortName_en: form.shortName.en.trim(),
          address: form.address.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          hours: form.hours.trim(),
          telegram: form.telegram.trim(),
          instagram: form.instagram.trim(),
          facebook: form.facebook.trim(),
          youtube: form.youtube.trim(),
          students_count: form.students_count,
          teachers_count: form.teachers_count,
          experience_years: form.experience_years,
          olympiad_winners: form.olympiad_winners,
          updatedAt: serverTimestamp()
        },
        { merge: true }
      );
      setMsg({ text: 'Sozlamalar saqlandi', ok: true });
      toast.success('Sozlamalar saqlandi');
    } catch (err) {
      const text = 'Xatolik: ' + (err as Error).message;
      setMsg({ text, ok: false });
      toast.error(text);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <AdminHeader title="Sozlamalar" />
        <div className="content-area">
          <div style={{ padding: 40, textAlign: 'center', color: '#64748B' }}>Yuklanmoqda...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <AdminHeader title="Sozlamalar" />
      <div className="content-area">
        <form onSubmit={handleSubmit}>
          <div className="admin-card">
            <div className="card-header">
              <h2 className="card-title">Maktab nomi</h2>
            </div>
            <div className="lang-tabs-bar">
              {LANGS.map((l) => (
                <button key={l} type="button" className={'lang-tab ' + (activeLang === l ? 'active' : '')} onClick={() => setActiveLang(l)}>
                  {LANG_LABELS[l]}
                </button>
              ))}
            </div>
            {LANGS.map((l) => (
              <div key={l} style={{ display: activeLang === l ? 'block' : 'none' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="form-group">
                    <label>To&apos;liq nom ({l.toUpperCase()})</label>
                    <input
                      type="text"
                      className="form-control"
                      value={form.fullName[l]}
                      onChange={(e) => setForm({ ...form, fullName: { ...form.fullName, [l]: e.target.value } })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Qisqa nom ({l.toUpperCase()})</label>
                    <input
                      type="text"
                      className="form-control"
                      value={form.shortName[l]}
                      onChange={(e) => setForm({ ...form, shortName: { ...form.shortName, [l]: e.target.value } })}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="admin-card" style={{ marginTop: 20 }}>
            <div className="card-header">
              <h2 className="card-title">Kontakt</h2>
            </div>
            <div className="form-group">
              <label>Manzil</label>
              <input type="text" className="form-control" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>Telefon</label>
                <input type="text" className="form-control" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" className="form-control" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label>Ish vaqti</label>
              <input type="text" className="form-control" value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} />
            </div>
          </div>

          <div className="admin-card" style={{ marginTop: 20 }}>
            <div className="card-header">
              <h2 className="card-title">Ijtimoiy tarmoqlar</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>Telegram</label>
                <input type="text" className="form-control" value={form.telegram} onChange={(e) => setForm({ ...form, telegram: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Instagram</label>
                <input type="text" className="form-control" value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Facebook</label>
                <input type="text" className="form-control" value={form.facebook} onChange={(e) => setForm({ ...form, facebook: e.target.value })} />
              </div>
              <div className="form-group">
                <label>YouTube</label>
                <input type="text" className="form-control" value={form.youtube} onChange={(e) => setForm({ ...form, youtube: e.target.value })} />
              </div>
            </div>
          </div>

          <div className="admin-card" style={{ marginTop: 20 }}>
            <div className="card-header">
              <h2 className="card-title">Statistika</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              <div className="form-group">
                <label>O&apos;quvchilar</label>
                <input type="number" className="form-control" value={form.students_count} onChange={(e) => setForm({ ...form, students_count: parseInt(e.target.value, 10) || 0 })} />
              </div>
              <div className="form-group">
                <label>O&apos;qituvchilar</label>
                <input type="number" className="form-control" value={form.teachers_count} onChange={(e) => setForm({ ...form, teachers_count: parseInt(e.target.value, 10) || 0 })} />
              </div>
              <div className="form-group">
                <label>Tajriba (yil)</label>
                <input type="number" className="form-control" value={form.experience_years} onChange={(e) => setForm({ ...form, experience_years: parseInt(e.target.value, 10) || 0 })} />
              </div>
              <div className="form-group">
                <label>Olimpiada g&apos;oliblari</label>
                <input type="number" className="form-control" value={form.olympiad_winners} onChange={(e) => setForm({ ...form, olympiad_winners: parseInt(e.target.value, 10) || 0 })} />
              </div>
            </div>
          </div>

          <div style={{ marginTop: 20, display: 'flex', gap: 12, alignItems: 'center' }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
            {msg && (
              <span style={{ color: msg.ok ? '#10B981' : '#EF4444' }}>{msg.text}</span>
            )}
          </div>
        </form>
      </div>
    </>
  );
}
