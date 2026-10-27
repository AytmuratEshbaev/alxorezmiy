'use client';
import { useState, type FormEvent } from 'react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminModal } from '@/components/admin/AdminModal';
import { confirmDialog } from '@/components/admin/ConfirmDialog';
import { toast } from '@/components/admin/Toast';
import { toastError } from '@/components/admin/errors';
import { FAQ_CATEGORIES, FAQ_CATEGORY_LABELS } from '@/components/admin/labels';
import { LANGS, emptyLangRecord, pickLang, spreadLang, type Lang } from '@/components/admin/lang';
import { LangPanel, LangTabs } from '@/components/admin/LangTabs';
import { ListErrorBanner, ListStatus } from '@/components/admin/ListStatus';
import { moveItem } from '@/components/admin/reorder';
import { useCollection } from '@/components/admin/useCollection';
import { useEditorModal } from '@/components/admin/useEditorModal';
import { parseIntField, validateFields } from '@/components/admin/validate';
import { addDocument, updateDocument, deleteDocument } from '@/lib/admin-api';

interface FaqItem {
  id: string;
  createdAt?: string;
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

interface FormState {
  category: string;
  order: string;
  questions: Record<Lang, string>;
  answers: Record<Lang, string>;
}

const emptyForm = (order = 0): FormState => ({
  category: 'general',
  order: String(order),
  questions: emptyLangRecord(),
  answers: emptyLangRecord(),
});

const byOrder = (a: FaqItem, b: FaqItem) =>
  (a.order ?? 0) - (b.order ?? 0) || (a.createdAt || '').localeCompare(b.createdAt || '');

export default function FaqAdminPage() {
  const list = useCollection<FaqItem>('faq', { orderBy: 'order', direction: 'asc', sort: byOrder });
  const { items } = list;
  const modal = useEditorModal<FormState>(emptyForm);
  const { form, setForm } = modal;
  const [activeLang, setActiveLang] = useState<Lang>('uz');
  const [search, setSearch] = useState('');
  const [reordering, setReordering] = useState(false);

  const q = search.trim().toLowerCase();
  const filtered = q
    ? items.filter((item) =>
        LANGS.some(
          (l) =>
            (item[`question_${l}`] || '').toLowerCase().includes(q) ||
            (item[`answer_${l}`] || '').toLowerCase().includes(q)
        )
      )
    : items;

  const openCreate = () => {
    const maxOrder = items.reduce((m, i) => Math.max(m, i.order ?? 0), -1);
    setActiveLang('uz');
    modal.openWith(null, emptyForm(maxOrder + 1));
  };

  const openEdit = (item: FaqItem) => {
    setActiveLang('uz');
    modal.openWith(item.id, {
      category: item.category || 'general',
      order: String(item.order ?? 0),
      questions: pickLang(item, 'question'),
      answers: pickLang(item, 'answer'),
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const valid = validateFields(
      [
        {
          valid: !!form.questions.uz.trim(),
          fieldId: 'faq-question-uz',
          message: "O'zbek tilida savol majburiy",
          lang: 'uz',
        },
        {
          valid: !!form.answers.uz.trim(),
          fieldId: 'faq-answer-uz',
          message: "O'zbek tilida javob majburiy",
          lang: 'uz',
        },
      ],
      setActiveLang
    );
    if (!valid) return;
    modal.setSubmitting(true);
    const data = {
      category: form.category,
      order: parseIntField(form.order, 0),
      ...spreadLang('question', form.questions),
      ...spreadLang('answer', form.answers),
    };
    try {
      if (modal.editingId) {
        await updateDocument('faq', modal.editingId, data);
        toast.success('Savol yangilandi');
      } else {
        await addDocument('faq', data);
        toast.success("Savol qo'shildi");
      }
      modal.closeSaved();
    } catch (err) {
      toastError(err);
    } finally {
      modal.setSubmitting(false);
    }
  };

  const handleDelete = async (item: FaqItem) => {
    const ok = await confirmDialog({
      title: "O'chirish",
      message: "Savolni o'chirmoqchimisiz?",
      confirmText: "Ha, o'chirish",
      danger: true,
    });
    if (!ok) return;
    try {
      await deleteDocument('faq', item.id);
      toast.success("Savol o'chirildi");
    } catch (err) {
      toastError(err);
    }
  };

  const move = async (index: number, delta: -1 | 1) => {
    setReordering(true);
    await moveItem('faq', items, index, delta, list.mutate, list.reload);
    setReordering(false);
  };
  const canReorder = !q && !reordering;

  return (
    <>
      <AdminHeader title="FAQ" />
      <div className="content-area">
        <div className="admin-card">
          <div className="card-header">
            <h2 className="card-title">Savollar</h2>
            <button type="button" className="btn btn-primary" onClick={openCreate}>
              + Qo&apos;shish
            </button>
          </div>
          <div className="admin-toolbar">
            <input
              type="search"
              className="form-control toolbar-search"
              placeholder="Savol yoki javob bo'yicha qidirish..."
              aria-label="Savollarni qidirish"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <ListErrorBanner error={list.error} hasItems={items.length > 0} onRetry={list.reload} />
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
                <ListStatus
                  colSpan={4}
                  loading={list.loading}
                  error={list.error}
                  total={items.length}
                  shown={filtered.length}
                  emptyText="Hali savollar yo'q."
                  onRetry={list.reload}
                />
                {filtered.map((item) => {
                  const index = items.indexOf(item);
                  return (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.question_uz || '—'}</strong>
                      </td>
                      <td>
                        <span className="badge badge-warning">
                          {FAQ_CATEGORY_LABELS[item.category || ''] || item.category}
                        </span>
                      </td>
                      <td>
                        <div className="order-cell">
                          <span>{item.order ?? 0}</span>
                          <button
                            type="button"
                            className="action-btn"
                            onClick={() => move(index, -1)}
                            disabled={!canReorder || index === 0}
                            aria-label="Yuqoriga ko'chirish"
                            title={q ? "Qidiruvni tozalab tartiblang" : "Yuqoriga"}
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            className="action-btn"
                            onClick={() => move(index, 1)}
                            disabled={!canReorder || index === items.length - 1}
                            aria-label="Pastga ko'chirish"
                            title={q ? "Qidiruvni tozalab tartiblang" : 'Pastga'}
                          >
                            ↓
                          </button>
                        </div>
                      </td>
                      <td>
                        <div className="table-actions">
                          <button
                            type="button"
                            className="action-btn edit"
                            onClick={() => openEdit(item)}
                            title="Tahrirlash"
                            aria-label="Tahrirlash"
                          >
                            ✍️
                          </button>
                          <button
                            type="button"
                            className="action-btn delete"
                            onClick={() => handleDelete(item)}
                            title="O'chirish"
                            aria-label="O'chirish"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {modal.open && (
        <AdminModal
          title={modal.editingId ? 'Savolni tahrirlash' : "Yangi savol qo'shish"}
          onRequestClose={modal.requestClose}
          width={720}
        >
          <form onSubmit={handleSubmit} noValidate>
            <div className="modal-body">
              <div className="form-grid form-grid-2">
                <div className="form-group">
                  <label htmlFor="faq-category">Kategoriya</label>
                  <select
                    id="faq-category"
                    className="form-control"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  >
                    {FAQ_CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="faq-order">Tartib</label>
                  <input
                    id="faq-order"
                    type="number"
                    inputMode="numeric"
                    className="form-control"
                    value={form.order}
                    onChange={(e) => setForm({ ...form, order: e.target.value })}
                  />
                </div>
              </div>

              <LangTabs idPrefix="faq" active={activeLang} onChange={setActiveLang} />

              {LANGS.map((l) => (
                <LangPanel key={l} idPrefix="faq" lang={l} active={activeLang}>
                  <div className="form-group">
                    <label htmlFor={`faq-question-${l}`}>
                      Savol ({l.toUpperCase()}){l === 'uz' ? ' *' : ''}
                    </label>
                    <input
                      id={`faq-question-${l}`}
                      type="text"
                      className="form-control"
                      required={l === 'uz'}
                      value={form.questions[l]}
                      onChange={(e) =>
                        setForm({ ...form, questions: { ...form.questions, [l]: e.target.value } })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor={`faq-answer-${l}`}>
                      Javob ({l.toUpperCase()}){l === 'uz' ? ' *' : ''}
                    </label>
                    <textarea
                      id={`faq-answer-${l}`}
                      className="form-control"
                      rows={5}
                      required={l === 'uz'}
                      value={form.answers[l]}
                      onChange={(e) =>
                        setForm({ ...form, answers: { ...form.answers, [l]: e.target.value } })
                      }
                    />
                  </div>
                </LangPanel>
              ))}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline" onClick={modal.requestClose}>
                Bekor qilish
              </button>
              <button type="submit" className="btn btn-primary" disabled={modal.submitting}>
                {modal.submitting ? 'Saqlanmoqda...' : 'Saqlash'}
              </button>
            </div>
          </form>
        </AdminModal>
      )}
    </>
  );
}
