import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { MenuCategory, Restaurant, RestaurantDetail, RestaurantHours } from '../models';
import { SILENT_ERROR_HEADER } from '../auth/error.interceptor';

/**
 * Public restaurant HTTP operations.
 * (SRP: HTTP + 5-minute in-memory cache for the restaurant list only)
 * (OCP: cache invalidation is triggered externally via invalidateListCache() —
 *  no change needed here when new mutation services are added)
 */
@Injectable({ providedIn: 'root' })
export class RestaurantService {
  private readonly url = `${environment.apiUrl}/restaurants`;

  /** In-memory cache for the restaurant list — keyed by postcode (or '' for no filter). */
  private listCache = new Map<string, { data: Restaurant[]; timestamp: number }>();
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  constructor(private readonly http: HttpClient) {}

  /** Public listing with 5-minute cache. Bypass: call invalidateListCache() before. */
  list(postcode?: string): Observable<Restaurant[]> {
    const key = postcode ?? '';
    const cached = this.listCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      return of(cached.data);
    }
    const params: Record<string, string> = {};
    if (postcode) params['postcode'] = postcode;
    return this.http.get<Restaurant[]>(this.url, {
      params,
      headers: { [SILENT_ERROR_HEADER]: '1' },
    }).pipe(
      tap(data => this.listCache.set(key, { data, timestamp: Date.now() }))
    );
  }

  /** Call after any restaurant create/update/delete to force a fresh fetch. */
  invalidateListCache(): void {
    this.listCache.clear();
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
