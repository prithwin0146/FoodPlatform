import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, forkJoin } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface LocationSuggestion {
  id: string;
  text: string;
  place_name: string;
}

export interface PostcodeAutocompleteResponse {
  status: number;
  result: string[] | null;
}

export interface PlaceResult {
  code: string;
  name_1: string;
  local_type: string;
  outcode: string;
  region: string;
}

export interface PlacesResponse {
  status: number;
  result: PlaceResult[] | null;
}

@Injectable({
  providedIn: 'root'
})
export class PostcodeService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'https://api.postcodes.io';

  /**
   * Fetches combined suggestions (postcodes + places) for a given query.
   * @param query The partial postcode or city name string
   */
  autocomplete(query: string): Observable<LocationSuggestion[]> {
    const trimmed = query.trim();
    if (!trimmed) {
      return of([]);
    }
    
    const postcodes$ = this.http.get<PostcodeAutocompleteResponse>(`${this.baseUrl}/postcodes/${encodeURIComponent(trimmed)}/autocomplete`).pipe(
      map(res => res.result || []),
      map(postcodes => postcodes.map(p => ({
        id: p,
        text: p,
        place_name: 'UK Postcode'
      }))),
      catchError(() => of([]))
    );

    const places$ = this.http.get<PlacesResponse>(`${this.baseUrl}/places?q=${encodeURIComponent(trimmed)}`).pipe(
      map(res => res.result || []),
      map(places => places.map(p => ({
        id: p.code,
        text: p.name_1,
        place_name: `${p.local_type}, ${p.region} (${p.outcode})`
      }))),
      catchError(() => of([]))
    );

    return forkJoin([places$, postcodes$]).pipe(
      map(([places, postcodes]) => {
        // Return places first (if they searched a city name), then postcodes, and limit to 10 total results
        return [...places, ...postcodes].slice(0, 10);
      })
    );
  }
}

