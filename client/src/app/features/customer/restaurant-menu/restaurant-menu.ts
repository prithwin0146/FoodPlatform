import { Component, OnInit, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { DOCUMENT, CurrencyPipe, DatePipe } from '@angular/common';
import { forkJoin } from 'rxjs';
import { CanonicalService } from '../../../core/services/canonical.service';
import { ReviewService } from '../../../core/services/review.service';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatRippleModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { RestaurantService } from '../../../core/services/restaurant.service';
import { CartService } from '../../../core/services/cart.service';
import { ToastService } from '../../../core/services/toast.service';
import { MenuCategory, MenuItem, RestaurantDetail, Review } from '../../../core/models';
import { HygieneStarsPipe } from '../../../shared/pipes/hygiene-stars.pipe';
import { MenuItemEmojiPipe } from '../../../shared/pipes/restaurant-emoji.pipe';
import { DietaryIconPipe } from '../../../shared/pipes/order-status.pipe';
import { SafeUrlPipe } from '../../../shared/pipes/safe-url.pipe';
import { TiltDirective } from '../../../shared/directives/tilt.directive';
import { ScrollRevealDirective } from '../../../shared/directives/scroll-reveal.directive';
import { MagneticDirective } from '../../../shared/directives/magnetic.directive';
import { LiveStreamPlayer } from '../../../shared/components/live-stream-player/live-stream-player';
import { ImageFallback } from '../../../shared/components/image-fallback/image-fallback';

/**
 * (SRP: display helpers extracted to pipes; forkJoin ensures atomic data loading)
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-restaurant-menu',
  imports: [
    CurrencyPipe, DatePipe, RouterLink,
    HygieneStarsPipe, SafeUrlPipe,
    MatButtonModule, MatChipsModule, MatRippleModule,
    MatProgressSpinnerModule, MatTooltipModule, MatBadgeModule,
    ScrollRevealDirective, MagneticDirective,
    LiveStreamPlayer, ImageFallback,
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
  /** Angelcam HLS URL — fetched once when the live modal is first opened. Null = not yet fetched, '' = fetch failed. */
  readonly liveStreamUrl = signal<string | null>(null);
  readonly liveStreamLoading = signal(false);

  openLiveModal(): void {
    this.liveModalOpen.set(true);
    const r = this.restaurant();
    // Skip fetch if: no camera configured, already loading, or already have a valid URL.
    // Allow retry if previous fetch failed (liveStreamUrl() === '').
    if (!r?.angelcamCameraId || this.liveStreamLoading() || !!this.liveStreamUrl()) return;
    this.liveStreamLoading.set(true);
    this.restaurantService.getLiveStreamUrl(r.hashId).subscribe({
      next: (res) => { this.liveStreamUrl.set(res.hlsUrl); this.liveStreamLoading.set(false); },
      error: () => { this.liveStreamUrl.set(null); this.liveStreamLoading.set(false); },
    });
  }

  // ── Reviews
  readonly reviews = signal<Review[]>([]);
  readonly avgRating = computed(() => {
    const rs = this.reviews();
    if (!rs.length) return null;
    return Math.round((rs.reduce((s, r) => s + r.stars, 0) / rs.length) * 10) / 10;
  });

  // ── Open / closed status based on today's hours
  readonly todayHours = computed(() => {
    const r = this.restaurant();
    if (!r?.hours?.length) return null;
    const dayIndex = new Date().getDay(); // 0 = Sunday
    return r.hours.find(h => h.dayOfWeek === dayIndex) ?? null;
  });

  readonly isOpenNow = computed(() => {
    const r = this.restaurant();
    if (!r?.isActive) return false;
    const h = this.todayHours();
    if (!h || h.isClosed) return false;
    // openTime / closeTime arrive as "HH:mm:ss" strings from .NET TimeSpan serialization
    const [oh, om] = h.openTime.split(':').map(Number);
    const [ch, cm] = h.closeTime.split(':').map(Number);
    const now = new Date();
    const nowMins = now.getHours() * 60 + now.getMinutes();
    return nowMins >= oh * 60 + om && nowMins <= ch * 60 + cm;
  });

  readonly todayHoursLabel = computed(() => {
    const h = this.todayHours();
    if (!h || h.isClosed) return 'Closed today';
    const fmt = (t: string) => t.substring(0, 5); // "HH:mm"
    return `${fmt(h.openTime)} – ${fmt(h.closeTime)}`;
  });

  // ── Dietary filter (within this restaurant's menu)
  readonly MENU_DIETARY = ['Vegan', 'Vegetarian', 'Halal', 'Gluten-free'];
  readonly dietaryFilter = signal<string[]>([]);

  readonly availableCategories = computed(() =>
    this.categories().filter((c) => c.items.some((i) => i.isAvailable))
  );

  readonly filteredCategories = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const dietary = this.dietaryFilter();
    return this.availableCategories()
      .map((c) => ({
        ...c,
        items: c.items.filter((i) => {
          if (!i.isAvailable) return false;
          if (q && !i.name.toLowerCase().includes(q)) return false;
          if (dietary.length > 0) {
            const tags = (i.dietaryTags ?? []).map(t => t.toLowerCase());
            if (!dietary.every(d => tags.includes(d.toLowerCase()))) return false;
          }
          return true;
        }),
      }))
      .filter((c) => c.items.length > 0);
  });

  private readonly titleSvc = inject(Title);
  private readonly metaSvc = inject(Meta);
  private readonly doc = inject(DOCUMENT);
  private readonly canonicalSvc = inject(CanonicalService);

  constructor(
    private readonly route: ActivatedRoute,
    private readonly restaurantService: RestaurantService,
    private readonly reviewService: ReviewService,
    readonly cart: CartService,
    private readonly toast: ToastService
  ) {}

  ngOnInit(): void {
    const hash = this.route.snapshot.params['id'] as string;
    forkJoin({
      restaurant: this.restaurantService.get(hash),
      menu: this.restaurantService.getMenu(hash),
    }).subscribe({
      next: ({ restaurant, menu }) => {
        this.restaurant.set(restaurant);
        this.categories.set(menu);
        // Reviews need the numeric restaurantId which is returned in the restaurant response
        this.reviewService.listForRestaurant(restaurant.id).subscribe(r => this.reviews.set(r));
        if (menu.length) this.activeCategory.set(menu[0].id);
        this.loading.set(false);

        // Dynamic per-restaurant SEO
        const pageTitle = `Order from ${restaurant.name} — Watch It Cook Live | SeeThePrep`;
        this.titleSvc.setTitle(pageTitle);
        this.metaSvc.updateTag({ name: 'description', content: `Order from ${restaurant.name} on SeeThePrep and watch your meal being prepared live on camera. ${restaurant.hygieneRating === 5 ? 'FSA 5-star rated. ' : ''}Full allergen transparency. UK food delivery.` });
        this.metaSvc.updateTag({ property: 'og:title', content: pageTitle });
        this.metaSvc.updateTag({ property: 'og:description', content: `Watch the chefs at ${restaurant.name} cook your food in real time. Live kitchen camera, allergen-safe ordering, fast delivery.` });
        this.metaSvc.updateTag({ property: 'og:url', content: `https://seetheprep.com/restaurant/${hash}` });
        if (restaurant.imageUrl) {
          this.metaSvc.updateTag({ property: 'og:image', content: restaurant.imageUrl });
        }
        this.canonicalSvc.set(`https://seetheprep.com/restaurant/${hash}`);

        // Breadcrumb JSON-LD
        const breadcrumb = this.doc.createElement('script');
        breadcrumb.type = 'application/ld+json';
        breadcrumb.text = JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://seetheprep.com/' },
            { '@type': 'ListItem', position: 2, name: restaurant.name, item: `https://seetheprep.com/restaurant/${hash}` },
          ],
        });
        this.doc.head.appendChild(breadcrumb);

        // FoodEstablishment JSON-LD
        const script = this.doc.createElement('script');
        script.type = 'application/ld+json';
        script.text = JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'FoodEstablishment',
          name: restaurant.name,
          address: restaurant.address,
          url: `https://seetheprep.com/restaurant/${hash}`,
          ...(restaurant.imageUrl ? { image: restaurant.imageUrl } : {}),
          hasMap: `https://seetheprep.com/restaurant/${hash}`,
          aggregateRating: restaurant.hygieneRating === 5 ? {
            '@type': 'AggregateRating',
            ratingValue: '5',
            bestRating: '5',
            worstRating: '1',
            reviewCount: '1',
            name: 'FSA Hygiene Rating',
          } : undefined,
          potentialAction: {
            '@type': 'OrderAction',
            target: `https://seetheprep.com/restaurant/${hash}`,
            deliveryMethod: 'http://purl.org/goodrelations/v1#DeliveryModeOwnFleet',
          },
        });
        this.doc.head.appendChild(script);
      },
      error: () => this.loading.set(false),
    });
  }

  selectCategory(id: number): void {
    this.activeCategory.set(id);
    document.getElementById('cat-' + id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  toggleMenuDietary(tag: string): void {
    const cur = this.dietaryFilter();
    this.dietaryFilter.set(cur.includes(tag) ? cur.filter(t => t !== tag) : [...cur, tag]);
  }

  addToCart(item: MenuItem): void {
    const r = this.restaurant();
    if (!r) return;
    this.cart.addItem(item, r.id, r.name, r.hashId, r.supportsCollection);
    this.toast.success(`${item.name} added to basket`);
  }

  removeFromCart(item: MenuItem): void {
    this.cart.removeItem(item.id);
  }
}
