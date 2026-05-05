import { Component, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { forkJoin } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatRippleModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { RestaurantService } from '../../../core/services/restaurant.service';
import { CartService } from '../../../core/services/cart.service';
import { ToastService } from '../../../core/services/toast.service';
import { MenuCategory, MenuItem, RestaurantDetail } from '../../../core/models';
import { HygieneStarsPipe } from '../../../shared/pipes/hygiene-stars.pipe';
import { MenuItemEmojiPipe } from '../../../shared/pipes/restaurant-emoji.pipe';
import { DietaryIconPipe } from '../../../shared/pipes/order-status.pipe';
import { TiltDirective } from '../../../shared/directives/tilt.directive';
import { ScrollRevealDirective } from '../../../shared/directives/scroll-reveal.directive';
import { MagneticDirective } from '../../../shared/directives/magnetic.directive';

/**
 * (SRP: display helpers extracted to pipes; forkJoin ensures atomic data loading)
 */
@Component({
  selector: 'app-restaurant-menu',
  imports: [
    CurrencyPipe, RouterLink,
    HygieneStarsPipe, MenuItemEmojiPipe, DietaryIconPipe,
    MatButtonModule, MatChipsModule, MatRippleModule,
    MatProgressSpinnerModule, MatTooltipModule, MatBadgeModule,
    TiltDirective, ScrollRevealDirective, MagneticDirective,
  ],
  templateUrl: './restaurant-menu.html',
  styleUrl: './restaurant-menu.scss',
})
export class RestaurantMenu implements OnInit {
  readonly restaurant = signal<RestaurantDetail | null>(null);
  readonly categories = signal<MenuCategory[]>([]);
  readonly loading = signal(true);
  readonly activeCategory = signal<number | null>(null);
  readonly searchQuery = signal('');
  readonly liveModalOpen = signal(false);

  readonly availableCategories = computed(() =>
    this.categories().filter((c) => c.items.some((i) => i.isAvailable))
  );

  readonly filteredCategories = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    if (!q) return this.availableCategories();
    return this.availableCategories()
      .map((c) => ({ ...c, items: c.items.filter((i) => i.isAvailable && i.name.toLowerCase().includes(q)) }))
      .filter((c) => c.items.length > 0);
  });

  constructor(
    private readonly route: ActivatedRoute,
    private readonly restaurantService: RestaurantService,
    readonly cart: CartService,
    private readonly toast: ToastService
  ) {}

  ngOnInit(): void {
    const id = +this.route.snapshot.params['id'];
    forkJoin({
      restaurant: this.restaurantService.get(id),
      menu: this.restaurantService.getMenu(id),
    }).subscribe({
      next: ({ restaurant, menu }) => {
        this.restaurant.set(restaurant);
        this.categories.set(menu);
        if (menu.length) this.activeCategory.set(menu[0].id);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  selectCategory(id: number): void {
    this.activeCategory.set(id);
    document.getElementById('cat-' + id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  addToCart(item: MenuItem): void {
    const r = this.restaurant();
    if (!r) return;
    this.cart.addItem(item, r.id, r.name);
    this.toast.success(`${item.name} added to cart`);
  }

  removeFromCart(item: MenuItem): void {
    this.cart.removeItem(item.id);
  }
}
