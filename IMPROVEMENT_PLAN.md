# alxorezmiy.uz — To'liq yaxshilash rejasi

> **Sana:** 2026-07-10 · **Branch:** `redesign/full-improvement`
> **Tahlil asosi:** 5 yo'nalishli chuqur audit (arxitektura, UX/UI, performance, accessibility+SEO, funksionallik)

---

## Tahlil xulosasi

Sayt allaqachon puxta o'ylangan **"Algorithm" dizayn tizimiga** ega: to'q navy (`#0D0D5C`, logotipdan) + amber (`#F59E0B`) aksent, Geist/Geist Mono tipografikasi, mono-aksentli tex-editorial til, 4pt spacing shkalasi, dark mode, dizayn tokenlari. Muammo — didda emas, **ijrodagi uzilishlarda**:

1. **Geist shrifti hech qayerda yuklanmaydi** — butun tipografik tizim tizim shriftiga tushib qolgan (eng katta yashirin nuqson).
2. **`--space-*` / `--radius-*` token oilasi ishlatiladi, lekin aniqlanmagan** — deyarli barcha ikkilamchi sahifalarda vertikal bo'shliqlar jimgina yo'qolgan.
3. **Emoji ikonkalar** (📍📞📧, 📐⚛️💻, 🏆, ✈️📷📘…) — bosh sahifadagi maxsus SVG ikonka tiliga zid, saytning eng "arzon" ko'rinadigan qismi.
4. Bir xil ma'lumot uchun **ikki xil karta dizayni** (yutuqlar: bosh sahifa aylanma karusel vs yutuqlar sahifasi).
5. **A11y jiddiy kamchiliklar**: skip-link ishlamaydi (`<main>` yo'q), SearchModal/MobileNav dialog emas, dropdown klaviaturadan ochilmaydi, focus ring kontrasti 2.2:1.
6. **SEO bo'shliqlar**: NewsArticle/FAQPage/BreadcrumbList JSON-LD yo'q, OG `type` doim `website`, sitemap `lastModified` doim `new Date()`.
7. **Performance**: `next/image` umuman yo'q (CLS xavfi), ScrollProgress har scroll-tikida React re-render, Firestore so'rovlari `React.cache()`siz ikki marta o'qiladi.
8. **Funksional bo'shliqlar**: onlayn qabul arizasi yo'q, kontakt formada spam-himoya yo'q, galereyada lightbox yo'q, qidiruv faqat o'zbekcha va tor qamrovli, `kk.json`da ~15 tarjima qolgan.

**Strategiya — "saqlab, tugatish" (preserve & complete):** mavjud navy+amber tilini almashtirmasdan, loyihalangan-lekin-ishlamayotgan dizaynni to'liq ishga tushirish, generic AI-naqshlarni (emoji, stock rasm belgilar, bir xil grid-3) yo'qotish va funksional bo'shliqlarni yopish.

---

## 1-bosqich — Dizayn tizimi fundamenti

**Nima qilinadi:**
- `next/font/google` orqali **Geist (variable) + Geist Mono** yuklash: `latin`, `latin-ext` (qoraqalpoq ǵ/ń/ı uchun), `cyrillic` (ruscha uchun) subsetlari, `display: swap`, CSS o'zgaruvchilarga bog'lash (`--font-geist`, `--font-geist-mono`). Umumiy `src/lib/fonts.ts` moduli — `[locale]/layout.tsx` va `admin/layout.tsx` ikkalasida ishlatiladi. `admin.css`dagi render-bloklovchi Google Fonts `@import` olib tashlanadi.
- `globals.css`ga **yo'qolgan token aliaslari** qo'shish: `--space-xs…3xl → --s-*`, `--radius-sm…xl → --r-*` (legacy-alias bloki uslubida).
- Yo'qolgan **`.w-full` va `.checklist`** klasslarini aniqlash (kontakt tugmasi to'liq enli bo'ladi, admission/directions ro'yxatlari uslublanadi).
- **Focus ring kontrasti**: `:focus-visible` amber (`2.2:1`) → yorug' fonda navy, to'q fonda amber-3 (≥3:1 WCAG 1.4.11).
- **`100vh` → `100dvh`** hero'da (iOS Safari sakrashi).
- **Kontrast tuzatishlar:** footer `rgba(255,255,255,.45)` → ≥`.72`; `--ink-4` matn sifatida ishlatilgan joylarni audit qilish.
- Dark mode'da brend identiteti: `--navy → #4F4FE6` remap saqlanadi (kontrast uchun zarur), lekin about sahifadagi hardcoded indigo `rgba(99,102,241,…)` token bilan almashtiriladi.
- Tema yagona manba: inline skript `data-theme`ni o'rnatadi, `ThemeContext` uni qayta hisoblamasdan o'qiydi.

**Nega:** shriftsiz tipografika, tokensiz spacing — butun keyingi ish shu poydevorga quriladi.

**Fayllar:** `src/lib/fonts.ts` (yangi), `src/app/[locale]/layout.tsx`, `src/app/admin/layout.tsx`, `src/styles/globals.css`, `src/styles/dark-theme.css`, `src/styles/responsive.css`, `src/styles/admin.css`, `src/contexts/ThemeContext.tsx`, `src/app/[locale]/about/page.tsx`.

**Natija:** loyihalangan tipografika real ko'rinadi, spacing tizimi qayta tiklanadi, WCAG kontrast talablari bajariladi.

---

## 2-bosqich — Ikonografiya: emoji'dan yagona SVG tilga

**Nima qilinadi:**
- `src/components/ui/Icon.tsx` — yagona inline-SVG ikonka to'plami (24px, stroke 2, bosh sahifa yo'nalish kartalari uslubida): `map-pin`, `phone`, `mail`, `clock`, `globe`, `landmark`, `building`, `medal`, `trophy`, `lightbulb`, `scale`, `handshake`, `newspaper`, `image`, `question`, `users`, `download`, `send`, `telegram`, `instagram`, `facebook`, `youtube`, `whatsapp`, `share`, `check` va h.k.
- Almashtirishlar:
  - `ContactShort.tsx` (📍📞📧) va `contact/page.tsx` (📍📞📧🕐 + ✈️📷📘▶️ ijtimoiy tugmalar — Footer'dagi mavjud `social-icons.tsx` bilan birxillashtiriladi);
  - `directions/page.tsx` (📐⚛️💻🧪🧬🌍) — bosh sahifadagi bir xil 6 yo'nalish SVG'lari qayta ishlatiladi (`DirectionsGrid` ikonkalari umumiy modulga chiqariladi);
  - `about/page.tsx` qadriyatlar (🏆💡⚖️🤝) va 📜 yorliq;
  - `AchievementsCarousel.tsx` daraja belgilari (🌍🏛️🏙️🏘️) va 🏆;
  - barcha bo'sh holatlar (📰🏆🖼️❓👩‍🏫) — mos SVG.

**Nega:** emoji — eng ko'zga tashlanuvchi "AI-yasagan" belgi; maxsus SVG tili allaqachon bor, uni oxirigacha yetkazish premium ko'rinishning kaliti.

**Fayllar:** `src/components/ui/Icon.tsx` (yangi), `src/components/home/directions-icons.tsx` (umumiy modul, yangi), yuqoridagi sahifa/komponentlar, `globals.css` (`.contact-icon`/`.direction-icon`/empty-state ichida SVG o'lchov qoidalari).

**Natija:** butun saytda bitta izchil, brendga mos ikonka tili.

---

## 3-bosqich — Komponent birxillashtirish va vizual ritm

**Nima qilinadi:**
- **Yutuq kartasi yagonalashtiriladi:** `AchievementCard` (pill-badge + rangli ustki chiziq) ikkala joyda ishlatiladi; karuseldagi inline circle-medal varianti o'chiriladi; inline style'lar klasslarga ko'chadi.
- **Yangilik kartasi yagonalashtiriladi:** `LatestNews` ichidagi maxsus renderni `NewsCard`ga o'tkazish; **qo'sh strelka bug'i** (`{read_more} →` + CSS `::after` strelkasi) tuzatiladi.
- **Ghost-button tuzatish:** yorug' sahifadagi `btn-ghost` (news/[id] "orqaga") uchun light-surface tertiary variant (`.btn-ghost-light` yoki kontekstga mos `btn-secondary`).
- **Grid-3 monotoniyasini buzish:** bosh sahifa "About short" bo'limiga chuqurlik (bordered feature-panel + amber mesh-aksent), admission yuklab-olish bloki panelga aylantiriladi; yutuqlar statistikasi bento-ritmda.
- Hero h1 force-uppercase → sentence case (editorial xotirjamlik), `text-wrap: balance`.
- Sarlavhalarga `text-wrap: balance`, uzun matnlarga `max-width: 65ch` intizomi.
- `admission` uchun mavjud-lekin-ishlatilmagan `.stepper` komponenti qo'llanadi yoki timeline saqlanib CSS'i mustahkamlanadi (bittasi tanlanadi, ikkinchisi o'chiriladi).
- About sahifadagi **Unsplash stock rasmlari** (soxta rahbariyat portretlari!) olib tashlanadi — rahbariyat bo'limi haqiqiy kontent kelguncha yashiriladi, virtual tur neytral brend-plitkalarga almashtiriladi; directions hero Unsplash rasmi ham xuddi shunday.
- Admissiondagi o'lik `href="#"` broshyura tugmasi olib tashlanadi (kontent tayyor bo'lganda qaytariladi).

**Nega:** bitta ma'lumot turi = bitta vizual til; soxta xodim fotolari ishonchni buzadi; takroriy grid-3 — generic naqsh.

**Fayllar:** `src/components/achievements/AchievementCard.tsx`, `src/components/home/AchievementsCarousel.tsx`, `src/components/home/LatestNews.tsx`, `src/components/news/NewsCard.tsx`, `src/components/home/DirectionsGrid.tsx`, `src/app/[locale]/{about,admission,directions,achievements,news/[id]}/page.tsx`, `globals.css`.

**Natija:** izchil karta tizimi, chuqurlikka ega bo'limlar, halol kontent.

---

## 4-bosqich — Accessibility (WCAG 2.2 AA)

**Nima qilinadi:**
- `SiteShell`da `<main id="main-content" tabIndex={-1}>` — skip-link ishlaydi, `main` landmark paydo bo'ladi.
- Kontakt xarita iframe'iga lokallashtirilgan `title`.
- **SearchModal to'liq dialog:** `role="dialog"` + `aria-modal` + label, focus trap + yopilganda fokus qaytarish, natijalar `listbox`/`option` + `aria-activedescendant`; barcha satrlar i18n'ga ko'chadi (4 til).
- **MobileNav:** hamburger `aria-expanded` real holatga bog'lanadi, `role="dialog"` + `aria-label`, focus trap, yopiq holatda fokuslanmaydi (`inert`/`visibility`).
- **NavbarDropdown:** klaviaturadan ochish (focus/Enter), real `aria-expanded`; noto'g'ri `role="menu"/menuitem"` olib tashlanib disclosure-nav semantikasi qo'llanadi.
- **LanguageSwitcher:** `<a href="#">` → `<button>`, har bir tilga `lang` atributi.
- **ThemeToggle** `aria-pressed` + lokallashtirilgan label; `BackToTop`, `SearchTrigger` labellari i18n.
- Kontakt sahifa sarlavha iyerarxiyasi (h4 → h3, tartib tuzatiladi).
- `StatsCounter` `prefers-reduced-motion`da darhol yakuniy son ko'rsatadi.
- `NewsShareButtons` "nusxalandi" holati `aria-live` bilan e'lon qilinadi.
- ContactForm: xato bo'lganda `aria-invalid` + `aria-describedby` maydonlarga ulanadi.

**Nega:** davlat-ahamiyatli ta'lim sayti uchun a11y — huquqiy va axloqiy shart; hozirgi 4 ta critical WCAG A buzilishi bor.

**Fayllar:** `src/components/layout/{SiteShell,Navbar,MobileNav,NavbarDropdown}.tsx`, `src/components/ui/{SearchModal,SearchTrigger,LanguageSwitcher,ThemeToggle}.tsx`, `src/components/layout/BackToTop.tsx`, `src/components/home/StatsCounter.tsx`, `src/components/news/NewsShareButtons.tsx`, `src/components/contact/ContactForm.tsx`, `src/app/[locale]/contact/page.tsx`, `src/messages/{uz,ru,kk,en}.json`.

**Natija:** WCAG 2.2 AA darajadagi klaviatura/skrinrider qamrovi.

---

## 5-bosqich — SEO

**Nima qilinadi:**
- `news/[id]`: **NewsArticle JSON-LD** (headline, image, datePublished/Modified, publisher) + **BreadcrumbList JSON-LD**; OG `type:'article'` + `publishedTime`; `generateMetadata` xatoda `{}` o'rniga minimal metadata qaytaradi.
- `faq`: **FAQPage JSON-LD**.
- `buildPageMetadata`: `title.template` (« … — Al-Xorazmiy maktabi» suffiksi), OG rasmga `width/height/alt`.
- `sitemap.ts`: yangiliklar uchun `lastModified` real `updatedAt`dan.
- `robots.ts`: eskirgan `host` maydoni olib tashlanadi.

**Nega:** yangiliklar — saytning asosiy dinamik kontenti; rich-result huquqini yo'qotmaslik kerak.

**Fayllar:** `src/lib/seo.ts`, `src/app/[locale]/news/[id]/page.tsx`, `src/app/[locale]/faq/page.tsx`, `src/app/sitemap.ts`, `src/app/robots.ts`.

**Natija:** to'liq structured data qamrovi, izchil title tizimi.

---

## 6-bosqich — Performance

**Nima qilinadi:**
- **`next/image` migratsiyasi** (mavjud `remotePatterns` ishga tushadi): `NewsCard`, `LatestNews`, `GalleryGrid`, `TeacherCard`, `news/[id]` hero (aspect-ratio bilan — CLS 0), `Navbar` logo. `sizes` strategiyasi + birinchi kartalarga `priority`. 15 ta `eslint-disable no-img-element` o'chadi.
- **`ScrollProgress`**: state o'rniga rAF-throttle + to'g'ridan-to'g'ri DOM yozish (har sahifadagi INP yaxshilanadi).
- **`React.cache()`** `server-queries.ts` funksiyalariga — `generateMetadata` + sahifa dublikat o'qishlari yo'qoladi.
- **news/[id]**: `getNewsById` + related-news `Promise.all`da parallel.
- **`HeroParticles`**: DPR ≤1.5 cap, zarra soni kamaytiriladi (72→48 desktop).
- **`SearchModal`**: kolleksiya o'qishlari `sessionStorage` keshi (5 daqiqa TTL).
- Admin shriftlari 1-bosqichdagi `next/font`ga o'tadi (render-bloklovchi `@import` yo'qoladi).

**Nega:** CLS/LCP/INP — Core Web Vitals; ISR arxitekturasi yaxshi, lekin rasm/scroll/font qatlamlarida konkret yo'qotishlar bor.

**Fayllar:** yuqoridagi komponentlar, `src/lib/firebase/server-queries.ts`, `src/lib/imagekit.ts` (srcset yordamchisi kerak bo'lsa), `src/styles/admin.css`.

**Natija:** CLS→~0, kam Firestore o'qish, silliq scroll.

---

## 7-bosqich — Funksionallik

**Nima qilinadi:**
1. **Onlayn qabul arizasi** (eng qimmatli yangi funksiya): `admission` sahifasiga `ApplicationForm` (ism, telefon, sinf, xabar; honeypot; 4 tilda) + `/api/apply` route — validatsiya, rate-limit, Resend orqali email + `firebase-admin` orqali `applications` kolleksiyasiga saqlash (best-effort). Kontakt forma naqshlari qayta ishlatiladi.
2. **Spam-himoya**: `ContactForm` + `/api/send-message`ga honeypot maydoni + IP bo'yicha in-memory rate-limit (sliding window). Sozlanmagan Resend'da yolg'on «yuborildi» o'rniga halol xato (503).
3. **Galereya lightbox:** sahifa ichida modal (prev/next, Escape, klaviatura, focus trap, reduced-motion) — yangi tabda ochiladigan xom rasm o'rniga.
4. **Qidiruv:** barcha satrlar i18n (4 til), FAQ ham indeksga qo'shiladi, `Enter` SPA-navigatsiya (router.push).
5. **Share tugmalari:** URL hydration-poygasi tuzatiladi (props orqali server URL), Web Share API + WhatsApp qo'shiladi.
6. **`kk.json`** ~15 o'zbekcha qolgan tarjima qoraqalpoqchaga o'giriladi.
7. **FAQ** `maxHeight:1000` cheklovi olib tashlanadi (grid-template-rows animatsiyasi yoki scrollHeight).
8. **Yangiliklar "yana yuklash"**: 50 ta cheksiz ro'yxat o'rniga birinchi 12 + klient tomonda cursor-paginatsiya (client SDK allaqachon public o'qiydi).

**Nega:** maktab sayti uchun qabul arizasi — asosiy konversiya nuqtasi; spam-himoyasiz ochiq email endpoint — xavf.

**Fayllar:** `src/components/admission/ApplicationForm.tsx` (yangi), `src/app/api/apply/route.ts` (yangi), `src/app/api/send-message/route.ts`, `src/lib/rate-limit.ts` (yangi), `src/components/contact/ContactForm.tsx`, `src/components/gallery/GalleryGrid.tsx`, `src/components/ui/SearchModal.tsx`, `src/components/news/NewsShareButtons.tsx`, `src/components/news/NewsLoadMore.tsx` (yangi), `src/app/[locale]/{admission,news,gallery,faq}/page.tsx`, `src/components/faq/FaqAccordion.tsx`, `src/messages/*.json`.

**Natija:** to'liq qabul oqimi, himoyalangan formalar, zamonaviy galereya/qidiruv/ulashish UX.

---

## 8-bosqich — Kod gigienasi

**Nima qilinadi:**
- `AuthGuard.tsx` hardcoded hex (`#F8FAFC`, `#64748B`) → tokenlar (dark mode tuzatiladi).
- `NewsCard`/`TeacherCard`/`AchievementCard` va sahifalardagi yirik inline-style bloklari token-klasslarga ko'chadi (public qamrov; admin keyingi iteratsiyaga).
- `tsconfig.json` eskirgan `exclude` (`js`, `admin`, `api`) tozalanadi; `README.md` «Next.js 14» → «Next.js 15», yangi funksiyalar hujjatlanadi.
- Admin dashboard: to'liq kolleksiyani o'qib `.length` o'rniga `getCountFromServer` aggregate.
- Admin teachers kategoriya filtri (`!==` exact match bug'i) tuzatiladi.

**Nega:** dark mode buzilishlari va o'lik konfiguratsiya keyingi dizayn ishini sekinlashtiradi.

**Fayllar:** `src/components/admin/AuthGuard.tsx`, karta komponentlari, `tsconfig.json`, `README.md`, `src/app/admin/page.tsx`, `src/app/admin/teachers/page.tsx`.

---

## 9-bosqich — Tekshiruv va topshirish

- `npm run typecheck` + `npm run lint` + `npm run build` — nol xato.
- Har sahifaning build chiqishida mavjudligi (ISR/SSG saqlangani) tekshiriladi.
- `redesign/full-improvement` branch'ida mantiqiy commitlar (har bosqich ≈ 1 commit), so'ng `main`ga o'zbek tilidagi PR.

## Keyingi iteratsiyaga qoldirilganlar (ataylab)

- **Server-side admin auth** (Firebase session cookie + middleware) — infratuzilma/env o'zgarishini talab qiladi, alohida xavfsizlik PR'i sifatida qilinishi kerak; `firestore.rules` repoda yo'qligi ham hujjatlandi.
- Admin CRUD dedup (~1570 qator) — katta refaktor, vizual PR bilan aralashtirmaslik kerak.
- Tadbirlar kalendari, RSS, ImageKit orphan-fayl tozalash — funksional backlog.
