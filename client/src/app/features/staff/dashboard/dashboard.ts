import { Component, OnInit, OnDestroy, signal, computed, inject, PLATFORM_ID, ChangeDetectionStrategy } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { interval, Subscription } from 'rxjs';
import { switchMap, startWith } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatRippleModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { OrderService } from '../../../core/services/order.service';
import { RestaurantStaffService, StaffCreateCategoryPayload, StaffCreateItemPayload, StaffUpdateItemPayload } from '../../../core/services/restaurant-staff.service';
import { RestaurantService } from '../../../core/services/restaurant.service';
import { AudioService } from '../../../core/services/audio.service';
import { ToastService } from '../../../core/services/toast.service';
import { RestaurantPromotionService } from '../../../core/services/restaurant-promotion.service';
import { MenuCategory, Order, nextOrderStatus, Restaurant, RestaurantHours, RestaurantPromotion, CreateRestaurantPromotionRequest } from '../../../core/models';
import { SafeUrlPipe } from '../../../shared/pipes/safe-url.pipe';
import { OrderStatusLabelPipe } from '../../../shared/pipes/order-status.pipe';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CurrencyPipe, DatePipe, DecimalPipe, FormsModule,
    SafeUrlPipe, OrderStatusLabelPipe,
    MatButtonModule, MatChipsModule, MatRippleModule, MatTooltipModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatSlideToggleModule,
    ScrollRevealDirective, MagneticDirective,
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
  /** Whether the open/closed toggle HTTP call is in-flight. */
  readonly activeToggling = signal(false);

  // ── Live stream state (Mux HLS)
  readonly liveStreamSectionOpen = signal(false);
  readonly angelcamCameraId = signal('');
  readonly liveStreamSaving = signal(false);

  // ── Hours panel state
  readonly hoursSectionOpen = signal(false);
  readonly hoursForm = signal<HoursFormRow[]>([]);
  readonly hoursSaving = signal(false);

  // ── Menu item availability state
  readonly menuSectionOpen = signal(false);
  readonly menuCategories = signal<MenuCategory[]>([]);
  readonly menuLoading = signal(false);
  readonly togglingItemId = signal<number | null>(null);
  readonly deletingItemId = signal<number | null>(null);

  // ── Menu CRUD form state
  readonly catFormOpen = signal(false);
  newCatName = '';
  newCatSort = 0;
  readonly itemFormCatId = signal<number | null>(null);
  readonly editingItemId = signal<number | null>(null);
  readonly savingItem = signal(false);
  itemForm: StaffItemForm = this.blankItemForm();

  /** Flat list of all items across categories for quick rendering. */
  readonly allMenuItems = computed(() =>
    this.menuCategories().flatMap(c => c.items.map(i => ({ ...i, categoryName: c.name }))));

  /** Count of orders with an open dispute — drives the warning banner. */
  readonly disputedCount = computed(() =>
    this.orders().filter(o => o.disputeStatus === 'Open').length);

  /** Count of orders still in Pending status — drives the badge. */
  readonly pendingCount = computed(() =>
    this.orders().filter(o => o.status === 'Pending').length);

  /** Count of orders placed today (UTC day boundary). */
  readonly todayOrders = computed(() => {
    const today = new Date().toDateString();
    return this.orders().filter(o => new Date(o.createdAt).toDateString() === today).length;
  });

  /** Revenue from today's non-cancelled/rejected orders. */
  readonly todayRevenue = computed(() => {
    const today = new Date().toDateString();
    return this.orders()
      .filter(o => new Date(o.createdAt).toDateString() === today
                && o.status !== 'Cancelled' && o.status !== 'Rejected')
      .reduce((sum, o) => sum + o.totalAmount, 0);
  });

  // ── Promotions state
  readonly promotionsSectionOpen = signal(false);
  readonly promotions = signal<RestaurantPromotion[]>([]);
  readonly promotionsLoading = signal(false);
  readonly promotionSaving = signal(false);
  promoForm: CreateRestaurantPromotionRequest & { startsAtStr: string; endsAtStr: string } = {
    title: '', description: '', discountType: 'PercentageOff', discountValue: 10,
    appliesToCategoryId: null, isActive: true, startsAtStr: '', endsAtStr: '',
    startsAt: new Date().toISOString(), endsAt: new Date(Date.now() + 7 * 86400_000).toISOString(),
  };

  readonly filters = ['all', 'Pending', 'Accepted', 'Preparing', 'Cooking', 'Packed', 'OutForDelivery', 'Delivered'];

  private _pollSub?: Subscription;

  constructor(
    private readonly orderService: OrderService,
    private readonly staffService: RestaurantStaffService,
    private readonly restaurantService: RestaurantService,
    private readonly audio: AudioService,
    private readonly toast: ToastService,
    private readonly titleService: Title,
    private readonly promotionService: RestaurantPromotionService,
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
        this.angelcamCameraId.set(r.angelcamCameraId ?? '');
        this.initHoursForm(r);
      },
    });
  }

  /** Seed the hours form with current data or sensible defaults (9–17, Mon–Fri open, Sat–Sun closed). */
  private initHoursForm(r: Restaurant): void {
    const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const existingHours: RestaurantHours[] = (r as any).hours ?? [];
    const rows: HoursFormRow[] = Array.from({ length: 7 }, (_, i) => {
      const existing = existingHours.find(h => h.dayOfWeek === i);
      return {
        dayOfWeek: i,
        dayName: DAY_NAMES[i],
        openTime: existing ? existing.openTime.substring(0, 5) : '09:00',
        closeTime: existing ? existing.closeTime.substring(0, 5) : '17:00',
        isClosed: existing ? existing.isClosed : (i === 0 || i === 6),
      };
    });
    this.hoursForm.set(rows);
  }

  toggleVideoSection(): void {
    this.videoSectionOpen.set(!this.videoSectionOpen());
  }

  toggleLiveStreamSection(): void {
    this.liveStreamSectionOpen.set(!this.liveStreamSectionOpen());
  }

  goLive(): void {
    const id = this.angelcamCameraId().trim() || null;
    this.liveStreamSaving.set(true);
    this.staffService.updateLiveStream(id).subscribe({
      next: (r) => {
        this.myRestaurant.set(r);
        this.angelcamCameraId.set(r.angelcamCameraId ?? '');
        this.liveStreamSaving.set(false);
        this.toast.success(id ? '🔴 Stream is now LIVE! Customers can watch.' : 'Stream stopped.');
      },
      error: () => {
        this.liveStreamSaving.set(false);
        this.toast.error('Failed to update stream');
      },
    });
  }

  stopStream(): void {
    this.angelcamCameraId.set('');
    this.goLive();
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

  toggleActive(): void {
    const r = this.myRestaurant();
    if (!r || this.activeToggling()) return;
    const next = !r.isActive;
    this.activeToggling.set(true);
    this.staffService.setActive(next).subscribe({
      next: (updated) => {
        this.myRestaurant.set(updated);
        this.activeToggling.set(false);
        this.toast.success(next ? 'Restaurant is now Open 🟢' : 'Restaurant is now Closed 🔴');
      },
      error: () => {
        this.activeToggling.set(false);
        this.toast.error('Failed to update status');
      },
    });
  }

  /** Closes all management panels — used by the sidebar "Orders" nav item. */
  closeAllPanels(): void {
    this.videoSectionOpen.set(false);
    this.liveStreamSectionOpen.set(false);
    this.hoursSectionOpen.set(false);
    this.menuSectionOpen.set(false);
  }

  /** Returns true when no management panel is open (i.e. "Orders" view is active). */
  readonly isOrdersActive = computed(() =>
    !this.videoSectionOpen() && !this.liveStreamSectionOpen()
    && !this.hoursSectionOpen() && !this.menuSectionOpen());

  // ── Hours panel

  toggleHoursSection(): void {
    this.hoursSectionOpen.set(!this.hoursSectionOpen());
  }

  updateHoursRow(index: number, patch: Partial<HoursFormRow>): void {
    this.hoursForm.update(rows => {
      const updated = [...rows];
      updated[index] = { ...updated[index], ...patch };
      return updated;
    });
  }

  saveHours(): void {
    if (this.hoursSaving()) return;
    this.hoursSaving.set(true);
    const payload = this.hoursForm().map(row => ({
      dayOfWeek: row.dayOfWeek,
      openTime: row.openTime + ':00',
      closeTime: row.closeTime + ':00',
      isClosed: row.isClosed,
    }));
    this.staffService.updateHours(payload).subscribe({
      next: () => {
        this.hoursSaving.set(false);
        this.toast.success('Opening hours saved ✅');
      },
      error: () => {
        this.hoursSaving.set(false);
        this.toast.error('Failed to save hours');
      },
    });
  }

  // ── Menu item availability

  toggleMenuSection(): void {
    const open = !this.menuSectionOpen();
    this.menuSectionOpen.set(open);
    if (open && this.menuCategories().length === 0) {
      this.loadMenuItems();
    }
  }

  private loadMenuItems(): void {
    const r = this.myRestaurant();
    if (!r) return;
    this.menuLoading.set(true);
    this.restaurantService.getMenu(r.hashId).subscribe({
      next: cats => {
        this.menuCategories.set(cats);
        this.menuLoading.set(false);
      },
      error: () => {
        this.menuLoading.set(false);
        this.toast.error('Failed to load menu items');
      },
    });
  }

  // ── Category CRUD

  openAddCategory(): void {
    this.newCatName = ''; this.newCatSort = this.menuCategories().length;
    this.catFormOpen.set(true);
  }

  saveCategory(): void {
    const name = this.newCatName.trim();
    if (!name) return;
    const payload: StaffCreateCategoryPayload = { name, sortOrder: this.newCatSort };
    this.staffService.createCategory(payload).subscribe({
      next: cat => {
        this.menuCategories.update(cs => [...cs, { ...cat, items: [] }]);
        this.catFormOpen.set(false);
        this.toast.success(`Category "${cat.name}" added`);
      },
      error: () => this.toast.error('Failed to add category'),
    });
  }

  deleteCategory(catId: number, catName: string): void {
    if (!confirm(`Delete "${catName}" and all its items? This cannot be undone.`)) return;
    this.staffService.deleteCategory(catId).subscribe({
      next: () => {
        this.menuCategories.update(cs => cs.filter(c => c.id !== catId));
        this.toast.success(`Category "${catName}" deleted`);
      },
      error: () => this.toast.error('Failed to delete category'),
    });
  }

  // ── Item CRUD

  openAddItem(catId: number): void {
    this.editingItemId.set(null);
    this.itemForm = this.blankItemForm(catId);
    this.itemFormCatId.set(catId);
  }

  openEditItem(item: MenuCategory['items'][0], catId: number): void {
    this.editingItemId.set(item.id);
    this.itemForm = {
      categoryId: item.categoryId,
      name: item.name,
      description: item.description ?? '',
      price: item.price,
      allergens: (item.allergens ?? []).join(', '),
      dietaryTags: (item.dietaryTags ?? []).join(', '),
      imageUrl: item.imageUrl ?? '',
      isAvailable: item.isAvailable,
    };
    this.itemFormCatId.set(catId);
  }

  closeItemForm(): void {
    this.itemFormCatId.set(null);
    this.editingItemId.set(null);
  }

  saveItem(): void {
    if (!this.itemForm.price || this.savingItem()) return;
    this.savingItem.set(true);
    const editId = this.editingItemId();
    if (editId) {
      const payload: StaffUpdateItemPayload = {
        categoryId: this.itemForm.categoryId ?? undefined,
        name: this.itemForm.name.trim(),
        description: this.itemForm.description || null,
        price: this.itemForm.price,
        allergens: this.splitCsv(this.itemForm.allergens),
        dietaryTags: this.splitCsv(this.itemForm.dietaryTags),
        imageUrl: this.itemForm.imageUrl || null,
        isAvailable: this.itemForm.isAvailable,
      };
      this.staffService.updateItem(editId, payload).subscribe({
        next: updated => {
          this.menuCategories.update(cs => cs.map(c => ({
            ...c, items: c.items.map(i => i.id === editId ? updated : i),
          })));
          this.toast.success(`"${updated.name}" updated`);
          this.closeItemForm(); this.savingItem.set(false);
        },
        error: () => { this.toast.error('Failed to update item'); this.savingItem.set(false); },
      });
    } else {
      const catId = this.itemForm.categoryId ?? this.itemFormCatId()!;
      const payload: StaffCreateItemPayload = {
        categoryId: catId,
        name: this.itemForm.name.trim(),
        description: this.itemForm.description || null,
        price: this.itemForm.price,
        allergens: this.splitCsv(this.itemForm.allergens),
        dietaryTags: this.splitCsv(this.itemForm.dietaryTags),
        imageUrl: this.itemForm.imageUrl || null,
      };
      this.staffService.createItem(payload).subscribe({
        next: created => {
          this.menuCategories.update(cs => cs.map(c =>
            c.id === catId ? { ...c, items: [...c.items, created] } : c
          ));
          this.toast.success(`"${created.name}" added`);
          this.closeItemForm(); this.savingItem.set(false);
        },
        error: () => { this.toast.error('Failed to add item'); this.savingItem.set(false); },
      });
    }
  }

  private blankItemForm(catId: number | null = null): StaffItemForm {
    return { categoryId: catId, name: '', description: '', price: null, allergens: '', dietaryTags: '', imageUrl: '', isAvailable: true };
  }

  private splitCsv(value: string): string[] | null {
    const parts = (value || '').split(',').map(s => s.trim()).filter(Boolean);
    return parts.length ? parts : null;
  }

  toggleItemAvailability(itemId: number): void {
    if (this.togglingItemId() !== null) return;
    this.togglingItemId.set(itemId);
    this.staffService.toggleItemAvailability(itemId).subscribe({
      next: (updated) => {
        this.menuCategories.update(cats =>
          cats.map(c => ({
            ...c,
            items: c.items.map(i => i.id === updated.id ? { ...i, isAvailable: updated.isAvailable } : i),
          }))
        );
        this.togglingItemId.set(null);
        this.toast.success(updated.isAvailable ? `${updated.name} — available ✅` : `${updated.name} — hidden 🚫`);
      },
      error: () => {
        this.togglingItemId.set(null);
        this.toast.error('Failed to update item');
      },
    });
  }

  deleteItem(itemId: number, itemName: string): void {
    if (!confirm(`Delete "${itemName}"? This cannot be undone.`)) return;
    if (this.deletingItemId() !== null) return;
    this.deletingItemId.set(itemId);
    this.staffService.deleteItem(itemId).subscribe({
      next: () => {
        this.menuCategories.update(cats =>
          cats.map(c => ({ ...c, items: c.items.filter(i => i.id !== itemId) }))
        );
        this.deletingItemId.set(null);
        this.toast.success(`"${itemName}" deleted`);
      },
      error: () => {
        this.deletingItemId.set(null);
        this.toast.error('Failed to delete item');
      },
    });
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
    this.orderService.accept(order.hashId, { estimatedMinutes: this.getEta(order.id) }).subscribe({
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
    this.orderService.reject(order.hashId, { reason }).subscribe({
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
    this.orderService.updateStatus(order.hashId, { status: next }).subscribe({
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

  /** Returns e.g. "Mark as Out For Delivery" for the advance button label. */
  nextStatusLabel(order: Order): string {
    const next = nextOrderStatus(order.status);
    if (!next) return '';
    const spaced = next.replace(/([A-Z])/g, ' $1').trim();
    return `Mark as ${spaced}`;
  }

  // ── Promotions

  togglePromotionsSection(): void {
    this.promotionsSectionOpen.update(v => !v);
    if (this.promotionsSectionOpen()) this.loadPromotions();
  }

  loadPromotions(): void {
    this.promotionsLoading.set(true);
    this.promotionService.getAll().subscribe({
      next: (data) => { this.promotions.set(data); this.promotionsLoading.set(false); },
      error: () => { this.promotionsLoading.set(false); this.toast.error('Failed to load promotions'); },
    });
  }

  createPromotion(): void {
    this.promotionSaving.set(true);
    const payload: CreateRestaurantPromotionRequest = {
      ...this.promoForm,
      startsAt: this.promoForm.startsAtStr ? new Date(this.promoForm.startsAtStr).toISOString() : new Date().toISOString(),
      endsAt: this.promoForm.endsAtStr ? new Date(this.promoForm.endsAtStr).toISOString() : new Date(Date.now() + 7 * 86400_000).toISOString(),
    };
    this.promotionService.create(payload).subscribe({
      next: (created) => {
        this.promotions.update(p => [created, ...p]);
        this.promotionSaving.set(false);
        this.toast.success('Promotion created');
        this.promoForm = { title: '', description: '', discountType: 'PercentageOff', discountValue: 10, appliesToCategoryId: null, isActive: true, startsAtStr: '', endsAtStr: '', startsAt: new Date().toISOString(), endsAt: new Date(Date.now() + 7 * 86400_000).toISOString() };
      },
      error: () => { this.promotionSaving.set(false); this.toast.error('Failed to create promotion'); },
    });
  }

  togglePromoActive(p: RestaurantPromotion): void {
    this.promotionService.update(p.id, { isActive: !p.isActive }).subscribe({
      next: (updated) => this.promotions.update(list => list.map(x => x.id === updated.id ? updated : x)),
      error: () => this.toast.error('Failed to update promotion'),
    });
  }

  deletePromotion(id: number): void {
    if (!confirm('Delete this promotion?')) return;
    this.promotionService.delete(id).subscribe({
      next: () => this.promotions.update(list => list.filter(p => p.id !== id)),
      error: () => this.toast.error('Failed to delete promotion'),
    });
  }
}

/** A single row in the hours edit form. */
export interface HoursFormRow {
  dayOfWeek: number;
  dayName: string;
  openTime: string;   // "HH:mm"
  closeTime: string;  // "HH:mm"
  isClosed: boolean;
}

/** Form shape for creating or editing a menu item. */
export interface StaffItemForm {
  categoryId: number | null;
  name: string;
  description: string;
  price: number | null;
  allergens: string;
  dietaryTags: string;
  imageUrl: string;
  isAvailable: boolean;
}
