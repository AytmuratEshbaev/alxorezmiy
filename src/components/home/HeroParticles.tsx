'use client';
import { useEffect, useRef } from 'react';

// Chiziqlar shaffofligi bo'yicha guruhlanadi: har kadrda har bir juft uchun alohida
// stroke() o'rniga har guruhga bitta yo'l va bitta stroke() — GPU/CPU ishi bir necha marta kam.
const BUCKETS = 6;

/** Kuchsiz qurilma, kichik ekran, trafikni tejash yoki reduced-motion — animatsiya yo'q. */
function shouldAnimate(): boolean {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  if (window.innerWidth < 768) return false;
  const cores = navigator.hardwareConcurrency;
  if (typeof cores === 'number' && cores > 0 && cores <= 4) return false;
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  if (conn?.saveData) return false;
  return true;
}

export default function HeroParticles() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!shouldAnimate()) return;
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const config = {
      count: window.innerWidth < 1280 ? 36 : 44,
      maxDist: 140,
      speed: 0.25,
      size: 1.6,
      mouseRadius: 180,
    };
    let particles: { x: number; y: number; vx: number; vy: number }[] = [];
    let w = 0;
    let h = 0;
    let cssW = 0;
    const mouse: { x: number | null; y: number | null } = { x: null, y: null };
    let inView = true;
    let raf = 0;
    const lineBuckets: Path2D[] = [];

    const resize = () => {
      const rect = canvas.parentElement!.getBoundingClientRect();
      cssW = rect.width;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      w = canvas.width;
      h = canvas.height;
    };
    const create = () => {
      particles = Array.from({ length: config.count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * config.speed * dpr,
        vy: (Math.random() - 0.5) * config.speed * dpr,
      }));
    };
    const strokeBuckets = (rgb: string, maxOpacity: number) => {
      for (let b = 0; b < BUCKETS; b++) {
        ctx.strokeStyle = `rgba(${rgb}, ${(((b + 1) / BUCKETS) * maxOpacity).toFixed(3)})`;
        ctx.stroke(lineBuckets[b]);
      }
    };
    const draw = () => {
      const maxDist = config.maxDist * dpr;
      const maxDist2 = maxDist * maxDist;
      ctx.clearRect(0, 0, w, h);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = w;
        else if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        else if (p.y > h) p.y = 0;
      }
      ctx.lineWidth = dpr;
      for (let b = 0; b < BUCKETS; b++) lineBuckets[b] = new Path2D();
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const bp = particles[j];
          const dx = a.x - bp.x;
          const dy = a.y - bp.y;
          const d2 = dx * dx + dy * dy;
          if (d2 >= maxDist2) continue;
          const strength = 1 - Math.sqrt(d2) / maxDist;
          const bucket = Math.min(BUCKETS - 1, Math.floor(strength * BUCKETS));
          lineBuckets[bucket].moveTo(a.x, a.y);
          lineBuckets[bucket].lineTo(bp.x, bp.y);
        }
      }
      strokeBuckets('245, 158, 11', 0.32);

      if (mouse.x !== null && mouse.y !== null) {
        const mr = config.mouseRadius * dpr;
        const mr2 = mr * mr;
        for (let b = 0; b < BUCKETS; b++) lineBuckets[b] = new Path2D();
        for (const p of particles) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const d2 = dx * dx + dy * dy;
          if (d2 >= mr2) continue;
          const strength = 1 - Math.sqrt(d2) / mr;
          const bucket = Math.min(BUCKETS - 1, Math.floor(strength * BUCKETS));
          lineBuckets[bucket].moveTo(p.x, p.y);
          lineBuckets[bucket].lineTo(mouse.x, mouse.y);
        }
        strokeBuckets('251, 191, 36', 0.55);
      }

      ctx.fillStyle = 'rgba(252, 211, 77, 0.65)';
      ctx.beginPath();
      const r = config.size * dpr;
      for (const p of particles) {
        ctx.moveTo(p.x + r, p.y);
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      }
      ctx.fill();
    };
    const loop = () => {
      draw();
      raf = requestAnimationFrame(loop);
    };
    const start = () => {
      if (!raf && inView && !document.hidden) raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };

    let resizeTimer = 0;
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        // Mobil brauzerlarda manzil paneli yashirilganda faqat balandlik o'zgaradi —
        // zarrachalarni qayta yaratmaymiz.
        const widthChanged = canvas.parentElement!.getBoundingClientRect().width !== cssW;
        resize();
        if (widthChanged) create();
      }, 150);
    };
    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = (e.clientX - rect.left) * dpr;
      mouse.y = (e.clientY - rect.top) * dpr;
    };
    const onLeave = () => {
      mouse.x = null;
      mouse.y = null;
    };
    const onVisibility = () => (document.hidden ? stop() : start());
    const obs = new IntersectionObserver(([e]) => {
      inView = e.isIntersecting;
      if (inView) start();
      else stop();
    });

    resize();
    create();
    obs.observe(canvas);
    window.addEventListener('resize', onResize, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);
    // Canvas kontent ostida (z-index 0) — sichqonchani butun hero bo'yicha kuzatamiz.
    const host = canvas.parentElement!;
    host.addEventListener('mousemove', onMove, { passive: true });
    host.addEventListener('mouseleave', onLeave);
    start();
    return () => {
      stop();
      window.clearTimeout(resizeTimer);
      obs.disconnect();
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
      host.removeEventListener('mousemove', onMove);
      host.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  return <canvas ref={ref} className="hero-canvas" aria-hidden="true" />;
}
