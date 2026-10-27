import Link from 'next/link';

// Locale prefiksidan tashqaridagi 404 (masalan, middleware'dan o'tmagan yo'llar).
// Root layout faqat `children` qaytaradi — shuning uchun o'z <html>/<body> si bor.
export default function RootNotFound() {
  return (
    <html lang="uz">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px 16px',
          fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
          background: '#f4f5f8',
          color: '#0f172a',
          textAlign: 'center',
        }}
      >
        <main style={{ maxWidth: 520 }}>
          <p style={{ fontSize: '5rem', fontWeight: 800, margin: 0, color: '#0d0d5c' }}>404</p>
          <h1 style={{ fontSize: '1.5rem', margin: '8px 0 12px' }}>Sahifa topilmadi</h1>
          <p style={{ color: '#475569', lineHeight: 1.6, margin: '0 0 24px' }}>
            Siz qidirgan sahifa mavjud emas yoki manzili o&lsquo;zgartirilgan.
          </p>
          <Link
            href="/uz"
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              borderRadius: 8,
              background: '#0d0d5c',
              color: '#ffffff',
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            ← Bosh sahifa
          </Link>
        </main>
      </body>
    </html>
  );
}
