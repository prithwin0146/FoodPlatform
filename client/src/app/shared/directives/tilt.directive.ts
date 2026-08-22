import {
  Directive,
  ElementRef,
  Input,
  OnInit,
  OnDestroy,
  Renderer2,
  PLATFORM_ID,
  inject,
  NgZone,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * [appTilt] — 3D card tilt + glare effect driven by CSS custom properties.
 * Used only on the marketing home page (restaurant-list) for visual impact.
 * All internal app cards (orders, tracking, dashboard) intentionally do NOT
 * use this directive to maintain a professional, static UI.
 * (SRP: owns only the tilt interaction behaviour)
 */
@Directive({
  selector: '[appTilt]',
  standalone: true,
})
export class TiltDirective implements OnInit, OnDestroy {
  @Input() tiltMax = 12;

  private el!: HTMLElement;
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  /** Tilt-on-mousemove is a hover concept; touch devices get no benefit from
   * it and paid the cost of a permanent preserve-3d/will-change compositing
   * layer for nothing since `mousemove` never fires there. Gate to
   * hover-capable + fine-pointer devices so mobile skips this entirely. */
  private readonly hoverCapable =
    this.isBrowser && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  private readonly zone = inject(NgZone);

  private enterListener?: () => void;
  private moveListener?: (e: MouseEvent) => void;
  private leaveListener?: () => void;

  constructor(private elRef: ElementRef<HTMLElement>, private renderer: Renderer2) {}

  ngOnInit(): void {
    if (!this.isBrowser || !this.hoverCapable) return;
    this.el = this.elRef.nativeElement;
    this.renderer.setStyle(this.el, 'transform-style', 'preserve-3d');
    this.renderer.setStyle(this.el, 'will-change', 'transform');
    this.renderer.setStyle(this.el, 'transition', 'transform 0.1s ease-out, box-shadow 0.1s ease-out');
    this.enterListener = () => this.onEnter();
    this.moveListener = (e: MouseEvent) => this.onMove(e);
    this.leaveListener = () => this.onLeave();

    this.zone.runOutsideAngular(() => {
      this.el.addEventListener('mouseenter', this.enterListener!);
      this.el.addEventListener('mousemove', this.moveListener!);
      this.el.addEventListener('mouseleave', this.leaveListener!);
    });
  }

  ngOnDestroy(): void {
    if (!this.isBrowser || !this.hoverCapable || !this.el) return;
    if (this.enterListener) this.el.removeEventListener('mouseenter', this.enterListener);
    if (this.moveListener) this.el.removeEventListener('mousemove', this.moveListener);
    if (this.leaveListener) this.el.removeEventListener('mouseleave', this.leaveListener);
  }

  private onEnter(): void {
    if (!this.isBrowser || !this.hoverCapable || !this.el) return;
    this.renderer.setStyle(this.el, 'transition', 'transform 0.08s ease-out, box-shadow 0.08s ease-out');
  }

  private onMove(e: MouseEvent): void {
    if (!this.isBrowser || !this.hoverCapable || !this.el) return;
    const rect = this.el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const rx = ((y - cy) / cy) * -this.tiltMax;
    const ry = ((x - cx) / cx) * this.tiltMax;

    this.el.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(12px)`;
    this.el.style.setProperty('--glare-x', `${(x / rect.width) * 100}%`);
    this.el.style.setProperty('--glare-y', `${(y / rect.height) * 100}%`);
    this.el.style.setProperty('--glare-opacity', '1');
    this.el.style.setProperty('--tilt-tx', `${(ry / this.tiltMax) * -8}px`);
    this.el.style.setProperty('--tilt-ty', `${(rx / this.tiltMax) * 8}px`);

    const shadowX = (ry / this.tiltMax) * 20;
    const shadowY = (-rx / this.tiltMax) * 20;
    this.el.style.boxShadow = `${shadowX}px ${shadowY}px 40px rgba(255, 87, 34, 0.25), 0 20px 60px rgba(0,0,0,0.15)`;
  }

  private onLeave(): void {
    if (!this.isBrowser || !this.hoverCapable || !this.el) return;
    this.renderer.setStyle(this.el, 'transition', 'transform 0.6s cubic-bezier(0.16,1,0.3,1), box-shadow 0.6s cubic-bezier(0.16,1,0.3,1)');
    this.el.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) translateZ(0)';
    this.el.style.boxShadow = '';
    this.el.style.setProperty('--glare-opacity', '0');
    this.el.style.setProperty('--tilt-tx', '0px');
    this.el.style.setProperty('--tilt-ty', '0px');
  }
}
