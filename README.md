# alxorezmiy.uz

Muhammad al-Xorazmiy nomidagi ixtisoslashtirilgan maktab (Nukus filiali) rasmiy sayti.
4 tilli (uz / ru / kk / en) Next.js 15 ilova va admin panel. To'liq **Cloudflare** ustida ishlaydi.

## Arxitektura

| Qism | Texnologiya |
| --- | --- |
| Hosting | Cloudflare Workers + [`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare) |
| Baza | Cloudflare D1 (SQLite) — `migrations/` |
| Rasmlar | Cloudflare R2 (`MEDIA` bucket) + Image Transformations (`/cdn-cgi/image/`) |
| Admin kirish | O'z tizimi: D1 `admins`/`sessions`, PBKDF2 parol, HttpOnly cookie |
| Spamdan himoya | Cloudflare Turnstile + Workers Rate Limiting + honeypot |
| Email | Resend (yangi xabar/ariza haqida admin'ga bildirishnoma) |
| i18n | next-intl |
| PWA | @ducanh2912/next-pwa |

```text
src/
  app/[locale]/        Ommaviy sahifalar (har so'rovda D1'dan o'qiladi)
  app/admin/(panel)/   Admin sahifalari (sessiya serverda tekshiriladi)
  app/admin/login/     Kirish sahifasi
  app/api/admin/*      Admin API (sessiya + same-origin tekshiruvi)
  app/api/{apply,send-message}   Ommaviy formalar
  app/api/public/*     Qidiruv indeksi, "ko'proq yuklash"
  app/media/[...key]   R2'dagi rasmlarni berish
  lib/db/              D1 so'rovlari, CRUD, jadval whitelist'i
  lib/auth/            Parol va sessiya
migrations/            D1 sxemasi
scripts/create-admin.mjs   Admin foydalanuvchi yaratish / parolni tiklash
wrangler.jsonc         Worker konfiguratsiyasi va binding'lar
```

## Deploy (bir martalik sozlash)

> Talab: Node.js 20+, Cloudflare akkaunti, domen Cloudflare'ga ulangan bo'lishi.
> Workers **Paid** ($5/oy) tarifi tavsiya etiladi: Free tarifda har so'rovga 10 ms CPU limiti bor,
> Next.js SSR esa ba'zan bundan oshadi.

1. **Kirish:** `npx wrangler login`
2. **D1 baza:** `npx wrangler d1 create alxorezmiy-db` → chiqqan `database_id` ni `wrangler.jsonc` ga qo'ying.
3. **Sxema:** `npm run db:migrate:remote`
4. **R2 bucket:** `npx wrangler r2 bucket create alxorezmiy-media`
5. **Turnstile:** Dashboard → Turnstile → Add widget (domen: `alxorezmiy.uz`, mode: *Managed*).
   - Site Key → `.env.production` dagi `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
   - Secret Key → `npx wrangler secret put TURNSTILE_SECRET_KEY`
   - ⚠️ **Ikkalasi ham majburiy.** Production'da secret bo'lmasa formalar xavfsizlik uchun yopiq
     turadi (fail-closed), site key bo'lmasa esa brauzer token yubormaydi va xabarlar rad etiladi.
6. **Secret'lar:**

   ```bash
   npx wrangler secret put RESEND_API_KEY
   npx wrangler secret put ADMIN_EMAIL        # bir nechta bo'lsa vergul bilan
   ```

   `RESEND_FROM` (`wrangler.jsonc` → `vars`): domeningiz Resend'da tasdiqlangach
   `Al-Xorazmiy <noreply@alxorezmiy.uz>` ga almashtiring (`onboarding@resend.dev` faqat Resend
   akkaunti egasiga xat yubora oladi).
7. **Deploy:** `npm run deploy`
8. **Domen:** Workers → `alxorezmiy` → Settings → Domains & Routes → `alxorezmiy.uz` va
   `www.alxorezmiy.uz` ni Custom Domain qilib qo'shing. `*.workers.dev` manzili ataylab
   o'chirilgan (`workers_dev: false`) — sayt faqat o'z domenida ochiladi.
9. **Rasm o'lchamlash:** Dashboard → domen → Images → Transformations → **Enable**.
   (Yoqilmasa, `.env.production` da `NEXT_PUBLIC_IMAGE_RESIZING=0` qilib qayta deploy qiling.)
10. **Birinchi admin:**

    ```bash
    npm run admin:create -- --email admin@alxorezmiy.uz --name "Ism Familiya" --remote
    ```

    Parolni unutsangiz ham shu buyruq bilan yangisini o'rnatasiz (sessiyalar bekor bo'ladi).
11. `https://alxorezmiy.uz/admin` → kirib, **Sozlamalar** bo'limida maktab ma'lumotlarini to'ldiring.

### Git orqali avtomatik deploy (ixtiyoriy)

Workers → Create → Import a repository (Workers Builds):

- Build command: `npx opennextjs-cloudflare build`
- Deploy command: `npx opennextjs-cloudflare deploy`
- `NEXT_PUBLIC_*` qiymatlari `.env.production` dan olinadi (yoki Build variables'ga qo'shing).

## Kesh va xavfsizlik qatlami (`worker.ts`)

`worker.ts` OpenNext handler'ini o'rab oladi:

- **Edge kesh:** ommaviy sahifalar, `/api/public/*` va sitemap Cloudflare Cache API'da 30 daqiqagacha
  saqlanadi. Admin panelda biror narsa saqlansa D1'dagi `cache_version` oshadi va barcha sahifalar
  darhol yangilanadi. Javobda `X-Edge-Cache: HIT/MISS` headeri bor. Cache API faqat Custom Domain'da ishlaydi.
- **CSP:** har so'rovga yangi nonce bilan `Content-Security-Policy` (keshdan berilganda ham nonce
  almashtiriladi), HSTS va boshqa xavfsizlik headerlari. Statik fayllar uchun headerlar `public/_headers` da.
- Yangi tashqi skript yoki iframe qo'shsangiz, `worker.ts` dagi `csp()` ro'yxatini yangilang.

## Lokal ishlab chiqish

```bash
npm install
cp .dev.vars.example .dev.vars   # ixtiyoriy secret'lar
npm run db:migrate:local
npm run admin:create -- --email you@example.com --local
npm run dev                      # http://localhost:3000
```

`next dev` D1/R2 binding'larini lokal (miniflare) orqali ulaydi. Windows'da `workerd` ishga
tushmasa, [Visual C++ Redistributable](https://aka.ms/vs/17/release/vc_redist.x64.exe) ning
eng so'nggi versiyasini o'rnating.

| Buyruq | Vazifasi |
| --- | --- |
| `npm run dev` | Lokal server |
| `npm run typecheck` / `npm run lint` | Tekshiruvlar |
| `npm run preview` | Worker'ni lokal workerd'da ishga tushirish |
| `npm run deploy` | Build + Cloudflare'ga deploy |
| `npm run db:migrate:local` / `:remote` | D1 migratsiyalari |
| `npm run admin:create` | Admin qo'shish / parolni tiklash |
| `npm run cf-typegen` | `wrangler.jsonc` o'zgarganda env turlarini yangilash |

## Yangi migratsiya qo'shish

```bash
npx wrangler d1 migrations create DB <nom>   # migrations/000N_<nom>.sql
npm run db:migrate:local && npm run db:migrate:remote
```

Yangi ustun admin orqali yozilishi kerak bo'lsa, uni `src/lib/db/schema.ts` dagi whitelist'ga ham qo'shing.
