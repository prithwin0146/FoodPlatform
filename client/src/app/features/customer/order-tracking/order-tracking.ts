import { Component, OnInit, signal, OnDestroy } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { Subscription } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatRippleModule } from '@angular/material/core';
import { ToastService } from '../../../core/services/toast.service';
import { OrderService } from '../../../core/services/order.service';
import { OrderPollingService } from '../../../core/services/order-polling.service';
import { Order, ORDER_STATUS_FLOW, OrderStatus } from '../../../core/models';
import { OrderStatusEmojiPipe, OrderStatusLabelPipe } from '../../../shared/pipes/order-status.pipe';
import { ScrollRevealDirective } from '../../../shared/directives/scroll-reveal.directive';

/**
 * (SRP: polling logic extracted to OrderPollingService)
 * (SRP: status emoji/label logic extracted to pipes)
 * (OCP: ORDER_STATUS_FLOW is shared — no hardcoded array here)
 */
@Component({
  selector: 'app-order-tracking',
  imports: [
    CurrencyPipe, DatePipe, RouterLink,
    OrderStatusEmojiPipe, OrderStatusLabelPipe,
    MatButtonModule, MatProgressBarModule, MatChipsModule, MatRippleModule,
    ScrollRevealDirective,
  ],
  templateUrl: './order-tracking.html',
  styleUrl: './order-tracking.scss',
  providers: [OrderPollingService],
})
export class OrderTracking implements OnInit, OnDestroy {
  readonly order = signal<Order | null>(null);
  readonly loading = signal(true);
  readonly statusSteps = ORDER_STATUS_FLOW;

  private _pollSub?: Subscription;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly orderService: OrderService,
    private readonly polling: OrderPollingService,
    private readonly toast: ToastService
  ) {}

  ngOnInit(): void {
    const id = +this.route.snapshot.params['id'];
    this._pollSub = this.polling.poll(id).subscribe({
      next: (o) => { this.order.set(o); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  ngOnDestroy(): void {
    this._pollSub?.unsubscribe();
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

  get progressValue(): number {
    const o = this.order();
    if (!o) return 0;
    const idx = this.getStepIndex(o.status as OrderStatus);
    return idx < 0 ? 0 : Math.round((idx / (this.statusSteps.length - 1)) * 100);
  }

  cancelOrder(): void {
    const o = this.order();
    if (!o) return;
    this.orderService.cancel(o.id).subscribe({
      next: () => this.toast.success('Order cancelled'),
      error: (err: { error?: { message?: string } }) =>
        this.toast.error(err.error?.message ?? 'Cannot cancel'),
    });
  }

  canCancel(): boolean {
    const o = this.order();
    if (!o) return false;
    return new Date(o.cancellableUntil) > new Date() && o.status === 'Pending';
  }
}
