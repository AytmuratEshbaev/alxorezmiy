// ============================================
// ADMIN — TEACHERS MODULE (Firestore + ImageKit)
// ============================================

import {
  subscribeCollection,
  addDocument,
  updateDocument,
  deleteDocument
} from '../../js/firestore-helpers.js';

const COLLECTION = 'teachers';
const LANGS = ['uz', 'ru', 'kk', 'en'];

let allTeachers = [];
let editingId = null;
let unsubscribe = null;
let uploadedPhoto = null;

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

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

function renderTable() {
  const tbody = $('#teachersTableBody');
  if (!tbody) return;

  if (!allTeachers.length) {
    tbody.innerHTML = `
      <tr><td colspan="6" style="text-align:center;padding:40px;color:#94A3B8;">
        Hali o'qituvchilar yo'q. <strong>"Qo'shish"</strong> tugmasini bosing.
      </td></tr>`;
    return;
  }

  tbody.innerHTML = allTeachers.map(t => `
    <tr>
      <td style="width:60px;">
        ${t.photo
          ? `<img src="${t.photo}" style="width:48px;height:48px;border-radius:50%;object-fit:cover;">`
          : `<div style="width:48px;height:48px;border-radius:50%;background:#E2E8F0;display:flex;align-items:center;justify-content:center;">👤</div>`}
      </td>
      <td><strong>${escapeHtml(t.name_uz || '—')}</strong></td>
      <td>${escapeHtml(t.subject || '—')}</td>
      <td><span class="badge badge-warning">${escapeHtml(t.category || '—')}</span></td>
      <td>${t.experience || 0} yil</td>
      <td>
        <div class="table-actions">
          <button class="action-btn edit" data-id="${t.id}" title="Tahrirlash">✍️</button>
          <button class="action-btn delete" data-id="${t.id}" title="O'chirish">🗑️</button>
        </div>
      </td>
    </tr>
  `).join('');

  tbody.querySelectorAll('.action-btn.edit').forEach(btn =>
    btn.addEventListener('click', () => openModal(btn.dataset.id))
  );
  tbody.querySelectorAll('.action-btn.delete').forEach(btn =>
    btn.addEventListener('click', () => handleDelete(btn.dataset.id))
  );
}

function openModal(id = null) {
  editingId = id;
  uploadedPhoto = null;

  const modal = $('#teacherModal');
  $('#teacherModalTitle').textContent = id ? "O'qituvchini tahrirlash" : "Yangi o'qituvchi qo'shish";
  $('#teacherForm').reset();

  $$('.lang-tab').forEach((t, i) => t.classList.toggle('active', i === 0));
  $$('.lang-panel').forEach((p, i) => p.classList.toggle('active', i === 0));

  $('#teacherPhotoPreview').src = '';
  $('#teacherPhotoPreview').style.display = 'none';
  $('#teacherPhotoInput').value = '';
  $('#teacherPhotoProgress').style.display = 'none';

  if (id) {
    const item = allTeachers.find(t => t.id === id);
    if (!item) return;
    LANGS.forEach(lang => {
      const input = $(`#teacherName_${lang}`);
      if (input) input.value = item[`name_${lang}`] || '';
    });
    $('#teacherSubject').value = item.subject || '';
    $('#teacherCategory').value = item.category || '';
    $('#teacherExperience').value = item.experience || 0;
    $('#teacherOrder').value = item.order || 0;
    if (item.photo) {
      $('#teacherPhotoPreview').src = item.photo;
      $('#teacherPhotoPreview').style.display = 'block';
      uploadedPhoto = { url: item.photo, fileId: item.photoId };
    }
  }

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  $('#teacherModal').classList.remove('active');
  document.body.style.overflow = '';
  editingId = null;
  uploadedPhoto = null;
}

async function handleImageUpload(file) {
  if (!file) return;
  const progressBox = $('#teacherPhotoProgress');
  const progressBar = $('#teacherPhotoProgressBar');
  const progressText = $('#teacherPhotoProgressText');

  progressBox.style.display = 'block';
  progressBar.style.width = '0%';
  progressText.textContent = '0%';

  try {
    const result = await window.uploadImage(file, 'teachers', (pct) => {
      progressBar.style.width = pct + '%';
      progressText.textContent = pct + '%';
    });
    uploadedPhoto = { url: result.url, fileId: result.fileId };
    $('#teacherPhotoPreview').src = result.url;
    $('#teacherPhotoPreview').style.display = 'block';
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
  const submitBtn = $('#teacherSubmitBtn');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Saqlanmoqda...';

  const data = {
    subject: $('#teacherSubject').value.trim(),
    category: $('#teacherCategory').value.trim(),
    experience: parseInt($('#teacherExperience').value, 10) || 0,
    order: parseInt($('#teacherOrder').value, 10) || 0,
    photo: uploadedPhoto?.url || '',
    photoId: uploadedPhoto?.fileId || ''
  };

  LANGS.forEach(lang => {
    data[`name_${lang}`] = $(`#teacherName_${lang}`).value.trim();
  });

  if (!data.name_uz) {
    toast("O'zbek tilida ism majburiy", 'error');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Saqlash';
    return;
  }
  if (!data.subject) {
    toast("Fan majburiy", 'error');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Saqlash';
    return;
  }

  try {
    if (editingId) {
      await updateDocument(COLLECTION, editingId, data);
      toast("O'qituvchi tahrirlandi", 'success');
    } else {
      await addDocument(COLLECTION, data);
      toast("O'qituvchi qo'shildi", 'success');
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
  const item = allTeachers.find(t => t.id === id);
  if (!item) return;
  if (!window.confirm(`"${item.name_uz}" o'qituvchisini o'chirmoqchimisiz?`)) return;

  try {
    await deleteDocument(COLLECTION, id);
    toast("O'qituvchi o'chirildi", 'success');
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

  $('#addTeacherBtn')?.addEventListener('click', () => openModal());
  $('#teacherModalClose')?.addEventListener('click', closeModal);
  $('#teacherCancelBtn')?.addEventListener('click', closeModal);
  $('#teacherForm')?.addEventListener('submit', handleSave);
  $('#teacherPhotoInput')?.addEventListener('change', (e) => handleImageUpload(e.target.files[0]));
  $('#teacherModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'teacherModal') closeModal();
  });

  unsubscribe = await subscribeCollection(COLLECTION, (items) => {
    // order bo'yicha tartiblash
    items.sort((a, b) => (a.order || 0) - (b.order || 0));
    allTeachers = items;
    renderTable();
  });
});

window.addEventListener('beforeunload', () => {
  if (typeof unsubscribe === 'function') unsubscribe();
});
