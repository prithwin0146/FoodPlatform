import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../../core/auth/auth.service';
import { ApiAuthService } from '../../../core/services/api-auth.service';
import { SubscriptionService } from '../../../core/services/subscription.service';
import { ToastService } from '../../../core/services/toast.service';
import { ScrollRevealDirective } from '../../../shared/directives/scroll-reveal.directive';
import { SubscriptionStatus } from '../../../core/models';

/**
 * Customer profile page.
 * SRP: owns display of account info + change-password form only.
 * DIP: delegates auth state to AuthService, HTTP to ApiAuthService.
 */
@Component({
  selector: 'app-profile',
  imports: [
    FormsModule, DatePipe,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    ScrollRevealDirective,
  ],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile implements OnInit {
  private readonly apiAuth = inject(ApiAuthService);
  private readonly subscriptionService = inject(SubscriptionService);
  private readonly toast = inject(ToastService);
  readonly auth = inject(AuthService);

  readonly currentPassword = signal('');
  readonly newPassword = signal('');
  readonly confirmPassword = signal('');
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly successMsg = signal<string | null>(null);
  readonly showCurrent = signal(false);
  readonly showNew = signal(false);
  readonly showConfirm = signal(false);

  // ── SeeThePrep Plus ──
  readonly subscriptionStatus = signal<SubscriptionStatus | null>(null);
  readonly subscriptionLoading = signal(false);
  readonly cancellingSubscription = signal(false);

  readonly userInitial = computed(() => {
    const name = this.auth.username() ?? '?';
    return name.charAt(0).toUpperCase();
  });

  readonly passwordsMatch = computed(() =>
    this.newPassword() === this.confirmPassword() || this.confirmPassword() === ''
  );

  readonly canSubmit = computed(() =>
    this.currentPassword().length > 0 &&
    this.newPassword().length >= 8 &&
    this.newPassword() === this.confirmPassword() &&
    !this.saving()
  );

  ngOnInit(): void {
    if (this.auth.isLoggedIn()) {
      this.subscriptionLoading.set(true);
      this.subscriptionService.getStatus().subscribe({
        next: (s) => { this.subscriptionStatus.set(s); this.subscriptionLoading.set(false); },
        error: () => this.subscriptionLoading.set(false),
      });
    }
  }

  subscribePlus(): void {
    const successUrl = window.location.href + '?plus=success';
    const cancelUrl = window.location.href;
    this.subscriptionService.createCheckout(successUrl, cancelUrl).subscribe({
      next: (res) => { window.location.href = res.checkoutUrl; },
      error: () => this.toast.error('Could not start subscription checkout'),
    });
  }

  cancelPlus(): void {
    if (!confirm('Cancel your SeeThePrep Plus subscription? You will keep access until the end of the billing period.')) return;
    this.cancellingSubscription.set(true);
    this.subscriptionService.cancel().subscribe({
      next: () => {
        this.cancellingSubscription.set(false);
        this.subscriptionStatus.update(s => s ? { ...s, status: 'Cancelled' } : s);
        this.toast.success('Subscription cancelled');
      },
      error: () => { this.cancellingSubscription.set(false); this.toast.error('Failed to cancel'); },
    });
  }

  changePassword(): void {
    if (!this.canSubmit()) return;
    this.saving.set(true);
    this.error.set(null);
    this.successMsg.set(null);

    this.apiAuth.changePassword({
      currentPassword: this.currentPassword(),
      newPassword: this.newPassword(),
    }).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.successMsg.set(res.message);
        this.currentPassword.set('');
        this.newPassword.set('');
        this.confirmPassword.set('');
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(err?.error?.error ?? 'Something went wrong. Please try again.');
      },
    });
  }
}
