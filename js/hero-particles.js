// ============================================
// HERO PARTICLES — Geometric network animation
// ============================================
// Canvas-based, ~3KB, performance-friendly
// Respects prefers-reduced-motion

(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  class HeroParticles {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.particles = [];
      this.mouse = { x: null, y: null };
      this.dpr = window.devicePixelRatio || 1;
      this.config = {
        count: window.innerWidth < 768 ? 32 : 72,
        maxDist: 140,
        speed: 0.25,
        size: 1.6,
        mouseRadius: 180
      };
      this.init();
    }

    init() {
      this.resize();
      this.createParticles();
      window.addEventListener('resize', () => this.resize(), { passive: true });
      this.canvas.addEventListener('mousemove', (e) => {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = (e.clientX - rect.left) * this.dpr;
        this.mouse.y = (e.clientY - rect.top) * this.dpr;
      }, { passive: true });
      this.canvas.addEventListener('mouseleave', () => {
        this.mouse.x = null;
        this.mouse.y = null;
      });
      // Pause when not visible (performance)
      const obs = new IntersectionObserver(([e]) => {
        this.visible = e.isIntersecting;
      });
      obs.observe(this.canvas);
      this.visible = true;
      this.loop();
    }

    resize() {
      const rect = this.canvas.parentElement.getBoundingClientRect();
      this.canvas.width = rect.width * this.dpr;
      this.canvas.height = rect.height * this.dpr;
      this.canvas.style.width = rect.width + 'px';
      this.canvas.style.height = rect.height + 'px';
      this.w = this.canvas.width;
      this.h = this.canvas.height;
    }

    createParticles() {
      this.particles = [];
      for (let i = 0; i < this.config.count; i++) {
        this.particles.push({
          x: Math.random() * this.w,
          y: Math.random() * this.h,
          vx: (Math.random() - 0.5) * this.config.speed * this.dpr,
          vy: (Math.random() - 0.5) * this.config.speed * this.dpr
        });
      }
    }

    loop() {
      if (this.visible) this.draw();
      requestAnimationFrame(() => this.loop());
    }

    draw() {
      const ctx = this.ctx;
      const maxDist = this.config.maxDist * this.dpr;
      ctx.clearRect(0, 0, this.w, this.h);

      // Update positions
      for (const p of this.particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = this.w;
        else if (p.x > this.w) p.x = 0;
        if (p.y < 0) p.y = this.h;
        else if (p.y > this.h) p.y = 0;
      }

      // Lines between particles (geometric mesh)
      ctx.lineWidth = this.dpr;
      for (let i = 0; i < this.particles.length; i++) {
        const a = this.particles[i];
        for (let j = i + 1; j < this.particles.length; j++) {
          const b = this.particles[j];
          const dx = a.x - b.x, dy = a.y - b.y;
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

      // Mouse interaction — gradient line
      if (this.mouse.x !== null) {
        const mr = this.config.mouseRadius * this.dpr;
        for (const p of this.particles) {
          const dx = p.x - this.mouse.x, dy = p.y - this.mouse.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < mr) {
            const op = (1 - d / mr) * 0.55;
            ctx.strokeStyle = `rgba(251, 191, 36, ${op})`;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(this.mouse.x, this.mouse.y);
            ctx.stroke();
          }
        }
      }

      // Particles (dots) — amber
      ctx.fillStyle = 'rgba(252, 211, 77, 0.65)';
      for (const p of this.particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, this.config.size * this.dpr, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function mount() {
    const hero = document.querySelector('.hero');
    if (!hero || hero.querySelector('.hero-canvas')) return;
    const canvas = document.createElement('canvas');
    canvas.className = 'hero-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    hero.insertBefore(canvas, hero.firstChild);
    new HeroParticles(canvas);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
