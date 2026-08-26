import { Component, ChangeDetectionStrategy, OnInit, inject, signal, DOCUMENT } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/auth/auth.service';
import { SubscriptionService } from '../../../core/services/subscription.service';
import { CanonicalService } from '../../../core/services/canonical.service';
import { ToastService } from '../../../core/services/toast.service';
import { SubscriptionStatus } from '../../../core/models';

/**
 * PlusLanding — /plus
 * SSR marketing landing page for SeeThePrep Plus (paid membership, no free trial).
 * (SRP: presents the offer + starts checkout only — subscription status/cancel live in Profile)
 */
@Component({
  selector: 'app-plus-landing',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './plus-landing.html',
  styleUrl: './plus-landing.scss',
})
export class PlusLanding implements OnInit {
  private readonly titleService = inject(Title);
  private readonly metaService = inject(Meta);
  private readonly canonicalService = inject(CanonicalService);
  private readonly doc = inject(DOCUMENT);
  private readonly subscriptionService = inject(SubscriptionService);
  private readonly toast = inject(ToastService);
  readonly auth = inject(AuthService);

  readonly subscribing = signal(false);
  readonly status = signal<SubscriptionStatus | null>(null);
  readonly loadingStatus = signal(false);

  static readonly PRICE = '£3.99/mo';
  static readonly DISCOUNT_RATE = '10%';
  static readonly MIN_SPEND = '£15';

  // Instance-bound copies for template access (templates cannot reference static class members)
  readonly price = PlusLanding.PRICE;
  readonly discountRate = PlusLanding.DISCOUNT_RATE;
  readonly minSpend = PlusLanding.MIN_SPEND;


  private static readonly PAGE_TITLE = 'SeeThePrep Plus — Free Delivery & 10% Off | SeeThePrep';
  private static readonly PAGE_DESC =
    'Join SeeThePrep Plus for £3.99/month: unlimited free delivery and 10% off orders over £15. No trial, no commitment — cancel anytime.';
  private static readonly PAGE_URL = 'https://seetheprep.com/plus';

  ngOnInit(): void {
    this.setSeo();
    if (this.auth.isCustomer()) {
      this.loadingStatus.set(true);
      this.subscriptionService.getStatus().subscribe({
        next: (s) => { this.status.set(s); this.loadingStatus.set(false); },
        error: () => this.loadingStatus.set(false),
      });
    }
  }

  subscribe(): void {
    if (!this.auth.isLoggedIn()) {
      this.toast.info('Please log in to join SeeThePrep Plus');
      return;
    }
    this.subscribing.set(true);
    const successUrl = `${window.location.origin}/plus?plus=success`;
    const cancelUrl = window.location.href;
    this.subscriptionService.createCheckout(successUrl, cancelUrl).subscribe({
      next: (res) => { window.location.href = res.checkoutUrl; },
      error: () => {
        this.subscribing.set(false);
        this.toast.error('Could not start subscription checkout');
      },
    });
  }

  private setSeo(): void {
    this.titleService.setTitle(PlusLanding.PAGE_TITLE);
    this.metaService.updateTag({ name: 'description', content: PlusLanding.PAGE_DESC });
    this.metaService.updateTag({ property: 'og:type', content: 'website' });
    this.metaService.updateTag({ property: 'og:title', content: PlusLanding.PAGE_TITLE });
    this.metaService.updateTag({ property: 'og:description', content: PlusLanding.PAGE_DESC });
    this.metaService.updateTag({ property: 'og:url', content: PlusLanding.PAGE_URL });
    this.metaService.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.metaService.updateTag({ name: 'twitter:title', content: PlusLanding.PAGE_TITLE });
    this.metaService.updateTag({ name: 'twitter:description', content: PlusLanding.PAGE_DESC });
    this.canonicalService.set(PlusLanding.PAGE_URL);

    const breadcrumb = this.doc.createElement('script');
    breadcrumb.type = 'application/ld+json';
    breadcrumb.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://seetheprep.com/' },
        { '@type': 'ListItem', position: 2, name: 'SeeThePrep Plus', item: PlusLanding.PAGE_URL },
      ],
    });
    this.doc.head.appendChild(breadcrumb);

    const product = this.doc.createElement('script');
    product.type = 'application/ld+json';
    product.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: 'SeeThePrep Plus Membership',
      description: PlusLanding.PAGE_DESC,
      brand: { '@type': 'Organization', name: 'SeeThePrep' },
      offers: {
        '@type': 'Offer',
        price: '3.99',
        priceCurrency: 'GBP',
        availability: 'https://schema.org/InStock',
        url: PlusLanding.PAGE_URL,
      },
    });
    this.doc.head.appendChild(product);
  }
}
