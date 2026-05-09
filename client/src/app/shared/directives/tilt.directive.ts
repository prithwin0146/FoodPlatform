import {
  Directive,
  ElementRef,
  HostListener,
  Input,
  OnInit,
  Renderer2,
} from '@angular/core';

/**
 * [appTilt] — 3D card tilt + glare effect driven purely by CSS custom properties.
 * Usage: <div appTilt [tiltMax]="15">...</div>
 * The host element must have position:relative and a ::after pseudo glare overlay.
 */
@Directive({
  selector: '[appTilt]',
  standalone: true,
})
export class TiltDirective implements OnInit {
  @Input() tiltMax = 12;

  private el!: HTMLElement;

  constructor(private elRef: ElementRef<HTMLElement>, private renderer: Renderer2) {}

  ngOnInit(): void {
    this.el = this.elRef.nativeElement;
    this.renderer.setStyle(this.el, 'transform-style', 'preserve-3d');
    this.renderer.setStyle(this.el, 'will-change', 'transform');
    this.renderer.setStyle(this.el, 'transition', 'transform 0.1s ease-out, box-shadow 0.1s ease-out');
  }

  @HostListener('mouseenter')
  onEnter(): void {
    this.renderer.setStyle(this.el, 'transition', 'transform 0.08s ease-out, box-shadow 0.08s ease-out');
  }

  @HostListener('mousemove', ['$event'])
  onMove(e: MouseEvent): void {
    const rect = this.el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const rx = ((y - cy) / cy) * -this.tiltMax;
    const ry = ((x - cx) / cx) * this.tiltMax;

    this.el.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(12px)`;
    this.el.style.setProperty('--glare-x', `${(x / rect.width) * 100}%`);
    this.el.style.setProperty('--glare-y', `${(y / rect.height) * 100}%`);
    this.el.style.setProperty('--glare-opacity', '1');
    // Inner parallax: children with [data-parallax] counter-translate
    this.el.style.setProperty('--tilt-tx', `${(ry / this.tiltMax) * -8}px`);
    this.el.style.setProperty('--tilt-ty', `${(rx / this.tiltMax) * 8}px`);

    const shadowX = (ry / this.tiltMax) * 20;
    const shadowY = (-rx / this.tiltMax) * 20;
    this.el.style.boxShadow = `${shadowX}px ${shadowY}px 40px rgba(255, 87, 34, 0.25), 0 20px 60px rgba(0,0,0,0.15)`;
  }

  @HostListener('mouseleave')
  onLeave(): void {
    this.renderer.setStyle(this.el, 'transition', 'transform 0.6s cubic-bezier(0.16,1,0.3,1), box-shadow 0.6s cubic-bezier(0.16,1,0.3,1)');
    this.el.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) translateZ(0)';
    this.el.style.boxShadow = '';
    this.el.style.setProperty('--glare-opacity', '0');
    this.el.style.setProperty('--tilt-tx', '0px');
    this.el.style.setProperty('--tilt-ty', '0px');
  }
}
