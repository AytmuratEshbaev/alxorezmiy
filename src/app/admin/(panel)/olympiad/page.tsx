'use client';
import { useState, type FormEvent } from 'react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminModal } from '@/components/admin/AdminModal';
import { confirmDialog } from '@/components/admin/ConfirmDialog';
import { toast } from '@/components/admin/Toast';
import { toastError } from '@/components/admin/errors';
import { OLYMPIAD_LEVELS, OLYMPIAD_LEVEL_LABELS } from '@/components/admin/labels';
import { ListErrorBanner, ListStatus } from '@/components/admin/ListStatus';
import { useCollection } from '@/components/admin/useCollection';
import { useEditorModal } from '@/components/admin/useEditorModal';
import { parseIntField, validateFields } from '@/components/admin/validate';
import { addDocument, updateDocument, deleteDocument } from '@/lib/admin-api';

interface OlyItem {
  id: string;
  createdAt?: string;
  student?: string;
  subject?: string;
  level?: string;
  place?: number;
  olympiad_name?: string;
  year?: number;
}

interface FormState {
  student: string;
  subject: string;
  level: string;
  place: string;
  olympiad_name: string;
  year: string;
}

const currentYear = () => new Date().getFullYear();

const emptyForm = (): FormState => ({
  student: '',
  subject: '',
  level: 'respublika',
  place: '1',
  olympiad_name: '',
  year: String(currentYear()),
});

const byYearPlace = (a: OlyItem, b: OlyItem) =>
  (b.year || 0) - (a.year || 0) || (a.place || 99) - (b.place || 99);

export default function OlympiadAdminPage() {
  const list = useCollection<OlyItem>('olympiad', { sort: byYearPlace });
  const { items } = list;
  const modal = useEditorModal<FormState>(emptyForm);
  const { form, setForm } = modal;
  const [search, setSearch] = useState('');

  const q = search.trim().toLowerCase();
  const filtered = q
    ? items.filter((i) =>
        [i.student, i.subject, i.olympiad_name, String(i.year ?? '')].some((v) =>
          (v || '').toLowerCase().includes(q)
        )
      )
    : items;

  const openEdit = (item: OlyItem) =>
    modal.openWith(item.id, {
      student: item.student || '',
      subject: item.subject || '',
      level: item.level || 'respublika',
      place: String(item.place || 1),
      olympiad_name: item.olympiad_name || '',
      year: String(item.year || currentYear()),
    });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const place = parseIntField(form.place, NaN);
    const year = parseIntField(form.year, NaN);
    const valid = validateFields([
      { valid: !!form.student.trim(), fieldId: 'oly-student', message: "O'quvchi ismi majburiy" },
      { valid: place >= 1, fieldId: 'oly-place', message: "O'rin 1 yoki undan katta bo'lishi kerak" },
      {
        valid: year >= 1990 && year <= 2100,
        fieldId: 'oly-year',
        message: "Yil 1990–2100 oralig'ida bo'lishi kerak",
      },
    ]);
    if (!valid) return;
    modal.setSubmitting(true);
    const data = {
      student: form.student.trim(),
      subject: form.subject.trim(),
      level: form.level,
      place,
      olympiad_name: form.olympiad_name.trim(),
      year,
    };
    try {
      if (modal.editingId) {
        await updateDocument('olympiad', modal.editingId, data);
        toast.success('Natija yangilandi');
      } else {
        await addDocument('olympiad', data);
        toast.success("Natija qo'shildi");
      }
      modal.closeSaved();
    } catch (err) {
      toastError(err);
    } finally {
      modal.setSubmitting(false);
    }
  };

  const handleDelete = async (item: OlyItem) => {
    const ok = await confirmDialog({
      title: "O'chirish",
      message: `"${item.student}" natijasini o'chirmoqchimisiz?`,
      confirmText: "Ha, o'chirish",
      danger: true,
    });
    if (!ok) return;
    try {
      await deleteDocument('olympiad', item.id);
      toast.success("Natija o'chirildi");
    } catch (err) {
      toastError(err);
    }
  };

  return (
    <>
      <AdminHeader title="Olimpiada natijalari" />
      <div className="content-area">
        <div className="admin-card">
          <div className="card-header">
            <h2 className="card-title">Natijalar</h2>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => modal.openWith(null, emptyForm())}
            >
              + Qo&apos;shish
            </button>
          </div>
          <div className="admin-toolbar">
            <input
              type="search"
              className="form-control toolbar-search"
              placeholder="O'quvchi, fan yoki olimpiada bo'yicha qidirish..."
              aria-label="Natijalarni qidirish"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <ListErrorBanner error={list.error} hasItems={items.length > 0} onRetry={list.reload} />
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>O&apos;quvchi</th>
                  <th>Fan</th>
                  <th>Daraja</th>
                  <th>O&apos;rin</th>
                  <th>Olimpiada</th>
                  <th>Yil</th>
                  <th>Amallar</th>
                </tr>
              </thead>
              <tbody>
                <ListStatus
                  colSpan={7}
                  loading={list.loading}
                  error={list.error}
                  total={items.length}
                  shown={filtered.length}
                  emptyText="Hali natijalar yo'q."
                  onRetry={list.reload}
                />
                {filtered.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.student || '—'}</strong>
                    </td>
                    <td>{item.subject || '—'}</td>
                    <td>
                      <span className="badge badge-warning">
                        {OLYMPIAD_LEVEL_LABELS[item.level || ''] || item.level}
                      </span>
                    </td>
                    <td>
                      <strong className="text-primary">{item.place || '—'}</strong>-o&apos;rin
                    </td>
                    <td>{item.olympiad_name || '—'}</td>
                    <td>{item.year || '—'}</td>
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {modal.open && (
        <AdminModal
          title={modal.editingId ? 'Natijani tahrirlash' : "Yangi natija qo'shish"}
          onRequestClose={modal.requestClose}
          width={560}
        >
          <form onSubmit={handleSubmit} noValidate>
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="oly-student">O&apos;quvchi ismi *</label>
                <input
                  id="oly-student"
                  type="text"
                  className="form-control"
                  required
                  value={form.student}
                  onChange={(e) => setForm({ ...form, student: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label htmlFor="oly-subject">Fan</label>
                <input
                  id="oly-subject"
                  type="text"
                  className="form-control"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                />
              </div>
              <div className="form-grid form-grid-2">
                <div className="form-group">
                  <label htmlFor="oly-level">Daraja</label>
                  <select
                    id="oly-level"
                    className="form-control"
                    value={form.level}
                    onChange={(e) => setForm({ ...form, level: e.target.value })}
                  >
                    {OLYMPIAD_LEVELS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="oly-place">O&apos;rin</label>
                  <input
                    id="oly-place"
                    type="number"
                    inputMode="numeric"
                    className="form-control"
                    min={1}
                    value={form.place}
                    onChange={(e) => setForm({ ...form, place: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="oly-name">Olimpiada nomi</label>
                <input
                  id="oly-name"
                  type="text"
                  className="form-control"
                  value={form.olympiad_name}
                  onChange={(e) => setForm({ ...form, olympiad_name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label htmlFor="oly-year">Yil</label>
                <input
                  id="oly-year"
                  type="number"
                  inputMode="numeric"
                  className="form-control"
                  min={1990}
                  max={2100}
                  value={form.year}
                  onChange={(e) => setForm({ ...form, year: e.target.value })}
                />
              </div>
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
