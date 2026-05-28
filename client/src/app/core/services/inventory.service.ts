import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { InventoryItem, MenuImportResult } from '../models';

/**
 * Provides inventory read/write operations scoped to the current staff restaurant.
 * (SRP: inventory HTTP calls only — no menu CRUD, no orders)
 */
@Injectable({ providedIn: 'root' })
export class InventoryService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/restaurant/inventory`;

  getAll(): Observable<InventoryItem[]> {
    return this.http.get<InventoryItem[]>(this.base);
  }

  setStock(itemId: number, trackStock: boolean, stockCount: number | null): Observable<InventoryItem> {
    return this.http.put<InventoryItem>(`${this.base}/${itemId}`, { trackStock, stockCount });
  }
}
