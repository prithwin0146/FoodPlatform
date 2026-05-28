import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Restaurant } from '../models';
import { RestaurantService } from './restaurant.service';

export interface CreateRestaurantPayload {
  name: string;
  address: string;
  basePostcode: string;
  deliveryRadiusMiles: number;
  hygieneRating: number;
  imageUrl?: string | null;
  kitchenVideoUrl?: string | null;
  cuisineType?: string;
  estimatedDeliveryMinutes?: number;
  phone?: string | null;
  supportsCollection?: boolean;
  staffName: string;
  staffEmail: string;
  staffPassword: string;
}

export interface CreateRestaurantResponse {
  restaurant: Restaurant;
  staffUserId: number;
  staffEmail: string;
  staffName: string;
}

export interface UpdateRestaurantPayload {
  name?: string;
  address?: string;
  basePostcode?: string;
  deliveryRadiusMiles?: number;
  hygieneRating?: number;
  imageUrl?: string | null;
  kitchenVideoUrl?: string | null;
  cuisineType?: string;
  estimatedDeliveryMinutes?: number;
  phone?: string | null;
  supportsCollection?: boolean;
}

/**
 * Admin restaurant HTTP operations. (SRP: split from AdminOrderService)
 */
@Injectable({ providedIn: 'root' })
export class AdminRestaurantService {
  private readonly url = `${environment.apiUrl}/admin/restaurants`;

  constructor(
    private readonly http: HttpClient,
    private readonly restaurantService: RestaurantService,
  ) {}

  allRestaurants(): Observable<Restaurant[]> {
    return this.http.get<Restaurant[]>(this.url);
  }

  create(payload: CreateRestaurantPayload): Observable<CreateRestaurantResponse> {
    return this.http.post<CreateRestaurantResponse>(this.url, payload).pipe(
      tap(() => this.restaurantService.invalidateListCache())
    );
  }

  update(hash: string, payload: UpdateRestaurantPayload): Observable<Restaurant> {
    return this.http.patch<Restaurant>(`${this.url}/${hash}`, payload).pipe(
      tap(() => this.restaurantService.invalidateListCache())
    );
  }

  toggleActive(hash: string): Observable<unknown> {
    return this.http.patch(`${this.url}/${hash}/activate`, {}).pipe(
      tap(() => this.restaurantService.invalidateListCache())
    );
  }

  delete(hash: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${hash}`).pipe(
      tap(() => this.restaurantService.invalidateListCache())
    );
  }
}

