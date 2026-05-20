import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MenuCategory, Restaurant, RestaurantDetail, RestaurantHours } from '../models';
import { SILENT_ERROR_HEADER } from '../auth/error.interceptor';

@Injectable({ providedIn: 'root' })
export class RestaurantService {
  private readonly url = `${environment.apiUrl}/restaurants`;

  constructor(private readonly http: HttpClient) {}

  /** Public listing — uses silent header so retry logic handles transient errors without toast spam. */
  list(postcode?: string): Observable<Restaurant[]> {
    const params: Record<string, string> = {};
    if (postcode) params['postcode'] = postcode;
    return this.http.get<Restaurant[]>(this.url, {
      params,
      headers: { [SILENT_ERROR_HEADER]: '1' },
    });
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

  /**
   * Returns a fresh Angelcam HLS URL for the restaurant's live camera.
   * Cached on the backend for 90 min — safe to call on every page load.
   */
  getLiveStreamUrl(id: number): Observable<{ hlsUrl: string }> {
    return this.http.get<{ hlsUrl: string }>(`${this.url}/${id}/live-stream-url`);
  }
}
