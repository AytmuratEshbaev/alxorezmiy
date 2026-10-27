import type { ReactNode } from 'react';

/** Forma natijasi qutisi (muvaffaqiyat / xato / ma'lumot) — ranglar CSS'da, ≥4.5:1. */
export default function FormStatus({
  kind,
  children,
}: {
  kind: 'success' | 'error' | 'info';
  children: ReactNode;
}) {
  return <p className={`form-status form-status-${kind}`}>{children}</p>;
}

/** Aylanuvchi indikator (prefers-reduced-motion'da to'xtaydi — globals.css `.spinner`). */
export function Spinner({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
      className="spinner"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

export function SendIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
    </svg>
  );
}
