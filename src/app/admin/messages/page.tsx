'use client';
import { useEffect, useState } from 'react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { confirmDialog } from '@/components/admin/ConfirmDialog';
import {
  subscribeCollection,
  updateDocument,
  deleteDocument
} from '@/lib/firebase/client-queries';
import { formatDate } from '@/lib/utils';

interface Message {
  id: string;
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
  read?: boolean;
  createdAt?: { toDate: () => Date };
}

type Filter = 'all' | 'unread' | 'read';

export default function MessagesAdminPage() {
  const [items, setItems] = useState<Message[]>([]);
  const [filter, setFilter] = useState<Filter>('all');

  useEffect(() => {
    const unsub = subscribeCollection<Message>(
      'messages',
      (data) => setItems(data),
      { orderBy: 'createdAt', direction: 'desc' }
    );
    return () => unsub();
  }, []);

  const filtered = items.filter((m) => {
    if (filter === 'unread') return !m.read;
    if (filter === 'read') return !!m.read;
    return true;
  });

  const total = items.length;
  const unread = items.filter((m) => !m.read).length;

  const markRead = async (id: string, read: boolean) => {
    try {
      await updateDocument('messages', id, { read });
    } catch (err) {
      alert('Xatolik: ' + (err as Error).message);
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await confirmDialog({
      title: "O'chirish",
      message: "Xabarni butunlay o'chirmoqchimisiz?",
      confirmText: "Ha, o'chirish",
      danger: true
    });
    if (!ok) return;
    try {
      await deleteDocument('messages', id);
    } catch (err) {
      alert('Xatolik: ' + (err as Error).message);
    }
  };

  return (
    <>
      <AdminHeader title="Xabarlar" />
      <div className="content-area">
        <div className="admin-card">
          <div className="card-header">
            <h2 className="card-title">Foydalanuvchilardan kelgan xabarlar</h2>
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            <button
              className={'btn ' + (filter === 'all' ? 'btn-primary' : 'btn-outline')}
              onClick={() => setFilter('all')}
            >
              Barchasi ({total})
            </button>
            <button
              className={'btn ' + (filter === 'unread' ? 'btn-primary' : 'btn-outline')}
              onClick={() => setFilter('unread')}
            >
              O&apos;qilmagan ({unread})
            </button>
            <button
              className={'btn ' + (filter === 'read' ? 'btn-primary' : 'btn-outline')}
              onClick={() => setFilter('read')}
            >
              O&apos;qilgan ({total - unread})
            </button>
          </div>

          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#94A3B8' }}>
              <div style={{ fontSize: '3rem', marginBottom: 12 }}>📭</div>
              <p>{filter === 'unread' ? "O'qilmagan xabar yo'q" : "Xabarlar yo'q"}</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filtered.map((m) => (
                <div
                  key={m.id}
                  className={'message-card ' + (m.read ? 'read' : 'unread')}
                  style={{
                    background: 'white',
                    borderRadius: 12,
                    padding: 18,
                    border: m.read ? '1px solid #E2E8F0' : '1px solid #6366F1'
                  }}
                >
                  <div className="message-meta" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                    <div>
                      <strong>{m.name}</strong>
                      <span style={{ color: '#64748B' }}> · {m.email}</span>
                    </div>
                    <span style={{ color: '#94A3B8', fontSize: '0.85rem' }}>{formatDate(m.createdAt)}</span>
                  </div>
                  <h4 style={{ margin: '8px 0' }}>{m.subject}</h4>
                  <p style={{ whiteSpace: 'pre-line', color: '#475569', lineHeight: 1.6 }}>{m.message}</p>
                  <div className="message-actions" style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                    <a
                      href={`mailto:${encodeURIComponent(m.email || '')}?subject=Re: ${encodeURIComponent(m.subject || '')}`}
                      className="btn btn-outline btn-sm"
                    >
                      ✉️ Javob berish
                    </a>
                    {!m.read ? (
                      <button className="btn btn-outline btn-sm" onClick={() => markRead(m.id, true)}>
                        ✓ O&apos;qildi deb belgilash
                      </button>
                    ) : (
                      <button className="btn btn-outline btn-sm" onClick={() => markRead(m.id, false)}>
                        ↺ O&apos;qilmagan deb belgilash
                      </button>
                    )}
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(m.id)}>
                      🗑️ O&apos;chirish
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
