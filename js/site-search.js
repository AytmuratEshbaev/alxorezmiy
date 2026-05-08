// ============================================
// SITE SEARCH — Global Cmd+K search
// ============================================
// News + Teachers ichidan qidiruv. Cmd/Ctrl+K bilan ochiladi.

import { getDocuments } from './firestore-helpers.js';

const $ = (sel) => document.querySelector(sel);

let searchData = { news: [], teachers: [] };
let dataLoaded = false;
let modal = null;

function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}

async function loadData() {
  if (dataLoaded) return;
  try {
    const [news, teachers] = await Promise.all([
      getDocuments('news', { orderBy: 'createdAt', direction: 'desc', limit: 50 }),
      getDocuments('teachers', { limit: 50 })
    ]);
    searchData.news = news.filter(n => n.status === 'published');
    searchData.teachers = teachers;
    dataLoaded = true;
  } catch (err) {
    console.warn('Search data load failed:', err);
  }
}

function search(query) {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase();
  const results = [];

  for (const item of searchData.news) {
    const title = (window.getLocalizedField(item, 'title') || '').toLowerCase();
    const content = (window.getLocalizedField(item, 'content') || '').toLowerCase();
    if (title.includes(q) || content.includes(q)) {
      results.push({
        type: 'news',
        id: item.id,
        title: window.getLocalizedField(item, 'title'),
        subtitle: (window.getLocalizedField(item, 'content') || '').substring(0, 100),
        href: `/news/${item.id}`,
        icon: '📰'
      });
    }
  }

  for (const item of searchData.teachers) {
    const name = (window.getLocalizedField(item, 'name') || '').toLowerCase();
    const subject = (item.subject || '').toLowerCase();
    if (name.includes(q) || subject.includes(q)) {
      results.push({
        type: 'teacher',
        id: item.id,
        title: window.getLocalizedField(item, 'name'),
        subtitle: `${item.subject || ''} · ${item.category || ''}`,
        href: `/teachers#${item.id}`,
        icon: '👨‍🏫'
      });
    }
  }

  return results.slice(0, 10);
}

function buildModal() {
  const m = document.createElement('div');
  m.className = 'search-modal';
  m.id = 'searchModal';
  m.innerHTML = `
    <div class="search-modal-backdrop"></div>
    <div class="search-modal-box">
      <div class="search-modal-input-wrap">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        <input type="text" id="searchModalInput" class="search-modal-input" placeholder="Qidirish: yangilik, o'qituvchi..." autocomplete="off">
        <kbd class="search-kbd">ESC</kbd>
      </div>
      <div class="search-modal-results" id="searchModalResults">
        <div class="search-empty">
          <p style="color:var(--text-lo);font-size:0.875rem;">Kamida 2 ta harf yozing</p>
          <div style="margin-top:8px;font-size:0.75rem;color:var(--text-lo);">
            Klaviatura: <kbd class="search-kbd">↑↓</kbd> ko'chish · <kbd class="search-kbd">Enter</kbd> ochish · <kbd class="search-kbd">ESC</kbd> yopish
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(m);
  return m;
}

function renderResults(results, query) {
  const wrap = $('#searchModalResults');
  if (!query || query.length < 2) {
    wrap.innerHTML = `<div class="search-empty"><p style="color:var(--text-lo);">Kamida 2 ta harf yozing</p></div>`;
    return;
  }
  if (!results.length) {
    wrap.innerHTML = `<div class="search-empty">
      <div style="font-size:2.5rem;margin-bottom:8px;opacity:0.5;">🔍</div>
      <p style="color:var(--text-mid);">"${escapeHtml(query)}" bo'yicha hech narsa topilmadi</p>
    </div>`;
    return;
  }
  wrap.innerHTML = results.map((r, i) => `
    <a href="${r.href}" class="search-result ${i === 0 ? 'active' : ''}" data-idx="${i}">
      <span class="search-result-icon">${r.icon}</span>
      <div class="search-result-text">
        <div class="search-result-title">${escapeHtml(r.title)}</div>
        <div class="search-result-subtitle">${escapeHtml(r.subtitle)}</div>
      </div>
      <span class="search-result-type">${r.type === 'news' ? 'Yangilik' : "O'qituvchi"}</span>
    </a>
  `).join('');
}

function navigateResults(dir) {
  const items = document.querySelectorAll('.search-result');
  if (!items.length) return;
  const current = document.querySelector('.search-result.active');
  let idx = current ? parseInt(current.dataset.idx) : -1;
  idx = (idx + dir + items.length) % items.length;
  items.forEach(i => i.classList.remove('active'));
  items[idx].classList.add('active');
  items[idx].scrollIntoView({ block: 'nearest' });
}

function open() {
  if (!modal) modal = buildModal();
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
  loadData();
  setTimeout(() => $('#searchModalInput').focus(), 50);
}

function close() {
  if (!modal) return;
  modal.classList.remove('active');
  document.body.style.overflow = '';
}

function setupEvents() {
  // Cmd/Ctrl + K to open
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      open();
    } else if (e.key === 'Escape' && modal?.classList.contains('active')) {
      close();
    } else if (modal?.classList.contains('active')) {
      if (e.key === 'ArrowDown') { e.preventDefault(); navigateResults(1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); navigateResults(-1); }
      else if (e.key === 'Enter') {
        const active = document.querySelector('.search-result.active');
        if (active) { e.preventDefault(); window.location.href = active.href; }
      }
    }
  });

  // Click outside to close
  document.addEventListener('click', (e) => {
    if (!modal?.classList.contains('active')) return;
    if (e.target.classList?.contains('search-modal-backdrop')) close();
  });

  // Input handler
  document.addEventListener('input', (e) => {
    if (e.target.id !== 'searchModalInput') return;
    const results = search(e.target.value);
    renderResults(results, e.target.value);
  });
}

// Search button injection in navbar (after site-shell mounts)
function injectSearchButton() {
  const navActions = document.querySelector('.nav-actions');
  if (!navActions || navActions.querySelector('.search-trigger')) return;
  const btn = document.createElement('button');
  btn.className = 'search-trigger';
  btn.setAttribute('aria-label', 'Qidirish');
  btn.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
    <kbd class="search-kbd-mini">⌘K</kbd>
  `;
  btn.addEventListener('click', open);
  navActions.insertBefore(btn, navActions.firstChild);
}

document.addEventListener('DOMContentLoaded', () => {
  setupEvents();
  // Wait for site-shell to render, then inject button
  setTimeout(injectSearchButton, 100);
});
