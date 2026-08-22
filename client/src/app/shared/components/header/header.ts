import { Component, HostListener, computed, signal, effect, inject, DOCUMENT, PLATFORM_ID, OnDestroy, NgZone } from '@angular/core';
import { isPlatformBrowser, NgTemplateOutlet } from '@angular/common';
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
  imports: [RouterLink, RouterLinkActive, MatButtonModule, MatTooltipModule, MagneticDirective, Logo, NgTemplateOutlet],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header implements OnDestroy {
  readonly scrolled = signal(false);
  readonly cartBouncing = signal(false);
  readonly dropdownOpen = signal(false);
  /** Mobile primary-nav sheet (hamburger menu) — separate from the account dropdown. */
  readonly mobileNavOpen = signal(false);
  /** 0..1 — how far the user has scrolled. Drives glass intensity via --glow-progress. */
  readonly scrollProgress = signal(0);
  /** Mobile detection for responsive sheet presentation */
  readonly isMobile = signal(false);

  private readonly doc = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly zone = inject(NgZone);
  private lastScrollY = 0;

  constructor(
    readonly auth: AuthService,
    readonly cart: CartService,
    readonly orderService: OrderService,
    private readonly _theme: ThemeService,
    private readonly favourites: FavouritesService,
    private readonly router: Router
  ) {
    // Mobile detection for responsive sheet presentation
    if (this.isBrowser) {
      this.checkMobile();
      this.zone.runOutsideAngular(() => {
        window.addEventListener('resize', this.onResize);
        window.addEventListener('scroll', this.onScroll, { passive: true });
      });
    }

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

    // Lock background scroll while a full-screen mobile sheet (nav or
    // account) is open — prevents the page scrolling behind the sheet
    // on touch devices, a common mobile UX bug.
    if (this.isBrowser) {
      effect(() => {
        const mobileSheetOpen = this.mobileNavOpen() || (this.dropdownOpen() && this.isMobile());
        this.doc.body.style.overflow = mobileSheetOpen ? 'hidden' : '';
      });
    }
  }

  ngOnDestroy(): void {
    if (this.isBrowser) {
      this.doc.body.style.overflow = '';
      window.removeEventListener('resize', this.onResize);
      window.removeEventListener('scroll', this.onScroll);
    }
  }

  private readonly onResize = (): void => {
    const isMob = window.innerWidth < 768;
    if (this.isMobile() !== isMob) {
      this.zone.run(() => this.isMobile.set(isMob));
    }
  };

  /** Check if viewport is mobile-sized for sheet presentation */
  private checkMobile(): void {
    this.isMobile.set(window.innerWidth < 768);
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

  private readonly onScroll = (): void => {
    if (!this.isBrowser) return;
    const y = window.scrollY || this.doc.documentElement.scrollTop;
    const next = y > 16;
    
    // Only trigger Angular change detection if state actually changes
    const stateChanged = next !== this.scrolled();
    const scrollDelta = Math.abs(y - this.lastScrollY);
    
    // Only close dropdowns if the user actually scrolled a decent amount (e.g., > 10px),
    // to prevent accidental 1px scrolls when tapping from instantly closing the menu.
    const shouldCloseDropdowns = next && scrollDelta > 10 && (this.dropdownOpen() || this.mobileNavOpen());

    if (stateChanged || shouldCloseDropdowns) {
      this.zone.run(() => {
        if (stateChanged) this.scrolled.set(next);
        if (shouldCloseDropdowns) {
          if (this.dropdownOpen()) this.dropdownOpen.set(false);
          if (this.mobileNavOpen()) this.mobileNavOpen.set(false);
        }
      });
    }

    if (scrollDelta > 10) {
      this.lastScrollY = y;
    }

    // Scroll progress calculation
    const docEl = this.doc.documentElement;
    const max = Math.max(1, docEl.scrollHeight - window.innerHeight);
    const p = Math.min(1, Math.max(0, y / max));
    
    if (Math.abs(this.scrollProgress() - p) > 0.01) {
      this.zone.run(() => this.scrollProgress.set(p));
    }
  };

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.dropdownOpen.set(false);
    this.mobileNavOpen.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent): void {
    if (!this.dropdownOpen()) return;
    const target = e.target as HTMLElement;
    if (!target.closest('.avatar-wrap')) this.dropdownOpen.set(false);
  }

  toggleDropdown(): void { this.dropdownOpen.update(v => !v); }

  toggleMobileNav(): void { this.mobileNavOpen.update(v => !v); }

  closeMobileNav(): void { this.mobileNavOpen.set(false); }

  logout(): void {
    this.dropdownOpen.set(false);
    this.mobileNavOpen.set(false);
    this.auth.clearSession();
    this.router.navigate(['/login']);
  }
}
