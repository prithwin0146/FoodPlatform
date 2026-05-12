import { Directive, ElementRef, Input, OnInit, numberAttribute, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * [appCountUp] — animates a numeric text node from 0 to [appCountUp]
 * when the element first enters the viewport.
 *
 * SRP: owns counting animation only.
 * OCP: new easing or duration supplied via inputs without changing directive internals.
 */
@Directive({
  selector: '[appCountUp]',
  standalone: true,
})
export class CountUpDirective implements OnInit {
  @Input({ transform: numberAttribute }) appCountUp = 0;
  @Input() countUpSuffix = '';
  @Input() countUpDuration = 1800;

  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  constructor(private readonly el: ElementRef<HTMLElement>) {}

  ngOnInit(): void {
    if (!this.isBrowser) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const el = this.el.nativeElement;
    el.textContent = `0${this.countUpSuffix}`;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          observer.disconnect();
          this.animate(el);
        }
      },
      { threshold: 0.5 },
    );

    observer.observe(el);
  }

  private animate(el: HTMLElement): void {
    const start = performance.now();
    const target = this.appCountUp;
    const suffix = this.countUpSuffix;
    const duration = this.countUpDuration;

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = `${Math.round(eased * target)}${suffix}`;
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }
}
