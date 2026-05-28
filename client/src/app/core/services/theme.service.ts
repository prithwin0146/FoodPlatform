import { Injectable, signal, effect, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { DOCUMENT } from '@angular/common';

export type Theme = 'dark' | 'light';

/**
 * Manages the application colour theme.
 * (SRP: theme persistence and DOM toggling only)
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly doc = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly STORAGE_KEY = 'stp_theme';

  readonly theme = signal<Theme>(this.readStored());

  constructor() {
    // Apply theme to <html> element whenever the signal changes
    effect(() => {
      const t = this.theme();
      if (this.isBrowser) {
        this.doc.documentElement.setAttribute('data-theme', t);
        try { localStorage.setItem(this.STORAGE_KEY, t); } catch { /* SSR / private */ }
      }
    });
  }

  toggle(): void {
    this.theme.update(t => (t === 'dark' ? 'light' : 'dark'));
  }

  private readStored(): Theme {
    if (!isPlatformBrowser(inject(PLATFORM_ID))) return 'dark';
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored === 'light' || stored === 'dark') return stored;
    } catch { /* ignore */ }
    return 'dark';
  }
}
