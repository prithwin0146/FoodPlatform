import { Component, signal, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiAuthService } from '../../../core/services/api-auth.service';
import { AuthService } from '../../../core/auth/auth.service';
import { ToastService } from '../../../core/services/toast.service';


@Component({
  selector: 'app-login',
  imports: [
    FormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  email = '';
  password = '';
  readonly loading = signal(false);
  readonly showPw = signal(false);

  constructor(
    private readonly apiAuth: ApiAuthService,
    private readonly auth: AuthService,
    private readonly toast: ToastService,
    private readonly router: Router
  ) {
    inject(Title).setTitle('Sign In | SeeThePrep');
    const meta = inject(Meta);
    meta.updateTag({ name: 'description', content: 'Sign in to SeeThePrep — the UK food delivery platform where you watch your meal being cooked live on camera.' });
    meta.updateTag({ name: 'robots', content: 'noindex, follow' });
  }

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
