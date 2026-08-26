import {
  Component, ChangeDetectionStrategy, OnInit, OnDestroy,
  inject, signal, computed,
} from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { interval, Subscription } from 'rxjs';
import { AuctionService } from '../../../core/services/auction.service';
import { AuctionHubService } from '../../../core/services/auction-hub.service';
import { AuthService } from '../../../core/auth/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { CanonicalService } from '../../../core/services/canonical.service';
import { Auction, Bid } from '../../../core/models';
import { LiveStreamPlayer } from '../../../shared/components/live-stream-player/live-stream-player';

/**
 * AuctionLive — /auctions/:id
 * Live-bidding room: video feed + current price + bid input + countdown + bid history.
 * (SRP: rendering + user bid actions only — lifecycle/soft-close logic lives server-side)
 */
@Component({
  selector: 'app-auction-live',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, FormsModule, LiveStreamPlayer],
  templateUrl: './auction-live.html',
  styleUrl: './auction-live.scss',
})
export class AuctionLive implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly auctionService = inject(AuctionService);
  private readonly auctionHub = inject(AuctionHubService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly titleService = inject(Title);
  private readonly metaService = inject(Meta);
  private readonly canonicalService = inject(CanonicalService);
  private readonly doc = inject(DOCUMENT);

  readonly auction = signal<Auction | null>(null);
  readonly bids = signal<Bid[]>([]);
  readonly loading = signal(true);
  readonly bidding = signal(false);
  readonly liveStreamUrl = signal<string | null>(null);

  /** Countdown, recomputed every second from the auction's authoritative EndsAt. */
  readonly secondsLeft = signal<number | null>(null);

  bidAmountInput: number | null = null;

  private auctionId!: number;
  private countdownSub?: Subscription;

  readonly isLoggedIn = computed(() => this.auth.isLoggedIn());

  readonly minNextBid = computed(() => {
    const a = this.auction();
    if (!a) return 0;
    return (a.currentBid ?? a.startingPrice - a.bidIncrement) + a.bidIncrement;
  });

  readonly isLive = computed(() => this.auction()?.status === 'Live');
  readonly isEnded = computed(() => ['Ended', 'Sold', 'Unsold'].includes(this.auction()?.status ?? ''));

  ngOnInit(): void {
    this.auctionId = Number(this.route.snapshot.paramMap.get('id'));
    this.load();
    void this.auctionHub.connect().then(() => {
      void this.auctionHub.joinAuctionGroup(this.auctionId);
      this.auctionHub.bidPlaced$.subscribe((bid) => {
        if (bid.auctionId !== this.auctionId) return;
        this.bids.update(list => [bid, ...list]);
        this.auction.update(a => a ? { ...a, currentBid: bid.amount, bidCount: a.bidCount + 1 } : a);
        this.bidAmountInput = null;
      });
      this.auctionHub.auctionUpdated$.subscribe((updated) => {
        if (updated.id === this.auctionId) this.auction.set(updated);
      });
      this.auctionHub.auctionEnded$.subscribe((updated) => {
        if (updated.id === this.auctionId) {
          this.auction.set(updated);
          this.toast.success(updated.status === 'Sold' ? '🎉 Auction ended — sold!' : 'Auction ended with no bids.');
        }
      });
    });

    this.countdownSub = interval(1000).subscribe(() => this.tickCountdown());
  }

  ngOnDestroy(): void {
    void this.auctionHub.leaveAuctionGroup(this.auctionId);
    void this.auctionHub.disconnect();
    this.countdownSub?.unsubscribe();
  }

  load(): void {
    this.loading.set(true);
    this.auctionService.getById(this.auctionId).subscribe({
      next: (a) => {
        this.auction.set(a);
        this.setSeo(a);
        this.loading.set(false);
        if (a.cameraId && a.status === 'Live') this.loadStream();
      },
      error: () => this.loading.set(false),
    });
    this.auctionService.getBids(this.auctionId).subscribe(bids => this.bids.set(bids));
  }

  /** Per-auction SEO: title, description, canonical, Open Graph/Twitter, Product+Offer JSON-LD, breadcrumbs. */
  private setSeo(a: Auction): void {
    const url = `https://seetheprep.com/auctions/${a.id}`;
    const pageTitle = `${a.title} — Live Auction from ${a.restaurantName} | SeeThePrep`;
    const desc = a.description
      ?? `Bid live on "${a.title}" from ${a.restaurantName}. Watch the live camera feed and place real-time bids on SeeThePrep's live food auctions.`;

    this.titleService.setTitle(pageTitle);
    this.metaService.updateTag({ name: 'description', content: desc });
    this.metaService.updateTag({ property: 'og:type', content: 'product' });
    this.metaService.updateTag({ property: 'og:title', content: pageTitle });
    this.metaService.updateTag({ property: 'og:description', content: desc });
    this.metaService.updateTag({ property: 'og:url', content: url });
    if (a.imageUrl) this.metaService.updateTag({ property: 'og:image', content: a.imageUrl });
    this.metaService.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.metaService.updateTag({ name: 'twitter:title', content: pageTitle });
    this.metaService.updateTag({ name: 'twitter:description', content: desc });
    this.canonicalService.set(url);

    this.doc.getElementById('auction-jsonld')?.remove();
    this.doc.getElementById('auction-breadcrumb-jsonld')?.remove();

    const breadcrumb = this.doc.createElement('script');
    breadcrumb.id = 'auction-breadcrumb-jsonld';
    breadcrumb.type = 'application/ld+json';
    breadcrumb.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://seetheprep.com/' },
        { '@type': 'ListItem', position: 2, name: 'Live Auctions', item: 'https://seetheprep.com/auctions' },
        { '@type': 'ListItem', position: 3, name: a.title, item: url },
      ],
    });
    this.doc.head.appendChild(breadcrumb);

    const availability = a.status === 'Live'
      ? 'https://schema.org/InStock'
      : a.status === 'Sold'
        ? 'https://schema.org/SoldOut'
        : 'https://schema.org/PreOrder';

    const script = this.doc.createElement('script');
    script.id = 'auction-jsonld';
    script.type = 'application/ld+json';
    script.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: a.title,
      description: desc,
      ...(a.imageUrl ? { image: a.imageUrl } : {}),
      brand: { '@type': 'Organization', name: a.restaurantName },
      offers: {
        '@type': 'Offer',
        price: (a.currentBid ?? a.startingPrice).toFixed(2),
        priceCurrency: 'GBP',
        availability,
        url,
        ...(a.endsAt ? { priceValidUntil: a.endsAt } : {}),
      },
    });
    this.doc.head.appendChild(script);
  }

  private loadStream(): void {
    this.auctionService.getLiveStreamUrl(this.auctionId).subscribe({
      next: (res) => this.liveStreamUrl.set(res.hlsUrl),
      error: () => this.liveStreamUrl.set(''),
    });
  }

  onStreamOffline(): void {
    this.liveStreamUrl.set(null);
  }

  private tickCountdown(): void {
    const a = this.auction();
    if (!a?.endsAt) { this.secondsLeft.set(null); return; }
    const remaining = Math.max(0, Math.floor((new Date(a.endsAt).getTime() - Date.now()) / 1000));
    this.secondsLeft.set(remaining);
  }

  formatCountdown(): string {
    const s = this.secondsLeft();
    if (s === null) return '';
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  }

  quickBid(increments: number): void {
    const a = this.auction();
    if (!a) return;
    this.bidAmountInput = Math.round((this.minNextBid() + (increments - 1) * a.bidIncrement) * 100) / 100;
    this.placeBid();
  }

  placeBid(): void {
    if (!this.isLoggedIn()) {
      this.toast.error('Please log in to place a bid.');
      return;
    }
    const amount = this.bidAmountInput ?? this.minNextBid();
    if (amount < this.minNextBid()) {
      this.toast.error(`Bid must be at least £${this.minNextBid().toFixed(2)}`);
      return;
    }
    this.bidding.set(true);
    this.auctionService.placeBid(this.auctionId, amount).subscribe({
      next: () => {
        this.bidding.set(false);
        this.toast.success('Bid placed! 🔨');
      },
      error: (err) => {
        this.bidding.set(false);
        this.toast.error(err.error?.message ?? 'Failed to place bid');
      },
    });
  }
}
