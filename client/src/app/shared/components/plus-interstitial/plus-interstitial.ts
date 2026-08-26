import { Component, ChangeDetectionStrategy, OnInit, inject, signal, DOCUMENT } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../../core/auth/auth.service';
import { SubscriptionService } from '../../../core/services/subscription.service';

/**
 * Deliveroo-style Plus promo interstitial — shown to logged-in, non-Plus customers
 * browsing restaurants, with a localStorage cooldown so it doesn't nag.
 * (SRP: presentation + dismissal/cooldown logic only — checkout lives in PlusLanding)
 */
@Component({
  selector: 'app-plus-interstitial',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule],
  templateUrl: './plus-interstitial.html',
  styleUrl: './plus-interstitial.scss',
})
export class PlusInterstitial implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly subscriptionService = inject(SubscriptionService);
  private readonly router = inject(Router);
  private readonly doc = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private static readonly STORAGE_KEY = 'stp_plus_interstitial_dismissed_at';
  private static readonly COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

  readonly visible = signal(false);

  ngOnInit(): void {
    if (!this.isBrowser || !this.auth.isCustomer()) return;
    if (!this.canShow()) return;

    this.subscriptionService.getStatus().subscribe({
      next: (s) => { if (!s.isActive) this.visible.set(true); },
      error: () => {},
    });
  }

  private canShow(): boolean {
    try {
      const last = this.doc.defaultView?.localStorage.getItem(PlusInterstitial.STORAGE_KEY);
      if (!last) return true;
      return Date.now() - Number(last) > PlusInterstitial.COOLDOWN_MS;
    } catch {
      return false;
    }
  }

  dismiss(): void {
    this.visible.set(false);
    try {
      this.doc.defaultView?.localStorage.setItem(PlusInterstitial.STORAGE_KEY, String(Date.now()));
    } catch { /* ignore storage errors (private browsing, etc.) */ }
  }

  joinNow(): void {
    this.dismiss();
    void this.router.navigate(['/plus']);
  }
}
