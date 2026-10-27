'use client';
import { useState } from 'react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { confirmDialog } from '@/components/admin/ConfirmDialog';
import { toast } from '@/components/admin/Toast';
import { toastError } from '@/components/admin/errors';
import { APPLICATION_STATUSES } from '@/components/admin/labels';
import { ListErrorBanner, ListStatus, LoadMoreButton } from '@/components/admin/ListStatus';
import { useCollection } from '@/components/admin/useCollection';
import { updateDocument, updateMany, deleteDocument } from '@/lib/admin-api';
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

type Filter = 'all' | 'unread' | string;

export default function ApplicationsAdminPage() {
  const list = useCollection<Application>('applications', {
    orderBy: 'createdAt',
    direction: 'desc',
    pageSize: 100,
    paginate: true,
  });
  const { items } = list;
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');

  const q = search.trim().toLowerCase();
  const filtered = items.filter((a) => {
    if (filter === 'unread' && a.read) return false;
    if (filter !== 'all' && filter !== 'unread' && a.status !== filter) return false;
    if (
      q &&
      ![a.studentName, a.phone, a.grade, a.message].some((v) => (v || '').toLowerCase().includes(q))
    )
      return false;
    return true;
  });
  const unread = items.filter((a) => !a.read).length;

  const update = async (id: string, data: Partial<Application>) => {
    try {
      await updateDocument('applications', id, data);
    } catch (err) {
      toastError(err);
    }
  };

  const markAllRead = async () => {
    const ids = items.filter((a) => !a.read).map((a) => a.id);
    if (ids.length === 0) return;
    try {
      await updateMany('applications', ids, { read: true });
      toast.success(`${ids.length} ta ariza ko'rildi deb belgilandi`);
    } catch (err) {
      toastError(err);
    }
  };

  const handleDelete = async (a: Application) => {
    const ok = await confirmDialog({
      title: "O'chirish",
      message: `${a.studentName} arizasini butunlay o'chirmoqchimisiz?`,
      confirmText: "Ha, o'chirish",
      danger: true,
    });
    if (!ok) return;
    try {
      await deleteDocument('applications', a.id);
      toast.success("Ariza o'chirildi");
    } catch (err) {
      toastError(err);
    }
  };

  const filters: { key: Filter; label: string }[] = [
    { key: 'all', label: `Barchasi (${items.length}${list.hasMore ? '+' : ''})` },
    { key: 'unread', label: `Ko'rilmagan (${unread})` },
    ...APPLICATION_STATUSES.map((s) => ({ key: s.value, label: s.label })),
  ];

  return (
    <>
      <AdminHeader title="Qabul arizalari" />
      <div className="content-area">
        <div className="admin-card">
          <div className="card-header">
            <h2 className="card-title">Onlayn qabul arizalari</h2>
            {unread > 0 && (
              <button type="button" className="btn btn-outline" onClick={markAllRead}>
                ✓ Yuklanganlarni ko&apos;rildi deb belgilash
              </button>
            )}
          </div>
          <div className="admin-toolbar">
            <div className="admin-filters" role="group" aria-label="Arizalar filtri">
              {filters.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  className={'btn ' + (filter === f.key ? 'btn-primary' : 'btn-outline')}
                  aria-pressed={filter === f.key}
                  onClick={() => setFilter(f.key)}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <input
              type="search"
              className="form-control toolbar-search"
              placeholder="Ism, telefon yoki izoh bo'yicha qidirish..."
              aria-label="Arizalarni qidirish"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <ListErrorBanner error={list.error} hasItems={items.length > 0} onRetry={list.reload} />
          <ListStatus
            loading={list.loading}
            error={list.error}
            total={items.length}
            shown={filtered.length}
            emptyText={
              <>
                <div className="list-state-icon" aria-hidden="true">
                  📭
                </div>
                <p>Arizalar yo&apos;q</p>
              </>
            }
            noMatchText="Mos ariza topilmadi"
            onRetry={list.reload}
          />
          {filtered.length > 0 && (
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
                    <tr key={a.id} className={a.read ? undefined : 'row-unread'}>
                      <td>
                        <strong>{a.studentName}</strong>
                      </td>
                      <td>
                        <a href={`tel:${a.phone.replace(/[^\d+]/g, '')}`} className="text-primary">
                          {a.phone}
                        </a>
                      </td>
                      <td>{a.grade}</td>
                      <td className="cell-note">{a.message || '—'}</td>
                      <td>{formatDate(a.createdAt)}</td>
                      <td>
                        <select
                          className="form-control status-select"
                          value={a.status}
                          aria-label={`${a.studentName} — ariza holati`}
                          onChange={(e) => update(a.id, { status: e.target.value, read: true })}
                        >
                          {APPLICATION_STATUSES.map((s) => (
                            <option key={s.value} value={s.value}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <div className="table-actions">
                          <button
                            type="button"
                            className="action-btn edit"
                            onClick={() => update(a.id, { read: !a.read })}
                            title={a.read ? "Ko'rilmagan deb belgilash" : "Ko'rildi deb belgilash"}
                            aria-label={
                              a.read ? "Ko'rilmagan deb belgilash" : "Ko'rildi deb belgilash"
                            }
                          >
                            {a.read ? '↺' : '✓'}
                          </button>
                          <button
                            type="button"
                            className="action-btn delete"
                            onClick={() => handleDelete(a)}
                            title="O'chirish"
                            aria-label={`${a.studentName} arizasini o'chirish`}
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
          )}
          <LoadMoreButton
            hasMore={list.hasMore}
            loadingMore={list.loadingMore}
            onLoadMore={list.loadMore}
          />
        </div>
      </div>
    </>
  );
}
