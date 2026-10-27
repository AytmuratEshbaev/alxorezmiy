'use client';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminModal } from '@/components/admin/AdminModal';
import { confirmDialog } from '@/components/admin/ConfirmDialog';
import { ListStatus } from '@/components/admin/ListStatus';
import { toast } from '@/components/admin/Toast';
import { toastError } from '@/components/admin/errors';
import { useEditorModal } from '@/components/admin/useEditorModal';
import { validateFields } from '@/components/admin/validate';
import { ApiError, apiFetch } from '@/lib/admin-api';
import { formatDate } from '@/lib/utils';

interface AdminRow {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

interface EditForm {
  name: string;
  password: string;
  confirm: string;
  currentPassword: string;
}

const MIN_PASSWORD = 10;

const emptyEdit = (): EditForm => ({ name: '', password: '', confirm: '', currentPassword: '' });

/** 403 — joriy parol noto'g'ri: maydonga fokus qaytaramiz. */
function handleReauthError(err: unknown, fieldId: string) {
  toastError(err, '');
  if (err instanceof ApiError && err.status === 403) {
    const el = document.getElementById(fieldId) as HTMLInputElement | null;
    el?.focus();
    el?.select();
  }
}

export default function UsersAdminPage() {
  const router = useRouter();
  const [items, setItems] = useState<AdminRow[]>([]);
  const [currentId, setCurrentId] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [newAdmin, setNewAdmin] = useState({
    name: '',
    email: '',
    password: '',
    currentPassword: '',
  });
  const [creating, setCreating] = useState(false);
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [changing, setChanging] = useState(false);

  const edit = useEditorModal<EditForm>(emptyEdit);
  const [editRow, setEditRow] = useState<AdminRow | null>(null);

  const [deleteRow, setDeleteRow] = useState<AdminRow | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
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

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (newAdmin.password.length < MIN_PASSWORD) {
      toast.error(`Parol kamida ${MIN_PASSWORD} belgi bo'lishi kerak`);
      return;
    }
    setCreating(true);
    try {
      await apiFetch('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          name: newAdmin.name.trim(),
          email: newAdmin.email.trim(),
          password: newAdmin.password,
          currentPassword: newAdmin.currentPassword,
        }),
      });
      toast.success("Admin qo'shildi");
      setNewAdmin({ name: '', email: '', password: '', currentPassword: '' });
      void load();
    } catch (err) {
      handleReauthError(err, 'na-current');
    } finally {
      setCreating(false);
    }
  };

  const openEdit = (row: AdminRow) => {
    setEditRow(row);
    edit.openWith(row.id, { ...emptyEdit(), name: row.name || '' });
  };

  const isSelfEdit = editRow?.id === currentId;

  const handleEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editRow) return;
    const f = edit.form;
    const name = f.name.trim();
    const resetting = !isSelfEdit && f.password !== '';
    const valid = validateFields([
      {
        valid: !resetting || f.password.length >= MIN_PASSWORD,
        fieldId: 'edit-password',
        message: `Parol kamida ${MIN_PASSWORD} belgi bo'lishi kerak`,
      },
      {
        valid: !resetting || f.password === f.confirm,
        fieldId: 'edit-confirm',
        message: 'Yangi parollar mos kelmadi',
      },
      {
        valid: !resetting || f.currentPassword !== '',
        fieldId: 'edit-current',
        message: 'Tasdiqlash uchun joriy parolingizni kiriting',
      },
    ]);
    if (!valid) return;

    const body: { name?: string; password?: string; currentPassword?: string } = {};
    if (name !== (editRow.name || '')) body.name = name;
    if (resetting) {
      body.password = f.password;
      body.currentPassword = f.currentPassword;
    }
    if (body.name === undefined && !body.password) {
      edit.closeSaved();
      return;
    }
    if (resetting) {
      const ok = await confirmDialog({
        title: 'Parolni tiklash',
        message: `${editRow.email} uchun yangi parol o'rnatiladi va uning barcha faol sessiyalari yopiladi. Davom etasizmi?`,
        confirmText: 'Ha, almashtirish',
        danger: true,
      });
      if (!ok) return;
    }

    edit.setSubmitting(true);
    try {
      await apiFetch(`/api/admin/users/${encodeURIComponent(editRow.id)}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
      toast.success(resetting ? 'Admin paroli almashtirildi' : "Ma'lumotlar saqlandi");
      edit.closeSaved();
      void load();
      // Sarlavhadagi ism server layout'dan keladi — o'zimizni o'zgartirsak yangilaymiz.
      if (isSelfEdit && body.name !== undefined) router.refresh();
    } catch (err) {
      handleReauthError(err, 'edit-current');
    } finally {
      edit.setSubmitting(false);
    }
  };

  const openDelete = (row: AdminRow) => {
    setDeletePassword('');
    setDeleteRow(row);
  };

  const closeDelete = () => {
    if (deleting) return;
    setDeleteRow(null);
    setDeletePassword('');
  };

  const handleDelete = async (e: FormEvent) => {
    e.preventDefault();
    if (!deleteRow) return;
    if (
      !validateFields([
        {
          valid: deletePassword !== '',
          fieldId: 'delete-current',
          message: 'Tasdiqlash uchun joriy parolingizni kiriting',
        },
      ])
    )
      return;
    setDeleting(true);
    try {
      await apiFetch(`/api/admin/users/${encodeURIComponent(deleteRow.id)}`, {
        method: 'DELETE',
        body: JSON.stringify({ currentPassword: deletePassword }),
      });
      toast.success("Admin o'chirildi");
      setDeleteRow(null);
      setDeletePassword('');
      void load();
    } catch (err) {
      handleReauthError(err, 'delete-current');
    } finally {
      setDeleting(false);
    }
  };

  const handlePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (pw.next !== pw.confirm) {
      toast.error('Yangi parollar mos kelmadi');
      return;
    }
    if (pw.next.length < MIN_PASSWORD) {
      toast.error(`Parol kamida ${MIN_PASSWORD} belgi bo'lishi kerak`);
      return;
    }
    setChanging(true);
    try {
      await apiFetch('/api/admin/password', {
        method: 'POST',
        body: JSON.stringify({ current: pw.current, next: pw.next }),
      });
      toast.success('Parol almashtirildi. Boshqa qurilmalardagi sessiyalar yopildi.');
      setPw({ current: '', next: '', confirm: '' });
    } catch (err) {
      toastError(err, '');
    } finally {
      setChanging(false);
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
                  <th>Email</th>
                  <th>Qo&apos;shilgan</th>
                  <th>Amallar</th>
                </tr>
              </thead>
              <tbody>
                <ListStatus
                  colSpan={4}
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
                    <td>{row.email}</td>
                    <td>{formatDate(row.createdAt)}</td>
                    <td>
                      <div className="table-actions">
                        <button
                          type="button"
                          className="action-btn edit"
                          onClick={() => openEdit(row)}
                          title={row.id === currentId ? 'Ismni tahrirlash' : 'Tahrirlash / parolni tiklash'}
                          aria-label={`${row.email} ni tahrirlash`}
                        >
                          ✍️
                        </button>
                        {row.id !== currentId && (
                          <button
                            type="button"
                            className="action-btn delete"
                            onClick={() => openDelete(row)}
                            title="O'chirish"
                            aria-label={`${row.email} ni o'chirish`}
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

        <div className="cards-grid">
          <form className="admin-card" onSubmit={handleCreate}>
            <div className="card-header">
              <h2 className="card-title">Yangi admin qo&apos;shish</h2>
            </div>
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
              <label htmlFor="na-email">Email *</label>
              <input
                id="na-email"
                type="email"
                className="form-control"
                required
                value={newAdmin.email}
                onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                autoComplete="off"
              />
            </div>
            <div className="form-group">
              <label htmlFor="na-pass">Parol * (kamida {MIN_PASSWORD} belgi)</label>
              <input
                id="na-pass"
                type="password"
                className="form-control"
                required
                minLength={MIN_PASSWORD}
                value={newAdmin.password}
                onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                autoComplete="new-password"
              />
            </div>
            <div className="form-group">
              <label htmlFor="na-current">Joriy parolingiz * (tasdiqlash uchun)</label>
              <input
                id="na-current"
                type="password"
                className="form-control"
                required
                value={newAdmin.currentPassword}
                onChange={(e) => setNewAdmin({ ...newAdmin, currentPassword: e.target.value })}
                autoComplete="current-password"
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={creating}>
              {creating ? 'Saqlanmoqda...' : "Qo'shish"}
            </button>
          </form>

          <form className="admin-card" onSubmit={handlePassword}>
            <div className="card-header">
              <h2 className="card-title">Parolni almashtirish</h2>
            </div>
            <div className="form-group">
              <label htmlFor="pw-current">Joriy parol</label>
              <input
                id="pw-current"
                type="password"
                className="form-control"
                required
                value={pw.current}
                onChange={(e) => setPw({ ...pw, current: e.target.value })}
                autoComplete="current-password"
              />
            </div>
            <div className="form-group">
              <label htmlFor="pw-next">Yangi parol</label>
              <input
                id="pw-next"
                type="password"
                className="form-control"
                required
                minLength={MIN_PASSWORD}
                value={pw.next}
                onChange={(e) => setPw({ ...pw, next: e.target.value })}
                autoComplete="new-password"
              />
            </div>
            <div className="form-group">
              <label htmlFor="pw-confirm">Yangi parol (takror)</label>
              <input
                id="pw-confirm"
                type="password"
                className="form-control"
                required
                minLength={MIN_PASSWORD}
                value={pw.confirm}
                onChange={(e) => setPw({ ...pw, confirm: e.target.value })}
                autoComplete="new-password"
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={changing}>
              {changing ? 'Saqlanmoqda...' : 'Almashtirish'}
            </button>
          </form>
        </div>
      </div>

      {edit.open && editRow && (
        <AdminModal
          title={isSelfEdit ? 'Ismingizni tahrirlash' : `Adminni tahrirlash: ${editRow.email}`}
          onRequestClose={edit.requestClose}
          width={520}
        >
          <form onSubmit={handleEdit} noValidate>
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="edit-name">Ism</label>
                <input
                  id="edit-name"
                  className="form-control"
                  value={edit.form.name}
                  onChange={(e) => edit.setForm({ ...edit.form, name: e.target.value })}
                  autoComplete="off"
                />
              </div>
              {isSelfEdit ? (
                <p className="form-hint form-hint-block">
                  O&apos;z parolingizni &quot;Parolni almashtirish&quot; bo&apos;limida
                  o&apos;zgartiring.
                </p>
              ) : (
                <fieldset className="form-fieldset">
                  <legend>Parolni tiklash (ixtiyoriy)</legend>
                  <p className="form-hint form-hint-block">
                    Yangi parol o&apos;rnatilsa, bu adminning barcha sessiyalari yopiladi.
                  </p>
                  <div className="form-group">
                    <label htmlFor="edit-password">
                      Yangi parol (kamida {MIN_PASSWORD} belgi)
                    </label>
                    <input
                      id="edit-password"
                      type="password"
                      className="form-control"
                      value={edit.form.password}
                      onChange={(e) => edit.setForm({ ...edit.form, password: e.target.value })}
                      autoComplete="new-password"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="edit-confirm">Yangi parol (takror)</label>
                    <input
                      id="edit-confirm"
                      type="password"
                      className="form-control"
                      value={edit.form.confirm}
                      onChange={(e) => edit.setForm({ ...edit.form, confirm: e.target.value })}
                      autoComplete="new-password"
                    />
                  </div>
                  {edit.form.password !== '' && (
                    <div className="form-group">
                      <label htmlFor="edit-current">Joriy parolingiz * (tasdiqlash uchun)</label>
                      <input
                        id="edit-current"
                        type="password"
                        className="form-control"
                        value={edit.form.currentPassword}
                        onChange={(e) =>
                          edit.setForm({ ...edit.form, currentPassword: e.target.value })
                        }
                        autoComplete="current-password"
                      />
                    </div>
                  )}
                </fieldset>
              )}
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
          <form onSubmit={handleDelete} noValidate>
            <div className="modal-body">
              <p className="modal-text">
                <strong>{deleteRow.email}</strong> endi admin panelga kira olmaydi va uning barcha
                sessiyalari yopiladi.
              </p>
              <div className="form-group">
                <label htmlFor="delete-current">Joriy parolingiz * (tasdiqlash uchun)</label>
                <input
                  id="delete-current"
                  type="password"
                  className="form-control"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline" onClick={closeDelete}>
                Bekor qilish
              </button>
              <button type="submit" className="btn btn-danger" disabled={deleting}>
                {deleting ? "O'chirilmoqda..." : "Ha, o'chirish"}
              </button>
            </div>
          </form>
        </AdminModal>
      )}
    </>
  );
}
