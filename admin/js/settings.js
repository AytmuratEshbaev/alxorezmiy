// ============================================
// ADMIN — SETTINGS MODULE (Single Document)
// ============================================
// Saqlanadigan joy: settings/main

import { getDocument, updateDocument, addDocument } from '../../js/firestore-helpers.js';
import { doc, setDoc, getDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const SETTINGS_DOC = 'main';
const COLLECTION = 'settings';
const LANGS = ['uz', 'ru', 'kk', 'en'];

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

function getDb() {
  return new Promise((resolve) => {
    if (window.firebase?.db) return resolve(window.firebase.db);
    const interval = setInterval(() => {
      if (window.firebase?.db) {
        clearInterval(interval);
        resolve(window.firebase.db);
      }
    }, 30);
  });
}

async function loadSettings() {
  const db = await getDb();
  const ref = doc(db, COLLECTION, SETTINGS_DOC);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data();
}

async function saveSettings(data) {
  const db = await getDb();
  const ref = doc(db, COLLECTION, SETTINGS_DOC);
  return setDoc(ref, { ...data, updatedAt: serverTimestamp() }, { merge: true });
}

function setupLangTabs() {
  $$('.lang-tabs-bar').forEach(bar => {
    const tabs = bar.querySelectorAll('.lang-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const lang = tab.dataset.lang;
        const group = tab.closest('.lang-group');
        if (!group) return;
        group.querySelectorAll('.lang-tab').forEach(t => t.classList.toggle('active', t === tab));
        group.querySelectorAll('.lang-panel').forEach(p => p.classList.toggle('active', p.dataset.lang === lang));
      });
    });
  });
}

function fillForm(data) {
  if (!data) return;
  LANGS.forEach(lang => {
    const fn = $(`#fullName_${lang}`);
    const sn = $(`#shortName_${lang}`);
    if (fn) fn.value = data[`fullName_${lang}`] || '';
    if (sn) sn.value = data[`shortName_${lang}`] || '';
  });
  $('#contactAddress').value = data.address || '';
  $('#contactPhone').value = data.phone || '';
  $('#contactEmail').value = data.email || '';
  $('#contactHours').value = data.hours || '';
  $('#socialTelegram').value = data.telegram || '';
  $('#socialInstagram').value = data.instagram || '';
  $('#socialFacebook').value = data.facebook || '';
  $('#socialYoutube').value = data.youtube || '';
  $('#statsStudents').value = data.students_count || 0;
  $('#statsTeachers').value = data.teachers_count || 0;
  $('#statsExperience').value = data.experience_years || 0;
  $('#statsOlympiad').value = data.olympiad_winners || 0;
}

function readForm() {
  const data = {
    address: $('#contactAddress').value.trim(),
    phone: $('#contactPhone').value.trim(),
    email: $('#contactEmail').value.trim(),
    hours: $('#contactHours').value.trim(),
    telegram: $('#socialTelegram').value.trim(),
    instagram: $('#socialInstagram').value.trim(),
    facebook: $('#socialFacebook').value.trim(),
    youtube: $('#socialYoutube').value.trim(),
    students_count: parseInt($('#statsStudents').value, 10) || 0,
    teachers_count: parseInt($('#statsTeachers').value, 10) || 0,
    experience_years: parseInt($('#statsExperience').value, 10) || 0,
    olympiad_winners: parseInt($('#statsOlympiad').value, 10) || 0
  };
  LANGS.forEach(lang => {
    data[`fullName_${lang}`] = $(`#fullName_${lang}`).value.trim();
    data[`shortName_${lang}`] = $(`#shortName_${lang}`).value.trim();
  });
  return data;
}

async function handleSave(e) {
  e.preventDefault();
  const submitBtn = $('#settingsSubmitBtn');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Saqlanmoqda...';

  try {
    await saveSettings(readForm());
    toast('Sozlamalar saqlandi', 'success');
  } catch (err) {
    console.error('Save error:', err);
    toast('Xatolik: ' + err.message, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Saqlash';
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  setupLangTabs();
  $('#settingsForm')?.addEventListener('submit', handleSave);

  try {
    const data = await loadSettings();
    fillForm(data);
  } catch (err) {
    console.error('Load error:', err);
    toast("Sozlamalarni yuklab bo'lmadi", 'error');
  }
});
