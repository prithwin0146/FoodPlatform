import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Restaurant } from '../models';

/**
 * HTTP wrapper for the staff-facing restaurant endpoints.
 * (SRP: staff operations only — admin CRUD lives in AdminRestaurantService)
 */
@Injectable({ providedIn: 'root' })
export class RestaurantStaffService {
  private readonly url = `${environment.apiUrl}/restaurant`;

  constructor(private readonly http: HttpClient) {}

  /** Returns the authenticated staff member's own restaurant profile. */
  getMyRestaurant(): Observable<Restaurant> {
    return this.http.get<Restaurant>(`${this.url}/me`);
  }

  /**
   * Updates the kitchen video URL. Pass null or '' to clear.
   * Accepts YouTube embeds, Vimeo links, or direct MP4/WebM file URLs.
   */
  updateKitchenVideo(kitchenVideoUrl: string | null): Observable<Restaurant> {
    return this.http.patch<Restaurant>(`${this.url}/video`, { kitchenVideoUrl });
  }

  /** Toggles the restaurant open (isActive=true) or closed (isActive=false). */
  setActive(isActive: boolean): Observable<Restaurant> {
    return this.http.patch<Restaurant>(`${this.url}/active`, { isActive });
  }
}
