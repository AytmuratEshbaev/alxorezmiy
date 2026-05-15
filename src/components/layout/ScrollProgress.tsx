'use client';
import { useEffect, useState } from 'react';

export default function ScrollProgress() {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const update = () => {
      const h = document.documentElement;
      const denom = h.scrollHeight - h.clientHeight;
      setPct(denom > 0 ? (h.scrollTop / denom) * 100 : 0);
    };
    window.addEventListener('scroll', update, { passive: true });
    update();
    return () => window.removeEventListener('scroll', update);
  }, []);
  return <div className="scroll-progress" style={{ width: `${pct}%` }} />;
}
