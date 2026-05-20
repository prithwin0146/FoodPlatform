import { Component, OnInit, computed, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { MatButtonModule } from '@angular/material/button';
import { MatRippleModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { OrderService } from '../../../core/services/order.service';
import { IdempotencyKeyService } from '../../../core/services/idempotency-key.service';
import { Order, PaginatedResult } from '../../../core/models';
import { OrderStatusEmojiPipe, OrderStatusLabelPipe } from '../../../shared/pipes/order-status.pipe';
import { ScrollRevealDirective } from '../../../shared/directives/scroll-reveal.directive';
import { TiltDirective } from '../../../shared/directives/tilt.directive';

/**
 * Displays all orders placed by the current customer.
 * (SRP: data loading via OrderService; status display via pipes)
 * (OCP: new statuses automatically appear via OrderStatusEmojiPipe)
 */
@Component({
  selector: 'app-my-orders',
  imports: [
    CurrencyPipe, DatePipe, RouterLink, FormsModule,
    OrderStatusEmojiPipe, OrderStatusLabelPipe,
    MatButtonModule, MatRippleModule, MatTooltipModule,
    MatFormFieldModule, MatInputModule,
    ScrollRevealDirective, TiltDirective,
  ],
  templateUrl: './my-orders.html',
  styleUrl: './my-orders.scss',
})
export class MyOrders implements OnInit {
  readonly orders = signal<Order[]>([]);
  readonly loading = signal(true);
  readonly activeFilter = signal<'all' | 'active' | 'past'>('all');
  readonly restaurantSearch = signal('');

  // Pagination
  readonly currentPage = signal(1);
  readonly totalPages = signal(1);
  readonly totalCount = signal(0);
  readonly hasNextPage = signal(false);
  readonly hasPrevPage = computed(() => this.currentPage() > 1);
  readonly PAGE_SIZE = 10;

  readonly filteredOrders = computed(() => {
    const f = this.activeFilter();
    const q = this.restaurantSearch().toLowerCase().trim();
    let result = this.orders();
    if (f === 'active') result = result.filter(o => this.isActive(o));
    if (f === 'past')   result = result.filter(o => !this.isActive(o));
    if (q) result = result.filter(o => o.restaurantName.toLowerCase().includes(q));
    return result;
  });

  constructor(
    private readonly orderService: OrderService,
    private readonly idempotencyKey: IdempotencyKeyService,
    private readonly router: Router,
    title: Title
  ) {
    title.setTitle('My Orders | SeeThePrep');
  }

  ngOnInit(): void {
    this.loadPage(1);
  }

  loadPage(page: number): void {
    this.loading.set(true);
    this.orderService.listMyOrdersPaged(page, this.PAGE_SIZE).subscribe({
      next: (result: PaginatedResult<Order>) => {
        this.orders.set(result.items);
        this.currentPage.set(result.page);
        this.totalPages.set(result.totalPages);
        this.totalCount.set(result.totalCount);
        this.hasNextPage.set(result.hasNextPage);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  nextPage(): void { this.loadPage(this.currentPage() + 1); }
  prevPage(): void { this.loadPage(this.currentPage() - 1); }

  /** True while an order is still in the active pipeline. */
  isActive(order: Order): boolean {
    return !['Delivered', 'Rejected', 'Cancelled'].includes(order.status);
  }

  readonly reorderingId = signal<number | null>(null);

  reorder(order: Order): void {
    if (this.reorderingId() !== null) return;
    this.reorderingId.set(order.id);
    this.orderService.reorder(order.hashId, this.idempotencyKey.generate()).subscribe({
      next: (newOrder) => {
        this.reorderingId.set(null);
        this.router.navigate(['/order-tracking', newOrder.hashId]);
      },
      error: () => this.reorderingId.set(null),
    });
  }
}
