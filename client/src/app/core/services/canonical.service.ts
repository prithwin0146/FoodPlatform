import { Injectable, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

/**
 * SRP: owns exactly one concern — keeping the <link rel="canonical"> tag
 *      in sync with the current route URL.
 * DIP: depends on the DOCUMENT token abstraction, not a concrete DOM ref.
 */
@Injectable({ providedIn: 'root' })
export class CanonicalService {
  private readonly doc = inject(DOCUMENT);

  /** Update or create the canonical link tag for the current page. */
  set(url: string): void {
    let link = this.doc.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.doc.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.doc.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }
}
