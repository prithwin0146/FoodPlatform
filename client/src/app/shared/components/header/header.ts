import { Component, computed } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { CartService } from '../../../core/services/cart.service';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  constructor(
    readonly auth: AuthService,
    readonly cart: CartService
  ) {}

  readonly dashboardLink = computed(() => {
    if (this.auth.isAdmin()) return '/admin';
    if (this.auth.isStaff()) return '/restaurant';
    return null;
  });
}
