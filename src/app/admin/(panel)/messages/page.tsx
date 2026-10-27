'use client';
import { useState } from 'react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { confirmDialog } from '@/components/admin/ConfirmDialog';
import { toast } from '@/components/admin/Toast';
import { toastError } from '@/components/admin/errors';
import { ListErrorBanner, ListStatus, LoadMoreButton } from '@/components/admin/ListStatus';
import { useCollection } from '@/components/admin/useCollection';
import { updateDocument, updateMany, deleteDocument } from '@/lib/admin-api';
import { formatDate } from '@/lib/utils';

interface Message {
  id: string;
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
  read?: boolean;
  createdAt?: string;
}

type Filter = 'all' | 'unread' | 'read';

export default function MessagesAdminPage() {
  const list = useCollection<Message>('messages', {
    orderBy: 'createdAt',
    direction: 'desc',
    pageSize: 100,
    paginate: true,
  });
  const { items } = list;
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');

  const q = search.trim().toLowerCase();
  const filtered = items.filter((m) => {
    if (filter === 'unread' && m.read) return false;
    if (filter === 'read' && !m.read) return false;
    if (q && ![m.name, m.email, m.subject, m.message].some((v) => (v || '').toLowerCase().includes(q)))
      return false;
    return true;
  });

  const total = items.length;
  const unread = items.filter((m) => !m.read).length;
  const more = list.hasMore ? '+' : '';

  const markRead = async (id: string, read: boolean) => {
    try {
      await updateDocument('messages', id, { read });
    } catch (err) {
      toastError(err);
    }
  };

  const markAllRead = async () => {
    const ids = items.filter((m) => !m.read).map((m) => m.id);
    if (ids.length === 0) return;
    try {
      await updateMany('messages', ids, { read: true });
      toast.success(`${ids.length} ta xabar o'qildi deb belgilandi`);
    } catch (err) {
      toastError(err);
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await confirmDialog({
      title: "O'chirish",
      message: "Xabarni butunlay o'chirmoqchimisiz?",
      confirmText: "Ha, o'chirish",
      danger: true,
    });
    if (!ok) return;
    try {
      await deleteDocument('messages', id);
      toast.success("Xabar o'chirildi");
    } catch (err) {
      toastError(err);
    }
  };

  const filters: { key: Filter; label: string }[] = [
    { key: 'all', label: `Barchasi (${total}${more})` },
    { key: 'unread', label: `O'qilmagan (${unread})` },
    { key: 'read', label: `O'qilgan (${total - unread})` },
  ];

  return (
    <>
      <AdminHeader title="Xabarlar" />
      <div className="content-area">
        <div className="admin-card">
          <div className="card-header">
            <h2 className="card-title">Foydalanuvchilardan kelgan xabarlar</h2>
            {unread > 0 && (
              <button type="button" className="btn btn-outline" onClick={markAllRead}>
                ✓ Yuklanganlarni o&apos;qildi deb belgilash
              </button>
            )}
          </div>
          <div className="admin-toolbar">
            <div className="admin-filters" role="group" aria-label="Xabarlar filtri">
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
              placeholder="Ism, email yoki matn bo'yicha qidirish..."
              aria-label="Xabarlarni qidirish"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <ListErrorBanner error={list.error} hasItems={items.length > 0} onRetry={list.reload} />
          <ListStatus
            loading={list.loading}
            error={list.error}
            total={total}
            shown={filtered.length}
            emptyText={
              <>
                <div className="list-state-icon" aria-hidden="true">
                  📭
                </div>
                <p>Xabarlar yo&apos;q</p>
              </>
            }
            noMatchText={filter === 'unread' && !q ? "O'qilmagan xabar yo'q" : 'Topilmadi'}
            onRetry={list.reload}
          />
          {filtered.length > 0 && (
            <div className="message-list">
              {filtered.map((m) => (
                <article key={m.id} className={'message-card ' + (m.read ? 'read' : 'unread')}>
                  <div className="message-meta">
                    <div>
                      <strong>{m.name}</strong>
                      <span className="text-muted"> · {m.email}</span>
                    </div>
                    <span className="text-muted small">{formatDate(m.createdAt)}</span>
                  </div>
                  <h4 className="message-subject">{m.subject}</h4>
                  <p className="message-body">{m.message}</p>
                  <div className="message-actions">
                    <a
                      href={`mailto:${encodeURIComponent(m.email || '')}?subject=Re: ${encodeURIComponent(m.subject || '')}`}
                      className="btn btn-outline btn-sm"
                    >
                      ✉️ Javob berish
                    </a>
                    {!m.read ? (
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => markRead(m.id, true)}
                      >
                        ✓ O&apos;qildi deb belgilash
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => markRead(m.id, false)}
                      >
                        ↺ O&apos;qilmagan deb belgilash
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(m.id)}
                    >
                      🗑️ O&apos;chirish
                    </button>
                  </div>
                </article>
              ))}
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
