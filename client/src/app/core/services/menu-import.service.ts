import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MenuImportResult } from '../models';

/**
 * Sends a CSV file to the backend bulk-import endpoint.
 * (SRP: file upload only — parsing/persistence is backend-only)
 */
@Injectable({ providedIn: 'root' })
export class MenuImportService {
  private readonly http = inject(HttpClient);

  importForCurrentRestaurant(file: File): Observable<MenuImportResult> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<MenuImportResult>(`${environment.apiUrl}/restaurant/menu/import`, form);
  }

  importForRestaurant(restaurantId: number, file: File): Observable<MenuImportResult> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<MenuImportResult>(`${environment.apiUrl}/admin/menu/import/${restaurantId}`, form);
  }
}
