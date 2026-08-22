import {
  Directive,
  ElementRef,
  HostListener,
  Input,
  OnInit,
  PLATFORM_ID,
  inject,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * [appParallaxHover] — Translates direct children in 3D opposite to the
 * pointer, with per-child depth read from the child's
 * [data-parallax-depth] attribute (higher = further from viewer = more motion).
 *
 * SRP: pointer→transform projection only. Visual styling stays in the consumer.
 *
 * Usage:
 *   <div appParallaxHover [parallaxMax]="14">
 *     <div data-parallax-depth="1">…</div>
 *     <div data-parallax-depth="2">…</div>   <!-- moves more -->
 *  </div>
 */
@Directive({
  selector: '[appParallaxHover]',
  standalone: true,
})
export class ParallaxHoverDirective implements OnInit {
  /** Maximum pixel travel in any axis (per unit of depth). */
  @Input() parallaxMax = 12;
  /** Perspective applied to the host so child translations read as 3D. */
  @Input() parallaxPerspective = 900;
  /** Lerp factor (0..1). Higher = snappier, lower = driftier. */
  @Input() parallaxLerp = 0.22;
  /** Selector for participating layers; default = children with [data-parallax-depth]. */
  @Input() parallaxLayerSelector = '[data-parallax-depth]';

  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  /**
   * Parallax-on-pointer is a hover concept — it means nothing on touch and,
   * critically, touch input never reliably fires `pointerleave` (there is no
   * real "leave" event for a lifted finger on most mobile browsers). That
   * left `active` stuck `true` forever after the first touch, which combined
   * with the settle-check bug below caused an INFINITE requestAnimationFrame
   * loop that ran for the rest of the page's life — permanently saturating
   * the main thread and making the whole page feel frozen on mobile. Gating
   * the entire directive to fine-pointer + hover-capable devices removes the
   * bug class entirely (mobile gets zero parallax cost, not just a fixed one).
   */
  private readonly hoverCapable =
    this.isBrowser && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  private rafId = 0;
  private currentX = 0;
  private currentY = 0;
  private targetX = 0;
  private targetY = 0;
  private layers: HTMLElement[] = [];
  private active = false;

  constructor(private elRef: ElementRef<HTMLElement>) {}

  ngOnInit(): void {
    if (!this.isBrowser || !this.hoverCapable) return;
    const host = this.elRef.nativeElement;
    host.style.perspective = `${this.parallaxPerspective}px`;
    host.style.transformStyle = 'preserve-3d';
    this.layers = Array.from(
      host.querySelectorAll<HTMLElement>(this.parallaxLayerSelector),
    );
    for (const layer of this.layers) {
      const depth = Number(layer.dataset['parallaxDepth'] ?? '1');
      layer.dataset['parallaxDepthNum'] = String(depth);
      layer.style.willChange = 'transform';
      layer.style.transform = 'translate3d(0, 0, 0)';
    }
  }

  @HostListener('pointermove', ['$event'])
  onPointerMove(ev: PointerEvent): void {
    if (!this.isBrowser || !this.hoverCapable) return;
    if (ev.pointerType !== 'mouse') return; // extra safety: never engage for touch/pen
    const host = this.elRef.nativeElement;
    const rect = host.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    // Normalize to -1..1
    this.targetX = (ev.clientX - cx) / (rect.width / 2);
    this.targetY = (ev.clientY - cy) / (rect.height / 2);
    if (!this.active) this.tick();
    this.active = true;
  }

  @HostListener('pointerleave')
  @HostListener('pointercancel')
  @HostListener('pointerup')
  onPointerLeave(): void {
    if (!this.isBrowser || !this.hoverCapable) return;
    this.targetX = 0;
    this.targetY = 0;
    this.active = false;
    // Ensure a final settle when leaving.
    if (!this.rafId) this.tick();
  }

  private tick = (): void => {
    this.currentX += (this.targetX - this.currentX) * this.parallaxLerp;
    this.currentY += (this.targetY - this.currentY) * this.parallaxLerp;

    for (const layer of this.layers) {
      const depth = Number(layer.dataset['parallaxDepthNum'] ?? '1');
      const dx = -this.currentX * this.parallaxMax * depth;
      const dy = -this.currentY * this.parallaxMax * depth;
      layer.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
    }

    // Stop purely on convergence, regardless of `active`. Depending on
    // `!this.active` here was the original bug: if a pointerleave/up/cancel
    // event is ever missed (routine on touch, and possible on desktop with
    // fast pointer capture edge-cases), `active` never resets to false and
    // this rAF loop runs forever, once per frame, for the rest of the page's
    // life. Settling is a self-sufficient stop condition — once the values
    // stop changing there's nothing left to animate, whether or not we
    // still technically think the pointer is "active".
    const settled =
      Math.abs(this.targetX - this.currentX) < 0.002 &&
      Math.abs(this.targetY - this.currentY) < 0.002;
    if (settled) {
      this.rafId = 0;
      return;
    }
    this.rafId = requestAnimationFrame(this.tick);
  };
}
