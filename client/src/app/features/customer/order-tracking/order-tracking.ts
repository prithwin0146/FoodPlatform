import { Component, OnInit, signal, computed, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe, LowerCasePipe } from '@angular/common';
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
import { OrderNotificationService } from '../../../core/services/order-notification.service';
import { ReviewService } from '../../../core/services/review.service';
import { OrderHubService } from '../../../core/services/order-hub.service';
import { Order, ORDER_STATUS_FLOW, OrderStatus, Review } from '../../../core/models';
import { OrderStatusLabelPipe } from '../../../shared/pipes/order-status.pipe';
import { SafeUrlPipe } from '../../../shared/pipes/safe-url.pipe';
import { ScrollRevealDirective } from '../../../shared/directives/scroll-reveal.directive';
import { MagneticDirective } from '../../../shared/directives/magnetic.directive';
import { ReviewWidget } from '../../../shared/components/review-widget/review-widget';
import { CancelCountdownPipe } from '../../../shared/pipes/cancel-countdown.pipe';
import { EtaCountdownPipe } from '../../../shared/pipes/eta-countdown.pipe';
import { LiveStreamPlayer } from '../../../shared/components/live-stream-player/live-stream-player';

/**
 * (SRP: polling logic extracted to OrderPollingService)
 * (SRP: status emoji/label logic extracted to pipes)
 * (OCP: ORDER_STATUS_FLOW is shared — no hardcoded array here)
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-order-tracking',
  imports: [
    CurrencyPipe, DatePipe, LowerCasePipe, RouterLink,
    FormsModule, MatFormFieldModule, MatInputModule,
    OrderStatusLabelPipe, SafeUrlPipe,
    MatButtonModule, MatProgressBarModule, MatChipsModule, MatRippleModule,
    ScrollRevealDirective, MagneticDirective,
    ReviewWidget,
    CancelCountdownPipe,
    EtaCountdownPipe,
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

  /**
   * 0→100 progress along the prep window (createdAt → estimatedDeliveryTime).
   * Drives the gradient progress bar overlaid on the camera feed.
   * (SRP: pure time calculation — no side effects)
   */
  readonly prepProgress = computed(() => {
    this._tick();
    const o = this.order();
    if (!o?.estimatedDeliveryTime || !o.createdAt) return 0;
    const start = new Date(o.createdAt).getTime();
    const end   = new Date(o.estimatedDeliveryTime).getTime();
    if (end <= start) return 0;
    return Math.min(100, Math.max(0, ((Date.now() - start) / (end - start)) * 100));
  });

  /** Emoji representing each order status step in the stepper. */
  stepEmoji(step: OrderStatus): string {
    const map: Partial<Record<OrderStatus, string>> = {
      Pending:        '⏳',
      Accepted:       '✅',
      Preparing:      '🔪',
      Cooking:        '🍳',
      Packed:         '📦',
      OutForDelivery: '🛵',
      Delivered:      '🎉',
    };
    return map[step] ?? '•';
  }

  private _pollSub?: Subscription;
  private _tickSub?: Subscription;
  private _hubSub?: Subscription;

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

  /** True only when order is actually out for delivery AND ETA has arrived. */
  readonly isArrivingNow = computed(() => {
    const o = this.order();
    return o?.status === 'OutForDelivery' && this.etaCountdown() === 0;
  });

  /** True when ETA has passed but order is NOT yet out for delivery (prep running late). */
  readonly isEtaPassedNotDelivering = computed(() => {
    const o = this.order();
    return !!o?.estimatedDeliveryTime && this.etaCountdown() === 0 && o.status !== 'OutForDelivery' && o.status !== 'Delivered';
  });

  /** Last-seen status — used to detect transitions and fire notifications. */
  private _lastStatus: string | null = null;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly orderService: OrderService,
    private readonly polling: OrderPollingService,
    private readonly reviewService: ReviewService,
    private readonly toast: ToastService,
    private readonly notifications: OrderNotificationService,
    private readonly hub: OrderHubService,
  ) {}

  private static readonly TERMINAL_STATUSES: OrderStatus[] = ['Delivered', 'Rejected', 'Cancelled'];
  /** Statuses during which the kitchen stream is visible. Stops at OutForDelivery — food has left. */
  private static readonly LIVE_STATUSES = new Set<OrderStatus>(['Accepted', 'Preparing', 'Cooking', 'Packed']);

  readonly shouldShowStream = computed(() => {
    const o = this.order();
    return !!o && OrderTracking.LIVE_STATUSES.has(o.status) && !!o.angelcamCameraId;
  });

  ngOnInit(): void {
    const hash = this.route.snapshot.params['id'] as string;
    this._tickSub = interval(1000).subscribe(() => this._tick.update(n => n + 1));
    this.notifications.requestPermission();

    // Phase 4: connect to SignalR and subscribe to instant status updates.
    // The polling subscription below acts as a fallback if SignalR is unavailable.
    void this.hub.connect().then(() => void this.hub.joinOrderGroup(hash));
    this._hubSub = this.hub.orderStatusChanged$.subscribe((payload) => {
      if (payload.hashId !== hash) return;
      // Re-fetch full order from API to get latest state (avoids partial DTO reconstruction)
      this.orderService.get(hash).subscribe({
        next: (o) => {
          if (this._lastStatus !== null && this._lastStatus !== o.status)
            this._onStatusChange(o.restaurantName, o.status);
          this._lastStatus = o.status;
          this.order.set(o);
          if (OrderTracking.TERMINAL_STATUSES.includes(o.status)) {
            this._pollSub?.unsubscribe();
            this._tickSub?.unsubscribe();
          }
          if (o.status === 'Delivered') {
            this.reviewService.getMyReview(o.hashId).subscribe({
              next: (r) => this.existingReview.set(r),
              error: () => {},
            });
          }
        },
      });
    });

    this._pollSub = this.polling.poll(hash).subscribe({
      next: (o) => {
        // Detect status transition and fire toast + browser notification
        if (this._lastStatus !== null && this._lastStatus !== o.status) {
          this._onStatusChange(o.restaurantName, o.status);
        }
        this._lastStatus = o.status;

        this.order.set(o);
        this.loading.set(false);
        if (OrderTracking.TERMINAL_STATUSES.includes(o.status)) {
          this._pollSub?.unsubscribe();
          this._tickSub?.unsubscribe(); // countdown no longer needed
        }
        // Fetch a fresh Angelcam HLS URL once we know the order has a camera configured
        // and the order is in the active cooking window (Accepted → Packed).
        // !liveStreamUrl covers null (never fetched) AND '' (previous attempt failed),
        // so a camera that wasn't online when the order was accepted is retried each poll.
        if (o.angelcamCameraId && OrderTracking.LIVE_STATUSES.has(o.status) && !this.liveStreamUrl()) {
          this.orderService.getLiveStreamUrl(hash).subscribe({
            next: (res) => this.liveStreamUrl.set(res.hlsUrl),
            error: () => this.liveStreamUrl.set(''),  // empty string = no stream available
          });
        }
        // Load any existing review when order is delivered
        if (o.status === 'Delivered') {
          this.reviewService.getMyReview(o.hashId).subscribe({
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
    this._hubSub?.unsubscribe();
    const hash = this.route.snapshot.params['id'] as string;
    void this.hub.leaveOrderGroup(hash);
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

  /** Material Symbols icon name for the current status card. */
  statusNowIcon(status: OrderStatus): string {
    const map: Partial<Record<OrderStatus, string>> = {
      Pending:        'hourglass_empty',
      Accepted:       'check_circle',
      Preparing:      'restaurant',
      Cooking:        'local_fire_department',
      Packed:         'inventory_2',
      OutForDelivery: 'delivery_dining',
      Delivered:      'done_all',
      Rejected:       'block',
      Cancelled:      'cancel',
    };
    return map[status] ?? 'info';
  }

  /** Whether the order has reached a terminal status. */
  isTerminalStatus(): boolean {
    const o = this.order();
    if (!o) return false;
    return OrderTracking.TERMINAL_STATUSES.includes(o.status);
  }

  /** Short label displayed above the status title. */
  statusNowLabel(status: OrderStatus): string {
    const map: Partial<Record<OrderStatus, string>> = {
      Pending:        'Awaiting confirmation',
      Accepted:       'Order accepted',
      Preparing:      'Preparation started',
      Cooking:        'Cooking now',
      Packed:         'Packed & ready',
      OutForDelivery: 'Out for delivery',
      Delivered:      'Delivered',
      Rejected:       'Rejected',
      Cancelled:      'Cancelled',
    };
    return map[status] ?? status;
  }

  /** Main status title. */
  statusNowTitle(status: OrderStatus): string {
    const map: Partial<Record<OrderStatus, string>> = {
      Pending:        "We're confirming your order",
      Accepted:       "Great news — the kitchen is ready",
      Preparing:      'The kitchen is prepping your meal',
      Cooking:        "It's on the stove right now",
      Packed:         'Boxed up and waiting to move',
      OutForDelivery: 'Your driver has the food',
      Delivered:      'Enjoy your meal!',
      Rejected:       'Order could not be accepted',
      Cancelled:      'Order cancelled',
    };
    return map[status] ?? status;
  }

  /** Longer description for the current status. */
  statusNowDescription(o: Order): string {
    const map: Partial<Record<OrderStatus, string>> = {
      Pending:        'The restaurant is reviewing your order.',
      Accepted:       'Prep starts shortly — watch the kitchen live.',
      Preparing:      'The chef is gathering ingredients and prepping.',
      Cooking:        'Your food is being cooked to order — watch it happen.',
      Packed:         'Sealed and ready for its courier.',
      OutForDelivery: 'On the move. ETA is updated in real time.',
      Delivered:      'Your order is complete. Enjoy every bite.',
      Rejected:       'The restaurant could not fulfil this order.',
      Cancelled:      'This order has been cancelled.',
    };
    return map[o.status] ?? '';
  }

  /** Fun kitchen quote shown beneath the camera feed. */
  kitchenQuote(status: OrderStatus): string {
    const quotes: Partial<Record<OrderStatus, string>> = {
      Pending:        'Good things come to those who wait.',
      Accepted:       "Let's get cooking!",
      Preparing:      'Mise en place is everything.',
      Cooking:        'The secret ingredient is always love.',
      Packed:         'Handled with care.',
      OutForDelivery: 'Hot and on the move.',
      Delivered:      'Bon appétit!',
      Rejected:       'Sometimes it just isn\'t meant to be.',
      Cancelled:      'There will be other meals.',
    };
    return quotes[status] ?? '';
  }

  /** Time label for a timeline step (uses order timestamps when available). */
  journeyStepTime(step: OrderStatus): string {
    const o = this.order();
    if (!o) return '';
    // Map steps to rough timestamps; in a real app these would come from backend audit logs.
    if (o.status === step) {
      return 'Now';
    }
    if (this.isStepComplete(step)) {
      return 'Completed';
    }
    return '';
  }

  /**
   * Called when the LiveStreamPlayer emits (streamOffline) due to a fatal HLS error.
   * Resets the cached URL to null so the next poll cycle re-fetches a fresh Angelcam URL
   * from the backend — handles the case where the embedded token has expired mid-session.
   */
  onStreamOffline(): void {
    this.liveStreamUrl.set(null);
  }

  /**
   * Fires a toast + browser notification when the order status changes mid-poll.
   * (SRP: notification message logic delegated to OrderNotificationService)
   */
  private _onStatusChange(restaurantName: string, newStatus: string): void {
    const messages: Partial<Record<string, string>> = {
      Accepted:       `✅ ${restaurantName} accepted your order!`,
      Preparing:      `🔪 Prep has started`,
      Cooking:        `🍳 It's cooking — live feed is active!`,
      Packed:         `📦 Your order is packed and ready`,
      OutForDelivery: `🛵 On its way to you!`,
      Delivered:      `🎉 Delivered — enjoy your meal!`,
      Rejected:       `❌ ${restaurantName} couldn't accept your order`,
      Cancelled:      `🚫 Your order has been cancelled`,
    };
    const msg = messages[newStatus];
    if (msg) this.toast.info(msg);
    this.notifications.notify(restaurantName, newStatus as OrderStatus);
  }

  cancelOrder(): void {
    const o = this.order();
    if (!o) return;
    this.orderService.cancel(o.hashId).subscribe({
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
    this.orderService.dispute(o.hashId, { notes: this.disputeNotes() }).subscribe({
      next: () => {
        this.toast.success('Dispute raised — our team will be in touch within 24 hours.');
        this.disputeOpen.set(false);
        this.disputeNotes.set('');
        // Refresh order state to reflect disputeStatus = Open
        this.orderService.get(o.hashId).subscribe({ next: (updated) => this.order.set(updated) });
      },
      error: (err: { error?: { error?: string } }) => {
        this.toast.error(err.error?.error ?? 'Could not raise dispute');
        this.disputeSubmitting.set(false);
      },
    });
  }
}
