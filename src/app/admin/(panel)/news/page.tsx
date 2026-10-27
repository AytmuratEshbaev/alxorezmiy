'use client';
import { useState, type FormEvent } from 'react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminModal } from '@/components/admin/AdminModal';
import { confirmDialog } from '@/components/admin/ConfirmDialog';
import { ImageField } from '@/components/admin/ImageField';
import { toast } from '@/components/admin/Toast';
import { toastError } from '@/components/admin/errors';
import {
  NEWS_CATEGORIES,
  NEWS_CATEGORY_LABELS,
  NEWS_STATUSES,
  NEWS_STATUS_LABELS,
} from '@/components/admin/labels';
import { LANGS, emptyLangRecord, pickLang, spreadLang, type Lang } from '@/components/admin/lang';
import { LangPanel, LangTabs } from '@/components/admin/LangTabs';
import { ListErrorBanner, ListStatus, LoadMoreButton } from '@/components/admin/ListStatus';
import { useCollection } from '@/components/admin/useCollection';
import { useEditorModal } from '@/components/admin/useEditorModal';
import { validateFields } from '@/components/admin/validate';
import { addDocument, updateDocument, deleteDocument } from '@/lib/admin-api';
import { formatDate } from '@/lib/utils';

interface NewsItem {
  id: string;
  category?: string;
  status?: string;
  image?: string;
  imageId?: string;
  createdAt?: string;
  publishedAt?: string;
  title_uz?: string;
  title_ru?: string;
  title_kk?: string;
  title_en?: string;
  content_uz?: string;
  content_ru?: string;
  content_kk?: string;
  content_en?: string;
}

interface FormState {
  category: string;
  status: string;
  imageUrl: string;
  imageId: string;
  /** `YYYY-MM-DD` (mahalliy sana) yoki bo'sh — server o'zi qo'yadi. */
  publishedDate: string;
  titles: Record<Lang, string>;
  contents: Record<Lang, string>;
}

const emptyForm = (): FormState => ({
  category: 'announcements',
  status: 'published',
  imageUrl: '',
  imageId: '',
  publishedDate: '',
  titles: emptyLangRecord(),
  contents: emptyLangRecord(),
});

const pad = (n: number) => String(n).padStart(2, '0');

/** ISO → `<input type="date">` qiymati (mahalliy vaqt bo'yicha). */
function toDateInput(iso: string | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Sana → ISO. Bugungi sana tanlansa — hozirgi vaqt; boshqa kun uchun mahalliy tush vaqti
 * (UTC'ga o'girilganda sana boshqa kunga surilib ketmasligi uchun).
 */
function fromDateInput(date: string): string {
  if (toDateInput(new Date().toISOString()) === date) return new Date().toISOString();
  const d = new Date(`${date}T12:00:00`);
  return isNaN(d.getTime()) ? '' : d.toISOString();
}

export default function NewsAdminPage() {
  const list = useCollection<NewsItem>('news', {
    orderBy: 'createdAt',
    direction: 'desc',
    pageSize: 100,
    paginate: true,
  });
  const { items } = list;
  const modal = useEditorModal<FormState>(emptyForm);
  const { form, setForm } = modal;
  const [activeLang, setActiveLang] = useState<Lang>('uz');
  const [originalPublishedAt, setOriginalPublishedAt] = useState('');
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const q = search.trim().toLowerCase();
  const filtered = items.filter((n) => {
    if (q) {
      const hit =
        LANGS.some((l) => (n[`title_${l}`] || '').toLowerCase().includes(q)) ||
        (n.content_uz || '').toLowerCase().includes(q);
      if (!hit) return false;
    }
    if (filterCat !== 'all' && n.category !== filterCat) return false;
    if (filterStatus !== 'all' && n.status !== filterStatus) return false;
    return true;
  });

  const openCreate = () => {
    setActiveLang('uz');
    setOriginalPublishedAt('');
    modal.openWith(null, emptyForm());
  };

  const openEdit = (item: NewsItem) => {
    setActiveLang('uz');
    setOriginalPublishedAt(item.publishedAt || '');
    modal.openWith(item.id, {
      category: item.category || 'announcements',
      status: item.status || 'published',
      imageUrl: item.image || '',
      imageId: item.imageId || '',
      publishedDate: toDateInput(item.publishedAt),
      titles: pickLang(item, 'title'),
      contents: pickLang(item, 'content'),
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (modal.uploading) return;
    const valid = validateFields(
      [
        {
          valid: !!form.titles.uz.trim(),
          fieldId: 'news-title-uz',
          message: "O'zbek tilida sarlavha majburiy",
          lang: 'uz',
        },
        {
          valid: !!form.contents.uz.trim(),
          fieldId: 'news-content-uz',
          message: "O'zbek tilida matn majburiy",
          lang: 'uz',
        },
      ],
      setActiveLang
    );
    if (!valid) return;
    modal.setSubmitting(true);
    // Sana o'zgarmagan bo'lsa asl vaqtni (soat/daqiqa bilan) saqlab qolamiz.
    const publishedAt = !form.publishedDate
      ? ''
      : form.publishedDate === toDateInput(originalPublishedAt)
        ? originalPublishedAt
        : fromDateInput(form.publishedDate);
    const data = {
      category: form.category,
      status: form.status,
      image: form.imageUrl,
      imageId: form.imageId,
      publishedAt,
      ...spreadLang('title', form.titles),
      ...spreadLang('content', form.contents),
    };
    try {
      if (modal.editingId) {
        await updateDocument('news', modal.editingId, data);
        toast.success('Yangilik yangilandi');
      } else {
        await addDocument('news', data);
        toast.success("Yangilik qo'shildi");
      }
      modal.closeSaved();
    } catch (err) {
      toastError(err);
    } finally {
      modal.setSubmitting(false);
    }
  };

  const handleDelete = async (item: NewsItem) => {
    const ok = await confirmDialog({
      title: "O'chirish",
      message: `"${item.title_uz}" yangiligini o'chirmoqchimisiz?`,
      confirmText: "Ha, o'chirish",
      danger: true,
    });
    if (!ok) return;
    try {
      await deleteDocument('news', item.id);
      toast.success("Yangilik o'chirildi");
    } catch (err) {
      toastError(err);
    }
  };

  return (
    <>
      <AdminHeader title="Yangiliklar" />
      <div className="content-area">
        <div className="admin-card">
          <div className="card-header">
            <h2 className="card-title">Barcha yangiliklar</h2>
            <button type="button" className="btn btn-primary" onClick={openCreate}>
              + Qo&apos;shish
            </button>
          </div>
          <div className="admin-toolbar">
            <input
              type="search"
              className="form-control toolbar-search"
              placeholder="Sarlavha bo'yicha qidirish (barcha tillar)..."
              aria-label="Yangiliklarni qidirish"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="form-control toolbar-select"
              aria-label="Kategoriya filtri"
              value={filterCat}
              onChange={(e) => setFilterCat(e.target.value)}
            >
              <option value="all">Barcha kategoriya</option>
              {NEWS_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            <select
              className="form-control toolbar-select"
              aria-label="Holat filtri"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">Barcha holat</option>
              {NEWS_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <ListErrorBanner error={list.error} hasItems={items.length > 0} onRetry={list.reload} />
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Rasm</th>
                  <th>Sarlavha (UZ)</th>
                  <th>Sana</th>
                  <th>Kategoriya</th>
                  <th>Holati</th>
                  <th>Amallar</th>
                </tr>
              </thead>
              <tbody>
                <ListStatus
                  colSpan={6}
                  loading={list.loading}
                  error={list.error}
                  total={items.length}
                  shown={filtered.length}
                  emptyText="Hali yangiliklar yo'q."
                  noMatchText="Filterga mos yangilik topilmadi"
                  onRetry={list.reload}
                />
                {filtered.map((n) => (
                  <tr key={n.id}>
                    <td className="thumb-cell">
                      {n.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={n.image} alt="" className="thumb" width={48} height={48} />
                      ) : (
                        <div className="thumb thumb-placeholder" aria-hidden="true">
                          📰
                        </div>
                      )}
                    </td>
                    <td>
                      <strong>{n.title_uz || '—'}</strong>
                    </td>
                    <td>
                      {formatDate(n.publishedAt || n.createdAt) || '—'}
                      {!n.publishedAt && n.createdAt && (
                        <div className="text-muted small">yaratilgan</div>
                      )}
                    </td>
                    <td>
                      <span className="badge badge-warning">
                        {NEWS_CATEGORY_LABELS[n.category || ''] || n.category}
                      </span>
                    </td>
                    <td>
                      <span
                        className={
                          'badge ' + (n.status === 'published' ? 'badge-success' : 'badge-warning')
                        }
                      >
                        {NEWS_STATUS_LABELS[n.status || ''] || n.status}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          type="button"
                          className="action-btn edit"
                          onClick={() => openEdit(n)}
                          title="Tahrirlash"
                          aria-label="Tahrirlash"
                        >
                          ✍️
                        </button>
                        <button
                          type="button"
                          className="action-btn delete"
                          onClick={() => handleDelete(n)}
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
          <LoadMoreButton
            hasMore={list.hasMore}
            loadingMore={list.loadingMore}
            onLoadMore={list.loadMore}
          />
        </div>
      </div>

      {modal.open && (
        <AdminModal
          title={modal.editingId ? 'Yangilikni tahrirlash' : "Yangi yangilik qo'shish"}
          onRequestClose={modal.requestClose}
          width={760}
        >
          <form onSubmit={handleSubmit} noValidate>
            <div className="modal-body">
              <ImageField
                id="news-image"
                label="Rasm"
                folder="news"
                url={form.imageUrl}
                fileId={form.imageId}
                onChange={(v) => setForm((f) => ({ ...f, imageUrl: v.url, imageId: v.fileId }))}
                tracker={modal.tracker}
                onUploadingChange={modal.setUploading}
              />

              <div className="form-grid form-grid-3">
                <div className="form-group">
                  <label htmlFor="news-category">Kategoriya</label>
                  <select
                    id="news-category"
                    className="form-control"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  >
                    {NEWS_CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="news-status">Holati</label>
                  <select
                    id="news-status"
                    className="form-control"
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                  >
                    {NEWS_STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="news-published">Nashr sanasi</label>
                  <input
                    id="news-published"
                    type="date"
                    className="form-control"
                    value={form.publishedDate}
                    aria-describedby="news-published-hint"
                    onChange={(e) => setForm({ ...form, publishedDate: e.target.value })}
                  />
                  <small id="news-published-hint" className="form-hint">
                    Bo&apos;sh qoldirilsa, nashr qilingan vaqt avtomatik qo&apos;yiladi
                  </small>
                </div>
              </div>

              <LangTabs idPrefix="news" active={activeLang} onChange={setActiveLang} />

              {LANGS.map((l) => (
                <LangPanel key={l} idPrefix="news" lang={l} active={activeLang}>
                  <div className="form-group">
                    <label htmlFor={`news-title-${l}`}>
                      Sarlavha ({l.toUpperCase()}){l === 'uz' ? ' *' : ''}
                    </label>
                    <input
                      id={`news-title-${l}`}
                      type="text"
                      className="form-control"
                      required={l === 'uz'}
                      value={form.titles[l]}
                      onChange={(e) =>
                        setForm({ ...form, titles: { ...form.titles, [l]: e.target.value } })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor={`news-content-${l}`}>
                      Matn ({l.toUpperCase()}){l === 'uz' ? ' *' : ''}
                    </label>
                    <textarea
                      id={`news-content-${l}`}
                      className="form-control"
                      rows={6}
                      required={l === 'uz'}
                      value={form.contents[l]}
                      onChange={(e) =>
                        setForm({ ...form, contents: { ...form.contents, [l]: e.target.value } })
                      }
                    />
                  </div>
                </LangPanel>
              ))}
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
