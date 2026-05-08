// ============================================
// SETTINGS LOADER — Public sahifalarda Firestore Settings'ni qo'llash
// ============================================
// Sayt bo'ylab `[data-setting="key"]` elementlarni Firestore'dagi settings/main
// hujjati ma'lumotlari bilan to'ldiradi.

import { getDocument } from './firestore-helpers.js';

function applySettings(s) {
  if (!s) return;

  // Address, phone, email, hours
  setText('address', s.address);
  setText('phone', s.phone);
  setText('email', s.email);
  setText('hours', s.hours);

  // Phone va email link'lari
  const phoneLink = document.querySelector('[data-setting="phone-link"]');
  if (phoneLink && s.phone) {
    phoneLink.setAttribute('href', 'tel:' + s.phone.replace(/\s+/g, ''));
  }
  const emailLink = document.querySelector('[data-setting="email-link"]');
  if (emailLink && s.email) {
    emailLink.setAttribute('href', 'mailto:' + s.email);
  }

  // Ijtimoiy tarmoqlar
  setSocial('telegram', s.telegram);
  setSocial('instagram', s.instagram);
  setSocial('facebook', s.facebook);
  setSocial('youtube', s.youtube);

  // Statistika (bosh sahifa)
  updateStat('stat-students', s.students_count, '+');
  updateStat('stat-teachers', s.teachers_count, '');
  updateStat('stat-experience', s.experience_years, '+');
  updateStat('stat-olympiad', s.olympiad_winners, '+');

  // Maktab nomi (lokalizatsiya bilan)
  const lang = localStorage.getItem('lang') || 'uz';
  const fullName = s[`fullName_${lang}`] || s.fullName_uz;
  const shortName = s[`shortName_${lang}`] || s.shortName_uz;

  if (fullName) {
    document.querySelectorAll('[data-setting="full-name"]').forEach(el => {
      el.textContent = fullName;
      // Parent containerlarni ko'rsatish (agar yashirilgan bo'lsa)
      const card = el.closest('#official-name-card, #footer-official-name');
      if (card) card.style.display = '';
    });

    // Schema.org JSON-LD'ni yangilash (browser ko'rinishi uchun)
    updateSchemaOrg(fullName, shortName);
  }
  if (shortName) {
    setText('short-name', shortName);
  }

  // Browser tab title — short name'ni qo'shish (i18n title bor bo'lsa qo'shimcha)
  if (shortName && document.title && !document.title.includes(shortName) && !document.title.includes('Al-Xorazmiy')) {
    document.title = `${document.title} | ${shortName}`;
  }
}

function updateSchemaOrg(fullName, shortName) {
  const ld = document.querySelector('script[type="application/ld+json"]');
  if (!ld) return;
  try {
    const data = JSON.parse(ld.textContent);
    if (data['@type'] === 'EducationalOrganization') {
      data.name = fullName;
      if (shortName) data.alternateName = shortName;
      ld.textContent = JSON.stringify(data, null, 2);
    }
  } catch (e) {
    // ignore parse errors
  }
}

function setText(key, value) {
  if (!value) return;
  document.querySelectorAll(`[data-setting="${key}"]`).forEach(el => {
    el.textContent = value;
  });
}

function setSocial(name, url) {
  const link = document.querySelector(`[data-social="${name}"]`);
  if (!link) return;
  if (url && url.trim()) {
    link.setAttribute('href', url);
    link.setAttribute('target', '_blank');
    link.setAttribute('rel', 'noopener');
    link.style.display = '';
  } else {
    link.style.display = 'none'; // bo'sh bo'lsa ko'rsatmaymiz
  }
}

function updateStat(key, value, suffix) {
  if (typeof value !== 'number' || value <= 0) return;
  document.querySelectorAll(`[data-setting="${key}"]`).forEach(el => {
    el.setAttribute('data-count', value);
    if (suffix) el.setAttribute('data-suffix', suffix);
    // Stats.js animatsiyasi: counted klassi olib tashlansa qayta animatsiya
    el.classList.remove('counted');
    el.textContent = '0';
  });
}

let cached = null;

async function loadAndApply() {
  try {
    if (!cached) {
      cached = await getDocument('settings', 'main');
    }
    applySettings(cached);
  } catch (err) {
    console.warn('Settings yuklab olinmadi:', err);
  }
}

// Til o'zgarganda nomlarni yangilash uchun
window.applySettings = () => {
  if (cached) applySettings(cached);
};

// i18n.js custom event yuborganda til o'zgarsa — settings'ni qayta qo'llaymiz
window.addEventListener('langchange', () => {
  if (cached) applySettings(cached);
});

document.addEventListener('DOMContentLoaded', loadAndApply);
