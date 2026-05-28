import { Component, signal, computed, ViewChild, ElementRef, OnDestroy, AfterViewInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRippleModule } from '@angular/material/core';
import { CartService } from '../../../core/services/cart.service';
import { OrderService } from '../../../core/services/order.service';
import { AuthService } from '../../../core/auth/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { IdempotencyKeyService } from '../../../core/services/idempotency-key.service';
import { ConfettiService } from '../../../core/services/confetti.service';
import { StripeService } from '../../../core/services/stripe.service';
import { PaymentService } from '../../../core/services/payment.service';
import { PromoCodeService } from '../../../core/services/promo-code.service';
import { GiftCardService } from '../../../core/services/gift-card.service';
import { SubscriptionService } from '../../../core/services/subscription.service';
import { ukPostcodeValidator } from '../../../shared/validators/uk-postcode.validator';
import { environment } from '../../../../environments/environment';
import { ScrollRevealDirective } from '../../../shared/directives/scroll-reveal.directive';
import { MagneticDirective } from '../../../shared/directives/magnetic.directive';
import { TiltDirective } from '../../../shared/directives/tilt.directive';
import { MenuItemEmojiPipe } from '../../../shared/pipes/restaurant-emoji.pipe';
import { ImageFallback } from '../../../shared/components/image-fallback/image-fallback';
import { ValidatePromoCodeResponse, ValidateGiftCardResponse } from '../../../core/models';

/**
 * (SRP: postcode → ukPostcodeValidator; idempotency → IdempotencyKeyService;
 *  payment → StripeService + PaymentService; order placement → OrderService)
 */
@Component({
  selector: 'app-checkout',
  imports: [
    FormsModule, ReactiveFormsModule, CurrencyPipe, RouterLink,
    MatFormFieldModule, MatInputModule, MatButtonModule,
    MatDividerModule, MatProgressSpinnerModule, MatRippleModule,
    ScrollRevealDirective, MagneticDirective, ImageFallback,
  ],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss',
})
export class Checkout implements AfterViewInit, OnDestroy {
  @ViewChild('cardElement') private cardElementRef!: ElementRef<HTMLDivElement>;

  readonly DELIVERY_FEE = 2.5;
  readonly placing = signal(false);
  /** 'idle' | 'confirming' | 'placing' */
  readonly paymentStep = signal<'idle' | 'confirming' | 'placing'>('idle');
  readonly cardError = signal<string | null>(null);
  /** 'Delivery' or 'Collection'. Collection hides address fields and skips postcode validation. */
  readonly orderType = signal<'Delivery' | 'Collection'>('Delivery');
  /** ISO string of the selected scheduled time, or null for ASAP. */
  readonly scheduledFor = signal<string | null>(null);
  readonly scheduleEnabled = signal(false);

  // ── Promo / gift card ──
  promoCodeInput = '';
  readonly promoLoading = signal(false);
  readonly promoResult = signal<ValidatePromoCodeResponse | null>(null);
  readonly promoError = signal<string | null>(null);

  giftCardInput = '';
  readonly giftCardLoading = signal(false);
  readonly giftCardResult = signal<ValidateGiftCardResponse | null>(null);
  readonly giftCardError = signal<string | null>(null);

  // ── SeeThePrep Plus ──
  readonly isPlus = signal(false);

  addressLine1 = '';
  city = '';
  specialInstructions = '';
  scheduledDateTime = '';  // bound to datetime-local input

  readonly postcodeControl = new FormControl('', [
    Validators.required,
    ukPostcodeValidator(),
  ]);

  constructor(
    readonly cart: CartService,
    private readonly orderService: OrderService,
    private readonly auth: AuthService,
    private readonly toast: ToastService,
    private readonly router: Router,
    private readonly idempotencyKey: IdempotencyKeyService,
    private readonly confetti: ConfettiService,
    readonly stripeService: StripeService,
    private readonly paymentService: PaymentService,
    private readonly promoCodeService: PromoCodeService,
    private readonly giftCardService: GiftCardService,
    private readonly subscriptionService: SubscriptionService,
  ) {
    if (this.auth.isLoggedIn()) {
      this.subscriptionService.getStatus().subscribe({
        next: (s) => this.isPlus.set(s.isActive),
        error: () => {},
      });
    }
  }

  async ngAfterViewInit(): Promise<void> {
    if (this.cart.isEmpty() || !this.isStripeConfigured) return;
    await this.stripeService.load();
    if (this.cardElementRef?.nativeElement)
      this.stripeService.mountCard(this.cardElementRef.nativeElement);
  }

  ngOnDestroy(): void {
    this.stripeService.destroyCard();
  }

  get postcodeValid(): boolean {
    return this.postcodeControl.valid;
  }

  get formValid(): boolean {
    if (this.orderType() === 'Collection') return true;
    return (
      this.addressLine1.trim().length > 0 &&
      this.city.trim().length > 0 &&
      this.postcodeValid
    );
  }

  get effectiveDeliveryFee(): number {
    return this.isPlus() || this.orderType() === 'Collection' ? 0 : this.DELIVERY_FEE;
  }

  get promoDiscount(): number {
    return this.promoResult()?.discountAmount ?? 0;
  }

  get giftCardDiscount(): number {
    const r = this.giftCardResult();
    if (!r?.isValid) return 0;
    return Math.min(r.remainingBalance ?? 0, this.cart.total() + this.effectiveDeliveryFee - this.promoDiscount);
  }

  get grandTotal(): number {
    return Math.max(0, this.cart.total() + this.effectiveDeliveryFee - this.promoDiscount - this.giftCardDiscount);
  }

  applyPromo(): void {
    const code = this.promoCodeInput.trim().toUpperCase();
    if (!code) return;
    this.promoLoading.set(true);
    this.promoError.set(null);
    this.promoResult.set(null);
    this.promoCodeService.validate(code, this.cart.total()).subscribe({
      next: (r) => {
        this.promoLoading.set(false);
        if (r.isValid) {
          this.promoResult.set(r);
        } else {
          this.promoError.set(r.message);
        }
      },
      error: () => {
        this.promoLoading.set(false);
        this.promoError.set('Could not validate promo code');
      },
    });
  }

  removePromo(): void {
    this.promoResult.set(null);
    this.promoError.set(null);
    this.promoCodeInput = '';
  }

  applyGiftCard(): void {
    const code = this.giftCardInput.trim().toUpperCase();
    if (!code) return;
    this.giftCardLoading.set(true);
    this.giftCardError.set(null);
    this.giftCardResult.set(null);
    this.giftCardService.validate(code).subscribe({
      next: (r) => {
        this.giftCardLoading.set(false);
        if (r.isValid) {
          this.giftCardResult.set(r);
        } else {
          this.giftCardError.set(r.message);
        }
      },
      error: () => {
        this.giftCardLoading.set(false);
        this.giftCardError.set('Could not validate gift card');
      },
    });
  }

  removeGiftCard(): void {
    this.giftCardResult.set(null);
    this.giftCardError.set(null);
    this.giftCardInput = '';
  }

  get stepLabel(): string {
    switch (this.paymentStep()) {
      case 'confirming': return 'Confirming payment…';
      case 'placing':    return 'Placing order…';
      default:           return this.orderType() === 'Collection' ? 'Place Collection Order' : 'Pay & Place Order';
    }
  }

  get scheduledForIso(): string | null {
    if (!this.scheduleEnabled() || !this.scheduledDateTime) return null;
    return new Date(this.scheduledDateTime).toISOString();
  }

  get restaurantSupportsCollection(): boolean {
    return this.cart.supportsCollection();
  }

  /** Minimum datetime value for the schedule picker (30 min from now). */
  get minScheduleTime(): string {
    const d = new Date(Date.now() + 30 * 60_000);
    // datetime-local format: YYYY-MM-DDTHH:mm
    return d.toISOString().slice(0, 16);
  }

  async placeOrder(): Promise<void> {
    if (!this.formValid || this.cart.isEmpty()) return;
    if (!this.auth.isLoggedIn()) {
      this.toast.error('Please login to place an order');
      this.router.navigate(['/login']);
      return;
    }

    this.cardError.set(null);
    this.placing.set(true);
    const key = this.idempotencyKey.generate();

    // ── Demo mode: Stripe not configured — skip payment, use mock ID ──
    if (!this.isStripeConfigured) {
      this.paymentStep.set('placing');
      this.orderService.place({
        restaurantId: this.cart.restaurantId()!,
        items: this.cart.items().map(i => ({ menuItemId: i.menuItem.id, quantity: i.quantity })),
        deliveryAddressLine1: this.orderType() === 'Collection' ? undefined : this.addressLine1,
        deliveryCity: this.orderType() === 'Collection' ? undefined : this.city,
        deliveryPostcode: this.orderType() === 'Collection' ? undefined : this.postcodeControl.value?.toUpperCase(),
        idempotencyKey: key,
        paymentIntentId: 'pi_mock_demo_' + key.slice(0, 16),
        specialInstructions: this.specialInstructions.trim() || null,
        orderType: this.orderType(),
        scheduledFor: this.scheduledForIso,
        promoCode: this.promoResult()?.isValid ? this.promoCodeInput.trim().toUpperCase() : null,
        giftCardCode: this.giftCardResult()?.isValid ? this.giftCardInput.trim().toUpperCase() : null,
      }).subscribe({
        next: (order) => {
          this.cart.clear();
          this.confetti.burst();
          this.toast.success('Order placed! Watch your chef get started 👨‍🍳');
          setTimeout(() => this.router.navigate(['/orders', order.hashId]), 900);
        },
        error: (err) => {
          this.placing.set(false);
          this.paymentStep.set('idle');
          this.toast.error(err.error?.message ?? 'Failed to place order');
        },
      });
      return;
    }

    // ── Step 1: Create PaymentIntent server-side (amount validated on backend) ──
    this.paymentStep.set('confirming');
    this.paymentService.createIntent({
      restaurantId: this.cart.restaurantId()!,
      items: this.cart.items().map(i => ({ menuItemId: i.menuItem.id, quantity: i.quantity })),
      idempotencyKey: key,
    }).subscribe({
      next: async ({ clientSecret }) => {
        // ── Step 2: Confirm card payment (Stripe.js handles 3DS automatically) ──
        const result = await this.stripeService.confirmCardPayment(clientSecret);

        if ('error' in result) {
          this.cardError.set(result.error);
          this.placing.set(false);
          this.paymentStep.set('idle');
          return;
        }

        // ── Step 3: Place order with confirmed PaymentIntent ID ──
        this.paymentStep.set('placing');
        this.orderService.place({
          restaurantId: this.cart.restaurantId()!,
          items: this.cart.items().map(i => ({ menuItemId: i.menuItem.id, quantity: i.quantity })),
          deliveryAddressLine1: this.orderType() === 'Collection' ? undefined : this.addressLine1,
          deliveryCity: this.orderType() === 'Collection' ? undefined : this.city,
          deliveryPostcode: this.orderType() === 'Collection' ? undefined : this.postcodeControl.value?.toUpperCase(),
          idempotencyKey: key,
          paymentIntentId: result.paymentIntentId,
          specialInstructions: this.specialInstructions.trim() || null,
          orderType: this.orderType(),
          scheduledFor: this.scheduledForIso,
          promoCode: this.promoResult()?.isValid ? this.promoCodeInput.trim().toUpperCase() : null,
          giftCardCode: this.giftCardResult()?.isValid ? this.giftCardInput.trim().toUpperCase() : null,
        }).subscribe({
          next: (order) => {
            this.cart.clear();
            this.confetti.burst();
            this.toast.success('Order placed! Watch your chef get started 👨‍🍳');
            setTimeout(() => this.router.navigate(['/orders', order.hashId]), 900);
          },
          error: (err) => {
            this.placing.set(false);
            this.paymentStep.set('idle');
            this.toast.error(err.error?.message ?? 'Failed to place order');
          },
        });
      },
      error: (err) => {
        this.placing.set(false);
        this.paymentStep.set('idle');
        this.toast.error(err.error?.error ?? 'Could not initialise payment');
      },
    });
  }

  get isStripeConfigured(): boolean {
    return !environment.stripePublishableKey.includes('placeholder');
  }
}

