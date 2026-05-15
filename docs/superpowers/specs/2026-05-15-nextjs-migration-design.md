# Next.js Migration — Design Spec

**Date:** 2026-05-15
**Project:** alxorezmiy.uz (Muhammad al-Xorazmiy maktabi — Nukus filiali)
**Source:** Vanilla JS (ES Modules) + Firebase + Vercel
**Target:** Next.js 15 (App Router) + TypeScript + Firebase + Vercel

---

## 1. Goals

1. SEO ni yaxshilash — news/teachers/achievements sahifalari server-rendered bo'ladi (hozir CSR).
2. Type safety — barcha kod TypeScript ga ko'chiriladi (strict mode).
3. Komponent qayta ishlatilishi — `site-shell.js` template-string DRY pattern haqiqiy React komponentlariga aylanadi.
4. Performance — SSG/ISR bilan tezroq TTFB, automatic code-splitting.
5. Future-proofing — sodda maintenance, zamonaviy DX, kelajak feature qo'shish oson.

## 2. Non-Goals

- Dizayn (rang, layout, typography) o'zgarishi — pixel-perfect saqlanadi.
- Tailwind ga ko'chish — mavjud `style.css`, `dark-theme.css`, `responsive.css` saqlanadi.
- Firestore schema o'zgarishi.
- Admin panel UX qayta dizayni.
- I18n string'larni qayta yozish.

## 3. Tech Stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Framework | **Next.js 15.x** (App Router) | RSC, streaming, route handlers |
| Language | **TypeScript 5.x** (strict) | `tsconfig.json` strict, no implicit any |
| i18n | **next-intl** | App Router native, type-safe messages |
| Styling | **Global CSS** (mavjud 3 fayl) | `app/[locale]/layout.tsx` da import |
| Firebase Client | `firebase` v10+ (npm package) | CDN dan npm ga ko'chiriladi |
| Firebase Server | `firebase-admin` v12+ | SSG/ISR data fetching |
| PWA | `@ducanh2912/next-pwa` | Workbox-based |
| Linting | ESLint (next config) + Prettier | Standart |
| Package manager | npm | Existing — o'zgarishsiz |
| Hosting | Vercel | O'zgarishsiz |

## 4. URL Structure

- `/uz/...`, `/ru/...`, `/kk/...`, `/en/...` — barcha locale'lar prefix bilan.
- `/` requesti → `middleware.ts` `/uz/` ga redirect qiladi (default locale).
- News detail: `/uz/news/[id]` (slug emas, id sifatida saqlanadi — backward compat eski URL bilan).
- Admin: `/admin/...` — i18n holatdan tashqari (faqat o'zbek/rus admin'lar uchun).

## 5. Project Structure

```
src/
├─ app/
│  ├─ [locale]/
│  │  ├─ layout.tsx              # Locale-scoped root, providers, navbar, footer
│  │  ├─ page.tsx                # Home (index.html)
│  │  ├─ about/page.tsx
│  │  ├─ admission/page.tsx
│  │  ├─ achievements/page.tsx
│  │  ├─ contact/page.tsx
│  │  ├─ directions/page.tsx
│  │  ├─ faq/page.tsx
│  │  ├─ gallery/page.tsx
│  │  ├─ teachers/page.tsx
│  │  ├─ news/
│  │  │  ├─ page.tsx             # News list (ISR 60s)
│  │  │  └─ [id]/page.tsx        # News detail (ISR 60s + generateStaticParams)
│  │  └─ not-found.tsx           # 404 (per-locale)
│  ├─ admin/
│  │  ├─ layout.tsx              # Auth guard wrapper
│  │  ├─ page.tsx                # Dashboard
│  │  ├─ login/page.tsx
│  │  ├─ news/page.tsx
│  │  ├─ teachers/page.tsx
│  │  ├─ gallery/page.tsx
│  │  ├─ faq/page.tsx
│  │  ├─ olympiad/page.tsx
│  │  ├─ messages/page.tsx
│  │  ├─ settings/page.tsx
│  │  └─ users/page.tsx
│  ├─ api/
│  │  ├─ imagekit-auth/route.ts
│  │  └─ send-message/route.ts
│  ├─ sitemap.ts                 # Dynamic — Firebase'dan news ID'larni oladi
│  ├─ robots.ts
│  └─ layout.tsx                 # Root layout (faqat <html>, <body>)
├─ components/
│  ├─ layout/
│  │  ├─ Navbar.tsx
│  │  ├─ NavbarDropdown.tsx
│  │  ├─ MobileNav.tsx
│  │  ├─ Footer.tsx
│  │  ├─ BackToTop.tsx
│  │  └─ ScrollProgress.tsx
│  ├─ ui/
│  │  ├─ LanguageSwitcher.tsx
│  │  ├─ ThemeToggle.tsx
│  │  ├─ SearchModal.tsx
│  │  ├─ Toast.tsx
│  │  ├─ Modal.tsx
│  │  └─ Accordion.tsx
│  ├─ home/
│  │  ├─ Hero.tsx
│  │  ├─ HeroParticles.tsx       # 'use client'
│  │  ├─ StatsCounter.tsx        # 'use client', IntersectionObserver
│  │  ├─ DirectionsGrid.tsx
│  │  ├─ LatestNews.tsx
│  │  └─ AchievementsCarousel.tsx
│  ├─ news/
│  │  ├─ NewsCard.tsx
│  │  └─ NewsList.tsx
│  ├─ teachers/
│  │  └─ TeacherCard.tsx
│  └─ admin/
│     ├─ AdminSidebar.tsx
│     ├─ AdminHeader.tsx
│     ├─ ConfirmDialog.tsx
│     └─ ...
├─ lib/
│  ├─ firebase/
│  │  ├─ client.ts               # initializeApp, getAuth, getFirestore
│  │  ├─ admin.ts                # firebase-admin (server-only)
│  │  └─ firestore.ts            # Helper: getDocuments, getDocument, subscribe
│  ├─ imagekit.ts                # transformImage, uploadImage
│  ├─ utils.ts                   # escapeHtml, formatDate, classNames
│  └─ constants.ts
├─ contexts/
│  ├─ ThemeContext.tsx           # 'use client'
│  └─ FirebaseContext.tsx        # 'use client'
├─ i18n/
│  ├─ config.ts                  # locales, defaultLocale
│  ├─ request.ts                 # getRequestConfig (next-intl)
│  └─ routing.ts                 # createSharedPathnamesNavigation
├─ messages/
│  ├─ uz.json                    # lang/uz.json'dan migratsiya
│  ├─ ru.json
│  ├─ kk.json
│  └─ en.json
├─ types/
│  ├─ firebase.ts                # News, Teacher, Settings, FAQ, Olympiad, etc.
│  └─ index.ts
├─ styles/
│  ├─ globals.css                # css/style.css'dan migratsiya
│  ├─ dark-theme.css
│  └─ responsive.css
└─ middleware.ts                 # next-intl middleware + admin auth check

public/
├─ assets/
│  ├─ icons/favicon.svg
│  └─ images/logo.webp, hero.webp
├─ manifest.json
└─ robots.txt (eski — fallback)

next.config.mjs
tsconfig.json
.eslintrc.json
.prettierrc
.env.local.example
package.json
```

## 6. Rendering Strategy

| Route | Mode | Revalidate |
|-------|------|-----------|
| `/[locale]` (home) | ISR | 300s (latest news + olympiad) |
| `/[locale]/about` | SSG + Firebase settings | 3600s |
| `/[locale]/admission` | SSG | 3600s |
| `/[locale]/contact` | SSG + Firebase settings | 3600s |
| `/[locale]/directions` | SSG | 3600s |
| `/[locale]/faq` | ISR (Firebase FAQ) | 300s |
| `/[locale]/gallery` | ISR (Firebase gallery) | 300s |
| `/[locale]/teachers` | ISR | 300s |
| `/[locale]/achievements` | ISR | 300s |
| `/[locale]/news` | ISR | 60s |
| `/[locale]/news/[id]` | ISR + `generateStaticParams` | 60s |
| `/admin/*` | CSR (`'use client'` layout) | — |

Server-side data fetching `firebase-admin` SDK orqali — secure, server-only.

## 7. i18n Strategy

- **next-intl** kutubxonasi:
  - `src/i18n/routing.ts`: `defineRouting({ locales: ['uz','ru','kk','en'], defaultLocale: 'uz' })`
  - `src/middleware.ts`: locale detection + redirect
  - `src/i18n/request.ts`: `getRequestConfig` — messages load qiladi
- Komponentlarda: `import { useTranslations } from 'next-intl'` → `const t = useTranslations('hero'); t('title')`
- Server Component'larda: `getTranslations('hero')`
- Firebase'dagi multi-lang fieldlar (`title_uz`, `title_ru`, ...) — `getLocalizedField(item, 'title', locale)` helper bilan.
- Locale switcher: `Link` komponenti next-intl `useRouter` bilan locale almashtiradi (URL'da locale segment).
- `localStorage` ishlatilmaydi — locale URL'dan kelib chiqadi.

## 8. Theme Strategy

- `ThemeProvider` (Context) → `data-theme="dark"` attribute html'ga qo'yiladi.
- LocalStorage'da saqlanadi (`theme` key).
- `prefers-color-scheme` ham hisobga olinadi.
- SSR: theme aniqlanmaguncha "no-flash" script (cookie/localStorage'dan o'qib `<html>` ga inject qiladi) `<head>` da inline ishlaydi.

## 9. Firebase Architecture

### Client SDK (`lib/firebase/client.ts`)
- Faqat client komponentlarida ishlatiladi (admin panel, real-time subscriptions, auth).
- `'use client'` directive bilan ishlatiladi.

### Admin SDK (`lib/firebase/admin.ts`)
- Server-only. Service account via Vercel env vars:
  - `FIREBASE_PROJECT_ID`
  - `FIREBASE_CLIENT_EMAIL`
  - `FIREBASE_PRIVATE_KEY`
- SSG/ISR page'lar `await getNewsList()` kabi server-side helper'larni chaqiradi.

### Helpers (`lib/firebase/firestore.ts`)
- Server: `getNewsList()`, `getNewsById(id)`, `getTeachers()`, `getSettings()`, `getFaq()`, `getOlympiad()`, `getGallery()`
- Client (admin panel): `subscribeCollection`, `addDocument`, `updateDocument`, `deleteDocument` (mavjud helpers'ni TS port'i).

## 10. API Routes

### `app/api/imagekit-auth/route.ts`
- GET handler, `node:crypto` HMAC signature.
- CORS: production'da `https://alxorezmiy.uz` ga cheklash. Dev'da `*`.
- Env: `IMAGEKIT_PRIVATE_KEY`.

### `app/api/send-message/route.ts`
- POST handler, Resend API.
- CORS: production domain only.
- Validation: name (max 100), email (regex), subject (max 200), message (max 5000).
- Optional: rate limiting (Vercel Edge Config yoki Upstash) — kelajakda.
- Env: `RESEND_API_KEY`, `ADMIN_EMAIL`.

## 11. PWA

- `@ducanh2912/next-pwa` `next.config.mjs` da:
  - `disable: process.env.NODE_ENV === 'development'`
  - `register: true`, `skipWaiting: true`
  - Custom runtime caching: static assets (cache-first), API (network-only), pages (network-first).
- `public/manifest.json` — mavjud manifest'ni ko'chirish.
- Eski `sw.js` o'chiriladi (Workbox generatsiya qiladi).

## 12. Image Strategy

- `next/image` Component layout uchun (auto srcset, lazy, blur placeholder).
- ImageKit URL'lari `transformImage()` helper bilan — Next/Image ga `loader` props beriladi.
- `next.config.mjs` `images.remotePatterns`: `ik.imagekit.io`, `images.unsplash.com`.

## 13. Security Headers

`next.config.mjs` `headers()` async function — `vercel.json`'dagi qoidalar bilan:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- Cache-Control rules CSS/JS/assets uchun.
- Yangi: CSP header (production-da Firebase, ImageKit, Resend, Vercel insights domainlariga ruxsat).

## 14. Sitemap & SEO

### `app/sitemap.ts`
Server function — barcha static route'lar + news ID'lari (Firebase Admin SDK).

### `app/robots.ts`
- `/admin/*` disallow.

### Per-page Metadata API
- `generateMetadata` har sahifa uchun:
  - title (i18n key'dan)
  - description
  - OpenGraph (image, type, url, locale)
  - Twitter card
  - canonical (locale-aware, `alternates.languages`)
- JSON-LD `<script type="application/ld+json">` SSR — `EducationalOrganization` schema.

## 15. Migration Strategy

### Approach: Side-by-side branch
- Yangi loyiha alohida papkada (`next-app/`) yaratiladi.
- Mavjud kod butun saqlanadi — har faza commit qilinadi.
- Tayyor bo'lganda repo root'da Next.js loyiha asosiyga aylanadi (eski `*.html`, `js/`, `css/`, `lang/`, `admin/` o'chiriladi).

### Cutover
1. Vercel preview deploy (`next-migration` branch) test qilinadi.
2. Lighthouse audit + smoke test (har route).
3. Production domain `main` branch'ga yangi loyiha merge qilinganda yangilanadi.
4. Eski URL'lar (`/news/abc`) middleware'da `next-intl` orqali avtomatik locale prefix bilan redirect.

## 16. Phases & Multi-Agent Plan

| # | Phase | Output | Agent | Deps |
|---|-------|--------|-------|------|
| 1 | Scaffold | `package.json`, `next.config.mjs`, `tsconfig`, `eslint`, `prettier`, env, root `app/layout.tsx` | scaffold-agent | — |
| 2 | Foundation | Firebase client/admin, types, lib/utils | foundation-agent | 1 |
| 3 | i18n + Theme | next-intl config, middleware, messages migrated, ThemeContext | i18n-agent | 1, 2 |
| 4 | Layout components | Navbar, Footer, MobileNav, SearchModal, BackToTop, LanguageSwitcher, ThemeToggle | layout-agent | 3 |
| 5 | Static pages | home, about, admission, contact, directions, faq, gallery | pages-public-agent | 4 |
| 6 | Dynamic pages | news list, news/[id], teachers, achievements | pages-dynamic-agent | 4 (parallel 5) |
| 7 | API routes | imagekit-auth, send-message + CORS | api-agent | 2 (parallel from 4) |
| 8 | Admin panel | Auth layout + 9 admin pages | admin-agent | 2, 3 (parallel from 4) |
| 9 | PWA + SEO | next-pwa, manifest, sitemap, robots, metadata | pwa-seo-agent | 5, 6 |
| 10 | QA + Deploy | Build, smoke test, Lighthouse, Vercel deploy | tester-agent | 5–9 |

**Critical path:** 1 → 2 → 3 → 4 → 5/6 (parallel) → 9 → 10. **~6 session.**
**Parallelizable from end of phase 4:** 5, 6, 7, 8 (4 ta agent bir vaqtda).

## 17. Acceptance Criteria

- [ ] `npm run build` xatosiz.
- [ ] `npm run dev` lokal'da har 4 locale'da har sahifa ochiladi.
- [ ] Lighthouse Performance >=90, SEO >=95, Accessibility >=95 (home + 3 random page).
- [ ] Cmd+K search ishlaydi (news + teachers).
- [ ] Theme toggle ishlaydi, page navigation'da yo'qolmaydi (no flash).
- [ ] Language switcher URL'ni almashtiradi, content yangilanadi.
- [ ] Admin login ishlaydi, auth guard noto'g'ri foydalanuvchini login'ga otadi.
- [ ] Image upload (admin) → ImageKit ishlaydi.
- [ ] Contact form → Resend orqali admin email keladi.
- [ ] Service Worker production'da ishlaydi, offline'da cached pages ochiladi.
- [ ] Sitemap dinamik (Firebase news ID'lari bor).
- [ ] Eski URL'lar (`/news/abc`) yangi URL'larga redirect (`/uz/news/abc`).

## 18. Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Firebase Admin SDK Vercel'da credential muammosi | `.env.example` aniq, deploy oldidan dry-run smoke test |
| ISR cache stale data | Admin actions'da `revalidatePath` chaqiriladi |
| CSS variable conflicts (theme switch) | Eski `data-theme` attribute strategy saqlanadi |
| next-intl + dynamic routes interaction | `generateStaticParams` har locale uchun ID list qaytaradi |
| PWA SW eski deployment'lardan cache qoldirib ketishi | Workbox `clientsClaim: true`, `skipWaiting: true` |
| Eski public links (`/news/abc`) buzilishi | `next.config.mjs` `redirects()` da preserved |

## 19. Out-of-Scope (kelajakda)

- News slug-based URL'lar (`/news/respublika-olimpiadasi-natijalari`).
- Comment system.
- Newsletter integration.
- Analytics dashboard (admin).
- Rate limiting (Resend API).
- Multi-admin role system.

## 20. References

- Eski kod: `js/`, `admin/js/`, `css/`, `lang/`, `*.html`, `api/`
- Existing vercel.json — security headers ko'chiriladi
- Existing manifest.json — `public/` ga ko'chiriladi
- Firebase config — env var'larga ko'chiriladi (mavjud API key public, lekin practice yaxshilanadi)
