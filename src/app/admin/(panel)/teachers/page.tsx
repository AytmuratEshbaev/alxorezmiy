'use client';
import { useState, type FormEvent } from 'react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminModal } from '@/components/admin/AdminModal';
import { confirmDialog } from '@/components/admin/ConfirmDialog';
import { ImageField } from '@/components/admin/ImageField';
import { toast } from '@/components/admin/Toast';
import { toastError } from '@/components/admin/errors';
import { ACHIEVEMENT_TYPES } from '@/components/admin/labels';
import { LANGS, emptyLangRecord, pickLang, spreadLang, type Lang } from '@/components/admin/lang';
import { LangPanel, LangTabs } from '@/components/admin/LangTabs';
import { ListErrorBanner, ListStatus } from '@/components/admin/ListStatus';
import { moveItem } from '@/components/admin/reorder';
import { useCollection } from '@/components/admin/useCollection';
import { useEditorModal } from '@/components/admin/useEditorModal';
import { parseIntField, validateFields } from '@/components/admin/validate';
import { addDocument, updateDocument, deleteDocument } from '@/lib/admin-api';

interface Achievement {
  type: string;
  title: string;
  year: number | null;
}

interface Teacher {
  id: string;
  createdAt?: string;
  name_uz?: string;
  name_ru?: string;
  name_kk?: string;
  name_en?: string;
  subject_uz?: string;
  subject_ru?: string;
  subject_kk?: string;
  subject_en?: string;
  category?: string;
  experience?: number;
  photo?: string;
  photoId?: string;
  achievements?: Achievement[];
  order?: number;
}

interface FormState {
  names: Record<Lang, string>;
  subjects: Record<Lang, string>;
  category: string;
  experience: string;
  order: string;
  photoUrl: string;
  photoId: string;
  achievements: Achievement[];
}

const emptyForm = (order = 0): FormState => ({
  names: emptyLangRecord(),
  subjects: emptyLangRecord(),
  category: '',
  experience: '0',
  order: String(order),
  photoUrl: '',
  photoId: '',
  achievements: [],
});

/** Ommaviy sayt bilan bir xil: order, keyin name_uz. */
const byOrderName = (a: Teacher, b: Teacher) =>
  (a.order ?? 0) - (b.order ?? 0) || (a.name_uz || '').localeCompare(b.name_uz || '', 'uz');

export default function TeachersAdminPage() {
  const list = useCollection<Teacher>('teachers', {
    orderBy: 'order',
    direction: 'asc',
    sort: byOrderName,
  });
  const { items } = list;
  const modal = useEditorModal<FormState>(emptyForm);
  const { form, setForm } = modal;
  const [activeLang, setActiveLang] = useState<Lang>('uz');
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [reordering, setReordering] = useState(false);

  const q = search.trim().toLowerCase();
  const cat = filterCat.trim().toLowerCase();
  const filtered = items.filter((t) => {
    if (
      q &&
      !LANGS.some(
        (l) =>
          (t[`name_${l}`] || '').toLowerCase().includes(q) ||
          (t[`subject_${l}`] || '').toLowerCase().includes(q)
      )
    )
      return false;
    if (cat && !(t.category || '').toLowerCase().includes(cat)) return false;
    return true;
  });
  const isFiltered = !!(q || cat);

  const openCreate = () => {
    const maxOrder = items.reduce((m, i) => Math.max(m, i.order ?? 0), -1);
    setActiveLang('uz');
    modal.openWith(null, emptyForm(maxOrder + 1));
  };

  const openEdit = (t: Teacher) => {
    setActiveLang('uz');
    modal.openWith(t.id, {
      names: pickLang(t, 'name'),
      subjects: pickLang(t, 'subject'),
      category: t.category || '',
      experience: String(t.experience ?? 0),
      order: String(t.order ?? 0),
      photoUrl: t.photo || '',
      photoId: t.photoId || '',
      achievements: Array.isArray(t.achievements) ? t.achievements.map((a) => ({ ...a })) : [],
    });
  };

  const addAchievement = () => {
    setForm((f) => ({
      ...f,
      achievements: [
        ...f.achievements,
        { type: 'olympiad', title: '', year: new Date().getFullYear() },
      ],
    }));
  };

  const updateAchievement = (idx: number, patch: Partial<Achievement>) => {
    setForm((f) => ({
      ...f,
      achievements: f.achievements.map((a, i) => (i === idx ? { ...a, ...patch } : a)),
    }));
  };

  const removeAchievement = (idx: number) => {
    setForm((f) => ({ ...f, achievements: f.achievements.filter((_, i) => i !== idx) }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (modal.uploading) return;
    const experience = parseIntField(form.experience, 0);
    const valid = validateFields(
      [
        {
          valid: !!form.names.uz.trim(),
          fieldId: 'teacher-name-uz',
          message: "O'zbek tilida ism majburiy",
          lang: 'uz',
        },
        {
          valid: !!form.subjects.uz.trim(),
          fieldId: 'teacher-subject-uz',
          message: "O'zbek tilida fan majburiy",
          lang: 'uz',
        },
        {
          valid: experience >= 0,
          fieldId: 'teacher-experience',
          message: "Tajriba manfiy bo'lishi mumkin emas",
        },
      ],
      setActiveLang
    );
    if (!valid) return;
    modal.setSubmitting(true);
    const data = {
      ...spreadLang('name', form.names),
      ...spreadLang('subject', form.subjects),
      category: form.category.trim(),
      experience,
      order: parseIntField(form.order, 0),
      photo: form.photoUrl,
      photoId: form.photoId,
      achievements: form.achievements
        .filter((a) => a.title.trim())
        .map((a) => ({ ...a, title: a.title.trim() })),
    };
    try {
      if (modal.editingId) {
        await updateDocument('teachers', modal.editingId, data);
        toast.success("O'qituvchi yangilandi");
      } else {
        await addDocument('teachers', data);
        toast.success("O'qituvchi qo'shildi");
      }
      modal.closeSaved();
    } catch (err) {
      toastError(err);
    } finally {
      modal.setSubmitting(false);
    }
  };

  const handleDelete = async (t: Teacher) => {
    const ok = await confirmDialog({
      title: "O'chirish",
      message: `"${t.name_uz}" o'qituvchisini o'chirmoqchimisiz?`,
      confirmText: "Ha, o'chirish",
      danger: true,
    });
    if (!ok) return;
    try {
      await deleteDocument('teachers', t.id);
      toast.success("O'qituvchi o'chirildi");
    } catch (err) {
      toastError(err);
    }
  };

  const move = async (index: number, delta: -1 | 1) => {
    setReordering(true);
    await moveItem('teachers', items, index, delta, list.mutate, list.reload);
    setReordering(false);
  };
  const canReorder = !isFiltered && !reordering;
  const reorderHint = isFiltered ? 'Filtrni tozalab tartiblang' : undefined;

  return (
    <>
      <AdminHeader title="O'qituvchilar" />
      <div className="content-area">
        <div className="admin-card">
          <div className="card-header">
            <h2 className="card-title">Barcha o&apos;qituvchilar</h2>
            <button type="button" className="btn btn-primary" onClick={openCreate}>
              + Qo&apos;shish
            </button>
          </div>
          <div className="admin-toolbar">
            <input
              type="search"
              className="form-control toolbar-search"
              placeholder="Ism yoki fan bo'yicha qidirish..."
              aria-label="O'qituvchilarni qidirish"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <input
              type="text"
              className="form-control toolbar-select"
              placeholder="Kategoriya filtri"
              aria-label="Kategoriya filtri"
              value={filterCat}
              onChange={(e) => setFilterCat(e.target.value)}
            />
          </div>
          <ListErrorBanner error={list.error} hasItems={items.length > 0} onRetry={list.reload} />
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
                  <th>Tartib</th>
                  <th>Amallar</th>
                </tr>
              </thead>
              <tbody>
                <ListStatus
                  colSpan={8}
                  loading={list.loading}
                  error={list.error}
                  total={items.length}
                  shown={filtered.length}
                  emptyText="Hali o'qituvchilar yo'q."
                  onRetry={list.reload}
                />
                {filtered.map((t) => {
                  const ach = Array.isArray(t.achievements) ? t.achievements.length : 0;
                  const index = items.indexOf(t);
                  return (
                    <tr key={t.id}>
                      <td className="thumb-cell">
                        {t.photo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={t.photo}
                            alt=""
                            className="thumb round"
                            width={48}
                            height={48}
                          />
                        ) : (
                          <div className="thumb round thumb-placeholder" aria-hidden="true">
                            👤
                          </div>
                        )}
                      </td>
                      <td>
                        <strong>{t.name_uz || '—'}</strong>
                      </td>
                      <td>{t.subject_uz || '—'}</td>
                      <td>
                        <span className="badge badge-warning">{t.category || '—'}</span>
                      </td>
                      <td>{t.experience || 0} yil</td>
                      <td>{ach > 0 ? <span className="badge badge-success">{ach}</span> : '—'}</td>
                      <td>
                        <div className="order-cell">
                          <span>{t.order ?? 0}</span>
                          <button
                            type="button"
                            className="action-btn"
                            onClick={() => move(index, -1)}
                            disabled={!canReorder || index === 0}
                            aria-label={`${t.name_uz || ''} — yuqoriga ko'chirish`}
                            title={reorderHint ?? 'Yuqoriga'}
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            className="action-btn"
                            onClick={() => move(index, 1)}
                            disabled={!canReorder || index === items.length - 1}
                            aria-label={`${t.name_uz || ''} — pastga ko'chirish`}
                            title={reorderHint ?? 'Pastga'}
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
                            onClick={() => openEdit(t)}
                            title="Tahrirlash"
                            aria-label={`${t.name_uz || ''} — tahrirlash`}
                          >
                            ✍️
                          </button>
                          <button
                            type="button"
                            className="action-btn delete"
                            onClick={() => handleDelete(t)}
                            title="O'chirish"
                            aria-label={`${t.name_uz || ''} — o'chirish`}
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
          title={modal.editingId ? "O'qituvchini tahrirlash" : "Yangi o'qituvchi qo'shish"}
          onRequestClose={modal.requestClose}
          width={760}
        >
          <form onSubmit={handleSubmit} noValidate>
            <div className="modal-body">
              <ImageField
                id="teacher-photo"
                label="Foto"
                folder="teachers"
                shape="round"
                url={form.photoUrl}
                fileId={form.photoId}
                onChange={(v) => setForm((f) => ({ ...f, photoUrl: v.url, photoId: v.fileId }))}
                tracker={modal.tracker}
                onUploadingChange={modal.setUploading}
              />

              <div className="form-grid form-grid-3">
                <div className="form-group">
                  <label htmlFor="teacher-category">Kategoriya</label>
                  <input
                    id="teacher-category"
                    type="text"
                    className="form-control"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="teacher-experience">Tajriba (yil)</label>
                  <input
                    id="teacher-experience"
                    type="number"
                    inputMode="numeric"
                    className="form-control"
                    min={0}
                    value={form.experience}
                    onChange={(e) => setForm({ ...form, experience: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="teacher-order">Tartib</label>
                  <input
                    id="teacher-order"
                    type="number"
                    inputMode="numeric"
                    className="form-control"
                    value={form.order}
                    onChange={(e) => setForm({ ...form, order: e.target.value })}
                  />
                </div>
              </div>

              <LangTabs idPrefix="teacher" active={activeLang} onChange={setActiveLang} />

              {LANGS.map((l) => (
                <LangPanel key={l} idPrefix="teacher" lang={l} active={activeLang}>
                  <div className="form-grid form-grid-2">
                    <div className="form-group">
                      <label htmlFor={`teacher-name-${l}`}>
                        Ism ({l.toUpperCase()}){l === 'uz' ? ' *' : ''}
                      </label>
                      <input
                        id={`teacher-name-${l}`}
                        type="text"
                        className="form-control"
                        required={l === 'uz'}
                        value={form.names[l]}
                        onChange={(e) =>
                          setForm({ ...form, names: { ...form.names, [l]: e.target.value } })
                        }
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor={`teacher-subject-${l}`}>
                        Fan ({l.toUpperCase()}){l === 'uz' ? ' *' : ''}
                      </label>
                      <input
                        id={`teacher-subject-${l}`}
                        type="text"
                        className="form-control"
                        required={l === 'uz'}
                        value={form.subjects[l]}
                        onChange={(e) =>
                          setForm({ ...form, subjects: { ...form.subjects, [l]: e.target.value } })
                        }
                      />
                    </div>
                  </div>
                </LangPanel>
              ))}

              <fieldset className="form-group form-fieldset">
                <legend>Yutuqlar</legend>
                <div className="achievements-list">
                  {form.achievements.map((a, idx) => (
                    <div key={idx} className="achievement-row">
                      <select
                        className="form-control achievement-type"
                        aria-label={`${idx + 1}-yutuq turi`}
                        value={a.type}
                        onChange={(e) => updateAchievement(idx, { type: e.target.value })}
                      >
                        {ACHIEVEMENT_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        className="form-control achievement-title"
                        placeholder="Yutuq nomi"
                        aria-label={`${idx + 1}-yutuq nomi`}
                        value={a.title}
                        onChange={(e) => updateAchievement(idx, { title: e.target.value })}
                      />
                      <input
                        type="number"
                        inputMode="numeric"
                        className="form-control achievement-year"
                        placeholder="Yil"
                        aria-label={`${idx + 1}-yutuq yili`}
                        min={1990}
                        max={2100}
                        value={a.year ?? ''}
                        onChange={(e) =>
                          updateAchievement(idx, { year: parseInt(e.target.value, 10) || null })
                        }
                      />
                      <button
                        type="button"
                        className="achievement-remove"
                        onClick={() => removeAchievement(idx)}
                        aria-label={`${idx + 1}-yutuqni o'chirish`}
                        title="O'chirish"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
                <button type="button" className="add-achievement-btn" onClick={addAchievement}>
                  + Yutuq qo&apos;shish
                </button>
              </fieldset>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline" onClick={modal.requestClose}>
                Bekor qilish
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={modal.submitting || modal.uploading}
              >
                {modal.submitting
                  ? 'Saqlanmoqda...'
                  : modal.uploading
                    ? 'Rasm yuklanmoqda...'
                    : 'Saqlash'}
              </button>
            </div>
          </form>
        </AdminModal>
      )}
    </>
  );
}
