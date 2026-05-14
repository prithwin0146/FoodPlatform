import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AcceptOrderRequest,
  DisputeRequest,
  Order,
  PaginatedResult,
  PlaceOrderRequest,
  RejectOrderRequest,
  UpdateStatusRequest,
} from '../models';

/** Active statuses — orders the customer still cares about in real-time. */
const ACTIVE_STATUSES = new Set(['Pending', 'Accepted', 'Preparing', 'Cooking', 'Packed', 'OutForDelivery']);

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly url = `${environment.apiUrl}/orders`;

  /** Live count of the customer's in-progress orders; updated by loadActiveCount(). */
  readonly activeOrderCount = signal(0);

  constructor(private readonly http: HttpClient) {}

  /**
   * Fetches the customer's first-page orders and counts active ones.
   * Called by the Header when a Customer session is present.
   */
  loadActiveCount(): void {
    this.listMyOrders().subscribe({
      next: orders => this.activeOrderCount.set(orders.filter(o => ACTIVE_STATUSES.has(o.status)).length),
      error: () => { /* silently ignore — badge stays at 0 */ },
    });
  }

  place(req: PlaceOrderRequest): Observable<Order> {
    return this.http.post<Order>(this.url, req);
  }

  get(id: number): Observable<Order> {
    return this.http.get<Order>(`${this.url}/${id}`);
  }

  listForRestaurant(status?: string): Observable<Order[]> {
    const params: Record<string, string> = {};
    if (status) params['status'] = status;
    return this.http.get<Order[]>(this.url, { params });
  }

  listMyOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.url}/my`);
  }

  listMyOrdersPaged(page = 1, pageSize = 10): Observable<PaginatedResult<Order>> {
    return this.http.get<PaginatedResult<Order>>(`${this.url}/my?page=${page}&pageSize=${pageSize}`);
  }

  accept(id: number, req: AcceptOrderRequest): Observable<any> {
    return this.http.patch(`${this.url}/${id}/accept`, req);
  }

  reject(id: number, req: RejectOrderRequest): Observable<any> {
    return this.http.patch(`${this.url}/${id}/reject`, req);
  }

  updateStatus(id: number, req: UpdateStatusRequest): Observable<any> {
    return this.http.patch(`${this.url}/${id}/status`, req);
  }

  cancel(id: number): Observable<any> {
    return this.http.post(`${this.url}/${id}/cancel`, {});
  }

  dispute(id: number, req: DisputeRequest): Observable<any> {
    return this.http.post(`${this.url}/${id}/dispute`, req);
  }

  reorder(id: number, idempotencyKey: string): Observable<Order> {
    return this.http.post<Order>(`${this.url}/${id}/reorder`, { idempotencyKey });
  }
}
