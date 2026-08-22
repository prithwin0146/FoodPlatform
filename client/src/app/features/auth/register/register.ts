import { Component, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
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
import { Logo } from '../../../shared/components/logo/logo';
import { AuthService } from '../../../core/auth/auth.service';
import { SILENT_ERROR_HEADER } from '../../../core/auth/error.interceptor';
import { HttpHeaders } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

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
    Logo,
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
  private readonly platformId = inject(PLATFORM_ID);

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
    private readonly auth: AuthService,
    private readonly toast: ToastService,
    private readonly router: Router
  ) {
    inject(Title).setTitle('Create Account | SeeThePrep');
    const meta = inject(Meta);
    meta.updateTag({ name: 'description', content: 'Join SeeThePrep — create a free account to order food from live-streamed kitchens across the UK. FSA 5-star restaurants, full allergen transparency.' });
    meta.updateTag({ name: 'robots', content: 'noindex, follow' });
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.initGoogleOAuth();
    }
  }

  private initGoogleOAuth() {
    const checkGoogle = setInterval(() => {
      // @ts-ignore
      if (typeof window !== 'undefined' && window.google && window.google.accounts) {
        clearInterval(checkGoogle);
        this.renderGoogleButton();
      }
    }, 100);

    // Stop checking after 5 seconds just in case it's blocked by adblockers
    setTimeout(() => clearInterval(checkGoogle), 5000);
  }

  private renderGoogleButton() {
    // @ts-ignore
    window.handleGoogleCredentialResponse = (response: any) => {
      this.loading.set(true);
      const headers = new HttpHeaders().set(SILENT_ERROR_HEADER, 'true');
      this.apiAuth.loginWithGoogle(response.credential, headers).subscribe({
        next: (res) => this.handleSuccessfulLogin(res),
        error: (err) => {
          this.loading.set(false);
          this.toast.error(err.error?.error ?? 'Google sign in failed');
        }
      });
    };

    // @ts-ignore
    window.google.accounts.id.initialize({
      client_id: environment.googleClientId,
      // @ts-ignore
      callback: window.handleGoogleCredentialResponse
    });

    // @ts-ignore
    const btnWidth = window.innerWidth < 480 ? window.innerWidth - 48 : 360;
    
    // @ts-ignore
    window.google.accounts.id.renderButton(
      document.getElementById('google-btn'),
      { theme: 'filled_black', size: 'large', shape: 'pill', text: 'continue_with', width: btnWidth }
    );
  }


  private handleSuccessfulLogin(res: any) {
    this.auth.setSession(res);
    this.toast.success('Welcome!');
    if (res.role === 'Admin') this.router.navigate(['/admin']);
    else if (res.role === 'Staff') this.router.navigate(['/dashboard']);
    else this.router.navigateByUrl('/');
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
          // Global error interceptor handles the toast display automatically
        },
      });
  }
}
