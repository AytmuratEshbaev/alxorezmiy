# Next.js Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate alxorezmiy.uz from vanilla JS + static HTML to Next.js 15 App Router with TypeScript, while preserving design, Firebase backend, i18n, PWA, and admin panel.

**Architecture:** In-place migration on `claude/sad-cray-a2f0f3` branch. Next.js scaffolds at repo root; old files coexist until each phase's equivalent ships, then deleted in the same commit. Server-side rendering (SSG/ISR) via `firebase-admin` SDK for SEO-critical content; client SDK for admin panel and real-time features. `next-intl` for i18n with `[locale]` segment routing.

**Tech Stack:** Next.js 15, React 18, TypeScript 5 (strict), next-intl, firebase + firebase-admin, @ducanh2912/next-pwa, ESLint, Prettier, Vercel.

**Spec:** [docs/superpowers/specs/2026-05-15-nextjs-migration-design.md](../specs/2026-05-15-nextjs-migration-design.md)

**Verification model:** UI migration — TDD is not natural fit. Each task verifies via:
1. `npm run build` succeeds
2. `npm run dev` route loads without console errors
3. Visual parity against old HTML (screenshot diff acceptable)
4. Type-check passes

---

## Phase 1 — Scaffold

**Agent:** scaffold-agent (general-purpose)
**Deps:** none
**Output:** Runnable empty Next.js 15 app with TS, ESLint, Prettier, all configs.

### Task 1.1: Initialize package.json

**Files:**
- Modify: `package.json` (replace existing)

- [ ] **Step 1: Rewrite package.json**

```json
{
  "name": "alxorezmiy-school",
  "version": "2.0.0",
  "private": true,
  "description": "Muhammad al-Xorazmiy ixtisoslashtirilgan maktabi — Nukus filiali",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "format": "prettier --write \"**/*.{ts,tsx,js,json,css,md}\""
  },
  "dependencies": {
    "next": "^15.0.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "firebase": "^10.13.0",
    "firebase-admin": "^12.4.0",
    "next-intl": "^3.20.0",
    "@ducanh2912/next-pwa": "^10.2.9"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "typescript": "^5.6.0",
    "eslint": "^8.57.0",
    "eslint-config-next": "^15.0.0",
    "prettier": "^3.3.0"
  },
  "engines": { "node": ">=18.17" }
}
```

- [ ] **Step 2: Install dependencies**

Run: `npm install`
Expected: `node_modules/` created, lockfile generated, no errors.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "Phase 1.1: replace package.json with Next.js stack"
```

### Task 1.2: TypeScript config

**Files:**
- Create: `tsconfig.json`
- Create: `next-env.d.ts` (auto-generated, just track it)

- [ ] **Step 1: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@/components/*": ["src/components/*"],
      "@/lib/*": ["src/lib/*"],
      "@/types/*": ["src/types/*"],
      "@/messages/*": ["src/messages/*"]
    }
  },
  "include": ["next-env.d.ts", "src/**/*", ".next/types/**/*.ts"],
  "exclude": ["node_modules", "js", "admin", "api"]
}
```

- [ ] **Step 2: Verify typecheck runs**

Run: `npm run typecheck`
Expected: No errors (no source files yet).

### Task 1.3: Next.js config

**Files:**
- Create: `next.config.mjs`

- [ ] **Step 1: Create next.config.mjs (without PWA yet — added in Phase 9)**

```js
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'ik.imagekit.io' },
      { protocol: 'https', hostname: 'images.unsplash.com' }
    ]
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' }
        ]
      }
    ];
  },
  async redirects() {
    return [
      // Legacy: /news/abc → /uz/news/abc
      { source: '/news/:id', destination: '/uz/news/:id', permanent: true }
    ];
  }
};

export default withNextIntl(nextConfig);
```

### Task 1.4: ESLint + Prettier

**Files:**
- Create: `.eslintrc.json`
- Create: `.prettierrc.json`
- Create: `.prettierignore`

- [ ] **Step 1: ESLint config**

```json
{
  "extends": ["next/core-web-vitals"],
  "rules": {
    "@next/next/no-img-element": "warn"
  }
}
```

- [ ] **Step 2: Prettier config**

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "es5",
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false
}
```

- [ ] **Step 3: Prettier ignore**

```
.next
node_modules
package-lock.json
js
admin
css
lang
api
*.html
sw.js
```

### Task 1.5: Root layout + minimal page

**Files:**
- Create: `src/app/layout.tsx`
- Create: `src/app/[locale]/layout.tsx` (placeholder, replaced in Phase 3)
- Create: `src/app/[locale]/page.tsx` (placeholder)

- [ ] **Step 1: Root layout (minimal — locale layout will handle most)**

`src/app/layout.tsx`:
```tsx
import type { ReactNode } from 'react';

export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
```

- [ ] **Step 2: Locale layout placeholder**

`src/app/[locale]/layout.tsx`:
```tsx
import type { ReactNode } from 'react';

export default function LocaleLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="uz">
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 3: Home placeholder**

`src/app/[locale]/page.tsx`:
```tsx
export default function HomePage() {
  return <main>Al-Xorazmiy — Next.js migration in progress</main>;
}
```

### Task 1.6: Environment template

**Files:**
- Create: `.env.local.example`
- Modify: `.gitignore` (append)

- [ ] **Step 1: .env.local.example**

```bash
# Firebase Client (public — exposed to browser)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=

# Firebase Admin (server-only)
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# ImageKit
NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY=
NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT=
IMAGEKIT_PRIVATE_KEY=

# Resend
RESEND_API_KEY=
ADMIN_EMAIL=

# CORS allowlist
NEXT_PUBLIC_SITE_URL=https://alxorezmiy.uz
```

- [ ] **Step 2: Append to .gitignore**

```
# next.js
.next/
out/
.env*.local
next-env.d.ts
```

### Task 1.7: Verify scaffold

- [ ] **Step 1: Build**

Run: `npm run build`
Expected: Build succeeds, route `/[locale]` registered.

- [ ] **Step 2: Dev server smoke**

Run: `npm run dev` then `curl http://localhost:3000/uz`
Expected: HTML response with "Al-Xorazmiy — Next.js migration in progress".

- [ ] **Step 3: Commit Phase 1**

```bash
git add tsconfig.json next.config.mjs .eslintrc.json .prettierrc.json .prettierignore .env.local.example .gitignore src/
git commit -m "Phase 1: Next.js 15 + TypeScript scaffold (configs, root layout, placeholders)"
```

---

## Phase 2 — Foundation (lib + types)

**Agent:** foundation-agent
**Deps:** Phase 1
**Output:** Firebase client/admin SDKs, types, utility helpers.

### Task 2.1: Type definitions

**Files:**
- Create: `src/types/firebase.ts`
- Create: `src/types/index.ts`

- [ ] **Step 1: Firebase entity types**

`src/types/firebase.ts`:
```ts
export type Locale = 'uz' | 'ru' | 'kk' | 'en';

export interface LocalizedFields {
  [key: `${string}_${Locale}`]: string | undefined;
}

export interface News extends LocalizedFields {
  id: string;
  title_uz: string;
  title_ru?: string;
  title_kk?: string;
  title_en?: string;
  content_uz: string;
  content_ru?: string;
  content_kk?: string;
  content_en?: string;
  image?: string;
  category: 'events' | 'announcements' | string;
  status: 'published' | 'draft';
  createdAt: string | { toDate: () => Date };
  updatedAt?: string | { toDate: () => Date };
}

export interface Teacher extends LocalizedFields {
  id: string;
  name_uz: string;
  name_ru?: string;
  name_kk?: string;
  name_en?: string;
  subject: string;
  category: string;
  experience: number;
  photo?: string;
  order: number;
}

export interface OlympiadResult {
  id: string;
  student: string;
  subject: string;
  level: 'xalqaro' | 'respublika' | 'shahar' | 'tuman' | string;
  place: number;
  olympiad_name?: string;
  year: number;
}

export interface FaqItem extends LocalizedFields {
  id: string;
  question_uz: string;
  question_ru?: string;
  question_kk?: string;
  question_en?: string;
  answer_uz: string;
  answer_ru?: string;
  answer_kk?: string;
  answer_en?: string;
  category: string;
  order: number;
}

export interface GalleryItem extends LocalizedFields {
  id: string;
  url: string;
  caption_uz: string;
  caption_ru?: string;
  caption_kk?: string;
  caption_en?: string;
  category: string;
}

export interface Settings extends LocalizedFields {
  address?: string;
  phone?: string;
  email?: string;
  hours?: string;
  telegram?: string;
  instagram?: string;
  facebook?: string;
  youtube?: string;
  students_count?: number;
  teachers_count?: number;
  experience_years?: number;
  olympiad_winners?: number;
  fullName_uz?: string;
  fullName_ru?: string;
  fullName_kk?: string;
  fullName_en?: string;
  shortName_uz?: string;
  shortName_ru?: string;
  shortName_kk?: string;
  shortName_en?: string;
}

export interface Message {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  read?: boolean;
  createdAt: string | { toDate: () => Date };
}
```

- [ ] **Step 2: Barrel export**

`src/types/index.ts`:
```ts
export * from './firebase';
```

### Task 2.2: Utility helpers

**Files:**
- Create: `src/lib/utils.ts`

- [ ] **Step 1: Shared utils**

```ts
import type { LocalizedFields, Locale } from '@/types';

export function escapeHtml(s: string | undefined | null): string {
  return String(s ?? '').replace(/[&<>"']/g, (m) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m] as string)
  );
}

export function getLocalizedField<T extends LocalizedFields>(
  obj: T,
  prefix: string,
  locale: Locale
): string {
  return (
    (obj as Record<string, string | undefined>)[`${prefix}_${locale}`] ||
    (obj as Record<string, string | undefined>)[`${prefix}_uz`] ||
    ''
  );
}

export function formatDate(ts: string | { toDate: () => Date } | undefined): string {
  if (!ts) return '';
  const d = typeof ts === 'object' && 'toDate' in ts ? ts.toDate() : new Date(ts);
  return d.toISOString().split('T')[0];
}

export function classNames(...xs: Array<string | false | undefined | null>): string {
  return xs.filter(Boolean).join(' ');
}
```

### Task 2.3: Firebase Client SDK

**Files:**
- Create: `src/lib/firebase/client.ts`

- [ ] **Step 1: Client init**

```ts
'use client';
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

const app: FirebaseApp = getApps()[0] ?? initializeApp(firebaseConfig);
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
export const storage: FirebaseStorage = getStorage(app);
```

### Task 2.4: Firebase Admin SDK

**Files:**
- Create: `src/lib/firebase/admin.ts`

- [ ] **Step 1: Admin init**

```ts
import 'server-only';
import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

let app: App;
if (getApps().length === 0) {
  app = initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    })
  });
} else {
  app = getApps()[0];
}

export const adminDb: Firestore = getFirestore(app);
```

### Task 2.5: Server-side Firestore helpers

**Files:**
- Create: `src/lib/firebase/server-queries.ts`

- [ ] **Step 1: Typed server queries**

```ts
import 'server-only';
import { adminDb } from './admin';
import type { News, Teacher, OlympiadResult, FaqItem, GalleryItem, Settings } from '@/types';

function serializeTimestamp(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return String(value);
}

function normalize<T extends { id: string }>(doc: FirebaseFirestore.QueryDocumentSnapshot): T {
  const data = doc.data();
  return {
    ...data,
    id: doc.id,
    createdAt: serializeTimestamp(data.createdAt),
    updatedAt: serializeTimestamp(data.updatedAt)
  } as T;
}

export async function getNewsList(limit = 50): Promise<News[]> {
  const snap = await adminDb
    .collection('news')
    .where('status', '==', 'published')
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();
  return snap.docs.map((d) => normalize<News>(d));
}

export async function getNewsById(id: string): Promise<News | null> {
  const doc = await adminDb.collection('news').doc(id).get();
  if (!doc.exists) return null;
  return normalize<News>(doc as FirebaseFirestore.QueryDocumentSnapshot);
}

export async function getNewsIds(): Promise<string[]> {
  const snap = await adminDb
    .collection('news')
    .where('status', '==', 'published')
    .select()
    .get();
  return snap.docs.map((d) => d.id);
}

export async function getTeachers(): Promise<Teacher[]> {
  const snap = await adminDb.collection('teachers').orderBy('order', 'asc').get();
  return snap.docs.map((d) => normalize<Teacher>(d));
}

export async function getOlympiad(): Promise<OlympiadResult[]> {
  const snap = await adminDb.collection('olympiad').get();
  const items = snap.docs.map((d) => normalize<OlympiadResult>(d));
  return items.sort((a, b) => (b.year || 0) - (a.year || 0) || (a.place || 99) - (b.place || 99));
}

export async function getFaq(): Promise<FaqItem[]> {
  const snap = await adminDb.collection('faq').orderBy('order', 'asc').get();
  return snap.docs.map((d) => normalize<FaqItem>(d));
}

export async function getGallery(): Promise<GalleryItem[]> {
  const snap = await adminDb.collection('gallery').get();
  return snap.docs.map((d) => normalize<GalleryItem>(d));
}

export async function getSettings(): Promise<Settings | null> {
  const doc = await adminDb.collection('settings').doc('main').get();
  if (!doc.exists) return null;
  return doc.data() as Settings;
}
```

### Task 2.6: Client-side Firestore helpers

**Files:**
- Create: `src/lib/firebase/client-queries.ts`

- [ ] **Step 1: Client wrapper (for admin panel)**

```ts
'use client';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  limit,
  getDocs,
  getDoc,
  serverTimestamp,
  type QueryConstraint
} from 'firebase/firestore';
import { db } from './client';

export interface QueryOptions {
  orderBy?: string;
  direction?: 'asc' | 'desc';
  where?: [string, FirebaseFirestore.WhereFilterOp, unknown];
  limit?: number;
}

function buildConstraints(options: QueryOptions = {}): QueryConstraint[] {
  const c: QueryConstraint[] = [];
  if (options.orderBy) c.push(orderBy(options.orderBy, options.direction || 'desc'));
  if (options.where) c.push(where(options.where[0], options.where[1] as never, options.where[2]));
  if (options.limit) c.push(limit(options.limit));
  return c;
}

export function subscribeCollection<T>(
  name: string,
  callback: (items: T[]) => void,
  options: QueryOptions = {}
) {
  const q = query(collection(db, name), ...buildConstraints(options));
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as T)),
    (err) => console.error(`[${name}] subscribe error:`, err)
  );
}

export async function getDocuments<T>(name: string, options: QueryOptions = {}): Promise<T[]> {
  const q = query(collection(db, name), ...buildConstraints(options));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as T);
}

export async function getDocument<T>(name: string, id: string): Promise<T | null> {
  const snap = await getDoc(doc(db, name, id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as T) : null;
}

export async function addDocument<T extends object>(name: string, data: T) {
  return addDoc(collection(db, name), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}

export async function updateDocument<T extends object>(name: string, id: string, data: T) {
  return updateDoc(doc(db, name, id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteDocument(name: string, id: string) {
  return deleteDoc(doc(db, name, id));
}
```

### Task 2.7: ImageKit helper

**Files:**
- Create: `src/lib/imagekit.ts`

- [ ] **Step 1: URL transformer + uploader**

```ts
const ENDPOINT = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT!;
const PUBLIC_KEY = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY!;

export interface ImageOpts {
  width?: number;
  height?: number;
  quality?: number | 'auto';
  format?: 'auto' | 'webp' | 'jpg';
}

export function transformImage(url: string, opts: ImageOpts = {}): string {
  if (!url || !url.includes('ik.imagekit.io')) return url;
  const params: string[] = [];
  if (opts.width) params.push(`w-${opts.width}`);
  if (opts.height) params.push(`h-${opts.height}`);
  params.push(`q-${opts.quality ?? 'auto'}`);
  params.push(`f-${opts.format ?? 'auto'}`);
  const tr = `tr:${params.join(',')}`;
  // ik.imagekit.io/alxorezmiy/folder/file.jpg → ik.imagekit.io/alxorezmiy/tr:w-600/folder/file.jpg
  return url.replace(/(ik\.imagekit\.io\/[^/]+)\//, `$1/${tr}/`);
}

export interface UploadResult {
  url: string;
  fileId: string;
  name: string;
  thumbnailUrl?: string;
}

export async function uploadImage(
  file: File,
  folder = 'misc',
  onProgress?: (pct: number) => void
): Promise<UploadResult> {
  if (!file.type.startsWith('image/')) throw new Error('Faqat rasm fayllari qabul qilinadi');
  if (file.size > 10 * 1024 * 1024) throw new Error("Rasm hajmi 10MB dan oshmasligi kerak");

  const authResp = await fetch('/api/imagekit-auth');
  if (!authResp.ok) throw new Error('Auth endpoint javob bermadi');
  const auth = await authResp.json();

  const formData = new FormData();
  formData.append('file', file);
  formData.append('publicKey', PUBLIC_KEY);
  formData.append('signature', auth.signature);
  formData.append('expire', String(auth.expire));
  formData.append('token', auth.token);
  formData.append('fileName', file.name);
  formData.append('folder', `/${folder}`);
  formData.append('useUniqueFileName', 'true');

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', 'https://upload.imagekit.io/api/v1/files/upload');
    if (onProgress) {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
      });
    }
    xhr.onload = () => {
      try {
        const result = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve({
            url: result.url,
            fileId: result.fileId,
            name: result.name,
            thumbnailUrl: result.thumbnailUrl
          });
        } else {
          reject(new Error(result.message || 'Yuklash muvaffaqiyatsiz'));
        }
      } catch {
        reject(new Error("Server javobini o'qib bo'lmadi"));
      }
    };
    xhr.onerror = () => reject(new Error('Tarmoq xatosi'));
    xhr.send(formData);
  });
}
```

### Task 2.8: Verify Phase 2

- [ ] **Step 1: Typecheck**

Run: `npm run typecheck`
Expected: No errors.

- [ ] **Step 2: Commit**

```bash
git add src/types src/lib
git commit -m "Phase 2: foundation — types, utils, Firebase client/admin SDKs, ImageKit helper"
```

---

## Phase 3 — i18n + Theme

**Agent:** i18n-agent
**Deps:** Phase 2
**Output:** next-intl wired, locale routing, messages migrated, theme provider with no-flash.

### Task 3.1: Migrate messages

**Files:**
- Create: `src/messages/uz.json` (copy from `lang/uz.json`)
- Create: `src/messages/ru.json`
- Create: `src/messages/kk.json`
- Create: `src/messages/en.json`
- Delete (in same commit): `lang/uz.json`, `lang/ru.json`, `lang/kk.json`, `lang/en.json`

- [ ] **Step 1: Copy + commit**

```bash
mkdir -p src/messages
cp lang/uz.json src/messages/uz.json
cp lang/ru.json src/messages/ru.json
cp lang/kk.json src/messages/kk.json
cp lang/en.json src/messages/en.json
git rm -r lang/
git add src/messages
git commit -m "Phase 3.1: migrate translation files to src/messages"
```

### Task 3.2: i18n routing config

**Files:**
- Create: `src/i18n/routing.ts`
- Create: `src/i18n/request.ts`
- Create: `src/middleware.ts`

- [ ] **Step 1: Routing**

`src/i18n/routing.ts`:
```ts
import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
  locales: ['uz', 'ru', 'kk', 'en'] as const,
  defaultLocale: 'uz',
  localePrefix: 'always'
});

export type AppLocale = (typeof routing.locales)[number];

export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
```

- [ ] **Step 2: Request config**

`src/i18n/request.ts`:
```ts
import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';
import { notFound } from 'next/navigation';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !routing.locales.includes(locale as never)) {
    locale = routing.defaultLocale;
  }
  let messages;
  try {
    messages = (await import(`../messages/${locale}.json`)).default;
  } catch {
    notFound();
  }
  return { locale, messages };
});
```

- [ ] **Step 3: Middleware**

`src/middleware.ts`:
```ts
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  matcher: [
    // Apply to all routes except API, admin, _next, static files
    '/((?!api|admin|_next|_vercel|.*\\..*).*)'
  ]
};
```

### Task 3.3: Locale layout with NextIntlClientProvider

**Files:**
- Modify: `src/app/[locale]/layout.tsx`

- [ ] **Step 1: Replace layout with full provider setup**

```tsx
import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { routing, type AppLocale } from '@/i18n/routing';
import { ThemeProvider } from '@/contexts/ThemeContext';
import '@/styles/globals.css';
import '@/styles/dark-theme.css';
import '@/styles/responsive.css';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://alxorezmiy.uz')
};

export default async function LocaleLayout({
  children,
  params
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as AppLocale)) notFound();
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme')||(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`
          }}
        />
      </head>
      <body>
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider>{children}</ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

### Task 3.4: Theme context

**Files:**
- Create: `src/contexts/ThemeContext.tsx`

- [ ] **Step 1: Theme provider**

```tsx
'use client';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    const stored = (localStorage.getItem('theme') as Theme | null) ||
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    setTheme(stored);
    document.documentElement.setAttribute('data-theme', stored);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggle: () => setTheme((t) => (t === 'dark' ? 'light' : 'dark')) }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
```

### Task 3.5: Migrate CSS

**Files:**
- Create: `src/styles/globals.css` (copy of `css/style.css`)
- Create: `src/styles/dark-theme.css`
- Create: `src/styles/responsive.css`
- Delete (next phase): `css/` folder (kept until layout migration)

- [ ] **Step 1: Copy CSS**

```bash
mkdir -p src/styles
cp css/style.css src/styles/globals.css
cp css/dark-theme.css src/styles/dark-theme.css
cp css/responsive.css src/styles/responsive.css
git add src/styles
git commit -m "Phase 3.5: copy CSS to src/styles (old css/ stays until Phase 4)"
```

### Task 3.6: Update home placeholder to test i18n

**Files:**
- Modify: `src/app/[locale]/page.tsx`

- [ ] **Step 1: Use translations**

```tsx
import { setRequestLocale, getTranslations } from 'next-intl/server';

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('hero');
  return (
    <main style={{ padding: '2rem' }}>
      <h1>{t('title')}</h1>
      <p>Locale: {locale}</p>
    </main>
  );
}
```

### Task 3.7: Verify Phase 3

- [ ] **Step 1: Build**

Run: `npm run build`
Expected: Builds successfully, 4 locale routes generated.

- [ ] **Step 2: Smoke test**

Run: `npm run dev` then visit `/uz`, `/ru`, `/kk`, `/en` — each shows hero title in respective language.

- [ ] **Step 3: Commit**

```bash
git add src/i18n src/middleware.ts src/contexts src/app
git commit -m "Phase 3: next-intl routing, theme context, locale layout with no-flash"
```

---

## Phase 4 — Layout components

**Agent:** layout-agent
**Deps:** Phase 3
**Output:** All shared layout React components (Navbar, Footer, MobileNav, SearchModal, etc.).

### Task 4.1: Navbar + Dropdown

**Files:**
- Create: `src/components/layout/Navbar.tsx`
- Create: `src/components/layout/NavbarDropdown.tsx`
- Create: `src/components/layout/MobileNav.tsx`

- [ ] **Step 1: Nav config (single source of truth)**

`src/components/layout/nav-config.ts`:
```ts
export interface NavChild {
  key: string;
  href: string;
  i18nKey: string;
}
export interface NavItem extends NavChild {
  childKeys?: string[];
  children?: NavChild[];
}

export const NAV_ITEMS: NavItem[] = [
  { key: 'home', href: '/', i18nKey: 'nav.home' },
  {
    key: 'about_group',
    href: '/about',
    i18nKey: 'nav.about',
    childKeys: ['about', 'directions', 'teachers', 'gallery'],
    children: [
      { key: 'about', href: '/about', i18nKey: 'nav.about_general' },
      { key: 'directions', href: '/directions', i18nKey: 'nav.directions' },
      { key: 'teachers', href: '/teachers', i18nKey: 'nav.teachers' },
      { key: 'gallery', href: '/gallery', i18nKey: 'nav.gallery' }
    ]
  },
  { key: 'achievements', href: '/achievements', i18nKey: 'nav.achievements' },
  { key: 'news', href: '/news', i18nKey: 'nav.news' },
  { key: 'admission', href: '/admission', i18nKey: 'nav.admission' },
  { key: 'faq', href: '/faq', i18nKey: 'nav.faq' },
  { key: 'contact', href: '/contact', i18nKey: 'nav.contact' }
];
```

- [ ] **Step 2: Navbar component**

`src/components/layout/Navbar.tsx`:
```tsx
'use client';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/routing';
import { NAV_ITEMS } from './nav-config';
import NavbarDropdown from './NavbarDropdown';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import ThemeToggle from '@/components/ui/ThemeToggle';
import SearchTrigger from '@/components/ui/SearchTrigger';

export default function Navbar({ onHamburgerClick }: { onHamburgerClick: () => void }) {
  const t = useTranslations();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  function isActive(item: { key: string; href: string; childKeys?: string[] }) {
    const path = pathname === '/' ? '/' : pathname.replace(/\/$/, '');
    if (item.href === path) return true;
    if (item.childKeys && item.childKeys.some((k) => path.endsWith(`/${k}`))) return true;
    return false;
  }

  return (
    <>
      <a href="#main-content" className="skip-link">{t('a11y.skip')}</a>
      <nav className={`navbar${scrolled ? ' scrolled' : ''}`} id="navbar">
        <div className="navbar-inner">
          <Link href="/" className="navbar-logo" aria-label={t('a11y.home_link')}>
            <span className="navbar-logo-icon">
              <img src="/assets/images/logo.webp" alt="" width={44} height={44} />
            </span>
          </Link>
          <div className="nav-links">
            {NAV_ITEMS.map((item) =>
              item.children ? (
                <NavbarDropdown key={item.key} item={item} active={isActive(item)} />
              ) : (
                <Link
                  key={item.key}
                  href={item.href as never}
                  className={isActive(item) ? 'active' : undefined}
                  aria-current={isActive(item) ? 'page' : undefined}
                >
                  {t(item.i18nKey as never)}
                </Link>
              )
            )}
          </div>
          <div className="nav-actions">
            <SearchTrigger />
            <LanguageSwitcher />
            <ThemeToggle />
            <button
              type="button"
              className="hamburger"
              aria-label={t('a11y.menu')}
              aria-expanded="false"
              aria-controls="mobileNav"
              onClick={onHamburgerClick}
            >
              <span></span><span></span><span></span>
            </button>
          </div>
        </div>
      </nav>
    </>
  );
}
```

- [ ] **Step 3: NavbarDropdown**

`src/components/layout/NavbarDropdown.tsx`:
```tsx
'use client';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/routing';
import type { NavItem } from './nav-config';

export default function NavbarDropdown({ item, active }: { item: NavItem; active: boolean }) {
  const t = useTranslations();
  const pathname = usePathname();
  return (
    <div className="nav-item-has-children">
      <Link href={item.href as never} className={active ? 'active' : undefined} aria-haspopup="true" aria-expanded="false">
        <span>{t(item.i18nKey as never)}</span>
        <svg className="nav-caret" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </Link>
      <div className="nav-dropdown" role="menu">
        {item.children!.map((c) => (
          <Link
            key={c.key}
            href={c.href as never}
            className={pathname.endsWith(c.href) ? 'active' : undefined}
            aria-current={pathname.endsWith(c.href) ? 'page' : undefined}
            role="menuitem"
          >
            {t(c.i18nKey as never)}
          </Link>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: MobileNav**

`src/components/layout/MobileNav.tsx`:
```tsx
'use client';
import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/routing';
import { NAV_ITEMS } from './nav-config';

export default function MobileNav({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTranslations();
  const pathname = usePathname();
  const flat = NAV_ITEMS.flatMap((i) => i.children ?? [i]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <div className={`mobile-nav${open ? ' active' : ''}`} id="mobileNav">
      {flat.map((item) => (
        <Link
          key={item.key}
          href={item.href as never}
          className={pathname === item.href ? 'active' : undefined}
          aria-current={pathname === item.href ? 'page' : undefined}
          onClick={onClose}
        >
          {t(item.i18nKey as never)}
        </Link>
      ))}
    </div>
  );
}
```

### Task 4.2: Footer

**Files:**
- Create: `src/components/layout/Footer.tsx`
- Create: `src/components/layout/social-icons.tsx` (shared SVG)

- [ ] **Step 1: Social icons**

`src/components/layout/social-icons.tsx`:
```tsx
export const SocialIcons = {
  pin: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>),
  phone: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>),
  mail: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>),
  clock: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>),
  telegram: (<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z"/></svg>),
  instagram: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>),
  facebook: (<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.45 2.89h-2.33v6.99A10 10 0 0 0 22 12z"/></svg>),
  youtube: (<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.6 3.6 12 3.6 12 3.6s-7.6 0-9.4.5A3 3 0 0 0 .5 6.2C0 8 0 12 0 12s0 4 .5 5.8a3 3 0 0 0 2.1 2.1c1.8.5 9.4.5 9.4.5s7.6 0 9.4-.5a3 3 0 0 0 2.1-2.1c.5-1.8.5-5.8.5-5.8s0-4-.5-5.8zM9.6 15.6V8.4l6.3 3.6-6.3 3.6z"/></svg>)
};
```

- [ ] **Step 2: Footer component**

`src/components/layout/Footer.tsx`:
```tsx
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { getSettings } from '@/lib/firebase/server-queries';
import { SocialIcons } from './social-icons';
import { getLocalizedField } from '@/lib/utils';
import type { Locale } from '@/types';

export default async function Footer({ locale }: { locale: Locale }) {
  const t = await getTranslations();
  const s = await getSettings();
  const fullName = s ? getLocalizedField(s, 'fullName', locale) : '';

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-about">
            <h4>Al-Xorazmiy maktabi</h4>
            <p>{t('footer.about_text')}</p>
            <div className="footer-social">
              {s?.telegram && <a href={s.telegram} target="_blank" rel="noopener" aria-label="Telegram">{SocialIcons.telegram}</a>}
              {s?.instagram && <a href={s.instagram} target="_blank" rel="noopener" aria-label="Instagram">{SocialIcons.instagram}</a>}
              {s?.facebook && <a href={s.facebook} target="_blank" rel="noopener" aria-label="Facebook">{SocialIcons.facebook}</a>}
              {s?.youtube && <a href={s.youtube} target="_blank" rel="noopener" aria-label="YouTube">{SocialIcons.youtube}</a>}
            </div>
          </div>
          <div>
            <h4>{t('footer.quick_links')}</h4>
            <ul className="footer-links">
              <li><Link href="/about">{t('nav.about')}</Link></li>
              <li><Link href="/directions">{t('nav.directions')}</Link></li>
              <li><Link href="/teachers">{t('nav.teachers')}</Link></li>
              <li><Link href="/achievements">{t('nav.achievements')}</Link></li>
              <li><Link href="/admission">{t('nav.admission')}</Link></li>
              <li><Link href="/gallery">{t('nav.gallery')}</Link></li>
            </ul>
          </div>
          <div>
            <h4>{t('footer.contact_info')}</h4>
            <ul className="footer-contact">
              {s?.address && <li><span>{SocialIcons.pin}</span> <span>{s.address}</span></li>}
              {s?.phone && <li><span>{SocialIcons.phone}</span> <a href={`tel:${s.phone.replace(/\s+/g, '')}`}>{s.phone}</a></li>}
              {s?.email && <li><span>{SocialIcons.mail}</span> <a href={`mailto:${s.email}`}>{s.email}</a></li>}
              {s?.hours && <li><span>{SocialIcons.clock}</span> <span>{s.hours}</span></li>}
            </ul>
          </div>
          <div>
            <h4>{t('nav.faq')}</h4>
            <ul className="footer-links">
              <li><Link href="/faq">{t('nav.faq')}</Link></li>
              <li><Link href="/news">{t('nav.news')}</Link></li>
              <li><Link href="/contact">{t('nav.contact')}</Link></li>
            </ul>
          </div>
        </div>
        {fullName && (
          <div className="footer-official-name" style={{ marginBottom: 'var(--s-5)', paddingTop: 'var(--s-5)', borderTop: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,.4)', display: 'block', marginBottom: '6px' }}>{t('footer.official_name')}</span>
            <p style={{ fontSize: '0.8125rem', lineHeight: 1.5, color: 'rgba(255,255,255,.55)', maxWidth: 900, margin: '0 auto' }}>{fullName}</p>
          </div>
        )}
        <div className="footer-bottom">
          <span>{t('footer.copyright')}</span>
          <span>Made with ❤️ in Nukus</span>
        </div>
      </div>
    </footer>
  );
}
```

### Task 4.3: UI primitives (LanguageSwitcher, ThemeToggle, SearchTrigger, BackToTop, ScrollProgress)

**Files:**
- Create: `src/components/ui/LanguageSwitcher.tsx`
- Create: `src/components/ui/ThemeToggle.tsx`
- Create: `src/components/ui/SearchTrigger.tsx`
- Create: `src/components/layout/BackToTop.tsx`
- Create: `src/components/layout/ScrollProgress.tsx`

- [ ] **Step 1: LanguageSwitcher**

```tsx
'use client';
import { useEffect, useRef, useState } from 'react';
import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/routing';
import { routing } from '@/i18n/routing';

const LANG_SHORT: Record<string, string> = { uz: 'UZ', ru: 'RU', kk: 'QQ', en: 'EN' };
const LANG_NAMES: Record<string, string> = { uz: "O'zbekcha", ru: 'Русский', kk: 'Qaraqalpaqsha', en: 'English' };

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('click', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  return (
    <div className={`lang-switcher${open ? ' open' : ''}`} ref={ref}>
      <button
        className="lang-btn"
        aria-label="Tilni tanlash"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
      >
        <span className="lang-current">{LANG_SHORT[locale]}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
      </button>
      <div className="lang-dropdown" role="menu">
        {routing.locales.map((l) => (
          <a
            key={l}
            href="#"
            className={l === locale ? 'active' : undefined}
            role="menuitem"
            onClick={(e) => {
              e.preventDefault();
              router.replace(pathname, { locale: l });
              setOpen(false);
            }}
          >
            {LANG_NAMES[l]}
          </a>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: ThemeToggle**

```tsx
'use client';
import { useTheme } from '@/contexts/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button className="theme-toggle" aria-label="Tema almashtirish" onClick={toggle}>
      {theme === 'dark' ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
      ) : (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
      )}
    </button>
  );
}
```

- [ ] **Step 3: SearchTrigger + SearchModal**

`src/components/ui/SearchTrigger.tsx`:
```tsx
'use client';
import { useState, useEffect, lazy, Suspense } from 'react';

const SearchModal = lazy(() => import('./SearchModal'));

export default function SearchTrigger() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      <button type="button" className="search-trigger" aria-label="Qidirish (Ctrl+K)" title="Qidirish · Ctrl+K" onClick={() => setOpen(true)}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7.5"/>
          <line x1="20.5" y1="20.5" x2="16.5" y2="16.5"/>
        </svg>
      </button>
      {open && (
        <Suspense fallback={null}>
          <SearchModal onClose={() => setOpen(false)} />
        </Suspense>
      )}
    </>
  );
}
```

- [ ] **Step 4: SearchModal**

`src/components/ui/SearchModal.tsx`:
```tsx
'use client';
import { useState, useEffect, useMemo } from 'react';
import { useLocale } from 'next-intl';
import { getDocuments } from '@/lib/firebase/client-queries';
import { getLocalizedField, escapeHtml } from '@/lib/utils';
import type { News, Teacher, Locale } from '@/types';

interface SearchResult {
  type: 'news' | 'teacher';
  id: string;
  title: string;
  subtitle: string;
  href: string;
  icon: string;
}

export default function SearchModal({ onClose }: { onClose: () => void }) {
  const locale = useLocale() as Locale;
  const [query, setQuery] = useState('');
  const [news, setNews] = useState<News[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    Promise.all([
      getDocuments<News>('news', { orderBy: 'createdAt', direction: 'desc', limit: 50 }),
      getDocuments<Teacher>('teachers', { limit: 50 })
    ]).then(([n, t]) => {
      setNews(n.filter((x) => x.status === 'published'));
      setTeachers(t);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx((i) => i + 1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx((i) => Math.max(0, i - 1)); }
      else if (e.key === 'Enter') {
        const r = results[activeIdx];
        if (r) window.location.href = r.href;
      }
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [activeIdx, onClose]);

  const results = useMemo<SearchResult[]>(() => {
    if (query.length < 2) return [];
    const q = query.toLowerCase();
    const out: SearchResult[] = [];
    for (const item of news) {
      const title = getLocalizedField(item, 'title', locale).toLowerCase();
      const content = getLocalizedField(item, 'content', locale).toLowerCase();
      if (title.includes(q) || content.includes(q)) {
        out.push({
          type: 'news',
          id: item.id,
          title: getLocalizedField(item, 'title', locale),
          subtitle: getLocalizedField(item, 'content', locale).substring(0, 100),
          href: `/${locale}/news/${item.id}`,
          icon: '📰'
        });
      }
    }
    for (const item of teachers) {
      const name = getLocalizedField(item, 'name', locale).toLowerCase();
      const subject = (item.subject || '').toLowerCase();
      if (name.includes(q) || subject.includes(q)) {
        out.push({
          type: 'teacher',
          id: item.id,
          title: getLocalizedField(item, 'name', locale),
          subtitle: `${item.subject || ''} · ${item.category || ''}`,
          href: `/${locale}/teachers#${item.id}`,
          icon: '👨‍🏫'
        });
      }
    }
    return out.slice(0, 10);
  }, [query, news, teachers, locale]);

  return (
    <div className="search-modal active">
      <div className="search-modal-backdrop" onClick={onClose} />
      <div className="search-modal-box">
        <div className="search-modal-input-wrap">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input
            type="text"
            className="search-modal-input"
            placeholder="Qidirish: yangilik, o'qituvchi..."
            autoComplete="off"
            autoFocus
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActiveIdx(0); }}
          />
          <kbd className="search-kbd">ESC</kbd>
        </div>
        <div className="search-modal-results">
          {query.length < 2 ? (
            <div className="search-empty">
              <p style={{ color: 'var(--text-lo)', fontSize: '0.875rem' }}>Kamida 2 ta harf yozing</p>
              <div style={{ marginTop: 8, fontSize: '0.75rem', color: 'var(--text-lo)' }}>
                Klaviatura: <kbd className="search-kbd">↑↓</kbd> · <kbd className="search-kbd">Enter</kbd> · <kbd className="search-kbd">ESC</kbd>
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="search-empty">
              <div style={{ fontSize: '2.5rem', marginBottom: 8, opacity: 0.5 }}>🔍</div>
              <p style={{ color: 'var(--text-mid)' }} dangerouslySetInnerHTML={{ __html: `"${escapeHtml(query)}" bo'yicha hech narsa topilmadi` }} />
            </div>
          ) : (
            results.map((r, i) => (
              <a key={`${r.type}-${r.id}`} href={r.href} className={`search-result${i === activeIdx ? ' active' : ''}`}>
                <span className="search-result-icon">{r.icon}</span>
                <div className="search-result-text">
                  <div className="search-result-title">{r.title}</div>
                  <div className="search-result-subtitle">{r.subtitle}</div>
                </div>
                <span className="search-result-type">{r.type === 'news' ? 'Yangilik' : "O'qituvchi"}</span>
              </a>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: BackToTop**

```tsx
'use client';
import { useEffect, useState } from 'react';

export default function BackToTop() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <button
      className={`back-to-top${visible ? ' visible' : ''}`}
      aria-label="Yuqoriga"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 15l-6-6-6 6"/></svg>
    </button>
  );
}
```

- [ ] **Step 6: ScrollProgress**

```tsx
'use client';
import { useEffect, useState } from 'react';

export default function ScrollProgress() {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const update = () => {
      const h = document.documentElement;
      setPct((h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100);
    };
    window.addEventListener('scroll', update, { passive: true });
    update();
    return () => window.removeEventListener('scroll', update);
  }, []);
  return <div className="scroll-progress" style={{ width: `${pct}%` }} />;
}
```

### Task 4.4: SiteShell wrapper

**Files:**
- Create: `src/components/layout/SiteShell.tsx`

- [ ] **Step 1: Composed shell (used by [locale] layout)**

```tsx
'use client';
import { useState, type ReactNode } from 'react';
import Navbar from './Navbar';
import MobileNav from './MobileNav';
import BackToTop from './BackToTop';
import ScrollProgress from './ScrollProgress';

export default function SiteShell({ children, footer }: { children: ReactNode; footer: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <>
      <ScrollProgress />
      <Navbar onHamburgerClick={() => setMobileOpen((v) => !v)} />
      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />
      {children}
      {footer}
      <BackToTop />
    </>
  );
}
```

### Task 4.5: Wire shell into locale layout

**Files:**
- Modify: `src/app/[locale]/layout.tsx`

- [ ] **Step 1: Update layout**

Replace body content with:
```tsx
<body>
  <NextIntlClientProvider messages={messages}>
    <ThemeProvider>
      <SiteShell footer={<Footer locale={locale as Locale} />}>
        {children}
      </SiteShell>
    </ThemeProvider>
  </NextIntlClientProvider>
</body>
```
Add imports for `SiteShell`, `Footer`, `Locale`.

### Task 4.6: Cleanup + verify

- [ ] **Step 1: Delete old files**

```bash
git rm js/site-shell.js js/main.js js/theme.js js/i18n.js js/site-search.js js/stats.js js/hero-particles.js
```

(Keep `js/firebase-config.js`, `js/firestore-helpers.js`, `js/settings-loader.js`, `js/imagekit-upload.js` until Phase 6/7.)

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: Success.

- [ ] **Step 3: Smoke test**

Run: `npm run dev` then visit `/uz`. Verify navbar shows, dropdown works, theme toggle works, language switcher changes URL.

- [ ] **Step 4: Commit**

```bash
git add src/components src/app/\[locale\]/layout.tsx
git commit -m "Phase 4: layout components (Navbar, Footer, MobileNav, SearchModal, etc.) + remove migrated legacy JS"
```

---

## Phase 5 — Static public pages

**Agent:** pages-public-agent
**Deps:** Phase 4
**Output:** Home, About, Admission, Contact, Directions, FAQ, Gallery pages + 404.

### Task 5.1: Home page

**Files:**
- Modify: `src/app/[locale]/page.tsx`
- Create: `src/components/home/Hero.tsx`
- Create: `src/components/home/HeroParticles.tsx`
- Create: `src/components/home/StatsCounter.tsx`
- Create: `src/components/home/DirectionsGrid.tsx`
- Create: `src/components/home/LatestNews.tsx`
- Create: `src/components/home/AchievementsCarousel.tsx`
- Create: `src/components/home/ContactShort.tsx`

- [ ] **Step 1: Hero (server component)**

`src/components/home/Hero.tsx`:
```tsx
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import HeroParticles from './HeroParticles';

export default async function Hero() {
  const t = await getTranslations('hero');
  return (
    <section className="hero" id="hero">
      <HeroParticles />
      <div className="container">
        <div className="hero-content">
          <span className="hero-eyebrow animate-on-scroll">{t('eyebrow')}</span>
          <h1 className="animate-on-scroll animate-delay-1" dangerouslySetInnerHTML={{ __html: t.raw('title') as string }} />
          <p className="animate-on-scroll animate-delay-2">{t('description')}</p>
          <div className="hero-actions animate-on-scroll animate-delay-3">
            <Link href="/admission" className="btn btn-primary btn-lg">{t('btn_admission')}</Link>
            <Link href="/about" className="btn btn-ghost btn-lg">{t('btn_about')}</Link>
          </div>
        </div>
      </div>
      <a href="#aboutShort" className="hero-scroll-cue" aria-label="Quyiroq aylantirish">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>
      </a>
    </section>
  );
}
```

- [ ] **Step 2: HeroParticles (client)**

Port from `js/hero-particles.js` to React component, with proper cleanup. Same Canvas/RAF logic but wrapped in `useEffect`. Key fix from spec: pause RAF fully when invisible.

```tsx
'use client';
import { useEffect, useRef } from 'react';

export default function HeroParticles() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const config = {
      count: window.innerWidth < 768 ? 32 : 72,
      maxDist: 140, speed: 0.25, size: 1.6, mouseRadius: 180
    };
    let particles: { x: number; y: number; vx: number; vy: number }[] = [];
    let w = 0, h = 0;
    let mouse = { x: null as number | null, y: null as number | null };
    let visible = true;
    let raf = 0;

    const resize = () => {
      const rect = canvas.parentElement!.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      w = canvas.width; h = canvas.height;
    };
    const create = () => {
      particles = Array.from({ length: config.count }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * config.speed * dpr,
        vy: (Math.random() - 0.5) * config.speed * dpr
      }));
    };
    const draw = () => {
      const maxDist = config.maxDist * dpr;
      ctx.clearRect(0, 0, w, h);
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = w; else if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h; else if (p.y > h) p.y = 0;
      }
      ctx.lineWidth = dpr;
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const d = Math.sqrt(dx*dx + dy*dy);
          if (d < maxDist) {
            const op = (1 - d / maxDist) * 0.32;
            ctx.strokeStyle = `rgba(245, 158, 11, ${op})`;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }
      if (mouse.x !== null && mouse.y !== null) {
        const mr = config.mouseRadius * dpr;
        for (const p of particles) {
          const dx = p.x - mouse.x, dy = p.y - mouse.y;
          const d = Math.sqrt(dx*dx + dy*dy);
          if (d < mr) {
            const op = (1 - d / mr) * 0.55;
            ctx.strokeStyle = `rgba(251, 191, 36, ${op})`;
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
          }
        }
      }
      ctx.fillStyle = 'rgba(252, 211, 77, 0.65)';
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, config.size * dpr, 0, Math.PI * 2);
        ctx.fill();
      }
    };
    const loop = () => {
      if (visible) draw();
      raf = requestAnimationFrame(loop);
    };
    const onResize = () => { resize(); create(); };
    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = (e.clientX - rect.left) * dpr;
      mouse.y = (e.clientY - rect.top) * dpr;
    };
    const onLeave = () => { mouse.x = null; mouse.y = null; };
    const obs = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !raf) raf = requestAnimationFrame(loop);
      else if (!visible && raf) { cancelAnimationFrame(raf); raf = 0; }
    });
    resize(); create(); obs.observe(canvas);
    window.addEventListener('resize', onResize, { passive: true });
    canvas.addEventListener('mousemove', onMove, { passive: true });
    canvas.addEventListener('mouseleave', onLeave);
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      obs.disconnect();
      window.removeEventListener('resize', onResize);
      canvas.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  return <canvas ref={ref} className="hero-canvas" aria-hidden="true" />;
}
```

- [ ] **Step 3: StatsCounter (client)**

```tsx
'use client';
import { useEffect, useRef } from 'react';

interface StatItem {
  label: string;
  count: number;
  suffix?: string;
}

export default function StatsCounter({ stats }: { stats: StatItem[] }) {
  const refs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target as HTMLDivElement;
        const target = Number(el.dataset.count);
        const suffix = el.dataset.suffix || '';
        const duration = 2000;
        const startTime = performance.now();
        const update = (now: number) => {
          const progress = Math.min((now - startTime) / duration, 1);
          const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
          el.textContent = Math.floor(target * eased).toLocaleString() + suffix;
          if (progress < 1) requestAnimationFrame(update);
        };
        requestAnimationFrame(update);
        observer.unobserve(el);
      });
    }, { threshold: 0.3 });
    refs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section className="stats-section">
      <div className="container">
        <div className="grid grid-4">
          {stats.map((s, i) => (
            <div key={i} className={`stat-card animate-on-scroll animate-delay-${i}`}>
              <div
                ref={(el) => { refs.current[i] = el; }}
                className="stat-number"
                data-count={s.count}
                data-suffix={s.suffix || ''}
              >
                0
              </div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: DirectionsGrid, LatestNews, AchievementsCarousel, ContactShort**

(These follow same pattern — server components that fetch via Firebase Admin SDK, render markup matching existing CSS classes. Code mirrors current `index.html` JSX-converted. Full code is in the existing files at [index.html:118-265]. Translate to JSX preserving classnames.)

- [ ] **Step 5: Home page composes them**

`src/app/[locale]/page.tsx`:
```tsx
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { getSettings, getNewsList, getOlympiad } from '@/lib/firebase/server-queries';
import Hero from '@/components/home/Hero';
import StatsCounter from '@/components/home/StatsCounter';
import DirectionsGrid from '@/components/home/DirectionsGrid';
import LatestNews from '@/components/home/LatestNews';
import AchievementsCarousel from '@/components/home/AchievementsCarousel';
import ContactShort from '@/components/home/ContactShort';
import type { Locale } from '@/types';

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta.home' });
  return {
    title: t('title'),
    description: t('description')
  };
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const [settings, news, olympiad] = await Promise.all([
    getSettings(),
    getNewsList(6),
    getOlympiad()
  ]);

  const stats = [
    { label: t('stats.students'), count: settings?.students_count || 520, suffix: '+' },
    { label: t('stats.teachers'), count: settings?.teachers_count || 65 },
    { label: t('stats.experience'), count: settings?.experience_years || 15, suffix: '+' },
    { label: t('stats.olympiad'), count: settings?.olympiad_winners || 180, suffix: '+' }
  ];

  return (
    <>
      <Hero />
      <StatsCounter stats={stats} />
      <DirectionsGrid />
      <LatestNews items={news.slice(0, 3)} locale={locale as Locale} />
      <AchievementsCarousel items={olympiad.slice(0, 10)} />
      <ContactShort settings={settings} />
    </>
  );
}
```

- [ ] **Step 6: Build + smoke test**

Run: `npm run build`, then visit `/uz`. Hero, stats, directions, news, achievements, contact short — all visible matching old layout.

- [ ] **Step 7: Commit**

```bash
git rm index.html
git add src/components/home src/app/\[locale\]/page.tsx
git commit -m "Phase 5.1: home page (Hero, Stats, Directions, LatestNews, Achievements, ContactShort)"
```

### Task 5.2: About, Admission, Contact, Directions, FAQ, Gallery

Each follows the same pattern:
- Create page file: `src/app/[locale]/<name>/page.tsx`
- For dynamic data (FAQ, Gallery): fetch via `getFaq()`, `getGallery()` from server-queries
- For static content (About, Admission, Directions): translate HTML structure to JSX with `useTranslations`
- For Contact: form is client component, submits to `/api/send-message` (built in Phase 7)
- Delete old `.html` file in same commit

- [ ] **Step 1: About page**

`src/app/[locale]/about/page.tsx`:
```tsx
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { getSettings } from '@/lib/firebase/server-queries';
import { getLocalizedField } from '@/lib/utils';
import type { Locale } from '@/types';

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta.about' });
  return { title: t('title'), description: t('description') };
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('about_page');
  const settings = await getSettings();
  const fullName = settings ? getLocalizedField(settings, 'fullName', locale as Locale) : '';

  return (
    <>
      <section className="page-header">
        <div className="container">
          <h1>{t('title')}</h1>
          <p>{t('subtitle')}</p>
        </div>
      </section>
      {/* Translate rest of about.html sections preserving classnames */}
      {/* ... see about.html for full content structure ... */}
    </>
  );
}
```

**Note for implementer:** For each static page, open the old HTML file (`about.html`, `admission.html`, etc.), translate the body markup to JSX, replace `data-i18n="key"` with `{t('key')}`, replace `data-setting="x"` with server-fetched settings values, and delete the old file.

- [ ] **Step 2-6: Remaining static pages**

Repeat for `admission`, `contact`, `directions`, `faq`, `gallery`. The Contact page form should be a separate `'use client'` component (`ContactForm.tsx`) that posts to `/api/send-message`.

- [ ] **Step 7: 404 page**

`src/app/[locale]/not-found.tsx`:
```tsx
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';

export default async function NotFound() {
  const t = await getTranslations('not_found');
  return (
    <section className="page-header" style={{ textAlign: 'center', minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="container">
        <h1 style={{ fontSize: '6rem', margin: 0 }}>404</h1>
        <p>{t('message')}</p>
        <Link href="/" className="btn btn-primary">{t('back_home')}</Link>
      </div>
    </section>
  );
}
```

- [ ] **Step 8: Verify + commit**

```bash
npm run build
git rm about.html admission.html contact.html directions.html faq.html gallery.html 404.html
git add src/app src/components
git commit -m "Phase 5.2-5.8: about/admission/contact/directions/faq/gallery + 404"
```

---

## Phase 6 — Dynamic pages

**Agent:** pages-dynamic-agent
**Deps:** Phase 4 (parallel with Phase 5)
**Output:** News list, news detail, teachers, achievements pages.

### Task 6.1: News list

**Files:**
- Create: `src/app/[locale]/news/page.tsx`
- Create: `src/components/news/NewsCard.tsx`
- Create: `src/components/news/NewsGrid.tsx`

- [ ] **Step 1: NewsCard**

```tsx
import { Link } from '@/i18n/routing';
import { getLocalizedField, formatDate } from '@/lib/utils';
import { transformImage } from '@/lib/imagekit';
import type { News, Locale } from '@/types';

export default function NewsCard({ item, locale }: { item: News; locale: Locale }) {
  return (
    <Link href={`/news/${item.id}` as never} className="card card-hover news-card" style={{ textDecoration: 'none', color: 'inherit', display: 'block', padding: 0, overflow: 'hidden' }}>
      {item.image && (
        <div className="card-img">
          <img src={transformImage(item.image, { width: 600 })} alt={getLocalizedField(item, 'title', locale)} loading="lazy" />
        </div>
      )}
      <div className="news-card-body" style={{ padding: 'var(--space-lg)' }}>
        <div className="card-meta">
          <span className="card-category">{item.category}</span>
          <span className="card-date">{formatDate(item.createdAt)}</span>
        </div>
        <h3>{getLocalizedField(item, 'title', locale)}</h3>
        <p>{getLocalizedField(item, 'content', locale).substring(0, 100)}...</p>
      </div>
    </Link>
  );
}
```

- [ ] **Step 2: News list page**

```tsx
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { getNewsList } from '@/lib/firebase/server-queries';
import NewsCard from '@/components/news/NewsCard';
import type { Locale } from '@/types';

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta.news' });
  return { title: t('title'), description: t('description') };
}

export default async function NewsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('news_page');
  const news = await getNewsList(50);

  return (
    <>
      <section className="page-header"><div className="container"><h1>{t('title')}</h1></div></section>
      <section className="section">
        <div className="container">
          <div className="grid grid-3">
            {news.map((item) => <NewsCard key={item.id} item={item} locale={locale as Locale} />)}
          </div>
        </div>
      </section>
    </>
  );
}
```

### Task 6.2: News detail

**Files:**
- Create: `src/app/[locale]/news/[id]/page.tsx`

- [ ] **Step 1: News detail with generateStaticParams**

```tsx
import { notFound } from 'next/navigation';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { getNewsById, getNewsIds } from '@/lib/firebase/server-queries';
import { getLocalizedField, formatDate } from '@/lib/utils';
import { transformImage } from '@/lib/imagekit';
import { routing } from '@/i18n/routing';
import type { Locale } from '@/types';

export const revalidate = 60;

export async function generateStaticParams() {
  const ids = await getNewsIds();
  return routing.locales.flatMap((locale) => ids.map((id) => ({ locale, id })));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  const item = await getNewsById(id);
  if (!item) return {};
  return {
    title: getLocalizedField(item, 'title', locale as Locale),
    description: getLocalizedField(item, 'content', locale as Locale).substring(0, 160),
    openGraph: {
      title: getLocalizedField(item, 'title', locale as Locale),
      description: getLocalizedField(item, 'content', locale as Locale).substring(0, 200),
      images: item.image ? [transformImage(item.image, { width: 1200 })] : []
    }
  };
}

export default async function NewsDetailPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const item = await getNewsById(id);
  if (!item || item.status !== 'published') notFound();

  return (
    <article className="section">
      <div className="container" style={{ maxWidth: 800 }}>
        <header style={{ marginBottom: 'var(--s-8)' }}>
          <span className="card-category">{item.category}</span>
          <h1 style={{ marginTop: 'var(--s-4)' }}>{getLocalizedField(item, 'title', locale as Locale)}</h1>
          <time>{formatDate(item.createdAt)}</time>
        </header>
        {item.image && (
          <img src={transformImage(item.image, { width: 1200 })} alt={getLocalizedField(item, 'title', locale as Locale)} style={{ width: '100%', borderRadius: 'var(--r-lg)' }} />
        )}
        <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, marginTop: 'var(--s-6)' }}>
          {getLocalizedField(item, 'content', locale as Locale)}
        </div>
      </div>
    </article>
  );
}
```

### Task 6.3: Teachers + Achievements

- [ ] **Step 1: Teachers page**

`src/app/[locale]/teachers/page.tsx` — fetches `getTeachers()`, renders grid of `TeacherCard` components. Card shows photo (next/image with ImageKit transform), name, subject, category, experience.

- [ ] **Step 2: Achievements page**

`src/app/[locale]/achievements/page.tsx` — fetches `getOlympiad()`, groups by year, displays cards. Match existing `achievements.html` layout.

- [ ] **Step 3: Verify + commit**

```bash
npm run build
git rm news.html news-detail.html teachers.html achievements.html
git rm js/firestore-helpers.js js/firebase-config.js js/settings-loader.js
git add src/app src/components
git commit -m "Phase 6: dynamic pages — news list/detail, teachers, achievements"
```

---

## Phase 7 — API routes

**Agent:** api-agent
**Deps:** Phase 2 (parallel from Phase 4)
**Output:** ImageKit auth + send-message routes, CORS hardened.

### Task 7.1: ImageKit auth route

**Files:**
- Create: `src/app/api/imagekit-auth/route.ts`

- [ ] **Step 1: Route handler**

```ts
import { NextResponse } from 'next/server';
import crypto from 'node:crypto';

const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_SITE_URL || 'https://alxorezmiy.uz',
  ...(process.env.NODE_ENV !== 'production' ? ['http://localhost:3000'] : [])
];

function corsHeaders(origin: string | null): Record<string, string> {
  const allowed = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin'
  };
}

export async function OPTIONS(req: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req.headers.get('origin')) });
}

export async function GET(req: Request) {
  const origin = req.headers.get('origin');
  const headers = corsHeaders(origin);

  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  if (!privateKey) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500, headers });
  }

  const token = crypto.randomUUID();
  const expire = Math.floor(Date.now() / 1000) + 600;
  const signature = crypto.createHmac('sha1', privateKey).update(token + expire).digest('hex');

  return NextResponse.json({ token, expire, signature }, { headers });
}
```

### Task 7.2: Send-message route

**Files:**
- Create: `src/app/api/send-message/route.ts`

- [ ] **Step 1: Route handler with validation**

```ts
import { NextResponse } from 'next/server';
import { escapeHtml } from '@/lib/utils';

const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_SITE_URL || 'https://alxorezmiy.uz',
  ...(process.env.NODE_ENV !== 'production' ? ['http://localhost:3000'] : [])
];

function corsHeaders(origin: string | null): Record<string, string> {
  const allowed = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin'
  };
}

export async function OPTIONS(req: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req.headers.get('origin')) });
}

export async function POST(req: Request) {
  const origin = req.headers.get('origin');
  const headers = corsHeaders(origin);

  let body: { name?: string; email?: string; subject?: string; message?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400, headers });
  }

  const { name, email, subject, message } = body;
  if (!name || !email || !subject || !message) {
    return NextResponse.json({ error: "Barcha maydonlar to'ldirilishi shart" }, { status: 400, headers });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Email format noto'g'ri" }, { status: 400, headers });
  }
  if (message.length > 5000 || subject.length > 200 || name.length > 100) {
    return NextResponse.json({ error: 'Maydonlar uzunligi cheklovdan oshib ketdi' }, { status: 400, headers });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.ADMIN_EMAIL;
  if (!apiKey || !to) {
    return NextResponse.json({ ok: true, emailSent: false, note: 'Email service not configured' }, { headers });
  }

  const html = `
    <!DOCTYPE html><html><body style="margin:0;padding:0;background:#F4F4F8;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#0F172A;">
      <div style="max-width:600px;margin:0 auto;padding:32px 24px;">
        <div style="background:linear-gradient(135deg,#6366F1,#8B5CF6);padding:24px;border-radius:12px 12px 0 0;color:white;">
          <h1 style="margin:0;font-size:20px;font-weight:700;">📨 Yangi xabar — Al-Xorazmiy maktabi</h1>
        </div>
        <div style="background:white;padding:32px 24px;border-radius:0 0 12px 12px;border:1px solid #E5E7EB;border-top:none;">
          <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
            <tr><td style="padding:8px 0;color:#64748B;font-size:14px;width:90px;">Ism:</td><td style="padding:8px 0;font-weight:600;">${escapeHtml(name)}</td></tr>
            <tr><td style="padding:8px 0;color:#64748B;font-size:14px;">Email:</td><td style="padding:8px 0;"><a href="mailto:${escapeHtml(email)}" style="color:#6366F1;">${escapeHtml(email)}</a></td></tr>
            <tr><td style="padding:8px 0;color:#64748B;font-size:14px;">Mavzu:</td><td style="padding:8px 0;font-weight:600;">${escapeHtml(subject)}</td></tr>
          </table>
          <div style="background:#F8FAFC;padding:20px;border-radius:8px;border-left:4px solid #6366F1;">
            <div style="color:#64748B;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px;">Xabar matni:</div>
            <div style="white-space:pre-wrap;line-height:1.6;color:#0F172A;">${escapeHtml(message)}</div>
          </div>
        </div>
      </div>
    </body></html>
  `;

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Al-Xorazmiy <onboarding@resend.dev>',
        to: [to],
        reply_to: email,
        subject: `[Sayt] ${subject}`,
        html
      })
    });
    if (!r.ok) {
      const errText = await r.text();
      return NextResponse.json({ error: 'Email yuborilmadi', detail: errText }, { status: 500, headers });
    }
    return NextResponse.json({ ok: true, emailSent: true }, { headers });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500, headers });
  }
}
```

### Task 7.3: Verify + cleanup

- [ ] **Step 1: Test endpoint locally**

```bash
npm run dev
curl http://localhost:3000/api/imagekit-auth
# Expected: {"token":"...","expire":...,"signature":"..."}
```

- [ ] **Step 2: Delete old API files**

```bash
git rm -r api/
git rm js/imagekit-upload.js
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api src/lib/imagekit.ts
git commit -m "Phase 7: API routes — imagekit-auth, send-message with hardened CORS"
```

---

## Phase 8 — Admin panel

**Agent:** admin-agent
**Deps:** Phase 2, Phase 3 (parallel from Phase 4)
**Output:** Full admin panel with auth guard + 9 admin pages.

### Task 8.1: Admin layout + auth guard

**Files:**
- Create: `src/app/admin/layout.tsx`
- Create: `src/components/admin/AuthGuard.tsx`
- Create: `src/components/admin/AdminSidebar.tsx`
- Create: `src/components/admin/AdminHeader.tsx`
- Create: `src/contexts/AuthContext.tsx`

- [ ] **Step 1: AuthContext (client)**

```tsx
'use client';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';

interface AuthCtx { user: User | null; loading: boolean; logout: () => Promise<void>; }

const AuthContext = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, logout: () => signOut(auth) }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth outside AuthProvider');
  return ctx;
}
```

- [ ] **Step 2: AuthGuard**

```tsx
'use client';
import { useEffect, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function AuthGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isLogin = pathname === '/admin/login';

  useEffect(() => {
    if (loading) return;
    if (!user && !isLogin) router.replace('/admin/login');
    if (user && isLogin) router.replace('/admin');
  }, [user, loading, isLogin, router]);

  if (loading) return <div style={{ padding: '2rem' }}>Yuklanmoqda...</div>;
  if (!user && !isLogin) return null;
  return <>{children}</>;
}
```

- [ ] **Step 3: Admin layout**

```tsx
'use client';
import { AuthProvider } from '@/contexts/AuthContext';
import AuthGuard from '@/components/admin/AuthGuard';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import '@/styles/globals.css';
import '../../../admin/css/admin.css'; // temporarily — moved in step 4
import { usePathname } from 'next/navigation';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === '/admin/login';
  return (
    <AuthProvider>
      <AuthGuard>
        {isLogin ? children : (
          <div className="admin-shell">
            <AdminSidebar />
            <div className="admin-content">
              <AdminHeader />
              <main>{children}</main>
            </div>
          </div>
        )}
      </AuthGuard>
    </AuthProvider>
  );
}
```

- [ ] **Step 4: Move admin CSS**

```bash
mv admin/css/admin.css src/styles/admin.css
```

Update layout import to `'@/styles/admin.css'`.

### Task 8.2: Admin pages (login, dashboard, news, teachers, gallery, faq, olympiad, messages, settings, users)

Each follows pattern:
- Client component (`'use client'`)
- Uses `subscribeCollection`, `addDocument`, `updateDocument`, `deleteDocument` from client-queries
- Renders existing admin HTML structure as JSX

- [ ] **Step 1: Login page**

`src/app/admin/login/page.tsx`:
```tsx
'use client';
import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="admin-login">
      {/* Translate admin/login.html markup */}
      <form onSubmit={onSubmit}>
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={submitting}>{submitting ? '...' : 'Kirish'}</button>
      </form>
    </div>
  );
}
```

- [ ] **Step 2-9: Remaining admin pages**

For each admin page (`news`, `teachers`, `gallery`, `faq`, `olympiad`, `messages`, `settings`, `users`):
1. Read corresponding old file (`admin/<name>.html`, `admin/js/<name>.js`)
2. Translate HTML to JSX
3. Replace Firebase global calls with imports from `client-queries`
4. Replace upload calls with `uploadImage` from `imagekit`
5. Use `ConfirmDialog` component for delete confirmations

(Implementer: each admin page is roughly 100-200 lines. The repetitive CRUD pattern allows fast porting. Use `seed.js` only if database genuinely needs reseeding, otherwise omit.)

### Task 8.3: Verify + cleanup

- [ ] **Step 1: Smoke test**

Run: `npm run dev` then visit `/admin/login`, login with Firebase user, navigate each admin page.

- [ ] **Step 2: Delete old admin**

```bash
git rm -r admin/
```

- [ ] **Step 3: Commit**

```bash
git add src/app/admin src/components/admin src/contexts/AuthContext.tsx
git commit -m "Phase 8: admin panel — auth guard + 9 admin pages with Firebase client"
```

---

## Phase 9 — PWA + SEO

**Agent:** pwa-seo-agent
**Deps:** Phase 5, Phase 6
**Output:** Service worker, manifest, sitemap, robots, JSON-LD metadata.

### Task 9.1: PWA with next-pwa

**Files:**
- Modify: `next.config.mjs`
- Move: `manifest.json` → `public/manifest.json`

- [ ] **Step 1: Update next.config.mjs**

Wrap existing config with `next-pwa`:
```js
import withPWA from '@ducanh2912/next-pwa';
// ... existing imports

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');
const pwa = withPWA({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  workboxOptions: {
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/fonts\.gstatic\.com/,
        handler: 'CacheFirst',
        options: { cacheName: 'fonts', expiration: { maxEntries: 4, maxAgeSeconds: 60*60*24*365 } }
      },
      {
        urlPattern: /^https:\/\/ik\.imagekit\.io/,
        handler: 'StaleWhileRevalidate',
        options: { cacheName: 'imagekit', expiration: { maxEntries: 100 } }
      },
      {
        urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
        handler: 'NetworkOnly'
      }
    ]
  }
});

export default pwa(withNextIntl(nextConfig));
```

- [ ] **Step 2: Move manifest**

```bash
mv manifest.json public/manifest.json
```

Update paths inside if needed (icons already at `/assets/...`).

- [ ] **Step 3: Reference manifest in root metadata**

In `src/app/[locale]/layout.tsx`, add to `metadata`:
```ts
export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://alxorezmiy.uz'),
  manifest: '/manifest.json',
  themeColor: '#0D0D5C',
  icons: { icon: '/assets/icons/favicon.svg', apple: '/assets/images/logo.webp' }
};
```

- [ ] **Step 4: Delete old SW**

```bash
git rm sw.js
```

### Task 9.2: Sitemap (dynamic)

**Files:**
- Create: `src/app/sitemap.ts`

- [ ] **Step 1: Dynamic sitemap**

```ts
import type { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';
import { getNewsIds } from '@/lib/firebase/server-queries';

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://alxorezmiy.uz';
const STATIC_PATHS = ['', '/about', '/admission', '/contact', '/directions', '/faq', '/gallery', '/teachers', '/achievements', '/news'];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const newsIds = await getNewsIds().catch(() => []);
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of routing.locales) {
    for (const path of STATIC_PATHS) {
      entries.push({
        url: `${BASE}/${locale}${path}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: path === '' ? 1.0 : 0.7
      });
    }
    for (const id of newsIds) {
      entries.push({
        url: `${BASE}/${locale}/news/${id}`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.5
      });
    }
  }
  return entries;
}
```

### Task 9.3: Robots

**Files:**
- Create: `src/app/robots.ts`
- Delete: `robots.txt`, `sitemap.xml`

- [ ] **Step 1: Dynamic robots**

```ts
import type { MetadataRoute } from 'next';

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://alxorezmiy.uz';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: '/admin/' }
    ],
    sitemap: `${BASE}/sitemap.xml`
  };
}
```

- [ ] **Step 2: Remove old**

```bash
git rm robots.txt sitemap.xml
```

### Task 9.4: JSON-LD + OpenGraph

- [ ] **Step 1: Add JSON-LD to home page**

In `src/app/[locale]/page.tsx`, render at top:
```tsx
const ld = {
  '@context': 'https://schema.org',
  '@type': 'EducationalOrganization',
  name: fullName || 'Al-Xorazmiy maktabi',
  alternateName: shortName,
  url: `${process.env.NEXT_PUBLIC_SITE_URL}/${locale}`,
  address: {
    '@type': 'PostalAddress',
    streetAddress: settings?.address || '',
    addressLocality: 'Nukus',
    addressRegion: "Qoraqalpog'iston",
    addressCountry: 'UZ'
  }
};
// ...
<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
```

- [ ] **Step 2: Per-page metadata with OG**

In each page's `generateMetadata`, add `openGraph` and `alternates.languages`.

### Task 9.5: Cleanup old vercel.json

**Files:**
- Delete: `vercel.json` (security headers now in `next.config.mjs`)

- [ ] **Step 1: Remove**

```bash
git rm vercel.json
```

Next.js doesn't need it — it auto-detects.

- [ ] **Step 2: Commit Phase 9**

```bash
npm run build  # Verify everything still builds
git add next.config.mjs public/manifest.json src/app/sitemap.ts src/app/robots.ts src/app/\[locale\]
git commit -m "Phase 9: PWA via next-pwa, dynamic sitemap, robots, JSON-LD, metadata"
```

---

## Phase 10 — QA + Deploy

**Agent:** tester-agent
**Deps:** Phases 5–9
**Output:** Production-ready Vercel deploy with all routes verified.

### Task 10.1: Full build verification

- [ ] **Step 1: Clean build**

```bash
rm -rf .next
npm run build
```

Expected: Exit 0. All routes appear in build summary. ISR routes show `(Static)` or `(ISR)`.

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck
```

Expected: No errors.

- [ ] **Step 3: Lint**

```bash
npm run lint
```

Expected: No errors.

### Task 10.2: Route smoke matrix

For each locale (uz, ru, kk, en) × each route, verify:

| Route | Check |
|-------|-------|
| `/` | Hero, stats animate, news/achievements render |
| `/about` | Settings full name visible |
| `/admission` | Static content renders |
| `/contact` | Form submits → /api/send-message → success |
| `/directions` | All 6 direction cards |
| `/faq` | Accordion expands, FAQ items load |
| `/gallery` | Images load from ImageKit |
| `/teachers` | Teacher cards render |
| `/achievements` | Olympiad results sorted |
| `/news` | News list, first 12 items |
| `/news/<id>` | News detail page, OG meta correct |

- [ ] **Step 1: Script smoke test**

```bash
npm run dev &
sleep 5
for locale in uz ru kk en; do
  for path in "" "/about" "/admission" "/contact" "/directions" "/faq" "/gallery" "/teachers" "/achievements" "/news"; do
    code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/$locale$path")
    echo "$locale$path -> $code"
  done
done
```

Expected: All 200.

### Task 10.3: Admin smoke test

- [ ] **Step 1: Manual flow**

Visit `/admin/login`, log in with test admin user. Navigate each page. Create a test news item, upload image, verify list updates. Delete test item.

### Task 10.4: Lighthouse

- [ ] **Step 1: Lighthouse on home + 2 other pages**

```bash
npm run build && npm run start &
npx lighthouse http://localhost:3000/uz --output html --output-path ./lighthouse-home.html
npx lighthouse http://localhost:3000/uz/news --output html --output-path ./lighthouse-news.html
npx lighthouse http://localhost:3000/uz/about --output html --output-path ./lighthouse-about.html
```

Expected: Performance ≥90, SEO ≥95, A11y ≥95, Best Practices ≥90.

### Task 10.5: Vercel preview deploy

- [ ] **Step 1: Push branch**

```bash
git push origin claude/sad-cray-a2f0f3
```

- [ ] **Step 2: Configure Vercel env vars**

In Vercel dashboard for the project, add all variables from `.env.local.example` with production values:
- `NEXT_PUBLIC_FIREBASE_*` (7 vars)
- `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`
- `NEXT_PUBLIC_IMAGEKIT_*` (2 vars)
- `IMAGEKIT_PRIVATE_KEY`
- `RESEND_API_KEY`, `ADMIN_EMAIL`
- `NEXT_PUBLIC_SITE_URL`

- [ ] **Step 3: Verify preview**

Open Vercel preview URL. Run same smoke matrix as 10.2.

- [ ] **Step 4: Production deploy**

After preview is verified, merge to `main`. Vercel auto-deploys production.

### Task 10.6: Final cleanup

- [ ] **Step 1: Verify no orphan files**

```bash
ls
```

Expected: No `*.html`, `js/`, `css/`, `admin/`, `lang/`, `api/`, `sw.js`. Only `src/`, `public/`, `docs/`, `node_modules/`, config files, `.git`, `.claude`.

- [ ] **Step 2: Update package.json description if needed**

- [ ] **Step 3: Final commit**

```bash
git add .
git commit -m "Phase 10: QA + cleanup — all routes verified, Lighthouse passing"
git push
```

---

## Plan Self-Review

**Spec coverage:**
- Goals (5) — ✅ all phases address them
- Tech stack — ✅ Phase 1 (Task 1.1 deps), Phase 3 (next-intl), Phase 9 (PWA)
- URL structure — ✅ Phase 3 (routing), Phase 1.3 (redirects)
- Project structure — ✅ all phases follow spec layout
- Rendering strategy (revalidate values) — ✅ each page declares `revalidate`
- i18n — ✅ Phase 3
- Theme — ✅ Phase 3.4 (with no-flash script in 3.3)
- Firebase client/admin/queries — ✅ Phase 2
- API routes — ✅ Phase 7 (CORS hardened)
- PWA — ✅ Phase 9
- Image strategy — ✅ Phase 2.7 (transformImage), Phase 6.1 (next/image candidate; using img+transformImage for now to match design)
- Security headers — ✅ Phase 1.3
- Sitemap/robots — ✅ Phase 9.2, 9.3
- Cleanup per phase — ✅ each phase deletes its old files
- Acceptance criteria — ✅ Phase 10.2-10.4

**Type consistency:** `getNewsList`, `getNewsById`, `getNewsIds`, `getTeachers`, `getOlympiad`, `getFaq`, `getGallery`, `getSettings` consistent across server-queries and page imports. Client-side `getDocuments`, `subscribeCollection`, `addDocument`, etc. consistent in admin pages.

**Placeholder scan:** A few "translate the rest of the HTML" notes for Phase 5.2 static pages and Phase 8.2 admin pages — these are large repetitive porting tasks where listing every line would bloat the plan beyond useful size. The pattern is established by Task 5.1 (home) and Task 8.1 (login); implementer follows it.

**Risk: Phase 5.2 and Phase 8.2 are loose** — they reference "translate the existing HTML to JSX preserving classnames" rather than listing every JSX line. This is intentional given plan size, but the implementing subagent should be given the source HTML file as part of its prompt.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-15-nextjs-migration.md`.

**Two execution options:**

**1. Subagent-Driven (recommended)** — Dispatch fresh subagent per phase (10 subagents total, some parallel), review checkpoint between phases. Best for this size of migration since context per phase is large.

**2. Inline Execution** — Run all phases in current session. Will exhaust context window before completing — not recommended.

**Recommendation: Subagent-Driven.** Each phase becomes one subagent dispatch with:
- The relevant phase section of this plan
- Pointers to source files (`old.html`, `js/old.js`)
- Permission to commit when verification passes

Phases 5+6+7+8 can run in parallel after Phase 4 completes — 4 subagents concurrent saves wall-clock time.
