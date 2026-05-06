import {
  Directive,
  ElementRef,
  HostListener,
  Input,
  OnInit,
  Renderer2,
} from '@angular/core';

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
export class MagneticDirective implements OnInit {
  /** Scale applied on hover — keep between 1.02–1.05 for subtlety */
  @Input() hoverScale = 1.03;
  /** Scale applied while button is pressed down */
  @Input() pressScale = 0.96;

  private el!: HTMLElement;

  /** Transition used for hover in/out */
  private readonly HOVER_TRANSITION =
    'transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.18s ease';
  /** Faster transition for the press-down feel */
  private readonly PRESS_TRANSITION =
    'transform 0.08s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.08s ease';

  constructor(private elRef: ElementRef<HTMLElement>, private renderer: Renderer2) {}

  ngOnInit(): void {
    this.el = this.elRef.nativeElement;
    this.renderer.setStyle(this.el, 'will-change', 'transform');
    this.renderer.setStyle(this.el, 'transition', this.HOVER_TRANSITION);
  }

  @HostListener('mouseenter')
  onEnter(): void {
    this.renderer.setStyle(this.el, 'transition', this.HOVER_TRANSITION);
    this.el.style.transform = `scale(${this.hoverScale})`;
    this.el.style.boxShadow = '0 8px 24px rgba(0,0,0,0.25)';
  }

  @HostListener('mousedown')
  onPress(): void {
    this.renderer.setStyle(this.el, 'transition', this.PRESS_TRANSITION);
    this.el.style.transform = `scale(${this.pressScale})`;
    this.el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
  }

  @HostListener('mouseup')
  onRelease(): void {
    this.renderer.setStyle(this.el, 'transition', this.HOVER_TRANSITION);
    this.el.style.transform = `scale(${this.hoverScale})`;
    this.el.style.boxShadow = '0 8px 24px rgba(0,0,0,0.25)';
  }

  @HostListener('mouseleave')
  onLeave(): void {
    this.renderer.setStyle(this.el, 'transition', this.HOVER_TRANSITION);
    this.el.style.transform = 'scale(1)';
    this.el.style.boxShadow = '';
  }
}
