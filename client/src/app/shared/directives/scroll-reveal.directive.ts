import { Directive, ElementRef, Input, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * [appScrollReveal] — fades + lifts the host element into view when it enters
 * the viewport. Uses IntersectionObserver for performance; respects
 * prefers-reduced-motion.
 *
 * SRP: owns entrance-reveal animation only.
 * OCP: tweak via [revealDelay] / [revealY] inputs without changing directive.
 */
@Directive({
  selector: '[appScrollReveal]',
  standalone: true,
})
export class ScrollRevealDirective implements OnInit {
  @Input() revealDelay = 0;
  @Input() revealY = 28;

  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  constructor(private elRef: ElementRef<HTMLElement>) {}

  ngOnInit(): void {
    if (!this.isBrowser) return;
    const el = this.elRef.nativeElement;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // Start hidden
    el.style.opacity = '0';
    el.style.transform = `translateY(${this.revealY}px)`;
    el.style.willChange = 'opacity, transform';

    const delay = this.revealDelay;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.transition = [
            `opacity 0.65s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
            `transform 0.65s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
          ].join(', ');
          el.style.opacity = '1';
          el.style.transform = 'translateY(0)';
          el.style.willChange = 'auto';
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -32px 0px' },
    );

    observer.observe(el);
  }
}

