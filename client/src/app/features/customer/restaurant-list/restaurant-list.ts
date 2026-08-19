import { Component, ElementRef, HostListener, AfterViewInit, OnInit, ViewChild, ViewChildren, QueryList, signal, computed, inject, PLATFORM_ID, ChangeDetectionStrategy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Title, Meta, DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { retry } from 'rxjs/operators';
import { timer } from 'rxjs';
import { CanonicalService } from '../../../core/services/canonical.service';
import { environment } from '../../../../environments/environment';
import { MatRippleModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { RestaurantService } from '../../../core/services/restaurant.service';
import { PlatformSettingsService } from '../../../core/services/platform-settings.service';
import { Restaurant } from '../../../core/models';
import { TiltDirective } from '../../../shared/directives/tilt.directive';
import { ScrollRevealDirective } from '../../../shared/directives/scroll-reveal.directive';
import { MagneticDirective } from '../../../shared/directives/magnetic.directive';
import { CountUpDirective } from '../../../shared/directives/count-up.directive';
import { StaggerRevealDirective } from '../../../shared/directives/stagger-reveal.directive';
import { ParallaxHoverDirective } from '../../../shared/directives/parallax-hover.directive';
import { RadialSelectDirective } from '../../../shared/directives/radial-select.directive';
import { Logo } from '../../../shared/components/logo/logo';
import { ImageFallback } from '../../../shared/components/image-fallback/image-fallback';

interface HowStep {
  num: string; title: string; copy: string; icon: string; video: string;
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    TiltDirective, ScrollRevealDirective, MagneticDirective, CountUpDirective,
    StaggerRevealDirective, ParallaxHoverDirective, RadialSelectDirective,
    ImageFallback,
    MatRippleModule, MatButtonModule,
  ],
  templateUrl: './restaurant-list.html',
  styleUrl: './restaurant-list.scss',
})
export class RestaurantList implements OnInit, AfterViewInit {
  @ViewChild('heroVideo') private heroVideoRef?: ElementRef<HTMLVideoElement>;
  @ViewChildren('howVideo') private howVideoRefs!: QueryList<ElementRef<HTMLVideoElement>>;

  readonly demoVideoUrl = signal<string>('');
  /** Postcode / name typed into the Kitchen Spotlight on the hero. */
  readonly postcodeQuery = signal('');
  readonly spotlightFocused = signal(false);

  /** Lightweight restaurant list — powers Spotlight count + preview only. */
  private readonly allRestaurants = signal<Restaurant[]>([]);

  /** Live kitchen count displayed inside the Spotlight CTA button. */
  readonly liveKitchenCount = computed(() => this.allRestaurants().length);

  /** Matching restaurants shown in the independently scrolling Spotlight dropdown. */
  readonly spotlightPreview = computed(() => {
    const q = this.postcodeQuery().trim().toLowerCase();
    if (!q) return this.allRestaurants();
    return this.allRestaurants()
      .filter(r => r.name.toLowerCase().includes(q) || r.address.toLowerCase().includes(q));
  });

  private readonly sanitizer = inject(DomSanitizer);
  private readonly platformSettings = inject(PlatformSettingsService);
  private readonly router = inject(Router);

  /** Resolves a video filename to a CDN URL (if videoCdnUrl is set) or local public path. */
  private videoUrl(filename: string): string {
    return environment.videoCdnUrl ? `${environment.videoCdnUrl}/${filename}` : `/videos/${filename}`;
  }

  /** Section: How it works */
  readonly howSteps: HowStep[] = [
    { num: '01', title: 'Choose a kitchen',   copy: 'Browse FSA-verified kitchens near you. Independent restaurants only — no dark kitchens, no white-label brands.', icon: 'restaurant_menu', video: this.videoUrl('choose-the-kitchen.mp4')  },
    { num: '02', title: 'Watch it cook',      copy: 'The moment your order is accepted, the kitchen camera goes live. Follow every prep stage in HD until plating.',     icon: 'videocam',        video: this.videoUrl('watch-it-cook.mp4')         },
    { num: '03', title: 'Track to the door',  copy: 'Live ETA from the kitchen to your address. Tip the chef directly when you\'re happy with the food.',               icon: 'delivery_dining', video: this.videoUrl('track-to-the-door.mp4')    },
  ];

  /** Section: Why · four honest promises (editorial layout) */
  readonly promises: Promise[] = [
    {
      num: '01',
      title: 'Live camera on every order.',
      copy: 'Every kitchen on the platform streams a live HD feed for the duration of your prep. No pre-recorded footage, no still photos — the camera shows what is happening in the kitchen, in real time.',
      metric: '100%',
      metricLabel: 'orders streamed live',
      icon: 'videocam',
    },
    {
      num: '02',
      title: 'FSA 5-star hygiene, audited quarterly.',
      copy: 'We onboard kitchens with a current Food Standards Agency 5-star hygiene rating and re-verify against council records every quarter. Any kitchen that drops below the standard is delisted until it is restored.',
      metric: '5★',
      metricLabel: 'FSA minimum',
      icon: 'verified',
    },
    {
      num: '03',
      title: 'Allergens, on the record.',
      copy: 'Every menu item lists its allergens before you order. Flag your allergy at checkout and the kitchen receives it on the prep ticket — the live camera then doubles as your audit trail.',
      metric: '14',
      metricLabel: 'EU/UK allergens declared',
      icon: 'science',
    },
    {
      num: '04',
      title: 'Tips paid in full to the kitchen.',
      copy: 'Tips are paid out weekly to the kitchen that cooked your order, with a line-item receipt. SeeThePrep does not take a percentage and does not reclassify tips as a service fee.',
      metric: '100%',
      metricLabel: 'to the kitchen',
      icon: 'payments',
    },
  ];


  readonly heroVideoUrl = environment.videoCdnUrl
    ? `${environment.videoCdnUrl}/hero-kitchen.mp4`
    : '/hero-kitchen.mp4';
  readonly heroPosterUrl = environment.videoCdnUrl
    ? `${environment.videoCdnUrl}/hero-kitchen-poster.jpg`
    : '/hero-kitchen-poster.jpg';

  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly doc = inject(DOCUMENT);

  constructor(private readonly restaurantService: RestaurantService) {
    inject(Title).setTitle('SeeThePrep — Watch Your Food Cook Live | UK Delivery');
    inject(CanonicalService).set('https://seetheprep.com/');
    const meta = inject(Meta);
    meta.updateTag({ name: 'description', content: 'Watch your food being cooked live on camera. SeeThePrep is the UK\'s only food delivery platform with real-time kitchen transparency and FSA 5-star verified restaurants.' });
    meta.updateTag({ property: 'og:title', content: 'SeeThePrep — Watch Your Food Cook Live | UK Delivery' });
    meta.updateTag({ property: 'og:description', content: 'Browse FSA 5-star verified restaurants, place your order, and watch every step of your meal being cooked in HD — live, every time.' });
    meta.updateTag({ property: 'og:url', content: 'https://seetheprep.com/' });

    // Inject FAQ + SoftwareApplication JSON-LD for rich results
    const doc = this.doc;
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
          applicationCategory: 'LifestyleApplication',
          url: 'https://seetheprep.com/',
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

  safeVideoUrl(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  isEmbedVideo(url: string): boolean {
    return url.includes('youtube.com') || url.includes('youtu.be') ||
           url.includes('vimeo.com') || url.includes('embed');
  }

  ngOnInit(): void {
    // Lightweight load for Kitchen Spotlight count + preview — no UI loading state needed.
    this.restaurantService.list()
      .pipe(retry({ count: 3, delay: () => timer(2000) }))
      .subscribe({ next: (data) => this.allRestaurants.set(data), error: () => undefined });
    this.platformSettings.getPublicSettings().subscribe(s => {
      const v = s['homepage_demo_video'];
      if (v) this.demoVideoUrl.set(v);
    });
  }

  ngAfterViewInit(): void {
    if (!this.isBrowser) return;
    const video = this.heroVideoRef?.nativeElement;
    if (!video) return;

    // Force muted (some browsers carry over previous mute state)
    video.muted = true;
    video.defaultMuted = true;
    video.volume = 0;
    video.setAttribute('muted', '');
    video.playsInline = true;

    // Angular binds [src] on the <source> child AFTER the browser's initial
    // resource-selection algorithm ran (with no src → gave up). video.load()
    // forces the browser to re-read the now-populated <source src> attribute.
    video.load();

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

    // Pause when hero scrolls out of view (saves mobile battery / CPU)
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(
        ([entry]) => entry.isIntersecting ? tryPlay() : video.pause(),
        { threshold: 0.1 }
      );
      io.observe(video);
    }

    // ── Force-play how-it-works step videos ──────────────────────
    this.howVideoRefs.forEach(ref => this.forcePlayVideo(ref.nativeElement));
    this.howVideoRefs.changes.subscribe((list: QueryList<ElementRef<HTMLVideoElement>>) => {
      list.forEach(ref => this.forcePlayVideo(ref.nativeElement));
    });
  }

  /** Mirrors hero video autoplay logic for any <video> element. */
  private forcePlayVideo(v: HTMLVideoElement): void {
    v.muted = true;
    v.defaultMuted = true;
    v.volume = 0;
    v.setAttribute('muted', '');
    v.playsInline = true;

    const tryPlay = () => v.play().catch(() => undefined);
    tryPlay();
    v.addEventListener('canplay', tryPlay, { once: false });
    v.addEventListener('loadeddata', tryPlay, { once: true });

    const userKick = () => { tryPlay(); };
    window.addEventListener('pointerdown', userKick, { once: true });
    window.addEventListener('touchstart', userKick, { once: true });

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && v.paused) tryPlay();
    });

    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(
        ([entry]) => entry.isIntersecting ? tryPlay() : v.pause(),
        { threshold: 0.1 }
      );
      io.observe(v);
    }
  }

  onPostcodeInput(event: Event): void {
    this.postcodeQuery.set((event.target as HTMLInputElement).value);
  }

  onSpotlightBlur(): void {
    // Small delay allows click events on preview items to fire before hiding dropdown.
    setTimeout(() => this.spotlightFocused.set(false), 200);
  }

  /** Navigate to /restaurants, carrying the postcode query as ?q= if present. */
  navigateToRestaurants(): void {
    const q = this.postcodeQuery().trim();
    if (q) {
      this.router.navigate(['/restaurants'], { queryParams: { q } });
    } else {
      this.router.navigate(['/restaurants']);
    }
  }
}
