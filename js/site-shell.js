// ============================================
// SITE SHELL — Navbar + Mobile nav + Footer (DRY)
// ============================================
// Foydalanish (har bir public HTML'da):
//   <div id="navbar-mount"></div>
//   <div id="mobile-nav-mount"></div>
//   ...content...
//   <div id="footer-mount"></div>
//   <script src="js/site-shell.js"></script>

(function () {
  const NAV_ITEMS = [
    { key: 'home', href: 'index.html', i18n: 'nav.home', label: 'Bosh sahifa' },
    { key: 'about', href: 'about.html', i18n: 'nav.about', label: 'Maktab haqida' },
    { key: 'directions', href: 'directions.html', i18n: 'nav.directions', label: "Yo'nalishlar" },
    { key: 'teachers', href: 'teachers.html', i18n: 'nav.teachers', label: "O'qituvchilar" },
    { key: 'news', href: 'news.html', i18n: 'nav.news', label: 'Yangiliklar' },
    { key: 'contact', href: 'contact.html', i18n: 'nav.contact', label: 'Kontakt' }
  ];

  const MOBILE_EXTRA = [
    { key: 'faq', href: 'faq.html', i18n: 'nav.faq', label: 'FAQ' },
    { key: 'admission', href: 'admission.html', i18n: 'nav.admission', label: 'Qabul' },
    { key: 'gallery', href: 'gallery.html', i18n: 'nav.gallery', label: 'Galereya' }
  ];

  function getActiveKey() {
    const path = window.location.pathname;
    const filename = path.replace(/\/$/, '').split('/').pop().replace(/\.html$/, '');
    if (!filename || filename === 'index') return 'home';
    return filename;
  }

  function navLinkHtml(item, activeKey) {
    const isActive = item.key === activeKey ? ' class="active"' : '';
    return `<a href="${item.href}"${isActive} data-i18n="${item.i18n}">${item.label}</a>`;
  }

  function renderNavbar(activeKey) {
    return `
    <nav class="navbar" id="navbar">
      <div class="container flex-between">
        <a href="index.html" class="navbar-logo" aria-label="Al-Xorazmiy maktabi — bosh sahifa">
          <div style="width:42px;height:42px;background:linear-gradient(135deg,#1F4E79,#2E75B6);border-radius:8px;display:flex;align-items:center;justify-content:center;color:white;font-weight:800;font-size:1.1rem;">AX</div>
          <span>Al-Xorazmiy<small data-i18n="hero.subtitle">Nukus filiali</small></span>
        </a>
        <div class="nav-links">
          ${NAV_ITEMS.map(i => navLinkHtml(i, activeKey)).join('')}
        </div>
        <div class="nav-actions">
          <div class="lang-switcher">
            <button class="lang-btn" aria-label="Tilni tanlash">
              <span class="lang-current">UZ</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
            </button>
            <div class="lang-dropdown">
              <a href="#" data-lang="uz" class="active">🇺🇿 O'zbekcha</a>
              <a href="#" data-lang="ru">🇷🇺 Русский</a>
              <a href="#" data-lang="kk">🏳️ Qaraqalpaqsha</a>
              <a href="#" data-lang="en">🇬🇧 English</a>
            </div>
          </div>
          <button class="theme-toggle" aria-label="Tema almashtirish">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          </button>
          <div class="hamburger" id="hamburger" aria-label="Menyu" role="button" tabindex="0">
            <span></span><span></span><span></span>
          </div>
        </div>
      </div>
    </nav>`;
  }

  function renderMobileNav(activeKey) {
    const items = [...NAV_ITEMS, ...MOBILE_EXTRA];
    return `
    <div class="mobile-nav" id="mobileNav">
      ${items.map(i => navLinkHtml(i, activeKey)).join('')}
    </div>`;
  }

  function renderFooter() {
    return `
    <footer class="footer">
      <div class="container">
        <div class="footer-grid">
          <div class="footer-about">
            <h4>Al-Xorazmiy maktabi</h4>
            <p data-i18n="footer.about_text">Muhammad al-Xorazmiy ixtisoslashtirilgan maktabi — aniq va tabiiy fanlar bo'yicha chuqurlashtirilgan ta'lim beruvchi zamonaviy ta'lim muassasasi.</p>
            <div class="footer-social">
              <a href="#" data-social="telegram" aria-label="Telegram">✈️</a>
              <a href="#" data-social="instagram" aria-label="Instagram">📷</a>
              <a href="#" data-social="facebook" aria-label="Facebook">📘</a>
              <a href="#" data-social="youtube" aria-label="YouTube">▶️</a>
            </div>
          </div>
          <div>
            <h4 data-i18n="footer.quick_links">Tezkor havolalar</h4>
            <ul class="footer-links">
              <li><a href="about.html" data-i18n="nav.about">Maktab haqida</a></li>
              <li><a href="directions.html" data-i18n="nav.directions">Yo'nalishlar</a></li>
              <li><a href="teachers.html" data-i18n="nav.teachers">O'qituvchilar</a></li>
              <li><a href="admission.html" data-i18n="nav.admission">Qabul</a></li>
              <li><a href="gallery.html" data-i18n="nav.gallery">Galereya</a></li>
            </ul>
          </div>
          <div>
            <h4 data-i18n="footer.contact_info">Kontakt</h4>
            <ul class="footer-contact">
              <li><span>📍</span> <span data-setting="address">Nukus shahri, Amir Temur ko'chasi 1-uy</span></li>
              <li><span>📞</span> <a data-setting="phone-link" href="tel:+998612223344"><span data-setting="phone">+998 61 222-33-44</span></a></li>
              <li><span>📧</span> <a data-setting="email-link" href="mailto:info@alxorazmiy-nukus.uz"><span data-setting="email">info@alxorazmiy-nukus.uz</span></a></li>
              <li><span>🕐</span> <span data-setting="hours">Du–Sh: 08:00–17:00</span></li>
            </ul>
          </div>
          <div>
            <h4 data-i18n="nav.faq">Yordam</h4>
            <ul class="footer-links">
              <li><a href="faq.html" data-i18n="nav.faq">FAQ</a></li>
              <li><a href="news.html" data-i18n="nav.news">Yangiliklar</a></li>
              <li><a href="contact.html" data-i18n="nav.contact">Kontakt</a></li>
            </ul>
          </div>
        </div>
        <div class="footer-official-name" id="footer-official-name" style="margin-bottom:var(--s-5);padding-top:var(--s-5);border-top:1px solid rgba(255,255,255,0.06);text-align:center;display:none;">
          <span style="font-family:var(--font-mono);font-size:0.6875rem;text-transform:uppercase;letter-spacing:0.1em;color:rgba(255,255,255,.4);display:block;margin-bottom:6px;">Rasmiy nom</span>
          <p data-setting="full-name" style="font-size:0.8125rem;line-height:1.5;color:rgba(255,255,255,.55);max-width:900px;margin:0 auto;"></p>
        </div>
        <div class="footer-bottom">
          <span data-i18n="footer.copyright">© 2026 Al-Xorazmiy ixtisoslashtirilgan maktabi. Barcha huquqlar himoyalangan.</span>
          <span>Made with ❤️ in Nukus</span>
        </div>
      </div>
    </footer>`;
  }

  function renderBackToTop() {
    return `<button class="back-to-top" id="backToTop" aria-label="Yuqoriga">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 15l-6-6-6 6"/></svg>
    </button>`;
  }

  function mount(id, html) {
    const el = document.getElementById(id);
    if (el) el.outerHTML = html;
  }

  // Avtomatik mount (dom parse paytida)
  const activeKey = getActiveKey();
  mount('navbar-mount', renderNavbar(activeKey));
  mount('mobile-nav-mount', renderMobileNav(activeKey));
  mount('footer-mount', renderFooter());
  mount('back-to-top-mount', renderBackToTop());
})();
