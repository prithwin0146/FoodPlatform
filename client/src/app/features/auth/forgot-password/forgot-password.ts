import { Component, signal, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiAuthService } from '../../../core/services/api-auth.service';
import { ToastService } from '../../../core/services/toast.service';

/**
 * Step 1 of the password reset flow — collect the user's email address
 * and request a one-time reset code.
 * (SRP: only owns the "send reset code" interaction; no OTP verification or password logic)
 */
@Component({
  selector: 'app-forgot-password',
  imports: [
    FormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.scss',
})
export class ForgotPassword {
  email = '';
  readonly loading = signal(false);
  readonly sent = signal(false);

  private readonly apiAuth = inject(ApiAuthService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  constructor() {
    inject(Title).setTitle('Forgot Password | SeeThePrep');
    inject(Meta).updateTag({ name: 'robots', content: 'noindex, nofollow' });
  }

  submit(): void {
    const trimmed = this.email.trim().toLowerCase();
    if (!trimmed) return;

    this.loading.set(true);
    this.apiAuth.forgotPassword({ email: trimmed }).subscribe({
      next: () => {
        this.loading.set(false);
        this.sent.set(true);
        // Navigate to reset-password page with email pre-filled after short delay
        setTimeout(() => {
          this.router.navigate(['/reset-password'], { queryParams: { email: trimmed } });
        }, 1800);
      },
      error: () => {
        // Show same message on error for anti-enumeration
        this.loading.set(false);
        this.sent.set(true);
        setTimeout(() => {
          this.router.navigate(['/reset-password'], { queryParams: { email: trimmed } });
        }, 1800);
      },
    });
  }
}
