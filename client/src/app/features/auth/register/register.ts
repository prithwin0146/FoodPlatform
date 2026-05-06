import { Component, signal, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiAuthService } from '../../../core/services/api-auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { ScrollRevealDirective } from '../../../shared/directives/scroll-reveal.directive';
import { MagneticDirective } from '../../../shared/directives/magnetic.directive';

@Component({
  selector: 'app-register',
  imports: [
    FormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    ScrollRevealDirective,
    MagneticDirective,
  ],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register {
  username = '';
  email = '';
  password = '';
  confirmPassword = '';
  readonly loading = signal(false);
  readonly showPw = signal(false);
  readonly showConfirmPw = signal(false);
  readonly passwordSignal = signal('');

  readonly passwordStrength = computed(() => {
    const p = this.passwordSignal();
    if (p.length === 0) return 0;
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    return score;
  });

  readonly strengthLabel = computed(() => {
    const s = this.passwordStrength();
    if (s === 0) return '';
    if (s === 1) return 'Weak';
    if (s === 2) return 'Fair';
    if (s === 3) return 'Good';
    return 'Strong';
  });

  onPasswordChange(val: string): void {
    this.password = val;
    this.passwordSignal.set(val);
  }

  constructor(
    private readonly apiAuth: ApiAuthService,
    private readonly toast: ToastService,
    private readonly router: Router
  ) {
    inject(Title).setTitle('Create Account | SeeThePrep');
    const meta = inject(Meta);
    meta.updateTag({ name: 'description', content: 'Join SeeThePrep — create a free account to order food from live-streamed kitchens across the UK. FSA 5-star restaurants, full allergen transparency.' });
    meta.updateTag({ name: 'robots', content: 'noindex, follow' });
  }

  get passwordsMatch(): boolean {
    return this.password === this.confirmPassword;
  }

  submit(): void {
    if (!this.username || !this.email || !this.password || !this.passwordsMatch) return;
    this.loading.set(true);
    this.apiAuth
      .register({ username: this.username.trim(), email: this.email, password: this.password })
      .subscribe({
        next: () => {
          this.router.navigate(['/verify-email'], { queryParams: { email: this.email } });
        },
        error: (err) => {
          this.loading.set(false);
          this.toast.error(err.error?.error ?? 'Registration failed');
        },
      });
  }
}
