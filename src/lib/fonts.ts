import { Geist, Geist_Mono } from 'next/font/google';

// Self-hosted at build time via next/font — no render-blocking font requests.
// latin-ext covers Karakalpak (ǵ ń ı ú ó á), cyrillic covers Russian.
export const geistSans = Geist({
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  display: 'swap',
  variable: '--font-geist'
});

export const geistMono = Geist_Mono({
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  display: 'swap',
  variable: '--font-geist-mono'
});

export const fontVariables = `${geistSans.variable} ${geistMono.variable}`;
