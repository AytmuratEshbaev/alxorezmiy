// ============================================
// ADMIN AUTHENTICATION — Firebase Auth
// ============================================

import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

// firebase-config.js modulini kutamiz (modul scriptlar tartib bilan ishga tushadi)
function waitForFirebase() {
  return new Promise((resolve) => {
    if (window.firebase?.auth) return resolve(window.firebase);
    const interval = setInterval(() => {
      if (window.firebase?.auth) {
        clearInterval(interval);
        resolve(window.firebase);
      }
    }, 30);
  });
}

const { auth } = await waitForFirebase();

// cleanUrls (vercel.json) tufayli pathname /admin/login yoki /admin/login.html
// bo'lishi mumkin — ikkalasini ham qabul qilamiz
const isLoginPage = /\/login(\.html)?\/?$/.test(window.location.pathname);

// ── Auth Guard: kirmagan foydalanuvchini login'ga yo'naltirish ──
onAuthStateChanged(auth, (user) => {
  if (!user && !isLoginPage) {
    window.location.href = 'login.html';
  } else if (user && isLoginPage) {
    window.location.href = 'index.html';
  }
  // Foydalanuvchi ma'lumotini UI'ga to'ldirish
  if (user && !isLoginPage) {
    const userNameEl = document.querySelector('.user-name');
    const userRoleEl = document.querySelector('.user-role');
    const userAvatarEl = document.querySelector('.user-avatar');
    if (userNameEl) userNameEl.textContent = user.displayName || user.email.split('@')[0];
    if (userRoleEl) userRoleEl.textContent = 'Admin';
    if (userAvatarEl) userAvatarEl.textContent = (user.displayName || user.email)[0].toUpperCase();
  }
});

// ── Login Form ──
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const loginBtn = document.getElementById('loginBtn');
  const loginSpinner = document.getElementById('loginSpinner');
  const loginError = document.getElementById('loginError');

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;

      loginBtn.disabled = true;
      if (loginSpinner) loginSpinner.style.display = 'inline-block';
      if (loginError) loginError.style.display = 'none';

      try {
        await signInWithEmailAndPassword(auth, email, password);
        // Muvaffaqiyat — onAuthStateChanged index.html'ga yo'naltiradi
      } catch (err) {
        console.error('Login xatosi:', err.code, err.message);
        if (loginError) {
          loginError.style.display = 'block';
          const messages = {
            'auth/invalid-credential': "Email yoki parol noto'g'ri",
            'auth/invalid-email': "Email format noto'g'ri",
            'auth/user-not-found': "Bunday foydalanuvchi topilmadi",
            'auth/wrong-password': "Parol noto'g'ri",
            'auth/too-many-requests': "Juda ko'p urinish. Biroz kuting.",
            'auth/network-request-failed': "Internet aloqasini tekshiring"
          };
          loginError.textContent = messages[err.code] || `Xatolik: ${err.message}`;
        }
      } finally {
        loginBtn.disabled = false;
        if (loginSpinner) loginSpinner.style.display = 'none';
      }
    });
  }

  // ── Logout ──
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        await signOut(auth);
        window.location.href = 'login.html';
      } catch (err) {
        console.error('Logout xatosi:', err);
      }
    });
  }
});

// Sidebar toggle (admin layout uchun)
window.toggleSidebar = function () {
  document.querySelector('.sidebar')?.classList.toggle('active');
};
