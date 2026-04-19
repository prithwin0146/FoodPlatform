import { Component, OnInit, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../../core/services/order.service';
import { ToastService } from '../../../core/services/toast.service';
import { Order } from '../../../core/models';

@Component({
  selector: 'app-dashboard',
  imports: [CurrencyPipe, DatePipe, FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  readonly orders = signal<Order[]>([]);
  readonly loading = signal(true);
  readonly filter = signal('all');
  readonly estimatedMinutes = signal(30);

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
      error: (err) => this.toast.error(err.error?.message ?? 'Failed'),
    });
  }

  reject(order: Order): void {
    const reason = prompt('Rejection reason:');
    if (!reason) return;
    this.orderService.reject(order.id, { reason }).subscribe({
      next: () => { this.toast.success('Order rejected'); this.loadOrders(); },
      error: (err) => this.toast.error(err.error?.message ?? 'Failed'),
    });
  }

  advanceStatus(order: Order): void {
    const statusFlow = ['Accepted', 'Preparing', 'Cooking', 'Packed', 'OutForDelivery', 'Delivered'];
    const idx = statusFlow.indexOf(order.status);
    if (idx < 0 || idx >= statusFlow.length - 1) return;
    const nextStatus = statusFlow[idx + 1];
    this.orderService.updateStatus(order.id, { status: nextStatus }).subscribe({
      next: () => { this.toast.success(`Status → ${nextStatus}`); this.loadOrders(); },
      error: (err) => this.toast.error(err.error?.message ?? 'Failed'),
    });
  }

  getStatusEmoji(status: string): string {
    const map: Record<string, string> = {
      Pending: '⏳', Accepted: '✅', Preparing: '👨‍🍳', Cooking: '🔥',
      Packed: '📦', OutForDelivery: '🚴', Delivered: '🎉', Rejected: '❌', Cancelled: '🚫',
    };
    return map[status] ?? '📋';
  }
}
