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
