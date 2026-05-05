import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Restaurant } from '../models';

export interface CreateRestaurantPayload {
  name: string;
  address: string;
  basePostcode: string;
  deliveryRadiusMiles: number;
  hygieneRating: number;
  imageUrl?: string | null;
}

export interface UpdateRestaurantPayload {
  name?: string;
  address?: string;
  basePostcode?: string;
  deliveryRadiusMiles?: number;
  hygieneRating?: number;
  imageUrl?: string | null;
}

/**
 * Admin restaurant HTTP operations. (SRP: split from AdminOrderService)
 */
@Injectable({ providedIn: 'root' })
export class AdminRestaurantService {
  private readonly url = `${environment.apiUrl}/admin/restaurants`;

  constructor(private readonly http: HttpClient) {}

  allRestaurants(): Observable<Restaurant[]> {
    return this.http.get<Restaurant[]>(this.url);
  }

  create(payload: CreateRestaurantPayload): Observable<Restaurant> {
    return this.http.post<Restaurant>(this.url, payload);
  }

  update(id: number, payload: UpdateRestaurantPayload): Observable<Restaurant> {
    return this.http.patch<Restaurant>(`${this.url}/${id}`, payload);
  }

  toggleActive(id: number): Observable<unknown> {
    return this.http.patch(`${this.url}/${id}/activate`, {});
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}

