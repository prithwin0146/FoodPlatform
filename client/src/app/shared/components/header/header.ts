import { Component, HostListener, computed, signal, effect, inject, DOCUMENT, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../../core/auth/auth.service';
import { CartService } from '../../../core/services/cart.service';
import { OrderService } from '../../../core/services/order.service';
import { FavouritesService } from '../../../core/services/favourites.service';
import { ThemeService } from '../../../core/services/theme.service';
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
  readonly cartBouncing = signal(false);
  readonly dropdownOpen = signal(false);

  private readonly doc = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  constructor(
    readonly auth: AuthService,
    readonly cart: CartService,
    readonly orderService: OrderService,
    readonly theme: ThemeService,
    private readonly favourites: FavouritesService,
    private readonly router: Router
  ) {
    // Bounce the cart icon every time a new item is added
    effect(() => {
      const added = this.cart.lastAdded();
      if (added > 0) {
        this.cartBouncing.set(false);
        // Micro-task ensures class toggling re-triggers the CSS animation
        Promise.resolve().then(() => {
          this.cartBouncing.set(true);
          setTimeout(() => this.cartBouncing.set(false), 650);
        });
      }
    });

    // Load active order count whenever a customer is logged in
    effect(() => {
      if (this.auth.isCustomer()) {
        this.orderService.loadActiveCount();
        this.favourites.loadFavourites().subscribe();
      } else {
        this.orderService.activeOrderCount.set(0);
        this.favourites.favouriteIds.set(new Set());
      }
    });
  }

  readonly dashboardLink = computed(() => {
    if (this.auth.isAdmin()) return '/admin';
    if (this.auth.isStaff()) return '/dashboard';
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
    if (!this.isBrowser) return;
    const y = window.scrollY || this.doc.documentElement.scrollTop;
    const next = y > 16;
    if (next !== this.scrolled()) this.scrolled.set(next);
    if (next && this.dropdownOpen()) this.dropdownOpen.set(false);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void { this.dropdownOpen.set(false); }

  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent): void {
    if (!this.dropdownOpen()) return;
    const target = e.target as HTMLElement;
    if (!target.closest('.avatar-wrap')) this.dropdownOpen.set(false);
  }

  toggleDropdown(): void { this.dropdownOpen.update(v => !v); }

  logout(): void {
    this.dropdownOpen.set(false);
    this.auth.clearSession();
    this.router.navigate(['/login']);
  }
}
