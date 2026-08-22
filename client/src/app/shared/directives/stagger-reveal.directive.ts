import {
  AfterViewInit,
  Directive,
  ElementRef,
  Input,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  PLATFORM_ID,
  inject,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Directive({
  selector: '[appStaggerReveal]',
  standalone: true,
})
export class StaggerRevealDirective implements AfterViewInit, OnDestroy, OnChanges {
  @Input() staggerStep = 60;
  @Input() staggerY = 22;
  @Input() staggerOpacity = 0;
  @Input() staggerDuration = 520;
  @Input() staggerReady = true;

  private observer?: IntersectionObserver;
  private isIntersecting = false;
  private hasPlayed = false;
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  constructor(private elRef: ElementRef<HTMLElement>) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['staggerReady'] && this.staggerReady) {
      this.checkAndPlay();
    }
  }

  ngAfterViewInit(): void {
    if (!this.isBrowser) return;

    const root = this.elRef.nativeElement;
    const children = Array.from(root.children) as HTMLElement[];

    if (!children.length) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      children.forEach((c) => {
        c.style.opacity = '1';
        c.style.transform = 'none';
      });
      return;
    }

    children.forEach((c, i) => {
      c.style.setProperty('--stagger-index', String(i));
      c.style.opacity = String(this.staggerOpacity);
      c.style.transform = `translateY(${this.staggerY}px)`;
      c.style.willChange = 'opacity, transform';
    });

    this.observer = new IntersectionObserver(
      ([entry]) => {
        this.isIntersecting = entry.isIntersecting;
        this.checkAndPlay();
      },
      { threshold: 0.12, rootMargin: '0px 0px -24px 0px' },
    );

    this.observer.observe(root);
  }

  private checkAndPlay(): void {
    if (this.hasPlayed || !this.isIntersecting || !this.staggerReady) return;
    this.hasPlayed = true;

    const root = this.elRef.nativeElement;
    const children = Array.from(root.children) as HTMLElement[];
    const max = children.length - 1;
    
    children.forEach((c, i) => {
      const delay = Math.min(i, max) * this.staggerStep;
      c.style.transition = `opacity ${this.staggerDuration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform ${this.staggerDuration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`;
      c.style.opacity = '1';
      c.style.transform = 'translateY(0)';
      c.style.willChange = 'auto';
    });
    
    this.observer?.disconnect();
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
