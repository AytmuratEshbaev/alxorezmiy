'use client';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminModal } from '@/components/admin/AdminModal';
import { ListStatus } from '@/components/admin/ListStatus';
import { toast } from '@/components/admin/Toast';
import { toastError } from '@/components/admin/errors';
import { useEditorModal } from '@/components/admin/useEditorModal';
import { useAuth } from '@/contexts/AuthContext';
import { ApiError, apiFetch } from '@/lib/admin-api';
import { formatDate } from '@/lib/utils';

interface AdminRow {
  id: string;
  telegramId: string;
  name: string;
  username: string;
  createdAt: string;
  lastLoginAt: string;
}

interface EditForm {
  name: string;
}

const emptyEdit = (): EditForm => ({ name: '' });

const label = (row: AdminRow) => row.name || (row.username ? `@${row.username}` : row.telegramId);

export default function UsersAdminPage() {
  const router = useRouter();
  const { reauthenticate } = useAuth();
  const [items, setItems] = useState<AdminRow[]>([]);
  const [currentId, setCurrentId] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [newAdmin, setNewAdmin] = useState({ name: '', telegramId: '' });
  const [creating, setCreating] = useState(false);

  const edit = useEditorModal<EditForm>(emptyEdit);
  const [editRow, setEditRow] = useState<AdminRow | null>(null);

  const [deleteRow, setDeleteRow] = useState<AdminRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<{ items: AdminRow[]; currentId: string }>('/api/admin/users');
      setItems(data.items);
      setCurrentId(data.currentId);
      setLoadError(null);
    } catch (err) {
      setLoadError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  /**
   * Xavfli amal: server 403 qaytarsa (so'nggi tasdiqdan 15 daqiqadan ko'p o'tgan) — Telegram
   * orqali qayta tasdiqlab, bir marta takrorlaymiz. false — foydalanuvchi bekor qildi.
   */
  const withReauth = async (action: () => Promise<unknown>): Promise<boolean> => {
    try {
      await action();
      return true;
    } catch (err) {
      if (!(err instanceof ApiError && err.status === 403)) throw err;
      if (!(await reauthenticate())) return false;
      await action();
      return true;
    }
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    const telegramId = newAdmin.telegramId.trim();
    if (!/^\d{1,20}$/.test(telegramId)) {
      toast.error("Telegram ID faqat raqamlardan iborat bo'lishi kerak");
      document.getElementById('na-tgid')?.focus();
      return;
    }
    setCreating(true);
    try {
      const done = await withReauth(() =>
        apiFetch('/api/admin/users', {
          method: 'POST',
          body: JSON.stringify({ name: newAdmin.name.trim(), telegramId }),
        })
      );
      if (!done) return;
      toast.success("Admin qo'shildi. Endi u Telegram orqali kira oladi.");
      setNewAdmin({ name: '', telegramId: '' });
      void load();
    } catch (err) {
      toastError(err, '');
    } finally {
      setCreating(false);
    }
  };

  const openEdit = (row: AdminRow) => {
    setEditRow(row);
    edit.openWith(row.id, { name: row.name || '' });
  };

  const isSelfEdit = editRow?.id === currentId;

  const handleEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editRow) return;
    const name = edit.form.name.trim();
    if (name === (editRow.name || '')) {
      edit.closeSaved();
      return;
    }
    edit.setSubmitting(true);
    try {
      await apiFetch(`/api/admin/users/${encodeURIComponent(editRow.id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ name }),
      });
      toast.success("Ma'lumotlar saqlandi");
      edit.closeSaved();
      void load();
      // Sarlavhadagi ism server layout'dan keladi — o'zimizni o'zgartirsak yangilaymiz.
      if (isSelfEdit) router.refresh();
    } catch (err) {
      toastError(err, '');
    } finally {
      edit.setSubmitting(false);
    }
  };

  const closeDelete = () => {
    if (!deleting) setDeleteRow(null);
  };

  const handleDelete = async () => {
    if (!deleteRow) return;
    setDeleting(true);
    try {
      const done = await withReauth(() =>
        apiFetch(`/api/admin/users/${encodeURIComponent(deleteRow.id)}`, { method: 'DELETE' })
      );
      if (!done) return;
      toast.success("Admin o'chirildi");
      setDeleteRow(null);
      void load();
    } catch (err) {
      toastError(err, '');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <AdminHeader title="Adminlar" />
      <div className="content-area">
        <div className="admin-card">
          <div className="card-header">
            <h2 className="card-title">Admin foydalanuvchilar</h2>
          </div>
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Ism</th>
                  <th>Telegram</th>
                  <th>Oxirgi kirish</th>
                  <th>Qo&apos;shilgan</th>
                  <th>Amallar</th>
                </tr>
              </thead>
              <tbody>
                <ListStatus
                  colSpan={5}
                  loading={loading}
                  error={loadError}
                  total={items.length}
                  shown={items.length}
                  emptyText="Adminlar topilmadi"
                  onRetry={() => void load()}
                />
                {items.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <strong>{row.name || '—'}</strong>
                      {row.id === currentId && <span className="badge badge-success ml-2">Siz</span>}
                    </td>
                    <td>
                      {row.username && <div>@{row.username}</div>}
                      <span className="text-muted">ID: {row.telegramId}</span>
                    </td>
                    <td>{row.lastLoginAt ? formatDate(row.lastLoginAt) : 'Hali kirmagan'}</td>
                    <td>{formatDate(row.createdAt)}</td>
                    <td>
                      <div className="table-actions">
                        <button
                          type="button"
                          className="action-btn edit"
                          onClick={() => openEdit(row)}
                          title="Ismni tahrirlash"
                          aria-label={`${label(row)} ni tahrirlash`}
                        >
                          ✍️
                        </button>
                        {row.id !== currentId && (
                          <button
                            type="button"
                            className="action-btn delete"
                            onClick={() => setDeleteRow(row)}
                            title="O'chirish"
                            aria-label={`${label(row)} ni o'chirish`}
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <form className="admin-card" onSubmit={handleCreate} style={{ maxWidth: 560 }}>
          <div className="card-header">
            <h2 className="card-title">Yangi admin qo&apos;shish</h2>
          </div>
          <p className="form-hint form-hint-block">
            Yangi admin saytning Telegram botiga <code>/start</code> yozsin — bot unga Telegram ID
            raqamini yuboradi. Shu raqamni bu yerga kiriting.
          </p>
          <div className="form-group">
            <label htmlFor="na-name">Ism</label>
            <input
              id="na-name"
              className="form-control"
              value={newAdmin.name}
              onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
              autoComplete="off"
            />
          </div>
          <div className="form-group">
            <label htmlFor="na-tgid">Telegram ID *</label>
            <input
              id="na-tgid"
              className="form-control"
              required
              inputMode="numeric"
              pattern="\d{1,20}"
              placeholder="123456789"
              value={newAdmin.telegramId}
              onChange={(e) => setNewAdmin({ ...newAdmin, telegramId: e.target.value })}
              autoComplete="off"
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={creating}>
            {creating ? 'Saqlanmoqda...' : "Qo'shish"}
          </button>
        </form>
      </div>

      {edit.open && editRow && (
        <AdminModal
          title={isSelfEdit ? 'Ismingizni tahrirlash' : `Adminni tahrirlash: ${label(editRow)}`}
          onRequestClose={edit.requestClose}
          width={460}
        >
          <form onSubmit={handleEdit} noValidate>
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="edit-name">Ism</label>
                <input
                  id="edit-name"
                  className="form-control"
                  value={edit.form.name}
                  onChange={(e) => edit.setForm({ name: e.target.value })}
                  autoComplete="off"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline" onClick={edit.requestClose}>
                Bekor qilish
              </button>
              <button type="submit" className="btn btn-primary" disabled={edit.submitting}>
                {edit.submitting ? 'Saqlanmoqda...' : 'Saqlash'}
              </button>
            </div>
          </form>
        </AdminModal>
      )}

      {deleteRow && (
        <AdminModal title="Adminni o'chirish" onRequestClose={closeDelete} width={460}>
          <div className="modal-body">
            <p className="modal-text">
              <strong>{label(deleteRow)}</strong> endi admin panelga kira olmaydi va uning barcha
              sessiyalari yopiladi.
            </p>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={closeDelete}>
              Bekor qilish
            </button>
            <button
              type="button"
              className="btn btn-danger"
              disabled={deleting}
              onClick={() => void handleDelete()}
            >
              {deleting ? "O'chirilmoqda..." : "Ha, o'chirish"}
            </button>
          </div>
        </AdminModal>
      )}
    </>
  );
}
