// ============================================
// ADMIN — FAQ MODULE (Firestore CRUD)
// ============================================

import {
  subscribeCollection,
  addDocument,
  updateDocument,
  deleteDocument
} from '../../js/firestore-helpers.js';

const COLLECTION = 'faq';
const LANGS = ['uz', 'ru', 'kk', 'en'];

let allItems = [];
let editingId = null;
let unsubscribe = null;

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const CATEGORY_LABELS = {
  admission: '📝 Qabul',
  education: '📚 Ta\'lim',
  general: '💬 Umumiy'
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

function renderTable() {
  const tbody = $('#faqTableBody');
  if (!tbody) return;

  if (!allItems.length) {
    tbody.innerHTML = `
      <tr><td colspan="4" style="text-align:center;padding:40px;color:#94A3B8;">
        Hali savollar yo'q. <strong>"Qo'shish"</strong> tugmasini bosing.
      </td></tr>`;
    return;
  }

  tbody.innerHTML = allItems.map(item => `
    <tr>
      <td><strong>${escapeHtml(item.question_uz || '—')}</strong></td>
      <td><span class="badge badge-warning">${CATEGORY_LABELS[item.category] || item.category}</span></td>
      <td>${item.order || 0}</td>
      <td>
        <div class="table-actions">
          <button class="action-btn edit" data-id="${item.id}" title="Tahrirlash">✍️</button>
          <button class="action-btn delete" data-id="${item.id}" title="O'chirish">🗑️</button>
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
  $('#faqModalTitle').textContent = id ? "Savolni tahrirlash" : "Yangi savol qo'shish";
  $('#faqForm').reset();

  $$('.lang-tab').forEach((t, i) => t.classList.toggle('active', i === 0));
  $$('.lang-panel').forEach((p, i) => p.classList.toggle('active', i === 0));

  if (id) {
    const item = allItems.find(x => x.id === id);
    if (!item) return;
    LANGS.forEach(lang => {
      const q = $(`#faqQuestion_${lang}`);
      const a = $(`#faqAnswer_${lang}`);
      if (q) q.value = item[`question_${lang}`] || '';
      if (a) a.value = item[`answer_${lang}`] || '';
    });
    $('#faqCategory').value = item.category || 'general';
    $('#faqOrder').value = item.order || 0;
  }

  $('#faqModal').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  $('#faqModal').classList.remove('active');
  document.body.style.overflow = '';
  editingId = null;
}

async function handleSave(e) {
  e.preventDefault();
  const submitBtn = $('#faqSubmitBtn');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Saqlanmoqda...';

  const data = {
    category: $('#faqCategory').value,
    order: parseInt($('#faqOrder').value, 10) || 0
  };
  LANGS.forEach(lang => {
    data[`question_${lang}`] = $(`#faqQuestion_${lang}`).value.trim();
    data[`answer_${lang}`] = $(`#faqAnswer_${lang}`).value.trim();
  });

  if (!data.question_uz || !data.answer_uz) {
    toast("UZ savol va javob majburiy", 'error');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Saqlash';
    return;
  }

  try {
    if (editingId) {
      await updateDocument(COLLECTION, editingId, data);
      toast('Savol tahrirlandi', 'success');
    } else {
      await addDocument(COLLECTION, data);
      toast("Savol qo'shildi", 'success');
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
  if (!window.confirm("Savolni o'chirmoqchimisiz?")) return;
  try {
    await deleteDocument(COLLECTION, id);
    toast("Savol o'chirildi", 'success');
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
  $('#addFaqBtn')?.addEventListener('click', () => openModal());
  $('#faqModalClose')?.addEventListener('click', closeModal);
  $('#faqCancelBtn')?.addEventListener('click', closeModal);
  $('#faqForm')?.addEventListener('submit', handleSave);
  $('#faqModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'faqModal') closeModal();
  });

  unsubscribe = await subscribeCollection(COLLECTION, (items) => {
    items.sort((a, b) => (a.order || 0) - (b.order || 0));
    allItems = items;
    renderTable();
  });
});

window.addEventListener('beforeunload', () => {
  if (typeof unsubscribe === 'function') unsubscribe();
});
