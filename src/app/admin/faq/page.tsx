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

type Lang = 'uz' | 'ru' | 'kk' | 'en';
const LANGS: Lang[] = ['uz', 'ru', 'kk', 'en'];
const LANG_LABELS: Record<Lang, string> = {
  uz: "🇺🇿 O'zbek",
  ru: '🇷🇺 Русский',
  kk: '🏳️ Qaraqalpaq',
  en: '🇬🇧 English'
};

interface FaqItem {
  id: string;
  category?: string;
  order?: number;
  question_uz?: string;
  question_ru?: string;
  question_kk?: string;
  question_en?: string;
  answer_uz?: string;
  answer_ru?: string;
  answer_kk?: string;
  answer_en?: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  admission: '📝 Qabul',
  education: "📚 Ta'lim",
  general: '💬 Umumiy'
};

interface FormState {
  category: string;
  order: number;
  questions: Record<Lang, string>;
  answers: Record<Lang, string>;
}

const emptyForm = (): FormState => ({
  category: 'general',
  order: 0,
  questions: { uz: '', ru: '', kk: '', en: '' },
  answers: { uz: '', ru: '', kk: '', en: '' }
});

export default function FaqAdminPage() {
  const [items, setItems] = useState<FaqItem[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeLang, setActiveLang] = useState<Lang>('uz');
  const [form, setForm] = useState<FormState>(emptyForm());
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const unsub = subscribeCollection<FaqItem>('faq', (data) => {
      data.sort((a, b) => (a.order || 0) - (b.order || 0));
      setItems(data);
    });
    return () => unsub();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setActiveLang('uz');
    setModalOpen(true);
  };

  const openEdit = (item: FaqItem) => {
    setEditingId(item.id);
    setForm({
      category: item.category || 'general',
      order: item.order || 0,
      questions: {
        uz: item.question_uz || '',
        ru: item.question_ru || '',
        kk: item.question_kk || '',
        en: item.question_en || ''
      },
      answers: {
        uz: item.answer_uz || '',
        ru: item.answer_ru || '',
        kk: item.answer_kk || '',
        en: item.answer_en || ''
      }
    });
    setActiveLang('uz');
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.questions.uz.trim() || !form.answers.uz.trim()) {
      alert('UZ savol va javob majburiy');
      return;
    }
    setSubmitting(true);
    const data = {
      category: form.category,
      order: form.order,
      question_uz: form.questions.uz.trim(),
      question_ru: form.questions.ru.trim(),
      question_kk: form.questions.kk.trim(),
      question_en: form.questions.en.trim(),
      answer_uz: form.answers.uz.trim(),
      answer_ru: form.answers.ru.trim(),
      answer_kk: form.answers.kk.trim(),
      answer_en: form.answers.en.trim()
    };
    try {
      if (editingId) {
        await updateDocument('faq', editingId, data);
      } else {
        await addDocument('faq', data);
      }
      closeModal();
    } catch (err) {
      alert('Xatolik: ' + (err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (item: FaqItem) => {
    const ok = await confirmDialog({
      title: "O'chirish",
      message: "Savolni o'chirmoqchimisiz?",
      confirmText: "Ha, o'chirish",
      danger: true
    });
    if (!ok) return;
    try {
      await deleteDocument('faq', item.id);
    } catch (err) {
      alert('Xatolik: ' + (err as Error).message);
    }
  };

  return (
    <>
      <AdminHeader title="FAQ" />
      <div className="content-area">
        <div className="admin-card">
          <div className="card-header">
            <h2 className="card-title">Savollar</h2>
            <button className="btn btn-primary" onClick={openCreate}>+ Qo&apos;shish</button>
          </div>
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Savol (UZ)</th>
                  <th>Kategoriya</th>
                  <th>Tartib</th>
                  <th>Amallar</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: 40, color: '#94A3B8' }}>
                      Hali savollar yo&apos;q.
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.id}>
                      <td><strong>{item.question_uz || '—'}</strong></td>
                      <td><span className="badge badge-warning">{CATEGORY_LABELS[item.category || ''] || item.category}</span></td>
                      <td>{item.order || 0}</td>
                      <td>
                        <div className="table-actions">
                          <button className="action-btn edit" onClick={() => openEdit(item)} title="Tahrirlash">✍️</button>
                          <button className="action-btn delete" onClick={() => handleDelete(item)} title="O'chirish">🗑️</button>
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
          <div className="modal" style={{ maxWidth: 720 }}>
            <div className="modal-header">
              <h3 className="modal-title">{editingId ? 'Savolni tahrirlash' : "Yangi savol qo'shish"}</h3>
              <button className="modal-close" type="button" onClick={closeModal}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="form-group">
                    <label>Kategoriya</label>
                    <select className="form-control" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                      <option value="admission">📝 Qabul</option>
                      <option value="education">📚 Ta&apos;lim</option>
                      <option value="general">💬 Umumiy</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Tartib</label>
                    <input type="number" className="form-control" value={form.order} onChange={(e) => setForm({ ...form, order: parseInt(e.target.value, 10) || 0 })} />
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
                      <label>Savol ({l.toUpperCase()}){l === 'uz' ? ' *' : ''}</label>
                      <input
                        type="text"
                        className="form-control"
                        required={l === 'uz'}
                        value={form.questions[l]}
                        onChange={(e) => setForm({ ...form, questions: { ...form.questions, [l]: e.target.value } })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Javob ({l.toUpperCase()}){l === 'uz' ? ' *' : ''}</label>
                      <textarea
                        className="form-control"
                        rows={5}
                        required={l === 'uz'}
                        value={form.answers[l]}
                        onChange={(e) => setForm({ ...form, answers: { ...form.answers, [l]: e.target.value } })}
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
