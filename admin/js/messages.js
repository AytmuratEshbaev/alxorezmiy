// ============================================
// ADMIN — MESSAGES MODULE (Read + Mark + Delete)
// ============================================

import {
  subscribeCollection,
  updateDocument,
  deleteDocument,
  formatDate
} from '../../js/firestore-helpers.js';

const COLLECTION = 'messages';
let allItems = [];
let currentFilter = 'all';
let unsubscribe = null;

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

function renderList() {
  const list = $('#messagesList');
  if (!list) return;

  let filtered = allItems;
  if (currentFilter === 'unread') filtered = filtered.filter(m => !m.read);
  if (currentFilter === 'read') filtered = filtered.filter(m => m.read);

  if (!filtered.length) {
    list.innerHTML = `<div style="text-align:center;padding:60px;color:#94A3B8;">
      <div style="font-size:3rem;margin-bottom:12px;">📭</div>
      <p>${currentFilter === 'unread' ? "O'qilmagan xabar yo'q" : "Hali xabarlar yo'q"}</p>
    </div>`;
    updateCounts();
    return;
  }

  list.innerHTML = filtered.map(m => `
    <div class="message-card ${m.read ? 'read' : 'unread'}" data-id="${m.id}">
      <div class="message-meta">
        <div>
          <strong>${escapeHtml(m.name)}</strong>
          <span style="color:#64748B;"> · ${escapeHtml(m.email)}</span>
        </div>
        <span style="color:#94A3B8;font-size:0.85rem;">${formatDate(m.createdAt)}</span>
      </div>
      <h4 style="margin:8px 0;">${escapeHtml(m.subject)}</h4>
      <p style="white-space:pre-line;color:#475569;line-height:1.6;">${escapeHtml(m.message)}</p>
      <div class="message-actions">
        <a href="mailto:${encodeURIComponent(m.email)}?subject=Re: ${encodeURIComponent(m.subject)}" class="btn btn-outline btn-sm">✉️ Javob berish</a>
        ${!m.read
          ? `<button class="btn btn-outline btn-sm mark-read" data-id="${m.id}">✓ O'qildi deb belgilash</button>`
          : `<button class="btn btn-outline btn-sm mark-unread" data-id="${m.id}">↺ O'qilmagan deb belgilash</button>`}
        <button class="btn btn-danger btn-sm delete-msg" data-id="${m.id}">🗑️ O'chirish</button>
      </div>
    </div>
  `).join('');

  list.querySelectorAll('.mark-read').forEach(b => b.addEventListener('click', () => markRead(b.dataset.id, true)));
  list.querySelectorAll('.mark-unread').forEach(b => b.addEventListener('click', () => markRead(b.dataset.id, false)));
  list.querySelectorAll('.delete-msg').forEach(b => b.addEventListener('click', () => handleDelete(b.dataset.id)));

  updateCounts();
}

function updateCounts() {
  const total = allItems.length;
  const unread = allItems.filter(m => !m.read).length;
  $('#countAll') && ($('#countAll').textContent = total);
  $('#countUnread') && ($('#countUnread').textContent = unread);
  $('#countRead') && ($('#countRead').textContent = total - unread);
  // Badge for unread (sidebar/header)
  const badge = $('#unreadBadge');
  if (badge) {
    if (unread > 0) {
      badge.textContent = unread;
      badge.style.display = 'inline-block';
    } else {
      badge.style.display = 'none';
    }
  }
}

async function markRead(id, read) {
  try {
    await updateDocument(COLLECTION, id, { read });
    toast(read ? "O'qildi deb belgilandi" : "O'qilmagan deb belgilandi", 'success');
  } catch (err) {
    toast('Xatolik: ' + err.message, 'error');
  }
}

async function handleDelete(id) {
  if (!window.confirm("Xabarni butunlay o'chirmoqchimisiz?")) return;
  try {
    await deleteDocument(COLLECTION, id);
    toast("Xabar o'chirildi", 'success');
  } catch (err) {
    toast('Xatolik: ' + err.message, 'error');
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  $$('.msg-filter').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.msg-filter').forEach(b => b.classList.toggle('active', b === btn));
      currentFilter = btn.dataset.filter;
      renderList();
    });
  });

  unsubscribe = await subscribeCollection(COLLECTION, (items) => {
    allItems = items;
    renderList();
  }, { orderBy: 'createdAt', direction: 'desc' });
});

window.addEventListener('beforeunload', () => {
  if (typeof unsubscribe === 'function') unsubscribe();
});
