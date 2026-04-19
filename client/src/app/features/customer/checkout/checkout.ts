import { Component, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';
import { CartService } from '../../../core/services/cart.service';
import { OrderService } from '../../../core/services/order.service';
import { AuthService } from '../../../core/auth/auth.service';
import { ToastService } from '../../../core/services/toast.service';
@Component({
  selector: 'app-checkout',
  imports: [FormsModule, CurrencyPipe, RouterLink],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss',
})
export class Checkout {
  readonly placing = signal(false);
  addressLine1 = '';
  city = '';
  postcode = '';

  constructor(
    readonly cart: CartService,
    private readonly orderService: OrderService,
    private readonly auth: AuthService,
    private readonly toast: ToastService,
    private readonly router: Router
  ) {}

  get postcodeValid(): boolean {
    return /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i.test(this.postcode.trim());
  }

  get formValid(): boolean {
    return this.addressLine1.trim().length > 0 && this.city.trim().length > 0 && this.postcodeValid;
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
      deliveryPostcode: this.postcode.toUpperCase(),
      idempotencyKey: this.generateId(),
    }).subscribe({
      next: (order) => {
        this.cart.clear();
        this.toast.success('Order placed successfully!');
        this.router.navigate(['/orders', order.id]);
      },
      error: (err) => {
        this.placing.set(false);
        this.toast.error(err.error?.message ?? 'Failed to place order');
      },
    });
  }

  private generateId(): string {
    return crypto.randomUUID?.() ?? Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}
