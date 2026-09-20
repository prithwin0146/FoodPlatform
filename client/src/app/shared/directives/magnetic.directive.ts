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
 * [appMagnetic] — Professional press-and-lift interaction used by Stripe, Linear, Vercel.
 * Hover: slight scale-up + shadow lift. Click: scale-down (press feel). Release: spring back.
 *
 * S — Single Responsibility: owns only the press/lift visual feedback.
 * O — Open/Closed: hoverScale and pressScale are configurable inputs.
 *
 * Usage: <button appMagnetic>...</button>
 *        <button appMagnetic [hoverScale]="1.04" [pressScale]="0.96">...</button>
 */
@Directive({
  selector: '[appMagnetic]',
  standalone: true,
})
export class MagneticDirective implements OnInit, OnDestroy {
  /** Scale applied on hover — keep between 1.02–1.05 for subtlety */
  @Input() hoverScale = 1.03;
  /** Scale applied while button is pressed down */
  @Input() pressScale = 0.96;

  private el!: HTMLElement;
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly zone = inject(NgZone);

  private enterListener?: () => void;
  private downListener?: () => void;
  private upListener?: () => void;
  private leaveListener?: () => void;

  /** Transition used for hover in/out */
  private readonly HOVER_TRANSITION =
    'transform 0.18s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.18s ease';
  /** Faster transition for the press-down feel */
  private readonly PRESS_TRANSITION =
    'transform 0.08s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.08s ease';

  constructor(private elRef: ElementRef<HTMLElement>, private renderer: Renderer2) {}

  ngOnInit(): void {
    if (!this.isBrowser) return;
    this.el = this.elRef.nativeElement;
    this.renderer.setStyle(this.el, 'will-change', 'transform');
    this.renderer.setStyle(this.el, 'transition', this.HOVER_TRANSITION);

    this.enterListener = () => this.onEnter();
    this.downListener = () => this.onPress();
    this.upListener = () => this.onRelease();
    this.leaveListener = () => this.onLeave();

    this.zone.runOutsideAngular(() => {
      this.el.addEventListener('mouseenter', this.enterListener!);
      this.el.addEventListener('mousedown', this.downListener!);
      this.el.addEventListener('mouseup', this.upListener!);
      this.el.addEventListener('mouseleave', this.leaveListener!);
    });
  }

  ngOnDestroy(): void {
    if (!this.isBrowser || !this.el) return;
    if (this.enterListener) this.el.removeEventListener('mouseenter', this.enterListener);
    if (this.downListener) this.el.removeEventListener('mousedown', this.downListener);
    if (this.upListener) this.el.removeEventListener('mouseup', this.upListener);
    if (this.leaveListener) this.el.removeEventListener('mouseleave', this.leaveListener);
  }

  private onEnter(): void {
    if (!this.isBrowser || !this.el) return;
    this.renderer.setStyle(this.el, 'transition', this.HOVER_TRANSITION);
    this.el.style.transform = `scale(${this.hoverScale})`;
    this.el.style.boxShadow = '0 8px 24px rgba(0,0,0,0.25)';
  }

  private onPress(): void {
    if (!this.isBrowser || !this.el) return;
    this.renderer.setStyle(this.el, 'transition', this.PRESS_TRANSITION);
    this.el.style.transform = `scale(${this.pressScale})`;
    this.el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
  }

  private onRelease(): void {
    if (!this.isBrowser || !this.el) return;
    this.renderer.setStyle(this.el, 'transition', this.HOVER_TRANSITION);
    this.el.style.transform = `scale(${this.hoverScale})`;
    this.el.style.boxShadow = '0 8px 24px rgba(0,0,0,0.25)';
  }

  private onLeave(): void {
    if (!this.isBrowser || !this.el) return;
    this.renderer.setStyle(this.el, 'transition', this.HOVER_TRANSITION);
    this.el.style.transform = 'scale(1)';
    this.el.style.boxShadow = '';
  }
}
