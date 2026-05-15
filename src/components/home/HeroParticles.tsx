'use client';
import { useEffect, useRef } from 'react';

export default function HeroParticles() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const config = {
      count: window.innerWidth < 768 ? 32 : 72,
      maxDist: 140,
      speed: 0.25,
      size: 1.6,
      mouseRadius: 180
    };
    let particles: { x: number; y: number; vx: number; vy: number }[] = [];
    let w = 0;
    let h = 0;
    const mouse: { x: number | null; y: number | null } = { x: null, y: null };
    let visible = true;
    let raf = 0;

    const resize = () => {
      const rect = canvas.parentElement!.getBoundingClientRect();
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
        vy: (Math.random() - 0.5) * config.speed * dpr
      }));
    };
    const draw = () => {
      const maxDist = config.maxDist * dpr;
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
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < maxDist) {
            const op = (1 - d / maxDist) * 0.32;
            ctx.strokeStyle = `rgba(245, 158, 11, ${op})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
      if (mouse.x !== null && mouse.y !== null) {
        const mr = config.mouseRadius * dpr;
        for (const p of particles) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < mr) {
            const op = (1 - d / mr) * 0.55;
            ctx.strokeStyle = `rgba(251, 191, 36, ${op})`;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.stroke();
          }
        }
      }
      ctx.fillStyle = 'rgba(252, 211, 77, 0.65)';
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, config.size * dpr, 0, Math.PI * 2);
        ctx.fill();
      }
    };
    const loop = () => {
      if (visible) draw();
      raf = requestAnimationFrame(loop);
    };
    const onResize = () => {
      resize();
      create();
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
    const obs = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !raf) raf = requestAnimationFrame(loop);
      else if (!visible && raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    });
    resize();
    create();
    obs.observe(canvas);
    window.addEventListener('resize', onResize, { passive: true });
    canvas.addEventListener('mousemove', onMove, { passive: true });
    canvas.addEventListener('mouseleave', onLeave);
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      obs.disconnect();
      window.removeEventListener('resize', onResize);
      canvas.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  return <canvas ref={ref} className="hero-canvas" aria-hidden="true" />;
}
