import {
  AfterViewInit,
  Directive,
  ElementRef,
  Input,
  OnDestroy,
  PLATFORM_ID,
  inject,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * [appStaggerReveal] — Stagger-fades direct children of the host element as
 * the container scrolls into view. Children animate in sequence using a
 * per-child transition-delay; the delay step is configurable.
 *
 * SRP: owns staggered entrance only — visuals live in the consumer.
 *
 * Usage:
 *   <ul appStaggerReveal [staggerStep]="70">
 *     <li></li>     <!-- each li fades + lifts in series -->
 *  </ul>
 *
 * Children can opt-in to the depth they want via [data-stagger-y] / [data-stagger-opacity]
 * but default values work for typical lists.
 */
@Directive({
  selector: '[appStaggerReveal]',
  standalone: true,
})
export class StaggerRevealDirective implements AfterViewInit, OnDestroy {
  /** Delay (in ms) added between each child's animation start. */
  @Input() staggerStep = 60;
  /** Initial translateY (px) for children before they reveal. */
  @Input() staggerY = 22;
  /** Initial opacity for children before they reveal. */
  @Input() staggerOpacity = 0;
  /** Reveal animation duration (ms). */
  @Input() staggerDuration = 520;

  private observer?: IntersectionObserver;
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  constructor(private elRef: ElementRef<HTMLElement>) {}

  ngAfterViewInit(): void {
    if (!this.isBrowser) return;

    const root = this.elRef.nativeElement;
    const children = Array.from(root.children) as HTMLElement[];

    if (!children.length) return;

    const reduced =
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      children.forEach((c) => {
        c.style.opacity = '1';
        c.style.transform = 'none';
      });
      return;
    }

    // Initial hidden state on each child.
    children.forEach((c, i) => {
      c.style.setProperty('--stagger-index', String(i));
      c.style.opacity = String(this.staggerOpacity);
      c.style.transform = `translateY(${this.staggerY}px)`;
      c.style.willChange = 'opacity, transform';
    });

    this.observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        const max = children.length - 1;
        children.forEach((c, i) => {
          const delay = Math.min(i, max) * this.staggerStep;
          c.style.transition = `opacity ${this.staggerDuration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform ${this.staggerDuration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`;
          c.style.opacity = '1';
          c.style.transform = 'translateY(0)';
          c.style.willChange = 'auto';
        });
        this.observer?.disconnect();
      },
      { threshold: 0.12, rootMargin: '0px 0px -24px 0px' },
    );

    this.observer.observe(root);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
