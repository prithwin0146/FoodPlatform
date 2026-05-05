import { Injectable, signal, computed } from '@angular/core';
import { CartItem, MenuItem } from '../models';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly _items = signal<CartItem[]>([]);
  private readonly _restaurantId = signal<number | null>(null);
  private readonly _restaurantName = signal<string>('');
  /** Increments on every addItem — header subscribes to trigger bounce animation. */
  private readonly _lastAdded = signal(0);

  readonly items = this._items.asReadonly();
  readonly restaurantId = this._restaurantId.asReadonly();
  readonly restaurantName = this._restaurantName.asReadonly();
  readonly lastAdded = this._lastAdded.asReadonly();
  readonly count = computed(() =>
    this._items().reduce((sum, i) => sum + i.quantity, 0)
  );
  readonly total = computed(() =>
    this._items().reduce((sum, i) => sum + i.menuItem.price * i.quantity, 0)
  );
  readonly isEmpty = computed(() => this._items().length === 0);

  addItem(item: MenuItem, restaurantId: number, restaurantName: string): void {
    // If switching restaurant, clear cart
    if (this._restaurantId() !== null && this._restaurantId() !== restaurantId) {
      this.clear();
    }
    this._restaurantId.set(restaurantId);
    this._restaurantName.set(restaurantName);
    this._lastAdded.update(n => n + 1);

    const current = this._items();
    const existing = current.find((c) => c.menuItem.id === item.id);
    if (existing) {
      this._items.set(
        current.map((c) =>
          c.menuItem.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
        )
      );
    } else {
      this._items.set([...current, { menuItem: item, quantity: 1 }]);
    }
  }

  removeItem(itemId: number): void {
    const current = this._items();
    const existing = current.find((c) => c.menuItem.id === itemId);
    if (!existing) return;

    if (existing.quantity === 1) {
      this._items.set(current.filter((c) => c.menuItem.id !== itemId));
    } else {
      this._items.set(
        current.map((c) =>
          c.menuItem.id === itemId ? { ...c, quantity: c.quantity - 1 } : c
        )
      );
    }

    if (this._items().length === 0) {
      this._restaurantId.set(null);
      this._restaurantName.set('');
    }
  }

  getQuantity(itemId: number): number {
    return this._items().find((c) => c.menuItem.id === itemId)?.quantity ?? 0;
  }

  clear(): void {
    this._items.set([]);
    this._restaurantId.set(null);
    this._restaurantName.set('');
  }
}
