// ============================================
// ADMIN — NEWS MODULE (Firestore CRUD + ImageKit)
// ============================================

import {
  subscribeCollection,
  addDocument,
  updateDocument,
  deleteDocument,
  formatDate
} from '../../js/firestore-helpers.js';

const COLLECTION = 'news';
const LANGS = ['uz', 'ru', 'kk', 'en'];

let allNews = [];
let editingId = null;
let unsubscribe = null;
let uploadedImage = null; // { url, fileId, name }

// Filter state
let searchQuery = '';
let filterCategory = 'all';
let filterStatus = 'all';

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// ── Toast yordamchisi ──
function toast(message, type = 'success') {
  let container = $('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.textContent = message;
  container.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

// ── Confirm modal (oddiy) ──
function confirmAction(message) {
  if (typeof window.confirmDialog === 'function') {
    return window.confirmDialog({
      title: "O'chirish",
      message,
      confirmText: "Ha, o'chirish",
      danger: true
    });
  }
  return Promise.resolve(window.confirm(message));
}

// ── Jadvalni render qilish ──
function renderTable() {
  const tbody = $('#newsTableBody');
  if (!tbody) return;

  if (!allNews.length) {
    tbody.innerHTML = `
      <tr><td colspan="6" style="text-align:center;padding:40px;color:#94A3B8;">
        Hali yangiliklar yo'q. <strong>"Qo'shish"</strong> tugmasini bosing.
      </td></tr>`;
    return;
  }

  // Apply filters
  let filtered = allNews;
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(n => {
      const title = (n.title_uz || '').toLowerCase();
      const content = (n.content_uz || '').toLowerCase();
      return title.includes(q) || content.includes(q);
    });
  }
  if (filterCategory !== 'all') {
    filtered = filtered.filter(n => n.category === filterCategory);
  }
  if (filterStatus !== 'all') {
    filtered = filtered.filter(n => n.status === filterStatus);
  }

  if (!filtered.length) {
    tbody.innerHTML = `
      <tr><td colspan="6" style="text-align:center;padding:40px;color:#94A3B8;">
        🔍 Filter shartlariga mos yangilik topilmadi
      </td></tr>`;
    return;
  }

  const catLabels = { events: 'Tadbir', announcements: "E'lon" };
  const statusLabels = { published: 'Nashr etilgan', draft: 'Qoralama' };

  tbody.innerHTML = filtered.map(n => `
    <tr>
      <td style="width:60px;">
        ${n.image
          ? `<img src="${n.image}" style="width:48px;height:48px;border-radius:6px;object-fit:cover;">`
          : `<div style="width:48px;height:48px;border-radius:6px;background:#E2E8F0;display:flex;align-items:center;justify-content:center;">📰</div>`}
      </td>
      <td><strong>${escapeHtml(n.title_uz || '—')}</strong></td>
      <td>${formatDate(n.createdAt) || '—'}</td>
      <td><span class="badge badge-warning">${catLabels[n.category] || n.category}</span></td>
      <td><span class="badge ${n.status === 'published' ? 'badge-success' : 'badge-warning'}">${statusLabels[n.status] || n.status}</span></td>
      <td>
        <div class="table-actions">
          <button class="action-btn edit" data-id="${n.id}" title="Tahrirlash">✍️</button>
          <button class="action-btn delete" data-id="${n.id}" title="O'chirish">🗑️</button>
        </div>
      </td>
    </tr>
  `).join('');

  // Bog'lash
  tbody.querySelectorAll('.action-btn.edit').forEach(btn =>
    btn.addEventListener('click', () => openModal(btn.dataset.id))
  );
  tbody.querySelectorAll('.action-btn.delete').forEach(btn =>
    btn.addEventListener('click', () => handleDelete(btn.dataset.id))
  );
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[m]));
}

// ── Modal ochish (yangi yoki tahrirlash) ──
function openModal(id = null) {
  editingId = id;
  uploadedImage = null;

  const modal = $('#newsModal');
  const titleEl = $('#newsModalTitle');
  const form = $('#newsForm');
  form.reset();

  // Til tablari — birinchisini aktiv qilish
  $$('.lang-tab').forEach((t, i) => t.classList.toggle('active', i === 0));
  $$('.lang-panel').forEach((p, i) => p.classList.toggle('active', i === 0));

  // Image preview tozalash
  $('#newsImagePreview').src = '';
  $('#newsImagePreview').style.display = 'none';
  $('#newsImageInput').value = '';
  $('#newsImageProgress').style.display = 'none';

  if (id) {
    const item = allNews.find(n => n.id === id);
    if (!item) return;
    titleEl.textContent = 'Yangilikni tahrirlash';

    LANGS.forEach(lang => {
      const titleInput = $(`#newsTitle_${lang}`);
      const contentInput = $(`#newsContent_${lang}`);
      if (titleInput) titleInput.value = item[`title_${lang}`] || '';
      if (contentInput) contentInput.value = item[`content_${lang}`] || '';
    });
    $('#newsCategory').value = item.category || 'announcements';
    $('#newsStatus').value = item.status || 'published';
    if (item.image) {
      $('#newsImagePreview').src = item.image;
      $('#newsImagePreview').style.display = 'block';
      uploadedImage = { url: item.image, fileId: item.imageId };
    }
  } else {
    titleEl.textContent = "Yangi yangilik qo'shish";
  }

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  $('#newsModal').classList.remove('active');
  document.body.style.overflow = '';
  editingId = null;
  uploadedImage = null;
}

// ── Rasm yuklash ──
async function handleImageUpload(file) {
  if (!file) return;
  const progressBox = $('#newsImageProgress');
  const progressBar = $('#newsImageProgressBar');
  const progressText = $('#newsImageProgressText');

  progressBox.style.display = 'block';
  progressBar.style.width = '0%';
  progressText.textContent = '0%';

  try {
    const result = await window.uploadImage(file, 'news', (pct) => {
      progressBar.style.width = pct + '%';
      progressText.textContent = pct + '%';
    });
    uploadedImage = { url: result.url, fileId: result.fileId };
    $('#newsImagePreview').src = result.url;
    $('#newsImagePreview').style.display = 'block';
    progressText.textContent = '✓ Yuklandi';
    setTimeout(() => { progressBox.style.display = 'none'; }, 1500);
    toast('Rasm muvaffaqiyatli yuklandi', 'success');
  } catch (err) {
    console.error('Upload error:', err);
    toast('Rasm yuklashda xato: ' + err.message, 'error');
    progressBox.style.display = 'none';
  }
}

// ── Saqlash (yaratish/yangilash) ──
async function handleSave(e) {
  e.preventDefault();
  const submitBtn = $('#newsSubmitBtn');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Saqlanmoqda...';

  const data = {
    category: $('#newsCategory').value,
    status: $('#newsStatus').value,
    image: uploadedImage?.url || '',
    imageId: uploadedImage?.fileId || ''
  };

  LANGS.forEach(lang => {
    data[`title_${lang}`] = $(`#newsTitle_${lang}`).value.trim();
    data[`content_${lang}`] = $(`#newsContent_${lang}`).value.trim();
  });

  if (!data.title_uz) {
    toast("O'zbek tilida sarlavha majburiy", 'error');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Saqlash';
    return;
  }

  try {
    if (editingId) {
      await updateDocument(COLLECTION, editingId, data);
      toast('Yangilik tahrirlandi', 'success');
    } else {
      await addDocument(COLLECTION, data);
      toast("Yangilik qo'shildi", 'success');
    }
    closeModal();
  } catch (err) {
    console.error('Save error:', err);
    toast('Xatolik: ' + err.message, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Saqlash';
  }
}

async function handleDelete(id) {
  const item = allNews.find(n => n.id === id);
  if (!item) return;
  const ok = await confirmAction(`"${item.title_uz}" yangiligini o'chirmoqchimisiz?`);
  if (!ok) return;

  try {
    await deleteDocument(COLLECTION, id);
    toast("Yangilik o'chirildi", 'success');
  } catch (err) {
    console.error('Delete error:', err);
    toast('Xatolik: ' + err.message, 'error');
  }
}

// ── Til tablari ──
function setupLangTabs() {
  $$('.lang-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const lang = tab.dataset.lang;
      $$('.lang-tab').forEach(t => t.classList.toggle('active', t === tab));
      $$('.lang-panel').forEach(p => p.classList.toggle('active', p.dataset.lang === lang));
    });
  });
}

// ── Init ──
document.addEventListener('DOMContentLoaded', async () => {
  setupLangTabs();

  $('#addNewsBtn')?.addEventListener('click', () => openModal());
  $('#newsModalClose')?.addEventListener('click', closeModal);
  $('#newsCancelBtn')?.addEventListener('click', closeModal);
  $('#newsForm')?.addEventListener('submit', handleSave);
  $('#newsImageInput')?.addEventListener('change', (e) => handleImageUpload(e.target.files[0]));

  // Modal backdrop'ga bosib yopish
  $('#newsModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'newsModal') closeModal();
  });

  // Search & filters
  $('#newsSearch')?.addEventListener('input', (e) => {
    searchQuery = e.target.value.trim();
    renderTable();
  });
  $('#newsFilterCategory')?.addEventListener('change', (e) => {
    filterCategory = e.target.value;
    renderTable();
  });
  $('#newsFilterStatus')?.addEventListener('change', (e) => {
    filterStatus = e.target.value;
    renderTable();
  });

  // Real-time subscription
  unsubscribe = await subscribeCollection(COLLECTION, (items) => {
    allNews = items;
    renderTable();
  }, { orderBy: 'createdAt', direction: 'desc' });
});

window.addEventListener('beforeunload', () => {
  if (typeof unsubscribe === 'function') unsubscribe();
});
