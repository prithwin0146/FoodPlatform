import { Component, signal, inject } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiAuthService } from '../../../core/services/api-auth.service';
import { AuthService } from '../../../core/auth/auth.service';
import { SILENT_ERROR_HEADER } from '../../../core/auth/error.interceptor';
import { ToastService } from '../../../core/services/toast.service';
import { ScrollRevealDirective } from '../../../shared/directives/scroll-reveal.directive';
import { MagneticDirective } from '../../../shared/directives/magnetic.directive';
import { Logo } from '../../../shared/components/logo/logo';
import { HttpHeaders } from '@angular/common/http';


@Component({
  selector: 'app-login',
  imports: [
    FormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    ScrollRevealDirective,
    MagneticDirective,
    Logo,
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  email = '';
  password = '';
  readonly loading = signal(false);
  readonly showPw = signal(false);
  readonly emailNotVerified = signal(false);

  constructor(
    private readonly apiAuth: ApiAuthService,
    private readonly auth: AuthService,
    private readonly toast: ToastService,
    private readonly router: Router,
    private readonly route: ActivatedRoute
  ) {
    inject(Title).setTitle('Sign In | SeeThePrep');
    const meta = inject(Meta);
    meta.updateTag({ name: 'description', content: 'Sign in to SeeThePrep — the UK food delivery platform where you watch your meal being cooked live on camera.' });
    meta.updateTag({ name: 'robots', content: 'noindex, follow' });
  }

  submit(): void {
    if (!this.email || !this.password) return;
    this.loading.set(true);
    const returnUrl = this.route.snapshot.queryParams['returnUrl'] ?? null;
    
    // We handle errors manually to show the 'resend code' banner, so we suppress the global toast
    const headers = new HttpHeaders().set(SILENT_ERROR_HEADER, 'true');
    this.apiAuth.login({ email: this.email, password: this.password }, headers).subscribe({
      next: (res) => {
        this.auth.setSession(res);
        this.toast.success('Welcome back!');
        if (res.role === 'Admin') this.router.navigate(['/admin']);
        else if (res.role === 'Staff') this.router.navigate(['/dashboard']);
        else this.router.navigateByUrl(returnUrl ?? '/');
      },
      error: (err) => {
        this.loading.set(false);
        if (err.error?.code === 'EMAIL_NOT_VERIFIED') {
          this.emailNotVerified.set(true);
        } else {
          this.emailNotVerified.set(false);
          this.toast.error(err.error?.error ?? 'Invalid email or password');
        }
      },
    });
  }
}
