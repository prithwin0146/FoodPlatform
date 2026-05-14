import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaginatedResult, Review } from '../models';

/**
 * Admin review moderation HTTP operations. (SRP: review admin concern only)
 */
@Injectable({ providedIn: 'root' })
export class AdminReviewService {
  private readonly url = `${environment.apiUrl}/admin/reviews`;

  constructor(private readonly http: HttpClient) {}

  all(page = 1, pageSize = 20): Observable<PaginatedResult<Review>> {
    return this.http.get<PaginatedResult<Review>>(`${this.url}?page=${page}&pageSize=${pageSize}`);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
