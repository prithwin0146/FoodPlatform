import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MenuCategory, Restaurant, RestaurantDetail, RestaurantHours } from '../models';

@Injectable({ providedIn: 'root' })
export class RestaurantService {
  private readonly url = `${environment.apiUrl}/restaurants`;

  constructor(private readonly http: HttpClient) {}

  list(postcode?: string): Observable<Restaurant[]> {
    const params: Record<string, string> = {};
    if (postcode) params['postcode'] = postcode;
    return this.http.get<Restaurant[]>(this.url, { params });
  }

  get(id: number): Observable<RestaurantDetail> {
    return this.http.get<RestaurantDetail>(`${this.url}/${id}`);
  }

  getHours(id: number): Observable<RestaurantHours[]> {
    return this.http.get<RestaurantHours[]>(`${this.url}/${id}/hours`);
  }

  getMenu(id: number): Observable<MenuCategory[]> {
    return this.http.get<MenuCategory[]>(`${this.url}/${id}/menu`);
  }
}
