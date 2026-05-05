import { Component, ElementRef, HostListener, AfterViewInit, OnInit, ViewChild, signal, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRippleModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { RestaurantService } from '../../../core/services/restaurant.service';
import { Restaurant } from '../../../core/models';
import { HygieneStarsPipe } from '../../../shared/pipes/hygiene-stars.pipe';
import { HygieneLabelPipe } from '../../../shared/pipes/order-status.pipe';
import { RestaurantEmojiPipe } from '../../../shared/pipes/restaurant-emoji.pipe';
import { TiltDirective } from '../../../shared/directives/tilt.directive';
import { ScrollRevealDirective } from '../../../shared/directives/scroll-reveal.directive';
import { MagneticDirective } from '../../../shared/directives/magnetic.directive';
import { Logo } from '../../../shared/components/logo/logo';

interface HowStep {
  num: string; title: string; copy: string; icon: string;
}

/** A single "promise" panel in the WHY section — editorial layout, no animation gimmicks. */
interface Promise {
  num: string;
  title: string;
  copy: string;
  metric: string;
  metricLabel: string;
  icon: string;
}

@Component({
  selector: 'app-restaurant-list',
  imports: [
    RouterLink,
    HygieneStarsPipe, HygieneLabelPipe, RestaurantEmojiPipe,
    TiltDirective, ScrollRevealDirective, MagneticDirective,
    Logo,
    MatFormFieldModule, MatInputModule, MatChipsModule,
    MatProgressSpinnerModule, MatRippleModule, MatTooltipModule, MatButtonModule,
  ],
  templateUrl: './restaurant-list.html',
  styleUrl: './restaurant-list.scss',
})
export class RestaurantList implements OnInit, AfterViewInit {
  @ViewChild('heroVideo') private heroVideoRef?: ElementRef<HTMLVideoElement>;

  readonly restaurants = signal<Restaurant[]>([]);
  readonly loading = signal(true);
  readonly searchQuery = signal('');

  /** Hero scroll progress (0 → 1) for header colour shift */
  readonly scrollY = signal(0);

  /** Section: How it works */
  readonly howSteps: HowStep[] = [
    { num: '01', title: 'Pick a kitchen', copy: 'Browse verified kitchens. No filters, no tricks — just real food, made by real chefs.',                       icon: 'restaurant_menu' },
    { num: '02', title: 'Watch it cook',  copy: 'The moment you order, the camera goes live. Watch every step from prep to plate, in glorious HD.',           icon: 'videocam'         },
    { num: '03', title: 'Track & enjoy',  copy: 'Follow your rider in real-time, leave a tip for the chef, and rate the prep. Total transparency.',           icon: 'delivery_dining'  },
  ];

  /** Section: Why · four honest promises (editorial layout) */
  readonly promises: Promise[] = [
    {
      num: '01',
      title: 'The camera is always on.',
      copy: 'Every order, every kitchen. If a chef won\'t turn the camera on, they don\'t cook on SeeThePrep. No filtered angles, no after-the-fact photos — just the actual minute-by-minute prep of your meal in HD.',
      metric: '100%',
      metricLabel: 'orders streamed live',
      icon: 'videocam',
    },
    {
      num: '02',
      title: 'Five-star hygiene, or no listing.',
      copy: 'We only onboard kitchens with a 5★ Food Standards Agency rating. We re-verify quarterly and cross-check with council records. Drop below five and you drop off the platform — no warnings, no second chances.',
      metric: '5★',
      metricLabel: 'FSA minimum',
      icon: 'verified',
    },
    {
      num: '03',
      title: 'Allergens, on the record.',
      copy: 'Watch every ingredient go in the pan. Tag your allergy when you order and the prep camera flags the moment cross-contact risk appears. The receipt is a video, not a checkbox.',
      metric: '0',
      metricLabel: 'hidden ingredients',
      icon: 'science',
    },
    {
      num: '04',
      title: 'Tips go to chefs. All of them.',
      copy: 'Every penny you tip goes to the kitchen that cooked your food — paid out the same week, with a receipt. We never touch it, never skim it, never fold it into a "service fee".',
      metric: '100%',
      metricLabel: 'to the chef\'s pocket',
      icon: 'favorite',
    },
  ];


  constructor(private readonly restaurantService: RestaurantService) {
    inject(Title).setTitle('Watch Your Food Being Cooked Live | UK Food Delivery | SeeThePrep');
    const meta = inject(Meta);
    meta.updateTag({ name: 'description', content: 'Order food online and watch your kitchen cook it live on camera. SeeThePrep is the UK\'s only food delivery platform with real-time kitchen transparency, FSA 5-star verified restaurants and full allergen disclosure.' });
    meta.updateTag({ property: 'og:title', content: 'Watch Your Food Being Cooked Live | UK Food Delivery | SeeThePrep' });
    meta.updateTag({ property: 'og:description', content: 'Browse FSA 5-star verified restaurants, place your order, and watch every step of your meal being cooked in HD — live, every time.' });
    meta.updateTag({ property: 'og:url', content: 'https://seetheprep.vercel.app/' });

    // Inject FAQ + SoftwareApplication JSON-LD for rich results
    const doc = inject(DOCUMENT);
    const script = doc.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'Can I really watch my food being cooked?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Yes. Every order on SeeThePrep triggers a live HD camera feed from the kitchen. You watch every step from prep to plate in real time — no recordings, no filters.',
              },
            },
            {
              '@type': 'Question',
              name: 'Are all restaurants on SeeThePrep FSA 5-star rated?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Yes. We only onboard kitchens with a current Food Standards Agency 5-star hygiene rating. We re-verify quarterly and cross-check with council records. Any restaurant that drops below 5 stars is removed from the platform.',
              },
            },
            {
              '@type': 'Question',
              name: 'How does SeeThePrep handle allergens?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'You can watch every ingredient going into your dish live on camera. Tag your allergy when ordering and the prep stream flags any cross-contact risk. Full allergen transparency with zero hidden ingredients.',
              },
            },
            {
              '@type': 'Question',
              name: 'Where do tips go?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: '100% of tips go directly to the kitchen that cooked your food, paid out the same week with a full receipt. SeeThePrep never takes a cut of tips.',
              },
            },
            {
              '@type': 'Question',
              name: 'Is SeeThePrep available across the UK?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'SeeThePrep is currently expanding across the United Kingdom. Browse available kitchens in your area by searching your postcode on the restaurant page.',
              },
            },
          ],
        },
        {
          '@type': 'SoftwareApplication',
          name: 'SeeThePrep',
          operatingSystem: 'Web, iOS, Android',
          applicationCategory: 'FoodEstablishment',
          url: 'https://seetheprep.vercel.app/',
          description: 'The UK\'s only food delivery platform with live kitchen camera transparency.',
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'GBP',
          },
        },
      ],
    });
    doc.head.appendChild(script);
  }

  ngOnInit(): void {
    this.restaurantService.list().subscribe({
      next: (data) => { this.restaurants.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  ngAfterViewInit(): void {
    const video = this.heroVideoRef?.nativeElement;
    if (!video) return;

    // Force muted (some browsers carry over previous mute state)
    video.muted = true;
    video.defaultMuted = true;
    video.volume = 0;
    video.setAttribute('muted', '');
    video.playsInline = true;

    const tryPlay = () => video.play().catch(() => undefined);

    // Try immediately, on canplay, on loadeddata
    tryPlay();
    video.addEventListener('canplay', tryPlay, { once: false });
    video.addEventListener('loadeddata', tryPlay, { once: true });

    // Retry on first user interaction (handles strict autoplay policies)
    const userKick = () => {
      tryPlay();
      window.removeEventListener('pointerdown', userKick);
      window.removeEventListener('touchstart', userKick);
      window.removeEventListener('keydown', userKick);
    };
    window.addEventListener('pointerdown', userKick, { once: true });
    window.addEventListener('touchstart', userKick, { once: true });
    window.addEventListener('keydown', userKick, { once: true });

    // If tab regains focus, ensure still playing
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && video.paused) tryPlay();
    });
  }

  filteredRestaurants(): Restaurant[] {
    const q = this.searchQuery().toLowerCase();
    if (!q) return this.restaurants();
    return this.restaurants().filter(
      (r) => r.name.toLowerCase().includes(q) || r.address.toLowerCase().includes(q)
    );
  }

  onSearch(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.scrollY.set(window.scrollY);
  }

  scrollToRestaurants(): void {
    document.getElementById('restaurants-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  scrollToHow(): void {
    document.getElementById('how-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
