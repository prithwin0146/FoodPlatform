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

  get(hash: string): Observable<RestaurantDetail> {
    return this.http.get<RestaurantDetail>(`${this.url}/${hash}`);
  }

  getHours(hash: string): Observable<RestaurantHours[]> {
    return this.http.get<RestaurantHours[]>(`${this.url}/${hash}/hours`);
  }

  getMenu(hash: string): Observable<MenuCategory[]> {
    return this.http.get<MenuCategory[]>(`${this.url}/${hash}/menu`);
  }

  /**
   * Returns a fresh Angelcam HLS URL for the restaurant's live camera.
   * Cached on the backend for 50 min — safe to call on every page load.
   */
  getLiveStreamUrl(hash: string): Observable<{ hlsUrl: string }> {
    return this.http.get<{ hlsUrl: string }>(`${this.url}/${hash}/live-stream-url`);
  }
}
