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

interface Item {
  id: string;
  url?: string;
  fileId?: string;
  category?: string;
  caption_uz?: string;
  caption_ru?: string;
  caption_kk?: string;
  caption_en?: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  building: '🏛 Bino',
  lessons: '📚 Darslar',
  sports: '⚽ Sport',
  events: '🎉 Tadbirlar'
};

interface FormState {
  url: string;
  fileId: string;
  category: string;
  captions: Record<Lang, string>;
}

const emptyForm = (): FormState => ({
  url: '',
  fileId: '',
  category: 'building',
  captions: { uz: '', ru: '', kk: '', en: '' }
});

export default function GalleryAdminPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeLang, setActiveLang] = useState<Lang>('uz');
  const [form, setForm] = useState<FormState>(emptyForm());
  const [submitting, setSubmitting] = useState(false);
  const [uploadPct, setUploadPct] = useState<number | null>(null);

  useEffect(() => {
    const unsub = subscribeCollection<Item>('gallery', (data) => setItems(data), {
      orderBy: 'createdAt',
      direction: 'desc'
    });
    return () => unsub();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setActiveLang('uz');
    setModalOpen(true);
  };

  const openEdit = (item: Item) => {
    setEditingId(item.id);
    setForm({
      url: item.url || '',
      fileId: item.fileId || '',
      category: item.category || 'building',
      captions: {
        uz: item.caption_uz || '',
        ru: item.caption_ru || '',
        kk: item.caption_kk || '',
        en: item.caption_en || ''
      }
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
      const res = await uploadImage(file, 'gallery', (pct) => setUploadPct(pct));
      setForm((f) => ({ ...f, url: res.url, fileId: res.fileId }));
      setUploadPct(100);
      setTimeout(() => setUploadPct(null), 1200);
    } catch (err) {
      alert('Rasm yuklashda xato: ' + (err as Error).message);
      setUploadPct(null);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.url) {
      alert('Rasm yuklang');
      return;
    }
    setSubmitting(true);
    const data = {
      url: form.url,
      fileId: form.fileId,
      category: form.category,
      caption_uz: form.captions.uz.trim(),
      caption_ru: form.captions.ru.trim(),
      caption_kk: form.captions.kk.trim(),
      caption_en: form.captions.en.trim()
    };
    try {
      if (editingId) {
        await updateDocument('gallery', editingId, data);
      } else {
        await addDocument('gallery', data);
      }
      closeModal();
    } catch (err) {
      alert('Xatolik: ' + (err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (item: Item) => {
    const ok = await confirmDialog({
      title: "O'chirish",
      message: "Rasmni o'chirmoqchimisiz?",
      confirmText: "Ha, o'chirish",
      danger: true
    });
    if (!ok) return;
    try {
      await deleteDocument('gallery', item.id);
    } catch (err) {
      alert('Xatolik: ' + (err as Error).message);
    }
  };

  return (
    <>
      <AdminHeader title="Galereya" />
      <div className="content-area">
        <div className="admin-card">
          <div className="card-header">
            <h2 className="card-title">Galereya</h2>
            <button className="btn btn-primary" onClick={openCreate}>+ Qo&apos;shish</button>
          </div>
          {items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#94A3B8' }}>
              Hali galereyada rasm yo&apos;q.
            </div>
          ) : (
            <div className="gallery-admin-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
              {items.map((item) => (
                <div key={item.id} className="gallery-admin-item" style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', background: '#F1F5F9' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.url} alt={item.caption_uz || ''} loading="lazy" style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }} />
                  <div style={{ padding: 10 }}>
                    <span className="badge badge-warning">{CATEGORY_LABELS[item.category || ''] || item.category}</span>
                    <p style={{ margin: '6px 0 8px', fontSize: 13, color: '#475569' }}>{item.caption_uz || '—'}</p>
                    <div className="table-actions">
                      <button className="action-btn edit" onClick={() => openEdit(item)} title="Tahrirlash">✍️</button>
                      <button className="action-btn delete" onClick={() => handleDelete(item)} title="O'chirish">🗑️</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {modalOpen && (
        <div className="modal-overlay active" onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className="modal" style={{ maxWidth: 640 }}>
            <div className="modal-header">
              <h3 className="modal-title">{editingId ? 'Rasmni tahrirlash' : "Yangi rasm qo'shish"}</h3>
              <button className="modal-close" type="button" onClick={closeModal}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Rasm *</label>
                  <input type="file" accept="image/*" onChange={(e) => handleFile(e.target.files?.[0])} />
                  {form.url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={form.url} alt="" style={{ maxWidth: '100%', maxHeight: 240, objectFit: 'contain', borderRadius: 8, marginTop: 12 }} />
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

                <div className="form-group">
                  <label>Kategoriya</label>
                  <select className="form-control" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                    <option value="building">🏛 Bino</option>
                    <option value="lessons">📚 Darslar</option>
                    <option value="sports">⚽ Sport</option>
                    <option value="events">🎉 Tadbirlar</option>
                  </select>
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
                      <label>Sarlavha ({l.toUpperCase()})</label>
                      <input
                        type="text"
                        className="form-control"
                        value={form.captions[l]}
                        onChange={(e) => setForm({ ...form, captions: { ...form.captions, [l]: e.target.value } })}
                      />
                    </div>
                  </div>
                ))}
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
