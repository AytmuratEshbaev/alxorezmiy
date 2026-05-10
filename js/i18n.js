// ============================================
// I18N — Internationalization Module
// ============================================

const I18n = (function() {
  const LANG_KEY = 'lang';
  const DEFAULT_LANG = 'uz';
  const SUPPORTED_LANGS = ['uz', 'ru', 'kk', 'en'];
  const LANG_NAMES = { uz: "O'zbekcha", ru: 'Русский', kk: 'Qaraqalpaqsha', en: 'English' };
  const LANG_SHORT = { uz: 'UZ', ru: 'RU', kk: 'QQ', en: 'EN' };

  let translations = {};
  let currentLang = DEFAULT_LANG;

  function getCurrentLang() {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved && SUPPORTED_LANGS.includes(saved)) return saved;
    return DEFAULT_LANG;
  }

  async function loadLanguage(lang) {
    if (!SUPPORTED_LANGS.includes(lang)) lang = DEFAULT_LANG;
    try {
      // Determine base path (for admin pages)
      const isAdmin = window.location.pathname.includes('/admin/');
      const basePath = isAdmin ? '../lang/' : 'lang/';
      const response = await fetch(`${basePath}${lang}.json`);
      if (!response.ok) throw new Error(`Failed to load ${lang}.json`);
      translations = await response.json();
      currentLang = lang;
      localStorage.setItem(LANG_KEY, lang);
      translatePage();
      updateLangUI();
      document.documentElement.setAttribute('lang', lang);
    } catch (err) {
      console.warn('i18n: Could not load language file:', err);
    }
  }

  function translatePage() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const value = getNestedValue(translations, key);
      if (value) {
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          if (el.getAttribute('placeholder')) el.setAttribute('placeholder', value);
          else el.value = value;
        } else {
          el.textContent = value;
        }
      }
    });
    // Translate title
    const titleKey = document.querySelector('meta[name="i18n-title"]');
    if (titleKey) {
      const val = getNestedValue(translations, titleKey.getAttribute('content'));
      if (val) document.title = val;
    }
  }

  function getNestedValue(obj, path) {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
  }

  function updateLangUI() {
    // Update language switcher button text
    document.querySelectorAll('.lang-current').forEach(el => {
      el.textContent = LANG_SHORT[currentLang] || 'UZ';
    });
    // Update active state in dropdown
    document.querySelectorAll('.lang-dropdown a').forEach(a => {
      a.classList.toggle('active', a.getAttribute('data-lang') === currentLang);
    });
  }

  function setLanguage(lang) {
    loadLanguage(lang);
    // Custom event — barcha listenerlar (settings-loader, sahifa kodi) eshitsin
    window.dispatchEvent(new CustomEvent('langchange', { detail: { lang } }));
    // Backward-compat: agar sahifa onLanguageChange'ni belgilab qo'ygan bo'lsa
    if (typeof window.onLanguageChange === 'function') {
      window.onLanguageChange(lang);
    }
  }

  function t(key) {
    return getNestedValue(translations, key) || key;
  }

  // Initialize
  currentLang = getCurrentLang();

  // Bind events after DOM ready
  document.addEventListener('DOMContentLoaded', () => {
    loadLanguage(currentLang);

    // Language dropdown toggle (with aria-expanded sync)
    document.querySelectorAll('.lang-switcher').forEach(switcher => {
      const btn = switcher.querySelector('.lang-btn');
      if (btn) {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const isOpen = switcher.classList.toggle('open');
          btn.setAttribute('aria-expanded', String(isOpen));
        });
      }
    });

    // Language selection
    document.querySelectorAll('.lang-dropdown a').forEach(a => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        const lang = a.getAttribute('data-lang');
        if (lang) setLanguage(lang);
        document.querySelectorAll('.lang-switcher').forEach(s => {
          s.classList.remove('open');
          const btn = s.querySelector('.lang-btn');
          if (btn) btn.setAttribute('aria-expanded', 'false');
        });
      });
    });

    // Close dropdown on outside click + ESC key
    const closeAll = () => {
      document.querySelectorAll('.lang-switcher.open').forEach(s => {
        s.classList.remove('open');
        const btn = s.querySelector('.lang-btn');
        if (btn) btn.setAttribute('aria-expanded', 'false');
      });
    };
    document.addEventListener('click', closeAll);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeAll(); });
  });

  return { getCurrentLang, setLanguage, t, loadLanguage, LANG_NAMES, LANG_SHORT, SUPPORTED_LANGS };
})();

window.I18n = I18n;
