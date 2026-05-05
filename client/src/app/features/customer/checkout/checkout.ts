import { Component, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';
import { AbstractControl, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
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
import { ukPostcodeValidator } from '../../../shared/validators/uk-postcode.validator';
import { ScrollRevealDirective } from '../../../shared/directives/scroll-reveal.directive';
import { MagneticDirective } from '../../../shared/directives/magnetic.directive';
import { MenuItemEmojiPipe } from '../../../shared/pipes/restaurant-emoji.pipe';

/**
 * (SRP: postcode validation delegated to ukPostcodeValidator, idempotency key to IdempotencyKeyService)
 */
@Component({
  selector: 'app-checkout',
  imports: [
    FormsModule, ReactiveFormsModule, CurrencyPipe, RouterLink,
    MatFormFieldModule, MatInputModule, MatButtonModule,
    MatDividerModule, MatProgressSpinnerModule, MatRippleModule,
    ScrollRevealDirective, MagneticDirective, MenuItemEmojiPipe,
  ],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss',
})
export class Checkout {
  readonly placing = signal(false);
  addressLine1 = '';
  city = '';

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
    private readonly confetti: ConfettiService
  ) {}

  get postcodeValid(): boolean {
    return this.postcodeControl.valid;
  }

  get formValid(): boolean {
    return this.addressLine1.trim().length > 0 &&
      this.city.trim().length > 0 &&
      this.postcodeValid;
  }

  placeOrder(): void {
    if (!this.formValid || this.cart.isEmpty()) return;
    if (!this.auth.isLoggedIn()) {
      this.toast.error('Please login to place an order');
      this.router.navigate(['/login']);
      return;
    }

    this.placing.set(true);
    this.orderService.place({
      restaurantId: this.cart.restaurantId()!,
      items: this.cart.items().map((i) => ({
        menuItemId: i.menuItem.id,
        quantity: i.quantity,
      })),
      deliveryAddressLine1: this.addressLine1,
      deliveryCity: this.city,
      deliveryPostcode: this.postcodeControl.value!.toUpperCase(),
      idempotencyKey: this.idempotencyKey.generate(),
    }).subscribe({
      next: (order) => {
        this.cart.clear();
        this.confetti.burst();
        this.toast.success('Order placed! Watch your chef get started 👨‍🍳');
        setTimeout(() => this.router.navigate(['/orders', order.id]), 900);
      },
      error: (err) => {
        this.placing.set(false);
        this.toast.error(err.error?.message ?? 'Failed to place order');
      },
    });
  }
}
