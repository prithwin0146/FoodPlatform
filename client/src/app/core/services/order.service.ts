import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AcceptOrderRequest,
  DisputeRequest,
  Order,
  PlaceOrderRequest,
  RejectOrderRequest,
  UpdateStatusRequest,
} from '../models';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly url = `${environment.apiUrl}/orders`;

  constructor(private readonly http: HttpClient) {}

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
}
