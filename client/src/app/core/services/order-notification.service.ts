import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { OrderStatus } from '../models';

/**
 * Wraps the browser Notification API and provides status-specific messages.
 * (SRP: notification delivery only — no polling, no state management)
 * (DIP: injectable abstraction — swap to push-notification service without touching consumers)
 */
@Injectable({ providedIn: 'root' })
export class OrderNotificationService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  /** Must be called from a user-gesture context (e.g. page load after interaction). */
  async requestPermission(): Promise<void> {
    if (!this.isBrowser || !('Notification' in window)) return;
    if (Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }

  /**
   * Fires a browser notification for a status transition.
   * Falls back silently if permission was denied or API unavailable.
   */
  notify(restaurantName: string, newStatus: OrderStatus): void {
    if (!this.isBrowser || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    const { title, body, icon } = this.buildMessage(restaurantName, newStatus);
    try {
      const n = new Notification(title, {
        body,
        icon: icon ?? '/icons/icon-192x192.png',
        badge: '/icons/icon-192x192.png',
        tag: 'seetheprep-order',   // replaces previous notification rather than stacking
      });
      // Auto-close after 6 s
      setTimeout(() => n.close(), 6_000);
    } catch {
      // SSR / sandboxed — fail silently
    }
  }

  private buildMessage(restaurantName: string, status: OrderStatus): {
    title: string; body: string; icon?: string;
  } {
    switch (status) {
      case 'Accepted':
        return {
          title: '✅ Order accepted!',
          body: `${restaurantName} has accepted your order and will start preparing soon.`,
        };
      case 'Preparing':
        return {
          title: '🔪 Prep started',
          body: `The chefs at ${restaurantName} are now prepping your order.`,
        };
      case 'Cooking':
        return {
          title: '🍳 It\'s cooking!',
          body: `Your food is on the stove at ${restaurantName} — live stream is active.`,
        };
      case 'Packed':
        return {
          title: '📦 Order packed',
          body: `Your order from ${restaurantName} is packed and ready for collection.`,
        };
      case 'OutForDelivery':
        return {
          title: '🛵 On its way!',
          body: `Your order from ${restaurantName} is out for delivery. Stay close!`,
        };
      case 'Delivered':
        return {
          title: '🎉 Delivered!',
          body: `Your order from ${restaurantName} has arrived. Enjoy your meal!`,
        };
      case 'Rejected':
        return {
          title: '❌ Order rejected',
          body: `Unfortunately ${restaurantName} couldn't accept your order.`,
        };
      case 'Cancelled':
        return {
          title: '🚫 Order cancelled',
          body: `Your order from ${restaurantName} has been cancelled.`,
        };
      default:
        return {
          title: 'Order update',
          body: `Your order from ${restaurantName} has been updated.`,
        };
    }
  }
}
