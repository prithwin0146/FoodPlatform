import { Component, HostListener, computed, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../../core/auth/auth.service';
import { CartService } from '../../../core/services/cart.service';
import { MagneticDirective } from '../../directives/magnetic.directive';
import { Logo } from '../logo/logo';

/**
 * Navigation shell component.
 *
 * SOLID:
 *  - SRP: Owns navigation chrome only — delegates auth/cart state to services.
 *  - DIP: Router lives here, NOT in AuthService (avoids circular dep).
 */
@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive, MatButtonModule, MatTooltipModule, MagneticDirective, Logo],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  readonly scrolled = signal(false);

  constructor(
    readonly auth: AuthService,
    readonly cart: CartService,
    private readonly router: Router
  ) {}

  readonly dashboardLink = computed(() => {
    if (this.auth.isAdmin()) return '/admin';
    if (this.auth.isStaff()) return '/restaurant';
    return null;
  });

  /** First letter of the username (falls back to role) for the avatar pill. */
  readonly userInitial = computed(() => {
    const name = this.auth.username() ?? this.auth.role() ?? '?';
    return name.charAt(0).toUpperCase();
  });

  /** Capitalised username for the greeting (falls back to friendly role label). */
  readonly displayName = computed(() => {
    const u = this.auth.username();
    if (u && u.length > 0) return u.charAt(0).toUpperCase() + u.slice(1);
    return this.roleLabel() || 'there';
  });

  /** Friendly role label (Customer / Staff / Admin). */
  readonly roleLabel = computed(() => {
    const r = this.auth.role();
    if (!r) return '';
    return r.charAt(0).toUpperCase() + r.slice(1).toLowerCase();
  });

  @HostListener('window:scroll')
  onScroll(): void {
    const y = window.scrollY || document.documentElement.scrollTop;
    const next = y > 16;
    if (next !== this.scrolled()) this.scrolled.set(next);
  }

  logout(): void {
    this.auth.clearSession();
    this.router.navigate(['/login']);
  }
}
