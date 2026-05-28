import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MenuCategory, MenuItem, Restaurant, RestaurantHours } from '../models';

export interface StaffCreateCategoryPayload { name: string; sortOrder: number; }
export interface StaffCreateItemPayload {
  categoryId: number; name: string;
  description?: string | null; price: number;
  allergens?: string[] | null; dietaryTags?: string[] | null; imageUrl?: string | null;
}
export interface StaffUpdateItemPayload {
  categoryId?: number; name?: string; description?: string | null; price?: number;
  allergens?: string[] | null; dietaryTags?: string[] | null; imageUrl?: string | null; isAvailable?: boolean;
}

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

  /**
   * Sets or clears the Mux live stream playback ID.
   * Pass the playback ID string from Mux dashboard to go live.
   * Pass null or '' to stop streaming.
   */
  updateLiveStream(playbackId: string | null): Observable<Restaurant> {
    return this.http.patch<Restaurant>(`${this.url}/live-stream`, { playbackId });
  }

  /** Replaces the weekly opening hours schedule. Send all 7 days (0=Sun … 6=Sat). */
  updateHours(hours: RestaurantHours[]): Observable<RestaurantHours[]> {
    return this.http.patch<RestaurantHours[]>(`${this.url}/hours`, { hours });
  }

  /** Toggles item availability for the authenticated staff member's restaurant. */
  toggleItemAvailability(itemId: number): Observable<MenuItem> {
    return this.http.patch<MenuItem>(`${environment.apiUrl}/menu/items/${itemId}/availability`, {});
  }

  /** Soft-deletes a menu item — it will no longer appear in menus or new orders. */
  deleteItem(itemId: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/menu/items/${itemId}`);
  }

  // ── Menu CRUD ────────────────────────────────────────────────────────────

  /** Creates a new category for the authenticated staff member's restaurant. */
  createCategory(payload: StaffCreateCategoryPayload): Observable<MenuCategory> {
    return this.http.post<MenuCategory>(`${environment.apiUrl}/menu/categories`, payload);
  }

  /** Deletes a category (and all its items) for the staff member's restaurant. */
  deleteCategory(categoryId: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/menu/categories/${categoryId}`);
  }

  /** Creates a new menu item for the staff member's restaurant. */
  createItem(payload: StaffCreateItemPayload): Observable<MenuItem> {
    return this.http.post<MenuItem>(`${environment.apiUrl}/menu/items`, payload);
  }

  /** Updates an existing menu item. */
  updateItem(itemId: number, payload: StaffUpdateItemPayload): Observable<MenuItem> {
    return this.http.patch<MenuItem>(`${environment.apiUrl}/menu/items/${itemId}`, payload);
  }
}
