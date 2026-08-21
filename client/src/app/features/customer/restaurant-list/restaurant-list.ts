import { Component, ElementRef, HostListener, AfterViewInit, OnInit, OnDestroy, ViewChild, ViewChildren, QueryList, signal, computed, inject, PLATFORM_ID, ChangeDetectionStrategy } from '@angular/core';
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

import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

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
    TiltDirective, ScrollRevealDirective, MagneticDirective,
    StaggerRevealDirective, ParallaxHoverDirective, RadialSelectDirective,
    ImageFallback,
    MatRippleModule, MatButtonModule,
  ],
  templateUrl: './restaurant-list.html',
  styleUrl: './restaurant-list.scss',
})
export class RestaurantList implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('heroVideo') private heroVideoRef?: ElementRef<HTMLVideoElement>;
  @ViewChildren('howVideo') private howVideoRefs!: QueryList<ElementRef<HTMLVideoElement>>;

  // GSAP 3D Scroll Journey refs
  @ViewChild('gsapJourney') private gsapJourneyRef?: ElementRef<HTMLElement>;
  @ViewChild('journeyPin') private journeyPinRef?: ElementRef<HTMLElement>;
  @ViewChild('journeyCanvas') private journeyCanvasRef?: ElementRef<HTMLCanvasElement>;
  
  private gsapCtx?: gsap.Context;

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


  readonly heroVideoReady = signal(false);
  // IMPORTANT: format is pinned to `f_mp4` (NOT `f_auto`). Cloudinary's on-the-fly
  // f_auto negotiates a distinct derived asset per Accept/User-Agent combination
  // (Vary: Accept, User-Agent) — the FIRST request for any given browser/version
  // fingerprint pays a ~15-20s real-time transcode before any bytes are served,
  // which blows straight past <video preload="auto" autoplay>'s patience budget.
  // In practice this meant most real visitors (each an effectively unique UA)
  // hit a cold path and the hero video simply never appeared to load.
  // f_mp4 is a single universally-playable H.264/mp4 rendition — it collapses
  // the Vary space down to just `Save-Data` (2 variants), so it's transcoded
  // once, ever, then served instantly from cache to everyone after that.
  readonly heroVideoUrl = 'https://res.cloudinary.com/ddnl8vtdd/video/upload/q_auto,f_mp4/v1787242596/hero-kitchen.mp4';
  readonly heroPosterUrl = 'https://res.cloudinary.com/ddnl8vtdd/video/upload/q_auto,f_jpg/v1787242596/hero-kitchen.jpg';

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

    const tryPlay = () => {
      if (video.readyState >= 3) {
        this.heroVideoReady.set(true);
      }
      video.play().catch(() => undefined);
    };

    // Try immediately, on canplay, on loadeddata
    tryPlay();
    video.addEventListener('canplay', () => {
      this.heroVideoReady.set(true);
      tryPlay();
    }, { once: false });
    video.addEventListener('loadeddata', () => {
      this.heroVideoReady.set(true);
      tryPlay();
    }, { once: true });

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

    // ── Stall/error resilience ──────────────────────────────────────
    // Defense-in-depth for the underlying CDN transformation: if Cloudinary
    // ever serves a cold (not-yet-cached) derived asset again — e.g. after a
    // cache purge — the very first request for it can take many seconds with
    // no Content-Length/Range support, which stalls <video> indefinitely with
    // no error event at all (it's still "loading", just very slowly). A bare
    // reload() a few seconds later reliably lands on the now-warmed cache.
    let stallRetries = 0;
    const MAX_STALL_RETRIES = 2;
    const stallTimer = window.setTimeout(function retryIfStalled() {
      if (video.readyState < 3 && stallRetries < MAX_STALL_RETRIES) {
        stallRetries++;
        video.load();
        tryPlay();
        window.setTimeout(retryIfStalled, 6000);
      }
    }, 6000);

    // Genuine playback errors (bad format, network failure, 4xx/5xx) fire
    // 'error' immediately — retry once via reload, same rationale as above.
    let erroredOnce = false;
    video.addEventListener('error', () => {
      if (!erroredOnce) {
        erroredOnce = true;
        video.load();
        tryPlay();
      }
    });

    // Nothing further to do once ready — clear the stall watchdog.
    video.addEventListener('canplay', () => window.clearTimeout(stallTimer), { once: true });

    // Pause when hero scrolls out of view (saves mobile battery / CPU)
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(
        ([entry]) => entry.isIntersecting ? tryPlay() : video.pause(),
        { threshold: 0.1 }
      );
      io.observe(video);
    }

    // ── Setup GSAP 3D Scroll Journey ──────────────────────
    this.initScrollJourney();

  }

  private initScrollJourney(): void {
    if (!this.gsapJourneyRef || !this.journeyPinRef || !this.journeyCanvasRef) return;

    this.gsapCtx = gsap.context(() => {
      const canvas = this.journeyCanvasRef!.nativeElement;
      const context = canvas.getContext('2d');
      if (!context) return;

      const frameCount = 300;
      const images: HTMLImageElement[] = [];
      const imageSeq = { frame: 0 };
      
      // Load all frames
      for (let i = 1; i <= frameCount; i++) {
        const img = new Image();
        const paddedNum = i.toString().padStart(3, '0');
        img.src = `/frames/ezgif-frame-${paddedNum}.jpg`;
        images.push(img);
      }

      function render() {
        if (images[imageSeq.frame] && images[imageSeq.frame].complete && images[imageSeq.frame].naturalWidth > 0) {
          const img = images[imageSeq.frame];
          canvas.width = window.innerWidth;
          canvas.height = window.innerHeight;
          
          const scale = Math.max(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight);
          const x = (canvas.width / 2) - (img.naturalWidth / 2) * scale;
          const y = (canvas.height / 2) - (img.naturalHeight / 2) * scale;
          
          context?.clearRect(0, 0, canvas.width, canvas.height);
          context?.drawImage(img, x, y, img.naturalWidth * scale, img.naturalHeight * scale);
        }
      }

      // Initial render
      images[0].onload = () => render();
      if (images[0].complete) render();

      // Handle window resize
      window.addEventListener('resize', render);

      // The main timeline tied to scroll
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: this.gsapJourneyRef?.nativeElement,
          start: 'top top',
          end: '+=400%',
          pin: this.journeyPinRef?.nativeElement,
          scrub: 0.5, // 0.5s smoothing
        },
        onUpdate: render
      });

      // Scrub through frames
      tl.to(imageSeq, {
        frame: frameCount - 1,
        snap: 'frame',
        ease: 'none',
        duration: 4
      }, 0);

      // Advanced Z-axis motion choreography
      const enterAnim = { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 0.3, ease: 'power2.out' };
      const exitAnim = { opacity: 0, scale: 1.05, filter: 'blur(8px)', duration: 0.3, ease: 'power2.in' };

      // Phase 1 (0 to 1)
      tl.fromTo('.step-1', { opacity: 0, scale: 0.85, filter: 'blur(12px)' }, enterAnim, 0);
      tl.fromTo('.progress-1', { width: '0%' }, { width: '100%', duration: 1, ease: 'none' }, 0);
      tl.to('.step-1', exitAnim, 0.7);
      
      // Phase 2 (1 to 2)
      tl.fromTo('.step-2', { opacity: 0, scale: 0.85, filter: 'blur(12px)' }, enterAnim, 1);
      tl.fromTo('.progress-2', { width: '0%' }, { width: '100%', duration: 1, ease: 'none' }, 1);
      tl.to('.step-2', exitAnim, 1.7);
      
      // Phase 3 (2 to 3)
      tl.fromTo('.step-3', { opacity: 0, scale: 0.85, filter: 'blur(12px)' }, enterAnim, 2);
      tl.fromTo('.progress-3', { width: '0%' }, { width: '100%', duration: 1, ease: 'none' }, 2);
      tl.to('.step-3', exitAnim, 2.7);
      
      // Phase 4 (3 to 4)
      tl.fromTo('.step-4', { opacity: 0, scale: 0.85, filter: 'blur(12px)' }, enterAnim, 3);
      tl.fromTo('.progress-4', { width: '0%' }, { width: '100%', duration: 1, ease: 'none' }, 3);
      // keeps step 4 visible until the pin ends

    }, this.gsapJourneyRef.nativeElement);
  }

  ngOnDestroy(): void {
    this.gsapCtx?.revert();
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
