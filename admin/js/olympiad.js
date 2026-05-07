// ============================================
// ADMIN — OLYMPIAD MODULE (Firestore CRUD)
// ============================================

import {
  subscribeCollection,
  addDocument,
  updateDocument,
  deleteDocument
} from '../../js/firestore-helpers.js';

const COLLECTION = 'olympiad';
let allItems = [];
let editingId = null;
let unsubscribe = null;

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const LEVEL_LABELS = {
  xalqaro: '🌍 Xalqaro',
  respublika: '🏛️ Respublika',
  shahar: '🏙️ Shahar',
  tuman: '🏘️ Tuman'
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
  const tbody = $('#olyTableBody');
  if (!tbody) return;

  if (!allItems.length) {
    tbody.innerHTML = `
      <tr><td colspan="7" style="text-align:center;padding:40px;color:#94A3B8;">
        Hali natijalar yo'q. <strong>"Qo'shish"</strong> tugmasini bosing.
      </td></tr>`;
    return;
  }

  tbody.innerHTML = allItems.map(item => `
    <tr>
      <td><strong>${escapeHtml(item.student || '—')}</strong></td>
      <td>${escapeHtml(item.subject || '—')}</td>
      <td><span class="badge badge-warning">${LEVEL_LABELS[item.level] || item.level}</span></td>
      <td><strong style="color:var(--primary);">${item.place || '—'}</strong>-o'rin</td>
      <td>${escapeHtml(item.olympiad_name || '—')}</td>
      <td>${item.year || '—'}</td>
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
  const modal = $('#olyModal');
  $('#olyModalTitle').textContent = id ? "Natijani tahrirlash" : "Yangi natija qo'shish";
  $('#olyForm').reset();

  if (id) {
    const item = allItems.find(x => x.id === id);
    if (!item) return;
    $('#olyStudent').value = item.student || '';
    $('#olySubject').value = item.subject || '';
    $('#olyLevel').value = item.level || 'respublika';
    $('#olyPlace').value = item.place || 1;
    $('#olyName').value = item.olympiad_name || '';
    $('#olyYear').value = item.year || new Date().getFullYear();
  } else {
    $('#olyYear').value = new Date().getFullYear();
  }

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  $('#olyModal').classList.remove('active');
  document.body.style.overflow = '';
  editingId = null;
}

async function handleSave(e) {
  e.preventDefault();
  const submitBtn = $('#olySubmitBtn');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Saqlanmoqda...';

  const data = {
    student: $('#olyStudent').value.trim(),
    subject: $('#olySubject').value.trim(),
    level: $('#olyLevel').value,
    place: parseInt($('#olyPlace').value, 10) || 1,
    olympiad_name: $('#olyName').value.trim(),
    year: parseInt($('#olyYear').value, 10) || new Date().getFullYear()
  };

  if (!data.student) {
    toast("O'quvchi ismi majburiy", 'error');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Saqlash';
    return;
  }

  try {
    if (editingId) {
      await updateDocument(COLLECTION, editingId, data);
      toast('Natija tahrirlandi', 'success');
    } else {
      await addDocument(COLLECTION, data);
      toast("Natija qo'shildi", 'success');
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
  if (!window.confirm(`"${item.student}" natijasini o'chirmoqchimisiz?`)) return;
  try {
    await deleteDocument(COLLECTION, id);
    toast("Natija o'chirildi", 'success');
  } catch (err) {
    console.error('Delete error:', err);
    toast('Xatolik: ' + err.message, 'error');
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  $('#addOlyBtn')?.addEventListener('click', () => openModal());
  $('#olyModalClose')?.addEventListener('click', closeModal);
  $('#olyCancelBtn')?.addEventListener('click', closeModal);
  $('#olyForm')?.addEventListener('submit', handleSave);
  $('#olyModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'olyModal') closeModal();
  });

  unsubscribe = await subscribeCollection(COLLECTION, (items) => {
    items.sort((a, b) => (b.year || 0) - (a.year || 0) || (a.place || 99) - (b.place || 99));
    allItems = items;
    renderTable();
  });
});

window.addEventListener('beforeunload', () => {
  if (typeof unsubscribe === 'function') unsubscribe();
});
