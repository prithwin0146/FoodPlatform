import { Component, signal, OnInit } from '@angular/core';

@Component({
  selector: 'app-cookie-banner',
  templateUrl: './cookie-banner.html',
  styleUrl: './cookie-banner.scss',
  standalone: true
})
export class CookieBanner implements OnInit {
  readonly showBanner = signal(false);

  ngOnInit() {
    const consent = localStorage.getItem('cookie_consent');
    if (!consent) {
      // Small delay for smooth entry animation
      setTimeout(() => this.showBanner.set(true), 1500);
    }
  }

  acceptAll() {
    localStorage.setItem('cookie_consent', 'all');
    this.showBanner.set(false);
  }

  managePreferences() {
    // In a real app, this might open a modal. For now we just dismiss it as 'essential'.
    localStorage.setItem('cookie_consent', 'essential');
    this.showBanner.set(false);
  }
}
