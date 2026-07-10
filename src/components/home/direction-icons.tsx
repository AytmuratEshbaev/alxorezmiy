import type { ReactNode } from 'react';

// Shared subject icons for the six academic directions.
// Used by both the home DirectionsGrid and the /directions page so the same
// subject always renders the same custom SVG. Thin (1.8) stroke to match the
// original home-page direction cards.
export const DIRECTION_SUBJECTS = [
  'math',
  'physics',
  'informatics',
  'chemistry',
  'biology',
  'languages',
] as const;

export type DirectionSubject = (typeof DIRECTION_SUBJECTS)[number];

const PATHS: Record<DirectionSubject, ReactNode> = {
  math: (
    <>
      <path d="M9 4H5a1 1 0 0 0-1 1v4M15 4h4a1 1 0 0 1 1 1v4M4 15v4a1 1 0 0 0 1 1h4M20 15v4a1 1 0 0 1-1 1h-4" />
      <path d="M8 12h8M12 8v8" />
    </>
  ),
  physics: (
    <>
      <circle cx="12" cy="12" r="2" />
      <ellipse cx="12" cy="12" rx="10" ry="4" />
      <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)" />
      <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(-60 12 12)" />
    </>
  ),
  informatics: (
    <>
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
      <line x1="13" y1="4" x2="11" y2="20" strokeDasharray="2 2" />
    </>
  ),
  chemistry: (
    <>
      <path d="M9 3v6L4 19a2 2 0 0 0 2 3h12a2 2 0 0 0 2-3L15 9V3" />
      <line x1="9" y1="3" x2="15" y2="3" />
      <circle cx="10" cy="16" r="1" fill="currentColor" />
      <circle cx="14" cy="14" r="1" fill="currentColor" />
    </>
  ),
  biology: (
    <>
      <path d="M4 3c0 6 8 10 8 18c0-8 8-12 8-18" />
      <path d="M4 3c4 2 12 2 16 0" />
      <path d="M5 8c4 1 10 1 14 0" />
      <path d="M6 13c3 1 9 1 12 0" />
    </>
  ),
  languages: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10a15.3 15.3 0 0 1-4 10M12 2a15.3 15.3 0 0 0-4 10a15.3 15.3 0 0 0 4 10" />
    </>
  ),
};

export function DirectionIcon({ subject }: { subject: DirectionSubject }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[subject]}
    </svg>
  );
}
