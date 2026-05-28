import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
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

  allOrders(page = 1, pageSize = 50, status?: string, search?: string): Observable<PaginatedResult<Order>> {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (status) params = params.set('status', status);
    if (search?.trim()) params = params.set('search', search.trim());
    return this.http.get<PaginatedResult<Order>>(this.url, { params });
  }

  disputedOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.url}/disputed`);
  }

  refund(hash: string): Observable<unknown> {
    return this.http.post(`${this.url}/${hash}/refund`, {});
  }

  resolve(hash: string): Observable<unknown> {
    return this.http.patch(`${this.url}/${hash}/resolve`, {});
  }
}
