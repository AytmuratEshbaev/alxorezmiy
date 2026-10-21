// Maktab logotipi (public/assets/images/logo.webp) geometriyasi asosidagi vektor belgisi.
// Rang `currentColor` dan olinadi: light rejimda brend teal, dark rejimda och kulrang —
// shuning uchun dark rejimda oq fon/doira kerak emas.
export default function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="8 72 978 815"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="8" y="72" width="154" height="813" />
      <rect x="199" y="72" width="153" height="403" />
      <circle cx="592" cy="273" r="201" />
      <circle cx="398" cy="686" r="201" />
      <rect x="639" y="485" width="153" height="401" />
      <rect x="833" y="72" width="153" height="813" />
    </svg>
  );
}
