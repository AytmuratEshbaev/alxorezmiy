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
  workboxOptions: {
    skipWaiting: true,
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
