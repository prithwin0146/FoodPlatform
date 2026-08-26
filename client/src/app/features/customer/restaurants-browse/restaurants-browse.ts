import {
  Component, ChangeDetectionStrategy, OnInit,
  inject, signal, computed,
} from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { retry } from 'rxjs/operators';
import { timer } from 'rxjs';
import { CanonicalService } from '../../../core/services/canonical.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRippleModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { RestaurantService } from '../../../core/services/restaurant.service';
import { FavouritesService } from '../../../core/services/favourites.service';
import { AuthService } from '../../../core/auth/auth.service';
import { Restaurant } from '../../../core/models';
import { HygieneStarsPipe } from '../../../shared/pipes/hygiene-stars.pipe';
import { HygieneLabelPipe } from '../../../shared/pipes/order-status.pipe';
import { TiltDirective } from '../../../shared/directives/tilt.directive';
import { ScrollRevealDirective } from '../../../shared/directives/scroll-reveal.directive';
import { MagneticDirective } from '../../../shared/directives/magnetic.directive';
import { ParallaxHoverDirective } from '../../../shared/directives/parallax-hover.directive';
import { RadialSelectDirective } from '../../../shared/directives/radial-select.directive';
import { ImageFallback } from '../../../shared/components/image-fallback/image-fallback';
import { PlusInterstitial } from '../../../shared/components/plus-interstitial/plus-interstitial';

/**
 * RestaurantsBrowse — /restaurants
 *
 * SRP  : owns restaurant list browsing only; home-page marketing stays in RestaurantList.
 * OCP  : add new filter types via CUISINE_OPTIONS / DIETARY_OPTIONS constants — no component changes.
 * DIP  : injects RestaurantService, FavouritesService, AuthService via Angular DI.
 */
@Component({
  selector: 'app-restaurants-browse',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    HygieneStarsPipe, HygieneLabelPipe,
    TiltDirective, ScrollRevealDirective, MagneticDirective,
    ParallaxHoverDirective, RadialSelectDirective,
    ImageFallback,
    PlusInterstitial,
    MatFormFieldModule, MatInputModule,
    MatRippleModule, MatTooltipModule, MatButtonModule,
  ],
  templateUrl: './restaurants-browse.html',
  styleUrl: './restaurants-browse.scss',
})
export class RestaurantsBrowse implements OnInit {
  private readonly restaurantService = inject(RestaurantService);
  readonly favourites = inject(FavouritesService);
  readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  readonly restaurants = signal<Restaurant[]>([]);
  readonly loading = signal(true);
  readonly searchQuery = signal('');
  readonly togglingFavId = signal<number | null>(null);

  readonly CUISINE_OPTIONS = ['All', 'Indian', 'Italian', 'Japanese', 'Burgers', 'Chinese', 'Healthy', 'Pizza', 'Other'];
  readonly DIETARY_OPTIONS = ['Vegan', 'Vegetarian', 'Halal', 'Gluten-free'];

  readonly cuisineFilter = signal('All');
  readonly sortOption = signal<'name' | 'rating' | 'time'>('rating');
  readonly activeDietary = signal<string[]>([]);

  /** Restaurants the customer has saved — pinned above the main grid. */
  readonly favouriteRestaurants = computed(() =>
    this.restaurants().filter(r => this.favourites.isFavourite(r.id))
  );

  /** Filtered + sorted restaurant list — recomputes on any signal change. */
  readonly filteredRestaurants = computed(() => {
    const q = this.searchQuery().toLowerCase();
    const cuisine = this.cuisineFilter();
    const dietary = this.activeDietary();
    const sort = this.sortOption();

    let result = this.restaurants().filter(r => {
      if (cuisine !== 'All' && r.cuisineType !== cuisine) return false;
      if (dietary.length > 0) {
        const tags = r.cuisineType?.toLowerCase() ?? '';
        const veganCuisines = ['healthy'];
        const vegCuisines = ['healthy', 'indian'];
        if (dietary.includes('Vegan') && !veganCuisines.includes(tags)) return false;
        if (dietary.includes('Vegetarian') && !vegCuisines.includes(tags)) return false;
        if (dietary.includes('Halal') && !['indian', 'chinese'].includes(tags)) return false;
      }
      if (q) return r.name.toLowerCase().includes(q) || r.address.toLowerCase().includes(q);
      return true;
    });

    if (sort === 'name') result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === 'rating') result = [...result].sort((a, b) => b.hygieneRating - a.hygieneRating);
    else if (sort === 'time') result = [...result].sort((a, b) => a.estimatedDeliveryMinutes - b.estimatedDeliveryMinutes);

    return result;
  });

  constructor() {
    inject(Title).setTitle('Browse Live Kitchens | SeeThePrep');
    inject(CanonicalService).set('https://seetheprep.com/restaurants');
    const meta = inject(Meta);
    meta.updateTag({ name: 'description', content: 'Browse FSA 5-star verified live kitchens near you. Watch your food being cooked in HD — every order, every time.' });
    meta.updateTag({ property: 'og:title', content: 'Browse Live Kitchens | SeeThePrep' });
    meta.updateTag({ property: 'og:url', content: 'https://seetheprep.com/restaurants' });
  }

  ngOnInit(): void {
    // Seed search from ?q= passed by the home-page Kitchen Spotlight
    this.route.queryParams.subscribe(params => {
      if (params['q']) this.searchQuery.set(params['q']);
    });

    this.restaurantService.list()
      .pipe(retry({ count: 3, delay: () => timer(2000) }))
      .subscribe({
        next: (data) => { this.restaurants.set(data); this.loading.set(false); },
        error: () => this.loading.set(false),
      });

    if (this.auth.isCustomer()) {
      this.favourites.loadFavourites().subscribe();
    }
  }

  onSearch(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  onSort(event: Event): void {
    this.sortOption.set((event.target as HTMLSelectElement).value as 'name' | 'rating' | 'time');
  }

  toggleDietary(tag: string): void {
    const current = this.activeDietary();
    this.activeDietary.set(
      current.includes(tag) ? current.filter(t => t !== tag) : [...current, tag]
    );
  }

  toggleFavourite(event: Event, restaurant: Restaurant): void {
    event.preventDefault();
    event.stopPropagation();
    if (!this.auth.isCustomer() || this.togglingFavId() !== null) return;
    this.togglingFavId.set(restaurant.id);
    this.favourites.toggle(restaurant.hashId, restaurant.id).subscribe({
      next: () => this.togglingFavId.set(null),
      error: () => this.togglingFavId.set(null),
    });
  }
}
