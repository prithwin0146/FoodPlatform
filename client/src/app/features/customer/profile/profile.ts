import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../../core/auth/auth.service';
import { ApiAuthService } from '../../../core/services/api-auth.service';
import { ScrollRevealDirective } from '../../../shared/directives/scroll-reveal.directive';

/**
 * Customer profile page.
 * SRP: owns display of account info + change-password form only.
 * DIP: delegates auth state to AuthService, HTTP to ApiAuthService.
 */
@Component({
  selector: 'app-profile',
  imports: [
    FormsModule,
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
export class Profile {
  private readonly apiAuth = inject(ApiAuthService);
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
