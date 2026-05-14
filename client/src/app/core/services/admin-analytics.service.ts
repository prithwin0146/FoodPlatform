import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaginatedResult, Review } from '../models';

/** Platform analytics snapshot. */
export interface AnalyticsDto {
  totalOrders: number;
  activeRestaurants: number;
  totalRevenue: number;
  avgOrderValue: number;
  ordersByStatus: Record<string, number>;
  topRestaurantsByRevenue: TopRestaurantDto[];
}

export interface TopRestaurantDto {
  id: number;
  name: string;
  revenue: number;
  orderCount: number;
}

/**
 * Admin analytics HTTP operations. (SRP: analytics concern only)
 * (DIP: components depend on this service, not HttpClient directly)
 */
@Injectable({ providedIn: 'root' })
export class AdminAnalyticsService {
  private readonly url = `${environment.apiUrl}/admin/analytics`;

  constructor(private readonly http: HttpClient) {}

  get(): Observable<AnalyticsDto> {
    return this.http.get<AnalyticsDto>(this.url);
  }
}
