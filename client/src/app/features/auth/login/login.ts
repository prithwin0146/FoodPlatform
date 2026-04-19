import { Component, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiAuthService } from '../../../core/services/api-auth.service';
import { AuthService } from '../../../core/auth/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  email = '';
  password = '';
  readonly loading = signal(false);

  constructor(
    private readonly apiAuth: ApiAuthService,
    private readonly auth: AuthService,
    private readonly toast: ToastService,
    private readonly router: Router
  ) {}

  submit(): void {
    if (!this.email || !this.password) return;
    this.loading.set(true);
    this.apiAuth.login({ email: this.email, password: this.password }).subscribe({
      next: (res) => {
        this.auth.setSession(res);
        this.toast.success('Welcome back!');
        if (res.role === 'Admin') this.router.navigate(['/admin']);
        else if (res.role === 'Staff') this.router.navigate(['/dashboard']);
        else this.router.navigate(['/']);
      },
      error: (err) => {
        this.loading.set(false);
        this.toast.error(err.error?.message ?? 'Invalid credentials');
      },
    });
  }
}
