import { Directive, ElementRef, HostListener, Input } from '@angular/core';

@Directive({
  selector: 'img[appImageFallback]',
  standalone: true
})
export class ImageFallbackDirective {
  @Input() appImageFallback = '';
  private hasFailed = false;

  constructor(private elRef: ElementRef<HTMLImageElement>) {}

  @HostListener('error')
  onError(): void {
    if (!this.hasFailed) {
      this.hasFailed = true;
      const el = this.elRef.nativeElement;
      // High-quality gray placeholder with soft rounded edges feeling
      el.src = this.appImageFallback || 'data:image/svg+xml;charset=UTF-8,%3Csvg width=\'400\' height=\'300\' xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 400 300\' preserveAspectRatio=\'none\'%3E%3Crect width=\'400\' height=\'300\' fill=\'%23f3f4f6\'%3E%3C/rect%3E%3Cpath d=\'M186 138h28v24h-28z\' fill=\'%23d1d5db\'/%3E%3C/svg%3E';
      el.style.objectFit = 'cover';
    }
  }
}
