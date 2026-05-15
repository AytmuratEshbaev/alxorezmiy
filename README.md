# alxorezmiy.uz

Official website of Al-Xorezmiy school. Multilingual (uz / ru / kk / en) Next.js 14 app with a Firebase-backed admin panel.

## Tech stack

- **Next.js 14** (App Router, ISR, RSC)
- **TypeScript** (strict)
- **next-intl** — i18n routing + translations
- **Firebase** — Firestore (content), Auth (admin), Admin SDK (server)
- **ImageKit** — image hosting + transformations
- **Resend** — transactional email (contact form)
- **next-pwa** — service worker + offline cache
- **ESLint + Prettier**

## Project layout

```
src/
  app/                 App Router (locale + admin segments, sitemap.ts, robots.ts, api/*)
  components/          UI primitives + page sections
  contexts/            Theme + Auth providers
  lib/                 Firebase clients, ImageKit, utilities
  messages/            i18n translations (uz / ru / kk / en)
  styles/              Global CSS + theme variables
public/                Static assets, PWA manifest, generated sw.js
docs/                  Migration spec, plan, QA report
```

## Dev commands

```bash
npm install
npm run dev          # http://localhost:3000
npm run typecheck    # tsc --noEmit
npm run lint         # next lint
npm run build        # production build
npm run start        # serve production build
```

## Environment

Copy `.env.local.example` to `.env.local` and fill in:

- `NEXT_PUBLIC_FIREBASE_*` — Firebase client config
- `FIREBASE_ADMIN_*` — Firebase Admin SDK service account
- `IMAGEKIT_PUBLIC_KEY`, `IMAGEKIT_PRIVATE_KEY`, `IMAGEKIT_URL_ENDPOINT`
- `RESEND_API_KEY`, `CONTACT_EMAIL_TO`
- `NEXT_PUBLIC_SITE_URL`

See `.env.local.example` for the full list.

## Deploy (Vercel)

1. Connect this repo to a Vercel project.
2. Add every variable from `.env.local.example` in **Project Settings → Environment Variables** (Production + Preview).
3. Vercel auto-detects Next.js — no `vercel.json` needed (security headers are set in `next.config.mjs`).
4. Trigger deploy. ISR + sitemap will populate from Firestore on first request.

## Routes

- Public: `/[locale]/{,about,admission,contact,directions,faq,gallery,teachers,achievements,news,news/[id]}` — SSG / ISR.
- Admin: `/admin/{login,...}` — dynamic, Firebase Auth guarded.
- API: `/api/imagekit-auth`, `/api/send-message`.
- Meta: `/sitemap.xml`, `/robots.txt`, `/manifest.json`.

Legacy `/news/abc` URLs redirect to `/uz/news/abc` via `next.config.mjs`.
