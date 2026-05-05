import { Injectable, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  color: string; w: number; h: number;
  rotation: number; rotSpeed: number;
  alpha: number;
}

/**
 * SRP: owns canvas-confetti burst animation only.
 * OCP: new burst styles via optional config param.
 */
@Injectable({ providedIn: 'root' })
export class ConfettiService {
  private readonly doc = inject(DOCUMENT);

  burst(originX?: number, originY?: number): void {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const canvas = this.doc.createElement('canvas');
    Object.assign(canvas.style, {
      position: 'fixed', inset: '0', width: '100%', height: '100%',
      pointerEvents: 'none', zIndex: '9999',
    });
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    this.doc.body.appendChild(canvas);

    const ctx = canvas.getContext('2d')!;
    const colors = ['#ff6b1a', '#ff3d8a', '#6e3aff', '#1fa363', '#ffb020', '#ffffff', '#ff7a00'];
    const cx = originX ?? canvas.width  / 2;
    const cy = originY ?? canvas.height * 0.42;

    const particles: Particle[] = Array.from({ length: 130 }, () => {
      const angle = Math.random() * Math.PI * 2;
      const speed = 5 + Math.random() * 13;
      return {
        x: cx, y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 8,
        color: colors[Math.floor(Math.random() * colors.length)],
        w: 5 + Math.random() * 8,
        h: 3 + Math.random() * 5,
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 12,
        alpha: 1,
      };
    });

    const duration = 2600;
    const startTime = performance.now();

    const frame = (now: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const t = Math.min((now - startTime) / duration, 1);
      let alive = false;

      for (const p of particles) {
        p.vy += 0.38;   // gravity
        p.vx *= 0.985;  // air drag
        p.x  += p.vx;
        p.y  += p.vy;
        p.rotation += p.rotSpeed;
        p.alpha = Math.max(0, 1 - t * 1.3);

        if (p.alpha > 0) {
          alive = true;
          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
          ctx.restore();
        }
      }

      if (alive && t < 1) requestAnimationFrame(frame);
      else canvas.remove();
    };

    requestAnimationFrame(frame);
  }
}
