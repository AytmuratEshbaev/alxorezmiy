'use client';
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  /** false — SSR va birinchi render (haqiqiy tema hali o'qilmagan). */
  resolved: boolean;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = 'theme';

function readStored(): Theme | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === 'dark' || v === 'light' ? v : null;
  } catch {
    return null;
  }
}

/**
 * Tema manbasi: <head>dagi inline skript bo'yoqdan oldin `data-theme` qo'yadi
 * (saqlangan tanlov yoki OS sozlamasi). Provider uni faqat o'qiydi — mount paytida
 * hech narsa yozmaydi, shuning uchun qorong'i tema foydalanuvchilarida yorug' "chaqnash"
 * bo'lmaydi. Foydalanuvchi o'zi almashtirmaguncha tanlov saqlanmaydi va OS o'zgarishlari
 * kuzatib boriladi.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const [resolved, setResolved] = useState(false);
  const explicit = useRef(false);

  useEffect(() => {
    const root = document.documentElement;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const stored = readStored();
    explicit.current = stored !== null;
    const applied = root.getAttribute('data-theme');
    const initial: Theme =
      stored ??
      (applied === 'dark' || applied === 'light' ? applied : mq.matches ? 'dark' : 'light');
    if (applied !== initial) root.setAttribute('data-theme', initial);
    setTheme(initial);
    setResolved(true);

    const onChange = (e: MediaQueryListEvent) => {
      if (explicit.current) return;
      const next: Theme = e.matches ? 'dark' : 'light';
      root.setAttribute('data-theme', next);
      setTheme(next);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    explicit.current = true;
    document.documentElement.setAttribute('data-theme', next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage unavailable (private mode) — tema faqat shu sahifa uchun qo'llanadi.
    }
    setTheme(next);
  };

  return (
    <ThemeContext.Provider value={{ theme, resolved, toggle }}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
