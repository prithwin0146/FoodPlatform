import { Directive, ElementRef, OnInit, OnDestroy, Renderer2, PLATFORM_ID, inject, NgZone } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * [appCursorGlow] — drives a radial ambient glow that follows the cursor
 * across the host element. Sets --cx / --cy CSS custom properties which
 * the host SCSS uses for a radial-gradient ::before overlay.
 *
 * SRP: owns cursor-tracking and CSS-var writing only.
 */
@Directive({
  selector: '[appCursorGlow]',
  standalone: true,
})
export class CursorGlowDirective implements OnInit, OnDestroy {
  private el!: HTMLElement;
  private glowEl!: HTMLElement;
  private rafId = 0;
  private targetX = 0;
  private targetY = 0;
  private currentX = 0;
  private currentY = 0;
  private active = false;

  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly zone = inject(NgZone);

  private moveListener?: (e: MouseEvent) => void;
  private leaveListener?: () => void;

  constructor(private elRef: ElementRef<HTMLElement>, private renderer: Renderer2) {}

  ngOnInit(): void {
    if (!this.isBrowser) return;
    this.el = this.elRef.nativeElement;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // Inject the glow overlay div
    this.glowEl = this.renderer.createElement('div');
    this.renderer.addClass(this.glowEl, 'cursor-glow-orb');
    this.renderer.appendChild(this.el, this.glowEl);

    this.moveListener = (e: MouseEvent) => this.onMove(e);
    this.leaveListener = () => this.onLeave();

    this.zone.runOutsideAngular(() => {
      this.el.addEventListener('mousemove', this.moveListener!);
      this.el.addEventListener('mouseleave', this.leaveListener!);
    });
  }

  ngOnDestroy(): void {
    if (!this.isBrowser) return;
    if (this.moveListener) this.el.removeEventListener('mousemove', this.moveListener);
    if (this.leaveListener) this.el.removeEventListener('mouseleave', this.leaveListener);
    cancelAnimationFrame(this.rafId);
  }

  private onMove(e: MouseEvent): void {
    const rect = this.el.getBoundingClientRect();
    this.targetX = e.clientX - rect.left;
    this.targetY = e.clientY - rect.top;
    if (!this.active) {
      this.active = true;
      this.currentX = this.targetX;
      this.currentY = this.targetY;
      this.renderer.setStyle(this.glowEl, 'opacity', '1');
      this.tick();
    }
  }

  private onLeave(): void {
    this.active = false;
    cancelAnimationFrame(this.rafId);
    this.renderer.setStyle(this.glowEl, 'opacity', '0');
  }

  private tick(): void {
    // Lerp for smooth lag
    this.currentX += (this.targetX - this.currentX) * 0.1;
    this.currentY += (this.targetY - this.currentY) * 0.1;

    this.renderer.setStyle(this.glowEl, 'transform',
      `translate(${this.currentX}px, ${this.currentY}px) translate(-50%, -50%)`);

    if (this.active) {
      this.rafId = requestAnimationFrame(() => this.tick());
    }
  }
}
