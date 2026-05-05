import { Component, OnInit, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatRippleModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { OrderService } from '../../../core/services/order.service';
import { ToastService } from '../../../core/services/toast.service';
import { Order, nextOrderStatus } from '../../../core/models';
import { OrderStatusEmojiPipe } from '../../../shared/pipes/order-status.pipe';
import { TiltDirective } from '../../../shared/directives/tilt.directive';
import { ScrollRevealDirective } from '../../../shared/directives/scroll-reveal.directive';

/**
 * (SRP: status emoji logic delegated to OrderStatusEmojiPipe)
 * (OCP: status advancement uses nextOrderStatus() from models — no hardcoded array here)
 */
@Component({
  selector: 'app-dashboard',
  imports: [
    CurrencyPipe, DatePipe, FormsModule,
    OrderStatusEmojiPipe,
    MatButtonModule, MatChipsModule, MatRippleModule, MatTooltipModule,
    MatFormFieldModule, MatInputModule,
    TiltDirective, ScrollRevealDirective,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  readonly orders = signal<Order[]>([]);
  readonly loading = signal(true);
  readonly filter = signal('all');
  readonly estimatedMinutes = signal(30);

  readonly filters = ['all','Pending','Accepted','Preparing','Cooking','Packed','OutForDelivery','Delivered'];

  constructor(
    private readonly orderService: OrderService,
    private readonly toast: ToastService
  ) {}

  ngOnInit(): void { this.loadOrders(); }

  loadOrders(): void {
    const status = this.filter() === 'all' ? undefined : this.filter();
    this.orderService.listForRestaurant(status).subscribe({
      next: (o) => { this.orders.set(o); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  setFilter(f: string): void {
    this.filter.set(f);
    this.loadOrders();
  }

  accept(order: Order): void {
    this.orderService.accept(order.id, { estimatedMinutes: this.estimatedMinutes() }).subscribe({
      next: () => { this.toast.success('Order accepted'); this.loadOrders(); },
      error: (err: { error?: { message?: string } }) =>
        this.toast.error(err.error?.message ?? 'Failed'),
    });
  }

  reject(order: Order): void {
    const reason = prompt('Rejection reason:');
    if (!reason) return;
    this.orderService.reject(order.id, { reason }).subscribe({
      next: () => { this.toast.success('Order rejected'); this.loadOrders(); },
      error: (err: { error?: { message?: string } }) =>
        this.toast.error(err.error?.message ?? 'Failed'),
    });
  }

  advanceStatus(order: Order): void {
    const next = nextOrderStatus(order.status);
    if (!next) return;
    this.orderService.updateStatus(order.id, { status: next }).subscribe({
      next: () => { this.toast.success(`Status → ${next}`); this.loadOrders(); },
      error: (err: { error?: { message?: string } }) =>
        this.toast.error(err.error?.message ?? 'Failed'),
    });
  }
}
