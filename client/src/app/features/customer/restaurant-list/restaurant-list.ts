import { Component, ElementRef, HostListener, AfterViewInit, OnInit, OnDestroy, ViewChild, signal, computed, inject, PLATFORM_ID, ChangeDetectionStrategy, NgZone } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);
import { Title, Meta, DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { retry, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { timer } from 'rxjs';
import { CanonicalService } from '../../../core/services/canonical.service';
import { PostcodeService, LocationSuggestion } from '../../../core/services/postcode.service';
import { environment } from '../../../../environments/environment';
import { MatRippleModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { RestaurantService } from '../../../core/services/restaurant.service';
import { PlatformSettingsService } from '../../../core/services/platform-settings.service';
import { Restaurant } from '../../../core/models';
import { ScrollRevealDirective } from '../../../shared/directives/scroll-reveal.directive';
import { MagneticDirective } from '../../../shared/directives/magnetic.directive';
import { StaggerRevealDirective } from '../../../shared/directives/stagger-reveal.directive';
import { ParallaxHoverDirective } from '../../../shared/directives/parallax-hover.directive';
import { RadialSelectDirective } from '../../../shared/directives/radial-select.directive';
import { ImageFallback } from '../../../shared/components/image-fallback/image-fallback';

/** A single "promise" panel in the WHY section — editorial layout, no animation gimmicks. */
interface WhyPromise {
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
    ScrollRevealDirective,
    MatRippleModule, MatButtonModule,
  ],
  templateUrl: './restaurant-list.html',
  styleUrl: './restaurant-list.scss',
})
export class RestaurantList implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('cinematicStage') private cinematicStage?: ElementRef<HTMLElement>;
  @ViewChild('cinematicCanvas') private cinematicCanvas?: ElementRef<HTMLCanvasElement>;

  readonly demoVideoUrl = signal<string>('');
  /** Postcode / name typed into the Kitchen Spotlight on the hero. */
  readonly postcodeQuery = signal('');
  readonly spotlightFocused = signal(false);
  readonly cinematicProgress = signal(0);
  readonly cinematicScene = signal(0);
  readonly activePromise = signal(0);

  private readonly sequenceImages: HTMLImageElement[] = [];
  private lastDrawnFrameKey = '';

  /** Lightweight restaurant list — powers Spotlight count + preview only. */
  private readonly allRestaurants = signal<Restaurant[]>([]);

  /** Live kitchen count displayed inside the Spotlight CTA button. */
  readonly liveKitchenCount = computed(() => this.allRestaurants().length);

  private readonly postcodeService = inject(PostcodeService);

  /** Matching locations shown in the independently scrolling Spotlight dropdown. */
  readonly locationSuggestions = computed(() => {
    return this.postcodeResults(); // Already structured as LocationSuggestion[]
  });

  private readonly postcodeQuery$ = toObservable(this.postcodeQuery).pipe(
    debounceTime(300),
    distinctUntilChanged(),
    switchMap(query => this.postcodeService.autocomplete(query))
  );

  private readonly postcodeResults = toSignal(this.postcodeQuery$, { initialValue: [] as LocationSuggestion[] });

  private readonly sanitizer = inject(DomSanitizer);
  private readonly platformSettings = inject(PlatformSettingsService);
  private readonly router = inject(Router);
  private readonly animationZone = inject(NgZone);
  private cinematicRaf = 0;
  private isRendering = false;
  private targetProgress = 0;
  private currentProgress = 0;
  private promiseTimer?: number;

  readonly cinematicScenes = [
    { title: 'Choose a', accent: 'kitchen', body: 'Browse FSA-verified kitchens near you. Independent restaurants only — no dark kitchens, no white-label brands.' },
    { title: 'Watch it', accent: 'cook', body: 'The moment your order is accepted, the kitchen camera goes live. Follow every prep stage in HD until plating.' },
    { title: 'Track to the', accent: 'door', body: "Live ETA from the kitchen to your address. Tip the chef directly when you're happy with the food." },
  ];

  /** Section: Why · four honest promises (editorial layout) */
  readonly promises: WhyPromise[] = [
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

    this.preloadFrameSequences();
    this.setupCinematicScroll();
    this.setupGSAPAnimations();
    this.setupFoodFloatAnimations();
    this.setupDownloadAnimations();
    this.startPromiseCarousel();
  }

  ngOnDestroy(): void {
    if (!this.isBrowser) return;
    if (this.promiseTimer) window.clearInterval(this.promiseTimer);
    window.removeEventListener('scroll', this.onScroll);
    window.removeEventListener('resize', this.onResize);
    cancelAnimationFrame(this.cinematicRaf);
  }

  private setupDownloadAnimations(): void {
    setTimeout(() => {
      const section = document.querySelector('.download-app') as HTMLElement;
      if (!section) return;

      this.animationZone.runOutsideAngular(() => {
        const copy  = section.querySelector('#da-copy')  as HTMLElement;
        const phone = section.querySelector('#da-phone') as HTMLElement;
        if (!copy || !phone) return;

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: 'top 70%',
            toggleActions: 'play none none reverse',
          },
        });

        // Copy slides in from left with a spring-like ease
        tl.to(copy, {
          opacity: 1,
          x: 0,
          duration: 0.9,
          ease: 'power3.out',
        }, 0);

        // Phone slides in from right, slightly delayed for stagger
        tl.to(phone, {
          opacity: 1,
          x: 0,
          y: 0,
          duration: 1.1,
          ease: 'power3.out',
        }, 0.15);
      });
    }, 200);
  }

  private setupFoodFloatAnimations(): void {
    // Small defer ensures Angular has fully rendered the new section
    setTimeout(() => {
      const section = document.querySelector('.app-features') as HTMLElement;
      if (!section) return;

      this.animationZone.runOutsideAngular(() => {
        const foodItems = gsap.utils.toArray<HTMLElement>('.food-float-img', section);
        if (!foodItems.length) return;

        foodItems.forEach((el, i) => {
          const fromX = el.dataset['fromX'] ? parseFloat(el.dataset['fromX']) : 0;
          const fromY = el.dataset['fromY'] ? parseFloat(el.dataset['fromY']) : 80;
          const delay  = el.dataset['delay']  ? parseFloat(el.dataset['delay'])  : 0;

          gsap.fromTo(
            el,
            { x: fromX, y: fromY, opacity: 0, scale: 0.85 },
            {
              x: 0, y: 0, opacity: 1, scale: 1,
              duration: 1,
              ease: 'power3.out',
              delay,
              scrollTrigger: {
                trigger: section,
                start: 'top 80%',
                toggleActions: 'play none none reverse',
              },
              onComplete: () => {
                // Start gentle perpetual float ONLY after the scroll-in finishes
                gsap.to(el, {
                  y: '+=14',
                  duration: 2.4 + i * 0.5,
                  ease: 'sine.inOut',
                  yoyo: true,
                  repeat: -1,
                });
              },
            }
          );
        });
      });
    }, 200);
  }


  private setupGSAPAnimations(): void {
    const stage = this.cinematicStage?.nativeElement;
    if (!stage) return;

    const cards = gsap.utils.toArray<HTMLElement>('.cinematic-story-card', stage);
    if (cards.length < 4) return;

    this.animationZone.runOutsideAngular(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: stage,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1,
        }
      });

      // Scene 0: Order Food / Search Bar
      // Start fully visible so it's there at page load without scrolling
      tl.set(cards[0], { opacity: 1, pointerEvents: 'auto' }, 0);
      tl.set(cards[0].querySelectorAll('.brand-reveal-title'), { y: 0, opacity: 1, filter: 'blur(0px)' }, 0);
      tl.set(cards[0].querySelectorAll('.kitchen-spotlight'), { opacity: 1 }, 0);
      
      // Animate out as we approach Scene 1
      tl.to(cards[0], { opacity: 0, duration: 0.05, pointerEvents: 'none' }, 0.305);

      // Scene 1: See the preparation
      tl.set(cards[1], { opacity: 1 }, 0.355);
      tl.fromTo(cards[1].querySelectorAll('.story-text'), 
        { y: 40, opacity: 0, filter: 'blur(10px)' },
        { y: 0, opacity: 1, filter: 'blur(0px)', duration: 0.05, stagger: 0.05 }, 0.355
      );
      tl.to(cards[1], { opacity: 0, duration: 0.05 }, 0.655);

      // Scene 2: Trust every bite
      tl.set(cards[2], { opacity: 1 }, 0.705);
      tl.fromTo(cards[2].querySelectorAll('.story-text'), 
        { y: 40, opacity: 0, filter: 'blur(10px)' },
        { y: 0, opacity: 1, filter: 'blur(0px)', duration: 0.05, stagger: 0.05 }, 0.705
      );
      tl.to(cards[2], { opacity: 0, duration: 0.05 }, 0.830);

      // Scene 3: End Title
      tl.set(cards[3], { opacity: 1 }, 0.880);
      tl.fromTo(cards[3].querySelectorAll('.brand-reveal-title'), 
        { y: 40, opacity: 0, filter: 'blur(10px)' },
        { y: 0, opacity: 1, filter: 'blur(0px)', duration: 0.05 }, 0.880
      );
    });
  }

  private async preloadFrameSequences(): Promise<void> {
    await this.animationZone.runOutsideAngular(async () => {
      const loadScene = async (scenePath: string, targetArray: HTMLImageElement[]) => {
        const batchSize = 50;
        for (let i = 1; i <= 300; i += batchSize) {
          const promises = [];
          for (let j = i; j < i + batchSize && j <= 300; j++) {
            promises.push(new Promise<void>((resolve) => {
              const img = new Image();
              img.onload = () => resolve();
              img.onerror = () => resolve();
              img.src = `/frames/${scenePath}/ezgif-frame-${String(j).padStart(3, '0')}.jpg`;
              targetArray[j] = img;
            }));
          }
          await Promise.all(promises);
        }
      };

      // Load the single 300-frame sequence fully
      await loadScene('sequence', this.sequenceImages);
      // Kick off the first render immediately in case they already scrolled
      this.forceRender();
    });
  }

  private forceRender(): void {
    if (!this.isRendering) {
      this.isRendering = true;
      this.cinematicRaf = requestAnimationFrame(this.renderLoop);
    }
  }

  private stageTop = 0;
  private stageScrollableHeight = 1;
  private canvasRect: { width: number; height: number } = { width: 0, height: 0 };

  private setupCinematicScroll(): void {
    this.animationZone.runOutsideAngular(() => {
      this.recalculateStageDimensions();
      window.addEventListener('scroll', this.onScroll, { passive: true });
      window.addEventListener('resize', this.onResize, { passive: true });
      this.onScroll();
    });
  }

  private readonly onResize = (): void => {
    this.recalculateStageDimensions();
    this.onScroll();
  };

  private recalculateStageDimensions(): void {
    const stage = this.cinematicStage?.nativeElement;
    if (stage) {
      const rect = stage.getBoundingClientRect();
      this.stageTop = rect.top + window.scrollY;
      this.stageScrollableHeight = Math.max(1, stage.offsetHeight - window.innerHeight);
    }
    const canvas = this.cinematicCanvas?.nativeElement;
    if (canvas) {
      this.canvasRect = canvas.getBoundingClientRect();
    }
  }

  private readonly onScroll = (): void => {
    const scrollY = window.scrollY;
    this.targetProgress = Math.max(0, Math.min(1, (scrollY - this.stageTop) / this.stageScrollableHeight));
    
    if (!this.isRendering) {
      this.isRendering = true;
      this.cinematicRaf = requestAnimationFrame(this.renderLoop);
    }
  };

  private readonly renderLoop = (): void => {
    const lerpFactor = 0.08; // The "shock absorber" easing factor
    
    if (Math.abs(this.targetProgress - this.currentProgress) > 0.0001) {
      this.currentProgress += (this.targetProgress - this.currentProgress) * lerpFactor;
      this.updateCinematicScroll();
      this.cinematicRaf = requestAnimationFrame(this.renderLoop);
    } else {
      this.currentProgress = this.targetProgress;
      this.updateCinematicScroll();
      this.isRendering = false;
    }
  };

  private updateCinematicScroll(): void {
    const currentP = this.currentProgress;

    // Active scene determination based on strict 10s video timeline cuts
    let activeSceneIndex = 0;
    if (currentP >= 0.88) {
      activeSceneIndex = 3;
    } else if (currentP >= 0.705) {
      activeSceneIndex = 2;
    } else if (currentP >= 0.355) {
      activeSceneIndex = 1;
    } else {
      activeSceneIndex = 0;
    }

    if (this.cinematicScene() !== activeSceneIndex) {
      this.cinematicScene.set(activeSceneIndex);
    }

    // Map scroll progress directly to frame 1 - 300
    const frameIdx = Math.max(1, Math.min(300, Math.round(1 + currentP * 299)));
    const drawKey = `seq_${frameIdx}`;

    if (this.lastDrawnFrameKey !== drawKey) {
      this.lastDrawnFrameKey = drawKey;
      this.renderFrameToCanvas(this.sequenceImages[frameIdx]);
    }
  }

  private renderFrameToCanvas(image: HTMLImageElement | undefined): void {
    const canvas = this.cinematicCanvas?.nativeElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = this.canvasRect;
    if (rect.width === 0 || rect.height === 0) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const canvasWidth = Math.floor(rect.width * dpr);
    const canvasHeight = Math.floor(rect.height * dpr);

    if (canvas.width !== canvasWidth || canvas.height !== canvasHeight) {
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
    }

    if (!image || !image.complete || image.naturalWidth === 0) return;

    ctx.save();
    ctx.scale(dpr, dpr);

    // Calculate object-fit: cover scaling
    const imageRatio = image.naturalWidth / image.naturalHeight;
    const containerRatio = rect.width / rect.height;

    let drawWidth = rect.width;
    let drawHeight = rect.height;
    let offsetX = 0;
    let offsetY = 0;

    if (containerRatio > imageRatio) {
      drawHeight = rect.width / imageRatio;
      offsetY = (rect.height - drawHeight) / 2;
    } else {
      drawWidth = rect.height * imageRatio;
      offsetX = (rect.width - drawWidth) / 2;
    }

    ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
    ctx.restore();
  }

  promiseTrackStyle(): string {
    return `translate3d(${-this.activePromise() * 25}%, 0, 0)`;
  }

  setActivePromise(index: number): void {
    this.activePromise.set(index);
    this.restartPromiseCarousel();
  }

  private startPromiseCarousel(): void {
    this.promiseTimer = window.setInterval(() => {
      this.activePromise.update(index => (index + 1) % this.promises.length);
    }, 6000);
  }

  private restartPromiseCarousel(): void {
    if (this.promiseTimer) window.clearInterval(this.promiseTimer);
    this.startPromiseCarousel();
  }

  onPostcodeInput(event: Event): void {
    this.postcodeQuery.set((event.target as HTMLInputElement).value);
  }

  onSpotlightBlur(): void {
    // Small delay allows click events on preview items to fire before hiding dropdown.
    setTimeout(() => this.spotlightFocused.set(false), 200);
  }

  selectSuggestion(postcode: string): void {
    this.postcodeQuery.set(postcode);
    this.navigateToRestaurants();
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
