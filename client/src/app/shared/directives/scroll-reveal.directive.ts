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

    // Start hidden with a slight scale down for a premium "pop-in" effect
    el.style.opacity = '0';
    el.style.transform = `translateY(${this.revealY}px) scale(0.96)`;
    el.style.willChange = 'opacity, transform';

    const delay = this.revealDelay;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Buttery smooth Apple-like bezier curve for premium feel
          el.style.transition = [
            `opacity 0.8s cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms`,
            `transform 0.8s cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms`,
          ].join(', ');
          el.style.opacity = '1';
          el.style.transform = 'translateY(0) scale(1)';
          
          // Cleanup
          setTimeout(() => {
            el.style.willChange = 'auto';
          }, delay + 800);

          observer.disconnect();
        }
      },
      // Lower threshold and adjusted rootMargin so it triggers reliably on mobile screens
      { threshold: 0.05, rootMargin: '0px 0px -15% 0px' },
    );

    observer.observe(el);
  }
}

