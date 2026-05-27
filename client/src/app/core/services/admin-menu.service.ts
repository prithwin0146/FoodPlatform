import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MenuCategory, MenuItem } from '../models';

export interface AdminCreateCategoryPayload { restaurantId: number; name: string; sortOrder: number; }
export interface AdminCreateItemPayload {
  restaurantId: number; categoryId: number; name: string;
  description?: string | null; price: number;
  allergens?: string[] | null; dietaryTags?: string[] | null; imageUrl?: string | null;
}
export interface AdminUpdateItemPayload {
  categoryId?: number; name?: string; description?: string | null; price?: number;
  allergens?: string[] | null; dietaryTags?: string[] | null; imageUrl?: string | null; isAvailable?: boolean;
}

/** Admin menu HTTP operations — cross-restaurant. (SRP: menu ops split from restaurant ops) */
@Injectable({ providedIn: 'root' })
export class AdminMenuService {
  private readonly base = `${environment.apiUrl}/admin/menu`;

  constructor(private readonly http: HttpClient) {}

  getMenu(restaurantHash: string): Observable<MenuCategory[]> {
    return this.http.get<MenuCategory[]>(`${this.base}/restaurants/${restaurantHash}`);
  }

  createCategory(payload: AdminCreateCategoryPayload): Observable<MenuCategory> {
    return this.http.post<MenuCategory>(`${this.base}/categories`, payload);
  }

  deleteCategory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/categories/${id}`);
  }

  createItem(payload: AdminCreateItemPayload): Observable<MenuItem> {
    return this.http.post<MenuItem>(`${this.base}/items`, payload);
  }

  updateItem(id: number, payload: AdminUpdateItemPayload): Observable<MenuItem> {
    return this.http.patch<MenuItem>(`${this.base}/items/${id}`, payload);
  }

  deleteItem(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/items/${id}`);
  }
}
