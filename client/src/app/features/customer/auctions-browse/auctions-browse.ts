import { Component, ChangeDetectionStrategy, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { AuctionService } from '../../../core/services/auction.service';
import { AuctionHubService } from '../../../core/services/auction-hub.service';
import { CanonicalService } from '../../../core/services/canonical.service';
import { Auction } from '../../../core/models';

/**
 * AuctionsBrowse — /auctions
 * Live-shopping style grid of currently-live restaurant food auctions.
 * (SRP: browse/listing only — bidding happens on AuctionLive)
 */
@Component({
  selector: 'app-auctions-browse',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink],
  templateUrl: './auctions-browse.html',
  styleUrl: './auctions-browse.scss',
})
export class AuctionsBrowse implements OnInit, OnDestroy {
  private readonly auctionService = inject(AuctionService);
  private readonly auctionHub = inject(AuctionHubService);
  private readonly titleService = inject(Title);
  private readonly metaService = inject(Meta);
  private readonly canonicalService = inject(CanonicalService);
  private readonly doc = inject(DOCUMENT);

  readonly auctions = signal<Auction[]>([]);
  readonly loading = signal(true);

  private static readonly PAGE_TITLE = 'Live Food Auctions — Bid on Restaurant Specials | SeeThePrep';
  private static readonly PAGE_DESC =
    'Watch restaurants auction off chef\'s specials and limited dishes live on camera. Place real-time bids, buy now, and win exclusive food drops on SeeThePrep.';
  private static readonly PAGE_URL = 'https://seetheprep.com/auctions';

  ngOnInit(): void {
    this.setStaticSeo();
    this.load();
    void this.auctionHub.connect().then(() => {
      this.auctionHub.auctionStarted$.subscribe(a => this.auctions.update(list => [a, ...list]));
      this.auctionHub.auctionEnded$.subscribe(ended =>
        this.auctions.update(list => list.filter(a => a.id !== ended.id)));
      this.auctionHub.auctionUpdated$.subscribe(updated =>
        this.auctions.update(list => list.map(a => a.id === updated.id ? updated : a)));
      this.auctionHub.bidPlaced$.subscribe(bid =>
        this.auctions.update(list => list.map(a => a.id === bid.auctionId
          ? { ...a, currentBid: bid.amount, bidCount: a.bidCount + 1 } : a)));
    });
  }

  ngOnDestroy(): void {
    void this.auctionHub.disconnect();
  }

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

  /** Static per-page SEO: title, meta description, canonical, Open Graph, Twitter Card. */
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

    // Breadcrumb JSON-LD
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

  /** Dynamic ItemList JSON-LD reflecting the currently-live auctions (re-run whenever the list changes). */
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
