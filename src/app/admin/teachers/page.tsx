'use client';
import { useEffect, useState, type FormEvent } from 'react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { confirmDialog } from '@/components/admin/ConfirmDialog';
import {
  subscribeCollection,
  addDocument,
  updateDocument,
  deleteDocument
} from '@/lib/firebase/client-queries';
import { uploadImage } from '@/lib/imagekit';

type Lang = 'uz' | 'ru' | 'kk' | 'en';
const LANGS: Lang[] = ['uz', 'ru', 'kk', 'en'];
const LANG_LABELS: Record<Lang, string> = {
  uz: "🇺🇿 O'zbek",
  ru: '🇷🇺 Русский',
  kk: '🏳️ Qaraqalpaq',
  en: '🇬🇧 English'
};

interface Achievement {
  type: string;
  title: string;
  year: number | null;
}

interface Teacher {
  id: string;
  name_uz?: string;
  name_ru?: string;
  name_kk?: string;
  name_en?: string;
  subject?: string;
  category?: string;
  experience?: number;
  photo?: string;
  photoId?: string;
  achievements?: Achievement[];
}

const ACHIEVEMENT_TYPES = [
  { value: 'olympiad', label: '🏆 Olimpiada' },
  { value: 'certificate', label: '📜 Sertifikat' },
  { value: 'competition', label: '🥇 Musobaqa' },
  { value: 'diploma', label: '🎓 Diplom' },
  { value: 'other', label: '⭐ Boshqa' }
];

interface FormState {
  names: Record<Lang, string>;
  subject: string;
  category: string;
  experience: number;
  photoUrl: string;
  photoId: string;
  achievements: Achievement[];
}

const emptyForm = (): FormState => ({
  names: { uz: '', ru: '', kk: '', en: '' },
  subject: '',
  category: '',
  experience: 0,
  photoUrl: '',
  photoId: '',
  achievements: []
});

export default function TeachersAdminPage() {
  const [items, setItems] = useState<Teacher[]>([]);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeLang, setActiveLang] = useState<Lang>('uz');
  const [form, setForm] = useState<FormState>(emptyForm());
  const [submitting, setSubmitting] = useState(false);
  const [uploadPct, setUploadPct] = useState<number | null>(null);

  useEffect(() => {
    const unsub = subscribeCollection<Teacher>('teachers', (data) => {
      data.sort((a, b) => (a.name_uz || '').localeCompare(b.name_uz || '', 'uz'));
      setItems(data);
    });
    return () => unsub();
  }, []);

  const filtered = items.filter((t) => {
    if (search) {
      const q = search.toLowerCase();
      if (!(t.name_uz || '').toLowerCase().includes(q) && !(t.subject || '').toLowerCase().includes(q)) return false;
    }
    if (filterCat !== 'all' && t.category !== filterCat) return false;
    return true;
  });

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setActiveLang('uz');
    setModalOpen(true);
  };

  const openEdit = (t: Teacher) => {
    setEditingId(t.id);
    setForm({
      names: {
        uz: t.name_uz || '',
        ru: t.name_ru || '',
        kk: t.name_kk || '',
        en: t.name_en || ''
      },
      subject: t.subject || '',
      category: t.category || '',
      experience: t.experience || 0,
      photoUrl: t.photo || '',
      photoId: t.photoId || '',
      achievements: t.achievements ? [...t.achievements] : []
    });
    setActiveLang('uz');
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setUploadPct(null);
  };

  const handleFile = async (file?: File) => {
    if (!file) return;
    setUploadPct(0);
    try {
      const res = await uploadImage(file, 'teachers', (pct) => setUploadPct(pct));
      setForm((f) => ({ ...f, photoUrl: res.url, photoId: res.fileId }));
      setUploadPct(100);
      setTimeout(() => setUploadPct(null), 1200);
    } catch (err) {
      alert('Rasm yuklashda xato: ' + (err as Error).message);
      setUploadPct(null);
    }
  };

  const addAchievement = () => {
    setForm((f) => ({ ...f, achievements: [...f.achievements, { type: 'olympiad', title: '', year: new Date().getFullYear() }] }));
  };

  const updateAchievement = (idx: number, patch: Partial<Achievement>) => {
    setForm((f) => ({
      ...f,
      achievements: f.achievements.map((a, i) => (i === idx ? { ...a, ...patch } : a))
    }));
  };

  const removeAchievement = (idx: number) => {
    setForm((f) => ({ ...f, achievements: f.achievements.filter((_, i) => i !== idx) }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.names.uz.trim()) {
      alert("O'zbek tilida ism majburiy");
      return;
    }
    if (!form.subject.trim()) {
      alert('Fan majburiy');
      return;
    }
    setSubmitting(true);
    const data = {
      name_uz: form.names.uz.trim(),
      name_ru: form.names.ru.trim(),
      name_kk: form.names.kk.trim(),
      name_en: form.names.en.trim(),
      subject: form.subject.trim(),
      category: form.category.trim(),
      experience: form.experience,
      photo: form.photoUrl,
      photoId: form.photoId,
      achievements: form.achievements.filter((a) => a.title.trim())
    };
    try {
      if (editingId) {
        await updateDocument('teachers', editingId, data);
      } else {
        await addDocument('teachers', data);
      }
      closeModal();
    } catch (err) {
      alert('Xatolik: ' + (err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (t: Teacher) => {
    const ok = await confirmDialog({
      title: "O'chirish",
      message: `"${t.name_uz}" o'qituvchisini o'chirmoqchimisiz?`,
      confirmText: "Ha, o'chirish",
      danger: true
    });
    if (!ok) return;
    try {
      await deleteDocument('teachers', t.id);
    } catch (err) {
      alert('Xatolik: ' + (err as Error).message);
    }
  };

  return (
    <>
      <AdminHeader title="O'qituvchilar" />
      <div className="content-area">
        <div className="admin-card">
          <div className="card-header">
            <h2 className="card-title">Barcha o&apos;qituvchilar</h2>
            <button className="btn btn-primary" onClick={openCreate}>+ Qo&apos;shish</button>
          </div>
          <div className="admin-toolbar" style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            <input
              type="text"
              className="form-control"
              placeholder="Ism yoki fan bo'yicha qidirish..."
              style={{ flex: 1, minWidth: 240, maxWidth: 400 }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <input
              type="text"
              className="form-control"
              placeholder="Kategoriya filtri"
              style={{ maxWidth: 200 }}
              value={filterCat === 'all' ? '' : filterCat}
              onChange={(e) => setFilterCat(e.target.value.trim() ? e.target.value : 'all')}
            />
          </div>
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Foto</th>
                  <th>Ism</th>
                  <th>Fan</th>
                  <th>Kategoriya</th>
                  <th>Tajriba</th>
                  <th>Yutuqlar</th>
                  <th>Amallar</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#94A3B8' }}>
                      {items.length === 0 ? "Hali o'qituvchilar yo'q." : 'Topilmadi'}
                    </td>
                  </tr>
                ) : (
                  filtered.map((t) => {
                    const ach = Array.isArray(t.achievements) ? t.achievements.length : 0;
                    return (
                      <tr key={t.id}>
                        <td style={{ width: 60 }}>
                          {t.photo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={t.photo} alt="" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>👤</div>
                          )}
                        </td>
                        <td><strong>{t.name_uz || '—'}</strong></td>
                        <td>{t.subject || '—'}</td>
                        <td><span className="badge badge-warning">{t.category || '—'}</span></td>
                        <td>{t.experience || 0} yil</td>
                        <td>{ach > 0 ? <span className="badge badge-success">{ach}</span> : '—'}</td>
                        <td>
                          <div className="table-actions">
                            <button className="action-btn edit" onClick={() => openEdit(t)} title="Tahrirlash">✍️</button>
                            <button className="action-btn delete" onClick={() => handleDelete(t)} title="O'chirish">🗑️</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {modalOpen && (
        <div className="modal-overlay active" onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className="modal" style={{ maxWidth: 760 }}>
            <div className="modal-header">
              <h3 className="modal-title">{editingId ? "O'qituvchini tahrirlash" : "Yangi o'qituvchi qo'shish"}</h3>
              <button className="modal-close" type="button" onClick={closeModal}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Foto</label>
                  <input type="file" accept="image/*" onChange={(e) => handleFile(e.target.files?.[0])} />
                  {form.photoUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={form.photoUrl} alt="" style={{ maxWidth: 160, maxHeight: 160, borderRadius: '50%', objectFit: 'cover', marginTop: 12, display: 'block' }} />
                  )}
                  {uploadPct !== null && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ background: '#E2E8F0', borderRadius: 4, height: 6 }}>
                        <div style={{ background: '#3B82F6', height: '100%', width: `${uploadPct}%`, transition: 'width 0.2s' }} />
                      </div>
                      <small style={{ color: '#64748B' }}>{uploadPct}%</small>
                    </div>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                  <div className="form-group">
                    <label>Fan *</label>
                    <input type="text" className="form-control" required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Kategoriya</label>
                    <input type="text" className="form-control" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Tajriba (yil)</label>
                    <input type="number" className="form-control" min={0} value={form.experience} onChange={(e) => setForm({ ...form, experience: parseInt(e.target.value, 10) || 0 })} />
                  </div>
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
                    <div className="form-group">
                      <label>Ism ({l.toUpperCase()}){l === 'uz' ? ' *' : ''}</label>
                      <input
                        type="text"
                        className="form-control"
                        required={l === 'uz'}
                        value={form.names[l]}
                        onChange={(e) => setForm({ ...form, names: { ...form.names, [l]: e.target.value } })}
                      />
                    </div>
                  </div>
                ))}

                <div className="form-group">
                  <label>Yutuqlar</label>
                  <div>
                    {form.achievements.map((a, idx) => (
                      <div key={idx} className="achievement-row" style={{ display: 'grid', gridTemplateColumns: '180px 1fr 100px auto', gap: 8, marginBottom: 8 }}>
                        <select className="form-control" value={a.type} onChange={(e) => updateAchievement(idx, { type: e.target.value })}>
                          {ACHIEVEMENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Yutuq nomi"
                          value={a.title}
                          onChange={(e) => updateAchievement(idx, { title: e.target.value })}
                        />
                        <input
                          type="number"
                          className="form-control"
                          placeholder="Yil"
                          min={1990}
                          max={2100}
                          value={a.year ?? ''}
                          onChange={(e) => updateAchievement(idx, { year: parseInt(e.target.value, 10) || null })}
                        />
                        <button type="button" className="action-btn delete" onClick={() => removeAchievement(idx)}>🗑️</button>
                      </div>
                    ))}
                  </div>
                  <button type="button" className="btn btn-outline" onClick={addAchievement} style={{ marginTop: 8 }}>+ Yutuq qo&apos;shish</button>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={closeModal}>Bekor qilish</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saqlanmoqda...' : 'Saqlash'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
