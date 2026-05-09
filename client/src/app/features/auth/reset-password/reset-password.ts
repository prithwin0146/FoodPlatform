import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiAuthService } from '../../../core/services/api-auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { MagneticDirective } from '../../../shared/directives/magnetic.directive';

/**
 * Step 2 of the password reset flow — enter the OTP code and choose a new password.
 * (SRP: only owns the reset-password interaction; no email collection or login logic)
 */
@Component({
  selector: 'app-reset-password',
  imports: [
    FormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MagneticDirective,
  ],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.scss',
})
export class ResetPassword implements OnInit {
  otp = '';
  newPassword = '';
  confirmPassword = '';

  readonly email = signal('');
  readonly loading = signal(false);
  readonly showPw = signal(false);
  readonly showConfirm = signal(false);

  private readonly apiAuth = inject(ApiAuthService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  constructor() {
    inject(Title).setTitle('Reset Password | SeeThePrep');
    inject(Meta).updateTag({ name: 'robots', content: 'noindex, nofollow' });
  }

  ngOnInit(): void {
    const email = this.route.snapshot.queryParamMap.get('email') ?? '';
    if (!email) {
      this.router.navigate(['/forgot-password']);
      return;
    }
    this.email.set(email);
  }

  readonly maskedEmail = computed(() => {
    const e = this.email();
    const [local, domain] = e.split('@');
    if (!local || !domain) return e;
    return `${local[0]}${'*'.repeat(Math.max(local.length - 2, 1))}${local.at(-1)}@${domain}`;
  });

  readonly passwordMismatch = computed(
    () => this.confirmPassword.length > 0 && this.newPassword !== this.confirmPassword,
  );

  readonly canSubmit = computed(
    () =>
      this.otp.trim().length === 6 &&
      this.newPassword.length >= 8 &&
      this.newPassword === this.confirmPassword,
  );

  submit(): void {
    if (!this.canSubmit()) return;

    this.loading.set(true);
    this.apiAuth
      .resetPassword({
        email: this.email(),
        otp: this.otp.trim(),
        newPassword: this.newPassword,
      })
      .subscribe({
        next: (res) => {
          this.loading.set(false);
          this.toast.success(res.message ?? 'Password updated! Please sign in. 🎉');
          this.router.navigate(['/login']);
        },
        error: (err) => {
          this.loading.set(false);
          this.toast.error(err.error?.error ?? 'Reset failed. Please try again.');
        },
      });
  }
}
