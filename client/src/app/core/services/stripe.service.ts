import { Injectable, signal } from '@angular/core';
import { loadStripe, Stripe, StripeElements, StripeCardElement } from '@stripe/stripe-js';
import { environment } from '../../../environments/environment';

/**
 * Wraps the Stripe.js browser SDK.
 * (SRP: all Stripe.js browser interactions — loading, mounting, confirming payment)
 * (DIP: Checkout depends on this abstraction, not on stripe-js directly)
 */
@Injectable({ providedIn: 'root' })
export class StripeService {
  private _stripe: Stripe | null = null;
  private _elements: StripeElements | null = null;
  private _card: StripeCardElement | null = null;

  /** True while Stripe.js is loading from the CDN. */
  readonly loading = signal(false);

  async load(): Promise<void> {
    if (this._stripe) return;
    this.loading.set(true);
    this._stripe = await loadStripe(environment.stripePublishableKey);
    this.loading.set(false);
  }

  /**
   * Mounts a Stripe card element into the given DOM container.
   * Must be called after load().
   */
  mountCard(container: HTMLElement): void {
    if (!this._stripe) return;
    this._elements = this._stripe.elements();
    this._card = this._elements.create('card', {
      style: {
        base: {
          color: '#f1f5f9',
          fontFamily: '"Inter", sans-serif',
          fontSize: '15px',
          '::placeholder': { color: '#94a3b8' },
          iconColor: '#ff6b1a',
        },
        invalid: { color: '#f87171', iconColor: '#f87171' },
      },
    });
    this._card.mount(container);
  }

  /**
   * Confirms the payment using the card element.
   * Returns the PaymentIntent ID on success, or an error message.
   */
  async confirmCardPayment(
    clientSecret: string
  ): Promise<{ paymentIntentId: string } | { error: string }> {
    if (!this._stripe || !this._card)
      return { error: 'Stripe is not initialised. Please refresh and try again.' };

    const result = await this._stripe.confirmCardPayment(clientSecret, {
      payment_method: { card: this._card },
    });

    if (result.error) return { error: result.error.message ?? 'Payment failed' };
    return { paymentIntentId: result.paymentIntent!.id };
  }

  /** Unmounts the card element. Call in ngOnDestroy. */
  destroyCard(): void {
    this._card?.unmount();
    this._card = null;
    this._elements = null;
  }
}
