import { Component, OnInit, signal, OnDestroy } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { OrderService } from '../../../core/services/order.service';
import { ToastService } from '../../../core/services/toast.service';
import { Order, OrderStatus } from '../../../core/models';

@Component({
  selector: 'app-order-tracking',
  imports: [CurrencyPipe, DatePipe, RouterLink],
  templateUrl: './order-tracking.html',
  styleUrl: './order-tracking.scss',
})
export class OrderTracking implements OnInit, OnDestroy {
  readonly order = signal<Order | null>(null);
  readonly loading = signal(true);
  private pollInterval: any;

  readonly statusSteps: OrderStatus[] = [
    'Pending', 'Accepted', 'Preparing', 'Cooking', 'Packed', 'OutForDelivery', 'Delivered',
  ];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly orderService: OrderService,
    private readonly toast: ToastService
  ) {}

  ngOnInit(): void {
    this.loadOrder();
    this.pollInterval = setInterval(() => this.loadOrder(), 10000);
  }

  ngOnDestroy(): void {
    clearInterval(this.pollInterval);
  }

  private loadOrder(): void {
    const id = +this.route.snapshot.params['id'];
    this.orderService.get(id).subscribe({
      next: (o) => { this.order.set(o); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  getStepIndex(status: OrderStatus): number {
    return this.statusSteps.indexOf(status);
  }

  isStepComplete(step: OrderStatus): boolean {
    const o = this.order();
    if (!o) return false;
    if (o.status === 'Rejected' || o.status === 'Cancelled') return false;
    return this.getStepIndex(o.status) >= this.getStepIndex(step);
  }

  isActive(step: OrderStatus): boolean {
    return this.order()?.status === step;
  }

  getStatusEmoji(status: OrderStatus): string {
    const map: Record<string, string> = {
      Pending: '⏳', Accepted: '✅', Preparing: '👨‍🍳', Cooking: '🔥',
      Packed: '📦', OutForDelivery: '🚴', Delivered: '🎉',
      Rejected: '❌', Cancelled: '🚫',
    };
    return map[status] ?? '📋';
  }

  getStatusLabel(status: string): string {
    return status.replace(/([A-Z])/g, ' $1').trim();
  }

  cancelOrder(): void {
    const o = this.order();
    if (!o) return;
    this.orderService.cancel(o.id).subscribe({
      next: () => {
        this.toast.success('Order cancelled');
        this.loadOrder();
      },
      error: (err) => this.toast.error(err.error?.message ?? 'Cannot cancel'),
    });
  }

  canCancel(): boolean {
    const o = this.order();
    if (!o) return false;
    return new Date(o.cancellableUntil) > new Date() && o.status === 'Pending';
  }
}
