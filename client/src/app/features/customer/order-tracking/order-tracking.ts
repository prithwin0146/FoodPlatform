import { Component, OnInit, signal, computed, OnDestroy } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { Subscription, interval } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatRippleModule } from '@angular/material/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ToastService } from '../../../core/services/toast.service';
import { OrderService } from '../../../core/services/order.service';
import { OrderPollingService } from '../../../core/services/order-polling.service';
import { ReviewService } from '../../../core/services/review.service';
import { Order, ORDER_STATUS_FLOW, OrderStatus, Review } from '../../../core/models';
import { OrderStatusEmojiPipe, OrderStatusLabelPipe } from '../../../shared/pipes/order-status.pipe';
import { SafeUrlPipe } from '../../../shared/pipes/safe-url.pipe';
import { ScrollRevealDirective } from '../../../shared/directives/scroll-reveal.directive';
import { TiltDirective } from '../../../shared/directives/tilt.directive';
import { MagneticDirective } from '../../../shared/directives/magnetic.directive';
import { ReviewWidget } from '../../../shared/components/review-widget/review-widget';
import { CancelCountdownPipe } from '../../../shared/pipes/cancel-countdown.pipe';
import { LiveStreamPlayer } from '../../../shared/components/live-stream-player/live-stream-player';

/**
 * (SRP: polling logic extracted to OrderPollingService)
 * (SRP: status emoji/label logic extracted to pipes)
 * (OCP: ORDER_STATUS_FLOW is shared — no hardcoded array here)
 */
@Component({
  selector: 'app-order-tracking',
  imports: [
    CurrencyPipe, DatePipe, RouterLink,
    FormsModule, MatFormFieldModule, MatInputModule,
    OrderStatusEmojiPipe, OrderStatusLabelPipe, SafeUrlPipe,
    MatButtonModule, MatProgressBarModule, MatChipsModule, MatRippleModule,
    ScrollRevealDirective, TiltDirective, MagneticDirective,
    ReviewWidget,
    CancelCountdownPipe,
    LiveStreamPlayer,
  ],
  templateUrl: './order-tracking.html',
  styleUrl: './order-tracking.scss',
  providers: [OrderPollingService],
})
export class OrderTracking implements OnInit, OnDestroy {
  readonly order = signal<Order | null>(null);
  readonly loading = signal(true);
  readonly statusSteps = ORDER_STATUS_FLOW;
  /** Populated once we confirm the current customer already reviewed this order. */
  readonly existingReview = signal<Review | null>(null);
  /** Fresh Angelcam HLS URL fetched from the backend. Null = no stream / not yet loaded. */
  readonly liveStreamUrl = signal<string | null>(null);

  private _pollSub?: Subscription;
  private _tickSub?: Subscription;

  /** Ticks every second so cancelCountdown recomputes. */
  private readonly _tick = signal(0);

  /** Remaining seconds in the cancellation window, or 0 if expired/not applicable. */
  readonly cancelCountdown = computed(() => {
    this._tick(); // reactive dependency — re-evaluates every second
    const o = this.order();
    if (!o || o.status !== 'Pending') return 0;
    return Math.max(0, Math.floor((new Date(o.cancellableUntil).getTime() - Date.now()) / 1000));
  });

  /**
   * Live countdown (in seconds) to the estimated delivery time.
   * Returns null once ETA has passed or if not yet set.
   * (OCP: reuses the same _tick signal as cancelCountdown — no new interval needed)
   */
  readonly etaCountdown = computed(() => {
    this._tick();
    const o = this.order();
    if (!o?.estimatedDeliveryTime) return null;
    const secsLeft = Math.floor((new Date(o.estimatedDeliveryTime).getTime() - Date.now()) / 1000);
    return secsLeft > 0 ? secsLeft : 0;
  });

  constructor(
    private readonly route: ActivatedRoute,
    private readonly orderService: OrderService,
    private readonly polling: OrderPollingService,
    private readonly reviewService: ReviewService,
    private readonly toast: ToastService
  ) {}

  private static readonly TERMINAL_STATUSES: OrderStatus[] = ['Delivered', 'Rejected', 'Cancelled'];

  ngOnInit(): void {
    const id = +this.route.snapshot.params['id'];
    this._tickSub = interval(1000).subscribe(() => this._tick.update(n => n + 1));

    this._pollSub = this.polling.poll(id).subscribe({
      next: (o) => {
        this.order.set(o);
        this.loading.set(false);
        if (OrderTracking.TERMINAL_STATUSES.includes(o.status)) {
          this._pollSub?.unsubscribe();
        }
        // Fetch a fresh Angelcam HLS URL once we know the order has a camera configured
        if (o.liveStreamPlaybackId && this.liveStreamUrl() === null) {
          this.orderService.getLiveStreamUrl(id).subscribe({
            next: (res) => this.liveStreamUrl.set(res.hlsUrl),
            error: () => this.liveStreamUrl.set(''),  // empty string = no stream available
          });
        }
        // Load any existing review when order is delivered
        if (o.status === 'Delivered') {
          this.reviewService.getMyReview(o.id).subscribe({
            next: (r) => this.existingReview.set(r),
            error: () => { /* 404 = no review yet, leave existingReview null */ },
          });
        }
      },
      error: () => this.loading.set(false),
    });
  }

  ngOnDestroy(): void {
    this._pollSub?.unsubscribe();
    this._tickSub?.unsubscribe();
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

  // ── Dispute ──
  readonly disputeNotes = signal('');
  readonly disputeOpen = signal(false);
  readonly disputeSubmitting = signal(false);

  canDispute(): boolean {
    const o = this.order();
    if (!o || o.status !== 'Delivered') return false;
    if (o.disputeStatus && o.disputeStatus !== 'None') return false;
    if (o.deliveredAt) {
      const hours = (Date.now() - new Date(o.deliveredAt).getTime()) / 3_600_000;
      if (hours > 48) return false;
    }
    return true;
  }

  submitDispute(): void {
    const o = this.order();
    if (!o || !this.disputeNotes().trim()) return;
    this.disputeSubmitting.set(true);
    this.orderService.dispute(o.id, { notes: this.disputeNotes() }).subscribe({
      next: () => {
        this.toast.success('Dispute raised — our team will be in touch within 24 hours.');
        this.disputeOpen.set(false);
        this.disputeNotes.set('');
        // Refresh order state to reflect disputeStatus = Open
        this.orderService.get(o.id).subscribe({ next: (updated) => this.order.set(updated) });
      },
      error: (err: { error?: { error?: string } }) => {
        this.toast.error(err.error?.error ?? 'Could not raise dispute');
        this.disputeSubmitting.set(false);
      },
    });
  }
}
