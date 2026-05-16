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

interface OlyItem {
  id: string;
  student?: string;
  subject?: string;
  level?: string;
  place?: number;
  olympiad_name?: string;
  year?: number;
}

const LEVEL_LABELS: Record<string, string> = {
  xalqaro: '🌍 Xalqaro',
  respublika: '🏛️ Respublika',
  shahar: '🏙️ Shahar',
  tuman: '🏘️ Tuman'
};

interface FormState {
  student: string;
  subject: string;
  level: string;
  place: number;
  olympiad_name: string;
  year: number;
}

const currentYear = () => new Date().getFullYear();

const emptyForm = (): FormState => ({
  student: '',
  subject: '',
  level: 'respublika',
  place: 1,
  olympiad_name: '',
  year: currentYear()
});

export default function OlympiadAdminPage() {
  const [items, setItems] = useState<OlyItem[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const unsub = subscribeCollection<OlyItem>('olympiad', (data) => {
      data.sort((a, b) => (b.year || 0) - (a.year || 0) || (a.place || 99) - (b.place || 99));
      setItems(data);
    });
    return () => unsub();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setModalOpen(true);
  };

  const openEdit = (item: OlyItem) => {
    setEditingId(item.id);
    setForm({
      student: item.student || '',
      subject: item.subject || '',
      level: item.level || 'respublika',
      place: item.place || 1,
      olympiad_name: item.olympiad_name || '',
      year: item.year || currentYear()
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
  };

  useEscapeKey(modalOpen, closeModal);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.student.trim()) {
      toast.error("O'quvchi ismi majburiy");
      return;
    }
    setSubmitting(true);
    const data = {
      student: form.student.trim(),
      subject: form.subject.trim(),
      level: form.level,
      place: form.place,
      olympiad_name: form.olympiad_name.trim(),
      year: form.year
    };
    try {
      if (editingId) {
        await updateDocument('olympiad', editingId, data);
        toast.success('Natija yangilandi');
      } else {
        await addDocument('olympiad', data);
        toast.success("Natija qo'shildi");
      }
      closeModal();
    } catch (err) {
      toast.error('Xatolik: ' + (err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (item: OlyItem) => {
    const ok = await confirmDialog({
      title: "O'chirish",
      message: `"${item.student}" natijasini o'chirmoqchimisiz?`,
      confirmText: "Ha, o'chirish",
      danger: true
    });
    if (!ok) return;
    try {
      await deleteDocument('olympiad', item.id);
      toast.success("Natija o'chirildi");
    } catch (err) {
      toast.error('Xatolik: ' + (err as Error).message);
    }
  };

  return (
    <>
      <AdminHeader title="Olimpiada natijalari" />
      <div className="content-area">
        <div className="admin-card">
          <div className="card-header">
            <h2 className="card-title">Natijalar</h2>
            <button className="btn btn-primary" onClick={openCreate}>+ Qo&apos;shish</button>
          </div>
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
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#94A3B8' }}>
                      Hali natijalar yo&apos;q.
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.id}>
                      <td><strong>{item.student || '—'}</strong></td>
                      <td>{item.subject || '—'}</td>
                      <td><span className="badge badge-warning">{LEVEL_LABELS[item.level || ''] || item.level}</span></td>
                      <td><strong style={{ color: 'var(--primary)' }}>{item.place || '—'}</strong>-o&apos;rin</td>
                      <td>{item.olympiad_name || '—'}</td>
                      <td>{item.year || '—'}</td>
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
          <div className="modal" style={{ maxWidth: 560 }}>
            <div className="modal-header">
              <h3 className="modal-title">{editingId ? 'Natijani tahrirlash' : "Yangi natija qo'shish"}</h3>
              <button className="modal-close" type="button" onClick={closeModal}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>O&apos;quvchi ismi *</label>
                  <input type="text" className="form-control" required value={form.student} onChange={(e) => setForm({ ...form, student: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Fan</label>
                  <input type="text" className="form-control" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="form-group">
                    <label>Daraja</label>
                    <select className="form-control" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>
                      <option value="xalqaro">🌍 Xalqaro</option>
                      <option value="respublika">🏛️ Respublika</option>
                      <option value="shahar">🏙️ Shahar</option>
                      <option value="tuman">🏘️ Tuman</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>O&apos;rin</label>
                    <input type="number" className="form-control" min={1} value={form.place} onChange={(e) => setForm({ ...form, place: parseInt(e.target.value, 10) || 1 })} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Olimpiada nomi</label>
                  <input type="text" className="form-control" value={form.olympiad_name} onChange={(e) => setForm({ ...form, olympiad_name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Yil</label>
                  <input type="number" className="form-control" min={1990} max={2100} value={form.year} onChange={(e) => setForm({ ...form, year: parseInt(e.target.value, 10) || currentYear() })} />
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
