import {
  Component, ChangeDetectionStrategy, OnInit,
  inject, signal, computed, HostListener,
} from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { CommonModule, NgTemplateOutlet } from '@angular/common';
import { Title, Meta } from '@angular/platform-browser';
import { retry } from 'rxjs/operators';
import { timer } from 'rxjs';
import { CanonicalService } from '../../../core/services/canonical.service';
import { MatRippleModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { RestaurantService } from '../../../core/services/restaurant.service';
import { FavouritesService } from '../../../core/services/favourites.service';
import { AuthService } from '../../../core/auth/auth.service';
import { Restaurant } from '../../../core/models';

/** High-quality realistic demo dataset of 12 kitchens across London */
const DEMO_RESTAURANTS: Restaurant[] = [
  {
    id: 2, hashId: 'rest-2', name: 'Bella Napoli', cuisineType: 'Italian',
    description: 'Wood-fired sourdough pizza and fresh handmade pasta crafted live by master pizzaiolos.',
    imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80&auto=format&fit=crop',
    rating: 4.9, ratingLabel: 'Exceptional', hygieneRating: 5,
    estimatedDeliveryMinutes: 25, deliveryRadiusMiles: 1.8,
    address: '18 Soho Square, London W1D 3QL', basePostcode: 'W1D 3QL',
    isActive: true, isLive: true, liveMessage: 'Stretching sourdough & firing Margherita pizzas live',
    featured: true, supportsCollection: true, dietaryTags: ['Vegetarian', 'Vegan', 'Gluten-free'],
    phone: '+44 20 7946 0192',
  },
  {
    id: 5, hashId: 'rest-5', name: 'Green Bowl', cuisineType: 'Healthy',
    description: 'Vibrant nutrient-dense quinoa bowls, avocado toast, and fresh cold-pressed wellness juices.',
    imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80&auto=format&fit=crop',
    rating: 4.8, ratingLabel: 'Excellent', hygieneRating: 5,
    estimatedDeliveryMinutes: 20, deliveryRadiusMiles: 1.5,
    address: '12 Notting Hill Gate, London W11 3HR', basePostcode: 'W11 3HR',
    isActive: true, isLive: true, liveMessage: 'Assembling organic grain bowls & fresh dressings',
    featured: false, supportsCollection: true, dietaryTags: ['Vegan', 'Vegetarian', 'Gluten-free'],
    phone: '+44 20 7946 0843',
  },
  {
    id: 3, hashId: 'rest-3', name: 'Sakura Sushi', cuisineType: 'Japanese',
    description: 'Artisanal sushi rolls, sashimi, and warm ramen bowls prepared with daily market-fresh fish.',
    imageUrl: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&q=80&auto=format&fit=crop',
    rating: 4.8, ratingLabel: 'Excellent', hygieneRating: 5,
    estimatedDeliveryMinutes: 30, deliveryRadiusMiles: 2.4,
    address: '7 Shoreditch High Street, London E1 6JE', basePostcode: 'E1 6JE',
    isActive: true, isLive: true, liveMessage: 'Precision slicing salmon sashimi & dragon rolls',
    featured: false, supportsCollection: true, dietaryTags: ['Gluten-free', 'Halal'],
    phone: '+44 20 7946 0521',
  },
  {
    id: 1, hashId: 'rest-1', name: 'Spice Garden', cuisineType: 'Indian',
    description: 'Authentic tandoori delicacies, rich tikka masalas, and fragrant basmati biryanis.',
    imageUrl: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=80&auto=format&fit=crop',
    rating: 4.8, ratingLabel: 'Excellent', hygieneRating: 5,
    estimatedDeliveryMinutes: 28, deliveryRadiusMiles: 2.1,
    address: '42 High Street, Westminster, London SW1A 1AA', basePostcode: 'SW1A 1AA',
    isActive: true, isLive: true, liveMessage: 'Baking garlic naans in 400°C clay tandoor',
    featured: false, supportsCollection: true, dietaryTags: ['Halal', 'Vegetarian', 'Vegan'],
    phone: '+44 20 7946 0110',
  },
  {
    id: 4, hashId: 'rest-4', name: 'The Burger Joint', cuisineType: 'Burgers',
    description: 'Dry-aged smash beef burgers, crispy bacon, house sauces, and double-fried rosemary fries.',
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80&auto=format&fit=crop',
    rating: 4.6, ratingLabel: 'Very Good', hygieneRating: 4,
    estimatedDeliveryMinutes: 25, deliveryRadiusMiles: 3.2,
    address: '55 Camden High Street, London NW1 7JH', basePostcode: 'NW1 7JH',
    isActive: true, isLive: false, liveMessage: 'Grilling signature smash beef patties',
    featured: false, supportsCollection: true, dietaryTags: ['Halal'],
    phone: '+44 20 7946 0478',
  },
  {
    id: 6, hashId: 'rest-6', name: 'Dragon Wok', cuisineType: 'Chinese',
    description: 'High-heat wok hei stir-fries, crispy duck pancakes, dim sum, and spicy Szechuan beef.',
    imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&q=80&auto=format&fit=crop',
    rating: 4.7, ratingLabel: 'Very Good', hygieneRating: 5,
    estimatedDeliveryMinutes: 32, deliveryRadiusMiles: 2.6,
    address: '88 Gerrard Street, Chinatown, London W1D 5PT', basePostcode: 'W1D 5PT',
    isActive: true, isLive: true, liveMessage: 'Tossing high-heat Singapore vermicelli noodles',
    featured: false, supportsCollection: true, dietaryTags: ['Halal', 'Vegetarian'],
    phone: '+44 20 7946 0699',
  },
  {
    id: 7, hashId: 'rest-7', name: 'Taco & Cantina', cuisineType: 'Other',
    description: 'Slow-roasted birria tacos, fresh guacamole, churros, and house salsas pressed from heirloom corn.',
    imageUrl: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&q=80&auto=format&fit=crop',
    rating: 4.8, ratingLabel: 'Excellent', hygieneRating: 5,
    estimatedDeliveryMinutes: 22, deliveryRadiusMiles: 1.9,
    address: '24 Marylebone High Street, London W1U 4PQ', basePostcode: 'W1U 4PQ',
    isActive: true, isLive: true, liveMessage: 'Pressing corn tortillas & searing birria beef',
    featured: false, supportsCollection: true, dietaryTags: ['Gluten-free', 'Vegetarian', 'Halal'],
    phone: '+44 20 7946 0712',
  },
  {
    id: 8, hashId: 'rest-8', name: 'Bombay House', cuisineType: 'Indian',
    description: 'Royal Awadhi dum biryanis slow-cooked in sealed clay pots with fragrant saffron.',
    imageUrl: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&q=80&auto=format&fit=crop',
    rating: 4.7, ratingLabel: 'Very Good', hygieneRating: 5,
    estimatedDeliveryMinutes: 38, deliveryRadiusMiles: 3.8,
    address: '102 Brick Lane, London E1 6RL', basePostcode: 'E1 6RL',
    isActive: true, isLive: true, liveMessage: 'Unsealing clay pots for dum biryani orders',
    featured: false, supportsCollection: true, dietaryTags: ['Halal', 'Vegetarian'],
    phone: '+44 20 7946 0888',
  },
  {
    id: 9, hashId: 'rest-9', name: 'Ramen Master', cuisineType: 'Japanese',
    description: 'Rich 18-hour broth tonkotsu ramen, hand-pulled noodles, and melt-in-mouth chashu pork.',
    imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&q=80&auto=format&fit=crop',
    rating: 4.8, ratingLabel: 'Excellent', hygieneRating: 5,
    estimatedDeliveryMinutes: 27, deliveryRadiusMiles: 2.2,
    address: '31 Brewer Street, Soho, London W1F 0SS', basePostcode: 'W1F 0SS',
    isActive: true, isLive: false, liveMessage: 'Ladling piping hot tonkotsu broth',
    featured: false, supportsCollection: true, dietaryTags: [],
    phone: '+44 20 7946 0933',
  },
  {
    id: 10, hashId: 'rest-10', name: 'Pure Vegan Kitchen', cuisineType: 'Healthy',
    description: '100% plant-based gourmet kitchen specializing in macro bowls, raw desserts, and wellness shakes.',
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80&auto=format&fit=crop',
    rating: 4.6, ratingLabel: 'Very Good', hygieneRating: 5,
    estimatedDeliveryMinutes: 35, deliveryRadiusMiles: 2.9,
    address: '5 Islington Green, London N1 2XH', basePostcode: 'N1 2XH',
    isActive: true, isLive: false, liveMessage: 'Blending organic smoothie bowls',
    featured: false, supportsCollection: true, dietaryTags: ['Vegan', 'Vegetarian', 'Gluten-free'],
    phone: '+44 20 7946 1044',
  },
  {
    id: 11, hashId: 'rest-11', name: 'Le Petit Artisan', cuisineType: 'Other',
    description: 'French bakery and bistro serving hot croque-monsieurs, buttery quiches, and artisanal sourdough.',
    imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80&auto=format&fit=crop',
    rating: 4.9, ratingLabel: 'Exceptional', hygieneRating: 5,
    estimatedDeliveryMinutes: 24, deliveryRadiusMiles: 1.4,
    address: '14 Covent Garden Market, London WC2E 8RF', basePostcode: 'WC2E 8RF',
    isActive: true, isLive: false, liveMessage: 'Fresh croissants coming out of oven',
    featured: false, supportsCollection: true, dietaryTags: ['Vegetarian'],
    phone: '+44 20 7946 1155',
  },
  {
    id: 12, hashId: 'rest-12', name: 'La Slice Pizzeria', cuisineType: 'Pizza',
    description: 'New York-style giant pizza slices with crispy charred crust and generous mozzarella stretch.',
    imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&q=80&auto=format&fit=crop',
    rating: 4.5, ratingLabel: 'Good', hygieneRating: 5,
    estimatedDeliveryMinutes: 18, deliveryRadiusMiles: 4.2,
    address: '79 Commercial Street, London E1 6BD', basePostcode: 'E1 6BD',
    isActive: false, isLive: false, liveMessage: 'Closed for prep — opens at 5 PM',
    featured: false, supportsCollection: true, dietaryTags: ['Vegetarian'],
    phone: '+44 20 7946 1266',
  },
];

const DEAL_BADGES: Record<number, string> = {
  1: '15% off £20+', 2: '25% off £20+', 3: 'Free item on £20+',
  4: 'Buy 1, get 1',  6: '20% off £20+', 7: '40% off £20+',
  8: 'Buy 1, get a free item', 10: '50% off select items',
};

const DELIVERY_FEES: Record<number, string> = {
  1: '£1.29', 2: '£0.29', 3: '£0.79', 4: '£1.79', 5: '£0.00',
  6: '£1.29', 7: '£0.79', 8: '£1.29', 9: '£1.79', 10: '£0.29',
  11: '£0.79', 12: '£1.29',
};

const REVIEW_COUNTS: Record<number, string> = {
  1: '500+', 2: '1,000+', 3: '600+', 4: '400+', 5: '200+', 6: '700+',
  7: '300+', 8: '800+', 9: '500+', 10: '150+', 11: '250+', 12: '600+',
};

const GREAT_VALUE_IDS = new Set([4, 7, 9, 12]);

@Component({
  selector: 'app-restaurants-browse',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, RouterLink, NgTemplateOutlet,
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

  readonly restaurants    = signal<Restaurant[]>(DEMO_RESTAURANTS);
  readonly loading        = signal(false);
  readonly searchQuery    = signal('');
  readonly searchFocused  = signal(false);
  readonly togglingFavId  = signal<number | null>(null);
  readonly showOffersOnly = signal(false);
  readonly activeCategoryLabel = signal('');

  readonly CUISINE_OPTIONS  = ['All', 'Indian', 'Italian', 'Japanese', 'Burgers', 'Chinese', 'Healthy', 'Pizza', 'Other'];
  readonly DIETARY_OPTIONS  = ['Vegetarian', 'Vegan', 'Halal', 'Gluten-free'];
  readonly RATING_OPTIONS   = [
    { label: 'Any rating', value: 0 },
    { label: '4.0+ Stars', value: 4.0 },
    { label: '4.5+ Stars', value: 4.5 },
  ];
  readonly DELIVERY_OPTIONS = [
    { label: 'Any time', value: null },
    { label: 'Under 30 min', value: 30 },
    { label: 'Under 45 min', value: 45 },
  ];
  readonly DISTANCE_OPTIONS = [
    { label: 'Any distance', value: null },
    { label: 'Under 2 miles', value: 2 },
    { label: 'Under 5 miles', value: 5 },
  ];
  readonly POPULAR_SEARCHES = ['Pizza', 'Sushi', 'Burgers', 'Healthy', 'Indian', 'Biryani'];

  readonly CATEGORY_ICONS = [
    { emoji: '🛒', label: 'Grocery',  filter: 'All'      },
    { emoji: '🥡', label: 'Chinese',  filter: 'Chinese'  },
    { emoji: '🍕', label: 'Pizza',    filter: 'Pizza'    },
    { emoji: '🍛', label: 'Indian',   filter: 'Indian'   },
    { emoji: '🍦', label: 'Desserts', filter: 'Other'    },
    { emoji: '🍣', label: 'Sushi',    filter: 'Japanese' },
    { emoji: '🥙', label: 'Halal',    filter: 'All'      },
    { emoji: '🥗', label: 'Healthy',  filter: 'Healthy'  },
    { emoji: '🍔', label: 'Burgers',  filter: 'Burgers'  },
    { emoji: '🍜', label: 'Noodles',  filter: 'Japanese' },
    { emoji: '🌮', label: 'Mexican',  filter: 'Other'    },
    { emoji: '🍞', label: 'Bakery',   filter: 'Other'    },
    { emoji: '🌱', label: 'Vegan',    filter: 'Healthy'  },
    { emoji: '🍱', label: 'Japanese', filter: 'Japanese' },
  ];

  readonly PROMO_BANNERS = [
    {
      id: 1,
      title: 'Try SeeThePrep Plus free for 4 weeks',
      desc: 'Enjoy £0 delivery fees, exclusive member discounts, and live kitchen access.',
      cta: 'Join now',
      bg: '#fef6e8', textColor: '#1a1410', btnBg: '#1a1410', btnColor: '#ffffff',
      imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80&auto=format&fit=crop',
    },
    {
      id: 2,
      title: 'Pickup – same prices, no waiting',
      desc: 'Enjoy your favourites at in-store prices when you pick up.',
      cta: 'Order now',
      bg: '#ff6b1a', textColor: '#ffffff', btnBg: '#ffffff', btnColor: '#ff6b1a',
      imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&q=80&auto=format&fit=crop',
    },
    {
      id: 3,
      title: 'Weekend deals: Up to 40% off select restaurants',
      desc: 'Enjoy more savings this weekend with our exclusive offers.',
      cta: 'Shop now',
      bg: '#10b981', textColor: '#ffffff', btnBg: '#ffffff', btnColor: '#10b981',
      imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80&auto=format&fit=crop',
    },
  ];

  readonly cuisineFilter   = signal('All');
  readonly sortOption      = signal<'rating' | 'time' | 'distance' | 'popular'>('rating');
  readonly activeDietary   = signal<string[]>([]);
  readonly ratingFilter    = signal<number>(0);
  readonly maxDeliveryTime = signal<number | null>(null);
  readonly maxDistance     = signal<number | null>(null);
  readonly filterSheetOpen = signal(false);

  /* ── Section computed signals ── */
  readonly featuredCards  = computed(() => this.restaurants().slice(0, 4));
  readonly popularCards   = computed(() =>
    [...this.restaurants()].sort((a, b) => (b.rating || 4.5) - (a.rating || 4.5)).slice(0, 4));
  readonly qualityCards   = computed(() =>
    this.restaurants().filter(r => (r.rating || 4.5) >= 4.7).slice(0, 4));
  readonly offersCards    = computed(() =>
    this.restaurants().filter(r => !!DEAL_BADGES[r.id]).slice(0, 4));
  readonly legendCards    = computed(() =>
    this.restaurants().filter(r => r.isLive).slice(0, 4));
  readonly budgetCards    = computed(() =>
    [...this.restaurants()].sort((a, b) => a.deliveryRadiusMiles - b.deliveryRadiusMiles).slice(0, 4));
  readonly nationalCards  = computed(() => this.restaurants().slice(3, 7));
  readonly lovedDealsCards = computed(() =>
    this.restaurants().filter(r => !!DEAL_BADGES[r.id]).slice(0, 4));

  readonly activeFilterCount = computed(() => {
    let c = 0;
    if (this.cuisineFilter() !== 'All')     c++;
    if (this.activeDietary().length > 0)    c += this.activeDietary().length;
    if (this.ratingFilter() > 0)            c++;
    if (this.maxDeliveryTime() !== null)    c++;
    if (this.maxDistance() !== null)        c++;
    if (this.showOffersOnly())              c++;
    return c;
  });

  readonly favouriteRestaurants = computed(() =>
    this.restaurants().filter(r => this.favourites.isFavourite(r.id)));

  readonly searchSuggestions = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    if (!q) return [];
    return this.restaurants().filter(r =>
      r.name.toLowerCase().includes(q) ||
      r.cuisineType.toLowerCase().includes(q) ||
      (r.description && r.description.toLowerCase().includes(q)) ||
      (r.address && r.address.toLowerCase().includes(q))
    ).slice(0, 4);
  });

  readonly filteredRestaurants = computed(() => {
    const q         = this.searchQuery().trim().toLowerCase();
    const cuisine   = this.cuisineFilter();
    const dietary   = this.activeDietary();
    const minRating = this.ratingFilter();
    const maxTime   = this.maxDeliveryTime();
    const maxDist   = this.maxDistance();
    const sort      = this.sortOption();
    const offersOnly = this.showOffersOnly();

    let result = this.restaurants().filter(r => {
      if (cuisine !== 'All' && r.cuisineType !== cuisine) return false;
      if (dietary.length > 0) {
        const tags = r.dietaryTags || [];
        const ok = dietary.every(d =>
          tags.includes(d) ||
          (d === 'Vegan'       && r.cuisineType === 'Healthy') ||
          (d === 'Vegetarian'  && ['Healthy', 'Italian', 'Indian'].includes(r.cuisineType)) ||
          (d === 'Halal'       && ['Indian', 'Chinese', 'Burgers'].includes(r.cuisineType))
        );
        if (!ok) return false;
      }
      const rRating = r.rating || (r.hygieneRating >= 5 ? 4.8 : 4.2);
      if (minRating > 0 && rRating < minRating) return false;
      if (maxTime !== null && r.estimatedDeliveryMinutes > maxTime) return false;
      if (maxDist !== null && r.deliveryRadiusMiles > maxDist) return false;
      if (offersOnly && !DEAL_BADGES[r.id]) return false;
      if (q) {
        const hit = r.name.toLowerCase().includes(q) ||
          r.cuisineType.toLowerCase().includes(q) ||
          (r.description || '').toLowerCase().includes(q) ||
          (r.address || '').toLowerCase().includes(q) ||
          (r.liveMessage || '').toLowerCase().includes(q);
        if (!hit) return false;
      }
      return true;
    });

    if (sort === 'rating')   result = [...result].sort((a, b) => (b.rating || 4.5) - (a.rating || 4.5));
    if (sort === 'time')     result = [...result].sort((a, b) => a.estimatedDeliveryMinutes - b.estimatedDeliveryMinutes);
    if (sort === 'distance') result = [...result].sort((a, b) => a.deliveryRadiusMiles - b.deliveryRadiusMiles);
    if (sort === 'popular')  result = [...result].sort((a, b) => (b.isLive ? 1 : 0) - (a.isLive ? 1 : 0));
    return result;
  });

  /* ── Helper methods ── */
  getDeal(id: number): string | null        { return DEAL_BADGES[id]   || null; }
  getDeliveryFee(id: number): string        { return DELIVERY_FEES[id] || '£1.29'; }
  getReviewCount(id: number): string        { return REVIEW_COUNTS[id] || '500+'; }
  isGreatValue(id: number): boolean         { return GREAT_VALUE_IDS.has(id); }

  scrollSection(containerId: string, direction: number): void {
    const el = document.getElementById(containerId);
    if (el) el.scrollBy({ left: direction * 264, behavior: 'smooth' });
  }

  setCategoryFilter(cat: { emoji: string; label: string; filter: string }): void {
    this.cuisineFilter.set(cat.filter);
    this.activeCategoryLabel.set(cat.label);
  }

  constructor() {
    inject(Title).setTitle("Discover What's Cooking Near You | SeeThePrep");
    inject(CanonicalService).set('https://seetheprep.com/restaurants');
    const meta = inject(Meta);
    meta.updateTag({ name: 'description', content: 'Discover real verified kitchens cooking live right now. Watch chefs prepare your food with 100% transparency before ordering.' });
    meta.updateTag({ property: 'og:title', content: "Discover What's Cooking Near You | SeeThePrep" });
    meta.updateTag({ property: 'og:url', content: 'https://seetheprep.com/restaurants' });
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['q'])       this.searchQuery.set(params['q']);
      if (params['cuisine']) this.cuisineFilter.set(params['cuisine']);
    });

    this.restaurantService.list()
      .pipe(retry({ count: 2, delay: () => timer(1500) }))
      .subscribe({
        next: (apiData) => {
          if (apiData && apiData.length > 0) {
            const merged = DEMO_RESTAURANTS.map(demo => {
              const match = apiData.find(a => a.id === demo.id || a.name.toLowerCase() === demo.name.toLowerCase());
              if (match) {
                return { ...demo, id: match.id, hashId: match.hashId || demo.hashId,
                  angelcamCameraId: match.angelcamCameraId || (demo.isLive ? 'demo-cam' : null),
                  imageUrl: match.imageUrl || demo.imageUrl };
              }
              return demo;
            });
            this.restaurants.set(merged);
          }
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });

    if (this.auth.isCustomer()) this.favourites.loadFavourites().subscribe();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.search-box-container')) this.searchFocused.set(false);
  }

  onSearchInput(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  selectPopularSearch(query: string): void {
    this.searchQuery.set(query);
    this.searchFocused.set(false);
  }

  onSortChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value as 'rating' | 'time' | 'distance' | 'popular';
    this.sortOption.set(val);
  }

  toggleDietary(tag: string): void {
    const cur = this.activeDietary();
    this.activeDietary.set(cur.includes(tag) ? cur.filter(t => t !== tag) : [...cur, tag]);
  }

  openFilterSheet():  void { this.filterSheetOpen.set(true); }
  closeFilterSheet(): void { this.filterSheetOpen.set(false); }

  clearFilters(): void {
    this.cuisineFilter.set('All');
    this.activeDietary.set([]);
    this.ratingFilter.set(0);
    this.maxDeliveryTime.set(null);
    this.maxDistance.set(null);
    this.searchQuery.set('');
    this.showOffersOnly.set(false);
    this.activeCategoryLabel.set('');
  }

  toggleFavourite(event: Event, restaurant: Restaurant): void {
    event.preventDefault();
    event.stopPropagation();
    if (!this.auth.isCustomer() || this.togglingFavId() !== null) return;
    this.togglingFavId.set(restaurant.id);
    this.favourites.toggle(restaurant.hashId, restaurant.id).subscribe({
      next:  () => this.togglingFavId.set(null),
      error: () => this.togglingFavId.set(null),
    });
  }
}
