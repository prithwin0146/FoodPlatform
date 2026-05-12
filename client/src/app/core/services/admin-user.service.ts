import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaginatedResult, User } from '../models';

/**
 * Thin HTTP wrapper for admin user queries.
 * (SRP: user listing only — auth lives in AuthService)
 * (DIP: components depend on this abstraction, not HttpClient directly)
 */
@Injectable({ providedIn: 'root' })
export class AdminUserService {
  private readonly url = `${environment.apiUrl}/admin/users`;

  constructor(private readonly http: HttpClient) {}

  allUsers(page = 1, pageSize = 50): Observable<PaginatedResult<User>> {
    return this.http.get<PaginatedResult<User>>(
      `${this.url}?page=${page}&pageSize=${pageSize}`
    );
  }
}
