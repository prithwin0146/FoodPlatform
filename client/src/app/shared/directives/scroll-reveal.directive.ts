import { Directive, ElementRef, Input, OnInit } from '@angular/core';

/**
 * [appScrollReveal] — disabled; reveals immediately.
 * (SRP: directive kept in place so templates compile; behaviour toggled off here)
 */
@Directive({
  selector: '[appScrollReveal]',
  standalone: true,
})
export class ScrollRevealDirective implements OnInit {
  @Input() revealDelay = 0;
  @Input() revealY = 32;

  constructor(private elRef: ElementRef<HTMLElement>) {}

  ngOnInit(): void {
    // Reveal immediately — no hide/animate cycle
    const el = this.elRef.nativeElement;
    el.style.opacity = '1';
    el.style.transform = 'none';
    el.style.transition = 'none';
  }
}



