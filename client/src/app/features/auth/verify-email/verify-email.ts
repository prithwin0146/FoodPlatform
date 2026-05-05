import { Component, OnInit, OnDestroy, signal, inject, computed } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiAuthService } from '../../../core/services/api-auth.service';
import { AuthService } from '../../../core/auth/auth.service';
import { ToastService } from '../../../core/services/toast.service';

/**
 * Handles the email OTP verification step after registration.
 * (SRP: only owns the verify/resend interaction; no registration or login logic)
 */
@Component({
  selector: 'app-verify-email',
  imports: [
    FormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './verify-email.html',
  styleUrl: './verify-email.scss',
})
export class VerifyEmail implements OnInit, OnDestroy {
  otp = '';
  readonly email = signal('');
  readonly loading = signal(false);
  readonly resendCooldown = signal(0); // seconds remaining

  private cooldownInterval: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly apiAuth: ApiAuthService,
    private readonly auth: AuthService,
    private readonly toast: ToastService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
  ) {
    inject(Title).setTitle('Verify Email | SeeThePrep');
    inject(Meta).updateTag({ name: 'robots', content: 'noindex, nofollow' });
  }

  ngOnInit(): void {
    const email = this.route.snapshot.queryParamMap.get('email') ?? '';
    if (!email) {
      this.router.navigate(['/register']);
      return;
    }
    this.email.set(email);
    this.startCooldown(30); // initial cooldown so user can't spam on load
  }

  ngOnDestroy(): void {
    this.clearCooldown();
  }

  readonly canResend = computed(() => this.resendCooldown() === 0 && !this.loading());
  readonly maskedEmail = computed(() => {
    const e = this.email();
    const [local, domain] = e.split('@');
    if (!local || !domain) return e;
    return `${local[0]}${'*'.repeat(Math.max(local.length - 2, 1))}${local.at(-1)}@${domain}`;
  });

  submit(): void {
    const cleaned = this.otp.trim().replace(/\s/g, '');
    if (cleaned.length !== 6) {
      this.toast.error('Please enter the 6-digit code');
      return;
    }
    this.loading.set(true);
    this.apiAuth.verifyOtp({ email: this.email(), otp: cleaned }).subscribe({
      next: (res) => {
        this.auth.setSession(res);
        this.toast.success(`Welcome, ${res.username}! 🎉`);
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.loading.set(false);
        this.toast.error(err.error?.error ?? 'Verification failed');
      },
    });
  }

  resend(): void {
    if (!this.canResend()) return;
    this.loading.set(true);
    this.apiAuth.resendOtp({ email: this.email() }).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.toast.success(res.message);
        this.startCooldown(60);
      },
      error: (err) => {
        this.loading.set(false);
        this.toast.error(err.error?.error ?? 'Could not resend code');
      },
    });
  }

  // ── private ──────────────────────────────────────────────────────────────

  private startCooldown(seconds: number): void {
    this.clearCooldown();
    this.resendCooldown.set(seconds);
    this.cooldownInterval = setInterval(() => {
      const next = this.resendCooldown() - 1;
      this.resendCooldown.set(next);
      if (next <= 0) this.clearCooldown();
    }, 1000);
  }

  private clearCooldown(): void {
    if (this.cooldownInterval !== null) {
      clearInterval(this.cooldownInterval);
      this.cooldownInterval = null;
    }
  }
}
