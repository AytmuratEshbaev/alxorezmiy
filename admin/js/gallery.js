// ============================================
// ADMIN — GALLERY MODULE (Firestore + ImageKit)
// ============================================

import {
  subscribeCollection,
  addDocument,
  updateDocument,
  deleteDocument
} from '../../js/firestore-helpers.js';

const COLLECTION = 'gallery';
const LANGS = ['uz', 'ru', 'kk', 'en'];

let allItems = [];
let editingId = null;
let unsubscribe = null;
let uploadedImage = null;

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const CATEGORY_LABELS = {
  building: '🏛 Bino',
  lessons: '📚 Darslar',
  sports: '⚽ Sport',
  events: '🎉 Tadbirlar'
};

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

function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[m]));
}

function renderGrid() {
  const grid = $('#galleryGrid');
  if (!grid) return;

  if (!allItems.length) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px;color:#94A3B8;">
      Hali galereyada rasm yo'q. <strong>"Qo'shish"</strong> tugmasini bosing.
    </div>`;
    return;
  }

  grid.innerHTML = allItems.map(item => `
    <div class="gallery-admin-item">
      <img src="${item.url}" alt="${escapeHtml(item.caption_uz || '')}" loading="lazy">
      <div class="gallery-admin-overlay">
        <div class="gallery-admin-info">
          <span class="badge badge-warning">${CATEGORY_LABELS[item.category] || item.category}</span>
          <p>${escapeHtml(item.caption_uz || '—')}</p>
        </div>
        <div class="gallery-admin-actions">
          <button class="action-btn edit" data-id="${item.id}" title="Tahrirlash">✍️</button>
          <button class="action-btn delete" data-id="${item.id}" title="O'chirish">🗑️</button>
        </div>
      </div>
    </div>
  `).join('');

  grid.querySelectorAll('.action-btn.edit').forEach(btn =>
    btn.addEventListener('click', () => openModal(btn.dataset.id))
  );
  grid.querySelectorAll('.action-btn.delete').forEach(btn =>
    btn.addEventListener('click', () => handleDelete(btn.dataset.id))
  );
}

function openModal(id = null) {
  editingId = id;
  uploadedImage = null;

  $('#galleryModalTitle').textContent = id ? "Rasmni tahrirlash" : "Yangi rasm qo'shish";
  $('#galleryForm').reset();

  $$('.lang-tab').forEach((t, i) => t.classList.toggle('active', i === 0));
  $$('.lang-panel').forEach((p, i) => p.classList.toggle('active', i === 0));

  $('#galleryImagePreview').src = '';
  $('#galleryImagePreview').style.display = 'none';
  $('#galleryImageInput').value = '';
  $('#galleryImageProgress').style.display = 'none';

  if (id) {
    const item = allItems.find(x => x.id === id);
    if (!item) return;
    LANGS.forEach(lang => {
      const input = $(`#galleryCaption_${lang}`);
      if (input) input.value = item[`caption_${lang}`] || '';
    });
    $('#galleryCategory').value = item.category || 'building';
    if (item.url) {
      $('#galleryImagePreview').src = item.url;
      $('#galleryImagePreview').style.display = 'block';
      uploadedImage = { url: item.url, fileId: item.fileId };
    }
  }

  $('#galleryModal').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  $('#galleryModal').classList.remove('active');
  document.body.style.overflow = '';
  editingId = null;
  uploadedImage = null;
}

async function handleImageUpload(file) {
  if (!file) return;
  const progressBox = $('#galleryImageProgress');
  const progressBar = $('#galleryImageProgressBar');
  const progressText = $('#galleryImageProgressText');

  progressBox.style.display = 'block';
  progressBar.style.width = '0%';
  progressText.textContent = '0%';

  try {
    const result = await window.uploadImage(file, 'gallery', (pct) => {
      progressBar.style.width = pct + '%';
      progressText.textContent = pct + '%';
    });
    uploadedImage = { url: result.url, fileId: result.fileId };
    $('#galleryImagePreview').src = result.url;
    $('#galleryImagePreview').style.display = 'block';
    progressText.textContent = '✓ Yuklandi';
    setTimeout(() => { progressBox.style.display = 'none'; }, 1500);
    toast('Rasm yuklandi', 'success');
  } catch (err) {
    console.error('Upload error:', err);
    toast('Rasm yuklashda xato: ' + err.message, 'error');
    progressBox.style.display = 'none';
  }
}

async function handleSave(e) {
  e.preventDefault();
  const submitBtn = $('#gallerySubmitBtn');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Saqlanmoqda...';

  if (!uploadedImage?.url) {
    toast("Rasm yuklang", 'error');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Saqlash';
    return;
  }

  const data = {
    url: uploadedImage.url,
    fileId: uploadedImage.fileId || '',
    category: $('#galleryCategory').value
  };
  LANGS.forEach(lang => {
    data[`caption_${lang}`] = $(`#galleryCaption_${lang}`).value.trim();
  });

  try {
    if (editingId) {
      await updateDocument(COLLECTION, editingId, data);
      toast('Rasm tahrirlandi', 'success');
    } else {
      await addDocument(COLLECTION, data);
      toast("Rasm qo'shildi", 'success');
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
  const item = allItems.find(x => x.id === id);
  if (!item) return;
  if (!await window.confirmDialog({ title: "O\'chirish", message: "Rasmni o'chirmoqchimisiz?", confirmText: "Ha, o\'chirish", danger: true })) return;
  try {
    await deleteDocument(COLLECTION, id);
    toast("Rasm o'chirildi", 'success');
  } catch (err) {
    console.error('Delete error:', err);
    toast('Xatolik: ' + err.message, 'error');
  }
}

function setupLangTabs() {
  $$('.lang-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const lang = tab.dataset.lang;
      $$('.lang-tab').forEach(t => t.classList.toggle('active', t === tab));
      $$('.lang-panel').forEach(p => p.classList.toggle('active', p.dataset.lang === lang));
    });
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  setupLangTabs();
  $('#addGalleryBtn')?.addEventListener('click', () => openModal());
  $('#galleryModalClose')?.addEventListener('click', closeModal);
  $('#galleryCancelBtn')?.addEventListener('click', closeModal);
  $('#galleryForm')?.addEventListener('submit', handleSave);
  $('#galleryImageInput')?.addEventListener('change', (e) => handleImageUpload(e.target.files[0]));
  $('#galleryModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'galleryModal') closeModal();
  });

  unsubscribe = await subscribeCollection(COLLECTION, (items) => {
    allItems = items;
    renderGrid();
  }, { orderBy: 'createdAt', direction: 'desc' });
});

window.addEventListener('beforeunload', () => {
  if (typeof unsubscribe === 'function') unsubscribe();
});
