import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Review, SubmitReviewRequest } from '../models';

/**
 * HTTP adapter for the reviews API.
 * (SRP: review HTTP operations only — no order, menu, or restaurant concerns)
 * (DIP: injected via Angular DI, never instantiated with new)
 */
@Injectable({ providedIn: 'root' })
export class ReviewService {
  private readonly base = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  submit(orderHash: string, req: SubmitReviewRequest): Observable<Review> {
    return this.http.post<Review>(`${this.base}/orders/${orderHash}/review`, req);
  }

  listForRestaurant(restaurantId: number): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.base}/restaurants/${restaurantId}/reviews`);
  }

  getMyReview(orderHash: string): Observable<Review> {
    return this.http.get<Review>(`${this.base}/orders/${orderHash}/review`);
  }
}
