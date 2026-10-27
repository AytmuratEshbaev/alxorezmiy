import { notFound } from 'next/navigation';

// Mavjud bo'lmagan har qanday /:locale/... yo'li — tarjima qilingan [locale]/not-found.tsx.
export default function CatchAllPage() {
  notFound();
}
