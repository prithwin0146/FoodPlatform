import { Component, signal, ViewChild, ElementRef, OnDestroy, AfterViewInit } from '@angular/core';
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
import { ukPostcodeValidator } from '../../../shared/validators/uk-postcode.validator';
import { environment } from '../../../../environments/environment';
import { ScrollRevealDirective } from '../../../shared/directives/scroll-reveal.directive';
import { MagneticDirective } from '../../../shared/directives/magnetic.directive';
import { TiltDirective } from '../../../shared/directives/tilt.directive';
import { MenuItemEmojiPipe } from '../../../shared/pipes/restaurant-emoji.pipe';
import { ImageFallback } from '../../../shared/components/image-fallback/image-fallback';

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

  addressLine1 = '';
  city = '';
  specialInstructions = '';

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
    private readonly paymentService: PaymentService
  ) {}

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
    return (
      this.addressLine1.trim().length > 0 &&
      this.city.trim().length > 0 &&
      this.postcodeValid
    );
  }

  get stepLabel(): string {
    switch (this.paymentStep()) {
      case 'confirming': return 'Confirming payment…';
      case 'placing':    return 'Placing order…';
      default:           return 'Pay & Place Order';
    }
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
        deliveryAddressLine1: this.addressLine1,
        deliveryCity: this.city,
        deliveryPostcode: this.postcodeControl.value!.toUpperCase(),
        idempotencyKey: key,
        paymentIntentId: 'pi_mock_demo_' + key.slice(0, 16),
        specialInstructions: this.specialInstructions.trim() || null,
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
          deliveryAddressLine1: this.addressLine1,
          deliveryCity: this.city,
          deliveryPostcode: this.postcodeControl.value!.toUpperCase(),
          idempotencyKey: key,
          paymentIntentId: result.paymentIntentId,
          specialInstructions: this.specialInstructions.trim() || null,
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

