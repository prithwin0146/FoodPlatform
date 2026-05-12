import { Component, OnInit, OnDestroy, signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { interval, Subscription } from 'rxjs';
import { switchMap, startWith } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatRippleModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { OrderService } from '../../../core/services/order.service';
import { RestaurantStaffService } from '../../../core/services/restaurant-staff.service';
import { AudioService } from '../../../core/services/audio.service';
import { ToastService } from '../../../core/services/toast.service';
import { Order, nextOrderStatus, Restaurant } from '../../../core/models';
import { OrderStatusEmojiPipe } from '../../../shared/pipes/order-status.pipe';
import { SafeUrlPipe } from '../../../shared/pipes/safe-url.pipe';
import { TiltDirective } from '../../../shared/directives/tilt.directive';
import { ScrollRevealDirective } from '../../../shared/directives/scroll-reveal.directive';
import { MagneticDirective } from '../../../shared/directives/magnetic.directive';

const POLL_INTERVAL_MS = 5_000;

/**
 * Staff restaurant dashboard.
 * (SRP: polling via RxJS interval; audio via AudioService; video via RestaurantStaffService)
 * (OCP: status progression uses nextOrderStatus() — no hardcoded arrays)
 */
@Component({
  selector: 'app-dashboard',
  imports: [
    CurrencyPipe, DatePipe, FormsModule,
    OrderStatusEmojiPipe, SafeUrlPipe,
    MatButtonModule, MatChipsModule, MatRippleModule, MatTooltipModule,
    MatFormFieldModule, MatInputModule,
    TiltDirective, ScrollRevealDirective, MagneticDirective,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit, OnDestroy {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  // ── Order state
  readonly orders = signal<Order[]>([]);
  readonly loading = signal(true);
  readonly filter = signal('all');

  /** Ids already alerted — prevents re-alerting on every poll cycle. */
  private readonly _seenOrderIds = new Set<number>();

  /** Badge count of newly arrived orders since last filter-click. */
  readonly newOrderCount = signal(0);

  // ── Per-order state
  /** ETA minutes keyed by orderId. Defaults to 30 if not set. */
  readonly etaMap = signal<Record<number, number>>({});

  /** Id of order showing the inline reject form; null = none open. */
  readonly rejectingOrderId = signal<number | null>(null);
  readonly rejectReason = signal('');

  /** Action in-progress guard keyed by orderId — prevents double-clicks. */
  readonly actionInProgress = signal<Record<number, boolean>>({});

  // ── Kitchen video state
  readonly myRestaurant = signal<Restaurant | null>(null);
  readonly videoUrl = signal('');
  readonly videoSaving = signal(false);
  readonly videoSectionOpen = signal(false);

  readonly filters = ['all', 'Pending', 'Accepted', 'Preparing', 'Cooking', 'Packed', 'OutForDelivery', 'Delivered'];

  private _pollSub?: Subscription;

  constructor(
    private readonly orderService: OrderService,
    private readonly staffService: RestaurantStaffService,
    private readonly audio: AudioService,
    private readonly toast: ToastService,
    private readonly titleService: Title,
  ) {}

  ngOnInit(): void {
    this.loadRestaurant();
    this.startPolling();
  }

  ngOnDestroy(): void {
    this._pollSub?.unsubscribe();
  }

  // ── Restaurant / video

  loadRestaurant(): void {
    this.staffService.getMyRestaurant().subscribe({
      next: (r) => {
        this.myRestaurant.set(r);
        this.videoUrl.set(r.kitchenVideoUrl ?? '');
      },
    });
  }

  toggleVideoSection(): void {
    this.videoSectionOpen.set(!this.videoSectionOpen());
  }

  saveVideo(): void {
    const url = this.videoUrl().trim() || null;
    this.videoSaving.set(true);
    this.staffService.updateKitchenVideo(url).subscribe({
      next: (r) => {
        this.myRestaurant.set(r);
        this.videoUrl.set(r.kitchenVideoUrl ?? '');
        this.videoSaving.set(false);
        this.toast.success(url ? 'Kitchen video updated ✅' : 'Kitchen video cleared');
      },
      error: (err: { error?: { error?: string } }) => {
        this.toast.error(err.error?.error ?? 'Failed to save video');
        this.videoSaving.set(false);
      },
    });
  }

  clearVideo(): void {
    this.videoUrl.set('');
    this.saveVideo();
  }

  // ── Polling

  private startPolling(): void {
    this._pollSub = interval(POLL_INTERVAL_MS).pipe(
      startWith(0),
      switchMap(() => {
        const status = this.filter() === 'all' ? undefined : this.filter();
        return this.orderService.listForRestaurant(status);
      }),
    ).subscribe({
      next: (incoming) => {
        this.detectNewOrders(incoming);
        this.orders.set(incoming);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private detectNewOrders(incoming: Order[]): void {
    const newPending = incoming.filter(
      (o) => o.status === 'Pending' && !this._seenOrderIds.has(o.id),
    );
    incoming.forEach((o) => this._seenOrderIds.add(o.id));

    if (newPending.length > 0) {
      this.newOrderCount.update((n) => n + newPending.length);
      this.audio.newOrderAlert();
      if (this.isBrowser) {
        const count = this.newOrderCount();
        this.titleService.setTitle(`(${count} New) Dashboard`);
      }
    }
  }

  // ── Filter

  setFilter(f: string): void {
    this.filter.set(f);
    this.newOrderCount.set(0);
    this.titleService.setTitle('Dashboard');
    this._pollSub?.unsubscribe();
    this.startPolling();
  }

  // ── Per-order ETA

  getEta(orderId: number): number {
    return this.etaMap()[orderId] ?? 30;
  }

  setEta(orderId: number, value: number): void {
    this.etaMap.update((m) => ({ ...m, [orderId]: value }));
  }

  // ── Action guard

  private setActionInProgress(orderId: number, state: boolean): void {
    this.actionInProgress.update((m) => ({ ...m, [orderId]: state }));
  }

  isActionInProgress(orderId: number): boolean {
    return this.actionInProgress()[orderId] ?? false;
  }

  // ── Order actions

  accept(order: Order): void {
    if (this.isActionInProgress(order.id)) return;
    this.setActionInProgress(order.id, true);
    this.orderService.accept(order.id, { estimatedMinutes: this.getEta(order.id) }).subscribe({
      next: () => {
        this.toast.success('Order accepted ✅');
        this.setActionInProgress(order.id, false);
      },
      error: (err: { error?: { message?: string } }) => {
        this.toast.error(err.error?.message ?? 'Failed');
        this.setActionInProgress(order.id, false);
      },
    });
  }

  reject(order: Order): void {
    this.rejectReason.set('');
    this.rejectingOrderId.set(order.id);
  }

  confirmReject(order: Order): void {
    const reason = this.rejectReason().trim();
    if (!reason || this.isActionInProgress(order.id)) return;
    this.setActionInProgress(order.id, true);
    this.orderService.reject(order.id, { reason }).subscribe({
      next: () => {
        this.rejectingOrderId.set(null);
        this.toast.success('Order rejected');
        this.setActionInProgress(order.id, false);
      },
      error: (err: { error?: { message?: string } }) => {
        this.toast.error(err.error?.message ?? 'Failed');
        this.setActionInProgress(order.id, false);
      },
    });
  }

  cancelReject(): void {
    this.rejectingOrderId.set(null);
  }

  advanceStatus(order: Order): void {
    const next = nextOrderStatus(order.status);
    if (!next || this.isActionInProgress(order.id)) return;
    this.setActionInProgress(order.id, true);
    this.orderService.updateStatus(order.id, { status: next }).subscribe({
      next: () => {
        this.toast.success(`→ ${next}`);
        this.setActionInProgress(order.id, false);
      },
      error: (err: { error?: { message?: string } }) => {
        this.toast.error(err.error?.message ?? 'Failed');
        this.setActionInProgress(order.id, false);
      },
    });
  }

  /** Returns e.g. "Mark as Cooking" for the advance button label. */
  nextStatusLabel(order: Order): string {
    const next = nextOrderStatus(order.status);
    return next ? `Mark as ${next}` : '';
  }

  nextStatusEmoji(order: Order): string {
    const emojis: Record<string, string> = {
      Accepted: '✅', Preparing: '🔪', Cooking: '🔥',
      Packed: '📦', OutForDelivery: '🛵', Delivered: '🎉',
    };
    const next = nextOrderStatus(order.status);
    return next ? (emojis[next] ?? '→') : '';
  }
}
