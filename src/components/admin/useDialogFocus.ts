'use client';
import { useEffect, type KeyboardEvent as ReactKeyboardEvent, type RefObject } from 'react';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function visibleFocusables(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => el.offsetParent !== null || el === document.activeElement
  );
}

/**
 * Dialog uchun fokus boshqaruvi: ochilganda ichkariga fokus (`[data-autofocus]` yoki birinchi
 * maydon), yopilganda avvalgi elementga qaytarish. Tab tutqichi `trapTab` orqali.
 */
export function useDialogFocus(ref: RefObject<HTMLElement>, active = true): void {
  useEffect(() => {
    if (!active) return;
    const root = ref.current;
    if (!root) return;
    const previous = document.activeElement as HTMLElement | null;
    const preferred = root.querySelector<HTMLElement>('[data-autofocus]');
    const target =
      preferred ??
      visibleFocusables(root).find((el) => !el.classList.contains('modal-close')) ??
      root;
    target.focus({ preventScroll: false });
    return () => {
      if (previous && document.contains(previous)) previous.focus({ preventScroll: true });
    };
  }, [ref, active]);
}

/** onKeyDown handler: Tab/Shift+Tab fokusni dialog ichida aylantiradi. */
export function trapTab(e: ReactKeyboardEvent<HTMLElement>): void {
  if (e.key !== 'Tab') return;
  const root = e.currentTarget;
  const list = visibleFocusables(root);
  if (list.length === 0) {
    e.preventDefault();
    return;
  }
  const first = list[0];
  const last = list[list.length - 1];
  const current = document.activeElement;
  if (e.shiftKey && (current === first || !root.contains(current))) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && (current === last || !root.contains(current))) {
    e.preventDefault();
    first.focus();
  }
}
