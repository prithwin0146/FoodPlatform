import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RestaurantPromotion, CreateRestaurantPromotionRequest } from '../models';

/**
 * HTTP wrapper for restaurant-level promotions (staff management).
 * (SRP: promotions HTTP operations only)
 */
@Injectable({ providedIn: 'root' })
export class RestaurantPromotionService {
  private readonly url = `${environment.apiUrl}/restaurant/promotions`;

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<RestaurantPromotion[]> {
    return this.http.get<RestaurantPromotion[]>(this.url);
  }

  create(payload: CreateRestaurantPromotionRequest): Observable<RestaurantPromotion> {
    return this.http.post<RestaurantPromotion>(this.url, payload);
  }

  update(id: number, payload: Partial<CreateRestaurantPromotionRequest & { isActive: boolean }>): Observable<RestaurantPromotion> {
    return this.http.put<RestaurantPromotion>(`${this.url}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
