import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Order, PaginatedResult } from '../models';

/**
 * Admin order HTTP operations. (SRP: split from AdminRestaurantService)
 */
@Injectable({ providedIn: 'root' })
export class AdminOrderService {
  private readonly url = `${environment.apiUrl}/admin/orders`;

  constructor(private readonly http: HttpClient) {}

  allOrders(page = 1, pageSize = 50): Observable<PaginatedResult<Order>> {
    return this.http.get<PaginatedResult<Order>>(`${this.url}?page=${page}&pageSize=${pageSize}`);
  }

  disputedOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.url}/disputed`);
  }

  refund(orderId: number): Observable<unknown> {
    return this.http.post(`${this.url}/${orderId}/refund`, {});
  }

  resolve(orderId: number): Observable<unknown> {
    return this.http.patch(`${this.url}/${orderId}/resolve`, {});
  }
}
