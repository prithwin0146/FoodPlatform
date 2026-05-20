import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SILENT_ERROR_HEADER } from '../auth/error.interceptor';
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
    const headers = new HttpHeaders({ [SILENT_ERROR_HEADER]: '1' });
    this.http.get<Order[]>(`${this.url}/my`, { headers }).subscribe({
      next: orders => this.activeOrderCount.set(orders.filter(o => ACTIVE_STATUSES.has(o.status)).length),
      error: () => { /* silently ignore — badge stays at 0 */ },
    });
  }

  place(req: PlaceOrderRequest): Observable<Order> {
    return this.http.post<Order>(this.url, req);
  }

  get(hash: string): Observable<Order> {
    return this.http.get<Order>(`${this.url}/${hash}`);
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

  accept(hash: string, req: AcceptOrderRequest): Observable<any> {
    return this.http.patch(`${this.url}/${hash}/accept`, req);
  }

  reject(hash: string, req: RejectOrderRequest): Observable<any> {
    return this.http.patch(`${this.url}/${hash}/reject`, req);
  }

  updateStatus(hash: string, req: UpdateStatusRequest): Observable<any> {
    return this.http.patch(`${this.url}/${hash}/status`, req);
  }

  cancel(hash: string): Observable<any> {
    return this.http.post(`${this.url}/${hash}/cancel`, {});
  }

  dispute(hash: string, req: DisputeRequest): Observable<any> {
    return this.http.post(`${this.url}/${hash}/dispute`, req);
  }

  reorder(hash: string, idempotencyKey: string): Observable<Order> {
    return this.http.post<Order>(`${this.url}/${hash}/reorder`, { idempotencyKey });
  }

  /**
   * Fetches a fresh Angelcam HLS URL for the order's restaurant camera.
   * The token embedded in the URL is short-lived — call this each time the page loads.
   */
  getLiveStreamUrl(orderHash: string): Observable<{ hlsUrl: string }> {
    return this.http.get<{ hlsUrl: string }>(`${this.url}/${orderHash}/live-stream-url`);
  }
}
