import {
  Directive,
  ElementRef,
  Input,
  OnInit,
  OnDestroy,
  PLATFORM_ID,
  inject,
  NgZone,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * [appRadialSelect] — Adds an animated radial-gradient glow that follows
 * focus / click on the host element (typically a select, search input, or
 * pill button). Consumer must style `.radial-glow` ::before/::after for the
 * visual to appear; the directive only positions the gradient origin.
 *
 * Usage:
 *   <select appRadialSelect></select>
 *   <div class="radial-glow" appRadialSelect</div>
 *
 * The host receives a `--rx` and `--ry` (0..1) CSS custom property each
 * pointermove, which can be used inside the consumer's ::before to position
 * the radial gradient.
 */
@Directive({
  selector: '[appRadialSelect]',
  standalone: true,
})
export class RadialSelectDirective implements OnInit, OnDestroy {
  /** CSS variable name for the gradient's X origin (set on host). */
  @Input() radialXVar = '--rx';
  /** CSS variable name for the gradient's Y origin (set on host). */
  @Input() radialYVar = '--ry';

  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly zone = inject(NgZone);
  private active = false;

  private moveListener?: (e: PointerEvent) => void;
  private leaveListener?: () => void;

  constructor(private elRef: ElementRef<HTMLElement>) {}

  ngOnInit(): void {
    if (!this.isBrowser) return;
    const host = this.elRef.nativeElement;
    host.style.setProperty(this.radialXVar, '0.5');
    host.style.setProperty(this.radialYVar, '0.5');

    this.moveListener = (e: PointerEvent) => this.onPointerMove(e);
    this.leaveListener = () => this.onLeave();

    this.zone.runOutsideAngular(() => {
      host.addEventListener('pointermove', this.moveListener!);
      host.addEventListener('pointerleave', this.leaveListener!);
      host.addEventListener('blur', this.leaveListener!);
    });
  }

  ngOnDestroy(): void {
    if (!this.isBrowser) return;
    const host = this.elRef.nativeElement;
    if (this.moveListener) host.removeEventListener('pointermove', this.moveListener);
    if (this.leaveListener) {
      host.removeEventListener('pointerleave', this.leaveListener);
      host.removeEventListener('blur', this.leaveListener);
    }
  }

  private onPointerMove(ev: PointerEvent): void {
    if (!this.isBrowser) return;
    const host = this.elRef.nativeElement;
    const rect = host.getBoundingClientRect();
    const rx = (ev.clientX - rect.left) / rect.width;
    const ry = (ev.clientY - rect.top) / rect.height;
    host.style.setProperty(this.radialXVar, rx.toFixed(3));
    host.style.setProperty(this.radialYVar, ry.toFixed(3));
    if (!this.active) {
      host.classList.add('radial-active');
      this.active = true;
    }
  }

  private onLeave(): void {
    if (!this.isBrowser) return;
    const host = this.elRef.nativeElement;
    host.classList.remove('radial-active');
    this.active = false;
  }
}
