import {
  Component, ChangeDetectionStrategy, OnInit, OnDestroy,
  inject, signal, computed, DOCUMENT,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Title, Meta } from '@angular/platform-browser';
import { AuctionService } from '../../../core/services/auction.service';
import { AuctionHubService } from '../../../core/services/auction-hub.service';
import { CanonicalService } from '../../../core/services/canonical.service';
import { Auction } from '../../../core/models';

@Component({
  selector: 'app-auctions-browse',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './auctions-browse.html',
  styleUrl: './auctions-browse.scss',
})
export class AuctionsBrowse implements OnInit, OnDestroy {
  private readonly auctionService  = inject(AuctionService);
  private readonly auctionHub      = inject(AuctionHubService);
  private readonly titleService    = inject(Title);
  private readonly metaService     = inject(Meta);
  private readonly canonicalService= inject(CanonicalService);
  private readonly doc             = inject(DOCUMENT);

  readonly auctions      = signal<Auction[]>([]);
  readonly loading       = signal(true);

  // filter state
  searchQuery   = '';
  readonly searchFocused  = signal(false);
  readonly activeStatus   = signal<string>('all');
  readonly showLiveOnly   = signal(false);
  readonly showEndingSoon = signal(false);
  readonly showBuyNow     = signal(false);

  readonly sortOption   = signal<string>('live');

  readonly STATUS_FILTERS = [
    { icon: 'local_fire_department', label: 'All',         value: 'all'    },
    { icon: 'sensors',               label: 'Live Now',    value: 'Live'   },
    { icon: 'timer',                 label: 'Ending Soon', value: 'ending' },
    { icon: 'bolt',                  label: 'Buy Now',     value: 'buynow' },
    { icon: 'emoji_events',          label: 'Just Sold',   value: 'Sold'   },
  ];

  readonly filteredAuctions = computed(() => {
    let list = this.auctions();
    const q = this.searchQuery.toLowerCase().trim();
    const status = this.activeStatus();

    if (status === 'Live')   list = list.filter(a => a.status === 'Live');
    if (status === 'Sold')   list = list.filter(a => a.status === 'Sold');
    if (status === 'ending') list = list.filter(a => this.isUrgent(a));
    if (status === 'buynow') list = list.filter(a => !!a.buyNowPrice);

    if (this.showLiveOnly())   list = list.filter(a => a.status === 'Live');
    if (this.showEndingSoon()) list = list.filter(a => this.isUrgent(a));
    if (this.showBuyNow())     list = list.filter(a => !!a.buyNowPrice);

    if (q) list = list.filter(a =>
      a.title.toLowerCase().includes(q) ||
      a.restaurantName.toLowerCase().includes(q) ||
      (a.description ?? '').toLowerCase().includes(q)
    );

    return list;
  });

  private static readonly PAGE_TITLE = 'Live Food Auctions — Bid on Restaurant Specials | SeeThePrep';
  private static readonly PAGE_DESC  =
    'Watch restaurants auction off chef\'s specials and limited dishes live on camera. Place real-time bids, buy now, and win exclusive food drops on SeeThePrep.';
  private static readonly PAGE_URL   = 'https://seetheprep.com/auctions';

  ngOnInit(): void {
    this.setStaticSeo();
    this.load();
    void this.auctionHub.connect().then(() => {
      this.auctionHub.auctionStarted$.subscribe(a  => this.auctions.update(list => [a, ...list]));
      this.auctionHub.auctionEnded$.subscribe(ended =>
        this.auctions.update(list => list.filter(a => a.id !== ended.id)));
      this.auctionHub.auctionUpdated$.subscribe(updated =>
        this.auctions.update(list => list.map(a => a.id === updated.id ? updated : a)));
      this.auctionHub.bidPlaced$.subscribe(bid =>
        this.auctions.update(list => list.map(a => a.id === bid.auctionId
          ? { ...a, currentBid: bid.amount, bidCount: a.bidCount + 1 } : a)));
    });
  }

  ngOnDestroy(): void { void this.auctionHub.disconnect(); }

  load(): void {
    this.loading.set(true);
    this.auctionService.getLive().subscribe({
      next: (data) => {
        this.auctions.set(data);
        this.loading.set(false);
        this.setListJsonLd(data);
      },
      error: () => this.loading.set(false),
    });
  }

  setStatus(value: string): void { this.activeStatus.set(value); }

  onSearchChange(): void { /* triggers filteredAuctions computed */ }

  onSortChange(event: Event): void {
    this.sortOption.set((event.target as HTMLSelectElement).value);
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.activeStatus.set('all');
    this.showLiveOnly.set(false);
    this.showEndingSoon.set(false);
    this.showBuyNow.set(false);
  }

  isUrgent(auction: Auction): boolean {
    if (!auction.endsAt) return false;
    const secsLeft = (new Date(auction.endsAt).getTime() - Date.now()) / 1000;
    return secsLeft > 0 && secsLeft <= 120;
  }

  formatTimeLeft(auction: Auction): string {
    if (!auction.endsAt) return '';
    const secs = Math.max(0, Math.floor((new Date(auction.endsAt).getTime() - Date.now()) / 1000));
    if (secs >= 3600) return `${Math.floor(secs / 3600)}h ${Math.floor((secs % 3600) / 60)}m`;
    if (secs >= 60)   return `${Math.floor(secs / 60)}m ${secs % 60}s`;
    return `${secs}s`;
  }

  private setStaticSeo(): void {
    this.titleService.setTitle(AuctionsBrowse.PAGE_TITLE);
    this.metaService.updateTag({ name: 'description', content: AuctionsBrowse.PAGE_DESC });
    this.metaService.updateTag({ property: 'og:type', content: 'website' });
    this.metaService.updateTag({ property: 'og:title', content: AuctionsBrowse.PAGE_TITLE });
    this.metaService.updateTag({ property: 'og:description', content: AuctionsBrowse.PAGE_DESC });
    this.metaService.updateTag({ property: 'og:url', content: AuctionsBrowse.PAGE_URL });
    this.metaService.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.metaService.updateTag({ name: 'twitter:title', content: AuctionsBrowse.PAGE_TITLE });
    this.metaService.updateTag({ name: 'twitter:description', content: AuctionsBrowse.PAGE_DESC });
    this.canonicalService.set(AuctionsBrowse.PAGE_URL);

    const breadcrumb = this.doc.createElement('script');
    breadcrumb.type = 'application/ld+json';
    breadcrumb.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://seetheprep.com/' },
        { '@type': 'ListItem', position: 2, name: 'Live Auctions', item: AuctionsBrowse.PAGE_URL },
      ],
    });
    this.doc.head.appendChild(breadcrumb);
  }

  private setListJsonLd(auctions: Auction[]): void {
    this.doc.getElementById('auctions-itemlist-jsonld')?.remove();
    if (auctions.length === 0) return;

    const script = this.doc.createElement('script');
    script.id = 'auctions-itemlist-jsonld';
    script.type = 'application/ld+json';
    script.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Live Food Auctions',
      itemListElement: auctions.map((a, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `${AuctionsBrowse.PAGE_URL}/${a.id}`,
        item: {
          '@type': 'Product',
          name: a.title,
          description: a.description ?? `Live auction from ${a.restaurantName}`,
          ...(a.imageUrl ? { image: a.imageUrl } : {}),
          brand: { '@type': 'Organization', name: a.restaurantName },
          offers: {
            '@type': 'Offer',
            price: (a.currentBid ?? a.startingPrice).toFixed(2),
            priceCurrency: 'GBP',
            availability: 'https://schema.org/LimitedAvailability',
            url: `${AuctionsBrowse.PAGE_URL}/${a.id}`,
          },
        },
      })),
    });
    this.doc.head.appendChild(script);
  }
}
