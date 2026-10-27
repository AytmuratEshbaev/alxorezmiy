import createNextIntlPlugin from 'next-intl/plugin';
import withPWAInit from '@ducanh2912/next-pwa';
import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';

// `next dev` ichida D1/R2/rate-limit binding'larini (lokal miniflare) ulaydi.
if (process.env.NODE_ENV === 'development') initOpenNextCloudflareForDev();

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const pwa = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  // "/" → "/uz" redirect'ini keshlab qo'ymaslik uchun (offline'da bo'sh sahifa chiqardi).
  cacheStartUrl: false,
  // Birinchi tashrifda yuklanadigan precache'ni kichraytirish: katta hero rasmi va _headers.
  publicExcludes: ['!noprecache/**/*', '!assets/images/hero.webp', '!_headers'],
  workboxOptions: {
    skipWaiting: true,
    // Admin panel, Pages Router qoldiqlari va polyfill'lar oddiy tashrifchiga kerak emas.
    exclude: [
      /\.map$/,
      /^manifest.*\.js$/,
      /app\/admin\//,
      /chunks\/pages\//,
      /polyfills-/,
      /_buildManifest\.js$/,
      /_ssgManifest\.js$/,
    ],
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'google-fonts',
          expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
        },
      },
      {
        // Cloudflare Image Resizing natijalari va R2 media fayllari (o'zgarmas URL'lar).
        urlPattern: ({ url, sameOrigin }) =>
          sameOrigin &&
          (url.pathname.startsWith('/cdn-cgi/image/') || url.pathname.startsWith('/media/')),
        handler: 'CacheFirst',
        options: {
          cacheName: 'site-images',
          expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
        },
      },
      {
        urlPattern: /\/api\/.*/i,
        handler: 'NetworkOnly',
      },
    ],
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    loader: 'custom',
    loaderFile: './src/lib/image-loader.ts',
    // Kamroq noyob o'lcham — Cloudflare Transformations bepul kvotasi (5000/oy) va kesh samaradorligi.
    deviceSizes: [640, 828, 1200, 1920],
    imageSizes: [96, 256, 384],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
  async redirects() {
    return [
      // Legacy: /news/abc → /uz/news/abc
      { source: '/news/:id', destination: '/uz/news/:id', permanent: true },
    ];
  },
};

export default pwa(withNextIntl(nextConfig));
