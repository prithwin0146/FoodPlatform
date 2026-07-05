import { Injectable, signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { DOCUMENT } from '@angular/common';

/** Light-only — dark mode removed 2026-07. */
export type Theme = 'light';

/**
 * Theme service — light-only stub.
 * Retained so existing injections compile without changes.
 * Sets data-theme="light" on <html> once at boot.
 * (SRP: theme DOM initialisation only)
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly doc = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  /** Always 'light' — no runtime switching. */
  readonly theme = signal<Theme>('light');

  constructor() {
    if (this.isBrowser) {
      this.doc.documentElement.setAttribute('data-theme', 'light');
      try { localStorage.removeItem('stp_theme'); } catch { /* ignore */ }
    }
  }

  /** No-op: dark mode has been removed from the app. */
  toggle(): void {}
}
