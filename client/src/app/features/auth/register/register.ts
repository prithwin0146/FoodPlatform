import { Component, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiAuthService } from '../../../core/services/api-auth.service';
import { AuthService } from '../../../core/auth/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register {
  username = '';
  email = '';
  password = '';
  confirmPassword = '';
  readonly loading = signal(false);

  constructor(
    private readonly apiAuth: ApiAuthService,
    private readonly auth: AuthService,
    private readonly toast: ToastService,
    private readonly router: Router
  ) {}

  get passwordsMatch(): boolean {
    return this.password === this.confirmPassword;
  }

  submit(): void {
    if (!this.username || !this.email || !this.password || !this.passwordsMatch) return;
    this.loading.set(true);
    this.apiAuth
      .register({ username: this.username.trim(), email: this.email, password: this.password })
      .subscribe({
        next: (res) => {
          this.auth.setSession(res);
          this.toast.success(`Welcome, ${res.username}!`);
          this.router.navigate(['/']);
        },
        error: (err) => {
          this.loading.set(false);
          this.toast.error(err.error?.message ?? 'Registration failed');
        },
      });
  }
}
