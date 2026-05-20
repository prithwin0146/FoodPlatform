import { Injectable, OnDestroy } from '@angular/core';
import { Observable, Subject, switchMap, timer, takeUntil, share } from 'rxjs';
import { OrderService } from './order.service';
import { Order } from '../models';

/**
 * Manages order polling with RxJS timer — keeps polling logic out of UI components.
 * (SRP: extracted from OrderTracking component)
 * (OCP: swap to WebSocket by changing the observable inside poll() — no component changes)
 */
@Injectable()
export class OrderPollingService implements OnDestroy {
  private readonly _stop$ = new Subject<void>();

  constructor(private readonly orderService: OrderService) {}

  /**
   * Returns a shared observable that polls the given order every `intervalMs` milliseconds.
   * Unsubscribing stops polling.
   */
  poll(orderHash: string, intervalMs = 5_000): Observable<Order> {
    return timer(0, intervalMs).pipe(
      switchMap(() => this.orderService.get(orderHash)),
      takeUntil(this._stop$),
      share()
    );
  }

  ngOnDestroy(): void {
    this._stop$.next();
    this._stop$.complete();
  }
}
