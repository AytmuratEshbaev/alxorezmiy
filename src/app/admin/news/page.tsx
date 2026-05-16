'use client';
import { useEffect, useState, type FormEvent } from 'react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { confirmDialog } from '@/components/admin/ConfirmDialog';
import { toast } from '@/components/admin/Toast';
import { useEscapeKey } from '@/components/admin/useEscapeKey';
import {
  subscribeCollection,
  addDocument,
  updateDocument,
  deleteDocument
} from '@/lib/firebase/client-queries';
import { uploadImage } from '@/lib/imagekit';
import { formatDate } from '@/lib/utils';

type Lang = 'uz' | 'ru' | 'kk' | 'en';
const LANGS: Lang[] = ['uz', 'ru', 'kk', 'en'];
const LANG_LABELS: Record<Lang, string> = {
  uz: "🇺🇿 O'zbek",
  ru: '🇷🇺 Русский',
  kk: '🏳️ Qaraqalpaq',
  en: '🇬🇧 English'
};

interface NewsItem {
  id: string;
  category?: string;
  status?: string;
  image?: string;
  imageId?: string;
  createdAt?: { toDate: () => Date };
  title_uz?: string;
  title_ru?: string;
  title_kk?: string;
  title_en?: string;
  content_uz?: string;
  content_ru?: string;
  content_kk?: string;
  content_en?: string;
}

const CAT_LABELS: Record<string, string> = { events: 'Tadbir', announcements: "E'lon" };
const STATUS_LABELS: Record<string, string> = { published: 'Nashr etilgan', draft: 'Qoralama' };

interface FormState {
  category: string;
  status: string;
  imageUrl: string;
  imageId: string;
  titles: Record<Lang, string>;
  contents: Record<Lang, string>;
}

const emptyForm = (): FormState => ({
  category: 'announcements',
  status: 'published',
  imageUrl: '',
  imageId: '',
  titles: { uz: '', ru: '', kk: '', en: '' },
  contents: { uz: '', ru: '', kk: '', en: '' }
});

export default function NewsAdminPage() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeLang, setActiveLang] = useState<Lang>('uz');
  const [form, setForm] = useState<FormState>(emptyForm());
  const [submitting, setSubmitting] = useState(false);
  const [uploadPct, setUploadPct] = useState<number | null>(null);

  useEffect(() => {
    const unsub = subscribeCollection<NewsItem>(
      'news',
      (data) => setItems(data),
      { orderBy: 'createdAt', direction: 'desc' }
    );
    return () => unsub();
  }, []);

  const filtered = items.filter((n) => {
    if (search) {
      const q = search.toLowerCase();
      if (!(n.title_uz || '').toLowerCase().includes(q) && !(n.content_uz || '').toLowerCase().includes(q)) {
        return false;
      }
    }
    if (filterCat !== 'all' && n.category !== filterCat) return false;
    if (filterStatus !== 'all' && n.status !== filterStatus) return false;
    return true;
  });

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setActiveLang('uz');
    setModalOpen(true);
  };

  const openEdit = (item: NewsItem) => {
    setEditingId(item.id);
    setForm({
      category: item.category || 'announcements',
      status: item.status || 'published',
      imageUrl: item.image || '',
      imageId: item.imageId || '',
      titles: {
        uz: item.title_uz || '',
        ru: item.title_ru || '',
        kk: item.title_kk || '',
        en: item.title_en || ''
      },
      contents: {
        uz: item.content_uz || '',
        ru: item.content_ru || '',
        kk: item.content_kk || '',
        en: item.content_en || ''
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

  useEscapeKey(modalOpen, closeModal);

  const handleFile = async (file?: File) => {
    if (!file) return;
    setUploadPct(0);
    try {
      const res = await uploadImage(file, 'news', (pct) => setUploadPct(pct));
      setForm((f) => ({ ...f, imageUrl: res.url, imageId: res.fileId }));
      setUploadPct(100);
      setTimeout(() => setUploadPct(null), 1200);
    } catch (err) {
      toast.error('Rasm yuklashda xato: ' + (err as Error).message);
      setUploadPct(null);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.titles.uz.trim()) {
      toast.error("O'zbek tilida sarlavha majburiy");
      return;
    }
    setSubmitting(true);
    const data = {
      category: form.category,
      status: form.status,
      image: form.imageUrl,
      imageId: form.imageId,
      title_uz: form.titles.uz.trim(),
      title_ru: form.titles.ru.trim(),
      title_kk: form.titles.kk.trim(),
      title_en: form.titles.en.trim(),
      content_uz: form.contents.uz.trim(),
      content_ru: form.contents.ru.trim(),
      content_kk: form.contents.kk.trim(),
      content_en: form.contents.en.trim()
    };
    try {
      if (editingId) {
        await updateDocument('news', editingId, data);
        toast.success('Yangilik yangilandi');
      } else {
        await addDocument('news', data);
        toast.success("Yangilik qo'shildi");
      }
      closeModal();
    } catch (err) {
      toast.error('Xatolik: ' + (err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (item: NewsItem) => {
    const ok = await confirmDialog({
      title: "O'chirish",
      message: `"${item.title_uz}" yangiligini o'chirmoqchimisiz?`,
      confirmText: "Ha, o'chirish",
      danger: true
    });
    if (!ok) return;
    try {
      await deleteDocument('news', item.id);
      toast.success("Yangilik o'chirildi");
    } catch (err) {
      toast.error('Xatolik: ' + (err as Error).message);
    }
  };

  return (
    <>
      <AdminHeader title="Yangiliklar" />
      <div className="content-area">
        <div className="admin-card">
          <div className="card-header">
            <h2 className="card-title">Barcha yangiliklar</h2>
            <button className="btn btn-primary" onClick={openCreate}>+ Qo&apos;shish</button>
          </div>
          <div className="admin-toolbar" style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            <input
              type="text"
              className="form-control"
              placeholder="Sarlavha bo'yicha qidirish..."
              style={{ flex: 1, minWidth: 240, maxWidth: 400 }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select className="form-control" style={{ maxWidth: 180 }} value={filterCat} onChange={(e) => setFilterCat(e.target.value)}>
              <option value="all">Barcha kategoriya</option>
              <option value="announcements">📢 E&apos;lonlar</option>
              <option value="events">🎉 Tadbirlar</option>
            </select>
            <select className="form-control" style={{ maxWidth: 160 }} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="all">Barcha holat</option>
              <option value="published">✅ Nashr etilgan</option>
              <option value="draft">📝 Qoralama</option>
            </select>
          </div>
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Rasm</th>
                  <th>Sarlavha (UZ)</th>
                  <th>Sana</th>
                  <th>Kategoriya</th>
                  <th>Holati</th>
                  <th>Amallar</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#94A3B8' }}>
                      {items.length === 0 ? "Hali yangiliklar yo'q." : 'Filterga mos yangilik topilmadi'}
                    </td>
                  </tr>
                ) : (
                  filtered.map((n) => (
                    <tr key={n.id}>
                      <td style={{ width: 60 }}>
                        {n.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={n.image} alt="" style={{ width: 48, height: 48, borderRadius: 6, objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: 48, height: 48, borderRadius: 6, background: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📰</div>
                        )}
                      </td>
                      <td><strong>{n.title_uz || '—'}</strong></td>
                      <td>{formatDate(n.createdAt) || '—'}</td>
                      <td><span className="badge badge-warning">{CAT_LABELS[n.category || ''] || n.category}</span></td>
                      <td><span className={'badge ' + (n.status === 'published' ? 'badge-success' : 'badge-warning')}>{STATUS_LABELS[n.status || ''] || n.status}</span></td>
                      <td>
                        <div className="table-actions">
                          <button className="action-btn edit" onClick={() => openEdit(n)} title="Tahrirlash">✍️</button>
                          <button className="action-btn delete" onClick={() => handleDelete(n)} title="O'chirish">🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))
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
              <h3 className="modal-title">{editingId ? 'Yangilikni tahrirlash' : "Yangi yangilik qo'shish"}</h3>
              <button className="modal-close" type="button" onClick={closeModal}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Rasm</label>
                  <div className="image-uploader">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFile(e.target.files?.[0])}
                    />
                    {form.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={form.imageUrl} alt="" style={{ maxWidth: '100%', maxHeight: 240, objectFit: 'contain', borderRadius: 8, marginTop: 12 }} />
                    )}
                    {uploadPct !== null && (
                      <div style={{ marginTop: 8 }}>
                        <div style={{ background: '#E2E8F0', borderRadius: 4, overflow: 'hidden', height: 6 }}>
                          <div style={{ background: '#3B82F6', height: '100%', width: `${uploadPct}%`, transition: 'width 0.2s' }} />
                        </div>
                        <small style={{ color: '#64748B' }}>{uploadPct}%</small>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="form-group">
                    <label>Kategoriya</label>
                    <select className="form-control" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required>
                      <option value="announcements">E&apos;lon</option>
                      <option value="events">Tadbir</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Holati</label>
                    <select className="form-control" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} required>
                      <option value="published">Nashr etilgan</option>
                      <option value="draft">Qoralama</option>
                    </select>
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
                  <div key={l} className={'lang-panel ' + (activeLang === l ? 'active' : '')} style={{ display: activeLang === l ? 'block' : 'none' }}>
                    <div className="form-group">
                      <label>Sarlavha ({l.toUpperCase()}){l === 'uz' ? ' *' : ''}</label>
                      <input
                        type="text"
                        className="form-control"
                        required={l === 'uz'}
                        value={form.titles[l]}
                        onChange={(e) => setForm({ ...form, titles: { ...form.titles, [l]: e.target.value } })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Matn ({l.toUpperCase()}){l === 'uz' ? ' *' : ''}</label>
                      <textarea
                        className="form-control"
                        rows={6}
                        required={l === 'uz'}
                        value={form.contents[l]}
                        onChange={(e) => setForm({ ...form, contents: { ...form.contents, [l]: e.target.value } })}
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
