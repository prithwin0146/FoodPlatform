import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RestaurantService } from '../../../core/services/restaurant.service';
import { Restaurant } from '../../../core/models';

@Component({
  selector: 'app-restaurant-list',
  imports: [RouterLink],
  templateUrl: './restaurant-list.html',
  styleUrl: './restaurant-list.scss',
})
export class RestaurantList implements OnInit {
  readonly restaurants = signal<Restaurant[]>([]);
  readonly loading = signal(true);
  readonly searchQuery = signal('');

  constructor(private readonly restaurantService: RestaurantService) {}

  ngOnInit(): void {
    this.restaurantService.list().subscribe({
      next: (data) => {
        this.restaurants.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  filteredRestaurants() {
    const q = this.searchQuery().toLowerCase();
    if (!q) return this.restaurants();
    return this.restaurants().filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.address.toLowerCase().includes(q)
    );
  }

  onSearch(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  getHygieneStars(rating: number): string {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  }

  getHygieneLabel(rating: number): string {
    if (rating === 5) return 'Excellent';
    if (rating === 4) return 'Good';
    if (rating === 3) return 'Fair';
    return 'Needs Improvement';
  }

  getRestaurantEmoji(name: string): string {
    const emojis = ['🍛', '🍕', '🍔', '🌮', '🍜', '🍣', '🥘', '🍲'];
    const hash = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    return emojis[hash % emojis.length];
  }
}
