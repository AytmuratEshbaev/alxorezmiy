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

// Filter state
let searchQuery = '';
let filterCategory = 'all';

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
      <tr><td colspan="7" style="text-align:center;padding:40px;color:#94A3B8;">
        Hali o'qituvchilar yo'q. <strong>"Qo'shish"</strong> tugmasini bosing.
      </td></tr>`;
    return;
  }

  // Filter
  let filtered = allTeachers;
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(t => {
      const name = (t.name_uz || '').toLowerCase();
      const subject = (t.subject || '').toLowerCase();
      return name.includes(q) || subject.includes(q);
    });
  }
  if (filterCategory !== 'all') {
    filtered = filtered.filter(t => t.category === filterCategory);
  }

  if (!filtered.length) {
    tbody.innerHTML = `
      <tr><td colspan="7" style="text-align:center;padding:40px;color:#94A3B8;">
        🔍 Filter shartlariga mos o'qituvchi topilmadi
      </td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(t => {
    const achCount = Array.isArray(t.achievements) ? t.achievements.length : 0;
    return `
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
      <td>${achCount > 0 ? `<span class="badge badge-success">${achCount}</span>` : '—'}</td>
      <td>
        <div class="table-actions">
          <button class="action-btn edit" data-id="${t.id}" title="Tahrirlash">✍️</button>
          <button class="action-btn delete" data-id="${t.id}" title="O'chirish">🗑️</button>
        </div>
      </td>
    </tr>
  `;
  }).join('');

  tbody.querySelectorAll('.action-btn.edit').forEach(btn =>
    btn.addEventListener('click', () => openModal(btn.dataset.id))
  );
  tbody.querySelectorAll('.action-btn.delete').forEach(btn =>
    btn.addEventListener('click', () => handleDelete(btn.dataset.id))
  );
}

// ── Yutuqlar (achievements) ──
const ACHIEVEMENT_TYPES = [
  { value: 'olympiad', label: '🏆 Olimpiada' },
  { value: 'certificate', label: '📜 Sertifikat' },
  { value: 'competition', label: '🥇 Musobaqa' },
  { value: 'diploma', label: '🎓 Diplom' },
  { value: 'other', label: '⭐ Boshqa' }
];

function buildAchievementRow(data = {}) {
  const row = document.createElement('div');
  row.className = 'achievement-row';
  row.innerHTML = `
    <select class="form-control achievement-type">
      ${ACHIEVEMENT_TYPES.map(t => `<option value="${t.value}" ${data.type === t.value ? 'selected' : ''}>${t.label}</option>`).join('')}
    </select>
    <input type="text" class="form-control achievement-title" placeholder="Yutuq nomi (masalan: Respublika olimpiadasi 1-o'rin)" value="${escapeHtml(data.title || '')}">
    <input type="number" class="form-control achievement-year" placeholder="Yil" min="1990" max="2100" value="${data.year || ''}">
    <button type="button" class="achievement-remove" title="O'chirish">🗑️</button>
  `;
  row.querySelector('.achievement-remove').addEventListener('click', () => row.remove());
  return row;
}

function addAchievementRow(data = {}) {
  $('#achievementsList').appendChild(buildAchievementRow(data));
}

function getAchievementsFromForm() {
  return [...$$('.achievement-row')].map(row => ({
    type: row.querySelector('.achievement-type').value,
    title: row.querySelector('.achievement-title').value.trim(),
    year: parseInt(row.querySelector('.achievement-year').value, 10) || null
  })).filter(a => a.title); // bo'sh qatorlarni tashlab yuboramiz
}

function clearAchievements() {
  $('#achievementsList').innerHTML = '';
}

function openModal(id = null) {
  editingId = id;
  uploadedPhoto = null;

  const modal = $('#teacherModal');
  $('#teacherModalTitle').textContent = id ? "O'qituvchini tahrirlash" : "Yangi o'qituvchi qo'shish";
  $('#teacherForm').reset();
  clearAchievements();

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
    if (Array.isArray(item.achievements)) {
      item.achievements.forEach(a => addAchievementRow(a));
    }
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
    achievements: getAchievementsFromForm(),
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
  if (!await window.confirmDialog({ title: "O\'chirish", message: `"${item.name_uz}" o'qituvchisini o'chirmoqchimisiz?`, confirmText: "Ha, o\'chirish", danger: true })) return;

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
  $('#addAchievementBtn')?.addEventListener('click', () => addAchievementRow());
  $('#teacherModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'teacherModal') closeModal();
  });

  // Search & filters
  $('#teacherSearch')?.addEventListener('input', (e) => {
    searchQuery = e.target.value.trim();
    renderTable();
  });
  $('#teacherFilterCategory')?.addEventListener('change', (e) => {
    filterCategory = e.target.value;
    renderTable();
  });

  unsubscribe = await subscribeCollection(COLLECTION, (items) => {
    // Alfavit bo'yicha (UZ ism)
    items.sort((a, b) => (a.name_uz || '').localeCompare(b.name_uz || '', 'uz'));
    allTeachers = items;
    renderTable();
  });
});

window.addEventListener('beforeunload', () => {
  if (typeof unsubscribe === 'function') unsubscribe();
});
