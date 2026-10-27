'use client';
import { useState, type FormEvent } from 'react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminModal } from '@/components/admin/AdminModal';
import { confirmDialog } from '@/components/admin/ConfirmDialog';
import { ImageField } from '@/components/admin/ImageField';
import { toast } from '@/components/admin/Toast';
import { toastError } from '@/components/admin/errors';
import { GALLERY_CATEGORIES, GALLERY_CATEGORY_LABELS } from '@/components/admin/labels';
import { LANGS, emptyLangRecord, pickLang, spreadLang, type Lang } from '@/components/admin/lang';
import { LangPanel, LangTabs } from '@/components/admin/LangTabs';
import { ListErrorBanner, ListStatus, LoadMoreButton } from '@/components/admin/ListStatus';
import { useCollection } from '@/components/admin/useCollection';
import { useEditorModal } from '@/components/admin/useEditorModal';
import { validateFields } from '@/components/admin/validate';
import { addDocument, updateDocument, deleteDocument } from '@/lib/admin-api';

interface Item {
  id: string;
  createdAt?: string;
  url?: string;
  fileId?: string;
  category?: string;
  caption_uz?: string;
  caption_ru?: string;
  caption_kk?: string;
  caption_en?: string;
}

interface FormState {
  url: string;
  fileId: string;
  category: string;
  captions: Record<Lang, string>;
}

const emptyForm = (): FormState => ({
  url: '',
  fileId: '',
  category: 'building',
  captions: emptyLangRecord(),
});

export default function GalleryAdminPage() {
  const list = useCollection<Item>('gallery', {
    orderBy: 'createdAt',
    direction: 'desc',
    pageSize: 100,
    paginate: true,
  });
  const { items } = list;
  const modal = useEditorModal<FormState>(emptyForm);
  const { form, setForm } = modal;
  const [activeLang, setActiveLang] = useState<Lang>('uz');

  const openCreate = () => {
    setActiveLang('uz');
    modal.openWith(null, emptyForm());
  };

  const openEdit = (item: Item) => {
    setActiveLang('uz');
    modal.openWith(item.id, {
      url: item.url || '',
      fileId: item.fileId || '',
      category: item.category || 'building',
      captions: pickLang(item, 'caption'),
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (modal.uploading) return;
    if (!validateFields([{ valid: !!form.url, fieldId: 'gallery-image', message: 'Rasm yuklang' }]))
      return;
    modal.setSubmitting(true);
    const data = {
      url: form.url,
      fileId: form.fileId,
      category: form.category,
      ...spreadLang('caption', form.captions),
    };
    try {
      if (modal.editingId) {
        await updateDocument('gallery', modal.editingId, data);
        toast.success('Rasm yangilandi');
      } else {
        await addDocument('gallery', data);
        toast.success("Rasm qo'shildi");
      }
      modal.closeSaved();
    } catch (err) {
      toastError(err);
    } finally {
      modal.setSubmitting(false);
    }
  };

  const handleDelete = async (item: Item) => {
    const ok = await confirmDialog({
      title: "O'chirish",
      message: "Rasmni o'chirmoqchimisiz?",
      confirmText: "Ha, o'chirish",
      danger: true,
    });
    if (!ok) return;
    try {
      await deleteDocument('gallery', item.id);
      toast.success("Rasm o'chirildi");
    } catch (err) {
      toastError(err);
    }
  };

  return (
    <>
      <AdminHeader title="Galereya" />
      <div className="content-area">
        <div className="admin-card">
          <div className="card-header">
            <h2 className="card-title">Galereya</h2>
            <button type="button" className="btn btn-primary" onClick={openCreate}>
              + Qo&apos;shish
            </button>
          </div>
          <ListErrorBanner error={list.error} hasItems={items.length > 0} onRetry={list.reload} />
          <ListStatus
            loading={list.loading}
            error={list.error}
            total={items.length}
            shown={items.length}
            emptyText="Hali galereyada rasm yo'q."
            onRetry={list.reload}
          />
          {items.length > 0 && (
            <div className="gallery-admin-grid">
              {items.map((item) => (
                <div key={item.id} className="gallery-admin-item">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.url}
                    alt={item.caption_uz || ''}
                    loading="lazy"
                    width={320}
                    height={160}
                  />
                  <div className="gallery-admin-body">
                    <span className="badge badge-warning">
                      {GALLERY_CATEGORY_LABELS[item.category || ''] || item.category}
                    </span>
                    <p>{item.caption_uz || '—'}</p>
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
                  </div>
                </div>
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

      {modal.open && (
        <AdminModal
          title={modal.editingId ? 'Rasmni tahrirlash' : "Yangi rasm qo'shish"}
          onRequestClose={modal.requestClose}
          width={640}
        >
          <form onSubmit={handleSubmit} noValidate>
            <div className="modal-body">
              <ImageField
                id="gallery-image"
                label="Rasm"
                required
                removable={false}
                folder="gallery"
                url={form.url}
                fileId={form.fileId}
                onChange={(v) => setForm((f) => ({ ...f, url: v.url, fileId: v.fileId }))}
                tracker={modal.tracker}
                onUploadingChange={modal.setUploading}
              />

              <div className="form-group">
                <label htmlFor="gallery-category">Kategoriya</label>
                <select
                  id="gallery-category"
                  className="form-control"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  {GALLERY_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <LangTabs idPrefix="gallery" active={activeLang} onChange={setActiveLang} />

              {LANGS.map((l) => (
                <LangPanel key={l} idPrefix="gallery" lang={l} active={activeLang}>
                  <div className="form-group">
                    <label htmlFor={`gallery-caption-${l}`}>Sarlavha ({l.toUpperCase()})</label>
                    <input
                      id={`gallery-caption-${l}`}
                      type="text"
                      className="form-control"
                      value={form.captions[l]}
                      onChange={(e) =>
                        setForm({ ...form, captions: { ...form.captions, [l]: e.target.value } })
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
