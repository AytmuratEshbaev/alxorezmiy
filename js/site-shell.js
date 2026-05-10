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
    const isActive = item.key === activeKey ? ' class="active" aria-current="page"' : '';
    return `<a href="${item.href}"${isActive} data-i18n="${item.i18n}">${item.label}</a>`;
  }

  // Inline SVG icon set — single source of truth, matches design palette
  const SVG = {
    pin: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
    phone: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
    mail: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>',
    clock: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
    telegram: '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z"/></svg>',
    instagram: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>',
    facebook: '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.45 2.89h-2.33v6.99A10 10 0 0 0 22 12z"/></svg>',
    youtube: '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.6 3.6 12 3.6 12 3.6s-7.6 0-9.4.5A3 3 0 0 0 .5 6.2C0 8 0 12 0 12s0 4 .5 5.8a3 3 0 0 0 2.1 2.1c1.8.5 9.4.5 9.4.5s7.6 0 9.4-.5a3 3 0 0 0 2.1-2.1c.5-1.8.5-5.8.5-5.8s0-4-.5-5.8zM9.6 15.6V8.4l6.3 3.6-6.3 3.6z"/></svg>'
  };

  function renderNavbar(activeKey) {
    return `
    <a href="#main-content" class="skip-link">Asosiy mazmunga o'tish</a>
    <nav class="navbar" id="navbar">
      <div class="navbar-inner">
        <a href="index.html" class="navbar-logo" aria-label="Al-Xorazmiy maktabi — bosh sahifa">
          <span class="navbar-logo-icon">
            <img src="assets/images/logo.webp" alt="" width="44" height="44" loading="eager" decoding="async">
          </span>
        </a>
        <div class="nav-links">
          ${NAV_ITEMS.map(i => navLinkHtml(i, activeKey)).join('')}
        </div>
        <div class="nav-actions">
          <div class="lang-switcher">
            <button class="lang-btn" aria-label="Tilni tanlash" aria-haspopup="true" aria-expanded="false">
              <span class="lang-current">UZ</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
            </button>
            <div class="lang-dropdown" role="menu">
              <a href="#" data-lang="uz" class="active" role="menuitem">🇺🇿 O'zbekcha</a>
              <a href="#" data-lang="ru" role="menuitem">🇷🇺 Русский</a>
              <a href="#" data-lang="kk" role="menuitem">🏳️ Qaraqalpaqsha</a>
              <a href="#" data-lang="en" role="menuitem">🇬🇧 English</a>
            </div>
          </div>
          <button class="theme-toggle" aria-label="Tema almashtirish">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          </button>
          <a href="contact.html" class="btn-nav-cta" data-i18n="nav.contact">Aloqa</a>
          <button type="button" class="hamburger" id="hamburger" aria-label="Menyu" aria-expanded="false" aria-controls="mobileNav">
            <span></span><span></span><span></span>
          </button>
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
              <a href="#" data-social="telegram" aria-label="Telegram">${SVG.telegram}</a>
              <a href="#" data-social="instagram" aria-label="Instagram">${SVG.instagram}</a>
              <a href="#" data-social="facebook" aria-label="Facebook">${SVG.facebook}</a>
              <a href="#" data-social="youtube" aria-label="YouTube">${SVG.youtube}</a>
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
              <li><span>${SVG.pin}</span> <span data-setting="address">Nukus shahri, Amir Temur ko'chasi 1-uy</span></li>
              <li><span>${SVG.phone}</span> <a data-setting="phone-link" href="tel:+998612223344"><span data-setting="phone">+998 61 222-33-44</span></a></li>
              <li><span>${SVG.mail}</span> <a data-setting="email-link" href="mailto:info@alxorazmiy-nukus.uz"><span data-setting="email">info@alxorazmiy-nukus.uz</span></a></li>
              <li><span>${SVG.clock}</span> <span data-setting="hours">Du–Sh: 08:00–17:00</span></li>
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

  // Skip-link target: tag the first hero/page-header so keyboard users land in content
  document.addEventListener('DOMContentLoaded', () => {
    const target = document.querySelector('.hero, .page-header, main, .content-area');
    if (target && !document.getElementById('main-content')) {
      target.id = target.id || 'main-content';
      if (target.id !== 'main-content') {
        const anchor = document.createElement('span');
        anchor.id = 'main-content';
        anchor.tabIndex = -1;
        target.parentNode.insertBefore(anchor, target);
      }
    }
  });
})();
