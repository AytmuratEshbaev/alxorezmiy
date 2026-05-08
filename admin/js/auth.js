// ============================================
// ADMIN AUTHENTICATION — Firebase Auth
// ============================================

import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

// firebase-config.js modulini kutamiz
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

const isLoginPage = /\/login(\.html)?\/?$/.test(window.location.pathname);

console.log('[auth] init:', { pathname: window.location.pathname, isLoginPage });

let redirected = false;
function safeRedirect(target) {
  if (redirected) return;
  redirected = true;
  console.log('[auth] redirect →', target);
  window.location.replace(target);
}

// Avval — auth state'ni TO'LIQ kutamiz (Firebase v10+ rasmiy metodi)
// Bu IndexedDB'dan local sessiyani o'qishini kutadi.
async function getAuthState() {
  if (typeof auth.authStateReady === 'function') {
    await auth.authStateReady();
  } else {
    // Fallback: birinchi onAuthStateChanged event'ini kutamiz
    await new Promise((resolve) => {
      const unsub = onAuthStateChanged(auth, () => {
        unsub();
        resolve();
      });
    });
  }
  return auth.currentUser;
}

// ── Auth Guard ──
const initialUser = await getAuthState();
console.log('[auth] initial user:', initialUser ? initialUser.email : 'null');

if (!initialUser && !isLoginPage) {
  safeRedirect('/admin/login');
} else if (initialUser && isLoginPage) {
  safeRedirect('/admin/index');
}

// User ma'lumotini UI'ga to'ldirish (initial)
function fillUserUI(user) {
  if (!user) return;
  const userNameEl = document.querySelector('.user-name');
  const userRoleEl = document.querySelector('.user-role');
  const userAvatarEl = document.querySelector('.user-avatar');
  if (userNameEl) userNameEl.textContent = user.displayName || user.email.split('@')[0];
  if (userRoleEl) userRoleEl.textContent = 'Admin';
  if (userAvatarEl) userAvatarEl.textContent = (user.displayName || user.email)[0].toUpperCase();
}
fillUserUI(initialUser);

// Live state changes (login/logout boshqa tabda) — keyin
onAuthStateChanged(auth, (user) => {
  console.log('[auth] state changed:', user ? user.email : 'logged out');
  fillUserUI(user);

  // Faqat HOLAT O'ZGARGANDA redirect (initial state'da emas)
  if (!user && !isLoginPage) {
    safeRedirect('/admin/login');
  } else if (user && isLoginPage) {
    safeRedirect('/admin/index');
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
        // Muvaffaqiyat — onAuthStateChanged dashboard'ga yo'naltiradi
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
        window.location.replace('/admin/login');
      } catch (err) {
        console.error('Logout xatosi:', err);
      }
    });
  }
});

// Sidebar toggle
window.toggleSidebar = function () {
  document.querySelector('.sidebar')?.classList.toggle('active');
};
