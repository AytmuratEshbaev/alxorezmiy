'use client';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { confirmDialog } from '@/components/admin/ConfirmDialog';
import { toast } from '@/components/admin/Toast';
import { apiFetch } from '@/lib/admin-api';
import { formatDate } from '@/lib/utils';

interface AdminRow {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

const MIN_PASSWORD = 10;

export default function UsersAdminPage() {
  const [items, setItems] = useState<AdminRow[]>([]);
  const [currentId, setCurrentId] = useState('');
  const [newAdmin, setNewAdmin] = useState({ name: '', email: '', password: '' });
  const [creating, setCreating] = useState(false);
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [changing, setChanging] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await apiFetch<{ items: AdminRow[]; currentId: string }>('/api/admin/users');
      setItems(data.items);
      setCurrentId(data.currentId);
    } catch (err) {
      toast.error('Xatolik: ' + (err as Error).message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (newAdmin.password.length < MIN_PASSWORD) {
      toast.error(`Parol kamida ${MIN_PASSWORD} belgi bo'lishi kerak`);
      return;
    }
    setCreating(true);
    try {
      await apiFetch('/api/admin/users', { method: 'POST', body: JSON.stringify(newAdmin) });
      toast.success("Admin qo'shildi");
      setNewAdmin({ name: '', email: '', password: '' });
      load();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (row: AdminRow) => {
    const ok = await confirmDialog({
      title: "Adminni o'chirish",
      message: `${row.email} endi admin panelga kira olmaydi. Davom etasizmi?`,
      confirmText: "Ha, o'chirish",
      danger: true
    });
    if (!ok) return;
    try {
      await apiFetch(`/api/admin/users/${row.id}`, { method: 'DELETE' });
      toast.success("Admin o'chirildi");
      load();
    } catch (err) {
      toast.error((err as Error).message);
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
        body: JSON.stringify({ current: pw.current, next: pw.next })
      });
      toast.success('Parol almashtirildi. Boshqa qurilmalardagi sessiyalar yopildi.');
      setPw({ current: '', next: '', confirm: '' });
    } catch (err) {
      toast.error((err as Error).message);
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
                {items.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <strong>{row.name || '—'}</strong>
                      {row.id === currentId && (
                        <span className="badge badge-success" style={{ marginLeft: 8 }}>
                          Siz
                        </span>
                      )}
                    </td>
                    <td>{row.email}</td>
                    <td>{formatDate(row.createdAt)}</td>
                    <td>
                      {row.id !== currentId && (
                        <div className="table-actions">
                          <button
                            className="action-btn delete"
                            onClick={() => handleDelete(row)}
                            title="O'chirish"
                            aria-label={`${row.email} ni o'chirish`}
                          >
                            🗑️
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, marginTop: 20 }}>
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
    </>
  );
}
