import { Component, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { RestaurantService } from '../../../core/services/restaurant.service';
import { CartService } from '../../../core/services/cart.service';
import { ToastService } from '../../../core/services/toast.service';
import { MenuCategory, MenuItem, RestaurantDetail } from '../../../core/models';

@Component({
  selector: 'app-restaurant-menu',
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './restaurant-menu.html',
  styleUrl: './restaurant-menu.scss',
})
export class RestaurantMenu implements OnInit {
  readonly restaurant = signal<RestaurantDetail | null>(null);
  readonly categories = signal<MenuCategory[]>([]);
  readonly loading = signal(true);
  readonly activeCategory = signal<number | null>(null);

  readonly availableCategories = computed(() =>
    this.categories().filter((c) => c.items.some((i) => i.isAvailable))
  );

  constructor(
    private readonly route: ActivatedRoute,
    private readonly restaurantService: RestaurantService,
    readonly cart: CartService,
    private readonly toast: ToastService
  ) {}

  ngOnInit(): void {
    const id = +this.route.snapshot.params['id'];
    this.restaurantService.get(id).subscribe({
      next: (r) => this.restaurant.set(r),
    });
    this.restaurantService.getMenu(id).subscribe({
      next: (cats) => {
        this.categories.set(cats);
        if (cats.length) this.activeCategory.set(cats[0].id);
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

  getItemEmoji(name: string): string {
    const emojis = ['🍛', '🥗', '🍗', '🥘', '🍲', '🌶️', '🧀', '🥙', '🍰', '☕'];
    const hash = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    return emojis[hash % emojis.length];
  }

  getDietaryIcon(tag: string): string {
    const map: Record<string, string> = {
      vegetarian: '🥬', vegan: '🌱', 'gluten-free': '🌾', halal: '☪️', spicy: '🌶️',
    };
    return map[tag.toLowerCase().trim()] ?? '🏷️';
  }

  getHygieneStars(rating: number): string {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  }
}
