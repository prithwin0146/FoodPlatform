import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Restaurant } from '../models';

/**
 * Manages the current customer's saved restaurants.
 * (SRP: favouriting HTTP calls + local state only)
 * (DIP: components depend on this service, not HttpClient directly)
 */
@Injectable({ providedIn: 'root' })
export class FavouritesService {
  private readonly url = `${environment.apiUrl}/user/favourites`;

  /** Set of raw restaurant IDs the customer has favourited (fast O(1) lookup). */
  readonly favouriteIds = signal<Set<number>>(new Set());

  constructor(private readonly http: HttpClient) {}

  /** Returns true if the restaurant is in the customer's favourites. */
  isFavourite(restaurantId: number): boolean {
    return this.favouriteIds().has(restaurantId);
  }

  /** Fetches all favourites and populates the local signal. Call once on app init or login. */
  loadFavourites(): Observable<Restaurant[]> {
    return this.http.get<Restaurant[]>(this.url).pipe(
      tap(list => this.favouriteIds.set(new Set(list.map(r => r.id))))
    );
  }

  /** Saves a restaurant as a favourite and updates local state. */
  add(hashId: string, restaurantId: number): Observable<unknown> {
    return this.http.post(`${this.url}/${hashId}`, {}).pipe(
      tap(() => this.favouriteIds.update(ids => new Set([...ids, restaurantId])))
    );
  }

  /** Removes a restaurant from favourites and updates local state. */
  remove(hashId: string, restaurantId: number): Observable<unknown> {
    return this.http.delete(`${this.url}/${hashId}`).pipe(
      tap(() => {
        this.favouriteIds.update(ids => {
          const next = new Set(ids);
          next.delete(restaurantId);
          return next;
        });
      })
    );
  }

  /** Toggles a restaurant's favourite status. */
  toggle(hashId: string, restaurantId: number): Observable<unknown> {
    return this.isFavourite(restaurantId)
      ? this.remove(hashId, restaurantId)
      : this.add(hashId, restaurantId);
  }

  getFavouritesList(): Observable<Restaurant[]> {
    return this.http.get<Restaurant[]>(this.url);
  }
}
