import { Component, OnInit, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { AdminService } from '../../../core/services/admin.service';
import { ToastService } from '../../../core/services/toast.service';
import { Order, Restaurant } from '../../../core/models';

@Component({
  selector: 'app-admin-panel',
  imports: [CurrencyPipe, DatePipe],
  templateUrl: './admin-panel.html',
  styleUrl: './admin-panel.scss',
})
export class AdminPanel implements OnInit {
  readonly tab = signal<'orders' | 'disputes' | 'restaurants'>('orders');
  readonly orders = signal<Order[]>([]);
  readonly disputes = signal<Order[]>([]);
  readonly restaurants = signal<Restaurant[]>([]);
  readonly loading = signal(true);

  constructor(
    private readonly admin: AdminService,
    private readonly toast: ToastService
  ) {}

  ngOnInit(): void { this.loadAll(); }

  loadAll(): void {
    this.admin.allOrders().subscribe({ next: (o) => this.orders.set(o) });
    this.admin.disputedOrders().subscribe({ next: (o) => this.disputes.set(o) });
    this.admin.allRestaurants().subscribe({
      next: (r) => { this.restaurants.set(r); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  setTab(t: 'orders' | 'disputes' | 'restaurants'): void { this.tab.set(t); }

  toggleRestaurant(id: number): void {
    this.admin.toggleActive(id).subscribe({
      next: () => { this.toast.success('Restaurant toggled'); this.loadAll(); },
      error: (err) => this.toast.error(err.error?.message ?? 'Failed'),
    });
  }

  refund(orderId: number): void {
    this.admin.refund(orderId).subscribe({
      next: () => { this.toast.success('Refund issued'); this.loadAll(); },
      error: (err) => this.toast.error(err.error?.message ?? 'Failed'),
    });
  }
}
