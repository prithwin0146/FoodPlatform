import {
  Directive,
  ElementRef,
  HostListener,
  Input,
  OnInit,
  Renderer2,
} from '@angular/core';

/**
 * [appMagnetic] — Button pulls slightly toward the cursor within a radius,
 * then springs back smoothly on mouse leave.
 * Usage: <button appMagnetic [magnetStrength]="0.4">...</button>
 */
@Directive({
  selector: '[appMagnetic]',
  standalone: true,
})
export class MagneticDirective implements OnInit {
  @Input() magnetStrength = 0.35;

  private el!: HTMLElement;

  constructor(private elRef: ElementRef<HTMLElement>, private renderer: Renderer2) {}

  ngOnInit(): void {
    this.el = this.elRef.nativeElement;
    this.renderer.setStyle(this.el, 'transition', 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1)');
    this.renderer.setStyle(this.el, 'display', 'inline-flex');
  }

  @HostListener('mousemove', ['$event'])
  onMove(e: MouseEvent): void {
    const rect = this.el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) * this.magnetStrength;
    const dy = (e.clientY - cy) * this.magnetStrength;
    this.renderer.setStyle(this.el, 'transition', 'transform 0.1s ease-out');
    this.el.style.transform = `translate(${dx}px, ${dy}px)`;
  }

  @HostListener('mouseleave')
  onLeave(): void {
    this.renderer.setStyle(this.el, 'transition', 'transform 0.5s cubic-bezier(0.34,1.56,0.64,1)');
    this.el.style.transform = 'translate(0, 0)';
  }
}
