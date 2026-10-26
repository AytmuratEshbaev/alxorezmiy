'use client';
import { useEffect, useState } from 'react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { confirmDialog } from '@/components/admin/ConfirmDialog';
import { toast } from '@/components/admin/Toast';
import { subscribeCollection, updateDocument, updateMany, deleteDocument } from '@/lib/admin-api';
import { formatDate } from '@/lib/utils';

interface Application {
  id: string;
  studentName: string;
  phone: string;
  grade: string;
  message: string;
  status: string;
  read: boolean;
  createdAt: string;
}

const STATUS_LABELS: Record<string, string> = {
  new: 'Yangi',
  contacted: "Bog'lanildi",
  accepted: 'Qabul qilindi',
  rejected: 'Rad etildi'
};

type Filter = 'all' | 'unread' | keyof typeof STATUS_LABELS;

export default function ApplicationsAdminPage() {
  const [items, setItems] = useState<Application[]>([]);
  const [filter, setFilter] = useState<Filter>('all');

  useEffect(() => {
    return subscribeCollection<Application>('applications', setItems, { orderBy: 'createdAt', direction: 'desc' });
  }, []);

  const filtered = items.filter((a) => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !a.read;
    return a.status === filter;
  });
  const unread = items.filter((a) => !a.read).length;

  const update = async (id: string, data: Partial<Application>) => {
    try {
      await updateDocument('applications', id, data);
    } catch (err) {
      toast.error('Xatolik: ' + (err as Error).message);
    }
  };

  const markAllRead = async () => {
    const ids = items.filter((a) => !a.read).map((a) => a.id);
    if (ids.length === 0) return;
    try {
      await updateMany('applications', ids, { read: true });
      toast.success(`${ids.length} ta ariza ko'rildi deb belgilandi`);
    } catch (err) {
      toast.error('Xatolik: ' + (err as Error).message);
    }
  };

  const handleDelete = async (a: Application) => {
    const ok = await confirmDialog({
      title: "O'chirish",
      message: `${a.studentName} arizasini butunlay o'chirmoqchimisiz?`,
      confirmText: "Ha, o'chirish",
      danger: true
    });
    if (!ok) return;
    try {
      await deleteDocument('applications', a.id);
      toast.success("Ariza o'chirildi");
    } catch (err) {
      toast.error('Xatolik: ' + (err as Error).message);
    }
  };

  const filters: { key: Filter; label: string }[] = [
    { key: 'all', label: `Barchasi (${items.length})` },
    { key: 'unread', label: `Ko'rilmagan (${unread})` },
    ...Object.entries(STATUS_LABELS).map(([key, label]) => ({ key: key as Filter, label }))
  ];

  return (
    <>
      <AdminHeader title="Qabul arizalari" />
      <div className="content-area">
        <div className="admin-card">
          <div className="card-header">
            <h2 className="card-title">Onlayn qabul arizalari</h2>
            {unread > 0 && (
              <button className="btn btn-outline" onClick={markAllRead}>
                ✓ Hammasini ko&apos;rildi deb belgilash
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {filters.map((f) => (
              <button
                key={f.key}
                className={'btn ' + (filter === f.key ? 'btn-primary' : 'btn-outline')}
                onClick={() => setFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#94A3B8' }}>
              <div style={{ fontSize: '3rem', marginBottom: 12 }}>📭</div>
              <p>Arizalar yo&apos;q</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>O&apos;quvchi</th>
                    <th>Telefon</th>
                    <th>Sinf</th>
                    <th>Izoh</th>
                    <th>Sana</th>
                    <th>Holat</th>
                    <th>Amallar</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((a) => (
                    <tr key={a.id} style={a.read ? undefined : { background: 'rgba(99,102,241,0.06)' }}>
                      <td>
                        <strong>{a.studentName}</strong>
                      </td>
                      <td>
                        <a href={`tel:${a.phone.replace(/[^\d+]/g, '')}`} style={{ color: 'var(--primary)' }}>
                          {a.phone}
                        </a>
                      </td>
                      <td>{a.grade}</td>
                      <td style={{ maxWidth: 280, whiteSpace: 'pre-line', color: '#475569' }}>{a.message || '—'}</td>
                      <td>{formatDate(a.createdAt)}</td>
                      <td>
                        <select
                          className="form-control"
                          style={{ minWidth: 140 }}
                          value={a.status}
                          aria-label="Ariza holati"
                          onChange={(e) => update(a.id, { status: e.target.value, read: true })}
                        >
                          {Object.entries(STATUS_LABELS).map(([k, label]) => (
                            <option key={k} value={k}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <div className="table-actions">
                          <button
                            className="action-btn edit"
                            onClick={() => update(a.id, { read: !a.read })}
                            title={a.read ? "Ko'rilmagan deb belgilash" : "Ko'rildi deb belgilash"}
                          >
                            {a.read ? '↺' : '✓'}
                          </button>
                          <button className="action-btn delete" onClick={() => handleDelete(a)} title="O'chirish">
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
