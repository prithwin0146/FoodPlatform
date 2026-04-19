import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Order, Restaurant } from '../models';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly url = `${environment.apiUrl}/admin`;

  constructor(private readonly http: HttpClient) {}

  allOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.url}/orders`);
  }

  disputedOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.url}/orders/disputed`);
  }

  refund(orderId: number): Observable<any> {
    return this.http.post(`${this.url}/orders/${orderId}/refund`, {});
  }

  allRestaurants(): Observable<Restaurant[]> {
    return this.http.get<Restaurant[]>(`${this.url}/restaurants`);
  }

  toggleActive(id: number): Observable<any> {
    return this.http.patch(`${this.url}/restaurants/${id}/activate`, {});
  }
}
