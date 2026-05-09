import { Directive, ElementRef, HostListener, OnInit, OnDestroy, Renderer2 } from '@angular/core';

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

  constructor(private elRef: ElementRef<HTMLElement>, private renderer: Renderer2) {}

  ngOnInit(): void {
    this.el = this.elRef.nativeElement;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // Inject the glow overlay div
    this.glowEl = this.renderer.createElement('div');
    this.renderer.addClass(this.glowEl, 'cursor-glow-orb');
    this.renderer.appendChild(this.el, this.glowEl);
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.rafId);
  }

  @HostListener('mousemove', ['$event'])
  onMove(e: MouseEvent): void {
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

  @HostListener('mouseleave')
  onLeave(): void {
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
